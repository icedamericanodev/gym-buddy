# Herlyft — Lift with her

A personal gym + nutrition assistant that runs in your web browser. No installation, no servers — just one file.

## What it does

- **Profile** — enter your age, sex, height, weight, activity level, goal, and preferred training style. See your BMI, BMR, daily calorie target, macros (protein / carbs / fat), and water.
- **Meals** — type the ingredients you have at home. Get matched recipes with USDA-grounded macros and prep steps.
- **Workouts** — browse 32 exercises (bodyweight / home / gym / stretching), filter by location or muscle (with the selected muscle highlighted on an anatomical body map), embed real form-tutorial videos inline, generate a 5-exercise quick session. Add an optional free RapidAPI key to also see animated demos and the muscle map.
- **Summary** — a one-page snapshot of your profile and daily targets, plus personalized meal & exercise recommendations. Export to PDF for the gym, your coach, or your records.

Your profile is saved in your browser, so it's remembered next time.

## How to run it on Windows

1. Download or clone this project to a folder, e.g. `C:\Users\YourName\herlyft`.
2. Open the folder in File Explorer.
3. Double-click `index.html`.

That's it — the app opens in your default browser (Chrome / Edge / Firefox all work).

To make it easier next time, right-click `index.html` → *Send to* → *Desktop (create shortcut)*.

## Use it online

Once GitHub Pages is enabled (one-time, see below), the latest version lives at:

**https://icedamericanodev.github.io/gym-buddy/**

Every merge to `main` re-deploys automatically.

### Enabling GitHub Pages (one-time setup)

1. In this repo on GitHub, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Done. The next merge to `main` will publish the site.

## How the calculations work

All numbers are grounded in reputable sources, surfaced via "i" popovers and a "How is this calculated?" panel:

- **BMI** — WHO categories
- **BMR** — Mifflin-St Jeor equation (1990), validated by Frankenfield ADA (2005)
- **TDEE** — BMR × Harris-Benedict activity multiplier
- **Calorie target** — NIH guidance on sustainable weight loss (−500 kcal cut, +300 kcal gain)
- **Protein** — ISSN Position Stand (2017); Morton et al. meta-analysis (2018): 2.2 g/kg cut, 1.6 g/kg maintain, 1.8 g/kg gain
- **Fat & Carbs** — IOM Acceptable Macronutrient Distribution Ranges (AMDR)
- **Water** — EFSA 2010 / Holliday-Segar 35 mL/kg

## Versioning

The current version shows as a small pill in the app header (e.g. `v0.7.0`). The full history lives in `CHANGELOG.md`.

## Project layout

```
herlyft/
├── index.html              ← the whole app, open in a browser
├── logo.png                ← brand asset
├── README.md               ← this file
├── CHANGELOG.md            ← release history
├── CLAUDE.md               ← AI-assistant working agreement
├── package.json            ← dev dependencies + scripts
├── tests/smoke.test.js     ← jsdom smoke test
├── .github/workflows/ci.yml ← CI + GitHub Pages deploy
└── .claude/                ← project subagents + settings
```
