import Phaser from 'phaser';
import GameManager from '../core/GameManager.js';
import InputManager from '../core/InputManager.js';
import Controller_Pickleball from '../sports/Pickleball/Controller_Pickleball.js';
import LevelManager_Pickleball from '../sports/Pickleball/LevelManager_Pickleball.js';
import Controller_Soccer from '../sports/Soccer/Controller_Soccer.js';
import LevelManager_Soccer from '../sports/Soccer/LevelManager_Soccer.js';
import Mashup_PickleSoccer from '../sports/Mashups/Mashup_PickleSoccer.js';

export default class ActiveScene extends Phaser.Scene {
  constructor() {
    super('ActiveScene');
    this.gameActive = false;

    this.gameManager = null;
    this.inputManager = null;

    this.controller = null;
    this.levelManager = null;

    this.player = null;

    this.hud = {
      scoreText: null,
      diffText: null,
      timerText: null,
    };

    this._sportKey = null;
    this._outcomeLock = false;
  }

  init(data) {
    this._sportKey = data?.sportKey ?? null;
    this._outcomeLock = false;
  }

  create() {
    this.gameActive = true;

    this.gameManager = this.gameManager || this.registry.get('gameManager') || new GameManager();
    this.registry.set('gameManager', this.gameManager);

    this.inputManager = new InputManager(this);

    this._buildSharedHUD();

    this._wireGameOverCallback();

    // Debug: press N to skip to next random sport
    this.input.keyboard.on('keydown-N', () => {
      if (this.gameOver) this.gameOver({ outcome: 'fail', skip: true });
    });

    this._startRound();
  }

  _buildSharedHUD() {
    const { width } = this.scale;

    const scoreText = this.add
      .text(14, 12, 'SCORE: 0', { fontFamily: 'monospace', fontSize: '14px' })
      .setColor('#2ef2ff')
      .setDepth(1000);

    const diffText = this.add
      .text(width - 220, 12, 'x1.00', { fontFamily: 'monospace', fontSize: '14px' })
      .setColor('#7bff00')
      .setDepth(1000);

    const timerText = this.add
      .text(width / 2 - 40, 12, 'TIME', { fontFamily: 'monospace', fontSize: '14px' })
      .setColor('#2ef2ff')
      .setDepth(1000);

    this.hud.scoreText = scoreText;
    this.hud.diffText = diffText;
    this.hud.timerText = timerText;

    this._refreshHUD();
  }

  _refreshHUD() {
    if (!this.gameManager) return;

    if (this.hud.scoreText) this.hud.scoreText.setText(`SCORE: ${this.gameManager.score}`);
    if (this.hud.diffText) this.hud.diffText.setText(`x${this.gameManager.getDifficultyMultiplier().toFixed(2)}`);
  }

  _wireGameOverCallback() {
    this.gameOver = (payload) => {
      if (!this.gameActive || this._outcomeLock) return;
      this._outcomeLock = true;

      const outcome = payload?.outcome ?? 'fail';
      const sportKey = payload?.sportKey ?? this._sportKey ?? this.gameManager?.currentSportKey ?? null;

      const resultPayload = {
        outcome,
        score: this.gameManager?.score ?? 0,
        sport: sportKey,
        difficultyLevel: this.gameManager?.difficultyLevel ?? 0,
        lives: this.gameManager?.lives ?? 0,
        difficultyMultiplier: this.gameManager?.getDifficultyMultiplier?.() ?? 1,
        at: Date.now(),
      };

      this.scene.start('ResultScene', resultPayload);
    };
  }

  _startRound() {
    const sportKey = this._sportKey ?? this.gameManager?.getNextSportKey?.() ?? 'pickleball';

    this._destroyRoundObjects();

    if (sportKey === 'pickleball') {
      this.controller = new Controller_Pickleball(this, this.inputManager);
      this.levelManager = new LevelManager_Pickleball();
      this._setupPlayerForLevel();
      this.levelManager.init(this, this.controller);
    } else if (sportKey === 'soccer') {
      this.controller = new Controller_Soccer(this.inputManager);
      this.levelManager = new LevelManager_Soccer();
      this._setupPlayerForLevel();
      this.levelManager.init(this, this.controller);
    } else if (sportKey === 'mashup_pickle_soccer' || sportKey === 'mashup_picklesoccer' || sportKey === 'mashup') {
      this.controller = null;
      this.levelManager = new Mashup_PickleSoccer();
      this.levelManager.init(this, this.inputManager);
    } else {
      this.controller = new Controller_Pickleball(this, this.inputManager);
      this.levelManager = new LevelManager_Pickleball();
      this._setupPlayerForLevel();
      this.levelManager.init(this, this.controller);
    }

    this._refreshHUD();
  }

  _setupPlayerForLevel() {
    const { width, height } = this.scale;

    const playerSpawnX = 320;
    const playerSpawnY = 390;

    const player = this.add.sprite(playerSpawnX, playerSpawnY, 'playerJack');
    player.setScale(1);
    player.setTint(0xffffff);
    player.setDepth(10);

    this.physics.add.existing(player, false);

    if (player.body) {
      player.body.setAllowGravity(false);
      player.body.setCollideWorldBounds(true);
      player.body.setVelocity(0, 0);
    }

    this.player = player;

    const collisionGroups = {
      PlayerWeapon: 'PlayerWeapon',
      EnvironmentHazard: 'EnvironmentHazard',
      Ball: 'Ball',
      Goal: 'Goal',
    };

    if (this.controller?.init) this.controller.init(player, collisionGroups);
    if (this.controller?.setPlayer) this.controller.setPlayer(player);

    if (this.controller?.attachToScene) this.controller.attachToScene(this);
  }

  _destroyRoundObjects() {
    if (this.levelManager?.destroy) this.levelManager.destroy();
    this.levelManager = null;

    if (this.controller?.destroy) this.controller.destroy();
    this.controller = null;

    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
  }

  update(time, delta) {
    if (!this.gameActive || !this.player) return;

    if (this.inputManager) this.inputManager.update();

    if (this.controller?.update) this.controller.update(time, delta);
    if (this.levelManager?.update) this.levelManager.update(time, delta);

    if (this.hud) this._refreshHUD();
  }

  shutdown() {
    this.gameActive = false;
    this._destroyRoundObjects();

    if (this.inputManager) {
      this.inputManager = null;
    }

    this.hud = { scoreText: null, diffText: null, timerText: null };
  }
}