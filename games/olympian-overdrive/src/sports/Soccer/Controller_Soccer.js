import Phaser from 'phaser';
import InputManager from '../../core/InputManager.js';

const PLAYER_SPEED = 240;
const STRIKE_RADIUS = 80;
const STRIKE_BOX_SIZE = 48;
const STRIKE_OFFSET = 8;
const STRIKE_DURATION = 120;
const PITCH_BOUNDS = {
  left: 40,
  right: 600,
  top: 40,
  bottom: 440
};

export default class Controller_Soccer {
  constructor(scene) {
    this.scene = scene;
    this.input = new InputManager(scene);
    this.player = null;
    this.ball = null;
    this.strikeHitbox = null;
    this.lastMoveDir = new Phaser.Math.Vector2(0, -1);
    this.strikeActive = false;
  }

  init(player, collisionGroups = {}) {
    this.player = player;
    this.ball = collisionGroups.ball || null;

    this.strikeHitbox = this.scene.add.zone(player.x, player.y - STRIKE_OFFSET, STRIKE_BOX_SIZE, STRIKE_BOX_SIZE);
    this.scene.physics.add.existing(this.strikeHitbox);
    this.strikeHitbox.body.setAllowGravity(false);
    this.strikeHitbox.body.setImmovable(true);
    this.strikeHitbox.body.enable = false;

    return {
      strikeHitbox: this.strikeHitbox
    };
  }

  setBall(ball) {
    this.ball = ball;
  }

  update() {
    if (!this.player) {
      return;
    }

    const horizontal = this.input.Axis_Horizontal();
    const vertical = this.input.Axis_Vertical();

    this.player.setVelocity(horizontal * PLAYER_SPEED, vertical * PLAYER_SPEED);

    if (horizontal !== 0 || vertical !== 0) {
      this.lastMoveDir.set(horizontal, vertical).normalize();
    }

    this.enforceBounds();
    this.updateStrikeHitboxPosition();

    if (this.input.isStrikeJustPressed()) {
      this.performStrike();
    }
  }

  enforceBounds() {
    const body = this.player.body;
    if (!body) {
      return;
    }

    if (this.player.x <= PITCH_BOUNDS.left && body.velocity.x < 0) {
      body.setVelocityX(0);
    }
    if (this.player.x >= PITCH_BOUNDS.right && body.velocity.x > 0) {
      body.setVelocityX(0);
    }
    if (this.player.y <= PITCH_BOUNDS.top && body.velocity.y < 0) {
      body.setVelocityY(0);
    }
    if (this.player.y >= PITCH_BOUNDS.bottom && body.velocity.y > 0) {
      body.setVelocityY(0);
    }
  }

  updateStrikeHitboxPosition() {
    if (!this.strikeHitbox) {
      return;
    }

    const offsetX = this.lastMoveDir.x * STRIKE_OFFSET;
    const offsetY = this.lastMoveDir.y * STRIKE_OFFSET;
    this.strikeHitbox.setPosition(this.player.x + offsetX, this.player.y + offsetY);
  }

  performStrike() {
    if (!this.player) {
      return;
    }

    this.scene.gameFeel?.log('GF-02', 'strike fired', 'count=1');

    this.scene.tweens.add({
      targets: this.player,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 50,
      yoyo: true,
      ease: 'Quad.Out'
    });

    this.activateStrikeHitbox();
    this.tryProximityKick();
  }

  activateStrikeHitbox() {
    if (!this.strikeHitbox || this.strikeActive) {
      return;
    }

    this.strikeActive = true;
    this.strikeHitbox.body.enable = true;
    this.updateStrikeHitboxPosition();

    this.scene.time.delayedCall(STRIKE_DURATION, () => {
      if (!this.strikeHitbox) {
        return;
      }
      this.strikeHitbox.body.enable = false;
      this.strikeActive = false;
    });
  }

  tryProximityKick() {
    if (!this.ball || !this.ball.body) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.ball.x, this.ball.y);
    if (distance > STRIKE_RADIUS) {
      return;
    }

    let vx = this.ball.x - this.player.x;
    if (Math.abs(vx) < 8) {
      vx = vx >= 0 ? 8 : -8;
    }

    this.ball.setVelocity(vx * 4, -300 * 4);
  }

  getInput() {
    return this.input;
  }

  getStrikeHitbox() {
    return this.strikeHitbox;
  }

  getLastMoveDir() {
    return this.lastMoveDir.clone();
  }
}