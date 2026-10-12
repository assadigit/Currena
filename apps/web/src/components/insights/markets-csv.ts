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
import type { InsightsCopy } from '../../i18n/insights-copy-en';

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

/** Column order — stable API for anyone scripting over the export. */
export function marketsCsvHeaders(copy: InsightsCopy): string[] {
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
  ];
}

function trendWord(m: MarketEntry, copy: InsightsCopy): string {
  return copy.markets[m.trend === 'up' ? 'trendUp' : m.trend === 'down' ? 'trendDown' : 'trendFlat'];
}

function statusWord(m: MarketEntry, copy: InsightsCopy): string {
  return copy.markets[m.status === 'correction' ? 'statusCorrection' : m.status === 'bear' ? 'statusBear' : 'statusNormal'];
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
      ].join(','),
    );
  }
  return `${lines.join('\r\n')}\r\n`;
}
