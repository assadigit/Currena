/**
 * markets-csv.ts — the world-markets table export (spec §6.4: "CSV of this
 * table goes into the existing Tools menu").
 *
 * The same discipline as insights-csv.ts: machine-readable VALUES (ASCII
 * digits, period decimals, no thousands separators), human-readable
 * HEADERS (localized), one row per market in the table's worst-first
 * order, OWASP CSV-injection guard on every free-text column, CRLF line
 * endings (RFC 4180) with a trailing CRLF. A pure builder — the caller
 * wraps the result in a Blob and hands it to the shared downloadBlob.
 */

import { formatNumber } from '@currena/core';
import { csvEscapeField, csvNeutralizeFormula } from '@currena/core';
import type { MarketsSnapshot, MarketEntry } from '@currena/core';
import { TREND_BAND_PCT } from '@currena/insights/markets/definitions';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { statusWordKeyOf } from './config/labels';

function csvNumber(value: number, maximumFractionDigits = 2): string {
  return formatNumber(value, 'en-US', { maximumFractionDigits });
}

function csvText(field: string): string {
  return csvEscapeField(csvNeutralizeFormula(field));
}

export function marketsCsvFilename(generatedAt: string): string {
  const date = generatedAt.slice(0, 10);
  return `currena-world-markets-${date}.csv`;
}

/** Column order — stable API for anyone scripting over the export. Round 46
 * (the weekly/monthly lenses) APPENDED the 1-week and 1-month columns at the
 * END (after Source) so position-pinned scripts keep reading every existing
 * column at the same index; round 47 (the yearly lens) appended 1-year the
 * same way, and the 2026-10-27 "add five year" round appends 5-year
 * likewise — the human-facing table orders them by duration instead; the
 * table is a page surface, this file is a machine surface. */
function marketsCsvHeaders(copy: InsightsCopy): string[] {
  return [
    copy.markets.csvColMarket,
    copy.markets.csvColToday,
    copy.markets.csvCol3m,
    copy.markets.csvColFromHigh,
    copy.markets.csvColTrend,
    copy.markets.csvColStatus,
    copy.markets.csvColClose,
    copy.markets.csvColHigh52w,
    copy.markets.csvColLow52w,
    copy.markets.csvColAsOf,
    copy.markets.csvColSource,
    copy.markets.csvColWeek,
    copy.markets.csvColMonth,
    copy.markets.csvColYear,
    copy.markets.csvCol5y,
  ];
}

// Defect E-18 (2026-10-16): the Trend word is recomputed from the chg3m
// number the row shows (≥ +1% Up, ≤ −1% Down, else Flat) — reproducible
// from the stated rule, never the stored field's old basis.
function trendWord(m: MarketEntry, copy: InsightsCopy): string {
  return copy.markets[m.chg3m >= TREND_BAND_PCT ? 'trendUp' : m.chg3m <= -TREND_BAND_PCT ? 'trendDown' : 'trendFlat'];
}

// Defect E-22 (2026-10-16): the L2-01 stock-state words from the distance
// below the 52-week high (closing basis) — never "Normal".
function statusWord(m: MarketEntry, copy: InsightsCopy): string {
  return copy.markets[statusWordKeyOf(m.fromHigh)];
}

export function buildMarketsCsv(snapshot: MarketsSnapshot, copy: InsightsCopy): string {
  const rows = [...snapshot.markets].sort((a, b) => a.fromHigh - b.fromHigh); // worst first, like the table
  const lines: string[] = [marketsCsvHeaders(copy).map(csvText).join(',')];
  for (const m of rows) {
    lines.push(
      [
        csvText(copy.markets.entries[m.id].name),
        csvNumber(m.chg1d),
        csvNumber(m.chg3m),
        csvNumber(m.fromHigh),
        csvText(trendWord(m, copy)),
        csvText(statusWord(m, copy)),
        csvNumber(m.close),
        csvNumber(m.high52w),
        csvNumber(m.low52w),
        m.asOf,
        m.source,
        // Round 46: a stored row without the lens yet exports an EMPTY field —
        // absent is absent, never a guessed zero (round 47's chg1y and the
        // 2026-10-27 round's chg5y likewise).
        m.chg1w === undefined ? '' : csvNumber(m.chg1w),
        m.chg1m === undefined ? '' : csvNumber(m.chg1m),
        m.chg1y === undefined ? '' : csvNumber(m.chg1y),
        m.chg5y === undefined ? '' : csvNumber(m.chg5y),
      ].join(','),
    );
  }
  // UTF-8 BOM: Excel on a fa-Windows machine decodes BOM-less CSV as
  // ANSI-1256 (the 2026-10-18 full-export finding) — mark the encoding.
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
