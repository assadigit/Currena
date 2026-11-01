import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { FRED_BULK_ALL_IDS, FRED_BULK_GROUPS, fetchFredSeries, FRED_SERIES, fredSeriesUrl } from './fred';
import { fetchFrankfurterSeries, frankfurterTimeseriesUrl } from './frankfurter';
import { absDataUrl, ABS_SERIES, fetchAbsSeries } from './abs';
import { fetchGoldApiSpot, goldApiPriceUrl } from './goldapi';
import { bitstampOhlcUrl, fetchBitstampCloses } from './bitstamp';
import { parseManualSeries } from './manual';
import { fetchEcbDfrSeries, ECB_DFR_SERIES_KEY } from './ecb';
import { fetchRbaSeries, RBA_TABLES, rbaTableUrl } from './rba';
import { computeHighestSinceYear } from './derived';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '..', '..', 'fixtures');

function fixtureText(name: string): string {
  return readFileSync(join(FIXTURES, name), 'utf-8');
}

/**
 * Fixture-backed fake fetch (AGENTS.md rule 7 — tests NEVER hit live sites).
 * Keys are URL prefixes; a URL nothing matches is itself a failure.
 */
function fixtureFetch(map: Record<string, () => string>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    for (const [prefix, body] of Object.entries(map)) {
      if (url.startsWith(prefix)) return new Response(body(), { status: 200 });
    }
    throw new Error(`unexpected fetch URL: ${url}`);
  }) as typeof fetch;
}

/** Fake fetch that answers every URL with a fixed status. */
function statusFetch(status: number, body = ''): typeof fetch {
  return (async () => new Response(body, { status })) as typeof fetch;
}

describe('fred adapter', () => {
  it('builds the keyless fredgraph.csv URL', () => {
    expect(fredSeriesUrl('T10Y2Y')).toBe('https://fred.stlouisfed.org/graph/fredgraph.csv?id=T10Y2Y');
  });

  it('sends the ingestion UA, not the browser fingerprint (Akamai hangs on Chrome UA)', async () => {
    let seen: HeadersInit | undefined;
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      seen = init?.headers;
      return new Response('observation_date,X\n2026-10-05,1.2\n', { status: 200 });
    }) as typeof fetch;
    await fetchFredSeries('T10Y2Y', { fetchImpl });
    const headers = new Headers(seen);
    // T-25/F-09: the declared honest identity, never a browser fingerprint.
    expect(headers.get('User-Agent')).toBe('CurrenaDashboard/1.0 (+https://github.com/assadigit/Currena)');
    expect(headers.get('User-Agent')).not.toMatch(/Mozilla/);
  });

  it('fetches and parses a series through the recorded fixture format', async () => {
    const series = await fetchFredSeries('STLFSI4', {
      fetchImpl: fixtureFetch({
        'https://fred.stlouisfed.org/graph/fredgraph.csv?id=STLFSI4': () =>
          'observation_date,STLFSI4\n1993-06-04,0.01\n1993-06-11,-0.02\n',
      }),
    });
    expect(series).toEqual([
      { date: '1993-06-04', value: 0.01 },
      { date: '1993-06-11', value: -0.02 },
    ]);
  });

  it('throws on HTTP 404 (upstream problem — loud, never partial data)', async () => {
    await expect(fetchFredSeries('NOPE', { fetchImpl: statusFetch(404) })).rejects.toThrow(/HTTP 404/);
  });

  it('throws when the response is no longer fredgraph.csv', async () => {
    await expect(
      fetchFredSeries('T10Y2Y', {
        fetchImpl: fixtureFetch({ 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=T10Y2Y': () => '<html>login</html>' }),
      }),
    ).rejects.toThrow(/header/);
  });

  it('carries every series id the definitions table consumes', () => {
    expect(Object.values(FRED_SERIES)).toContain('STLFSI4');
    // Step-2 add-list §B3/§B4/§B5: UNRATE + SAHMREALTIME + VIXCLS joined.
    expect(Object.values(FRED_SERIES)).toContain('UNRATE');
    expect(Object.values(FRED_SERIES)).toContain('SAHMREALTIME');
    expect(Object.values(FRED_SERIES)).toContain('VIXCLS');
    // Fix spec C-03/C-04/C-05 + T-01 (2026-10-14): DGS2, DGS30, T10YIE and
    // GACDFSA066MSFRBPHI joined. The 2026-10-21 data-integrity round adds
    // WTI, natgas, the OECD bond trio, the BoJ/BoE overnight pair, PAYEMS
    // and the BEA GDP series → 30; the 2026-10-24 M4 Wave-1 round adds
    // ICSA, SOFR, RECPROUSM156N, UMCSENT, MICH and PCEPILFE → 36; the
    // 2026-10-25 M6 Wave-3 round adds MORTGAGE30US, WALCL, RSAFS, PERMIT,
    // CFNAI, JTSJOL, T5YIE and AHETPI → 44, and the Wave-4 BoE fix
    // RETIRES IRSTCI01GBM156N (boe-rate moved to the BoE's own page) → 43;
    // the 2026-10-26 gap-audit build adds T10Y3M (A-1) → 44; the 2026-10-31
    // gap-closure S2-M2.4 round adds WSEFINTL1 (the weekly custody card) → 45;
    // the 2026-11-01 gap-closure S3-M3.2 round adds the liquidity family's
    // five (THREEFYTP10, WTREGEN, RRPONTSYD, WRESBAL, IORB — the repo-stress
    // leg) → 50. CCSA and the macro six ride FRED_S3_GROUPS (rung4), not the
    // FRED_SERIES register (their cards land with M3.4/M3.5).
    expect(Object.values(FRED_SERIES)).toHaveLength(50);
  });

  it('rides WSEFINTL1 in the mixed-frequency bulk group beside WALCL (S2-M2.4: zero new subrequests)', () => {
    // The custody series must join its WALCL twin in the mixed-frequency
    // group (both Fed H.4.1-family Wednesday-level weeklies — the live
    // 11-id probe 2026-10-31 verified the ZIP member weekly,_as_of_wednesday
    // carries both columns). It must appear in exactly one group, and every
    // group must stay at ≤ 12 ids (the fredgraph ZIP truncates past ~12).
    const groupsWithCustody = FRED_BULK_GROUPS.filter((g) =>
      g.seriesIds.includes(FRED_SERIES.custodyHoldings),
    );
    expect(groupsWithCustody).toHaveLength(1);
    expect(groupsWithCustody[0]!.seriesIds).toContain(FRED_SERIES.walcl);
    expect(
      FRED_BULK_GROUPS.filter((g) => g.seriesIds.includes(FRED_SERIES.walcl)),
    ).toHaveLength(1);
    for (const g of FRED_BULK_GROUPS) {
      expect(g.seriesIds.length).toBeLessThanOrEqual(12);
    }
    // The bulk registry covers every series exactly once (no orphans, no
    // double registration — the collect layer asserts coverage).
    expect(new Set(FRED_BULK_ALL_IDS).size).toBe(FRED_BULK_ALL_IDS.length);
    expect(FRED_BULK_ALL_IDS).toContain(FRED_SERIES.custodyHoldings);
  });

  it('parses the 10y−3m curve leg from the recorded T10Y3M capture (A-1, 2026-10-26)', async () => {
    const fetchImpl = fixtureFetch({
      'https://fred.stlouisfed.org/graph/fredgraph.csv?id=T10Y3M': () => fixtureText('fred-T10Y3M.csv'),
    });
    const series = await fetchFredSeries('T10Y3M', { fetchImpl });
    expect(series.length).toBeGreaterThan(2000);
    expect(series.at(-1)).toEqual({ date: '2026-10-23', value: 0.78 });
    // The spec's verified live reading: 0.78 @ 2026-10-23 (0.31 was T10Y2Y's
    // same-day print — the two legs must stay distinct series).
    expect(series.at(-2)!.date).toBe('2026-10-22');
    expect(series[0]!.date).toBe('2016-01-04');
  });
});

describe('frankfurter adapter', () => {
  it('builds the open-ended timeseries URL', () => {
    expect(frankfurterTimeseriesUrl('2016-01-04')).toBe(
      // M5 Wave 2 (2026-10-24): TRY joins as the ninth leg (the usdtry card).
      'https://api.frankfurter.dev/v1/2016-01-04..?from=USD&to=JPY,AUD,CNY,EUR,GBP,CAD,SEK,CHF,TRY',
    );
    // Narrow currency lists still build their own URL.
    expect(frankfurterTimeseriesUrl('2016-01-04', ['JPY'])).toBe(
      'https://api.frankfurter.dev/v1/2016-01-04..?from=USD&to=JPY',
    );
    expect(() => frankfurterTimeseriesUrl('2016/01/04')).toThrow(/not an ISO date/);
  });

  it('parses one series per currency from a recorded response', async () => {
    const out = await fetchFrankfurterSeries('2026-09-25', ['JPY', 'AUD', 'CNY'], {
      fetchImpl: fixtureFetch({
        'https://api.frankfurter.dev/v1/2026-09-25..?from=USD': () =>
          fixtureText('frankfurter-usd-timeseries-small.json'),
      }),
    });
    expect(out.JPY).toHaveLength(8);
    expect(out.JPY![0]).toEqual({ date: '2026-09-25', value: 157.59 });
    expect(out.AUD!.at(-1)).toEqual({ date: '2026-10-06', value: 1.4322 });
    expect(out.CNY![0]!.value).toBeCloseTo(6.7132, 4);
  });

  it('throws on a non-2xx response', async () => {
    await expect(
      fetchFrankfurterSeries('2026-01-01', ['JPY'], { fetchImpl: statusFetch(500), retries: 0 }),
    ).rejects.toThrow(/HTTP 500/);
  });
});

describe('abs adapter', () => {
  it('builds keyless /rest/data CSV URLs and validates the key shape', () => {
    expect(absDataUrl(ABS_SERIES.cpiIndex)).toBe('https://data.api.abs.gov.au/rest/data/CPI/1.10001.10.50.M?format=csv');
    expect(() => absDataUrl('CPI 1.10001')).toThrow(/malformed/);
    expect(() => absDataUrl('https://evil.example/rest/data/CPI')).toThrow(/malformed/);
  });

  it('parses the live monthly-SDMX CSV shape from the recorded fixture (Step-1: monthly CPI)', async () => {
    const series = await fetchAbsSeries(ABS_SERIES.cpiIndex, {
      fetchImpl: fixtureFetch({
        'https://data.api.abs.gov.au/rest/data/CPI/1.10001.10.50.M?format=csv': () =>
          fixtureText('abs-sdmx-cpi-monthly.csv'),
      }),
    });
    expect(series.length).toBeGreaterThan(4);
    expect(series[0]!.date).toMatch(/^\d{4}-\d{2}-01$/);
    // The API answers newest-first (unordered) — the parser sorts; the fixture
    // covers 2024-06 → 2026-08 monthly.
    expect(series.at(-1)!.date).toBe('2026-08-01');
    expect(series.at(-1)!.value).toBe(103.5); // the live-verified August 2026 print
  });

  it('fails loudly on NoRecordsFound (key or flow changed upstream)', async () => {
    await expect(
      fetchAbsSeries('CPI/9.9.9.9.Q', {
        fetchImpl: fixtureFetch({ 'https://data.api.abs.gov.au/rest/data/CPI/9.9.9.9.Q': () => 'NoRecordsFound' }),
      }),
    ).rejects.toThrow(/NoRecordsFound/);
  });
});

describe('gold-api adapter', () => {
  it('builds the price URL', () => {
    expect(goldApiPriceUrl('XAG')).toBe('https://api.gold-api.com/price/XAG');
  });

  it('validates the recorded response contract', async () => {
    const spot = await fetchGoldApiSpot('XAG', {
      fetchImpl: fixtureFetch({ 'https://api.gold-api.com/price/XAG': () => fixtureText('goldapi-xag.json') }),
    });
    expect(spot.symbol).toBe('XAG');
    expect(spot.price).toBeGreaterThan(50);
    expect(spot.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  it('rejects contract changes and symbol mismatches loudly', async () => {
    await expect(
      fetchGoldApiSpot('XAG', {
        fetchImpl: fixtureFetch({ 'https://api.gold-api.com/price/XAG': () => '{"symbol":"XAG","price":"61.2"}' }),
      }),
    ).rejects.toThrow(/schema validation/);
    await expect(
      fetchGoldApiSpot('XAG', {
        fetchImpl: fixtureFetch({ 'https://api.gold-api.com/price/XAG': () => fixtureText('goldapi-btc.json') }),
      }),
    ).rejects.toThrow(/asked for XAG/);
  });
});

describe('bitstamp adapter', () => {
  it('builds OHLC URLs and enforces the 1–1000 limit cap', () => {
    expect(bitstampOhlcUrl('btcusd', 86_400, { limit: 10 })).toBe(
      'https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=86400&limit=10',
    );
    expect(bitstampOhlcUrl('BTCUSD', 86_400, { start: 1_451_606_400, end: 1_454_284_800, limit: 1000 })).toBe(
      'https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=86400&start=1451606400&end=1454284800&limit=1000',
    );
    expect(() => bitstampOhlcUrl('btcusd', 86_400, { limit: 1001 })).toThrow(/1–1000/);
    expect(() => bitstampOhlcUrl('btc usd')).toThrow(/malformed/);
  });

  it('parses daily closes from the recorded fixture (ascending, UTC dates)', async () => {
    const closes = await fetchBitstampCloses('btcusd', { limit: 10 }, {
      fetchImpl: fixtureFetch({
        'https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=86400&limit=10': () =>
          fixtureText('bitstamp-btcusd-ohlc.json'),
      }),
    });
    expect(closes).toHaveLength(10);
    expect(closes[0]!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(closes.at(-1)!.value).toBeGreaterThan(0);
    for (let i = 1; i < closes.length; i++) {
      expect(closes[i]!.date > closes[i - 1]!.date).toBe(true);
    }
  });

  it('throws on a candle payload that passes the schema but holds garbage numbers', async () => {
    await expect(
      fetchBitstampCloses('btcusd', {}, {
        fetchImpl: fixtureFetch({
          'https://www.bitstamp.net/api/v2/ohlc/btcusd/?step=86400': () =>
            '{"data":{"pair":"BTC/USD","ohlc":[{"timestamp":"abc","open":"1","high":"1","low":"1","close":"-5","volume":"1"}]}}',
        }),
      }),
    ).rejects.toThrow(/unparseable candle/);
  });
});

describe('ecb adapter (I15 — deposit facility rate)', () => {
  it('parses the recorded wide-SDMX CSV into a sorted canonical series', async () => {
    const series = await fetchEcbDfrSeries({
      fetchImpl: fixtureFetch({ 'https://data-api.ecb.europa.eu/service/data/': () => fixtureText('ecb-dfr.csv') }),
    });
    expect(series.length).toBeGreaterThan(20);
    expect(series[0]).toEqual({ date: '2015-01-01', value: -0.2 });
    // Ascending and unique (the live API returns unordered rows).
    for (let i = 1; i < series.length; i++) {
      expect(series[i]!.date > series[i - 1]!.date).toBe(true);
    }
  });

  it('fails loudly when TIME_PERIOD/OBS_VALUE columns are absent (format change)', async () => {
    await expect(
      fetchEcbDfrSeries({
        fetchImpl: fixtureFetch({ 'https://data-api.ecb.europa.eu/service/data/': () => 'KEY,FREQ\nX,D\n' }),
      }),
    ).rejects.toThrow(/TIME_PERIOD\/OBS_VALUE/);
  });

  it('the series key is the confirmed FM dataflow key', () => {
    expect(ECB_DFR_SERIES_KEY).toBe('FM/D.U2.EUR.4F.KR.DFR.LEV');
  });
});

describe('rba F6 adapter (I15 — home-loan rate by Series ID)', () => {
  it('extracts FLRHOOTA (owner-occupier outstanding) from the recorded F6 table', async () => {
    const series = await fetchRbaSeries('homeLoanOutstanding', {
      fetchImpl: fixtureFetch({ [rbaTableUrl(RBA_TABLES.homeLoanOutstanding)]: () => fixtureText('rba-f6-data.csv') }),
    });
    // 86 monthly observations, venue-verified (DB.NOMICS FLRHOOTA, 2019-07 → 2026-08).
    expect(series).toHaveLength(86);
    expect(series[0]).toEqual({ date: '2019-07-31', value: 3.84 });
    expect(series.at(-1)).toEqual({ date: '2026-08-31', value: 6.21 });
  });

  it('fails loudly when the Series ID is absent from the table (E2 has no FLRHOOTA)', async () => {
    await expect(
      fetchRbaSeries('homeLoanOutstanding', {
        fetchImpl: fixtureFetch({ [rbaTableUrl(RBA_TABLES.homeLoanOutstanding)]: () => fixtureText('rba-e2-data.csv') }),
      }),
    ).rejects.toThrow(/does not start with "F6"/); // wrong-table identity check fires first
    // Same table, id that is genuinely absent → the Series-ID miss is loud.
    const f6NoId = fixtureText('rba-f6-data.csv').replace('FLRHOOTA', 'FLRNOPE');
    await expect(
      fetchRbaSeries('homeLoanOutstanding', {
        fetchImpl: fixtureFetch({ [rbaTableUrl(RBA_TABLES.homeLoanOutstanding)]: () => f6NoId }),
      }),
    ).rejects.toThrow(/no series id "FLRHOOTA"/); // the adapter still asks for the real id
  });
});

describe('manual series loader', () => {
  const file = {
    id: 'china-pmi',
    sourceName: 'China NBS official PMI',
    enteredOn: '2026-10-15',
    expires: '2026-10-31',
    observations: [
      { date: '2026-07-01', value: 49.4 },
      { date: '2026-06-01', value: 50.1 },
      { date: '2026-08-01', value: 49.8 },
    ],
  };

  it('sorts observations and validates the contract', () => {
    const { points } = parseManualSeries(file, 'china-pmi');
    expect(points.map((p) => p.date)).toEqual(['2026-06-01', '2026-07-01', '2026-08-01']);
    expect(points.at(-1)).toEqual({ date: '2026-08-01', value: 49.8 });
  });

  it('returns the E-08 bookkeeping (enteredOn/expires)', () => {
    const parsed = parseManualSeries(file, 'china-pmi');
    expect(parsed.enteredOn).toBe('2026-10-15');
    expect(parsed.expires).toBe('2026-10-31');
  });

  it('rejects id mismatch, duplicates, empty observation lists and a file WITHOUT the E-08 bookkeeping', () => {
    expect(() => parseManualSeries({ ...file, id: 'other' }, 'china-pmi')).toThrow(/expected "china-pmi"/);
    expect(() =>
      parseManualSeries({ ...file, observations: [...file.observations, { date: '2026-08-01', value: 50 }] }, 'china-pmi'),
    ).toThrow(/duplicate observation/);
    expect(() => parseManualSeries({ ...file, observations: [] }, 'china-pmi')).toThrow(/schema validation/);
    // Defect E-08: an undated manual entry can never ship.
    const { enteredOn: _e, expires: _x, ...undated } = file;
    expect(() => parseManualSeries(undated, 'china-pmi')).toThrow(/schema validation/);
  });
});

describe('computeHighestSinceYear (fix spec B-19 — episode-aware long-history context)', () => {
  it('skips the trailing cluster: the 10-year at 5.21 under its own October high names the last independent year, not this one', () => {
    // The live 2026-10 evidence shape: the October cluster (5.31 high) then
    // 5.21 today; nothing between 2007 and the cluster reached 5.21.
    const series = [
      { date: '2007-06-12', value: 5.29 },
      { date: '2023-10-02', value: 4.98 },
      { date: '2026-10-05', value: 5.31 },
      { date: '2026-10-06', value: 5.27 },
      { date: '2026-10-07', value: 5.28 },
      { date: '2026-10-08', value: 5.22 },
      { date: '2026-10-09', value: 5.24 },
      { date: '2026-10-13', value: 5.21 },
    ];
    expect(computeHighestSinceYear(series)).toBe(2007);
  });

  it('a genuine record reads the last pre-record year (the 5.31 touch: highest since 2002)', () => {
    const series = [
      { date: '2002-04-01', value: 5.5 },
      { date: '2007-06-12', value: 5.29 },
      { date: '2026-10-01', value: 5.25 },
      { date: '2026-10-05', value: 5.31 },
    ];
    // The 5.25 of Oct 1 rides within ±2% of 5.31 — part of the same move,
    // skipped; the last independent ≥5.31 sighting was April 2002.
    expect(computeHighestSinceYear(series)).toBe(2002);
  });

  it("no claim when the level was reached within the reading's own year outside the episode", () => {
    const series = [
      { date: '2026-01-15', value: 5.3 },
      { date: '2026-03-01', value: 4.5 },
      { date: '2026-10-13', value: 5.21 },
    ];
    expect(computeHighestSinceYear(series)).toBeUndefined();
  });

  it('no claim when a crash lands just under a same-year peak', () => {
    const series = [
      { date: '2020-01-02', value: 3.0 },
      { date: '2026-10-12', value: 6.0 },
      { date: '2026-10-13', value: 5.0 },
    ];
    expect(computeHighestSinceYear(series)).toBeUndefined();
  });

  it("a whole-history record floors at the first observation's year", () => {
    const series = [
      { date: '2016-01-04', value: 2.6 },
      { date: '2020-01-02', value: 1.7 },
      { date: '2026-10-13', value: 5.56 },
    ];
    expect(computeHighestSinceYear(series)).toBe(2016);
  });

  it('too short to search', () => {
    expect(computeHighestSinceYear([{ date: '2026-10-13', value: 5 }])).toBeUndefined();
  });
});
