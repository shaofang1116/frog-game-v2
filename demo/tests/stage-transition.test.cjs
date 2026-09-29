const test = require('node:test');
const assert = require('node:assert/strict');

const StageTransition = require('../src/stage-transition.js');

test('the 1100ms transition exposes sweep, covered, and reveal phases at exact boundaries', () => {
  const transition = StageTransition.create({ startTime: 100 });

  assert.equal(transition.duration, 1100);
  assert.deepEqual(transition.update(100), {
    active: true,
    phase: 'covering',
    progress: 0,
    switchStage: false,
    completed: false
  });
  assert.equal(transition.update(519).phase, 'covering');
  assert.deepEqual(transition.update(520), {
    active: true,
    phase: 'covered',
    progress: 420 / 1100,
    switchStage: true,
    completed: false
  });
  assert.equal(transition.update(750).phase, 'covered');
  assert.equal(transition.update(751).phase, 'revealing');
  assert.deepEqual(transition.update(1200), {
    active: false,
    phase: 'complete',
    progress: 1,
    switchStage: false,
    completed: true
  });
});

test('the transition emits the covered-stage switch and completion only once', () => {
  const transition = StageTransition.create({ startTime: 0 });

  assert.equal(transition.update(420).switchStage, true);
  assert.equal(transition.update(421).switchStage, false);
  assert.equal(transition.update(1100).completed, true);
  assert.equal(transition.update(1101).completed, false);
});

test('reduced motion performs one deterministic covered switch before safely completing', () => {
  const transition = StageTransition.create({ startTime: 50, reducedMotion: true });

  assert.deepEqual(transition.update(50), {
    active: true,
    phase: 'covered',
    progress: 1,
    switchStage: true,
    completed: false
  });
  assert.deepEqual(transition.update(51), {
    active: false,
    phase: 'complete',
    progress: 1,
    switchStage: false,
    completed: true
  });
});

test('the giant lily overlay draws leaf paths without clearing the entity render underneath', () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get(_target, property) {
      return (...args) => calls.push([property, ...args]);
    },
    set(_target, property, value) {
      calls.push(['set', property, value]);
      return true;
    }
  });
  const transition = StageTransition.create({ startTime: 0 });

  transition.update(300);
  transition.render(ctx, 390, 844);

  assert.equal(calls.some(([name]) => name === 'clearRect'), false);
  assert.ok(calls.filter(([name]) => name === 'arc').length >= 3);
  assert.ok(calls.some(([name]) => name === 'fill'));
});

test('the covered peak remains a readable giant lily cluster without an opaque full-canvas fill', () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get(_target, property) {
      return (...args) => calls.push([property, ...args]);
    },
    set(_target, property, value) {
      calls.push(['set', property, value]);
      return true;
    }
  });
  const transition = StageTransition.create({ startTime: 0 });

  transition.update(420);
  transition.render(ctx, 390, 844);

  assert.ok(calls.filter(([name]) => name === 'fill').length >= 3);
  assert.ok(calls.filter(([name]) => name === 'stroke').length >= 3);
  assert.equal(calls.some(([name, x, y, width, height]) => (
    name === 'fillRect' && x === 0 && y === 0 && width === 390 && height === 844
  )), false);
});
