/**
 * fx-csv.ts — the world-currencies pairs table export (spec §9.3 item 6:
 * "CSV goes in the existing Tools menu").
 *
 * The same discipline as markets-csv.ts: machine-readable VALUES (ASCII
 * digits, period decimals, no thousands separators), human-readable
 * HEADERS (localized), one row per pair in the table's group order (the
 * spec's single sort — by the size of the 1-month move — stays an
 * on-screen affordance; the export keeps the table's canonical order),
 * OWASP CSV-injection guard on every free-text column, CRLF line endings
 * (RFC 4180) with a trailing CRLF. A pure builder — the caller wraps the
 * result in a Blob and hands it to the shared downloadBlob.
 */

import { formatNumber, csvEscapeField, csvNeutralizeFormula } from '@currena/core';
import type { FxSnapshot, FxPairEntry } from '@currena/core';
import { FX_GROUP_ORDER, FX_PAIRS } from '@currena/insights/fx/definitions';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { fxTrendOf } from '../../lib/fx-presentation';

function csvNumber(value: number, maximumFractionDigits = 2): string {
  return formatNumber(value, 'en-US', { maximumFractionDigits });
}

function csvText(field: string): string {
  return csvEscapeField(csvNeutralizeFormula(field));
}

export function fxCsvFilename(generatedAt: string): string {
  const date = generatedAt.slice(0, 10);
  return `currena-world-currencies-${date}.csv`;
}

/** Column order — stable API for anyone scripting over the export. */
export function fxCsvHeaders(copy: InsightsCopy): string[] {
  return [
    copy.fx.csvColPair,
    copy.fx.csvColToday,
    copy.fx.csvColM1,
    copy.fx.csvColM3,
    copy.fx.csvColY1,
    copy.fx.csvColTrend,
    copy.fx.csvColRate,
    copy.fx.csvColAsOf,
    copy.fx.csvColSource,
  ];
}

function trendWord(entry: FxPairEntry, copy: InsightsCopy): string {
  const trend = fxTrendOf(entry);
  return trend === 'up' ? copy.fx.trendUp : trend === 'down' ? copy.fx.trendDown : copy.fx.trendFlat;
}

export function buildFxCsv(snapshot: FxSnapshot, copy: InsightsCopy): string {
  const byId = new Map(snapshot.pairs.map((p) => [p.id as string, p]));
  const lines: string[] = [fxCsvHeaders(copy).map(csvText).join(',')];
  // The table's canonical order: the three group blocks, pairs in spec order.
  for (const group of FX_GROUP_ORDER) {
    for (const def of FX_PAIRS.filter((p) => p.group === group)) {
      const entry = byId.get(def.id);
      if (entry === undefined) continue; // never-populated row: absent, never zero
      lines.push(
        [
          csvText(copy.fx.entries[entry.id].name),
          csvNumber(entry.chg.d1),
          csvNumber(entry.chg.m1),
          csvNumber(entry.chg.m3),
          csvNumber(entry.chg.y1),
          csvText(trendWord(entry, copy)),
          csvNumber(entry.rate, 5),
          entry.asOf,
          entry.source,
        ].join(','),
      );
    }
  }
  // UTF-8 BOM: Excel on a fa-Windows machine decodes BOM-less CSV as
  // ANSI-1256 (the 2026-10-18 full-export finding) — mark the encoding.
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
