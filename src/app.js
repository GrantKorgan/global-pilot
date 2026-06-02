// src/app.js
// ===========================================================================
// GLOBAL PILOT — boot file.
//
// THE WHOLE APP IN ONE SENTENCE:
//   We keep a single `state` object. We call `setState({...})` to change it.
//   That triggers `render()`, which redraws the page based on the new state.
//   That's it.
//
// File layout (everything under src/):
//   data/      static tables — airports, aircraft tiers, JSDoc types
//   store/     localStorage helpers (prefs, trips)
//   calc/      pure math — density alt, wind, distance
//   wx/        NOAA fetchers + parsers
//   ui/        screen renderers (welcome / setup / brief / trips) + map + format
//   app.js     this file: state + render + event wiring + boot
//
// SCREENS:
//   welcome    pick a Tahoe departure for a quick brief, or jump to Trips
//   setup      pick destination + aircraft for a quick brief
//   brief      the phase-of-flight brief (also used for trip legs)
//   trips      list of saved multi-leg trips
//   tripEdit   edit one trip — name/aircraft/dates and add/delete/view legs
//
// To trace any behavior:
//   "Where does this number come from?"  → calc/  or  wx/
//   "What HTML is this?"                 → ui/
//   "When does this happen?"             → app.js (event handlers below)
// ===========================================================================

import { renderWelcome  } from "./ui/welcome.js";
import { renderSetup    } from "./ui/setup.js";
import { renderBrief    } from "./ui/brief.js";
import { renderTrips, renderTripEdit, renderTripPrint } from "./ui/trips.js";
import { renderCafes  } from "./ui/cafes.js";
import { acquireWakeLock, releaseWakeLock } from "./ui/wakelock.js";
import { initRouteMap   } from "./ui/map.js";
import { fetchAllData   } from "./wx/fetchers.js";
import { loadPrefs, savePrefs } from "./store/prefs.js";
import { getTrip, saveTrip, deleteTrip } from "./store/trips.js";
import { newTrip, newLeg } from "./data/types.js";
import { AIRCRAFT } from "./data/aircraft.js";
import { buildEurope2026Trip, EUROPE_2026_TRIP_ID } from "./data/fixtures/europe-2026.js";

// ---- State ----------------------------------------------------------------

const prefs = loadPrefs();

let state = {
  view: "welcome",        // welcome | setup | brief | trips | tripEdit | tripPrint | cafes
  // Quick-brief mode:
  departure: null,        // ICAO of selected departure
  aircraftKey: prefs.aircraftKey || null,
  destination: null,      // ICAO entered by user
  data: null,             // fetchAllData result
  loading: false,
  error: null,
  // Trip planner:
  currentTripId: null,    // when on tripEdit or coming back from a leg brief
  briefSource: "setup",   // "setup" | "trip" — controls back-from-brief navigation
  // Cafe finder:
  cafeQuery: "",          // search filter on the cafes screen
};

function setState(patch) {
  state = { ...state, ...patch };
  render();
}

// ---- Render ---------------------------------------------------------------

function render() {
  const app = document.getElementById("app");
  if      (state.view === "welcome")  app.innerHTML = renderWelcome(state, prefs);
  else if (state.view === "setup")    app.innerHTML = renderSetup(state, prefs);
  else if (state.view === "brief")    app.innerHTML = renderBrief(state);
  else if (state.view === "trips")    app.innerHTML = renderTrips(state);
  else if (state.view === "tripEdit") app.innerHTML = renderTripEdit(state);
  else if (state.view === "tripPrint")app.innerHTML = renderTripPrint(state);
  else if (state.view === "cafes")    app.innerHTML = renderCafes(state);
  attachEvents();
  if (state.view === "brief" && state.data && !state.loading) initRouteMap();

  // Wake lock: keep the screen on while the pilot is reading the brief.
  // Released on any other view.
  if (state.view === "brief" && state.data && !state.loading) {
    acquireWakeLock();
  } else {
    releaseWakeLock();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---- Brief fetching (shared by quick-brief and trip-leg paths) ------------

async function loadBrief(dep, dest) {
  try {
    const data = await fetchAllData(dep, dest);
    if (data.status.metars === "err" && !data.metars) {
      setState({
        loading: false,
        error: "Couldn't reach NOAA via the proxy. Try again in a minute, or expand the diagnostics panel to see which feeds failed.",
      });
      return;
    }
    if (data.metars && data.metars.length === 0) {
      setState({
        loading: false,
        error: `No METAR data returned for ${dep} or ${dest}. The ICAO may be invalid or non-reporting.`,
      });
      return;
    }
    setState({ data, loading: false });
  } catch (err) {
    setState({ error: (err && err.message) || String(err), loading: false });
  }
}

// ---- Events ---------------------------------------------------------------
// Rewired after every render because innerHTML replacement drops listeners.

function attachEvents() {

  // === Welcome screen ===

  // Go to the Trips screen
  document.querySelectorAll('[data-action="go-to-trips"]').forEach((btn) => {
    btn.addEventListener("click", () => setState({ view: "trips" }));
  });

  // Go to the single-leg brief setup screen (replaces the old Tahoe-airport tiles)
  document.querySelectorAll('[data-action="go-to-single-brief"]').forEach((btn) => {
    btn.addEventListener("click", () => setState({ view: "setup", briefSource: "setup" }));
  });

  // Go to the cafe finder ($1,000 cheeseburger screen)
  document.querySelectorAll('[data-action="go-to-cafes"]').forEach((btn) => {
    btn.addEventListener("click", () => setState({ view: "cafes", cafeQuery: "" }));
  });

  // Live search on the cafe finder — re-render on each keystroke.
  const cafeSearchInput = document.getElementById("cafe-search-input");
  if (cafeSearchInput) {
    cafeSearchInput.addEventListener("input", (e) => {
      // setState re-renders the screen and focus on the input is lost.
      // Restore focus + cursor position after re-render.
      const cursorPos = e.target.selectionStart;
      setState({ cafeQuery: e.target.value });
      const restored = document.getElementById("cafe-search-input");
      if (restored) {
        restored.focus();
        restored.setSelectionRange(cursorPos, cursorPos);
      }
    });
  }

  // === Trips screen ===

  // Create a new trip with sensible defaults, jump straight to the editor.
  document.querySelectorAll('[data-action="new-trip"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const today = new Date().toISOString().slice(0, 10);
      const trip = newTrip({
        name: "Untitled trip",
        aircraftId: state.aircraftKey || Object.keys(AIRCRAFT)[0],
        dateStart: today,
        dateEnd: today,
      });
      try {
        saveTrip(trip);
        setState({ view: "tripEdit", currentTripId: trip.id });
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Open an existing trip in the editor.
  document.querySelectorAll('[data-action="open-trip"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      setState({ view: "tripEdit", currentTripId: btn.dataset.tripId });
    });
  });

  // Jump to the trip-print view (cover + per-leg ops binder).
  document.querySelectorAll('[data-action="go-to-trip-print"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      setState({ view: "tripPrint", currentTripId: btn.dataset.tripId });
    });
  });

  // From the trip-print view, return to the editor.
  document.querySelectorAll('[data-action="back-to-trip-edit"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      setState({ view: "tripEdit" });
    });
  });

  // Seed the canonical Europe 2026 trip (24 legs, idempotent).
  // First click loads it and jumps to the editor; subsequent clicks would
  // never happen since the button hides once the trip exists.
  document.querySelectorAll('[data-action="load-europe-2026"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      if (getTrip(EUROPE_2026_TRIP_ID)) {
        // Already loaded — just open it.
        setState({ view: "tripEdit", currentTripId: EUROPE_2026_TRIP_ID });
        return;
      }
      try {
        const trip = buildEurope2026Trip();
        saveTrip(trip);
        setState({ view: "tripEdit", currentTripId: trip.id });
      } catch (err) {
        alert("Couldn't load the Europe 2026 trip: " + err.message);
      }
    });
  });

  // === Trip editor ===

  // Save trip details (name / aircraft / dates).
  const tripForm = document.getElementById("trip-form");
  if (tripForm) {
    tripForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const trip = getTrip(state.currentTripId);
      if (!trip) return;
      trip.name       = document.getElementById("trip-name").value.trim();
      trip.aircraftId = document.getElementById("trip-aircraft").value;
      trip.dateStart  = document.getElementById("trip-start").value;
      trip.dateEnd    = document.getElementById("trip-end").value;
      try {
        saveTrip(trip);
        render();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Delete an entire trip.
  document.querySelectorAll('[data-action="delete-trip"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("Delete this entire trip? This can't be undone.")) return;
      deleteTrip(btn.dataset.tripId);
      setState({ view: "trips", currentTripId: null });
    });
  });

  // Add a leg to the current trip.
  const legForm = document.getElementById("leg-form");
  if (legForm) {
    legForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const trip = getTrip(state.currentTripId);
      if (!trip) return;
      const dep  = document.getElementById("leg-dep").value.trim().toUpperCase();
      const dest = document.getElementById("leg-dest").value.trim().toUpperCase();
      const date = document.getElementById("leg-date").value;
      if (!/^[A-Z0-9]{3,4}$/.test(dep) || !/^[A-Z0-9]{3,4}$/.test(dest)) {
        alert("ICAOs should be 3 or 4 letters/digits (e.g. KSFO, EGKB).");
        return;
      }
      const leg = newLeg({ dep, dest, date, seq: trip.legs.length + 1 });
      trip.legs.push(leg);
      try {
        saveTrip(trip);
        render();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Delete a single leg from the current trip.
  document.querySelectorAll('[data-action="delete-leg"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const legId = btn.dataset.legId;
      const trip = getTrip(state.currentTripId);
      if (!trip) return;
      trip.legs = trip.legs.filter((l) => l.id !== legId);
      trip.legs.forEach((l, i) => { l.seq = i + 1; });  // re-number after delete
      try {
        saveTrip(trip);
        render();
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Open the weather brief for a specific leg.
  document.querySelectorAll('[data-action="view-leg-brief"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const legId = btn.dataset.legId;
      openLegBrief(legId);
    });
  });

  // Deep-link from the welcome "Next leg" card straight to that leg's brief.
  // Sets currentTripId first so openLegBrief (which reads state.currentTripId)
  // and the leg-nav strip on the brief both work.
  document.querySelectorAll('[data-action="open-leg-from-welcome"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const tripId = btn.dataset.tripId;
      const legId  = btn.dataset.legId;
      state.currentTripId = tripId; // direct set before openLegBrief reads it
      openLegBrief(legId);
    });
  });

  // Leg-nav strip on the brief — Previous / Next leg in the same trip.
  // Available only when briefSource === "trip" so we have a trip context.
  document.querySelectorAll('[data-action="prev-leg"]').forEach((btn) => {
    btn.addEventListener("click", () => navigateLeg(-1));
  });
  document.querySelectorAll('[data-action="next-leg"]').forEach((btn) => {
    btn.addEventListener("click", () => navigateLeg(+1));
  });

  // === Brief screen ===

  document.querySelectorAll('[data-action="print"]').forEach((btn) => {
    btn.addEventListener("click", () => window.print());
  });

  // === Setup screen (quick-brief path) ===

  const setupForm = document.getElementById("setup-form");
  if (setupForm) {
    setupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const dep  = document.getElementById("dep-input").value.trim().toUpperCase();
      const dest = document.getElementById("dest-input").value.trim().toUpperCase();
      const aircraftKey = document.getElementById("aircraft-select").value;
      if (!dep || !dest || !aircraftKey) return;
      if (!/^[A-Z0-9]{3,4}$/.test(dep)) {
        alert("Departure ICAO should be 3 or 4 letters/digits (e.g., KRNO).");
        return;
      }
      if (!/^[A-Z0-9]{3,4}$/.test(dest)) {
        alert("Destination ICAO should be 3 or 4 letters/digits (e.g., KSFO).");
        return;
      }
      savePrefs({ departure: dep, aircraftKey, lastDestination: dest });
      setState({
        view: "brief", departure: dep, destination: dest, aircraftKey,
        briefSource: "setup",
        loading: true, error: null, data: null,
      });
      loadBrief(dep, dest);
    });
  }

  // === Navigation ===

  document.querySelectorAll('[data-action="back-to-welcome"]').forEach((btn) => {
    btn.addEventListener("click", () => setState({
      view: "welcome",
      departure: null, destination: null, data: null, error: null,
      currentTripId: null, briefSource: "setup",
    }));
  });
  document.querySelectorAll('[data-action="back-to-trips"]').forEach((btn) => {
    btn.addEventListener("click", () => setState({ view: "trips", currentTripId: null }));
  });
  document.querySelectorAll('[data-action="back-to-setup"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.briefSource === "trip") {
        // Back from a trip-leg brief returns to the trip editor, not setup.
        setState({ view: "tripEdit", data: null, error: null });
      } else {
        setState({ view: "setup", data: null, error: null });
      }
    });
  });
}

// ---- Leg navigation helpers ----------------------------------------------

function openLegBrief(legId) {
  const trip = getTrip(state.currentTripId);
  if (!trip) return;
  const leg = trip.legs.find((l) => l.id === legId);
  if (!leg) return;
  setState({
    view: "brief",
    departure: leg.dep,
    destination: leg.dest,
    aircraftKey: trip.aircraftId,
    briefSource: "trip",
    loading: true,
    error: null,
    data: null,
  });
  loadBrief(leg.dep, leg.dest);
}

// Move to prev (-1) or next (+1) leg in the current trip. Used by the
// leg-nav strip on the brief screen.
function navigateLeg(delta) {
  if (state.briefSource !== "trip") return;
  const trip = getTrip(state.currentTripId);
  if (!trip || !trip.legs.length) return;
  // Find current leg by matching dep+dest+date — the brief doesn't track
  // legId directly. (If we want to be more robust later, store currentLegId
  // in state. For now dep+dest+date is unique per trip.)
  const currentIdx = trip.legs.findIndex(
    (l) => l.dep === state.departure && l.dest === state.destination
  );
  if (currentIdx < 0) return;
  const targetIdx = currentIdx + delta;
  if (targetIdx < 0 || targetIdx >= trip.legs.length) return;
  openLegBrief(trip.legs[targetIdx].id);
}

// ---- Cockpit mode (high-contrast theme for bright daylight) --------------
// Persisted in localStorage. Toggle button lives in index.html (outside
// the #app re-render scope) so its click handler is wired once at boot.

const COCKPIT_KEY = "global-pilot:cockpit";

function setCockpitMode(on) {
  document.body.classList.toggle("cockpit", on);
  const btn = document.getElementById("cockpit-toggle");
  if (btn) btn.textContent = on ? "☾ Standard" : "☀ Cockpit";
  try { localStorage.setItem(COCKPIT_KEY, on ? "1" : "0"); } catch (e) { /* private mode — fine */ }
}

(function initCockpitMode() {
  let initial = false;
  try { initial = localStorage.getItem(COCKPIT_KEY) === "1"; } catch (e) {}
  setCockpitMode(initial);
  const btn = document.getElementById("cockpit-toggle");
  if (btn) {
    btn.addEventListener("click", () => {
      setCockpitMode(!document.body.classList.contains("cockpit"));
    });
  }
})();

// ---- Boot -----------------------------------------------------------------
render();
