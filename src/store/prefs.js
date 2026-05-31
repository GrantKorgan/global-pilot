// src/store/prefs.js
// ---------------------------------------------------------------------------
// Tiny wrapper around localStorage for user preferences (last departure,
// last aircraft, last destination ICAO). One JSON blob keyed by STORAGE_KEY.
//
// Includes a one-time migration from the pre-rename project name. Once every
// user has loaded the app under the new name at least once, the migration
// branch is dead code and can be deleted.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "global-pilot:v1";
const LEGACY_STORAGE_KEY = "tahoe-pilot-weather:v2";

export function loadPrefs() {
  try {
    // Migrate from the pre-rename project name on first load under v1.
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy && !localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, legacy);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function savePrefs(patch) {
  try {
    const prev = loadPrefs();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...patch }));
  } catch (e) {
    // localStorage disabled (e.g., Safari private mode) — fine, just don't persist.
  }
}
