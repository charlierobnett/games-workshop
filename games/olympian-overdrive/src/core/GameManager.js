export default class GameManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.score = 0;
    this.lives = 3;
    this.difficultyLevel = 0;
    this.currentSportKey = null;
    this.lastResult = null;
    this.gameOver = false;
  }

  getDifficultyMultiplier() {
    return 1 + this.difficultyLevel * 0.25;
  }

  clampLives() {
    this.lives = Math.max(0, Math.min(99, this.lives));
  }

  applyResult({ outcome, scoreDelta = 0, sportKey }) {
    this.currentSportKey = sportKey ?? this.currentSportKey;

    if (typeof scoreDelta === 'number' && Number.isFinite(scoreDelta)) {
      this.score += scoreDelta;
    }

    if (outcome === 'win') {
      this.difficultyLevel += 1;
    } else if (outcome === 'fail') {
      this.lives -= 1;
      this.clampLives();
    }

    this.lastResult = {
      outcome,
      score: this.score,
      sport: this.currentSportKey,
      difficultyLevel: this.difficultyLevel,
      lives: this.lives,
      difficultyMultiplier: this.getDifficultyMultiplier(),
      at: Date.now(),
    };

    if (this.lives <= 0) this.gameOver = true;
  }

  getNextSportKey() {
    const pool = ['pickleball', 'soccer'];
    if (!this.currentSportKey) return pool[Math.floor(Math.random() * pool.length)];
    if (pool.length === 1) return pool[0];

    let next;
    do {
      next = pool[Math.floor(Math.random() * pool.length)];
    } while (next === this.currentSportKey);
    return next;
  }

  getResultPayload() {
    return this.lastResult ?? {
      outcome: 'fail',
      score: this.score,
      sport: this.currentSportKey,
      difficultyLevel: this.difficultyLevel,
      lives: this.lives,
      difficultyMultiplier: this.getDifficultyMultiplier(),
      at: Date.now(),
    };
  }
}