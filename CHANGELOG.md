# Changelog

All notable changes to Global Pilot. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added (Day 6 — iPad polish)
- **Wake lock** (`src/ui/wakelock.js`) — uses the Screen Wake Lock API to keep the iPad screen on while a brief is open. Acquired in `render()` when `state.view === "brief"` and data is loaded; released on any other view. Handles `visibilitychange` so it re-acquires when the pilot switches to ForeFlight and back. Fails silently on unsupported browsers.
- **Leg-nav strip on the brief** — when the brief was opened from a trip leg (`briefSource === "trip"`), a strip at the top of the brief shows "Leg N of M · {trip name}" with `← Prev` and `Next →` buttons. Disabled at endpoints. Lets the pilot jump between the 24 Europe legs without bouncing back to the trip editor.
- **Cockpit mode** — high-contrast theme for bright daylight. Pure white background, black text, bold borders, hero-photo wash removed. Persistent toggle button (top-right, fixed-position, lives outside `#app` so it survives re-renders). State persisted in `localStorage["global-pilot:cockpit"]`. Print CSS hides the toggle.
- **`@media (pointer: coarse)` touch-target polish** — bumps `.back-btn`, `.ghost-btn`, `.primary-btn`, `.leg-delete`, all form inputs, the `.cafe-card-links`, and the `.leg-nav-btn` to Apple-HIG 44px-ish hit areas on touch devices. Desktop unchanged. The leg-ops `<details>` summary and raw-METAR `<details>` summary get larger tap areas too.

### Added (Day 5.6 — Cafe finder expanded)
- **`src/data/cafes.js`** expanded from 10 → 21 entries with `region` field across 8 US regions (NorCal, SoCal, Southwest, Pacific NW, Midwest, Mid-Atlantic, Northeast, Southeast). Header comment now documents the v4 plan (FAA NASR + Google Places). Search now matches against region; each card shows a region pill.

### Added (Day 5.5 — Cafe finder)
- **`src/data/cafes.js`** + **`src/ui/cafes.js`** — in-app curated airport-cafe browser with live search. Each cafe links out to AirNav (airport info) and flytolunch.com (current cafe details). Cafe promo card on welcome now navigates in-app instead of redirecting to flytolunch.com.

### Changed (Day 5.5)
- Welcome verbiage: "Just need a one-off brief?" → "Just need a one-leg brief?"
- Welcome layout: removed the six hardcoded Tahoe departure tiles. Three balanced promo cards now: Trips, Single-leg brief, Cafe finder.
- Setup screen now collects departure ICAO + destination ICAO + aircraft (was destination + aircraft only — departure used to be pre-set by the tile click).

### Added (Day 5 — The Real Trip)
- **`src/data/fixtures/europe-2026.js`** — the full N2AK Reno → Europe → Reno trip as a structured `Trip` object. 24 legs (9 eastbound + 8 intra-Europe + 7 westbound), sourced from `N2AK_master_itinerary_consolidated.md`. Intra-Europe legs carry full operational data: FBO contacts with phone/email, slot status with booking window, PPR status, Schengen/UK GAR/eAPIS requirements with state, fuel uplift target with rationale, overnight + ramp fee estimates, flight-plan filing window, and leg-specific notes. Ferry legs carry the lighter set Air Journey controls.
- **"Load Europe 2026 trip" button** on the Trips list screen. One click seeds all 24 legs + ops data into localStorage and jumps to the editor. Idempotent — once the trip exists, the button hides; subsequent clicks would just re-open the existing trip. The user picked "App is canonical" yesterday; this is how the canonical version arrives.
- **Operations expander per leg** — each leg row now wraps a `<details class="leg-ops">` showing crew · FBOs · slot · PPR · customs · fuel · overnight · filing · notes. Empty fields are suppressed; ferry legs with sparse data show only what's populated. New `renderLegOps()` + `renderStatusBlock()` helpers in `src/ui/trips.js`.
- **`ops-status` pill component** in CSS for slot / PPR / GAR / eAPIS status — confirmed (green), requested / draft / pending (amber), none (muted).

### Changed
- `.leg-row` restructured from a 3-column grid to a flex column wrapping `.leg-row-head` (the existing compact route line) and `.leg-ops` (the new expander). Visual: each leg is now one card containing both the compact header and the collapsible ops panel.
- Mobile breakpoint adjusted accordingly — `.leg-row-head` becomes 2-column on narrow screens, and `.leg-ops-content` collapses to single column.

### Fixed (Day 4 — P0 crash + Europe coverage)
- **Crash on non-Tahoe trip-leg briefs.** `src/ui/brief.js` was dereferencing `DEPARTURES[state.departure].fbStation` directly inside the cruise renderer. For any leg whose departure isn't one of the six hardcoded Tahoe fields (i.e., every European leg of the user's real trip), this threw `TypeError` and the brief blanked. Fixed by passing the already-resolved `dep` object to `renderCruiseSection` and reading `dep.fbStation`.

### Added (Day 4)
- **`src/ui/escape.js`** — single-source-of-truth `escText` and `escAttr`. Replaces the local copies that lived in `trips.js`. Applied across `brief.js`, `trips.js`, and `map.js` to every interpolation of NOAA-sourced strings (raw METAR, raw TAF, airport names, AIRMET hazard/severity/type) plus all `data-*` attributes. Removes a wide XSS surface flagged by the security review.
- **CSP `<meta>` tag** in `index.html` — defense in depth. Browser refuses to execute scripts from anywhere except this origin + `unpkg.com` (Leaflet). Lists exactly which proxy hosts are allowed in `connect-src`.
- **`isInConus(lat, lon)`** in `src/calc/geo.js` — CONUS bounding-box check used to gate which NOAA AWC feeds apply to a given leg.
- **International-leg coverage banner** — when either departure or destination is outside CONUS, a prominent "supplement only" banner renders above the phase sections, the diagnostics panel marks the CONUS-only feeds (AIRMETs, winds aloft) as "n/a — outside CONUS," and the cruise/climbout sections show "use ForeFlight" instead of em-dashes for the winds-aloft block. Eliminates the "green check but actually missing critical data" failure mode flagged by both the aviation and tech-lead reviews.

### Changed (Day 4)
- `synthesizeDep()` in `brief.js` now returns `fbStation: null` when the airport is outside CONUS, instead of pointing at the nearest US FB station thousands of miles away.
- `renderCruiseSection` signature: takes `dep` as a parameter (was reading the unresolved `DEPARTURES[state.departure]` directly).
- `renderDiagnostics` signature: takes an `outOfCoverage` flag so the panel can label CONUS-only feeds as `n/a — outside CONUS` instead of `empty`.

### Added (Day 3 — Trip Planner)
- **Trip planner screens** (`src/ui/trips.js`) — list view and editor view for multi-leg trips. Trips persist in `localStorage` under `global-pilot:trips:v1`. Each trip has name, aircraft, date range, and an ordered list of legs.
- **`src/store/trips.js`** — CRUD helpers (`getAllTrips`, `getTrip`, `saveTrip`, `deleteTrip`) plus `exportTripJson` / `importTripJson` for sharing trips as `.json` files (the "sneakernet" path). Every save runs `assertTrip` so malformed data is caught loudly at write time.
- **Welcome screen now has a "Trips →" entry-point** above the airport grid — the multi-leg planner is now a first-class path alongside the quick-brief.
- **Click any leg's "Brief →"** opens the existing weather brief scoped to that leg's dep/dest/aircraft. Back from a leg-brief returns to the trip editor (`state.briefSource` controls this).
- **Brief now works for any ICAO**, not just the six Tahoe-area fields. When the departure isn't in the hardcoded `DEPARTURES` table, a `synthesizeDep()` helper builds an equivalent object from the departure METAR (elev + lat/lon + nearest FB station via coordinate lookup). Runway-specific bits (per-runway crosswind table, preferred-runway pick) gracefully degrade with a "see official chart" note for fields without hardcoded runway data.

### Changed
- `src/app.js` grew new state fields (`currentTripId`, `briefSource`) and new view branches (`trips`, `tripEdit`). The brief-fetching logic was extracted into a `loadBrief()` helper so both the quick-brief path and the trip-leg path share it.
- `.gitignore` now excludes `worker/.wrangler/` (wrangler's local deploy cache).

### Added
- **Cloudflare Worker CORS relay** (`worker/index.js`, ~60 lines incl. comments + `worker/wrangler.toml`). One-time setup walkthrough at `WORKER_SETUP.md`. Replaces the flaky public proxies with a self-owned relay on Cloudflare's free tier. Public proxies remain as automatic fallback. Activate by setting `localStorage["global-pilot:worker-url"]` after deploying.
- **`src/data/types.js`** — JSDoc typedefs for `Trip`, `Leg`, `Aircraft`, plus their sub-shapes (`Contact`, `SlotStatus`, `Customs`, `FuelUplift`, `Overnight`, `Filing`, `CrewMember`). Exports `assertLeg()` and `assertTrip()` runtime validators (loud, helpful errors when data is malformed) and `newLeg()` / `newTrip()` factories. Day 3's Trip Planner UI consumes these.
- **Diagnostics panel now shows the active CORS relay** — "via your Cloudflare Worker" if you've configured one, "public proxies" otherwise. Visible confirmation that the Worker setup worked.

### Changed
- **`src/wx/proxy.js`** — proxy chain now tries the user's Worker first (if `localStorage["global-pilot:worker-url"]` is set), then falls back to public proxies. Exports `PROXY_INFO` so the diagnostics panel can display the current state.

### Changed (prior)
- **Split the single `index.html` into ES modules under `src/`.** v2 was ~1500 lines in one file; v3 is a 345-line HTML shell (markup + CSS) plus ~13 small JS modules organized by concern: `data/`, `store/`, `calc/`, `wx/`, `ui/`, and `app.js` at the root. Zero behavior change — same brief, same fetches, same UI. Day 1 of the v3 build-out plan; every later day rides on this foundation. **Local development now requires a static server** (`python3 -m http.server 8000`) because browsers block `file://` ES modules; live URL is unaffected.
- **Renamed project** from "Tahoe Pilot Weather" to **Global Pilot** to match expanded scope toward global multi-leg trip planning. GitHub repo renamed (`tahoe-pilot-weather` → `global-pilot`; GitHub auto-redirects the old URL). Local folder renamed (`~/Desktop/tahoe-pilot-weather` → `~/Desktop/global-pilot`). Welcome heading shortened to "Welcome, pilot". Page `<title>` updated.
- `localStorage` key migrated from `tahoe-pilot-weather:v2` → `global-pilot:v1`. One-time migration code in `loadPrefs()` copies any existing prefs to the new key so users don't lose their saved last-used departure/aircraft.
- Refactored hero styling into a shared `.hero-bg` class with per-screen `.welcome-bg` / `.setup-bg` rules that only set `background-image`. Heroing another screen later is now a one-line addition.

### Added
- **Hero photo on welcome screen** (`hero.jpg`) — full-bleed Vision Jet at sunset above the clouds with a dark gradient overlay (45–80% opacity, top to bottom) so the airport cards stand out. Heading and subhead switched to white with text shadow on the welcome view only.
- **Hero photo on setup screen** (`hero-setup.jpg`) — Cirrus SR + Vision Jet pair flying over coastline, same dark-overlay treatment as the welcome screen. Back link, form labels, and inputs adjusted for legibility on the darker background.

## [v2] — 2026-05-30

### Added
- **CORS proxy layer** with `api.allorigins.win` as primary and `api.codetabs.com` as automatic fallback. AWC fetches now succeed from any browser.
- **Diagnostics panel** that auto-opens whenever any data feed fails. Shows per-endpoint status (ok / empty / err) and the actual error message. Also shows which FB forecast station was picked for the destination and its distance from the field.
- **localStorage persistence** for last-used departure airport, aircraft type, and last destination ICAO. Welcome screen tags the remembered departure with "last used"; setup form pre-fills the saved fields.
- **Smart destination FB station** — coordinate-based lookup over ~50 FAA winds-aloft forecast stations covering CONUS. Cruise and Descent sections now show **two columns**: departure-region winds and destination-region winds.
- **Route map** at the top of every brief: Leaflet 1.9.4 from unpkg CDN, OpenStreetMap base layer with an Esri World Imagery satellite toggle (top-right control), markers at both endpoints, polyline along the route.
- **Print / PDF button** with kneeboard-optimized print CSS: page breaks between phases, hides the map and interactive controls, forces light mode.
- **MIT LICENSE** + project README + this changelog.

### Fixed
- Root cause of v1's "No METAR data returned" error: AWC API does not send `Access-Control-Allow-Origin` headers, so every browser was silently blocking the fetches. v1 caught the rejected promises and showed a generic empty-data message; v2 routes through a CORS proxy so the fetches actually succeed.
- Improved error reporting: when the proxy itself fails, we now show the upstream HTTP status code instead of a generic "couldn't build the brief" message.

### Internal
- File grew from ~750 to ~1000 lines, still all in one file. Section headers in the script block were renumbered to reflect new sections (proxy, persistence, map).

## [v1] — 2026-05-30

### Added
- Welcome screen with six Tahoe-area departure airports (KRNO, KTRK, KRTS, KCXP, KMEV, KTVL) and their field elevations as cards.
- Setup screen with destination ICAO input and a six-tier aircraft dropdown: NA piston, turbo piston, turbine single (Vision Jet / TBM class), mid jet, super-mid jet, heavy jet.
- Six-phase brief structure: runway, climbout, cruise, descent, approach, ground.
- Density altitude computation (Koch chart approximation) with red-flag threshold at 8,000 ft.
- Crosswind component computed per runway; preferred runway auto-selected by max-headwind heuristic.
- Mountain-wave warning when 12,000 ft winds are westerly (230–310°) ≥ 30 kt, and stronger warning at 18,000 ft ≥ 50 kt.
- Live METAR, TAF, PIREP, and AIRMET/SIGMET fetches from NOAA's Aviation Weather Center.
- FB (winds & temperatures aloft) text-format parser converting `ddffttt` tokens to structured `{dir, spd, tempC}` objects per altitude band.
- Significant-weather flag parser for raw METAR `wxString` (TS, FG, FZ, GR, FU, etc.).
- Light + dark mode via `prefers-color-scheme`.
- Single-file architecture: HTML + CSS + JS all in one file, no build step, no dependencies. Designed to work whether double-clicked locally or hosted on the web.

### Known issues
- AWC API doesn't send CORS headers; browsers block all fetches. Workaround landed in v2.
