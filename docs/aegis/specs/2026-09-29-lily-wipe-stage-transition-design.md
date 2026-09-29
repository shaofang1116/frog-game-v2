# Lily Wipe Stage Transition Design

Date: `2026-09-29`
Status: `Accepted / Frozen reusable transition contract`
Reference:
`/Users/bytedance/Library/Application Support/TRAE SOLO CN/ModularData/ai-agent/work-mode-projects/6abb68f41f4e3e43aa383e3f/frog-mist-transition-demo/pages/mist-transition-demo.html`

## 1. Decision

Replace the abrupt Stage 1 to Stage 2 background swap with a Canvas-native
giant-lily-pad wipe. Remove the rectangular crocodile warning outline.

The user accepted the implementation and requested that all future map
transitions reuse this contract. Refer to
`docs/aegis/adr/0001-lily-wipe-stage-transition.md` for the durable owner and
parameterization boundary.

## 2. Transition Contract

- Trigger after the checkpoint landing at row 12 has completed its current
  landing settlement.
- Duration: `1100ms`.
- State: `TRANSITIONING`.
- `0-420ms`: large lily pads sweep in from the bottom and side edges over the
  morning pond.
- `420-650ms`: full leaf cover reaches its peak; the active background switches
  from morning pond to storm river within the cover.
- `650-1100ms`: leaves sweep away, revealing the storm river and a short
  `第 2 段 · 鳄影深塘` title.
- During `TRANSITIONING`, input, countdown, crocodile updates, sinking-pad
  timers, camera updates, and buffered jumps are paused.
- Score, time, bombs, frog position, map rows, and collision truth remain
  unchanged. The next input may be accepted only after `PLAYING` resumes.
- Reduced-motion mode skips the sweeping animation but still performs one
  deterministic covered switch and resumes safely.

Future maps may vary the destination title, background pair, leaf palette, and
non-interactive decorative accents only. They must not add a new transition
state machine, pause model, or background-switch timing.

## 3. Ownership

- `demo/src/stage-transition.js` owns transition timing, eased phase
  calculation, and Canvas overlay drawing.
- `demo/index.html` owns lifecycle initiation, game-state pause/resume, and
  normal entity rendering.
- `demo/src/game-elements.js` owns crocodile visual drawing; its rectangular
  warning outline is retired.

## 4. Compatibility

- No changes to input gesture contracts, collision, rewards, generation,
  background asset authorization, HUD behavior, or root/frozen HTML baselines.
- Existing Stage 1 and Stage 2 local backgrounds remain the base layers.
- The transition adds no runtime network request or external dependency.

## 5. Verification

1. Pure transition tests cover phase boundaries, switch timing, completion, and
   reduced-motion result.
2. Game-element tests prove no rectangular crocodile outline is emitted.
3. Structure tests prove `TRANSITIONING` pauses the intended game updates and
   renders the overlay after entities.
4. Full Node suite and frozen hashes pass.
5. Browser screenshots show initial Stage 1, covered switch, and Stage 2
   reveal at `390x844` without blank Canvas or hidden controls.
6. Real-device verification confirms the transition reads smoothly and controls
   resume after it completes.
