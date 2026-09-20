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

  return {
    getKeyboardJump,
    isCompatibilityClick,
    createSingleInputBuffer,
    createHoldGesture
  };
});
