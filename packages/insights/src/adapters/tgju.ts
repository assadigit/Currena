/**
 * TGJU adapter — the Insights gold-ounce numerator. Reuses the production
 * scraper module (parseTgjuGold) so the Insights runner and the live gold
 * board read the exact same 'ons' symbol and normalization. The ajax.json
 * cache-buster follows the scraper's measured Cloudflare-edge behaviour
 * (stale HITs past max-age — see packages/scraper/src/tgju.ts).
 */

import { fetchWithRetry, TGJU_AJAX_URL, parseTgjuGold } from '@currena/scraper';
import { AdapterError, type FetchDeps } from './types';

/** The gold board item id for the global market ounce (USD per troy ounce). */
const GOLD_OUNCE_ID = 'gold-ounce';

export interface TgjuGoldOunce {
  /** Gold price per troy ounce, USD. */
  price: number;
  /** Runner clock at fetch time (ISO 8601 UTC) — NOT a market timestamp. */
  fetchedAt: string;
}

/**
 * Fetch the TGJU gold ounce (USD). The 'ons' symbol missing from ajax.json,
 * or its price unparseable, is a loud adapter failure — the derived
 * gold-silver / gold-btc / gold-aud cards go unavailable, never wrong.
 */
export async function fetchTgjuGoldOunce(
  deps: FetchDeps = {},
  now: () => Date = () => new Date(),
): Promise<TgjuGoldOunce> {
  const at = now();
  const bustUrl = `${TGJU_AJAX_URL}?cb=${at.getTime()}`;
  const res = await fetchWithRetry(bustUrl, {}, deps);
  const json: unknown = await res.json();
  const quotes = parseTgjuGold(json);
  const ounce = quotes.find((q) => q.id === GOLD_OUNCE_ID && q.unit === 'USD');
  if (!ounce) {
    throw new AdapterError(
      'tgju',
      `gold ounce ('${GOLD_OUNCE_ID}', USD) missing from ajax.json — ${quotes.length} gold quotes parsed`,
    );
  }
  return { price: ounce.price, fetchedAt: at.toISOString() };
}
