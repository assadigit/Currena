/**
 * gf-p3-record-candidates.ts — the GF-P3 candidates recorder (read-only).
 *
 * The GF-P3 new free sources (audit report §4 ranks 19–22, 24–28, 32–33):
 * the four FRED-sourced voter-candidates — R2 DFII5 (the 5y real yield,
 * the belly where policy bites first — unlocks D-11/D-12's derived real
 * curve) · D2 DTWEXBGS (the trade-weighted dollar) · D9 DTWEXEMEGS (the
 * EME dollar) · S9 DPCREDIT (the bank-facility usage). The D-GF-6
 * recalibration measures the POST-P3-5LANE scenario over these recorded
 * histories BEFORE any production seat counts (the harness-first
 * discipline — no measured scenario, no seat).
 *
 * WHAT IT DOES (read-only — no product edits, no KV writes, no deploy):
 *  1. Reads the committed `fixtures/gf-p0-candidates.json` (the P0/P1/P2
 *     candidates — untouched; the existing 16 series preserved verbatim).
 *  2. Fresh-fetches the four FRED P3 series through the repo's OWN
 *     `fetchFredSeries` adapter (the same keyless fredgraph.csv route the
 *     production ingest reads — the disclosed venue; FRED is public-domain
 *     for these series, L0/L1 per the licence register).
 *  3. Merges the four new series into the fixture under their PRODUCTION
 *     indicator ids (real-yield-5y · dollar-broad · dollar-eme ·
 *     bank-stress), preserving every existing series + the stage/venues
 *     metadata. The fixture's `recordedAt` refreshes; `v` stays 1.
 *
 * The WGC/official flows family (F3/F4/F13) lands as CONTEXT cards per
 * OI-GA-4's recorded answer — they need NO calibration measurement (rule:
 * info, never votes) and so are NOT recorded here; their data adapters
 * land with the cards (the promotion criteria recorded in each definition's
 * comments). F6/F7 (the derived premia) + I4/I9 (the UoM/nowcast objects)
 * are GF-S10's — recorded-open, never silently added.
 *
 * NO FORECASTING CLAIM ANYWHERE (D-GF-3): the recorded histories feed the
 * calibration's firing statistics only; the no-edge record stands untouched.
 *
 * Manual script (the gf-p0-record-candidates discipline): never part of the
 * test suite. No credentials needed — FRED is keyless (the Gate I0 probe).
 *
 * Run: pnpm --filter @currena/insights gf-p3-record-candidates
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchFredSeries } from '../src/adapters/fred';
import type { SeriesPoint } from '../src/series';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, '..', 'fixtures', 'gf-p0-candidates.json');

/** The four FRED P3 voter-candidates: the FRED series id → the production indicator id. */
const P3_CANDIDATES: readonly { fredId: string; indicatorId: string; rank: string; label: string }[] = [
  { fredId: 'DFII5', indicatorId: 'real-yield-5y', rank: '19 (R2)', label: 'the 5y real yield — the belly where policy bites first' },
  { fredId: 'DTWEXBGS', indicatorId: 'dollar-broad', rank: '20 (D2)', label: 'the trade-weighted dollar — "the honest inverse"' },
  { fredId: 'DTWEXEMEGS', indicatorId: 'dollar-eme', rank: '21 (D9)', label: 'the EME dollar — the marginal buyer leg' },
  { fredId: 'DPCREDIT', indicatorId: 'bank-stress', rank: '28 (S9)', label: 'the bank-facility usage — the modern bank-run tell' },
];

const toEpochDay = (iso: string): number => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86_400_000);

const recordedAt = new Date().toISOString();
console.log(`# GF-P3 candidates recorder — ${recordedAt}`);

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

// (2) Fresh-fetch the four FRED P3 series through the repo's own adapter.
for (const c of P3_CANDIDATES) {
  const pts: SeriesPoint[] = await fetchFredSeries(c.fredId);
  if (pts.length === 0) throw new Error(`${c.fredId}: empty series — FRED returned no points`);
  // Ascending-date + finite-value discipline (the recorder's own).
  for (let i = 1; i < pts.length; i++) {
    if (pts[i]!.date <= pts[i - 1]!.date) {
      throw new Error(`${c.fredId}: dates not ascending at index ${i} (${pts[i - 1]!.date} → ${pts[i]!.date})`);
    }
    if (!Number.isFinite(pts[i]!.value)) {
      throw new Error(`${c.fredId}: non-finite value at index ${i}`);
    }
  }
  const pairs: Array<[number, number]> = pts.map((p) => [toEpochDay(p.date), p.value] as [number, number]);
  series[c.indicatorId] = pairs;
  venues[c.indicatorId] = `fresh: FRED ${c.fredId} (fredgraph.csv via fetchFredSeries) — rank ${c.rank}, ${c.label}`;
  console.log(`  ${c.indicatorId.padEnd(18)} n=${String(pairs.length).padStart(5)}  ${pts[0]!.date} → ${pts.at(-1)!.date}  (FRED ${c.fredId})`);
}

// (3) Write the extended fixture (v stays 1; recordedAt refreshes; existing
//     series + stageWrittenAt + venues preserved; the four P3 series added).
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
console.log(`✍ ${FIXTURE} (${Object.keys(series).length} series — the 4 FRED P3 candidates merged in)`);
