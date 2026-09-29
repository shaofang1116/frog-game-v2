# Morning Pond Background Integration Design

Date: `2026-09-29`
Status: `Approved by user`
Parent:
`docs/aegis/specs/2026-09-28-lake-theme-reward-design.md`
Related:
`docs/aegis/specs/2026-09-29-storm-background-integration-design.md`

## 1. Decision

Use the user-supplied, rights-authorized morning-pond artwork as the Stage 1
Canvas background only. Preserve every existing interactive element and all
gameplay behavior.

This is a narrow exception to the parent design's prior prohibition on direct
use of uploaded artwork. It applies only to the exact asset recorded below and
does not authorize any other uploaded concept image.

## 2. Source Authorization

User authorization recorded on `2026-09-29`:

> "已确认拥有使用权，请更新授权规格并提交接入隔离分支"

Source file:

```text
/Users/bytedance/.trae-cn/attachments/6aa10cd0059b2267a95afa05/
c6990ca7-7a57-45b1-944c-1695557bf9b9_354da88c-562c-4ad3-982d-a0c61f896e64_
晨雾分流荷塘·纯河道俯视底图.jpg
```

SHA-256:

```text
ef04e240c22a6b7853a26e6b44ef045462d597614c31fb69dd6547263d0d6cea
```

Allowed use: local Stage 1 runtime background for Frog Game V2.

## 3. Scope

### In Scope

- Copy the exact authorized image into a local, versioned demo asset path.
- Preload it as a Canvas `Image`.
- During Stage 1, draw it with a contained center crop that fills the Canvas
  viewport before the current world entities render.
- Fall back to the existing procedural water pass if the asset fails to load.
- Add structural and browser verification for local-only loading, draw order,
  nonblank Canvas, and element visibility.

### Out of Scope

- No changes to frog, lily pads, crocodiles, warnings, flowers, golden lotus,
  bombs, jump preview, HUD, D-Pad, buttons, or text.
- No changes to collision boxes, generation, rewards, input, timers, camera
  truth, or Stage 2 state continuity.
- No changes to root `index.html`, frozen baseline HTML, or `demo/src/input.js`.
- No general MapThemePackage import, approval, or receipt operation for this
  narrowly authorized asset.

## 4. Rendering Contract

- Stage 1 uses the authorized morning-pond asset after its load event has
  completed.
- Stage 2 continues to use the independently authorized storm-river asset.
- Both assets are viewport-anchored, not gameplay-anchored: they cannot
  disclose, hide, or mutate `Game.rows`, collision truth, entity positions, or
  camera state.
- The crop preserves the central water corridor. Decorative edge vegetation
  must not cover the Canvas center where targets, hazards, or frog render.
- Existing Canvas render order remains:

```text
background -> pads/items -> crocodiles -> jump preview -> frog -> effects
```

- A failed image load must leave gameplay playable by restoring procedural
  water rendering for the corresponding stage.

## 5. Baseline Alignment

Product / Requirement Baseline:

- User explicitly authorizes a limited Stage 1 background replacement.
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
4. New tests confirm both Stage 1 and Stage 2 assets are local and draw before
   canonical elements only in their corresponding stage.
5. Browser verification confirms no console errors, no remote image requests,
   nonblank Canvas, and visible existing controls/elements for both stages.
6. Human mobile verification confirms edge vegetation does not obscure targets,
   hazards, frog, HUD, or touch controls.

## 7. Stop Conditions

- Stop if the local asset cannot be loaded without a runtime network request.
- Stop if the centered crop obscures gameplay readability at mobile viewport.
- Stop if Stage 2 behavior, input behavior, or frozen hashes changes.
