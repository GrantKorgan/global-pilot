// src/ui/trips.js
// ---------------------------------------------------------------------------
// Two screens for multi-leg trips:
//   renderTrips(state)     — list of saved trips + "+ New trip"
//   renderTripEdit(state)  — name / aircraft / dates / list of legs / add leg
//
// Renders HTML strings. Events are wired in src/app.js.
// ---------------------------------------------------------------------------

import { AIRCRAFT } from "../data/aircraft.js";
import { getAllTrips, getTrip } from "../store/trips.js";

// =============================================================================
// Trip list view
// =============================================================================

export function renderTrips(state) {
  const trips = getAllTrips();
  const list = trips.length
    ? trips.map(renderTripCard).join("")
    : `<p class="warn" style="margin-top:24px;">No trips yet. Click "+ New trip" to start.</p>`;

  return `
    <div class="screen">
      <button class="back-btn" data-action="back-to-welcome">← welcome</button>
      <div class="trips-header">
        <div>
          <h1>Trips</h1>
          <p class="lead" style="margin:0;">Multi-leg journeys, weather per leg, persisted in your browser.</p>
        </div>
        <button class="primary-btn" data-action="new-trip" style="margin-top:0;">+ New trip</button>
      </div>
      <div class="trips-list">${list}</div>
    </div>
  `;
}

function renderTripCard(trip) {
  const ac = AIRCRAFT[trip.aircraftId];
  const acLabel = ac ? ac.label : trip.aircraftId;
  const legCount = trip.legs.length;
  const dateRange = trip.dateStart === trip.dateEnd
    ? trip.dateStart
    : `${trip.dateStart} → ${trip.dateEnd}`;
  return `
    <button class="trip-card" data-action="open-trip" data-trip-id="${trip.id}">
      <div class="trip-card-name">${escText(trip.name)}</div>
      <div class="trip-card-meta">${dateRange}</div>
      <div class="trip-card-meta">${legCount} leg${legCount === 1 ? "" : "s"} · ${escText(acLabel)}</div>
    </button>
  `;
}

// =============================================================================
// Trip editor view
// =============================================================================

export function renderTripEdit(state) {
  const trip = getTrip(state.currentTripId);
  if (!trip) {
    return `
      <div class="screen">
        <button class="back-btn" data-action="back-to-trips">← trips</button>
        <div class="error-box"><h2>Trip not found</h2></div>
      </div>
    `;
  }

  const aircraftOptions = Object.entries(AIRCRAFT)
    .map(([key, info]) => `<option value="${key}" ${trip.aircraftId === key ? "selected" : ""}>${info.label}</option>`)
    .join("");

  const legRows = trip.legs.length
    ? trip.legs.map((leg, idx) => renderLegRow(leg, idx)).join("")
    : `<p class="warn">No legs yet. Add the first one below.</p>`;

  return `
    <div class="screen">
      <button class="back-btn" data-action="back-to-trips">← trips</button>
      <h1 style="margin-bottom:24px;">Edit trip</h1>

      <!-- Trip details: name, aircraft, dates -->
      <form id="trip-form" class="trip-form" autocomplete="off">
        <label>
          Name
          <input type="text" id="trip-name" value="${escAttr(trip.name)}" required>
        </label>
        <div class="trip-form-row">
          <label>
            Aircraft
            <select id="trip-aircraft" required>${aircraftOptions}</select>
          </label>
          <label>
            Start date
            <input type="date" id="trip-start" value="${trip.dateStart}" required>
          </label>
          <label>
            End date
            <input type="date" id="trip-end" value="${trip.dateEnd}" required>
          </label>
        </div>
        <div class="trip-form-actions">
          <button type="button" class="ghost-btn" data-action="delete-trip" data-trip-id="${trip.id}">Delete trip</button>
          <button type="submit" class="primary-btn" style="margin-top:0;">Save trip details</button>
        </div>
      </form>

      <h2 style="margin-top:32px;">Legs</h2>
      <div class="legs-list">${legRows}</div>

      <!-- Add a new leg -->
      <form id="leg-form" class="leg-form" autocomplete="off">
        <h4>Add a leg</h4>
        <div class="leg-form-row">
          <label>From (ICAO)<input type="text" id="leg-dep" placeholder="e.g. KRNO" maxlength="4" required></label>
          <label>To (ICAO)<input type="text" id="leg-dest" placeholder="e.g. KSFO" maxlength="4" required></label>
          <label>Date<input type="date" id="leg-date" value="${trip.dateStart}" required></label>
          <button type="submit" class="primary-btn" style="margin-top:0;">+ Add leg</button>
        </div>
      </form>
    </div>
  `;
}

function renderLegRow(leg, idx) {
  return `
    <div class="leg-row" data-leg-id="${leg.id}">
      <div class="leg-seq">${idx + 1}</div>
      <div class="leg-route">
        <div class="leg-route-icao">${leg.dep} → ${leg.dest}</div>
        <div class="leg-route-date">${leg.date}</div>
      </div>
      <div class="leg-actions">
        <button class="ghost-btn" data-action="view-leg-brief" data-leg-id="${leg.id}">Brief →</button>
        <button class="ghost-btn leg-delete" data-action="delete-leg" data-leg-id="${leg.id}" aria-label="Delete leg">×</button>
      </div>
    </div>
  `;
}

// HTML-escape helpers — keep input safe in attributes + text nodes.
function escText(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escAttr(s) {
  return escText(s).replace(/"/g, "&quot;");
}
