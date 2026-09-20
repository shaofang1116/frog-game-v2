(function exposeJourneyPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.FrogJourney = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createJourneyPolicy() {
  function createJourney(options) {
    return {
      currentStage: 1,
      totalStages: options.totalStages,
      rowsPerStage: options.rowsPerStage
    };
  }

  function updateJourney(journey, distance) {
    const result = {
      currentStage: journey.currentStage,
      totalStages: journey.totalStages,
      rowsPerStage: journey.rowsPerStage,
      event: null
    };
    const finalMilestone = journey.totalStages * journey.rowsPerStage;

    if (distance >= finalMilestone) {
      result.event = 'JOURNEY_COMPLETED';
      return result;
    }

    const currentMilestone = journey.currentStage * journey.rowsPerStage;
    if (distance >= currentMilestone && journey.currentStage < journey.totalStages) {
      result.currentStage++;
      result.event = 'STAGE_ADVANCED';
    }

    return result;
  }

  return {
    createJourney,
    updateJourney
  };
});
