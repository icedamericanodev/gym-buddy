# tasks/todo.md

Living plan file. See **Development workflow** in `CLAUDE.md`. Write the plan
here before non-trivial work, check items off as you go, and add a short
**Review** when done.

---

## Mission: polish Herlyft for the owner's personal UX, then share publicly

Owner is the first user. Goal: make the app excellent for *her own* journey
(heaviest weight → ideal weight), then open it to the public. Work one item at
a time, each as its own reviewed PR.

## Queue — do one at a time, each its own PR

1. ✅ **Goal-weight suggestion from BMI** — shipped in #28 (v2.1.0). Final
   shape: healthy-range hint + "Use mid-range (BMI 23)" button + muscle caveat
   + authorship note; clinical BMI numbers kept out of the visible line.
   Open question surfaced to owner in the PR: whether to show the explicit
   "BMI 18.5–24.9" band (currently hidden) — one-line change if they want it.

2. ✅ **Theme refresh — "Golden Honey"** — shipped in #30 (v3.0.0). Owner
   chose "Warm & uplifting" mood + light/dark with a toggle, concept B
   (Golden Honey), from 3 rendered mockups. Delivered: dark+light token
   sets, header sun/moon toggle (persists `herlyftTheme`, first-visit honors
   `prefers-color-scheme`, pre-paint flash guard), theme-aware header, and
   the weigh-in count-up + honey-particle delight (reduced-motion safe). New
   `brand-designer` agent created (`.claude/agents/brand-designer.md`).

3. **Layout refresh — more appealing** (MAJOR redesign) — NEXT (owner paused
   2026-06-24; resume next session)
   Pairs with #2 now that Golden Honey tokens + the brand-designer agent exist.
   Keep IA (six tabs) intact unless the exploration surfaces a stronger
   structure. **Flow: build 2-3 rendered mockups (brand-designer + ui-ux),
   owner picks, then build** — same as the theme. Don't ship on a single "go".

   **Owner's focus areas (selected 2026-06-24 — all four):**
   - **Today / home density** — the single card may feel sparse for a "home";
     consider a tasteful second glance (streak, hydration, today's workout
     status). Ties to deferred Today-backlog items + queue items (hydration,
     workout logging). Don't overcrowd the hero.
   - **Profile form length** — long single-column form; explore grouping /
     sectioning / progressive disclosure so it's less scrolly.
   - **Dashboard / cards** — card spacing, the stat grid rhythm, chart framing,
     goal-card hierarchy.
   - **Global rhythm & spacing** — consistent vertical rhythm, card radii/
     padding, section spacing across all tabs (polish layer, do this last so it
     unifies whatever the per-screen work produces).

   Suggested order: global spacing scale first (tokens/util classes) → then the
   three per-screen passes on top. brand-designer owns surface/spacing/rhythm;
   ui-ux owns usability/flow; accessibility for any focus/markup changes.

   **Exploration phase plan (session 2026-06-24 — owner chose: 3 distinct
   directions, all three screens per concept):**
   - [ ] Baseline: run-gym-buddy, seed data, screenshot Today/Profile/Dashboard @390px
   - [ ] Explore in parallel: brand-designer (spacing scale, radii/padding, rhythm)
         + ui-ux (Today density, Profile sectioning, Dashboard card hierarchy) —
         read-only analysis grounded in current markup, return proposals as text
   - [ ] Synthesize into 3 coherent directions (e.g. Airy / Dense-glanceable / Hybrid),
         each = a global spacing scale + the three per-screen treatments
   - [ ] Build each as throwaway CSS/markup on the running app; screenshot all 3 screens
   - [x] AskUserQuestion → owner picks direction (escalate design direction per rule 2)
   - [x] **Owner picked: Direction C "Honeyed Hybrid"** + "wire up what's cheap now"
         (real streak from weight history, real hydration status; workout tile = CTA)

   **Full build plan (Direction C):**
   - [ ] Global geometry tokens in :root (--space-*, --radius-*); re-point .card,
         .stat/.dash-stat, grids, main padding. Unify forked stat grids.
   - [ ] Today glance row markup: Streak (real) · Hydration (real status) · Workout (CTA→Workouts)
   - [ ] computeStreak() from getWeights() dates; wire into renderToday
   - [ ] Move full hydration tracker card from Profile → Today; remove from Profile
   - [ ] Profile: 3 grouped sections (About you / Your body / Your goals) w/ dividers
   - [ ] Dashboard: goal-card elevation + accent top edge; promote current weight to banner
   - [ ] Verify: npm run lint + npm test + real-browser drive @390px
   - [ ] Auto-run agents: code-reviewer + qa + ui-ux + accessibility + progress-analyst + brand-designer
   - [x] MAJOR bump 3.0.0 → 4.0.0 + CHANGELOG + sw.js CACHE
   - [x] Remove mockup.html; PR → approver gate

   ### Review (v4.0.0 — shipped this session)
   Built Direction C "Honeyed Hybrid" after the owner picked it from 3 rendered
   mockups (brand-designer + ui-ux explored; mockups screenshotted via
   run-gym-buddy). Shared spacing/radius token scale unifies the previously
   forked stat grids; Today gains a 2-up glance row (real weekly streak +
   workout CTA) with the hydration tracker relocated from Profile; Profile
   grouped into 3 sections (now real <h3>s); Dashboard leads with the elevated
   goal card + a current-weight banner. Verified: lint + 19→20 smoke tests
   (added computeStreak coverage), real-browser drive @390px dark+light, no
   page errors. Auto-run panel (code-reviewer, qa, ui-ux, accessibility,
   progress-analyst, brand-designer) all reported; fixes applied:
   - progress-analyst Must: streak no longer claims "This week" when only last
     week was logged (added `current` flag + grace-window copy "log this week
     to keep it").
   - ui-ux Must: lapsed streak now dims (`.lapsed` — greyed flame + muted text).
   - Removed dead `.glance-bar` CSS; dropped the workout-CTA aria-label that
     was silencing its visible text; added `aria-live` to the streak tile;
     field-group <p>→<h3>; tokenized residual raw px in .today-card/.today-head.
   Deferred (Should/Nit, surfaced in PR): glance-tile height imbalance when the
   workout value wraps at ≤390px (cosmetic); ≤320px real-device eyeball;
   hydration as a peer card below a 2-tile glance (by design); `--space-7`
   kept as a scale anchor (unused for now).

### Process notes
- Redesigns: never ship on a single "go" — build rendered mockups (run-gym-buddy
  skill) and have the owner pick before the full build. (Worked well for #30.)
- The `brand-designer` agent registers at session start; created mid-session it
  isn't selectable until next session (use general-purpose w/ inline brief as a
  fallback — see lessons.md).

## Shipped — session of 2026-06-23 → 06-24
- ✅ #24 delegated-approval merge model + `approver` agent (CLAUDE.md rule 2)
- ✅ #25 Goal weight + progress-to-goal (v1.2.0)
- ✅ #26 Today home view as default landing (v2.0.0)
- ✅ #28 Goal-weight suggestion from BMI (v2.1.0)
- ✅ #30 Golden Honey theme + light/dark + weigh-in delight (v3.0.0)
- ✅ #29 brand-designer agent + lessons/queue docs

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
