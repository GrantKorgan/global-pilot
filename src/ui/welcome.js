// src/ui/welcome.js
// ---------------------------------------------------------------------------
// Welcome screen — three entry-points: multi-leg trip planner, single-leg
// brief, and the cafe finder. When an active trip has an upcoming leg, a
// "Next leg" card surfaces at the top with one-tap deep-linking into that
// leg's brief.
//
// Renders an HTML string; event wiring lives in app.js.
// ---------------------------------------------------------------------------

import { getAllTrips } from "../store/trips.js";
import { escText, escAttr } from "./escape.js";

export function renderWelcome(state, prefs) {
  const nextLegCard = renderNextLegCard();

  return `
    <div class="hero-bg welcome-bg">
      <div class="screen">
        <img src="logos/globalpilot-monogram-wing.png"
             alt="Global Pilot"
             class="welcome-logo"
             width="980" height="280">
        <p class="lead">What can we plan today?</p>

        ${nextLegCard}

        <!-- Multi-leg trip planner entry-point -->
        <button class="trip-promo" data-action="go-to-trips">
          <div class="trip-promo-text">
            <strong>Planning a multi-leg trip?</strong>
            <span>Build a chain of legs with weather + ops per leg, persistent across sessions.</span>
          </div>
          <span class="trip-promo-arrow">Trips →</span>
        </button>

        <!-- Single-leg brief entry-point -->
        <button class="trip-promo" data-action="go-to-single-brief">
          <div class="trip-promo-text">
            <strong>Just need a one-leg brief?</strong>
            <span>Pick departure + destination + aircraft, get a phase-of-flight weather brief.</span>
          </div>
          <span class="trip-promo-arrow">Single-leg brief →</span>
        </button>

        <!-- Cafe finder entry-point — in-app curated list with external
             links to AirNav + flytolunch.com per cafe. -->
        <button class="trip-promo" data-action="go-to-cafes">
          <div class="trip-promo-text">
            <strong>Looking for a $1,000 cheeseburger?</strong>
            <span>Curated list of fly-in cafes pilots actually visit. Pilot lunch tradition since the 1950s.</span>
          </div>
          <span class="trip-promo-arrow">Cafe finder →</span>
        </button>

        <p class="footnote">
          Live data from <a href="https://aviationweather.gov" target="_blank" rel="noopener">NOAA Aviation Weather Center</a>
          via free CORS proxy.
          Always cross-check before flight.
        </p>
      </div>
    </div>
  `;
}

// Surface the next upcoming leg across all saved trips. Returns "" when
// no trip has a leg dated today-or-later — the welcome screen reverts to
// just the three promo cards.
//
// "Today" is local-time YYYY-MM-DD. Leg dates are stored as YYYY-MM-DD
// strings, so lexical comparison works for date ordering.
function renderNextLegCard() {
  const today = todayIso();
  const trips = getAllTrips();
  if (!trips.length) return "";

  // Build candidate list: for each trip, find its earliest leg with date >= today.
  let best = null;
  for (const trip of trips) {
    if (!trip.legs || !trip.legs.length) continue;
    const upcoming = trip.legs
      .filter((l) => l.date && l.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!upcoming) continue;
    if (!best || upcoming.date < best.leg.date) {
      best = { trip, leg: upcoming, legIdx: trip.legs.indexOf(upcoming) };
    }
  }

  if (!best) return "";

  const { trip, leg, legIdx } = best;
  const days = daysUntil(leg.date);
  const countdown = days === 0
    ? "Today"
    : days === 1
      ? "Tomorrow"
      : `T-${days} day${days === 1 ? "" : "s"}`;

  const fboLine = leg.fbo && leg.fbo.dest && leg.fbo.dest.name
    ? `<span class="next-leg-fbo">Dest FBO: ${escText(leg.fbo.dest.name)}</span>`
    : "";

  return `
    <div class="next-leg-card">
      <div class="next-leg-head">
        <span class="next-leg-eyebrow">Next leg · ${escText(trip.name)}</span>
        <span class="next-leg-countdown">${escText(countdown)}</span>
      </div>
      <div class="next-leg-body">
        <div class="next-leg-route">
          <span class="next-leg-icao">${escText(leg.dep)} → ${escText(leg.dest)}</span>
          <span class="next-leg-date">${escText(leg.date)} · leg ${legIdx + 1} of ${trip.legs.length}</span>
        </div>
        ${fboLine}
      </div>
      <div class="next-leg-actions">
        <button class="ghost-btn"
                data-action="open-trip"
                data-trip-id="${escAttr(trip.id)}">
          Open trip
        </button>
        <button class="primary-btn"
                style="margin-top:0;"
                data-action="open-leg-from-welcome"
                data-trip-id="${escAttr(trip.id)}"
                data-leg-id="${escAttr(leg.id)}">
          Brief this leg →
        </button>
      </div>
    </div>
  `;
}

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysUntil(isoDate) {
  const today = new Date(todayIso());
  const target = new Date(isoDate);
  const diffMs = target - today;
  return Math.round(diffMs / 86400000);
}
