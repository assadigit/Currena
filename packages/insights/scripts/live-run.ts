/**
 * Phase I2 "manual one-off live run" (roadmap exit criterion) — fetches every
 * source live, assembles all indicator series exactly as the future ingestion
 * runner will, computes readings with the Phase I1 scoring engine and prints
 * a sanity table for every indicator (P1 rows marked).
 *
 * This is a MANUAL script (like the backtest): it hits live sites by design,
 * is never part of the test suite, and writes NOTHING — no KV, no files.
 * A source that fails prints its failure and the affected indicators go
 * `unavailable`/`stale` in the table — never wrong data.
 *
 * Run: pnpm --filter @currena/insights live-run
 * RBA note: rba.gov.au is Akamai-blocked from the build sandbox
 * (docs/insights/03-data-sources.md) — the RBA rows fail loudly here and
 * go unavailable; from the GitHub Actions ingestion venue they are live
 * (verified 2026-10-06, probe run 37492764171 on branch probe/i2-rba-venue).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';

import { DEFINITIONS, computeReading, summarize } from '../src/index';
import {
  ABS_SERIES,
  buildIndicatorSeries,
  fetchAbsSeries,
  fetchBitstampCloses,
  fetchFrankfurterSeries,
  fetchFredSeries,
  fetchGoldApiSpot,
  fetchRbaSeries,
  fetchTgjuGoldOunce,
  fetchWorldBankMonthly,
  FRED_SERIES,
  READING_SOURCES,
  type SeriesInputs,
} from '../src/adapters/index';
import type { SeriesPoint } from '../src/series';

const FX_START = '2016-01-04'; // 10y percentile window + buffer
const now = new Date();
const nowIso = now.toISOString();
const today = nowIso.slice(0, 10);

/* ------------------------------------------------------------------ *
 * Fetch phase — per-source try/catch; failures recorded, never fatal
 * ------------------------------------------------------------------ */

interface SourceReport {
  source: string;
  ok: boolean;
  detail: string;
}

const reports: SourceReport[] = [];
const report = (source: string, ok: boolean, detail: string) => reports.push({ source, ok, detail });

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function fetchLogged<T>(source: string, label: string, fn: () => Promise<T>): Promise<T | undefined> {
  try {
    const value = await fn();
    report(source, true, label);
    return value;
  } catch (err) {
    report(source, false, `${label}: ${errMessage(err)}`);
    return undefined;
  }
}

console.log(`# Insights live run — ${nowIso}`);
console.log();

// FRED (10 series, keyless fredgraph.csv, full history) — keyed by SERIES ID
// (T10Y2Y, STLFSI4, …), the convention buildIndicatorSeries expects.
const fred: Partial<Record<string, SeriesPoint[]>> = {};
for (const seriesId of Object.values(FRED_SERIES)) {
  const series = await fetchLogged('fred', seriesId, () => fetchFredSeries(seriesId));
  if (series) fred[seriesId] = series;
}

// Frankfurter (USD→JPY/AUD/CNY since 2016)
const fx = await fetchLogged('frankfurter', `USD→JPY,AUD,CNY since ${FX_START}`, () =>
  fetchFrankfurterSeries(FX_START),
);

// World Bank Pink Sheet monthly
const wb = await fetchLogged('world-bank', 'Pink Sheet monthly workbook', () => fetchWorldBankMonthly());

// gold-api.com spots
const xagSpot = await fetchLogged('gold-api', 'XAG spot', () => fetchGoldApiSpot('XAG'));
const btcSpot = await fetchLogged('gold-api', 'BTC spot', () => fetchGoldApiSpot('BTC'));
const xauSpot = await fetchLogged('gold-api', 'XAU spot (cross-check)', () => fetchGoldApiSpot('XAU'));

// TGJU gold ounce (USD)
const tgjuGold = await fetchLogged('tgju', "gold ounce 'ons' (USD)", () => fetchTgjuGoldOunce());

// ABS (5 series, keyless SDMX CSV) — typed as SeriesInputs['abs'] (writable
// optional fields; a mapped type over the const ABS_SERIES would be readonly).
const absSeries: NonNullable<SeriesInputs['abs']> = {};
for (const [name, key] of Object.entries(ABS_SERIES) as [keyof typeof ABS_SERIES, string][]) {
  const series = await fetchLogged('abs', key, () => fetchAbsSeries(key));
  if (series) absSeries[name] = series;
}

// Bitstamp (sanity cross-check against gold-api BTC)
const bitstamp = await fetchLogged('bitstamp', 'btcusd last 10 daily candles', () =>
  fetchBitstampCloses('btcusd', { limit: 10 }),
);

// RBA (venue-dependent: rba.gov.au is Akamai-blocked from the build sandbox
// but was verified HTTP 200 from the GitHub Actions runner 2026-10-06 —
// from the sandbox these rows read as fetch failures, from the runner live).
const rbaCashRate = await fetchLogged('rba', 'F1.1 Cash Rate Target', () => fetchRbaSeries('cashRate'));
const rbaAu10y = await fetchLogged('rba', 'F2 Australian Government 10 year bond', () => fetchRbaSeries('au10y'));
const rbaHouseholdDebt = await fetchLogged('rba', 'E2 Household debt to income', () =>
  fetchRbaSeries('householdDebtToIncome'),
);

// XAU cross-check note
if (tgjuGold && xauSpot) {
  const drift = ((tgjuGold.price - xauSpot.price) / xauSpot.price) * 100;
  report(
    'cross-check',
    Math.abs(drift) < 2,
    `TGJU gold ounce ${tgjuGold.price.toFixed(2)} vs gold-api XAU ${xauSpot.price.toFixed(2)} → ${drift.toFixed(2)}%`,
  );
}
if (bitstamp && btcSpot) {
  const last = bitstamp.at(-1)!;
  const drift = ((btcSpot.price - last.value) / last.value) * 100;
  report(
    'cross-check',
    Math.abs(drift) < 3,
    `gold-api BTC ${btcSpot.price.toFixed(0)} vs Bitstamp close ${last.value.toFixed(0)} (${last.date}) → ${drift.toFixed(2)}%`,
  );
}

/* ------------------------------------------------------------------ *
 * Assemble + score
 * ------------------------------------------------------------------ */

const inputs: SeriesInputs = {
  today,
  fred,
  fx: { JPY: fx?.JPY, AUD: fx?.AUD, CNY: fx?.CNY },
  wb,
  tgjuGoldOunceUsd: tgjuGold?.price,
  xagSpot,
  btcSpot,
  abs: absSeries,
  rba: { cashRate: rbaCashRate, au10y: rbaAu10y, householdDebtRatio: rbaHouseholdDebt },
};
const series = buildIndicatorSeries(inputs);

const readings: IndicatorReading[] = [];
for (const def of DEFINITIONS) {
  const s = series[def.id];
  const src = READING_SOURCES[def.id] ?? { name: def.sourceRef };
  if (!s) {
    // Mirror computeReading's unavailable shape for absent series.
    const unavailable: IndicatorReading = {
      id: def.id,
      value: null,
      asOf: null,
      status: 'unavailable',
      sourceName: src.name,
      sourceUrl: src.url,
      updatedAt: nowIso,
    };
    readings.push(unavailable);
    continue;
  }
  readings.push(computeReading(def, s, nowIso, src));
}

const summary = summarize(readings);

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

function fmt(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined) return '—';
  const abs = Math.abs(n);
  return n.toFixed(abs >= 1000 ? 0 : abs >= 100 ? 1 : digits);
}

const defById = new Map(DEFINITIONS.map((d) => [d.id as string, d]));

console.log('## Source fetch report');
console.log();
console.log('| Source | OK | Detail |');
console.log('|---|---|---|');
for (const r of reports) {
  console.log(`| ${r.source} | ${r.ok ? '✅' : '❌'} | ${r.detail.replace(/\|/g, '\\|')} |`);
}
console.log();

console.log('## Indicator readings (the sanity table)');
console.log();
console.log('| Phase | Indicator | Value | As of | 10y pct | 7d | 30d | Status |');
console.log('|---|---|---|---|---|---|---|---|');
for (const r of readings) {
  const def = defById.get(r.id)!;
  const name = def.name;
  console.log(
    `| ${def.phase} | ${name} | ${r.value === null ? '—' : fmt(r.value)} | ${r.asOf ?? '—'} | ${
      r.percentile10y === undefined ? '—' : `${(r.percentile10y * 100).toFixed(0)}%`
    } | ${fmt(r.change7d, 1)} | ${fmt(r.change30d, 1)} | ${r.status} |`,
  );
}
console.log();

console.log('## Summary lines');
console.log();
console.log(
  `- **Global:** ${summary.global.label ?? 'no label'} — ${summary.global.warningCount}/${summary.global.votingCount} voting in warning (${summary.global.excludedCount} excluded).`,
);
console.log(
  `- **Australia:** ${summary.australia.label ?? 'no label'} — ${summary.australia.warningCount}/${summary.australia.votingCount} voting in warning (${summary.australia.excludedCount} excluded).`,
);
console.log();

const p1Ids: IndicatorId[] = DEFINITIONS.filter((d) => d.phase === 'P1').map((d) => d.id);
const p1Missing: IndicatorId[] = p1Ids.filter((id) => {
  const r = readings.find((x) => x.id === id);
  return !r || r.status === 'unavailable';
});
const rbaBlocked: IndicatorId[] = p1Missing.filter((id) => id === 'rba-cash-rate' || id === 'au-us-10y-gap');
const otherMissing: IndicatorId[] = p1Missing.filter((id) => !rbaBlocked.includes(id));

console.log('## Exit-criterion verdict (P1)');
console.log();
if (otherMissing.length === 0 && rbaBlocked.length === 0) {
  console.log('**P1 COMPLETE** — every P1 indicator printed a sane live value.');
} else {
  if (rbaBlocked.length > 0) {
    console.log(
      `**P1 pending venue** — ${rbaBlocked.join(', ')} await the RBA venue probe (expected outside the sandbox).`,
    );
  }
  if (otherMissing.length > 0) {
    console.log(`**P1 INCOMPLETE** — no value for: ${otherMissing.join(', ')}.`);
  }
}
console.log();
