const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getJourneyOptions,
  getStage,
  getStageForRow,
  getCheckpointForRow,
  getThemeMixForRow
} = require('../src/chapters.js');

test('stage definitions own the exact row ranges, checkpoint IDs, and reward constants', () => {
  assert.deepEqual(getStage(1), {
    id: 1,
    name: 'MORNING_MIST',
    startRow: 0,
    endRow: 11,
    themeId: 'MORNING_MIST',
    mapThemePackageId: 'morning-mist',
    reward: {
      score: 150,
      time: 8,
      bomb: 1,
      bombCap: 5
    },
    checkpoint: {
      id: 'stage-1-golden-lotus',
      row: 12
    }
  });
  assert.deepEqual(getStage(2), {
    id: 2,
    name: 'STORM_DEEP_LAKE',
    startRow: 12,
    endRow: 24,
    themeId: 'STORM_DEEP_LAKE',
    mapThemePackageId: 'storm-deep-lake',
    reward: {
      score: 150,
      time: 8,
      bomb: 1,
      finalConversion: true
    },
    checkpoint: {
      id: 'stage-2-golden-lotus',
      row: 24
    }
  });
});

test('row lookups retain checkpoint row ownership and reject invalid rows safely', () => {
  assert.equal(getStageForRow(0).id, 1);
  assert.equal(getStageForRow(11).id, 1);
  assert.equal(getStageForRow(12).id, 2);
  assert.equal(getStageForRow(24).id, 2);
  assert.equal(getStageForRow(-1), null);
  assert.equal(getStageForRow(25), null);
  assert.equal(getStageForRow(12.5), null);
  assert.equal(getStageForRow('12'), null);
  assert.equal(getStage(0), null);

  assert.deepEqual(getCheckpointForRow(12), {
    id: 'stage-1-golden-lotus',
    row: 12
  });
  assert.deepEqual(getCheckpointForRow(24), {
    id: 'stage-2-golden-lotus',
    row: 24
  });
  assert.equal(getCheckpointForRow(11), null);
  assert.equal(getCheckpointForRow(13), null);
  assert.equal(getCheckpointForRow(NaN), null);
});

test('theme mixes use exact normalized transition weights and reject invalid rows safely', () => {
  assert.deepEqual(getThemeMixForRow(9), {
    MORNING_MIST: 1,
    STORM_DEEP_LAKE: 0
  });
  assert.deepEqual(getThemeMixForRow(10), {
    MORNING_MIST: 0.75,
    STORM_DEEP_LAKE: 0.25
  });
  assert.deepEqual(getThemeMixForRow(11), {
    MORNING_MIST: 0.5,
    STORM_DEEP_LAKE: 0.5
  });
  assert.deepEqual(getThemeMixForRow(12), {
    MORNING_MIST: 0.25,
    STORM_DEEP_LAKE: 0.75
  });
  assert.deepEqual(getThemeMixForRow(13), {
    MORNING_MIST: 0,
    STORM_DEEP_LAKE: 1
  });
  assert.equal(getThemeMixForRow(-1), null);
  assert.equal(getThemeMixForRow(25), null);
  assert.equal(getThemeMixForRow(Infinity), null);
});

test('all returned chapter data is deeply immutable and journey options stay compatible', () => {
  const stage = getStage(1);
  const mix = getThemeMixForRow(10);
  const checkpoint = getCheckpointForRow(12);
  const options = getJourneyOptions();

  assert.equal(Object.isFrozen(stage), true);
  assert.equal(Object.isFrozen(stage.reward), true);
  assert.equal(Object.isFrozen(stage.checkpoint), true);
  assert.equal(Object.isFrozen(mix), true);
  assert.equal(Object.isFrozen(checkpoint), true);
  assert.equal(Object.isFrozen(options), true);
  stage.reward.score = 999;
  mix.MORNING_MIST = 0;
  options.totalStages = 99;
  assert.equal(stage.reward.score, 150);
  assert.equal(mix.MORNING_MIST, 0.75);
  assert.deepEqual(options, {
    totalStages: 2,
    rowsPerStage: 12
  });
});
