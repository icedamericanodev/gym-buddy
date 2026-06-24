# tasks/lessons.md

Durable lessons. **Review at session start.** After any correction from the
user — or a mistake you catch yourself — add the pattern and the rule that
prevents it recurring. Keep entries short and actionable.

---

## Shell

- **`pkill -f '<pattern>'` can kill your own shell.** If the pattern also
  appears in the command line that runs `pkill` (e.g. a port number or a
  command name), `pkill` SIGTERMs the calling shell too — the symptom is a
  mysterious **exit code 144**. Capture the PID at launch (`SRV=$!`) and
  `kill "$SRV"`, or kill the port's listener:
  `kill $(ss -ltnHp | grep ':PORT ' | grep -oE 'pid=[0-9]+' | cut -d= -f2)`.

## JavaScript / async

- **A throw inside an event handler that backs a Promise does NOT reject it.**
  Code in `img.onload`, `reader.onload`, IndexedDB `req.onsuccess`, etc. runs
  outside the Promise executor, so a synchronous throw there leaves the Promise
  pending forever (the awaiting UI hangs). Wrap the handler body in
  `try { … } catch (e) { reject(e); }`.
- **`[].forEach(fn)` throws if `fn` isn't callable — even when the array is
  empty.** `forEach` checks callability before iterating, so
  `arr.forEach(URL.revokeObjectURL)` throws "undefined is not a function" under
  jsdom (no `URL.revokeObjectURL`) regardless of length. Guard the callback or
  wrap it: `arr.forEach(u => maybeFn && maybeFn(u))`.
- **Guard async click handlers against double/triple fire.** A handler that
  awaits before mutating state lets rapid clicks (or duplicate touch events)
  queue several runs — e.g. saving duplicate records. Use a reentrancy flag set
  synchronously at entry and a `disabled` toggle, cleared in `finally`.
- **Re-render derived views on EVERY input that changes them, not just the
  obvious one.** Photo captions showed stale units because `renderPhotos()` ran
  on save/remove but not on unit-switch or tab-switch. When a value (units,
  profile) feeds multiple views, wire the change handler to all of them.
- **Escape backup/restore-sourced strings before `innerHTML`.** Anything that
  can come from a hand-edited backup file (ids, dates) is untrusted input — run
  it through `esc()` even for a local-only, single-user app.

## Testing (jsdom smoke tests)

- **Top-level `let`/`const` in the inline script are NOT reachable via
  `dom.window`.** `runScripts: 'dangerously'` only attaches `var` and function
  declarations to `window`; module-scoped `let currentUnits` is a closure
  variable. Setting `dom.window.currentUnits = 'imperial'` is a silent no-op —
  the code keeps reading the real closure value. To flip such state in a test,
  drive it through the real UI path (e.g. set the `<select>` value and
  `dispatchEvent(new dom.window.Event('change'))`), not by poking `window`.
  Symptom: a "metric" assertion passes by accident (default) while the
  "imperial" one renders empty/unchanged.
- **Playwright headless defaults to `prefers-color-scheme: light`.** When testing
  a theme that honors the OS preference on first visit, the headless browser
  starts in *light*, not dark. Pin it explicitly with the `colorScheme` context
  option (`newContext({ colorScheme: 'dark' })`) so screenshots/assertions are
  deterministic.

## Escalation / sensitive features

- **A domain agent can raise a values-level `Must fix` that overrides an explicit
  user spec — that's an ESCALATE, not a silent override.** For the body-shape
  selector the owner specified exact labels (Slim/Athletic/Average/Curvy/Full-
  figured), but `womens-health` flagged that putting "Athletic" on a thin→full
  size axis encodes "athletic = thinner" and the copy rewarded slimming. Don't
  unilaterally rewrite the owner's chosen copy on a body-image/safety topic, and
  don't merge with the Must-fix unresolved. Apply the values-neutral technical
  fixes, then `AskUserQuestion` with the concern + concrete options; implement
  only what they pick. (Owner chose the safer framing.)
- **Get a domain agent's FINAL strings, don't paraphrase its concern.** After the
  owner approved "safer framing," I ran `womens-health` again asking for exact
  paste-ready labels/intro/motivation copy. Much better than guessing what
  "safer" means.

## SVG / generated art

- **Prototype generated SVG in a throwaway standalone file and screenshot it
  before integrating.** The body silhouettes and muscle map were far faster to
  get right by rendering all variants side-by-side in a scratch HTML (Playwright
  `file://` screenshot) and iterating, vs. editing the 4000-line index.html and
  re-driving the whole app each time.
- **Screenshot the SVG prototype at LARGE size, not just thumbnail rows.** The
  v4.4.0 silhouette redraw looked fine in a 96px-wide row, so it shipped to review —
  but a zoomed (300px+) shot revealed a self-intersecting torso gash, boxy shoulders,
  and pin legs that two agents then flagged. Small renders hide path self-intersections
  and control-point artifacts. Always render at least one variant 3-4× larger (and the
  extreme sizes f=0 and f=1) before integrating.
- **A "tightened" regex can stop matching the real token.** Narrowing `back`'s matcher
  from `/lat/` to `/\blat\b/` to avoid grabbing `vastus lateralis` also stopped it
  matching the actual API token `lats` (the trailing `s` kills the `\b`). Needed
  `/\blats?\b|latissimus/`. When tightening a fuzzy matcher, unit-test BOTH a positive
  (the real token) and the decoy you're excluding — a smoke test caught this.
- **Arms-against-a-widening-body as separate overlapping sub-paths leave seams.**
  Two arm `<path>`s laid over a torso that widens with size produced a dark
  negative-space sliver / lopsided look that worsened on fuller figures. Fix:
  merge arms into the single body outline (or omit them) — a head + hourglass +
  legs reads as a body with zero seam risk at any scale.

## Testing (jsdom smoke tests)

- **`assert.deepStrictEqual` rejects cross-realm objects.** An object returned by
  page code via `dom.window.fn()` has the jsdom realm's `Object.prototype`, so
  `deepStrictEqual(result, {…literal})` fails on the prototype check even when
  values match (symptom: the printed "actual" looks identical to "expected").
  Assert fields individually (`assert.strictEqual(r.x, …)`) for window-returned
  objects.
- **Keep verify-driver assertions in sync with copy changes.** A driver that
  greps for old UI text ("Set your goal") silently fails after a copy reframe
  ("Set your direction") and looks like an app regression — check the driver
  before assuming the app broke.

## Subagents / orchestration

- **A newly-created `.claude/agents/*.md` isn't selectable as a `subagent_type`
  until the next session.** The Agent registry loads at session start; creating
  the file mid-session registers it for *later* (a system reminder confirms it),
  but the current turn's `Agent(subagent_type:'new-one')` fails with "agent type
  not found". Fallback: run `general-purpose` with the agent's brief inline.
- **Committing does NOT disturb a still-running subagent editing the same file** —
  a commit snapshots the index, it doesn't rewrite the working tree. So when the
  stop-hook nags about a finished agent's edit while others still run, it's safe
  to commit that checkpoint. But do NOT *edit* the same file yourself while agents
  are mid-edit — their `Edit` matches `old_string` against live disk and a
  concurrent change can break it (or yours). Wait for completion, then batch.

## Git / branch hygiene

- **After a squash-merge, the feature branch's remote ref diverges from `main`.**
  The squashed commit on `main` is a different SHA than the branch's commits, so
  reusing the same branch for the next feature needs a force-push (the stale
  pre-squash commits block a fast-forward). Cleanest fix: start each feature on
  a fresh branch off the freshly-pulled `main` (`git checkout -b claude/<feat>
  origin/main`) rather than reusing/​resetting the old one. Avoids the
  force-push-with-lease dance entirely.

- **Sync the local `main` ref before diffing or opening a PR.**
  `git diff main...HEAD` against a stale local `main` shows already-merged
  commits as if they were new. After a PR merges, run
  `git fetch origin && git branch -f main origin/main` so review agents and
  the PR diff see only the new work.
