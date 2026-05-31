# Global Pilot

A phase-of-flight weather brief and (eventually) multi-leg trip planner for pilots. Currently focused on Lake Tahoe area departures; designed to scale to global multi-leg trip planning with aircraft-specific performance, AI-assisted routing, and a "$1,000 hamburger" airport-cafe database. Pulls live data from NOAA's Aviation Weather Center and renders a brief by phase: runway → climbout → cruise → descent → approach → ground.

**Live:** https://grantkorgan.github.io/global-pilot/

## Why this exists

Standard sources (1-800-WX-BRIEF, ForeFlight, SkyVector) give you all the data, but for a Tahoe pilot the things that actually matter — density altitude at Truckee, mountain wave when the Sierra winds aloft kick up, crosswind on a specific runway — get buried. This brief surfaces the Tahoe-specific signals at the top of each phase.

## Quick start

**Just want to use it?** Open the live URL above on any device.

**Want to run locally?** Clone the repo and double-click `index.html`. No build step, no install, no API key.

```sh
git clone https://github.com/GrantKorgan/global-pilot.git
cd global-pilot
open index.html
```

## Features

- Six Tahoe-area departure airports preloaded with field elevations + runway headings: KRNO, KTRK, KRTS, KCXP, KMEV, KTVL
- Aircraft tiers from normally-aspirated piston up through heavy jet — drives winds-aloft altitude selection
- Six-phase brief: runway, climbout, cruise, descent, approach, ground
- Density altitude with red-flag threshold at 8,000 ft (the real Tahoe killer)
- Crosswind component per runway + auto-selected preferred runway by headwind
- Mountain-wave warning when 12K/18K winds aloft are westerly ≥ 30/50 kt
- Winds aloft pulled from the FB forecast station closest to the destination, not just departure
- Route map with Streets / Satellite toggle (Leaflet + OpenStreetMap + Esri)
- Print / PDF button with kneeboard-optimized layout
- Remembers your last departure + aircraft
- Diagnostics panel auto-opens on any feed issue so you can see exactly what failed

## Architecture

**Single static HTML file.** No build, no server, no `node_modules`. The browser is the entire runtime.

**Data source:** NOAA Aviation Weather Center (`aviationweather.gov/api/data/`) — the same feed Leidos / 1-800-WX-BRIEF uses under the hood. We pull METAR, TAF, PIREP, AIRMET/SIGMET, and FB (winds & temperatures aloft).

**CORS workaround:** AWC's API doesn't send `Access-Control-Allow-Origin` headers, so browsers refuse direct fetches. We relay through `api.allorigins.win` (primary) with `api.codetabs.com` as automatic fallback. Same data, just hopped. See [Replacing the public proxies](#replacing-the-public-cors-proxies-production-fix) below for the production-grade fix.

**Map:** Leaflet 1.9.4 loaded from `unpkg.com` CDN. OpenStreetMap + Esri World Imagery tiles (both free, no key).

## File structure

```
index.html          # Whole app — markup + CSS + JS in one file
README.md           # This file
CHANGELOG.md        # Version history
LICENSE             # MIT
.gitignore
```

The `index.html` is internally organized (see the header comment at the top of the file):

| Section | Purpose |
|---|---|
| `<style>` | All CSS, including `@media print` |
| `1. PROXY + FETCHERS` | CORS-proxied calls to NOAA AWC |
| `2. DATA TABLES` | `DEPARTURES`, `AIRCRAFT`, `FB_STATIONS` — extend these |
| `3. STATE + PERSISTENCE` | State object + localStorage helpers |
| `4. CALCULATORS` | Density altitude, crosswind, haversine |
| `5. FB PARSER` | Winds-aloft text decoder |
| `6. METAR HELPERS` | Field accessors |
| `7. RENDERERS` | One function per screen / phase |
| `9. MAP` | Leaflet initialization |
| `10. EVENT HANDLERS` | Click + submit wiring |

## Extending

**Add a departure airport** — add an entry to `DEPARTURES` in `index.html`:

```js
KCCR: {
  name: "Concord/Buchanan",
  elev: 26, lat: 37.99, lon: -122.06,
  runways: [
    { id: "01R/19L", hdg:  14 },
    { id: "14R/32L", hdg: 142 },
  ],
  fbStation: "OAK",  // nearest FB station
}
```

It'll appear on the welcome screen automatically.

**Add an aircraft profile** — add an entry to `AIRCRAFT`:

```js
sr22: { label: "Cirrus SR22 normally aspirated", cruiseFt: 11000 }
```

**Add a destination FB forecast station** — add an entry to `FB_STATIONS` with lat/lon. The nearest-station picker will start using it whenever a destination is closer to it than any other.

## Development

No build step. Workflow is:

1. Open `index.html` in your editor.
2. Open the same file in a browser.
3. Edit → save → refresh browser.

Browser dev tools (`F12` / `Cmd+Opt+I`) show console errors and network calls — open the Network tab to watch the NOAA fetches go through the proxy.

To preview changes before pushing:

```sh
# Optional: serve over localhost (sidesteps any file:// quirks)
cd ~/Desktop/global-pilot
python3 -m http.server 8000
# Then visit http://localhost:8000/
```

Deploy is automatic — every push to `main` triggers GitHub Pages to rebuild within ~60 seconds.

## Roadmap

Things on the list, roughly in priority order:

1. **Self-hosted CORS proxy** via Cloudflare Worker (zero cost, zero rate limits, ~10 min setup). Removes the third-party proxy dependency. See [section below](#replacing-the-public-cors-proxies-production-fix).
2. **NEXRAD radar overlay** on the route map (AWC publishes radar tiles).
3. **Route TAFs along the way** — sample 2–4 intermediate fields between departure and destination, not just the endpoints.
4. **Custom airport list** — let users add their home fields via an in-app form (saved to localStorage).
5. **Save/share the brief** — export to PDF (beyond `window.print()`) or shareable URL with state encoded.
6. **Profile-based VFR/IFR cards** — different alert thresholds based on rules.
7. **Smoke layer** for summer wildfire season (NOAA HRRR-Smoke).
8. **Mountain-pass weather** — Donner, Echo Summit specific micro-conditions.

## Replacing the public CORS proxies (production fix)

The public proxies (`allorigins.win`, `codetabs.com`) are free and zero-config but they're not guaranteed reliable. The clean fix is your own CORS proxy as a Cloudflare Worker.

The Worker is ~15 lines:

```js
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");
    if (!target) return new Response("missing ?url=", { status: 400 });
    const upstream = await fetch(target);
    const headers = new Headers(upstream.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(upstream.body, { status: upstream.status, headers });
  }
};
```

Setup:

1. Sign up for Cloudflare (free).
2. Workers & Pages → Create → Hello-World template → paste the code above → Deploy.
3. Copy your worker URL: `https://<name>.<account>.workers.dev`
4. In `index.html`, replace the `PROXIES` array with:
   ```js
   const PROXIES = [
     (url) => `https://<name>.<account>.workers.dev/?url=${encodeURIComponent(url)}`,
   ];
   ```

Free tier is 100,000 requests/day. A heavy day of personal use is ~30 requests, so you're not going to hit it.

## Credits

- **Data:** [NOAA Aviation Weather Center](https://aviationweather.gov)
- **Map tiles:** OpenStreetMap contributors, Esri World Imagery
- **Map library:** [Leaflet](https://leafletjs.com)
- **CORS relays:** [allorigins.win](https://allorigins.win), [codetabs.com](https://codetabs.com)

Built by Grant Korgan with Claude.

## License

MIT — see [LICENSE](LICENSE).
