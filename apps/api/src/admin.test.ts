import type { Snapshot } from '@currena/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { esc, relTime, renderAdminPage, type AdminPageData } from './admin';
import type { StatusReport } from './rates-service';

const NOW = new Date('2026-09-17T06:00:00.000Z');

function report(overrides: Partial<StatusReport['sources'][number]>[] = []): StatusReport {
  const base: StatusReport = {
    now: NOW.toISOString(),
    sources: [
      {
        source: 'tgju',
        status: {
          source: 'tgju',
          lastScrapeAt: '2026-09-17T05:59:00.000Z',
          lastSuccessAt: '2026-09-17T05:59:00.000Z',
          lastDurationMs: 120,
        },
        cache: { present: true, fetchedAt: '2026-09-17T05:59:00.000Z', ageSec: 60, fresh: false },
      },
      {
        source: 'frankfurter',
        status: {
          source: 'frankfurter',
          lastScrapeAt: '2026-09-17T05:30:00.000Z',
          lastSuccessAt: '2026-09-17T05:30:00.000Z',
          lastError: { code: 'scrape_failed', message: 'upstream 500', at: '2026-09-17T05:30:00.000Z' },
          lastDurationMs: 40,
        },
        cache: { present: false, fresh: false },
      },
    ],
  };
  overrides.forEach((o, i) => {
    if (o) base.sources[i] = { ...base.sources[i]!, ...o };
  });
  return base;
}

function tgjuSnapshot(): Snapshot {
  return {
    base: 'IRR',
    source: 'tgju',
    fetchedAt: '2026-09-17T05:59:00.000Z',
    rates: [
      { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 / 230_500 },
    ],
  };
}

function pageData(over: Partial<AdminPageData> = {}): AdminPageData {
  return {
    report: report(),
    snapshots: { tgju: tgjuSnapshot() },
    now: NOW,
    ...over,
  };
}

describe('esc — HTML escaping', () => {
  it('escapes the full dangerous set', () => {
    expect(esc(`<script>alert("x")&'y'</script>`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&amp;&#39;y&#39;&lt;/script&gt;',
    );
  });
  it('leaves plain text untouched', () => {
    expect(esc('US Dollar — 230,500')).toBe('US Dollar — 230,500');
  });
});

describe('relTime', () => {
  it('formats the buckets', () => {
    expect(relTime(undefined, NOW)).toBe('—');
    expect(relTime('2026-09-17T05:59:40.000Z', NOW)).toBe('just now');
    expect(relTime('2026-09-17T05:45:00.000Z', NOW)).toBe('15 min ago');
    expect(relTime('2026-09-17T02:00:00.000Z', NOW)).toBe('4 h ago');
    expect(relTime('2026-09-13T06:00:00.000Z', NOW)).toBe('4 d ago');
  });
  it('returns — for unparseable input', () => {
    expect(relTime('not-a-date', NOW)).toBe('—');
  });
});

describe('renderAdminPage', () => {
  it('renders both source cards, headers payload, noindex meta, and the form', () => {
    const html = renderAdminPage(pageData());
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('noindex, nofollow');
    expect(html).toContain('tgju');
    expect(html).toContain('frankfurter');
    expect(html).toContain('Manual refresh');
    expect(html).toContain('method="post" action="/admin"');
    expect(html).toContain('name="secret"');
    // Snapshot data present with escaping of the rate table
    expect(html).toContain('Iranian Rial');
    expect(html).toContain('TOMAN');
    // error history from the report
    expect(html).toContain('scrape_failed');
    expect(html).toContain('upstream 500');
    // no cache → hint instead of table
    expect(html).toContain('no snapshot in KV');
  });

  it('renders the refreshed flash banner only for valid sources', () => {
    expect(renderAdminPage(pageData({ refreshed: 'tgju' }))).toContain('banner success');
    expect(renderAdminPage(pageData({ refreshed: 'frankfurter' }))).toContain('frankfurter refreshed');
    expect(renderAdminPage(pageData())).not.toContain('banner success');
  });

  it('renders error banners with escaped code and message', () => {
    const html = renderAdminPage(
      pageData({ error: { code: 'unauthorized', message: 'Missing or invalid refresh secret.' } }),
    );
    expect(html).toContain('banner error');
    expect(html).toContain('unauthorized');
    expect(html).toContain('Missing or invalid refresh secret.');
  });

  it('XSS — escapes every untrusted field (names, error messages, timestamps)', () => {
    // Cast on purpose: a zod-valid Snapshot can never carry markup, but the
    // renderer must still defend in depth against untrusted KV data.
    const malicious = {
      base: 'IRR',
      source: 'tgju',
      fetchedAt: '2026-09-17T05:59:00.000Z',
      rates: [
        {
          code: 'IRR',
          name: 'Iranian <img src=x onerror=alert(1)>',
          symbol: '<b>﷼</b>',
          rate: 1,
          unit: 'TOMAN<script>alert(2)</script>',
        },
      ],
    } as unknown as Snapshot;
    const maliciousReport: StatusReport = {
      now: NOW.toISOString(),
      sources: [
        {
          source: 'tgju',
          status: {
            source: 'tgju',
            lastScrapeAt: '"><script>alert(3)</script>',
            lastError: { code: 'x<script>', message: '<svg onload=alert(4)>', at: '2026-09-17T05:00:00.000Z' },
          },
          cache: { present: false, fresh: false },
        },
        { source: 'frankfurter', cache: { present: false, fresh: false } },
      ],
    };
    const html = renderAdminPage({
      report: maliciousReport,
      snapshots: { tgju: malicious },
      now: NOW,
      error: { code: 'code"><script>', message: 'msg<script>alert(5)</script>' },
    });
    // Nothing raw may survive: no unescaped tag openers from our inputs.
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('<svg onload');
    expect(html).not.toContain('<b>﷼</b>');
    // ...and the escaped forms are present instead.
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;script&gt;alert(2)&lt;/script&gt;');
    expect(html).toContain('&lt;svg onload=alert(4)&gt;');
  });

  it('renders the runtime-config card with the real ladder constants', async () => {
    const { FRESH_TTL_SEC, MIN_SCRAPE_INTERVAL_SEC, CACHE_HARD_TTL_SEC } = await import('@currena/core');
    const html = renderAdminPage(pageData());
    expect(html).toContain('Runtime config');
    expect(html).toContain(`<b>${FRESH_TTL_SEC}s</b>`);
    expect(html).toContain(`<b>${MIN_SCRAPE_INTERVAL_SEC}s</b>`);
    expect(html).toContain(`<b>${CACHE_HARD_TTL_SEC / 86_400}d</b>`);
    expect(html).toContain('never fall back to Frankfurter');
  });

  it('emits no external subresource URLs and no inline event handlers', () => {
    const html = renderAdminPage(pageData());
    expect(html).not.toMatch(/(src|href)\s*=\s*["']https?:/i);
    expect(html).not.toMatch(/\son[a-z]+\s*=\s*["']/i);
    expect(html).not.toMatch(/<script[\s>]/i);
  });
});

describe('Insights freshness card (I7 staleness alerting)', () => {
  function insightsStatus(generatedAt: string) {
    return {
      v: 1 as const,
      generatedAt,
      mode: 'scheduled' as const,
      dryRun: false,
      sources: [
        { source: 'fred', ok: true, detail: 'T10Y2Y' },
        { source: 'frankfurter', ok: true, detail: 'usd-jpy' },
      ],
    };
  }

  it('a run younger than 36 h renders the healthy pill, no stale alert', () => {
    const html = renderAdminPage(
      pageData({ insights: insightsStatus('2026-09-17T04:20:00.000Z') }), // 1.7 h before NOW
    );
    expect(html).toContain('<span class="pill ok">healthy</span>');
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('stale — no run');
  });

  it('a run older than 36 h flips the pill to stale and raises the alert', () => {
    const html = renderAdminPage(
      pageData({ insights: insightsStatus('2026-09-15T04:20:00.000Z') }), // ~49.7 h before NOW
    );
    expect(html).toContain('pill none');
    expect(html).toContain('stale — no run for 49 h');
    expect(html).toContain('role="alert"');
    expect(html).toContain('insights-ingest');
  });

  it('source failures still warn while the run itself is fresh', () => {
    const withFailure = {
      ...insightsStatus('2026-09-17T04:20:00.000Z'),
      sources: [
        { source: 'fred', ok: true, detail: 'T10Y2Y' },
        { source: 'rba', ok: false, detail: 'HTTP 403' },
      ],
    };
    const html = renderAdminPage(pageData({ insights: withFailure }));
    expect(html).toContain('<span class="pill warn">1 failing</span>');
    expect(html).not.toContain('role="alert"');
  });
});

describe('ADMIN_HEADERS', () => {
  beforeEach(() => {});

  it('sends no-store + anti-index + strict CSP', async () => {
    const { ADMIN_HEADERS } = await import('./admin');
    expect(ADMIN_HEADERS['Cache-Control']).toBe('no-store');
    expect(ADMIN_HEADERS['X-Robots-Tag']).toBe('noindex, nofollow');
    expect(ADMIN_HEADERS['Referrer-Policy']).toBe('no-referrer');
    expect(ADMIN_HEADERS['Content-Security-Policy']).toContain("default-src 'none'");
  });
});
