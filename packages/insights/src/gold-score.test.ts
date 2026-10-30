/**
 * gold-score.test.ts — the Gold Program S1 engine's contract tests
 * (docs/insights/GOLD_SCORE_SPEC.md §2–§3):
 *
 *   - voter firing: the shared evalLeg lean (30-day direction beyond the
 *     per-leg threshold, else the decade position) mapped through the
 *     polarity table; unreadable series never fire;
 *   - the four lane words (tight/relief · strong/stress · elevated/calm ·
 *     hot/cool, plus mixed/unreadable) and the lane counts;
 *   - the net score and the 5-step label (share-based "strong" with the
 *     crowd minimum — never "strong" off one driver);
 *   - model vs reality: the six chips, the ±2% reality bar (the outlook
 *     classifier's own), the ma200 fallback, the explainer keys;
 *   - the compact wire shape (goldSummaryOf) round-tripping
 *     GoldSummarySchema, and the EN copy blocks covering the vocabulary
 *     exactly (no missing word can render as undefined).
 */

import { describe, expect, it } from 'vitest';

import { GoldSummarySchema, type IndicatorId, type IndicatorReading } from '@currena/core';

import {
  GOLD_LANE_VOTERS,
  GOLD_LANES,
  GOLD_PANEL_COPY_EN,
  GOLD_STRONG_MIN_FIRING,
  GOLD_STRONG_SHARE,
  GOLD_REALITY_SPEED_PCT,
  MODEL_VS_REALITY_COPY_EN,
  goldSummaryOf,
  goldTailwindScore,
  modelVsReality,
  modelVsRealityExplainerKey,
  type GoldSubGaugeWord,
} from './gold-score';

const NOW = '2026-10-30T04:20:00.000Z';
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

/** Decade-extreme positions (the level half of the shared evaluator). */
const HIGH: Partial<IndicatorReading> = { percentile10y: 0.95 };
const LOW: Partial<IndicatorReading> = { percentile10y: 0.05 };

/** A 30-day move beyond the rates family's per-leg thresholds. */
const FALLING_RATES: Partial<IndicatorReading> = { change30d: -0.3 };
const RISING_RATES: Partial<IndicatorReading> = { change30d: 0.3 };

const sub = (readings: readonly IndicatorReading[], lane: (typeof GOLD_LANES)[number]) =>
  goldTailwindScore(readings).subGauges.find((g) => g.lane === lane)!;

describe('voter firing (the shared evalLeg lean × the polarity table)', () => {
  it('empty readings: no label, every lane unreadable, the comparison no-read — never a guess', () => {
    const t = goldTailwindScore([]);
    expect(t.label).toBeNull();
    expect(t.voters).toEqual([]);
    expect(t.firingVoters).toBe(0);
    expect(t.netScore).toBe(0);
    expect(t.subGauges.map((g) => g.reading)).toEqual(['unreadable', 'unreadable', 'unreadable', 'unreadable']);
    const m = modelVsReality([]);
    expect(m.chip).toBe('no-read');
    expect(m.modelDirection).toBeNull();
    expect(m.realityDirection).toBeNull();
  });

  it('fires via a decade-HIGH level: real yields high → headwind, evidence "high"', () => {
    const t = goldTailwindScore([reading('real-yield-10y', HIGH)]);
    expect(t.voters).toEqual([
      { id: 'real-yield-10y', lane: 'borrowing-costs', impact: 'headwind', evidence: 'high' },
    ]);
  });

  it('fires via a 30-day FALL beyond the per-leg threshold: real yields falling → tailwind, evidence "falling"', () => {
    const t = goldTailwindScore([reading('real-yield-10y', FALLING_RATES)]);
    expect(t.voters[0]).toMatchObject({ id: 'real-yield-10y', impact: 'tailwind', evidence: 'falling' });
  });

  it('a steady series parked mid-range never fires (lean 0 — honestly absent)', () => {
    const t = goldTailwindScore([reading('real-yield-10y', { change30d: 0.02, percentile10y: 0.5 })]);
    expect(t.voters).toEqual([]);
    expect(t.label).toBeNull();
  });

  it('stale, check-pending and unavailable readings never fire', () => {
    for (const status of ['stale', 'check-pending', 'unavailable'] as const) {
      const t = goldTailwindScore([reading('real-yield-10y', { ...HIGH, status })]);
      expect(t.voters, status).toEqual([]);
    }
  });

  it('a qualifying direction outranks the level for the evidence word (falling while high → "falling")', () => {
    const t = goldTailwindScore([reading('real-yield-10y', { ...HIGH, ...FALLING_RATES })]);
    expect(t.voters[0]!.evidence).toBe('falling');
    expect(t.voters[0]!.impact).toBe('tailwind'); // falling rates × −1 polarity
  });

  it('the polarity table spot-checks: each lane maps its lean the documented way', () => {
    // dollar high (strong) → headwind; stress indexes high → tailwind; the
    // crowded-long COT decade-high → headwind (contrarian); an inverted
    // curve (low) → tailwind; hot CPI → tailwind. (Duplicate ids in the
    // input array keep the LAST occurrence — the Map constructor's own
    // rule; the snapshot itself never carries duplicates, the schema
    // refuses them.)
    const t = goldTailwindScore([
      reading('dollar-basket', LOW),
      reading('dollar-basket', HIGH), // the later row wins the Map
      reading('stress-stlfsi', HIGH),
      reading('cftc-gold-positioning', HIGH),
      reading('yield-curve-10y3m', LOW),
      reading('us-cpi-yoy', HIGH),
    ]);
    const byId = new Map(t.voters.map((v) => [v.id as string, v]));
    expect(byId.get('dollar-basket')!.impact).toBe('headwind');
    expect(byId.get('stress-stlfsi')!.impact).toBe('tailwind');
    expect(byId.get('cftc-gold-positioning')!.impact).toBe('headwind');
    expect(byId.get('yield-curve-10y3m')!.impact).toBe('tailwind');
    expect(byId.get('us-cpi-yoy')!.impact).toBe('tailwind');
    expect(t.voters.filter((v) => v.id === 'dollar-basket')).toHaveLength(1);
  });
});

describe('the four lane readings (sub-gauge words)', () => {
  it('borrowing costs: unanimous tailwind reads RELIEF, unanimous headwind TIGHT, disagreement MIXED, silence UNREADABLE', () => {
    expect(sub([reading('real-yield-10y', FALLING_RATES), reading('us10y', LOW)], 'borrowing-costs').reading).toBe('relief');
    expect(sub([reading('real-yield-10y', HIGH), reading('us10y', RISING_RATES)], 'borrowing-costs').reading).toBe('tight');
    expect(sub([reading('real-yield-10y', HIGH), reading('us10y', LOW)], 'borrowing-costs').reading).toBe('mixed');
    expect(sub([reading('gold-usd', HIGH)], 'borrowing-costs').reading).toBe('unreadable');
  });

  it('the dollar lane: tailwind reads STRESS (the dollar under stress), headwind STRONG', () => {
    expect(sub([reading('dollar-basket', LOW), reading('usdjpy', LOW)], 'dollar').reading).toBe('stress');
    expect(sub([reading('dollar-basket', HIGH), reading('usdjpy', HIGH)], 'dollar').reading).toBe('strong');
  });

  it('the market-stress lane: tailwind reads ELEVATED, headwind CALM', () => {
    expect(sub([reading('stress-stlfsi', HIGH), reading('nfci', HIGH)], 'stress').reading).toBe('elevated');
    expect(sub([reading('stress-stlfsi', LOW), reading('nfci', LOW)], 'stress').reading).toBe('calm');
  });

  it('the inflation lane: tailwind reads HOT, headwind COOL', () => {
    expect(sub([reading('us-cpi-yoy', HIGH), reading('breakeven-5y5y', { change30d: 0.2 })], 'inflation').reading).toBe('hot');
    expect(sub([reading('us-cpi-yoy', LOW), reading('euro-hicp', LOW)], 'inflation').reading).toBe('cool');
  });

  it('lane counts: only the directional lane words count, mixed counts as mixed, unreadable counts nowhere', () => {
    const t = goldTailwindScore([
      // borrowing costs: relief (2 tailwind voters)
      reading('real-yield-10y', FALLING_RATES),
      reading('us10y', LOW),
      // dollar: strong (2 headwind voters)
      reading('dollar-basket', HIGH),
      reading('usdjpy', HIGH),
      // stress: high + low → mixed
      reading('stress-stlfsi', HIGH),
      reading('nfci', LOW),
      // inflation: silent → unreadable
    ]);
    expect(t.laneCounts).toEqual({ tailwind: 1, headwind: 1, mixed: 1 });
    expect(t.subGauges.map((g) => g.lane)).toEqual([...GOLD_LANES]);
  });

  it('each sub-gauge carries its own firing counts', () => {
    const g = sub(
      [reading('real-yield-10y', FALLING_RATES), reading('us10y', HIGH), reading('us30y', LOW)],
      'borrowing-costs',
    );
    expect(g.tailwindVoters).toBe(2);
    expect(g.headwindVoters).toBe(1);
  });
});

describe('the net score and the 5-step label', () => {
  it('the net score is tailwind voters − headwind voters over the firing count', () => {
    const t = goldTailwindScore([
      reading('real-yield-10y', FALLING_RATES),
      reading('us10y', LOW),
      reading('us30y', LOW),
      reading('dollar-basket', HIGH),
    ]);
    expect(t.firingVoters).toBe(4);
    expect(t.tailwindVoters).toBe(3);
    expect(t.headwindVoters).toBe(1);
    expect(t.netScore).toBe(2);
  });

  it('nothing firing → label null (never a made-up word)', () => {
    expect(goldTailwindScore([reading('gold-usd', HIGH)]).label).toBeNull();
  });

  it(`a single firing voter never reads "strong" (the ${GOLD_STRONG_MIN_FIRING}-driver crowd minimum)`, () => {
    const t = goldTailwindScore([reading('real-yield-10y', FALLING_RATES)]);
    expect(t.label).toBe('tailwind');
    expect(GOLD_STRONG_MIN_FIRING).toBe(3);
  });

  it(`"strong" needs the ${GOLD_STRONG_SHARE} share of firing voters (4–0 and the 3–1 boundary)`, () => {
    expect(GOLD_STRONG_SHARE).toBe(0.5);
    const fourNil = goldTailwindScore([
      reading('real-yield-10y', FALLING_RATES),
      reading('us10y', LOW),
      reading('us30y', LOW),
      reading('fed-target', LOW),
    ]);
    expect(fourNil.label).toBe('strong-tailwind');
    const threeOne = goldTailwindScore([
      reading('real-yield-10y', FALLING_RATES),
      reading('us10y', LOW),
      reading('us30y', LOW),
      reading('stress-stlfsi', LOW), // calm → headwind
    ]);
    expect(threeOne.label).toBe('strong-tailwind'); // 2/4 = 0.5 boundary included
  });

  it('the headwind side mirrors (4–0 → strong-headwind)', () => {
    const t = goldTailwindScore([
      reading('real-yield-10y', HIGH),
      reading('us10y', RISING_RATES),
      reading('us30y', HIGH),
      reading('fed-target', HIGH),
    ]);
    expect(t.label).toBe('strong-headwind');
    expect(t.netScore).toBe(-4);
  });

  it('an equal split reads BALANCED', () => {
    const t = goldTailwindScore([reading('real-yield-10y', FALLING_RATES), reading('us10y', HIGH)]);
    expect(t.label).toBe('balanced');
    expect(t.netScore).toBe(0);
  });

  it('a thin edge over many firing voters stays a plain tailwind (5–4)', () => {
    const t = goldTailwindScore([
      reading('real-yield-10y', FALLING_RATES),
      reading('us10y', LOW),
      reading('us30y', LOW),
      reading('fed-target', LOW),
      reading('fed-expectations', LOW), // no 30-day threshold for this leg — fires via the decade position
      reading('dollar-basket', HIGH),
      reading('usdjpy', HIGH),
      reading('us-japan-10y-gap', HIGH),
      reading('stress-stlfsi', LOW),
    ]);
    expect(t.firingVoters).toBe(9);
    expect(t.netScore).toBe(1);
    expect(t.label).toBe('tailwind');
  });
});

describe('model vs reality (the six chips + the ±2% reality bar)', () => {
  const MODEL_TAILWIND = [reading('real-yield-10y', FALLING_RATES), reading('us10y', LOW), reading('us30y', LOW)];
  const MODEL_HEADWIND = [reading('real-yield-10y', HIGH), reading('us10y', RISING_RATES), reading('us30y', HIGH)];
  const goldAt = (change30d: number): IndicatorReading => reading('gold-usd', { change30d, value: 4166 });

  it('model tailwind + rising gold → aligned-tailwind (change30d basis)', () => {
    const m = modelVsReality([...MODEL_TAILWIND, goldAt(5.2)]);
    expect(m).toMatchObject({
      chip: 'aligned-tailwind',
      modelDirection: 'tailwind',
      realityDirection: 'rising',
      realityBasis: 'change30d',
      realityValue: 5.2,
    });
  });

  it('model headwind + falling gold → aligned-headwind', () => {
    const m = modelVsReality([...MODEL_HEADWIND, goldAt(-6.1)]);
    expect(m.chip).toBe('aligned-headwind');
    expect(m.realityDirection).toBe('falling');
  });

  it('model headwind + rising gold → diverging-up', () => {
    expect(modelVsReality([...MODEL_HEADWIND, goldAt(4.0)]).chip).toBe('diverging-up');
  });

  it('model tailwind + falling gold → diverging-down', () => {
    expect(modelVsReality([...MODEL_TAILWIND, goldAt(-4.0)]).chip).toBe('diverging-down');
  });

  it('a balanced model reads neutral with the model-neutral explainer', () => {
    const m = modelVsReality([reading('real-yield-10y', FALLING_RATES), reading('us10y', HIGH), goldAt(4.0)]);
    expect(m.chip).toBe('neutral');
    expect(m.modelDirection).toBe('neutral');
    expect(modelVsRealityExplainerKey(m)).toBe('model-neutral');
  });

  it('a flat price reads neutral with the reality-flat explainer', () => {
    const m = modelVsReality([...MODEL_TAILWIND, goldAt(0.8)]);
    expect(m.chip).toBe('neutral');
    expect(m.realityDirection).toBe('flat');
    expect(modelVsRealityExplainerKey(m)).toBe('reality-flat');
  });

  it('a missing change30d falls back to the 200-day gap (ma200GapPct basis)', () => {
    const m = modelVsReality([...MODEL_TAILWIND, reading('gold-usd', { value: 4166, ma200GapPct: 8.5 })]);
    expect(m).toMatchObject({ realityBasis: 'ma200GapPct', realityDirection: 'rising', realityValue: 8.5 });
  });

  it('no model (nothing firing) or no readable gold → no-read', () => {
    expect(modelVsReality([goldAt(5)]).chip).toBe('no-read');
    expect(modelVsReality([...MODEL_TAILWIND, reading('gold-usd', { status: 'unavailable', value: null, asOf: null })]).chip).toBe('no-read');
  });

  it(`the reality bar is ±${GOLD_REALITY_SPEED_PCT}% over 30 days (the outlook classifier's own bar, boundaries included)`, () => {
    expect(GOLD_REALITY_SPEED_PCT).toBe(2);
    expect(modelVsReality([goldAt(2)]).realityDirection).toBe('rising');
    expect(modelVsReality([goldAt(-2)]).realityDirection).toBe('falling');
    expect(modelVsReality([goldAt(1.9)]).realityDirection).toBe('flat');
    expect(modelVsReality([goldAt(-1.9)]).realityDirection).toBe('flat');
  });
});

describe('the compact wire shape + the EN copy blocks', () => {
  const READINGS = [
    reading('real-yield-10y', FALLING_RATES),
    reading('us10y', LOW),
    reading('us30y', LOW),
    reading('stress-stlfsi', LOW),
    reading('dollar-basket', HIGH),
    reading('us-cpi-yoy', HIGH),
    reading('gold-usd', { value: 4166, change30d: 5.4 }),
  ];

  it('goldSummaryOf round-trips GoldSummarySchema (the snapshot field it becomes)', () => {
    const compact = goldSummaryOf(READINGS);
    expect(() => GoldSummarySchema.parse(compact)).not.toThrow();
    expect(GoldSummarySchema.parse(compact)).toEqual(compact);
  });

  it('the compact summary carries the numbers, never the voter list', () => {
    const full = goldTailwindScore(READINGS);
    const compact = goldSummaryOf(READINGS);
    expect(compact).not.toHaveProperty('voters');
    expect(compact.netScore).toBe(full.netScore);
    expect(compact.label).toBe(full.label);
    expect(compact.firingVoters).toBe(full.firingVoters);
    expect(compact.tailwindVoters).toBe(full.tailwindVoters);
    expect(compact.headwindVoters).toBe(full.headwindVoters);
    expect(compact.laneCounts).toEqual(full.laneCounts);
    expect(compact.subGauges).toEqual(full.subGauges);
    expect(compact.modelVsReality).toEqual(modelVsReality(READINGS));
    expect(compact.subGauges).toHaveLength(4);
  });

  it('the label copy covers all five steps, non-empty', () => {
    const labels = GOLD_PANEL_COPY_EN.labels;
    for (const label of ['strong-tailwind', 'tailwind', 'balanced', 'headwind', 'strong-headwind'] as const) {
      expect(labels[label], label).toBeTruthy();
    }
    expect(GOLD_PANEL_COPY_EN.noReadWord).toBeTruthy();
  });

  it('the voter-name copy covers EXACTLY the voter table, all non-empty', () => {
    const names = GOLD_PANEL_COPY_EN.voterNames;
    const tableIds = GOLD_LANE_VOTERS.map((v) => v.id as string);
    expect(Object.keys(names).sort()).toEqual([...new Set(tableIds)].sort());
    for (const id of tableIds) expect(names[id as keyof typeof names], id).toBeTruthy();
  });

  it('the lane/word/evidence/impact copy is complete', () => {
    for (const lane of GOLD_LANES) expect(GOLD_PANEL_COPY_EN.laneNames[lane], lane).toBeTruthy();
    const words: GoldSubGaugeWord[] = [
      'tight', 'relief', 'strong', 'stress', 'elevated', 'calm', 'hot', 'cool', 'mixed', 'unreadable',
    ];
    for (const w of words) expect(GOLD_PANEL_COPY_EN.subGaugeWords[w], w).toBeTruthy();
    for (const e of ['rising', 'falling', 'high', 'low'] as const) {
      expect(GOLD_PANEL_COPY_EN.evidenceWords[e], e).toBeTruthy();
    }
    expect(GOLD_PANEL_COPY_EN.impactWords.tailwind).toBeTruthy();
    expect(GOLD_PANEL_COPY_EN.impactWords.headwind).toBeTruthy();
  });

  it('the chip + explainer copy covers all six chips and all seven explainer keys', () => {
    const chips = [
      'aligned-tailwind', 'aligned-headwind', 'diverging-up', 'diverging-down', 'neutral', 'no-read',
    ] as const;
    for (const c of chips) expect(MODEL_VS_REALITY_COPY_EN.chips[c], c).toBeTruthy();
    for (const k of [
      'aligned-tailwind', 'aligned-headwind', 'diverging-up', 'diverging-down', 'model-neutral', 'reality-flat', 'no-read',
    ] as const) {
      expect(MODEL_VS_REALITY_COPY_EN.explainers[k], k).toBeTruthy();
    }
    expect(MODEL_VS_REALITY_COPY_EN.basisPhrases.change30d).toBeTruthy();
    expect(MODEL_VS_REALITY_COPY_EN.basisPhrases.ma200GapPct).toBeTruthy();
  });

  it('the explainer keys map every chip (never an undefined lookup)', () => {
    const base = modelVsReality(READINGS);
    for (const chip of ['aligned-tailwind', 'aligned-headwind', 'diverging-up', 'diverging-down', 'no-read'] as const) {
      expect(modelVsRealityExplainerKey({ ...base, chip })).toBe(chip);
    }
    expect(modelVsRealityExplainerKey({ ...base, chip: 'neutral', modelDirection: 'neutral' })).toBe('model-neutral');
    expect(modelVsRealityExplainerKey({ ...base, chip: 'neutral', modelDirection: 'tailwind' })).toBe('reality-flat');
  });
});
