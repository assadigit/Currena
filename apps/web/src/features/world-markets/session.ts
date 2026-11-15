/**
 * session.ts — the markets section's calendar-true session state
 * (2026-10-29 owner round: "when the market is shut down — like in
 * holidays — it must show that these exchanges are not working right now,
 * for example if Saturday and Sunday they're not working").
 *
 * The stored feed's `open` flag tracks the QUOTE FLOW (a row written at
 * 16:59 still says open); the CALENDAR knows the truth about weekends and
 * public holidays. This helper answers one question — is the exchange's
 * regular session live RIGHT NOW, on its own local clock — from the
 * definitions' IANA timezone, session minutes, closed weekdays and
 * fixed-date holidays. DST resolves through Intl (no offset tables).
 *
 * Honest limits (documented in the definitions too): floating holidays
 * (Good Friday, Lunar New Year, Eid) are NOT modelled — an unmodelled
 * holiday reads "open" here, but the map's own per-market state (which
 * tracks the quote flow) still shows the quiet market. The banner this
 * helper drives only claims ALL-closed when every calendar says so.
 *
 * Pure, platform-free: `now` is injected; the only global is Intl.
 */

import { MARKETS } from '@currena/insights/markets/definitions';
import type { MarketDefinition } from '@currena/insights/markets/definitions';

/** One formatter per timezone, cached (Intl construction is not cheap). */
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timezone: string): Intl.DateTimeFormat {
  let fmt = formatters.get(timezone);
  if (fmt === undefined) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    formatters.set(timezone, fmt);
  }
  return fmt;
}

/** The exchange-local wall clock: { weekday, minutes, isoDate } for `now`. */
export function localClock(
  timezone: string,
  now: Date,
): { weekday: number; minutes: number; isoDate: string } {
  // en-US parts: month/day/year/hour/minute — weekdayName via weekday:'short'
  // is cheaper derived from the date than a second formatter: Intl week
  // starts Sunday, matching JS getDay().
  const parts = formatterFor(timezone).formatToParts(now);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  const year = get('year');
  const month = get('month');
  const day = get('day');
  let hour = Number(get('hour'));
  // Some engines render hour '24' for midnight in hour12:false — normalise.
  if (hour === 24) hour = 0;
  const minutes = hour * 60 + Number(get('minute'));
  const isoDate = `${year}-${month}-${day}`;
  const weekday = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return { weekday, minutes, isoDate };
}

/** True when the exchange's LOCAL date is a modelled fixed-date holiday. */
function isHoliday(def: MarketDefinition, isoDate: string): boolean {
  const holidays = def.holidays ?? [];
  if (holidays.length === 0) return false;
  const mmdd = isoDate.slice(5); // 'MM-DD'
  return holidays.includes(mmdd) || holidays.includes(isoDate);
}

/**
 * Is the exchange's REGULAR SESSION live right now (its own local clock)?
 * Weekends and modelled holidays close the session; the minutes window is
 * [open, close) in local time — the pre-open auction is not a session.
 */
export function sessionOpen(def: MarketDefinition, now: Date): boolean {
  const { weekday, minutes, isoDate } = localClock(def.timezone, now);
  const closedWeekdays = def.closedWeekdays ?? [6, 0]; // Sat + Sun
  if (closedWeekdays.includes(weekday)) return false;
  if (isHoliday(def, isoDate)) return false;
  return minutes >= def.openLocalMinute && minutes < def.closeLocalMinute;
}

/** How many of the 16 markets are live right now. */
export function openMarketCount(now: Date): number {
  return MARKETS.reduce((n, def) => (sessionOpen(def, now) ? n + 1 : n), 0);
}

/** True when EVERY market is closed (the weekend / global-holiday banner). */
export function allMarketsClosed(now: Date): boolean {
  return MARKETS.every((def) => !sessionOpen(def, now));
}
