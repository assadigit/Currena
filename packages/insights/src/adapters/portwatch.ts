/**
 * portwatch.ts — gap-closure S4-M4.3 (2026-11-01): the IMF PortWatch daily
 * chokepoint transits. The ArcGIS FeatureServer layer
 * Daily_Chokepoints_Data (verified M4.1, fields + ids + licence read from
 * the provider's own responses — see VERIFIED-SOURCES.md) carries one row
 * per chokepoint per day: n_total, the estimated number of transits.
 *
 * FIVE chokepoints ship. The spec's sixth — Strait of Hormuz
 * (chokepoint6) — was REJECTED at the source in M4.1: the provider's own
 * series collapses in 2026-03 (Feb mean 78.3/day → Mar 3.2/day, n_tanker
 * 59→1) while the other five stay continuous — a source-side AIS tracking
 * gap. Never rebuild it without re-verifying the monthly means against the
 * VERIFIED-SOURCES row.
 *
 * Fetch shape (all verified live 2026-11-01, this session):
 *   where=portid IN ('chokepoint1',…) AND date >= DATE 'YYYY-MM-DD'
 *   outFields=portid,portname,date,n_total · orderByFields=portid,date
 *   resultRecordCount=1000 · resultOffset=<page×1000> · f=json
 *  - `portid = 'x'` (equality) 400s — the IN list is REQUIRED.
 *  - The DateOnly field filters with the DATE 'YYYY-MM-DD' literal.
 *  - maxRecordCount 1000; a full 400-day window × 5 chokepoints ≈ 1950
 *    rows = TWO pages (exceededTransferLimit:true on page 1).
 *  - The host answers 200 WITH AN ERROR BODY ({error:{code:400,…}}) on
 *    its intermittent "Invalid URL" slow-start — the parser fails closed
 *    on that body, never on the HTTP status alone.
 *  - Rapid successive queries trip the 400; pages are separated by a
 *    documented politeness pause (PAGE_PAUSE_MS). One honest attempt per
 *    page (F-11); a failed page fails the whole job — the 10:10/20:10
 *    sweeps heal it within hours, day gate bypassed.
 *  - SLOW from Worker egress (12.5 s first byte in the S1 probe): the
 *    fetch pins its own 30 s timeout — the TIC precedent.
 *
 * Storage (the spec's own design): ONE combined KV key
 * `insights:portwatch:v1` holding the RAW daily n_total series, 400 days
 * per chokepoint (compact [epochDay, n_total] pairs), zod-validated on
 * write AND on read. The per-id history keys (`insights:hist:chokepoint-*`)
 * carry the DERIVED 7-day moving average the cards and charts read.
 *
 * The readings: the card's series IS the 7-day moving average of n_total
 * (transits per day); computeReading derives the standard fields from it
 * and stamps the chokepointCompare block (vs the prior 4-week average and
 * vs the same 7 days a year earlier) for every portwatch-source reading —
 * both venues (Worker rung3 phase + Node inline build) derive identically
 * through the same pure functions.
 *
 * Honest labelling (the spec's demand): PortWatch transits are ESTIMATES
 * from ship-tracking data, revised by the provider; the cards carry the
 * estimate wording and the data date, and the ~7-day publication lag is
 * absorbed by staleAfterDays 14.
 */

import type { IndicatorId, InsightsSourceReport } from '@currena/core';
import { classifySourceError, insightsFetch } from './fetch-policy';
import { epochDay, fromEpochDay, type SeriesPoint } from '../series';
import type { FetchDeps } from './types';

/** The M4.1-verified FeatureServer query endpoint (never an invented one). */
export const PORTWATCH_QUERY_URL =
  'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query';

/** The S1-M1.1 probe measured 12.5 s first byte from Worker egress — the
 *  honest 30 s single-attempt timeout, the TIC precedent (job.ts). */
export const PORTWATCH_TIMEOUT_MS = 30_000;

/** The politeness pause between paged queries — the provider's own
 *  intermittent "Invalid URL" 400 class hits rapid successive queries
 *  (live-observed 2026-11-01, this session: 2 of 3 back-to-back probes
 *  400'd, the third served). A pause, not a retry (F-11 stands). */
export const PORTWATCH_PAGE_PAUSE_MS = 4_000;

/** The server-declared page size (maxRecordCount, the layer metadata). */
export const PORTWATCH_PAGE_SIZE = 1000;

/** How much raw history the combined key keeps, per chokepoint (the
 *  spec's "400 days per chokepoint" — enough for the year-ago comparison
 *  plus the 7-day windows). */
export const PORTWATCH_WINDOW_DAYS = 400;

/**
 * The five shipping chokepoints (M4.1-verified portids + the provider's
 * own names, read from its chokepoints list). Hormuz (chokepoint6) is
 * absent BY DECISION — see the module header.
 */
export interface ChokepointDef {
  /** The provider's own layer id (verified: `portid IN (…)` is the only
   *  working filter form — equality 400s). */
  portid: string;
  /** The indicator id the MA7 series feeds. */
  indicatorId: IndicatorId;
  /** The provider's own portname (the identity check asserts it). */
  portname: string;
}

export const CHOKEPOINT_DEFS: readonly ChokepointDef[] = [
  { portid: 'chokepoint1', indicatorId: 'chokepoint-suez', portname: 'Suez Canal' },
  { portid: 'chokepoint2', indicatorId: 'chokepoint-panama', portname: 'Panama Canal' },
  { portid: 'chokepoint4', indicatorId: 'chokepoint-bab-el-mandeb', portname: 'Bab el-Mandeb Strait' },
  { portid: 'chokepoint5', indicatorId: 'chokepoint-malacca', portname: 'Malacca Strait' },
  { portid: 'chokepoint11', indicatorId: 'chokepoint-taiwan', portname: 'Taiwan Strait' },
];

/** The ids this source owns (the carry/history-exclusion family — the
 *  RUNG4_IDS discipline, applied to the rung3 slot). */
export const PORTWATCH_IDS: readonly IndicatorId[] = CHOKEPOINT_DEFS.map((c) => c.indicatorId);

const PORTID_SET: ReadonlySet<string> = new Set(CHOKEPOINT_DEFS.map((c) => c.portid));
const PORTNAME_BY_ID: ReadonlyMap<string, string> = new Map(
  CHOKEPOINT_DEFS.map((c) => [c.portid, c.portname] as const),
);
const DEF_BY_INDICATOR: ReadonlyMap<string, ChokepointDef> = new Map(
  CHOKEPOINT_DEFS.map((c) => [c.indicatorId, c] as const),
);

/** A plausible daily transit count for any maritime strait — the observed
 *  five-chokepoint range is 13–401/day (Taiwan's 2026 spike); 2000 is a
 *  generous fail-closed ceiling (Malacca, the busiest, tops out < 300). */
const N_TOTAL_MAX = 2_000;

/* ------------------------------------------------------------------ *
 * The query + the page parser (pure, fail closed)
 * ------------------------------------------------------------------ */

/** Build the batched query URL for one page (the M4.1-verified shape). */
export function portwatchQueryUrl(fromDate: string, offset: number): string {
  const where = `portid IN (${CHOKEPOINT_DEFS.map((c) => `'${c.portid}'`).join(',')}) AND date >= DATE '${fromDate}'`;
  const params = new URLSearchParams({
    where,
    outFields: 'portid,portname,date,n_total',
    orderByFields: 'portid,date',
    resultRecordCount: String(PORTWATCH_PAGE_SIZE),
    resultOffset: String(offset),
    returnGeometry: 'false',
    f: 'json',
  });
  return `${PORTWATCH_QUERY_URL}?${params.toString()}`;
}

/** One parsed page: the rows (all chokepoints merged) + whether more pages exist. */
export interface PortwatchPage {
  rows: PortwatchRow[];
  /** exceededTransferLimit — another page follows. */
  more: boolean;
}

/** One provider row: a chokepoint's transit estimate for one day. */
export interface PortwatchRow {
  portid: string;
  date: string;
  nTotal: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse ONE page's JSON body. Fail closed on: an error body (the host's
 * 200-with-error class), a missing features array, an unknown portid, a
 *  renamed portname (the identity check), a malformed date, a non-integer
 * or implausible n_total. A silent misparse is worse than a missing card.
 */
export function parsePortwatchPage(text: string): PortwatchPage {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('PortWatch query: body is not JSON');
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('PortWatch query: body is not an object');
  }
  const body = raw as { error?: unknown; features?: unknown };
  // The host answers HTTP 200 with {error:{code:400,message:'Invalid URL'}}
  // on its intermittent slow-start — the status line alone is not truth.
  if (body.error !== undefined) {
    const err = body.error as { code?: unknown; message?: unknown };
    throw new Error(
      `PortWatch query: the provider returned an error body (code ${String(err.code)}: ${String(err.message)}) — single attempt, no retry (F-11)`,
    );
  }
  if (!Array.isArray(body.features)) {
    throw new Error('PortWatch query: no features array (layout change?)');
  }
  const rows: PortwatchRow[] = [];
  for (const feature of body.features) {
    if (typeof feature !== 'object' || feature === null) {
      throw new Error('PortWatch query: a feature is not an object');
    }
    const attrs = (feature as { attributes?: unknown }).attributes;
    if (typeof attrs !== 'object' || attrs === null) {
      throw new Error('PortWatch query: a feature has no attributes');
    }
    const { portid, portname, date, n_total } = attrs as Record<string, unknown>;
    if (typeof portid !== 'string' || !PORTID_SET.has(portid)) {
      throw new Error(`PortWatch query: unknown portid ${JSON.stringify(portid)} (layer change?)`);
    }
    // The identity check: the provider's own name for the portid.
    if (portname !== PORTNAME_BY_ID.get(portid)) {
      throw new Error(
        `PortWatch query: portname for ${portid} changed — expected "${PORTNAME_BY_ID.get(portid)}", got "${String(portname)}"`,
      );
    }
    if (typeof date !== 'string' || !DATE_RE.test(date)) {
      throw new Error(`PortWatch query: malformed date ${JSON.stringify(date)}`);
    }
    if (typeof n_total !== 'number' || !Number.isInteger(n_total) || n_total < 0 || n_total > N_TOTAL_MAX) {
      throw new Error(`PortWatch query: implausible n_total ${String(n_total)} for ${portid} @ ${date}`);
    }
    rows.push({ portid, date, nTotal: n_total });
  }
  const more = (raw as { exceededTransferLimit?: unknown }).exceededTransferLimit === true;
  return { rows, more };
}

/* ------------------------------------------------------------------ *
 * The combined history file (ONE KV key, zod-validated both ways)
 * ------------------------------------------------------------------ */

import { z } from 'zod';

/** The combined key: raw daily transits for every chokepoint (the spec's design). */
export const PORTWATCH_KV_KEY = 'insights:portwatch:v1';

const PortwatchDaysSchema = z.array(z.tuple([z.number().int(), z.number().int().min(0).max(N_TOTAL_MAX)]));

export const PortwatchHistorySchema = z.object({
  v: z.literal(1),
  /** When this file was written (ISO datetime). */
  fetchedAt: z.iso.datetime(),
  /** The query endpoint the data came from (display/audit only). */
  sourceUrl: z.string().min(1),
  chokepoints: z
    .array(
      z.object({
        portid: z.string().min(1),
        portname: z.string().min(1),
        /** Ascending [epochDay, n_total] pairs. */
        days: PortwatchDaysSchema,
      }),
    )
    .min(1)
    .max(32),
});

export type PortwatchHistoryFile = z.infer<typeof PortwatchHistorySchema>;

/** Structural KV surface (env.RATES satisfies it; tests mock it). */
export interface PortwatchKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

/** Read the stored combined history (poisoned entries degrade to absent). */
export function parseStoredPortwatch(raw: string | null | undefined): PortwatchHistoryFile | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    return PortwatchHistorySchema.parse(JSON.parse(raw));
  } catch {
    console.warn(`[portwatch] ${PORTWATCH_KV_KEY} failed validation — ignoring stored value`);
    return undefined;
  }
}

/* ------------------------------------------------------------------ *
 * The pure derivations
 * ------------------------------------------------------------------ */

/** The per-chokepoint raw series as SeriesPoint[] (ascending). */
export function rawSeriesOf(file: PortwatchHistoryFile, portid: string): SeriesPoint[] {
  const entry = file.chokepoints.find((c) => c.portid === portid);
  if (entry === undefined) return [];
  return entry.days.map(([day, n]) => ({ date: fromEpochDay(day), value: n }));
}

/**
 * Merge stored + fetched rows per chokepoint (the fetched row wins a date
 * collision — the provider's revision), trim to the trailing 400-day
 * window, and rebuild the combined file. Pure.
 */
export function mergePortwatchHistory(
  stored: PortwatchHistoryFile | undefined,
  fetched: readonly PortwatchRow[],
  now: Date,
): PortwatchHistoryFile {
  const todayDay = Math.floor(now.getTime() / 86_400_000);
  const minDay = todayDay - (PORTWATCH_WINDOW_DAYS - 1);
  const chokepoints = CHOKEPOINT_DEFS.map((def) => {
    const byDate = new Map<number, number>();
    const storedEntry = stored?.chokepoints.find((c) => c.portid === def.portid);
    if (storedEntry !== undefined) {
      for (const [day, n] of storedEntry.days) {
        if (day >= minDay) byDate.set(day, n);
      }
    }
    for (const row of fetched) {
      if (row.portid !== def.portid) continue;
      const day = epochDay(row.date);
      if (day >= minDay) byDate.set(day, row.nTotal);
    }
    const days = [...byDate.entries()].sort((a, b) => a[0] - b[0]);
    return { portid: def.portid, portname: def.portname, days };
  });
  return {
    v: 1,
    fetchedAt: now.toISOString(),
    sourceUrl: PORTWATCH_QUERY_URL,
    chokepoints,
  };
}

/** The number of raw days a chokepoint's history carries (bootstrap probe). */
export function portwatchDayCount(file: PortwatchHistoryFile | undefined, portid: string): number {
  return file?.chokepoints.find((c) => c.portid === portid)?.days.length ?? 0;
}

/**
 * The 7-day moving average of the RAW daily series (the card's own
 * series): at each day with all 7 calendar days present (d−6…d), the mean
 * of those n_total values, rounded to 1 dp. Days with an incomplete
 * window (gaps, or the file's first days) carry no MA7 point — never a
 * partial average presented as the 7-day number.
 */
export function ma7Series(raw: readonly SeriesPoint[]): SeriesPoint[] {
  const byDay = new Map<number, number>();
  for (const p of raw) byDay.set(epochDay(p.date), p.value);
  const out: SeriesPoint[] = [];
  const days = [...byDay.keys()].sort((a, b) => a - b);
  for (const day of days) {
    let sum = 0;
    let complete = true;
    for (let k = 6; k >= 0; k--) {
      const v = byDay.get(day - k);
      if (v === undefined) {
        complete = false;
        break;
      }
      sum += v;
    }
    if (complete) {
      out.push({ date: fromEpochDay(day), value: Math.round((sum / 7) * 10) / 10 });
    }
  }
  return out;
}

/**
 * Derive every chokepoint's indicator series (the MA7) from the combined
 * history — the shared pure derivation BOTH venues run (the venues cannot
 * drift). A chokepoint with too little raw data simply omits its series
 * (the reading carries; never a partial guess).
 */
export function derivePortwatchIndicatorSeries(
  file: PortwatchHistoryFile | undefined,
): Partial<Record<IndicatorId, SeriesPoint[]>> {
  const out: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
  if (file === undefined) return out;
  for (const def of CHOKEPOINT_DEFS) {
    const ma7 = ma7Series(rawSeriesOf(file, def.portid));
    if (ma7.length > 0) out[def.indicatorId] = ma7;
  }
  return out;
}

/** The prior 4-week mean for the chokepointCompare block: the mean MA7
 *  over the 28 days ending 7 days before the latest point ([−34d, −7d] —
 *  the four weeks that immediately precede the latest point's own 7-day
 *  window). Requires at least 14 of the 28 days present (half the window
 *  — fewer is not a 4-week average); undefined otherwise. */
export function priorFourWeekMean(ma7: readonly SeriesPoint[]): number | undefined {
  if (ma7.length === 0) return undefined;
  const latest = ma7[ma7.length - 1]!;
  const latestDay = epochDay(latest.date);
  let sum = 0;
  let count = 0;
  const byDay = new Map<number, number>(ma7.map((p) => [epochDay(p.date), p.value]));
  for (let day = latestDay - 34; day <= latestDay - 7; day++) {
    const v = byDay.get(day);
    if (v !== undefined) {
      sum += v;
      count += 1;
    }
  }
  if (count < 14) return undefined;
  return sum / count;
}

/** The year-ago MA7 for the chokepointCompare block: the MA7 value at the
 *  closest point within ±7 days of 364 days before the latest point (52
 *  weeks — same weekday alignment). undefined when the base is too short. */
export function yearAgoMa7(ma7: readonly SeriesPoint[]): number | undefined {
  if (ma7.length === 0) return undefined;
  const latest = ma7[ma7.length - 1]!;
  const target = epochDay(latest.date) - 364;
  let best: number | undefined;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const p of ma7) {
    const dist = Math.abs(epochDay(p.date) - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = p.value;
    }
  }
  return bestDist <= 7 ? best : undefined;
}

/** The reading's chokepointCompare block (pure; the scoring engine stamps
 *  it for every portwatch-source reading from its own series). */
export function buildChokepointCompare(
  ma7: readonly SeriesPoint[],
): { vsPrior4w: number; vsYearAgo?: number } | undefined {
  const prior = priorFourWeekMean(ma7);
  if (prior === undefined || ma7.length === 0) return undefined;
  const latest = ma7[ma7.length - 1]!;
  const compare: { vsPrior4w: number; vsYearAgo?: number } = {
    vsPrior4w: Math.round((latest.value - prior) * 10) / 10,
  };
  const yearAgo = yearAgoMa7(ma7);
  if (yearAgo !== undefined) {
    compare.vsYearAgo = Math.round((latest.value - yearAgo) * 10) / 10;
  }
  return compare;
}

/** The ChokepointDef for an indicator id (the scoring engine's lookup). */
export function chokepointDefFor(indicatorId: string): ChokepointDef | undefined {
  return DEF_BY_INDICATOR.get(indicatorId);
}

/* ------------------------------------------------------------------ *
 * The collection (paged, single attempt per page)
 * ------------------------------------------------------------------ */

export interface PortwatchCollectResult {
  /** Every fetched row (all chokepoints, all pages). */
  rows: PortwatchRow[];
  /** Per-page outcome rows (appended to insights:status). */
  reports: InsightsSourceReport[];
  /** The page count actually fetched (the budget's honest record). */
  pages: number;
}

export interface PortwatchCollectDeps extends FetchDeps {
  now?: Date;
  /** Pause between pages (tests pass 0). Default PORTWATCH_PAGE_PAUSE_MS. */
  pagePauseMs?: number;
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch the provider rows for every chokepoint from `fromDate` onward,
 * paging until the server says the transfer is complete (single honest
 * attempt per page; a failing page fails the whole collection — the
 * sweeps heal within hours). MAX 3 pages by budget (the 400-day window is
 * ~1950 rows = 2 pages; the guard is a loud configuration error, never a
 * silent runaway).
 */
export async function collectPortwatchRows(
  fromDate: string,
  deps: PortwatchCollectDeps = {},
): Promise<PortwatchCollectResult> {
  const reports: InsightsSourceReport[] = [];
  const rows: PortwatchRow[] = [];
  const pause = deps.pagePauseMs ?? PORTWATCH_PAGE_PAUSE_MS;
  const MAX_PAGES = 3;
  let pages = 0;
  let offset = 0;
  let more = true;
  while (more && pages < MAX_PAGES) {
    if (pages > 0 && pause > 0) await sleep(pause);
    const url = portwatchQueryUrl(fromDate, offset);
    try {
      const res = await insightsFetch(url, {}, { fetchImpl: deps.fetchImpl, timeoutMs: deps.timeoutMs ?? PORTWATCH_TIMEOUT_MS });
      const page = parsePortwatchPage(await res.text());
      rows.push(...page.rows);
      more = page.more;
      pages += 1;
      offset += PORTWATCH_PAGE_SIZE;
    } catch (err) {
      reports.push({
        source: 'portwatch',
        ok: false,
        detail: `PortWatch page ${pages + 1} (from ${fromDate}): ${errMessage(err)}`,
        kind: classifySourceError(err),
      });
      return { rows: [], reports, pages };
    }
  }
  if (more) {
    reports.push({
      source: 'portwatch',
      ok: false,
      detail: `PortWatch: still more pages after ${pages} (window ${fromDate} is too wide for the ${MAX_PAGES}-page budget)`,
      kind: 'failed',
    });
    return { rows: [], reports, pages };
  }
  reports.push({
    source: 'portwatch',
    ok: true,
    detail: `PortWatch: ${rows.length} rows over ${pages} page(s) from ${fromDate} (${CHOKEPOINT_DEFS.length} chokepoints)`,
    kind: 'fetched',
  });
  return { rows, reports, pages };
}

/**
 * The Node venue's inline collection: the FULL 400-day window in one call
 * (no subrequest ceiling there), deriving the indicator series directly.
 * The Worker's rung3 phase uses collectPortwatchRows itself with a narrower
 * window (see runInsightsPortwatchPhase).
 */
export async function collectPortwatch(
  deps: PortwatchCollectDeps = {},
): Promise<{ series: Partial<Record<IndicatorId, SeriesPoint[]>>; reports: InsightsSourceReport[] }> {
  const now = deps.now ?? new Date();
  const fromDate = fromEpochDay(Math.floor(now.getTime() / 86_400_000) - (PORTWATCH_WINDOW_DAYS - 1));
  const collected = await collectPortwatchRows(fromDate, deps);
  if (collected.rows.length === 0) {
    return { series: {}, reports: collected.reports };
  }
  const file = mergePortwatchHistory(undefined, collected.rows, now);
  return { series: derivePortwatchIndicatorSeries(file), reports: collected.reports };
}
