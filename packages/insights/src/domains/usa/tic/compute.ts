/**
 * TIC derived numbers (gap-closure S2-M2.2) — PURE functions the UI (and
 * the tests) share: share of total, 1/6/12-month changes, the 12-month
 * transactions sum (the real buying/selling number), the 12-month price
 * effect, and rank changes. Nothing here is stored — the snapshot stays
 * the provider's data; these are always recomputed from it.
 */

import type { TicHolder, TicSnapshot } from '@currena/core';

/** The previous `YYYY-MM` (descending arithmetic). */
export function ticPreviousYm(ym: string): string {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  return m === 1 ? `${String(y - 1).padStart(4, '0')}-12` : `${String(y).padStart(4, '0')}-${String(m - 1).padStart(2, '0')}`;
}

/** Months-back arithmetic (n ≥ 1). */
export function ticMinusMonths(ym: string, n: number): string {
  let out = ym;
  for (let i = 0; i < n; i += 1) out = ticPreviousYm(out);
  return out;
}

/** One holder's derived row. `null` = not computable (too little history). */
export interface TicHolderDerived {
  /** Holdings share of the foreign total, percent. */
  sharePct: number;
  /** 1-month holdings change, bn (null when no prior month). */
  chg1mBn: number | null;
  chg1mPct: number | null;
  /** 6-month holdings change, bn (the headline's window). */
  chg6mBn: number | null;
  /** 12-month holdings change, bn + percent. */
  chg12mBn: number | null;
  chg12mPct: number | null;
  /** Sum of net U.S. sales over the last 12 months, bn — POSITIVE =
   *  net buying (transactions, never holdings changes). null when no
   *  transactions months exist in the window. */
  net12mBn: number | null;
  /** How many of the last 12 months carried transactions data. */
  netMonths: number;
  /** Sum of valuation changes over the last 12 months, bn (the price effect). */
  val12mBn: number | null;
}

/** The 12-month window's month keys (ascending), ending at dataMonth. */
function lastNMonths(dataMonth: string, n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) out.push(ticMinusMonths(dataMonth, i));
  return out;
}

function pct(delta: number, base: number): number | null {
  if (base <= 0) return null;
  return Math.round((delta / base) * 1000) / 10;
}

/** Derive one holder's row from the snapshot. */
export function ticHolderDerived(holder: TicHolder, snapshot: TicSnapshot): TicHolderDerived {
  const months = holder.months;
  const latest = months.at(-1)!;
  const at = (nBack: number): number | null => {
    const ym = ticMinusMonths(snapshot.dataMonth, nBack);
    return months.find((m) => m.ym === ym)?.v ?? null;
  };
  const prev = at(1);
  const m6 = at(6);
  const m12 = at(12);

  const window = new Set(lastNMonths(snapshot.dataMonth, 12));
  let net12mBn: number | null = null;
  let netMonths = 0;
  for (const m of holder.netSalesBn ?? []) {
    if (window.has(m.ym)) {
      net12mBn = (net12mBn ?? 0) + m.v;
      netMonths += 1;
    }
  }
  let val12mBn: number | null = null;
  for (const m of holder.valuationChangeBn ?? []) {
    if (window.has(m.ym)) val12mBn = (val12mBn ?? 0) + m.v;
  }

  return {
    sharePct: snapshot.totalBn > 0 ? Math.round((holder.holdingsBn / snapshot.totalBn) * 1000) / 10 : 0,
    chg1mBn: prev === null ? null : Math.round((latest.v - prev) * 1000) / 1000,
    chg1mPct: prev === null || prev <= 0 ? null : pct(latest.v - prev, prev),
    chg6mBn: m6 === null ? null : Math.round((latest.v - m6) * 1000) / 1000,
    chg12mBn: m12 === null ? null : Math.round((latest.v - m12) * 1000) / 1000,
    chg12mPct: m12 === null || m12 <= 0 ? null : pct(latest.v - m12, m12),
    net12mBn: net12mBn === null ? null : Math.round(net12mBn * 1000) / 1000,
    netMonths,
    val12mBn: val12mBn === null ? null : Math.round(val12mBn * 1000) / 1000,
  };
}

/** Rank by latest holdings (1 = largest) vs rank 12 months earlier. */
export interface TicRankInfo {
  rank: number;
  rank12mAgo: number | null;
  rankChange: number | null;
}

export function ticRanks(holders: readonly TicHolder[], dataMonth: string): Map<string, TicRankInfo> {
  const byLatest = [...holders].sort((a, b) => b.holdingsBn - a.holdingsBn);
  const ym12 = ticMinusMonths(dataMonth, 12);
  const by12mAgo = [...holders]
    .map((h) => ({ id: h.id, v: h.months.find((m) => m.ym === ym12)?.v ?? null }))
    .filter((x): x is { id: string; v: number } => x.v !== null)
    .sort((a, b) => b.v - a.v);
  const rank12 = new Map(by12mAgo.map((x, i) => [x.id, i + 1]));
  const out = new Map<string, TicRankInfo>();
  byLatest.forEach((h, i) => {
    const rank = i + 1;
    const before = rank12.get(h.id) ?? null;
    out.set(h.id, {
      rank,
      rank12mAgo: before,
      rankChange: before === null ? null : before - rank,
    });
  });
  return out;
}

/** The chips: the n largest net buyers and net sellers over 12 months
 *  (TRANSACTIONS — the net12m number, never holdings changes). */
export interface TicMover {
  id: string;
  name: string;
  net12mBn: number;
}

export function ticTopMovers(snapshot: TicSnapshot, n = 3): { buyers: TicMover[]; sellers: TicMover[] } {
  const withNet = snapshot.holders
    .map((h) => ({ id: h.id, name: h.name, net12mBn: ticHolderDerived(h, snapshot).net12mBn }))
    .filter((x): x is TicMover => x.net12mBn !== null);
  const buyers = withNet
    .filter((x) => x.net12mBn > 0)
    .sort((a, b) => b.net12mBn - a.net12mBn)
    .slice(0, n);
  const sellers = withNet
    .filter((x) => x.net12mBn < 0)
    .sort((a, b) => a.net12mBn - b.net12mBn)
    .slice(0, n);
  return { buyers, sellers };
}

/** Is the snapshot's data too old to present as current? (The section's
 *  stale gate — the spec's 70-day rule; the TIC publishes ~6–7 weeks
 *  after the reference month.) */
export const TIC_STALE_AFTER_DAYS = 70;

/** Days since the data month ENDED (a 2026-08 data month goes stale 70
 *  days after 2026-08-31). */
export function ticAgeDays(snapshot: TicSnapshot, now: Date): number {
  const y = Number(snapshot.dataMonth.slice(0, 4));
  const m = Number(snapshot.dataMonth.slice(5, 7));
  // Month end: day 0 of the next month.
  const monthEnd = Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 0);
  return Math.floor((now.getTime() - monthEnd) / 86_400_000);
}

export function ticIsStale(snapshot: TicSnapshot, now: Date): boolean {
  return ticAgeDays(snapshot, now) > TIC_STALE_AFTER_DAYS;
}
