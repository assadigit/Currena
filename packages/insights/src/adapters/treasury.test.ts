/**
 * treasury.test.ts — the 2026-10-22 reliability round's FRED-fallback
 * adapter (pure parses + URL shape; no network — AGENTS.md rule 7).
 */

import { describe, expect, it } from 'vitest';
import {
  TREASURY_CURVE_NOMINAL,
  TREASURY_CURVE_REAL,
  parseTreasuryCurveCsv,
  treasuryCurveUrl,
  treasuryT10y2y,
  type TreasuryCurves,
} from './treasury';
import { FormatChangedError } from './fetch-policy';

/** The live 2026 nominal header (venue-verified 2026-10-22). */
const NOMINAL_CSV = [
  'Date,"1 Mo","1.5 Month","2 Mo","3 Mo","4 Mo","6 Mo","1 Yr","2 Yr","3 Yr","5 Yr","7 Yr","10 Yr","20 Yr","30 Yr"',
  '10/21/2026,4.09,4.12,4.16,4.25,4.34,4.35,4.52,4.81,4.89,4.95,5.03,5.13,5.47,5.42',
  '10/20/2026,4.09,4.11,4.15,4.24,4.33,4.35,4.51,4.81,4.89,4.95,5.03,5.12,5.47,5.41',
  '10/19/2026,4.08,4.11,4.15,4.24,4.33,4.34,4.51,4.80,4.88,4.94,5.02,5.15,5.48,5.44',
].join('\n');

/** The live 2026 real header (5/7/10/20/30 YR). */
const REAL_CSV = [
  'Date,"5 YR","7 YR","10 YR","20 YR","30 YR"',
  '10/21/2026,2.55,2.65,2.76,3.01,3.15',
  '10/20/2026,2.55,2.65,2.77,3.02,3.16',
].join('\n');

describe('treasuryCurveUrl', () => {
  it('builds the current-year all-months URL per curve type', () => {
    expect(treasuryCurveUrl(TREASURY_CURVE_NOMINAL, 2026)).toBe(
      'https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/2026/all?type=daily_treasury_yield_curve&field_tdr_date_value=2026&_format=csv',
    );
    expect(treasuryCurveUrl(TREASURY_CURVE_REAL, 2025)).toContain('type=daily_treasury_real_yield_curve');
  });
});

describe('parseTreasuryCurveCsv', () => {
  it('reads the named tenors out of the live nominal header, newest-first input → ascending output', () => {
    const parsed = parseTreasuryCurveCsv(NOMINAL_CSV, { dgs2: '2 Yr', dgs10: '10 Yr', dgs30: '30 Yr' });
    expect(parsed.dgs10).toEqual([
      { date: '2026-10-19', value: 5.15 },
      { date: '2026-10-20', value: 5.12 },
      { date: '2026-10-21', value: 5.13 },
    ]);
    expect(parsed.dgs2!.at(-1)).toEqual({ date: '2026-10-21', value: 4.81 });
    expect(parsed.dgs30!.at(-1)).toEqual({ date: '2026-10-21', value: 5.42 });
  });

  it('reads the real curve (10 YR — the DFII10 basis, cross-checked live: 2.76 on 2026-10-21)', () => {
    const parsed = parseTreasuryCurveCsv(REAL_CSV, { dfii10: '10 YR' });
    expect(parsed.dfii10!.at(-1)).toEqual({ date: '2026-10-21', value: 2.76 });
  });

  it('tolerates the 2016 column set (no "1.5 Month"/"4 Mo" — identity is by NAME)', () => {
    const csv2016 = [
      'Date,"1 Mo","3 Mo","6 Mo","1 Yr","2 Yr","3 Yr","5 Yr","7 Yr","10 Yr","20 Yr","30 Yr"',
      '12/30/2016,0.44,0.51,0.62,0.83,1.20,1.47,1.93,2.25,2.49,3.05,3.06',
    ].join('\n');
    const parsed = parseTreasuryCurveCsv(csv2016, { dgs2: '2 Yr', dgs10: '10 Yr', dgs30: '30 Yr' });
    expect(parsed.dgs10).toEqual([{ date: '2016-12-30', value: 2.49 }]);
  });

  it('skips rows where a tenor is blank (missing quotes that day)', () => {
    const csv = [
      'Date,"2 Yr","10 Yr"',
      '10/21/2026,4.81,5.13',
      '10/20/2026,,5.12', // the 2 Yr was not quoted
      '10/19/2026,4.80,5.15',
    ].join('\n');
    const parsed = parseTreasuryCurveCsv(csv, { dgs2: '2 Yr', dgs10: '10 Yr' });
    expect(parsed.dgs2).toHaveLength(2);
    expect(parsed.dgs10).toHaveLength(3);
  });

  it('throws FormatChangedError on a non-Date header (an upstream layout change fails loudly)', () => {
    expect(() => parseTreasuryCurveCsv('date,x\n2026-01-01,1', { dgs10: '10 Yr' })).toThrow(FormatChangedError);
  });

  it('throws FormatChangedError when a named tenor column is absent', () => {
    expect(() => parseTreasuryCurveCsv(NOMINAL_CSV, { dgs10: '40 Yr' })).toThrow(FormatChangedError);
  });

  it('throws FormatChangedError on a non-numeric value', () => {
    const csv = 'Date,"10 Yr"\n10/21/2026,not-a-number';
    expect(() => parseTreasuryCurveCsv(csv, { dgs10: '10 Yr' })).toThrow(FormatChangedError);
  });
});

describe('treasuryT10y2y', () => {
  it('recomputes T10Y2Y as 10Y − 2Y at FRED\u2019s 2-dp presentation (live: 5.13 − 4.81 = 0.32)', () => {
    const curves: TreasuryCurves = {
      dgs2: [
        { date: '2026-10-20', value: 4.81 },
        { date: '2026-10-21', value: 4.81 },
      ],
      dgs10: [
        { date: '2026-10-20', value: 5.13 },
        { date: '2026-10-21', value: 5.13 },
      ],
      dgs30: [],
    };
    const out = treasuryT10y2y(curves);
    expect(out).toEqual([
      { date: '2026-10-20', value: 0.32 },
      { date: '2026-10-21', value: 0.32 },
    ]);
  });

  it('drops days where only one leg is quoted', () => {
    const curves: TreasuryCurves = {
      dgs2: [{ date: '2026-10-21', value: 4.81 }],
      dgs10: [
        { date: '2026-10-20', value: 5.13 },
        { date: '2026-10-21', value: 5.13 },
      ],
      dgs30: [],
    };
    expect(treasuryT10y2y(curves)).toEqual([{ date: '2026-10-21', value: 0.32 }]);
  });
});
