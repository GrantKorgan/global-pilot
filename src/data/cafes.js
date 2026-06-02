// src/data/cafes.js
// ---------------------------------------------------------------------------
// THE $1,000 CHEESEBURGER LIST
//
// Curated airport cafes — fly-in restaurants pilots actually go to. Every
// entry below is a long-established spot well-known in the GA community,
// but hours / menus / even whether they're still open change month to
// month. We deliberately don't show hours or prices here; we link out to
// AirNav (for airport info) and flytolunch.com (for current cafe details)
// so the source-of-truth on "are they open right now" stays where it
// belongs — with sites that update daily.
//
// v4 PLAN: replace this hand-curated list with a self-updating pipeline:
//   - Layer 1: FAA NASR "food on field" boolean (free, monthly refresh,
//     ~1,500 airports in lower 48 — comprehensive but no cafe names).
//   - Layer 2: Google Places API per-airport enrichment (paid, ~$2/mo,
//     adds cafe names + hours + ratings + open-now status).
//   - Layer 3 (this file): keeps existing as "verified by pilots in our
//     community" tier on top.
//
// HOW TO ADD A CAFE
//   Copy any entry. Required fields: id, name, icao, city, blurb. ID
//   should be `<icao-lower>-<short-slug>`. Optional: region (for future
//   filtering). Keep blurbs to one sentence — what makes this place
//   worth flying to.
// ---------------------------------------------------------------------------

export const CAFES = [

  // ---- NorCal / Bay Area --------------------------------------------------
  {
    id: "khaf-three-zero",
    name: "Three-Zero Cafe",
    icao: "KHAF",
    airport: "Half Moon Bay Airport",
    city: "Half Moon Bay, CA",
    country: "US",
    region: "NorCal",
    blurb: "Classic NorCal fly-in breakfast right on the field. Pacific views, an easy coastal approach, and a Saturday morning ritual for Bay Area pilots since the 1990s.",
  },
  {
    id: "klvk-amelias",
    name: "Amelia's Restaurant",
    icao: "KLVK",
    airport: "Livermore Municipal",
    city: "Livermore, CA",
    country: "US",
    region: "NorCal",
    blurb: "Sit-down dining at one of the busier Bay Area GA fields. Reliable lunch stop after touring the East Bay; ramp parking is straightforward.",
  },
  {
    id: "kvcb-tabletop",
    name: "The Tabletop Cafe",
    icao: "KVCB",
    airport: "Nut Tree Airport",
    city: "Vacaville, CA",
    country: "US",
    region: "NorCal",
    blurb: "On-field cafe at Nut Tree with a long history. A short hop from anywhere in NorCal makes it a popular brunch destination.",
  },
  {
    id: "khwd-hangar-1",
    name: "Hangar One Restaurant",
    icao: "KHWD",
    airport: "Hayward Executive",
    city: "Hayward, CA",
    country: "US",
    region: "NorCal",
    blurb: "On-field lunch with a view of the active. East Bay's quieter alternative when KOAK / KSFO get busy; easy reservation, easy parking.",
  },
  {
    id: "krhv-airport-cafe",
    name: "Reid-Hillview Airport Cafe",
    icao: "KRHV",
    airport: "Reid-Hillview of Santa Clara County",
    city: "San Jose, CA",
    country: "US",
    region: "NorCal",
    blurb: "South Bay GA staple. Tight-knit airport with an on-field diner; the kind of place a $100 cheeseburger turned into a $1,000 cheeseburger before anyone was paying attention.",
  },

  // ---- SoCal --------------------------------------------------------------
  {
    id: "kavx-dc3",
    name: "DC-3 Gifts & Grill",
    icao: "KAVX",
    airport: "Catalina Airport (Airport in the Sky)",
    city: "Avalon, CA",
    country: "US",
    region: "SoCal",
    blurb: "Iconic island mesa-top airport at 1,602 ft elevation. Buffalo burgers, gift shop, and one of the most famous fly-in destinations in the US — make sure you've got the runway briefing.",
  },
  {
    id: "l35-barnstormer",
    name: "Barnstormer Restaurant",
    icao: "L35",
    airport: "Big Bear City Airport",
    city: "Big Bear City, CA",
    country: "US",
    region: "SoCal",
    blurb: "High-altitude mountain fly-in at 6,752 ft elevation, ringed by ski country. Lakeside views; classic SoCal weekend destination. DA at noon on a summer day is humbling — check perf.",
  },

  // ---- Southwest / Mountain ----------------------------------------------
  {
    id: "ksez-mesa-grill",
    name: "The Mesa Grill",
    icao: "KSEZ",
    airport: "Sedona Airport",
    city: "Sedona, AZ",
    country: "US",
    region: "Southwest",
    blurb: "Atop the Sedona mesa at 4,830 ft, overlooking red-rock canyons. One of the most visually dramatic fly-in restaurants in the country; the approach itself is worth the trip.",
  },
  {
    id: "kmhv-voyager",
    name: "Voyager Restaurant",
    icao: "KMHV",
    airport: "Mojave Air & Space Port",
    city: "Mojave, CA",
    country: "US",
    region: "Southwest",
    blurb: "On-field at the legendary test-pilot and rocket-development airfield. Walls of memorabilia from Rutan, Beech, SpaceShipOne. Burgers + pilot history + boneyard views.",
  },
  {
    id: "kffz-falcon-field",
    name: "Falcon Field Restaurant",
    icao: "KFFZ",
    airport: "Falcon Field",
    city: "Mesa, AZ",
    country: "US",
    region: "Southwest",
    blurb: "Phoenix-area fly-in destination at one of the busier GA fields in the Southwest. Easy access, reliable lunch, plenty of warbird traffic to watch.",
  },

  // ---- Pacific Northwest --------------------------------------------------
  {
    id: "kplu-tailwinds",
    name: "Tailwinds Cafe",
    icao: "KPLU",
    airport: "Pierce County / Thun Field",
    city: "Puyallup, WA",
    country: "US",
    region: "Pacific Northwest",
    blurb: "Puget Sound GA go-to. On-field, runway views, Mount Rainier looms behind on a clear day. Friendly local crowd; a short hop from KBFI or KRNT.",
  },

  // ---- Midwest ------------------------------------------------------------
  {
    id: "kmsn-jet-room",
    name: "The Jet Room",
    icao: "KMSN",
    airport: "Dane County Regional",
    city: "Madison, WI",
    country: "US",
    region: "Midwest",
    blurb: "Glass-walled restaurant overlooking the active runway. Reliable, well-run, and a long-standing Midwest favorite — flight school students and corporate crews mix here.",
  },
  {
    id: "1k1-stearman",
    name: "Stearman Field Bar & Grill",
    icao: "1K1",
    airport: "Stearman Field",
    city: "Benton, KS",
    country: "US",
    region: "Midwest",
    blurb: "On-field restaurant at a working antique-aircraft strip. Friday-night burger nights are an event; the runway-side patio in summer is the point.",
  },
  {
    id: "kmic-crystal",
    name: "Crystal Airport Cafe",
    icao: "KMIC",
    airport: "Crystal Airport",
    city: "Crystal, MN",
    country: "US",
    region: "Midwest",
    blurb: "Minneapolis-area GA staple with a long-running on-field cafe. Convenient stop for north-central training and weekend flying.",
  },
  {
    id: "ksgs-skyway",
    name: "Skyway Cafe",
    icao: "KSGS",
    airport: "South St. Paul Municipal / Fleming Field",
    city: "South St. Paul, MN",
    country: "US",
    region: "Midwest",
    blurb: "Historic field with a well-loved on-airport restaurant. Mississippi River views from the pattern; the cafe has been a Twin Cities pilot anchor for decades.",
  },
  {
    id: "10c-cubbys",
    name: "Cubby's at Galt",
    icao: "10C",
    airport: "Galt Field",
    city: "Greenwood, IL",
    country: "US",
    region: "Midwest",
    blurb: "Grass-strip fly-in restaurant northwest of Chicago. The kind of place where the parking-area conversation is half of why you came.",
  },

  // ---- Ohio Valley --------------------------------------------------------
  {
    id: "kluk-sky-galley",
    name: "Sky Galley",
    icao: "KLUK",
    airport: "Cincinnati Municipal — Lunken Field",
    city: "Cincinnati, OH",
    country: "US",
    region: "Midwest",
    blurb: "Inside the 1937 art-deco terminal at Lunken Field. Floor-to-ceiling windows looking out at the runway — one of the prettiest historic terminals you can fly to.",
  },

  // ---- Mid-Atlantic / NJ corridor ----------------------------------------
  {
    id: "kn40-sky-manor",
    name: "Sky Manor Cafe",
    icao: "N40",
    airport: "Sky Manor Airport",
    city: "Pittstown, NJ",
    country: "US",
    region: "Mid-Atlantic",
    blurb: "Long-running NJ Sunday-brunch destination at a small, friendly field. One of those places where every table eventually starts swapping flying stories.",
  },
  {
    id: "n51-solbergs",
    name: "Sweet Potato Cafe at Solberg",
    icao: "N51",
    airport: "Solberg-Hunterdon",
    city: "Readington, NJ",
    country: "US",
    region: "Mid-Atlantic",
    blurb: "Family-owned NJ field; on-field cafe popular for breakfast. The aerodrome itself is a multi-generational story worth reading before you fly in.",
  },

  // ---- Northeast ----------------------------------------------------------
  {
    id: "7b3-airfield-cafe",
    name: "Airfield Cafe",
    icao: "7B3",
    airport: "Hampton Airfield",
    city: "Hampton, NH",
    country: "US",
    region: "Northeast",
    blurb: "Grass strip with a breakfast cafe in a converted farmhouse. New England fly-in classic; the strip itself is part of the charm.",
  },

  // ---- Southeast ----------------------------------------------------------
  {
    id: "sc00-triple-tree",
    name: "Triple Tree Aerodrome",
    icao: "SC00",
    airport: "Triple Tree (Pat Hartness Field)",
    city: "Woodruff, SC",
    country: "US",
    region: "Southeast",
    blurb: "Privately-owned grass strip + clubhouse that hosts one of the most beloved fly-ins in the country every September. Open to visiting pilots by prior arrangement — call ahead, always.",
  },
];
