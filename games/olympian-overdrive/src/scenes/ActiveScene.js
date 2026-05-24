import Phaser from 'phaser';
import { getGameManager } from '../core/GameManager.js';
import InputManager from '../core/InputManager.js';
import Controller_Pickleball from '../sports/Pickleball/Controller_Pickleball.js';
import LevelManager_Pickleball from '../sports/Pickleball/LevelManager_Pickleball.js';
import Controller_Soccer from '../sports/Soccer/Controller_Soccer.js';
import LevelManager_Soccer from '../sports/Soccer/LevelManager_Soccer.js';
import Mashup_PickleSoccer from '../sports/Mashups/Mashup_PickleSoccer.js';

const SPORT_DEFS = {
  pickleball: {
    createController(scene, inputManager) {
      return new Controller_Pickleball(scene, inputManager);
    },
    createLevelManager() {
      return new LevelManager_Pickleball();
    }
  },
  soccer: {
    createController(scene, inputManager) {
      return new Controller_Soccer(scene, inputManager);
    },
    createLevelManager() {
      return new LevelManager_Soccer();
    }
  },
  'mashup-pickle-soccer': Mashup_PickleSoccer
};

export default class ActiveScene extends Phaser.Scene {
  constructor() {
    super('ActiveScene');
    this.gameManager = null;
    this.inputManager = null;
    this.player = null;
    this.controller = null;
    this.levelManager = null;
    this.sportKey = 'pickleball';
    this.roundDuration = 15000;
    this.roundEndAt = 0;
    this.gameActive = false;
    this.gameOverTriggered = false;
    this.hud = {};
  }

  create(data = {}) {
    this.gameManager = getGameManager();
    this.inputManager = new InputManager(this);

    this.sportKey = data.sportKey || this.gameManager.getCurrentSportKey() || 'pickleball';
    this.gameManager.setCurrentSportKey(this.sportKey);

    this.physics.world.setBounds(0, 0, 640, 480);
    this.cameras.main.setBackgroundColor('#103a2b');

    this.createBackground();
    this.createPlayer();
    this.createHud();
    this.createSportSystems();

    this.roundEndAt = this.time.now + this.roundDuration;
    this.gameActive = true;
    this.gameOverTriggered = false;

    // Dev keys: N = fail+skip, W = win+next, 0 = return to menu
    this.input.keyboard.on('keydown-N', () => this.devSkip('fail'));
    this.input.keyboard.on('keydown-W', () => this.devSkip('win'));
    this.input.keyboard.on('keydown-ZERO', () => this.scene.start('MenuScene'));
  }

  devSkip(outcome) {
    if (this.gameOverTriggered) return;
    this.gameOverTriggered = true;
    this.gameActive = false;
    this.gameManager.applyRoundResult({ outcome, sportKey: this.sportKey, scoreDelta: outcome === 'win' ? 50 : 0 });
    this.scene.start('ResultScene', { outcome, sportKey: this.sportKey });
  }

  createBackground() {
    const bg = this.add.graphics();
    bg.fillStyle(0x0f2f24, 1);
    bg.fillRect(0, 0, 640, 480);
  }

  createPlayer() {
    const spawn = this.getPlayerSpawn(this.sportKey);

    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'player-jack');
    this.player.body.setAllowGravity(false);
    this.player.setCollideWorldBounds(false);
    this.player.setDepth(10);
  }

  getPlayerSpawn(sportKey) {
    if (sportKey === 'soccer' || sportKey === 'mashup-pickle-soccer') {
      return { x: 320, y: 400 };
    }
    return { x: 320, y: 380 };
  }

  createSportSystems() {
    const sportDef = SPORT_DEFS[this.sportKey] || SPORT_DEFS.pickleball;

    this.controller = sportDef.createController(this, this.inputManager);
    this.controller.init(this.player);

    this.levelManager = sportDef.createLevelManager();
    this.levelManager.init(this, this.controller);
  }

  createHud() {
    this.hud.scoreText = this.add.text(12, 10, '', {
      fontFamily: 'monospace',
      fontSize: '14px'
    }).setDepth(1000);
    this.hud.scoreText.setColor('#ffffff');

    this.hud.livesText = this.add.text(12, 28, '', {
      fontFamily: 'monospace',
      fontSize: '14px'
    }).setDepth(1000);
    this.hud.livesText.setColor('#ff4d4d');

    this.hud.timeText = this.add.text(320, 10, '', {
      fontFamily: 'monospace',
      fontSize: '14px'
    }).setOrigin(0.5, 0).setDepth(1000);
    this.hud.timeText.setColor('#66f0ff');

    this.hud.multText = this.add.text(628, 10, '', {
      fontFamily: 'monospace',
      fontSize: '14px'
    }).setOrigin(1, 0).setDepth(1000);

    this.hud.sportText = this.add.text(628, 28, this.getSportLabel(), {
      fontFamily: 'monospace',
      fontSize: '12px'
    }).setOrigin(1, 0).setDepth(1000);
    this.hud.sportText.setColor('#d7d7d7');

    this.refreshHud();
  }

  getSportLabel() {
    if (this.sportKey === 'mashup-pickle-soccer') {
      return 'PICKLE SOCCER';
    }
    return this.sportKey.toUpperCase();
  }

  refreshHud() {
    if (!this.hud.scoreText) return;

    this.hud.scoreText.setText(`SCORE: ${this.gameManager.getScore()}`);
    this.hud.livesText.setText(`LIVES: ${this.gameManager.getLives()}`);

    const multiplier = this.gameManager.getMultiplier();
    this.hud.multText.setText(`MULT: x${multiplier.toFixed(2)}`);
    this.hud.multText.setColor(multiplier >= 1.5 ? '#ffd54a' : '#66ff88');

    const remainingMs = Math.max(0, this.roundEndAt - this.time.now);
    this.hud.timeText.setText(`TIME: ${(remainingMs / 1000).toFixed(1)}`);
  }

  update(time, delta) {
    if (!this.gameActive || !this.player) return;

    if (this.inputManager.isDebugNextJustPressed()) {
      this.gameOver({
        outcome: 'fail',
        scoreDelta: 0,
        sportKey: this.sportKey
      });
      return;
    }

    this.refreshHud();

    if (time >= this.roundEndAt) {
      if (this.levelManager && typeof this.levelManager.onTimeExpired === 'function') {
        this.levelManager.onTimeExpired();
      } else {
        this.gameOver({
          outcome: 'fail',
          scoreDelta: 0,
          sportKey: this.sportKey
        });
      }
      return;
    }

    if (this.controller && typeof this.controller.update === 'function') {
      this.controller.update(time, delta);
    }

    if (this.levelManager && typeof this.levelManager.update === 'function') {
      this.levelManager.update(time, delta);
    }
  }

  gameOver(payload = {}) {
    if (this.gameOverTriggered) {
      return;
    }

    this.gameOverTriggered = true;
    this.gameActive = false;

    const result = this.gameManager.applyRoundResult({
      outcome: payload.outcome,
      scoreDelta: payload.scoreDelta,
      sportKey: payload.sportKey || this.sportKey
    });

    this.time.delayedCall(50, () => {
      this.scene.start('ResultScene', result);
    });
  }

  shutdown() {
    this.gameActive = false;

    if (this.levelManager && typeof this.levelManager.destroy === 'function') {
      this.levelManager.destroy();
    }
    this.levelManager = null;

    if (this.controller && typeof this.controller.destroy === 'function') {
      this.controller.destroy();
    }
    this.controller = null;

    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
  }

  destroy() {
    this.shutdown();
  }
}