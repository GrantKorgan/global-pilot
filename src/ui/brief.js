// src/ui/brief.js
// ---------------------------------------------------------------------------
// The phase-of-flight brief — orchestrator + six phase renderers + diagnostics
// panel + PIREPs/AIRMETs helpers. This is the longest module in the app, but
// it's all one concept: turn the fetched data into a brief page.
//
// Each phase renderer takes the minimum state it needs and returns HTML.
// The orchestrator (renderBrief) stitches them together.
// ---------------------------------------------------------------------------

import { DEPARTURES } from "../data/airports.js";
import { AIRCRAFT } from "../data/aircraft.js";
import { getTrip } from "../store/trips.js";
import { pressureAltitude, densityAltitude } from "../calc/atmosphere.js";
import { crosswindComponent, preferredRunway } from "../calc/wind.js";
import { distanceNm, nearestFBStation, isInConus } from "../calc/geo.js";
import { parseFB, closestFBAltitude } from "../wx/fb.js";
import { PROXY_INFO } from "../wx/proxy.js";
import {
  getLatestMetar, getTaf, altimeterInHg, metarFltCat, parseSignificantWeather,
} from "../wx/metar.js";
import {
  formatWind, formatFBWind, formatAltitude, formatCeiling, formatObsTime,
} from "./format.js";
import { escText, escAttr } from "./escape.js";

// ---- Leg-nav strip (when brief was opened from a trip leg) ----------------
// Lets the pilot jump between legs in the same trip without going back to
// the trip editor. Returns empty string for non-trip briefs.

function renderLegNav(state) {
  if (state.briefSource !== "trip" || !state.currentTripId) return "";
  const trip = getTrip(state.currentTripId);
  if (!trip || !trip.legs.length) return "";
  const idx = trip.legs.findIndex(
    (l) => l.dep === state.departure && l.dest === state.destination
  );
  if (idx < 0) return "";

  const total = trip.legs.length;
  const hasPrev = idx > 0;
  const hasNext = idx < total - 1;
  const cur = trip.legs[idx];

  return `
    <div class="leg-nav">
      <button class="leg-nav-btn" data-action="prev-leg" ${hasPrev ? "" : "disabled"} aria-label="Previous leg">← Prev</button>
      <div style="text-align:center;flex:1;">
        <div class="leg-nav-position">Leg ${idx + 1} of ${total} · ${escText(trip.name)}</div>
        <div class="leg-nav-current">${escText(cur.dep)} → ${escText(cur.dest)} · ${escText(cur.date)}</div>
      </div>
      <button class="leg-nav-btn" data-action="next-leg" ${hasNext ? "" : "disabled"} aria-label="Next leg">Next →</button>
    </div>
  `;
}

// ---- Departure airport synthesis -------------------------------------------
// For non-Tahoe departures (any leg of a trip — e.g. EGKB, LEPA), we build
// a `dep`-shaped object from the METAR. Runways come back empty; the runway
// table is hidden when that's the case.

function synthesizeDep(icao, metar) {
  if (!metar) return null;
  // FB winds aloft is CONUS-only. If the airport is outside the US, we set
  // fbStation = null so downstream rendering shows "n/a" instead of fake
  // data from the nearest US station (which could be thousands of miles away).
  const inConus = isInConus(metar.lat, metar.lon);
  const fbLookup = inConus ? nearestFBStation(metar.lat, metar.lon) : null;
  return {
    name: metar.name || icao,
    elev: metar.elev != null ? metar.elev : 0,
    lat: metar.lat,
    lon: metar.lon,
    runways: [],
    fbStation: fbLookup ? fbLookup.code : null,
  };
}

// ---- Orchestrator ----------------------------------------------------------

export function renderBrief(state) {
  if (state.loading) {
    return `
      <div class="screen">
        <div class="loading">
          <div class="spinner"></div>
          <p>Pulling weather from NOAA…</p>
        </div>
      </div>
    `;
  }
  if (state.error) {
    return `
      <div class="screen">
        <button class="back-btn" data-action="back-to-setup">← back</button>
        <div class="error-box">
          <h2>Couldn't build the brief</h2>
          <p>${state.error}</p>
          <p style="font-size:13px;color:var(--muted);margin-top:12px;">
            Try a different destination ICAO, or check your connection.
            If the public CORS proxies are down, try again in a minute.
          </p>
        </div>
      </div>
    `;
  }

  const { metars, tafs, pirepsDep, pirepsDest, airsigmets, fbLow, fbHigh, status } = state.data;
  const aircraft = AIRCRAFT[state.aircraftKey];
  const depMetar  = getLatestMetar(metars, state.departure);
  const destMetar = getLatestMetar(metars, state.destination);
  const depTaf    = getTaf(tafs, state.departure);
  const destTaf   = getTaf(tafs, state.destination);

  // Resolve the departure airport. If it's one of the six Tahoe fields we
  // have hardcoded runway + FB-station data. Otherwise (e.g. EGKB, LEPA on
  // a trip leg) we synthesize from the METAR: elev + lat/lon + nearest FB
  // station via coordinate lookup. Runway-specific bits (crosswind table,
  // preferred-runway pick) gracefully degrade to "—".
  const dep = DEPARTURES[state.departure] || synthesizeDep(state.departure, depMetar);
  if (!dep) {
    return `
      <div class="screen">
        <button class="back-btn" data-action="back-to-setup">← back</button>
        <div class="error-box">
          <h2>Can't build brief for ${state.departure}</h2>
          <p>No METAR returned for the departure airport, and it isn't one of the six Tahoe-area fields we have hardcoded. Check the ICAO and try again.</p>
        </div>
      </div>
    `;
  }

  // Use the high-altitude FB chart for jets, low-altitude for everyone else.
  const useHighFB = aircraft.cruiseFt >= 30000;
  const fbText = useHighFB ? fbHigh : fbLow;

  // Coverage check — many NOAA AWC feeds are CONUS-only. If either end of
  // the leg is outside the US, we suppress the US-only data and show a
  // "supplement only" banner so the pilot doesn't read a partial brief
  // as a complete one.
  const depInConus  = isInConus(dep.lat, dep.lon);
  const destInConus = destMetar ? isInConus(destMetar.lat, destMetar.lon) : false;
  const outOfCoverage = !depInConus || !destInConus;

  // Departure FB: skip the lookup if dep isn't in CONUS (fbStation is null).
  const fbDep = dep.fbStation ? parseFB(fbText, dep.fbStation) : null;

  // Destination FB: pick the nearest forecast station, but only if dest is
  // in CONUS. Otherwise the "nearest" station could be 3,000 nm away.
  const destFBLookup = (destMetar && destInConus) ? nearestFBStation(destMetar.lat, destMetar.lon) : null;
  const fbDest = destFBLookup ? parseFB(fbText, destFBLookup.code) : null;

  const routeNm = destMetar ? Math.round(distanceNm(dep.lat, dep.lon, destMetar.lat, destMetar.lon)) : null;

  return `
    <div class="screen brief">
      <header class="brief-header">
        <div class="brief-title">
          <button class="back-btn" data-action="back-to-setup">← new brief</button>
          <h1>${escText(state.departure)} → ${escText(state.destination)}</h1>
          <p class="brief-sub">
            ${escText(dep.name)} → ${escText((destMetar && destMetar.name) || state.destination)}
            ${routeNm ? `· ${routeNm.toLocaleString()} nm` : ""}
            · ${escText(aircraft.label)}
          </p>
        </div>
        <div class="brief-header-actions">
          <button class="ghost-btn" data-action="print">Print / PDF</button>
        </div>
      </header>

      ${renderLegNav(state)}

      <div id="route-map"
           data-dep-lat="${escAttr(dep.lat)}" data-dep-lon="${escAttr(dep.lon)}"
           data-dep-icao="${escAttr(state.departure)}"
           ${destMetar ? `data-dest-lat="${escAttr(destMetar.lat)}" data-dest-lon="${escAttr(destMetar.lon)}" data-dest-name="${escAttr(state.destination)}"` : ""}>
      </div>

      ${outOfCoverage ? `
        <div class="alert danger" style="border-left-width:4px;font-size:15px;">
          <strong>⚠ International leg — supplement only.</strong>
          Several NOAA feeds are CONUS-only (winds aloft, AIRMETs, mountain-wave logic).
          For this brief they'll show "n/a" or be suppressed.
          <strong>Do not use this brief alone for go/no-go.</strong>
          Cross-check ForeFlight, Jeppesen, or your handler's brief.
        </div>
      ` : ""}

      ${renderDiagnostics(status, state.data.errors, destFBLookup, outOfCoverage)}

      ${renderRunwaySection(state, dep, depMetar)}
      ${renderClimboutSection(state, dep, depMetar, fbDep, aircraft, pirepsDep, airsigmets)}
      ${renderCruiseSection(state, dep, fbDep, fbDest, destFBLookup, aircraft, pirepsDep, pirepsDest, airsigmets)}
      ${renderDescentSection(state, destMetar, destTaf, aircraft, fbDest, destFBLookup, pirepsDest, airsigmets)}
      ${renderApproachSection(state, destMetar, destTaf, pirepsDest)}
      ${renderGroundSection(state, destMetar, destTaf)}

      <footer class="brief-footer">
        Brief generated ${new Date().toLocaleString()}.
        Always cross-check with official sources before flight.
      </footer>
    </div>
  `;
}

// ---- Diagnostics panel -----------------------------------------------------

function renderDiagnostics(status, errors, destFBLookup, outOfCoverage) {
  if (!status) return "";
  // Feeds that are CONUS-only — when out of coverage, mark them as n/a
  // instead of leaving the user wondering why they show "empty".
  const conusOnly = new Set(["airsigmets", "fbLow", "fbHigh"]);
  const rows = [
    ["metars",     "METARs"],
    ["tafs",       "TAFs"],
    ["pirepsDep",  "PIREPs (departure)"],
    ["pirepsDest", "PIREPs (destination)"],
    ["airsigmets", "AIRMETs / SIGMETs"],
    ["fbLow",      "Winds aloft (low)"],
    ["fbHigh",     "Winds aloft (high)"],
  ];
  const rowsHtml = rows.map(([key, label]) => {
    if (outOfCoverage && conusOnly.has(key)) {
      return `<div class="diag-row"><span>${label}</span><span class="diag-status empty">n/a — outside CONUS</span></div>`;
    }
    const s = status[key];
    const cls = s === "ok" ? "ok" : s === "empty" ? "empty" : "err";
    const text = s === "ok" ? "✓ ok" : s === "empty" ? "empty" : "✕ failed";
    return `<div class="diag-row"><span>${label}</span><span class="diag-status ${cls}">${text}</span></div>`;
  }).join("");
  const errSummary = errors.length
    ? `<div class="diag-row" style="border-bottom:none;padding-top:8px;"><span style="color:var(--warn);font-size:12px;">${errors.length} error${errors.length > 1 ? "s" : ""}: ${escText(errors.map((e) => e.message).join("; "))}</span></div>`
    : "";
  const fbInfo = destFBLookup
    ? `<div class="diag-row"><span>Destination FB station</span><span>${escText(destFBLookup.code)} (${destFBLookup.distanceNm} nm from field)</span></div>`
    : "";
  const proxyInfo = PROXY_INFO.usingCustomWorker
    ? `<div class="diag-row"><span>CORS relay</span><span class="diag-status ok">via your Cloudflare Worker</span></div>`
    : `<div class="diag-row"><span>CORS relay</span><span>public proxies (allorigins.win + codetabs.com)</span></div>`;
  const anyIssue = errors.length || Object.values(status).some((s) => s !== "ok");
  return `
    <details class="diagnostics" ${anyIssue ? "open" : ""}>
      <summary>Data status ${anyIssue ? "· issues" : "· all feeds ok"}</summary>
      <div style="margin-top:8px;">
        ${rowsHtml}
        ${proxyInfo}
        ${fbInfo}
        ${errSummary}
      </div>
    </details>
  `;
}

// ---- Phase 1: Runway -------------------------------------------------------

function renderRunwaySection(state, dep, depMetar) {
  if (!depMetar) {
    return `<section class="phase">
      <h2>1 · Runway · ${state.departure}</h2>
      <p class="warn">No METAR available for ${state.departure}.</p>
    </section>`;
  }
  const wDir = depMetar.wdir, wSpd = depMetar.wspd, wGst = depMetar.wgst;
  const tempC = depMetar.temp;
  const altIn = altimeterInHg(depMetar);
  const DA = densityAltitude(dep.elev, tempC, altIn);
  const PA = altIn != null ? pressureAltitude(dep.elev, altIn) : null;
  const hasRunwayData = dep.runways && dep.runways.length > 0;
  const preferred = hasRunwayData ? preferredRunway(wDir, wSpd, dep.runways) : null;

  const daBadge = DA == null ? "" : (DA > 8000 ? "high" : DA > 6000 ? "mid" : "ok");

  const runwayRows = hasRunwayData
    ? dep.runways.map((r) => {
        const xw = crosswindComponent(wDir, wSpd, r.hdg);
        return `<tr><td>${r.id}</td><td>${xw} kt</td></tr>`;
      }).join("")
    : "";

  const wxFlags = parseSignificantWeather(depMetar.wxString);
  const daAlert = (DA != null && DA > 8000)
    ? `<div class="alert danger">⚠ Density altitude ${Math.round(DA).toLocaleString()} ft — expect significantly reduced climb performance, longer takeoff roll, higher true airspeed on rotation. Verify aircraft performance charts.</div>`
    : "";
  const gustAlert = (wGst && wGst >= 25)
    ? `<div class="alert">⚠ Surface gusts to ${wGst} kt — expect mechanical turbulence on initial climb.</div>`
    : "";
  const cat = metarFltCat(depMetar);

  return `
    <section class="phase">
      <h2>1 · Runway · ${state.departure}</h2>
      <div class="phase-grid">
        <div class="metric">
          <div class="metric-label">Surface wind</div>
          <div class="metric-value">${formatWind(wDir, wSpd, wGst)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Density altitude</div>
          <div class="metric-value badge-${daBadge}">${DA != null ? Math.round(DA).toLocaleString() + " ft" : "—"}</div>
          <div class="metric-sub">
            ${PA != null ? "PA " + Math.round(PA).toLocaleString() + " ft · " : ""}
            ${tempC != null ? tempC + "°C · " : ""}
            ${altIn != null ? altIn.toFixed(2) + " inHg" : ""}
          </div>
        </div>
        <div class="metric">
          <div class="metric-label">Preferred runway</div>
          <div class="metric-value">${
            !hasRunwayData ? "—"
            : preferred ? preferred.id
            : "calm — pilot's choice"
          }</div>
          <div class="metric-sub">${
            !hasRunwayData ? "Runway data not in app — see official chart"
            : preferred ? preferred.headwind + " kt headwind · " + preferred.crosswind + " kt xwind"
            : ""
          }</div>
        </div>
        <div class="metric">
          <div class="metric-label">Flight category</div>
          <div class="metric-value badge-${cat.toLowerCase()}">${cat || "—"}</div>
        </div>
      </div>
      ${hasRunwayData ? `
        <table>
          <thead><tr><th>Runway</th><th>Crosswind component</th></tr></thead>
          <tbody>${runwayRows}</tbody>
        </table>
      ` : ""}
      ${daAlert}
      ${gustAlert}
      ${wxFlags.length ? `<div class="alert">⚠ Significant weather at field: ${wxFlags.join(", ")}</div>` : ""}
      <details class="raw"><summary>Raw METAR</summary><pre>${escText(depMetar.rawOb || "")}</pre></details>
    </section>
  `;
}

// ---- Phase 2: Climbout -----------------------------------------------------

function renderClimboutSection(state, dep, depMetar, fbDep, aircraft, pirepsDep, airsigmets) {
  const bands = aircraft.cruiseFt <= 12000
    ? [3000, 6000, 9000, 12000]
    : aircraft.cruiseFt <= 24000
      ? [6000, 9000, 12000, 18000, 24000]
      : [9000, 12000, 18000, 24000];
  const rows = bands.map((a) => {
    const w = fbDep && fbDep[a];
    return `<tr>
      <td>${a.toLocaleString()} ft</td>
      <td>${w ? formatFBWind(w) : "—"}</td>
      <td>${w && w.tempC != null ? w.tempC + "°C" : "—"}</td>
    </tr>`;
  }).join("");

  const warnings = [];
  if (fbDep) {
    const w12 = fbDep[12000];
    if (w12 && typeof w12.dir === "number" && w12.spd >= 30 && w12.dir >= 230 && w12.dir <= 310) {
      warnings.push(`Mountain wave likely: 12,000 ft winds are ${w12.dir}° @ ${w12.spd} kt. Expect lee-side rotor east of the crest and possible severe turbulence below ridge level.`);
    }
    const w18 = fbDep[18000];
    if (w18 && typeof w18.dir === "number" && w18.spd >= 50 && w18.dir >= 230 && w18.dir <= 310) {
      warnings.push(`Strong westerly flow aloft (${w18.dir}° @ ${w18.spd} kt at 18,000). Severe mountain wave / wave rotor potential through the climbout block.`);
    }
  }
  const climboutPireps = (pirepsDep || [])
    .filter((p) => (p.altitudeFtMsl != null ? p.altitudeFtMsl <= aircraft.cruiseFt : true))
    .slice(0, 4);
  const relevantAdvisories = filterAirsigmetsByAltitude(airsigmets, 0, aircraft.cruiseFt);

  return `
    <section class="phase">
      <h2>2 · Climbout</h2>
      <h4>Winds &amp; temps aloft ${dep.fbStation ? `(departure region — ${escText(dep.fbStation)})` : "(n/a — departure outside CONUS)"}</h4>
      <table>
        <thead><tr><th>Altitude</th><th>Wind</th><th>OAT</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${warnings.map((w) => `<div class="alert danger">⚠ ${w}</div>`).join("")}
      ${climboutPireps.length ? renderPireps(climboutPireps, "Recent PIREPs near departure") : ""}
      ${relevantAdvisories.length ? renderAirsigmets(relevantAdvisories, "AIRMETs/SIGMETs affecting climbout") : ""}
    </section>
  `;
}

// ---- Phase 3: Cruise -------------------------------------------------------

function renderCruiseSection(state, dep, fbDep, fbDest, destFBLookup, aircraft, pirepsDep, pirepsDest, airsigmets) {
  const targetAlt = aircraft.cruiseFt;
  const fbAltDep  = closestFBAltitude(targetAlt, fbDep);
  const fbAltDest = closestFBAltitude(targetAlt, fbDest);
  const cruiseDep  = fbAltDep  != null ? fbDep[fbAltDep]   : null;
  const cruiseDest = fbAltDest != null ? fbDest[fbAltDest] : null;

  const tempNote = cruiseDep && cruiseDep.tempC != null
    ? `ISA at ${fbAltDep.toLocaleString()} ft is ${Math.round(15 - 2 * fbAltDep / 1000)}°C — ${cruiseDep.tempC > (15 - 2 * fbAltDep / 1000) ? "warmer than ISA" : "colder than ISA"} (affects fuel burn + TAS).`
    : "";

  const cruisePireps = [
    ...(pirepsDep || []),
    ...(pirepsDest || []),
  ].filter((p) => p.altitudeFtMsl != null && Math.abs(p.altitudeFtMsl - targetAlt) <= 6000)
   .slice(0, 5);

  const relevantAdvisories = filterAirsigmetsByAltitude(airsigmets, Math.max(0, targetAlt - 3000), targetAlt + 3000);

  // The departure/destination FB station may be null when the airport is
  // outside CONUS — render a clearer label in that case.
  const depFbLabel  = dep.fbStation ? `${escText(dep.fbStation)} @ ${fbAltDep ? fbAltDep.toLocaleString() + " ft" : "—"}` : "n/a — outside CONUS";
  const destFbLabel = destFBLookup ? `${escText(destFBLookup.code)} @ ${fbAltDest ? fbAltDest.toLocaleString() + " ft" : "—"}` : "n/a — outside CONUS";

  return `
    <section class="phase">
      <h2>3 · Cruise — ${formatAltitude(targetAlt)}</h2>
      <div class="phase-grid">
        <div class="metric">
          <div class="metric-label">Departure region · ${depFbLabel}</div>
          <div class="metric-value">${cruiseDep ? formatFBWind(cruiseDep) : (dep.fbStation ? "—" : "use ForeFlight")}</div>
          <div class="metric-sub">${cruiseDep && cruiseDep.tempC != null ? "OAT " + cruiseDep.tempC + "°C" : ""}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Destination region · ${destFbLabel}</div>
          <div class="metric-value">${cruiseDest ? formatFBWind(cruiseDest) : (destFBLookup ? "—" : "use ForeFlight")}</div>
          <div class="metric-sub">${cruiseDest && cruiseDest.tempC != null ? "OAT " + cruiseDest.tempC + "°C" : ""}</div>
        </div>
      </div>
      ${tempNote ? `<p class="metric-sub" style="margin-top:8px;">${tempNote}</p>` : ""}
      ${cruisePireps.length ? renderPireps(cruisePireps, "PIREPs near cruise altitude") : ""}
      ${relevantAdvisories.length ? renderAirsigmets(relevantAdvisories, "Cruise-band AIRMETs/SIGMETs") : `<p class="warn">No turbulence/icing/IFR advisories in this altitude band.</p>`}
    </section>
  `;
}

// ---- Phase 4: Descent ------------------------------------------------------

function renderDescentSection(state, destMetar, destTaf, aircraft, fbDest, destFBLookup, pirepsDest, airsigmets) {
  const destElev = destMetar && destMetar.elev != null ? destMetar.elev : 0;
  const floorAlt = Math.max(3000, destElev + 3000);
  const bands = aircraft.cruiseFt > 24000
    ? [24000, 18000, 12000, 9000, 6000]
    : aircraft.cruiseFt > 12000
      ? [18000, 12000, 9000, 6000, 3000]
      : [12000, 9000, 6000, 3000];

  const rows = bands.map((a) => {
    const w = fbDest && fbDest[a];
    return `<tr>
      <td>${a.toLocaleString()} ft</td>
      <td>${w ? formatFBWind(w) : "—"}</td>
      <td>${w && w.tempC != null ? w.tempC + "°C" : "—"}</td>
    </tr>`;
  }).join("");
  const relevantAdvisories = filterAirsigmetsByAltitude(airsigmets, floorAlt, aircraft.cruiseFt);

  return `
    <section class="phase">
      <h2>4 · Descent into ${state.destination}</h2>
      <h4>Descent winds (destination region — ${destFBLookup ? destFBLookup.code : "n/a"})</h4>
      <table>
        <thead><tr><th>Altitude</th><th>Wind</th><th>OAT</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${destTaf ? `
        <div class="taf-block">
          <h4>Destination TAF</h4>
          <pre>${escText(destTaf.rawTAF || "")}</pre>
        </div>
      ` : `<p class="warn">No TAF available for ${state.destination}.</p>`}
      ${relevantAdvisories.length ? renderAirsigmets(relevantAdvisories, "Descent-band advisories") : ""}
    </section>
  `;
}

// ---- Phase 5: Approach -----------------------------------------------------

function renderApproachSection(state, destMetar, destTaf, pirepsDest) {
  if (!destMetar) {
    return `<section class="phase">
      <h2>5 · Approach</h2>
      <p class="warn">No METAR available for ${state.destination}.</p>
    </section>`;
  }
  const wxFlags = parseSignificantWeather(destMetar.wxString);
  const cat = metarFltCat(destMetar);
  const approachPireps = (pirepsDest || []).slice(0, 4);
  return `
    <section class="phase">
      <h2>5 · Approach · ${state.destination}</h2>
      <div class="phase-grid">
        <div class="metric">
          <div class="metric-label">Wind</div>
          <div class="metric-value">${formatWind(destMetar.wdir, destMetar.wspd, destMetar.wgst)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Visibility</div>
          <div class="metric-value">${destMetar.visib != null ? destMetar.visib + " sm" : "—"}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Ceiling</div>
          <div class="metric-value">${formatCeiling(destMetar)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Flight category</div>
          <div class="metric-value badge-${cat.toLowerCase()}">${cat || "—"}</div>
        </div>
      </div>
      ${wxFlags.length ? `<div class="alert">⚠ ${wxFlags.join(", ")} reported at destination</div>` : ""}
      ${approachPireps.length ? renderPireps(approachPireps, "Recent PIREPs near destination") : ""}
    </section>
  `;
}

// ---- Phase 6: Ground -------------------------------------------------------

function renderGroundSection(state, destMetar, destTaf) {
  if (!destMetar) return "";
  const tempF = destMetar.temp != null ? Math.round(destMetar.temp * 9 / 5 + 32) : null;
  return `
    <section class="phase">
      <h2>6 · Ground · ${state.destination}</h2>
      <div class="phase-grid">
        <div class="metric">
          <div class="metric-label">Temperature</div>
          <div class="metric-value">${destMetar.temp != null ? destMetar.temp + "°C / " + tempF + "°F" : "—"}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Dewpoint</div>
          <div class="metric-value">${destMetar.dewp != null ? destMetar.dewp + "°C" : "—"}</div>
          <div class="metric-sub">${destMetar.temp != null && destMetar.dewp != null ? "Spread " + (destMetar.temp - destMetar.dewp).toFixed(1) + "°C" : ""}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Altimeter</div>
          <div class="metric-value">${altimeterInHg(destMetar) != null ? altimeterInHg(destMetar).toFixed(2) + " inHg" : "—"}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Observed</div>
          <div class="metric-value">${formatObsTime(destMetar.obsTime)}</div>
        </div>
      </div>
      <details class="raw"><summary>Raw METAR · ${escText(state.destination)}</summary><pre>${escText(destMetar.rawOb || "")}</pre></details>
    </section>
  `;
}

// ---- PIREPs + AIRMETs ------------------------------------------------------

function renderPireps(pireps, label) {
  const rows = pireps.map((p) => `
    <tr>
      <td>${p.altitudeFtMsl != null ? Math.round(p.altitudeFtMsl).toLocaleString() + " ft" : "—"}</td>
      <td>${p.acType || p.aircraftRef || "—"}</td>
      <td class="mono">${escText(p.rawOb || "")}</td>
    </tr>
  `).join("");
  return `
    <div class="pireps">
      <h4>${label}</h4>
      <table>
        <thead><tr><th>Altitude</th><th>A/C</th><th>Report</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderAirsigmets(items, label) {
  const list = items.map((a) => {
    const lo = a.altitudeLow1 != null ? formatAltitude(a.altitudeLow1) : "SFC";
    const hi = a.altitudeHi1  != null ? formatAltitude(a.altitudeHi1)  : "—";
    return `<li>
      <strong>${escText(a.airSigmetType || "")} · ${escText(a.hazard || "")}</strong>
      ${a.severity ? `· ${escText(a.severity)}` : ""}
      — ${lo} to ${hi}
    </li>`;
  }).join("");
  return `
    <div class="airsigmets">
      <h4>${label || "Current AIRMETs / SIGMETs"}</h4>
      <ul>${list}</ul>
    </div>
  `;
}

function filterAirsigmetsByAltitude(items, lowFt, highFt) {
  if (!items || !items.length) return [];
  return items.filter((a) => {
    const haz = (a.hazard || "").toUpperCase();
    const interesting = ["TURB", "ICE", "ICING", "IFR", "MTN OBSCN", "MOUNTAIN OBSCURATION", "TS", "CONVECTIVE"];
    if (!interesting.some((t) => haz.includes(t))) return false;
    const lo = a.altitudeLow1 != null ? a.altitudeLow1 : 0;
    const hi = a.altitudeHi1  != null ? a.altitudeHi1  : 60000;
    return hi >= lowFt && lo <= highFt;
  }).slice(0, 8);
}
