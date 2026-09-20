const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getKeyboardJump,
  createHoldGesture,
  createSingleInputBuffer,
  isCompatibilityClick
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

test('a D-Pad gesture is owned by one touch and ends only once', () => {
  const scheduler = createScheduler();
  const events = [];
  const gesture = createHoldGesture({
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
    onPreview: (...args) => events.push(['preview', ...args]),
    onPreviewEnd: () => events.push(['preview-end']),
    onJump: (...args) => events.push(['jump', ...args])
  });

  gesture.start('LEFT', 11);
  gesture.start('RIGHT', 22);
  gesture.end(22);
  gesture.cancel(22);
  scheduler.runPending();

  assert.deepEqual(events, [['preview', 'LEFT', 2]]);

  gesture.end(11);
  gesture.end(11);
  assert.deepEqual(events, [
    ['preview', 'LEFT', 2],
    ['preview-end'],
    ['jump', 'LEFT', 2]
  ]);
});

test('a global interruption cancels the active touch without jumping', () => {
  const scheduler = createScheduler();
  const events = [];
  const gesture = createHoldGesture({
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
    onPreview: (...args) => events.push(['preview', ...args]),
    onPreviewEnd: () => events.push(['preview-end']),
    onJump: (...args) => events.push(['jump', ...args])
  });

  gesture.start('RIGHT', 41);
  scheduler.runPending();

  assert.equal(gesture.cancelActive(), true);
  assert.equal(gesture.end(41), false);
  assert.deepEqual(events, [
    ['preview', 'RIGHT', 2],
    ['preview-end']
  ]);
});

test('a click within 500ms of touch input is treated as compatibility input', () => {
  assert.equal(isCompatibilityClick(1000, 1499), true);
  assert.equal(isCompatibilityClick(1000, 1500), false);
  assert.equal(isCompatibilityClick(0, 200), false);
});

test('the input buffer keeps only the latest jump and consumes it once', () => {
  const buffer = createSingleInputBuffer();

  assert.equal(buffer.take(), null);

  buffer.put({ direction: 'LEFT', steps: 1 });
  buffer.put({ direction: 'UP', steps: 2 });

  assert.deepEqual(buffer.take(), { direction: 'UP', steps: 2 });
  assert.equal(buffer.take(), null);

  buffer.put({ direction: 'RIGHT', steps: 1 });
  buffer.clear();
  assert.equal(buffer.take(), null);
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
