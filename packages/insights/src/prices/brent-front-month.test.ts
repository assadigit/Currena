import { describe, expect, it } from 'vitest';
import {
  brentMonthSymbols,
  BRENT_CONTINUOUS_SYMBOL,
  isBrentMonthSymbol,
  selectBrentFrontMonth,
} from './brent-front-month';
import type { YahooQuote } from '../adapters/yahoo';
import type { SeriesPoint } from '../series';

function quote(livePrice: number, symbol: string): YahooQuote {
  const points: SeriesPoint[] = [
    { date: '2026-10-28', value: livePrice },
    { date: '2026-10-29', value: livePrice },
  ];
  return { symbol, livePrice, points };
}

describe('brentMonthSymbols', () => {
  it('walks the month codes forward from the current month (2026-10 → V26, X26, Z26, F27…)', () => {
    expect(brentMonthSymbols(new Date('2026-10-29T00:00:00Z'), 4)).toEqual([
      'BZV26.NYM',
      'BZX26.NYM',
      'BZZ26.NYM',
      'BZF27.NYM',
    ]);
  });

  it('rolls the year at December→January', () => {
    expect(brentMonthSymbols(new Date('2026-12-01T00:00:00Z'), 3)).toEqual([
      'BZZ26.NYM',
      'BZF27.NYM',
      'BZG27.NYM',
    ]);
    expect(brentMonthSymbols(new Date('2027-01-01T00:00:00Z'), 2)).toEqual(['BZF27.NYM', 'BZG27.NYM']);
  });
});

describe('isBrentMonthSymbol', () => {
  it('accepts the specific months, rejects the continuous and junk', () => {
    expect(isBrentMonthSymbol('BZZ26.NYM')).toBe(true);
    expect(isBrentMonthSymbol('BZF27.NYM')).toBe(true);
    expect(isBrentMonthSymbol(BRENT_CONTINUOUS_SYMBOL)).toBe(false);
    expect(isBrentMonthSymbol('CLZ26.NYM')).toBe(false);
    expect(isBrentMonthSymbol('')).toBe(false);
  });
});

describe('selectBrentFrontMonth', () => {
  it('takes the FIRST usable month in probe order (the front month), skipping expired ones', () => {
    // The 2026-10-29 live incident, replayed: November expired (no answer),
    // December BZZ26.NYM trades 114.34, January BZF27.NYM 110.50 — the
    // continuous (rolled onto January) would have quoted the wrong month.
    const candidates = new Map<string, YahooQuote | undefined>([
      ['BZX26.NYM', undefined],
      ['BZZ26.NYM', quote(114.34, 'BZZ26.NYM')],
      ['BZF27.NYM', quote(110.5, 'BZF27.NYM')],
    ]);
    const picked = selectBrentFrontMonth(candidates);
    expect(picked?.symbol).toBe('BZZ26.NYM');
    expect(picked?.quote.livePrice).toBe(114.34);
  });

  it('skips a month that answers with a non-positive or non-finite price', () => {
    const candidates = new Map<string, YahooQuote | undefined>([
      ['BZX26.NYM', quote(0, 'BZX26.NYM')],
      ['BZZ26.NYM', quote(114.34, 'BZZ26.NYM')],
    ]);
    expect(selectBrentFrontMonth(candidates)?.symbol).toBe('BZZ26.NYM');
  });

  it('returns undefined when no specific month answers (the caller falls back to the continuous)', () => {
    const candidates = new Map<string, YahooQuote | undefined>([
      ['BZX26.NYM', undefined],
      ['BZZ26.NYM', undefined],
    ]);
    expect(selectBrentFrontMonth(candidates)).toBeUndefined();
  });

  it('never picks the continuous symbol even when it is the only usable candidate', () => {
    const candidates = new Map<string, YahooQuote | undefined>([
      [BRENT_CONTINUOUS_SYMBOL, quote(110.51, 'BZ=F')],
    ]);
    expect(selectBrentFrontMonth(candidates)).toBeUndefined();
  });
});
