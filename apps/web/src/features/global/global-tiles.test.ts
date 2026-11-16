/**
 * global-tiles tests (S3, 2026-11-08) — the D-21 verdict board's pure
 * arithmetic, driven directly (the house pattern: pure functions, plain
 * fixtures, no React rendering). What is pinned here:
 *
 *  - the D-21 gauge list is EXACTLY the five thematic gauges (no AU, no
 *    shadow lanes) and every tile's word follows labelForVerdictStep —
 *    the board can never speak a verdict word the engine didn't say;
 *  - the unread discipline: missing voters never invent a verdict (step 0
 *    → word null → the page renders "Cannot read yet");
 *  - the D-22 ribbon is exactly gold · brent · BTC in order, riding the
 *    projection's own readings (live-merged at serve time);
 *  - the markets/fx tiles read the boards' own summary arithmetic (the
 *    RAW ≥10%/≥20% rules and the §9.3 active count);
 *  - the D-23 chip dots mirror real engine verdicts only (Markets ← the
 *    markets verdict; Currencies ← the fx signal) and stay neutral
 *    otherwise — never an invented composite (D-48).
 */

import { describe, expect, it } from 'vitest';
import type { FxSnapshot, IndicatorReading, MarketsSnapshot } from '@currena/core';
import { GAUGES, labelForVerdictStep } from '@currena/insights';
import { THEMATIC_GAUGE_IDS, THEMATIC_GAUGE_MEMBER_IDS } from '@currena/insights/page-division';
import {
  GLOBAL_RIBBON_IDS,
  GLOBAL_TILE_INPUT_IDS,
  fxChipDot,
  globalDedollarTile,
  globalFxTile,
  globalGaugeTiles,
  globalGoldTile,
  globalMarketsTile,
  globalRibbon,
  marketsChipDot,
} from './global-tiles';

/* ------------------------------------------------------------------ *
 * Fixtures — readings shaped like the projection's own (status drives
 * the gauges; the value fields exist only where a tile reads them).
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

/** Every scored member of the five thematic gauges, in `status`. */
function allThematicReadings(status: IndicatorReading['status']): IndicatorReading[] {
  return THEMATIC_GAUGE_MEMBER_IDS.map((id) => reading(id, { status }));
}

const marketEntry = (id: 'dax' | 'sp500', fromHigh: number): MarketsSnapshot['markets'][number] => ({
  id,
  asOf: '2026-11-07',
  close: 19624,
  chg1d: 0.5,
  chg1w: 0.4,
  chg1m: 1.2,
  chg3m: 3,
  high52w: 20000,
  low52w: 17000,
  fromHigh,
  rangePos: 87,
  trend: 'flat',
  status: fromHigh <= -20 ? 'bear' : fromHigh <= -10 ? 'correction' : 'normal',
  source: 'eodhd',
  stale: false,
  weekly: [
    [0, 19000],
    [7, 19100],
  ],
});

const MARKETS: MarketsSnapshot = {
  v: 1,
  generatedAt: '2026-11-07T23:31:00Z',
  markets: [marketEntry('dax', -12), marketEntry('sp500', -25)],
  summary: { count: 2, roseToday: 1, nAttention: 1, nUnusual: 1, signal: 'attention', worstGroup: 'europe' },
};

const FX_RULE = (id: FxSnapshot['rules'][number]['id'], outcome: FxSnapshot['rules'][number]['outcome']): FxSnapshot['rules'][number] => ({
  id,
  outcome,
  counted: outcome === 'warning',
  numbers: {},
  confirmedBy: [],
  progress: 0,
  legs: [],
  pattern: { status: 'nodata', agreeWeeks: 0, ofWeeks: 13, weeks: [] },
  chart: { expect: 'together', series: [] },
});

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
    FX_RULE('r1_risk_mood', 'warning'),
    FX_RULE('r2_carry_trade', 'supportive'),
    FX_RULE('r3_dollar_strength', 'watch'),
    FX_RULE('r4_money_hiding', 'quiet'),
    FX_RULE('r5_china_link', 'context'),
    FX_RULE('r6_europe_worry', 'quiet'),
    FX_RULE('r7_dollar_or_euro', 'quiet'),
  ],
  summary: { signal: 'attention', countedWarnings: 1, headlineRule: 'r1_risk_mood' },
};

/* ------------------------------------------------------------------ *
 * Tiles ②–⑥ — the five thematic gauges
 * ------------------------------------------------------------------ */

describe('globalGaugeTiles', () => {
  it('derives the D-21 gauge list from the placement constant — exactly the five thematic gauges, in GAUGES order', () => {
    const tiles = globalGaugeTiles([]);
    expect(tiles.map((t) => t.gauge)).toEqual([...THEMATIC_GAUGE_IDS]);
    // And the engine agrees those five exist with the expected sections.
    for (const id of THEMATIC_GAUGE_IDS) {
      expect(GAUGES.find((g) => g.id === id)?.section).toBe('global');
    }
  });

  it('every tile word is labelForVerdictStep of the same reading (the engine word, never a parallel vocabulary)', () => {
    for (const status of ['normal', 'warning', 'stale', 'unavailable'] as const) {
      const tiles = globalGaugeTiles(allThematicReadings(status));
      for (const tile of tiles) {
        expect(tile.word).toBe(labelForVerdictStep(tile.reading.step));
      }
    }
  });

  it('all members normal → every gauge reads step 1 (relaxed)', () => {
    const tiles = globalGaugeTiles(allThematicReadings('normal'));
    expect(tiles.every((t) => t.reading.step === 1 && t.word === 'relaxed')).toBe(true);
    for (const tile of tiles) {
      expect(tile.reading.warningCount).toBe(0);
      expect(tile.reading.votingCount).toBeGreaterThan(0);
    }
  });

  it('all members warning → every gauge reads step 4 (alarmed)', () => {
    const tiles = globalGaugeTiles(allThematicReadings('warning'));
    expect(tiles.every((t) => t.reading.step === 4 && t.word === 'alarmed')).toBe(true);
  });

  it('no readings at all → step 0 and word null (the honest unread, never a guess)', () => {
    const tiles = globalGaugeTiles([]);
    expect(tiles.every((t) => t.reading.step === 0 && t.word === null && t.reading.votingCount === 0)).toBe(true);
  });

  it('a majority of warnings inside one gauge reads step 4; a minority reads step 2 (the share arithmetic)', () => {
    // prices-heat has 6 members (us-cpi-yoy, us-pce-core-yoy, euro-hicp,
    // breakeven-5y5y, michigan-5y-expectations, brent) — 5 of 6 warning
    // is > 2/3 → step 4; 1 of 6 is ≤ 1/3 → step 2.
    const members = GAUGES.find((g) => g.id === 'prices-heat')!.members;
    const heavy = members.map((id, i) => reading(id, { status: i < 5 ? 'warning' : 'normal' }));
    expect(globalGaugeTiles(heavy).find((t) => t.gauge === 'prices-heat')!.reading.step).toBe(4);
    const light = members.map((id, i) => reading(id, { status: i === 0 ? 'warning' : 'normal' }));
    const lightTile = globalGaugeTiles(light).find((t) => t.gauge === 'prices-heat')!;
    expect(lightTile.reading.step).toBe(2);
    expect(lightTile.reading.warningCount).toBe(1);
    expect(lightTile.reading.votingCount).toBe(6);
  });

  it('GLOBAL_TILE_INPUT_IDS carries exactly the five gauges’ members (the S4 backtest pin basis)', () => {
    expect(GLOBAL_TILE_INPUT_IDS).toEqual([...THEMATIC_GAUGE_MEMBER_IDS]);
  });
});

/* ------------------------------------------------------------------ *
 * Tile ① — the Gold Balance
 * ------------------------------------------------------------------ */

describe('globalGoldTile', () => {
  it('empty readings → all five lanes unread → outlook null (fail-closed)', () => {
    const tile = globalGoldTile([]);
    expect(tile.balance.counts.unread).toBe(tile.balance.lanes.length);
    expect(tile.outlook).toBeNull();
  });

  it('the balance is the SAME engine value the Gold page reads (goldBalance identity)', () => {
    const readings = allThematicReadings('normal');
    const tile = globalGoldTile(readings);
    expect(tile.balance.counts.for + tile.balance.counts.against + tile.balance.counts.neutral + tile.balance.counts.unread).toBe(
      tile.balance.lanes.length,
    );
    expect(tile.balance.net).toBe(tile.balance.counts.for - tile.balance.counts.against);
  });
});

/* ------------------------------------------------------------------ *
 * Tile ⑨ — the prices ribbon
 * ------------------------------------------------------------------ */

describe('globalRibbon', () => {
  it('is exactly gold · brent · BTC in D-22 order, riding the projection readings verbatim', () => {
    const readings = [
      reading('gold-usd', { value: 4072.1 }),
      reading('brent', { value: 107.35 }),
      reading('btc-usd', { value: 98432 }),
    ];
    const ribbon = globalRibbon(readings);
    expect(ribbon.map((r) => r.id)).toEqual([...GLOBAL_RIBBON_IDS]);
    expect(ribbon.map((r) => r.id)).toEqual(['gold-usd', 'brent', 'btc-usd']);
    expect(ribbon[0]!.reading?.value).toBe(4072.1);
    expect(ribbon[2]!.reading?.value).toBe(98432);
  });

  it('a missing reading stays undefined (honest unread, never a fabricated price)', () => {
    const ribbon = globalRibbon([reading('gold-usd', { value: 4072.1 })]);
    expect(ribbon[0]!.reading).toBeDefined();
    expect(ribbon[1]!.reading).toBeUndefined();
    expect(ribbon[2]!.reading).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ *
 * Tile ⑩ — the dedollarization context
 * ------------------------------------------------------------------ */

describe('globalDedollarTile', () => {
  it('reads exactly usd-reserve-share and nyfed-custody from the readings', () => {
    const readings = [reading('usd-reserve-share', { value: 57.4 }), reading('nyfed-custody', { value: 3210, change30d: -1.2 })];
    const tile = globalDedollarTile(readings);
    expect(tile.reserveShare?.value).toBe(57.4);
    expect(tile.custody?.change30d).toBe(-1.2);
  });

  it('missing inputs stay undefined — display-only, never a guess', () => {
    const tile = globalDedollarTile([]);
    expect(tile.reserveShare).toBeUndefined();
    expect(tile.custody).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ *
 * Tile ⑧ — the World Markets status
 * ------------------------------------------------------------------ */

describe('globalMarketsTile', () => {
  it('reads the section verdict + the RAW ≥10%/≥20% counts from the board snapshot', () => {
    const tile = globalMarketsTile(MARKETS);
    // §5.3 attention signal → step 3.
    expect(tile.step).toBe(3);
    expect(tile.signal).toBe('attention');
    // dax at −12% → correction; sp500 at −25% → bear.
    expect(tile.inCorrection).toBe(2);
    expect(tile.inBear).toBe(1);
    expect(tile.total).toBe(2);
  });

  it('a calm board with most markets up over 3 months reads step 1 (Bullish)', () => {
    const calm: MarketsSnapshot = {
      ...MARKETS,
      markets: [marketEntry('dax', -1.9), marketEntry('sp500', -2.5)],
      summary: { count: 2, roseToday: 2, nAttention: 0, nUnusual: 0, signal: 'normal', worstGroup: null },
    };
    const tile = globalMarketsTile(calm);
    expect(tile.step).toBe(1);
    expect(tile.inCorrection).toBe(0);
    expect(tile.inBear).toBe(0);
  });
});

/* ------------------------------------------------------------------ *
 * Tile ⑦ — the FX Lights
 * ------------------------------------------------------------------ */

describe('globalFxTile', () => {
  it('reads the section signal + counted warnings + the §9.3 active count', () => {
    const tile = globalFxTile(FX);
    expect(tile.signal).toBe('attention');
    expect(tile.countedWarnings).toBe(1);
    // r1 (warning), r2 (supportive) and r5 (context) read Active on the
    // §9.3 table; watch/quiet/nodata stay out.
    expect(tile.activeRules).toBe(3);
    expect(tile.totalRules).toBe(7);
  });
});

/* ------------------------------------------------------------------ *
 * The D-23 chip dots — real verdicts only, never a composite
 * ------------------------------------------------------------------ */

describe('chip dots', () => {
  it('marketsChipDot mirrors the section signal (attention → raised; calm bullish → calm)', () => {
    expect(marketsChipDot(globalMarketsTile(MARKETS))).toEqual({ kind: 'attention', signal: 'attention' });
    const calm: MarketsSnapshot = {
      ...MARKETS,
      markets: [marketEntry('dax', -1.9), marketEntry('sp500', -2.5)],
      summary: { count: 2, roseToday: 2, nAttention: 0, nUnusual: 0, signal: 'normal', worstGroup: null },
    };
    expect(marketsChipDot(globalMarketsTile(calm))).toEqual({ kind: 'verdict', step: 1 });
  });

  it('fxChipDot mirrors the fx signal (attention → raised; normal → calm)', () => {
    expect(fxChipDot(globalFxTile(FX))).toEqual({ kind: 'attention', signal: 'attention' });
    const calm: FxSnapshot = { ...FX, summary: { signal: 'normal', countedWarnings: 0, headlineRule: null } };
    expect(fxChipDot(globalFxTile(calm))).toEqual({ kind: 'verdict', step: 1 });
  });

  it('an unusual markets signal maps to the unusual dot', () => {
    const unusual: MarketsSnapshot = { ...MARKETS, summary: { ...MARKETS.summary, signal: 'unusual' } };
    expect(marketsChipDot(globalMarketsTile(unusual))).toEqual({ kind: 'attention', signal: 'unusual' });
  });
});
