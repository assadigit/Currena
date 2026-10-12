import { describe, expect, it } from 'vitest';
import { buildIndicatorSeries, fillBrentGap } from './derived';
import type { SeriesInputs } from './derived';
import type { SeriesPoint } from '../series';

const fred: SeriesPoint[] = [
  { date: '2026-09-30', value: 115.91 },
  { date: '2026-10-01', value: 114.82 },
  { date: '2026-10-02', value: 135.51 },
  { date: '2026-10-05', value: 125.51 },
  { date: '2026-10-06', value: 125.44 }, // EIA's last published spot (the 2026-10-12 incident)
];

const yahoo: SeriesPoint[] = [
  { date: '2026-10-05', value: 125.6 },
  { date: '2026-10-06', value: 125.9 },
  { date: '2026-10-07', value: 100.2 },
  { date: '2026-10-08', value: 104.28 },
  { date: '2026-10-09', value: 104.72 },
  { date: '2026-10-12', value: 107.14 },
];

describe('fillBrentGap', () => {
  it('extends the FRED series STRICTLY past its last date', () => {
    const merged = fillBrentGap(fred, yahoo);
    expect(merged.map((p) => p.date)).toEqual([
      '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06',
      '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-12',
    ]);
    // FRED keeps every overlapping date (EIA spot is authoritative)…
    expect(merged.find((p) => p.date === '2026-10-06')!.value).toBe(125.44);
    // …and Yahoo fills only the gap.
    expect(merged.find((p) => p.date === '2026-10-09')!.value).toBe(104.72);
  });

  it('no Yahoo input → the FRED series verbatim', () => {
    expect(fillBrentGap(fred, undefined)).toBe(fred);
    expect(fillBrentGap(fred, [])).toBe(fred);
  });

  it('no overlap left (FRED caught up) → the FRED series verbatim', () => {
    // FRED has published through 2026-10-12 — Yahoo carries nothing newer.
    const fredCurrent: SeriesPoint[] = [
      ...fred,
      { date: '2026-10-07', value: 100.25 },
      { date: '2026-10-08', value: 104.3 },
      { date: '2026-10-09', value: 104.75 },
      { date: '2026-10-12', value: 107.1 },
    ];
    // The same-date Yahoo prints NEVER overwrite FRED's.
    expect(fillBrentGap(fredCurrent, yahoo)).toBe(fredCurrent);
  });

  it('an empty FRED series hands the whole series to Yahoo', () => {
    expect(fillBrentGap([], yahoo)).toBe(yahoo);
  });
});

describe('buildIndicatorSeries — brent wiring', () => {
  const baseInputs: SeriesInputs = { today: '2026-10-12', fred: {}, fx: {} };

  it('FRED + gap-fill produces the merged series under brent', () => {
    const out = buildIndicatorSeries({ ...baseInputs, fred: { DCOILBRENTEU: fred }, brentYahoo: yahoo });
    expect(out.brent).toHaveLength(9);
    expect(out.brent!.at(-1)).toEqual({ date: '2026-10-12', value: 107.14 });
  });

  it('a total FRED outage falls back to the Yahoo series alone', () => {
    const out = buildIndicatorSeries({ ...baseInputs, fred: {}, brentYahoo: yahoo });
    expect(out.brent).toEqual(yahoo);
  });

  it('both absent → brent absent (the World Bank monthly rung takes over downstream)', () => {
    const out = buildIndicatorSeries({ ...baseInputs, fred: {} });
    expect(out.brent).toBeUndefined();
  });
});
