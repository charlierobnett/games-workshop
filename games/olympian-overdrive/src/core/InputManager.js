export default class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.keys = scene.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      strike: Phaser.Input.Keyboard.KeyCodes.X,
      jump: Phaser.Input.Keyboard.KeyCodes.Z,
      start: Phaser.Input.Keyboard.KeyCodes.SPACE,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      zero: Phaser.Input.Keyboard.KeyCodes.ZERO,
      m: Phaser.Input.Keyboard.KeyCodes.M,
      n: Phaser.Input.Keyboard.KeyCodes.N,
      w: Phaser.Input.Keyboard.KeyCodes.W
    });
  }

  Axis_Horizontal() {
    const left = this.keys.left.isDown ? -1 : 0;
    const right = this.keys.right.isDown ? 1 : 0;
    return left + right;
  }

  Axis_Vertical() {
    const up = this.keys.up.isDown ? -1 : 0;
    const down = this.keys.down.isDown ? 1 : 0;
    return up + down;
  }

  isStrikeJustPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.strike);
  }

  isJumpJustPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.jump);
  }

  isStartJustPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.start);
  }

  isPickleballDebugPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.one);
  }

  isSoccerDebugPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.two);
  }

  isMashupDebugPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.three) || Phaser.Input.Keyboard.JustDown(this.keys.m);
  }

  isMenuDebugPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.zero);
  }

  isFailSkipPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.n);
  }

  isWinSkipPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.w);
  }
}