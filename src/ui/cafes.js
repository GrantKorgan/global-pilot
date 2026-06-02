// src/ui/cafes.js
// ---------------------------------------------------------------------------
// $1,000 cheeseburger — in-app airport cafe browser.
//
// Renders a searchable list of curated fly-in cafes (data lives in
// src/data/cafes.js). Each card links out to AirNav (for current airport
// info) and flytolunch.com (for cafe reviews + verified hours).
//
// Why this isn't a copy of flytolunch.com's database:
//   We don't scrape their site. We curate our own list, starting small,
//   and let it grow over time. For the long-tail of cafes we don't have,
//   the "Looking for more?" footer points users to flytolunch.com.
// ---------------------------------------------------------------------------

import { CAFES } from "../data/cafes.js";
import { escText, escAttr } from "./escape.js";

export function renderCafes(state) {
  const query = (state.cafeQuery || "").trim().toLowerCase();
  const filtered = query
    ? CAFES.filter(matchesQuery(query))
    : CAFES;

  const list = filtered.length
    ? filtered.map(renderCafeCard).join("")
    : `<p class="warn">No cafes match "${escText(query)}". Try a city, ICAO, or cafe name.</p>`;

  return `
    <div class="screen">
      <button class="back-btn" data-action="back-to-welcome">← welcome</button>
      <h1 style="margin-bottom:4px;">$1,000 Cheeseburger</h1>
      <p class="lead">
        A starter list of fly-in cafes pilots actually visit. Hours change —
        always verify current status on the linked sites before flying out.
      </p>

      <form id="cafe-search-form" class="cafe-search">
        <input
          type="search"
          id="cafe-search-input"
          placeholder="Filter by city, ICAO, or cafe name…"
          value="${escAttr(state.cafeQuery || "")}"
          autocomplete="off"
        >
      </form>

      <div class="cafes-list">${list}</div>

      <p class="footnote" style="text-align:left;margin-top:32px;">
        <strong>Don't see a favorite?</strong> The community list lives at
        <a href="https://www.flytolunch.com/" target="_blank" rel="noopener noreferrer">flytolunch.com</a> —
        thousands of entries, updated by working pilots. We'll add an
        "add yours" form to this app once the trip planner is fully tested.
      </p>
    </div>
  `;
}

// One cafe card. Two external links: AirNav (airport info) + flytolunch.com
// (cafe reviews / hours). We don't deep-link to a specific flytolunch URL
// pattern because we can't guarantee theirs is stable — the homepage search
// is the safest bet.
function renderCafeCard(cafe) {
  const airnav    = `https://www.airnav.com/airport/${encodeURIComponent(cafe.icao)}`;
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

// Match against name, ICAO, airport, city, region, or blurb. The region
// field lets users filter by region keyword ("midwest", "socal", etc.).
function matchesQuery(q) {
  return (cafe) => {
    const haystack = [cafe.name, cafe.icao, cafe.airport, cafe.city, cafe.region, cafe.blurb]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  };
}
