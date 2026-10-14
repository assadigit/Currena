/**
 * Pair derivation + the four period changes + move_rank (Phase 3 split of
 * the former compute.ts monolith; spec §3.1, §4.1 rule 4, §6.1, §6.2).
 */

import type { FxChg, FxPairId } from '@currena/core';
import type { SeriesPoint } from '../series';
import { addMonths, epochDay, pointAtOrBefore } from '../series';
import { fxPairDefinition } from './definitions';
import type { FxCurrency } from './definitions';
import type { FxQuoteSet } from './providers';
import { pctChange, round2 } from './maths';

/** The USD-side rate of one currency on a date (undefined when absent). */
export type RateMap = Partial<Record<FxCurrency, number>>;

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

/**
 * The four period changes (spec §6.1): d1/m1/m3/y1 of a series' last value
 * vs the value on or before the same date one period earlier (d1 = the
 * previous point — "change since the previous day's ECB reference rate").
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

/**
 * move_rank (spec §6.2): share (0–100) of the rolling one-month moves in
 * the last 365 days that are SMALLER than today's one-month move, ignoring
 * direction.
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
