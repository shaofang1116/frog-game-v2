const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getKeyboardJump,
  createHoldGesture,
  createSwipeHoldGesture,
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

test('a canvas swipe locks its dominant direction and jumps one cell on release', () => {
  const events = [];
  const gesture = createSwipeHoldGesture({
    swipeThreshold: 28,
    onJump: (...args) => events.push(['jump', ...args])
  });

  assert.equal(gesture.start(71, 100, 100), true);
  assert.equal(gesture.move(71, 132, 110), true);
  assert.deepEqual(events, []);

  assert.equal(gesture.end(71), true);
  assert.deepEqual(events, [['jump', 'RIGHT', 1]]);
  assert.equal(gesture.end(71), false);
});

test('holding after canvas direction lock previews and releases a two-cell jump after 320ms', () => {
  const scheduler = createScheduler();
  const events = [];
  const gesture = createSwipeHoldGesture({
    swipeThreshold: 28,
    thresholdMs: 320,
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
    onPreview: (...args) => events.push(['preview', ...args]),
    onPreviewEnd: () => events.push(['preview-end']),
    onJump: (...args) => events.push(['jump', ...args])
  });

  gesture.start(72, 100, 100);
  gesture.move(72, 100, 68);
  scheduler.runPending();
  assert.deepEqual(events, [['preview', 'UP', 2]]);

  gesture.end(72);
  assert.deepEqual(events, [
    ['preview', 'UP', 2],
    ['preview-end'],
    ['jump', 'UP', 2]
  ]);
});

test('a charged canvas swipe keeps its preview and two-cell jump through later drift', () => {
  const scheduler = createScheduler();
  const events = [];
  const gesture = createSwipeHoldGesture({
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
    onPreview: (...args) => events.push(['preview', ...args]),
    onPreviewEnd: () => events.push(['preview-end']),
    onJump: (...args) => events.push(['jump', ...args])
  });

  gesture.start(74, 100, 100);
  gesture.move(74, 140, 100);
  scheduler.runPending();
  gesture.move(74, 156, 102);
  gesture.end(74);

  assert.deepEqual(events, [
    ['preview', 'RIGHT', 2],
    ['preview-end'],
    ['jump', 'RIGHT', 2]
  ]);
  assert.equal(scheduler.getSetCount(), 1);
});

test('an ambiguous diagonal swipe waits for a clear dominant direction before locking', () => {
  const scheduler = createScheduler();
  const events = [];
  const gesture = createSwipeHoldGesture({
    swipeThreshold: 28,
    directionBias: 8,
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
    onJump: (...args) => events.push(['jump', ...args])
  });

  gesture.start(75, 100, 100);
  gesture.move(75, 130, 129);
  assert.equal(scheduler.getSetCount(), 0);

  gesture.move(75, 132, 150);
  assert.equal(scheduler.getSetCount(), 1);
  gesture.end(75);

  assert.deepEqual(events, [['jump', 'DOWN', 1]]);
});

test('canvas movement after direction lock keeps one uninterrupted charge timer', () => {
  const scheduler = createScheduler();
  const events = [];
  const gesture = createSwipeHoldGesture({
    swipeThreshold: 28,
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
    onPreview: (...args) => events.push(['preview', ...args]),
    onPreviewEnd: () => events.push(['preview-end']),
    onJump: (...args) => events.push(['jump', ...args])
  });

  gesture.start(73, 100, 100);
  gesture.move(73, 132, 105);
  assert.equal(scheduler.getSetCount(), 1);

  gesture.move(73, 124, 113);
  gesture.move(73, 118, 126);
  gesture.move(73, 150, 140);
  assert.equal(scheduler.getClearCount(), 0);
  assert.equal(scheduler.getSetCount(), 1);

  scheduler.runPending();
  gesture.end(73);
  assert.deepEqual(events, [
    ['preview', 'RIGHT', 2],
    ['preview-end'],
    ['jump', 'RIGHT', 2]
  ]);
});

test('a canvas swipe is owned by one touch and cancellation never jumps', () => {
  const scheduler = createScheduler();
  const events = [];
  const gesture = createSwipeHoldGesture({
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
    onPreview: (...args) => events.push(['preview', ...args]),
    onPreviewEnd: () => events.push(['preview-end']),
    onJump: (...args) => events.push(['jump', ...args])
  });

  assert.equal(gesture.start(81, 100, 100), true);
  assert.equal(gesture.start(82, 100, 100), false);
  assert.equal(gesture.move(82, 140, 100), false);
  assert.equal(gesture.move(81, 140, 100), true);
  scheduler.runPending();

  assert.equal(gesture.end(82), false);
  assert.equal(gesture.cancel(82), false);
  assert.equal(gesture.cancel(81), true);
  assert.equal(gesture.end(81), false);
  assert.deepEqual(events, [
    ['preview', 'RIGHT', 2],
    ['preview-end']
  ]);
});

test('a global interruption cancels the active canvas swipe without jumping', () => {
  const scheduler = createScheduler();
  const events = [];
  const gesture = createSwipeHoldGesture({
    setTimer: scheduler.setTimer,
    clearTimer: scheduler.clearTimer,
    onPreview: (...args) => events.push(['preview', ...args]),
    onPreviewEnd: () => events.push(['preview-end']),
    onJump: (...args) => events.push(['jump', ...args])
  });

  gesture.start(83, 100, 100);
  gesture.move(83, 100, 60);
  scheduler.runPending();

  assert.equal(gesture.cancelActive(), true);
  assert.equal(gesture.cancelActive(), false);
  assert.equal(gesture.end(83), false);
  assert.deepEqual(events, [
    ['preview', 'UP', 2],
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
  let setCount = 0;
  let clearCount = 0;

  return {
    setTimer(next) {
      setCount++;
      callback = next;
      return 1;
    },
    clearTimer() {
      clearCount++;
      callback = null;
    },
    getSetCount() {
      return setCount;
    },
    getClearCount() {
      return clearCount;
    },
    runPending() {
      const pending = callback;
      callback = null;
      if (pending) pending();
    }
  };
}
