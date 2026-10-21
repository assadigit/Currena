/**
 * markets-backfill-chg5y — the one-off companion of the 2026-10-27
 * "add five year" owner round. The nightly job attaches chg5y to every
 * FRESH row it builds, but a stored row is HELD verbatim when a same-date
 * re-fetch agrees (R5) — so rows written before this round keep landing
 * without the field until each market's NEXT close advances. This script
 * closes that gap now: for every stored row lacking chg5y it fetches the
 * long Yahoo series (range=10y), anchors the 1,826-day reference close
 * against the ROW'S OWN asOf with the job's exact attachChg5y helper, and
 * writes the snapshot back through the REST store — write-only-if-changed,
 * one KV write at most, the same honesty rules as every other runner.
 *
 * Idempotent: a second run finds every row carrying chg5y and writes
 * nothing. Safe to re-run after any partial provider outage.
 *
 * Environment:
 *   CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID,
 *   INSIGHTS_KV_NAMESPACE_ID (the RATES namespace)
 *
 * Manual:
 *   pnpm --filter @currena/insights markets-backfill-chg5y
 */

import { RestMarketsStore } from '../src/markets/store';
import { fetchYahooSeries } from '../src/markets/providers';
import { attachChg5y } from '../src/markets/compute';
import type { MarketEntry } from '@currena/core';

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const namespaceId = process.env.INSIGHTS_KV_NAMESPACE_ID;
if (!apiToken || !accountId || !namespaceId) {
  console.error('\n[backfill-chg5y] FATAL: needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and INSIGHTS_KV_NAMESPACE_ID.');
  process.exit(1);
}

const store = new RestMarketsStore({ apiToken, accountId, namespaceId });
const snapshot = await store.getMarkets();
if (snapshot === undefined) {
  console.error('[backfill-chg5y] no stored snapshot — nothing to backfill.');
  process.exit(1);
}

const lacking = snapshot.markets.filter((m) => m.chg5y === undefined);
console.log(`[backfill-chg5y] ${snapshot.markets.length} rows, ${lacking.length} lacking chg5y.`);
if (lacking.length === 0) {
  console.log('[backfill-chg5y] every row already carries the 5-year lens — no write.');
  process.exit(0);
}

const byId = new Map(snapshot.markets.map((m) => [m.id as string, m] as const));
let attached = 0;
const notes: string[] = [];
for (const row of lacking) {
  try {
    const long = await fetchYahooSeries(row.id);
    const enriched = attachChg5y(row as MarketEntry, long.points);
    if (enriched.chg5y !== undefined) {
      byId.set(row.id, enriched);
      attached += 1;
      console.log(`  ${row.id}: chg5y ${enriched.chg5y > 0 ? '+' : ''}${enriched.chg5y}`);
    } else {
      notes.push(`${row.id}: no honest 1,826-day anchor in the Yahoo 10y answer — field stays absent`);
    }
  } catch (err) {
    notes.push(`${row.id}: supplement failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
for (const n of notes) console.log(`  ⚠ ${n}`);

const next = { ...snapshot, markets: snapshot.markets.map((m) => byId.get(m.id) ?? m) };
const wrote = await store.putMarketsIfChanged(next, snapshot);
console.log(`[backfill-chg5y] attached ${attached}/${lacking.length} → ${wrote ? 'snapshot WRITTEN' : 'no write needed'}`);
