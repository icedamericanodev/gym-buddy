# tasks/todo.md

Living plan file. See **Development workflow** in `CLAUDE.md`. Write the plan
here before non-trivial work, check items off as you go, and add a short
**Review** when done.

---

## Mission: polish Herlyft for the owner's personal UX, then share publicly

Owner is the first user. Goal: make the app excellent for *her own* journey
(heaviest weight → ideal weight), then open it to the public. Work one item at
a time, each as its own reviewed PR.

## Next session — pick one to start

Owner queued these at the end of the v2.0.0 session. **Do them one at a time,
each as its own PR.** Owner said "we can do one by one. To maximize the
enhancement."

1. **Goal-weight suggestion from BMI** (recommended start — small, contained, MINOR)
   Suggest an ideal goal weight using BMI 22 × height² (default) and offer a
   one-click "Use this" alongside the existing Profile-tab `#p-goal-weight`
   input. Show the suggestion as a hint under the field; recompute when height
   changes. Both `dietitian` (BMI 22 health rationale) and `progress-analyst`
   (framing — don't shame users above "healthy" BMI) must vet copy. No new
   agent needed.

2. **Theme refresh — aesthetic, dopamine-inducing** (MAJOR redesign)
   Trips rubric (redesign + product/UX direction). **Must escalate before
   shipping** — owner wants to see 2-3 palette/typography mockups and pick
   one before the full theme lands. Create a new `brand-designer` agent
   (separate from `ui-ux` — colour mood, typography voice, micro-interaction
   delight, motion). Reference: "dopamine-inducing" → warm motion, satisfying
   tactile feedback (button press, weight log, goal milestone), not slot-
   machine flashiness. Owner's framing: working out improves mental health,
   so the app should *feel* that way.

3. **Layout refresh — more appealing** (MAJOR redesign)
   Pairs with #2 once the new design tokens land. `brand-designer` + `ui-ux`
   in parallel. Keep IA (six tabs) intact unless the redesign exploration
   surfaces a stronger structure.

### Process notes for tomorrow's session
- Start the session by reading `tasks/lessons.md` (per CLAUDE.md), then this
  file, then ask the owner which of the three to start.
- For #2 specifically: do NOT ship a new theme on a single "go". Build the
  proposed palette / typography / motion choices into rendered mockups (use
  the run-gym-buddy skill to screenshot the existing app with the proposed
  tokens applied) before asking the owner to choose.
- The feature branch `claude/compassionate-maxwell-3l66g4` is rebased to main
  at `7ef9e4f`. Fine to continue on it, or branch off — owner's preference.

## Shipped today (2026-06-23)
- ✅ #24 delegated-approval merge model + `approver` agent (CLAUDE.md rule 2)
- ✅ #25 Goal weight + progress-to-goal (v1.2.0)
- ✅ #26 Today home view as default landing (v2.0.0)

---

## Past task: "Today" home view (item 3) — MAJOR v2.0.0

A first-tab landing that answers "where am I right now?" at a glance. The owner
chose: new "Today" tab as the default landing, one weight-glance card to start
(current + 7-day delta + goal pct). Hydration, workout suggestion, and meals
intentionally deferred — start minimal, grow.

**Plan:**
- [ ] Insert "Today" as the first tab (`<button class="tab-btn on" data-tab="today">Today</button>`); make it the default-active tab on load.
- [ ] Add `<section id="today" class="tab on">` markup; demote the current Profile-tab default `on` state.
- [ ] Build `renderToday()`: pull `current` + 7-day-prior delta + goal-pct from existing weight/profile helpers (reuse `findClosestPriorWeight`, `getGoalWeightKg`). One card, mobile-first.
- [ ] Empty / partial states: no profile → "Set up your profile to get started" (deep link); profile + no weights → "Save your weight to start tracking"; weights + no goal → just current + 7d delta (no pct).
- [ ] Re-render on profile save / unit switch / restore / startup / tab switch into Today.
- [ ] Verify (lint + test + real-browser drive at 390px), auto-run agents: code-reviewer + qa + ui-ux + progress-analyst (reads back history).
- [ ] MAJOR bump 1.2.0 → 2.0.0; CHANGELOG.
- [ ] PR + approver gate. Note the human pre-approved the new-tab + MAJOR rubric trigger via AskUserQuestion before work started.

### Review
_(fill in once shipped)_

### Today-view backlog (deferred from v2.0.0)
- [ ] **Empty-state innerHTML re-injection** (code-reviewer nit): every renderToday() call in the empty state rewrites `emptyEl.innerHTML` and rebinds the CTA listener, stealing focus from a tabbed-in user. Cache the current state and only re-render on change, or move the listener to event delegation.
- [ ] **Today/Dashboard asymmetry** (code-reviewer): Today hides the goal-mini for `arr.length < 2` while Dashboard shows an explicit hint. Intentional density tradeoff for now; revisit if users miss the goal block.
- [ ] **Today overshoot summary** (progress-analyst nit): when goal is reached with >0.5 kg overshoot, swap "Goal reached 🎉" → "Goal reached — see Dashboard" so the deeper maintenance nudge isn't hidden.
- [ ] **320px viewport delta wrap** (qa P2): "No earlier weigh-in to compare yet" could wrap to 2 lines on iPhone SE 1st gen — couldn't verify in jsdom; needs real-device eyeball.

## Done: Goal weight + progress-to-goal (item 2) — shipped in #25 (v1.2.0)

Capture an optional goal/ideal weight and show progress toward it — the
motivational bookend to the before/now photo hero.

**Plan:**
- [ ] Optional "Goal weight" field on the Profile form (display units; stored in kg, additive/back-compat — no schema migration)
- [ ] Wire it through load/save + the units-conversion handler + applyUnitLabels
- [ ] New "Goal progress" card on the Dashboard: "X kg to go" (or "Goal reached 🎉"), a progress bar, and a "started → now → goal" caption
- [ ] Progress math: baseline = first logged weight ("since you started"); pct = (start−current)/(start−goal), clamped; handle loss/gain/overshoot/single-weigh-in honestly (progress-analyst to vet framing)
- [ ] Re-render the card on save / unit-switch / tab-switch / restore / startup
- [ ] Verify (lint + test + real-browser drive), auto-run agents incl. progress-analyst, then approver gate → auto-merge if APPROVE
- [ ] MINOR bump (additive feature) + CHANGELOG

### Review
_(fill in once shipped)_

### Goal-progress backlog (from review-agent feedback, deferred from v1.2.0)
- [ ] **Baseline from a `goalSetAt` timestamp**, not `arr[0]` (progress-analyst). Save `goalSetAt` whenever `goalWeight` changes; use the first weigh-in on/after that date as the baseline; fall back to `arr[0]` if none. Surfaces "since {date}" under the Start stop.
- [ ] **Rolling 7-day average for pct**, not raw last point (progress-analyst). Suppress pct entirely when `totalKg < 2 kg` or `arr.length < 4` — show absolute remaining only. Smooths week-to-week noise.
- [ ] **Off-chart goal indicator** when goal sits outside `[yMin, yMax]` (progress-analyst). Render `"goal X.X — off chart ↓"` (arrow per direction) at the chart edge so absence is explained, not silent.
- [ ] **Upper-bound goal warn** (qa P2). Non-blocking warning when goal is outside 20–400 kg or > ~50 kg from current weight.

---

## Done: Progress-photo journey (item 1) — shipped in #23 (v1.1.0)

Attach progress photos across the weight journey — from heaviest weight until
the goal is reached — so the owner can *see* the change, not just the line.

**Design decisions (answered):**
- [x] Feature shape: **timeline-tied milestones + a before/now hero** (heaviest vs latest)
- [x] Photos **included in the JSON backup/restore** (owner accepts larger backup files)

**Plan:**
- [x] Store images in **IndexedDB** (downscaled JPEG blobs), not localStorage
- [x] "Add progress photo" form; tag each photo with date + weight (defaults to latest logged weight)
- [x] Before/now hero (heaviest vs latest) with the weight delta
- [x] Full timeline grid with per-photo Remove
- [x] Privacy: "Photos stay on this device only" stated in the UI
- [x] Photos layered into Backup & Restore (export/restore made async; old backups still load)
- [x] Verify: `npm run lint` + `npm test` green; real-browser drive (2 photos → hero/delta/timeline/IDB/backup confirmed)
- [x] Version MINOR bump v1.0.0 → v1.1.0 + CHANGELOG
- [x] Auto-run review agents (code-reviewer, qa, ui-ux, progress-analyst, accessibility, pwa-performance), address findings, then PR

### Review
Shipped the progress-photo journey. Images live in IndexedDB as downscaled
JPEGs (feature-detected; degrades to empty state where IDB/canvas are absent,
e.g. jsdom). Before/now hero computes heaviest-by-weight vs latest with a
weight delta; full timeline supports delete. Backup/restore now carry photos
as data URLs (export/restore turned async, backward-compatible). Verified in
Chromium end-to-end. Bug caught & fixed during verify: `Array.forEach` throws
on a non-callable callback even for an empty array — guarded `URL.revokeObjectURL`.

---

## Polish backlog — personal UX before public launch

Candidate items to sequence after the photo journey (re-prioritize as we go):

- [ ] **Goal weight + progress-to-goal** — surface "X kg to go" / % toward ideal weight, tied to the photo journey
- [ ] First-run / empty-state polish so a brand-new public user isn't lost
- [ ] **Today home view** (PM Now #2) — hydration %, today's workout status, weight + trend at a glance
- [ ] **Workout logging** (PM Now #1) — "I did this" check-off + recent history
- [ ] **Streak indicator** (after logging)
- [ ] **Cycle-aware framing** (`womens-health`)
- [ ] **Hydration history chart** — per-day data already stored
- [ ] Public-launch readiness: README/screenshots, share link, final a11y + perf pass

## Shipped this session
- ✅ #18 four new agents · #19 PWA v1.0.0 · #20 run-gym-buddy skill ·
  #21 auto-watch PRs · #22 plan→execute→verify→learn workflow
