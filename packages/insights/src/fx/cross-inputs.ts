/**
 * Cross-section inputs (spec §6.3) — the typed bundle the rules read
 * (Phase 3 split of the former compute.ts monolith).
 */

import type { FxChg, FxPairId, MarketEntry } from '@currena/core';
import type { SeriesPoint } from '../series';
import { addMonths, daysBetween, fromEpochDay, pointAtOrBefore } from '../series';
import { decodeWeeklySeries } from '../markets/definitions';
import { FX_STALE_DAYS } from './definitions';
import { pctChange, round2 } from './maths';

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
