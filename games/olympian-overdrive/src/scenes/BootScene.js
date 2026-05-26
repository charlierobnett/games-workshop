import Phaser from 'phaser';
import ASSET_MANIFEST from '../assets/asset-keys.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.scale;
    const bg = this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x103a2b);
    const barBox = this.add.rectangle(width * 0.5, height * 0.5, 324, 28, 0x000000, 0.35);
    barBox.setStrokeStyle(3, 0x2ef2ff, 0.9);

    const progressBar = this.add.rectangle(width * 0.5 - 156, height * 0.5, 0, 18, 0x2ef2ff, 1);
    progressBar.setOrigin(0, 0.5);

    const title = this.add.text(width * 0.5, height * 0.5 - 48, 'OLYMPIAN OVERDRIVE', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);
    title.setColor('#ffffff');

    const loadingText = this.add.text(width * 0.5, height * 0.5 + 36, 'LOADING 0%', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#2ef2ff',
    }).setOrigin(0.5);
    loadingText.setColor('#2ef2ff');

    this.load.on('progress', (value) => {
      progressBar.width = 312 * value;
      loadingText.setText(`LOADING ${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      bg.destroy();
      barBox.destroy();
      progressBar.destroy();
      title.destroy();
      loadingText.destroy();
    });

    for (const asset of ASSET_MANIFEST) {
      if (asset.type === 'image') {
        this.load.image(asset.key, asset.path);
      }
    }
  }

  create() {
    this.textures.each((texture) => {
      if (texture && texture.key && texture.key !== '__DEFAULT' && texture.key !== '__MISSING') {
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    });

    this.cameras.main.setBackgroundColor('#103a2b');
    this.scene.start('MenuScene');
  }
}