/**
 * market-state.ts — GPE R16 / F16b (2026-11-18): the market open/closed
 * pill's pure engine — Zone B's status affordance (docs/specs/
 * gold-page-elevation: s6/01 zone B · s8/01 R16).
 *
 * THE DESIGN (the row's own words): "derived from the existing
 * live-prices feed state + a static schedule — NO new fetch". The feed
 * state names the reference market — the page's live gold price reads
 * COMEX gold futures (GC=F, the gold-usd reading's own source line) —
 * and THIS module carries that market's static weekly schedule. A
 * session-clock feed would be a new data family for a status
 * affordance; rejected (the row's recorded reasoning).
 *
 * THE SCHEDULE (CME Globex, the GC gold futures contract's regular
 * trading hours): Sunday 18:00 → Friday 17:00 New York time, with a
 * daily 60-minute maintenance break 17:00–18:00 New York. New York
 * observes US DST (second Sunday of March → first Sunday of November,
 * the 02:00 local transition), so the UTC offset is −5 standard / −4
 * daylight — computed from the clock, deterministic, zero fetches.
 *
 * The GPE-S3-10 lesson (binding): the reference market AND its
 * timezone are named AT POINT OF USE — the pill's label renders
 * "COMEX gold futures, New York (UTC−5)" / the fa equivalent.
 *
 * Platform-free: pure over an injected clock (tests pin both DST
 * regimes and the weekly boundaries).
 */

export interface MarketState {
  /** True inside the regular trading hours (the maintenance break counts
   *  as closed — no trades clear through it). */
  open: boolean;
  /** The named reference market (renders at point of use). */
  market: 'COMEX gold futures';
  /** The venue city (renders at point of use). */
  venue: 'New York';
  /** The current UTC offset label, e.g. 'UTC−5' (named at point of use). */
  tzLabel: string;
}

/** The Nth Sunday of a UTC month, at the given UTC hour. */
function nthSundayUtc(year: number, month: number, nth: number, hourUtc: number): Date {
  // month is 1-based (3 = March, 11 = November).
  const first = new Date(Date.UTC(year, month - 1, 1, hourUtc, 0, 0));
  const firstDow = first.getUTCDay(); // 0 = Sunday
  const firstSundayDate = 1 + ((7 - firstDow) % 7);
  return new Date(Date.UTC(year, month - 1, firstSundayDate + (nth - 1) * 7, hourUtc, 0, 0));
}

/** New York's UTC offset at the given instant (−4 inside US DST, −5 out). */
export function newYorkOffsetHours(now: Date): number {
  const year = now.getUTCFullYear();
  // The 02:00 local transitions: 07:00 UTC in March (EST, −5), 06:00 UTC
  // in November (EDT, −4) — the offset flips exactly at these instants.
  const dstStart = nthSundayUtc(year, 3, 2, 7);
  const dstEnd = nthSundayUtc(year, 11, 1, 6);
  return now >= dstStart && now < dstEnd ? -4 : -5;
}

/** Minutes since Sunday 00:00 in the given UTC offset (New York local =
 *  UTC + offset, so the shift ADDS the negative offset hours). */
function minutesIntoNyWeek(now: Date, offsetHours: number): number {
  const shifted = new Date(now.getTime() + offsetHours * 3_600_000);
  const dow = shifted.getUTCDay(); // 0 = Sunday
  return dow * 1440 + shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

/**
 * The COMEX gold-futures market state at the given instant. Pure.
 *
 * Open: Sunday 18:00 → Friday 17:00 New York, MINUS the daily
 * 17:00–18:00 break. Closed: Saturday, the Friday close onward, the
 * Sunday pre-open, and every day's break hour.
 */
export function comexMarketState(now: Date): MarketState {
  const offset = newYorkOffsetHours(now);
  const m = minutesIntoNyWeek(now, offset);
  // Sunday before 18:00 (pre-open) and all of Saturday.
  const sundayPre = m < 18 * 60; // Sunday 00:00–18:00
  const saturday = m >= 6 * 1440; // Saturday (day 6)
  // Friday 17:00 onward (the weekly close) — Friday is day 5.
  const fridayPostClose = m >= 5 * 1440 + 17 * 60;
  // The daily maintenance break 17:00–18:00 New York (every trading day).
  const hourOfDayNy = m % 1440;
  const breakHour = hourOfDayNy >= 17 * 60 && hourOfDayNy < 18 * 60;
  const open = !sundayPre && !saturday && !fridayPostClose && !breakHour;
  return {
    open,
    market: 'COMEX gold futures',
    venue: 'New York',
    tzLabel: `UTC${offset === -4 ? '−4' : '−5'}`,
  };
}
