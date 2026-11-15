/**
 * usa-backtest tests (S9 + S10, 2026-11-09) — the offline §21 suite.
 *
 * Drives the pure comparison core (usa-backtest-core.ts) on a synthetic
 * snapshot: the full pipeline green, the honest public-mode twin, the
 * THREE fail-closed proofs (a mutated page verdict, a mutated card value,
 * a dropped input on each side) and the key-order-immune stableStringify.
 * S10 adds the tier-6 TIC board diff (backtestUsaTicBoard): the full
 * pipeline over a synthetic 21-holder board, and THREE fail-closed proofs
 * of its own (a dropped page holder, a mutated page holder's value, a
 * mutated page total).
 * The LIVE script (apps/web/scripts/pd-s10-backtest.ts) drives the same
 * core over the wire — never in here (tests never hit live sites,
 * AGENTS.md rule 7).
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorReading, TicHolder, TicSnapshot } from '@currena/core';
import { THEMATIC_GAUGE_MEMBER_IDS, pageReadingIds, pageMirrorIds } from '@currena/insights/page-division';
import { TIC_CUSTODY_HUBS } from '@currena/insights/tic';
import { auditUsaFreshness, backtestUsaPage, backtestUsaTicBoard, stableStringify, TIC_EXPECTED_HOLDERS, type FreshnessRegistryEntry } from './usa-backtest-core';
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
    // 38 voter inputs + 5 gauges + 72 cards (S9's 26 + S10's 46).
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

/** A synthetic TIC board: 21 holders (the spec's own count), 14 months of
 *  history, transactions + valuation series, two custody hubs — real-world
 *  magnitudes so the derived numbers are the numbers a visitor sees. */
function syntheticTic(): TicSnapshot {
  const NAMES: readonly [string, string, number][] = [
    ['japan', 'Japan', 1120],
    ['united-kingdom', 'United Kingdom', 800],
    ['china-mainland', 'China, Mainland', 850],
    ['belgium', 'Belgium', 380],
    ['canada', 'Canada', 300],
    ['cayman-islands', 'Cayman Islands', 350],
    ['luxembourg', 'Luxembourg', 340],
    ['france', 'France', 280],
    ['ireland', 'Ireland', 300],
    ['taiwan', 'Taiwan', 250],
    ['switzerland', 'Switzerland', 240],
    ['singapore', 'Singapore', 230],
    ['hong-kong', 'Hong Kong', 220],
    ['india', 'India', 210],
    ['norway', 'Norway', 150],
    ['brazil', 'Brazil', 140],
    ['saudi-arabia', 'Saudi Arabia', 130],
    ['korea-south', 'Korea, South', 120],
    ['united-arab-emirates', 'United Arab Emirates', 110],
    ['bermuda', 'Bermuda', 90],
    ['australia', 'Australia', 60],
  ];
  // 14 ascending months, 2025-07 .. 2026-08 (clean year/month rolls).
  const monthKeys: string[] = [];
  for (let i = 0; i < 14; i += 1) {
    const y = 2025 + Math.floor((7 - 1 + i) / 12);
    const m = ((7 - 1 + i) % 12) + 1;
    monthKeys.push(`${y}-${String(m).padStart(2, '0')}`);
  }
  expect(monthKeys[0]).toBe('2025-07');
  expect(monthKeys[13]).toBe('2026-08');
  const holders: TicHolder[] = NAMES.map(([id, name, base], i) => {
    // china-mainland declines 1/month — the board carries BOTH directions
    // of change so the derived rows are non-trivial.
    const step = id === 'china-mainland' ? -1 : 2;
    const months = monthKeys.map((ym, k) => ({ ym, v: Math.round((base + k * step - (i % 3)) * 100) / 100 }));
    return {
      id,
      name,
      holdingsBn: months[months.length - 1]!.v,
      months,
      netSalesBn: monthKeys.slice(-12).map((ym, k) => ({ ym, v: Math.round((k % 2 === 0 ? 5 : -3) * 100) / 100 })),
      valuationChangeBn: monthKeys.slice(-12).map((ym, k) => ({ ym, v: Math.round((k % 3) * 1.5 * 100) / 100 })),
      isCustodyHub: TIC_CUSTODY_HUBS.has(name),
    };
  });
  const totalBn = 9331.7;
  const officialBn = 3755.6;
  return {
    v: 1,
    dataMonth: '2026-08',
    releasedAt: '2026-10-16T20:07:27.000Z',
    fetchedAt: '2026-11-08T04:35:00.000Z',
    totalBn,
    officialBn,
    privateBn: Math.round((totalBn - officialBn) * 100) / 100,
    holders,
    sourceUrls: ['https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table5.txt'],
  };
}

describe('backtestUsaTicBoard — the S10 offline §21 suite (the tier-6 board)', () => {
  it('the full pipeline: the page payload ≡ the engine payload, every derived row ≡ the restated arithmetic, ZERO red', () => {
    const board = syntheticTic();
    const result = backtestUsaTicBoard(board, board);
    // 2 structure + 1 payload + 2 aggregates + 21 holders x (derived + custody) + 1 staleness.
    expect(result.checks).toHaveLength(2 + 1 + 2 + TIC_EXPECTED_HOLDERS * 2 + 1);
    expect(result.red).toBe(0);
    expect(result.green).toBe(result.checks.length);
    // The board is the spec's own: 21 holders, the custody hubs marked.
    const hubRows = result.checks.filter((c) => c.label.includes('custody-hub marker'));
    expect(hubRows.every((c) => c.ok)).toBe(true);
    expect(board.holders.filter((h) => h.isCustodyHub).length).toBe(7);
  });

  it('the restated arithmetic agrees with the package helper over a NON-trivial board (both directions of change)', () => {
    // japan rises 2/month for 14 months; china falls 1/month — the
    // derived rows must reflect both directions through BOTH paths.
    const board = syntheticTic();
    const japan = board.holders.find((h) => h.id === 'japan')!;
    const china = board.holders.find((h) => h.id === 'china-mainland')!;
    expect(japan.months[0]!.v).toBeLessThan(japan.months.at(-1)!.v);
    expect(china.months[0]!.v).toBeGreaterThan(china.months.at(-1)!.v);
    const result = backtestUsaTicBoard(board, board);
    const jp = result.checks.find((c) => c.label.startsWith('tic holder japan: the drawing'))!;
    const cn = result.checks.find((c) => c.label.startsWith('tic holder china-mainland: the drawing'))!;
    expect(jp.ok).toBe(true);
    expect(cn.ok).toBe(true);
    // The 12-month transactions sum over the last 12 months: 6 x (+5) + 6 x (-3) = +12.
    expect(jp.detail).toContain('"net12mBn":12');
  });

  it('FAIL-CLOSED proof 1: a holder dropped from the PAGE payload reads red (a truncated board never passes silently)', () => {
    const board = syntheticTic();
    const result = backtestUsaTicBoard(board, board, { dropPageHolder: 'australia' });
    expect(result.checks.find((c) => c.label.startsWith('tic structure (page)'))!.ok).toBe(false);
    expect(result.checks.find((c) => c.label.startsWith('tic payload'))!.ok).toBe(false);
    expect(result.checks.find((c) => c.label.startsWith('tic holder australia: present on the page side'))!.ok).toBe(false);
    expect(result.red).toBeGreaterThan(0);
  });

  it('FAIL-CLOSED proof 2: a mutated PAGE holder value reads red (the derivation AND the payload)', () => {
    const board = syntheticTic();
    const result = backtestUsaTicBoard(board, board, {
      mutatePageHolder: (h) => {
        if (h.id === 'japan') {
          h.holdingsBn = 9999;
          h.months[h.months.length - 1]!.v = 9999;
        }
      },
    });
    expect(result.checks.find((c) => c.label.startsWith('tic payload'))!.ok).toBe(false);
    expect(result.checks.find((c) => c.label.startsWith('tic holder japan: the drawing'))!.ok).toBe(false);
    expect(result.red).toBeGreaterThan(0);
  });

  it('FAIL-CLOSED proof 3: a mutated PAGE total reads red (the split bar and every share)', () => {
    const board = syntheticTic();
    const result = backtestUsaTicBoard(board, board, {
      mutatePageTotal: (s) => {
        s.totalBn = 12345.6;
      },
    });
    expect(result.checks.find((c) => c.label.startsWith('tic payload'))!.ok).toBe(false);
    // The split bar's own basis: official + private no longer equals the
    // mutated total on the page side only.
    const pageAgg = result.checks.find((c) => c.label.startsWith('tic aggregates (page)'))!;
    expect(pageAgg.ok).toBe(false);
    // And every holder's sharePct diverges (the restated arithmetic uses
    // the engine's true total).
    expect(result.checks.find((c) => c.label.startsWith('tic holder japan: the drawing'))!.ok).toBe(false);
    expect(result.red).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ *
 * The S11 freshness audit (auditUsaFreshness) — the §21 "Data audit"
 * leg formalized as an offline suite. The audit's own logic is pinned
 * here on synthetic boards so a regression in the live gate's logic
 * (pd-s10-backtest.ts calls the SAME function) is caught before the
 * live run. Three cases: every card within grace (green), the honest
 * stale path (one card beyond grace AND carrying the engine's stale
 * status — the govt-interest-revenue case, green), and the FAIL-CLOSED
 * proof (a card beyond grace the engine forgot to flag — RED, never a
 * silent stale-by-age card).
 * ------------------------------------------------------------------ */

/** A minimal registry the synthetic boards read — three ids with the
 *  cadence/maxAgeDays shape data/indicators.json carries. */
function freshnessRegistry(entries: Record<string, { cadence: string; maxAgeDays: number | null }>): Map<string, FreshnessRegistryEntry> {
  return new Map(Object.entries(entries));
}

describe('auditUsaFreshness — the S11 §21 freshness audit (formalized)', () => {
  it('GREEN: every seated card within its cadence grace', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    const readings: IndicatorReading[] = [
      reading('fed-target', { asOf: '2026-11-07', status: 'normal' }), // 2d old, daily maxAge 5
      reading('us-cpi-yoy', { asOf: '2026-10-01', status: 'normal' }), // 39d old, monthly maxAge 75
    ];
    const registry = freshnessRegistry({
      'fed-target': { cadence: 'daily', maxAgeDays: 5 },
      'us-cpi-yoy': { cadence: 'monthly', maxAgeDays: 75 },
    });
    const result = auditUsaFreshness(readings, registry, ['fed-target', 'us-cpi-yoy'], now);
    expect(result.checks).toHaveLength(1);
    expect(result.checks[0]!.ok).toBe(true);
    expect(result.withinGrace).toBe(2);
    expect(result.beyond).toHaveLength(0);
    expect(result.checks[0]!.detail).toBe('2 cards within grace');
  });

  it('GREEN: the honest-stale path — a card beyond grace AND carrying the engine\'s stale status (the govt-interest-revenue case)', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    // govt-interest-revenue: quarterly, maxAge 215d; the synthetic board
    // seats it at 2026-04-01 (222d beyond grace at the 2026-11-09 clock —
    // the SAME age the live board carries) AND honestly status: 'stale'.
    const readings: IndicatorReading[] = [
      reading('fed-target', { asOf: '2026-11-07', status: 'normal' }),
      reading('govt-interest-revenue', { asOf: '2026-04-01', status: 'stale' }),
    ];
    const registry = freshnessRegistry({
      'fed-target': { cadence: 'daily', maxAgeDays: 5 },
      'govt-interest-revenue': { cadence: 'quarterly', maxAgeDays: 215 },
    });
    const result = auditUsaFreshness(readings, registry, ['fed-target', 'govt-interest-revenue'], now);
    expect(result.checks[0]!.ok).toBe(true);
    expect(result.withinGrace).toBe(1);
    expect(result.beyond).toHaveLength(1);
    expect(result.beyond[0]!.id).toBe('govt-interest-revenue');
    expect(result.beyond[0]!.honest).toBe(true);
    expect(result.beyond[0]!.status).toBe('stale');
    // The detail speaks the finding — the live gate's own wording.
    expect(result.checks[0]!.detail).toContain('govt-interest-revenue 222d > 215d');
    expect(result.checks[0]!.detail).toContain('status stale');
  });

  it('FAIL-CLOSED: a card beyond grace the engine forgot to flag reads RED (never a silent stale-by-age card)', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    // The same card, but the engine did NOT flag it stale (status 'normal')
    // — the audit catches the engine's own miss, exactly what §21 forbids.
    const readings: IndicatorReading[] = [
      reading('fed-target', { asOf: '2026-11-07', status: 'normal' }),
      reading('govt-interest-revenue', { asOf: '2026-04-01', status: 'normal' }),
    ];
    const registry = freshnessRegistry({
      'fed-target': { cadence: 'daily', maxAgeDays: 5 },
      'govt-interest-revenue': { cadence: 'quarterly', maxAgeDays: 215 },
    });
    const result = auditUsaFreshness(readings, registry, ['fed-target', 'govt-interest-revenue'], now);
    expect(result.checks[0]!.ok).toBe(false);
    expect(result.beyond).toHaveLength(1);
    expect(result.beyond[0]!.honest).toBe(false);
    expect(result.beyond[0]!.status).toBe('normal');
  });

  it('exempt cards never trip the audit: maxAgeDays null (per-change) and asOf null (unavailable)', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    const readings: IndicatorReading[] = [
      reading('boe-rate', { asOf: '2024-01-01', status: 'normal' }), // very old, but per-change (maxAge null)
      reading('usdjpy', { asOf: null, status: 'unavailable', value: null }), // unavailable, asOf null
      reading('fed-target', { asOf: '2026-11-07', status: 'normal' }),
    ];
    const registry = freshnessRegistry({
      'boe-rate': { cadence: 'per-change', maxAgeDays: null },
      usdjpy: { cadence: 'daily', maxAgeDays: 4 },
      'fed-target': { cadence: 'daily', maxAgeDays: 5 },
    });
    const result = auditUsaFreshness(readings, registry, ['boe-rate', 'usdjpy', 'fed-target'], now);
    expect(result.checks[0]!.ok).toBe(true);
    expect(result.beyond).toHaveLength(0);
    expect(result.withinGrace).toBe(1); // only fed-target counted
  });

  it('absent cards (the honest absent twin) are skipped — never a finding', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    // rstar-us is absent from the projection (public-mode licence gap);
    // the audit never trips on a card that isn't seated.
    const readings: IndicatorReading[] = [reading('fed-target', { asOf: '2026-11-07', status: 'normal' })];
    const registry = freshnessRegistry({
      'fed-target': { cadence: 'daily', maxAgeDays: 5 },
      'rstar-us': { cadence: 'per-change', maxAgeDays: null },
    });
    const result = auditUsaFreshness(readings, registry, ['fed-target', 'rstar-us'], now);
    expect(result.checks[0]!.ok).toBe(true);
    expect(result.withinGrace).toBe(1);
    expect(result.beyond).toHaveLength(0);
  });
});
