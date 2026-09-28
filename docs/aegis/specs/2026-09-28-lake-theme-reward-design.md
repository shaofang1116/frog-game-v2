# Lake Theme, Golden Lotus Reward, and MapThemePackage Design

Date: `2026-09-28`
Status: `Draft for user review`
ArchitectureReviewRequired: `yes`
Source branch: `feature/v2-journey-input-demo` at `6ad94b9`
Planned isolated branch: `feature/v2-lake-theme-reward-sample`
Frozen input baseline: `b232582`

## 1. Executive Summary

This design adds two visually distinct lake stages and a golden-lotus checkpoint
reward to the existing continuous two-stage journey.

- Stage 1 becomes a morning-mist shallow pond.
- Stage 2 becomes a stormy deep reed lake.
- Rows 10-12 form a three-row environmental blend.
- Each stage ends on one safe checkpoint pad carrying a golden lotus.
- Stage 1 grants `+150 score`, `+8 seconds`, and `+1 bomb` capped at five.
- Stage 2 completes the run using:

```text
finalScore =
  scoreBeforeSettlement
  + 150
  + (timeLeft + 8) * 10
  + (bombs + 1) * 50
```

The implementation remains native HTML/CSS/JavaScript, statically deployable,
and compatible with the frozen V3.4 input behavior. The design extracts stage
configuration, reward policy, and lake rendering from the 1577-line
`demo/index.html` instead of adding another large inline subsystem.

Both stage themes are expressed as validated `MapThemePackage` data. This
document is the single authority for the package architecture and the static
map-design intake, authoring, approval, validation, and import standard. Static
reference images never become runtime maps directly: they pass through
read-only analysis, semantic classification, explicit approval, package
validation, and preview comparison.

## 2. Task Intent

### 2.1 Outcome

Deliver a high-fidelity playable sample in which stage identity, progression,
and reward value are immediately legible without modal interruption.

### 2.2 Success Evidence

1. Stage 1 and Stage 2 are visually distinguishable in still screenshots.
2. The three-row blend has no abrupt full-screen theme switch.
3. Each checkpoint is reachable, safe, visible before collection, and claimed once.
4. Reward arithmetic passes isolated Node tests, including caps and replayed events.
5. Existing input, journey, baseline-hash, and static-deployment tests still pass.
6. Browser checks show no console errors, blank Canvas, control overlap, or false hazards.
7. A real mobile device confirms readability, frame pacing, touch behavior, and reward feedback.

### 2.3 Stop Condition

The workstream stops after automated checks, browser evidence, mobile acceptance,
documentation update, and an explicit final freeze decision. It does not proceed
into V4 deterministic replay or a third stage.

### 2.4 Non-goals

- No root `index.html` changes.
- No collision-box changes.
- No new core hazard, tutorial modal, or stage.
- No redesign of accepted D-Pad or Canvas swipe charging.
- No framework, bundler, TypeScript, Phaser, or PixiJS migration.
- No persistence or replay schema.
- No direct use of the uploaded concept images as runtime backgrounds.
- No stage-specific recoloring of normal or sinking lily pads in this batch.
- No general-purpose image-analysis management UI in this batch. This document
  defines the required management contract, while the batch implements only the
  runtime `MapThemePackage` contract, governance schemas, validator, importer,
  deployment audit, and two conforming packages.

## 3. Baseline Read Set

| Authority | Role |
|---|---|
| `WORK_PLAN.md` | phase boundaries, frozen V3.4 behavior, execution protocol |
| `README.md` | native Canvas, static deployment, no runtime CDN |
| `demo/index.html` | current runtime, map generation, rendering, settlement |
| `demo/src/input.js` | canonical input behavior |
| `demo/src/journey.js` | canonical journey milestone behavior |
| `demo/tests/*.test.cjs` | accepted automated contracts |
| `design-previews/lake-theme-concepts.html` | visual exploration only |
| `design-previews/map-1-modified.png` | Stage 1 review evidence only |
| `design-previews/map-2-deep-lake.png` | Stage 2 review evidence only |

The uploaded `晨雾分流荷塘.jpg` and `暴雨深湖险道.jpg` informed earlier visual
discussion, but project-recorded provenance and usage rights are absent. They
are not ingestion inputs, are not copied or segmented, and do not supply runtime
pixels. The approved textual art direction is the source for newly generated,
original, gameplay-readable, locally hosted assets with recorded provenance.

## 4. Impact Statement

### 4.1 Affected Layers

- Stage and checkpoint configuration.
- Milestone row generation.
- Reward settlement and completion scoring.
- Canvas background and environmental rendering.
- Map-theme package validation and runtime loading.
- Transient reward presentation and HUD feedback.
- Completion-state sequencing.
- Node tests, browser tests, mobile acceptance, and project documentation.

### 4.2 Preserved Invariants

- One continuous world coordinate system using absolute `gridY`.
- Score, time, bombs, and all run state survive the Stage 1 transition.
- Input modules remain the only owners of gesture interpretation.
- `Game.rows` remains collision truth.
- Rendering never mutates gameplay state.
- A map-theme package cannot redefine canonical gameplay elements or rules.
- Cosmetic failure never blocks gameplay.
- Root and frozen-baseline SHA-256 values remain unchanged.

## 5. Product Risk Lens

- **Value:** stronger achievement feedback and clear stage identity without
  interrupting the run.
- **Non-goals:** no new mechanic-learning burden or map-system rewrite.
- **Trade-off:** local bitmap accents increase payload, but provide materially
  better atmosphere than procedural primitives alone.
- **Decision:** accept a bounded local asset budget in exchange for higher visual
  fidelity while preserving a procedural fallback.

## 6. First-Principles Review

### 6.1 Five-Line Review

- **First Principle:** the player must understand where the stage ends, what was
  earned, and that the next environment is more dangerous without reading instructions.
- **Non-negotiables:** control behavior, collision truth, run continuity, static
  deployment, and honest danger signals.
- **Assumptions to Drop:** the current single-file renderer and `<50KB` marketing
  claim are not higher priority than readable, accepted visual quality.
- **Smallest Sufficient Path:** keep the native engine and extract only stage
  configuration, reward policy, and environmental rendering.
- **Escalation Signal:** inability to hold mobile frame pacing or asset budget
  would require reducing visual layers, not introducing a framework.

### 6.2 Architecture Integrity Lens

- **Invariant:** gameplay truth has one owner and visuals are projections of that truth.
- **Canonical owners:** chapter configuration owns stage facts and package
  references; `MapThemePackage` owns map-specific visual data; the canonical
  element library owns frog, pads, hazards, rewards, and controls; reward policy
  owns arithmetic; `Game.rows` owns collision; `FrogJourney` owns milestone
  state; `provenance.json` owns source-rights facts; external approval records
  own human authorization; the map-theme renderer owns cosmetic drawing only.
- **Responsibility overlap:** hard-coded stage numbers, reward arithmetic, and
  water colors must not remain duplicated in `demo/index.html`.
- **Higher-level simplification:** route stage behavior through immutable
  chapter definitions and route all map-specific presentation through one
  validated package contract.
- **Retirement/falsifier:** retire the old inline single-color water pass and
  hard-coded stage message. If the extracted renderer requires gameplay-state
  mutation, the boundary is wrong and must be revised.
- **Verdict:** proceed with modular native Canvas; an ADR signal is preserved
  because canonical ownership changes.

## 7. Options Considered

### Option A: Continue Editing `demo/index.html`

Add rewards, assets, and both themes directly to the existing object.

- Lowest initial file count.
- Highest regression and comprehension risk.
- Adds new responsibilities to a 1577-line file.
- Rejected.

### Option B: Native Canvas With Extracted Policies and Renderer

Add small UMD/CommonJS policy modules, a validated `MapThemePackage` boundary,
and keep `demo/index.html` as the runtime orchestrator.

- Preserves current deployment and test patterns.
- Makes arithmetic and theme selection independently testable.
- Limits extraction to responsibilities introduced by this work.
- Recommended.

### Option C: Adopt a Scene Engine or Build Tool

Move rendering to Phaser, PixiJS, or a bundled component architecture.

- Offers stronger scene tooling and asset management.
- Violates the pre-V4 toolchain gate and expands migration risk.
- Does not solve the reward or checkpoint problem more directly.
- Rejected for this workstream.

## 8. Proposed Architecture

### 8.1 File Ownership

| File | Responsibility |
|---|---|
| `demo/src/chapters.js` | immutable stage, checkpoint, reward, package ID, and transition configuration |
| `demo/src/journey.js` | milestone progression only; retains current pure-policy role |
| `demo/src/rewards.js` | mutation-free reward settlement and idempotency decisions |
| `demo/src/game-elements.js` | versioned canonical IDs, variants, and Canvas drawing for frog, pads, hazards, and rewards |
| `demo/src/map-theme.js` | `MapThemePackage` schema validation, normalization, version checks, and immutable loading |
| `demo/src/map-theme-renderer.js` | package-driven environmental assets, deterministic decoration layout, blending, and draw layers |
| `demo/index.html` | run-state orchestration, row generation, collision, entity update, effect dispatch, DOM/HUD binding |
| `demo/maps/<package-id>/map-theme.json` | canonical package manifest for one approved map theme |
| `demo/maps/<package-id>/assets/*.webp` | original local atmosphere accents; never collision or hazard truth |
| `demo/maps/<package-id>/import-receipt.json` | importer-generated runtime eligibility proof |
| `schemas/map-theme/*.schema.json` | versioned JSON Schemas for package, brief, provenance, proposal, approvals, validation, and receipt |
| `scripts/map-theme-validate.mjs` | read-only schema, asset, hash, protection, budget, and preview-evidence validation |
| `scripts/map-theme-import.mjs` | approval-checking importer; the only writer to runtime map directories |
| `scripts/map-theme-audit.mjs` | deployment check that reconstructs and verifies approval, validation, package, and receipt linkage |
| `demo/tests/chapters.test.cjs` | chapter and transition contracts |
| `demo/tests/rewards.test.cjs` | reward formulas, caps, and replay protection |
| `demo/tests/game-elements.test.cjs` | protected IDs, library version, variant ownership, and draw API |
| `demo/tests/map-theme.test.cjs` | package schema, protection policy, provenance, and approval checks |
| `demo/tests/map-theme-renderer.test.cjs` | pure theme/decor decisions and deterministic cosmetic layout |
| `demo/tests/journey.test.cjs` | existing milestone behavior plus checkpoint sequencing |
| `demo/tests/structure.test.cjs` | script order, hashes, retired inline paths, and static asset references |

### 8.2 Dependency Direction

```text
chapters.js --------> journey.js inputs
     |
     +--------------> rewards.js inputs
     |
     +-- packageId -> map-theme.js -> map-theme-renderer.js

game-elements.js ---> map-theme.js validation
        |
        +-----------> demo/index.html entity drawing

demo/index.html orchestrates all modules.
No policy or renderer imports or mutates Game.
```

Browser modules keep the established UMD-style shape: a browser global and a
CommonJS export from the same source. Script order is:

```text
input.js -> chapters.js -> journey.js -> rewards.js -> game-elements.js
         -> map-theme.js -> map-theme-renderer.js -> inline Game
```

### 8.3 Chapter Configuration Contract

`chapters.js` exposes frozen stage definitions and pure lookup functions. Stage
facts are not repeated in HTML.

Each stage definition contains:

```text
id
name
startRow
endRow
themeId
mapThemePackageId
reward
checkpoint
```

`themeId` is the semantic theme role used for blending. `mapThemePackageId`
selects the validated runtime package that supplies its visual realization.

Required values:

| Stage | `startRow` | Progress and checkpoint | Theme | Reward |
|---|---:|---|---|---|
| 1 | 0 | progress 1-11, checkpoint 12 | `MORNING_MIST` | score 150, time 8, bomb 1, bomb cap 5 |
| 2 | 13 | progress 13-23, checkpoint 24 | `STORM_DEEP_LAKE` | score 150, virtual time 8, virtual bomb 1, then final conversion |

`getStageForRow(12)` returns Stage 1 because row 12 owns its checkpoint content.
After that checkpoint is claimed, `FrogJourney.currentStage` becomes 2 while the
frog remains on world row 12. These are different concepts: world-content
ownership is row-based, while journey status records the next active objective.
Each stage therefore spans 12 forward distance increments: `1-12` and `13-24`.

Pure public operations:

- `getJourneyOptions()` returns two stages and 12 rows per stage.
- `getStage(stageId)` returns an immutable definition.
- `getStageForRow(row)` returns the logical stage.
- `getCheckpointForRow(row)` returns a checkpoint definition or `null`.
- `getThemeMixForRow(row)` returns normalized Stage 1/Stage 2 weights.

Theme weights are exact:

| World row | Morning | Storm |
|---:|---:|---:|
| 0-9 | 1.00 | 0.00 |
| 10 | 0.75 | 0.25 |
| 11 | 0.50 | 0.50 |
| 12 | 0.25 | 0.75 |
| 13-24 | 0.00 | 1.00 |

The renderer resolves package weights from each visible world's `gridY`, never
from `FrogJourney.currentStage`. Therefore row 12 remains a 25/75 blend even
after its checkpoint changes the active journey objective to Stage 2.

### 8.4 Checkpoint Row Contract

Rows 12 and 24 are checkpoint rows.

1. Rows 11 and 23 are checkpoint approach rows: all seven columns are stable
   `TILE_PAD` values with no item, sinking state, or crocodile.
2. A player on any approach-row column can move horizontally across adjacent
   safe pads to column 3.
3. Rows 12 and 24 contain exactly one pad at fixed column 3. Every other tile
   in those rows is `TILE_EMPTY`.
4. The checkpoint pad is safe, non-sinking, and contains one `GOLDEN_LOTUS`.
5. No random item or crocodile may spawn on an approach or checkpoint row.
6. The checkpoint is not affected by cosmetic theme layers.
7. Landing on the checkpoint pad begins the atomic checkpoint transaction.
8. A successfully claimed checkpoint stays empty if the player leaves and returns.

Checkpoint IDs are immutable configuration constants:

```text
stage-1-golden-lotus
stage-2-golden-lotus
```

The reward policy rejects a `stageId` and `checkpointId` pair that does not
match chapter configuration. Reachability tests prove the safe horizontal path
on rows 11 and 23 and the vertical jump from column 3 to each checkpoint.
Broader random-map and two-step route proof still belongs to V4.

### 8.5 Reward Policy Contract

`rewards.js` receives plain data and returns plain data. It never reads the DOM,
plays audio, draws, or mutates the caller's state.

Input:

```text
stageId
checkpointId
score
timeLeft
bombs
claimedCheckpointIds
```

Output:

```text
applied
nextScore
nextTimeLeft
nextBombs
nextClaimedCheckpointIds
breakdown
```

All numeric inputs must satisfy `Number.isSafeInteger(value) && value >= 0`.
`claimedCheckpointIds` is a unique string array. Invalid input or an unknown
stage/checkpoint pair returns a structured non-applied result and does not alter
caller state.

Idempotency is keyed by `checkpointId`. Replaying a claimed checkpoint returns
`applied: false` and leaves all values unchanged.
The output contains a newly allocated claimed-ID array; no input object or array
is mutated.
`rewards.js` never declares journey advancement or completion. Only the
validated `FrogJourney` result may drive `STAGE_ADVANCED` or
`JOURNEY_COMPLETED`.

#### Stage 1 Settlement

```text
nextScore = score + 150
nextTimeLeft = timeLeft + 8
nextBombs = min(bombs + 1, 5)
```

The presentation must show the actual bomb delta. At five bombs it displays
`炸弹已满`, not a false `+1`.

#### Stage 2 Final Settlement

The final lotus does not mutate inventory before conversion. It contributes a
virtual `+8 seconds` and `+1 bomb`, then all remaining resources are converted:

```text
timeUnits = timeLeft + 8
bombUnits = bombs + 1
timeBonus = timeUnits * 10
bombBonus = bombUnits * 50
nextScore = score + 150 + timeBonus + bombBonus
nextTimeLeft = 0
nextBombs = 0
```

The virtual final bomb is not capped. Therefore the golden lotus itself always
contributes `150 + 80 + 50 = 280` points, while previously held resources add
their own conversion value.

Final conversion consumes the actual time and bomb inventory, so the terminal
run state stores zero for both. `completionSettlement` retains the pre-conversion
resource counts, virtual increments, conversion bonuses, and final score for
the flourish and result modal.

The returned breakdown must preserve:

- score before settlement;
- golden-lotus base score;
- time units and time conversion;
- bomb units and bomb conversion;
- final score.

High score and rank are calculated only after `nextScore` is committed.

### 8.6 `MapThemePackage` Runtime Contract

`MapThemePackage` manifest and assets are the only runtime visual-data
authority for a map theme. A matching `import-receipt.json` is a separate
runtime-eligibility proof. A source image, generated preview, segmentation
result, analyst note, or approval record cannot be loaded as visual data by the
game directly.

Required top-level fields:

```text
schemaVersion
packageId
displayName
sourceEvidence
compatibility
viewport
palette
layers
ambience
exclusionZones
semanticBindings
protectedElements
budgets
fallback
```

Contract details:

- `schemaVersion` is an integer. This work introduces version `1`.
- `packageId` is a stable lowercase kebab-case identifier.
- `sourceEvidence` records `revisionId`, `sourceBundleHash`, design-brief
  SHA-256, `provenanceId`, `provenanceHash`, `mappingApprovalHash`, and a
  non-authoritative rights-status snapshot; it never stores source pixels as
  runtime art.
- `compatibility` declares renderer contract version and canonical element
  library version.
- `viewport` declares the source aspect ratio, logical width/height, camera
  model, and normalized HUD/control safe zones.
- `palette` contains semantic water, reflection, weather, and atmosphere roles;
  it does not contain frog, pad, hazard, reward, or control colors.
- `layers` is an ordered array of background-only layers with stable IDs,
  z-bands, local asset paths, blend mode, opacity, parallax, motion policy, and
  exclusion policy.
- `ambience` configures bounded rain, mist, ripple, lightning, bubble, and
  vegetation behavior within renderer-supported primitives.
- `exclusionZones` protects gameplay targets, HUD, controls, and camera-safe
  margins from decorative obstruction.
- `semanticBindings` records what recognized source-image regions correspond
  to in the canonical element library; these are references, never replacements.
- `protectedElements` must declare `inherit-only` for frog, normal pad, sinking
  pad, crocodile, golden lotus, bomb, jump preview, HUD, and controls.
- `budgets` declares compressed bytes, draw calls, visible instances, and motion limits.
- `fallback` selects a renderer-owned fallback preset and supplies only
  schema-bounded parameters. It never supplies executable fallback logic.

The schema validator rejects unknown top-level fields, duplicate layer IDs, remote
asset URLs, paths escaping the package directory, unsupported blend modes,
unbounded instance counts, unapproved semantic element overrides, missing
provenance, or invalid package-content hashes. A separate runtime-eligibility
check rejects a missing or mismatched `import-receipt.json`; preview mode can
validate a staged proposal without that receipt but cannot import it.

Each layer entry contains:

```text
id
role
zBand
asset
blendMode
opacity
parallax
motion
exclusionPolicy
```

Allowed layer roles are:

```text
far-environment
water-base
underwater-texture
edge-vegetation
background-atmosphere
foreground-weather
landmark-backdrop
```

No layer role owns collision or interaction. `fallback` contains a
renderer-owned `presetId` plus schema-bounded color and density parameters. If
the package is missing or invalid, the renderer uses its built-in neutral-water
default without reading package fallback data.

Each semantic binding contains:

```text
sourceRegionId
canonicalElementId
usage
contrastRequirement
exclusionRadius
```

`usage` is `REFERENCE_ONLY` or `CANONICAL_OVERLAY`. Source pixels mapped to a
canonical element never ship as that element's runtime visual.

### 8.7 Canonical Element Protection

The game maintains one canonical element library for:

```text
frog
normal lily pad
sinking lily pad
crocodile and warning wake
ordinary flower
golden lotus
bomb and bomb pickup
jump preview
HUD
D-Pad and action controls
```

`demo/src/game-elements.js` owns `libraryVersion`, `getElementDefinition(id)`,
`hasVariant(id, variant)`, canonical Canvas draw operations, and the following
version-1 registry. HUD and control implementations remain in the game shell,
but their IDs are protected by this registry.

| Canonical ID | Allowed variants | Package policy |
|---|---|---|
| `frog.player` | `default` | `inherit-only` |
| `surface.lily-pad.normal` | `default` | `inherit-only` |
| `surface.lily-pad.sinking` | `default`, runtime-controlled damage states | `inherit-only` |
| `hazard.crocodile` | `default` | `inherit-only` |
| `hazard.crocodile.warning-wake` | `default` | `inherit-only` |
| `reward.flower` | `default` | `inherit-only` |
| `reward.golden-lotus` | `collectible`, `landmark` | `inherit-only` |
| `item.bomb` | `default` | `inherit-only` |
| `item.bomb-pickup` | `default` | `inherit-only` |
| `preview.jump-target` | `default`, `charged` | `inherit-only` |
| `ui.hud` | `default` | `inherit-only` |
| `ui.control.dpad` | `default` | `inherit-only` |
| `ui.control.bomb` | `default` | `inherit-only` |

`protectedElements` has exactly this versioned ID set as keys and
`inherit-only` as every value. `semanticBindings` may reference only listed
variants. The `reward.golden-lotus` variant `landmark` is an approved
non-interactive presentation, not a package-defined asset.

A package may:

- reference a canonical element ID;
- request an approved semantic variant already present in the library;
- define contrast or exclusion requirements around that element.

A package may not:

- embed a replacement frog, pad, hazard, reward, HUD, or control graphic;
- alter hitboxes, timers, rewards, spawn rules, controls, or warning semantics;
- suppress a canonical element;
- make decorative imagery imitate an interactive element.

If a source design proposes a genuinely new gameplay element, the ingestion
result is `PROPOSE_CORE_CHANGE`. It produces a separate
`CoreElementChangeProposal` and stops. It cannot be approved as part of a theme
package or silently converted into decoration.

### 8.8 Package Lifecycle and Approval Enforcement

Allowed lifecycle states:

```text
RECEIVED -> ANALYZED -> PROPOSED -> APPROVED
         -> REJECTED
APPROVED -> BUILT -> VALIDATED -> IMPORTED
```

- `submissionClass` independently records `REFERENCE_ONLY`,
  `ANALYZABLE_CONCEPT`, or `IMPORT_CANDIDATE`; it is not a lifecycle state.
- Analysis is read-only against runtime files and the canonical element library.
- Analysis outputs may be written only under an isolated staging directory.
- `PROPOSED` packages can render in a dedicated preview harness only.
- Transition to `APPROVED` requires explicit human approval of the mapping
  manifest and its content hash.
- Build tooling refuses to package a source whose image or design-brief hash
  differs from the approved record.
- `VALIDATED` requires schema, asset, visual, accessibility, performance, and
  protected-element checks.
- Transition to `IMPORTED` requires a second explicit human approval of the
  rendered preview and diff report.
- `scripts/map-theme-import.mjs` is the only operation allowed to copy a
  validated staged package into `demo/maps/`. It refuses overwrites, verifies
  external mapping/import approval records, and generates `import-receipt.json`.
- Production runtime accepts only packages whose computed content hash matches
  an importer-generated receipt.
- Rejection or missing approval produces no changes outside staging.

Human approval is never stored in `map-theme.json`. The only authorization
sources are append-only external `mapping-approval.json` and
`import-approval.json` records. A manifest status string is rejected as an
unknown field and has no authority.

All governance JSON uses `schemaVersion: 1`, rejects unknown fields, and is
validated by versioned schemas under `schemas/map-theme/`. JSON hashes use
SHA-256 over RFC 8785 canonical UTF-8 bytes and are encoded as 64 lowercase
hexadecimal characters.

`packageContentHash` uses this exact byte protocol:

1. Canonicalize `map-theme.json` with RFC 8785, encode as UTF-8, and calculate
   `manifestHash = SHA256(bytes)`.
2. For every manifest-referenced asset, normalize its package-relative POSIX
   path, reject `.`/`..`, duplicate, absolute, backslash, or percent-encoded
   path segments, and calculate SHA-256 over the raw file bytes.
3. Sort assets by the UTF-8 byte order of normalized paths.
4. Construct UTF-8 preimage:
   `map-theme-package-v1\n` + `manifestHash` + `\n`, followed for each asset by
   `path` + NUL (`0x00`) + `assetHash` + `\n`.
5. `packageContentHash` is SHA-256 of that complete preimage.

Paths participate in the hash, so renaming an otherwise identical asset
invalidates approval. Before import, the staged package directory must contain
exactly one regular `map-theme.json` plus exactly the regular asset files
referenced by that manifest. A recursive `lstat` walk permits real directories
only when they are non-empty ancestors of referenced asset paths. Empty
directories, unreferenced regular files, hard-linked files with link count
greater than one, symbolic links, sockets, devices, and any other entry type are
rejected. After import, the only additional allowed regular file is
`import-receipt.json`; the receipt is deliberately excluded from
`packageContentHash`.

`sourceBundleHash` binds every submitted visual input, not just one image:

1. `source/source-bundle.json` is the sole input-enumeration authority. It lists
   `schemaVersion`, `requestId`, `revisionId`, and `files[]`; each entry contains
   exactly `role`, normalized `path`, `mediaType`, and raw-file `sha256`.
2. Assign each listed file exactly one schema enum role:
   `source-design`, `composite-preview`, `clean-environment-plate`, or
   `semantic-overlay`.
3. Reject duplicate roles except where the schema explicitly permits an indexed
   role; version 1 permits none.
4. Recursively walk `source/files/` with the same real-directory and regular-file
   rules as package assets. Every regular file must appear once in the manifest,
   every manifest path must resolve to one file, and no other entry is allowed.
5. Sort entries by role's UTF-8 byte order.
6. Construct UTF-8 preimage `map-theme-source-bundle-v1\n`, followed for each
   entry by `role` + NUL + normalized path + NUL + media type + NUL +
   raw-file SHA-256 + `\n`.
7. Hash that preimage with SHA-256.

Changing, adding, removing, or changing the role of any submitted visual file
changes `sourceBundleHash`. `MapDesignBrief` and `provenance.json` remain
separately bound by `briefHash` and `provenanceHash`.

`proposalHash`, `mappingApprovalHash`,
`validationReportHash`, and `importApprovalHash` are SHA-256 over the RFC 8785
canonical UTF-8 bytes of their respective complete JSON artifacts. Hash fields
that would self-reference are excluded by schema and cannot appear in the
hashed artifact.

`review-evidence.json` is the sole enumeration authority for human-reviewed
outputs. Its `entries[]` contains exactly `role`, normalized `path`, `mediaType`,
and raw-file `sha256`, with roles for required viewport previews, visual diff,
asset-size report, protected-element report, accessibility/motion report,
performance report, and deviation list. The same closed-directory and sorting
rules as `source-bundle.json` apply under `review/files/`.
`reviewEvidenceHash` is SHA-256 over the RFC 8785 canonical UTF-8 bytes of
`review-evidence.json`; each listed file hash is therefore transitively bound.

The minimum governance artifact contracts are:

```text
provenance.json
  schemaVersion provenanceId creator creationMethod rightsHolder
  allowedUses[] sourceHashes[] createdAt

source-bundle.json
  schemaVersion requestId revisionId files[]

mapping-proposal.json
  schemaVersion requestId revisionId sourceBundleHash briefHash provenanceHash
  regionDecisions[] layerPlan semanticBindings[] budgets

mapping-approval.json
  schemaVersion approvalId requestId revisionId proposalHash sourceBundleHash
  briefHash provenanceHash regionDecisions[] acceptedLayerIds[]
  canonicalBindings[] rejectedRegionIds[] acknowledgedCoreProposalIds[]
  budgets visualScorecard approvedBy approvedAt

validation-report.json
  schemaVersion reportId validatorVersion packageId revisionId
  mappingApprovalHash packageContentHash reviewEvidenceHash
  checks[] deviations[] passed createdAt

review-evidence.json
  schemaVersion packageId revisionId entries[]

import-approval.json
  schemaVersion approvalId packageId revisionId mappingApprovalHash
  packageContentHash validationReportHash reviewEvidenceHash
  acceptedDeviationIds[] approvedBy approvedAt
```

Array item shapes, enums, numeric ranges, date-time format, and required versus
optional fields are fixed in the corresponding version-1 JSON Schemas. Those
schemas must be implemented and pass schema-fixture tests before validator or
importer code is accepted; application code cannot add private fields or
defaults outside them.

This document is the semantic architecture authority; the checked-in schemas
become the mechanical wire-format authority only after an agent-owned
**Schema Freeze Check**. That check records every schema `$id`, file SHA-256,
positive fixture, and negative fixture in the implementation evidence. A schema
that weakens or contradicts this document is a design defect and returns to
design review. Until the check passes, validator/importer implementation is not
accepted and this document must not be described as an executable wire
specification. This adds no human gate.

After approvals and validation are verified, the importer writes:

```text
import-receipt.json
  schemaVersion
  packageId
  revisionId
  packageContentHash
  mappingApprovalHash
  validationReportHash
  reviewEvidenceHash
  mappingApprovalId
  importApprovalHash
  importApprovalId
  importedAt
```

The importer verifies all schema versions and hashes, verifies
`validationReportHash` against the external report, writes through a temporary
directory, and creates the receipt bytes once. It stores those exact bytes as
the write-once revision artifact `import/import-receipt.json` and copies the
same bytes to the runtime package. Recovery reuses the archived receipt only
after the chain audit passes; it never generates a new `importedAt` for the same
import event.

Runtime eligibility requires all of these predicates:

1. manifest and receipt pass their version-1 schemas;
2. runtime directory name, manifest `packageId`, and receipt `packageId` match;
3. manifest `sourceEvidence.revisionId` equals receipt `revisionId`;
4. recomputed `packageContentHash` equals receipt `packageContentHash`;
5. no package-directory entry violates the exact allowlist above.

`mappingApprovalHash`, `validationReportHash`, `mappingApprovalId`,
`reviewEvidenceHash`, `importApprovalHash`, `importApprovalId`, and `importedAt`
are CI-audited evidence carried by the receipt; runtime checks their schema
shape but does not load the external records or re-authorize the human decision.

This boundary has two explicit trust levels:

- Runtime verifies package integrity and imported eligibility, not human signer identity.
- Repository import and deployment verify authorization. `map-theme-audit.mjs`
  recomputes the complete chain from external evidence and must pass in CI
  before deploy; a hand-authored receipt with no matching evidence fails that audit.

Anyone able to bypass repository review and CI can forge static files. Preventing
that requires signed receipts and key management, which are outside this
static-hosted batch. Claims such as "importer-generated" therefore mean
"reproducible by the approved repository workflow", not cryptographically
unforgeable.

### 8.9 Static Design Operating Model and Scope

The intake system is deliberately semi-automatic:

```text
static design input
  -> admission check
  -> read-only visual analysis
  -> semantic classification
  -> layer reconstruction proposal
  -> mapping approval
  -> staged package build
  -> automated validation and rendered preview
  -> import approval
  -> runtime import
```

Machine assistance may produce classifications, confidence, palettes, layer
plans, previews, and diffs. Humans retain authority over semantic mapping and
runtime import. Uploading an image never grants permission to alter canonical
assets, gameplay semantics, runtime configuration, or source code.

This standard covers submission provenance, admission, classification,
background reconstruction, canonical-element mapping, package validation,
preview/diff evidence, approvals, immutable hashes, and runtime import. It does
not authorize:

- inventing gameplay rules from visual appearance;
- editing frog, pad, hazard, reward, HUD, or control assets;
- changing collision, reward, timing, spawn, or input behavior;
- accepting copyrighted, unlicensed, or unknown-rights material;
- treating an attractive mood image as a production-ready map design;
- automatic production import without exact explicit approval.

The selected model rejects both undocumented per-map recreation and fully
automatic image-to-map import. The first causes style and decision drift; the
second cannot reliably infer rights, collision intent, or gameplay semantics.

### 8.10 Submission Classes and Workflow State

Every immutable input revision receives one `submissionClass`:

```text
REFERENCE_ONLY | ANALYZABLE_CONCEPT | IMPORT_CANDIDATE
```

`REFERENCE_ONLY` is suitable only for mood or discussion. Typical examples are
screenshots from another game, photography without the supported camera/layout,
an image without a `MapDesignBrief`, or an image that bakes gameplay elements
into an inseparable background. It cannot be segmented into production assets
or imported. Unknown or prohibited rights produce `REJECTED`, not
`REFERENCE_ONLY`, and the source cannot be retained in the ingestion workspace.

`ANALYZABLE_CONCEPT` supports structured analysis and proposals, but not package
build. It requires a valid brief, known provenance and permitted analysis use,
a correct or convertible portrait composition, separable background/gameplay/UI
regions, and no unresolved protected-element replacement request. A single
flattened static image normally enters at this level.

`IMPORT_CANDIDATE` additionally requires all hard gates, a quality score of at
least 85/100 with no category below 60%, a clean or safely reconstructable
background plate, canonical elements as overlays or annotations rather than
baked runtime pixels, and a buildable approved classification.

`workflowState` is separate:

```text
RECEIVED -> ANALYZED -> PROPOSED -> APPROVED
         -> REJECTED
APPROVED -> BUILT -> VALIDATED -> IMPORTED
```

Rules:

- every revision starts at `RECEIVED` with one immutable class;
- `REFERENCE_ONLY` may reach `ANALYZED`, but not `PROPOSED`;
- `ANALYZABLE_CONCEPT` may reach `PROPOSED`, but not `BUILT`;
- only an `IMPORT_CANDIDATE` with mapping approval may reach `BUILT`;
- reconstruction creates a new revision and triggers new scoring;
- workflow progress never upgrades the original submission class.

### 8.11 Required Submission Bundle

The minimum analysis bundle is:

```text
source-bundle.json
files/source-design.png|jpg
map-design-brief.json
provenance.json
```

It can reach `ANALYZABLE_CONCEPT`, never automatic import. The preferred
importable bundle is:

```text
source-bundle.json
files/composite-preview.png
files/clean-environment-plate.png
files/semantic-overlay.png
map-design-brief.json
provenance.json
```

- `composite-preview` communicates the intended final experience.
- `clean-environment-plate` omits protected gameplay and UI elements.
- `semantic-overlay` labels positions and canonical element IDs.
- `map-design-brief` states intent and constraints.
- `provenance.json` is the sole authority for creator, source method, ownership,
  permitted uses, and source hashes. Other artifacts reference its immutable ID
  and hash; copied rights-status text is informational and loses on conflict.

For a flattened image, the pipeline may propose a clean-plate reconstruction,
but it remains staged until explicitly approved. The reconstructed plate,
semantic overlay, updated brief, and provenance form a new revision that may
qualify as `IMPORT_CANDIDATE`; the original remains `ANALYZABLE_CONCEPT`.

### 8.12 `MapDesignBrief` Contract

The brief is mandatory. A visually similar image without one is
`REFERENCE_ONLY`. Required fields are:

```text
schemaVersion
requestId
mapId
displayName
designPurpose
chapterRole
sourceType
targetViewport
cameraModel
gameplayCorridor
safeZones
themeKeywords
backgroundIntent
canonicalElements
newElementProposals
motionIntent
prohibitedChanges
provenance
```

Required semantics:

- `designPurpose` explains why the map exists and how it differs.
- `chapterRole` states introduction, escalation, mastery, finale, or another role.
- `cameraModel` matches the supported top-down/near-orthographic view.
- `gameplayCorridor` reserves normalized traversable bounds.
- `safeZones` reserves normalized HUD and control regions.
- `canonicalElements` lists expected IDs and approximate positions.
- `newElementProposals` names unknowns explicitly and is empty when none exist.
- `motionIntent` describes ambience, never inferred gameplay behavior.
- `prohibitedChanges` includes gameplay rules, collision, controls, and
  protected-element replacement unless a separate proposal exists.
- `provenance` is an object containing only `provenanceId` and
  `provenanceHash`; the referenced `provenance.json` is the rights authority.

### 8.13 Static Design Authoring Standard

Canvas and camera:

- preferred source size is `960x1800`; minimum analyzable size is `720x1280`;
- portrait aspect ratio is `8:15` through `9:16`;
- camera is top-down or near-orthographic, with no perspective horizon that
  changes apparent grid scale;
- normalized X `0.12-0.88` is the central gameplay corridor;
- normalized Y `0.00-0.12` is reserved for HUD legibility;
- normalized Y `0.78-1.00` is reserved for touch controls;
- important landmarks remain visible outside UI zones.

The design must make these conceptual layers distinguishable:

```text
far environment
water/base surface
background atmosphere
edge vegetation and props
gameplay plane
canonical gameplay elements
weather/foreground atmosphere
HUD and controls
```

Background layers may overlap each other, but may not permanently cover the
center 50% of a legal landing pad, an active hazard, the frog, a jump preview,
or a collectible.

Designers may use the current canonical asset or a labeled neutral placeholder
in the composite preview. A landmark repeating a protected silhouette is allowed
only when the canonical library already defines the variant, the package
references its canonical ID, and it aligns with the real objective outside the
traversable plane.

Static designs must not redraw the frog, make pad state ambiguous, visually
replace a crocodile while retaining its behavior, redesign HUD or controls,
introduce decoration resembling rewards/warnings/traversable pads, or imply
collision, damage, reward, or interaction without annotation. Any requested
protected-element change becomes a separate `CoreElementChangeProposal`.

Readability and technical requirements:

- legal targets remain distinguishable at `390x844`;
- local background contrast preserves target silhouettes;
- hazard warnings remain unique to real hazards;
- decorative motion does not point toward a false objective;
- the checkpoint landmark is visible without obscuring the actual tile;
- composition has one dominant route-reading hierarchy;
- no watermark, caption, prompt text, unrelated logo, or baked UI chrome;
- no heavy artifacts or intentional blur over the gameplay corridor;
- source edges permit reconstruction and lighting remains coherent;
- supplied alpha assets use straight alpha with documented color space.

### 8.14 Reverse Constraint Workflow for New Static Designs

Static concept generation starts from the same contracts used for import:

1. create and validate `map-design-brief.json`;
2. lock the canonical element-library version;
3. generate the clean environment plate first;
4. add canonical elements as a separate overlay;
5. add a semantic overlay with IDs, safe zones, gameplay corridor, intended
   landmark, and proposed new elements;
6. compose the review image;
7. run admission scoring before presenting it as a candidate.

Generation prompts or designer briefs must explicitly state:

```text
Purpose: map environment concept for Frog Game V2
Camera: supported top-down/near-orthographic view
Output: clean background plate with separable depth layers
Keep clear: gameplay corridor, HUD safe zone, touch-control safe zone
Exclude: frog, lily pads, crocodiles, rewards, bombs, HUD, controls, text, logos
Do not imply: collision, traversability, reward, or danger through decoration
Theme intent: values from MapDesignBrief
```

The composite preview is created afterward with canonical elements. This stops
static generation from silently redefining the game's common visual language.

### 8.15 Admission Gates, Scoring, and Classification

Failure of any hard gate prevents `IMPORT_CANDIDATE` status:

1. provenance and permitted use are documented;
2. the `MapDesignBrief` is present and schema-valid;
3. camera and aspect ratio are compatible;
4. protected elements are absent from the clean environment plate;
5. no unannotated object resembles a gameplay element;
6. gameplay and UI safe zones can be honored;
7. reconstruction does not require inventing hidden critical content;
8. the request does not attempt to change gameplay rules through visual import.

Unknown or prohibited rights produce `REJECTED`. Other failures produce
`REFERENCE_ONLY` with revision guidance.

| Category | Weight | Passing evidence |
|---|---:|---|
| Camera and layout compatibility | 20 | supported projection, usable corridor and safe zones |
| Semantic separation | 20 | background, canonical elements, and unknowns can be classified |
| Gameplay readability | 20 | targets, hazards, and checkpoint remain legible |
| Layer reconstructability | 15 | clean or reconstructable atmosphere and edge layers |
| Theme differentiation | 10 | clear purpose and non-duplicative identity |
| Technical quality | 10 | sufficient resolution, coherent lighting, clean edges |
| Provenance completeness | 5 | creator, rights, source type, and hashes recorded |

Scores `85-100` are eligible when all hard gates pass; `70-84` remains
`ANALYZABLE_CONCEPT`; below 70 is `REFERENCE_ONLY`. A category below 60% of its
weight blocks import candidacy. Scores never override hard gates or human review.

At `390x844` and `480x900`, the reviewer scores from 1 to 5, with one evidence
sentence for each: target readability, truthful hazard recognition, checkpoint
prominence, theme differentiation, transition continuity, and motion/weather
comfort. Every item must score at least 4 for mapping approval. The scorecard,
reviewer, viewport, source revision, and proposal hash are stored in
`mapping-approval.json`.

Every detected region receives exactly one disposition:

| Disposition | Meaning | Allowed next action |
|---|---|---|
| `KEEP_BACKGROUND` | map-specific non-interactive visual | reconstruct as package layer |
| `REBUILD_BACKGROUND` | usable intent but unsafe/occluded pixels | create a staged replacement |
| `MAP_CANONICAL` | protected game element | reference canonical ID; discard source pixels |
| `PROPOSE_CORE_CHANGE` | potentially new gameplay/system element | create separate proposal and stop |
| `REJECT` | unsafe, ambiguous, unlicensed, or irrelevant | exclude with reason |

Each record includes region, confidence, rationale, target layer, optional
canonical ID, occlusion risk, and reviewer decision. `element-inventory.json`
and its indexed segmentation mask define completeness: every source pixel
belongs to exactly one stable region ID or `UNRESOLVED`; IDs must match exactly,
with no overlaps or uncovered pixels. Any non-empty `UNRESOLVED` blocks
`IMPORT_CANDIDATE`. Low confidence defaults to `PROPOSE_CORE_CHANGE` when
behavior may be implied, otherwise `REJECT`, never `KEEP_BACKGROUND`.

### 8.16 Approval, Validation, and Import Authority

Mapping approval must name source-bundle, brief, provenance, and proposal
hashes; accepted background layers; canonical mappings; rejected regions;
acknowledged core-change proposals; and package budgets. The reviewer approves
or rejects every classified region and every `REBUILD_BACKGROUND`
transformation.

Import approval receives the final previews, source-to-preview diff, manifest,
asset-size report, protected-element report, accessibility/motion report,
performance result, and all deviations from the approved mapping. It applies
only to the exact mapping, package, review-evidence, and validation hashes.
Silence, general encouragement, or approval of another revision is not
authorization.

Authority order is fixed:

1. external `mapping-approval.json` authorizes the proposal;
2. `validation-report.json` proves the built package;
3. external `import-approval.json` authorizes that validated hash;
4. the importer verifies all three and emits `import-receipt.json`;
5. runtime validates the receipt against current package bytes.

No manifest field, preview state, filesystem location, or runtime flag can
substitute for these records. Conflict or mismatch fails closed and leaves the
existing package unchanged.

Importer and audit use the same complete chain predicates:

1. every artifact passes its declared version-1 schema;
2. `requestId` and `revisionId` match across source bundle, brief, proposal,
   mapping approval, manifest source evidence, validation report, import
   approval, and receipt wherever those fields exist;
3. recomputed `sourceBundleHash`, `briefHash`, `provenanceHash`, `proposalHash`,
   and `mappingApprovalHash` equal every downstream reference;
4. manifest `sourceEvidence.mappingApprovalHash`, validation-report
   `mappingApprovalHash`, import-approval `mappingApprovalHash`, and receipt
   `mappingApprovalHash` are identical;
5. recomputed `packageContentHash` equals manifest/asset bytes and every
   downstream package hash;
6. `reviewEvidenceHash` equals the closed review evidence set and matches the
   validation report, import approval, and receipt;
7. `validation-report.passed` is exactly `true`, its recomputed hash matches
   import approval and receipt, and every validation deviation ID appears
   exactly once in `import-approval.acceptedDeviationIds`;
8. recomputed `importApprovalHash` and both approval IDs match the receipt;
9. package IDs match across manifest, reports, approvals, receipt, and runtime
   directory;
10. the archived receipt and runtime receipt are byte-identical.

The importer evaluates these predicates before installation and again against
the temporary copy before atomic rename. The deployment audit evaluates them
from repository evidence without writing files.

Automated validation proves:

- schema, RFC 8785 canonicalization, content hashes, and normalized path order;
- local contained assets and zero remote runtime requests;
- exact `inherit-only` protection and valid canonical variants;
- complete segmentation with one disposition per region;
- every shipped asset originates from an approved background disposition;
- valid safe zones and exclusion policies;
- maximum-density motion does not intersect runtime exclusion geometry;
- payload, draw-count, instance, accessibility, and motion budgets;
- preview or manifest status cannot authorize import;
- changed source, brief, manifest, or assets invalidate prior approval;
- fallback remains non-interactive and cannot alter gameplay.

Package validation does not inspect an import approval that does not yet exist
and does not validate its own report hash. Complete approval/report/receipt
linkage belongs only to import and audit. Validation treats source, proposal,
approval, manifest, and assets as read-only inputs and emits one write-once
report. Failure leaves the package in staging and runtime files unchanged.

### 8.17 Management Contract and Audit Artifacts

Any future CLI, local tool, or UI must expose equivalent operations:

```text
preflight(source, brief) -> AdmissionReport
analyze(source, brief) -> AnalysisBundle
propose(analysis) -> MappingProposal
approveMapping(proposalHash, decisions) -> MappingApproval
build(mappingApproval) -> StagedMapThemePackage
validate(package, mappingApproval) -> ValidationReport
approveImport(packageHash, validationHash) -> ImportApproval
importPackage(package, mappingApproval, validationReport, importApproval) -> ImportResult
```

`preflight`, `analyze`, and `propose` have no runtime-directory write access.
`build` writes only to staging. `validate` is read-only with respect to all
inputs and emits exactly one write-once report inside the same revision.
`importPackage` alone may write an approved package into `demo/maps/`. Build
never validates or imports; validate never builds, imports, or verifies a
future import approval; import never repairs or silently rebuilds its inputs.

Each request uses an isolated append-only revision directory:

```text
map-theme-staging/<request-id>/
  revisions/<revision-id>/
    source/source-bundle.json
    source/files/
    analysis/admission-report.json
    analysis/element-inventory.json
    proposal/mapping-proposal.json
    proposal/layer-plan.json
    proposal/semantic-map.json
    proposal/diff-report.md
    proposal/preview.png
    approval/mapping-approval.json
    build/map-theme.json
    build/assets/
    review/review-evidence.json
    review/files/
    validation/validation-report.json
    approval/import-approval.json
    import/import-receipt.json
```

`revision-id` is
`rNNNN-<sourceBundleHash[0:12]>-<briefHash[0:12]>`, where `NNNN` is a
zero-padded request-local sequence. Commands require an explicit revision ID;
there is no mutable `current` pointer. Later stages reference earlier hashes.
Any changed visual input or brief creates a new revision, and any regeneration
after mapping approval also creates a new revision instead of overwriting
evidence. The archived and runtime receipt files must remain byte-identical.

The current batch implements read-only validation in
`scripts/map-theme-validate.mjs`, installation in
`scripts/map-theme-import.mjs`, and pre-deploy chain verification in
`scripts/map-theme-audit.mjs`. The importer performs approval/hash verification,
overwrite refusal, temporary-directory copy, atomic rename, and receipt
generation, but does not build or validate. Analysis, proposal, and management
UI remain future work; current staged builds, proposals, and approvals use the
same artifact contracts manually.

### 8.18 Current-Batch Boundary

This lake-theme batch implements:

- `MapThemePackage` schema version 1 and validator;
- all version-1 governance JSON Schemas;
- canonical game-element registry version 1;
- the package-driven renderer;
- the read-only validator, approval-checking importer, deployment audit, and
  import-receipt contract;
- one package for `morning-mist`;
- one package for `storm-deep-lake`;
- package validation and protected-element tests.

It does not implement the general image-analysis service, management UI, or
automatic asset-generation pipeline. Future components must conform to Sections
8.9-8.17 and cannot change the runtime contract without a new design review.

The uploaded morning-mist and storm-lake images have no project-recorded
provenance or usage rights. They remain outside the ingestion pipeline and
cannot be retained, hashed, segmented, copied, or used as source evidence. They
informed conversation only.

The current implementation instead:

1. writes one valid `MapDesignBrief` per approved textual theme;
2. generates original clean plates with recorded provenance and rights;
3. creates immutable revisions containing the clean plate, canonical overlay,
   semantic overlay, brief, and provenance;
4. runs hard gates and scoring;
5. classifies every region and produces proposals and preview diffs;
6. passes the Visual Sample and Mapping Approval Gate;
7. builds both packages in staging and validates them with the read-only validator;
8. passes final import approval at the Acceptance Freeze and Import Approval Gate;
9. imports with the importer and passes the pre-deploy chain audit.

If the uploaded images later receive explicit provenance and permitted-use
records, they enter only as new immutable submissions and are classified normally.

## 9. Runtime State and Event Flow

### 9.1 New Run State

`Game` adds:

```text
claimedCheckpointIds
completionSettlement
rewardPresentation
environmentClock
```

`start()` resets all four. Stage 1 progression does not reset any of them.

### 9.2 Landing Sequence

```text
jump finishes
  -> validate collision pad
  -> award forward-distance score
  -> collect ordinary item
  -> arm sinking pad when applicable
  -> detect golden-lotus checkpoint
  -> calculate reward and journey outputs without mutation
  -> atomically consume lotus and commit reward, claimed ID, and journey state
  -> update HUD
  -> dispatch reward presentation
  -> consume buffered input, unless completing
```

The checkpoint pad is non-sinking, so checkpoint settlement cannot race a sink
timer. Ordinary item and golden lotus cannot occupy the same tile.

`Game.commitCheckpoint()` treats reward and journey updates as one synchronous
transaction:

1. calculate reward output without mutation;
2. calculate the expected journey output without mutation;
3. validate that Stage 1 maps to `STAGE_ADVANCED` and Stage 2 maps to
   `JOURNEY_COMPLETED`;
4. if either result is invalid, commit neither and emit one diagnostic error;
5. otherwise commit `row.items[c] = null`, reward values, claimed IDs, and
   journey state in the same synchronous block;
6. dispatch presentation only after the commit succeeds.

### 9.3 Completion State

Add `COMPLETING` to the runtime state machine.

- Input, bombs, hazards, and the countdown stop immediately.
- Camera and reward presentation continue for 700 milliseconds.
- The final settlement is committed before the animation starts.
- The normal result modal opens after the flourish.
- Repeated collision, timer, and journey callbacks cannot settle again.

This avoids freezing the Canvas effect at the moment `OVER` is entered.

## 10. Visual System

### 10.1 Art Direction

Stage 1, `MORNING_MIST`:

- shallow blue-green water;
- broad, slow horizontal ripples;
- sparse buds, reflections, and low-contrast mist;
- brighter ambient light and calmer motion.

Stage 2, `STORM_DEEP_LAKE`:

- deep teal water;
- diagonal wave direction;
- restrained rain and occasional lightning;
- edge reeds, driftwood, bubbles, and aquatic-plant shadows;
- stronger contrast around real crocodiles and their wakes.

Normal and sinking lily pads retain their current gameplay colors and collision
sizes. Functional state remains encoded by shape, crack/damage cues, edge
contrast, and pulse, not stage tint alone.

### 10.2 Draw Order

```text
1. row-aware water color bands
2. theme ripples and underwater non-hazard texture
3. local atmosphere assets and edge vegetation
4. checkpoint landmark backdrop
5. gameplay pads and collectible items
6. crocodiles and truthful hazard wakes
7. jump preview
8. frog
9. reward particles and flying values
10. rain/lightning foreground accents
11. floating gameplay text
```

Decorations never cover a legal landing center. The renderer receives exclusion
circles derived from visible pads, frog, preview, and collectibles.

### 10.3 Truthful Hazard Signals

- Only a live crocodile may emit a crocodile-shaped shadow, red warning, or tail wake.
- Driftwood is visually distinct from a crocodile and has no warning pulse.
- Generic underwater texture cannot resemble jaws, eyes, or a moving body.
- Lightning is a global atmosphere cue, never a gameplay warning.

### 10.4 Golden Lotus Presentation

The interactive golden lotus uses a unique silhouette, layered petals, gold
rim light, and a soft radial reflection. It is not a recolored ordinary flower.

On collection:

1. petals open over 220 milliseconds;
2. a gold ring expands without hiding the frog;
3. score, time, and bomb values separate into small tokens;
4. tokens travel toward their matching HUD fields;
5. HUD values pulse after state commit;
6. Stage 1 play continues without a modal;
7. Stage 2 transitions to the completion flourish and result modal.

A large distant lotus may mark the endpoint only through canonical element
`reward.golden-lotus` variant `landmark` referenced by the package. It must be
spatially aligned with the real checkpoint, remain outside the traversable
plane, and never appear as an independent collectible. The interactive
`collectible` variant remains the only collectible and is visually foregrounded.

### 10.5 HUD and Result Details

- Stage 1 time must visibly pulse and show `+8s`.
- Score shows `+150`.
- Bombs show `+1` or `炸弹已满` based on applied delta.
- The completion modal shows the final score and one concise breakdown line:
  `金莲 +150 · 时间 <units>s = +<timeBonus> · 炸弹 <units> = +<bombBonus>`.
- Existing controls do not move or resize during feedback.

## 11. Asset Pipeline

Runtime assets are original local WebP accents, generated from approved art
direction rather than copied from the reference images.

Planned files:

```text
demo/maps/morning-mist/map-theme.json
demo/maps/morning-mist/assets/atmosphere.webp
demo/maps/storm-deep-lake/map-theme.json
demo/maps/storm-deep-lake/assets/atmosphere.webp
```

Constraints:

- maximum 960 by 512 pixels each;
- total on-disk asset size under both package `assets/` directories at or below 400 KiB;
- no remote runtime URL;
- no baked lily pads, frog, crocodile, or collectible;
- edges and mist must tile or fade without a visible seam;
- decoding starts while the start modal is visible;
- failure to load uses the procedural water/theme layers and logs one warning.

The fallback is presentation-only. It does not duplicate gameplay logic.
README payload documentation reports two measurements: total deployable
`demo/` bytes excluding `demo/baseline-6376422/`, and initial runtime transfer
bytes under a cold browser cache. Initial transfer includes every request from
navigation until the start screen and both atmosphere assets are decoded, using
`PerformanceResourceTiming.transferSize`; it may not omit fonts, scripts, CSS,
images, or other first-run resources. The initial transfer budget is 550 KiB
across at most twelve requests, with zero cross-origin runtime requests.

## 12. Performance and Motion

- Clamp effective Canvas DPR to `min(devicePixelRatio, 2)`.
- Do not allocate decoration arrays in every animation frame.
- Use row/slot hashing for decorative placement; do not call `Math.random()` in render.
- Cap visible rain streaks at 48 and non-gameplay decorations at 24 per viewport.
- Keep lightning alpha below 0.18 and avoid rapid flashes.
- Respect `prefers-reduced-motion` by disabling lightning, reducing rain by 75%,
  and shortening token travel.
- Target 60 FPS on the current acceptance phone.
- Automated browser benchmark: median frame interval at or below 18 ms and
  95th percentile at or below 25 ms during a 10-second Stage 2 sample.
- Run three samples on the same machine with the same Playwright-bundled
  Chromium version, `390x844` viewport, and DPR 2. All three samples must pass;
  evidence records OS, hardware, browser version, and each run's percentiles.
- The median threshold represents sustained near-60-FPS pacing; the 95th
  percentile allows bounded occasional frames without claiming every frame is 60 FPS.
- If the benchmark fails, reduce rain and decorative density before reducing
  gameplay clarity or changing architecture.

## 13. Error Handling and Degradation

| Failure | Required behavior |
|---|---|
| atmosphere image fails to decode | procedural theme remains playable; one console warning |
| reward requested twice | no state change and no repeated presentation |
| unknown stage/checkpoint | fail closed; no reward; diagnostic error in development |
| HUD animation unavailable | values update immediately without motion |
| reduced-motion preference | simplified presentation with identical arithmetic |
| resize/orientation change | renderer recomputes viewport; input cancellation stays unchanged |

No visual error may change collision, timing, score, inventory, or journey state.

## 14. Compatibility Boundary

Implementation must preserve:

- `index.html` and `demo/baseline-6376422/index.html` hashes;
- V3.4 D-Pad and Canvas charging thresholds and cancellation;
- keyboard controls and bomb controls;
- current row and tile collision semantics;
- static relative paths under GitHub Pages;
- UMD/CommonJS testability;
- run state across the Stage 1 boundary;
- no runtime third-party request.

The README `<50KB` claim becomes inaccurate once local atmosphere assets are
accepted. The implementation must update that claim to a measured payload
statement rather than silently preserving false documentation.

## 15. Verification Strategy

### 15.1 Policy Tests

`chapters.test.cjs`:

- exact stage ranges and checkpoint rows;
- exact 75/25, 50/50, and 25/75 blend weights;
- immutable definitions;
- checkpoint lookup outside rows 12 and 24 returns `null`.

`rewards.test.cjs`:

- Stage 1 applies `+150`, `+8`, and one bomb;
- Stage 1 bomb cap at five;
- actual bomb delta is zero when full;
- Stage 2 exact formula at zero and non-zero resources;
- final virtual bomb is not capped;
- final settlement zeros actual time and bombs while preserving their original
  and virtual values in the breakdown;
- invalid, negative, fractional, and mismatched stage/checkpoint inputs fail closed;
- input state is not mutated;
- duplicate checkpoint returns unchanged state.

`journey.test.cjs`:

- Stage 1 still advances once at row 12;
- final completion remains row 24;
- reward settlement precedes journey completion in integration structure.

### 15.2 Renderer and Structural Tests

- canonical element registry exposes the exact version-1 protected ID set and
  the `reward.golden-lotus` variants `collectible` and `landmark`;
- package schema version, required fields, immutable normalization, and
  renderer-version compatibility;
- version-1 JSON Schema fixtures cover every governance artifact, reject unknown
  fields, and require explicit revision and provenance references;
- fixed hash fixtures prove RFC 8785 serialization, UTF-8 encoding, NUL/newline
  delimiters, POSIX path normalization, byte-order sorting, and SHA-256 output;
- source-bundle fixtures prove any role, byte, addition, or removal changes
  `sourceBundleHash`;
- rejection of remote paths, directory traversal, unknown fields, duplicate
  layers, unbounded counts, missing provenance, unreferenced files, symlinks,
  non-regular entries, and invalid approval hashes;
- rejection of all protected-element overrides;
- `PROPOSED` packages load only in preview mode;
- the importer rejects missing/mismatched external approvals, changed
  package bytes, changed validation reports, and existing destination IDs;
- the deployment audit rejects a handcrafted receipt, missing external
  evidence, reused approval IDs with changed bytes, and any broken chain hash;
- archived and runtime receipt bytes are identical, and runtime rejects
  package-ID, revision-ID, content-hash, or directory-allowlist mismatch;
- production accepts only packages whose content hashes match generated import receipts;
- theme resolver is pure and deterministic;
- theme blending uses visible world row and not `currentStage`;
- decoration layout is stable for equal row/slot input;
- renderer source contains no `Math.random()`;
- new scripts load in declared dependency order;
- old inline water fill/wave owner is removed;
- approach rows 11 and 23 are seven-column stable safe paths;
- checkpoint rows 12 and 24 contain only a stable column-3 golden-lotus pad;
- approach and checkpoint rows suppress random items, sinking pads, and crocodiles;
- a failed checkpoint validation leaves the lotus and all run state unchanged;
- presentation starts only after lotus, reward, claimed IDs, and journey state commit;
- image decode failure activates the procedural renderer and warns once;
- a cold-cache resource audit asserts initial transfer at or below 550 KiB,
  at most twelve requests, and no cross-origin request;
- unknown stage/checkpoint data fails closed;
- fake-clock tests assert 220-millisecond bloom and 700-millisecond completion timing;
- exported renderer limits assert DPR 2, rain 48, and decorations 24;
- reduced-motion policy disables lightning and reduces rain by at least 75%;
- runtime exclusion-geometry tests exercise maximum decoration density across
  representative animation frames and assert no protected target intersection;
- existing root and frozen hashes still match.

### 15.3 Browser Automation

At desktop and mobile viewports:

- load, start, and render a non-blank Canvas;
- force Stage 1, each transition row, and Stage 2;
- capture screenshot evidence;
- assert a gold-pixel cluster exists inside the expected checkpoint tile region
  before collection and disappears after collection. At `390x844`, the region
  is a radius of 24 CSS pixels around the projected tile center and must contain
  at least 60 pixels with hue 35-60 degrees and saturation at least 55%;
- claim Stage 1 reward and assert score/time/bomb DOM values;
- claim final reward and assert the exact result score and breakdown;
- replay a checkpoint and assert no second reward;
- rotate/resize and verify controls remain usable;
- assert zero unhandled console errors;
- run the 10-second frame benchmark and emit explicit PASS/FAIL.

Static source review confirms that the render loop reuses renderer-owned
decoration buffers rather than constructing decoration arrays per frame.
Palette tests require Stage 2 base-water relative luminance to be at least 15%
lower than Stage 1. Exact transition weights prove bounded row-to-row color
change. Draw-order tests prove all atmosphere layers precede gameplay pads, so
they cannot cover a landing center. Human review remains authoritative for
overall art quality and hazard-shape interpretation.

### 15.4 Human Verification

The complete lifecycle has four human gates. The current document is the first,
the pre-implementation **Design Approval Gate**. After that approval,
implementation has only three human gates:

1. **Visual Sample and Mapping Approval Gate:** approve every classified source
   region, proposed package layer, canonical-element binding, Stage 1/blend/Stage
   2 screenshots, and the exact proposal hash before package build and animation
   polish. Evidence is a side-by-side set at `390x844` and `480x900` compared
   with `design-previews/map-1-modified.png` and
   `design-previews/map-2-deep-lake.png`. Approval checks stage identity,
   transition continuity, checkpoint prominence, target readability, and absence
   of fake hazard cues; it does not require pixel identity.
2. **Real-Device Gate:** verify touch behavior, legibility, perceived frame
   pacing, rain/lightning comfort, and reward timing on a user-selected
   acceptance phone recorded by model, OS, browser, and orientation.
3. **Acceptance Freeze and Import Approval Gate:** approve the exact validated
   package hashes, validation-report hashes, complete deviation lists, deployed
   version, baseline commit, and final `WORK_PLAN.md` evidence.

All unit tests, implementation, screenshots, browser assertions, performance
capture, documentation preparation, and regression diagnosis are agent-owned.

## 16. Engineering Work Breakdown and Estimate

This is a design-level breakdown. Exact test code, commands, and commit-sized
steps will be generated in the implementation plan after this spec is approved.

| Phase | Agent-owned work | Human gate | Estimate |
|---|---|---|---:|
| 0 | create `feature/v2-lake-theme-reward-sample` in an isolated worktree from `6ad94b9`; verify hashes and baseline | none | 0.25 day |
| 1 | chapter config, canonical element registry, governance schemas, package validator, checkpoint policy, reward policy, RED/GREEN tests | none | 1.50 days |
| 2 | checkpoint row generation, settlement orchestration, completion state | none | 1.00 day |
| 3 | theme briefs, original staged assets, mapping proposals, preview renderer, three-row blend, screenshots | Visual Sample and Mapping Approval Gate | 1.25 days |
| 4 | build approved packages, implement importer/receipt and chain audit, lotus bloom, HUD token motion, modal breakdown, reduced motion | none | 1.25 days |
| 5 | full regression, browser matrix, frame benchmark, remediation | Real-Device Gate | 0.75-1.00 day |
| 6 | deployed preview, validation evidence, import approval, docs and freeze candidate | Acceptance Freeze and Import Approval Gate | 0.50 day |

Expected engineering time: `6.50-6.75 developer days`.
Expected human review time: `0.5-1.0 day` across the current design approval and
three implementation gates. Waiting time between gates is not included.

## 17. Rollback and Retirement

- Every implementation phase must be independently reviewable.
- A failed visual layer can be disabled without reverting reward correctness.
- Asset loading is optional presentation; procedural themes remain the fallback.
- The old inline water background and hard-coded stage message retire when the
  new renderer and chapter configuration pass browser comparison.
- No old reward arithmetic exists to preserve; all new settlement arithmetic
  must have one owner in `rewards.js`.
- Rollback target remains accepted commit `b232582`, with acceptance docs at
  `6ad94b9`.

## 18. ADR and Baseline Sync Signals

An ADR should be backfilled only after implementation proves the design:

- chapter definitions become the canonical owner of stage facts;
- `MapThemePackage` becomes the canonical runtime representation of map-specific visuals;
- the canonical element library is protected from theme-package overrides;
- reward calculation becomes a pure policy boundary;
- environmental rendering becomes a separate presentation owner;
- local visual assets replace the previous strict `<50KB` positioning.

On acceptance, update `WORK_PLAN.md` with the new frozen commit, measured tests,
browser evidence, mobile evidence, payload size, and any residual risk.

## 19. Current Verified Evidence

At design time:

- branch: `feature/v2-journey-input-demo`;
- latest acceptance documentation commit: `6ad94b9`;
- frozen input implementation commit: `b232582`;
- `node --test demo/tests/*.test.cjs`: 27 passed, 0 failed;
- root and frozen baseline protection remains covered by the passing structural test;
- current implementation has not changed as part of this design task.

These facts establish the design baseline. They do not verify the future
implementation.

## 20. Retirement Boundary

The old implementation to retire is the water-background block at the start of
`Game.render()` that directly fills `#1b4965` and draws one global procedural
wave pass. It is replaced by one call to
`FrogMapThemeRenderer.drawBackground()`. The procedural fallback lives inside
`map-theme-renderer.js`; the old inline block is not retained as a second fallback.

The hard-coded Stage 2 floating-text literal in `updateJourneyProgress()` is
replaced by chapter-configured presentation text. New checkpoint IDs, stage
names, row boundaries, theme IDs, transition weights, and golden-lotus reward
values may appear only in `chapters.js` among production sources;
`demo/index.html` consumes lookups and tests may repeat expected values.
Canonical Canvas draw functions for frog, pads, crocodiles, flowers, bombs, and
golden-lotus variants move to `game-elements.js`; the inline copies are deleted
after parity checks. Structural tests assert that those new stage literals and
retired draw owners do not remain in the inline Game script. Existing
non-visual entity state remains in `Game`. Browser comparison, fallback tests,
and zero lingering production references are the retirement conditions.

## 21. Acceptance Criteria

The implementation is acceptable only when all statements are true:

1. Stage 1, transition, and Stage 2 match the approved visual direction.
2. Checkpoint pads are unique, safe, reachable, and free of hazards.
3. Each golden lotus is collected at most once.
4. Stage 1 applies the exact capped reward without interrupting play.
5. Stage 2 applies the exact final formula before rank/high-score calculation.
6. HUD and result feedback truthfully reflect applied deltas and conversion.
7. Decorations never obscure legal targets or imitate hazards.
8. Existing controls and state continuity have no regression.
9. Both current themes are valid `MapThemePackage` version 1 packages and cannot
   override protected canonical elements.
10. All automated, browser, performance, and mobile checks pass.
11. The user explicitly approves the deployed candidate for freezing.
12. A similar-looking image without a valid brief cannot progress beyond
    `REFERENCE_ONLY`.
13. A single flattened image may be analyzed but cannot bypass mapping approval
    or become a runtime background directly.
14. Protected elements cannot be replaced by package content, and proposed new
    gameplay elements stop as separate `CoreElementChangeProposal` artifacts.
15. Analysis and proposal operations cannot write runtime files; build output
    remains isolated until exact mapping approval.
16. The approved repository import and deployment path rejects any package
    without matching proposal, package, validation, and import-approval hashes;
    runtime separately rejects content that does not match its receipt.
17. A changed source, brief, manifest, validation report, or asset invalidates
    the applicable prior approval.
18. Every imported package has provenance, complete classification, preview,
    validation, approval, and importer-receipt evidence.
19. Runtime rendering depends on `MapThemePackage` and its matching import
    receipt, never on the original static source image or manifest status.
20. The deleted standalone ingestion standard has no remaining references; this
    document is the sole architecture and ingestion authority.
21. The Schema Freeze Check records exact version-1 schema IDs, hashes, and
    passing positive/negative fixtures before validator or importer acceptance.
