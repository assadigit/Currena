/**
 * europe-backtest.test.ts — the S12 §21 offline suite (spec §21 applied
 * to the Europe page: the 8-card trio coverage, page ≡ engine, plus the
 * freshness audit reused from S11's pure auditUsaFreshness).
 *
 * The S9/S10 usa-backtest.test.ts pattern, scoped to Europe's 8 placed
 * ids (no verdict strip, no TIC board): the GREEN path, the public-mode
 * twin, the FAIL-CLOSED proofs (a mutated page card, a dropped page
 * input, a dropped engine input), the stableStringify key-order-immunity,
 * and the freshness audit's own cases on Europe's own cadences —
 * boe-rate (per-change, maxAge null, exempt), bund-10y (monthly maxAge
 * 75, the honest-stale path), ecb-dfr (daily maxAge 7).
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { pageReadingIds } from '@currena/insights/page-division';
import { backtestEuropePage, auditUsaFreshness, stableStringify, EUROPE_BACKTEST_CARD_IDS, type FreshnessRegistryEntry } from './europe-backtest-core';

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

/**
 * The synthetic snapshot: every Europe home with distinct trio inputs
 * (mixed states — one warning, one stale, one unavailable). ONE dataset,
 * two feeds (page / engine) — the green path proves the two sides agree
 * without sharing a module.
 */
function syntheticSnapshot(): IndicatorReading[] {
  const out: IndicatorReading[] = [];
  let i = 0;
  for (const id of pageReadingIds('europe')) {
    i += 1;
    const status: IndicatorReading['status'] =
      id === 'ecb-dfr' ? 'warning' : id === 'bund-10y' ? 'stale' : id === 'euro-hicp' ? 'unavailable' : 'normal';
    out.push(
      reading(id, {
        value: status === 'unavailable' ? null : 100 + i,
        asOf: status === 'unavailable' ? null : i % 3 === 0 ? '2026-10-01' : '2026-11-07',
        percentile10y: status === 'unavailable' ? undefined : (i % 10) / 10,
        status,
      }),
    );
  }
  return out;
}

/** The Europe projection's feed: the placement's own reading order (its
 *  OWN copy — the two feeds are independent payloads, exactly like two
 *  HTTP responses; a mutation on one side must never leak into another). */
function pageFeedOf(snapshot: readonly IndicatorReading[], drop?: string): IndicatorReading[] {
  const byId = new Map(snapshot.map((r) => [r.id as string, { ...r }]));
  return pageReadingIds('europe')
    .filter((id) => id !== drop)
    .map((id) => byId.get(id))
    .filter((r): r is IndicatorReading => r !== undefined);
}

/** The served snapshot's feed (the whole store) — its own copy. */
function engineFeedOf(snapshot: readonly IndicatorReading[], drop?: string): IndicatorReading[] {
  return snapshot.filter((r) => (r.id as string) !== drop).map((r) => ({ ...r }));
}

describe('backtestEuropePage — the offline §21 suite', () => {
  it('the full pipeline: page ≡ engine over the synthetic snapshot, ZERO red', () => {
    const snapshot = syntheticSnapshot();
    const result = backtestEuropePage(pageFeedOf(snapshot), engineFeedOf(snapshot));
    // 8 cards (the §21 trio per card).
    expect(result.checks).toHaveLength(8);
    expect(result.red).toBe(0);
    expect(result.green).toBe(result.checks.length);
    // The designed states survive the join: the ecb-dfr warning, the
    // bund-10y stale, the euro-hicp unavailable — each on BOTH sides.
    const dfr = result.checks.find((c) => c.label.startsWith('card ecb-dfr:'))!;
    expect(dfr.ok).toBe(true);
    expect(dfr.detail).toContain('warning');
    const bund = result.checks.find((c) => c.label.startsWith('card bund-10y:'))!;
    expect(bund.ok).toBe(true);
    expect(bund.detail).toContain('stale');
  });

  it('the public-mode twin: an id absent from BOTH sides stays green with the honest note', () => {
    const snapshot = syntheticSnapshot().filter((r) => (r.id as string) !== 'oecd-cli-de');
    const result = backtestEuropePage(pageFeedOf(snapshot), engineFeedOf(snapshot));
    const cli = result.checks.find((c) => c.label.startsWith('card oecd-cli-de:'))!;
    expect(cli.ok).toBe(true);
    expect(cli.note).toContain('absent on both sides');
  });

  it('FAIL-CLOSED proof 1: an id absent from ONE side reads red (silently dropped, never reported)', () => {
    const snapshot = syntheticSnapshot();
    // The page drops gilt-10y (a truncated projection); the engine still
    // has it — the diff must go red, never silently green.
    const oneSided = backtestEuropePage(pageFeedOf(snapshot, 'gilt-10y'), engineFeedOf(snapshot));
    const gilt = oneSided.checks.find((c) => c.label.startsWith('card gilt-10y:'))!;
    expect(gilt.ok).toBe(false);
    expect(gilt.detail).toContain('page absent');
  });

  it('FAIL-CLOSED proof 2: a mutated PAGE card value reads red (never two copies of the same bug agreeing)', () => {
    const snapshot = syntheticSnapshot();
    const result = backtestEuropePage(pageFeedOf(snapshot), engineFeedOf(snapshot), {
      mutatePageCard: (id, r) => {
        if (id === 'ecb-dfr') r.value = 999;
      },
    });
    const dfr = result.checks.find((c) => c.label.startsWith('card ecb-dfr:'))!;
    expect(dfr.ok).toBe(false);
    expect(dfr.detail).toContain('999');
    // Every other card stays green — the proof is surgical.
    expect(result.red).toBe(1);
  });

  it('FAIL-CLOSED proof 3: a dropped PAGE input reads red on the card it touches', () => {
    const snapshot = syntheticSnapshot();
    const pageDrop = backtestEuropePage(pageFeedOf(snapshot, 'boe-rate'), engineFeedOf(snapshot));
    const boe = pageDrop.checks.find((c) => c.label.startsWith('card boe-rate:'))!;
    expect(boe.ok).toBe(false);
  });

  it('FAIL-CLOSED proof 4: a dropped ENGINE input reads red (the snapshot lost a card the page still shows)', () => {
    const snapshot = syntheticSnapshot();
    const engineDrop = backtestEuropePage(pageFeedOf(snapshot), engineFeedOf(snapshot, 'euro-aaa-10y'));
    const aaa = engineDrop.checks.find((c) => c.label.startsWith('card euro-aaa-10y:'))!;
    expect(aaa.ok).toBe(false);
  });

  it('stableStringify is key-order-immune (a re-ordered JSON must never read as a diff)', () => {
    expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }));
    expect(stableStringify({ a: 1, b: 2 })).toBe('{"a":1,"b":2}');
  });
});

/* ------------------------------------------------------------------ *
 * The freshness audit (auditUsaFreshness, reused with EUROPE_CARD_IDS)
 * — the §21 "Data audit" leg on Europe's own cadences. boe-rate is
 * per-change (maxAge null, exempt); bund-10y is monthly maxAge 75 (the
 * honest-stale path); ecb-dfr is daily maxAge 7.
 * ------------------------------------------------------------------ */

function freshnessRegistry(entries: Record<string, { cadence: string; maxAgeDays: number | null }>): Map<string, FreshnessRegistryEntry> {
  return new Map(Object.entries(entries));
}

describe('auditUsaFreshness over EUROPE_CARD_IDS — the S12 §21 freshness audit', () => {
  it('GREEN: every seated Europe card within its cadence grace', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    const readings: IndicatorReading[] = [
      reading('ecb-dfr', { asOf: '2026-11-07', status: 'normal' }), // 2d old, daily maxAge 7
      reading('bund-10y', { asOf: '2026-10-01', status: 'normal' }), // 39d old, monthly maxAge 75
    ];
    const registry = freshnessRegistry({
      'ecb-dfr': { cadence: 'daily', maxAgeDays: 7 },
      'bund-10y': { cadence: 'monthly', maxAgeDays: 75 },
    });
    const result = auditUsaFreshness(readings, registry, ['ecb-dfr', 'bund-10y'], now);
    expect(result.checks).toHaveLength(1);
    expect(result.checks[0]!.ok).toBe(true);
    expect(result.withinGrace).toBe(2);
    expect(result.beyond).toHaveLength(0);
  });

  it('GREEN: the honest-stale path — bund-10y beyond grace AND carrying the engine\'s stale status', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    // bund-10y: monthly maxAge 75; seated at 2026-08-01 (100d beyond grace
    // at the 2026-11-09 clock) AND honestly status: 'stale'.
    const readings: IndicatorReading[] = [
      reading('ecb-dfr', { asOf: '2026-11-07', status: 'normal' }),
      reading('bund-10y', { asOf: '2026-08-01', status: 'stale' }),
    ];
    const registry = freshnessRegistry({
      'ecb-dfr': { cadence: 'daily', maxAgeDays: 7 },
      'bund-10y': { cadence: 'monthly', maxAgeDays: 75 },
    });
    const result = auditUsaFreshness(readings, registry, ['ecb-dfr', 'bund-10y'], now);
    expect(result.checks[0]!.ok).toBe(true);
    expect(result.withinGrace).toBe(1);
    expect(result.beyond).toHaveLength(1);
    expect(result.beyond[0]!.id).toBe('bund-10y');
    expect(result.beyond[0]!.honest).toBe(true);
    expect(result.beyond[0]!.status).toBe('stale');
    expect(result.checks[0]!.detail).toContain('bund-10y 100d > 75d');
    expect(result.checks[0]!.detail).toContain('status stale');
  });

  it('FAIL-CLOSED: a Europe card beyond grace the engine forgot to flag reads RED', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    const readings: IndicatorReading[] = [
      reading('ecb-dfr', { asOf: '2026-11-07', status: 'normal' }),
      reading('bund-10y', { asOf: '2026-08-01', status: 'normal' }), // beyond grace, NOT flagged
    ];
    const registry = freshnessRegistry({
      'ecb-dfr': { cadence: 'daily', maxAgeDays: 7 },
      'bund-10y': { cadence: 'monthly', maxAgeDays: 75 },
    });
    const result = auditUsaFreshness(readings, registry, ['ecb-dfr', 'bund-10y'], now);
    expect(result.checks[0]!.ok).toBe(false);
    expect(result.beyond).toHaveLength(1);
    expect(result.beyond[0]!.honest).toBe(false);
  });

  it('exempt: boe-rate (per-change, maxAge null) never trips the audit however old it is', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    const readings: IndicatorReading[] = [
      reading('boe-rate', { asOf: '2024-01-01', status: 'normal' }), // very old, but per-change
      reading('ecb-dfr', { asOf: '2026-11-07', status: 'normal' }),
    ];
    const registry = freshnessRegistry({
      'boe-rate': { cadence: 'per-change', maxAgeDays: null },
      'ecb-dfr': { cadence: 'daily', maxAgeDays: 7 },
    });
    const result = auditUsaFreshness(readings, registry, ['boe-rate', 'ecb-dfr'], now);
    expect(result.checks[0]!.ok).toBe(true);
    expect(result.beyond).toHaveLength(0);
    expect(result.withinGrace).toBe(1); // only ecb-dfr counted
  });

  it('the full EUROPE_CARD_IDS audit over the live registry shape is the gate the live script runs', () => {
    // The 8 ids' own cadences/maxAge (from definitions.ts — the live
    // registry shape the pd-s12-backtest.ts script reads from
    // data/indicators.json). boe-rate is per-change (maxAge null).
    const registry = freshnessRegistry({
      'ecb-dfr': { cadence: 'daily', maxAgeDays: 7 },
      'euro-hicp': { cadence: 'monthly', maxAgeDays: 60 },
      'euro-aaa-10y': { cadence: 'daily', maxAgeDays: 7 },
      'bund-10y': { cadence: 'monthly', maxAgeDays: 75 },
      'btp-bund-spread': { cadence: 'monthly', maxAgeDays: 75 },
      'oecd-cli-de': { cadence: 'monthly', maxAgeDays: 75 },
      'gilt-10y': { cadence: 'monthly', maxAgeDays: 75 },
      'boe-rate': { cadence: 'per-change', maxAgeDays: null },
    });
    // The card list the live script passes is EXACTLY EUROPE_BACKTEST_CARD_IDS.
    expect(EUROPE_BACKTEST_CARD_IDS).toHaveLength(8);
    for (const id of EUROPE_BACKTEST_CARD_IDS) {
      expect(registry.has(id), `${id} in the registry`).toBe(true);
    }
  });
});
