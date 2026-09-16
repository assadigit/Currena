import type { Snapshot } from '@currena/core';
import { convert } from '@currena/core';
import { InMemoryRateStore } from '@currena/scraper';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp, type Bindings } from './index';
import { MetaResponseSchema } from './meta';
import { RatesService } from './rates-service';

const T0_MS = Date.parse('2026-09-16T12:00:00.000Z');

function tgjuSnapshot(fetchedAt: string): Snapshot {
  return {
    base: 'IRR',
    source: 'tgju',
    fetchedAt,
    rates: [
      { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 / 230_500 },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 1 / 266_300 },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rate: 1 / 63_040 },
    ],
  };
}

function frankfurterSnapshot(fetchedAt: string): Snapshot {
  return {
    base: 'USD',
    source: 'frankfurter',
    fetchedAt,
    rates: [
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.86678 },
      { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.74317 },
      // Deliberately NO AED / VND — mirrors the real Frankfurter limitation.
    ],
  };
}

describe('routes (injected service — no Workers, no live sites)', () => {
  let clockMs = T0_MS;
  let store: InMemoryRateStore;
  let scrapeCalls: string[] = [];
  let failures: Partial<Record<'tgju' | 'frankfurter', Error>> = {};

  const env: Bindings = { RATES: {} as KVNamespace, REFRESH_SECRET: 'test-secret' };
  const envNoSecret: Bindings = { RATES: {} as KVNamespace };

  beforeEach(() => {
    clockMs = T0_MS;
    store = new InMemoryRateStore(() => clockMs);
    scrapeCalls = [];
    failures = {};
  });

  function makeApp() {
    const service = new RatesService({
      store,
      scrapers: {
        tgju: async () => {
          scrapeCalls.push('tgju');
          if (failures.tgju) throw failures.tgju;
          return tgjuSnapshot(new Date(clockMs).toISOString());
        },
        frankfurter: async () => {
          scrapeCalls.push('frankfurter');
          if (failures.frankfurter) throw failures.frankfurter;
          return frankfurterSnapshot(new Date(clockMs).toISOString());
        },
      },
      now: () => new Date(clockMs),
    });
    return createApp({ makeService: () => service });
  }

  /* ------------------------------- health ------------------------------- */

  it('GET /api/health → 200 ok', async () => {
    const res = await makeApp().request('/api/health', undefined, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; service: string };
    expect(body.ok).toBe(true);
    expect(body.service).toBe('currena-api');
  });

  /* -------------------------------- rates ------------------------------- */

  it('GET /api/rates (default source) → live then fresh-cache', async () => {
    const app = makeApp();

    const first = await app.request('/api/rates', undefined, env);
    expect(first.status).toBe(200);
    expect(first.headers.get('cache-control')).toBe('no-store');
    const firstBody = (await first.json()) as { servedFrom: string; stale: boolean };
    expect(firstBody.servedFrom).toBe('live');
    expect(firstBody.stale).toBe(false);

    const second = await app.request('/api/rates', undefined, env);
    const secondBody = (await second.json()) as { servedFrom: string; stale: boolean };
    expect(secondBody.servedFrom).toBe('cache'); // freshness window
    expect(secondBody.stale).toBe(false);
    expect(scrapeCalls).toEqual(['tgju']); // exactly one scrape
  });

  it('GET /api/rates?source=frankfurter → frankfurter snapshot', async () => {
    const res = await makeApp().request('/api/rates?source=frankfurter', undefined, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { snapshot: Snapshot };
    expect(body.snapshot.base).toBe('USD');
    expect(scrapeCalls).toEqual(['frankfurter']);
  });

  it('GET /api/rates?source=bogus → 400 invalid_source envelope', async () => {
    const res = await makeApp().request('/api/rates?source=bogus', undefined, env);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('invalid_source');
    expect(body.error.message).toContain('bogus');
  });

  it('GET /api/rates with dead source and no cache → 503 source_unavailable + retryAfterSec', async () => {
    failures.tgju = new Error('upstream down');
    const res = await makeApp().request('/api/rates', undefined, env);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string; retryAfterSec?: number } };
    expect(body.error.code).toBe('source_unavailable');
    expect(body.error.retryAfterSec).toBe(60);
  });

  /* ------------------------------- convert ------------------------------ */

  it('GET /api/convert?from=USD&to=IRR&amount=100 → GOLDEN 23,050,000 at rate 230,500 via tgju', async () => {
    const res = await makeApp().request('/api/convert?from=USD&to=IRR&amount=100', undefined, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { amount: number; rate: number; source: string };
    expect(body.amount).toBe(23_050_000);
    expect(body.rate).toBe(230_500);
    expect(body.source).toBe('tgju');
    expect(scrapeCalls).toEqual(['tgju']); // IRR pair → TGJU (rule 8)
  });

  it('GET /api/convert?from=EUR&to=GBP&amount=100 → frankfurter routing', async () => {
    const res = await makeApp().request('/api/convert?from=EUR&to=GBP&amount=100', undefined, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { amount: number; rate: number; source: string };
    const expected = convert(frankfurterSnapshot(new Date(T0_MS).toISOString()), 'EUR', 'GBP', 100);
    expect(body.amount).toBeCloseTo(expected.amount, 8);
    expect(body.rate).toBeCloseTo(expected.rate, 10);
    expect(body.source).toBe('frankfurter');
    expect(scrapeCalls).toEqual(['frankfurter']); // international pair → Frankfurter
  });

  it('GET /api/convert?from=usd&to=usd&amount=5 → local short-circuit, rate 1, zero network', async () => {
    const res = await makeApp().request('/api/convert?from=usd&to=usd&amount=5', undefined, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { amount: number; rate: number; source: string; fetchedAt: string };
    expect(body.amount).toBe(5);
    expect(body.rate).toBe(1);
    expect(body.source).toBe('local');
    expect(Number.isNaN(Date.parse(body.fetchedAt))).toBe(false);
    expect(scrapeCalls).toEqual([]);
  });

  it('well-formed but UNKNOWN code → 503 currency_not_supported (not a 400)', async () => {
    const res = await makeApp().request('/api/convert?from=USD&to=XYZ&amount=5', undefined, env);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('currency_not_supported');
  });

  it('GET /api/convert?from=AED&to=EUR → 503 currency_not_supported naming the pair (Frankfurter has no AED)', async () => {
    const res = await makeApp().request('/api/convert?from=AED&to=EUR&amount=100', undefined, env);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('currency_not_supported');
    expect(body.error.message).toContain('AED→EUR');
    expect(body.error.message).toContain('TGJU');
  });

  it('GET /api/convert?from=AED&to=IRR → works via TGJU despite the Frankfurter limitation', async () => {
    const res = await makeApp().request('/api/convert?from=AED&to=IRR&amount=100', undefined, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rate: number; source: string };
    expect(body.rate).toBeCloseTo(63_040, 6);
    expect(body.source).toBe('tgju');
  });

  it.each([
    ['from=XX&to=USD&amount=5', 'invalid_currency'],
    ['from=USD&to=toolong&amount=5', 'invalid_currency'],
    ['from=USD&to=1x&amount=5', 'invalid_currency'],
    ['from=USD&to=EUR', 'invalid_amount'], // missing
    ['from=USD&to=EUR&amount=', 'invalid_amount'], // empty
    ['from=USD&to=EUR&amount=abc', 'invalid_amount'], // NaN
    ['from=USD&to=EUR&amount=0', 'invalid_amount'], // zero
    ['from=USD&to=EUR&amount=-5', 'invalid_amount'], // negative
    ['from=USD&to=EUR&amount=1e16', 'invalid_amount'], // > 1e15
  ])('GET /api/convert?%s → 400 %s', async (query, code) => {
    const res = await makeApp().request(`/api/convert?${query}`, undefined, env);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe(code);
  });

  it('convert serves STALE cache with a working notice when upstream fails', async () => {
    const app = makeApp();
    await app.request('/api/convert?from=USD&to=IRR&amount=1', undefined, env); // populate cache

    clockMs += 10 * 60 * 1000; // cache now 10 minutes old (stale, < 7d)
    failures.tgju = new Error('upstream flaky');

    const res = await app.request('/api/convert?from=USD&to=IRR&amount=100', undefined, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { amount: number; rate: number; source: string };
    expect(body.amount).toBe(23_050_000);
    expect(body.source).toBe('tgju');
  });

  /* -------------------------------- meta -------------------------------- */

  it('GET /api/meta → 17 currencies + per-source lists + limitations, zod-valid', async () => {
    const res = await makeApp().request('/api/meta', undefined, env);
    expect(res.status).toBe(200);

    const body = (await res.json()) as unknown;
    const meta = MetaResponseSchema.parse(body); // validates the served shape

    expect(meta.currencies).toHaveLength(17);
    const aed = meta.currencies.find((c) => c.code === 'AED');
    expect(aed?.name).toBe('UAE Dirham');
    expect(aed?.tgjuProfileUrl).toBe('https://www.tgju.org/profile/price_aed');
    const irr = meta.currencies.find((c) => c.code === 'IRR');
    expect(irr?.tgjuProfileUrl).toBeUndefined(); // base currency has no profile
    expect(meta.sources.tgju.currencies).toHaveLength(17);
    expect(meta.sources.frankfurter.currencies).toContain('USD');
    expect(meta.sources.frankfurter.currencies).not.toContain('AED');
    expect(meta.limitations.some((l) => l.includes('AED or VND'))).toBe(true);
  });

  /* ------------------------------- status ------------------------------- */

  it('GET /api/status → per-source report', async () => {
    const app = makeApp();
    await app.request('/api/rates', undefined, env); // populate tgju

    const res = await app.request('/api/status', undefined, env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      now: string;
      sources: Array<{ source: string; cache: { present: boolean; fresh: boolean } }>;
    };
    expect(body.sources).toHaveLength(2);
    const tgju = body.sources.find((s) => s.source === 'tgju');
    expect(tgju?.cache.present).toBe(true);
    expect(tgju?.cache.fresh).toBe(true);
    const frankfurter = body.sources.find((s) => s.source === 'frankfurter');
    expect(frankfurter?.cache.present).toBe(false);
  });

  /* --------------------------- internal refresh -------------------------- */

  it('POST /internal/refresh without REFRESH_SECRET → 501', async () => {
    const res = await makeApp().request('/internal/refresh', { method: 'POST' }, envNoSecret);
    expect(res.status).toBe(501);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('refresh_not_configured');
  });

  it('POST /internal/refresh with a wrong secret → 401, no scrape', async () => {
    const res = await makeApp().request(
      '/internal/refresh',
      { method: 'POST', headers: { 'X-Refresh-Secret': 'wrong-secret' } },
      env,
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('unauthorized');
    expect(scrapeCalls).toEqual([]);
  });

  it('POST /internal/refresh with the secret → forces a scrape past min-interval', async () => {
    const app = makeApp();
    await app.request('/api/rates', undefined, env); // live scrape
    clockMs += 5 * 1000; // lastScrapeAt 5s ago — inside the 60s min-interval

    const res = await app.request(
      '/internal/refresh',
      { method: 'POST', headers: { 'X-Refresh-Secret': 'test-secret' } },
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { servedFrom: string; stale: boolean };
    expect(body.servedFrom).toBe('live'); // force bypassed the fresh cache + min-interval
    expect(scrapeCalls).toEqual(['tgju', 'tgju']);
  });

  it('POST /internal/refresh with dead upstream and no cache → 503', async () => {
    failures.tgju = new Error('down');
    const res = await makeApp().request(
      '/internal/refresh?source=tgju',
      { method: 'POST', headers: { 'X-Refresh-Secret': 'test-secret' } },
      env,
    );
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('source_unavailable');
  });

  /* ------------------------------ fallbacks ------------------------------ */

  it('unknown routes → 404 RatesError envelope', async () => {
    const res = await makeApp().request('/api/nope', undefined, env);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('not_found');
  });

  /* ------------------------- admin stub (Phase 6) ------------------------ */

  describe('GET /admin', () => {
    it('renders the ops console with noindex + no-store + CSP headers', async () => {
      const res = await makeApp().request('/admin', undefined, env);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/html');
      expect(res.headers.get('cache-control')).toBe('no-store');
      expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
      expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
      const html = await res.text();
      expect(html).toContain('noindex, nofollow'); // <meta name="robots">
      expect(html).toContain('Manual refresh');
      expect(html).toContain('no snapshot in KV'); // cold store
    });

    it('shows cached snapshot data (rates table) after a scrape', async () => {
      const app = makeApp();
      await app.request('/api/rates', undefined, env); // populates tgju snapshot
      const res = await app.request('/admin', undefined, env);
      const html = await res.text();
      expect(res.status).toBe(200);
      expect(html).toContain('Iranian Rial');
      expect(html).toContain('US Dollar');
      expect(html).toContain('TOMAN');
      expect(html).toContain('fresh'); // cache pill
    });

    it('?refreshed=tgju (PRG flash from POST) renders the success banner', async () => {
      const res = await makeApp().request('/admin?refreshed=tgju', undefined, env);
      const html = await res.text();
      expect(html).toContain('banner success');
      expect(html).toContain('tgju refreshed');
    });

    it('?refreshed=<injection> is rejected — no banner, no raw markup', async () => {
      const res = await makeApp().request('/admin?refreshed=%3Cscript%3Ealert(1)%3C%2Fscript%3E', undefined, env);
      const html = await res.text();
      expect(html).not.toContain('banner success');
      expect(html).not.toContain('<script>alert(1)');
    });
  });

  describe('POST /admin (form-encoded manual refresh)', () => {
    const formBody = (fields: Record<string, string>) =>
      new URLSearchParams(fields).toString();

    const formReq = (body: string) => ({
      method: 'POST' as const,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    it('without REFRESH_SECRET configured → error banner, 200 HTML, no scrape', async () => {
      const res = await makeApp().request('/admin', formReq(formBody({ source: 'tgju', secret: 'x' })), envNoSecret);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('banner error');
      expect(html).toContain('refresh_not_configured');
      expect(scrapeCalls).toEqual([]);
    });

    it('wrong secret → uniform unauthorized banner, no echo of the input, no scrape', async () => {
      const res = await makeApp().request(
        '/admin',
        formReq(formBody({ source: 'tgju', secret: 'wrong-secret' })),
        env,
      );
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('unauthorized');
      expect(html).not.toContain('wrong-secret'); // never echoed
      expect(scrapeCalls).toEqual([]);
    });

    it('missing secret field → unauthorized banner', async () => {
      const res = await makeApp().request('/admin', formReq(formBody({ source: 'tgju' })), env);
      const html = await res.text();
      expect(html).toContain('unauthorized');
      expect(scrapeCalls).toEqual([]);
    });

    it('invalid source → validation banner, no scrape', async () => {
      const res = await makeApp().request(
        '/admin',
        formReq(formBody({ source: 'bogus', secret: 'test-secret' })),
        env,
      );
      const html = await res.text();
      expect(html).toContain('Invalid &#39;source&#39;');
      expect(scrapeCalls).toEqual([]);
    });

    it('correct secret → 303 redirect (PRG) to ?refreshed= and a forced scrape', async () => {
      const app = makeApp();
      await app.request('/api/rates', undefined, env); // initial scrape
      clockMs += 5 * 1000; // within min-interval → force must still bypass

      const res = await app.request(
        '/admin',
        formReq(formBody({ source: 'tgju', secret: 'test-secret' })),
        env,
      );
      expect(res.status).toBe(303);
      expect(res.headers.get('location')).toBe('/admin?refreshed=tgju');
      expect(scrapeCalls).toEqual(['tgju', 'tgju']); // force worked

      // Following the redirect shows the success banner.
      const follow = await app.request(res.headers.get('location')!, undefined, env);
      const html = await follow.text();
      expect(html).toContain('banner success');
    });

    it('dead upstream → 200 HTML error banner carrying the ladder code (not a 503)', async () => {
      failures.tgju = new Error('down');
      const res = await makeApp().request(
        '/admin',
        formReq(formBody({ source: 'tgju', secret: 'test-secret' })),
        env,
      );
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('banner error');
      expect(html).toContain('source_unavailable');
    });

    it('non-form content type (e.g. JSON body) → unauthorized, no crash', async () => {
      const res = await makeApp().request(
        '/admin',
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"source":"tgju"}' },
        env,
      );
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('unauthorized');
      expect(scrapeCalls).toEqual([]);
    });
  });
});
