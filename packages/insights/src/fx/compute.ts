/**
 * World currencies — the analysis engine (spec §6): pair derivation, the
 * four period changes, move_rank, the dollar measure, weekly series, the
 * seven rules with their 13-week pattern checks, the distance-to-warning
 * bars and the section signal.
 *
 * Everything here is PURE: provider answers and cross-section inputs go
 * in, a snapshot comes out. No fetch, no clock (dates arrive as
 * parameters), no KV — the fetch orchestration lives in job.ts, storage in
 * store.ts. This is what keeps the whole section testable and the Worker
 * thin (CPU stays far under the free-plan limit).
 */

import type {
  FxChg,
  FxDollarMeasure,
  FxLeg,
  FxPairEntry,
  FxPairId,
  FxPatternCheck,
  FxPlain,
  FxRuleState,
  FxRuleId,
  FxSnapshot,
  FxSummary,
} from '@currena/core';
import { FxSnapshotSchema } from '@currena/core';
import type { SeriesPoint } from '../series';
import { addMonths, daysBetween, epochDay, fromEpochDay, pointAtOrBefore } from '../series';
import { computeBasketValue } from '../basket';
import { decodeWeeklySeries } from '../markets/definitions';
import type { MarketEntry } from '@currena/core';
import {
  BIG_MOVE_PERCENTILE,
  FX_CHART_POINTS,
  FX_MAX_DAY_MOVE_PCT,
  FX_MIN_POINTS,
  FX_PAIRS,
  FX_PAIR_IDS,
  FX_PROVIDER_AGREEMENT_PCT,
  FX_RULES,
  FX_STALE_DAYS,
  FX_WEEKLY_POINTS,
  PATTERN_HOLDING_MIN,
  PATTERN_MIXED_MIN,
  PATTERN_WEEKS,
  R1_AUDJPY_M1_OK,
  R1_AUDJPY_M1_WARN,
  R1_CONFIRM_EURJPY_M1,
  R1_SP500_M1_OK,
  R1_SP500_M1_WARN,
  R2_NIKKEI_M1_WARN,
  R2_USDJPY_M1_WARN,
  R2_USDJPY_M3_PRESSURE,
  R3_DOLLAR_M1_STRONG,
  R3_DOLLAR_M1_WEAK,
  R3_DOLLAR_M3_STRONG,
  R3_DOLLAR_M3_WEAK,
  R4_DOLLAR_M1_DOWN,
  R4_DOLLAR_M1_UP,
  R4_GOLD_M1_UP,
  R4_SP500_M1_DOWN,
  R5_AUDUSD_M3_FALL,
  R5_AUDUSD_M3_RISE,
  R5_USDCNY_M3_FIRM,
  R5_USDCNY_M3_WEAK,
  R6_EURCHF_M1_WARN,
  R6_EUROSTOXX_M1_WARN,
  R7_DOLLAR_FOLLOWS,
  R7_DOLLAR_QUIET,
  R7_EURUSD_M1_MOVE,
  VERDICT_ATTENTION_COUNT,
  VERDICT_UNUSUAL_COUNT,
  WEEKLY_EPOCH_BASE_DAY,
  fxPairDefinition,
  fxRuleDefinition,
} from './definitions';
import type { FxCurrency } from './definitions';
import type { FxQuoteSet } from './providers';

/* ------------------------------------------------------------------ *
 * Small pure helpers
 * ------------------------------------------------------------------ */

function round2(n: number): number {
  return normalizeZero(Math.round(n * 100) / 100);
}

function round5(n: number): number {
  return normalizeZero(Math.round(n * 100000) / 100000);
}

/** A change that rounds to zero from below must not serialize as -0 (JSON). */
function normalizeZero(n: number): number {
  return n === 0 ? 0 : n;
}

/** Percent change (null on unusable bases — never fabricate). */
function pctChange(last: number, base: number | undefined | null): number | null {
  if (base === undefined || base === null || !Number.isFinite(base) || base <= 0) return null;
  return ((last - base) / base) * 100;
}

/* ------------------------------------------------------------------ *
 * Pair derivation (spec §3.1 + §4.1 rule 4: crosses are code)
 * ------------------------------------------------------------------ */

/** The USD-side rate of one currency on a date (undefined when absent). */
type RateMap = Partial<Record<FxCurrency, number>>;

/**
 * A pair's rate (quote units per 1 base) from the USD-side rates.
 * audjpy = JPY/AUD, eurjpy = JPY/EUR, eurchf = CHF/EUR, audcny = CNY/AUD.
 */
export function pairRateFromUsd(id: FxPairId, r: RateMap): number | undefined {
  switch (id) {
    case 'eurusd':
      return r.EUR === undefined ? undefined : 1 / r.EUR;
    case 'usdjpy':
      return r.JPY;
    case 'gbpusd':
      return r.GBP === undefined ? undefined : 1 / r.GBP;
    case 'usdchf':
      return r.CHF;
    case 'usdcny':
      return r.CNY;
    case 'audusd':
      return r.AUD === undefined ? undefined : 1 / r.AUD;
    case 'audjpy':
      return r.JPY === undefined || r.AUD === undefined ? undefined : r.JPY / r.AUD;
    case 'eurjpy':
      return r.JPY === undefined || r.EUR === undefined ? undefined : r.JPY / r.EUR;
    case 'eurchf':
      return r.CHF === undefined || r.EUR === undefined ? undefined : r.CHF / r.EUR;
    case 'audcny':
      return r.CNY === undefined || r.AUD === undefined ? undefined : r.CNY / r.AUD;
  }
}

/** The single currency a direct/inverse pair rides (crosses use two). */
const PAIR_CURRENCY: Partial<Record<FxPairId, FxCurrency>> = {
  eurusd: 'EUR',
  usdjpy: 'JPY',
  gbpusd: 'GBP',
  usdchf: 'CHF',
  usdcny: 'CNY',
  audusd: 'AUD',
};

/**
 * Build one pair's DAILY series from the per-currency USD-side series:
 * direct/inverse pairs ride a single currency; crosses are computed on the
 * dates where both legs spoke (Frankfurter serves every currency on every
 * ECB date, so the intersection is the full ECB calendar). V1 by
 * construction: every rate finite and > 0. The SOURCE is the caller's
 * fact (which provider produced the quote set), never derived here.
 */
export function pairSeriesFromQuotes(id: FxPairId, quotes: FxQuoteSet): SeriesPoint[] {
  const def = fxPairDefinition(id);
  const single = PAIR_CURRENCY[id];
  if (single !== undefined) {
    const src = quotes[single];
    if (src === undefined) throw new Error(`[fx] ${id}: missing ${single} series`);
    return def.derivation === 'direct'
      ? src.map((p) => ({ date: p.date, value: p.value }))
      : src.map((p) => ({ date: p.date, value: 1 / p.value }));
  }
  // ONE ascending pass per currency builds the date -> USD-side rates map
  // (every Frankfurter/Yahoo series is already date-ascending), then each
  // cross point is a single map lookup + arithmetic — linear, no repeated
  // binary searches (the Worker's CPU budget stays tiny).
  const byDate = new Map<string, Partial<Record<FxCurrency, number>>>();
  for (const ccy of Object.keys(quotes) as FxCurrency[]) {
    for (const p of quotes[ccy] ?? []) {
      const row = byDate.get(p.date);
      if (row === undefined) byDate.set(p.date, { [ccy]: p.value });
      else row[ccy] = p.value;
    }
  }
  const series: SeriesPoint[] = [];
  for (const [date, rates] of byDate) {
    const value = pairRateFromUsd(id, rates);
    if (value === undefined || !Number.isFinite(value) || value <= 0) continue;
    series.push({ date, value });
  }
  if (series.length === 0) throw new Error(`[fx] ${id}: empty cross series`);
  return series;
}

/* ------------------------------------------------------------------ *
 * The four period changes (spec §6.1)
 * ------------------------------------------------------------------ */

/**
 * d1/m1/m3/y1 of a series' last value vs the value on or before the same
 * date one period earlier (d1 = the previous point — "change since the
 * previous day's ECB reference rate").
 */
export function changesOf(points: readonly SeriesPoint[]): FxChg {
  if (points.length < 2) throw new Error('[fx] series too short for changes');
  const last = points[points.length - 1]!;
  const d1 = pctChange(last.value, points[points.length - 2]!.value);
  const m1 = pctChange(last.value, pointAtOrBefore(points, addMonths(last.date, -1))?.value);
  const m3 = pctChange(last.value, pointAtOrBefore(points, addMonths(last.date, -3))?.value);
  const y1 = pctChange(last.value, pointAtOrBefore(points, addMonths(last.date, -12))?.value);
  if (d1 === null || m1 === null || m3 === null || y1 === null) {
    throw new Error(`[fx] ${last.date}: a period base is missing (series too short)`);
  }
  return { d1: round2(d1), m1: round2(m1), m3: round2(m3), y1: round2(y1) };
}

/* ------------------------------------------------------------------ *
 * move_rank — the "unusually large move" percentile (spec §6.2)
 * ------------------------------------------------------------------ */

/**
 * Share (0–100) of the rolling one-month moves in the last 365 days that
 * are SMALLER than today's one-month move, ignoring direction.
 */
export function moveRankOf(points: readonly SeriesPoint[]): number {
  const last = points[points.length - 1]!;
  const today = changesOf(points).m1;
  const cutoff = epochDay(last.date) - 365;
  let smaller = 0;
  let total = 0;
  // Two-pointer walk: the 1-month-back base index only ever moves forward,
  // so the whole scan is linear (no per-point binary search / slice).
  let baseIdx = 0;
  for (let i = 1; i < points.length; i++) {
    const p = points[i]!;
    if (epochDay(p.date) < cutoff) continue;
    const target = addMonths(p.date, -1);
    while (baseIdx + 1 < i && points[baseIdx + 1]!.date <= target) baseIdx++;
    const base = points[baseIdx]!.date <= target ? points[baseIdx]!.value : undefined;
    if (base === undefined || base <= 0) continue;
    total++;
    if (Math.abs(((p.value - base) / base) * 100) < Math.abs(today)) smaller++;
  }
  if (total === 0) return 0;
  return round2((smaller / total) * 100);
}

/* ------------------------------------------------------------------ *
 * Weekly series (delta-encoded like the markets section) + the week grid
 * ------------------------------------------------------------------ */

/** Week start (Monday) of an epoch day. */
function weekStartOf(day: number): number {
  return day - ((day + 3) % 7);
}

/** ≤52 weekly closes as [dayDelta, close] pairs (5-dp precision — fx rates are small). */
export function fxWeeklySeries(points: readonly SeriesPoint[]): [number, number][] {
  const byWeek = new Map<number, SeriesPoint>();
  for (const p of points) {
    byWeek.set(weekStartOf(epochDay(p.date)), p); // ascending input → last write wins
  }
  const weeks = [...byWeek.values()].slice(-FX_WEEKLY_POINTS);
  const out: [number, number][] = [];
  let prevDay = WEEKLY_EPOCH_BASE_DAY;
  for (const p of weeks) {
    const day = epochDay(p.date);
    out.push([day - prevDay, round5(p.value)]);
    prevDay = day;
  }
  return out;
}

/**
 * The shared week grid: `n` consecutive Monday-start weeks ending at the
 * anchor's week. Each series' value at a slot = its last point on or
 * before the slot's week END (forward-fill across a holiday gap; undefined
 * before its first point). Charts and pattern checks read this grid so
 * "week k" means the same week for every series.
 */
export function weekGrid(
  seriesList: readonly (readonly SeriesPoint[])[],
  slots: number,
): { weekStarts: number[]; values: Array<(number | undefined)[]> } {
  let anchorDay = 0;
  for (const s of seriesList) {
    if (s.length > 0) anchorDay = Math.max(anchorDay, epochDay(s[s.length - 1]!.date));
  }
  const anchorWeek = weekStartOf(anchorDay);
  const weekStarts: number[] = [];
  for (let i = slots - 1; i >= 0; i--) weekStarts.push(anchorWeek - i * 7);
  // One forward walk per series (slots ascend, series ascend): the pointer
  // only ever moves forward, so the grid is linear — no per-slot binary
  // search with its O(n) ascending assert.
  const values = seriesList.map((s) => {
    const out: Array<number | undefined> = [];
    let idx = 0;
    for (const ws of weekStarts) {
      const weekEndDay = ws + 6;
      while (idx < s.length && epochDay(s[idx]!.date) <= weekEndDay) idx++;
      out.push(idx === 0 ? undefined : s[idx - 1]!.value);
    }
    return out;
  });
  return { weekStarts, values };
}

/** Rebase a value list to 100 at its first defined value (chart lines, spec §9.3). */
export function rebaseTo100(values: readonly (number | undefined)[]): number[] {
  const first = values.find((v) => v !== undefined);
  if (first === undefined) return [];
  const base = first as number;
  return values.filter((v) => v !== undefined).map((v) => round2(((v as number) / base) * 100));
}

/* ------------------------------------------------------------------ *
 * The 13-week pattern check (spec §6.4)
 * ------------------------------------------------------------------ */

/**
 * Count the weeks the two series moved the way the pattern expects
 * (together/opposite). Weeks with no change on either side are skipped
 * (null). Holding ≥ 9 of 13 · Mixed 7–8 · Not holding ≤ 6 · nodata when
 * either series is absent or the whole window is skipped (no evidence).
 */
export function patternCheck(
  a: readonly SeriesPoint[] | undefined,
  b: readonly SeriesPoint[] | undefined,
  expect: 'together' | 'opposite',
): FxPatternCheck {
  const empty: FxPatternCheck = { status: 'nodata', agreeWeeks: 0, ofWeeks: PATTERN_WEEKS, weeks: [] };
  if (a === undefined || b === undefined || a.length === 0 || b.length === 0) return empty;
  // 13 weekly changes need 14 week slots.
  const { values } = weekGrid([a, b], PATTERN_WEEKS + 1);
  const va = values[0]!;
  const vb = values[1]!;
  const weeks: Array<boolean | null> = [];
  let agree = 0;
  let skipped = 0;
  for (let i = 1; i <= PATTERN_WEEKS; i++) {
    const a0 = va[i - 1];
    const a1 = va[i];
    const b0 = vb[i - 1];
    const b1 = vb[i];
    if (a0 === undefined || a1 === undefined || b0 === undefined || b1 === undefined) {
      weeks.push(null);
      skipped++;
      continue;
    }
    const da = a1 - a0;
    const db = b1 - b0;
    if (da === 0 || db === 0) {
      weeks.push(null); // a week with no change is skipped (§6.4)
      skipped++;
      continue;
    }
    const sameDirection = (da > 0 && db > 0) || (da < 0 && db < 0);
    const held = expect === 'together' ? sameDirection : !sameDirection;
    weeks.push(held);
    if (held) agree++;
  }
  if (skipped === PATTERN_WEEKS) return empty; // no evidence at all
  const status: FxPatternCheck['status'] =
    agree >= PATTERN_HOLDING_MIN ? 'holding' : agree >= PATTERN_MIXED_MIN ? 'mixed' : 'not_holding';
  return { status, agreeWeeks: agree, ofWeeks: PATTERN_WEEKS, weeks };
}

/* ------------------------------------------------------------------ *
 * Pair + dollar entries (V6, V7 by construction)
 * ------------------------------------------------------------------ */

/** One pair's stored row from a validated daily series. */
export function buildFxPairEntry(
  id: FxPairId,
  series: readonly SeriesPoint[],
  source: FxPairEntry['source'],
  runDate: string,
): FxPairEntry {
  const last = series[series.length - 1]!;
  if (series.length < FX_MIN_POINTS) {
    throw new Error(`[fx] ${id}: only ${series.length} points (V4 needs ${FX_MIN_POINTS})`);
  }
  const moveRank = moveRankOf(series);
  return {
    id,
    asOf: last.date,
    rate: round5(last.value),
    chg: changesOf(series),
    moveRank,
    bigMove: moveRank >= BIG_MOVE_PERCENTILE,
    source,
    stale: daysBetween(last.date, runDate) > FX_STALE_DAYS,
    weekly: fxWeeklySeries(series),
  };
}

/**
 * The dollar measure: the existing Currena basket recipe (basket.ts)
 * computed per shared basket date from the USD-side quotes. Reused
 * exactly — D-06 in DECISIONS_FOR_ALI.
 */
export function buildDollarMeasure(
  quotes: FxQuoteSet,
  source: FxPairEntry['source'],
  runDate: string,
): FxDollarMeasure {
  const basketCurrencies = ['EUR', 'JPY', 'GBP', 'CAD', 'SEK', 'CHF'] as const;
  const byDate = new Map<string, Record<string, number>>();
  for (const ccy of basketCurrencies) {
    for (const p of quotes[ccy] ?? []) {
      const row = byDate.get(p.date) ?? {};
      row[ccy] = p.value;
      byDate.set(p.date, row);
    }
  }
  const series: SeriesPoint[] = [];
  for (const [date, row] of byDate) {
    let ok = true;
    for (const ccy of basketCurrencies) if (row[ccy] === undefined) ok = false;
    if (!ok) continue;
    series.push({ date, value: computeBasketValue(row as Record<string, number>) });
  }
  series.sort((x, y) => (x.date < y.date ? -1 : 1));
  if (series.length < FX_MIN_POINTS) {
    throw new Error(`[fx] dollar measure: only ${series.length} points (V4 needs ${FX_MIN_POINTS})`);
  }
  const last = series[series.length - 1]!;
  return {
    asOf: last.date,
    value: round5(last.value),
    chg: changesOf(series),
    weekly: fxWeeklySeries(series),
  };
}

/* ------------------------------------------------------------------ *
 * Cross-section inputs (spec §6.3) — a typed bundle the rules read
 * ------------------------------------------------------------------ */

/** What the job read from `insights:markets:v1` (stock legs + weekly charts). */
export interface FxStockInputs {
  /** 1-month changes, percent — undefined when the row is absent or stale. */
  sp500_m1?: number;
  nikkei_m1?: number;
  stoxx50_m1?: number;
  /** Weekly series for charts/pattern checks (decoded [epochDay, close]). */
  sp500?: SeriesPoint[];
  n225?: SeriesPoint[];
  stoxx50?: SeriesPoint[];
}

/** What the job read from `insights:hist:gold-usd`. */
export interface FxGoldInput {
  m1?: number;
  series?: SeriesPoint[];
}

/** Everything the rule engine needs, gathered by the job. */
export interface FxRuleInputs {
  /** This run's pair entries (chg + daily series for charts); a pair that produced no data this run is absent. */
  pairs: Readonly<Partial<Record<FxPairId, { chg: FxChg; series: readonly SeriesPoint[] }>>>;
  dollar: { chg: FxChg; series: readonly SeriesPoint[] };
  stocks: FxStockInputs;
  gold: FxGoldInput;
  /** R1's fear leg: a stored market-stress gauge is in warning (D-05). */
  fear: boolean;
  /** True when the stress gauges were READABLE this run (the insights snapshot exists). */
  fearAvailable: boolean;
}

/** Extract the rule inputs from a stored markets snapshot (missing/stale → absent). */
export function stockInputsFromMarkets(markets: { markets: readonly MarketEntry[] } | undefined, runDate: string): FxStockInputs {
  const out: FxStockInputs = {};
  if (markets === undefined) return out;
  const row = (id: MarketEntry['id']) => markets.markets.find((m) => m.id === id);
  const fresh = (m: MarketEntry | undefined): m is MarketEntry =>
    m !== undefined && !m.stale && daysBetween(m.asOf, runDate) <= FX_STALE_DAYS;
  const sp = row('sp500');
  if (fresh(sp)) {
    out.sp500_m1 = sp.chg1m;
    out.sp500 = decodeWeeklySeries(sp.weekly).map(([day, value]) => ({ date: fromEpochDay(day), value }));
  }
  const nk = row('n225');
  if (fresh(nk)) {
    out.nikkei_m1 = nk.chg1m;
    out.n225 = decodeWeeklySeries(nk.weekly).map(([day, value]) => ({ date: fromEpochDay(day), value }));
  }
  const st = row('stoxx50');
  if (fresh(st)) {
    out.stoxx50_m1 = st.chg1m;
    out.stoxx50 = decodeWeeklySeries(st.weekly).map(([day, value]) => ({ date: fromEpochDay(day), value }));
  }
  return out;
}

/** Extract the gold input from a stored `insights:hist:gold-usd` value. */
export function goldInputFromHistory(history: { points: readonly [number, number][] } | undefined, runDate: string): FxGoldInput {
  if (history === undefined || history.points.length === 0) return {};
  const series = history.points.map(([day, value]) => ({ date: fromEpochDay(day), value }));
  const last = series[series.length - 1]!;
  if (daysBetween(last.date, runDate) > 7) return {}; // a weekly-grace staleness for the history backbone
  const m1 = pctChange(last.value, pointAtOrBefore(series, addMonths(last.date, -1))?.value);
  return { m1: m1 === null ? undefined : round2(m1), series };
}

/* ------------------------------------------------------------------ *
 * Chart lines (spec §9.3 Level 2 item 1: 26 weeks, rebased to 100)
 * ------------------------------------------------------------------ */

function chartSeries(inputs: FxRuleInputs, keys: readonly string[]): Array<{ id: string; points: number[] }> {
  const seriesByKey = seriesMapOf(inputs);
  // Only the keys that actually have a series ride the grid, and each
  // output line maps back to ITS key — a missing series never shifts the
  // index of the others.
  const present = keys.filter((k) => seriesByKey[k] !== undefined);
  if (present.length < 2) return [];
  const { values } = weekGrid(present.map((k) => seriesByKey[k]!), FX_CHART_POINTS);
  return present.map((id, i) => {
    const points = rebaseTo100(values[i] ?? []);
    return points.length >= 2 ? { id, points: points.slice(-FX_CHART_POINTS) } : null;
  }).filter((x): x is { id: string; points: number[] } => x !== null);
}

/** The chart/pattern series registry: pair keys, dollar, gold, stock keys. */
function seriesMapOf(inputs: FxRuleInputs): Record<string, SeriesPoint[] | undefined> {
  const map: Record<string, SeriesPoint[] | undefined> = {};
  for (const id of FX_PAIR_IDS) {
    const p = inputs.pairs[id];
    if (p !== undefined) map[id] = [...p.series];
  }
  map.dollar = [...inputs.dollar.series];
  map.gold = inputs.gold.series === undefined ? undefined : [...inputs.gold.series];
  map.sp500 = inputs.stocks.sp500;
  map.n225 = inputs.stocks.n225;
  map.stoxx50 = inputs.stocks.stoxx50;
  return map;
}

/* ------------------------------------------------------------------ *
 * The seven rules (spec §6.3) + downgrade + progress (§6.4, §6.7)
 * ------------------------------------------------------------------ */

/**
 * A warning-line row. Legs only exist for AVAILABLE inputs — an absent
 * input simply has no row (the engine never fabricates a 0 or a NaN);
 * push helpers below skip undefined values.
 */
function leg(name: string, value: number, line: number, met: boolean): FxLeg {
  return { name, value: round2(value), line, met };
}

/** Push a leg only when its value exists. */
function pushLeg(legs: FxLeg[], name: string, value: number | undefined, line: number, met: boolean): void {
  if (value === undefined) return;
  legs.push(leg(name, value, line, met));
}

function progressOf(mainValue: number | undefined, warnAt: number): number {
  if (mainValue === undefined) return 0;
  // Only moves in the WARNING direction count (§6.7).
  const towards = warnAt < 0 ? Math.min(0, mainValue) : Math.max(0, mainValue);
  return Math.max(0, Math.min(100, (towards / warnAt) * 100));
}

function numbersOf(entries: Array<[string, number | undefined]>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of entries) if (v !== undefined) out[k] = round2(v);
  return out;
}

/** Evaluate the whole rule table. Pure; returns all seven states in rule order. */
export function evaluateFxRules(inputs: FxRuleInputs): FxRuleState[] {
  const out: FxRuleState[] = [];
  for (const def of FX_RULES) {
    out.push(evaluateRule(def.id, inputs));
  }
  // The downgrade pass (§6.4): Warning + Not-holding → Watch, not counted.
  for (let i = 0; i < out.length; i++) {
    const r = out[i]!;
    if (r.outcome === 'warning' && r.pattern.status === 'not_holding') {
      out[i] = { ...r, outcome: 'watch', counted: false, downgraded: true };
    }
  }
  return out;
}

function evaluateRule(id: FxRuleId, inputs: FxRuleInputs): FxRuleState {
  const def = fxRuleDefinition(id);
  const seriesMap = seriesMapOf(inputs);
  const chart = { expect: def.expect, series: chartSeries(inputs, def.chartSeries) };
  const pattern: FxPatternCheck = def.hasPatternCheck
    ? patternCheck(seriesMap[def.chartSeries[0]!], seriesMap[def.chartSeries[1]!], def.expect)
    : { status: 'nodata', agreeWeeks: 0, ofWeeks: PATTERN_WEEKS, weeks: [] };

  switch (id) {
    case 'r1_risk_mood': {
      const audjpy = inputs.pairs.audjpy?.chg;
      const eurjpy = inputs.pairs.eurjpy?.chg;
      const sp = inputs.stocks.sp500_m1;
      // The spec's no-data letter (§6.3): the rule's other-section input
      // (S&P 500) is missing AND the fear signal is unreadable → the row
      // says "Not enough data right now"; never a guess. (A readable fear
      // leg can still confirm a warning on its own.)
      if (audjpy === undefined || (sp === undefined && !inputs.fearAvailable)) {
        return nodataRule(id, chart, pattern, { audjpy_m1: audjpy?.m1, sp500_m1: sp });
      }
      const confirmed = eurjpy !== undefined && eurjpy.m1 <= R1_CONFIRM_EURJPY_M1;
      const stockConfirm = sp !== undefined && sp <= R1_SP500_M1_WARN;
      const confirmMet = stockConfirm || inputs.fear;
      const numbers = numbersOf([
        ['audjpy_m1', audjpy.m1],
        ['sp500_m1', sp],
        ['eurjpy_m1', eurjpy?.m1],
        ['market_fear', inputs.fear ? 1 : undefined],
      ]);
      const legs: FxLeg[] = [leg('audjpy_m1', audjpy.m1, R1_AUDJPY_M1_WARN, audjpy.m1 <= R1_AUDJPY_M1_WARN)];
      pushLeg(legs, 'sp500_m1', sp, R1_SP500_M1_WARN, stockConfirm);
      if (inputs.fear) legs.push(leg('market_fear', 1, 1, true));
      const okSide = audjpy.m1 >= R1_AUDJPY_M1_OK && sp !== undefined && sp >= R1_SP500_M1_OK;
      let outcome: FxRuleState['outcome'] = 'quiet';
      if (audjpy.m1 <= R1_AUDJPY_M1_WARN && confirmMet) outcome = 'warning';
      else if (audjpy.m1 <= R1_AUDJPY_M1_WARN) outcome = 'watch';
      else if (okSide) outcome = 'supportive';
      return {
        id,
        outcome,
        counted: outcome === 'warning',
        numbers,
        confirmedBy: confirmed ? ['eurjpy'] : [],
        progress: progressOf(audjpy.m1, R1_AUDJPY_M1_WARN),
        legs,
        pattern,
        chart,
      };
    }
    case 'r2_carry_trade': {
      const usdjpy = inputs.pairs.usdjpy?.chg;
      const nikkei = inputs.stocks.nikkei_m1;
      if (usdjpy === undefined) return nodataRule(id, chart, pattern, { usdjpy_m1: undefined });
      const numbers = numbersOf([
        ['usdjpy_m1', usdjpy.m1],
        ['usdjpy_m3', usdjpy.m3],
        ['nikkei_m1', nikkei],
      ]);
      const unwind = usdjpy.m1 <= R2_USDJPY_M1_WARN && nikkei !== undefined && nikkei <= R2_NIKKEI_M1_WARN;
      const pressure = usdjpy.m3 >= R2_USDJPY_M3_PRESSURE;
      const legs: FxLeg[] = [
        leg('usdjpy_m1', usdjpy.m1, R2_USDJPY_M1_WARN, unwind),
        leg('usdjpy_m3', usdjpy.m3, R2_USDJPY_M3_PRESSURE, pressure),
      ];
      pushLeg(legs, 'nikkei_m1', nikkei, R2_NIKKEI_M1_WARN, nikkei !== undefined && nikkei <= R2_NIKKEI_M1_WARN);
      const outcome: FxRuleState['outcome'] = unwind ? 'warning' : pressure ? 'watch' : 'quiet';
      return {
        id,
        outcome,
        counted: outcome === 'warning',
        numbers,
        confirmedBy: [],
        progress: progressOf(usdjpy.m1, R2_USDJPY_M1_WARN),
        legs,
        pattern,
        chart,
      };
    }
    case 'r3_dollar_strength': {
      const d = inputs.dollar.chg;
      const numbers = numbersOf([['dollar_m3', d.m3], ['dollar_m1', d.m1]]);
      // v1.3 (CR §3.1): the fast one-month leg fires the rule on its own —
      // M1 ≥ +3.0 or M3 ≥ +4.0 → Warning; M1 ≤ −3.0 or M3 ≤ −4.0 →
      // Supportive. `variant` records WHICH leg fired so the sentence names
      // its period honestly (the M1 leg wins the wording when both fire:
      // the fast trigger is the story of the week).
      const m1Strong = d.m1 >= R3_DOLLAR_M1_STRONG;
      const m1Weak = d.m1 <= R3_DOLLAR_M1_WEAK;
      const m3Strong = d.m3 >= R3_DOLLAR_M3_STRONG;
      const m3Weak = d.m3 <= R3_DOLLAR_M3_WEAK;
      const legs: FxLeg[] = [
        leg('dollar_m1_up', d.m1, R3_DOLLAR_M1_STRONG, m1Strong),
        leg('dollar_m1_down', d.m1, R3_DOLLAR_M1_WEAK, m1Weak),
        leg('dollar_m3_up', d.m3, R3_DOLLAR_M3_STRONG, m3Strong),
        leg('dollar_m3_down', d.m3, R3_DOLLAR_M3_WEAK, m3Weak),
      ];
      let outcome: FxRuleState['outcome'] = 'quiet';
      let variant: FxRuleState['variant'] | undefined;
      if (m1Strong || m3Strong) {
        outcome = 'warning';
        variant = m1Strong ? 'm1' : 'm3';
      } else if (m1Weak || m3Weak) {
        outcome = 'supportive';
        variant = m1Weak ? 'm1' : 'm3';
      }
      // §6.7 + CR §3.1: progress counts the NEARER of the two legs
      // (M1 against ±3.0, M3 against ±4.0), either direction.
      const progress = Math.max(
        0,
        Math.min(100, Math.max((Math.abs(d.m1) / R3_DOLLAR_M1_STRONG) * 100, (Math.abs(d.m3) / R3_DOLLAR_M3_STRONG) * 100)),
      );
      return { id, outcome, counted: outcome === 'warning', variant, numbers, confirmedBy: [], progress, legs, pattern, chart };
    }
    case 'r4_money_hiding': {
      const d = inputs.dollar.chg;
      const sp = inputs.stocks.sp500_m1;
      const g = inputs.gold.m1;
      if (sp === undefined) return nodataRule(id, chart, pattern, { sp500_m1: undefined });
      const numbers = numbersOf([
        ['sp500_m1', sp],
        ['dollar_m1', d.m1],
        ['gold_m1', g],
      ]);
      const flight = d.m1 >= R4_DOLLAR_M1_UP && sp <= R4_SP500_M1_DOWN;
      const wobble = d.m1 <= R4_DOLLAR_M1_DOWN && sp <= R4_SP500_M1_DOWN && g !== undefined && g >= R4_GOLD_M1_UP;
      const legs: FxLeg[] = [
        leg('sp500_m1', sp, R4_SP500_M1_DOWN, sp <= R4_SP500_M1_DOWN),
        leg('dollar_m1_up', d.m1, R4_DOLLAR_M1_UP, d.m1 >= R4_DOLLAR_M1_UP),
        leg('dollar_m1_down', d.m1, R4_DOLLAR_M1_DOWN, d.m1 <= R4_DOLLAR_M1_DOWN),
      ];
      pushLeg(legs, 'gold_m1', g, R4_GOLD_M1_UP, g !== undefined && g >= R4_GOLD_M1_UP);
      const outcome: FxRuleState['outcome'] = wobble || flight ? 'warning' : 'quiet';
      return {
        id,
        outcome,
        variant: wobble ? 'wobble' : flight ? 'flight' : undefined,
        counted: outcome === 'warning',
        numbers,
        confirmedBy: [],
        progress: progressOf(sp, R4_SP500_M1_DOWN),
        legs,
        pattern,
        chart,
      };
    }
    case 'r5_china_link': {
      const cny = inputs.pairs.usdcny?.chg;
      const aud = inputs.pairs.audusd?.chg;
      if (cny === undefined && aud === undefined) return nodataRule(id, chart, pattern, {});
      const numbers = numbersOf([
        ['usdcny_m3', cny?.m3],
        ['audusd_m3', aud?.m3],
      ]);
      const cnyWeak = cny !== undefined && cny.m3 >= R5_USDCNY_M3_WEAK;
      const audFall = aud !== undefined && aud.m3 <= R5_AUDUSD_M3_FALL;
      const cnyFirm = cny !== undefined && cny.m3 <= R5_USDCNY_M3_FIRM;
      const audRise = aud !== undefined && aud.m3 >= R5_AUDUSD_M3_RISE;
      let outcome: FxRuleState['outcome'] = 'quiet';
      if (cnyWeak && audFall) outcome = 'warning';
      else if (cnyFirm && audRise) outcome = 'supportive';
      else if (cnyWeak || audFall) outcome = 'watch'; // one of the two only (§6.3)
      const legs: FxLeg[] = [];
      pushLeg(legs, 'usdcny_m3', cny?.m3, R5_USDCNY_M3_WEAK, cnyWeak);
      pushLeg(legs, 'audusd_m3', aud?.m3, R5_AUDUSD_M3_FALL, audFall);
      const main = cny?.m3;
      return {
        id,
        outcome,
        counted: outcome === 'warning',
        numbers,
        confirmedBy: [],
        progress: main === undefined ? 0 : progressOf(main, R5_USDCNY_M3_WEAK),
        legs,
        pattern,
        chart,
      };
    }
    case 'r6_europe_worry': {
      const eurchf = inputs.pairs.eurchf?.chg;
      const stoxx = inputs.stocks.stoxx50_m1;
      if (eurchf === undefined) return nodataRule(id, chart, pattern, { eurchf_m1: undefined });
      const numbers = numbersOf([
        ['eurchf_m1', eurchf.m1],
        ['stoxx50_m1', stoxx],
      ]);
      const francFall = eurchf.m1 <= R6_EURCHF_M1_WARN;
      const stocksFall = stoxx !== undefined && stoxx <= R6_EUROSTOXX_M1_WARN;
      let outcome: FxRuleState['outcome'] = 'quiet';
      if (francFall && stocksFall) outcome = 'warning';
      else if (francFall) outcome = 'watch';
      const legs: FxLeg[] = [leg('eurchf_m1', eurchf.m1, R6_EURCHF_M1_WARN, francFall)];
      pushLeg(legs, 'stoxx50_m1', stoxx, R6_EUROSTOXX_M1_WARN, stocksFall);
      return {
        id,
        outcome,
        counted: outcome === 'warning',
        numbers,
        confirmedBy: [],
        progress: progressOf(eurchf.m1, R6_EURCHF_M1_WARN),
        legs,
        pattern,
        chart,
      };
    }
    case 'r7_dollar_or_euro': {
      const eurusd = inputs.pairs.eurusd?.chg;
      const d = inputs.dollar.chg;
      if (eurusd === undefined) return nodataRule(id, chart, pattern, { eurusd_m1: undefined });
      const numbers = numbersOf([
        ['eurusd_m1', eurusd.m1],
        ['dollar_m1', d.m1],
      ]);
      if (Math.abs(eurusd.m1) < R7_EURUSD_M1_MOVE) {
        // Below the trigger the context card stays away entirely (§9.3).
        return { id, outcome: 'quiet', counted: false, numbers, confirmedBy: [], progress: 0, legs: [], pattern, chart };
      }
      // v1.3 — the CORRECTED R7 (CR §3.3, fix B1): work in DOLLAR
      // strength. EUR/USD down means the dollar got stronger against the
      // euro, so e = −eurusd.m1 (positive = the dollar gained on the euro).
      // The old code compared the dollar measure with EUR/USD itself, so a
      // euro fall read as "the dollar barely moved".
      const e = -eurusd.m1;
      const sameWay = Math.sign(d.m1) === Math.sign(e);
      const dollarLed = sameWay && Math.abs(d.m1) >= R7_DOLLAR_FOLLOWS;
      const euroLed = Math.abs(d.m1) < R7_DOLLAR_QUIET;
      if (!dollarLed && !euroLed) {
        // Between 1.0 and 1.5, or the dollar moved the OPPOSITE way to the
        // euro: show NO card — do not guess (CR §3.3 item 5).
        return { id, outcome: 'quiet', counted: false, numbers, confirmedBy: [], progress: 0, legs: [], pattern, chart };
      }
      return {
        id,
        outcome: 'context',
        variant: dollarLed ? 'dollar-led' : 'euro-led',
        counted: false,
        numbers,
        confirmedBy: [],
        progress: 0,
        legs: [
          leg('eurusd_m1', eurusd.m1, R7_EURUSD_M1_MOVE, true),
          leg('dollar_m1', d.m1, R7_DOLLAR_FOLLOWS, dollarLed),
        ],
        pattern,
        chart,
      };
    }
  }
}

type FxChartSeriesLike = { id: string; points: number[] };

/** The no-data rule state: never a guess (§6.3's fifth outcome). */
function nodataRule(
  id: FxRuleId,
  chart: { expect: 'together' | 'opposite'; series: FxChartSeriesLike[] },
  pattern: FxPatternCheck,
  numbers: Record<string, number | undefined>,
): FxRuleState {
  return {
    id,
    outcome: 'nodata',
    counted: false,
    numbers: numbersOf(Object.entries(numbers)),
    confirmedBy: [],
    progress: 0,
    legs: [],
    pattern,
    chart: chart.series.length >= 2 ? chart : { expect: chart.expect, series: [] },
  };
}

/* ------------------------------------------------------------------ *
 * Section summary + snapshot assembly (§6.5, §5)
 * ------------------------------------------------------------------ */

export function summarizeFxRules(rules: readonly FxRuleState[]): FxSummary {
  const counted = rules.filter((r) => r.outcome === 'warning' && r.counted);
  const wobble = rules.find((r) => r.id === 'r4_money_hiding' && r.variant === 'wobble' && r.counted);
  const signal: FxSummary['signal'] =
    counted.length >= VERDICT_UNUSUAL_COUNT || wobble !== undefined
      ? 'unusual'
      : counted.length >= VERDICT_ATTENTION_COUNT
        ? 'attention'
        : 'normal';
  // v1.3 (fix B2): the headline names only the leading pattern that
  // COUNTS (a counted Warning). Supportive/Watch rows never lead it, and
  // the R7 context card can never appear here — a context card is not an
  // active pattern ("calm" + "Dollar or euro? is active" contradicted
  // itself). When nothing counts, the UI falls back to the calm headline
  // (§10.3 + CR §3.2's big-mover template).
  const headlineRule: FxRuleId | null = wobble !== undefined ? wobble.id : (counted[0]?.id ?? null);
  return { signal, countedWarnings: counted.length, headlineRule };
}

/**
 * The v1.3 plain-language helpers (CR §6 “Build notes”): tiny derived
 * fields stored once so the page never re-derives them. Under 1 KB:
 * `dollarYearExtreme` is one word, `movers` six small numbers.
 *
 * - `dollarYearExtreme`: 'high'/'low' when the dollar measure sits at its
 *   52-week extreme (S1's optional "its strongest/weakest in a year"
 *   clause) — computed from the stored weekly closes, null otherwise.
 * - `movers`: each big currency's OWN one-month change against the US
 *   dollar, percent, positive = the currency GAINED on the dollar (S2).
 *   X/USD pairs (euro, pound, Australian dollar) ride their own pair
 *   change; USD/X pairs (yen, yuan, franc) invert: 1 ÷ (1 + chg) − 1.
 */
export function buildFxPlain(
  dollarMeasure: FxDollarMeasure,
  pairs: readonly FxPairEntry[],
): FxPlain {
  const window = dollarMeasure.weekly.map(([, v]) => v).slice(-FX_WEEKLY_POINTS);
  let dollarYearExtreme: 'high' | 'low' | null = null;
  if (window.length > 0) {
    const max = Math.max(...window);
    const min = Math.min(...window);
    const v = dollarMeasure.value;
    if (v >= max && v > min) dollarYearExtreme = 'high';
    else if (v <= min && v < max) dollarYearExtreme = 'low';
  }
  const byId = new Map(pairs.map((p) => [p.id as string, p]));
  const own = (xUsd: FxPairId): number | undefined => byId.get(xUsd)?.chg.m1;
  const inv = (usdX: FxPairId): number | undefined => {
    const m1 = byId.get(usdX)?.chg.m1;
    return m1 === undefined ? undefined : round2((1 / (1 + m1 / 100) - 1) * 100);
  };
  return {
    dollarYearExtreme,
    movers: {
      EUR: own('eurusd'),
      JPY: inv('usdjpy'),
      GBP: own('gbpusd'),
      CNY: inv('usdcny'),
      CHF: inv('usdchf'),
      AUD: own('audusd'),
    },
  };
}

/** Assemble the ONE stored object (schema-validated before it is written). */
export function buildFxSnapshot(input: {
  generatedAt: string;
  dollarMeasure: FxDollarMeasure;
  pairs: readonly FxPairEntry[];
  rules: readonly FxRuleState[];
}): FxSnapshot {
  const summary = summarizeFxRules(input.rules);
  const snapshot: FxSnapshot = {
    v: 1,
    generatedAt: input.generatedAt,
    dollarMeasure: input.dollarMeasure,
    pairs: [...input.pairs],
    rules: [...input.rules],
    summary,
    plain: buildFxPlain(input.dollarMeasure, input.pairs),
  };
  return FxSnapshotSchema.parse(snapshot);
}

/* ------------------------------------------------------------------ *
 * Write-only-if-changed (§5 rule 2) — the fx twin of the markets gate
 * ------------------------------------------------------------------ */

export function fxContentHash(snapshot: Pick<FxSnapshot, 'dollarMeasure' | 'pairs' | 'rules' | 'summary'>): string {
  const text = JSON.stringify({
    dollarMeasure: snapshot.dollarMeasure,
    pairs: snapshot.pairs,
    rules: snapshot.rules,
    summary: snapshot.summary,
  });
  let h1 = 0x811c9dc5;
  let h2 = 5381;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = ((h1 ^ c) * 0x01000193) >>> 0;
    h2 = ((h2 << 5) + h2 + c) >>> 0;
  }
  return `${h1.toString(16)}-${h2.toString(16)}`;
}

export function fxContentEqual(
  a: Pick<FxSnapshot, 'dollarMeasure' | 'pairs' | 'rules' | 'summary'> | undefined,
  b: Pick<FxSnapshot, 'dollarMeasure' | 'pairs' | 'rules' | 'summary'>,
): boolean {
  if (a === undefined) return false;
  return fxContentHash(a) === fxContentHash(b);
}

/* ------------------------------------------------------------------ *
 * Validation helpers for the fetch job (V2, V3, V5)
 * ------------------------------------------------------------------ */

/** V3's trigger: a >5% one-day move in a pair's latest change. */
export function suspiciousDayMove(chg: FxChg): boolean {
  return Math.abs(chg.d1) >= FX_MAX_DAY_MOVE_PCT;
}

/** V5/V3's agreement band. */
export function ratesAgree(a: number, b: number): boolean {
  return Math.abs(((a - b) / b) * 100) <= FX_PROVIDER_AGREEMENT_PCT;
}

export { pctChange };
