// src/wx/wiki.js
// ---------------------------------------------------------------------------
// LAZY AIRCRAFT PROFILE ENRICHMENT via Wikipedia.
//
// When a pilot selects an aircraft for the first time, the app calls
// `fetchAircraftProfile(catalogEntry)`. We hit two MediaWiki endpoints:
//
//   1. REST summary  /api/rest_v1/page/summary/{title}
//      Returns a short plain-text "extract" we use as the prose summary.
//      Handles redirects automatically (e.g., "Daher TBM 960" → "Daher TBM 900").
//
//   2. Action API   /w/api.php?action=parse&prop=wikitext
//      Returns the article's raw wikitext. We scan for the
//      {{Infobox aircraft type}} block and parse it field-by-field.
//
// CORS: MediaWiki accepts anonymous CORS requests when `origin=*` is
// passed. No proxy needed — works directly from the browser.
//
// FAILURE MODES:
//   - Wikipedia returns 404 / "no article": we cache a profile with
//     `source: "wikipedia-miss"` so we don't re-fetch on every reload.
//   - Infobox missing or malformed: we still cache whatever the prose
//     summary gave us (`source: "wikipedia-summary-only"`).
//   - Network error: we don't cache. Next select retries.
//
// PARSER PHILOSOPHY:
//   Wikipedia infoboxes are tagged consistently (`mtow main`, `cruise speed
//   main`, `service ceiling`, etc.) but values are wildly inconsistent
//   ("311 KTAS", "{{convert|6000|lb|kg}}", "FL310", "31,000 ft"). We
//   normalize to canonical units (kt, ft, lb, nm) and discard junk we
//   can't parse rather than guessing.
// ---------------------------------------------------------------------------

const REST_BASE   = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const ACTION_BASE = "https://en.wikipedia.org/w/api.php";

// Public entry-point. Takes a catalog entry (label + optional wikipediaTitle).
// Returns a profile object suitable for `saveProfile`, or null on network
// failure (don't cache; let the next select retry).
export async function fetchAircraftProfile(catalogEntry) {
  const title = catalogEntry.wikipediaTitle || titleFromLabel(catalogEntry.label);
  if (!title) return null;

  // Stage 1: REST summary — gives us a short prose extract + canonical
  // article title (after Wikipedia redirects).
  let summary = null;
  let resolvedTitle = title;
  try {
    const url = REST_BASE + encodeURIComponent(title) + "?redirect=true";
    const res = await fetch(url);
    if (res.status === 404) {
      return {
        source: "wikipedia-miss",
        wikipediaTitle: title,
        summary: null,
        notes: "No Wikipedia article matched the title we derived. Try editing the catalog entry's wikipediaTitle field.",
      };
    }
    if (!res.ok) throw new Error(`REST summary returned ${res.status}`);
    const json = await res.json();
    summary = (json.extract || "").trim() || null;
    resolvedTitle = json.title || title;
  } catch (e) {
    // Network problem — don't cache; let next select retry.
    return null;
  }

  // Stage 2: Action API — get the article wikitext, parse the infobox.
  let infobox = null;
  try {
    const params = new URLSearchParams({
      action: "parse",
      page: resolvedTitle,
      prop: "wikitext",
      format: "json",
      formatversion: "2",
      origin: "*",
    });
    const res = await fetch(`${ACTION_BASE}?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      const wikitext = json && json.parse && json.parse.wikitext;
      if (wikitext) infobox = parseAircraftInfobox(wikitext);
    }
  } catch (e) {
    // Infobox parse failed but we still have the summary — fall through.
  }

  return {
    source: infobox ? "wikipedia" : "wikipedia-summary-only",
    wikipediaTitle: resolvedTitle,
    summary,
    ...((infobox || {})),
  };
}

// Derive a Wikipedia title from a free-form label as a last-resort guess.
// Trims trailing variants in parens, strips registration marks, normalizes
// whitespace. Wikipedia is forgiving (and the REST endpoint redirects), so
// most reasonable guesses resolve.
function titleFromLabel(label) {
  if (!label) return "";
  let t = label;
  // Strip parenthetical suffixes that vary per variant.
  t = t.replace(/\s*\([^)]+\)\s*$/g, "");
  // Strip "Gen2" / "Plus" suffixes that aren't usually in article titles.
  t = t.replace(/\s+Gen\s*\d+\s*$/i, "");
  // Collapse whitespace.
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

// Find the first {{Infobox aircraft type}} block and parse its fields.
// Returns an object with normalized numeric fields, or null if no block.
function parseAircraftInfobox(wikitext) {
  // Aircraft infoboxes are split across two templates: aircraft begin
  // (general info) and aircraft type (the perf data). We want both.
  // The aircraft career template carries some operator data too. We
  // scan all infobox-aircraft-* blocks and merge fields.
  const blocks = extractTemplateBlocks(wikitext, /Infobox\s+aircraft\b/i);
  if (!blocks.length) return null;
  const merged = {};
  for (const block of blocks) {
    Object.assign(merged, parseTemplateBody(block));
  }

  return {
    cruiseSpeedKt:     kt(merged["cruise speed main"] || merged["cruise speed"] || merged["typical cruise speed"]),
    maxSpeedKt:        kt(merged["max speed main"] || merged["max speed"] || merged["maximum speed"]),
    serviceCeilingFt:  ft(merged["ceiling main"] || merged["service ceiling"] || merged["ceiling"]),
    rangeNm:           nm(merged["range main"] || merged["range"] || merged["maximum range"]),
    mtow_lb:           lb(merged["mtow main"] || merged["max takeoff weight"] || merged["mtow"]),
    takeoffRunFt:      ft(merged["takeoff run main"] || merged["takeoff distance"] || merged["takeoff roll"]),
    landingRunFt:      ft(merged["landing run main"] || merged["landing distance"] || merged["landing roll"]),
    crew:              parseCrew(merged["crew"]),
    capacity:          intOrNull(merged["capacity"]),
    engines:           parseEngines(merged["number of props"] || merged["number of engines"], merged["eng1 type"] || merged["engine type"], merged["eng1 name"] || merged["engine name"]),
    notes:             null,
  };
}

// Extract raw body of every template whose name matches `nameRegex`.
// Wikitext templates use {{ ... }} with `|` as the field separator. We
// have to balance braces because templates can nest.
function extractTemplateBlocks(wikitext, nameRegex) {
  const blocks = [];
  for (let i = 0; i < wikitext.length - 1; i++) {
    if (wikitext[i] === "{" && wikitext[i + 1] === "{") {
      // Find matching closer.
      let depth = 1;
      let j = i + 2;
      while (j < wikitext.length - 1 && depth > 0) {
        if (wikitext[j] === "{" && wikitext[j + 1] === "{") { depth++; j += 2; }
        else if (wikitext[j] === "}" && wikitext[j + 1] === "}") { depth--; j += 2; }
        else { j++; }
      }
      const body = wikitext.substring(i + 2, j - 2);
      const newlinePos = body.indexOf("\n");
      const pipePos = body.indexOf("|");
      const headerEnd = Math.min(
        newlinePos === -1 ? Infinity : newlinePos,
        pipePos === -1 ? Infinity : pipePos,
      );
      const name = body.substring(0, headerEnd === Infinity ? body.length : headerEnd).trim();
      if (nameRegex.test(name)) blocks.push(body);
      i = j - 1;
    }
  }
  return blocks;
}

// Parse a template body's `| name = value` pairs into a flat object.
// Lowercases field names. Strips leading/trailing whitespace from values.
// Handles nested templates by skipping over them (we'll see {{convert|...}}
// later in the value-normalizer).
function parseTemplateBody(body) {
  const out = {};
  // Split on top-level `|` only — track brace depth so we don't break
  // {{convert|...}} apart.
  const pieces = [];
  let depth = 0;
  let buf = "";
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    const next = body[i + 1];
    if (c === "{" && next === "{") { depth++; buf += "{{"; i++; }
    else if (c === "}" && next === "}") { depth--; buf += "}}"; i++; }
    else if (c === "[" && next === "[") { depth++; buf += "[["; i++; }
    else if (c === "]" && next === "]") { depth--; buf += "]]"; i++; }
    else if (c === "|" && depth === 0) { pieces.push(buf); buf = ""; }
    else { buf += c; }
  }
  pieces.push(buf);
  // Drop the leading piece — it's the template name (first segment before
  // any pipe). The rest are field assignments.
  for (let i = 1; i < pieces.length; i++) {
    const piece = pieces[i];
    const eq = piece.indexOf("=");
    if (eq < 0) continue;
    const name = piece.substring(0, eq).trim().toLowerCase();
    const value = piece.substring(eq + 1).trim();
    if (name) out[name] = value;
  }
  return out;
}

// ---- Value normalizers ---------------------------------------------------
//
// Wikipedia values can be:
//   - bare numbers: "311"
//   - units appended: "311 kn", "311 KTAS", "Mach 0.83"
//   - {{convert|}} templates: "{{convert|311|kn|km/h mph|abbr=on}}"
//   - prose: "approximately 6,000 lb at MTOW"
//
// Each normalizer extracts the canonical-unit number from any of these
// forms and returns null when the value isn't parseable.

function kt(value) {
  if (!value) return null;
  // {{convert|N|kn|...}} or {{convert|N|knots|...}}
  let m = value.match(/\{\{\s*convert\s*\|\s*([\d.,]+)\s*\|\s*(kn|knots|kt)\b/i);
  if (m) return num(m[1]);
  // {{convert|N|km/h|kn,...}} — convert FROM km/h TO knots: take FIRST arg as km/h, multiply by 0.539957
  m = value.match(/\{\{\s*convert\s*\|\s*([\d.,]+)\s*\|\s*(km\/h|kph)\b/i);
  if (m) { const v = num(m[1]); return v != null ? Math.round(v * 0.539957) : null; }
  // {{convert|N|mph|...}} → mph × 0.868976
  m = value.match(/\{\{\s*convert\s*\|\s*([\d.,]+)\s*\|\s*mph\b/i);
  if (m) { const v = num(m[1]); return v != null ? Math.round(v * 0.868976) : null; }
  // Inline "311 kn" or "311 knots" or "311 KTAS"
  m = value.match(/([\d.,]+)\s*(kn\b|knots|kt\b|ktas)/i);
  if (m) return num(m[1]);
  // Inline km/h
  m = value.match(/([\d.,]+)\s*km\/h/i);
  if (m) { const v = num(m[1]); return v != null ? Math.round(v * 0.539957) : null; }
  // Inline mph
  m = value.match(/([\d.,]+)\s*mph/i);
  if (m) { const v = num(m[1]); return v != null ? Math.round(v * 0.868976) : null; }
  return null;
}

function ft(value) {
  if (!value) return null;
  // {{convert|N|ft|...}}
  let m = value.match(/\{\{\s*convert\s*\|\s*([\d.,]+)\s*\|\s*ft\b/i);
  if (m) return num(m[1]);
  // {{convert|N|m|ft|...}}: METERS as base — convert to ft
  m = value.match(/\{\{\s*convert\s*\|\s*([\d.,]+)\s*\|\s*m\b/i);
  if (m) { const v = num(m[1]); return v != null ? Math.round(v * 3.28084) : null; }
  // Inline "31,000 ft" or "31000 feet"
  m = value.match(/([\d.,]+)\s*(ft\b|feet|foot)/i);
  if (m) return num(m[1]);
  // Inline "FL310" → 31,000 ft
  m = value.match(/\bFL\s*(\d{2,3})\b/i);
  if (m) return parseInt(m[1], 10) * 100;
  // Inline meters
  m = value.match(/([\d.,]+)\s*m\b/i);
  if (m) { const v = num(m[1]); return v != null ? Math.round(v * 3.28084) : null; }
  return null;
}

function nm(value) {
  if (!value) return null;
  let m = value.match(/\{\{\s*convert\s*\|\s*([\d.,]+)\s*\|\s*(nmi|nm)\b/i);
  if (m) return num(m[1]);
  m = value.match(/\{\{\s*convert\s*\|\s*([\d.,]+)\s*\|\s*km\b/i);
  if (m) { const v = num(m[1]); return v != null ? Math.round(v * 0.539957) : null; }
  m = value.match(/\{\{\s*convert\s*\|\s*([\d.,]+)\s*\|\s*mi\b/i);
  if (m) { const v = num(m[1]); return v != null ? Math.round(v * 0.868976) : null; }
  m = value.match(/([\d.,]+)\s*(nmi|nm\b|nautical)/i);
  if (m) return num(m[1]);
  m = value.match(/([\d.,]+)\s*km\b/i);
  if (m) { const v = num(m[1]); return v != null ? Math.round(v * 0.539957) : null; }
  m = value.match(/([\d.,]+)\s*(mi\b|miles)/i);
  if (m) { const v = num(m[1]); return v != null ? Math.round(v * 0.868976) : null; }
  return null;
}

function lb(value) {
  if (!value) return null;
  let m = value.match(/\{\{\s*convert\s*\|\s*([\d.,]+)\s*\|\s*lb\b/i);
  if (m) return num(m[1]);
  m = value.match(/\{\{\s*convert\s*\|\s*([\d.,]+)\s*\|\s*kg\b/i);
  if (m) { const v = num(m[1]); return v != null ? Math.round(v * 2.20462) : null; }
  m = value.match(/([\d.,]+)\s*(lb\b|lbs|pounds|pound)/i);
  if (m) return num(m[1]);
  m = value.match(/([\d.,]+)\s*kg\b/i);
  if (m) { const v = num(m[1]); return v != null ? Math.round(v * 2.20462) : null; }
  return null;
}

function num(s) {
  if (!s) return null;
  const cleaned = s.replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function intOrNull(s) {
  if (!s) return null;
  const m = String(s).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function parseCrew(value) {
  if (!value) return null;
  const min = intOrNull(value);
  if (min == null) return null;
  // "1 or 2" / "1-2" / "1 to 2"
  const range = value.match(/(\d+)\s*(?:or|to|-)\s*(\d+)/);
  if (range) return { min: parseInt(range[1], 10), max: parseInt(range[2], 10) };
  return { min, max: min };
}

function parseEngines(countStr, typeStr, nameStr) {
  const count = intOrNull(countStr);
  const type = (typeStr || "").replace(/\[\[|\]\]/g, "").trim() || null;
  const modelName = (nameStr || "").replace(/\[\[|\]\]/g, "").trim() || null;
  if (count == null && !type && !modelName) return null;
  return { count, type, modelName };
}
