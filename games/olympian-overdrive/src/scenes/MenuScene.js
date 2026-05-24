import Phaser from 'phaser';
import GameManager from '../core/GameManager.js';
import InputManager from '../core/InputManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  init() {
    this.gameActive = true;
    this._rollTimer = null;
  }

  create() {
    this.gameActive = true;

    if (!this.registry.has('gameManager')) {
      this.registry.set('gameManager', new GameManager());
    }
    this.gameManager = this.registry.get('gameManager');

    this.inputManager = new InputManager(this);

    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#0b1020');

    const title = this.add
      .text(width / 2, height * 0.22, 'OLYMPIAN OVERDRIVE', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#7df9ff',
        align: 'center',
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(width / 2, height * 0.32, 'Mega-Decathlon: reclaim your Athletic Soul', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#d7d7ff',
        align: 'center',
      })
      .setOrigin(0.5);

    const controls = this.add
      .text(
        width / 2,
        height * 0.48,
        '←/→ Move\nZ Jump/Dodge\nX Strike/Throw\n\nPress ENTER to start\nPress M for Bonus Mash-up',
        {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#ffffff',
          align: 'center',
        }
      )
      .setOrigin(0.5);

    const hint = this.add
      .text(width / 2, height * 0.78, 'Difficulty scales each round. Good luck, Olympian!', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#a7ff83',
        align: 'center',
      })
      .setOrigin(0.5);

    this._startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    this._flash = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0).setDepth(10);

    this._start = () => {
      if (!this.gameActive) return;
      this.gameManager.reset();

      this.scene.start('ActiveScene', {
        sportKey: this.gameManager.getNextSportKey(),
        mashup: false,
      });
    };

    this._startMashup = () => {
      if (!this.gameActive) return;
      this.gameManager.reset();

      this.scene.start('ActiveScene', {
        sportKey: 'mashup_pickle_soccer',
        mashup: true,
      });
    };

    this._startKeyDownHandler = () => this._start();
    this._mKeyDownHandler = () => this._startMashup();

    this.input.keyboard.on('keydown-ENTER', this._startKeyDownHandler);
    this.input.keyboard.on('keydown-M', this._mKeyDownHandler);

    this._ui = { title, subtitle, controls, hint };
  }

  shutdown() {
    this.gameActive = false;

    if (this._rollTimer) {
      this._rollTimer.remove(false);
      this._rollTimer = null;
    }

    if (this.inputManager) {
      this.inputManager = null;
    }

    if (this.input && this._startKeyDownHandler) {
      this.input.keyboard.off('keydown-ENTER', this._startKeyDownHandler);
    }
    if (this.input && this._mKeyDownHandler) {
      this.input.keyboard.off('keydown-M', this._mKeyDownHandler);
    }
  }

  update() {
    if (!this.gameActive) return;

    if (this.inputManager && this.inputManager.isDebugMashupPressed()) {
      this._startMashup();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this._startKey)) {
      this._start();
      return;
    }

    if (this._ui && this._ui.title) {
      this._ui.title.setColor(this._ui.title.fillColor === '#7df9ff' ? '#b7ff6a' : '#7df9ff');
    }
  }
}