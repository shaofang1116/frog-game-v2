const test = require('node:test');
const assert = require('node:assert/strict');

const { settleCheckpoint } = require('../src/rewards.js');

const stage1 = {
  id: 1,
  reward: {
    score: 150,
    time: 8,
    bomb: 1,
    bombCap: 5
  },
  checkpoint: {
    id: 'stage-1-golden-lotus'
  }
};

const stage2 = {
  id: 2,
  reward: {
    score: 150,
    time: 8,
    bomb: 1,
    finalConversion: true
  },
  checkpoint: {
    id: 'stage-2-golden-lotus'
  }
};

function input(overrides) {
  return {
    stageId: 1,
    checkpointId: 'stage-1-golden-lotus',
    score: 100,
    timeLeft: 20,
    bombs: 2,
    claimedCheckpointIds: [],
    ...overrides
  };
}

test('Stage 1 grants the configured score, time, and bomb reward', () => {
  assert.deepEqual(settleCheckpoint(input(), stage1), {
    applied: true,
    nextScore: 250,
    nextTimeLeft: 28,
    nextBombs: 3,
    nextClaimedCheckpointIds: ['stage-1-golden-lotus'],
    breakdown: {
      scoreBefore: 100,
      lotusScore: 150,
      scoreAfterLotus: 250,
      time: {
        actual: 20,
        virtual: 8,
        units: 28,
        bonus: 0
      },
      bombs: {
        actual: 2,
        virtual: 1,
        units: 3,
        granted: 1,
        bonus: 0
      },
      finalScore: 250
    }
  });
});

test('Stage 1 caps bombs at five and reports the actual zero delta', () => {
  const result = settleCheckpoint(input({ bombs: 5 }), stage1);

  assert.equal(result.applied, true);
  assert.equal(result.nextBombs, 5);
  assert.deepEqual(result.breakdown.bombs, {
    actual: 5,
    virtual: 1,
    units: 5,
    granted: 0,
    bonus: 0
  });
});

test('Stage 2 converts virtual resources from zero inventory and retains exact breakdown', () => {
  const result = settleCheckpoint(input({
    stageId: 2,
    checkpointId: 'stage-2-golden-lotus',
    score: 0,
    timeLeft: 0,
    bombs: 0
  }), stage2);

  assert.deepEqual(result, {
    applied: true,
    nextScore: 280,
    nextTimeLeft: 0,
    nextBombs: 0,
    nextClaimedCheckpointIds: ['stage-2-golden-lotus'],
    breakdown: {
      scoreBefore: 0,
      lotusScore: 150,
      scoreAfterLotus: 150,
      time: {
        actual: 0,
        virtual: 8,
        units: 8,
        bonus: 80
      },
      bombs: {
        actual: 0,
        virtual: 1,
        units: 1,
        granted: 1,
        bonus: 50
      },
      lotusContribution: 280,
      finalScore: 280
    }
  });
});

test('Stage 2 converts nonzero inventory without applying the Stage 1 bomb cap', () => {
  const result = settleCheckpoint(input({
    stageId: 2,
    checkpointId: 'stage-2-golden-lotus',
    score: 100,
    timeLeft: 12,
    bombs: 5
  }), stage2);

  assert.equal(result.nextScore, 750);
  assert.equal(result.nextTimeLeft, 0);
  assert.equal(result.nextBombs, 0);
  assert.deepEqual(result.breakdown, {
    scoreBefore: 100,
    lotusScore: 150,
    scoreAfterLotus: 250,
    time: {
      actual: 12,
      virtual: 8,
      units: 20,
      bonus: 200
    },
    bombs: {
      actual: 5,
      virtual: 1,
      units: 6,
      granted: 1,
      bonus: 300
    },
    lotusContribution: 280,
    finalScore: 750
  });
});

test('invalid values, unknown checkpoints, and mismatched stages fail closed', () => {
  const invalidInputs = [
    input({ score: -1 }),
    input({ timeLeft: 1.5 }),
    input({ bombs: Number.MAX_SAFE_INTEGER + 1 }),
    input({ checkpointId: 'unknown' }),
    input({ stageId: 2 })
  ];

  for (const invalidInput of invalidInputs) {
    const result = settleCheckpoint(invalidInput, stage1);
    assert.equal(result.applied, false);
    assert.equal(result.nextScore, invalidInput.score);
    assert.equal(result.nextTimeLeft, invalidInput.timeLeft);
    assert.equal(result.nextBombs, invalidInput.bombs);
    assert.notEqual(result.nextClaimedCheckpointIds, invalidInput.claimedCheckpointIds);
    assert.deepEqual(result.nextClaimedCheckpointIds, invalidInput.claimedCheckpointIds);
    assert.equal(result.breakdown, null);
  }
});

test('duplicate checkpoint IDs are no-op and inputs remain unchanged', () => {
  const original = input({
    claimedCheckpointIds: ['stage-1-golden-lotus']
  });
  const originalSnapshot = structuredClone(original);
  const stageSnapshot = structuredClone(stage1);

  const result = settleCheckpoint(original, stage1);

  assert.deepEqual(result, {
    applied: false,
    nextScore: 100,
    nextTimeLeft: 20,
    nextBombs: 2,
    nextClaimedCheckpointIds: ['stage-1-golden-lotus'],
    breakdown: null
  });
  assert.notEqual(result.nextClaimedCheckpointIds, original.claimedCheckpointIds);
  assert.deepEqual(original, originalSnapshot);
  assert.deepEqual(stage1, stageSnapshot);
});
