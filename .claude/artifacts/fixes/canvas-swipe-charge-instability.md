# Canvas Swipe Charge Instability

Status: `FIXED` (code layer; pending public-device verification)
Date: 2026-09-22
Scope: Canvas blank-area swipe-and-hold only. D-Pad behavior is unaffected.

## Triage

Observed on a real phone:

1. Swipe-and-hold charge sometimes failed to settle.
2. The two-cell target preview could appear and then disappear before release.
3. Direction could lock incorrectly near diagonal movement.

## Confirmed Cause

### Pre-charge movement kept restarting the timer

The gesture required the finger to remain within a moving 12 px stable radius. Normal touch drift repeatedly restarted the 320 ms timer before charge activation, so the preview could fail to appear even while the player kept holding.

Fix: direction lock starts one 320 ms timer. Later movement from the same touch neither restarts nor clears it. Releasing before activation jumps one cell; releasing after activation jumps two cells.

### Direction still needs ambiguity protection

The first movement beyond 28 px immediately chose the larger axis. Near-diagonal input could therefore lock on a difference of only one pixel.

Keep the existing fix: require the dominant axis to lead the secondary axis by at least 8 px before direction lock.

## Research Basis

Repository sources were inspected at fixed commits:

- [Flutter gesture constants](https://github.com/flutter/flutter/tree/a2810c0): touch slop separates intent recognition from the active gesture.
- [React Native Gesture Handler](https://github.com/software-mansion/react-native-gesture-handler/tree/e26231e): recognizers use explicit pre-activation and active states.
- [Hammer.js](https://github.com/hammerjs/hammer.js/tree/ff687ea): pan direction is recognized after a movement threshold.
- [nipplejs](https://github.com/yoannmoinet/nipplejs/tree/ea425b3): joystick direction continues updating without a stationary hold requirement.
- [Godot Virtual Joystick](https://github.com/MarcoFazioRandom/Virtual-Joystick-Godot/tree/b90891e): one touch owns a gesture after dead-zone activation.

The shared pattern is a pre-activation intent threshold followed by a stable active state. None of these implementations supports repeatedly re-arming a hold timer around a moving stability anchor. The selected design therefore keeps the current dead zone and direction bias, but removes the stationary-hold requirement.

## Regression Tests

- `a charged canvas swipe keeps its preview and two-cell jump through later drift`
- `an ambiguous diagonal swipe waits for a clear dominant direction before locking`
- `canvas movement after direction lock keeps one uninterrupted charge timer`

The uninterrupted-timer regression test fails on the prior implementation because movement clears and replaces the timer.

## Red-Green-Red Evidence

1. RED: the uninterrupted-timer test observed timer clears on the prior implementation.
2. GREEN: the test passed after removing stable-radius timer restarts.
3. RED: temporarily restoring the prior restart logic made the test fail again with two unexpected timer clears.
4. GREEN: restoring the new implementation made the same test pass again.

## Verification

```text
node --test demo/tests/*.test.cjs
27 tests, 27 pass, 0 fail

node --check demo/src/input.js
pass

git diff --check
pass
```

Pattern search found the affected timer-restart logic only in `createSwipeHoldGesture()`. The D-Pad implementation `createHoldGesture()` has no behavioral change.

The current and `HEAD` versions of `createHoldGesture()` both hash to:

```text
d3d6ca1aeb109f73e99199ee16d7027cf21eff20e3ddd037de9041917cfa9e6e
```

## Architecture Review

No ownership boundary changed. Input policy remains in `demo/src/input.js`, while `demo/index.html` supplies the direction and timing configuration. No fallback path or duplicate gesture owner was added.

## Remaining Acceptance

Verify on the public build in portrait and landscape:

1. Near-diagonal movement waits until one direction is clear.
2. Continuing to hold after direction lock produces the two-cell target preview without requiring a stationary finger.
3. Movement before or after the preview does not restart or remove the charged state.
4. Release after that movement still jumps two cells.
5. Rotation or cancellation clears the gesture without jumping.
