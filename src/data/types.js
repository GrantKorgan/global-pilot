// src/data/types.js
// ===========================================================================
// Type definitions for the data model. JSDoc instead of TypeScript so there's
// no build step — your editor (VS Code, Cursor, etc.) still picks these up
// and gives you autocomplete + tooltips on object properties.
//
// The runtime assertions (assertLeg, assertTrip) are loud failure cheap
// insurance: when something goes wrong it throws a sentence-long error that
// tells you exactly which field broke.
// ===========================================================================

/**
 * Generic contact (used for FBOs, handlers, crew, customs officers).
 * @typedef {Object} Contact
 * @property {string} name
 * @property {string} [org]
 * @property {string} [phone]
 * @property {string} [email]
 * @property {string} [notes]
 */

/**
 * A pilot or passenger.
 * @typedef {Object} CrewMember
 * @property {string} id              Stable identifier.
 * @property {string} name
 * @property {"PIC"|"SIC"|"PAX"} role
 */

/**
 * Aircraft profile. Day 4 expands this with real POH performance data
 * (takeoff/landing distance tables vs DA + weight, fuel burn curves).
 * @typedef {Object} Aircraft
 * @property {string}  id                  Unique key (e.g., "sf50-g2-plus").
 * @property {string}  label               Display name.
 * @property {string}  [tail]              Registration (e.g., "N2AK").
 * @property {number}  cruiseFt            Default cruise altitude MSL — picks the winds-aloft band.
 * @property {number}  [mtowLb]            Maximum takeoff weight (pounds).
 * @property {number}  [emptyWtLb]         Empty weight (pounds).
 * @property {number}  [usableFuelGal]     Usable fuel (gallons).
 * @property {number}  [usableFuelLb]      Usable fuel (pounds).
 * @property {number}  [cruiseKtas]        True airspeed at cruise.
 * @property {number}  [cruiseFuelGph]     Fuel burn at cruise (gph).
 * @property {number}  [serviceCeilingFt]
 * @property {number}  [rangeNm]           NBAA IFR range.
 */

/**
 * Slot or PPR status for a given leg.
 * @typedef {Object} SlotStatus
 * @property {boolean}                                   required
 * @property {"none"|"requested"|"confirmed"}            status
 * @property {string}                                    [window]    Request window (e.g., "T-7d").
 * @property {string}                                    [ref]       Reference number from handler.
 * @property {string}                                    [via]       Who you contacted (e.g., "Sky Valet").
 * @property {string}                                    [notes]
 */

/**
 * Customs / immigration filings.
 * @typedef {Object} Customs
 * @property {"entry"|"exit"|"internal"|"none"}   [schengen]
 * @property {boolean}                            [ukGarRequired]
 * @property {"draft"|"filed"|"approved"|"n/a"}   [ukGarStatus]
 * @property {boolean}                            [eapisRequired]
 * @property {"filed"|"pending"|"n/a"}            [eapisStatus]
 * @property {string}                             [notes]
 */

/**
 * Fuel uplift plan for the leg's departure.
 * @typedef {Object} FuelUplift
 * @property {number} [gal]            Target uplift in US gallons.
 * @property {number} [lb]             Target uplift in pounds.
 * @property {string} [rationale]      Why this much (e.g., "near max practical with 4 pax + bags").
 * @property {string} [priceEstimate]  Free-text (e.g., "€2.50/L").
 */

/**
 * Overnight arrangements at the destination.
 * @typedef {Object} Overnight
 * @property {string} [hotel]
 * @property {number} [nights]
 * @property {string} [rampFee]   Free-text (e.g., "€30–80/night").
 * @property {string} [notes]
 */

/**
 * Flight-plan filing window.
 * @typedef {Object} Filing
 * @property {string}  [window]     E.g., "T-24h" or "T-2h".
 * @property {boolean} [filed]
 * @property {string}  [route]
 */

/**
 * Crew assignment for a single leg.
 * @typedef {Object} LegCrew
 * @property {string}   [pic]   PIC name or id.
 * @property {string}   [sic]   SIC name or id.
 * @property {string[]} [pax]   Passenger names or ids.
 */

/**
 * FBO at both ends of a leg.
 * @typedef {Object} LegFbo
 * @property {Contact} [origin]
 * @property {Contact} [dest]
 */

/**
 * One flight leg of a trip. The operational fields (crew/fbo/slot/customs/
 * fuel/overnight/filing) are first-class so the app can surface "what's
 * missing for tomorrow's leg" without parsing a notes blob.
 *
 * @typedef {Object} Leg
 * @property {string}      id              Stable UUID; never reused on reorder.
 * @property {number}      seq             1-indexed position in the trip.
 * @property {string}      dep             ICAO of departure.
 * @property {string}      dest            ICAO of destination.
 * @property {string}      date            ISO local date at departure ("2026-06-21").
 * @property {LegCrew}     [crew]
 * @property {LegFbo}      [fbo]
 * @property {SlotStatus}  [slot]
 * @property {SlotStatus}  [ppr]
 * @property {Customs}     [customs]
 * @property {FuelUplift}  [fuel]
 * @property {Overnight}   [overnight]
 * @property {Filing}      [filing]
 * @property {string}      [notes]
 */

/**
 * A multi-leg trip — the top-level object the Trip Planner edits and persists.
 *
 * @typedef {Object} Trip
 * @property {string}  id
 * @property {string}  name             E.g., "N2AK Europe Summer 2026".
 * @property {string}  aircraftId       FK into the Aircraft library.
 * @property {string}  dateStart        ISO date.
 * @property {string}  dateEnd          ISO date.
 * @property {Leg[]}   legs             Ordered.
 * @property {number}  schemaVersion    Always 1 for now; bump on breaking changes.
 * @property {string}  [notes]
 */

// ===========================================================================
// RUNTIME VALIDATORS
// ===========================================================================

/**
 * Throw a helpful error if `leg` is missing required fields or has malformed
 * values. Cheap insurance — call this before persisting a leg.
 * @param {any} leg
 */
export function assertLeg(leg) {
  if (!leg || typeof leg !== "object") {
    throw new TypeError("Leg must be an object");
  }
  for (const key of ["id", "dep", "dest", "date"]) {
    if (!leg[key]) throw new Error(`Leg is missing required field "${key}"`);
  }
  if (!/^[A-Z0-9]{3,4}$/.test(leg.dep)) {
    throw new Error(`Leg.dep "${leg.dep}" is not a valid ICAO (expected 3–4 uppercase letters/digits)`);
  }
  if (!/^[A-Z0-9]{3,4}$/.test(leg.dest)) {
    throw new Error(`Leg.dest "${leg.dest}" is not a valid ICAO (expected 3–4 uppercase letters/digits)`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(leg.date)) {
    throw new Error(`Leg.date "${leg.date}" must be ISO YYYY-MM-DD`);
  }
}

/**
 * Throw a helpful error if `trip` is malformed. Validates every leg too.
 * @param {any} trip
 */
export function assertTrip(trip) {
  if (!trip || typeof trip !== "object") {
    throw new TypeError("Trip must be an object");
  }
  if (!trip.id) throw new Error("Trip is missing id");
  if (!trip.name) throw new Error("Trip is missing name");
  if (!Array.isArray(trip.legs)) throw new Error("Trip.legs must be an array");
  if (trip.schemaVersion !== 1) {
    throw new Error(`Unsupported Trip.schemaVersion: ${trip.schemaVersion} (expected 1)`);
  }
  trip.legs.forEach((leg, i) => {
    try { assertLeg(leg); }
    catch (e) { throw new Error(`Leg ${i + 1}: ${e.message}`); }
  });
}

/**
 * Tiny factory for new legs — sets the boring defaults so callers can stay
 * focused on the meaningful fields (dep/dest/date).
 * @param {{ dep: string, dest: string, date: string, seq?: number }} init
 * @returns {Leg}
 */
export function newLeg(init) {
  return {
    id: cryptoRandomId(),
    seq: init.seq ?? 1,
    dep: init.dep,
    dest: init.dest,
    date: init.date,
  };
}

/**
 * Tiny factory for new trips.
 * @param {{ name: string, aircraftId: string, dateStart: string, dateEnd: string }} init
 * @returns {Trip}
 */
export function newTrip(init) {
  return {
    id: cryptoRandomId(),
    name: init.name,
    aircraftId: init.aircraftId,
    dateStart: init.dateStart,
    dateEnd: init.dateEnd,
    legs: [],
    schemaVersion: 1,
  };
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // Fallback for older environments — good enough collision resistance for us.
  return "id-" + Math.random().toString(36).slice(2, 10) + "-" + Date.now().toString(36);
}
