import { describe, expect, it } from 'vitest';

import { CoreError } from './errors';
import {
  SETTLE_EPSILON,
  buildSettlementExpense,
  computeBalances,
  computeSettlements,
  settleDebts,
  type SplitExpense,
} from './settle';

describe('computeBalances', () => {
  it('credits the payer and debits each participant an equal share (legacy algorithm)', () => {
    const balances = computeBalances(
      ['Alice', 'Bob', 'Carol'],
      [{ payer: 'Alice', amount: 90, participants: ['Alice', 'Bob', 'Carol'] }],
    );
    expect(balances).toEqual({ Alice: 60, Bob: -30, Carol: -30 });
  });

  it('includes zero-balance participants with no expenses', () => {
    const balances = computeBalances(['A', 'B'], []);
    expect(balances).toEqual({ A: 0, B: 0 });
  });

  it('accumulates across expenses and supports payer-in-participants', () => {
    const balances = computeBalances(
      ['Alice', 'Bob', 'Carol', 'Dave'],
      [
        { payer: 'Alice', amount: 120, participants: ['Alice', 'Bob', 'Carol', 'Dave'] },
        { payer: 'Bob', amount: 60, participants: ['Bob', 'Carol'] },
      ],
    );
    // Alice: +120 - 30 = 90; Bob: -30 + 60 - 30 = 0; Carol: -30 - 30 = -60; Dave: -30
    expect(balances).toEqual({ Alice: 90, Bob: 0, Carol: -60, Dave: -30 });
  });

  it('throws typed errors on structurally invalid input', () => {
    expect(() => computeBalances(['A', 'A'], [])).toThrowError(CoreError);
    expect(() => computeBalances(['A'], [{ payer: 'B', amount: 1, participants: ['A'] }])).toThrow(CoreError);
    expect(() => computeBalances(['A'], [{ payer: 'A', amount: 1, participants: ['B'] }])).toThrow(CoreError);
    expect(() => computeBalances(['A'], [{ payer: 'A', amount: 1, participants: [] }])).toThrow(CoreError);
    expect(() => computeBalances(['A'], [{ payer: 'A', amount: 0, participants: ['A'] }])).toThrow(CoreError);
    expect(() => computeBalances(['A'], [{ payer: 'A', amount: -5, participants: ['A'] }])).toThrow(CoreError);
    expect(() => computeBalances(['A'], [{ payer: 'A', amount: Number.NaN, participants: ['A'] }])).toThrow(CoreError);
  });
});

describe('settleDebts / computeSettlements (greedy, legacy parity)', () => {
  it('classic scenario: one creditor absorbs both debtors largest-first', () => {
    // Balances: Alice +90, Bob 0, Carol -60, Dave -30
    const transfers = computeSettlements(
      ['Alice', 'Bob', 'Carol', 'Dave'],
      [
        { payer: 'Alice', amount: 120, participants: ['Alice', 'Bob', 'Carol', 'Dave'] },
        { payer: 'Bob', amount: 60, participants: ['Bob', 'Carol'] },
      ],
    );
    expect(transfers).toEqual([
      { from: 'Carol', to: 'Alice', amount: 60 },
      { from: 'Dave', to: 'Alice', amount: 30 },
    ]);
  });

  it('two creditors: chains split correctly largest-debtor → largest-creditor', () => {
    const transfers = settleDebts({ Alice: 90, Bob: 30, Carol: -60, Dave: -60 });
    expect(transfers).toEqual([
      { from: 'Carol', to: 'Alice', amount: 60 },
      { from: 'Dave', to: 'Alice', amount: 30 },
      { from: 'Dave', to: 'Bob', amount: 30 },
    ]);
  });

  it('equal expense splits net to zero; a 50/50 expense leaves one transfer', () => {
    expect(settleDebts({ A: 0, B: 0 })).toEqual([]);
    // A paid 100 for both A and B → B owes A exactly 50.
    const transfers = computeSettlements(
      ['A', 'B'],
      [{ payer: 'A', amount: 100, participants: ['A', 'B'] }],
    );
    expect(transfers).toEqual([{ from: 'B', to: 'A', amount: 50 }]);
    // A round-trip where both paid their share nets to nothing.
    const even = computeSettlements(
      ['A', 'B'],
      [
        { payer: 'A', amount: 100, participants: ['A', 'B'] },
        { payer: 'B', amount: 100, participants: ['A', 'B'] },
      ],
    );
    expect(even).toEqual([]);
  });

  it('residues under the 0.01 epsilon produce no transfers (legacy threshold)', () => {
    expect(SETTLE_EPSILON).toBe(0.01);
    expect(settleDebts({ A: 0.005, B: -0.005 })).toEqual([]);
    expect(settleDebts({ A: 0.02, B: -0.02 })).toEqual([{ from: 'B', to: 'A', amount: 0.02 }]);
  });

  it('handles a non-divisible 3-way split like the legacy app (float residue absorbed)', () => {
    const transfers = computeSettlements(
      ['P', 'Q', 'R'],
      [{ payer: 'P', amount: 100, participants: ['P', 'Q', 'R'] }],
    );
    expect(transfers).toHaveLength(2);
    expect(transfers[0]).toMatchObject({ from: 'Q', to: 'P' });
    expect(transfers[0]!.amount).toBeCloseTo(100 / 3, 10);
    expect(transfers[1]).toMatchObject({ from: 'R', to: 'P' });
    expect(transfers[1]!.amount).toBeCloseTo(100 / 3, 10);
  });

  it("every transfer set zeroes all balances (applying them clears debts within epsilon)", () => {
    const scenario: { balances: Record<string, number> } = {
      balances: { A: 75.5, B: -20.25, C: -55.25, D: 10, E: -10 },
    };
    const transfers = settleDebts(scenario.balances);
    const after = { ...scenario.balances };
    for (const t of transfers) {
      after[t.from] = (after[t.from] ?? 0) + t.amount;
      after[t.to] = (after[t.to] ?? 0) - t.amount;
    }
    for (const balance of Object.values(after)) {
      expect(Math.abs(balance)).toBeLessThan(SETTLE_EPSILON);
    }
  });

  it('stable ordering: equal amounts keep insertion order (legacy parity)', () => {
    const transfers = settleDebts({ first: -50, second: -50, credit1: 50, credit2: 50 });
    expect(transfers).toEqual([
      { from: 'first', to: 'credit1', amount: 50 },
      { from: 'second', to: 'credit2', amount: 50 },
    ]);
  });
});

describe('prototype-key hardening (regression: silent ledger corruption)', () => {
  it("a participant literally named '__proto__' gets a real balance (was silently swallowed)", () => {
    const balances = computeBalances(
      ['__proto__', 'Alice'],
      [{ payer: 'Alice', amount: 100, participants: ['Alice', '__proto__'] }],
    );
    expect(Object.keys(balances).sort()).toEqual(['Alice', '__proto__']);
    expect(balances['Alice']!).toBeCloseTo(50, 10);
    expect(balances['__proto__']!).toBeCloseTo(-50, 10);
    // The result is JSON-serializable and enumerable like any record.
    // (NB: the expected object must be built key-by-key — an object literal
    // `{ '__proto__': -50 }` would set the prototype, not create a key.)
    const revived = JSON.parse(JSON.stringify(balances)) as Record<string, number>;
    expect(Object.keys(revived).sort()).toEqual(['Alice', '__proto__']);
    expect(revived['Alice']!).toBeCloseTo(50, 10);
    expect(revived['__proto__']!).toBeCloseTo(-50, 10);
  });

  it("'__proto__' listed twice is now detected as a duplicate (guard was bypassed before)", () => {
    expect(() => computeBalances(['__proto__', '__proto__'], [])).toThrowError(CoreError);
  });

  it("'constructor' and 'toString' participant names are ordinary members", () => {
    const balances = computeBalances(
      ['constructor', 'toString', 'Bob'],
      [{ payer: 'Bob', amount: 90, participants: ['constructor', 'toString', 'Bob'] }],
    );
    expect(balances['constructor']!).toBeCloseTo(-30, 10);
    expect(balances['toString']!).toBeCloseTo(-30, 10);
    expect(balances['Bob']!).toBeCloseTo(60, 10);
  });

  it('settleDebts handles a JSON-parsed record carrying an own __proto__ key', () => {
    // JSON.parse creates an own '__proto__' data property (no setter) — the
    // pipeline must treat it as a regular member.
    const balances = JSON.parse('{"__proto__": -50, "Alice": 50}') as Record<string, number>;
    const transfers = settleDebts(balances);
    expect(transfers).toEqual([{ from: '__proto__', to: 'Alice', amount: 50 }]);
  });
});

describe('settleDebts conservation invariant (regression: silently dropped money)', () => {
  it('throws on unbalanced input instead of dropping the residue', () => {
    let caught: CoreError | undefined;
    try {
      settleDebts({ A: 100, B: -50 });
    } catch (err) {
      caught = err as CoreError;
    }
    expect(caught).toBeInstanceOf(CoreError);
    expect(caught?.code).toBe('unbalanced_balances');
  });

  it('throws on a one-sided ledger', () => {
    expect(() => settleDebts({ A: 75 })).toThrowError(CoreError);
    expect(() => settleDebts({ A: -75 })).toThrowError(CoreError);
  });

  it('throws on non-finite balance values', () => {
    let caught: CoreError | undefined;
    try {
      settleDebts({ A: Number.NaN, B: 0 });
    } catch (err) {
      caught = err as CoreError;
    }
    expect(caught?.code).toBe('invalid_balance');
    expect(() => settleDebts({ A: Number.POSITIVE_INFINITY, B: -1 })).toThrowError(CoreError);
  });

  it('legitimate float drift at large magnitudes never trips the invariant', () => {
    // 1e15/3 shares leave ~0.1 of accumulated float noise — far below the
    // relative tolerance (1e15 × 1e-12 = 1000) and must settle cleanly.
    const balances = computeBalances(
      ['P', 'Q', 'R'],
      [{ payer: 'P', amount: 1e15, participants: ['P', 'Q', 'R'] }],
    );
    expect(() => settleDebts(balances)).not.toThrow();
    const transfers = settleDebts(balances);
    expect(transfers).toHaveLength(2);
  });

  it('a real imbalance at large magnitudes is still caught', () => {
    // 200 of genuinely unclaimed debt among 1e14-scale balances.
    expect(() => settleDebts({ A: 1e14, B: -5e13, C: -5e13 + 200 })).toThrowError(CoreError);
  });
});

describe('buildSettlementExpense (mark-as-settled parity)', () => {
  it('records the payment so balances actually clear (fixes the legacy bug)', () => {
    const participants = ['Alice', 'Bob', 'Carol'];
    const expenses: SplitExpense[] = [
      { payer: 'Alice', amount: 90, participants: ['Alice', 'Bob', 'Carol'] },
    ];
    const transfers = computeSettlements(participants, expenses);
    expect(transfers).toEqual([{ from: 'Bob', to: 'Alice', amount: 30 }, { from: 'Carol', to: 'Alice', amount: 30 }]);

    // Mark the first suggestion as settled — legacy inserted an expense that
    // (buggily) left balances unchanged; this port zeroes them.
    const settled = buildSettlementExpense(transfers[0]!);
    const afterBalances = computeBalances(participants, [...expenses, settled]);
    expect(afterBalances.Alice).toBeCloseTo(30, 10); // only Carol's debt remains
    expect(afterBalances.Bob).toBeCloseTo(0, 10);

    // Marking BOTH settles everything.
    const allSettled = transfers.map(buildSettlementExpense);
    const finalBalances = computeBalances(participants, [...expenses, ...allSettled]);
    for (const balance of Object.values(finalBalances)) {
      expect(Math.abs(balance)).toBeLessThan(SETTLE_EPSILON);
    }
    expect(computeSettlements(participants, [...expenses, ...allSettled])).toEqual([]);
  });
});
