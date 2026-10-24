import { describe, expect, it } from 'vitest';
import type { InsightsSnapshot } from '@currena/core';
import { addDays, epochDay, type SeriesPoint } from '../series';
import {
  buildHistoryFile,
  buildInsightsSnapshot,
  buildInsightsStatus,
  downsampleSeries,
  HISTORY_MAX_POINTS,
  HISTORY_WINDOW_DAYS,
  projectSnapshotToPublic,
  quarterPeriodOf,
} from './snapshot';

const NOW = '2026-10-07T04:20:00.000Z';

/** Daily series from `start` for `n` days at value `v` (optionally jittered by fn). */
function daily(start: string, n: number, v: number, jitter: (i: number) => number = () => 0): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (let i = 0; i < n; i++) {
    out.push({ date: addDays(start, i), value: v + jitter(i) });
  }
  return out;
}

/** Weekday-only series from `start` to `end` inclusive (business-day dailies
 * like VIXCLS/DGS10/F2 — one point per Mon–Fri). */
function businessDays(start: string, end: string): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  const msPerDay = 86_400_000;
  for (let t = Date.parse(`${start}T00:00:00Z`); t <= Date.parse(`${end}T00:00:00Z`); t += msPerDay) {
    const day = new Date(t).getUTCDay();
    if (day === 0 || day === 6) continue;
    out.push({ date: new Date(t).toISOString().slice(0, 10), value: 100 + out.length });
  }
  return out;
}

describe('downsampleSeries', () => {
  it('returns an unchanged copy when already within the cap', () => {
    const series = daily('2026-09-01', 10, 3);
    const out = downsampleSeries(series);
    expect(out).toEqual(series);
    expect(out).not.toBe(series); // copy, not alias
  });

  it('strides evenly and always ends on the LAST observation', () => {
    const series = daily('2020-01-01', 1000, 3);
    const out = downsampleSeries(series, 100);
    // stride 10 → 100 strided points; the true last point (999) is appended
    // because the stride landed on 990 — the cap is maxPoints + 1 by design.
    expect(out.length).toBeLessThanOrEqual(101);
    expect(out[out.length - 1]).toEqual(series[series.length - 1]);
    expect(out[0]).toEqual(series[0]);
    expect(out[1]).toEqual(series[10]);
  });

  it('appends the last point when the stride would have skipped it', () => {
    const series = daily('2020-01-01', 1001, 3);
    const out = downsampleSeries(series, 100);
    expect(out[out.length - 1]).toEqual(series[1000]!);
    expect(out.length).toBeLessThanOrEqual(101); // strided points + appended last
  });
});

describe('buildHistoryFile', () => {
  it('returns undefined for single-point live cards (no history key)', () => {
    expect(buildHistoryFile('gold-btc', [{ date: '2026-10-07', value: 42 }])).toBeUndefined();
  });

  it('Step-2 §A: a 10-year DAILY series stores its FULL window — no weekly stride', () => {
    // ~2,600 business-day points over 10 years (weekdays only, like VIXCLS
    // / DGS10 / F2). The raised cap (2,700) keeps every one: the stored
    // history satisfies "at least 2 years of daily data (10 years if the
    // source allows)" for the Step-3 verdict rules.
    // Anchor safely INSIDE the 10-year window (the window trims anything
    // older than 3,650 days before the newest observation).
    const weekdays = businessDays('2016-11-01', '2026-10-02');
    expect(weekdays.length).toBeGreaterThan(2500);
    expect(weekdays.length).toBeLessThanOrEqual(HISTORY_MAX_POINTS);
    const file = buildHistoryFile('vix', weekdays)!;
    expect(file.points.length).toBe(weekdays.length);
    expect(file.points[0]).toEqual([epochDay(weekdays[0]!.date), weekdays[0]!.value]);
    expect(file.points.at(-1)).toEqual([epochDay(weekdays.at(-1)!.date), weekdays.at(-1)!.value]);
  });

  it('Step-2 §A: the stride still guards a pathological future series', () => {
    // 5,200 daily points (20 years) — beyond the cap: strided, ending on
    // the last observation.
    const long = businessDays('2006-10-03', '2026-10-02');
    expect(long.length).toBeGreaterThan(HISTORY_MAX_POINTS);
    const file = buildHistoryFile('us10y', long)!;
    expect(file.points.length).toBeLessThanOrEqual(HISTORY_MAX_POINTS + 1);
    expect(file.points.at(-1)).toEqual([epochDay(long.at(-1)!.date), long.at(-1)!.value]);
  });

  it('minPoints 1 bootstraps the accumulated-daily rows (the btc-usd lesson)', () => {
    // A row with no monthly base must persist its FIRST daily point, or the
    // accumulation can never start (every run rebuilds a single live point —
    // 2026-10-08 production evidence). The default stays 2 for live cards.
    const one = buildHistoryFile('btc-usd', [{ date: '2026-10-07', value: 86625 }], { minPoints: 1 })!;
    expect(one.id).toBe('btc-usd');
    expect(one.points).toEqual([[epochDay('2026-10-07'), 86625]]);
  });

  it('encodes a short series verbatim as [epochDay, value] pairs', () => {
    const series: SeriesPoint[] = [
      { date: '2026-10-01', value: 3.88 },
      { date: '2026-10-06', value: 3.97 },
    ];
    const file = buildHistoryFile('us10y', series)!;
    expect(file.id).toBe('us10y');
    expect(file.points).toEqual([
      [epochDay('2026-10-01'), 3.88],
      [epochDay('2026-10-06'), 3.97],
    ]);
  });

  it('keeps only the last 10 years (anchored on the newest observation) and caps the point count', () => {
    // 11 years of daily data ending today.
    const series = daily(addDays('2026-10-07', -11 * 365), 11 * 365 + 1, 3);
    const file = buildHistoryFile('us10y', series)!;
    const oldest = fromEpochDayUnsafe(file.points[0]![0]);
    const newest = fromEpochDayUnsafe(file.points[file.points.length - 1]![0]);
    expect(newest).toBe('2026-10-07');
    expect(epochDay(oldest)).toBeGreaterThanOrEqual(epochDay(newest) - HISTORY_WINDOW_DAYS);
    expect(file.points.length).toBeLessThanOrEqual(HISTORY_MAX_POINTS + 1); // cap + appended last point
  });
});

// local helper to keep the assertion section readable
function fromEpochDayUnsafe(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

describe('buildInsightsSnapshot', () => {
  it('emits one reading per definition, unavailable for missing series', () => {
    const snap = buildInsightsSnapshot({
      series: { us10y: daily('2026-08-29', 40, 3) },
      calendar: [],
      now: NOW,
    });
    // Fix spec C (2026-10-14): the four additions grew the set; the
    // 2026-10-21c owner round retired eth-usd → 65; the 2026-10-23 OD-7
    // round retired nzd-usd + silver-btc → 63; the 2026-10-24 M4 Wave-1
    // round added the early-warning pack's eight ids → 71.
    expect(snap.readings).toHaveLength(71);
    expect(new Set(snap.readings.map((r) => r.id)).size).toBe(71);
    expect(snap.readings.find((r) => r.id === 'us10y')!.status).not.toBe('unavailable');
    expect(snap.readings.find((r) => r.id === 'china-pmi')!.status).toBe('unavailable');
    expect(snap.readings.find((r) => r.id === 'china-pmi')!.value).toBeNull();
    expect(snap.generatedAt).toBe(NOW);
    expect(snap.calendar).toEqual([]);
  });

  it('A-06: context notes are off by default and expired notes never reach the page', () => {
    const series = { us10y: daily('2026-10-13', 40, 5.2) };
    // Default: no notes file — nothing shows.
    const bare = buildInsightsSnapshot({ series, calendar: [], now: NOW });
    expect(bare.readings.find((r) => r.id === 'us10y')!.note).toBeUndefined();
    // A live note attaches with its author and expiry dates…
    const noted = buildInsightsSnapshot({
      series,
      calendar: [],
      now: NOW,
      contextNotes: [
        { id: 'us10y', text: 'A dated, human-written note.', authored: '2026-10-01', expires: '2026-11-01' },
        { id: 'gold-usd', text: 'An expired note.', authored: '2026-08-01', expires: '2026-10-01' },
      ],
    });
    expect(noted.readings.find((r) => r.id === 'us10y')!.note?.text).toBe('A dated, human-written note.');
    // …and the expired one disappears — it never reaches the page.
    expect(noted.readings.find((r) => r.id === 'gold-usd')!.note).toBeUndefined();
  });

  it('Step-1 H3: a missing series HOLDS the previous reading marked stale (never today\'s date)', () => {
    const previous = buildInsightsSnapshot({
      series: { us10y: daily('2026-08-29', 40, 3) },
      calendar: [],
      now: '2026-10-01T00:00:00Z',
    });
    // Simulate the stored previous snapshot carrying a good us10y reading.
    const withUs10y = {
      ...previous,
      readings: previous.readings.map((r) =>
        r.id === 'us10y' ? { ...r, value: 4.25, asOf: '2026-09-30', status: 'normal' } : r,
      ),
    } satisfies import('@currena/core').InsightsSnapshot;
    const snap = buildInsightsSnapshot({ series: {}, calendar: [], previous: withUs10y, now: NOW });
    const held = snap.readings.find((r) => r.id === 'us10y')!;
    expect(held.status).toBe('stale');
    expect(held.value).toBe(4.25); // last good value kept
    expect(held.asOf).toBe('2026-09-30'); // original observation date, never today
    // No previous reading → still honestly unavailable.
    expect(snap.readings.find((r) => r.id === 'china-pmi')!.status).toBe('unavailable');
  });

  it('Step-1 A1: fed-target carries the true corridor bounds from DFEDTARL/DFEDTARU', () => {
    const snap = buildInsightsSnapshot({
      series: {
        'fed-target': [
          { date: '2026-09-15', value: 3.5 },
          { date: '2026-09-29', value: 3.75 },
        ],
      },
      fedTargetUpper: [
        { date: '2026-09-15', value: 3.75 },
        { date: '2026-09-29', value: 4.0 },
      ],
      calendar: [],
      now: NOW,
    });
    const fed = snap.readings.find((r) => r.id === 'fed-target')!;
    expect(fed.value).toBe(3.75); // the LOWER bound is the value
    expect(fed.rangeLow).toBe(3.75);
    expect(fed.rangeHigh).toBe(4.0); // "3.75% to 4.00%" — the audit's reference range
  });

  it('Step-1 A2/A3: release schedule stamps the official release date on scheduled readings', () => {
    const snap = buildInsightsSnapshot({
      series: {
        'us-cpi-yoy': [{ date: '2026-08-01', value: 3.35 }],
        'au-cpi': [{ date: '2026-08-01', value: 3.97 }],
      },
      calendar: [],
      releaseSchedule: [
        { date: '2026-09-11', affects: ['us-cpi-yoy'] },
        { date: '2026-09-30', affects: ['au-cpi'] },
        { date: '2026-10-14', affects: ['us-cpi-yoy'] }, // future release — not stamped
      ],
      now: '2026-10-12T00:00:00Z',
    });
    expect(snap.readings.find((r) => r.id === 'us-cpi-yoy')!.releaseDate).toBe('2026-09-11');
    expect(snap.readings.find((r) => r.id === 'au-cpi')!.releaseDate).toBe('2026-09-30');
    // Unscheduled indicators carry no releaseDate.
    expect(snap.readings.find((r) => r.id === 'us10y')!.releaseDate).toBeUndefined();
  });

  it('stamps source attribution from READING_SOURCES on every reading', () => {
    const snap = buildInsightsSnapshot({ series: {}, calendar: [], now: NOW });
    for (const r of snap.readings) {
      expect(r.sourceName.length).toBeGreaterThan(0);
      expect(r.updatedAt).toBe(NOW);
    }
  });

  it('reports a fresh vote flip in changedThisWeek', () => {
    // 40 flat days → normal; then +1.0 jump on the last day → change-rule warning.
    const calm = daily('2026-08-29', 40, 3);
    const shocked = [...calm.slice(0, -1), { date: calm[39]!.date, value: 4 }];

    const previous: InsightsSnapshot = buildInsightsSnapshot({ series: { us10y: calm }, calendar: [], now: NOW });
    expect(previous.readings.find((r) => r.id === 'us10y')!.status).toBe('normal');
    expect(previous.changedThisWeek).toEqual([]);

    const current = buildInsightsSnapshot({
      series: { us10y: shocked },
      previous,
      calendar: [],
      now: NOW,
    });
    expect(current.readings.find((r) => r.id === 'us10y')!.status).toBe('warning');
    expect(current.changedThisWeek).toEqual([
      { id: 'us10y', from: 'normal', to: 'warning', asOf: shocked[shocked.length - 1]!.date },
    ]);
  });

  it('carries forward still-fresh events from the previous snapshot and drops stale ones', () => {
    const series = daily('2026-08-29', 40, 3);
    const previous: InsightsSnapshot = {
      generatedAt: '2026-10-06T04:20:00.000Z',
      summary: {
        global: { section: 'global', label: null, warningCount: 0, votingCount: 1, excludedCount: 0 },
        australia: { section: 'australia', label: null, warningCount: 0, votingCount: 0, excludedCount: 0 },
      },
      readings: [], // unused by the merge logic (changedSince finds no flips)
      changedThisWeek: [
        { id: 'us10y', from: 'normal', to: 'warning', asOf: addDays('2026-10-07', -2) }, // fresh
        { id: 'usdjpy', from: 'warning', to: 'normal', asOf: addDays('2026-10-07', -9) }, // stale (>7d)
      ],
      calendar: [],
    };
    const snap = buildInsightsSnapshot({ series: { us10y: series }, previous, calendar: [], now: NOW });
    expect(snap.changedThisWeek).toEqual([
      { id: 'us10y', from: 'normal', to: 'warning', asOf: addDays('2026-10-07', -2) },
    ]);
  });
});


describe('defect fixes E-07 / E-08 / E-09 (2026-10-16)', () => {
  it('E-07: quarterly readings carry their period start/end — both source dating bases name the SAME quarter', () => {
    // ABS/FRED convention: the quarter dated by its START (2026-04-01 → June quarter).
    const absLike = buildInsightsSnapshot({
      series: { 'govt-interest-revenue': [{ date: '2026-04-01', value: 33.55 }] },
      calendar: [],
      now: NOW,
    });
    const abs = absLike.readings.find((r) => r.id === 'govt-interest-revenue')!;
    expect(abs.periodStart).toBe('2026-04-01');
    expect(abs.periodEnd).toBe('2026-06-30');
    // RBA E2 convention: the quarter dated by its END (2026-06-30 → the same June quarter).
    const rbaLike = buildInsightsSnapshot({
      series: { 'au-household-debt-arrears': [{ date: '2026-06-30', value: 178.4 }] },
      calendar: [],
      now: NOW,
    });
    const rba = rbaLike.readings.find((r) => r.id === 'au-household-debt-arrears')!;
    expect(rba.periodStart).toBe('2026-04-01');
    expect(rba.periodEnd).toBe('2026-06-30');
    // The pure helper agrees on both bases.
    expect(quarterPeriodOf('2026-04-01')).toEqual({ start: '2026-04-01', end: '2026-06-30' });
    expect(quarterPeriodOf('2026-06-30')).toEqual({ start: '2026-04-01', end: '2026-06-30' });
    expect(quarterPeriodOf('2026-05-15')).toBeUndefined(); // not a quarter boundary
  });

  it('E-08: an expired manual entry wears the stale tag with its reason — never reads fresh', () => {
    const series = { 'china-pmi': [{ date: '2026-09-30', value: 50.1 }] };
    const fresh = buildInsightsSnapshot({
      series,
      calendar: [],
      manualExpires: { 'china-pmi': '2026-10-31' },
      now: NOW, // 2026-10-07 < expiry
    });
    expect(fresh.readings.find((r) => r.id === 'china-pmi')!.status).not.toBe('stale');
    const expired = buildInsightsSnapshot({
      series,
      calendar: [],
      manualExpires: { 'china-pmi': '2026-10-01' },
      now: NOW, // past the expiry
    });
    const pmi = expired.readings.find((r) => r.id === 'china-pmi')!;
    expect(pmi.status).toBe('stale');
    expect(pmi.flag?.test).toBe('E-08');
    expect(pmi.flag?.reason).toContain('expired');
  });

  it('E-09: released calendar events never ride the snapshot — only today-and-future', () => {
    const snap = buildInsightsSnapshot({
      series: { us10y: daily('2026-08-29', 40, 3) },
      calendar: [
        { id: 'us-cpi-2026-09', date: '2026-10-06', titleEn: 'US consumer price index: September 2026', titleFa: 'شاخص قیمت مصرف‌کننده', kind: 'us-cpi' },
        { id: 'fed-2026-10', date: '2026-10-28', titleEn: 'Fed decision', titleFa: 'تصمیم فدرال رزرو', kind: 'fed' },
        { id: 'rba-2026-11', date: NOW.slice(0, 10), titleEn: 'RBA decision', titleFa: 'تصمیم بانک مرکزی', kind: 'rba' },
      ],
      now: NOW,
    });
    const ids = snap.calendar.map((e) => e.id);
    expect(ids).not.toContain('us-cpi-2026-09'); // released — gone
    expect(ids).toContain('fed-2026-10'); // future — kept
    expect(ids).toContain('rba-2026-11'); // today — kept (not yet released)
  });
});

describe('buildInsightsStatus', () => {
  it('builds the validated per-source freshness record', () => {
    const status = buildInsightsStatus({
      reports: [
        { source: 'fred', ok: true, detail: '10/10 series fetched' },
        { source: 'rba', ok: false, detail: 'F1.1: HTTP 403' },
      ],
      generatedAt: NOW,
      mode: 'scheduled',
      dryRun: false,
    });
    expect(status.v).toBe(1);
    expect(status.mode).toBe('scheduled');
    expect(status.sources).toHaveLength(2);
    expect(status.sources[1]!.ok).toBe(false);
  });
});

describe('projectSnapshotToPublic (2026-10-19 public projection)', () => {
  const full = buildInsightsSnapshot({
    series: { us10y: daily('2026-08-29', 40, 3), 'gold-usd': daily('2026-09-20', 20, 2400) },
    calendar: [],
    now: NOW,
  });

  it('drops the hidden ids entirely (no unavailable placeholders) and stamps displayMode public', () => {
    const hidden = new Set(['gold-usd', 'brent', 'china-pmi']);
    const pub = projectSnapshotToPublic(full, hidden);
    expect(pub.displayMode).toBe('public');
    expect(pub.readings.find((r) => r.id === 'gold-usd')).toBeUndefined();
    expect(pub.readings.find((r) => r.id === 'us10y')).toBeDefined();
    expect(pub.readings).toHaveLength(full.readings.length - hidden.size);
    expect(pub.calendar).toEqual(full.calendar);
    expect(pub.ruleVersion).toBe(full.ruleVersion);
  });

  it('filters changedThisWeek events for hidden ids and recomputes the summaries over the survivors', () => {
    const withEvents: InsightsSnapshot = {
      ...full,
      changedThisWeek: [
        { id: 'gold-usd', from: 'normal', to: 'warning', asOf: '2026-10-06' },
        { id: 'us10y', from: 'warning', to: 'normal', asOf: '2026-10-05' },
      ],
    };
    const pub = projectSnapshotToPublic(withEvents, new Set(['gold-usd']));
    expect(pub.changedThisWeek.map((e) => e.id)).toEqual(['us10y']);
    // The summary is the SAME summarizer over the subset — vote counts shrink.
    expect(pub.summary.global.votingCount).toBeLessThanOrEqual(full.summary.global.votingCount);
  });

  it('is idempotent (projecting a projection changes nothing)', () => {
    const once = projectSnapshotToPublic(full, new Set(['gold-usd', 'brent']));
    const twice = projectSnapshotToPublic(once, new Set(['gold-usd', 'brent']));
    expect(twice).toEqual(once);
  });

  it('LR-02 regression: with the GENERATED overrides file, no hidden id survives and the boards are declared', async () => {
    const { readFileSync } = await import('node:fs');
    const overrides = JSON.parse(
      readFileSync(new URL('../../../../data/site-mode-overrides.json', import.meta.url), 'utf8'),
    ) as { hiddenIndicatorIds: string[]; hiddenBoards: string[] };
    const full52 = buildInsightsSnapshot({ series: {}, calendar: [], now: NOW });
    const pub = projectSnapshotToPublic(full52, new Set(overrides.hiddenIndicatorIds));
    for (const reading of pub.readings) {
      expect(overrides.hiddenIndicatorIds).not.toContain(reading.id);
    }
    expect(pub.readings).toHaveLength(full52.readings.length - overrides.hiddenIndicatorIds.length);
    // The boards follow the generated policy (2026-10-18b markets
    // directive; 2026-10-21c fx restoration directive): both public.
    expect(overrides.hiddenBoards).toEqual([]);
  });
});
