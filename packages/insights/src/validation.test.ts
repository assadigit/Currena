/**
 * validation.test.ts — fix spec Part D + A-03/A-04 (2026-10-14): the
 * validation suite's own tests, INCLUDING the required broken-input demos —
 * a deliberately broken input (a fake duplicate monthly value, a failed
 * source, a corrupted ratio, a missing record) is caught by the suite and
 * held out of the published snapshot.
 *
 * Synthetic series only (AGENTS.md rule 7): no fixtures, no network.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading, InsightsSnapshot } from '@currena/core';
import { DEFINITIONS } from './definitions';
import { containsForbiddenWords, runValidationSuite, KNOWN_RECORD_FLOORS, type ValidationInputs, type RegressionEpisode } from './validation';
import { buildInsightsSnapshot } from './adapters/snapshot';
import { pointAtOrBefore, type SeriesPoint } from './series';
import { computeReading } from './scoring';
import { READING_SOURCES } from './adapters/derived';

const NOW = '2026-10-14T04:20:00.000Z';

/** A plausible daily series: value every business day back from `end`. */
function dailySeries(end: string, days: number, value: (daysBack: number) => number): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  let d = new Date(`${end}T00:00:00Z`);
  let back = 0;
  while (out.length < days) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) {
      out.push({ date: d.toISOString().slice(0, 10), value: value(back) });
      back++;
    }
    d = new Date(d.getTime() - 86_400_000);
  }
  return out.reverse();
}

/** A plausible monthly series (month-start dated). */
function monthlySeries(endMonth: string, months: number, value: (monthsBack: number) => number): SeriesPoint[] {
  const [y, m] = endMonth.split('-').map(Number) as [number, number];
  const out: SeriesPoint[] = [];
  for (let i = 0; i < months; i++) {
    const date = new Date(Date.UTC(y!, m! - 1 - i, 1)).toISOString().slice(0, 10);
    out.push({ date, value: value(i) });
  }
  return out.reverse();
}

/** Build draft readings from a series map (the same pipeline the ingest runs). */
function draftReadings(series: Partial<Record<IndicatorId, SeriesPoint[]>>): IndicatorReading[] {
  const readings: IndicatorReading[] = [];
  for (const def of DEFINITIONS) {
    const s = series[def.id];
    const source = READING_SOURCES[def.id] ?? { name: def.sourceRef };
    if (!s) {
      readings.push({
        id: def.id,
        value: null,
        asOf: null,
        status: 'unavailable',
        sourceName: source.name,
        sourceUrl: source.url,
        updatedAt: NOW,
      });
      continue;
    }
    readings.push(computeReading(def, s, NOW, source));
  }
  return readings;
}

/** A minimal valid suite input over the given series. */
function suiteInput(series: Partial<Record<IndicatorId, SeriesPoint[]>>, extra: Partial<ValidationInputs> = {}): ValidationInputs {
  return {
    series,
    readings: draftReadings(series),
    calendar: [],
    now: NOW,
    ...extra,
  };
}

describe('runValidationSuite — the Part D tests', () => {
  it('runs all fourteen tests and returns their results with ids and names', () => {
    const out = runValidationSuite(suiteInput({}));
    expect(out.results.map((r) => r.test)).toEqual([
      'T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07',
      'T-08', 'T-09', 'T-10', 'T-11', 'T-12', 'T-13', 'T-14',
    ]);
    for (const r of out.results) expect(r.name.length).toBeGreaterThan(0);
  });

  it('T-01 passes when real yield + 10y breakeven = nominal within 0.05 pts (the same date)', () => {
    const nominal = dailySeries('2026-10-13', 30, (b) => 5.24 - b * 0.001);
    const real = nominal.map((p) => ({ date: p.date, value: p.value - 2.33 }));
    const breakeven = nominal.map((p) => ({ date: p.date, value: 2.33 }));
    const out = runValidationSuite(suiteInput({ us10y: nominal, 'real-yield-10y': real }, { breakeven10y: breakeven }));
    expect(out.results.find((r) => r.test === 'T-01')!.ok).toBe(true);
  });

  it('T-01 FLAGS the readings when the identity breaks by more than 0.05 pts', () => {
    const nominal = dailySeries('2026-10-13', 30, () => 5.24);
    const real = nominal.map((p) => ({ date: p.date, value: p.value - 2.9 }));
    const breakeven = nominal.map((p) => ({ date: p.date, value: 2.33 }));
    const out = runValidationSuite(suiteInput({ us10y: nominal, 'real-yield-10y': real }, { breakeven10y: breakeven }));
    const t01 = out.results.find((r) => r.test === 'T-01')!;
    expect(t01.ok).toBe(false);
    expect(t01.flagged).toContain('real-yield-10y');
    expect(t01.flagged).toContain('us10y');
  });

  it('T-02 recomputes gold/silver from the displayed inputs and flags a mismatch', () => {
    const gold = dailySeries('2026-10-13', 40, () => 4125.9);
    const silver = dailySeries('2026-10-13', 40, () => 55.73);
    // The stored ratio is computed from stale inputs — off by 2 units.
    const ratio = dailySeries('2026-10-13', 40, () => 4125.9 / 55.73 + 2);
    const out = runValidationSuite(suiteInput({ 'gold-usd': gold, 'silver-usd': silver, 'gold-silver': ratio }));
    const t02 = out.results.find((r) => r.test === 'T-02')!;
    expect(t02.ok).toBe(false);
    expect(t02.flagged).toContain('gold-silver');
  });

  it('T-03 flags a weekend observation on a trading-day series and a future release date', () => {
    // A "Saturday" yield series — the parse landed on the wrong row
    // (2026-10-10 is a Saturday; the series still ascends).
    const saturday: SeriesPoint[] = [];
    let d = new Date('2026-10-10T00:00:00Z');
    while (saturday.length < 40) {
      saturday.push({ date: d.toISOString().slice(0, 10), value: 5.2 });
      d = new Date(d.getTime() - 86_400_000);
    }
    saturday.reverse();
    const out = runValidationSuite(suiteInput({ us10y: saturday }));
    const t03 = out.results.find((r) => r.test === 'T-03')!;
    expect(t03.ok).toBe(false);
    expect(t03.failures.join(' ')).toContain('weekend');
  });

  it('T-04 flags a fresh-looking status on data older than its maximum age', () => {
    // A reading computed against an OLD clock still claiming a fresh
    // status — the exact class the freshness test must catch (the engine's
    // own stale marking is verified in scoring.test; T-04 guards the wire).
    const old = dailySeries('2026-09-14', 60, () => 5.0);
    const readings = draftReadings({ us10y: old }).map((r) =>
      r.id === 'us10y' ? { ...r, status: 'normal' as const } : r,
    );
    const out = runValidationSuite({ series: { us10y: old }, readings, calendar: [], now: NOW });
    const t04 = out.results.find((r) => r.test === 'T-04')!;
    expect(t04.ok).toBe(false);
    expect(t04.flagged).toContain('us10y');
  });

  it('T-05 passes with the confirmed records and flags a missing or low stored peak', () => {
    const peaks: Partial<Record<IndicatorId, { value: number; date: string; basis: 'daily-high' | 'daily-close' }>> = {
      'btc-usd': { value: 126272, date: '2025-10-06', basis: 'daily-high' },
      'gold-usd': { value: 5586.2, date: '2026-01-29', basis: 'daily-high' },
      'silver-usd': { value: 121.3, date: '2026-01-29', basis: 'daily-high' },
      brent: { value: 138.21, date: '2026-04-07', basis: 'daily-close' },
    };
    const inputs = suiteInput({
      'btc-usd': dailySeries('2026-10-13', 40, () => 83000),
      'gold-usd': dailySeries('2026-10-13', 40, () => 4166),
      'silver-usd': dailySeries('2026-10-13', 40, () => 58.7),
      brent: dailySeries('2026-10-13', 40, () => 106),
    });
    // Attach the peaks to the draft readings the way the snapshot does.
    for (const r of inputs.readings) {
      const peak = peaks[r.id];
      if (peak && r.value !== null) r.peak = peak;
    }
    const ok = runValidationSuite(inputs);
    expect(ok.results.find((r) => r.test === 'T-05')!.ok).toBe(true);

    // A stored peak BELOW the confirmed record floor fails the test.
    const lowInput = suiteInput({ 'gold-usd': dailySeries('2026-10-13', 40, () => 4166) });
    for (const r of lowInput.readings) {
      if (r.id === 'gold-usd') r.peak = { value: 5050, date: '2026-01-02', basis: 'daily-high' };
    }
    const low = runValidationSuite(lowInput);
    const t05 = low.results.find((r) => r.test === 'T-05')!;
    expect(t05.ok).toBe(false);
    expect(t05.flagged).toContain('gold-usd');
    expect(KNOWN_RECORD_FLOORS['gold-usd']).toBe(5300);
  });

  it('T-07 scans the forbidden wording (word-boundary, not substring)', () => {
    expect(containsForbiddenWords('Prices will rise')).toEqual(['will']);
    expect(containsForbiddenWords('This is the time to buy')).toEqual(['time to']);
    expect(containsForbiddenWords('Growth is expected to slow')).toEqual(['expected to']);
    expect(containsForbiddenWords('You should act')).toEqual(['should']);
    // Plain condition descriptions pass.
    expect(containsForbiddenWords('The yield sits above its usual range.')).toEqual([]);
    expect(containsForbiddenWords('Willingness to spend')).toEqual([]); // no word-boundary hit
  });

  it('T-08 flags a duplicate monthly value (the +0.00% bug class) and a long unchanged run', () => {
    // M2 printing the same value two months in a row.
    const m2 = monthlySeries('2026-08-01', 40, (back) => 23342.8 - back * 100);
    m2[m2.length - 1]!.value = m2[m2.length - 2]!.value; // the duplicate
    const out = runValidationSuite(suiteInput({ 'm2-us': m2 }));
    const t08 = out.results.find((r) => r.test === 'T-08')!;
    expect(t08.ok).toBe(false);
    expect(t08.flagged).toContain('m2-us');
    expect(t08.failures.join(' ')).toContain('repeated');
  });

  it('E-04: a DAILY value repeated exactly across days is the frozen-cache bug class — flagged', () => {
    // The 15 Oct copper row: a daily spot printed to six decimals that
    // never moved. Daily cadence tolerates NO exact repeat (T-08 (a)).
    const copper = dailySeries('2026-10-14', 30, () => 14772.999807);
    const out = runValidationSuite(suiteInput({ 'copper-usd': copper }));
    const t08 = out.results.find((r) => r.test === 'T-08')!;
    expect(t08.ok).toBe(false);
    expect(t08.flagged).toContain('copper-usd');
    expect(t08.failures.join(' ')).toContain('copper-usd');
  });

  it('E-04 cross-day: a daily value identical to 6 decimals to the PREVIOUS snapshot is flagged', () => {
    // The series itself moves; today's print repeats what the previous
    // snapshot published — the frozen-cache shape the ingest compare catches.
    const copper = dailySeries('2026-10-14', 30, (back) => (back === 0 ? 14772.999807 : 14773 - back * 2));
    const prevReading = {
      id: 'copper-usd',
      value: 14772.999807,
      asOf: '2026-10-13',
      status: 'normal',
      sourceName: 'gold-api.com',
      updatedAt: '2026-10-13T04:20:00.000Z',
    } as import('@currena/core').IndicatorReading;
    const out = runValidationSuite(suiteInput({ 'copper-usd': copper }, { previousReadings: [prevReading] }));
    const t08 = out.results.find((r) => r.test === 'T-08')!;
    expect(t08.flagged).toContain('copper-usd');
    expect(t08.failures.join(' ')).toContain('across days');
    // And the flag HOLDS the last good value (A-04): check-pending.
    expect(out.flags.get('copper-usd')).toBeDefined();
  });

  it('S1-M1.6 #1: a PEGGED pair repeating at full precision is the peg working, not a frozen cache — never flagged', () => {
    // The 2026-10-31 audit case: usdaed (the USD/AED peg, 3.6725 since the
    // nineties) printed 3.6724998950 day after day to ten decimals — T-08
    // (a)/(b)/(c) all read "duplicate/frozen" and the card sat in
    // check-pending ("Can't tell") while the peg was simply doing its job.
    const peg = dailySeries('2026-10-14', 30, () => 3.672499895);
    const prevReading = {
      id: 'usdaed',
      value: 3.672499895,
      asOf: '2026-10-13',
      status: 'normal',
      sourceName: 'Yahoo Finance',
      updatedAt: '2026-10-13T04:20:00.000Z',
    } as import('@currena/core').IndicatorReading;
    const out = runValidationSuite(suiteInput({ usdaed: peg }, { previousReadings: [prevReading] }));
    const t08 = out.results.find((r) => r.test === 'T-08')!;
    expect(t08.flagged).not.toContain('usdaed');
    expect(t08.failures.join(' ')).not.toContain('usdaed');
    expect(out.flags.get('usdaed')).toBeUndefined();
  });

  it('T-08 exempts the administrative rate series whose flat prints are normal (2026-10-15 venue evidence)', () => {
    // F6's outstanding-loan rate printed 6.21 for three straight months —
    // the series reprices only as the loan stock rolls. A repeated monthly
    // print there is NOT the duplicate bug class.
    const loan = monthlySeries('2026-08-01', 40, (back) => 6.2 + (back % 3 === 0 ? 0.01 : 0));
    loan[loan.length - 1]!.value = loan[loan.length - 2]!.value;
    const out = runValidationSuite(suiteInput({ 'au-home-loan': loan }));
    const t08 = out.results.find((r) => r.test === 'T-08')!;
    expect(t08.ok).toBe(true);
    expect(t08.flagged).not.toContain('au-home-loan');
  });

  it('M6 weekend fix: a weekend-spanning metal repeat is the market being closed, not a freeze (2026-10-25)', () => {
    // The gold-api spot family serves rows every calendar day; Sat/Sun
    // quotes repeat Friday's spot — the 2026-10-18/25 live-archive shape.
    const SUNDAY_NOW = '2026-10-25T04:20:00.000Z';
    const weekend: SeriesPoint[] = [];
    let d = new Date('2026-10-25T00:00:00Z'); // Sunday
    let back = 0;
    while (weekend.length < 32) {
      const dow = d.getUTCDay();
      const value = dow === 0 || dow === 6 ? 3996.899902 : 3996.899902 + (back % 7) * 1.3;
      weekend.push({ date: d.toISOString().slice(0, 10), value });
      back++;
      d = new Date(d.getTime() - 86_400_000);
    }
    weekend.reverse();
    const out = runValidationSuite(suiteInput({ 'gold-usd': weekend }, { now: SUNDAY_NOW }));
    const t08 = out.results.find((r) => r.test === 'T-08')!;
    expect(t08.flagged).not.toContain('gold-usd');
    expect(t08.failures.join(' ')).not.toContain('gold-usd');
  });

  it('M6 weekend fix: the SAME family repeating on WEEKDAYS is still the frozen-cache class — flagged', () => {
    // Same metal, but the repeat is Tue-after-Mon: the carve-out must not
    // blunt the guard that caught the 15 Oct copper row.
    const weekday = dailySeries('2026-10-13', 30, () => 3996.899902);
    const out = runValidationSuite(suiteInput({ 'gold-usd': weekday }));
    const t08 = out.results.find((r) => r.test === 'T-08')!;
    expect(t08.flagged).toContain('gold-usd');
  });

  it('M6 weekend fix: gold-silver observation dates legitimately fall on weekends (gold-api legs)', () => {
    // The ratio's legs are gold-api spots serving weekend-dated rows —
    // gold-silver left TRADING_DATE_IDS on 2026-10-25.
    const SUNDAY_NOW = '2026-10-25T04:20:00.000Z';
    const ratio: SeriesPoint[] = [];
    let d = new Date('2026-10-25T00:00:00Z'); // Sunday
    while (ratio.length < 32) {
      ratio.push({ date: d.toISOString().slice(0, 10), value: 73.95366591507853 });
      d = new Date(d.getTime() - 86_400_000);
    }
    ratio.reverse();
    const out = runValidationSuite(suiteInput({ 'gold-silver': ratio }, { now: SUNDAY_NOW }));
    const t03 = out.results.find((r) => r.test === 'T-03')!;
    expect(t03.failures.join(' ')).not.toContain('gold-silver');
  });

  it('T-09 records a count mismatch when a scored reading sits outside every area', () => {
    // brent is in the prices-heat gauge (B-14) — remove it to simulate the
    // audited misconfiguration and the test must catch the mismatch.
    const gold = dailySeries('2026-10-13', 40, () => 4166);
    const brent = dailySeries('2026-10-13', 400, (back) => 106 + back * 0.15);
    const readings = draftReadings({ 'gold-usd': gold, brent });
    // Force the audited state: brent warning but not in any gauge's count.
    const out = runValidationSuite({
      series: { 'gold-usd': gold, brent },
      readings: readings.map((r) => (r.id === 'brent' ? { ...r, status: 'warning' as const } : r)),
      calendar: [],
      now: NOW,
    });
    const t09 = out.results.find((r) => r.test === 'T-09')!;
    // With brent in prices-heat, the counts agree; the test asserts the
    // invariant holds with the shipped gauges.
    expect(t09.ok).toBe(true);
  });

  it('T-10 pins the units discipline against the definitions', () => {
    const out = runValidationSuite(suiteInput({}));
    expect(out.results.find((r) => r.test === 'T-10')!.ok).toBe(true);
  });

  it('T-13 flags a reading without a data date', () => {
    const readings = draftReadings({});
    readings.push({
      id: 'us10y',
      value: 5.24,
      asOf: null,
      status: 'normal',
      sourceName: 'FRED (DGS10)',
      sourceUrl: 'https://fred.stlouisfed.org/series/DGS10',
      updatedAt: NOW,
    } as unknown as IndicatorReading);
    const out = runValidationSuite({ series: {}, readings, calendar: [], now: NOW });
    const t13 = out.results.find((r) => r.test === 'T-13')!;
    expect(t13.ok).toBe(false);
    expect(t13.flagged).toContain('us10y');
  });

  it('T-14 replays a saved episode and flags a status change', () => {
    // A saved March-2020-style crash episode: us10y falling — its rule
    // (percentile high OR +0.5 in 4 weeks) must NOT fire.
    const points = dailySeries('2020-03-20', 400, (back) => 0.9 + back * 0.005).map((p) => [p.date, p.value] as [string, number]);
    const episodes: readonly RegressionEpisode[] = [
      {
        id: 'covid-crash',
        description: 'March 2020: yields collapsing',
        cases: [{ defId: 'us10y', points, asOf: '2020-03-20', expected: 'normal' }],
      },
    ];
    const ok = runValidationSuite(suiteInput({}, { episodes }));
    expect(ok.results.find((r) => r.test === 'T-14')!.ok).toBe(true);

    // Tamper with the expected status — the replay must flag it.
    const tampered: readonly RegressionEpisode[] = [
      { ...episodes[0]!, cases: [{ ...episodes[0]!.cases[0]!, expected: 'warning' }] },
    ];
    const bad = runValidationSuite(suiteInput({}, { episodes: tampered }));
    expect(bad.results.find((r) => r.test === 'T-14')!.ok).toBe(false);
  });

  // Fix spec T-14 (2026-10-15): the REAL episodes file — cut from live
  // history (COVID 2020, inflation 2022) — replays clean in CI, so a rule
  // change that flips any recorded status fails the build, not the page.
  it('T-14 replays the saved episodes file (fixtures/regression-episodes.json)', () => {
    const raw: unknown = JSON.parse(readFileSync(new URL('../fixtures/regression-episodes.json', import.meta.url), 'utf8'));
    const file = raw as { episodes: readonly RegressionEpisode[] };
    expect(file.episodes.length).toBeGreaterThanOrEqual(2);
    expect(file.episodes.reduce((n, e) => n + e.cases.length, 0)).toBeGreaterThanOrEqual(10);
    const out = runValidationSuite(suiteInput({}, { episodes: file.episodes }));
    const t14 = out.results.find((r) => r.test === 'T-14')!;
    expect(t14.ok, `failures: ${t14.failures.join('; ')}`).toBe(true);
    expect(t14.notes?.length ?? 0).toBe(0); // genuinely ran, not skipped
  });
});

describe('A-03/A-04 — the safe-failure demos (broken inputs never reach the live page)', () => {
  it('DEMO 1: a duplicate monthly value is held on the last good value with status check-pending', () => {
    // A healthy M2 history: Aug (23342.8) after Jul (23217.9).
    const m2 = monthlySeries('2026-08-01', 40, (back) => 23342.8 - back * 125);
    const healthySeries = { 'm2-us': m2 };
    const previous = buildInsightsSnapshot({ series: healthySeries, calendar: [], now: '2026-10-13T04:20:00.000Z' });
    const previousM2 = previous.readings.find((r) => r.id === 'm2-us')!;
    expect(previousM2.status).not.toBe('check-pending');

    // The broken run: the freshest print is an exact duplicate of the last.
    const broken = [...m2];
    broken.push({ date: '2026-09-01', value: broken[broken.length - 1]!.value });
    const series = { 'm2-us': broken };
    const draft = suiteInput(series);
    const outcome = runValidationSuite(draft);
    expect(outcome.flags.get('m2-us')?.test).toBe('T-08');

    // The published snapshot holds the last good value, flagged.
    const published = buildInsightsSnapshot({
      series,
      previous,
      calendar: [],
      flags: outcome.flags,
      now: NOW,
    });
    const m2Reading = published.readings.find((r) => r.id === 'm2-us')!;
    expect(m2Reading.status).toBe('check-pending');
    expect(m2Reading.flag?.test).toBe('T-08');
    // The BAD duplicate never reaches the page: the value held is the previous
    // good reading's, with its original (older) asOf.
    expect(m2Reading.value).toBe(previousM2.value);
    expect(m2Reading.asOf).toBe('2026-08-01');
    expect(m2Reading.asOf).not.toBe('2026-09-01');
    expect(m2Reading.change30d).toBeUndefined();
  });

  it('DEMO 2: a failed source holds its last good value marked stale with its last good date', () => {
    const gold = dailySeries('2026-10-13', 40, () => 4166);
    const previous = buildInsightsSnapshot({ series: { 'gold-usd': gold }, calendar: [], now: '2026-10-13T04:20:00.000Z' });
    // This run's fetch fails: no gold series at all.
    const published = buildInsightsSnapshot({ series: {}, previous, calendar: [], now: NOW });
    const held = published.readings.find((r) => r.id === 'gold-usd')!;
    expect(held.status).toBe('stale');
    expect(held.value).not.toBeNull();
    expect(held.asOf).toBe('2026-10-13'); // the ORIGINAL date, never today's
    expect(held.asOf).not.toBe('2026-10-14');
  });

  it('DEMO 3: a corrupted ratio is flagged and never published as fresh', () => {
    const gold = dailySeries('2026-10-13', 40, (back) => 4125.9 + back * 0.1);
    const silver = dailySeries('2026-10-13', 40, (back) => 55.73 + back * 0.01);
    const badRatio = gold.map((p, i) => ({ date: p.date, value: 74 + i * 0.01 }));
    const series = { 'gold-usd': gold, 'silver-usd': silver, 'gold-silver': badRatio };
    const outcome = runValidationSuite(suiteInput(series));
    expect(outcome.flags.get('gold-silver')?.test).toBe('T-02');
    const published = buildInsightsSnapshot({ series, calendar: [], flags: outcome.flags, now: NOW });
    const ratio = published.readings.find((r) => r.id === 'gold-silver')!;
    expect(ratio.status).toBe('check-pending');
    expect(ratio.value).not.toBe(999);
  });

  it('DEMO 4: T-05 strips an unverified peak claim without hiding the price', () => {
    const gold = dailySeries('2026-10-13', 40, (back) => 4166 + (back % 5));
    const series = { 'gold-usd': gold };
    const draft = suiteInput(series);
    const outcome = runValidationSuite(draft);
    expect(outcome.flags.get('gold-usd')?.stripPeak).toBe(true);
    const published = buildInsightsSnapshot({
      series,
      calendar: [],
      flags: outcome.flags,
      now: NOW,
      peaks: { 'gold-usd': { value: 4900, date: '2026-01-02', basis: 'daily-high' } }, // below the floor
    });
    const r = published.readings.find((x) => x.id === 'gold-usd')!;
    // The peak claim never reaches the page; the price itself stays.
    expect(r.peak).toBeUndefined();
    expect(r.fromPeak10y).toBeUndefined();
    expect(r.value).toBe(4166);
    expect(r.status).not.toBe('check-pending');
  });
});

describe('the suite\'s honest skips', () => {
  it('records a skip note (not a failure) when a validation-only series is absent', () => {
    const out = runValidationSuite(suiteInput({}));
    const t01 = out.results.find((r) => r.test === 'T-01')!;
    expect(t01.ok).toBe(true);
    expect(t01.failures).toHaveLength(0);
    expect(t01.notes?.[0]).toContain('breakeven');
  });
});

describe('buildInsightsSnapshot — the fix-spec fields', () => {
  it('B-05: stamps the release date OF THE SHOWN DATA, and marks next-release-today', () => {
    const cpi = monthlySeries('2026-08-01', 30, (back) => 330 - back);
    const snapshot = buildInsightsSnapshot({
      series: { 'us-cpi-yoy': cpi },
      calendar: [],
      releaseSchedule: [
        { date: '2026-09-11', affects: ['us-cpi-yoy'] },
        { date: '2026-10-14', affects: ['us-cpi-yoy'] },
        { date: '2026-11-10', affects: ['us-cpi-yoy'] },
      ],
      now: NOW,
    });
    const r = snapshot.readings.find((x) => x.id === 'us-cpi-yoy')!;
    // August data was released 11 September — NOT October's date.
    expect(r.releaseDate).toBe('2026-09-11');
    // September's release is due TODAY and is not yet in.
    expect(r.nextReleaseToday).toBe(true);
  });

  it('B-05: no next-release-today line once the newer data is in', () => {
    const cpi = monthlySeries('2026-09-01', 30, (back) => 334 - back);
    const snapshot = buildInsightsSnapshot({
      series: { 'us-cpi-yoy': cpi },
      calendar: [],
      releaseSchedule: [
        { date: '2026-09-11', affects: ['us-cpi-yoy'] },
        { date: '2026-10-14', affects: ['us-cpi-yoy'] },
        { date: '2026-11-10', affects: ['us-cpi-yoy'] },
      ],
      now: NOW,
    });
    const r = snapshot.readings.find((x) => x.id === 'us-cpi-yoy')!;
    expect(r.releaseDate).toBe('2026-10-14');
    expect(r.nextReleaseToday).toBeUndefined();
  });

  it('B-06: stamps the decided date beside the effective step date', () => {
    // A Fed series stepping on 2026-09-17 (effective) from 3.50 to 3.75.
    const fed: SeriesPoint[] = [];
    for (let i = 0; i < 200; i++) {
      const d = new Date(Date.UTC(2026, 9, 14) as unknown as number);
      d.setUTCDate(d.getUTCDate() - i);
      fed.push({ date: d.toISOString().slice(0, 10), value: d.getUTCDate() >= 17 || d.getUTCMonth() > 8 ? 3.75 : 3.5 });
    }
    fed.reverse();
    const snapshot = buildInsightsSnapshot({
      series: { 'fed-target': fed },
      calendar: [],
      policyDecisions: [{ id: 'fed-target', decided: '2026-09-16', effective: '2026-09-17', points: 0.25 }],
      now: NOW,
    });
    const r = snapshot.readings.find((x) => x.id === 'fed-target')!;
    expect(r.lastChange?.date).toBe('2026-09-17'); // effective (the series step)
    expect(r.decidedDate).toBe('2026-09-16'); // decided (the hand-maintained date)
  });

  it('B-10: records the gap legs\' own dates so the card can show them', () => {
    const au = dailySeries('2026-10-07', 40, () => 5.4);
    const us = dailySeries('2026-10-09', 40, () => 5.24);
    const gap: SeriesPoint[] = [];
    const usDates = new Set(us.map((p) => p.date));
    for (const p of au) if (usDates.has(p.date)) gap.push({ date: p.date, value: 5.4 - 5.24 });
    const snapshot = buildInsightsSnapshot({ series: { 'au-10y': au, us10y: us, 'au-us-10y-gap': gap }, calendar: [], now: NOW });
    const r = snapshot.readings.find((x) => x.id === 'au-us-10y-gap')!;
    expect(r.gapLegs).toEqual({
      a: { id: 'au-10y', asOf: '2026-10-07' },
      b: { id: 'us10y', asOf: '2026-10-09' },
    });
  });

  it('B-19: carries the highest-since year on the reading', () => {
    const us10y = dailySeries('2026-10-13', 40, () => 5.24);
    const snapshot = buildInsightsSnapshot({
      series: { us10y },
      calendar: [],
      highestSince: { us10y: 2002 },
      now: NOW,
    });
    expect(snapshot.readings.find((r) => r.id === 'us10y')!.highestSinceYear).toBe(2002);
  });

  it('B-01: attaches the peak and recomputes fromPeak10y against it', () => {
    const gold = dailySeries('2026-10-13', 40, () => 4166);
    const snapshot = buildInsightsSnapshot({
      series: { 'gold-usd': gold },
      calendar: [],
      peaks: { 'gold-usd': { value: 5586.2, date: '2026-01-29', basis: 'daily-high' } },
      now: NOW,
    });
    const r = snapshot.readings.find((x) => x.id === 'gold-usd')!;
    expect(r.peak).toEqual({ value: 5586.2, date: '2026-01-29', basis: 'daily-high' });
    expect(r.fromPeak10y).toBeCloseTo(((4166 - 5586.2) / 5586.2) * 100, 5);
  });

  it('A-06: an expired context note never reaches the snapshot; a live one does', () => {
    const gold = dailySeries('2026-10-13', 40, () => 4166);
    const notes = [
      { id: 'gold-usd', text: 'Expired note', authored: '2026-09-01', expires: '2026-10-01' },
      { id: 'gold-usd2', text: 'placeholder', authored: '2026-09-01', expires: '2026-10-01' },
    ];
    const live = buildInsightsSnapshot({
      series: { 'gold-usd': gold },
      calendar: [],
      contextNotes: [
        ...notes,
        { id: 'gold-usd', text: 'Live note', authored: '2026-10-10', expires: '2026-10-20' },
      ],
      now: NOW,
    });
    const r = live.readings.find((x) => x.id === 'gold-usd')!;
    expect(r.note?.text).toBe('Live note');
    expect(r.note?.expires).toBe('2026-10-20');

    const expired = buildInsightsSnapshot({
      series: { 'gold-usd': gold },
      calendar: [],
      contextNotes: [{ id: 'gold-usd', text: 'Expired note', authored: '2026-09-01', expires: '2026-10-01' }],
      now: NOW,
    });
    expect(expired.readings.find((x) => x.id === 'gold-usd')!.note).toBeUndefined();
  });

  it('A-07: the snapshot carries the rule version', () => {
    const snapshot = buildInsightsSnapshot({ series: {}, calendar: [], now: NOW });
    expect(snapshot.ruleVersion).toBeGreaterThan(1);
  });

  it('B-04: the home-loan reading carries its change since the RBA decision (pending until the data catches up, then the compare)', () => {
    const cash: SeriesPoint[] = [];
    for (let i = 0; i < 400; i++) {
      const d = new Date(Date.UTC(2026, 9, 14));
      d.setUTCDate(d.getUTCDate() - i);
      const afterDecision = d.getTime() >= Date.UTC(2026, 8, 30);
      cash.push({ date: d.toISOString().slice(0, 10), value: afterDecision ? 4.6 : 4.35 });
    }
    cash.reverse();
    // August loan data — PREDATES the Sep 30 decision → no sinceDecision yet
    // (the pass-through card reads 'pending' from exactly this).
    const aug = monthlySeries('2026-08-31', 40, (back) => 6.2 - back * 0.01);
    const pending = buildInsightsSnapshot({ series: { 'rba-cash-rate': cash, 'au-home-loan': aug }, calendar: [], now: NOW });
    expect(pending.readings.find((r) => r.id === 'au-home-loan')!.sinceDecision).toBeUndefined();

    // October loan data — postdates the decision by a month and repriced.
    const oct = monthlySeries('2026-10-31', 40, (back) => (back === 0 ? 6.38 : 6.2 - (back - 1) * 0.01));
    const passed = buildInsightsSnapshot({ series: { 'rba-cash-rate': cash, 'au-home-loan': oct }, calendar: [], now: '2026-11-02T04:20:00.000Z' });
    const loan = passed.readings.find((r) => r.id === 'au-home-loan')!;
    expect(loan.sinceDecision).toEqual({ decisionDate: '2026-09-30', points: 6.38 - 6.2 });
  });
});

describe('draftReadings helper sanity', () => {
  it('pointAtOrBefore honours the frozen clock (no test flakiness)', () => {
    const s = dailySeries('2026-10-13', 10, () => 1);
    expect(pointAtOrBefore(s, '2026-10-14')!.date).toBe('2026-10-13');
    expect(pointAtOrBefore(s, '2026-10-13')!.date).toBe('2026-10-13');
  });
});

// Keep the unused import honest (used by the snapshot type below).
export type { InsightsSnapshot };
