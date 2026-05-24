import Phaser from 'phaser';

export default class LevelManager_Soccer {
  constructor() {
    this.scene = null;
    this.controller = null;
    this.ball = null;
    this.goalie = null;
    this.goalZone = null;
    this.pitchBounds = new Phaser.Geom.Rectangle(40, 40, 560, 400);
    this.goalBounds = new Phaser.Geom.Rectangle(200, 40, 240, 40);
    this.gameEnded = false;
  }

  init(scene, controller) {
    this.scene = scene;
    this.controller = controller;
    this.gameEnded = false;

    this.createPitch();
    this.createBall();
    this.createGoalie();
    this.createCollisions();

    // Proximity-kick fallback: X also triggers a kick if ball is within 80px,
    // independent of physics overlap (which misses edge-tangent contacts).
    this._kickHandler = () => this.tryProximityKick();
    this.scene.input.keyboard.on('keydown-X', this._kickHandler);
  }

  createPitch() {
    const g = this.scene.add.graphics();
    g.lineStyle(4, 0xffffff, 1);
    g.fillStyle(0x2f9e44, 1);
    g.fillRect(this.pitchBounds.x, this.pitchBounds.y, this.pitchBounds.width, this.pitchBounds.height);
    g.strokeRect(this.pitchBounds.x, this.pitchBounds.y, this.pitchBounds.width, this.pitchBounds.height);

    g.fillStyle(0x1f7a33, 1);
    g.fillRect(this.goalBounds.x, this.goalBounds.y, this.goalBounds.width, this.goalBounds.height);
    g.lineStyle(2, 0xffffff, 1);
    g.strokeRect(this.goalBounds.x, this.goalBounds.y, this.goalBounds.width, this.goalBounds.height);

    g.lineStyle(2, 0xffffff, 0.8);
    g.strokeCircle(320, 240, 55);
    g.beginPath();
    g.moveTo(40, 240);
    g.lineTo(600, 240);
    g.strokePath();

    this.goalZone = this.scene.add.zone(
      this.goalBounds.centerX,
      this.goalBounds.centerY,
      this.goalBounds.width,
      this.goalBounds.height
    );
    this.scene.physics.add.existing(this.goalZone, true);
  }

  createBall() {
    this.ball = this.scene.physics.add.sprite(320, 360, 'ball-soccer');
    this.ball.setCollideWorldBounds(false);
    this.ball.setBounce(0.5, 0.5);
    this.ball.setDrag(80, 80);
    this.ball.body.setAllowGravity(false);
    this.ball.setMaxVelocity(500, 500);
    this.ball.setDepth(5);
    this.ball.body.setCircle(Math.min(this.ball.width, this.ball.height) * 0.35);
  }

  createGoalie() {
    this.goalie = this.scene.physics.add.sprite(320, 90, 'player-goalie');
    this.goalie.setImmovable(true);
    this.goalie.body.setAllowGravity(false);
    this.goalie.setDepth(6);
    this.goalie.body.setSize(this.goalie.width * 0.7, this.goalie.height * 0.7, true);

    this.scene.tweens.add({
      targets: this.goalie,
      x: { from: 220, to: 420 },
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
  }

  createCollisions() {
    const hitboxGroup = this.controller.getHitbox();

    if (hitboxGroup) {
      this.scene.physics.add.overlap(hitboxGroup, this.ball, this.handleStrike, null, this);
    }

    this.scene.physics.add.collider(this.ball, this.goalie, this.handleGoalieCollision, null, this);
    this.scene.physics.add.overlap(this.ball, this.goalZone, this.handleGoal, null, this);
  }

  handleStrike(hitbox, ball) {
    if (this.gameEnded || !hitbox.active || !ball.active) {
      return;
    }

    const player = this.controller.player;
    if (!player) {
      return;
    }

    let dx = ball.x - player.x;
    if (Math.abs(dx) < 8) {
      dx = 8 * (Phaser.Math.Between(0, 1) === 0 ? -1 : 1);
    }

    const impulse = 4;
    ball.setVelocity(dx * impulse, -300 * impulse);
  }

  // Fallback: imperative kick on X-press when ball is within range,
  // independent of overlap. Solves the edge-tangent miss.
  tryProximityKick() {
    if (this.gameEnded || !this.ball || !this.ball.active) return;
    const player = this.controller?.player;
    if (!player) return;
    const dist = Phaser.Math.Distance.Between(player.x, player.y, this.ball.x, this.ball.y);
    if (dist <= 80) {
      this.handleStrike({ active: true }, this.ball);
    }
  }

  handleGoalieCollision() {
    if (this.gameEnded) {
      return;
    }

    if (this.ball && this.ball.body) {
      this.ball.body.velocity.x *= 0.95;
    }
  }

  handleGoal() {
    if (this.gameEnded) {
      return;
    }

    this.gameEnded = true;
    this.scene.gameOver({
      outcome: 'win',
      scoreDelta: 100,
      sportKey: this.scene.sportKey
    });
  }

  update() {
    if (this.gameEnded || !this.ball) {
      return;
    }

    if (
      this.ball.x < this.pitchBounds.left ||
      this.ball.x > this.pitchBounds.right ||
      this.ball.y < this.pitchBounds.top ||
      this.ball.y > this.pitchBounds.bottom
    ) {
      if (!this.isBallInGoal()) {
        this.gameEnded = true;
        this.scene.gameOver({
          outcome: 'fail',
          scoreDelta: 0,
          sportKey: this.scene.sportKey
        });
      }
    }
  }

  isBallInGoal() {
    return Phaser.Geom.Rectangle.Contains(this.goalBounds, this.ball.x, this.ball.y);
  }

  destroy() {
    if (this.ball) {
      this.ball.destroy();
      this.ball = null;
    }

    if (this.goalie) {
      this.goalie.destroy();
      this.goalie = null;
    }

    if (this.goalZone) {
      this.goalZone.destroy();
      this.goalZone = null;
    }
  }
}