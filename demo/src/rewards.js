(function exposeRewards(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.FrogRewards = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createRewards() {
  function settleCheckpoint(input, chapter) {
    if (!isValidInput(input) || !isValidChapter(chapter) || !matchesCheckpoint(input, chapter)) {
      return notApplied(input);
    }

    if (input.claimedCheckpointIds.includes(input.checkpointId)) {
      return notApplied(input);
    }

    const claimedCheckpointIds = input.claimedCheckpointIds.concat(input.checkpointId);
    if (chapter.id === 1) {
      return settleStageOne(input, chapter, claimedCheckpointIds);
    }
    return settleStageTwo(input, chapter, claimedCheckpointIds);
  }

  function settleStageOne(input, chapter, claimedCheckpointIds) {
    const nextScore = input.score + chapter.reward.score;
    const nextTimeLeft = input.timeLeft + chapter.reward.time;
    const nextBombs = Math.min(input.bombs + chapter.reward.bomb, chapter.reward.bombCap);
    const grantedBombs = nextBombs - input.bombs;

    return {
      applied: true,
      nextScore,
      nextTimeLeft,
      nextBombs,
      nextClaimedCheckpointIds: claimedCheckpointIds,
      breakdown: {
        scoreBefore: input.score,
        lotusScore: chapter.reward.score,
        scoreAfterLotus: nextScore,
        time: {
          actual: input.timeLeft,
          virtual: chapter.reward.time,
          units: nextTimeLeft,
          bonus: 0
        },
        bombs: {
          actual: input.bombs,
          virtual: chapter.reward.bomb,
          units: nextBombs,
          granted: grantedBombs,
          bonus: 0
        },
        finalScore: nextScore
      }
    };
  }

  function settleStageTwo(input, chapter, claimedCheckpointIds) {
    const timeUnits = input.timeLeft + chapter.reward.time;
    const bombUnits = input.bombs + chapter.reward.bomb;
    const timeBonus = timeUnits * 10;
    const bombBonus = bombUnits * 50;
    const scoreAfterLotus = input.score + chapter.reward.score;
    const nextScore = scoreAfterLotus + timeBonus + bombBonus;

    return {
      applied: true,
      nextScore,
      nextTimeLeft: 0,
      nextBombs: 0,
      nextClaimedCheckpointIds: claimedCheckpointIds,
      breakdown: {
        scoreBefore: input.score,
        lotusScore: chapter.reward.score,
        scoreAfterLotus,
        time: {
          actual: input.timeLeft,
          virtual: chapter.reward.time,
          units: timeUnits,
          bonus: timeBonus
        },
        bombs: {
          actual: input.bombs,
          virtual: chapter.reward.bomb,
          units: bombUnits,
          granted: chapter.reward.bomb,
          bonus: bombBonus
        },
        lotusContribution: chapter.reward.score + chapter.reward.time * 10 + chapter.reward.bomb * 50,
        finalScore: nextScore
      }
    };
  }

  function notApplied(input) {
    const claimedCheckpointIds = input && Array.isArray(input.claimedCheckpointIds)
      ? input.claimedCheckpointIds.slice()
      : [];

    return {
      applied: false,
      nextScore: input && input.score,
      nextTimeLeft: input && input.timeLeft,
      nextBombs: input && input.bombs,
      nextClaimedCheckpointIds: claimedCheckpointIds,
      breakdown: null
    };
  }

  function isValidInput(input) {
    return Boolean(input) &&
      isNonNegativeSafeInteger(input.stageId) &&
      typeof input.checkpointId === 'string' &&
      isNonNegativeSafeInteger(input.score) &&
      isNonNegativeSafeInteger(input.timeLeft) &&
      isNonNegativeSafeInteger(input.bombs) &&
      isUniqueStringArray(input.claimedCheckpointIds);
  }

  function isValidChapter(chapter) {
    return Boolean(chapter) &&
      (chapter.id === 1 || chapter.id === 2) &&
      chapter.reward &&
      chapter.reward.score === 150 &&
      chapter.reward.time === 8 &&
      chapter.reward.bomb === 1 &&
      chapter.checkpoint &&
      typeof chapter.checkpoint.id === 'string' &&
      (chapter.id === 1
        ? chapter.reward.bombCap === 5 && chapter.reward.finalConversion !== true
        : chapter.reward.finalConversion === true);
  }

  function matchesCheckpoint(input, chapter) {
    return input.stageId === chapter.id && input.checkpointId === chapter.checkpoint.id;
  }

  function isNonNegativeSafeInteger(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }

  function isUniqueStringArray(value) {
    return Array.isArray(value) &&
      value.every((item) => typeof item === 'string') &&
      new Set(value).size === value.length;
  }

  return Object.freeze({
    settleCheckpoint
  });
});
