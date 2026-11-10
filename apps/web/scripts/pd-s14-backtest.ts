/**
 * pd-s14-backtest.ts — the S14 §21 diff, LIVE (spec §21's
 * verdict-consistency rule applied to the Asia & Pacific page's 14
 * placed cards — the three §15 D-36 CPI fills landed in the S25 fill
 * session, BD-S23a: the trio coverage + the freshness audit — "page-
 * rendered values must match engine values byte-for-byte").
 *
 * A MANUAL script, never part of the test suite (tests never hit live
 * sites — AGENTS.md rule 7; the pd-s4/pd-s5/pd-s7/pd-s8/pd-s9/pd-s10/
 * pd-s12 pattern). Every number below comes from THIS run.
 *
 * What it does, over the LIVE public feed:
 *
 *   1. Fetches the TWO feeds the comparison reads:
 *        GET /api/insights                   — the served snapshot (the ENGINE
 *                                              side's own document)
 *        GET /api/insights/pages/asia-pacific — the Asia projection (the PAGE
 *                                              side: the China + Japan +
 *                                              Korea/Taiwan/HK + India +
 *                                              Pacific-NZ sections — every
 *                                              section carries its registry
 *                                              cards since the S25 fills)
 *      and proves the two documents derive from one snapshot
 *      (generatedAt alignment) + the projection's honest absentIds.
 *
 *   2. Runs the pure comparison core (asia-backtest-core.ts): every
 *      one of the 14 cards' §21 trio inputs byte-identical between the
 *      projection and the snapshot.
 *
 *   3. The section membership's live sanity: the placement's five
 *      groups (china 7 / japan 3 / korea-taiwan-hk 1 / india 1 /
 *      pacific-nz 2) all carried.
 *
 *   4. The freshness audit vs cadence grace (S11's pure auditUsaFreshness,
 *      reused with ASIA_CARD_IDS): every card's asOf age checked against
 *      the registry's own maxAgeDays (the data audit's §21 leg — a card
 *      beyond its grace is RED, the engine's own stale status is the
 *      page's honest word; india-cpi's 150-day grace covers the IMF
 *      mirror's measured 1–3-month lag — BD-S23a).
 *
 * Writes NOTHING (no KV, no repo file). Read-only.
 *
 * Usage (from the repo root):
 *   pnpm --filter @currena/web exec tsx ../../apps/web/scripts/pd-s14-backtest.ts \
 *     [--base https://currena.ir]
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { InsightsSnapshotSchema, PageProjectionSchema } from '@currena/core';
import { pageGroupIds } from '@currena/insights/page-division';
import { auditUsaFreshness, backtestAsiaPage, ASIA_BACKTEST_CARD_IDS, type FreshnessRegistryEntry } from '../src/routes/page-division/asia-backtest-core';

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
  const res = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json', 'user-agent': 'CurrenaDashboard/1.0 (pd-s14-backtest)' } });
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status} from ${path}`);
  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) throw new Error(`${what}: contract violation — ${parsed.error.message.slice(0, 200)}`);
  return parsed.data;
}

/** The generated indicator registry (cadence + maxAgeDays per id) — the
 *  freshness audit's own basis, read from the repo's generated file. */
function registryMaxAge(): Map<string, FreshnessRegistryEntry> {
  const here = dirname(fileURLToPath(import.meta.url));
  const registry = JSON.parse(readFileSync(resolve(here, '../../../data/indicators.json'), 'utf8')) as {
    indicators: { id: string; cadence: string; maxAgeDays: number | null }[];
  };
  return new Map(registry.indicators.map((i) => [i.id, { cadence: i.cadence, maxAgeDays: i.maxAgeDays }]));
}

async function main(): Promise<void> {
  console.log(`# PD-S14 §21 diff (the Asia & Pacific page's 14 placed cards — the S25 CPI fills landed) — ${new Date().toISOString()}`);
  console.log(`# base: ${BASE}\n`);

  /* ---------- 1. The two feeds ---------- */
  console.log('## 1. The live feeds (one snapshot, two documents)');

  const snapshot = await getJson('/api/insights', InsightsSnapshotSchema, 'the served snapshot');
  const asia = await getJson('/api/insights/pages/asia-pacific', PageProjectionSchema, 'the Asia projection');

  check(
    'the two documents derive from ONE snapshot (generatedAt aligned)',
    snapshot.generatedAt === asia.generatedAt,
    `snapshot ${snapshot.generatedAt} · asia ${asia.generatedAt}`,
  );
  check(
    'the Asia projection carries its honest absentIds report',
    asia.absentIds.every((id) => !asia.readings.some((r) => (r.id as string) === id)),
    `${asia.absentIds.length} absent · ${asia.readings.length} readings · boards ${asia.boards.join('+')}`,
  );
  check(
    'the Asia projection declares the markets board (the placement §14 contract — the zoom)',
    (asia.boards as readonly string[]).includes('markets'),
    `boards: ${asia.boards.join(' + ')}`,
  );

  /* ---------- 2. The §21 diff (zero tolerance) ---------- */
  console.log('\n## 2. The page ≡ engine comparison (§21 zero tolerance)');

  const result = backtestAsiaPage(asia.readings, snapshot.readings);
  for (const c of result.checks) {
    console.log(`  ${c.ok ? '✓' : '✗'} ${c.label}: ${c.detail}${c.note !== undefined ? ` — ${c.note}` : ''}`);
    if (!c.ok) failures++;
  }
  console.log(`  — ${result.checks.length} checks · ${result.green} green · ${result.red} red`);

  /* ---------- 3. The section membership's live sanity ---------- */
  console.log('\n## 3. The placement groups vs the served projection');

  const groups: readonly (readonly string[])[] = [
    pageGroupIds('asia-pacific', 'china'),
    pageGroupIds('asia-pacific', 'japan'),
    pageGroupIds('asia-pacific', 'korea-taiwan-hk'),
    pageGroupIds('asia-pacific', 'india'),
    pageGroupIds('asia-pacific', 'pacific-nz'),
  ];
  const seated = new Set(asia.readings.map((r) => (r.id as string)));
  const groupNames = ['china (7)', 'japan (3 — the S25 Japan CPI fill)', 'korea-taiwan-hk (1 — the S25 Korea CPI fill)', 'india (1 — the S25 India CPI fill)', 'pacific-nz (2)'];
  groups.forEach((ids, i) => {
    const missing = ids.filter((id) => !seated.has(id));
    check(
      `${groupNames[i]} seats ${ids.length} ids, all carried by the projection`,
      missing.length === 0,
      missing.length === 0 ? `${ids.length}/${ids.length} present` : `missing: ${missing.join(', ')}`,
    );
  });
  const allCards = ASIA_BACKTEST_CARD_IDS.filter((id) => !seated.has(id));
  check(
    'every Asia registry card (the 14) is carried by the projection',
    allCards.length === 0,
    allCards.length === 0 ? '14/14 present' : `missing: ${allCards.join(', ')}`,
  );
  // The two index-note groups carry their S25 CPI cards (BD-S23a) while
  // their markets ride the zoom map above.
  check(
    'the korea-taiwan-hk group carries its CPI card (korea-cpi — KOSPI/TAIEX/HSI ride the zoom)',
    pageGroupIds('asia-pacific', 'korea-taiwan-hk').length === 1,
    `${pageGroupIds('asia-pacific', 'korea-taiwan-hk').length} ids`,
  );
  check(
    'the india group carries its CPI card (india-cpi — NIFTY50 rides the zoom)',
    pageGroupIds('asia-pacific', 'india').length === 1,
    `${pageGroupIds('asia-pacific', 'india').length} ids`,
  );

  /* ---------- 4. The freshness audit vs cadence grace (S11's pure
     *              auditUsaFreshness, reused with ASIA_CARD_IDS — same
     *              function the offline suite pins, no logic drift) ---------- */
  console.log('\n## 4. Freshness within cadence grace (the registry\'s own maxAgeDays)');

  const registry = registryMaxAge();
  const freshness = auditUsaFreshness(asia.readings, registry, ASIA_BACKTEST_CARD_IDS, new Date());
  for (const c of freshness.checks) {
    console.log(`  ${c.ok ? '✓' : '✗'} ${c.label}: ${c.detail}`);
    if (!c.ok) failures++;
  }
  if (freshness.beyond.length > 0) {
    const honest = freshness.beyond.filter((f) => f.honest);
    notes.push(`${freshness.beyond.length} card(s) beyond grace — ${honest.length} honestly carrying the engine's stale status; the rest are the cadence audit's findings`);
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
