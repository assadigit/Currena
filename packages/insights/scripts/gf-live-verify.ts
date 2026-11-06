/**
 * gf-live-verify.ts — the GF-S10 live end-to-end verification (D-GF-9):
 * fetch the LIVE public snapshot from the production API, run the
 * PRODUCTION engine (`goldBalance` — the 36-seat five-lane table) over its
 * readings, and print the lane state + the four GF-P3 seats' own status
 * words. Read-only: no KV writes, no product edits (the GF-S8 verification
 * pattern, restated as a committed script so every claim carries its run).
 *
 * Manual:
 *   pnpm --filter @currena/insights gf-live-verify [snapshotUrl]
 * (default: the production public snapshot on currena.ir)
 */

import { goldBalance, GOLD_LANE_STRONG } from '../src/gold-balance';
import { GOLD_LANE_VOTERS, GOLD_LANES } from '../src/gold-score';

const url = process.argv[2] ?? 'https://currena.ir/api/insights';

interface LiveReading {
  id: string;
  value: number | null;
  asOf: string | null;
  status: string;
  change30d?: number;
  percentile10y?: number;
}
interface LiveSnapshot {
  generatedAt: string;
  readings: LiveReading[];
}

const res = await fetch(url, { headers: { accept: 'application/json' } });
if (!res.ok) throw new Error(`live snapshot fetch: HTTP ${res.status}`);
const snapshot = (await res.json()) as LiveSnapshot;

console.log(`# GF live verify — ${new Date().toISOString()}`);
console.log(`snapshot: ${url}`);
console.log(`generatedAt: ${snapshot.generatedAt} · readings: ${snapshot.readings.length}`);

const readings = snapshot.readings as never[];
const balance = goldBalance(readings);

console.log(`\nengine: GOLD_LANE_VOTERS ${GOLD_LANE_VOTERS.length} seats over ${GOLD_LANES.length} lanes · GOLD_LANE_STRONG ${GOLD_LANE_STRONG}-of-${GOLD_LANES.length}`);
console.log(
  `balance: for ${balance.counts.for} · against ${balance.counts.against} · neutral ${balance.counts.neutral} · unread ${balance.counts.unread} (net ${balance.net}, readable ${balance.readable})`,
);
for (const lane of balance.lanes) {
  console.log(
    `  ${lane.lane.padEnd(16)} ${lane.side.padEnd(7)} split=${lane.split ? 'yes' : 'no '} readable=${lane.readable} firing=${lane.firing} supports=${lane.supports} pressures=${lane.pressures}`,
  );
}

// The GF-P3 seats' own status words on the live wire (the four FRED-sourced
// voter-candidates + the three WGC/official context cards).
const P3_IDS = [
  'real-yield-5y',
  'dollar-broad',
  'dollar-eme',
  'bank-stress',
  'wgc-etf-holdings',
  'wgc-cb-demand',
  'official-gold-demand',
] as const;
console.log(`\nthe GF-P3 seats on the live wire:`);
for (const id of P3_IDS) {
  const r = snapshot.readings.find((x) => x.id === id);
  if (r === undefined) {
    console.log(`  ${id.padEnd(22)} ABSENT from the public snapshot (hidden by the T-15 projection or not yet written)`);
    continue;
  }
  console.log(
    `  ${id.padEnd(22)} ${r.value ?? '—'} @ ${r.asOf ?? '—'} [${r.status}]${
      r.percentile10y !== undefined ? ` pct10y=${(r.percentile10y * 100).toFixed(0)}%` : ''
    }${r.change30d !== undefined ? ` chg30d=${r.change30d.toFixed(3)}` : ''}`,
  );
}
