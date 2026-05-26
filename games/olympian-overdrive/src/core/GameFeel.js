import Phaser from 'phaser';

export default class GameFeel {
  constructor(scene) {
    this.scene = scene;
    this.devMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('dev') === '1';
    this.overlay = null;
    this.failText = null;
  }

  log(id, message, magnitude = '') {
    if (!this.devMode) return;
    const t = (this.scene.time.now / 1000).toFixed(3);
    const suffix = magnitude ? `, ${magnitude}` : '';
    console.log(`[${id}] ${message}${suffix}, t=${t}s`);
  }

  hitStop(duration, id = null) {
    if (id) {
      this.log(id, 'hit-stop fired', `duration=${duration}ms`);
    }
    this.scene.physics.world.pause();
    this.scene.time.delayedCall(duration, () => {
      if (this.scene && this.scene.physics && this.scene.physics.world) {
        this.scene.physics.world.resume();
      }
    });
  }

  cameraShake(duration, intensity, id = null) {
    if (id) {
      this.log(id, 'camera shake fired', `duration=${duration}ms amplitude=${intensity}`);
    }
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.shake(duration, intensity);
    }
  }

  particleBurst(x, y, count, config = {}, id = null) {
    if (id) {
      this.log(id, 'particle burst fired', `count=${count}`);
    }

    const particles = [];
    const color = config.color ?? 0xffffff;
    const duration = config.duration ?? 300;
    const startScale = config.startScale ?? 1;
    const endScale = config.endScale ?? 0.3;
    const speedMin = config.speedMin ?? 60;
    const speedMax = config.speedMax ?? 180;
    const radius = config.radius ?? 3;
    const depth = config.depth ?? 1200;

    for (let i = 0; i < count; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(speedMin, speedMax);
      const circle = this.scene.add.circle(x, y, radius, color, 1);
      circle.setDepth(depth);
      particles.push(circle);

      this.scene.tweens.add({
        targets: circle,
        x: x + Math.cos(angle) * speed * (duration / 1000),
        y: y + Math.sin(angle) * speed * (duration / 1000),
        scaleX: endScale / startScale,
        scaleY: endScale / startScale,
        alpha: 0,
        duration,
        ease: 'Quad.easeOut',
        onStart: () => {
          circle.setScale(startScale);
        },
        onComplete: () => {
          circle.destroy();
        }
      });
    }

    return particles;
  }

  pulse(target, scaleUp = 1.3, duration = 200, id = null) {
    if (!target) return;
    if (id) {
      this.log(id, 'ui pulse fired', `scale=${scaleUp} duration=${duration}ms`);
    }

    this.scene.tweens.killTweensOf(target);
    target.setScale(1);
    this.scene.tweens.add({
      targets: target,
      scaleX: scaleUp,
      scaleY: scaleUp,
      duration: duration / 2,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  }

  paddleWhiffPulse(target) {
    if (!target) return;
    this.scene.tweens.killTweensOf(target);
    target.setScale(1);
    this.scene.tweens.add({
      targets: target,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 50,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  }

  pickleballHit(contactX, contactY, volleyText = null, scoreText = null) {
    const particleCount = Phaser.Math.Between(6, 8);
    this.hitStop(50, 'GF-04');
    this.cameraShake(120, 0.00625, 'GF-05');
    this.particleBurst(contactX, contactY, particleCount, {
      color: 0xffffff,
      duration: 300,
      startScale: 1,
      endScale: 0.3,
      speedMin: 50,
      speedMax: 140,
      radius: 3
    }, 'GF-06');
    if (volleyText) {
      this.pulse(volleyText, 1.3, 200, 'GF-07');
    }
    if (scoreText) {
      this.pulse(scoreText, 1.15, 180);
    }
  }

  soccerGoal(goalZone, centerX, centerY) {
    const particleCount = Phaser.Math.Between(16, 20);
    this.hitStop(80, 'GF-08');
    this.cameraShake(200, 0.0125, 'GF-09');
    this.particleBurst(centerX, centerY, particleCount, {
      color: 0x7bff00,
      duration: 600,
      startScale: 1,
      endScale: 0.4,
      speedMin: 80,
      speedMax: 220,
      radius: 4
    }, 'GF-10');

    if (goalZone) {
      this.log('GF-11', 'goal-zone flash fired', 'duration=400ms');
      this.scene.tweens.killTweensOf(goalZone);
      const original = goalZone.fillColor ?? 0x1f7a33;
      goalZone.setFillStyle(0x7bff00, 0.9);
      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 400,
        onUpdate: (tween) => {
          const value = tween.getValue();
          if (value < 0.5) {
            goalZone.setFillStyle(0xffffff, 0.95);
          } else {
            goalZone.setFillStyle(0x7bff00, 0.9);
          }
        },
        onComplete: () => {
          goalZone.setFillStyle(original, 1);
        }
      });
    }

    const goalText = this.scene.add.text(centerX, centerY, 'GOAL!', {
      fontFamily: 'monospace',
      fontSize: '36px',
      fontStyle: 'bold'
    });
    goalText.setOrigin(0.5);
    goalText.setDepth(1300);
    goalText.setColor('#7bff00');
    goalText.setScale(0);
    this.log('GF-12', 'goal text fired', 'visible=1500ms');
    this.scene.tweens.add({
      targets: goalText,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 1,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: goalText,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: 'Quad.easeOut'
        });
      }
    });
    this.scene.tweens.add({
      targets: goalText,
      alpha: 0,
      delay: 900,
      duration: 600,
      onComplete: () => goalText.destroy()
    });
  }

  ensureFailOverlay() {
    if (this.overlay && this.overlay.active) return;

    const { width, height } = this.scene.scale;
    this.overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
    this.overlay.setDepth(1400);

    this.failText = this.scene.add.text(width / 2, height / 2, 'FAIL!', {
      fontFamily: 'monospace',
      fontSize: '40px',
      fontStyle: 'bold'
    });
    this.failText.setOrigin(0.5);
    this.failText.setDepth(1401);
    this.failText.setColor('#ff2d55');
    this.failText.setScale(0);
    this.failText.setAlpha(1);
  }

  playFailFeedback(backgroundTargets = []) {
    this.ensureFailOverlay();
    this.hitStop(60);
    this.cameraShake(150, 0.0078125);

    this.scene.tweens.killTweensOf(this.overlay);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0.8,
      duration: 200,
      ease: 'Quad.easeOut'
    });

    this.failText.setScale(0);
    this.failText.setAlpha(1);
    this.scene.tweens.killTweensOf(this.failText);
    this.scene.tweens.add({
      targets: this.failText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 125,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.failText,
          scaleX: 1,
          scaleY: 1,
          duration: 125,
          ease: 'Quad.easeOut'
        });
      }
    });

    backgroundTargets.forEach((target) => {
      if (!target) return;
      if (typeof target.setFillStyle === 'function') {
        const originalColor = target.fillColor ?? 0x103a2b;
        const originalAlpha = target.fillAlpha ?? 1;
        this.scene.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 400,
          onUpdate: (tween) => {
            const value = tween.getValue();
            const color = value < 0.5 ? 0x5a1020 : 0x7a162d;
            const alpha = Phaser.Math.Linear(originalAlpha, 1, value);
            target.setFillStyle(color, alpha);
          },
          onComplete: () => {
            target.setFillStyle(originalColor, originalAlpha);
          }
        });
      }
    });
  }

  fadeInFromBlack(duration = 200) {
    const { width, height } = this.scene.scale;
    const rect = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 1);
    rect.setDepth(1500);
    this.scene.tweens.add({
      targets: rect,
      alpha: 0,
      duration,
      onComplete: () => rect.destroy()
    });
  }

  fadeOutToBlack(duration = 300, onComplete = null) {
    const { width, height } = this.scene.scale;
    const rect = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
    rect.setDepth(1500);
    this.scene.tweens.add({
      targets: rect,
      alpha: 1,
      duration,
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
    return rect;
  }
}