import Phaser from 'phaser';
import Controller_Pickleball from '../Pickleball/Controller_Pickleball.js';
import LevelManager_Soccer from '../Soccer/LevelManager_Soccer.js';

export default class Mashup_PickleSoccer {
  constructor() {
    this.scene = null;
    this.controller = null;
    this.levelManager = null;
    this.gameActive = true;
  }

  init(scene, inputManager) {
    this.scene = scene;

    this.controller = new Controller_Pickleball(scene, inputManager);
    this.levelManager = new LevelManager_Soccer();

    if (this.levelManager?.init) {
      this.levelManager.init(scene, this.controller);
    }

    this.gameActive = true;

    if (this.scene?.events) {
      this.scene.events.once('shutdown', () => {
        this.gameActive = false;
        if (this.levelManager?.destroy) this.levelManager.destroy();
      });
    }
  }

  update(time, delta) {
    if (!this.gameActive || !this.scene?.gameActive) return;

    if (this.controller?.update) this.controller.update(time, delta);
    if (this.levelManager?.update) this.levelManager.update(time, delta);
  }

  destroy() {
    this.gameActive = false;
    if (this.levelManager?.destroy) this.levelManager.destroy();
    this.levelManager = null;
    this.controller = null;
    this.scene = null;
  }
}