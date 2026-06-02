// src/data/sf50.js
// ---------------------------------------------------------------------------
// Cirrus Vision Jet SF50 G2+ performance profile (Grant's N2AK).
//
// Sources & disclaimers:
//   The takeoff-distance table below is approximated from publicly cited
//   POH performance figures (sea-level: ~2,036 ft over a 50' obstacle at
//   MTOW). Higher density-altitude points are piecewise-linear-fit to the
//   shape of the published POH chart.
//
//   This is for FLIGHT PLANNING SUPPLEMENT use only. The official POH
//   performance charts in your AFM are authoritative. Don't read this as
//   a substitute for running the numbers on the day.
//
//   When in doubt: round UP, add reserve, and verify against the official
//   chart and the actual conditions (wet runway, slope, contamination,
//   etc. — none of which this model accounts for).
// ---------------------------------------------------------------------------

export const SF50_G2_PLUS = {
  key: "sf50_g2plus",
  label: "Cirrus Vision Jet SF50 G2+ (N2AK)",
  tail: "N2AK",
  // Default cruise altitude for FB winds-aloft band selection. The SF50's
  // service ceiling is FL310; typical jet cruise is FL280-310.
  cruiseFt: 28000,
  // Max takeoff weight (lb).
  mtow: 6000,
  // Service ceiling (ft).
  serviceCeilingFt: 31000,
  // Vmo / Mmo (rough — not used for go/no-go here).
  vmoKt: 250,
  // Takeoff distance over 50' obstacle at MTOW, paved/level/dry, flaps 50%
  // (POH normal). Indexed by density altitude.
  //
  // [DA_ft, distance_ft] — piecewise-linear interpolated between rows.
  // Above 12,000 ft DA, performance falls off the cliff edge of the SF50's
  // published charts; we cap distance there and the renderer adds a "verify
  // POH directly" warning.
  takeoff50ftMtow: [
    [    0, 2036 ],
    [ 2000, 2200 ],
    [ 4000, 2500 ],
    [ 6000, 3000 ],
    [ 8000, 3800 ],
    [10000, 4800 ],
    [12000, 6200 ],
  ],
  // Above this DA, render the strong warning regardless of margin —
  // we're outside the well-charted regime.
  daWarningFt: 10000,
  // Margins for the runway-length verdict (over the required 50'-obstacle
  // distance). Anything tighter than okMarginFt over the required gets
  // flagged as "tight"; below tightMarginFt is a hard warning.
  okMarginFt:    1500,
  tightMarginFt:  500,
};
