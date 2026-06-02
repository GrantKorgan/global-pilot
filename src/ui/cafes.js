// src/ui/cafes.js
// ---------------------------------------------------------------------------
// $1,000 cheeseburger — in-app airport cafe browser.
//
// Two-tier display:
//   1. CAFES (src/data/cafes.js) — hand-curated, full blurbs, "we vouch
//      for this one" tier. Rendered first as rich cards.
//   2. AIRPORTS_WITH_FOOD (src/data/airports-food.js) — Layer 1, the
//      broader "food on field" list. Lighter cards, name + city + AirNav
//      link. Will grow via FAA NASR auto-import (see scripts/import-nasr.mjs).
//
// One search box filters both tiers simultaneously.
// ---------------------------------------------------------------------------

import { CAFES } from "../data/cafes.js";
import { AIRPORTS_WITH_FOOD } from "../data/airports-food.js";
import { escText, escAttr } from "./escape.js";

export function renderCafes(state) {
  const query = (state.cafeQuery || "").trim().toLowerCase();
  const matchCafe    = query ? CAFES.filter(matchesQuery(query, cafeHaystack))                 : CAFES;
  const matchAirport = query ? AIRPORTS_WITH_FOOD.filter(matchesQuery(query, airportHaystack)) : AIRPORTS_WITH_FOOD;

  const totalMatches = matchCafe.length + matchAirport.length;

  const cafeSection = matchCafe.length
    ? `
      <h2 class="cafes-section-h">Featured cafes <span class="cafes-section-count">${matchCafe.length}</span></h2>
      <div class="cafes-list">${matchCafe.map(renderCafeCard).join("")}</div>
    `
    : "";

  const airportSection = matchAirport.length
    ? `
      <h2 class="cafes-section-h">More airports with food on field <span class="cafes-section-count">${matchAirport.length}</span></h2>
      <p class="cafes-section-lead">
        Known fly-in food stops without a full review yet. Names of the cafes
        themselves rot fast — tap AirNav to verify before you depart.
      </p>
      <div class="airports-food-list">${matchAirport.map(renderAirportCard).join("")}</div>
    `
    : "";

  const empty = totalMatches === 0
    ? `<p class="warn">No matches for "${escText(query)}". Try a city, ICAO, or region.</p>`
    : "";

  return `
    <div class="screen">
      <button class="back-btn" data-action="back-to-welcome">← welcome</button>
      <h1 style="margin-bottom:4px;">$1,000 Cheeseburger</h1>
      <p class="lead">
        Fly-in cafes pilots actually visit, plus a wider list of airports
        with food on the field. Hours change — always verify before flying.
      </p>

      <form id="cafe-search-form" class="cafe-search">
        <input
          type="search"
          id="cafe-search-input"
          placeholder="Filter by city, ICAO, region…"
          value="${escAttr(state.cafeQuery || "")}"
          autocomplete="off"
        >
      </form>

      ${empty}
      ${cafeSection}
      ${airportSection}

      <p class="footnote" style="text-align:left;margin-top:32px;">
        <strong>Don't see a favorite?</strong> The community list lives at
        <a href="https://www.flytolunch.com/" target="_blank" rel="noopener noreferrer">flytolunch.com</a>.
        The lower-48 list above auto-refreshes monthly from the FAA NASR
        "food on field" flag — see the repo's <code>scripts/import-nasr.mjs</code>.
      </p>
    </div>
  `;
}

// ---- Rich cafe card (CAFES tier) --------------------------------------
function renderCafeCard(cafe) {
  const airnav     = `https://www.airnav.com/airport/${encodeURIComponent(cafe.icao)}`;
  const flytolunch = `https://www.flytolunch.com/`;
  const region = cafe.region ? `<span class="cafe-card-region">${escText(cafe.region)}</span>` : "";
  return `
    <div class="cafe-card">
      <div class="cafe-card-head">
        <h3 class="cafe-card-name">${escText(cafe.name)}</h3>
        <div class="cafe-card-meta">
          <span class="cafe-card-icao">${escText(cafe.icao)}</span>
          <span class="cafe-card-city">${escText(cafe.airport)} · ${escText(cafe.city)}</span>
          ${region}
        </div>
      </div>
      <p class="cafe-card-blurb">${escText(cafe.blurb)}</p>
      <div class="cafe-card-links">
        <a href="${escAttr(airnav)}" target="_blank" rel="noopener noreferrer">Airport info (AirNav) →</a>
        <a href="${escAttr(flytolunch)}" target="_blank" rel="noopener noreferrer">Reviews (flytolunch.com) →</a>
      </div>
    </div>
  `;
}

// ---- Lighter airport-food card (Layer 1 tier) -------------------------
function renderAirportCard(a) {
  const airnav = `https://www.airnav.com/airport/${encodeURIComponent(a.icao)}`;
  const region = a.region ? `<span class="airport-food-region">${escText(a.region)}</span>` : "";
  const city   = a.city   ? `· ${escText(a.city)}` : "";
  const note   = a.noteShort
    ? `<p class="airport-food-note">${escText(a.noteShort)}</p>`
    : "";
  return `
    <div class="airport-food-card">
      <div class="airport-food-head">
        <span class="airport-food-icao">${escText(a.icao)}</span>
        <span class="airport-food-name">${escText(a.airport)} ${city}</span>
        ${region}
      </div>
      ${note}
      <a class="airport-food-link" href="${escAttr(airnav)}" target="_blank" rel="noopener noreferrer">Airport info (AirNav) →</a>
    </div>
  `;
}

// ---- search ------------------------------------------------------------

function matchesQuery(q, haystackOf) {
  return (item) => haystackOf(item).includes(q);
}

function cafeHaystack(c) {
  return [c.name, c.icao, c.airport, c.city, c.region, c.blurb]
    .filter(Boolean).join(" ").toLowerCase();
}

function airportHaystack(a) {
  return [a.icao, a.airport, a.city, a.region, a.noteShort]
    .filter(Boolean).join(" ").toLowerCase();
}
