/**
 * build-game.js — Autonomous Phaser scaffold generator (Pipeline mode)
 *
 * Reads an approved spec.md, calls Azure OpenAI in stages (manifest → per-file
 * generation), writes a runnable Phaser 3 + Vite scaffold to --output.
 *
 * Usage:
 *   node scripts/build-game.js <spec.md> --output <dir>
 *   node scripts/build-game.js <spec.md> --output <dir> --dry-run         # manifest only
 *   node scripts/build-game.js <spec.md> --output <dir> --only-files src/scenes/MenuScene.js
 *
 * Credentials: C:/Users/charl/.claude/credentials.json
 *   - azure_openai → gpt5_4 (manifest stage)
 *   - azure_openai → gpt5_4_nano (per-file generation, cheaper)
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const CREDENTIALS_PATH = path.join('C:', 'Users', 'charl', '.claude', 'credentials.json');
const API_VERSION = '2024-08-01-preview';

const HOUSE_RULES = `
# Phaser 3 House Rules (learned from real bugs — these are NON-NEGOTIABLE)

1. All physics groups: \`this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite, allowGravity: false })\`. Default config produces non-physics sprites that break setVelocity silently.
2. Spawn group children via \`group.create(x, y, key)\`, never \`this.physics.add.sprite() + group.add()\`.
3. Phaser Text uses \`setColor('#hex')\`, never \`setFill\` (does not exist — silent crash on first call).
4. Sprites controlled by tweens that also need a physics body: \`sprite.setImmovable(true)\` + \`sprite.body.setAllowGravity(false)\`.
5. Damage handlers MUST include an invulnerability flag/window (e.g., 1500ms) — without it, multi-collision events drain lives in a single frame.
6. Every scene file imports Phaser at top: \`import Phaser from 'phaser';\`
7. \`update(time, delta)\` MUST guard with \`if (!this.gameActive || !this.player) return;\` (or equivalent) at the very top to survive scene-transition tick races.
8. \`vite.config.js\`: \`export default { base: './' };\` — required for Azure Static Web Apps relative-path serving.
9. Every game folder needs \`staticwebapp.config.json\` with SPA navigation fallback to \`/index.html\`.
10. Use Arrow keys + Z (jump/dodge) + X (strike) via Phaser's keyboard plugin. Centralize in an InputManager module exporting verb-named accessors (e.g., \`isStrikePressed()\`).
11. \`setAllowGravity\` is a BODY method, NOT a SPRITE method — always \`sprite.body.setAllowGravity(false)\`, never \`sprite.setAllowGravity(false)\`. Same applies to \`setGravityY\`. Phaser's Arcade Sprite delegates many methods to its body (setVelocity, setBounce, setDrag, setMaxVelocity) but NOT these two.
12. Scene transitions can leave a Menu scene locked if the target scene crashes during create(). Defensive pattern: in MenuScene, hook \`this.events.on('wake', () => this.starting = false)\` and \`this.events.on('resume', () => this.starting = false)\`, AND do NOT gate dev shortcuts (debug keys for jumping to sports) behind the starting flag.
13. Sport/scene routing keys MUST be string-matched consistently across files. Define them once as exported constants (e.g., in \`src/core/sport-keys.js\` or in \`asset-keys.js\` alongside asset keys) and import wherever a sport is referenced — MenuScene routing, ActiveScene sport dispatch, GameManager state, mash-up wiring. Silent-fail string mismatch ('mashup-picklesoccer' vs 'mashup-pickle-soccer') is the bug class to kill.

# Asset Key Namespace Contract (Round 2 — kills the v1/v2 contract-drift bug class)

14. Never invent raw asset key strings in scene files, entity files, or gameplay files. All asset keys must come from the canonical manifest file (\`asset-keys.js\` or \`asset-keys.json\`).
15. Every sport-specific asset key must use this exact format: \`{sport}_{role}_{variant}\` in lowercase snake_case. Variant is mandatory even when only one version exists (use \`default\`).
16. Valid sport namespaces: \`pickleball\`, \`soccer\`, \`volleyball\`. Valid shared namespaces: \`boot\`, \`ui\`, \`shared\`.
17. Banned generic keys: \`ball\`, \`player\`, \`court\`, \`net\`, \`goal\`, \`paddle\`. Banned reordered forms: \`ball_soccer\`, \`paddle_pickleball\`, etc.
18. If an asset is needed and no manifest entry exists, do not guess. Add the required entry to the manifest first, then reference it from code.
19. BootScene must preload all declared asset keys by iterating the canonical manifest. Do not hand-type preload keys inline.
20. If uncertain about a key name, stop and use the manifest as the source of truth. Never paraphrase or normalize asset names.

# Spec Fidelity Awareness (Round 2)

Some spec contracts have lower natural fidelity than others. Pay EXTRA attention to:
- **Game Feel Contract** (~55-65% predicted fidelity): hit-stop durations, particle counts, screen-shake amplitudes are easy to drop or soften. Honor exact values verbatim.
- **Difficulty Contract** (~75-80%): preserve both the numbers AND the surrounding logic — numbers without correct triggering produces drift.

Asset keys, physics constants, and QA assertions have high natural fidelity — those are easier. Spend your care budget on Feel and Difficulty.
`.trim();

function loadCredentials() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const aoai = creds.azure_openai;
  if (!aoai?.endpoint || !aoai?.key) throw new Error('Missing azure_openai credentials');
  return {
    endpoint: aoai.endpoint.replace(/\/$/, ''),
    key: aoai.key,
    manifestModel: aoai.deployments?.gpt5_4 || 'gpt-5-4',
    // v2: file generation uses gpt-5.4 (not nano) — smarter defaults worth the cost
    genModel: aoai.deployments?.gpt5_4 || aoai.deployments?.gpt5_4_nano || 'gpt-5-4'
  };
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { spec: null, output: null, dryRun: false, onlyFiles: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) result.output = args[++i];
    else if (args[i] === '--dry-run') result.dryRun = true;
    else if (args[i] === '--only-files' && args[i + 1]) result.onlyFiles = args[++i].split(',');
    else if (args[i] === '--help' || args[i] === '-h') {
      console.log('Usage: node scripts/build-game.js <spec.md> --output <dir> [--dry-run] [--only-files <comma-list>]');
      process.exit(0);
    }
    else if (!args[i].startsWith('--') && !result.spec) result.spec = args[i];
  }
  return result;
}

function callAzure(endpoint, key, deployment, messages, opts = {}) {
  return new Promise((resolve, reject) => {
    const hostname = endpoint.replace('https://', '');
    const urlPath = `/openai/deployments/${deployment}/chat/completions?api-version=${API_VERSION}`;
    const body = { messages, max_completion_tokens: opts.maxTokens || 4000, temperature: opts.temperature ?? 0.2 };
    if (opts.jsonMode) body.response_format = { type: 'json_object' };
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname, path: urlPath, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'api-key': key
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(data).choices?.[0]?.message?.content || ''); }
          catch (e) { reject(new Error(`Parse error: ${data.slice(0, 200)}`)); }
        } else {
          reject(new Error(`Azure ${res.statusCode}: ${data.slice(0, 300)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function generateManifest(spec, creds) {
  const sys = `You are a Phaser 3 + Vite project architect. Given a game spec, produce a JSON manifest of files needed to scaffold the game's Milestone 1 only.

Output STRICT JSON only with this shape:
{
  "game_name": "kebab-case-name",
  "files": [
    { "path": "package.json", "purpose": "one-line description", "depends_on": [] },
    { "path": "src/main.js", "purpose": "...", "depends_on": ["src/scenes/BootScene.js"] }
  ]
}

Guidelines:
- Include: package.json, vite.config.js, index.html, staticwebapp.config.json, src/main.js
- One scene file per Phaser scene (BootScene, MenuScene, ActiveScene, ResultScene, etc. — match the spec's scene flow)
- Separate Controllers (player verbs) and LevelManagers (rules/environment) — one file each per sport
- Shared core modules: src/core/InputManager.js, src/core/GameManager.js if the spec calls for them
- Place sport modules under src/sports/<SportName>/
- depends_on lists path strings (other manifest entries) — used to order generation. Do NOT use wildcards.
- Keep file count reasonable (10–20 files for a vertical slice).
- README.md optional; include only if useful.

${HOUSE_RULES}

Output only JSON. No commentary, no markdown fence.`;

  const msg = [
    { role: 'system', content: sys },
    { role: 'user', content: `Spec:\n\n${spec}` }
  ];

  console.log('[manifest] calling', creds.manifestModel, '...');
  const t0 = Date.now();
  const raw = await callAzure(creds.endpoint, creds.key, creds.manifestModel, msg, { maxTokens: 4000, jsonMode: true });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[manifest] ${dt}s, ${raw.length} chars`);

  let manifest;
  try { manifest = JSON.parse(raw); }
  catch (e) {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) manifest = JSON.parse(m[0]);
    else throw new Error(`Manifest is not valid JSON: ${raw.slice(0, 200)}`);
  }
  if (!Array.isArray(manifest.files)) throw new Error('Manifest missing files[]');
  return manifest;
}

function orderByDeps(files) {
  const map = new Map(files.map(f => [f.path, f]));
  const visited = new Set();
  const result = [];
  function visit(f, stack = []) {
    if (visited.has(f.path)) return;
    if (stack.includes(f.path)) return;
    for (const dep of (f.depends_on || [])) {
      const depFile = map.get(dep);
      if (depFile) visit(depFile, [...stack, f.path]);
    }
    visited.add(f.path);
    result.push(f);
  }
  for (const f of files) visit(f);
  return result;
}

async function generateFile(file, spec, manifest, generatedSoFar, creds) {
  const depContents = (file.depends_on || [])
    .map(d => generatedSoFar[d] ? `### ${d}\n\`\`\`\n${generatedSoFar[d]}\n\`\`\`` : null)
    .filter(Boolean)
    .join('\n\n');

  const sys = `You are generating ONE file in a Phaser 3 + Vite project. You will receive the full spec, the file manifest, this file's purpose, and the source of any files it depends on. Produce ONLY the file's contents — no markdown fences, no commentary, no explanation. Just code (or JSON for package.json / staticwebapp.config.json).

${HOUSE_RULES}

Additional rules:
- Match the conventions of any dependency file shown.
- Use ES modules.
- Phaser version: ^3.80.0 in package.json.
- Vite version: ^5.0.0 in package.json.
- For src/main.js: register all scenes from the manifest in order (Boot first). Capture the Phaser.Game instance as \`const game = new Phaser.Game(config)\` (not anonymous). At the end of main.js, expose the game globally ONLY when \`?playtest=1\` is present in the URL — this is the playtest hook that lets scripts/playtest-game.js introspect scene state. Use this exact pattern:\n  \`if (new URLSearchParams(window.location.search).get('playtest') === '1') { window.game = game; }\`\n  No-op for normal play; required for headless runtime smoke tests.
- For index.html: minimal, points to /src/main.js with type="module".
- For scene files: export default class extending Phaser.Scene, constructor calls super(sceneKey).
- For Controllers: export a class or factory that attaches input handlers and exposes hitboxes/state to its LevelManager.
- For LevelManagers: export a class/factory that takes (scene, controller) and sets up environment, win/fail conditions, calls scene.gameOver(outcome).
- Do NOT include comments explaining what well-named code does. One-line comments only for non-obvious WHY.
- Do NOT use TypeScript types or JSDoc unless the dependency files do.
- Keep each file < 300 lines if possible.`;

  const user = `## Full spec
${spec}

## File manifest
${manifest.files.map(f => `- ${f.path}: ${f.purpose}`).join('\n')}

## This file
**Path:** ${file.path}
**Purpose:** ${file.purpose}
**Depends on:** ${(file.depends_on || []).join(', ') || '(none)'}

${depContents ? `## Dependency source files\n\n${depContents}` : ''}

Generate the contents of ${file.path}. Output only the file's contents.`;

  const t0 = Date.now();
  const content = await callAzure(creds.endpoint, creds.key, creds.genModel, [
    { role: 'system', content: sys },
    { role: 'user', content: user }
  ], { maxTokens: 4000, temperature: 0.2 });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);

  let clean = content.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
  }
  return { content: clean, elapsed: dt };
}

function writeFile(outputDir, relPath, content) {
  const full = path.join(outputDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

async function main() {
  const { spec: specPath, output, dryRun, onlyFiles } = parseArgs(process.argv);
  if (!specPath || !output) {
    console.error('Usage: node scripts/build-game.js <spec.md> --output <dir> [--dry-run] [--only-files <comma-list>]');
    process.exit(1);
  }
  if (!fs.existsSync(specPath)) {
    console.error(`Spec not found: ${specPath}`);
    process.exit(1);
  }

  const spec = fs.readFileSync(specPath, 'utf8');
  if (!/\*\*Status:\*\*\s+approved/i.test(spec)) {
    console.warn('[warn] spec status is not "approved" — proceeding anyway');
  }

  const creds = loadCredentials();
  console.log(`[build-game] spec: ${specPath}`);
  console.log(`[build-game] output: ${output}`);
  console.log(`[build-game] models: ${creds.manifestModel} (manifest) / ${creds.genModel} (files)`);

  const manifest = await generateManifest(spec, creds);
  console.log(`[manifest] game: ${manifest.game_name}, ${manifest.files.length} files`);
  for (const f of manifest.files) {
    console.log(`  - ${f.path}  (${(f.depends_on || []).length} deps)`);
  }

  if (dryRun) {
    console.log('\n[dry-run] manifest stage complete. Skipping generation.');
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(path.join(output, '_manifest.json'), JSON.stringify(manifest, null, 2));
    console.log(`[dry-run] manifest saved to ${output}/_manifest.json`);
    return;
  }

  const ordered = orderByDeps(manifest.files);
  const toBuild = onlyFiles ? ordered.filter(f => onlyFiles.includes(f.path)) : ordered;
  if (onlyFiles) console.log(`[filter] generating ${toBuild.length}/${ordered.length} files`);

  const generated = {};
  let totalTime = 0;
  for (let i = 0; i < toBuild.length; i++) {
    const f = toBuild[i];
    process.stdout.write(`[${i + 1}/${toBuild.length}] ${f.path} ... `);
    try {
      const { content, elapsed } = await generateFile(f, spec, manifest, generated, creds);
      generated[f.path] = content;
      writeFile(output, f.path, content);
      totalTime += parseFloat(elapsed);
      console.log(`${elapsed}s  (${content.length} chars)`);
    } catch (e) {
      console.log(`FAIL: ${e.message}`);
    }
  }

  fs.writeFileSync(path.join(output, '_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\n[build-game] complete. ${toBuild.length} files in ${totalTime.toFixed(1)}s total.`);
  console.log(`[build-game] next: cd ${output} && npm install && npm run dev`);
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
