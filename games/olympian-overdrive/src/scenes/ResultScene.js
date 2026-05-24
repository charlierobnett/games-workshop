import Phaser from 'phaser';
import { getGameManager } from '../core/GameManager.js';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
    this.gameManager = null;
    this.result = null;
    this.advanceTimer = null;
  }

  init(data) {
    this.gameManager = getGameManager();
    this.result = data || this.gameManager.getLastResult() || {
      outcome: 'fail',
      scoreDelta: 0,
      sportKey: this.gameManager.getCurrentSportKey() || 'pickleball',
      score: this.gameManager.getScore(),
      lives: this.gameManager.getLives(),
      difficultyLevel: this.gameManager.getDifficultyLevel(),
      multiplier: this.gameManager.getMultiplier(),
      roundIndex: 0
    };
  }

  create() {
    const { width, height } = this.scale;
    const isWin = this.result.outcome === 'win';
    const bgColor = isWin ? 0x1f7a3a : 0x8b1e1e;
    const accentColor = isWin ? '#8cff9b' : '#ff9b9b';

    this.cameras.main.setBackgroundColor(bgColor);

    this.add.rectangle(width * 0.5, height * 0.5, width, height, bgColor, 0.92);

    const title = this.add.text(
      width * 0.5,
      height * 0.34,
      isWin ? 'VICTORY!' : 'FAILED!',
      {
        fontFamily: 'monospace',
        fontSize: '40px',
        fontStyle: 'bold',
        align: 'center'
      }
    ).setOrigin(0.5);
    title.setColor('#ffffff');

    const sportLabel = this.add.text(
      width * 0.5,
      height * 0.47,
      this.formatSportName(this.result.sportKey),
      {
        fontFamily: 'monospace',
        fontSize: '20px',
        align: 'center'
      }
    ).setOrigin(0.5);
    sportLabel.setColor(accentColor);

    const deltaPrefix = this.result.scoreDelta >= 0 ? '+' : '';
    const summary = this.add.text(
      width * 0.5,
      height * 0.58,
      `SCORE ${deltaPrefix}${this.result.scoreDelta}\nTOTAL ${this.result.score}\nLIVES ${this.result.lives}`,
      {
        fontFamily: 'monospace',
        fontSize: '18px',
        align: 'center',
        lineSpacing: 8
      }
    ).setOrigin(0.5);
    summary.setColor('#ffffff');

    const footer = this.add.text(
      width * 0.5,
      height * 0.8,
      this.gameManager.isGameOver() ? 'RUN OVER' : 'NEXT EVENT LOADING...',
      {
        fontFamily: 'monospace',
        fontSize: '16px',
        align: 'center'
      }
    ).setOrigin(0.5);
    footer.setColor('#d8f3ff');

    this.tweens.add({
      targets: [title, sportLabel, summary],
      alpha: { from: 0.6, to: 1 },
      duration: 300,
      yoyo: false
    });

    this.advanceTimer = this.time.delayedCall(1500, () => {
      if (this.gameManager.isGameOver()) {
        this.scene.start('MenuScene', { gameOver: true, result: this.result });
        return;
      }

      const nextSportKey = this.gameManager.prepareNextSport();
      this.scene.start('ActiveScene', { sportKey: nextSportKey });
    });
  }

  shutdown() {
    if (this.advanceTimer) {
      this.advanceTimer.remove(false);
      this.advanceTimer = null;
    }
  }

  formatSportName(sportKey) {
    if (sportKey === 'pickleball') {
      return 'PICKLEBALL';
    }
    if (sportKey === 'soccer') {
      return 'SOCCER';
    }
    if (sportKey === 'mashup-picklesoccer') {
      return 'PICKLE-SOCCER';
    }
    return String(sportKey || 'SPORT').replace(/[-_]/g, ' ').toUpperCase();
  }
}