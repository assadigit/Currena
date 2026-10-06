import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { fetchFredSeries, FRED_SERIES, fredSeriesUrl } from './fred';
import { fetchFrankfurterSeries, frankfurterTimeseriesUrl } from './frankfurter';
import { absDataUrl, ABS_SERIES, fetchAbsSeries } from './abs';
import { fetchGoldApiSpot, goldApiPriceUrl } from './goldapi';
import { bitstampOhlcUrl, fetchBitstampCloses } from './bitstamp';
import { fetchTgjuGoldOunce } from './tgju';
import { parseManualSeries } from './manual';

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
    expect(headers.get('User-Agent')).toMatch(/CurrenaInsights/);
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
    expect(Object.values(FRED_SERIES)).toHaveLength(10);
  });
});

describe('frankfurter adapter', () => {
  it('builds the open-ended timeseries URL', () => {
    expect(frankfurterTimeseriesUrl('2016-01-04')).toBe(
      'https://api.frankfurter.dev/v1/2016-01-04..?from=USD&to=JPY,AUD,CNY',
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
    expect(absDataUrl(ABS_SERIES.cpiIndex)).toBe('https://data.api.abs.gov.au/rest/data/CPI/1.10001.10.50.Q?format=csv');
    expect(() => absDataUrl('CPI 1.10001')).toThrow(/malformed/);
    expect(() => absDataUrl('https://evil.example/rest/data/CPI')).toThrow(/malformed/);
  });

  it('parses the live SDMX CSV shape from the recorded fixture', async () => {
    const series = await fetchAbsSeries(ABS_SERIES.cpiIndex, {
      fetchImpl: fixtureFetch({
        'https://data.api.abs.gov.au/rest/data/CPI/1.10001.10.50.Q?format=csv': () =>
          fixtureText('abs-sdmx-cpi.csv'),
      }),
    });
    expect(series.length).toBeGreaterThan(4);
    expect(series[0]!.date).toMatch(/^\d{4}-\d{2}-01$/);
    // The API answers newest-first (unordered) — the parser sorts; the fixture
    // covers 2025-Q1 → 2026-Q2.
    expect(series.at(-1)!.date).toBe('2026-04-01');
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

describe('tgju adapter', () => {
  it("extracts the 'ons' gold ounce in USD from a recorded ajax.json payload", async () => {
    const payload = JSON.parse(readFileSync(join(HERE, '..', '..', '..', 'scraper', 'fixtures', 'tgju-ajax.trimmed.json'), 'utf-8'));
    const fixedNow = () => new Date('2026-10-06T12:00:00Z');
    const ounce = await fetchTgjuGoldOunce(
      { fetchImpl: fixtureFetch({ 'https://call1.tgju.org/ajax.json': () => JSON.stringify(payload) }) },
      fixedNow,
    );
    expect(ounce.price).toBeCloseTo(4383.45, 2);
    expect(ounce.fetchedAt).toBe('2026-10-06T12:00:00.000Z');
  });

  it('fails loudly when the gold ounce symbol is absent', async () => {
    await expect(
      fetchTgjuGoldOunce({
        fetchImpl: fixtureFetch({ 'https://call1.tgju.org/ajax.json': () => '{"current":{}}' }),
      }),
    ).rejects.toThrow(/gold ounce.*missing/);
  });
});

describe('manual series loader', () => {
  const file = {
    id: 'china-pmi',
    sourceName: 'China NBS official PMI',
    observations: [
      { date: '2026-07-01', value: 49.4 },
      { date: '2026-06-01', value: 50.1 },
      { date: '2026-08-01', value: 49.8 },
    ],
  };

  it('sorts observations and validates the contract', () => {
    const series = parseManualSeries(file, 'china-pmi');
    expect(series.map((p) => p.date)).toEqual(['2026-06-01', '2026-07-01', '2026-08-01']);
    expect(series.at(-1)).toEqual({ date: '2026-08-01', value: 49.8 });
  });

  it('rejects id mismatch, duplicates and empty observation lists', () => {
    expect(() => parseManualSeries({ ...file, id: 'other' }, 'china-pmi')).toThrow(/expected "china-pmi"/);
    expect(() =>
      parseManualSeries({ ...file, observations: [...file.observations, { date: '2026-08-01', value: 50 }] }, 'china-pmi'),
    ).toThrow(/duplicate observation/);
    expect(() => parseManualSeries({ ...file, observations: [] }, 'china-pmi')).toThrow(/schema validation/);
  });
});
