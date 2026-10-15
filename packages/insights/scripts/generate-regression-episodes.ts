/**
 * generate-regression-episodes.ts — fix spec T-14 (2026-10-15).
 *
 * Cuts fixtures/regression-episodes.json from the LIVE fetched series at
 * known past dates (March 2020, the 2022 inflation spike): each case carries
 * the series as it stood then, a frozen asOf, and the status the engine
 * produced at cut time. The ingest's T-14 replays every case on every run;
 * any later rule change that flips one of these statuses fails the suite
 * before anything publishes.
 *
 * Downsample keeps the file small (monthly older than ~4 months back, daily
 * within — the change windows are 90 days): the fixture carries its own
 * points, so the replay is deterministic regardless of density.
 *
 * Run: pnpm --filter @currena/insights regression:generate
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import {
  buildIndicatorSeries,
  collectAllSources,
  parseManualSeries,
} from '../src/adapters/index';
import { READING_SOURCES } from '../src/adapters/derived';
import { computeReading } from '../src/scoring';
import { DEFINITIONS } from '../src/definitions';
import type { IndicatorId } from '@currena/core';
import type { RegressionEpisode } from '../src/validation';
import type { SeriesPoint } from '../src/series';

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, '..', 'fixtures', 'regression-episodes.json');
const repoRoot = new URL('../../../', import.meta.url);

/** The cut points: known episodes, verified against the historical record. */
const CUTS: { id: string; description: string; cases: { defId: IndicatorId; asOf: string; note: string }[] }[] = [
  {
    id: 'covid-2020',
    description: 'March–April 2020: the COVID crash (yields collapsing, fear spiking, jobs destroyed)',
    cases: [
      { defId: 'vix', asOf: '2020-03-18', note: 'VIX closed at its all-time high (82.69)' },
      { defId: 'us-unemployment', asOf: '2020-04-30', note: 'unemployment 14.8%, the post-war record' },
      { defId: 'sahm-rule', asOf: '2020-04-30', note: 'the Sahm trigger blew out' },
      { defId: 'us10y', asOf: '2020-03-20', note: 'the 10-year yield collapsed toward 1%' },
      { defId: 'yield-curve-10y2y', asOf: '2020-03-27', note: 'the curve steepened violently' },
      { defId: 'us-cpi-yoy', asOf: '2020-04-01', note: 'CPI fell as oil crashed' },
    ],
  },
  {
    id: 'inflation-2022',
    description: 'March–June 2022: the inflation spike (CPI 9.1%, oil $130s, M2 still hot)',
    cases: [
      { defId: 'us-cpi-yoy', asOf: '2022-06-30', note: 'the 9.1% cycle peak' },
      { defId: 'brent', asOf: '2022-03-08', note: 'the invasion spike, $133 close' },
      { defId: 'us10y', asOf: '2022-06-14', note: 'yields crossing 3.4% as the Fed hiked' },
      { defId: 'm2-us', asOf: '2022-06-01', note: 'money growth rolling over' },
      { defId: 'vix', asOf: '2022-06-16', note: 'the pre-recession fear bump' },
    ],
  },
];

/** Monthly for older history, daily inside the change windows (~4 months). */
function downsample(series: readonly SeriesPoint[], asOf: string, dailyWindowDays = 120): [string, number][] {
  const dailyStart = new Date(Date.parse(`${asOf}T00:00:00Z`) - dailyWindowDays * 86_400_000).toISOString().slice(0, 10);
  const out: [string, number][] = [];
  let lastMonth = '';
  for (const p of series) {
    if (p.date > asOf) break;
    if (p.date >= dailyStart) {
      out.push([p.date, p.value]);
      continue;
    }
    const month = p.date.slice(0, 7);
    if (month !== lastMonth) {
      out.push([p.date, p.value]);
      lastMonth = month;
    }
  }
  return out;
}

const chinaPmi = parseManualSeries(
  JSON.parse(readFileSync(new URL('data/manual/china-pmi.json', repoRoot), 'utf8')),
  'china-pmi',
);

console.log('[regression] fetching live sources…');
const { inputs } = await collectAllSources();
const series = buildIndicatorSeries({ ...inputs, chinaPmi });

const episodes: RegressionEpisode[] = [];
for (const cut of CUTS) {
  const cases = [];
  for (const c of cut.cases) {
    const full = series[c.defId];
    if (full === undefined || full.length === 0) {
      console.warn(`[regression] SKIP ${cut.id}/${c.defId}: no live series`);
      continue;
    }
    const points = downsample(full, c.asOf);
    if (points.length < 10) {
      console.warn(`[regression] SKIP ${cut.id}/${c.defId}: too few points before ${c.asOf}`);
      continue;
    }
    const def = DEFINITIONS.find((d) => d.id === c.defId)!;
    const source = READING_SOURCES[c.defId] ?? { name: def.sourceRef };
    const reading = computeReading(def, points.map(([date, value]) => ({ date, value })), `${c.asOf}T00:00:00Z`, source);
    cases.push({ defId: c.defId, points, asOf: c.asOf, expected: reading.status });
    console.log(`[regression] ${cut.id}/${c.defId} @ ${c.asOf}: ${reading.status} (value ${reading.value}) — ${c.note}`);
  }
  episodes.push({ id: cut.id, description: cut.description, cases });
}

writeFileSync(outPath, `${JSON.stringify({ version: 1, episodes }, null, 1)}\n`);
console.log(`[regression] wrote ${episodes.length} episodes (${episodes.reduce((n, e) => n + e.cases.length, 0)} cases) to ${outPath}`);
