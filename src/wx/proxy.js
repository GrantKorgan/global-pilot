// src/wx/proxy.js
// ---------------------------------------------------------------------------
// CORS proxy layer.
//
// The NOAA AWC API doesn't send "Access-Control-Allow-Origin" headers, so
// browsers refuse direct fetches. We route through two free public proxies,
// falling back to the second if the first fails. Same NOAA data either way.
//
// Long-term plan: replace with a single Cloudflare Worker we own. Day 2 of
// the v3 plan. Until then, the public proxies are fine for our load.
// ---------------------------------------------------------------------------

export const PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
];

// Try each proxy in order; on failure try the next. Returns the first
// successful response. Throws if all proxies fail.
export async function fetchViaProxy(targetUrl, parseAs) {
  let lastError = null;
  for (let i = 0; i < PROXIES.length; i++) {
    try {
      const res = await fetch(PROXIES[i](targetUrl), { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} from proxy #${i + 1}`);
      return parseAs === "text" ? await res.text() : await res.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("All CORS proxies failed");
}
