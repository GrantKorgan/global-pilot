// src/calc/geo.js
// ---------------------------------------------------------------------------
// Geographic calculations — pure functions.
//
// `distanceNm` is great-circle distance via the haversine formula.
// `nearestFBStation` finds the closest FB forecast point to a destination,
// used for the descent winds-aloft column in the brief.
// ---------------------------------------------------------------------------

import { FB_STATIONS } from "../data/airports.js";

// Haversine great-circle distance in nautical miles.
export function distanceNm(lat1, lon1, lat2, lon2) {
  const R = 3440.065; // earth radius in nm
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
          + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Is this point in the contiguous US? Used to decide whether NOAA AWC's
// US-only feeds (winds aloft FB chart, AIRMETs/SIGMETs, etc.) are
// meaningful. Bounding box is intentionally generous — picks up Maine,
// Florida Keys, and the West Coast border.
export function isInConus(lat, lon) {
  if (lat == null || lon == null) return false;
  return lat >= 24 && lat <= 50 && lon >= -125 && lon <= -66;
}

// For a destination at (lat, lon), find the nearest FB forecast station.
// Returns { code, distanceNm } or null if coords are missing.
export function nearestFBStation(lat, lon) {
  if (lat == null || lon == null) return null;
  let bestCode = null, bestDist = Infinity;
  for (const [code, c] of Object.entries(FB_STATIONS)) {
    const d = distanceNm(lat, lon, c.lat, c.lon);
    if (d < bestDist) { bestDist = d; bestCode = code; }
  }
  return { code: bestCode, distanceNm: Math.round(bestDist) };
}
