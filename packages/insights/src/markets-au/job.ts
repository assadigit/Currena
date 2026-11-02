/**
 * @currena/insights/markets-au/job — the Australian markets board's fetch
 * job (gap-closure S5-M5.4), shared by the currena-markets Worker's 4th
 * cron and the manual runner scripts.
 *
 * Yahoo-only (the M5.1 probe decision; EODHD's free quota is spent by the
 * world board). One scheduled run:
 *   AU   06:30 UTC Mon–Fri — 30 min after the ASX 16:00 AEST close (06:00
 *        UTC), the F1 session-finality margin the world board's asx200
 *        definition already uses. Fetches every AU market.
 *
 * Per-market fault-isolated: one market's failure never fails the run
 * (R7 — the stored row simply survives). Sequential, with a modest
 * politeness pause between Yahoo calls (the M5.1 probe lesson: rapid
 * back-to-back Yahoo calls can 429; the declared honest UA + a small
 * spacing answers 200 reliably). 18 calls × ~1 s fetch + ~0.3 s pause ≈
 * 23 s wall-clock — under the 30 s scheduled-handler limit; 18 fetches +
 * 1 read + 1 write = 20 subrequests — under the 50 cap.
 */

import type { AuMarketEntry, AuMarketId, AuMarketsSnapshot } from '@currena/core';
import { fromEpochDay, epochDay } from '../series';
import { AuProviderError, fetchAuYahooSeries } from './providers';
import type { AuMarketSeries, AuYahooFetchOptions } from './providers';
import type { AuMarketResolution } from './compute';
import { resolveAuMarket } from './compute';
import { AU_MARKET_IDS, MIN_CLOSES } from './definitions';

/* ------------------------------------------------------------------ *
 * Run shape
 * ------------------------------------------------------------------ */

export type AuMarketRunKind = 'main' | 'retry';

export interface AuMarketJobOptions {
  kind: AuMarketRunKind;
  /** Restrict the run to these AU markets (the retry's failed-or-old set). */
  onlyIds?: readonly AuMarketId[];
}

/** Which AU markets a retry run should re-fetch (failed or look old). */
export function auMarketsNeedingData(
  prev: AuMarketsSnapshot | undefined,
  nowUtcDate: string,
): readonly AuMarketId[] {
  if (prev === undefined) return AU_MARKET_IDS; // first-ever run: everything
  const expected = auLastExpectedCloseDate(nowUtcDate);
  const out: AuMarketId[] = [];
  for (const m of prev.markets) {
    if (m.stale || m.asOf < expected) out.push(m.id);
  }
  for (const id of AU_MARKET_IDS) {
    if (!prev.markets.some((m) => m.id === id)) out.push(id);
  }
  return out;
}

/**
 * The newest close date ANY AU market could carry by now: the most recent
 * Monday–Friday strictly before today's UTC date (the ASX trades Mon–Fri).
 */
export function auLastExpectedCloseDate(nowUtcDate: string): string {
  let day = epochDay(nowUtcDate) - 1;
  while (((day + 3) % 7) >= 5) day -= 1; // 0 = Monday … 5,6 = Sat, Sun
  return fromEpochDay(day);
}

/** The retry run's options derived from the stored snapshot. */
export function auRetryRunOptions(
  prev: AuMarketsSnapshot | undefined,
  nowUtcDate: string,
): AuMarketJobOptions {
  return { kind: 'retry', onlyIds: auMarketsNeedingData(prev, nowUtcDate) };
}

/* ------------------------------------------------------------------ *
 * The job
 * ------------------------------------------------------------------ */

/** Default Yahoo fetcher over the real provider (tests inject fakes). */
export function auDefaultFetcher(yahoo: AuYahooFetchOptions = {}): AuMarketJobFetchers {
  return { fetchYahoo: (id) => fetchAuYahooSeries(id, yahoo) };
}

export interface AuMarketJobFetchers {
  fetchYahoo: (id: AuMarketId) => Promise<AuMarketSeries>;
}

export interface AuMarketJobReport {
  id: AuMarketId;
  /** Which provider produced the winning series ('none' = total failure). */
  usedSource: 'yahoo' | 'none';
  /** Provider calls actually made for this market (budget report). */
  called: Array<'yahoo'>;
  held: boolean;
  notes: string[];
}

export interface AuMarketJobResult {
  resolutions: readonly AuMarketResolution[];
  reports: readonly AuMarketJobReport[];
  providerCalls: { yahoo: number };
}

/** R4 at the fetch level: an answer under MIN_CLOSES closes is a rejection. */
function validateAuSeries(series: AuMarketSeries): AuMarketSeries {
  if (series.points.length < MIN_CLOSES) {
    throw new AuProviderError(
      'yahoo',
      series.id,
      `only ${series.points.length} closes returned (R4 needs ${MIN_CLOSES})`,
    );
  }
  return series;
}

export interface AuMarketJobDeps {
  fetchers?: AuMarketJobFetchers;
  /** Clock (tests). */
  now?: Date;
  /** Politeness pause between Yahoo calls, ms (the M5.1 probe lesson).
   *  Default 300 ms — keeps 18 calls under the 30 s wall-clock budget while
   *  spacing the requests so the declared UA answers 200 reliably. 0 in
   *  tests. */
  politenessMs?: number;
}

export async function runAuMarketsJob(
  deps: AuMarketJobDeps,
  options: AuMarketJobOptions,
  prev: AuMarketsSnapshot | undefined,
  runDate: string,
  runTimeIso?: string,
): Promise<AuMarketJobResult> {
  const fetchers = deps.fetchers ?? auDefaultFetcher();
  const politenessMs = deps.politenessMs ?? 300;
  const prevById = new Map((prev?.markets ?? []).map((m) => [m.id as string, m]));
  const ids = options.onlyIds ?? AU_MARKET_IDS;

  const resolutions: AuMarketResolution[] = [];
  const reports: AuMarketJobReport[] = [];
  const providerCalls = { yahoo: 0 };

  let first = true;
  for (const id of ids) {
    // Politeness pause BEFORE every call except the first (the M5.1 probe
    // lesson — spacing the Yahoo requests so the declared UA answers 200).
    if (!first && politenessMs > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, politenessMs));
    }
    first = false;

    const prevEntry: AuMarketEntry | undefined = prevById.get(id);
    const called: Array<'yahoo'> = [];
    const notes: string[] = [];

    let primary: AuMarketSeries | undefined;
    try {
      called.push('yahoo');
      providerCalls.yahoo++;
      primary = validateAuSeries(await fetchers.fetchYahoo(id));
    } catch (err) {
      notes.push(auProviderErrorNote(err));
    }

    let resolution: AuMarketResolution;
    if (primary === undefined) {
      const failNotes = [...notes, 'Yahoo failed — row held (R7)'];
      resolution = { id, held: true, notes: failNotes };
      reports.push({ id, usedSource: 'none', called, held: true, notes: failNotes });
      resolutions.push(resolution);
      continue;
    }

    try {
      resolution = resolveAuMarket({ id, primary }, prevEntry, runDate, runTimeIso);
      notes.push(...resolution.notes);
    } catch (err) {
      resolution = { id, held: true, notes: [...notes, `compute failed: ${auErrMessage(err)}`] };
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

function auProviderErrorNote(err: unknown): string {
  if (err instanceof AuProviderError) return `yahoo failed: ${err.message.replace(/^\[[^\]]+\]\s*/, '')}`;
  return `provider failed: ${auErrMessage(err)}`;
}

function auErrMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
