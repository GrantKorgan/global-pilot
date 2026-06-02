// src/ui/escape.js
// ---------------------------------------------------------------------------
// HTML escape helpers — single source of truth across the app.
//
// Any string that comes from outside the codebase (user input, NOAA response,
// upstream proxy response) MUST be run through escText() before being
// interpolated into an HTML template, and through escAttr() before being
// interpolated into an HTML attribute value. Otherwise it can break the
// DOM or, worse, inject script.
//
// Rule of thumb:  ${escText(someUntrustedString)}      inside text
//                 "${escAttr(someUntrustedString)}"     inside attributes
// ---------------------------------------------------------------------------

export function escText(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escAttr(s) {
  return escText(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
