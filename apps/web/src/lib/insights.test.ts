/**
 * Insights client + display-config unit tests (Phase I4).
 *
 * House pattern (history.test.ts): stub globals per test, no React
 * rendering, deterministic fixtures. The snapshot fixture mirrors the
 * production wire format (the /api/insights contract from the Phase I3
 * write-run) with one reading per status class so the display helpers
 * cover every branch.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearHistoryCacheForTests,
  fetchIndicatorHistory,
  fetchInsightsSnapshot,
  readCachedSnapshot,
} from './insights';
import { ApiError } from './api';
import {
  bigMovers,
  epochDayToIso,
  formatChange,
  formatIndicatorValue,
  formatPinnedStorage,
  formatRuleText,
  groupCounts,
  indicatorMatchesFilter,
  filterVisibleIds,
  parsePinnedIds,
  rangeIsPlottable,
  sampleHistoryRows,
  sliceHistoryToRange,
  statusCounts,
  warningZone,
} from '../components/insights/config';
import { insightsCopyEn } from '../i18n/insights-copy-en';
import { insightsCopyFa } from '../i18n/insights-copy-fa';
import { containsForbiddenWords } from '@currena/insights/validation';
import { definitionFor } from '../components/insights/config';
import type { InsightsSnapshot, IndicatorReading } from '@currena/core';

/* ------------------------------------------------------------------ *
 * Fixtures — minimal contract-valid snapshot covering every status
 * ------------------------------------------------------------------ */

function reading(partial: Partial<IndicatorReading> & { id: IndicatorReading['id'] }): IndicatorReading {
  return {
    value: 1,
    asOf: '2026-10-06',
    status: 'normal',
    sourceName: 'FRED (T10Y2Y)',
    sourceUrl: 'https://fred.stlouisfed.org/series/T10Y2Y',
    updatedAt: '2026-10-07T04:20:00.000Z',
    ...partial,
  };
}

const SNAPSHOT: InsightsSnapshot = {
  generatedAt: '2026-10-07T04:20:00.000Z',
  summary: {
    global: { section: 'global', label: 'cautious', warningCount: 1, votingCount: 2, excludedCount: 1 },
    australia: { section: 'australia', label: 'relaxed', warningCount: 0, votingCount: 2, excludedCount: 0 },
  },
  readings: [
    reading({ id: 'yield-curve-10y2y', value: 0.48, change7d: 0.11, change30d: 0.07, percentile10y: 0.56, status: 'normal' }),
    reading({ id: 'us10y', value: 5.31, change7d: 0.07, change30d: 0.53, percentile10y: 1, status: 'warning' }),
    reading({ id: 'dollar-basket', value: 102.4, change7d: 1.05, change30d: 2.86, percentile10y: 0.79, status: 'stale' }),
    reading({ id: 'gold-btc', value: 0.0492, status: 'context' }),
    reading({ id: 'china-pmi', value: null, asOf: null, status: 'unavailable' }),
    reading({ id: 'rba-cash-rate', value: 4.36, status: 'context' }),
    reading({ id: 'au-cpi', value: 3.94, change30d: 0.2, percentile10y: 0.76, status: 'warning' }),
    reading({ id: 'au-unemployment', value: 4.65, change30d: 0.16, percentile10y: 0.5, status: 'normal' }),
  ],
  changedThisWeek: [],
  calendar: [],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  clearHistoryCacheForTests();
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => void storage.set(k, v),
      removeItem: (k: string) => void storage.delete(k),
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ *
 * lib/insights.ts — snapshot fetch + cache
 * ------------------------------------------------------------------ */

describe('fetchInsightsSnapshot', () => {
  it('validates a contract-shaped payload and returns it', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(SNAPSHOT));
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchInsightsSnapshot();
    expect(result.generatedAt).toBe(SNAPSHOT.generatedAt);
    expect(result.readings).toHaveLength(8);
  });

  it('persists the last-good snapshot to localStorage', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(SNAPSHOT)));
    await fetchInsightsSnapshot();
    expect(storage.has('currena:insights:snapshot')).toBe(true);
    const round = readCachedSnapshot();
    expect(round?.summary.global.label).toBe('cautious');
  });

  it('throws a typed rates ApiError for a 503 insights_not_ready envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ error: { code: 'insights_not_ready', message: 'Insights not ready' } }, 503),
      ),
    );
    await expect(fetchInsightsSnapshot()).rejects.toMatchObject({
      kind: 'rates',
      code: 'insights_not_ready',
      status: 503,
    });
  });

  it('throws parse ApiError on a 2xx body that breaks the contract', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ generatedAt: 'nope' })));
    await expect(fetchInsightsSnapshot()).rejects.toMatchObject({ kind: 'parse' });
  });

  it('throws network ApiError when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    await expect(fetchInsightsSnapshot()).rejects.toBeInstanceOf(ApiError);
  });

  it('readCachedSnapshot discards corrupted JSON silently', () => {
    storage.set('currena:insights:snapshot', '{not json');
    expect(readCachedSnapshot()).toBeNull();
  });

  it('readCachedSnapshot discards contract-invalid snapshots', () => {
    storage.set('currena:insights:snapshot', JSON.stringify({ generatedAt: 42 }));
    expect(readCachedSnapshot()).toBeNull();
  });
});

describe('fetchIndicatorHistory', () => {
  it('returns the parsed history for a known id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ v: 1, id: 'us10y', points: [[17081, 1.73], [17091, 1.77]] })),
    );
    const history = await fetchIndicatorHistory('us10y');
    expect(history?.points).toHaveLength(2);
    expect(history?.points[0]).toEqual([17081, 1.73]);
  });

  it('resolves null for the expected 404 history_not_found (single-point cards)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ error: { code: 'history_not_found', message: 'no history' } }, 404),
      ),
    );
    expect(await fetchIndicatorHistory('gold-btc')).toBeNull();
  });

  it('caches the promise so a second call never refetches', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ v: 1, id: 'us10y', points: [[17081, 1.73]] }));
    vi.stubGlobal('fetch', fetchMock);
    await fetchIndicatorHistory('us10y');
    await fetchIndicatorHistory('us10y');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects loudly on an id-mismatched payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ v: 1, id: 'brent', points: [[17081, 90]] })),
    );
    await expect(fetchIndicatorHistory('us10y')).rejects.toMatchObject({ kind: 'parse' });
  });

  it('a rejected fetch is dropped from the cache so it can be retried', async () => {
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) return Promise.reject(new TypeError('offline'));
        return jsonResponse({ v: 1, id: 'us10y', points: [[17081, 1.73]] });
      }),
    );
    await expect(fetchIndicatorHistory('us10y')).rejects.toBeInstanceOf(ApiError);
    const second = await fetchIndicatorHistory('us10y');
    expect(second?.points).toHaveLength(1);
    expect(calls).toBe(2);
  });
});

/* ------------------------------------------------------------------ *
 * config.ts — display helpers
 * ------------------------------------------------------------------ */

describe('formatIndicatorValue', () => {
  it('renders percent values without a space in both locales', () => {
    expect(formatIndicatorValue('us10y', 5.31, 'en-US', insightsCopyEn.units)).toBe('5.31%');
    expect(formatIndicatorValue('us10y', 5.31, 'fa-IR', insightsCopyFa.units)).toBe('۵٫۳۱٪');
  });

  it('renders the interest-bill share as the stored percentage (E-11: the engine stores 33.55, not a fraction)', () => {
    expect(formatIndicatorValue('govt-interest-revenue', 33.5539, 'en-US', insightsCopyEn.units)).toBe(
      '33.6%',
    );
  });

  it('prefixes currency units in English and suffixes words in Farsi', () => {
    expect(formatIndicatorValue('brent', 113.96, 'en-US', insightsCopyEn.units)).toBe('US$113.96');
    expect(formatIndicatorValue('brent', 113.96, 'fa-IR', insightsCopyFa.units)).toBe('۱۱۳٫۹۶ دلار');
  });

  it('honours per-indicator decimals', () => {
    // R13: every number carries its unit — AUD/USD reads "US$ per A$".
    expect(formatIndicatorValue('audusd', 0.6982, 'en-US', insightsCopyEn.units)).toBe('US$0.6982');
    expect(formatIndicatorValue('gold-aud', 5900.19, 'en-US', insightsCopyEn.units)).toBe('A$5,900');
  });
});

describe('formatChange', () => {
  it('renders signed percent changes', () => {
    expect(formatChange(0.62, 'pct', 'en-US', insightsCopyEn.units)).toBe('+0.62%');
    expect(formatChange(-0.31, 'pct', 'en-US', insightsCopyEn.units)).toBe('−0.31%');
  });

  it('renders signed point changes with the points unit', () => {
    expect(formatChange(0.11, 'points', 'en-US', insightsCopyEn.units)).toBe('+0.11 pts');
    // Persian percentage points read «واحد درصد» (the standard financial term).
    expect(formatChange(-0.11, 'points', 'fa-IR', insightsCopyFa.units)).toBe('−۰٫۱۱ واحد درصد');
  });
});

describe('formatRuleText', () => {
  it('renders the threshold rule with sustained weeks (index units stay bare)', () => {
    const def = definitionFor('stress-stlfsi');
    expect(formatRuleText(def.rule, 'stress-stlfsi', insightsCopyEn.rule, insightsCopyEn.units, 'en-US')).toBe(
      'above 0 for 4 weeks in a row',
    );
  });

  it('renders percentile rules with the cutoff as a percent', () => {
    const def = definitionFor('real-yield-10y');
    expect(formatRuleText(def.rule, 'real-yield-10y', insightsCopyEn.rule, insightsCopyEn.units, 'en-US')).toBe(
      'in the highest 20% of its 10-year range',
    );
  });

  it('joins any-of atoms with the localized "or"', () => {
    const def = definitionFor('us10y');
    expect(formatRuleText(def.rule, 'us10y', insightsCopyEn.rule, insightsCopyEn.units, 'en-US')).toBe(
      'in the highest 10% of its 10-year range or up more than 0.5 pts within 4 weeks',
    );
  });

  it('renders the Farsi rule text with Persian digits', () => {
    const def = definitionFor('au-cpi');
    expect(formatRuleText(def.rule, 'au-cpi', insightsCopyFa.rule, insightsCopyFa.units, 'fa-IR')).toBe(
      'بیشتر از ۳٪',
    );
  });

  it('renders change rules with magnitude and window', () => {
    const def = definitionFor('usdjpy');
    expect(formatRuleText(def.rule, 'usdjpy', insightsCopyEn.rule, insightsCopyEn.units, 'en-US')).toBe(
      'down more than 5% within 4 weeks',
    );
  });
});

describe('warningZone', () => {
  it('shades the high tail for high-tail percentile rules', () => {
    expect(warningZone({ kind: 'percentile', tail: 'high', cutoff: 0.2 })).toEqual({ from: 0.8, to: 1 });
  });

  it('shades the low tail for low-tail rules', () => {
    expect(warningZone({ kind: 'percentile', tail: 'low', cutoff: 0.2 })).toEqual({ from: 0, to: 0.2 });
  });

  it('merges overlapping zones from an any-of rule', () => {
    expect(
      warningZone({
        kind: 'any-of',
        of: [
          { kind: 'percentile', tail: 'high', cutoff: 0.2 },
          { kind: 'percentile', tail: 'high', cutoff: 0.1 },
        ],
      }),
    ).toEqual({ from: 0.8, to: 1 });
  });

  it('returns null for non-percentile rules', () => {
    expect(warningZone({ kind: 'threshold', direction: 'below', value: 0 })).toBeNull();
    expect(warningZone({ kind: 'info' })).toBeNull();
  });
});

describe('bigMovers (I15: |z| ≥ 2 only)', () => {
  it('clears only readings whose moveScore crosses the threshold, ranked by |z|', () => {
    const readings = [
      ...SNAPSHOT.readings.filter((r) => r.id !== 'yield-curve-10y2y' && r.id !== 'us10y'),
      { ...SNAPSHOT.readings.find((r) => r.id === 'yield-curve-10y2y')!, moveScore: 2.4 },
      { ...SNAPSHOT.readings.find((r) => r.id === 'us10y')!, moveScore: 3.1 },
      { ...SNAPSHOT.readings.find((r) => r.id === 'gold-btc')!, moveScore: 5 }, // context card: no headline
    ];
    const movers = bigMovers(readings);
    expect(movers.map((m) => m.id)).toEqual(['us10y', 'yield-curve-10y2y']);
    expect(movers.every((m) => Math.abs(m.moveScore) >= 2)).toBe(true);
  });

  it('readings without moveScore never appear (the callout hides honestly)', () => {
    expect(bigMovers(SNAPSHOT.readings)).toEqual([]);
  });
});

describe('groupCounts', () => {
  it('counts voters, warnings and excluded within one group', () => {
    // borrowing-costs in the fixture: yield-curve normal, us10y warning.
    expect(groupCounts(SNAPSHOT.readings, 'global', 'borrowing-costs')).toEqual({
      alertCount: 1,
      votingCount: 2,
      excludedCount: 0,
    });
    // dollar-strength: only the stale dollar-basket exists in the fixture.
    expect(groupCounts(SNAPSHOT.readings, 'global', 'dollar-strength')).toEqual({
      alertCount: 0,
      votingCount: 0,
      excludedCount: 1,
    });
  });

  it('treats context cards as neither voters nor excluded', () => {
    // au-inflation-rates: rba-cash-rate context, au-cpi warning.
    expect(groupCounts(SNAPSHOT.readings, 'australia', 'au-inflation-rates')).toEqual({
      alertCount: 1,
      votingCount: 1,
      excludedCount: 0,
    });
  });
});

describe('card filter (I8)', () => {
  const nameOfEn = (id: IndicatorReading['id']): { name: string; ticker?: string } => ({
    name: insightsCopyEn.indicators[id].name,
    ticker: insightsCopyEn.indicators[id].ticker,
  });
  const nameOfFa = (id: IndicatorReading['id']): { name: string; ticker?: string } => ({
    name: insightsCopyFa.indicators[id].name,
    ticker: insightsCopyFa.indicators[id].ticker,
  });

  it('an inactive filter means "no filtering" (null), whitespace query included', () => {
    expect(filterVisibleIds(SNAPSHOT.readings, { status: 'all', query: '' }, nameOfEn)).toBeNull();
    expect(filterVisibleIds(SNAPSHOT.readings, { status: 'all', query: '   ' }, nameOfEn)).toBeNull();
  });

  it('status chips narrow to exactly that status, snapshot order preserved', () => {
    expect([...filterVisibleIds(SNAPSHOT.readings, { status: 'warning', query: '' }, nameOfEn)!]).toEqual([
      'us10y',
      'au-cpi',
    ]);
    expect([...filterVisibleIds(SNAPSHOT.readings, { status: 'normal', query: '' }, nameOfEn)!]).toEqual([
      'yield-curve-10y2y',
      'au-unemployment',
    ]);
    expect([...filterVisibleIds(SNAPSHOT.readings, { status: 'context', query: '' }, nameOfEn)!]).toEqual([
      'gold-btc',
      'rba-cash-rate',
    ]);
  });

  it('stale and unavailable cards only ever appear under All', () => {
    for (const status of ['warning', 'normal', 'context'] as const) {
      const ids = filterVisibleIds(SNAPSHOT.readings, { status, query: '' }, nameOfEn)!;
      expect(ids.has('dollar-basket')).toBe(false); // stale
      expect(ids.has('china-pmi')).toBe(false); // unavailable
    }
  });

  it('search matches names case-insensitively and tickers; spacing is irrelevant', () => {
    // I15 plain names: «The share of Australians without work».
    expect([...filterVisibleIds(SNAPSHOT.readings, { status: 'all', query: 'without work' }, nameOfEn)!]).toEqual([
      'au-unemployment',
    ]);
    // Multi-word Latin query vs the name's own spacing.
    expect([...filterVisibleIds(SNAPSHOT.readings, { status: 'all', query: 'Australians without' }, nameOfEn)!]).toEqual([
      'au-unemployment',
    ]);
    // R14: source-code tickers (XAU÷BTC, DCOILBRENTEU…) left the copy;
    // helpful tags stay searchable ('CPI' on the CPI rows).
    expect(filterVisibleIds(SNAPSHOT.readings, { status: 'all', query: 'XAU' }, nameOfEn)!.size).toBe(0);
    expect([...filterVisibleIds(SNAPSHOT.readings, { status: 'all', query: 'CPI' }, nameOfEn)!]).toEqual(['au-cpi']);
  });

  it('search and status combine with AND semantics', () => {
    expect([...filterVisibleIds(SNAPSHOT.readings, { status: 'warning', query: 'prices vs a year' }, nameOfEn)!]).toEqual([
      'au-cpi',
    ]);
    expect(filterVisibleIds(SNAPSHOT.readings, { status: 'normal', query: 'prices vs a year' }, nameOfEn)!.size).toBe(0);
  });

  it('a query that matches nothing yields an empty set (the no-match state)', () => {
    expect(filterVisibleIds(SNAPSHOT.readings, { status: 'all', query: 'zzzz-nothing' }, nameOfEn)!.size).toBe(0);
  });

  it('Persian search: a plain space still matches ZWNJ compounds', () => {
    // gold-btc's Farsi name is «طلا در برابر بیت‌کوین» (ZWNJ inside بیت‌کوین).
    expect([...filterVisibleIds(SNAPSHOT.readings, { status: 'all', query: 'بیت کوین' }, nameOfFa)!]).toEqual([
      'gold-btc',
    ]);
  });

  it('Persian search: Arabic-keyboard yeh/kaf are normalised to Persian', () => {
    // «بيكار» = بیکار... the I15 fa name is «سهم افراد بیکار در استرالیا» —
    // the normalisation is exercised through «بیکار»
    // typed with Arabic ي and ك: «بيكار».
    expect([...filterVisibleIds(SNAPSHOT.readings, { status: 'all', query: 'بيكار' }, nameOfFa)!]).toEqual([
      'au-unemployment',
    ]);
  });

  it('indicatorMatchesFilter: bidi marks never leak into comparisons', () => {
    const r = SNAPSHOT.readings[0]!;
    expect(indicatorMatchesFilter(r, { status: 'all', query: '\u200Fgap' }, nameOfEn)).toBe(true);
    expect(indicatorMatchesFilter(r, { status: 'all', query: 'gap\u200E' }, nameOfEn)).toBe(true);
  });
});

describe('statusCounts (I9, R5 tier-aware)', () => {
  it('counts All as every reading; Warning/Unusual/Normal/Context exactly', () => {
    expect(statusCounts(SNAPSHOT.readings)).toEqual({
      all: 8,
      warning: 2,
      unusual: 0,
      normal: 2,
      context: 2,
    });
  });

  it('stale/unavailable count only under All', () => {
    const counts = statusCounts(SNAPSHOT.readings);
    expect(counts.warning + counts.unusual + counts.normal + counts.context).toBe(6);
    expect(counts.all - 6).toBe(2); // dollar-basket (stale) + china-pmi (unavailable)
  });
});

describe('chart range slicing (I9)', () => {
  // 11 points, one per 365 days: epoch days 0..3650 (1970 → 1980).
  const DECADE: [number, number][] = Array.from({ length: 11 }, (_, i) => [i * 365, i]);

  it('10y keeps the whole (≤11-year) series', () => {
    expect(sliceHistoryToRange(DECADE, '10y')).toHaveLength(11);
  });

  it('5y keeps the last ~5 years of points', () => {
    const sliced = sliceHistoryToRange(DECADE, '5y');
    expect(sliced.length).toBe(6); // days 1825..3650 (slack: 1827 → day 1825 in)
    expect(sliced[0]![0]).toBe(1825);
    expect(sliced[sliced.length - 1]![0]).toBe(3650);
  });

  it('1y keeps the last two points (day 3285..3650)', () => {
    const sliced = sliceHistoryToRange(DECADE, '1y');
    expect(sliced.map((p) => p[0])).toEqual([3285, 3650]);
  });

  it('the window is anchored on the series’ last point, not today', () => {
    // A series that ended in ~2015: 1y must still show its own last year —
    // points 500d apart, so the 366d window back from 16500 keeps the last two.
    const ended: [number, number][] = [
      [16000, 1],
      [16300, 2],
      [16500, 3],
    ];
    const sliced = sliceHistoryToRange(ended, '1y');
    expect(sliced.map((p) => p[0])).toEqual([16300, 16500]);
  });

  it('a range that cannot show ≥2 points is not plottable; slice falls back to the full series', () => {
    const short: [number, number][] = [
      [0, 1],
      [300, 2],
    ]; // 300d apart — inside one 366d window anchored at 300
    expect(rangeIsPlottable(short, '1y')).toBe(true);
    const far: [number, number][] = [
      [0, 1],
      [1000, 2],
    ]; // 1000d apart: the 1y window back from 1000 holds only the last point → not plottable
    expect(rangeIsPlottable(far, '1y')).toBe(false);
    expect(sliceHistoryToRange(far, '1y')).toEqual(far); // honest fallback
  });

  it('empty series stays empty and nothing is plottable', () => {
    expect(sliceHistoryToRange([], '1y')).toEqual([]);
    expect(rangeIsPlottable([], '10y')).toBe(false);
  });
});

describe('history helpers', () => {
  it('converts epoch days to ISO dates', () => {
    expect(epochDayToIso(17081)).toBe('2016-10-07'); // matches the real us10y history start
    expect(epochDayToIso(0)).toBe('1970-01-01');
  });

  it('keeps short series whole in the sampled table', () => {
    expect(sampleHistoryRows([[0, 1], [1, 2], [2, 3]])).toHaveLength(3);
  });

  it('samples long series down to the cap while keeping first/last/min/max', () => {
    const points: [number, number][] = Array.from({ length: 500 }, (_, i) => [i, i === 250 ? -100 : i % 100]);
    const rows = sampleHistoryRows(points, 12);
    expect(rows.length).toBeLessThanOrEqual(12);
    const values = rows.map((r) => r.value);
    expect(values[0]).toBe(0); // first
    expect(values.at(-1)).toBe(99); // last point value (499 % 100)
    expect(values).toContain(-100); // min kept
    expect(rows.map((r) => r.iso)).toEqual([...rows.map((r) => r.iso)].sort());
  });
});

describe('copy dictionaries', () => {
  it('the Farsi corpus covers every indicator the English one does', () => {
    for (const id of Object.keys(insightsCopyEn.indicators) as (keyof typeof insightsCopyEn.indicators)[]) {
      expect(insightsCopyFa.indicators[id]).toBeDefined();
      expect(insightsCopyFa.indicators[id]?.name.length).toBeGreaterThan(0);
    }
    // The 2026-10-21c owner round: the eth-usd card retired; the 2026-10-23
    // OD-7 round retired nzd-usd + silver-btc — the corpus is 63; the
    // 2026-10-24 M4 Wave-1 round added the early-warning pack's eight ids
    // and the M5 Wave-2 round added five more (euro-aaa-10y, food-index,
    // wheat, maize, usdtry); the 2026-10-25 M6 Wave-3 round added the
    // leading-edge batch's twelve ids — the corpus is 88 and fa must carry
    // every one; the 2026-10-26 M7 round adds china-cpi → 89; the
    // 2026-10-26 gap-audit build adds yield-curve-10y3m (A-1),
    // rba-fed-gap (A-5), us-japan-10y-gap (A-3), gold-oil-ratio (A-4),
    // eia-crude-stocks (A-6) and cftc-gold-positioning (A-7) → 95; the
    // monthly trio oecd-cli-us/cn/de, gpr-index, epu-us (A-8/A-9/A-10) → 100;
    // the 2026-10-29 owner round adds usdaed (the UAE dirham card) → 101.
    expect(Object.keys(insightsCopyFa.indicators)).toHaveLength(101);
  });

  // Fix spec T-07 (2026-10-15): the CI-side corpus scan — the ingest's
  // live T-07 reads the same dictionaries from the repo at run time; this
  // keeps the discipline enforced on every pull request too.
  it('the copy corpus carries no forecast wording (T-07)', () => {
    const texts: string[] = [];
    const walk = (value: unknown): void => {
      if (typeof value === 'string') texts.push(value);
      else if (Array.isArray(value)) value.forEach(walk);
      else if (value !== null && typeof value === 'object') Object.values(value as Record<string, unknown>).forEach(walk);
    };
    walk(insightsCopyEn);
    walk(insightsCopyFa);
    expect(texts.length).toBeGreaterThan(1500);
    const offenders = texts.filter((text) => containsForbiddenWords(text).length > 0);
    expect(offenders, `forbidden forecast wording in: ${offenders.slice(0, 3).join(' | ')}`).toEqual([]);
  });
});

describe('pinned watchlist (I10)', () => {
  it('parses a valid stored list, keeping first-seen order', () => {
    expect(parsePinnedIds('["us10y","gold-usd","us10y"]')).toEqual(['us10y', 'gold-usd']);
  });

  it('drops unknown ids silently (indicator retired / foreign app data)', () => {
    expect(parsePinnedIds('["us10y","not-a-real-id","gold-usd"]')).toEqual(['us10y', 'gold-usd']);
  });

  it('degrades malformed storage to nothing pinned — never throws', () => {
    expect(parsePinnedIds('')).toEqual([]);
    expect(parsePinnedIds('   ')).toEqual([]);
    expect(parsePinnedIds('{"oops"')).toEqual([]);
    expect(parsePinnedIds('42')).toEqual([]);
    expect(parsePinnedIds('[1,true,null,"us10y"]')).toEqual(['us10y']);
  });

  it('round-trips through formatPinnedStorage', () => {
    const ids = ['us10y', 'au-cpi'] as const;
    expect(parsePinnedIds(formatPinnedStorage([...ids]))).toEqual([...ids]);
    expect(formatPinnedStorage([])).toBe('[]');
  });
});
