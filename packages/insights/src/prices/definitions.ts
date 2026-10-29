/**
 * Live prices — the volatility-scaled refresh (2026-10-12).
 *
 * WHY THIS EXISTS: the Prices board's assets are the page's fastest-moving
 * numbers, but their daily backbone is end-of-day and single-sourced:
 *   - Brent's ONLY source was FRED's DCOILBRENTEU (EIA spot) — which stopped
 *     publishing on 2026-10-06 while the real market kept moving. The board
 *     showed $125.44 for four-plus business days while live Brent traded
 *     near $107 (a 15 % error nobody had flagged: brent's staleAfterDays
 *     grace is 12 days because EIA ships weekly batches).
 *   - gold/silver/Bitcoin ride GoldAPI (100 calls/month on the free key —
 *     exactly one call per daily ingestion), so their values age up to ~24 h
 *     between runs even when the API is healthy.
 *
 * THE FIX: hourly quotes from Yahoo Finance (keyless, already the backup
 * provider for the world-markets section) stored under ONE KV key and
 * merged into `GET /api/insights` at serve time. The daily ingestion keeps
 * its role as the EOD backbone (histories, percentiles, GoldAPI spots);
 * this refresh only makes the SERVED numbers current.
 *
 * UPDATE CADENCE — SCALED TO VOLATILITY (the owner's rule: "updates itself
 * based on the volatility of that market, e.g. oil at least once a day"):
 * the CONFIG block below gives EVERY ASSET its own refresh interval. The
 * cron rung fires hourly (currena-api's minute cron, :13); an asset whose
 * previous quote is younger than its interval is skipped, one whose fetch
 * fails keeps its last good quote (hold, never blank). Oil at 60 min is 24×
 * the owner's minimum bar; raising an interval is a one-number edit.
 */

import type { PriceAssetId } from '@currena/core';

/** The ONE KV key the whole live-prices snapshot is stored under. */
export const PRICES_KV_KEY = 'insights:prices-live:v1';

/** Yahoo range that safely covers the 30-day change window (~28 bars). */
export const LIVE_PRICE_YAHOO_RANGE = '40d';

/**
 * Owner-editable CONFIG (the §5.3 pattern): per-asset Yahoo symbol, refresh
 * interval in minutes, and the honest serve-time attribution.
 *
 *   brent     FIRST ACTIVE MONTH — the specific front-month contract
 *                     (BZ{month}{yy}.NYM, e.g. BZZ26.NYM), selected by
 *                     brent-front-month.ts (2026-10-29): the continuous
 *                     BZ=F had silently rolled onto January while December
 *                     still traded (110.51 vs the true 114.34 — the owner's
 *                     "wrong oil price" report). BZ=F stays the engine's
 *                     last-resort fallback; the FRED spot series stays the
 *                     EOD backbone and the ingestion gap-fill extends from
 *                     the SAME front-month symbol the live refresh quotes.
 *   gold-usd  GC=F    COMEX front-month gold (per troy ounce — same unit as
 *                     the GoldAPI XAU spot it refreshes; the futures basis
 *                     is typically < 1 %).
 *   silver-usd SI=F   COMEX front-month silver (per troy ounce, same as XAG).
 *   btc-usd   BTC-USD the USD spot index (trades 24/7 — the weekend quotes
 *                     simply repeat Friday's close and cost no KV write).
 */
export interface LivePriceAssetConfig {
  /** Yahoo chart symbol. */
  yahooSymbol: string;
  /** Minimum minutes between successful refreshes of this asset. */
  intervalMinutes: number;
  /** Serve-time attribution when the live value wins (merge.ts). */
  sourceName: string;
  sourceUrl: string;
}

export const LIVE_PRICE_ASSETS: Readonly<Record<PriceAssetId, LivePriceAssetConfig>> = {
  brent: {
    // 2026-10-29: NOT the continuous — the FIRST ACTIVE specific month
    // (brent-front-month.ts probes BZ{month}{yy}.NYM forward from today;
    // BZ=F is only the last-resort fallback). The stored entry's
    // sourceSymbol remembers the winner.
    yahooSymbol: 'BZ=F',
    intervalMinutes: 60,
    // Step-1 audit item A9: the attribution names the CONTRACT, not just the
    // venue — merge.ts substitutes the stored entry's sourceSymbol so the
    // details panel shows exactly which month contract the board carries
    // (e.g. "Brent front-month futures (BZZ26.NYM)").
    sourceName: 'Yahoo Finance: Brent front-month futures',
    sourceUrl: 'https://finance.yahoo.com/quote/BZ=F',
  },
  'gold-usd': {
    yahooSymbol: 'GC=F',
    intervalMinutes: 60,
    sourceName: 'Yahoo Finance: COMEX gold futures (GC=F)',
    sourceUrl: 'https://finance.yahoo.com/quote/GC=F',
  },
  'silver-usd': {
    yahooSymbol: 'SI=F',
    intervalMinutes: 60,
    sourceName: 'Yahoo Finance: COMEX silver futures (SI=F)',
    sourceUrl: 'https://finance.yahoo.com/quote/SI=F',
  },
  'btc-usd': {
    yahooSymbol: 'BTC-USD',
    intervalMinutes: 60,
    sourceName: 'Yahoo Finance: Bitcoin spot index (BTC-USD)',
    sourceUrl: 'https://finance.yahoo.com/quote/BTC-USD',
  },
};

/** The assets in board order (tiles render brent → gold → silver → bitcoin). */
export const PRICE_ASSET_IDS: readonly PriceAssetId[] = ['brent', 'gold-usd', 'silver-usd', 'btc-usd'];

/**
 * Cron-scheduling slack: an interval gate that compared exactly 60 min would
 * skip assets when the platform fires a minute-rung a few seconds early.
 */
export const INTERVAL_SLACK_MINUTES = 2;

/**
 * Companion ratios recomputed at serve time from the live bases (merge.ts):
 * the Bitcoin tile's context line (gold and silver per BTC), the gold
 * tile's A$ companion, and the gold/silver ratio — Step-1 audit item C3:
 * every derived number on the page comes from the SAME snapshot as the
 * prices shown beside it. copper-usd and copper-gold deliberately stay on
 * the daily cadence — Yahoo's HG quote is USD per pound while the stored
 * series is USD per tonne, and a unit-bridging live override is not worth
 * the risk on a context row.
 */
export const LIVE_RATIO_SOURCES: Readonly<Record<'gold-btc' | 'gold-aud' | 'gold-silver', PriceAssetId[]>> = {
  'gold-btc': ['gold-usd', 'btc-usd'],
  // gold-aud also needs the snapshot's audusd reading — merge.ts handles it.
  'gold-aud': ['gold-usd'],
  'gold-silver': ['gold-usd', 'silver-usd'],
};

/** Shared attribution for the recomputed companion ratios. */
export const LIVE_RATIO_SOURCE = {
  goldBtc: { name: 'Yahoo Finance (live ratio)', url: 'https://finance.yahoo.com' },
  goldAud: {
    name: 'Yahoo Finance (gold, live) × Frankfurter (AUD)',
    url: 'https://finance.yahoo.com',
  },
  goldSilver: { name: 'Yahoo Finance (live ratio)', url: 'https://finance.yahoo.com' },
} as const;
