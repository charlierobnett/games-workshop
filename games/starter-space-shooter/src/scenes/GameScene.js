import Phaser from 'phaser';

const ENEMY_TYPES = ['enemy1', 'enemy2', 'enemy3'];
const FIRE_RATE_DEFAULT = 300;
const FIRE_RATE_RAPID = 130;
const POWERUP_DURATION = 6000;

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Scrolling background
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'bg');

    // State
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.isBossWave = false;
    this.gameActive = true;
    this.fireRate = FIRE_RATE_DEFAULT;
    this.fireTimer = 0;
    this.shieldActive = false;
    this.tripleShot = false;
    this.shieldGraphic = null;

    // Enemy direction state
    this.enemyDir = 1;
    this.enemyDropPending = false;

    // Groups
    this.playerBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      allowGravity: false
    });
    this.enemyBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      allowGravity: false
    });
    this.enemies = this.physics.add.group();
    this.meteors = this.physics.add.group();
    this.powerups = this.physics.add.group();

    // Player
    this.player = this.physics.add.sprite(W / 2, H - 60, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(0.7);
    this.player.setDepth(10);

    // Boss (created when needed)
    this.boss = null;
    this.bossHP = 0;
    this.bossMaxHP = 30;
    this.bossHPBar = null;
    this.bossHPBarBg = null;
    this.bossHPText = null;

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();

    // UI
    this.createUI();

    // Timers
    this.enemyShootEvent = this.time.addEvent({
      delay: 1800,
      callback: this.enemyShoot,
      callbackScope: this,
      loop: true
    });

    this.meteorEvent = this.time.addEvent({
      delay: 2500,
      callback: this.spawnMeteor,
      callbackScope: this,
      loop: true
    });

    // Collisions
    this.physics.add.overlap(this.playerBullets, this.enemies, this.bulletHitEnemy, null, this);
    this.physics.add.overlap(this.enemyBullets, this.player, this.bulletHitPlayer, null, this);
    this.physics.add.overlap(this.meteors, this.player, this.meteorHitPlayer, null, this);
    this.physics.add.overlap(this.meteors, this.playerBullets, this.bulletHitMeteor, null, this);
    this.physics.add.overlap(this.powerups, this.player, this.collectPowerup, null, this);

    this.spawnWave();
  }

  createUI() {
    const W = this.cameras.main.width;

    this.scoreText = this.add.text(10, 10, 'SCORE: 0', {
      font: '16px monospace', fill: '#ffffff'
    }).setDepth(20);

    this.livesText = this.add.text(W - 10, 10, 'LIVES: 3', {
      font: '16px monospace', fill: '#ff4444'
    }).setOrigin(1, 0).setDepth(20);

    this.waveText = this.add.text(W / 2, 10, 'WAVE 1', {
      font: '16px monospace', fill: '#aaaaff'
    }).setOrigin(0.5, 0).setDepth(20);

    this.powerupLabel = this.add.text(W / 2, 620, '', {
      font: '14px monospace', fill: '#00ffff'
    }).setOrigin(0.5, 1).setDepth(20);
  }

  spawnWave() {
    const W = this.cameras.main.width;

    if (this.wave >= 4) {
      this.startBossFight();
      return;
    }

    const rows = 3;
    const cols = 5;
    const spacingX = 70;
    const spacingY = 55;
    const startX = W / 2 - (spacingX * (cols - 1)) / 2;
    const startY = 80;
    const speed = 60 + (this.wave - 1) * 20;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const type = ENEMY_TYPES[r % ENEMY_TYPES.length];
        const e = this.physics.add.sprite(startX + c * spacingX, startY + r * spacingY, type);
        e.setScale(0.6);
        e.setVelocityX(speed);
        e.hp = 1 + (this.wave > 2 ? 1 : 0);
        this.enemies.add(e);
      }
    }

    this.enemyDir = 1;
    this.waveText.setText(`WAVE ${this.wave}`);
    this.showWaveBanner(`WAVE ${this.wave}`);
  }

  showWaveBanner(text) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const banner = this.add.text(W / 2, H / 2, text, {
      font: 'bold 40px monospace', fill: '#ffffff', stroke: '#0000ff', strokeThickness: 4
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({
      targets: banner, alpha: 0, y: H / 2 - 60,
      duration: 1200, ease: 'Power2',
      onComplete: () => banner.destroy()
    });
  }

  startBossFight() {
    const W = this.cameras.main.width;
    this.isBossWave = true;
    this.waveText.setText('BOSS!');
    this.showWaveBanner('BOSS INCOMING!');

    this.bossHP = this.bossMaxHP;
    this.boss = this.physics.add.sprite(W / 2, -60, 'boss');
    this.boss.setScale(2);
    this.boss.setDepth(5);

    // Fly boss in
    this.tweens.add({
      targets: this.boss, y: 100, duration: 1200, ease: 'Bounce.Out',
      onComplete: () => {
        this.physics.add.overlap(this.playerBullets, this.boss, this.bulletHitBoss, null, this);
        this.startBossMovement();
      }
    });

    // HP bar
    this.bossHPBarBg = this.add.rectangle(W / 2, 28, 300, 14, 0x440000).setDepth(20);
    this.bossHPBar = this.add.rectangle(W / 2 - 150, 28, 300, 10, 0xff2222).setOrigin(0, 0.5).setDepth(21);
    this.bossHPText = this.add.text(W / 2, 42, `HP: ${this.bossHP}`, {
      font: '12px monospace', fill: '#ff8888'
    }).setOrigin(0.5).setDepth(22);
  }

  startBossMovement() {
    if (!this.boss) return;
    const W = this.cameras.main.width;
    this.tweens.add({
      targets: this.boss,
      x: { from: W * 0.2, to: W * 0.8 },
      duration: 2000 - (this.bossHP < 15 ? 600 : 0),
      yoyo: true, repeat: -1, ease: 'Sine.InOut'
    });
  }

  enemyShoot() {
    if (!this.gameActive) return;

    if (this.isBossWave && this.boss) {
      this.bossShoot();
      return;
    }

    const living = this.enemies.getChildren().filter(e => e.active);
    if (living.length === 0) return;

    const shooter = Phaser.Utils.Array.GetRandom(living);
    this.fireBullet(shooter.x, shooter.y + 35, 0, 280, 'laserRed');
  }

  bossShoot() {
    if (!this.boss) return;
    const phase2 = this.bossHP <= 15;
    const spreadCount = phase2 ? 5 : 3;
    const spreadAngle = 30;

    for (let i = 0; i < spreadCount; i++) {
      const offset = (i - Math.floor(spreadCount / 2)) * spreadAngle;
      const angle = Phaser.Math.DegToRad(90 + offset);
      const speed = 250;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.fireBullet(this.boss.x, this.boss.y + 40, vx, vy, 'laserRed');
    }
  }

  fireBullet(x, y, vx, vy, texture) {
    const group = texture === 'laserRed' ? this.enemyBullets : this.playerBullets;
    const bullet = group.create(x, y, texture);
    bullet.setScale(0.7);
    bullet.setDepth(8);
    bullet.setVelocity(vx, vy);

    this.time.delayedCall(3000, () => { if (bullet.active) bullet.destroy(); });
    return bullet;
  }

  spawnMeteor() {
    if (!this.gameActive || this.wave < 2) return;
    const W = this.cameras.main.width;

    const x = Phaser.Math.Between(30, W - 30);
    const type = Math.random() > 0.4 ? 'meteorBig' : 'meteorMed';
    const m = this.physics.add.sprite(x, -30, type);
    m.setScale(type === 'meteorBig' ? 0.8 : 0.6);
    m.setVelocity(Phaser.Math.Between(-40, 40), Phaser.Math.Between(120, 200));
    m.setAngularVelocity(Phaser.Math.Between(-80, 80));
    m.setDepth(4);
    this.meteors.add(m);

    this.time.delayedCall(6000, () => { if (m.active) m.destroy(); });
  }

  dropPowerup(x, y) {
    if (Math.random() > 0.25) return;
    const types = ['powerupFire', 'powerupShield', 'powerupStar'];
    const type = Phaser.Utils.Array.GetRandom(types);
    const p = this.physics.add.sprite(x, y, type);
    p.setScale(0.8);
    p.setVelocity(0, 70);
    p.setDepth(6);
    p.powerType = type;
    this.powerups.add(p);
    this.time.delayedCall(8000, () => { if (p.active) p.destroy(); });
  }

  bulletHitEnemy(bullet, enemy) {
    bullet.destroy();
    this.spawnFlash(enemy.x, enemy.y);
    enemy.hp -= 1;
    if (enemy.hp <= 0) {
      this.dropPowerup(enemy.x, enemy.y);
      enemy.destroy();
      this.addScore(10 * this.wave);
    } else {
      this.cameras.main.shake(60, 0.004);
    }

    if (this.enemies.countActive() === 0) {
      this.time.delayedCall(600, () => {
        this.wave++;
        this.enemyDir = 1;
        this.spawnWave();
      });
    }
  }

  bulletHitBoss(bullet, boss) {
    bullet.destroy();
    this.spawnFlash(boss.x + Phaser.Math.Between(-40, 40), boss.y + Phaser.Math.Between(-20, 20));
    this.bossHP = Math.max(0, this.bossHP - 1);
    this.addScore(5);
    this.updateBossHPBar();

    if (this.bossHP === 15) {
      this.showWaveBanner('PHASE 2!');
      // Restart movement faster
      this.tweens.killTweensOf(boss);
      this.startBossMovement();
    }

    if (this.bossHP <= 0) {
      this.defeatBoss();
    }
  }

  updateBossHPBar() {
    if (!this.bossHPBar) return;
    const pct = this.bossHP / this.bossMaxHP;
    this.bossHPBar.width = 300 * pct;
    this.bossHPBar.setFillStyle(pct > 0.5 ? 0xff2222 : pct > 0.25 ? 0xff8800 : 0xffff00);
    this.bossHPText.setText(`HP: ${this.bossHP}`);
  }

  defeatBoss() {
    this.isBossWave = false;
    this.tweens.killTweensOf(this.boss);

    for (let i = 0; i < 12; i++) {
      this.time.delayedCall(i * 120, () => {
        if (this.boss) this.spawnFlash(
          this.boss.x + Phaser.Math.Between(-50, 50),
          this.boss.y + Phaser.Math.Between(-40, 40)
        );
      });
    }

    this.time.delayedCall(1500, () => {
      if (this.boss) { this.boss.destroy(); this.boss = null; }
      this.endGame(true);
    });
  }

  bulletHitPlayer(bullet, _player) {
    if (!this.gameActive) return;
    bullet.destroy();
    this.hitPlayer();
  }

  meteorHitPlayer(meteor, _player) {
    if (!this.gameActive) return;
    meteor.destroy();
    this.hitPlayer();
  }

  bulletHitMeteor(meteor, bullet) {
    bullet.destroy();
    this.spawnFlash(meteor.x, meteor.y);
    meteor.destroy();
    this.addScore(2);
  }

  hitPlayer() {
    if (this.shieldActive) {
      this.shieldActive = false;
      if (this.shieldGraphic) { this.shieldGraphic.destroy(); this.shieldGraphic = null; }
      this.cameras.main.shake(100, 0.008);
      return;
    }

    this.lives--;
    this.livesText.setText(`LIVES: ${this.lives}`);
    this.cameras.main.shake(120, 0.015);
    this.spawnFlash(this.player.x, this.player.y);

    // Invincibility flicker
    this.player.setAlpha(0.3);
    this.time.delayedCall(1800, () => { if (this.player.active) this.player.setAlpha(1); });

    if (this.lives <= 0) {
      this.time.delayedCall(300, () => this.endGame(false));
    }
  }

  collectPowerup(powerup, _player) {
    const type = powerup.powerType;
    powerup.destroy();

    if (type === 'powerupFire') {
      this.fireRate = FIRE_RATE_RAPID;
      this.powerupLabel.setText('RAPID FIRE!').setFill('#ffaa00');
      this.time.delayedCall(POWERUP_DURATION, () => {
        this.fireRate = FIRE_RATE_DEFAULT;
        this.powerupLabel.setText('');
      });
    } else if (type === 'powerupShield') {
      this.shieldActive = true;
      if (this.shieldGraphic) this.shieldGraphic.destroy();
      this.shieldGraphic = this.add.circle(0, 0, 30, 0x0088ff, 0.35).setDepth(9);
      this.powerupLabel.setText('SHIELD ACTIVE').setFill('#44aaff');
      this.time.delayedCall(POWERUP_DURATION, () => {
        this.shieldActive = false;
        if (this.shieldGraphic) { this.shieldGraphic.destroy(); this.shieldGraphic = null; }
        this.powerupLabel.setText('');
      });
    } else if (type === 'powerupStar') {
      this.tripleShot = true;
      this.powerupLabel.setText('TRIPLE SHOT!').setFill('#ff88ff');
      this.time.delayedCall(POWERUP_DURATION, () => {
        this.tripleShot = false;
        this.powerupLabel.setText('');
      });
    }
  }

  addScore(pts) {
    this.score += pts;
    this.scoreText.setText(`SCORE: ${this.score}`);
  }

  spawnFlash(x, y) {
    const flash = this.add.circle(x, y, 20, 0xffaa00, 0.9).setDepth(15);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 300, onComplete: () => flash.destroy() });
  }

  endGame(victory) {
    this.gameActive = false;
    this.enemyShootEvent.remove();
    this.meteorEvent.remove();

    const best = Math.max(parseInt(localStorage.getItem('spaceHighScore') || '0'), this.score);
    localStorage.setItem('spaceHighScore', best);

    this.time.delayedCall(600, () => {
      if (victory) {
        this.scene.start('VictoryScene', { score: this.score });
      } else {
        this.scene.start('GameOverScene', { score: this.score });
      }
    });
  }

  update(_time, delta) {
    if (!this.gameActive) return;

    // Scroll background
    this.bg.tilePositionY -= 1.5;

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Player movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-280);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(280);
    } else {
      this.player.setVelocityX(0);
    }

    // Shield graphic follows player
    if (this.shieldGraphic) {
      this.shieldGraphic.setPosition(this.player.x, this.player.y);
    }

    // Auto fire
    this.fireTimer += delta;
    if (this.fireTimer >= this.fireRate) {
      this.fireTimer = 0;
      this.playerFire();
    }

    // Enemy formation movement (bounce off walls)
    if (!this.isBossWave) {
      this.updateEnemyFormation();
    }

    // Clean up out-of-bounds bullets
    this.playerBullets.getChildren().forEach(b => {
      if (b.y < -20) b.destroy();
    });
    this.enemyBullets.getChildren().forEach(b => {
      if (b.y > H + 20 || b.x < -20 || b.x > W + 20) b.destroy();
    });
    this.meteors.getChildren().forEach(m => {
      if (m.y > H + 50) m.destroy();
    });
    this.powerups.getChildren().forEach(p => {
      if (p.y > H + 20) p.destroy();
    });
  }

  playerFire() {
    const x = this.player.x;
    const y = this.player.y - 45;

    if (this.tripleShot) {
      this.fireBullet(x, y, -120, -550, 'laserBlue');
      this.fireBullet(x, y, 0, -580, 'laserBlue');
      this.fireBullet(x, y, 120, -550, 'laserBlue');
    } else {
      this.fireBullet(x, y, 0, -580, 'laserBlue');
    }
  }

  updateEnemyFormation() {
    const W = this.cameras.main.width;
    const living = this.enemies.getChildren().filter(e => e.active);
    if (living.length === 0) return;

    const rightmost = Math.max(...living.map(e => e.x));
    const leftmost = Math.min(...living.map(e => e.x));
    const speed = 60 + (this.wave - 1) * 20;

    if (rightmost > W - 30 && this.enemyDir === 1) {
      this.enemyDir = -1;
      living.forEach(e => { e.setVelocityX(-speed); e.y += 18; });
    } else if (leftmost < 30 && this.enemyDir === -1) {
      this.enemyDir = 1;
      living.forEach(e => { e.setVelocityX(speed); e.y += 18; });
    }

    // If enemies reach the bottom, game over
    const lowest = Math.max(...living.map(e => e.y));
    if (lowest > this.cameras.main.height - 80) {
      this.endGame(false);
    }
  }
}
