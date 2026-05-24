import Phaser from 'phaser';
import GameManager from '../../core/GameManager.js';

export default class LevelManager_Soccer {
  constructor() {
    this.scene = null;
    this.controller = null;
    this.gameManager = null;

    this.gameActive = true;

    this.player = null;

    this.ball = null;
    this.goalTrigger = null;
    this.goalBlockedCount = 0;

    this.timerEvent = null;
    this.roundDurationMs = 15000;

    this.kickCooldownMs = 0;
    this.invulnMs = 1500;

    this.collisionGroups = {
      PlayerWeapon: 'PlayerWeapon',
      EnvironmentHazard: 'EnvironmentHazard',
      Ball: 'Ball',
      Goal: 'Goal',
    };

    this.hitStopMs = 50;
    this.difficultyMultiplier = 1;

    this.goalWidth = 120;
    this.goalHeight = 90;

    this.goalX = 560;
    this.goalY = 240;

    this.fieldLeft = 40;
    this.fieldRight = 600;
    this.groundY = 380;

    this.hazardTop = 120;
    this.hazardBottom = 340;

    this.goalie = null;
    this.goalieMoveDir = 1;
    this.goalieSpeedBase = 90;

    this.chargeMaxMs = 500;
    this.chargeMinForce = 220;
    this.chargeMaxForce = 520;

    this.ballBaseSpeed = 220;

    this._onBallGoalOverlap = null;
    this._onBallGroundHit = null;
    this._onBallGoalieHit = null;
  }

  init(scene, controller) {
    this.scene = scene;
    this.controller = controller;
    this.gameManager = scene.gameManager instanceof GameManager ? scene.gameManager : scene.gameManager;

    this.gameActive = true;
    this.goalBlockedCount = 0;

    this.difficultyMultiplier = this.gameManager?.getDifficultyMultiplier?.() ?? 1;

    this._buildWorld();
    this._wireCollisions();
    this._startTimer();

    if (this.controller?.setFacing) this.controller.setFacing(1);

    this._serveBallDeterministic();
  }

  destroy() {
    this.gameActive = false;
    if (this.timerEvent) this.timerEvent.remove(false);
    this.timerEvent = null;

    if (this.ball && this.ball.body) {
      this.ball.body.enable = false;
    }

    if (this.scene) {
      if (this._onBallGoalOverlap && this.goalTrigger) {
        this.scene.physics.world.removeCollider(this._onBallGoalOverlap);
      }
      if (this._onBallGroundHit && this.ball) {
        this.scene.physics.world.removeCollider(this._onBallGroundHit);
      }
      if (this._onBallGoalieHit && this.ball) {
        this.scene.physics.world.removeCollider(this._onBallGoalieHit);
      }
    }
  }

  _buildWorld() {
    const { width, height } = this.scene.scale;

    this.scene.cameras.main.setBackgroundColor('#0b1020');

    const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x0b1020).setDepth(-10);
    bg.setAlpha(1);

    const ground = this.scene.add.rectangle(width / 2, this.groundY + 10, width - 80, 30, 0x0f2a3a, 0.9);
    this.scene.physics.add.existing(ground, true);

    ground.body.setImmovable(true);
    ground.body.allowGravity = false;

    const fieldLine = this.scene.add.rectangle(width / 2, this.groundY, width - 80, 2, 0x2bffea, 0.35);
    fieldLine.setDepth(-5);

    const goalTopLeft = this.goalX - this.goalWidth / 2;
    const goalBottomRight = this.goalX + this.goalWidth / 2;

    const goalRect = this.scene.add.rectangle(this.goalX, this.goalY, this.goalWidth, this.goalHeight, 0x0a0a0a, 0.15);
    goalRect.setStrokeStyle(2, 0x2bffea, 0.8);

    const net = this.scene.add.rectangle(this.goalX, this.goalY, this.goalWidth - 10, this.goalHeight - 10, 0x2bffea, 0.08);
    net.setDepth(1);

    this.goalTrigger = this.scene.add.zone(this.goalX, this.goalY, this.goalWidth - 20, this.goalHeight - 20);
    this.scene.physics.add.existing(this.goalTrigger);
    this.goalTrigger.body.setAllowGravity(false);
    this.goalTrigger.body.setImmovable(true);

    const goalieX = this.goalX - 10;
    const goalieY = this.goalY;

    const goalieSprite = this.scene.add.sprite(goalieX, goalieY, 'playerJack');
    goalieSprite.setScale(0.9);
    goalieSprite.setTint(0x2bffea);
    goalieSprite.setDepth(5);

    this.scene.physics.add.existing(goalieSprite);
    goalieSprite.body.setAllowGravity(false);
    goalieSprite.body.setImmovable(true);

    this.goalie = goalieSprite;
    this.goalieMoveDir = 1;

    const goalieW = goalieSprite.displayWidth;
    const goalieH = goalieSprite.displayHeight;

    const goalieHit = this.scene.add.rectangle(goalieX, goalieY, goalieW * 0.7, goalieH * 0.9, 0x2bffea, 0.0);
    this.scene.physics.add.existing(goalieHit);
    goalieHit.body.setAllowGravity(false);
    goalieHit.body.setImmovable(true);
    goalieHit.setDepth(6);

    this.goalieHitbox = goalieHit;

    this.scene.events.once('shutdown', () => {
      if (this.goalieHitbox) this.goalieHitbox.destroy();
    });

    const playerSpawnX = 140;
    const playerSpawnY = this.groundY - 28;

    const playerSprite = this.scene.add.sprite(playerSpawnX, playerSpawnY, 'playerJack');
    playerSprite.setScale(1);
    playerSprite.setTint(0xffffff);
    playerSprite.setDepth(10);

    this.scene.physics.add.existing(playerSprite);
    playerSprite.body.setAllowGravity(false);
    playerSprite.body.setImmovable(false);
    playerSprite.body.setVelocity(0, 0);

    this.player = playerSprite;

    if (this.controller?.attachToScene) {
      this.controller.attachToScene(this.scene);
    }

    if (this.controller?.setPlayer) this.controller.setPlayer(this.player);

    this.scene.physics.add.collider(this.player, ground);

    const ballStartX = 260;
    const ballStartY = this.groundY - 18;

    const ballSprite = this.scene.add.sprite(ballStartX, ballStartY, 'soccerBall');
    ballSprite.setScale(1);
    ballSprite.setDepth(7);

    this.scene.physics.add.existing(ballSprite);
    ballSprite.body.setAllowGravity(true);
    ballSprite.body.setCollideWorldBounds(false);
    ballSprite.body.setBounce(0.1);
    ballSprite.body.setDrag(40, 0);

    this.ball = ballSprite;

    this.ball.body.setMaxVelocity(900, 900);

    const ballShadow = this.scene.add.ellipse(ballStartX, this.groundY + 6, 10, 4, 0x000000, 0.25);
    ballShadow.setDepth(6);
    this.ballShadow = ballShadow;

    const playerShadow = this.scene.add.ellipse(playerSpawnX, this.groundY + 6, 18, 6, 0x000000, 0.25);
    playerShadow.setDepth(9);
    this.playerShadow = playerShadow;

    this.scene.events.on('update', () => {
      if (!this.gameActive) return;
      if (this.ball && this.ballShadow) {
        this.ballShadow.x = this.ball.x;
        this.ballShadow.y = this.groundY + 6;
      }
      if (this.player && this.playerShadow) {
        this.playerShadow.x = this.player.x;
        this.playerShadow.y = this.groundY + 6;
      }
    });

    const uiGlow = this.scene.add.rectangle(width / 2, this.groundY + 2, width - 80, 10, 0x2bffea, 0.06);
    uiGlow.setDepth(-2);

    this.scene.physics.world.setBounds(0, 0, width, height);
  }

  _wireCollisions() {
    const groundY = this.groundY + 10;

    const groundCollider = this.scene.physics.add.staticImage(this.scene.scale.width / 2, groundY, null);
    groundCollider.destroy();

    const groundRect = this.scene.add.rectangle(this.scene.scale.width / 2, groundY, this.scene.scale.width - 80, 30, 0x000000, 0);
    this.scene.physics.add.existing(groundRect, true);
    groundRect.body.setAllowGravity(false);
    groundRect.body.setImmovable(true);

    this.groundRect = groundRect;

    this._onBallGroundHit = this.scene.physics.add.collider(this.ball, groundRect, () => {
      if (!this.gameActive) return;
      if (this._ballGroundedHandled) return;
      this._ballGroundedHandled = true;

      this._hitStop();
      this._fail('fail');
    });

    this._onBallGoalOverlap = this.scene.physics.add.overlap(this.ball, this.goalTrigger, () => {
      if (!this.gameActive) return;
      this._hitStop();
      this._win();
    });

    this._onBallGoalieHit = this.scene.physics.add.collider(this.ball, this.goalieHitbox, () => {
      if (!this.gameActive) return;
      this._hitStop();
      this.goalBlockedCount += 1;

      if (this.goalBlockedCount >= 3) {
        this._fail('fail');
      }
    });

    this.scene.physics.add.collider(this.goalieHitbox, this.groundRect);
  }

  _startTimer() {
    if (this.timerEvent) this.timerEvent.remove(false);

    this.timerEvent = this.scene.time.addEvent({
      delay: this.roundDurationMs,
      callback: () => {
        if (!this.gameActive) return;
        this._fail('fail');
      },
    });
  }

  update(time, delta) {
    if (!this.gameActive || !this.player) return;

    if (this.controller?.update) this.controller.update(time, delta);

    if (this.goalie && this.goalieHitbox) {
      const speed = this.goalieSpeedBase * this.difficultyMultiplier;
      const step = (speed * delta) / 1000;

      this.goalie.y += this.goalieMoveDir * step;
      this.goalieHitbox.y = this.goalie.y;

      if (this.goalie.y <= this.hazardTop) {
        this.goalie.y = this.hazardTop;
        this.goalieMoveDir = 1;
      } else if (this.goalie.y >= this.hazardBottom) {
        this.goalie.y = this.hazardBottom;
        this.goalieMoveDir = -1;
      }
    }

    if (this.ball && this.ball.body) {
      const minX = this.fieldLeft;
      const maxX = this.fieldRight + 40;

      if (this.ball.x < minX - 40 || this.ball.x > maxX) {
        this._fail('fail');
      }
    }

    if (this.controller?.isStrikePressed?.()) {
      this._tryKick(time);
    }

    if (this.ball && this.ball.body) {
      const vx = this.ball.body.velocity.x;
      const vy = this.ball.body.velocity.y;

      const speed = Math.sqrt(vx * vx + vy * vy);
      const maxSpeed = this.ballBaseSpeed * (1.2 + this.difficultyMultiplier * 0.35);
      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        this.ball.body.velocity.x *= scale;
        this.ball.body.velocity.y *= scale;
      }
    }
  }

  _tryKick(time) {
    if (!this.gameActive || !this.ball || !this.player) return;

    if (this.kickCooldownMs && time < this.kickCooldownMs) return;

    const charge = this.controller?.getCharge01?.() ?? 0;
    const facing = this.controller?.getFacing?.() ?? 1;

    const force = Phaser.Math.Linear(this.chargeMinForce, this.chargeMaxForce, charge);

    const contactX = this.ball.x - this.player.x;
    const contactBias = Phaser.Math.Clamp(contactX / 120, -1, 1);

    const angle = Phaser.Math.DegToRad(Phaser.Math.Linear(18, 8, (charge ?? 0) * 1.0));
    const up = -Math.cos(angle) * force * 0.35;
    const forward = Math.sin(angle) * force;

    const dirX = facing >= 0 ? 1 : -1;

    const vx = dirX * forward + contactBias * 60;
    const vy = up - Math.abs(contactBias) * 40;

    const canHit = this._isBallInKickRange();
    if (!canHit) return;

    this.kickCooldownMs = time + 200;

    this._hitStop();

    this.ball.body.setVelocity(vx, vy);
    this.ball.body.angularVelocity = 0;

    this.ball.body.setBounce(0.12);
    this.ball.body.setDrag(20, 0);
  }

  _isBallInKickRange() {
    if (!this.ball || !this.player) return false;
    const dx = Math.abs(this.ball.x - this.player.x);
    const dy = Math.abs(this.ball.y - this.player.y);
    return dx < 90 && dy < 70;
  }

  _serveBallDeterministic() {
    if (!this.ball || !this.ball.body) return;

    const base = this.ballBaseSpeed * (1 + (this.difficultyMultiplier - 1) * 0.35);
    const dir = 1;

    const serveAngleDeg = 18;
    const angle = Phaser.Math.DegToRad(serveAngleDeg);

    const vx = dir * Math.sin(angle) * base;
    const vy = -Math.cos(angle) * base * 0.55;

    this.ball.setPosition(260, this.groundY - 18);
    this.ball.body.setVelocity(vx, vy);
    this.ball.body.setAllowGravity(true);
    this.ball.body.setBounce(0.1);
    this.ball.body.setDrag(40, 0);

    this.goalBlockedCount = 0;
    this._ballGroundedHandled = false;
  }

  _hitStop() {
    const scene = this.scene;
    if (!scene || !scene.game) return;

    const original = scene.time.timeScale;
    scene.time.timeScale = 0.1;

    scene.time.delayedCall(this.hitStopMs, () => {
      if (!this.scene || !this.scene.game) return;
      scene.time.timeScale = original;
    });
  }

  _win() {
    if (!this.gameActive) return;
    this.gameActive = false;

    if (this.timerEvent) this.timerEvent.remove(false);

    const sportKey = 'soccer';
    const scoreDelta = Math.floor(50 * this.difficultyMultiplier);

    if (this.scene.gameOver) {
      this.scene.gameOver({
        outcome: 'win',
        scoreDelta,
        sportKey,
      });
    } else if (this.gameManager) {
      this.gameManager.applyResult({ outcome: 'win', scoreDelta, sportKey });
      this.scene.scene.start('ResultScene', { outcome: 'win', sportKey });
    }
  }

  _fail() {
    if (!this.gameActive) return;
    this.gameActive = false;

    if (this.timerEvent) this.timerEvent.remove(false);

    const sportKey = 'soccer';
    const scoreDelta = 0;

    if (this.scene.gameOver) {
      this.scene.gameOver({
        outcome: 'fail',
        scoreDelta,
        sportKey,
      });
    } else if (this.gameManager) {
      this.gameManager.applyResult({ outcome: 'fail', scoreDelta, sportKey });
      this.scene.scene.start('ResultScene', { outcome: 'fail', sportKey });
    }
  }
}