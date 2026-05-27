#!/usr/bin/env node
// playtest-game.js v1 — runtime sibling to review-game.js, headless Phaser smoke test
// Per Research Log 2026-05-27-playtest-game-headless-phaser.md (Azure synthesis v1)
//
// Runner: Playwright + Chromium. WebGL-first. No clock mocking. Real-time RAF.
// Rules: P01-P08 (P01-P06 BLOCKING, P07-P08 HIGH).
// Composability: JSON output matches review-game.js {tool, version, target, summary, blocking, findings[]}.
//
// Usage: node scripts/playtest-game.js <game-dir> [--url <url>] [--seed <seed>]
//                                                  [--timeout-ms <ms>] [--output <path>]

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const DEFAULTS = {
  url: 'http://localhost:5174',
  seed: 'playtest-v1',
  timeoutMs: 15000,        // total observation window after navigation
  postClickWaitMs: 3000,   // wait after first input attempt
  output: null             // null = stdout only
};

const RULES = {
  P01: { title: 'boot-failure',                severity: 'blocking', autofix: true,  reason: 'Uncaught runtime exception or pageerror during boot / preload / scene create' },
  P02: { title: 'no-scene-reached',            severity: 'blocking', autofix: true,  reason: 'No Phaser scene reached create() state within timeout window' },
  P03: { title: 'asset-load-failure-runtime',  severity: 'blocking', autofix: true,  reason: 'One or more asset requests failed at runtime (404, MIME, case-mismatch, Vite serving)' },
  P04: { title: 'input-dead',                  severity: 'blocking', autofix: true,  reason: 'Canvas pointer/click landed but no observable state change followed (no scene transition, no new events)' },
  P05: { title: 'scene-transition-failure',    severity: 'blocking', autofix: true,  reason: 'Input occurred and a scene transition was expected (target scene declared) but did not complete' },
  P06: { title: 'endless-loading',             severity: 'blocking', autofix: true,  reason: 'No state change of any kind for the full observation window — frozen game' },
  P07: { title: 'console-error-burst',         severity: 'high',     autofix: false, reason: 'Console errors / critical patterns above threshold (TypeError / ReferenceError / "Cannot read properties of undefined")' },
  P08: { title: 'determinism-breach',          severity: 'high',     autofix: true,  reason: 'Game uses Math.random / Date.now patterns despite playtest seed injection (advisory; full replay deferred to v1.1)' }
};

// Console patterns that always count as critical, even below numeric threshold
const CRITICAL_CONSOLE_PATTERNS = [
  /TypeError/i,
  /ReferenceError/i,
  /Cannot read propert(y|ies) of (undefined|null)/i,
  /is not a function/i,
  /Failed to load resource/i,
  /WebGL.*context lost/i
];

const P07_ERROR_COUNT_THRESHOLD = 3;

// ── CLI parsing ───────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url')         args.url = argv[++i];
    else if (a === '--seed')   args.seed = argv[++i];
    else if (a === '--timeout-ms') args.timeoutMs = parseInt(argv[++i], 10);
    else if (a === '--post-click-wait-ms') args.postClickWaitMs = parseInt(argv[++i], 10);
    else if (a === '--output') args.output = argv[++i];
    else if (a === '--help' || a === '-h') { printHelp(); process.exit(0); }
    else args._.push(a);
  }
  return { ...DEFAULTS, ...args };
}

function printHelp() {
  console.log(`playtest-game.js v1 — headless Phaser runtime smoke test

Usage:
  node scripts/playtest-game.js <game-dir> [options]

Options:
  --url <url>                Dev server URL (default: ${DEFAULTS.url})
  --seed <seed>              Seed string for ?seed= query param (default: ${DEFAULTS.seed})
  --timeout-ms <ms>          Total observation window (default: ${DEFAULTS.timeoutMs})
  --post-click-wait-ms <ms>  Wait after first input attempt (default: ${DEFAULTS.postClickWaitMs})
  --output <path>            Write JSON report to file (default: stdout only)

Exit codes:
  0  no blocking findings
  1  one or more blocking findings
  2  CLI / setup error (Playwright launch failed, etc.)
`);
}

// ── Init script injected before any page code runs ────────────────────────────
function buildInitScript(seed) {
  // Returns a string of JS to execute in the browser context before any page script
  return `
    (function() {
      window.__PLAYTEST_SEED = ${JSON.stringify(seed)};
      window.__playtest = {
        sceneEvents: [],
        audioEvents: [],
        inputEvents: [],
        determinism: { mathRandomCalls: 0, dateNowCalls: 0, performanceNowCalls: 0 }
      };

      // Audio mock — record but don't block
      try {
        if (window.AudioBufferSourceNode && window.AudioBufferSourceNode.prototype) {
          const orig = window.AudioBufferSourceNode.prototype.start;
          window.AudioBufferSourceNode.prototype.start = function(...args) {
            window.__playtest.audioEvents.push({ type: 'AudioBufferSourceNode.start', t: performance.now() });
            return orig.apply(this, args);
          };
        }
        if (window.HTMLMediaElement && window.HTMLMediaElement.prototype) {
          const origPlay = window.HTMLMediaElement.prototype.play;
          window.HTMLMediaElement.prototype.play = function(...args) {
            window.__playtest.audioEvents.push({ type: 'HTMLMediaElement.play', src: this.src, t: performance.now() });
            return origPlay.apply(this, args);
          };
        }
      } catch (e) { /* swallow — audio mocking is non-critical */ }

      // Determinism counters — observe but don't replace
      try {
        const origRandom = Math.random.bind(Math);
        Math.random = function() { window.__playtest.determinism.mathRandomCalls++; return origRandom(); };
        const origDateNow = Date.now.bind(Date);
        Date.now = function() { window.__playtest.determinism.dateNowCalls++; return origDateNow(); };
      } catch (e) { /* swallow */ }

      // Phaser scene observer — polls window.game and hooks scene lifecycle
      // Works for Phaser 3 standard scene structure with .scene.key + events emitter
      function installPhaserHook() {
        try {
          const g = window.game;
          if (g && g.scene && Array.isArray(g.scene.scenes)) {
            for (const scene of g.scene.scenes) {
              const key = (scene.scene && scene.scene.key) || scene.sys?.settings?.key || 'unknown';
              const events = scene.events || (scene.sys && scene.sys.events);
              if (events && !events.__playtestHooked) {
                events.__playtestHooked = true;
                ['create', 'start', 'shutdown', 'wake', 'sleep', 'pause', 'resume'].forEach(evt => {
                  events.on(evt, () => {
                    window.__playtest.sceneEvents.push({ scene: key, event: evt, t: performance.now() });
                  });
                });
              }
            }
          }
        } catch (e) { /* swallow — hook installation is best-effort */ }
        setTimeout(installPhaserHook, 250);
      }
      setTimeout(installPhaserHook, 100);
    })();
  `;
}

// ── Main playtest pipeline ────────────────────────────────────────────────────
async function runPlaytest(opts, ctx) {
  const consoleEvents = [];
  const pageErrors = [];
  const failedRequests = [];

  // Launch Chromium with autoplay policy override + software-WebGL flags
  // (headless Chromium lacks GPU framebuffer support; SwiftShader provides
  // software WebGL so Phaser's renderer can initialize without GPU.)
  const browser = await chromium.launch({
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader'
    ],
    headless: true
  });
  ctx.browser = browser;

  const context = await browser.newContext({
    viewport: { width: 1024, height: 768 }
  });
  const page = await context.newPage();

  // Capture browser events
  page.on('console', msg => {
    consoleEvents.push({
      type: msg.type(),
      text: msg.text(),
      t: Date.now()
    });
  });
  page.on('pageerror', err => {
    pageErrors.push({
      message: err.message,
      stack: err.stack ? err.stack.slice(0, 1000) : null,
      t: Date.now()
    });
  });
  page.on('requestfailed', req => {
    failedRequests.push({
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
      failure: req.failure() ? req.failure().errorText : null,
      t: Date.now()
    });
  });
  page.on('response', res => {
    // Track 4xx / 5xx as well (requestfailed only fires for network failures)
    const status = res.status();
    if (status >= 400 && status < 600) {
      failedRequests.push({
        url: res.url(),
        method: res.request().method(),
        resourceType: res.request().resourceType(),
        failure: `HTTP ${status}`,
        t: Date.now()
      });
    }
  });

  // Inject init script BEFORE navigation
  await page.addInitScript(buildInitScript(opts.seed));

  // Navigate with seed query param
  const targetUrl = `${opts.url}${opts.url.includes('?') ? '&' : '?'}seed=${encodeURIComponent(opts.seed)}&playtest=1`;
  const t0 = Date.now();

  try {
    await page.goto(targetUrl, { timeout: opts.timeoutMs, waitUntil: 'load' });
  } catch (e) {
    // Navigation failure is itself a finding
    pageErrors.push({
      message: `Navigation failed: ${e.message}`,
      stack: null,
      t: Date.now(),
      navigation: true
    });
  }

  // Observe for the timeout window — give the game time to boot and self-instrument
  const remaining = Math.max(1000, opts.timeoutMs - (Date.now() - t0));
  await page.waitForTimeout(Math.min(remaining, 8000));

  // Attempt one canvas tap at center (P04 / P05 probe)
  let inputAttempted = false;
  const sceneEventsBeforeClick = await page.evaluate(() => window.__playtest?.sceneEvents?.length ?? 0);
  try {
    const canvas = await page.$('canvas');
    if (canvas) {
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        inputAttempted = true;
        await page.evaluate(() => {
          window.__playtest.inputEvents.push({ type: 'click', target: 'canvas-center', t: performance.now() });
        });
      }
    }
  } catch (e) { /* canvas missing or unclickable — P04 candidate */ }

  // Wait post-click window
  await page.waitForTimeout(opts.postClickWaitMs);

  // Pull final state from the page
  const finalState = await page.evaluate(() => {
    const p = window.__playtest || {};
    return {
      sceneEvents: p.sceneEvents || [],
      audioEvents: p.audioEvents || [],
      inputEvents: p.inputEvents || [],
      determinism: p.determinism || {},
      seed: window.__PLAYTEST_SEED,
      gameExists: !!window.game,
      gameScenesCount: window.game?.scene?.scenes?.length ?? 0,
      // Active scenes via Phaser's own scene manager (fallback if hook didn't install)
      activeScenes: (() => {
        try {
          return (window.game?.scene?.scenes || [])
            .filter(s => s.sys?.settings?.active)
            .map(s => s.scene?.key || s.sys?.settings?.key || 'unknown');
        } catch (e) { return []; }
      })()
    };
  }).catch(() => null);

  const durationMs = Date.now() - t0;
  const sceneEventsAfterClick = finalState?.sceneEvents?.length ?? 0;

  await context.close();
  await browser.close();
  ctx.browser = null;

  return {
    durationMs,
    consoleEvents,
    pageErrors,
    failedRequests,
    finalState: finalState || { sceneEvents: [], audioEvents: [], inputEvents: [], determinism: {}, gameExists: false, gameScenesCount: 0, activeScenes: [] },
    inputAttempted,
    sceneEventsBeforeClick,
    sceneEventsAfterClick
  };
}

// ── Rule evaluation ───────────────────────────────────────────────────────────
function evaluateRules(result) {
  const findings = [];
  const { consoleEvents, pageErrors, failedRequests, finalState, inputAttempted, sceneEventsBeforeClick, sceneEventsAfterClick, durationMs } = result;

  // P01 — boot failure: any pageerror
  if (pageErrors.length > 0) {
    for (const err of pageErrors) {
      findings.push({
        ruleId: 'P01',
        severity: RULES.P01.severity,
        title: RULES.P01.title,
        message: err.navigation
          ? `Page navigation failed: ${err.message}`
          : `Uncaught exception: ${err.message}`,
        evidence: {
          errorText: err.message,
          stack: err.stack,
          t: err.t
        },
        autofixCandidate: RULES.P01.autofix,
        confidence: 0.98,
        corroborates: ['R01', 'R02']
      });
    }
  }

  // P02 — no scene reached create() within window
  const createEvents = (finalState.sceneEvents || []).filter(e => e.event === 'create');
  if (createEvents.length === 0 && finalState.gameExists) {
    findings.push({
      ruleId: 'P02',
      severity: RULES.P02.severity,
      title: RULES.P02.title,
      message: 'No Phaser scene reached create() within observation window. Game object exists but no scene initialized.',
      evidence: {
        gameExists: finalState.gameExists,
        gameScenesCount: finalState.gameScenesCount,
        activeScenes: finalState.activeScenes,
        durationMs
      },
      autofixCandidate: RULES.P02.autofix,
      confidence: 0.92,
      corroborates: []
    });
  } else if (!finalState.gameExists && pageErrors.length === 0) {
    // Game never initialized AND no pageerror — covered by P06 (endless loading) more accurately
  }

  // P03 — asset load failure: failed requests that look game-related
  // Filter out favicon.ico, /vite/ HMR, source maps
  const gameAssetFailures = failedRequests.filter(r => {
    const u = r.url || '';
    if (u.includes('favicon.ico')) return false;
    if (u.includes('/@vite/')) return false;
    if (u.includes('/@react-refresh')) return false;
    if (u.endsWith('.map')) return false;
    return true;
  });
  for (const fail of gameAssetFailures) {
    findings.push({
      ruleId: 'P03',
      severity: RULES.P03.severity,
      title: RULES.P03.title,
      message: `Asset request failed at runtime: ${fail.url}`,
      evidence: {
        url: fail.url,
        method: fail.method,
        resourceType: fail.resourceType,
        failure: fail.failure,
        t: fail.t
      },
      autofixCandidate: RULES.P03.autofix,
      confidence: 0.95,
      corroborates: ['R03', 'R04']
    });
  }

  // P04 — input dead: input was attempted, but no scene event change AND no new audio
  // v1 NOTE: without game-side interactive-target registration (deferred to v1.1),
  // we don't know if the canvas-center click hit an interactive element. So P04 is
  // demoted to ADVISORY when target is unknown — only escalates to BLOCKING in v1.1+
  // when games expose window.__playtest.interactiveTargets.
  if (inputAttempted) {
    const sceneChange = sceneEventsAfterClick > sceneEventsBeforeClick;
    const audioCount = (finalState.audioEvents || []).length;
    if (!sceneChange && audioCount === 0 && createEvents.length > 0) {
      findings.push({
        ruleId: 'P04',
        severity: 'advisory',  // demoted from blocking — target unknown in v1
        title: RULES.P04.title,
        message: 'Canvas click at center landed but no scene transition or audio event followed. INFORMATIONAL — v1 clicks canvas center blindly; may be empty space. Promote to BLOCKING in v1.1 once interactive-target registration ships.',
        evidence: {
          sceneEventsBeforeClick,
          sceneEventsAfterClick,
          audioEvents: audioCount,
          activeScenesAtClick: finalState.activeScenes,
          targetKnown: false
        },
        autofixCandidate: false,  // not safe to autofix without target info
        confidence: 0.35,
        corroborates: []
      });
    }
  }

  // P05 — scene transition failure (v1: advisory; only fires if game declares an expected target via window.__playtest.expectedNextScene)
  // Skipped in v1 — too game-specific. Reserved as ruleId.

  // P06 — endless loading: no state change at all for the full window
  // "No state change" = no scene events AND no console "info" type events AND game doesn't exist after timeout
  const hasNoActivity = (
    (finalState.sceneEvents || []).length === 0 &&
    (finalState.audioEvents || []).length === 0 &&
    !finalState.gameExists &&
    pageErrors.length === 0
  );
  if (hasNoActivity) {
    findings.push({
      ruleId: 'P06',
      severity: RULES.P06.severity,
      title: RULES.P06.title,
      message: 'No observable state change for entire observation window — game appears frozen or never initialized window.game.',
      evidence: {
        durationMs,
        consoleEventCount: consoleEvents.length,
        gameExists: finalState.gameExists
      },
      autofixCandidate: RULES.P06.autofix,
      confidence: 0.85,
      corroborates: []
    });
  }

  // P07 — console error burst
  const errorEvents = consoleEvents.filter(e => e.type === 'error' || e.type === 'warning');
  const criticalEvents = errorEvents.filter(e =>
    CRITICAL_CONSOLE_PATTERNS.some(p => p.test(e.text))
  );
  if (criticalEvents.length > 0 || errorEvents.length >= P07_ERROR_COUNT_THRESHOLD) {
    findings.push({
      ruleId: 'P07',
      severity: RULES.P07.severity,
      title: RULES.P07.title,
      message: `Console error burst: ${errorEvents.length} errors/warnings total (${criticalEvents.length} critical pattern matches)`,
      evidence: {
        errorCount: errorEvents.length,
        criticalCount: criticalEvents.length,
        samples: errorEvents.slice(0, 5).map(e => ({ type: e.type, text: e.text.slice(0, 300) }))
      },
      autofixCandidate: RULES.P07.autofix,
      confidence: criticalEvents.length > 0 ? 0.90 : 0.65,
      corroborates: []
    });
  }

  // P08 — determinism observation: Math.random or Date.now called despite seed injection
  // v1 is informational — without replay comparison (v1.1+) we can only observe, not verify breach
  const determinism = finalState.determinism || {};
  if ((determinism.mathRandomCalls || 0) > 5 || (determinism.dateNowCalls || 0) > 50) {
    findings.push({
      ruleId: 'P08',
      severity: 'advisory',  // demoted from high — observation only without replay
      title: RULES.P08.title,
      message: `INFORMATIONAL: Game called Math.random ${determinism.mathRandomCalls || 0}× and Date.now ${determinism.dateNowCalls || 0}× despite seed='${finalState.seed}'. Full determinism verification requires replay comparison (v1.1+).`,
      evidence: {
        mathRandomCalls: determinism.mathRandomCalls || 0,
        dateNowCalls: determinism.dateNowCalls || 0,
        performanceNowCalls: determinism.performanceNowCalls || 0,
        seedUsed: finalState.seed
      },
      autofixCandidate: RULES.P08.autofix,
      confidence: 0.70,
      corroborates: []
    });
  }

  return findings;
}

// ── Output ────────────────────────────────────────────────────────────────────
function buildReport(gameDir, opts, result, findings) {
  const blockingCount = findings.filter(f => f.severity === 'blocking').length;
  const highCount     = findings.filter(f => f.severity === 'high').length;
  const advisoryCount = findings.filter(f => f.severity !== 'blocking' && f.severity !== 'high').length;

  return {
    tool: 'playtest-game',
    version: '1',
    target: {
      gameDir: path.resolve(gameDir),
      url: opts.url,
      seed: opts.seed
    },
    summary: {
      passed: blockingCount === 0 && highCount === 0,
      findingCount: findings.length,
      blockingCount,
      highCount,
      advisoryCount,
      scenesVisited: [...new Set((result.finalState.sceneEvents || []).map(e => e.scene))],
      activeScenesAtEnd: result.finalState.activeScenes || [],
      durationMs: result.durationMs,
      consoleEventCount: result.consoleEvents.length,
      pageErrorCount: result.pageErrors.length,
      failedRequestCount: result.failedRequests.length
    },
    blocking: blockingCount > 0,
    findings,
    rules: Object.fromEntries(Object.entries(RULES).map(([id, r]) => [id, { title: r.title, severity: r.severity, autofix: r.autofix }]))
  };
}

function printAsciiSummary(report) {
  const { summary, findings } = report;
  const verdict = summary.passed ? '✓ PASS' : (report.blocking ? '✗ BLOCKING' : '⚠ HIGH-ONLY');
  console.log('');
  console.log(`playtest-game.js v${report.version} — ${verdict}`);
  console.log(`  game:      ${report.target.gameDir}`);
  console.log(`  url:       ${report.target.url}`);
  console.log(`  seed:      ${report.target.seed}`);
  console.log(`  duration:  ${(summary.durationMs / 1000).toFixed(1)}s`);
  console.log(`  scenes:    ${summary.scenesVisited.join(', ') || '(none)'}`);
  console.log(`  active:    ${summary.activeScenesAtEnd.join(', ') || '(none)'}`);
  console.log(`  findings:  ${summary.findingCount} (${summary.blockingCount} blocking, ${summary.highCount} high)`);
  console.log(`  console:   ${summary.consoleEventCount} events, ${summary.pageErrorCount} pageerrors, ${summary.failedRequestCount} failed requests`);
  console.log('');
  if (findings.length > 0) {
    console.log('findings:');
    for (const f of findings) {
      const sev = f.severity === 'blocking' ? '[BLOCK]' : f.severity === 'high' ? '[HIGH ]' : '[INFO ]';
      console.log(`  ${sev} ${f.ruleId} ${f.title} — ${f.message}`);
    }
    console.log('');
  }
}

// ── Entrypoint ────────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs(process.argv);
  if (opts._.length === 0) {
    console.error('Error: <game-dir> argument required');
    printHelp();
    process.exit(2);
  }
  const gameDir = opts._[0];
  if (!fs.existsSync(gameDir)) {
    console.error(`Error: game-dir does not exist: ${gameDir}`);
    process.exit(2);
  }

  const ctx = { browser: null };
  let report;
  try {
    const result = await runPlaytest(opts, ctx);
    const findings = evaluateRules(result);
    report = buildReport(gameDir, opts, result, findings);
  } catch (e) {
    console.error(`playtest-game.js: harness error — ${e.message}`);
    if (ctx.browser) { try { await ctx.browser.close(); } catch (_) {} }
    process.exit(2);
  }

  if (opts.output) {
    fs.writeFileSync(opts.output, JSON.stringify(report, null, 2), 'utf8');
  } else {
    console.log(JSON.stringify(report, null, 2));
  }
  printAsciiSummary(report);

  process.exit(report.blocking ? 1 : 0);
}

main().catch(e => {
  console.error(`Fatal: ${e.message}`);
  console.error(e.stack);
  process.exit(2);
});