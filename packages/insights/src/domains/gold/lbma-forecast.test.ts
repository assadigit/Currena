/**
 * lbma-forecast.test.ts — GPE R32 / F23 (2026-11-19, S17): the
 * forecast-accuracy retrospective's tests — THE provenance pin (every
 * aggregate the research specs recorded reproduces EXACTLY over the
 * extracted series: 10 of 16 years under-forecast; mean −2.1%; mean-abs
 * 8.1%; 2025 −20.2%; 2024 −13.7%; the 2026 forecast $4,741.97), the
 * series' own shape (16 completed + 1 pending; strictly ascending
 * years; positive prices), the pending-year honesty (never scored), and
 * the compute's fail-closed behaviour on synthetic series.
 */

import { describe, expect, it } from 'vitest';
import {
  LBMA_2026_MIDYEAR_REVISION,
  LBMA_FORECAST_SERIES,
  LBMA_FORECAST_SOURCE_URL,
  forecastRetrospective,
  type LbmaForecastYear,
} from './lbma-forecast';

describe('LBMA_FORECAST_SERIES — the extracted series', () => {
  it('covers 2010–2026: 16 completed years + the pending 2026, ascending', () => {
    expect(LBMA_FORECAST_SERIES.length).toBe(17);
    expect(LBMA_FORECAST_SERIES.map((r) => r.year)).toEqual([...Array(17)].map((_, i) => 2010 + i));
    const completed = LBMA_FORECAST_SERIES.filter((r) => r.actual !== null);
    expect(completed.length).toBe(16);
    const pending = LBMA_FORECAST_SERIES.filter((r) => r.actual === null);
    expect(pending.map((r) => r.year)).toEqual([2026]);
  });

  it('every price is positive and finite (the publisher chart bytes)', () => {
    for (const row of LBMA_FORECAST_SERIES) {
      expect(Number.isFinite(row.forecast)).toBe(true);
      expect(row.forecast).toBeGreaterThan(0);
      if (row.actual !== null) {
        expect(row.actual).toBeGreaterThan(0);
      }
    }
  });

  it('carries the attribution URL + the mid-year revision constant', () => {
    expect(LBMA_FORECAST_SOURCE_URL).toContain('lbma.org.uk');
    expect(LBMA_2026_MIDYEAR_REVISION).toBe(4604);
  });
});

describe('forecastRetrospective — THE provenance pin (the research record reproduces exactly)', () => {
  const retro = forecastRetrospective();

  it('the consensus under-forecast gold in 10 of 16 completed years (the s4/02 §1d headline)', () => {
    expect(retro.n).toBe(16);
    expect(retro.underForecast).toEqual([2010, 2011, 2014, 2016, 2017, 2019, 2020, 2023, 2024, 2025]);
    expect(retro.underForecast.length).toBe(10);
  });

  it('the mean signed miss is −2.1% and the mean absolute miss is 8.1% (rounded to the record)', () => {
    expect(retro.meanMissPct).toBeCloseTo(-2.11, 1);
    expect(retro.meanAbsMissPct).toBeCloseTo(8.13, 1);
  });

  it('2025 missed by −20.2% and 2024 by −13.7% (the memorable years)', () => {
    const y2025 = retro.scored.find((r) => r.year === 2025)!;
    const y2024 = retro.scored.find((r) => r.year === 2024)!;
    expect(y2025.missPct).toBeCloseTo(-20.24, 1);
    expect(y2025.forecast).toBe(2736.69); // the chart series-of-record
    expect(y2025.actual).toBe(3431.54);
    expect(y2024.missPct).toBeCloseTo(-13.71, 1);
    expect(y2024.forecast).toBe(2059);
    expect(y2024.actual).toBe(2386.2);
  });

  it('the 2026 pending row rides the January survey forecast ($4,741.97) — never scored early', () => {
    expect(retro.pending).toEqual({ year: 2026, forecast: 4741.97 });
    expect(retro.scored.find((r) => r.year === 2026)).toBeUndefined();
  });

  it('the miss convention is disclosed: (forecast − actual) ÷ actual — negative = under-forecast', () => {
    // 2012: forecast 1766 > actual 1669 → POSITIVE miss (over-forecast).
    expect(retro.scored.find((r) => r.year === 2012)!.missPct).toBeCloseTo(((1766 - 1669) / 1669) * 100, 6);
    // 2011: forecast 1457 < actual 1572 → NEGATIVE miss (under-forecast).
    expect(retro.scored.find((r) => r.year === 2011)!.missPct).toBeCloseTo(((1457 - 1572) / 1572) * 100, 6);
  });
});

describe('forecastRetrospective — the pure compute on synthetic series', () => {
  it('an all-pending series reads honestly empty (never a throw, never a guess)', () => {
    const retro = forecastRetrospective([
      { year: 2026, forecast: 4700, actual: null },
    ]);
    expect(retro.n).toBe(0);
    expect(retro.scored).toEqual([]);
    expect(retro.underForecast).toEqual([]);
    expect(retro.meanMissPct).toBe(0);
    expect(retro.pending).toEqual({ year: 2026, forecast: 4700 });
  });

  it('an exact-match year scores 0.0% and counts neither direction', () => {
    const retro = forecastRetrospective([
      { year: 2020, forecast: 100, actual: 100 },
    ] as readonly LbmaForecastYear[]);
    expect(retro.meanMissPct).toBe(0);
    expect(retro.meanAbsMissPct).toBe(0);
    expect(retro.underForecast).toEqual([]);
  });

  it('the LAST pending row is the one kept when more than one exists (the defensive shape)', () => {
    const retro = forecastRetrospective([
      { year: 2025, forecast: 100, actual: 100 },
      { year: 2026, forecast: 4700, actual: null },
      { year: 2027, forecast: 5000, actual: null },
    ] as readonly LbmaForecastYear[]);
    expect(retro.pending).toEqual({ year: 2027, forecast: 5000 });
  });
});
