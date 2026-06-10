// smoke.mjs — Node smoke harness for the architecture spike. No browser, no Phaser.
// Proves the seam the spike exists to de-risk:
//   (2) a run flows and commits meta on end   — RunController + PersistentStore sim
//   (3) a sport module drops in cleanly        — validate + run both leaves via STUB helpers
// Proof (1) "both views compose through one RoundScene" is structural (verified by
// `vite build` + manual playtest); here we additionally run BOTH viewModes through the
// SAME stub-helper code path, differing only by preset — strong evidence it composes.
//
// The stub helpers mirror makePhaserHelpers EXACTLY, so a sport's createRound/update
// runs unchanged. Run: node src/spike/smoke.mjs

import assert from 'node:assert';
import { pickleRally } from './sports/pickleRally.js';
import { hurdleDash } from './sports/hurdleDash.js';
import { ContentRegistry } from './core/ContentRegistry.js';
import { validateSportDefinition, validateRoundRuntime } from './core/validateSport.js';
import { PersistentStore, createMemoryAdapter, MASTERY_SKILLS } from './core/PersistentStore.js';
import { RunController } from './core/RunController.js';
import { VIEW_PRESETS } from './core/viewPresets.js';

let passed = 0;
const ok = (name) => { console.log(`  ✓ ${name}`); passed++; };

// ---- Stub helper surface (mirrors makePhaserHelpers) ---------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function makeStubHelpers({ viewMode, seed = 1 }) {
  const preset = VIEW_PRESETS[viewMode];
  const G = preset.gravity.y;
  const dynamics = [];
  const spawned = [];
  let curInput = { left: false, right: false, up: false, down: false, action: false };
  let prevAction = false;

  function actor(x, y, halfW, halfH, gravityOn) {
    const a = { x, y, vx: 0, vy: 0, halfW, halfH, gravityOn, onGround: false, floors: [],
      setVelocity(vx, vy) { a.vx = vx; a.vy = vy; },
      setVelocityX(vx) { a.vx = vx; }, setVelocityY(vy) { a.vy = vy; },
      setPos(nx, ny) { a.x = nx; a.y = ny; }, destroy() {} };
    dynamics.push(a); spawned.push(a); return a;
  }

  const h = {
    viewMode, bounds: { x: 0, y: 0, w: 640, h: 480 }, rng: mulberry32(seed),
    addBackdrop() {},
    addStatic(x, y, _w, hh) { const s = { x, y, top: y - hh / 2, isStatic: true, destroy() {} }; spawned.push(s); return s; },
    spawnActor(x, y, { w = 24, h = 24, gravity = false } = {}) { return actor(x, y, w / 2, h / 2, gravity); },
    collideStatic(dyn, stat) { dyn.floors.push(stat.top); },
    input() { const jp = curInput.action && !prevAction; prevAction = curInput.action; return { ...curInput, actionJustPressed: jp }; },
    hud() {}, feedback() {}, _teardown() {},
    // harness-only
    _setInput(i) { curInput = { left: false, right: false, up: false, down: false, action: false, ...i }; },
    _actors: spawned,
    _dynamics: dynamics,
    _step(dt) {
      for (const a of dynamics) {
        if (a.gravityOn) a.vy += G * dt;
        a.x += a.vx * dt; a.y += a.vy * dt; a.onGround = false;
        for (const top of a.floors) {
          if (a.vy >= 0 && a.y + a.halfH >= top && a.y + a.halfH <= top + 60) {
            a.y = top - a.halfH; a.vy = 0; a.onGround = true;
          }
        }
      }
    }
  };
  return h;
}

const DT = 1 / 60;

// ---- A. interface validation ---------------------------------------------------
console.log('A. sport-definition validation');
assert(validateSportDefinition(pickleRally).ok, 'pickleRally should validate');
assert(validateSportDefinition(hurdleDash).ok, 'hurdleDash should validate');
ok('both sports satisfy the SportDefinition interface');
const bad = validateSportDefinition({ id: 'x', version: 1, displayName: 'X', viewMode: 'isometric', tags: [], baseRoundConfig: {} });
assert(!bad.ok && bad.errors.some((e) => e.includes('viewMode')), 'bad viewMode rejected');
const extra = validateSportDefinition({ ...pickleRally, sneakyBehavior() {} });
assert(!extra.ok && extra.errors.some((e) => e.includes('data-vs-behavior')), 'invented behavior key rejected');
ok('malformed leaves are rejected (bad viewMode + invented behavior key)');

// ---- B. pickleRally (top-down) drops in + reaches WIN with smart input ----------
console.log('B. pickleRally — top-down leaf, win path');
{
  const h = makeStubHelpers({ viewMode: 'topdown', seed: 42 });
  const rt = pickleRally.createRound({ helpers: h, config: pickleRally.baseRoundConfig, rng: h.rng });
  assert(validateRoundRuntime(rt).ok, 'runtime conforms');
  const [player, ball] = h._dynamics;
  let t = 0, frames = 0;
  while (!rt.isComplete() && !rt.hasFailed() && frames < 2400) {
    // smart controller: chase the ball x, sit near baseline, strike on approach
    h._setInput({
      left: ball.x < player.x - 4, right: ball.x > player.x + 4,
      up: player.y > 372, down: player.y < 360,
      action: Math.abs(ball.x - player.x) < 38 && Math.abs(ball.y - player.y) < 40 && ball.vy > 0
    });
    rt.update(t); h._step(DT); t += DT * 1000; frames++;
  }
  assert(rt.isComplete() && !rt.hasFailed(), `pickleRally should win (score ${rt.getScore()}, frames ${frames})`);
  assert(rt.getScore() === pickleRally.baseRoundConfig.targetVolleys, 'score equals target volleys');
  rt.destroy();
  ok(`drops in via stub helpers and reaches WIN (${rt.getScore()} volleys, ${frames} frames)`);
}

// ---- C. hurdleDash (side-scroller) gravity+jump+terminal -----------------------
console.log('C. hurdleDash — side-scroller leaf, gravity + jump');
{
  const h = makeStubHelpers({ viewMode: 'sidescroller', seed: 7 });
  const rt = hurdleDash.createRound({ helpers: h, config: hurdleDash.baseRoundConfig, rng: h.rng });
  assert(validateRoundRuntime(rt).ok, 'runtime conforms');
  const player = h._dynamics[0];
  // settle on ground a few frames
  for (let i = 0; i < 10; i++) { h._setInput({}); rt.update(0); h._step(DT); }
  assert(player.onGround, 'player rests on ground under gravity');
  const groundY = player.y;
  // press jump → player must leave the ground (y decreases), then land again
  h._setInput({ action: true }); rt.update(0); h._step(DT);
  h._setInput({ action: false });
  let minY = player.y, landedAgain = false;
  for (let i = 0; i < 120 && !rt.hasFailed() && !rt.isComplete(); i++) {
    rt.update(0); h._step(DT); minY = Math.min(minY, player.y);
    if (i > 5 && player.onGround) { landedAgain = true; break; }
  }
  assert(minY < groundY - 30, `jump leaves the ground (minY ${minY.toFixed(0)} < ${groundY.toFixed(0)})`);
  assert(landedAgain, 'player lands again (gravity returns it)');
  ok('gravity + jump + ground-contact behave through the same helper surface');

  // fail path: no input → player runs into the first hurdle and terminates
  const h2 = makeStubHelpers({ viewMode: 'sidescroller', seed: 7 });
  const rt2 = hurdleDash.createRound({ helpers: h2, config: hurdleDash.baseRoundConfig, rng: h2.rng });
  let f = 0; while (!rt2.hasFailed() && !rt2.isComplete() && f < 1200) { h2._setInput({}); rt2.update(0); h2._step(DT); f++; }
  assert(rt2.hasFailed(), 'no-input run fails on a hurdle (terminal reached)');
  ok(`reaches a terminal FAIL with no input in ${f} frames (cleared ${rt2.getScore()})`);
}

// ---- D. ContentRegistry drop-in ------------------------------------------------
console.log('D. ContentRegistry — additive leaves');
{
  const reg = new ContentRegistry();
  reg.registerSport(pickleRally);
  reg.registerSport(hurdleDash);
  assert(reg.listSportsByView('topdown').length === 1, 'one topdown sport');
  assert(reg.listSportsByView('sidescroller').length === 1, 'one sidescroller sport');
  let threw = false; try { reg.registerSport(pickleRally); } catch { threw = true; }
  assert(threw, 'duplicate id rejected');
  ok('register adds leaves; queryable by viewMode; duplicates rejected');
}

// ---- E. run flow + meta commit (the load-bearing proof) ------------------------
console.log('E. run flow + meta commit (PersistentStore + RunController)');
{
  // E1: RS-04 — run ends ONLY at runLives 0, never on a single loss
  const store = new PersistentStore(createMemoryAdapter());
  store.load();
  const plan = { tier: 0, rounds: [
    { sportId: 's_pickle_rally', difficultyStep: 1, skillIndex: 0 },
    { sportId: 's_hurdle_dash', difficultyStep: 1, skillIndex: 2 },
    { sportId: 's_pickle_rally', difficultyStep: 2, skillIndex: 1 }
  ] };
  const rc = new RunController(store, plan, { baseLives: 3, seed: 1 });
  assert(rc.resolveRound({ won: false }) === 'next', 'loss 1 does not end the run (lives 3->2)');
  assert(rc.runLives === 2, 'one life lost');
  assert(rc.resolveRound({ won: false }) === 'next', 'loss 2 does not end the run');
  assert(rc.resolveRound({ won: false }) === 'fail', 'loss 3 ends the run at lives 0');
  ok('RS-04: a run ends only when runLives hits 0');

  // E2: meta commit — Respect integer up + floor (MP-05) on a fail
  const before = store.getRespect();
  const sum = rc.commitMeta();
  assert(Number.isInteger(store.getRespect()), 'Respect stays an integer');
  assert(store.getRespect() > before, 'Respect increased');
  assert(sum.respectAward >= 10, 'minimum payout floor honored on a fail (MP-05)');
  assert(store.data.runHistory.length === 1, 'run recorded to history');
  assert(store.adapter.getItem('olympian-spike-save') !== null, 'save persisted to storage');
  ok(`meta committed on end: +${sum.respectAward} Respect (floor enforced), run saved`);

  // E3: win path bumps highest tier
  const store2 = new PersistentStore(createMemoryAdapter()); store2.load();
  const rc2 = new RunController(store2, plan, { baseLives: 3, seed: 2 });
  assert(rc2.resolveRound({ won: true }) === 'next', 'win round 1');
  assert(rc2.resolveRound({ won: true }) === 'next', 'win round 2');
  assert(rc2.resolveRound({ won: true }) === 'win', 'win final round ends run as win');
  rc2.commitMeta();
  assert(store2.data.highestTierReached === 1, 'highest tier bumped on a winning run');
  ok('win path commits a tier advance');

  // E4: MP-06 momentum assist — F=4 consecutive tier failures -> +2 lives
  const rc3 = new RunController(store, plan, { baseLives: 3, consecutiveTierFailures: 4 });
  assert(rc3.assistLives === 2 && rc3.runLives === 5, 'assist = min(floor(4/2),3) = 2');
  ok('MP-06: momentum assist = base + min(floor(F/2),3)');

  // E5: Mastery 3-of-4 rolling gate flips the boolean (MP-02)
  const store3 = new PersistentStore(createMemoryAdapter()); store3.load();
  assert(store3.recordMasteryOutcome(0, true) === false, 'one success: not yet');
  store3.recordMasteryOutcome(0, true);
  assert(store3.isSkillMastered(0) === false, 'two successes: still not (need 3)');
  store3.recordMasteryOutcome(0, false);            // window [T,T,F] = 2/3
  assert(store3.isSkillMastered(0) === false, 'T,T,F = 2 of 3: not mastered');
  const became = store3.recordMasteryOutcome(0, true); // window [T,T,F,T] = 3/4
  assert(became === true && store3.isSkillMastered(0), 'T,T,F,T = 3 of 4: mastered');
  assert(Array.isArray(store3.getMastery()) && store3.getMastery().length === MASTERY_SKILLS.length, 'mastery is a 1-D bool array');
  ok('MP-02: Mastery flips only on a 3-of-4 rolling-window demonstration');
}

console.log(`\nSMOKE PASS — ${passed} checks green. Architecture seam validated.`);
