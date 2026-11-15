/**
 * gold-api.com adapter — silver (XAG) and Bitcoin (BTC) spot prices
 * (Gate I0 D3: primary source; terms explicitly permit commercial display).
 * Keyless; one request per symbol.
 */

import { z } from 'zod';
import { insightsFetch } from './fetch-policy';
import { AdapterError, type FetchDeps, type SpotPrice } from './types';

export const GOLDAPI_BASE = 'https://api.gold-api.com/price';

/** Response contract (probe 2026-10-06; zod-validated — loud on change). */
const GoldApiPriceSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  price: z.number().finite().positive(),
  currency: z.literal('USD'),
  updatedAt: z.iso.datetime(),
});

/** Symbols the Insights indicators consume (I15: + HG copper per pound; M6
 * Wave 3 2026-10-25: + XPT platinum — the daily cadence fix, verified live
 * $1,558 the same day). */
export const GOLDAPI_SYMBOLS = {
  silver: 'XAG',
  bitcoin: 'BTC',
  gold: 'XAU',
  copper: 'HG',
  platinum: 'XPT',
} as const;

export function goldApiPriceUrl(symbol: string): string {
  return `${GOLDAPI_BASE}/${encodeURIComponent(symbol)}`;
}

/** Fetch one spot price. Throws loudly on non-2xx or contract change. */
export async function fetchGoldApiSpot(symbol: string, deps: FetchDeps = {}): Promise<SpotPrice> {
  const res = await insightsFetch(goldApiPriceUrl(symbol), {}, deps);
  const json: unknown = await res.json();
  const parsed = GoldApiPriceSchema.safeParse(json);
  if (!parsed.success) {
    throw new AdapterError(
      'gold-api',
      `price response for ${symbol} failed schema validation: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  if (parsed.data.symbol !== symbol) {
    throw new AdapterError('gold-api', `asked for ${symbol}, response says ${parsed.data.symbol}`);
  }
  return { symbol: parsed.data.symbol, price: parsed.data.price, updatedAt: parsed.data.updatedAt };
}
