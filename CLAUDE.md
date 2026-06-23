# Herlyft — working agreement

This repo follows **separation of duties**. You (the human owner) review and approve; Claude builds, verifies, and keeps CI green.

## Rules Claude follows

1. **Branching** — never push directly to `main`. Always commit and push to the feature branch the user is on (e.g. `claude/gum-buddy-app-1GY2X`). The push-to-main approval rule in `.claude/settings.json` enforces this.
2. **Pull requests** — Claude opens PRs as ready for review. **Only the human merges them.** Claude does not click Merge, even when CI is green.
3. **Always watch PRs** — immediately after opening any PR, Claude subscribes to its activity (`subscribe_pr_activity`) without asking first, and keeps watching until it is merged or closed — responding to CI failures and review comments per rule 4. Subscribing is an action only Claude can take (it's an MCP call, not something a settings.json hook can do), so this rule is what makes it automatic.
4. **Verify before push** — before any commit/push, Claude runs the local checks:
   - `npm run lint` (HTML structure)
   - `npm test` (smoke test via jsdom)
   If either fails, fix the root cause and re-run before pushing.
5. **Auto-fix CI** — when CI fails on a Claude-authored PR, Claude diagnoses and pushes fixes until it's green. No per-fix approval needed. If a fix would require an architectural change or is out of scope, stop and ask.
6. **No backwards-compat hacks** — fix the real issue, don't paper over it with `|| true`, skipped tests, or disabled rules.

## Development workflow

Herlyft follows a **plan → execute → verify → learn** loop. Two living files in `tasks/` drive it:

- **`tasks/todo.md`** — the current plan as a checklist. Write the plan here before starting non-trivial work, check items off as you go, and add a short **Review** when done. It also holds the backlog.
- **`tasks/lessons.md`** — durable lessons. After any correction from the user (or a mistake you catch yourself), record the pattern and the rule that prevents it. **Review this file at the start of a session.**

### Orchestration

1. **Plan first.** For any non-trivial task (3+ steps or an architectural decision), write the plan to `tasks/todo.md` as checkable items before touching code, and check in on it. If something goes sideways mid-task, stop and re-plan rather than pushing on. Write detailed specs upfront to reduce ambiguity.
2. **Use subagents to keep the main context clean.** Offload research, exploration, and parallel analysis to subagents — one focused task each. Throw more compute at hard problems via parallel subagents. (See "Specialized agents" and the auto-run set below.)
3. **Self-improvement loop.** After any correction, update `tasks/lessons.md` with the pattern and a rule for yourself, and iterate until the mistake stops recurring.
4. **Verify before done.** Never mark a task complete without proving it works — run `npm run lint` + `npm test`, and where it helps, diff behavior against `main`. Ask: "would a staff engineer approve this?" (Reinforces rule 4 above.)
5. **Demand elegance (balanced).** For non-trivial changes, pause and ask whether there's a simpler, more elegant approach; if a fix feels hacky, redo it properly knowing what you now know. Skip this for small, obvious fixes — don't over-engineer.
6. **Fix bugs autonomously.** Given a bug report, a failing test, or red CI: diagnose from the logs/errors and fix it without hand-holding (this is rule 5, Auto-fix CI). Stop and ask only if the fix needs an architectural change or is out of scope.

### Task-management loop

1. **Plan first** — write the plan to `tasks/todo.md` with checkable items.
2. **Verify the plan** — check in before implementing.
3. **Track progress** — mark items complete as you go.
4. **Explain changes** — a high-level summary at each step.
5. **Document results** — add a Review to `tasks/todo.md`.
6. **Capture lessons** — update `tasks/lessons.md` after corrections.

### Core principles

- **Simplicity first** — make every change as simple as possible; touch minimal code.
- **No laziness** — find root causes; no temporary fixes. Senior-developer standards (this is rule 6, No backwards-compat hacks).
- **Minimal impact** — change only what's necessary; avoid introducing new bugs.

## Specialized agents

Twelve project agents live in `.claude/agents/`:

| Agent | When to spawn |
|-------|---------------|
| `dietitian` | Anything that touches recipes, calorie/macro math, water targets, or future meal-related features |
| `gym-coach` | Anything that touches the `EXERCISES` array or workout programming/session-generation logic |
| `progress-analyst` | Anything that reads back the user's logged history — the Dashboard/Summary tabs, the weight-trend chart, streaks, trends, plateau detection |
| `womens-health` | Women-specific guidance and safety copy — cycle-aware framing, bone/iron needs, pregnancy/postpartum-safe language |
| `pwa-performance` | Making the app installable/offline (manifest, service worker, install prompt) or reviewing load time, payload size, and runtime performance |
| `accessibility` | Interactive markup, forms, or navigation changes — keyboard flow, ARIA, screen-reader, focus, reduced-motion (deeper than `ui-ux`'s contrast pass) |
| `senior-dev` | New features or non-trivial refactors |
| `ui-ux` | Any user-visible change |
| `code-reviewer` | Before declaring a feature done — read-only review of the branch diff |
| `qa` | Before declaring a feature done — exercises the app, finds and fixes small bugs |
| `end-user` | Manual / periodic. Simulates a real non-technical user and reports friction, wishes, delights — "would a real person actually want to keep using this?" |
| `product-manager` | Manual / periodic. Strategic review — what to build next, what to cut, prioritized by user value and effort, grounded in the current codebase |

### Auto-run at end of each feature step

When a "feature step" finishes (e.g. Step 2 — real exercise GIFs, Step 3 — daily log), before reporting **done** to the user, Claude must spawn the relevant agents in parallel:

- Always: `code-reviewer` + `qa` + `ui-ux`
- If recipe or macro content was touched: also `dietitian`
- If exercise or workout-programming content was touched: also `gym-coach`
- If the Dashboard/Summary, weight chart, or any logged-history read-back was touched: also `progress-analyst`
- If women-specific guidance or safety copy was touched: also `womens-health`
- If the manifest, service worker, offline behavior, or asset payload was touched: also `pwa-performance`
- If interactive markup, forms, or navigation/focus behavior was touched: also `accessibility`

`end-user` and `product-manager` are **not part of the auto-run set** — they're advisory and run too long for every PR. The user invokes them manually when they want fresh eyes or strategic input ("/end-user couch starter persona", "/product-manager what should we build next?"). Claude can also suggest invoking them when stuck on a direction question.

Address any `Must fix` / `P0` / `P1` items from the agents' reports, re-run the local checks, then push. Surface remaining `Should fix` / `P2` items in the PR description or the message to the user — don't silently swallow them.

For ad-hoc questions ("does this button feel right?", "is this recipe realistic?"), the user can also spawn an agent manually at any time.

## Versioning

The app displays a version pill in the header (e.g. `v0.9.0`) and ships a `CHANGELOG.md`. When a PR adds user-visible change, Claude bumps the version in `index.html` and adds a CHANGELOG entry as part of the same PR.

Pick the **smallest bump that fits**. New feature is always at least MINOR; bug fix is always at least PATCH. Pure internal refactors with no user-visible change don't bump.

### MAJOR — `X.0.0`

Significant new features or improvements that change how users interact with the app. The kind of release worth telling someone about.

- A new tab or major section (e.g. *Summary*, *Dashboard*, *Hydration*)
- A new core capability (e.g. PDF export, backup/restore, sign-in, PWA install)
- A rebrand, redesign, or new product direction
- A breaking change to user data (rare — pair with a migration path)

### MINOR — `0.X.0`

Smaller user-visible enhancements that build on existing features.

- New options or settings inside an existing tab (a new filter, a new profile field, a new sort)
- A handful of new recipes or exercises (not a wholesale library swap)
- New non-blocking content (info popovers, in-app guidance, citation footers)
- UX improvements that don't add a new capability (better empty states, card re-orderings, copy edits)

### PATCH — `0.0.X`

Bug fixes, small content corrections, and polish that doesn't add new capability.

- Fixing wrong calorie / protein numbers on a recipe
- Tightening an exercise form cue
- Visual / contrast / accessibility tweaks to an existing feature
- Hot-fixes to a previously-shipped PR

### Quick rubric

| Question | Answer |
|---|---|
| Did the user get a **new way to do something**? | **MAJOR** |
| Did **existing things get more / better**? | **MINOR** |
| Did something **broken get less broken**? | **PATCH** |

### When NOT to bump

Pure internal changes that ship no user-visible difference — subagent prompt tweaks, README polish, CI tweaks, test-only changes, dependency bumps with no behaviour change. Skip the version bump and skip the CHANGELOG entry.

## Deployment

CI runs on every PR. On merge to `main`, the `deploy` job in `.github/workflows/ci.yml` publishes the site to GitHub Pages. Don't push directly to `main` (the push-to-main approval rule still applies); deployment follows merges.

## Local commands

```bash
npm install      # one-time: installs htmlhint + jsdom
npm run lint     # check HTML structure
npm test         # run smoke tests
```

## Project layout

```
gym-buddy/
├── index.html              ← the whole app (open in browser)
├── README.md               ← user-facing docs
├── CLAUDE.md               ← this file
├── package.json            ← dev dependencies + scripts
├── .htmlhintrc             ← HTML lint rules
├── .gitignore
├── tests/
│   └── smoke.test.js       ← jsdom-based smoke test
├── .github/workflows/
│   └── ci.yml              ← runs lint + test on every PR
└── .claude/
    ├── settings.json       ← project-level Claude rules
    └── agents/             ← specialized subagents (dietitian, gym-coach, senior-dev, ui-ux, code-reviewer, qa, end-user, product-manager)
```
