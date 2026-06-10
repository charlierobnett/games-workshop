// RoundScene — ONE generic scene that hosts ANY registered sport, in EITHER view
// mode, by applying the sport's declared viewMode through VIEW_PRESETS. This is
// the heart of what the spike proves: top-down and side-scroller compose through
// one scene + one helper surface, with no scene-per-sport. (Architecture §3/§5.)
import Phaser from 'phaser';
import { VIEW_PRESETS, makePhaserHelpers, WORLD_H } from '../core/viewPresets.js';
import { validateRoundRuntime } from '../core/validateSport.js';

export default class RoundScene extends Phaser.Scene {
  constructor() { super('RoundScene'); }

  create(data) {
    const services = this.registry.get('services');
    const { contentRegistry, runController } = services;

    this.gameActive = false;
    this._resolved = false;
    this._disposers = [];

    const round = runController.getRoundDescriptor(data.roundIndex);
    const sport = contentRegistry.getSport(round.sportId);
    const preset = VIEW_PRESETS[sport.viewMode];

    const seed = (runController.seed + data.roundIndex * 7919) >>> 0;
    this.helpers = makePhaserHelpers(this, preset, { seed, viewMode: sport.viewMode });

    const config = { ...sport.baseRoundConfig, difficultyStep: round.difficultyStep ?? 1 };
    this.runtime = sport.createRound({
      helpers: this.helpers,
      config,
      run: runController,
      rng: this.helpers.rng
    });

    // runtime smoke at the moment of use — a malformed leaf fails loudly here.
    const { ok, errors } = validateRoundRuntime(this.runtime);
    if (!ok) throw new Error(`RoundScene: '${sport.id}' bad runtime: ${errors.join('; ')}`);

    // camera: side-scroller follows the player across a wide world; top-down is fixed.
    if (sport.viewMode === 'sidescroller' && typeof this.runtime.getFollowTarget === 'function') {
      const target = this.runtime.getFollowTarget();
      const worldW = (typeof this.runtime.finishX === 'function' ? this.runtime.finishX() : 1280) + 320;
      this.cameras.main.setBounds(0, 0, worldW, WORLD_H);
      this.physics.world.setBounds(0, 0, worldW, WORLD_H);
      const [lx, ly] = preset.camera.followLerp;
      this.cameras.main.startFollow(target._go, true, lx, ly);
      if (preset.camera.deadzone) this.cameras.main.setDeadzone(...preset.camera.deadzone);
    } else {
      this.cameras.main.setBounds(0, 0, 640, WORLD_H);
    }

    // HUD overlay: run lives + round position (read from RunController each frame)
    this.metaText = this.add.text(8, WORLD_H - 18,
      this._metaLine(runController, data.roundIndex), {
      fontFamily: 'monospace', fontSize: '12px'
    }).setScrollFactor(0).setDepth(2000).setColor('#ffffff');

    this._roundIndex = data.roundIndex;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this._cleanup());
    this.gameActive = true;
  }

  _metaLine(rc, idx) {
    return `LIVES ${rc.runLives}   ROUND ${idx + 1}/${rc.plan.rounds.length}   RESPECT+${rc.respectGained}`;
  }

  update(time, delta) {
    if (!this.gameActive || this._resolved || !this.runtime) return;
    this.runtime.update(time, delta);
    const rc = this.registry.get('services').runController;
    this.metaText.setText(this._metaLine(rc, this._roundIndex));

    if (this.runtime.isComplete()) this._finish(true);
    else if (this.runtime.hasFailed()) this._finish(false);
  }

  _finish(won) {
    this._resolved = true;
    this.gameActive = false;
    const services = this.registry.get('services');
    const rc = services.runController;
    const closeLoss = won ? false :
      (typeof this.runtime.wasCloseLoss === 'function' ? this.runtime.wasCloseLoss() : false);
    const intent = rc.resolveRound({ won, closeLoss });

    this.time.delayedCall(won ? 350 : 600, () => {
      if (intent === 'next') {
        services.sceneFlow.go(this, 'RoundScene', { roundIndex: rc.roundIndex });
      } else {
        services.sceneFlow.go(this, 'RunResultScene', {});
      }
    });
  }

  _cleanup() {
    if (this.helpers) this.helpers._teardown();
    this.runtime = null;
    this._disposers.forEach((fn) => { try { fn(); } catch (_) {} });
    this._disposers = [];
  }
}
