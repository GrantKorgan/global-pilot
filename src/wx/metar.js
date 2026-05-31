// src/wx/metar.js
// ---------------------------------------------------------------------------
// METAR / TAF helpers — small accessor functions over the AWC JSON response,
// plus a parser for significant-weather flags in raw METAR strings.
// ---------------------------------------------------------------------------

export function getLatestMetar(metars, icao) {
  if (!metars) return null;
  return metars.find((m) => m.icaoId === icao) || null;
}

export function getTaf(tafs, icao) {
  if (!tafs) return null;
  return tafs.find((t) => t.icaoId === icao) || null;
}

// AWC returns altimeter in millibars (e.g., 1013.2). Convert to inches of
// mercury: 1 mb = 0.02953 inHg.
export function altimeterInHg(metar) {
  if (!metar || metar.altim == null) return null;
  return metar.altim * 0.02953;
}

// Flight category lives under either `fltCat` (newer responses) or
// `flightCategory` (older). Be defensive.
export function metarFltCat(metar) {
  return metar && (metar.fltCat || metar.flightCategory || "");
}

// Flag known nasties in the raw METAR wxString. A complete METAR parser is
// a project of its own; this is a fast scan for the things that matter
// during a brief.
export function parseSignificantWeather(wxString) {
  if (!wxString) return [];
  const flags = [];
  if (/TS/.test(wxString))         flags.push("thunderstorms");
  if (/\+RA|\+SN/.test(wxString))  flags.push("heavy precipitation");
  if (/FG|BR/.test(wxString))      flags.push("fog/mist");
  if (/FZ/.test(wxString))         flags.push("freezing precip");
  if (/GR/.test(wxString))         flags.push("hail");
  if (/IC|PL/.test(wxString))      flags.push("ice pellets");
  if (/HZ/.test(wxString))         flags.push("haze");
  if (/FU/.test(wxString))         flags.push("smoke");
  if (/DS|SS|PO/.test(wxString))   flags.push("dust/sand");
  if (/SQ/.test(wxString))         flags.push("squalls");
  return flags;
}
