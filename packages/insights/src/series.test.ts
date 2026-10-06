import { describe, expect, it } from 'vitest';

import { addDays, combineSeries, yoyPctSeries, type SeriesPoint } from './series';

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
