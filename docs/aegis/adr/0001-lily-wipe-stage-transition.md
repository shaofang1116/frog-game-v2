# ADR 0001: Reuse the Lily Wipe for Map Transitions

Date: `2026-09-29`
Status: `Accepted / Frozen`

## Context

The abrupt Stage 1 to Stage 2 environment swap was visually jarring. The
accepted implementation now uses a Canvas-native giant-lily-pad wipe that
temporarily covers the viewport, swaps the background within the cover, and
then reveals the next stage.

The user accepted this transition and requested that future map switches reuse
it.

## Decision

`FrogStageTransition` is the canonical owner of map-transition timing and
Canvas overlay rendering.

Every future logical map/stage transition must reuse this contract:

- `1100ms` total duration;
- `TRANSITIONING` pauses input, countdown, camera, crocodiles, sinking timers,
  and buffered jumps;
- the visual-stage/background change occurs only inside the covered peak;
- the transition then resumes `PLAYING` without changing score, time, bombs,
  frog position, rows, or collision truth;
- reduced-motion mode performs the same safe covered swap without the sweep.

Future maps may supply presentation parameters only: destination title,
background pair, leaf palette, and non-interactive decorative accents. They may
not introduce a second transition state machine, change the pause contract, or
replace the covered-swap timing without a new architecture decision.

## Consequences

- Map changes retain a recognizable interaction rhythm and avoid abrupt visual
  swaps.
- Gameplay truth remains in `Game`; transition rendering remains independently
  testable in `demo/src/stage-transition.js`.
- The legacy rectangular crocodile warning outline is retired; warnings must
  not use a surrounding collision-like frame.

## Alternatives Considered

1. Immediate background swap: rejected because it caused the accepted defect.
2. Generic fade or rain curtain: rejected because it does not create a clear
   physical cover for the background swap.
3. Per-map bespoke transition effects: rejected because it would create
   duplicate state/pause owners and inconsistent interaction semantics.

## Evidence

- Design: `docs/aegis/specs/2026-09-29-lily-wipe-stage-transition-design.md`
- Runtime: commit `bb38114`
- Automated verification: 66 Node tests passed.
- Browser evidence: Stage 1, cover peak, and Stage 2 reveal screenshots at
  `390x844`.
- User acceptance: `2026-09-29`.

## Baseline Sync

The initial baseline is amended to list `FrogStageTransition` as the canonical
owner for stage-transition timing and overlay rendering. No retained duplicate
transition path remains.
