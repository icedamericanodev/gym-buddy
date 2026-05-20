# Gym Buddy — working agreement

This repo follows **separation of duties**. You (the human owner) review and approve; Claude builds, verifies, and keeps CI green.

## Rules Claude follows

1. **Branching** — never push directly to `main`. Always commit and push to the feature branch the user is on (e.g. `claude/gum-buddy-app-1GY2X`). The push-to-main approval rule in `.claude/settings.json` enforces this.
2. **Pull requests** — Claude opens PRs as ready for review. **Only the human merges them.** Claude does not click Merge, even when CI is green.
3. **Verify before push** — before any commit/push, Claude runs the local checks:
   - `npm run lint` (HTML structure)
   - `npm test` (smoke test via jsdom)
   If either fails, fix the root cause and re-run before pushing.
4. **Auto-fix CI** — when CI fails on a Claude-authored PR, Claude diagnoses and pushes fixes until it's green. No per-fix approval needed. If a fix would require an architectural change or is out of scope, stop and ask.
5. **No backwards-compat hacks** — fix the real issue, don't paper over it with `|| true`, skipped tests, or disabled rules.

## Specialized agents

Eight project agents live in `.claude/agents/`:

| Agent | When to spawn |
|-------|---------------|
| `dietitian` | Anything that touches recipes, calorie/macro math, water targets, or future meal-related features |
| `gym-coach` | Anything that touches the `EXERCISES` array or workout programming/session-generation logic |
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

`end-user` and `product-manager` are **not part of the auto-run set** — they're advisory and run too long for every PR. The user invokes them manually when they want fresh eyes or strategic input ("/end-user couch starter persona", "/product-manager what should we build next?"). Claude can also suggest invoking them when stuck on a direction question.

Address any `Must fix` / `P0` / `P1` items from the agents' reports, re-run the local checks, then push. Surface remaining `Should fix` / `P2` items in the PR description or the message to the user — don't silently swallow them.

For ad-hoc questions ("does this button feel right?", "is this recipe realistic?"), the user can also spawn an agent manually at any time.

## Versioning

The app displays a version pill in the header (e.g. `v0.3.0`) and ships a `CHANGELOG.md`. When a PR adds user-visible behavior, Claude bumps the version in `index.html` and adds a CHANGELOG entry as part of the same PR. Semantic-ish:

- `MAJOR` — breaking change for users (rare; we're pre-1.0)
- `MINOR` — new features
- `PATCH` — bug fixes / polish

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
