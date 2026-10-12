/**
 * World stock markets — the fetch job (spec §3.4), shared verbatim by the
 * currena-markets Worker cron and the manual runner scripts so the two can
 * never drift apart (the live-run/ingest discipline).
 *
 * Two scheduled runs (own cron triggers, spec §4 rule 3):
 *   MAIN   23:30 UTC Mon–Fri — fetches every market, EODHD first;
 *   RETRY  01:30 UTC Tue–Sat — re-fetches only markets that failed or look
 *          old (asOf behind the newest expected close, or already stale).
 *
 * The account's 1,000 KV writes/day are consumed by the ever-green rates
 * cron by ~18:30 UTC (verified 2026-10-06, see store.ts) — so the MAIN
 * run's write regularly bounces off the daily cap, and the RETRY run,
 * landing in the fresh post-midnight budget slice, is the one that usually
 * lands the day's single write. The data itself never changes between the
 * two runs (the closes are immutable), which is why the retry may re-fetch
 * through Yahoo: it protects the thin EODHD free quota (20 calls/day — the
 * main run already spent ~15 of them) while returning identical numbers.
 * When only a FEW markets need data (a genuine provider hiccup), the retry
 * keeps the spec's EODHD-first order.
 *
 * Everything here is sequential and per-market fault-isolated: one market's
 * failure never fails the run (R7 — the stored row simply survives).
 */

import type { MarketEntry, MarketId, MarketsSnapshot } from '@currena/core';
import { fromEpochDay, epochDay } from '../series';
import { ProviderError, fetchEodhdSeries, fetchYahooSeries } from './providers';
import type { MarketSeries } from './providers';
import type { EodhdFetchOptions, YahooFetchOptions } from './providers';
import type { MarketResolution } from './compute';
import { resolveMarket } from './compute';
import { MARKETS, MARKET_IDS, MIN_CLOSES } from './definitions';

/* ------------------------------------------------------------------ *
 * Run shape + retry gating
 * ------------------------------------------------------------------ */

export type MarketRunKind = 'main' | 'retry';

export interface MarketJobOptions {
  kind: MarketRunKind;
  /**
   * Provider order for this run: 'eodhd-first' is the spec's §3.4 chain;
   * 'yahoo-first' is the retry run's quota guard when the WHOLE snapshot
   * looks old (the main run fetched hours ago and only its write bounced).
   */
  providerOrder: 'eodhd-first' | 'yahoo-first';
  /** Restrict the run to these markets (the retry's failed-or-old set). */
  onlyIds?: readonly MarketId[];
}

/** Which markets a retry run should re-fetch (§3.4: "failed or look old"). */
export function marketsNeedingData(
  prev: MarketsSnapshot | undefined,
  nowUtcDate: string,
): readonly MarketId[] {
  if (prev === undefined) return MARKET_IDS; // first-ever run: everything
  const expected = lastExpectedCloseDate(nowUtcDate);
  const out: MarketId[] = [];
  for (const m of prev.markets) {
    if (m.stale || m.asOf < expected) out.push(m.id);
  }
  // Markets with no stored row at all (a total failure on an earlier run).
  for (const id of MARKET_IDS) {
    if (!prev.markets.some((m) => m.id === id)) out.push(id);
  }
  return out;
}

/**
 * The newest close date ANY of the 16 markets could carry by now: the most
 * recent Monday–Friday strictly before today's UTC date. (By 01:30 UTC the
 * whole prior trading day has closed everywhere — Asia first, the US last
 * at ~21:00 UTC.) A market still behind this date either failed a fetch or
 * sat a holiday; re-fetching it is cheap and changes nothing when the
 * holiday simply continues.
 */
export function lastExpectedCloseDate(nowUtcDate: string): string {
  let day = epochDay(nowUtcDate) - 1;
  while (((day + 3) % 7) >= 5) day -= 1; // 0 = Monday … 5,6 = Sat, Sun
  return fromEpochDay(day);
}

/** The retry run's options derived from the stored snapshot (quota-aware). */
export function retryRunOptions(prev: MarketsSnapshot | undefined, nowUtcDate: string): MarketJobOptions {
  const ids = marketsNeedingData(prev, nowUtcDate);
  const wholeSnapshotOld = ids.length > MARKETS.length / 2;
  return {
    kind: 'retry',
    // Documented above: a fully-old snapshot means the main run's write
    // bounced 2 h ago — the closes are immutable, so Yahoo re-fetches them
    // without spending the EODHD quota the main run already used today.
    providerOrder: wholeSnapshotOld ? 'yahoo-first' : 'eodhd-first',
    onlyIds: ids,
  };
}

/* ------------------------------------------------------------------ *
 * The job
 * ------------------------------------------------------------------ */

/** Default fetchers over the real providers (tests inject fakes). */
export function defaultFetchers(
  eodhd: EodhdFetchOptions,
  yahoo: YahooFetchOptions = {},
): MarketJobFetchers {
  return {
    fetchEodhd: (id) => fetchEodhdSeries(id, eodhd),
    fetchYahoo: (id) => fetchYahooSeries(id, yahoo),
  };
}

export interface MarketJobFetchers {
  fetchEodhd: (id: MarketId) => Promise<MarketSeries>;
  fetchYahoo: (id: MarketId) => Promise<MarketSeries>;
}

export interface MarketJobReport {
  id: MarketId;
  /** Which provider produced the winning series ('none' = total failure). */
  usedSource: 'eodhd' | 'yahoo' | 'none';
  /** Provider calls actually made for this market (budget report). */
  called: Array<'eodhd' | 'yahoo'>;
  /** True when the stored row is kept (rejection or failure). */
  held: boolean;
  /** Rule notes (R2/R3/R5) and provider errors, human-readable. */
  notes: string[];
}

export interface MarketJobResult {
  resolutions: readonly MarketResolution[];
  reports: readonly MarketJobReport[];
  /** Provider calls made this run (the budget test asserts on these). */
  providerCalls: { eodhd: number; yahoo: number };
}

/** R4 at the fetch level: an answer under MIN_CLOSES closes is a rejection. */
function validateSeries(series: MarketSeries): MarketSeries {
  if (series.points.length < MIN_CLOSES) {
    throw new ProviderError(
      series.source,
      series.id,
      `only ${series.points.length} closes returned (R4 needs ${MIN_CLOSES})`,
    );
  }
  return series;
}

/** A ≥15% one-day move inside the series — R3's trigger (pure peek). */
function suspiciousDayMove(series: MarketSeries): boolean {
  const points = series.points;
  if (points.length < 2) return false;
  const last = points[points.length - 1]!;
  const before = points[points.length - 2]!;
  return Math.abs(((last.value - before.value) / before.value) * 100) >= 15;
}

export async function runMarketsJob(
  fetchers: MarketJobFetchers,
  options: MarketJobOptions,
  prev: MarketsSnapshot | undefined,
  runDate: string,
): Promise<MarketJobResult> {
  const prevById = new Map((prev?.markets ?? []).map((m) => [m.id as string, m]));
  const ids = options.onlyIds ?? MARKET_IDS;
  const first = options.providerOrder === 'eodhd-first' ? 'eodhd' : 'yahoo';
  const second = first === 'eodhd' ? 'yahoo' : 'eodhd';

  const resolutions: MarketResolution[] = [];
  const reports: MarketJobReport[] = [];
  const providerCalls = { eodhd: 0, yahoo: 0 };

  for (const id of ids) {
    const prevEntry: MarketEntry | undefined = prevById.get(id);
    const called: Array<'eodhd' | 'yahoo'> = [];
    const notes: string[] = [];

    const fetchOne = async (provider: 'eodhd' | 'yahoo'): Promise<MarketSeries> => {
      called.push(provider);
      providerCalls[provider]++;
      const series =
        provider === 'eodhd'
          ? await fetchers.fetchEodhd(id)
          : await fetchers.fetchYahoo(id);
      return validateSeries(series);
    };

    // 1. Primary provider (spec §3.4 chain).
    let primary: MarketSeries | undefined;
    try {
      primary = await fetchOne(first);
    } catch (err) {
      notes.push(providerErrorNote(err));
    }

    // 2. Fallback: the primary failed, or R3 demands a second voice before
    //    a ≥15% one-day move can be believed.
    let secondary: MarketSeries | undefined;
    const needsSecond = primary === undefined || suspiciousDayMove(primary);
    if (needsSecond) {
      try {
        secondary = await fetchOne(second);
      } catch (err) {
        notes.push(providerErrorNote(err));
      }
    }

    // 3. Decide.
    let resolution: MarketResolution;
    const winner = primary ?? secondary;
    if (winner === undefined) {
      const failNotes = [...notes, 'both providers failed — row held (R7)'];
      resolution = { id, held: true, notes: failNotes };
      reports.push({ id, usedSource: 'none', called, held: true, notes: failNotes });
      resolutions.push(resolution);
      continue;
    }
    // The fallback serves as the candidate's primary when the ordered
    // primary failed; when both answered, primary stays primary and
    // secondary is the R3/R5 cross-check voice. (winner !== undefined
    // guarantees the non-null assertion below is safe.)
    const candidate =
      primary !== undefined
        ? { id, primary, secondary }
        : { id, primary: secondary as MarketSeries, secondary: undefined };
    try {
      resolution = resolveMarket(candidate, prevEntry, runDate);
      notes.push(...resolution.notes);
    } catch (err) {
      resolution = { id, held: true, notes: [...notes, `compute failed: ${errMessage(err)}`] };
    }
    reports.push({
      id,
      usedSource: resolution.entry?.source ?? 'none',
      called,
      held: resolution.held,
      notes,
    });
    resolutions.push(resolution);
  }

  return { resolutions, reports, providerCalls };
}

function providerErrorNote(err: unknown): string {
  if (err instanceof ProviderError) return `${err.provider} failed: ${err.message.replace(/^\[[^\]]+\]\s*/, '')}`;
  return `provider failed: ${errMessage(err)}`;
}

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
