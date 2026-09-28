const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createJourney,
  updateJourney
} = require('../src/journey.js');
const { getJourneyOptions } = require('../src/chapters.js');

test('distance before the first milestone keeps the first stage active', () => {
  const journey = createJourney(getJourneyOptions());

  assert.deepEqual(updateJourney(journey, 11), {
    currentStage: 1,
    totalStages: 2,
    rowsPerStage: 12,
    event: null
  });
});

test('the first milestone advances to stage two without resetting run state', () => {
  const journey = createJourney(getJourneyOptions());
  const runState = { score: 180, timeLeft: 21, bombs: 3 };

  const result = updateJourney(journey, 12);

  assert.equal(result.currentStage, 2);
  assert.equal(result.event, 'STAGE_ADVANCED');
  assert.deepEqual(runState, { score: 180, timeLeft: 21, bombs: 3 });
});

test('the final milestone completes the journey only at row 24', () => {
  const secondStage = updateJourney(createJourney(getJourneyOptions()), 12);

  assert.equal(updateJourney(secondStage, 23).event, null);
  assert.deepEqual(updateJourney(secondStage, 24), {
    currentStage: 2,
    totalStages: 2,
    rowsPerStage: 12,
    event: 'JOURNEY_COMPLETED'
  });
});
