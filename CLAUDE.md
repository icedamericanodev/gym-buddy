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
    └── settings.json       ← project-level Claude rules
```
