import Phaser from 'phaser';
import InputManager from '../core/InputManager.js';
import {
  SPORT_PICKLEBALL,
  SPORT_SOCCER,
  SPORT_MASHUP_PICKLE_SOCCER
} from '../core/sport-keys.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.inputManager = null;
    this.starting = false;
  }

  create() {
    this.inputManager = new InputManager(this);
    this.starting = false;

    this.events.on('wake', () => {
      this.starting = false;
    });

    this.events.on('resume', () => {
      this.starting = false;
    });

    this.cameras.main.setBackgroundColor('#103a2b');

    this.add.rectangle(320, 240, 640, 480, 0x103a2b);

    const panel = this.add.rectangle(320, 240, 560, 360, 0x163f31, 0.9);
    panel.setStrokeStyle(4, 0x2ef2ff, 0.7);

    const title = this.add.text(320, 90, 'OLYMPIAN OVERDRIVE', {
      fontFamily: 'monospace',
      fontSize: '28px',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    title.setColor('#ffffff');

    const subtitle = this.add.text(320, 126, 'Mega-Decathlon Micro-Game Gauntlet', {
      fontFamily: 'monospace',
      fontSize: '12px',
      align: 'center'
    }).setOrigin(0.5);
    subtitle.setColor('#2ef2ff');

    const instructions = [
      'MOVE: ARROW KEYS',
      'STRIKE: X',
      'START: SPACE',
      '',
      'PICKLEBALL: 3 VOLLEYS TO WIN',
      'SOCCER: SCORE 1 GOAL TO WIN',
      '',
      'DEBUG: 1 PICKLEBALL   2 SOCCER   3 OR M MASH-UP',
      'DEBUG: 0 MENU   N FAIL-SKIP   W WIN-SKIP'
    ].join('\n');

    const body = this.add.text(320, 220, instructions, {
      fontFamily: 'monospace',
      fontSize: '16px',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);
    body.setColor('#ffffff');

    const prompt = this.add.text(320, 390, 'PRESS SPACE TO START', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    prompt.setColor('#7bff00');

    this.tweens.add({
      targets: prompt,
      alpha: 0.35,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    const footer = this.add.text(320, 445, 'TOP-DOWN SPORTS ONLY · 15 SECOND ROUNDS', {
      fontFamily: 'monospace',
      fontSize: '11px',
      align: 'center'
    }).setOrigin(0.5);
    footer.setColor('#b8c7c2');
  }

  startSport(sportKey) {
    if (this.starting) {
      return;
    }

    this.starting = true;
    this.registry.set('currentSportKey', sportKey);

    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.scene.start('ActiveScene', { sportKey });
    });
  }

  update() {
    if (!this.inputManager) {
      return;
    }

    if (this.inputManager.isPickleballDebugPressed()) {
      this.startSport(SPORT_PICKLEBALL);
      return;
    }

    if (this.inputManager.isSoccerDebugPressed()) {
      this.startSport(SPORT_SOCCER);
      return;
    }

    if (this.inputManager.isMashupDebugPressed()) {
      this.startSport(SPORT_MASHUP_PICKLE_SOCCER);
      return;
    }

    if (this.starting) {
      return;
    }

    if (this.inputManager.isStartJustPressed()) {
      this.startSport(SPORT_PICKLEBALL);
    }
  }
}