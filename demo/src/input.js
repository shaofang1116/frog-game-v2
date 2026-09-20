(function exposeInputPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.FrogInput = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createInputPolicy() {
  const directionByKey = {
    arrowup: 'UP',
    w: 'UP',
    arrowdown: 'DOWN',
    s: 'DOWN',
    arrowleft: 'LEFT',
    a: 'LEFT',
    arrowright: 'RIGHT',
    d: 'RIGHT'
  };

  function getKeyboardJump(event) {
    const direction = directionByKey[String(event.key || '').toLowerCase()];
    if (!direction) return null;

    return {
      direction,
      steps: event.shiftKey ? 2 : 1
    };
  }

  function isCompatibilityClick(lastTouchAt, now, suppressionMs = 500) {
    return lastTouchAt > 0 && now - lastTouchAt < suppressionMs;
  }

  function createSingleInputBuffer() {
    let pending = null;

    return {
      put(jump) {
        pending = jump;
      },

      take() {
        const jump = pending;
        pending = null;
        return jump;
      },

      clear() {
        pending = null;
      }
    };
  }

  function createHoldGesture(options) {
    const thresholdMs = options.thresholdMs || 320;
    const setTimer = options.setTimer || setTimeout;
    const clearTimer = options.clearTimer || clearTimeout;
    const onPreview = options.onPreview || function noop() {};
    const onPreviewEnd = options.onPreviewEnd || function noop() {};
    const onJump = options.onJump;

    let direction = null;
    let timerId = null;
    let isLongPress = false;
    let activeTouchId;

    function reset(showedPreview) {
      if (timerId !== null) clearTimer(timerId);
      timerId = null;
      direction = null;
      isLongPress = false;
      activeTouchId = undefined;
      if (showedPreview) onPreviewEnd();
    }

    return {
      start(nextDirection, touchId) {
        if (!nextDirection || direction !== null) return false;

        direction = nextDirection;
        activeTouchId = touchId;
        timerId = setTimer(() => {
          timerId = null;
          isLongPress = true;
          onPreview(direction, 2);
        }, thresholdMs);
        return true;
      },

      end(touchId) {
        if (direction === null || touchId !== activeTouchId) return false;

        const jumpDirection = direction;
        const steps = isLongPress ? 2 : 1;
        const showedPreview = isLongPress;
        reset(showedPreview);
        onJump(jumpDirection, steps);
        return true;
      },

      cancel(touchId) {
        if (direction === null || touchId !== activeTouchId) return false;
        reset(isLongPress);
        return true;
      },

      cancelActive() {
        if (direction === null) return false;
        reset(isLongPress);
        return true;
      }
    };
  }

  function createSwipeHoldGesture(options) {
    const swipeThreshold = options.swipeThreshold || 28;
    const stableRadius = options.stableRadius || 12;
    const thresholdMs = options.thresholdMs || 320;
    const setTimer = options.setTimer || setTimeout;
    const clearTimer = options.clearTimer || clearTimeout;
    const onPreview = options.onPreview || function noop() {};
    const onPreviewEnd = options.onPreviewEnd || function noop() {};
    const onJump = options.onJump;

    let activeTouchId;
    let startX = 0;
    let startY = 0;
    let stableX = 0;
    let stableY = 0;
    let direction = null;
    let timerId = null;
    let isCharged = false;

    function reset() {
      if (timerId !== null) clearTimer(timerId);
      timerId = null;
      activeTouchId = undefined;
      direction = null;
      const showedPreview = isCharged;
      isCharged = false;
      if (showedPreview) onPreviewEnd();
    }

    function startChargeTimer() {
      timerId = setTimer(() => {
        timerId = null;
        isCharged = true;
        onPreview(direction, 2);
      }, thresholdMs);
    }

    function restartChargeAt(x, y) {
      if (timerId !== null) clearTimer(timerId);
      timerId = null;
      if (isCharged) onPreviewEnd();
      isCharged = false;
      stableX = x;
      stableY = y;
      startChargeTimer();
    }

    return {
      start(touchId, x, y) {
        if (activeTouchId !== undefined) return false;
        activeTouchId = touchId;
        startX = x;
        startY = y;
        return true;
      },

      move(touchId, x, y) {
        if (touchId !== activeTouchId) return false;
        if (direction !== null) {
          if (Math.hypot(x - stableX, y - stableY) > stableRadius) {
            restartChargeAt(x, y);
          }
          return true;
        }

        const dx = x - startX;
        const dy = y - startY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (Math.max(absX, absY) <= swipeThreshold) return true;

        direction = absX > absY
          ? (dx > 0 ? 'RIGHT' : 'LEFT')
          : (dy > 0 ? 'DOWN' : 'UP');
        restartChargeAt(x, y);
        return true;
      },

      end(touchId) {
        if (touchId !== activeTouchId) return false;
        const jumpDirection = direction;
        const steps = isCharged ? 2 : 1;
        reset();
        if (jumpDirection !== null) onJump(jumpDirection, steps);
        return true;
      },

      cancel(touchId) {
        if (touchId !== activeTouchId) return false;
        reset();
        return true;
      },

      cancelActive() {
        if (activeTouchId === undefined) return false;
        reset();
        return true;
      }
    };
  }

  return {
    getKeyboardJump,
    isCompatibilityClick,
    createSingleInputBuffer,
    createHoldGesture,
    createSwipeHoldGesture
  };
});
