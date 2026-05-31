// worker/index.js
// ---------------------------------------------------------------------------
// GLOBAL PILOT — Cloudflare Worker CORS relay.
//
// One purpose: take ?url=<target>, fetch it, return the response with
// "Access-Control-Allow-Origin: *" added so the browser will accept it.
// Replaces the public proxies (allorigins.win / codetabs.com).
//
// Safety: only relays GETs to a small whitelist of upstream hosts. Anyone
// who finds the URL can only use it to fetch the same NOAA endpoints the
// app already uses — they can't repurpose it as a generic open proxy.
//
// Deploy: see ../WORKER_SETUP.md for the dashboard walkthrough.
// (Wrangler CLI users: `cd worker && wrangler deploy`.)
// ---------------------------------------------------------------------------

const ALLOWED_HOSTS = new Set([
  "aviationweather.gov",
]);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request) {
    // Browser preflight (CORS) — answer with the headers and bail.
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
    }

    const requestUrl = new URL(request.url);
    const target = requestUrl.searchParams.get("url");
    if (!target) {
      return new Response("Missing ?url=<target>", { status: 400, headers: CORS_HEADERS });
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch (_e) {
      return new Response("Invalid target URL", { status: 400, headers: CORS_HEADERS });
    }
    if (!ALLOWED_HOSTS.has(targetUrl.hostname)) {
      return new Response(`Host not allowed: ${targetUrl.hostname}`, { status: 403, headers: CORS_HEADERS });
    }

    try {
      const upstream = await fetch(target, {
        headers: { "User-Agent": "global-pilot/1.0 (https://github.com/GrantKorgan/global-pilot)" },
      });
      // Preserve upstream content-type so JSON stays JSON, text stays text.
      const headers = new Headers(CORS_HEADERS);
      const ct = upstream.headers.get("content-type");
      if (ct) headers.set("Content-Type", ct);
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch (err) {
      return new Response(`Upstream fetch failed: ${err.message}`, { status: 502, headers: CORS_HEADERS });
    }
  },
};
