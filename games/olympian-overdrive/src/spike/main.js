// Spike entry — one Phaser game hosting the architecture-spike scene graph.
// Boot -> Hub -> RoundScene (x rounds) -> RunResultScene -> Hub.
import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import HubScene from './scenes/HubScene.js';
import RoundScene from './scenes/RoundScene.js';
import RunResultScene from './scenes/RunResultScene.js';

const config = {
  type: Phaser.AUTO,
  width: 640,
  height: 480,
  parent: 'game',
  backgroundColor: '#103a2b',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false }
  },
  scene: [BootScene, HubScene, RoundScene, RunResultScene]
};

const game = new Phaser.Game(config);

// playtest hook (parity with the main game): expose only under ?playtest=1
if (new URLSearchParams(window.location.search).get('playtest') === '1') {
  window.game = game;
}
