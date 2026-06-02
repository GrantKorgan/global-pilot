// src/data/aircraft-catalog.js
// ---------------------------------------------------------------------------
// CONTEMPORARY IN-MARKET AIRCRAFT CATALOG.
//
// A grouped catalog of aircraft that are actively flying / on the
// marketplace today. Used to populate the aircraft dropdown in the brief
// setup screen and the trip editor.
//
// SCHEMA per entry:
//   key            short slug, must be unique across the catalog
//   label          human-readable name as a pilot would say it
//   cruiseFt       default cruise altitude (used for FB winds-aloft band)
//                  — overridden by a fetched profile if/when available
//   wikipediaTitle optional override for the Wikipedia article title
//                  (used by the enrichment fetcher). If omitted, the
//                  fetcher derives one from `label`.
//   perfKey        when present, points at a fully hardcoded perf module
//                  in src/data/. Today only `sf50_g2plus` carries this.
//                  Other models rely on lazy Wikipedia enrichment.
//
// ENRICHMENT PATTERN:
//   The catalog is intentionally LIGHT — name + cruise-altitude default
//   only. When a pilot selects an aircraft for the first time, the app
//   asynchronously fetches the Wikipedia article, parses the
//   {{Infobox aircraft type}} block, and caches MTOW / ceiling / cruise
//   speed / range under `src/store/profiles.js`. Subsequent selects use
//   the cache instantly.
//
// CATEGORIES (in dropdown order):
//   jets.veryLight       Very-light jets (VLJ)
//   jets.light           Light jets
//   jets.mid             Mid-size jets
//   jets.superMid        Super-mid jets
//   jets.heavy           Heavy jets
//   jets.ultraLong       Ultra-long-range jets
//   turboprops.single    Single-engine turboprops
//   turboprops.twin      Twin-engine turboprops
//   piston.singleNA      Piston singles — normally aspirated
//   piston.singleTC      Piston singles — turbocharged
//   piston.twin          Piston twins
//   lsaExp               LSA + experimental / kit
//   generic              Generic tiers (fallback when model is unlisted)
//
// MAINTAINER NOTES:
//   - Adding a model: append to the relevant group's `models` array. The
//     UI re-renders next session. No code changes required.
//   - Coverage is biased toward US-marketplace prevalence. Adding an
//     uncommon model is welcome but not a priority — the long tail is
//     covered by the generic tiers at the bottom.
//   - Renaming a key BREAKS persisted trips that reference the old key.
//     Don't rename keys casually; instead, add a new entry and deprecate
//     the old one.
// ---------------------------------------------------------------------------

export const AIRCRAFT_CATALOG = {

  // =========================================================================
  // JETS
  // =========================================================================
  jets: {
    label: "Jets",
    groups: {

      veryLight: {
        label: "Very-light jets (VLJ)",
        cruiseFtDefault: 31000,
        models: [
          { key: "sf50_g2plus",     label: "Cirrus Vision Jet SF50 G2+",       cruiseFt: 28000, perfKey: "sf50_g2plus", wikipediaTitle: "Cirrus Vision Jet" },
          { key: "sf50_g1",         label: "Cirrus Vision Jet SF50 G1",        cruiseFt: 28000, wikipediaTitle: "Cirrus Vision Jet" },
          { key: "sf50_g2",         label: "Cirrus Vision Jet SF50 G2",        cruiseFt: 28000, wikipediaTitle: "Cirrus Vision Jet" },
          { key: "eclipse500",      label: "Eclipse 500",                       cruiseFt: 41000 },
          { key: "eclipse550",      label: "Eclipse 550",                       cruiseFt: 41000 },
          { key: "hondajet_eliteII",label: "HondaJet Elite II (HA-420)",       cruiseFt: 43000, wikipediaTitle: "HondaJet" },
          { key: "citation_mustang",label: "Cessna Citation Mustang",          cruiseFt: 41000 },
        ],
      },

      light: {
        label: "Light jets",
        cruiseFtDefault: 41000,
        models: [
          { key: "phenom100",       label: "Embraer Phenom 100",                cruiseFt: 41000 },
          { key: "phenom100ev",     label: "Embraer Phenom 100EV",              cruiseFt: 41000, wikipediaTitle: "Embraer Phenom 100" },
          { key: "citation_cj1",    label: "Cessna Citation CJ1 / 525",         cruiseFt: 41000, wikipediaTitle: "Cessna CitationJet/M2" },
          { key: "citation_cj2",    label: "Cessna Citation CJ2+",              cruiseFt: 45000, wikipediaTitle: "Cessna CitationJet/M2" },
          { key: "citation_cj3",    label: "Cessna Citation CJ3+",              cruiseFt: 45000, wikipediaTitle: "Cessna CitationJet/M2" },
          { key: "citation_cj4",    label: "Cessna Citation CJ4 Gen2",          cruiseFt: 45000, wikipediaTitle: "Cessna CitationJet/M2" },
          { key: "citation_m2",     label: "Cessna Citation M2 Gen2",           cruiseFt: 41000, wikipediaTitle: "Cessna CitationJet/M2" },
          { key: "citation_bravo",  label: "Cessna Citation Bravo (550)",       cruiseFt: 45000, wikipediaTitle: "Cessna Citation II" },
          { key: "beechjet_400",    label: "Beechjet 400A",                     cruiseFt: 45000 },
          { key: "premier_1a",      label: "Hawker Premier IA",                 cruiseFt: 41000, wikipediaTitle: "Hawker 4000" },
          { key: "nextant_400xti",  label: "Nextant 400XTi",                    cruiseFt: 45000 },
        ],
      },

      mid: {
        label: "Mid-size jets",
        cruiseFtDefault: 43000,
        models: [
          { key: "phenom300",       label: "Embraer Phenom 300",                cruiseFt: 45000 },
          { key: "phenom300e",      label: "Embraer Phenom 300E",               cruiseFt: 45000, wikipediaTitle: "Embraer Phenom 300" },
          { key: "citation_xls",    label: "Cessna Citation XLS+",              cruiseFt: 45000, wikipediaTitle: "Cessna Citation Excel" },
          { key: "citation_excel",  label: "Cessna Citation Excel",             cruiseFt: 45000 },
          { key: "citation_encore", label: "Cessna Citation Encore+",           cruiseFt: 45000, wikipediaTitle: "Cessna Citation Ultra" },
          { key: "citation_ultra",  label: "Cessna Citation Ultra",             cruiseFt: 45000 },
          { key: "citation_v",      label: "Cessna Citation V",                 cruiseFt: 45000 },
          { key: "hawker_800",      label: "Hawker 800",                        cruiseFt: 41000 },
          { key: "hawker_800xp",    label: "Hawker 800XP",                      cruiseFt: 41000, wikipediaTitle: "British Aerospace 125" },
          { key: "hawker_850xp",    label: "Hawker 850XP",                      cruiseFt: 41000, wikipediaTitle: "British Aerospace 125" },
          { key: "hawker_900xp",    label: "Hawker 900XP",                      cruiseFt: 41000, wikipediaTitle: "British Aerospace 125" },
          { key: "learjet_31a",     label: "Learjet 31A",                       cruiseFt: 51000 },
          { key: "learjet_40xr",    label: "Learjet 40XR",                      cruiseFt: 51000 },
          { key: "learjet_45xr",    label: "Learjet 45XR",                      cruiseFt: 51000 },
          { key: "learjet_75",      label: "Learjet 75 / 75 Liberty",           cruiseFt: 51000, wikipediaTitle: "Bombardier Learjet 75" },
        ],
      },

      superMid: {
        label: "Super-mid jets",
        cruiseFtDefault: 45000,
        models: [
          { key: "challenger_300",  label: "Bombardier Challenger 300",         cruiseFt: 45000 },
          { key: "challenger_350",  label: "Bombardier Challenger 350",         cruiseFt: 45000 },
          { key: "challenger_3500", label: "Bombardier Challenger 3500",        cruiseFt: 45000 },
          { key: "citation_sovereign",label: "Cessna Citation Sovereign+",      cruiseFt: 47000, wikipediaTitle: "Cessna Citation Sovereign" },
          { key: "citation_longitude",label: "Cessna Citation Longitude",       cruiseFt: 45000 },
          { key: "citation_latitude",label: "Cessna Citation Latitude",         cruiseFt: 45000 },
          { key: "hawker_4000",     label: "Hawker 4000",                       cruiseFt: 45000 },
          { key: "gulfstream_g280", label: "Gulfstream G280",                   cruiseFt: 45000 },
          { key: "gulfstream_g200", label: "Gulfstream G200",                   cruiseFt: 45000 },
          { key: "praetor_500",     label: "Embraer Praetor 500",               cruiseFt: 45000 },
          { key: "praetor_600",     label: "Embraer Praetor 600",               cruiseFt: 45000 },
          { key: "legacy_450",      label: "Embraer Legacy 450",                cruiseFt: 45000 },
          { key: "legacy_500",      label: "Embraer Legacy 500",                cruiseFt: 45000 },
          { key: "falcon_2000",     label: "Dassault Falcon 2000",              cruiseFt: 47000 },
          { key: "falcon_2000lx",   label: "Dassault Falcon 2000LX/LXS",        cruiseFt: 47000, wikipediaTitle: "Dassault Falcon 2000" },
          { key: "falcon_2000s",    label: "Dassault Falcon 2000S",             cruiseFt: 47000, wikipediaTitle: "Dassault Falcon 2000" },
        ],
      },

      heavy: {
        label: "Heavy jets",
        cruiseFtDefault: 47000,
        models: [
          { key: "citation_x",      label: "Cessna Citation X / X+",            cruiseFt: 51000 },
          { key: "challenger_604",  label: "Bombardier Challenger 604",         cruiseFt: 41000 },
          { key: "challenger_605",  label: "Bombardier Challenger 605",         cruiseFt: 41000 },
          { key: "challenger_650",  label: "Bombardier Challenger 650",         cruiseFt: 41000 },
          { key: "gulfstream_g350", label: "Gulfstream G350",                   cruiseFt: 45000, wikipediaTitle: "Gulfstream G300" },
          { key: "gulfstream_g450", label: "Gulfstream G450",                   cruiseFt: 45000 },
          { key: "gulfstream_g500", label: "Gulfstream G500",                   cruiseFt: 47000 },
          { key: "gulfstream_g550", label: "Gulfstream G550",                   cruiseFt: 51000 },
          { key: "gulfstream_g600", label: "Gulfstream G600",                   cruiseFt: 51000 },
          { key: "falcon_900",      label: "Dassault Falcon 900",               cruiseFt: 51000 },
          { key: "falcon_900lx",    label: "Dassault Falcon 900LX",             cruiseFt: 51000, wikipediaTitle: "Dassault Falcon 900" },
          { key: "falcon_7x",       label: "Dassault Falcon 7X",                cruiseFt: 51000 },
          { key: "falcon_8x",       label: "Dassault Falcon 8X",                cruiseFt: 51000 },
          { key: "legacy_600",      label: "Embraer Legacy 600",                cruiseFt: 41000 },
          { key: "legacy_650",      label: "Embraer Legacy 650",                cruiseFt: 41000 },
        ],
      },

      ultraLong: {
        label: "Ultra-long-range jets",
        cruiseFtDefault: 49000,
        models: [
          { key: "gulfstream_g650",  label: "Gulfstream G650",                   cruiseFt: 51000 },
          { key: "gulfstream_g650er",label: "Gulfstream G650ER",                 cruiseFt: 51000, wikipediaTitle: "Gulfstream G650" },
          { key: "gulfstream_g700",  label: "Gulfstream G700",                   cruiseFt: 51000 },
          { key: "gulfstream_g800",  label: "Gulfstream G800",                   cruiseFt: 51000 },
          { key: "global_5000",      label: "Bombardier Global 5000",            cruiseFt: 51000 },
          { key: "global_5500",      label: "Bombardier Global 5500",            cruiseFt: 51000 },
          { key: "global_6000",      label: "Bombardier Global 6000",            cruiseFt: 51000 },
          { key: "global_6500",      label: "Bombardier Global 6500",            cruiseFt: 51000 },
          { key: "global_7500",      label: "Bombardier Global 7500",            cruiseFt: 51000 },
          { key: "global_8000",      label: "Bombardier Global 8000",            cruiseFt: 51000 },
          { key: "falcon_10x",       label: "Dassault Falcon 10X",               cruiseFt: 51000 },
          { key: "bbj_737",          label: "Boeing Business Jet (BBJ 737)",     cruiseFt: 41000 },
          { key: "acj_319",          label: "Airbus Corporate Jet (ACJ319)",     cruiseFt: 41000, wikipediaTitle: "Airbus Corporate Jets" },
          { key: "acj_320",          label: "Airbus Corporate Jet (ACJ320neo)",  cruiseFt: 41000, wikipediaTitle: "Airbus Corporate Jets" },
        ],
      },
    },
  },

  // =========================================================================
  // TURBOPROPS
  // =========================================================================
  turboprops: {
    label: "Turboprops",
    groups: {

      single: {
        label: "Single-engine turboprops",
        cruiseFtDefault: 25000,
        models: [
          { key: "pc12_47",         label: "Pilatus PC-12/47",                  cruiseFt: 28000, wikipediaTitle: "Pilatus PC-12" },
          { key: "pc12_47e",        label: "Pilatus PC-12 NG (47E)",            cruiseFt: 30000, wikipediaTitle: "Pilatus PC-12" },
          { key: "pc12_ngx",        label: "Pilatus PC-12 NGX",                 cruiseFt: 30000, wikipediaTitle: "Pilatus PC-12" },
          { key: "tbm_700",         label: "Daher TBM 700",                     cruiseFt: 31000, wikipediaTitle: "SOCATA TBM" },
          { key: "tbm_850",         label: "Daher TBM 850",                     cruiseFt: 31000, wikipediaTitle: "SOCATA TBM" },
          { key: "tbm_900",         label: "Daher TBM 900",                     cruiseFt: 31000, wikipediaTitle: "Daher TBM 900" },
          { key: "tbm_910",         label: "Daher TBM 910",                     cruiseFt: 31000, wikipediaTitle: "Daher TBM 900" },
          { key: "tbm_930",         label: "Daher TBM 930",                     cruiseFt: 31000, wikipediaTitle: "Daher TBM 900" },
          { key: "tbm_940",         label: "Daher TBM 940",                     cruiseFt: 31000, wikipediaTitle: "Daher TBM 900" },
          { key: "tbm_960",         label: "Daher TBM 960",                     cruiseFt: 31000, wikipediaTitle: "Daher TBM 900" },
          { key: "kodiak_100",      label: "Daher Kodiak 100",                  cruiseFt: 25000, wikipediaTitle: "Quest Kodiak" },
          { key: "kodiak_900",      label: "Daher Kodiak 900",                  cruiseFt: 25000 },
          { key: "epic_e1000",      label: "Epic E1000 GX",                     cruiseFt: 34000, wikipediaTitle: "Epic E1000" },
          { key: "piper_m500",      label: "Piper M500",                        cruiseFt: 30000, wikipediaTitle: "Piper PA-46 Malibu Meridian" },
          { key: "piper_m600",      label: "Piper M600",                        cruiseFt: 30000 },
          { key: "piper_m700",      label: "Piper M700 Fury",                   cruiseFt: 30000, wikipediaTitle: "Piper M600" },
          { key: "cessna_caravan",  label: "Cessna 208 Caravan",                cruiseFt: 25000, wikipediaTitle: "Cessna 208 Caravan" },
          { key: "cessna_grand_caravan",label: "Cessna 208B Grand Caravan EX",  cruiseFt: 25000, wikipediaTitle: "Cessna 208 Caravan" },
          { key: "denali",          label: "Beechcraft Denali",                 cruiseFt: 31000, wikipediaTitle: "Beechcraft Denali" },
          { key: "meridian",        label: "Piper Meridian",                    cruiseFt: 30000, wikipediaTitle: "Piper PA-46 Malibu Meridian" },
        ],
      },

      twin: {
        label: "Twin-engine turboprops",
        cruiseFtDefault: 27000,
        models: [
          { key: "kingair_c90",     label: "Beechcraft King Air C90B",          cruiseFt: 27000, wikipediaTitle: "Beechcraft King Air" },
          { key: "kingair_c90gtx",  label: "Beechcraft King Air C90GTx",        cruiseFt: 27000, wikipediaTitle: "Beechcraft King Air" },
          { key: "kingair_200",     label: "Beechcraft King Air B200",          cruiseFt: 35000, wikipediaTitle: "Beechcraft Super King Air" },
          { key: "kingair_250",     label: "Beechcraft King Air 250",           cruiseFt: 35000, wikipediaTitle: "Beechcraft Super King Air" },
          { key: "kingair_260",     label: "Beechcraft King Air 260",           cruiseFt: 35000, wikipediaTitle: "Beechcraft Super King Air" },
          { key: "kingair_300",     label: "Beechcraft King Air 300",           cruiseFt: 35000, wikipediaTitle: "Beechcraft Super King Air" },
          { key: "kingair_350",     label: "Beechcraft King Air 350",           cruiseFt: 35000, wikipediaTitle: "Beechcraft Super King Air" },
          { key: "kingair_350i",    label: "Beechcraft King Air 350i",          cruiseFt: 35000, wikipediaTitle: "Beechcraft Super King Air" },
          { key: "kingair_360",     label: "Beechcraft King Air 360",           cruiseFt: 35000, wikipediaTitle: "Beechcraft Super King Air" },
          { key: "mu2_marquise",    label: "Mitsubishi MU-2 Marquise",          cruiseFt: 25000, wikipediaTitle: "Mitsubishi MU-2" },
          { key: "mu2_solitaire",   label: "Mitsubishi MU-2 Solitaire",         cruiseFt: 25000, wikipediaTitle: "Mitsubishi MU-2" },
          { key: "twin_otter",      label: "DHC-6 Twin Otter",                  cruiseFt: 10000, wikipediaTitle: "De Havilland Canada DHC-6 Twin Otter" },
          { key: "cheyenne_ii",     label: "Piper Cheyenne II",                 cruiseFt: 27000, wikipediaTitle: "Piper PA-31T Cheyenne" },
          { key: "cheyenne_iii",    label: "Piper Cheyenne III/IIIA",           cruiseFt: 33000, wikipediaTitle: "Piper PA-42 Cheyenne III" },
        ],
      },
    },
  },

  // =========================================================================
  // PISTON
  // =========================================================================
  piston: {
    label: "Piston",
    groups: {

      singleNA: {
        label: "Piston singles — normally aspirated",
        cruiseFtDefault: 9000,
        models: [
          { key: "cessna_152",      label: "Cessna 152",                        cruiseFt: 7000 },
          { key: "cessna_172",      label: "Cessna 172 Skyhawk",                cruiseFt: 9000, wikipediaTitle: "Cessna 172" },
          { key: "cessna_172sp",    label: "Cessna 172SP",                      cruiseFt: 9000, wikipediaTitle: "Cessna 172" },
          { key: "cessna_175",      label: "Cessna 175 Skylark",                cruiseFt: 9000, wikipediaTitle: "Cessna 175" },
          { key: "cessna_177",      label: "Cessna 177 Cardinal",               cruiseFt: 9000, wikipediaTitle: "Cessna 177 Cardinal" },
          { key: "cessna_182",      label: "Cessna 182 Skylane",                cruiseFt: 11000, wikipediaTitle: "Cessna 182 Skylane" },
          { key: "cessna_206",      label: "Cessna 206 Stationair",             cruiseFt: 9000, wikipediaTitle: "Cessna 206" },
          { key: "cessna_210",      label: "Cessna 210 Centurion",              cruiseFt: 11000, wikipediaTitle: "Cessna 210" },
          { key: "piper_archer",    label: "Piper PA-28-181 Archer",            cruiseFt: 9000, wikipediaTitle: "Piper PA-28 Cherokee" },
          { key: "piper_warrior",   label: "Piper PA-28-161 Warrior",           cruiseFt: 8000, wikipediaTitle: "Piper PA-28 Cherokee" },
          { key: "piper_cherokee",  label: "Piper PA-28 Cherokee",              cruiseFt: 8000, wikipediaTitle: "Piper PA-28 Cherokee" },
          { key: "piper_arrow",     label: "Piper PA-28R Arrow",                cruiseFt: 10000, wikipediaTitle: "Piper PA-28R Cherokee Arrow" },
          { key: "piper_dakota",    label: "Piper PA-28-236 Dakota",            cruiseFt: 10000, wikipediaTitle: "Piper PA-28 Cherokee" },
          { key: "piper_saratoga",  label: "Piper PA-32 Saratoga",              cruiseFt: 10000, wikipediaTitle: "Piper PA-32 Cherokee Six" },
          { key: "piper_cherokee_six",label: "Piper PA-32 Cherokee Six",        cruiseFt: 10000, wikipediaTitle: "Piper PA-32 Cherokee Six" },
          { key: "beech_a36",       label: "Beechcraft A36 Bonanza",            cruiseFt: 11000, wikipediaTitle: "Beechcraft Bonanza" },
          { key: "beech_g36",       label: "Beechcraft G36 Bonanza",            cruiseFt: 11000, wikipediaTitle: "Beechcraft Bonanza" },
          { key: "beech_v35",       label: "Beechcraft V35 Bonanza",            cruiseFt: 11000, wikipediaTitle: "Beechcraft Bonanza" },
          { key: "beech_sundowner", label: "Beechcraft Sundowner / Sport",      cruiseFt: 8000, wikipediaTitle: "Beechcraft Musketeer" },
          { key: "cirrus_sr20",     label: "Cirrus SR20",                       cruiseFt: 9000 },
          { key: "cirrus_sr22",     label: "Cirrus SR22",                       cruiseFt: 11000 },
          { key: "mooney_m20c",     label: "Mooney M20C/E/F",                   cruiseFt: 9000, wikipediaTitle: "Mooney M20" },
          { key: "mooney_m20j",     label: "Mooney M20J 201",                   cruiseFt: 11000, wikipediaTitle: "Mooney M20" },
          { key: "diamond_da40",    label: "Diamond DA40",                      cruiseFt: 10000 },
          { key: "grumman_tiger",   label: "Grumman AA-5B Tiger",               cruiseFt: 8000, wikipediaTitle: "American AA-5" },
          { key: "maule_m7",        label: "Maule M-7",                         cruiseFt: 8000, wikipediaTitle: "Maule M-7" },
        ],
      },

      singleTC: {
        label: "Piston singles — turbocharged",
        cruiseFtDefault: 16000,
        models: [
          { key: "cessna_t182",     label: "Cessna T182T Turbo Skylane",        cruiseFt: 16000, wikipediaTitle: "Cessna 182 Skylane" },
          { key: "cessna_t206",     label: "Cessna T206 Turbo Stationair",      cruiseFt: 18000, wikipediaTitle: "Cessna 206" },
          { key: "cessna_t210",     label: "Cessna T210 Turbo Centurion",       cruiseFt: 18000, wikipediaTitle: "Cessna 210" },
          { key: "cirrus_sr22t",    label: "Cirrus SR22T",                      cruiseFt: 17500, wikipediaTitle: "Cirrus SR22" },
          { key: "cirrus_sr22tn",   label: "Cirrus SR22 Turbo Normalized",      cruiseFt: 17500, wikipediaTitle: "Cirrus SR22" },
          { key: "mooney_acclaim",  label: "Mooney M20TN Acclaim",              cruiseFt: 25000, wikipediaTitle: "Mooney M20" },
          { key: "mooney_ovation",  label: "Mooney M20R Ovation",               cruiseFt: 19000, wikipediaTitle: "Mooney M20" },
          { key: "piper_malibu",    label: "Piper PA-46 Malibu",                cruiseFt: 25000, wikipediaTitle: "Piper PA-46" },
          { key: "piper_mirage",    label: "Piper PA-46 Mirage",                cruiseFt: 25000, wikipediaTitle: "Piper PA-46" },
          { key: "piper_matrix",    label: "Piper PA-46 Matrix",                cruiseFt: 25000, wikipediaTitle: "Piper PA-46" },
          { key: "piper_m350",      label: "Piper M350",                        cruiseFt: 25000, wikipediaTitle: "Piper PA-46" },
          { key: "beech_b36tc",     label: "Beechcraft B36TC Bonanza",          cruiseFt: 18000, wikipediaTitle: "Beechcraft Bonanza" },
        ],
      },

      twin: {
        label: "Piston twins",
        cruiseFtDefault: 14000,
        models: [
          { key: "beech_baron_58",  label: "Beechcraft Baron 58",               cruiseFt: 15000, wikipediaTitle: "Beechcraft Baron" },
          { key: "beech_baron_g58", label: "Beechcraft Baron G58",              cruiseFt: 15000, wikipediaTitle: "Beechcraft Baron" },
          { key: "beech_duchess",   label: "Beechcraft Duchess 76",             cruiseFt: 10000, wikipediaTitle: "Beechcraft Duchess" },
          { key: "piper_seneca",    label: "Piper PA-34 Seneca V",              cruiseFt: 15000, wikipediaTitle: "Piper PA-34 Seneca" },
          { key: "piper_seminole",  label: "Piper PA-44 Seminole",              cruiseFt: 10000, wikipediaTitle: "Piper PA-44 Seminole" },
          { key: "piper_aztec",     label: "Piper PA-23 Aztec",                 cruiseFt: 12000, wikipediaTitle: "Piper PA-23" },
          { key: "piper_apache",    label: "Piper PA-23 Apache",                cruiseFt: 11000, wikipediaTitle: "Piper PA-23" },
          { key: "piper_navajo",    label: "Piper PA-31 Navajo",                cruiseFt: 24000, wikipediaTitle: "Piper PA-31 Navajo" },
          { key: "piper_chieftain", label: "Piper PA-31-350 Chieftain",         cruiseFt: 24000, wikipediaTitle: "Piper PA-31 Navajo" },
          { key: "cessna_310",      label: "Cessna 310",                        cruiseFt: 18000 },
          { key: "cessna_414",      label: "Cessna 414 Chancellor",             cruiseFt: 25000, wikipediaTitle: "Cessna 414" },
          { key: "cessna_421",      label: "Cessna 421 Golden Eagle",           cruiseFt: 25000, wikipediaTitle: "Cessna 421" },
          { key: "diamond_da42",    label: "Diamond DA42 Twin Star",            cruiseFt: 14000 },
          { key: "diamond_da62",    label: "Diamond DA62",                      cruiseFt: 14000 },
          { key: "tecnam_p2006t",   label: "Tecnam P2006T",                     cruiseFt: 9000 },
        ],
      },
    },
  },

  // =========================================================================
  // LSA + EXPERIMENTAL / KIT
  // =========================================================================
  lsaExp: {
    label: "Light sport / experimental / kit",
    groups: {

      lsa: {
        label: "Light sport aircraft",
        cruiseFtDefault: 6000,
        models: [
          { key: "icon_a5",         label: "Icon A5",                            cruiseFt: 5000 },
          { key: "carbon_cub_ss",   label: "CubCrafters Carbon Cub SS",         cruiseFt: 7000, wikipediaTitle: "CubCrafters Carbon Cub" },
          { key: "carbon_cub_ex",   label: "CubCrafters Carbon Cub EX-3",       cruiseFt: 7000, wikipediaTitle: "CubCrafters Carbon Cub" },
          { key: "piper_sport",     label: "Piper Sport",                       cruiseFt: 6000 },
          { key: "evektor_sportstar",label: "Evektor SportStar",                cruiseFt: 6000 },
          { key: "flight_design_ctls",label: "Flight Design CTLS",              cruiseFt: 6000 },
          { key: "tecnam_p2008",    label: "Tecnam P2008",                      cruiseFt: 7000 },
          { key: "remos_gx",        label: "Remos GX",                          cruiseFt: 6000 },
          { key: "aerotrek_a240",   label: "Aerotrek A240",                     cruiseFt: 6000 },
          { key: "rans_s19",        label: "Rans S-19 Venterra",                cruiseFt: 6000 },
        ],
      },

      experimental: {
        label: "Experimental / kit",
        cruiseFtDefault: 9000,
        models: [
          { key: "vans_rv6",        label: "Van's RV-6 / RV-6A",                cruiseFt: 9000, wikipediaTitle: "Van's Aircraft RV-6" },
          { key: "vans_rv7",        label: "Van's RV-7 / RV-7A",                cruiseFt: 9000, wikipediaTitle: "Van's Aircraft RV-7" },
          { key: "vans_rv8",        label: "Van's RV-8 / RV-8A",                cruiseFt: 10000, wikipediaTitle: "Van's Aircraft RV-8" },
          { key: "vans_rv9",        label: "Van's RV-9 / RV-9A",                cruiseFt: 9000, wikipediaTitle: "Van's Aircraft RV-9" },
          { key: "vans_rv10",       label: "Van's RV-10",                        cruiseFt: 10000, wikipediaTitle: "Van's Aircraft RV-10" },
          { key: "vans_rv12",       label: "Van's RV-12",                        cruiseFt: 7000, wikipediaTitle: "Van's Aircraft RV-12" },
          { key: "vans_rv14",       label: "Van's RV-14 / RV-14A",              cruiseFt: 10000, wikipediaTitle: "Van's Aircraft RV-14" },
          { key: "lancair_320",     label: "Lancair 320",                        cruiseFt: 11000, wikipediaTitle: "Lancair" },
          { key: "lancair_360",     label: "Lancair 360",                        cruiseFt: 11000, wikipediaTitle: "Lancair" },
          { key: "lancair_es",      label: "Lancair ES / Super ES",             cruiseFt: 12000, wikipediaTitle: "Lancair ES" },
          { key: "lancair_iv",      label: "Lancair IV / IV-P",                 cruiseFt: 20000, wikipediaTitle: "Lancair IV" },
          { key: "lancair_legacy",  label: "Lancair Legacy",                    cruiseFt: 12000, wikipediaTitle: "Lancair Legacy" },
          { key: "glasair_iii",     label: "Glasair III",                        cruiseFt: 13000, wikipediaTitle: "Glasair" },
          { key: "glasair_sportsman",label: "Glasair Sportsman",                cruiseFt: 9000, wikipediaTitle: "Glasair Sportsman 2+2" },
          { key: "kitfox",          label: "Kitfox",                             cruiseFt: 7000, wikipediaTitle: "Kitfox Aircraft" },
          { key: "zenith_701",      label: "Zenith CH-701",                      cruiseFt: 6000, wikipediaTitle: "Zenith CH 701" },
          { key: "zenith_750",      label: "Zenith CH-750 Cruzer",              cruiseFt: 7000, wikipediaTitle: "Zenith CH 750" },
        ],
      },
    },
  },

  // =========================================================================
  // GENERIC TIERS — fallback when the specific model isn't listed.
  // Preserves v2 behavior for users who haven't picked a specific model.
  // =========================================================================
  generic: {
    label: "Generic tiers (model not listed)",
    groups: {
      generic: {
        label: "Generic tiers",
        cruiseFtDefault: 12000,
        models: [
          { key: "pistonNA", label: "Generic piston single — normally aspirated",       cruiseFt:  9000 },
          { key: "pistonTC", label: "Generic piston — turbocharged",                     cruiseFt: 16000 },
          { key: "turbine",  label: "Generic turbine single (TBM / PC-12 / Meridian)",   cruiseFt: 24000 },
          { key: "midJet",   label: "Generic mid jet (CJ4 / Phenom 300 / XLS / Hawker)", cruiseFt: 39000 },
          { key: "superMid", label: "Generic super-mid (Citation X / Challenger 350)",   cruiseFt: 43000 },
          { key: "heavy",    label: "Generic heavy (G450/550/650 / Global / Falcon 7X)", cruiseFt: 45000 },
        ],
      },
    },
  },
};

// Flat lookup map: key → model entry (for fast O(1) lookup from anywhere
// in the app). Built once at module load.
export const AIRCRAFT_BY_KEY = (() => {
  const out = {};
  for (const cat of Object.values(AIRCRAFT_CATALOG)) {
    for (const group of Object.values(cat.groups)) {
      for (const model of group.models) {
        out[model.key] = {
          ...model,
          // Backfill cruiseFt with group default if model didn't override.
          cruiseFt: model.cruiseFt != null ? model.cruiseFt : group.cruiseFtDefault,
        };
      }
    }
  }
  return out;
})();
