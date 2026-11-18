/**
 * ta-levels.test.ts — GPE R19 / F8: the minimal TA band's pure
 * computation tests — the SMA family, the distance decile (the meter's
 * own percentile grammar over the stored basis — S13-D1), the dated
 * 50/200 cross events (whipsaws included), and the classic
 * daily/weekly pivots (the standard formulas pinned by hand on a
 * fixed bar).
 */

import { describe, expect, it } from 'vitest';
import type { GoldXauCandle } from '@currena/core';
import {
  TA_DECILE_MIN_BASE,
  TA_WINDOWS,
  classicDailyPivots,
  classicWeeklyPivots,
  crossEvents,
  distanceFromSma200,
  previousWeekBars,
  smaRows,
  smaSeries,
} from './ta-levels';

/** A weekday-dated ascending series with deterministic closes. */
function synthSeries(n: number, firstDate: string, closeAt: (i: number) => number): GoldXauCandle[] {
  const out: GoldXauCandle[] = [];
  let ms = Date.parse(`${firstDate}T00:00:00Z`);
  for (let i = 0; i < n; ) {
    const weekday = new Date(ms).getUTCDay();
    if (weekday !== 6 && weekday !== 0) {
      const date = new Date(ms).toISOString().slice(0, 10);
      const close = closeAt(i);
      out.push({ date, open: close - 1, high: close + 2, low: close - 3, close });
      i += 1;
    }
    ms += 86_400_000;
  }
  return out;
}

describe('the SMA family', () => {
  it('smaRows: the latest average per window, in the four-window order', () => {
    // closes 1..10: SMA20 needs 20 bars → only 100/200 windows absent here.
    const series = synthSeries(150, '2025-01-06', (i) => 100 + i);
    const rows = smaRows(series);
    expect(rows.map((r) => r.window)).toEqual([20, 50, 100]);
    // The SMA20 over the last 20 closes of 100+i (i=130..149): 239.5.
    expect(rows[0]!.value).toBeCloseTo(239.5, 6);
    expect(rows[0]!.date).toBe(series[series.length - 1]!.date);
    // An insufficient window is ABSENT, never a guess (fail-closed).
    const short = smaRows(synthSeries(99, '2025-01-06', (i) => 100 + i));
    expect(short.map((r) => r.window)).toEqual([20, 50]);
  });

  it('smaSeries: one point per bar from the window\'s first complete index', () => {
    const series = synthSeries(30, '2025-01-06', (i) => 10 + i);
    const points = smaSeries(series, 20);
    expect(points.length).toBe(11); // indices 19..29
    expect(points[0]!.value).toBeCloseTo((10 + 29) / 2, 6); // closes 10..29 → mean 19.5
    expect(points[0]!.date).toBe(series[19]!.date);
  });

  it('TA_WINDOWS: the four standard windows, the deliberate subset', () => {
    expect(TA_WINDOWS).toEqual([20, 50, 100, 200]);
  });
});

describe('the distance-from-200DMA decile (C5 rule 3)', () => {
  it('the distance + the decile over the stored basis, the current point excluded', () => {
    // 300 bars: closes rising then falling — distances vary across the base.
    const series = synthSeries(300, '2025-01-06', (i) => 1000 + 400 * Math.sin(i / 40) + i * 0.5);
    const d = distanceFromSma200(series);
    expect(d).not.toBeNull();
    if (d === null) return;
    expect(d.date).toBe(series[series.length - 1]!.date);
    expect(d.decile).not.toBeNull();
    if (d.decile !== null) {
      expect(d.decile).toBeGreaterThanOrEqual(0);
      expect(d.decile).toBeLessThanOrEqual(1);
    }
    // The basis excludes the current point: 300 bars → SMA200 exists at
    // indices 199..299 → the base carries indices 199..298 = 100 points.
    expect(d.basis?.points).toBe(100);
    // The honest window the sentence must name (S13-D1).
    expect(d.basis?.from).toBe(series[199]!.date);
    expect(d.basis?.to).toBe(series[298]!.date);
    // The arithmetic itself: the last close vs its own SMA200.
    const closes = series.map((c) => c.close);
    const sma200 = closes.slice(-200).reduce((a, b) => a + b, 0) / 200;
    expect(d.sma200).toBeCloseTo(sma200, 6);
    expect(d.pct).toBeCloseTo(((closes[closes.length - 1]! - sma200) / sma200) * 100, 6);
  });

  it('a basis too small to speak carries NO decile (fail-closed, never a guess)', () => {
    // 230 bars → the base carries indices 199..228 = 30 points — exactly the floor.
    const atFloor = distanceFromSma200(synthSeries(230, '2025-01-06', (i) => 1000 + i));
    expect(atFloor?.basis?.points).toBe(TA_DECILE_MIN_BASE);
    // 229 bars → 29 base points — below the floor: decile null, basis null.
    const below = distanceFromSma200(synthSeries(229, '2025-01-06', (i) => 1000 + i));
    expect(below?.decile).toBeNull();
    expect(below?.basis).toBeNull();
    // The distance itself still speaks when the SMA200 exists.
    expect(below?.pct).not.toBeNull();
  });

  it('no SMA200 (a short stored series) → the whole reading is null', () => {
    expect(distanceFromSma200(synthSeries(199, '2025-01-06', (i) => 1000 + i))).toBeNull();
  });
});

describe('the dated 50/200 cross events (C5 rule 2 — events, never signals)', () => {
  it('the crosses: dated, newest first, with what followed 20 bars on — whipsaws included', () => {
    // A two-frequency wave (a slow ~157-bar cycle + a fast ~41-bar ripple)
    // over 800 bars: the SMA50 leads the SMA200, so each slow cycle prints
    // one cross of each kind, and the fast ripple makes some +20-bar
    // follow-throughs run AGAINST the cross's own side — the whipsaw the
    // C5 rule demands be shown, not curated away.
    const series = synthSeries(800, '2025-01-06', (i) => 1000 + 300 * Math.sin(i / 25) + 130 * Math.sin(i / 6.5));
    const crosses = crossEvents(series);
    expect(crosses.length).toBeGreaterThanOrEqual(5);
    // Newest first.
    const dates = crosses.map((c) => c.date);
    expect([...dates].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))).toEqual(dates);
    // Both directions exist; every followedBy20d is present this deep in the series.
    const kinds = new Set(crosses.map((c) => c.kind));
    expect(kinds).toContain('golden');
    expect(kinds).toContain('death');
    for (const cross of crosses) {
      expect(cross.followedBy20d).not.toBeNull();
    }
    // The honest "what followed": at least one cross is a WHIPSAW — a
    // golden cross the market fell through, or a death cross it rose
    // through (the follow-through sign opposite the cross's own side).
    const whipsaws = crosses.filter(
      (c) => (c.kind === 'golden' && c.followedBy20d! < 0) || (c.kind === 'death' && c.followedBy20d! > 0),
    );
    expect(whipsaws.length).toBeGreaterThan(0);
  });

  it('a cross at the tail of the window truncates honestly (null, never a guess)', () => {
    const series = synthSeries(240, '2025-01-06', (i) => (i < 150 ? 1000 + i * 2 : 1300 - (i - 150) * 3));
    const crosses = crossEvents(series);
    if (crosses.length > 0) {
      const last = crosses[crosses.length - 1]!;
      if (series.findIndex((c) => c.date === last.date) + 20 >= series.length) {
        expect(last.followedBy20d).toBeNull();
      }
    }
  });
});

describe('the classic pivots (s1/13 §3 — the standard formulas)', () => {
  it('daily: the previous bar\'s arithmetic, pinned by hand', () => {
    const series = synthSeries(10, '2026-11-10', () => 100); // uniform: H=102, L=97, C=100
    // Overwrite the second-to-last bar with a hand-checkable one.
    series[8] = { date: '2026-11-18', open: 3900, high: 4000, low: 3800, close: 3950 };
    const pivots = classicDailyPivots(series)!;
    expect(pivots.date).toBe('2026-11-18');
    expect(pivots.pp).toBeCloseTo((4000 + 3800 + 3950) / 3, 6); // 3916.666…
    expect(pivots.r1).toBeCloseTo(2 * pivots.pp - 3800, 6);
    expect(pivots.s1).toBeCloseTo(2 * pivots.pp - 4000, 6);
    expect(pivots.r2).toBeCloseTo(pivots.pp + (4000 - 3800), 6);
    expect(pivots.s2).toBeCloseTo(pivots.pp - (4000 - 3800), 6);
    expect(pivots.r3).toBeCloseTo(4000 + 2 * (pivots.pp - 3800), 6);
    expect(pivots.s3).toBeCloseTo(3800 - 2 * (4000 - pivots.pp), 6);
    // The arithmetic reads the PREVIOUS bar (series[8]), not the last.
    expect(pivots.close).toBe(3950);
  });

  it('weekly: the previous ISO week\'s aggregate OHLC', () => {
    // Build two explicit weeks: the last bar sits in the week of Mon 2026-11-23;
    // the previous week (Mon 2026-11-16) carries five bars.
    const series: GoldXauCandle[] = [
      { date: '2026-11-16', open: 1, high: 3910, low: 3880, close: 3900 }, // Mon
      { date: '2026-11-17', open: 1, high: 3930, low: 3890, close: 3920 },
      { date: '2026-11-18', open: 1, high: 3950, low: 3900, close: 3940 },
      { date: '2026-11-19', open: 1, high: 3940, low: 3910, close: 3930 },
      { date: '2026-11-20', open: 1, high: 3960, low: 3920, close: 3955 }, // Fri
      { date: '2026-11-23', open: 1, high: 3970, low: 3940, close: 3960 }, // the current week's Mon
    ];
    const prev = previousWeekBars(series);
    expect(prev?.map((c) => c.date)).toEqual(['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20']);
    const pivots = classicWeeklyPivots(series)!;
    // The aggregate: H=3960 (Fri), L=3880 (Mon), C=3955 (Fri's close).
    expect(pivots.high).toBe(3960);
    expect(pivots.low).toBe(3880);
    expect(pivots.close).toBe(3955);
    expect(pivots.pp).toBeCloseTo((3960 + 3880 + 3955) / 3, 6);
    expect(pivots.date).toBe('2026-11-16');
  });

  it('fail-closed: a series too short carries no pivots', () => {
    expect(classicDailyPivots(synthSeries(1, '2026-11-10', () => 100))).toBeNull();
    expect(classicWeeklyPivots(synthSeries(1, '2026-11-10', () => 100))).toBeNull();
    expect(previousWeekBars(synthSeries(1, '2026-11-10', () => 100))).toBeNull();
  });
});
