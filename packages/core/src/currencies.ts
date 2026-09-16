/**
 * Static currency metadata for the 17 legacy currencies
 * (docs/FEATURE_MAP.md §5 — extracted from the live site, 2026-09-16).
 *
 * Naming rule (Gate 1 decision #4): `name` is the INTERNATIONAL COMMON NAME
 * (ISO 4217 / CLDR en) — AED is "UAE Dirham", IRR is "Iranian Rial".
 * The `fa` locale (and any legacy-style en labels such as "Iranian Toman")
 * are UI concerns rendered from apps/web/src/i18n — core never localizes.
 */

// Private literal-typed source of truth: `satisfies` checks the shape while
// preserving the literal union used to derive `CurrencyCode`.
const LEGACY_CURRENCIES = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnits: 2,
    tgjuProfile: 'price_dollar_rl',
  },
  {
    // Canonical Iranian unit is TOMAN under code IRR (AGENTS.md §6):
    // TGJU quotes and every served IRR value are Toman-denominated.
    // The en-UI display label "Iranian Toman" comes from the i18n dictionary.
    code: 'IRR',
    name: 'Iranian Rial',
    symbol: '﷼',
    minorUnits: 0,
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    minorUnits: 2,
    tgjuProfile: 'price_eur',
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    minorUnits: 2,
    tgjuProfile: 'price_gbp',
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    minorUnits: 2,
    tgjuProfile: 'price_aud',
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    minorUnits: 2,
    tgjuProfile: 'price_cad',
  },
  {
    code: 'AED',
    name: 'UAE Dirham', // Gate 1 decision #4 — legacy labels were inconsistent
    symbol: 'د.إ',
    minorUnits: 2,
    tgjuProfile: 'price_aed',
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    minorUnits: 2,
    tgjuProfile: 'price_cny',
  },
  {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    minorUnits: 2,
    tgjuProfile: 'price_nzd',
  },
  {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    minorUnits: 2,
    tgjuProfile: 'price_try',
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    minorUnits: 2,
    tgjuProfile: 'price_chf',
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    minorUnits: 0,
    tgjuProfile: 'price_jpy',
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    minorUnits: 0,
    tgjuProfile: 'price_krw',
  },
  {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    minorUnits: 2,
    tgjuProfile: 'price_myr',
  },
  {
    // ISO 4217 lists an exponent of 2 for IDR, but the minor unit is unused —
    // CLDR display convention (and this table) use 0 decimals.
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    minorUnits: 0,
    tgjuProfile: 'price_idr',
  },
  {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱',
    minorUnits: 2,
    tgjuProfile: 'price_php',
  },
  {
    code: 'VND',
    name: 'Vietnamese Dong',
    symbol: '₫',
    minorUnits: 0,
    tgjuProfile: 'price_vnd',
  },
] as const satisfies readonly {
  code: string;
  name: string;
  symbol: string;
  minorUnits: number;
  tgjuProfile?: string;
}[];

/** Union type of the 17 supported codes. */
export type CurrencyCode = (typeof LEGACY_CURRENCIES)[number]['code'];

/** Static metadata for one currency. */
export type CurrencyMeta = {
  readonly code: CurrencyCode;
  /** International common name (ISO 4217 / CLDR en). */
  readonly name: string;
  readonly symbol: string;
  /** Decimal digits used when rendering amounts (0 for IRR/JPY/KRW/IDR/VND). */
  readonly minorUnits: number;
  /** TGJU profile slug (https://www.tgju.org/profile/<slug>); IRR is the base and has none. */
  readonly tgjuProfile?: string;
};

/** The 17 legacy currencies with their TGJU profile slugs (FEATURE_MAP §5). */
export const CURRENCIES: readonly CurrencyMeta[] = LEGACY_CURRENCIES;

const byCode = new Map<string, CurrencyMeta>(
  LEGACY_CURRENCIES.map((c) => [c.code as string, c as CurrencyMeta]),
);

/** Absolute TGJU profile URL for a code (e.g. 'price_dollar_rl'), or undefined. */
export function tgjuProfileUrl(code: string): string | undefined {
  const slug = byCode.get(code)?.tgjuProfile;
  return slug ? `https://www.tgju.org/profile/${slug}` : undefined;
}

/** Look up static metadata for a currency code (undefined when unknown). */
export function getCurrency(code: string): CurrencyMeta | undefined {
  return byCode.get(code);
}

/** Type guard: is this one of the 17 supported codes? (Case-sensitive, uppercase.) */
export function isCurrencyCode(s: string): s is CurrencyCode {
  return byCode.has(s);
}
