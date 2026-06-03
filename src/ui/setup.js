// src/ui/setup.js
// ---------------------------------------------------------------------------
// Setup screen for the single-leg brief path: departure ICAO + destination
// ICAO + aircraft (either via dropdown OR by tail-number lookup).
//
// The aircraft section is a two-column split:
//   LEFT  — grouped dropdown over the full catalog
//   RIGHT — tail-number input → FAA registry → catalog auto-match
//
// Either path sets `state.aircraftKey`. Tail-number lookup also writes
// `state.tailLookup` so we can show the resolved make/model + confidence
// in the inline result box.
//
// Form submission wires in app.js. The trip-leg path skips this screen
// entirely — clicking "Brief" on a leg in the trip editor goes straight
// to the brief view.
// ---------------------------------------------------------------------------

import { aircraftSelectOptions } from "./aircraft-select.js";
import { escAttr, escText } from "./escape.js";

export function renderSetup(state, prefs) {
  const lastDep  = (prefs && prefs.departure)       || state.departure  || "";
  const lastDest = (prefs && prefs.lastDestination) || state.destination || "";
  // Prefer the in-flight tail (so the input stays populated during pending /
  // result re-renders) over the persisted last-used tail.
  const lastTail = (state.tailLookup && state.tailLookup.tail)
                || (prefs && prefs.tail)
                || "";
  const aircraftOptions = aircraftSelectOptions(state.aircraftKey);

  return `
    <div class="hero-bg setup-bg">
      <div class="screen">
        <button class="back-btn" data-action="back-to-welcome">← welcome</button>
        <h1>Single-leg brief</h1>
        <p class="lead">
          Departure, destination, aircraft — three fields and we'll pull live weather for both ends.
        </p>
        <form id="setup-form" class="setup-form" autocomplete="off">
          <label>
            Departure ICAO
            <input type="text" id="dep-input" placeholder="e.g. KRNO" maxlength="4" value="${escAttr(lastDep)}" required>
          </label>
          <label>
            Destination ICAO
            <input type="text" id="dest-input" placeholder="e.g. KSFO" maxlength="4" value="${escAttr(lastDest)}" required>
          </label>

          <!-- Aircraft section — two-column split: catalog dropdown OR tail-number lookup -->
          <fieldset class="aircraft-picker">
            <legend>Aircraft</legend>
            <div class="aircraft-picker-grid">

              <!-- LEFT: catalog dropdown -->
              <div class="aircraft-picker-col">
                <label>
                  Pick from catalog
                  <select id="aircraft-select" required>
                    <option value="" disabled ${!state.aircraftKey ? "selected" : ""}>Select aircraft…</option>
                    ${aircraftOptions}
                  </select>
                  <span class="form-hint">Specs auto-fill from Wikipedia on first selection.</span>
                </label>
              </div>

              <div class="aircraft-picker-divider"><span>or</span></div>

              <!-- RIGHT: tail-number lookup -->
              <div class="aircraft-picker-col">
                <label>
                  Look up by tail number
                  <div class="tail-input-row">
                    <input
                      type="text"
                      id="tail-input"
                      placeholder="e.g. N2AK"
                      maxlength="6"
                      value="${escAttr(lastTail)}"
                      autocomplete="off"
                    >
                    <button
                      type="button"
                      class="ghost-btn"
                      id="tail-lookup-btn"
                      style="margin-top:0;"
                    >Look up →</button>
                  </div>
                  <span class="form-hint">Queries the FAA N-Number registry via your worker, then matches to a catalog entry.</span>
                </label>
                ${renderTailLookupResult(state.tailLookup)}
              </div>

            </div>
          </fieldset>

          <button type="submit" class="primary-btn">Build brief →</button>
        </form>
      </div>
    </div>
  `;
}

// Inline result box under the tail-number input. Shows pending /
// success / failure states.
function renderTailLookupResult(lookup) {
  if (!lookup) return "";
  if (lookup.status === "pending") {
    return `<div class="tail-result tail-result-pending">Looking up <strong>${escText(lookup.tail || "")}</strong> in the FAA registry…</div>`;
  }
  if (lookup.status === "error") {
    return `<div class="tail-result tail-result-error">⚠ ${escText(lookup.message || "Lookup failed.")}</div>`;
  }
  if (lookup.status === "success") {
    const matched = lookup.matchedLabel
      ? `Matched to <strong>${escText(lookup.matchedLabel)}</strong>${lookup.confidence != null ? ` (confidence ${lookup.confidence})` : ""}`
      : `<span style="color:var(--warn);">No confident catalog match — pick manually from the dropdown.</span>`;
    return `
      <div class="tail-result tail-result-success">
        <div class="tail-result-faa">
          <strong>${escText(lookup.tail)}</strong>
          ${lookup.year ? `· ${lookup.year}` : ""}
          · ${escText(lookup.make || "")}
          ${escText(lookup.model || "") ? `· ${escText(lookup.model)}` : ""}
          ${lookup.owner ? `<div class="tail-result-owner">Owner: ${escText(lookup.owner)}</div>` : ""}
          ${lookup.status_faa ? `<div class="tail-result-owner">Status: ${escText(lookup.status_faa)}</div>` : ""}
        </div>
        <div class="tail-result-match">${matched}</div>
      </div>
    `;
  }
  return "";
}
