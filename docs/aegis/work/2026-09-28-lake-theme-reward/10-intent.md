# Task Intent Draft

## Requested Outcome

Implement the approved Lake Theme, Golden Lotus Reward, and MapThemePackage
workstream in an isolated branch using the implementation plan.

## Scope

- Execute `docs/aegis/plans/2026-09-28-lake-theme-reward-implementation.md`.
- Preserve the frozen V3.4 input behavior.
- Use explicit user gates for visual mapping approval, real-device validation,
  and final import/freeze approval.

## Non-goals

- No changes to root `index.html` or `demo/baseline-6376422/index.html`.
- No V4 deterministic replay, new core hazards, framework migration, or runtime
  CDN dependency.
- No use of unprovenanced reference images as runtime assets.

## Baseline Read Set

- `WORK_PLAN.md`
- `docs/aegis/specs/2026-09-28-lake-theme-reward-design.md`
- `docs/aegis/plans/2026-09-28-lake-theme-reward-implementation.md`
- `docs/aegis/baseline/2026-09-28-initial-baseline.md`
- `docs/aegis/BASELINE-GOVERNANCE.md`
- `demo/index.html`, `demo/src/input.js`, `demo/src/journey.js`, and
  `demo/tests/*.test.cjs`

## Impact Statement Draft

Scope is both product and architecture: the work adds stage presentation and
reward behavior while extracting policy, visual, package, and governance owners
from the current inline game shell.
