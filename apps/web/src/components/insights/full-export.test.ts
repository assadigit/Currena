/**
 * full-export.ts unit tests — the one-file "download all data" export
 * (owner request 2026-10-16): every displayed section lands in the MD /
 * TXT / CSV / XLSX documents, values stay machine-readable ASCII (the
 * insights-csv discipline), the CSV keeps RFC 4180 CRLF + the OWASP guard,
 * and the XLSX sheets carry real number cells.
 */

import { describe, expect, it } from 'vitest';
import type { FxSnapshot, IndicatorReading, InsightsSnapshot, MarketsSnapshot } from '@currena/core';
import {
  assembleExportDoc,
  buildInsightsExportFile,
  buildInsightsFullCsv,
  buildInsightsMarkdown,
  buildInsightsTxt,
  insightsExportFilename,
} from './full-export';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';

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
  pricesAsOf: '2026-10-07T15:13:00.000Z',
  ruleVersion: 2,
  readings: [
    reading({ id: 'yield-curve-10y2y', value: 0.48, change7d: 0.11, change30d: 0.07 }),
    reading({ id: 'us10y', value: 5.31, status: 'warning' }),
    // The prices board rows: gold prices + the context companions.
    reading({ id: 'gold-usd', value: 5586.2, change7d: 12.3, change30d: -4.1, percentile10y: 0.97 }),
    reading({ id: 'silver-usd', value: 121.3, status: 'context' }),
    reading({ id: 'btc-usd', value: 126198.07, status: 'context' }),
    reading({ id: 'gold-aud', value: 8420.5, status: 'context' }),
    // Connection legs (real-yields-gold + dollar-gold-oil read these).
    reading({ id: 'real-yield-10y', value: 2.1, status: 'normal' }),
    reading({ id: 'dollar-basket', value: 103.2, change30d: -1.4, status: 'normal' }),
    reading({ id: 'brent', value: 82.4, change30d: 3.9, status: 'normal' }),
    reading({
      id: 'gold-silver',
      value: null,
      asOf: null,
      change7d: undefined,
      change30d: undefined,
      percentile10y: undefined,
      status: 'unavailable',
      sourceName: 'gold-api.com',
    }),
  ],
  summary: {
    global: { section: 'global', label: 'cautious', warningCount: 4, votingCount: 14, excludedCount: 0 },
    australia: { section: 'australia', label: 'relaxed', warningCount: 1, votingCount: 10, excludedCount: 0 },
  },
  changedThisWeek: [{ id: 'us10y', from: 'normal', to: 'warning', asOf: '2026-10-06' }],
  calendar: [{ id: 'fed-2026-10', date: '2026-10-28', titleEn: 'Fed decision', titleFa: 'تصمیم فدرال رزرو', kind: 'fed' }],
} as unknown as InsightsSnapshot;

const markets = {
  generatedAt: '2026-10-07T00:00:00.000Z',
  summary: { signal: 'normal', count: 2, nAttention: 0, nUnusual: 0 },
  markets: [
    {
      id: 'sp500',
      asOf: '2026-10-06',
      close: 6746.53,
      chg1d: -0.65,
      chg3m: 3.2,
      fromHigh: -1.9,
      high52w: 6876.16,
      low52w: 4982.1,
      trend: 'flat',
      status: 'normal',
      source: 'eodhd',
      weekly: [[0, 6746.53]],
    },
    {
      id: 'n225',
      asOf: '2026-10-06',
      close: 48502.9,
      chg1d: 0.42,
      chg3m: 5.7,
      fromHigh: -3.4,
      high52w: 50212.5,
      low52w: 31458.4,
      trend: 'up',
      status: 'normal',
      source: 'eodhd',
      weekly: [[0, 48502.9]],
    },
  ],
} as unknown as MarketsSnapshot;

const fx = {
  generatedAt: '2026-10-07T00:00:00.000Z',
  summary: { signal: 'normal', nAttention: 0, nUnusual: 0 },
  rules: [],
  pairs: [
    {
      id: 'audjpy',
      asOf: '2026-10-07',
      rate: 101.23,
      chg: { d1: -0.31, m1: -2.4, m3: 1.1, y1: 3.3 },
      moveRank: 42,
      bigMove: false,
      source: 'frankfurter',
      stale: false,
      weekly: [[0, 101.23]],
    },
  ],
} as unknown as FxSnapshot;

const input = {
  snapshot,
  copy: insightsCopyEn,
  locale: 'en' as const,
  title: 'Insights',
  markets,
  fx,
};

describe('insightsExportFilename', () => {
  it('stamps the generated date and the format extension', () => {
    expect(insightsExportFilename('2026-10-07T15:46:25.777Z', 'md')).toBe('currena-insights-full-2026-10-07.md');
    expect(insightsExportFilename('2026-10-07T15:46:25.777Z', 'xlsx')).toBe('currena-insights-full-2026-10-07.xlsx');
  });
});

describe('assembleExportDoc', () => {
  it('carries every displayed section in page order', () => {
    const doc = assembleExportDoc(input);
    expect(doc.sections.map((s) => s.key)).toEqual([
      'verdicts',
      'prices',
      'markets',
      'fx',
      'connections',
      'signals',
      'indicators',
      'calendar',
      'changed',
    ]);
    const indicators = doc.sections.find((s) => s.key === 'indicators')!;
    expect(indicators.rows).toHaveLength(snapshot.readings.length);
  });

  it('renders the verdicts from the precomputed summary lines', () => {
    const doc = assembleExportDoc(input);
    const verdicts = doc.sections.find((s) => s.key === 'verdicts')!;
    expect(verdicts.rows[0]![6]).toBe('Cautious'); // copy.label.cautious
    expect(verdicts.rows[0]![21]).toBe('4 of 14 in warning');
    expect(verdicts.rows[1]![6]).toBe('Stable'); // copy.label.relaxed
  });

  it('keeps the prices board context lines on the gold row', () => {
    const doc = assembleExportDoc(input);
    const prices = doc.sections.find((s) => s.key === 'prices')!;
    const gold = prices.rows.find((r) => r[1] === 'gold-usd')!;
    expect(gold[14]).toBe('expensive'); // percentile 0.97 → the high band
    expect(String(gold[21])).toContain('22.6'); // btc ÷ gold, one decimal
    expect(String(gold[21])).toContain('1040'); // btc ÷ silver, no grouping
  });

  it('sorts the markets table worst-first (the page order)', () => {
    const doc = assembleExportDoc(input);
    const rows = doc.sections.find((s) => s.key === 'markets')!.rows;
    expect(rows[0]![1]).toBe('n225'); // fromHigh -3.4 is the worse row
    expect(rows[1]![1]).toBe('sp500');
  });
});

describe('buildInsightsMarkdown', () => {
  const md = buildInsightsMarkdown(input);

  it('opens with the page title and the meta bullet list', () => {
    expect(md.startsWith('# Insights\n')).toBe(true);
    expect(md).toContain('- What the world');
    expect(md).toContain('2026-10-07');
    expect(md).toContain('Rule version: 2');
  });

  it('renders one heading per displayed section', () => {
    expect(md).toContain('## Where things stand');
    expect(md).toContain('## Prices');
    expect(md).toContain('## World stock markets');
    expect(md).toContain('## World currencies');
    expect(md).toContain('## Together');
    expect(md).toContain('## What the signals say');
    expect(md).toContain('## Indicators');
    expect(md).toContain('## Next up');
    expect(md).toContain('## Changed this week');
  });

  it('keeps values machine-readable (ASCII digits, period decimals)', () => {
    expect(md).toContain('5586.2');
    expect(md).not.toMatch(/[\u06F0-\u06F9]/);
    expect(md).not.toContain('٬');
  });

  it('carries the connection and signal data', () => {
    expect(md).toContain('Real yields and gold');
    expect(md).toContain('Supports'); // a condition state word (conditionStateShort)
  });
});

describe('buildInsightsTxt', () => {
  it('is plain text: no markdown markup, same content', () => {
    const txt = buildInsightsTxt(input);
    expect(txt).not.toMatch(/^#/m);
    expect(txt).not.toContain(']( '); // no markdown links
    expect(txt).toContain('World stock markets');
    expect(txt).toContain('5586.2');
  });
});

describe('buildInsightsFullCsv', () => {
  it('emits CRLF line endings with a trailing CRLF (RFC 4180)', () => {
    const csv = buildInsightsFullCsv(input);
    expect(csv.endsWith('\r\n')).toBe(true);
    expect(csv).not.toMatch(/[^\r]\n/);
  });

  it('uses the stable 26-column flat header and 26-slot rows', () => {
    const csv = buildInsightsFullCsv(input);
    const lines = csv.split('\r\n').filter((l) => l !== '');
    expect(lines[0]!.split(',')).toHaveLength(26);
    expect(lines[0]).toContain('Section');
    // Row width at the DOC level (raw text lines can legally carry commas
    // inside quoted free-text fields — RFC 4180).
    const doc = assembleExportDoc(input);
    for (const section of doc.sections) {
      for (const row of section.rows) expect(row).toHaveLength(26);
    }
  });

  it('tags every row with its section and guards free-text columns', () => {
    const csv = buildInsightsFullCsv(input);
    expect(csv).toContain('World stock markets');
    expect(csv).toContain('Indicators');
    expect(csv).not.toMatch(/[\u06F0-\u06F9]/); // never a Persian digit
  });
});

describe('buildInsightsExportFile (xlsx)', () => {
  it('builds a real .xlsx blob (ZIP magic) with one sheet per section', async () => {
    const file = await buildInsightsExportFile(input, 'xlsx');
    expect(file.ext).toBe('xlsx');
    const bytes = new Uint8Array(await file.blob.arrayBuffer());
    expect(bytes[0]).toBe(0x50); // 'P'
    expect(bytes[1]).toBe(0x4b); // 'K'
    expect(bytes.length).toBeGreaterThan(1000);
    const sheets = (await import('./full-export')).buildInsightsXlsxSheets(input);
    expect(sheets.map((s) => s.name)).toContain('Insights'); // the meta sheet
    expect(sheets.map((s) => s.name)).toContain('Indicators');
    const indicators = sheets.find((s) => s.name === 'Indicators')!;
    expect(indicators.rows[0]).toEqual(expect.arrayContaining(['ID', 'Indicator', 'Value'])); // header row
    expect(indicators.rows).toHaveLength(1 + snapshot.readings.length); // header + data
  });

  it('builds each text format with the right MIME type', async () => {
    for (const format of ['md', 'txt', 'csv'] as const) {
      const file = await buildInsightsExportFile(input, format);
      expect(file.blob.size).toBeGreaterThan(200);
      expect(file.blob.type).toContain('text/');
    }
  });
});

describe('locale coverage', () => {
  it('renders localized names and words in fa (values stay ASCII)', () => {
    const md = buildInsightsMarkdown({ ...input, copy: insightsCopyFa, locale: 'fa' });
    expect(md).toContain('تصمیم فدرال رزرو'); // the calendar titleFa
    expect(md).toContain('5586.2'); // values stay machine-readable in every locale
    expect(md).toContain('| 5.31 |'); // the us10y reading's value cell is untouched ASCII
  });
});
