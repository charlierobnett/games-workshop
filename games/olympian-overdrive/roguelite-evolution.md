# Olympian Overdrive — Roguelite Evolution: Design Direction

**Status:** **design LOCKED (structure) — 2026-06-07** → spec v4 pending a balance-numbers research pass. NOT yet a build spec. See **"Locked decisions (2026-06-07)"** below; the per-layer "to pin down / think through" subsections survive as the research brief for the numbers.
**Date:** 2026-05-31
**Provenance:** Gemini Deep Research → Azure GPT-5.4 synthesis (2026-05-31) + a design conversation (Charlie ↔ Hobbes, 2026-05-31). Full research + synthesis: `AI-OS/05_LOGS/pushes/2026-05-31-roguelite-sports-career-ladder.md`.
**Supersedes:** the synthesis's *win-gated* tier model — replaced by the Constant-Learning progression model below. Everything else from the synthesis composes underneath (see §"What survives").
**Build architecture:** see [`roguelite-architecture.md`](roguelite-architecture.md) — the hand-build-core + generate-modules reference (state layers, save, scene flow, the content plug-in seam, the dual-view abstraction, and the de-risking spike). This doc is the DESIGN; that one is the BUILD.

---

## North Star — the governing principle

> **Constant Learning.** Progression is NOT about wins — it's about gaining **experience and edge**. You learn more from losses than wins, especially in sports. The felt experience is learning, gaining ground, and compounding toward growth.

This is a playable expression of the "collapse time to expertise" thesis: **losses are the fuel, mastery is the gate, growth compounds.** You stay at a level until you've *learned enough* — not until you've won enough. The original "lose often early" framing is explicitly rejected; so is win-based progression.

Anti-frustration mandate carries over and *extends*: alongside `DI-07` (variety not tightness) and `DI-08` (no single-input instant-fail), add **DI-09 (new): never let the player feel stuck without seeing both WHY and that they're progressing.** Learning must be legible and almost-always-advancing.

---

## Locked decisions (2026-06-07)

The **structural direction is locked** (4 forks ratified with Charlie + the structural calls below). **Balance numbers are deliberately NOT locked** — they route to a games-design research pass (see *Research-gated* below), because `ai-generated-game-code-patterns.md` is explicit that our AI build pipeline cannot calibrate balance or feel. Each layer's "to pin down / think through" subsection survives as the **research brief** for those numbers.

**Three system layers:** **L1 Progression · L2 Edge · L3 Overdrive.** Core sports = the foundation the layers sit on; narrative = a frame, not a system layer. *(DP9 — ratified)*

**L1 — Progression:** Respect growth is **challenge-weighted** (a close loss vs a higher tier > an easy win vs a lower tier); Mastery is a **consistency threshold** (demonstrate a competency *N times reliably*, never a single success). The tryout = Respect invites, Mastery passes; a failed tryout is a **diagnostic** that routes to the development tournament teaching the missing competency. `[curve weighting + N → RESEARCH-GATED]`

**L2 — Edge:** **one data-driven, tag-based item schema, two tiers** via a `source`/`rarity` field — `draft` (common run-floor) vs `overdrive` (premium, rule-bending). **Gear** = run-scoped rule-changing verbs; **Skills** = **permanent technique unlocks that become demonstrable Mastery competencies** (edge feeds the L1 learning loop). Never `+%` stat bumps; never shrink hitboxes / inflate AI speed (DI-07). **Slice pool ~6–10 items.** *(DP3/DP4 — ratified)* `[pool-for-variety minimum → RESEARCH-GATED]`

**L3 — Overdrive:** **per-tier boss-equivalent** for the first build (telegraphed, climactic, predictable; random interrupts deferred to v1.1). Chaos via **fusion/variety**, never tightness (DI-07); one new wrinkle at a time (DI-06); telegraphed (DI-08). **The one place winning matters** + the source of premium gear/skills; **losing Overdrive = no premium reward, never a run-ender.** *(DP7 — ratified)* `[cadence/frequency → RESEARCH-GATED]`

**Story:** direction locked, **exploratory/non-blocking** — knocked-off-Olympus → climb back; "rise via repeated *learning*" vs Hades' "escape via *death*."

### Smallest playable slice — first build + architecture-spike target
One tier (**JV → Varsity**): 1 development tournament (Mastery lane), 1 prestige tournament (Respect lane), the **tryout gate as diagnostic**, ~6–8 edge items, 1 Overdrive boss. It exists to prove the only question that matters after a core restructure: **does the failure-loop feel like learning, not punishment?** (North Star + DI-09.)

### Research-gated — route to a games-design sprint, do NOT fake-precision
Numbers to set *before* spec v4: Respect challenge-weighting curve (12–14 motivation), Mastery `N` + what "reliably" means, Overdrive cadence/frequency, pool-for-variety minimum, microgame readability. Sprint: **`roguelite-meta-progression-for-tweens`** (the never-run games-design sprint, HOBBES_BACKLOG 2026-05-24). Then author **spec v4** (RS / MP / EQ / PG / OD), splitting *behavioral intent* (locked now) from *literal numbers* (filled from research).

---

## Layer 1 — Progression: the Respect & Mastery dual-loop  *(LOCKING DIRECTION)*

Two keys, one door. Two meters, both always on screen.

- **Mastery** = the named skills you can *demonstrate*. A visible per-tier/per-sport **syllabus** — "here's what you're working toward." Built in **development tournaments** (the "easy" lane: low risk, high learning).
- **Respect** = your standing/reputation meter (the rename of "experience" — earned, social, on-theme). Grown in the **harder lane** by *applying* mastered skills under pressure, taking on new ones, and **converting losses into growth**. Respect should be **challenge-weighted**: a close loss in a hard tournament is worth more than an easy win.
- **Tournaments (pick 2–3 each cycle)** = player agency. The recurring strategic decision: *do I need Respect or Mastery more right now?* Both meters visible so the choice is deliberate.
- **League progression = the tryout.** **Respect** gets you the **invite** (reputation opens the door); then you must **demonstrate** the required competencies to **pass** (you still have to perform). JV → Varsity → College → Minor Leagues → Professional → **Olympic (final)**.

### Why it's robust — the loops check each other
Neither loop can be grinded to skip the other:
- **High Respect, low Mastery** → you get *invited* but **fail the tryout** (noticed before ready).
- **High Mastery, low Respect** → you're *ready* but **never invited** (nobody's looking yet).

The system quietly pulls every player toward developing both — exactly how a real athletic career works. You can't reputation your way onto Varsity without the skills, and you can't skill your way there where no coach sees you.

### The failed tryout is a DIAGNOSTIC, not a punishment  *(the thesis, made literal)*
A failed tryout says *"invited, not yet ready — here's the one competency you're missing"* → and routes you straight to the development tournament that teaches it. The loss **is** the lesson, actionable. This is the anti-frustration resolution *at the gate itself*, and nothing tightens — you advance by learning, and you're never stuck without being told what to learn.

### To pin down (next session)
1. **What grows Respect, and by how much** — challenge-weighted curve (close loss in prestige tournament > easy win), so the meter itself encodes "you learn most at your edge."
2. **How Mastery is demonstrated** — a **consistency threshold** per competency (do it N times reliably), NOT a single success.

---

## Layer 2 — Edge: equipment + special skills

From the synthesis (survives): **edge is rule-CHANGING verbs, not stat bumps.** Reject `+10%` filler and anything that shrinks hitboxes / inflates AI speed (would violate DI-07; encoded as `EQ-01`/`PG-06` in the synthesis contracts). Examples: *Magnet Gloves* (loose balls drift to you), *Ghost Paddle* (one mistimed contact passes through to a safe bounce), *Rewind Whistle* (retry a failed round). Tag-based synergies (`[Retry] [Control] [Ricochet] [Chaos]`) so a small pool yields real build variety.

**The new decision (from the conversation):** the *premium* edge — **special gear AND special skills** — is **won in Overdrive insertions** (see below), not just drafted. This gives edge a thematic *source*: you earn your real-world advantage by surviving the gods' chaos. (Open: do baseline draftable items still exist at the run layer as a floor, with Overdrive-won gear as the premium tier? — think through.)

### To think through (next session)
- Baseline draft edge (run-layer floor) vs Overdrive-won premium edge — one system or two tiers?
- What "special skills" are vs "gear" — active abilities? permanent technique unlocks that feed the Mastery syllabus?
- Minimum pool for variety (synthesis suggested ~26 items: 12 universal / 6 sport / 4 hybrid / 4 bailout) — revisit under this model.

---

## The "Overdrive" mechanic — the title, made literal  *(NEW — strong)*

Occasionally during the mastery journey, the **gods try to slow you down**: an **Overdrive insertion** fires. Sports **merge and get chaotic** (this is what the existing **hybrid / mash-up architecture** was built for — `Mashup_PickleSoccer` is the seed). These are high-intensity, deliberately chaotic events.

- **This is the premium opportunity to WIN special gear + special skills** — your new edge for "the real world" (the normal sport rounds).
- **This is where winning DOES matter** — a clean contrast to the learning-gated normal loop. The normal journey is about *learning*; Overdrive is about *seizing* a god-thrown opportunity.
- Ties the game's name to a specific, ownable mechanic. Fresh hook — no other sports game has "the gods sabotage you by fusing pickleball and soccer mid-career, and beating the chaos earns you divine gear."

### To think through
- Trigger cadence (how often, telegraphed how) — must not violate DI-08 (no ambush instant-fail).
- Is Overdrive a *boss-equivalent* (per-tier), a *random interrupt*, or both?
- Difficulty of Overdrive vs DI-07 — chaos via *fusion/variety*, never via tightness.

---

## Layer 3 — The Overdrive layer  *(LOCKED 2026-06-07)*

**Decided (2026-06-07):** the third system layer is the **Overdrive layer** — the divine-chaos / opportunity system. The three system layers are **L1 Progression · L2 Edge · L3 Overdrive.** The **core sports-gameplay** is the *foundation* the three layers sit on (not itself a progression layer); the **narrative / story** is a *frame*, not a system. The Overdrive layer earns the slot — it's the win-counterpoint to L1's learning loop and the source of premium edge (see the Overdrive section above).


---

## Story frame — EXPLORATORY (evolve later; do NOT get stuck here)

Existing lore (spec v3.1): *Athleticus, God of Peak Performance, shatters the protagonist's (Jack's) Athletic Soul into 8-bit fragments after they nearly win the Mega-Decathlon; you reclaim it through sports.*

**Candidate evolution:** you were near the **peak (Mount Olympus)** → got **knocked off** → climb the **career ladder (JV → Olympic)** to return → **Olympic (final tier) = returning to Olympus.** The career ladder *is* the comeback. Overdrive insertions = the gods still interfering on the way up. This unifies cleanly with the existing "shattered soul" lore.

**Hades-differentiation (Charlie's flag — be careful to keep this fresh):**
| Hades | Olympian Overdrive |
|---|---|
| Escape via repeated **death** | Rise via repeated **learning** |
| Combat, underworld, vengeance/family | **Sports, career ladder, mastery/comeback** |
| You fight your way **out** | You **earn your way back up** |

The one-line distinction: **"escape via repeated death" vs "rise via repeated learning."** Keep the **sports + career + learning** frame central — that's what makes it fresh, not the Olympus setting alone. Story can evolve; it's not blocking.

---

## What survives from the synthesis (composes underneath this)

- **Rule-changing edge** (not stat bumps) — Layer 2.
- **Hybrid sports as bosses / chaos** — now powering the Overdrive mechanic.
- **Run-as-short-tournament** structure (~9–11 rounds, 6–9 min, hard cap 10; Match → Draft → Match → Boss) — the tournament vehicle.
- **The four new spec contracts** — Run Structure (RS), Meta-Progression (MP), Equipment/Skill (EQ), Procedural Generation (PG) — *adjusted*: the MP gate is **Respect & Mastery**, not win-clears. Likely add a 5th: **Overdrive Contract (OD)**.
- **Smallest playable slice** discipline — build one tier first to prove the loop *feels like learning, not punishment*.

---

## Open think-items — status after the 2026-06-07 lock
1. **Layer 1 details** — structure LOCKED (challenge-weighted Respect; consistency-threshold Mastery). Numbers `[RESEARCH-GATED]` → `AI-OS/05_LOGS/pushes/2026-06-07-roguelite-meta-progression-for-tweens.md`.
2. **Layer 2 edge** — LOCKED (one schema / two tiers; gear = run-scoped, skills = permanent Mastery unlocks). Pool-for-variety minimum `[RESEARCH-GATED]`.
3. **Layer 3** — LOCKED = the Overdrive layer.
4. **Overdrive mechanic** — LOCKED (per-tier boss, telegraphed, fusion-not-tightness). Cadence/frequency `[RESEARCH-GATED]`.
5. **Story** — direction locked, exploratory / non-blocking.
6. **Spec v4** — ✅ AUTHORED 2026-06-07 in [`spec.md`](spec.md) (v4): RS / MP / EQ / PG / OD + GF-Audio contracts, behavioral intent locked, literal numbers tagged `[PLAYTEST-GATED]`/`[RESEARCH-GATED]`, generation gated behind the architecture spike (§7). Architecture locks added to spec Locked Decisions (#11-18); House Rules 20-21 added (rule 21 dual-written to `build-game.js`). Remaining: run the spike, then fill the gated numbers via the smallest-slice playtest.

---

## Recovered build-critical detail (2026-06-07, via `extract.js`)

The Azure synthesis over-compressed the research's build payload. `extract.js` recovered it (verbatim-verified against the raw). This block is the **build's source of truth** for spec v4 — both the synthesis's deliberate design calls AND the raw originals it altered/dropped, so the per-parameter call is made with full information.

**✅ RESOLVED 2026-06-07 — meta-progression model = percentage intent, token display.** The synthesis had silently swapped the raw's **percentage** model for a **token** model whose numbers ran 2–3× generous, stage-dependently. **Decision (Charlie):** compute every run's permanent-currency reward on the **percentage curve** (preserves the intended pacing — the deciding variable is rounds survived), but **surface it to the player as whole shard tokens** (legibility for a 12yo: "I have 34 shards"). Designer tunes in %; player sees concrete numbers; a thin display-conversion layer bridges them.
- **Curve (the % intent to encode):** R1 wipe = **15%** of next unlock; final-round loss = **85%**; full win = **120%** (1 unlock + 20% rollover). Deciding variable: rounds survived.
- **Reject** the raw token numbers (stipend 10 + 8/round; costs 20/40/60/80 → R1 wipe ≈50%, final loss ≈112%, win ≈137%) as the *source of truth*; they may still seed the initial display-token costs, but the **reward math derives from the % curve**, not from flat per-round stipends.

**Altered tuning constants — reconcile per-parameter (raw → synthesis revision):**
| Parameter | Raw original | Synthesis revision | Note |
|---|---|---|---|
| Standard loss reward | 50% of win | 60% | synthesis more generous (North Star: losses are fuel) — defensible |
| Close loss reward | 65–75% | 80% | synthesis more generous — defensible |
| Close-loss trigger | final **10%** of timer OR lose by 1 | final **20%** OR lose by 1 OR 80% objective | dial choice |
| Challenge multiplier | linear **0.8×–1.3×** | 3-step **0.9/1.0/1.2** | synthesis rejected 1.3× as failure-farmable — **keep synthesis** |
| Item pool (tier 1) | **20–24**, **3** synergy tags | **10**, **2** tags | synthesis right that 24 over-scopes solo; but see C(n,k) below — likely land **~12–14 / 3 tags** |
| Instruction display | **1.0s**, 1 word | **0.8s**, ≤12 chars | synthesis trimmed for snappiness — may hurt the 12yo's readability; revisit in playtest |
| Result freeze | **0.5s** | **0.35s** | same trim caveat |

**Dropped build payload — preserve verbatim (the synthesis lost these entirely):**
- **Combinatorics framework (EQ sizing tool):** build variety = `C(n,k)`. `C(24,3) = 2,024` unique builds; `C(24,4) = 10,626` (the real reason to cap **max active = 3**). Over-scoping cliff = hard-coded logic exceptions for item *pairings*, not raw count.
- **Core data model (the most build-actionable line):** `Respect` = a simple **cumulative integer**; `Mastery` syllabus = strictly a **1-D boolean array** (True/False per skill); **no decay**, no multi-tier. Mastery gate evaluates a **rolling array of size 4** of binary outcomes (3-of-4). Tryout = a **boolean success/fail array** of 3 pre-determined microgames; fail → highlight skill icon red; **zero dynamic text**.
- **Game-feel audio (GF contract):** win = **high-frequency major-chord** chime; loss = **low-frequency descending minor-chord**; full-screen high-contrast stamp; player char in **saturated primary** color, backgrounds **desaturated/darkened**; "**failure must be energetic/comical**" (core to the anti-frustration mandate).

---

### Second-pass recoveries (2026-06-07 re-review of the career-ladder + architecture logs, via `extract.js`)

The targeted re-review ran `extract.js` over four past game logs (70 deltas, **100% verbatim — zero hallucinations**; 2 conservatively-flagged items both confirmed faithful on human read). Most career-ladder detail was already reconciled in the block above; these are the **new** spec-relevant recoveries, with decisions made:

**MP contract — restored / decided:**
- **Minimum payout floor (RESTORED — synthesis dropped it):** a failed run must still award **>= the cost of the cheapest permanent-upgrade node** (raw worked example: cheapest locker-room node = 50 -> a Match-1 failure still awards >=50). This is the concrete teeth behind the "losses are fuel" North Star — without it an early wipe nets ~zero and the loop *feels* like punishment. Encode in MP.
- **Momentum assist = continuous `floor(F/2)` + cap (DECIDED):** effective run-lives = `base + min(floor(F/2), 3)`, where `F` = consecutive failures in the current tier (+1 life per 2 failures, accumulating, capped at +3). Restores the raw's continuously-scaling subtractive-difficulty intent (raw MP-03 / lines 221-235); the synthesis had softened it to a one-time nudge. Cap prevents trivializing a tier for a persistently-stuck player.
- **Run architecture = split (DECIDED):** author **RS** with **3 matches x 4/5/6 escalating rounds ~= 15 rounds, 7-10 min**, structure `Match -> Draft -> Match -> Boss`. Behavioral intent locked; the literal round-count is **playtest-gated** (the 12yo sets the final number). This deliberately lands between the raw's ~18 rounds / 8-12 min (risks overshooting tween session tolerance) and the synthesis's ~9-11 / 6-9 min.

**EQ contract — restored:**
- **Orthogonality contract (RESTORED — synthesis dropped it):** no two items in the pool may share the same functional logic. This is the design teeth behind the `C(n,k)` variety math above — orthogonal items make `C(n,3)` *meaningful* combinations rather than redundant ones. Encode in EQ alongside the pool-size cap.

**Architecture context (route to a build-architecture note, not a design contract):**
- **View-transition contract (pause / sleep / wake):** top-down <-> side-scroller / encounter transitions should **pause or sleep** the `TopDownView` scene and restore via **wake** — *not* tear down and rebuild — so the procedural map is **not reallocated/regenerated** on return. (`pause` retains render state; `sleep` halts update + WebGL render while keeping allocations; `wake` restores instantly.) Matters because Olympian's hybrid/mash-up architecture switches views mid-run. The synthesis's numeric "alterations" (sidescroller gravity 1200->1400; camera lerp/deadzone) are **tuning presets** set at build/playtest — note, don't lock.

**Tooling recoveries (gba-review + phaser-playtest logs)** route to the playtest-harness build, **not** this spec — banked in HOBBES_BACKLOG. Key items: Chromium GPU launch flags, Matter.js fixed-step (`isFixed:true`, clamp 16-33ms), manual `16.666ms` deterministic stepping, RNG seed contract, Phaser scene-state `0-9` mapping, audio-interception patch points, CPU-throttle perf gate (4x / <55 FPS), and the self-healing iteration cap (**raw: 3, not the synthesis's 2**).

**Evidence:** full raw research + the 31 recovered citations live in `AI-OS/05_LOGS/pushes/2026-06-07-roguelite-meta-progression-for-tweens.md` (the evidence vault). Frameworks: Bayesian Knowledge Tracing (the 3-of-4 rationale), prospect-theory 2:1 loss aversion (loss rewards), hyperbolic discounting (front-loaded curve), WarioWare 4–8-beat (microgame readability).
