/**
 * /api/meta — static-ish discovery payload for UI dropdowns: the 17 legacy
 * currencies (code/name/symbol/minorUnits/tgjuProfileUrl from core), the
 * per-source served-currency lists, and documented limitations. Output is
 * zod-validated before it is served (everything crossing a trust boundary).
 */

import { CURRENCIES, CurrencyCodeSchema, tgjuProfileUrl } from '@currena/core';
import { z } from 'zod';

/**
 * Currencies Frankfurter served as of the 2026-09-16 capture (29 codes; the
 * live snapshot is authoritative at runtime — this list feeds UI hints only).
 * AED and VND are deliberately absent.
 */
export const FRANKFURTER_CURRENCIES: readonly string[] = [
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD',
  'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK',
  'NZD', 'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'ZAR',
];

export const MetaCurrencySchema = z.object({
  code: CurrencyCodeSchema,
  name: z.string().min(1),
  symbol: z.string(),
  minorUnits: z.number().int().min(0),
  tgjuProfileUrl: z.url().optional(),
});

export const MetaResponseSchema = z.object({
  currencies: z.array(MetaCurrencySchema).min(1),
  sources: z.object({
    tgju: z.object({
      base: CurrencyCodeSchema,
      currencies: z.array(CurrencyCodeSchema).min(1),
    }),
    frankfurter: z.object({
      base: CurrencyCodeSchema,
      currencies: z.array(CurrencyCodeSchema).min(1),
    }),
  }),
  limitations: z.array(z.string().min(1)),
});

export type MetaResponse = z.infer<typeof MetaResponseSchema>;

export function buildMeta(): MetaResponse {
  const currencies = CURRENCIES.map((c) => {
    const profileUrl = tgjuProfileUrl(c.code);
    return {
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      minorUnits: c.minorUnits,
      ...(profileUrl ? { tgjuProfileUrl: profileUrl } : {}),
    };
  });

  const tgjuServed = ['IRR', ...CURRENCIES.filter((c) => c.tgjuProfile).map((c) => c.code)];
  const frankfurterServed = ['USD', ...FRANKFURTER_CURRENCIES];

  return MetaResponseSchema.parse({
    currencies,
    sources: {
      tgju: { base: 'IRR', currencies: tgjuServed },
      frankfurter: { base: 'USD', currencies: frankfurterServed },
    },
    limitations: [
      'International pairs involving AED or VND are not supported: Frankfurter (the international source) does not serve these currencies. Pairs against IRR (Toman) remain fully supported via TGJU.',
      `Frankfurter serves ECB reference rates for ${FRANKFURTER_CURRENCIES.length} currencies (list as of 2026-09-16); the live snapshot is authoritative at runtime.`,
      "IRR values are Toman-denominated (code 'IRR', unit 'TOMAN') — the canonical Iranian unit.",
    ],
  });
}
