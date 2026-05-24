import Phaser from 'phaser';
import GameManager from '../core/GameManager.js';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
    this.gameActive = true;
    this.player = null;
    this._rollTimer = null;
    this._overlay = null;
    this._text = null;
    this._subText = null;
  }

  init(data) {
    this.gameActive = true;
    this.player = null;

    this._incoming = data ?? {};
    this._outcome = this._incoming.outcome ?? 'fail';
    this._sportKey = this._incoming.sportKey ?? this._incoming.sport ?? null;
    this._scoreDelta = typeof this._incoming.scoreDelta === 'number' ? this._incoming.scoreDelta : 0;
  }

  create() {
    const gm = this._getGameManager();
    if (!gm) {
      this.scene.start('MenuScene');
      return;
    }

    this._applyResult(gm);

    const w = this.scale.width;
    const h = this.scale.height;

    this._overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.75).setDepth(1000);

    const isWin = this._outcome === 'win';
    const flashColor = isWin ? 0x00ff88 : 0xff2d55;

    this.tweens.add({
      targets: this._overlay,
      alpha: { from: 0.2, to: 0.85 },
      duration: 150,
      yoyo: true,
      repeat: 0,
      onStart: () => {
        this._overlay.setFillStyle(flashColor, 0.85);
      },
    });

    const title = isWin ? 'SUCCESS!' : 'FAIL!';
    const titleColor = isWin ? '#00ff88' : '#ff2d55';

    this._text = this.add
      .text(w / 2, h * 0.42, title, {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: titleColor,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(1001);

    const payload = gm.getResultPayload();
    const sportLabel = payload?.sport ? payload.sport.toUpperCase() : 'SPORT';
    const diff = payload?.difficultyMultiplier ?? gm.getDifficultyMultiplier();
    const lives = payload?.lives ?? gm.lives;

    this._subText = this.add
      .text(
        w / 2,
        h * 0.62,
        `SPORT: ${sportLabel}\nSCORE: ${payload?.score ?? gm.score}\nLIVES: ${lives}\nMULT: x${diff.toFixed(2)}`,
        {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#e8f0ff',
          align: 'center',
        }
      )
      .setOrigin(0.5)
      .setDepth(1001);

    const nextDelayMs = 1500;
    this._rollTimer = this.time.delayedCall(nextDelayMs, () => {
      if (!this.gameActive) return;

      if (gm.gameOver) {
        this.scene.start('MenuScene');
        return;
      }

      const nextSportKey = gm.getNextSportKey();
      this.scene.start('ActiveScene', { sportKey: nextSportKey });
    });
  }

  update() {
    if (!this.gameActive) return;
  }

  shutdown() {
    this.gameActive = false;
    if (this._rollTimer) {
      this._rollTimer.remove(false);
      this._rollTimer = null;
    }
  }

  _getGameManager() {
    const gm = this.registry?.get('gameManager');
    if (gm) return gm;

    const fromData = this.scene?.settings?.data?.gameManager;
    if (fromData) return fromData;

    return null;
  }

  _applyResult(gm) {
    const sportKey = this._sportKey ?? gm.currentSportKey ?? null;
    gm.applyResult({
      outcome: this._outcome,
      scoreDelta: this._scoreDelta,
      sportKey,
    });
  }
}