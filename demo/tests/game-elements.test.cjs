const test = require('node:test');
const assert = require('node:assert/strict');

const FrogGameElements = require('../src/game-elements.js');

const protectedIds = [
  'frog.player',
  'surface.lily-pad.normal',
  'surface.lily-pad.sinking',
  'hazard.crocodile',
  'hazard.crocodile.warning-wake',
  'reward.flower',
  'reward.golden-lotus',
  'item.bomb',
  'item.bomb-pickup',
  'preview.jump-target',
  'ui.hud',
  'ui.control.dpad',
  'ui.control.bomb'
];

test('version-1 registry contains every protected ID with its approved variants only', () => {
  assert.equal(FrogGameElements.libraryVersion, 1);
  assert.deepEqual(Object.keys(FrogGameElements.protectedElements), protectedIds);
  assert.deepEqual(
    Object.values(FrogGameElements.protectedElements),
    new Array(protectedIds.length).fill('inherit-only')
  );

  const expectedVariants = {
    'frog.player': ['default'],
    'surface.lily-pad.normal': ['default'],
    'surface.lily-pad.sinking': ['default', 'damage'],
    'hazard.crocodile': ['default'],
    'hazard.crocodile.warning-wake': ['default'],
    'reward.flower': ['default'],
    'reward.golden-lotus': ['collectible', 'landmark'],
    'item.bomb': ['default'],
    'item.bomb-pickup': ['default'],
    'preview.jump-target': ['default', 'charged'],
    'ui.hud': ['default'],
    'ui.control.dpad': ['default'],
    'ui.control.bomb': ['default']
  };

  for (const id of protectedIds) {
    const definition = FrogGameElements.getElementDefinition(id);
    assert.deepEqual(definition.variants, expectedVariants[id]);
    for (const variant of definition.variants) {
      assert.equal(FrogGameElements.hasVariant(id, variant), true);
    }
    assert.equal(FrogGameElements.hasVariant(id, 'unapproved'), false);
  }

  assert.equal(FrogGameElements.getElementDefinition('unknown.element'), null);
  assert.equal(FrogGameElements.hasVariant('unknown.element', 'default'), false);
});

test('registry definitions are immutable snapshots', () => {
  const definition = FrogGameElements.getElementDefinition('reward.golden-lotus');

  assert.ok(Object.isFrozen(FrogGameElements.protectedElements));
  assert.ok(Object.isFrozen(definition));
  assert.ok(Object.isFrozen(definition.variants));
  assert.throws(() => definition.variants.push('custom'), TypeError);
  assert.deepEqual(
    FrogGameElements.getElementDefinition('reward.golden-lotus').variants,
    ['collectible', 'landmark']
  );
});

test('normal and sinking lily pads retain their legacy operation order and geometry', () => {
  const normal = record((ctx) => {
    FrogGameElements.drawLilyPad(ctx, 100, 200, 21.12, false, 0);
  });
  const sinking = record((ctx) => {
    FrogGameElements.drawLilyPad(ctx, 100, 200, 21.12, true, 1.6);
  });

  assert.deepEqual(operationNames(normal), [
    'save', 'translate', 'set:fillStyle', 'beginPath', 'ellipse', 'fill',
    'set:fillStyle', 'beginPath', 'arc', 'lineTo', 'closePath', 'fill',
    'set:strokeStyle', 'set:lineWidth', 'stroke', 'restore'
  ]);
  assert.deepEqual(findOperation(normal, 'ellipse'), ['ellipse', 2, 6, 22.176000000000002, 17.952, 0, 0, Math.PI * 2]);
  assert.deepEqual(findOperation(normal, 'arc'), ['arc', 0, 0, 21.12, 0.25, Math.PI * 2 - 0.25]);
  assert.deepEqual(findOperation(normal, 'lineTo'), ['lineTo', 0, 0]);
  assert.equal(findSet(normal, 'fillStyle', 0)[2], 'rgba(10, 30, 45, 0.4)');
  assert.equal(findSet(normal, 'fillStyle', 1)[2], '#2d6a4f');
  assert.equal(findSet(normal, 'strokeStyle')[2], '#52b788');

  assert.deepEqual(operationNames(sinking), [
    'save', 'translate', 'set:fillStyle', 'beginPath', 'ellipse', 'fill',
    'set:fillStyle', 'beginPath', 'arc', 'lineTo', 'closePath', 'fill',
    'set:strokeStyle', 'set:lineWidth', 'stroke', 'set:fillStyle', 'set:font',
    'set:textAlign', 'set:textBaseline', 'fillText', 'restore'
  ]);
  assert.equal(findSet(sinking, 'fillStyle', 1)[2], '#8cb369');
  assert.equal(findSet(sinking, 'strokeStyle')[2], '#bc4749');
  assert.deepEqual(findOperation(sinking, 'fillText'), ['fillText', '⏳', 0, 0]);
});

test('flower and bomb pickup retain their legacy operation order and stable geometry', () => {
  const flower = record((ctx) => {
    FrogGameElements.drawFlower(ctx, 80, 90);
  });
  const bomb = record((ctx) => {
    FrogGameElements.drawBombPickup(ctx, 80, 90);
  });

  assert.deepEqual(operationNames(flower), [
    'save', 'translate', 'set:fillStyle',
    'rotate', 'beginPath', 'ellipse', 'fill',
    'rotate', 'beginPath', 'ellipse', 'fill',
    'rotate', 'beginPath', 'ellipse', 'fill',
    'rotate', 'beginPath', 'ellipse', 'fill',
    'rotate', 'beginPath', 'ellipse', 'fill',
    'rotate', 'beginPath', 'ellipse', 'fill',
    'set:fillStyle', 'beginPath', 'arc', 'fill', 'restore'
  ]);
  assert.deepEqual(findOperation(flower, 'translate'), ['translate', 80, 86]);
  assert.deepEqual(findOperation(flower, 'ellipse'), ['ellipse', 0, 7, 3.5, 7, 0, 0, Math.PI * 2]);
  assert.deepEqual(findOperation(flower, 'arc'), ['arc', 0, 0, 4, 0, Math.PI * 2]);

  assert.deepEqual(operationNames(bomb), [
    'save', 'translate', 'set:fillStyle', 'beginPath', 'arc', 'fill',
    'set:strokeStyle', 'set:lineWidth', 'beginPath', 'moveTo', 'lineTo', 'stroke', 'restore'
  ]);
  assert.deepEqual(findOperation(bomb, 'arc'), ['arc', 0, 2, 7, 0, Math.PI * 2]);
  assert.deepEqual(findOperation(bomb, 'moveTo'), ['moveTo', 2, -4]);
  assert.deepEqual(findOperation(bomb, 'lineTo'), ['lineTo', 6, -8]);
});

test('crocodile body draws without a rectangular warning outline', () => {
  const croc = record((ctx) => {
    FrogGameElements.drawCrocodile(ctx, 60, 70, false);
  });

  assert.deepEqual(operationNames(croc), [
    'save', 'translate', 'scale', 'set:fillStyle', 'beginPath', 'roundRect', 'fill', 'set:fillStyle',
    'beginPath', 'moveTo', 'lineTo', 'lineTo', 'fill',
    'beginPath', 'moveTo', 'lineTo', 'lineTo', 'fill',
    'beginPath', 'moveTo', 'lineTo', 'lineTo', 'fill',
    'beginPath', 'moveTo', 'lineTo', 'lineTo', 'fill',
    'set:fillStyle', 'beginPath', 'arc', 'fill', 'set:fillStyle', 'fillRect', 'restore'
  ]);
  assert.equal(operationNames(croc).includes('strokeRect'), false);
  assert.deepEqual(findOperation(croc, 'roundRect'), ['roundRect', -22, -9, 44, 18, [8, 14, 14, 8]]);
  assert.deepEqual(findOperation(croc, 'arc'), ['arc', 10, -5, 3.5, 0, Math.PI * 2]);
});

test('frog drawing retains legacy jump deformation and geometry', () => {
  const frog = record((ctx) => {
    FrogGameElements.drawFrog(ctx, {
      visualX: 30,
      visualY: 40,
      isJumping: true,
      jumpProgress: 0.5,
      jumpSteps: 2
    });
  });

  assert.deepEqual(operationNames(frog), [
    'save', 'translate', 'translate', 'scale', 'save', 'translate', 'set:fillStyle',
    'beginPath', 'ellipse', 'fill', 'restore', 'set:fillStyle', 'beginPath',
    'ellipse', 'fill', 'set:strokeStyle', 'set:lineWidth', 'stroke', 'set:fillStyle',
    'beginPath', 'arc', 'arc', 'fill', 'stroke', 'set:fillStyle', 'beginPath',
    'arc', 'arc', 'fill', 'set:fillStyle', 'beginPath', 'arc', 'arc', 'fill',
    'set:fillStyle', 'beginPath', 'arc', 'arc', 'fill', 'set:strokeStyle',
    'set:lineWidth', 'beginPath', 'arc', 'stroke', 'restore'
  ]);
  assert.deepEqual(frog.slice(0, 4), [
    ['save'],
    ['translate', 30, 40],
    ['translate', 0, -32],
    ['scale', 0.75, 1.35]
  ]);
  assert.deepEqual(findOperation(frog, 'ellipse'), ['ellipse', 0, 4, 7.466666666666667, 3.7333333333333334, 0, 0, Math.PI * 2]);
  assert.equal(findSet(frog, 'fillStyle', 1)[2], '#9ef01a');
});

test('charged jump preview retains the legacy operation order, color, and radius', () => {
  const preview = record((ctx) => {
    FrogGameElements.drawJumpPreview(ctx, 120, 140, 48, 1.08, 'charged');
  });

  assert.deepEqual(operationNames(preview), [
    'save', 'set:strokeStyle', 'set:fillStyle', 'set:lineWidth', 'setLineDash',
    'beginPath', 'arc', 'fill', 'stroke', 'restore'
  ]);
  assert.equal(findSet(preview, 'strokeStyle')[2], '#ffb703');
  assert.equal(findSet(preview, 'fillStyle')[2], 'rgba(255, 183, 3, 0.18)');
  assert.deepEqual(findOperation(preview, 'arc'), ['arc', 120, 140, 16.5888, 0, Math.PI * 2]);
});

test('golden lotus variants are presentation-only draw operations', () => {
  const collectible = record((ctx) => {
    FrogGameElements.drawGoldenLotus(ctx, 120, 140, 'collectible');
  });
  const landmark = record((ctx) => {
    FrogGameElements.drawGoldenLotus(ctx, 120, 140, 'landmark');
  });

  assert.ok(collectible.length > 0);
  assert.deepEqual(findOperation(collectible, 'scale'), ['scale', 1, 1]);
  assert.deepEqual(findOperation(landmark, 'scale'), ['scale', 1.45, 1.45]);
  assert.equal(operationNames(collectible).includes('fillRect'), false);
  assert.equal(operationNames(landmark).includes('fillRect'), false);
});

function record(draw) {
  const operations = [];
  const ctx = new Proxy({}, {
    get(_target, property) {
      if (property === 'operations') return operations;
      return (...args) => operations.push([property, ...args]);
    },
    set(_target, property, value) {
      operations.push(['set', property, value]);
      return true;
    }
  });
  draw(ctx);
  return operations;
}

function operationNames(operations) {
  return operations.map(([operation, property]) => (
    operation === 'set' ? `set:${property}` : operation
  ));
}

function findOperation(operations, name) {
  return operations.find(([operation]) => operation === name);
}

function findSet(operations, property, occurrence = 0) {
  return operations.filter(([operation, key]) => operation === 'set' && key === property)[occurrence];
}
