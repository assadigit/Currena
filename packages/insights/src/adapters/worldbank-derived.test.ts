import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { IndicatorId } from '@currena/core';
import { findPinkSheetMonthlyUrl, parseWorldBankMonthlySheet } from './worldbank';
import { buildIndicatorSeries, READING_SOURCES } from './derived';
import { readXlsxSheet } from './xlsx';
import type { SeriesPoint } from '../series';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '..', '..', 'fixtures');

describe('findPinkSheetMonthlyUrl', () => {
  it('extracts the single monthly workbook link from a page', () => {
    const html = `<a href="https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx">Monthly</a>
      <a href="https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Annual.xlsx">Annual</a>`;
    expect(findPinkSheetMonthlyUrl(html)).toBe(
      'https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx',
    );
  });

  it('fails loudly with zero or multiple candidate links', () => {
    expect(() => findPinkSheetMonthlyUrl('<html>no links</html>')).toThrow(/no CMO-Historical-Data-Monthly/);
    const two = 'https://thedocs.worldbank.org/en/doc/aaa/related/CMO-Historical-Data-Monthly.xlsx and https://thedocs.worldbank.org/en/doc/bbb/related/CMO-Historical-Data-Monthly.xlsx';
    expect(() => findPinkSheetMonthlyUrl(two)).toThrow(/2 different monthly workbook links/);
  });
});

describe('worldbank XLSX parse (real recorded workbook)', () => {
  // The full real Pink Sheet workbook — the honest integration fixture
  // (fixture-only per AGENTS.md rule 7; recorded 2026-10-06).
  const bytes = new Uint8Array(readFileSync(join(FIXTURES, 'worldbank-cmo-monthly.xlsx')));

  it('reads the Monthly Prices sheet and extracts the five series', async () => {
    const cells = await readXlsxSheet(bytes, 'Monthly Prices');
    const wb = parseWorldBankMonthlySheet(cells);

    for (const key of ['gold', 'silver', 'copper', 'ironOre', 'brent'] as const) {
      expect(wb[key].length, key).toBeGreaterThan(740); // 1960→2026 with early-year gaps
    }
    // Last observation is 2026M09 (verified against the sheet by hand during the probe).
    expect(wb.gold.at(-1)).toEqual({ date: '2026-09-01', value: 4319 });
    expect(wb.silver.at(-1)).toEqual({ date: '2026-09-01', value: 64.6 });
    expect(wb.brent.at(-1)).toEqual({ date: '2026-09-01', value: 116.8 });
    expect(wb.ironOre.at(-1)).toEqual({ date: '2026-09-01', value: 97.7 });
    expect(wb.copper.at(-1)).toEqual({ date: '2026-09-01', value: 14474 });
    // Gold and silver only start in 1976+ (missing-marker cells before that are skipped, never zero-filled).
    expect(wb.gold[0]!.date).toMatch(/^19\d{2}-\d{2}-01$/);
  });

  it('throws on an unknown sheet name', async () => {
    await expect(readXlsxSheet(bytes, 'Not A Sheet')).rejects.toThrow(/no sheet named/);
  });

  it('throws when a commodity column loses its identity (unit check)', async () => {
    const cells = await readXlsxSheet(bytes, 'Monthly Prices');
    const saboteur = cells.map((c) =>
      c.row === 6 && c.value === '($/troy oz)' ? { ...c, value: '($/kg)' } : c,
    );
    expect(() => parseWorldBankMonthlySheet(saboteur)).toThrow(/unit is "\(\$\/kg\)"/);
  });
});

describe('buildIndicatorSeries (assembly mirrors the backtest SERIES map)', () => {
  const today = '2026-10-06';

  function pts(values: [string, number][]): SeriesPoint[] {
    return values.map(([date, value]) => ({ date, value }));
  }

  const inputs = {
    today,
    fred: {
      T10Y2Y: pts([['2026-10-05', -0.1]]),
      STLFSI4: pts([['2026-09-25', -0.8]]),
      DFII10: pts([['2026-10-05', 1.9]]),
      DGS10: pts([['2026-10-05', 4.1]]),
      T5YIFR: pts([['2026-10-05', 2.3]]),
      A091RC1Q027SBEA: pts([['2026-04-01', 100]]),
      W006RC1Q027SBEA: pts([['2026-04-01', 800]]),
      DCOILBRENTEU: pts([['2026-10-05', 82.5]]),
      M2SL: pts([['2026-08-01', 23342]]),
      CPIAUCSL: pts([['2025-09-01', 300], ['2026-09-01', 309]]),
      DFEDTARL: pts([['2026-10-05', 3.5]]),
      DFEDTARU: pts([['2026-10-05', 3.75]]),
      NFCI: pts([['2026-10-02', -0.4]]),
    },
    ecb: {
      dfr: pts([['2026-10-06', 2.0]]),
    },
    fx: {
      JPY: pts([['2026-10-05', 158.0], ['2026-10-06', 158.1]]),
      AUD: pts([['2026-10-05', 1.43], ['2026-10-06', 1.4322]]),
      CNY: pts([['2026-10-06', 6.7046]]),
      EUR: pts([['2026-10-05', 0.86], ['2026-10-06', 0.8605]]),
      GBP: pts([['2026-10-05', 0.75], ['2026-10-06', 0.7502]]),
      CAD: pts([['2026-10-05', 1.38], ['2026-10-06', 1.3801]]),
      SEK: pts([['2026-10-05', 9.4], ['2026-10-06', 9.404]]),
      CHF: pts([['2026-10-05', 0.8], ['2026-10-06', 0.8003]]),
    },
    wb: {
      gold: pts([['2026-08-01', 4411], ['2026-09-01', 4319]]),
      silver: pts([['2026-08-01', 65.4], ['2026-09-01', 64.6]]),
      copper: pts([['2026-09-01', 14474]]),
      ironOre: pts([['2026-09-01', 97.7]]),
      brent: pts([['2026-09-01', 116.8]]),
    },
    xauSpot: { symbol: 'XAU', price: 4162.6, updatedAt: '2026-10-06T15:03:10Z' },
    xagSpot: { symbol: 'XAG', price: 61.28, updatedAt: '2026-10-06T15:03:10Z' },
    btcSpot: { symbol: 'BTC', price: 86625, updatedAt: '2026-10-06T15:03:10Z' },
    hgSpot: { symbol: 'HG', price: 6.66, updatedAt: '2026-10-06T15:03:10Z' },
    abs: {
      cpiIndex: pts([['2025-06-01', 100], ['2026-06-01', 104]]),
      trimmedMeanIndex: pts([['2025-06-01', 100], ['2026-06-01', 103]]),
      unemployment: pts([['2026-08-01', 4.2]]),
      resDwellMeanPrice: pts([['2026-06-01', 1100]]),
      termsOfTrade: pts([['2026-06-01', 96.1]]),
      rentIndex: pts([['2025-08-01', 96.1], ['2026-08-01', 99.5]]),
      automotiveFuelIndex: pts([['2025-08-01', 100], ['2026-08-01', 113.5]]),
      wageIndex: pts([['2025-06-01', 100], ['2026-06-01', 103.2]]),
    },
    rba: {
      cashRate: pts([['2026-09-29', 4.6]]),
      au10y: pts([['2026-10-05', 4.3]]),
      homeLoanOutstanding: pts([['2026-08-31', 6.21]]),
    },
  };

  it('composes direct, joined, inverted, yoy and live-point series', () => {
    const out = buildIndicatorSeries(inputs);

    // direct
    expect(out['yield-curve-10y2y']).toEqual(inputs.fred.T10Y2Y);
    // ratio join on common dates
    expect(out['govt-interest-revenue']).toEqual([{ date: '2026-04-01', value: 0.125 }]);
    // yoy percent
    expect(out['au-cpi']).toEqual([{ date: '2026-06-01', value: 4 }]);
    // inverse (full series inverted)
    expect(out.audusd).toHaveLength(2);
    expect(out.audusd!.at(-1)).toEqual({ date: '2026-10-06', value: 1 / 1.4322 });
    // cross (inner join on common dates — both legs have 10-05 and 10-06)
    expect(out.audjpy).toHaveLength(2);
    expect(out.audjpy!.at(-1)).toEqual({ date: '2026-10-06', value: 158.1 / 1.4322 });
    // gap (rba − fred on common dates)
    expect(out['au-us-10y-gap']).toHaveLength(1);
    expect(out['au-us-10y-gap']![0]!.date).toBe('2026-10-05');
    expect(out['au-us-10y-gap']![0]!.value).toBeCloseTo(0.2, 10);
    // I15 new compositions:
    // Step-1 A1: fed-target = the range's LOWER bound (DFEDTARL) — the
    // snapshot builder attaches DFEDTARU as rangeHigh.
    expect(out['fed-target']).toEqual([{ date: '2026-10-05', value: 3.5 }]);
    // ecb-dfr passes through
    expect(out['ecb-dfr']).toEqual(inputs.ecb.dfr);
    // us-cpi-yoy = 12-month pct change of the CPI index
    expect(out['us-cpi-yoy']).toEqual([{ date: '2026-09-01', value: 3 }]);
    // dollar-basket: one value per day where all six currencies align (both days here)
    expect(out['dollar-basket']).toHaveLength(2);
    expect(out['dollar-basket']!.at(-1)).toMatchObject({ date: '2026-10-06' });
    // eur-usd = the USD→EUR quote side directly
    expect(out['eur-usd']).toEqual(inputs.fx.EUR);
    // ABS yoy cards
    expect(out['au-rent-yoy']!.length).toBe(1);
    expect(out['au-rent-yoy']![0]!.value).toBeCloseTo((99.5 / 96.1 - 1) * 100, 10);
    expect(out['au-petrol-yoy']).toEqual([{ date: '2026-08-01', value: 13.5 }]);
    expect(out['au-wage-growth']![0]).toMatchObject({ date: '2026-06-01' });
    expect(out['au-wage-growth']![0]!.value).toBeCloseTo(3.2, 10);
    // RBA F6 passes through
    expect(out['au-home-loan']).toEqual(inputs.rba.homeLoanOutstanding);
    // copper: HG 6.66 USD/lb → 6.66 × 2204.62262 USD/mt, then live point on WB history
    expect(out['copper-usd']).toHaveLength(2);
    expect(out['copper-usd']!.at(-1)).toEqual({ date: today, value: 6.66 * 2204.62262 });
    // btc: single live point (no stored history yet)
    expect(out['btc-usd']).toEqual([{ date: today, value: 86625 }]);
    // live-point info cards
    expect(out['gold-btc']).toEqual([{ date: today, value: 4162.6 / 86625 }]);
    expect(out['silver-btc']).toEqual([{ date: today, value: 61.28 / 86625 }]);
    expect(out['gold-aud']).toEqual([{ date: today, value: 4162.6 * 1.4322 }]);
    // ounce price cards: monthly history + today's live point appended
    expect(out['gold-usd']).toHaveLength(3);
    expect(out['gold-usd']!.at(-1)).toEqual({ date: today, value: 4162.6 });
    expect(out['gold-usd']!.at(-2)).toEqual({ date: '2026-09-01', value: 4319 });
    expect(out['silver-usd']).toHaveLength(3);
    expect(out['silver-usd']!.at(-1)).toEqual({ date: today, value: 61.28 });
    expect(out['silver-usd']!.at(-2)).toEqual({ date: '2026-09-01', value: 64.6 });
    // gold-silver: monthly history + today's live point appended
    expect(out['gold-silver']).toHaveLength(3);
    expect(out['gold-silver']!.at(-1)).toEqual({ date: today, value: 4162.6 / 61.28 });
    // WB-only indicators
    expect(out['iron-ore']).toEqual(inputs.wb.ironOre);
    // FRED brent wins over the WB fallback
    expect(out.brent).toEqual(inputs.fred.DCOILBRENTEU);
    // every ABS P2 series passes through
    expect(out['au-home-values']).toEqual(inputs.abs.resDwellMeanPrice);
    expect(out['terms-of-trade']).toEqual(inputs.abs.termsOfTrade);
  });

  it('falls back to the World Bank monthly brent when FRED is down, and omits what it cannot build', () => {
    const noFredBrent = { ...inputs, fred: { ...inputs.fred, DCOILBRENTEU: undefined } };
    const out1 = buildIndicatorSeries(noFredBrent);
    expect(out1.brent).toEqual(inputs.wb.brent);

    const out2 = buildIndicatorSeries({ today, fred: {}, fx: {} });
    expect(out2.brent).toBeUndefined();
    expect(out2.usdjpy).toBeUndefined();
    expect(out2['au-us-10y-gap']).toBeUndefined();
  });

  it('keeps history intact when the live source is strictly behind the last observation', () => {
    // A lagging live source (spot dated before the newest stored point) must
    // never rewind the series.
    const laggingLive = { ...inputs, today: '2026-08-15' };
    const out = buildIndicatorSeries(laggingLive);
    expect(out['gold-silver']).toHaveLength(2);
    expect(out['gold-silver']!.at(-1)!.date).toBe('2026-09-01');
    expect(out['gold-usd']).toHaveLength(2);
    expect(out['gold-usd']!.at(-1)).toEqual({ date: '2026-09-01', value: 4319 });
    expect(out['silver-usd']).toHaveLength(2);
    expect(out['silver-usd']!.at(-1)).toEqual({ date: '2026-09-01', value: 64.6 });
    expect(out['copper-usd']).toHaveLength(1); // WB only — live point not newer
  });

  it('replaces a same-day point with the live observation (the day’s freshest price wins)', () => {
    // Production evidence 2026-10-08: the seeded rows kept the first-of-day
    // price while the unseeded gold-silver ratio carried the live one —
    // same-date cards disagreed. Same-date → the latest live fetch wins.
    const sameDay = { ...inputs, today: '2026-09-01' };
    const out = buildIndicatorSeries(sameDay);
    expect(out['gold-usd']).toHaveLength(2);
    expect(out['gold-usd']!.at(-1)).toEqual({ date: '2026-09-01', value: 4162.6 });
    expect(out['silver-usd']!.at(-1)).toEqual({ date: '2026-09-01', value: 61.28 });
    expect(out['copper-usd']!.at(-1)).toEqual({ date: '2026-09-01', value: 6.66 * 2204.62262 });
    // all same-date cards now agree on one price set
    expect(out['gold-silver']!.at(-1)).toEqual({ date: '2026-09-01', value: 4162.6 / 61.28 });
  });

  it('degrades the ounce price cards to single live points without the World Bank leg', () => {
    const noWb = { ...inputs, wb: undefined };
    const out = buildIndicatorSeries(noWb);
    expect(out['gold-usd']).toEqual([{ date: today, value: 4162.6 }]);
    expect(out['silver-usd']).toEqual([{ date: today, value: 61.28 }]);
    expect(out['copper-gold']).toBeUndefined();
    expect(out['iron-ore']).toBeUndefined();
  });

  it('falls back to World Bank monthly history when the live ounce sources are down', () => {
    const noLive = { ...inputs, xauSpot: undefined, xagSpot: undefined, hgSpot: undefined };
    const out = buildIndicatorSeries(noLive);
    expect(out['gold-usd']).toEqual(inputs.wb.gold);
    expect(out['silver-usd']).toEqual(inputs.wb.silver);
    expect(out['copper-usd']).toEqual(inputs.wb.copper);
    expect(out['gold-aud']).toBeUndefined();
  });

  it('I15: seedHistory accumulates onto the monthly base and the live point still wins the day', () => {
    const seeded = {
      ...inputs,
      seedHistory: {
        'gold-usd': pts([['2026-10-04', 4150], ['2026-10-05', 4155.5]]),
        'btc-usd': pts([['2026-10-05', 86000]]),
      },
    };
    const out = buildIndicatorSeries(seeded);
    // WB Aug/Sep + accumulated 10-04/10-05 + today's live point
    expect(out['gold-usd']).toHaveLength(5);
    expect(out['gold-usd']!.at(-2)).toEqual({ date: '2026-10-05', value: 4155.5 });
    expect(out['gold-usd']!.at(-1)).toEqual({ date: today, value: 4162.6 });
    // btc now has a 30-day-changeable daily history
    expect(out['btc-usd']).toEqual([
      { date: '2026-10-05', value: 86000 },
      { date: today, value: 86625 },
    ]);
  });

  it('I15: a same-day seed point is REPLACED by the newer live observation (intraday refresh)', () => {
    // The stored same-day point came from an earlier run of the same day —
    // this run's live fetch is the freshest observation of that date.
    const seeded = {
      ...inputs,
      seedHistory: {
        'gold-usd': pts([['2026-10-05', 4155.5], ['2026-10-06', 4160]]),
        'btc-usd': pts([['2026-10-05', 86000], ['2026-10-06', 86500]]),
      },
    };
    const out = buildIndicatorSeries(seeded);
    expect(out['gold-usd']!.at(-2)).toEqual({ date: '2026-10-05', value: 4155.5 });
    expect(out['gold-usd']!.at(-1)).toEqual({ date: today, value: 4162.6 }); // replaced 4160
    expect(out['btc-usd']!.at(-1)).toEqual({ date: today, value: 86625 }); // replaced 86500
    expect(out['btc-usd']).toHaveLength(2); // 10-05 + 10-06 (replaced in place, not appended)
  });

  it('I15: seed-only rows (no WB base) build from the accumulated history alone', () => {
    const seeded = { ...inputs, wb: undefined, seedHistory: { 'btc-usd': pts([['2026-10-05', 86000]]) } };
    const out = buildIndicatorSeries(seeded);
    expect(out['btc-usd']).toEqual([{ date: '2026-10-05', value: 86000 }, { date: today, value: 86625 }]);
  });

  it('I15: the basket needs every currency — one missing leg omits the indicator, never guesses', () => {
    const missingSek = { ...inputs, fx: { ...inputs.fx, SEK: undefined } };
    const out = buildIndicatorSeries(missingSek);
    expect(out['dollar-basket']).toBeUndefined();
    expect(out.usdjpy).toBeDefined(); // other FX cards unaffected
  });

  it('covers a reading source for every id it can emit', () => {
    const out = buildIndicatorSeries(inputs);
    const ids = Object.keys(out) as IndicatorId[];
    for (const id of ids) {
      expect(READING_SOURCES[id], `source for ${id}`).toBeDefined();
    }
  });
});
