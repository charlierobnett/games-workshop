// RunController — state layer 2 (per-run, in-memory; created on run start,
// destroyed on run end). Holds everything that must NOT survive a run.
// Spec RS-04 (run ends ONLY when runLives reaches 0), RS-05 (this state never
// goes to PersistentStore), MP-06 (momentum assist), MP-01 (challenge-weighted Respect).
//
// Pure JS — no Phaser — so the run loop is testable in Node.

import { MASTERY_SKILLS } from './PersistentStore.js';

// Challenge multiplier per tier difficulty step (spec MP-01: 0.9 / 1.0 / 1.2).
// A close loss at a harder step is worth more than an easy win at an easier one.
const CHALLENGE_MULT = [0.9, 1.0, 1.2];
const BASE_RESPECT_PER_ROUND = 10;

export class RunController {
  // store: PersistentStore (read for assist context; never written here)
  // plan:  { tier, rounds: [{ sportId, viewMode, difficultyStep, skillIndex }] }
  // opts:  { baseLives?, seed?, consecutiveTierFailures? }
  constructor(store, plan, opts = {}) {
    this.store = store;
    this.plan = plan;
    this.tier = plan.tier ?? 0;
    this.seed = opts.seed ?? Date.now();

    this.baseLives = opts.baseLives ?? 3;
    // MP-06 momentum assist (subtractive difficulty): +1 life per 2 consecutive
    // tier failures, accumulating, capped at +3.
    const F = opts.consecutiveTierFailures ?? 0;
    this.assistLives = Math.min(Math.floor(F / 2), 3);
    this.runLives = this.baseLives + this.assistLives;

    this.roundIndex = 0;
    this.respectGained = 0;
    this.roundsCleared = 0;
    // staged demonstrations to commit to Mastery on run end: [{skillIndex, success}]
    this.masteryOutcomes = [];
    this.ended = false;
    this.result = null;          // 'win' | 'fail' | null
  }

  getRoundDescriptor(index = this.roundIndex) {
    return this.plan.rounds[index] ?? null;
  }

  currentRound() { return this.getRoundDescriptor(this.roundIndex); }

  isLastRound() { return this.roundIndex >= this.plan.rounds.length - 1; }

  // Resolve one round. `won` = did the player meet the round's win condition.
  // `closeLoss` lets a sport flag a near-miss (worth more Respect — MP-01/MP-08).
  // Returns a transition intent: 'next' | 'win' | 'fail'.
  resolveRound({ won, closeLoss = false }) {
    if (this.ended) return this.result;
    const round = this.currentRound();
    const step = round?.difficultyStep ?? 1;
    const mult = CHALLENGE_MULT[step] ?? 1.0;

    if (won) {
      this.roundsCleared += 1;
      this.respectGained += Math.round(BASE_RESPECT_PER_ROUND * mult);
      if (round?.skillIndex != null) {
        this.masteryOutcomes.push({ skillIndex: round.skillIndex, success: true });
      }
    } else {
      // A loss costs ONE life and still earns Respect ("losses are fuel",
      // MP-08): standard loss 60% of a win, close loss 80%.
      this.runLives -= 1;
      const lossFactor = closeLoss ? 0.8 : 0.6;
      this.respectGained += Math.round(BASE_RESPECT_PER_ROUND * mult * lossFactor);
      if (round?.skillIndex != null) {
        this.masteryOutcomes.push({ skillIndex: round.skillIndex, success: false });
      }
    }

    // RS-04: the run ends ONLY when runLives reaches 0 — never on a single loss.
    if (this.runLives <= 0) return this._end('fail');
    if (this.isLastRound()) return this._end('win');
    this.roundIndex += 1;
    return 'next';
  }

  _end(result) {
    this.ended = true;
    this.result = result;
    return result;
  }

  // Commit meta to PersistentStore on run end (the one place a run touches meta).
  // Returns a summary for the result screen. Idempotent-guarded by the caller.
  commitMeta() {
    if (!this.store) return null;
    // MP-05 minimum payout floor: a failed run still awards a floor of Respect so
    // an early wipe is never ~zero ("losses are fuel"). Floor = one base round.
    const floor = BASE_RESPECT_PER_ROUND;
    const respectAward = Math.max(this.respectGained, this.result === 'fail' ? floor : 0);

    this.store.addRespect(respectAward);

    const newlyMastered = [];
    for (const o of this.masteryOutcomes) {
      const became = this.store.recordMasteryOutcome(o.skillIndex, o.success);
      if (became) newlyMastered.push(MASTERY_SKILLS[o.skillIndex]);
    }

    if (this.result === 'win' && this.tier + 1 > this.store.data.highestTierReached) {
      this.store.data.highestTierReached = this.tier + 1;
    }

    this.store.recordRun({
      result: this.result,
      rounds: this.roundsCleared,
      respectGained: respectAward,
      tier: this.tier
    });
    this.store.save();

    return {
      result: this.result,
      roundsCleared: this.roundsCleared,
      respectAward,
      assistLives: this.assistLives,
      newlyMastered
    };
  }
}
