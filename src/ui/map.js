// src/ui/map.js
// ---------------------------------------------------------------------------
// Leaflet route map. Drawn after the brief renders; reads endpoint coords
// from `data-*` attributes on the #route-map div so this module doesn't
// need to know anything about state shape.
//
// Leaflet itself is loaded from a CDN in index.html — the global `L` is
// available at module load time.
// ---------------------------------------------------------------------------

let mapInstance = null;

export function initRouteMap() {
  const el = document.getElementById("route-map");
  if (!el) return;

  // Tear down a previous instance — Leaflet errors if you call L.map()
  // twice on the same div.
  if (mapInstance) { mapInstance.remove(); mapInstance = null; }

  const depLat   = parseFloat(el.dataset.depLat);
  const depLon   = parseFloat(el.dataset.depLon);
  const depIcao  = el.dataset.depIcao;
  const destLat  = parseFloat(el.dataset.destLat);
  const destLon  = parseFloat(el.dataset.destLon);
  const destName = el.dataset.destName;

  if (!Number.isFinite(depLat) || !Number.isFinite(depLon)) return;
  const haveDest = Number.isFinite(destLat) && Number.isFinite(destLon);

  mapInstance = L.map(el, { zoomControl: true, scrollWheelZoom: false, attributionControl: true });

  const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap',
  });
  const sat = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 18, attribution: '&copy; Esri World Imagery' }
  );
  osm.addTo(mapInstance);
  L.control.layers({ "Streets": osm, "Satellite": sat }, null, { position: "topright" }).addTo(mapInstance);

  L.marker([depLat, depLon]).addTo(mapInstance).bindPopup(`<strong>${depIcao}</strong><br>Departure`);
  if (haveDest) {
    L.marker([destLat, destLon]).addTo(mapInstance).bindPopup(`<strong>${destName}</strong><br>Destination`);
    L.polyline([[depLat, depLon], [destLat, destLon]], { color: "#2a5d8a", weight: 3, opacity: 0.8 }).addTo(mapInstance);
    mapInstance.fitBounds([[depLat, depLon], [destLat, destLon]], { padding: [40, 40] });
  } else {
    mapInstance.setView([depLat, depLon], 9);
  }
}
