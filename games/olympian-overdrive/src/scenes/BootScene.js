import Phaser from 'phaser';
import GameManager from '../core/GameManager.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const make = (key, width, height, drawFn) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.clear();
      drawFn(g);
      g.generateTexture(key, width, height);
      g.destroy();
    };

    // 1x1 white pixel for invisible hitboxes / colliders
    make('pixel', 1, 1, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 1, 1);
    });

    // Jack — 24x32 character sprite
    make('playerJack', 24, 32, (g) => {
      g.fillStyle(0x2ec4ff, 1);
      g.fillRect(4, 8, 16, 18);
      g.fillStyle(0xffd49a, 1);
      g.fillRect(6, 0, 12, 10);
      g.fillStyle(0x1a1a1a, 1);
      g.fillRect(8, 3, 2, 2);
      g.fillRect(14, 3, 2, 2);
      g.fillStyle(0xff2bd6, 1);
      g.fillRect(4, 26, 6, 6);
      g.fillRect(14, 26, 6, 6);
    });

    // Pickleball — yellow with holes
    make('pickleball-ball', 16, 16, (g) => {
      g.fillStyle(0xffe600, 1);
      g.fillCircle(8, 8, 7);
      g.fillStyle(0x1a1a1a, 1);
      g.fillCircle(5, 6, 1);
      g.fillCircle(10, 9, 1);
      g.fillCircle(7, 11, 1);
    });

    // Soccer ball — white with black pentagons
    make('soccerBall', 16, 16, (g) => {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(8, 8, 7);
      g.fillStyle(0x0b0b0b, 1);
      g.fillRect(7, 4, 2, 8);
      g.fillRect(4, 7, 8, 2);
    });

    // Paddle — neon green
    make('paddle', 28, 12, (g) => {
      g.fillStyle(0x00ff6a, 1);
      g.fillRoundedRect(0, 2, 28, 8, 3);
      g.fillStyle(0x004a1f, 1);
      g.fillRoundedRect(2, 4, 24, 4, 2);
    });

    // Kitchen zone indicator (translucent magenta)
    make('kitchen-ball', 64, 16, (g) => {
      g.fillStyle(0xff2bd6, 0.3);
      g.fillRect(0, 0, 64, 16);
      g.lineStyle(2, 0xff2bd6, 1);
      g.strokeRect(0, 0, 64, 16);
    });

    // Goal — blue net
    make('goal', 48, 64, (g) => {
      g.fillStyle(0x00b3ff, 1);
      g.fillRect(0, 0, 48, 6);
      g.fillRect(0, 0, 4, 64);
      g.fillRect(44, 0, 4, 64);
      g.lineStyle(1, 0x00e5ff, 0.7);
      for (let i = 8; i < 48; i += 6) {
        g.beginPath();
        g.moveTo(i, 8);
        g.lineTo(i, 60);
        g.strokePath();
      }
    });
  }

  create() {
    const gm = new GameManager();
    this.game.registry.set('gameManager', gm);
    this.scene.start('MenuScene');
  }
}
