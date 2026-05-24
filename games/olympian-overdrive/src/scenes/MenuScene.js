import Phaser from 'phaser';
import { getGameManager } from '../core/GameManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#10182a');

    const gameManager = getGameManager();
    this.game.registry.set('gameManager', gameManager);

    const { width, height } = this.scale;

    this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x10182a);
    this.add.rectangle(width * 0.5, 110, 520, 90, 0x1d2d50, 0.95).setStrokeStyle(4, 0x4cc9f0);
    this.add.rectangle(width * 0.5, 275, 540, 180, 0x16213e, 0.95).setStrokeStyle(3, 0xf4d35e);

    const title = this.add.text(width * 0.5, 90, 'OLYMPIAN OVERDRIVE', {
      fontFamily: 'monospace',
      fontSize: '28px',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    title.setColor('#ffffff');

    const subtitle = this.add.text(width * 0.5, 125, 'Top-Down Sports Micro-Game Slice', {
      fontFamily: 'monospace',
      fontSize: '14px',
      align: 'center'
    }).setOrigin(0.5);
    subtitle.setColor('#4cc9f0');

    const instructions = this.add.text(
      width * 0.5,
      240,
      [
        'SPACE: START RUN',
        'M: DEBUG MASH-UP',
        '',
        'MOVE: ARROW KEYS',
        'Z: JUMP / RESERVED',
        'X: STRIKE / SWING'
      ].join('\n'),
      {
        fontFamily: 'monospace',
        fontSize: '18px',
        align: 'center',
        lineSpacing: 8
      }
    ).setOrigin(0.5);
    instructions.setColor('#ffffff');

    const footer = this.add.text(
      width * 0.5,
      410,
      '15s rounds • random sport rotation • 3 lives',
      {
        fontFamily: 'monospace',
        fontSize: '14px',
        align: 'center'
      }
    ).setOrigin(0.5);
    footer.setColor('#f4d35e');

    this.promptText = this.add.text(width * 0.5, 405, 'PRESS SPACE TO BEGIN', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    this.promptText.setColor('#7cff6b');

    // Dev mode panel — jump directly to a sport or scene
    this.add.text(width * 0.5, 442, '— DEV MODE —', {
      fontFamily: 'monospace', fontSize: '11px', align: 'center'
    }).setOrigin(0.5).setColor('#888888');

    this.add.text(width * 0.5, 460,
      '1: Pickleball   2: Soccer   3: Mash-Up   N: Skip (in-game)',
      { fontFamily: 'monospace', fontSize: '11px', align: 'center' }
    ).setOrigin(0.5).setColor('#aaaaaa');

    this.tweens.add({
      targets: this.promptText,
      alpha: 0.25,
      duration: 550,
      yoyo: true,
      repeat: -1
    });

    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.devKeys = {
      one: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      two: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      three: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
    };
    this.starting = false;

    // Defensive: if we ever wake up from a crashed scene, unlock inputs.
    this.events.on('wake', () => { this.starting = false; });
    this.events.on('resume', () => { this.starting = false; });
  }

  update() {
    // Dev keys ALWAYS available — never gated by starting flag.
    // If a previous transition crashed, these are the unlock.
    if (Phaser.Input.Keyboard.JustDown(this.devKeys.one)) {
      this.starting = false;
      this.jumpToSport('pickleball');
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.devKeys.two)) {
      this.starting = false;
      this.jumpToSport('soccer');
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.devKeys.three) || Phaser.Input.Keyboard.JustDown(this.mKey)) {
      this.starting = false;
      this.startMashupRun();
      return;
    }

    if (this.starting) return;

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.startStandardRun();
    }
  }

  jumpToSport(sportKey) {
    this.starting = true;
    const gameManager = getGameManager();
    gameManager.startNewRun(sportKey);
    this.scene.start('ActiveScene', { sportKey });
  }

  startStandardRun() {
    this.starting = true;
    const gameManager = getGameManager();
    const sportKey = gameManager.startNewRun();
    this.scene.start('ActiveScene', { sportKey });
  }

  startMashupRun() {
    this.starting = true;
    const gameManager = getGameManager();
    gameManager.startNewRun('mashup-pickle-soccer');
    gameManager.setCurrentSportKey('mashup-pickle-soccer');
    this.scene.start('ActiveScene', { sportKey: 'mashup-pickle-soccer' });
  }
}