#!/usr/bin/env node
// review-game.js v1 — deterministic static review for AI-generated Phaser 3 game code
// Per Research Log 2026-05-26-gba-v2-review-playtest-tools.md (Azure synthesis MVP)
// Catches: missing .js extensions, missing import targets, asset path drift,
//          texture-key mismatch, setFill, setAllowGravity-on-sprite, sport-key drift

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const RULES = {
  R01: { name: 'extensionless-relative-import', severity: 'HIGH', confidence: 'HIGH',
    reason: 'Relative import without .js extension breaks under strict ES module resolution' },
  R02: { name: 'relative-import-target-missing', severity: 'HIGH', confidence: 'HIGH',
    reason: 'Imported module path does not resolve to an existing file (case-exact)' },
  R03: { name: 'asset-preload-path-missing', severity: 'HIGH', confidence: 'HIGH',
    reason: 'Asset path declared in preload/manifest does not exist on disk' },
  R04: { name: 'asset-key-mismatch', severity: 'HIGH', confidence: 'HIGH',
    reason: 'Asset key used at runtime is not declared in preload/manifest' },
  R05: { name: 'banned-setfill', severity: 'HIGH', confidence: 'HIGH',
    reason: '.setFill() does not exist on Phaser Text; use .setColor() instead' },
  R06: { name: 'setallowgravity-on-sprite', severity: 'HIGH', confidence: 'HIGH',
    reason: '.setAllowGravity() is a body method; call on sprite.body, not sprite' },
  R07: { name: 'sport-key-literal-outside-constants', severity: 'MEDIUM', confidence: 'MEDIUM',
    reason: 'Sport key string literal used outside the canonical constants file' }
};

const KNOWN_SPORTS = ['pickleball', 'soccer', 'volleyball', 'mashup-pickle-soccer'];

function parseArgs(argv) {
  const args = { gameDir: null, output: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--output' && argv[i + 1]) args.output = argv[++i];
    else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('Usage: node scripts/review-game.js <game-dir> [--output <path>]');
      process.exit(0);
    } else if (!argv[i].startsWith('--') && !args.gameDir) args.gameDir = argv[i];
  }
  if (!args.gameDir) { console.error('Error: game-dir required'); process.exit(1); }
  args.gameDir = path.resolve(args.gameDir);
  return args;
}

function walkJs(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
      out.push(...walkJs(full));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

function exactCasePathExists(absPath) {
  // Verify the path exists AND each segment matches the actual filesystem case
  if (!fs.existsSync(absPath)) return false;
  const parts = absPath.split(path.sep);
  let cur = parts[0] + path.sep; // drive root on Windows
  for (let i = 1; i < parts.length; i++) {
    const expected = parts[i];
    if (!expected) continue;
    try {
      const actual = fs.readdirSync(cur).find(n => n.toLowerCase() === expected.toLowerCase());
      if (!actual || actual !== expected) return false;
      cur = path.join(cur, actual);
    } catch { return false; }
  }
  return true;
}

function fingerprint(rule_id, file, snippet) {
  const norm = (snippet || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  return crypto.createHash('sha1').update(`${rule_id}|${file}|${norm}`).digest('hex').slice(0, 12);
}

function mkFinding(rule_id, file, line, snippet, extra = '') {
  const rule = RULES[rule_id];
  return {
    rule_id, severity: rule.severity, confidence: rule.confidence,
    file: file, line, snippet: snippet.trim().slice(0, 200),
    reason: extra ? `${rule.reason} (${extra})` : rule.reason,
    fingerprint: fingerprint(rule_id, file, snippet),
    outcome: 'pending'
  };
}

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function linesOf(text) { return text.split(/\r?\n/); }

// ---- R01 + R02: relative imports ----
function checkImports(jsFiles, gameDir) {
  const findings = [];
  const importRe = /^\s*import\s+(?:[\s\S]+?from\s+)?['"](\.\.?\/[^'"]+)['"]/gm;
  for (const file of jsFiles) {
    const text = readFile(file);
    const lines = linesOf(text);
    let m;
    importRe.lastIndex = 0;
    while ((m = importRe.exec(text)) !== null) {
      const spec = m[1];
      const lineNo = text.slice(0, m.index).split(/\r?\n/).length;
      const rel = path.relative(gameDir, file).replace(/\\/g, '/');
      // R01: missing .js extension
      if (!/\.(js|mjs|cjs|json)$/.test(spec)) {
        findings.push(mkFinding('R01', rel, lineNo, lines[lineNo - 1], `import "${spec}"`));
        // Don't run R02 on something we already know is malformed
        continue;
      }
      // R02: resolve and check exact case existence
      const absResolved = path.resolve(path.dirname(file), spec);
      if (!exactCasePathExists(absResolved)) {
        findings.push(mkFinding('R02', rel, lineNo, lines[lineNo - 1], `target "${spec}"`));
      }
    }
  }
  return findings;
}

// ---- R03: asset preload paths exist on disk ----
function checkAssetPaths(jsFiles, gameDir) {
  const findings = [];
  const publicDir = path.join(gameDir, 'public');
  // pattern matches: this.load.image('key', 'path')  OR  { path: 'path' }  inside manifest
  // we also accept multi-line shapes
  const loadRe = /this\.load\.(?:image|spritesheet|audio|atlas|json)\s*\(\s*[^,]+,\s*['"]([^'"]+)['"]/g;
  const manifestPathRe = /\bpath\s*:\s*['"]([^'"]+)['"]/g;
  for (const file of jsFiles) {
    const text = readFile(file);
    const lines = linesOf(text);
    const rel = path.relative(gameDir, file).replace(/\\/g, '/');
    const seen = new Set();
    for (const re of [loadRe, manifestPathRe]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        const assetPath = m[1];
        if (seen.has(assetPath)) continue;
        seen.add(assetPath);
        // skip URLs / data URIs
        if (/^(https?:|data:|\/\/)/.test(assetPath)) continue;
        const lineNo = text.slice(0, m.index).split(/\r?\n/).length;
        const absPath = path.join(publicDir, assetPath);
        if (!exactCasePathExists(absPath)) {
          findings.push(mkFinding('R03', rel, lineNo, lines[lineNo - 1], `public/${assetPath}`));
        }
      }
    }
  }
  return findings;
}

// ---- R04: asset key mismatch (declared vs used) ----
function checkAssetKeys(jsFiles, gameDir) {
  const findings = [];
  const declared = new Set();
  const declaredKeyConsts = new Map(); // const name → key string (from asset-keys.js exports)
  const uses = []; // { file, line, key, snippet }

  // Pass 1: collect declarations
  const loadKeyRe = /this\.load\.(?:image|spritesheet|audio|atlas|json)\s*\(\s*['"]([^'"]+)['"]/g;
  const manifestKeyRe = /\bkey\s*:\s*(?:['"]([^'"]+)['"]|[A-Z_]+\.([A-Z0-9_]+))/g;
  const constDeclRe = /^\s*(?:export\s+)?(?:const\s+)?([A-Z][A-Z0-9_]*)\s*[:=]\s*['"]([^'"]+)['"]/gm;
  for (const file of jsFiles) {
    const text = readFile(file);
    // direct load keys
    let m;
    loadKeyRe.lastIndex = 0;
    while ((m = loadKeyRe.exec(text)) !== null) declared.add(m[1]);
    // manifest entries (key: 'foo' OR key: ASSET_KEYS.FOO)
    manifestKeyRe.lastIndex = 0;
    while ((m = manifestKeyRe.exec(text)) !== null) {
      if (m[1]) declared.add(m[1]);
      // m[2] is a const reference — resolve via constDeclRe below
    }
    // Constants in asset-keys.js (or any UPPER_CASE: 'string')
    if (/asset-keys/.test(file)) {
      constDeclRe.lastIndex = 0;
      while ((m = constDeclRe.exec(text)) !== null) {
        declaredKeyConsts.set(m[1], m[2]);
        declared.add(m[2]);
      }
    }
  }

  // Pass 2: collect uses
  // matches: this.add.image/sprite, this.physics.add.sprite/image, etc.
  // 3rd-positional arg is the key. We grab literals and CONST.X refs.
  const usePatterns = [
    /this\.add\.(?:image|sprite|tileSprite)\s*\(\s*[^,]+,\s*[^,]+,\s*(?:['"]([^'"]+)['"]|([A-Z_]+\.[A-Z0-9_]+))/g,
    /this\.physics\.add\.(?:image|sprite|staticSprite)\s*\(\s*[^,]+,\s*[^,]+,\s*(?:['"]([^'"]+)['"]|([A-Z_]+\.[A-Z0-9_]+))/g,
    /this\.sound\.add\s*\(\s*(?:['"]([^'"]+)['"]|([A-Z_]+\.[A-Z0-9_]+))/g
  ];
  for (const file of jsFiles) {
    const text = readFile(file);
    const lines = linesOf(text);
    const rel = path.relative(gameDir, file).replace(/\\/g, '/');
    for (const re of usePatterns) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        const lineNo = text.slice(0, m.index).split(/\r?\n/).length;
        if (m[1]) {
          // literal key
          uses.push({ rel, lineNo, key: m[1], snippet: lines[lineNo - 1] });
        } else if (m[2]) {
          // CONST.NAME reference — resolve via declared constants
          const constName = m[2].split('.')[1];
          if (declaredKeyConsts.has(constName)) {
            uses.push({ rel, lineNo, key: declaredKeyConsts.get(constName), snippet: lines[lineNo - 1], _via: m[2] });
          } else {
            // unresolved constant — flag as mismatch (key not declared)
            findings.push(mkFinding('R04', rel, lineNo, lines[lineNo - 1], `${m[2]} not declared`));
          }
        }
      }
    }
  }

  // Compare uses against declared
  for (const u of uses) {
    if (!declared.has(u.key)) {
      findings.push(mkFinding('R04', u.rel, u.lineNo, u.snippet, `key "${u.key}" not declared`));
    }
  }
  return findings;
}

// ---- R05: banned .setFill( ----
function checkSetFill(jsFiles, gameDir) {
  const findings = [];
  const re = /\.setFill\s*\(/g;
  for (const file of jsFiles) {
    const text = readFile(file);
    const lines = linesOf(text);
    const rel = path.relative(gameDir, file).replace(/\\/g, '/');
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const lineNo = text.slice(0, m.index).split(/\r?\n/).length;
      findings.push(mkFinding('R05', rel, lineNo, lines[lineNo - 1]));
    }
  }
  return findings;
}

// ---- R06: setAllowGravity on non-.body ----
function checkSetAllowGravity(jsFiles, gameDir) {
  const findings = [];
  // Match: <receiver>.setAllowGravity(  where receiver does NOT end in .body
  const re = /(\b[\w.]+?)\.setAllowGravity\s*\(/g;
  for (const file of jsFiles) {
    const text = readFile(file);
    const lines = linesOf(text);
    const rel = path.relative(gameDir, file).replace(/\\/g, '/');
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const receiver = m[1];
      if (!/\.body$/.test(receiver)) {
        const lineNo = text.slice(0, m.index).split(/\r?\n/).length;
        findings.push(mkFinding('R06', rel, lineNo, lines[lineNo - 1], `receiver "${receiver}"`));
      }
    }
  }
  return findings;
}

// ---- R07: sport-key literals outside canonical constants ----
function checkSportKeys(jsFiles, gameDir) {
  const findings = [];
  // Build pattern matching the known sports as string literals
  const sportRe = new RegExp(`['"](${KNOWN_SPORTS.join('|')})['"]`, 'g');
  for (const file of jsFiles) {
    const rel = path.relative(gameDir, file).replace(/\\/g, '/');
    // Skip the canonical constants file itself
    if (/sport-keys|sport_keys/.test(file)) continue;
    const text = readFile(file);
    const lines = linesOf(text);
    sportRe.lastIndex = 0;
    let m;
    while ((m = sportRe.exec(text)) !== null) {
      const lineNo = text.slice(0, m.index).split(/\r?\n/).length;
      findings.push(mkFinding('R07', rel, lineNo, lines[lineNo - 1], `literal "${m[1]}"`));
    }
  }
  return findings;
}

// ---- summarize + collapse duplicates ----
function summarize(findings) {
  const byRule = {};
  const bySeverity = {};
  const seen = new Set();
  const unique = [];
  for (const f of findings) {
    if (seen.has(f.fingerprint)) continue;
    seen.add(f.fingerprint);
    unique.push(f);
    byRule[f.rule_id] = (byRule[f.rule_id] || 0) + 1;
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
  }
  return { total: unique.length, by_rule: byRule, by_severity: bySeverity, unique };
}

function main() {
  const args = parseArgs(process.argv);
  const gameDir = args.gameDir;
  const srcDir = path.join(gameDir, 'src');
  if (!fs.existsSync(srcDir)) {
    console.error(`Error: src/ not found in ${gameDir}`);
    process.exit(1);
  }

  const jsFiles = walkJs(srcDir);
  // Also include top-level main.js / vite.config.js etc. if they exist as imports targets
  const topLevel = fs.readdirSync(gameDir, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.js'))
    .map(e => path.join(gameDir, e.name));
  const allFiles = [...jsFiles, ...topLevel];

  console.log(`[review] ${allFiles.length} .js files scanned (src/ + top-level)`);

  const findings = [
    ...checkImports(allFiles, gameDir),
    ...checkAssetPaths(allFiles, gameDir),
    ...checkAssetKeys(allFiles, gameDir),
    ...checkSetFill(allFiles, gameDir),
    ...checkSetAllowGravity(allFiles, gameDir),
    ...checkSportKeys(allFiles, gameDir)
  ];

  const summary = summarize(findings);
  const blocking = summary.unique.some(f => f.severity === 'HIGH');

  const runId = 'review-' + new Date().toISOString().replace(/[:.]/g, '-');
  const report = {
    runId,
    tool: 'review-game.js',
    version: '1.0.0',
    gameDir: path.basename(gameDir),
    timestamp: new Date().toISOString(),
    rules_run: Object.keys(RULES),
    findings: summary.unique,
    summary: {
      files_scanned: allFiles.length,
      total_findings: summary.total,
      by_rule: summary.by_rule,
      by_severity: summary.by_severity
    },
    blocking
  };

  const outPath = args.output || path.join(gameDir, '.review-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(`[review] ${summary.total} unique findings (HIGH=${summary.by_severity.HIGH || 0}, MEDIUM=${summary.by_severity.MEDIUM || 0}, LOW=${summary.by_severity.LOW || 0})`);
  console.log(`[review] blocking: ${blocking}`);
  console.log(`[review] report: ${outPath}`);

  if (summary.unique.length > 0) {
    console.log('');
    for (const f of summary.unique) {
      console.log(`  ${f.rule_id} ${f.severity}/${f.confidence}  ${f.file}:${f.line}  ${f.reason}`);
    }
  }

  process.exit(blocking ? 1 : 0);
}

main();