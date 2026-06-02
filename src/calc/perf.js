// src/calc/perf.js
// ---------------------------------------------------------------------------
// Aircraft performance calcs. Pure functions, no I/O, no DOM.
//
// Today this is just SF50 G2+ takeoff distance over a 50' obstacle, looked
// up from the POH-derived table in src/data/sf50.js. The function is shaped
// so we can add other aircraft profiles later by swapping the table.
// ---------------------------------------------------------------------------

import { SF50_G2_PLUS } from "../data/sf50.js";

// Linear interpolation across a [x, y] table sorted by x. Clamps at ends.
function lerpTable(table, x) {
  if (x <= table[0][0]) return table[0][1];
  if (x >= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 0; i < table.length - 1; i++) {
    const [x1, y1] = table[i];
    const [x2, y2] = table[i + 1];
    if (x >= x1 && x <= x2) {
      const t = (x - x1) / (x2 - x1);
      return y1 + t * (y2 - y1);
    }
  }
  return null;
}

// SF50 G2+ takeoff distance over a 50' obstacle at MTOW, paved/level/dry.
// Indexed by density altitude (which captures both pressure altitude AND
// non-ISA temp — good enough for a planning brief).
//
// Returns null if DA is missing. Returns rounded feet otherwise.
export function sf50TakeoffDistanceFt(densityAltFt) {
  if (densityAltFt == null) return null;
  const ft = lerpTable(SF50_G2_PLUS.takeoff50ftMtow, densityAltFt);
  return ft == null ? null : Math.round(ft);
}

// Verdict structure given required takeoff distance and (optional) longest
// runway length at the field.
//
//   { status: "ok" | "tight" | "warn" | "unknown",
//     marginFt: number | null,
//     longestRunwayFt: number | null,
//     daWarning: boolean }
//
// status = "unknown" when we don't know runway length — show the required
// distance and tell the pilot to verify against AirNav. "warn" when DA is
// outside the well-charted regime OR margin is negative or below
// tightMarginFt. "tight" when margin is between tightMarginFt and
// okMarginFt. "ok" otherwise.
export function sf50TakeoffVerdict({ requiredFt, longestRunwayFt, densityAltFt }) {
  const daWarning =
    densityAltFt != null && densityAltFt >= SF50_G2_PLUS.daWarningFt;

  if (requiredFt == null) {
    return { status: "unknown", marginFt: null, longestRunwayFt: longestRunwayFt ?? null, daWarning };
  }
  if (longestRunwayFt == null) {
    return {
      status: daWarning ? "warn" : "unknown",
      marginFt: null,
      longestRunwayFt: null,
      daWarning,
    };
  }
  const margin = longestRunwayFt - requiredFt;
  let status;
  if (margin < SF50_G2_PLUS.tightMarginFt) status = "warn";
  else if (margin < SF50_G2_PLUS.okMarginFt) status = "tight";
  else status = "ok";
  if (daWarning && status === "ok") status = "tight"; // demote when off-chart
  return { status, marginFt: margin, longestRunwayFt, daWarning };
}
