/**
 * real-yield-fill.test.ts — the bounded DGS10 − T10YIE cross-fill for the
 * real-yield-10y scoring input (Session 3, GOLD_FRED_GAPFILL_SPEC §2 G1b,
 * decision D-6). The audit's live evidence (2026-10-30, the stored stage):
 * DFII10 == DGS10 − T10YIE exactly on all 2,524 common days of the decade —
 * these tests pin the fill's BOUNDS, not its accuracy on healthy days
 * (there is nothing to fill on a healthy day, and the first test says so).
 *
 * Fixture scale note: the cap compares the fillable days against the
 * window's observations (the real window carries ~2,500 points), so the
 * fixtures here generate realistic multi-week series — a 4-point fixture
 * would hit the cap with a single fill (1/5 = 20%) and test nothing.
 */

import { describe, expect, it } from 'vitest';
import {
  REAL_YIELD_FILL_CAP,
  REAL_YIELD_FILL_NOT_BEFORE,
  realYieldScoringSeries,
} from './real-yield-fill';
import type { SeriesPoint } from './series';

const NOW = '2026-10-30T04:10:00.000Z';
const END = '2026-10-28'; // the pure series' last published DFII10 day

function pts(spec: Record<string, number>): SeriesPoint[] {
  return Object.entries(spec).map(([date, value]) => ({ date, value }));
}

/** Business days ending at END (inclusive), `count` of them, with values 2.5+i/100. */
function businessDays(count: number): string[] {
  const out: string[] = [];
  let day = Date.parse(`${END}T00:00:00Z`);
  while (out.length < count) {
    const d = new Date(day);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) out.unshift(d.toISOString().slice(0, 10));
    day -= 86_400_000;
  }
  return out;
}

/** A dense pure DFII10 series over `days` (values 2.5 + i/100). */
function pureOver(days: readonly string[], drop: readonly string[] = []): SeriesPoint[] {
  return days
    .filter((d) => !drop.includes(d))
    .map((d, i) => ({ date: d, value: Math.round((2.5 + i * 0.01) * 1e4) / 1e4 }));
}

/** DGS10 legs over `days` (values 5.0 + i/100). */
function dgs10Over(days: readonly string[]): SeriesPoint[] {
  return days.map((d, i) => ({ date: d, value: Math.round((5 + i * 0.01) * 1e4) / 1e4 }));
}

/** T10YIE legs over `days` (values 2.4 + i/100). */
function t10yieOver(days: readonly string[]): SeriesPoint[] {
  return days.map((d, i) => ({ date: d, value: Math.round((2.4 + i * 0.01) * 1e4) / 1e4 }));
}

describe('realYieldScoringSeries — the healthy day (the audit finding)', () => {
  it('nothing to fill: the pure series comes back unchanged and the count is 0', () => {
    // A healthy day: the legs and the pure series share their last date —
    // the audit's live finding (DFII10 == DGS10 − T10YIE on every common
    // date, zero holes in the decade).
    const days = businessDays(40);
    const pure = pureOver(days);
    const r = realYieldScoringSeries(pure, dgs10Over(days), t10yieOver(days), NOW);
    expect(r.fills).toBe(0);
    expect(r.fillable).toBe(0);
    expect(r.capped).toBe(false);
    expect(r.series).toEqual(pure);
  });

  it('missing inputs (either leg or the pure series) → no fill, never a guess', () => {
    const days = businessDays(40);
    const pure = pureOver(days);
    expect(realYieldScoringSeries(undefined, dgs10Over(days), t10yieOver(days), NOW)).toEqual({
      series: undefined,
      fills: 0,
      fillable: 0,
      capped: false,
    });
    expect(realYieldScoringSeries(pure, undefined, t10yieOver(days), NOW).series).toEqual(pure);
    expect(realYieldScoringSeries(pure, dgs10Over(days), undefined, NOW).series).toEqual(pure);
  });
});

describe('realYieldScoringSeries — the degraded day (the trio-split scenario)', () => {
  it('fills the missing tail day from both legs, quantized 4dp, counted aloud', () => {
    // The pure series lags one day behind its legs (the DFII10 group's own
    // fetch stale/failed while the nominal pair's group + the breakevens'
    // decade group succeeded) — one fillable day among 41 in-window
    // observations = 2.4%, inside the cap.
    const days = businessDays(40);
    const legDays = [...days, '2026-10-29'];
    const pure = pureOver(days);
    const dgs = dgs10Over(legDays);
    const be = t10yieOver(legDays);
    const r = realYieldScoringSeries(pure, dgs, be, NOW);
    expect(r.fills).toBe(1);
    expect(r.fillable).toBe(1);
    expect(r.capped).toBe(false);
    expect(r.series).toHaveLength(41);
    const lastLeg = legDays.length - 1;
    const filled = r.series!.find((p) => p.date === '2026-10-29');
    expect(filled).toEqual({
      date: '2026-10-29',
      value: Math.round((dgs[lastLeg]!.value - be[lastLeg]!.value) * 1e4) / 1e4,
    });
  });

  it('a leg present but the other absent on a day → that day stays unfilled', () => {
    const days = businessDays(40);
    const pure = pureOver(days);
    const dgs = dgs10Over([...days, '2026-10-29']);
    const be = t10yieOver(days); // no 2026-10-29 — the day is not fillable
    const r = realYieldScoringSeries(pure, dgs, be, NOW);
    expect(r.fills).toBe(0);
    expect(r.series).toEqual(pure);
  });

  it('fills only INSIDE the decade window — a pre-window leg day is ignored', () => {
    const days = businessDays(40);
    const pure = pureOver(days);
    const dgs = dgs10Over(['2015-01-05', ...days, '2026-10-29']);
    const be = t10yieOver(['2015-01-05', ...days, '2026-10-29']);
    const r = realYieldScoringSeries(pure, dgs, be, NOW);
    expect(r.fills).toBe(1); // only the tail day; the 2015 day is outside the window
    expect(r.series!.some((p) => p.date === '2015-01-05')).toBe(false);
  });

  it('NEVER extends before 2003-01-02 even when the window math would allow it', () => {
    // A now anchored deep in the past puts the decade window before 2003 —
    // the floor holds.
    const oldNow = '2008-06-15T04:10:00.000Z';
    const dgs = pts({ '2002-06-17': 5.0, '2008-06-13': 4.2 });
    const be = pts({ '2002-06-17': 2.0, '2008-06-13': 2.1 });
    const pure = pts({ '2008-06-12': 2.1 });
    const r = realYieldScoringSeries(pure, dgs, be, oldNow);
    expect(r.series!.some((p) => p.date === '2002-06-17')).toBe(false);
    expect(REAL_YIELD_FILL_NOT_BEFORE).toBe('2003-01-02');
  });

  it('the pure series keeps its own dates — fills never overwrite published DFII10 values', () => {
    const days = businessDays(40);
    const pure = pureOver(days);
    const dgs = dgs10Over([...days, '2026-10-29']);
    const be = t10yieOver([...days, '2026-10-29']);
    const r = realYieldScoringSeries(pure, dgs, be, NOW);
    // Every pure point survives with its own value.
    for (const p of pure) {
      expect(r.series!.find((q) => q.date === p.date)!.value).toBe(p.value);
    }
  });

  it('the merged output stays ascending by date', () => {
    const days = businessDays(40);
    const r = realYieldScoringSeries(
      pureOver(days),
      dgs10Over([...days, '2026-10-29']),
      t10yieOver([...days, '2026-10-29']),
      NOW,
    );
    const outDays = r.series!.map((p) => p.date);
    expect([...outDays].sort()).toEqual(outDays);
  });
});

describe('realYieldScoringSeries — the degraded-series cap (never half-fill a broken series)', () => {
  it('more than 5% of the window fillable → capped: no fills, the reading ages the normal way', () => {
    // 3 holes in a 10-point series: 3/(7+3) = 30% fillable, far past the cap.
    const days = businessDays(10);
    const holes = [days[2]!, days[5]!, days[8]!];
    const pure = pureOver(days, holes);
    const dgs = dgs10Over(days);
    const be = t10yieOver(days);
    const r = realYieldScoringSeries(pure, dgs, be, NOW);
    expect(r.fillable).toBe(3);
    expect(r.capped).toBe(true);
    expect(r.fills).toBe(0);
    expect(r.series).toEqual(pure);
    expect(REAL_YIELD_FILL_CAP).toBe(0.05);
  });

  it('a small fillable share (well under the cap) applies normally', () => {
    // One hole in a 30-day series: 1/(29+1) = 3.3% < 5%.
    const days = businessDays(30);
    const hole = days[10]!;
    const pure = pureOver(days, [hole]);
    const dgs = dgs10Over(days);
    const be = t10yieOver(days);
    const r = realYieldScoringSeries(pure, dgs, be, NOW);
    expect(r.fills).toBe(1);
    expect(r.capped).toBe(false);
    const dgsAt = dgs.find((p) => p.date === hole)!.value;
    const beAt = be.find((p) => p.date === hole)!.value;
    expect(r.series!.find((p) => p.date === hole)!.value).toBe(
      Math.round((dgsAt - beAt) * 1e4) / 1e4,
    );
  });
});
