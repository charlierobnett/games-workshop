import Phaser from 'phaser';
import { getGameManager } from '../core/GameManager.js';
import InputManager from '../core/InputManager.js';
import GameFeel from '../core/GameFeel.js';
import {
  SPORT_PICKLEBALL,
  SPORT_SOCCER,
  SPORT_MASHUP_PICKLE_SOCCER,
} from '../core/sport-keys.js';
import { ASSET_KEYS } from '../assets/asset-keys.js';
import Controller_Pickleball from '../sports/Pickleball/Controller_Pickleball.js';
import LevelManager_Pickleball from '../sports/Pickleball/LevelManager_Pickleball.js';
import Controller_Soccer from '../sports/Soccer/Controller_Soccer.js';
import LevelManager_Soccer from '../sports/Soccer/LevelManager_Soccer.js';

export default class ActiveScene extends Phaser.Scene {
  constructor() {
    super('ActiveScene');
    this.gameActive = false;
    this.roundEnded = false;
    this.player = null;
    this.inputManager = null;
    this.controller = null;
    this.levelManager = null;
    this.gameFeel = null;
    this.gameManager = null;
    this.sportKey = SPORT_PICKLEBALL;
    this.timeRemaining = 15;
    this.scoreText = null;
    this.multText = null;
    this.timeText = null;
    this.livesText = null;
    this.volleyText = null;
    this.lastHorizontal = 0;
    this.lastVertical = 0;
  }

  init(data = {}) {
    this.sportKey = data.sportKey || SPORT_PICKLEBALL;
    this.roundEnded = false;
    this.gameActive = false;
    this.player = null;
    this.controller = null;
    this.levelManager = null;
    this.volleyText = null;
    this.lastHorizontal = 0;
    this.lastVertical = 0;
  }

  create() {
    this.gameManager = this.registry.get('gameManager') || getGameManager();
    this.registry.set('gameManager', this.gameManager);
    this.gameManager.startRound(this.sportKey, 15);

    this.inputManager = new InputManager(this);
    this.gameFeel = new GameFeel(this);

    this.createPlayer();
    this.createHud();
    this.setupSport();
    this.updateHud();

    this.gameFeel.fadeInFromBlack(200);
    this.gameActive = true;
  }

  createPlayer() {
    const spawn = this.getPlayerSpawn(this.sportKey);
    this.player = this.physics.add.sprite(
      spawn.x,
      spawn.y,
      ASSET_KEYS.SHARED_PLAYER_JACK_DEFAULT
    );
    this.player.setDepth(20);
    this.player.setCollideWorldBounds(false);
    this.player.body.setAllowGravity(false);
    this.player.body.setSize(this.player.width * 0.7, this.player.height * 0.75, true);
  }

  getPlayerSpawn(sportKey) {
    if (sportKey === SPORT_SOCCER || sportKey === SPORT_MASHUP_PICKLE_SOCCER) {
      return { x: 320, y: 400 };
    }
    return { x: 320, y: 380 };
  }

  createHud() {
    this.scoreText = this.add.text(12, 10, 'SCORE: 0', {
      fontFamily: 'monospace',
      fontSize: '14px',
    });
    this.scoreText.setDepth(1000);
    this.scoreText.setColor('#ffffff');

    this.livesText = this.add.text(12, 28, 'LIVES: ❤️ ❤️ ❤️', {
      fontFamily: 'monospace',
      fontSize: '14px',
    });
    this.livesText.setDepth(1000);
    this.livesText.setColor('#ff2d55');

    this.timeText = this.add.text(320, 10, 'TIME: 15.0', {
      fontFamily: 'monospace',
      fontSize: '14px',
    });
    this.timeText.setOrigin(0.5, 0);
    this.timeText.setDepth(1000);
    this.timeText.setColor('#ffffff');

    this.multText = this.add.text(628, 10, 'MULT: x1.00', {
      fontFamily: 'monospace',
      fontSize: '14px',
    });
    this.multText.setOrigin(1, 0);
    this.multText.setDepth(1000);
    this.multText.setColor('#2ef2ff');
  }

  setupSport() {
    if (this.sportKey === SPORT_PICKLEBALL) {
      this.setupPickleball();
      return;
    }

    if (this.sportKey === SPORT_SOCCER) {
      this.setupSoccer();
      return;
    }

    if (this.sportKey === SPORT_MASHUP_PICKLE_SOCCER) {
      this.setupMashupPickleSoccer();
      return;
    }

    this.setupPickleball();
  }

  setupPickleball() {
    this.controller = new Controller_Pickleball(this, this.inputManager);
    this.levelManager = new LevelManager_Pickleball();
    const levelState = this.levelManager.init(this, this.controller) || {};
    this.controller.init(this.player, {
      ball: levelState.ball || this.levelManager.ball || null,
    });
  }

  setupSoccer() {
    this.controller = new Controller_Soccer(this);
    this.controller.input = this.inputManager;
    this.levelManager = new LevelManager_Soccer();
    this.levelManager.init(this, this.controller);
  }

  setupMashupPickleSoccer() {
    this.controller = new Controller_Pickleball(this, this.inputManager);
    this.levelManager = new LevelManager_Soccer();
    const levelState = this.levelManager.init(this, {
      init: () => ({})
    }) || {};

    this.controller.init(this.player, {
      ball: levelState.ball || this.levelManager.ball || null,
    });

    if (levelState.ball) {
      this.physics.add.overlap(
        this.controller.paddle,
        levelState.ball,
        () => {
          if (!this.controller || !this.controller.paddleActive || this.roundEnded) {
            return;
          }

          let vx = levelState.ball.x - this.player.x;
          if (Math.abs(vx) < 8) {
            vx = vx >= 0 ? 8 : -8;
          }

          levelState.ball.setVelocity(vx * 4, -300 * 4);
          this.gameFeel.pickleballHit(
            levelState.ball.x,
            levelState.ball.y,
            this.volleyText,
            this.scoreText
          );
        },
        null,
        this
      );
    }
  }

  update(time, delta) {
    if (!this.gameActive || !this.player) return;

    this.handleDebugKeys();
    if (!this.gameActive) return;

    this.logMovementFeel();

    if (this.controller && typeof this.controller.update === 'function') {
      this.controller.update(time, delta);
    }

    if (this.levelManager && typeof this.levelManager.update === 'function') {
      this.levelManager.update(time, delta);
    }

    this.updateTimer(delta);
    this.updateHud();
  }

  logMovementFeel() {
    const horizontal = this.inputManager.Axis_Horizontal();
    const vertical = this.inputManager.Axis_Vertical();

    if (horizontal !== this.lastHorizontal || vertical !== this.lastVertical) {
      this.gameFeel.log('GF-01', 'input sampled to movement', 'latency<=16ms');
      this.gameFeel.log('GF-03', 'instant velocity update', `vx=${horizontal} vy=${vertical}`);
      this.lastHorizontal = horizontal;
      this.lastVertical = vertical;
    }
  }

  updateTimer(delta) {
    if (this.roundEnded) {
      return;
    }

    this.timeRemaining = Math.max(0, this.timeRemaining - (delta / 1000));
    this.gameManager.setRoundTime(this.timeRemaining);

    if (this.timeRemaining <= 0) {
      this.triggerFail();
    }
  }

  updateHud() {
    const state = this.gameManager.getState();
    this.scoreText.setText(`SCORE: ${state.score}`);

    const hearts = Array.from({ length: state.lives }, () => '❤️').join(' ');
    this.livesText.setText(hearts ? `LIVES: ${hearts}` : 'LIVES: 0');

    this.timeText.setText(`TIME: ${this.timeRemaining.toFixed(1)}`);
    this.multText.setText(`MULT: x${state.multiplier.toFixed(2)}`);
    this.multText.setColor(state.multiplier >= 1.5 ? '#7bff00' : '#2ef2ff');
  }

  handleDebugKeys() {
    if (this.inputManager.isMenuDebugPressed()) {
      this.gameActive = false;
      this.scene.start('MenuScene');
      return;
    }

    if (this.inputManager.isFailSkipPressed()) {
      this.gameOver('fail');
      return;
    }

    if (this.inputManager.isWinSkipPressed()) {
      this.gameOver('win');
    }
  }

  triggerFail() {
    if (this.roundEnded) {
      return;
    }

    this.roundEnded = true;
    this.gameFeel.playFailFeedback(this.getBackgroundTargets());
    this.time.delayedCall(400, () => {
      if (this.gameActive) {
        this.gameOver('fail');
      }
    });
  }

  getBackgroundTargets() {
    const targets = [];
    if (this.levelManager && this.levelManager.background) {
      targets.push(this.levelManager.background);
    }
    if (this.levelManager && this.levelManager.court) {
      targets.push(this.levelManager.court);
    }
    if (this.levelManager && this.levelManager.goalZone) {
      targets.push(this.levelManager.goalZone);
    }
    return targets;
  }

  gameOver(outcome) {
    if (!this.gameActive) {
      return;
    }

    this.gameActive = false;
    this.roundEnded = true;

    const baseScore = outcome === 'win' ? 100 : 0;
    this.gameManager.completeRound({ outcome, baseScore });

    this.gameFeel.fadeOutToBlack(300, () => {
      this.scene.start('ResultScene', {
        outcome,
        sportKey: this.sportKey,
      });
    });
  }

  shutdown() {
    if (this.controller && typeof this.controller.destroy === 'function') {
      this.controller.destroy();
    }
    if (this.levelManager && typeof this.levelManager.destroy === 'function') {
      this.levelManager.destroy();
    }
  }

  destroy() {
    this.shutdown();
  }
}