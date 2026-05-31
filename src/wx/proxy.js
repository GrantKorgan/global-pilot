// src/wx/proxy.js
// ---------------------------------------------------------------------------
// CORS proxy layer.
//
// The NOAA AWC API doesn't send "Access-Control-Allow-Origin" headers, so
// browsers refuse direct fetches. We relay through a proxy that adds the
// header.
//
// Proxy chain (tried in order; first success wins):
//   1. Your Cloudflare Worker, IF localStorage["global-pilot:worker-url"] is set.
//      See WORKER_SETUP.md for the one-time setup. Recommended.
//   2. api.allorigins.win  (free public relay)
//   3. api.codetabs.com    (free public relay; fallback)
//
// To activate your Worker after deploying it, paste this in the browser
// console once:
//     localStorage.setItem("global-pilot:worker-url", "https://your-worker.workers.dev");
//     location.reload();
//
// To go back to public-only:
//     localStorage.removeItem("global-pilot:worker-url");
//     location.reload();
// ---------------------------------------------------------------------------

const PUBLIC_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
];

function readCustomWorkerUrl() {
  try {
    const raw = localStorage.getItem("global-pilot:worker-url");
    return raw ? raw.replace(/\/+$/, "") : null;
  } catch (e) {
    return null;
  }
}

const CUSTOM_WORKER = readCustomWorkerUrl();

export const PROXIES = CUSTOM_WORKER
  ? [
      (url) => `${CUSTOM_WORKER}/?url=${encodeURIComponent(url)}`,
      ...PUBLIC_PROXIES, // fallback if the Worker ever fails
    ]
  : PUBLIC_PROXIES;

// Exported so the diagnostics panel can tell users which path is live.
export const PROXY_INFO = {
  usingCustomWorker: Boolean(CUSTOM_WORKER),
  customWorkerUrl: CUSTOM_WORKER,
};

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
