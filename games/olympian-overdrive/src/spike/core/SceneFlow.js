// SceneFlow — centralized scene transitions (architecture §5; fixes the v2
// soft-lock bug class). Scenes REQUEST transitions; they never freestyle
// scene.start() with sticky isTransitioning flags. A single in-flight guard is
// cleared in finally, so a crash mid-transition can't permanently lock the game.

export class SceneFlow {
  constructor() {
    this.inFlight = null;
  }

  // go(fromScene, toKey, data) — request a transition. Returns true if accepted.
  go(fromScene, toKey, data = {}) {
    if (this.inFlight) return false;
    this.inFlight = { to: toKey };
    try {
      if (fromScene?.input) fromScene.input.enabled = false;
      fromScene.scene.start(toKey, data);
      return true;
    } finally {
      this.inFlight = null;
    }
  }
}
