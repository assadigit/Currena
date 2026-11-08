/**
 * region-zoom-backtest.test.ts (S8, 2026-11-08) — the offline §21 suite
 * for the regional zoom maps (the S7 world-markets-backtest shape):
 *
 *   - the full pipeline over a synthetic board: all four zooms, every
 *     seated index's six lenses + colour weights + directions identical
 *     between the PAGE side (deriveWorldMapRows — the exact function the
 *     drawing renders) and the ENGINE side (spelled out over the board's
 *     own rows, all-16 scale);
 *   - the honest old-data rule: an old row's lenses null out on BOTH
 *     sides (grey card, honest words — never a value);
 *   - THREE fail-closed proofs: (1) the naive-subset scale — a zoom that
 *     normalised over its own indices only — reads RED; (2) a mutated
 *     engine value reads RED; (3) a dropped row on one side reads RED;
 *   - the key-order-immune stableStringify (a re-ordered JSON never
 *     reads as a diff — and a real diff never hides behind ordering).
 *
 * Fixture-backed only — no live site, no provider (AGENTS.md rule 7).
 */

import { describe, expect, it } from 'vitest';
import type { MarketsSnapshot } from '@currena/core';
import { MarketsSnapshotSchema } from '@currena/core';
import { MARKETS, summarizeMarkets } from '@currena/insights/markets';
import { backtestRegionZoomsVsEngine, engineZoomRows, stableStringify } from './region-zoom-backtest-core';
import { REGION_ZOOMS } from '../../components/insights/world-markets/world-map-config';

/** A full 16-row synthetic board. The biggest 1D/1W moves ride rows
 * OUTSIDE the Europe zoom (ibov −6.6% · n225 +5.5%) so a subset-scale
 * drift in Europe would actually move weights — the fail-closed proof's
 * precondition. */
function boardFixture(): MarketsSnapshot {
  const markets: MarketsSnapshot['markets'] = MARKETS.map((m, i) => ({
    id: m.id,
    asOf: '2026-11-07',
    close: 10000 + i * 100,
    chg1d: m.id === 'ibov' ? -6.6 : m.id === 'n225' ? 5.5 : ((i % 5) - 2) * 0.4,
    chg1w: m.id === 'ibov' ? -8.2 : ((i % 4) - 1) * 0.9,
    chg1m: (i % 7) - 3,
    chg3m: (i % 9) - 4,
    chg1y: (i % 11) - 5,
    chg5y: 20 + (i % 13),
    high52w: 12000,
    low52w: 8000,
    fromHigh: -10 - (i % 12),
    rangePos: 40 + (i % 20),
    trend: 'flat' as const,
    status: 'normal' as const,
    source: 'eodhd' as const,
    stale: false,
    weekly: [
      [0, 9900],
      [7, 10000],
    ],
  }));
  return { v: 1, generatedAt: '2026-11-07T23:31:00Z', markets, summary: summarizeMarkets(markets) };
}

const OPTS = { todayIso: '2026-11-08', nowMs: Date.parse('2026-11-08T12:00:00Z') };

describe('the S8 §21 zoom-consistency backtest (offline)', () => {
  it('fixture sanity: the board satisfies its contract', () => {
    expect(() => MarketsSnapshotSchema.parse(boardFixture())).not.toThrow();
  });

  it('the full pipeline: all four zooms green — every seated index ≡ the engine side (all-16 scale)', () => {
    const result = backtestRegionZoomsVsEngine(boardFixture(), OPTS);
    for (const c of result.checks) {
      expect(c.ok, `${c.label} — ${c.detail}`).toBe(true);
    }
    expect(result.red).toBe(0);
    expect(result.green).toBe(9); // 1 board seat + 4 zoom diffs + 4 seat-presence
  });

  it('the honest old-data rule: an old row nulls out on BOTH sides (never a value)', () => {
    const board = boardFixture();
    const europe = REGION_ZOOMS.europe.indices;
    // Age one zoomed row beyond STALE_DAYS.
    const dax = board.markets.find((m) => m.id === 'dax')!;
    dax.asOf = '2026-10-01';
    const result = backtestRegionZoomsVsEngine(board, OPTS);
    expect(result.red).toBe(0);
    // The ENGINE side spells the same nulls.
    const engine = engineZoomRows(board, 'europe', { todayIso: OPTS.todayIso });
    const daxEngine = engine.find((r) => r.id === 'dax')!;
    expect(stableStringify(daxEngine.pcts)).toBe(
      stableStringify({ '1D': null, '1W': null, '1M': null, '3M': null, '1Y': null, '5Y': null }),
    );
    expect(europe.includes('dax')).toBe(true);
  });

  it('FAIL-CLOSED (1): a zoom that normalised over its OWN subset reads RED — the all-16 scale is the rule', () => {
    const board = boardFixture();
    const result = backtestRegionZoomsVsEngine(board, OPTS, { engineScaleBasis: 'subset' });
    // The biggest 1D mover (ibov −6.6%) sits OUTSIDE every zoom but the
    // US-window-excluded americas… ibov is in NO zoom — so every zoom's
    // subset scale is SMALLER than the all-16 scale, and at least one
    // seated index's weight must differ (the europe zoom's dax +0.4-ish
    // reads a different weight under the smaller normaliser).
    expect(result.red).toBeGreaterThan(0);
    const diff = result.checks.find((c) => c.label.startsWith('zoom europe') && !c.ok);
    expect(diff).toBeDefined();
    expect(diff!.detail).toContain('≠');
  });

  it('FAIL-CLOSED (2): a mutated engine value reads RED', () => {
    const board = boardFixture();
    const result = backtestRegionZoomsVsEngine(board, OPTS, {
      mutateEngineRow: (row) => {
        if (row.id === 'ftse') row.pcts = { ...row.pcts, '1D': 9.9 };
      },
    });
    expect(result.red).toBeGreaterThan(0);
    expect(result.checks.find((c) => c.label.startsWith('zoom europe') && !c.ok)).toBeDefined();
  });

  it('FAIL-CLOSED (3): a dropped row on the page side reads RED', () => {
    const board = boardFixture();
    const result = backtestRegionZoomsVsEngine(board, OPTS, { dropPageRow: 'n225' });
    expect(result.red).toBeGreaterThan(0);
    expect(result.checks.find((c) => c.label.startsWith('zoom asia') && !c.ok)).toBeDefined();
  });

  it('stableStringify is key-order-immune and difference-true', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
    expect(stableStringify({ a: 1 })).not.toBe(stableStringify({ a: 2 }));
    expect(stableStringify(null)).toBe('null');
  });
});
