/**
 * collect-fallback.test.ts — the 2026-10-22 reliability round's FALLBACK
 * wiring + the GPE R07 Treasury-primary overlay, as seen from the collect
 * layer. Global fetch stubbed (rule 7): FRED's bulk groups answer either
 * the healthy shape or the malformed body class the Worker venue observed
 * live (a 200 that is not the expected CSV — 'unexpected header'), and the
 * Treasury CSVs + EIA workbooks answer locally. The assertions pin the
 * terms: since R07 the Treasury curves fetch EVERY run (the yield family's
 * PRIMARY — 2 subrequests), the overlay extends each yield slot STRICTLY
 * PAST FRED's last date with honest attribution overrides, a material
 * cross-check disagreement fails the Treasury tail closed to FRED's
 * mirror, the EIA fallbacks still fire only on group failure, and the
 * stored-history merge keeps the percentile base on FRED-failure days.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { collectAllSources } from './collect';

/** The live Treasury nominal header (treasury.test.ts pins the parse).
 * GPE R07: "3 Mo" joins the required set (the T10Y3M leg). */
const TREASURY_NOMINAL = [
  'Date,"1 Mo","2 Mo","3 Mo","1 Yr","2 Yr","3 Yr","5 Yr","7 Yr","10 Yr","20 Yr","30 Yr"',
  '10/21/2026,4.09,4.16,4.25,4.52,4.81,4.89,4.95,5.03,5.13,5.47,5.42',
  '10/20/2026,4.09,4.15,4.24,4.51,4.81,4.89,4.95,5.03,5.12,5.47,5.41',
  '10/19/2026,4.08,4.15,4.24,4.51,4.80,4.88,4.94,5.02,5.15,5.48,5.44',
  '10/16/2026,4.06,4.13,4.23,4.50,4.79,4.87,4.93,5.01,5.11,5.46,5.43',
].join('\n');

const TREASURY_REAL = [
  'Date,"5 YR","7 YR","10 YR","20 YR","30 YR"',
  '10/21/2026,2.55,2.65,2.76,3.01,3.15',
  '10/20/2026,2.55,2.65,2.77,3.02,3.16',
  '10/19/2026,2.56,2.66,2.80,3.04,3.17',
  '10/16/2026,2.55,2.65,2.79,3.03,3.16',
].join('\n');

/** The mini EIA workbook bytes (eia.test.ts pins the parse) — one per series. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const FIXTURE_DIR = join(__dirname, '../../../fixtures');
const EIA_FIXTURES: Record<string, Buffer> = {
  wti: readFileSync(join(FIXTURE_DIR, 'eia-wti-mini.xls')),
  brent: readFileSync(join(FIXTURE_DIR, 'eia-brent-mini.xls')),
  natgas: readFileSync(join(FIXTURE_DIR, 'eia-natgas-mini.xls')),
};

interface Stub {
  calls: Map<string, number>;
  restore(): void;
}

/**
 * The counting stub (collect-gates.test.ts's shape), with:
 *  - `fredMalformed`: every fredgraph request answers 200 with the
 *    malformed-body class (NOT a CSV header, NOT an HTML bot-check page —
 *    exactly the live 'unexpected header' failure of 2026-10-22);
 *  - the healthy-path FRED stub answers a valid wide CSV per group;
 *  - `fredSeriesValues`: per-series rows for the cross-check scenarios
 *    (date,value pairs — a series present here answers with ITS rows so a
 *    common date with the Treasury fixture exists);
 *  - Treasury + EIA URLs answer their real payload shapes.
 */
function stubFetch(opts: { fredMalformed?: boolean; fredSeriesValues?: Record<string, Array<[string, string]>> } = {}): Stub {
  const calls = new Map<string, number>();
  const original = globalThis.fetch;
  const impl = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.set(url, (calls.get(url) ?? 0) + 1);
    if (url.includes('fredgraph')) {
      if (opts.fredMalformed) {
        // The live failure class: a 200 whose body is not the expected CSV
        // (parse → 'unexpected header' → kind 'failed').
        return new Response('\u00ef\u00bb\u00bfAn error occurred. Try again later.', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        });
      }
      const idParam = new URL(url).searchParams.get('id') ?? 'T10Y2Y';
      const ids = idParam.split(',').filter(Boolean);
      const header = ['observation_date', ...ids].join(',');
      const rowsFor = (id: string): string[] => {
        const custom = opts.fredSeriesValues?.[id];
        if (custom !== undefined) return custom.map(([date, value]) => `${date},${value}`);
        return ['2026-10-05,0.37'];
      };
      const rowCount = Math.max(...ids.map((id) => rowsFor(id).length));
      // The date column rides the FIRST id's rows (the cross-check scenarios
      // give every custom-answered id in a group the same dates).
      const dateFor = (i: number): string => rowsFor(ids[0]!)[i]?.split(',')[0] ?? '';
      const valueCells = (i: number) => ids.map((id) => rowsFor(id)[i]?.split(',')[1] ?? '').join(',');
      const body = [header, ...Array.from({ length: rowCount }, (_, i) => `${dateFor(i)},${valueCells(i)}`)].join('\n');
      return new Response(`${body}\n`, { status: 200, headers: { 'content-type': 'text/csv' } });
    }
    if (url.includes('home.treasury.gov')) {
      const isReal = url.includes('real_yield_curve');
      return new Response(isReal ? TREASURY_REAL : TREASURY_NOMINAL, {
        status: 200,
        headers: { 'content-type': 'text/csv; charset=UTF-8' },
      });
    }
    if (url.includes('eia.gov')) {
      const which = url.includes('RNGWHHDd')
        ? 'natgas'
        : url.includes('RBRTEd')
          ? 'brent'
          : 'wti';
      const fixture = EIA_FIXTURES[which]!;
      return new Response(
        fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength) as ArrayBuffer,
        { status: 200, headers: { 'content-type': 'application/vnd.ms-excel' } },
      );
    }
    if (url.includes('finance.yahoo.com')) {
      // A minimal valid chart envelope (yahoo.ts's parse contract).
      const stamp = Math.floor(Date.parse('2026-10-05T21:00:00Z') / 1000);
      return new Response(
        JSON.stringify({
          chart: {
            result: [
              {
                timestamp: [stamp, stamp + 86_400],
                indicators: { quote: [{ close: [100, 101] }] },
                meta: { regularMarketPrice: 101 },
              },
            ],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    return new Response('{"ok":1}', { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  globalThis.fetch = impl;
  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the 2026-10-22 reliability round + the GPE R07 Treasury-primary overlay', () => {
  it('a HEALTHY run fetches the Treasury primary (2 CSVs) and overlays the fresher tail — never the EIA fallback', async () => {
    const s = stubFetch();
    try {
      const result = await collectAllSources({ bitstampCandles: 2 });
      // R07: the Treasury curves fetch EVERY run now (nominal + real).
      const treasuryCalls = [...s.calls.keys()].filter((u) => u.includes('treasury.gov'));
      expect(treasuryCalls).toHaveLength(2);
      // The EIA fallbacks still fire ONLY on group failure (unchanged).
      for (const [url] of s.calls) {
        expect(url, 'no EIA fallback fetch on a healthy run').not.toContain('eia.gov');
      }
      const fredRows = result.reports.filter((r) => r.source === 'fred');
      expect(fredRows.length).toBe(7); // the seven bulk groups (Session-3 D-4: the trio split adds DFII10's own cosd group)
      for (const row of fredRows) expect(row.ok, row.detail).toBe(true);
      // The stub's FRED answers carry 2026-10-05 while the Treasury fixture
      // runs to 2026-10-21 — strictly past → the overlay extends every yield
      // slot and the honest attribution overrides fire (the fresher tail is
      // Treasury's, so the reading lines name the actual venue).
      const fred = result.inputs.fred;
      expect(fred.DGS10!.at(-1)).toEqual({ date: '2026-10-21', value: 5.13 });
      expect(fred.DGS10!.find((p) => p.date === '2026-10-05')!.value).toBe(0.37); // FRED's basis kept verbatim
      expect(fred.DFII10!.at(-1)).toEqual({ date: '2026-10-21', value: 2.76 });
      expect(fred.DFII5!.at(-1)).toEqual({ date: '2026-10-21', value: 2.55 });
      expect(fred.DGS2!.at(-1)).toEqual({ date: '2026-10-21', value: 4.81 });
      expect(fred.T10Y2Y!.at(-1)).toEqual({ date: '2026-10-21', value: 0.32 });
      expect(fred.T10Y3M!.at(-1)).toEqual({ date: '2026-10-21', value: 0.88 }); // 5.13 − 4.25
      expect(result.readingSourceOverrides.us10y?.name).toContain('U.S. Department of the Treasury');
      expect(result.readingSourceOverrides.us30y).toBeDefined();
      expect(result.readingSourceOverrides['us-2y']).toBeDefined();
      expect(result.readingSourceOverrides['real-yield-10y']?.name).toContain('real yield curve');
      expect(result.readingSourceOverrides['real-yield-5y']?.name).toContain('real yield curve');
      expect(result.readingSourceOverrides['real-curve-10y5y']).toBeDefined();
      expect(result.readingSourceOverrides['yield-curve-10y2y']?.name).toContain('10 Yr − 2 Yr');
      expect(result.readingSourceOverrides['yield-curve-10y3m']?.name).toContain('10 Yr − 3 Mo');
      // The healthy-run summary row (the swap is visible to ops daily).
      const treasuryRows = result.reports.filter((r) => r.source === 'treasury');
      expect(treasuryRows.length).toBe(2); // the fetch row + the overlay summary row
      expect(treasuryRows[0]!.ok).toBe(true);
      expect(treasuryRows[1]!.detail).toContain('R07');
    } finally {
      s.restore();
    }
  }, 30_000);

  it('the malformed-body failure class fails every FRED group closed (the live 2026-10-22 evidence)', async () => {
    const s = stubFetch({ fredMalformed: true });
    try {
      const result = await collectAllSources({ bitstampCandles: 2 });
      const fredRows = result.reports.filter((r) => r.source === 'fred');
      expect(fredRows).toHaveLength(7);
      for (const row of fredRows) {
        expect(row.ok, row.detail).toBe(false);
        expect(row.kind).toBe('failed');
        expect(row.detail).toContain('unexpected header');
      }
      // The other sources are unaffected (source-fail isolation).
      const yahooRows = result.reports.filter((r) => r.source === 'yahoo');
      for (const row of yahooRows) expect(row.ok, row.detail).toBe(true);
    } finally {
      s.restore();
    }
  }, 30_000);

  it('the Treasury fallback fills the yield family + honest attribution overrides, merged with stored history', async () => {
    const s = stubFetch({ fredMalformed: true });
    try {
      const stored = [
        { date: '2016-10-20', value: 1.7 },
        { date: '2026-10-16', value: 5.0 }, // overlaps the Treasury fill — Treasury wins (fresher fetch)
        { date: '2026-10-17', value: 5.01 }, // a stored point OUTSIDE the Treasury window — kept
      ];
      const result = await collectAllSources({
        bitstampCandles: 2,
        historyReader: async (id) =>
          id === 'us10y' ? stored : id === 'yield-curve-10y2y' ? [{ date: '2016-10-20', value: 0.5 }] : undefined,
      });
      // The Treasury fetches happened (nominal + real — group 1 failed too).
      const treasuryCalls = [...s.calls.keys()].filter((u) => u.includes('treasury.gov'));
      expect(treasuryCalls).toHaveLength(2);

      const fred = result.inputs.fred;
      // DGS10: 3 stored dates (one overlapping) + 4 Treasury dates = 6
      // unique dates, ascending, Treasury winning on the overlap.
      expect(fred.DGS10!.length).toBe(6);
      expect(fred.DGS10![0]).toEqual({ date: '2016-10-20', value: 1.7 });
      expect(fred.DGS10!.at(-1)).toEqual({ date: '2026-10-21', value: 5.13 });
      expect(fred.DGS10!.find((p) => p.date === '2026-10-16')!.value).toBe(5.11); // Treasury, not the stored 5.0
      // DGS30 / DFII10 / DGS2 / T10Y2Y all present from the fallback.
      expect(fred.DGS30!.at(-1)).toEqual({ date: '2026-10-21', value: 5.42 });
      expect(fred.DFII10!.at(-1)).toEqual({ date: '2026-10-21', value: 2.76 });
      expect(fred.DGS2!.at(-1)).toEqual({ date: '2026-10-21', value: 4.81 });
      expect(fred.T10Y2Y!.length).toBe(5); // stored 2016 point + 4 Treasury days
      expect(fred.T10Y2Y!.at(-1)).toEqual({ date: '2026-10-21', value: 0.32 });

      // The honest attribution overrides.
      expect(result.readingSourceOverrides.us10y?.name).toContain('U.S. Department of the Treasury');
      expect(result.readingSourceOverrides['real-yield-10y']?.name).toContain('real yield curve');
      expect(result.readingSourceOverrides.us30y).toBeDefined();
      expect(result.readingSourceOverrides['yield-curve-10y2y']?.name).toContain('10 Yr − 2 Yr');
      expect(result.readingSourceOverrides['au-us-10y-gap']?.name).toContain('U.S. Treasury');
      // fed-expectations' override needs the FRED monthlies (group 3), which
      // ALSO failed here — no DFEDTARL/U, so no override for it.
      expect(result.readingSourceOverrides['fed-expectations']).toBeUndefined();

      // The report carries the primary fetch row + the summary row.
      const treasuryRows = result.reports.filter((r) => r.source === 'treasury');
      expect(treasuryRows[0]!.ok).toBe(true);
      expect(treasuryRows[0]!.detail).toContain('PRIMARY');
      expect(treasuryRows[1]!.detail).toContain('R07');
    } finally {
      s.restore();
    }
  }, 30_000);

  it('GPE R07 cross-check PASS on a common date — the overlay extends, both venues agree', async () => {
    // FRED's group 1 answers the 10/19–10/20 rows the Treasury fixture
    // also carries (5.15/5.12 — the exact same numbers); Treasury runs one
    // day fresher (10/21). The common date (10/20) cross-checks clean and
    // the fresher tail overlays.
    const s = stubFetch({
      fredSeriesValues: {
        DGS10: [
          ['2026-10-19', '5.15'],
          ['2026-10-20', '5.12'],
        ],
        DGS30: [
          ['2026-10-19', '5.44'],
          ['2026-10-20', '5.41'],
        ],
      },
    });
    try {
      const result = await collectAllSources({ bitstampCandles: 2 });
      const fred = result.inputs.fred;
      expect(fred.DGS10!.length).toBe(3); // 10/19 + 10/20 (FRED, verbatim) + 10/21 (Treasury tail)
      expect(fred.DGS10!.at(-1)).toEqual({ date: '2026-10-21', value: 5.13 });
      expect(fred.DGS10!.find((p) => p.date === '2026-10-20')!.value).toBe(5.12); // FRED's own point untouched
      expect(result.readingSourceOverrides.us10y?.name).toContain('U.S. Department of the Treasury');
      // No disagreement rows.
      const badRows = result.reports.filter((r) => r.source === 'treasury' && r.ok === false);
      expect(badRows).toHaveLength(0);
    } finally {
      s.restore();
    }
  }, 30_000);

  it('GPE R07 cross-check DISAGREEMENT — the Treasury tail fails closed to FRED\'s mirror, loudly', async () => {
    // FRED's group 1 answers 10/20 = 4.50 while the Treasury fixture carries
    // 5.12 — far outside the ±0.011 band. The Treasury tail must NOT overlay
    // DGS10 (FRED's mirror stands), no us10y override fires, and a loud
    // report row records the disagreement.
    const s = stubFetch({
      fredSeriesValues: {
        DGS10: [
          ['2026-10-19', '4.55'],
          ['2026-10-20', '4.50'],
        ],
        DGS30: [
          ['2026-10-19', '5.44'],
          ['2026-10-20', '5.41'],
        ],
      },
    });
    try {
      const result = await collectAllSources({ bitstampCandles: 2 });
      const fred = result.inputs.fred;
      expect(fred.DGS10!.at(-1)).toEqual({ date: '2026-10-20', value: 4.5 }); // FRED's mirror stands
      expect(result.readingSourceOverrides.us10y).toBeUndefined(); // no override — the number is FRED's
      expect(result.readingSourceOverrides['us-japan-10y-gap']).toBeUndefined();
      const disagreement = result.reports.find((r) => r.source === 'treasury' && r.ok === false);
      expect(disagreement).toBeDefined();
      expect(disagreement!.kind).toBe('format-changed');
      expect(disagreement!.detail).toContain('DISAGREEMENT');
      expect(disagreement!.detail).toContain('DGS10');
    } finally {
      s.restore();
    }
  }, 30_000);

  it('the EIA fallback fills WTI/natgas/Brent when the commodities group fails', async () => {
    const s = stubFetch({ fredMalformed: true });
    try {
      const result = await collectAllSources({ bitstampCandles: 2 });
      const eiaCalls = [...s.calls.keys()].filter((u) => u.includes('eia.gov'));
      expect(eiaCalls).toHaveLength(3); // WTI + natgas + Brent

      const fred = result.inputs.fred;
      expect(fred.DCOILWTICO!.length).toBe(115); // the fixture's full history
      expect(fred.DHHNGSP!.length).toBe(115);
      expect(fred.DCOILBRENTEU!.length).toBe(115);

      expect(result.readingSourceOverrides.wti?.name).toContain('Energy Information Administration');
      expect(result.readingSourceOverrides.natgas?.name).toContain('Henry Hub');
      expect(result.readingSourceOverrides.brent?.name).toContain('EIA (Brent spot)');
      const eiaRows = result.reports.filter((r) => r.source === 'eia');
      expect(eiaRows).toHaveLength(3);
      for (const row of eiaRows) expect(row.ok, row.detail).toBe(true);
    } finally {
      s.restore();
    }
  }, 30_000);

  it('a Treasury fallback FAILURE is reported honestly and never poisons the run', async () => {
    const s = stubFetch({ fredMalformed: true });
    // additionally kill treasury.gov
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('treasury.gov')) {
        return new Response('gateway timeout', { status: 504 });
      }
      return (original as unknown as (i: RequestInfo | URL) => Promise<Response>)(input);
    }) as typeof fetch;
    try {
      const result = await collectAllSources({ bitstampCandles: 2 });
      const treasuryRow = result.reports.find((r) => r.source === 'treasury');
      expect(treasuryRow?.ok).toBe(false);
      // The EIA fallback still ran (its trigger is independent).
      expect(result.inputs.fred.DCOILWTICO).toBeDefined();
    } finally {
      s.restore();
    }
  }, 30_000);
});
