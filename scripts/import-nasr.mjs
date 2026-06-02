#!/usr/bin/env node
// scripts/import-nasr.mjs
// ---------------------------------------------------------------------------
// LAYER 1 — FAA NASR "food on field" auto-import.
//
// What this does (when run from a normal network):
//   1. Downloads the current FAA NASR subscriber ZIP.
//   2. Extracts APT.txt (Airport Master Record, fixed-width).
//   3. Walks the file. For each airport record, checks the "Other Services"
//      / Misc-Services subrecord for the food-on-airport flag.
//   4. Filters to lower-48 US airports (excludes AK, HI, PR, VI, GU).
//   5. Merges with our curated entries in src/data/airports-food.js
//      (preserves any human-written `noteShort` we already wrote).
//   6. Writes back to src/data/airports-food.js with `source: "faa-nasr"`
//      on auto-imported entries.
//
// WHY THIS MAY NOT RUN FROM A DEV LAPTOP:
//   The FAA's NASR download endpoint (nfdc.faa.gov) sits behind Akamai's
//   bot wall and returns 503 for many residential / VPN / cloud IPs. The
//   GitHub Actions runner gets through cleanly. The companion workflow
//   .github/workflows/refresh-airports.yml runs this monthly on schedule.
//
//   To run locally: try `node scripts/import-nasr.mjs` directly. If it
//   503s, download the ZIP manually from
//     https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/NASR_Subscription/
//   and re-run with NASR_LOCAL=/path/to/zip.
//
// VERIFICATION NEEDED ON FIRST SUCCESSFUL RUN:
//   The NASR APT.txt layout has changed across spec revisions. The exact
//   character offsets for the food-on-airport flag are documented in:
//     APT-RECORDS.pdf  (ships inside the NASR ZIP under /Layout_Data/)
//   This script reads offsets from a constants block below — verify them
//   against the current Layout_Data spec the first time the Action runs.
//
// OUTPUT IDEMPOTENCY:
//   The script reads the existing src/data/airports-food.js, parses out
//   ICAOs already curated, and only ADDS new auto-imported rows for
//   ICAOs not already present. It never overwrites a curated entry. If
//   the FAA flag flips off for an airport we have curated, we keep the
//   curated entry (humans win).
// ---------------------------------------------------------------------------

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const DATA_FILE = resolve(REPO_ROOT, "src/data/airports-food.js");
const CACHE_DIR = resolve(REPO_ROOT, ".cache/nasr");

// NASR APT.txt fixed-width column offsets (0-indexed start, length).
// VERIFY THESE on first successful run against APT-RECORDS.pdf in the
// NASR ZIP's Layout_Data folder. The format has been stable for years
// but FAA does occasionally renumber columns.
const NASR_OFFSETS = {
  recordType:           [0, 3],     // "APT" for airport master, "E70" etc for subrecords
  airportRefId:         [3, 11],    // landing facility site number
  facilityType:         [14, 13],   // "AIRPORT", "HELIPORT", etc.
  locationId:           [27, 4],    // FAA identifier (e.g., "N40", "06C")
  icaoId:               [1210, 7],  // ICAO identifier (e.g., "KFDK"); blank for non-ICAO
  stateAbbrev:          [48, 2],    // "CA", "TX", etc.
  airportName:          [133, 50],  // airport name
  // The "Other Services" line is record type E70 (subrecord). It contains
  // a comma-separated list of services. We scan for tokens "FOOD" or
  // "RESTAURANT". FAA also uses "BOTTLED OXYGEN", "BULK OXYGEN", "FUEL",
  // "OXYGEN", "OXYGEN BOTTLED", "AVGAS 100", etc.
  e70Services:          [27, 252],
};

// US states that count as "lower 48" — excludes AK, HI, PR, VI, GU, AS, MP.
const LOWER_48 = new Set([
  "AL","AR","AZ","CA","CO","CT","DC","DE","FL","GA","IA","ID","IL","IN","KS",
  "KY","LA","MA","MD","ME","MI","MN","MO","MS","MT","NC","ND","NE","NH","NJ",
  "NM","NV","NY","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VA","VT",
  "WA","WI","WV","WY",
]);

const NASR_LATEST_URL =
  "https://nfdc.faa.gov/webContent/28DaySub/extra/28DaySubscription.zip";

// ---------- main --------------------------------------------------------

main().catch((err) => {
  console.error("[import-nasr] FATAL:", err.message);
  process.exit(1);
});

async function main() {
  console.log("[import-nasr] starting");

  await mkdir(CACHE_DIR, { recursive: true });

  const zipPath = process.env.NASR_LOCAL
    ? process.env.NASR_LOCAL
    : await downloadNasrZip();

  const aptTxtPath = await extractAptTxt(zipPath);
  const parsedAirports = await parseAptTxt(aptTxtPath);

  console.log(`[import-nasr] parsed ${parsedAirports.length} airports total`);
  const withFood = parsedAirports.filter((a) => a.hasFood && LOWER_48.has(a.state));
  console.log(`[import-nasr] ${withFood.length} airports flagged with food in lower 48`);

  const merged = await mergeWithCurated(withFood);
  await writeAirportsFoodFile(merged);

  console.log(`[import-nasr] wrote ${merged.length} entries to airports-food.js`);
}

// ---------- download ----------------------------------------------------

async function downloadNasrZip() {
  const target = resolve(CACHE_DIR, "nasr-current.zip");

  // Use curl with a browser-like UA — Node's fetch is sometimes flagged
  // differently than curl by Akamai. Inside a GH Actions runner either
  // works; on a dev machine curl tends to pass cleaner.
  const res = spawnSync(
    "curl",
    [
      "-fSL",
      "-A",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15",
      "-o",
      target,
      NASR_LATEST_URL,
    ],
    { stdio: "inherit" },
  );

  if (res.status !== 0) {
    throw new Error(
      `NASR download failed (exit ${res.status}). ` +
        `If you're on a dev machine and seeing 503, the FAA blocks ` +
        `automated requests from many residential IPs. Run this from ` +
        `the GitHub Actions workflow instead, or download manually and ` +
        `set NASR_LOCAL=<path-to-zip>.`,
    );
  }
  return target;
}

// ---------- extract -----------------------------------------------------

async function extractAptTxt(zipPath) {
  const out = resolve(CACHE_DIR, "APT.txt");
  if (existsSync(out)) {
    // Re-extract anyway — the cached file may be stale.
  }
  // System unzip is universally available on macOS / Linux runners.
  const res = spawnSync("unzip", ["-o", "-j", zipPath, "APT.txt", "-d", CACHE_DIR], {
    stdio: "inherit",
  });
  if (res.status !== 0) {
    throw new Error(`unzip failed (exit ${res.status})`);
  }
  return out;
}

// ---------- parse APT.txt ----------------------------------------------

async function parseAptTxt(path) {
  const text = await readFile(path, "latin1"); // NASR is ASCII; latin1 is forgiving.
  const lines = text.split(/\r?\n/);

  // We iterate line-by-line. Each airport's data spans multiple records;
  // we group by airport reference (APT main record opens a group; subsequent
  // E70 / other subrecords belong to it until the next APT line).
  const airports = [];
  let current = null;

  for (const line of lines) {
    const recordType = slice(line, NASR_OFFSETS.recordType).trim();

    if (recordType === "APT") {
      if (current) airports.push(current);
      current = {
        state:       slice(line, NASR_OFFSETS.stateAbbrev).trim(),
        locationId:  slice(line, NASR_OFFSETS.locationId).trim(),
        icao:        slice(line, NASR_OFFSETS.icaoId).trim(),
        name:        slice(line, NASR_OFFSETS.airportName).trim(),
        hasFood:     false,
      };
    } else if (recordType === "E70" && current) {
      const services = slice(line, NASR_OFFSETS.e70Services).toUpperCase();
      // FAA uses comma-separated tokens. We flag "FOOD" or "RESTAURANT".
      // We deliberately do NOT match "FOOD ON CALL" subtly — substring is fine.
      if (/\bFOOD\b|\bRESTAURANT\b/.test(services)) {
        current.hasFood = true;
      }
    }
  }
  if (current) airports.push(current);
  return airports;
}

function slice(line, [start, len]) {
  return line.substring(start, start + len);
}

// ---------- merge with curated -----------------------------------------

async function mergeWithCurated(autoImported) {
  // Read existing module via dynamic import — gives us the actual array
  // without re-parsing the file's JS source.
  const mod = await import(`file://${DATA_FILE}`);
  const curated = mod.AIRPORTS_WITH_FOOD || [];

  // ICAOs (or FAA IDs) we've already curated by hand. We never overwrite.
  const curatedIds = new Set(curated.map((a) => a.icao.toUpperCase()));

  // Cafes are separate — also exclude them.
  let cafeIcaos = new Set();
  try {
    const cafesMod = await import(`file://${resolve(REPO_ROOT, "src/data/cafes.js")}`);
    cafeIcaos = new Set((cafesMod.CAFES || []).map((c) => c.icao.toUpperCase()));
  } catch (e) {
    console.warn("[import-nasr] could not load cafes.js (skipping cafe-overlap filter)");
  }

  const newRows = [];
  for (const a of autoImported) {
    const id = (a.icao || a.locationId).toUpperCase();
    if (!id) continue;
    if (curatedIds.has(id)) continue;
    if (cafeIcaos.has(id)) continue;
    newRows.push({
      id:        `${id.toLowerCase()}-food`,
      icao:      id,
      airport:   tidyName(a.name),
      city:      "",                // NASR has city but in a different column; left blank for now
      region:    regionForState(a.state),
      source:    "faa-nasr",
      noteShort: "",
    });
  }

  // Sort: keep curated entries in original order, then auto-imports A→Z.
  newRows.sort((x, y) => x.icao.localeCompare(y.icao));
  return [...curated, ...newRows];
}

function tidyName(s) {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bMuni\b/, "Muni")
    .replace(/\bIntl\b/, "Intl");
}

function regionForState(st) {
  // Coarse buckets matching the curated entries' `region` values.
  const map = {
    NorCal:        ["CA"], // CA is split below — placeholder
    SoCal:         [],
    PacNW:         ["WA","OR"],
    Midwest:       ["IL","IN","IA","KS","MI","MN","MO","ND","NE","OH","SD","WI"],
    Northeast:     ["CT","MA","ME","NH","NJ","NY","PA","RI","VT"],
    MidAtlantic:   ["DC","DE","MD","VA","WV"],
    Southeast:     ["AL","FL","GA","KY","MS","NC","SC","TN"],
    SouthCentral:  ["AR","LA","OK","TX"],
    MtnWest:       ["AZ","CO","ID","MT","NM","NV","UT","WY"],
  };
  if (st === "CA") return "California";
  for (const [region, states] of Object.entries(map)) {
    if (states.includes(st)) return region;
  }
  return "US";
}

// ---------- write back to JS file --------------------------------------

async function writeAirportsFoodFile(rows) {
  const header = await readFile(DATA_FILE, "utf8").then((text) => {
    // Preserve everything up to the `export const AIRPORTS_WITH_FOOD = [`
    // marker. We rewrite the array body, keep the comment header intact.
    const marker = "export const AIRPORTS_WITH_FOOD = [";
    const idx = text.indexOf(marker);
    if (idx === -1) throw new Error("could not find array marker in airports-food.js");
    return text.substring(0, idx + marker.length);
  });

  const body = rows.map(rowToJs).join("\n");
  const tail =
    "\n];\n\n" +
    "// Quick stats for UI rendering (avoids counting in render path each frame).\n" +
    "export const AIRPORTS_WITH_FOOD_COUNT = AIRPORTS_WITH_FOOD.length;\n";

  await writeFile(DATA_FILE, header + "\n" + body + tail);
}

function rowToJs(r) {
  // Compact one-line-per-row format (matches the human-written entries).
  const fields = [
    `id: ${JSON.stringify(r.id)}`,
    `icao: ${JSON.stringify(r.icao)}`,
    `airport: ${JSON.stringify(r.airport)}`,
    `city: ${JSON.stringify(r.city || "")}`,
    `region: ${JSON.stringify(r.region || "US")}`,
    `source: ${JSON.stringify(r.source || "faa-nasr")}`,
    `noteShort: ${JSON.stringify(r.noteShort || "")}`,
  ];
  return `  { ${fields.join(", ")} },`;
}
