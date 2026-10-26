/**
 * cftc.ts — the A-7 adapter (2026-10-26 gap-audit build): the CFTC's
 * weekly futures-only Commitments of Traders file (dea/newcot/deafut.txt,
 * verified live 200), fetched on the Saturday rung-2 phase.
 *
 * Metric (the spec): the NET NON-COMMERCIAL position as a share of OPEN
 * INTEREST, in percent — the crowded-positioning gauge for the gold card.
 * The file is the classic headerless comma format: a QUOTED market name
 * (which may contain commas!) then the numeric fields; GOLD is the exact
 * row "GOLD - COMMODITY EXCHANGE INC." (contract 088691 — the MICRO GOLD
 * sibling row must never be mistaken for it). The parse ASSERTS the
 * file's own arithmetic identity (NonComm Long + Spread + Commercial Long
 * = Total Reportable Long) before trusting a number, and the metric is
 * bounded [-100, 100] by construction.
 *
 * One weekly point per fetch — the file carries only the latest week;
 * the series accumulates in the stored history (each Saturday appends).
 * The same file can later serve the oil and dollar legs at zero extra
 * fetch cost (the spec's noted future).
 *
 * Licence: U.S. federal government work — public domain (17 U.S.C. §105).
 * Attribution: "Source: U.S. Commodity Futures Trading Commission".
 */

import { insightsFetch, FormatChangedError } from './fetch-policy';
import type { FetchDeps } from './types';

export const CFTC_DEAFUT_URL = 'https://www.cftc.gov/dea/newcot/deafut.txt';

export const CFTC_TIMEOUT_MS = 45_000;

/** The exact gold row name (the MICRO GOLD sibling must never match). */
export const CFTC_GOLD_MARKET = 'GOLD - COMMODITY EXCHANGE INC.';

/** One week's gold positioning: the net-noncommercial share of open interest (percent). */
export interface CftcGoldPositioning {
  /** The report's Tuesday (ISO). */
  date: string;
  /** (NonComm Long − NonComm Short) ÷ Open Interest × 100 — [-100, 100] by construction. */
  netSharePct: number;
  /** The raw open interest (contracts) — the report row's own field. */
  openInterest: number;
}

/** The row's field positions after the quoted name (verified against the live file 2026-10-26). */
const COL = {
  yymmdd: 0,
  isoDate: 1,
  openInterest: 6,
  nonCommLong: 7,
  nonCommShort: 8,
  nonCommSpread: 9,
  commLong: 10,
  commShort: 11,
  totRepLong: 12,
  totRepShort: 13,
} as const;

/** The ISO date field ("2026-10-20") or the YYMMDD field as a fallback. */
function isoOf(fields: string[]): string | undefined {
  const iso = (fields[COL.isoDate] ?? '').trim().replace(/"/g, '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const ymd = (fields[COL.yymmdd] ?? '').trim();
  const m = /^(\d{2})(\d{2})(\d{2})$/.exec(ymd);
  if (!m) return undefined;
  const [, yy, mm, dd] = m;
  return `20${yy}-${mm}-${dd}`;
}

/**
 * Parse the deafut.txt body for the gold row (pure — fixture-testable).
 * Throws loudly when the row is absent, the arithmetic identity fails, or
 * the metric lands outside its definitional band.
 */
export function parseCftcGoldPositioning(text: string): CftcGoldPositioning {
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    const nameMatch = /^"([^"]*)"/.exec(trimmed);
    if (nameMatch === null || nameMatch[1] !== CFTC_GOLD_MARKET) continue;
    const rest = trimmed.slice(nameMatch[0].length);
    const fields = rest.split(',');
    // The quoted-name prefix leaves a leading empty field (the text between
    // the closing quote and the first comma) — drop it so the field map
    // starts at the YYMMDD date, exactly as the column layout documents.
    if (fields[0] !== undefined && fields[0]!.trim() === '') fields.shift();
    if (fields.length < 15) {
      throw new FormatChangedError(`CFTC deafut: the gold row carries ${fields.length} fields after the name (expected ≥15 — layout change?)`);
    }
    const date = isoOf(fields);
    const oi = Number(fields[COL.openInterest]!.trim());
    const long = Number(fields[COL.nonCommLong]!.trim());
    const short = Number(fields[COL.nonCommShort]!.trim());
    const spread = Number(fields[COL.nonCommSpread]!.trim());
    const commLong = Number(fields[COL.commLong]!.trim());
    const commShort = Number(fields[COL.commShort]!.trim());
    const totLong = Number(fields[COL.totRepLong]!.trim());
    const totShort = Number(fields[COL.totRepShort]!.trim());
    const numbers = [oi, long, short, spread, commLong, commShort, totLong, totShort];
    if (date === undefined || numbers.some((n) => !Number.isFinite(n))) {
      throw new FormatChangedError('CFTC deafut: the gold row carries a non-numeric field (layout change?)');
    }
    // The file's own arithmetic identity (verified live 2026-10-20:
    // 237,142 + 54,199 + 59,531 = 350,872 = Total Reportable Long) — the
    // strongest format assertion available, and it proves the column map.
    if (long + spread + commLong !== totLong || short + spread + commShort !== totShort) {
      throw new FormatChangedError(
        'CFTC deafut: the gold row fails the reportable-positions identity (column layout change?)',
      );
    }
    if (oi <= 0) {
      throw new FormatChangedError(`CFTC deafut: the gold row's open interest is ${oi} (layout change?)`);
    }
    const netSharePct = ((long - short) / oi) * 100;
    if (netSharePct < -100 || netSharePct > 100) {
      throw new FormatChangedError(
        `CFTC deafut: the net share ${netSharePct.toFixed(2)}% falls outside [-100, 100] (wrong fields?)`,
      );
    }
    return { date, netSharePct: Math.round(netSharePct * 1e4) / 1e4, openInterest: oi };
  }
  throw new FormatChangedError(`CFTC deafut: no "${CFTC_GOLD_MARKET}" row in the file (retired or renamed?)`);
}

/** Fetch + parse the weekly file's gold positioning. */
export async function fetchCftcGoldPositioning(deps: FetchDeps = {}): Promise<CftcGoldPositioning> {
  const res = await insightsFetch(CFTC_DEAFUT_URL, {}, { ...deps, timeoutMs: deps.timeoutMs ?? CFTC_TIMEOUT_MS });
  return parseCftcGoldPositioning(await res.text());
}
