import type { Snapshot } from '@currena/core';
import { describe, expect, it } from 'vitest';
import { liveRateView, rateDecimals, rateShareText, sparklineWindow, bucketMean } from './live-rate';

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

describe('bucketMean — the drawn-line noise melt (owner report 2026-10-16)', () => {
  it('series at or under maxBuckets passes through untouched', () => {
    expect(bucketMean([3, 1, 2], 48)).toEqual([3, 1, 2]);
    expect(bucketMean([3, 1, 2], 3)).toEqual([3, 1, 2]);
  });

  it('averages contiguous equal buckets (exact division)', () => {
    // 240 points → 48 buckets of exactly 5.
    const series = Array.from({ length: 240 }, (_, i) => i + 1); // 1..240
    const drawn = bucketMean(series, 48);
    expect(drawn).toHaveLength(48);
    expect(drawn[0]).toBe(3); // (1+2+3+4+5)/5
    expect(drawn[1]).toBe(8); // (6..10)/5
    expect(drawn[47]).toBe(238); // (236..240)/5
  });

  it('spreads an uneven remainder without gaps or overlaps', () => {
    const series = Array.from({ length: 100 }, (_, i) => i + 1); // 1..100
    const drawn = bucketMean(series, 48);
    expect(drawn).toHaveLength(48);
    // Mass conservation: every input lands in exactly one bucket — each
    // bucket mean weighted by its occupancy (floor((b+1)·w) − floor(b·w),
    // w = 100/48) reconstructs sum(1..100) = 5050 exactly.
    const w = 100 / 48;
    let mass = 0;
    for (let b = 0; b < 48; b++) {
      const n = Math.floor((b + 1) * w) - Math.floor(b * w);
      mass += drawn[b]! * n;
    }
    expect(mass).toBeCloseTo(5050, 6);
    // Monotonic bucket means for a monotonic series (order preserved).
    for (let i = 1; i < drawn.length; i++) {
      expect(drawn[i]!).toBeGreaterThanOrEqual(drawn[i - 1]!);
    }
  });

  it('melts strict a/b alternation into a calm band (the TGJU sawtooth)', () => {
    // 240 ticks alternating between two levels 0.375% apart, drifting down.
    const a = 100;
    const b = 100.375;
    const series = Array.from({ length: 240 }, (_, i) => (i % 2 === 0 ? a - i * 0.005 : b - i * 0.005));
    const drawn = bucketMean(series, 48);
    expect(drawn).toHaveLength(48);
    // Consecutive bucket means differ by FAR less than the raw a/b step.
    const maxStep = Math.max(...drawn.slice(1).map((v, i) => Math.abs(v - drawn[i]!)));
    expect(maxStep).toBeLessThan((b - a) / 2);
  });

  it('maxBuckets 0 and empty series → empty array', () => {
    expect(bucketMean([1, 2, 3], 0)).toEqual([]);
    expect(bucketMean([], 48)).toEqual([]);
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
    expect(rateShareText(view, 'دلار', 'تومان ایرانی', 'کورنا', 'fa-IR', true)).toBe(
      '۱ دلار = ۲۳۰٬۵۰۰ تومان ایرانی · کورنا (currena.ir)',
    );
  });

  it('international pairs keep their decimals (sub-1 rates use the 8-decimal rule)', () => {
    const fx = liveRateView(frankfurterSnapshot('2026-10-07T12:00:00.000Z'), 'USD', 'EUR')!;
    expect(rateShareText(fx, 'US Dollar', 'Euro', 'Currena', 'en-US', false)).toBe(
      '1 US Dollar = 0.86678 Euro · Currena (currena.ir)',
    );
  });
});
