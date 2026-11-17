import { describe, expect, it } from 'vitest';

import { addDays, combineSeries, epochDay, fromEpochDay, yoyPctSeries, yoyPctSeriesGapAware, type SeriesPoint } from './series';

describe('epochDay (memoized since the 2026-10-23 CPU round)', () => {
  it('is stable and Date.parse-identical across repeated calls', () => {
    const samples = ['1970-01-01', '2000-02-29', '2024-12-31', '2026-10-23', '1999-01-01'];
    for (const d of samples) {
      const first = epochDay(d);
      // Repeated calls (the memo path) must be bit-identical to the first.
      for (let i = 0; i < 5; i++) expect(epochDay(d)).toBe(first);
      // And identical to a direct Date.parse of the same calendar date.
      expect(first).toBe(Math.round(Date.parse(`${d}T00:00:00Z`) / 86_400_000));
    }
    // Epoch boundary: day 0 is not treated as a cache miss.
    expect(epochDay('1970-01-01')).toBe(0);
    expect(fromEpochDay(epochDay('1970-01-01'))).toBe('1970-01-01');
  });

  it('still throws on invalid dates — every time (nothing caches on the throw path)', () => {
    for (let i = 0; i < 3; i++) {
      expect(() => epochDay('not-a-date')).toThrow(/Not an ISO calendar date/);
    }
  });
});

describe('combineSeries (inner join on common dates)', () => {
  const a: SeriesPoint[] = [
    { date: '2024-01-01', value: 100 },
    { date: '2024-01-02', value: 200 },
    { date: '2024-01-03', value: 300 },
  ];
  const b: SeriesPoint[] = [
    { date: '2024-01-01', value: 10 },
    { date: '2024-01-03', value: 30 },
    { date: '2024-01-04', value: 40 },
  ];

  it('joins only on shared dates, in order', () => {
    expect(combineSeries(a, b, (av, bv) => av / bv)).toEqual([
      { date: '2024-01-01', value: 10 },
      { date: '2024-01-03', value: 10 },
    ]);
  });

  it('throws on unsorted input (upstream bugs fail loudly)', () => {
    expect(() => combineSeries([{ date: '2024-01-02', value: 1 }, { date: '2024-01-01', value: 1 }], b, (x) => x)).toThrow(/ascending/);
  });
});

describe('yoyPctSeries (index → annual % change)', () => {
  it('derives annual change and drops points without a year-ago anchor', () => {
    // 13 quarterly index points, 100 → 112 over 3 years
    const s: SeriesPoint[] = [];
    for (let i = 0; i < 13; i++) {
      s.push({ date: addDays('2022-03-01', i * 91), value: 100 + i });
    }
    const yoy = yoyPctSeries(s);
    // First 4 points (year 1) have no anchor → dropped; then ~4/104… per year
    expect(yoy.length).toBe(9);
    for (const p of yoy) {
      expect(p.value).toBeGreaterThan(0);
      expect(p.value).toBeLessThan(10);
    }
    // First anchored point: 104 vs 100 → 4%
    expect(yoy[0]!.value).toBeCloseTo(4, 5);
  });

  it('falling index → negative annual change', () => {
    const s: SeriesPoint[] = [];
    for (let i = 0; i < 9; i++) {
      s.push({ date: addDays('2022-01-01', i * 183), value: 100 - i * 4 });
    }
    const yoy = yoyPctSeries(s);
    expect(yoy.every((p) => p.value < 0)).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * GPE R05 (S4-D1) — the gap-aware YoY walk (the CPI shutdown-gap
 * policy): a missing prior-year base month falls back to the average
 * of the two adjacent published months, the point flagged for the
 * snapshot's yoyBaseMethod stamp.
 * ------------------------------------------------------------------ */

describe('yoyPctSeriesGapAware (GPE R05 — the adjacent-months-average base)', () => {
  /** A monthly levels series 2023-01 → 2026-10 with one month MISSING
   * (the 2025-10 shutdown gap, exactly FRED CPIAUCNS's shape). */
  function monthlyLevels(): SeriesPoint[] {
    const out: SeriesPoint[] = [];
    for (let m = 0; m < 46; m++) {
      const year = 2023 + Math.floor(m / 12);
      const month = (m % 12) + 1;
      if (year === 2025 && month === 10) continue; // the gap
      // A smooth rising index (≈ 2%/month compounding — values chosen
      // so the arithmetic is easy to verify by hand).
      out.push({ date: `${year}-${String(month).padStart(2, '0')}-01`, value: 100 * Math.pow(1.02, m) });
    }
    return out;
  }

  it('identical to yoyPctSeries wherever every base month exists (no gaps → no flags)', () => {
    const full: SeriesPoint[] = [];
    for (let m = 0; m < 30; m++) {
      const year = 2023 + Math.floor(m / 12);
      const month = (m % 12) + 1;
      full.push({ date: `${year}-${String(month).padStart(2, '0')}-01`, value: 100 + m });
    }
    const a = yoyPctSeries(full);
    const b = yoyPctSeriesGapAware(full);
    expect(b.series).toEqual(a);
    expect(b.gapBaseDates.size).toBe(0);
  });

  it('a missing base month derives from the adjacent-months average, and ONLY that point is flagged', () => {
    const levels = monthlyLevels();
    const plain = yoyPctSeries(levels);            // skips the gap month
    const gap = yoyPctSeriesGapAware(levels);      // derives it
    // The gap-aware series has exactly one MORE point (2026-10-01).
    expect(gap.series.length).toBe(plain.length + 1);
    const dates = gap.series.map((p) => p.date);
    expect(dates).toContain('2026-10-01');
    // Only the gap-derived point is flagged.
    expect(gap.gapBaseDates.size).toBe(1);
    expect(gap.gapBaseDates.has('2026-10-01')).toBe(true);
  });

  it('the gap month value is the average-base YoY (the S3-reproducible arithmetic)', () => {
    // The exact S3 §5 rows 8-9 shape: Oct-2026 = 337.511, Sep-2025 =
    // 322.471, Nov-2025 = 326.451 → base 324.461 → +4.02%.
    const levels: SeriesPoint[] = [
      { date: '2025-09-01', value: 322.471 },
      { date: '2025-11-01', value: 326.451 },
      { date: '2026-10-01', value: 337.511 },
    ];
    const gap = yoyPctSeriesGapAware(levels);
    const point = gap.series.find((p) => p.date === '2026-10-01');
    expect(point).toBeDefined();
    expect(point!.value).toBeCloseTo((337.511 / 324.461 - 1) * 100, 5);
    expect(gap.gapBaseDates.has('2026-10-01')).toBe(true);
  });

  it('auto-expires: a backfilled base month returns the standard rule and the flag disappears', () => {
    const levels = monthlyLevels();
    const backfilled = [...levels];
    // FRED backfills the missing Oct-2025 observation (index continues).
    backfilled.push({ date: '2025-10-01', value: 100 * Math.pow(1.02, 21) });
    backfilled.sort((a, b) => a.date.localeCompare(b.date));
    const gap = yoyPctSeriesGapAware(backfilled);
    expect(gap.gapBaseDates.size).toBe(0);
    expect(gap.series).toEqual(yoyPctSeries(backfilled));
  });

  it('fails closed when the adjacent months are missing too (no base, no point)', () => {
    const levels: SeriesPoint[] = [
      { date: '2025-06-01', value: 300 },
      { date: '2026-10-01', value: 337.511 },
    ];
    const gap = yoyPctSeriesGapAware(levels);
    // No adjacent months within the window → no point at all.
    expect(gap.series.find((p) => p.date === '2026-10-01')).toBeUndefined();
    expect(gap.gapBaseDates.size).toBe(0);
  });
});
