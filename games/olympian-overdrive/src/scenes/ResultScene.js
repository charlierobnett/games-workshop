import Phaser from 'phaser';
import { getGameManager } from '../core/GameManager.js';

const RESULT_SCENE_KEY = 'ResultScene';
const OVERLAY_DURATION = 1500;
const FADE_OUT_START = 1200;
const FADE_OUT_DURATION = 300;

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super(RESULT_SCENE_KEY);
    this.starting = false;
  }

  create(data = {}) {
    this.starting = false;
    this.events.on('wake', () => {
      this.starting = false;
    });
    this.events.on('resume', () => {
      this.starting = false;
    });

    const gameManager = this.registry.get('gameManager') || getGameManager();
    this.registry.set('gameManager', gameManager);

    const outcome = data.outcome || gameManager.lastOutcome || 'fail';
    const baseScore = typeof data.baseScore === 'number' ? data.baseScore : 100;
    const nextSport = data.nextSport || null;
    const completedState = gameManager.completeRound({ outcome, baseScore, nextSport });

    const width = this.scale.width;
    const height = this.scale.height;
    const didWin = outcome === 'win';
    const isGameOver = completedState.lives <= 0;

    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(120, 0, 0, 0);

    const bgColor = didWin ? 0x1f7a33 : 0x5a1020;
    const accentColor = didWin ? '#7bff00' : '#ff2d55';
    const titleText = isGameOver ? 'GAME OVER' : didWin ? 'WIN!' : 'FAIL!';
    const subtitleText = isGameOver
      ? 'Out of lives'
      : didWin
        ? `+${Math.round(baseScore * gameManager.getMultiplier() / (1 + 0.25)) || Math.round(baseScore)} SCORE`
        : 'Try the next event';

    const overlay = this.add.rectangle(width * 0.5, height * 0.5, width, height, bgColor, 0.88);
    overlay.setDepth(10);

    const panel = this.add.rectangle(width * 0.5, height * 0.5, 360, 190, 0x000000, 0.45);
    panel.setStrokeStyle(3, didWin ? 0x7bff00 : 0xff2d55, 0.9);
    panel.setDepth(11);

    const title = this.add.text(width * 0.5, height * 0.5 - 48, titleText, {
      fontFamily: 'monospace',
      fontSize: '34px',
      fontStyle: 'bold',
      align: 'center',
    });
    title.setOrigin(0.5);
    title.setColor(accentColor);
    title.setDepth(12);

    const subtitle = this.add.text(width * 0.5, height * 0.5 - 4, subtitleText, {
      fontFamily: 'monospace',
      fontSize: '16px',
      align: 'center',
    });
    subtitle.setOrigin(0.5);
    subtitle.setColor('#ffffff');
    subtitle.setDepth(12);

    const stats = this.add.text(
      width * 0.5,
      height * 0.5 + 42,
      [
        `SCORE: ${completedState.score}`,
        `MULT: x${completedState.multiplier.toFixed(2)}`,
        `LIVES: ${'❤️ '.repeat(completedState.lives).trim() || '0'}`,
      ].join('\n'),
      {
        fontFamily: 'monospace',
        fontSize: '15px',
        align: 'center',
        lineSpacing: 6,
      }
    );
    stats.setOrigin(0.5);
    stats.setColor('#2ef2ff');
    stats.setDepth(12);

    this.tweens.add({
      targets: [panel, title, subtitle, stats],
      scaleX: { from: 0.92, to: 1 },
      scaleY: { from: 0.92, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 180,
      ease: 'Back.Out',
    });

    this.time.delayedCall(FADE_OUT_START, () => {
      this.cameras.main.fadeOut(FADE_OUT_DURATION, 0, 0, 0);
    });

    this.time.delayedCall(OVERLAY_DURATION, () => {
      if (isGameOver) {
        gameManager.resetRun();
        this.scene.start('MenuScene');
        return;
      }

      this.scene.start('ActiveScene', {
        sportKey: gameManager.getNextSport(),
      });
    });
  }
}