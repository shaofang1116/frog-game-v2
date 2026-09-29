# Storm River Background Integration Design

Date: `2026-09-29`
Status: `Draft for user review`
Parent:
`docs/aegis/specs/2026-09-28-lake-theme-reward-design.md`

## 1. Decision

Use the user-supplied, rights-authorized storm-river artwork as the Stage 2
Canvas background only. Preserve every existing interactive element and all
gameplay behavior.

This is a narrow exception to the parent design's prior prohibition on direct
use of uploaded artwork. It applies only to the exact asset recorded below and
does not authorize the earlier unprovenanced concept images.

## 2. Source Authorization

User authorization recorded on `2026-09-29`:

> "好的，我确认拥有使用权，请更新规格并接入隔离分支"

Source file:

```text
/Users/bytedance/.trae-cn/attachments/6aa10cd0059b2267a95afa05/
ef97fcb1-21fe-4a31-aa13-2e6e0a8c3668_e0417674-72f5-41d3-8e63-3e9016f39b13_
暴雨深湖险道·纯河道版.jpg
```

SHA-256:

```text
aadac9b9483900e66b71c4513e6b16115e59532c86002dec37de85f0527b35d5
```

Allowed use: local Stage 2 runtime background for Frog Game V2.

## 3. Scope

### In Scope

- Copy the exact authorized image into a local, versioned demo asset path.
- Preload it as a Canvas `Image`.
- During Stage 2, draw it with a contained center crop that fills the Canvas
  viewport before the current world entities render.
- Fall back to the existing procedural water pass if the asset fails to load.
- Add structural and browser verification for local-only loading, draw order,
  nonblank Canvas, and element visibility.

### Out of Scope

- No changes to frog, lily pads, crocodiles, warnings, flowers, golden lotus,
  bombs, jump preview, HUD, D-Pad, buttons, or text.
- No changes to collision boxes, generation, rewards, input, timers, camera
  truth, or Stage 1 state continuity.
- No changes to root `index.html`, frozen baseline HTML, or `demo/src/input.js`.
- No general MapThemePackage import, approval, or receipt operation for this
  narrowly authorized asset.
- No replacement of the Stage 1 background.

## 4. Rendering Contract

- Stage 1 retains the existing procedural water background.
- Stage 2 uses the authorized asset after its load event has completed.
- The asset is viewport-anchored, not gameplay-anchored: it cannot disclose,
  hide, or mutate `Game.rows`, collision truth, entity positions, or camera
  state.
- The crop preserves the central river corridor. Edge reeds remain decorative
  and must not cover the Canvas center where targets, hazards, or frog render.
- Existing Canvas render order remains:

```text
background -> pads/items -> crocodiles -> jump preview -> frog -> effects
```

- A failed image load must leave gameplay playable by restoring the existing
  procedural Stage 2 water rendering.

## 5. Baseline Alignment

Product / Requirement Baseline:

- User explicitly authorizes a limited Stage 2 background replacement.
- Existing controls, collision truth, and state continuity remain unchanged.

Architecture / Runtime Boundary Baseline:

- `demo/index.html` remains the runtime orchestrator.
- The asset is a cosmetic Canvas input, not a gameplay owner.
- `FrogGameElements` remains the canonical owner for all interactive visuals.

Result: `aligned after this design amendment`.

## 6. Verification

1. The copied asset SHA-256 equals the authorized source hash.
2. Root and frozen baseline HTML hashes remain unchanged.
3. Existing Node suite remains green.
4. A new test confirms the background asset is local and is drawn before
   canonical elements only for Stage 2.
5. Browser verification confirms no console errors, no remote image requests,
   a nonblank Canvas, and visible existing controls/elements over the
   background.
6. Human mobile verification confirms reeds and rain do not obscure targets,
   hazards, frog, HUD, or touch controls.

## 7. Stop Conditions

- Stop if the local asset cannot be loaded without a runtime network request.
- Stop if the centered crop obscures gameplay readability at mobile viewport.
- Stop if Stage 1 behavior, input behavior, or frozen hashes changes.
