// RunResultScene — the run ends here and COMMITS meta exactly once (the one place
// a run touches PersistentStore). Shows what was earned, then returns to the Hub.
import Phaser from 'phaser';

export default class RunResultScene extends Phaser.Scene {
  constructor() { super('RunResultScene'); }

  create() {
    const services = this.registry.get('services');
    const rc = services.runController;

    // commit-once guard
    const summary = rc.commitMeta();
    services.runController = null;   // destroy run state (RS-05)

    const win = summary.result === 'win';
    this.add.rectangle(320, 240, 640, 480, win ? 0x103a2b : 0x2a0d14);
    this.add.text(320, 90, win ? 'RUN COMPLETE' : 'RUN OVER', {
      fontFamily: 'monospace', fontSize: '22px'
    }).setOrigin(0.5).setColor(win ? '#7bff00' : '#ff2d55');

    const lines = [
      `rounds cleared: ${summary.roundsCleared}`,
      `respect earned: +${summary.respectAward}`,
      summary.assistLives > 0 ? `momentum assist: +${summary.assistLives} lives` : null,
      summary.newlyMastered.length
        ? `newly mastered: ${summary.newlyMastered.join(', ')}`
        : 'no new mastery this run'
    ].filter(Boolean);

    lines.forEach((l, i) => {
      this.add.text(320, 170 + i * 30, l, {
        fontFamily: 'monospace', fontSize: '14px'
      }).setOrigin(0.5).setColor('#ffffff');
    });

    // The thesis made legible: a loss is fuel, not a dead end.
    this.add.text(320, 330,
      win ? 'you rose by performing' : 'you lost — but you still earned. that is the point.', {
      fontFamily: 'monospace', fontSize: '12px'
    }).setOrigin(0.5).setColor('#ffe066');

    this.add.text(320, 420, 'press Z to return to the hub', {
      fontFamily: 'monospace', fontSize: '13px'
    }).setOrigin(0.5).setColor('#2ef2ff');

    this.input.keyboard.once('keydown-Z', () => {
      services.sceneFlow.go(this, 'HubScene');
    });
  }
}
