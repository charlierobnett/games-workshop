import Phaser from 'phaser';
import GameManager from '../../core/GameManager.js';

export default class LevelManager_Pickleball {
  constructor() {
    this.scene = null;
    this.controller = null;
    this.gameManager = null;

    this.gameActive = false;

    this.kitchenZone = null;
    this.ball = null;

    this.volleyCount = 0;
    this.targetVolleys = 3;

    this.timerMs = 15000;
    this.timerEvent = null;

    this.roundStartAt = 0;

    this.playerWeaponGroup = null;
    this.environmentHazardGroup = null;
    this.ballGroup = null;

    this.collisionSetupDone = false;

    this.failFired = false;
    this.winFired = false;

    this.aiServePattern = [
      { vx: 80, vy: -300 },
      { vx: -70, vy: -320 },
      { vx: 100, vy: -290 },
      { vx: -90, vy: -310 },
    ];
    this.ballGravity = 700;
    this.serveIndex = 0;

    this.groundY = 420;
    this.courtLeft = 40;
    this.courtRight = 600;
    this.netY = 250;
  }

  init(scene, controller) {
    this.scene = scene;
    this.controller = controller;
    this.gameManager = scene.gameManager instanceof GameManager ? scene.gameManager : scene.gameManager;

    this.gameActive = true;
    this.failFired = false;
    this.winFired = false;

    this.volleyCount = 0;
    this.targetVolleys = 3;

    this.timerMs = 15000;

    this.collisionSetupDone = false;

    this.roundStartAt = Date.now();

    this.buildCourt();
    this.buildGroups();
    this.buildKitchenZone();
    this.buildBall();
    this.buildAI();

    this.startTimer();
    this.setupCollisions();

    this.serveBallDeterministically();
  }

  buildGroups() {
    const physics = this.scene.physics;

    this.playerWeaponGroup = physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      allowGravity: false,
    });

    this.environmentHazardGroup = physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      allowGravity: false,
    });

    this.ballGroup = physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      allowGravity: true,
    });
  }

  buildCourt() {
    const { width, height } = this.scene.scale;

    this.scene.cameras.main.setBackgroundColor('#071018');

    const court = this.scene.add.rectangle(width / 2, height / 2 + 40, 560, 320, 0x0b2a3a, 0.95);
    court.setStrokeStyle(2, 0x2ef2ff, 0.6);

    const net = this.scene.add.rectangle(width / 2, this.netY, 560, 6, 0x00ffd5, 0.9);
    net.setStrokeStyle(2, 0x7bff00, 0.35);

    const floorGlow = this.scene.add.rectangle(width / 2, this.groundY + 10, 560, 30, 0x0a1b24, 0.9);
    floorGlow.setStrokeStyle(2, 0x00aaff, 0.25);

    const leftLine = this.scene.add.rectangle(this.courtLeft, this.groundY - 40, 2, 260, 0x2ef2ff, 0.8);
    const rightLine = this.scene.add.rectangle(this.courtRight, this.groundY - 40, 2, 260, 0x2ef2ff, 0.8);

    this.scene.add.text(20, 20, 'PICKLEBALL', { fontFamily: 'monospace', fontSize: '14px' }).setColor('#2ef2ff');
    this.scene.add.text(width - 220, 20, 'VOLLEYS: 0/3', { fontFamily: 'monospace', fontSize: '14px' }).setColor('#7bff00');

    this.volleyHudText = this.scene.add
      .text(width - 220, 40, 'VOLLEYS: 0/3', { fontFamily: 'monospace', fontSize: '14px' })
      .setColor('#7bff00');

    this.scene.add.rectangle(width / 2, this.groundY + 40, 560, 10, 0x00ffd5, 0.12);

    this.scene.add.text(20, height - 22, 'Avoid kitchen zone when paddle is active', { fontFamily: 'monospace', fontSize: '12px' }).setColor('#00ffd5');
  }

  buildKitchenZone() {
    const { width } = this.scene.scale;

    const zoneW = 140;
    const zoneH = 70;
    const zoneX = width / 2;
    const zoneY = this.groundY - 10;

    this.kitchenZone = this.scene.add.rectangle(zoneX, zoneY, zoneW, zoneH, 0xff2e63, 0.18);
    this.kitchenZone.setStrokeStyle(2, 0xff2e63, 0.55);

    const zone = this.scene.add.zone(zoneX, zoneY, zoneW, zoneH);
    this.scene.physics.add.existing(zone, false);

    this.kitchenZone.physicsZone = zone;

    this.scene.add.text(zoneX - 40, zoneY - 10, 'KITCHEN', { fontFamily: 'monospace', fontSize: '12px' }).setColor('#ff2e63');
  }

  buildBall() {
    const key = 'pickleball-ball';
    const x = this.scene.scale.width / 2;
    const y = this.netY + 40;

    const ball = this.ballGroup.create(x, y, key);
    ball.setOrigin(0.5, 0.5);

    ball.setCollideWorldBounds(false);
    ball.body.setAllowGravity(true);
    ball.body.setGravityY(this.ballGravity);
    ball.body.setImmovable(false);
    ball.body.setVelocity(0, 0);
    ball.body.setBounce(0.6, 0.6);

    ball.setScale(2);

    this.ball = ball;

    this.scene.add.text(20, 40, 'TIME', { fontFamily: 'monospace', fontSize: '12px' }).setColor('#2ef2ff');
    this.timeHudText = this.scene.add
      .text(20, 58, '15.0', { fontFamily: 'monospace', fontSize: '16px' })
      .setColor('#2ef2ff');
  }

  buildAI() {
    this.ai = {
      lastServeAt: 0,
      serveCooldownMs: 0,
    };
  }

  startTimer() {
    if (this.timerEvent) this.timerEvent.remove(false);

    this.roundStartAt = Date.now();

    this.timerEvent = this.scene.time.addEvent({
      delay: this.timerMs,
      callback: () => {
        this.triggerFail('timer');
      },
      callbackScope: this,
    });
  }

  setupCollisions() {
    if (this.collisionSetupDone) return;
    this.collisionSetupDone = true;

    const physics = this.scene.physics;

    physics.add.overlap(this.playerWeaponGroup, this.kitchenZone.physicsZone, () => {
      if (this.controller?.isPaddleActive?.() && !this.failFired && !this.winFired) {
        this.triggerFail('kitchen');
      }
    });

    physics.add.overlap(this.ballGroup, this.playerWeaponGroup, (ball, weapon) => {
      if (this.failFired || this.winFired) return;

      if (!this.controller?.isPaddleActive?.()) return;

      this.onPaddleHit(ball, weapon);
    });

    // (removed buggy ball-kitchen auto-fail — ball passing over kitchen is not a fail)
  }

  onPaddleHit(ball) {
    if (this.failFired || this.winFired) return;

    this.volleyCount += 1;
    this.updateVolleyHud();

    const mult = this.gameManager?.getDifficultyMultiplier?.() ?? 1;
    const speedBoost = 1 + Math.min(1.5, (this.volleyCount * 0.08 + this.gameManager?.difficultyLevel * 0.03) * mult);

    const dir = ball.body.velocity.x >= 0 ? -1 : 1;
    const baseVx = 100 * speedBoost * dir;
    const baseVy = -260 * speedBoost;

    ball.body.setVelocity(baseVx, baseVy);

    this.scene.time.delayedCall(120, () => {
      if (this.failFired || this.winFired) return;
      this.checkWin();
    });
  }

  checkWin() {
    if (this.winFired || this.failFired) return;

    if (this.volleyCount >= this.targetVolleys) {
      this.triggerWin();
    }
  }

  updateVolleyHud() {
    if (!this.volleyHudText) return;
    this.volleyHudText.setText(`VOLLEYS: ${this.volleyCount}/${this.targetVolleys}`);
  }

  serveBallDeterministically() {
    if (!this.ball || this.failFired || this.winFired) return;

    const mult = this.gameManager?.getDifficultyMultiplier?.() ?? 1;
    const pattern = this.aiServePattern[this.serveIndex % this.aiServePattern.length];
    this.serveIndex += 1;

    const vx = pattern.vx * (1 + (this.gameManager?.difficultyLevel ?? 0) * 0.05) * mult;
    const vy = pattern.vy * (1 + (this.gameManager?.difficultyLevel ?? 0) * 0.04) * mult;

    this.ball.setPosition(this.scene.scale.width / 2, this.netY + 40);
    this.ball.body.setVelocity(vx, vy);

    this.ball.body.setDrag(0);
    this.ball.body.setMaxVelocity(9000, 9000);
  }

  triggerWin() {
    if (this.winFired || this.failFired) return;
    this.winFired = true;

    if (this.timerEvent) this.timerEvent.remove(false);

    const scoreDelta = Math.round(100 * (this.gameManager?.getDifficultyMultiplier?.() ?? 1));
    this.gameManager?.applyResult?.({ outcome: 'win', scoreDelta, sportKey: 'pickleball' });

    this.scene.gameOver?.('win');
  }

  triggerFail(reason) {
    if (this.failFired || this.winFired) return;
    this.failFired = true;

    if (this.timerEvent) this.timerEvent.remove(false);

    const scoreDelta = 0;
    this.gameManager?.applyResult?.({ outcome: 'fail', scoreDelta, sportKey: 'pickleball' });

    this.scene.gameOver?.('fail', { reason });
  }

  update(time, delta) {
    if (!this.gameActive || !this.ball) return;

    const elapsed = Date.now() - this.roundStartAt;
    const remaining = Math.max(0, this.timerMs - elapsed);
    if (this.timeHudText) this.timeHudText.setText((remaining / 1000).toFixed(1));

    if (this.failFired || this.winFired) return;

    const y = this.ball.y;
    if (y >= this.groundY) {
      this.triggerFail('ground');
      return;
    }

    const x = this.ball.x;
    if (x <= this.courtLeft - 10 || x >= this.courtRight + 10) {
      this.ball.body.setVelocity(-this.ball.body.velocity.x * 0.9, this.ball.body.velocity.y);
    }

    // Ball plays out naturally — auto re-serve removed so player has time to swing.
  }

  destroy() {
    this.gameActive = false;

    if (this.timerEvent) this.timerEvent.remove(false);

    if (this.playerWeaponGroup) this.playerWeaponGroup.clear(true, true);
    if (this.ballGroup) this.ballGroup.clear(true, true);

    if (this.ball) this.ball.destroy();

    if (this.kitchenZone?.physicsZone) this.kitchenZone.physicsZone.destroy();

    this.kitchenZone = null;
    this.ball = null;
  }
}