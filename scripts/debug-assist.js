/**
 * debug-assist.js — Get a Phaser/JS diagnostic from Azure OpenAI gpt-5.4
 *
 * Usage:
 *   node scripts/debug-assist.js --file <path> --symptom "<what's wrong>"
 *   node scripts/debug-assist.js --file games/foo/src/scenes/GameScene.js --symptom "bullets fire but don't move"
 *
 * Flags:
 *   --file <path>     Required. Source file to analyze.
 *   --symptom "..."   Required. One-line description of the bug.
 *   --extra <path>    Optional. Additional file to include for context.
 *
 * Returns: Diagnosis + minimum fix. Does not write code.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const CREDENTIALS_PATH = path.join('C:', 'Users', 'charl', '.claude', 'credentials.json');
const API_VERSION = '2024-08-01-preview';

function loadCredentials() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const aoai = creds.azure_openai;
  if (!aoai?.endpoint || !aoai?.key) throw new Error('Missing azure_openai credentials');
  const deployment = aoai.deployments?.gpt5_4 || 'gpt-5-4';
  return { endpoint: aoai.endpoint.replace(/\/$/, ''), key: aoai.key, deployment };
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { file: null, symptom: null, extra: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) result.file = args[++i];
    else if (args[i] === '--symptom' && args[i + 1]) result.symptom = args[++i];
    else if (args[i] === '--extra' && args[i + 1]) result.extra = args[++i];
  }
  return result;
}

function callAzure(endpoint, key, deployment, messages) {
  return new Promise((resolve, reject) => {
    const hostname = endpoint.replace('https://', '');
    const urlPath = `/openai/deployments/${deployment}/chat/completions?api-version=${API_VERSION}`;
    const payload = JSON.stringify({ messages, max_completion_tokens: 2000, temperature: 0.2 });
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

async function main() {
  const { file, symptom, extra } = parseArgs(process.argv);
  if (!file || !symptom) {
    console.error('Usage: node scripts/debug-assist.js --file <path> --symptom "<bug description>"');
    process.exit(1);
  }

  const code = fs.readFileSync(file, 'utf8');
  const extraCode = extra ? fs.readFileSync(extra, 'utf8') : null;

  const sys = `You are a Phaser 3 + arcade physics expert debugging a game. Given a symptom and source code, you:
1. Identify the most likely root cause (cite specific line numbers).
2. Explain WHY it produces the symptom — physics body lifecycle, group behavior, render order, etc.
3. Propose the minimum code fix. Be specific (which line, what to change to).
4. If there's more than one plausible cause, rank them.
Do not propose new features. Do not rewrite unrelated code. Focus on the symptom.`;

  const userMsg = `## Symptom
${symptom}

## Stack
- Phaser 3.80.0 + Vite
- Arcade physics, gravity y=0
- Game runs (renders, scenes transition), just this one behavior is broken

## File: ${file}
\`\`\`js
${code}
\`\`\`
${extraCode ? `\n## Extra context: ${extra}\n\`\`\`js\n${extraCode}\n\`\`\`` : ''}

Diagnose and propose the minimum fix.`;

  const { endpoint, key, deployment } = loadCredentials();
  console.log(`[debug-assist] Calling ${deployment}...\n`);
  const t0 = Date.now();
  const reply = await callAzure(endpoint, key, deployment, [
    { role: 'system', content: sys },
    { role: 'user', content: userMsg }
  ]);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(reply);
  console.log(`\n[debug-assist] ${elapsed}s`);
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
