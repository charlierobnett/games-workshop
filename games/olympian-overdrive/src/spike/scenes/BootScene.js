// BootScene — initialize the 3-layer services once, register content, go to Hub.
// No image assets: the spike draws with shape primitives (architecture-first).
import Phaser from 'phaser';
import { PersistentStore, localStorageAdapter } from '../core/PersistentStore.js';
import { ContentRegistry } from '../core/ContentRegistry.js';
import { SceneFlow } from '../core/SceneFlow.js';
import { registerAllContent } from '../content/registerAll.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const persistentStore = new PersistentStore(localStorageAdapter);
    persistentStore.load();

    const contentRegistry = new ContentRegistry();
    registerAllContent(contentRegistry);

    const sceneFlow = new SceneFlow();

    // registry = service locator / event bridge ONLY (not the domain model)
    this.registry.set('services', {
      persistentStore,
      contentRegistry,
      sceneFlow,
      runController: null   // created per run by HubScene
    });

    sceneFlow.go(this, 'HubScene');
  }
}
