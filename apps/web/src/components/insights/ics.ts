/**
 * ics.ts — RFC 5545 calendar export for the Coming-up section (I10).
 *
 * A pure builder (no DOM — unit-tested like config.ts): the component only
 * wraps the result in a Blob and hands it to the shared downloadBlob helper.
 *
 * RFC 5545 compliance that matters for Google/Apple/Outlook importers:
 *  - CRLF line endings, with a trailing CRLF;
 *  - content lines folded at 75 OCTETS (not characters), continuation lines
 *    start with a single space, and folds never split a UTF-8 sequence
 *    (Persian titles are the whole point here);
 *  - TEXT values escape backslash, semicolon, comma and newlines (§3.3.11);
 *  - all-day events use DTSTART;VALUE=DATE with the EXCLUSIVE end (DTEND =
 *    date + 1 day) so an event on 2026-10-28 shows on the 28th only;
 *  - stable UIDs (`<event id>-<date>@currena.ir`) so re-importing the same
 *    calendar updates instead of duplicating.
 */

import type { CalendarEvent } from '@currena/core';

/** RFC 5545 §3.3.11 TEXT escaping. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * Fold one content line at 75 octets (RFC 5545 §3.1). Continuation lines
 * carry a leading space and get 74 octets of payload. The fold backs off to
 * a character boundary so a multi-byte UTF-8 sequence is never split.
 */
function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const decoder = new TextDecoder();
  const out: string[] = [];
  let start = 0;
  while (start < bytes.length) {
    let end = Math.min(start + (start === 0 ? 75 : 74), bytes.length);
    while (end > start && end < bytes.length && (bytes[end]! & 0xc0) === 0x80) {
      end -= 1; // mid-character — back off to the previous boundary
    }
    const chunk = decoder.decode(bytes.subarray(start, end));
    out.push(start === 0 ? chunk : ` ${chunk}`);
    start = end;
  }
  return out.join('\r\n');
}

/** '2026-10-28' → '20261028'. */
function isoToIcsDate(dateIso: string): string {
  return dateIso.replaceAll('-', '');
}

/** The exclusive DTEND of an all-day event: the day after DTSTART. */
function nextDay(dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  if (y === undefined || m === undefined || d === undefined) {
    throw new Error(`ics: not a date: ${dateIso}`);
  }
  const next = new Date(Date.UTC(y, m - 1, d) + 86_400_000);
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${next.getUTCFullYear()}${p(next.getUTCMonth() + 1)}${p(next.getUTCDate())}`;
}

/** UTC DTSTAMP ('YYYYMMDDTHHMMSSZ') — deterministic when `now` is passed. */
function icsStamp(now: number): string {
  const d = new Date(now);
  const p = (n: number): string => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

/**
 * Build the .ics payload for the upcoming key dates. Events are sorted by
 * date (the section's own order); titles are localized (titleEn/titleFa).
 * `now` exists for tests only — the wire format requires a DTSTAMP.
 */
export function buildInsightsIcs(
  events: readonly CalendarEvent[],
  locale: 'en' | 'fa',
  now: number = Date.now(),
): string {
  const stamp = icsStamp(now);
  const calName =
    locale === 'fa' ? 'رویدادهای اقتصادی کورنا' : 'Currena — market key dates';
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Currena//Insights Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calName)}`,
  ];
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  for (const e of sorted) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.id}-${e.date}@currena.ir`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${isoToIcsDate(e.date)}`,
      `DTEND;VALUE=DATE:${nextDay(e.date)}`,
      `SUMMARY:${escapeText(locale === 'fa' ? e.titleFa : e.titleEn)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}
