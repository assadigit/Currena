/**
 * gf-p0-proposed.test.ts — the GF-P0 proposed-voter harness contract tests
 * (docs/specs/gold-meter-gapfill/01-FILL-SPEC.md — GF-P0; the GB-S1
 * precedent: gold-lane-calibration.test.ts).
 *
 *   - the FROZEN-CONFIGURATION EQUIVALENCE PINS: the parameterized copies
 *     (`gfEvalLeg`, `gfLaneBalance`, `gfNetScore`, `gfCalibrationStats`)
 *     must produce IDENTICAL output to the frozen evaluators
 *     (`connections.ts evalLeg`, `gold-backtest-core.ts
 *     laneBalanceOverVoters` / `scoreOverVoters` / `laneCalibrationStats`)
 *     on the frozen configuration — the copies cannot drift from the
 *     engines (the scoreOverVoters discipline; GF-P0 adds no product
 *     code, D-GF-1);
 *   - the PROPOSED TABLES' SHAPE: the frozen-21 subset verbatim, the
 *     composition counts, the flows lane only in the 5-lane table, no
 *     duplicate seats, every polarity ±1;
 *   - the PARAMETERIZED BEHAVIOURS the calibration relies on: the
 *     threshold override, the D-18 input-presence rule, the 5-lane beam
 *     arithmetic (the D-GB-8 formula, lane-count-agnostic), the
 *     min-firing rule over a 2-seat lane.
 *
 * Synthetic data only — no fixtures, no live sites (AGENTS.md rule 7).
 */

import { describe, expect, it } from 'vitest';

import type { IndicatorId, IndicatorReading } from '@currena/core';

import { evalLeg } from './connections';
import { GOLD_LANE_VOTERS, GOLD_LANES, goldTailwindScore } from './gold-score';
import {
  laneBalanceOverVoters,
  laneCalibrationStats,
  scoreOverVoters,
} from './gold-backtest-core';
import {
  GF_F2_PROXY_ID,
  GF_LANES_5,
  GF_MOVE_FROZEN_BASE,
  GF_MOVE_P1_PROPOSED,
  GF_VOTERS_5LANE,
  GF_VOTERS_P2_4LANE,
  gfCalibrationStats,
  gfEvalLeg,
  gfLaneBalance,
  gfNetScore,
  gfScenarios,
  type GfVoter,
} from './gf-p0-proposed';

const NOW = '2026-11-03T04:10:00.000Z';
const DAY = '2026-11-02';

function reading(id: string, extra: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id: id as IndicatorId,
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
/** A readable-but-inputless seat (neither a finite change30d nor a percentile10y). */
const INPUTLESS: Partial<IndicatorReading> = { value: 46.99, change30d: undefined, percentile10y: undefined };

/** A deterministic synthetic battery: every frozen voter in several states. */
function battery(): IndicatorReading[] {
  const states = [HIGH, LOW, RISING, FALLING, STEADY, INPUTLESS];
  return GOLD_LANE_VOTERS.map((v, i) => reading(v.id, states[i % states.length]));
}

/* ------------------------------------------------------------------ *
 * The frozen-configuration equivalence pins (the drift gates)
 * ------------------------------------------------------------------ */

describe('the frozen-configuration equivalence pins — the copies cannot drift from the engines', () => {
  it('GF_MOVE_FROZEN_BASE carries exactly the four frozen gold-lane thresholds, verbatim', () => {
    expect(GF_MOVE_FROZEN_BASE).toEqual({
      'real-yield-10y': 0.1,
      'dollar-basket': 1.0,
      'breakeven-5y5y': 0.1,
      us10y: 0.15,
    });
  });

  it('gfEvalLeg on the frozen map === evalLeg on every gold-lane seat × state', () => {
    for (const v of GOLD_LANE_VOTERS) {
      for (const extra of [HIGH, LOW, RISING, FALLING, STEADY, INPUTLESS]) {
        const r = reading(v.id, extra);
        expect(gfEvalLeg(v.id, r, GF_MOVE_FROZEN_BASE)).toEqual(evalLeg(v.id, r));
      }
    }
  });

  it('gfLaneBalance on the frozen configuration === laneBalanceOverVoters (MIN2 and MIN1)', () => {
    const readings = battery();
    for (const minFiring of [2, 1]) {
      const frozen = laneBalanceOverVoters(readings, GOLD_LANE_VOTERS, minFiring);
      const copy = gfLaneBalance(readings, GOLD_LANE_VOTERS, GOLD_LANES, minFiring, GF_MOVE_FROZEN_BASE, false);
      // The harness-local copy's lane votes carry the same fields; compare
      // the full JSON shape (the frozen engine's own lane ids are the four).
      expect(JSON.parse(JSON.stringify(copy))).toEqual(JSON.parse(JSON.stringify(frozen)));
    }
  });

  it('gfNetScore on the frozen configuration === scoreOverVoters(...).netScore === goldTailwindScore(...).netScore', () => {
    const readings = battery();
    expect(gfNetScore(readings, GOLD_LANE_VOTERS, GF_MOVE_FROZEN_BASE)).toBe(
      scoreOverVoters(readings, GOLD_LANE_VOTERS).netScore,
    );
    expect(gfNetScore(readings, GOLD_LANE_VOTERS, GF_MOVE_FROZEN_BASE)).toBe(
      goldTailwindScore(readings).netScore,
    );
  });

  it('gfCalibrationStats on four-lane balances === laneCalibrationStats', () => {
    const balances = [0, 1, 2, 3, 4, 5].map((i) => {
      const readings = battery().map((r, j) => (j % 3 === 0 ? { ...r, ...[HIGH, LOW, STEADY][i % 3]! } : r));
      return gfLaneBalance(readings, GOLD_LANE_VOTERS, GOLD_LANES, 2, GF_MOVE_FROZEN_BASE, false);
    });
    const netScores = balances.map((b) => b.net);
    const fromCopy = gfCalibrationStats(balances, netScores, GOLD_LANES);
    // The frozen stats fn's parameter type is typed to the frozen four-lane
    // shape; the JSON shape is identical (the copy's lane ids are strings).
    const fromFrozen = laneCalibrationStats(
      JSON.parse(JSON.stringify(balances)) as Parameters<typeof laneCalibrationStats>[0],
      netScores,
    );
    expect(fromCopy).toEqual(fromFrozen);
  });
});

/* ------------------------------------------------------------------ *
 * The proposed tables' shape
 * ------------------------------------------------------------------ */

describe('the proposed voter tables — the shape the calibration relies on', () => {
  it('POST-P2-4LANE holds the frozen 21 minus the two yield-curve demotions plus the promotions (31 seats, 6/5/11/9)', () => {
    const counts: Record<string, number> = {};
    for (const v of GF_VOTERS_P2_4LANE) counts[v.lane] = (counts[v.lane] ?? 0) + 1;
    expect(counts).toEqual({ 'borrowing-costs': 6, dollar: 5, stress: 11, inflation: 9 });
    expect(GF_VOTERS_P2_4LANE).toHaveLength(31);
    // The demoted pair is absent; every other frozen seat survives.
    for (const v of GOLD_LANE_VOTERS) {
      if (v.id === 'yield-curve-10y2y' || v.id === 'yield-curve-10y3m') {
        expect(GF_VOTERS_P2_4LANE.find((x) => x.id === v.id)).toBeUndefined();
      } else {
        expect(GF_VOTERS_P2_4LANE.find((x) => x.id === v.id)).toBeDefined();
      }
    }
  });

  it('POST-P2-5LANE re-seats cftc to flows and adds the F2 proxy (32 seats, the flows lane holds exactly 2)', () => {
    const counts: Record<string, number> = {};
    for (const v of GF_VOTERS_5LANE) counts[v.lane] = (counts[v.lane] ?? 0) + 1;
    expect(counts).toEqual({ 'borrowing-costs': 6, dollar: 5, stress: 10, inflation: 9, flows: 2 });
    expect(GF_VOTERS_5LANE).toHaveLength(32);
    expect(GF_LANES_5).toEqual([...GOLD_LANES, 'flows']);
    const flows = GF_VOTERS_5LANE.filter((v) => v.lane === 'flows');
    expect(flows.map((v) => v.id).sort()).toEqual(['cftc-gold-positioning', GF_F2_PROXY_ID].sort());
  });

  it('no table carries a duplicate seat; every polarity is ±1', () => {
    for (const table of [GF_VOTERS_P2_4LANE, GF_VOTERS_5LANE]) {
      expect(new Set(table.map((v) => v.id)).size).toBe(table.length);
      for (const v of table) expect(Math.abs(v.polarity)).toBe(1);
    }
  });

  it('the P1 threshold proposal only adds to the frozen four — never overrides an anchor', () => {
    for (const [id, value] of Object.entries(GF_MOVE_P1_PROPOSED)) {
      expect(GF_MOVE_FROZEN_BASE[id as IndicatorId]).toBeUndefined();
      expect(typeof value).toBe('number');
      expect(value!).toBeGreaterThan(0);
    }
  });

  it('the scenario family: 10 scenarios — 5 compositions × both crowd rules — with the frozen basis only on FROZEN', () => {
    const scenarios = gfScenarios();
    expect(scenarios).toHaveLength(10);
    for (const minFiring of [2, 1]) {
      const names = scenarios.filter((s) => s.minFiring === minFiring).map((s) => s.name.replace(/ \(MIN[12]\)$/, ''));
      expect(names).toEqual(['FROZEN', 'POST-P1', 'POST-P1-DEMOTE', 'POST-P2-4LANE', 'POST-P2-5LANE']);
    }
    for (const s of scenarios) {
      expect(s.inputPresence).toBe(!s.name.startsWith('FROZEN'));
      if (s.name.startsWith('FROZEN')) {
        expect(s.voters).toBe(GOLD_LANE_VOTERS);
        expect(s.lanes).toBe(GOLD_LANES);
        expect(s.moveMap).toBe(GF_MOVE_FROZEN_BASE);
      }
    }
  });
});

/* ------------------------------------------------------------------ *
 * The parameterized behaviours
 * ------------------------------------------------------------------ */

describe('the parameterized behaviours — thresholds, the D-18 rule, the 5-lane beam', () => {
  it('a threshold override turns a move into a lean where the frozen map reads level-only', () => {
    const r = reading('fed-expectations', { change30d: 0.2, percentile10y: 0.5 });
    expect(gfEvalLeg('fed-expectations', r, GF_MOVE_FROZEN_BASE).direction).toBeNull(); // level-only today
    const withP1 = { ...GF_MOVE_FROZEN_BASE, ...GF_MOVE_P1_PROPOSED };
    expect(gfEvalLeg('fed-expectations', r, withP1).direction).toBe('rising'); // D-2's repair
    expect(gfEvalLeg('fed-expectations', r, withP1).lean).toBe(1);
  });

  it('the D-18 input-presence rule: an inputless-but-fresh seat counts as unread, not readable-steady', () => {
    const readings = [reading('cftc-gold-positioning', INPUTLESS)];
    const voters: GfVoter[] = [{ lane: 'stress', id: 'cftc-gold-positioning', polarity: -1 }];
    // Today's rule (off): the seat is readable, its lean is 0 (neither input exists
    // to lean on) — the lane reads NEUTRAL, the fake-steady finding (D-18).
    const today = gfLaneBalance(readings, voters, ['stress'], 2, GF_MOVE_FROZEN_BASE, false);
    expect(today.lanes[0]!.readable).toBe(1);
    expect(today.lanes[0]!.side).toBe('neutral');
    // The input-presence rule (on): the seat counts as UNREAD — never a steady word.
    const withRule = gfLaneBalance(readings, voters, ['stress'], 2, GF_MOVE_FROZEN_BASE, true);
    expect(withRule.lanes[0]!.readable).toBe(0);
    expect(withRule.lanes[0]!.side).toBe('unread');
    // With a healthy co-seat the rule drops only the inputless seat's readable count.
    const pair = [reading('cftc-gold-positioning', INPUTLESS), reading('vix', HIGH)];
    const pairVoters: GfVoter[] = [
      { lane: 'stress', id: 'cftc-gold-positioning', polarity: -1 },
      { lane: 'stress', id: 'vix', polarity: 1 },
    ];
    expect(gfLaneBalance(pair, pairVoters, ['stress'], 1, GF_MOVE_FROZEN_BASE, false).lanes[0]!.readable).toBe(2);
    const ruled = gfLaneBalance(pair, pairVoters, ['stress'], 1, GF_MOVE_FROZEN_BASE, true);
    expect(ruled.lanes[0]!.readable).toBe(1); // vix only
    expect(ruled.lanes[0]!.side).toBe('for'); // vix high = supports under MIN1
  });

  it('the 5-lane beam keeps D-GB-8\'s formula: |net| / (for + against) × 10, clamped [3, 10], level at 0', () => {
    const voters: GfVoter[] = [
      { lane: 'borrowing-costs', id: 'real-yield-10y', polarity: -1 },
      { lane: 'dollar', id: 'dollar-basket', polarity: -1 },
      { lane: 'stress', id: 'vix', polarity: 1 },
      { lane: 'inflation', id: 'us-cpi-yoy', polarity: 1 },
      { lane: 'flows', id: 'cftc-gold-positioning', polarity: -1 },
    ];
    // Three lanes for (a low real yield, a low dollar, a high VIX — all supports),
    // two steady → for 3 · against 0 · neutral 2 · unread 0 → net 3 over tipped 3 → the full 10°.
    const readings = [
      reading('real-yield-10y', LOW), // falling/low real yield = supports (polarity −1)
      reading('dollar-basket', LOW), // supports
      reading('vix', HIGH), // supports
      reading('us-cpi-yoy', STEADY), // steady → not firing
      reading('cftc-gold-positioning', STEADY), // steady → not firing
    ];
    const b = gfLaneBalance(readings, voters, GF_LANES_5, 1, GF_MOVE_FROZEN_BASE, false);
    expect(b.counts).toEqual({ for: 3, against: 0, neutral: 2, unread: 0 });
    expect(b.net).toBe(3);
    expect(b.beamAngle).toBe(10); // |3|/3 × 10 = 10 — fully tipped
    expect(b.fullyTipped).toBe(true);
    // A one-vote margin across all five voting lanes: for 3 · against 2 → net 1 over
    // tipped 5 → 2° → CLAMPED UP to 3° (the formula's [3, 10] band, lane-count-agnostic).
    const b2 = gfLaneBalance(
      [reading('real-yield-10y', LOW), reading('dollar-basket', LOW), reading('vix', HIGH), reading('us-cpi-yoy', LOW), reading('cftc-gold-positioning', HIGH)],
      voters,
      GF_LANES_5,
      1,
      GF_MOVE_FROZEN_BASE,
      false,
    );
    expect(b2.counts).toEqual({ for: 3, against: 2, neutral: 0, unread: 0 });
    expect(b2.net).toBe(1);
    expect(b2.beamAngle).toBe(3); // |1|/5 × 10 = 2 → clamped to the 3° floor
    expect(b2.fullyTipped).toBe(false);
    // Level at net 0 (a split pair of voting lanes).
    const b3 = gfLaneBalance(
      [reading('real-yield-10y', LOW), reading('dollar-basket', HIGH)],
      voters,
      GF_LANES_5,
      1,
      GF_MOVE_FROZEN_BASE,
      false,
    );
    expect(b3.net).toBe(0);
    expect(b3.beamAngle).toBe(0);
    expect(b3.state).toBe('level');
  });

  it('the min-firing rule over a 2-seat lane: one firing seat never tips the flows lane under MIN2', () => {
    const voters = GF_VOTERS_5LANE.filter((v) => v.lane === 'flows');
    const one = gfLaneBalance([reading('cftc-gold-positioning', HIGH)], voters, ['flows'], 2, GF_MOVE_FROZEN_BASE, false);
    expect(one.lanes[0]!.side).toBe('neutral');
    expect(one.lanes[0]!.split).toBe(false);
    const both = gfLaneBalance(
      [reading('cftc-gold-positioning', HIGH), reading(GF_F2_PROXY_ID, HIGH)],
      voters,
      ['flows'],
      2,
      GF_MOVE_FROZEN_BASE,
      false,
    );
    expect(both.lanes[0]!.side).toBe('against'); // both crowded-long extremes → pressures
    const split = gfLaneBalance(
      [reading('cftc-gold-positioning', HIGH), reading(GF_F2_PROXY_ID, LOW)],
      voters,
      ['flows'],
      2,
      GF_MOVE_FROZEN_BASE,
      false,
    );
    expect(split.lanes[0]!.side).toBe('neutral');
    expect(split.lanes[0]!.split).toBe(true); // the mixed chip
  });
});
