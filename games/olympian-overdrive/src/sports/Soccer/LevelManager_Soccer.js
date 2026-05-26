import Phaser from 'phaser';
import GameFeel from '../../core/GameFeel';
import { ASSET_KEYS } from '../../assets/asset-keys';

export default class LevelManager_Soccer {
  constructor() {
    this.scene = null;
    this.controller = null;
    this.ball = null;
    this.goalie = null;
    this.goalZone = null;
    this.goalTrigger = null;
    this.pitchBounds = null;
    this.background = null;
    this.goalScored = false;
    this.goalieTween = null;
    this.feel = null;
  }

  init(scene, controller) {
    this.scene = scene;
    this.controller = controller;
    this.feel = scene.gameFeel || new GameFeel(scene);
    this.goalScored = false;

    this.createPitch();
    this.createBall();
    this.createGoalie();
    this.createCollisions();

    if (this.controller && typeof this.controller.init === 'function') {
      this.controller.init(scene.player, {
        ball: this.ball,
        pitchBounds: this.pitchBounds
      });
    }

    return {
      ball: this.ball,
      goalie: this.goalie,
      goalZone: this.goalZone
    };
  }

  createPitch() {
    const scene = this.scene;

    this.background = scene.add.rectangle(320, 240, 640, 480, 0x103a2b, 1);
    this.background.setDepth(-20);

    const pitch = scene.add.rectangle(320, 240, 560, 400, 0x2f9e44, 1);
    pitch.setStrokeStyle(3, 0xffffff, 1);
    pitch.setDepth(-10);

    this.goalZone = scene.add.rectangle(320, 60, 240, 40, 0x1f7a33, 1);
    this.goalZone.setStrokeStyle(3, 0xffffff, 1);
    this.goalZone.setDepth(-9);

    const centerCircle = scene.add.circle(320, 240, 48);
    centerCircle.setStrokeStyle(3, 0xffffff, 1);
    centerCircle.setDepth(-9);

    const centerSpot = scene.add.circle(320, 240, 4, 0xffffff, 1);
    centerSpot.setDepth(-8);

    const midfieldLine = scene.add.line(320, 240, 0, -200, 0, 200, 0xffffff, 1);
    midfieldLine.setLineWidth(3, 3);
    midfieldLine.setDepth(-9);

    const goalPosts = scene.add.rectangle(320, 60, 240, 40);
    goalPosts.setStrokeStyle(4, 0xffffff, 1);
    goalPosts.setDepth(-8);

    this.pitchBounds = new Phaser.Geom.Rectangle(40, 40, 560, 400);
    this.goalTrigger = new Phaser.Geom.Rectangle(200, 40, 240, 40);
  }

  createBall() {
    const scene = this.scene;
    this.ball = scene.physics.add.sprite(320, 360, ASSET_KEYS.SOCCER_BALL_DEFAULT);
    this.ball.setDepth(20);
    this.ball.setCollideWorldBounds(true);
    this.ball.setBounce(0.5, 0.5);
    this.ball.setDrag(80, 80);
    this.ball.setMaxVelocity(500, 500);
    this.ball.body.setAllowGravity(false);
    this.ball.body.setCircle(Math.min(this.ball.width, this.ball.height) * 0.35);
  }

  createGoalie() {
    const scene = this.scene;
    this.goalie = scene.physics.add.sprite(220, 90, ASSET_KEYS.SOCCER_GOALIE_DEFAULT);
    this.goalie.setDepth(15);
    this.goalie.setImmovable(true);
    this.goalie.body.setAllowGravity(false);
    this.goalie.body.setSize(this.goalie.width * 0.8, this.goalie.height * 0.8, true);

    this.goalieTween = scene.tweens.add({
      targets: this.goalie,
      x: 420,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createCollisions() {
    const scene = this.scene;

    scene.physics.add.collider(scene.player, this.goalie);
    scene.physics.add.collider(this.ball, this.goalie, this.handleBallGoalieCollision, null, this);
    scene.physics.add.collider(this.ball, scene.player);
  }

  handleBallGoalieCollision() {
    if (this.goalScored) return;
    this.ball.setVelocityY(Math.max(this.ball.body.velocity.y, 120));
  }

  update() {
    if (!this.scene.gameActive || !this.scene.player) return;
    if (!this.ball || this.goalScored) return;

    this.constrainPlayer();
    this.checkGoal();
  }

  constrainPlayer() {
    const player = this.scene.player;
    const halfW = player.displayWidth * 0.5;
    const halfH = player.displayHeight * 0.5;

    if (player.x - halfW <= this.pitchBounds.left && player.body.velocity.x < 0) {
      player.setVelocityX(0);
      player.x = this.pitchBounds.left + halfW;
    }
    if (player.x + halfW >= this.pitchBounds.right && player.body.velocity.x > 0) {
      player.setVelocityX(0);
      player.x = this.pitchBounds.right - halfW;
    }
    if (player.y - halfH <= this.pitchBounds.top && player.body.velocity.y < 0) {
      player.setVelocityY(0);
      player.y = this.pitchBounds.top + halfH;
    }
    if (player.y + halfH >= this.pitchBounds.bottom && player.body.velocity.y > 0) {
      player.setVelocityY(0);
      player.y = this.pitchBounds.bottom - halfH;
    }
  }

  checkGoal() {
    if (!this.ball.body) return;

    const inGoalX = this.ball.x >= 200 && this.ball.x <= 440;
    const inGoalY = this.ball.y < 80;

    if (inGoalX && inGoalY) {
      this.goalScored = true;
      this.ball.setVelocity(0, 0);
      this.ball.body.enable = false;
      if (this.goalieTween) {
        this.goalieTween.pause();
      }
      this.feel.soccerGoal(this.goalZone, 320, 120);
      this.scene.time.delayedCall(900, () => {
        if (this.scene && this.scene.gameActive) {
          this.scene.gameOver('win');
        }
      });
    }
  }

  destroy() {
    if (this.goalieTween) {
      this.goalieTween.stop();
      this.goalieTween = null;
    }
  }
}