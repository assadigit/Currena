/**
 * australia-backtest.test.ts — the S16 §21 offline suite (spec §21 applied
 * to the Australia page: the 28-card trio coverage, page ≡ engine,
 * plus the freshness audit reused from S11's pure auditUsaFreshness).
 *
 * The S9/S10 usa-backtest.test.ts / S12 europe-backtest.test.ts / S14
 * asia-backtest.test.ts pattern, scoped to Australia's 28 placed ids
 * (no verdict strip, no TIC board): the GREEN path, the public-mode
 * twin, the FAIL-CLOSED proofs (a mutated page card, a dropped page
 * input, a dropped engine input), the stableStringify key-order-immunity,
 * and the freshness audit's own cases on Australia's cadences — au-10y
 * (daily maxAge 40, the daily path), au-cpi (monthly maxAge 95),
 * au-wage-growth (quarterly maxAge 230, the honest-stale path).
 * Australia has TWO per-change ids (rba-cash-rate, rba-fed-gap) — the
 * exempt path, handled like Europe's boe-rate.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { backtestAustraliaPage, auditUsaFreshness, stableStringify, AUSTRALIA_BACKTEST_CARD_IDS, type FreshnessRegistryEntry } from './australia-backtest-core';
import {
  AUSTRALIA_CARD_IDS,
  AUSTRALIA_INFLATION_RATES_IDS,
  AUSTRALIA_HOUSEHOLDS_IDS,
  AUSTRALIA_TRADE_CURRENCY_IDS,
  AUSTRALIA_ACTIVITY_IDS,
  AUSTRALIA_EXTERNAL_IDS,
  AUSTRALIA_WORLD_RISK_IDS,
  AUSTRALIA_MOVED_OUT_IDS,
} from './australia-tiles';

/** One synthetic reading (the usa-backtest.test.ts helper, restated lean). */
function reading(id: IndicatorId, partial: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id: id as IndicatorReading['id'],
    value: 1,
    asOf: '2026-11-07',
    percentile10y: 0.5,
    status: 'normal',
    sourceName: 'fixture',
    updatedAt: '2026-11-08T11:23:21.693Z',
    ...partial,
  } as IndicatorReading;
}

/** The 28 AU ids' synthetic trio inputs (page ≡ engine, identical). */
const AU_VALUES: Record<string, Partial<IndicatorReading>> = {
  'au-cpi': { value: 2.8, status: 'normal' },
  'au-trimmed-mean': { value: 2.7 },
  'rba-expectations': { value: 3.6 },
  'au-10y': { value: 4.2 },
  'au-us-10y-gap': { value: -0.15 },
  'au-petrol-yoy': { value: -3.2 },
  'au-home-loan': { value: 97600 },
  'au-wage-growth': { value: 3.9 },
  'au-rent-yoy': { value: 5.1 },
  'au-household-debt-arrears': { value: 0.85 },
  'au-unemployment': { value: 4.1, status: 'warning' },
  'au-home-values': { value: 0.3 },
  'au-housing-finance': { value: 97600 },
  'rba-cash-rate': { value: 4.35, status: 'stale' },
  'au-deposit-rate': { value: 4.8 },
  'au-saving-ratio': { value: 5.2 },
  'au-job-vacancies': { value: 325000 },
  'terms-of-trade': { value: -2.0 },
  'rba-fed-gap': { value: -0.15 },
  'au-gdp-growth': { value: 1.1 },
  'au-household-spending': { value: 0.5 },
  'au-building-approvals': { value: -1.2 },
  'au-population-growth': { value: 2.3 },
  'au-nom': { value: 0.5 },
  'au-participation': { value: 66.8 },
  'au-underemployment': { value: 6.4 },
  'au-trade-balance': { value: 495 },
  'gpr-australia': { value: 91.24 },
};

/**
 * The synthetic snapshot: every Australia home with distinct trio inputs
 * (mixed states — one warning, one stale). ONE dataset, two feeds
 * (page / engine) — the green path proves the two sides agree without
 * sharing a module.
 */
function syntheticSnapshot(): IndicatorReading[] {
  return AUSTRALIA_CARD_IDS.map((id) => reading(id as IndicatorId, AU_VALUES[id as string] ?? {}));
}

/** The Australia projection's feed: the placement's own reading order
 *  (its OWN copy — the two feeds are independent payloads, exactly like
 *  two HTTP responses; a mutation on one side must never leak into
 *  another). */
function pageFeedOf(snapshot: readonly IndicatorReading[], drop?: string): IndicatorReading[] {
  const byId = new Map(snapshot.map((r) => [r.id as string, { ...r }]));
  return AUSTRALIA_CARD_IDS
    .filter((id) => id !== drop)
    .map((id) => byId.get(id as string))
    .filter((r): r is IndicatorReading => r !== undefined);
}

/** The served snapshot's feed (the whole store) — its own copy. */
function engineFeedOf(snapshot: readonly IndicatorReading[], drop?: string): IndicatorReading[] {
  return snapshot.filter((r) => (r.id as string) !== drop).map((r) => ({ ...r }));
}

describe('backtestAustraliaPage — the offline §21 suite', () => {
  it('the full pipeline: page ≡ engine over the synthetic snapshot, ZERO red', () => {
    const snapshot = syntheticSnapshot();
    const result = backtestAustraliaPage(pageFeedOf(snapshot), engineFeedOf(snapshot));
    // 28 cards (the §21 trio per card).
    expect(result.checks).toHaveLength(28);
    expect(result.red).toBe(0);
    expect(result.green).toBe(result.checks.length);
    // The designed states survive the join: the au-unemployment warning,
    // the rba-cash-rate stale — each on BOTH sides.
    const unemp = result.checks.find((c) => c.label.startsWith('card au-unemployment:'))!;
    expect(unemp.ok).toBe(true);
    expect(unemp.detail).toContain('warning');
    const rba = result.checks.find((c) => c.label.startsWith('card rba-cash-rate:'))!;
    expect(rba.ok).toBe(true);
    expect(rba.detail).toContain('stale');
  });

  it('the public-mode twin: an id absent from BOTH sides stays green with the honest note', () => {
    const snapshot = syntheticSnapshot().filter((r) => (r.id as string) !== 'au-nom');
    const result = backtestAustraliaPage(pageFeedOf(snapshot), engineFeedOf(snapshot));
    const nom = result.checks.find((c) => c.label.startsWith('card au-nom:'))!;
    expect(nom.ok).toBe(true);
    expect(nom.note).toContain('absent on both sides');
  });

  it('FAIL-CLOSED proof 1: an id absent from ONE side reads red (silently dropped, never reported)', () => {
    const snapshot = syntheticSnapshot();
    // The page drops au-building-approvals (a truncated projection); the
    // engine still has it — the diff must go red, never silently green.
    const oneSided = backtestAustraliaPage(pageFeedOf(snapshot, 'au-building-approvals'), engineFeedOf(snapshot));
    const approvals = oneSided.checks.find((c) => c.label.startsWith('card au-building-approvals:'))!;
    expect(approvals.ok).toBe(false);
    expect(approvals.detail).toContain('page absent');
    expect(oneSided.red).toBe(1);
  });

  it('FAIL-CLOSED proof 2: a mutated PAGE card value reads red (never two copies of the same bug agreeing)', () => {
    const snapshot = syntheticSnapshot();
    const result = backtestAustraliaPage(pageFeedOf(snapshot), engineFeedOf(snapshot), {
      mutatePageCard: (id, r) => {
        if (id === 'au-cpi') r.value = 999;
      },
    });
    const cpi = result.checks.find((c) => c.label.startsWith('card au-cpi:'))!;
    expect(cpi.ok).toBe(false);
    expect(cpi.detail).toContain('999');
    // Every other card stays green — the proof is surgical.
    expect(result.red).toBe(1);
  });

  it('FAIL-CLOSED proof 3: a dropped PAGE input reads red on the card it touches', () => {
    const snapshot = syntheticSnapshot();
    const pageDrop = backtestAustraliaPage(pageFeedOf(snapshot, 'au-10y'), engineFeedOf(snapshot));
    const ten = pageDrop.checks.find((c) => c.label.startsWith('card au-10y:'))!;
    expect(ten.ok).toBe(false);
  });

  it('FAIL-CLOSED proof 4: a dropped ENGINE input reads red (the snapshot lost a card the page still shows)', () => {
    const snapshot = syntheticSnapshot();
    const engineDrop = backtestAustraliaPage(pageFeedOf(snapshot), engineFeedOf(snapshot, 'gpr-australia'));
    const gpr = engineDrop.checks.find((c) => c.label.startsWith('card gpr-australia:'))!;
    expect(gpr.ok).toBe(false);
  });

  it('stableStringify is key-order-immune (a re-ordered JSON must never read as a diff)', () => {
    expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }));
    expect(stableStringify({ a: 1, b: 2 })).toBe('{"a":1,"b":2}');
  });
});

/* ------------------------------------------------------------------ *
 * The freshness audit (auditUsaFreshness, reused with AUSTRALIA_CARD_IDS)
 * — the §21 "Data audit" leg on Australia's own cadences. au-10y is
 * daily maxAge 40 (the daily path); au-cpi is monthly maxAge 95;
 * au-wage-growth is quarterly maxAge 230 (the honest-stale path).
 * Australia has TWO per-change ids (rba-cash-rate, rba-fed-gap) — the
 * exempt path, handled like Europe's boe-rate.
 * ------------------------------------------------------------------ */

function freshnessRegistry(entries: Record<string, { cadence: string; maxAgeDays: number | null }>): Map<string, FreshnessRegistryEntry> {
  return new Map(Object.entries(entries));
}

describe('auditUsaFreshness over AUSTRALIA_CARD_IDS — the S16 §21 freshness audit', () => {
  it('GREEN: every seated Australia card within its cadence grace', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    const readings: IndicatorReading[] = [
      reading('au-10y', { asOf: '2026-11-07', status: 'normal' }), // 2d old, daily maxAge 40
      reading('au-cpi', { asOf: '2026-10-01', status: 'normal' }), // 39d old, monthly maxAge 95
    ];
    const registry = freshnessRegistry({
      'au-10y': { cadence: 'daily', maxAgeDays: 40 },
      'au-cpi': { cadence: 'monthly', maxAgeDays: 95 },
    });
    const result = auditUsaFreshness(readings, registry, ['au-10y', 'au-cpi'], now);
    expect(result.checks).toHaveLength(1);
    expect(result.checks[0]!.ok).toBe(true);
    expect(result.withinGrace).toBe(2);
    expect(result.beyond).toHaveLength(0);
  });

  it('GREEN: the honest-stale path — au-wage-growth beyond grace AND carrying the engine\'s stale status', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    // au-wage-growth: quarterly maxAge 230; seated at 2026-03-14 (240d
    // beyond grace at the 2026-11-09 clock) AND honestly status: 'stale'.
    const readings: IndicatorReading[] = [
      reading('au-10y', { asOf: '2026-11-07', status: 'normal' }),
      reading('au-wage-growth', { asOf: '2026-03-14', status: 'stale' }),
    ];
    const registry = freshnessRegistry({
      'au-10y': { cadence: 'daily', maxAgeDays: 40 },
      'au-wage-growth': { cadence: 'quarterly', maxAgeDays: 230 },
    });
    const result = auditUsaFreshness(readings, registry, ['au-10y', 'au-wage-growth'], now);
    expect(result.checks[0]!.ok).toBe(true);
    expect(result.withinGrace).toBe(1);
    expect(result.beyond).toHaveLength(1);
    expect(result.beyond[0]!.id).toBe('au-wage-growth');
    expect(result.beyond[0]!.honest).toBe(true);
    expect(result.beyond[0]!.status).toBe('stale');
    expect(result.checks[0]!.detail).toContain('au-wage-growth 240d > 230d');
    expect(result.checks[0]!.detail).toContain('status stale');
  });

  it('FAIL-CLOSED: an Australia card beyond grace the engine forgot to flag reads RED', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    const readings: IndicatorReading[] = [
      reading('au-10y', { asOf: '2026-11-07', status: 'normal' }),
      reading('au-wage-growth', { asOf: '2026-03-14', status: 'normal' }), // beyond grace, NOT flagged
    ];
    const registry = freshnessRegistry({
      'au-10y': { cadence: 'daily', maxAgeDays: 40 },
      'au-wage-growth': { cadence: 'quarterly', maxAgeDays: 230 },
    });
    const result = auditUsaFreshness(readings, registry, ['au-10y', 'au-wage-growth'], now);
    expect(result.checks[0]!.ok).toBe(false);
    expect(result.beyond).toHaveLength(1);
    expect(result.beyond[0]!.honest).toBe(false);
  });

  it('the full AUSTRALIA_CARD_IDS audit over the live registry shape is the gate the live script runs', () => {
    // The 28 ids' own cadences/maxAge (from definitions.ts — the live
    // registry shape the pd-s16-backtest.ts script reads from
    // data/indicators.json). Australia has TWO per-change ids
    // (rba-cash-rate, rba-fed-gap) — the exempt path, handled like
    // Europe's boe-rate.
    const now = new Date('2026-11-09T12:00:00Z');
    const registry = freshnessRegistry({
      'au-cpi': { cadence: 'monthly', maxAgeDays: 95 },
      'au-trimmed-mean': { cadence: 'monthly', maxAgeDays: 95 },
      'au-10y': { cadence: 'daily', maxAgeDays: 40 },
      'rba-expectations': { cadence: 'daily', maxAgeDays: 40 },
      'au-us-10y-gap': { cadence: 'daily', maxAgeDays: 40 },
      'au-petrol-yoy': { cadence: 'monthly', maxAgeDays: 95 },
      'au-home-loan': { cadence: 'monthly', maxAgeDays: 70 },
      'au-wage-growth': { cadence: 'quarterly', maxAgeDays: 230 },
      'au-rent-yoy': { cadence: 'monthly', maxAgeDays: 95 },
      'au-household-debt-arrears': { cadence: 'quarterly', maxAgeDays: 190 },
      'au-unemployment': { cadence: 'monthly', maxAgeDays: 60 },
      'au-home-values': { cadence: 'quarterly', maxAgeDays: 225 },
      'au-housing-finance': { cadence: 'quarterly', maxAgeDays: 230 },
      'rba-cash-rate': { cadence: 'per-change', maxAgeDays: null },
      'au-deposit-rate': { cadence: 'monthly', maxAgeDays: 70 },
      'au-saving-ratio': { cadence: 'quarterly', maxAgeDays: 250 },
      'au-job-vacancies': { cadence: 'quarterly', maxAgeDays: 240 },
      'terms-of-trade': { cadence: 'quarterly', maxAgeDays: 215 },
      'rba-fed-gap': { cadence: 'per-change', maxAgeDays: null },
      'au-gdp-growth': { cadence: 'quarterly', maxAgeDays: 215 },
      'au-household-spending': { cadence: 'monthly', maxAgeDays: 75 },
      'au-building-approvals': { cadence: 'monthly', maxAgeDays: 75 },
      'au-population-growth': { cadence: 'quarterly', maxAgeDays: 270 },
      'au-nom': { cadence: 'quarterly', maxAgeDays: 270 },
      'au-participation': { cadence: 'monthly', maxAgeDays: 60 },
      'au-underemployment': { cadence: 'monthly', maxAgeDays: 60 },
      'au-trade-balance': { cadence: 'monthly', maxAgeDays: 75 },
      'gpr-australia': { cadence: 'monthly', maxAgeDays: 75 },
    });
    // The card list the live script passes is EXACTLY AUSTRALIA_BACKTEST_CARD_IDS.
    expect(AUSTRALIA_BACKTEST_CARD_IDS).toHaveLength(28);
    for (const id of AUSTRALIA_BACKTEST_CARD_IDS) {
      expect(registry.has(id), `${id} in the registry`).toBe(true);
    }
    // The full audit: every seated AU card within its cadence grace
    // (per-change ids exempt — asOf today, maxAgeDays null).
    const readings: IndicatorReading[] = AUSTRALIA_CARD_IDS.map((id) => {
      const entry = registry.get(id as string)!;
      const asOf = entry.cadence === 'daily' ? '2026-11-07' : '2026-10-01';
      return reading(id as IndicatorId, { asOf, status: 'normal' });
    });
    const result = auditUsaFreshness(readings, registry, AUSTRALIA_BACKTEST_CARD_IDS as unknown as string[], now);
    expect(result.beyond).toHaveLength(0);
    expect(result.checks[0]!.ok).toBe(true);
  });
});

// Keep the section-list imports referenced (the live script's group-
// membership step rides these — the test file mirrors that contract).
void [
  AUSTRALIA_INFLATION_RATES_IDS,
  AUSTRALIA_HOUSEHOLDS_IDS,
  AUSTRALIA_TRADE_CURRENCY_IDS,
  AUSTRALIA_ACTIVITY_IDS,
  AUSTRALIA_EXTERNAL_IDS,
  AUSTRALIA_WORLD_RISK_IDS,
  AUSTRALIA_MOVED_OUT_IDS,
];
