import Phaser from 'phaser';

export default class Controller_Pickleball {
  constructor(scene, inputManager) {
    this.scene = scene;
    this.input = inputManager;
    this.player = null;
    this.hitboxGroup = null;
    this.paddleSprite = null;
    this.paddleActive = false;
    this.paddleDuration = 500;
    this.moveSpeedX = 260;
    this.moveSpeedY = 200;
    this.bounds = {
      minX: 100,
      maxX: 540,
      minY: 250,
      maxY: 410
    };
  }

  init(player) {
    this.player = player;
    this.player.setCollideWorldBounds(false);
    this.player.setDepth(10);

    this.hitboxGroup = this.scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      allowGravity: false
    });

    this.paddleSprite = this.scene.add.image(this.player.x, this.player.y - 18, 'paddle');
    this.paddleSprite.setVisible(false);
    this.paddleSprite.setDepth(12);
    this.paddleSprite.setRotation(-Math.PI / 2);
  }

  update() {
    if (!this.player) return;

    const axisX = this.input.Axis_Horizontal();
    const axisY = this.input.Axis_Vertical();

    // Set velocity, but zero it at bounds so player can't push past the edge.
    let vx = axisX * this.moveSpeedX;
    let vy = axisY * this.moveSpeedY;
    if (this.player.x <= this.bounds.minX && vx < 0) vx = 0;
    if (this.player.x >= this.bounds.maxX && vx > 0) vx = 0;
    if (this.player.y <= this.bounds.minY && vy < 0) vy = 0;
    if (this.player.y >= this.bounds.maxY && vy > 0) vy = 0;
    this.player.setVelocity(vx, vy);

    if (this.input.isStrikeJustPressed() && !this.paddleActive) {
      this.activatePaddle();
    }

    if (this.paddleActive) {
      this.syncPaddle();
    }
  }

  activatePaddle() {
    if (!this.player || !this.hitboxGroup) return;

    this.paddleActive = true;

    const hitbox = this.hitboxGroup.create(this.player.x, this.player.y - 24, null);
    hitbox.setVisible(false);
    hitbox.setActive(true);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setSize(40, 40);
    hitbox.body.setOffset(-20, -20);
    hitbox.body.moves = false;
    hitbox.body.immovable = true;

    this.paddleSprite.setVisible(true);
    this.syncPaddle();

    this.scene.time.delayedCall(this.paddleDuration, () => {
      this.deactivatePaddle();
    });
  }

  deactivatePaddle() {
    this.paddleActive = false;
    this.paddleSprite.setVisible(false);

    if (!this.hitboxGroup) return;

    this.hitboxGroup.children.each((child) => {
      if (child && child.active) {
        child.destroy();
      }
    });
  }

  syncPaddle() {
    if (!this.player) return;

    const paddleX = this.player.x;
    const paddleY = this.player.y - 24;

    this.paddleSprite.setPosition(paddleX, paddleY);

    if (!this.hitboxGroup) return;

    this.hitboxGroup.children.each((child) => {
      if (child && child.active) {
        child.setPosition(paddleX, paddleY);
        if (child.body) {
          child.body.updateFromGameObject();
        }
      }
    });
  }

  getHitbox() {
    return this.hitboxGroup;
  }

  isPaddleActive() {
    return this.paddleActive;
  }

  // Alias for LevelManager_Pickleball which calls isHitboxActive() — same concept.
  isHitboxActive() {
    return this.paddleActive;
  }

  destroy() {
    this.deactivatePaddle();

    if (this.paddleSprite) {
      this.paddleSprite.destroy();
      this.paddleSprite = null;
    }

    if (this.hitboxGroup) {
      this.hitboxGroup.destroy(true);
      this.hitboxGroup = null;
    }

    this.player = null;
  }
}