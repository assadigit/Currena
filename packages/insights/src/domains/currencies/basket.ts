/**
 * The Currena dollar basket (2026-10-08 data spec §3 + dollar_basket.py) —
 * a DXY-style weighted geometric mean of six ECB reference currencies
 * against the US dollar, computed from the same Frankfurter timeseries the
 * FX indicators already use.
 *
 *  index = 50.14348112 × EUR^0.576 × JPY^0.136 × GBP^0.119 × CAD^0.091
 *                   × SEK^0.042 × CHF^0.036
 *
 * Values are close to the published DXY but NOT the official DXY — the page
 * always calls it "Currena dollar basket" (the script's own naming rule).
 * Weights and the scaling constant mirror the python script verbatim
 * (they must sum to 1 — asserted in basket.test.ts, exactly like the
 * script's selftest).
 */

/** DXY-recipe weights (sum = 1). Do not change unless the basket changes. */
export const BASKET_WEIGHTS: Readonly<Record<string, number>> = {
  EUR: 0.576,
  JPY: 0.136,
  GBP: 0.119,
  CAD: 0.091,
  SEK: 0.042,
  CHF: 0.036,
};

/** DXY scaling constant (index = 100 at its 1973 base). */
export const BASKET_SCALING_CONSTANT = 50.14348112;

/** Currencies the basket needs on the Frankfurter USD quote side. */
export const BASKET_CURRENCIES = Object.keys(BASKET_WEIGHTS) as readonly string[];

/**
 * One basket value from per-USD quotes (units of each currency per 1 USD —
 * exactly what Frankfurter returns with base=USD). Mirrors
 * dollar_basket.py's compute_basket, including the flat-rates identity:
 * every rate 1:1 → the scaling constant itself.
 */
export function computeBasketValue(ratesPerUsd: Readonly<Record<string, number>>): number {
  let value = BASKET_SCALING_CONSTANT;
  for (const [code, weight] of Object.entries(BASKET_WEIGHTS)) {
    const rate = ratesPerUsd[code];
    if (rate === undefined || !Number.isFinite(rate) || rate <= 0) {
      throw new Error(`basket: missing or invalid ${code} rate (${String(rate)})`);
    }
    value *= rate ** weight;
  }
  return value;
}
