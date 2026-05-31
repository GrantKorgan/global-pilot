// src/calc/wind.js
// ---------------------------------------------------------------------------
// Wind component math — pure functions.
//
// `angularDiff(a, b)` is the shortest signed difference between two angles,
// wrapped to ±180°. Used everywhere we compute angle-between-wind-and-runway.
//
// `crosswindComponent` returns the absolute crosswind in knots for a given
// runway heading. Either end of the same pavement strip has the same magnitude.
//
// `preferredRunway` returns the runway end with the strongest headwind, plus
// its crosswind. Returns null in calm conditions (pilot's choice).
// ---------------------------------------------------------------------------

export function angularDiff(a, b) {
  let d = ((a - b) % 360 + 540) % 360 - 180;
  return d;
}

export function crosswindComponent(windDir, windSpd, runwayHdg) {
  if (windSpd == null || windDir == null || windSpd === 0) return 0;
  const angle = Math.abs(angularDiff(windDir, runwayHdg));
  return Math.round(Math.abs(windSpd * Math.sin(angle * Math.PI / 180)));
}

// Of all runways at this field, pick the one with the strongest headwind.
// Returns { id, hdg, headwind, crosswind } or null if wind is calm.
export function preferredRunway(windDir, windSpd, runways) {
  if (windSpd == null || windDir == null || windSpd === 0) return null;
  let best = null;
  let bestHw = -Infinity;
  for (const rwy of runways) {
    // Each pavement strip has two ends; check both.
    const ends = [
      { id: rwy.id.split("/")[0], hdg: rwy.hdg },
      { id: rwy.id.split("/")[1], hdg: (rwy.hdg + 180) % 360 },
    ];
    for (const end of ends) {
      const hw = windSpd * Math.cos(angularDiff(windDir, end.hdg) * Math.PI / 180);
      if (hw > bestHw) {
        bestHw = hw;
        best = {
          id: end.id,
          hdg: end.hdg,
          headwind: Math.round(hw),
          crosswind: Math.round(Math.abs(windSpd * Math.sin(angularDiff(windDir, end.hdg) * Math.PI / 180))),
        };
      }
    }
  }
  return best;
}
