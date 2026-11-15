/**
 * lib/api.ts tests (QA audit C-2 — the trust boundary for every number the
 * converter displays had zero coverage).
 *
 * Pins the client's wire contract: the exact request (no conditional
 * headers — the rates path is deliberately no-store, so a 304 can never
 * reach it), the three ApiError kinds (network / rates / parse), the
 * RatesError envelope mapping incl. retryAfterSec, non-JSON handling, and
 * the fetchMeta memoization incl. the retry-after-failure fix (a rejected
 * memo must not poison the session).
 *
 * House pattern (insights.test.ts): stub globals per test, no React.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, __resetMetaMemoForTests, fetchMeta, fetchRates } from './api';
import type { RatesResponse } from '@currena/core';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const textResponse = (body: string, status = 200): Response =>
  new Response(body, { status, headers: { 'content-type': 'text/html' } });

const RATES_RESPONSE: RatesResponse = {
  snapshot: {
    base: 'IRR',
    source: 'tgju',
    fetchedAt: '2026-10-14T10:00:00.000Z',
    rates: [
      { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 / 230_500 },
    ],
  },
  stale: false,
  servedFrom: 'cache',
};

const META = {
  currencies: [
    { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', minorUnits: 2 },
    { code: 'USD', name: 'US Dollar', symbol: '$', minorUnits: 2 },
  ],
  sources: {
    tgju: { base: 'IRR', currencies: ['IRR', 'USD'] },
    frankfurter: { base: 'USD', currencies: ['USD'] },
  },
  limitations: ['AED or VND are not served by Frankfurter'],
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  __resetMetaMemoForTests(); // module-level memo must not leak between cases
});

describe('fetchRates — the wire contract', () => {
  it('GETs /api/rates?source= with accept:application/json + cache:no-store and NO conditional headers', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(RATES_RESPONSE));
    const res = await fetchRates('tgju');
    expect(res.servedFrom).toBe('cache');
    expect(res.snapshot.rates).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/rates?source=tgju');
    expect(init.headers).toEqual({ accept: 'application/json' });
    expect(init.cache).toBe('no-store');
    // The SPA rates path never sends If-None-Match — the server ETag exists
    // for other clients; this client's contract is no-store + full payload.
    expect(Object.keys(init.headers as Record<string, string>).some((k) => k.toLowerCase() === 'if-none-match')).toBe(false);
  });

  it('encodes the source parameter', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ ...RATES_RESPONSE, snapshot: { ...RATES_RESPONSE.snapshot, source: 'frankfurter', base: 'USD' } }),
    );
    await fetchRates('frankfurter');
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/rates?source=frankfurter');
  });

  it('maps a RatesError envelope (503 + retryAfterSec) to kind "rates" with code/status/retry', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { error: { code: 'source_unavailable', message: 'Live rates unavailable', retryAfterSec: 60 } },
        503,
      ),
    );
    const err = await fetchRates('tgju').then(
      () => undefined,
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(ApiError);
    const apiErr = err as ApiError;
    expect(apiErr.kind).toBe('rates');
    expect(apiErr.code).toBe('source_unavailable');
    expect(apiErr.status).toBe(503);
    expect(apiErr.retryAfterSec).toBe(60);
    expect(apiErr.message).toBe('Live rates unavailable');
  });

  it('a RatesError without retryAfterSec maps with retryAfterSec undefined', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { code: 'invalid_source', message: 'bad source' } }, 400),
    );
    const err = (await fetchRates('tgju').then(
      () => undefined,
      (e: unknown) => e,
    )) as ApiError;
    expect(err.kind).toBe('rates');
    expect(err.status).toBe(400);
    expect(err.retryAfterSec).toBeUndefined();
  });

  it('an error response WITHOUT the envelope → kind "parse" (never rendered)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ oops: true }, 500));
    const err = (await fetchRates('tgju').then(
      () => undefined,
      (e: unknown) => e,
    )) as ApiError;
    expect(err.kind).toBe('parse');
    expect(err.status).toBe(500);
  });

  it('a 200 with an INVALID RatesResponse body → kind "parse"', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ snapshot: { base: 'IRR' } }));
    const err = (await fetchRates('tgju').then(
      () => undefined,
      (e: unknown) => e,
    )) as ApiError;
    expect(err.kind).toBe('parse');
    expect(err.message).toContain('Invalid rates payload');
  });

  it('a non-JSON 2xx answer → kind "parse"', async () => {
    fetchMock.mockResolvedValueOnce(textResponse('<html>proxy error page</html>'));
    const err = (await fetchRates('tgju').then(
      () => undefined,
      (e: unknown) => e,
    )) as ApiError;
    expect(err.kind).toBe('parse');
    expect(err.message).toContain('Non-JSON response');
  });

  it('a transport failure (offline) → kind "network"', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const err = (await fetchRates('tgju').then(
      () => undefined,
      (e: unknown) => e,
    )) as ApiError;
    expect(err.kind).toBe('network');
    expect(err.message).toBe('Failed to fetch');
  });

  it('a caller-initiated abort propagates untouched (never wrapped in ApiError)', async () => {
    const controller = new AbortController();
    controller.abort();
    // A real fetch rejects immediately when the signal is already aborted.
    fetchMock.mockImplementationOnce(() =>
      Promise.reject(new DOMException('The operation was aborted.', 'AbortError')),
    );
    const err = await fetchRates('tgju', controller.signal).then(
      () => undefined,
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(DOMException);
    expect((err as DOMException).name).toBe('AbortError');
  });
});

describe('fetchMeta — memoization + retry-after-failure (audit C-2 fix)', () => {
  it('fetches once and memoizes the SUCCESSFUL result across calls', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(META));
    const first = await fetchMeta();
    const second = await fetchMeta();
    expect(first.currencies).toHaveLength(2);
    expect(second).toBe(first); // same resolved promise — one session fetch
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('a REJECTED memo resets — the next call refetches instead of returning the dead promise', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline at boot'));
    await expect(fetchMeta()).rejects.toMatchObject({ kind: 'network' });

    fetchMock.mockResolvedValueOnce(jsonResponse(META));
    const recovered = await fetchMeta();
    expect(recovered.currencies).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2); // the failure did not pin the memo
  });

  it('an invalid meta payload rejects with kind "parse"', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ currencies: [] }));
    const err = (await fetchMeta().then(
      () => undefined,
      (e: unknown) => e,
    )) as ApiError;
    expect(err.kind).toBe('parse');
    expect(err.message).toContain('Invalid meta payload');
  });
});
