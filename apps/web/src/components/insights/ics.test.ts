/**
 * ics.ts unit tests (I10) — RFC 5545 compliance of the calendar export:
 * CRLF endings, escaping, octet-safe folding, all-day DTEND semantics,
 * stable UIDs and deterministic DTSTAMP (now is passed in every test).
 */

import { describe, expect, it } from 'vitest';
import { buildInsightsIcs } from './ics';
import type { CalendarEvent } from '@currena/core';

const NOW = Date.UTC(2026, 9, 8, 12, 0, 0); // 2026-10-08T12:00:00Z — fixed

function ev(overrides: Partial<CalendarEvent> & Pick<CalendarEvent, 'id' | 'date'>): CalendarEvent {
  return {
    titleEn: 'RBA cash-rate decision',
    titleFa: 'تصمیم نرخ بهرهٔ RBA',
    kind: 'rba',
    ...overrides,
  };
}

describe('buildInsightsIcs', () => {
  it('emits the VCALENDAR shell with CRLF endings and a trailing CRLF', () => {
    const out = buildInsightsIcs([], 'en', NOW);
    expect(out.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(out.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(out).toContain('VERSION:2.0\r\n');
    expect(out).toContain('PRODID:-//Currena//Insights Calendar//EN\r\n');
    expect(out).not.toMatch(/[^\r]\n/); // never a bare LF
    expect(out).not.toContain('BEGIN:VEVENT'); // empty calendar → shell only
  });

  it('renders one VEVENT per upcoming event, sorted by date', () => {
    const out = buildInsightsIcs(
      [ev({ id: 'b', date: '2026-12-01' }), ev({ id: 'a', date: '2026-10-28' })],
      'en',
      NOW,
    );
    const starts = [...out.matchAll(/DTSTART;VALUE=DATE:(\d{8})/g)].map((m) => m[1]);
    expect(starts).toEqual(['20261028', '20261201']);
    expect([...out.matchAll(/BEGIN:VEVENT/g)]).toHaveLength(2);
  });

  it('uses all-day DTSTART with the exclusive DTEND on the next day', () => {
    const out = buildInsightsIcs([ev({ id: 'x', date: '2026-10-31' })], 'en', NOW);
    expect(out).toContain('DTSTART;VALUE=DATE:20261031\r\n');
    expect(out).toContain('DTEND;VALUE=DATE:20261101\r\n'); // month boundary
  });

  it('keeps UIDs stable per event+date and the DTSTAMP deterministic', () => {
    const events = [ev({ id: 'rba-nov', date: '2026-11-03' })];
    const a = buildInsightsIcs(events, 'en', NOW);
    const b = buildInsightsIcs(events, 'en', NOW);
    expect(a).toContain('UID:rba-nov-2026-11-03@currena.ir\r\n');
    expect(a).toContain('DTSTAMP:20261008T120000Z\r\n');
    expect(a).toBe(b); // same now → byte-identical (re-import updates, not duplicates)
  });

  it('localizes SUMMARY and escapes RFC 5545 TEXT metacharacters', () => {
    // Titles stay under the 75-octet fold limit here — folding has its own
    // test below; this one is about escaping only.
    const tricky = ev({
      id: 't',
      date: '2026-10-28',
      titleEn: 'Fed meeting; rates, cuts maybe\\possibly',
      titleFa: 'برش\\، تست؛',
    });
    // ASCII ; , \ escape; the Persian ؛ and ، (different code points) do not.
    expect(buildInsightsIcs([tricky], 'en', NOW)).toContain(
      'SUMMARY:Fed meeting\\; rates\\, cuts maybe\\\\possibly',
    );
    expect(buildInsightsIcs([tricky], 'fa', NOW)).toContain('SUMMARY:برش\\\\، تست؛');
    expect(buildInsightsIcs([tricky], 'fa', NOW)).toContain('X-WR-CALNAME:رویدادهای اقتصادی کورنا');
  });

  it('folds long lines at 75 octets without splitting a UTF-8 sequence', () => {
    const longTitle = `${'گزارش '.repeat(30)}طولانی`; // ~7 chars/word × multibyte
    const out = buildInsightsIcs([ev({ id: 'long', date: '2026-10-28', titleFa: longTitle })], 'fa', NOW);
    const summaryBlock = out
      .split('\r\n')
      .filter((l) => l.startsWith('SUMMARY:') || l.startsWith(' '));
    // Every physical line is within the fold budget; continuations re-join losslessly.
    const encoder = new TextEncoder();
    for (const line of summaryBlock) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
      if (!line.startsWith('SUMMARY:')) expect(line.startsWith(' ')).toBe(true);
    }
    const rejoined = summaryBlock
      .map((l, i) => (i === 0 ? l.slice('SUMMARY:'.length) : l.slice(1)))
      .join('');
    expect(rejoined).toBe(longTitle);
  });
});
