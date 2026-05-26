import Controller_Pickleball from '../Pickleball/Controller_Pickleball.js';
import LevelManager_Soccer from '../Soccer/LevelManager_Soccer.js';
import { SPORT_MASHUP_PICKLE_SOCCER } from '../../core/sport-keys.js';

export default {
  key: SPORT_MASHUP_PICKLE_SOCCER,
  displayName: 'Pickle Soccer',
  createController(scene, inputManager) {
    return new Controller_Pickleball(scene, inputManager);
  },
  createLevelManager() {
    return new LevelManager_Soccer();
  }
};