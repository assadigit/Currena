/**
 * Insights display config + pure rendering helpers (Phase I4 → I15).
 *
 * Everything here is platform-free pure TypeScript (AGENTS.md rule 2) so it
 * unit-tests without a DOM: the question-group/gauge layout, per-indicator
 * value formatting (decimals, unit, scale, the Fed target's 25bp corridor),
 * plain-language rule text, 10-year-position warning zones + position
 * WORDS (Block F3), state-keyed consequence-line selection (Block F4 +
 * data spec §6), the big-mover callout (Block H3), the prices-board row
 * list (Block PB1), and the lane/hero ordering settings (Blocks H1/L1).
 *
 * Copy lives in the i18n copy modules (insights-copy-en/fa.ts); this module
 * only defines the structural interfaces those dictionaries satisfy.
 */

import { formatNumber } from '@currena/core';
import type {
  IndicatorId,
  IndicatorReading,
  InsightsSection,
  IndicatorGroupId,
  WarningRule,
  WarningRuleAtom,
} from '@currena/core';
import { DEFINITIONS, GAUGES } from '@currena/insights';
import type { LegEval } from '@currena/insights';
import { interpolate } from '../../i18n';
import type { IndicatorCopyEntry, ConsequenceLines, InsightsCopy } from '../../i18n/insights-copy-en';

/* ------------------------------------------------------------------ *
 * Section / group layout (the I15 question-group restructure)
 * ------------------------------------------------------------------ */

/** Page order: Global BEFORE Australia in the LANES (owner Gate I4 kept);
 * the HERO is Australia-first by default with a swap setting (Block H1). */
export const SECTION_ORDER: readonly InsightsSection[] = ['global', 'australia'];

/** Group order within each section (the gauge/lane order, GAUGES-first). */
export const GROUP_ORDER: Readonly<Record<InsightsSection, readonly IndicatorGroupId[]>> = {
  global: ['borrowing-costs', 'prices-heat', 'market-stress', 'dollar-strength', 'growth-health'],
  australia: ['au-inflation-rates', 'au-households', 'au-trade-currency'],
};

/** The prices board (Block PB1): fixed row order — not a gauge, never votes. */
export const PRICE_ROWS: readonly IndicatorId[] = [
  'brent',
  'gold-usd',
  'silver-usd',
  'copper-usd',
  'iron-ore',
  'btc-usd',
];

/** The Bitcoin context ratios (Block PB2) + the gold row's AUD companion. */
export const BTC_RATIO_IDS: readonly IndicatorId[] = ['gold-btc', 'silver-btc'];

export function definitionsForGroup(
  section: InsightsSection,
  group: IndicatorGroupId,
): typeof DEFINITIONS {
  return DEFINITIONS.filter((d) => d.section === section && d.group === group);
}

export function definitionFor(id: IndicatorId): (typeof DEFINITIONS)[number] {
  const def = DEFINITIONS.find((d) => d.id === id);
  if (!def) throw new Error(`insights: no definition for '${id}'`);
  return def;
}

/** Per-group status line counts: voters, alerts, excluded within one group. */
export function groupCounts(
  readings: readonly IndicatorReading[],
  section: InsightsSection,
  group: IndicatorGroupId,
): { alertCount: number; votingCount: number; excludedCount: number } {
  const ids = new Set(definitionsForGroup(section, group).map((d) => d.id));
  let alertCount = 0;
  let votingCount = 0;
  let excludedCount = 0;
  for (const r of readings) {
    if (!ids.has(r.id)) continue;
    if (r.status === 'warning' || r.status === 'normal') {
      votingCount += 1;
      if (r.status === 'warning') alertCount += 1;
    } else if (r.status === 'stale' || r.status === 'no-history' || r.status === 'unavailable') {
      excludedCount += 1;
    }
  }
  return { alertCount, votingCount, excludedCount };
}

/** Is this id one of the gauge's voting members (vs a lane context row)? */
export function isGaugeMember(id: IndicatorId): boolean {
  return GAUGES.some((g) => g.members.includes(id));
}

/* ------------------------------------------------------------------ *
 * Value formatting — canonical numbers, formatted ONLY at render
 * ------------------------------------------------------------------ */

export type UnitToken = 'none' | 'percent' | 'points' | 'usd' | 'aud' | 'usd-bn' | 'index';

/** Locale-dependent unit labels (from the copy dictionaries). */
export interface UnitLabels {
  none: string;
  percent: string;
  points: string;
  usd: string;
  aud: string;
  'usd-bn': string;
  index: string;
}

interface DisplayConfig {
  /** Fraction digits for the value. */
  decimals: number;
  /** Unit label token (rendered per-locale). */
  unit: UnitToken;
  /** Multiplicative display scale (e.g. fractions → percent). */
  scale?: number;
  /** I15 fed-target: render the 25bp corridor around the midpoint (Block PB/H1 spec §3). */
  range?: boolean;
}

/** Units rendered as a prefix in English (suffix everywhere in Farsi). */
const PREFIXED_UNITS: ReadonlySet<UnitToken> = new Set(['usd', 'aud', 'usd-bn']);

export const DISPLAY: Readonly<Record<IndicatorId, DisplayConfig>> = {
  'yield-curve-10y2y': { decimals: 2, unit: 'points' },
  'real-yield-10y': { decimals: 2, unit: 'percent' },
  us10y: { decimals: 2, unit: 'percent' },
  'fed-target': { decimals: 2, unit: 'percent', range: true },
  'ecb-dfr': { decimals: 2, unit: 'percent' },
  'govt-interest-revenue': { decimals: 1, unit: 'percent', scale: 100 },
  'us-cpi-yoy': { decimals: 1, unit: 'percent' },
  'breakeven-5y5y': { decimals: 2, unit: 'percent' },
  'stress-stlfsi': { decimals: 2, unit: 'none' },
  nfci: { decimals: 2, unit: 'none' },
  'gold-silver': { decimals: 1, unit: 'none' },
  'dollar-basket': { decimals: 2, unit: 'index' },
  usdjpy: { decimals: 2, unit: 'none' },
  'eur-usd': { decimals: 4, unit: 'none' },
  'china-pmi': { decimals: 1, unit: 'none' },
  'm2-us': { decimals: 0, unit: 'usd-bn' },
  'copper-gold': { decimals: 2, unit: 'none' },
  usdcny: { decimals: 4, unit: 'none' },
  brent: { decimals: 2, unit: 'usd' },
  'gold-usd': { decimals: 0, unit: 'usd' },
  'silver-usd': { decimals: 2, unit: 'usd' },
  'copper-usd': { decimals: 0, unit: 'usd' },
  'btc-usd': { decimals: 0, unit: 'usd' },
  'gold-btc': { decimals: 4, unit: 'none' },
  'silver-btc': { decimals: 5, unit: 'none' },
  'au-cpi': { decimals: 1, unit: 'percent' },
  'au-trimmed-mean': { decimals: 1, unit: 'percent' },
  'au-us-10y-gap': { decimals: 2, unit: 'points' },
  'rba-cash-rate': { decimals: 2, unit: 'percent' },
  'au-petrol-yoy': { decimals: 1, unit: 'percent' },
  'au-home-loan': { decimals: 2, unit: 'percent' },
  'au-wage-growth': { decimals: 1, unit: 'percent' },
  'au-rent-yoy': { decimals: 1, unit: 'percent' },
  'au-unemployment': { decimals: 1, unit: 'percent' },
  'au-home-values': { decimals: 1, unit: 'none' },
  'au-household-debt-arrears': { decimals: 1, unit: 'percent' },
  audusd: { decimals: 4, unit: 'none' },
  audjpy: { decimals: 2, unit: 'none' },
  'terms-of-trade': { decimals: 1, unit: 'index' },
  'iron-ore': { decimals: 1, unit: 'usd' },
  'gold-aud': { decimals: 0, unit: 'aud' },
};

/** The Fed target corridor's half-width (the FOMC has used 25bp since 2008). */
const FED_CORRIDOR_HALF = 0.125;

/** Current-value rendering, e.g. '5.31%', 'US$23,343bn', '۰٫۴۸'. */
export function formatIndicatorValue(
  id: IndicatorId,
  value: number,
  numberLocale: 'en-US' | 'fa-IR',
  units: UnitLabels,
): string {
  const cfg = DISPLAY[id];
  const num = formatNumber(value * (cfg.scale ?? 1), numberLocale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });
  const unit = units[cfg.unit];
  if (!unit) return num;
  if (cfg.range) {
    // '3.50–3.75%' — the corridor around the stored midpoint (definitions
    // note: exact binary-representable quarters, no float dust).
    const lo = formatNumber(value - FED_CORRIDOR_HALF, numberLocale, {
      minimumFractionDigits: cfg.decimals,
      maximumFractionDigits: cfg.decimals,
    });
    return `${lo}–${num}${unit}`;
  }
  if (cfg.unit === 'percent') return `${num}${unit}`; // '5.31%' / '۵٫۳۱٪' — no space, both locales.
  if (numberLocale === 'en-US' && PREFIXED_UNITS.has(cfg.unit)) return `${unit}${num}`; // 'US$113.96'
  return `${num} ${unit}`; // '۱۱۳٫۹۶ دلار آمریکا' / '0.48 pts'
}

/** Signed 7/30-day change rendering ('+0.62%' / '+۰٫۱۱ نقطه'). Render inside dir="ltr". */
export function formatChange(
  change: number,
  changeKind: 'pct' | 'points',
  numberLocale: 'en-US' | 'fa-IR',
  units: UnitLabels,
): string {
  const num = formatNumber(Math.abs(change), numberLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  const unit = changeKind === 'pct' ? units.percent : units.points;
  // Percent binds tight ('+0.62%'); word-like units take a space ('+0.11 pts').
  return changeKind === 'pct' ? `${sign}${num}${unit}` : `${sign}${num} ${unit}`;
}

/* ------------------------------------------------------------------ *
 * Plain-language rule text (01-indicator-spec.md §4: every threshold
 * shown on the card; no hidden math)
 * ------------------------------------------------------------------ */

/** Copy fragments for rendering a WarningRule in plain language. */
export interface RuleCopy {
  info: string;
  thresholdAbove: string;
  thresholdAboveSustained: string;
  thresholdBelow: string;
  thresholdBelowSustained: string;
  percentileHigh: string;
  percentileLow: string;
  changeRisePct: string;
  changeFallPct: string;
  changeRisePoints: string;
  changeFallPoints: string;
  yoyNegative: string;
  consecutiveDecline: string;
  aboveLow: string;
  belowAux: string;
  or: string;
}

function fmt(value: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(value, numberLocale, { maximumFractionDigits: 2 });
}

function ruleAtomText(
  atom: WarningRuleAtom,
  copy: RuleCopy,
  units: UnitLabels,
  numberLocale: 'en-US' | 'fa-IR',
  unitToken: UnitToken,
): string {
  switch (atom.kind) {
    case 'info':
      return copy.info;
    case 'below-aux':
      return copy.belowAux;
    case 'threshold': {
      const unit =
        unitToken === 'percent' ? units.percent : unitToken === 'points' ? ` ${units.points}` : '';
      const value = `${fmt(atom.value, numberLocale)}${unit}`;
      const template = atom.sustainedWeeks
        ? atom.direction === 'above'
          ? copy.thresholdAboveSustained
          : copy.thresholdBelowSustained
        : atom.direction === 'above'
          ? copy.thresholdAbove
          : copy.thresholdBelow;
      return interpolate(template, { value, weeks: fmt(atom.sustainedWeeks ?? 0, numberLocale) });
    }
    case 'percentile': {
      const pct = `${fmt(atom.cutoff * 100, numberLocale)}${units.percent}`;
      return interpolate(atom.tail === 'high' ? copy.percentileHigh : copy.percentileLow, { pct });
    }
    case 'change': {
      const template =
        atom.direction === 'rise'
          ? atom.mode === 'pct'
            ? copy.changeRisePct
            : copy.changeRisePoints
          : atom.mode === 'pct'
            ? copy.changeFallPct
            : copy.changeFallPoints;
      const mag =
        atom.mode === 'pct'
          ? `${fmt(atom.magnitude, numberLocale)}${units.percent}`
          : `${fmt(atom.magnitude, numberLocale)} ${units.points}`;
      return interpolate(template, { magnitude: mag, weeks: fmt(atom.windowWeeks, numberLocale) });
    }
    case 'yoy-negative':
      return copy.yoyNegative;
    case 'consecutive-decline':
      return interpolate(copy.consecutiveDecline, { periods: fmt(atom.periods, numberLocale) });
    case 'above-low':
      return interpolate(copy.aboveLow, { rise: `${fmt(atom.rise, numberLocale)} ${units.points}` });
  }
}

/** Full plain-language rule sentence for one indicator's card. */
export function formatRuleText(
  rule: WarningRule,
  id: IndicatorId,
  copy: RuleCopy,
  units: UnitLabels,
  numberLocale: 'en-US' | 'fa-IR',
): string {
  const unitToken = DISPLAY[id].unit;
  if (rule.kind === 'any-of') {
    return rule.of
      .map((atom) => ruleAtomText(atom, copy, units, numberLocale, unitToken))
      .join(` ${copy.or} `);
  }
  return ruleAtomText(rule, copy, units, numberLocale, unitToken);
}

/* ------------------------------------------------------------------ *
 * 10-year position — warning zone, position WORDS, state keys
 * ------------------------------------------------------------------ */

/** The fraction band [from, to] of the 0–100% position bar the rule watches, if any. */
export function warningZone(rule: WarningRule): { from: number; to: number } | null {
  const zones = (rule.kind === 'any-of' ? rule.of : [rule])
    .map((atom): { from: number; to: number } | null => {
      if (atom.kind !== 'percentile') return null;
      return atom.tail === 'high' ? { from: 1 - atom.cutoff, to: 1 } : { from: 0, to: atom.cutoff };
    })
    .filter((z): z is { from: number; to: number } => z !== null);
  if (zones.length === 0) return null;
  // Merge overlapping zones (a hypothetical both-tails any-of).
  const sorted = [...zones].sort((a, b) => a.from - b.from);
  const merged = [sorted[0]!];
  for (const zone of sorted.slice(1)) {
    const last = merged[merged.length - 1]!;
    if (zone.from <= last.to) last.to = Math.max(last.to, zone.to);
    else merged.push(zone);
  }
  return merged.length === 1 ? merged[0]! : null; // Disjoint zones: don't shade (none today).
}

/** The position band (F3): <20 low · 20–80 typical · >80 high. */
export type PositionBand = 'low' | 'typical' | 'high';

export function positionBand(percentile10y: number): PositionBand {
  if (percentile10y < 0.2) return 'low';
  if (percentile10y > 0.8) return 'high';
  return 'typical';
}

/** The state key for consequence-line selection (data spec §6 + F4). */
export type ConsequenceState = keyof ConsequenceLines; // 'highRising' | 'highEasing' | 'typical' | 'low' | 'jumping'

/**
 * Pick the consequence-line state for one reading:
 *  - price rows (PB ids) with |moveScore| ≥ threshold → 'jumping'
 *  - high band + 30d rise → 'highRising'; high band otherwise → 'highEasing'
 *  - low band → 'low'; else 'typical'
 * Stale/unavailable/no-percentile items have no state (oneLiner fallback).
 */
export const MOVE_SCORE_THRESHOLD = 2.0;

export function consequenceState(reading: IndicatorReading, isPriceRow: boolean): ConsequenceState | null {
  if (reading.percentile10y === undefined) return null;
  if (isPriceRow && reading.moveScore !== undefined && Math.abs(reading.moveScore) >= MOVE_SCORE_THRESHOLD) {
    return 'jumping';
  }
  const band = positionBand(reading.percentile10y);
  if (band === 'high') {
    const rising = reading.change30d !== undefined && reading.change30d > 0;
    return rising ? 'highRising' : 'highEasing';
  }
  return band; // 'typical' | 'low'
}

/** The consequence line for a reading (F4): state line → oneLiner fallback. */
export function consequenceLine(
  reading: IndicatorReading,
  entry: IndicatorCopyEntry,
  isPriceRow: boolean,
): string {
  const state = consequenceState(reading, isPriceRow);
  if (state) {
    const line = entry.lines?.[state];
    if (line) return line;
  }
  return entry.oneLiner;
}

/* ------------------------------------------------------------------ *
 * The big-mover callout (Block H3 + data spec §4)
 * ------------------------------------------------------------------ */

export interface BigMoverRow {
  id: IndicatorId;
  /** |z| ≥ 2 items only — the callout hides otherwise (Block H3). */
  change30d: number;
  changeKind: 'pct' | 'points';
  moveScore: number;
}

/** All readings whose |moveScore| clears the threshold, freshest data only. */
export function bigMovers(readings: readonly IndicatorReading[], limit = 3): BigMoverRow[] {
  const rows: BigMoverRow[] = [];
  for (const r of readings) {
    if (r.moveScore === undefined || !Number.isFinite(r.moveScore)) continue;
    if (Math.abs(r.moveScore) < MOVE_SCORE_THRESHOLD) continue;
    if (r.change30d === undefined || !Number.isFinite(r.change30d)) continue;
    const def = definitionFor(r.id);
    if (def.rule.kind === 'info' && !PRICE_ROWS.includes(r.id)) continue; // context cards never headline (price rows can)
    rows.push({ id: r.id, change30d: r.change30d, changeKind: def.changeKind, moveScore: r.moveScore });
  }
  return rows
    .sort((a, b) => Math.abs(b.moveScore) - Math.abs(a.moveScore))
    .slice(0, limit)
    .map(({ id, change30d, changeKind, moveScore }) => ({ id, change30d, changeKind, moveScore }));
}

/* ------------------------------------------------------------------ *
 * Alerting-indicator chips (Block H2) — sorted by 10y-range height
 * ------------------------------------------------------------------ */

export interface AlertChipRow {
  id: IndicatorId;
  percentile10y: number;
}

/**
 * The alerting gauge members of one section, sorted by how high they sit in
 * their own 10-year range (descending), with the no-percentile items last.
 */
export function alertingIndicators(
  readings: readonly IndicatorReading[],
  section: InsightsSection,
): AlertChipRow[] {
  const sectionIds = new Set(DEFINITIONS.filter((d) => d.section === section).map((d) => d.id));
  const gaugeIds = new Set(GAUGES.filter((g) => g.section === section).flatMap((g) => g.members));
  return readings
    .filter(
      (r) =>
        r.status === 'warning' &&
        gaugeIds.has(r.id) &&
        sectionIds.has(r.id) &&
        r.percentile10y !== undefined,
    )
    .map((r) => ({ id: r.id, percentile10y: r.percentile10y! }))
    .sort((a, b) => b.percentile10y - a.percentile10y);
}

/* ------------------------------------------------------------------ *
 * Card filter (I8) — view-level narrowing of the rows/cards grid
 * ------------------------------------------------------------------ */

export type StatusFilter = 'all' | 'warning' | 'normal' | 'context';

export interface CardFilter {
  status: StatusFilter;
  query: string;
}

/** ZWNJ → word separator (first!), other zero-widths/bidi stripped, whitespace collapsed. */
function spacedNorm(s: string): string {
  return s
    .replace(/\u064A/g, '\u06CC')
    .replace(/\u0643/g, '\u06A9')
    .replace(/\u200C/g, ' ')
    .replace(/[\u200B\u200D-\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Does one reading pass the status chips + text query? (Pure, unit-tested.) */
export function indicatorMatchesFilter(
  reading: IndicatorReading,
  filter: CardFilter,
  nameOf: (id: IndicatorId) => { name: string; ticker?: string },
): boolean {
  if (filter.status !== 'all' && reading.status !== filter.status) return false;
  const tokens = spacedNorm(filter.query).split(' ').filter((t) => t.length > 0);
  if (tokens.length === 0) return true;
  const entry = nameOf(reading.id);
  const hayA = spacedNorm(`${entry.name} ${entry.ticker ?? ''}`);
  const hayB = hayA.replace(/ /g, ''); // fused compounds (ZWNJ neighbours)
  return tokens.every((t) => hayA.includes(t) || hayB.includes(t));
}

/** Ids that survive the filter, in snapshot order. Empty query + 'all' → null (no filtering). */
export function filterVisibleIds(
  readings: readonly IndicatorReading[],
  filter: CardFilter,
  nameOf: (id: IndicatorId) => { name: string; ticker?: string },
): Set<IndicatorId> | null {
  if (filter.status === 'all' && filter.query.trim() === '') return null;
  const ids = new Set<IndicatorId>();
  for (const r of readings) {
    if (indicatorMatchesFilter(r, filter, nameOf)) ids.add(r.id);
  }
  return ids;
}

/** Live per-status counts for the FilterBar chips (I9). */
export function statusCounts(
  readings: readonly IndicatorReading[],
): { all: number; warning: number; normal: number; context: number } {
  const counts = { all: readings.length, warning: 0, normal: 0, context: 0 };
  for (const r of readings) {
    if (r.status === 'warning') counts.warning += 1;
    else if (r.status === 'normal') counts.normal += 1;
    else if (r.status === 'context') counts.context += 1;
  }
  return counts;
}

/* ------------------------------------------------------------------ *
 * Chart range (I9) — view-level zoom of the 10-year chart
 * ------------------------------------------------------------------ */

export type ChartRange = '10y' | '5y' | '1y';

const RANGE_DAYS: Readonly<Record<ChartRange, number>> = {
  '10y': 3653, // 10 years + leap-day slack
  '5y': 1827,
  '1y': 366,
};

export function sliceHistoryToRange(
  points: readonly [number, number][],
  range: ChartRange,
): readonly [number, number][] {
  if (!rangeIsPlottable(points, range)) return points.length >= 2 ? points : [];
  const lastDay = points[points.length - 1]![0];
  const cutoff = lastDay - RANGE_DAYS[range];
  return points.filter((p) => p[0] >= cutoff);
}

/** Would this range show at least 2 points? (Drives the disabled state.) */
export function rangeIsPlottable(points: readonly [number, number][], range: ChartRange): boolean {
  if (points.length === 0) return false;
  const lastDay = points[points.length - 1]![0];
  const cutoff = lastDay - RANGE_DAYS[range];
  return points.filter((p) => p[0] >= cutoff).length >= 2;
}

/* ------------------------------------------------------------------ *
 * Pinned watchlist (I10) — view-level personalization, localStorage only
 * ------------------------------------------------------------------ */

/** localStorage key (versioned so a future shape change can migrate). */
export const PINNED_STORAGE_KEY = 'currena.insights.pinned.v1';

/** Parse a stored pinned list (unknown ids drop silently, malformed degrades). */
export function parsePinnedIds(json: string): IndicatorId[] {
  let raw: unknown = null;
  if (json.trim() !== '') {
    try {
      raw = JSON.parse(json);
    } catch {
      raw = null;
    }
  }
  if (!Array.isArray(raw)) return [];
  const known = new Set(DEFINITIONS.map((d) => d.id));
  const out: IndicatorId[] = [];
  for (const v of raw) {
    if (typeof v !== 'string') continue;
    const id = v as IndicatorId;
    if (!known.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

/** Serialize pinned ids for storage (inverse of parsePinnedIds). */
export function formatPinnedStorage(ids: readonly IndicatorId[]): string {
  return JSON.stringify([...ids]);
}

/* ------------------------------------------------------------------ *
 * Lane + hero-order settings (Blocks L1/H1) — localStorage, fail-open
 * ------------------------------------------------------------------ */

export const LANE_STORAGE_KEY = 'currena.insights.lane.v1';
export const HERO_ORDER_STORAGE_KEY = 'currena.insights.hero-order.v1';

/** Read the remembered lane (Block L1: default Australia, try/catch per spec). */
export function readStoredLane(): InsightsSection {
  try {
    const v = window.localStorage.getItem(LANE_STORAGE_KEY);
    return v === 'global' || v === 'australia' ? v : 'australia';
  } catch {
    return 'australia'; // storage unavailable — the default
  }
}

/** Read the hero order ('australia-first' | 'global-first'; H1 note: swap setting). */
export function readStoredHeroOrder(): 'australia' | 'global' {
  try {
    const v = window.localStorage.getItem(HERO_ORDER_STORAGE_KEY);
    return v === 'global' ? 'global' : 'australia';
  } catch {
    return 'australia';
  }
}

/* ------------------------------------------------------------------ *
 * History helpers (epoch-day math for the 10-year chart)
 * ------------------------------------------------------------------ */

/** Epoch-day → 'YYYY-MM-DD' (UTC — the wire format's canonical day). */
export function epochDayToIso(day: number): string {
  const d = new Date(day * 86_400_000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export interface HistoryRow {
  iso: string;
  value: number;
}

/** Sample a long series for the screen-reader data table (unchanged, I4). */
export function sampleHistoryRows(
  points: readonly [number, number][],
  maxRows = 12,
): HistoryRow[] {
  if (points.length === 0) return [];
  const at = (i: number): HistoryRow => {
    const p = points[i]!;
    return { iso: epochDayToIso(p[0]), value: p[1] };
  };
  if (points.length <= maxRows) {
    return points.map((_, i) => at(i));
  }
  const indices = new Set<number>([0, points.length - 1]);
  let minIdx = 0;
  let maxIdx = 0;
  points.forEach((p, i) => {
    if (p[1] < points[minIdx]![1]) minIdx = i;
    if (p[1] > points[maxIdx]![1]) maxIdx = i;
  });
  indices.add(minIdx);
  indices.add(maxIdx);
  const interior = maxRows - indices.size;
  if (interior > 0) {
    const step = (points.length - 1) / (interior + 1);
    for (let i = 1; i <= interior; i++) indices.add(Math.round(i * step));
  }
  return [...indices]
    .sort((a, b) => a - b)
    .slice(0, maxRows)
    .map((i) => at(i));
}

/* ------------------------------------------------------------------ *
 * I17 (v2): the "Together" connection cards + the signals cards
 * ------------------------------------------------------------------ */

/**
 * The SIGNALS_ENABLED feature flag (UI spec Block S1 note). The signals
 * cards are fully built; the flag is the one-flip off-switch for the whole
 * section. Set true at I17 with the owner's full approval of the wording
 * review gate — flip to false to hide the section instantly.
 */
export const SIGNALS_ENABLED = true;

/** One leg's phrase for a connection's right-now line (telegraphic,
 * bilingual-safe): "real yields: high and rising" / «طلا: بالا و ثابت». */
export function legPhrase(
  leg: LegEval,
  shortName: string,
  copy: Pick<InsightsCopy, 'together'>,
): string {
  const t = copy.together;
  const level = leg.level !== null ? t.level[leg.level] : null;
  const direction = leg.direction !== null ? t.direction[leg.direction] : null;
  if (level !== null && direction !== null) {
    return interpolate(t.phrases.levelDir, { name: shortName, level, direction });
  }
  if (level !== null) return interpolate(t.phrases.levelOnly, { name: shortName, level });
  if (direction !== null) return interpolate(t.phrases.dirOnly, { name: shortName, direction });
  return interpolate(t.phrases.none, { name: shortName });
}

/* ------------------------------------------------------------------ *
 * Status metadata — tone (icons live in StatusChip; never colour alone)
 * ------------------------------------------------------------------ */

export type StatusTone = 'danger' | 'success' | 'info' | 'muted';
