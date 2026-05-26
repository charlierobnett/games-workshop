import Phaser from 'phaser';
import { createGameManager } from './core/GameManager.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import ActiveScene from './scenes/ActiveScene.js';
import ResultScene from './scenes/ResultScene.js';

const gameManager = createGameManager();

const config = {
  type: Phaser.AUTO,
  width: 640,
  height: 480,
  parent: 'game',
  backgroundColor: '#103a2b',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    MenuScene,
    ActiveScene,
    ResultScene,
  ],
  callbacks: {
    postBoot: (game) => {
      game.registry.set('gameManager', gameManager);
    },
  },
};

new Phaser.Game(config);