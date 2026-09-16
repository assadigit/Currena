import { convert, getRate } from '@currena/core';
import { describe, expect, it } from 'vitest';
import frankfurterFixture from '../fixtures/frankfurter-latest.json';
import { ScraperError } from './errors';
import { buildFrankfurterSnapshot, currencyDisplayName, FRANKFURTER_LATEST_URL, scrapeFrankfurter } from './frankfurter';

describe('buildFrankfurterSnapshot (fixture: real 2026-09-16 capture)', () => {
  it('maps the payload into a USD-base snapshot with a USD self-rate', () => {
    const snapshot = buildFrankfurterSnapshot(frankfurterFixture);

    expect(snapshot.base).toBe('USD');
    expect(snapshot.source).toBe('frankfurter');
    expect(snapshot.rates).toHaveLength(Object.keys(frankfurterFixture.rates).length + 1); // 29 + self

    const usd = getRate(snapshot, 'USD');
    expect(usd.rate).toBe(1);
    expect(usd.name).toBe('US Dollar');
    expect(usd.symbol).toBe('$');
  });

  it('passes ECB rates through unchanged (same convention as the schema)', () => {
    const snapshot = buildFrankfurterSnapshot(frankfurterFixture);

    expect(getRate(snapshot, 'EUR').rate).toBe(frankfurterFixture.rates.EUR);
    expect(getRate(snapshot, 'EUR').name).toBe('Euro');
    expect(getRate(snapshot, 'EUR').symbol).toBe('€');
    expect(getRate(snapshot, 'GBP').rate).toBe(frankfurterFixture.rates.GBP);
    expect(getRate(snapshot, 'TRY').rate).toBe(frankfurterFixture.rates.TRY);
  });

  it('fills names for unknown codes via Intl.DisplayNames, symbols only from core', () => {
    const snapshot = buildFrankfurterSnapshot(frankfurterFixture);

    // BRL is served by Frankfurter but is not one of the 17 legacy currencies.
    const brl = snapshot.rates.find((r) => r.code === 'BRL');
    expect(brl).toBeDefined();
    expect(brl?.name).toBe('Brazilian Real'); // Intl.DisplayNames(['en']) fallback
    expect(brl?.symbol).toBeUndefined(); // core has no symbol for it → omit the key
    expect('symbol' in (brl as object)).toBe(false);

    expect(currencyDisplayName('INR')).toBe('Indian Rupee');
    expect(currencyDisplayName('USD')).toBe('US Dollar'); // core table wins
  });

  it('converts an international pair through the snapshot', () => {
    const snapshot = buildFrankfurterSnapshot(frankfurterFixture);

    const result = convert(snapshot, 'EUR', 'GBP', 100);
    expect(result.rate).toBeCloseTo(frankfurterFixture.rates.GBP! / frankfurterFixture.rates.EUR!, 10);
    expect(result.amount).toBeCloseTo((100 * frankfurterFixture.rates.GBP!) / frankfurterFixture.rates.EUR!, 8);
    expect(result.source).toBe('frankfurter');
  });

  it('has no IRR rate — never fall IRR pairs back to Frankfurter (rule 8)', () => {
    const snapshot = buildFrankfurterSnapshot(frankfurterFixture);
    expect(snapshot.rates.some((r) => r.code === 'IRR')).toBe(false);
    expect(() => getRate(snapshot, 'IRR')).toThrowError(/rate_not_found|IRR/);
  });

  it('throws a typed error on a malformed payload', () => {
    expect(() => buildFrankfurterSnapshot({ hello: 'world' })).toThrowError(ScraperError);
    try {
      buildFrankfurterSnapshot({ amount: 1, base: 'USD', date: 'x', rates: { EUR: 'not-a-number' } });
      expect.unreachable('must throw');
    } catch (err) {
      expect((err as ScraperError).code).toBe('frankfurter_bad_payload');
    }
  });

  it('throws a typed error when the base is not USD', () => {
    try {
      buildFrankfurterSnapshot({ amount: 1, base: 'EUR', date: 'x', rates: { USD: 1.1 } });
      expect.unreachable('must throw');
    } catch (err) {
      expect((err as ScraperError).code).toBe('frankfurter_bad_base');
    }
  });
});

describe('scrapeFrankfurter (fake fetch — never hits live sites)', () => {
  it('fetches /latest?base=USD and returns the validated snapshot', async () => {
    const urls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      urls.push(url);
      expect(url).toBe(FRANKFURTER_LATEST_URL);
      return new Response(JSON.stringify(frankfurterFixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

    const fixedNow = new Date('2026-09-16T12:00:00.000Z');
    const snapshot = await scrapeFrankfurter({ fetchImpl, retries: 0, now: () => fixedNow });

    expect(urls).toEqual([FRANKFURTER_LATEST_URL]);
    expect(snapshot.fetchedAt).toBe(fixedNow.toISOString());
    expect(snapshot.source).toBe('frankfurter');
    expect(getRate(snapshot, 'JPY').rate).toBe(frankfurterFixture.rates.JPY);
  });
});
