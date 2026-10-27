import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { fetchRbaSeries, parseRbaCashRateHtml, RBA_TABLES, rbaTableUrl } from './rba';
import { FormatChangedError } from './fetch-policy';
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

  it('parses F4.1 (Step-2 §B7) — PDRNTH, the paid rate on new household term deposits', () => {
    const series = parseRbaTableCsv(fixtureText('rba-f4.1-data.csv'), {
      tablePrefix: 'F4.1',
      seriesId: 'PDRNTH',
    });
    // The table's full extent: monthly since Jul-2019 (no 10-year history
    // exists — the definition records this honestly).
    expect(series[0]!.date).toBe('2019-07-31');
    // Venue-verified 2026-10-13: the Aug-2026 observation is 4.8% per annum
    // (table published 08-Oct-2026).
    expect(series.at(-1)).toEqual({ date: '2026-08-31', value: 4.8 });
    expect(series.length).toBe(86); // Jul-2019 → Aug-2026 inclusive
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

describe('parseRbaCashRateHtml — the HTML decision table (R10-1 regression)', () => {
  // The R10-1 fixture pins the CURRENT shape of the RBA cash-rate page
  // (venue-verified 2026-10-27 via WebFetch's egress — the build sandbox
  // and the Cloudflare Worker egress are both Akamai-blocked on every
  // rba.gov.au path this round; the parser itself handles the page
  // correctly, the production defect is purely venue-level blocking).
  // The header gained "%"-suffixed column titles since the original
  // parser was written; the substring match still accepts them. This
  // test pins the shape so a future RBA redesign that renames
  // "Effective Date" or drops "cash rate target" fails loudly.
  const html = fixtureText('rba-cash-rate-page.html');

  it('parses the current page shape — the latest decision (30 Sep 2026 +0.25 -> 4.60) is the live value', () => {
    const series = parseRbaCashRateHtml(html);
    expect(series.at(-1)).toEqual({ date: '2026-09-30', value: 4.6 });
    // The 12 Aug 2026 no-change decision and the 20 May 2026 -0.25 cut
    // pin the +/0/- change-points cases and the date-stability contract.
    const dates = series.map((p) => p.date);
    expect(dates).toContain('2026-08-12');
    expect(dates).toContain('2026-05-20');
  });

  it('handles pre-1990 range rows by taking the LOWER bound (the corridor convention)', () => {
    const series = parseRbaCashRateHtml(html);
    const range = series.find((p) => p.date === '1987-03-02');
    expect(range).toEqual({ date: '1987-03-02', value: 15.0 });
  });

  it('sorts ascending by date regardless of the page row order', () => {
    const series = parseRbaCashRateHtml(html);
    for (let i = 1; i < series.length; i += 1) {
      expect(series[i]!.date >= series[i - 1]!.date).toBe(true);
    }
  });

  it('stops at the next table (does not bleed "release" rows from an adjacent table)', () => {
    const series = parseRbaCashRateHtml(html);
    // The fixture's second table carries an "effective date" header
    // (lowercase) — the parser's header-end detection closes the
    // decision-table block, so no 2026-09-30 release row doubles in.
    const count = series.filter((p) => p.date === '2026-09-30').length;
    expect(count).toBe(1);
  });

  it('throws FormatChangedError when the decision-table header is missing', () => {
    // Replace the actual <th> cell (the comment at the top of the fixture
    // also mentions "Effective Date" — String.replace only hits the first
    // occurrence, so target the cell precisely).
    const broken = html.replace(
      '<th scope="col">Effective Date</th>',
      '<th scope="col">Date Effective</th>',
    );
    expect(() => parseRbaCashRateHtml(broken)).toThrow(FormatChangedError);
    expect(() => parseRbaCashRateHtml(broken)).toThrow(/header not found/);
  });

  it('throws FormatChangedError when the header is present but no rows carry a parseable target', () => {
    // Strip every numeric target cell out of the data rows: the parser
    // must fail loudly with "carried no rows" rather than return an
    // empty series.
    const broken = html
      .replace('>4.60<', '>—<')
      .replace('>4.35<', '>—<')
      .replace('>4.35<', '>—<')
      .replace('>4.35<', '>—<')
      .replace('>4.60<', '>—<')
      .replace('>15.00 to 15.50<', '>—<')
      .replace('>10.50<', '>—<');
    expect(() => parseRbaCashRateHtml(broken)).toThrow(FormatChangedError);
  });
});
