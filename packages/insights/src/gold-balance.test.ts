/**
 * gold-balance.test.ts — the P1 consolidated-balance engine's contract tests
 * (docs/specs/gold-balance-consolidation/02-ENGINE-AND-DECISION-TABLE.md §2–§3
 * + 04-MIGRATION-AND-ACCEPTANCE.md §4.1 — the 13 engine tests).
 *
 *   - the LANE VOTE (02 §3): the GOLD_LANE_MIN_FIRING = 2 crowd minimum
 *     (the P0 calibration decision — BACKTEST-GOLD-LANES.md, D-GB-3's
 *     default chosen by C1+C2 over all windows), strict majority of the
 *     firing voters, the split tie, unread vs neutral (problem P5), the
 *     stale-voter immutability;
 *   - the MEMBER SHAPE: supports/pressures/steady/unread impacts with the
 *     evaluator's own evidence words (rising/falling/high/low), every voter
 *     of every lane, in table order;
 *   - the POLARITY pins and the vix-trap lesson (GB-S1): every voter
 *     without a SIGNAL_LEG_MOVE entry fires through the LEVEL leg alone —
 *     a 30-day move on such a voter is silently steady;
 *   - the 2026-10-31 FIXTURE (04 §4.1 tests 12+13): directly constructed
 *     from the recorded corpus archive, reproducing 01 §7's worked example
 *     exactly, with the frozen goldTailwindScore's no-drift pin on the same
 *     readings;
 *   - the HARNESS EQUIVALENCE PIN: goldBalance(readings) must agree with
 *     laneBalanceOverVoters(readings, GOLD_LANE_VOTERS, 2) — the P0
 *     calibration's frozen lineage measurement of the SAME algorithm — on
 *     every lane side/split/readable/firing/supports/pressures and the
 *     counts/net/readable, over every battery here.
 *
 * The frozen engine, its tables and the harness are NEVER edited by these
 * tests (D-GB-9); the engine under test imports the same frozen sources
 * they do. Synthetic data for the rule batteries; the one recorded fixture
 * for tests 12+13 (AGENTS.md rule 7 — no live sites).
 */

import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import type { IndicatorId, IndicatorReading } from '@currena/core';

import { GOLD_LANE_VOTERS, GOLD_LANES, goldTailwindScore } from './gold-score';
import { HARNESS_GOLD_LANES_MIN2, laneBalanceOverVoters } from './gold-backtest-core';
import { GOLD_LANE_MIN_FIRING, GOLD_LANE_STRONG, goldBalance } from './gold-balance';

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

/** Decade-extreme positions (the level half of the shared evaluator). */
const HIGH: Partial<IndicatorReading> = { percentile10y: 0.95 };
const LOW: Partial<IndicatorReading> = { percentile10y: 0.05 };
/** A 30-day move beyond the rates family's per-leg thresholds. */
const RISING: Partial<IndicatorReading> = { change30d: 0.3 };
const FALLING: Partial<IndicatorReading> = { change30d: -0.3 };
/** Readable, parked mid-range — honestly not firing. */
const STEADY: Partial<IndicatorReading> = { percentile10y: 0.5, change30d: 0.02 };

const lane = (b: ReturnType<typeof goldBalance>, name: (typeof GOLD_LANES)[number]) =>
  b.lanes.find((l) => l.lane === name)!;
const member = (b: ReturnType<typeof goldBalance>, name: (typeof GOLD_LANES)[number], id: IndicatorId) =>
  lane(b, name).members.find((m) => m.id === id)!;

/** Steady readings for every voter of the named lanes (readable, nothing firing). */
const steadyFor = (...lanes: readonly (typeof GOLD_LANES)[number][]): IndicatorReading[] =>
  GOLD_LANE_VOTERS.filter((v) => lanes.includes(v.lane)).map((v) => reading(v.id as IndicatorId, STEADY));

/* ------------------------------------------------------------------ *
 * The 13 engine tests (04 §4.1) — the lane vote, the member shape,
 * the table, the fixture, the no-drift pin
 * ------------------------------------------------------------------ */

describe('goldBalance — the lane vote rules (02 §3)', () => {
  // 04 §4.1 test 1 — the crowd minimum (D-GB-3, the P0 decision MIN2).
  it('1. one firing voter gives neutral (split = false) — one voter never moves a lane', () => {
    const b = goldBalance([reading('usdjpy', HIGH)]); // a single dollar-lane pressure
    const dollar = lane(b, 'dollar');
    expect(dollar.side).toBe('neutral');
    expect(dollar.split).toBe(false);
    expect(dollar.firing).toBe(1);
    expect(dollar.readable).toBe(1);
    expect(dollar.supports).toBe(0);
    expect(dollar.pressures).toBe(1);
    expect(b.net).toBe(0);
    expect(b.counts).toEqual({ for: 0, against: 0, neutral: 1, unread: 3 });
    expect(b.readable).toBe(1);
    // the member shape: the firing voter carries its evidence; the other
    // two dollar voters are missing → unread, evidence null.
    expect(member(b, 'dollar', 'usdjpy')).toEqual({ id: 'usdjpy', impact: 'pressures', evidence: 'high' });
    expect(member(b, 'dollar', 'dollar-basket')).toEqual({ id: 'dollar-basket', impact: 'unread', evidence: null });
  });

  // 04 §4.1 test 2 — two firing voters on one side vote the lane.
  it('2. two firing, both supports → for; both pressures → against', () => {
    const support = goldBalance([reading('us-cpi-yoy', HIGH), reading('us-pce-core-yoy', HIGH)]);
    const inflation = lane(support, 'inflation');
    expect(inflation.side).toBe('for');
    expect(inflation.split).toBe(false);
    expect(inflation.supports).toBe(2);
    expect(inflation.pressures).toBe(0);
    expect(inflation.firing).toBe(2);
    expect(support.counts).toEqual({ for: 1, against: 0, neutral: 0, unread: 3 });
    expect(support.net).toBe(1);

    const pressure = goldBalance([reading('us10y', HIGH), reading('us30y', HIGH)]);
    const borrowing = lane(pressure, 'borrowing-costs');
    expect(borrowing.side).toBe('against');
    expect(borrowing.split).toBe(false);
    expect(borrowing.pressures).toBe(2);
    expect(pressure.counts).toEqual({ for: 0, against: 1, neutral: 0, unread: 3 });
    expect(pressure.net).toBe(-1);
  });

  // 04 §4.1 test 3 — the split tie reads mixed and sits in the neutral tray.
  it('3. 2 supports + 2 pressures → neutral, split = true', () => {
    const b = goldBalance([
      reading('real-yield-10y', FALLING), // falling real yields support
      reading('us10y', FALLING), // falling nominal yields support
      reading('us30y', HIGH), // high 30y pressures
      reading('fed-expectations', HIGH), // high 2y pressures
    ]);
    const borrowing = lane(b, 'borrowing-costs');
    expect(borrowing.side).toBe('neutral');
    expect(borrowing.split).toBe(true);
    expect(borrowing.supports).toBe(2);
    expect(borrowing.pressures).toBe(2);
    expect(borrowing.firing).toBe(4);
    expect(borrowing.readable).toBe(4);
    expect(b.counts).toEqual({ for: 0, against: 0, neutral: 1, unread: 3 });
    expect(b.net).toBe(0);
  });

  // 04 §4.1 test 4 — strict majority of the FIRING voters.
  it('4. 3 supports + 1 pressure → for (strict majority of the firing voters)', () => {
    const b = goldBalance([
      reading('us-cpi-yoy', HIGH),
      reading('us-pce-core-yoy', HIGH),
      reading('euro-hicp', HIGH),
      reading('breakeven-5y5y', LOW), // falling expectations pressure the lane
    ]);
    const inflation = lane(b, 'inflation');
    expect(inflation.side).toBe('for');
    expect(inflation.split).toBe(false);
    expect(inflation.supports).toBe(3);
    expect(inflation.pressures).toBe(1);
    expect(inflation.firing).toBe(4);
    expect(b.net).toBe(1);
  });

  // 04 §4.1 test 5 — the unread state (nothing could be read — never a guess).
  it('5. all voters of a lane stale/missing/unavailable/check-pending → unread', () => {
    const staleAll = goldBalance(GOLD_LANE_VOTERS.map((v) => reading(v.id as IndicatorId, { status: 'stale' })));
    for (const l of staleAll.lanes) {
      expect(l.side).toBe('unread');
      expect(l.readable).toBe(0);
      expect(l.firing).toBe(0);
      expect(l.split).toBe(false);
      for (const m of l.members) {
        expect(m.impact).toBe('unread');
        expect(m.evidence).toBeNull();
      }
    }
    expect(staleAll.counts).toEqual({ for: 0, against: 0, neutral: 0, unread: 4 });
    expect(staleAll.net).toBe(0);
    expect(staleAll.readable).toBe(0);

    // every non-readable status and plain absence, mixed: missing
    // (dollar-basket), stale (usdjpy), check-pending (us-japan-10y-gap)
    // and unavailable (fed-target) — the dollar lane is unread because ALL
    // its voters are non-readable; borrowing-costs keeps its one readable
    // voter (us10y, steady) and reads neutral, firing 0.
    const mixed = goldBalance([
      reading('usdjpy', { ...HIGH, status: 'stale' }),
      reading('us-japan-10y-gap', { ...HIGH, status: 'check-pending' }),
      reading('fed-target', { ...HIGH, status: 'unavailable', value: null, asOf: null }),
      reading('us10y', STEADY),
    ]);
    expect(lane(mixed, 'dollar').side).toBe('unread');
    expect(lane(mixed, 'dollar').readable).toBe(0);
    expect(lane(mixed, 'borrowing-costs').side).toBe('neutral'); // 1 readable, 0 firing
    expect(lane(mixed, 'borrowing-costs').readable).toBe(1);
    expect(member(mixed, 'borrowing-costs', 'fed-target').impact).toBe('unread');
    expect(member(mixed, 'borrowing-costs', 'real-yield-10y').impact).toBe('unread'); // plain absence
  });

  // 04 §4.1 test 6 — problem P5's fix: the two "no lean" states never merge.
  it('6. readable but all steady → neutral, NOT unread', () => {
    const b = goldBalance(GOLD_LANE_VOTERS.map((v) => reading(v.id as IndicatorId, STEADY)));
    for (const l of b.lanes) {
      expect(l.side).toBe('neutral');
      expect(l.split).toBe(false);
      expect(l.readable).toBe(l.members.length); // every voter readable
      expect(l.firing).toBe(0);
      for (const m of l.members) expect(m.impact).toBe('steady');
    }
    expect(b.counts).toEqual({ for: 0, against: 0, neutral: 4, unread: 0 });
    expect(b.net).toBe(0);
    expect(b.readable).toBe(4);
  });

  // 04 §4.1 test 7 — staleness is inert, never a vote.
  it('7. a stale voter added to a lane never changes its side', () => {
    const base = [reading('usdjpy', HIGH), reading('dollar-basket', HIGH)]; // dollar AGAINST
    const withStale = [...base, reading('us-japan-10y-gap', { status: 'stale', ...HIGH })];
    expect(goldBalance(withStale)).toEqual(goldBalance(base)); // the whole reading is unchanged
    expect(lane(goldBalance(base), 'dollar').side).toBe('against');

    // inert beside every side: for, split, steady-neutral and unread lanes.
    const forBase = [reading('us-cpi-yoy', HIGH), reading('us-pce-core-yoy', HIGH)];
    const forStale = [...forBase, reading('euro-hicp', { status: 'stale', ...HIGH })];
    expect(goldBalance(forStale)).toEqual(goldBalance(forBase));
    const steadyBase = [reading('us-cpi-yoy', STEADY), reading('us-pce-core-yoy', STEADY)];
    const steadyStale = [...steadyBase, reading('euro-hicp', { status: 'stale', ...STEADY })];
    expect(goldBalance(steadyStale)).toEqual(goldBalance(steadyBase));
    const missing = [reading('us-cpi-yoy', STEADY)]; // inflation lane with 4 voters absent
    const absentStale = [...missing, reading('us-pce-core-yoy', { status: 'stale', ...STEADY })];
    expect(goldBalance(absentStale)).toEqual(goldBalance(missing));
  });
});

describe('goldBalance — the totals (02 §3 step 4)', () => {
  // 04 §4.1 test 8 — counts/net/readable over mixed lane combinations.
  it('8. net, counts and readable for mixed lane combinations', () => {
    // inflation FOR · borrowing-costs AGAINST · dollar SPLIT · stress steady-neutral.
    const mixed = goldBalance([
      reading('us-cpi-yoy', HIGH), reading('us-pce-core-yoy', HIGH), // inflation FOR
      reading('us10y', HIGH), reading('us30y', HIGH), // borrowing-costs AGAINST
      reading('usdjpy', HIGH), reading('dollar-basket', LOW), // dollar SPLIT (1 v 1)
      ...steadyFor('stress'),
    ]);
    expect(mixed.counts).toEqual({ for: 1, against: 1, neutral: 2, unread: 0 });
    expect(mixed.net).toBe(0);
    expect(mixed.readable).toBe(4);
    expect(lane(mixed, 'dollar').split).toBe(true);

    // 1 FOR · 1 AGAINST · 1 SPLIT · 1 UNREAD — readable counts neutral, not absent.
    const withUnread = goldBalance([
      reading('us-cpi-yoy', HIGH), reading('us-pce-core-yoy', HIGH), // inflation FOR
      reading('us10y', HIGH), reading('us30y', HIGH), // borrowing-costs AGAINST
      reading('usdjpy', HIGH), reading('dollar-basket', LOW), // dollar SPLIT
      // stress lane entirely absent → unread
    ]);
    expect(withUnread.counts).toEqual({ for: 1, against: 1, neutral: 1, unread: 1 });
    expect(withUnread.net).toBe(0);
    expect(withUnread.readable).toBe(3);

    // 3 FOR · 1 AGAINST: net 2 over 4 readable lanes.
    const threeFor = goldBalance([
      reading('us-cpi-yoy', HIGH), reading('us-pce-core-yoy', HIGH), // inflation FOR
      reading('vix', HIGH), reading('nfci', HIGH), // stress FOR
      reading('usdjpy', LOW), reading('dollar-basket', LOW), // dollar FOR
      reading('us10y', HIGH), reading('us30y', HIGH), // borrowing-costs AGAINST
    ]);
    expect(threeFor.counts).toEqual({ for: 3, against: 1, neutral: 0, unread: 0 });
    expect(threeFor.net).toBe(2);
    expect(threeFor.readable).toBe(4);
  });
});

describe('goldBalance — the member vocabulary (02 §2)', () => {
  // 04 §4.1 test 9 — the polarity pins, with the GB-S1 vix trap stated.
  it('9. polarity: falling real-yield-10y supports; high us30y pressures; a firing vix supports; high cftc-gold-positioning pressures', () => {
    const b = goldBalance([
      reading('real-yield-10y', FALLING),
      reading('us30y', HIGH),
      reading('vix', HIGH),
      reading('cftc-gold-positioning', HIGH),
    ]);
    expect(member(b, 'borrowing-costs', 'real-yield-10y')).toEqual({
      id: 'real-yield-10y',
      impact: 'supports',
      evidence: 'falling',
    });
    expect(member(b, 'borrowing-costs', 'us30y')).toEqual({ id: 'us30y', impact: 'pressures', evidence: 'high' });
    expect(member(b, 'stress', 'vix')).toEqual({ id: 'vix', impact: 'supports', evidence: 'high' });
    expect(member(b, 'stress', 'cftc-gold-positioning')).toEqual({
      id: 'cftc-gold-positioning',
      impact: 'pressures',
      evidence: 'high',
    });
    expect(lane(b, 'borrowing-costs').supports).toBe(1);
    expect(lane(b, 'borrowing-costs').pressures).toBe(1);
    expect(lane(b, 'stress').supports).toBe(1);
    expect(lane(b, 'stress').pressures).toBe(1);

    // THE VIX TRAP (GB-S1's lesson, pinned): vix has NO SIGNAL_LEG_MOVE
    // entry in the shared evaluator, so a 30-day move — however large —
    // never fires it; the level leg alone is its firing path. A big
    // change30d on a mid-range vix reads steady, silently.
    const trapped = goldBalance([reading('vix', { change30d: 30, percentile10y: 0.5 })]);
    expect(member(trapped, 'stress', 'vix')).toEqual({ id: 'vix', impact: 'steady', evidence: null });
    expect(lane(trapped, 'stress').firing).toBe(0);
    // the same trap for every OTHER voter without a move threshold:
    // us30y, fed-expectations, stress-stlfsi, us-cpi-yoy — all level-only.
    for (const id of ['us30y', 'fed-expectations', 'stress-stlfsi', 'us-cpi-yoy'] as const) {
      const t = goldBalance([reading(id, { change30d: 25, percentile10y: 0.5 })]);
      expect(member(t, GOLD_LANE_VOTERS.find((v) => v.id === id)!.lane, id).impact, id).toBe('steady');
    }
    // and the four voters that DO carry a SIGNAL_LEG_MOVE threshold fire
    // from the move alone (each beyond its own per-leg minimum):
    const qualifyingMoves: Partial<Record<IndicatorId, number>> = {
      'real-yield-10y': -0.5, // threshold 0.1 points
      us10y: -0.5, // threshold 0.15 points
      'dollar-basket': -2.0, // threshold 1.0 points
      'breakeven-5y5y': -0.5, // threshold 0.1 points
    };
    for (const [id, change30d] of Object.entries(qualifyingMoves)) {
      const t = goldBalance([reading(id as IndicatorId, { change30d, percentile10y: 0.5 })]);
      expect(member(t, GOLD_LANE_VOTERS.find((v) => v.id === id)!.lane, id as IndicatorId).impact, id).not.toBe('steady');
    }
  });

  // 04 §4.1 test 10 — the D-5 promotion shape: the tilt's level-only leg.
  it('10. breakeven-tilt fires on level only — a big 30-day move never fires it', () => {
    const high = goldBalance([reading('breakeven-tilt', HIGH)]);
    expect(member(high, 'inflation', 'breakeven-tilt')).toEqual({
      id: 'breakeven-tilt',
      impact: 'supports',
      evidence: 'high',
    });
    expect(lane(high, 'inflation').supports).toBe(1);
    expect(lane(high, 'inflation').side).toBe('neutral'); // 1 firing < MIN 2

    // the move leg does not exist for the tilt: a large change30d on a
    // mid-range tilt stays steady (SIGNAL_LEG_MOVE has no entry).
    const moving = goldBalance([reading('breakeven-tilt', { change30d: 5, percentile10y: 0.5 })]);
    expect(member(moving, 'inflation', 'breakeven-tilt')).toEqual({ id: 'breakeven-tilt', impact: 'steady', evidence: null });
    expect(lane(moving, 'inflation').firing).toBe(0);

    // a qualifying LEVEL on a moving series still fires, evidence "high"
    // (the evaluator's own order: direction first, else the level).
    const movingHigh = goldBalance([reading('breakeven-tilt', { change30d: 5, percentile10y: 0.95 })]);
    expect(member(movingHigh, 'inflation', 'breakeven-tilt')).toEqual({
      id: 'breakeven-tilt',
      impact: 'supports',
      evidence: 'high',
    });
  });

  // 04 §4.1 test 11 — the engine's membership IS the frozen table's.
  it("11. table integrity: the engine's lane membership equals GOLD_LANE_VOTERS (21 voters, 8/3/5/5)", () => {
    expect(GOLD_LANE_MIN_FIRING).toBe(2); // the P0 calibration decision (MIN2)
    expect(GOLD_LANE_STRONG).toBe(3); // 01 §5.2's strong bar
    expect(HARNESS_GOLD_LANES_MIN2.minFiring).toBe(GOLD_LANE_MIN_FIRING); // the decision the harness measured

    const b = goldBalance(GOLD_LANE_VOTERS.map((v) => reading(v.id as IndicatorId, STEADY)));
    expect(b.lanes).toHaveLength(4);
    expect(b.lanes.map((l) => l.lane)).toEqual([...GOLD_LANES]);
    const memberIds = b.lanes.flatMap((l) => l.members.map((m) => m.id));
    expect(memberIds).toEqual(GOLD_LANE_VOTERS.map((v) => v.id)); // table order, every voter
    expect(memberIds).toHaveLength(21);
    const perLane: Record<string, number> = {};
    for (const id of memberIds) {
      const v = GOLD_LANE_VOTERS.find((x) => x.id === id)!;
      perLane[v.lane] = (perLane[v.lane] ?? 0) + 1;
    }
    expect(perLane).toEqual({ 'borrowing-costs': 8, dollar: 3, stress: 5, inflation: 5 });
  });
});

/* ------------------------------------------------------------------ *
 * The 2026-10-31 fixture (04 §4.1 tests 12+13) — directly constructed
 * from the recorded corpus archive (GB-S1 verified it reproduces 01 §7
 * under the lane engine). Readings carry id/value/asOf/status/
 * percentile10y/change30d; sourceName "archive 2026-10-31", updatedAt
 * the archive's generatedAt. This pins 01 §7's worked example.
 * ------------------------------------------------------------------ */

/** The corpus's recorded 2026-10-31 archive, as the page-shaped readings. */
function fixtureReadings(): IndicatorReading[] {
  const corpus = JSON.parse(
    readFileSync(new URL('../fixtures/gold-backtest-corpus.json', import.meta.url), 'utf8'),
  ) as { archives: Record<string, { generatedAt: string; readings: unknown[] }> };
  const archive = corpus.archives['2026-10-31']!;
  return archive.readings.map((raw) => {
    const r = raw as {
      id: IndicatorId;
      value: number;
      asOf: string;
      status: IndicatorReading['status'];
      percentile10y?: number;
      change30d?: number;
    };
    return {
      id: r.id,
      value: r.value,
      asOf: r.asOf,
      status: r.status,
      percentile10y: r.percentile10y,
      change30d: r.change30d,
      sourceName: 'archive 2026-10-31',
      updatedAt: archive.generatedAt,
    } satisfies IndicatorReading;
  });
}

describe('goldBalance — the 2026-10-31 fixture (01 §7, 04 §4.1 tests 12+13)', () => {
  // 04 §4.1 test 12 — the worked example, measured on the real archive.
  it('12. the fixture reads LEVEL, 4 neutral: borrowing-costs split 2v2, dollar 1 firing, stress readable-5/firing-0, inflation 1 firing', () => {
    const b = goldBalance(fixtureReadings());
    expect(b.net).toBe(0);
    expect(b.counts).toEqual({ for: 0, against: 0, neutral: 4, unread: 0 });
    expect(b.readable).toBe(4);

    const borrowing = lane(b, 'borrowing-costs');
    expect(borrowing.side).toBe('neutral');
    expect(borrowing.split).toBe(true); // 01 §7: 2 for, 2 against
    expect(borrowing.readable).toBe(8);
    expect(borrowing.firing).toBe(4);
    expect(borrowing.supports).toBe(2);
    expect(borrowing.pressures).toBe(2);
    expect(member(b, 'borrowing-costs', 'real-yield-10y')).toEqual({ id: 'real-yield-10y', impact: 'supports', evidence: 'falling' });
    expect(member(b, 'borrowing-costs', 'us10y')).toEqual({ id: 'us10y', impact: 'supports', evidence: 'falling' });
    expect(member(b, 'borrowing-costs', 'us30y')).toEqual({ id: 'us30y', impact: 'pressures', evidence: 'high' });
    expect(member(b, 'borrowing-costs', 'fed-expectations')).toEqual({ id: 'fed-expectations', impact: 'pressures', evidence: 'high' });

    const dollar = lane(b, 'dollar');
    expect(dollar.side).toBe('neutral'); // 1 firing < MIN 2 — USD/JPY alone is not the dollar
    expect(dollar.split).toBe(false);
    expect(dollar.firing).toBe(1);
    expect(dollar.pressures).toBe(1);
    expect(dollar.readable).toBe(3);
    expect(member(b, 'dollar', 'usdjpy')).toEqual({ id: 'usdjpy', impact: 'pressures', evidence: 'high' });

    const stress = lane(b, 'stress');
    expect(stress.side).toBe('neutral'); // readable, nothing firing — NOT unread (P5)
    expect(stress.readable).toBe(5);
    expect(stress.firing).toBe(0);
    expect(stress.split).toBe(false);

    const inflation = lane(b, 'inflation');
    expect(inflation.side).toBe('neutral'); // 1 firing < MIN 2
    expect(inflation.firing).toBe(1);
    expect(inflation.pressures).toBe(1);
    expect(inflation.readable).toBe(5);
    expect(member(b, 'inflation', 'breakeven-5y5y')).toEqual({ id: 'breakeven-5y5y', impact: 'pressures', evidence: 'falling' });
  });

  // 04 §4.1 test 13 — the no-drift pin: the frozen engine is untouched.
  it('13. no-drift: goldTailwindScore on the same fixture is netScore -2 / headwind / 6 of 21 firing', () => {
    const t = goldTailwindScore(fixtureReadings());
    expect(t.netScore).toBe(-2);
    expect(t.label).toBe('headwind');
    expect(t.firingVoters).toBe(6);
    expect(t.tailwindVoters).toBe(2);
    expect(t.headwindVoters).toBe(4);
    expect(t.voters.map((v) => `${v.id}:${v.impact}:${v.evidence}`)).toEqual([
      'real-yield-10y:tailwind:falling',
      'us10y:tailwind:falling',
      'us30y:headwind:high',
      'fed-expectations:headwind:high',
      'usdjpy:headwind:high',
      'breakeven-5y5y:headwind:falling',
    ]);
  });
});

/* ------------------------------------------------------------------ *
 * The harness-equivalence pin — the production engine and the P0
 * calibration's frozen measurement of the SAME algorithm cannot drift
 * apart silently. laneBalanceOverVoters(readings, GOLD_LANE_VOTERS, 2)
 * is what BACKTEST-GOLD-LANES.md measured; goldBalance is the richer
 * production shape (members) over the same imports. Every battery above
 * and the fixture run through both.
 * ------------------------------------------------------------------ */

describe('goldBalance === laneBalanceOverVoters(GOLD_LANE_VOTERS, 2) — the frozen-lineage equivalence pin', () => {
  /** The batteries: every synthetic shape the rule tests use, plus the fixture. */
  const batteries: readonly { name: string; readings: readonly IndicatorReading[] }[] = [
    { name: 'empty', readings: [] },
    { name: 'one firing voter', readings: [reading('usdjpy', HIGH)] },
    {
      name: 'two supports',
      readings: [reading('us-cpi-yoy', HIGH), reading('us-pce-core-yoy', HIGH)],
    },
    {
      name: 'two pressures',
      readings: [reading('us10y', HIGH), reading('us30y', HIGH)],
    },
    {
      name: 'split 2v2',
      readings: [reading('real-yield-10y', FALLING), reading('us10y', FALLING), reading('us30y', HIGH), reading('fed-expectations', HIGH)],
    },
    {
      name: '3 supports 1 pressure',
      readings: [reading('us-cpi-yoy', HIGH), reading('us-pce-core-yoy', HIGH), reading('euro-hicp', HIGH), reading('breakeven-5y5y', LOW)],
    },
    {
      name: 'all stale',
      readings: GOLD_LANE_VOTERS.map((v) => reading(v.id as IndicatorId, { status: 'stale' })),
    },
    {
      name: 'all steady',
      readings: GOLD_LANE_VOTERS.map((v) => reading(v.id as IndicatorId, STEADY)),
    },
    {
      name: 'mixed unread statuses',
      readings: [
        reading('usdjpy', { ...HIGH, status: 'stale' }),
        reading('us-japan-10y-gap', { ...HIGH, status: 'check-pending' }),
        reading('fed-target', { ...HIGH, status: 'unavailable', value: null, asOf: null }),
      ],
    },
    {
      name: 'the fixed battery (HIGH/LOW/RISING/FALLING/STEADY round-robin)',
      readings: GOLD_LANE_VOTERS.map((v, i) =>
        reading(
          v.id as IndicatorId,
          i % 4 === 0 ? { ...HIGH, ...FALLING } : i % 4 === 1 ? { ...LOW, ...RISING } : i % 4 === 2 ? HIGH : STEADY,
        ),
      ),
    },
    {
      name: 'the full-lane spread (every voter firing or steady)',
      readings: GOLD_LANE_VOTERS.map((v, i) => reading(v.id as IndicatorId, i % 2 === 0 ? HIGH : LOW)),
    },
    { name: 'the 2026-10-31 fixture', readings: fixtureReadings() },
  ];

  it('agrees on every lane side/split/readable/firing/supports/pressures and the counts/net/readable, over every battery', () => {
    for (const { name, readings } of batteries) {
      const mine = goldBalance(readings);
      const harness = laneBalanceOverVoters(readings, GOLD_LANE_VOTERS, HARNESS_GOLD_LANES_MIN2.minFiring);
      expect(mine.lanes.map((l) => l.lane), name).toEqual(harness.lanes.map((l) => l.lane));
      for (let i = 0; i < mine.lanes.length; i++) {
        const a = mine.lanes[i]!;
        const b = harness.lanes[i]!;
        expect(
          {
            lane: a.lane,
            side: a.side,
            split: a.split,
            readable: a.readable,
            firing: a.firing,
            supports: a.supports,
            pressures: a.pressures,
          },
          `${name} lane ${a.lane}`,
        ).toEqual({
          lane: b.lane,
          side: b.side,
          split: b.split,
          readable: b.readable,
          firing: b.firing,
          supports: b.supports,
          pressures: b.pressures,
        });
      }
      expect({ counts: mine.counts, net: mine.net, readable: mine.readable }, name).toEqual({
        counts: harness.counts,
        net: harness.net,
        readable: harness.readable,
      });
    }
  });

  it('deterministic and order-independent for readings; never throws on missing or empty input', () => {
    const readings = GOLD_LANE_VOTERS.map((v, i) =>
      reading(v.id as IndicatorId, i % 3 === 0 ? HIGH : i % 3 === 1 ? LOW : STEADY),
    );
    const shuffled = [...readings].reverse();
    expect(goldBalance(shuffled)).toEqual(goldBalance(readings));
    expect(() => goldBalance([])).not.toThrow();
    const empty = goldBalance([]);
    expect(empty.counts).toEqual({ for: 0, against: 0, neutral: 0, unread: 4 });
    expect(empty.net).toBe(0);
    expect(empty.readable).toBe(0);
    expect(empty.lanes.map((l) => l.lane)).toEqual([...GOLD_LANES]);
    expect(empty.lanes.every((l) => l.members.length === GOLD_LANE_VOTERS.filter((v) => v.lane === l.lane).length)).toBe(true);
  });
});
