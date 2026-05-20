# Gym Buddy

A simple personal gym + nutrition assistant that runs in your web browser. No installation, no servers — just one file.

## What it does (Step 1)

- **Profile** — enter your age, sex, height, weight, activity level, and goal. See your BMI, BMR, daily calorie target, and macros (protein / carbs / fat / water).
- **Meals** — type the ingredients you have at home. Get matched recipes you can cook right now.
- **Workouts** — browse exercises filtered by location (bodyweight / home / gym) and muscle group, with sets, reps, and form tips. Generate a 5-exercise session with one click.

Your profile is saved in your browser, so it's remembered next time.

## How to run it on Windows

1. Download or clone this project to a folder, e.g. `C:\Users\YourName\gym-buddy`.
2. Open the folder in File Explorer.
3. Double-click `index.html`.

That's it — the app opens in your default browser (Chrome / Edge / Firefox all work).

To make it easier next time, right-click `index.html` → *Send to* → *Desktop (create shortcut)*.

## How the math works

- **BMI** = weight (kg) / height (m)²
- **BMR** (calories at rest) — Mifflin-St Jeor formula
- **TDEE** (daily burn) = BMR × activity multiplier
- **Target calories** = TDEE + your goal adjustment (−500 to cut, 0 to maintain, +300 to bulk)
- **Macros** — 1.8 g protein per kg bodyweight, 25 % of calories from fat, the rest from carbs

## Coming in next steps

- Step 2 — real exercise GIFs/images
- Step 3 — log your meals & workouts day by day
- Step 4 — track progress charts over time
- Step 5 — bigger recipe and exercise database

## Project layout

```
gym-buddy/
├── index.html   ← the whole app, open this in a browser
└── README.md    ← this file
```
