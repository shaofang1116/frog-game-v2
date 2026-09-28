# Frog Game V2 Initial Baseline

Date: `2026-09-28`
Status: `initial dual-baseline snapshot`

## 1. Purpose

This snapshot records the accepted product behavior and runtime boundaries that
future design, implementation, and review work must preserve.

## 2. Workspace Structure

- `index.html`: immutable original V2 baseline.
- `demo/baseline-6376422/index.html`: frozen copy of the original baseline.
- `demo/index.html`: active experimental game shell and runtime orchestrator.
- `demo/src/input.js`: canonical input policy.
- `demo/src/journey.js`: canonical journey milestone policy.
- `demo/tests/`: Node behavior and structural regression tests.
- `design-previews/`: untracked visual exploration, not runtime authority.
- `WORK_PLAN.md`: project phase, acceptance, and execution protocol.

## 3. Current Authority Surfaces

- Product and workflow authority: `WORK_PLAN.md`.
- Public overview and deployment constraints: `README.md`.
- Runtime behavior: `demo/index.html` and `demo/src/`.
- Verification authority: `demo/tests/` plus browser and real-device evidence.
- Frozen V3.4 input baseline: commit `b232582`.
- V3 acceptance documentation: commit `6ad94b9`.
- Architecture decisions are currently recorded in plans and accepted code;
  no prior ADR directory exists.

## 4. Product / Requirement Baseline

### 4.1 Current Truth

- The game is one continuous vertically scrolling run split into two logical
  stages of 12 rows each.
- Stage transitions preserve score, time, bombs, input state rules, and all
  other run state.
- Input supports keyboard, touch D-Pad, and Canvas swipe charging.
- V3.4 Canvas swipe charging is accepted and frozen.
- Teaching and stage feedback must remain non-blocking.

### 4.2 Non-negotiables

1. Do not modify the root `index.html`.
2. Keep experimental runtime changes inside `demo/`.
3. Preserve the V3.4 input behavior and cancellation guarantees.
4. Keep the app statically deployable without a build step or runtime CDN.
5. Preserve all run state across stage boundaries.
6. Keep danger signals truthful and gameplay targets visually readable.
7. Use automated verification before browser and real-device gates.

### 4.3 Product Non-goals

- No new tutorial modal.
- No third stage or new core hazard in the current visual/reward workstream.
- No lily-pad collision-box changes.
- No simultaneous V4 deterministic replay implementation.

## 5. Architecture / Runtime Boundary Baseline

### 5.1 Current Truth

- `demo/index.html` owns runtime orchestration, game state, map generation, and
  Canvas rendering.
- `FrogInput` owns input interpretation and gesture state.
- `FrogJourney` owns stage milestone calculation and does not mutate run state.
- Browser modules use a UMD-style global plus CommonJS export so Node tests can
  execute the same policy code.
- Tests protect the immutable root and frozen baseline by SHA-256.

### 5.2 Architecture Non-negotiables

1. New policy logic must remain independently testable in Node.
2. Rendering code must not become a second owner of gameplay state.
3. Cosmetic randomness must not affect gameplay outcomes.
4. Missing decorative assets may degrade visuals but must not block gameplay.
5. The active game shell remains the sole runtime orchestrator.

### 5.3 Architecture Non-goals

- No framework, bundler, TypeScript, Phaser, or PixiJS migration.
- No persistence or snapshot schema in this workstream.
- No broad rewrite of existing input, audio, or collision logic.

## 6. Ownership / Contract Snapshot

| Surface | Current canonical owner |
|---|---|
| Input intent and touch ownership | `demo/src/input.js` |
| Stage milestone progression | `demo/src/journey.js` |
| Run state and runtime sequencing | `demo/index.html` |
| Map row data and collision truth | `Game.rows` in `demo/index.html` |
| Canvas draw order | `Game.render()` in `demo/index.html` |
| Acceptance status | `WORK_PLAN.md` |

## 7. Current State and Risks

- V3.4 is `Accepted / Frozen`; the next roadmap item remains V4.
- `demo/index.html` is 1577 lines and has multiple reasons to change.
- Gameplay generation still uses `Math.random()`; this is known V4 work.
- Current theme rendering is one inline water fill and wave pass.
- Current journey completion does not convert remaining resources into score.
- Untracked `.DS_Store` files must never be committed.

## 8. Alignment Use

- Read the Product / Requirement Baseline before changing gameplay, rewards,
  stage flow, controls, or acceptance criteria.
- Read the Architecture / Runtime Boundary Baseline before creating modules,
  moving ownership, or changing runtime sequencing.
- Report `scope: both` when a change affects player-visible behavior and its
  canonical owner.

## 9. Compatibility Boundary

The next workstream must preserve root/frozen hashes, all 27 accepted input and
journey tests, static GitHub Pages deployment, current control methods, row-based
collision coordinates, and state continuity across stage one and stage two.
