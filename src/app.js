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
//   data/      static tables — airports, aircraft tiers
//   store/     localStorage helpers
//   calc/      pure math — density alt, wind, distance
//   wx/        NOAA fetchers + parsers
//   ui/        screen renderers (welcome / setup / brief) + map + format
//   app.js     this file: state + render + event wiring + boot
//
// To trace any behavior:
//   "Where does this number come from?"  → calc/  or  wx/
//   "What HTML is this?"                 → ui/
//   "When does this happen?"             → app.js (event handlers below)
// ===========================================================================

import { renderWelcome } from "./ui/welcome.js";
import { renderSetup   } from "./ui/setup.js";
import { renderBrief   } from "./ui/brief.js";
import { initRouteMap  } from "./ui/map.js";
import { fetchAllData  } from "./wx/fetchers.js";
import { loadPrefs, savePrefs } from "./store/prefs.js";

// ---- State ----------------------------------------------------------------

const prefs = loadPrefs();

let state = {
  view: "welcome",       // "welcome" | "setup" | "brief"
  departure: null,       // ICAO string of selected departure airport
  aircraftKey: prefs.aircraftKey || null,
  destination: null,     // ICAO string entered by user
  data: null,            // results of fetchAllData (set when brief loads)
  loading: false,
  error: null,
};

function setState(patch) {
  state = { ...state, ...patch };
  render();
}

// ---- Render ---------------------------------------------------------------

function render() {
  const app = document.getElementById("app");
  if (state.view === "welcome")     app.innerHTML = renderWelcome(state, prefs);
  else if (state.view === "setup")  app.innerHTML = renderSetup(state, prefs);
  else if (state.view === "brief")  app.innerHTML = renderBrief(state);
  attachEvents();
  if (state.view === "brief" && state.data && !state.loading) {
    // Map needs the DOM node to exist before Leaflet initializes on it.
    initRouteMap();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---- Events --------------------------------------------------------------
// Rewired after every render because innerHTML replacement drops listeners.

function attachEvents() {
  document.querySelectorAll(".dep-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const icao = btn.dataset.icao;
      savePrefs({ departure: icao });
      setState({ view: "setup", departure: icao });
    });
  });
  document.querySelectorAll('[data-action="back-to-welcome"]').forEach((btn) => {
    btn.addEventListener("click", () => setState({
      view: "welcome", departure: null, destination: null, aircraftKey: null, data: null, error: null,
    }));
  });
  document.querySelectorAll('[data-action="back-to-setup"]').forEach((btn) => {
    btn.addEventListener("click", () => setState({ view: "setup", data: null, error: null }));
  });
  document.querySelectorAll('[data-action="print"]').forEach((btn) => {
    btn.addEventListener("click", () => window.print());
  });

  const form = document.getElementById("setup-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const dest = document.getElementById("dest-input").value.trim().toUpperCase();
      const aircraftKey = document.getElementById("aircraft-select").value;
      if (!dest || !aircraftKey) return;
      if (!/^[A-Z0-9]{3,4}$/.test(dest)) {
        alert("Destination ICAO should be 3 or 4 letters/digits (e.g., KSFO).");
        return;
      }
      savePrefs({ aircraftKey, lastDestination: dest });
      setState({ view: "brief", destination: dest, aircraftKey, loading: true, error: null, data: null });
      try {
        const data = await fetchAllData(state.departure, dest);
        // If the METAR fetch failed entirely (not just empty), surface a clean error.
        if (data.status.metars === "err" && !data.metars) {
          setState({
            loading: false,
            error: "Couldn't reach NOAA via the public CORS proxies. They may be temporarily down — try again in a minute, or expand the diagnostics panel to see which feeds failed.",
          });
          return;
        }
        if (data.metars && data.metars.length === 0) {
          setState({
            loading: false,
            error: `No METAR data returned for ${state.departure} or ${dest}. The destination ICAO may be invalid or non-reporting.`,
          });
          return;
        }
        setState({ data, loading: false });
      } catch (err) {
        setState({ error: (err && err.message) || String(err), loading: false });
      }
    });
  }
}

// ---- Boot -----------------------------------------------------------------
render();
