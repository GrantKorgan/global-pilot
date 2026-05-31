// src/calc/atmosphere.js
// ---------------------------------------------------------------------------
// Atmospheric calculations — pure functions, no I/O, no DOM.
//
// Pressure altitude: how high your altimeter "thinks" you are when set to
// 29.92". Higher pressure altitude = thinner air = higher density altitude.
//
// Density altitude (Koch chart approximation):
//   DA ≈ PA + 120 × (OAT − ISA)
// where ISA temp at PA = 15°C − 2°C per 1,000 ft of PA. Good enough for a
// brief. The real formula has a slight non-linearity that doesn't matter at
// the altitudes we care about.
// ---------------------------------------------------------------------------

export function pressureAltitude(elevFt, altimeterInHg) {
  return elevFt + (29.92 - altimeterInHg) * 1000;
}

export function densityAltitude(elevFt, tempC, altimeterInHg) {
  if (tempC == null || altimeterInHg == null) return null;
  const PA = pressureAltitude(elevFt, altimeterInHg);
  const ISA = 15 - 2 * (PA / 1000);
  return PA + 120 * (tempC - ISA);
}
