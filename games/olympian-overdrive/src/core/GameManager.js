import { getRandomBaseSportKey, isValidSportKey } from './sport-keys.js';

class GameManager {
  constructor() {
    this.resetRun();
  }

  resetRun() {
    this.score = 0;
    this.lives = 3;
    this.difficultyLevel = 0;
    this.multiplier = 1;
    this.roundTime = 15;
    this.currentSport = null;
    this.nextSport = getRandomBaseSportKey();
    this.lastOutcome = null;
    this.roundsPlayed = 0;
  }

  getState() {
    return {
      score: this.score,
      lives: this.lives,
      difficultyLevel: this.difficultyLevel,
      multiplier: this.multiplier,
      roundTime: this.roundTime,
      currentSport: this.currentSport,
      nextSport: this.nextSport,
      lastOutcome: this.lastOutcome,
      roundsPlayed: this.roundsPlayed,
    };
  }

  setCurrentSport(sportKey) {
    if (!isValidSportKey(sportKey)) {
      return false;
    }
    this.currentSport = sportKey;
    return true;
  }

  setNextSport(sportKey) {
    if (!isValidSportKey(sportKey)) {
      return false;
    }
    this.nextSport = sportKey;
    return true;
  }

  getCurrentSport() {
    return this.currentSport;
  }

  getNextSport() {
    if (!this.nextSport || !isValidSportKey(this.nextSport)) {
      this.nextSport = getRandomBaseSportKey();
    }
    return this.nextSport;
  }

  getMultiplier() {
    return 1 + (this.difficultyLevel * 0.25);
  }

  refreshMultiplier() {
    this.multiplier = this.getMultiplier();
    return this.multiplier;
  }

  addScore(basePoints) {
    const awarded = Math.round(basePoints * this.getMultiplier());
    this.score += awarded;
    this.refreshMultiplier();
    return awarded;
  }

  loseLife(amount = 1) {
    this.lives = Math.max(0, this.lives - amount);
    return this.lives;
  }

  gainLife(amount = 1) {
    this.lives += amount;
    return this.lives;
  }

  setRoundTime(seconds) {
    this.roundTime = seconds;
    return this.roundTime;
  }

  startRound(sportKey, roundTime = 15) {
    if (sportKey) {
      this.setCurrentSport(sportKey);
    }
    this.setRoundTime(roundTime);
    this.refreshMultiplier();
    this.lastOutcome = null;
    return this.getState();
  }

  completeRound({ outcome, baseScore = 100, nextSport = null } = {}) {
    const didWin = outcome === 'win';
    const didFail = outcome === 'fail';

    if (!didWin && !didFail) {
      return this.getState();
    }

    this.lastOutcome = outcome;
    this.roundsPlayed += 1;

    if (didWin) {
      this.addScore(baseScore);
      this.difficultyLevel += 1;
    } else {
      this.loseLife(1);
    }

    this.refreshMultiplier();

    if (nextSport && isValidSportKey(nextSport)) {
      this.nextSport = nextSport;
    } else {
      this.nextSport = getRandomBaseSportKey();
    }

    return this.getState();
  }

  isGameOver() {
    return this.lives <= 0;
  }

  serialize() {
    return this.getState();
  }

  hydrate(data = {}) {
    if (typeof data.score === 'number') this.score = data.score;
    if (typeof data.lives === 'number') this.lives = data.lives;
    if (typeof data.difficultyLevel === 'number') this.difficultyLevel = data.difficultyLevel;
    if (typeof data.roundTime === 'number') this.roundTime = data.roundTime;
    if (typeof data.roundsPlayed === 'number') this.roundsPlayed = data.roundsPlayed;
    if (typeof data.lastOutcome === 'string' || data.lastOutcome === null) this.lastOutcome = data.lastOutcome;
    if (typeof data.currentSport === 'string' && isValidSportKey(data.currentSport)) this.currentSport = data.currentSport;
    if (typeof data.nextSport === 'string' && isValidSportKey(data.nextSport)) {
      this.nextSport = data.nextSport;
    } else if (!this.nextSport) {
      this.nextSport = getRandomBaseSportKey();
    }
    this.refreshMultiplier();
    return this;
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