/**
 * connections.test.ts — the "Together" card logic (I17 → fix spec B-04,
 * 2026-10-14: every relationship an explicit rule, one uniform leg method).
 *
 * Everything is synthetic IndicatorReadings: no fixtures, no network
 * (AGENTS.md rule 7). The "live-like" cases mirror the production snapshot
 * of 2026-10-14 (dollar +3.10 pts · gold −5.19% · brent 30d −12.9% with a
 * 90d leg above +25% · breakeven 2.33 steady) so the shipped states are
 * pinned, not accidental.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import {
  CONNECTIONS,
  evalConnectionLeg,
  evalLeg,
  evaluateConnection,
  evaluateConnections,
  type ConnectionDef,
} from './connections';

const BASE = '2026-10-14T04:20:11Z';

function reading(
  id: IndicatorId,
  fields: Partial<IndicatorReading> = {},
): IndicatorReading {
  return {
    id,
    value: 1,
    asOf: '2026-10-13',
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

const legRule = (id: ConnectionDef['id'], legId: IndicatorId) => {
  const rule = def(id).legs.find((l) => l.id === legId);
  if (!rule) throw new Error(`no leg ${legId} in ${id}`);
  return rule;
};

/* ---------------------------------------------------------------- *
 * evalLeg — the signals vocabulary (direction + level lean)
 * ---------------------------------------------------------------- */

describe('evalLeg (signals vocabulary)', () => {
  it('maps change30d across the per-leg threshold to rising/falling/steady (points)', () => {
    const ry = (ch: number) => reading('real-yield-10y', { change30d: ch, percentile10y: 0.5 });
    expect(evalLeg('real-yield-10y', ry(0.11)).direction).toBe('rising');
    expect(evalLeg('real-yield-10y', ry(-0.11)).direction).toBe('falling');
    expect(evalLeg('real-yield-10y', ry(0.05)).direction).toBe('steady');
    // exactly on the threshold is steady (strict comparison, house convention)
    expect(evalLeg('real-yield-10y', ry(0.1)).direction).toBe('steady');
  });

  it('falls back to the level lean when direction is unmeasurable', () => {
    const leg = evalLeg('gold-usd', reading('gold-usd', { percentile10y: 0.925, change30d: undefined }));
    expect(leg.direction).toBeNull();
    expect(leg.level).toBe('high');
    expect(leg.lean).toBe(1);
  });

  it('a steady direction still leans by level (flat at a decade extreme is not neutral)', () => {
    const leg = evalLeg('real-yield-10y', reading('real-yield-10y', { change30d: 0.01, percentile10y: 1 }));
    expect(leg.direction).toBe('steady');
    expect(leg.lean).toBe(1);
    const low = evalLeg('copper-gold', reading('copper-gold', { change30d: 0, percentile10y: 0.1 }));
    expect(low.lean).toBe(-1);
  });
});

/* ---------------------------------------------------------------- *
 * The uniform v2 leg rule — direction over a window with a minimum move
 * ---------------------------------------------------------------- */

describe('evalConnectionLeg (B-04 uniform method)', () => {
  it('a leg moves when any window change reaches that window minimum', () => {
    const rule = legRule('oil-expectations-costs', 'brent');
    // 30-day calm (+2%) but a 90-day surge (+30%) — the B-04 case: a big
    // annual move hidden behind a calm month.
    const leg = evalConnectionLeg(rule, reading('brent', { change30d: 2, change90d: 30 }));
    expect(leg.moved).toBe(true);
    expect(leg.direction).toBe('rising');
    expect(leg.moveWindow).toBe(90);
    expect(leg.move).toBe(30);
  });

  it('a 30-day burst also qualifies on its own', () => {
    const rule = legRule('dollar-gold-oil', 'brent');
    const leg = evalConnectionLeg(rule, reading('brent', { change30d: -12.9, change90d: undefined }));
    expect(leg.moved).toBe(true);
    expect(leg.direction).toBe('falling');
    expect(leg.moveWindow).toBe(30);
  });

  it('steady when no window qualifies — direction reads from the display change', () => {
    const rule = legRule('real-yields-gold', 'real-yield-10y');
    const leg = evalConnectionLeg(rule, reading('real-yield-10y', { change30d: 0.02 }));
    expect(leg.moved).toBe(false);
    expect(leg.direction).toBe('rising'); // display-only sign of the sub-threshold move
    const flat = evalConnectionLeg(rule, reading('real-yield-10y', { change30d: 0 }));
    expect(flat.direction).toBe('steady');
  });

  it('no change data at all degrades honestly', () => {
    const rule = legRule('real-yields-gold', 'gold-usd');
    const leg = evalConnectionLeg(rule, reading('gold-usd', { change30d: undefined }));
    expect(leg.moved).toBe(false);
    expect(leg.direction).toBeNull();
    expect(leg.move).toBeNull();
  });
});

/* ---------------------------------------------------------------- *
 * The uniform state rule
 * ---------------------------------------------------------------- */

describe('evaluateConnection (v2 rules)', () => {
  it('B-04 + E-19: never Active — and never Partly — when the TRIGGER leg is steady (the audited oil chain)', () => {
    // The audited state (E-19's exact case): oil steady on the month (the
    // trigger — the tendency is "when oil jumps"), expectations steady —
    // only borrowing costs moved. The card must NOT read active (B-04)
    // and, since E-19, not "partly" either: without the trigger the
    // tendency is not in play. "Not showing" (inactive) is the honest read.
    const readings = [
      reading('brent', { change30d: 2, change90d: 3 }),
      reading('breakeven-5y5y', { change30d: 0.02 }),
      reading('us10y', { change30d: 0.49 }),
    ];
    const r = evaluateConnection(def('oil-expectations-costs'), readings);
    expect(r.state).not.toBe('active');
    expect(r.state).toBe('inactive');
  });

  it('E-19: partly survives when the TRIGGER moved and a follower did not (oil up, costs up, expectations steady)', () => {
    const readings = [
      reading('brent', { change30d: 6.2, change90d: 31 }),
      reading('breakeven-5y5y', { change30d: 0.02 }),
      reading('us10y', { change30d: 0.49 }),
    ];
    const r = evaluateConnection(def('oil-expectations-costs'), readings);
    expect(r.state).toBe('partly');
  });

  it('active when every required leg moves in the structure direction (oil chain, all up)', () => {
    const readings = [
      reading('brent', { change30d: 6.2, change90d: 31 }),
      reading('breakeven-5y5y', { change30d: 0.14 }),
      reading('us10y', { change30d: 0.49 }),
    ];
    const r = evaluateConnection(def('oil-expectations-costs'), readings);
    expect(r.state).toBe('active');
  });

  it('B-04: the dollar rising while gold falls is the see-saw WORKING (not a disagreement)', () => {
    // The audited complaint: "Signals disagree while the dollar is rising
    // and gold is falling, which is the usual pattern."
    const r = evaluateConnection(
      def('dollar-gold-oil'),
      [
        reading('dollar-basket', { change30d: 3.1, change90d: 3.2 }),
        reading('gold-usd', { change30d: -5.2, change90d: -8 }),
        reading('brent', { change30d: -12.9, change90d: -2 }),
      ],
    );
    expect(r.state).toBe('active');
  });

  it('see-saw active in both directions (real yields vs gold)', () => {
    const classic = evaluateConnection(
      def('real-yields-gold'),
      [
        reading('real-yield-10y', { change30d: -0.3 }),
        reading('gold-usd', { change30d: 4 }),
      ],
    );
    expect(classic.state).toBe('active');
    const reverse = evaluateConnection(
      def('real-yields-gold'),
      [
        reading('real-yield-10y', { change30d: 0.3 }),
        reading('gold-usd', { change30d: -4 }),
      ],
    );
    expect(reverse.state).toBe('active');
  });

  it('disagree — required legs move in structure-breaking directions', () => {
    // real yields AND gold both rising — the see-saw is broken.
    const r = evaluateConnection(
      def('real-yields-gold'),
      [
        reading('real-yield-10y', { change30d: 0.48 }),
        reading('gold-usd', { change30d: 5.1 }),
      ],
    );
    expect(r.state).toBe('disagree');
  });

  it('inactive — no required leg moves at all', () => {
    const readings = [
      reading('brent', { change30d: 1 }),
      reading('breakeven-5y5y', { change30d: 0.02 }),
      reading('us10y', { change30d: 0.05 }),
    ];
    const r = evaluateConnection(def('oil-expectations-costs'), readings);
    expect(r.state).toBe('inactive');
  });

  it('B-04: the US money-supply leg is gone from copper-china-growth', () => {
    const legs = def('copper-china-growth').legs.map((l) => l.id);
    expect(legs).toEqual(['copper-gold', 'china-pmi']);
    expect(legs).not.toContain('m2-us');
  });

  it('B-04: the US dollar rides iron-terms-aud as a CONTEXT leg (displays, never gates)', () => {
    const rules = def('iron-terms-aud').legs;
    const dollar = rules.find((l) => l.id === 'dollar-basket')!;
    expect(dollar.role).toBe('context');
    // A moving dollar context cannot change the state: everything else
    // steady + a big dollar move must still read inactive (not partly).
    const r = evaluateConnection(
      def('iron-terms-aud'),
      [
        reading('iron-ore', { change30d: 1.45 }),
        reading('terms-of-trade', { change30d: 0.2 }),
        reading('audusd', { change30d: -1.4 }),
        reading('dollar-basket', { change30d: 3.1 }),
      ],
    );
    expect(r.state).toBe('inactive');
    // The context leg still displays its move.
    const dollarLeg = r.legs.find((l) => l.id === 'dollar-basket')!;
    expect(dollarLeg.moved).toBe(true);
    expect(dollarLeg.direction).toBe('rising');
  });

  it('B-04: the RBA pass-through card reads pending until the loan data catches up', () => {
    const decision = '2026-09-30';
    const readings = [
      reading('rba-cash-rate', { value: 4.6, status: 'context', lastChange: { date: decision, points: 0.25 } }),
      // The loan reading's data (Aug 31) predates the Sep 30 decision.
      reading('au-home-loan', { value: 6.2, asOf: '2026-08-31', status: 'warning', change30d: 0.05 }),
      reading('au-household-debt-arrears', { value: 178.4, percentile10y: 0.158 }),
    ];
    const r = evaluateConnection(def('rba-loan-debt'), readings);
    expect(r.state).toBe('pending');
  });

  it('B-04: the pass-through card compares the loan change since the decision', () => {
    const decision = '2026-09-30';
    const base = [
      reading('rba-cash-rate', { value: 4.6, status: 'context', lastChange: { date: decision, points: 0.25 } }),
      reading('au-household-debt-arrears', { value: 178.4, percentile10y: 0.158 }),
    ];
    // The loan data postdates the decision by a month and repriced with it.
    const passed = evaluateConnection(
      def('rba-loan-debt'),
      [
        ...base,
        reading('au-home-loan', {
          value: 6.38,
          asOf: '2026-10-31',
          status: 'warning',
          sinceDecision: { decisionDate: decision, points: 0.18 },
        }),
      ],
    );
    expect(passed.state).toBe('active');
    expect(passed.passThrough).toEqual({ decisionDate: decision, decisionPoints: 0.25, loanPoints: 0.18 });

    // The window passed but the loan did not reprice — inactive.
    const stuck = evaluateConnection(
      def('rba-loan-debt'),
      [
        ...base,
        reading('au-home-loan', {
          value: 6.2,
          asOf: '2026-10-31',
          status: 'warning',
          sinceDecision: { decisionDate: decision, points: 0 },
        }),
      ],
    );
    expect(stuck.state).toBe('inactive');
  });

  it('the debt leg is context and labelled as a debt-to-income level (B-04)', () => {
    const debt = def('rba-loan-debt').legs.find((l) => l.id === 'au-household-debt-arrears')!;
    expect(debt.role).toBe('context');
    expect(debt.caveat).toBe('debt-level');
  });

  it('unknown — a stale, check-pending or absent required leg freezes the state', () => {
    const r = evaluateConnection(def('real-yields-gold'), [
      reading('real-yield-10y', { change30d: -0.3 }),
      reading('gold-usd', { status: 'stale', percentile10y: 0.9 }),
    ]);
    expect(r.state).toBe('unknown');

    const held = evaluateConnection(def('real-yields-gold'), [
      reading('real-yield-10y', { change30d: -0.3 }),
      reading('gold-usd', { status: 'check-pending', percentile10y: 0.9 }),
    ]);
    expect(held.state).toBe('unknown');

    const missing = evaluateConnection(def('rba-loan-debt'), [
      reading('rba-cash-rate', { percentile10y: 1 }),
      // au-home-loan absent entirely
      reading('au-household-debt-arrears', { percentile10y: 0.15 }),
    ]);
    expect(missing.state).toBe('unknown');
  });

  it('a required leg with no measurable change also forces unknown', () => {
    const r = evaluateConnection(def('dollar-gold-oil'), [
      reading('dollar-basket', { change30d: 3.4 }),
      reading('gold-usd', { change30d: undefined, percentile10y: 0.9 }),
      reading('brent', { change30d: 22.7 }),
    ]);
    expect(r.state).toBe('unknown');
  });

  it('live-like snapshot (2026-10-14) pins the shipped states for all six connections', () => {
    const live = [
      reading('real-yield-10y', { value: 2.91, change30d: 0.48, percentile10y: 0.998 }),
      reading('gold-usd', { value: 4125.9, status: 'context', change30d: -5.19, change90d: 9, percentile10y: 0.925 }),
      reading('brent', { value: 106.06, change30d: -12.9, change90d: 30, percentile10y: 0.992, status: 'warning' }),
      reading('dollar-basket', { value: 102.27, change30d: 3.1, change90d: 3.2, percentile10y: 0.748 }),
      reading('breakeven-5y5y', { value: 2.33, change30d: 0.01, percentile10y: 0.901, status: 'normal' }),
      reading('us10y', { value: 5.24, change30d: 0.41, change90d: 0.55, percentile10y: 0.998, status: 'warning' }),
      reading('copper-gold', { value: 3.35, change30d: 0.103, percentile10y: 0.212 }),
      reading('china-pmi', { value: 50.1, change30d: 0.2 }),
      reading('iron-ore', { value: 97.7, change30d: 1.45, percentile10y: 0.415 }),
      reading('terms-of-trade', { value: 94.8, change30d: 0.2, percentile10y: 0.432 }),
      reading('audusd', { value: 0.695, change30d: -3.65, percentile10y: 0.461 }),
      reading('rba-cash-rate', { value: 4.6, status: 'context', change30d: 0.25, lastChange: { date: '2026-09-30', points: 0.25 } }),
      reading('au-home-loan', { value: 6.2, asOf: '2026-08-31', change30d: 0, percentile10y: 0.953, status: 'warning' }),
      reading('au-household-debt-arrears', { value: 178.4, percentile10y: 0.158 }),
    ];
    const states = Object.fromEntries(
      evaluateConnections(live).map((r) => [r.connection, r.state]),
    );
    expect(states).toEqual({
      // Real yields rising vs gold falling — the see-saw working (trigger
      // leg — the real yield — moved).
      'real-yields-gold': 'active',
      // The dollar rising against soft commodities — the usual pressure
      // pattern (B-04: this is the structure WORKING, not a disagreement;
      // the trigger leg — the dollar — moved).
      'dollar-gold-oil': 'active',
      // Oil's recent leg is down (30d −12.9%) while yields rose — the
      // chain's legs point both ways; NOT active (the audited bug class).
      // The oil trigger itself moved, so the state survives (E-19).
      'oil-expectations-costs': 'disagree',
      // The copper/gold ratio firmed but China's PMI (the E-19 trigger —
      // the tendency is about China's growth) is steady: without the
      // trigger the tendency is not in play → "Not showing" (E-19).
      'copper-china-growth': 'inactive',
      // Iron ore (the E-19 trigger) is steady; only the AUD moves (down,
      // past 2%) — without the trigger the export chain is not in play.
      'iron-terms-aud': 'inactive',
      // The Sep 30 hike is newer than the August loan data.
      'rba-loan-debt': 'pending',
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
      for (const leg of c.legs) {
        expect(known.has(leg.id)).toBe(true);
        expect(leg.windows.length).toBeGreaterThanOrEqual(1);
        for (const w of leg.windows) {
          expect(w.minMove).toBeGreaterThan(0);
          expect([7, 30, 90]).toContain(w.days);
        }
      }
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

  it('every relationship carries its explicit rule (B-04: the rules live in the registry)', () => {
    for (const c of CONNECTIONS) {
      for (const leg of c.legs) {
        // Every leg — context legs included — declares windows + minima.
        expect(leg.windows.length).toBeGreaterThan(0);
      }
      // At most one context leg per card; at least two required.
      expect(c.legs.filter((l) => l.role === 'context').length).toBeLessThanOrEqual(1);
      expect(c.legs.filter((l) => l.role === 'required').length).toBeGreaterThanOrEqual(2);
    }
  });
});

/* ------------------------------------------------------------------ */
/* T-35 (v3, 2026-10-20): the neutral match summary the UI-33..38 cards */
/* render — trigger gating, per-leg markers, "N of M readings match".   */
/* ------------------------------------------------------------------ */

describe('T-35: the neutral match summary (R-01…R-03, UI-33…UI-38)', () => {
  it('R-01: with the trigger absent the summary says so — never a match count', () => {
    // oil-expectations-costs: oil is the trigger (steady = not in play).
    const out = evaluateConnection(CONNECTIONS.find((c) => c.id === 'oil-expectations-costs')!, [
      reading('brent', { value: 105, status: 'warning', change7d: -0.4, change30d: -2.85 }),
      reading('breakeven-5y5y', { value: 2.34, status: 'normal', change7d: 0.01, change30d: 0.02 }),
      reading('us10y', { value: 5.21, status: 'warning', change7d: 0.06, change30d: 0.25 }),
    ]);
    expect(out.state).toBe('inactive');
    expect(out.summary?.triggerPresent).toBe(false);
    expect(out.summary?.matchCount).toBeUndefined(); // no count without the trigger
  });

  it('UI-33: every moved scored leg carries a matches / does-not-match marker, and the count is neutral', () => {
    // real-yields-gold (inverse): real yields RISING while gold FALLING is
    // the usual pattern → both legs match.
    const out = evaluateConnection(CONNECTIONS.find((c) => c.id === 'real-yields-gold')!, [
      reading('real-yield-10y', { value: 2.88, status: 'warning', change7d: 0.1, change30d: 0.28 }),
      reading('gold-usd', { value: 4191, status: 'context', change7d: -3.1, change30d: -3.26 }),
    ]);
    expect(out.state).toBe('active');
    expect(out.summary?.triggerPresent).toBe(true);
    expect(out.summary?.matchCount).toBe(2);
    expect(out.summary?.movedCount).toBe(2);
    expect(out.legs.map((l) => l.marker)).toEqual(['matches', 'matches']);
    // the opposite: real yields rising, gold ALSO rising → no match on gold.
    const contra = evaluateConnection(CONNECTIONS.find((c) => c.id === 'real-yields-gold')!, [
      reading('real-yield-10y', { value: 2.88, status: 'warning', change7d: 0.1, change30d: 0.28 }),
      reading('gold-usd', { value: 4191, status: 'context', change7d: 3.2, change30d: 3.5 }),
    ]);
    expect(contra.legs.map((l) => l.marker)).toEqual(['matches', 'does-not-match']);
    expect(contra.summary?.matchCount).toBe(1);
    expect(contra.summary?.movedCount).toBe(2);
  });

  it('R-02: a steady leg reads can\u2019t tell and stays OUT of the count', () => {
    const out = evaluateConnection(CONNECTIONS.find((c) => c.id === 'real-yields-gold')!, [
      reading('real-yield-10y', { value: 2.88, status: 'warning', change7d: 0.1, change30d: 0.28 }),
      reading('gold-usd', { value: 4191, status: 'context', change7d: 0.1, change30d: 0.5 }), // steady (below the 3% min move)
    ]);
    expect(out.legs[1]!.marker).toBe('can-tell');
    expect(out.summary?.matchCount).toBe(1);
    expect(out.summary?.movedCount).toBe(1); // only the trigger is a reading
  });

  it('R-03: the pass-through card keeps its pending state and its own summary shape', () => {
    const decision = '2026-09-30';
    const out = evaluateConnection(CONNECTIONS.find((c) => c.id === 'rba-loan-debt')!, [
      reading('rba-cash-rate', { value: 4.6, status: 'context', lastChange: { date: decision, points: 0.25 } }),
      // The loan reading's data (Aug 31) predates the Sep 30 decision → pending.
      reading('au-home-loan', { value: 6.2, asOf: '2026-08-31', status: 'warning', change30d: 0.05 }),
      reading('au-household-debt-arrears', { value: 178.4, percentile10y: 0.158 }),
    ]);
    expect(out.state).toBe('pending'); // B-04: "Pass-through pending" until the data exists
    // The pass-through NUMBERS only exist once the loan data covers the
    // decision (R-03): pending carries the state, never invented figures.
    expect(out.passThrough).toBeUndefined();
  });

  it('an unreadable required leg reads can\u2019t tell and never counts', () => {
    const out = evaluateConnection(CONNECTIONS.find((c) => c.id === 'real-yields-gold')!, [
      reading('real-yield-10y', { value: 2.88, status: 'warning', change7d: 0.1, change30d: 0.28 }),
      reading('gold-usd', { value: null, asOf: null, status: 'unavailable' }),
    ]);
    expect(out.state).toBe('unknown');
    expect(out.legs[1]!.marker).toBe('can-tell');
    expect(out.summary?.matchCount).toBeUndefined(); // no count over unreadable inputs
  });
});
