// src/wx/registry.js
// ---------------------------------------------------------------------------
// FAA N-NUMBER REGISTRY CLIENT.
//
// Tail number → { make, model, year, owner, status } via the Cloudflare
// Worker's /registry/{N} endpoint. The Worker fetches the FAA inquiry page
// server-side and parses the HTML for us — see worker/index.js.
//
// REQUIRES: localStorage["global-pilot:worker-url"] must be set to the
// deployed Worker's origin. Without that, this function returns
//   { ok: false, reason: "worker_not_configured" }
// so the UI can prompt the pilot to set it up.
//
// The Worker's response is opaque to us — we surface whatever it returns
// (success or error) with one normalization step: tail is uppercased and
// prefixed with N if the user typed without it.
// ---------------------------------------------------------------------------

import { PROXY_INFO } from "./proxy.js";

export function isRegistryAvailable() {
  return PROXY_INFO.usingCustomWorker;
}

export async function lookupRegistry(rawTail) {
  if (!PROXY_INFO.usingCustomWorker) {
    return { ok: false, tail: rawTail, reason: "worker_not_configured" };
  }
  const tail = normalizeTail(rawTail);
  if (!tail) {
    return { ok: false, tail: rawTail, reason: "invalid_tail" };
  }
  try {
    const url = `${PROXY_INFO.customWorkerUrl}/registry/${encodeURIComponent(tail)}`;
    const res = await fetch(url, { cache: "no-store" });
    // Worker returns JSON for both success and failure cases — always parse.
    const json = await res.json();
    return json;
  } catch (err) {
    return { ok: false, tail, reason: "network_error" };
  }
}

// Normalize: trim, uppercase, prepend N if missing. Returns null for
// patterns that obviously can't be valid US tail numbers so we don't
// burn a network round trip on garbage.
function normalizeTail(raw) {
  if (!raw) return null;
  let t = String(raw).trim().toUpperCase().replace(/[\s\-]/g, "");
  if (!t) return null;
  if (!t.startsWith("N")) t = "N" + t;
  // US tails: N + (1-5 chars), first char a digit, no I/O.
  if (!/^N[1-9][0-9A-HJ-NP-Z]{0,4}$/.test(t)) return null;
  return t;
}

// Reason → user-readable explanation. Used by the UI in the result box.
export function explainRegistryReason(reason) {
  switch (reason) {
    case "worker_not_configured":
      return "Tail-number lookup needs a deployed Cloudflare Worker. See WORKER_SETUP.md.";
    case "invalid_tail":
      return "That doesn't look like a valid US tail number (N + digit + up to 4 alphanumeric, no I or O).";
    case "not_found":
      return "FAA registry has no record for this tail number.";
    case "parse_failed":
      return "FAA registry returned a page we couldn't parse. Try again, or fall back to the dropdown.";
    case "network_error":
      return "Couldn't reach the FAA registry. Try again in a moment.";
    case "upstream_error":
    default:
      if (reason && reason.startsWith && reason.startsWith("upstream_")) {
        return `FAA registry returned an error (${reason.replace("upstream_", "HTTP ")}).`;
      }
      return "Lookup failed. Try again, or fall back to the dropdown.";
  }
}
