/**
 * connections.test.ts — the "Together" card logic (I17, UI spec Block T1).
 *
 * Everything is synthetic IndicatorReadings: no fixtures, no network
 * (AGENTS.md rule 7). The "live-like" cases mirror the production snapshot
 * of 2026-10-08 (real-yield 2.91 rising · gold high · brent +22.7% ·
 * dollar basket rising · PMI 50.1 · AUD −3.6%) so the shipped states are
 * pinned, not accidental.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import {
  CONNECTIONS,
  evalLeg,
  evaluateConnection,
  evaluateConnections,
  type ConnectionDef,
} from './connections';

const BASE = '2026-10-08T04:20:11Z';

function reading(
  id: IndicatorId,
  fields: Partial<IndicatorReading> = {},
): IndicatorReading {
  return {
    id,
    value: 1,
    asOf: '2026-10-07',
    status: 'normal',
    sourceName: 'test',
    updatedAt: BASE,
    ...fields,
  } as IndicatorReading;
}

const def = (id: ConnectionDef['id']): ConnectionDef => {
  const d = CONNECTIONS.find((c) => c.id === id);
  if (!d) throw new Error(`no connection ${id}`);
  return d;
};

/* ---------------------------------------------------------------- *
 * evalLeg — direction thresholds, level fallback, honest nulls
 * ---------------------------------------------------------------- */

describe('evalLeg', () => {
  it('maps change30d across the per-leg threshold to rising/falling/steady (points)', () => {
    const ry = (ch: number) => reading('real-yield-10y', { change30d: ch, percentile10y: 0.5 });
    expect(evalLeg('real-yield-10y', ry(0.11)).direction).toBe('rising');
    expect(evalLeg('real-yield-10y', ry(-0.11)).direction).toBe('falling');
    expect(evalLeg('real-yield-10y', ry(0.05)).direction).toBe('steady');
    // exactly on the threshold is steady (strict comparison, house convention)
    expect(evalLeg('real-yield-10y', ry(0.1)).direction).toBe('steady');
  });

  it('uses pct thresholds for pct legs (brent 5, gold 3)', () => {
    expect(evalLeg('brent', reading('brent', { change30d: 22.7 })).direction).toBe('rising');
    expect(evalLeg('brent', reading('brent', { change30d: -5.1 })).direction).toBe('falling');
    expect(evalLeg('brent', reading('brent', { change30d: 4.9 })).direction).toBe('steady');
    expect(evalLeg('gold-usd', reading('gold-usd', { change30d: 3.1 })).direction).toBe('rising');
    expect(evalLeg('gold-usd', reading('gold-usd', { change30d: 2.9 })).direction).toBe('steady');
  });

  it('falls back to the level lean when direction is unmeasurable', () => {
    // gold has no change30d yet (I16 accrual) but sits high: lean +1
    const leg = evalLeg('gold-usd', reading('gold-usd', { percentile10y: 0.925, change30d: undefined }));
    expect(leg.direction).toBeNull();
    expect(leg.level).toBe('high');
    expect(leg.lean).toBe(1);
  });

  it('a steady direction still leans by level (flat at a decade extreme is not neutral)', () => {
    const leg = evalLeg('rba-cash-rate', reading('rba-cash-rate', { change30d: 0.01, percentile10y: 1 }));
    expect(leg.direction).toBe('steady');
    expect(leg.lean).toBe(1);
    const low = evalLeg('audusd', reading('audusd', { change30d: 0, percentile10y: 0.1 }));
    expect(low.lean).toBe(-1);
  });

  it('steady + typical is honestly neutral; missing fields degrade to null', () => {
    const leg = evalLeg('terms-of-trade', reading('terms-of-trade', { percentile10y: 0.43 }));
    expect(leg.direction).toBeNull();
    expect(leg.level).toBe('typical');
    expect(leg.lean).toBe(0);
    const bare = evalLeg('iron-ore', reading('iron-ore', {}));
    expect(bare.direction).toBeNull();
    expect(bare.level).toBeNull();
    expect(bare.lean).toBe(0);
  });
});

/* ---------------------------------------------------------------- *
 * The uniform state rule
 * ---------------------------------------------------------------- */

describe('evaluateConnection', () => {
  it('active — every leg leans the same way', () => {
    const readings = [
      reading('brent', { change30d: 22.7 }),
      reading('breakeven-5y5y', { change30d: 0.02, percentile10y: 0.9 }),
      reading('us10y', { change30d: 0.49 }),
    ];
    const r = evaluateConnection(def('oil-expectations-costs'), readings);
    // brent rising, breakeven steady-but-high → +1, us10y rising → all +1
    expect(r.state).toBe('active');
    expect(r.legs.map((l) => l.lean)).toEqual([1, 1, 1]);
  });

  it('disagree — non-zero leans point both ways (the live see-saw: yields high AND gold high)', () => {
    const readings = [
      reading('real-yield-10y', { change30d: 0.48, percentile10y: 0.998 }),
      reading('gold-usd', { percentile10y: 0.925, change30d: undefined }),
    ];
    const r = evaluateConnection(def('real-yields-gold'), readings);
    expect(r.state).toBe('disagree');
    expect(r.legs.map((l) => l.lean)).toEqual([1, 1]);
  });

  it('inverse connections read active when the legs lean against each other (both directions)', () => {
    // yields falling, gold rising — the classic supportive pattern
    const classic = evaluateConnection(
      def('real-yields-gold'),
      [
        reading('real-yield-10y', { change30d: -0.3, percentile10y: 0.1 }),
        reading('gold-usd', { change30d: 4, percentile10y: 0.9 }),
      ],
    );
    expect(classic.state).toBe('active');

    // yields rising, gold falling — the see-saw working the other way
    const reverse = evaluateConnection(
      def('real-yields-gold'),
      [
        reading('real-yield-10y', { change30d: 0.3, percentile10y: 0.95 }),
        reading('gold-usd', { change30d: -4, percentile10y: 0.1 }),
      ],
    );
    expect(reverse.state).toBe('active');

    // dollar strong AND commodities soft — the dollar pressure showing
    const pressure = evaluateConnection(
      def('dollar-gold-oil'),
      [
        reading('dollar-basket', { change30d: 2, percentile10y: 0.9 }),
        reading('gold-usd', { change30d: -4, percentile10y: 0.3 }),
        reading('brent', { change30d: -8, percentile10y: 0.2 }),
      ],
    );
    expect(pressure.state).toBe('active');

    // dollar weak AND commodities firm — the reverse also reads active
    const relief = evaluateConnection(
      def('dollar-gold-oil'),
      [
        reading('dollar-basket', { change30d: -2, percentile10y: 0.1 }),
        reading('gold-usd', { change30d: 4, percentile10y: 0.9 }),
        reading('brent', { change30d: 8, percentile10y: 0.9 }),
      ],
    );
    expect(relief.state).toBe('active');
  });

  it('partly — some legs lean, none opposes, rest neutral (live export chain: only AUD moves)', () => {
    const readings = [
      reading('iron-ore', { change30d: 1.45, percentile10y: 0.415 }),
      reading('terms-of-trade', { percentile10y: 0.43 }),
      reading('audusd', { change30d: -3.65, percentile10y: 0.46 }),
    ];
    const r = evaluateConnection(def('iron-terms-aud'), readings);
    expect(r.state).toBe('partly');
    expect(r.legs.map((l) => l.lean)).toEqual([0, 0, -1]);
  });

  it('inactive — no leg leans at all', () => {
    const readings = [
      reading('brent', { change30d: 1, percentile10y: 0.5 }),
      reading('breakeven-5y5y', { change30d: 0.02, percentile10y: 0.5 }),
      reading('us10y', { change30d: 0.05, percentile10y: 0.5 }),
    ];
    const r = evaluateConnection(def('oil-expectations-costs'), readings);
    expect(r.state).toBe('inactive');
  });

  it('unknown — a stale or absent leg freezes the state but keeps the other legs for display', () => {
    const readings = [
      reading('real-yield-10y', { change30d: -0.3 }),
      reading('gold-usd', { status: 'stale', percentile10y: 0.9 }),
    ];
    const r = evaluateConnection(def('real-yields-gold'), readings);
    expect(r.state).toBe('unknown');
    expect(r.legs[0]!.lean).toBe(-1); // still evaluated for the chip
    expect(r.legs[1]!.direction).toBeNull(); // unreadable leg degrades

    const missing = evaluateConnection(def('rba-loan-debt'), [
      reading('rba-cash-rate', { percentile10y: 1 }),
      // au-home-loan absent entirely
      reading('au-household-debt-arrears', { percentile10y: 0.15 }),
    ]);
    expect(missing.state).toBe('unknown');
  });

  it('unavailable legs also force unknown (no reading at all)', () => {
    const r = evaluateConnection(def('dollar-gold-oil'), [
      reading('dollar-basket', { change30d: 3.4 }),
      reading('gold-usd', { status: 'unavailable', value: null, asOf: null }),
      reading('brent', { change30d: 22.7 }),
    ]);
    expect(r.state).toBe('unknown');
  });

  it('live-like snapshot pins the shipped states for all six connections', () => {
    const live = [
      reading('real-yield-10y', { value: 2.91, change30d: 0.48, percentile10y: 0.998 }),
      reading('gold-usd', { value: 4125.8, status: 'context', percentile10y: 0.925 }),
      reading('brent', { value: 125.44, change30d: 22.69, percentile10y: 0.992, status: 'warning' }),
      reading('dollar-basket', { value: 102.41, change30d: 3.44, percentile10y: 0.748 }),
      reading('breakeven-5y5y', { value: 2.35, change30d: 0.02, percentile10y: 0.901, status: 'warning' }),
      reading('us10y', { value: 5.27, change30d: 0.49, percentile10y: 0.998, status: 'warning' }),
      reading('copper-gold', { value: 3.35, change30d: 0.103, percentile10y: 0.212 }),
      reading('china-pmi', { value: 50.1, change30d: 0.3 }),
      reading('m2-us', { value: 23342.8, change30d: 0.54, percentile10y: 1 }),
      reading('iron-ore', { value: 97.7, change30d: 1.45, percentile10y: 0.415 }),
      reading('terms-of-trade', { value: 94.8, percentile10y: 0.432 }),
      reading('audusd', { value: 0.695, change30d: -3.65, percentile10y: 0.461 }),
      reading('rba-cash-rate', { value: 4.36, status: 'context', change30d: 0.01, percentile10y: 1 }),
      reading('au-home-loan', { value: 6.2, change30d: 0, percentile10y: 0.953, status: 'warning' }),
      reading('au-household-debt-arrears', { value: 178.4, percentile10y: 0.158 }),
    ];
    const states = Object.fromEntries(
      evaluateConnections(live).map((r) => [r.connection, r.state]),
    );
    expect(states).toEqual({
      'real-yields-gold': 'disagree', // yields high+rising vs gold high
      'dollar-gold-oil': 'disagree', // dollar rising vs gold+oil firm
      'oil-expectations-costs': 'active', // oil↑ expectations-high yields↑
      'copper-china-growth': 'active', // copper ratio↑ PMI↑ M2↑
      'iron-terms-aud': 'partly', // only the AUD moves
      'rba-loan-debt': 'disagree', // rates+loans high vs debt ratio low
    });
  });
});

describe('CONNECTIONS table integrity', () => {
  it('every leg id is a real indicator (compile-checked + runtime belt)', () => {
    const known = new Set<string>([
      'real-yield-10y', 'gold-usd', 'brent', 'dollar-basket', 'breakeven-5y5y', 'us10y',
      'copper-gold', 'china-pmi', 'm2-us', 'iron-ore', 'terms-of-trade', 'audusd',
      'rba-cash-rate', 'au-home-loan', 'au-household-debt-arrears', 'silver-usd',
    ]);
    for (const c of CONNECTIONS) {
      expect(c.legs.length).toBeGreaterThanOrEqual(2);
      expect(c.legs.length).toBeLessThanOrEqual(3);
      for (const leg of c.legs) expect(known.has(leg)).toBe(true);
    }
  });

  it('has the six spec connections in order', () => {
    expect(CONNECTIONS.map((c) => c.id)).toEqual([
      'real-yields-gold',
      'dollar-gold-oil',
      'oil-expectations-costs',
      'copper-china-growth',
      'iron-terms-aud',
      'rba-loan-debt',
    ]);
  });
});
