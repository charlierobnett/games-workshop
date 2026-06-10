// runPlan — agnostic-core run construction. It QUERIES the registry for one
// top-down and one side-scroller sport rather than naming them, so the run proves
// (a) both view modes compose in a single run and (b) any conforming sport drops
// in cleanly. Skill indices map rounds onto the Mastery syllabus (MP-02).
//
// Spike slice = 4 rounds (each view twice). The full RS contract is 3 matches x
// 4/5/6 rounds; the spike intentionally runs short to de-risk the architecture.

export function buildSpikeRunPlan(registry, store) {
  const topdown = registry.listSportsByView('topdown')[0];
  const scroller = registry.listSportsByView('sidescroller')[0];
  if (!topdown || !scroller) {
    throw new Error('buildSpikeRunPlan: need at least one topdown and one sidescroller sport');
  }
  const tier = store.data.highestTierReached;
  return {
    tier,
    rounds: [
      { sportId: topdown.id,  viewMode: 'topdown',      difficultyStep: 1, skillIndex: 0 },
      { sportId: scroller.id, viewMode: 'sidescroller', difficultyStep: 1, skillIndex: 2 },
      { sportId: topdown.id,  viewMode: 'topdown',      difficultyStep: 2, skillIndex: 1 },
      { sportId: scroller.id, viewMode: 'sidescroller', difficultyStep: 2, skillIndex: 3 }
    ]
  };
}
