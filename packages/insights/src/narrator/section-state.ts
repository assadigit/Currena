/**
 * section-state.ts — M1 of the Layer-2 narrator build
 * (docs/insights/layer2/INSIGHTS-L2-NARRATOR-SPEC.md §3):
 * `buildSectionNarrationState(snapshot, sectionId, now)` — the pure, typed
 * projection of ONE Insights section into the small JSON the narrator
 * explains (plus the pure `stateHashOf` the generation cycle (§4) uses to
 * skip unchanged units).
 *
 * The four sections (D-32): 'global' and 'australia' (the insights
 * snapshot's own readings, sliced by their definitions' section),
 * 'world-markets' (the `insights:markets:v1` document) and
 * 'world-currencies' (the `insights:fx:v1` document). The prices-board
 * group is part of 'global' (its indicators are `section: 'global'`).
 *
 * Design rules (inherited from P4 / D-24 — the math decides, the AI only
 * explains):
 *   - Every verdict/signal/tier is the document's OWN computed value,
 *     verbatim; the only arithmetic here is the age math that shares the
 *     freshness module's discipline, and counting.
 *   - Labels and verdict words come from the generated vocabulary snapshot
 *     (existing UI strings — never new copy; drift-gated by `pnpm gates`).
 *   - Stale/unavailable items are NEVER mixed into the facts: they land in
 *     `excluded` with a reason.
 *   - An alert carries ONE plain magnitude (rounded number + unit +
 *     window) — never a raw dump.
 *
 * Pure: no I/O, no clock reads (every time reference is an explicit
 * parameter), no KV, no fetch, no model calls.
 */

import type { MarketsSnapshot, MarketEntry, FxSnapshot, TicSnapshot } from '@currena/core';
import { buildNarrationState, type NarrationAlert, type NarrationExcluded, type NarrationItem } from './state';
import { getNarratorSectionLabels, type NarratorLang } from './vocabulary';
import { marketDefinition } from '../markets/definitions';
import { DEFINITIONS } from '../definitions';
import { FX_STALE_DAYS } from '../fx/definitions';
import { ticHolderDerived, ticTopMovers } from '../tic';
import { daysBetween } from '../series';
import { sha256Hex } from './hash';

/* ------------------------------------------------------------------ *
 * The section list (D-32)
 * ------------------------------------------------------------------ */

export type NarratorSectionId = 'global' | 'australia' | 'world-markets' | 'world-currencies';

/** The narrated sections in page order (D-32). */
export const NARRATOR_SECTIONS: readonly NarratorSectionId[] = [
  'global',
  'australia',
  'world-markets',
  'world-currencies',
];

/* ------------------------------------------------------------------ *
 * The input
 * ------------------------------------------------------------------ */

/**
 * The section-state input: the insights snapshot plus, when available, the
 * FULL fx and markets documents (the `/api/insights/fx` and
 * `/api/insights/markets` documents as served — satisfied structurally by
 * the stored KV values).
 */
export interface SectionNarrationSnapshot {
  insights: Parameters<typeof buildNarrationState>[0]['insights'];
  fx?: FxSnapshot;
  markets?: MarketsSnapshot;
  /** gap-closure S2-M2.5: the foreign-holders document (as served by
   * `/api/insights/tic`) — the GLOBAL section's `tic` facts project from
   * it (the already-computed derived numbers, never re-derived verdicts). */
  tic?: TicSnapshot;
}

/* ------------------------------------------------------------------ *
 * The output
 * ------------------------------------------------------------------ */

/**
 * One firing alert inside a section (spec §3: id, tier, direction, plain
 * magnitude). Enriched (PROMPT_VERSION 2, D-42) to also carry the reading's
 * own level (`value` + `valueUnit`), its recent change (`delta`) and the
 * trend `context` the dashboard already computed (distance from a recent
 * high, the 3-month change). All four new fields are optional on a per-section
 * basis — a kind that has no level (an FX rule pattern) carries nulls — and
 * the legacy `magnitude` (the rule's own plain magnitude, retained verbatim
 * for back-compat) stays the canonical one-rounded-number summary. The model
 * may now NAME the value + delta in its prose because they are facts in
 * STATE (rule 1 still holds); V3's allowed-number walk picks them up
 * automatically (it walks every number in the state, recursively).
 */
export interface SectionAlert {
  id: string;
  tier: 'needs-attention' | 'correction' | 'bear' | 'unusual-move';
  direction: 'rising' | 'falling' | 'flat';
  magnitude: { value: number; unit: 'points' | 'percent'; window: string } | null;
  /** The reading's own level (e.g. 5.0 for the US 10Y yield, 5800 for the S&P 500, 1.12 for EUR/USD). null when this alert's id has no level (an FX rule pattern). */
  value: number | null;
  /** The unit of `value`, in plain words the page already uses ('index points', 'rate'); null when none applies (indicator levels vary by series — the vocabulary's plainName + oneLine phrase the value). */
  valueUnit: string | null;
  /** The recent change in the reading (one rounded number + unit + window). For indicator sections this is the same shape as `magnitude` (the 30d or since-previous-release change); for markets it is the 3-month change. null when the section kind carries no change. */
  delta: { value: number; unit: 'percent' | 'points'; window: string } | null;
  /** Trend context the dashboard already computed, where available (markets: distance from the 52-week high). null otherwise. */
  context: { fromHigh?: number; chg3m?: number } | null;
}

/** One active FX pattern (world-currencies only; the alerting rule outcomes). */
export interface SectionPattern {
  id: string;
  tier: 'warning' | 'watch';
  /** Whether the rule counts toward the fx section signal. */
  counted: boolean;
  direction: 'rising' | 'falling' | 'flat';
  /** The main met leg's plain magnitude (the rule's own numbers). */
  magnitude: { value: number; unit: 'percent'; window: string } | null;
  /** The warning line the main met leg crossed, when one is met. */
  line: number | null;
}

/** One excluded (stale/unavailable) item, any section. */
export interface SectionExcluded {
  id: string;
  reason: 'stale' | 'unavailable';
  section: NarratorSectionId;
  asOf: string | null;
  ageHours: number | null;
  /** The item's publishing cadence, when it has one (indicator sections). */
  cadence?: string;
}

/** The section's existing verdict, when it has one (never invented). */
export interface SectionVerdict {
  /** The engine's own label, verbatim ('stressed' | 'attention' | ...). */
  label: string;
  /** The page's approved word for that label, both languages. */
  word: { en: string; fa: string };
  /** The verdict's own counts, verbatim from the document's rollup. */
  counts: Record<string, number>;
  /** world-markets only: the group holding the most correction+bear markets. */
  worstGroup?: { id: 'asia' | 'europe' | 'americas'; label: { en: string; fa: string } };
  /** world-currencies only: the most serious active rule id, verbatim. */
  headlineRule?: string | null;
}

/** A fresh world-markets item (one row of the markets table). */
export interface SectionMarketItem {
  id: string;
  group: 'asia' | 'europe' | 'americas';
  status: MarketEntry['status'];
  trend: MarketEntry['trend'];
  value: number;
  asOf: string;
  ageHours: number;
  /** The section's normal timeframe change, percent (chg3m). */
  chg3m: number;
  /** Distance from the 52-week high, percent (always ≤ 0). */
  fromHigh: number;
}

/** A fresh world-currencies item (one pair row; the dollar measure rides as 'dollar-basket'). */
export interface SectionPairItem {
  id: string;
  rate: number;
  asOf: string;
  ageHours: number;
  /** The one-month change, percent (positive = first currency stronger). */
  chg1m: number;
  /** 0–100: share of the past year's one-month moves smaller than this one. */
  moveRank: number;
  /** True when moveRank ≥ the 90th percentile (the "unusually large move" tag). */
  bigMove: boolean;
}

/** The fields every section state shares. */
interface SectionNarrationStateBase {
  section: NarratorSectionId;
  /** The section's plain label, both languages (existing UI strings). */
  label: { en: string; fa: string };
  /** = the `now` parameter (the narrator's own clock). */
  generatedAt: string;
  /** The oldest/newest asOf among the section's FRESH items (null when none). */
  dataAsOf: { oldest: string | null; newest: string | null };
  /** The section's existing verdict, when it has one. */
  verdict: SectionVerdict | null;
  /** How many readings sit in each existing tier/status (per section kind). */
  tiers: Record<string, number>;
  /** The firing alerts inside this section (see per-kind docs). */
  alerts: SectionAlert[];
  /** The active FX patterns (world-currencies only; [] elsewhere). */
  patterns: SectionPattern[];
  /** Stale/unavailable items with their reason. */
  excluded: SectionExcluded[];
}

/** global / australia — the insights snapshot's own readings, sliced by section. */
export interface IndicatorSectionState extends SectionNarrationStateBase {
  section: 'global' | 'australia';
  /** Fresh readings of this section (the P4 item shape). */
  items: NarrationItem[];
  /** gap-closure S2-M2.5 (GLOBAL only): the foreign-holders facts — the
   * dashboard's own derived numbers (the total, Japan/China six-month
   * changes, the largest 12-month net buyers/sellers by TRANSACTIONS),
   * projected for the model to weave. null when the tic document was not
   * provided (the no-tic-yet deploy state). The math decides; the AI only
   * explains — the custody caveat rides as a plain instruction the model
   * must keep (holdings are recorded where held, not who owns them). */
  tic: NarrationTicFacts | null;
}

/** The compact foreign-holders projection (the global section's `tic`).
 * Every number is one the page itself already computed and displays —
 * rounded, plain, never a raw dump (the P4 discipline). */
export interface NarrationTicFacts {
  /** The data month, as published ("2026-08"). */
  dataMonth: string;
  /** Total foreign holdings, trillions (one decimal — e.g. 9.3). */
  totalTn: number;
  /** The two holders the section headlines, with their already-computed
   * 6-month holdings change and 12-month net TRANSACTIONS sum (bn). */
  headline: {
    id: 'japan' | 'china-mainland';
    name: string;
    holdingsTn: number;
    chg6mBn: number | null;
    net12mBn: number | null;
  }[];
  /** The top 3 net buyers/sellers over 12 months (transactions, bn). */
  largestBuyers12m: { id: string; name: string; net12mBn: number }[];
  largestSellers12m: { id: string; name: string; net12mBn: number }[];
  /** The custody caveat, as plain instruction (both languages not needed
   * here — the model reads the EN fact and writes in its own language). */
  custodyNote: string;
}

/** world-markets — the markets document's rows. */
export interface MarketsSectionState extends SectionNarrationStateBase {
  section: 'world-markets';
  /** Fresh market rows (stale rows land in `excluded`). */
  items: SectionMarketItem[];
  /** The page's approved words for the alerting statuses, both languages. */
  statusWords: { correction: { en: string; fa: string }; bear: { en: string; fa: string } };
}

/** world-currencies — the fx document's pairs + dollar measure + rules. */
export interface CurrenciesSectionState extends SectionNarrationStateBase {
  section: 'world-currencies';
  /** Fresh pair rows; the dollar measure rides first as 'dollar-basket'. */
  items: SectionPairItem[];
  /** The fx document's own plain block, verbatim when present. */
  dollarYearExtreme: 'high' | 'low' | null;
}

export type SectionNarrationState = IndicatorSectionState | MarketsSectionState | CurrenciesSectionState;

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const LABELS: Record<NarratorLang, ReturnType<typeof getNarratorSectionLabels>> = {
  en: getNarratorSectionLabels('en'),
  fa: getNarratorSectionLabels('fa'),
};

function sectionLabel(section: NarratorSectionId): { en: string; fa: string } {
  return { en: LABELS.en.label[section], fa: LABELS.fa.label[section] };
}

/** Whole hours from an ISO calendar date (00:00 UTC) to an ISO datetime (the freshness module's arithmetic). */
function ageHoursBetween(asOf: string, now: string): number {
  const from = Date.parse(`${asOf}T00:00:00Z`);
  const to = Date.parse(now);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, Math.floor((to - from) / 3_600_000));
}

const byId = (a: { id: string }, b: { id: string }): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

function spanOf(asOfDates: readonly string[]): { oldest: string | null; newest: string | null } {
  let oldest: string | null = null;
  let newest: string | null = null;
  for (const d of asOfDates) {
    if (oldest === null || d < oldest) oldest = d;
    if (newest === null || d > newest) newest = d;
  }
  return { oldest, newest };
}

function directionOfNumber(n: number | undefined | null): 'rising' | 'falling' | 'flat' {
  if (n === undefined || n === null || !Number.isFinite(n) || n === 0) return 'flat';
  return n > 0 ? 'rising' : 'falling';
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** The indicator-verdict word pair for a summary label ('stressed' → Stressed/پرتنش). */
function verdictWordOf(label: string): { en: string; fa: string } {
  return { en: LABELS.en.verdictWord[label as keyof typeof LABELS.en.verdictWord] ?? label, fa: LABELS.fa.verdictWord[label as keyof typeof LABELS.fa.verdictWord] ?? label };
}

/** The signal word pair for a markets/fx signal ('attention' → Needs attention/نیازمند توجه). */
function signalWordOf(signal: 'normal' | 'attention' | 'unusual'): { en: string; fa: string } {
  return { en: LABELS.en.signalWord[signal], fa: LABELS.fa.signalWord[signal] };
}

/* ------------------------------------------------------------------ *
 * global / australia — a pure slice of the P4 narration state
 * ------------------------------------------------------------------ */

function buildIndicatorSection(
  snapshot: SectionNarrationSnapshot,
  section: 'global' | 'australia',
  now: string,
): IndicatorSectionState {
  // One derivation path: the P4 contract, then a slice. The fx document is
  // deliberately NOT passed — fx patterns belong to the currencies section.
  const base = buildNarrationState({ insights: snapshot.insights }, now);

  const items = base.items.filter((i) => i.section === section);
  const itemIds = new Set(items.map((i) => i.id));
  const itemById = new Map(items.map((i) => [i.id, i]));
  // Enriched (D-42): the alert also carries the reading's own value (already
  // in the section's items) and the magnitude as `delta` (the same shape —
  // the recent 30d / since-previous-release change). Indicator sections have
  // no `valueUnit` (the per-series unit varies wildly — yields, scores,
  // balances, prices — and the vocabulary's plainName + oneLine phrase the
  // level) and no `context` (NarrationItem carries no trend context today;
  // exposing fromPeak10y would widen NarrationItem, out of scope for D-42).
  const alerts: SectionAlert[] = base.alerts
    .filter((a) => itemIds.has(a.id))
    .map((a: NarrationAlert) => {
      const item = itemById.get(a.id);
      const value = item?.value ?? null;
      const delta =
        a.magnitude === null
          ? null
          : { value: a.magnitude.value, unit: a.magnitude.unit, window: a.magnitude.window };
      return {
        id: a.id,
        tier: 'needs-attention' as const,
        direction: a.direction,
        magnitude: a.magnitude === null ? null : { ...a.magnitude },
        value,
        valueUnit: null,
        delta,
        context: null,
      };
    });
  const excluded: SectionExcluded[] = base.excluded
    .filter((e) => excludedInSection(e, section))
    .map((e: NarrationExcluded) => ({
      id: e.id,
      reason: e.reason,
      section,
      asOf: e.asOf,
      ageHours: e.ageHours,
      cadence: e.cadence,
    }));

  const tiers: Record<string, number> = { warning: 0, normal: 0, context: 0, 'no-history': 0, 'check-pending': 0 };
  for (const item of items) {
    if (item.status in tiers) tiers[item.status] = (tiers[item.status] ?? 0) + 1;
  }

  const line = snapshot.insights.summary[section];
  const verdict: SectionVerdict | null =
    line.label === null
      ? null
      : {
          label: line.label,
          word: verdictWordOf(line.label),
          counts: {
            warningCount: line.warningCount,
            votingCount: line.votingCount,
            excludedCount: line.excludedCount,
          },
        };

  // gap-closure S2-M2.5 (GLOBAL only): the foreign-holders projection —
  // the page's OWN derived numbers (ticHolderDerived / ticTopMovers),
  // rounded to the display precision, never re-derived. Australia carries
  // null (the TIC section lives in Global).
  const tic: NarrationTicFacts | null =
    section === 'global' && snapshot.tic !== undefined ? ticFactsOf(snapshot.tic) : null;

  return {
    section,
    label: sectionLabel(section),
    generatedAt: now,
    dataAsOf: spanOf(items.map((i) => i.asOf)),
    verdict,
    tiers,
    alerts: alerts.sort(byId),
    patterns: [],
    excluded: excluded.sort(byId),
    items,
    tic,
  };
}

/** The custody caveat the model must keep (Treasury's own warning,
 * paraphrased — the section UI's own wording family). */
const TIC_CUSTODY_NOTE =
  'Holdings are recorded where securities are held, not who owns them: Belgium, Luxembourg, the Cayman Islands, Ireland, the UK, Switzerland and Bermuda hold much that belongs to investors elsewhere.';

/** Project the compact foreign-holders facts (the display precision —
 * one decimal for trillions, whole billions for changes). */
function ticFactsOf(tic: TicSnapshot): NarrationTicFacts {
  const byId = new Map(tic.holders.map((h) => [h.id, h]));
  const roundBn = (v: number): number => Math.round(v * 10) / 10;
  const headline: NarrationTicFacts['headline'] = [];
  for (const id of ['japan', 'china-mainland'] as const) {
    const h = byId.get(id);
    if (h === undefined) continue;
    const d = ticHolderDerived(h, tic);
    headline.push({
      id,
      name: h.name,
      holdingsTn: Math.round((h.holdingsBn / 1000) * 10) / 10,
      chg6mBn: d.chg6mBn === null ? null : roundBn(d.chg6mBn),
      net12mBn: d.net12mBn === null ? null : roundBn(d.net12mBn),
    });
  }
  const { buyers, sellers } = ticTopMovers(tic, 3);
  return {
    dataMonth: tic.dataMonth,
    totalTn: Math.round((tic.totalBn / 1000) * 10) / 10,
    headline,
    largestBuyers12m: buyers.map((b) => ({ ...b, net12mBn: roundBn(b.net12mBn) })),
    largestSellers12m: sellers.map((s) => ({ ...s, net12mBn: roundBn(s.net12mBn) })),
    custodyNote: TIC_CUSTODY_NOTE,
  };
}

/** Whether a P4 excluded item belongs to the given indicator section (the definition's own section — the same single source state.ts reads). */
function excludedInSection(e: NarrationExcluded, section: 'global' | 'australia'): boolean {
  const def = DEFINITIONS.find((d) => d.id === e.id);
  return def?.section === section;
}

/* ------------------------------------------------------------------ *
 * world-markets
 * ------------------------------------------------------------------ */

function buildMarketsSection(
  snapshot: SectionNarrationSnapshot,
  now: string,
): MarketsSectionState {
  const markets = snapshot.markets;
  if (markets === undefined) {
    throw new Error("buildSectionNarrationState: section 'world-markets' needs the markets document");
  }

  const items: SectionMarketItem[] = [];
  const excluded: SectionExcluded[] = [];
  const alerts: SectionAlert[] = [];

  for (const row of markets.markets) {
    const group = marketDefinition(row.id).group;
    if (row.stale) {
      excluded.push({ id: row.id, reason: 'stale', section: 'world-markets', asOf: row.asOf, ageHours: ageHoursBetween(row.asOf, now) });
      continue;
    }
    items.push({
      id: row.id,
      group,
      status: row.status,
      trend: row.trend,
      value: row.close,
      asOf: row.asOf,
      ageHours: ageHoursBetween(row.asOf, now),
      chg3m: round2(row.chg3m),
      fromHigh: round2(row.fromHigh),
    });
    if (row.status === 'correction' || row.status === 'bear') {
      // Enriched (D-42): carry the level (`close` in plain 'index points'),
      // the 3-month change as `delta` (the section's normal timeframe — the
      // page's view switch defaults to it), and `context.fromHigh` so the
      // model can speak "X% below its yearly high". The legacy `magnitude`
      // (the from-52w-high %) stays verbatim.
      alerts.push({
        id: row.id,
        tier: row.status,
        direction: row.trend === 'up' ? 'rising' : row.trend === 'down' ? 'falling' : 'flat',
        magnitude: { value: round2(row.fromHigh), unit: 'percent', window: 'from-52w-high' },
        value: round2(row.close),
        valueUnit: 'index points',
        delta: { value: round2(row.chg3m), unit: 'percent', window: '3m' },
        context: { fromHigh: round2(row.fromHigh) },
      });
    }
  }

  items.sort(byId);
  excluded.sort(byId);
  // Bear outranks correction (the section's own tier order), then id.
  alerts.sort((a, b) => {
    const rank = (t: SectionAlert['tier']): number => (t === 'bear' ? 0 : 1);
    return rank(a.tier) - rank(b.tier) || byId(a, b);
  });

  const tiers: Record<string, number> = { normal: 0, correction: 0, bear: 0 };
  for (const item of items) {
    if (item.status in tiers) tiers[item.status] = (tiers[item.status] ?? 0) + 1;
  }

  const s = markets.summary;
  const verdict: SectionVerdict = {
    label: s.signal,
    word: signalWordOf(s.signal),
    counts: {
      count: s.count,
      roseToday: s.roseToday,
      nAttention: s.nAttention,
      nUnusual: s.nUnusual,
    },
    ...(s.worstGroup !== null
      ? { worstGroup: { id: s.worstGroup, label: { en: LABELS.en.marketGroup[s.worstGroup], fa: LABELS.fa.marketGroup[s.worstGroup] } } }
      : {}),
  };

  return {
    section: 'world-markets',
    label: sectionLabel('world-markets'),
    generatedAt: now,
    dataAsOf: spanOf(items.map((i) => i.asOf)),
    verdict,
    tiers,
    alerts,
    patterns: [],
    excluded,
    items,
    statusWords: {
      correction: { en: LABELS.en.marketStatus.correction, fa: LABELS.fa.marketStatus.correction },
      bear: { en: LABELS.en.marketStatus.bear, fa: LABELS.fa.marketStatus.bear },
    },
  };
}

/* ------------------------------------------------------------------ *
 * world-currencies
 * ------------------------------------------------------------------ */

/** The window word for an fx rule leg name ('eurchf_m1' → 'm1'). */
function legWindow(name: string): string {
  const parts = name.split('_');
  return parts.length > 1 ? parts[parts.length - 1]! : 'm1';
}

function buildCurrenciesSection(
  snapshot: SectionNarrationSnapshot,
  now: string,
): CurrenciesSectionState {
  const fx = snapshot.fx;
  if (fx === undefined) {
    throw new Error("buildSectionNarrationState: section 'world-currencies' needs the fx document");
  }

  const items: SectionPairItem[] = [];
  const excluded: SectionExcluded[] = [];
  const alerts: SectionAlert[] = [];

  // The dollar measure rides as 'dollar-basket' (the fx board's own version
  // of the page's dollar-basket card — the vocabulary entry names it).
  const dollar = fx.dollarMeasure;
  const dollarStale = daysBetween(dollar.asOf, now.slice(0, 10)) > FX_STALE_DAYS;
  if (dollarStale) {
    excluded.push({ id: 'dollar-basket', reason: 'stale', section: 'world-currencies', asOf: dollar.asOf, ageHours: ageHoursBetween(dollar.asOf, now) });
  } else {
    items.push({
      id: 'dollar-basket',
      rate: round2(dollar.value),
      asOf: dollar.asOf,
      ageHours: ageHoursBetween(dollar.asOf, now),
      chg1m: round2(dollar.chg.m1),
      moveRank: 0,
      bigMove: false,
    });
  }

  for (const pair of fx.pairs) {
    if (pair.stale) {
      excluded.push({ id: pair.id, reason: 'stale', section: 'world-currencies', asOf: pair.asOf, ageHours: ageHoursBetween(pair.asOf, now) });
      continue;
    }
    items.push({
      id: pair.id,
      rate: pair.rate,
      asOf: pair.asOf,
      ageHours: ageHoursBetween(pair.asOf, now),
      chg1m: round2(pair.chg.m1),
      moveRank: round2(pair.moveRank),
      bigMove: pair.bigMove,
    });
    if (pair.bigMove) {
      // Enriched (D-42): carry the pair's `rate` (a plain 'rate' unit — the
      // quote units per 1 base; the vocabulary's plainName phrases it as
      // "euro versus the franc" etc.), and the 1-month change as `delta`
      // (the fx section's alerting leg). The legacy `magnitude` (the 1m %)
      // stays verbatim. `context` is null here — moveRank/bigMove are
      // already encoded in the alert's `tier: 'unusual-move'` and the
      // item's own fields; the spec's `context` shape (fromHigh/chg3m)
      // does not apply to a pair row.
      alerts.push({
        id: pair.id,
        tier: 'unusual-move',
        direction: directionOfNumber(pair.chg.m1),
        magnitude: { value: round2(pair.chg.m1), unit: 'percent', window: '1m' },
        value: round2(pair.rate),
        valueUnit: 'rate',
        delta: { value: round2(pair.chg.m1), unit: 'percent', window: '1m' },
        context: null,
      });
    }
  }

  // The alerting rule outcomes: patterns with their own numbers (D-24's
  // warning/watch set), plus warning-outcome rules also surface as alerts
  // (the section's firing units).
  const patterns: SectionPattern[] = [];
  for (const rule of fx.rules) {
    if (rule.outcome !== 'warning' && rule.outcome !== 'watch') continue;
    const metLeg = rule.legs.find((l) => l.met) ?? null;
    patterns.push({
      id: rule.id,
      tier: rule.outcome,
      counted: rule.counted,
      direction: directionOfNumber(metLeg?.value),
      magnitude:
        metLeg === null
          ? null
          : { value: round2(metLeg.value), unit: 'percent', window: legWindow(metLeg.name) },
      line: metLeg === null ? null : metLeg.line,
    });
    if (rule.outcome === 'warning') {
      // Enriched (D-42): an FX rule pattern has no level of its own (it is
      // a relationship, not a reading) — `value`/`valueUnit`/`context` are
      // null. The rule's `magnitude` rides as `delta` so the model can name
      // the leg's percent move + its window (e.g. the EUR/CHF 1m move that
      // met the warning line).
      alerts.push({
        id: rule.id,
        tier: 'needs-attention',
        direction: directionOfNumber(metLeg?.value),
        magnitude:
          metLeg === null
            ? null
            : { value: round2(metLeg.value), unit: 'percent', window: legWindow(metLeg.name) },
        value: null,
        valueUnit: null,
        delta:
          metLeg === null
            ? null
            : { value: round2(metLeg.value), unit: 'percent', window: legWindow(metLeg.name) },
        context: null,
      });
    }
  }

  items.sort((a, b) => (a.id === 'dollar-basket' ? -1 : b.id === 'dollar-basket' ? 1 : byId(a, b)));
  excluded.sort(byId);
  // Warning rules first (the counted alerts), then big movers, then id.
  alerts.sort((a, b) => {
    const rank = (t: SectionAlert['tier']): number => (t === 'needs-attention' ? 0 : 1);
    return rank(a.tier) - rank(b.tier) || byId(a, b);
  });
  patterns.sort(byId);

  const tiers: Record<string, number> = { warning: 0, watch: 0, supportive: 0, quiet: 0, context: 0, nodata: 0 };
  for (const rule of fx.rules) {
    if (rule.outcome in tiers) tiers[rule.outcome] = (tiers[rule.outcome] ?? 0) + 1;
  }

  const s = fx.summary;
  const verdict: SectionVerdict = {
    label: s.signal,
    word: signalWordOf(s.signal),
    counts: { countedWarnings: s.countedWarnings },
    headlineRule: s.headlineRule,
  };

  return {
    section: 'world-currencies',
    label: sectionLabel('world-currencies'),
    generatedAt: now,
    dataAsOf: spanOf(items.map((i) => i.asOf)),
    verdict,
    tiers,
    alerts,
    patterns,
    excluded,
    items,
    dollarYearExtreme: fx.plain?.dollarYearExtreme ?? null,
  };
}

/* ------------------------------------------------------------------ *
 * The builder
 * ------------------------------------------------------------------ */

/**
 * Build one section's narration state (spec §3). Pure and deterministic:
 * arrays sorted by id (the markets/currencies alerts carry their section's
 * own tier order first), labels from the generated vocabulary snapshot.
 *
 * @param snapshot the computed page documents (insights always; fx/markets
 *                 for the sections that need them)
 * @param section  which section to build
 * @param now      the narrator's clock (ISO datetime)
 */
export function buildSectionNarrationState(
  snapshot: SectionNarrationSnapshot,
  section: NarratorSectionId,
  now: string,
): SectionNarrationState {
  switch (section) {
    case 'global':
    case 'australia':
      return buildIndicatorSection(snapshot, section, now);
    case 'world-markets':
      return buildMarketsSection(snapshot, now);
    case 'world-currencies':
      return buildCurrenciesSection(snapshot, now);
  }
}

/* ------------------------------------------------------------------ *
 * The state hash (spec §4: "timestamps removed")
 * ------------------------------------------------------------------ */

/**
 * The volatile keys stripped before hashing: the run clock and every
 * age-in-hours (time-derived; they change every minute without the content
 * changing). Everything else — values, statuses, counts, labels, asOf
 * dates, freshness flips — is content and stays.
 */
const VOLATILE_KEYS: ReadonlySet<string> = new Set(['generatedAt', 'ageHours']);

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      if (VOLATILE_KEYS.has(key)) continue;
      out[key] = stableValue((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

/**
 * The content hash of a section/overall state (spec §4): sha256 over the
 * stable serialization with the run clock and age hours removed. Two runs
 * with unchanged data produce the same hash; any value, status, count,
 * label or freshness flip changes it. Pure.
 */
export function stateHashOf(state: SectionNarrationState | import('./overall-state').OverallNarrationState): string {
  return sha256Hex(JSON.stringify(stableValue(state)));
}
