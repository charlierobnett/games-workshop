// viewPresets.js — the dual-view abstraction (architecture §5).
// ONE Phaser engine hosts both top-down and side-scroller rounds. All
// paradigm-specific wiring (gravity, camera) hides behind VIEW_PRESETS, and the
// sport module only ever touches the helper surface returned by makePhaserHelpers.
//
// The helper surface (the sport-facing API — mirrored exactly by the Node stub in
// the smoke harness, so a sport's logic runs identically in both):
//   h.viewMode, h.bounds, h.rng()
//   h.addBackdrop(), h.addStatic(x,y,w,h,color)
//   h.spawnActor(x,y,{w,h,color,dynamic,gravity}) -> actor
//   h.input() -> { left,right,up,down, action, actionJustPressed }
//   h.hud(str), h.feedback(kind)
// actor: { x, y, vx, vy, onGround, setVelocity(x,y), setVelocityX(x), setVelocityY(y), setPos(x,y), destroy() }

export const WORLD_W = 640;
export const WORLD_H = 480;

export const VIEW_PRESETS = {
  topdown: {
    gravity: { x: 0, y: 0 },
    camera: { followLerp: [0.18, 0.18], deadzone: null },
    backdrop: { bg: 0x103a2b, field: 0x2f9e44 }
  },
  sidescroller: {
    // recovered tuning (spec EQ/architecture §5): sidescroller gravity y:1400
    gravity: { x: 0, y: 1400 },
    camera: { followLerp: [0.12, 0.08], deadzone: [180, 140] },
    backdrop: { bg: 0x0d1b2a, field: 0x1b3a4b }
  }
};

// Tiny mulberry32 seeded RNG so runs are reproducible (spec PG-03).
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build the Phaser-backed helper surface for one round.
export function makePhaserHelpers(scene, preset, { seed = 1, viewMode }) {
  const rng = mulberry32(seed);
  const actors = [];
  let hudText = null;

  // per-scene Arcade gravity (Phaser supports per-scene worlds — no separate engine)
  scene.physics.world.gravity.set(preset.gravity.x, preset.gravity.y);

  const keys = scene.input.keyboard.addKeys({
    left: Phaser.Input.Keyboard.KeyCodes.LEFT,
    right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    up: Phaser.Input.Keyboard.KeyCodes.UP,
    down: Phaser.Input.Keyboard.KeyCodes.DOWN,
    action: Phaser.Input.Keyboard.KeyCodes.Z
  });

  function wrap(rect) {
    const actor = {
      _go: rect,
      get x() { return rect.x; },
      get y() { return rect.y; },
      get vx() { return rect.body ? rect.body.velocity.x : 0; },
      get vy() { return rect.body ? rect.body.velocity.y : 0; },
      get onGround() { return !!(rect.body && rect.body.blocked.down); },
      setVelocity(x, y) { rect.body && rect.body.setVelocity(x, y); },
      setVelocityX(x) { rect.body && rect.body.setVelocityX(x); },
      setVelocityY(y) { rect.body && rect.body.setVelocityY(y); },
      setPos(x, y) { rect.setPosition(x, y); },
      destroy() { rect.destroy(); }
    };
    actors.push(actor);
    return actor;
  }

  return {
    viewMode,
    bounds: { x: 0, y: 0, w: WORLD_W, h: WORLD_H },
    rng,

    addBackdrop() {
      scene.add.rectangle(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, preset.backdrop.bg).setDepth(-20);
      scene.add.rectangle(WORLD_W / 2, WORLD_H / 2, WORLD_W - 80, WORLD_H - 80, preset.backdrop.field)
        .setStrokeStyle(4, 0xffffff, 0.5).setDepth(-10);
    },

    addStatic(x, y, w, h, color = 0x7bff00) {
      const r = scene.add.rectangle(x, y, w, h, color);
      scene.physics.add.existing(r, true); // static body
      return wrap(r);
    },

    spawnActor(x, y, { w = 24, h = 24, color = 0x2ef2ff, dynamic = true, gravity = false } = {}) {
      const r = scene.add.rectangle(x, y, w, h, color).setDepth(10);
      scene.physics.add.existing(r);
      if (dynamic) {
        r.body.setCollideWorldBounds(true);
        r.body.setAllowGravity(gravity);
      }
      return wrap(r);
    },

    collideStatic(actor, staticActor) {
      scene.physics.add.collider(actor._go, staticActor._go);
    },

    input() {
      return {
        left: keys.left.isDown,
        right: keys.right.isDown,
        up: keys.up.isDown,
        down: keys.down.isDown,
        action: keys.action.isDown,
        actionJustPressed: Phaser.Input.Keyboard.JustDown(keys.action)
      };
    },

    hud(str) {
      if (!hudText) {
        hudText = scene.add.text(WORLD_W / 2, 24, str, { fontFamily: 'monospace', fontSize: '15px' })
          .setOrigin(0.5).setDepth(1000).setColor('#2ef2ff');
      } else {
        hudText.setText(str);
      }
    },

    feedback(kind) {
      // minimal game-feel pulse (GF layer is fuller in the real build)
      const cam = scene.cameras.main;
      if (kind === 'hit') cam.shake(80, 0.004);
      else if (kind === 'win') cam.flash(160, 120, 255, 120);
      else if (kind === 'fail') cam.shake(220, 0.012);
    },

    _teardown() {
      for (const a of actors) { try { a.destroy(); } catch (_) {} }
      if (hudText) { hudText.destroy(); hudText = null; }
    }
  };
}
