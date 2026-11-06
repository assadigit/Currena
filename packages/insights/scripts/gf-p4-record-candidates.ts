/**
 * gf-p4-record-candidates.ts — the GF-P4 candidates recorder (read-only).
 *
 * The GF-S10 remaining P3 sources (audit report §4 ranks 22, 27, 32–33):
 * the ONE voter-candidate whose history the harness can measure over the
 * full corpus — I4, the University of Michigan's 5–10-year median
 * expected price change (the household anchor, "the slow version of
 * R7"). The D-GF-6 recalibration measures the POST-P4-5LANE scenario
 * over this recorded history BEFORE the production seat counts (the
 * harness-first discipline — no measured scenario, no seat).
 *
 * WHAT IT DOES (read-only — no product edits, no KV writes, no deploy):
 *  1. Reads the committed `fixtures/gf-p0-candidates.json` (the P0–P3
 *     candidates — untouched; the existing 20 series preserved verbatim).
 *  2. Fresh-fetches the UoM SIE Table 33 median series through the repo's
 *     OWN `fetchUomExpectedPrice5y10y` adapter (the same keyless POST
 *     route the production rung reads — the disclosed venue; the SIE
 *     usage agreement's CC-BY-NC-ND terms ride the licence register's
 *     uom row).
 *  3. Merges the series into the fixture under its PRODUCTION indicator
 *     id (michigan-5y-expectations), preserving every existing series +
 *     the stage/venues metadata. The fixture's `recordedAt` refreshes.
 *
 * The F6 Shanghai premium's SGE leg is NOT recorded here: the SGE daily
 * archive reaches back only to ~2024 (measured this session — the 2024-10
 * window serves, 2023-10 does not), so the premium seat is UNMEASURABLE
 * over the 2016→2026 corpus ("no measured scenario, no seat") — the card
 * lands as a context card with the seat question printed (the GF-S10
 * evidence). F7 (the India parity — MCX venue-blocked 403) and I9 (the
 * nowcast-surprise — the Cleveland Fed publishes no nowcast history) are
 * likewise recorded-open, not silently added.
 *
 * NO FORECASTING CLAIM ANYWHERE (D-GF-3): the recorded history feeds the
 * calibration's firing statistics only; the no-edge record stands untouched.
 *
 * Manual script (the gf-p3-record-candidates discipline): never part of
 * the test suite. No credentials needed — the SIE archive is keyless.
 *
 * Run: pnpm --filter @currena/insights gf-p4-record-candidates
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchUomExpectedPrice5y10y } from '../src/adapters/uom';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, '..', 'fixtures', 'gf-p0-candidates.json');

const toEpochDay = (iso: string): number => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);

const recordedAt = new Date().toISOString();
console.log(`# GF-P4 candidates recorder — ${recordedAt}`);

// (1) Read the committed fixture (preserve every existing series verbatim).
const existing = JSON.parse(readFileSync(FIXTURE, 'utf8')) as {
  v: number;
  recordedAt: string;
  stageWrittenAt?: string;
  venues?: Record<string, string>;
  series: Record<string, Array<[number, number]>>;
};
console.log(`existing fixture: v${existing.v}, ${Object.keys(existing.series).length} series (recorded ${existing.recordedAt})`);

const series: Record<string, Array<[number, number]>> = { ...existing.series };
const venues: Record<string, string> = { ...(existing.venues ?? {}) };

// (2) Fresh-fetch the UoM SIE Table 33 median series through the repo's own adapter.
const id = 'michigan-5y-expectations';
const pts = await fetchUomExpectedPrice5y10y();
if (pts.length < 200) throw new Error(`${id}: only ${pts.length} points — the archive POST returned a truncated history`);
for (let i = 1; i < pts.length; i++) {
  if (pts[i]!.date <= pts[i - 1]!.date) {
    throw new Error(`${id}: dates not ascending at index ${i} (${pts[i - 1]!.date} → ${pts[i]!.date})`);
  }
  if (!Number.isFinite(pts[i]!.value)) throw new Error(`${id}: non-finite value at index ${i}`);
}
series[id] = pts.map((p) => [toEpochDay(p.date), p.value] as [number, number]);
venues[id] = 'fresh: UoM SIE Table 33 archive POST (data.sca.isr.umich.edu, keyless) — rank 32 (I4), the 5–10y household anchor';
console.log(`  ${id.padEnd(26)} n=${String(pts.length).padStart(4)}  ${pts[0]!.date} → ${pts.at(-1)!.date}  (UoM SIE Table 33 median)`);

// (3) Write the extended fixture (v stays 1; recordedAt refreshes; existing
//     series + stageWrittenAt + venues preserved; the I4 series added).
writeFileSync(
  FIXTURE,
  JSON.stringify(
    {
      v: existing.v,
      recordedAt,
      stageWrittenAt: existing.stageWrittenAt,
      venues,
      series,
    },
    null,
    2,
  ),
);
console.log(`✍ ${FIXTURE} (${Object.keys(series).length} series — the I4 UoM candidate merged in)`);
