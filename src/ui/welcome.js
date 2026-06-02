// src/ui/welcome.js
// ---------------------------------------------------------------------------
// Welcome screen — two entry-points: multi-leg trip planner, or a single-
// leg brief. Renders HTML string; event wiring lives in app.js.
//
// The six hardcoded Tahoe airport tiles were removed on Day 5+ as the
// product expanded beyond a Tahoe-specific tool. Tahoe data still lives
// in src/data/airports.js → DEPARTURES and is used by the brief renderer
// when a user types KRNO / KTRK / KTVL etc. as a departure ICAO.
// ---------------------------------------------------------------------------

export function renderWelcome(state, prefs) {
  return `
    <div class="hero-bg welcome-bg">
      <div class="screen">
        <h1>Welcome, pilot</h1>
        <p class="lead">What can we plan today?</p>

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

        <!-- Cafe finder entry-point — external link to flytolunch.com for v0.
             Future v4 builds an in-app curated database with a map. -->
        <a class="trip-promo" href="https://www.flytolunch.com/" target="_blank" rel="noopener noreferrer">
          <div class="trip-promo-text">
            <strong>Looking for a $1,000 cheeseburger?</strong>
            <span>Find an airport cafe on the field — pilot lunch tradition since the 1950s. Opens flytolunch.com in a new tab.</span>
          </div>
          <span class="trip-promo-arrow">Cafe finder →</span>
        </a>

        <p class="footnote">
          Live data from <a href="https://aviationweather.gov" target="_blank" rel="noopener">NOAA Aviation Weather Center</a>
          via free CORS proxy.
          Always cross-check before flight.
        </p>
      </div>
    </div>
  `;
}
