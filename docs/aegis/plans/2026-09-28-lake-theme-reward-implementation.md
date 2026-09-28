# Lake Theme, Golden Lotus Reward, and MapThemePackage Implementation Plan

Date: `2026-09-28`
Status: `Draft for user approval`
ArchitectureReviewRequired: `yes`
Parent specification:
`docs/aegis/specs/2026-09-28-lake-theme-reward-design.md`

## Goal

Implement the approved two-theme lake presentation, golden-lotus checkpoint
rewards, deterministic `MapThemePackage` contract, protected canonical element
registry, and approval-gated package import path without changing the accepted
V3.4 input behavior or either frozen baseline.

The finished slice must:

- render Stage 1 as morning mist and Stage 2 as a stormy deep lake;
- blend rows 10-12 at exact `75/25`, `50/50`, and `25/75` weights;
- create safe golden-lotus checkpoints at rows 12 and 24;
- apply the exact Stage 1 reward and Stage 2 final settlement;
- preserve all run state through the Stage 1 transition;
- load only schema-valid, receipt-qualified map packages;
- reject theme attempts to replace canonical gameplay elements;
- complete automated, browser, performance, and real-device verification before
  the new baseline is frozen.

## Architecture

Keep `demo/index.html` as the sole runtime orchestrator. Extract immutable
chapter facts to `chapters.js`, reward arithmetic to `rewards.js`, canonical
Canvas element drawing to `game-elements.js`, package validation/loading to
`map-theme.js`, and environment presentation to `map-theme-renderer.js`.

Static map input and package governance stay outside runtime. Versioned JSON
Schemas define the wire formats. `map-theme-validate.mjs` validates staged
artifacts without mutating inputs, `map-theme-import.mjs` alone installs an
approved package, and `map-theme-audit.mjs` verifies the complete approval chain
before deployment.

## Tech Stack

- Runtime: native HTML, CSS, JavaScript, Canvas 2D, Web Audio API.
- Browser module contract: one UMD source exposing a browser global and
  `module.exports` for Node tests.
- Policy and structural tests: Node built-in `node:test`.
- Governance scripts: Node ESM, `node:crypto`, `node:fs`, `node:path`.
- Schema validation: `ajv@8.17.1` and `ajv-formats@3.0.1`, development-only.
- JSON canonicalization: `json-canonicalize@1.1.1`, development-only.
- Browser verification: `@playwright/test@1.55.1`, development-only.
- Static serving for tests: `http-server@14.1.1`, development-only.
- Runtime deployment: unchanged static files; no runtime package manager, CDN,
  framework, bundler, or remote asset dependency.

## Baseline / Authority Refs

1. `WORK_PLAN.md`: phase order, isolated execution, one active batch, human gates.
2. `docs/aegis/specs/2026-09-28-lake-theme-reward-design.md`: approved behavior,
   architecture, ingestion standard, formulas, budgets, and acceptance.
3. `docs/aegis/baseline/2026-09-28-initial-baseline.md`: product and runtime
   invariants.
4. `docs/aegis/BASELINE-GOVERNANCE.md`: design-defect versus implementation-drift rules.
5. `README.md`: current static deployment and payload claims.
6. `demo/index.html`: current runtime and the old inline owners to retire.
7. `demo/src/input.js`: frozen V3.4 input owner.
8. `demo/src/journey.js`: current journey policy owner.
9. `demo/tests/*.test.cjs`: current 27-test regression baseline.
10. Frozen commits: runtime `b232582`, acceptance documentation `6ad94b9`.

## Compatibility Boundary

- Never modify root `index.html` or `demo/baseline-6376422/index.html`.
- Their SHA-256 must remain
  `00a079310d941c0238b8dca505811369ef1448b0e60c80088ffccca353f830bd`.
- Do not modify accepted thresholds, ownership, cancellation, or buffering in
  `demo/src/input.js`.
- Preserve keyboard, D-Pad, Canvas swipe, and bomb controls.
- Preserve absolute `gridY`, `Game.rows` collision truth, and state continuity.
- Rendering and package fallback remain cosmetic and cannot mutate gameplay.
- Keep relative paths valid under
  `https://shaofang1116.github.io/frog-game-v2/demo/`.
- Do not introduce V4 seeded gameplay generation or replay work.
- Do not commit `.DS_Store` or unprovenanced uploaded reference images.

## Verification

Minimum automated command set:

```bash
npm ci
node --test demo/tests/*.test.cjs
npm run test:browser
npm run audit:map-themes
shasum -a 256 index.html demo/baseline-6376422/index.html
```

Expected automated result:

```text
Node tests: 0 failed
Browser matrix: 0 failed
Map-theme audit: PASS for morning-mist and storm-deep-lake
Both baseline hashes: 00a079...30bd
Cross-origin runtime requests: 0
Initial transfer: <= 550 KiB and <= 12 requests
```

Human evidence is required at the Design Approval, Visual Sample and Mapping
Approval, Real-Device, and Acceptance Freeze and Import Approval gates.

## Plan Basis

### Facts

- Current branch is `feature/v2-journey-input-demo`.
- V3.4 input behavior is accepted and frozen at `b232582`.
- `demo/index.html` is 1577 lines and currently owns orchestration, generation,
  settlement, rendering, and UI binding.
- Current rendering uses one inline `#1b4965` fill and procedural wave loop.
- Current Stage 2 message and milestone values are hard-coded in `demo/index.html`.
- Existing modules and tests use UMD/CommonJS compatibility.
- No `package.json` or build step currently exists.

### Assumptions

- The user approves the parent specification and this plan before execution.
- Development-only npm tooling is acceptable because deployed runtime files
  remain dependency-free and unbundled.
- Original generated atmosphere assets can be produced with documented
  provenance and permitted project use.
- The acceptance phone, OS, browser, and orientation will be recorded at the
  Real-Device Gate.

### Explicit Unknowns and Stop Rules

- If the generated asset service does not return a valid local image, stop the
  asset task; do not substitute an uploaded unprovenanced image.
- If a schema cannot express a parent-spec invariant without changing that
  invariant, classify it as `Design Defect` and return to design review.
- If Stage 2 cannot meet all three frame thresholds after density reduction,
  stop before acceptance rather than weakening gameplay readability.
- If package import requires runtime network access, stop; the architecture is
  violated.

## Architecture Integrity Lens

- **Invariant:** gameplay truth has one owner; map packages project visuals only.
- **Canonical owners:** chapters own stage/checkpoint facts; rewards own
  arithmetic; `Game.rows` owns collision; game elements own protected visuals;
  package manifest/assets own map visual data; receipt owns runtime eligibility;
  external approvals own human authorization.
- **Responsibility overlap:** old inline water rendering, element draw methods,
  stage literals, and reward logic must not remain active after extraction.
- **Higher-level simplification:** all stage-specific runtime decisions flow
  through immutable chapter definitions and all environment drawing through one
  package renderer.
- **Retirement/falsifier:** if the new renderer mutates game state, if HTML keeps
  a second element renderer, or if runtime accepts a package without a matching
  receipt, stop and repair the owner boundary.
- **Verdict:** proceed with the file boundaries defined below.

## Plan Pressure Test

- **Owner / contract / retirement:** every new contract has one owner; old inline
  visual owners are deleted after parity verification.
- **Architecture integrity / higher-level path:** package validation and
  rendering are separated from orchestration; approvals stay outside runtime.
- **Verification scope:** policy, schema, hash, import, structural, browser,
  performance, accessibility, and real-device checks are all represented.
- **Task executability:** each task names exact files, tests, commands, expected
  failure, implementation contract, and commit boundary.
- **Pressure result:** `proceed` after user approves this plan.

## Plan-Time Complexity Check

- **Target files:** `demo/index.html` (1577 lines), new small owner modules,
  versioned schemas, governance scripts, browser tests.
- **Existing size / shape signals:** `demo/index.html` exceeds 800 lines and has
  mixed reasons to change.
- **Owner fit:** orchestration stays in HTML; policy, element drawing, package
  handling, and environmental rendering move to dedicated owners.
- **Add-in-place risk:** adding theme/reward logic inline would increase
  regression risk and preserve duplicate owners.
- **Better file boundary:** add focused owner files and delete corresponding
  inline implementations.
- **Recommendation:** `add owner file` plus `split task`; do not refactor input,
  audio, general collision, or unrelated UI.

## File Map

### Create

```text
package.json
package-lock.json
playwright.config.mjs
schemas/map-theme/map-design-brief-v1.schema.json
schemas/map-theme/provenance-v1.schema.json
schemas/map-theme/source-bundle-v1.schema.json
schemas/map-theme/admission-report-v1.schema.json
schemas/map-theme/element-inventory-v1.schema.json
schemas/map-theme/layer-plan-v1.schema.json
schemas/map-theme/semantic-map-v1.schema.json
schemas/map-theme/core-element-change-proposal-v1.schema.json
schemas/map-theme/visual-scorecard-v1.schema.json
schemas/map-theme/mapping-proposal-v1.schema.json
schemas/map-theme/mapping-approval-v1.schema.json
schemas/map-theme/map-theme-package-v1.schema.json
schemas/map-theme/review-evidence-v1.schema.json
schemas/map-theme/validation-report-v1.schema.json
schemas/map-theme/import-approval-v1.schema.json
schemas/map-theme/import-receipt-v1.schema.json
scripts/lib/map-theme-hash.mjs
scripts/lib/map-theme-schema.mjs
scripts/map-theme-validate.mjs
scripts/map-theme-import.mjs
scripts/map-theme-audit.mjs
scripts/map-theme-evidence.mjs
demo/src/chapters.js
demo/src/rewards.js
demo/src/game-elements.js
demo/src/map-theme.js
demo/src/map-theme-renderer.js
demo/maps/morning-mist/map-theme.json
demo/maps/morning-mist/assets/atmosphere.webp
demo/maps/morning-mist/import-receipt.json
demo/maps/storm-deep-lake/map-theme.json
demo/maps/storm-deep-lake/assets/atmosphere.webp
demo/maps/storm-deep-lake/import-receipt.json
demo/tests/chapters.test.cjs
demo/tests/rewards.test.cjs
demo/tests/game-elements.test.cjs
demo/tests/map-theme.test.cjs
demo/tests/map-theme-renderer.test.cjs
demo/tests/map-theme-governance.test.cjs
demo/tests/browser/lake-theme.spec.mjs
demo/tests/browser/performance.spec.mjs
map-theme-staging/morning-mist-v1/revisions/
map-theme-staging/storm-deep-lake-v1/revisions/
```

### Modify

```text
demo/index.html
demo/src/journey.js
demo/tests/journey.test.cjs
demo/tests/structure.test.cjs
README.md
WORK_PLAN.md
docs/aegis/INDEX.md
docs/aegis/baseline/2026-09-28-lake-theme-reward-baseline.md
```

### Do Not Modify

```text
index.html
demo/baseline-6376422/index.html
demo/src/input.js
```

## Gate Model

1. **Design Approval Gate:** user approves parent spec and this implementation plan.
2. **Schema Freeze Check:** agent-owned; all schema IDs, hashes, positive
   fixtures, and negative fixtures pass before validator/importer implementation.
3. **Visual Sample and Mapping Approval Gate:** user approves classified
   regions, generated clean plates, package layer plan, screenshots, visual
   scorecards, and exact `proposalHash`.
4. **Real-Device Gate:** user validates touch, readability, comfort, and perceived
   frame pacing on the recorded phone.
5. **Acceptance Freeze and Import Approval Gate:** user approves exact package,
   review-evidence, validation, and import-approval hashes before final import,
   deployment audit, and baseline freeze.

## Implementation Tasks

### Task 0: Freeze the approved documentation and create an isolated worktree

**Files**

- Stage only approved files under `docs/aegis/`.
- Do not stage `.DS_Store` or unprovenanced PNG references.
- Create sibling worktree
  `../frog-game-v2-lake-theme-reward` on
  `feature/v2-lake-theme-reward-sample`.

**Why**

Execution must start from a durable documentation authority and remain isolated
from the accepted V3.4 branch.

**Impact / Compatibility**

No runtime behavior changes. This task is blocked until the user explicitly
approves the spec, plan, and documentation commit.

**Verification**

```bash
git status --short
git log -1 --oneline
git worktree list
test -x /opt/homebrew/bin/cwebp
shasum -a 256 index.html demo/baseline-6376422/index.html
```

Expected: no `.DS_Store` staged; new worktree points at the approved docs commit;
both hashes equal `00a079...30bd`.

- [ ] Review the staged documentation diff and confirm the parent spec and this
  plan are the only intended documentation authority changes.
- [ ] Run the baseline hash command and record both complete hashes.
- [ ] Commit the approved docs with a new commit; never amend `6ad94b9`.
- [ ] Load `aegis:using-git-worktrees`, create the isolated worktree and branch
  from that new documentation commit, then rerun all 27 tests.
- [ ] Commit boundary: documentation commit only; no runtime files in this commit.

### Task 1: Add development-only test tooling and fixed commands

**Files**

- Create `package.json`, `package-lock.json`, `playwright.config.mjs`.

**Why**

The spec requires repeatable browser, performance, schema, and audit evidence
without adding runtime dependencies or a build step.

**Impact / Compatibility**

`npm` is development-only. `demo/` remains directly deployable as static files.

**Verification**

```bash
npm ci
npm run test:unit
npm run serve:demo -- --help
npx playwright --version
```

Expected: pinned Playwright `1.55.1`; unit script executes the existing 27 tests.

- [ ] Write `package.json` scripts:
  `test:unit`, `test:browser:preview`, `test:browser`,
  `audit:map-themes`, and `serve:demo`, with exact pinned dev dependencies
  listed in Tech Stack. `test:browser:preview` sets
  `MAP_THEME_MODE=preview`; the tests require exactly one `r0001-*` revision per
  theme and derive both preview roots from those directories.
- [ ] Run `npm install --package-lock-only`, then `npm ci`; verify no runtime
  dependency or build script exists.
- [ ] Create Playwright config with Chromium only, base URL
  `http://127.0.0.1:4173/demo/`, and web server
  `http-server . -p 4173 -c-1`.
- [ ] Run the existing Node suite through `npm run test:unit` and require 27/27.
- [ ] Commit message: `test(demo): add reproducible visual verification tooling`.

### Task 2: Freeze version-1 schemas and deterministic hash primitives

**Files**

- Create all files under `schemas/map-theme/`.
- Create `scripts/lib/map-theme-hash.mjs`,
  `scripts/lib/map-theme-schema.mjs`.
- Create `demo/tests/map-theme-governance.test.cjs`.

**Why**

Every package and approval decision must have one mechanical wire format and one
cross-platform hash result before import tooling exists.

**Impact / Compatibility**

No runtime code. The schema set must implement Sections 8.6-8.17 of the parent
spec without weakening unknown-field rejection or closed directory rules.

**Verification**

```bash
node --test demo/tests/map-theme-governance.test.cjs
node scripts/map-theme-audit.mjs --schemas-only
```

Expected RED before implementation: module or schema load failure. Expected
GREEN: all positive fixtures pass; each negative fixture fails for its named reason.

- [ ] Write failing tests for every schema `$id`, `additionalProperties: false`,
  required field, enum, numeric bound, normalized path, and protected ID.
- [ ] Add fixed hash vectors covering RFC 8785, UTF-8, NUL/newline delimiters,
  source-bundle roles, asset path sorting, extra files, symlinks, and nested
  real directories; run tests and record RED.
- [ ] Implement `canonicalJsonHash`, `sourceBundleHash`, `packageContentHash`,
  recursive closed-directory inspection, and schema loading exactly as specified.
- [ ] Run the governance test and schema-only audit; record all schema IDs,
  complete SHA-256 values, positive fixtures, and negative fixtures as the
  Schema Freeze Check evidence.
- [ ] Commit message: `feat(map-theme): freeze package governance schemas`.

### Task 3: Extract immutable chapter and checkpoint configuration

**Files**

- Create `demo/src/chapters.js`.
- Create `demo/tests/chapters.test.cjs`.
- Modify `demo/src/journey.js`, `demo/tests/journey.test.cjs`.

**Why**

Stage ranges, themes, transition weights, checkpoint IDs, and rewards must stop
being repeated literals in orchestration code.

**Impact / Compatibility**

`FrogJourney` keeps milestone calculation only. It receives
`FrogChapters.getJourneyOptions()` and must preserve existing outputs at rows
11, 12, 23, and 24.

**Verification**

```bash
node --test demo/tests/chapters.test.cjs demo/tests/journey.test.cjs
```

Expected RED: missing `FrogChapters`. Expected GREEN: exact immutable definitions,
weights, checkpoint lookups, and unchanged journey events.

- [ ] Write failing tests for stage ranges, row 12/24 ownership, exact blend
  weights, checkpoint IDs, reward constants, immutable returned data, and
  out-of-range lookups.
- [ ] Run the two test files and capture the expected missing-module RED.
- [ ] Implement UMD/CommonJS `FrogChapters` with
  `getJourneyOptions`, `getStage`, `getStageForRow`,
  `getCheckpointForRow`, and `getThemeMixForRow`.
- [ ] Update journey tests to construct from `getJourneyOptions()` and require
  existing milestone behavior; run both files GREEN.
- [ ] Commit message: `feat(demo): centralize chapter and checkpoint contracts`.

### Task 4: Implement pure, idempotent reward settlement

**Files**

- Create `demo/src/rewards.js`.
- Create `demo/tests/rewards.test.cjs`.

**Why**

Golden-lotus arithmetic and replay protection must be testable without DOM,
Canvas, sound, timers, or mutation.

**Impact / Compatibility**

No runtime integration yet. Stage 1 is capped at five bombs; Stage 2 uses a
virtual uncapped bomb and consumes actual resources after conversion.

**Verification**

```bash
node --test demo/tests/rewards.test.cjs
```

Expected: exact formulas, invalid input rejection, non-mutation, and duplicate
checkpoint no-op all pass.

- [ ] Write failing tests for Stage 1 normal/full inventory, Stage 2 zero/nonzero
  inventory, the constant 280-point lotus contribution, and exact breakdown.
- [ ] Add negative, fractional, unsafe-integer, unknown checkpoint, mismatched
  stage, duplicate ID, and input-mutation tests; run RED.
- [ ] Implement UMD/CommonJS `FrogRewards.settleCheckpoint(input, chapter)`
  returning the exact result shape from the spec.
- [ ] Run reward tests GREEN and mutate one expected constant to prove the
  formula tests fail, then restore and rerun GREEN.
- [ ] Commit message: `feat(demo): add golden lotus reward policy`.

### Task 5: Extract the protected canonical element registry

**Files**

- Create `demo/src/game-elements.js`.
- Create `demo/tests/game-elements.test.cjs`.
- Modify `demo/index.html` only after parity tests exist.

**Why**

Packages must reference one protected element library; map-specific code cannot
redraw gameplay meaning.

**Impact / Compatibility**

Move existing frog, normal/sinking pad, crocodile/wake, flower, bomb, and jump
preview drawing without changing dimensions, collision, colors, or animation.
Add golden-lotus `collectible` and `landmark` variants.

**Verification**

```bash
node --test demo/tests/game-elements.test.cjs demo/tests/structure.test.cjs
```

Expected: exact ID/variant registry; draw calls execute on a recording context;
inline duplicate draw owners are absent after integration.

- [ ] Write failing registry tests for every version-1 protected ID and allowed
  variant, unknown ID/variant rejection, and immutable definitions.
- [ ] Add recording-context parity assertions for operation order and stable
  geometry of existing elements; run RED.
- [ ] Implement UMD/CommonJS registry and draw functions; add golden-lotus
  variants with no collision or policy methods.
- [ ] Replace inline draw calls in `demo/index.html`, delete the moved methods,
  and run registry plus structural tests GREEN.
- [ ] Commit message: `refactor(demo): centralize canonical game elements`.

**Repair Track**

- Root cause: protected visuals currently have no independent canonical owner.
- Repair: one versioned registry with stable IDs and variants.
- Compatibility: preserve current draw geometry and runtime state ownership.

**Retirement Track**

- Old owner: inline `drawLilyPad`, `drawLotusFlower`, `drawBombItem`,
  `drawCrocodile`, `drawFrog`, and jump-preview drawing.
- Action: delete after recording-context and browser parity.
- No compatibility copy is retained.

### Task 6: Implement package validation, import, and deployment audit

**Files**

- Create `scripts/map-theme-validate.mjs`.
- Create `scripts/map-theme-import.mjs`.
- Create `scripts/map-theme-audit.mjs`.
- Create `scripts/map-theme-evidence.mjs`.
- Extend `demo/tests/map-theme-governance.test.cjs`.

**Why**

Only exact approved bytes may reach `demo/maps/`, and static runtime receipts
must remain reproducible from repository evidence.

**Impact / Compatibility**

Scripts operate only on explicit revision paths. Validator inputs are read-only;
importer refuses overwrite; audit never writes.
`map-theme-validate.mjs submission` validates already-authored intake artifacts,
hashes, hard-gate evidence, scores, inventory/mask completeness, and eligibility;
it does not perform image recognition, classification, or proposal generation.
`map-theme-validate.mjs check-build` validates package schema, approved mapping,
assets, protection, and budget without emitting the final report.
`map-theme-validate.mjs validate` requires closed review evidence and emits one
final package validation report, while `map-theme-validate.mjs budget` totals
staged asset bytes across the explicit revision roots.
`map-theme-evidence.mjs` deterministically renders overlays, viewport previews,
diffs, and the closed review-evidence index from manually authored proposal
data. Its `approve-import` subcommand only materializes an approval after the
executor records explicit user authorization for the exact printed hashes.
`compose-intake` creates source composite/semantic overlays before revision
hashing; `render-proposal` creates derived proposal previews/diffs only after
the immutable revision exists.

**Verification**

```bash
node --test demo/tests/map-theme-governance.test.cjs
node scripts/map-theme-validate.mjs submission demo/tests/fixtures/map-theme/valid
node scripts/map-theme-audit.mjs --root . --staging-fixture demo/tests/fixtures/map-theme/valid
```

Expected: valid fixture passes; missing approval, changed asset, extra file,
symlink, changed report, unaccepted deviation, forged receipt, and existing
destination all fail closed.

- [ ] Write failing end-to-end fixture tests for every governance schema, the
  submission validator, all ten chain predicates, evidence rendering, and
  byte-identical archived/runtime receipt behavior.
- [ ] Run tests RED against missing scripts.
- [ ] Implement submission/package validation, deterministic evidence rendering,
  importer temporary copy/atomic rename, receipt creation, and read-only audit
  using shared schema/hash libraries.
- [ ] Run GREEN; run each negative fixture and assert nonzero exit plus unchanged
  destination directory.
- [ ] Commit message: `feat(map-theme): enforce approved package import chain`.

### Task 7: Implement runtime package loading and eligibility checks

**Files**

- Create `demo/src/map-theme.js`.
- Create `demo/tests/map-theme.test.cjs`.

**Why**

Runtime needs an immutable, fail-closed package reader that separates visual data
from receipt-qualified eligibility.

**Impact / Compatibility**

The browser loader may fetch only local relative JSON/assets. Invalid packages
return the neutral procedural fallback and one diagnostic; they never block play.
Production mode reads only `demo/maps/` and requires a receipt. Explicit
`?morningThemePreviewRoot=` and `?stormThemePreviewRoot=` mode may read the two
same-origin staged `build/` directories without receipts for test and
real-device review; it rejects missing pairs, absolute URLs, cross-origin URLs,
traversal, and any path outside `map-theme-staging/`.

**Verification**

```bash
node --test demo/tests/map-theme.test.cjs
```

Expected: exact package/receipt predicates pass; remote paths, traversal,
protected overrides, mismatched IDs/revision/hash, and unknown fields fail.

- [ ] Write failing tests for manifest normalization, frozen return values,
  protected registry resolution, local asset containment, and runtime receipt predicates.
- [ ] Run RED against missing `FrogMapTheme`.
- [ ] Implement UMD/CommonJS pure validation/normalization plus async browser
  loading; inject fetch and hash functions for tests.
- [ ] Run GREEN and verify preview mode accepts a staged valid package without
  receipt while production mode rejects it; verify preview root containment and
  that the parameter has no effect when absent.
- [ ] Commit message: `feat(demo): add receipt-qualified map theme loading`.

### Task 8: Create original source bundles and mapping proposals

**Files**

- Create temporary input files under
  `map-theme-staging/morning-mist-v1/intake-r0001/` and
  `map-theme-staging/storm-deep-lake-v1/intake-r0001/`.
- Create one immutable
  `r0001-${SOURCE_BUNDLE_HASH:0:12}-${BRIEF_HASH:0:12}` revision per request
  through `map-theme-evidence.mjs init`; the script prints the exact resulting
  path and deletes the temporary intake only after byte verification.
- Each revision contains exact source, analysis, and proposal paths defined in
  the parent specification; no files are written to `demo/maps/`.
- Use generated files only; do not copy
  `design-previews/map-1-modified.png` or `map-2-deep-lake.png`.

Required outputs inside each revision:

```text
source/source-bundle.json
source/map-design-brief.json
source/provenance.json
source/files/clean-environment-plate.png
source/files/composite-preview.png
source/files/semantic-overlay.png
analysis/admission-report.json
analysis/element-inventory.json
analysis/semantic-mask.png
proposal/mapping-proposal.json
proposal/layer-plan.json
proposal/semantic-map.json
proposal/diff-report.md
proposal/preview-390x844.png
proposal/preview-480x900.png
proposal/visual-scorecard.json
```

**Why**

The two runtime themes must exercise the same intake standard future maps will use.

**Impact / Compatibility**

This task stops before package build. It creates review evidence only and cannot
write to `demo/maps/`.

**Verification**

```bash
node scripts/map-theme-evidence.mjs compose-intake \
  --intake map-theme-staging/morning-mist-v1/intake-r0001
node scripts/map-theme-evidence.mjs compose-intake \
  --intake map-theme-staging/storm-deep-lake-v1/intake-r0001
node scripts/map-theme-evidence.mjs init \
  --request morning-mist-v1 --sequence 1 \
  --intake map-theme-staging/morning-mist-v1/intake-r0001
node scripts/map-theme-evidence.mjs init \
  --request storm-deep-lake-v1 --sequence 1 \
  --intake map-theme-staging/storm-deep-lake-v1/intake-r0001
MORNING_REVISION="$(find map-theme-staging/morning-mist-v1/revisions \
  -mindepth 1 -maxdepth 1 -type d -name 'r0001-*' -print -quit)"
STORM_REVISION="$(find map-theme-staging/storm-deep-lake-v1/revisions \
  -mindepth 1 -maxdepth 1 -type d -name 'r0001-*' -print -quit)"
test -n "$MORNING_REVISION" && test -n "$STORM_REVISION"
node scripts/map-theme-evidence.mjs render-proposal --revision "$MORNING_REVISION"
node scripts/map-theme-evidence.mjs render-proposal --revision "$STORM_REVISION"
node scripts/map-theme-validate.mjs submission "$MORNING_REVISION"
node scripts/map-theme-validate.mjs submission "$STORM_REVISION"
```

Expected: both classify as `IMPORT_CANDIDATE`, score at least 85, have no category
below 60%, and contain no `UNRESOLVED` pixels or protected-element source pixels.

- [ ] Create each intake directory with exactly
  `map-design-brief.json`, `provenance.json`, `files/clean-environment-plate.png`,
  and manually authored `analysis/element-inventory.json`,
  `proposal/layer-plan.json`, `proposal/semantic-map.json`, and
  `proposal/mapping-proposal.json`.
- [ ] Generate both plates through
  `https://copilot-cn.bytedance.net/api/ide/v1/tool_text_to_image` with
  `image_size=landscape_16_9`. Morning prompt:
  `Original Frog Game V2 environment clean plate, top-down near-orthographic shallow blue-green lotus pond at early morning, broad calm horizontal ripples, low translucent mist, sparse buds and edge vegetation, bright natural ambient light, clear central gameplay corridor, empty HUD and touch-control safe zones, layered background suitable for parallax, no frog, no lily pads, no crocodiles, no rewards, no bombs, no UI, no text, no logos, no warning symbols, no implied collision or traversable objects, realistic polished mobile game background.`
  Storm prompt:
  `Original Frog Game V2 environment clean plate, top-down near-orthographic deep teal reed lake during a storm, diagonal wind-driven waves, restrained rain, distant soft lightning, edge reeds, driftwood, bubbles and aquatic plant shadows, clear central gameplay corridor, empty HUD and touch-control safe zones, layered background suitable for parallax, no frog, no lily pads, no crocodiles, no rewards, no bombs, no UI, no text, no logos, no red warnings, no jaws or eyes, no implied collision or traversable objects, realistic polished mobile game background.`
- [ ] Save raw PNG outputs under each intake `files/`, record endpoint, prompt,
  method, allowed use, and SHA-256 in provenance, then run `compose-intake`
  before `init`; verify `init` hashes the completed clean plate, composite, and
  semantic overlay without an extra unlisted source file.
- [ ] Run `render-proposal` and `submission`; reject watermarks, protected
  elements, false hazards, any score below threshold, or non-empty `UNRESOLVED`.
- [ ] Inspect the generated semantic overlays, inventory completeness, visual
  diffs, `390x844`/`480x900` previews, and scorecards, then stop at the
  **Visual Sample and Mapping Approval Gate**. No package build or commit occurs
  until the user approves exact proposal hashes.

### Task 9: Build the two approved staged package candidates

**Files**

- Populate each approved revision's `approval/mapping-approval.json` and
  `build/` directories.
- Do not create `approval/import-approval.json`, `import/`, or `demo/maps/` in
  this task.

**Why**

Staged package candidates must be derived from exact approved proposals and pass
schema, asset, ownership, and budget prechecks before renderer integration.

**Impact / Compatibility**

Only map-specific non-interactive visual pixels enter staged build assets.
Canonical overlays are discarded. Preview mode reads these staged builds
directly and cannot confer production eligibility.

**Verification**

```bash
MORNING_REVISION="$(find map-theme-staging/morning-mist-v1/revisions \
  -mindepth 1 -maxdepth 1 -type d -name 'r0001-*' -print -quit)"
STORM_REVISION="$(find map-theme-staging/storm-deep-lake-v1/revisions \
  -mindepth 1 -maxdepth 1 -type d -name 'r0001-*' -print -quit)"
test -n "$MORNING_REVISION" && test -n "$STORM_REVISION"
node scripts/map-theme-validate.mjs check-build "$MORNING_REVISION"
node scripts/map-theme-validate.mjs check-build "$STORM_REVISION"
test ! -e "$MORNING_REVISION/validation/validation-report.json"
test ! -e "$STORM_REVISION/validation/validation-report.json"
test ! -e demo/maps/morning-mist
test ! -e demo/maps/storm-deep-lake
```

Expected: both staged builds pass precheck; combined assets `<= 409600` bytes;
no final validation report, runtime package, import approval, or receipt exists.

- [ ] Build manifest/assets from approved `KEEP_BACKGROUND` and
  `REBUILD_BACKGROUND` regions only; encode each approved clean plate with
  `/opt/homebrew/bin/cwebp -q 82 -resize 960 512
  "$REVISION/source/files/clean-environment-plate.png" -o
  "$REVISION/build/assets/atmosphere.webp"` for each explicit revision path.
- [ ] Run `check-build` and resolve any mapping, schema, asset, or budget defect
  by creating a new revision rather than overwriting approved evidence.
- [ ] Assert final `validate` refuses to emit a report before review evidence
  exists and importer fails for missing validation/import approval while
  leaving `demo/maps/` unchanged.
- [ ] Record candidate package hashes for browser preview; do not create final
  review evidence, validation report, or import approval.
- [ ] Commit message: `feat(map-theme): stage approved lake theme packages`.

### Task 10: Implement the deterministic environmental renderer

**Files**

- Create `demo/src/map-theme-renderer.js`.
- Create `demo/tests/map-theme-renderer.test.cjs`.
- Modify `demo/index.html`.

**Why**

Stage identity, transition, ambience, and fallback require one cosmetic owner
that cannot affect collision or game state.

**Impact / Compatibility**

Renderer inputs are package data, visible world rows, viewport, clock, and
exclusion geometry. It cannot receive mutable `Game` or call `Math.random()`.

**Verification**

```bash
node --test demo/tests/map-theme-renderer.test.cjs demo/tests/structure.test.cjs
```

Expected: exact theme weights, stable row/slot decorations, DPR/rain/decoration
caps, reduced motion, draw order, exclusion geometry, and neutral fallback pass.

- [ ] Write failing tests for pure theme resolution, row-based blend, stable
  hashing, no `Math.random()`, limits, reduced motion, and maximum-density exclusions.
- [ ] Run RED against missing renderer.
- [ ] Implement UMD/CommonJS renderer with reusable buffers, `drawBackground`,
  `drawLandmarkBackdrop`, and `drawForegroundWeather`.
- [ ] Load new scripts in dependency order and replace the old inline water/wave
  block with one renderer call; run tests GREEN.
- [ ] Commit message: `feat(demo): render package-driven lake environments`.

**Retirement Track**

- Old owner: inline `#1b4965` fill and global procedural wave loop.
- Action: delete after fallback and screenshot comparison.
- Retained boundary: procedural fallback exists only inside the new renderer.

### Task 11: Generate safe checkpoint rows and suppress random hazards

**Files**

- Modify `demo/index.html`.
- Extend `demo/tests/chapters.test.cjs`, `demo/tests/structure.test.cjs`.

**Why**

The player must always have a safe route to one visible checkpoint lotus without
random items, sinking pads, or crocodiles.

**Impact / Compatibility**

Normal random rows remain unchanged. Rows 11/23 and 12/24 become
chapter-configured special rows.

**Verification**

```bash
node --test demo/tests/chapters.test.cjs demo/tests/structure.test.cjs
```

Expected: approach rows have seven stable pads; checkpoint rows have only column
3 stable pad and golden lotus; no random hazards/items spawn there.

- [ ] Write failing row-fixture tests for exact approach/checkpoint structures,
  safe horizontal movement, and vertical reachability.
- [ ] Run RED against current random generation.
- [ ] Route `generateRow` through chapter checkpoint lookup before random
  generation and suppress crocodiles for special rows.
- [ ] Run GREEN and verify ordinary rows still satisfy existing generation shape.
- [ ] Commit message: `feat(demo): add safe golden lotus checkpoint rows`.

### Task 12: Integrate atomic checkpoint settlement and completion state

**Files**

- Modify `demo/index.html`.
- Extend `demo/tests/rewards.test.cjs`, `demo/tests/journey.test.cjs`,
  `demo/tests/structure.test.cjs`.

**Why**

Lotus consumption, reward, claimed ID, and journey update must either all commit
or all remain unchanged.

**Impact / Compatibility**

Add `claimedCheckpointIds`, `completionSettlement`, `rewardPresentation`,
`environmentClock`, and `COMPLETING`. Normal item collection and deaths remain
unchanged.

**Verification**

```bash
node --test demo/tests/rewards.test.cjs demo/tests/journey.test.cjs demo/tests/structure.test.cjs
```

Expected: duplicate claims no-op; invalid reward/journey output preserves lotus
and state; Stage 1 continues; Stage 2 settles before high score and rank.

- [ ] Write failing integration-structure tests for transaction order, rollback,
  reset state, timer/input stop, and 700 ms completion transition.
- [ ] Run RED against current `onFrogLanded`, `updateJourneyProgress`, and `gameOver`.
- [ ] Implement `commitCheckpoint`, validate reward plus journey outputs before
  mutation, and add `COMPLETING` handling.
- [ ] Delete the hard-coded Stage 2 text owner, consume buffered input only after
  successful nonfinal settlement, and run GREEN.
- [ ] Commit message: `feat(demo): settle checkpoint rewards atomically`.

### Task 13: Add golden-lotus, HUD, and result presentation

**Files**

- Modify `demo/index.html`, `demo/src/game-elements.js`.
- Extend browser and fake-clock tests.

**Why**

Players must see what they earned without a modal interruption at Stage 1, and
must understand final resource conversion at Stage 2.

**Impact / Compatibility**

Controls do not move or resize. Reduced motion shortens token travel and disables
lightning while preserving arithmetic.

**Verification**

```bash
node --test demo/tests/*.test.cjs
npm run test:browser:preview -- demo/tests/browser/lake-theme.spec.mjs
```

Expected: 220 ms bloom, truthful `+1` versus `炸弹已满`, visible `+8s`, exact
result breakdown, 700 ms completion, no duplicate presentation.

- [ ] Write failing fake-clock and browser assertions for bloom, token targets,
  HUD pulse, bomb-cap text, final breakdown, and reduced motion.
- [ ] Run RED against current UI.
- [ ] Implement reward presentation state, bloom/ring/token drawing, HUD pulse
  classes, and one concise result breakdown element.
- [ ] Run unit and browser tests GREEN at `390x844` and `480x900`; assert controls
  retain stable boxes.
- [ ] Commit message: `feat(demo): present golden lotus rewards and settlement`.

### Task 14: Run visual, performance, payload, and regression verification

**Files**

- Complete `demo/tests/browser/lake-theme.spec.mjs`.
- Complete `demo/tests/browser/performance.spec.mjs`.
- Populate each approved revision's `review/` and `validation/` directories from
  exact browser outputs.

**Why**

The staged visual feature can proceed to real-device review only with
quantitative evidence.

**Impact / Compatibility**

Tests run the integrated game in explicit staged preview mode. No runtime package
is imported and no gameplay change belongs in this task.

**Verification**

```bash
MORNING_REVISION="$(find map-theme-staging/morning-mist-v1/revisions \
  -mindepth 1 -maxdepth 1 -type d -name 'r0001-*' -print -quit)"
STORM_REVISION="$(find map-theme-staging/storm-deep-lake-v1/revisions \
  -mindepth 1 -maxdepth 1 -type d -name 'r0001-*' -print -quit)"
export MORNING_THEME_PREVIEW_ROOT="/$MORNING_REVISION/build"
export STORM_THEME_PREVIEW_ROOT="/$STORM_REVISION/build"
npm run test:unit
npm run test:browser:preview
node scripts/map-theme-validate.mjs budget \
  map-theme-staging/morning-mist-v1/revisions \
  map-theme-staging/storm-deep-lake-v1/revisions
node scripts/map-theme-evidence.mjs finalize-review \
  --revision "$MORNING_REVISION" --results test-results
node scripts/map-theme-evidence.mjs finalize-review \
  --revision "$STORM_REVISION" --results test-results
node scripts/map-theme-validate.mjs validate "$MORNING_REVISION"
node scripts/map-theme-validate.mjs validate "$STORM_REVISION"
shasum -a 256 index.html demo/baseline-6376422/index.html
```

Browser script must print explicit PASS/FAIL for:

```text
nonblank canvas
stage screenshots
transition rows
gold checkpoint pixel cluster
exact reward DOM values
duplicate claim rejection
console errors
cross-origin requests
request count and transfer bytes
three performance samples
responsive control overlap
```

- [ ] Capture desktop/mobile screenshots, assert Stage 2 luminance is at least
  15% lower than Stage 1 plus exact blend progression, and run three 10-second
  Stage 2 samples at `390x844`, DPR 2 with median `<=18 ms` and p95 `<=25 ms`
  in every run.
- [ ] Assert preview cold-cache transfer `<=550 KiB`, requests `<=12`, and
  cross-origin requests `0`; retain the measurement for production confirmation.
- [ ] Finalize the closed review-evidence indexes from raw screenshots/reports,
  emit both validation reports, and record exact package, review-evidence, and
  validation hashes for the final approval gate.
- [ ] Run the full unit/preview-browser/hash matrix and retain raw output and
  screenshots as pre-import acceptance evidence.
- [ ] Commit message: `test(demo): verify lake themes and reward experience`.

### Task 15: Real-device acceptance, documentation sync, and freeze

**Files**

- Modify `README.md`.
- Modify `WORK_PLAN.md`.
- Create
  `docs/aegis/baseline/2026-09-28-lake-theme-reward-baseline.md`.
- Update `docs/aegis/INDEX.md`.
- Create or amend an ADR only if the implementation proves the planned canonical
  owner changes and the ADR Backfill Check says `create` or `amend`.

**Why**

Automated evidence cannot replace touch comfort, weather comfort, visual
readability, or the final user freeze decision.

**Impact / Compatibility**

Real-device review uses the same integrated runtime in explicit staged preview
mode. Only after that review does the user authorize import. Production
verification then runs against `demo/maps/`; any post-import failure starts a
new reviewed repair revision rather than mutating approved evidence.

**Verification**

```bash
MORNING_REVISION="$(find map-theme-staging/morning-mist-v1/revisions \
  -mindepth 1 -maxdepth 1 -type d -name 'r0001-*' -print -quit)"
STORM_REVISION="$(find map-theme-staging/storm-deep-lake-v1/revisions \
  -mindepth 1 -maxdepth 1 -type d -name 'r0001-*' -print -quit)"
test -f "$MORNING_REVISION/approval/import-approval.json"
test -f "$STORM_REVISION/approval/import-approval.json"
node scripts/map-theme-import.mjs "$MORNING_REVISION" --destination demo/maps
node scripts/map-theme-import.mjs "$STORM_REVISION" --destination demo/maps
npm run test:unit
npm run test:browser
npm run audit:map-themes
shasum -a 256 index.html demo/baseline-6376422/index.html
git status --short
git log --oneline --decorate -12
```

Expected: both imports and the complete audit pass; production browser tests pass
from the exact deployed commit; both baseline hashes remain fixed; no `.DS_Store`
is staged.

- [ ] Start `npm run serve:demo -- -a 0.0.0.0`, derive `LAN_IP` with
  `ipconfig getifaddr en0 || ipconfig getifaddr en1`, and provide the phone URL
  `/demo/?morningThemePreviewRoot=${MORNING_THEME_PREVIEW_ROOT}&stormThemePreviewRoot=${STORM_THEME_PREVIEW_ROOT}`
  using the exported roots from Task 14.
  If the phone cannot reach the LAN URL, stop and request explicit approval for
  a temporary public tunnel; do not install or publish through an unapproved service.
- [ ] Stop at the **Real-Device Gate** for touch, portrait/landscape readability,
  rain/lightning comfort, reward timing, and perceived frame pacing using the
  staged preview packages.
- [ ] If accepted, stop at the **Acceptance Freeze and Import Approval Gate**.
  After explicit approval, run
  `map-theme-evidence.mjs approve-import` for each revision to materialize the
  exact package, mapping, review-evidence, validation, deviation, reviewer, and
  timestamp fields; then run both importer commands.
- [ ] Run audit, production unit/browser/payload/hash verification; update
  README with measured transfer values and remove obsolete `<50KB`, single-file,
  charge-button, and spacebar claims. Deploy only after explicit push/deploy
  instruction and record commit SHA, Pages run, browser version, and package hashes.
- [ ] Run `verification-before-completion`, architecture alignment, ADR backfill,
  retirement closure, and baseline-sync checks; update `WORK_PLAN.md`, baseline,
  and Aegis index, then commit acceptance documentation separately. Do not push,
  merge, or create a PR without explicit user instruction.

## Spec Coverage Matrix

| Spec area | Implemented by | Primary evidence |
|---|---|---|
| Chapter/checkpoint facts | Tasks 3, 11 | chapter and structure tests |
| Reward arithmetic/idempotency | Tasks 4, 12 | reward and transaction tests |
| Canonical element protection | Tasks 5, 7 | registry and package tests |
| Package schema/hash/approval | Tasks 2, 6 | schema fixtures and audit |
| Static design intake | Tasks 8, 9 | submission validation, proposals, approvals |
| Environment renderer/blend | Task 10 | renderer and browser tests |
| Golden-lotus feedback | Task 13 | fake-clock and browser tests |
| Performance/payload/accessibility | Task 14 | Playwright evidence |
| Real-device and freeze | Task 15 | human evidence and baseline docs |

## Risks and Controls

| Risk | Control | Stop condition |
|---|---|---|
| Input regression from HTML edits | do not modify `input.js`; run all input tests every task | any accepted input test fails |
| Duplicate gameplay owner in renderer | renderer API excludes mutable `Game`; structural tests ban mutations | renderer changes score/collision/state |
| Forged or stale package evidence | deterministic hashes, importer, closed directories, audit | any chain predicate cannot be proven |
| Unlicensed visual source | generated original clean plates plus provenance | rights or source method unknown |
| False hazard/target cues | protected IDs, classification, exclusion geometry, human scorecard | reviewer score below 4 |
| Mobile frame regression | caps, reusable buffers, three-sample benchmark | any run exceeds threshold |
| Payload regression | 400 KiB asset and 550 KiB initial-transfer budgets | either budget exceeded |
| Single-file complexity growth | extract owners before integration | new policy/drawing owner remains inline |
| V4 scope creep | no seeded gameplay or replay changes | implementation touches deterministic gameplay roadmap |

## Rollback

- Before package import, delete only the isolated worktree/branch if the user
  explicitly chooses to discard it; accepted branch remains untouched.
- During implementation, revert by whole commit boundaries, never by restoring
  unrelated user changes.
- A failed environment layer falls back through
  `map-theme-renderer.js` neutral water without affecting gameplay.
- A failed reward/checkpoint integration rolls back to the last task commit;
  no partial package import is retained.
- Importer overwrite refusal keeps an already imported package unchanged.
- Final known-good runtime baseline remains `b232582` until the new acceptance
  freeze is explicitly approved.

## Retirement

### Repair Track

- Repaired objects: stage facts, reward arithmetic, canonical element ownership,
  package eligibility, and environment rendering.
- Action: move each responsibility to its declared owner and integrate through
  `demo/index.html`.
- Impact: lower mixed responsibility in the 1577-line shell and independently
  testable contracts.
- Verification: owner-specific tests plus structural zero-duplicate assertions.

### Retirement Track

- Retire the inline water fill/wave block.
- Retire inline canonical draw methods after parity.
- Retire hard-coded Stage 2 text and milestone constants.
- Retire README claims of `<50KB`, single-file runtime, charge button, and spacebar charging.
- Do not retain compatibility wrappers: no external dependency evidence exists.
- Retirement completes only when repository search finds zero active production
  references and browser fallback behavior passes.

## Commit Sequence

1. Documentation authority and plan.
2. Development-only test tooling.
3. Governance schemas and hash primitives.
4. Chapter/checkpoint contracts.
5. Reward policy.
6. Canonical element registry.
7. Validator/importer/audit.
8. Runtime package loader.
9. Approved packages.
10. Environmental renderer.
11. Checkpoint generation.
12. Atomic settlement.
13. Reward presentation.
14. Verification and truthful README.
15. Acceptance documentation and frozen baseline.

Every commit must pass its named focused tests plus
`node --test demo/tests/*.test.cjs`. Hooks may not be bypassed and commits may
not be amended unless the user explicitly requests it.

## Final Stop Condition

Stop with status `Needs Verification` unless all automated checks pass and both
post-implementation human gates are recorded. Mark the workstream
`Accepted / Frozen` only after:

1. exact imported package and approval hashes are recorded;
2. GitHub Pages serves the audited package bytes;
3. real-device acceptance passes;
4. the final regression matrix passes from the deployed commit;
5. the user explicitly approves the new freeze baseline.
