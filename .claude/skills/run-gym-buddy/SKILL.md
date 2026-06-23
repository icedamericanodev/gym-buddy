---
name: run-gym-buddy
description: Build, run, and drive Herlyft (the gym-buddy app). Use when asked to start gym-buddy/Herlyft, run its lint/tests, take a screenshot of its UI, or interact with the running app.
---

Herlyft is a **single static HTML file** (`index.html`) — no framework, no build
step, no dev server. It's also a PWA (manifest + service worker). To drive it
headless: serve the repo over http so the manifest/service-worker get a real
origin, then run **`.claude/skills/run-gym-buddy/driver.mjs`**, which launches
the bundled Playwright Chromium, runs one real user flow (fill the profile →
see computed targets → build a workout → view dashboard/summary) and writes a
screenshot per step.

All paths below are relative to the repo root (`gym-buddy/`).

## Prerequisites

Node 22 and Python 3 are already on this container, and a Playwright Chromium
is bundled at `/opt/pw-browsers`. The dev deps (htmlhint + jsdom) are only
needed for lint/test:

```bash
npm install
```

No `apt-get` was needed — the bundled Chromium ran headless with `--no-sandbox`
out of the box.

## Run (agent path)

Serve the app, then drive it. The driver resolves Playwright from the global
install and points at `/opt/pw-browsers` for the browser binary:

```bash
python3 -m http.server 8137 --bind 127.0.0.1 >/tmp/herlyft-httpd.log 2>&1 &
SRV=$!
timeout 15 bash -c 'until curl -sf http://127.0.0.1:8137/index.html >/dev/null; do sleep 0.3; done'
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node .claude/skills/run-gym-buddy/driver.mjs
kill "$SRV"   # stop the server when done
```

Expected tail:

```
pwa: {"manifest":true,"themeColor":"#0a0e1a","swControlled":true,"swRegistered":true}

OK — drove profile -> workout -> dashboard -> summary, no page errors.
```

Screenshots land in `.claude/skills/run-gym-buddy/screenshots/` (gitignored):

| file | what it shows |
|---|---|
| `01-profile-empty.png` | landing / empty Profile tab |
| `02-profile-results.png` | computed BMI + BMR/TDEE + macros after Save |
| `03-workout-session.png` | Workouts tab, "Build me a quick session" → 5 exercises |
| `04-dashboard.png` | Dashboard (weight chart) |
| `05-summary.png` | printable Summary tab |

Driver knobs (env vars): `URL` (default `http://127.0.0.1:8137/index.html`),
`OUT` (screenshot dir), `PW` (Playwright module path). The driver exits
non-zero if the page logs any JS error.

## Run (human path)

Just open `index.html` in a browser (double-click, or `file://`). Useless
headless, and on `file://` the service worker won't register (it needs an
http(s) origin) — that's why the agent path serves over http.

## Test

```bash
npm run lint   # htmlhint over index.html
npm test       # jsdom smoke test — ~35 checks, prints "All smoke tests passed."
```

## Gotchas

- **Serve over http, not `file://`.** The service worker registration is guarded
  by `location.protocol.startsWith('http')`, so on `file://` the SW silently
  no-ops and you can't verify the offline/PWA layer. The driver's
  `swControlled: true` only appears when served over http.
- **The "Install app" button won't appear under automation.** It's gated on the
  browser's `beforeinstallprompt` event, which Chromium fires from engagement
  heuristics — not on a fresh automated load. The button staying hidden is
  correct behavior, not a bug; verify install wiring on a real Android device.
- **Playwright is CommonJS.** `import { chromium } from 'playwright'` fails with
  "Named export not found"; the driver default-requires it via `createRequire`.
- **Don't stop the server with `pkill -f`.** `pkill -f 'http.server 8137'` also
  matches the shell running the command (its own command line contains that
  string) and SIGTERMs you — the symptom is a mysterious exit code 144. Capture
  the PID (`SRV=$!`) and `kill "$SRV"`, or kill the port's listener:
  `kill $(ss -ltnHp | grep ':8137 ' | grep -oE 'pid=[0-9]+' | cut -d= -f2)`.
- **Service worker caches across runs.** If you change `index.html` and the page
  serves stale, bump `CACHE` in `sw.js` or clear it; the SW is network-first for
  the HTML shell so a normal reload usually picks up changes.

## Troubleshooting

- **`Named export 'chromium' not found ... CommonJS module`**: you imported
  Playwright as ESM. Use the driver (it `createRequire`s it) or
  `const { chromium } = require('playwright')`.
- **`browserType.launch: Executable doesn't exist`**: set
  `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` so Playwright finds the bundled
  Chromium instead of trying to download one.
- **`curl` to `:8137` hangs / connection refused**: the static server isn't up.
  Start it (see Run) and poll the URL before launching the driver.
