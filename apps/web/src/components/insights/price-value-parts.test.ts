/**
 * price-value-parts.test.ts — the prices cards' price-line split (the
 * 2026-10-25b asset-cards round, task §5): the number and its currency
 * as separate parts for the one-line price composition, built from the
 * SAME display config as indicatorValueParts (no string surgery).
 *
 *   en: { prefix: 'US$', number: '4,166' }         → "US$4,166"
 *   fa: { number: '۴٬۱۶۶', suffix: 'دلار' }         → «۴٬۱۶۶ دلار»
 *
 * The special compositions (percent, ranges, usd-tr) fall back to the
 * joined form with no currency element — the four board assets (usd
 * unit) always take the split path.
 */

import { describe, expect, it } from 'vitest';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { priceValueParts } from './config';

const en = insightsCopyEn.units;
const fa = insightsCopyFa.units;

describe('priceValueParts', () => {
  it('splits the en price into a currency prefix + the number (all four board assets)', () => {
    expect(priceValueParts('gold-usd', 4166.1, 'en-US', en)).toEqual({
      number: '4,166',
      prefix: 'US$',
      suffix: null,
    });
    expect(priceValueParts('silver-usd', 57.116, 'en-US', en)).toEqual({
      number: '57.12',
      prefix: 'US$',
      suffix: null,
    });
    expect(priceValueParts('brent', 109.86, 'en-US', en)).toEqual({
      number: '109.86',
      prefix: 'US$',
      suffix: null,
    });
    expect(priceValueParts('btc-usd', 81582.859, 'en-US', en)).toEqual({
      number: '81,583',
      prefix: 'US$',
      suffix: null,
    });
  });

  it('splits the fa price into the number + a currency suffix', () => {
    expect(priceValueParts('gold-usd', 4166.1, 'fa-IR', fa)).toEqual({
      number: '۴٬۱۶۶',
      prefix: null,
      suffix: 'دلار',
    });
    expect(priceValueParts('btc-usd', 81582.859, 'fa-IR', fa)).toEqual({
      number: '۸۱٬۵۸۳',
      prefix: null,
      suffix: 'دلار',
    });
  });

  it('keeps the joined form for compositions the price line never splits', () => {
    // percent ('5.31%'), the fed-target corridor range, usd-tr magnitude.
    const pct = priceValueParts('us10y', 5.31, 'en-US', en);
    expect(pct).toEqual({ number: '5.31%', prefix: null, suffix: null });
    const faPct = priceValueParts('us10y', 5.31, 'fa-IR', fa);
    expect(faPct).toEqual({ number: '۵٫۳۱٪', prefix: null, suffix: null });
  });
});
