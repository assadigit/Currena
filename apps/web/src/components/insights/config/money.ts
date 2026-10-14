/**
 * "What it means for my money" — the area map, worst-state selection,
 * the stated-estimation driver votes, and the policy-rate card helpers
 * (Phase 3-c split of the former config.ts monolith — see ./index.ts).
 * Pure, platform-free.
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { MOVE_SCORE_THRESHOLD, WORD_TONE_CLASS, bandPositionOf } from './bands';
import { tierOf } from './movers';
import { definitionFor } from './sections';

/* ------------------------------------------------------------------ *
 * Round-2 R11: "What it means for my money" — area map + worst-state
 * selection (at most 4 lines, calm fallback).
 * ------------------------------------------------------------------ */

export type MoneyAreaId = 'petrol' | 'homeLoan' | 'savings' | 'shop' | 'overseas' | 'jobs';
type MoneyAreaState = 'attention' | 'unusual' | 'calm';

export const MONEY_AREAS: Readonly<Record<MoneyAreaId, readonly IndicatorId[]>> = {
  petrol: ['brent', 'au-petrol-yoy', 'audusd'],
  homeLoan: ['rba-cash-rate', 'au-home-loan', 'au-rent-yoy', 'au-household-debt-arrears'],
  // Step-2 add-list §B7: the savings row leads with the REAL deposit rate
  // (RBA F4.1 new household term deposits); the cash rate and CPI stay as
  // its state drivers beside it.
  savings: ['au-deposit-rate', 'rba-cash-rate', 'au-cpi'],
  shop: ['au-cpi', 'au-trimmed-mean'],
  overseas: ['audusd', 'audjpy', 'dollar-basket'],
  jobs: ['au-unemployment', 'au-wage-growth'],
};

interface MoneyAreaRow {
  area: MoneyAreaId;
  state: MoneyAreaState;
  /** The indicators driving the state (up to two chips). */
  chipIds: readonly IndicatorId[];
}

export function moneyAreaRow(area: MoneyAreaId, readings: readonly IndicatorReading[]): MoneyAreaRow {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  const rows = MONEY_AREAS[area].map((id) => byId.get(id)).filter((r): r is IndicatorReading => r !== undefined);
  const attention = rows.filter((r) => tierOf(r) === 'needs-attention');
  const unusual = rows.filter((r) => tierOf(r) === 'unusual');
  if (attention.length > 0) {
    // Step-1 audit item C8 → Step-2 add-list §B7: the SAVINGS row leads with
    // the real deposit rate (RBA F4.1) — the number the row actually shows
    // — falling back to the cash rate when the deposit series is absent.
    const chips = attention.slice(0, 2).map((r) => r.id);
    if (area === 'savings' && !chips.includes('au-deposit-rate')) {
      chips.unshift(byId.has('au-deposit-rate') ? 'au-deposit-rate' : 'rba-cash-rate');
    }
    return { area, state: 'attention', chipIds: chips.slice(0, 2) };
  }
  if (unusual.length > 0) {
    return { area, state: 'unusual', chipIds: unusual.slice(0, 2).map((r) => r.id) };
  }
  // Calm savings still shows the real deposit rate (the number it renders).
  if (area === 'savings') {
    return { area, state: 'calm', chipIds: [byId.has('au-deposit-rate') ? 'au-deposit-rate' : 'rba-cash-rate'] };
  }
  return { area, state: 'calm', chipIds: [] };
}

/** The ≤4 lines for the panel: attention areas first, then unusual, map
 * order within a tier. Empty → the calm fallback line (component-side). */
export function moneyPanel(readings: readonly IndicatorReading[]): MoneyAreaRow[] {
  const rows = (Object.keys(MONEY_AREAS) as MoneyAreaId[]).map((area) => moneyAreaRow(area, readings));
  const attention = rows.filter((r) => r.state === 'attention');
  const unusual = rows.filter((r) => r.state === 'unusual');
  return [...attention, ...unusual].slice(0, 4);
}

/* ------------------------------------------------------------------ *
 * Round 25 (owner): a stated estimation under every money row — the
 * gold-and-silver card's estimation language (round 23), cost-worded
 * per the owner's round-26 follow-up ("Becoming more expensive", not
 * a bare "will go up"), computed from the area's own driver
 * readings (the owner: "it must be based on calculations and data").
 *
 * One vote per driver, first match wins:
 *   1. a published band breach (e.g. CPI above the RBA's 2–3% band) —
 *      the strongest causal claim the corpus itself makes;
 *   2. a statistically big move (|moveScore| ≥ the jumping threshold)
 *      — the change tends to feed through ("pump prices follow");
 *   3. a 10-year extreme level (position band high/low).
 * The vote then passes through the driver's semantic sign:
 *   direct  — the driver IS the area's number or its input level
 *             (brent, the cash rate, the paid mortgage rate);
 *   inverse — FX (a FALLING AUD makes imports and travel dearer);
 *   growth  — the driver is a growth RATE of the area's cost (CPI,
 *             rent yoy, petrol yoy): it votes up on a breach, an
 *             extreme or a big acceleration but NEVER down — a growth
 *             series below its range still means costs RISING, just
 *             slower (rent growth at its 10-year low is not "rents
 *             will get cheaper"), so a "cheaper" claim must come from
 *             a level series actually falling (oil down, AUD up, the
 *             cash rate being cut);
 *   none    — consequence or mixed-semantics indicators (debt
 *             arrears, jobs/pay) don't vote.
 * Tally = majority of votes; tie or silence → 'flat' ("no clear
 * direction" — the honest answer when nothing unusual is readable).
 *
 * Colour is VALENCE-coded, not direction-coded: the round-22 owner
 * override made the METALS card direction-coded because the owner
 * HOLDS metal (up = good). Here the household PAYS: green = good for
 * your money, red = pressure on it — "petrol — becoming more
 * expensive" warns in alert red while "savings — earning more
 * interest" reassures in green (the words follow the same valence,
 * round 26). The arrow always matches the word — never colour alone
 * (G5).
 * ---------------------------------------------------------------- */

type MoneyDriverKind = 'direct' | 'inverse' | 'growth' | 'none';
export type MoneyDirection = 'up' | 'down' | 'flat';

/** Only the money-area drivers need semantics; every other id
 * defaults to 'none'. */
export const MONEY_DRIVER_KIND: Partial<Record<IndicatorId, MoneyDriverKind>> = {
  brent: 'direct',
  'au-petrol-yoy': 'growth',
  audusd: 'inverse',
  'rba-cash-rate': 'direct',
  'au-deposit-rate': 'direct',
  'au-home-loan': 'direct',
  'au-rent-yoy': 'growth',
  'au-household-debt-arrears': 'none',
  'au-cpi': 'growth',
  'au-trimmed-mean': 'growth',
  audjpy: 'inverse',
  'dollar-basket': 'direct',
  'au-unemployment': 'none',
  'au-wage-growth': 'none',
};

/** One driver's directional vote (null = abstain). */
export function moneyDriverVote(
  kind: MoneyDriverKind | undefined,
  reading: IndicatorReading,
  band?: { min?: number; max?: number },
): 'up' | 'down' | null {
  if (kind === undefined || kind === 'none' || reading.value === null) return null;
  const inverse = kind === 'inverse';
  // Step-1 audit item D6: a FIRED rule with a direction votes by that
  // direction FIRST — the money label reads from the same rule the card
  // shows (brent's rise rule out of its usual range ⇒ petrol "becoming
  // more expensive", never "no clear direction" beside an oil warning).
  if (reading.status === 'warning') {
    const def = definitionFor(reading.id);
    if (def.rule.kind === 'change') {
      if (def.rule.direction === 'rise') return inverse ? 'down' : 'up';
      return inverse ? 'up' : 'down';
    }
  }
  // 1. published band breach
  if (band && (band.min !== undefined || band.max !== undefined)) {
    const pos = bandPositionOf(reading.value, band);
    if (pos === 'above') return inverse ? 'down' : 'up';
    if (pos === 'below') return inverse ? 'up' : 'down';
  }
  // 2. statistically big move — the change tends to feed through
  if (reading.moveScore !== undefined && Math.abs(reading.moveScore) >= MOVE_SCORE_THRESHOLD) {
    const rising = reading.moveScore > 0;
    if (kind === 'growth') return rising ? 'up' : null; // growth never claims "cheaper"
    return rising !== inverse ? 'up' : 'down'; // XOR: direct+rising / inverse+falling → up
  }
  // 3. 10-year extreme level
  if (reading.percentile10y !== undefined) {
    if (reading.percentile10y > 0.8) return inverse ? 'down' : 'up';
    if (reading.percentile10y < 0.2 && kind !== 'growth') return inverse ? 'up' : 'down';
  }
  return null;
}

/**
 * Step-1 audit item D3: the policy-rate cards (ECB, Fed, RBA) state the
 * SIZE OF THE MOVE as its own labelled line, beside the level — "Recent
 * move: +0.25 pts" and "Level: 2.50%, usual range for the decade" can
 * never collapse into one confusing sentence again.
 */
const POLICY_RATE_IDS: ReadonlySet<IndicatorId> = new Set<IndicatorId>(['ecb-dfr', 'fed-target', 'rba-cash-rate']);

/**
 * Step-2 add-list §B1: the policy cards' LAST DECISION — the engine's
 * `lastChange` (the exact step: date + size), which unlike a 30-day window
 * still names a decision taken six weeks ago. Rendered on the RBA cash-rate
 * card (and the ECB/Fed cards, same anatomy) as "Last change: +0.25 pts on
 * 29 Sep 2026".
 */
export function policyLastChangeOf(
  reading: IndicatorReading,
): { date: string; points: number } | null {
  if (!POLICY_RATE_IDS.has(reading.id)) return null;
  if (reading.status === 'unavailable') return null;
  return reading.lastChange ?? null;
}

/**
 * Step-2 add-list §B1: the next RBA decision date from the calendar — the
 * first `kind` event dated today or later (plain dates, no UTC conversion —
 * the Step-1 date rule). Undefined when the calendar carries none.
 */
export function nextEventDate(
  calendar: readonly { date: string; kind: string }[],
  kind: 'rba' | 'fed',
  todayIso: string,
): string | undefined {
  const ofKind = calendar.filter((e) => e.kind === kind && e.date >= todayIso);
  return ofKind.length > 0 ? ofKind.reduce((a, b) => (a.date <= b.date ? a : b)).date : undefined;
}

/** The money row's stated estimation: the majority of its drivers'
 * votes. Every area can answer; 'flat' is the no-signal verdict. */
export function moneyAreaDirection(
  area: MoneyAreaId,
  readings: readonly IndicatorReading[],
  copy: Pick<InsightsCopy, 'indicators'>,
): MoneyDirection {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  let up = 0;
  let down = 0;
  for (const id of MONEY_AREAS[area]) {
    const r = byId.get(id as string);
    if (!r) continue;
    const vote = moneyDriverVote(MONEY_DRIVER_KIND[id], r, copy.indicators[id]?.band);
    if (vote === 'up') up += 1;
    else if (vote === 'down') down += 1;
  }
  if (up > down) return 'up';
  if (down > up) return 'down';
  return 'flat';
}

/** The areas where a rising number RELIEVES the household (more
 * interest earned) — every other area's rises are a squeeze. */
const UP_IS_RELIEF_AREAS: ReadonlySet<MoneyAreaId> = new Set<MoneyAreaId>(['savings']);

/** Valence ink (block comment above): cost areas warn in alert red when
 * their costs rise and reassure in green when they ease; savings flips;
 * flat is always the neutral stale ink. */
export function moneyDirectionToneClass(area: MoneyAreaId, direction: MoneyDirection): string {
  if (direction === 'flat') return WORD_TONE_CLASS.neutral;
  const relief = direction === 'down' ? !UP_IS_RELIEF_AREAS.has(area) : UP_IS_RELIEF_AREAS.has(area);
  return relief ? WORD_TONE_CLASS.normal : WORD_TONE_CLASS.alert;
}
