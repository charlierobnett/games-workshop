import Phaser from 'phaser';

export default class InputManager {
  constructor(scene) {
    this.scene = scene;

    this.keys = scene.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      z: Phaser.Input.Keyboard.KeyCodes.Z,
      x: Phaser.Input.Keyboard.KeyCodes.X,
      m: Phaser.Input.Keyboard.KeyCodes.M
    });

    this._strikeJustDown = false;
    this._jumpJustDown = false;
    this._strikeHeld = false;
    this._jumpHeld = false;

    this._lastUpdateTime = 0;
    this._setupListeners();
  }

  _setupListeners() {
    const { x, z } = this.keys;

    this.scene.input.keyboard.on('keydown-X', () => {
      this._strikeJustDown = true;
      this._strikeHeld = true;
    });

    this.scene.input.keyboard.on('keyup-X', () => {
      this._strikeHeld = false;
    });

    this.scene.input.keyboard.on('keydown-Z', () => {
      this._jumpJustDown = true;
      this._jumpHeld = true;
    });

    this.scene.input.keyboard.on('keyup-Z', () => {
      this._jumpHeld = false;
    });
  }

  update() {
    if (!this.scene || !this.scene.game) return;

    this._lastUpdateTime = this.scene.time.now;

    if (this._strikeJustDown) this._strikeJustDown = false;
    if (this._jumpJustDown) this._jumpJustDown = false;
  }

  Axis_Horizontal() {
    const left = this.keys.left.isDown ? 1 : 0;
    const right = this.keys.right.isDown ? 1 : 0;
    return right - left;
  }

  Axis_Vertical() {
    const up = this.keys.up.isDown ? 1 : 0;
    const down = this.keys.down.isDown ? 1 : 0;
    return down - up;
  }

  isStrikePressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.x) || this._strikeJustDown;
  }

  isStrikeHeld() {
    return this.keys.x.isDown || this._strikeHeld;
  }

  isJumpPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.z) || this._jumpJustDown;
  }

  isJumpHeld() {
    return this.keys.z.isDown || this._jumpHeld;
  }

  isDebugMashupPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.m);
  }
}