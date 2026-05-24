import Phaser from 'phaser';

export default class Controller_Soccer {
  constructor(inputManager) {
    this.input = inputManager;

    this.scene = null;
    this.player = null;

    this.facing = 1;

    this.moveSpeed = 220;
    this.dashDurationMs = 200;
    this.chargeMaxMs = 500;

    this._strikeActive = false;
    this._strikeEndsAt = 0;

    this._chargeStartAt = 0;
    this._chargeMs = 0;

    this._weapon = null;
    this._weaponGroup = null;

    this._lastUpdateTime = 0;
  }

  attachToScene(scene) {
    this.scene = scene;
    return this;
  }

  initPlayer(playerSprite) {
    this.player = playerSprite;
    if (this.player && this.player.body) {
      this.player.body.setAllowGravity(true);
      this.player.body.setCollideWorldBounds(true);
    }
  }

  initWeapon(weaponGroup) {
    this._weaponGroup = weaponGroup;
  }

  _ensureWeapon() {
    if (!this._weaponGroup) return null;

    if (!this._weapon) {
      this._weapon = this._weaponGroup.create(0, 0, 'pixel');
      this._weapon.setVisible(false);
      this._weapon.body.setAllowGravity(false);
      this._weapon.body.setImmovable(true);
      this._weapon.body.enable = false;
      this._weapon.setOrigin(0.5, 0.5);
      this._weapon.setDepth(10);
    }
    return this._weapon;
  }

  _startStrike() {
    if (this._strikeActive) return;
    if (!this.player) return;

    const weapon = this._ensureWeapon();
    if (!weapon) return;

    const chargeRatio = Phaser.Math.Clamp(this._chargeMs / this.chargeMaxMs, 0, 1);
    const width = 18 + Math.round(22 * chargeRatio);
    const height = 10;

    const offsetX = this.facing * (18 + Math.round(18 * chargeRatio));
    const offsetY = 0;

    weapon.setVisible(true);
    weapon.body.enable = true;

    weapon.setPosition(this.player.x + offsetX, this.player.y + offsetY);
    weapon.setDisplaySize(width, height);

    weapon.body.setSize(width, height, true);
    weapon.body.setAllowGravity(false);
    weapon.body.setImmovable(true);

    this._strikeActive = true;
    this._strikeEndsAt = this.scene.time.now + this.dashDurationMs;

    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.shake(60, 0.0025);
    }
  }

  _endStrike() {
    if (!this._weapon) return;
    this._weapon.setVisible(false);
    this._weapon.body.enable = false;
    this._strikeActive = false;
  }

  update(time, delta) {
    if (!this.scene || !this.player) return;

    this._lastUpdateTime = time;

    const axis = this.input.Axis_Horizontal();
    if (axis !== 0) this.facing = axis;

    const body = this.player.body;
    if (body) {
      this.player.setVelocityX(axis * this.moveSpeed);
    } else {
      this.player.x += axis * this.moveSpeed * (delta / 1000);
    }

    if (this.input.isStrikeHeld()) {
      if (!this._chargeStartAt) this._chargeStartAt = time;
      this._chargeMs = time - this._chargeStartAt;
    } else {
      this._chargeStartAt = 0;
      this._chargeMs = 0;
    }

    if (this.input.isStrikePressed()) {
      this._startStrike();
    }

    if (this._strikeActive && time >= this._strikeEndsAt) {
      this._endStrike();
    }
  }

  getStrikeWeapon() {
    return this._weapon;
  }

  getFacing() {
    return this.facing;
  }

  getChargeRatio() {
    return Phaser.Math.Clamp(this._chargeMs / this.chargeMaxMs, 0, 1);
  }

  isStrikeActive() {
    return this._strikeActive;
  }
}