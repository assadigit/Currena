/**
 * Pair + dollar entry builders (Phase 3 split of the former compute.ts
 * monolith; V6, V7 by construction; the dollar measure is D-06's reused
 * Currena basket).
 */

import type { FxDollarMeasure, FxPairEntry, FxPairId } from '@currena/core';
import type { SeriesPoint } from '../series';
import { daysBetween } from '../series';
import { computeBasketValue } from '../basket';
import { BIG_MOVE_PERCENTILE, FX_MIN_POINTS, FX_STALE_DAYS } from './definitions';
import { round5 } from './maths';
import { changesOf, moveRankOf } from './pairs';
import type { FxQuoteSet } from './providers';
import { fxWeeklySeries } from './weekly';

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
