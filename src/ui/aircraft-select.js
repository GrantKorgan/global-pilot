// src/ui/aircraft-select.js
// ---------------------------------------------------------------------------
// Grouped <optgroup> markup for the aircraft dropdown. Shared by the
// single-leg setup screen and the trip editor so the two stay in sync.
//
// Walks AIRCRAFT_CATALOG → categories → groups → models, emitting one
// <optgroup label="..."> per group with one <option value="key"> per model.
// The currently selected key (if any) gets `selected`.
// ---------------------------------------------------------------------------

import { AIRCRAFT_CATALOG } from "../data/aircraft-catalog.js";
import { escAttr, escText } from "./escape.js";

export function aircraftSelectOptions(selectedKey) {
  const optgroups = [];
  for (const category of Object.values(AIRCRAFT_CATALOG)) {
    for (const group of Object.values(category.groups)) {
      const opts = group.models.map((m) => {
        const sel = m.key === selectedKey ? " selected" : "";
        return `<option value="${escAttr(m.key)}"${sel}>${escText(m.label)}</option>`;
      }).join("");
      optgroups.push(`<optgroup label="${escAttr(group.label)}">${opts}</optgroup>`);
    }
  }
  return optgroups.join("");
}
