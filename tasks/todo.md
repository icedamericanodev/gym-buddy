# tasks/todo.md

Living plan file. See **Development workflow** in `CLAUDE.md`. Write the plan
here before non-trivial work, check items off as you go, and add a short
**Review** when done.

---

## Current task: Adopt the plan → execute → verify → learn workflow

- [x] Fetch the source workflow (BorisCherny CLAUDE.md)
- [x] Add a "Development workflow" section to `CLAUDE.md` (orchestration, task loop, core principles), wired to existing rules
- [x] Create `tasks/todo.md` (this file) and `tasks/lessons.md`
- [x] Run `npm run lint` + `npm test` (green)
- [x] Commit, push, open PR, subscribe

### Review
Adopted the plan → execute → verify → learn workflow into `CLAUDE.md` (six
orchestration principles, the task-management loop, and core principles),
wired to the existing numbered rules so nothing contradicts. Scaffolded
`tasks/todo.md` (this file, with the PM backlog) and `tasks/lessons.md`
(seeded with the two real lessons from this session). Internal process only —
no app change, no version bump. Lint + tests green.

---

## Backlog — from the product-manager review (v1.0.0)

The PM's thesis: Herlyft calculates a lot but records almost nothing — that's
the retention gap. Ordered by leverage:

- [ ] **Workout logging** — "I did this" check-off + recent-sessions history (PM Now #1, M)
- [ ] **"Today" home view** — assemble hydration %, today's workout status, weight + 7-day trend (PM Now #2, M)
- [ ] **Streak indicator** — workouts-this-week / streak, after logging exists (S)
- [ ] **Cycle-aware framing** — optional, safely framed; led by `womens-health` (M)
- [ ] **Hydration history chart** — the per-day data is already stored (S)
- [ ] **Meal logging vs macro targets** — library recipes toward a daily total (L)
