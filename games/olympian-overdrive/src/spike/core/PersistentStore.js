// PersistentStore — state layer 1 (survives everything). Spike implementation.
//
// Owns the META that must outlive any run: Respect, Mastery syllabus, unlocked
// equipment ids, highest tier, settings, run-history summaries.
// Honors the v4 oracle-grade data model (spec MP-01/MP-02, House Rule 17):
//   - Respect  = a single CUMULATIVE INTEGER. Never reset, no decay, no multi-tier.
//   - Mastery  = a strict 1-D BOOLEAN ARRAY (one True/False per skill). No decay.
//   - Mastery DEMONSTRATION uses a rolling array of the last 4 binary outcomes,
//     pass = 3-of-4 (spec MP-02, BKT-grounded).
//
// Storage is injected (localStorageAdapter in the browser, an in-memory adapter
// in the Node smoke harness) so the whole layer is testable without a browser.
// Versioned migrations + corruption/first-run handling are present from day one
// (architecture §2). No fake encryption — base64 is not security.

export const SAVE_KEY = 'olympian-spike-save';
export const CURRENT_SCHEMA = 1;

// The canonical Mastery syllabus for the spike slice (one tier).
// Each entry is one competency the player can demonstrate. Index-stable: never
// reorder; append only (a migration handles growth).
export const MASTERY_SKILLS = Object.freeze([
  'rally_control',   // sustain a top-down rally
  'timing_strike',   // strike on the beat
  'hurdle_rhythm',   // clear side-scroller hurdles
  'pace_control'     // hold pace without faceplanting
]);

export function defaultSave() {
  return {
    schemaVersion: CURRENT_SCHEMA,
    respect: 0,                                      // cumulative integer
    mastery: MASTERY_SKILLS.map(() => false),        // 1-D boolean array
    // rolling window of the last 4 binary outcomes PER skill (for the 3-of-4 gate)
    masteryWindow: MASTERY_SKILLS.map(() => []),
    unlockedEquipmentIds: [],
    highestTierReached: 0,
    runHistory: [],                                  // [{ result, rounds, respectGained, ts }]
    settings: {}
  };
}

// Migration pipeline: an object keyed by the schema version it PRODUCES.
const migrations = {
  1: (s) => s
  // 2: (v1) => ({ ...v1, schemaVersion: 2, /* new fields */ }),
};

function migrate(raw) {
  let s = raw;
  while ((s.schemaVersion ?? 0) < CURRENT_SCHEMA) {
    const next = (s.schemaVersion ?? 0) + 1;
    const m = migrations[next];
    if (!m) throw new Error(`PersistentStore: missing migration to v${next}`);
    s = m(s);
    s.schemaVersion = next;
  }
  return s;
}

// Pragmatic validation/repair: required roots present, correct primitive types,
// arrays are arrays. Unknown ids tolerated. Returns a repaired object (never throws
// on shape drift — that path is for the corrupt branch).
function validateOrRepair(s) {
  const def = defaultSave();
  const out = { ...def, ...s };
  if (!Number.isInteger(out.respect)) out.respect = def.respect;
  if (!Array.isArray(out.mastery) || out.mastery.length !== MASTERY_SKILLS.length) {
    out.mastery = def.mastery.slice();
  } else {
    out.mastery = out.mastery.map((v) => v === true);
  }
  if (!Array.isArray(out.masteryWindow) || out.masteryWindow.length !== MASTERY_SKILLS.length) {
    out.masteryWindow = def.masteryWindow.map(() => []);
  }
  if (!Array.isArray(out.unlockedEquipmentIds)) out.unlockedEquipmentIds = [];
  if (!Array.isArray(out.runHistory)) out.runHistory = [];
  if (!Number.isInteger(out.highestTierReached)) out.highestTierReached = 0;
  if (typeof out.settings !== 'object' || out.settings === null) out.settings = {};
  out.schemaVersion = CURRENT_SCHEMA;
  return out;
}

export class PersistentStore {
  // adapter: { getItem(key)->string|null, setItem(key,string), removeItem(key) }
  constructor(adapter) {
    this.adapter = adapter;
    this.data = defaultSave();
  }

  load() {
    const raw = this.adapter.getItem(SAVE_KEY);
    if (raw == null) {            // first run
      this.data = defaultSave();
      this.save();
      return this.data;
    }
    try {
      const parsed = JSON.parse(raw);
      this.data = validateOrRepair(migrate(parsed));
    } catch (e) {                 // corrupt — back up, reset
      try { this.adapter.setItem(`${SAVE_KEY}.corrupt.${Date.now()}`, raw); } catch (_) {}
      this.data = defaultSave();
      this.save();
    }
    return this.data;
  }

  save() {
    this.adapter.setItem(SAVE_KEY, JSON.stringify(this.data));
  }

  // --- domain accessors (the only sanctioned way to mutate meta) ---

  getRespect() { return this.data.respect; }

  addRespect(n) {
    const inc = Math.trunc(n);          // stays an integer (MP-01)
    if (!Number.isFinite(inc)) return this.data.respect;
    this.data.respect += inc;
    return this.data.respect;
  }

  getMastery() { return this.data.mastery.slice(); }

  isSkillMastered(skillIndex) { return this.data.mastery[skillIndex] === true; }

  // Record one binary demonstration outcome for a skill; flip the boolean to true
  // once the rolling window hits 3-of-4 (MP-02). Returns true if newly mastered.
  recordMasteryOutcome(skillIndex, success) {
    const w = this.data.masteryWindow[skillIndex];
    if (!w) return false;
    w.push(success ? 1 : 0);
    while (w.length > 4) w.shift();
    const hits = w.reduce((a, b) => a + b, 0);
    const wasMastered = this.data.mastery[skillIndex] === true;
    if (!wasMastered && w.length >= 3 && hits >= 3) {
      this.data.mastery[skillIndex] = true;
      return true;
    }
    return false;
  }

  recordRun(summary) {
    this.data.runHistory.push({ ts: Date.now(), ...summary });
    if (this.data.runHistory.length > 50) this.data.runHistory.shift();
  }

  unlockEquipment(id) {
    if (!this.data.unlockedEquipmentIds.includes(id)) {
      this.data.unlockedEquipmentIds.push(id);
    }
  }
}

// Browser adapter.
export const localStorageAdapter = {
  getItem: (k) => (typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null),
  setItem: (k, v) => { if (typeof localStorage !== 'undefined') localStorage.setItem(k, v); },
  removeItem: (k) => { if (typeof localStorage !== 'undefined') localStorage.removeItem(k); }
};

// In-memory adapter (Node smoke harness).
export function createMemoryAdapter(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    _dump: () => Object.fromEntries(store)
  };
}