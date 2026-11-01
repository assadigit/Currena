/**
 * credit.ts — gap-closure S3-M3.3 (2026-11-01): the credit-stress pair —
 * the Federal Reserve Board's Excess Bond Premium (EBP) monthly CSV and
 * the U.S. Treasury OFR Financial Stress Index daily CSV. Both hosts were
 * egress-verified in S1-M1.1 (FAST: ~270 ms / ~1.2 s) and the files were
 * mapped in M3.1 (VERIFIED-SOURCES.md); both are L0 public-domain class
 * (17 U.S.C. § 105 — US federal government works, the us-tic precedent).
 *
 * The two files ride the rung4 04:35 slot as TWO extra sources
 * ('frb-ebp', Saturday re-check for the monthly file; 'ofr-fsi', daily)
 * — each with its own phase call (runInsightsCreditPhase in ingest/run.ts)
 * so a failing file never touches the other, the S3 FRED groups, or the
 * TIC tables. The Node venue (packages/insights/scripts/ingest.ts) runs
 * the SAME collection inline (collectCreditSources) — the rung-2
 * discipline: the venues cannot drift.
 *
 * Purity discipline: the parsers are pure and fail closed on shape
 * (exact header text, column count, numeric values, strict ascending
 * dates — an upstream layout change throws loudly, never renders
 * garbage). NO magnitude bands: both series are spreads/indexes that can
 * honestly sit anywhere near zero (the M3.2 no-invented-bounds lesson);
 * finiteness + shape carry the honesty load.
 */

import type { InsightsSourceReport } from '@currena/core';
import { classifySourceError, insightsFetch } from './fetch-policy';
import { fredDecadeFrom } from './fred';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

/** The Fed Board's EBP file (M3.1-verified URL — never an invented one). */
export const EBP_CSV_URL = 'https://www.federalreserve.gov/econres/notes/feds-notes/ebp_csv.csv';

/** The OFR FSI file (DISCOVERED in M3.1; the old index.csv 404 is dead). */
export const OFR_FSI_CSV_URL = 'https://www.financialresearch.gov/financial-stress-index/data/fsi.csv';

/** The EBP file's exact documented header (M3.1, read from the provider). */
const EBP_HEADER = 'date,gz_spread,ebp,est_prob' as const;

/** The OFR FSI file's exact documented 10 columns (M3.1). */
const OFR_HEADER =
  'Date,OFR FSI,Credit,Equity valuation,Safe assets,Funding,Volatility,United States,Other advanced economies,Emerging markets' as const;

/** Strict ISO calendar date (the fixture files' own stamp format). */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Split a CSV body into trimmed non-empty lines (CRLF tolerant). */
function csvLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Parse the EBP file. Returns the `ebp` column ONLY (the excess bond
 * premium; gz_spread and est_prob are the model's other legs — never the
 * card's series). Fail closed on any shape drift.
 */
export function parseEbpCsv(text: string): SeriesPoint[] {
  const lines = csvLines(text);
  if (lines.length === 0) throw new Error('EBP CSV: empty body');
  const header = lines[0]!;
  if (header !== EBP_HEADER) {
    throw new Error(`EBP CSV: header changed — expected "${EBP_HEADER}", got "${header.slice(0, 80)}"`);
  }
  if (lines.length < 3) throw new Error('EBP CSV: no data rows (header only?)');
  const out: SeriesPoint[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(',');
    if (cols.length !== 4) {
      throw new Error(`EBP CSV: expected 4 columns, got ${cols.length} ("${line.slice(0, 60)}")`);
    }
    const date = cols[0]!;
    const ebpRaw = cols[2]!;
    if (!DATE_RE.test(date)) throw new Error(`EBP CSV: malformed date "${date}"`);
    const value = Number(ebpRaw);
    if (!Number.isFinite(value)) throw new Error(`EBP CSV: non-finite ebp value "${ebpRaw}"`);
    if (out.length > 0 && date <= out[out.length - 1]!.date) {
      throw new Error(`EBP CSV: dates must strictly ascend ("${date}" after "${out[out.length - 1]!.date}")`);
    }
    out.push({ date, value });
  }
  return out;
}

/**
 * Parse the OFR FSI file. Returns the AGGREGATE column ("OFR FSI") ONLY —
 * the 5 category + 3 region components stay undocumented-card-free (the
 * spec: "show only what is clearly documented"; the layer-1 copy explains
 * the components in words, the reading is the aggregate). Fail closed on
 * any shape drift.
 */
export function parseOfrFsiCsv(text: string): SeriesPoint[] {
  const lines = csvLines(text);
  if (lines.length === 0) throw new Error('OFR FSI CSV: empty body');
  const header = lines[0]!;
  if (header !== OFR_HEADER) {
    throw new Error(`OFR FSI CSV: header changed — expected 10 documented columns, got "${header.slice(0, 80)}"`);
  }
  if (lines.length < 3) throw new Error('OFR FSI CSV: no data rows (header only?)');
  const out: SeriesPoint[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(',');
    if (cols.length !== 10) {
      throw new Error(`OFR FSI CSV: expected 10 columns, got ${cols.length} ("${line.slice(0, 60)}")`);
    }
    const date = cols[0]!;
    const aggregateRaw = cols[1]!;
    if (!DATE_RE.test(date)) throw new Error(`OFR FSI CSV: malformed date "${date}"`);
    const value = Number(aggregateRaw);
    if (!Number.isFinite(value)) throw new Error(`OFR FSI CSV: non-finite aggregate value "${aggregateRaw}"`);
    if (out.length > 0 && date <= out[out.length - 1]!.date) {
      throw new Error(`OFR FSI CSV: dates must strictly ascend ("${date}" after "${out[out.length - 1]!.date}")`);
    }
    out.push({ date, value });
  }
  return out;
}

/** Fetch deps + the collect clock (the rung4 collect's shape). */
export type CreditCollectDeps = FetchDeps & { now?: Date };

/** Keep only the points at or after `from` (the decade window basis). */
function trimToWindow(series: readonly SeriesPoint[], from: string): SeriesPoint[] {
  return series.filter((p) => p.date >= from);
}

/**
 * Fetch + parse + decade-trim the EBP file (one honest single-attempt
 * fetch; the 12 s default timeout is ample — the host answered ~270 ms in
 * the S1 probe). The trim matches the FRED groups' decade basis so the
 * percentile/history arithmetic stays consistent.
 */
export async function fetchEbpCsv(deps: CreditCollectDeps = {}): Promise<SeriesPoint[]> {
  const now = deps.now ?? new Date();
  const res = await insightsFetch(EBP_CSV_URL, {}, deps);
  const text = new TextDecoder().decode(await res.arrayBuffer());
  return trimToWindow(parseEbpCsv(text), fredDecadeFrom(now));
}

/** Fetch + parse + decade-trim the OFR FSI aggregate (the EBP twin). */
export async function fetchOfrFsiCsv(deps: CreditCollectDeps = {}): Promise<SeriesPoint[]> {
  const now = deps.now ?? new Date();
  const res = await insightsFetch(OFR_FSI_CSV_URL, {}, deps);
  const text = new TextDecoder().decode(await res.arrayBuffer());
  return trimToWindow(parseOfrFsiCsv(text), fredDecadeFrom(now));
}

/** The credit collect's output (the Rung4CollectResult shape's twin). */
export interface CreditCollectResult {
  /** The fetched series (decade-trimmed), fail-closed per file. */
  series: { ebp?: SeriesPoint[]; ofrFsi?: SeriesPoint[] };
  /** Per-file outcome rows (appended to insights:status). */
  reports: InsightsSourceReport[];
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Collect both credit files (fail-soft per file, F-11 single attempt) —
 * the Node venue's inline collection; the Worker's sources call the
 * individual fetchers inside their own phase.
 */
export async function collectCreditSources(deps: CreditCollectDeps = {}): Promise<CreditCollectResult> {
  const reports: InsightsSourceReport[] = [];
  const series: CreditCollectResult['series'] = {};
  try {
    series.ebp = await fetchEbpCsv(deps);
    reports.push({ source: 'frb-ebp', ok: true, detail: `EBP file: ${series.ebp.length} obs (decade window)`, kind: 'fetched' });
  } catch (err) {
    reports.push({ source: 'frb-ebp', ok: false, detail: `EBP file: ${errMessage(err)}`, kind: classifySourceError(err) });
  }
  try {
    series.ofrFsi = await fetchOfrFsiCsv(deps);
    reports.push({
      source: 'ofr-fsi',
      ok: true,
      detail: `OFR FSI file: ${series.ofrFsi.length} obs (decade window)`,
      kind: 'fetched',
    });
  } catch (err) {
    reports.push({ source: 'ofr-fsi', ok: false, detail: `OFR FSI file: ${errMessage(err)}`, kind: classifySourceError(err) });
  }
  return { series, reports };
}
