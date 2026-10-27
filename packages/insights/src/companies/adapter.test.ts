import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  CompanyAdapterError,
  CompanyEodResponseSchema,
  CompanyEodRowSchema,
  deriveCompanyReading,
  fetchCompanyEod,
  parseCompanyEodResponse,
} from './adapter';
import {
  COMPANIES,
  COMPANIES_COUNT,
  COMPANY_EXCHANGE_LABELS,
  companyByTicker,
} from './definitions';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '..', '..', 'fixtures', 'companies');

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURES, name), 'utf-8'));
}

describe('companies config (R10-3)', () => {
  it('carries ~50 world-leading companies (the R9-09 directive, expanded)', () => {
    expect(COMPANIES_COUNT).toBeGreaterThanOrEqual(45);
    expect(COMPANIES_COUNT).toBeLessThanOrEqual(55);
  });

  it('every ticker is unique (no ADR duplicates)', () => {
    const tickers = COMPANIES.map((c) => c.ticker);
    expect(new Set(tickers).size).toBe(tickers.length);
  });

  it('every exchange label resolves (no orphan exchange ids)', () => {
    for (const c of COMPANIES) {
      expect(COMPANY_EXCHANGE_LABELS[c.exchange], `label for ${c.ticker}`).toBeDefined();
    }
  });

  it('every name is Latin-script (R10-3: names stay Latin in both locales)', () => {
    for (const c of COMPANIES) {
      // Latin letters, digits, punctuation, spaces — no Arabic/CJK script in the name.
      expect(c.name).toMatch(/^[\p{Letter}\p{Number}\s\-'.&(),]+$/u);
      expect(c.name).not.toMatch(/[\u0600-\u06FF\u4E00-\u9FFF\u3040-\u30FF]/u);
    }
  });

  it('companyByTicker resolves a known ticker and throws on an unknown one', () => {
    expect(companyByTicker('AAPL.US').name).toBe('Apple');
    expect(() => companyByTicker('UNKNOWN.X')).toThrow(/no ticker/);
  });

  it('the owner\'s R9-09 sample is present (Nvidia, Microsoft, Apple, SAP, ASML, LVMH, Toyota, Sony)', () => {
    const byName = new Map(COMPANIES.map((c) => [c.name, c.ticker]));
    expect(byName.has('Nvidia')).toBe(true);
    expect(byName.has('Microsoft')).toBe(true);
    expect(byName.has('Apple')).toBe(true);
    expect(byName.has('SAP')).toBe(true);
    expect(byName.has('ASML Holding')).toBe(true);
    expect(byName.has('Toyota Motor')).toBe(true);
    expect(byName.has('Sony Group')).toBe(true);
    // LVMH's full name on EODHD carries diacritics + apostrophe.
    const lvmh = COMPANIES.find((c) => c.ticker === 'MC.PA');
    expect(lvmh?.name).toMatch(/LVMH/);
  });
});

describe('CompanyEodRowSchema (the zod contract)', () => {
  it('accepts a real EODHD row (close + adjusted_close + the optional fields)', () => {
    const row = {
      date: '2026-10-22',
      open: 347.5,
      high: 348.4,
      low: 346.5,
      close: 347.725,
      adjusted_close: 347.725,
      volume: 10180000,
    };
    expect(() => CompanyEodRowSchema.parse(row)).not.toThrow();
  });

  it('accepts a row WITHOUT adjusted_close (the contract prefers close as the fallback)', () => {
    const row = { date: '2026-10-22', close: 347.725 };
    expect(() => CompanyEodRowSchema.parse(row)).not.toThrow();
  });

  it('accepts the trailing warning row EODHD appends on the free plan (the markets-board convention)', () => {
    // The free plan appends {warning: "..."} to the LAST row; the schema
    // treats every non-date-keyed field as optional, so the warning row
    // fails its OWN date check (no date field) and is dropped at the
    // array level — but a warning field on a normal row is harmless.
    const row = { date: '2026-10-22', close: 347.725, warning: 'free plan' };
    expect(() => CompanyEodRowSchema.parse(row)).not.toThrow();
  });

  it('rejects a row with a bad date (the contract fails loudly on a layout change)', () => {
    const row = { date: '22-Oct-2026', close: 347.725 };
    expect(() => CompanyEodRowSchema.parse(row)).toThrow();
  });

  it('rejects a row with a non-positive close (R1 — never render garbage)', () => {
    expect(() => CompanyEodRowSchema.parse({ date: '2026-10-22', close: 0 })).toThrow();
    expect(() => CompanyEodRowSchema.parse({ date: '2026-10-22', close: -5 })).toThrow();
    expect(() => CompanyEodRowSchema.parse({ date: '2026-10-22', close: Number.NaN })).toThrow();
  });
});

describe('parseCompanyEodResponse (the pure parser)', () => {
  it('parses the AAPL.US fixture (8 daily bars + the trailing warning row)', () => {
    const points = parseCompanyEodResponse('AAPL.US', fixture('companies-eod-aapl-us.json'));
    expect(points.length).toBe(8);
    expect(points.at(-1)).toEqual({ date: '2026-10-23', value: 347.725 });
    // ascending by date
    for (let i = 1; i < points.length; i += 1) {
      expect(points[i]!.date > points[i - 1]!.date).toBe(true);
    }
  });

  it('parses the SAP.XETRA fixture (7 daily bars, no warning row)', () => {
    const points = parseCompanyEodResponse('SAP.XETRA', fixture('companies-eod-sap-xetra.json'));
    expect(points.length).toBe(7);
    expect(points.at(-1)).toEqual({ date: '2026-10-22', value: 216.65 });
  });

  it('throws CompanyAdapterError("empty") on the FTSE-on-free-key shape (no rows)', () => {
    expect(() => parseCompanyEodResponse('UNKNOWN.X', [])).toThrow(CompanyAdapterError);
    expect(() => parseCompanyEodResponse('UNKNOWN.X', [])).toThrow(/empty/);
  });

  it('throws CompanyAdapterError("bad-json") on a non-array response', () => {
    expect(() => parseCompanyEodResponse('AAPL.US', { not: 'an array' })).toThrow(/bad-json/);
  });

  it('throws CompanyAdapterError("empty") when no row carries a string date (the trailing-warning-only case)', () => {
    // A response whose only entries lack `date` (e.g. a single
    // {warning: "..."} object) — the parser's pre-filter drops it, and
    // the empty candidate list surfaces as `empty`, not `bad-json`.
    expect(() => parseCompanyEodResponse('AAPL.US', [{ close: 100 }])).toThrow(/empty/);
    expect(() => parseCompanyEodResponse('AAPL.US', [{ warning: 'free plan' }])).toThrow(/empty/);
  });
});

describe('deriveCompanyReading (the UI row shape)', () => {
  it('lifts the latest close + the daily change % + the trailing 7-day sparkline', () => {
    const points = parseCompanyEodResponse('AAPL.US', fixture('companies-eod-aapl-us.json'));
    const reading = deriveCompanyReading('AAPL.US', points);
    expect(reading.company.name).toBe('Apple');
    expect(reading.price).toBe(347.725);
    expect(reading.asOf).toBe('2026-10-23');
    // Daily change: (347.725 - 347.725) / 347.725 * 100 = 0 (AAPL closed flat 10-22 → 10-23).
    expect(reading.dailyChangePct).toBeCloseTo(0, 5);
    expect(reading.sparkline.length).toBe(7);
    expect(reading.sparkline.at(-1)).toBe(347.725);
  });

  it('computes a non-zero daily change (SAP: 216.55 → 216.65 = +0.0462%)', () => {
    const points = parseCompanyEodResponse('SAP.XETRA', fixture('companies-eod-sap-xetra.json'));
    const reading = deriveCompanyReading('SAP.XETRA', points);
    expect(reading.price).toBe(216.65);
    expect(reading.asOf).toBe('2026-10-22');
    expect(reading.dailyChangePct).toBeCloseTo(((216.65 - 216.55) / 216.55) * 100, 4);
  });

  it('returns dailyChangePct: 0 when the series has only one row (no previous close)', () => {
    const reading = deriveCompanyReading('AAPL.US', [{ date: '2026-10-22', value: 100 }]);
    expect(reading.dailyChangePct).toBe(0);
    expect(reading.sparkline).toEqual([100]);
  });

  it('throws on an unknown ticker (the config is the source of truth, never the response)', () => {
    expect(() => deriveCompanyReading('UNKNOWN.X', [{ date: '2026-10-22', value: 100 }])).toThrow(
      /no ticker/,
    );
  });

  it('throws on an empty series (never render a row with no data)', () => {
    expect(() => deriveCompanyReading('AAPL.US', [])).toThrow(CompanyAdapterError);
  });
});

describe('fetchCompanyEod (the fetch stub — exercised by tests, never by the cron)', () => {
  it('joins the URL + parses the response against the contract', async () => {
    const seenUrls: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      seenUrls.push(url);
      return new Response(JSON.stringify(fixture('companies-eod-aapl-us.json')), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;
    const points = await fetchCompanyEod('AAPL.US', {
      apiToken: 'test-token',
      from: '2026-09-22',
      fetchImpl,
    });
    expect(points.length).toBe(8);
    // The URL shape mirrors the markets board's fetchEodhdSeries.
    expect(seenUrls[0]).toContain('/eod/AAPL.US?api_token=test-token&fmt=json&period=d&from=2026-09-22');
  });

  it('throws CompanyAdapterError("transport") on a 403 (the Akamai-edges case)', async () => {
    const fetchImpl = (async () => new Response('Forbidden', { status: 403 })) as typeof fetch;
    await expect(
      fetchCompanyEod('AAPL.US', { apiToken: 'test-token', fetchImpl }),
    ).rejects.toThrow(CompanyAdapterError);
    await expect(
      fetchCompanyEod('AAPL.US', { apiToken: 'test-token', fetchImpl }),
    ).rejects.toThrow(/transport/);
  });

  it('throws CompanyAdapterError("transport") when no api token is set', async () => {
    await expect(
      fetchCompanyEod('AAPL.US', { apiToken: '', fetchImpl: (async () => new Response()) as typeof fetch }),
    ).rejects.toThrow(/no api token/);
  });

  it('throws CompanyAdapterError("transport") on an unknown ticker (rejected before any fetch)', async () => {
    await expect(
      fetchCompanyEod('UNKNOWN.X', { apiToken: 'test-token', fetchImpl: (async () => new Response()) as typeof fetch }),
    ).rejects.toThrow(/no ticker/);
  });
});

describe('CompanyEodResponseSchema (the full response contract)', () => {
  it('accepts the real AAPL fixture (8 rows + the trailing warning row fails its own date check at the row level)', () => {
    // The trailing warning object {warning: "..."} has no `date` field, so
    // the row schema rejects it — but the ARRAY schema is `array(row)`,
    // which would reject the whole array. The PARSER therefore filters
    // non-conforming rows BEFORE the array schema (see parseCompanyEodResponse:
    // the `if (!Array.isArray(json))` early check, then the array parse).
    // The fixture's warning row would make `CompanyEodResponseSchema.parse`
    // throw — the parser handles this by catching the zod error.
    const json = fixture('companies-eod-aapl-us.json') as unknown[];
    // The schema DOES reject the warning row (no date).
    expect(() => CompanyEodResponseSchema.parse(json)).toThrow();
    // But the parser tolerates it (the response is still a JSON array of
    // row-shaped objects; the parser drops the warning row before zod sees it).
    const points = parseCompanyEodResponse('AAPL.US', json);
    expect(points.length).toBe(8);
  });
});
