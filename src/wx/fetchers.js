// src/wx/fetchers.js
// ---------------------------------------------------------------------------
// Thin wrappers around NOAA Aviation Weather Center endpoints. Each function
// returns a Promise. fetchAllData fans out in parallel using Promise.allSettled
// so a failure in one feed doesn't block the others.
// ---------------------------------------------------------------------------

import { fetchViaProxy } from "./proxy.js";

const AWC = "https://aviationweather.gov/api/data";

export async function fetchMetars(ids) {
  return fetchViaProxy(`${AWC}/metar?ids=${ids.join(",")}&format=json&hours=2`, "json");
}
export async function fetchTafs(ids) {
  return fetchViaProxy(`${AWC}/taf?ids=${ids.join(",")}&format=json`, "json");
}
export async function fetchPireps(id) {
  // PIREPs within 200 nm of station, last 2 hours.
  return fetchViaProxy(`${AWC}/pirep?id=${id}&distance=200&age=2&format=json`, "json");
}
export async function fetchAirsigmets() {
  return fetchViaProxy(`${AWC}/airsigmet?format=json`, "json");
}
export async function fetchFB() {
  // Winds & temperatures aloft, 6-hour forecast, low altitudes (3K–24K ft).
  return fetchViaProxy(`${AWC}/windtemp?region=us&fcst=06&level=low`, "text");
}
export async function fetchFBHigh() {
  // High-altitude winds (30K, 34K, 39K ft) — used for jets.
  return fetchViaProxy(`${AWC}/windtemp?region=us&fcst=06&level=high`, "text");
}

// Fire everything in parallel. A failure in any single feed is recorded and
// the brief renders with whatever did come back.
export async function fetchAllData(departure, destination) {
  const requests = [
    ["metars",     fetchMetars([departure, destination])],
    ["tafs",       fetchTafs([departure, destination])],
    ["pirepsDep",  fetchPireps(departure)],
    ["pirepsDest", fetchPireps(destination)],
    ["airsigmets", fetchAirsigmets()],
    ["fbLow",      fetchFB()],
    ["fbHigh",     fetchFBHigh()],
  ];
  const results = await Promise.allSettled(requests.map(([, p]) => p));
  const out = { errors: [], status: {} };
  for (let i = 0; i < requests.length; i++) {
    const key = requests[i][0];
    const r = results[i];
    if (r.status === "fulfilled") {
      out[key] = r.value;
      const isEmpty = Array.isArray(r.value) ? r.value.length === 0 : !r.value;
      out.status[key] = isEmpty ? "empty" : "ok";
    } else {
      out[key] = null;
      out.status[key] = "err";
      out.errors.push({
        key,
        message: r.reason && r.reason.message ? r.reason.message : String(r.reason),
      });
    }
  }
  return out;
}
