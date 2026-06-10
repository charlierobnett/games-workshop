// HubScene — shows the two persistent meters (Respect + Mastery syllabus) and
// starts a run. Building the run PLAN here is the agnostic core's job: it picks
// registered sports (one top-down, one side-scroller) to prove both views compose.
import Phaser from 'phaser';
import { RunController } from '../core/RunController.js';
import { MASTERY_SKILLS } from '../core/PersistentStore.js';
import { buildSpikeRunPlan } from '../content/runPlan.js';

export default class HubScene extends Phaser.Scene {
  constructor() { super('HubScene'); }

  create() {
    const { persistentStore } = this.registry.get('services');
    const d = persistentStore.data;

    this.add.rectangle(320, 240, 640, 480, 0x103a2b);
    this.add.text(320, 60, 'OLYMPIAN OVERDRIVE — ARCH SPIKE', {
      fontFamily: 'monospace', fontSize: '18px'
    }).setOrigin(0.5).setColor('#2ef2ff');

    this.add.text(320, 120, `RESPECT: ${persistentStore.getRespect()}`, {
      fontFamily: 'monospace', fontSize: '16px'
    }).setOrigin(0.5).setColor('#7bff00');

    // Mastery syllabus: a checklist rendered straight off the 1-D boolean array.
    this.add.text(320, 168, 'MASTERY SYLLABUS', {
      fontFamily: 'monospace', fontSize: '13px'
    }).setOrigin(0.5).setColor('#ffffff');
    MASTERY_SKILLS.forEach((skill, i) => {
      const done = persistentStore.isSkillMastered(i);
      this.add.text(320, 196 + i * 22, `${done ? '[x]' : '[ ]'} ${skill}`, {
        fontFamily: 'monospace', fontSize: '13px'
      }).setOrigin(0.5).setColor(done ? '#7bff00' : '#888888');
    });

    this.add.text(320, 330, 'press Z to start a run', {
      fontFamily: 'monospace', fontSize: '15px'
    }).setOrigin(0.5).setColor('#ffe066');
    this.add.text(320, 360,
      `runs: ${d.runHistory.length}   highest tier: ${d.highestTierReached}`, {
      fontFamily: 'monospace', fontSize: '11px'
    }).setOrigin(0.5).setColor('#888888');
    this.add.text(320, 430, 'Arrows = move/8-way   Z = strike / jump / start', {
      fontFamily: 'monospace', fontSize: '11px'
    }).setOrigin(0.5).setColor('#2ef2ff');

    this.input.keyboard.once('keydown-Z', () => this.startRun());
  }

  startRun() {
    const services = this.registry.get('services');
    const plan = buildSpikeRunPlan(services.contentRegistry, services.persistentStore);
    // momentum assist context (MP-06): count trailing consecutive same-tier failures
    const hist = services.persistentStore.data.runHistory;
    let F = 0;
    for (let i = hist.length - 1; i >= 0; i--) {
      if (hist[i].result === 'fail' && hist[i].tier === plan.tier) F++; else break;
    }
    services.runController = new RunController(services.persistentStore, plan, {
      seed: (Date.now() & 0xffff) + 1,
      consecutiveTierFailures: F
    });
    services.sceneFlow.go(this, 'RoundScene', { roundIndex: 0 });
  }
}
