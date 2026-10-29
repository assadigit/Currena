/**
 * Live prices — the serve-time merge (pure, no fetch, no KV).
 *
 * `GET /api/insights` reads the daily ingestion's snapshot and overlays the
 * live quotes on top BEFORE serving, so the Prices board's tiles carry the
 * market's current numbers instead of the backbone's last EOD print. The
 * stored snapshot is never touched — the daily run recomputes everything
 * from the official EOD sources on its own schedule.
 *
 * OVERRIDDEN READINGS (exactly the numbers the board renders):
 *   brent, gold-usd, silver-usd, btc-usd — the four tiles:
 *     value, asOf, change7d/change30d (from the live series), live source
 *     attribution, updatedAt = the live run's generatedAt;
 *     status healed when the live quote is fresher: 'stale'/'unavailable'
 *     become the row's natural non-voting status ('context' for info-rule
 *     rows, 'normal' for voting rows) — the stale-$125-oil symptom never
 *     renders as fresh-looking data again.
 *   gold-btc, silver-btc, gold-aud, gold-silver — the tiles' companion
 *     context lines, recomputed from the live bases (gold-aud keeps the
 *     snapshot's daily ECB audusd — FX reference rates are daily by
 *     definition). Step-1 audit item C3: the gold/silver ratio now joins
 *     them, so the ratio always matches the two prices shown beside it.
 *
 * NEVER touched: the summary/verdict (EOD analytics, recomputed only by the
 * daily run), percentile10y (a 10-year statistic on the EOD series — a
 * day's drift is noise), every other reading, changedThisWeek, calendar.
 *
 * Guard rails: a live quote NEVER rewinds the reading (applies only when
 * its asOf is ≥ the reading's own asOf); a companion recomputes only when
 * EVERY constituent is available; a missing/short-window change keeps the
 * reading's existing one (never removes information).
 */

import type { IndicatorId, IndicatorReading, InsightsSnapshot, LivePricesSnapshot, PriceAssetId } from '@currena/core';
import { DEFINITIONS } from '../definitions';
import { LIVE_PRICE_ASSETS, LIVE_RATIO_SOURCE } from './definitions';

/** The reading's natural non-voting status once fresh data exists. */
function naturalStatus(id: IndicatorId): 'context' | 'normal' {
  const def = DEFINITIONS.find((d) => d.id === id);
  return def !== undefined && def.rule.kind === 'info' ? 'context' : 'normal';
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

/**
 * Fix spec B-16 (2026-10-14): the silver-per-bitcoin display inverts this
 * ratio (₿ per oz), so 4 decimals left "1,429 oz" where the displayed prices
 * gave 1,425 — the stored ratio now keeps 6 significant decimals, enough for
 * the inverted line to match the prices shown on the same snapshot.
 */
function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

/** ISO date compare — `null` reading dates (unavailable) always lose to a live date. */
function asOfAtLeast(liveAsOf: string, readingAsOf: string | null): boolean {
  return readingAsOf === null || liveAsOf >= readingAsOf;
}

/** The later of two ISO dates (for companion asOf stamps). */
function laterDate(a: string, b: string): string {
  return a >= b ? a : b;
}

interface ReadingPatch {
  value: number;
  asOf: string;
  change7d?: number;
  change30d?: number;
  sourceName: string;
  sourceUrl: string;
  updatedAt: string;
}

/** Apply a patch to a reading copy, healing stale/unavailable statuses. */
function patchReading(reading: IndicatorReading, patch: ReadingPatch): IndicatorReading {
  return {
    ...reading,
    value: patch.value,
    asOf: patch.asOf,
    ...(patch.change7d !== undefined ? { change7d: patch.change7d } : {}),
    ...(patch.change30d !== undefined ? { change30d: patch.change30d } : {}),
    sourceName: patch.sourceName,
    sourceUrl: patch.sourceUrl,
    updatedAt: patch.updatedAt,
    status: reading.status === 'stale' || reading.status === 'unavailable' ? naturalStatus(reading.id) : reading.status,
  };
}

/** Keep the existing change fields when the live entry lacks its own (never removes information). */
function mergedChanges(reading: IndicatorReading, live: { change7d?: number; change30d?: number }): { change7d?: number; change30d?: number } {
  const out: { change7d?: number; change30d?: number } = {};
  const c7 = live.change7d ?? reading.change7d;
  const c30 = live.change30d ?? reading.change30d;
  if (c7 !== undefined) out.change7d = c7;
  if (c30 !== undefined) out.change30d = c30;
  return out;
}

/**
 * Overlay the live quotes onto the snapshot. Returns a NEW snapshot object
 * (the input is never mutated); when the live snapshot carries no assets
 * the input comes back unchanged (identity).
 */
export function mergeLivePricesIntoSnapshot(
  snapshot: InsightsSnapshot,
  live: LivePricesSnapshot | undefined,
): InsightsSnapshot {
  if (live === undefined || Object.keys(live.assets).length === 0) return snapshot;
  const byId = new Map(snapshot.readings.map((r) => [r.id as string, r]));
  const out = new Map(snapshot.readings.map((r) => [r.id as string, r]));
  const generatedAt = live.generatedAt;

  // 1. The four tiles.
  for (const assetId of Object.keys(live.assets) as PriceAssetId[]) {
    const entry = live.assets[assetId];
    const reading = byId.get(assetId);
    if (entry === undefined || reading === undefined) continue; // no quote / no such row — never invent rows
    if (!asOfAtLeast(entry.asOf, reading.asOf)) continue; // never rewind a fresher EOD print
    const patched = patchReading(reading, {
      value: entry.value,
      asOf: entry.asOf,
      ...mergedChanges(reading, entry),
      // 2026-10-29 (the Brent wrong-contract fix): Brent's attribution
      // names the WINNING month contract from the stored entry's
      // sourceSymbol (e.g. "…futures (BZZ26.NYM)") — the details panel
      // shows exactly which price the board carries. The other assets
      // keep their config's fixed attribution.
      sourceName:
        assetId === 'brent'
          ? `${LIVE_PRICE_ASSETS[assetId].sourceName} (${entry.sourceSymbol})`
          : LIVE_PRICE_ASSETS[assetId].sourceName,
      sourceUrl: LIVE_PRICE_ASSETS[assetId].sourceUrl,
      updatedAt: generatedAt,
    });
    // Fix spec B-01 (2026-10-14): the record distance follows the live value —
    // the peak (with its date and basis) stays, the distance is recomputed so
    // the card's number and its record line can never disagree.
    if (patched.peak !== undefined && patched.peak.value > 0) {
      patched.fromPeak10y = ((patched.value ?? patched.peak.value) - patched.peak.value) / patched.peak.value * 100;
    }
    out.set(assetId, patched);
  }

  const liveGold = live.assets['gold-usd'];
  const liveSilver = live.assets['silver-usd'];
  const liveBtc = live.assets['btc-usd'];

  // 2. The Bitcoin tile's context ratios — only when BOTH bases are live.
  if (liveGold !== undefined && liveBtc !== undefined) {
    const reading = byId.get('gold-btc');
    if (reading !== undefined) {
      out.set('gold-btc', patchReading(reading, {
        value: round6(liveGold.value / liveBtc.value),
        asOf: laterDate(liveGold.asOf, liveBtc.asOf),
        sourceName: LIVE_RATIO_SOURCE.goldBtc.name,
        sourceUrl: LIVE_RATIO_SOURCE.goldBtc.url,
        updatedAt: generatedAt,
      }));
    }
  }
  // silver-btc's live merge retired with the card (2026-10-23, OD-7, D-42);
  // liveSilver still feeds the gold-silver ratio below.

  // 3. The gold tile's A$ companion — live gold over the snapshot's daily
  //    ECB audusd (gold-aud = gold-usd ÷ audusd; derived.ts uses the
  //    USD→AUD quote, its inverse is the audusd reading).
  if (liveGold !== undefined) {
    const goldAud = byId.get('gold-aud');
    const audusd = byId.get('audusd');
    if (goldAud !== undefined && audusd !== undefined && audusd.value !== null && audusd.value > 0) {
      out.set('gold-aud', patchReading(goldAud, {
        value: round4(liveGold.value / audusd.value),
        asOf: liveGold.asOf,
        sourceName: LIVE_RATIO_SOURCE.goldAud.name,
        sourceUrl: LIVE_RATIO_SOURCE.goldAud.url,
        updatedAt: generatedAt,
      }));
    }
  }

  // 4. The gold/silver ratio — Step-1 audit item C3: recomputed from the
  //    SAME live bases the two tiles show, so the ratio can never disagree
  //    with the prices beside it (the old snapshot-only ratio was one
  //    generation behind the live tiles). Only when BOTH metals are live;
  //    changes ride the gold tile's live change fields (the ratio's own
  //    change windows come from the EOD history and stay untouched).
  if (liveGold !== undefined && liveSilver !== undefined && liveSilver.value > 0) {
    const goldSilver = byId.get('gold-silver');
    if (goldSilver !== undefined) {
      out.set('gold-silver', patchReading(goldSilver, {
        value: Math.round((liveGold.value / liveSilver.value) * 10) / 10,
        asOf: laterDate(liveGold.asOf, liveSilver.asOf),
        sourceName: LIVE_RATIO_SOURCE.goldSilver.name,
        sourceUrl: LIVE_RATIO_SOURCE.goldSilver.url,
        updatedAt: generatedAt,
      }));
    }
  }

  // Step-1 audit item G7: expose the live run's clock so the page can say
  // "prices updated {time}" — the snapshot's generatedAt stays the analytics'
  // date (EOD backbone), pricesAsOf names the hourly quotes' generation.
  return {
    ...snapshot,
    pricesAsOf: generatedAt,
    readings: snapshot.readings.map((r) => out.get(r.id as string) ?? r),
  };
}
