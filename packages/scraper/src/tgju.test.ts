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
  parseTgjuGold,
  parseTgjuProfilePrice,
  parseTgjuProfileStats,
  rialToToman,
  scrapeTgju,
  TGJU_AJAX_URL,
  TGJU_PROFILES,
  tgjuProfilePageUrl,
} from './tgju';
import type { TgjuRialQuote } from './tgju';

/** Deep, mutable copy of the fixture payload for per-test mutation. */
function fixtureCopy(): { current: Record<string, { p: string; h?: string; l?: string }> } {
  return JSON.parse(JSON.stringify(ajaxFixture)) as {
    current: Record<string, { p: string; h?: string; l?: string }>;
  };
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

  it('carries the TGJU day stats, quote-side in Toman (h/l → dayHigh/dayLow)', () => {
    const snapshot = parseTgjuAjax(ajaxFixture);

    // price_dollar_rl h="2,311,200" l="2,293,600" (Rial) → 231,120 / 229,360 Toman.
    const usd = getRate(snapshot, 'USD');
    expect(usd.dayHigh).toBe(231_120);
    expect(usd.dayLow).toBe(229_360);

    // price_eur h="2,672,900" l="2,649,800" → 267,290 / 264,980 Toman.
    const eur = getRate(snapshot, 'EUR');
    expect(eur.dayHigh).toBe(267_290);
    expect(eur.dayLow).toBe(264_980);

    // Small quotes ride along unchanged: price_krw h=1,691 → 169.1 Toman.
    expect(getRate(snapshot, 'KRW').dayHigh).toBe(169.1);
  });

  it('leaves day stats ABSENT when TGJU does not publish them (blank or missing h/l)', () => {
    const payload = fixtureCopy();
    delete payload.current['price_dollar_rl']!.h;
    payload.current['price_dollar_rl']!.l = '';

    const usd = getRate(parseTgjuAjax(payload), 'USD');
    expect(usd.dayHigh).toBeUndefined();
    expect(usd.dayLow).toBeUndefined();
    expect(usd.rate).toBe(1 / 230_500); // current price unaffected
  });

  it('throws a typed error for a malformed day stat (upstream format change)', () => {
    const payload = fixtureCopy();
    payload.current['price_gbp']!.h = 'n/a';

    expect(() => parseTgjuAjax(payload)).toThrowError(ScraperError);
  });

  it('DROPS an inverted day (low > high — glitch) instead of failing the price', () => {
    const payload = fixtureCopy();
    const g = payload.current['price_gbp']!;
    const high = g.l; // swap: now low > high
    g.l = g.h;
    g.h = high;

    const usd = getRate(parseTgjuAjax(payload), 'GBP');
    expect(usd.dayHigh).toBeUndefined();
    expect(usd.dayLow).toBeUndefined();
    expect(usd.rate).toBe(1 / 310_070); // current price still served
  });

  it('keeps the IRR self-rate free of day stats', () => {
    const snapshot = parseTgjuAjax(ajaxFixture);
    const irr = snapshot.rates.find((r) => r.code === 'IRR');
    expect(irr?.dayHigh).toBeUndefined();
    expect(irr?.dayLow).toBeUndefined();
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

describe('parseTgjuGold / snapshot.gold (fixture: real 2026-09-27 capture)', () => {
  it('GOLDEN: all 9 items, display order, Tehran items converted Rial→Toman (÷10)', () => {
    const snapshot = parseTgjuAjax(ajaxFixture);
    const gold = snapshot.gold;
    expect(gold).toBeDefined();
    expect(gold?.map((g) => g.id)).toEqual([
      'gold-ounce', 'gold-18k', 'gold-24k', 'gold-used',
      'coin-emami', 'coin-bahar', 'coin-half', 'coin-quarter', 'coin-gram',
    ]);
    // The ounce the owner linked (tgju.org/profile/ons): USD with 2 decimals.
    const ounce = gold?.[0];
    expect(ounce?.unit).toBe('USD');
    expect(ounce?.price).toBe(4383.45);
    expect(ounce?.dayHigh).toBe(4383.45);
    expect(ounce?.dayLow).toBe(4377.04);
    expect(ounce?.changePct).toBe(0.05);
    // The Tehran market: TGJU prints Rial; the quote is TOMAN (÷10) —
    // owner request 2026-09-19 (1000 Rial = 100 Toman).
    const g18 = gold?.find((g) => g.id === 'gold-18k');
    expect(g18?.unit).toBe('TOMAN');
    expect(g18?.price).toBe(23_363_000);
    expect(g18?.dayHigh).toBe(23_499_500);
    expect(g18?.dayLow).toBe(23_210_900);
    expect(g18?.changePct).toBe(0);
    // طلای دست دوم rides the odd-looking gold_mini_size slug (verified by exact p/h/l).
    expect(gold?.find((g) => g.id === 'gold-used')?.price).toBe(23_051_518);
    // سکه امامی = sekee, سکه بهار آزادی = sekeb (both ~232M Toman).
    expect(gold?.find((g) => g.id === 'coin-emami')?.price).toBe(231_985_000);
    expect(gold?.find((g) => g.id === 'coin-bahar')?.price).toBe(228_105_000);
    expect(gold?.find((g) => g.id === 'coin-half')?.price).toBe(119_000_000);
    expect(gold?.find((g) => g.id === 'coin-quarter')?.price).toBe(63_000_000);
    expect(gold?.find((g) => g.id === 'coin-gram')?.price).toBe(33_000_000);
  });

  it('gold never leaks into the FX ladder: rates stay currency-only and untouched', () => {
    const snapshot = parseTgjuAjax(ajaxFixture);
    expect(getRate(snapshot, 'USD').rate).toBe(1 / 230_500);
    expect(snapshot.rates.every((r) => /^[A-Z]{3}$/.test(r.code))).toBe(true);
  });

  it('a MISSING gold symbol degrades to an omitted item — never a failed FX scrape', () => {
    const payload = JSON.parse(JSON.stringify(ajaxFixture)) as { current: Record<string, unknown> };
    delete payload.current.sekeb;
    const snapshot = parseTgjuAjax(payload);
    expect(snapshot.gold?.some((g) => g.id === 'coin-bahar')).toBe(false);
    expect(snapshot.gold?.length).toBe(8);
    expect(getRate(snapshot, 'USD').rate).toBe(1 / 230_500);
  });

  it('a MALFORMED gold price is skipped with a warn — garbage is never rendered, FX survives', () => {
    const payload = JSON.parse(JSON.stringify(ajaxFixture)) as { current: Record<string, unknown> };
    (payload.current.geram18 as { p: string }).p = 'call me maybe';
    const snapshot = parseTgjuAjax(payload);
    expect(snapshot.gold?.some((g) => g.id === 'gold-18k')).toBe(false);
    expect(getRate(snapshot, 'USD').rate).toBe(1 / 230_500);
  });

  it('an odd dp (string instead of number) skips the whole entry shape — FX still parses', () => {
    const payload = JSON.parse(JSON.stringify(ajaxFixture)) as { current: Record<string, unknown> };
    (payload.current.ons as { dp: unknown }).dp = '0.05';
    const snapshot = parseTgjuAjax(payload);
    expect(snapshot.gold?.some((g) => g.id === 'gold-ounce')).toBe(false);
    expect(getRate(snapshot, 'USD').rate).toBe(1 / 230_500);
  });

  it('drops an inverted gold day (low > high) but keeps the price', () => {
    const payload = JSON.parse(JSON.stringify(ajaxFixture)) as { current: Record<string, unknown> };
    const g = payload.current.geram24 as { h?: string; l?: string };
    const swap = g.h;
    g.h = g.l;
    g.l = swap;
    const item = parseTgjuAjax(payload).gold?.find((x) => x.id === 'gold-24k');
    expect(item?.price).toBe(31_150_400);
    expect(item?.dayHigh).toBeUndefined();
    expect(item?.dayLow).toBeUndefined();
  });

  it('blank/missing gold h/l → stats absent, price unaffected', () => {
    const payload = JSON.parse(JSON.stringify(ajaxFixture)) as { current: Record<string, unknown> };
    const g = payload.current.nim as { h?: string; l?: string };
    g.h = '';
    delete g.l;
    const item = parseTgjuAjax(payload).gold?.find((x) => x.id === 'coin-half');
    expect(item?.price).toBe(119_000_000);
    expect(item?.dayHigh).toBeUndefined();
    expect(item?.dayLow).toBeUndefined();
  });

  it('a legacy payload with NO gold symbols yields gold: [] (board shows dashes, snapshot valid)', () => {
    const payload = JSON.parse(JSON.stringify(ajaxFixture)) as { current: Record<string, unknown> };
    for (const slug of ['ons', 'geram18', 'geram24', 'gold_mini_size', 'sekee', 'sekeb', 'nim', 'rob', 'gerami']) {
      delete payload.current[slug];
    }
    const snapshot = parseTgjuAjax(payload);
    expect(snapshot.gold).toEqual([]);
    expect(getRate(snapshot, 'USD').rate).toBe(1 / 230_500);
  });

  it('parseTgjuGold on garbage input → [] (no throw)', () => {
    expect(parseTgjuGold(null)).toEqual([]);
    expect(parseTgjuGold({})).toEqual([]);
    expect(parseTgjuGold({ current: 'nope' })).toEqual([]);
  });

  it('buildTgjuSnapshot without gold → the key is ABSENT (profile-page fallback path)', () => {
    const quotes = new Map<string, TgjuRialQuote>(TGJU_PROFILES.map(({ slug }) => [slug, { p: 2_305_000 }]));
    const snapshot = buildTgjuSnapshot(quotes, new Date('2026-09-27T01:00:00Z'));
    expect('gold' in snapshot).toBe(false);
  });
});

describe('parseTgjuProfileStats (fixture: real summary-table capture)', () => {
  it('extracts day high/low Rial values from the «مقادیر» table', () => {
    expect(parseTgjuProfileStats(profileHtml)).toEqual({ dayHigh: 2_311_200, dayLow: 2_293_600 });
  });

  it('skips unpublished stats (dash values) and ignores the current-price row', () => {
    // Only the نرخ فعلی row present (bare td, no span) → no stats consumed.
    const html = '<table><tbody><tr><td class="text-right">نرخ فعلی</td><td class="text-left">2,279,000</td></tr></tbody></table>';
    expect(parseTgjuProfileStats(html)).toEqual({});
  });

  it('returns {} when the summary rows are absent entirely', () => {
    expect(parseTgjuProfileStats('<html><body>no summary table</body></html>')).toEqual({});
  });

  it('treats dash values as not published', () => {
    const html = profileHtml
      .replaceAll('2,311,200', '-')
      .replaceAll('2,293,600', '-');
    expect(parseTgjuProfileStats(html)).toEqual({});
  });

  it('throws a typed error for a present-but-garbage value', () => {
    const html = profileHtml.replaceAll('2,311,200', '??');
    expect(() => parseTgjuProfileStats(html)).toThrowError(ScraperError);
  });

  it('parses Persian-digit stats', () => {
    const html = profileHtml.replaceAll('2,311,200', '۲,۳۱۱,۲۰۰');
    expect(parseTgjuProfileStats(html).dayHigh).toBe(2_311_200);
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
  /** URL-router fake fetch: ajax.json matches by PREFIX (the scraper
   *  cache-busts it with ?cb=<ts> against TGJU's stale edge HITs — see
   *  scrapeTgju), everything else exact, '*' default, 404 when no match. */
  function makeFetch(routes: Record<string, string | Response>): {
    fetchImpl: typeof fetch;
    urls: string[];
  } {
    const urls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      urls.push(url);
      const body =
        routes[url] ??
        (url.startsWith(`${TGJU_AJAX_URL}?`) ? routes[TGJU_AJAX_URL] : undefined) ??
        routes['*'];
      if (body === undefined) return new Response('not found', { status: 404 });
      return body instanceof Response ? body : new Response(body, { status: 200 });
    };
    return { fetchImpl, urls };
  }

  it('PRIMARY: one ajax.json request is enough', async () => {
    const { fetchImpl, urls } = makeFetch({ [TGJU_AJAX_URL]: JSON.stringify(ajaxFixture) });

    const snapshot = await scrapeTgju({ fetchImpl, retries: 0 });

    // The ajax call is cache-busted (?cb=<ts>) — one request, prefix-matched.
    expect(urls).toHaveLength(1);
    expect(urls[0]!.startsWith(`${TGJU_AJAX_URL}?cb=`)).toBe(true);
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

    expect(urls[0]!.startsWith(`${TGJU_AJAX_URL}?cb=`)).toBe(true);
    expect(urls).toHaveLength(17); // 1 failed ajax + 16 profile pages
    expect(maxInFlight).toBeLessThanOrEqual(4);
    expect(snapshot.rates).toHaveLength(17);
    expect(getRate(snapshot, 'USD').rate).toBe(1 / 230_500);
    expect(getRate(snapshot, 'EUR').rate).toBe(1 / 266_300);
    expect(getRate(snapshot, 'VND').rate).toBe(1 / 7.5);

    // Day stats survive the fallback path too (summary table of every page).
    expect(getRate(snapshot, 'USD').dayHigh).toBe(231_120);
    expect(getRate(snapshot, 'USD').dayLow).toBe(229_360);
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
  /** Fully-populated quotes for every slug (stats included). */
  function fullQuotes(): Map<string, TgjuRialQuote> {
    return new Map(
      TGJU_PROFILES.map(({ slug }) => [slug, { p: 2_305_000, dayHigh: 2_311_200, dayLow: 2_293_600 }]),
    );
  }

  it('zod-validates the built snapshot (rate must be positive finite)', () => {
    const quotesBySlug = fullQuotes();
    expect(() => buildTgjuSnapshot(quotesBySlug)).not.toThrow();

    const broken = new Map(quotesBySlug);
    broken.set('price_krw', { p: 0 }); // zero Rial → zero rate → invalid
    expect(() => buildTgjuSnapshot(broken)).toThrowError(ScraperError);
  });

  it('rejects an invalid day stat at the schema boundary (belt-and-braces)', () => {
    const glitched = fullQuotes();
    glitched.set('price_dollar_rl', { p: 2_305_000, dayHigh: Number.NaN });
    expect(() => buildTgjuSnapshot(glitched)).toThrowError(ScraperError);
  });

  it('produces a snapshot that satisfies the core schema', () => {
    const snapshot: Snapshot = buildTgjuSnapshot(fullQuotes());
    expect(snapshot.source).toBe('tgju');
    expect(snapshot.rates.every((r) => r.rate > 0 && Number.isFinite(r.rate))).toBe(true);
    expect(getRate(snapshot, 'USD').dayHigh).toBe(231_120);
    expect(getRate(snapshot, 'USD').dayLow).toBe(229_360);
  });
});
