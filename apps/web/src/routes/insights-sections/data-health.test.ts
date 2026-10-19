/**
 * data-health.test.ts — v3 UI_SPEC §10 UI-50 + UI-47 (2026-10-20, PH6-C):
 * pins for the header's data-health chip rule (data-health.ts) and the
 * calendar's time-zone label map (NextUpStrip's TZ_LABEL).
 *
 * The chip speaks the page's own six-word vocabulary: Stale counts
 * status 'stale'; the two "Can't tell right now" faces (check-pending +
 * unavailable) count as unavailable; worst wins, and when both groups
 * exist the chip shows the unavailable count while its title carries the
 * stale one (InsightsHeader renders the title; the counts here are the
 * same numbers).
 *
 * The tz map must cover EXACTLY the zone names present in
 * data/insights-calendar.json (the brief's instruction) — this test reads
 * that file and fails when a new event carries a zone the map does not
 * name.
 */

import { describe, expect, it } from 'vitest';
import { dataHealthOf } from './data-health';
import { TZ_LABEL } from '../../components/insights/NextUpStrip';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import calendarJson from '../../../../../data/insights-calendar.json';

const reading = (status: string): { status: string } => ({ status });

describe('dataHealthOf — worst wins, counts combined honestly', () => {
  it('a calm snapshot reads "All data current"', () => {
    const health = dataHealthOf([reading('warning'), reading('normal'), reading('context'), reading('no-history')]);
    expect(health).toEqual({ kind: 'all-current', stale: 0, unavailable: 0 });
  });

  it('stale cards count toward "N stale"; the calm words never do', () => {
    const health = dataHealthOf([reading('normal'), reading('stale'), reading('stale'), reading('context')]);
    expect(health.kind).toBe('stale');
    expect(health.stale).toBe(2);
    expect(health.unavailable).toBe(0);
  });

  it('check-pending and unavailable both wear the "can\'t tell" face — they count as unavailable', () => {
    const health = dataHealthOf([reading('check-pending'), reading('unavailable'), reading('normal')]);
    expect(health.kind).toBe('unavailable');
    expect(health.unavailable).toBe(2);
    expect(health.stale).toBe(0);
  });

  it('worst wins: with both groups the chip speaks the unavailable count and keeps the stale count for its title', () => {
    const health = dataHealthOf([reading('stale'), reading('stale'), reading('stale'), reading('unavailable')]);
    expect(health.kind).toBe('unavailable');
    expect(health.unavailable).toBe(1);
    expect(health.stale).toBe(3);
  });

  it('an empty snapshot reads "All data current" (never a negative count)', () => {
    expect(dataHealthOf([])).toEqual({ kind: 'all-current', stale: 0, unavailable: 0 });
  });
});

describe('data-health chip copy parity (en/fa)', () => {
  const tokens = (s: string): string[] => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]! as string).sort();

  it('the chip words interpolate the same tokens in both locales', () => {
    for (const key of ['healthStaleChip', 'healthUnavailableChip', 'healthTitleBoth'] as const) {
      expect(tokens(insightsCopyFa.ui[key]), `ui.${key}`).toEqual(tokens(insightsCopyEn.ui[key]));
    }
    expect(tokens(insightsCopyEn.ui.healthTitleBoth)).toEqual(['stale', 'unavailable']);
  });

  it('all three chip words + the hint exist in both locales', () => {
    for (const key of ['healthAllCurrent', 'healthChipHint'] as const) {
      expect(insightsCopyEn.ui[key].length).toBeGreaterThan(0);
      expect(insightsCopyFa.ui[key].length).toBeGreaterThan(0);
    }
  });
});

describe('TZ_LABEL — the calendar zones actually in the data', () => {
  const events = calendarJson as unknown as readonly { tz?: string }[];
  const zones = new Set(events.flatMap((e) => (e.tz !== undefined ? [e.tz] : [])));

  it('every zone carried by data/insights-calendar.json has a label', () => {
    const missing = [...zones].filter((z) => !(z in TZ_LABEL));
    expect(missing, 'a calendar event carries a zone the map does not name').toEqual([]);
  });

  it('the map names no zone the data does not carry', () => {
    for (const zone of Object.keys(TZ_LABEL)) expect(zones.has(zone), `unexpected map zone ${zone}`).toBe(true);
  });

  it('each label word exists in both locales', () => {
    for (const key of Object.values(TZ_LABEL)) {
      expect(insightsCopyEn.ui[key].length, `ui.${key} (en)`).toBeGreaterThan(0);
      expect(insightsCopyFa.ui[key].length, `ui.${key} (fa)`).toBeGreaterThan(0);
    }
  });
});
