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

import { formatNumber, formatDateWords } from '@currena/core';
import type {
  IndicatorId,
  IndicatorReading,
  InsightsSection,
  IndicatorGroupId,
  WarningRule,
  WarningRuleAtom,
} from '@currena/core';
import { DEFINITIONS, GAUGES, cadenceUsesPreviousRelease } from '@currena/insights';
import type { ConnectionReading, ConnectionState, GaugeReading, LegEval } from '@currena/insights';
import { interpolate } from '../../i18n';
import type { IndicatorCopyEntry, ConsequenceLines, InsightsCopy } from '../../i18n/insights-copy-en';

/* ------------------------------------------------------------------ *
 * Section / group layout (the I15 question-group restructure)
 * ------------------------------------------------------------------ */

/** Page order: Global BEFORE Australia everywhere (round-2 decision D7/R1 —
 * the old Australia-first hero + swap setting retired). */
export const SECTION_ORDER: readonly InsightsSection[] = ['global', 'australia'];

/** Group order within each section (the gauge/lane order, GAUGES-first). */
export const GROUP_ORDER: Readonly<Record<InsightsSection, readonly IndicatorGroupId[]>> = {
  global: ['borrowing-costs', 'prices-heat', 'market-stress', 'dollar-strength', 'growth-health'],
  australia: ['au-inflation-rates', 'au-households', 'au-trade-currency'],
};

/** The prices strip (round-2 R10): FOUR tiles — oil, gold, silver, Bitcoin.
 * Copper and iron ore move into the indicator lanes (copper's definition
 * group is 'growth-health'; iron-ore was always an au-trade-currency row). */
export const PRICE_ROWS: readonly IndicatorId[] = [
  'brent',
  'gold-usd',
  'silver-usd',
  'btc-usd',
];

/** The Bitcoin context ratios (Block PB2) + the gold row's AUD companion. */
export const BTC_RATIO_IDS: readonly IndicatorId[] = ['gold-btc', 'silver-btc'];

/**
 * Step-1 audit item A3: companion-only readings — carried in the payload and
 * rendered INSIDE another card (core CPI on the US inflation card), never as
 * their own row. The question-group filter skips them.
 */
export const COMPANION_ONLY_IDS: ReadonlySet<IndicatorId> = new Set<IndicatorId>(['us-cpi-core-yoy']);

/**
 * Step-2 add-list §B2: companion lines rendered INSIDE a parent card — a
 * full card of its own in another group can still ride along for comparison
 * (the AU 10-year card carries the US 10-year yield beside it; the US number
 * keeps its own card in borrowing-costs — one reading, two surfaces, no
 * possible disagreement). Companion-ONLY ids (COMPANION_ONLY_IDS) render
 * nowhere else; shared ids keep their own card too.
 */
export const COMPANIONS: Readonly<Partial<Record<IndicatorId, readonly IndicatorId[]>>> = {
  'us-cpi-yoy': ['us-cpi-core-yoy'],
  'au-10y': ['us10y'],
};

/** The parent card a companion belongs to, or null when it rides nowhere. */
export function companionParentOf(id: IndicatorId): IndicatorId | null {
  for (const [parent, companions] of Object.entries(COMPANIONS) as [IndicatorId, readonly IndicatorId[]][]) {
    if (companions.includes(id)) return parent;
  }
  return null;
}

/**
 * Step-2 add-list §B5: ids whose card ALWAYS shows the 10-year position bar
 * (the VIX card's interim presentation — "the value and its 10-year
 * position" — before the Step-3 verdict rules fix the calm/nervous words).
 */
export const ALWAYS_POSITION_IDS: ReadonlySet<IndicatorId> = new Set<IndicatorId>(['vix']);

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

export type UnitToken =
  | 'none'
  | 'percent'
  | 'points'
  | 'usd'
  | 'aud'
  | 'usd-bn'
  | 'usd-tr'
  | 'eur'
  | 'index'
  | 'jpy'
  | 'cny'
  | 'ratio';

/** Locale-dependent unit labels (from the copy dictionaries). */
export interface UnitLabels {
  none: string;
  percent: string;
  points: string;
  usd: string;
  aud: string;
  'usd-bn': string;
  'usd-tr': string;
  eur: string;
  index: string;
  jpy: string;
  cny: string;
  ratio: string;
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
const PREFIXED_UNITS: ReadonlySet<UnitToken> = new Set(['usd', 'aud', 'usd-bn', 'usd-tr', 'eur', 'jpy', 'cny']);

export const DISPLAY: Readonly<Record<IndicatorId, DisplayConfig>> = {
  'yield-curve-10y2y': { decimals: 2, unit: 'points' },
  'real-yield-10y': { decimals: 2, unit: 'percent' },
  us10y: { decimals: 2, unit: 'percent' },
  'fed-target': { decimals: 2, unit: 'percent', range: true },
  'ecb-dfr': { decimals: 2, unit: 'percent' },
  'govt-interest-revenue': { decimals: 1, unit: 'percent', scale: 100 },
  'us-cpi-yoy': { decimals: 1, unit: 'percent' },
  // Step-1 audit item A3: the core-CPI companion (rendered INSIDE the
  // us-cpi-yoy card, never as its own row).
  'us-cpi-core-yoy': { decimals: 1, unit: 'percent' },
  'breakeven-5y5y': { decimals: 2, unit: 'percent' },
  'stress-stlfsi': { decimals: 2, unit: 'index' },
  nfci: { decimals: 2, unit: 'index' },
  // Step-2 add-list §B5: the VIX prints to two decimals like the other
  // market-stress indices (14.84).
  vix: { decimals: 2, unit: 'index' },
  'gold-silver': { decimals: 1, unit: 'ratio' },
  'dollar-basket': { decimals: 2, unit: 'index' },
  usdjpy: { decimals: 2, unit: 'jpy' },
  // Step-1 audit item C4: EUR per USD — the € symbol, not "US$".
  'eur-usd': { decimals: 4, unit: 'eur' },
  'china-pmi': { decimals: 1, unit: 'index' },
  // Step-1 audit item C7: "US$23.3 trillion", not "bn23,343".
  'm2-us': { decimals: 1, unit: 'usd-tr', scale: 0.001 },
  // Step-2 add-list §B3/§B4: the US labour-market pair (both in percentage
  // points — a rate and a points gap, never percent-of-percent).
  'us-unemployment': { decimals: 1, unit: 'percent' },
  'sahm-rule': { decimals: 2, unit: 'points' },
  'copper-gold': { decimals: 2, unit: 'ratio' },
  usdcny: { decimals: 4, unit: 'cny' },
  brent: { decimals: 2, unit: 'usd' },
  'gold-usd': { decimals: 0, unit: 'usd' },
  'silver-usd': { decimals: 2, unit: 'usd' },
  'copper-usd': { decimals: 0, unit: 'usd' },
  'btc-usd': { decimals: 0, unit: 'usd' },
  'gold-btc': { decimals: 4, unit: 'ratio' },
  'silver-btc': { decimals: 5, unit: 'ratio' },
  'au-cpi': { decimals: 1, unit: 'percent' },
  'au-trimmed-mean': { decimals: 1, unit: 'percent' },
  // Step-2 add-list §B2: the AU 10-year yield, rendered like the US one.
  'au-10y': { decimals: 2, unit: 'percent' },
  'au-us-10y-gap': { decimals: 2, unit: 'points' },
  'rba-cash-rate': { decimals: 2, unit: 'percent' },
  // Step-2 add-list §B7: the real savings rate (new household term deposits).
  'au-deposit-rate': { decimals: 2, unit: 'percent' },
  'au-petrol-yoy': { decimals: 1, unit: 'percent' },
  'au-home-loan': { decimals: 2, unit: 'percent' },
  'au-wage-growth': { decimals: 1, unit: 'percent' },
  'au-rent-yoy': { decimals: 1, unit: 'percent' },
  'au-unemployment': { decimals: 1, unit: 'percent' },
  // R13: the ABS series is a price INDEX (not a dollar amount) — the word
  // "index" is the honest unit; a dollar figure would be fabricated.
  'au-home-values': { decimals: 1, unit: 'index' },
  'au-household-debt-arrears': { decimals: 1, unit: 'percent' },
  audusd: { decimals: 4, unit: 'usd' },
  audjpy: { decimals: 2, unit: 'jpy' },
  'terms-of-trade': { decimals: 1, unit: 'index' },
  'iron-ore': { decimals: 1, unit: 'usd' },
  'gold-aud': { decimals: 0, unit: 'aud' },
};

/** The Fed target corridor's half-width (the FOMC has used 25bp since 2008). */
const FED_CORRIDOR_HALF = 0.125;

/** R40: value/unit split for renderers that style the unit separately —
 * the hero attention tiles read the unit SMALL so a long word-unit label
 * ('۱۲۵٫۴۴ دلار آمریکا') never pushes the value onto a second row.
 * `unit` is null when the unit binds tight (percent, prefixed US$/¥/CN¥,
 * the fed corridor) or is absent. `formatIndicatorValue` below is the
 * exact join of these parts — outputs stay byte-identical everywhere. */
export interface IndicatorValueParts {
  value: string;
  unit: string | null;
}

/** Optional true bounds for a range-rendered value (fed-target). */
export interface ValueRangeBounds {
  low: number;
  high: number;
}

export function indicatorValueParts(
  id: IndicatorId,
  value: number,
  numberLocale: 'en-US' | 'fa-IR',
  units: UnitLabels,
  bounds?: ValueRangeBounds,
): IndicatorValueParts {
  const cfg = DISPLAY[id];
  const num = formatNumber(value * (cfg.scale ?? 1), numberLocale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });
  const unit = units[cfg.unit];
  if (!unit) return { value: num, unit: null };
  if (cfg.range) {
    // Step-1 audit item A1: prefer the TRUE published bounds
    // (DFEDTARL/DFEDTARU → "3.75–4.00%"); the 25bp-corridor fallback
    // only renders for old payloads without rangeLow/rangeHigh.
    if (bounds) {
      const lo = formatNumber(bounds.low, numberLocale, {
        minimumFractionDigits: cfg.decimals,
        maximumFractionDigits: cfg.decimals,
      });
      const hi = formatNumber(bounds.high, numberLocale, {
        minimumFractionDigits: cfg.decimals,
        maximumFractionDigits: cfg.decimals,
      });
      return { value: `${lo}–${hi}${unit}`, unit: null };
    }
    const lo = formatNumber(value - FED_CORRIDOR_HALF, numberLocale, {
      minimumFractionDigits: cfg.decimals,
      maximumFractionDigits: cfg.decimals,
    });
    return { value: `${lo}–${num}${unit}`, unit: null };
  }
  if (cfg.unit === 'percent') return { value: `${num}${unit}`, unit: null }; // '5.31%' / '۵٫۳۱٪' — no space, both locales.
  // Step-1 C7: "US$23.3 trillion" — the EN render prefixes the currency and
  // suffixes the magnitude word; fa keeps its suffix-only form.
  if (cfg.unit === 'usd-tr') {
    if (numberLocale === 'en-US') return { value: `${units.usd}${num} ${unit}`, unit: null };
    return { value: num, unit };
  }
  if (numberLocale === 'en-US' && PREFIXED_UNITS.has(cfg.unit)) return { value: `${unit}${num}`, unit: null }; // 'US$113.96'
  return { value: num, unit }; // '۱۱۳٫۹۶ دلار آمریکا' / '0.48 pts'
}

/** Current-value rendering, e.g. '5.31%', 'US$23,343bn', '۰٫۴۸'. */
export function formatIndicatorValue(
  id: IndicatorId,
  value: number,
  numberLocale: 'en-US' | 'fa-IR',
  units: UnitLabels,
  bounds?: ValueRangeBounds,
): string {
  const parts = indicatorValueParts(id, value, numberLocale, units, bounds);
  return parts.unit === null ? parts.value : `${parts.value} ${parts.unit}`;
}

/**
 * Step-1: render a READING's value (the reading's own range bounds ride
 * along when present — fed-target). Null-safe for unavailable rows.
 */
export function formatReadingValue(
  reading: IndicatorReading,
  numberLocale: 'en-US' | 'fa-IR',
  units: UnitLabels,
): string | null {
  if (reading.value === null) return null;
  const bounds =
    reading.rangeLow !== undefined && reading.rangeHigh !== undefined
      ? { low: reading.rangeLow, high: reading.rangeHigh }
      : undefined;
  return formatIndicatorValue(reading.id, reading.value, numberLocale, units, bounds);
}

/** Signed 7/30-day change rendering ('+0.62%' / '+۰٫۱۱ نقطه'). Render inside dir="ltr".
 * Step-1 audit item C5: `scale` lets percentage-point changes of fraction-
 * valued series (govt-interest-revenue) render in their displayed units. */
export function formatChange(
  change: number,
  changeKind: 'pct' | 'points',
  numberLocale: 'en-US' | 'fa-IR',
  units: UnitLabels,
  scale = 1,
): string {
  const num = formatNumber(Math.abs(change) * scale, numberLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  const unit = changeKind === 'pct' ? units.percent : units.points;
  // Percent binds tight ('+0.62%'); word-like units take a space ('+0.11 pts').
  return changeKind === 'pct' ? `${sign}${num}${unit}` : `${sign}${num} ${unit}`;
}

/** The display scale of one indicator's changes (fraction series ×100). */
export function changeScaleOf(id: IndicatorId): number {
  return DISPLAY[id].scale ?? 1;
}

/* ------------------------------------------------------------------ *
 * Step-1 audit items B5/C6: the card's data-date line and the change
 * label — every card shows WHEN its data is from, and monthly/quarterly
 * changes say "since the previous release", never "30-day".
 * ------------------------------------------------------------------ */

/** Which change window label a reading's cadence demands. */
export type ChangeWindowLabel = '7d' | '30d' | 'since-previous';

export function changeWindowLabel(id: IndicatorId): ChangeWindowLabel {
  const def = definitionFor(id);
  if (cadenceUsesPreviousRelease(def.cadence)) return 'since-previous';
  return '30d';
}

/**
 * "Data for August 2026" for monthly/quarterly observations (the asOf
 * month/quarter), "as of {date}" for daily ones. Locale-aware, UTC-safe
 * (formatDateWords' date-only fix).
 */
export function dataPeriodText(
  id: IndicatorId,
  asOf: string,
  locale: 'en' | 'fa',
  numberLocale: 'en-US' | 'fa-IR',
): string {
  const def = definitionFor(id);
  const month = new Intl.DateTimeFormat(
    locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US-u-ca-gregory',
    { month: 'long', year: 'numeric', timeZone: 'UTC' },
  ).format(new Date(`${asOf}T00:00:00Z`));
  if (def.cadence === 'monthly' || def.cadence === 'quarterly' || def.cadence === 'manual') {
    return month;
  }
  return formatDateWords(asOf, numberLocale === 'fa-IR' ? 'fa-IR' : 'en-US');
}

/** "X.X% below its 10-year peak" — the C9 distance line (≤ 0, 1 decimal). */
export function formatFromPeak(
  fromPeak10y: number,
  numberLocale: 'en-US' | 'fa-IR',
  template: (pct: string) => string,
): string {
  const pct = formatNumber(Math.abs(fromPeak10y), numberLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return template(pct);
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

/* ---------------------------------------------------------------- *
 * R29 (owner UI/UX audit): status WORDS speak in status ink. The
 * chips already carried red/green — now the verdict word and the
 * gauge step words do too. Never colour alone (G5): every tinted
 * word also sits beside an icon, a meter segment, or a number.
 *
 * R30 (roast 11 Oct): colour roles are defined ONCE —
 *   red = needs attention ONLY (the alert tier + its counts),
 *   the verdict scale is a FOUR-STEP ink scale (relaxed green →
 *   cautious amber → stressed orange → alarmed red; the old
 *   stressed-red made steps 3 and 4 read as one hue),
 *   and colour carries STATUS, never DIRECTION — price words
 *   ("expensive"/"cheap") are neutral ink again.
 * ---------------------------------------------------------------- */

/** WordTone → the status ink token (empty = inherit — neutral words). */
const WORD_TONE_CLASS: Record<'alert' | 'stressed' | 'watch' | 'normal' | 'neutral', string> = {
  alert: 'text-[var(--color-status-alert)]',
  stressed: 'text-[var(--color-status-stressed)]',
  watch: 'text-[var(--color-status-watch)]',
  normal: 'text-[var(--color-status-normal)]',
  neutral: '',
};

/** Verdict/gauge step (0 none · 1 relaxed · 2 cautious · 3 stressed ·
 * 4 alarmed) → the step word's tone class. Four DISTINCT hues — the
 * roast: "Stressed and Alarmed are close hues". */
export function stepToneClass(step: number): string {
  const tone = step <= 0 ? 'neutral' : step === 1 ? 'normal' : step === 2 ? 'watch' : step === 3 ? 'stressed' : 'alert';
  return WORD_TONE_CLASS[tone];
}

/** Price position band (low = cheap … high = expensive) → status ink.
 * Round 31 (owner): "everywhere which is marked 'expensive' use red
 * color" — the consumer-cost valence is the owner's decree and
 * overrides R30's neutral: expensive = the alert red, cheap = the
 * supportive green, typical stays neutral. Never colour alone (G5):
 * the word always rides beside the change numbers / the 10-year bar. */
export function bandToneClass(band: PositionBand): string {
  return band === 'high'
    ? WORD_TONE_CLASS.alert
    : band === 'low'
      ? WORD_TONE_CLASS.normal
      : WORD_TONE_CLASS.neutral;
}

/** Attention-count tone (R29): red while anything needs attention,
 * green only when the gauge is clear. */
export function attentionToneClass(warnings: number): string {
  return warnings > 0 ? WORD_TONE_CLASS.alert : WORD_TONE_CLASS.normal;
}

/** The state key for consequence-line selection (data spec §6 + F4). */
export type ConsequenceState = keyof ConsequenceLines; // 'highRising' | 'highEasing' | 'typical' | 'low' | 'jumping'

/**
 * Pick the consequence-line state for one reading:
 *  - price rows (PB ids) with |moveScore| ≥ threshold → 'jumping'
 *  - high band + 30d rise → 'highRising'; high band + 30d fall → 'highEasing'
 *  - Step-1 audit item D2: a high band with NO measurable change never
 *    claims a direction — the line falls back to the oneLiner (the old
 *    code called every unmeasured case "easing", which contradicted the
 *    money panel's "becoming more expensive" on the same number).
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
    if (reading.change30d !== undefined && reading.change30d > 0) return 'highRising';
    if (reading.change30d !== undefined && reading.change30d < 0) return 'highEasing';
    return null; // high, but no measurable move — no direction claim (D2)
  }
  return band; // 'typical' | 'low'
}

/** The consequence line for a reading (F4): state line → oneLiner fallback.
 *  R28: lines quoting a published band carry {bandPos}/{bandLabel} tokens,
 *  interpolated here from the LIVE value — the sentence can never contradict
 *  the number beside it. `words` localises the position word (R22). */
export function consequenceLine(
  reading: IndicatorReading,
  entry: IndicatorCopyEntry,
  isPriceRow: boolean,
  words: { inside: string; above: string; below: string } = BAND_WORDS_EN,
): string {
  const state = consequenceState(reading, isPriceRow);
  const raw = (state && entry.lines?.[state]) || entry.oneLiner;
  if (!raw.includes('{bandPos}') && !raw.includes('{bandLabel}')) return raw;
  const band = entry.band;
  const value = reading.value;
  if (!band || value === null) return raw.replace(/\{bandPos\}/g, '').replace(/\{bandLabel\}/g, band?.label ?? '');
  return interpolate(raw, { bandPos: bandPositionWord(value, band, words), bandLabel: band.label });
}

/** Band position words keyed by locale (the R28 tokens' rendered form). */
export type BandPosition = 'inside' | 'above' | 'below';

export function bandPositionOf(value: number, band: { min?: number; max?: number }): BandPosition {
  if (band.min !== undefined && value < band.min) return 'below';
  if (band.max !== undefined && value > band.max) return 'above';
  // Two-sided band (e.g. the RBA's 2–3%): neither below nor above → inside.
  if (band.min !== undefined && band.max !== undefined) return 'inside';
  if (band.min === undefined && band.max === undefined) return 'inside';
  // One-sided: the goal is a ceiling (min-only → above/inside is the claim).
  if (band.max === undefined) return value > (band.min ?? 0) ? 'above' : 'inside';
  return value < (band.max ?? 0) ? 'below' : 'inside';
}

/** The rendered band-position word for a locale's copy. */
export function bandPositionWord(
  value: number,
  band: { min?: number; max?: number; label: string },
  words: { inside: string; above: string; below: string } = BAND_WORDS_EN,
): string {
  return words[bandPositionOf(value, band)];
}

export const BAND_WORDS_EN: { inside: string; above: string; below: string } = {
  inside: 'inside',
  above: 'above',
  below: 'below',
};

/** The locale's band-position words from the copy corpus (R22: fa renders
 * درون/بالای/زیر — never the English defaults). */
export function bandWordsOf(copy: InsightsCopy): { inside: string; above: string; below: string } {
  return { inside: copy.ui.bandPosInside, above: copy.ui.bandPosAbove, below: copy.ui.bandPosBelow };
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

/** All readings whose |moveScore| clears the threshold, freshest data only.
 * Stale/unavailable rows never headline (R4): the engine omits moveScore for
 * them, and this guard keeps an old payload from resurrecting one. */
export function bigMovers(readings: readonly IndicatorReading[], limit = 3): BigMoverRow[] {
  const rows: BigMoverRow[] = [];
  for (const r of readings) {
    if (r.status === 'stale' || r.status === 'unavailable') continue;
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
 * R5: the two-tier status model (round-2 spec §4 + Block R5)
 *                     only the user-facing word changes)
 *   unusual         — no rule fired, but the value sits in the top/bottom
 *                     10% of its own 10-year range (percentile ≤ 0.10 or
 *                     ≥ 0.90). percentile10y is only computed when the
 *                     base carries the engine's 30-observation floor
 *                     (MIN_PERCENTILE_OBS), so its presence IS the
 *                     history floor — no extra check needed.
 *   normal          — neither of the above
 *   context / stale / unavailable — unchanged
 *
 * ONE tier per card: needs-attention wins over unusual (details may add
 * "also unusual"). Internal ids and internal statuses stay unchanged.
 * ------------------------------------------------------------------ */

export type IndicatorTier =
  | 'needs-attention'
  | 'unusual'
  | 'normal'
  | 'context'
  | 'stale'
  | 'unavailable';

/** The unusual band: top or bottom 10% of the indicator's own 10y range. */
export const UNUSUAL_CUTOFF = 0.1;

/** Is this reading in the unusual band? (Normal-status readings only.) */
export function isUnusual(reading: IndicatorReading): boolean {
  if (reading.status !== 'normal') return false;
  if (reading.percentile10y === undefined) return false;
  return reading.percentile10y <= UNUSUAL_CUTOFF || reading.percentile10y >= 1 - UNUSUAL_CUTOFF;
}

/** The one display tier for a reading (precedence: needs-attention wins). */
export function tierOf(reading: IndicatorReading): IndicatorTier {
  if (reading.status === 'warning') return 'needs-attention';
  if (reading.status === 'context') return 'context';
  if (reading.status === 'unavailable') return 'unavailable';
  if (reading.status === 'stale' || reading.status === 'no-history') return 'stale';
  return isUnusual(reading) ? 'unusual' : 'normal';
}

/** Card layout per tier: needs-attention AND unusual get the full card; the
 * rest are compact rows (R7: both tiers are the visible face of a group). */
export function tierIsCard(tier: IndicatorTier): boolean {
  return tier === 'needs-attention' || tier === 'unusual';
}

/* ------------------------------------------------------------------ *
 * Card filter (I8) — view-level narrowing of the rows/cards grid
 * ------------------------------------------------------------------ */

export type StatusFilter = 'all' | 'warning' | 'unusual' | 'normal' | 'context';

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

/** Does one reading pass the status chips + text query? (Pure, unit-tested.)
 * The 'unusual' chip filters on the R5 tier, not the internal status. */
export function indicatorMatchesFilter(
  reading: IndicatorReading,
  filter: CardFilter,
  nameOf: (id: IndicatorId) => { name: string; ticker?: string },
): boolean {
  if (filter.status !== 'all') {
    if (filter.status === 'unusual') {
      if (tierOf(reading) !== 'unusual') return false;
    } else if (reading.status !== filter.status) {
      return false;
    }
  }
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

/** Live per-status counts for the filter chips (I9) — tier-aware. */
export function statusCounts(
  readings: readonly IndicatorReading[],
): { all: number; warning: number; unusual: number; normal: number; context: number } {
  const counts = { all: readings.length, warning: 0, unusual: 0, normal: 0, context: 0 };
  for (const r of readings) {
    const tier = tierOf(r);
    if (tier === 'needs-attention') counts.warning += 1;
    else if (tier === 'unusual') counts.unusual += 1;
    else if (tier === 'normal') counts.normal += 1;
    else if (tier === 'context') counts.context += 1;
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

/* ---------------------------------------------------------------- *
 * Owner request (sources off the cards): the card faces no longer
 * show ANY source label. Sources are named and linked in exactly two
 * places — the details panel footer (full sourceName, raw series ids
 * and all) and the About/sources section at the foot of the page.
 * The old publisher-only `friendlySource` trimmer died with the card
 * labels; nothing else needed it.
 * ---------------------------------------------------------------- */

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

/* ------------------------------------------------------------------ *
 * Round-2 R2: the hero reason line — a FIXED TABLE computed from the
 * gauge steps, never free text. The sentence can never contradict the
 * gauges: the top step's word names its gauges, and no reassurance
 * phrase exists in the table (the calm line only fires when EVERY
 * readable gauge sits at step 1).
 * ------------------------------------------------------------------ */

export interface HeroReasonInput {
  /** The section's gauge readings (gaugeReading rows). */
  gauges: readonly GaugeReading[];
  /** The step words, keyed 1–4 (copy.label). */
  words: Readonly<Record<number, string>>;
  calm: string;
  top: string; // '{k} of {n} areas {isAre} {word}: {names}.'
  others: string; // 'The rest are {word}.'
  othersOne: string; // 'The other one is {word}.'
  /** Round 24: used when the remaining gauges DISAGREE — {words} is the
   * distinct step words, pre-joined with andWord (the old mode-based tail
   * said "The rest are Stable" while one sat Cautious — the roast caught
   * the hero contradicting its own gauge rows). */
  othersMixed?: string; // 'The rest are {words}.'
  andWord?: string; // 'and' / «و»
  is: string;
  are: string;
  notEnough: string;
  /** The gauge display names, keyed by gauge id (copy.groups). */
  nameOf: (gauge: string) => string;
  /** Locale digit renderer (R22: fa renders ۵, not 5). Defaults to String. */
  fmt?: (n: number) => string;
}

export function heroReason(input: HeroReasonInput): string {
  const fmtN = input.fmt ?? String;
  const readable = input.gauges.filter((g) => g.step >= 1);
  if (readable.length === 0) return input.notEnough;
  if (readable.every((g) => g.step === 1)) return input.calm;
  const maxStep = Math.max(...readable.map((g) => g.step));
  const top = readable.filter((g) => g.step === maxStep);
  const word = input.words[maxStep] ?? '';
  const names = top.map((g) => input.nameOf(g.gauge)).join(', ');
  const line1 = interpolate(input.top, {
    k: fmtN(top.length),
    n: fmtN(readable.length),
    isAre: top.length === 1 ? input.is : input.are,
    word,
    names,
  });
  const rest = readable.filter((g) => g.step < maxStep);
  if (rest.length === 0) return line1;
  // Round 24 (roast): the tail used the MODE (most common step) of the
  // rest, which lied whenever the rest disagreed ("The rest are Stable"
  // beside a Cautious gauge row). When they share one step, the single
  // word is honest. When they DISAGREE, enumerate the DISTINCT words
  // (most notable first) if the locale provides the mixed template —
  // otherwise fall back to the mode (older call sites/tests).
  const restSteps = new Set(rest.map((g) => g.step));
  if (restSteps.size > 1 && input.othersMixed && input.andWord) {
    const wordsList = [...restSteps]
      .sort((a, b) => b - a)
      .map((s) => input.words[s] ?? '')
      .filter(Boolean)
      .join(` ${input.andWord} `);
    return `${line1} ${interpolate(input.othersMixed, { words: wordsList })}`;
  }
  if (restSteps.size === 1) {
    const restWord = input.words[[...restSteps][0]!] ?? '';
    const restLine = interpolate(
      rest.length === 1 ? input.othersOne : input.others,
      { word: restWord },
    );
    return `${line1} ${restLine}`;
  }
  // Mixed rest, no mixed template: the mode, ties resolving UP (the more
  // notable state wins a tie) — the R30 behaviour, kept as fallback.
  const tally = new Map<number, number>();
  for (const g of rest) tally.set(g.step, (tally.get(g.step) ?? 0) + 1);
  const restStep = [...tally.entries()].sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : b[0] - a[0]))[0]![0];
  const restWord = input.words[restStep] ?? '';
  const restLine = interpolate(
    rest.length === 1 ? input.othersOne : input.others,
    { word: restWord },
  );
  return `${line1} ${restLine}`;
}

/** The R2 guard: does a hero sentence contradict its gauges? (Test-only
 * helper.) The fixed table names every gauge AT THE TOP STEP and words the
 * tail ("The rest are Stressed") — so the guard checks: (1) every max-step
 * gauge is named; (2) no reassurance phrase while ANY gauge sits at step 3
 * or 4. A step-3 tail is described by its word, never reassured away. */
export function heroReasonIsConsistent(
  sentence: string,
  gauges: readonly GaugeReading[],
  nameOf: (gauge: string) => string,
): boolean {
  const readable = gauges.filter((g) => g.step >= 1);
  const maxStep = readable.length > 0 ? Math.max(...readable.map((g) => g.step)) : 0;
  for (const g of readable.filter((g) => g.step === maxStep && maxStep >= 1)) {
    if (!sentence.includes(nameOf(g.gauge))) return false;
  }
  if (maxStep >= 3) {
    const reassurance = /(not worth worrying|nothing needs your attention|no need to worry)/i;
    if (reassurance.test(sentence)) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ *
 * Round-2 R3: the needs-attention tiles — sorted by how far the value
 * sits into its own 10-year range (rule-tail aware).
 * ------------------------------------------------------------------ */

export interface AttentionTileRow {
  id: IndicatorId;
  /** 0..1 — how deep into the watched tail the value sits. */
  extremity: number;
}

/** The warning members of one section, extremity-sorted (R3 tile order). */
export function attentionTiles(
  readings: readonly IndicatorReading[],
  section: InsightsSection,
): AttentionTileRow[] {
  const sectionIds = new Set(DEFINITIONS.filter((d) => d.section === section).map((d) => d.id));
  const rows: AttentionTileRow[] = [];
  for (const r of readings) {
    if (r.status !== 'warning' || !sectionIds.has(r.id)) continue;
    const def = definitionFor(r.id);
    const zone = warningZone(def.rule);
    let extremity = r.percentile10y ?? 0.5;
    if (zone && r.percentile10y !== undefined) {
      extremity = zone.to >= 1 ? r.percentile10y : 1 - r.percentile10y;
    }
    rows.push({ id: r.id, extremity });
  }
  return rows.sort((a, b) => b.extremity - a.extremity);
}

/* ------------------------------------------------------------------ *
 * Round-2 R7: the signals-first default view — per-group split.
 * ------------------------------------------------------------------ */

export interface GroupVisibility {
  /** Needs-attention + unusual + enough normal rows to reach MIN_VISIBLE. */
  visible: readonly IndicatorReading[];
  /** The rest — collapsed behind "See all {n} indicators". */
  collapsed: readonly IndicatorReading[];
}

/** At least this many items visible per group (spec R7). */
export const GROUP_MIN_VISIBLE = 3;

export function groupVisibility(readings: readonly IndicatorReading[]): GroupVisibility {
  const cards: IndicatorReading[] = [];
  const rows: IndicatorReading[] = [];
  for (const r of readings) {
    const tier = tierOf(r);
    if (tier === 'needs-attention' || tier === 'unusual') cards.push(r);
    else rows.push(r);
  }
  const visible = [...cards];
  for (const r of rows) {
    if (visible.length >= GROUP_MIN_VISIBLE) break;
    visible.push(r);
  }
  const visibleSet = new Set(visible.map((r) => r.id));
  return { visible, collapsed: rows.filter((r) => !visibleSet.has(r.id)) };
}

/* ------------------------------------------------------------------ *
 * Round-2 R7b: the collapsed Together/Signals summaries.
 * ------------------------------------------------------------------ */

const TOGETHER_STATE_ORDER: readonly ConnectionState[] = ['active', 'partly', 'disagree', 'inactive', 'unknown'];

export interface TogetherSummary {
  /** One line: "2 active, 3 show signals that disagree, 1 partly active". */
  line: string;
  /** One chip per connection (short title + state). */
  chips: readonly { connection: string; name: string; state: ConnectionState }[];
}

export function togetherSummary(
  connections: readonly ConnectionReading[],
  nameOf: (connection: string) => string,
  templates: { active: string; partly: string; inactive: string; disagree: string; unknown: string },
  fmt: (n: number) => string = String,
  joiner = ', ',
): TogetherSummary {
  const counts = new Map<ConnectionState, number>();
  for (const c of connections) counts.set(c.state, (counts.get(c.state) ?? 0) + 1);
  const parts: string[] = [];
  for (const state of TOGETHER_STATE_ORDER) {
    const n = counts.get(state) ?? 0;
    if (n > 0) parts.push(interpolate(templates[state], { n: fmt(n) }));
  }
  return {
    line: parts.join(joiner),
    chips: connections.map((c) => ({ connection: c.connection, name: nameOf(c.connection), state: c.state })),
  };
}

/** Expanded-Together card order (spec R7b): active → partly → disagree →
 * not active → unreadable. */
export const TOGETHER_CARD_ORDER: readonly ConnectionState[] = TOGETHER_STATE_ORDER;

/** Collapsed-Signals line per metal: position top/bottom percent or ''. */
export function signalSummaryPosition(percentile: number | null): { word: 'top' | 'bottom'; pct: number } | null {
  if (percentile === null || !Number.isFinite(percentile)) return null;
  if (percentile >= 0.9) return { word: 'top', pct: Math.round((1 - percentile) * 100) };
  if (percentile <= 0.1) return { word: 'bottom', pct: Math.round(percentile * 100) };
  return null;
}

/* ------------------------------------------------------------------ *
 * Round-2 R26: the merged gold-and-silver signals card.
 * ------------------------------------------------------------------ */

export interface MergedSignals {
  /** The four global conditions (identical for both metals by construction). */
  shared: readonly { key: string; state: string }[];
  /** Per-metal footing rows. */
  footing: readonly { metal: 'gold' | 'silver'; state: string; priceId: IndicatorId }[];
  /** The silver-only condition rows. */
  silverOnly: readonly { key: string; state: string }[];
}

export function mergeSignals(gold: { conditions: readonly { key: string; state: string }[]; priceId: IndicatorId }, silver: { conditions: readonly { key: string; state: string }[]; priceId: IndicatorId }): MergedSignals {
  const shared = gold.conditions.filter((c) => c.key !== 'footing' && c.key !== 'industrial');
  const goldFooting = gold.conditions.find((c) => c.key === 'footing');
  const silverFooting = silver.conditions.find((c) => c.key === 'footing');
  const footing: { metal: 'gold' | 'silver'; state: string; priceId: IndicatorId }[] = [];
  if (goldFooting) footing.push({ metal: 'gold', state: goldFooting.state, priceId: gold.priceId });
  if (silverFooting) footing.push({ metal: 'silver', state: silverFooting.state, priceId: silver.priceId });
  return {
    shared,
    footing,
    silverOnly: silver.conditions.filter((c) => c.key === 'industrial'),
  };
}

/* ------------------------------------------------------------------ *
 * Round-2 R11: "What it means for my money" — area map + worst-state
 * selection (at most 4 lines, calm fallback).
 * ------------------------------------------------------------------ */

export type MoneyAreaId = 'petrol' | 'homeLoan' | 'savings' | 'shop' | 'overseas' | 'jobs';
export type MoneyAreaState = 'attention' | 'unusual' | 'calm';

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

export interface MoneyAreaRow {
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

export type MoneyDriverKind = 'direct' | 'inverse' | 'growth' | 'none';
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
export const POLICY_RATE_IDS: ReadonlySet<IndicatorId> = new Set<IndicatorId>(['ecb-dfr', 'fed-target', 'rba-cash-rate']);

/** The move worth naming: ≥ 5bp on a policy rate. */
export function policyMoveOf(reading: IndicatorReading): number | null {
  if (!POLICY_RATE_IDS.has(reading.id)) return null;
  if (reading.change30d === undefined || Math.abs(reading.change30d) < 0.05) return null;
  return reading.change30d;
}

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
