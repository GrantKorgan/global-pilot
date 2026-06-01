// src/store/trips.js
// ---------------------------------------------------------------------------
// Trip persistence — all trips live in one localStorage blob, JSON-serialized.
//
// Why one blob instead of one key per trip: trips are small (~few KB even
// with 22 legs) and we always want the full list to render Trips view.
// One read = full list. When the count crosses ~100, move to IndexedDB.
//
// Every save runs assertTrip() so malformed data is caught loudly at write
// time, not silently next render.
// ---------------------------------------------------------------------------

import { assertTrip } from "../data/types.js";

const TRIPS_KEY = "global-pilot:trips:v1";

export function getAllTrips() {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function getTrip(id) {
  return getAllTrips().find((t) => t.id === id) || null;
}

export function saveTrip(trip) {
  assertTrip(trip);
  const all = getAllTrips();
  const idx = all.findIndex((t) => t.id === trip.id);
  if (idx >= 0) all[idx] = trip;
  else all.push(trip);
  try {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(all));
  } catch (e) {
    throw new Error(`Failed to save trip: ${e.message}`);
  }
}

export function deleteTrip(id) {
  const all = getAllTrips().filter((t) => t.id !== id);
  try {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(all));
  } catch (e) {
    // best-effort delete; in-memory list is already filtered
  }
}

// JSON export/import — the "sneakernet sharing" path. Two pilots can swap
// trips by emailing the JSON, dropping into another browser via importTripJson.
export function exportTripJson(id) {
  const trip = getTrip(id);
  if (!trip) return null;
  return JSON.stringify(trip, null, 2);
}

export function importTripJson(json) {
  const trip = JSON.parse(json);
  assertTrip(trip);
  // Generate a fresh id so we don't clobber an existing trip with the same id.
  trip.id = "trip-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
  saveTrip(trip);
  return trip;
}
