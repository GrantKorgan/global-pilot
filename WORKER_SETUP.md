# Setting up your Cloudflare Worker (one-time, ~10 minutes)

The app pulls live weather from NOAA's Aviation Weather Center. Because NOAA doesn't send CORS headers, the browser can't fetch them directly — we have to route through a relay that adds the missing header. Today the app uses two free public relays (`allorigins.win`, `codetabs.com`); those work but they're occasionally flaky and they're not yours.

This guide swaps them for a Cloudflare Worker **you own**. Free tier (100,000 requests/day) is way more than you'll ever use. After this is set up, the public relays stay as automatic fallback — if your Worker ever has a hiccup, the app keeps working.

## What you'll do

1. Make a free Cloudflare account.
2. Paste the code from `worker/index.js` into a new Worker.
3. Click Deploy. Cloudflare gives you a URL like `https://global-pilot-relay.your-name.workers.dev`.
4. Tell the app to use it: one line pasted into the browser console.

That's the whole setup.

## Step 1 — Create a Cloudflare account

1. Go to https://dash.cloudflare.com/sign-up
2. Use any email + password. No credit card needed for the free tier.
3. Verify your email.
4. You'll land on the dashboard.

## Step 2 — Create the Worker

1. Left sidebar → **Workers & Pages**.
2. Click **Create** (or **Create Worker**).
3. Pick **Hello World** as the template (we'll replace its code anyway).
4. Name it `global-pilot-relay`. Click **Deploy**.
5. After deploy, you land on the Worker's detail page. Click **Edit code** (top right).
6. The editor opens. **Delete everything** in `worker.js`.
7. Open `worker/index.js` from this repo (https://github.com/GrantKorgan/global-pilot/blob/main/worker/index.js) and copy its contents.
8. Paste into Cloudflare's editor.
9. Click **Deploy** (top right).

## Step 3 — Get your Worker URL

After Deploy, the page shows your Worker's URL near the top — something like:

```
https://global-pilot-relay.your-cloudflare-name.workers.dev
```

Copy it.

## Step 4 — Tell the app to use it

1. Open the live app: https://grantkorgan.github.io/global-pilot/
2. Open the browser's developer console:
   - **Mac:** Cmd+Opt+J (Chrome) or Cmd+Opt+C (Safari, after enabling Develop menu)
   - **Windows:** F12 or Ctrl+Shift+J
3. Paste this (replace the URL with yours from Step 3):

```js
localStorage.setItem("global-pilot:worker-url", "https://global-pilot-relay.your-cloudflare-name.workers.dev");
location.reload();
```

4. The page reloads. The app now sends every NOAA request through your Worker first; the public proxies remain as fallback.

## How to verify it's working

- Open the live app, pick a departure (e.g. KTRK → KSFO in a piston single), build a brief.
- Open the dev console **Network** tab.
- Filter for `workers.dev` — you should see requests going to your Worker.
- The Diagnostics panel on the brief should still show "all feeds ok."

## How to undo / fall back to public proxies

Run this in the console:

```js
localStorage.removeItem("global-pilot:worker-url");
location.reload();
```

You're back on the public proxies. No harm done.

## Costs

Free tier: 100,000 Worker requests per day. A heavy day of personal use is maybe 30–50 requests. You will not hit this. There is no credit card on file, so even if you somehow did, Cloudflare just stops serving until next day rather than billing.

## If you want to update the Worker later

If we ever change `worker/index.js` in the repo, redeploying is: dashboard → Workers & Pages → your Worker → Edit code → paste the new contents → Deploy. Takes 30 seconds.

Or if you install the [wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) later, deploys become `cd worker && wrangler deploy`.
