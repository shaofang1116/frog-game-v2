(function exposeChapters(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.FrogChapters = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createChapters() {
  const STAGES = Object.freeze([
    freeze({
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
    }),
    freeze({
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
    })
  ]);
  const JOURNEY_OPTIONS = freeze({
    totalStages: STAGES.length,
    rowsPerStage: 12
  });

  function getJourneyOptions() {
    return JOURNEY_OPTIONS;
  }

  function getStage(stageId) {
    if (!Number.isSafeInteger(stageId)) return null;
    return STAGES.find((stage) => stage.id === stageId) || null;
  }

  function getStageForRow(row) {
    if (!isValidRow(row)) return null;
    return STAGES.find((stage) => row >= stage.startRow && row <= stage.endRow) || null;
  }

  function getCheckpointForRow(row) {
    if (!isValidRow(row)) return null;
    const stage = STAGES.find((candidate) => candidate.checkpoint.row === row);
    return stage ? stage.checkpoint : null;
  }

  function getThemeMixForRow(row) {
    if (!isValidRow(row)) return null;
    if (row <= 9) return THEME_MIXES.morning;
    if (row === 10) return THEME_MIXES.firstBlend;
    if (row === 11) return THEME_MIXES.middleBlend;
    if (row === 12) return THEME_MIXES.lastBlend;
    return THEME_MIXES.storm;
  }

  function isValidRow(row) {
    return Number.isSafeInteger(row) && row >= 0 && row <= 24;
  }

  function freeze(value) {
    Object.keys(value).forEach((key) => {
      if (value[key] && typeof value[key] === 'object') freeze(value[key]);
    });
    return Object.freeze(value);
  }

  const THEME_MIXES = Object.freeze({
    morning: freeze({
      MORNING_MIST: 1,
      STORM_DEEP_LAKE: 0
    }),
    firstBlend: freeze({
      MORNING_MIST: 0.75,
      STORM_DEEP_LAKE: 0.25
    }),
    middleBlend: freeze({
      MORNING_MIST: 0.5,
      STORM_DEEP_LAKE: 0.5
    }),
    lastBlend: freeze({
      MORNING_MIST: 0.25,
      STORM_DEEP_LAKE: 0.75
    }),
    storm: freeze({
      MORNING_MIST: 0,
      STORM_DEEP_LAKE: 1
    })
  });

  return Object.freeze({
    getJourneyOptions,
    getStage,
    getStageForRow,
    getCheckpointForRow,
    getThemeMixForRow
  });
});
