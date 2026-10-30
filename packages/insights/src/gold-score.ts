/**
 * The gold-directional scoring engine (the Gold Program, session S1).
 *
 * ONE question: do the classic macro drivers currently lean WITH gold or
 * AGAINST it? The engine re-cuts the EXISTING gauge voters — the same
 * readings the page already holds — into a single directional score:
 *
 *   - 4 LANES (sub-gauges): borrowing costs (tight/relief), the dollar
 *     (strong/under stress), market stress (elevated/calm) and inflation
 *     (running hot/cooling). Each lane's reading comes from its firing
 *     voters, never from a new fetch;
 *   - FIRING VOTERS: a voter fires when the shared signals evaluator
 *     (connections.ts evalLeg — direction over 30 days with a per-leg
 *     minimum move, else the 10-year position) leans ±1, and its lean is
 *     mapped onto gold through a fixed polarity table below;
 *   - THE NET SCORE: tailwind voters − headwind voters, labelled on a
 *     5-step scale (strong tailwind → strong headwind) with the same
 *     share-based philosophy as the question gauges;
 *   - MODEL VS REALITY: the score's direction compared with what gold
 *     ACTUALLY did over the past 30 days (aligned / diverging / neutral).
 *
 * Descriptive, hedged, never advice (the signals-card contract): the
 * words say "the drivers lean", never "buy" or "sell", and no green/red
 * — words and counts only.
 *
 * Pure, platform-free (AGENTS.md rule 2): reads the snapshot the page or
 * the runner already holds; zero new fetches, zero KV ops. The ingest
 * writes the COMPACT summary (goldSummaryOf — the numbers, not the
 * voter list) onto the snapshot (~0.5 KB); the SPA re-derives the full
 * reading client-side through this SAME module (the gauges.ts contract:
 * one pure function, both sides, no drift).
 *
 * Session S1 deliberately ships EN copy only (GOLD_PANEL_COPY_EN /
 * MODEL_VS_REALITY_COPY_EN here, NOT the web i18n dictionaries — the
 * Persian-copy audit gate stays closed until the S5 translation round).
 */

import type { GoldSummary, IndicatorId, IndicatorReading } from '@currena/core';
import { evalLeg } from './connections';

/* ------------------------------------------------------------------ *
 * The vocabulary
 * ------------------------------------------------------------------ */

/** The four driver lanes, in display order. */
export const GOLD_LANES = ['borrowing-costs', 'dollar', 'stress', 'inflation'] as const;
export type GoldLane = (typeof GOLD_LANES)[number];

/** What a firing voter does to gold. */
export type GoldVoterImpact = 'tailwind' | 'headwind';

/**
 * WHY a voter fired — the shared evaluator's own evidence: a 30-day
 * direction beyond the per-leg minimum move ('rising'/'falling'), or a
 * decade-extreme LEVEL when the series is steady ('high'/'low').
 */
export type GoldVoterEvidence = 'rising' | 'falling' | 'high' | 'low';

/** One firing voter. */
export interface GoldVoter {
  id: IndicatorId;
  lane: GoldLane;
  impact: GoldVoterImpact;
  evidence: GoldVoterEvidence;
}

/**
 * A lane's word — the four directional pairs plus the honest shared pair.
 * 'unreadable' = no voter in the lane could fire (never a guess).
 */
export type GoldSubGaugeWord =
  | 'tight' | 'relief' // borrowing-costs: relief = tailwind for gold
  | 'strong' | 'stress' // dollar: strong = headwind, under stress = tailwind
  | 'elevated' | 'calm' // market stress: elevated = tailwind (safe haven)
  | 'hot' | 'cool' // inflation: running hot = tailwind (hedge demand)
  | 'mixed' | 'unreadable'; // any lane: disagreement / nothing firing

/** One lane's reading (voter counts are the lane's own firing detail). */
export interface GoldSubGaugeReading {
  lane: GoldLane;
  reading: GoldSubGaugeWord;
  tailwindVoters: number;
  headwindVoters: number;
}

/** The 5-step label (null when nothing could fire — never invented). */
export type GoldTailwindLabel =
  | 'strong-tailwind'
  | 'tailwind'
  | 'balanced'
  | 'headwind'
  | 'strong-headwind';

/** The engine's full reading (the compact wire shape minus the voters). */
export interface GoldTailwindReading {
  /** tailwind voters − headwind voters (signed). */
  netScore: number;
  label: GoldTailwindLabel | null;
  /** Voters that fired (either direction). */
  firingVoters: number;
  tailwindVoters: number;
  headwindVoters: number;
  /** How many of the four LANES read tailwind / headwind / mixed. */
  laneCounts: { tailwind: number; headwind: number; mixed: number };
  /** The four lane readings, in GOLD_LANES order. */
  subGauges: readonly GoldSubGaugeReading[];
  /** The firing voters, in lane order then table order. */
  voters: readonly GoldVoter[];
}

/* ------------------------------------------------------------------ *
 * The voter table — the classic driver relationships, one polarity each
 * ------------------------------------------------------------------ */

/**
 * The gold polarity of one voter's lean: gold direction = lean × polarity.
 * +1: the lean's positive direction (rising/high) is a TAILWIND for gold.
 * −1: the lean's positive direction is a HEADWIND.
 *
 * Curated from the gauge voters — NOT every gauge member rides along:
 * govt-interest-revenue stays out (a fiscal-sustainability share whose
 * gold signal is contested — high interest costs argue both ways), and
 * the growth-health lane stays out entirely (its members' gold relation
 * is weak or two-sided; copper-gold is already a ratio ABOUT gold).
 * Brent stays out of the inflation lane (supply shocks are not the
 * hedge-demand channel the lane measures).
 */
export interface GoldLaneVoter {
  lane: GoldLane;
  id: IndicatorId;
  polarity: 1 | -1;
}

/** The 20 voters (8 borrowing costs · 3 dollar · 5 stress · 4 inflation). */
export const GOLD_LANE_VOTERS: readonly GoldLaneVoter[] = [
  // ——— Borrowing costs: TIGHT is the classic gold headwind (real rates
  // ——— are gold's opportunity cost); RELIEF (falling/low rates) the tailwind.
  { lane: 'borrowing-costs', id: 'real-yield-10y', polarity: -1 }, // THE textbook driver
  { lane: 'borrowing-costs', id: 'us10y', polarity: -1 },
  { lane: 'borrowing-costs', id: 'us30y', polarity: -1 },
  { lane: 'borrowing-costs', id: 'fed-target', polarity: -1 }, // high policy rate = tight
  { lane: 'borrowing-costs', id: 'fed-expectations', polarity: -1 }, // 2y above policy = higher-for-longer priced
  { lane: 'borrowing-costs', id: 'ecb-dfr', polarity: -1 },
  { lane: 'borrowing-costs', id: 'yield-curve-10y2y', polarity: -1 }, // steep = reflation; inverted = stress/easing ahead
  { lane: 'borrowing-costs', id: 'yield-curve-10y3m', polarity: -1 },
  // ——— The dollar: STRONG is the headwind (gold is priced in USD); a
  // ——— dollar under STRESS (falling/low) is the tailwind.
  { lane: 'dollar', id: 'dollar-basket', polarity: -1 },
  { lane: 'dollar', id: 'usdjpy', polarity: -1 }, // USD strength against the funding currency
  { lane: 'dollar', id: 'us-japan-10y-gap', polarity: -1 }, // a wide gap is carry fuel — a dollar-positive
  // ——— Market stress: ELEVATED usually supports gold (the safe-haven
  // ——— bid); CALM removes it.
  { lane: 'stress', id: 'stress-stlfsi', polarity: 1 },
  { lane: 'stress', id: 'nfci', polarity: 1 },
  { lane: 'stress', id: 'vix', polarity: 1 },
  { lane: 'stress', id: 'gold-silver', polarity: 1 }, // a high ratio IS the monetary-stress read
  { lane: 'stress', id: 'cftc-gold-positioning', polarity: -1 }, // crowded longs are fragile (the squeeze-then-slump zone — contrarian)
  // ——— Inflation: RUNNING HOT usually supports the hedge demand.
  { lane: 'inflation', id: 'us-cpi-yoy', polarity: 1 },
  { lane: 'inflation', id: 'us-pce-core-yoy', polarity: 1 },
  { lane: 'inflation', id: 'euro-hicp', polarity: 1 },
  { lane: 'inflation', id: 'breakeven-5y5y', polarity: 1 }, // rising inflation expectations
];

/* ------------------------------------------------------------------ *
 * The thresholds (documented, shared where they exist elsewhere)
 * ------------------------------------------------------------------ */

/**
 * The "strong" bar as a SHARE of firing voters (the gauge-step
 * philosophy): at least half the firing evidence on one side. With
 * 1–2 drivers firing even unanimously, the honest word stays
 * tailwind/headwind — "strong" needs a crowd.
 */
export const GOLD_STRONG_SHARE = 0.5;

/** The minimum FIRING count before a label may say "strong". */
export const GOLD_STRONG_MIN_FIRING = 3;

/**
 * The reality bar: |30-day move| ≥ 2% is a real rise/fall — the SAME
 * 2%-over-30-days bar the outlook classifier's range-bound state uses
 * (apps/web …/signals/verdict.ts RANGE_SPEED_PCT; restated here because
 * the package cannot import the app).
 */
export const GOLD_REALITY_SPEED_PCT = 2;

/* ------------------------------------------------------------------ *
 * The engine
 * ------------------------------------------------------------------ */

/** The readable-voter rule (the signals cards' own): stale, check-pending
 * and unavailable readings never fire. */
function readable(r: IndicatorReading | undefined): r is IndicatorReading {
  return r !== undefined && r.status !== 'stale' && r.status !== 'check-pending' && r.status !== 'unavailable';
}

/** The lane's directional word for its tailwind / headwind side. */
const LANE_TAILWIND_WORD: Record<GoldLane, GoldSubGaugeWord> = {
  'borrowing-costs': 'relief',
  dollar: 'stress',
  stress: 'elevated',
  inflation: 'hot',
};
const LANE_HEADWIND_WORD: Record<GoldLane, GoldSubGaugeWord> = {
  'borrowing-costs': 'tight',
  dollar: 'strong',
  stress: 'calm',
  inflation: 'cool',
};

/**
 * The gold tailwind score — pure over the readings (the ingest's writer
 * and the SPA's re-derivation call the SAME function).
 */
export function goldTailwindScore(readings: readonly IndicatorReading[]): GoldTailwindReading {
  const byId = new Map(readings.map((r) => [r.id as string, r]));

  const voters: GoldVoter[] = [];
  for (const def of GOLD_LANE_VOTERS) {
    const r = byId.get(def.id);
    if (!readable(r)) continue;
    const leg = evalLeg(def.id, r);
    if (leg.lean === 0) continue; // steady AND typical — honestly not firing
    const impact: GoldVoterImpact = leg.lean * def.polarity === 1 ? 'tailwind' : 'headwind';
    // The evidence that produced the lean, in the evaluator's own order:
    // a qualifying 30-day direction first, else the decade-extreme level.
    const evidence: GoldVoterEvidence =
      leg.direction === 'rising' ? 'rising' : leg.direction === 'falling' ? 'falling' : leg.level === 'high' ? 'high' : 'low';
    voters.push({ id: def.id, lane: def.lane, impact, evidence });
  }

  const tailwindVoters = voters.filter((v) => v.impact === 'tailwind').length;
  const headwindVoters = voters.filter((v) => v.impact === 'headwind').length;
  const firingVoters = tailwindVoters + headwindVoters;
  const netScore = tailwindVoters - headwindVoters;

  // The label: share-based like the gauge steps, with the crowd minimum.
  let label: GoldTailwindLabel | null;
  if (firingVoters === 0) label = null;
  else if (netScore > 0 && firingVoters >= GOLD_STRONG_MIN_FIRING && netScore / firingVoters >= GOLD_STRONG_SHARE) {
    label = 'strong-tailwind';
  } else if (netScore > 0) label = 'tailwind';
  else if (netScore === 0) label = 'balanced';
  else if (netScore < 0 && firingVoters >= GOLD_STRONG_MIN_FIRING && -netScore / firingVoters >= GOLD_STRONG_SHARE) {
    label = 'strong-headwind';
  } else label = 'headwind';

  // The four lane readings + the lane counts.
  const subGauges: GoldSubGaugeReading[] = GOLD_LANES.map((lane) => {
    const laneVoters = voters.filter((v) => v.lane === lane);
    const t = laneVoters.filter((v) => v.impact === 'tailwind').length;
    const h = laneVoters.filter((v) => v.impact === 'headwind').length;
    let reading: GoldSubGaugeWord;
    if (t === 0 && h === 0) reading = 'unreadable';
    else if (t > 0 && h > 0) reading = 'mixed'; // the lane's evidence disagrees
    else if (t > 0) reading = LANE_TAILWIND_WORD[lane];
    else reading = LANE_HEADWIND_WORD[lane];
    return { lane, reading, tailwindVoters: t, headwindVoters: h };
  });
  const laneCounts = {
    tailwind: subGauges.filter((g) => g.reading === LANE_TAILWIND_WORD[g.lane]).length,
    headwind: subGauges.filter((g) => g.reading === LANE_HEADWIND_WORD[g.lane]).length,
    mixed: subGauges.filter((g) => g.reading === 'mixed').length,
  };

  return {
    netScore,
    label,
    firingVoters,
    tailwindVoters,
    headwindVoters,
    laneCounts,
    subGauges,
    voters,
  };
}

/* ------------------------------------------------------------------ *
 * Model vs reality
 * ------------------------------------------------------------------ */

export type GoldModelDirection = 'tailwind' | 'headwind' | 'neutral';
export type GoldRealityDirection = 'rising' | 'falling' | 'flat';

/** The comparison chip (the panel's one-word state). */
export type ModelVsRealityChip =
  | 'aligned-tailwind'
  | 'aligned-headwind'
  | 'diverging-up'
  | 'diverging-down'
  | 'neutral'
  | 'no-read';

export interface ModelVsRealityReading {
  chip: ModelVsRealityChip;
  /** The model's lean (from the tailwind label; null = cannot read). */
  modelDirection: GoldModelDirection | null;
  /** What gold actually did (null = no readable price evidence). */
  realityDirection: GoldRealityDirection | null;
  /** Which price field the reality read. */
  realityBasis: 'change30d' | 'ma200GapPct' | null;
  /** The signed percent the reality read (for the explainer sentence). */
  realityValue: number | null;
}

/**
 * Compare the model with the market: the tailwind label's direction vs
 * gold's own recent move. Reality prefers the 30-day change (the
 * outlook's own window); a missing change30d falls back to the 200-day
 * average gap; neither exists → 'no-read', never a guess.
 *
 * NOTE (the honest one-tick skew): the ingest stamps this at build time
 * from the stored readings; the serve path's live-prices overlay can
 * refresh gold-usd's change fields afterwards, so the chip can lag the
 * page's tile by one hourly tick. The ±2% bar makes a flip rare, and the
 * panel's driver list always derives from the page's current readings.
 */
export function modelVsReality(readings: readonly IndicatorReading[]): ModelVsRealityReading {
  const score = goldTailwindScore(readings);
  const modelDirection: GoldModelDirection | null =
    score.label === 'strong-tailwind' || score.label === 'tailwind'
      ? 'tailwind'
      : score.label === 'strong-headwind' || score.label === 'headwind'
        ? 'headwind'
        : score.label === 'balanced'
          ? 'neutral'
          : null;

  const gold = readings.find((r) => r.id === 'gold-usd');
  let realityDirection: GoldRealityDirection | null = null;
  let realityBasis: 'change30d' | 'ma200GapPct' | null = null;
  let realityValue: number | null = null;
  if (readable(gold)) {
    if (gold.change30d !== undefined && Number.isFinite(gold.change30d)) {
      realityBasis = 'change30d';
      realityValue = gold.change30d;
    } else if (gold.ma200GapPct !== undefined && Number.isFinite(gold.ma200GapPct)) {
      realityBasis = 'ma200GapPct';
      realityValue = gold.ma200GapPct;
    }
    if (realityValue !== null) {
      if (realityValue >= GOLD_REALITY_SPEED_PCT) realityDirection = 'rising';
      else if (realityValue <= -GOLD_REALITY_SPEED_PCT) realityDirection = 'falling';
      else realityDirection = 'flat';
    }
  }

  let chip: ModelVsRealityChip;
  if (modelDirection === null || realityDirection === null) chip = 'no-read';
  else if (modelDirection === 'neutral' || realityDirection === 'flat') chip = 'neutral';
  else if (modelDirection === 'tailwind') chip = realityDirection === 'rising' ? 'aligned-tailwind' : 'diverging-down';
  else chip = realityDirection === 'falling' ? 'aligned-headwind' : 'diverging-up';

  return { chip, modelDirection, realityDirection, realityBasis, realityValue };
}

/**
 * The explainer KEY for a comparison (pure so the panel never chooses
 * copy): the 'neutral' chip splits into its two honest causes — the model
 * has no lean, or the price has not moved.
 */
export function modelVsRealityExplainerKey(
  mvr: ModelVsRealityReading,
): 'aligned-tailwind' | 'aligned-headwind' | 'diverging-up' | 'diverging-down' | 'model-neutral' | 'reality-flat' | 'no-read' {
  if (mvr.chip === 'no-read') return 'no-read';
  if (mvr.chip === 'neutral') return mvr.modelDirection === 'neutral' ? 'model-neutral' : 'reality-flat';
  return mvr.chip;
}

/* ------------------------------------------------------------------ *
 * The compact wire shape (what rides the snapshot / the KV write)
 * ------------------------------------------------------------------ */

/**
 * The ingest's writer: the full reading's numbers + the comparison,
 * WITHOUT the voter list (the SPA re-derives the voters client-side —
 * the same pure module). ~0.5 KB of JSON, zero new fetches; validated
 * by InsightsSnapshotSchema's optional goldSummary field (core).
 */
export function goldSummaryOf(readings: readonly IndicatorReading[]): GoldSummary {
  const t = goldTailwindScore(readings);
  return {
    netScore: t.netScore,
    label: t.label,
    firingVoters: t.firingVoters,
    tailwindVoters: t.tailwindVoters,
    headwindVoters: t.headwindVoters,
    laneCounts: t.laneCounts,
    subGauges: t.subGauges.map((g) => ({
      lane: g.lane,
      reading: g.reading,
      tailwindVoters: g.tailwindVoters,
      headwindVoters: g.headwindVoters,
    })),
    modelVsReality: modelVsReality(readings),
  };
}

/* ------------------------------------------------------------------ *
 * EN copy (S1 ships English only — the fa translation is S5's audit-
 * gated round; it lives HERE, not in the web dictionaries, so the
 * Persian-copy audit stays closed until the reviewed fa lands)
 * ------------------------------------------------------------------ */

/** The GoldTailwindPanel's English copy. */
export const GOLD_PANEL_COPY_EN = {
  title: 'Gold tailwind score',
  subtitle: 'The macro drivers, re-cut for gold direction',
  netScoreLabel: 'Net score',
  /** null label (nothing firing) — never a made-up word. */
  noReadWord: 'Cannot read yet',
  labels: {
    'strong-tailwind': 'Strong tailwind',
    tailwind: 'Tailwind',
    balanced: 'Balanced',
    headwind: 'Headwind',
    'strong-headwind': 'Strong headwind',
  } as Record<GoldTailwindLabel, string>,
  firingLine: '{firing} of {total} drivers firing',
  firingNone: 'No driver is firing right now',
  laneCountsLabel: 'Lanes',
  laneCountsLine: '{tailwind} tailwind · {headwind} headwind · {mixed} mixed',
  lanesTitle: 'The four lanes',
  laneNames: {
    'borrowing-costs': 'Borrowing costs',
    dollar: 'Dollar',
    stress: 'Market stress',
    inflation: 'Inflation',
  } as Record<GoldLane, string>,
  /** The lane word's display form ('stress' reads better as "under stress"). */
  subGaugeWords: {
    tight: 'tight',
    relief: 'relief',
    strong: 'strong',
    stress: 'under stress',
    elevated: 'elevated',
    calm: 'calm',
    hot: 'running hot',
    cool: 'cooling',
    mixed: 'mixed',
    unreadable: 'no read',
  } as Record<GoldSubGaugeWord, string>,
  votersTitle: 'Firing drivers',
  votersNone: 'None firing',
  voterNames: {
    'real-yield-10y': 'Real yields',
    us10y: 'US 10-year yield',
    us30y: 'US 30-year yield',
    'fed-target': 'Fed funds target',
    'fed-expectations': 'Fed expectations',
    'ecb-dfr': 'ECB deposit rate',
    'yield-curve-10y2y': '10y−2y curve',
    'yield-curve-10y3m': '10y−3m curve',
    'dollar-basket': 'Dollar basket',
    usdjpy: 'USD/JPY',
    'us-japan-10y-gap': 'US−Japan 10y gap',
    'stress-stlfsi': 'STLFSI',
    nfci: 'NFCI',
    vix: 'VIX',
    'gold-silver': 'Gold/silver ratio',
    'cftc-gold-positioning': 'Gold positioning (COT)',
    'us-cpi-yoy': 'US CPI',
    'us-pce-core-yoy': 'US core PCE',
    'euro-hicp': 'Euro HICP',
    'breakeven-5y5y': '5y5y breakeven',
  } as Record<(typeof GOLD_LANE_VOTERS)[number]['id'], string>,
  evidenceWords: {
    rising: 'rising',
    falling: 'falling',
    high: 'high in its decade',
    low: 'low in its decade',
  } as Record<GoldVoterEvidence, string>,
  impactWords: {
    tailwind: 'tailwind',
    headwind: 'headwind',
  } as Record<GoldVoterImpact, string>,
  footnote: 'A descriptive score of the classic driver relationships — conditions, not advice.',
};

/** The ModelVsRealityPanel's English copy. */
export const MODEL_VS_REALITY_COPY_EN = {
  title: 'Model vs reality',
  subtitle: 'Does the macro score agree with what gold actually did?',
  chips: {
    'aligned-tailwind': 'Aligned — tailwind',
    'aligned-headwind': 'Aligned — headwind',
    'diverging-up': 'Diverging — gold rising anyway',
    'diverging-down': 'Diverging — gold falling anyway',
    neutral: 'No gap to read',
    'no-read': 'Not enough data',
  } as Record<ModelVsRealityChip, string>,
  explainers: {
    'aligned-tailwind':
      'The macro drivers lean supportive and gold has moved {value} {basis} — the move has company.',
    'aligned-headwind':
      'The macro drivers lean against gold and the price has moved {value} {basis} — the weakness has company.',
    'diverging-up':
      'The macro drivers lean against gold, yet the price has moved {value} {basis} — the market is fighting the model.',
    'diverging-down':
      'The macro drivers lean supportive, yet the price has moved {value} {basis} — the market is not following the drivers.',
    'model-neutral': 'The macro drivers show no clear lean for gold right now.',
    'reality-flat': 'Gold has held roughly flat ({value} {basis}) — no model-vs-market gap to read.',
    'no-read': 'Not enough fresh data to compare the model with the market.',
  } as Record<ReturnType<typeof modelVsRealityExplainerKey>, string>,
  basisPhrases: {
    change30d: 'over the past 30 days',
    ma200GapPct: 'vs its 200-day average',
  } as Record<'change30d' | 'ma200GapPct', string>,
  footnote: 'The model reads the drivers; reality reads the price. Both can be wrong.',
};
