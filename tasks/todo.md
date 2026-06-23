# tasks/todo.md

Living plan file. See **Development workflow** in `CLAUDE.md`. Write the plan
here before non-trivial work, check items off as you go, and add a short
**Review** when done.

---

## Mission: polish Herlyft for the owner's personal UX, then share publicly

Owner is the first user. Goal: make the app excellent for *her own* journey
(heaviest weight → ideal weight), then open it to the public. Work one item at
a time, each as its own reviewed PR.

## Current task: Progress-photo journey (item 1)

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
