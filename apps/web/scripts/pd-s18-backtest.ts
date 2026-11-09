/**
 * pd-s18-backtest.ts — the S18 §21 diff, LIVE (spec §21's
 * verdict-consistency rule applied to the Currencies page: the trio
 * coverage over the 14 placed cards + the rules/board gates — "page-
 * rendered values must match engine values byte-for-byte" and "the rules
 * match the FX board KV logic exactly; 11 pairs complete").
 *
 * A MANUAL script, never part of the test suite (tests never hit live
 * sites — AGENTS.md rule 7; the pd-s4…pd-s17 pattern). Every number
 * below comes from THIS run.
 *
 * What it does, over the LIVE public feeds:
 *
 *   1. Fetches the THREE feeds the comparison reads:
 *        GET /api/insights                   — the served snapshot (the ENGINE
 *                                              side's own document)
 *        GET /api/insights/pages/currencies  — the Currencies projection
 *                                              (the PAGE side: the 7 pair-
 *                                              context + 7 dollar-standing
 *                                              cards)
 *        GET /api/insights/fx                — the fx board's stored document
 *                                              (the rules + the 11-pair
 *                                              board the page renders)
 *      and proves the two insights documents derive from one snapshot
 *      (generatedAt alignment) + the projection's honest absentIds + the
 *      projection's boards declaration (['fx'] — the placement §14
 *      contract).
 *
 *   2. Runs the pure comparison core (currencies-backtest-core.ts): every
 *      one of the 14 cards' §21 trio inputs byte-identical between the
 *      projection and the snapshot.
 *
 *   3. The rules gate: the 7 rules' stored states read through the SAME
 *      §9.3 mapping the page reads (fxRuleView) + the renderable-domain
 *      invariant + the stored summary ≡ the engine's own summarizeFxRules
 *      recomputed over the stored rules.
 *
 *   4. The board gate: 11 pairs complete (D-42 — AUDNZD the 11th), the
 *      bigMove ≡ moveRank ≥ 90 derivation per row, and the stale flags
 *      honest against the asOf age.
 *
 *   5. The freshness audit vs cadence grace (S11's pure auditUsaFreshness,
 *      reused with CURRENCIES_CARD_IDS): every card's asOf age checked
 *      against the registry's own maxAgeDays (the data audit's §21 leg —
 *      a card beyond its grace is RED, the engine's own stale status is
 *      the page's honest word).
 *
 * Writes NOTHING (no KV, no repo file). Read-only.
 *
 * Usage (from the repo root):
 *   pnpm --filter @currena/web exec tsx ../../apps/web/scripts/pd-s18-backtest.ts \
 *     [--base https://currena.ir]
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { FxSnapshotSchema, InsightsSnapshotSchema, PageProjectionSchema } from '@currena/core';
import {
  auditUsaFreshness,
  backtestCurrenciesBoard,
  backtestCurrenciesCards,
  backtestCurrenciesRules,
  CURRENCIES_BACKTEST_CARD_IDS,
  type FreshnessRegistryEntry,
} from '../src/routes/page-division/currencies-backtest-core';

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

async function getJson<T>(
  path: string,
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { message: string } } },
  what: string,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json', 'user-agent': 'CurrenaDashboard/1.0 (pd-s18-backtest)' } });
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
  console.log(`# PD-S18 §21 diff (the Currencies page's 14 placed cards + the rules/board gates) — ${new Date().toISOString()}`);
  console.log(`# base: ${BASE}\n`);

  /* ---------- 1. The three feeds ---------- */
  console.log('## 1. The live feeds (one snapshot, three documents)');

  const snapshot = await getJson('/api/insights', InsightsSnapshotSchema, 'the served snapshot');
  const currencies = await getJson('/api/insights/pages/currencies', PageProjectionSchema, 'the Currencies projection');
  const fx = await getJson('/api/insights/fx', FxSnapshotSchema, 'the fx board');

  check(
    'the two insights documents derive from ONE snapshot (generatedAt aligned)',
    snapshot.generatedAt === currencies.generatedAt,
    `snapshot ${snapshot.generatedAt} · currencies ${currencies.generatedAt}`,
  );
  check(
    'the Currencies projection carries its honest absentIds report',
    currencies.absentIds.every((id) => !currencies.readings.some((r) => (r.id as string) === id)),
    `${currencies.absentIds.length} absent · ${currencies.readings.length} readings · boards ${currencies.boards.join('+')}`,
  );
  check(
    'the Currencies projection declares the fx board (the placement §14 contract)',
    currencies.boards.length === 1 && currencies.boards[0] === 'fx',
    `boards: ${currencies.boards.join(' + ')}`,
  );

  /* ---------- 2. The §21 card diff (zero tolerance) ---------- */
  console.log('\n## 2. The page ≡ engine comparison over the 14 registry cards (§21 zero tolerance)');

  const cards = backtestCurrenciesCards(currencies.readings, snapshot.readings);
  for (const c of cards.checks) {
    console.log(`  ${c.ok ? '✓' : '✗'} ${c.label}: ${c.detail}${c.note !== undefined ? ` — ${c.note}` : ''}`);
    if (!c.ok) failures++;
  }
  console.log(`  — ${cards.checks.length} checks · ${cards.green} green · ${cards.red} red`);

  /* ---------- 3. The rules gate (the KV logic read exactly) ---------- */
  console.log('\n## 3. The rules gate — the §9.3 mapping + the summary rollup (zero tolerance)');

  const rules = backtestCurrenciesRules(fx);
  for (const c of rules.checks) {
    console.log(`  ${c.ok ? '✓' : '✗'} ${c.label}: ${c.detail}`);
    if (!c.ok) failures++;
  }
  console.log(`  — ${rules.checks.length} checks · ${rules.green} green · ${rules.red} red`);

  /* ---------- 4. The board gate (11 pairs complete, D-42) ---------- */
  console.log('\n## 4. The board gate — 11 pairs complete + the honest flags');

  const todayIso = new Date().toISOString().slice(0, 10);
  const board = backtestCurrenciesBoard(fx, todayIso);
  for (const c of board.checks) {
    console.log(`  ${c.ok ? '✓' : '✗'} ${c.label}: ${c.detail}`);
    if (!c.ok) failures++;
  }
  console.log(`  — ${board.checks.length} checks · ${board.green} green · ${board.red} red`);

  /* ---------- 5. The freshness audit vs cadence grace ---------- */
  console.log("\n## 5. Freshness within cadence grace (the registry's own maxAgeDays)");

  const registry = registryMaxAge();
  const freshness = auditUsaFreshness(currencies.readings, registry, CURRENCIES_BACKTEST_CARD_IDS, new Date());
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
