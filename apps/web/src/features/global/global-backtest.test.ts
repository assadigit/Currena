/**
 * global-backtest tests (S4, 2026-11-08) — the verdict-consistency
 * backtest's OFFLINE half (spec §21's zero-tolerance gate, pinned into
 * the suite so the comparison machinery itself is tested):
 *
 *  - the FULL pipeline over a synthetic-but-realistic snapshot: the S2
 *    projection (projectSnapshotToPage) → the page's global-tiles
 *    derivations MUST equal the engine's own arithmetic over the full
 *    snapshot — every gauge step/word/counts, the Gold Balance counts +
 *    7-state outlook, the ribbon + dedollar readings byte-identical;
 *  - the boards: the markets tile vs the board's stored summary + the
 *    engine's own summarizeMarkets, the RAW ≥10%/≥20% counts, the fx
 *    tile vs summarizeFxRules + the §9.3 active count;
 *  - the DESIGNED divergence stays honest: a market inside the
 *    exit-buffer (−9.5% after leaving correction) counts in the stored
 *    buffered summary but NOT in the page's RAW count — reported as a
 *    note, never a failure (S1-M1.6 #2);
 *  - FAIL-CLOSED PROOF: seeding drift into the projection (one voter's
 *    status flipped / one ribbon value changed) MUST turn the backtest
 *    red — the checker can never silently agree with a drifted page;
 *  - public-mode honesty: the licence-hidden quartet's absence never
 *    touches Global (none is an engine input — absentIds stays empty
 *    and every input rides the projection).
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { FxSnapshot, IndicatorId, IndicatorReading, InsightsSnapshot, MarketsSnapshot } from '@currena/core';
import { projectSnapshotToPage } from '@currena/insights/page-division';
import { backtestGlobalInputIds, backtestGlobalTiles, stableStringify } from './global-backtest-core';
import { globalGoldTile } from './global-tiles';

/* ------------------------------------------------------------------ *
 * A realistic synthetic snapshot — every engine input carries a reading
 * with enough variety (statuses, values, changes, percentiles) that the
 * engines produce non-trivial, non-uniform verdicts.
 * ------------------------------------------------------------------ */

const registry = JSON.parse(
  readFileSync(new URL('../../../../../data/indicators.json', import.meta.url), 'utf8'),
) as { indicators: { id: string }[] };
const ALL_IDS = registry.indicators.map((i) => i.id) as IndicatorId[];

const hiddenOverrides = JSON.parse(
  readFileSync(new URL('../../../../../data/site-mode-overrides.json', import.meta.url), 'utf8'),
) as { hiddenIndicatorIds: string[] };
const HIDDEN = new Set<string>(hiddenOverrides.hiddenIndicatorIds);

/** Deterministic variety: some warnings, some stale, real-ish numbers. */
function readingFor(id: string, index: number): IndicatorReading {
  const bucket = index % 7;
  const base: Partial<IndicatorReading> =
    bucket === 0
      ? { value: 4.2 + (index % 13) * 0.1, status: 'warning', change30d: -1.4 - (index % 5) * 0.2, percentile10y: 0.93 }
      : bucket === 1
        ? { value: 2.7 + (index % 9) * 0.1, status: 'normal', change30d: 0.4, percentile10y: 0.61 }
        : bucket === 2
          ? { value: null, asOf: null, status: 'unavailable' }
          : bucket === 3
            ? { value: 101.2 + index, status: 'stale', change30d: 2.9, percentile10y: 0.44 }
            : bucket === 4
              ? { value: 0.35 + (index % 4) * 0.05, status: 'normal', change30d: -0.21, percentile10y: 0.18 }
              : bucket === 5
                ? { value: 3880.5 + index * 3, status: 'warning', change30d: 3.6, percentile10y: 0.97 }
                : { value: 57.4, status: 'normal', change30d: -0.8, percentile10y: 0.5 };
  return {
    id: id as IndicatorReading['id'],
    value: 1,
    asOf: '2026-11-07',
    status: 'normal',
    sourceName: 'fixture',
    updatedAt: '2026-11-08T04:20:00.000Z',
    ...base,
  } as IndicatorReading;
}

const fullSnapshot: InsightsSnapshot = {
  generatedAt: '2026-11-08T04:20:00.000Z',
  summary: {
    global: { section: 'global', label: 'cautious', warningCount: 5, votingCount: 37, excludedCount: 0 },
    australia: { section: 'australia', label: 'relaxed', warningCount: 1, votingCount: 6, excludedCount: 0 },
  },
  readings: ALL_IDS.map((id, i) => readingFor(id, i)),
  changedThisWeek: [],
  calendar: [],
};

/** The public projection twin: the licence-hidden quartet absent. */
const publicSnapshot: InsightsSnapshot = {
  ...fullSnapshot,
  displayMode: 'public',
  readings: fullSnapshot.readings.filter((r) => !HIDDEN.has(r.id)),
};

/* ------------------------------------------------------------------ *
 * Board fixtures — including ONE market inside the exit buffer, so the
 * designed buffered-vs-RAW divergence actually fires.
 * ------------------------------------------------------------------ */

function marketEntry(
  id: 'dax' | 'sp500' | 'n225' | 'cac' | 'ftse' | 'tsx',
  fromHigh: number,
  prevStatus: 'normal' | 'correction' | 'bear',
  chg1d = 0.5,
): MarketsSnapshot['markets'][number] {
  return {
    id,
    asOf: '2026-11-07',
    close: 19624,
    chg1d,
    chg1w: 0.4,
    chg1m: 1.2,
    chg3m: 3,
    high52w: 20000,
    low52w: 17000,
    fromHigh,
    rangePos: 87,
    trend: 'flat',
    // The stored STATUS keeps the exit-buffer memory: a −9.5% market that
    // was ≤ −10% still reads 'correction' (compute.ts statusOf).
    status:
      prevStatus === 'bear'
        ? 'bear'
        : prevStatus === 'correction' && fromHigh <= -9
          ? 'correction'
          : fromHigh <= -20
            ? 'bear'
            : fromHigh <= -10
              ? 'correction'
              : 'normal',
    source: 'eodhd',
    stale: false,
    weekly: [
      [0, 19000],
      [7, 19100],
    ],
  };
}

/** The stored summary is summarizeMarkets' own output over these rows
 *  (verified by the backtest's engine-side recompute): buffered statuses —
 *  dax/sp500 corrections, cac/tsx bears, n225/ftse inside the exit buffer
 *  (−9.5%/−9.2% after leaving correction) — give stressed 5 ≥
 *  ATTENTION_COUNT 4 and < UNUSUAL_COUNT 8, no US bear override →
 *  attention; two rows rose beyond the ±1% band. The RAW rule counts
 *  dax/sp500/cac/tsx (4) but NOT n225/ftse → the designed divergence
 *  (buffered nAttention 3 ≠ RAW 4) the backtest rides as a note. */
const MARKETS: MarketsSnapshot = {
  v: 1,
  generatedAt: '2026-11-07T23:31:00Z',
  markets: [
    marketEntry('dax', -12, 'correction', 1.5),
    marketEntry('sp500', -15, 'correction'),
    marketEntry('cac', -25, 'bear'),
    marketEntry('tsx', -21, 'bear'),
    marketEntry('n225', -9.5, 'correction', 1.2),
    marketEntry('ftse', -9.2, 'correction'),
  ],
  summary: { count: 6, roseToday: 2, nAttention: 3, nUnusual: 2, signal: 'attention', worstGroup: 'europe' },
};

function fxRule(id: FxSnapshot['rules'][number]['id'], outcome: FxSnapshot['rules'][number]['outcome']): FxSnapshot['rules'][number] {
  return {
    id,
    outcome,
    counted: outcome === 'warning',
    numbers: {},
    confirmedBy: [],
    progress: 0,
    legs: [],
    pattern: { status: 'nodata', agreeWeeks: 0, ofWeeks: 13, weeks: [] },
    chart: { expect: 'together', series: [] },
  };
}

const FX: FxSnapshot = {
  v: 1,
  generatedAt: '2026-11-07T17:01:00Z',
  dollarMeasure: {
    asOf: '2026-11-06',
    value: 100.25,
    chg: { d1: 0.1, m1: -0.5, m3: 1.2, y1: 2.0 },
    weekly: [
      [0, 100],
      [7, 100.5],
    ],
  },
  pairs: [],
  rules: [
    fxRule('r1_risk_mood', 'warning'),
    fxRule('r2_carry_trade', 'supportive'),
    fxRule('r3_dollar_strength', 'watch'),
    fxRule('r4_money_hiding', 'quiet'),
    fxRule('r5_china_link', 'context'),
    fxRule('r6_europe_worry', 'quiet'),
    fxRule('r7_dollar_or_euro', 'quiet'),
  ],
  summary: { signal: 'attention', countedWarnings: 1, headlineRule: 'r1_risk_mood' },
};

/* ------------------------------------------------------------------ *
 * The pipeline checks
 * ------------------------------------------------------------------ */

describe('backtestGlobalTiles — the S4 verdict-consistency core', () => {
  it('the input list covers exactly the engines’ consumption (gauges ∪ gold voters ∪ ribbon ∪ dedollar)', () => {
    const inputs = new Set(backtestGlobalInputIds());
    // Spot pins: one member per source.
    expect(inputs.has('us10y')).toBe(true); // gauge member (borrowing-costs)
    expect(inputs.has('dollar-basket')).toBe(true); // gold voter (dollar lane)
    expect(inputs.has('gold-usd')).toBe(true); // ribbon
    expect(inputs.has('nyfed-custody')).toBe(true); // dedollar
    // The licence-hidden quartet are context cards, NEVER engine inputs.
    for (const hidden of HIDDEN) expect(inputs.has(hidden)).toBe(false);
  });

  it('the full pipeline over a complete snapshot: EVERY check green (page ≡ engine)', () => {
    const projection = projectSnapshotToPage(fullSnapshot, 'global');
    const checks = backtestGlobalTiles(projection.readings, fullSnapshot.readings, MARKETS, FX);
    const failures = checks.filter((c) => !c.ok);
    expect(failures).toEqual([]);
    // Substantive coverage: the five gauges + gold + markets + fx + ribbon
    // + dedollar all compared.
    expect(checks.length).toBeGreaterThanOrEqual(backtestGlobalInputIds().length + 22);
  });

  it('the PUBLIC projection (licence-hidden quartet absent): every check still green — no engine input is licence-hidden', () => {
    const projection = projectSnapshotToPage(publicSnapshot, 'global');
    expect(projection.absentIds).toEqual([]); // the quartet are not Global mirrors
    const checks = backtestGlobalTiles(projection.readings, publicSnapshot.readings, MARKETS, FX);
    expect(checks.filter((c) => !c.ok)).toEqual([]);
  });

  it('the markets board: the stored rollup + the engine’s own summarizeMarkets + the RAW counts agree; the buffered divergence rides as a note', () => {
    const projection = projectSnapshotToPage(fullSnapshot, 'global');
    const checks = backtestGlobalTiles(projection.readings, fullSnapshot.readings, MARKETS, FX);
    const raw = checks.find((c) => c.label === 'markets RAW ≥10%-below-high count')!;
    // RAW: dax −12% · sp500 −15% · cac −25% · tsx −21% count (the bear tier
    // sits inside ≥10%-below-high); n225 −9.5% and ftse −9.2% do not (the
    // exit buffer).
    expect(raw.page).toBe('4');
    expect(raw.note).toContain('exit-buffer');
    // The buffered summary counts n225 + ftse but not the bears' correction
    // tier (nAttention 3) — the designed divergence.
    expect(MARKETS.summary.nAttention).toBe(3);
    const signal = checks.find((c) => c.label === 'markets signal (the stored §5.3 rollup)')!;
    expect(signal.ok).toBe(true);
    const bear = checks.find((c) => c.label === 'markets RAW ≥20%-below-high (bear) count')!;
    expect(bear.page).toBe('2');
  });

  it('FAIL-CLOSED PROOF: a flipped voter status in the projection turns the backtest RED', () => {
    const projection = projectSnapshotToPage(fullSnapshot, 'global');
    // us10y is a borrowing-costs member; flip its status to the OPPOSITE
    // of whatever the fixture gave it (the flip must change something).
    const current = projection.readings.find((r) => r.id === ('us10y' as IndicatorReading['id']))!;
    const flipped: 'normal' | 'warning' = current.status === 'warning' ? 'normal' : 'warning';
    const poisoned = projection.readings.map((r) =>
      r.id === ('us10y' as IndicatorReading['id']) ? { ...r, status: flipped } : r,
    );
    const checks = backtestGlobalTiles(poisoned, fullSnapshot.readings, MARKETS, FX);
    const failures = checks.filter((c) => !c.ok);
    expect(failures.length).toBeGreaterThan(0);
    expect(failures.some((c) => c.label.startsWith('gauge borrowing-costs'))).toBe(true);
  });

  it('FAIL-CLOSED PROOF: a mutated ribbon value turns the byte-identity check RED', () => {
    const projection = projectSnapshotToPage(fullSnapshot, 'global');
    const poisoned = projection.readings.map((r) =>
      r.id === ('brent' as IndicatorReading['id']) ? { ...r, value: (r.value ?? 100) + 3.25 } : r,
    );
    const checks = backtestGlobalTiles(poisoned, fullSnapshot.readings, MARKETS, FX);
    const ribbonCheck = checks.find((c) => c.label === 'ribbon reading brent byte-identical to the snapshot')!;
    expect(ribbonCheck.ok).toBe(false);
  });

  it('FAIL-CLOSED PROOF: a dropped gold voter turns the input check RED and a blanked firing voter turns the counts RED', () => {
    const projection = projectSnapshotToPage(fullSnapshot, 'global');
    // Drop a voter entirely → the input-completeness check must fire.
    const dropped = projection.readings.filter((r) => r.id !== ('dollar-basket' as IndicatorReading['id']));
    const droppedChecks = backtestGlobalTiles(dropped, fullSnapshot.readings, MARKETS, FX);
    expect(droppedChecks.some((c) => c.label === 'input dollar-basket rides the projection' && !c.ok)).toBe(true);
    // Blank one FIRING voter (impact supports/pressures in the clean
    // balance) → the for/against counts must change → the counts check
    // must fire. Picked dynamically so the proof holds whatever the
    // fixture's deterministic buckets gave each voter.
    const clean = globalGoldTile(projection.readings);
    const firing = clean.balance.lanes.flatMap((lane) => lane.members).find((m) => m.impact === 'supports' || m.impact === 'pressures');
    expect(firing).toBeDefined();
    const blanked = projection.readings.map((r) =>
      r.id === firing!.id ? { ...r, value: null, asOf: null, status: 'unavailable' as const, change30d: undefined, percentile10y: undefined } : r,
    );
    const blankedChecks = backtestGlobalTiles(blanked, fullSnapshot.readings, MARKETS, FX);
    expect(blankedChecks.some((c) => c.label === 'gold balance counts (for/against/neutral/unread)' && !c.ok)).toBe(true);
  });

  it('stableStringify is key-order immune (zod re-parse cannot forge byte-identity)', () => {
    const a = { id: 'x', value: 1, change7d: 2 };
    const b = { change7d: 2, value: 1, id: 'x' };
    expect(stableStringify(a)).toBe(stableStringify(b));
    expect(stableStringify({ ...a, value: 2 })).not.toBe(stableStringify(a));
  });
});
