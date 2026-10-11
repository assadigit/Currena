import type { Snapshot } from '@currena/core';
import { describe, expect, it } from 'vitest';
import { liveRateView, rateDecimals, rateShareText, sparklineWindow } from './live-rate';

function tgjuSnapshot(fetchedAt: string): Snapshot {
  return {
    base: 'IRR',
    source: 'tgju',
    fetchedAt,
    rates: [
      { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 / 230_500 },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 1 / 252_000 },
    ],
  };
}

function frankfurterSnapshot(fetchedAt: string): Snapshot {
  return {
    base: 'USD',
    source: 'frankfurter',
    fetchedAt,
    rates: [
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.86678 },
    ],
  };
}

describe('liveRateView', () => {
  it('resolves a tgju (IRR-side) pair with the Toman rate and its inverse', () => {
    const view = liveRateView(tgjuSnapshot('2026-10-07T12:00:00.000Z'), 'USD', 'IRR');
    expect(view).not.toBeNull();
    expect(view!.rate).toBeCloseTo(230_500, 6);
    expect(view!.inverse).toBeCloseTo(1 / 230_500, 10);
    expect(view!.fetchedAt).toBe('2026-10-07T12:00:00.000Z');
    expect(view!.source).toBe('tgju');
  });

  it('resolves an international pair from the frankfurter snapshot', () => {
    const view = liveRateView(frankfurterSnapshot('2026-10-07T12:00:00.000Z'), 'USD', 'EUR');
    expect(view).not.toBeNull();
    expect(view!.rate).toBeCloseTo(0.86678, 8);
    expect(view!.source).toBe('frankfurter');
  });

  it('same-currency pair → null (rate 1 is noise, not information)', () => {
    expect(liveRateView(tgjuSnapshot('2026-10-07T12:00:00.000Z'), 'USD', 'USD')).toBeNull();
  });

  it('no snapshot (booting / offline without cache) → null', () => {
    expect(liveRateView(null, 'USD', 'IRR')).toBeNull();
    expect(liveRateView(undefined, 'USD', 'EUR')).toBeNull();
  });

  it('pair unknown to the snapshot (AED via frankfurter) → null, never a throw', () => {
    expect(liveRateView(frankfurterSnapshot('2026-10-07T12:00:00.000Z'), 'AED', 'USD')).toBeNull();
  });
});

describe('sparklineWindow', () => {
  it('returns the tail of the series, oldest → newest', () => {
    expect(sparklineWindow([1, 2, 3, 4, 5], 3)).toEqual([3, 4, 5]);
  });

  it('shorter-than-max series pass through unchanged', () => {
    expect(sparklineWindow([1, 2], 40)).toEqual([1, 2]);
  });

  it('max 0 and empty series → empty window', () => {
    expect(sparklineWindow([1, 2, 3], 0)).toEqual([]);
    expect(sparklineWindow([], 40)).toEqual([]);
  });
});

describe('rateDecimals', () => {
  it('IRR pairs are Toman integers (0 decimals)', () => {
    expect(rateDecimals(230_500.7, true)).toBe(0);
  });

  it('international pairs get 4 decimals (legacy precision rule)', () => {
    expect(rateDecimals(1.29, false)).toBe(4);
    expect(rateDecimals(148.5, false)).toBe(4);
  });

  it('tiny rates get 8 decimals (legacy precision rule)', () => {
    expect(rateDecimals(0.0000043, false)).toBe(8);
    expect(rateDecimals(0.5, true)).toBe(8);
  });
});

describe('rateShareText', () => {
  const view = liveRateView(tgjuSnapshot('2026-10-07T12:00:00.000Z'), 'USD', 'IRR')!;

  it('builds the localized share line (en)', () => {
    expect(rateShareText(view, 'US Dollar', 'Iranian Toman', 'Currena', 'en-US', true)).toBe(
      '1 US Dollar = 230,500 Iranian Toman · Currena (currena.ir)',
    );
  });

  it('builds the localized share line (fa — Persian digits, native brand)', () => {
    expect(rateShareText(view, 'دلار آمریکا', 'تومان ایرانی', 'کورنا', 'fa-IR', true)).toBe(
      '۱ دلار آمریکا = ۲۳۰٬۵۰۰ تومان ایرانی · کورنا (currena.ir)',
    );
  });

  it('international pairs keep their decimals (sub-1 rates use the 8-decimal rule)', () => {
    const fx = liveRateView(frankfurterSnapshot('2026-10-07T12:00:00.000Z'), 'USD', 'EUR')!;
    expect(rateShareText(fx, 'US Dollar', 'Euro', 'Currena', 'en-US', false)).toBe(
      '1 US Dollar = 0.86678 Euro · Currena (currena.ir)',
    );
  });
});
