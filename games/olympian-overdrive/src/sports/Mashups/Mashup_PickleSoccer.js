import Controller_Pickleball from '../Pickleball/Controller_Pickleball.js';
import LevelManager_Soccer from '../Soccer/LevelManager_Soccer.js';

export default {
  key: 'mashup-pickle-soccer',
  displayName: 'Pickle Soccer',
  createController(scene, inputManager) {
    return new Controller_Pickleball(scene, inputManager);
  },
  createLevelManager() {
    return new LevelManager_Soccer();
  }
};