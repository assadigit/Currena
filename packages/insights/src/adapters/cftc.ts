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
import { readZipTextEntries } from './zip';
import type { FetchDeps } from './types';

export const CFTC_DEAFUT_URL = 'https://www.cftc.gov/dea/newcot/deafut.txt';

export const CFTC_TIMEOUT_MS = 45_000;

/** The exact gold row name (the MICRO GOLD sibling must never match). */
export const CFTC_GOLD_MARKET = 'GOLD - COMMODITY EXCHANGE INC.';

/** One week's gold positioning: the net-noncommercial share of open
 * interest (percent) + the gross legs (GF-P2, the owner's recorded
 * answer K / §4 row 12 — F2's REAL OBJECT rides the same row). */
export interface CftcGoldPositioning {
  /** The report's Tuesday (ISO). */
  date: string;
  /** (NonComm Long − NonComm Short) ÷ Open Interest × 100 — [-100, 100] by construction. */
  netSharePct: number;
  /** NonComm Long ÷ Open Interest × 100 — the F2 seat's object
   * (cftc-gold-gross-long; [0, 100] by construction). Recorded for the
   * gross-short complement too (the fixture records both legs; only the
   * long share seats — the measured 32-seat composition). */
  grossLongSharePct: number;
  /** NonComm Short ÷ Open Interest × 100 — the F2 design's recorded complement (never seated). */
  grossShortSharePct: number;
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
    const grossLongSharePct = (long / oi) * 100;
    const grossShortSharePct = (short / oi) * 100;
    if (grossLongSharePct < 0 || grossLongSharePct > 100 || grossShortSharePct < 0 || grossShortSharePct > 100) {
      throw new FormatChangedError(
        `CFTC deafut: the gross shares ${grossLongSharePct.toFixed(2)}%/${grossShortSharePct.toFixed(2)}% fall outside [0, 100] (wrong fields?)`,
      );
    }
    return {
      date,
      netSharePct: Math.round(netSharePct * 1e4) / 1e4,
      grossLongSharePct: Math.round(grossLongSharePct * 1e4) / 1e4,
      grossShortSharePct: Math.round(grossShortSharePct * 1e4) / 1e4,
      openInterest: oi,
    };
  }
  throw new FormatChangedError(`CFTC deafut: no "${CFTC_GOLD_MARKET}" row in the file (retired or renamed?)`);
}

/** Fetch + parse the weekly file's gold positioning. */
export async function fetchCftcGoldPositioning(deps: FetchDeps = {}): Promise<CftcGoldPositioning> {
  const res = await insightsFetch(CFTC_DEAFUT_URL, {}, { ...deps, timeoutMs: deps.timeoutMs ?? CFTC_TIMEOUT_MS });
  return parseCftcGoldPositioning(await res.text());
}

/* ------------------------------------------------------------------ *
 * GF-P1 (2026-11-05, the owner's recorded go — the D-4/F1 repair, the
 * audit report §4 row 5): the CFTC legacy futures-only HISTORICAL
 * archive — the same site's annual long-format files
 * (dea/history/deacot<year>.zip, annual.txt), whose gold rows carry
 * EXACTLY the current deafut.txt's column layout (verified 2026-11-05:
 * the 2026 file's gold row @ 2026-10-27 is identical to the then-current
 * deafut.txt's). The parse mirrors parseCftcGoldPositioning's own
 * assertions row-for-row (the arithmetic identity, finite fields,
 * OI > 0, the share band) — the GF-P0 recorder
 * (scripts/gf-p0-record-candidates.ts) validated 565 gold weeks
 * 2016-01-05 → 2026-10-27 with 0 failures before this parse moved into
 * production; the calibration measured the backfilled seat's firing
 * statistics over it (evidence/gf-p0-calibration-2026-11-05.md §5–§6).
 * Licence: the same public-domain federal work as the weekly file.
 * ------------------------------------------------------------------ */

/** One annual archive file: dea/history/deacot<year>.zip. */
export const cftcArchiveUrl = (year: number): string => `https://www.cftc.gov/files/dea/history/deacot${year}.zip`;

/** The archive fetch timeout (the zips are a few MB — slower than the weekly file). */
export const CFTC_ARCHIVE_TIMEOUT_MS = 90_000;

/** One archive year's outcome (the honest per-file report row). */
export interface CftcArchiveYear {
  year: number;
  url: string;
  weeks: CftcGoldPositioning[];
  bytes: number;
}

/**
 * Parse one annual.txt body (the LONG format: a header row, then the
 * quoted market name + the SAME field layout the current deafut.txt
 * carries after the name). Pure — fixture-testable; throws loudly on a
 * layout change (never silently skips a row).
 */
export function parseCftcGoldArchiveAnnual(text: string): CftcGoldPositioning[] {
  const out: CftcGoldPositioning[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    if (trimmed.startsWith('"Market and Exchange Names"')) continue; // the header row
    const nameMatch = /^"([^"]*)"/.exec(trimmed);
    if (nameMatch === null || nameMatch[1] !== CFTC_GOLD_MARKET) continue;
    const rest = trimmed.slice(nameMatch[0].length);
    const fields = rest.split(',');
    // The quoted-name prefix leaves a leading empty field — drop it so the
    // map starts at the YYMMDD date (the production parse's own rule).
    if (fields[0] !== undefined && fields[0]!.trim() === '') fields.shift();
    if (fields.length < 14) {
      throw new FormatChangedError(`CFTC annual: the gold row carries ${fields.length} fields (expected ≥14 — layout change?)`);
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
      throw new FormatChangedError(`CFTC annual: the gold row @ ${date ?? '?'} carries a non-numeric field (layout change?)`);
    }
    // The file's own arithmetic identity (the production parse's strongest
    // assertion — proves the column map on every row).
    if (long + spread + commLong !== totLong || short + spread + commShort !== totShort) {
      throw new FormatChangedError(
        `CFTC annual: the gold row @ ${date} fails the reportable-positions identity (layout change?)`,
      );
    }
    if (oi <= 0) throw new FormatChangedError(`CFTC annual: the gold row @ ${date} — open interest ${oi} (layout change?)`);
    const netSharePct = ((long - short) / oi) * 100;
    if (netSharePct < -100 || netSharePct > 100) {
      throw new FormatChangedError(
        `CFTC annual: the net share ${netSharePct.toFixed(2)}% @ ${date} falls outside [-100, 100] (wrong fields?)`,
      );
    }
    const grossLongSharePct = (long / oi) * 100;
    const grossShortSharePct = (short / oi) * 100;
    if (grossLongSharePct < 0 || grossLongSharePct > 100 || grossShortSharePct < 0 || grossShortSharePct > 100) {
      throw new FormatChangedError(
        `CFTC annual: the gross shares ${grossLongSharePct.toFixed(2)}%/${grossShortSharePct.toFixed(2)}% @ ${date} fall outside [0, 100] (wrong fields?)`,
      );
    }
    out.push({
      date,
      netSharePct: Math.round(netSharePct * 1e4) / 1e4,
      grossLongSharePct: Math.round(grossLongSharePct * 1e4) / 1e4,
      grossShortSharePct: Math.round(grossShortSharePct * 1e4) / 1e4,
      openInterest: oi,
    });
  }
  return out;
}

/**
 * Fetch + parse one archive year's zip → its gold weeks (fails loudly per
 * year; the caller discloses failures, never silently skips).
 */
export async function fetchCftcGoldArchiveYear(year: number, deps: FetchDeps = {}): Promise<CftcArchiveYear> {
  const url = cftcArchiveUrl(year);
  const res = await insightsFetch(url, {}, { ...deps, timeoutMs: deps.timeoutMs ?? CFTC_ARCHIVE_TIMEOUT_MS });
  const bytes = new Uint8Array(await res.arrayBuffer());
  const entries = await readZipTextEntries(bytes);
  const annual = entries.get('annual.txt');
  if (annual === undefined) {
    throw new FormatChangedError(`CFTC archive ${year}: the zip carries no annual.txt (entries: ${[...entries.keys()].join(', ')})`);
  }
  const weeks = parseCftcGoldArchiveAnnual(annual);
  if (weeks.length === 0) {
    throw new FormatChangedError(`CFTC archive ${year}: no parsable gold rows (retired or renamed?)`);
  }
  return { year, url, weeks, bytes: bytes.byteLength };
}
