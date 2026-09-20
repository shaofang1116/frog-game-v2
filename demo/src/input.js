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

    function reset(showedPreview) {
      if (timerId !== null) clearTimer(timerId);
      timerId = null;
      direction = null;
      isLongPress = false;
      if (showedPreview) onPreviewEnd();
    }

    return {
      start(nextDirection) {
        if (!nextDirection || direction !== null) return;

        direction = nextDirection;
        timerId = setTimer(() => {
          timerId = null;
          isLongPress = true;
          onPreview(direction, 2);
        }, thresholdMs);
      },

      end() {
        if (direction === null) return;

        const jumpDirection = direction;
        const steps = isLongPress ? 2 : 1;
        const showedPreview = isLongPress;
        reset(showedPreview);
        onJump(jumpDirection, steps);
      },

      cancel() {
        if (direction === null) return;
        reset(isLongPress);
      }
    };
  }

  return {
    getKeyboardJump,
    createHoldGesture
  };
});
