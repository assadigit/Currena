/**
 * us-shares-aud.test.ts — Step 3 L2-03 + T-21 (AUD conversion) + T-20
 * (same-date legs): the AUD view is plain arithmetic over same-date inputs
 * and is REFUSED when the two feeds' dates differ.
 */

import { describe, expect, it } from 'vitest';
import type { FxSnapshot, MarketsSnapshot } from '@currena/core';
import { usSharesInAud } from './us-shares-aud';

const markets = {
  generatedAt: '2026-10-15T23:30:00.000Z',
  markets: [
    { id: 'sp500', asOf: '2026-10-15', close: 6600, chg1d: 0.2, chg3m: 2.5, chg1m: 1.0 },
    { id: 'ndx', asOf: '2026-10-15', close: 25000, chg1d: 0.3, chg3m: 3.2, chg1m: 1.5 },
  ],
} as unknown as MarketsSnapshot;

const fx = {
  generatedAt: '2026-10-15T23:30:00.000Z',
  pairs: [
    {
      id: 'audusd',
      asOf: '2026-10-15',
      rate: 0.7,
      chg: { d1: 0.1, m1: -2.0, m3: 1.0, y1: 3.0 },
      moveRank: 50,
      bigMove: false,
      source: 'frankfurter',
      stale: false,
    },
  ],
} as unknown as FxSnapshot;

describe('usSharesInAud (Step 3 L2-03)', () => {
  it('converts the level (USD × AUD/USD) and compounds the 1-month AUD change', () => {
    const view = usSharesInAud(markets, fx);
    expect(view.kind).toBe('ready');
    if (view.kind !== 'ready') return;
    expect(view.asOf).toBe('2026-10-15');
    const sp = view.rows.find((r) => r.id === 'sp500')!;
    expect(sp.closeAud).toBeCloseTo(6600 * 0.7, 6); // T-21: level × rate
    expect(sp.chg1mUsd).toBe(1.0);
    expect(sp.fxEffect).toBe(-2.0);
    // (1 + 1%) × (1 − 2%) − 1 = −1.02%
    expect(sp.chg1mAud).toBeCloseTo((1.01 * 0.98 - 1) * 100, 6);
    const ndx = view.rows.find((r) => r.id === 'ndx')!;
    expect(ndx.closeAud).toBeCloseTo(25000 * 0.7, 6);
  });

  it('refuses the AUD view when the two feeds carry different dates (T-20 discipline)', () => {
    const laggedFx = {
      ...fx,
      pairs: [{ ...fx.pairs[0], asOf: '2026-10-14' }],
    } as unknown as FxSnapshot;
    const view = usSharesInAud(markets, laggedFx);
    expect(view).toEqual({ kind: 'dates-differ', marketAsOf: '2026-10-15', fxAsOf: '2026-10-14' });
  });

  it('is honest about missing feeds (unavailable, never a guess)', () => {
    expect(usSharesInAud(null, fx).kind).toBe('unavailable');
    expect(usSharesInAud(markets, null).kind).toBe('unavailable');
    const noAud = { ...fx, pairs: [] } as unknown as FxSnapshot;
    expect(usSharesInAud(markets, noAud).kind).toBe('unavailable');
  });
});
