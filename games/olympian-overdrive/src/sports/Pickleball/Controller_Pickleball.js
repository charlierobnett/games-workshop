import Phaser from 'phaser';

export default class Controller_Pickleball {
  constructor(scene, inputManager) {
    this.scene = scene;
    this.input = inputManager;

    this.player = null;

    this.moveSpeed = 260;
    this.paddleActiveMs = 450;

    this.facing = 1;

    this.weaponGroup = null;
    this.weapon = null;

    this._paddleActive = false;
    this._paddleTimer = 0;

    this._onStrikeDown = this._onStrikeDown.bind(this);
  }

  attachToScene(scene) {
    this.scene = scene;
    return this;
  }

  init(player, collisionGroups) {
    this.player = player;

    if (!this.weaponGroup) {
      this.weaponGroup = this.scene.physics.add.group({
        classType: Phaser.Physics.Arcade.Sprite,
        allowGravity: false
      });
    }

    const { PlayerWeapon } = collisionGroups || {};
    this.collisionGroups = collisionGroups || {};

    if (this.weapon) {
      this.weapon.destroy();
      this.weapon = null;
    }

    this.weapon = this.weaponGroup.create(this.player.x, this.player.y, 'paddle');
    this.weapon.setActive(false);
    this.weapon.setVisible(false);
    this.weapon.body.enable = false;

    this.weapon.setDepth(10);
    this.weapon.setOrigin(0.5, 0.5);

    if (PlayerWeapon) {
      this.weapon.body.setCollideWorldBounds(false);
    }

    this.scene.input.keyboard.off('keydown-X', this._onStrikeDown);
    this.scene.input.keyboard.on('keydown-X', this._onStrikeDown);

    this._paddleActive = false;
    this._paddleTimer = 0;
  }

  _onStrikeDown() {
    if (!this.player || !this.weapon) return;
    this._activatePaddle();
  }

  _activatePaddle() {
    if (this._paddleActive) return;

    this._paddleActive = true;
    this._paddleTimer = this.scene.time.now + this.paddleActiveMs;

    const offsetX = 26 * this.facing;
    const offsetY = 0;

    this.weapon.setPosition(this.player.x + offsetX, this.player.y + offsetY);
    this.weapon.setActive(true);
    this.weapon.setVisible(true);
    this.weapon.body.enable = true;

    this.weapon.body.setVelocity(0, 0);
  }

  update(time, delta) {
    if (!this.scene?.gameActive || !this.player) return;
    if (!this.input) return;

    const axis = this.input.Axis_Horizontal();
    if (axis !== 0) this.facing = axis > 0 ? 1 : -1;

    const body = this.player.body;
    if (body) {
      body.setVelocityX(axis * this.moveSpeed);
    } else {
      this.player.x += axis * this.moveSpeed * (delta / 1000);
    }

    if (this.input.isStrikePressed()) {
      this._activatePaddle();
    }

    if (this._paddleActive && this.scene.time.now >= this._paddleTimer) {
      this._paddleActive = false;
      if (this.weapon) {
        this.weapon.setActive(false);
        this.weapon.setVisible(false);
        this.weapon.body.enable = false;
      }
    }

    if (this._paddleActive && this.weapon) {
      const offsetX = 26 * this.facing;
      this.weapon.setPosition(this.player.x + offsetX, this.player.y);
    }
  }

  getPaddle() {
    return this.weapon;
  }

  isPaddleActive() {
    return this._paddleActive;
  }
}