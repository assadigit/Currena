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
 * ABS SDMX data CSV — the live Data API response format (Phase I2):
 * a DATAFLOW header row whose column ORDER VARIES BY FLOW (the CPI flow
 * carries INDEX/DECIMALS/BASE_PERIOD, LF carries SEX/AGE, RES_DWELL_ST
 * only MEASURE/REGION), then one row per observation. Columns are located
 * BY NAME; TIME_PERIOD is YYYY-Qn or YYYY-MM; the API is observed to
 * return rows OUT OF ORDER (ANA_AGG probe 2026-10-06), so rows are sorted
 * by period before the ascending assertion.
 * ------------------------------------------------------------------ */

export function parseAbsSdmxCsv(text: string): SeriesPoint[] {
  const stripped = text.startsWith('\uFEFF') ? text.slice(1) : text;
  const lines = stripped.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) throw new Error('ABS SDMX CSV: empty input');
  const header = lines[0]!.split(',').map((h) => h.trim());
  const timeCol = header.indexOf('TIME_PERIOD');
  const valueCol = header.indexOf('OBS_VALUE');
  if (timeCol < 0) throw new Error(`ABS SDMX CSV: no TIME_PERIOD column (header: ${header.join(',')})`);
  if (valueCol < 0) throw new Error(`ABS SDMX CSV: no OBS_VALUE column (header: ${header.join(',')})`);
  if (header.indexOf('DATAFLOW') < 0) {
    throw new Error(`ABS SDMX CSV: no DATAFLOW column — not an ABS data response (header: ${header.join(',')})`);
  }
  const out: SeriesPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i]!.split(',');
    const period = (cells[timeCol] ?? '').trim();
    const raw = (cells[valueCol] ?? '').trim();
    const q = /^(\d{4})-Q([1-4])$/.exec(period);
    const mo = /^(\d{4})-(\d{2})$/.exec(period);
    let date: string;
    if (q) {
      date = `${q[1]!}-${String((Number(q[2]) - 1) * 3 + 1).padStart(2, '0')}-01`;
    } else if (mo) {
      date = `${mo[1]!}-${mo[2]!}-01`;
    } else {
      throw new Error(`ABS SDMX CSV line ${i + 1}: period "${period}" is neither YYYY-Qn nor YYYY-MM`);
    }
    if (isMissing(raw)) continue; // not-yet-published observation (blank OBS_VALUE)
    out.push({ date, value: parseNumber(raw, `ABS SDMX CSV line ${i + 1}`) });
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
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

/* ------------------------------------------------------------------ *
 * ECB Data Portal CSV (`format=csvdata`) — the FM DFR series the ecb-dfr
 * indicator consumes (I15, data spec §3). Wide CSV: many SDMX columns,
 * but the two we need are header-located: TIME_PERIOD (YYYY-MM-DD) and
 * OBS_VALUE. Rows are unordered (checked live 2026-10-08) — sorted here.
 * ------------------------------------------------------------------ */

export function parseEcbDfrCsv(text: string): SeriesPoint[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) throw new Error('ECB CSV: fewer than 2 lines — not a data response');
  const header = (lines[0] ?? '').split(',').map((h) => h.trim());
  const dateCol = header.indexOf('TIME_PERIOD');
  const valueCol = header.indexOf('OBS_VALUE');
  if (dateCol < 0 || valueCol < 0) {
    throw new Error(
      `ECB CSV: header has no TIME_PERIOD/OBS_VALUE (found ${header.slice(0, 8).join(',')}…) — format change?`,
    );
  }
  const out: SeriesPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i]!.split(',');
    const date = (cells[dateCol] ?? '').trim();
    const raw = (cells[valueCol] ?? '').trim();
    if (date === '' || raw === '') continue;
    assertIsoDate(date, `ECB CSV line ${i + 1}`);
    if (isMissing(raw)) continue;
    out.push({ date, value: parseNumber(raw, `ECB CSV line ${i + 1}`) });
  }
  if (out.length === 0) throw new Error('ECB CSV: zero observations parsed (series key wrong?)');
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  assertAscending(out);
  return out;
}

/* ------------------------------------------------------------------ *
 * RBA statistical-table CSV — the format verified from the ingestion
 * venue 2026-10-06 (GitHub Actions runner; the sandbox is Akamai-blocked,
 * see 03-data-sources.md):
 *   line 1: table title ("F1.1 INTEREST RATES AND YIELDS – MONEY MARKET");
 *   line 2: "Title,<series title>,…";
 *   lines 3–9: Description / Frequency / Type / Units / (blank) / Source /
 *              Publication date / Series ID metadata rows;
 *   then date-keyed data rows. Date formats VARY BY TABLE: "30/09/2026"
 *   (day-first, F1.1/E2) and "30-Sep-2026" (F2/F11.1). Future quarters are
 *   pre-scaffolded with empty values (E2) — skipped like any missing marker.
 *
 * I15: series selection now also accepts a Series ID (the "Series ID"
 * metadata row) — the stable identifier (RBA rewords titles over time; F6's
 * owner-occupier outstanding column is matched by FLRHOOTA, data spec §3).
 * ------------------------------------------------------------------ */

const MONTHS_3: ReadonlyMap<string, number> = new Map([
  ['jan', 1], ['feb', 2], ['mar', 3], ['apr', 4], ['may', 5], ['jun', 6],
  ['jul', 7], ['aug', 8], ['sep', 9], ['oct', 10], ['nov', 11], ['dec', 12],
]);

/** First cells of the fixed metadata rows between the header and the data. */
const RBA_METADATA_ROWS: ReadonlySet<string> = new Set([
  'Description', 'Frequency', 'Type', 'Units', 'Source', 'Publication date', 'Series ID',
]);

/** RBA date → ISO. Accepts day-first DD/MM/YYYY and D-Mon-YYYY; throws loud. */
function parseRbaDate(raw: string, context: string): string {
  const s = raw.trim();
  let m = /^(\d{1,2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`${context}: date "${raw}" is not a valid day-first DD/MM/YYYY`);
    }
    return `${m[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(s);
  if (m) {
    const month = MONTHS_3.get(m[2]!.toLowerCase());
    const day = Number(m[1]);
    if (month === undefined || day < 1 || day > 31) {
      throw new Error(`${context}: date "${raw}" is not a valid D-Mon-YYYY`);
    }
    return `${m[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  throw new Error(`${context}: date "${raw}" matches neither DD/MM/YYYY nor D-Mon-YYYY (RBA format change?)`);
}

export interface RbaParseOptions {
  /** Expected table-code prefix of the title line (loud identity check). */
  tablePrefix: string;
  /** Exact series title from the "Title" header row (e.g. 'Cash Rate Target'). */
  seriesTitle?: string;
  /**
   * I15: exact Series ID from the "Series ID" metadata row (e.g. F6's
   * FLRHOOTA) — preferred over titles: the RBA rewords titles over time
   * but keeps ids stable (external parsers rely on the same convention).
   */
  seriesId?: string;
}

/** Parse one RBA statistical-table CSV into a canonical series. */
export function parseRbaTableCsv(text: string, opts: RbaParseOptions): SeriesPoint[] {
  const stripped = text.startsWith('\uFEFF') ? text.slice(1) : text;
  const lines = stripped.split(/\r?\n/);
  if (lines.length < 10) throw new Error('RBA CSV: fewer than 10 lines — not a statistical table');
  const title = lines[0] ?? '';
  if (!title.startsWith(opts.tablePrefix)) {
    throw new Error(`RBA CSV: title "${title.slice(0, 40)}…" does not start with "${opts.tablePrefix}" (wrong table?)`);
  }
  const header = lines[1] ?? '';
  if (!header.startsWith('Title,')) {
    throw new Error('RBA CSV line 2: expected the "Title,<series…>" header row');
  }
  let col: number;
  if (opts.seriesId !== undefined) {
    // Locate the Series ID metadata row and match the exact id in it.
    let idRow: string[] | undefined;
    for (const line of lines) {
      const cells = line.split(',');
      if ((cells[0] ?? '').trim() === 'Series ID') {
        idRow = cells.map((c) => c.trim());
        break;
      }
    }
    if (!idRow) throw new Error('RBA CSV: no "Series ID" metadata row (format change?)');
    col = idRow.indexOf(opts.seriesId);
    if (col < 0) {
      throw new Error(
        `RBA CSV: no series id "${opts.seriesId}" (ids on file: ${idRow.filter(Boolean).slice(1, 6).join(', ')}…)`,
      );
    }
  } else if (opts.seriesTitle !== undefined) {
    const titles = header.split(',').map((h) => h.trim());
    col = titles.indexOf(opts.seriesTitle);
    if (col < 0) {
      throw new Error(`RBA CSV: no series titled "${opts.seriesTitle}" (header has ${titles.length - 1} series)`);
    }
  } else {
    throw new Error('RBA CSV: parser needs seriesTitle or seriesId');
  }

  const out: SeriesPoint[] = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trim() === '') continue;
    const cells = line.split(',');
    const rawDate = (cells[0] ?? '').trim();
    if (rawDate === '') continue; // metadata/annotation row
    // Only rows whose first cell is a DATE are data rows; metadata rows
    // ("Description,…", "Series ID,…") fail the date parse — skip them
    // unless the file has changed shape, in which case the row AFTER the
    // metadata block that fails loudly is the canary.
    if (/^\d/.test(rawDate)) {
      const raw = (cells[col] ?? '').trim();
      if (isMissing(raw)) continue;
      out.push({ date: parseRbaDate(rawDate, `RBA CSV line ${i + 1}`), value: parseNumber(raw, `RBA CSV line ${i + 1}`) });
    } else if (RBA_METADATA_ROWS.has(rawDate)) {
      continue; // known metadata row (Description/Frequency/Type/Units/Source/Publication date/Series ID)
    } else {
      throw new Error(`RBA CSV line ${i + 1}: first cell "${rawDate.slice(0, 30)}" is neither a date nor a known metadata row`);
    }
  }
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (out.length === 0) {
    throw new Error(`RBA CSV: series "${opts.seriesTitle}" parsed to zero observations`);
  }
  assertAscending(out);
  return out;
}
