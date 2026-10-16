/**
 * insights-csv.ts — snapshot export for the Insights page (I13).
 *
 * A pure builder (no DOM — unit-tested like config.ts / ics.ts): the
 * AboutTheData component wraps the result in a Blob and hands it to the
 * shared downloadBlob helper.
 *
 * Design decisions (02-page-design-spec.md §"About the data"):
 *  - Machine-readable VALUES, human-readable HEADERS: every numeric cell
 *    is ASCII digits with a period decimal separator (en-US formatting,
 *    no thousands separators) so spreadsheets in either locale parse the
 *    column as a number; only the header row and the status word are
 *    localized — the file must open correctly on a German Excel as much
 *    as on a Persian Sheets.
 *  - One row per reading in SNAPSHOT ORDER (global section first — the
 *    same story as the page), id in column 1 as the stable join key.
 *  - OWASP CSV-injection guard (csvNeutralizeFormula from @currena/core,
 *    the same guard the Batch converter's export uses) on every
 *    free-text column: name, ticker, source.
 *  - CRLF line endings (RFC 4180) with a trailing CRLF; formula-neutral
 *    fields are still csvEscapeField-escaped when they contain a comma,
 *    quote or newline (Persian names contain ZWNJ, never commas — but
 *    the guard costs nothing).
 */

import { formatNumber } from '@currena/core';
import type { InsightsSnapshot, IndicatorReading } from '@currena/core';
import { csvEscapeField, csvNeutralizeFormula } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { DISPLAY, type UnitToken } from './config';
import { tierOf } from './config/movers';

/** All-ASCII number rendering for CSV cells (machine-readable). */
function csvNumber(value: number, maximumFractionDigits = 6): string {
  return formatNumber(value, 'en-US', { maximumFractionDigits });
}

function csvOptional(change: number | undefined): string {
  return change === undefined ? '' : csvNumber(change);
}

function csvText(field: string): string {
  return csvEscapeField(csvNeutralizeFormula(field));
}

export function insightsCsvFilename(generatedAt: string): string {
  const date = generatedAt.slice(0, 10);
  return `currena-insights-${date}.csv`;
}

/** Column order — stable API for anyone scripting over the export. */
export function insightsCsvHeaders(copy: InsightsCopy): string[] {
  return [
    copy.ui.csvColId,
    copy.ui.csvColName,
    copy.ui.csvColTicker,
    copy.ui.csvColValue,
    copy.ui.csvColUnit,
    copy.ui.csvColStatus,
    copy.ui.csvColChange7d,
    copy.ui.csvColChange30d,
    copy.ui.csvColPosition10y,
    copy.ui.csvColAsOf,
    copy.ui.csvColUpdated,
    copy.ui.csvColSource,
  ];
}

/**
 * Defect E-21 (2026-10-16): the CSV's status word is the PAGE's two-tier
 * word (tierOf) — "Unusual" for a normal-status reading parked in the top
 * or bottom 10% of its own 10-year range, never a plain "Normal".
 */
function statusWord(reading: IndicatorReading, copy: InsightsCopy): string {
  const tier = tierOf(reading);
  const key =
    tier === 'needs-attention'
      ? 'warning'
      : tier === 'unusual'
        ? 'unusual'
        : tier === 'normal'
          ? 'normal'
          : tier === 'context'
            ? 'context'
            : tier === 'unavailable'
              ? 'unavailable'
              : 'stale';
  return copy.status[key];
}

/**
 * Build the CSV document for one snapshot. `copy` supplies the localized
 * headers, indicator names/tickers, unit labels and status words; values
 * stay ASCII (see the module header).
 */
export function buildInsightsCsv(snapshot: InsightsSnapshot, copy: InsightsCopy): string {
  const rows: string[] = [insightsCsvHeaders(copy).map(csvText).join(',')];
  for (const reading of snapshot.readings) {
    const ind = copy.indicators[reading.id];
    const unitToken: UnitToken = DISPLAY[reading.id].unit;
    rows.push(
      [
        csvText(reading.id),
        csvText(ind.name),
        csvText(ind.ticker ?? ''),
        // Defect E-10 (2026-10-16): the DISPLAYED value — the display scale
        // (m2-us: billions → trillions) applied, so value and unit agree.
        reading.value === null ? '' : csvNumber(reading.value * (DISPLAY[reading.id]?.scale ?? 1)),
        csvText(copy.units[unitToken]),
        csvText(statusWord(reading, copy)),
        csvOptional(reading.change7d),
        csvOptional(reading.change30d),
        reading.percentile10y === undefined ? '' : csvNumber(reading.percentile10y),
        reading.asOf ?? '',
        reading.updatedAt,
        csvText(reading.sourceName),
      ].join(','),
    );
  }
  // UTF-8 BOM: Excel on a fa-Windows machine decodes BOM-less CSV as
  // ANSI-1256 (the 2026-10-18 full-export finding) — mark the encoding.
  return `\uFEFF${rows.join('\r\n')}\r\n`;
}
