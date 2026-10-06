import { describe, expect, it } from 'vitest';

import {
  parseAbsPeriodCsv,
  parseFrankfurterTimeseries,
  parseFredCsv,
  parseWorldBankMonthlyCsv,
} from './parsers';

describe('parseFredCsv', () => {
  it('parses the fredgraph.csv shape and drops "." missing markers', () => {
    const csv = ['observation_date,T10Y2Y', '2004-01-02,2.44', '2004-01-05,.', '2004-01-06,2.45', ''].join('\n');
    expect(parseFredCsv(csv)).toEqual([
      { date: '2004-01-02', value: 2.44 },
      { date: '2004-01-06', value: 2.45 },
    ]);
  });

  it('fails loudly on an unexpected header, bad date, or non-numeric value', () => {
    expect(() => parseFredCsv('DATE,VALUE\n2004-01-02,1')).toThrow(/header/);
    expect(() => parseFredCsv('observation_date,X\n2004/01/02,1')).toThrow(/ISO calendar date/);
    expect(() => parseFredCsv('observation_date,X\n2004-01-02,abc')).toThrow(/finite number/);
  });
});

describe('parseFrankfurterTimeseries', () => {
  const json = JSON.stringify({
    amount: 1,
    base: 'USD',
    rates: {
      '2004-01-01': { JPY: 106.93, AUD: 1.3303 },
      '2004-01-02': { JPY: 106.99 },
      '2004-01-05': { JPY: 106.29, AUD: 1.3069 },
    },
  });

  it('extracts one ascending series per currency; absent currency that day is dropped', () => {
    expect(parseFrankfurterTimeseries(json, 'AUD')).toEqual([
      { date: '2004-01-01', value: 1.3303 },
      { date: '2004-01-05', value: 1.3069 },
    ]);
    expect(parseFrankfurterTimeseries(json, 'JPY')).toHaveLength(3);
  });

  it('fails loudly on non-JSON or a missing rates object', () => {
    expect(() => parseFrankfurterTimeseries('not json', 'JPY')).toThrow(/not JSON/);
    expect(() => parseFrankfurterTimeseries('{"base":"USD"}', 'JPY')).toThrow(/no "rates"/);
  });
});

describe('parseWorldBankMonthlyCsv', () => {
  const csv = [
    'month,brent_usd_bbl,iron_ore_usd_dmtu,copper_usd_mt,gold_usd_toz,silver_usd_toz',
    '2004M01,32.27,…,2443.22,414.05,5.99',
    '2004M02,31.35,36.40,,,,5.88',
    '',
  ].join('\n');

  it('maps months to first-of-month dates and drops … and empty cells', () => {
    expect(parseWorldBankMonthlyCsv(csv, 'gold_usd_toz')).toEqual([{ date: '2004-01-01', value: 414.05 }]);
    expect(parseWorldBankMonthlyCsv(csv, 'iron_ore_usd_dmtu')).toEqual([{ date: '2004-02-01', value: 36.4 }]);
    expect(parseWorldBankMonthlyCsv(csv, 'brent_usd_bbl')).toHaveLength(2);
  });

  it('fails loudly on a bad month token or an unknown column', () => {
    expect(() => parseWorldBankMonthlyCsv('month,gold_usd_toz\n2004-01,400', 'gold_usd_toz')).toThrow(/YYYYMnn/);
    expect(() => parseWorldBankMonthlyCsv(csv, 'platinum' as never)).toThrow(/no column/);
  });
});

describe('parseAbsPeriodCsv', () => {
  it('maps quarters and months to their first day', () => {
    const csv = ['quarter,index_value', '2004-Q1,55.71', '2004-Q2,56.13', ''].join('\n');
    expect(parseAbsPeriodCsv(csv)).toEqual([
      { date: '2004-01-01', value: 55.71 },
      { date: '2004-04-01', value: 56.13 },
    ]);
    const monthly = ['month,unemployment_rate_pct', '2004-01,5.53', ''].join('\n');
    expect(parseAbsPeriodCsv(monthly)).toEqual([{ date: '2004-01-01', value: 5.53 }]);
  });

  it('fails loudly on an unknown period shape', () => {
    expect(() => parseAbsPeriodCsv('quarter,index_value\n2004/1,55')).toThrow(/neither/);
  });
});
