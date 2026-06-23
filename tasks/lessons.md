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

## Git / branch hygiene

- **Sync the local `main` ref before diffing or opening a PR.**
  `git diff main...HEAD` against a stale local `main` shows already-merged
  commits as if they were new. After a PR merges, run
  `git fetch origin && git branch -f main origin/main` so review agents and
  the PR diff see only the new work.
