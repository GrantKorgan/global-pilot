// src/data/aircraft.js
// ---------------------------------------------------------------------------
// Aircraft selection — `label` shows in the dropdown, `cruiseFt` picks the
// winds-aloft band, `perfKey` (optional) points at a full performance
// profile module for richer per-leg metrics (takeoff distance, etc.).
//
// SF50 G2+ is the first aircraft with a full profile — see src/data/sf50.js
// and src/calc/perf.js. The other entries are generic tier categories
// preserved from v2; they don't yet have perf data.
// ---------------------------------------------------------------------------

import { SF50_G2_PLUS } from "./sf50.js";

export const AIRCRAFT = {
  // Specific aircraft profiles — full perf data available.
  sf50_g2plus: {
    label: SF50_G2_PLUS.label,
    cruiseFt: SF50_G2_PLUS.cruiseFt,
    perfKey: "sf50_g2plus",
  },

  // Generic tiers — used when the user hasn't selected a specific profile.
  pistonNA: { label: "Piston single — normally aspirated",                  cruiseFt:  9000 },
  pistonTC: { label: "Piston — turbocharged",                                cruiseFt: 16000 },
  turbine:  { label: "Turbine single (Vision Jet / TBM / Meridian)",         cruiseFt: 24000 },
  midJet:   { label: "Mid jet (CJ4 / Phenom 300 / XLS / Hawker)",            cruiseFt: 39000 },
  superMid: { label: "Super-mid jet (Citation X / Challenger 350 / F2000)",  cruiseFt: 43000 },
  heavy:    { label: "Heavy jet (G450/550/650 / Global / Falcon 7X)",        cruiseFt: 45000 },
};
