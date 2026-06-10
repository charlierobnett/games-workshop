// generate-research-log.mjs — emits the kids' weekly game-research instrument.
//
// Produces `research/Game Research Log.xlsx` with four tabs:
//   • How To Use  • Kid_Log_Jack  • Kid_Log_Nola  • Weekend_Synthesis
//
// SCHEMA SOURCE (v1.1, 2026-06-08): the Azure synthesis of the kid-game-testing
// documentation-method research sprint
// (AI-OS/05_LOGS/pushes/2026-06-08-kid-game-testing-documentation-method.md §3).
// The research REJECTED the v1 nine-aspect grid (homework energy / satisficing for
// two kids) in favor of a MOMENT + session-WRAP capture model: kids log in-the-moment
// reactions + an end-of-session wrap; the adult aspect taxonomy lives ONLY in the
// weekend-synthesis tab, where it maps to spec contracts (RS/MP/EQ/PG/OD/GF).
// Re-run this script if the schema changes. Usage: node scripts/generate-research-log.mjs

import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'research');
const OUT_FILE = path.join(OUT_DIR, 'Game Research Log.xlsx');

const C = {
  panel: 'FF103A2B', dark: 'FF0A0A0A', cyan: 'FF2EF2FF', lime: 'FF7BFF00',
  magenta: 'FFFF2D55', gold: 'FFFFE066', ink: 'FFEAF6F1', white: 'FFFFFFFF', row: 'FF0D2B20'
};

const SYSTEMS = ['NES', 'SNES', 'Genesis', 'Game Boy', 'Prototype-PC', 'Prototype-Web', 'Other'];
const SYN_ASPECTS = ['Start / Hub / Menus', 'Controls & Movement', 'Progression & Rewards',
  'Core Mechanic', 'Level Design', 'Power-ups / Items', 'Game Feel / Juice', 'Fairness',
  'Aesthetics / Audio / Theme', 'Boss / Overdrive', 'Social / Competitive'];
const CHANGE_TYPES = ['Tune existing parameter', 'Add new rule', 'Remove annoyance',
  'Steal reference pattern', 'Prototype experiment', 'Needs observation first'];

// Per-kid capture columns (the moment/wrap model — synthesis §3a, verbatim).
const KID_COLS = [
  { k: 'EntryID', w: 11 },
  { k: 'Kid', w: 8, list: ['Jack', 'Nola'] },
  { k: 'Week', w: 11, note: 'format YYYY-Www, e.g. 2026-W24' },
  { k: 'Date', w: 12 },
  { k: 'SessionID', w: 11 },
  { k: 'EntryType', w: 11, list: ['Moment', 'Wrap'], note: 'A Moment = something that hit you mid-play. A Wrap = your end-of-session summary.' },
  { k: 'Game', w: 22 },
  { k: 'BuildType', w: 12, list: ['Retro', 'Prototype'] },
  { k: 'System', w: 14, list: SYSTEMS },
  { k: 'MinutesPlayed', w: 9, num: true, note: 'Session minutes (Wrap rows). Moment rows may be blank.' },
  { k: 'MomentOrder', w: 9, num: true, note: 'Order within the session (Moment rows). Wrap rows may be blank.' },
  { k: 'WhereInGame', w: 22, note: 'short phrase, e.g. "ice cave boss", "level 2 jump"' },
  { k: 'Reaction', w: 13, list: ['Loved it', 'Okay', 'Frustrating'], note: 'Moment rows' },
  { k: 'OracleVerdict', w: 13, list: ['Fix this', 'Steal this', 'New idea'], note: 'Moment rows' },
  { k: 'RetryDesire', w: 18, list: ['Quit playing', 'Try again immediately', 'N/A'], note: 'Did you want to keep going?' },
  { k: 'WhatHappened', w: 30, note: 'one sentence' },
  { k: 'WhyItFeltThatWay', w: 30, note: 'one sentence; may be blank' },
  { k: 'ClipOrPhotoRef', w: 16, note: 'optional filename / url / screenshot path' },
  { k: 'OverallFun', w: 9, list: ['1', '2', '3', '4', '5'], note: 'WRAP rows only. 1 = boring, 5 = couldn\'t stop.' },
  { k: 'PlayAgainDesire', w: 13, list: ['No', 'Maybe', 'Yes'], note: 'WRAP rows only' },
  { k: 'BestMoment', w: 24, note: 'WRAP rows only' },
  { k: 'WorstMoment', w: 24, note: 'WRAP rows only' },
  { k: 'OneThingToSteal', w: 28, note: 'WRAP rows only — the single best idea for OUR game' },
  { k: 'OneThingThatRuinedIt', w: 28, note: 'WRAP rows only — the single most annoying thing' },
  { k: 'FreeNotes', w: 28 }
];

// Weekend-synthesis columns (synthesis §3b, verbatim).
const SYN_COLS = [
  { k: 'Week', w: 11, note: 'format YYYY-Www' },
  { k: 'PriorityRank', w: 11, num: true, note: '1 = highest priority' },
  { k: 'Theme', w: 20 },
  { k: 'SourceEntryIDs', w: 18, note: 'comma-separated EntryID list from the kid tabs' },
  { k: 'KidsInvolved', w: 14, multi: ['Jack', 'Nola'] },
  { k: 'AgreementType', w: 16, list: ['Both same', 'Disagreement', 'Single-kid only'] },
  { k: 'ObservedSymptom', w: 28, note: 'what happened, in player language' },
  { k: 'RootCauseHypothesis', w: 28, note: 'inferred cause after discussion' },
  { k: 'SynthesisAspect', w: 22, list: SYN_ASPECTS },
  { k: 'MapsToContract', w: 16, multi: ['RS', 'MP', 'EQ', 'PG', 'OD', 'GF'] },
  { k: 'ChangeType', w: 22, list: CHANGE_TYPES },
  { k: 'ProposedChange', w: 30, note: 'concrete spec delta' },
  { k: 'ExpectedPlayerEffect', w: 26, note: 'what should feel different next build' },
  { k: 'OwnerCredit', w: 16, list: ['Jack', 'Nola', 'Both', 'Charlie synthesis'], note: 'who gets credit — close the loop so kids see their note shipped' },
  { k: 'Status', w: 12, list: ['Proposed', 'Planned', 'Shipped', 'Rejected', 'Deferred'] },
  { k: 'BuildTarget', w: 14, note: 'build id / version' },
  { k: 'ShipCheckResult', w: 22, note: 'what happened when retested' },
  { k: 'FollowupNeeded', w: 12, list: ['No', 'Yes'] }
];

function listDV(values, prompt, strict = false) {
  return {
    type: 'list', allowBlank: true, formulae: [`"${values.join(',')}"`],
    showErrorMessage: true, errorStyle: strict ? 'stop' : 'warning',
    error: prompt || (strict ? 'Pick from the list' : 'Pick one — or type several separated by commas')
  };
}

function styleHeader(ws, rowNum, bg, fg) {
  const row = ws.getRow(rowNum);
  row.height = 30;
  row.eachCell((cell) => {
    cell.font = { name: 'Consolas', bold: true, color: { argb: fg }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: C.dark } } };
  });
}

function buildColumnarTab(wb, tabName, accent, cols, title, examples, lastRow) {
  const ws = wb.addWorksheet(tabName, {
    properties: { tabColor: { argb: accent } },
    views: [{ state: 'frozen', ySplit: 2, xSplit: 1 }]
  });

  ws.mergeCells(1, 1, 1, cols.length);
  const t = ws.getCell(1, 1);
  t.value = title;
  t.font = { name: 'Consolas', bold: true, size: 12, color: { argb: accent } };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.dark } };
  t.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 28;

  cols.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.w;
    const hc = ws.getCell(2, i + 1);
    hc.value = c.k;
    if (c.note) hc.note = c.note;
  });
  styleHeader(ws, 2, accent, C.dark);

  // example rows (italic gold), starting row 3
  examples.forEach((rowVals, r) => {
    const row = ws.getRow(3 + r);
    rowVals.forEach((v, i) => { if (v !== null && v !== undefined && v !== '') row.getCell(i + 1).value = v; });
    row.eachCell((cell) => {
      cell.font = { name: 'Consolas', italic: true, size: 9, color: { argb: C.gold } };
      cell.alignment = { vertical: 'top', wrapText: true };
    });
  });
  if (examples.length) ws.getCell(3, 1).note = 'EXAMPLE rows (in gold) — start your real entries below them.';

  // validations + striping for all data rows
  for (let r = 3; r <= lastRow; r++) {
    cols.forEach((c, i) => {
      const cell = ws.getCell(r, i + 1);
      if (c.list) cell.dataValidation = listDV(c.list, c.note, false);
      else if (c.multi) cell.dataValidation = listDV(c.multi, 'Pick one — or type several separated by commas', false);
      if (r > 2 + examples.length) {
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.font = { name: 'Consolas', size: 9, color: { argb: C.ink } };
        if (r % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.row } };
      }
    });
  }
  return ws;
}

function buildLegendTab(wb) {
  const ws = wb.addWorksheet('How To Use', { properties: { tabColor: { argb: C.cyan } } });
  ws.getColumn(1).width = 24; ws.getColumn(2).width = 92;
  const rows = [
    ['🎮 OLYMPIAN OVERDRIVE — GAME RESEARCH LOG', ''],
    ['', ''],
    ['Your mission', 'Play retro games (NES / SNES / Genesis / Game Boy) and our prototype builds. Catch the MOMENTS that make you feel something — excited, frustrated, bored — and log them. Every moment you log makes OUR game better. You are the fun detectives.'],
    ['Two kinds of entry', 'On your tab you write two kinds of rows:'],
    ['  • MOMENT', 'Something that just hit you while playing — a great power-up, a cheap death, a boring stretch. Log it right then (or right after). Set EntryType = Moment.'],
    ['  • WRAP', 'A short summary at the END of a play session: how fun overall (1-5), would you play again, your best + worst moment, the ONE thing to steal, the ONE thing that ruined it. Set EntryType = Wrap. One Wrap per session.'],
    ['The golden rule', 'Catch it in the MOMENT. Don\'t wait until the end and try to remember — you\'ll only remember the last thing. A quick moment row beats a perfect paragraph later.'],
    ['The fun scale (Wrap)', '1 = boring · 2 = meh · 3 = okay · 4 = really good · 5 = couldn\'t stop playing'],
    ['The two BIG answers (Wrap)', 'ONE thing to STEAL for our game, and ONE thing that RUINED it. These drive the biggest changes.'],
    ['You don\'t fill every box', 'Moment rows need just a few boxes (what happened, reaction, where). Wrap rows fill the summary boxes. Blank is fine.'],
    ['', ''],
    ['The weekly rhythm', 'Play + log during the week → each weekend we regroup, the AI reads BOTH your logs, finds patterns, and proposes real changes on the Weekend_Synthesis tab. Then a new build to test.'],
    ['You get the credit', 'On the synthesis tab there\'s an "OwnerCredit" column — when your note becomes a real change in the game, your name goes on it. You\'ll SEE your ideas ship.'],
    ['Version', 'v1.1 (2026-06-08) — designed from a research sprint on how kids best capture game-testing. If a box feels useless or one\'s missing, tell us — the sheet improves too.']
  ];
  rows.forEach((r, i) => { ws.addRow(r); ws.getRow(i + 1).alignment = { vertical: 'top', wrapText: true }; });
  ws.getCell(1, 1).font = { name: 'Consolas', bold: true, size: 15, color: { argb: C.cyan } };
  ws.mergeCells(1, 1, 1, 2);
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const a = row.getCell(1);
    a.font = { name: 'Consolas', bold: true, size: 10, color: { argb: a.value && String(a.value).startsWith('  •') ? C.gold : C.lime } };
  });
  return ws;
}

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Robnett Game Studio (humans + Hobbes)';
  wb.created = new Date();

  buildLegendTab(wb);

  // Jack examples: one Moment + one Wrap (Super Mario World)
  const jackEx = [
    ['J-001', 'Jack', '2026-W24', '2026-06-10', 'J-S1', 'Moment', 'Super Mario World', 'Retro', 'SNES',
      '', 1, 'first cape flight', 'Loved it', 'Steal this', 'Try again immediately',
      'Caught the cape and flew over the whole level', 'Felt powerful and free', '', '', '', '', '', '', '', ''],
    ['J-002', 'Jack', '2026-W24', '2026-06-10', 'J-S1', 'Wrap', 'Super Mario World', 'Retro', 'SNES',
      45, '', '', '', '', '', '', '', '', '5', 'Yes', 'Flying with the cape', 'The lava level was tricky',
      'A power-up that totally changes how you move', 'Nothing really ruined it', 'Best platformer feel ever']
  ];
  // Nola examples: one Moment + one Wrap (A Link to the Past)
  const nolaEx = [
    ['N-001', 'Nola', '2026-W24', '2026-06-10', 'N-S1', 'Moment', 'Zelda: A Link to the Past', 'Retro', 'SNES',
      '', 1, 'got the hookshot', 'Loved it', 'Steal this', 'Try again immediately',
      'The hookshot opened a whole new area I couldn\'t reach before', 'Felt like a reward that changed the map', '', '', '', '', '', '', '', ''],
    ['N-002', 'Nola', '2026-W24', '2026-06-10', 'N-S1', 'Wrap', 'Zelda: A Link to the Past', 'Retro', 'SNES',
      70, '', '', '', '', '', '', '', '', '5', 'Yes', 'Unlocking new areas with items', 'Got lost in a dungeon with no map',
      'Items that unlock new parts of the world', 'Confusing dungeons with no map', 'Want our progression to feel like this']
  ];

  buildColumnarTab(wb, 'Kid_Log_Jack', C.cyan,
    KID_COLS, '🎮 JACK — log MOMENTS as they happen + one WRAP per session', jackEx, 200);
  buildColumnarTab(wb, 'Kid_Log_Nola', C.magenta,
    KID_COLS, '🎮 NOLA — log MOMENTS as they happen + one WRAP per session', nolaEx, 200);

  const synEx = [
    ['2026-W24', 1, 'Losing felt cheap', 'J-014, N-009', 'Jack, Nola', 'Both same',
      'Both quit after a run with no reward', 'A wiped run gives ~nothing, feels like wasted time',
      'Fairness', 'MP, GF', 'Add new rule', 'Guaranteed reward on every loss (minimum payout floor)',
      'A loss still fills a bar — feels like progress, not punishment', 'Both', 'Planned', 'spike-v2', '', 'Yes']
  ];
  buildColumnarTab(wb, 'Weekend_Synthesis', C.gold,
    SYN_COLS, '🛋️ WEEKEND SYNTHESIS — turn the kids\' moments into real game changes', synEx, 120);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  await wb.xlsx.writeFile(OUT_FILE);
  console.log(`✓ wrote ${OUT_FILE}`);
  console.log(`  tabs: How To Use · Kid_Log_Jack · Kid_Log_Nola · Weekend_Synthesis`);
  console.log(`  schema v1.1 — moment/wrap capture model (research-synthesized 2026-06-08).`);
}

main().catch((e) => { console.error('generate-research-log failed:', e.message); process.exit(1); });