/**
 * pd-s9-backtest.ts — the S9 §21 diff, LIVE (spec §21's
 * verdict-consistency rule applied to the USA page: "the verdicts match
 * Global's engine values byte-for-byte" — the D-30 contract — plus the
 * §21 per-page trio over the tier cards).
 *
 * A MANUAL script, never part of the test suite (tests never hit live
 * sites — AGENTS.md rule 7; the pd-s4/pd-s5/pd-s7/pd-s8-backtest
 * pattern). Every number below comes from THIS run.
 *
 * What it does, over the LIVE public feed:
 *
 *   1. Fetches the THREE feeds the comparison reads:
 *        GET /api/insights              — the served snapshot (the ENGINE
 *                                         side's own document)
 *        GET /api/insights/pages/usa    — the USA projection (the PAGE
 *                                         side: the strip + the tiers)
 *        GET /api/insights/pages/global — the Global projection (the
 *                                         GLOBAL side: what the landing
 *                                         page renders for the same
 *                                         five gauges, D-30's literal
 *                                         words)
 *      and proves the three are one snapshot (generatedAt alignment).
 *
 *   2. Runs the pure comparison core (usa-backtest-core.ts): every
 *      gauge voter present on all three feeds, every gauge's verdict
 *      page ≡ Global ≡ engine, every one of the 26 tier cards' §21 trio
 *      inputs byte-identical between the projection and the snapshot.
 *      Every check printed ✓/✗; any ✗ is RED.
 *
 *   3. The tier membership's own live sanity: the placement's four /usa
 *      groups' ids are all carried by the served projection (the S8
 *      script's zoom-membership section pattern).
 *
 * Writes NOTHING (no KV, no repo file). Read-only.
 *
 * Usage (from the repo root):
 *   pnpm --filter @currena/web exec tsx ../../apps/web/scripts/pd-s9-backtest.ts \
 *     [--base https://currena.ir]
 */

import { InsightsSnapshotSchema, PageProjectionSchema } from '@currena/core';
import { pageGroupIds } from '@currena/insights/page-division';
import { backtestUsaPage } from '../src/routes/page-division/usa-backtest-core';
import { USA_BACKTEST_CARD_IDS } from '../src/routes/page-division/usa-backtest-core';

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
  const res = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json', 'user-agent': 'CurrenaDashboard/1.0 (pd-s9-backtest)' } });
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status} from ${path}`);
  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) throw new Error(`${what}: contract violation — ${parsed.error.message.slice(0, 200)}`);
  return parsed.data;
}

async function main(): Promise<void> {
  console.log(`# PD-S9 §21 diff (the USA verdict strip + tiers 1–2) — ${new Date().toISOString()}`);
  console.log(`# base: ${BASE}\n`);

  /* ---------- 1. The three feeds ---------- */
  console.log('## 1. The live feeds (one snapshot, three documents)');

  const snapshot = await getJson('/api/insights', InsightsSnapshotSchema, 'the served snapshot');
  const usa = await getJson('/api/insights/pages/usa', PageProjectionSchema, 'the USA projection');
  const global = await getJson('/api/insights/pages/global', PageProjectionSchema, 'the Global projection');

  check(
    'the three documents derive from ONE snapshot (generatedAt aligned)',
    snapshot.generatedAt === usa.generatedAt && usa.generatedAt === global.generatedAt,
    `snapshot ${snapshot.generatedAt} · usa ${usa.generatedAt} · global ${global.generatedAt}`,
  );
  check(
    'the USA projection carries its honest absentIds report',
    usa.absentIds.every((id) => !usa.readings.some((r) => (r.id as string) === id)),
    `${usa.absentIds.length} absent · ${usa.readings.length} readings · boards ${usa.boards.join('+')}`,
  );

  /* ---------- 2. The §21 diff (zero tolerance) ---------- */
  console.log('\n## 2. The page ≡ Global ≡ engine comparison (§21 zero tolerance)');

  const result = backtestUsaPage(usa.readings, global.readings, snapshot.readings);
  for (const c of result.checks) {
    console.log(`  ${c.ok ? '✓' : '✗'} ${c.label}: ${c.detail}${c.note !== undefined ? ` — ${c.note}` : ''}`);
    if (!c.ok) failures++;
  }
  console.log(`  — ${result.checks.length} checks · ${result.green} green · ${result.red} red`);

  /* ---------- 3. The tier membership's live sanity ---------- */
  console.log('\n## 3. The placement groups vs the served projection (the S8 zoom-membership pattern)');

  const groups: readonly (readonly string[])[] = [
    pageGroupIds('usa', 'tier-1-world-watches'),
    pageGroupIds('usa', 'tier-2-rates-fed'),
    pageGroupIds('usa', 'tier-3-inflation'),
    pageGroupIds('usa', 'tier-4-labor-growth'),
    pageGroupIds('usa', 'tier-5-liquidity-stress-valuation'),
  ];
  const seated = new Set(usa.readings.map((r) => r.id as string));
  const groupNames = ['tier-1 (7)', 'tier-2 (19)', 'tier-3 (12)', 'tier-4 (17)', 'tier-5 (17)'];
  groups.forEach((ids, i) => {
    const missing = ids.filter((id) => !seated.has(id));
    check(
      `${groupNames[i]} seats ${ids.length} ids, all carried by the projection`,
      missing.length === 0,
      missing.length === 0 ? `${ids.length}/${ids.length} present` : `missing: ${missing.join(', ')}`,
    );
  });
  const s9Cards = USA_BACKTEST_CARD_IDS.filter((id) => !seated.has(id));
  check(
    'every S9-scope card (the 26) is carried by the projection',
    s9Cards.length === 0,
    s9Cards.length === 0 ? '26/26 present' : `missing: ${s9Cards.join(', ')}`,
  );

  /* ---------- the one-screen summary ---------- */
  console.log(`\n# ${failures === 0 ? 'ALL CHECKS GREEN' : `${failures} FAILURE(S) — RED, fix or roll back (never pass forward)`}`);
  if (notes.length > 0) {
    console.log('# notes (honest observations, none failing):');
    for (const n of notes) console.log(`  · ${n}`);
  }
  process.exitCode = failures === 0 ? 0 : 1;
}

await main();
