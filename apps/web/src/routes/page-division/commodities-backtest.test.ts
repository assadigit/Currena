/**
 * commodities-backtest tests (S17, 2026-11-11) — the offline §21 suite.
 *
 * What is pinned here (the S11 usa-backtest / S12 europe-backtest / S14
 * asia-backtest / S16 australia-backtest pattern, scoped to the
 * Commodities page's 24 placed cards):
 *
 *   §21 diff (7 tests):
 *   - the full pipeline: page ≡ engine over the synthetic snapshot,
 *     ZERO red (24 checks);
 *   - the public-mode twin: an id absent from BOTH sides stays green;
 *   - the 4 fail-closed proofs (absent on one side, mutated page value,
 *     dropped page input, dropped engine input);
 *   - stableStringify is key-order-immune.
 *
 *   freshness audit (4 tests, reusing S11's pure auditUsaFreshness with
 *   COMMODITIES_CARD_IDS):
 *   - GREEN: every seated card within cadence grace;
 *   - GREEN: the honest-stale path — a card beyond grace AND carrying
 *     the engine's stale status;
 *   - FAIL-CLOSED: a card beyond grace the engine forgot to flag reads
 *     RED;
 *   - the full COMMODITIES_CARD_IDS audit over the live registry shape
 *     is the gate the live script runs.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { pageReadingIds } from '@currena/insights/page-division';
import {
  backtestCommoditiesPage,
  auditUsaFreshness,
  stableStringify,
  COMMODITIES_BACKTEST_CARD_IDS,
  type FreshnessRegistryEntry,
} from './commodities-backtest-core';
import {
  COMMODITIES_CARD_IDS,
  COMMODITIES_ENERGY_IDS,
  COMMODITIES_METALS_IDS,
  COMMODITIES_AGRICULTURE_IDS,
  COMMODITIES_DIGITAL_IDS,
  COMMODITIES_TRADE_ROUTES_IDS,
} from './commodities-tiles';

/** A representative value per id (real-world magnitudes). */
const CO_VALUES: Record<string, number> = {
  brent: 73.45,
  wti: 69.87,
  natgas: 2.84,
  'gas-europe': 13.5,
  'lng-japan': 12.3,
  'coal-aus': 113.5,
  'eia-crude-stocks': 416700,
  'us-spr': 387000,
  'us-crude-production': 13990,
  'silver-usd': 31.27,
  platinum: 995.4,
  'copper-usd': 9540,
  'iron-ore': 109.8,
  'food-index': 121.3,
  wheat: 5.67,
  maize: 4.32,
  'btc-usd': 67250,
  'crypto-fng': 72,
  'chokepoint-suez': 65.3,
  'chokepoint-panama': 27.1,
  'chokepoint-bab-el-mandeb': 12.4,
  'chokepoint-malacca': 230.5,
  'chokepoint-taiwan': 88.7,
  gscpi: -0.42,
};

/** One fixture reading for an id. */
function reading(id: string, partial: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id: id as IndicatorId,
    value: CO_VALUES[id] ?? 1,
    asOf: '2026-11-07',
    percentile10y: 0.5,
    status: 'normal',
    sourceName: 'fixture',
    updatedAt: '2026-11-08T11:23:21.693Z',
    ...partial,
  } as IndicatorReading;
}

/** The synthetic snapshot — the 24 commodity readings in placement order. */
function syntheticSnapshot(): IndicatorReading[] {
  return COMMODITIES_CARD_IDS.map((id) => reading(id as string));
}

/** The PAGE feed — the projection's readings (placement order), own copies. */
function pageFeedOf(snapshot: IndicatorReading[], drop?: string): IndicatorReading[] {
  return snapshot
    .filter((r) => (r.id as string) !== drop)
    .map((r) => ({ ...r }));
}

/** The ENGINE feed — the whole store's readings, own copies. */
function engineFeedOf(snapshot: IndicatorReading[], drop?: string): IndicatorReading[] {
  return snapshot
    .filter((r) => (r.id as string) !== drop)
    .map((r) => ({ ...r }));
}

describe('backtestCommoditiesPage — the offline §21 suite', () => {
  it('the full pipeline: page ≡ engine over the synthetic snapshot, ZERO red', () => {
    const snapshot = syntheticSnapshot();
    const result = backtestCommoditiesPage(pageFeedOf(snapshot), engineFeedOf(snapshot));
    expect(result.checks).toHaveLength(24);
    expect(result.red).toBe(0);
    expect(result.green).toBe(24);
    // A normal reading's detail carries the value + the status.
    const brent = result.checks.find((c) => c.label.includes('brent'))!;
    expect(brent.detail).toContain('73.45');
    expect(brent.detail).toContain('normal');
  });

  it('the public-mode twin: an id absent from BOTH sides stays green with the honest note', () => {
    // Drop gscpi from BOTH feeds (a licence-hidden id reported in
    // absentIds on both sides).
    const snapshot = syntheticSnapshot().filter((r) => (r.id as string) !== 'gscpi');
    const result = backtestCommoditiesPage(pageFeedOf(snapshot), engineFeedOf(snapshot));
    const gscpi = result.checks.find((c) => c.label.includes('gscpi'))!;
    expect(gscpi.ok).toBe(true);
    expect(gscpi.note).toContain('absent on both sides');
  });

  it('FAIL-CLOSED proof 1: an id absent from ONE side reads red (silently dropped, never reported)', () => {
    const snapshot = syntheticSnapshot();
    // The page drops wheat (the projection lost a card the engine still
    // has) — a licence-hidden id must be REPORTED in absentIds, never
    // silently dropped.
    const result = backtestCommoditiesPage(pageFeedOf(snapshot, 'wheat'), engineFeedOf(snapshot));
    const wheat = result.checks.find((c) => c.label.includes('wheat'))!;
    expect(wheat.ok).toBe(false);
    expect(wheat.detail).toContain('page absent');
    expect(result.red).toBe(1);
  });

  it('FAIL-CLOSED proof 2: a mutated PAGE card value reads red (never two copies of the same bug agreeing)', () => {
    const snapshot = syntheticSnapshot();
    const result = backtestCommoditiesPage(pageFeedOf(snapshot), engineFeedOf(snapshot), {
      mutatePageCard: (id, r) => {
        if ((id as string) === 'brent') r.value = 999;
      },
    });
    const brent = result.checks.find((c) => c.label.includes('brent'))!;
    expect(brent.ok).toBe(false);
    expect(brent.detail).toContain('999');
    expect(result.red).toBe(1);
  });

  it('FAIL-CLOSED proof 3: a dropped PAGE input reads red on the card it touches', () => {
    const snapshot = syntheticSnapshot();
    const result = backtestCommoditiesPage(pageFeedOf(snapshot, 'natgas'), engineFeedOf(snapshot));
    const natgas = result.checks.find((c) => c.label.includes('natgas'))!;
    expect(natgas.ok).toBe(false);
  });

  it('FAIL-CLOSED proof 4: a dropped ENGINE input reads red (the snapshot lost a card the page still shows)', () => {
    const snapshot = syntheticSnapshot();
    const result = backtestCommoditiesPage(pageFeedOf(snapshot), engineFeedOf(snapshot, 'chokepoint-suez'));
    const suez = result.checks.find((c) => c.label.includes('chokepoint-suez'))!;
    expect(suez.ok).toBe(false);
  });

  it('stableStringify is key-order-immune (a re-ordered JSON must never read as a diff)', () => {
    expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }));
    expect(stableStringify({ a: 1, b: 2 })).toBe('{"a":1,"b":2}');
  });
});

describe('auditUsaFreshness over COMMODITIES_CARD_IDS — the S17 §21 freshness audit', () => {
  it('GREEN: every seated Commodities card within its cadence grace', () => {
    // brent is daily, maxAge 12 — asOf 2 days ago is within grace.
    const readings = [reading('brent', { asOf: '2026-11-05' })];
    const registry = new Map<string, FreshnessRegistryEntry>([['brent', { cadence: 'daily', maxAgeDays: 12 }]]);
    const result = auditUsaFreshness(readings, registry, COMMODITIES_BACKTEST_CARD_IDS, new Date('2026-11-07'));
    // The audit checks every seated card (brent is the only one with a
    // reading); the 23 absent ids carry no freshness check (no reading
    // to age).
    expect(result.checks).toHaveLength(1);
    expect(result.checks[0]!.ok).toBe(true);
    expect(result.withinGrace).toBe(1);
    expect(result.beyond).toHaveLength(0);
  });

  it('GREEN: the honest-stale path — iron-ore beyond grace AND carrying the engine\'s stale status', () => {
    // iron-ore is monthly, maxAge 60 — asOf 70 days ago is beyond grace,
    // AND the engine's status is 'stale' (the honest flag).
    const readings = [reading('iron-ore', { asOf: '2026-08-29', status: 'stale' })];
    const registry = new Map<string, FreshnessRegistryEntry>([['iron-ore', { cadence: 'monthly', maxAgeDays: 60 }]]);
    const result = auditUsaFreshness(readings, registry, COMMODITIES_BACKTEST_CARD_IDS, new Date('2026-11-07'));
    expect(result.checks[0]!.ok).toBe(true);
    expect(result.withinGrace).toBe(0);
    expect(result.beyond).toHaveLength(1);
    expect(result.beyond[0]!.honest).toBe(true);
    expect(result.beyond[0]!.id).toBe('iron-ore');
    expect(result.checks[0]!.detail).toContain('iron-ore');
    expect(result.checks[0]!.detail).toContain('70');
    expect(result.checks[0]!.detail).toContain('60');
    expect(result.checks[0]!.detail).toContain('stale');
  });

  it('FAIL-CLOSED: a Commodities card beyond grace the engine forgot to flag reads RED', () => {
    // Same iron-ore beyond grace, but status 'normal' — the engine
    // forgot to flag it stale. The audit must catch the lie.
    const readings = [reading('iron-ore', { asOf: '2026-08-29', status: 'normal' })];
    const registry = new Map<string, FreshnessRegistryEntry>([['iron-ore', { cadence: 'monthly', maxAgeDays: 60 }]]);
    const result = auditUsaFreshness(readings, registry, COMMODITIES_BACKTEST_CARD_IDS, new Date('2026-11-07'));
    expect(result.checks[0]!.ok).toBe(false);
    expect(result.beyond[0]!.honest).toBe(false);
  });

  it('the full COMMODITIES_CARD_IDS audit over the live registry shape is the gate the live script runs', () => {
    // The live registry shape: every commodity id with its real cadence +
    // maxAgeDays. The 24 ids span daily (brent/wti/natgas/silver-usd/
    // platinum/copper-usd/btc-usd/crypto-fng/chokepoint-*), weekly
    // (eia-crude-stocks/us-spr/us-crude-production) and monthly
    // (gas-europe/lng-japan/coal-aus/iron-ore/food-index/wheat/maize/
    // gscpi).
    expect(COMMODITIES_BACKTEST_CARD_IDS).toHaveLength(24);
    const registry = new Map<string, FreshnessRegistryEntry>(
      COMMODITIES_CARD_IDS.map((id) => {
        const daily = ['brent', 'wti', 'natgas', 'silver-usd', 'platinum', 'copper-usd', 'btc-usd', 'crypto-fng',
          'chokepoint-suez', 'chokepoint-panama', 'chokepoint-bab-el-mandeb', 'chokepoint-malacca', 'chokepoint-taiwan'];
        const weekly = ['eia-crude-stocks', 'us-spr', 'us-crude-production'];
        const maxAge = daily.includes(id as string) ? (id === 'crypto-fng' ? 4 : (id as string).startsWith('chokepoint') ? 14 : 2) : weekly.includes(id as string) ? 12 : 60;
        return [id as string, { cadence: daily.includes(id as string) ? 'daily' : weekly.includes(id as string) ? 'weekly' : 'monthly', maxAgeDays: maxAge }];
      }),
    );
    // Every id is in the registry.
    for (const id of COMMODITIES_BACKTEST_CARD_IDS) {
      expect(registry.has(id as string), `${id} is in the registry`).toBe(true);
    }
    // A synthetic all-normal, all-fresh readings set passes.
    const readings = COMMODITIES_CARD_IDS.map((id) => reading(id as string, { asOf: '2026-11-07' }));
    const result = auditUsaFreshness(readings, registry, COMMODITIES_BACKTEST_CARD_IDS, new Date('2026-11-07'));
    expect(result.beyond).toHaveLength(0);
  });
});

// The group-membership contract — the live script's own basis, restated
// here so a placement drift surfaces as a test failure (never a silent
// pass forward).
void [
  COMMODITIES_ENERGY_IDS,
  COMMODITIES_METALS_IDS,
  COMMODITIES_AGRICULTURE_IDS,
  COMMODITIES_DIGITAL_IDS,
  COMMODITIES_TRADE_ROUTES_IDS,
  pageReadingIds('commodities'),
];
