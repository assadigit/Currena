/**
 * tgju-history.test.ts — GPE R30 / F3b (2026-11-19): the profile-history
 * parse tests — the four live-captured fixture pages (captured 2026-11-19,
 * the S16 M1 probe; tests NEVER hit live sites, AGENTS.md rule 7).
 */

import { describe, expect, it } from 'vitest';
import baharFixture from '../fixtures/tgju-history-sekeb.html?raw';
import dollarFixture from '../fixtures/tgju-history-price_dollar_rl.html?raw';
import onsFixture from '../fixtures/tgju-history-ons.html?raw';
import sekeeFixture from '../fixtures/tgju-history-sekee.html?raw';
import { ScraperError } from './errors';
import {
  TGJU_PREMIUM_BACKFILL_SLUGS,
  fetchTgjuProfileHistory,
  parseTgjuProfileHistory,
  tgjuProfileHistoryUrl,
} from './tgju-history';

const FIXTURE_BY_SLUG: Record<string, string> = {
  sekee: sekeeFixture,
  sekeb: baharFixture,
  ons: onsFixture,
  price_dollar_rl: dollarFixture,
};

function fixture(slug: string): string {
  return FIXTURE_BY_SLUG[slug] ?? '';
}

describe('tgjuProfileHistoryUrl', () => {
  it('builds the /history route on the profile base', () => {
    expect(tgjuProfileHistoryUrl('sekee')).toBe('https://www.tgju.org/profile/sekee/history');
  });
});

describe('parseTgjuProfileHistory', () => {
  it('parses the live-captured sekee page: 30 rows, newest first, both dates well-formed', () => {
    const rows = parseTgjuProfileHistory(fixture('sekee'));
    expect(rows).toHaveLength(30);
    // The page serves newest-first (its own order — documented).
    expect(rows[0]!.date).toBe('2026-11-18');
    expect(rows[29]!.date).toBe('2026-10-15');
    // The first data row, verbatim from the capture:
    // بازگشایی 2,503,700,000 · کمترین 2,503,400,000 · بیشترین 2,508,000,000
    // · پایانی 2,507,400,000 · 2026/11/18 (میلادی) · 1405/08/27 (شمسی)
    expect(rows[0]!.open).toBe(2_503_700_000);
    expect(rows[0]!.low).toBe(2_503_400_000);
    expect(rows[0]!.high).toBe(2_508_000_000);
    expect(rows[0]!.close).toBe(2_507_400_000);
  });

  it('parses all four backfill legs (the s8/01 R30 set)', () => {
    for (const slug of TGJU_PREMIUM_BACKFILL_SLUGS) {
      const rows = parseTgjuProfileHistory(fixture(slug));
      expect(rows.length).toBeGreaterThanOrEqual(24);
      for (const r of rows) {
        expect(r.close).toBeGreaterThan(0);
        expect(r.low).toBeLessThanOrEqual(r.high);
        expect(r.open).toBeGreaterThan(0);
      }
    }
  });

  it('keeps the ounce leg in USD and the dollar leg in Rial (the units are the pages\' own)', () => {
    const ons = parseTgjuProfileHistory(fixture('ons'));
    const dollar = parseTgjuProfileHistory(fixture('price_dollar_rl'));
    // ons prints ~3,725.80 (USD per troy ounce) on 2026-11-18.
    expect(ons[0]!.date).toBe('2026-11-18');
    expect(ons[0]!.close).toBeGreaterThan(3_000);
    expect(ons[0]!.close).toBeLessThan(4_500);
    // price_dollar_rl prints Rial with commas (266,330 → wait: the
    // captured close is 2,663,300 Rial = 266,330 Toman — the ÷10 happens
    // downstream, NEVER here).
    expect(dollar[0]!.close).toBeGreaterThan(2_000_000);
    expect(dollar[0]!.close).toBeLessThan(3_500_000);
  });

  it('throws a typed error when the history table is absent (upstream layout change)', () => {
    const page = '<html><body><table class="table"><thead><tr><th>قیمت</th></tr></thead></table></body></html>';
    expect(() => parseTgjuProfileHistory(page)).toThrow(ScraperError);
    expect(() => parseTgjuProfileHistory(page)).toThrow(/no daily history table/);
  });

  it('throws when a row has the wrong cell count', () => {
    const page = [
      '<table><thead><tr><th>بازگشایی</th><th>کمترین</th><th>بیشترین</th><th>پایانی</th>',
      '<th>میزان تغییر</th><th>درصد تغییر</th><th>تاریخ / میلادی</th><th>تاریخ / شمسی</th></tr></thead>',
      '<tbody><tr><td>1</td><td>1</td><td>1</td><td>1</td><td>0</td><td>0%</td><td>2026/11/18</td></tr></tbody></table>',
    ].join('');
    expect(() => parseTgjuProfileHistory(page)).toThrow(/7 cells/);
  });

  it('throws when the date cells do not match the میلادی/شمسی shape', () => {
    const row = [
      '<tr><td>1,000</td><td>1,000</td><td>1,000</td><td>1,000</td><td>0</td><td>0%</td>',
      '<td>18 نوامبر</td><td>1405/08/27</td></tr>',
    ].join('');
    const page = [
      '<table><thead><tr><th>بازگشایی</th><th>کمترین</th><th>بیشترین</th><th>پایانی</th>',
      '<th>میزان تغییر</th><th>درصد تغییر</th><th>تاریخ / میلادی</th><th>تاریخ / شمسی</th></tr></thead>',
      `<tbody>${row}</tbody></table>`,
    ].join('');
    expect(() => parseTgjuProfileHistory(page)).toThrow(/میلادی\/شمسی shape/);
  });

  it('ignores the profile page\'s page-1 table (the 7-column shape) and the امروز live table', () => {
    // The page-1 history table has 7 columns and NO میلادی column; the
    // امروز table has different headers. Neither may match.
    const decoy = [
      '<table class="table table-hover text-center"><thead><tr><th>تاریخ</th><th>بازگشایی</th>',
      '<th>کمترین</th><th>بیشترین</th><th>پایانی</th><th>درصد تغییر</th><th>حجم</th></tr></thead>',
      '<tbody><tr><td>1405/08/27</td><td>1</td><td>1</td><td>1</td><td>1</td><td>1%</td><td>1</td></tr></tbody></table>',
    ].join('');
    expect(() => parseTgjuProfileHistory(decoy)).toThrow(ScraperError);
  });
});

describe('fetchTgjuProfileHistory', () => {
  it('fetches the /history URL and parses the body (fetchImpl-injected fixture)', async () => {
    const rows = await fetchTgjuProfileHistory('sekee', {
      fetchImpl: (async () =>
        new Response(fixture('sekee'), { status: 200, headers: { 'content-type': 'text/html' } })) as typeof fetch,
      retries: 0,
    });
    expect(rows).toHaveLength(30);
    expect(rows[0]!.date).toBe('2026-11-18');
  });
});
