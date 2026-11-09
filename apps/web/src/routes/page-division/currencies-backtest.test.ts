/**
 * currencies-backtest tests (S18, 2026-11-11) — the offline §21 suite.
 *
 * The S17 commodities-backtest.test.ts pattern + the S18 fx legs, on
 * fixtures (tests never hit live sites — AGENTS.md rule 7):
 *
 *   1. the full pipeline: the 14 registry cards' trio diff green over a
 *      projection ≡ snapshot fixture pair;
 *   2. the rules gate: the §9.3 status table + the renderable-domain
 *      invariant + the stored summary ≡ summarizeFxRules recomputed;
 *   3. the board gate: 11 pairs complete (D-42), the bigMove ≡ moveRank ≥
 *      90 derivation, the stale-flag honesty against the asOf age;
 *   4. the fail-closed proofs: a dropped page card, a dropped engine
 *      card, a mutated page card, a mutated rule outcome, a dropped
 *      pair, a corrupted bigMove flag, a flipped stale flag — each turns
 *      its own check RED (never silently green);
 *   5. the public-mode twin: an id absent on BOTH sides stays green;
 *   6. the freshness audit cases over the 14 registry cards (the S11
 *      auditUsaFreshness reuse — within grace / beyond grace honest).
 */

import { describe, expect, it } from 'vitest';
import type { FxSnapshot, IndicatorReading, PageProjection } from '@currena/core';
import { FxSnapshotSchema } from '@currena/core';
import { pageReadingIds } from '@currena/insights/page-division';
import { auditUsaFreshness, backtestCurrenciesBoard, backtestCurrenciesCards, backtestCurrenciesRules, CURRENCIES_BACKTEST_CARD_IDS, CURRENCIES_BACKTEST_PAIR_IDS, type FreshnessRegistryEntry } from './currencies-backtest-core';

/* ------------------------------------------------------------------ *
 * Fixtures — contract-valid payloads (sanity-parsed inside the tests)
 * ------------------------------------------------------------------ */

function reading(id: string, partial: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id: id as IndicatorReading['id'],
    value: 1,
    asOf: '2026-11-09',
    percentile10y: 0.5,
    status: 'normal',
    sourceName: 'fixture',
    updatedAt: '2026-11-09T20:10:18.486Z',
    ...partial,
  } as IndicatorReading;
}

/** The 14 Currencies home cards' displayed values — real-world magnitudes. */
const CARD_OVERRIDES: Record<string, Partial<IndicatorReading>> = {
  'dollar-basket': { value: 101.85, percentile10y: 0.72, asOf: '2026-11-09' },
  'dollar-broad': { value: 120.44, percentile10y: 0.65, asOf: '2026-11-09' },
  'dollar-eme': { value: 2310.55, percentile10y: 0.81, asOf: '2026-11-09' },
  'us-japan-10y-gap': { value: 3.41, percentile10y: 0.9, asOf: '2026-11-09' },
  usdtry: { value: 34.56, percentile10y: 0.95, asOf: '2026-11-09' },
  usdaed: { value: 3.67, percentile10y: 0.5, asOf: '2026-11-09' },
  'usd-reserve-share': { value: 56.7, percentile10y: 0.02, asOf: '2026-09-30' },
  usdjpy: { value: 150.23, percentile10y: 0.44, asOf: '2026-11-09' },
  'eur-usd': { value: 0.9012, percentile10y: 0.06, asOf: '2026-11-09' },
  usdchf: { value: 0.8795, percentile10y: 0.99, asOf: '2026-11-09' },
  usdcny: { value: 7.1025, percentile10y: 0.12, asOf: '2026-11-09' },
  audusd: { value: 0.6585, percentile10y: 0.28, asOf: '2026-11-09' },
  audjpy: { value: 98.94, percentile10y: 0.33, asOf: '2026-11-09' },
  audnzd: { value: 1.2283, percentile10y: 0.98, asOf: '2026-11-09' },
};

/** The Currencies projection: the placement's own reading order (14 home
 *  readings, no mirrors), every card present in public mode. */
function currenciesProjectionFixture(): PageProjection {
  const readings: IndicatorReading[] = pageReadingIds('currencies').map((id) => reading(id, CARD_OVERRIDES[id] ?? {}));
  return {
    page: 'currencies',
    generatedAt: '2026-11-09T20:10:18.486Z',
    displayMode: 'public',
    readings,
    absentIds: [],
    boards: ['fx'],
  };
}

/** The served snapshot's own readings (the ENGINE side): the same 14
 *  readings — the projection derives from this document. */
function snapshotReadingsFixture(): IndicatorReading[] {
  return pageReadingIds('currencies').map((id) => reading(id, CARD_OVERRIDES[id] ?? {}));
}

/** One contract-valid fx pair row (52 weekly closes as day-deltas). */
function fxPairRow(id: string, partial: Partial<FxSnapshot['pairs'][number]> = {}): FxSnapshot['pairs'][number] {
  const weekly: Array<[number, number]> = [[2144, 1]];
  for (let i = 1; i < 52; i++) weekly.push([7, 1 + i * 0.0001]);
  return {
    id: id as FxSnapshot['pairs'][number]['id'],
    asOf: '2026-11-09',
    rate: 1.1234,
    chg: { d1: -0.12, m1: -0.92, m3: -3.27, y1: -3.19 },
    moveRank: 35.16,
    bigMove: false,
    source: 'frankfurter',
    stale: false,
    weekly: weekly as FxSnapshot['pairs'][number]['weekly'],
    ...partial,
  };
}

/** One contract-valid rule state (quiet by default — the calm fixture). */
function fxRuleRow(id: string, partial: Partial<FxSnapshot['rules'][number]> = {}): FxSnapshot['rules'][number] {
  return {
    id: id as FxSnapshot['rules'][number]['id'],
    outcome: 'quiet',
    counted: false,
    numbers: {},
    confirmedBy: [],
    progress: 0,
    legs: [],
    pattern: { status: 'holding', agreeWeeks: 9, ofWeeks: 13, weeks: [] },
    chart: { expect: 'together', series: [] },
    ...partial,
  };
}

/** A contract-valid fx board: 11 pairs (D-42) + 7 rules + the honest
 *  summary + the dollar measure. */
function fxSnapshotFixture(): FxSnapshot {
  const pairs = CURRENCIES_BACKTEST_PAIR_IDS.map((id) => fxPairRow(id));
  const rules: FxSnapshot['rules'] = [
    fxRuleRow('r1_risk_mood'),
    fxRuleRow('r2_carry_trade'),
    fxRuleRow('r3_dollar_strength', { outcome: 'warning', variant: 'm3', counted: true, progress: 100, numbers: { dollar_m1: 0.25, dollar_m3: 4.31 } }),
    fxRuleRow('r4_money_hiding'),
    fxRuleRow('r5_china_link', { outcome: 'watch', progress: 42 }),
    fxRuleRow('r6_europe_worry', { outcome: 'watch', progress: 55 }),
    fxRuleRow('r7_dollar_or_euro'),
  ];
  const snapshot: FxSnapshot = {
    v: 1,
    generatedAt: '2026-11-09T08:50:19.106Z',
    dollarMeasure: {
      asOf: '2026-11-09',
      value: 102.05955,
      chg: { d1: 0.47, m1: 0.25, m3: 2.32, y1: 2.23 },
      weekly: [[2144, 100]],
    },
    pairs,
    rules,
    summary: { signal: 'attention', countedWarnings: 1, headlineRule: 'r3_dollar_strength' },
    plain: { dollarYearExtreme: null, movers: { EUR: -0.92 } },
  };
  return snapshot;
}

const TODAY = '2026-11-10';

describe('fixture sanity — the fixtures satisfy their contracts', () => {
  it('the fx fixture parses through the FxSnapshotSchema (11 pairs, 7 rules)', () => {
    expect(() => FxSnapshotSchema.parse(fxSnapshotFixture())).not.toThrow();
    expect(fxSnapshotFixture().pairs).toHaveLength(11);
    expect(fxSnapshotFixture().rules).toHaveLength(7);
  });
});

describe('gate 1 — the 14 registry cards: the projection ≡ the snapshot', () => {
  it('the full pipeline is green (14/14)', () => {
    const result = backtestCurrenciesCards(currenciesProjectionFixture().readings, snapshotReadingsFixture());
    expect(result.red).toBe(0);
    expect(result.checks).toHaveLength(14);
    expect(result.green).toBe(14);
  });

  it('the public-mode twin: an id absent on BOTH sides stays green', () => {
    const projection = currenciesProjectionFixture();
    const engine = snapshotReadingsFixture();
    const pageSide = projection.readings.filter((r) => (r.id as string) !== 'usdtry');
    const engineSide = engine.filter((r) => (r.id as string) !== 'usdtry');
    expect(pageSide).toHaveLength(13);
    expect(engineSide).toHaveLength(13);
    const result = backtestCurrenciesCards(pageSide, engineSide);
    expect(result.red).toBe(0);
    const usdtryCheck = result.checks.find((c) => c.label.includes('usdtry'))!;
    expect(usdtryCheck.ok).toBe(true);
    expect(usdtryCheck.note).toContain('public-mode twin');
  });

  it('the fail-closed proof: a card dropped from ONE side is RED', () => {
    const pageDropped = backtestCurrenciesCards(currenciesProjectionFixture().readings, snapshotReadingsFixture(), {
      dropPageInput: 'usdtry',
    });
    expect(pageDropped.red).toBe(1);
    const engineDropped = backtestCurrenciesCards(currenciesProjectionFixture().readings, snapshotReadingsFixture(), {
      dropEngineInput: 'usdtry',
    });
    expect(engineDropped.red).toBe(1);
  });

  it('the fail-closed proof: a mutated page card is RED', () => {
    const result = backtestCurrenciesCards(currenciesProjectionFixture().readings, snapshotReadingsFixture(), {
      mutatePageCard: (id, pageReading) => {
        if (id === 'dollar-basket') pageReading.value = 999.99;
      },
    });
    expect(result.red).toBe(1);
    expect(result.checks.find((c) => c.label.includes('dollar-basket'))!.ok).toBe(false);
  });
});

describe('gate 2 — the rules: the KV logic read exactly', () => {
  it('the §9.3 table + the renderable domain + the summary equivalence are green', () => {
    const result = backtestCurrenciesRules(fxSnapshotFixture());
    expect(result.red).toBe(0);
    // 1 count check + 7 × 2 per-rule checks + 1 summary check = 16.
    expect(result.checks).toHaveLength(16);
  });

  it('the fail-closed proof: a rule whose stored outcome drifted from the summary is RED', () => {
    const fx = fxSnapshotFixture();
    const result = backtestCurrenciesRules(fx, {
      mutateRule: (rule) => {
        if (rule.id === 'r2_carry_trade') {
          rule.outcome = 'warning';
          rule.counted = true;
        }
      },
    });
    // The summary no longer matches the recomputed rollup (2 counted
    // warnings now — attention with the wrong headline).
    const summaryCheck = result.checks.find((c) => c.label.includes('summarizeFxRules'))!;
    expect(summaryCheck.ok).toBe(false);
    expect(result.red).toBeGreaterThan(0);
  });

  it('the fail-closed proof: an undowngraded watch on R3 is a display hole, RED', () => {
    const fx = fxSnapshotFixture();
    const result = backtestCurrenciesRules(fx, {
      mutateRule: (rule) => {
        if (rule.id === 'r3_dollar_strength') {
          rule.outcome = 'watch';
          rule.downgraded = undefined;
        }
      },
    });
    const holeCheck = result.checks.find((c) => c.label.includes('r3_dollar_strength') && c.label.includes('renderable'))!;
    expect(holeCheck.ok).toBe(false);
  });
});

describe('gate 3 — the board: 11 pairs complete, the flags honest', () => {
  it('the full board is green (11/11 + the per-row derivations)', () => {
    const result = backtestCurrenciesBoard(fxSnapshotFixture(), TODAY);
    expect(result.red).toBe(0);
    // 1 coverage + 11 × 2 per-row checks = 23.
    expect(result.checks).toHaveLength(23);
  });

  it('the fail-closed proof: a dropped pair (D-42 incomplete) is RED', () => {
    const result = backtestCurrenciesBoard(fxSnapshotFixture(), TODAY, { dropPair: 'audnzd' });
    const coverage = result.checks.find((c) => c.label.includes('11 pairs complete'))!;
    expect(coverage.ok).toBe(false);
    expect(coverage.detail).toContain('audnzd');
  });

  it('the fail-closed proof: a corrupted bigMove flag is RED', () => {
    const result = backtestCurrenciesBoard(fxSnapshotFixture(), TODAY, {
      mutatePair: (pair) => {
        if (pair.id === 'eurusd') pair.bigMove = true; // moveRank 35.16 → false is honest
      },
    });
    const flagCheck = result.checks.find((c) => c.label.includes('eurusd') && c.label.includes('bigMove'))!;
    expect(flagCheck.ok).toBe(false);
  });

  it('the fail-closed proof: a flipped stale flag is RED', () => {
    const result = backtestCurrenciesBoard(fxSnapshotFixture(), '2026-11-20', {
      mutatePair: (pair) => {
        if (pair.id === 'usdjpy') pair.stale = false; // 11 days old → true is honest
      },
    });
    const staleCheck = result.checks.find((c) => c.label.includes('usdjpy') && c.label.includes('stale'))!;
    expect(staleCheck.ok).toBe(false);
  });
});

describe('gate 4 — the freshness audit over the 14 registry cards (the S11 reuse)', () => {
  /** The registry's own maxAge rows for the 14 ids (the live script reads
   *  data/indicators.json — the fixture mirrors its shape: daily ids at 4,
   *  the quarterly reserve share at 200). */
  const registry = new Map<string, FreshnessRegistryEntry>(
    CURRENCIES_BACKTEST_CARD_IDS.map((id) => [
      id,
      id === 'usd-reserve-share' ? { cadence: 'quarterly', maxAgeDays: 200 } : { cadence: 'daily', maxAgeDays: 4 },
    ]),
  );

  it('all 14 within grace → 0 beyond, all green', () => {
    const result = auditUsaFreshness(currenciesProjectionFixture().readings, registry, CURRENCIES_BACKTEST_CARD_IDS, new Date('2026-11-11T12:00:00Z'));
    expect(result.beyond).toHaveLength(0);
    expect(result.checks.every((c) => c.ok)).toBe(true);
  });

  it('usd-reserve-share (2026-09-30, a quarterly id) rides its own maxAge — beyond grace is HONEST, the engine status speaks', () => {
    const result = auditUsaFreshness(currenciesProjectionFixture().readings, registry, CURRENCIES_BACKTEST_CARD_IDS, new Date('2026-11-11T12:00:00Z'));
    expect(result.beyond).toHaveLength(0);
    // Now make it honestly beyond: a stale status with a 30-day grace.
    const tight = new Map(registry);
    tight.set('usd-reserve-share', { cadence: 'quarterly', maxAgeDays: 30 });
    const readings = currenciesProjectionFixture().readings.map((r) =>
      (r.id as string) === 'usd-reserve-share' ? { ...r, status: 'stale' as const } : r,
    );
    const beyond = auditUsaFreshness(readings, tight, CURRENCIES_BACKTEST_CARD_IDS, new Date('2026-11-11T12:00:00Z'));
    expect(beyond.beyond.length).toBe(1);
    expect(beyond.beyond[0]!.honest).toBe(true);
  });
});
