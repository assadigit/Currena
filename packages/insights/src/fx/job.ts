/**
 * World currencies — the fetch job (spec §4), the fx twin of
 * ../markets/job.ts, shared verbatim by the currena-markets Worker cron
 * (the fx job rides the section's two existing triggers — spec §4.4's
 * fallback, the account's 5-cron free limit being full) and the manual
 * fx-run script, so the two can never drift apart (the live-run/ingest
 * discipline).
 *
 * ONE provider call per run (spec §5 "provider calls per run"):
 * Frankfurter's whole-currency timeseries. The Yahoo fallback (8 chart
 * calls) fires only when the primary fails, or — V3 — when a pair's latest
 * one-day move exceeds 5% and the job needs a second voice before it can
 * believe it. Every pair is fault-isolated: one pair's rejection keeps its
 * stored row verbatim (V7 — the UI never sees a zero, blank or NaN).
 *
 * Everything the RULES need from other sections (the stock legs, gold, the
 * market-stress gauges) is read from what is ALREADY stored — the
 * FxCrossReader port; no new provider calls (spec §6.3).
 */

import type { FxPairEntry, FxPairId, FxSnapshot, FxSource, IndicatorReading } from '@currena/core';
import type { SeriesPoint } from '../series';
import { daysBetween, fromEpochDay } from '../series';
import { computeBasketValue } from '../basket';
import { decodeWeeklySeries } from '../markets/definitions';
import type { FxQuotes, FxQuoteSet } from './providers';
import type { FrankfurterFetchOptions, YahooFxFetchOptions } from './providers';
import { fetchFrankfurterQuotes, fetchYahooQuotes } from './providers';
import {
  FX_BASKET_CURRENCIES,
  FX_CURRENCIES,
  FX_MIN_POINTS,
  FX_PAIR_IDS,
  FX_STALE_DAYS,
} from './definitions';
import {
  buildDollarMeasure,
  buildFxPairEntry,
  buildFxSnapshot,
  evaluateFxRules,
  goldInputFromHistory,
  pairSeriesFromQuotes,
  ratesAgree,
  stockInputsFromMarkets,
  type FxRuleInputs,
} from './compute';
import type { FxCrossReader } from './store';

/* ------------------------------------------------------------------ *
 * Fetchers (injectable — tests replay fakes)
 * ------------------------------------------------------------------ */

export interface FxJobFetchers {
  fetchFrankfurter(): Promise<FxQuotes>;
  fetchYahoo(): Promise<FxQuotes>;
}

/** Default fetchers over the real providers. */
export function defaultFxFetchers(
  frankfurter: FrankfurterFetchOptions = {},
  yahoo: YahooFxFetchOptions = {},
): FxJobFetchers {
  return {
    fetchFrankfurter: () => fetchFrankfurterQuotes(frankfurter),
    fetchYahoo: () => fetchYahooQuotes(yahoo),
  };
}

/* ------------------------------------------------------------------ *
 * The fear leg (R1, spec §6.3 + decision D-05: no VIX exists in the repo —
 * the stored market-stress gauges stand in for "VIX status is Needs
 * attention or worse")
 * ------------------------------------------------------------------ */

export interface FxFearInput {
  /** True when a stored market-stress gauge is in warning. */
  fear: boolean;
  /** True when the gauges were READABLE this run (the snapshot exists). */
  fearAvailable: boolean;
}

/** The stress gauges that stand in for the VIX leg (D-05). */
export const FEAR_GAUGE_IDS = ['stress-stlfsi', 'nfci'] as const;

export function fearInputFromSnapshot(snapshot: { readings: readonly IndicatorReading[] } | undefined): FxFearInput {
  if (snapshot === undefined) return { fear: false, fearAvailable: false };
  const rows = snapshot.readings.filter((r) =>
    (FEAR_GAUGE_IDS as readonly string[]).includes(r.id as string),
  );
  if (rows.length === 0) return { fear: false, fearAvailable: false };
  return { fear: rows.some((r) => r.status === 'warning'), fearAvailable: true };
}

/* ------------------------------------------------------------------ *
 * The job
 * ------------------------------------------------------------------ */

export interface FxJobReport {
  /** Which provider produced the winning quote set ('none' = total failure). */
  usedSource: FxSource | 'none';
  /** Provider calls actually made (the budget test asserts on these). */
  providerCalls: { frankfurter: number; yahoo: number };
  /** The pairs whose stored row was kept (rejection or failure). */
  held: readonly FxPairId[];
  /** Rule notes (V2/V3/V5) and provider errors, human-readable. */
  notes: string[];
}

export interface FxJobResult {
  /** The assembled, schema-validated snapshot — undefined when nothing honest exists. */
  snapshot?: FxSnapshot;
  report: FxJobReport;
}

/** V4 at the fetch level: an answer must carry ≥200 points per fx currency. */
function validateQuoteSet(quotes: FxQuoteSet, notes: string[]): FxQuoteSet {
  for (const code of FX_CURRENCIES) {
    const points = quotes[code];
    if (points === undefined || points.length < FX_MIN_POINTS) {
      throw new Error(
        `${code}: ${points === undefined ? 'absent' : `only ${points.length} points`} (V4 needs ${FX_MIN_POINTS})`,
      );
    }
  }
  // CAD/SEK are only needed by the reused dollar basket; a miss degrades to
  // the previous dollar row (noted), never a failure of the whole run.
  for (const code of FX_BASKET_CURRENCIES) {
    if (quotes[code] === undefined) notes.push(`V4 note: ${code} absent — the dollar basket may ride the previous row`);
  }
  return quotes;
}

/**
 * Run the whole fx job: fetch → validate → derive pairs + the dollar
 * measure → apply V2/V3/V5 against the stored rows → evaluate the rules →
 * assemble the snapshot. Pure orchestration (no store writes — runFxUpdate
 * owns the write gate).
 */
export async function runFxJob(
  fetchers: FxJobFetchers,
  prev: FxSnapshot | undefined,
  cross: FxCrossReader,
  runDate: string,
  generatedAt: string,
): Promise<FxJobResult> {
  const notes: string[] = [];
  const providerCalls = { frankfurter: 0, yahoo: 0 };
  const prevPairs = new Map((prev?.pairs ?? []).map((p) => [p.id as string, p]));

  // 1. The ONE primary call (spec §4.2).
  let primary: FxQuotes | undefined;
  try {
    providerCalls.frankfurter++;
    primary = { source: 'frankfurter', quotes: validateQuoteSet((await fetchers.fetchFrankfurter()).quotes, notes) };
  } catch (err) {
    notes.push(`frankfurter failed: ${errMessage(err)}`);
  }

  // 2. The fallback: the primary failed entirely, or a pair's latest
  //    one-day move is suspicious (V3) and needs a second voice.
  let suspicious = false;
  if (primary !== undefined) {
    suspicious = FX_PAIR_IDS.some((id) => {
      try {
        const series = pairSeriesFromQuotes(id, primary.quotes);
        return series.length >= 2 && suspiciousDayMoveOf(series);
      } catch {
        return false;
      }
    });
  }
  let secondary: FxQuotes | undefined;
  if (primary === undefined || suspicious) {
    try {
      providerCalls.yahoo++;
      secondary = { source: 'yahoo', quotes: validateQuoteSet((await fetchers.fetchYahoo()).quotes, notes) };
      if (primary !== undefined) notes.push('V3: suspicious day move — the second provider was asked');
    } catch (err) {
      notes.push(`yahoo failed: ${errMessage(err)}`);
    }
  }

  const winner = primary ?? secondary;
  if (winner === undefined) {
    return {
      report: {
        usedSource: 'none',
        providerCalls,
        held: prev?.pairs.map((p) => p.id) ?? [],
        notes: [...notes, 'both providers failed — nothing to compute this run'],
      },
    };
  }

  // The quote set the entries derive from (the primary's when it answered).
  const quotes = winner.quotes;
  const source: FxSource = winner.source;

  // 3. V5 (both providers answered the same day): latest values must agree
  //    within 0.5% — the primary wins, a miss is a logged warning.
  if (primary !== undefined && secondary !== undefined) {
    for (const code of FX_CURRENCIES) {
      const a = primary.quotes[code];
      const b = secondary.quotes[code];
      if (a === undefined || b === undefined) continue;
      const lastA = a[a.length - 1]!;
      const lastB = b[b.length - 1]!;
      if (lastA.date === lastB.date && !ratesAgree(lastA.value, lastB.value)) {
        const diff = Math.abs(((lastA.value - lastB.value) / lastB.value) * 100);
        notes.push(`V5: ${code} disagrees by ${diff.toFixed(2)}% — showing ${primary.source}`);
      }
    }
  }

  // The second voice for V3: per pair, the fallback's own derived series.
  const secondVoice = (id: FxPairId): SeriesPoint[] | undefined => {
    if (secondary === undefined) return undefined;
    try {
      return pairSeriesFromQuotes(id, secondary.quotes);
    } catch {
      return undefined;
    }
  };

  // 4. The pairs (V2 date guard + V3 agreement guard + same-date stability).
  const held: FxPairId[] = [];
  const pairEntries: FxPairEntry[] = [];
  const pairSeriesById = new Map<FxPairId, SeriesPoint[]>();
  for (const id of FX_PAIR_IDS) {
    let series: SeriesPoint[];
    try {
      series = pairSeriesFromQuotes(id, quotes);
    } catch (err) {
      // A cross with a missing leg: keep the stored row verbatim (V7).
      notes.push(`${id}: ${errMessage(err)} — stored row kept`);
      const storedRow = prevPairs.get(id);
      if (storedRow !== undefined) {
        held.push(id);
        pairEntries.push(reStale(storedRow, runDate));
        pairSeriesById.set(id, weeklyOf(storedRow));
      }
      continue;
    }
    const storedRow = prevPairs.get(id);
    try {
      const entry = buildFxPairEntry(id, series, source, runDate);
      // V2: the new last date must not be older than the stored one.
      if (storedRow !== undefined && entry.asOf < storedRow.asOf) {
        notes.push(`V2: ${id} date ${entry.asOf} older than stored ${storedRow.asOf} — held`);
        held.push(id);
        pairEntries.push(reStale(storedRow, runDate));
        pairSeriesById.set(id, weeklyOf(storedRow));
        continue;
      }
      // Same-date stability: a re-fetch on the stored date within 0.5% is
      // "the same data" — keep the stored row (source labels never flap).
      // The RULE INPUTS still read the current derived series (below), so
      // a re-run with identical quotes computes identical rules and the
      // write gate stays closed (build step 5's exactly-one-write test).
      if (storedRow !== undefined && entry.asOf === storedRow.asOf && ratesAgree(entry.rate, storedRow.rate)) {
        held.push(id);
        pairEntries.push(reStale(storedRow, runDate));
        pairSeriesById.set(id, series);
        continue;
      }
      // V3: a >5% one-day move is only believed when both providers agree
      // (a real move of that size is very rare).
      if (series.length >= 2 && suspiciousDayMoveOf(series)) {
        const voice = secondVoice(id);
        const voiceLast = voice !== undefined ? voice[voice.length - 1] : undefined;
        if (voiceLast === undefined || voiceLast.date !== entry.asOf || !ratesAgree(entry.rate, voiceLast.value)) {
          notes.push(`V3: ${id} one-day move unconfirmed — held`);
          held.push(id);
          if (storedRow !== undefined) {
            pairEntries.push(reStale(storedRow, runDate));
            pairSeriesById.set(id, weeklyOf(storedRow));
          } else {
            pairEntries.push(entry);
            pairSeriesById.set(id, series);
          }
          continue;
        }
        notes.push(`V3: ${id} one-day move confirmed by both providers — accepted`);
      }
      pairEntries.push(entry);
      pairSeriesById.set(id, series);
    } catch (err) {
      notes.push(`${id}: ${errMessage(err)} — ${storedRow !== undefined ? 'stored row kept' : 'row absent'}`);
      if (storedRow !== undefined) {
        held.push(id);
        pairEntries.push(reStale(storedRow, runDate));
        pairSeriesById.set(id, weeklyOf(storedRow));
      }
    }
  }

  // 5. The dollar measure (the reused Currena basket, D-06). CAD/SEK missing
  //    → keep the previous row honestly (V7).
  let dollarMeasure = prev?.dollarMeasure;
  let dollarSeries: SeriesPoint[] | undefined;
  if (quotes.CAD !== undefined && quotes.SEK !== undefined) {
    try {
      const next = buildDollarMeasure(quotes, source, runDate);
      dollarSeries = basketSeriesFromQuotes(quotes);
      const prevDollar = prev?.dollarMeasure;
      if (prevDollar !== undefined && next.asOf < prevDollar.asOf) {
        notes.push(`V2: dollar measure date ${next.asOf} older than stored ${prevDollar.asOf} — held`);
        dollarSeries = undefined;
      } else if (
        prevDollar !== undefined &&
        next.asOf === prevDollar.asOf &&
        ratesAgree(next.value, prevDollar.value)
      ) {
        dollarMeasure = prevDollar; // same-date stability
      } else {
        dollarMeasure = next;
      }
    } catch (err) {
      notes.push(
        `dollar measure: ${errMessage(err)} — ${prev?.dollarMeasure !== undefined ? 'stored row kept' : 'row absent'}`,
      );
    }
  } else if (prev?.dollarMeasure === undefined) {
    notes.push('dollar measure: CAD/SEK absent on the first-ever run — no basket yet');
  }
  if (dollarMeasure !== undefined && dollarSeries === undefined) {
    dollarSeries = weeklyOfDollar(dollarMeasure);
  }

  if (pairEntries.length === 0 || dollarMeasure === undefined) {
    return {
      report: {
        usedSource: source,
        providerCalls,
        held,
        notes: [...notes, 'no pair rows or no dollar measure — nothing honest to store'],
      },
    };
  }

  // 6. The cross-section inputs (spec §6.3) — read from what is stored.
  const markets = await cross.getMarkets();
  const gold = await cross.getGoldHistory();
  const insights = await cross.getInsightsSnapshot();
  const stocks = stockInputsFromMarkets(markets, runDate);
  const goldInput = goldInputFromHistory(gold, runDate);
  const { fear, fearAvailable } = fearInputFromSnapshot(insights);

  const ruleInputs: FxRuleInputs = {
    pairs: Object.fromEntries(
      [...pairSeriesById].map(([id, series]) => {
        const entry = pairEntries.find((p) => p.id === id)!;
        return [id, { chg: entry.chg, series }];
      }),
    ),
    dollar: { chg: dollarMeasure.chg, series: dollarSeries! },
    stocks,
    gold: goldInput,
    fear,
    fearAvailable,
  };

  const rules = evaluateFxRules(ruleInputs);

  // 7. Assemble (schema-validated inside buildFxSnapshot).
  const snapshot = buildFxSnapshot({ generatedAt, dollarMeasure, pairs: pairEntries, rules });

  return {
    snapshot,
    report: { usedSource: source, providerCalls, held, notes },
  };
}

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

/** A ≥5% one-day move at the series' tail (V3's trigger, on a raw series). */
function suspiciousDayMoveOf(series: readonly SeriesPoint[]): boolean {
  const last = series[series.length - 1]!;
  const before = series[series.length - 2]!;
  return Math.abs(((last.value - before.value) / before.value) * 100) >= 5 - 1e-9;
}

/** Re-evaluate a held row's staleness against the run date (V6, honestly). */
function reStale(entry: FxPairEntry, runDate: string): FxPairEntry {
  const staleNow = daysBetween(entry.asOf, runDate) > FX_STALE_DAYS;
  return staleNow === entry.stale ? entry : { ...entry, stale: staleNow };
}

/**
 * Decode a stored pair row's weekly deltas back into a (weekly-grained)
 * series, so pattern checks and charts can still read a HELD pair. The
 * points are the stored weekly closes on their epoch days.
 */
function weeklyOf(entry: Pick<FxPairEntry, 'weekly'>): SeriesPoint[] {
  return decodeWeeklySeries(entry.weekly).map(([day, value]) => ({ date: fromEpochDay(day), value }));
}

/** The dollar measure's weekly deltas, decoded the same way. */
function weeklyOfDollar(measure: Pick<FxPairEntry, 'weekly'>): SeriesPoint[] {
  return weeklyOf(measure);
}

/** The dollar-basket daily series from a full quote set (charts + patterns). */
function basketSeriesFromQuotes(quotes: FxQuoteSet): SeriesPoint[] {
  const codes = ['EUR', 'JPY', 'GBP', 'CAD', 'SEK', 'CHF'] as const;
  const byDate = new Map<string, Record<string, number>>();
  for (const ccy of codes) {
    for (const p of quotes[ccy] ?? []) {
      const row = byDate.get(p.date) ?? {};
      row[ccy] = p.value;
      byDate.set(p.date, row);
    }
  }
  const series: SeriesPoint[] = [];
  for (const [date, row] of byDate) {
    let ok = true;
    for (const ccy of codes) if (row[ccy] === undefined) ok = false;
    if (!ok) continue;
    series.push({ date, value: computeBasketValue(row as Record<string, number>) });
  }
  series.sort((x, y) => (x.date < y.date ? -1 : 1));
  if (series.length === 0) throw new Error('empty basket series');
  return series;
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
