import Phaser from 'phaser';
import { createGameManager } from '../core/GameManager.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.image('player-jack', 'assets/sports/player-jack.png');
    this.load.image('player-ai-pickle', 'assets/sports/player-ai-pickle.png');
    this.load.image('player-goalie', 'assets/sports/player-goalie.png');
    this.load.image('ball-pickle', 'assets/sports/ball-pickle.png');
    this.load.image('ball-soccer', 'assets/sports/ball-soccer.png');
    this.load.image('paddle', 'assets/sports/paddle.png');

    const width = this.scale.width;
    const height = this.scale.height;

    const loadingText = this.add.text(width / 2, height / 2 - 16, 'LOADING...', {
      fontFamily: 'monospace',
      fontSize: '18px'
    }).setOrigin(0.5);
    loadingText.setColor('#ffffff');

    const progressText = this.add.text(width / 2, height / 2 + 16, '0%', {
      fontFamily: 'monospace',
      fontSize: '14px'
    }).setOrigin(0.5);
    progressText.setColor('#00ffff');

    this.load.on('progress', (value) => {
      progressText.setText(`${Math.round(value * 100)}%`);
    });
  }

  create() {
    const gameManager = createGameManager();
    this.game.registry.set('gameManager', gameManager);
    this.game.registry.set('roundDurationMs', 15000);
    this.scene.start('MenuScene');
  }
}