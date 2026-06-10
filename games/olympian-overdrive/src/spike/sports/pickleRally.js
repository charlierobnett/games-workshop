// pickleRally — TOP-DOWN sport leaf (ported from the v2/v3 Pickleball into the
// SportDefinition interface). Touches ONLY ctx.helpers — no Phaser, no scenes,
// no localStorage, no transitions. Discipline: the sport SETS velocities and
// READS positions; integration is the engine's (or the Node stub's) job.
//
// Win: land `targetVolleys` clean strikes. Fail: ball passes the baseline.

const TARGET_VOLLEYS = 3;
const PLAYER_SPEED = 240;
const BALL_SPEED = 230;
const STRIKE_RANGE = 46;
const TOP_Y = 90;
const BASE_Y = 430;

export const pickleRally = {
  id: 's_pickle_rally',
  version: 1,
  displayName: 'Pickle Rally',
  viewMode: 'topdown',
  tags: ['ball', 'timing', 'rally'],
  baseRoundConfig: { targetVolleys: TARGET_VOLLEYS },

  createRound(ctx) {
    const h = ctx.helpers;
    const target = ctx.config?.targetVolleys ?? TARGET_VOLLEYS;

    h.addBackdrop();
    const player = h.spawnActor(320, 380, { w: 26, h: 26, color: 0x2ef2ff });
    const ball = h.spawnActor(320, 160, { w: 16, h: 16, color: 0xffe066, dynamic: true });
    ball.setVelocity((h.rng() - 0.5) * 120, BALL_SPEED);

    let volleys = 0;
    let failed = false;
    let lastStrikeAt = -999;

    function strike(t) {
      volleys += 1;
      lastStrikeAt = t;
      const dx = ball.x - player.x;
      ball.setVelocity(Math.max(-220, Math.min(220, dx * 4)), -BALL_SPEED);
      h.feedback('hit');
    }

    return {
      update(t /* ms */) {
        if (failed || volleys >= target) return;
        const inp = h.input();

        // player movement (top-down: 8-way, no gravity)
        let vx = 0, vy = 0;
        if (inp.left) vx -= PLAYER_SPEED;
        if (inp.right) vx += PLAYER_SPEED;
        if (inp.up) vy -= PLAYER_SPEED;
        if (inp.down) vy += PLAYER_SPEED;
        player.setVelocity(vx, vy);

        // ball reflects off the top + side walls (manual: set velocity, never move)
        if (ball.y <= TOP_Y && ball.vy < 0) ball.setVelocity(ball.vx, BALL_SPEED);
        if (ball.x <= 90 && ball.vx < 0) ball.setVelocity(Math.abs(ball.vx), ball.vy);
        if (ball.x >= 550 && ball.vx > 0) ball.setVelocity(-Math.abs(ball.vx), ball.vy);

        // strike: Z when the ball is in range and moving toward the baseline
        const near = Math.abs(ball.x - player.x) < STRIKE_RANGE &&
                     Math.abs(ball.y - player.y) < STRIKE_RANGE;
        if (inp.actionJustPressed && near && ball.vy > 0 && (t - lastStrikeAt) > 120) {
          strike(t);
        }

        // fail: ball gets past the baseline
        if (ball.y > BASE_Y) { failed = true; h.feedback('fail'); }

        h.hud(`PICKLE RALLY   volleys ${volleys}/${target}`);
      },
      getScore() { return volleys; },
      isComplete() { return volleys >= target; },
      hasFailed() { return failed; },
      // close loss = failed but got most of the way (worth more Respect — MP-08)
      wasCloseLoss() { return failed && volleys >= target - 1; },
      destroy() { /* helpers._teardown handles actor cleanup */ }
    };
  }
};
