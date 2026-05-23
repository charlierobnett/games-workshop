import Phaser from 'phaser';

export default class VictoryScene extends Phaser.Scene {
  constructor() { super('VictoryScene'); }

  init(data) { this.finalScore = data.score || 0; }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.add.tileSprite(W / 2, H / 2, W, H, 'bg');

    this.add.text(W / 2, 160, 'YOU WIN!', {
      font: 'bold 56px monospace', fill: '#ffff00', stroke: '#ff8800', strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(W / 2, 250, 'BOSS DEFEATED', {
      font: '24px monospace', fill: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(W / 2, 310, `FINAL SCORE: ${this.finalScore}`, {
      font: '22px monospace', fill: '#00ffff'
    }).setOrigin(0.5);

    const best = localStorage.getItem('spaceHighScore') || 0;
    this.add.text(W / 2, 350, `HIGH SCORE: ${best}`, {
      font: '18px monospace', fill: '#ffff44'
    }).setOrigin(0.5);

    const playAgain = this.add.text(W / 2, 440, 'PRESS SPACE TO PLAY AGAIN', {
      font: 'bold 18px monospace', fill: '#00ff88'
    }).setOrigin(0.5);

    this.tweens.add({ targets: playAgain, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

    // Celebration stars
    for (let i = 0; i < 30; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
        Phaser.Math.Between(2, 6),
        Phaser.Utils.Array.GetRandom([0xffff00, 0xff8800, 0x00ffff, 0xff00ff, 0x00ff00])
      );
      this.tweens.add({
        targets: star, alpha: 0, duration: Phaser.Math.Between(500, 1500),
        yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1000)
      });
    }

    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));

    this.add.text(W / 2, H - 40, 'M — Main Menu', {
      font: '14px monospace', fill: '#666666'
    }).setOrigin(0.5);
    this.input.keyboard.once('keydown-M', () => this.scene.start('MenuScene'));
  }
}