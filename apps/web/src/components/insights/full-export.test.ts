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
    reading({
      id: 'gold-usd',
      value: 5586.2,
      change7d: 12.3,
      change30d: -4.1,
      percentile10y: 0.97,
      peak: { value: 5590, date: '2026-01-28', basis: 'daily-high' },
      fromPeak10y: -22.6,
    }),
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
      chg1w: 0.8,
      chg1m: 1.9,
      chg3m: 3.2,
      chg1y: 12.1,
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
      chg1w: -0.3,
      chg1m: 2.4,
      chg3m: 5.7,
      chg1y: 14.8,
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

  it('keeps the prices board context lines on the right rows (E-03 futures note, E-13 BTC lines on bitcoin only)', () => {
    const doc = assembleExportDoc(input);
    const prices = doc.sections.find((s) => s.key === 'prices')!;
    const gold = prices.rows.find((r) => r[1] === 'gold-usd')!;
    const btc = prices.rows.find((r) => r[1] === 'btc-usd')!;
    const brent = prices.rows.find((r) => r[1] === 'brent')!;
    expect(gold[14]).toBe('expensive'); // percentile 0.97 → the high band
    // E-03: the futures wording rides the Brent/gold/silver detail lines.
    expect(String(gold[21])).toContain('futures');
    expect(String(brent[21])).toContain('futures');
    expect(String(brent[21])).not.toContain('oz of gold'); // E-13: not on Brent
    expect(String(gold[21])).not.toContain('oz of gold'); // E-13: not on gold
    // E-13: the bitcoin-buying sentences live on the bitcoin row only.
    expect(String(btc[21])).toContain('22.6'); // btc ÷ gold, one decimal
    expect(String(btc[21])).toContain('1040'); // btc ÷ silver, no grouping
  });

  it('carries the peak columns on the price rows (E-24)', () => {
    const doc = assembleExportDoc(input);
    const prices = doc.sections.find((s) => s.key === 'prices')!;
    expect(prices.headers).toEqual(expect.arrayContaining(['Peak', 'Peak date', 'Peak basis', 'Below peak %']));
    const gold = prices.rows.find((r) => r[1] === 'gold-usd')!;
    // gold peak 5590 (T-05 floor) on 28 Jan 2026, daily-high basis
    expect(gold[34]).toBe(5590);
    expect(gold[35]).toBe('2026-01-28');
    expect(gold[36]).toBe('highest daily high');
    expect(gold[37]).toBeCloseTo(-22.6, 0);
  });

  it('sorts the markets table worst-first (the page order)', () => {
    const doc = assembleExportDoc(input);
    const rows = doc.sections.find((s) => s.key === 'markets')!.rows;
    expect(rows[0]![1]).toBe('n225'); // fromHigh -3.4 is the worse row
    expect(rows[1]![1]).toBe('sp500');
  });

  it('carries the round-46/47 lens columns in the markets block (slots 7/10/12, header order pinned)', () => {
    const doc = assembleExportDoc(input);
    const section = doc.sections.find((s) => s.key === 'markets')!;
    expect(section.headers).toEqual([
      'Market',
      'Today %',
      '1 week %',
      '1 month %',
      '3 months %',
      '1 year %',
      'From 52-week high %',
      'Trend',
      'Status',
      'Last close',
      '52-week high',
      '52-week low',
      'As of',
      'Source',
    ]);
    // The flat rows carry the lenses on the existing 7-day/1-month/1-year
    // slots — n225 is the worst row (first), sp500 second.
    expect(section.rows[0]![7]).toBe(-0.3);
    expect(section.rows[0]![10]).toBe(2.4);
    expect(section.rows[0]![12]).toBe(14.8);
    expect(section.rows[1]![7]).toBe(0.8);
    expect(section.rows[1]![10]).toBe(1.9);
    expect(section.rows[1]![12]).toBe(12.1);
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
    expect(md).toContain('## Summary of the gauges below'); // L3-01 rename
    expect(md).toContain('## Prices');
    // The world-indices handoff round renamed the section's editorial
    // title (markets.title) — the export heading follows the dictionary.
    expect(md).toContain('## The pulse of world markets');
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
    expect(txt).toContain('The pulse of world markets');
    expect(txt).toContain('5586.2');
  });
});

describe('buildInsightsFullCsv', () => {
  /** Tiny RFC-4180 parser for block assertions (mirrors strict readers). */
  function parseCsv(text: string): string[][] {
    const out: string[][] = [];
    let field = '';
    let row: string[] = [];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i]!;
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else inQuotes = false;
        } else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\r') {
        row.push(field);
        out.push(row);
        row = [];
        field = '';
        if (text[i + 1] === '\n') i++;
      } else if (c === '\n') {
        row.push(field);
        out.push(row);
        row = [];
        field = '';
      } else field += c;
    }
    if (field !== '' || row.length > 0) {
      row.push(field);
      out.push(row);
    }
    return out;
  }

  const csv = buildInsightsFullCsv(input);
  const rows = parseCsv(csv.slice(1)); // slice off the BOM

  it('opens with the UTF-8 BOM (BOM-less CSV decodes as ANSI-1256 on fa Excel)', () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('emits CRLF line endings with a trailing CRLF (RFC 4180)', () => {
    expect(csv.endsWith('\r\n')).toBe(true);
    expect(csv).not.toMatch(/[^\r]\n/);
  });

  it('leads with the title + the meta floor as single-cell rows', () => {
    expect(rows[0]).toEqual(['Insights']);
    // Meta floor: subtitle first, then the data-as-of line with the date.
    expect(rows.slice(1, 5).some((r) => r[0]?.includes('2026-10-07'))).toBe(true);
  });

  it('renders one dense block per section: heading, own header, rows', () => {
    const doc = assembleExportDoc(input);
    let at = 0;
    for (const section of doc.sections) {
      const headingAt = rows.findIndex((r, i) => i >= at && r.length === 1 && r[0] === section.heading);
      expect(headingAt).toBeGreaterThanOrEqual(at); // the heading row exists, in order
      const cursor = headingAt + 1 + section.lines.length;
      expect(rows[cursor]).toHaveLength(section.headers.length); // the block's own header
      let count = 0;
      for (let i = cursor + 1; i < rows.length && rows[i]!.length > 1; i++) count++;
      expect(count).toBe(section.rows.length); // every row is present and dense
      at = cursor + 1 + section.rows.length;
    }
  });

  it('carries the indicators block at full depth (snapshot order) with the E-23 audit columns', () => {
    const indicators = rows.findIndex((r) => r.length === 1 && r[0] === 'Indicators');
    expect(indicators).toBeGreaterThan(0);
    // 12 display columns + the 8 E-23 audit columns.
    expect(rows[indicators + 1]).toHaveLength(20);
    expect(rows[indicators + 1]).toEqual(
      expect.arrayContaining(['Published', 'Stale', 'Source URL', 'Licence', 'Private only', 'Public display OK', 'Rule version', 'Thresholds (rule JSON)']),
    );
    expect(rows[indicators + 2]![0]).toBe('yield-curve-10y2y'); // snapshot order, first reading
    // The audit facts ride the row: licence name + public verdict + rule JSON.
    const firstDataRow = rows[indicators + 2]!;
    // CSV cells are POSITIONAL (the section's own 20 columns): licence 15,
    // private-only 16, public verdict 17, thresholds 19.
    expect(String(firstDataRow[15])).toContain('FRED'); // licence column
    expect(['yes', 'no', 'unknown']).toContain(String(firstDataRow[17])); // public-display verdict
    expect(['yes', 'no']).toContain(String(firstDataRow[16])); // private-only flag
    expect(() => JSON.parse(String(firstDataRow[19]))).not.toThrow(); // the rule JSON is valid
    // Whole-file audit: title + meta floor + per rendered section one
    // blank + heading + header + its lines + its rows (computed, no hardcode).
    const doc = assembleExportDoc(input);
    const rendered = doc.sections.filter((s) => s.rows.length > 0);
    const dataRows = rendered.reduce((n, s) => n + s.rows.length + s.lines.length, 0);
    expect(rows).toHaveLength(1 + doc.metaLines.length + dataRows + 3 * rendered.length);
  });

  it('stays machine-readable: ASCII digits, no Persian numerals', () => {
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
