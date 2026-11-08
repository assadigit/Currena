/**
 * pd-s10-backtest.ts — the S10 §21 diff, LIVE (spec §21's
 * verdict-consistency rule applied to the USA page's tiers 3–6: the
 * 72-card trio coverage + the tier-6 TIC board diff — "page-rendered
 * values must match engine values byte-for-byte").
 *
 * A MANUAL script, never part of the test suite (tests never hit live
 * sites — AGENTS.md rule 7; the pd-s4/pd-s5/pd-s7/pd-s8/pd-s9-backtest
 * pattern). Every number below comes from THIS run.
 *
 * What it does, over the LIVE public feed:
 *
 *   1. Fetches the FOUR feeds the comparison reads:
 *        GET /api/insights              — the served snapshot (the ENGINE
 *                                         side's own document)
 *        GET /api/insights/pages/usa    — the USA projection (the PAGE
 *                                         side: the strip + the 5 tiers)
 *        GET /api/insights/pages/global — the Global projection (the
 *                                         GLOBAL side: D-30's literal
 *                                         contract)
 *        GET /api/insights/tic          — the TIC board (twice: the page
 *                                         copy + the engine copy, two
 *                                         HTTP payloads of the one
 *                                         stored document)
 *      and proves the three projection documents are one snapshot
 *      (generatedAt alignment).
 *
 *   2. Runs the pure comparison core (usa-backtest-core.ts): every gauge
 *      voter present on all three feeds, every gauge's verdict page ≡
 *      Global ≡ engine, every one of the 72 tier cards' §21 trio inputs
 *      byte-identical between the projection and the snapshot, and the
 *      TIC board diff (structure · payload equality · the aggregates'
 *      own arithmetic · every holder's derived row ≡ the restated
 *      arithmetic · the custody-hub set · the staleness verdict).
 *
 *   3. The tier membership's live sanity: the placement's five /usa
 *      groups (7/19/12/17/17) + the TIC board all carried.
 *
 *   4. The freshness audit vs cadence grace: every tier card's asOf age
 *      checked against the registry's own maxAgeDays (the data audit's
 *      §21 leg — a card beyond its grace is RED, the engine's own stale
 *      status is the page's honest word).
 *
 * Writes NOTHING (no KV, no repo file). Read-only.
 *
 * Usage (from the repo root):
 *   pnpm --filter @currena/web exec tsx ../../apps/web/scripts/pd-s10-backtest.ts \
 *     [--base https://currena.ir]
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { InsightsSnapshotSchema, PageProjectionSchema, TicSnapshotSchema } from '@currena/core';
import type { PageProjection, TicSnapshot } from '@currena/core';
import { pageGroupIds } from '@currena/insights/page-division';
import { backtestUsaPage, backtestUsaTicBoard, USA_BACKTEST_CARD_IDS, TIC_EXPECTED_HOLDERS } from '../src/routes/page-division/usa-backtest-core';

const BASE = (() => {
  const i = process.argv.indexOf('--base');
  return i >= 0 ? (process.argv[i + 1] ?? 'https://currena.ir') : 'https://currena.ir';
})();

let failures = 0;
const notes: string[] = [];

function check(label: string, ok: boolean, detail: string): void {
  console.log(`  ${ok ? '✓' : '✗'} ${label}: ${detail}`);
  if (!ok) failures++;
}

async function getJson<T>(path: string, schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { message: string } } }, what: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json', 'user-agent': 'CurrenaDashboard/1.0 (pd-s10-backtest)' } });
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status} from ${path}`);
  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) throw new Error(`${what}: contract violation — ${parsed.error.message.slice(0, 200)}`);
  return parsed.data;
}

/** The generated indicator registry (cadence + maxAgeDays per id) — the
 *  freshness audit's own basis, read from the repo's generated file. */
function registryMaxAge(): Map<string, { cadence: string; maxAgeDays: number | null }> {
  const here = dirname(fileURLToPath(import.meta.url));
  const registry = JSON.parse(readFileSync(resolve(here, '../../../data/indicators.json'), 'utf8')) as {
    indicators: { id: string; cadence: string; maxAgeDays: number | null }[];
  };
  return new Map(registry.indicators.map((i) => [i.id, { cadence: i.cadence, maxAgeDays: i.maxAgeDays }]));
}

async function main(): Promise<void> {
  console.log(`# PD-S10 §21 diff (the USA tiers 3–6 + the TIC board) — ${new Date().toISOString()}`);
  console.log(`# base: ${BASE}\n`);

  /* ---------- 1. The four feeds ---------- */
  console.log('## 1. The live feeds (one snapshot, four documents)');

  const snapshot = await getJson('/api/insights', InsightsSnapshotSchema, 'the served snapshot');
  const usa = await getJson('/api/insights/pages/usa', PageProjectionSchema, 'the USA projection');
  const global = await getJson('/api/insights/pages/global', PageProjectionSchema, 'the Global projection');
  const ticPage = await getJson('/api/insights/tic', TicSnapshotSchema, 'the TIC board (page copy)');
  const ticEngine: TicSnapshot = await getJson('/api/insights/tic', TicSnapshotSchema, 'the TIC board (engine copy)');

  check(
    'the three projection documents derive from ONE snapshot (generatedAt aligned)',
    snapshot.generatedAt === usa.generatedAt && usa.generatedAt === global.generatedAt,
    `snapshot ${snapshot.generatedAt} · usa ${usa.generatedAt} · global ${global.generatedAt}`,
  );
  check(
    'the USA projection carries its honest absentIds report',
    usa.absentIds.every((id) => !usa.readings.some((r) => (r.id as string) === id)),
    `${usa.absentIds.length} absent · ${usa.readings.length} readings · boards ${usa.boards.join('+')}`,
  );
  check(
    'the USA projection declares the TIC board (the placement §14 contract)',
    (usa.boards as readonly string[]).includes('tic'),
    `boards: ${usa.boards.join(' + ')}`,
  );

  /* ---------- 2. The §21 diff (zero tolerance) ---------- */
  console.log('\n## 2. The page ≡ Global ≡ engine comparison (§21 zero tolerance)');

  const result = backtestUsaPage(usa.readings, global.readings, snapshot.readings);
  for (const c of result.checks) {
    console.log(`  ${c.ok ? '✓' : '✗'} ${c.label}: ${c.detail}${c.note !== undefined ? ` — ${c.note}` : ''}`);
    if (!c.ok) failures++;
  }
  console.log(`  — ${result.checks.length} checks · ${result.green} green · ${result.red} red`);

  /* ---------- 3. The tier-6 TIC board diff ---------- */
  console.log('\n## 3. The tier-6 TIC board: page ≡ engine, the derived rows ≡ the restated arithmetic');

  const ticResult = backtestUsaTicBoard(ticPage, ticEngine);
  for (const c of ticResult.checks) {
    console.log(`  ${c.ok ? '✓' : '✗'} ${c.label}: ${c.detail}`);
    if (!c.ok) failures++;
  }
  console.log(`  — ${ticResult.checks.length} checks · ${ticResult.green} green · ${ticResult.red} red`);
  notes.push(
    `TIC dataMonth ${ticPage.dataMonth} · released ${ticPage.releasedAt ?? '—'} · ${ticPage.holders.length}/${TIC_EXPECTED_HOLDERS} holders · total $${ticPage.totalBn}bn`,
  );

  /* ---------- 4. The tier membership's live sanity ---------- */
  console.log('\n## 4. The placement groups vs the served projection');

  const groups: readonly (readonly string[])[] = [
    pageGroupIds('usa', 'tier-1-world-watches'),
    pageGroupIds('usa', 'tier-2-rates-fed'),
    pageGroupIds('usa', 'tier-3-inflation'),
    pageGroupIds('usa', 'tier-4-labor-growth'),
    pageGroupIds('usa', 'tier-5-liquidity-stress-valuation'),
  ];
  const seated = new Set(usa.readings.map((r) => (r.id as string)));
  const groupNames = ['tier-1 (7)', 'tier-2 (19)', 'tier-3 (12)', 'tier-4 (17)', 'tier-5 (17)'];
  groups.forEach((ids, i) => {
    const missing = ids.filter((id) => !seated.has(id));
    check(
      `${groupNames[i]} seats ${ids.length} ids, all carried by the projection`,
      missing.length === 0,
      missing.length === 0 ? `${ids.length}/${ids.length} present` : `missing: ${missing.join(', ')}`,
    );
  });
  const allCards = USA_BACKTEST_CARD_IDS.filter((id) => !seated.has(id));
  check(
    'every USA registry card (the 72) is carried by the projection',
    allCards.length === 0,
    allCards.length === 0 ? '72/72 present' : `missing: ${allCards.join(', ')}`,
  );

  /* ---------- 5. The freshness audit vs cadence grace ---------- */
  console.log('\n## 5. Freshness within cadence grace (the registry\'s own maxAgeDays)');

  const registry = registryMaxAge();
  const now = Date.now();
  let withinGrace = 0;
  const beyond: string[] = [];
  const byId = new Map(usa.readings.map((r) => [r.id as string, r]));
  for (const id of USA_BACKTEST_CARD_IDS as readonly string[]) {
    const r = byId.get(id);
    if (r === undefined) continue; // the honest absent twin, reported above
    const meta = registry.get(id);
    if (meta === undefined || meta.maxAgeDays === null || r.asOf === null) continue;
    const ageDays = Math.floor((now - Date.parse(`${r.asOf}T00:00:00Z`)) / 86_400_000);
    if (ageDays <= meta.maxAgeDays) {
      withinGrace += 1;
    } else {
      beyond.push(`${id} ${ageDays}d > ${meta.maxAgeDays}d (${meta.cadence}, status ${r.status})`);
    }
  }
  check(
    `every seated tier card's asOf is within its cadence grace (or honestly stale-flagged by the engine)`,
    beyond.length === 0 || beyond.every((b) => b.includes('status stale')),
    beyond.length === 0 ? `${withinGrace} cards within grace` : `${withinGrace} within · beyond-grace: ${beyond.join(' · ')}`,
  );
  if (beyond.length > 0) {
    const honest = beyond.filter((b) => b.includes('status stale'));
    notes.push(`${beyond.length} card(s) beyond grace — ${honest.length} honestly carrying the engine's stale status; the rest are the cadence audit's findings`);
  }

  /* ---------- the one-screen summary ---------- */
  console.log(`\n# ${failures === 0 ? 'ALL CHECKS GREEN' : `${failures} FAILURE(S) — RED, fix or roll back (never pass forward)`}`);
  if (notes.length > 0) {
    console.log('# notes (honest observations, none failing):');
    for (const n of notes) console.log(`  · ${n}`);
  }
  process.exitCode = failures === 0 ? 0 : 1;
}

await main();
