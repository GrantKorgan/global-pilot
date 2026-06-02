// src/data/aircraft.js
// ---------------------------------------------------------------------------
// Aircraft lookup.
//
// The full catalog (grouped for the dropdown) lives in
// `./aircraft-catalog.js`. This module re-exports the flat lookup map as
// `AIRCRAFT` so the rest of the app (which does `AIRCRAFT[state.aircraftKey]`
// to read `{ label, cruiseFt, perfKey? }`) keeps working without changes.
//
// Adding/editing aircraft → edit `aircraft-catalog.js`. Don't edit this file.
// ---------------------------------------------------------------------------

import { AIRCRAFT_BY_KEY } from "./aircraft-catalog.js";

export const AIRCRAFT = AIRCRAFT_BY_KEY;
