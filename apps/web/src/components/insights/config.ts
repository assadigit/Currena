/**
 * Insights display config + pure rendering helpers (Phase I4).
 *
 * Everything here is platform-free pure TypeScript (AGENTS.md rule 2) so it
 * unit-tests without a DOM: per-indicator value formatting (decimals, unit,
 * scale), plain-language rule text (copy fragments + numbers formatted via
 * Intl at render — never stored), 10-year-position warning zones, section
 * grouping over the definitions table, and the "biggest movers" ranking.
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
import { DEFINITIONS } from '@currena/insights';
import { interpolate } from '../../i18n';

/* ------------------------------------------------------------------ *
 * Section / group layout (02-page-design-spec.md §4)
 * ------------------------------------------------------------------ */

/** Page order: Global BEFORE Australia (owner Gate I4 feedback, 2026-10-07). */
export const SECTION_ORDER: readonly InsightsSection[] = ['global', 'australia'];

/** Group order within each section (01-indicator-spec.md group order). */
export const GROUP_ORDER: Readonly<Record<InsightsSection, readonly IndicatorGroupId[]>> = {
  australia: ['interest-inflation', 'currency-trade', 'jobs-housing'],
  global: ['rates-credit', 'currencies', 'metals-crypto', 'stocks-growth'],
};

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

/** Per-group status line counts: voters, warnings, excluded within one group. */
export function groupCounts(
  readings: readonly IndicatorReading[],
  section: InsightsSection,
  group: IndicatorGroupId,
): { warningCount: number; votingCount: number; excludedCount: number } {
  const ids = new Set(definitionsForGroup(section, group).map((d) => d.id));
  let warningCount = 0;
  let votingCount = 0;
  let excludedCount = 0;
  for (const r of readings) {
    if (!ids.has(r.id)) continue;
    if (r.status === 'warning' || r.status === 'normal') {
      votingCount += 1;
      if (r.status === 'warning') warningCount += 1;
    } else if (r.status === 'stale' || r.status === 'no-history' || r.status === 'unavailable') {
      excludedCount += 1;
    }
  }
  return { warningCount, votingCount, excludedCount };
}

/* ------------------------------------------------------------------ *
 * Value formatting — canonical numbers, formatted ONLY at render
 * ------------------------------------------------------------------ */

export type UnitToken = 'none' | 'percent' | 'points' | 'usd' | 'aud' | 'usd-bn';

/** Locale-dependent unit labels (from the copy dictionaries). */
export interface UnitLabels {
  none: string;
  percent: string;
  points: string;
  usd: string;
  aud: string;
  'usd-bn': string;
}

interface DisplayConfig {
  /** Fraction digits for the value. */
  decimals: number;
  /** Unit label token (rendered per-locale). */
  unit: UnitToken;
  /** Multiplicative display scale (e.g. fractions → percent). */
  scale?: number;
}

/** Units rendered as a prefix in English (suffix everywhere in Farsi). */
const PREFIXED_UNITS: ReadonlySet<UnitToken> = new Set(['usd', 'aud', 'usd-bn']);

export const DISPLAY: Readonly<Record<IndicatorId, DisplayConfig>> = {
  'yield-curve-10y2y': { decimals: 2, unit: 'points' },
  'stress-stlfsi': { decimals: 2, unit: 'none' },
  'real-yield-10y': { decimals: 2, unit: 'percent' },
  us10y: { decimals: 2, unit: 'percent' },
  'breakeven-5y5y': { decimals: 2, unit: 'percent' },
  'govt-interest-revenue': { decimals: 1, unit: 'percent', scale: 100 },
  'dollar-broad': { decimals: 2, unit: 'none' },
  usdjpy: { decimals: 2, unit: 'none' },
  'gold-usd': { decimals: 0, unit: 'usd' },
  'silver-usd': { decimals: 2, unit: 'usd' },
  'gold-silver': { decimals: 1, unit: 'none' },
  'gold-btc': { decimals: 4, unit: 'none' },
  'silver-btc': { decimals: 5, unit: 'none' },
  'copper-gold': { decimals: 2, unit: 'none' },
  brent: { decimals: 2, unit: 'usd' },
  'm2-us': { decimals: 0, unit: 'usd-bn' },
  'china-pmi': { decimals: 1, unit: 'none' },
  usdcny: { decimals: 4, unit: 'none' },
  'rba-cash-rate': { decimals: 2, unit: 'percent' },
  'au-cpi': { decimals: 1, unit: 'percent' },
  'au-trimmed-mean': { decimals: 1, unit: 'percent' },
  audusd: { decimals: 4, unit: 'none' },
  audjpy: { decimals: 2, unit: 'none' },
  'au-us-10y-gap': { decimals: 2, unit: 'points' },
  'gold-aud': { decimals: 0, unit: 'aud' },
  'iron-ore': { decimals: 1, unit: 'usd' },
  'terms-of-trade': { decimals: 1, unit: 'none' },
  'au-unemployment': { decimals: 1, unit: 'percent' },
  'au-home-values': { decimals: 1, unit: 'none' },
  'au-household-debt-arrears': { decimals: 1, unit: 'percent' },
};

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
 * 10-year position bar — warning zone (which tail the rule watches)
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

/* ------------------------------------------------------------------ *
 * "What changed this week" — the five biggest 30-day moves
 * ------------------------------------------------------------------ */

export interface MoverRow {
  id: IndicatorId;
  change30d: number;
  changeKind: 'pct' | 'points';
}

/**
 * Biggest movers ranked by the 30-day move as a *relative* magnitude, so
 * percentage and point changes compare fairly: pct changes rank by |pct|;
 * point changes convert to |points| ÷ |value| × 100 (a 0.5-point rise on a
 * 5% yield is a ~10% move; 5 points on a 120 index is ~4%). Native units
 * are still what gets displayed.
 */
export function bigMovers(readings: readonly IndicatorReading[], limit = 5): MoverRow[] {
  const rows: (MoverRow & { rel: number })[] = [];
  for (const r of readings) {
    if (r.change30d === undefined || !Number.isFinite(r.change30d)) continue;
    const def = definitionFor(r.id);
    if (def.rule.kind === 'info') continue; // Context cards don't "move" the story.
    const rel =
      def.changeKind === 'pct'
        ? Math.abs(r.change30d)
        : r.value !== null && Math.abs(r.value) > 1e-9
          ? (Math.abs(r.change30d) / Math.abs(r.value)) * 100
          : 0;
    if (!Number.isFinite(rel) || rel <= 0) continue;
    rows.push({ id: r.id, change30d: r.change30d, changeKind: def.changeKind, rel });
  }
  return rows
    .sort((a, b) => b.rel - a.rel)
    .slice(0, limit)
    .map(({ id, change30d, changeKind }) => ({ id, change30d, changeKind }));
}

/* ------------------------------------------------------------------ *
 * Card filter (I8) — view-level narrowing of the 30-card grid
 * ------------------------------------------------------------------ */

export type StatusFilter = 'all' | 'warning' | 'normal' | 'context';

export interface CardFilter {
  status: StatusFilter;
  query: string;
}

/**
 * Search normalisation for the filter box. Persian keyboards are assumed
 * (the fa UI); the two mappings rescue queries typed on Arabic-keyboard
 * layouts (Arabic yeh/kaf vs Persian yeh/kaf), and bidi/zero-width marks
 * never leak into comparisons. ZWNJ acts as a word separator, so every
 * query token matches the name either as typed (space-separated) or as the
 * fused compound — «بیت کوین», «بیت‌کوین» and «بیتکوین» all hit
 * «طلا / بیت‌کوین», and Latin multi-word queries work word-wise (AND).
 */
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

/**
 * Live per-status counts for the FilterBar chips (I9): All = every reading,
 * Warning/Normal/Context = exactly that status. Stale/unavailable/no-history
 * count only under All — the same semantics as the filter itself.
 */
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

/** Days per range (calendar years, from the series' LAST point — the
 *  honest window even when the feed itself is a few days old). */
const RANGE_DAYS: Readonly<Record<ChartRange, number>> = {
  '10y': 3653, // 10 years + leap-day slack
  '5y': 1827,
  '1y': 366,
};

/**
 * Slice a (ascending, epoch-day) series to the last `range` years. Pure and
 * unit-tested. The 10-year POSITION bar and percentiles are untouched —
 * those are the indicator's decade placement (server-side); this is purely
 * how much of the line the reader sees. If a range cannot show ≥2 points,
 * the full series is returned (the caller disables that range via
 * rangeIsPlottable so the fallback never surprises anyone).
 */
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

/**
 * Sample a long series down to at most `maxRows` table rows for the
 * screen-reader data table: keeps the first and last points, the minimum
 * and maximum, and evenly spaced interior points — the shape of the decade
 * survives, the table stays readable.
 */
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
 * Status metadata — icon + tone (never colour alone, spec §9)
 * ------------------------------------------------------------------ */

export type StatusTone = 'danger' | 'success' | 'info' | 'muted';

export const STATUS_META: Readonly<
  Record<IndicatorReading['status'], { icon: string; tone: StatusTone }>
> = {
  warning: { icon: '⚠️', tone: 'danger' },
  normal: { icon: '✓', tone: 'success' },
  context: { icon: 'ⓘ', tone: 'info' },
  stale: { icon: '⏸', tone: 'muted' },
  'no-history': { icon: '⏳', tone: 'muted' },
  unavailable: { icon: '—', tone: 'muted' },
};

export type { IndicatorReading } from '@currena/core';
