/**
 * asia-backtest.test.ts — the S14 §21 offline suite (spec §21 applied
 * to the Asia & Pacific page: the 14-card trio coverage (the three S25
 * CPI fills landed — BD-S23a), page ≡ engine,
 * plus the freshness audit reused from S11's pure auditUsaFreshness).
 *
 * The S9/S10 usa-backtest.test.ts / S12 europe-backtest.test.ts pattern,
 * scoped to Asia's 14 placed ids (no verdict strip, no TIC board): the
 * GREEN path, the public-mode twin, the FAIL-CLOSED proofs (a mutated
 * page card, a dropped page input, a dropped engine input), the
 * stableStringify key-order-immunity, and the freshness audit's own
 * cases on Asia's cadences — jgb-10y (daily maxAge 4, the daily path),
 * china-pmi (monthly maxAge 45), boj-rate (monthly maxAge 75, the
 * honest-stale path). Asia has NO per-change id (all 14 are daily or
 * monthly — no exempt path to test, unlike Europe's boe-rate).
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { pageReadingIds } from '@currena/insights/page-division';
import { backtestAsiaPage, auditUsaFreshness, stableStringify, ASIA_BACKTEST_CARD_IDS, type FreshnessRegistryEntry } from './asia-backtest-core';

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
 * The synthetic snapshot: every Asia home with distinct trio inputs
 * (mixed states — one warning, one stale, one unavailable). ONE dataset,
 * two feeds (page / engine) — the green path proves the two sides agree
 * without sharing a module.
 */
function syntheticSnapshot(): IndicatorReading[] {
  const out: IndicatorReading[] = [];
  let i = 0;
  for (const id of pageReadingIds('asia-pacific')) {
    i += 1;
    const status: IndicatorReading['status'] =
      id === 'china-pmi' ? 'warning' : id === 'boj-rate' ? 'stale' : id === 'china-cpi' ? 'unavailable' : 'normal';
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

/** The Asia projection's feed: the placement's own reading order (its
 *  OWN copy — the two feeds are independent payloads, exactly like two
 *  HTTP responses; a mutation on one side must never leak into another). */
function pageFeedOf(snapshot: readonly IndicatorReading[], drop?: string): IndicatorReading[] {
  const byId = new Map(snapshot.map((r) => [r.id as string, { ...r }]));
  return pageReadingIds('asia-pacific')
    .filter((id) => id !== drop)
    .map((id) => byId.get(id))
    .filter((r): r is IndicatorReading => r !== undefined);
}

/** The served snapshot's feed (the whole store) — its own copy. */
function engineFeedOf(snapshot: readonly IndicatorReading[], drop?: string): IndicatorReading[] {
  return snapshot.filter((r) => (r.id as string) !== drop).map((r) => ({ ...r }));
}

describe('backtestAsiaPage — the offline §21 suite', () => {
  it('the full pipeline: page ≡ engine over the synthetic snapshot, ZERO red', () => {
    const snapshot = syntheticSnapshot();
    const result = backtestAsiaPage(pageFeedOf(snapshot), engineFeedOf(snapshot));
    // 14 cards (the §21 trio per card — the three S25 CPI fills landed,
    // BD-S23a).
    expect(result.checks).toHaveLength(14);
    expect(result.red).toBe(0);
    expect(result.green).toBe(result.checks.length);
    // The designed states survive the join: the china-pmi warning, the
    // boj-rate stale, the china-cpi unavailable — each on BOTH sides.
    const pmi = result.checks.find((c) => c.label.startsWith('card china-pmi:'))!;
    expect(pmi.ok).toBe(true);
    expect(pmi.detail).toContain('warning');
    const boj = result.checks.find((c) => c.label.startsWith('card boj-rate:'))!;
    expect(boj.ok).toBe(true);
    expect(boj.detail).toContain('stale');
  });

  it('the public-mode twin: an id absent from BOTH sides stays green with the honest note', () => {
    const snapshot = syntheticSnapshot().filter((r) => (r.id as string) !== 'oecd-cli-cn');
    const result = backtestAsiaPage(pageFeedOf(snapshot), engineFeedOf(snapshot));
    const cli = result.checks.find((c) => c.label.startsWith('card oecd-cli-cn:'))!;
    expect(cli.ok).toBe(true);
    expect(cli.note).toContain('absent on both sides');
  });

  it('FAIL-CLOSED proof 1: an id absent from ONE side reads red (silently dropped, never reported)', () => {
    const snapshot = syntheticSnapshot();
    // The page drops nz-10y (a truncated projection); the engine still
    // has it — the diff must go red, never silently green.
    const oneSided = backtestAsiaPage(pageFeedOf(snapshot, 'nz-10y'), engineFeedOf(snapshot));
    const nz = oneSided.checks.find((c) => c.label.startsWith('card nz-10y:'))!;
    expect(nz.ok).toBe(false);
    expect(nz.detail).toContain('page absent');
  });

  it('FAIL-CLOSED proof 2: a mutated PAGE card value reads red (never two copies of the same bug agreeing)', () => {
    const snapshot = syntheticSnapshot();
    const result = backtestAsiaPage(pageFeedOf(snapshot), engineFeedOf(snapshot), {
      mutatePageCard: (id, r) => {
        if (id === 'china-pmi') r.value = 999;
      },
    });
    const pmi = result.checks.find((c) => c.label.startsWith('card china-pmi:'))!;
    expect(pmi.ok).toBe(false);
    expect(pmi.detail).toContain('999');
    // Every other card stays green — the proof is surgical.
    expect(result.red).toBe(1);
  });

  it('FAIL-CLOSED proof 3: a dropped PAGE input reads red on the card it touches', () => {
    const snapshot = syntheticSnapshot();
    const pageDrop = backtestAsiaPage(pageFeedOf(snapshot, 'jgb-10y'), engineFeedOf(snapshot));
    const jgb = pageDrop.checks.find((c) => c.label.startsWith('card jgb-10y:'))!;
    expect(jgb.ok).toBe(false);
  });

  it('FAIL-CLOSED proof 4: a dropped ENGINE input reads red (the snapshot lost a card the page still shows)', () => {
    const snapshot = syntheticSnapshot();
    const engineDrop = backtestAsiaPage(pageFeedOf(snapshot), engineFeedOf(snapshot, 'gpr-china'));
    const gpr = engineDrop.checks.find((c) => c.label.startsWith('card gpr-china:'))!;
    expect(gpr.ok).toBe(false);
  });

  it('stableStringify is key-order-immune (a re-ordered JSON must never read as a diff)', () => {
    expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }));
    expect(stableStringify({ a: 1, b: 2 })).toBe('{"a":1,"b":2}');
  });
});

/* ------------------------------------------------------------------ *
 * The freshness audit (auditUsaFreshness, reused with ASIA_CARD_IDS)
 * — the §21 "Data audit" leg on Asia's own cadences. jgb-10y is daily
 * maxAge 4 (the daily path); china-pmi is monthly maxAge 45; boj-rate
 * is monthly maxAge 75 (the honest-stale path). Asia has NO per-change
 * id (all 14 are daily or monthly — no exempt path, unlike Europe's
 * boe-rate).
 * ------------------------------------------------------------------ */

function freshnessRegistry(entries: Record<string, { cadence: string; maxAgeDays: number | null }>): Map<string, FreshnessRegistryEntry> {
  return new Map(Object.entries(entries));
}

describe('auditUsaFreshness over ASIA_CARD_IDS — the S14 §21 freshness audit', () => {
  it('GREEN: every seated Asia card within its cadence grace', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    const readings: IndicatorReading[] = [
      reading('jgb-10y', { asOf: '2026-11-07', status: 'normal' }), // 2d old, daily maxAge 4
      reading('china-pmi', { asOf: '2026-10-01', status: 'normal' }), // 39d old, monthly maxAge 45
    ];
    const registry = freshnessRegistry({
      'jgb-10y': { cadence: 'daily', maxAgeDays: 4 },
      'china-pmi': { cadence: 'monthly', maxAgeDays: 45 },
    });
    const result = auditUsaFreshness(readings, registry, ['jgb-10y', 'china-pmi'], now);
    expect(result.checks).toHaveLength(1);
    expect(result.checks[0]!.ok).toBe(true);
    expect(result.withinGrace).toBe(2);
    expect(result.beyond).toHaveLength(0);
  });

  it('GREEN: the honest-stale path — boj-rate beyond grace AND carrying the engine\'s stale status', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    // boj-rate: monthly maxAge 75; seated at 2026-08-01 (100d beyond grace
    // at the 2026-11-09 clock) AND honestly status: 'stale'.
    const readings: IndicatorReading[] = [
      reading('jgb-10y', { asOf: '2026-11-07', status: 'normal' }),
      reading('boj-rate', { asOf: '2026-08-01', status: 'stale' }),
    ];
    const registry = freshnessRegistry({
      'jgb-10y': { cadence: 'daily', maxAgeDays: 4 },
      'boj-rate': { cadence: 'monthly', maxAgeDays: 75 },
    });
    const result = auditUsaFreshness(readings, registry, ['jgb-10y', 'boj-rate'], now);
    expect(result.checks[0]!.ok).toBe(true);
    expect(result.withinGrace).toBe(1);
    expect(result.beyond).toHaveLength(1);
    expect(result.beyond[0]!.id).toBe('boj-rate');
    expect(result.beyond[0]!.honest).toBe(true);
    expect(result.beyond[0]!.status).toBe('stale');
    expect(result.checks[0]!.detail).toContain('boj-rate 100d > 75d');
    expect(result.checks[0]!.detail).toContain('status stale');
  });

  it('FAIL-CLOSED: an Asia card beyond grace the engine forgot to flag reads RED', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    const readings: IndicatorReading[] = [
      reading('jgb-10y', { asOf: '2026-11-07', status: 'normal' }),
      reading('boj-rate', { asOf: '2026-08-01', status: 'normal' }), // beyond grace, NOT flagged
    ];
    const registry = freshnessRegistry({
      'jgb-10y': { cadence: 'daily', maxAgeDays: 4 },
      'boj-rate': { cadence: 'monthly', maxAgeDays: 75 },
    });
    const result = auditUsaFreshness(readings, registry, ['jgb-10y', 'boj-rate'], now);
    expect(result.checks[0]!.ok).toBe(false);
    expect(result.beyond).toHaveLength(1);
    expect(result.beyond[0]!.honest).toBe(false);
  });

  it('the full ASIA_CARD_IDS audit over the live registry shape is the gate the live script runs', () => {
    // The 11 ids' own cadences/maxAge (from definitions.ts — the live
    // registry shape the pd-s14-backtest.ts script reads from
    // data/indicators.json). Asia has NO per-change id (all 11 are
    // daily or monthly — jgb-10y is the ONE daily).
    const registry = freshnessRegistry({
      'china-pmi': { cadence: 'monthly', maxAgeDays: 45 },
      'china-cpi': { cadence: 'monthly', maxAgeDays: 45 },
      'oecd-cli-cn': { cadence: 'monthly', maxAgeDays: 75 },
      'gpr-china': { cadence: 'monthly', maxAgeDays: 75 },
      'gpr-taiwan': { cadence: 'monthly', maxAgeDays: 75 },
      'china-property-investment': { cadence: 'monthly', maxAgeDays: 75 },
      'china-steel-output': { cadence: 'monthly', maxAgeDays: 75 },
      'jgb-10y': { cadence: 'daily', maxAgeDays: 4 },
      'boj-rate': { cadence: 'monthly', maxAgeDays: 75 },
      // S25 (BD-S23a): the three §15 D-36 CPI cards — Japan/Korea at the
      // monthly 75; India's mirror-lag grace 150.
      'japan-cpi': { cadence: 'monthly', maxAgeDays: 75 },
      'korea-cpi': { cadence: 'monthly', maxAgeDays: 75 },
      'india-cpi': { cadence: 'monthly', maxAgeDays: 150 },
      'nz-short-rate': { cadence: 'monthly', maxAgeDays: 75 },
      'nz-10y': { cadence: 'monthly', maxAgeDays: 75 },
    });
    // The card list the live script passes is EXACTLY ASIA_BACKTEST_CARD_IDS.
    expect(ASIA_BACKTEST_CARD_IDS).toHaveLength(14);
    for (const id of ASIA_BACKTEST_CARD_IDS) {
      expect(registry.has(id), `${id} in the registry`).toBe(true);
    }
  });
});
