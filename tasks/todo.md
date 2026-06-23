# tasks/todo.md

Living plan file. See **Development workflow** in `CLAUDE.md`. Write the plan
here before non-trivial work, check items off as you go, and add a short
**Review** when done.

---

## Mission: polish Herlyft for the owner's personal UX, then share publicly

Owner is the first user. Goal: make the app excellent for *her own* journey
(heaviest weight → ideal weight), then open it to the public. Work one item at
a time, each as its own reviewed PR.

## Current task: Goal weight + progress-to-goal (item 2)

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
