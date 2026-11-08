/**
 * gold-tiles — the Gold page's derivations, PURE (page-division S5,
 * 2026-11-08 — docs/page-division/02-PAGE-DIVISION-SPEC.md §5, D-26…D-29).
 *
 * ONE RULE GOVERNS THIS FILE (D-48 + spec §3.2 + Agent Rule 5, the S3
 * global-tiles contract): every value the page renders is a DISPLAY of an
 * engine-computed reading, re-derived here through the SAME pure engines
 * the legacy /insights page, the Global Gold Balance tile and the runner
 * use — `goldBalance` + `evaluateSignal` from @currena/insights, the
 * extracted `outlook-core` classifier, and the BalanceScale's own pure
 * presentation helpers (balanceVerdictOf / balanceTilt — imported, never
 * restated, so the hero's beam and the legacy card's beam are ONE math).
 * Nothing is computed twice and nothing is invented: no new composites,
 * no new thresholds, no second arithmetic. A seat that cannot be read
 * says so (the D-18 input-presence rule already lives inside
 * goldBalance); a reading absent from the served projection stays absent
 * (the caller renders the honest note from `absentIds`).
 *
 * The inputs are the S2 contract's own: the Gold projection
 * (fetchPageProjection('gold') — the 14 home readings + the 34 mirror
 * inputs that carry all 37 voters, the live-prices serve-time merge
 * already applied to gold-usd). Pure + platform-free so the unit tests
 * drive it directly (gold-tiles.test.ts) and the S5 seat-level diff
 * (§21) can pin it against the engine's own snapshot values — the
 * backtest core spells the engine side out WITHOUT this module, so drift
 * surfaces red (gold-backtest-core.ts).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { evaluateSignal, goldBalance } from '@currena/insights';
import type { GoldBalanceLane, GoldBalanceMember, GoldBalanceReading } from '@currena/insights';
import { BLOCKED_NOTES, GOLD_VOTER_IDS, homePageOfIndicator, pageHomeIds } from '@currena/insights/page-division';
import type { BlockedNote } from '@currena/insights/page-division';
import type { PageDivisionPageId } from '@currena/core';
import { goldOutlookOf, type OutlookState } from '../../components/insights/signals/outlook-core';
import {
  balanceTilt,
  balanceVerdictOf,
  type BalanceCounts,
  type BalanceTilt,
  type BalanceVerdict,
} from '../../components/insights/signals/BalanceScale';

/* ------------------------------------------------------------------ *
 * The hero (D-26 item 1): live gold price + the Balance Scale verdict
 * + the 7-state outlook + the for/against/neutral/unread counts
 * ------------------------------------------------------------------ */

export interface GoldHeroModel {
  /** The consolidated balance over the five lanes — the SAME engine the
   *  legacy card's BalanceScale and the Global Gold Balance tile read
   *  (gold-balance.ts). The counts, net and readable ride it. */
  balance: GoldBalanceReading;
  /** The 7-state outlook derived from that SAME balance (outlook-core's
   *  goldOutlookOf — the GB-S5 contract: outlook and balance can never
   *  contradict). null = nothing could be read. */
  outlook: OutlookState | null;
  /** gold-usd — the hero price reading (the live hourly overlay value;
   *  the serve-time prices merge applied it, pricesAsOf stamps it). */
  price: IndicatorReading | undefined;
  /** The gold SignalReading's own speed/position — the range-bound
   *  evidence the outlook reads (evaluateSignal, the same pure evaluator
   *  the Signals card uses) + the hero's 10-year context. */
  speed: number | null;
  position: { band: 'low' | 'typical' | 'high'; percentile: number } | null;
}

export function goldHero(readings: readonly IndicatorReading[]): GoldHeroModel {
  const balance = goldBalance(readings);
  const gold = evaluateSignal('gold', readings);
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  const price = byId.get('gold-usd');
  return {
    balance,
    outlook: goldOutlookOf(balance, gold.speed, gold.position),
    price,
    speed: gold.speed,
    position:
      price !== undefined && price.percentile10y !== undefined && Number.isFinite(price.percentile10y)
        ? { band: price.percentile10y > 0.8 ? 'high' : price.percentile10y < 0.2 ? 'low' : 'typical', percentile: price.percentile10y }
        : null,
  };
}

/* ------------------------------------------------------------------ *
 * The hero verdict word + the beam — the BalanceScale's OWN pure rules,
 * imported (never restated): UI-40 sparse discipline, the 2026-10-21c
 * [3°,10°] directional-load tilt, the net-sign verdict.
 * ------------------------------------------------------------------ */

/** The balance counts as the BalanceScale's own BalanceCounts shape (the
 *  lane sides ARE the drivers the drawing weighs — 01 §5.1's rollup). */
export function goldHeroCounts(hero: Pick<GoldHeroModel, 'balance'>): BalanceCounts {
  return { ...hero.balance.counts, total: hero.balance.lanes.length, net: hero.balance.net, readable: hero.balance.readable };
}

/** The verdict the BalanceScale would speak (balanceVerdictOf — spec §5.1:
 *  readable 0 → 'none'; net sign → 'for'/'against'; 0 → 'balanced'). */
export function goldHeroVerdict(hero: Pick<GoldHeroModel, 'balance'>): BalanceVerdict {
  return balanceVerdictOf(goldHeroCounts(hero));
}

/** The hero's beam tilt — the SAME presentation scale the legacy drawing
 *  swings on (|net| ÷ (for+against) × 10°, floor 3°, level at net 0). */
export function goldHeroTilt(hero: Pick<GoldHeroModel, 'balance'>): BalanceTilt {
  // BALANCE_LH_PX is the drawing's pin-to-pin constant; the tilt ANGLE is
  // independent of it (only the pixel drops scale), so the design width
  // passes through unchanged.
  return balanceTilt(goldHeroCounts(hero), 320);
}

/* ------------------------------------------------------------------ *
 * The 37 seats grouped by the five lanes (D-26 item 2)
 * ------------------------------------------------------------------ */

/** The gold meter's 37 voter ids as a literal union — keeps the name +
 *  copy maps TOTAL (a missing key is a typecheck error, never a runtime
 *  undefined). gold-tiles.test.ts pins this list against the engine's
 *  own GOLD_VOTER_IDS byte-for-byte. */
export type GoldVoterId =
  | 'real-yield-10y' | 'us10y' | 'us30y' | 'fed-target' | 'fed-expectations' | 'ecb-dfr'
  | 'real-yield-5y'
  | 'dollar-basket' | 'usdjpy' | 'us-japan-10y-gap' | 'usd-reserve-share' | 'nyfed-custody'
  | 'dollar-broad' | 'dollar-eme'
  | 'stress-stlfsi' | 'nfci' | 'vix' | 'gold-silver' | 'term-premium-10y' | 'ebp'
  | 'michigan-sentiment' | 'gpr-daily' | 'epu-us' | 'sp500-breadth-ratio' | 'bank-stress'
  | 'us-cpi-yoy' | 'us-pce-core-yoy' | 'euro-hicp' | 'breakeven-5y5y' | 'breakeven-tilt'
  | 't5yie' | 'michigan-1y-expectations' | 'm2-us' | 'us-deficit-12m' | 'michigan-5y-expectations'
  | 'cftc-gold-positioning' | 'cftc-gold-gross-long';

/** A voter seat as the page renders it: the engine's own member line +
 *  the seat's home-page link (03-STRATEGY-LOG §7 wrap-up note 4 — derived
 *  from the placement table, never hand-copied). */
export interface GoldSeat {
  id: GoldVoterId;
  /** supports / pressures / steady / unread — gold-balance's own words. */
  impact: GoldBalanceMember['impact'];
  /** rising / falling / high / low — the evaluator's own evidence word
   *  (null for steady and unread seats). */
  evidence: GoldBalanceMember['evidence'];
  /** The seat's detail-card home page (null = not a placed id — the chip
   *  renders without a link, fail-closed). */
  homePage: PageDivisionPageId | null;
}

/** One lane's seats view: the engine's lane vote + its seats in table order. */
export interface GoldSeatLane {
  lane: GoldBalanceLane['lane'];
  side: GoldBalanceLane['side'];
  split: boolean;
  readable: number;
  firing: number;
  supports: number;
  pressures: number;
  seats: readonly GoldSeat[];
}

/** The five lanes with every seat resolved (7 + 7 + 11 + 10 + 2 = 37 —
 *  the membership rides GOLD_LANE_VOTERS through goldBalance, never a
 *  hand-copied list). */
export function goldSeatLanes(balance: GoldBalanceReading): readonly GoldSeatLane[] {
  return balance.lanes.map((lane) => ({
    lane: lane.lane,
    side: lane.side,
    split: lane.split,
    readable: lane.readable,
    firing: lane.firing,
    supports: lane.supports,
    pressures: lane.pressures,
    seats: lane.members.map((m) => ({ id: m.id as GoldVoterId, impact: m.impact, evidence: m.evidence, homePage: homePageOfIndicator(m.id) })),
  }));
}

/** Every seat across the five lanes (37 once every voter is seated) —
 *  the §21 gate's per-seat diff basis. */
export function goldSeats(balance: GoldBalanceReading): readonly GoldSeat[] {
  return goldSeatLanes(balance).flatMap((lane) => [...lane.seats]);
}

/* ------------------------------------------------------------------ *
 * The context cards (D-27) + the blocked notes (§16)
 * ------------------------------------------------------------------ */

/** The Gold page's detail-card homes, in placement order — ratios (9,
 *  gold-usd the hero) then flows & positioning (5). Derived from the
 *  placement table (pageHomeIds('gold')), never hand-copied. */
export const GOLD_CONTEXT_IDS: readonly IndicatorId[] = pageHomeIds('gold');

/** One context card's reading (undefined = the id is absent from the
 *  served projection — public mode's honest gap, never a guess). */
export interface GoldContextEntry {
  id: GoldContextId;
  reading: IndicatorReading | undefined;
}

/** The 14 context cards in placement order, straight off the projection. */
export function goldContextCards(readings: readonly IndicatorReading[]): readonly GoldContextEntry[] {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  return GOLD_CONTEXT_IDS.map((id) => ({ id: id as GoldContextId, reading: byId.get(id) }));
}

/** The blocked quartet (spec §16 — displayed as honest notes on this
 *  page, NEVER as cards): the placement module's own table. */
export const GOLD_BLOCKED_NOTES: readonly BlockedNote[] = BLOCKED_NOTES;

/* ------------------------------------------------------------------ *
 * The context cards' display configs — the DISPLAY registry's own
 * values for the 14 gold ids, restated here so the lean Gold chunk does
 * not pull the config module chain (the S3 GlobalBoard pattern). The
 * unit TOKENS are pinned to the corpus words by gold-copy-pin.test.ts;
 * the decimals are pinned against config/display.ts by gold-tiles.test.ts.
 * ------------------------------------------------------------------ */

export type GoldUnitToken = 'usd' | 'aud' | 'percent' | 'ratio' | 'tonnes';

export interface GoldDisplayConfig {
  decimals: number;
  unit: GoldUnitToken;
}

/** The Gold page's 14 context-card ids (the placement's own homes) — the
 *  literal union that keeps the display + copy maps TOTAL (a missing key
 *  is a typecheck error, never a runtime undefined). gold-tiles.test.ts
 *  pins this list against pageHomeIds('gold') byte-for-byte. */
export type GoldContextId =
  | 'gold-usd'
  | 'gold-silver'
  | 'gold-btc'
  | 'gold-aud'
  | 'gold-oil-ratio'
  | 'gold-platinum'
  | 'real-gold-price'
  | 'copper-gold'
  | 'gold-equities-ratio'
  | 'cftc-gold-positioning'
  | 'cftc-gold-gross-long'
  | 'sge-gold-withdrawals'
  | 'swiss-gold-flow'
  | 'shanghai-gold-premium';

export const GOLD_DISPLAY: Readonly<Record<GoldContextId, GoldDisplayConfig>> = {
  'gold-usd': { decimals: 0, unit: 'usd' },
  'gold-silver': { decimals: 1, unit: 'ratio' },
  'gold-btc': { decimals: 4, unit: 'ratio' },
  'gold-aud': { decimals: 0, unit: 'aud' },
  'gold-oil-ratio': { decimals: 1, unit: 'ratio' },
  'gold-platinum': { decimals: 2, unit: 'ratio' },
  'real-gold-price': { decimals: 0, unit: 'usd' },
  'copper-gold': { decimals: 2, unit: 'ratio' },
  'gold-equities-ratio': { decimals: 4, unit: 'ratio' },
  'cftc-gold-positioning': { decimals: 1, unit: 'percent' },
  'cftc-gold-gross-long': { decimals: 1, unit: 'percent' },
  'sge-gold-withdrawals': { decimals: 0, unit: 'tonnes' },
  'swiss-gold-flow': { decimals: 0, unit: 'tonnes' },
  'shanghai-gold-premium': { decimals: 2, unit: 'percent' },
};

/** The 37 voter ids this page's seat chips render (the engine's own table
 *  via the placement module — the test seam + the §21 pin basis). */
export const GOLD_PAGE_VOTER_IDS: readonly IndicatorId[] = GOLD_VOTER_IDS;
