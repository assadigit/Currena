/**
 * validation-step3.test.ts — the Step 3 test layer (T-15 … T-24) and the
 * dedicated defect checks (E-04, E-05, E-06, E-10, E-11, E-18, E-24).
 *
 * These unit tests pin each check's CATCHING and PASSING behaviour with
 * synthetic data. The proof that the defect checks FAIL against the real
 * 15 Oct baseline lives in docs/insights/baseline-test-results.md
 * (scripts/baseline-defect-check.ts output — frozen evidence, not a
 * permanently-red suite).
 */

import { describe, expect, it } from 'vitest';
import { DEFINITIONS } from './definitions';
import {
  checkE04NoFrozenDailyValues,
  checkE04RepeatAcrossDays,
  checkE05IdenticalMoves,
  checkE06StaleTagShown,
  checkE10M2Unit,
  checkE11InterestBillScale,
  checkE18TrendReproducible,
  checkE24PeakColumnsInExport,
  containsAdviceWording,
  highestSinceYear,
  runDefectChecksOnBaseline,
  stockStateLabel,
  t15ModeGate,
  t16FredCopyrightScan,
  t17AttributionPresent,
  t18FailClosed,
  t19NoAdviceWording,
  t20SameDateSpreads,
  t21AudConversion,
  t22HighestSince,
  t23Layer2Regression,
  trendFrom3m,
  type DefectRowLike,
  type FredCopyrightRecord,
  type LicenceLike,
} from './validation-step3';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('T-15 mode gate', () => {
  const yahoo: LicenceLike = {
    provider: 'yahoo',
    licenceName: 'unofficial endpoints',
    attributionText: '',
    privateOk: true,
    publicDisplayOk: 'no',
    termsCheckedOn: '2026-10-16',
    attributionRequired: false,
  };
  const abs: LicenceLike = { ...yahoo, provider: 'abs', publicDisplayOk: 'yes', attributionRequired: true, attributionText: 'Source: Australian Bureau of Statistics' };

  it('private mode allows everything (private-first design)', () => {
    const r = t15ModeGate('private', [{ id: 'brent', provider: 'yahoo', licence: yahoo }]);
    expect(r.ok).toBe(true);
  });
  it('public mode fails on a non-public source', () => {
    const r = t15ModeGate('public', [{ id: 'brent', provider: 'yahoo', licence: yahoo }]);
    expect(r.ok).toBe(false);
    expect(r.failures[0]).toContain('brent');
  });
  it('public mode passes when every displayed source is public_display_ok yes', () => {
    const r = t15ModeGate('public', [{ id: 'au-cpi', provider: 'abs', licence: abs }]);
    expect(r.ok).toBe(true);
  });
  it('public mode fails closed on a missing licence block', () => {
    const r = t15ModeGate('public', [{ id: 'x', provider: 'mystery' }]);
    expect(r.ok).toBe(false);
  });
});

describe('T-16 FRED copyright scan', () => {
  const entries = [
    { id: 'vix', source: { provider: 'fred', name: 'FRED (VIXCLS)', url: 'x', seriesIdOrTable: 'FRED:VIXCLS' }, licence: { licenceName: '', attributionText: '', privateOk: true, publicDisplayOk: 'no' as const, termsCheckedOn: '2026-10-16' } },
    { id: 'us10y', source: { provider: 'fred', name: 'FRED (DGS10)', url: 'x', seriesIdOrTable: 'FRED:DGS10' }, licence: { licenceName: '', attributionText: '', privateOk: true, publicDisplayOk: 'yes' as const, termsCheckedOn: '2026-10-16' } },
  ];
  it('a copyrighted series must be public_display_ok no', () => {
    const records: FredCopyrightRecord[] = [
      { seriesId: 'VIXCLS', copyrightNotice: true, checkedOn: '2026-10-16', evidence: 'copyrighted: citation required' },
      { seriesId: 'DGS10', copyrightNotice: false, checkedOn: '2026-10-16' },
    ];
    const r = t16FredCopyrightScan(entries, records);
    expect(r.ok).toBe(true);
  });
  it('a copyrighted series marked public fails', () => {
    const bad = entries.map((e) => (e.id === 'vix' ? { ...e, licence: { ...e.licence!, publicDisplayOk: 'yes' as const } } : e));
    const records: FredCopyrightRecord[] = [
      { seriesId: 'VIXCLS', copyrightNotice: true, checkedOn: '2026-10-16' },
      { seriesId: 'DGS10', copyrightNotice: false, checkedOn: '2026-10-16' },
    ];
    const r = t16FredCopyrightScan(bad, records);
    expect(r.ok).toBe(false);
    expect(r.failures[0]).toContain('VIXCLS');
  });
  it('an unscanned series fails closed', () => {
    const r = t16FredCopyrightScan(entries, []);
    expect(r.ok).toBe(false);
    expect(r.failures.length).toBe(2);
  });
});

describe('T-17 attribution present', () => {
  it('an attribution-required source without text fails', () => {
    const r = t17AttributionPresent([
      { provider: 'rba', licenceName: 'CC BY 4.0', attributionText: '', privateOk: true, publicDisplayOk: 'yes', termsCheckedOn: '2026-10-16', attributionRequired: true },
    ]);
    expect(r.ok).toBe(false);
  });
  it('attribution text present passes', () => {
    const r = t17AttributionPresent([
      { provider: 'rba', licenceName: 'CC BY 4.0', attributionText: 'Source: Reserve Bank of Australia [year]', privateOk: true, publicDisplayOk: 'yes', termsCheckedOn: '2026-10-16', attributionRequired: true },
    ]);
    expect(r.ok).toBe(true);
  });
});

describe('T-18 fail closed', () => {
  it('a forced-stale reading may not carry a verdict status', () => {
    const r = t18FailClosed(
      [
        { id: 'vix', status: 'normal', asOf: '2026-01-01' },
        { id: 'au-10y', status: 'stale', asOf: '2026-10-07' },
      ],
      ['vix', 'au-10y'],
    );
    expect(r.ok).toBe(false);
    expect(r.failures[0]).toContain('vix');
  });
  it('a missing reading for a forced-stale input fails', () => {
    const r = t18FailClosed([], ['vix']);
    expect(r.ok).toBe(false);
  });
});

describe('T-19 no advice wording', () => {
  it('catches the whole forbidden set', () => {
    expect(containsAdviceWording('you should buy')).toContain('buy');
    expect(containsAdviceWording('a time to act')).toContain('time to');
    expect(containsAdviceWording('shares are undervalued here')).toContain('undervalued');
    expect(containsAdviceWording('the market turned bullish')).toContain('bullish');
    expect(containsAdviceWording('it will rise')).toContain('will');
    expect(containsAdviceWording('expected to climb')).toContain('expected to');
  });
  it('internal verbs are not advice', () => {
    expect(containsAdviceWording('the engine holds the last good value')).toEqual([]);
    expect(containsAdviceWording('gold settled lower')).toEqual([]);
  });
  it('generated text is scanned', () => {
    const r = t19NoAdviceWording([{ where: 'gold card', text: 'conditions favour buying' }]);
    expect(r.ok).toBe(false);
  });
});

describe('T-20 same-date spreads', () => {
  it('same-date legs pass', () => {
    const r = t20SameDateSpreads([
      { id: 'au-us-10y-gap', asOf: '2026-10-13', gapLegs: { a: { id: 'au-10y', asOf: '2026-10-13' }, b: { id: 'us10y', asOf: '2026-10-13' } } },
    ]);
    expect(r.ok).toBe(true);
  });
  it('differing leg dates without the marker fail', () => {
    const r = t20SameDateSpreads([
      { id: 'au-us-10y-gap', asOf: '2026-10-13', gapLegs: { a: { id: 'au-10y', asOf: '2026-10-07' }, b: { id: 'us10y', asOf: '2026-10-13' } } },
    ]);
    expect(r.ok).toBe(false);
  });
  it('differing leg dates WITH the dates-differ marker pass', () => {
    const r = t20SameDateSpreads([
      { id: 'au-us-10y-gap', asOf: '2026-10-13', datesDiffer: true, gapLegs: { a: { id: 'au-10y', asOf: '2026-10-07' }, b: { id: 'us10y', asOf: '2026-10-13' } } },
    ]);
    expect(r.ok).toBe(true);
  });
});

describe('T-21 AUD conversion', () => {
  it('correct conversion on the same date passes', () => {
    const r = t21AudConversion([{ id: 'spx-aud', usdLevel: 7718.94, audLevel: 11016.4, audUsd: 1.4267, usdDate: '2026-10-14', audUsdDate: '2026-10-14' }]);
    expect(r.ok).toBe(true);
  });
  it('mixed dates fail', () => {
    const r = t21AudConversion([{ id: 'spx-aud', usdLevel: 7718.94, audLevel: 11016.4, audUsd: 1.4267, usdDate: '2026-10-14', audUsdDate: '2026-10-13' }]);
    expect(r.ok).toBe(false);
  });
  it('wrong arithmetic fails', () => {
    const r = t21AudConversion([{ id: 'spx-aud', usdLevel: 7718.94, audLevel: 9999, audUsd: 1.4267, usdDate: '2026-10-14', audUsdDate: '2026-10-14' }]);
    expect(r.ok).toBe(false);
  });
});

describe('T-22 highest-since', () => {
  // 10 years of daily data around a level; the value is at its own recent
  // episode, last independently reached in 2007.
  const history: { date: string; value: number }[] = [];
  for (let y = 2000; y <= 2026; y++) {
    history.push({ date: `${y}-06-15`, value: y <= 2007 ? 5.2 + (y - 2000) * 0.01 : 2 + (y - 2008) * 0.1 });
  }
  history.push({ date: '2026-10-09', value: 5.3 });
  history.push({ date: '2026-10-12', value: 5.21 });
  it('the year comes from the full stored history', () => {
    expect(highestSinceYear(5.21, history, '2026-10-15T00:00:00Z')).toBe(2007);
  });
  it('the test compares a claim against the search', () => {
    const r = t22HighestSince([{ id: 'us10y', value: 5.21, history, claimedYear: 2002, now: '2026-10-15T00:00:00Z' }]);
    expect(r.ok).toBe(false);
    const ok = t22HighestSince([{ id: 'us10y', value: 5.21, history, claimedYear: 2007, now: '2026-10-15T00:00:00Z' }]);
    expect(ok.ok).toBe(true);
  });
});

describe('T-23 Layer 2 regression labels', () => {
  it('L2-01 thresholds are the common conventions', () => {
    expect(stockStateLabel(-1.28)).toBe('Near its high');
    expect(stockStateLabel(-5.86)).toBe('Pullback');
    expect(stockStateLabel(-13.06)).toBe('Correction');
    expect(stockStateLabel(-34.07)).toBe('Bear market');
  });
  it('saved episode rows reproduce the labels', () => {
    const r = t23Layer2Regression([
      { id: 'spx-2020', fromHighPct: -34.0, expected: 'Bear market' },
      { id: 'spx-2022', fromHighPct: -25.4, expected: 'Bear market' },
      { id: 'ndx-2025', fromHighPct: -4.1, expected: 'Near its high' },
    ]);
    expect(r.ok).toBe(true);
  });
});

/* ---------------------- defect checks ---------------------- */

describe('E-04 frozen daily values', () => {
  it('flags the copper fingerprint', () => {
    const rows: DefectRowLike[] = [{ id: 'copper-usd', value: 14772.999807, cadence: 'daily', unit: 'US$' }];
    expect(checkE04NoFrozenDailyValues(rows).length).toBe(1);
  });
  it('does not flag legitimate 6-decimal FX/index rows', () => {
    const rows: DefectRowLike[] = [
      { id: 'audusd', value: 0.700967, cadence: 'daily', unit: 'US$' },
      { id: 'dollar-basket', value: 102.224744, cadence: 'daily', unit: 'index' },
    ];
    expect(checkE04NoFrozenDailyValues(rows)).toEqual([]);
  });
  it('flags an exact repeat across days', () => {
    const today: DefectRowLike[] = [{ id: 'copper-usd', value: 14773.0, cadence: 'daily' }];
    const yesterday: DefectRowLike[] = [{ id: 'copper-usd', value: 14773.0, cadence: 'daily' }];
    expect(checkE04RepeatAcrossDays(today, yesterday).length).toBe(1);
    const moved: DefectRowLike[] = [{ id: 'copper-usd', value: 14780.5, cadence: 'daily' }];
    expect(checkE04RepeatAcrossDays(moved, yesterday)).toEqual([]);
  });
});

describe('E-05 identical daily moves', () => {
  it('flags the baseline S&P/TSX pair', () => {
    const rows = [
      { id: 'S&P 500', chg1d: -1.11 },
      { id: 'S&P/TSX Composite', chg1d: -1.11 },
      { id: 'DAX', chg1d: 0.15 },
    ];
    expect(checkE05IdenticalMoves(rows).length).toBe(1);
  });
  it('distinct moves pass', () => {
    expect(checkE05IdenticalMoves([{ id: 'a', chg1d: -1.11 }, { id: 'b', chg1d: -1.12 }])).toEqual([]);
  });
});

describe('E-06 stale tag shown', () => {
  it('flags the baseline AU yield family', () => {
    const rows: (DefectRowLike & { status: string })[] = [
      { id: 'au-10y', value: 5.404, asOf: '2026-10-07', status: 'Needs attention' },
      { id: 'rba-expectations', value: 0.333, asOf: '2026-10-07', status: 'Normal' },
    ];
    const r = checkE06StaleTagShown(rows, '2026-10-15T12:00:00Z', () => 4);
    expect(r.length).toBe(2);
  });
  it('a properly tagged stale row passes', () => {
    const rows: (DefectRowLike & { status: string })[] = [{ id: 'au-10y', value: 5.404, asOf: '2026-10-07', status: 'stale' }];
    expect(checkE06StaleTagShown(rows, '2026-10-15T12:00:00Z', () => 4)).toEqual([]);
  });
});

describe('E-10 M2 unit', () => {
  it('flags the baseline trillion label on a billions value', () => {
    expect(checkE10M2Unit([{ id: 'm2-us', value: 23342.8, unit: 'trillion' }]).length).toBe(1);
  });
  it('the fixed unit passes', () => {
    expect(checkE10M2Unit([{ id: 'm2-us', value: 23342.8, unit: 'US$ billion' }])).toEqual([]);
  });
});

describe('E-11 interest bill scale', () => {
  it('flags a fraction labelled %', () => {
    expect(checkE11InterestBillScale([{ id: 'govt-interest-revenue', value: 0.335539, unit: '%' }]).length).toBe(1);
  });
  it('the percentage value passes', () => {
    expect(checkE11InterestBillScale([{ id: 'govt-interest-revenue', value: 33.55, unit: '%' }])).toEqual([]);
  });
});

describe('E-18 trend reproducible', () => {
  it('the stated rule: ±1.0% on the 3-month change', () => {
    expect(trendFrom3m(1.54)).toBe('Up');
    expect(trendFrom3m(1.0)).toBe('Up');
    expect(trendFrom3m(0.99)).toBe('Flat');
    expect(trendFrom3m(-1.0)).toBe('Down');
    expect(trendFrom3m(-0.5)).toBe('Flat');
  });
  it('flags the baseline mismatches', () => {
    const rows = [
      { id: 'DAX', chg3m: 1.54, trend: 'Down' },
      { id: 'S&P 500', chg3m: 2.46, trend: 'Flat' },
    ];
    expect(checkE18TrendReproducible(rows).length).toBe(2);
  });
  it('rule-conforming rows pass', () => {
    expect(checkE18TrendReproducible([{ id: 'DAX', chg3m: 1.54, trend: 'Up' }])).toEqual([]);
  });
});

describe('E-24 peak columns in export', () => {
  it('the baseline price table lacks the columns', () => {
    const r = checkE24PeakColumnsInExport([{ Indicator: 'Oil price (Brent)' }], ['Indicator', 'Value', 'Unit']);
    expect(r.length).toBe(4);
  });
  it('a table with populated peak columns passes', () => {
    const r = checkE24PeakColumnsInExport(
      [{ Indicator: 'Oil price (Brent)', Peak: 138.21, 'Peak date': '2026-04-07', 'Peak basis': 'daily-close', 'Below peak %': -24.3 }],
      ['Indicator', 'Peak', 'Peak date', 'Peak basis', 'Below peak %'],
    );
    expect(r).toEqual([]);
  });
});

describe('baseline fixture run (frozen evidence companion)', () => {
  it('the defect checks fail against the parsed 15 Oct export', () => {
    const fixturePath = resolve(__dirname, '../../../tests/fixtures/insights-baseline-2026-10-15.json');
    const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
    // the registry's daily cadences + the defect file's daily classification
    // of the RBA F2 yield family (E-06) — same list the recorded run used.
    const dailyIds = [
      ...Object.values(DEFINITIONS).filter((d) => d.cadence === 'daily').map((d) => d.id),
      'au-10y',
      'rba-expectations',
      'au-us-10y-gap',
    ];
    const results = runDefectChecksOnBaseline(fixture, dailyIds);
    const byId = new Map(results.map((r) => [r.id, r]));
    // every defect check must FAIL on the baseline (that is the proof it
    // catches the defect) — the recorded evidence lives in
    // docs/insights/baseline-test-results.md.
    for (const id of ['E-04', 'E-05', 'E-06', 'E-10', 'E-11', 'E-18', 'E-24']) {
      expect(byId.get(id)?.ok, `${id} must fail on the baseline`).toBe(false);
    }
  });
});
