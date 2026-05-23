import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene'); }

  preload() {
    const W = this.cameras.main.width;
    this.add.rectangle(W / 2, 320, 300, 24, 0x333366);
    const bar = this.add.rectangle(W / 2 - 150, 320, 0, 20, 0x6666ff).setOrigin(0, 0.5);
    this.add.text(W / 2, 290, 'LOADING...', { font: '16px monospace', fill: '#aaaaff' }).setOrigin(0.5);

    this.load.on('progress', (p) => { bar.width = 300 * p; });

    this.load.image('bg', 'assets/backgrounds/darkPurple.png');
    this.load.image('player', 'assets/playerShip1_blue.png');
    this.load.image('enemy1', 'assets/enemies/enemyRed1.png');
    this.load.image('enemy2', 'assets/enemies/enemyRed2.png');
    this.load.image('enemy3', 'assets/enemies/enemyRed3.png');
    this.load.image('boss', 'assets/enemies/ufoRed.png');
    this.load.image('laserBlue', 'assets/lasers/laserBlue01.png');
    this.load.image('laserRed', 'assets/lasers/laserRed01.png');
    this.load.image('meteorBig', 'assets/meteors/meteorBrown_big1.png');
    this.load.image('meteorMed', 'assets/meteors/meteorBrown_med1.png');
    this.load.image('powerupFire', 'assets/powerups/powerupBlue_bolt.png');
    this.load.image('powerupShield', 'assets/powerups/powerupBlue_shield.png');
    this.load.image('powerupStar', 'assets/powerups/powerupBlue_star.png');
  }

  create() { this.scene.start('MenuScene'); }
}