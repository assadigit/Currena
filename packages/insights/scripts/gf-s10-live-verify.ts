/**
 * gf-s10-live-verify.ts — the P3 deploy's live end-to-end verification
 * (the GF-S7/GF-S8 pattern; a MANUAL script, never part of the test
 * suite): fetch the LIVE public snapshot from the deployed worker and run
 * the PRODUCTION engine (`goldBalance` — the 36-seat five-lane table)
 * over it. Read-only: fetches the public endpoint, prints the lane state,
 * writes NOTHING (no KV, no repo file).
 *
 * Usage: pnpm --filter @currena/insights exec tsx scripts/gf-s10-live-verify.ts
 */
import { goldBalance } from '../src/gold-balance';
import type { IndicatorReading } from '@currena/core';

interface SnapshotShape {
  generatedAt: string;
  readings: IndicatorReading[];
}

async function main(): Promise<void> {
  const url = 'https://currena-api.sedanama-ir.workers.dev/api/insights';
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    console.error(`fetch ${url} → HTTP ${res.status}`);
    process.exit(1);
  }
  const snap = (await res.json()) as SnapshotShape;
  const readings = snap.readings ?? [];
  const balance = goldBalance(readings);

  console.log(`live public snapshot: generatedAt ${snap.generatedAt} · ${readings.length} readings`);
  console.log(
    `balance: for ${balance.counts.for} · against ${balance.counts.against} · neutral ${balance.counts.neutral} · unread ${balance.counts.unread} (net ${balance.net}, ${balance.readable} of ${balance.lanes.length} lanes readable)`,
  );
  for (const lane of balance.lanes) {
    const bits: string[] = [];
    for (const m of lane.members) {
      if (m.impact === 'supports' || m.impact === 'pressures') {
        bits.push(`${m.id} ${m.impact} (${m.evidence})`);
      } else if (m.impact === 'unread') {
        bits.push(`${m.id} UNREAD`);
      }
    }
    console.log(
      `  ${lane.lane}: ${lane.side}${lane.split ? ' (split)' : ''} — ${lane.supports}v${lane.pressures}` +
        (bits.length > 0 ? ` · ${bits.join(' · ')}` : ' · (no firing members)'),
    );
  }
  // The four GF-P3 seats' own live state (the deploy's specific claim).
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  for (const id of ['real-yield-5y', 'dollar-broad', 'dollar-eme', 'bank-stress'] as const) {
    const r = byId.get(id);
    if (r === undefined) {
      console.log(`  GF-P3 seat ${id}: ABSENT from the snapshot`);
      continue;
    }
    const lane = balance.lanes.find((l) =>
      l.members.some((m) => m.id === id),
    );
    const member = lane?.members.find((m) => m.id === id);
    console.log(
      `  GF-P3 seat ${id}: value ${r.value} asOf ${r.asOf} → ${member?.impact ?? '?'}${member?.evidence ? ` (${member.evidence})` : ''} [${lane?.lane}]`,
    );
  }
}

void main();
