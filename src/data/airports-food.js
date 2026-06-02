// src/data/airports-food.js
// ---------------------------------------------------------------------------
// LAYER 1 — AIRPORTS WITH FOOD ON FIELD
//
// This is the "broader" food layer. CAFES (in cafes.js) are individually
// curated with full blurbs — places we've vouched for. This file is the
// flag layer: airports known to have on-field food. Lighter detail, wider
// coverage.
//
// The long-term plan is auto-refresh from FAA NASR ("food on airport"
// service flag, ~1,500 lower-48 airports). See:
//   scripts/import-nasr.mjs        — parser + emitter
//   .github/workflows/refresh-airports.yml  — monthly GH Action
//
// Until that pipeline runs, this file is hand-seeded with US fields that
// are well-known fly-in food stops in the GA community. Names of the cafes
// themselves are NOT recorded here on purpose — those rot fast. We carry
// just "this airport has food, here's the AirNav link, verify before you
// fly." Names + hours + ratings come in Layer 2 (Google Places).
//
// SCHEMA
//   id        — kebab-case slug, unique
//   icao      — uppercase identifier (3-char FAA codes like N40, 06C kept
//               as-is — small US fields don't get a K-prefix)
//   airport   — human airport name
//   city      — "City, ST"
//   region    — coarse US region for filtering
//   source    — "curated" (manual) | "faa-nasr" (auto-import) | "google-places"
//   noteShort — optional one-liner; "" if nothing to say
//
// If an entry has a corresponding detailed cafe in CAFES, OMIT it here.
// Don't duplicate. The cafes screen renders both lists; duplicates would
// look messy.
// ---------------------------------------------------------------------------

export const AIRPORTS_WITH_FOOD = [

  // ---- NorCal -------------------------------------------------------------
  { id: "ksql-food",  icao: "KSQL",  airport: "San Carlos",            city: "San Carlos, CA",        region: "NorCal",      source: "curated", noteShort: "On-field diner, busy GA reliever between SFO and SJC." },
  { id: "kwvi-food",  icao: "KWVI",  airport: "Watsonville Muni",      city: "Watsonville, CA",       region: "NorCal",      source: "curated", noteShort: "Coastal field with a sit-down cafe; popular weekend hop from the Bay Area." },
  { id: "kccr-food",  icao: "KCCR",  airport: "Buchanan Field",        city: "Concord, CA",           region: "NorCal",      source: "curated", noteShort: "" },
  { id: "kapc-food",  icao: "KAPC",  airport: "Napa County",           city: "Napa, CA",              region: "NorCal",      source: "curated", noteShort: "Wine-country GA hub; multiple food options on or near the field." },
  { id: "ksts-food",  icao: "KSTS",  airport: "Charles M. Schulz",     city: "Santa Rosa, CA",        region: "NorCal",      source: "curated", noteShort: "" },
  { id: "kaun-food",  icao: "KAUN",  airport: "Auburn Muni",           city: "Auburn, CA",            region: "NorCal",      source: "curated", noteShort: "Foothills field with a long-running on-field grill." },
  { id: "ksac-food",  icao: "KSAC",  airport: "Sacramento Exec",       city: "Sacramento, CA",        region: "NorCal",      source: "curated", noteShort: "" },
  { id: "ko22-food",  icao: "O22",   airport: "Columbia",              city: "Columbia, CA",          region: "NorCal",      source: "curated", noteShort: "Sierra-foothills field; small but well-loved." },

  // ---- SoCal --------------------------------------------------------------
  { id: "kcno-food",  icao: "KCNO",  airport: "Chino",                 city: "Chino, CA",             region: "SoCal",       source: "curated", noteShort: "Planes of Fame next door; iconic on-field cafe with cockpit views." },
  { id: "kcma-food",  icao: "KCMA",  airport: "Camarillo",             city: "Camarillo, CA",         region: "SoCal",       source: "curated", noteShort: "Long-running on-field cafe; CAF museum next door." },
  { id: "kmyf-food",  icao: "KMYF",  airport: "Montgomery Field",      city: "San Diego, CA",         region: "SoCal",       source: "curated", noteShort: "Sit-down Mexican on the field; reliable weekend lunch run." },
  { id: "ksee-food",  icao: "KSEE",  airport: "Gillespie Field",       city: "El Cajon, CA",          region: "SoCal",       source: "curated", noteShort: "" },
  { id: "krnm-food",  icao: "KRNM",  airport: "Ramona",                city: "Ramona, CA",            region: "SoCal",       source: "curated", noteShort: "Inland SoCal field with a long-running roadhouse-style cafe." },
  { id: "kful-food",  icao: "KFUL",  airport: "Fullerton Muni",        city: "Fullerton, CA",         region: "SoCal",       source: "curated", noteShort: "" },
  { id: "kemt-food",  icao: "KEMT",  airport: "San Gabriel Valley",    city: "El Monte, CA",          region: "SoCal",       source: "curated", noteShort: "" },
  { id: "kajo-food",  icao: "KAJO",  airport: "Corona Muni",           city: "Corona, CA",            region: "SoCal",       source: "curated", noteShort: "" },
  { id: "kvny-food",  icao: "KVNY",  airport: "Van Nuys",              city: "Van Nuys, CA",          region: "SoCal",       source: "curated", noteShort: "Largest US GA-only airport; multiple food options on field." },

  // ---- Pacific Northwest --------------------------------------------------
  { id: "kawo-food",  icao: "KAWO",  airport: "Arlington Muni",        city: "Arlington, WA",         region: "PacNW",       source: "curated", noteShort: "On-field diner; well-known weekend fly-in stop north of Seattle." },
  { id: "kpae-food",  icao: "KPAE",  airport: "Paine Field",           city: "Everett, WA",           region: "PacNW",       source: "curated", noteShort: "Future of Flight museum + multiple food options on field." },

  // ---- Midwest ------------------------------------------------------------
  { id: "kdpa-food",  icao: "KDPA",  airport: "DuPage",                city: "West Chicago, IL",      region: "Midwest",     source: "curated", noteShort: "Themed sit-down restaurant on field, west of Chicago." },
  { id: "06c-food",   icao: "06C",   airport: "Schaumburg Reg.",       city: "Schaumburg, IL",        region: "Midwest",     source: "curated", noteShort: "On-field cafe long known to Chicago-area pilots." },
  { id: "kugn-food",  icao: "KUGN",  airport: "Waukegan National",     city: "Waukegan, IL",          region: "Midwest",     source: "curated", noteShort: "" },
  { id: "kbed-food",  icao: "KBED",  airport: "Hanscom Field",         city: "Bedford, MA",           region: "Northeast",   source: "curated", noteShort: "Multiple food options between the terminal and the FBOs." },

  // ---- Northeast ----------------------------------------------------------
  { id: "kfrg-food",  icao: "KFRG",  airport: "Republic",              city: "Farmingdale, NY",       region: "Northeast",   source: "curated", noteShort: "Long Island GA hub; well-known themed restaurant on the field." },
  { id: "kash-food",  icao: "KASH",  airport: "Nashua / Boire Field",  city: "Nashua, NH",            region: "Northeast",   source: "curated", noteShort: "Midfield cafe long-running with the local pilot community." },
  { id: "1b9-food",   icao: "1B9",   airport: "Mansfield Muni",        city: "Mansfield, MA",         region: "Northeast",   source: "curated", noteShort: "On-field restaurant; reliable lunch destination from the Boston area." },

  // ---- Mid-Atlantic -------------------------------------------------------
  { id: "kfdk-food",  icao: "KFDK",  airport: "Frederick Muni",        city: "Frederick, MD",         region: "MidAtlantic", source: "curated", noteShort: "AOPA headquarters field; on-field restaurant well-known to GA pilots." },
  { id: "kw29-food",  icao: "W29",   airport: "Bay Bridge",            city: "Stevensville, MD",      region: "MidAtlantic", source: "curated", noteShort: "Chesapeake-side restaurant on the field; a Mid-Atlantic destination." },
  { id: "kilg-food",  icao: "KILG",  airport: "Wilmington / New Castle",city: "Wilmington, DE",       region: "MidAtlantic", source: "curated", noteShort: "" },

  // ---- Southeast ----------------------------------------------------------
  { id: "klal-food",  icao: "KLAL",  airport: "Lakeland Linder",       city: "Lakeland, FL",          region: "Southeast",   source: "curated", noteShort: "Sun 'n Fun home base; multiple food options including a long-running on-field spot." },
  { id: "ksef-food",  icao: "KSEF",  airport: "Sebring Regional",      city: "Sebring, FL",           region: "Southeast",   source: "curated", noteShort: "On-field cafe; popular weekend fly-in for central Florida." },
  { id: "kspg-food",  icao: "KSPG",  airport: "Albert Whitted",        city: "St. Petersburg, FL",    region: "Southeast",   source: "curated", noteShort: "Waterfront field; long-established restaurant overlooking the ramp." },
  { id: "korl-food",  icao: "KORL",  airport: "Orlando Executive",     city: "Orlando, FL",           region: "Southeast",   source: "curated", noteShort: "On-field restaurant well-known to GA pilots." },
  { id: "klna-food",  icao: "KLNA",  airport: "Palm Beach County Park",city: "Lantana, FL",           region: "Southeast",   source: "curated", noteShort: "On-field Italian; weekend fly-in destination from across S. FL." },

  // ---- South Central ------------------------------------------------------
  { id: "ktki-food",  icao: "KTKI",  airport: "McKinney National",     city: "McKinney, TX",          region: "SouthCentral",source: "curated", noteShort: "On-field cafe; busy GA reliever north of DFW." },
  { id: "kcxo-food",  icao: "KCXO",  airport: "Conroe-North Houston",  city: "Conroe, TX",            region: "SouthCentral",source: "curated", noteShort: "Sit-down restaurant on the field, north of Houston." },
  { id: "kads-food",  icao: "KADS",  airport: "Addison",               city: "Addison, TX",           region: "SouthCentral",source: "curated", noteShort: "GA-focused field surrounded by Addison's restaurant row." },
  { id: "kdwh-food",  icao: "KDWH",  airport: "Hooks Memorial",        city: "Houston, TX",           region: "SouthCentral",source: "curated", noteShort: "" },

  // ---- Mountain West / Great Basin ----------------------------------------
  { id: "kcxp-food",  icao: "KCXP",  airport: "Carson City",           city: "Carson City, NV",       region: "MtnWest",     source: "curated", noteShort: "On-field cafe; a short hop south of Reno." },
];

// Quick stats for UI rendering (avoids counting in render path each frame).
export const AIRPORTS_WITH_FOOD_COUNT = AIRPORTS_WITH_FOOD.length;
