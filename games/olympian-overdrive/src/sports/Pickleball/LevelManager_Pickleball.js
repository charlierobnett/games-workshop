import Phaser from 'phaser';
import GameFeel from '../../core/GameFeel';
import { ASSET_KEYS } from '../../assets/asset-keys';

export default class LevelManager_Pickleball {
  constructor() {
    this.scene = null;
    this.controller = null;
    this.gameFeel = null;
    this.ball = null;
    this.opponent = null;
    this.courtBounds = null;
    this.kitchenZone = null;
    this.background = null;
    this.court = null;
    this.volleyCount = 0;
    this.serveIndex = 0;
    this.roundEnded = false;
    this.lastPaddleHitAt = 0;
    this.servePattern = [
      { vx: 0, vy: 220 },
      { vx: -60, vy: 220 },
      { vx: 60, vy: 220 }
    ];
  }

  init(scene, controller) {
    this.scene = scene;
    this.controller = controller;
    this.gameFeel = new GameFeel(scene);
    this.volleyCount = 0;
    this.serveIndex = 0;
    this.roundEnded = false;
    this.lastPaddleHitAt = -9999;

    this.createCourt();
    this.createOpponent();
    this.createBall();
    this.setupCollisions();
    this.updateVolleyText();
    this.serveBall();

    return {
      ball: this.ball,
      opponent: this.opponent,
      backgroundTargets: [this.background, this.court],
      kitchenZone: this.kitchenZone
    };
  }

  createCourt() {
    const { add } = this.scene;

    this.background = add.rectangle(320, 240, 640, 480, 0x103a2b, 1);
    this.background.setDepth(-20);

    this.court = add.rectangle(320, 240, 480, 360, 0x2f9e44, 1);
    this.court.setDepth(-10);
    this.court.setStrokeStyle(4, 0xffffff, 1);

    add.line(0, 320, 60, 320, 420, 320, 0xffffff, 1).setOrigin(0, 0).setLineWidth(2).setDepth(-9);
    add.line(0, 80, 240, 560, 240, 0xffffff, 1).setOrigin(0, 0).setLineWidth(2).setDepth(-9);
    add.line(0, 80, 150, 560, 150, 0xffffff, 1).setOrigin(0, 0).setLineWidth(2).setDepth(-9);
    add.line(0, 80, 330, 560, 330, 0xffffff, 1).setOrigin(0, 0).setLineWidth(2).setDepth(-9);
    add.line(0, 320, 60, 320, 420, 0xffffff, 1).setOrigin(0, 0).setLineWidth(4).setDepth(-8);

    this.kitchenZone = add.rectangle(320, 240, 480, 40, 0xff2e63, 0.18);
    this.kitchenZone.setDepth(-7);
    this.kitchenZone.setStrokeStyle(2, 0xff2e63, 0.55);

    this.courtBounds = new Phaser.Geom.Rectangle(80, 60, 480, 360);

    const volleyText = add.text(320, 34, 'VOLLEYS: 0/3', {
      fontFamily: 'monospace',
      fontSize: '14px'
    });
    volleyText.setOrigin(0.5);
    volleyText.setDepth(1001);
    volleyText.setColor('#2ef2ff');
    this.scene.volleyText = volleyText;
  }

  createOpponent() {
    this.opponent = this.scene.physics.add.sprite(320, 100, ASSET_KEYS.PICKLEBALL_OPPONENT_DEFAULT);
    this.opponent.setDepth(20);
    this.opponent.setCollideWorldBounds(false);
    this.opponent.setImmovable(true);
    this.opponent.body.setAllowGravity(false);
    this.opponent.body.setSize(this.opponent.width * 0.6, this.opponent.height * 0.7, true);
  }

  createBall() {
    this.ball = this.scene.physics.add.sprite(320, 180, ASSET_KEYS.PICKLEBALL_BALL_DEFAULT);
    this.ball.setDepth(30);
    this.ball.setCollideWorldBounds(false);
    this.ball.setBounce(0.7, 0.7);
    this.ball.setDrag(20, 20);
    this.ball.body.setAllowGravity(false);
    this.ball.body.setCircle(Math.max(6, Math.floor(this.ball.width * 0.3)));
    this.ball.body.setMaxVelocity(420, 420);
  }

  setupCollisions() {
    if (this.controller && this.controller.paddleHitbox) {
      this.scene.physics.add.overlap(
        this.controller.paddleHitbox,
        this.ball,
        this.handlePaddleHit,
        undefined,
        this
      );
    }
  }

  serveBall() {
    if (!this.ball || this.roundEnded) return;

    const pattern = this.servePattern[this.serveIndex % this.servePattern.length];
    this.serveIndex += 1;

    this.ball.setPosition(320, 150);
    this.ball.setVelocity(pattern.vx, pattern.vy);
    this.ball.setAngularVelocity(Phaser.Math.Between(-120, 120));
  }

  handlePaddleHit(_, ball) {
    if (this.roundEnded || !this.controller || !this.controller.isPaddleActive) return;
    if (this.scene.time.now - this.lastPaddleHitAt < 120) return;

    this.lastPaddleHitAt = this.scene.time.now;
    this.volleyCount += 1;
    this.updateVolleyText();

    const dx = ball.x - this.controller.player.x;
    const vx = Phaser.Math.Clamp(dx * 4, -220, 220);
    const vy = -220;

    ball.setVelocity(vx, vy);
    ball.setAngularVelocity(Phaser.Math.Between(-180, 180));

    this.gameFeel.pickleballHit(
      ball.x,
      ball.y,
      this.scene.volleyText,
      this.scene.scoreText
    );

    if (this.volleyCount >= 3) {
      this.roundEnded = true;
      this.scene.time.delayedCall(180, () => {
        if (!this.scene || !this.scene.gameActive) return;
        this.scene.gameOver('win');
      });
    }
  }

  updateVolleyText() {
    if (!this.scene.volleyText) return;
    this.scene.volleyText.setText(`VOLLEYS: ${this.volleyCount}/3`);
  }

  update() {
    if (this.roundEnded || !this.ball || !this.controller || !this.controller.player) return;

    this.keepPlayerInLowerHalf();
    this.keepBallInCourt();
    this.updateOpponent();
    this.checkFailStates();
  }

  keepPlayerInLowerHalf() {
    const player = this.controller.player;
    const body = player.body;
    const minX = 80 + player.displayWidth * 0.35;
    const maxX = 560 - player.displayWidth * 0.35;
    const minY = 240 + player.displayHeight * 0.35;
    const maxY = 420 - player.displayHeight * 0.35;

    if (player.x <= minX && body.velocity.x < 0) {
      body.setVelocityX(0);
      player.x = minX;
    } else if (player.x >= maxX && body.velocity.x > 0) {
      body.setVelocityX(0);
      player.x = maxX;
    }

    if (player.y <= minY && body.velocity.y < 0) {
      body.setVelocityY(0);
      player.y = minY;
    } else if (player.y >= maxY && body.velocity.y > 0) {
      body.setVelocityY(0);
      player.y = maxY;
    }
  }

  keepBallInCourt() {
    const radius = Math.max(this.ball.displayWidth, this.ball.displayHeight) * 0.25;
    const minX = this.courtBounds.left + radius;
    const maxX = this.courtBounds.right - radius;
    const minY = this.courtBounds.top + radius;
    const maxY = this.courtBounds.bottom - radius;

    if (this.ball.x <= minX && this.ball.body.velocity.x < 0) {
      this.ball.x = minX;
      this.ball.body.setVelocityX(Math.abs(this.ball.body.velocity.x) * 0.7);
    } else if (this.ball.x >= maxX && this.ball.body.velocity.x > 0) {
      this.ball.x = maxX;
      this.ball.body.setVelocityX(-Math.abs(this.ball.body.velocity.x) * 0.7);
    }

    if (this.ball.y <= minY && this.ball.body.velocity.y < 0) {
      this.ball.y = minY;
      this.ball.body.setVelocityY(Math.abs(this.ball.body.velocity.y) * 0.7);
    }
  }

  updateOpponent() {
    const targetX = Phaser.Math.Clamp(this.ball.x, 120, 520);
    const deltaX = targetX - this.opponent.x;
    this.opponent.x += Phaser.Math.Clamp(deltaX, -2.2, 2.2);

    if (this.ball.y < 170 && this.ball.body.velocity.y < 0) {
      const closeEnoughX = Math.abs(this.ball.x - this.opponent.x) < 42;
      const closeEnoughY = Math.abs(this.ball.y - this.opponent.y) < 70;
      if (closeEnoughX && closeEnoughY) {
        this.ball.setVelocity(0, 220);
        this.ball.setAngularVelocity(Phaser.Math.Between(-120, 120));
      }
    }
  }

  checkFailStates() {
    if (this.ball.y > 410) {
      this.failRound();
      return;
    }

    if (this.controller.isPaddleActive && Phaser.Geom.Intersects.RectangleToRectangle(
      this.kitchenZone.getBounds(),
      this.controller.paddleHitbox.getBounds()
    )) {
      this.failRound();
    }
  }

  failRound() {
    if (this.roundEnded) return;
    this.roundEnded = true;
    this.gameFeel.playFailFeedback([this.background, this.court]);
    this.scene.time.delayedCall(400, () => {
      if (!this.scene || !this.scene.gameActive) return;
      this.scene.gameOver('fail');
    });
  }

  destroy() {
    if (this.ball) this.ball.destroy();
    if (this.opponent) this.opponent.destroy();
    if (this.kitchenZone) this.kitchenZone.destroy();
    if (this.court) this.court.destroy();
    if (this.background) this.background.destroy();
    if (this.scene && this.scene.volleyText) {
      this.scene.volleyText.destroy();
      this.scene.volleyText = null;
    }
  }
}