import { describe, expect, it } from 'vitest';
import type { InsightsSnapshot } from '@currena/core';
import { addDays, epochDay, type SeriesPoint } from '../series';
import {
  buildHistoryFile,
  buildInsightsSnapshot,
  buildInsightsStatus,
  downsampleSeries,
  HISTORY_MAX_POINTS,
  HISTORY_WINDOW_DAYS,
} from './snapshot';

const NOW = '2026-10-07T04:20:00.000Z';

/** Daily series from `start` for `n` days at value `v` (optionally jittered by fn). */
function daily(start: string, n: number, v: number, jitter: (i: number) => number = () => 0): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (let i = 0; i < n; i++) {
    out.push({ date: addDays(start, i), value: v + jitter(i) });
  }
  return out;
}

describe('downsampleSeries', () => {
  it('returns an unchanged copy when already within the cap', () => {
    const series = daily('2026-09-01', 10, 3);
    const out = downsampleSeries(series);
    expect(out).toEqual(series);
    expect(out).not.toBe(series); // copy, not alias
  });

  it('strides evenly and always ends on the LAST observation', () => {
    const series = daily('2020-01-01', 1000, 3);
    const out = downsampleSeries(series, 100);
    // stride 10 → 100 strided points; the true last point (999) is appended
    // because the stride landed on 990 — the cap is maxPoints + 1 by design.
    expect(out.length).toBeLessThanOrEqual(101);
    expect(out[out.length - 1]).toEqual(series[series.length - 1]);
    expect(out[0]).toEqual(series[0]);
    expect(out[1]).toEqual(series[10]);
  });

  it('appends the last point when the stride would have skipped it', () => {
    const series = daily('2020-01-01', 1001, 3);
    const out = downsampleSeries(series, 100);
    expect(out[out.length - 1]).toEqual(series[1000]!);
    expect(out.length).toBeLessThanOrEqual(101); // strided points + appended last
  });
});

describe('buildHistoryFile', () => {
  it('returns undefined for single-point live cards (no history key)', () => {
    expect(buildHistoryFile('gold-btc', [{ date: '2026-10-07', value: 42 }])).toBeUndefined();
  });

  it('encodes a short series verbatim as [epochDay, value] pairs', () => {
    const series: SeriesPoint[] = [
      { date: '2026-10-01', value: 3.88 },
      { date: '2026-10-06', value: 3.97 },
    ];
    const file = buildHistoryFile('us10y', series)!;
    expect(file.id).toBe('us10y');
    expect(file.points).toEqual([
      [epochDay('2026-10-01'), 3.88],
      [epochDay('2026-10-06'), 3.97],
    ]);
  });

  it('keeps only the last 10 years (anchored on the newest observation) and caps the point count', () => {
    // 11 years of daily data ending today.
    const series = daily(addDays('2026-10-07', -11 * 365), 11 * 365 + 1, 3);
    const file = buildHistoryFile('us10y', series)!;
    const oldest = fromEpochDayUnsafe(file.points[0]![0]);
    const newest = fromEpochDayUnsafe(file.points[file.points.length - 1]![0]);
    expect(newest).toBe('2026-10-07');
    expect(epochDay(oldest)).toBeGreaterThanOrEqual(epochDay(newest) - HISTORY_WINDOW_DAYS);
    expect(file.points.length).toBeLessThanOrEqual(HISTORY_MAX_POINTS + 1); // cap + appended last point
  });
});

// local helper to keep the assertion section readable
function fromEpochDayUnsafe(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

describe('buildInsightsSnapshot', () => {
  it('emits one reading per definition, unavailable for missing series', () => {
    const snap = buildInsightsSnapshot({
      series: { us10y: daily('2026-08-29', 40, 3) },
      calendar: [],
      now: NOW,
    });
    expect(snap.readings).toHaveLength(41);
    expect(new Set(snap.readings.map((r) => r.id)).size).toBe(41);
    expect(snap.readings.find((r) => r.id === 'us10y')!.status).not.toBe('unavailable');
    expect(snap.readings.find((r) => r.id === 'china-pmi')!.status).toBe('unavailable');
    expect(snap.readings.find((r) => r.id === 'china-pmi')!.value).toBeNull();
    expect(snap.generatedAt).toBe(NOW);
    expect(snap.calendar).toEqual([]);
  });

  it('stamps source attribution from READING_SOURCES on every reading', () => {
    const snap = buildInsightsSnapshot({ series: {}, calendar: [], now: NOW });
    for (const r of snap.readings) {
      expect(r.sourceName.length).toBeGreaterThan(0);
      expect(r.updatedAt).toBe(NOW);
    }
  });

  it('reports a fresh vote flip in changedThisWeek', () => {
    // 40 flat days → normal; then +1.0 jump on the last day → change-rule warning.
    const calm = daily('2026-08-29', 40, 3);
    const shocked = [...calm.slice(0, -1), { date: calm[39]!.date, value: 4 }];

    const previous: InsightsSnapshot = buildInsightsSnapshot({ series: { us10y: calm }, calendar: [], now: NOW });
    expect(previous.readings.find((r) => r.id === 'us10y')!.status).toBe('normal');
    expect(previous.changedThisWeek).toEqual([]);

    const current = buildInsightsSnapshot({
      series: { us10y: shocked },
      previous,
      calendar: [],
      now: NOW,
    });
    expect(current.readings.find((r) => r.id === 'us10y')!.status).toBe('warning');
    expect(current.changedThisWeek).toEqual([
      { id: 'us10y', from: 'normal', to: 'warning', asOf: shocked[shocked.length - 1]!.date },
    ]);
  });

  it('carries forward still-fresh events from the previous snapshot and drops stale ones', () => {
    const series = daily('2026-08-29', 40, 3);
    const previous: InsightsSnapshot = {
      generatedAt: '2026-10-06T04:20:00.000Z',
      summary: {
        global: { section: 'global', label: null, warningCount: 0, votingCount: 1, excludedCount: 0 },
        australia: { section: 'australia', label: null, warningCount: 0, votingCount: 0, excludedCount: 0 },
      },
      readings: [], // unused by the merge logic (changedSince finds no flips)
      changedThisWeek: [
        { id: 'us10y', from: 'normal', to: 'warning', asOf: addDays('2026-10-07', -2) }, // fresh
        { id: 'usdjpy', from: 'warning', to: 'normal', asOf: addDays('2026-10-07', -9) }, // stale (>7d)
      ],
      calendar: [],
    };
    const snap = buildInsightsSnapshot({ series: { us10y: series }, previous, calendar: [], now: NOW });
    expect(snap.changedThisWeek).toEqual([
      { id: 'us10y', from: 'normal', to: 'warning', asOf: addDays('2026-10-07', -2) },
    ]);
  });
});

describe('buildInsightsStatus', () => {
  it('builds the validated per-source freshness record', () => {
    const status = buildInsightsStatus({
      reports: [
        { source: 'fred', ok: true, detail: '10/10 series fetched' },
        { source: 'rba', ok: false, detail: 'F1.1: HTTP 403' },
      ],
      generatedAt: NOW,
      mode: 'scheduled',
      dryRun: false,
    });
    expect(status.v).toBe(1);
    expect(status.mode).toBe('scheduled');
    expect(status.sources).toHaveLength(2);
    expect(status.sources[1]!.ok).toBe(false);
  });
});
