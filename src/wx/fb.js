// src/wx/fb.js
// ---------------------------------------------------------------------------
// FB (winds aloft) text-format parser.
//
// NOAA's FB product is text-formatted. Example output:
//
//   FT   3000    6000    9000   12000   18000   24000  30000  34000  39000
//   RNO        2107+02 2018-02 2024-13 2236-26 245038 244649 244852 244555
//
// Each token is "ddffttt":
//   dd  = wind direction / 10           (so 22 = 220°)
//   ff  = wind speed in knots
//   tt  = temperature in °C
//
// Special rules:
//   - Above 24,000 ft, temperature is implicitly negative.
//   - dd == 99           → light & variable.
//   - dd 51..86          → subtract 50 and add 100 to speed (winds > 99 kt).
//
// Output shape: { [altitudeFt]: { dir, spd, tempC } }
// ---------------------------------------------------------------------------

export function parseFB(text, station) {
  if (!text) return null;
  const lines = text.split("\n");
  let dataLine = null;
  for (const line of lines) {
    if (new RegExp("^\\s*" + station + "\\b").test(line)) {
      dataLine = line;
      break;
    }
  }
  if (!dataLine) return null;
  const altitudes = [3000, 6000, 9000, 12000, 18000, 24000, 30000, 34000, 39000];
  const tokens = dataLine.trim().split(/\s+/).slice(1); // drop station code
  const result = {};
  for (let i = 0; i < altitudes.length && i < tokens.length; i++) {
    const parsed = parseFBToken(tokens[i], altitudes[i]);
    if (parsed) result[altitudes[i]] = parsed;
  }
  return result;
}

export function parseFBToken(token, altitudeFt) {
  if (!token || token.length < 4) return null;
  let dir = parseInt(token.substring(0, 2), 10);
  let spd = parseInt(token.substring(2, 4), 10);
  if (Number.isNaN(dir) || Number.isNaN(spd)) return null;
  if (dir === 99) return { dir: "LGT", spd: 0, tempC: null };
  if (dir >= 51 && dir <= 86) { dir -= 50; spd += 100; }
  dir = dir * 10;
  let tempC = null;
  if (token.length > 4) {
    const rest = token.substring(4);
    let sign = 1, tempStr = rest;
    if (rest[0] === "-")           { sign = -1; tempStr = rest.substring(1); }
    else if (rest[0] === "+")      {            tempStr = rest.substring(1); }
    else if (altitudeFt >= 24000)  sign = -1; // implicit negative above FL240
    const t = parseInt(tempStr, 10);
    if (!Number.isNaN(t)) tempC = sign * t;
  }
  return { dir, spd, tempC };
}

// Pick the FB altitude closest to our target cruise. Used for jets that
// cruise at FL430 — closest FB level reported is 39,000.
export function closestFBAltitude(targetFt, fbData) {
  if (!fbData) return null;
  const have = Object.keys(fbData).map(Number);
  if (!have.length) return null;
  return have.reduce(
    (best, alt) => Math.abs(alt - targetFt) < Math.abs(best - targetFt) ? alt : best,
    have[0]
  );
}
