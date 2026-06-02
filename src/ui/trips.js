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
import { escText, escAttr } from "./escape.js";
import { EUROPE_2026_TRIP_ID } from "../data/fixtures/europe-2026.js";

// =============================================================================
// Trip list view
// =============================================================================

export function renderTrips(state) {
  const trips = getAllTrips();
  const list = trips.length
    ? trips.map(renderTripCard).join("")
    : `<p class="warn" style="margin-top:24px;">No trips yet. Click "+ New trip" to start, or load the Europe 2026 trip.</p>`;

  // If the canonical Europe 2026 trip isn't loaded yet, offer a one-click
  // seed. Idempotent — once loaded, the button hides.
  const europeLoaded = trips.some((t) => t.id === EUROPE_2026_TRIP_ID);
  const seedButton = europeLoaded ? "" : `
    <button class="ghost-btn" data-action="load-europe-2026">
      Load Europe 2026 trip
    </button>
  `;

  return `
    <div class="screen">
      <button class="back-btn" data-action="back-to-welcome">← welcome</button>
      <div class="trips-header">
        <div>
          <h1>Trips</h1>
          <p class="lead" style="margin:0;">Multi-leg journeys, weather per leg, persisted in your browser.</p>
        </div>
        <div class="trips-header-actions">
          ${seedButton}
          <button class="primary-btn" data-action="new-trip" style="margin-top:0;">+ New trip</button>
        </div>
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
    <button class="trip-card" data-action="open-trip" data-trip-id="${escAttr(trip.id)}">
      <div class="trip-card-name">${escText(trip.name)}</div>
      <div class="trip-card-meta">${escText(dateRange)}</div>
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
            <input type="date" id="trip-start" value="${escAttr(trip.dateStart)}" required>
          </label>
          <label>
            End date
            <input type="date" id="trip-end" value="${escAttr(trip.dateEnd)}" required>
          </label>
        </div>
        <div class="trip-form-actions">
          <button type="button" class="ghost-btn" data-action="delete-trip" data-trip-id="${escAttr(trip.id)}">Delete trip</button>
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
          <label>Date<input type="date" id="leg-date" value="${escAttr(trip.dateStart)}" required></label>
          <button type="submit" class="primary-btn" style="margin-top:0;">+ Add leg</button>
        </div>
      </form>
    </div>
  `;
}

function renderLegRow(leg, idx) {
  const id = escAttr(leg.id);
  return `
    <div class="leg-row" data-leg-id="${id}">
      <div class="leg-row-head">
        <div class="leg-seq">${idx + 1}</div>
        <div class="leg-route">
          <div class="leg-route-icao">${escText(leg.dep)} → ${escText(leg.dest)}</div>
          <div class="leg-route-date">${escText(leg.date)}</div>
        </div>
        <div class="leg-actions">
          <button class="ghost-btn" data-action="view-leg-brief" data-leg-id="${id}">Brief →</button>
          <button class="ghost-btn leg-delete" data-action="delete-leg" data-leg-id="${id}" aria-label="Delete leg">×</button>
        </div>
      </div>
      <details class="leg-ops">
        <summary>Operations · crew · FBOs · slot · customs · fuel · overnight</summary>
        ${renderLegOps(leg)}
      </details>
    </div>
  `;
}

// Render the operational-fields section of a leg. Each block (crew, FBOs,
// slot, PPR, customs, fuel, overnight, filing, notes) is hidden when its
// underlying data is empty — so legs with no ops data show "No operational
// data yet" and legs with full data show a populated grid.
function renderLegOps(leg) {
  const blocks = [];

  // Crew
  if (leg.crew && (leg.crew.pic || leg.crew.sic || (leg.crew.pax || []).length)) {
    const rows = [];
    if (leg.crew.pic) rows.push(`<dt>PIC</dt><dd>${escText(leg.crew.pic)}</dd>`);
    if (leg.crew.sic) rows.push(`<dt>SIC</dt><dd>${escText(leg.crew.sic)}</dd>`);
    if (leg.crew.pax && leg.crew.pax.length) {
      rows.push(`<dt>Pax</dt><dd>${leg.crew.pax.map(escText).join(", ")}</dd>`);
    }
    blocks.push(`<div class="ops-block"><h5>Crew</h5><dl>${rows.join("")}</dl></div>`);
  }

  // FBOs (origin + destination — each can be missing)
  if (leg.fbo && (leg.fbo.origin || leg.fbo.dest)) {
    const fboLines = (label, fbo) => {
      if (!fbo) return "";
      const out = [];
      if (fbo.name)  out.push(`<dt>${escText(label)}</dt><dd>${escText(fbo.name)}</dd>`);
      if (fbo.phone) out.push(`<dt></dt><dd>${escText(fbo.phone)}</dd>`);
      if (fbo.email) out.push(`<dt></dt><dd>${escText(fbo.email)}</dd>`);
      return out.join("");
    };
    const notes = [];
    if (leg.fbo.origin && leg.fbo.origin.notes) notes.push(`<div class="ops-notes">${escText(leg.fbo.origin.notes)}</div>`);
    if (leg.fbo.dest   && leg.fbo.dest.notes)   notes.push(`<div class="ops-notes">${escText(leg.fbo.dest.notes)}</div>`);
    blocks.push(`<div class="ops-block">
      <h5>FBOs</h5>
      <dl>${fboLines(leg.dep, leg.fbo.origin)}${fboLines(leg.dest, leg.fbo.dest)}</dl>
      ${notes.join("")}
    </div>`);
  }

  // Slot
  if (leg.slot && (leg.slot.required || leg.slot.notes || leg.slot.status)) {
    blocks.push(renderStatusBlock("Slot", leg.slot));
  }

  // PPR
  if (leg.ppr && (leg.ppr.required || leg.ppr.notes || leg.ppr.status)) {
    blocks.push(renderStatusBlock("PPR", leg.ppr));
  }

  // Customs
  if (leg.customs && (leg.customs.schengen || leg.customs.ukGarRequired || leg.customs.eapisRequired || leg.customs.notes)) {
    const rows = [];
    if (leg.customs.schengen)         rows.push(`<dt>Schengen</dt><dd>${escText(leg.customs.schengen)}</dd>`);
    if (leg.customs.ukGarRequired) {
      const s = leg.customs.ukGarStatus || "draft";
      rows.push(`<dt>UK GAR</dt><dd><span class="ops-status ${escAttr(s)}">${escText(s)}</span></dd>`);
    }
    if (leg.customs.eapisRequired) {
      const s = leg.customs.eapisStatus || "pending";
      rows.push(`<dt>eAPIS</dt><dd><span class="ops-status ${escAttr(s)}">${escText(s)}</span></dd>`);
    }
    const notes = leg.customs.notes ? `<div class="ops-notes">${escText(leg.customs.notes)}</div>` : "";
    blocks.push(`<div class="ops-block"><h5>Customs</h5><dl>${rows.join("")}</dl>${notes}</div>`);
  }

  // Fuel uplift
  if (leg.fuel && (leg.fuel.gal != null || leg.fuel.lb != null || leg.fuel.rationale)) {
    const rows = [];
    if (leg.fuel.gal != null) rows.push(`<dt>Gallons</dt><dd>${leg.fuel.gal} gal</dd>`);
    if (leg.fuel.lb != null)  rows.push(`<dt>Pounds</dt><dd>${leg.fuel.lb} lb</dd>`);
    if (leg.fuel.priceEstimate) rows.push(`<dt>Price</dt><dd>${escText(leg.fuel.priceEstimate)}</dd>`);
    const notes = leg.fuel.rationale ? `<div class="ops-notes">${escText(leg.fuel.rationale)}</div>` : "";
    blocks.push(`<div class="ops-block"><h5>Fuel uplift</h5><dl>${rows.join("")}</dl>${notes}</div>`);
  }

  // Overnight
  if (leg.overnight && (leg.overnight.hotel || leg.overnight.nights || leg.overnight.notes)) {
    const rows = [];
    if (leg.overnight.hotel)    rows.push(`<dt>Hotel</dt><dd>${escText(leg.overnight.hotel)}</dd>`);
    if (leg.overnight.nights)   rows.push(`<dt>Nights</dt><dd>${leg.overnight.nights}</dd>`);
    if (leg.overnight.rampFee)  rows.push(`<dt>Ramp fee</dt><dd>${escText(leg.overnight.rampFee)}</dd>`);
    const notes = leg.overnight.notes ? `<div class="ops-notes">${escText(leg.overnight.notes)}</div>` : "";
    blocks.push(`<div class="ops-block"><h5>Overnight</h5><dl>${rows.join("")}</dl>${notes}</div>`);
  }

  // Flight plan filing
  if (leg.filing && (leg.filing.window || leg.filing.route)) {
    const rows = [];
    if (leg.filing.window) rows.push(`<dt>Window</dt><dd>${escText(leg.filing.window)}</dd>`);
    if (leg.filing.route)  rows.push(`<dt>Route</dt><dd>${escText(leg.filing.route)}</dd>`);
    blocks.push(`<div class="ops-block"><h5>Flight plan</h5><dl>${rows.join("")}</dl></div>`);
  }

  // Free-text notes
  if (leg.notes) {
    blocks.push(`<div class="ops-block ops-block-full"><h5>Notes</h5><div>${escText(leg.notes)}</div></div>`);
  }

  if (blocks.length === 0) {
    return `<div class="leg-ops-empty">No operational data yet for this leg.</div>`;
  }
  return `<div class="leg-ops-content">${blocks.join("")}</div>`;
}

// Slot / PPR have an identical shape so we share a renderer.
function renderStatusBlock(label, statusObj) {
  const status = statusObj.status || "none";
  const rows = [];
  rows.push(`<dt>Required</dt><dd>${statusObj.required ? "Yes" : "No"}</dd>`);
  rows.push(`<dt>Status</dt><dd><span class="ops-status ${escAttr(status)}">${escText(status)}</span></dd>`);
  if (statusObj.window) rows.push(`<dt>Window</dt><dd>${escText(statusObj.window)}</dd>`);
  if (statusObj.via)    rows.push(`<dt>Via</dt><dd>${escText(statusObj.via)}</dd>`);
  if (statusObj.ref)    rows.push(`<dt>Ref</dt><dd>${escText(statusObj.ref)}</dd>`);
  const notes = statusObj.notes ? `<div class="ops-notes">${escText(statusObj.notes)}</div>` : "";
  return `<div class="ops-block"><h5>${escText(label)}</h5><dl>${rows.join("")}</dl>${notes}</div>`;
}

// escape helpers now live in ./escape.js — imported at the top of this file
// so the same rules apply everywhere in the app.
