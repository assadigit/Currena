/**
 * pd-s5-backtest.ts — the S5 seat-level diff, LIVE (spec §21's Gold
 * gate: "meter counts match /api/insights exactly (seat-level diff)").
 *
 * A MANUAL script, never part of the test suite (tests never hit live
 * sites — AGENTS.md rule 7; the pd-s4-backtest pattern). Every number
 * below comes from THIS run.
 *
 * What it does, over the LIVE public snapshot:
 *
 *   1. Fetches the two feeds from one base (default: the remote-dev
 *      Worker over real KV on :8787; overridable to https://currena.ir
 *      for the production run):
 *        GET /api/insights              — the served snapshot (the SAME
 *                                         stored document the
 *                                         projections derive from)
 *        GET /api/insights/pages/gold   — the S2 projection the page
 *                                         renders
 *      The pair is ALIGNED on generatedAt + pricesAsOf (an hourly
 *      live-prices tick between the two fetches is a legitimate
 *      difference — refetched, never compared blind).
 *
 *   2. Runs the pure comparison core (gold-backtest-core.ts) — the
 *      page side (gold-tiles over the projection) vs the engine side
 *      (goldBalance + evaluateSignal + goldOutlookOf over the served
 *      snapshot, member line by member line). Every check printed
 *      ✓/✗; any ✗ is RED.
 *
 *   3. The honest gap report: the public projection's absentIds (the
 *      licence-hidden quartet) are printed as the §16 notes they render
 *      as — never a failure.
 *
 * Writes NOTHING (no KV, no repo file). Read-only.
 *
 * Usage (from the repo root):
 *   pnpm --filter @currena/web exec tsx ../../apps/web/scripts/pd-s5-backtest.ts \
 *     [--base https://currena.ir]
 */

import type { InsightsSnapshot } from '@currena/core';
import { InsightsSnapshotSchema, PageProjectionSchema } from '@currena/core';
import { backtestGoldPage } from '../src/routes/page-division/gold-backtest-core';

const BASE = (() => {
  const i = process.argv.indexOf('--base');
  return i >= 0 ? (process.argv[i + 1] ?? 'http://localhost:8787') : 'http://localhost:8787';
})();

let failures = 0;
const notes: string[] = [];

function check(label: string, ok: boolean, detail: string): void {
  console.log(`  ${ok ? '✓' : '✗'} ${label}: ${detail}`);
  if (!ok) failures++;
}

async function getJson<T>(path: string, schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { message: string } } }, what: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json', 'user-agent': 'CurrenaDashboard/1.0 (pd-s5-backtest)' } });
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status} from ${path}`);
  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) throw new Error(`${what}: contract violation — ${parsed.error.message.slice(0, 200)}`);
  return parsed.data;
}

async function main(): Promise<void> {
  console.log(`# PD-S5 seat-level diff (§21) — ${new Date().toISOString()}`);
  console.log(`# base: ${BASE}\n`);

  /* ---------- 1. The two feeds (aligned) ---------- */
  console.log('## 1. The live feeds');

  const snapshot0 = await getJson('/api/insights', InsightsSnapshotSchema, 'the snapshot');
  let projection = await getJson('/api/insights/pages/gold', PageProjectionSchema, 'the Gold projection');
  // Align the pair on BOTH generation stamps (an hourly prices tick
  // between the two fetches is a legitimate difference — refetch).
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
    projection = await getJson('/api/insights/pages/gold', PageProjectionSchema, 'the Gold projection');
  }
  check(
    'the snapshot + projection share one generation',
    snapshot.generatedAt === projection.generatedAt && (snapshot.pricesAsOf ?? '') === (projection.pricesAsOf ?? ''),
    `generatedAt ${snapshot.generatedAt} · pricesAsOf ${projection.pricesAsOf ?? 'none'}`,
  );
  check('the snapshot is the public projection', snapshot.displayMode === 'public', `displayMode ${snapshot.displayMode ?? 'full'}`);
  check(
    'the Gold projection carries the meter\'s full input set (37 voters + 14 homes)',
    projection.readings.length >= 48,
    `${projection.readings.length} readings · absent [${projection.absentIds.join(', ')}]`,
  );
  notes.push(`the licence-hidden quartet rides absentIds (the §16 notes, never cards): [${projection.absentIds.join(', ')}]`);

  /* ---------- 2. The seat-level diff (§21 zero tolerance) ---------- */
  console.log('\n## 2. The seat-by-seat comparison (page ≡ engine, §21 zero tolerance)');

  const checks = backtestGoldPage(projection.readings, snapshot.readings);
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
