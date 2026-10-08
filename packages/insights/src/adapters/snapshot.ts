/**
 * Phase I3 snapshot assembly — the pure functions that turn collected
 * indicator series into the exact wire payloads the runner stores:
 *
 *   buildInsightsSnapshot — readings + summaries + changedThisWeek merge
 *                           + calendar → InsightsSnapshot (validated)
 *   buildHistoryFile      — one indicator series → downsampled 10-year
 *                           IndicatorHistory (validated)
 *   buildInsightsStatus   — per-source fetch reports → InsightsStatus
 *
 * Everything here is deterministic given its inputs (frozen clock passed in,
 * AGENTS.md rule 2 style) so the ingest script is a thin shell around these.
 */

import type { CalendarEvent, IndicatorHistory, IndicatorId, InsightsSnapshot, InsightsSourceReport, InsightsStatus, IndicatorReading } from '@currena/core';
import { InsightsSnapshotSchema, IndicatorHistorySchema, InsightsStatusSchema } from '@currena/core';
import { changedSince, computeReading, PERCENTILE_WINDOW_DAYS, type AuxSeries, type ReadingSource } from '../scoring';
import { summarizeByGauges } from '../gauges';
import { DEFINITIONS } from '../definitions';
import { addDays, epochDay, fromEpochDay, type SeriesPoint } from '../series';
import { AUX_RULE_WIRING, READING_SOURCES } from './derived';

export interface SnapshotBuildInputs {
  /** Assembled indicator series (buildIndicatorSeries output). */
  series: Partial<Record<IndicatorId, SeriesPoint[]>>;
  /**
   * The previously STORED snapshot, when one exists — its readings feed the
   * "what changed this week" diff and its accumulated events are carried
   * forward (a daily runner only remembers yesterday otherwise).
   */
  previous?: InsightsSnapshot | undefined;
  /** Hand-maintained calendar entries (data/insights-calendar.json). */
  calendar: readonly CalendarEvent[];
  /** The run's clock (ISO 8601 UTC) — generatedAt and every reading's updatedAt. */
  now: string;
}

/**
 * Build the full snapshot. Missing series produce honest `unavailable`
 * readings (never omitted — the contract promises one reading per indicator
 * id eventually; the refine allows subsets but the runner always emits all
 * 28). The result is schema-validated: the runner refuses to write a
 * snapshot that would not survive the Worker's read-side validation.
 */
export function buildInsightsSnapshot(inputs: SnapshotBuildInputs): InsightsSnapshot {
  const readings: IndicatorReading[] = [];
  for (const def of DEFINITIONS) {
    const series = inputs.series[def.id];
    const source: ReadingSource = READING_SOURCES[def.id] ?? { name: def.sourceRef };
    if (!series) {
      readings.push({
        id: def.id,
        value: null,
        asOf: null,
        status: 'unavailable',
        sourceName: source.name,
        sourceUrl: source.url,
        updatedAt: inputs.now,
      });
      continue;
    }
    // I15: below-aux rules get their paired series (wage growth vs CPI).
    const auxOf = AUX_RULE_WIRING[def.id];
    const auxSeries = auxOf ? auxOf(inputs.series) : undefined;
    const aux: AuxSeries | undefined = auxSeries ? { series: auxSeries } : undefined;
    readings.push(computeReading(def, series, inputs.now, source, aux));
  }

  const summary = summarizeByGauges(readings);

  // "What changed this week": today's vote flips (vs the previous snapshot's
  // readings) MERGED with the still-fresh events the previous snapshot had
  // accumulated — a daily runner must remember the whole week, not just the
  // last day. Today's event wins per id (a double flip shows the latest leg).
  const flipsToday = inputs.previous ? changedSince(inputs.previous.readings, readings, inputs.now) : [];
  const windowDays = 7;
  const nowDay = epochDay(inputs.now.slice(0, 10));
  const carried = (inputs.previous?.changedThisWeek ?? []).filter((e) => nowDay - epochDay(e.asOf) <= windowDays);
  const byId = new Map<string, (typeof carried)[number]>();
  for (const event of carried) byId.set(event.id, event);
  for (const event of flipsToday) byId.set(event.id, event);
  const changedThisWeek = [...byId.values()].sort((a, b) => (a.asOf < b.asOf ? -1 : a.asOf > b.asOf ? 1 : a.id.localeCompare(b.id)));

  return InsightsSnapshotSchema.parse({
    generatedAt: inputs.now,
    summary,
    readings,
    changedThisWeek,
    calendar: [...inputs.calendar],
  });
}

/* ------------------------------------------------------------------ *
 * History files
 * ------------------------------------------------------------------ */

/**
 * Cap on stored points per indicator. ~10 years of DAILY data is ~2,600
 * points; 520 keeps every payload ≤ ~10 KB (weekly-ish resolution for
 * dailies; monthly and quarterly series never reach the cap).
 */
export const HISTORY_MAX_POINTS = 520;

/** Same 10-year window the scoring engine's percentiles use. */
export const HISTORY_WINDOW_DAYS = PERCENTILE_WINDOW_DAYS;

/**
 * Keep at most `maxPoints` evenly-strided points, always ending on the LAST
 * observation (the chart's right edge must be the current value, never a
 * strided miss). Pure; order-preserving.
 */
export function downsampleSeries(series: readonly SeriesPoint[], maxPoints = HISTORY_MAX_POINTS): SeriesPoint[] {
  if (series.length <= maxPoints) return [...series];
  const stride = Math.ceil(series.length / maxPoints);
  const out: SeriesPoint[] = [];
  for (let i = 0; i < series.length; i += stride) out.push(series[i]!);
  const last = series[series.length - 1]!;
  if (out[out.length - 1]!.date !== last.date) out.push(last);
  return out;
}

/**
 * Options for {@link buildHistoryFile}.
 */
export interface BuildHistoryFileOptions {
  /**
   * Minimum observation count that still emits a file — 2 by default
   * (single-point "live" cards like gold-btc/silver-btc/gold-aud get no
   * history key and the endpoint answers 404, the honest "no chart"
   * state). The ingest runner passes 1 for the accumulated-daily rows:
   * a row with no monthly base (btc-usd) must persist its FIRST daily
   * point or the accumulation can never bootstrap — every run would
   * rebuild a single live point and the 7/30-day changes the data spec
   * §3 promises would never appear (2026-10-08 production evidence).
   */
  minPoints?: number;
}

/**
 * One indicator's stored history: the last 10 years (anchored on the newest
 * observation, mirroring the scoring percentile base), downsampled to
 * HISTORY_MAX_POINTS, encoded as [epochDay, value] pairs. Returns undefined
 * for series below the `minPoints` floor (2 by default).
 */
export function buildHistoryFile(
  id: IndicatorId,
  series: readonly SeriesPoint[],
  opts: BuildHistoryFileOptions = {},
): IndicatorHistory | undefined {
  const minPoints = opts.minPoints ?? 2;
  if (series.length < minPoints) return undefined;
  const last = series[series.length - 1]!;
  const windowStart = addDays(last.date, -HISTORY_WINDOW_DAYS);
  const windowed = series.filter((p) => p.date >= windowStart);
  const kept = downsampleSeries(windowed);
  return IndicatorHistorySchema.parse({
    v: 1,
    id,
    points: kept.map((p) => [epochDay(p.date), p.value] as [number, number]),
  });
}

/**
 * I15: decode a stored IndicatorHistory back into dated points so the next
 * run can seed the accumulated-daily series (see SeriesInputs.seedHistory).
 * Pure — the runner calls it right after store.getHistory().
 */
export function historyToSeries(history: IndicatorHistory): SeriesPoint[] {
  return history.points.map(([day, value]) => ({ date: fromEpochDay(day), value }));
}

/* ------------------------------------------------------------------ *
 * Run status
 * ------------------------------------------------------------------ */

export interface StatusBuildInputs {
  reports: readonly InsightsSourceReport[];
  generatedAt: string;
  mode: InsightsStatus['mode'];
  dryRun: boolean;
}

/** The per-source freshness record for /admin (insights:status). */
export function buildInsightsStatus(inputs: StatusBuildInputs): InsightsStatus {
  return InsightsStatusSchema.parse({
    v: 1,
    generatedAt: inputs.generatedAt,
    mode: inputs.mode,
    dryRun: inputs.dryRun,
    sources: [...inputs.reports],
  });
}
