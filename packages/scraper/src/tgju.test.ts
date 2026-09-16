import { convert, getRate } from '@currena/core';
import type { Snapshot } from '@currena/core';
import { describe, expect, it } from 'vitest';
import ajaxFixture from '../fixtures/tgju-ajax.trimmed.json';
import profileHtml from '../fixtures/tgju-profile.html?raw';
import { ScraperError } from './errors';
import {
  buildTgjuSnapshot,
  normalizeTgjuNumber,
  parseTgjuAjax,
  parseTgjuProfilePrice,
  rialToToman,
  scrapeTgju,
  TGJU_AJAX_URL,
  TGJU_PROFILES,
  tgjuProfilePageUrl,
} from './tgju';

/** Deep, mutable copy of the fixture payload for per-test mutation. */
function fixtureCopy(): { current: Record<string, { p: string }> } {
  return JSON.parse(JSON.stringify(ajaxFixture)) as { current: Record<string, { p: string }> };
}

describe('normalizeTgjuNumber', () => {
  it('strips thousands commas from ASCII digits', () => {
    expect(normalizeTgjuNumber('2,305,000')).toBe(2_305_000);
    expect(normalizeTgjuNumber('1,691')).toBe(1691);
    expect(normalizeTgjuNumber('75')).toBe(75);
  });

  it('converts Persian and Arabic-Indic digits with separators', () => {
    expect(normalizeTgjuNumber('۲,۳۰۵,۰۰۰')).toBe(2_305_000); // ۰-۹ + ASCII comma
    expect(normalizeTgjuNumber('۲٬۳۰۵٬۰۰۰')).toBe(2_305_000); // U+066C separators
    expect(normalizeTgjuNumber('٢٬٣٠٥٬٠٠٠')).toBe(2_305_000); // ٠-٩
  });

  it('throws a typed error for garbage', () => {
    expect(() => normalizeTgjuNumber('')).toThrow(ScraperError);
    expect(() => normalizeTgjuNumber('n/a')).toThrow(ScraperError);
    expect(() => normalizeTgjuNumber('-5')).toThrow(ScraperError);
    expect(() => normalizeTgjuNumber('0')).toThrow(ScraperError);
  });
});

describe('rialToToman', () => {
  it('divides Rial by 10 → Toman (the ONLY place this happens, AGENTS.md §6)', () => {
    expect(rialToToman(2_305_000)).toBe(230_500);
  });
});

describe('parseTgjuAjax (fixture: real 2026-09-16 capture)', () => {
  it('GOLDEN legacy parity: USD→IRR 100 = 23,050,000 at rate 230,500', () => {
    // Fixture price_dollar_rl p = "2,305,000" Rial = 230,500 Toman (legacy live value).
    const snapshot = parseTgjuAjax(ajaxFixture);

    expect(snapshot.base).toBe('IRR');
    expect(snapshot.source).toBe('tgju');
    expect(snapshot.rates).toHaveLength(17); // IRR self-rate + 16 profile currencies

    const result = convert(snapshot, 'USD', 'IRR', 100);
    expect(result.amount).toBe(23_050_000);
    expect(result.rate).toBe(230_500);
    expect(result.source).toBe('tgju');
  });

  it('includes the IRR self-rate with unit TOMAN so convert() can look up both sides', () => {
    const snapshot = parseTgjuAjax(ajaxFixture);
    const irr = snapshot.rates.find((r) => r.code === 'IRR');

    expect(irr).toBeDefined();
    expect(irr?.rate).toBe(1);
    expect(irr?.unit).toBe('TOMAN');
    expect(irr?.name).toBe('Iranian Rial'); // international common name (Gate 1 #4)
    expect(irr?.symbol).toBe('﷼');
  });

  it('inverts Toman quotes into per-IRR rates and carries names/symbols from core', () => {
    const snapshot = parseTgjuAjax(ajaxFixture);

    // 1 USD = 230,500 Toman → rate(USD) = 1/230500 units per IRR.
    expect(getRate(snapshot, 'USD').rate).toBe(1 / 230_500);
    expect(getRate(snapshot, 'USD').name).toBe('US Dollar');
    expect(getRate(snapshot, 'USD').symbol).toBe('$');

    // 1 EUR = 266,300 Toman; 1 AED = 63,040 Toman (capture cross-check).
    expect(getRate(snapshot, 'EUR').rate).toBe(1 / 266_300);
    expect(getRate(snapshot, 'AED').rate).toBe(1 / 63_040);
    expect(getRate(snapshot, 'AED').name).toBe('UAE Dirham');

    // Small quotes: 1 KRW = 169.1 Toman, 1 IDR = 11.1 Toman, 1 VND = 7.5 Toman.
    expect(getRate(snapshot, 'KRW').rate).toBe(1 / 169.1);
    expect(getRate(snapshot, 'IDR').rate).toBe(1 / 11.1);
    expect(getRate(snapshot, 'VND').rate).toBe(1 / 7.5);

    expect(Number.isNaN(Date.parse(snapshot.fetchedAt))).toBe(false); // valid ISO datetime
  });

  it('round-trips a conversion back to the original amount', () => {
    const snapshot = parseTgjuAjax(ajaxFixture);
    const there = convert(snapshot, 'GBP', 'IRR', 250);
    const back = convert(snapshot, 'IRR', 'GBP', there.amount);
    expect(back.amount).toBeCloseTo(250, 6);
  });

  it('ignores extra symbols it does not consume (zinc, xrp-irr, …)', () => {
    const snapshot = parseTgjuAjax(ajaxFixture);
    expect(snapshot.rates.some((r) => !['IRR', ...TGJU_PROFILES.map((p) => p.code)].includes(r.code))).toBe(false);
  });

  it('tolerates Persian-digit prices from the payload', () => {
    const payload = fixtureCopy();
    payload.current['price_eur']!.p = '۲,۶۶۳,۰۰۰'; // 2,663,000 in Persian digits

    const snapshot = parseTgjuAjax(payload);
    expect(getRate(snapshot, 'EUR').rate).toBe(1 / 266_300);
  });

  it('throws a typed error when a profile slug is missing (upstream change)', () => {
    const payload = fixtureCopy();
    delete payload.current['price_krw'];

    expect(() => parseTgjuAjax(payload)).toThrowError(ScraperError);
    try {
      parseTgjuAjax(payload);
      expect.unreachable('must throw');
    } catch (err) {
      expect((err as ScraperError).code).toBe('tgju_missing_slug');
      expect((err as ScraperError).message).toContain('price_krw');
    }
  });

  it('throws a typed error when the payload shape changes', () => {
    expect(() => parseTgjuAjax({ current: 'nope' })).toThrowError(ScraperError);
    expect(() => parseTgjuAjax({})).toThrowError(ScraperError);
  });
});

describe('parseTgjuProfilePrice (fixture: real 2026-09-16 capture excerpt)', () => {
  it('extracts the PDrCotVal Rial price', () => {
    expect(parseTgjuProfilePrice(profileHtml)).toBe(2_305_000);
  });

  it('extracts a Persian-digit variant', () => {
    const html = profileHtml.replaceAll('2,305,000', '۲,۳۰۵,۰۰۰');
    expect(parseTgjuProfilePrice(html)).toBe(2_305_000);
  });

  it('throws a typed error when the span is absent (upstream change)', () => {
    expect(() => parseTgjuProfilePrice('<html><body>nothing here</body></html>')).toThrowError(ScraperError);
  });
});

describe('scrapeTgju (fake fetch — never hits live sites)', () => {
  /** URL-router fake fetch: exact match, '*' default, 404 when nothing matches. */
  function makeFetch(routes: Record<string, string | Response>): {
    fetchImpl: typeof fetch;
    urls: string[];
  } {
    const urls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      urls.push(url);
      const body = routes[url] ?? routes['*'];
      if (body === undefined) return new Response('not found', { status: 404 });
      return body instanceof Response ? body : new Response(body, { status: 200 });
    };
    return { fetchImpl, urls };
  }

  it('PRIMARY: one ajax.json request is enough', async () => {
    const { fetchImpl, urls } = makeFetch({ [TGJU_AJAX_URL]: JSON.stringify(ajaxFixture) });

    const snapshot = await scrapeTgju({ fetchImpl, retries: 0 });

    expect(urls).toEqual([TGJU_AJAX_URL]);
    expect(getRate(snapshot, 'USD').rate).toBe(1 / 230_500);
  });

  it('FALLBACK: scrapes the 16 profile pages (≤4 in flight) when ajax.json fails', async () => {
    // Per-slug Rial prices (distinct values, realistic magnitudes).
    const rialBySlug: Record<string, string> = {
      price_dollar_rl: '2,305,000',
      price_eur: '2,663,000',
      price_gbp: '3,100,700',
      price_aud: '1,647,300',
      price_cad: '1,655,200',
      price_try: '48,250',
      price_aed: '630,400',
      price_cny: '346,300',
      price_chf: '2,819,500',
      price_jpy: '1,490,500',
      price_krw: '1,691',
      price_myr: '570,500',
      price_idr: '111',
      price_php: '36,700',
      price_vnd: '75',
      price_nzd: '1,329,800',
    };

    let inFlight = 0;
    let maxInFlight = 0;
    const routes: Record<string, string | Response> = {
      [TGJU_AJAX_URL]: new Response('error 1042', { status: 502 }),
    };
    for (const { slug } of TGJU_PROFILES) {
      routes[tgjuProfilePageUrl(slug)] = profileHtml.replaceAll('2,305,000', rialBySlug[slug] ?? '2,305,000');
    }

    const urls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      urls.push(url);
      const body = routes[url];
      if (body === undefined) return new Response('not found', { status: 404 });
      if (url.includes('/profile/')) {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 1));
        inFlight--;
      }
      return body instanceof Response ? body : new Response(body, { status: 200 });
    };

    const snapshot = await scrapeTgju({ fetchImpl, retries: 0 });

    expect(urls[0]).toBe(TGJU_AJAX_URL);
    expect(urls).toHaveLength(17); // 1 failed ajax + 16 profile pages
    expect(maxInFlight).toBeLessThanOrEqual(4);
    expect(snapshot.rates).toHaveLength(17);
    expect(getRate(snapshot, 'USD').rate).toBe(1 / 230_500);
    expect(getRate(snapshot, 'EUR').rate).toBe(1 / 266_300);
    expect(getRate(snapshot, 'VND').rate).toBe(1 / 7.5);
  });

  it('throws a typed combined error when BOTH paths fail', async () => {
    const { fetchImpl } = makeFetch({}); // everything 404s

    await expect(scrapeTgju({ fetchImpl, retries: 0 })).rejects.toThrowError(ScraperError);

    try {
      await scrapeTgju({ fetchImpl, retries: 0 });
      expect.unreachable('must throw');
    } catch (err) {
      expect((err as ScraperError).code).toBe('tgju_scrape_failed');
      expect((err as ScraperError).message).toContain('ajax.json');
      expect((err as ScraperError).message).toContain('profile');
    }
  });

  it('falls back when ajax.json returns valid JSON but a slug is missing', async () => {
    const payload = fixtureCopy();
    delete payload.current['price_try'];
    const profileRoutes: Record<string, string | Response> = {
      [TGJU_AJAX_URL]: JSON.stringify(payload),
    };
    for (const { slug } of TGJU_PROFILES) {
      profileRoutes[tgjuProfilePageUrl(slug)] = profileHtml.replaceAll('2,305,000', '48,250');
    }
    const { fetchImpl } = makeFetch(profileRoutes);

    const snapshot = await scrapeTgju({ fetchImpl, retries: 0 });
    expect(getRate(snapshot, 'TRY').rate).toBe(1 / 4_825); // from the profile fallback
  });
});

describe('buildTgjuSnapshot validation', () => {
  it('zod-validates the built snapshot (rate must be positive finite)', () => {
    const rialBySlug = new Map(TGJU_PROFILES.map(({ slug }) => [slug, 2_305_000]));
    expect(() => buildTgjuSnapshot(rialBySlug)).not.toThrow();

    const broken = new Map(rialBySlug);
    broken.set('price_krw', 0); // zero Rial → zero rate → invalid
    expect(() => buildTgjuSnapshot(broken)).toThrowError(ScraperError);
  });

  it('produces a snapshot that satisfies the core schema', () => {
    const rialBySlug = new Map(TGJU_PROFILES.map(({ slug }) => [slug, 2_305_000]));
    const snapshot: Snapshot = buildTgjuSnapshot(rialBySlug);
    expect(snapshot.source).toBe('tgju');
    expect(snapshot.rates.every((r) => r.rate > 0 && Number.isFinite(r.rate))).toBe(true);
  });
});
