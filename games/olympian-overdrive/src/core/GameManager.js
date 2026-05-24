const SPORT_KEYS = ['pickleball', 'soccer'];

class GameManager {
  constructor() {
    this.resetRun();
  }

  resetRun() {
    this.score = 0;
    this.lives = 3;
    this.difficultyLevel = 0;
    this.currentSportKey = null;
    this.lastResult = null;
    this.multiplier = 1;
    this.roundIndex = 0;
  }

  startNewRun(startSportKey = null) {
    this.resetRun();
    this.currentSportKey = startSportKey || this.getNextSportKey(null);
    return this.currentSportKey;
  }

  getScore() {
    return this.score;
  }

  getLives() {
    return this.lives;
  }

  getDifficultyLevel() {
    return this.difficultyLevel;
  }

  getMultiplier() {
    return this.multiplier;
  }

  getCurrentSportKey() {
    return this.currentSportKey;
  }

  getLastResult() {
    return this.lastResult;
  }

  getSportPool() {
    return [...SPORT_KEYS];
  }

  setCurrentSportKey(sportKey) {
    this.currentSportKey = sportKey;
    return this.currentSportKey;
  }

  getNextSportKey(currentSportKey = this.currentSportKey) {
    const pool = SPORT_KEYS.filter((key) => key !== currentSportKey);
    if (pool.length === 0) {
      return currentSportKey || SPORT_KEYS[0];
    }
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }

  applyRoundResult(payload = {}) {
    const outcome = payload.outcome === 'win' ? 'win' : 'fail';
    const scoreDelta = Number.isFinite(payload.scoreDelta) ? payload.scoreDelta : 0;
    const sportKey = payload.sportKey || this.currentSportKey || SPORT_KEYS[0];

    if (outcome === 'win') {
      this.score += scoreDelta;
      this.difficultyLevel += 1;
      this.roundIndex += 1;
    } else {
      this.lives = Math.max(0, this.lives - 1);
      this.roundIndex += 1;
    }

    this.multiplier = 1 + this.difficultyLevel * 0.25;

    this.lastResult = {
      outcome,
      scoreDelta,
      sportKey,
      score: this.score,
      lives: this.lives,
      difficultyLevel: this.difficultyLevel,
      multiplier: this.multiplier,
      roundIndex: this.roundIndex
    };

    return this.lastResult;
  }

  prepareNextSport() {
    const nextSportKey = this.getNextSportKey(this.currentSportKey);
    this.currentSportKey = nextSportKey;
    return nextSportKey;
  }

  isGameOver() {
    return this.lives <= 0;
  }

  toJSON() {
    return {
      score: this.score,
      lives: this.lives,
      difficultyLevel: this.difficultyLevel,
      currentSportKey: this.currentSportKey,
      lastResult: this.lastResult,
      multiplier: this.multiplier,
      roundIndex: this.roundIndex
    };
  }
}

let instance = null;

export function getGameManager() {
  if (!instance) {
    instance = new GameManager();
  }
  return instance;
}

export function createGameManager() {
  instance = new GameManager();
  return instance;
}

export default getGameManager;