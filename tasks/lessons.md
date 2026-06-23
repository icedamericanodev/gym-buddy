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

## Git / branch hygiene

- **Sync the local `main` ref before diffing or opening a PR.**
  `git diff main...HEAD` against a stale local `main` shows already-merged
  commits as if they were new. After a PR merges, run
  `git fetch origin && git branch -f main origin/main` so review agents and
  the PR diff see only the new work.
