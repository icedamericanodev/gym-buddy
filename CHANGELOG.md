# Changelog

All notable user-facing changes to Herlyft. The version shown in the app header matches the most recent entry.

## v1.2.0 — 2026-06-23

### Added
- **Goal weight + progress card** 🎯 — set an optional ideal weight on the Profile tab and the Dashboard now shows a new "Goal progress" card: how much you have to go, the percentage of the way from where you started to your goal, a progress bar, and the started → now → goal trio. Hits 100% with a "Goal reached 🎉" when you cross it, and stays honest about wrong-direction drift and single-weigh-in starts.
- The **weight-trend chart** now overlays a dashed champagne goal-line (with label) whenever your goal sits inside the visible y-range — so the line itself becomes the target you're chasing.
- Goal weight rides along with **Backup & Restore** automatically (it's part of your profile).

### Notes
- The goal weight is stored in kg internally and rendered in whatever unit you've picked on the Profile tab — switching units converts the value alongside your current weight, no retyping needed.

## v1.1.0 — 2026-06-23

### Added
- **Progress photos** 📸 — a new section on the Dashboard to document your journey from your heaviest weight to your goal. Add a photo, tag it with its date and your weight that day, and Herlyft builds a **before / now** comparison (heaviest vs latest, with the weight difference) plus a full timeline. Photos are downscaled on save and **stay on this device only** — they're never uploaded.
- Progress photos are included in **Backup & Restore** — the `.json` backup now carries your photos too (so the file is larger), and restoring brings them back.

### Notes
- Photos are stored in the browser's IndexedDB (images are too large for the localStorage budget); the gallery degrades gracefully where IndexedDB isn't available.

## v1.0.0 — 2026-06-23

### Added
- **Install Herlyft as an app** 📲 — Herlyft is now a Progressive Web App. On Android (Chrome/Edge) an **Install app** button appears in the header, and you can add it to your home screen to launch it full-screen like a native app, no app store required. iOS users can "Add to Home Screen" from Safari.
- **Works offline** — a service worker caches the app shell, so Herlyft opens and runs even with no connection. New deploys still reach you (the HTML is fetched network-first).
- Added a web app manifest and a set of app icons (standard + maskable) rendered from the Herlyft brand mark.

## v0.11.0 — 2026-05-20

### Added
- **Imperial units option** — new "Units" select on the Profile (Metric `cm, kg` ↔ Imperial `in, lbs`). Affects the Height and Weight inputs, the Summary tab's profile section, and the Dashboard tab's current/diff values + chart Y-axis labels. Internal storage stays in metric (cm + kg) so all the math is unchanged.
- Switching units **converts the currently-typed values automatically** so you don't have to retype your height or weight.
- Profile saves now include a `units: 'metric' | 'imperial'` preference; loaded back transparently on next visit.

### Changed
- Profile **schema bumped 1 → 2**. Schema 1 profiles (saved with v0.10 or earlier) load fine — they're treated as metric by default.

## v0.10.0 — 2026-05-20

### Added
- **Tiny love note easter egg** 💛 — tap the **HERLYFT** wordmark in the header and a small floating message rises and fades. Pulls from a pool of soft notes (including `mahal kita`). Lowkey by design: no banner, no sound, just a brief golden glow. Rate-limited so a triple-tap doesn't stack pops.

## v0.9.0 — 2026-05-20

### Added
- **Dashboard tab** — track your weight over time. Each time you save your profile with a new weight, today's value is logged automatically (last value per day wins). The Dashboard shows:
  - Current weight
  - Change vs 7 days / 30 days / 90 days / 1 year ago (green if down, red if up — no judgment, just the trend)
  - An SVG line chart with time-range filter (1 week / 1 month / 3 months / 1 year / All)
  - Empty state with guidance when you've never logged
- **Backup & Restore** card on the Profile tab. Download a single `herlyft-backup-YYYY-MM-DD.json` file containing your profile, weight history, and hydration log; restore it on another browser or after clearing your cookies. Restoring asks for confirmation before overwriting.

### Changed
- **Profile key migrated** from `gymBuddyProfile` → `herlyftProfile`. On first load after the update, your existing data is transparently copied to the new key — no manual action needed. The legacy entry is left in place so reverting to an older version still works.
- **Profile schema versioning** — saved profiles now include a `schema` field so future updates can migrate older shapes safely instead of guessing.

### Fixed
- **Corrupt profile data** in `localStorage` no longer crashes the app on load — it's now caught, logged, and the form starts blank.

## v0.8.0 — 2026-05-20

### Added
- **Hydration tracker** on the Profile tab. A new "Today's hydration" card shows your current intake against your daily target (e.g. *1.5 / 2.6 L · 58%*) with a progress bar that gradients from teal to gold as you approach the target.
- **Quick-add buttons**: + Cup (250 ml), + Bottle (500 ml), + Large (750 ml), plus an Undo button.
- **Persists per day** — each day's entries are stored separately in `localStorage`, so the tracker auto-resets at midnight and the history is kept for future progress-chart features.

## v0.7.1 — 2026-05-20

### Changed
- **Wordmark recreated in HTML/SVG** instead of cropping the brand mockup PNG. The header now reads "HERL[figure-Y]FT" where the figure-Y is a stylized standing person with arms raised holding a heart, drawn as inline SVG in champagne gold. Scales sharply at any size, no image dependency.
- **Heavy geometric typography** — Inter / Arial Black, 900 weight, wide letter-spacing — to match the visual feel of the brand sheet.
- **Favicon** swapped from the multi-panel mockup to a clean SVG of just the figure-Y mark on the navy background.
- **`logo.png`** stays in the repo as a brand-reference asset but is no longer embedded in the app UI.

## v0.7.0 — 2026-05-20

### Changed
- **Rebranded to Herlyft** (tagline: *Lift with her*). New header with logo asset and stylized wordmark.
- **New color palette** — champagne gold (`#e8b962`) + deep teal (`#14b8a6`) accents on a deep navy (`#0a0e1a`) base with warm-cream body text. No pink. Header gets a subtle gold/teal radial-gradient ambient lighting.
- README, CLAUDE.md, CHANGELOG, and all six project subagents updated with the new brand name.
- Deploy workflow now ships `logo.png` alongside `index.html`.

## v0.6.0 — 2026-05-20

### Added
- **Personalized recommendations in the Summary tab** — alongside your profile and daily targets:
  - **Recommended meals** picked from the library based on your BMI category: higher-calorie picks if you're underweight, balanced 350–600 kcal protein-forward picks if you're in the healthy range, and high-protein-per-calorie satiating picks if you're overweight or obese.
  - **Recommended exercises** filtered by your **new "Preferred training style"** field on the Profile (Bodyweight / Home / Gym / Stretching / Mixed). Picks 5 movements covering different muscle groups for balance.
- **Stretching is now a real option** — 8 common stretches added (hamstring, hip flexor, cat-cow, child's pose, quad, doorway chest, cross-body shoulder, standing forward fold), tagged `muscle: flexibility`. A new **Flexibility** filter button on the Workouts tab.

### Changed
- Profile form now has a fifth row for "Preferred training style" (default: Mixed).
- The Save button moved to its own full-width row to make room.

## v0.5.0 — 2026-05-20

### Added
- **Summary tab** — a one-page snapshot of your profile and daily targets (BMI, BMR, TDEE, calorie target, macros, water).
- **Export to PDF** — button on the Summary tab opens your browser's print dialog; pick "Save as PDF" from the printer dropdown to get a clean black-on-white printable file. Useful to share with a coach or dietitian, or keep as a personal snapshot.
- Print stylesheet hides the nav, headers, and other tabs so the PDF is just the Summary content.

## v0.4.0 — 2026-05-20

### Added
- **Embedded exercise demos** — each exercise card has a "▶ Show demo" button that expands an inline YouTube video. Videos autoplay muted and loop, so they behave like GIFs. Click "✕ Hide demo" or open another to close.
- **All 24 starter exercises** ship with a curated form-tutorial video from a reputable channel (ATHLEAN-X, Squat University, Bowflex, Jeff Nippard, Renaissance Periodization, and others).
- For any exercise without a curated video, a "▶ Search YouTube" link opens a search in a new tab as a fallback.

## v0.3.0 — 2026-05-20

### Added
- **Deploy to GitHub Pages** — every merge to `main` auto-publishes the app.
- **Version pill** in the header so you can see which version you're running.
- **CHANGELOG** (this file).
- **Mobile-friendly info icons** — tap an `i` next to any stat to see what it means and where the number comes from.
- **5 new recipes**: lentil curry (vegan), tofu stir-fry (vegan), chickpea pasta (vegan), baked salmon with rice & greens, cottage cheese with berries (high-protein snack).
- **2 new exercises**: dumbbell Romanian deadlift (home tier hinge), farmer's walk (loaded carry / core).
- **"Build a quick session" button label** adapts to the filtered pool — tells you when fewer than 5 exercises match.

### Changed
- **Cut-phase protein** bumped from 2.0 to 2.2 g/kg per ISSN upper range / Helms 2014.
- **Soft-clamp absurd profile inputs** — age, height, or weight outside sane adult ranges show a "double-check" hint instead of rendering BMI 750000.
- **Deadlift re-tagged** from "back" to "legs" so it shows up when filtering for posterior-chain work.
- **Pull-ups** uses AMRAP terminology.

## v0.2.0 — 2026-05-20

### Added
- **All calculations cited to reputable sources** — small "i" icons next to each stat, plus a collapsible "How is this calculated?" sources panel.
- **Sources covered**: WHO BMI categories, Mifflin-St Jeor BMR (1990, validated by Frankenfield ADA 2005), Harris-Benedict activity multipliers, NIH guidance on sustainable weight loss, ISSN 2017 + Morton 2018 for protein, IOM AMDR for fat/carbs, EFSA 2010 for water.
- **Goal-dependent protein** — 2.2 g/kg cut, 1.6 g/kg maintain, 1.8 g/kg gain.
- **Safety floor warning** — daily target below 1,200 kcal (women) or 1,500 kcal (men) shows a red "below safe minimum" pill.
- **Negative or zero profile inputs** are now caught and hide the results card instead of producing nonsense numbers.
- All **15 recipes re-grounded against USDA FoodData Central** reference values, with explicit gram weights in every prep step.
- All **22 exercise form cues** now include the common failure mode (e.g. squat: "don't let knees cave in"; deadlift: "don't round the lower back").

### Security
- **XSS hardening** — escape all variable interpolations in render templates, so future external data sources can't inject HTML.

## v0.1.0 — 2026-05-20

### Added
- **Profile tab** — BMI, BMR, TDEE, daily calorie target, macros (protein/carbs/fat), water target. Saved to browser localStorage.
- **Meals tab** — type the ingredients you have, get matching recipes from a 15-recipe starter library.
- **Workouts tab** — 22 starter exercises filterable by location (bodyweight / home / gym) and muscle group, plus a "build a quick session" button.
- **Single-file HTML app** — opens by double-clicking `index.html`. No installation, no build step.
