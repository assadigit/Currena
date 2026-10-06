import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { fetchRbaSeries, RBA_TABLES, rbaTableUrl } from './rba';
import { parseRbaTableCsv } from '../parsers';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '..', '..', 'fixtures');

/**
 * Fixtures are the REAL RBA CSV bytes fetched from the ingestion venue
 * (GitHub Actions runner, probe run 37492764171, 2026-10-06) — the sandbox
 * itself is Akamai-blocked, so these recorded captures are the only honest
 * test basis (AGENTS.md rule 7: fixtures, never live sites).
 */
function fixtureText(name: string): string {
  return readFileSync(join(FIXTURES, name), 'utf-8');
}

describe('parseRbaTableCsv', () => {
  it('parses F1.1 (day-first dates) — cash rate target through Sep 2026', () => {
    const series = parseRbaTableCsv(fixtureText('rba-f1.1-data.csv'), {
      tablePrefix: 'F1.1',
      seriesTitle: 'Cash Rate Target',
    });
    expect(series.length).toBeGreaterThan(400);
    expect(series.at(-1)).toEqual({ date: '2026-09-30', value: 4.36 });
    // earliest cash-rate-target observation (the column starts empty in 1969)
    const first = series[0]!;
    expect(first.date).toMatch(/^19\d{2}-/);
    expect(first.value).toBeGreaterThan(0);
  });

  it('parses F2 (D-Mon-YYYY dates) — AU 10-year bond yield, daily', () => {
    const series = parseRbaTableCsv(fixtureText('rba-f2-data.csv'), {
      tablePrefix: 'F2',
      seriesTitle: 'Australian Government 10 year bond',
    });
    expect(series.length).toBeGreaterThan(3000);
    expect(series.at(-1)).toEqual({ date: '2026-09-30', value: 5.344 });
    expect(series[0]!.date).toBe('2013-05-20');
  });

  it('parses E2 (quarterly ratios) — future pre-scaffolded empty quarters skipped', () => {
    const series = parseRbaTableCsv(fixtureText('rba-e2-data.csv'), {
      tablePrefix: 'E2',
      seriesTitle: 'Household debt to income',
    });
    // The fixture scaffold runs to 31/03/2027; the last FILLED quarter is 2026-Q2
    // and the debt-to-income series itself only starts in 1988.
    expect(series.at(-1)).toEqual({ date: '2026-06-30', value: 178.4 });
    expect(series[0]!.date).toBe('1988-06-30');
  });

  it('fails loudly on a wrong table, a missing series title, or garbage', () => {
    const f11 = fixtureText('rba-f1.1-data.csv');
    expect(() => parseRbaTableCsv(f11, { tablePrefix: 'F2', seriesTitle: 'Cash Rate Target' })).toThrow(
      /does not start with "F2"/,
    );
    expect(() => parseRbaTableCsv(f11, { tablePrefix: 'F1.1', seriesTitle: 'No Such Series' })).toThrow(
      /no series titled/,
    );
    // A full-shape synthetic with a bad date fails on the date itself.
    const synthetic = [
      'F1.1 INTEREST RATES',
      'Title,Cash Rate Target',
      'Description,x',
      'Frequency,Monthly',
      'Type,Original',
      'Units,Per cent',
      '',
      'Source,RBA',
      'Publication date,01-Oct-2026',
      'Series ID,FIRMMCRT',
      '1/13/2026,4',
      'Weird-Row,4',
    ].join('\n');
    expect(() => parseRbaTableCsv(synthetic, { tablePrefix: 'F1.1', seriesTitle: 'Cash Rate Target' })).toThrow(
      /not a valid day-first/,
    );
    expect(() => parseRbaTableCsv(synthetic.replace('1/13/2026', '02/01/2026'), { tablePrefix: 'F1.1', seriesTitle: 'Cash Rate Target' })).toThrow(
      /neither a date nor a known metadata row/,
    );
  });
});

describe('rba adapter', () => {
  it('builds table URLs from the documented scheme', () => {
    expect(rbaTableUrl(RBA_TABLES.cashRate)).toBe('https://www.rba.gov.au/statistics/tables/csv/f1.1-data.csv');
    expect(rbaTableUrl(RBA_TABLES.au10y)).toBe('https://www.rba.gov.au/statistics/tables/csv/f2-data.csv');
  });

  it('fetches and parses through the fixture bytes (URL + parse halves joined)', async () => {
    const series = await fetchRbaSeries('au10y', {
      fetchImpl: (async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        if (url !== 'https://www.rba.gov.au/statistics/tables/csv/f2-data.csv') {
          throw new Error(`unexpected URL ${url}`);
        }
        return new Response(fixtureText('rba-f2-data.csv'), { status: 200 });
      }) as typeof fetch,
    });
    expect(series.at(-1)).toEqual({ date: '2026-09-30', value: 5.344 });
  });

  it('fails loudly on a 403 (the sandbox-venue behaviour)', async () => {
    const fetchImpl = (async () => new Response('Forbidden', { status: 403 })) as typeof fetch;
    await expect(fetchRbaSeries('cashRate', { fetchImpl })).rejects.toThrow(/HTTP 403/);
  });
});
