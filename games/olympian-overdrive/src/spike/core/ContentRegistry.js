// ContentRegistry — the content plug-in seam (architecture §4, HIGHEST PRIORITY).
// Generated modules are ADDITIVE LEAVES: drop a file in, register it, done.
// The core never edits switch statements. This is what makes "generate the leaves"
// safe — get this contract right above all else.
//
// Pure JS. Validation lives in validateSport.js (imported by registerSport).

import { validateSportDefinition } from './validateSport.js';

export class ContentRegistry {
  constructor() {
    this.sports = new Map();
    this.equipment = new Map();
    this.modifiers = new Map();
    this.overdrives = new Map();
  }

  registerSport(def) {
    const { ok, errors } = validateSportDefinition(def);
    if (!ok) {
      throw new Error(`registerSport('${def?.id ?? '?'}') rejected:\n  - ${errors.join('\n  - ')}`);
    }
    if (this.sports.has(def.id)) {
      throw new Error(`registerSport: duplicate id '${def.id}'`);
    }
    this.sports.set(def.id, def);
    return def.id;
  }

  registerEquipment(def) {
    if (!def?.id || typeof def.applyToRun !== 'function') {
      throw new Error(`registerEquipment: needs { id, applyToRun() }`);
    }
    this.equipment.set(def.id, def);
    return def.id;
  }

  getSport(id) { return this.sports.get(id) ?? null; }
  listSports() { return [...this.sports.values()]; }
  listSportsByView(viewMode) { return this.listSports().filter((s) => s.viewMode === viewMode); }
}
