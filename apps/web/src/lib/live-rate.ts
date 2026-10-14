/**
 * LiveRateLine helpers (I11) — the always-on mid-market rate for the
 * converter's selected pair.
 *
 * Pure, platform-free math over an already-booted snapshot (the Converter
 * never refetches on pair changes — AGENTS.md rule: amount edits, swap and
 * currency changes are LOCAL math). Formatting happens at render via
 * `Intl` only; internal numbers stay canonical.
 */

import { convert, formatNumber, reverseRate } from '@currena/core';
import type { CurrencyCode, Snapshot, SnapshotSource } from '@currena/core';

/** View model for the converter's rate line. */
interface LiveRateView {
  /** 1 `from` = `rate` `to` (canonical, unformatted). */
  rate: number;
  /** 1 `to` = `inverse` `from`. */
  inverse: number;
  /** Snapshot generation the rate comes from (relative freshness). */
  fetchedAt: string;
  source: SnapshotSource;
}

/**
 * The pair's rate from a booted snapshot, or null when there is nothing
 * honest to show:
 *  - no snapshot yet (booting / offline without cache),
 *  - same-currency pair (rate is trivially 1 — the line is noise),
 *  - the pair is unresolvable from this snapshot (e.g. AED via
 *    Frankfurter) — the conversion itself would fail the same way.
 * A thrown CoreError (unknown pair) is contained here, not at the caller.
 */
export function liveRateView(
  snapshot: Snapshot | null | undefined,
  from: CurrencyCode,
  to: CurrencyCode,
): LiveRateView | null {
  if (!snapshot || from === to) return null;
  try {
    const r = convert(snapshot, from, to, 1);
    if (!Number.isFinite(r.rate) || r.rate <= 0) return null;
    return {
      rate: r.rate,
      inverse: reverseRate(r.rate),
      fetchedAt: snapshot.fetchedAt,
      source: snapshot.source,
    };
  } catch {
    return null; // pair unknown in this snapshot — nothing honest to show
  }
}

/** The last `max` observations, oldest → newest (sparkline window). */
export function sparklineWindow(series: readonly number[], max: number): number[] {
  if (max <= 0 || series.length === 0) return [];
  return series.slice(Math.max(0, series.length - max));
}

/** Rate decimals for display: IRR pairs are Toman integers, tiny rates get
 *  8 (legacy precision rule, same as ResultPopup's rateMaxFractionDigits). */
export function rateDecimals(rate: number, irrPair: boolean): number {
  if (rate < 1) return 8;
  return irrPair ? 0 : 4;
}

/**
 * Copy/share text for the rate line, e.g.
 * `1 US Dollar = 230,500 Iranian Toman · Currena — currena.ir`
 * (fa: «۱ دلار آمریکا = ۲۳۰٬۵۰۰ تومان ایرانی · کورنا — currena.ir»).
 * Labels and brand arrive pre-localized; the number formats per locale.
 */
export function rateShareText(
  view: LiveRateView,
  fromLabel: string,
  toLabel: string,
  brand: string,
  numberLocale: 'en-US' | 'fa-IR',
  irrPair: boolean,
): string {
  const one = formatNumber(1, numberLocale, { maximumFractionDigits: 0 });
  const rate = formatNumber(view.rate, numberLocale, {
    maximumFractionDigits: rateDecimals(view.rate, irrPair),
  });
  return `${one} ${fromLabel} = ${rate} ${toLabel} · ${brand} (currena.ir)`;
}
