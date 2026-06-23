#!/usr/bin/env node
// Driver for Herlyft (gym-buddy) — a single-file static HTML PWA.
//
// There is no build step and no dev server: the app IS index.html. We serve
// the repo over http (so the manifest + service worker have a real origin),
// drive it with the bundled Playwright Chromium, exercise one real user flow
// (fill the profile -> see results -> build a workout -> view dashboard/summary),
// and drop a screenshot per step. Exits non-zero if the page logged a JS error.
//
// Usage (from the repo root):
//   python3 -m http.server 8137 --bind 127.0.0.1 &   # serve the app
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
//     node .claude/skills/run-gym-buddy/driver.mjs
//
// Env:
//   URL   app url            (default http://127.0.0.1:8137/index.html)
//   OUT   screenshot dir      (default <this dir>/screenshots)
//   PW    playwright module   (default the global install on this container)

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const URL = process.env.URL || 'http://127.0.0.1:8137/index.html';
const OUT = process.env.OUT || join(HERE, 'screenshots');
const PW = process.env.PW || '/opt/node22/lib/node_modules/playwright';

const require = createRequire(import.meta.url);
const { chromium } = require(PW); // playwright is CommonJS — default-require it

mkdirSync(OUT, { recursive: true });
const errors = [];
let step = 0;

const browser = await chromium.launch({ args: ['--no-sandbox'] });
// Phone-sized viewport — Herlyft is mobile-first and the install button only
// makes sense on a handset.
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });

const shot = async (name) => {
  const file = join(OUT, `${String(++step).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  shot  ${file}`);
};

await page.goto(URL, { waitUntil: 'load' });
console.log(`title: ${await page.title()}`);
console.log(`tabs:  ${await page.locator('.tab-btn').count()}`);
await shot('profile-empty');

// --- flow: fill the profile and compute targets -------------------------
await page.fill('#p-age', '30');
await page.selectOption('#p-sex', 'female');
await page.fill('#p-height', '168');
await page.fill('#p-weight', '70');
await page.selectOption('#p-activity', '1.55');
await page.selectOption('#p-goal', '-500');
await page.click('#p-save');
await page.waitForSelector('#p-results', { state: 'visible' });
console.log('results visible after save:', await page.locator('#p-results').isVisible());
await shot('profile-results');

// --- flow: build a quick workout session --------------------------------
await page.click('.tab-btn[data-tab="workouts"]');
await page.click('#w-plan');
await page.waitForFunction(() => document.querySelector('#w-results')?.children.length > 0);
await shot('workout-session');

// --- the dashboard chart + printable summary ----------------------------
await page.click('.tab-btn[data-tab="dashboard"]');
await page.waitForTimeout(200);
await shot('dashboard');
await page.click('.tab-btn[data-tab="summary"]');
await page.waitForTimeout(200);
await shot('summary');

// --- PWA wiring ----------------------------------------------------------
const pwa = await page.evaluate(async () => {
  const reg = navigator.serviceWorker
    ? await navigator.serviceWorker.getRegistration().catch(() => null)
    : null;
  return {
    manifest: !!document.querySelector('link[rel="manifest"]'),
    themeColor: document.querySelector('meta[name="theme-color"]')?.content || null,
    swControlled: !!navigator.serviceWorker?.controller,
    swRegistered: !!reg,
  };
});
console.log('pwa:', JSON.stringify(pwa));

await browser.close();

if (errors.length) {
  console.error(`\nFAIL — ${errors.length} page error(s):`);
  errors.forEach((e) => console.error('  ' + e));
  process.exit(1);
}
console.log('\nOK — drove profile -> workout -> dashboard -> summary, no page errors.');
