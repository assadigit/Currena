/**
 * Batch converter parsing — MIGRATION_CHECKLIST #13.
 *
 * Legacy behavior (captured batch-converter-script.js): the bulk textarea
 * takes ONE AMOUNT PER LINE — the first `[\d.]+` run in each non-empty line
 * is the amount, currency suffixes and any other text are ignored, amounts
 * must be > 0; notes existed only in the individual-fields mode. The CSV
 * export wrote header + rows + blank line + Total + Exchange Rate, quoting
 * notes with doubled internal quotes.
 *
 * This port keeps that tolerance and extends it (mission ask): optional
 * from/to codes inline ("100 usd eur", "100 USD to EUR") and an optional
 * trailing note after '#' or '|' (so bulk mode gains the notes the legacy
 * individual fields had). Every failure is a typed per-line error — the
 * legacy silently skipped bad lines; the SPA can skip them again by
 * filtering on `ok`, but the information is no longer lost.
 */

import { isCurrencyCode, type CurrencyCode } from './currencies';
import { normalizeDigits, parseAmount } from './format';

/* ------------------------------------------------------------------ *
 * Line parsing
 * ------------------------------------------------------------------ */

/** A successfully parsed batch line. */
export interface ParsedBatchLine {
  /** Positive amount (first numeric token in the line). */
  amount: number;
  /** Source currency when present in the line ("100 usd …"), else undefined. */
  from?: CurrencyCode;
  /** Target currency when present in the line ("… to eur"), else undefined. */
  to?: CurrencyCode;
  /** Note text after '#' or '|' (trimmed; empty note → undefined). */
  note?: string;
}

/** Machine-readable failure codes for one batch line. */
export type BatchLineErrorCode = 'empty_line' | 'no_amount' | 'invalid_amount';

export interface BatchLineError {
  code: BatchLineErrorCode;
  message: string;
  /** The raw line, for surfacing next to the input. */
  line: string;
}

export type BatchParseResult = { ok: true; value: ParsedBatchLine } | { ok: false; error: BatchLineError };

const AMOUNT_PATTERN = /-?\d[\d,]*(?:\.\d*)?|-?\.\d+/;
const CONNECTIVE = /^(?:to|in|->|→|=>|=)$/i;

/**
 * Parse one batch line, tolerantly. Accepted shapes (all real examples):
 *
 *     "150.99"                      → amount only (from/to from page defaults)
 *     "1,234.56"                    → commas OK
 *     "150.99 USD"                  → amount + from
 *     "100 usd eur"                 → amount + from + to
 *     "100 USD to EUR"              → 'to' (or 'in', '→', '->', '=') skipped
 *     "150.99 USD | iPhone 15 Pro"  → note after '|' (or '#')
 *     "۱۰۰ usd eur"                 → Persian digits OK (scraper parity)
 *
 * Currency suffixes after the amount are ignored unless they parse as one
 * of the 17 supported codes — legacy tolerance preserved.
 */
export function parseBatchLine(line: string): BatchParseResult {
  const trimmed = line.trim();
  if (trimmed === '') {
    return { ok: false, error: { code: 'empty_line', message: 'line is empty', line } };
  }

  // Split off the note at the first '#' or '|'.
  const noteIdx = trimmed.search(/[#|]/);
  const body = (noteIdx === -1 ? trimmed : trimmed.slice(0, noteIdx)).trim();
  const note = noteIdx === -1 ? undefined : trimmed.slice(noteIdx + 1).trim();

  // Amount: first numeric-ish token (legacy: line.match(/[\d.]+/)).
  const normalizedBody = normalizeDigits(body);
  const amountMatch = AMOUNT_PATTERN.exec(normalizedBody);
  if (!amountMatch) {
    return { ok: false, error: { code: 'no_amount', message: 'no amount found in line', line } };
  }
  const amount = parseAmount(amountMatch[0]);
  if (amount === null || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: { code: 'invalid_amount', message: `amount must be a positive number, got ${JSON.stringify(amountMatch[0])}`, line } };
  }

  // Optional from/to: 3-letter tokens that are supported currency codes,
  // in order of appearance; connectives ('to', 'in', '→', …) skipped.
  const currencies: CurrencyCode[] = [];
  for (const rawToken of normalizedBody.split(/\s+/)) {
    const token = rawToken.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
    if (token === '' || CONNECTIVE.test(token)) continue;
    const upper = token.toUpperCase();
    if (isCurrencyCode(upper) && !currencies.includes(upper)) {
      currencies.push(upper);
    }
  }
  const [from, to] = currencies;

  return {
    ok: true,
    value: {
      amount,
      ...(from !== undefined && { from }),
      ...(to !== undefined && { to }),
      ...(note !== undefined && note !== '' && { note }),
    },
  };
}

export interface BatchLineDefaults {
  from?: CurrencyCode;
  to?: CurrencyCode;
}

/**
 * Parse a whole textarea: skips blank lines, applies the page-level
 * from/to defaults to lines that don't carry their own codes, and returns
 * per-line results (never throws on content — surface errors in the UI).
 */
export function parseBatchLines(text: string, defaults: BatchLineDefaults = {}): BatchParseResult[] {
  const hasDefaultFrom = defaults.from !== undefined;
  const hasDefaultTo = defaults.to !== undefined;
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const result = parseBatchLine(line);
      if (result.ok) {
        const from = result.value.from ?? (hasDefaultFrom ? defaults.from : undefined);
        const to = result.value.to ?? (hasDefaultTo ? defaults.to : undefined);
        return {
          ok: true as const,
          value: { ...result.value, ...(from !== undefined && { from }), ...(to !== undefined && { to }) },
        };
      }
      return result;
    });
}

/* ------------------------------------------------------------------ *
 * CSV export (legacy shape)
 * ------------------------------------------------------------------ */

/** One converted row ready for CSV. */
export interface BatchCsvRow {
  original: number;
  converted: number;
  note?: string;
}

export interface BatchCsvOptions {
  /** Source currency code (header + rate line). */
  from: string;
  /** Target currency code (header + rate line + decimal policy). */
  to: string;
  /** Pair rate for the "Exchange Rate" footer line (omit to skip it). */
  rate?: number;
}

/** RFC-4180-style field escaping: quote when needed, double inner quotes. */
export function csvEscapeField(field: string): string {
  return /[",\r\n]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field;
}

/**
 * CSV in the exact legacy shape (captured exportCSV):
 *
 *     Original Amount (USD),Converted Amount (EUR),Note
 *     150.99,163.55,"iPhone 15 Pro"
 *     ⏎ blank line
 *     Total,560.73,609.05,
 *     Exchange Rate,1 USD = 0.9213 EUR,,
 *
 * Converted amounts use 0 decimals for IRR targets, else 2; the rate line
 * uses 0 for IRR, else 4 — exactly the legacy policy.
 */
export function toCsv(rows: readonly BatchCsvRow[], opts: BatchCsvOptions): string {
  const convertedDecimals = opts.to === 'IRR' ? 0 : 2;
  const rateDecimals = opts.to === 'IRR' ? 0 : 4;

  let csv = `Original Amount (${opts.from}),Converted Amount (${opts.to}),Note\n`;
  for (const row of rows) {
    // Legacy parity: notes are ALWAYS quoted (with inner quotes doubled);
    // absent notes stay an empty field.
    const note = row.note ? `"${row.note.replace(/"/g, '""')}"` : '';
    csv += `${row.original.toFixed(2)},${row.converted.toFixed(convertedDecimals)},${note}\n`;
  }

  const totalOriginal = rows.reduce((sum, row) => sum + row.original, 0);
  const totalConverted = rows.reduce((sum, row) => sum + row.converted, 0);
  csv += `\nTotal,${totalOriginal.toFixed(2)},${totalConverted.toFixed(convertedDecimals)},\n`;
  if (opts.rate !== undefined) {
    csv += `Exchange Rate,1 ${opts.from} = ${opts.rate.toFixed(rateDecimals)} ${opts.to},,\n`;
  }
  return csv;
}

/* ------------------------------------------------------------------ *
 * Quick templates (exact legacy values — captured batch-converter-script.js)
 * ------------------------------------------------------------------ */

/**
 * The three quick-fill templates, verbatim amounts from the legacy
 * loadTemplate(): Shopping Cart (5 items), Price Comparison (3 items),
 * Wishlist (10 items). Labels/emoji live in the i18n dictionary.
 */
export const BATCH_TEMPLATES = {
  shopping: [150.99, 89.5, 45, 199.99, 75.25],
  comparison: [299.99, 349, 279.5],
  wishlist: [100, 250, 75, 180, 95, 125, 220, 340, 88, 165],
} as const;

export type BatchTemplateId = keyof typeof BATCH_TEMPLATES;

/** Is `id` one of the three legacy template ids? */
export function isBatchTemplateId(id: string): id is BatchTemplateId {
  return id === 'shopping' || id === 'comparison' || id === 'wishlist';
}
