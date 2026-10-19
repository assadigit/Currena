/**
 * fetch-policy.test.ts — SCRAPING_SPEC §5 politeness + the fetch gates
 * (T-25 honest identity, T-27 blocked, F-10 conditional requests, F-18
 * content hash). Written FIRST (Phase 1): the fetch layer must satisfy
 * these before any adapter may go out through it.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  BlockedError,
  CURRENA_UA,
  FormatChangedError,
  contentHash,
  insightsFetch,
} from './fetch-policy';

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

describe('T-25 honest identity (F-09)', () => {
  it('declares the CurrenaDashboard UA with the About contact URL', () => {
    expect(CURRENA_UA).toBe('CurrenaDashboard/1.0 (+https://github.com/assadigit/Currena)');
  });

  it('every request carries the declared UA — never a browser identity', async () => {
    const seen: Array<string | undefined> = [];
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const h = new Headers(init?.headers);
      seen.push(h.get('user-agent') ?? undefined);
      return jsonResponse({ ok: 1 });
    }) as typeof fetch;
    await insightsFetch('https://example.test/a', {}, { fetchImpl });
    await insightsFetch('https://example.test/b', { headers: { 'user-agent': 'Mozilla/5.0 (spoof attempt)' } }, { fetchImpl });
    expect(seen).toEqual([CURRENA_UA, CURRENA_UA]); // the caller CANNOT spoof the identity
  });

  it('no browser Accept-Language/Accept fingerprint rides along by default', async () => {
    let headers: Headers | undefined;
    const fetchImpl = (async (_i: RequestInfo | URL, init?: RequestInit) => {
      headers = new Headers(init?.headers);
      return jsonResponse({ ok: 1 });
    }) as typeof fetch;
    await insightsFetch('https://example.test/a', {}, { fetchImpl });
    expect(headers!.get('accept-language')).toBeNull();
  });
});

describe('T-27 a block is a block (no retries, no circumvention)', () => {
  it.each([403, 418, 451])('HTTP %s → BlockedError (blocked), exactly ONE request', async (status) => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return new Response('no', { status });
    }) as typeof fetch;
    await expect(insightsFetch('https://example.test/x', {}, { fetchImpl })).rejects.toMatchObject({
      name: 'BlockedError',
      reason: 'blocked',
    });
    expect(calls).toBe(1); // F-11: no retry loop — the next refresh waits
  });

  it('HTTP 429 → BlockedError (rate_limited), one request, no retry', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return new Response('slow down', { status: 429 });
    }) as typeof fetch;
    await expect(insightsFetch('https://example.test/x', {}, { fetchImpl })).rejects.toMatchObject({
      reason: 'rate_limited',
    });
    expect(calls).toBe(1);
  });

  it('a 200 bot-check HTML page → BlockedError (bot_check)', async () => {
    const fetchImpl = (async () =>
      new Response('<html><title>Just a moment...</title><body>Trouble? Pardon our interruption — verify you are human</body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })) as typeof fetch;
    await expect(insightsFetch('https://example.test/x', {}, { fetchImpl })).rejects.toMatchObject({ reason: 'bot_check' });
  });

  it('a legitimate 200 HTML document is NOT mistaken for a bot check', async () => {
    const fetchImpl = (async () =>
      new Response('<html><body>Commodity Markets: monthly prices, xlsx downloads</body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })) as typeof fetch;
    const res = await insightsFetch('https://example.test/x', {}, { fetchImpl });
    expect(res.status).toBe(200);
  });

  it('a network failure throws once (single attempt)', async () => {
    const fetchImpl = (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;
    await expect(insightsFetch('https://example.test/x', {}, { fetchImpl })).rejects.toThrow();
  });

  it('BlockedError carries the machine-readable reason and the message says "blocked by the site"', () => {
    const err = new BlockedError('blocked', 'blocked');
    expect(err.message).toContain('blocked by the site');
  });
});

describe('F-10 conditional requests', () => {
  it('sends If-None-Match when an etag is supplied, and a 304 is surfaced to the caller', async () => {
    let cond: string | null = null;
    const fetchImpl = (async (_i: RequestInfo | URL, init?: RequestInit) => {
      const h = new Headers(init?.headers);
      cond = h.get('if-none-match');
      return new Response(null, { status: 304, headers: { etag: '"v1"' } });
    }) as typeof fetch;
    const res = await insightsFetch('https://example.test/x', {}, { fetchImpl, etag: '"v1"' });
    expect(cond).toBe('"v1"');
    expect(res.status).toBe(304); // the caller reuses its last good value
  });

  it('exposes the response etag so the caller can cache it', async () => {
    const fetchImpl = (async () => jsonResponse({ a: 1 }, 200, { etag: '"abc"' })) as typeof fetch;
    const res = await insightsFetch('https://example.test/x', {}, { fetchImpl });
    expect(res.headers.get('etag')).toBe('"abc"');
  });
});

describe('F-18 content hash of the fetched value block', () => {
  it('is stable for identical text and differs when the block changes', () => {
    const a = contentHash('{"score":64,"label":"Greed"}');
    const b = contentHash('{"score":64,"label":"Greed"}');
    const c = contentHash('{"score":65,"label":"Greed"}');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{8,}$/);
  });
});

describe('FormatChangedError (F-16)', () => {
  it('exists with a machine-readable marker for the ingest classifier', () => {
    const err = new FormatChangedError('no longer fredgraph.csv');
    expect(err.name).toBe('FormatChangedError');
    expect(err.message).toContain('fredgraph');
  });

  it('the classifier recognises format-change messages from adapters', async () => {
    const { classifySourceError } = await import('./fetch-policy');
    expect(classifySourceError(new FormatChangedError('shape changed'))).toBe('format-changed');
    expect(classifySourceError(new BlockedError('x', 'rate_limited'))).toBe('blocked');
    expect(classifySourceError(new Error('boom'))).toBe('failed');
  });
});

describe('the timeout guard (single attempt, bounded)', () => {
  it('aborts a hanging request after the timeout', async () => {
    vi.useFakeTimers();
    const fetchImpl = (async (_i: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'TimeoutError')));
      });
    }) as typeof fetch;
    const p = insightsFetch('https://example.test/x', {}, { fetchImpl, timeoutMs: 25 });
    vi.advanceTimersByTime(30);
    await expect(p).rejects.toThrow();
    vi.useRealTimers();
  });
});
