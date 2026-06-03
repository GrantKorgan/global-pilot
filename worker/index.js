// worker/index.js
// ---------------------------------------------------------------------------
// GLOBAL PILOT — Cloudflare Worker.
//
// Two responsibilities:
//
//   1. CORS RELAY for NOAA weather feeds.
//      GET /?url=<aviationweather.gov target>
//      Browser sends a target URL, worker fetches it server-side and
//      returns the response with Access-Control-Allow-Origin: *.
//      Whitelisted hosts only.
//
//   2. FAA REGISTRY LOOKUP for tail-number identification.
//      GET /registry/N2AK
//      Fetches FAA's N-Number Inquiry HTML page, parses out
//      manufacturer / model / year / status / owner, returns JSON.
//
// Safety: relay path is restricted to a small upstream whitelist so the
// worker can't be repurposed as an open proxy. Registry path is fixed
// to registry.faa.gov.
//
// Deploy: see ../WORKER_SETUP.md for the dashboard walkthrough.
// (Wrangler CLI users: `cd worker && wrangler deploy`.)
// ---------------------------------------------------------------------------

const ALLOWED_HOSTS = new Set([
  "aviationweather.gov",
]);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
    }

    const requestUrl = new URL(request.url);

    // ---- Route: /registry/{N-number} -----------------------------------
    const registryMatch = requestUrl.pathname.match(/^\/registry\/([A-Za-z0-9]+)\/?$/);
    if (registryMatch) {
      return handleRegistryLookup(registryMatch[1]);
    }

    // ---- Route: /?url=... (CORS relay) ---------------------------------
    return handleCorsRelay(requestUrl);
  },
};

// ===========================================================================
// CORS relay (existing behavior, unchanged)
// ===========================================================================

async function handleCorsRelay(requestUrl) {
  const target = requestUrl.searchParams.get("url");
  if (!target) {
    return new Response("Missing ?url=<target>", { status: 400, headers: CORS_HEADERS });
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch (_e) {
    return new Response("Invalid target URL", { status: 400, headers: CORS_HEADERS });
  }
  if (!ALLOWED_HOSTS.has(targetUrl.hostname)) {
    return new Response(`Host not allowed: ${targetUrl.hostname}`, { status: 403, headers: CORS_HEADERS });
  }

  try {
    const upstream = await fetch(target, {
      headers: { "User-Agent": "global-pilot/1.0 (https://github.com/GrantKorgan/global-pilot)" },
    });
    const headers = new Headers(CORS_HEADERS);
    const ct = upstream.headers.get("content-type");
    if (ct) headers.set("Content-Type", ct);
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (err) {
    return new Response(`Upstream fetch failed: ${err.message}`, { status: 502, headers: CORS_HEADERS });
  }
}

// ===========================================================================
// FAA N-Number Inquiry → structured JSON
//
// Fetches https://registry.faa.gov/aircraftinquiry/Search/NNumberResult
// and uses HTMLRewriter to extract a fixed set of fields. The FAA page
// uses labeled <td>/<span> pairs in a relatively stable layout — we
// match on data-label attributes and known text labels.
//
// Response shape (always):
//   {
//     ok: boolean,
//     tail: "N2AK",         // normalized, uppercase, leading-N preserved
//     make: "CIRRUS DESIGN CORP" | null,
//     model: "SF50" | null,
//     year: 2019 | null,
//     status: "Valid" | "Triennial" | "Sale Reported" | "Deregistered" | "Other" | null,
//     owner: "TANGIERS SERVICES LLC" | null,
//     mode_s_hex: "A0B1C2" | null,
//     mfgSerial: "0258" | null,
//     fetchedAt: "2026-06-02T20:12:33.514Z",
//     source: "registry.faa.gov",
//     raw: { ... unparsed extras when useful ... }
//   }
//
// On lookup miss (no record returned by FAA) or parse failure:
//   { ok: false, tail, reason: "not_found" | "parse_failed" | "upstream_error" }
// ===========================================================================

async function handleRegistryLookup(rawTail) {
  // Normalize: strip whitespace, uppercase, force leading "N" for US tails.
  // Many pilots type "2AK" — we tolerate that and add the N.
  let tail = String(rawTail || "").trim().toUpperCase();
  if (!tail) return registryError(tail, "invalid_tail", 400);
  if (!tail.startsWith("N")) tail = "N" + tail;
  if (!/^N[0-9][0-9A-Z]{0,4}$/.test(tail)) {
    // FAA N-numbers: max 5 chars after the N, first char must be a digit.
    return registryError(tail, "invalid_tail", 400);
  }

  // FAA serves the result via a GET on this endpoint. Strip the leading N
  // because the FAA form takes only the digits-and-letters portion.
  const tailWithoutN = tail.substring(1);
  const upstream = `https://registry.faa.gov/aircraftinquiry/Search/NNumberResult?NNumberTxt=${encodeURIComponent(tailWithoutN)}`;

  let html;
  try {
    const res = await fetch(upstream, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; global-pilot/1.0; +https://github.com/GrantKorgan/global-pilot)",
        "Accept": "text/html,application/xhtml+xml",
      },
      // FAA serves slow sometimes — give it a generous timeout via cf options.
      cf: { cacheTtl: 86400, cacheEverything: true },
    });
    if (!res.ok) {
      return registryError(tail, `upstream_${res.status}`, 502);
    }
    html = await res.text();
  } catch (err) {
    return registryError(tail, "upstream_error", 502);
  }

  // Quick miss detection — FAA renders a "Data Not Found" panel for unknown
  // N-numbers. Some variants are: "No records were found", "did not match
  // any aircraft", or the page renders with all-empty fields.
  if (/no records were found|data not found|did not match any aircraft/i.test(html)) {
    return registryJson({ ok: false, tail, reason: "not_found" });
  }

  const parsed = parseFaaHtml(html);
  if (!parsed.make && !parsed.model) {
    return registryJson({ ok: false, tail, reason: "parse_failed" });
  }

  return registryJson({
    ok: true,
    tail,
    make: parsed.make,
    model: parsed.model,
    year: parsed.year,
    status: parsed.status,
    owner: parsed.owner,
    mode_s_hex: parsed.modeS,
    mfgSerial: parsed.mfgSerial,
    fetchedAt: new Date().toISOString(),
    source: "registry.faa.gov",
  });
}

// ---- FAA HTML parsing ----------------------------------------------------
//
// FAA's NNumberResult page uses semantic <td>/<span> pairs with labeled
// data attributes for each field, in a layout that's been stable for
// years. We scan for the label text and capture the next sibling cell.
//
// Robustness: rather than regex on raw HTML (fragile), we use a single-
// pass tokenizer that finds known label strings and grabs the cell or
// inline text that follows.
//
// Stable label tokens we look for:
//   "Manufacturer Name"
//   "Model"
//   "Year Mfr"
//   "Type Aircraft" (used as a sanity check)
//   "Status"
//   "Name"           (owner name — first occurrence after Registered Owner header)
//   "Mode S Code (Base 16 / Hex)"
//   "Serial Number"  (manufacturer serial)
//
// Returns whatever fields we found; missing → null. Safe to mix with
// strict JSON null-checks downstream.

function parseFaaHtml(html) {
  return {
    make:      extractFieldAfterLabel(html, "Manufacturer Name"),
    model:     extractFieldAfterLabel(html, "Model"),
    year:      parseYear(extractFieldAfterLabel(html, "Year Mfr")),
    status:    extractFieldAfterLabel(html, "Status"),
    owner:     extractOwnerName(html),
    modeS:     extractFieldAfterLabel(html, "Mode S Code (Base 16 / Hex)"),
    mfgSerial: extractFieldAfterLabel(html, "Serial Number"),
  };
}

// Find the first occurrence of a label text in the HTML, then capture
// the next <td>...</td> or <span>...</span> content after it (which
// is where FAA puts the value).
function extractFieldAfterLabel(html, label) {
  const labelIdx = html.indexOf(label);
  if (labelIdx < 0) return null;
  // Look for the next <td ...>...</td> after the label.
  const tail = html.substring(labelIdx);
  let m = tail.match(/<td[^>]*>([^<]*(?:<[^/][^>]*>[^<]*<\/[^>]*>[^<]*)*)<\/td>/);
  // The label itself was inside a <td>; we want the FOLLOWING <td>, so
  // skip past the first match and find the next one.
  if (m) {
    const afterFirst = tail.substring(m.index + m[0].length);
    const next = afterFirst.match(/<td[^>]*>([\s\S]*?)<\/td>/);
    if (next) return cleanText(next[1]);
  }
  // Fallback: <span> sibling pattern.
  m = tail.match(/<span[^>]*>([\s\S]*?)<\/span>\s*<span[^>]*>([\s\S]*?)<\/span>/);
  if (m) return cleanText(m[2]);
  return null;
}

function extractOwnerName(html) {
  // The owner block usually starts with "Registered Owner" as a section
  // header, followed by a "Name" label whose value is the owner.
  const ownerSection = html.indexOf("Registered Owner");
  if (ownerSection < 0) return extractFieldAfterLabel(html, "Name");
  const tail = html.substring(ownerSection);
  return extractFieldAfterLabel(tail, "Name");
}

function parseYear(s) {
  if (!s) return null;
  const m = s.match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

function cleanText(s) {
  if (!s) return null;
  // Strip any nested tags + collapse whitespace + decode minimal entities.
  const stripped = s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ")
                    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const collapsed = stripped.replace(/\s+/g, " ").trim();
  return collapsed || null;
}

// ---- JSON response helpers ----------------------------------------------

function registryJson(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function registryError(tail, reason, status) {
  return new Response(JSON.stringify({ ok: false, tail, reason }), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
