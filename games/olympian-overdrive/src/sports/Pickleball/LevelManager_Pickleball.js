import Phaser from 'phaser';

export default class LevelManager_Pickleball {
  constructor() {
    this.scene = null;
    this.controller = null;
    this.ball = null;
    this.ai = null;
    this.volleyCount = 0;
    this.targetVolleys = 3;
    this.serveIndex = 0;
    this.lowerKitchenZone = null;
    this.playerHitCooldown = false;
    this.aiHitCooldown = false;
    this.ended = false;
    this.volleyText = null;
    this.courtBounds = {
      left: 80,
      right: 560,
      top: 60,
      bottom: 420,
      netY: 240,
      playerMinY: 250,
      playerMaxY: 410
    };
    this.servePatterns = [
      { vx: 0, vy: 220 },
      { vx: -60, vy: 220 },
      { vx: 60, vy: 220 }
    ];
  }

  init(scene, controller) {
    this.scene = scene;
    this.controller = controller;
    this.volleyCount = 0;
    this.playerHitCooldown = false;
    this.aiHitCooldown = false;
    this.ended = false;

    this.createCourt();
    this.createVolleyUi();
    this.createAi();
    this.createBall();
    this.setupCollisions();
    this.startServe();
  }

  createCourt() {
    const g = this.scene.add.graphics();
    g.lineStyle(4, 0xffffff, 1);
    g.strokeRect(80, 60, 480, 360);
    g.lineStyle(3, 0xffffff, 1);
    g.lineBetween(80, 240, 560, 240);

    g.fillStyle(0x1f8f4c, 0.18);
    g.fillRect(80, 220, 480, 20);
    g.fillRect(80, 240, 480, 20);

    g.lineStyle(2, 0xd8fff0, 0.8);
    g.strokeRect(80, 220, 480, 40);

    this.lowerKitchenZone = this.scene.add.zone(320, 250, 480, 20);
    this.scene.physics.add.existing(this.lowerKitchenZone, true);
  }

  createVolleyUi() {
    this.volleyText = this.scene.add.text(320, 42, `VOLLEYS: ${this.volleyCount}/${this.targetVolleys}`, {
      fontFamily: 'monospace',
      fontSize: '14px'
    }).setOrigin(0.5, 0.5).setDepth(1001);
    this.volleyText.setColor('#ffffff');
  }

  createAi() {
    this.ai = this.scene.physics.add.sprite(320, 100, 'player-ai-pickle');
    this.ai.setCollideWorldBounds(false);
    this.ai.setImmovable(true);
    this.ai.body.setAllowGravity(false);
    this.ai.body.moves = false;
  }

  createBall() {
    this.ball = this.scene.physics.add.sprite(320, 100, 'ball-pickle');
    this.ball.body.setAllowGravity(false);
    this.ball.setBounce(0.7, 0.7);
    this.ball.setDrag(20, 20);
    this.ball.setCollideWorldBounds(false);
    this.ball.setCircle(Math.min(this.ball.width, this.ball.height) * 0.35);
  }

  setupCollisions() {
    const hitboxGroup = this.controller.getHitbox();

    this.scene.physics.add.overlap(hitboxGroup, this.ball, () => {
      this.handlePlayerHit();
    });

    this.scene.physics.add.overlap(this.ai, this.ball, () => {
      this.handleAiHit();
    });
  }

  startServe() {
    const pattern = this.servePatterns[this.serveIndex % this.servePatterns.length];
    this.serveIndex += 1;

    this.ball.setPosition(320, 100);
    this.ball.setVelocity(pattern.vx, pattern.vy);
  }

  handlePlayerHit() {
    if (this.ended || this.playerHitCooldown || !this.controller.isHitboxActive()) {
      return;
    }

    this.playerHitCooldown = true;
    this.scene.time.delayedCall(150, () => {
      this.playerHitCooldown = false;
    });

    this.volleyCount += 1;
    this.updateVolleyUi();

    if (this.volleyCount >= this.targetVolleys) {
      this.finishRound('win', 100 + this.volleyCount * 25);
      return;
    }

    const playerVelocityX = this.controller.player && this.controller.player.body
      ? this.controller.player.body.velocity.x
      : 0;

    const vx = Phaser.Math.Clamp(-playerVelocityX, -140, 140);
    this.ball.setVelocity(vx, -220);
  }

  handleAiHit() {
    if (this.ended || this.aiHitCooldown || this.ball.y > 200 || this.ball.body.velocity.y >= 0) {
      return;
    }

    this.aiHitCooldown = true;
    this.scene.time.delayedCall(150, () => {
      this.aiHitCooldown = false;
    });

    const playerVelocityX = this.controller.player && this.controller.player.body
      ? this.controller.player.body.velocity.x
      : 0;

    const vx = Phaser.Math.Clamp(-playerVelocityX, -140, 140);
    this.ball.setVelocity(vx, 220);
  }

  updateVolleyUi() {
    if (this.volleyText) {
      this.volleyText.setText(`VOLLEYS: ${this.volleyCount}/${this.targetVolleys}`);
    }
  }

  update() {
    if (this.ended || !this.scene.gameActive || !this.controller.player || !this.ball) {
      return;
    }

    this.keepAiPositioned();
    this.handleCourtBounces();
    this.checkKitchenFault();
    this.checkFailBounds();
  }

  keepAiPositioned() {
    const targetX = Phaser.Math.Clamp(this.ball.x, 120, 520);
    this.ai.x = Phaser.Math.Linear(this.ai.x, targetX, 0.08);
    this.ai.y = 100;
    if (this.ai.body) {
      this.ai.body.reset(this.ai.x, this.ai.y);
    }
  }

  handleCourtBounces() {
    if (this.ball.x <= this.courtBounds.left) {
      this.ball.x = this.courtBounds.left;
      this.ball.setVelocityX(Math.abs(this.ball.body.velocity.x) * 0.7 || 60);
    } else if (this.ball.x >= this.courtBounds.right) {
      this.ball.x = this.courtBounds.right;
      this.ball.setVelocityX(-Math.abs(this.ball.body.velocity.x) * 0.7 || -60);
    }

    if (this.ball.y <= this.courtBounds.top) {
      this.ball.y = this.courtBounds.top;
      this.ball.setVelocityY(Math.abs(this.ball.body.velocity.y) * 0.7 || 80);
    }
  }

  checkKitchenFault() {
    if (!this.controller.isHitboxActive()) {
      return;
    }

    const player = this.controller.player;
    if (!player) {
      return;
    }

    const inKitchen =
      player.x >= this.courtBounds.left &&
      player.x <= this.courtBounds.right &&
      player.y >= 240 &&
      player.y <= 260;

    if (inKitchen) {
      this.finishRound('fail', 0);
    }
  }

  checkFailBounds() {
    if (this.ball.y > this.courtBounds.playerMaxY) {
      this.finishRound('fail', 0);
    }
  }

  onTimeExpired() {
    this.finishRound('fail', 0);
  }

  finishRound(outcome, scoreDelta) {
    if (this.ended) {
      return;
    }

    this.ended = true;
    this.scene.gameOver({
      outcome,
      scoreDelta,
      sportKey: 'pickleball'
    });
  }

  destroy() {
    if (this.volleyText) {
      this.volleyText.destroy();
      this.volleyText = null;
    }
    if (this.ai) {
      this.ai.destroy();
      this.ai = null;
    }
    if (this.ball) {
      this.ball.destroy();
      this.ball = null;
    }
    if (this.lowerKitchenZone) {
      this.lowerKitchenZone.destroy();
      this.lowerKitchenZone = null;
    }
  }
}