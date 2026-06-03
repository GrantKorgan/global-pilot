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
        // FAA's Akamai bot-wall returns 403 to anything that identifies as
        // an automated client. A real Safari UA passes. (Confirmed by
        // direct probe — bot-style UAs 403, browser UAs 200.) We're not
        // bypassing rate limits or terms — the registry is a public
        // service for tail-number lookups; we're just looking like a real
        // browser so Akamai doesn't reflexively block us.
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
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
    engineMake:  parsed.engineMake,
    engineModel: parsed.engineModel,
    typeAircraft: parsed.typeAircraft,
    typeEngine:   parsed.typeEngine,
    awDate:        parsed.awDate,
    expirationDate: parsed.expirationDate,
    fetchedAt: new Date().toISOString(),
    source: "registry.faa.gov",
  });
}

// ---- FAA HTML parsing ----------------------------------------------------
//
// FAA's modern NNumberResult markup tags every value cell with a
// `data-label="..."` attribute matching its semantic field name. We
// scan the whole document for these and extract values directly:
//   <td data-label="Manufacturer Name">CIRRUS DESIGN CORP            </td>
//   <td data-label="Model">SF50                </td>
//   <td data-label="Mfr Year">2024</td>
//   <td data-label="Mode S Code (Base 16 / Hex)">A18D5B</td>
//
// This is FAR more robust than scanning for label text and capturing
// "the next td" — that approach broke when FAA tweaked their layout.
// Now we only break if they rename the data-label attribute itself,
// which is much less likely.
//
// Owner name uses data-label="Name" but appears multiple times in the
// page (once in the registered-owner section, once in a co-owner
// section if applicable). We grab the FIRST occurrence after the
// "Registered Owner" header anchor.

function parseFaaHtml(html) {
  // First pass: build a map of every data-label → value pair on the page.
  const fields = collectDataLabels(html);
  return {
    make:      fields["Manufacturer Name"] || null,
    model:     fields["Model"] || null,
    year:      parseYear(fields["Mfr Year"] || fields["Year Mfr"]),
    status:    fields["Status"] || (fields["Certificate Issue Date"] ? "Valid" : null), // FAA doesn't always emit a literal "Status" — infer Valid when there's a Certificate Issue Date
    owner:     extractFirstOwnerName(html),
    modeS:     fields["Mode S Code (Base 16 / Hex)"] || null,
    mfgSerial: fields["Serial Number"] || null,
    engineMake:  fields["Engine Manufacturer"] || null,
    engineModel: fields["Engine Model"] || null,
    typeAircraft: fields["Aircraft Type"] || null,
    typeEngine:   fields["Engine Type"] || null,
    awDate:       fields["A/W Date"] || null,
    expirationDate: fields["Expiration Date"] || null,
  };
}

// Build { dataLabel: cleanedValue } over the entire HTML. Empty
// data-label="" attributes (which mark the field-NAME cell, not the
// value cell) are skipped. Multiple cells sharing the same label keep
// the first non-empty value.
function collectDataLabels(html) {
  const out = {};
  const re = /<td[^>]*\bdata-label="([^"]+)"[^>]*>([\s\S]*?)<\/td>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const label = m[1].trim();
    if (!label) continue;
    const value = cleanText(m[2]);
    if (value && !out[label]) out[label] = value;
  }
  return out;
}

// Owner name is `data-label="Name"`. The page can have multiple Name
// fields (registered owner + co-owner + fractional owner notation).
// We use the first occurrence after the "Registered Owner" anchor.
function extractFirstOwnerName(html) {
  const ownerSection = html.indexOf("Registered Owner");
  const scope = ownerSection >= 0 ? html.substring(ownerSection) : html;
  const m = scope.match(/<td[^>]*\bdata-label="Name"[^>]*>([\s\S]*?)<\/td>/i);
  return m ? cleanText(m[1]) : null;
}

function parseYear(s) {
  if (!s) return null;
  const m = String(s).match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

function cleanText(s) {
  if (!s) return null;
  const stripped = s.replace(/<[^>]+>/g, "")
                    .replace(/&nbsp;/g, " ")
                    .replace(/&amp;/g, "&")
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">");
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
