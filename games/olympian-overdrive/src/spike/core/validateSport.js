// validateSportDefinition — the runtime gate that keeps generated sport leaves
// honest against the narrow interface (architecture §4). A module that fails this
// never registers. This is the deterministic oracle the "generate the leaves"
// strategy leans on.
//
// The sport-module contract (data + ONE behavior method):
//   { id, version, displayName, viewMode: 'topdown'|'sidescroller',
//     tags: string[], baseRoundConfig: object, createRound(ctx) -> roundRuntime }
// where roundRuntime = { update(t,dt), getScore(), isComplete(), hasFailed(), destroy() }.
//
// Data-vs-behavior boundary (House Rule / Locked Decision 16): the ONLY behavior
// method a module may expose at the top level is createRound. No invented lifecycle.

export const VALID_VIEW_MODES = Object.freeze(['topdown', 'sidescroller']);
const ALLOWED_TOP_LEVEL = new Set([
  'id', 'version', 'displayName', 'viewMode', 'tags', 'baseRoundConfig', 'createRound'
]);
const REQUIRED_RUNTIME_METHODS = ['update', 'getScore', 'isComplete', 'hasFailed', 'destroy'];

export function validateSportDefinition(def) {
  const errors = [];
  if (!def || typeof def !== 'object') {
    return { ok: false, errors: ['definition is not an object'] };
  }

  if (typeof def.id !== 'string' || !def.id) errors.push('id must be a non-empty string');
  if (!Number.isInteger(def.version)) errors.push('version must be an integer');
  if (typeof def.displayName !== 'string' || !def.displayName) errors.push('displayName required');
  if (!VALID_VIEW_MODES.includes(def.viewMode)) {
    errors.push(`viewMode must be one of ${VALID_VIEW_MODES.join(' | ')}`);
  }
  if (!Array.isArray(def.tags) || def.tags.some((t) => typeof t !== 'string')) {
    errors.push('tags must be a string[]');
  }
  if (typeof def.baseRoundConfig !== 'object' || def.baseRoundConfig === null) {
    errors.push('baseRoundConfig must be an object (ids/labels/tuning only)');
  }
  if (typeof def.createRound !== 'function') {
    errors.push('createRound(ctx) must be a function');
  }

  // No invented top-level behavior (data-vs-behavior boundary).
  for (const k of Object.keys(def)) {
    if (!ALLOWED_TOP_LEVEL.has(k)) {
      errors.push(`unexpected top-level key '${k}' (data-vs-behavior boundary: only createRound is behavior)`);
    }
  }

  return { ok: errors.length === 0, errors };
}

// Validate the runtime object a createRound(ctx) returns.
export function validateRoundRuntime(rt) {
  const errors = [];
  if (!rt || typeof rt !== 'object') return { ok: false, errors: ['createRound did not return an object'] };
  for (const m of REQUIRED_RUNTIME_METHODS) {
    if (typeof rt[m] !== 'function') errors.push(`round runtime missing method '${m}()'`);
  }
  return { ok: errors.length === 0, errors };
}
