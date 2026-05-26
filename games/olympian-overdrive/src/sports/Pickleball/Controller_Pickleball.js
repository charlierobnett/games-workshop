import Phaser from 'phaser';
import { ASSET_KEYS } from '../../assets/asset-keys.js';

export default class Controller_Pickleball {
  constructor(scene, inputManager) {
    this.scene = scene;
    this.input = inputManager;
    this.player = null;
    this.paddle = null;
    this.ball = null;
    this.paddleActive = false;
    this.paddleCollider = null;
    this.moveSpeedX = 260;
    this.moveSpeedY = 200;
    this.bounds = {
      minX: 80,
      maxX: 560,
      minY: 240,
      maxY: 420,
    };
  }

  init(player, collisionGroups = {}) {
    this.player = player;
    this.ball = collisionGroups.ball || null;

    this.player.setCollideWorldBounds(false);

    this.paddle = this.scene.physics.add.sprite(
      this.player.x,
      this.player.y,
      ASSET_KEYS.PICKLEBALL_PADDLE_DEFAULT
    );
    this.paddle.setVisible(false);
    this.paddle.setActive(false);
    this.paddle.setDepth(20);
    this.paddle.setImmovable(true);
    this.paddle.body.setAllowGravity(false);
    this.paddle.body.setEnable(false);
    this.paddle.body.setSize(44, 44, true);

    if (this.ball) {
      this.paddleCollider = this.scene.physics.add.overlap(
        this.paddle,
        this.ball,
        this.handlePaddleBallOverlap,
        null,
        this
      );
    }

    return {
      paddle: this.paddle,
      getPaddleActive: () => this.paddleActive,
    };
  }

  update() {
    if (!this.player) {
      return;
    }

    const horizontal = this.input.Axis_Horizontal();
    const vertical = this.input.Axis_Vertical();

    let velocityX = horizontal * this.moveSpeedX;
    let velocityY = vertical * this.moveSpeedY;

    if ((this.player.x <= this.bounds.minX && velocityX < 0) || (this.player.x >= this.bounds.maxX && velocityX > 0)) {
      velocityX = 0;
    }

    if ((this.player.y <= this.bounds.minY && velocityY < 0) || (this.player.y >= this.bounds.maxY && velocityY > 0)) {
      velocityY = 0;
    }

    this.player.setVelocity(velocityX, velocityY);

    if (this.input.isStrikeJustPressed()) {
      this.activatePaddle();
    }

    if (this.paddle) {
      this.paddle.setPosition(this.player.x + 18, this.player.y - 8);
      this.paddle.setRotation(-0.35);
    }
  }

  activatePaddle() {
    if (!this.paddle || this.paddleActive) {
      return;
    }

    this.paddleActive = true;
    this.paddle.setVisible(true);
    this.paddle.setActive(true);
    this.paddle.body.setEnable(true);

    this.scene.tweens.killTweensOf(this.paddle);
    this.paddle.setScale(1);
    this.scene.tweens.add({
      targets: this.paddle,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 50,
      yoyo: true,
      ease: 'Quad.Out',
      onComplete: () => {
        if (this.paddle) {
          this.paddle.setScale(1);
        }
      },
    });

    this.scene.time.delayedCall(500, () => {
      if (!this.paddle) {
        return;
      }
      this.paddleActive = false;
      this.paddle.setVisible(false);
      this.paddle.setActive(false);
      this.paddle.body.setEnable(false);
    });
  }

  handlePaddleBallOverlap() {
    if (!this.paddleActive || !this.ball) {
      return;
    }

    if (this.scene.levelManager && typeof this.scene.levelManager.onPlayerStrike === 'function') {
      this.scene.levelManager.onPlayerStrike(this.player, this.ball, this.paddle);
    }
  }

  destroy() {
    if (this.paddleCollider) {
      this.scene.physics.world.removeCollider(this.paddleCollider);
      this.paddleCollider = null;
    }

    if (this.paddle) {
      this.paddle.destroy();
      this.paddle = null;
    }

    this.player = null;
    this.ball = null;
    this.paddleActive = false;
  }
}