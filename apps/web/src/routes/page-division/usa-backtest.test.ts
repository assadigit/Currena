/**
 * usa-backtest tests (S9, 2026-11-09) — the offline §21 suite.
 *
 * Drives the pure comparison core (usa-backtest-core.ts) on a synthetic
 * snapshot: the full pipeline green, the honest public-mode twin, the
 * THREE fail-closed proofs (a mutated page verdict, a mutated card value,
 * a dropped input on each side) and the key-order-immune stableStringify.
 * The LIVE script (apps/web/scripts/pd-s9-backtest.ts) drives the same
 * core over the wire — never in here (tests never hit live sites,
 * AGENTS.md rule 7).
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorReading } from '@currena/core';
import { THEMATIC_GAUGE_MEMBER_IDS, pageReadingIds, pageMirrorIds } from '@currena/insights/page-division';
import { backtestUsaPage, stableStringify } from './usa-backtest-core';
import { USA_CARD_IDS } from './usa-tiles';

function reading(id: string, partial: Partial<IndicatorReading> = {}): IndicatorReading {
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
 * The synthetic snapshot: every gauge voter (mixed states — one warning in
 * borrowing-costs, one warning in prices-heat, a stale vix, an unavailable
 * usdjpy), every S9 card with distinct trio inputs, and the remaining USA
 * homes. ONE dataset, three feeds (page / global / engine) — the green
 * path proves the three sides agree without sharing a module.
 */
function syntheticSnapshot(): IndicatorReading[] {
  const out: IndicatorReading[] = [];
  for (const id of THEMATIC_GAUGE_MEMBER_IDS) {
    const status: IndicatorReading['status'] =
      id === 'yield-curve-10y2y' || id === 'us-cpi-yoy'
        ? 'warning'
        : id === 'vix'
          ? 'stale'
          : id === 'usdjpy'
            ? 'unavailable'
            : 'normal';
    out.push(
      reading(id, {
        status,
        value: null as unknown as number,
        asOf: null as unknown as string,
        percentile10y: undefined,
        ...(status === 'unavailable' ? {} : { value: 1, asOf: '2026-11-07', percentile10y: 0.5 }),
      }),
    );
  }
  let i = 0;
  for (const id of pageReadingIds('usa')) {
    if (THEMATIC_GAUGE_MEMBER_IDS.includes(id)) continue;
    i += 1;
    out.push(
      reading(id, {
        value: 100 + i,
        percentile10y: (i % 10) / 10,
        asOf: i % 3 === 0 ? '2026-10-01' : '2026-11-07',
        status: i % 7 === 0 ? 'stale' : i % 5 === 0 ? 'context' : 'normal',
      }),
    );
  }
  return out;
}

/** The USA projection's feed: the placement's own reading order (its OWN
 *  copy — the three feeds are independent payloads, exactly like three
 *  HTTP responses; a mutation on one side must never leak into another). */
function pageFeedOf(snapshot: readonly IndicatorReading[], drop?: string): IndicatorReading[] {
  const byId = new Map(snapshot.map((r) => [r.id as string, { ...r }]));
  return pageReadingIds('usa')
    .filter((id) => id !== drop)
    .map((id) => byId.get(id))
    .filter((r): r is IndicatorReading => r !== undefined);
}

/** The Global projection's feed (the mirror set the S2 contract serves) —
 *  its own copy. */
function globalFeedOf(snapshot: readonly IndicatorReading[], drop?: string): IndicatorReading[] {
  const byId = new Map(snapshot.map((r) => [r.id as string, { ...r }]));
  return pageMirrorIds('global')
    .filter((id) => id !== drop)
    .map((id) => byId.get(id))
    .filter((r): r is IndicatorReading => r !== undefined);
}

/** The served snapshot's feed (the whole store) — its own copy. */
function engineFeedOf(snapshot: readonly IndicatorReading[], drop?: string): IndicatorReading[] {
  return snapshot.filter((r) => (r.id as string) !== drop).map((r) => ({ ...r }));
}

describe('backtestUsaPage — the offline §21 suite', () => {
  it('the full pipeline: page ≡ Global ≡ engine over the synthetic snapshot, ZERO red', () => {
    const snapshot = syntheticSnapshot();
    const result = backtestUsaPage(pageFeedOf(snapshot), globalFeedOf(snapshot), engineFeedOf(snapshot));
    // 38 voter inputs + 5 gauges + 26 cards.
    expect(result.checks).toHaveLength(THEMATIC_GAUGE_MEMBER_IDS.length + 5 + USA_CARD_IDS.length);
    expect(result.red).toBe(0);
    expect(result.green).toBe(result.checks.length);
    // Spot checks the sides carry the designed states: borrowing-costs
    // cautious on ALL THREE sides (1/10 warnings), market-stress stable
    // with the stale vix diluting on every side.
    const bc = result.checks.find((c) => c.label.startsWith('gauge borrowing-costs:'))!;
    expect(bc.ok).toBe(true);
    expect(bc.detail).toContain('"word":"cautious"');
    const ms = result.checks.find((c) => c.label.startsWith('gauge market-stress:'))!;
    expect(ms.detail).toContain('"word":"relaxed"');
    expect(ms.detail).toContain('"stale":1');
  });

  it('the public-mode twin: an id absent from BOTH sides stays green with the honest note', () => {
    const snapshot = syntheticSnapshot().filter((r) => (r.id as string) !== 'rstar-us');
    const result = backtestUsaPage(pageFeedOf(snapshot), globalFeedOf(snapshot), engineFeedOf(snapshot));
    expect(result.red).toBe(0);
    const rstar = result.checks.find((c) => c.label.startsWith('card rstar-us:'))!;
    expect(rstar.ok).toBe(true);
    expect(rstar.note).toBe('absent on both sides — the honest public-mode twin');
    // Absent on ONE side only is red (silently dropped, never reported):
    const oneSided = backtestUsaPage(
      pageFeedOf(snapshot),
      globalFeedOf(snapshot),
      engineFeedOf(snapshot).filter((r) => (r.id as string) !== 'us-2y'),
    );
    expect(oneSided.red).toBeGreaterThan(0);
    expect(oneSided.checks.find((c) => c.label.startsWith('card us-2y:'))!.ok).toBe(false);
  });

  it('FAIL-CLOSED proof 1: a mutated PAGE verdict reads red (never two copies of the same bug agreeing)', () => {
    const snapshot = syntheticSnapshot();
    const result = backtestUsaPage(pageFeedOf(snapshot), globalFeedOf(snapshot), engineFeedOf(snapshot), {
      mutatePageVerdict: (tile) => {
        if (tile.gauge === 'borrowing-costs') {
          tile.reading.warningCount = 0;
          tile.reading.step = 1;
          tile.word = 'relaxed';
        }
      },
    });
    expect(result.red).toBeGreaterThan(0);
    expect(result.checks.find((c) => c.label.startsWith('gauge borrowing-costs:'))!.ok).toBe(false);
  });

  it('FAIL-CLOSED proof 2: a mutated PAGE card value reads red', () => {
    const snapshot = syntheticSnapshot();
    const result = backtestUsaPage(pageFeedOf(snapshot), globalFeedOf(snapshot), engineFeedOf(snapshot), {
      mutatePageCard: (id, r) => {
        if (id === 'fed-target') {
          r.value = 9.99;
          r.rangeLow = undefined;
          r.rangeHigh = undefined;
        }
      },
    });
    expect(result.checks.find((c) => c.label.startsWith('card fed-target:'))!.ok).toBe(false);
    expect(result.red).toBeGreaterThan(0);
  });

  it('FAIL-CLOSED proof 3: a dropped input reads red on every side it touches', () => {
    const snapshot = syntheticSnapshot();
    // (a) dropped from the PAGE side: a missing mirror changes the verdict
    // (borrowing-costs loses ecb-dfr) AND the completeness check fails.
    const pageDrop = backtestUsaPage(pageFeedOf(snapshot), globalFeedOf(snapshot), engineFeedOf(snapshot), {
      dropPageInput: 'ecb-dfr',
    });
    expect(pageDrop.checks.find((c) => c.label.startsWith('input ecb-dfr'))!.ok).toBe(false);
    expect(pageDrop.checks.find((c) => c.label.startsWith('gauge borrowing-costs:'))!.ok).toBe(false);
    // (b) dropped from the GLOBAL side: the landing page's own derivation
    // diverges from the USA page's — exactly what D-30 forbids.
    const globalDrop = backtestUsaPage(pageFeedOf(snapshot), globalFeedOf(snapshot), engineFeedOf(snapshot), {
      dropGlobalInput: 'us-cpi-yoy',
    });
    expect(globalDrop.checks.find((c) => c.label.startsWith('input us-cpi-yoy'))!.ok).toBe(false);
    expect(globalDrop.checks.find((c) => c.label.startsWith('gauge prices-heat:'))!.ok).toBe(false);
    // (c) dropped from the ENGINE side (the snapshot): the engine's own
    // arithmetic no longer matches either page.
    const engineDrop = backtestUsaPage(pageFeedOf(snapshot), globalFeedOf(snapshot), engineFeedOf(snapshot), {
      dropEngineInput: 'vix',
    });
    expect(engineDrop.checks.find((c) => c.label.startsWith('input vix'))!.ok).toBe(false);
    expect(engineDrop.checks.find((c) => c.label.startsWith('gauge market-stress:'))!.ok).toBe(false);
  });

  it('stableStringify is key-order-immune (a re-ordered JSON must never read as a diff)', () => {
    expect(stableStringify({ a: 1, b: [2, { c: 3 }] })).toBe(stableStringify({ b: [2, { c: 3 }], a: 1 }));
    expect(stableStringify(undefined)).toBe('null');
    expect(stableStringify({ a: undefined, b: 2 })).toBe(stableStringify({ b: 2 }));
  });
});
