// src/store/profiles.js
// ---------------------------------------------------------------------------
// LAZY AIRCRAFT PROFILE CACHE.
//
// One localStorage blob keyed by aircraft key. Populated on-demand when a
// pilot first selects an aircraft — the app fires a Wikipedia enrichment
// fetch (see src/wx/wiki.js), parses the {{Infobox aircraft type}} block,
// and caches the structured result here.
//
// Cached profiles persist across sessions. They never expire automatically
// (manufacturer specs don't change month-to-month). The pilot can clear
// the cache by editing devtools localStorage or running clearAllProfiles().
//
// SCHEMA (per key):
//   key             aircraft key from the catalog
//   source          "wikipedia" | "wikipedia+manual" | "manual" | "hardcoded"
//   fetchedAt       ISO timestamp of the fetch
//   wikipediaTitle  the article we ended up on (after redirects)
//   summary         short prose description (1-2 sentences, plain text)
//   cruiseSpeedKt   typical cruise speed in knots
//   maxSpeedKt      VMO/MMO equivalent or top cruise in knots
//   serviceCeilingFt service ceiling in feet
//   rangeNm         max range in nautical miles
//   mtow_lb         maximum takeoff weight in pounds
//   takeoffRunFt    takeoff ground roll where Wikipedia publishes it (rare)
//   landingRunFt    landing ground roll where Wikipedia publishes it (rare)
//   crew            { min, max } typical crew complement
//   capacity        passengers
//   engines         { count, type, modelName }
//   notes           anything noteworthy we couldn't bucket into a field
//
// Any field can be null when the source didn't publish it.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "global-pilot:aircraft-profiles:v1";

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveAll(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    // localStorage disabled — fine, just don't persist.
  }
}

export function getProfile(key) {
  if (!key) return null;
  const all = loadAll();
  return all[key] || null;
}

export function saveProfile(key, profile) {
  if (!key || !profile) return;
  const all = loadAll();
  all[key] = { ...profile, key, fetchedAt: profile.fetchedAt || new Date().toISOString() };
  saveAll(all);
}

export function deleteProfile(key) {
  if (!key) return;
  const all = loadAll();
  delete all[key];
  saveAll(all);
}

// Useful from devtools to wipe the entire cache (e.g., after a catalog
// migration that changes keys).
export function clearAllProfiles() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

// Has this key ever been fetched (success or recorded failure)?
export function hasProfile(key) {
  return !!getProfile(key);
}
