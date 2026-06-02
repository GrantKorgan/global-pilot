// src/data/cafes.js
// ---------------------------------------------------------------------------
// THE $1,000 CHEESEBURGER STARTER LIST
//
// Curated airport cafes — fly-in restaurants pilots actually go to. Every
// entry below is a long-established spot well-known in the GA community,
// but hours / menus / even whether they're still open change month to
// month. We deliberately don't show hours or prices here; we link out to
// AirNav (for airport info) and flytolunch.com (for current cafe details)
// so the source-of-truth on "are they open right now" stays where it
// belongs — with sites that update daily.
//
// HOW TO ADD A CAFE
//   Copy any entry. Required fields: id, name, icao, city, blurb. ID
//   should be `<icao-lower>-<short-slug>`. Keep blurbs to one sentence —
//   what makes this place worth flying to.
// ---------------------------------------------------------------------------

export const CAFES = [
  {
    id: "khaf-three-zero",
    name: "Three-Zero Cafe",
    icao: "KHAF",
    airport: "Half Moon Bay Airport",
    city: "Half Moon Bay, CA",
    country: "US",
    blurb: "Classic NorCal fly-in breakfast right on the field. Pacific views, an easy coastal approach, and a Saturday morning ritual for Bay Area pilots since the 1990s.",
  },
  {
    id: "klvk-amelias",
    name: "Amelia's Restaurant",
    icao: "KLVK",
    airport: "Livermore Municipal",
    city: "Livermore, CA",
    country: "US",
    blurb: "Sit-down dining at one of the busier Bay Area GA fields. Reliable lunch stop after touring the East Bay; ramp parking is straightforward.",
  },
  {
    id: "kvcb-tabletop",
    name: "The Tabletop Cafe",
    icao: "KVCB",
    airport: "Nut Tree Airport",
    city: "Vacaville, CA",
    country: "US",
    blurb: "On-field cafe at Nut Tree with a long history. A short hop from anywhere in NorCal makes it a popular brunch destination.",
  },
  {
    id: "kluk-sky-galley",
    name: "Sky Galley",
    icao: "KLUK",
    airport: "Cincinnati Municipal — Lunken Field",
    city: "Cincinnati, OH",
    country: "US",
    blurb: "Inside the 1937 art-deco terminal at Lunken Field. Floor-to-ceiling windows looking out at the runway — one of the prettiest historic terminals you can fly to.",
  },
  {
    id: "kmsn-jet-room",
    name: "The Jet Room",
    icao: "KMSN",
    airport: "Dane County Regional",
    city: "Madison, WI",
    country: "US",
    blurb: "Glass-walled restaurant overlooking the active runway. Reliable, well-run, and a long-standing Midwest favorite — flight school students and corporate crews mix here.",
  },
  {
    id: "1k1-stearman",
    name: "Stearman Field Bar & Grill",
    icao: "1K1",
    airport: "Stearman Field",
    city: "Benton, KS",
    country: "US",
    blurb: "On-field restaurant at a working antique-aircraft strip. Friday-night burger nights are an event; the runway-side patio in summer is the point.",
  },
  {
    id: "7b3-airfield-cafe",
    name: "Airfield Cafe",
    icao: "7B3",
    airport: "Hampton Airfield",
    city: "Hampton, NH",
    country: "US",
    blurb: "Grass strip with a breakfast cafe in a converted farmhouse. New England fly-in classic; the strip itself is part of the charm.",
  },
  {
    id: "khwd-hangar-1",
    name: "Hangar One Restaurant",
    icao: "KHWD",
    airport: "Hayward Executive",
    city: "Hayward, CA",
    country: "US",
    blurb: "On-field lunch with a view of the active. East Bay's quieter alternative when KOAK / KSFO get busy; easy reservation, easy parking.",
  },
  {
    id: "sc00-triple-tree",
    name: "Triple Tree Aerodrome",
    icao: "SC00",
    airport: "Triple Tree (Pat Hartness Field)",
    city: "Woodruff, SC",
    country: "US",
    blurb: "Privately-owned grass strip + clubhouse that hosts one of the most beloved fly-ins in the country every September. Open to visiting pilots by prior arrangement — call ahead, always.",
  },
  {
    id: "krhv-airport-cafe",
    name: "Reid-Hillview Airport Cafe",
    icao: "KRHV",
    airport: "Reid-Hillview of Santa Clara County",
    city: "San Jose, CA",
    country: "US",
    blurb: "South Bay GA staple. Tight-knit airport with an on-field diner; the kind of place a $100 cheeseburger turned into a $1,000 cheeseburger before anyone was paying attention.",
  },
];
