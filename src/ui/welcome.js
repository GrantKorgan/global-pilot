// src/ui/welcome.js
// ---------------------------------------------------------------------------
// Welcome screen: a grid of the six Tahoe-area departure airports.
// Renders HTML string; event wiring lives in app.js.
// ---------------------------------------------------------------------------

import { DEPARTURES } from "../data/airports.js";

export function renderWelcome(state, prefs) {
  const remembered = prefs && prefs.departure;
  const buttons = Object.entries(DEPARTURES).map(([icao, info]) => `
    <button class="dep-btn ${remembered === icao ? "remembered" : ""}" data-icao="${icao}">
      <div class="dep-icao">${icao}</div>
      <div class="dep-name">${info.name}</div>
      <div class="dep-elev">${info.elev.toLocaleString()} ft MSL</div>
    </button>
  `).join("");
  return `
    <div class="hero-bg welcome-bg">
      <div class="screen">
        <h1>Welcome, pilot</h1>
        <p class="lead">Where are you taking off from today?</p>

        <!-- Multi-leg trip planner entry-point -->
        <button class="trip-promo" data-action="go-to-trips">
          <div class="trip-promo-text">
            <strong>Planning a multi-leg trip?</strong>
            <span>Build a chain of legs with weather per leg, persistent across sessions.</span>
          </div>
          <span class="trip-promo-arrow">Trips →</span>
        </button>

        <p class="quick-brief-label">Or grab a quick single-leg brief:</p>
        <div class="dep-grid">${buttons}</div>
        <p class="footnote">
          Live data from <a href="https://aviationweather.gov" target="_blank" rel="noopener">NOAA Aviation Weather Center</a>
          via free CORS proxy.
          Always cross-check before flight.
        </p>
      </div>
    </div>
  `;
}
