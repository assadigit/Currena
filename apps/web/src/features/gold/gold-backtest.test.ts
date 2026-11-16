/**
 * gold-backtest tests (S5, 2026-11-08) — the §21 seat-level diff's
 * offline suite proof (the S4 global-backtest.test pattern): the full
 * pipeline over a synthetic projection/snapshot pair, the public-mode
 * twin (the licence-hidden quartet reported as absentIds — never a
 * guess), and three FAIL-CLOSED proofs — a flipped voter, a mutated
 * hero value and a dropped context reading each surface RED, never as
 * two copies of the same bug agreeing.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorReading, PageProjection } from '@currena/core';
import { goldBalance } from '@currena/insights';
import { GOLD_VOTER_IDS } from '@currena/insights/page-division';
import { backtestGoldPage, stableStringify } from './gold-backtest-core';
import { GOLD_CONTEXT_IDS } from './gold-tiles';

/* ------------------------------------------------------------------ *
 * Fixtures — a synthetic snapshot (the engine's own full document) and
 * the projection that would be served from it (homes + mirrors).
 * ------------------------------------------------------------------ */

function reading(id: string, partial: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id: id as IndicatorReading['id'],
    value: 1,
    asOf: '2026-11-07',
    status: 'normal',
    sourceName: 'fixture',
    updatedAt: '2026-11-07T20:11:07.445Z',
    ...partial,
  } as IndicatorReading;
}

/** The engine-side snapshot: all 37 voters + the 14 context homes +
 * an unrelated id (the full document carries 180+; three suffice to
 * prove the projection is a subset). */
function snapshotReadings(): IndicatorReading[] {
  const inputs: Record<string, Partial<IndicatorReading>> = {
    'real-yield-10y': { change30d: -1.0 },
    us10y: { change30d: -1.0 },
    'dollar-basket': { change30d: -2.0 },
    'dollar-broad': { change30d: -2.0 },
    'dollar-eme': { change30d: -2.0 },
    'stress-stlfsi': { percentile10y: 0.9 },
    nfci: { percentile10y: 0.9 },
    vix: { percentile10y: 0.9 },
    'us-cpi-yoy': { percentile10y: 0.9 },
    'us-pce-core-yoy': { percentile10y: 0.9 },
    'euro-hicp': { percentile10y: 0.9 },
    'cftc-gold-positioning': { percentile10y: 0.9, value: 44.98 },
    'cftc-gold-gross-long': { percentile10y: 0.9, value: 55.25 },
    'gold-usd': { value: 4072.1, change7d: 4.44, change30d: -3.42, percentile10y: 0.906 },
    'gold-silver': { value: 78.5, percentile10y: 0.366, change30d: 8.7 },
    'gold-btc': { value: 0.053727 },
    'gold-aud': { value: 5930.6095 },
    'gold-oil-ratio': { value: 41.45, percentile10y: 0.795 },
    'gold-platinum': { value: 2.64, percentile10y: 0.862 },
    'real-gold-price': { value: 1243, percentile10y: 0.931 },
    'copper-gold': { value: 3.5342265529841654, percentile10y: 0.263 },
    'gold-equities-ratio': { value: 0.5066, percentile10y: 0.587 },
    'sge-gold-withdrawals': { value: 92.08 },
    'swiss-gold-flow': { value: 227.9, percentile10y: 0.824 },
    'shanghai-gold-premium': { value: -0.62, percentile10y: 0.439 },
  };
  const ids = [...new Set([...GOLD_VOTER_IDS, ...GOLD_CONTEXT_IDS, 'us-unemployment'])];
  return ids.map((id) => reading(id, inputs[id] ?? { percentile10y: 0.5 }));
}

/** The served Gold projection (public mode): the placement's readings,
 * the licence-hidden quartet honestly absent. */
function goldProjection(readings: readonly IndicatorReading[] = snapshotReadings()): PageProjection {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  const expected = [...GOLD_CONTEXT_IDS, ...GOLD_VOTER_IDS.filter((id) => !GOLD_CONTEXT_IDS.includes(id))];
  return {
    page: 'gold',
    generatedAt: '2026-11-07T20:11:07.445Z',
    pricesAsOf: '2026-11-08T00:13:17.925Z',
    displayMode: 'public',
    readings: expected.flatMap((id) => {
      const r = byId.get(id);
      return r === undefined ? [] : [r];
    }),
    absentIds: ['wgc-etf-holdings', 'wgc-cb-demand', 'official-gold-demand', 'etf-short-interest'],
    boards: [],
  };
}

describe('backtestGoldPage — the §21 seat-level diff', () => {
  it('the full pipeline: every check green over a synthetic snapshot (engine ≡ page)', () => {
    const checks = backtestGoldPage(goldProjection().readings, snapshotReadings());
    const failed = checks.filter((c) => !c.ok);
    expect(failed, failed.map((f) => `${f.label}: page ${f.page} ≠ engine ${f.engine}`).join('\n')).toEqual([]);
    // The shape: 51 input checks + 3 hero checks + 5 lane checks +
    // 74 seat checks (37 seats × impact + evidence) + 2 presentation
    // checks + 15 byte-identity checks = 150.
    expect(checks.length).toBe(150);
  });

  it('the public-mode twin: the licence-hidden quartet stays ABSENT (never a guess, never a card)', () => {
    const projection = goldProjection();
    expect(projection.absentIds).toEqual(['wgc-etf-holdings', 'wgc-cb-demand', 'official-gold-demand', 'etf-short-interest']);
    // The backtest over the public pair still runs green — the voters
    // and context cards all ride the projection; the blocked ids are
    // engine-side context that never enters the meter.
    const checks = backtestGoldPage(projection.readings, snapshotReadings());
    expect(checks.filter((c) => !c.ok)).toEqual([]);
  });

  it('FAIL-CLOSED proof 1: a flipped voter surfaces RED at the seat level', () => {
    // The page's projection flips one voter's input: the seat's evidence
    // (and the lane's counts) diverge from the engine's snapshot.
    const pageReadings = goldProjection().readings.map((r) => (r.id === 'real-yield-10y' ? { ...r, change30d: 1.0 } : r));
    const checks = backtestGoldPage(pageReadings, snapshotReadings());
    const red = checks.filter((c) => !c.ok);
    expect(red.length).toBeGreaterThan(0);
    expect(red.some((c) => c.label.includes('seat borrowing-costs/real-yield-10y'))).toBe(true);
    expect(red.some((c) => c.label.includes('lane borrowing-costs'))).toBe(true);
  });

  it('FAIL-CLOSED proof 2: a mutated hero value surfaces RED (byte-identity)', () => {
    const pageReadings = goldProjection().readings.map((r) => (r.id === 'gold-usd' ? { ...r, value: 4172.1 } : r));
    const checks = backtestGoldPage(pageReadings, snapshotReadings());
    expect(checks.find((c) => c.label.includes('hero price reading gold-usd'))?.ok).toBe(false);
  });

  it('FAIL-CLOSED proof 3: a dropped context reading surfaces RED (absent ≠ present)', () => {
    const pageReadings = goldProjection().readings.filter((r) => r.id !== 'swiss-gold-flow');
    const checks = backtestGoldPage(pageReadings, snapshotReadings());
    expect(checks.find((c) => c.label.includes('input swiss-gold-flow'))?.ok).toBe(false);
    expect(checks.find((c) => c.label.includes('context reading swiss-gold-flow'))?.ok).toBe(false);
  });

  it('the key-order-immune stableStringify: reordered keys stay byte-identical', () => {
    const a = { id: 'gold-usd', value: 4072.1, asOf: '2026-11-08' };
    const b = { asOf: '2026-11-08', value: 4072.1, id: 'gold-usd' };
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it('the engine sanity: the fixture actually moves the meter (4 lanes for, 1 against)', () => {
    const balance = goldBalance(snapshotReadings());
    expect(balance.counts).toEqual({ for: 4, against: 1, neutral: 0, unread: 0 });
  });
});
