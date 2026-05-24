export default class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      jump: 'Z',
      strike: 'X',
      menuMashup: 'M',
      debugNext: 'N',
      start: 'SPACE'
    });
  }

  Axis_Horizontal() {
    let value = 0;
    if (this.cursors.left.isDown) value -= 1;
    if (this.cursors.right.isDown) value += 1;
    return value;
  }

  Axis_Vertical() {
    let value = 0;
    if (this.cursors.up.isDown) value -= 1;
    if (this.cursors.down.isDown) value += 1;
    return value;
  }

  isJumpPressed() {
    return this.keys.jump.isDown;
  }

  isStrikePressed() {
    return this.keys.strike.isDown;
  }

  isStrikeJustPressed() {
    return this.scene.input.keyboard.checkDown(this.keys.strike, 0);
  }

  isStartJustPressed() {
    return this.scene.input.keyboard.checkDown(this.keys.start, 0);
  }

  isMashupJustPressed() {
    return this.scene.input.keyboard.checkDown(this.keys.menuMashup, 0);
  }

  isDebugNextJustPressed() {
    return this.scene.input.keyboard.checkDown(this.keys.debugNext, 0);
  }
}