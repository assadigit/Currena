/**
 * world-markets-tiles tests (S7, 2026-11-08) — the World Markets page's
 * pure derivations, driven directly (the house pattern: pure functions,
 * plain fixtures, no React rendering). What is pinned here:
 *
 *  - the region-grid structure is EXACTLY the engine's own registry
 *    (MARKET_GROUP_ORDER × MARKETS — Asia 7 · Europe 4 · Americas 5,
 *    16 rows), never a hand-copied list;
 *  - every row's numbers are the STORED board values through the section's
 *    shared helpers (trendOf's ±1% band, statusWordKeyOf's −5/−10/−20
 *    convention, isOld's client-side R6, the A7 trading-days baseline);
 *    an optional lens the row does not carry reads null — never a zero,
 *    never a guess;
 *  - a market the board has no row for renders the honest no-data row;
 *  - the status summary reads the board's OWN §5.3 rollup (signal +
 *    counts + worstGroup, never re-computed) beside the RAW ≥10%/≥20%
 *    counts (the S1-M1.6 #2 rule) — the buffered-vs-RAW divergence is
 *    the designed note, documented in the fixture;
 *  - the verdict word map matches the MarketsVerdict box's own tier
 *    vocabulary (1 Bullish · 2/3 Mixed — the Step-1 E2 rule · 4 Bearish);
 *  - the 9 world-risk card ids are the placement's own homes
 *    (pageHomeIds('world-markets')), byte-for-byte, and the lean display
 *    mirror matches the DISPLAY registry's own decimals + units.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorReading, MarketId, MarketsSnapshot } from '@currena/core';
import { MARKETS, MARKET_GROUP_ORDER } from '@currena/insights/markets/definitions';
import { pageHomeIds } from '@currena/insights/page-division';
import { DISPLAY } from '../../components/insights/config/display';
import {
  WM_VERDICT_WORD,
  WORLD_RISK_DISPLAY,
  WORLD_RISK_IDS,
  worldMarketsRegionGrids,
  worldMarketsRows,
  worldMarketsStatus,
  worldRiskCards,
} from './world-markets-tiles';

/* ------------------------------------------------------------------ *
 * Fixtures — board rows shaped like the stored contract.
 * ------------------------------------------------------------------ */

function boardRow(
  id: MarketId,
  partial: Partial<MarketsSnapshot['markets'][number]> = {},
): MarketsSnapshot['markets'][number] {
  return {
    id,
    asOf: '2026-11-07',
    close: 19624,
    chg1d: 0.5,
    chg1w: 0.4,
    chg1m: 1.2,
    chg3m: 3,
    chg1y: 6,
    high52w: 20000,
    low52w: 17000,
    fromHigh: -1.88,
    rangePos: 87,
    trend: 'flat',
    status: 'normal',
    source: 'eodhd',
    stale: false,
    weekly: [
      [0, 19000],
      [7, 19100],
    ],
    ...partial,
  };
}

/** A full 16-row board: every registry market present, one row per id,
 * with distinguishable distances for the status-band assertions. */
function fullBoard(): MarketsSnapshot['markets'] {
  return MARKETS.map((m, i) =>
    boardRow(m.id, {
      // A deterministic spread: index 0 deep in bear, 1 in correction,
      // 2 pullback, 3 near high, the rest cycling the bands.
      fromHigh: [-25, -12, -7, -2, -1, -0.5, -3, -15][i % 8],
      status: i % 8 === 0 ? 'bear' : i % 8 === 1 || i % 8 === 7 ? 'correction' : 'normal',
      // The trend band reads chg3m: +2 (up) / 0 (flat) / -2 (down) cycle.
      chg3m: [2, 0, -2][i % 3],
    }),
  );
}

function snapshotOf(markets: MarketsSnapshot['markets'], summary: MarketsSnapshot['summary']): MarketsSnapshot {
  return { v: 1, generatedAt: '2026-11-07T23:31:00Z', markets, summary };
}

const TODAY = '2026-11-08';

describe('worldMarketsRegionGrids — the region structure rides the engine registry', () => {
  const snapshot = snapshotOf(fullBoard(), {
    count: 16,
    roseToday: 6,
    nAttention: 4,
    nUnusual: 2,
    signal: 'attention',
    worstGroup: 'asia',
  });
  const grids = worldMarketsRegionGrids(snapshot, TODAY);

  it('three groups in MARKET_GROUP_ORDER (asia · europe · americas)', () => {
    expect(grids.map((g) => g.group)).toEqual([...MARKET_GROUP_ORDER]);
  });

  it('Asia 7 · Europe 4 · Americas 5 — the registry counts, never hand-copied', () => {
    for (const grid of grids) {
      const registryRows = MARKETS.filter((m) => m.group === grid.group);
      expect(grid.rows, grid.group).toHaveLength(registryRows.length);
      expect(grid.rows.map((r) => r.id), grid.group).toEqual(registryRows.map((m) => m.id));
    }
    expect(grids.flatMap((g) => g.rows)).toHaveLength(16);
  });

  it('every row carries the five lenses + the 52-wk range + trend + status through the shared helpers', () => {
    const row = grids[0]!.rows[0]!; // n225 — the fixture's bear row
    const entry = snapshot.markets.find((m) => m.id === 'n225')!;
    expect(row.chg1d).toBe(entry.chg1d);
    expect(row.chg1w).toBe(entry.chg1w);
    expect(row.chg1m).toBe(entry.chg1m);
    expect(row.chg3m).toBe(entry.chg3m);
    expect(row.chg1y).toBe(entry.chg1y);
    expect(row.fromHigh).toBe(entry.fromHigh);
    expect(row.rangePos).toBe(entry.rangePos);
    expect(row.trend).toBe('up'); // chg3m +2 → the ±1% band says Up
    expect(row.statusKey).toBe('statusBear'); // −25 → the L2-01 convention
    expect(row.old).toBe(false);
    expect(row.daysBehind).toBe(0);
  });

  it('the trend band follows chg3m ±1% (0 → flat, −2 → down)', () => {
    const rows = worldMarketsRows(snapshot, TODAY);
    expect(rows.find((r) => r.id === 'asx200')!.trend).toBe('flat'); // index 1 → chg3m 0
    expect(rows.find((r) => r.id === 'kospi')!.trend).toBe('down'); // index 2 → chg3m −2
  });

  it('the status word follows the −5/−10/−20 convention (statusWordKeyOf)', () => {
    const rows = worldMarketsRows(snapshot, TODAY);
    expect(rows.find((r) => r.id === 'n225')!.statusKey).toBe('statusBear'); // −25
    expect(rows.find((r) => r.id === 'asx200')!.statusKey).toBe('statusCorrection'); // −12
    expect(rows.find((r) => r.id === 'kospi')!.statusKey).toBe('statusPullback'); // −7
    expect(rows.find((r) => r.id === 'hsi')!.statusKey).toBe('statusNearHigh'); // −2
  });

  it('an optional lens the row does not carry reads null — never a zero, never a guess', () => {
    const partial = snapshotOf(
      [boardRow('n225', { chg1w: undefined, chg1m: undefined, chg1y: undefined })],
      { count: 1, roseToday: 0, nAttention: 0, nUnusual: 0, signal: 'normal', worstGroup: null },
    );
    const row = worldMarketsRegionGrids(partial, TODAY)[0]!.rows[0]!;
    expect(row.chg1w).toBeNull();
    expect(row.chg1m).toBeNull();
    expect(row.chg1y).toBeNull();
    expect(row.chg1d).not.toBeNull();
    expect(row.chg3m).not.toBeNull();
  });

  it('a market the board has no row for renders the honest no-data row', () => {
    const partial = snapshotOf([boardRow('n225')], {
      count: 1,
      roseToday: 0,
      nAttention: 0,
      nUnusual: 0,
      signal: 'normal',
      worstGroup: null,
    });
    const rows = worldMarketsRegionGrids(partial, TODAY);
    expect(rows).toHaveLength(3); // the structure never collapses
    const missing = rows.flatMap((g) => g.rows).find((r) => r.id === 'sp500')!;
    expect(missing.entry).toBeUndefined();
    expect(missing.chg1d).toBeNull();
    expect(missing.chg3m).toBeNull();
    expect(missing.fromHigh).toBeNull();
    expect(missing.rangePos).toBeNull();
    expect(missing.trend).toBeNull();
    expect(missing.statusKey).toBeNull();
  });

  it('the A7 delayed tag: a row behind the board’s freshest close counts trading days', () => {
    const mixed = snapshotOf(
      [boardRow('n225', { asOf: '2026-11-03' }), boardRow('sp500', { asOf: '2026-11-07' })],
      { count: 2, roseToday: 1, nAttention: 0, nUnusual: 0, signal: 'normal', worstGroup: null },
    );
    const rows = worldMarketsRows(mixed, TODAY);
    expect(rows.find((r) => r.id === 'n225')!.daysBehind).toBe(3); // Tue 3 → Fri 7 (Sat/Sun never count)
    expect(rows.find((r) => r.id === 'sp500')!.daysBehind).toBe(0);
  });

  it('the client-side R6: a stored row older than STALE_DAYS reads old whatever the flag says', () => {
    const aged = snapshotOf([boardRow('n225', { asOf: '2026-10-30', stale: false })], {
      count: 1,
      roseToday: 0,
      nAttention: 0,
      nUnusual: 0,
      signal: 'normal',
      worstGroup: null,
    });
    expect(worldMarketsRows(aged, TODAY)[0]!.old).toBe(true);
  });
});

describe('worldMarketsStatus — the board’s own §5.3 rollup beside the RAW counts', () => {
  it('signal + counts + worstGroup come from the board summary, never re-computed', () => {
    const snapshot = snapshotOf(fullBoard(), {
      count: 16,
      roseToday: 6,
      nAttention: 5,
      nUnusual: 2,
      signal: 'attention',
      worstGroup: 'asia',
    });
    const status = worldMarketsStatus(snapshot);
    expect(status.signal).toBe('attention');
    expect(status.nAttention).toBe(5);
    expect(status.nUnusual).toBe(2);
    expect(status.count).toBe(16);
    expect(status.worstGroup).toBe('asia');
  });

  it('the step is verdict-core’s own (the same pure function the legacy box + Global tile read)', () => {
    const attention = snapshotOf(fullBoard(), {
      count: 16,
      roseToday: 6,
      nAttention: 5,
      nUnusual: 2,
      signal: 'attention',
      worstGroup: 'asia',
    });
    expect(worldMarketsStatus(attention).step).toBe(3); // §5.3 signal sets the band
    const unusual = snapshotOf(fullBoard(), {
      count: 16,
      roseToday: 2,
      nAttention: 6,
      nUnusual: 3,
      signal: 'unusual',
      worstGroup: 'americas',
    });
    expect(worldMarketsStatus(unusual).step).toBe(4);
    const calm = snapshotOf(
      fullBoard().map((m) => ({ ...m, chg3m: 2, fromHigh: -1, status: 'normal' as const })),
      { count: 16, roseToday: 10, nAttention: 0, nUnusual: 0, signal: 'normal', worstGroup: null },
    );
    expect(worldMarketsStatus(calm).step).toBe(1); // most markets up over 3 months
  });

  it('inCorrection/inBear are the RAW ≥10%/≥20% rules (S1-M1.6 #2) — the buffered status counts stay separate', () => {
    const snapshot = snapshotOf(fullBoard(), {
      count: 16,
      roseToday: 6,
      nAttention: 4,
      nUnusual: 2,
      signal: 'attention',
      worstGroup: 'asia',
    });
    const status = worldMarketsStatus(snapshot);
    // The fixture's fromHigh spread: −25 (bear) at i%8===0 → n225, hsi,
    // stoxx50, sp500, tsx; −12 and −15 at i%8===1/7 → asx200, kospi.
    const raw10 = snapshot.markets.filter((m) => m.fromHigh <= -10).length;
    const raw20 = snapshot.markets.filter((m) => m.fromHigh <= -20).length;
    expect(status.inCorrection).toBe(raw10);
    expect(status.inBear).toBe(raw20);
    // The designed divergence note: the RAW count may exceed the buffered
    // status counts (the exit buffer is a staying rule, not a being rule).
    expect(status.inCorrection).toBeGreaterThanOrEqual(status.nAttention + status.nUnusual);
  });

  it('WM_VERDICT_WORD matches the MarketsVerdict box’s own tier vocabulary (E2: 3 → Mixed)', () => {
    expect(WM_VERDICT_WORD[1]).toBe('verdictBullish');
    expect(WM_VERDICT_WORD[2]).toBe('verdictMixed');
    expect(WM_VERDICT_WORD[3]).toBe('verdictMixed');
    expect(WM_VERDICT_WORD[4]).toBe('verdictBearish');
  });
});

describe('the world risk & liquidity cards — the placement’s own 9 homes', () => {
  it('WORLD_RISK_IDS is pageHomeIds("world-markets") byte-for-byte', () => {
    expect(WORLD_RISK_IDS).toEqual(pageHomeIds('world-markets'));
    expect(WORLD_RISK_IDS).toHaveLength(9);
  });

  it('the lean display mirror matches the DISPLAY registry’s own decimals + units', () => {
    for (const id of WORLD_RISK_IDS) {
      const registry = DISPLAY[id as keyof typeof DISPLAY];
      const lean = WORLD_RISK_DISPLAY[id as keyof typeof WORLD_RISK_DISPLAY];
      expect(lean.decimals, id).toBe(registry.decimals);
      expect(lean.unit, id).toBe(registry.unit);
    }
  });

  it('worldRiskCards: the 9 entries in placement order; absent readings stay absent', () => {
    const gpr = (id: string): IndicatorReading =>
      ({ id, value: 150.5, asOf: '2026-10-01', status: 'context', sourceName: 'fixture', updatedAt: '2026-11-08T11:23:21.693Z' }) as IndicatorReading;
    const readings = [gpr('gpr-index'), gpr('gpr-daily')]; // two present, seven absent
    const cards = worldRiskCards(readings);
    expect(cards.map((c) => c.id)).toEqual([
      'gpr-index',
      'gpr-threats',
      'gpr-acts',
      'gpr-daily',
      'gpr-russia',
      'gpr-ukraine',
      'gpr-israel',
      'gpr-saudi',
      'global-liquidity',
    ]);
    expect(cards.find((c) => c.id === 'gpr-index')!.reading).toBeDefined();
    expect(cards.find((c) => c.id === 'gpr-daily')!.reading).toBeDefined();
    expect(cards.find((c) => c.id === 'global-liquidity')!.reading).toBeUndefined();
  });
});
