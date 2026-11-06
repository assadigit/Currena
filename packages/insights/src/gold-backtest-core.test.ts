/**
 * gold-backtest-core.test.ts — the harness's pure-part contract tests
 * (GOLD_BACKTEST_SPEC.md §3 deliverables: the window joins, the
 * no-lookahead percentile, the flat band, and the table pins).
 *
 *   - the EQUIVALENCE PIN: scoreOverVoters(r, GOLD_LANE_VOTERS) must equal
 *     the production goldTailwindScore(r) on every synthetic battery — the
 *     harness-local parameterized copy cannot drift from the engine;
 *   - the TABLE PINS (Session 6, the D-5 promotion): HARNESS_GOLD_VOTERS_21
 *     EQUALS the production 21-voter table (the tilt promoted into the
 *     inflation lane), and HARNESS_GOLD_VOTERS_20 is the S4-frozen
 *     pre-promotion table kept verbatim for lineage — production minus
 *     exactly the tilt;
 *   - seriesUpTo is the no-lookahead guarantee, and computeReading's own
 *     percentile/change math is invariant to (a) truncation at the as-of
 *     date and (b) ANY mutation of the data after it;
 *   - the B2 join: exact N-observation forward returns (no interpolation,
 *     tail windows excluded), the flat band scales the engine's own ±2% /
 *     30-day bar, and the bucket mappings fold the label vocabulary.
 *
 * Synthetic data only — no fixtures, no live sites (AGENTS.md rule 7).
 */

import { describe, expect, it } from 'vitest';

import type { IndicatorId, IndicatorReading } from '@currena/core';

import { DEFINITIONS, computeReading } from './index';
import { GOLD_LANE_VOTERS, goldTailwindScore } from './gold-score';
import {
  HARNESS_GOLD_VOTERS_21,
  HARNESS_GOLD_VOTERS_20,
  GOLD_BACKTEST_HORIZONS,
  bucketModelLabel,
  classifyReturn,
  flatBandPct,
  forwardTradingDayReturn,
  horizonCalendarDays,
  scoreOverVoters,
  seriesUpTo,
  signAgreement,
} from './gold-backtest-core';
import type { SeriesPoint } from './series';
import { GF_VOTERS_P1_DEMOTE } from './gf-p0-proposed';

const NOW = '2026-10-30T04:10:00.000Z';
const DAY = '2026-10-29';

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

/* ------------------------------------------------------------------ *
 * The equivalence pin (B4's honesty floor)
 * ------------------------------------------------------------------ */

describe('scoreOverVoters — the parameterized copy equals the production engine', () => {
  const batteries: readonly { name: string; readings: readonly IndicatorReading[] }[] = [
    { name: 'empty', readings: [] },
    { name: 'all stale/unreadable', readings: GOLD_LANE_VOTERS.map((v) => reading(v.id as IndicatorId, { status: 'stale' })) },
    {
      name: 'everything fires high (levels)',
      readings: GOLD_LANE_VOTERS.map((v) => reading(v.id as IndicatorId, HIGH)),
    },
    {
      name: 'everything fires low (levels)',
      readings: GOLD_LANE_VOTERS.map((v) => reading(v.id as IndicatorId, LOW)),
    },
    {
      name: 'mixed directions × levels',
      readings: GOLD_LANE_VOTERS.map((v, i) =>
        reading(v.id as IndicatorId, i % 4 === 0 ? { ...HIGH, ...FALLING } : i % 4 === 1 ? { ...LOW, ...RISING } : i % 4 === 2 ? HIGH : { change30d: 0.02, percentile10y: 0.5 }),
      ),
    },
    {
      name: 'one voter firing only (tailwind)',
      readings: [reading('real-yield-10y', FALLING)],
    },
    {
      name: 'exactly balanced (2 vs 2)',
      readings: [reading('real-yield-10y', FALLING), reading('us10y', FALLING), reading('vix', HIGH), reading('nfci', HIGH)],
    },
    {
      name: 'strong crowd (4 vs 0 firing)',
      readings: [reading('real-yield-10y', FALLING), reading('us10y', FALLING), reading('us30y', FALLING), reading('fed-target', FALLING)],
    },
    {
      name: 'a few unreadable statuses in the mix',
      readings: [
        reading('real-yield-10y', { ...HIGH, status: 'unavailable' }),
        reading('vix', HIGH),
        reading('vix', LOW), // later row wins the Map — same rule as the engine
        reading('dollar-basket', { status: 'check-pending', ...HIGH }),
        reading('breakeven-5y5y', { ...LOW, status: 'stale' }),
        reading('us-cpi-yoy', HIGH),
      ],
    },
    {
      name: 'no-history voters can still fire via level (production semantics)',
      readings: [reading('yield-curve-10y2y', { ...LOW, status: 'no-history' })],
    },
  ];

  for (const battery of batteries) {
    it(`${battery.name}: deep-equals goldTailwindScore`, () => {
      expect(scoreOverVoters(battery.readings, GOLD_LANE_VOTERS)).toEqual(goldTailwindScore(battery.readings));
    });
  }
});

/* ------------------------------------------------------------------ *
 * The harness tables after the promotion (Session 6 — D-5)
 * ------------------------------------------------------------------ */

describe('the harness tables — the lineage snapshots (Session 6 → GF-P1 → GF-P2 → GF-P3)', () => {
  it('the SNAPSHOT PIN: HARNESS_GOLD_VOTERS_21 is the VERBATIM pre-GF-P1 production table — 21 seats, the curve pair present', () => {
    // GF-P1 (2026-11-05, the owner's recorded decision H — the D-7/D-8
    // context demotion) separated the harness snapshot from production:
    // the lineage tables (the GB-S1 calibration, BACKTEST-GOLD-LANES.md,
    // the FROZEN/POST-P1 calibration scenarios) measured THIS 21-seat
    // table, so it stays VERBATIM while production moved to 19, then to
    // GF-P2's 32, then to GF-P3's 36.
    expect(HARNESS_GOLD_VOTERS_21).toHaveLength(21);
    expect(HARNESS_GOLD_VOTERS_21.some((v) => v.id === 'yield-curve-10y2y')).toBe(true);
    expect(HARNESS_GOLD_VOTERS_21.some((v) => v.id === 'yield-curve-10y3m')).toBe(true);
    expect(HARNESS_GOLD_VOTERS_21.at(-1)).toEqual({ lane: 'inflation', id: 'breakeven-tilt', polarity: 1 });
  });

  it('production is the GF-S10 table: 37 voters (7/7/11/10/2), the tilt in the inflation lane, polarity +1', () => {
    // GF-P2 (the owner's recorded answers B/C/K, 2026-11-05): the measured
    // POST-P2-5LANE composition (32 voters, 6/5/10/9/2). GF-P3 (the standing
    // delegation, 2026-11-06): the four FRED-sourced voter-candidates seated
    // (R2 real-yield-5y · D2 dollar-broad · D9 dollar-eme · S9 bank-stress)
    // → the measured POST-P3-5LANE composition (36 voters, 7/7/11/9/2);
    // GF-S10 (the standing delegation, 2026-11-06) seated the I4 household
    // anchor (michigan-5y-expectations, the UoM SIE 5–10y median) → the
    // measured POST-P4-5LANE composition (37 voters, 7/7/11/10/2). The
    // tilt seat keeps its recorded shape.
    expect(GOLD_LANE_VOTERS).toHaveLength(37);
    const tilt = GOLD_LANE_VOTERS.filter((v) => v.id === 'breakeven-tilt');
    expect(tilt).toHaveLength(1);
    expect(tilt[0]).toEqual({ lane: 'inflation', id: 'breakeven-tilt', polarity: 1 });
  });

  it('the PROMOTION DELTA PIN: production is the 19-seat P1-era table PLUS EXACTLY the GF-P2 + GF-P3 + GF-S10 promotions (the owner\'s recorded B/C/K + the standing delegation — the flows re-seat, the COBD pair, the twelve P2 seats, the four P3 seats and the I4 anchor)', () => {
    // The P1-era composition (the frozen 21 minus the two curve seats) plus
    // the P2 + P3 additions = production. The cftc seat MOVED from stress to
    // flows (D-14's repair) and the F2 real object joined it there; GF-P3
    // added the four FRED-sourced voters (R2/D2/D9/S9), all in non-flows
    // lanes (borrowing-costs/dollar/dollar/stress).
    expect(GF_VOTERS_P1_DEMOTE).toHaveLength(19);
    // Set<string>: the P1_DEMOTE ids are the wider GfCandidateId union (the
    // harness-local candidate ids included) — the membership check is the
    // test's own object, not a type-level identity claim.
    const productionIds = new Set<string>(GOLD_LANE_VOTERS.map((v) => v.id));
    for (const v of GF_VOTERS_P1_DEMOTE) expect(productionIds.has(v.id), `${v.id} kept`).toBe(true);
    // The GF-P1 19 seats' lanes all survive into the 36 — except cftc's
    // re-seat (stress → flows, the owner's recorded B).
    const kept = GOLD_LANE_VOTERS.filter((v) => v.lane !== 'flows' && v.id !== 'cftc-gold-positioning');
    expect(kept).toHaveLength(35); // 19 − cftc-reseat + the 12 P2 non-flows promotions + the 4 P3 non-flows promotions + the 1 P4 (I4 michigan-5y-expectations)
    for (const v of GF_VOTERS_P1_DEMOTE) {
      if (v.id === 'cftc-gold-positioning') continue;
      const match = kept.find((x) => x.id === v.id);
      expect(match, `${v.id} same lane`).toEqual(v);
    }
    // the flows lane: F1 re-seated + F2's real object, both polarity −1.
    // GF-P3 added NO flows voters (the 4 P3 voters are all in non-flows
    // lanes) — the flows lane stays at the GF-P2 shape (2 seats).
    expect(GOLD_LANE_VOTERS.filter((v) => v.lane === 'flows')).toEqual([
      { lane: 'flows', id: 'cftc-gold-positioning', polarity: -1 },
      { lane: 'flows', id: 'cftc-gold-gross-long', polarity: -1 },
    ]);
  });

  it('the S4 frozen 20-voter table is the 21-seat snapshot minus EXACTLY the tilt — the promotion is the only change between them', () => {
    expect(HARNESS_GOLD_VOTERS_20).toHaveLength(20);
    expect(HARNESS_GOLD_VOTERS_20.some((v) => v.id === 'breakeven-tilt')).toBe(false);
    expect(HARNESS_GOLD_VOTERS_21.filter((v) => v.id !== 'breakeven-tilt')).toEqual(HARNESS_GOLD_VOTERS_20);
  });

  it('the tilt voter behaves like every other level-only voter: high → tailwind, low → headwind, steady-mid → silent (production semantics)', () => {
    const base = [reading('us-cpi-yoy', HIGH)];
    const withTiltHigh = scoreOverVoters([...base, reading('breakeven-tilt', HIGH)], GOLD_LANE_VOTERS);
    const withTiltLow = scoreOverVoters([...base, reading('breakeven-tilt', LOW)], GOLD_LANE_VOTERS);
    const withTiltSilent = scoreOverVoters(
      [...base, reading('breakeven-tilt', { percentile10y: 0.5, change30d: 0.01 })],
      GOLD_LANE_VOTERS,
    );
    const without = scoreOverVoters(base, HARNESS_GOLD_VOTERS_20); // the S4-frozen baseline
    expect(withTiltHigh.netScore).toBe(without.netScore + 1);
    expect(withTiltHigh.voters.at(-1)).toMatchObject({ id: 'breakeven-tilt', impact: 'tailwind', evidence: 'high' });
    expect(withTiltLow.netScore).toBe(without.netScore - 1);
    expect(withTiltLow.voters.at(-1)).toMatchObject({ id: 'breakeven-tilt', impact: 'headwind', evidence: 'low' });
    expect(withTiltSilent.voters.some((v) => v.id === 'breakeven-tilt')).toBe(false);
    expect(withTiltSilent.netScore).toBe(without.netScore);
    // and the production engine itself produces the promoted reading (one
    // pure function, both sides — the gauges.ts contract):
    expect(goldTailwindScore([...base, reading('breakeven-tilt', HIGH)]).netScore).toBe(withTiltHigh.netScore);
  });
});

/* ------------------------------------------------------------------ *
 * The frozen-clock truncation + the no-lookahead percentile
 * ------------------------------------------------------------------ */

describe('seriesUpTo — the no-lookahead truncation', () => {
  const series: SeriesPoint[] = [
    { date: '2026-01-01', value: 1 },
    { date: '2026-01-02', value: 2 },
    { date: '2026-01-03', value: 3 },
    { date: '2026-01-04', value: 4 },
  ];
  it('keeps the observations at or before the as-of date (inclusive)', () => {
    expect(seriesUpTo(series, '2026-01-03')).toEqual(series.slice(0, 3));
    expect(seriesUpTo(series, '2026-01-04')).toEqual(series);
  });
  it('cuts everything after, and an as-of before the first point yields the empty prefix', () => {
    expect(seriesUpTo(series, '2026-01-02')).toEqual(series.slice(0, 2));
    expect(seriesUpTo(series, '2025-12-31')).toEqual([]);
  });
  it('an as-of past the end keeps the whole series', () => {
    expect(seriesUpTo(series, '2027-01-01')).toEqual(series);
  });
});

describe('computeReading over truncated series — the percentile never sees the future', () => {
  // A synthetic 10-year daily series: a slow sine + noise-free drift, dense
  // enough for the 30-observation percentile floor, with known dates.
  const START = '2016-09-23';
  const asSeries = (n: number, mutate?: (p: SeriesPoint[], i: number) => void): SeriesPoint[] => {
    const out: SeriesPoint[] = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(Date.parse(`${START}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10);
      const value = 2 + Math.sin(i / 37) * 1.5;
      out.push({ date: d, value });
    }
    if (mutate !== undefined) mutate(out, n);
    return out;
  };
  const vixDef = DEFINITIONS.find((d) => d.id === 'vix')!;

  it('truncated and full series give IDENTICAL readings at the frozen date (belt-and-braces equals engine)', () => {
    const full = asSeries(2000);
    const asOf = '2020-06-15';
    const now = `${asOf}T04:10:00.000Z`;
    const fromFull = computeReading(vixDef, full, now, { name: 't' });
    const fromTruncated = computeReading(vixDef, seriesUpTo(full, asOf), now, { name: 't' });
    expect(fromTruncated.value).toBe(fromFull.value);
    expect(fromTruncated.asOf).toBe(fromFull.asOf);
    expect(fromTruncated.status).toBe(fromFull.status);
    expect(fromTruncated.percentile10y).toBe(fromFull.percentile10y);
    expect(fromTruncated.change30d).toBe(fromFull.change30d);
  });

  it('mutating ANY data after the as-of date cannot move the reading (the lookahead killed)', () => {
    const asOf = '2020-06-15';
    const now = `${asOf}T04:10:00.000Z`;
    const base = asSeries(2000);
    const clean = computeReading(vixDef, seriesUpTo(base, asOf), now, { name: 't' });
    // Spike EVERY observation after the as-of date to the series' extreme.
    const spiked = base.map((p) => (p.date > asOf ? { date: p.date, value: 99 } : p));
    const after = computeReading(vixDef, seriesUpTo(spiked, asOf), now, { name: 't' });
    expect(after.percentile10y).toBe(clean.percentile10y);
    expect(after.change30d).toBe(clean.change30d);
    expect(after.value).toBe(clean.value);
    expect(after.status).toBe(clean.status);
  });
});

/* ------------------------------------------------------------------ *
 * B2 — the realized-move join
 * ------------------------------------------------------------------ */

describe('forwardTradingDayReturn — exact N-observation forward returns', () => {
  const gold: SeriesPoint[] = [
    { date: '2026-01-02', value: 100 },
    { date: '2026-01-03', value: 110 },
    { date: '2026-01-06', value: 121 }, // a weekend gap: trading days, not calendar
    { date: '2026-01-07', value: 100 },
    { date: '2026-01-08', value: 90 },
    { date: '2026-01-09', value: 95 },
    { date: '2026-01-12', value: 105 },
  ];
  it('returns the percent change to EXACTLY N observations ahead (no interpolation)', () => {
    expect(forwardTradingDayReturn(gold, 0, 3)).toBeCloseTo(0, 10); // 100 → 100
    expect(forwardTradingDayReturn(gold, 1, 2)).toBeCloseTo(100 * (100 / 110 - 1), 10); // 110 → 100 (index 3)
    expect(forwardTradingDayReturn(gold, 0, 1)).toBeCloseTo(10, 10);
  });
  it('is undefined when the horizon reaches past the end (the tail windows, excluded with n stated)', () => {
    expect(forwardTradingDayReturn(gold, 6, 1)).toBeUndefined();
    expect(forwardTradingDayReturn(gold, 5, 1)).toBeCloseTo(((105 - 95) / 95) * 100, 10); // 95 → 105: the last joinable index
    expect(forwardTradingDayReturn(gold, 0, 6)).toBeCloseTo(5, 10); // full length reachable
    expect(forwardTradingDayReturn(gold, 0, 7)).toBeUndefined();
  });
  it('never divides by a non-positive base (undefined, not garbage)', () => {
    const bad: SeriesPoint[] = [
      { date: '2026-01-02', value: 0 },
      { date: '2026-01-03', value: 10 },
    ];
    expect(forwardTradingDayReturn(bad, 0, 1)).toBeUndefined();
  });
});

describe('flatBandPct — the engine\u2019s own reality bar, scaled', () => {
  it('scales GOLD_REALITY_SPEED_PCT (2% / 30 calendar days) by the horizon\u2019s calendar length', () => {
    // 5 trading days ≈ 7 calendar days → 2 × 7/30 = 0.4667%
    expect(flatBandPct(5)).toBeCloseTo((2 * 7) / 30, 10);
    // 20 trading days ≈ 28 calendar days → 2 × 28/30 = 1.8667%
    expect(flatBandPct(20)).toBeCloseTo((2 * 28) / 30, 10);
    // 60 trading days ≈ 84 calendar days → 2 × 84/30 = 5.6%
    expect(flatBandPct(60)).toBeCloseTo((2 * 84) / 30, 10);
  });
  it('the horizons are exactly the spec\u2019s {5, 20, 60} trading days', () => {
    expect([...GOLD_BACKTEST_HORIZONS]).toEqual([5, 20, 60]);
    expect(horizonCalendarDays(5)).toBeCloseTo(7, 10);
    expect(horizonCalendarDays(20)).toBeCloseTo(28, 10);
  });
});

describe('classifyReturn — up / flat / down against the band (boundaries inclusive-flat)', () => {
  it('classifies the three zones with the band applied symmetrically', () => {
    const band = flatBandPct(5); // ≈ 0.4667
    expect(classifyReturn(5, band)).toBe('up');
    expect(classifyReturn(-5, band)).toBe('down');
    expect(classifyReturn(0, band)).toBe('flat');
    expect(classifyReturn(0.2, band)).toBe('flat');
  });
  it('a return EXACTLY at the band is flat (strict beyond-the-band rule)', () => {
    expect(classifyReturn(flatBandPct(5), flatBandPct(5))).toBe('flat');
    expect(classifyReturn(-flatBandPct(5), flatBandPct(5))).toBe('flat');
    expect(classifyReturn(flatBandPct(5) * 1.000001, flatBandPct(5))).toBe('up');
    expect(classifyReturn(-flatBandPct(5) * 1.000001, flatBandPct(5))).toBe('down');
  });
});

describe('bucketModelLabel — the 5-step label folded to 3 (mixed = balanced ∪ nothing-firing)', () => {
  it('maps every label to its bucket', () => {
    expect(bucketModelLabel('strong-tailwind')).toBe('tailwind');
    expect(bucketModelLabel('tailwind')).toBe('tailwind');
    expect(bucketModelLabel('balanced')).toBe('mixed');
    expect(bucketModelLabel(null)).toBe('mixed');
    expect(bucketModelLabel('headwind')).toBe('headwind');
    expect(bucketModelLabel('strong-headwind')).toBe('headwind');
  });
});

describe('signAgreement — only windows where BOTH sides lean', () => {
  const band = flatBandPct(20);
  it('undefined when the model has no lean (netScore 0) or the move is inside the band', () => {
    expect(signAgreement(0, 5, band)).toBeUndefined();
    expect(signAgreement(3, 0.1, band)).toBeUndefined();
    expect(signAgreement(-2, -0.1, band)).toBeUndefined();
  });
  it('agrees and disagrees per the signs (tailwind lean vs the realized move)', () => {
    expect(signAgreement(3, 5, band)).toBe(true);
    expect(signAgreement(3, -5, band)).toBe(false);
    expect(signAgreement(-3, -5, band)).toBe(true);
    expect(signAgreement(-3, 5, band)).toBe(false);
  });
});
