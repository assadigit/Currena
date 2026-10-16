/**
 * us-shares-aud.ts — Step 3 L2-03 (runbook Phase 4, 2026-10-16): US shares
 * in Australian dollars. Plain arithmetic over the two feeds the page
 * already holds — the world-markets snapshot (S&P 500 / Nasdaq 100 close +
 * 1-month change) and the world-currencies snapshot (AUD/USD rate + its
 * 1-month change). Pure and platform-free.
 *
 * T-21/T-20 discipline: the AUD-converted level equals the USD level times
 * AUD/USD ON THE SAME DATE — when the two feeds' asOf dates differ the AUD
 * view is refused ('dates-differ'), never computed over mismatched dates.
 */

import type { FxSnapshot, MarketEntry, MarketsSnapshot } from '@currena/core';

export interface UsSharesAudRow {
  id: 'sp500' | 'ndx';
  nameKey: 'sp500' | 'ndx';
  closeUsd: number;
  closeAud: number;
  chg1mUsd: number | null;
  /** (1 + USD move) × (1 + AUD/USD move) − 1 — the compound AUD return. */
  chg1mAud: number | null;
  /** The AUD/USD 1-month move (the exchange-rate effect). */
  fxEffect: number | null;
}

export type UsSharesAudView =
  | { kind: 'ready'; asOf: string; rows: readonly UsSharesAudRow[] }
  | { kind: 'dates-differ'; marketAsOf: string; fxAsOf: string }
  | { kind: 'unavailable' };

/** The two markets the L2-03 definition covers. */
const US_IDS = ['sp500', 'ndx'] as const;

function audEntryOf(fx: FxSnapshot): { rate: number; chg1m: number | null; asOf: string } | undefined {
  // The AUD/USD pair (fx id 'audusd'): "quote units per 1 base" means the
  // rate IS USD per AUD — the AUD view multiplies the USD level by it.
  const pair = fx.pairs.find((p) => p.id === 'audusd');
  if (pair === undefined || !Number.isFinite(pair.rate) || pair.rate <= 0) return undefined;
  return {
    rate: pair.rate,
    chg1m: typeof pair.chg?.m1 === 'number' && Number.isFinite(pair.chg.m1) ? pair.chg.m1 : null,
    asOf: pair.asOf,
  };
}

export function usSharesInAud(
  markets: MarketsSnapshot | null | undefined,
  fx: FxSnapshot | null | undefined,
): UsSharesAudView {
  if (markets === null || markets === undefined || fx === null || fx === undefined) return { kind: 'unavailable' };
  const aud = audEntryOf(fx);
  if (aud === undefined) return { kind: 'unavailable' };

  const rows: UsSharesAudRow[] = [];
  let marketAsOf: string | undefined;
  for (const id of US_IDS) {
    const m: MarketEntry | undefined = markets.markets.find((x) => x.id === id);
    if (m === undefined || !Number.isFinite(m.close) || m.close <= 0) continue;
    marketAsOf ??= m.asOf;
    if (m.asOf !== marketAsOf) continue; // the two US rows must share a date
    const chg1mUsd = typeof m.chg1m === 'number' && Number.isFinite(m.chg1m) ? m.chg1m : null;
    const compound =
      chg1mUsd !== null && aud.chg1m !== null ? (1 + chg1mUsd / 100) * (1 + aud.chg1m / 100) * 100 - 100 : null;
    rows.push({
      id,
      nameKey: id,
      closeUsd: m.close,
      closeAud: m.close * aud.rate,
      chg1mUsd,
      chg1mAud: compound,
      fxEffect: aud.chg1m,
    });
  }
  if (rows.length === 0) return { kind: 'unavailable' };

  // T-20/T-21: both legs must be same-date. (The market close and the FX
  // fixing are both daily UTC-dated values; a mismatch means one feed lags.)
  if (marketAsOf !== aud.asOf) {
    return { kind: 'dates-differ', marketAsOf: marketAsOf ?? '', fxAsOf: aud.asOf };
  }
  return { kind: 'ready', asOf: marketAsOf ?? '', rows };
}
