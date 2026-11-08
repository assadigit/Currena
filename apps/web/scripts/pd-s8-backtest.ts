/**
 * pd-s8-backtest.ts — the S8 §21 diff, LIVE (spec §21's
 * verdict-consistency rule applied to the regional zoom maps: a zoomed
 * market's numbers and colours are byte-identical to the world map's
 * own for the same board — zero tolerance).
 *
 * A MANUAL script, never part of the test suite (tests never hit live
 * sites — AGENTS.md rule 7; the pd-s4/pd-s5/pd-s7-backtest pattern).
 * Every number below comes from THIS run.
 *
 * What it does, over the LIVE public feed:
 *
 *   1. Fetches the ONE feed the four zooms read (the same cached board
 *      route the legacy section, the Global tile and the /world-markets
 *      hero read): GET /api/insights/markets. One payload, four windows
 *      — zero new fetches by design (the S8 scope's own rule).
 *
 *   2. Runs the pure comparison core (region-zoom-backtest-core.ts) —
 *      the PAGE side (deriveWorldMapRows: the exact function the
 *      drawing renders) vs the ENGINE side (spelled out over the
 *      board's own rows, all-16 scale), for every region, every seated
 *      index, every one of the six lenses. Every check printed ✓/✗;
 *      any ✗ is RED.
 *
 *   3. The zoom membership's own live sanity: the four index sets the
 *      REGION_ZOOMS config seats are all present in the served board.
 *
 * Writes NOTHING (no KV, no repo file). Read-only.
 *
 * Usage (from the repo root):
 *   pnpm --filter @currena/web exec tsx ../../apps/web/scripts/pd-s8-backtest.ts \
 *     [--base https://currena.ir]
 */

import { MarketsSnapshotSchema } from '@currena/core';
import { REGION_ZOOMS } from '../src/components/insights/world-markets/world-map-config';
import type { MapRegionId } from '../src/components/insights/world-markets/world-map-config';
import { backtestRegionZoomsVsEngine } from '../src/routes/page-division/region-zoom-backtest-core';

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
  const res = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json', 'user-agent': 'CurrenaDashboard/1.0 (pd-s8-backtest)' } });
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status} from ${path}`);
  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) throw new Error(`${what}: contract violation — ${parsed.error.message.slice(0, 200)}`);
  return parsed.data;
}

async function main(): Promise<void> {
  console.log(`# PD-S8 §21 diff (the Regional zoom maps) — ${new Date().toISOString()}`);
  console.log(`# base: ${BASE}\n`);

  /* ---------- 1. The one feed ---------- */
  console.log('## 1. The live board (the SAME cached route every map surface reads)');

  const board = await getJson('/api/insights/markets', MarketsSnapshotSchema, 'the markets board');
  check(
    'the board is the stored KV document (its own cron stamp)',
    board.v === 1 && board.markets.length > 0,
    `${board.markets.length} rows · generatedAt ${board.generatedAt} · summary ${board.summary.signal} (${board.summary.nAttention}+${board.summary.nUnusual})`,
  );

  /* ---------- 2. The §21 diff (zero tolerance, all four zooms) ---------- */
  console.log('\n## 2. The zoom-vs-engine comparison (§21 zero tolerance)');

  const todayIso = new Date().toISOString().slice(0, 10);
  const result = backtestRegionZoomsVsEngine(board, { todayIso, nowMs: Date.now() });
  for (const c of result.checks) {
    console.log(`  ${c.ok ? '✓' : '✗'} ${c.label}: ${c.detail}`);
    if (!c.ok) failures++;
  }
  console.log(`  — ${result.checks.length} checks · ${result.green} green · ${result.red} red`);

  /* ---------- 3. The zoom membership's live sanity ---------- */
  console.log('\n## 3. The four zooms\' seated indices (the REGION_ZOOMS config vs the served board)');

  for (const region of Object.keys(REGION_ZOOMS) as MapRegionId[]) {
    const zoom = REGION_ZOOMS[region];
    const rows = zoom.indices.filter((id) => board.markets.some((row) => row.id === id));
    check(
      `zoom ${region} seats ${zoom.indices.length} indices, all carried by the board`,
      rows.length === zoom.indices.length,
      `${zoom.indices.join(' · ')} — window ${zoom.viewBox.w}×${zoom.viewBox.h} at (${zoom.viewBox.x}, ${zoom.viewBox.y})`,
    );
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
