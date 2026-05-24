import Phaser from 'phaser';

export default class Controller_Soccer {
  constructor(scene, inputManager) {
    this.scene = scene;
    this.input = inputManager;
    this.player = null;
    this.hitboxGroup = null;
    this.activeHitbox = null;
    this.strikeActive = false;
    this.strikeDuration = 200;
    this.playerSpeed = 240;
    this.dashBoost = 200;
    this.lastMoveDir = new Phaser.Math.Vector2(0, -1);
    this.bounds = {
      minX: 40,
      maxX: 600,
      minY: 40,
      maxY: 440
    };
  }

  init(player) {
    this.player = player;
    this.player.setCollideWorldBounds(false);

    this.hitboxGroup = this.scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      allowGravity: false
    });

    return this;
  }

  getHitbox() {
    return this.hitboxGroup;
  }

  update() {
    if (!this.player || !this.player.body) return;

    const axisX = this.input.Axis_Horizontal();
    const axisY = this.input.Axis_Vertical();

    let velocityX = axisX * this.playerSpeed;
    let velocityY = axisY * this.playerSpeed;

    if (axisX !== 0 || axisY !== 0) {
      this.lastMoveDir.set(axisX, axisY).normalize();
    }

    this.player.setVelocity(velocityX, velocityY);

    if (this.input.isStrikeJustPressed() && !this.strikeActive) {
      this.startStrike();
    }

    this.clampPlayerToPitch();
    this.updateHitboxPosition();
  }

  startStrike() {
    this.strikeActive = true;

    const dashDir = this.lastMoveDir.lengthSq() > 0 ? this.lastMoveDir.clone().normalize() : new Phaser.Math.Vector2(0, -1);
    this.player.setVelocity(
      dashDir.x * (this.playerSpeed + this.dashBoost),
      dashDir.y * (this.playerSpeed + this.dashBoost)
    );

    // Wider, closer hitbox so the strike reliably overlaps the ball at the edge.
    const hitboxX = this.player.x + dashDir.x * 8;
    const hitboxY = this.player.y + dashDir.y * 8;

    this.activeHitbox = this.hitboxGroup.create(hitboxX, hitboxY, 'ball-soccer');
    this.activeHitbox.setVisible(false);
    this.activeHitbox.setActive(true);
    this.activeHitbox.body.setAllowGravity(false);
    this.activeHitbox.body.setSize(48, 48);
    this.activeHitbox.body.setOffset(
      (this.activeHitbox.width - 48) * 0.5,
      (this.activeHitbox.height - 48) * 0.5
    );
    this.activeHitbox.setImmovable(true);

    this.scene.time.delayedCall(this.strikeDuration, () => {
      this.endStrike();
    });
  }

  endStrike() {
    this.strikeActive = false;

    if (this.activeHitbox) {
      this.activeHitbox.destroy();
      this.activeHitbox = null;
    }
  }

  updateHitboxPosition() {
    if (!this.activeHitbox || !this.player) return;

    const dashDir = this.lastMoveDir.lengthSq() > 0 ? this.lastMoveDir.clone().normalize() : new Phaser.Math.Vector2(0, -1);
    this.activeHitbox.setPosition(
      this.player.x + dashDir.x * 18,
      this.player.y + dashDir.y * 18
    );
  }

  clampPlayerToPitch() {
    const halfWidth = this.player.displayWidth * 0.5;
    const halfHeight = this.player.displayHeight * 0.5;

    this.player.x = Phaser.Math.Clamp(this.player.x, this.bounds.minX + halfWidth, this.bounds.maxX - halfWidth);
    this.player.y = Phaser.Math.Clamp(this.player.y, this.bounds.minY + halfHeight, this.bounds.maxY - halfHeight);
  }

  destroy() {
    this.endStrike();

    if (this.hitboxGroup) {
      this.hitboxGroup.clear(true, true);
      this.hitboxGroup.destroy(true);
      this.hitboxGroup = null;
    }

    this.player = null;
  }
}