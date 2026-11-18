/**
 * coin-premium.ts — GPE R13 / F3a (2026-11-18): the Iran bridge's pure
 * premium engine — Bridge-1, the حباب (coin premium over melt)
 * computation (docs/specs/gold-page-elevation: s1/11 §5 the formulas ·
 * s4/04 §2b the CBI mint specs · s6/02 C2 the four-part grammar · s7/01
 * §8 the chain map · s8/01 R13).
 *
 * THE MOAT (S4-D3a, S5/01 T2): incumbents DO publish a حباب number —
 * TGJU's live symbols and the news chains — but nobody publishes it
 * DOCUMENTED and REPRODUCIBLE. This engine computes the premium from
 * ONE coherent TGJU snapshot (the ounce leg + the free-market dollar
 * leg + the instrument quote — no cross-source timestamp skew, s1/11
 * §5) over a constants table whose every entry is sourced and dated.
 * The four-part grammar (C2) renders it: formula stated, decomposition
 * shown, as-of stamped, divergence taught — drop any part and the moat
 * collapses into another undocumented number.
 *
 * THE CONSTANTS (CBI-primary, s4/04 §2b): the Bahar family is
 * 8.136 g total × 0.900 fineness (CBI's own commemorative-coins page,
 * cbi.ir/page/5953.aspx, read 2026-11-17) — the widely-published
 * 8.133 g variant is 0.04% apart and is documented beside. The gerami
 * is the 1/8-Bahar size: ~1.01 g total, 900 fineness, ~0.909 g pure —
 * the exact minted figure is WAF-blocked from this environment
 * (s8/02 §2b, re-attempted 2026-11-18: «درخواست رد شد»), so the
 * RECORDED BAND 0.90–0.92 g pure stands, midpoint 0.91, both candidate
 * readings inside it; a further pin rides Bridge-2 (R30). The mesghal
 * follows the bazaar's آبشده (melted gold) convention: 4.6083 g ×
 * ≈0.705 fineness = 3.249 g pure — the convention that reconciles
 * TGJU's mesghal quote with the melt (verified live 2026-11-18: mesghal
 * ÷ geram24 = 3.248 g-equivalent).
 *
 * Platform-free (AGENTS.md rule 2): pure over the snapshot's own gold
 * quotes + the free-dollar rate; zero fetches, zero KV, zero clock.
 */

import type { GoldQuote } from '@currena/core';

/** The troy ounce in grams (the repo's existing conversion constant basis). */
export const TROY_OZ_GRAMS = 31.1034768;

/** The bridge board's instrument ids (the snapshot plane's own GoldIds). */
export type BridgeCoinId =
  | 'coin-emami'
  | 'coin-bahar'
  | 'coin-half'
  | 'coin-quarter'
  | 'coin-gram'
  | 'gold-18k'
  | 'gold-24k'
  | 'gold-mesghal';

/** One instrument's mint-spec constants (the method block renders them). */
export interface CoinSpec {
  id: BridgeCoinId;
  /** Total weight of one unit, grams (per-gram quotes: 1). */
  totalGrams: number;
  /** Pure-gold fraction (fineness). */
  fineness: number;
  /** Pure gold per unit, grams = totalGrams × fineness. */
  pureGrams: number;
  /** The gerami band (s8/02 §2b): the pin is pending; the band renders. */
  band?: { low: number; high: number };
}

/**
 * The constants table, CBI-primary. Fixed display order = the board's
 * row order (the coin family, then the per-gram melt rows — s6/01 §2a:
 * the ounce row does NOT join the board; it stays implied in the parity
 * line, computed here as tomanPerOunce).
 */
export const COIN_SPECS: readonly CoinSpec[] = [
  { id: 'coin-emami', totalGrams: 8.136, fineness: 0.9, pureGrams: 7.3224 },
  { id: 'coin-bahar', totalGrams: 8.136, fineness: 0.9, pureGrams: 7.3224 },
  { id: 'coin-half', totalGrams: 8.136 / 2, fineness: 0.9, pureGrams: 3.6612 },
  { id: 'coin-quarter', totalGrams: 8.136 / 4, fineness: 0.9, pureGrams: 1.8306 },
  // The gerami: the 1/8-Bahar size, ~1.01 g total × 0.900 — the band's
  // midpoint (0.91 g pure) computes; the band itself renders on the
  // method block (a ±0.5% intrinsic ambiguity, disclosed).
  { id: 'coin-gram', totalGrams: 1.0111, fineness: 0.9, pureGrams: 0.91, band: { low: 0.9, high: 0.92 } },
  { id: 'gold-18k', totalGrams: 1, fineness: 0.75, pureGrams: 0.75 },
  { id: 'gold-24k', totalGrams: 1, fineness: 0.9999, pureGrams: 0.9999 },
  // The mesghal آبشده convention: the bazaar's melt-gold weight unit.
  { id: 'gold-mesghal', totalGrams: 4.6083, fineness: 0.705, pureGrams: 3.2488515 },
];

/** The gerami band of record (s8/02 §2b) — exported for the method block. */
export const GERAMI_BAND = { low: 0.9, high: 0.92 } as const;

/** One instrument's computed parity + premium (C2 rule 2: both legs visible). */
export interface CoinPremiumRow {
  id: BridgeCoinId;
  /** The market quote, toman (the snapshot's own TOMAN-normalized value). */
  marketToman: number;
  /** Intrinsic (melt) value, toman — tomanPerOunce × pureGrams ÷ TROY_OZ_GRAMS. */
  intrinsicToman: number;
  /** market − intrinsic, toman (positive = above melt). */
  premiumToman: number;
  /** premium ÷ intrinsic × 100, percent. */
  premiumPct: number;
}

/** The bridge computation over one coherent TGJU snapshot. */
export interface CoinPremium {
  /** The global ounce quote, USD (the first leg). */
  ounceUsd: number | null;
  /** The free-market dollar, toman per USD (the second leg). */
  dollarToman: number | null;
  /** The COMPUTED toman-per-ounce intermediate — named on the card (C1/C2):
   *  ounceUsd × dollarToman. Null when either leg is missing (fail-closed:
   *  no parity, no premium — the board still shows the quotes). */
  tomanPerOunce: number | null;
  /** One row per COIN_SPECS entry whose quote is present, in table order. */
  rows: readonly CoinPremiumRow[];
}

/**
 * The حباب computation (s1/11 §5, verbatim):
 *
 *   toman_per_oz = XAUUSD(ons) × price_dollar_rl        // USD → toman
 *   intrinsic    = toman_per_oz × pure_oz_content        // per instrument
 *   premium      = market − intrinsic                    // toman
 *   premium_pct  = premium / intrinsic × 100             // %
 *
 * Pure + fail-closed: a missing ounce or dollar leg yields a null
 * tomanPerOunce and NO rows (no premium is ever guessed); a missing
 * instrument quote omits that row (the board shows its price dashes
 * from the quote plane, never a computed value).
 */
export function coinPremium(
  goldQuotes: readonly GoldQuote[],
  dollarToman: number | null,
): CoinPremium {
  const byId = new Map(goldQuotes.map((q) => [q.id as string, q]));
  const ounce = byId.get('gold-ounce');
  const ounceUsd = ounce !== undefined && ounce.unit === 'USD' && Number.isFinite(ounce.price) ? ounce.price : null;
  const tomanPerOunce =
    ounceUsd !== null && dollarToman !== null && dollarToman > 0 ? ounceUsd * dollarToman : null;

  const rows: CoinPremiumRow[] = [];
  if (tomanPerOunce !== null) {
    for (const spec of COIN_SPECS) {
      const quote = byId.get(spec.id);
      if (quote === undefined || quote.unit !== 'TOMAN' || !Number.isFinite(quote.price)) continue;
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
