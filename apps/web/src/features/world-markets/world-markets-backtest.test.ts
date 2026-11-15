/**
 * world-markets-backtest tests (S7, 2026-11-08) — the offline §21
 * verdict-consistency suite, driving the pure core on fixtures (the
 * house pattern: tests never hit live sites — the live runs are the
 * manual pd-s7-backtest.ts script). What is pinned here:
 *
 *  - the full pipeline over a synthetic board + projection: EVERY check
 *    green (the page's status summary ≡ the engine's own summarizeMarkets
 *    + verdict-core answers; every registry row's five lenses + range +
 *    trend + status byte-identical to the stored board rows; the 9 risk
 *    readings byte-identical between the projection and the snapshot);
 *  - the designed S1-M1.6 #2 note: the buffered status counts and the
 *    RAW ≥10% count diverge honestly (reported, never a failure);
 *  - THREE FAIL-CLOSED proofs — a board whose stored summary disagrees
 *    with its own rows (the page trusts the stored rollup; the engine
 *    re-runs it — the core catches the mismatch), a mutated projection
 *    reading (the page would render a value the engine never stored),
 *    and a projection that drops an id the snapshot still serves;
 *  - the public-mode twin: an id absent on BOTH sides stays green with
 *    the §16 note (the honest note, never a card);
 *  - the key-order-immune stableStringify.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorReading, MarketsSnapshot } from '@currena/core';
import { MARKETS } from '@currena/insights/markets/definitions';
import { summarizeMarkets } from '@currena/insights/markets';
import { backtestWorldMarketsPage, stableStringify } from './world-markets-backtest-core';

/* ------------------------------------------------------------------ *
 * Fixtures — a full 16-row board + the 9 risk readings, shaped like
 * the stored contracts.
 * ------------------------------------------------------------------ */

const TODAY = '2026-11-08';

function boardRow(id: (typeof MARKETS)[number]['id'], i: number): MarketsSnapshot['markets'][number] {
  // The fromHigh spread: −25 bear · −12 correction · −7 pullback · −2/−1/−0.5/−3
  // near-high · −8 the EXIT-BUFFER case (a stored 'correction' whose distance
  // recovered above the −10 line — the staying rule, so the buffered status
  // counts and the RAW count genuinely diverge in this fixture).
  const fromHigh = [-25, -12, -7, -2, -1, -0.5, -3, -8][i % 8] ?? -1;
  return {
    id,
    asOf: '2026-11-07',
    close: 19624,
    chg1d: 0.5,
    chg1w: 0.4,
    chg1m: 1.2,
    chg3m: [2, 0, -2][i % 3] ?? 0,
    chg1y: 6,
    high52w: 20000,
    low52w: 17000,
    fromHigh,
    rangePos: 87,
    trend: 'flat',
    status: i % 8 === 0 ? 'bear' : i % 8 === 1 || i % 8 === 7 ? 'correction' : 'normal',
    source: 'eodhd',
    stale: false,
    weekly: [
      [0, 19000],
      [7, 19100],
    ],
  };
}

function fullBoard(): MarketsSnapshot {
  const markets = MARKETS.map((m, i) => boardRow(m.id, i));
  return { v: 1, generatedAt: '2026-11-07T23:31:00Z', markets, summary: summarizeMarkets(markets) };
}

const RISK_IDS = [
  'gpr-index',
  'gpr-threats',
  'gpr-acts',
  'gpr-daily',
  'gpr-russia',
  'gpr-ukraine',
  'gpr-israel',
  'gpr-saudi',
  'global-liquidity',
] as const;

function riskReadings(): IndicatorReading[] {
  return RISK_IDS.map((id, i) =>
    ({
      id,
      value: id === 'global-liquidity' ? 23.33 : 150.5 + i,
      asOf: '2026-10-01',
      status: 'context',
      percentile10y: 0.7 + i * 0.01,
      sourceName: 'fixture',
      updatedAt: '2026-11-08T11:23:21.693Z',
    }) as IndicatorReading,
  );
}

describe('backtestWorldMarketsPage — the offline §21 suite', () => {
  it('the full pipeline: every check green over the synthetic board + projection', () => {
    const board = fullBoard();
    const readings = riskReadings();
    const checks = backtestWorldMarketsPage(board, readings, readings, TODAY);
    const failed = checks.filter((c) => !c.ok);
    expect(failed, failed.map((c) => `${c.label}: page ${c.page} vs engine ${c.engine}`).join(' | ')).toEqual([]);
    // 9 risk inputs + 5 status checks + 1 divergence note + 16 rows × 2
    // + 1 structure + 9 byte-identity = 57.
    expect(checks).toHaveLength(57);
  });

  it('the designed S1-M1.6 #2 note: the buffered status counts and the RAW count diverge honestly', () => {
    const board = fullBoard();
    const readings = riskReadings();
    const checks = backtestWorldMarketsPage(board, readings, readings, TODAY);
    const divergence = checks.find((c) => c.label.includes('buffered-vs-RAW divergence'));
    // The fixture's −8 rows carry a buffered 'correction' status above the
    // −10 line: summarizeMarkets counts the statuses (6), the page counts
    // the RAW distances (4) — the note reports the difference, ok stays
    // true (the staying rule vs the being rule, never mixed).
    expect(divergence).toBeDefined();
    expect(divergence!.ok).toBe(true);
    expect(divergence!.note).toBeDefined();
  });

  it('FAIL-CLOSED 1: a board whose stored summary disagrees with its own rows goes RED', () => {
    const board = fullBoard();
    // Corrupt the stored rollup the page trusts (the engine side re-runs
    // summarizeMarkets over the rows and catches it).
    board.summary = { ...board.summary, signal: 'normal', nAttention: 0, nUnusual: 0 };
    const readings = riskReadings();
    const checks = backtestWorldMarketsPage(board, readings, readings, TODAY);
    expect(checks.find((c) => c.label.includes('§5.3 signal'))!.ok).toBe(false);
    expect(checks.find((c) => c.label.includes('§5.3 counts'))!.ok).toBe(false);
  });

  it('FAIL-CLOSED 2: a mutated projection reading (the page would render a value the engine never stored) goes RED', () => {
    const board = fullBoard();
    const snapshotReadings = riskReadings();
    const projectionReadings = snapshotReadings.map((r) => (r.id === 'gpr-index' ? { ...r, value: 999.9 } : r));
    const checks = backtestWorldMarketsPage(board, projectionReadings, snapshotReadings, TODAY);
    const mutated = checks.find((c) => c.label.includes('risk card gpr-index'));
    expect(mutated).toBeDefined();
    expect(mutated!.ok).toBe(false);
  });

  it('FAIL-CLOSED 3: a projection that drops an id the snapshot still serves goes RED', () => {
    const board = fullBoard();
    const snapshotReadings = riskReadings();
    const projectionReadings = snapshotReadings.filter((r) => r.id !== 'gpr-saudi');
    const checks = backtestWorldMarketsPage(board, projectionReadings, snapshotReadings, TODAY);
    const dropped = checks.find((c) => c.label.includes('risk input gpr-saudi'));
    expect(dropped).toBeDefined();
    expect(dropped!.ok).toBe(false);
  });

  it('the public-mode twin: an id absent on BOTH sides stays green with the §16 note', () => {
    const board = fullBoard();
    const snapshotReadings = riskReadings().filter((r) => r.id !== 'gpr-saudi');
    const projectionReadings = snapshotReadings;
    const checks = backtestWorldMarketsPage(board, projectionReadings, snapshotReadings, TODAY);
    const absent = checks.find((c) => c.label.includes('risk input gpr-saudi'));
    expect(absent).toBeDefined();
    expect(absent!.ok).toBe(true);
    expect(absent!.note).toContain('§16');
  });

  it('stableStringify is key-order immune (the byte-identity basis)', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
    expect(stableStringify({ b: 1, a: { d: 4, c: 3 } })).toBe(stableStringify({ a: { c: 3, d: 4 }, b: 1 }));
    // undefined renders as 'null' (JSON's own answer — the S5 core's
    // convention; `show()` is the distinguisher for absent values).
    expect(stableStringify(undefined)).toBe('null');
    expect(stableStringify([1, { z: null }])).toBe('[1,{"z":null}]');
  });
});
