# Todo Checkpoint Draft

## Current Todo

Task 3: extract immutable chapter and checkpoint configuration.

## Completed Todos

- Task 0: frozen Aegis documentation at commit `2d12adf`.
- Task 0: added `.worktrees/` ignore rule at commit `a0be060`.
- Task 0: created isolated branch `feature/v2-lake-theme-reward-sample`.
- Task 0: baseline `node --test demo/tests/*.test.cjs` passed 27/27.
- Task 0: root and frozen baseline SHA-256 values both match
  `00a079310d941c0238b8dca505811369ef1448b0e60c80088ffccca353f830bd`.
- Task 1: committed development-only tooling at `4afee1a`.
- Task 1: `npm ci`, `npm run test:unit` (27/27),
  `npm run serve:demo -- --help`, and `npx playwright --version` passed.
- Task 1: `npm audit` reports one moderate transitive dependency advisory; no
  forced upgrade was applied because it would violate pinned-tool reproducibility.
- Task 2: added 16 version-1 governance contracts plus the shared schema
  definitions, deterministic RFC 8785 hash helpers, and an AJV 2020 loader.
- Task 2: `node --test demo/tests/map-theme-governance.test.cjs` passed 3/3;
  full Node regression passed 30/30; baseline hashes remain
  `00a079310d941c0238b8dca505811369ef1448b0e60c80088ffccca353f830bd`.
- Task 2: Schema Freeze Check records the complete schema SHA-256 values from
  the task execution log; positive package and hash fixtures pass, while
  unknown fields, invalid paths, duplicate source roles, and protected-element
  overrides fail.

## Active Slice

Create `FrogChapters` immutable stage/checkpoint configuration and retain
existing `FrogJourney` milestone behavior. Do not integrate it into runtime
or alter accepted input behavior in this slice.

## Blocked-On Items

One moderate npm audit advisory remains non-blocking for the pinned
development-only toolchain.

## Resume State Hint

Worktree:
`frog-game-v2/.worktrees/feature-v2-lake-theme-reward-sample`

Next action: create `demo/src/chapters.js` and isolated chapter tests, then
update only journey-policy construction as Task 3 specifies.

## Drift Check Draft

- Intent: aligned.
- Compatibility: root/frozen hashes and existing 27 tests preserved.
- Ownership: Task 2 introduces only governance/schema owners outside runtime.
- Retirement: no old runtime owner is retired in this slice.
- Decision: continue.
