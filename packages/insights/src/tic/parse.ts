/**
 * TIC SLT table parsers (gap-closure S2-M2.2) — the PURE parse halves for
 * the two verified Treasury files (fixtures under fixtures/tic/; layout
 * evidence in docs/insights/SCRAPING_SPEC.md FS-08).
 *
 * Everything fails CLOSED (FormatChangedError): column counts, the units
 * preamble ("Billions of dollars" / "Millions of dollars"), the header
 * month format, the machine-readable field-id row (Table 3), numeric
 * cells, plausible magnitudes, month contiguity and the grand-total
 * sum-of-parts check. A silently misparsed table is worse than a missing
 * one — the section shows "can't tell right now" instead.
 *
 * Sign convention (Table 3's own line 3, asserted at parse time): a
 * POSITIVE "net U.S. sales" number means foreigners NET BOUGHT.
 */

import { FormatChangedError } from '../adapters/fetch-policy';

/** `YYYY-MM` as the tables publish it. */
export type TicYm = string;

const YM_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Assert a `YYYY-MM` cell; returns it. */
function parseYm(raw: string, where: string): TicYm {
  const t = raw.trim();
  if (!YM_RE.test(t)) throw new FormatChangedError(`TIC ${where}: not a YYYY-MM month (${JSON.stringify(raw)})`);
  return t;
}

/** A finite number cell in a caller-chosen plausibility band; `n.a.` allowed
 *  only where the caller says (the transactions columns — signed, from
 *  −max to +max; holdings columns are non-negative). */
function parseNum(raw: string, where: string, opts: { allowNa?: boolean; min?: number; max?: number } = {}): number | null {
  const t = raw.trim();
  if (t === 'n.a.') {
    if (opts.allowNa === true) return null;
    throw new FormatChangedError(`TIC ${where}: unexpected n.a. (${JSON.stringify(raw)})`);
  }
  if (!/^-?\d+(\.\d+)?$/.test(t)) {
    throw new FormatChangedError(`TIC ${where}: non-numeric cell ${JSON.stringify(raw)}`);
  }
  const v = Number(t);
  if (!Number.isFinite(v)) throw new FormatChangedError(`TIC ${where}: non-finite cell ${JSON.stringify(raw)}`);
  const min = opts.min ?? 0;
  if (v < min) throw new FormatChangedError(`TIC ${where}: cell ${v} below the plausible minimum ${min}`);
  if (opts.max !== undefined && v > opts.max) {
    throw new FormatChangedError(`TIC ${where}: implausible magnitude ${v} in ${JSON.stringify(raw)} (units mix-up?)`);
  }
  return v;
}

/** The month immediately BEFORE the given `YYYY-MM` (for the contiguity
 * check — the tables publish every month, so a gap is a layout change). */
function previousMonth(ym: string): string {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  if (m === 1) return `${String(y - 1).padStart(4, '0')}-12`;
  return `${String(y).padStart(4, '0')}-${String(m - 1).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ *
 * Table 5 — Major Foreign Holders (BILLIONS of dollars)
 * ------------------------------------------------------------------ */

/** The verified Table 5 shape (values in billions, arrays newest-first
 * exactly as published). */
export interface TicTable5 {
  dataMonth: TicYm;
  /** The 13 published months, newest-first. */
  months: TicYm[];
  /** The country rows in published order (descending holdings), newest-first values. */
  countries: { name: string; values: number[] }[];
  /** The `All Other` row, newest-first. */
  allOther: number[];
  /** The `Grand Total` row, newest-first. */
  grandTotal: number[];
  /** `Of Which: Foreign Official`, newest-first. */
  foreignOfficial: number[];
  /** `Of Which: Foreign Official Treasury Bills`, newest-first. */
  foreignOfficialBills: number[];
  /** `Of Which: Foreign Official T-Bonds & Notes`, newest-first (parsed
   *  for completeness; the model does not use it). */
  foreignOfficialTbonds: number[];
}

/** The rolling-window width Treasury publishes (13 months). */
export const TIC_TABLE5_MONTHS = 13;

/** Plausibility band for a billions cell (total foreign holdings ~$9–10tn;
 * catches a millions/billions units flip at 1000×). */
const T5_MAX_BN = 20_000;

/**
 * Parse `slt_table5.txt`. Structural assertions, in order:
 * title line, units line ("Billions of dollars"), header row
 * (`Country` + exactly 13 descending YYYY-MM columns), 14-cell rows,
 * numeric cells, the grand-total sum-of-parts check (±$1.5bn — each cell
 * is rounded to 0.1, so 21 addends accumulate ≤ ~1.05 of rounding).
 */
export function parseTicTable5(text: string): TicTable5 {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 10) throw new FormatChangedError('TIC table5: fewer than 10 non-empty lines');

  const title = lines[0]!.split('\t')[0]!.trim();
  if (!title.startsWith('Table 5:')) {
    throw new FormatChangedError(`TIC table5: unexpected title line ${JSON.stringify(lines[0]!.slice(0, 60))}`);
  }
  const units = lines.find((l) => l.split('\t')[0]!.trim() === 'Billions of dollars');
  if (units === undefined) {
    throw new FormatChangedError('TIC table5: no "Billions of dollars" units line (units mix-up or layout change)');
  }

  // The header row: first cell exactly "Country", then 13 YYYY-MM columns.
  const headerIdx = lines.findIndex((l) => l.split('\t')[0]!.trim() === 'Country');
  if (headerIdx === -1) throw new FormatChangedError('TIC table5: no header row starting with "Country"');
  const headerCells = lines[headerIdx]!.split('\t');
  if (headerCells.length !== TIC_TABLE5_MONTHS + 1) {
    throw new FormatChangedError(
      `TIC table5: header has ${headerCells.length} columns, expected ${TIC_TABLE5_MONTHS + 1} (Country + ${TIC_TABLE5_MONTHS} months)`,
    );
  }
  const months: TicYm[] = headerCells.slice(1).map((c, i) => parseYm(c, `table5 header col ${i + 2}`));
  for (let i = 1; i < months.length; i += 1) {
    if (months[i]! >= months[i - 1]!) {
      throw new FormatChangedError(`TIC table5: header months not strictly descending at ${months[i]}`);
    }
  }

  const countries: { name: string; values: number[] }[] = [];
  let allOther: number[] | undefined;
  let grandTotal: number[] | undefined;
  let foreignOfficial: number[] | undefined;
  let foreignOfficialBills: number[] | undefined;
  let foreignOfficialTbonds: number[] | undefined;

  for (let i = headerIdx + 1; i < lines.length; i += 1) {
    const cells = lines[i]!.split('\t');
    const name = cells[0]!.trim();
    // The footnote block ("Notes:", the custody caveat, the SLT/BL2
    // description lines) carries the prose in cell 0 and EMPTY month
    // cells — data rows never have an empty month cell, so the first
    // one ends the data block.
    if (cells.length < 2 || cells.slice(1).some((c) => c.trim() === '')) break;
    if (cells.length !== TIC_TABLE5_MONTHS + 1) {
      throw new FormatChangedError(`TIC table5: row ${JSON.stringify(name)} has ${cells.length} cells, expected ${TIC_TABLE5_MONTHS + 1}`);
    }
    const values = cells.slice(1).map((c, j) => parseNum(c, `table5 ${name} ${months[j]}`, { max: T5_MAX_BN }) as number);
    if (name === 'All Other') allOther = values;
    else if (name === 'Grand Total') grandTotal = values;
    else if (name === 'Of Which: Foreign Official') foreignOfficial = values;
    else if (name === 'Of Which: Foreign Official Treasury Bills') foreignOfficialBills = values;
    else if (name === 'Of Which: Foreign Official T-Bonds & Notes') foreignOfficialTbonds = values;
    else countries.push({ name, values });
  }

  if (countries.length < 15) {
    throw new FormatChangedError(`TIC table5: only ${countries.length} country rows (expected the top-holder list, ≥15)`);
  }
  if (allOther === undefined || grandTotal === undefined || foreignOfficial === undefined) {
    throw new FormatChangedError('TIC table5: missing All Other / Grand Total / Of Which: Foreign Official row');
  }
  // Sum-of-parts: the country rows + All Other must equal Grand Total
  // within the rounding tolerance (verified live 2026-10-31: 9331.6 vs
  // 9331.7 — a structural break (missing country, units flip, column
  // shift) lands far outside).
  for (let j = 0; j < months.length; j += 1) {
    const sum = countries.reduce((acc, r) => acc + r.values[j]!, 0) + allOther![j]!;
    if (Math.abs(sum - grandTotal![j]!) > 1.5) {
      throw new FormatChangedError(
        `TIC table5: sum of parts ${sum.toFixed(1)} != Grand Total ${grandTotal![j]!.toFixed(1)} for ${months[j]}`,
      );
    }
  }
  if (foreignOfficial[0]! > grandTotal[0]!) {
    throw new FormatChangedError('TIC table5: Foreign Official exceeds Grand Total');
  }

  return {
    dataMonth: months[0]!,
    months,
    countries,
    allOther,
    grandTotal,
    foreignOfficial,
    foreignOfficialBills: foreignOfficialBills ?? [],
    foreignOfficialTbonds: foreignOfficialTbonds ?? [],
  };
}

/* ------------------------------------------------------------------ *
 * Table 3 — U.S. Treasury Securities Held by Foreign Residents (MILLIONS)
 * ------------------------------------------------------------------ */

/** One country-month row (millions; null = the published `n.a.` — small
 *  countries can carry n.a. total holdings while long-term data exists). */
export interface TicTable3Month {
  ym: TicYm;
  /** Total holdings, millions; null when `n.a.`. */
  holdingsM: number | null;
  /** Total net U.S. sales, millions; null when `n.a.` (before 2023-02). */
  netM: number | null;
  /** Long-term valuation change, millions; null when `n.a.`. */
  valchgM: number | null;
}

/** One Table 3 row-block, months newest-first as published. */
export interface TicTable3Row {
  name: string;
  code: string;
  months: TicTable3Month[];
}

/** The verified Table 3 shape. */
export interface TicTable3 {
  dataMonth: TicYm;
  /** Every country row keyed by published name. */
  countries: Map<string, TicTable3Row>;
  /** The aggregate rows (All Countries, Grand Total, Of Which: …, Memo: …, Total IROs, International). */
  aggregates: Map<string, TicTable3Row>;
}

/** The machine-readable field-id row — the strongest layout pin. */
const TIC_TABLE3_FIELDS = [
  'country',
  'country_code',
  'date',
  'for_treas_pos',
  'for_treas_net',
  'for_lt_treas_pos',
  'for_lt_treas_net',
  'for_lt_treas_valchg',
  'for_st_treas_pos',
  'for_st_treas_net',
] as const;

/** The sign-convention line Table 3 carries in its preamble. */
const TIC_TABLE3_SIGN_LINE =
  'A positive number for net U.S. sales to foreigners denotes an increase in a foreign position';

/** Plausibility band for a millions cell (~$9.3tn total = 9.3M millions). */
const T3_MAX_M = 25_000_000;

/** Row names that belong to the aggregates block, not countries. */
const AGGREGATE_PREFIXES = ['All Countries', 'Grand Total', 'Of Which:', 'Memo:', 'Total IROs', 'International'];

function isAggregateName(name: string): boolean {
  return AGGREGATE_PREFIXES.some((p) => name === p || name.startsWith(`${p} `) || name.startsWith(`${p}:`));
}

/**
 * Parse `slt_table3.txt`. Structural assertions, in order: title line,
 * the sign-convention line, the units line ("Millions of dollars"), the
 * EXACT snake-case field-id row, 10-cell rows, 5-digit country codes,
 * YYYY-MM dates, contiguous strictly-descending months per row, numeric
 * holdings with `n.a.` only permitted in the two read transaction columns.
 */
export function parseTicTable3(text: string): TicTable3 {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 20) throw new FormatChangedError('TIC table3: fewer than 20 non-empty lines');

  const title = lines[0]!.split('\t')[0]!.trim();
  if (!title.startsWith('Table 3:')) {
    throw new FormatChangedError(`TIC table3: unexpected title line ${JSON.stringify(lines[0]!.slice(0, 60))}`);
  }
  if (!lines.some((l) => l.split('\t')[0]!.trim() === TIC_TABLE3_SIGN_LINE)) {
    throw new FormatChangedError('TIC table3: the sign-convention line is missing or reworded');
  }
  if (!lines.some((l) => l.split('\t')[0]!.trim() === 'Millions of dollars')) {
    throw new FormatChangedError('TIC table3: no "Millions of dollars" units line (units mix-up or layout change)');
  }

  const fieldsIdx = lines.findIndex((l) => l.split('\t', 2)[0] === 'country');
  if (fieldsIdx === -1) throw new FormatChangedError('TIC table3: no field-id row starting with "country"');
  const fields = lines[fieldsIdx]!.split('\t').map((c) => c.trim());
  if (fields.length !== TIC_TABLE3_FIELDS.length || fields.some((f, i) => f !== TIC_TABLE3_FIELDS[i])) {
    throw new FormatChangedError(
      `TIC table3: field-id row mismatch (got ${fields.join(',')}) — layout change`,
    );
  }

  const countries = new Map<string, TicTable3Row>();
  const aggregates = new Map<string, TicTable3Row>();
  let lastRow: TicTable3Row | undefined;

  for (let i = fieldsIdx + 1; i < lines.length; i += 1) {
    const cells = lines[i]!.split('\t');
    const first = cells[0]!.trim();
    // The footer prose (Notes:, the custody caveat, the column
    // definitions) carries prose in cell 0 and EMPTY later cells —
    // sometimes exactly 10 of them. A DATA row always carries a
    // YYYY-MM date in cell 2; the first non-data line ends the block.
    const dateCell = cells[2]?.trim() ?? '';
    const looksLikeDataRow = /^\d{4}-\d{2}$/.test(dateCell);
    if (cells.length !== TIC_TABLE3_FIELDS.length) {
      if (looksLikeDataRow) {
        throw new FormatChangedError(`TIC table3: row ${JSON.stringify(first.slice(0, 40))} has ${cells.length} cells, expected 10`);
      }
      break;
    }
    if (!looksLikeDataRow) break;
    const name = first;
    const code = cells[1]!.trim();
    if (!/^\d{5}$/.test(code)) {
      throw new FormatChangedError(`TIC table3: country_code ${JSON.stringify(code)} is not 5 digits`);
    }
    const ym = parseYm(cells[2]!, `table3 ${name}`);
    const holdingsM = parseNum(cells[3]!, `table3 ${name} ${ym} for_treas_pos`, {
      allowNa: true,
      max: T3_MAX_M,
    });
    const netM = parseNum(cells[4]!, `table3 ${name} ${ym} for_treas_net`, {
      allowNa: true,
      min: -T3_MAX_M,
      max: T3_MAX_M,
    });
    const valchgM = parseNum(cells[7]!, `table3 ${name} ${ym} for_lt_treas_valchg`, {
      allowNa: true,
      min: -T3_MAX_M,
      max: T3_MAX_M,
    });

    let row = lastRow;
    if (row === undefined || row.name !== name) {
      const target = isAggregateName(name) ? aggregates : countries;
      if (target.has(name)) {
        throw new FormatChangedError(`TIC table3: duplicate ${name} row block (layout change?)`);
      }
      row = { name, code, months: [] };
      target.set(name, row);
      lastRow = row;
    } else if (row.code !== code) {
      throw new FormatChangedError(`TIC table3: ${name} changed country_code ${row.code} → ${code}`);
    }
    // Months must be strictly descending AND contiguous (the SLT publishes
    // every month; a gap means the layout or the series changed). Rows
    // arrive NEWEST-FIRST, so each new month must be the month immediately
    // before the last one pushed.
    const prev = row.months.at(-1)?.ym;
    if (prev !== undefined && previousMonth(prev) !== ym) {
      throw new FormatChangedError(`TIC table3: ${name} month ${ym} does not follow ${prev} contiguously`);
    }
    row.months.push({ ym, holdingsM, netM, valchgM });
  }

  if (countries.size < 50) {
    throw new FormatChangedError(`TIC table3: only ${countries.size} country rows (expected the all-countries list, ≥50)`);
  }
  if (!aggregates.has('Grand Total') || !aggregates.has('Of Which: Foreign Official')) {
    throw new FormatChangedError('TIC table3: missing Grand Total / Of Which: Foreign Official aggregate row');
  }

  let dataMonth = '';
  for (const row of countries.values()) {
    const latest = row.months[0]?.ym;
    if (latest !== undefined && latest > dataMonth) dataMonth = latest;
  }
  if (dataMonth === '') throw new FormatChangedError('TIC table3: no months parsed');

  return { dataMonth, countries, aggregates };
}
