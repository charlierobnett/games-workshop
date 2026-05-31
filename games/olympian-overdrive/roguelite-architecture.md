# Olympian Overdrive — Roguelite BUILD Architecture (reference)

**Status:** reference architecture — validated on paper; next step is the de-risking SPIKE (not the spec).
**Date:** 2026-05-31
**Provenance:** GBA-commissioned A+B architecture sprint → Gemini Deep Research → Azure GPT-5.4 synthesis (runId `2026-05-31T22-20-58-683Z-c8daa1`, $0.115). **Full synthesis (with ALL code sketches — equipment/modifier/overdrive interfaces, validators, helpers):** `AI-OS/05_LOGS/pushes/2026-05-31-roguelite-build-architecture.md` (§Azure synthesis). *Note: that synthesis hit the token cap; §7 there is truncated — the complete boundary + spike are below.*
**Pairs with:** [`roguelite-evolution.md`](roguelite-evolution.md) (the DESIGN: Constant-Learning / Respect & Mastery / Overdrive) — this doc is the BUILD architecture for it.
**Build approach (the step change):** **hand-architect a stable core, then GENERATE sport/equipment/modifier modules against fixed interfaces.** Stop whole-game generation. (GBA Step-Change Assessment: `AI-OS/.../games-workshop-agent-state.md`, 2026-05-31.)

---

## Verdict + the 5 decisions to lock

- **Biggest risk = the CONTENT SEAM**, not persistence or scene count. If generated modules reach into scene internals, the "generate the leaves" strategy collapses into unregeneratable glue. Get the plugin interface right above all else.
- **Dual-view = CONDITIONAL SANE.** One Phaser engine hosts top-down + side-scroller **if** all paradigm-specific wiring hides behind one `RoundScene` + a `VIEW_PRESETS` table, AND **cross-paradigm Overdrive is forbidden in v1**.
- **Keep it simple for solo vanilla-JS** — few scenes, strict ownership, explicit contracts. (Reject Gemini's daemon-scenes / ECS / TS-first overreach.)

**Lock these now:**
1. Replace the single `GameManager`-on-registry with **3 state layers** (PersistentStore + RunController + scene-local). Registry = service locator, not the domain model.
2. **One generic `RoundScene`** loads a registered sport def + applies its declared `viewMode`. Not a scene per sport.
3. **Additive registries only** — sports/equipment/modifiers/overdrives self-register; core never edits switch statements.
4. **Versioned save migrations from day one** + corruption/first-run handling.
5. **Centralized transitions** (`SceneFlow` service) — scenes *request* transitions, never freestyle `start()` + sticky flags. (Directly fixes the soft-lock bug class from v2.)

---

## 1. State architecture — 3 layers

| Layer | Lives in | Owns | Resets |
|---|---|---|---|
| **PersistentStore** | JS service + `localStorage` | Respect, Mastery syllabus progress, unlocked equipment IDs, highest tier, settings, run-history summaries | never |
| **RunController** | in-memory JS object (created on run start, destroyed on run end) | run seed, tier/round/route, player HP/loadout/modifiers, active sport pool, overdrive flags, boss state, run score | per run |
| **scene-local** | fields on `this` | spawned entities, timers, UI refs, input bindings, camera state | per scene |

**Rule:** if it must survive scene restart, it does NOT belong in scene-local. `game.registry` is a *service locator / event bridge* (holds `{persistentStore, runController, contentRegistry, sceneFlow}`), not the domain model.

```js
// BootScene.initServices(game)
const persistentStore = new PersistentStore(localStorageAdapter);
persistentStore.load();
game.registry.set('services', { persistentStore, runController: null, contentRegistry, sceneFlow });
```

---

## 2. Save / persistence (localStorage)

Permanent: Respect, Mastery competencies, unlockedEquipmentIds, highestTierReached, settings, run-history summaries. **Not** permanent: HP, run loadout, draft choices, current round, run score, overdrive, seed. (If suspend/resume is wanted later, add a separate `activeRunSnapshot` key — don't mix into meta.)

```js
const SAVE_KEY = 'sports-roguelite-save';
const CURRENT_SCHEMA = 1;
const migrations = { 1:(s)=>s, /* 2:(v1)=>({...v1, schemaVersion:2, ...}) */ };

function migrateSave(raw){ let s=raw; while(s.schemaVersion<CURRENT_SCHEMA){ const n=s.schemaVersion+1; const m=migrations[n]; if(!m) throw new Error(`missing migration ${n}`); s=m(s);} return s; }

// PersistentStore.load(): read → if missing default+save → JSON.parse in try/catch
//   → migrateSave → validateOrRepair; on corrupt: back up under SAVE_KEY+'.corrupt.'+ts, reset defaults.
```
Validation pragmatic: required roots present, arrays are arrays, numbers are numbers, unknown IDs tolerated. No fake encryption (base64 ≠ security); optional checksum for tamper-deterrence only.

---

## 3. Scene graph & flow

```
Boot → Hub → [DraftScene] → RoundScene → DraftScene → RoundScene → BossRoundScene
            → RunResultScene → [TryoutScene] → Hub
```
Scenes: `BootScene, HubScene, DraftScene, RoundScene, RunResultScene, TryoutScene` (+ optional `UIScene` overlay only if HUD pain justifies — start with HUD inside RoundScene). **No permanent MetaState daemon scene** (Gemini overreach).

**Pass IDs/descriptors between scenes, not mutable state blobs** — read real state from RunController:
```js
this.scene.start('RoundScene', { roundId: nextRound.id });
// in create(data): const round = runController.getRoundDescriptor(data.roundId); ...
```

**Transition safety (kills the soft-lock class):** centralize in a `SceneFlow` service; a single in-flight guard cleared in `finally`; scenes never own a sticky `isTransitioning` flag — they call `sceneFlow.go(from, toKey, data)`.
```js
async go(fromScene, toKey, data={}){ if(this.inFlight) return false; this.inFlight={to:toKey};
  try { fromScene.input.enabled=false; fromScene.scene.start(toKey, data); return true; }
  finally { this.inFlight=null; } }
```
**Lifecycle discipline:** every scene keeps a `_disposers[]`, registers all external listeners through it, and flushes on `Phaser.Scenes.Events.SHUTDOWN`. No naked `setInterval` (Phaser timers only). No scene-to-scene refs. No scene writes the save except via PersistentStore.

---

## 4. Content plug-in seam  *(HIGHEST PRIORITY — this is what enables module generation)*

**Core principle:** generated modules are ADDITIVE LEAVES — drop file in, register it, done. No core edits, no switch statements, no "also update these 4 arrays."

```js
class ContentRegistry {
  constructor(){ this.sports=new Map(); this.equipment=new Map(); this.modifiers=new Map(); this.overdrives=new Map(); }
  registerSport(d){ assert(d.id && d.createRound); this.sports.set(d.id,d); }
  registerEquipment(d){ assert(d.id && d.applyToRun); this.equipment.set(d.id,d); }
  registerModifier(d){ assert(d.id && d.applyToRound); this.modifiers.set(d.id,d); }
  registerOverdrive(d){ assert(d.id && d.compose); this.overdrives.set(d.id,d); }
}
```

**Sport module interface** (narrow contract — LLMs generate better against small contracts):
```js
export const basketbrawl = {
  id:'s_basketbrawl', version:1, displayName:'BasketBrawl',
  viewMode:'topdown',           // 'topdown' | 'sidescroller'
  tags:['ball','arena'],
  baseRoundConfig:{ durationSec:45, scoreTarget:10, arenaKey:'arena_basket_01' },
  createRound(ctx){             // ctx: {scene, run, rng, assets, eventBus, helpers, config, viewMode}
    const world = ctx.helpers.createTopdownWorld(ctx.scene, ctx.config.arenaKey);
    // ...spawn via helpers only...
    return { update(t,dt){}, getScore(){return world.score;}, isComplete(){return world.score>=ctx.config.scoreTarget;}, destroy(){ world.destroy(); } };
  }
};
```
- **Equipment** = `applyToRun(runCtx)` registering hooks (`runCtx.hooks.modifyStat(...)`, `.on('roundStart', ...)`) — modifies run/player hooks, never owns scenes.
- **Modifier** = `applyToRound(roundCtx)` round-scoped mutator (may early-return on `roundCtx.viewMode` mismatch).
- **Overdrive** = curated `compose(ctx)` returning/mutating a round descriptor — NOT arbitrary fusion logic.
- **Data vs behavior, locked:** data = ids/labels/weights/tags/tuning/unlock-reqs; behavior = `createRound`/`applyToRun`/`applyToRound`/`compose` only. Generated modules may NOT invent new lifecycle methods.

**Make it LLM-generate-against-able** — per module type, a minimal context packet: (1) exact interface shape, (2) allowed helper APIs, (3) forbidden APIs (no scene imports, no localStorage, no transitions, no importing other sports), (4) one example module, (5) validation checklist. Plus runtime **validators** (`validateSportDefinition`) and a **smoke harness** (instantiate scene stub → `createRound` → assert `update/destroy` → run 3 frames → destroy clean). *That* is what makes regeneration practical. (Full validator/harness code in the research log.)

---

## 5. Dual-view abstraction

**Agnostic core** (must NOT know view mode): PersistentStore, RunController, draft generation, progression/unlocks, scoring summary, reward resolution, ContentRegistry, run flow, HUD data model.
**Paradigm-specific runtime:** physics config, movement controller, camera, level geometry, spawn rules, jump/platform logic, collision expectations.

A module declares `viewMode`; `RoundScene` wires the right preset:
```js
const VIEW_PRESETS = {
  topdown:      { physics:{gravity:{x:0,y:0}},    camera:{followLerp:[0.18,0.18], deadzone:null},      controllerFactory:createTopdownController,     worldFactory:createTopdownWorld },
  sidescroller: { physics:{gravity:{x:0,y:1400}},  camera:{followLerp:[0.12,0.08], deadzone:[180,140]}, controllerFactory:createSidescrollerController, worldFactory:createSidescrollerWorld },
};
// RoundScene.create(): preset=VIEW_PRESETS[sport.viewMode]; this.physics.world.gravity.set(...); runtime=sport.createRound({...helpers:makeRoundHelpers(this,preset)}); configureCamera(this.cameras.main, preset.camera, runtime.player);
```
Phaser supports **per-scene Arcade worlds** — switch gravity/camera at the scene level; you do NOT need separate engines.

**Overdrive cross-paradigm rule (v1):** **forbid** top-down + side-scroller fusion — it explodes module complexity and weakens the seam. `canFuse(a,b) => a.viewMode === b.viewMode`. Cross-paradigm showcase events, if ever, are **hand-built exceptions**, not generic system behavior.

---

## 6. Hand-build vs AI-generate boundary  *(completes the truncated synthesis §7)*

**HAND-BUILD (core — human-authored, stabilized FIRST):**
- the scene graph + `SceneFlow` service
- the 3 state layers (`PersistentStore` + save/migration, `RunController`, scene-local conventions)
- the `ContentRegistry`
- the `VIEW_PRESETS` + `RoundScene` wiring + `makeRoundHelpers` (the allowed-helpers API: `createTopdownWorld`/`createSidescrollerWorld`/`spawnPlayer`/`spawnBall`/`addScore`/`completeRound`…)
- the HUD + Draft UI shell (Respect bar, Mastery syllabus checklist, pick-1-of-3)
- the validators + smoke harness + the per-module-type context packets

**AI-GENERATE (leaves — against fixed interfaces):** individual sport modules, equipment items, modifiers, overdrive compositions — each self-contained, conforming to its interface, using only allowed helpers, gated by its validator + a 3-frame smoke test before it ships.

---

## 7. The SPIKE — de-risk BEFORE the spec  *(the immediate next build session)*

Hand-build the core + **two sports**, prove it composes, *then* write the roguelite spec:
- **1 top-down sport** — port existing Pickleball or Soccer into the new `SportDefinition` interface.
- **1 NEW side-scroller sport** — e.g. *Hurdle Dash* (gravity + jump + camera-follow), to prove the dual-view abstraction for real.
- **1 minimal run** — 2–3 rounds + a `RunResultScene`.
- **Persistence** — Respect + Mastery written to localStorage and read back on boot.

**It must prove three things:** (1) both view modes compose through one `RoundScene`; (2) a run flows and commits meta on end; (3) a sport module drops in cleanly against the interface. **If it holds → the architecture is validated → write the spec → generate the rest.** If it doesn't, the architecture is wrong and we'd rather know now than mid-spec.

---

## Open questions (carry forward)
1. The two design-side gaps from `roguelite-evolution.md` (Respect growth weighting; Mastery demonstration thresholds) — these become DATA in the progression config, read by agnostic-core.
2. Per-sport view-mode mapping (which sports → scroller vs top-down) — the freshness lever; decide as sports are designed.
3. Art/audio ambition (parallel track) — Kenney + gpt-image-2 mechanics-first; uplift later.
4. New GBA routines this build needs: Architecture Review, Module-Generation, Run-Integration (the agent levels up alongside the game).
5. Fold the new spec contracts (RS/MP/EQ/PG/OD from `roguelite-evolution.md`) into spec v4 AFTER the spike validates the architecture.