const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getKeyboardJump,
  createHoldGesture
} = require('../src/input.js');

test('Shift plus a direction key requests an immediate two-cell jump', () => {
  assert.deepEqual(getKeyboardJump({ key: 'ArrowUp', shiftKey: true }), {
    direction: 'UP',
    steps: 2
  });
  assert.deepEqual(getKeyboardJump({ key: 'd', shiftKey: false }), {
    direction: 'RIGHT',
    steps: 1
  });
  assert.equal(getKeyboardJump({ key: 'Shift', shiftKey: true }), null);
});

test('a short touch jumps one cell only when released', () => {
  const scheduler = createScheduler();
  const events = [];
  const gesture = createHoldGesture({
    thresholdMs: 320,
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
    onPreview: (...args) => events.push(['preview', ...args]),
    onPreviewEnd: () => events.push(['preview-end']),
    onJump: (...args) => events.push(['jump', ...args])
  });

  gesture.start('LEFT');
  assert.deepEqual(events, []);

  gesture.end();
  assert.deepEqual(events, [['jump', 'LEFT', 1]]);
});

test('holding for 320ms previews and releases a two-cell jump', () => {
  const scheduler = createScheduler();
  const events = [];
  const gesture = createHoldGesture({
    thresholdMs: 320,
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
    onPreview: (...args) => events.push(['preview', ...args]),
    onPreviewEnd: () => events.push(['preview-end']),
    onJump: (...args) => events.push(['jump', ...args])
  });

  gesture.start('UP');
  scheduler.runPending();
  assert.deepEqual(events, [['preview', 'UP', 2]]);

  gesture.end();
  assert.deepEqual(events, [
    ['preview', 'UP', 2],
    ['preview-end'],
    ['jump', 'UP', 2]
  ]);
});

test('cancelling a touch clears preview without jumping', () => {
  const scheduler = createScheduler();
  const events = [];
  const gesture = createHoldGesture({
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
    onPreview: (...args) => events.push(['preview', ...args]),
    onPreviewEnd: () => events.push(['preview-end']),
    onJump: (...args) => events.push(['jump', ...args])
  });

  gesture.start('DOWN');
  scheduler.runPending();
  gesture.cancel();

  assert.deepEqual(events, [
    ['preview', 'DOWN', 2],
    ['preview-end']
  ]);
});

function createScheduler() {
  let callback = null;

  return {
    setTimer(next) {
      callback = next;
      return 1;
    },
    clearTimer() {
      callback = null;
    },
    runPending() {
      const pending = callback;
      callback = null;
      if (pending) pending();
    }
  };
}
