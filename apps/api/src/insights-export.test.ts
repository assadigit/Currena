/**
 * insights-export.test.ts — M-3 (RULES.md §3, defect E-23): the OWNER-ONLY full
 * export's pure builders. The server-side document mirrors the web export's
 * STRUCTURE (apps/web/src/components/insights/full-export.ts — section order,
 * per-section tables, MD/CSV renderers) from server data: the private
 * snapshot + the boards + the bundled indicator-audit sidecar. The required
 * E-23 columns (level, owner_accepts, enabled, peak, rule JSON verbatim, …)
 * are pinned here.
 */

import { describe, expect, it } from 'vitest';
import type { FxSnapshot, InsightsSnapshot, MarketsSnapshot } from '@currena/core';
import { buildInsightsExportDoc, renderExportCsv, renderExportMarkdown } from './insights-export';

/* ------------------------- contract-valid fixtures ------------------------- */

const snapshot: InsightsSnapshot = {
  generatedAt: '2026-10-12T04:20:00.000Z',
  summary: {
    global: { section: 'global', label: 'cautious', warningCount: 1, votingCount: 11, excludedCount: 1 },
    australia: { section: 'australia', label: null, warningCount: 0, votingCount: 6, excludedCount: 2 },
  },
  readings: [
    {
      id: 'brent',
      value: 107.14,
      asOf: '2026-10-12',
      status: 'normal',
      change7d: 2.1,
      change30d: -1.5,
      percentile10y: 0.82,
      fromPeak10y: -12.3,
      peak: { value: 128.5, date: '2022-03-07', basis: 'daily-close' },
      sourceName: 'FRED (DCOILBRENTEU)',
      sourceUrl: 'https://fred.stlouisfed.org/series/DCOILBRENTEU',
      updatedAt: '2026-10-12T12:13:00.000Z',
    },
    {
      id: 'us10y',
      value: 3.9,
      asOf: '2026-10-06',
      status: 'normal',
      releaseDate: '2026-10-07',
      sourceName: 'FRED (DGS10)',
      sourceUrl: 'https://fred.stlouisfed.org/series/DGS10',
      updatedAt: '2026-10-07T04:20:00.000Z',
    },
    {
      id: 'ecb-dfr',
      value: 3.5,
      asOf: '2026-09-30',
      status: 'stale',
      sourceName: 'ECB Data Portal',
      updatedAt: '2026-10-01T04:20:00.000Z',
    },
  ],
  changedThisWeek: [{ id: 'brent', from: 'normal', to: 'warning', asOf: '2026-10-08' }],
  calendar: [
    { id: 'rba-2026-11', date: '2026-11-03', titleEn: 'RBA meeting', titleFa: 'جلسه RBA', kind: 'rba' },
  ],
  ruleVersion: 2,
};

const markets: MarketsSnapshot = {
  v: 1,
  generatedAt: '2026-10-12T23:31:00Z',
  markets: [
    {
      id: 'sp500',
      asOf: '2026-10-12',
      close: 5000,
      chg1d: 0.5,
      chg1m: 1.2,
      chg3m: 3,
      high52w: 5100,
      low52w: 4500,
      fromHigh: -2,
      rangePos: 85,
      trend: 'up',
      status: 'normal',
      source: 'eodhd',
      stale: false,
      weekly: [[0, 4500], [7, 4600]],
    },
    {
      id: 'n225',
      asOf: '2026-10-12',
      close: 38000,
      chg1d: -0.4,
      chg3m: -8,
      high52w: 42000,
      low52w: 36000,
      fromHigh: -9.5,
      rangePos: 33,
      trend: 'down',
      status: 'normal',
      source: 'eodhd',
      stale: false,
      weekly: [[0, 37000], [7, 37500]],
    },
  ],
  summary: { count: 2, roseToday: 1, nAttention: 0, nUnusual: 0, signal: 'normal', worstGroup: null },
};

const fx: FxSnapshot = {
  v: 1,
  generatedAt: '2026-10-13T17:01:00Z',
  dollarMeasure: {
    asOf: '2026-10-13',
    value: 100,
    chg: { d1: 0, m1: 0, m3: 0, y1: 0 },
    weekly: [[0, 100], [7, 101]],
  },
  pairs: [
    {
      id: 'eurusd',
      asOf: '2026-10-13',
      rate: 1.0875,
      chg: { d1: 0.1, m1: -1, m3: -2, y1: 3 },
      moveRank: 40,
      bigMove: false,
      source: 'frankfurter',
      stale: false,
      weekly: [[0, 1.05], [7, 1.06]],
    },
  ],
  rules: [],
  summary: { signal: 'normal', countedWarnings: 0, headlineRule: null },
};

/* ------------------------------- the document ------------------------------ */

describe('buildInsightsExportDoc — section order mirrors the web export', () => {
  it('orders sections verdicts → prices → markets → fx → connections → signals → indicators → calendar → changed', () => {
    const doc = buildInsightsExportDoc({ snapshot, markets, fx });
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
  });

  it('omits the markets/fx sections when their boards are absent (calm degradation)', () => {
    const doc = buildInsightsExportDoc({ snapshot, markets: null, fx: null });
    expect(doc.sections.map((s) => s.key)).not.toContain('markets');
    expect(doc.sections.map((s) => s.key)).not.toContain('fx');
  });

  it('carries the meta floor: generated date, data date, rule version, contact URL', () => {
    const doc = buildInsightsExportDoc({ snapshot, markets: null, fx: null });
    expect(doc.heading).toBe('Currena Insights');
    expect(doc.metaLines.join('\n')).toContain('2026-10-12'); // generated (UTC date)
    expect(doc.metaLines.join('\n')).toContain('2'); // rule version
    expect(doc.metaLines.join('\n')).toContain('https://github.com/assadigit/Currena');
  });

  it('the prices section holds the prices-board rows (brent), worst-relevant fields intact', () => {
    const doc = buildInsightsExportDoc({ snapshot, markets: null, fx: null });
    const prices = doc.sections.find((s) => s.key === 'prices')!;
    expect(prices.rows.length).toBeGreaterThan(0);
    const row = prices.rows.find((r) => r[0] === 'brent')!;
    expect(row).toContain(107.14);
    expect(row).toContain(128.5); // the peak value
    expect(row).toContain('2022-03-07'); // the peak date
    expect(row).toContain('daily-close'); // the peak basis
  });

  it('the markets section is worst-first (sorted by distance below the 52-week high)', () => {
    const doc = buildInsightsExportDoc({ snapshot, markets, fx });
    const marketsSection = doc.sections.find((s) => s.key === 'markets')!;
    expect(marketsSection.rows[0]![0]).toBe('n225'); // fromHigh -9.5 sorts before -2
    expect(marketsSection.rows[1]![0]).toBe('sp500');
  });
});

describe('buildInsightsExportDoc — the indicators section (defect E-23 columns)', () => {
  const doc = buildInsightsExportDoc({ snapshot, markets: null, fx: null });
  const indicators = doc.sections.find((s) => s.key === 'indicators')!;

  it('carries every E-23 column header', () => {
    for (const header of [
      'id', 'title', 'value', 'unit', 'status', 'dataDate', 'publishedDate', 'stale',
      'fetchedAt', 'sourceName', 'sourceUrl', 'licenceName', 'level', 'ownerAccepts',
      'enabled', 'peakValue', 'peakDate', 'peakBasis', 'ruleVersion', 'rule',
    ]) {
      expect(indicators.headers, `missing column: ${header}`).toContain(header);
    }
  });

  it('titles come from the indicator definitions (the registry’s English names)', () => {
    const us10y = indicators.rows.find((r) => r[0] === 'us10y')!;
    expect(us10y[1]).toBe('US 10-year Treasury yield');
  });

  it('the unit column is derived from the registry’s changeKind (points → percentage points, pct → %)', () => {
    const us10y = indicators.rows.find((r) => r[0] === 'us10y')!;
    const brent = indicators.rows.find((r) => r[0] === 'brent')!;
    expect(us10y[indicators.headers.indexOf('unit')]).toBe('percentage points');
    expect(brent[indicators.headers.indexOf('unit')]).toBe('%');
  });

  it('audit columns: level/ownerAccepts/enabled/licenceName + the rule JSON VERBATIM', () => {
    const brent = indicators.rows.find((r) => r[0] === 'brent')!;
    expect(brent[indicators.headers.indexOf('level')]).toBe('L2');
    expect(brent[indicators.headers.indexOf('ownerAccepts')]).toBe('true');
    expect(brent[indicators.headers.indexOf('enabled')]).toBe('true');
    expect(String(brent[indicators.headers.indexOf('licenceName')])).toContain('No reuse licence offered');
    // Verbatim rule JSON — the raw audit string, never re-serialized.
    expect(brent[indicators.headers.indexOf('rule')]).toBe(
      '{"kind":"change","mode":"pct","direction":"rise","magnitude":25,"windowWeeks":13}',
    );
  });

  it('peak value/date/basis ride the row where present, blank where absent', () => {
    const brent = indicators.rows.find((r) => r[0] === 'brent')!;
    const us10y = indicators.rows.find((r) => r[0] === 'us10y')!;
    expect(brent[indicators.headers.indexOf('peakValue')]).toBe(128.5);
    expect(brent[indicators.headers.indexOf('peakDate')]).toBe('2022-03-07');
    expect(brent[indicators.headers.indexOf('peakBasis')]).toBe('daily-close');
    expect(us10y[indicators.headers.indexOf('peakValue')]).toBeNull();
  });

  it('the stale flag carries its age in days (the snapshot’s own clock, never the wall clock)', () => {
    const ecb = indicators.rows.find((r) => r[0] === 'ecb-dfr')!;
    // asOf 2026-09-30 vs generated 2026-10-12 → 12 days.
    expect(ecb[indicators.headers.indexOf('stale')]).toBe('yes (12 days)');
    const us10y = indicators.rows.find((r) => r[0] === 'us10y')!;
    expect(us10y[indicators.headers.indexOf('stale')]).toBe('no');
  });

  it('published (release) date and fetched time and source URL ride the row', () => {
    const us10y = indicators.rows.find((r) => r[0] === 'us10y')!;
    expect(us10y[indicators.headers.indexOf('publishedDate')]).toBe('2026-10-07');
    expect(us10y[indicators.headers.indexOf('fetchedAt')]).toBe('2026-10-07T04:20:00.000Z');
    expect(us10y[indicators.headers.indexOf('sourceUrl')]).toBe('https://fred.stlouisfed.org/series/DGS10');
  });
});

/* -------------------------------- renderers -------------------------------- */

describe('renderExportMarkdown', () => {
  const md = renderExportMarkdown(buildInsightsExportDoc({ snapshot, markets, fx }));

  it('renders the title, the meta floor and one heading + table per section', () => {
    expect(md).toContain('# Currena Insights');
    expect(md).toContain('## Indicators');
    expect(md).toContain('## World stock markets');
    expect(md).toContain('| id | title | value |');
  });

  it('spot-checks: the E-23 columns and the audit values appear (level/ownerAccepts/enabled)', () => {
    expect(md).toContain('ownerAccepts');
    expect(md).toContain('L2');
    expect(md).toContain('enabled');
  });

  it('escapes pipe characters in cell values (a licence name with a pipe cannot break the table)', () => {
    const doc = buildInsightsExportDoc({ snapshot, markets: null, fx: null });
    const row = doc.sections.find((s) => s.key === 'indicators')!.rows[0]!;
    row[0] = 'bre|nt';
    const broken = renderExportMarkdown(doc);
    expect(broken).toContain('bre\\|nt');
  });
});

describe('renderExportCsv', () => {
  const csv = renderExportCsv(buildInsightsExportDoc({ snapshot, markets, fx }));

  it('is UTF-8 with BOM (Excel on every locale decodes it) and CRLF-terminated (RFC 4180)', () => {
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('\r\n');
    expect(csv.endsWith('\r\n')).toBe(true);
  });

  it('writes one dense block per section with its own header row', () => {
    expect(csv).toContain('Indicators');
    expect(csv).toContain('id,title,value,unit,status,dataDate,publishedDate,stale');
  });

  it('neutralises formula-injecting cell values (OWASP guard, like the web export)', () => {
    const doc = buildInsightsExportDoc({ snapshot, markets: null, fx: null });
    doc.sections.find((s) => s.key === 'indicators')!.rows[0]![0] = '=SUM(A1:A9)';
    const guarded = renderExportCsv(doc);
    // The OWASP prefix guard, the web export's own discipline: the hostile
    // cell is emitted 'prefixed, so spreadsheets read it as TEXT.
    expect(guarded).toContain("'=SUM(A1:A9)");
    const cellLine = guarded.split('\r\n').find((line) => line.includes('SUM(A1:A9)'))!;
    expect(cellLine.trim().startsWith("'=SUM")).toBe(true);
  });
});
