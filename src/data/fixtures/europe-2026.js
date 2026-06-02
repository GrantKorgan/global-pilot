// src/data/fixtures/europe-2026.js
// ===========================================================================
// THE REAL TRIP — N2AK Cirrus Vision Jet SF50 G2+, Reno → Europe → Reno,
// Jun 12 → ~Jul 28, 2026. 24 legs total: 9 eastbound ferry, 8 intra-Europe,
// 7 westbound ferry.
//
// SOURCE OF TRUTH: N2AK_master_itinerary_consolidated.md (Jun 1, 2026),
// itself consolidated from Ferry Plan v8 + Master Schedule & Coordination
// v4 + Ops Manual + Air Journey call notes.
//
// GROUND RULES BAKED IN HERE:
//   - Eastbound (F-1 .. F-9) and Westbound (W-1 .. W-7) are coordinated by
//     Air Journey. FBO contacts, GAR/eAPIS filings, slot bookings are
//     their job. Operational fields here are lighter — mostly notes.
//   - Intra-Europe (EU-1 .. EU-8) is Grant-self-coordinated. Full FBO
//     contacts, slot/PPR status, customs, fuel uplift, overnight, all
//     populated from the master schedule doc.
//
// PHASE 4 OPEN ITEMS (see Section 5 of the master doc):
//   - F-5 BGSF→BGJN: BGJN runway may be too short for SF50. May drop this
//     leg or replace with commercial.
//   - EU-3 LSZC: Air Journey flagged as complex VFR-only mountain field;
//     Guillaume may propose an alternate.
//   - W-6 CYUL→KBIL: exceeds 285 gal at standard payload — needs a tech
//     stop (CYWG Winnipeg or KMSP Minneapolis).
// All three are noted on the affected legs.
// ===========================================================================

export const EUROPE_2026_TRIP_ID = "europe-2026";

// Tiny helper so each leg below stays readable. All fields beyond
// {id, seq, dep, dest, date} are optional and merge in.
function leg(id, seq, dep, dest, date, more = {}) {
  return { id, seq, dep, dest, date, ...more };
}

// Recurring crew shorthand — keep the leg list compact.
const NOAH       = "Noah Knauf";
const GRANT      = "Grant Korgan";
const SHAWNA     = "Shawna Korgan";
const GRAYSON    = "Grayson Korgan";
const ANGIE      = "Angie Knauf";
const TANNER     = "Tanner Knauf";

const AIR_JOURNEY = {
  name: "Air Journey",
  phone: "+1-561-841-1551",
  notes: "Files eAPIS / CANPASS / Greenland permits / NAT routing on Grant's behalf for all ferry legs.",
};

// =============================================================================
// EASTBOUND FERRY (F-1 .. F-9)
// =============================================================================

const EASTBOUND = [
  leg("ferry-1", 1, "KRNO", "KBIL", "2026-06-12", {
    crew: { pic: NOAH, sic: GRANT, pax: [GRAYSON] },
    fuel: { gal: 210, rationale: "Trip + 45-min reserve. Easy domestic." },
    notes: "Day 1 of the ferry. Standard US domestic; no customs.",
  }),
  leg("ferry-2", 2, "KBIL", "CYQT", "2026-06-13", {
    crew: { pic: NOAH, sic: GRANT, pax: [GRAYSON] },
    fbo: { dest: { name: "Shell Aerocentre Thunder Bay", notes: "CBSA meets aircraft on arrival." } },
    customs: { eapisRequired: true, eapisStatus: "filed", notes: "eAPIS ≥60 min before departure. CANPASS Private Aircraft 2-hr advance: +1-888-226-7277. Canada eTA in hand for all crew." },
    fuel: { gal: 245, rationale: "Trip + reserves at MTOW with 3 onboard." },
    notes: "First international leg. CBSA at Shell Aerocentre.",
  }),
  leg("ferry-3", 3, "CYQT", "CYFB", "2026-06-14", {
    crew: { pic: NOAH, sic: GRANT, pax: [GRAYSON] },
    fuel: { gal: 285, rationale: "⚠ At-the-edge — 1,144 nm needs ~325 gal at standard burn. Need favorable winds, LRC at FL310, possibly reduced reserves. Air Journey to wind-route. Divert: CYVP Kuujjuaq." },
    notes: "Longest leg of the trip. Canadian AIP survival kit on board. Winds-aloft check night-before is critical.",
  }),
  leg("ferry-4", 4, "CYFB", "BGSF", "2026-06-14", {
    crew: { pic: NOAH, sic: GRANT, pax: [GRAYSON] },
    customs: { notes: "Greenland is Kingdom of Denmark, NOT Schengen. Danish customs declaration on arrival." },
    fuel: { gal: 210, rationale: "Comfortable." },
    notes: "Greenland landing permit required — Air Journey filed T-60d via Mittarfeqarfiit. BGSF paved 9,200 ft, no SF50 issue.",
  }),
  leg("ferry-5", 5, "BGSF", "BGJN", "2026-06-14", {
    crew: { pic: NOAH, sic: GRANT, pax: [GRAYSON] },
    fuel: { gal: 75, rationale: "Trivial range." },
    notes: "⚠ MAJOR FLAG: Guillaume (Air Journey) noted BGJN runway ~3,000 ft may be too short for SF50. Verify G2+ landing performance with Cirrus before committing. Possible alternatives: overnight at BGSF, commercial to BGJN for icefjord, or skip BGJN entirely.",
  }),
  leg("ferry-6", 6, "BGJN", "BIKF", "2026-06-15", {
    crew: { pic: NOAH, sic: GRANT, pax: [GRAYSON] },
    customs: { schengen: "entry", notes: "Schengen entry at BIKF — passports to FBO desk for stamps." },
    fbo: { dest: { name: "ISAVIA", notes: "Pre-arrival notice required." } },
    fuel: { gal: 245, rationale: "At max practical fuel for the over-water crossing. Wear immersion suits in flight." },
    notes: "10-min Ilulissat Icefjord orbit on departure (coordinated via Sondrestrom Info as part of clearance).",
  }),
  leg("ferry-7", 7, "BIKF", "EKVG", "2026-06-17", {
    crew: { pic: NOAH, sic: GRANT, pax: [GRAYSON] },
    fbo: { dest: { name: "Atlantic Airways Vágar", notes: "Pre-arrival notice T-24h." } },
    customs: { schengen: "exit", notes: "Schengen exit at BIKF — handler escorts to police kiosk. No Faroes entry stamp if crew stays airside." },
    fuel: { gal: 105, rationale: "Easy short hop." },
    notes: "60-min tech stop. ⚠ Hard scrub rule: wheels-up BIKF by 07:30 LT or skip EKVG, file direct BIKF→EGPK.",
  }),
  leg("ferry-8", 8, "EKVG", "EGPK", "2026-06-17", {
    crew: { pic: NOAH, sic: GRANT, pax: [GRAYSON] },
    fbo: { dest: { name: "Signature Flight Support Prestwick", phone: "+44 1292 671 481" } },
    customs: { ukGarRequired: true, ukGarStatus: "filed", notes: "UK GAR 48h–2h. UK ETA in hand for all crew (mandatory since Feb 2026). Border Force may meet at FBO. Failure to file GAR = £10,000 per breach." },
    fuel: { gal: 100, rationale: "Easy short hop." },
    notes: "UK entry. Air Journey files GAR via gov.uk service.",
  }),
  leg("ferry-9", 9, "EGPK", "EGKB", "2026-06-18", {
    crew: { pic: NOAH, sic: GRANT, pax: [GRAYSON] },
    fbo: { dest: { name: "Signature Flight Support EGKB", phone: "+44 1959 578 080", email: "ops@signatureflight.com" } },
    slot: { required: true, status: "confirmed", via: "Signature EGKB", notes: "EGKB is PPR + slot-controlled. Air Journey holds the Jun 18 arrival slot." },
    fuel: { gal: 100, rationale: "Easy domestic UK." },
    notes: "Ferry terminates here. Hand-off to Grant for intra-Europe.",
  }),
];

// =============================================================================
// INTRA-EUROPE (EU-1 .. EU-8) — Grant self-coordinates
// =============================================================================

const INTRA_EUROPE = [
  leg("eu-1", 10, "EGKB", "LEPA", "2026-06-21", {
    crew: { pic: NOAH, sic: null, pax: [ANGIE, GRAYSON, TANNER] },
    fbo: {
      origin: { name: "Signature Flight Support EGKB", phone: "+44 1959 578 080", email: "ops@signatureflight.com", notes: "EGKB PPR + slot-controlled. Air Journey held slot through Jun 18; coordinate Jun 21 dep direct with Signature." },
      dest:   { name: "Sky Valet Mallorca",            phone: "+34 971 789 050", email: "palma@skyvalet.com", notes: "Or alternate: Mallorca Air Center." },
    },
    slot: { required: true, status: "requested", window: "T-7d", via: "Sky Valet (CFMU)", notes: "LEPA summer slot mandatory." },
    customs: { ukGarRequired: true, ukGarStatus: "filed", schengen: "entry", notes: "UK GAR T-48h to T-2h. Schengen entry at LEPA — Sky Valet escorts to passport control." },
    fuel: { gal: 245, lb: 1640, rationale: "Near max practical with 4 pax + bags. ⚠ W&B-tight at MTOW. Order full tanks only if W&B permits — see consolidated doc Section 2." },
    overnight: { hotel: "Mallorca (Phase 2)", nights: 10, rampFee: "€30–80/night outdoor; covered preferred for summer sun.", notes: "LEPA long-term parking Jun 21 → Jul 1." },
    filing: { window: "T-24h", route: "Airways UK → French sectors → Spanish via BISIK or similar." },
    notes: "Grant + Shawna do NOT fly this leg — they commercial to Portugal.",
  }),
  leg("eu-2", 11, "LEPA", "LEIB", "2026-07-01", {
    crew: { pic: GRANT, sic: null, pax: ["Sam Skillicorn", "Sienna Murphy"] },
    fbo: {
      origin: { name: "Sky Valet Mallorca",  phone: "+34 971 789 050", notes: "Brief T-7d by email — Jul 1 reposition with PMI-arriving pax. Stage dep with girls' UA 9365 arrival 15:15." },
      dest:   { name: "Sky Valet Ibiza",     phone: "+34 971 809 100", email: "ibiza@skyvalet.com" },
    },
    slot: { required: true, status: "requested", window: "T-7d", via: "Sky Valet", notes: "⚠ LEIB summer slot ABSOLUTELY required — Ibiza is the tightest GA airport in the Med in July. Book T-7d minimum." },
    customs: { schengen: "internal", notes: "Schengen-internal — no customs filing." },
    fuel: { gal: 245, rationale: "Top to full at LEPA before this leg. Ibiza Jet-A is the highest in the Med — tanker from LEPA." },
    overnight: { hotel: "Ibiza (Phase 2)", nights: 1, rampFee: "€200–400/night on Sky Valet ramp", notes: "1 night Jul 1 → Jul 2." },
    filing: { window: "T-2h", route: "Direct typical for the short hop." },
    notes: "Grant SOLO. Time departure to UA 9365 PMI arrival 15:15 LCL (Lufthansa-operated, code-share UA 9365 / DJY51E).",
  }),
  leg("eu-3", 12, "LEIB", "LSZC", "2026-07-02", {
    crew: { pic: NOAH, sic: GRANT, pax: [ANGIE, SHAWNA] },
    fbo: {
      origin: { name: "Sky Valet Ibiza",     phone: "+34 971 809 100" },
      dest:   { name: "Pilatus Centre Buochs", phone: "+41 41 619 64 22", email: "ops@pilatuscentre.ch", notes: "Pilatus factory next door. Alternate: redFlight." },
    },
    ppr: { required: true, status: "requested", window: "T-48h to T-7d", via: "redFlight", notes: "LSZC PPR via redFlight: +41 41 612 26 26 / ops@redflight.ch — MANDATORY for all flights." },
    customs: { schengen: "internal", notes: "Schengen-internal. LSZC has customs available for non-Schengen turnarounds." },
    fuel: { gal: 190, lb: 1275, rationale: "Trip + reserves + Alpine weather margin. Within W&B with 4 onboard." },
    overnight: { hotel: "Chedi Andermatt (drop Noah + Angie, ~50 min Sustenpass drive)", nights: 7, rampFee: "CHF 50–150/night Buochs", notes: "Option A: park at LSZC Jul 2 → Jul 9. Option B: empty-repo same day to LIPB; park at LSZC only for the day." },
    filing: { window: "T-24h", route: "Alpine arrival via Swiss ATC. STAR into LSZC straightforward visual; LSZC uncontrolled but tower-serviced." },
    notes: "⚠ MAJOR FLAG: Guillaume (Air Journey) called LSZC a complex VFR-only mountain airport. Quote: 'either you know exactly what you're doing or you're getting in trouble.' Guillaume to send alternative airport options.",
  }),
  leg("eu-4a", 13, "LSZC", "LIPB", "2026-07-02", {
    crew: { pic: GRANT, sic: null, pax: [] },
    fbo: {
      origin: { name: "Pilatus Centre Buochs / redFlight" },
      dest:   { name: "ABD Air Service Bolzano", phone: "+39 0471 255 268", email: "ops@abd-airservice.it", notes: "Alternate: Bolzano Airport Handling." },
    },
    ppr: { required: true, status: "requested", window: "T-7d", via: "ABD", notes: "LIPB has limited ops hours + slot constraints in summer GA traffic." },
    customs: { schengen: "internal" },
    fuel: { gal: 90, lb: 600, rationale: "Short leg + reserves; or top off if Swiss fuel pricing favorable." },
    overnight: { hotel: "Bolzano (Phase 2 — Aman)", nights: 7, rampFee: "€40–80/night ABD", notes: "Option B: park LIPB 7 nights Jul 2 → Jul 9." },
    filing: { window: "T-2h", route: "Scenic Alps crossing — VFR-on-top possible." },
    notes: "Option B (Jul 2 empty repo). ⚠ LIPB online training + quiz required per Air Journey. Weather-sensitive — only go in good WX. ⚠ 813 ft field elevation with terrain departures — confirm WX day-of.",
  }),
  leg("eu-5", 14, "LIPB", "LSGS", "2026-07-09", {
    crew: { pic: GRANT, sic: NOAH, pax: [ANGIE, SHAWNA] },
    fbo: {
      origin: { name: "ABD Air Service Bolzano", phone: "+39 0471 255 268" },
      dest:   { name: "Air-Glaciers Sion",        phone: "+41 27 329 14 14", email: "sion@air-glaciers.ch", notes: "Or Heli-Alpes if Air-Glaciers full. Handling agent MANDATORY at LSGS — pre-book." },
    },
    slot: { required: false, status: "none", notes: "LSGS no slot restrictions; Apr–Sep ops 0500–1800 LT (after-hours O/R)." },
    customs: { schengen: "internal", notes: "LSGS has customs + immigration on field for crew switches." },
    fuel: { gal: 110, lb: 740, rationale: "Trip + reserves. Top off Swiss fuel for Jul 10 longest Med leg." },
    overnight: { hotel: "Fairmont Le Montreux Palace (~35 min A9 drive)", nights: 1, rampFee: "CHF 80–150/night", notes: "Ben Böhmer + Adriatique at Montreux Jazz Lab that evening." },
    filing: { window: "T-2h", route: "Alpine crossing through Italian + Swiss sectors." },
    notes: "Weather-sensitive — Guillaume: 'if weather sucks, stuck between two valleys.'",
  }),
  leg("eu-6", 15, "LSGS", "LFKF", "2026-07-10", {
    crew: { pic: NOAH, sic: GRANT, pax: [ANGIE, SHAWNA] },
    fbo: {
      origin: { name: "Air-Glaciers Sion" },
      dest:   { name: "Aviapartner Figari", phone: "+33 4 95 71 10 23", notes: "Or Sky Valet if available. No dedicated GA terminal — use main passenger terminal." },
    },
    slot: { required: true, status: "requested", window: "T-7d", notes: "LFKF July ops 0600–2300 LT. Slot may be required for peak. GA parking 12 aircraft only." },
    customs: { schengen: "internal", notes: "Customs available on field if needed." },
    fuel: { gal: 170, lb: 1140, rationale: "Trip + reserves + Bonifacio winds margin. Top off if affordable, or minimal uplift if parking long-term (plane sits ~10 days)." },
    overnight: { hotel: "Arktos yacht charter, Bonifacio marina (~20 min ground transfer)", nights: 10, rampFee: "€50–100/night moderate Corsican summer", notes: "Park LFKF Jul 10 → ~Jul 20. Cover the plane if outdoor." },
    filing: { window: "T-2h", route: "South through France into Corsica. STAR over the sea — visual approach typical." },
    notes: "Drop into Phase 3 friends yacht leg.",
  }),
  leg("eu-7", 16, "LFKF", "LFPB", "2026-07-20", {
    crew: { pic: GRANT, sic: SHAWNA, pax: [] },
    fbo: {
      origin: { name: "Aviapartner Figari" },
      dest:   { name: "Signature Flight Support Le Bourget", phone: "+33 1 49 34 47 47", email: "paris@signatureflight.com", notes: "Europe's premier GA airport. Slot + PPR mandatory." },
    },
    slot: { required: true, status: "requested", window: "T-7d", via: "Signature", notes: "⚠ LFPB slot REQUIRED — summer Paris slots VERY tight. Backups: LFPN Toussus-le-Noble or LFPV Villacoublay." },
    customs: { schengen: "internal" },
    fuel: { gal: 190, lb: 1275, rationale: "Trip + reserves + westerly-headwind margin over France. 2 onboard + light bags — comfortable." },
    overnight: { hotel: "Le Meurice or Saint James Paris", nights: 1, rampFee: "€200–400/night LFPB Signature", notes: "Celebratory dinner before NAT crossing." },
    filing: { window: "T-24h (slot requirement)", route: "Standard French airways routing." },
    notes: "Phase 3 wrapped — family on commercial home. Positioning N2AK to Prestwick.",
  }),
  leg("eu-8", 17, "LFPB", "EGPK", "2026-07-21", {
    crew: { pic: GRANT, sic: SHAWNA, pax: [] },
    fbo: {
      origin: { name: "Signature Flight Support Le Bourget" },
      dest:   { name: "Signature Flight Support Prestwick", phone: "+44 1292 671 481", email: "prestwick@signatureflight.com", notes: "Air Journey coordinates aircraft receipt." },
    },
    slot: { required: false, status: "none", notes: "EGPK no slot restrictions. Signature handling pre-arranged via Air Journey." },
    customs: { ukGarRequired: true, ukGarStatus: "draft", schengen: "exit", notes: "UK GAR REQUIRED — submit-general-aviation-report.service.gov.uk T-48h to T-2h. All UK ETAs attached. Schengen exit at LFPB — Signature escorts. UK entry at EGPK — Border Force may meet." },
    fuel: { gal: 190, lb: 1275, rationale: "Trip + reserves + UK weather margin. Top up for clean Air Journey handoff." },
    overnight: { hotel: "EGPK Prestwick (Air Journey westbound prep)", nights: 1, rampFee: "TBD by Air Journey launch date", notes: "Park at Signature; survival gear pickup arranged via Survival Systems USA shipped to Signature EGPK in advance." },
    filing: { window: "T-24h", route: "Across English Channel into Scottish sectors." },
    notes: "Final intra-Europe leg. Hand plane to Air Journey at EGPK for westbound NAT prep.",
  }),
];

// =============================================================================
// WESTBOUND FERRY (W-1 .. W-7) — Grant PIC, Shawna SIC, Air Journey scope
// =============================================================================

const WESTBOUND = [
  leg("ferry-w1", 18, "EGPK", "EKVG", "2026-07-22", {
    crew: { pic: GRANT, sic: SHAWNA, pax: [] },
    customs: { ukGarRequired: true, ukGarStatus: "filed", schengen: "internal", notes: "UK GAR for EGPK departure (Air Journey files). Fresh survival pack picked up at Signature EGPK pre-departure." },
    fuel: { gal: 100, rationale: "Easy short hop. 2 onboard." },
    notes: "Westbound NAT begins. Survival gear loaded.",
  }),
  leg("ferry-w2", 19, "EKVG", "BIKF", "2026-07-22", {
    crew: { pic: GRANT, sic: SHAWNA, pax: [] },
    customs: { schengen: "entry", notes: "Schengen entry at BIKF, passport stamps." },
    fbo: { dest: { name: "ISAVIA Keflavik", notes: "Pre-arrival notice." } },
    fuel: { gal: 105, rationale: "Easy." },
    notes: "Optional rest day at BIKF for weather window.",
  }),
  leg("ferry-w3", 20, "BIKF", "BGSF", "2026-07-23", {
    crew: { pic: GRANT, sic: SHAWNA, pax: [] },
    customs: { schengen: "exit", notes: "Schengen exit at BIKF. Greenland landing permit (fresh, for westbound) — 48 working hours minimum." },
    fuel: { gal: 250, rationale: "2 onboard means 285 gal fits at MTOW. Watch westbound headwinds." },
    notes: "Wear immersion suits in flight.",
  }),
  leg("ferry-w4", 21, "BGSF", "CYYR", "2026-07-24", {
    crew: { pic: GRANT, sic: SHAWNA, pax: [] },
    fbo: { dest: { name: "Esso Avitat CYYR", notes: "Drop survival gear with prepaid return shipping label." } },
    customs: { eapisRequired: true, notes: "Canada entry — CANPASS + Canada eTA. Drop survival gear at CYYR Esso Avitat with prepaid return label." },
    fuel: { gal: 285, rationale: "⚠ EXCEEDS 285 gal with reserves. Westbound headwinds make this the toughest leg. Air Journey wind-routing critical." },
    notes: "Atlantic crossing terminates. Headwinds add 1–2 hrs vs eastbound. Drop survival gear.",
  }),
  leg("ferry-w5", 22, "CYYR", "CYUL", "2026-07-25", {
    crew: { pic: GRANT, sic: SHAWNA, pax: [] },
    fuel: { gal: 225, rationale: "Comfortable." },
    notes: "Canada domestic, no overwater >50nm so no raft/suits required.",
  }),
  leg("ferry-w6", 23, "CYUL", "KBIL", "2026-07-26", {
    crew: { pic: GRANT, sic: SHAWNA, pax: [] },
    customs: { eapisRequired: true, eapisStatus: "filed", notes: "US re-entry. eAPIS filed by Air Journey. CBP arrival notification. USDA agricultural inspection if any food/wood/plants aboard." },
    fuel: { gal: 285, rationale: "❌ EXCEEDS 285 gal significantly. Direct routing not feasible — needs a tech stop. Air Journey to confirm CYWG Winnipeg or KMSP Minneapolis." },
    notes: "⚠ MAJOR FLAG: Direct CYUL→KBIL not possible at 285 gal. Tech stop required.",
  }),
  leg("ferry-w7", 24, "KBIL", "KRNO", "2026-07-27", {
    crew: { pic: GRANT, sic: SHAWNA, pax: [] },
    fuel: { gal: 210, rationale: "Easy domestic." },
    notes: "Welcome home.",
  }),
];

// =============================================================================
// THE TRIP
// =============================================================================

export function buildEurope2026Trip() {
  return {
    id: EUROPE_2026_TRIP_ID,
    name: "Reno → Europe → Reno · Summer 2026",
    aircraftId: "sf50_g2plus",  // Real SF50 G2+ profile — Day 7 added perf data + takeoff verdict
    dateStart: "2026-06-12",
    dateEnd: "2026-07-28",
    schemaVersion: 1,
    notes: "N2AK Cirrus Vision Jet SF50 G2+. 24 legs: 9 eastbound (Air Journey) · 8 intra-Europe (self-coordinated) · 7 westbound (Air Journey). Source: N2AK_master_itinerary_consolidated.md.",
    legs: [...EASTBOUND, ...INTRA_EUROPE, ...WESTBOUND],
  };
}
