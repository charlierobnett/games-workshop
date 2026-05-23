import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) { this.finalScore = data.score || 0; }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.add.tileSprite(W / 2, H / 2, W, H, 'bg').setAlpha(0.4);

    this.add.text(W / 2, 200, 'GAME OVER', {
      font: 'bold 48px monospace', fill: '#ff2222', stroke: '#880000', strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(W / 2, 290, `SCORE: ${this.finalScore}`, {
      font: '24px monospace', fill: '#ffffff'
    }).setOrigin(0.5);

    const best = localStorage.getItem('spaceHighScore') || 0;
    this.add.text(W / 2, 330, `BEST: ${best}`, {
      font: '20px monospace', fill: '#ffff44'
    }).setOrigin(0.5);

    const restartText = this.add.text(W / 2, 420, 'PRESS SPACE TO TRY AGAIN', {
      font: 'bold 18px monospace', fill: '#00ff88'
    }).setOrigin(0.5);

    this.tweens.add({ targets: restartText, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));

    this.add.text(W / 2, H - 40, 'M — Main Menu', {
      font: '14px monospace', fill: '#666666'
    }).setOrigin(0.5);
    this.input.keyboard.once('keydown-M', () => this.scene.start('MenuScene'));
  }
}