// src/data/aircraft-matcher.js
// ---------------------------------------------------------------------------
// MATCH FAA REGISTRY make/model STRINGS TO A CATALOG ENTRY.
//
// The FAA registry returns make/model in their canonical form:
//   "CIRRUS DESIGN CORP" + "SF50"
//   "TEXTRON AVIATION" + "525B"
//   "BOMBARDIER INC" + "CL-600-2B16"
//   "GULFSTREAM AEROSPACE LP" + "G-IV-SP"
//
// Our catalog uses pilot-facing labels:
//   "Cirrus Vision Jet SF50 G2+"
//   "Cessna Citation CJ3+"
//   "Bombardier Challenger 605"
//   "Gulfstream G450"
//
// matchAircraft({ make, model }) walks the catalog, scores each entry by
// manufacturer match + model designation match, and returns the best key
// (or null if nothing scored above a confidence threshold).
//
// SCORING:
//   +100 if the manufacturer family matches (via synonym map)
//   +200 if a known model-code → catalog-key direct mapping exists
//   +50  for substring match of the FAA model in the catalog label
//   +25  per matching word between FAA strings and catalog label
//
// VARIANT DISAMBIGUATION:
//   The FAA returns the base model (e.g. "SF50"), not the variant
//   (G1 / G2 / G2+). When multiple catalog entries match the same FAA
//   model, we prefer the most-recent variant (sort by label, take last)
//   as a sensible default. The pilot can override via the dropdown.
// ---------------------------------------------------------------------------

import { AIRCRAFT_CATALOG, AIRCRAFT_BY_KEY } from "./aircraft-catalog.js";

// Known manufacturer-name synonyms. FAA uses corporate names that don't
// match the pilot-facing brand. This map lets us recognize the family.
const MANUFACTURER_SYNONYMS = {
  cirrus:      ["cirrus design corp", "cirrus design", "cirrus aircraft", "cirrus"],
  cessna:      ["textron aviation", "cessna aircraft co", "cessna aircraft company", "cessna", "textron"],
  beechcraft:  ["textron aviation", "beech aircraft corp", "beechcraft", "raytheon aircraft"],
  hawker:      ["hawker beechcraft", "raytheon aircraft", "british aerospace", "hawker"],
  piper:       ["piper aircraft inc", "piper aircraft", "piper"],
  embraer:     ["embraer s a", "embraer", "embraer executive aircraft"],
  bombardier:  ["bombardier inc", "bombardier aerospace", "bombardier", "canadair"],
  learjet:     ["learjet inc", "bombardier inc", "gates learjet", "learjet"],
  gulfstream:  ["gulfstream aerospace", "gulfstream aerospace lp", "gulfstream american corp", "gulfstream"],
  dassault:    ["dassault aviation", "dassault aircraft inc", "dassault"],
  falcon:      ["dassault aviation", "dassault"],
  honda:       ["honda aircraft co", "honda aircraft company", "honda"],
  eclipse:     ["eclipse aerospace", "eclipse aviation", "one aviation", "eclipse"],
  pilatus:     ["pilatus aircraft ltd", "pilatus business aircraft", "pilatus"],
  daher:       ["daher socata", "daher aerospace", "socata", "daher"],
  socata:      ["socata", "daher socata"],
  epic:        ["epic aircraft", "epic aircraft llc"],
  mooney:      ["mooney international", "mooney aircraft corp", "mooney"],
  mitsubishi:  ["mitsubishi heavy industries", "mitsubishi", "mhi"],
  dehavilland: ["dehavilland canada", "de havilland canada", "viking air", "bombardier inc"],
  diamond:     ["diamond aircraft industries", "diamond aircraft"],
  tecnam:      ["costruzioni aeronautiche tecnam", "tecnam"],
  icon:        ["icon aircraft", "icon"],
  cubcrafters: ["cubcrafters", "cub crafters"],
  vans:        ["vans aircraft", "van's aircraft", "vans"],
  lancair:     ["lancair", "lancair international"],
  glasair:     ["glasair aviation", "glasair"],
  kitfox:      ["kitfox aircraft", "kitfox"],
  zenith:      ["zenith aircraft co", "zenith aircraft", "zenair"],
  airbus:      ["airbus", "airbus industrie"],
  boeing:      ["boeing", "the boeing company"],
};

// Known FAA model-code → catalog-key direct mappings. The FAA uses
// type-certificate model designations which often differ from marketing
// names (e.g. CJ4 is "525C" in FAA-speak). This map handles the common
// cases. When multiple variants share a base FAA model (525B = CJ2 and
// CJ2+), we pick the most-recent variant.
const MODEL_CODE_MAP = {
  // Cirrus
  "sf50": "sf50_g2plus",
  // Cessna Citation family — FAA codes track 525 / 560XL / 680 / 750 etc.
  "525":  "citation_m2",
  "525a": "citation_cj2",  // CJ2 base code; CJ2+ shares it. Default to CJ2.
  "525b": "citation_cj3",
  "525c": "citation_cj4",
  "560":  "citation_v",
  "560xl":"citation_xls",
  "680":  "citation_sovereign",
  "680a": "citation_latitude",
  "700":  "citation_longitude",
  "750":  "citation_x",
  // Cessna pistons
  "172":  "cessna_172",
  "182":  "cessna_182",
  "206":  "cessna_206",
  "210":  "cessna_210",
  // Bombardier Challenger / Learjet — FAA codes are CL-600-2*
  "cl-600-2b16":  "challenger_605",
  "cl-600-2c10":  "challenger_350",
  "cl-600-2b19":  "challenger_350",
  "cl-30":        "challenger_350",
  // Gulfstream — G-* designations. FAA returns both type-cert ("GVI")
  // and marketing names in parens ("GVI (G650ER)"). The matcher tries
  // each piece; we map both styles.
  "g-iv":         "gulfstream_g450",
  "g-iv-sp":      "gulfstream_g450",
  "giv":          "gulfstream_g450",
  "giv-sp":       "gulfstream_g450",
  "g-v":          "gulfstream_g550",
  "gv":           "gulfstream_g550",
  "gv-sp":        "gulfstream_g550",
  "gvsp":         "gulfstream_g550",
  "g-vi":         "gulfstream_g650",
  "gvi":          "gulfstream_g650",
  "g500":         "gulfstream_g500",
  "g600":         "gulfstream_g600",
  "g650":         "gulfstream_g650",
  "g650er":       "gulfstream_g650er",
  "g700":         "gulfstream_g700",
  "g800":         "gulfstream_g800",
  // Embraer Phenom / Praetor / Legacy
  "emb-505":      "phenom300",
  "emb-500":      "phenom100",
  "emb-545":      "praetor_500",
  "emb-550":      "praetor_600",
  // Pilatus
  "pc-12":        "pc12_ngx",
  "pc-12/45":     "pc12_47",
  "pc-12/47":     "pc12_47",
  "pc-12/47e":    "pc12_47e",
  // TBM (Daher / SOCATA)
  "tbm700":       "tbm_700",
  "tbm850":       "tbm_850",
  "tbm900":       "tbm_900",
  "tbm910":       "tbm_910",
  "tbm930":       "tbm_930",
  "tbm940":       "tbm_940",
  "tbm960":       "tbm_960",
  // Piper M-series — FAA uses PA-46 variants
  "pa-46-350p":   "piper_m350",
  "pa-46-500tp":  "piper_m500",
  "pa-46-600tp":  "piper_m600",
  // Beechcraft King Air
  "b200":         "kingair_200",
  "b300":         "kingair_350",
  "350":          "kingair_350",
  "c90":          "kingair_c90",
  // Cirrus pistons
  "sr20":         "cirrus_sr20",
  "sr22":         "cirrus_sr22",
  "sr22t":        "cirrus_sr22t",
};

const MATCH_THRESHOLD = 80;

export function matchAircraft({ make, model }) {
  if (!make && !model) {
    return { key: null, confidence: 0, candidates: [], reason: "no_make_or_model" };
  }
  const faMakeN  = norm(make);
  // FAA often returns a parenthetical specifier ("GVI (G650ER)" — base
  // type-cert + marketing name). Try direct lookup on both the full
  // normalized string and the unparenthesized variants.
  const candidates = expandModelCandidates(model);

  // 1. Direct model-code lookup wins outright — try each candidate.
  for (const cand of candidates) {
    const direct = MODEL_CODE_MAP[cand];
    if (direct && AIRCRAFT_BY_KEY[direct]) {
      return {
        key: direct,
        confidence: 250,
        candidates: [direct],
        reason: "model_code_match",
      };
    }
  }

  // 2. Identify the manufacturer family.
  const family = identifyManufacturerFamily(faMakeN);

  // 3. Walk the catalog, score each model. Try every model candidate
  //    and keep the best score per catalog entry.
  const scored = [];
  for (const cat of Object.values(AIRCRAFT_CATALOG)) {
    for (const group of Object.values(cat.groups)) {
      for (const entry of group.models) {
        let best = 0;
        for (const faModelN of candidates) {
          best = Math.max(best, scoreEntry(entry, faMakeN, faModelN, family));
        }
        if (best > 0) scored.push({ key: entry.key, label: entry.label, score: best });
      }
    }
  }
  scored.sort((a, b) => b.score - a.score);

  if (!scored.length || scored[0].score < MATCH_THRESHOLD) {
    return {
      key: null,
      confidence: scored.length ? scored[0].score : 0,
      candidates: scored.slice(0, 5).map((s) => s.key),
      reason: "no_confident_match",
    };
  }

  // 4. Multiple entries tied at the top → prefer the most-recent variant
  //    (the catalog generally lists variants in chronological order, so
  //    last entry with the top score is "newest").
  const topScore = scored[0].score;
  const tied = scored.filter((s) => s.score === topScore);
  const winner = tied[tied.length - 1];

  return {
    key: winner.key,
    confidence: topScore,
    candidates: scored.slice(0, 5).map((s) => s.key),
    reason: tied.length > 1 ? "variant_disambiguated_to_newest" : "best_score",
  };
}

// ---- scoring ------------------------------------------------------------

function scoreEntry(entry, faMakeN, faModelN, family) {
  let score = 0;
  const labelN = norm(entry.label);

  // Family match — entry label or wikipediaTitle contains the family token.
  if (family) {
    if (labelN.includes(family)) score += 100;
    else if (entry.wikipediaTitle && norm(entry.wikipediaTitle).includes(family)) score += 60;
  } else {
    // No identified family — fall back to weaker partial match on FAA make.
    if (faMakeN && labelN.includes(faMakeN)) score += 60;
  }

  // Model designation — strongest signal. Check BOTH directions:
  //   - catalog label contains FAA model (e.g., "Cirrus SR22T" ⊃ "sr22t")
  //   - FAA model contains catalog model token (e.g., "gvi (g650er)" ⊃ "g650er")
  // Extract a "model token" from the label by stripping the family name.
  if (faModelN) {
    if (labelN.includes(faModelN)) {
      score += 80;
    } else {
      const labelModelToken = stripFamilyFromLabel(labelN, family);
      if (labelModelToken.length >= 3 && faModelN.includes(labelModelToken)) {
        score += 80;
      } else {
        // Word-level match: each FAA-model word also in the label adds weight.
        const modelWords = faModelN.split(/[\s\-\/()]/).filter(Boolean);
        for (const w of modelWords) {
          if (w.length >= 2 && labelN.includes(w)) score += 25;
        }
      }
    }
  }
  return score;
}

// Extract the model-only portion of a catalog label by stripping the
// manufacturer family token (e.g., "gulfstream g650er" with family
// "gulfstream" → "g650er"). Used for the reverse-direction substring
// check above. Returns the label unchanged if no family known.
function stripFamilyFromLabel(labelN, family) {
  if (!family) return labelN;
  return labelN.replace(family, "").replace(/\s+/g, " ").trim();
}

// Expand a single FAA model string into ordered candidate strings to
// try. FAA returns "GVI (G650ER)" as type-cert + marketing-name. We
// try the marketing name FIRST (more specific — "G650ER" beats "GVI"
// which could be any G650-family). Then the type-cert designation,
// then the full string. First direct-map hit wins.
function expandModelCandidates(model) {
  if (!model) return [];
  const out = [];
  const seen = new Set();
  const push = (s) => { if (s && !seen.has(s)) { seen.add(s); out.push(s); } };

  // 1. Inside-parens (most specific marketing variant).
  const inner = String(model).match(/\(([^)]+)\)/);
  if (inner) push(norm(inner[1]));

  // 2. Outside-parens (type-cert designation).
  push(norm(String(model).replace(/\s*\([^)]*\)/g, "")));

  // 3. Full string verbatim (catches anything not matching above).
  push(norm(model));

  // 4. Space-stripped variants of every candidate so far ("TBM 900" → "tbm900"
  //    matches our compact MODEL_CODE_MAP keys like "tbm900").
  for (const c of [...out]) {
    push(c.replace(/\s+/g, ""));
  }
  return out;
}

function identifyManufacturerFamily(faMakeN) {
  if (!faMakeN) return null;
  for (const [family, synonyms] of Object.entries(MANUFACTURER_SYNONYMS)) {
    for (const syn of synonyms) {
      if (faMakeN.includes(syn)) return family;
    }
  }
  return null;
}

// Lowercase, strip noisy punctuation, collapse whitespace. Keeps "/",
// "-", and parens as meaningful separators — model designations like
// "PC-12/47E" or "G-IV-SP" carry information in those separators that
// MODEL_CODE_MAP keys also preserve.
function norm(s) {
  if (!s) return "";
  return String(s).toLowerCase()
    .replace(/[.,\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
