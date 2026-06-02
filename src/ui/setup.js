// src/ui/setup.js
// ---------------------------------------------------------------------------
// Setup screen for the single-leg brief path: departure ICAO + destination
// ICAO + aircraft type. Renders HTML string; form submission wires in
// app.js. (The trip-leg path skips this screen entirely — clicking "Brief"
// on a leg in the trip editor goes straight to the brief view.)
// ---------------------------------------------------------------------------

import { aircraftSelectOptions } from "./aircraft-select.js";
import { escAttr } from "./escape.js";

export function renderSetup(state, prefs) {
  const lastDep  = (prefs && prefs.departure)       || state.departure  || "";
  const lastDest = (prefs && prefs.lastDestination) || state.destination || "";
  const aircraftOptions = aircraftSelectOptions(state.aircraftKey);

  return `
    <div class="hero-bg setup-bg">
      <div class="screen">
        <button class="back-btn" data-action="back-to-welcome">← welcome</button>
        <h1>Single-leg brief</h1>
        <p class="lead">
          Departure, destination, aircraft — three fields and we'll pull live weather for both ends.
        </p>
        <form id="setup-form" class="setup-form" autocomplete="off">
          <label>
            Departure ICAO
            <input type="text" id="dep-input" placeholder="e.g. KRNO" maxlength="4" value="${escAttr(lastDep)}" required>
          </label>
          <label>
            Destination ICAO
            <input type="text" id="dest-input" placeholder="e.g. KSFO" maxlength="4" value="${escAttr(lastDest)}" required>
          </label>
          <label>
            Aircraft type
            <select id="aircraft-select" required>
              <option value="" disabled ${!state.aircraftKey ? "selected" : ""}>Select aircraft…</option>
              ${aircraftOptions}
            </select>
            <span class="form-hint">Specs auto-fill from Wikipedia on first selection of each model.</span>
          </label>
          <button type="submit" class="primary-btn">Build brief →</button>
        </form>
      </div>
    </div>
  `;
}
