// hurdleDash — NEW SIDE-SCROLLER sport leaf. This is the one that proves the
// dual-view abstraction for real: gravity + jump + camera-follow, through the
// SAME RoundScene/helper surface the top-down sport uses. Touches ONLY ctx.helpers.
//
// Auto-run to the right; press Z to jump over hurdles. Win: clear all hurdles.
// Fail: collide with a hurdle. Fail detection is in-sport (AABB on positions) so
// it runs identically under real Phaser and the Node stub — not reliant on a collider.

const RUN_SPEED = 200;
const JUMP_V = -560;
const GROUND_Y = 400;
const FLOOR_TOP = GROUND_Y - 12;          // top surface of the ground slab
const PLAYER_H = 28;
const HURDLE_W = 18;
const HURDLE_H = 46;

export const hurdleDash = {
  id: 's_hurdle_dash',
  version: 1,
  displayName: 'Hurdle Dash',
  viewMode: 'sidescroller',
  tags: ['run', 'jump', 'rhythm'],
  baseRoundConfig: { hurdleCount: 4, spacing: 320 },

  createRound(ctx) {
    const h = ctx.helpers;
    const count = ctx.config?.hurdleCount ?? 4;
    const spacing = ctx.config?.spacing ?? 320;

    h.addBackdrop();
    const ground = h.addStatic(2000, GROUND_Y + 12, 4000, 40, 0x1b3a4b);
    const player = h.spawnActor(80, FLOOR_TOP - PLAYER_H / 2, {
      w: 24, h: PLAYER_H, color: 0x7bff00, dynamic: true, gravity: true
    });
    h.collideStatic(player, ground);

    // hurdles at increasing x; jitter from the seeded rng (PG-03 determinism)
    const hurdles = [];
    let hx = 420;
    for (let i = 0; i < count; i++) {
      hx += spacing + Math.floor((h.rng() - 0.5) * 60);
      const hurdle = h.addStatic(hx, FLOOR_TOP - HURDLE_H / 2, HURDLE_W, HURDLE_H, 0xff2d55);
      hurdles.push({ x: hx, cleared: false, _a: hurdle });
    }
    const finishX = hx + 160;

    let cleared = 0;
    let failed = false;

    function overlaps(a, b) {
      return Math.abs(a.x - b.x) < (HURDLE_W / 2 + 12) &&
             Math.abs(a.y - b.y) < (HURDLE_H / 2 + PLAYER_H / 2);
    }

    return {
      update(/* t, dt */) {
        if (failed || cleared >= count) return;
        const inp = h.input();

        player.setVelocityX(RUN_SPEED);
        if (inp.actionJustPressed && player.onGround) {
          player.setVelocityY(JUMP_V);
          h.feedback('hit');
        }

        for (const hurdle of hurdles) {
          if (!hurdle.cleared) {
            if (overlaps(player, { x: hurdle.x, y: hurdle._a.y })) {
              failed = true; h.feedback('fail'); break;
            }
            if (player.x > hurdle.x + HURDLE_W) { hurdle.cleared = true; cleared += 1; }
          }
        }

        h.hud(`HURDLE DASH   cleared ${cleared}/${count}`);
      },
      getScore() { return cleared; },
      isComplete() { return cleared >= count && player.x >= 0; },
      hasFailed() { return failed; },
      wasCloseLoss() { return failed && cleared >= count - 1; },
      // expose for the camera-follow wiring in RoundScene
      getFollowTarget() { return player; },
      finishX() { return finishX; },
      destroy() { /* helpers._teardown handles cleanup */ }
    };
  }
};
