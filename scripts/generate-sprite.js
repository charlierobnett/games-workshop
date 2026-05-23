/**
 * generate-sprite.js — Generate a game sprite via Azure OpenAI gpt-image-2
 *
 * Usage:
 *   node scripts/generate-sprite.js "a small purple alien with 4 eyes" --output games/my-game/public/assets/enemies/alien.png
 *   node scripts/generate-sprite.js "red laser beam" --output public/assets/lasers/custom.png --size 512 --quality low
 *
 * Flags:
 *   --output <path>   Required. Where to save the PNG.
 *   --size <n>        Image size: 1024 (default) | 512 | 256
 *   --quality <q>     Image quality: medium (default) | low | high
 *
 * Credentials: C:\Users\charl\.claude\credentials.json → azure_openai_image
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const CREDENTIALS_PATH = path.join('C:', 'Users', 'charl', '.claude', 'credentials.json');
const API_VERSION = '2024-08-01-preview';

function loadCredentials() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const img = creds.azure_openai_image;
  if (!img?.endpoint || !img?.key) throw new Error('Missing azure_openai_image credentials in credentials.json');
  const deployment = img.deployments?.image || 'gpt-image-2';
  return { endpoint: img.endpoint.replace(/\/$/, ''), key: img.key, deployment };
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { prompt: null, output: null, size: '1024x1024', quality: 'medium' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) result.output = args[++i];
    else if (args[i] === '--size' && args[i + 1]) {
      const s = args[++i];
      result.size = `${s}x${s}`;
    }
    else if (args[i] === '--quality' && args[i + 1]) result.quality = args[++i];
    else if (!args[i].startsWith('--')) result.prompt = args[i];
  }
  return result;
}

function httpsPost(hostname, urlPath, headers, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname, path: urlPath, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function httpsGetBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function main() {
  const { prompt, output, size, quality } = parseArgs(process.argv);

  if (!prompt || !output) {
    console.error('Usage: node generate-sprite.js "<prompt>" --output <path.png> [--size 512] [--quality low]');
    process.exit(1);
  }

  const { endpoint, key, deployment } = loadCredentials();
  const hostname = endpoint.replace('https://', '');
  const urlPath = `/openai/deployments/${deployment}/images/generations?api-version=${API_VERSION}`;

  console.log(`Generating: "${prompt}"`);
  console.log(`Size: ${size}  Quality: ${quality}  Model: ${deployment}`);

  const res = await httpsPost(hostname, urlPath, { 'api-key': key }, {
    prompt,
    n: 1,
    size,
    quality
  });

  if (res.status !== 200) {
    console.error(`Error ${res.status}: ${res.body.slice(0, 300)}`);
    process.exit(1);
  }

  const parsed = JSON.parse(res.body);
  const item = parsed.data?.[0];

  if (!item) {
    console.error('Unexpected response shape:', res.body.slice(0, 200));
    process.exit(1);
  }

  // Ensure output directory exists
  const outDir = path.dirname(output);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  if (item.b64_json) {
    // Base64 path (preferred — no second request)
    const buf = Buffer.from(item.b64_json, 'base64');
    fs.writeFileSync(output, buf);
  } else if (item.url) {
    // URL path (fallback — fetch then save)
    console.log('Fetching image from URL...');
    const buf = await httpsGetBuffer(item.url);
    fs.writeFileSync(output, buf);
  } else {
    console.error('Response contained neither b64_json nor url');
    process.exit(1);
  }

  const kb = Math.round(fs.statSync(output).size / 1024);
  console.log(`✓ Saved to ${output} (${kb} KB)`);

  if (item.revised_prompt && item.revised_prompt !== prompt) {
    console.log(`  Revised prompt: "${item.revised_prompt}"`);
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
