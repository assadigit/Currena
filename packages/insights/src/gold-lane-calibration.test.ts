/**
 * gold-lane-calibration.test.ts — the P0 lane-calibration contract tests
 * (docs/specs/gold-balance-consolidation/02-ENGINE-AND-DECISION-TABLE.md §6
 * + 04-MIGRATION-AND-ACCEPTANCE.md §4.4).
 *
 *   - the LANE TABLES: HARNESS_GOLD_LANES_MIN2 / _MIN1 pair the FROZEN
 *     21-seat lineage snapshot (HARNESS_GOLD_VOTERS_21 — the production
 *     table until GF-P1, 2026-11-05, demoted it to 19) with their crowd
 *     minimum (2 / 1) — additive beside HARNESS_GOLD_VOTERS_21 / _20,
 *     which stay verbatim (D-GB-9's lineage discipline, restated at
 *     GF-P1);
 *   - the LANE ENGINE (laneBalanceOverVoters): 02 §3's lane-vote rules —
 *     the crowd minimum, strict majority, the split tie, unread vs neutral
 *     (problem P5), the stale-voter immutability, the polarity pins, the
 *     tilt's level-only leg, the D-GB-8 beam-angle arithmetic;
 *   - the CALIBRATION STATISTICS (medianFlipsPer60, laneCalibrationStats):
 *     the flip counting and the pre-registered C1 / C2 verdicts, including
 *     their exact boundaries (70% / 60%, "not higher than");
 *   - the FROZEN-TABLES REGRESSION PIN: gfScoreOverVoters (the
 *     threshold-map-parameterized copy) over a fixed synthetic battery
 *     must stay BYTE-IDENTICAL under the FROZEN map — the lineage JSONs
 *     (the GB-S1/pre-GF-P1 era) cannot change — while the PRODUCTION
 *     engines (GF-P1's 19-seat table + the executed five thresholds) get
 *     their own equivalence pin (04 §4.4's discipline, restated at GF-P1).
 *
 * Synthetic data only — no fixtures, no live sites (AGENTS.md rule 7).
 */

import { describe, expect, it } from 'vitest';

import type { IndicatorId, IndicatorReading } from '@currena/core';

import { GOLD_LANE_VOTERS, goldTailwindScore } from './gold-score';
import {
  HARNESS_GOLD_LANES_MIN1,
  HARNESS_GOLD_LANES_MIN2,
  HARNESS_GOLD_VOTERS_20,
  HARNESS_GOLD_VOTERS_21,
  LANE_CALIB_FLIP_WINDOW,
  LANE_CALIB_FULLTIP_MAX_SHARE,
  LANE_CALIB_LEVEL_MAX_SHARE,
  laneBalanceOverVoters,
  laneCalibrationStats,
  medianFlipsPer60,
  scoreOverVoters,
  type GoldLaneSide,
  type HarnessLaneBalance,
} from './gold-backtest-core';
import { GF_MOVE_FROZEN_BASE, GF_MOVE_P1_PROPOSED, gfMoveMapWith, gfScoreOverVoters } from './gf-p0-proposed';

const NOW = '2026-11-03T04:10:00.000Z';
const DAY = '2026-11-02';

function reading(id: IndicatorId, extra: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id,
    value: 1,
    asOf: DAY,
    status: 'normal',
    sourceName: 't',
    updatedAt: NOW,
    ...extra,
  };
}

const HIGH: Partial<IndicatorReading> = { percentile10y: 0.95 };
const LOW: Partial<IndicatorReading> = { percentile10y: 0.05 };
const RISING: Partial<IndicatorReading> = { change30d: 0.3 };
const FALLING: Partial<IndicatorReading> = { change30d: -0.3 };
const STEADY: Partial<IndicatorReading> = { percentile10y: 0.5, change30d: 0.02 };

/* ------------------------------------------------------------------ *
 * The lane tables (02 §6): additive, beside the frozen ones
 * ------------------------------------------------------------------ */

describe('the lane tables — MIN2 / MIN1 beside the frozen voter tables', () => {
  it('MIN2 is the frozen 21-seat lineage snapshot with the D-GB-3 crowd minimum of 2', () => {
    // GF-P1 (2026-11-05, the owner's recorded decision H) demoted
    // production to 19 seats; the lineage configuration keeps measuring
    // the frozen 21 the GB-S1 calibration and BACKTEST-GOLD-LANES.md
    // recorded (the post-P1 production set's recalibration is the GF
    // program's own evidence: gf-p1-verify).
    expect(HARNESS_GOLD_LANES_MIN2.voters).toBe(HARNESS_GOLD_VOTERS_21);
    expect(HARNESS_GOLD_LANES_MIN2.minFiring).toBe(2);
  });
  it('MIN1 is the SAME table with the pre-registered fallback minimum of 1', () => {
    expect(HARNESS_GOLD_LANES_MIN1.voters).toBe(HARNESS_GOLD_VOTERS_21);
    expect(HARNESS_GOLD_LANES_MIN1.minFiring).toBe(1);
  });
  it('the lineage snapshots keep their recorded shapes (21 · 8/3/5/5 · 20); production is GF-P2\'s 32 · 6/5/10/9/2 (the measured POST-P2-5LANE composition)', () => {
    const counts21: Record<string, number> = {};
    for (const v of HARNESS_GOLD_VOTERS_21) counts21[v.lane] = (counts21[v.lane] ?? 0) + 1;
    expect(counts21).toEqual({ 'borrowing-costs': 8, dollar: 3, stress: 5, inflation: 5 });
    expect(HARNESS_GOLD_VOTERS_21).toHaveLength(21);
    expect(HARNESS_GOLD_VOTERS_20).toHaveLength(20);
    // GF-P2 (the owner's recorded answers B/C/K, 2026-11-05): the production
    // table is the measured POST-P2-5LANE composition — 32 seats over five
    // lanes (evidence/gf-p0-calibration-2026-11-05.md §7).
    const countsProd: Record<string, number> = {};
    for (const v of GOLD_LANE_VOTERS) countsProd[v.lane] = (countsProd[v.lane] ?? 0) + 1;
    expect(GOLD_LANE_VOTERS).toHaveLength(32);
    expect(countsProd).toEqual({ 'borrowing-costs': 6, dollar: 5, stress: 10, inflation: 9, flows: 2 });
  });
});

/* ------------------------------------------------------------------ *
 * The lane engine (02 §3)
 * ------------------------------------------------------------------ */

describe('laneBalanceOverVoters — the lane-vote rules', () => {
  it('one firing voter gives neutral (split = false) under MIN2 — and tips the lane under MIN1', () => {
    const readings = [reading('usdjpy', HIGH)]; // a single dollar-lane pressure
    const min2 = laneBalanceOverVoters(readings, GOLD_LANE_VOTERS, 2);
    const dollar = min2.lanes.find((l) => l.lane === 'dollar')!;
    expect(dollar.side).toBe('neutral');
    expect(dollar.split).toBe(false);
    expect(dollar.firing).toBe(1);
    expect(dollar.readable).toBe(1);
    const min1 = laneBalanceOverVoters(readings, GOLD_LANE_VOTERS, 1);
    expect(min1.lanes.find((l) => l.lane === 'dollar')!.side).toBe('against');
    expect(min1.net).toBe(-1);
    expect(min1.state).toBe('tipped-against');
    expect(min2.net).toBe(0);
    expect(min2.state).toBe('level');
  });

  it('two firing voters on the same side vote the lane (MIN2); both sides give the split tie', () => {
    const both = laneBalanceOverVoters([reading('usdjpy', HIGH), reading('dollar-basket', HIGH)], GOLD_LANE_VOTERS, 2);
    expect(both.lanes.find((l) => l.lane === 'dollar')!.side).toBe('against');
    expect(both.net).toBe(-1);
    expect(both.state).toBe('tipped-against');
    const split = laneBalanceOverVoters([reading('usdjpy', HIGH), reading('dollar-basket', LOW)], GOLD_LANE_VOTERS, 2);
    const dollar = split.lanes.find((l) => l.lane === 'dollar')!;
    expect(dollar.side).toBe('neutral');
    expect(dollar.split).toBe(true);
    expect(dollar.supports).toBe(1);
    expect(dollar.pressures).toBe(1);
    expect(split.state).toBe('level');
  });

  it('3 supports vs 1 pressure votes FOR the lane (strict majority of the firing voters)', () => {
    const b = laneBalanceOverVoters(
      [reading('us-cpi-yoy', HIGH), reading('us-pce-core-yoy', HIGH), reading('euro-hicp', HIGH), reading('breakeven-5y5y', LOW)],
      GOLD_LANE_VOTERS,
      2,
    );
    const inflation = b.lanes.find((l) => l.lane === 'inflation')!;
    expect(inflation.side).toBe('for');
    expect(inflation.supports).toBe(3);
    expect(inflation.pressures).toBe(1);
    expect(b.net).toBe(1);
    expect(b.state).toBe('tipped-for');
  });

  it('a lane of all-stale voters is unread; all five lanes unread reads "none" (never a guess)', () => {
    const b = laneBalanceOverVoters(
      GOLD_LANE_VOTERS.map((v) => reading(v.id as IndicatorId, { status: 'stale' })),
      GOLD_LANE_VOTERS,
      2,
    );
    for (const l of b.lanes) expect(l.side).toBe('unread');
    expect(b.state).toBe('none');
    // GF-P2 (B/C/K): five lanes.
    expect(b.counts).toEqual({ for: 0, against: 0, neutral: 0, unread: 5 });
    expect(b.net).toBe(0);
    expect(b.readable).toBe(0);
  });

  it('readable-but-steady voters read neutral, NOT unread (problem P5 — the two states never merge)', () => {
    const b = laneBalanceOverVoters(
      GOLD_LANE_VOTERS.map((v) => reading(v.id as IndicatorId, STEADY)),
      GOLD_LANE_VOTERS,
      2,
    );
    for (const l of b.lanes) {
      expect(l.side).toBe('neutral');
      expect(l.split).toBe(false);
      expect(l.readable).toBeGreaterThan(0);
    }
    expect(b.state).toBe('level');
    // GF-P2 (B/C/K): five lanes, all readable-steady → five neutrals.
    expect(b.counts).toEqual({ for: 0, against: 0, neutral: 5, unread: 0 });
    expect(b.readable).toBe(5);
  });

  it('adding a stale (or missing) voter to a lane never changes its side', () => {
    const base = [reading('usdjpy', HIGH), reading('dollar-basket', HIGH)];
    const withStale = [...base, reading('us-japan-10y-gap', { status: 'stale', ...HIGH })];
    expect(laneBalanceOverVoters(withStale, GOLD_LANE_VOTERS, 2)).toEqual(laneBalanceOverVoters(base, GOLD_LANE_VOTERS, 2));
    // and under MIN1 too
    expect(laneBalanceOverVoters(withStale, GOLD_LANE_VOTERS, 1)).toEqual(laneBalanceOverVoters(base, GOLD_LANE_VOTERS, 1));
  });

  it('polarity pins (02 §4): falling real-yield-10y SUPPORTS; high us30y PRESSURES; a high (firing) vix SUPPORTS; high cftc-gold-positioning + cftc-gold-gross-long PRESSURE (the flows pair)', () => {
    // vix carries no 30-day move threshold in the shared evaluator
    // (SIGNAL_LEG_MOVE has no vix entry — its rule is percentile/level), so
    // its firing path here is the LEVEL leg: percentile10y high → lean +1.
    // GF-P2 (B, D-14 + K): the cftc pair fires in the FLOWS lane now — the
    // stress lane holds vix alone.
    const b = laneBalanceOverVoters(
      [reading('real-yield-10y', FALLING), reading('us30y', HIGH), reading('vix', HIGH), reading('cftc-gold-positioning', HIGH), reading('cftc-gold-gross-long', HIGH)],
      GOLD_LANE_VOTERS,
      1,
    );
    const borrowing = b.lanes.find((l) => l.lane === 'borrowing-costs')!;
    expect(borrowing.supports).toBe(1); // falling real yield supports gold
    expect(borrowing.pressures).toBe(1); // high 30y pressures
    const stress = b.lanes.find((l) => l.lane === 'stress')!;
    expect(stress.supports).toBe(1); // elevated fear supports
    expect(stress.pressures).toBe(0); // cftc left for flows (B, D-14)
    const flows = b.lanes.find((l) => l.lane === 'flows')!;
    expect(flows.supports).toBe(0);
    expect(flows.pressures).toBe(2); // the crowded pair pressures (F2's real object included)
    expect(borrowing.side).toBe('neutral'); // 1 v 1 — the split tie under MIN1's majority
    expect(borrowing.split).toBe(true);
    expect(stress.side).toBe('for');
    expect(flows.side).toBe('against');
  });

  it('breakeven-tilt fires on the LEVEL leg only (the D-5 promotion shape): high → supports, mid → steady', () => {
    const high = laneBalanceOverVoters([reading('us-cpi-yoy', HIGH), reading('breakeven-tilt', HIGH)], GOLD_LANE_VOTERS, 2);
    expect(high.lanes.find((l) => l.lane === 'inflation')!.supports).toBe(2);
    const mid = laneBalanceOverVoters([reading('us-cpi-yoy', HIGH), reading('breakeven-tilt', STEADY)], GOLD_LANE_VOTERS, 2);
    const inflation = mid.lanes.find((l) => l.lane === 'inflation')!;
    expect(inflation.supports).toBe(1);
    expect(inflation.firing).toBe(1);
    expect(inflation.side).toBe('neutral'); // under MIN2 one firing voter is not a vote
  });

  it('order-independent and never throws on missing/empty readings', () => {
    const readings = GOLD_LANE_VOTERS.map((v, i) =>
      reading(v.id as IndicatorId, i % 3 === 0 ? HIGH : i % 3 === 1 ? LOW : STEADY),
    );
    const shuffled = [...readings].reverse();
    expect(laneBalanceOverVoters(shuffled, GOLD_LANE_VOTERS, 2)).toEqual(laneBalanceOverVoters(readings, GOLD_LANE_VOTERS, 2));
    expect(() => laneBalanceOverVoters([], GOLD_LANE_VOTERS, 2)).not.toThrow();
    const empty = laneBalanceOverVoters([], GOLD_LANE_VOTERS, 2);
    expect(empty.state).toBe('none');
    expect(empty.beamAngle).toBe(0);
  });
});

describe('laneBalanceOverVoters — the beam angle (D-GB-8, unchanged formula)', () => {
  /** Steady readings for every voter of the lanes not under test, so they read neutral (readable, nothing firing). */
  const steadyFor = (...lanes: string[]): IndicatorReading[] =>
    GOLD_LANE_VOTERS.filter((v) => lanes.includes(v.lane)).map((v) => reading(v.id as IndicatorId, STEADY));

  it('one lane for, the rest neutral or unread: net 1, d 1 → 10° — fully tipped', () => {
    const one = laneBalanceOverVoters(
      [reading('us-cpi-yoy', HIGH), reading('us-pce-core-yoy', HIGH), ...steadyFor('borrowing-costs', 'dollar', 'stress')],
      GOLD_LANE_VOTERS,
      2,
    );
    // GF-P2 (B/C/K): the flows lane's voters are absent here → unread.
    expect(one.counts).toEqual({ for: 1, against: 0, neutral: 3, unread: 1 });
    expect(one.net).toBe(1);
    expect(one.beamAngle).toBeCloseTo(10, 10);
    expect(one.fullyTipped).toBe(true);
    expect(one.state).toBe('tipped-for');
  });
  it('a 1-for/1-against balance is level: net 0, angle 0', () => {
    const b = laneBalanceOverVoters(
      [
        reading('us-cpi-yoy', HIGH), reading('us-pce-core-yoy', HIGH), // inflation FOR
        reading('us10y', HIGH), reading('us30y', HIGH), // borrowing-costs AGAINST
        ...steadyFor('dollar', 'stress'),
      ],
      GOLD_LANE_VOTERS,
      2,
    );
    expect(b.counts).toEqual({ for: 1, against: 1, neutral: 2, unread: 1 }); // GF-P2 (B/C/K): the flows lane's voters absent → unread
    expect(b.net).toBe(0);
    expect(b.state).toBe('level');
    expect(b.beamAngle).toBe(0);
    expect(b.fullyTipped).toBe(false);
  });
  it('the parity fact the calibration band structure rides on: with 5 lanes the reachable angles include 0, 10/4, 10/3, 5 and 10 degrees', () => {
    // net and d share parity, so |net|/d ∈ {1, 1/2, 1/3, 1/4} × 10 plus the level 0.
    // 2 lanes for + 1 against + 1 neutral + 1 unread: net 1, d 3 → 10/3° — not fully tipped.
    const threeToOne = laneBalanceOverVoters(
      [
        reading('us-cpi-yoy', HIGH), reading('us-pce-core-yoy', HIGH), reading('euro-hicp', HIGH), // inflation FOR
        reading('vix', HIGH), reading('nfci', HIGH), // stress FOR
        reading('usdjpy', HIGH), reading('dollar-basket', HIGH), // dollar AGAINST
        ...steadyFor('borrowing-costs'),
      ],
      GOLD_LANE_VOTERS,
      2,
    );
    expect(threeToOne.counts).toEqual({ for: 2, against: 1, neutral: 1, unread: 1 });
    expect(threeToOne.net).toBe(1);
    expect(threeToOne.beamAngle).toBeCloseTo(10 / 3, 10);
    expect(threeToOne.fullyTipped).toBe(false);
    // 2 for + 2 against: net 0 — level again (the parity floor).
    const twoTwo = laneBalanceOverVoters(
      [
        reading('us-cpi-yoy', HIGH), reading('us-pce-core-yoy', HIGH), // inflation FOR
        reading('vix', HIGH), reading('nfci', HIGH), // stress FOR
        reading('usdjpy', HIGH), reading('dollar-basket', HIGH), // dollar AGAINST
        reading('us10y', HIGH), reading('us30y', HIGH), // borrowing-costs AGAINST
      ],
      GOLD_LANE_VOTERS,
      2,
    );
    expect(twoTwo.counts).toEqual({ for: 2, against: 2, neutral: 0, unread: 1 });
    expect(twoTwo.net).toBe(0);
    expect(twoTwo.beamAngle).toBe(0);
  });
});

/* ------------------------------------------------------------------ *
 * The calibration statistics (02 §6 — C1 and C2)
 * ------------------------------------------------------------------ */

/** A hand-built balance over the four lane sides (GOLD_LANES order), consistent by construction. */
function mkBalance(sides: readonly [GoldLaneSide, GoldLaneSide, GoldLaneSide, GoldLaneSide]): HarnessLaneBalance {
  const lanes = sides.map((side, i) => ({
    lane: (['borrowing-costs', 'dollar', 'stress', 'inflation'] as const)[i]!,
    side,
    split: false,
    readable: side === 'unread' ? 0 : 2,
    firing: side === 'for' || side === 'against' ? 2 : 0,
    supports: side === 'for' ? 2 : 0,
    pressures: side === 'against' ? 2 : 0,
  }));
  const counts = {
    for: sides.filter((s) => s === 'for').length,
    against: sides.filter((s) => s === 'against').length,
    neutral: sides.filter((s) => s === 'neutral').length,
    unread: sides.filter((s) => s === 'unread').length,
  };
  const net = counts.for - counts.against;
  const tipped = counts.for + counts.against;
  const beamAngle = net === 0 || tipped === 0 ? 0 : Math.min(10, Math.max(3, (Math.abs(net) / tipped) * 10));
  return {
    lanes,
    counts,
    net,
    readable: counts.for + counts.against + counts.neutral,
    state: counts.unread === 4 ? 'none' : net > 0 ? 'tipped-for' : net < 0 ? 'tipped-against' : 'level',
    beamAngle,
    fullyTipped: net !== 0 && Math.abs(net) === tipped,
  };
}

const LEVEL = mkBalance(['neutral', 'neutral', 'neutral', 'neutral']);
const FOR_FULL = mkBalance(['for', 'neutral', 'neutral', 'neutral']);
const AGAINST_FULL = mkBalance(['against', 'neutral', 'neutral', 'neutral']);
const NONE = mkBalance(['unread', 'unread', 'unread', 'unread']);

describe('medianFlipsPer60 — the stability statistic', () => {
  it('a constant sequence never flips (median 0)', () => {
    expect(medianFlipsPer60(Array<string>(200).fill('level'))).toBe(0);
  });
  it('a perfectly alternating sequence flips 59 times inside EVERY 60-entry window', () => {
    const alt: string[] = [];
    for (let i = 0; i < 200; i++) alt.push(i % 2 === 0 ? 'level' : 'tipped-for');
    expect(medianFlipsPer60(alt)).toBe(59);
  });
  it('null when the sequence is shorter than the window (n stated, never guessed)', () => {
    expect(medianFlipsPer60(Array<string>(59).fill('level'))).toBeNull();
    expect(LANE_CALIB_FLIP_WINDOW).toBe(60);
  });
  it('an exactly-60 sequence has one window: its interior flips', () => {
    expect(medianFlipsPer60([...Array<string>(30).fill('level'), ...Array<string>(30).fill('tipped-for')])).toBe(1);
  });
  it('the median across sliding windows (a single early cluster vs a constant tail)', () => {
    const seq = [...Array<string>(10).fill('tipped-for'), ...Array<string>(190).fill('level')];
    // windows containing the boundary have 1 flip; the rest 0 → the median is 0.
    expect(medianFlipsPer60(seq)).toBe(0);
  });
});

describe('laneCalibrationStats — the pre-registered C1 / C2', () => {
  it('counts the state distribution, the beam bands, the per-lane unread/split, and the none-within-level convention', () => {
    const s = laneCalibrationStats([LEVEL, FOR_FULL, AGAINST_FULL, NONE], [0, 1, -1, 0]);
    expect(s.n).toBe(4);
    expect(s.level).toBe(2); // LEVEL + NONE
    expect(s.none).toBe(1);
    expect(s.tippedFor).toBe(1);
    expect(s.tippedAgainst).toBe(1);
    expect(s.beam).toEqual({ level: 2, mid: 0, full: 2 });
    expect(s.fullyTipped).toBe(2);
    // GF-P2 (B/C/K): the flows key exists and stays 0 over four-lane
    // synthetic balances (the real five-lane stats carry it measured).
    expect(s.laneUnread).toEqual({ 'borrowing-costs': 1, dollar: 1, stress: 1, inflation: 1, flows: 0 });
  });
  it('C1 holds at the exact boundaries (level ≤ 70%, full-tip ≤ 60%) and fails beyond them', () => {
    // 10 windows: 7 level (70%), 3 full tips (30%) — exactly at the ceiling → PASS
    const atEdge = laneCalibrationStats(
      [LEVEL, LEVEL, LEVEL, LEVEL, LEVEL, LEVEL, LEVEL, FOR_FULL, FOR_FULL, FOR_FULL],
      Array<number>(10).fill(0),
    );
    expect(atEdge.c1).toBe(true);
    expect(LANE_CALIB_LEVEL_MAX_SHARE).toBe(0.7);
    // 8 level (80%) → FAIL
    const overLevel = laneCalibrationStats(
      [LEVEL, LEVEL, LEVEL, LEVEL, LEVEL, LEVEL, LEVEL, LEVEL, FOR_FULL, FOR_FULL],
      Array<number>(10).fill(0),
    );
    expect(overLevel.c1).toBe(false);
    // 6 full tips of 10 (60%) — exactly at the ceiling → PASS (4 level)
    const atTipEdge = laneCalibrationStats(
      [LEVEL, LEVEL, LEVEL, LEVEL, FOR_FULL, FOR_FULL, FOR_FULL, FOR_FULL, FOR_FULL, FOR_FULL],
      Array<number>(10).fill(0),
    );
    expect(atTipEdge.c1).toBe(true);
    expect(LANE_CALIB_FULLTIP_MAX_SHARE).toBe(0.6);
    // 7 full tips (70%) → FAIL
    const overTip = laneCalibrationStats(
      [LEVEL, LEVEL, LEVEL, FOR_FULL, FOR_FULL, FOR_FULL, FOR_FULL, FOR_FULL, FOR_FULL, FOR_FULL],
      Array<number>(10).fill(0),
    );
    expect(overTip.c1).toBe(false);
  });
  it('C2 passes when the lane flips median is NOT higher than the 21-voter net-sign figure (equal passes)', () => {
    const balances = [...Array<HarnessLaneBalance>(100).fill(LEVEL)];
    const calm = laneCalibrationStats(balances, Array<number>(100).fill(1)); // 0 vs 0
    expect(calm.flipsMedianPer60).toBe(0);
    expect(calm.netSignFlipsMedianPer60).toBe(0);
    expect(calm.c2).toBe(true);
    const noisierNetSign = laneCalibrationStats(balances, Array.from({ length: 100 }, (_, i) => (i % 2 === 0 ? 1 : -1)));
    expect(noisierNetSign.netSignFlipsMedianPer60).toBe(59);
    expect(noisierNetSign.c2).toBe(true); // 0 ≤ 59
  });
  it('C2 fails when the lane verdict flips MORE than the net sign', () => {
    const flipStates = Array.from({ length: 100 }, (_, i) =>
      i % 2 === 0 ? (LEVEL as HarnessLaneBalance) : (FOR_FULL as HarnessLaneBalance),
    );
    const s = laneCalibrationStats(flipStates, Array<number>(100).fill(1));
    expect(s.flipsMedianPer60).toBe(59);
    expect(s.netSignFlipsMedianPer60).toBe(0);
    expect(s.c2).toBe(false);
  });
  it('C2 fails (not "unknown") when the sequence is shorter than the flip window', () => {
    const s = laneCalibrationStats([LEVEL, FOR_FULL], [0, 1]);
    expect(s.flipsMedianPer60).toBeNull();
    expect(s.c2).toBe(false);
  });
  it('an empty window set fails both criteria (never vacuously passes)', () => {
    const s = laneCalibrationStats([], []);
    expect(s.n).toBe(0);
    expect(s.c1).toBe(false);
    expect(s.c2).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * The frozen-tables regression pin (04 §4.4, restated at GF-P1) — the
 * LINEAGE JSONs cannot change. The pinned JSONs were produced by REAL
 * runs (never hand-written) over the fixed battery below, under the
 * FROZEN map (the pre-GF-P1 evaluator): the 21-seat lineage snapshot
 * and the S4-FROZEN 20 reproduce them byte-for-byte through
 * gfScoreOverVoters (the threshold-map-parameterized copy). The
 * PRODUCTION engines (GF-P1's 19-seat table + the executed five
 * thresholds) get their own equivalence pin below — the copy and the
 * engine cannot drift on the production configuration either.
 * ------------------------------------------------------------------ */

describe('the frozen tables stay byte-identical (the lineage regression pin)', () => {
  const battery: readonly IndicatorReading[] = HARNESS_GOLD_VOTERS_21.map((v, i) =>
    reading(
      v.id as IndicatorId,
      i % 4 === 0 ? { ...HIGH, ...FALLING } : i % 4 === 1 ? { ...LOW, ...RISING } : i % 4 === 2 ? HIGH : STEADY,
    ),
  );
  const battery20 = battery.filter((r) => (r.id as string) !== 'breakeven-tilt');

  it('the 21-seat lineage snapshot over the fixed battery, under the FROZEN map, is byte-identical', () => {
    expect(JSON.stringify(gfScoreOverVoters(battery, HARNESS_GOLD_VOTERS_21, GF_MOVE_FROZEN_BASE))).toBe(
      '{"netScore":0,"label":"balanced","firingVoters":16,"tailwindVoters":8,"headwindVoters":8,"laneCounts":{"tailwind":0,"headwind":0,"mixed":4},"subGauges":[{"lane":"borrowing-costs","reading":"mixed","tailwindVoters":2,"headwindVoters":4},{"lane":"dollar","reading":"mixed","tailwindVoters":1,"headwindVoters":2},{"lane":"stress","reading":"mixed","tailwindVoters":2,"headwindVoters":1},{"lane":"inflation","reading":"mixed","tailwindVoters":3,"headwindVoters":1}],"voters":[{"id":"real-yield-10y","lane":"borrowing-costs","impact":"tailwind","evidence":"falling"},{"id":"us10y","lane":"borrowing-costs","impact":"headwind","evidence":"rising"},{"id":"us30y","lane":"borrowing-costs","impact":"headwind","evidence":"high"},{"id":"fed-expectations","lane":"borrowing-costs","impact":"headwind","evidence":"high"},{"id":"ecb-dfr","lane":"borrowing-costs","impact":"tailwind","evidence":"low"},{"id":"yield-curve-10y2y","lane":"borrowing-costs","impact":"headwind","evidence":"high"},{"id":"dollar-basket","lane":"dollar","impact":"headwind","evidence":"high"},{"id":"usdjpy","lane":"dollar","impact":"tailwind","evidence":"low"},{"id":"us-japan-10y-gap","lane":"dollar","impact":"headwind","evidence":"high"},{"id":"nfci","lane":"stress","impact":"tailwind","evidence":"high"},{"id":"vix","lane":"stress","impact":"headwind","evidence":"low"},{"id":"gold-silver","lane":"stress","impact":"tailwind","evidence":"high"},{"id":"us-cpi-yoy","lane":"inflation","impact":"tailwind","evidence":"high"},{"id":"us-pce-core-yoy","lane":"inflation","impact":"headwind","evidence":"low"},{"id":"euro-hicp","lane":"inflation","impact":"tailwind","evidence":"high"},{"id":"breakeven-tilt","lane":"inflation","impact":"tailwind","evidence":"high"}]}',
    );
  });
  it('the S4-FROZEN 20-voter table over the same battery minus the tilt, under the FROZEN map, is byte-identical', () => {
    expect(JSON.stringify(gfScoreOverVoters(battery20, HARNESS_GOLD_VOTERS_20, GF_MOVE_FROZEN_BASE))).toBe(
      '{"netScore":-1,"label":"headwind","firingVoters":15,"tailwindVoters":7,"headwindVoters":8,"laneCounts":{"tailwind":0,"headwind":0,"mixed":4},"subGauges":[{"lane":"borrowing-costs","reading":"mixed","tailwindVoters":2,"headwindVoters":4},{"lane":"dollar","reading":"mixed","tailwindVoters":1,"headwindVoters":2},{"lane":"stress","reading":"mixed","tailwindVoters":2,"headwindVoters":1},{"lane":"inflation","reading":"mixed","tailwindVoters":2,"headwindVoters":1}],"voters":[{"id":"real-yield-10y","lane":"borrowing-costs","impact":"tailwind","evidence":"falling"},{"id":"us10y","lane":"borrowing-costs","impact":"headwind","evidence":"rising"},{"id":"us30y","lane":"borrowing-costs","impact":"headwind","evidence":"high"},{"id":"fed-expectations","lane":"borrowing-costs","impact":"headwind","evidence":"high"},{"id":"ecb-dfr","lane":"borrowing-costs","impact":"tailwind","evidence":"low"},{"id":"yield-curve-10y2y","lane":"borrowing-costs","impact":"headwind","evidence":"high"},{"id":"dollar-basket","lane":"dollar","impact":"headwind","evidence":"high"},{"id":"usdjpy","lane":"dollar","impact":"tailwind","evidence":"low"},{"id":"us-japan-10y-gap","lane":"dollar","impact":"headwind","evidence":"high"},{"id":"nfci","lane":"stress","impact":"tailwind","evidence":"high"},{"id":"vix","lane":"stress","impact":"headwind","evidence":"low"},{"id":"gold-silver","lane":"stress","impact":"tailwind","evidence":"high"},{"id":"us-cpi-yoy","lane":"inflation","impact":"tailwind","evidence":"high"},{"id":"us-pce-core-yoy","lane":"inflation","impact":"headwind","evidence":"low"},{"id":"euro-hicp","lane":"inflation","impact":"tailwind","evidence":"high"}]}',
    );
  });
  it('the harness copy on the PRODUCTION configuration (GF-P1: the 19-seat table + the executed five thresholds) equals the production engine — the standing pin', () => {
    // The copy ≡ the engine on the shipped configuration: gfScoreOverVoters
    // with gfMoveMapWith(GF_MOVE_P1_PROPOSED) must deep-equal the
    // production scoreOverVoters (which reads the production
    // SIGNAL_LEG_MOVE) over the production table.
    expect(gfScoreOverVoters(battery, GOLD_LANE_VOTERS, gfMoveMapWith(GF_MOVE_P1_PROPOSED))).toEqual(
      scoreOverVoters(battery, GOLD_LANE_VOTERS),
    );
    expect(scoreOverVoters(battery, GOLD_LANE_VOTERS)).toEqual(goldTailwindScore(battery));
  });
});
