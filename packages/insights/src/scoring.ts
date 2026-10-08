/**
 * The Insights scoring engine (Phase I1) — pure functions, no network, no
 * clock reads (every time reference is an explicit parameter, so tests and
 * the backtest freeze time at will).
 *
 * Semantics are fixed by docs/insights/01-indicator-spec.md section 4–5 and
 * 02-page-design-spec.md section 6:
 *  - percentile = share of the last 10 years' readings STRICTLY BELOW the
 *    current one (ties count as not-below; direction lives in the rule);
 *  - every voting indicator casts one equal vote;
 *  - score = warnings ÷ voters; labels: <0.2 relaxed, <0.4 cautious,
 *    <0.6 stressed, ≥0.6 alarmed; no voters → null label (never invented);
 *  - stale = data older than cadence + grace → greyed, excluded from counts;
 *  - short history → honest `no-history`, never a guessed verdict.
 */

import type {
  ChangedEvent,
  IndicatorDefinition,
  IndicatorReading,
  WarningRuleAtom,
} from '@currena/core';
import { IndicatorDefinitionSchema } from '@currena/core';
import {
  addDays,
  daysBetween,
  epochDay,
  pointAtOrBefore,
  sliceBetween,
  type SeriesPoint,
} from './series';

/* ------------------------------------------------------------------ *
 * Documented engine constants (surfaced in the backtest report)
 * ------------------------------------------------------------------ */

/**
 * Stale thresholds: the maximum age (days) of the freshest observation before
 * a series is "not updated since [date]". Derived from real release lags, not
 * just the calendar cadence: observation dates lag publication, so e.g. a
 * quarterly series observed at quarter-start can legitimately be ~6 months
 * old between releases (obs lag + release lag + one full period of margin).
 * `per-change` (cash rate) is a level and never goes stale by age.
 *
 * I15 (2026-10-08 data spec §3): a definition's `staleAfterDays` OVERRIDES
 * its cadence grace — the per-series freshness limits (Brent 12, NFCI 14,
 * ECB DFR 7, Fed target 5, ABS CPI items 70, WPI 130 …). See definitions.ts.
 */
export const GRACE_DAYS: Readonly<Record<IndicatorDefinition['cadence'], number | null>> = {
  daily: 3,
  weekly: 16,
  monthly: 95,
  quarterly: 190,
  'per-change': null,
  manual: 45,
};

/** The effective stale threshold for one definition (override → cadence). */
export function staleAfterDaysFor(def: IndicatorDefinition): number | null {
  return def.staleAfterDays ?? GRACE_DAYS[def.cadence];
}

/** Percentile window: the "last 10 years" of readings (3650 days ≈ 10y + 2 leap days). */
export const PERCENTILE_WINDOW_DAYS = 3650;

/**
 * Minimum observations in the 10-year window before a percentile exists.
 * 30 periods, absolute (not cadence-scaled): a quarterly series carries only
 * ~37–40 periods per decade, so a higher floor would make quarterly percentile
 * rules permanently unevaluable. The floor guards against degenerate bases;
 * production backfills guarantee full 10-year windows for every voter.
 */
export const MIN_PERCENTILE_OBS = 30;

/** Minimum observations in the 12-month window for the `above-low` rule. */
export const MIN_ABOVE_LOW_OBS = 6;

/** Year-on-year comparison: the year-ago point is searched in [350, 380] days back. */
export const YOY_MIN_DAYS_BACK = 350;
export const YOY_MAX_DAYS_BACK = 380;

/** Maximum staleness of a change-rule window anchor before the window is refused (days). */
export const CHANGE_ANCHOR_TOLERANCE_DAYS = 3;

/** Tolerance of the 7d/30d display-change anchors (days; slightly wider for 30d). */
const CHANGE7D_TOLERANCE_DAYS = 3;
const CHANGE30D_TOLERANCE_DAYS = 5;

/* ------------------------------------------------------------------ *
 * Rule evaluation
 * ------------------------------------------------------------------ */

export type RuleVerdict =
  | { status: 'warning' }
  | { status: 'normal' }
  | { status: 'unevaluable'; reason: string };

function satisfiesThreshold(value: number, direction: 'above' | 'below', threshold: number): boolean {
  // Strict comparison: sitting exactly on the threshold is not a warning
  // (a yield curve of exactly 0.00 is not inverted; a CPI of exactly 3.0%
  // has not gone "above 3%").
  return direction === 'above' ? value > threshold : value < threshold;
}

/** Share of `base` values strictly below `value` (the spec's percentile definition). */
export function percentileOf(base: readonly number[], value: number): number {
  if (base.length === 0) return 0;
  let below = 0;
  for (const v of base) if (v < value) below++;
  return below / base.length;
}

/** The 10-year percentile base for the reading dated `asOf` (excludes that reading). */
function percentileBase(series: readonly SeriesPoint[], asOf: string): SeriesPoint[] {
  const current = pointAtOrBefore(series, asOf);
  if (!current) return [];
  const from = addDays(asOf, -PERCENTILE_WINDOW_DAYS);
  return sliceBetween(series, from, current.date).filter((p) => p.date !== current.date);
}

function evaluateAtom(
  rule: WarningRuleAtom,
  series: readonly SeriesPoint[],
  asOf: string,
  aux?: AuxSeries,
): RuleVerdict {
  switch (rule.kind) {
    case 'info':
      return { status: 'normal' };

    case 'threshold': {
      const current = pointAtOrBefore(series, asOf);
      if (!current) return { status: 'unevaluable', reason: 'no observation at or before asOf' };
      if (rule.sustainedWeeks === undefined) {
        return satisfiesThreshold(current.value, rule.direction, rule.value)
          ? { status: 'warning' }
          : { status: 'normal' };
      }
      // Sustained: every reading inside the last `sustainedWeeks` weeks before
      // the CURRENT OBSERVATION (anchored on the data, not on `asOf` — release
      // lag must not shrink the window) must sit in the warning zone, and the
      // window must actually contain that many weekly observations — sparse
      // data is unevaluable, not "sustained".
      const windowStart = addDays(current.date, -rule.sustainedWeeks * 7);
      const window = sliceBetween(series, addDays(windowStart, 1), current.date);
      if (window.length < rule.sustainedWeeks) {
        return { status: 'unevaluable', reason: `sustained window has ${window.length} observations, needs ${rule.sustainedWeeks}` };
      }
      const all = window.every((p) => satisfiesThreshold(p.value, rule.direction, rule.value));
      return all ? { status: 'warning' } : { status: 'normal' };
    }

    case 'percentile': {
      const current = pointAtOrBefore(series, asOf);
      if (!current) return { status: 'unevaluable', reason: 'no observation at or before asOf' };
      const base = percentileBase(series, asOf);
      if (base.length < MIN_PERCENTILE_OBS) {
        return { status: 'unevaluable', reason: `percentile base has ${base.length} observations, needs ${MIN_PERCENTILE_OBS}` };
      }
      const p = percentileOf(base.map((pt) => pt.value), current.value);
      const warning = rule.tail === 'high' ? p >= 1 - rule.cutoff : p <= rule.cutoff;
      return warning ? { status: 'warning' } : { status: 'normal' };
    }

    case 'change': {
      const current = pointAtOrBefore(series, asOf);
      if (!current) return { status: 'unevaluable', reason: 'no observation at or before asOf' };
      const target = addDays(asOf, -rule.windowWeeks * 7);
      const then = pointAtOrBefore(series, target);
      if (!then || then.date === current.date) {
        return { status: 'unevaluable', reason: `no earlier observation ${rule.windowWeeks} weeks back` };
      }
      // Anchor tolerance: if the nearest observation is > 3 days older than the
      // intended window start (sparse series, data gaps), the window is not
      // honestly measurable — refuse instead of measuring a longer window.
      if (daysBetween(then.date, target) > CHANGE_ANCHOR_TOLERANCE_DAYS) {
        return { status: 'unevaluable', reason: `window anchor is ${daysBetween(then.date, target)} days stale (tolerance ${CHANGE_ANCHOR_TOLERANCE_DAYS})` };
      }
      let delta: number;
      if (rule.mode === 'points') {
        delta = current.value - then.value;
      } else {
        if (then.value <= 0) return { status: 'unevaluable', reason: 'pct change on non-positive base' };
        delta = ((current.value - then.value) / then.value) * 100;
      }
      const warning = rule.direction === 'rise' ? delta >= rule.magnitude : delta <= -rule.magnitude;
      return warning ? { status: 'warning' } : { status: 'normal' };
    }

    case 'yoy-negative': {
      const current = pointAtOrBefore(series, asOf);
      if (!current) return { status: 'unevaluable', reason: 'no observation at or before asOf' };
      const windowStart = addDays(asOf, -YOY_MAX_DAYS_BACK);
      const windowEnd = addDays(asOf, -YOY_MIN_DAYS_BACK);
      const yearAgoSlice = sliceBetween(series, windowStart, windowEnd);
      const then = yearAgoSlice[yearAgoSlice.length - 1];
      if (!then) return { status: 'unevaluable', reason: 'no observation 350–380 days back' };
      return current.value < then.value
        ? { status: 'warning' }
        : { status: 'normal' };
    }

    case 'consecutive-decline': {
      const recent = sliceBetween(series, '0001-01-01', asOf).slice(-(rule.periods + 1));
      if (recent.length < rule.periods + 1) {
        return { status: 'unevaluable', reason: `need ${rule.periods + 1} observations, have ${recent.length}` };
      }
      let declining = true;
      for (let i = 1; i < recent.length; i++) {
        if (recent[i]!.value >= recent[i - 1]!.value) declining = false;
      }
      return declining ? { status: 'warning' } : { status: 'normal' };
    }

    case 'above-low': {
      const current = pointAtOrBefore(series, asOf);
      if (!current) return { status: 'unevaluable', reason: 'no observation at or before asOf' };
      const window = sliceBetween(series, addDays(asOf, -365), asOf);
      if (window.length < MIN_ABOVE_LOW_OBS) {
        return { status: 'unevaluable', reason: `12-month window has ${window.length} observations, needs ${MIN_ABOVE_LOW_OBS}` };
      }
      let low = Number.POSITIVE_INFINITY;
      for (const p of window) if (p.value < low) low = p.value;
      return current.value - low >= rule.rise ? { status: 'warning' } : { status: 'normal' };
    }

    case 'below-aux': {
      const current = pointAtOrBefore(series, asOf);
      if (!current) return { status: 'unevaluable', reason: 'no observation at or before asOf' };
      if (!aux || aux.series.length === 0) {
        return { status: 'unevaluable', reason: 'no aux series supplied for the comparison' };
      }
      const other = pointAtOrBefore(aux.series, current.date);
      if (!other) {
        return { status: 'unevaluable', reason: 'aux series has no observation at or before the reading date' };
      }
      // Warning iff the value sits strictly below the paired series — ties
      // count as keeping up (same strictness convention as thresholds).
      return current.value < other.value
        ? { status: 'warning' }
        : { status: 'normal' };
    }
  }
}

/** Evaluate a full rule (atom or flat OR-composite) at `asOf`. */
export function evaluateRule(
  def: IndicatorDefinition,
  series: readonly SeriesPoint[],
  asOf: string,
  aux?: AuxSeries,
): RuleVerdict {
  const rule = def.rule;
  if (rule.kind === 'any-of') {
    let sawNormal = false;
    for (const atom of rule.of) {
      const v = evaluateAtom(atom, series, asOf, aux);
      if (v.status === 'warning') return { status: 'warning' };
      if (v.status === 'normal') sawNormal = true;
    }
    return sawNormal ? { status: 'normal' } : { status: 'unevaluable', reason: 'no composite arm could be evaluated' };
  }
  return evaluateAtom(rule, series, asOf, aux);
}

/* ------------------------------------------------------------------ *
 * Reading computation
 * ------------------------------------------------------------------ */

/**
 * The move-score change basis (2026-10-08 data spec §4): the 30-day change
 * for daily series, the previous-period change for slower cadences. In the
 * definition's changeKind units — the z-score normalises them anyway.
 */
function moveBasisChange(
  series: readonly SeriesPoint[],
  current: SeriesPoint,
  def: IndicatorDefinition,
): number | undefined {
  if (def.cadence === 'daily') {
    // Same calendar-window semantics as windowChange(30d), point-based.
    const target = addDays(current.date, -30);
    const then = pointAtOrBefore(series, target);
    if (!then || then.date === current.date) return undefined;
    if (def.changeKind === 'points') return current.value - then.value;
    if (then.value <= 0) return undefined;
    return ((current.value - then.value) / then.value) * 100;
  }
  // Previous period: the last observation strictly before the current one.
  const idx = series.findIndex((p) => p.date === current.date);
  if (idx <= 0) return undefined;
  const then = series[idx - 1]!;
  if (def.changeKind === 'points') return current.value - then.value;
  if (then.value <= 0) return undefined;
  return ((current.value - then.value) / then.value) * 100;
}

/** Minimum change observations before a move score exists (degenerate base guard). */
export const MIN_MOVE_OBS = 30;

/**
 * The big-mover z-score (data spec §4): (latest change − mean) ÷ std of the
 * same change series over the 10-year percentile window. Undefined when the
 * base is too short or the std is zero (a perfectly flat change series).
 * Pure — the runner and any backtest can freeze the clock via the series.
 */
export function moveScoreOf(
  def: IndicatorDefinition,
  series: readonly SeriesPoint[],
  current: SeriesPoint,
): number | undefined {
  const windowStart = addDays(current.date, -PERCENTILE_WINDOW_DAYS);
  const window = sliceBetween(series, windowStart, current.date);
  const changes: number[] = [];
  for (let i = 1; i < window.length; i++) {
    const a = window[i - 1]!;
    const b = window[i]!;
    if (def.changeKind === 'points') changes.push(b.value - a.value);
    else if (a.value > 0) changes.push(((b.value - a.value) / a.value) * 100);
  }
  // Guard: enough history AND the CURRENT change must be measurable.
  if (changes.length < MIN_MOVE_OBS) return undefined;
  const latest = moveBasisChange(series, current, def);
  if (latest === undefined || !Number.isFinite(latest)) return undefined;
  const mean = changes.reduce((s, v) => s + v, 0) / changes.length;
  const variance = changes.reduce((s, v) => s + (v - mean) ** 2, 0) / changes.length;
  const std = Math.sqrt(variance);
  if (!Number.isFinite(std) || std < 1e-12) return undefined;
  const z = (latest - mean) / std;
  return Number.isFinite(z) ? z : undefined;
}

export interface ReadingSource {
  name: string;
  url?: string;
}

/**
 * I15: the paired comparison series for a `below-aux` rule (e.g. wage
 * growth vs yearly CPI). Supplied by the runner from the SAME run's series
 * map — see adapters/snapshot.ts for the wiring.
 */
export interface AuxSeries {
  /** The other series to compare against, sampled at or before the reading's date. */
  series: readonly SeriesPoint[];
}

/** 7/30-day change in the definition's units; undefined when not measurable. */
function windowChange(
  series: readonly SeriesPoint[],
  current: SeriesPoint,
  days: number,
  kind: 'pct' | 'points',
): number | undefined {
  const target = addDays(current.date, -days);
  const then = pointAtOrBefore(series, target);
  if (!then || then.date === current.date) return undefined;
  const tolerance = days <= 7 ? CHANGE7D_TOLERANCE_DAYS : CHANGE30D_TOLERANCE_DAYS;
  // Sparse series (monthly/quarterly): the nearest older point can be far
  // beyond the intended 7/30-day anchor — show a dash, not a mislabelled delta.
  if (daysBetween(then.date, target) > tolerance) return undefined;
  if (kind === 'points') return current.value - then.value;
  if (then.value <= 0) return undefined;
  return ((current.value - then.value) / then.value) * 100;
}

/**
 * Compute one indicator's reading as of `now` (ISO datetime from the runner —
 * frozen-clock friendly). Order of checks: no data → `unavailable`; too old
 * (per-series freshness limit when present, else cadence grace) → `stale` (a
 * stale vote never counts); info rule → `context`; otherwise the rule votes,
 * and an unevaluable rule is an honest `no-history`.
 */
export function computeReading(
  def: IndicatorDefinition,
  series: readonly SeriesPoint[],
  now: string,
  source: ReadingSource,
  aux?: AuxSeries,
): IndicatorReading {
  const parsed = IndicatorDefinitionSchema.parse(def); // loud, never garbage
  const nowDay = now.slice(0, 10);
  const current = pointAtOrBefore(series, nowDay);

  const base = {
    id: parsed.id,
    sourceName: source.name,
    sourceUrl: source.url,
    updatedAt: now,
  };

  if (!current) {
    return { ...base, value: null, asOf: null, status: 'unavailable' };
  }

  const reading: IndicatorReading = {
    ...base,
    value: current.value,
    asOf: current.date,
    change7d: windowChange(series, current, 7, parsed.changeKind),
    change30d: windowChange(series, current, 30, parsed.changeKind),
    status: 'normal',
  };

  const pBase = percentileBase(series, nowDay);
  if (pBase.length >= MIN_PERCENTILE_OBS) {
    reading.percentile10y = percentileOf(pBase.map((p) => p.value), current.value);
  }

  const grace = staleAfterDaysFor(parsed);
  const age = daysBetween(current.date, nowDay);
  if (grace !== null && age > grace) {
    reading.status = 'stale';
    return reading; // stale items never carry a move score (data spec §4)
  }

  if (parsed.rule.kind === 'info') {
    reading.status = 'context';
    return reading;
  }

  const verdict = evaluateRule(parsed, series, nowDay, aux);
  if (verdict.status === 'unevaluable') {
    reading.status = 'no-history';
    return reading;
  }
  reading.status = verdict.status;
  const move = moveScoreOf(parsed, series, current);
  if (move !== undefined) reading.moveScore = move;
  return reading;
}

/* ------------------------------------------------------------------ *
 * "What changed this week"
 * ------------------------------------------------------------------ */

/**
 * Voting indicators whose status moved between warning and normal, with the
 * change observed within `windowDays` of `now` (frozen-clock friendly — the
 * runner passes its own clock). Context/stale/unavailable never appear: only
 * real vote flips are "changes".
 */
export function changedSince(
  previous: readonly IndicatorReading[],
  current: readonly IndicatorReading[],
  now: string,
  windowDays = 7,
): ChangedEvent[] {
  const nowDay = epochDay(now.slice(0, 10));
  const prevById = new Map(previous.map((r) => [r.id, r]));
  const out: ChangedEvent[] = [];
  for (const cur of current) {
    if (cur.asOf === null) continue;
    const prev = prevById.get(cur.id);
    if (!prev) continue;
    const votable = (s: IndicatorReading['status']) => s === 'warning' || s === 'normal';
    if (!votable(prev.status) || !votable(cur.status)) continue;
    if (prev.status === cur.status) continue;
    if (nowDay - epochDay(cur.asOf) > windowDays) continue;
    out.push({ id: cur.id, from: prev.status, to: cur.status, asOf: cur.asOf });
  }
  return out;
}
