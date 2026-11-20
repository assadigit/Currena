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
import type { TranslationKey } from '../../shared/lib/locale';
import { goldOutlookOf, type OutlookState } from '../../shared/components/outlook-core';
import {
  balanceTilt,
  balanceVerdictOf,
  type BalanceCounts,
  type BalanceTilt,
  type BalanceVerdict,
} from './signals/BalanceScale';

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

/** The hero's verdict-word STATE — the sparse-aware UI-40 rule in one
 *  place (S6): readable 0 keeps the stronger can't-read word; 1–2
 *  readable is not a reading (the not-enough word); else the verdict.
 *  The minimal glyph row and the classic stage compose the SAME word
 *  from this state — one rule, two renderings. */
export type GoldHeroVerdictState = 'none' | 'not-enough' | BalanceVerdict;

export function goldHeroVerdictState(hero: Pick<GoldHeroModel, 'balance'>): GoldHeroVerdictState {
  const counts = goldHeroCounts(hero);
  if (counts.readable === 0) return 'none';
  if (counts.readable < 3) return 'not-enough';
  return balanceVerdictOf(counts);
}

/** GUX-S5 M3b: the verdict state's dictionary key — ONE map so the
 *  hero and the CompositionStack compose the SAME word (the stack's ①
 *  says the verdict once; this helper guarantees the once-rendered word
 *  is the engine's own, never a second vocabulary). */
export function goldHeroVerdictWordKey(state: GoldHeroVerdictState): import('../../shared/lib/locale').TranslationKey {
  return VERDICT_WORD_KEY[state];
}

/** The verdict word map (the hero's own, corpus-pinned words). */
const VERDICT_WORD_KEY: Record<GoldHeroVerdictState, import('../../shared/lib/locale').TranslationKey> = {
  for: 'pd.gold.heroVerdictFor',
  balanced: 'pd.gold.heroVerdictBalanced',
  against: 'pd.gold.heroVerdictAgainst',
  none: 'pd.gold.heroVerdictNone',
  'not-enough': 'pd.gold.heroNotEnough',
};

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

/* ------------------------------------------------------------------ *
 * GPE R04 (F16a, wave 0) — the why-unread cause classes. The S2 §3
 * decomposition (2026-11-17): a dark seat is dark for one of four
 * knowable reasons, and the page now SAYS which one (one muted status
 * line per dark seat — the FAQ-Q6 pattern, rendered by GoldSeats.tsx
 * from the projection's own reading metadata where it can be derived,
 * else from the curated map below). The classes:
 *   upstream-stopped — the source itself stopped publishing (the UoM
 *     family ends Sep 2026 on FRED; nothing Currena can fetch lights
 *     the seat until the source resumes — the line states the last
 *     published month, derived from the reading's own asOf).
 *   upstream-gap — the current value is published but the PRIOR-YEAR
 *     BASE month is missing upstream (the US CPI's Oct-2025 shutdown
 *     gap; R05's adjacent-months policy lights the seat when it can —
 *     this line speaks only while the seat stays dark).
 *   pipeline-lag — the data is published upstream and the next ingest
 *     will carry it (the CFTC Saturday gate + the GPR re-fetch, the
 *     two operational P0s open on main OUTSIDE GPE — honest for as
 *     long as they persist; the closeout window's small ops session
 *     retires the line by lighting the seats).
 *   rule-driven — the reading is fresh but the evaluator had no input
 *     to evaluate (the D-18 input-presence rule: neither a qualifying
 *     move nor a decade percentile — e.g. the US−Japan 10y gap, value
 *     current, no decile history for the seat yet). Fully derivable
 *     from the projection: readable reading + dark seat ⇒ the rule.
 * ------------------------------------------------------------------ */

/** The four cause classes (GPE R04 / F16a). */
export type SeatUnreadCause = 'upstream-stopped' | 'upstream-gap' | 'pipeline-lag' | 'rule-driven';

/** A dark seat's why-line: the cause class + the upstream-stopped
 * class's last-published month (the reading's asOf, formatted by the
 * renderer in the page's locale — Jalali in fa). */
export interface SeatUnreadWhy {
  cause: SeatUnreadCause;
  month?: string;
}

/** The curated cause map for DARK seats whose reading is stale or
 * missing — the causes are pipeline knowledge the wire format does not
 * carry (the S2 §3 table's evidence). Ids absent from the map render no
 * why-line (fail-closed: no line, never a guess). When a seat lights,
 * its line stops rendering by construction. */
const SEAT_STALE_CAUSE: Readonly<Partial<Record<GoldVoterId, SeatUnreadCause>>> = {
  // The UoM family: FRED MICH / UMCSENT end Sep 2026 (source stopped).
  'michigan-sentiment': 'upstream-stopped',
  'michigan-1y-expectations': 'upstream-stopped',
  'michigan-5y-expectations': 'upstream-stopped',
  // The CPI: the Oct-2025 base month is empty on FRED (shutdown gap).
  'us-cpi-yoy': 'upstream-gap',
  // The two operational P0s (S2-D4, outside GPE): CFTC's Saturday gate
  // and the GPR re-fetch — data sits upstream, the ingest lags.
  'cftc-gold-positioning': 'pipeline-lag',
  'cftc-gold-gross-long': 'pipeline-lag',
  'gpr-daily': 'pipeline-lag',
};

/** The reading statuses the balance treats as readable (gold-balance.ts's
 * own readable() — mirrored, pinned by the gold-balance engine tests). */
const READABLE_STATUSES: ReadonlySet<string> = new Set(['normal', 'warning', 'context', 'no-history']);

/** GPE R04: the why-line for a DARK seat. The rule-driven class is
 * DERIVED from the projection's own reading (a readable reading under a
 * dark seat can only be the D-18 input-presence branch); the stale
 * classes come from the curated map. Null for readable seats and for
 * dark seats with no knowable cause. */
export function seatUnreadWhy(
  seat: Pick<GoldSeat, 'id' | 'impact'>,
  reading: IndicatorReading | undefined,
): SeatUnreadWhy | null {
  if (seat.impact !== 'unread') return null;
  if (reading !== undefined && READABLE_STATUSES.has(reading.status)) {
    // Readable reading + dark seat ⇒ the evaluator had no input (D-18).
    return { cause: 'rule-driven' };
  }
  const cause = SEAT_STALE_CAUSE[seat.id];
  if (cause === undefined) return null;
  // The upstream-stopped line names its last published month — without
  // one there is nothing honest to date, so no line (fail-closed).
  if (cause === 'upstream-stopped') {
    return reading?.asOf != null ? { cause, month: reading.asOf } : null;
  }
  return { cause };
}

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

/* ------------------------------------------------------------------ *
 * GPE R10 (INF-3, 2026-11-18) — the ANCHOR-ID CONTRACT's builder
 * (s7/03 §1.2, binding for Phase D). Every seat link is CARD-LEVEL:
 * the destination pages' own stable card anchors (the #18 pattern,
 * verified present: `usa-card-real-yield-10y`, `currencies-card-
 * dollar-basket`, `wm-risk-gpr-daily` …) — the reader lands ON the
 * card, not at the top of a long page (GPE-S2-18). The name-match
 * rule (GPE-S2-18's second finding): every seat carries its
 * destination card's OWN title key, so the link's tooltip + accessible
 * name say exactly what the reader will land on. The builder is PURE
 * (the homePage pattern, extended) — never string-concatenated in
 * components; ids only, no behavioural side effects (s7/03 rule 3).
 * ------------------------------------------------------------------ */

/** The destination pages' routes (moved from GoldSeats — the builder's
 *  own data, shared with the seat renderer). */
export const PAGE_ROUTE: Readonly<Record<PageDivisionPageId, string>> = {
  global: '/',
  gold: '/gold',
  'world-markets': '/world-markets',
  usa: '/usa',
  europe: '/europe',
  'asia-pacific': '/asia-pacific',
  australia: '/australia',
  commodities: '/commodities',
  currencies: '/currencies',
};

/** The card-level anchor PREFIX each destination page's cards render
 * (verified in the page components: UsaTierCards `usa-card-${id}`,
 * CurrenciesTierCards `currencies-card-${id}`, EuropeTierCards
 * `europe-card-${id}`, AsiaTierCards `asia-card-${id}`,
 * AustraliaTierCards `australia-card-${id}`, CommoditiesTierCards
 * `commodities-card-${id}`, WorldRiskCards `wm-risk-${id}`, and this
 * page's own context cards `gold-card-${id}` — R10). The Global page
 * renders tiles, not anchored cards — its seats (none today) would link
 * the bare route; an anchor is never invented (s7/03 rule 3). */
const PAGE_CARD_ANCHOR_PREFIX: Readonly<Record<PageDivisionPageId, string>> = {
  global: '',
  gold: 'gold-card',
  'world-markets': 'wm-risk',
  usa: 'usa-card',
  europe: 'europe-card',
  'asia-pacific': 'asia-card',
  australia: 'australia-card',
  commodities: 'commodities-card',
  currencies: 'currencies-card',
};

/** The seat's CARD-LEVEL href: the destination route + the card's own
 *  stable anchor (`/usa#usa-card-real-yield-10y`); the gold page's own
 *  context seats link in-page (`#gold-card-gold-silver` — the native
 *  browser hash scroll, no staging). Null when the seat has no home
 *  (the chip renders without a link — fail-closed). */
export function seatAnchorHref(seat: Pick<GoldSeat, 'id' | 'homePage'>): string | null {
  if (seat.homePage === null) return null;
  if (seat.homePage === 'gold') return `#gold-card-${seat.id}`;
  const route = PAGE_ROUTE[seat.homePage];
  const prefix = PAGE_CARD_ANCHOR_PREFIX[seat.homePage];
  if (prefix === '') return route; // no card anchors on that page — never invent one
  return `${route}#${prefix}-${seat.id}`;
}

/** Each voter's DESTINATION CARD TITLE key — the destination page's own
 *  name key (no parallel copy: the same keys the cards render, so the
 *  tooltip can never drift from the card it names). The GPE-S2-18
 *  name-match: "Real yields" (the chip) tells the reader WHAT; the
 *  tooltip's "US 10-year interest after inflation" (the card's title)
 *  tells them WHERE they land — both from one map, both locales. */
export const GOLD_SEAT_DEST_NAME_KEY: Readonly<Record<GoldVoterId, TranslationKey>> = {
  // /usa — the 25 US seats (UsaTierCards' own pd.usa.cardNames).
  'real-yield-10y': 'pd.usa.cardNames.real-yield-10y',
  us10y: 'pd.usa.cardNames.us10y',
  us30y: 'pd.usa.cardNames.us30y',
  'fed-target': 'pd.usa.cardNames.fed-target',
  'fed-expectations': 'pd.usa.cardNames.fed-expectations',
  'real-yield-5y': 'pd.usa.cardNames.real-yield-5y',
  'nyfed-custody': 'pd.usa.cardNames.nyfed-custody',
  'stress-stlfsi': 'pd.usa.cardNames.stress-stlfsi',
  nfci: 'pd.usa.cardNames.nfci',
  vix: 'pd.usa.cardNames.vix',
  'term-premium-10y': 'pd.usa.cardNames.term-premium-10y',
  ebp: 'pd.usa.cardNames.ebp',
  'michigan-sentiment': 'pd.usa.cardNames.michigan-sentiment',
  'epu-us': 'pd.usa.cardNames.epu-us',
  'sp500-breadth-ratio': 'pd.usa.cardNames.sp500-breadth-ratio',
  'bank-stress': 'pd.usa.cardNames.bank-stress',
  'us-cpi-yoy': 'pd.usa.cardNames.us-cpi-yoy',
  'us-pce-core-yoy': 'pd.usa.cardNames.us-pce-core-yoy',
  'breakeven-5y5y': 'pd.usa.cardNames.breakeven-5y5y',
  'breakeven-tilt': 'pd.usa.cardNames.breakeven-tilt',
  t5yie: 'pd.usa.cardNames.t5yie',
  'michigan-1y-expectations': 'pd.usa.cardNames.michigan-1y-expectations',
  'm2-us': 'pd.usa.cardNames.m2-us',
  'us-deficit-12m': 'pd.usa.cardNames.us-deficit-12m',
  'michigan-5y-expectations': 'pd.usa.cardNames.michigan-5y-expectations',
  // /currencies — the 6 dollar seats (CurrenciesTierCards' own keys; usdjpy
  // is a pair card, the rest standing cards).
  'dollar-basket': 'pd.currencies.standingCardNames.dollar-basket',
  usdjpy: 'pd.currencies.pairCardNames.usdjpy',
  'us-japan-10y-gap': 'pd.currencies.standingCardNames.us-japan-10y-gap',
  'usd-reserve-share': 'pd.currencies.standingCardNames.usd-reserve-share',
  'dollar-broad': 'pd.currencies.standingCardNames.dollar-broad',
  'dollar-eme': 'pd.currencies.standingCardNames.dollar-eme',
  // /europe — the 2 euro seats (EuropeTierCards' own keys).
  'ecb-dfr': 'pd.europe.cardNames.ecb-dfr',
  'euro-hicp': 'pd.europe.cardNames.euro-hicp',
  // /world-markets — the 1 geopolitics seat (WorldRiskCards' own keys).
  'gpr-daily': 'pd.worldMarkets.cardNames.gpr-daily',
  // /gold — this page's own 3 context seats (GoldContext's own keys).
  'gold-silver': 'pd.gold.cardNames.gold-silver',
  'cftc-gold-positioning': 'pd.gold.cardNames.cftc-gold-positioning',
  'cftc-gold-gross-long': 'pd.gold.cardNames.cftc-gold-gross-long',
};

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
 * GPE R27 / F14 (2026-11-19): the COT percentile band's derivation —
 * the 10-year percentile the readings already carry, binned into the
 * crowd-gauge's three bands (s7/01 §7 Chain 6: position + band, never
 * direction; the days–weeks horizon label always renders with the flag;
 * the D5-locked convention named at point of use — zero new data).
 * ------------------------------------------------------------------ */

/** The COT cards that carry the band chip (Zone J's positioning pair). */
export const COT_BAND_IDS: readonly ['cftc-gold-positioning', 'cftc-gold-gross-long'] = [
  'cftc-gold-positioning',
  'cftc-gold-gross-long',
];

/** The crowd-gauge band over the reading's own 10-year percentile
 *  (0..1): 'high' above 0.8, 'low' below 0.2, 'mid' between — the same
 *  band edges the position word uses (the trio line's own convention);
 *  null when the reading carries no percentile (fail-closed, no chip). */
export function cotBandOf(pct: number | undefined): 'high' | 'low' | 'mid' | null {
  if (pct === undefined || !Number.isFinite(pct)) return null;
  if (pct > 0.8) return 'high';
  if (pct < 0.2) return 'low';
  return 'mid';
}

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
