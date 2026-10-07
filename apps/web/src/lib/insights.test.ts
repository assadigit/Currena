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
  formatRuleText,
  groupCounts,
  sampleHistoryRows,
  warningZone,
} from '../components/insights/config';
import { insightsCopyEn } from '../i18n/insights-copy-en';
import { insightsCopyFa } from '../i18n/insights-copy-fa';
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
    reading({ id: 'dollar-broad', value: 121.38, change7d: 1.05, change30d: 2.86, percentile10y: 0.79, status: 'stale' }),
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

  it('scales the fraction-valued indicator into percent for display', () => {
    expect(formatIndicatorValue('govt-interest-revenue', 0.3355, 'en-US', insightsCopyEn.units)).toBe(
      '33.6%',
    );
  });

  it('prefixes currency units in English and suffixes words in Farsi', () => {
    expect(formatIndicatorValue('brent', 113.96, 'en-US', insightsCopyEn.units)).toBe('US$113.96');
    expect(formatIndicatorValue('brent', 113.96, 'fa-IR', insightsCopyFa.units)).toBe('۱۱۳٫۹۶ دلار آمریکا');
  });

  it('honours per-indicator decimals', () => {
    expect(formatIndicatorValue('audusd', 0.6982, 'en-US', insightsCopyEn.units)).toBe('0.6982');
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
    expect(formatChange(-0.11, 'points', 'fa-IR', insightsCopyFa.units)).toBe('−۰٫۱۱ نقطه');
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
      'بالاتر از ۳٪',
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

describe('bigMovers', () => {
  it('ranks by relative 30-day magnitude, mixing pct and point changes fairly', () => {
    const movers = bigMovers(SNAPSHOT.readings);
    // yield-curve: +0.07 pts on 0.48 ≈ 14.6% relative beats us10y's +0.53 on 5.31 ≈ 10%.
    expect(movers[0]?.id).toBe('yield-curve-10y2y');
    expect(movers[1]?.id).toBe('us10y');
    // Context cards never appear.
    expect(movers.some((m) => m.id === 'gold-btc')).toBe(false);
    // Stale card with change data may appear (its move is real, its vote is not).
    expect(movers.some((m) => m.id === 'dollar-broad')).toBe(true);
  });

  it('respects the limit and skips readings without change30d', () => {
    const movers = bigMovers(SNAPSHOT.readings, 2);
    expect(movers).toHaveLength(2);
    expect(movers.every((m) => Number.isFinite(m.change30d))).toBe(true);
  });
});

describe('groupCounts', () => {
  it('counts voters, warnings and excluded within one group', () => {
    // rates-credit in the fixture: yield-curve normal, us10y warning — dollar-broad is a CURRENCIES card.
    expect(groupCounts(SNAPSHOT.readings, 'global', 'rates-credit')).toEqual({
      warningCount: 1,
      votingCount: 2,
      excludedCount: 0,
    });
    // currencies: only the stale dollar-broad exists in the fixture.
    expect(groupCounts(SNAPSHOT.readings, 'global', 'currencies')).toEqual({
      warningCount: 0,
      votingCount: 0,
      excludedCount: 1,
    });
  });

  it('treats context cards as neither voters nor excluded', () => {
    // interest-inflation: rba-cash-rate context, au-cpi warning.
    expect(groupCounts(SNAPSHOT.readings, 'australia', 'interest-inflation')).toEqual({
      warningCount: 1,
      votingCount: 1,
      excludedCount: 0,
    });
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
    expect(Object.keys(insightsCopyFa.indicators)).toHaveLength(28);
  });
});
