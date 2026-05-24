# Olympian Overdrive — Spec

**Date:** 2026-05-23
**Status:** approved
**Target mode:** pipeline
**Spec version:** 1
**Source:** Google Doc "Olympian Overdrive Retro Game Spec" — see `spec-raw.md` for full GDD

---

## Concept

A 2D action-platformer / micro-game collection. The protagonist is on the verge of winning the "Mega-Decathlon" when **Athleticus, God of Peak Performance,** shatters their Athletic Soul into 8-bit fragments. To reclaim it, the player conquers physics-based sports micro-games — each 5–15 seconds — that randomly cycle from a hub world. Difficulty scales each loop.

**Win condition (micro-game):** Sport-specific (e.g., 3 pickleball volleys, 1 soccer goal).
**Lose condition (micro-game):** Sport-specific fail or timer expiry.
**Long-term goal (full game):** Collect Soul Shards across infinite difficulty loops, spend on permanent upgrades.
**Visual style:** Bright, neon 16-bit retro pixel with Greek mythology motifs (deferred to Milestone 2+ for full Greek treatment; Milestone 1 uses Kenney platformer base + generated sport props).

---

## Milestone 1 — Vertical Slice (Sprints 1-3 from source GDD)

The proof-of-architecture build. Demonstrates: FSM scene flow, two playable sports sharing one engine, mash-up framework. Goal — boots, loops infinitely between two sports, infinite difficulty scale. ~10–15 source files.

### M1 Step 1 — Core Engine & FSM (Sprint 1)

- **Scenes (Phaser):** `BootScene → MenuScene → ActiveScene(sport) → ResultScene → ActiveScene(next sport)` looping. (Hub World deferred to M2; for M1, ResultScene auto-rolls the next sport via random pick.)
- **GameManager** (singleton-style, on the Scene's `data` or a global module): tracks `score`, `lives` (start 3), `difficultyLevel` (start 0).
- **Unified Input Manager:** abstracts keyboard to action verbs:
  - `Axis_Horizontal` = Arrow Left / Right
  - `Axis_Vertical` = Arrow Up / Down
  - `Action_South` (Jump / Dodge) = `Z` key
  - `Action_West` (Strike / Throw) = `X` key
- **Global UI Layer:** Score (top-left), Difficulty Multiplier (top-right), Level Timer (top-center).
- **Win-state output:** transitions to ResultScene with `{ outcome: 'win' | 'fail', score, sport }`.

### M1 Step 2 — Two-Sport MVP (Sprint 2: Pickleball + Soccer)

User chose Pickleball + Soccer over the doc's default (Baseball + Soccer) — both 2D side-profile, both use "strike + ball physics," maximum code reuse.

**Sport A — Pickleball:**
- Viewpoint: 2D side-profile, single court.
- Controller (`Controller_Pickleball`): Arrow Left/Right moves player along X-axis. Pressing `X` spawns a paddle hitbox collider for 200ms (~5 frames at 60fps).
- Level Manager (`LevelManager_Pickleball`): tracks volley count, spawns a `Zone_Kitchen` rectangle (no-go zone near net). Ball is a high-bounce physics sprite. AI opponent serves the ball; deflects on contact.
- **Win:** 3 successful paddle-to-ball collisions without entering kitchen zone while paddle is active.
- **Fail:** Ball touches ground OR player overlaps kitchen zone with active paddle, OR timer (15s) expires.

**Sport B — Soccer:**
- Viewpoint: 2D side-profile, single net.
- Controller (`Controller_Soccer`): Arrow Left/Right movement. Pressing `X` initiates a dash-strike — player's strike collider extends in facing direction for 200ms.
- Level Manager (`LevelManager_Soccer`): ball is a heavy rigid body on the ground. Strike collider contact applies force vector based on contact point + a brief power slider (UI bar that fills while X is held, max 500ms). A goalie sprite (`Hazard_Goalie`) moves up/down on Y-axis, blocking the goal.
- **Win:** Ball enters goal trigger collider.
- **Fail:** Ball blocked by goalie 3 times, OR timer (15s) expires.

**Shared between sports:**
- Both load identical UI canvas (score, timer, difficulty multiplier).
- Both report win/fail to GameManager via the same callback signature.
- Both use the same player sprite (chosen at menu).

### M1 Step 3 — Mash-Up Architecture (Sprint 3)

Validates that Controllers (player verbs) and LevelManagers (rules/environment) are truly decoupled.

- **Demo mash-up:** `Mashup_PickleSoccer` — load `LevelManager_Soccer` (goal + goalie + heavy soccer ball) but assign `Controller_Pickleball` (paddle hitbox). Resulting gameplay: player uses pickleball paddle to deflect soccer ball into goal past moving goalie.
- **Architecture rule:** every Controller exports a function `attachToScene(scene)`; every LevelManager exports `init(scene, controller)`. A mash-up scene simply imports one of each and wires them.
- **Collision matrix:** define collision groups (`PlayerWeapon`, `EnvironmentHazard`, `Ball`, `Goal`) so mash-ups don't need new collision setup.

**M1 win state (Pipeline build success):**
- Boots in browser, plays Pickleball → Result → Soccer → Result → … infinitely.
- Difficulty multiplier increments after each successful round.
- Mash-up scene (`Mashup_PickleSoccer`) is reachable via debug key (e.g., press `M` at the menu).
- No console errors.

---

## Milestone 2 — Hub World + Roguelite Economy (Sprints 4-5)

**Not generated in first Pipeline build.** Captured here so the spec stays whole.

- "Locker Room at the End of Time" hub scene with 3 interactable nodes (Slot Machine, Workbench, Coach Hermes).
- Slot Machine UI animation that randomly selects the next mini-game from the unlocked pool.
- `PersistentDataManager`: persists Soul Shards and Lives across runs (localStorage).
- Workbench upgrade tree (first upgrade: "Extra Sweatbands" = +1 starting life).
- Wire the existing M1 sports into Hub-driven selection.

---

## Milestone 3 — Content Expansion + Bosses + Juice (Sprints 6-8)

**Not generated in first Pipeline build.** Captured here so the spec stays whole.

- Add remaining sports from GDD: Baseball, Basketball, Track & Field, Boxing, Bowling, Rock Climbing, Alpine Skiing, Paddleboarding, Trail Hiking, Weightlifting, Surfing, Pro Wrestling, Skateboarding, Ping Pong (subset based on schedule).
- Boss battles ("Trinity Rule"): each boss combines 3 sports' mechanics in sequence (e.g., Boss 1 = Track + Baseball + Bowling).
- Game feel polish: hit-stop on heavy impacts (50ms freeze), particle effects (confetti, sparks, dust), camera shake, audio triggers.

---

## Tech Stack

- **Framework:** Phaser 3 (3.80+) + Vite (5.x) — same as starter-space-shooter.
- **Language:** Vanilla JS, ES modules.
- **Physics:** Arcade Physics (no Matter — keeps consistency with starter game, sufficient for V1).
- **Persistence:** `localStorage` for score/lives/shards (M2+).
- **Deploy:** Azure Static Web Apps, free tier, auto-deploy from GitHub `main`.
- **Resolution:** 640×480 (4:3, gives retro feel and works on TV cast).

---

## Asset Map

Greek-myth-themed sports assets aren't in Kenney. **Strategy:** Use Kenney's Pixel Platformer base for character and environment, generate sport-specific props with `generate-sprite.js`. Athleticus / Coach Hermes / hub world art deferred to M2.

| Game element | Source | Asset file (planned) | Notes |
|---|---|---|---|
| Player character (Jack — V1 hardcoded) | Kenney Pixel Platformer | `kenney-all-in-1-3.5.0/2D assets/Pixel Platformer/Characters/character_0024.png` | Sprite sheet; needs idle + run + jump frames |
| Pickleball paddle | gpt-image-2 generated | `public/assets/sports/paddle.png` | "32×32 neon retro pixel pickleball paddle, side view" |
| Pickleball ball | gpt-image-2 generated | `public/assets/sports/ball-pickle.png` | "16×16 yellow pickleball with holes, retro pixel" |
| Soccer ball | Kenney Sports Pack (check available) | `kenney-all-in-1-3.5.0/2D assets/Sports/PNG/Equipment/ball_soccer.png` | Fallback: generate if not in bundle |
| Soccer goal / net | gpt-image-2 generated | `public/assets/sports/goal.png` | "retro pixel soccer goal with netting, 96×64" |
| Goalie sprite | Kenney Pixel Platformer | reuse character_0011 | Tinted/recolored variant |
| Court background | Kenney Pixel Platformer tileset | `kenney-all-in-1-3.5.0/2D assets/Pixel Platformer/Tiles/...` | Simple gradient or solid color works too |
| UI font | Phaser built-in monospace | n/a | Matches starter game's style |

**Asset generation step (before Pipeline build):** Run `generate-sprite.js` once per generated sprite. ~5 calls, ~$0.05 total. Or defer and Pipeline scaffolds with placeholders, kids generate during play.

---

## Locked Decisions (resolved 2026-05-23)

1. **Player character:** Hardcode **Jack "Turbo" Savage** for V1. Standard hurtbox, faster acceleration, heavy gravity on falls. Stella + selector arrive in M2 with the Hub World.
2. **Pickleball AI opponent:** Deterministic serve pattern. Same angle/speed every serve in V1 — predictable for testing and learning. Stateful AI in M2.
3. **Win/fail screen:** 1.5-second SUCCESS or FAIL overlay (full-screen color flash + text), then auto-roll next sport. Matches GDD State_Result timing.
4. **Mash-up reachability:** Debug key `M` from MenuScene only. Surface as a "Bonus Round" trigger in M2.
5. **Audio:** Deferred entirely from M1. Pipeline generates a silent game. Audio added in a later session with the kids (high-engagement moment).

---

## House Rules for the Pipeline Build (Learned from starter-space-shooter)

These MUST be enforced by `build-game.js` system prompt for every generated file:

- All `physics.add.group()` calls must specify `classType: Phaser.Physics.Arcade.Sprite` and appropriate `allowGravity`. Default group config produces non-physics sprites that silently break `setVelocity`.
- Use `group.create(x, y, key)` to spawn group children, never `physics.add.sprite() + group.add()`.
- Phaser Text styling: `setColor('#hex')`, never `setFill` (does not exist in Phaser 3 — silent crash).
- Sprites driven by tweens that also need physics bodies: `setImmovable(true)` + `body.setAllowGravity(false)`.
- Any "take damage" handler MUST have an invulnerability flag with a window (e.g., 1500ms) — without it, lives drain in single frames from multi-collision events.
- Every scene file imports Phaser at top: `import Phaser from 'phaser';`
- `update(time, delta)` must guard with `if (!this.gameActive || !this.player) return;` at the very top.
- `vite.config.js` must export `{ base: './' }` for Azure SWA's relative-path serving.
- Each game folder must contain `staticwebapp.config.json` with SPA navigation fallback.
