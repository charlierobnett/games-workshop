import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.add.tileSprite(W / 2, H / 2, W, H, 'bg');
    this.add.image(W / 2, 160, 'player').setScale(1.5).setAlpha(0.7);

    this.add.text(W / 2, 260, 'SPACE SHOOTER', {
      font: 'bold 36px monospace', fill: '#ffffff', stroke: '#3333ff', strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(W / 2, 310, 'Arrow keys to move', {
      font: '16px monospace', fill: '#aaaaff'
    }).setOrigin(0.5);

    this.add.text(W / 2, 330, 'Your ship fires automatically', {
      font: '16px monospace', fill: '#aaaaff'
    }).setOrigin(0.5);

    const highScore = localStorage.getItem('spaceHighScore') || 0;
    this.add.text(W / 2, 380, `HIGH SCORE: ${highScore}`, {
      font: '18px monospace', fill: '#ffff44'
    }).setOrigin(0.5);

    const startText = this.add.text(W / 2, 450, 'PRESS SPACE TO START', {
      font: 'bold 20px monospace', fill: '#00ff88'
    }).setOrigin(0.5);

    this.tweens.add({ targets: startText, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));
  }
}