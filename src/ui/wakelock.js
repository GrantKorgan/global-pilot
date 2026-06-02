// src/ui/wakelock.js
// ---------------------------------------------------------------------------
// Keep the iPad / phone screen on while a weather brief is open.
//
// The Screen Wake Lock API is supported in Chrome / Edge / Safari 16.4+ and
// is the right call here — when a pilot pulls up a brief mid-flight on an
// iPad strapped to their leg, the screen mustn't sleep.
//
// The browser may release the lock automatically when the tab loses focus
// (switching apps, screen lock); we listen for visibilitychange and re-
// acquire on return.
//
// Fails silently on browsers without support — the brief still works,
// the screen just sleeps as it would have anyway.
// ---------------------------------------------------------------------------

let wakeLock = null;
let wantedActive = false;

export async function acquireWakeLock() {
  wantedActive = true;
  if (!("wakeLock" in navigator)) return;
  try {
    if (wakeLock !== null) return; // already held
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => { wakeLock = null; });
  } catch (e) {
    // User denied, document was hidden at request time, or other failure.
    // Fail quietly — the brief still works.
  }
}

export async function releaseWakeLock() {
  wantedActive = false;
  if (!wakeLock) return;
  try { await wakeLock.release(); }
  catch (e) { /* swallow */ }
  wakeLock = null;
}

// Re-acquire on tab visibility return — the browser auto-releases when
// the tab is hidden. If the pilot switches to ForeFlight to cross-check
// and switches back, the screen-on commitment should resume.
document.addEventListener("visibilitychange", () => {
  if (wantedActive && document.visibilityState === "visible" && wakeLock === null) {
    acquireWakeLock();
  }
});
