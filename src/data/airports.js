// src/data/airports.js
// ---------------------------------------------------------------------------
// Static airport data. The DEPARTURES table powers the six big buttons on the
// welcome screen. The FB_STATIONS table is used by calc/geo.js to pick the
// nearest winds-aloft forecast point for any destination.
//
// To add another departure airport, copy one entry. To extend FB station
// coverage, add a lat/lon entry.
// ---------------------------------------------------------------------------

// Departure airports — the six fields on the welcome screen.
//
// elev      = field elevation in feet MSL (used for density altitude).
// runways   = each runway's lower-numbered heading in degrees magnetic.
//             The reciprocal (opposite end) is hdg+180. For "16R/34L" we
//             store hdg=167 because runway 16 points 167°.
//             `lengthFt` is total runway length (used for SF50 takeoff verdict).
// lat/lon   = field location (used for the route map).
// fbStation = the 3-letter station code NOAA uses on the FB chart.
export const DEPARTURES = {
  KRNO: {
    name: "Reno-Tahoe International",
    elev: 4415,
    lat: 39.4991, lon: -119.7681,
    runways: [
      { id: "16R/34L", hdg: 167, lengthFt: 11002 },
      { id: "16L/34R", hdg: 167, lengthFt:  9000 },
      { id: "07/25",   hdg:  64, lengthFt:  6102 },
    ],
    fbStation: "RNO",
  },
  KTRK: {
    name: "Truckee-Tahoe",
    elev: 5901,
    lat: 39.3200, lon: -120.1397,
    runways: [
      { id: "11/29", hdg: 110, lengthFt: 7001 },
      { id: "02/20", hdg:  20, lengthFt: 4650 },
    ],
    fbStation: "RNO",
  },
  KRTS: {
    name: "Reno Stead",
    elev: 5050,
    lat: 39.6669, lon: -119.8757,
    runways: [
      { id: "08/26", hdg:  80, lengthFt: 9000 },
      { id: "14/32", hdg: 140, lengthFt: 7605 },
    ],
    fbStation: "RNO",
  },
  KCXP: {
    name: "Carson",
    elev: 4697,
    lat: 39.1922, lon: -119.7342,
    runways: [
      { id: "09/27", hdg:  90, lengthFt: 6099 },
    ],
    fbStation: "RNO",
  },
  KMEV: {
    name: "Minden-Tahoe",
    elev: 4722,
    lat: 38.9978, lon: -119.7511,
    runways: [
      { id: "16/34", hdg: 160, lengthFt: 7400 },
      { id: "12/30", hdg: 120, lengthFt: 5300 },
    ],
    fbStation: "RNO",
  },
  KTVL: {
    name: "South Lake Tahoe",
    elev: 6269,
    lat: 38.8939, lon: -119.9953,
    runways: [
      { id: "18/36", hdg: 180, lengthFt: 8544 },
    ],
    fbStation: "TVL",
  },
};

// FB (winds-aloft) forecast stations. Used to pick the nearest forecast
// point to any destination ICAO. Coordinates are approximate — good enough
// for picking the closest of ~50 candidates.
export const FB_STATIONS = {
  // West coast + Cascades
  SEA: { lat: 47.5, lon: -122.3 }, OLM: { lat: 47.0, lon: -122.9 },
  YKM: { lat: 46.6, lon: -120.5 }, PDX: { lat: 45.6, lon: -122.6 },
  EUG: { lat: 44.1, lon: -123.2 }, OTH: { lat: 43.4, lon: -124.2 },
  MFR: { lat: 42.4, lon: -122.9 }, RBL: { lat: 40.2, lon: -122.3 },
  RDD: { lat: 40.5, lon: -122.3 }, FOT: { lat: 40.6, lon: -124.1 },
  // California
  SAC: { lat: 38.7, lon: -121.6 }, SFO: { lat: 37.6, lon: -122.4 },
  OAK: { lat: 37.7, lon: -122.2 }, FAT: { lat: 36.8, lon: -119.7 },
  LAX: { lat: 33.9, lon: -118.4 }, ONT: { lat: 34.1, lon: -117.6 },
  SAN: { lat: 32.7, lon: -117.2 }, WJF: { lat: 34.7, lon: -118.2 },
  BIH: { lat: 37.4, lon: -118.4 },
  // Great Basin
  RNO: { lat: 39.5, lon: -119.8 }, TVL: { lat: 38.9, lon: -120.0 },
  LAS: { lat: 36.1, lon: -115.2 }, BOI: { lat: 43.6, lon: -116.2 },
  SLC: { lat: 40.8, lon: -111.9 }, BCE: { lat: 37.7, lon: -112.1 },
  // Northern Rockies / High Plains
  GEG: { lat: 47.6, lon: -117.5 }, MSO: { lat: 46.9, lon: -114.1 },
  BIL: { lat: 45.8, lon: -108.5 }, GTF: { lat: 47.5, lon: -111.4 },
  HLN: { lat: 46.6, lon: -112.0 }, RAP: { lat: 44.0, lon: -103.1 },
  // Desert SW + Rockies
  PHX: { lat: 33.4, lon: -112.0 }, TUS: { lat: 32.1, lon: -110.9 },
  ABQ: { lat: 35.0, lon: -106.6 }, ELP: { lat: 31.8, lon: -106.4 },
  DEN: { lat: 39.9, lon: -104.7 }, PUB: { lat: 38.3, lon: -104.5 },
  GJT: { lat: 39.1, lon: -108.5 }, FMN: { lat: 36.7, lon: -108.2 },
  // Central
  AMA: { lat: 35.2, lon: -101.7 }, OKC: { lat: 35.4, lon: -97.6 },
  DFW: { lat: 32.9, lon: -97.0 },  IAH: { lat: 30.0, lon: -95.3 },
  MSY: { lat: 29.9, lon: -90.3 },  STL: { lat: 38.7, lon: -90.4 },
  DSM: { lat: 41.5, lon: -93.7 },  MKC: { lat: 39.1, lon: -94.6 },
  MSP: { lat: 44.9, lon: -93.2 },  ORD: { lat: 41.9, lon: -87.9 },
  // East
  MEM: { lat: 35.0, lon: -89.9 },  ATL: { lat: 33.6, lon: -84.4 },
  JAX: { lat: 30.5, lon: -81.7 },  MIA: { lat: 25.8, lon: -80.3 },
  CLE: { lat: 41.4, lon: -81.9 },  PIT: { lat: 40.5, lon: -80.2 },
  DCA: { lat: 38.9, lon: -77.0 },  JFK: { lat: 40.6, lon: -73.8 },
  BOS: { lat: 42.4, lon: -71.0 },
};
