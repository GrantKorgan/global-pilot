# Changelog

All notable changes to Global Pilot. Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added (Day 9.6 — Tail-number aircraft lookup)
- **Cloudflare Worker** (`worker/index.js`) gains a `/registry/{N-number}` endpoint that fetches the FAA N-Number Inquiry page server-side, parses the HTML for manufacturer / model / year / status / owner / Mode S hex / mfg serial, and returns JSON. Failures (not found, parse failure, upstream error) return structured `{ ok: false, reason }` so the UI can render a meaningful message. Tail normalization tolerates "2AK" and "N2AK"; rejects garbage before burning a round trip.
- **`src/wx/registry.js`** — frontend client for the new endpoint. Reads the worker URL from `localStorage["global-pilot:worker-url"]` (same source-of-truth as the CORS relay). Returns `{ ok: false, reason: "worker_not_configured" }` when no worker is deployed so the UI can prompt setup. `explainRegistryReason(reason)` maps codes to user-readable messages.
- **`src/data/aircraft-matcher.js`** — fuzzy matches FAA's canonical make/model strings (e.g. "CIRRUS DESIGN CORP" + "SF50", "TEXTRON AVIATION" + "525B") to a catalog entry key. Three-tier scoring: direct FAA-model-code map first (the table `MODEL_CODE_MAP` covers Citation 525 series, Challenger CL-600 codes, Gulfstream G-* designations, Phenom EMB-*, PC-12, TBM, PA-46), then manufacturer-family identification via the `MANUFACTURER_SYNONYMS` map (handles "TEXTRON" → Cessna, "BOMBARDIER INC" → Bombardier, etc.), then label/wikitext substring matching. When multiple catalog entries tie at the top score (e.g. SF50 G1/G2/G2+), prefers the most-recent variant by default.
- **Two-column aircraft picker on setup** (`src/ui/setup.js`) — fieldset with grouped dropdown on the left, tail-number input + "Look up →" button on the right, "or" divider in the middle. Below the tail input, an inline result box shows pending / success / error states. Success state displays FAA tail+year+make+model+owner+status, plus the matched catalog entry with a confidence score. On confident match, the dropdown auto-selects the matched key and the Wikipedia enrichment fetch fires for that key.
- **`handleTailLookup` in `src/app.js`** — orchestrator: setState pending → fetch registry → match catalog → setState success/error. Saves the tail to prefs on success so the input pre-fills next session. Enter key in the tail input triggers lookup without submitting the outer form.

### Added (Day 9.5 — Aircraft database + lazy Wikipedia enrichment)
- **`src/data/aircraft-catalog.js`** — comprehensive grouped catalog of contemporary in-market aircraft (~150 models). Categories: Jets (VLJ → ultra-long-range, 6 sub-tiers), Turboprops (single + twin), Piston (single NA + single TC + twin), LSA + experimental/kit, plus a "generic tiers" fallback group. Each entry carries `{ key, label, cruiseFt, wikipediaTitle?, perfKey? }`. Exports `AIRCRAFT_CATALOG` (grouped, for the dropdown) + `AIRCRAFT_BY_KEY` (flat lookup, backfills group cruise defaults).
- **`src/data/aircraft.js`** — slimmed to a single re-export of `AIRCRAFT_BY_KEY` as `AIRCRAFT`, keeping all existing consumers (`AIRCRAFT[state.aircraftKey]`) working unchanged.
- **`src/store/profiles.js`** — lazy aircraft-profile cache in `localStorage["global-pilot:aircraft-profiles:v1"]`. Schema: `{ key, source, fetchedAt, wikipediaTitle, summary, cruiseSpeedKt, maxSpeedKt, serviceCeilingFt, rangeNm, mtow_lb, takeoffRunFt, landingRunFt, crew, capacity, engines, notes }`. Any field can be null when source didn't publish it.
- **`src/wx/wiki.js`** — Wikipedia enrichment fetcher. Two-stage: REST `page/summary` for prose + canonical title (handles redirects), then Action API `parse?prop=wikitext` for the `{{Infobox aircraft type}}` block. Hand-written infobox parser handles balanced braces, `{{convert|...}}` templates, and inline unit suffixes (kt/kn/knots/KTAS, ft/feet/FL310/m, nm/nmi/km/mi, lb/lbs/kg). CORS-safe via `&origin=*`. Failure modes cached as `"wikipedia-miss"` or `"wikipedia-summary-only"` so we don't re-fetch every reload.
- **`src/ui/aircraft-select.js`** — shared `<optgroup>`-based dropdown markup, used by both the single-leg setup screen and the trip editor so they stay in sync.
- **`maybeEnrichAircraft(key)` in `src/app.js`** — fires when an aircraft key becomes "in use" (selected in either dropdown, saved on a trip, opened in a leg brief). De-dupes inflight fetches; re-renders the brief on completion if it's currently on screen.
- **Brief header shows fetched specs** — `renderAircraftSpecLine` in `src/ui/brief.js` adds a line below the existing `brief-sub` with `${cruise} kt cruise · ceiling ${ft} · range ${nm} · MTOW ${lb}` and the source attribution. Quiet "Fetching aircraft specs…" italic while in flight. "No Wikipedia data" italic on miss.

### Added (Day 9 — TL;DR summary + Next leg deep-link)
- **Top-of-brief summary card** (`renderBriefSummary` in `src/ui/brief.js`) — rendered between the leg-nav strip and the route map. A single overall verdict (`READY` / `REVIEW` / `STOP`, accent-colored left border + badge) above quick-look tiles (dep flight category + wind + DA · dest flight category + wind · SF50 takeoff if applicable · coverage status) and a bulleted callouts list pulled from the data already fetched. The verdict bumps monotonically — first STOP-class item locks STOP.
- **`computeVerdict` helper** in `src/ui/brief.js` — the rule set: destination LIFR/IFR → STOP, MVFR → REVIEW; dep IFR/LIFR → REVIEW; SF50 hard-warn → STOP, tight or off-chart DA → REVIEW; thunderstorms reported → STOP, other significant wx → REVIEW; gusts ≥ 35 kt → STOP, ≥ 25 kt → REVIEW; partial NOAA coverage (international) → REVIEW; 5+ AIRMETs/SIGMETs active → REVIEW. Each rule appends a one-sentence callout so the pilot sees WHY the verdict landed where it did.
- **"Next leg" card on welcome** (`src/ui/welcome.js`) — surfaces when any saved trip has a leg dated today-or-later. Picks the earliest upcoming leg across all trips. Shows trip name, T-X day countdown, route, leg N of M, and (when populated) destination FBO. Two buttons: "Open trip" (→ trip editor) and "Brief this leg →" (deep-links straight to that leg's brief).
- **`open-leg-from-welcome` handler** in `src/app.js` — sets `state.currentTripId` directly before calling `openLegBrief(legId)` so the leg-nav strip on the brief picks up the trip context.
- **Cockpit-mode and print CSS** updated for the new `brief-summary` card. Print de-colors the badge (white background, black border) so it reads on B&W printers.

### Added (Day 8 — Trip plan PDF binder)
- **New `tripPrint` view** (`src/ui/trips.js` → `renderTripPrint`) — cover page + one page per leg with the full ops snapshot (crew, FBOs, slot, PPR, customs, fuel, overnight, filing, notes). Reuses `renderLegOps` so anything the editor shows also lands in the binder.
- **Cover page** carries the trip name, date range, aircraft, total leg count, generated timestamp, plus a route-summary table (#/Date/Route) and trip-level notes block when present.
- **"Print trip plan →" button** on the trip editor (between Delete trip and Save trip details).
- **Trip-print CSS** with on-screen pagination (each section gets a card with accent-colored left border, scrollable preview) + `@media print` rules: `@page { margin: 0.5in }`, `page-break-after: always` per section, on-screen chrome (action buttons, action bar) hidden, leg-ops grid forced to two columns on paper.
- **Why no weather snapshot**: for a 6-week trip, weather captured pre-departure is stale by leg 5. The binder is the *operations* artifact — stable, printed once before the trip. Day-of weather lives in the brief view, which already has its own print CSS for kneeboard PDFs.

### Added (Day 7 — SF50 G2+ takeoff verdict)
- **`src/data/sf50.js`** — Cirrus Vision Jet SF50 G2+ (N2AK) performance profile. MTOW 6,000 lb, service ceiling FL310, cruise FL280, takeoff distance over a 50' obstacle indexed by density altitude (POH-derived piecewise-linear table). Margin thresholds for the verdict (ok ≥ 1,500 ft / tight ≥ 500 ft / warn < 500 ft) and an off-chart DA cutoff (10,000 ft).
- **`src/calc/perf.js`** — pure functions `sf50TakeoffDistanceFt(da)` and `sf50TakeoffVerdict({ requiredFt, longestRunwayFt, densityAltFt })`. Verdict status: `ok` / `tight` / `warn` / `unknown` (when runway length unavailable, e.g. non-Tahoe legs).
- **SF50 entry in `src/data/aircraft.js`** — `sf50_g2plus` key with `perfKey` pointer to the profile. Placed first so new users default to it. Generic tiers preserved for everyone else.
- **Phase-1 brief now shows SF50 verdict** — when aircraft = SF50, the runway phase-grid grows a 5th tile: required takeoff distance over a 50' obstacle at current DA, colored ok/mid/high by margin, sub-line shows longest runway + margin or "verify on AirNav" if runway length unknown. Below the runway table an alert (tight margin / hard warning / off-chart DA) appears when the verdict isn't `ok`. Runway crosswind table grows a Length column.
- **Runway lengths added to all six Tahoe `DEPARTURES`** — KRNO (11,002 / 9,000 / 6,102), KTRK (7,001 / 4,650), KRTS (9,000 / 7,605), KCXP (6,099), KMEV (7,400 / 5,300), KTVL (8,544). Needed for the SF50 verdict to compute real margins at home base.
- **Europe 2026 fixture** switched `aircraftId: "turbine"` → `"sf50_g2plus"` so the 24 real-trip legs all brief against the SF50 profile.

### Added (Day 6.5 — Cafe finder Layer 1)
- **`src/data/airports-food.js`** — broader "food on field" list, separate from `CAFES`. 40+ hand-curated US fly-in airports across NorCal, SoCal, PacNW, Midwest, Northeast, Mid-Atlantic, Southeast, South Central, and Mountain West. Lighter schema than CAFES (no full blurb — just airport, city, region, short note, source tag). Designed for auto-import from FAA NASR.
- **`scripts/import-nasr.mjs`** — monthly importer that downloads the FAA NASR ZIP, parses APT.txt's E70 services subrecord for `FOOD` / `RESTAURANT` flags, filters to lower-48, and merges with curated entries (curated wins on conflict, never overwritten). Documented column offsets to verify against `Layout_Data/APT-RECORDS.pdf` on first successful run. Supports `NASR_LOCAL=<path>` env var for manual ZIP override when the FAA's bot wall 503s a dev laptop.
- **`.github/workflows/refresh-airports.yml`** — GH Action that runs the importer on the 1st of each month, opens a PR if `airports-food.js` changes. Manual trigger via `workflow_dispatch`. Uses peter-evans/create-pull-request so changes go through review.
- **Cafes UI now renders two sections** — "Featured cafes" (the full-blurb tier) and "More airports with food on field" (Layer 1 lighter cards). One search box filters both simultaneously. Footer documents the NASR auto-refresh path.

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
