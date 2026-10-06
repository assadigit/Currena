/**
 * Parsers for the recorded fixture formats (packages/insights/fixtures/) —
 * pure text → {@link SeriesPoint}[]. These are the parse halves of the future
 * I2 adapters; the fetch halves live elsewhere. An upstream layout change must
 * fail loudly (AGENTS.md rule 3): every parser throws with the offending line.
 *
 * Missing-value markers are dropped, never zero-filled: FRED emits '.' and the
 * World Bank sheet uses '…'. A dropped observation simply shortens the series;
 * the scoring engine treats short series honestly (no-history / unavailable).
 */

import type { SeriesPoint } from './series';
import { assertAscending } from './series';

function parseNumber(raw: string, context: string): number {
  const v = Number(raw);
  if (!Number.isFinite(v)) throw new Error(`${context}: value "${raw}" is not a finite number`);
  return v;
}

function isMissing(raw: string): boolean {
  return raw === '' || raw === '.' || raw === '…' || raw === '..' || raw === '-';
}

function assertIsoDate(date: string, context: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new Error(`${context}: "${date}" is not an ISO calendar date`);
  }
}

/* ------------------------------------------------------------------ *
 * FRED fredgraph.csv — "observation_date,<SERIES>" then date,value rows
 * ------------------------------------------------------------------ */

export function parseFredCsv(text: string): SeriesPoint[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2 || !lines[0]!.startsWith('observation_date,')) {
    throw new Error('FRED CSV: unexpected header (expected "observation_date,<SERIES>")');
  }
  const out: SeriesPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    const comma = line.indexOf(',');
    if (comma < 0) throw new Error(`FRED CSV line ${i + 1}: no comma`);
    const date = line.slice(0, comma).trim();
    const raw = line.slice(comma + 1).trim();
    assertIsoDate(date, `FRED CSV line ${i + 1}`);
    if (isMissing(raw)) continue;
    out.push({ date, value: parseNumber(raw, `FRED CSV line ${i + 1}`) });
  }
  assertAscending(out);
  return out;
}

/* ------------------------------------------------------------------ *
 * Frankfurter time series JSON — { rates: { "YYYY-MM-DD": { Ccy: n } } }
 * ------------------------------------------------------------------ */

interface FrankfurterSeries {
  rates: Record<string, Record<string, number>>;
}

export function parseFrankfurterTimeseries(text: string, currency: string): SeriesPoint[] {
  let parsed: FrankfurterSeries;
  try {
    parsed = JSON.parse(text) as FrankfurterSeries;
  } catch (e) {
    throw new Error(`Frankfurter: response is not JSON (${(e as Error).message})`);
  }
  if (parsed.rates === null || typeof parsed.rates !== 'object') {
    throw new Error('Frankfurter: no "rates" object in response');
  }
  const out: SeriesPoint[] = [];
  for (const [date, quote] of Object.entries(parsed.rates)) {
    assertIsoDate(date, 'Frankfurter');
    if (quote === null || typeof quote !== 'object') {
      throw new Error(`Frankfurter ${date}: quote is not an object`);
    }
    const value = quote[currency];
    if (value === undefined) continue; // currency absent that day — drop, never guess
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`Frankfurter ${date}: ${currency} value is not a finite number`);
    }
    out.push({ date, value });
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  assertAscending(out);
  return out;
}

/* ------------------------------------------------------------------ *
 * World Bank Pink Sheet monthly CSV — month,gold,silver,copper,… rows
 * (months as YYYYM01..YYYYM12, recorded verbatim from the XLSX sheet)
 * ------------------------------------------------------------------ */

export function parseWorldBankMonthlyCsv(text: string, column: 'gold_usd_toz' | 'silver_usd_toz' | 'copper_usd_mt' | 'iron_ore_usd_dmtu' | 'brent_usd_bbl'): SeriesPoint[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2 || lines[0]!.split(',')[0] !== 'month') {
    throw new Error('World Bank CSV: unexpected header (expected "month,…" columns)');
  }
  const header = lines[0]!.split(',').map((h) => h.trim());
  const col = header.indexOf(column);
  if (col < 0) throw new Error(`World Bank CSV: no column "${column}"`);
  const out: SeriesPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i]!.split(',');
    const month = (cells[0] ?? '').trim();
    const m = /^(\d{4})M(\d{2})$/.exec(month);
    if (!m) throw new Error(`World Bank CSV line ${i + 1}: month "${month}" is not YYYYMnn`);
    const raw = (cells[col] ?? '').trim();
    if (isMissing(raw)) continue;
    // Monthly observations are dated to the 1st of the month (fixture convention).
    out.push({ date: `${m[1]!}-${m[2]!}-01`, value: parseNumber(raw, `World Bank CSV line ${i + 1}`) });
  }
  assertAscending(out);
  return out;
}

/* ------------------------------------------------------------------ *
 * ABS period CSV — quarter ("2004-Q1") or month ("2004-01") + value
 * (recorded from the ABS SDMX CSV API; periods dated to their first day)
 * ------------------------------------------------------------------ */

export function parseAbsPeriodCsv(text: string): SeriesPoint[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) throw new Error('ABS CSV: empty input');
  const out: SeriesPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i]!.split(',');
    const period = (cells[0] ?? '').trim();
    const raw = (cells[1] ?? '').trim();
    const q = /^(\d{4})-Q([1-4])$/.exec(period);
    const mo = /^(\d{4})-(\d{2})$/.exec(period);
    let date: string;
    if (q) {
      date = `${q[1]!}-${String((Number(q[2]) - 1) * 3 + 1).padStart(2, '0')}-01`;
    } else if (mo) {
      date = `${mo[1]!}-${mo[2]!}-01`;
    } else {
      throw new Error(`ABS CSV line ${i + 1}: period "${period}" is neither YYYY-Qn nor YYYY-MM`);
    }
    if (isMissing(raw)) continue;
    out.push({ date, value: parseNumber(raw, `ABS CSV line ${i + 1}`) });
  }
  assertAscending(out);
  return out;
}
