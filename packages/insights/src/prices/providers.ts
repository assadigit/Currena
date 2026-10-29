/**
 * Live prices — the provider half. One Yahoo chart call per asset produces
 * the stored entry: the live quote, its daily-bar date, and the 7/30-day
 * percent changes computed from the SAME series the tile rows display (the
 * definition's changeKind — 'pct' for all four assets today).
 *
 * Fault isolation belongs to the job (job.ts); these functions throw loudly
 * and never return partial guesses (the adapters discipline, rule #3).
 */

import type { LivePriceEntry, PriceAssetId } from '@currena/core';
import { DEFINITIONS } from '../definitions';
import { addDays, daysBetween } from '../series';
import type { SeriesPoint } from '../series';
import { fetchYahooQuote, type YahooQuote, type YahooQuoteOptions } from '../adapters/yahoo';
import { fetchBrentFrontMonthQuote } from './brent-front-month';
import { LIVE_PRICE_ASSETS, LIVE_PRICE_YAHOO_RANGE } from './definitions';

/** Display-precision rounding — keeps KV content-equality stable (no float noise writes). */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * The change windows: the live value vs the daily close nearest to N days
 * back, accepted only when that close is REALLY near (≤ 3 calendar days —
 * weekends/holidays must not silently widen the window). Mirrors the SPA's
 * client-side derivation so the two agree to the cent.
 */
export const CHANGE_TOLERANCE_DAYS = 3;

/** Nearest series point to `lastDate − backDays`, within the tolerance. */
function pointDaysBack(points: readonly SeriesPoint[], lastDate: string, backDays: number): SeriesPoint | null {
  const target = addDays(lastDate, -backDays);
  let best: SeriesPoint | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const p of points) {
    const distance = Math.abs(daysBetween(target, p.date));
    if (distance < bestDistance) {
      best = p;
      bestDistance = distance;
    }
  }
  return best !== null && bestDistance <= CHANGE_TOLERANCE_DAYS ? best : null;
}

/** Percent change of `live` vs `then` — undefined when not honestly measurable. */
function pctChange(live: number, then: SeriesPoint | null): number | undefined {
  if (then === null || then.value <= 0) return undefined;
  return round2(((live - then.value) / then.value) * 100);
}

/**
 * Build the stored entry from a parsed Yahoo answer (pure — tests inject the
 * quote). `now` stamps updatedAt. The entry's sourceSymbol is the QUOTE'S
 * OWN symbol (2026-10-29: Brent quotes the first active specific month —
 * e.g. BZZ26.NYM — so the stored entry remembers which contract won and
 * the details panel can name it honestly).
 */
export function buildLivePriceEntry(
  assetId: PriceAssetId,
  quote: { livePrice: number; points: SeriesPoint[]; symbol?: string },
  now: Date,
): LivePriceEntry {
  const points = quote.points;
  const last = points[points.length - 1];
  if (last === undefined) {
    throw new Error(`[prices] ${assetId}: no daily closes in the quote`);
  }
  const def = DEFINITIONS.find((d) => d.id === assetId);
  if (def === undefined) throw new Error(`[prices] no definition for '${assetId}'`);
  if (def.changeKind !== 'pct') {
    throw new Error(`[prices] ${assetId}: changeKind '${def.changeKind}' has no live computation`);
  }
  const live = round2(quote.livePrice);
  if (!(live > 0)) throw new Error(`[prices] ${assetId}: non-positive live price`);
  return {
    value: live,
    asOf: last.date,
    change7d: pctChange(live, pointDaysBack(points, last.date, 7)),
    change30d: pctChange(live, pointDaysBack(points, last.date, 30)),
    // 2026-10-29: the quote's OWN symbol when it carries one (Brent names
    // the winning month contract); the definition's symbol otherwise.
    sourceSymbol: quote.symbol ?? LIVE_PRICE_ASSETS[assetId].yahooSymbol,
    updatedAt: now.toISOString(),
  };
}

/**
 * Fetch one asset's live entry from Yahoo (the production fetcher).
 *
 * 2026-10-29 (the wrong-contract fix): Brent does NOT quote the continuous
 * BZ=F — it quotes the FIRST ACTIVE specific month via
 * brent-front-month.ts (the continuous had silently rolled onto January
 * while December still traded: 110.51 vs the true 114.34, the owner's
 * "wrong oil price" report). `rememberedSymbol` (the stored entry's
 * sourceSymbol) re-probes the winner first — one call in the steady state.
 */
export async function fetchLivePriceEntry(
  assetId: PriceAssetId,
  opts: YahooQuoteOptions = {},
  now: Date = new Date(),
  rememberedSymbol?: string,
): Promise<LivePriceEntry> {
  const quote: YahooQuote =
    assetId === 'brent'
      ? await fetchBrentFrontMonthQuote(opts, now, rememberedSymbol)
      : await fetchYahooQuote(LIVE_PRICE_ASSETS[assetId].yahooSymbol, LIVE_PRICE_YAHOO_RANGE, opts);
  return buildLivePriceEntry(assetId, quote, now);
}
