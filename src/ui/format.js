// src/ui/format.js
// ---------------------------------------------------------------------------
// Display formatters — pure string functions used across the brief renderers.
// ---------------------------------------------------------------------------

export function formatWind(dir, spd, gst) {
  if (spd == null) return "—";
  if (spd === 0) return "Calm";
  if (dir == null || dir === "VRB") return `VRB ${spd} kt`;
  let s = `${String(dir).padStart(3, "0")}° @ ${spd} kt`;
  if (gst) s += ` gust ${gst}`;
  return s;
}

export function formatFBWind(w) {
  if (!w) return "—";
  if (w.dir === "LGT") return `Light & variable`;
  return `${String(w.dir).padStart(3, "0")}° / ${w.spd} kt`;
}

export function formatAltitude(ft) {
  if (ft >= 18000) return `FL${Math.round(ft / 100)}`;
  return ft.toLocaleString() + " ft";
}

export function formatCeiling(metar) {
  if (!metar.clouds || !metar.clouds.length) return "Clear";
  const cloudObs = metar.clouds.filter((c) => c.base != null);
  const ceiling = cloudObs.find((c) => c.cover === "BKN" || c.cover === "OVC");
  if (!ceiling) {
    const lowest = cloudObs[0];
    return lowest ? `${lowest.cover} ${lowest.base.toLocaleString()} ft` : "Clear";
  }
  return `${ceiling.cover} ${ceiling.base.toLocaleString()} ft`;
}

export function formatObsTime(iso) {
  if (!iso) return "—";
  try {
    const d = typeof iso === "number" ? new Date(iso * 1000) : new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " local";
  } catch (e) {
    return "—";
  }
}
