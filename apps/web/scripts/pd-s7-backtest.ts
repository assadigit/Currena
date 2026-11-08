/**
 * pd-s7-backtest.ts — the S7 §21 diff, LIVE (spec §21's
 * verdict-consistency rule: page-rendered verdicts byte-identical to the
 * engine's stored verdicts for the same snapshot — zero tolerance).
 *
 * A MANUAL script, never part of the test suite (tests never hit live
 * sites — AGENTS.md rule 7; the pd-s4/pd-s5-backtest pattern). Every
 * number below comes from THIS run.
 *
 * What it does, over the LIVE public feeds:
 *
 *   1. Fetches the three feeds from one base (default: production):
 *        GET /api/insights                    — the served snapshot (the
 *                                              engine side's risk
 *                                              readings)
 *        GET /api/insights/pages/world-markets — the S2 projection the
 *                                              page renders (the 9
 *                                              world-risk readings)
 *        GET /api/insights/markets            — the board attachment (the
 *                                              SAME cached route the
 *                                              page, the legacy section
 *                                              and the Global tile read)
 *      The snapshot + projection are ALIGNED on generatedAt + pricesAsOf
 *      (an hourly live-prices tick between the two fetches is a
 *      legitimate difference — refetched, never compared blind). The
 *      board is its own feed (the 23:30/01:30 UTC crons) — its stamp is
 *      reported, never aligned.
 *
 *   2. Runs the pure comparison core (world-markets-backtest-core.ts) —
 *      the page side (world-markets-tiles over the board + projection)
 *      vs the engine side (summarizeMarkets + verdict-core + the shared
 *      helpers over the board's own rows, and the served snapshot's
 *      readings for the risk cards, member line by member line). Every
 *      check printed ✓/✗; any ✗ is RED.
 *
 *   3. The honest gap report: the projection's absentIds are printed as
 *      the §16 notes they render as — never a failure (absent on both
 *      sides stays green by design).
 *
 * Writes NOTHING (no KV, no repo file). Read-only.
 *
 * Usage (from the repo root):
 *   pnpm --filter @currena/web exec tsx ../../apps/web/scripts/pd-s7-backtest.ts \
 *     [--base https://currena.ir]
 */

import type { InsightsSnapshot } from '@currena/core';
import { InsightsSnapshotSchema, MarketsSnapshotSchema, PageProjectionSchema } from '@currena/core';
import { backtestWorldMarketsPage } from '../src/routes/page-division/world-markets-backtest-core';

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
  const res = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json', 'user-agent': 'CurrenaDashboard/1.0 (pd-s7-backtest)' } });
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status} from ${path}`);
  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) throw new Error(`${what}: contract violation — ${parsed.error.message.slice(0, 200)}`);
  return parsed.data;
}

async function main(): Promise<void> {
  console.log(`# PD-S7 §21 diff (World Markets) — ${new Date().toISOString()}`);
  console.log(`# base: ${BASE}\n`);

  /* ---------- 1. The three feeds ---------- */
  console.log('## 1. The live feeds');

  const board = await getJson('/api/insights/markets', MarketsSnapshotSchema, 'the markets board');
  const snapshot0 = await getJson('/api/insights', InsightsSnapshotSchema, 'the snapshot');
  let projection = await getJson('/api/insights/pages/world-markets', PageProjectionSchema, 'the World Markets projection');
  // Align the snapshot + projection on BOTH generation stamps (an hourly
  // prices tick between the two fetches is a legitimate difference —
  // refetch).
  let snapshot: InsightsSnapshot = snapshot0;
  for (let attempt = 0; attempt < 3; attempt++) {
    const aligned =
      snapshot.generatedAt === projection.generatedAt &&
      (snapshot.pricesAsOf ?? '') === (projection.pricesAsOf ?? '');
    if (aligned) break;
    notes.push(
      `generations realigned once (snapshot ${snapshot.generatedAt}/${snapshot.pricesAsOf ?? '—'} vs projection ${projection.generatedAt}/${projection.pricesAsOf ?? '—'} — the hourly prices tick)`,
    );
    snapshot = await getJson('/api/insights', InsightsSnapshotSchema, 'the snapshot');
    projection = await getJson('/api/insights/pages/world-markets', PageProjectionSchema, 'the World Markets projection');
  }
  check(
    'the snapshot + projection share one generation',
    snapshot.generatedAt === projection.generatedAt && (snapshot.pricesAsOf ?? '') === (projection.pricesAsOf ?? ''),
    `generatedAt ${snapshot.generatedAt} · pricesAsOf ${projection.pricesAsOf ?? 'none'}`,
  );
  check('the snapshot is the public projection', snapshot.displayMode === 'public', `displayMode ${snapshot.displayMode ?? 'full'}`);
  check(
    'the board is the stored KV document (its own cron stamp, never aligned)',
    board.v === 1 && board.markets.length > 0,
    `${board.markets.length} rows · generatedAt ${board.generatedAt} · summary ${board.summary.signal} (${board.summary.nAttention}+${board.summary.nUnusual})`,
  );
  check(
    'the World Markets projection carries the 9 world-risk homes',
    projection.readings.length + projection.absentIds.length >= 9,
    `${projection.readings.length} readings · absent [${projection.absentIds.join(', ')}]`,
  );
  if (projection.absentIds.length > 0) {
    notes.push(`the projection's absentIds (the §16 notes, never cards): [${projection.absentIds.join(', ')}]`);
  }

  /* ---------- 2. The §21 diff (zero tolerance) ---------- */
  console.log('\n## 2. The page-vs-engine comparison (§21 zero tolerance)');

  const todayIso = new Date().toISOString().slice(0, 10);
  const checks = backtestWorldMarketsPage(board, projection.readings, snapshot.readings, todayIso);
  const failed = checks.filter((c) => !c.ok);
  for (const c of checks) {
    console.log(`  ${c.ok ? '✓' : '✗'} ${c.label}: page ${c.page} ≡ engine ${c.engine}${c.ok ? '' : '  ← RED'}`);
    if (c.note !== undefined) notes.push(c.note);
  }
  console.log(`  — ${checks.length} checks · ${checks.length - failed.length} green · ${failed.length} red`);
  if (failed.length > 0) failures += failed.length;

  /* ---------- the one-screen summary ---------- */
  console.log(`\n# ${failures === 0 ? 'ALL CHECKS GREEN' : `${failures} FAILURE(S) — RED, fix or roll back (never pass forward)`}`);
  if (notes.length > 0) {
    console.log('# notes (honest observations, none failing):');
    for (const n of notes) console.log(`  · ${n}`);
  }
  process.exitCode = failures === 0 ? 0 : 1;
}

await main();
