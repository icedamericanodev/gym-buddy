# Changelog

All notable user-facing changes to Gym Buddy. The version shown in the app header matches the most recent entry.

## v0.4.0 — 2026-05-20

### Added
- **Embedded exercise demos** — each exercise card has a "▶ Show demo" button that expands an inline YouTube video. Videos autoplay muted and loop, so they behave like GIFs. Click "✕ Hide demo" or open another to close.
- For exercises without a curated video, a "▶ Search YouTube" link opens a search in a new tab.

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
