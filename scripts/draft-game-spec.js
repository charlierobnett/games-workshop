/**
 * draft-game-spec.js — Draft a structured game spec via Azure OpenAI gpt-5.4
 *
 * Usage:
 *   node scripts/draft-game-spec.js "top-down tank battle, 2 players, local multiplayer" --output games/tank-battle/spec.md
 *   node scripts/draft-game-spec.js "platformer with a dog" --output games/dog-run/spec.md --interactive
 *
 * Flags:
 *   --output <path>    Required. Where to write the spec .md file.
 *   --interactive      Print spec to console and wait for Enter before saving.
 *   --mode <m>         Target execution mode: interactive (default) | pipeline
 *
 * Output is a standard spec schema understood by both Claude Code (interactive builds)
 * and the future build-game.js pipeline.
 *
 * Credentials: C:\Users\charl\.claude\credentials.json → azure_openai → gpt5_4 deployment
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const CREDENTIALS_PATH = path.join('C:', 'Users', 'charl', '.claude', 'credentials.json');
const API_VERSION = '2024-08-01-preview';

function loadCredentials() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const aoai = creds.azure_openai;
  if (!aoai?.endpoint || !aoai?.key) throw new Error('Missing azure_openai credentials');
  const deployment = aoai.deployments?.gpt5_4 || aoai.deployments?.gpt5_4_nano || 'gpt-5-4';
  return { endpoint: aoai.endpoint.replace(/\/$/, ''), key: aoai.key, deployment };
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { idea: null, output: null, interactive: false, mode: 'interactive' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) result.output = args[++i];
    else if (args[i] === '--interactive') result.interactive = true;
    else if (args[i] === '--mode' && args[i + 1]) result.mode = args[++i];
    else if (!args[i].startsWith('--')) result.idea = args[i];
  }
  return result;
}

function callAzure(endpoint, key, deployment, messages) {
  return new Promise((resolve, reject) => {
    const hostname = endpoint.replace('https://', '');
    const urlPath = `/openai/deployments/${deployment}/chat/completions?api-version=${API_VERSION}`;
    const payload = JSON.stringify({ messages, max_completion_tokens: 3000, temperature: 0.4 });
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

function buildMessages(idea, mode, assetRoot) {
  const today = new Date().toISOString().slice(0, 10);
  return [
    {
      role: 'system',
      content: `You are a game design assistant writing a structured spec for a 2D browser game.

The spec must be executable — a developer (or AI pipeline) should be able to read it and build the game without asking clarifying questions.

Output ONLY the spec in this exact markdown schema:

# [Game Name] — Spec
**Date:** ${today}
**Status:** draft
**Target mode:** ${mode}

## Concept
[1 paragraph. Specific: include genre, perspective, win condition, lose condition, difficulty curve. No vague phrases like "engaging gameplay".]

## Milestone 1 — [Name] (playable in ~15 min)
- [Bullet: what player can do]
- [Bullet: assets used — name the specific files from the asset root]
- [Bullet: win/fail condition active in this milestone]

## Milestone 2 — [Name] (builds on M1)
[same structure]

## Milestone 3 — [Name] (complete game)
[same structure]

## Tech Stack
- Framework: Phaser 3 + Vite
- Language: vanilla JS
- Assets: Kenney packs at ${assetRoot}
- Deploy: Azure Static Web Apps (free tier)

## Asset Map
| Game element | Asset file | Pack |
|-------------|-----------|------|
[One row per major game element. Use real filenames from Kenney Space Shooter Remastered or other packs as appropriate.]

## Open Questions
[List any decisions left for the builder. If none, write "None — spec is complete."]

Output only the spec markdown. No preamble, no commentary.`
    },
    {
      role: 'user',
      content: `Game idea: ${idea}`
    }
  ];
}

function waitForEnter(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, () => { rl.close(); resolve(); });
  });
}

async function main() {
  const { idea, output, interactive, mode } = parseArgs(process.argv);

  if (!idea || !output) {
    console.error('Usage: node draft-game-spec.js "<game idea>" --output <path.md> [--interactive] [--mode pipeline]');
    process.exit(1);
  }

  const assetRoot = 'shared/assets/kenney-all-in-1-3.5.0/2D assets/';
  const { endpoint, key, deployment } = loadCredentials();
  console.log(`Drafting spec for: "${idea}"`);
  console.log(`Model: ${deployment}  Mode target: ${mode}`);

  const messages = buildMessages(idea, mode, assetRoot);
  const spec = await callAzure(endpoint, key, deployment, messages);

  if (interactive) {
    console.log('\n' + '─'.repeat(60));
    console.log(spec);
    console.log('─'.repeat(60) + '\n');
    await waitForEnter('Press Enter to save, Ctrl+C to abort: ');
  }

  const outDir = path.dirname(output);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(output, spec, 'utf8');

  const words = spec.split(/\s+/).filter(Boolean).length;
  console.log(`✓ Spec saved to ${output} (${words} words)`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
