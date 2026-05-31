# Olympian Overdrive — Roguelite Evolution: Design Direction

**Status:** design exploration → toward spec v4 / M2. NOT yet a build spec.
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

## Layer 3 — TBD  *(the "third layer" — name it next)*

Charlie flagged a third layer to think through beyond Progression (L1) and Equipment/Edge (L2). Candidates, unresolved:
- The **Overdrive system** as its own distinct layer (the chaos/divine-opportunity layer), OR
- The **narrative / story** layer, OR
- The **core sports-gameplay** layer (the microgames themselves) as the foundation the other two sit on.

Leave open. Likely the Overdrive layer earns "third layer" status given how central it's becoming.

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

## Open think-items (carry to next sessions)
1. **Lock Layer 1 details** — Respect growth weighting; Mastery demonstration thresholds.
2. **Design Layer 2** — baseline vs Overdrive-won edge; gear vs special skills.
3. **Name + define Layer 3.**
4. **Design the Overdrive mechanic** — cadence, structure, difficulty (DI-compliant).
5. **Evolve the story** — keep it fresh vs Hades; don't get stuck.
6. **Translate to spec v4** — author RS / MP / EQ / PG / OD contracts in the GF-/DI-/VI- verifiable-rule style; scope the smallest playable slice.