// src/ui/setup.js
// ---------------------------------------------------------------------------
// Setup screen: destination ICAO input + aircraft type dropdown.
// Renders HTML string; form submission is wired in app.js.
// ---------------------------------------------------------------------------

import { DEPARTURES } from "../data/airports.js";
import { AIRCRAFT } from "../data/aircraft.js";

export function renderSetup(state, prefs) {
  const dep = DEPARTURES[state.departure];
  const lastDest = (prefs && prefs.lastDestination) || "";
  const aircraftOptions = Object.entries(AIRCRAFT)
    .map(([key, info]) => `
      <option value="${key}" ${state.aircraftKey === key ? "selected" : ""}>${info.label}</option>
    `).join("");
  return `
    <div class="hero-bg setup-bg">
      <div class="screen">
        <button class="back-btn" data-action="back-to-welcome">← change departure</button>
        <h1>${state.departure} → ?</h1>
        <p class="lead">
          Departing ${dep.name} (${dep.elev.toLocaleString()} ft MSL).
          Where to, and what are we flying?
        </p>
        <form id="setup-form" class="setup-form" autocomplete="off">
          <label>
            Destination ICAO
            <input type="text" id="dest-input" placeholder="e.g. KSFO" maxlength="4" value="${lastDest}" required>
          </label>
          <label>
            Aircraft type
            <select id="aircraft-select" required>
              <option value="" disabled ${!state.aircraftKey ? "selected" : ""}>Select aircraft…</option>
              ${aircraftOptions}
            </select>
          </label>
          <button type="submit" class="primary-btn">Build brief →</button>
        </form>
      </div>
    </div>
  `;
}
