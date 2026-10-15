/**
 * safety-demo.ts — fix spec A-03/A-04 + Part D proof (2026-10-15).
 *
 * The operator demo the spec asks for: deliberately break one input on the
 * REAL pipeline (live fetch → series → validation → publish decision) and
 * show the card is flagged and the bad value never reaches the published
 * page. Three breaks, one run:
 *
 *   A. Duplicate monthly value — the B-02 "+0.00% since previous release"
 *      bug class: a fake M2 print repeats the previous observation with a
 *      new date. T-08 must flag it; the published card must hold its last
 *      good observation (check-pending) and never show the fake date.
 *   B. Failed source — A-04: the US 10-year series vanishes (exactly what
 *      a failed FRED fetch leaves in `inputs`). The published card must
 *      hold the last good reading marked STALE — never today's data — and
 *      the source row records the failure.
 *   C. Unverified peak — T-05: a stored peak below the confirmed record
 *      floor. The peak claim must be stripped (the value stays).
 *
 * Run: pnpm --filter @currena/insights safety-demo   (no KV writes, ever)
 */

import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { CalendarEventSchema, type CalendarEvent } from '@currena/core';
import {
  buildIndicatorSeries,
  collectAllSources,
  computeHighestSinceYear,
  computePeaks,
  parseManualSeries,
  parsePolicyDecisions,
  parseReleaseSchedule,
} from '../src/adapters/index';
import { buildInsightsSnapshot } from '../src/adapters/snapshot';
import { runValidationSuite } from '../src/validation';
import type { IndicatorId } from '@currena/core';
import type { SeriesPoint } from '../src/series';

const nowIso = new Date().toISOString();
const repoRoot = new URL('../../../', import.meta.url);

function loadJsonFile(url: URL): unknown | undefined {
  try {
    return JSON.parse(readFileSync(url, 'utf8'));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw err;
  }
}

const calendar: CalendarEvent[] = z.array(CalendarEventSchema).parse(loadJsonFile(new URL('data/insights-calendar.json', repoRoot)) ?? []);
const chinaPmi = parseManualSeries(loadJsonFile(new URL('data/manual/china-pmi.json', repoRoot))!, 'china-pmi');
const releaseSchedule = parseReleaseSchedule(loadJsonFile(new URL('data/insights-release-schedule.json', repoRoot))!);
const policyDecisions = parsePolicyDecisions(loadJsonFile(new URL('data/policy-decisions.json', repoRoot))!);

console.log(`# Safety demo — ${nowIso}\n`);
console.log('[demo] fetching live sources (same pipeline as the ingest)…');
const { inputs, reports } = await collectAllSources();
const failedSources = reports.filter((r) => !r.ok);
console.log(`[demo] sources: ${reports.length - failedSources.length} ok, ${failedSources.length} failed${failedSources.length > 0 ? ` (${failedSources.map((r) => r.source).join(', ')})` : ''}\n`);

const series = buildIndicatorSeries({ ...inputs, chinaPmi });
const peaks = computePeaks(inputs, series.brent);
const highestSince: Partial<Record<IndicatorId, number>> = {};
for (const id of ['us10y', 'us30y', 'real-yield-10y', 'au-10y'] as IndicatorId[]) {
  const full = series[id];
  if (full && full.length > 1) {
    const year = computeHighestSinceYear(full);
    if (year !== undefined) highestSince[id] = year;
  }
}

const buildArgs = {
  series,
  calendar,
  releaseSchedule,
  fedTargetUpper: inputs.fred.DFEDTARU,
  policyDecisions,
  peaks,
  highestSince,
  now: nowIso,
} as const;

/* ------------------------------------------------------------------ *
 * Baseline — the pipeline as the ingest runs it (no breaks)
 * ------------------------------------------------------------------ */
const baseline = buildInsightsSnapshot({ ...buildArgs });
const baselineSuite = runValidationSuite({ series, readings: baseline.readings, calendar, now: nowIso, breakeven10y: inputs.fred.T10YIE });
console.log('## Baseline (no breaks)');
for (const r of baselineSuite.results) console.log(`  ${r.ok ? '✅' : '❌'} ${r.test}`);
const baselineOk = baselineSuite.results.every((r) => r.ok);
console.log(`  suite: ${baselineOk ? 'green — publishable' : 'flagged'}\n`);

let demosFailed = 0;
const check = (label: string, ok: boolean, detail: string) => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) demosFailed += 1;
};

/* ------------------------------------------------------------------ *
 * A. Duplicate monthly value (B-02 / T-08 / A-03)
 * ------------------------------------------------------------------ */
console.log('## Demo A — duplicate monthly value (the "+0.00% since previous release" bug class)');
{
  const m2 = series['m2-us']!;
  const last = m2[m2.length - 1]!;
  const duplicate: SeriesPoint = { date: '2026-09-01', value: last.value };
  const broken = { ...series, 'm2-us': [...m2, duplicate] };
  const draft = buildInsightsSnapshot({ ...buildArgs, series: broken, previous: baseline });
  const suite = runValidationSuite({ series: broken, readings: draft.readings, calendar, now: nowIso, breakeven10y: inputs.fred.T10YIE });
  const t08 = suite.results.find((r) => r.test === 'T-08')!;
  console.log(`  T-08: ${t08.ok ? '❌ NOT flagged (BUG)' : 'flagged'}${t08.failures.length > 0 ? ` — ${t08.failures[0]}` : ''}`);

  // The published snapshot: the same flags the ingest would apply.
  const published = buildInsightsSnapshot({ ...buildArgs, series: broken, previous: baseline, flags: suite.flags });
  const pub = published.readings.find((r) => r.id === 'm2-us')!;
  const fakeReachedPage = pub.asOf === '2026-09-01' || pub.value !== baseline.readings.find((r) => r.id === 'm2-us')!.value;
  check('the duplicate is flagged check-pending', pub.status === 'check-pending', `status=${pub.status}, reason="${pub.flag?.reason ?? ''}"`);
  check('the fake 2026-09-01 print never reaches the page', !fakeReachedPage, `published asOf=${pub.asOf}, value=${pub.value}`);
}
console.log('');

/* ------------------------------------------------------------------ *
 * B. Failed source (A-04) — the series vanishes from the inputs
 * ------------------------------------------------------------------ */
console.log('## Demo B — failed source (A-04: hold the last good value, never today\'s date)');
{
  const broken = { ...series } as Partial<Record<IndicatorId, SeriesPoint[]>>;
  delete broken.us10y;
  const published = buildInsightsSnapshot({ ...buildArgs, series: broken, previous: baseline });
  const pub = published.readings.find((r) => r.id === 'us10y')!;
  const good = baseline.readings.find((r) => r.id === 'us10y')!;
  const freshData = pub.asOf === nowIso.slice(0, 10);
  check('the card holds its last good value marked stale', pub.status === 'stale' && pub.value === good.value && pub.asOf === good.asOf, `status=${pub.status}, asOf=${pub.asOf} (last good date), value=${pub.value}`);
  check('the missing source is never shown as today\'s data', !freshData, `asOf=${pub.asOf} vs today ${nowIso.slice(0, 10)}`);
  if (failedSources.length > 0) {
    console.log(`  (live evidence this venue: ${failedSources.map((r) => `${r.source} — ${r.detail.slice(0, 60)}…`).join('; ')})`);
  }
}
console.log('');

/* ------------------------------------------------------------------ *
 * C. Unverified peak (T-05) — the peak claim is stripped, the value stays
 * ------------------------------------------------------------------ */
console.log('## Demo C — unverified peak (T-05: strip the claim, keep the reading)');
{
  const badPeaks = { ...peaks, 'gold-usd': { value: 4100, date: '2026-09-20', basis: 'daily-high' as const } };
  const draft = buildInsightsSnapshot({ ...buildArgs, peaks: badPeaks });
  const suite = runValidationSuite({ series, readings: draft.readings, calendar, now: nowIso, breakeven10y: inputs.fred.T10YIE });
  const t05 = suite.results.find((r) => r.test === 'T-05')!;
  console.log(`  T-05: ${t05.ok ? '❌ NOT flagged (BUG)' : 'flagged'}${t05.failures.length > 0 ? ` — ${t05.failures[0]}` : ''}`);
  const published = buildInsightsSnapshot({ ...buildArgs, peaks: badPeaks, flags: suite.flags });
  const pub = published.readings.find((r) => r.id === 'gold-usd')!;
  check('the below-record peak claim is stripped from the card', pub.peak === undefined && pub.fromPeak10y === undefined, `peak=${pub.peak ? 'still present' : 'removed'}`);
  check('the price itself still publishes', pub.value !== null, `value=${pub.value}, status=${pub.status}`);
}
console.log('');

console.log(demosFailed === 0 ? '## Safety demo: ALL CHECKS PASS' : `## Safety demo: ${demosFailed} CHECK(S) FAILED`);
process.exit(demosFailed === 0 ? 0 : 1);
