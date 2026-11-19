/**
 * correlation.test.ts — GPE R22 / F11: the correlation companion's pure
 * computation tests — the pre-registered windows (Friday closes,
 * 52-week rolling Pearson over levels, the trailing-10y display cap),
 * the fail-closed rules (stale legs, short windows, flat samples), and
 * the 2022 marker's in-window presence.
 */

import { describe, expect, it } from 'vitest';
import type { GoldXauCandle } from '@currena/core';
import {
  CORRELATION_DISPLAY_DAYS,
  CORRELATION_STALE_AFTER_DAYS,
  CORRELATION_WINDOW_WEEKS,
  ROTATION_DATE,
  correlationPanel,
  fridayCloses,
  fridayOf,
  pearson,
  rollingCorrelation,
} from './correlation';

/** A weekday-only ascending OHLC series with deterministic closes. */
function synthGold(n: number, firstDate: string, closeAt: (i: number) => number): GoldXauCandle[] {
  const out: GoldXauCandle[] = [];
  let ms = Date.parse(`${firstDate}T00:00:00Z`);
  for (let i = 0; i < n; ) {
    const weekday = new Date(ms).getUTCDay();
    if (weekday !== 6 && weekday !== 0) {
      const date = new Date(ms).toISOString().slice(0, 10);
      const close = closeAt(i);
      out.push({ date, open: close, high: close, low: close, close });
      i += 1;
    }
    ms += 86_400_000;
  }
  return out;
}

describe('pearson (levels — the registered basis)', () => {
  it('a perfect positive relationship is +1, a perfect inverse is −1', () => {
    expect(pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBeCloseTo(1, 12);
    expect(pearson([1, 2, 3, 4, 5], [10, 8, 6, 4, 2])).toBeCloseTo(-1, 12);
  });

  it('a flat sample carries no correlation (null, never a guess)', () => {
    expect(pearson([5, 5, 5, 5], [1, 2, 3, 4])).toBeNull();
    expect(pearson([1, 2], [3, 4])).toBeNull(); // fewer than 3 points
  });

  it('a known hand-computed value', () => {
    // xs = 1..5, ys = 2,1,4,3,5 → r = 0.8 exactly (the textbook pair).
    expect(pearson([1, 2, 3, 4, 5], [2, 1, 4, 3, 5])).toBeCloseTo(0.8, 12);
  });
});

describe('the Friday sampling (pre-registered)', () => {
  it('fridayOf: the ISO week\'s Friday for known dates', () => {
    expect(fridayOf('2026-11-18')).toBe('2026-11-20'); // Wednesday
    expect(fridayOf('2026-11-21')).toBe('2026-11-20'); // Saturday → its own week's Friday
    expect(fridayOf('2026-11-22')).toBe('2026-11-20'); // Sunday → the week ENDING that day
    expect(fridayOf('2026-11-23')).toBe('2026-11-27'); // Monday → next Friday
    expect(fridayOf('2022-02-24')).toBe('2022-02-25'); // the reserve-freeze Thursday
  });

  it('fridayCloses: one sample per week, the LAST close on or before the Friday', () => {
    const daily = [
      { date: '2026-11-16', gold: 100, yield10y: 1 }, // Monday
      { date: '2026-11-17', gold: 101, yield10y: 2 }, // Tuesday
      { date: '2026-11-18', gold: 102, yield10y: 3 }, // Wednesday
      // Thursday + Friday absent (a holiday week) → the Wednesday close
      // is the week's Friday-referenced sample.
      { date: '2026-11-23', gold: 103, yield10y: 4 }, // next Monday
      { date: '2026-11-27', gold: 104, yield10y: 5 }, // next Friday — itself
    ];
    const fridays = fridayCloses(daily);
    expect(fridays).toEqual([
      { friday: '2026-11-20', gold: 102, yield10y: 3 },
      { friday: '2026-11-27', gold: 104, yield10y: 5 },
    ]);
  });

  it('fridayCloses: a Saturday bar never samples into its own Friday', () => {
    const daily = [
      { date: '2026-11-27', gold: 10, yield10y: 1 }, // Friday
      { date: '2026-11-28', gold: 11, yield10y: 2 }, // Saturday — after the Friday
    ];
    expect(fridayCloses(daily)).toEqual([{ friday: '2026-11-27', gold: 10, yield10y: 1 }]);
  });
});

describe('the 52-week rolling strip (pre-registered)', () => {
  it('the first point needs exactly 52 samples; each point is the trailing window', () => {
    const n = 60;
    const fridays = Array.from({ length: n }, (_, i) => ({
      friday: `2026-w${String(i).padStart(2, '0')}`,
      gold: i,
      yield10y: -i, // a perfect inverse relationship
    }));
    const strip = rollingCorrelation(fridays);
    expect(strip.length).toBe(n - CORRELATION_WINDOW_WEEKS + 1);
    expect(strip[0]!.r).toBeCloseTo(-1, 12);
    expect(strip[strip.length - 1]!.r).toBeCloseTo(-1, 12);
  });

  it('fewer than 52 samples → the empty strip (fail-closed, never a partial window)', () => {
    const fridays = Array.from({ length: 51 }, (_, i) => ({ friday: `w${i}`, gold: i, yield10y: i }));
    expect(rollingCorrelation(fridays)).toEqual([]);
  });
});

describe('correlationPanel (the honest model)', () => {
  const NOW = Date.parse('2026-11-19T04:00:00Z');

  it('joins the legs on common dates only (an unmatched day never appears)', () => {
    const gold = synthGold(5, '2026-11-09', (i) => 1000 + i); // Mon 9 → Fri 13
    const yieldPts: Array<[number, number]> = [
      [Math.floor(Date.parse('2026-11-10T00:00:00Z') / 86_400_000), 1.5], // Tuesday — the only overlap
      [Math.floor(Date.parse('2026-11-14T00:00:00Z') / 86_400_000), 1.6], // Saturday — gold never carries it
    ];
    const panel = correlationPanel(gold, yieldPts, NOW);
    expect(panel).not.toBeNull();
    // ONE joined point cannot draw a pair — the honest empty panel (the
    // unmatched Saturday yield day never joins anything).
    expect(panel!.daily).toEqual([]);
    expect(panel!.window).toBeNull();
    // The staleness carries BOTH legs' own last points — the Saturday
    // yield point is 5 days old at the reference now, the gold leg 6 —
    // neither past the 7-day bound.
    expect(panel!.staleness.gold.last).toBe('2026-11-13');
    expect(panel!.staleness.yield10y.last).toBe('2026-11-14');
    expect(panel!.staleness.stale).toBe(false);
  });

  it('fail-closed staleness: a leg older than the bound marks the panel stale', () => {
    const gold = synthGold(5, '2026-10-26', (i) => 1000 + i); // last bar 2026-10-30 → 20 days old
    const yieldPts: Array<[number, number]> = [
      [Math.floor(Date.parse('2026-11-18T00:00:00Z') / 86_400_000), 1.5],
      [Math.floor(Date.parse('2026-11-10T00:00:00Z') / 86_400_000), 1.4],
    ];
    const panel = correlationPanel(gold, yieldPts, NOW)!;
    expect(panel.staleness.gold.ageDays).toBeGreaterThan(CORRELATION_STALE_AFTER_DAYS);
    expect(panel.staleness.stale).toBe(true);
  });

  it('the display window caps at the registered trailing-10y; a short stored span renders whole', () => {
    // ~60 weekday bars from 2026-08: a span far shorter than 10y.
    const gold = synthGold(60, '2026-08-03', (i) => 2000 + i);
    const yieldPts = gold.map(
      (c) => [Math.floor(Date.parse(`${c.date}T00:00:00Z`) / 86_400_000), 2 + (c.close - 2000) / 1000] as [number, number],
    );
    const panel = correlationPanel(gold, yieldPts, NOW)!;
    expect(panel.window!.from).toBe(gold[0]!.date); // the whole stored span
    expect(panel.rotationInWindow).toBe(false); // 2022 is outside the span — never invented
    // ~12-13 Friday pairs in ~11.5 weeks → the strip is honest-empty and
    // the panel says how many more Fridays it needs.
    expect(panel.strip).toEqual([]);
    expect(panel.fridaysUntilFirstStripPoint).toBe(CORRELATION_WINDOW_WEEKS - panel.fridays.length);
    expect(panel.fridaysUntilFirstStripPoint).toBeGreaterThan(0);
  });

  it('a decade-deep basis renders the 2022 marker in-window', () => {
    // 10.5 years of weekday bars ending just before ROTATION_DATE + the
    // years after it — the marker must land inside.
    const gold = synthGold(80, '2021-11-01', (i) => 1800 + i);
    // The join needs matching yield days: mirror the gold dates.
    const yieldPts = gold.map(
      (c) => [Math.floor(Date.parse(`${c.date}T00:00:00Z`) / 86_400_000), 1.0] as [number, number],
    );
    const panel = correlationPanel(gold, yieldPts, Date.parse('2021-12-01T00:00:00Z'))!;
    // ROTATION (2022-02-24) is AFTER the window's end here — outside.
    expect(panel.rotationInWindow).toBe(false);

    const gold2 = [...gold, ...synthGold(260, '2022-02-25', (i) => 1900 + i)];
    const yieldPts2 = gold2.map(
      (c) => [Math.floor(Date.parse(`${c.date}T00:00:00Z`) / 86_400_000), 1.0] as [number, number],
    );
    const panel2 = correlationPanel(gold2, yieldPts2, Date.parse('2023-03-01T00:00:00Z'))!;
    expect(panel2.rotationInWindow).toBe(true);
    // The display cap: the joined span (2021-11 → 2023-03, ~16 months) is
    // under 10y — the whole span renders; the window names it honestly.
    expect(panel2.window!.to).toBe(gold2[gold2.length - 1]!.date);
  });

  it('a decade-long stored span caps at the registered display window', () => {
    // ~11 years of bars: the window must cut to the trailing ~10y.
    const gold = synthGold(60, '2015-01-05', (i) => 1200 + i)
      .concat(synthGold(2_600, '2016-06-01', (i) => 1300 + i));
    const yieldPts = gold.map(
      (c) => [Math.floor(Date.parse(`${c.date}T00:00:00Z`) / 86_400_000), 1.0] as [number, number],
    );
    const now = Date.parse(`${gold[gold.length - 1]!.date}T00:00:00Z`) + 86_400_000;
    const panel = correlationPanel(gold, yieldPts, now)!;
    const spanDays = (Date.parse(panel.window!.to) - Date.parse(panel.window!.from)) / 86_400_000;
    expect(spanDays).toBeLessThanOrEqual(CORRELATION_DISPLAY_DAYS + 7); // within the cap + the week's partial
  });

  it('either leg under 2 points → null (the honest absent panel)', () => {
    expect(correlationPanel([], [], NOW)).toBeNull();
    expect(correlationPanel(synthGold(1, '2026-11-09', () => 1), [], NOW)).toBeNull();
  });
});
