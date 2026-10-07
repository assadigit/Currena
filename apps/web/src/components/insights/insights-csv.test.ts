/**
 * insights-csv.ts unit tests (I13) — the snapshot export builder:
 * localized headers over ASCII values, snapshot order, the OWASP
 * formula-injection guard on free-text columns, unavailable rows and the
 * filename stamp.
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorReading, InsightsSnapshot } from '@currena/core';
import { buildInsightsCsv, insightsCsvFilename, insightsCsvHeaders } from './insights-csv';
import { insightsCopyEn } from '../../i18n/insights-copy-en';

function reading(overrides: Partial<IndicatorReading> & Pick<IndicatorReading, 'id'>): IndicatorReading {
  return {
    value: 1,
    asOf: '2026-10-07',
    change7d: 0.1,
    change30d: 0.2,
    percentile10y: 0.56,
    status: 'normal',
    sourceName: 'FRED (DGS10)',
    updatedAt: '2026-10-07T15:46:25.777Z',
    ...overrides,
  } as IndicatorReading;
}

const snapshot: InsightsSnapshot = {
  generatedAt: '2026-10-07T15:46:25.777Z',
  readings: [
    reading({ id: 'yield-curve-10y2y', value: 0.48, change7d: 0.11, change30d: 0.07 }),
    reading({ id: 'us10y', value: 5.31, status: 'warning' }),
    reading({
      id: 'gold-usd',
      value: null,
      asOf: null,
      change7d: undefined,
      change30d: undefined,
      percentile10y: undefined,
      status: 'unavailable',
      sourceName: 'gold-api.com',
    }),
  ],
  summary: { global: null, australia: null },
  changedThisWeek: [],
  calendar: [],
} as unknown as InsightsSnapshot;

describe('insightsCsvHeaders', () => {
  it('exposes a stable 12-column order with localized wording', () => {
    const headers = insightsCsvHeaders(insightsCopyEn);
    expect(headers).toHaveLength(12);
    expect(headers[0]).toBe('ID');
    expect(headers[3]).toBe('Value');
    expect(headers[11]).toBe('Source');
    // The row builder and the header list can never drift apart.
    const firstDataRow = buildInsightsCsv(snapshot, insightsCopyEn).split('\r\n')[1]!;
    expect(firstDataRow.split(',')).toHaveLength(headers.length);
  });
});

describe('buildInsightsCsv', () => {
  it('emits CRLF line endings with a trailing CRLF (RFC 4180)', () => {
    const csv = buildInsightsCsv(snapshot, insightsCopyEn);
    expect(csv.endsWith('\r\n')).toBe(true);
    expect(csv).not.toMatch(/[^\r]\n/); // never a bare LF
  });

  it('renders values as plain ASCII numbers (machine-readable in any locale)', () => {
    const rows = buildInsightsCsv(snapshot, insightsCopyEn).split('\r\n');
    const yieldRow = rows[1]!;
    expect(yieldRow).toContain('0.48'); // period decimal separator, no sign glyphs
    expect(yieldRow).toContain('0.11'); // raw change7d — spreadsheets parse it
    expect(yieldRow).toContain('0.56'); // percentile10y
    expect(yieldRow).not.toMatch(/[\u06F0-\u06F9]/); // never a Persian digit
    expect(yieldRow).not.toContain('٬'); // no Persian thousands separator
    expect(yieldRow).not.toContain('٫'); // no Persian decimal separator
  });

  it('keeps the snapshot order (id is the stable join key in column 1)', () => {
    const rows = buildInsightsCsv(snapshot, insightsCopyEn).split('\r\n');
    expect(rows[1]!.startsWith('yield-curve-10y2y,')).toBe(true);
    expect(rows[2]!.startsWith('us10y,')).toBe(true);
    expect(rows[3]!.startsWith('gold-usd,')).toBe(true);
  });

  it('renders the localized status word and the indicator name', () => {
    const rows = buildInsightsCsv(snapshot, insightsCopyEn).split('\r\n');
    expect(rows[2]!).toContain('Warning');
    expect(rows[2]!).toContain(insightsCopyEn.indicators.us10y.name);
  });

  it('leaves value/change/position/as-of cells EMPTY for unavailable rows', () => {
    const row = buildInsightsCsv(snapshot, insightsCopyEn).split('\r\n')[3]!;
    const cells = row.split(',');
    expect(cells[3]).toBe(''); // value
    expect(cells[6]).toBe(''); // 7d
    expect(cells[7]).toBe(''); // 30d
    expect(cells[8]).toBe(''); // position
    expect(cells[9]).toBe(''); // asOf
  });

  it('neutralizes spreadsheet formula injection in free-text columns (OWASP)', () => {
    const hostile: InsightsSnapshot = {
      ...snapshot,
      readings: [
        reading({ id: 'us10y', sourceName: '=HYPERLINK("http://evil")' }),
      ],
    } as unknown as InsightsSnapshot;
    const row = buildInsightsCsv(hostile, insightsCopyEn).split('\r\n')[1]!;
    expect(row).toContain('"\'=HYPERLINK'); // quoted + ' prefixed
  });
});

describe('insightsCsvFilename', () => {
  it('stamps the snapshot date into the download name', () => {
    expect(insightsCsvFilename('2026-10-07T15:46:25.777Z')).toBe('currena-insights-2026-10-07.csv');
  });
});
