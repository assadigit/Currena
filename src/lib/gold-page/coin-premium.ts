/**
 * The Iran-bridge parity engine — the حباب computation the previous
 * gold page's bridge board carried (upstream
 * `packages/insights/src/domains/gold/coin-premium.ts`, ported
 * verbatim): every Tehran instrument = global ounce × free-market
 * dollar × pure-gold content, plus the local premium.
 *
 * Pure + fail-closed: a missing ounce or dollar leg yields a null
 * toman-per-ounce and NO rows (no premium is ever guessed); a missing
 * instrument quote omits that row.
 */

/** The troy ounce in grams. */
export const TROY_OZ_GRAMS = 31.1034768;

/** One instrument's mint spec (the CBI-primary specs). */
export interface CoinSpec {
  id: string;
  totalGrams: number;
  fineness: number;
  pureGrams: number;
}

/** The board's own row order: the coin family, then the weights. */
export const COIN_SPECS: readonly CoinSpec[] = [
  { id: "coin-emami", totalGrams: 8.136, fineness: 0.9, pureGrams: 7.3224 },
  { id: "coin-bahar", totalGrams: 8.136, fineness: 0.9, pureGrams: 7.3224 },
  { id: "coin-half", totalGrams: 8.136 / 2, fineness: 0.9, pureGrams: 3.6612 },
  { id: "coin-quarter", totalGrams: 8.136 / 4, fineness: 0.9, pureGrams: 1.8306 },
  // The gerami: the 1/8-Bahar size, ~1.01 g total × 0.900 — the band's
  // midpoint (0.91 g pure) computes; the ±0.5% ambiguity is disclosed.
  { id: "coin-gram", totalGrams: 1.0111, fineness: 0.9, pureGrams: 0.91 },
  { id: "gold-18k", totalGrams: 1, fineness: 0.75, pureGrams: 0.75 },
  { id: "gold-24k", totalGrams: 1, fineness: 0.9999, pureGrams: 0.9999 },
  // The mesghal آبشده convention: the bazaar's melt-gold weight unit.
  { id: "gold-mesghal", totalGrams: 4.6083, fineness: 0.705, pureGrams: 3.2488515 },
];

/** The instrument names (the dictionary's own, EN + fa). */
export const BRIDGE_INSTRUMENT_NAMES: Record<string, [string, string]> = {
  "gold-ounce": ["Global gold ounce", "اونس جهانی طلا"],
  "gold-18k": ["18K gold (per gram)", "طلای ۱۸ عیار (هر گرم)"],
  "gold-24k": ["24K gold (per gram)", "طلای ۲۴ عیار (هر گرم)"],
  "gold-used": ["Used gold (per gram)", "طلای دست‌دوم (هر گرم)"],
  "coin-emami": ["Emami coin", "سکهٔ امامی"],
  "coin-bahar": ["Bahar Azadi", "سکهٔ بهار آزادی"],
  "coin-half": ["Half coin", "نیم‌سکه"],
  "coin-quarter": ["Quarter coin", "ربع‌سکه"],
  "coin-gram": ["Gram coin (gerami)", "سکهٔ گرمی"],
  "gold-mesghal": ["Mesghal (melted gold)", "مثقال (طلای آب‌شده)"],
};

/** One TGJU-style quote from the live-rates snapshot. */
export interface GoldQuote {
  id: string;
  unit: string; // "USD" | "TOMAN"
  price: number;
  dayHigh?: number | null;
  dayLow?: number | null;
  changePct?: number | null;
  marketAt?: string | null;
}

/** One instrument's computed parity + premium (both legs visible). */
export interface CoinPremiumRow {
  id: string;
  /** The market quote, toman. */
  marketToman: number;
  /** Intrinsic (melt) value, toman — tomanPerOunce × pureGrams ÷ TROY_OZ_GRAMS. */
  intrinsicToman: number;
  /** market − intrinsic, toman (positive = above melt). */
  premiumToman: number;
  /** premium ÷ intrinsic × 100, percent. */
  premiumPct: number;
}

/** The bridge computation over one coherent snapshot. */
export interface CoinPremium {
  ounceUsd: number | null;
  /** The free-market dollar, toman per USD. */
  dollarToman: number | null;
  /** The computed toman-per-ounce intermediate — named on the card. */
  tomanPerOunce: number | null;
  /** One row per COIN_SPECS entry whose quote is present, in table order. */
  rows: readonly CoinPremiumRow[];
}

/**
 * The حباب computation (verbatim):
 *
 *   toman_per_oz = XAUUSD(ounce) × dollar_toman
 *   intrinsic    = toman_per_oz × pure_oz_content     // per instrument
 *   premium      = market − intrinsic                 // toman
 *   premium_pct  = premium / intrinsic × 100          // %
 */
export function coinPremium(
  goldQuotes: readonly GoldQuote[],
  dollarToman: number | null,
): CoinPremium {
  const byId = new Map(goldQuotes.map((q) => [q.id, q]));
  const ounce = byId.get("gold-ounce");
  const ounceUsd =
    ounce !== undefined && ounce.unit === "USD" && Number.isFinite(ounce.price)
      ? ounce.price
      : null;
  const tomanPerOunce =
    ounceUsd !== null && dollarToman !== null && dollarToman > 0
      ? ounceUsd * dollarToman
      : null;

  const rows: CoinPremiumRow[] = [];
  if (tomanPerOunce !== null) {
    for (const spec of COIN_SPECS) {
      const quote = byId.get(spec.id);
      if (
        quote === undefined ||
        quote.unit !== "TOMAN" ||
        !Number.isFinite(quote.price)
      ) {
        continue;
      }
      const intrinsicToman = (tomanPerOunce * spec.pureGrams) / TROY_OZ_GRAMS;
      const premiumToman = quote.price - intrinsicToman;
      rows.push({
        id: spec.id,
        marketToman: quote.price,
        intrinsicToman,
        premiumToman,
        premiumPct: (premiumToman / intrinsicToman) * 100,
      });
    }
  }
  return { ounceUsd, dollarToman, tomanPerOunce, rows };
}

/** The free-market dollar, toman per USD (the rate's own inverse). */
export function dollarTomanOf(
  usdRate: number | undefined | null,
): number | null {
  return typeof usdRate === "number" && usdRate > 0 ? 1 / usdRate : null;
}
