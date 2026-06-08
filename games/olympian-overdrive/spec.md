# Olympian Overdrive — Spec

**Date:** 2026-05-24 (v3.0) · revised 2026-05-25 (v3.1 — fidelity uplift) · 2026-06-07 (v4 — roguelite progression layer)
**Status:** approved (M1 contracts) · v4 roguelite layer is **design-contract + progression-DATA**, gated by the de-risking spike before generation
**Target mode:** pipeline (M1 leaves) · **hand-architect core, generate modules** for the roguelite layer (see `roguelite-architecture.md`)
**Spec version:** 4
**Previous versions:** v1 — broken visuals (procedural rectangles), broken physics (no gravity), texture-key drift. v2 — added Texture Key Contract + Physics Tuning Targets; plays mechanically but lacks game feel. v3/v3.1 — four methodology contracts + per-rule IDs + fidelity uplift.
**Changes in v3:** Adds the four contracts from [ai-game-spec-methodology.md](../../../AI-OS/02_DOMAIN_OS/NEXUS_OS/knowledge/ai/process/ai-game-spec-methodology.md) — Game Feel, expanded Difficulty, expanded Visual Style, QA. Bakes in postmortems from v1+v2 bugs (see `games-workshop-agent-state.md`). All v2 content that worked (Texture Key Contract, Physics Tuning Targets, Locked Decisions) preserved.
**Changes in v3.1 (2026-05-25 fidelity uplift):** Spec Review of v3.0 scored Game Feel at 68% predicted fidelity (no per-rule IDs, no runtime verification). v3.1 addresses: (a) Texture Key Contract rewritten to enforce `{sport}_{role}_{variant}` namespace grammar and declare `asset-keys.js` manifest as the single source of truth (closes the asset-key drift surface from v1/v2); (b) Game Feel Contract gets GF-01..GF-12 IDs in an event-response table with measurable magnitudes plus a `?dev=1` runtime instrumentation gate so impact feedback is verified, not just specified; (c) Difficulty Contract gets DI-01..DI-08 IDs consolidating escalation + anti-frustration into one verifiable progression table; (d) House Rules expanded 16 → 19 to include the asset-key namespace contract from Round 2 sprint placement. All v3.0 content otherwise preserved.
**Changes in v4 (2026-06-07 roguelite progression layer):** Folds the **locked roguelite design** ([`roguelite-evolution.md`](roguelite-evolution.md)) + its build-architecture ([`roguelite-architecture.md`](roguelite-architecture.md)) into the spec as five new contracts — **Run Structure (RS), Meta-Progression (MP), Equipment/Skill (EQ), Procedural Generation (PG), Overdrive (OD)** — plus a **Game Feel Audio layer (GF-A)** (audio arrives this milestone). Numbers were recovered verbatim from past research via `extract.js` (2026-06-07 re-review) and three open forks were decided with Charlie (run-length split; momentum-assist `floor(F/2)`+cap; payout %-intent/token-display). Per the methodology + architecture: **behavioral intent locked; literal numbers `[PLAYTEST-GATED]`/`[RESEARCH-GATED]`; generation gated behind the spike.** All v3.1 content preserved. v4 also slates audio + Greek-myth visuals (previously deferred to "v4").

**Source:** Google Doc "Olympian Overdrive Retro Game Spec" — see `spec-raw.md`

---

## Concept

A 2D action-platformer / micro-game collection. **Athleticus, God of Peak Performance**, shatters the protagonist's Athletic Soul into 8-bit fragments after they nearly win the Mega-Decathlon. To reclaim it, the player conquers physics-based sports micro-games (5–15s each) that randomly cycle from a hub world. Difficulty scales every loop.

**View:** All sports use **2D top-down view** (confirmed working in v2; do not revert to side-profile).
**Win condition (micro-game):** Sport-specific.
**Lose condition (micro-game):** Sport-specific OR 15s timer expiry.
**Long-term goal (full game):** Collect Soul Shards across infinite difficulty loops, spend on permanent upgrades (M2+).

---

## Milestone 1 — Vertical Slice (Sprints 1-3 from source GDD)

The proof-of-architecture build, now expanded with feel + QA. Demonstrates: FSM scene flow, two playable sports sharing one engine, mash-up framework, and a *feel layer* on top of working physics.

### M1 Step 1 — Core Engine & FSM (Sprint 1)

- **Scenes (Phaser):** `BootScene → MenuScene → ActiveScene(sport) → ResultScene → ActiveScene(next sport)` looping. Hub deferred to M2.
- **GameManager** singleton on `game.registry`: tracks `score`, `lives` (start 3), `difficultyLevel` (start 0, +1 per win).
- **InputManager** module abstracts keyboard to verb accessors:
  - `Axis_Horizontal()` → -1/0/+1 from `ArrowLeft` / `ArrowRight`
  - `Axis_Vertical()` → -1/0/+1 from `ArrowUp` / `ArrowDown`
  - `isStrikeJustPressed()` → `X` key (true ONLY on first frame down — not while held)
  - `isStartJustPressed()` → `SPACE`
- **Global UI Layer (depth ≥ 1000):**
  - Top-left: `SCORE: ###` (white, monospace 14px)
  - Top-right: `MULT: x1.00` (cyan ≥ 1.0, green ≥ 1.5)
  - Top-center: `TIME: 15.0` (white, countdown each frame)
  - Below score: `LIVES: ❤️ ❤️ ❤️` (red — use unicode heart sprites or fallback to text "LIVES: 3")
- **Dev keys (preserved from v2):** `1` jumps to Pickleball, `2` Soccer, `3` Mash-Up, `N` in-game fail-skip, `W` in-game win-skip, `0` return to menu.

### M1 Step 2 — Two-Sport MVP: Pickleball + Soccer

**Resolution:** 640 × 480, top-down view.

#### Sport A — Pickleball (top-down)

**Court geometry:** Court 80,60 → 560,420. Net at y=240. Kitchen zones 480×40 centered on net. Player baseline y=380, AI baseline y=100. Player spawn (320, 380). Court boundaries enforced by **velocity-zeroing at edge** (NOT setPosition clamping — see Postmortem v2).

**Controller:** Arrow keys → velocity ±260 px/s horizontal, ±200 px/s vertical (constrained to lower half). X key → paddle hitbox at player position for **500ms**. Paddle visual: `racket_wood.png`.

**Level Manager:**
- Ball: `ball_tennis1.png`. Gravity 0 (top-down). Drag 20,20. Bounce 0.7,0.7. **`body.setAllowGravity(false)` on `.body`, not sprite** — house rule #14.
- AI opponent: `characterRed (1).png`. Deterministic serve cycle: (0,220), (-60,220), (60,220). Returns straight up at y=-220 after player hit.
- Win: 3 successful paddle-to-ball collisions.
- Fail: ball y > 410 (touched lower court edge) OR player overlaps kitchen with active paddle OR 15s timer.

#### Sport B — Soccer (top-down)

**Pitch geometry:** Pitch 40,40 → 600,440. Goal mouth x=200-440, y=40-80. Goalie line y=90, oscillates 220↔420 over ~1500ms. Player spawn (320, 400). Ball spawn (320, 360).

**Controller:** Arrow keys → velocity ±240 px/s both axes (constrained to pitch). X key → **proximity kick** (80px radius) AND strike hitbox (48×48 at player+8px in lastMoveDir).

**Level Manager:**
- Ball: `ball_soccer1.png`. **`body.setAllowGravity(false)`** (not on sprite). Drag 80,80. Bounce 0.5,0.5. MaxVelocity 500,500.
- Goalie: `characterRed (5).png`. setImmovable(true). Oscillates 220↔420 along y=90.
- Strike applies impulse vx = ball.x - player.x (min ±8) × 4, vy = -300 × 4 (clamped to -500 by maxVelocity).
- Win: ball enters goal trigger (x ∈ [200,440], y < 80).
- Fail: 15s timer (no longer auto-fail on N misses — v2 felt punishing).

### M1 Step 3 — Mash-Up Architecture

`Mashup_PickleSoccer` — load `LevelManager_Soccer` (pitch + goal + goalie + heavy soccer ball) with `Controller_Pickleball` (paddle hitbox). Architecture rule: Controllers export `init(player, collisionGroups)`, LevelManagers export `init(scene, controller)`. Mash-ups wire one of each.

**Reachable from MenuScene via `M` or `3` debug key.**

---

## Texture Key Contract  *(REWRITTEN IN v3 — namespace grammar)*

These are the canonical asset keys. BootScene loads exactly these by iterating `asset-keys.js`; every consumer file imports from that manifest. **No invention allowed downstream** — house rules #11, #17, #18, #19.

### Naming grammar (locked)

- **Sport-specific keys:** `{sport}_{role}_{variant}` in lowercase snake_case where `sport` ∈ {`pickleball`, `soccer`, `volleyball`} and `variant` is mandatory (use `default` when there is only one version).
- **Shared / cross-sport keys:** `{domain}_{role}_{variant}` where `domain` ∈ {`shared`, `ui`, `boot`}.
- **Banned forms:** raw generic standalone keys (`ball`, `player`, `court`, `paddle`); reordered grammars (`ball_soccer`); camelCase; hyphens; mixed case.

### Manifest file (declared, not invented)

All asset keys MUST live in `games/olympian-overdrive/src/assets/asset-keys.js` and be imported wherever used. BootScene iterates this manifest in its `preload()`; no consumer file declares its own asset key. Pre-build static check fails the build if any raw string asset key appears outside `asset-keys.js`.

### Canonical key table (M1)

| Key | Source path | Used by |
|---|---|---|
| `shared_player_jack_default` | `Sports Pack/PNG/Blue/characterBlue (3).png` | ActiveScene (both sports) |
| `pickleball_opponent_default` | `Sports Pack/PNG/Red/characterRed (1).png` | LevelManager_Pickleball |
| `soccer_goalie_default` | `Sports Pack/PNG/Red/characterRed (5).png` | LevelManager_Soccer |
| `pickleball_ball_default` | `Sports Pack/PNG/Equipment/ball_tennis1.png` | LevelManager_Pickleball |
| `soccer_ball_default` | `Sports Pack/PNG/Equipment/ball_soccer1.png` | LevelManager_Soccer |
| `pickleball_paddle_default` | `Sports Pack/PNG/Equipment/racket_wood.png` | Controller_Pickleball |

### Migration note (v2 → v3 keys)

Old `player-jack` → `shared_player_jack_default` · `player-ai-pickle` → `pickleball_opponent_default` · `player-goalie` → `soccer_goalie_default` · `ball-pickle` → `pickleball_ball_default` · `ball-soccer` → `soccer_ball_default` · `paddle` → `pickleball_paddle_default`. No aliases ship in v3 — full mechanical migration via `asset-keys.js`.

**Asset copy step (pre-build):** All 6 files already at `games/olympian-overdrive/public/assets/sports/` from v2. No re-copy needed. `asset-keys.js` to be created during build.

---

## Physics Tuning Targets

| Parameter | Target | Source/Why |
|---|---|---|
| Pickleball: player horizontal speed | 260 px/s | v2-validated; ~2s court traversal |
| Pickleball: player vertical speed | 200 px/s | v2-validated; slower for tracking |
| Pickleball: paddle active window | 500ms | v2-validated; kid reaction time |
| Pickleball: ball gravity | 0 (top-down) | v2-validated |
| Pickleball: ball drag | 20, 20 | v2-validated |
| Pickleball: ball bounce | 0.7, 0.7 | v2-validated |
| Pickleball: AI serve velocity | 220 px/s downward | v2-validated; ~1.6s crossing |
| Soccer: player speed both axes | 240 px/s | v2-validated |
| Soccer: strike impulse multiplier | 4 | v2-validated |
| Soccer: ball drag | 80, 80 | v2-validated |
| Soccer: ball bounce | 0.5, 0.5 | v2-validated |
| Soccer: ball maxVelocity | 500, 500 | v2-validated |
| Soccer: goalie oscillation period | 1500ms | v2-validated |
| Soccer: strike hitbox size | 48×48 at player+8px | v2-validated (was 28×28 at +18px, missed) |
| Round timer | 15s | GDD baseline |

---

## Game Feel Contract  *(NEW IN v3)*

The largest delta from v2. v2 has correct physics; v3 makes contact, scoring, and failure *feel like something*.

### Player fantasy
Player should feel like a snappy, capable athlete — every successful action has a brief, audible-then-visible *snap* of confirmation; every failure is clearly the universe's response, not an arbitrary punishment.

### Responsiveness targets (GF-01..GF-03)

| ID | Rule | Verification |
|---|---|---|
| GF-01 | Input-to-action latency under 1 frame (16ms). Arrow key press = next-frame velocity update | Dev-mode log: input → velocity delta ≤ 16ms |
| GF-02 | Strike (X) registers on JustDown only — not while held. Hold-repeat is anti-feel | Dev-mode log: holding X for 500ms fires exactly 1 strike event |
| GF-03 | Movement: zero acceleration ramp. Press → instant target velocity. Release → instant zero | Dev-mode log: setVelocity called with target value on the same frame as keydown |

### Impact feedback rules (GF-04..GF-12)

Every GF-ID below is observable at runtime. Missing or wrong-magnitude implementation = contract violation. Magnitudes are not suggestions — they are the verified spec.

| ID | Event | Behavior | Magnitude |
|---|---|---|---|
| GF-04 | Paddle hits ball (Pickleball) | Hit-stop (`physics.world.isPaused = true` then resume) | 50ms freeze |
| GF-05 | Paddle hits ball (Pickleball) | Camera shake | 4px amplitude, 120ms decay |
| GF-06 | Paddle hits ball (Pickleball) | Particle burst at contact — small white circles, alpha 1.0 → 0 over 300ms, scale 1 → 0.3 | 6-8 particles |
| GF-07 | Volley count updates (Pickleball) | Volley count text pulses, scale 1 → 1.3 → 1 | 200ms total |
| GF-08 | Ball enters goal (Soccer) | Hit-stop (bigger event than paddle hit) | 80ms freeze |
| GF-09 | Ball enters goal (Soccer) | Camera shake | 8px amplitude, 200ms decay |
| GF-10 | Ball enters goal (Soccer) | Particle burst at goal mouth — alpha 1.0 → 0 over 600ms, scale 1 → 0.4 | 16-20 particles |
| GF-11 | Ball enters goal (Soccer) | Goal-zone background flashes green → white → green | 400ms total |
| GF-12 | Ball enters goal (Soccer) | "GOAL!" text at screen center, scale 0 → 1.4 → 1 over 300ms, fades out by 1500ms | 1500ms total visible |

**No sound in M1** (deferred per Locked Decisions). Sound design returns in v4 kid session.

### Failure feedback (composite event — not per-element GF-tagged)

When the player fails (timer expires OR fail condition triggers):
- Hit-stop: 60ms freeze
- Screen darkens to 80% black over 200ms
- "FAIL!" text appears red, scale 0 → 1.2 → 1 over 250ms
- Camera shake: 5px amplitude, 150ms decay
- Background tints red over 400ms then transitions to ResultScene

### Round transition (Result → next sport)

- ResultScene shows outcome overlay 1500ms (per Locked Decisions)
- During the last 300ms, fade out to black
- ActiveScene fades in from black over 200ms

### Runtime instrumentation  *(NEW IN v3 — Game Feel verification gate)*

When the game URL includes `?dev=1`, the Game Feel layer logs every GF-ID firing to the browser console with timestamp and magnitude. Format: `[GF-04] hit-stop fired, duration=50ms, t=12.347s`. The Game Builder Agent's Post-Build Review routine inspects the dev-mode log against the GF table:

- **Pass:** every GF-ID fires at least once during the QA playtest with magnitude within ±10% of spec
- **Fail:** any GF-ID never fires OR fires with magnitude outside ±10% tolerance

`?dev=1` mode is non-default; production build strips logging. This makes Game Feel *measurable*, not just aspirational — closing the v2 gap where impact feedback was specified but never verified.

**Q-S → GF-ID mapping** (used by Post-Build Review):
- Q-S01 (paddle contact feels responsive) → GF-01, GF-02, GF-04, GF-05, GF-06, GF-07
- Q-S02 (goal celebration feels rewarding) → GF-08, GF-09, GF-10, GF-11, GF-12
- Q-S03 (failure feels like "the universe responded") → Failure feedback section (composite, no per-element GF-ID)
- Q-S04 (difficulty feels energetic) → routed to Difficulty Contract DI-IDs, not Game Feel

### Camera rules
- Top-down view has no camera follow (player constrained to small playfield, no scrolling needed)
- Shake triggers are the only camera dynamics
- Never shake on regular movement, only on impact/scoring/failure events

### State-specific feel notes
- On paddle activation (X press) but no ball contact: brief paddle sprite scale pulse (1 → 1.15 → 1 over 100ms) — confirms input was received
- On AI scoring (Pickleball, ball reached lower edge): same fail flow as timer expiry
- On player out-of-bounds movement attempt: no visual response (velocity-zeroed silently)

### Non-negotiables
1. Hit-stop on paddle/goal contact — without this, the contract is unfulfilled
2. Particles on score/contact events
3. Camera shake on impact/scoring/failure (different amplitudes per event class)
4. Volley count + score text pulses on update (small reactive UI)
5. No input lag — JustDown semantics on X, instant velocity on arrows

---

## Difficulty Contract  *(EXPANDED IN v3)*

### Target player
Kids ages 12-14 (Jack 12, Nola 14, plus their friends). First-time players should understand controls in under 10 seconds (movement obvious, X = strike from menu instructions). First success should occur within 1-2 attempts.

### Core skills tested
1. **Reaction time** — paddle swing timing in pickleball, kick timing in soccer
2. **Spatial positioning** — moving to intercept ball, dodging goalie
3. **Persistence** — 3-volley pickleball requires holding focus for 8-12s

### Onboarding expectations
- First Pickleball round (no prior context): success rate 40-60% on first attempt
- First Soccer round: success rate 50-70% on first attempt (simpler win condition)
- After 3 rounds of mixed sports: player should understand all four mechanics (move, strike pickle, move, kick soccer)

### Failure cadence targets
- Average retries before first win per sport: 1-2
- Time lost on failure before next round: 1.5s (ResultScene overlay)
- Lives start at 3; first session expected to last 4-8 rounds before game-over

### Forgiveness systems
- 80px proximity kick in Soccer — generous (was edge-tangent in v2, frustrating)
- 500ms paddle active window — kid-reactable
- No tightening hitboxes as difficulty increases (v1/v2 had this in spec; remove)

### Escalation rules + anti-frustration (DI-01..DI-08)

Every DI-ID below is a load-bearing difficulty rule. Violating any of these = contract violation. `review-game.js` (when built) checks DI-01, DI-02, DI-03 statically; DI-04 through DI-08 are kid-playtest observations.

| ID | Rule | Scope | Verification |
|---|---|---|---|
| DI-01 | Difficulty multiplier: `multiplier = 1 + (difficultyLevel × 0.25)` — affects SCORE only, not gameplay parameters | All sports | Static: grep gameplay param assignments for `difficultyLevel` references |
| DI-02 | Never reduce hitbox size on the same sport across difficulty levels in M1 | All sports | Static: hitbox dimensions are constants, not difficulty-derived |
| DI-03 | Never increase AI speed on the same sport across difficulty levels in M1 | All sports | Static: AI velocity constants, not difficulty-derived |
| DI-04 | Lives start at 3; first session expected 4-8 rounds before game-over | GameManager | Playtest |
| DI-05 | Recovery after failure: 1.5s ResultScene overlay, no menus, auto-next sport | ResultScene | Playtest + code: `delayedCall(1500, ...)` |
| DI-06 | Never 2 new mechanics in the same encounter — players learn one thing per round | Mash-up + future sports | Playtest |
| DI-07 | Difficulty adds *variety, not tightness* — future mash-ups, future sports; never tighter existing sports | M2+ design rule | Design review |
| DI-08 | Never instant-fail on a single bad input. (M2 consideration: 2-strike before fail in Pickleball ball-touches-ground) | All sports | Playtest |

(M2+) Boss rounds introduce harder mechanics; base sports stay reachable per DI-07.


### Success metrics
- By end of session (~6-8 rounds), player demonstrates: confident movement, intentional strike timing, awareness of win condition
- Difficulty should feel *energetic, never punishing* — measured by: do they want to play another round after a fail?

---

## Roguelite Progression Layer  *(NEW IN v4 — RS / MP / EQ / PG / OD)*

The five contracts below fold the locked roguelite design ([`roguelite-evolution.md`](roguelite-evolution.md)) and its recovered build-payload into the spec. They follow the methodology rule: **behavioral intent is locked now; literal numbers tagged `[PLAYTEST-GATED]` or `[RESEARCH-GATED]` are filled from the smallest-slice playtest, not invented.**

> **Build sequencing (from [`roguelite-architecture.md`](roguelite-architecture.md) §7 — do not skip):** this layer is the **design-contract + progression-DATA** spec. It is consumed by the de-risking **SPIKE** (hand-build core + 2 sports), and only *after* the spike validates the architecture does the agent **generate the leaves** (sport/equipment/modifier/overdrive modules against fixed interfaces). v4 does **not** authorize whole-game generation — that failure mode is exactly what the 3-layer + content-seam architecture exists to prevent. The progression numbers here (Respect weighting, Mastery `N`, payout curve, pool size) are the "DATA in the progression config" the agnostic core reads.

Data model is **oracle-grade** (recovered verbatim) and load-bearing for every downstream module — honor exact types:
- `Respect` = a single **cumulative integer**, never reset, no decay, no multi-tier.
- `Mastery` syllabus = strictly a **1-D boolean array** (one True/False per skill). No decay, no partial credit, no multi-tier.

### Run Structure Contract (RS-01..RS-06)

| ID | Rule | Value | Status | Verification |
|---|---|---|---|---|
| RS-01 | A run is **3 Matches × escalating rounds**, structure `Match → Draft → Match → Boss` | 3 matches × **4 / 5 / 6** rounds ≈ **15 rounds** | intent locked; round-count `[PLAYTEST-GATED]` (between raw's ~18 and synthesis's ~9–11) | RunController descriptor; playtest |
| RS-02 | Target run length | **7–10 min**, hard cap enforced | `[PLAYTEST-GATED]` — the 12yo sets it | Playtest timing |
| RS-03 | Each round is a single 5–15s microgame (the existing sport/mash-up loop) | 5–15s | locked | Code: round timer bounds |
| RS-04 | **A run terminates ONLY when the `runLives` integer reaches 0** — never on a single microgame failure | `runLives` int, base 3 | locked (raw RS-04) | Static: run-end path keyed on `runLives<=0` only |
| RS-05 | Run state (HP, loadout, draft picks, round, seed, score) lives in **RunController**, destroyed per run; never in PersistentStore | — | locked | Code review: save-key allow-list (architecture §2) |
| RS-06 | Draft occurs **between** matches (pick-1-of-3); the boss is the final Match's last beat (telegraphed) | — | locked | Scene-flow review |

### Meta-Progression Contract (MP-01..MP-09)

| ID | Rule | Value | Status | Verification |
|---|---|---|---|---|
| MP-01 | **Respect** grows **challenge-weighted** — a close loss in a harder tier is worth more than an easy win in a lower one | challenge multiplier 3-step **0.9 / 1.0 / 1.2** | intent locked; curve `[RESEARCH-GATED]` (synthesis rejected 1.3× as failure-farmable) | Code: reward = base × challengeMult; playtest |
| MP-02 | **Mastery** is demonstrated by a **consistency threshold**, never a single success: a rolling array of the last **4** binary outcomes, pass = **3-of-4** | rolling-4, 3-of-4 | locked (BKT-grounded) | Code: gate evaluates `bools.slice(-4).filter(Boolean).length>=3` |
| MP-03 | **Tryout = diagnostic, not punishment**: a boolean success/fail array over **3 pre-determined microgames**; on fail, highlight the missing skill icon **red** (zero dynamic text) and route to the development tournament that teaches it | 3-microgame bool array | locked (the thesis, DI-09) | Code + playtest |
| MP-04 | **Payout model = percentage intent, token display**: reward is computed on the % curve, surfaced to the player as whole shard tokens | R1 wipe **15%** / final-round loss **85%** / full win **120%** of next unlock | DECIDED 2026-06-07; absolute token costs `[PLAYTEST-GATED]` | Code: reward math derives from % curve, not flat per-round stipend |
| MP-05 | **Minimum payout floor**: a failed run must still award **≥ the cost of the cheapest permanent-upgrade node** | ≥ cheapest node (raw worked example: 50) | locked (the "losses are fuel" teeth) | Static: floor clamp present on run-end reward |
| MP-06 | **Momentum assist (subtractive difficulty)**: effective run-lives = `base + min(floor(F/2), 3)`, where `F` = consecutive failures in the current tier (accumulating, capped at +3) | base 3, +1 per 2 fails, cap +3 | DECIDED 2026-06-07 | Code: exact formula; playtest |
| MP-07 | Two currencies, distinct scope: a **run-scoped temporary** currency (Hype/Momentum) spent between rounds on temporary gear; a **permanent** currency (Soul Shards) spent in the locker room on permanent unlocks | — | locked | Code: temp currency in RunController, permanent in PersistentStore |
| MP-08 | Loss-reward generosity (North Star: losses are fuel): standard loss = **60%** of a win; close loss = **80%** | 60% / 80% | `[PLAYTEST-GATED]` (synthesis values; more generous than raw 50/65–75) | Playtest |
| MP-09 | Permanent currency is **front-loaded and loss-friendly** — never a configuration where an early wipe nets ~zero | — | locked | Playtest + MP-05 |

### Equipment / Skill Contract (EQ-01..EQ-07)

| ID | Rule | Value | Status | Verification |
|---|---|---|---|---|
| EQ-01 | Edge is **rule-CHANGING verbs, never `+%` stat bumps**; never shrink hitboxes or inflate AI speed (ties DI-02 / DI-03 / DI-07) | — | locked | Static: grep item defs for `*= `, hitbox/AI-speed writes — fail on match |
| EQ-02 | **One data-driven, tag-based item schema, two tiers** via a `source`/`rarity` field: `draft` (common run-floor) vs `overdrive` (premium, rule-bending, won in Overdrive) | one schema | locked (DP3/DP4) | Schema review |
| EQ-03 | **Gear** = run-scoped rule-changing verbs (reset per run). **Skills** = **permanent technique unlocks that become demonstrable Mastery competencies** (edge feeds the L1 learning loop) | — | locked | Code: gear in RunController, skills write Mastery array |
| EQ-04 | **Orthogonality**: no two items in the pool may share the same functional logic | — | locked (the variety teeth) | Static: functional-signature dedupe in validator |
| EQ-05 | Every item carries **1–3 System Tags** from a controlled vocabulary (e.g. `[Retry] [Control] [Ricochet] [Chaos]`) | 1–3 tags | locked | Schema validator |
| EQ-06 | **Pool size + active cap**: tier-1 pool ≈ **12–14** items; **max active = 3**. The cap is the variety lever, not a budget — `C(n,k)`: `C(24,3)=2,024` vs `C(24,4)=10,626` unique builds; the over-scope cliff is hard-coded **pairing** exceptions, not raw count | pool ~12–14, max active 3 | active-cap locked; pool size `[PLAYTEST-GATED]` | Validator: active ≤ 3 |
| EQ-07 | Active abilities use **discrete charges per Match**, never real-time cooldown timers | per-Match charges | locked | Code review |

### Procedural Generation Contract (PG-01..PG-04)

| ID | Rule | Value | Status | Verification |
|---|---|---|---|---|
| PG-01 | **RNG scope is bounded** to exactly: round order, modifier assignment, draft offerings, and boss variant. Nothing else is procedural (no procedural physics, hitboxes, or AI tuning) | 4 allowed axes | locked | Static: RNG calls confined to these systems |
| PG-02 | **Draft = pick-1-of-3, synergy-weighted**: increased probability of offering an item sharing a System Tag with current inventory, but **always keep ≥1 wildcard** (anti-tunnel) | 3 options, ≥1 wildcard | locked | Code + playtest |
| PG-03 | RNG is **seeded** from the run seed (RunController), Phaser RNG `seed` set as an array in game config — for reproducible playtests and E2E determinism | seeded | locked (else defaults to `Date.now`) | Static: seed wired; QA reproducibility |
| PG-04 | Procedural selection **never** introduces a tightness spike (ties DI-07) — variety only | — | locked | Design + playtest |

### Overdrive Contract (OD-01..OD-06)

| ID | Rule | Value | Status | Verification |
|---|---|---|---|---|
| OD-01 | Overdrive is a **per-tier boss-equivalent** for the first build: telegraphed, climactic, predictable. Random interrupts deferred to v1.1 | per-tier boss | locked (DP7) | Scene-flow review |
| OD-02 | Chaos comes from **fusion / variety, never tightness** (DI-07); introduce **one new wrinkle at a time** (DI-06); always **telegraphed** (DI-08) | — | locked | Playtest |
| OD-03 | Overdrive is **the one place winning matters** and the **source of premium gear/skills** | — | locked | Design |
| OD-04 | **Losing Overdrive = no premium reward, never a run-ender** | — | locked (anti-frustration) | Code: loss path cannot decrement to run-end |
| OD-05 | **Same-viewMode fusion only**: `canFuse(a,b) => a.viewMode === b.viewMode`. Cross-paradigm (top-down × side-scroller) fusion is **forbidden in v1** (would explode the content seam) | same-viewMode | locked (architecture §5) | Static: `canFuse` guard present |
| OD-06 | Overdrive cadence / frequency | — | `[RESEARCH-GATED]` | Playtest |

### Game Feel — Audio Layer (GF-A01..GF-A04)  *(v4 — audio arrives this milestone)*

Audio was deferred from M1 (Locked Decision #5); v4 adds it. These are recovered build-payload (GF contract), oracle-grade.

| ID | Rule | Value | Status | Verification |
|---|---|---|---|---|
| GF-A01 | **Win** feedback = a **high-frequency major-chord** chime | major chord, high freq | locked | Runtime: `?dev=1` audio event log |
| GF-A02 | **Loss** feedback = a **low-frequency descending minor-chord** | descending minor, low freq | locked | Runtime audio event log |
| GF-A03 | **Failure must be energetic / comical**, never deflating — paired with a full-screen high-contrast stamp (core anti-frustration mandate, ties Q-S03 / DI success metric) | — | locked | Kid playtest |
| GF-A04 | Player character renders in **saturated primary** color; backgrounds **desaturated / darkened** so the player and ball read first (ties VI-07 / VI-08) | — | locked | Visual review |

---

## Visual Style Contract  *(EXPANDED IN v3)*

### Style statement
Bright, flat-shaded top-down sports pixel art using Kenney Sports Pack as M1 baseline. Greek mythology / neon retro identity arrives in v4 via `generate-sprite.js` — M1 ships with Kenney coherence. No texture filtering (pixel-perfect).

### Reference anchors
- Primary: Kenney Sports Pack flat-shaded characters + tile-based court (see `Sample1.png`)
- Avoid: side-profile platformer art, 3D-rendered sprites, photo-realistic textures

### Palette (locked for v3)
- Court / pitch: green (`#2f9e44` primary, `#1f7a33` accent for goal mouth, `#103a2b` background)
- Player (Jack): blue (`characterBlue (3).png` — preserve original colors)
- AI opponent + Goalie: red (`characterRed` series)
- Hazard color rule: kitchen zone in Pickleball uses `#ff2e63` with 18% fill, 55% stroke — clearly DANGER
- UI accent: cyan (`#2ef2ff`) for primary HUD, green (`#7bff00`) for "go" states, red (`#ff2d55`) for fail
- Background saturation rule: courts saturated, HUD overlays low-saturation

### Shape language
- Characters: rounded oval silhouettes (top-down heads with body extending below — Kenney convention)
- Hazards: rectangular zones with bold colored borders (kitchen zone pattern)
- UI elements: rectangles with 2-4px strokes, monospace text

### Texture / material rules
- All sprites pixel-perfect, no anti-aliasing
- Background tiles can be solid color fills with line overlays (court lines, center circle)
- No textures requiring shaders or blend modes — Phaser's default rendering only

### Readability priorities (highest → lowest)
1. Ball (primary game object — must be tracked visually at all times)
2. Player (control feedback)
3. AI / hazard (threat awareness)
4. UI text (score, timer, multiplier)
5. Court markings (boundary awareness)
6. Background (last)

If any element competes with ball visibility, reduce its saturation or scale.

### Visual rules (VI-01..VI-08)  *(NEW IN v3.1 — element-scoped IDs)*

Every VI-ID below is a load-bearing visual rule. Violating any of these = contract violation. VI-01..VI-04 are statically checkable; VI-05..VI-08 are visual-review observations.

| ID | Element | Rule | Quantified target | Verification |
|---|---|---|---|---|
| VI-01 | Palette | Court greens locked at `#2f9e44` primary / `#1f7a33` accent / `#103a2b` bg; UI accents at `#2ef2ff` cyan / `#7bff00` go / `#ff2d55` fail | Exact hex match — no near-shade substitution | Static: grep `setFillStyle\|setStrokeStyle\|setColor\|setBackgroundColor` for hex values, must match locked set |
| VI-02 | Hazard zone | Kitchen zone (Pickleball) uses `#ff2e63` fill at 18% alpha, stroke at 55% alpha, 2px stroke width | Color contrast vs `#2f9e44` court ≥ 4.5:1 (WCAG AA) | Static: hex/alpha values present; runtime: visual confirm |
| VI-03 | UI elements | Rectangles with 2-4px strokes, monospace text only (no proportional fonts) | Stroke width ∈ {2,3,4} px; font family = monospace | Static: grep `setStrokeStyle` widths; grep `fontFamily` |
| VI-04 | Asset filtering | All sprites pixel-perfect, no anti-aliasing, no shader blend modes | `texture.setFilter(Phaser.Textures.FilterMode.NEAREST)` on load OR project-wide `roundPixels: true` | Static: confirm one of the two patterns present |
| VI-05 | Characters | Rounded oval silhouettes; top-down heads with body below (Kenney convention) | Source assets from Kenney Sports Pack only in M1 | Visual review during Post-Build |
| VI-06 | Hazards | Rectangular zones with bold colored borders — never just a tint | Border stroke alpha ≥ 55%; fill alpha ≤ 25% | Visual review |
| VI-07 | Background saturation | Courts saturated; HUD overlays low-saturation so HUD never competes with ball | HUD background fills max 30% saturation | Visual review |
| VI-08 | Ball visibility | Ball is the highest-saturation moving element on screen at all times | No other moving element exceeds ball saturation | Visual review (readability priorities #1) |

**Q-S → VI-ID mapping** (used by Post-Build Review for subjective visual feel):
- Q-S subjective visual reads route through VI-05, VI-06, VI-07, VI-08
- VI-01..VI-04 are pre-playtest static gates; failures block ship per QA Contract acceptance gate

### Asset key conventions
Locked in Texture Key Contract above. Naming grammar (v3): `{sport}_{role}_{variant}` for sport-specific keys, `{shared|ui|boot}_{role}_{variant}` for cross-sport keys. Lowercase snake_case only — no camelCase, no hyphens, no mixed case. All keys live in `asset-keys.js` and are imported, never inlined as raw strings (house rules #17-19).

---

## QA Contract  *(NEW IN v3)*

The enforcement layer. Without this, the other contracts are aspirations.

### Mechanical checks (must pass — would block ship)
These are the future `review-game.js` rules + manual until tool is built.

| ID | Rule | Caught at |
|---|---|---|
| Q-M01 | All texture keys in consumer files exist in BootScene preload | Static scan |
| Q-M02 | Every `physics.add.group()` includes `classType: Phaser.Physics.Arcade.Sprite` | Static scan |
| Q-M03 | `setAllowGravity` only called on `.body`, never on sprite directly | Static scan |
| Q-M04 | `setColor` used for Text, never `setFill` | Static scan |
| Q-M05 | Sport keys consistent across MenuScene → ActiveScene → GameManager | Static scan |
| Q-M06 | Every controller method called by a LevelManager exists on the controller | Static scan |
| Q-M07 | `update()` guards with `if (!this.gameActive || !this.player) return;` | Static scan |
| Q-M08 | Vite build completes with no errors | `npx vite build` |

### Runtime smoke checks (must pass — would block ship)
Currently manual; future `playtest-game.js` automates.

| ID | Check | How |
|---|---|---|
| Q-R01 | Game boots without console errors | Open localhost:5174, check DevTools |
| Q-R02 | MenuScene → Pickleball transition works (press 1) | Manual |
| Q-R03 | Pickleball plays end-to-end (3 volleys to win) | Manual |
| Q-R04 | Soccer plays end-to-end (1 goal to win) | Manual |
| Q-R05 | Pickle-Soccer mash-up reachable (press M or 3) | Manual |
| Q-R06 | Random sport rotation after win/fail | Manual; play 3 rounds, verify variety |

### Subjective / feel checks (warning, not block)
Game Builder Agent's Postmortem routine flags these for Charlie.

| ID | Check | Method |
|---|---|---|
| Q-S01 | Paddle contact feels responsive (hit-stop + particles fire) | Kid playtest |
| Q-S02 | Goal celebration feels rewarding | Kid playtest |
| Q-S03 | Failure feels like "the universe responded" not "the game broke" | Kid playtest |
| Q-S04 | Difficulty feels energetic, not punishing | Did kid want another round? |

### Acceptance gate
**M1 (current):** ship-ready when all Q-M01 to Q-M08 pass, all Q-R01 to Q-R06 pass, at least 3 of 4 Q-S01-S04 checks pass.

**Roguelite layer (post-spike):** additionally all Q-M09 to Q-M16 pass; Q-S05 to Q-S08 are the playtest gates that ratify the `[PLAYTEST-GATED]` numbers before they lock. **The spike (architecture section 7) must pass first** — both view modes compose through one `RoundScene`, a run commits meta on end, and a sport module drops in cleanly — before any leaf generation is authorized.

### Roguelite-layer checks (v4 — apply post-spike, when the layer is built)

Static (must pass — would block ship of the roguelite layer):

| ID | Rule | Caught at |
|---|---|---|
| Q-M09 | Run ends ONLY on `runLives <= 0` — no run-end path keyed on a single microgame failure (RS-04) | Static scan |
| Q-M10 | Save-key allow-list honored: HP / loadout / draft / round / seed / score are NOT written to `PersistentStore` (RS-05) | Static scan |
| Q-M11 | `Respect` is an integer field; `Mastery` is a boolean array — no float/object drift (MP-01/MP-02, House Rule 17) | Static scan |
| Q-M12 | No equipment item applies a `+%` multiplier, hitbox resize, or AI-speed write (EQ-01) | Static scan: grep item defs |
| Q-M13 | Equipment validator enforces `max active <= 3`, `1-3` tags, and functional-signature orthogonality (EQ-04/05/06) | Validator |
| Q-M14 | RNG calls confined to round order / modifier assignment / draft offerings / boss variant; run seed wired into Phaser config (PG-01/PG-03) | Static scan |
| Q-M15 | `canFuse(a,b)` guards same-`viewMode` only; no cross-paradigm fusion path (OD-05) | Static scan |
| Q-M16 | Every generated module conforms to its validator + passes the 3-frame smoke harness before ship (architecture section 4) | Smoke harness |

Playtest (the smallest-slice question — the gate that fills the `[PLAYTEST-GATED]` numbers):

| ID | Check | Method |
|---|---|---|
| Q-S05 | A failed tryout reads as a **diagnostic** ("here's the one thing to learn"), not a punishment (MP-03 / DI-09) | Kid playtest |
| Q-S06 | An early-run wipe still feels rewarding (min payout floor lands; "losses are fuel") (MP-05/MP-09) | Kid playtest |
| Q-S07 | A run lands in **7-10 min** and the 12yo wants another (RS-01/RS-02 number-setting) | Timed kid playtest |
| Q-S08 | Overdrive reads as a climactic **opportunity**, telegraphed, and a loss never ends the run (OD-02/OD-04) | Kid playtest |

---

## Tech Stack
- Phaser 3.80+, Vite 5.x, vanilla JS ES modules
- Arcade Physics, world gravity y=0
- localStorage for score/lives/shards (M2+)
- 640 × 480 resolution
- Azure SWA free tier, GitHub auto-deploy

---

## Locked Decisions (preserved across versions)

1. Player: hardcode Jack for V1. Stella + selector in M2.
2. Pickleball AI: deterministic serve cycle.
3. Win/fail screen: 1.5s full-screen overlay, auto-roll next sport.
4. Mash-up reachability: `M` or `3` key from MenuScene.
5. Audio: deferred from M1. Kid session in v4.
6. View: top-down for ALL sports (v2-validated).
7. Visual baseline: Kenney Sports Pack for M1. Greek myth gpt-image-2 assets in v4.
8. Sport rotation: random (not sequential).
9. Debug skip key: `N` (fail+skip), `W` (win+skip), `0` (return to menu).
10. Texture key contract — no AI invention allowed.

**Roguelite architecture locks (v4 — from `roguelite-architecture.md`, the build foundation for RS/MP/EQ/PG/OD):**
11. **3 state layers**, not a single `GameManager`-on-registry: `PersistentStore` (+`localStorage`) / `RunController` (per-run, in-memory) / scene-local. `game.registry` is a service locator + event bridge, never the domain model.
12. **One generic `RoundScene`** loads a registered sport def and applies its declared `viewMode` via a `VIEW_PRESETS` table — **not a scene per sport**.
13. **Additive registries only** — sports / equipment / modifiers / overdrives self-register through a `ContentRegistry`; the core never edits switch statements. Generated modules are additive leaves.
14. **Centralized transitions** via a `SceneFlow` service with a single in-flight guard cleared in `finally`; scenes *request* transitions, never freestyle `start()` + sticky flags (fixes the v2 soft-lock class).
15. **Versioned save migrations from day one** (`SAVE_KEY` + `schemaVersion` + migration pipeline) + corruption/first-run handling. No fake encryption (base64 is not security).
16. **Data-vs-behavior module boundary, locked:** module *data* = ids/labels/weights/tags/tuning/unlock-reqs; module *behavior* = `createRound`/`applyToRun`/`applyToRound`/`compose` only. Generated modules may NOT invent new lifecycle methods, import other modules, touch `localStorage`, or trigger transitions.
17. **`Respect` = cumulative integer; `Mastery` = 1-D boolean array** (no decay, no multi-tier) — the oracle-grade data model every progression module reads (MP-01/MP-02).
18. **Spike before generation:** hand-build the core + 2 sports (1 top-down, 1 side-scroller) and prove it composes BEFORE generating the rest of the leaves (architecture section 7).

---

## House Rules for the Pipeline Build (21 rules — see `feedback_phaser_house_rules.md` memory)

**New in v4:** rules #20-21 (scene lifecycle + view-transition discipline, recovered from `roguelite-build-architecture` via the 2026-06-07 extract.js re-review). **Rule #21 is also promoted to the universal `build-game.js` HOUSE_RULES** (cross-build ratchet — every future game inherits it) per the dual-write routing model. The v4 roguelite **architecture locks (Locked Decisions #11-18)** also bind any roguelite-layer build — they are the structural contract the RS/MP/EQ/PG/OD modules generate against.

These get injected into `build-game.js` system prompt verbatim. New since v2: rules #14-16 (v2 build session). New since v3 spec authoring: rules #17-19 (asset-key namespace contract from Round 2 sprint placement, 2026-05-24) — these are enforced by the pre-build static checker.

1. `physics.add.group()` MUST include `classType: Phaser.Physics.Arcade.Sprite` + explicit `allowGravity`.
2. Use `group.create(x, y, key)` not `physics.add.sprite() + group.add()`.
3. Text uses `setColor`, NEVER `setFill`.
4. Tween-controlled physics sprites need `setImmovable(true)` + `body.setAllowGravity(false)`.
5. Damage handlers MUST have invulnerability flag/window.
6. Every scene file: `import Phaser from 'phaser';` at top.
7. `update()` MUST guard at top: `if (!this.gameActive || !this.player) return;`.
8. `vite.config.js`: `export default { base: './' };`
9. Every game folder needs `staticwebapp.config.json` SPA fallback.
10. Gravity logic: world y=0, per-body via `setGravityY()` requires `setAllowGravity(true)`.
11. Texture keys come from spec's Texture Key Contract. NO invention.
12. Player spawn coordinates from spec geometry, not (0,0).
13. Auto re-serve / respawn timers ≥ 1500ms.
14. **`setAllowGravity` is a BODY method**, not a SPRITE method. Always `sprite.body.setAllowGravity(false)`.
15. Scene transitions can leave menu locked on crash — defensive: `events.on('wake'|'resume', () => starting=false)` AND don't gate dev shortcuts behind starting flag.
16. **Sport/scene routing keys must be string-matched consistently across files** — use named constants in a shared file. v2 had `'mashup-picklesoccer'` vs `'mashup-pickle-soccer'` silent fail.
17. **Never use a raw string literal for a Phaser asset key outside the canonical asset manifest file.** All asset keys live in `asset-keys.js` and are imported everywhere else. This eliminates duplicate sources of truth — the largest contract-drift surface in v1/v2.
18. **All sport-specific asset keys must use `{sport}_{role}_{variant}` in lowercase snake_case.** The `sport` segment is mandatory and first. The `variant` segment is mandatory and last, including `default` when there is only one version. Banned generic standalone keys: `ball`, `player`, `court`, `net`, `goal`, `paddle`. Reordered forms like `ball_soccer` are also banned — namespace first or fail.
19. **BootScene must preload assets by iterating the canonical `asset-keys.js` manifest.** Do not hand-type preload keys inline — that recreates the exact drift surface we are trying to remove. Pre-build static check fails the build if raw string asset keys appear in any consumer file.
20. **Every scene keeps a `_disposers[]` array**, registers all external listeners/timers through it, and flushes them on `Phaser.Scenes.Events.SHUTDOWN`. No naked `setInterval` (Phaser timers only); no scene-to-scene refs; no scene writes the save except via `PersistentStore`. (Recovered: registry-listener duplication after N transitions causes one pickup to fire N UI updates.)
21. **View / encounter transitions use pause / sleep / wake, not teardown + rebuild.** To switch a view context (top-down to side-scroller) or pause for an encounter, `sleep` the scene (halts update + WebGL render, KEEPS allocations) and restore with `wake` so a procedural map is never reallocated/regenerated on return. Use `pause` when render state must stay visible. Never `stop()`+`start()` a scene whose generated/procedural state must persist. (Universal rule, also in `build-game.js` HOUSE_RULES.)

---

## Build & Verification

After Pipeline build, run agent's Post-Build Review routine (Q-M01 to Q-M08 manually until `review-game.js` exists).

Run Q-R01 to Q-R06 in browser at localhost:5174.

Capture Q-S01 to Q-S04 in kid playtest session — record reactions, append to `games-workshop-agent-state.md` Postmortem section.

---

## Out of scope for v3
- Hub World, slot machine, PersistentDataManager → M2
- Boss battles, Trinity Rule → M3
- Greek-themed visuals via `generate-sprite.js` → v4
- Audio → kid session
- Touch controls → mobile shipping
- `review-game.js` + `playtest-game.js` automation → separate tool builds (Sprint 1 #7 design)

## Out of scope / deferred for v4 (the roguelite layer)
- **Whole-game generation of the roguelite layer** — forbidden. Hand-build the core (3 state layers, `ContentRegistry`, `SceneFlow`, `RoundScene` + `VIEW_PRESETS`, validators + smoke harness), then generate leaves. The de-risking **spike comes first** (architecture §7).
- **Cross-paradigm Overdrive fusion** (top-down × side-scroller) → forbidden in v1; hand-built exception only if ever (OD-05).
- **Random Overdrive interrupts** → v1.1; v1 is per-tier boss-equivalent only (OD-01).
- **Suspend/resume of an in-progress run** → later; would need a separate `activeRunSnapshot` save key, never mixed into meta.
- **Filling the `[PLAYTEST-GATED]` / `[RESEARCH-GATED]` numbers** (run round-count, Respect weighting curve, Mastery `N`, pool size, payout token costs, Overdrive cadence) → set by the smallest-slice playtest / a games-design research pass, not invented now.
- **Tooling for the harness** (`playtest-game.js` GPU/determinism/seed contracts) → its own build; recovered build-payload banked in `HOBBES_BACKLOG.md` (2026-06-07).
