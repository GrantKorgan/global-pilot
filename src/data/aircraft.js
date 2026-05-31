// src/data/aircraft.js
// ---------------------------------------------------------------------------
// Aircraft category tiers. The `cruiseFt` value is the default cruise altitude
// used to pick which winds-aloft band to highlight.
//
// Day 4 of the v3 plan replaces this generic tier system with full aircraft
// profiles (POH-sourced perf data for the SF50 G2+ first). For now, the
// tiers preserve v2 behavior.
// ---------------------------------------------------------------------------

export const AIRCRAFT = {
  pistonNA: { label: "Piston single — normally aspirated",                  cruiseFt:  9000 },
  pistonTC: { label: "Piston — turbocharged",                                cruiseFt: 16000 },
  turbine:  { label: "Turbine single (Vision Jet / TBM / Meridian)",         cruiseFt: 24000 },
  midJet:   { label: "Mid jet (CJ4 / Phenom 300 / XLS / Hawker)",            cruiseFt: 39000 },
  superMid: { label: "Super-mid jet (Citation X / Challenger 350 / F2000)",  cruiseFt: 43000 },
  heavy:    { label: "Heavy jet (G450/550/650 / Global / Falcon 7X)",        cruiseFt: 45000 },
};
