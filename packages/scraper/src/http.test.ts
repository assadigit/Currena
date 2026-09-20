import { describe, expect, it } from 'vitest';
import { BROWSER_HEADERS, fetchWithRetry, HttpError, mapWithConcurrency } from './http';

function jsonResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'content-type': 'application/json' } });
}

describe('fetchWithRetry', () => {
  it('succeeds on the first attempt and sends browser headers', async () => {
    const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
    const fake: typeof fetch = async (input, init) => {
      calls.push({ url: String(input), init });
      return jsonResponse('{"ok":true}');
    };

    const res = await fetchWithRetry('https://example.test/api', {}, { fetchImpl: fake, retries: 2 });

    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    const headers = calls[0]!.init?.headers as Record<string, string>;
    expect(headers['User-Agent']!).toMatch(/^Mozilla\/5\.0/);
    expect(headers['User-Agent']!).toContain('Chrome/');
    expect(headers['Accept']!).toContain('text/html');
    expect(headers['Accept-Language']!).toContain('en-US');
  });

  it('retries a transient network error (CF 1042-style) and succeeds', async () => {
    let calls = 0;
    const fake: typeof fetch = async () => {
      calls++;
      if (calls === 1) throw new TypeError('fetch failed: Cloudflare error 1042');
      return jsonResponse('{"ok":true}');
    };

    const res = await fetchWithRetry('https://example.test/api', {}, { fetchImpl: fake, retries: 2, backoffMs: [0, 0] });

    expect(res.status).toBe(200);
    expect(calls).toBe(2);
  });

  it('retries a 5xx status and succeeds', async () => {
    let calls = 0;
    const fake: typeof fetch = async () => {
      calls++;
      return calls === 1 ? new Response('bad gateway', { status: 502 }) : jsonResponse('{"ok":true}');
    };

    const res = await fetchWithRetry('https://example.test/api', {}, { fetchImpl: fake, retries: 2, backoffMs: [0, 0] });

    expect(res.status).toBe(200);
    expect(calls).toBe(2);
  });

  it('does NOT retry a permanent 4xx and throws HttpError with the status', async () => {
    let calls = 0;
    const fake: typeof fetch = async () => {
      calls++;
      return new Response('not found', { status: 404 });
    };

    await expect(
      fetchWithRetry('https://example.test/api', {}, { fetchImpl: fake, retries: 2, backoffMs: [0, 0] }),
    ).rejects.toBeInstanceOf(HttpError);

    try {
      await fetchWithRetry('https://example.test/api', {}, { fetchImpl: fake, retries: 2, backoffMs: [0, 0] });
      expect.unreachable('must throw');
    } catch (err) {
      expect((err as HttpError).status).toBe(404);
      expect((err as HttpError).code).toBe('http_4xx');
    }
    expect(calls).toBe(2); // one per fetchWithRetry call, zero retries inside each
  });

  it('throws after exhausting all attempts', async () => {
    let calls = 0;
    const fake: typeof fetch = async () => {
      calls++;
      throw new TypeError('network down');
    };

    await expect(
      fetchWithRetry('https://example.test/api', {}, { fetchImpl: fake, retries: 2, backoffMs: [0, 0] }),
    ).rejects.toThrow(/3 attempt/);

    expect(calls).toBe(3); // 1 initial + 2 retries
  });

  it('classifies machine-readable codes (BACKLOG #33)', async () => {
    // Network-level failure → dns_or_network.
    await expect(
      fetchWithRetry(
        'https://example.test/api',
        {},
        {
          fetchImpl: async () => {
            throw new TypeError('fetch failed');
          },
          retries: 0,
        },
      ),
    ).rejects.toMatchObject({ name: 'HttpError', code: 'dns_or_network' });

    // Timeout abort → timeout.
    const timeoutFake: typeof fetch = (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('The operation was aborted due to timeout', 'TimeoutError')),
        );
      });
    await expect(
      fetchWithRetry('https://example.test/api', {}, { fetchImpl: timeoutFake, timeoutMs: 20, retries: 0 }),
    ).rejects.toMatchObject({ code: 'timeout' });

    // 429 after retries → rate_limited.
    await expect(
      fetchWithRetry(
        'https://example.test/api',
        {},
        {
          fetchImpl: async () => new Response('slow down', { status: 429 }),
          retries: 0,
        },
      ),
    ).rejects.toMatchObject({ code: 'rate_limited', status: 429 });

    // 5xx after retries → http_5xx.
    await expect(
      fetchWithRetry(
        'https://example.test/api',
        {},
        {
          fetchImpl: async () => new Response('bad gateway', { status: 502 }),
          retries: 0,
        },
      ),
    ).rejects.toMatchObject({ code: 'http_5xx', status: 502 });

    // 403 (permanent) → blocked.
    await expect(
      fetchWithRetry(
        'https://example.test/api',
        {},
        {
          fetchImpl: async () => new Response('forbidden', { status: 403 }),
          retries: 0,
        },
      ),
    ).rejects.toMatchObject({ code: 'blocked', status: 403 });
  });

  it('aborts a hanging fetch via the timeout signal', async () => {
    const fake: typeof fetch = (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });

    await expect(
      fetchWithRetry('https://example.test/api', {}, { fetchImpl: fake, timeoutMs: 30, retries: 0 }),
    ).rejects.toThrow();
  });
});

describe('mapWithConcurrency', () => {
  it('processes every item with parallelism bounded by the limit', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const items = Array.from({ length: 10 }, (_, i) => i);

    const results = await mapWithConcurrency(items, 3, async (item) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight--;
      return item * 2;
    });

    expect(results).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);
    expect(maxInFlight).toBeLessThanOrEqual(3);
  });

  it('propagates mapper failures', async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (n) => {
        if (n === 2) throw new Error('boom');
        return n;
      }),
    ).rejects.toThrow('boom');
  });
});

describe('BROWSER_HEADERS', () => {
  it('exposes a desktop Chrome UA and browser Accept headers', () => {
    expect(BROWSER_HEADERS['User-Agent']!).toContain('Mozilla/5.0');
    expect(BROWSER_HEADERS['User-Agent']!).toContain('Chrome/');
    expect(BROWSER_HEADERS['Accept']!).toBeDefined();
    expect(BROWSER_HEADERS['Accept-Language']!).toBeDefined();
  });
});
