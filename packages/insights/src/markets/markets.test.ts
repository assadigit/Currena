/**
 * markets.test.ts — the world stock markets domain (build steps 1–2,
 * insights-world-markets-spec.md §3.5, §5): provider parsers, the R1–R7
 * validation rules (including a fake 20% jump and a fake stale date), the
 * 2-point status buffer, the US override, the same-date stability rule,
 * the retry gating, and the write-only-if-changed gate. Synthetic series
 * only (AGENTS.md rule 7); saved sample provider responses cover the
 * parser shapes (fixtures/markets-test/).
 */

import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { MarketEntry, MarketId, MarketsSnapshot } from '@currena/core';
import { MarketEntrySchema, MarketsSnapshotSchema } from '@currena/core';
import { parseEodhdEodResponse, parseYahooChartResponse, parseYahooQuoteMeta, ProviderError } from './providers';
import { fetchEodhdSeries, fetchYahooSeries } from './providers';
import type { MarketSeries } from './providers';
import {
  buildEntry,
  buildMarketsSnapshot,
  marketOpenAt,
  marketsContentEqual,
  marketsContentHash,
  reStaleMarketsSnapshot,
  resolveMarket,
  statusOf,
  summarizeMarkets,
  trendOf,
  weeklySeries,
} from './compute';
import type { MarketResolution } from './compute';
import { addDays, epochDay, pointAtOrBefore } from '../series';
import { lastExpectedCloseDate, marketsNeedingData, retryRunOptions, runMarketsJob } from './job';
import { runMarketsUpdate } from './run';
import type { MarketJobFetchers } from './job';
import { InMemoryMarketsStore, RestMarketsStore, parseStoredMarkets } from './store';
import { decodeWeeklySeries, MIN_CLOSES, MARKET_IDS } from './definitions';

/* ------------------------------------------------------------------ *
 * Synthetic series helpers
 * ------------------------------------------------------------------ */

const FIXTURES = new URL('./../../fixtures/markets-test/', import.meta.url);

/** Deterministic daily series: `days` trading days ending at `endDate`. */
function series(
  id: MarketId,
  source: 'eodhd' | 'yahoo',
  endDate: string,
  days: number,
  gen: (i: number) => number = (i) => 100 + i * 0.1,
): MarketSeries {
  const points: { date: string; value: number }[] = [];
  let d = new Date(`${endDate}T00:00:00Z`).getTime();
  let made = 0;
  while (made < days) {
    const date = new Date(d).toISOString().slice(0, 10);
    const dow = new Date(d).getUTCDay();
    if (dow !== 0 && dow !== 6) {
      points.push({ date, value: gen(made) });
      made++;
    }
    d -= 86_400_000;
  }
  points.reverse();
  return { id, source, points };
}

/** A stored row shaped for snapshot inputs (only the fields the code reads). */
function storedEntry(id: MarketId, fields: Partial<MarketEntry> = {}): MarketEntry {
  const weekly = weeklySeries(series(id, 'eodhd', fields.asOf ?? '2026-10-09', 300).points);
  return {
    id,
    asOf: '2026-10-09',
    close: 100,
    chg1d: 0.5,
    chg3m: 1.5,
    high52w: 120,
    low52w: 90,
    fromHigh: -16.7,
    rangePos: 33,
    trend: 'flat',
    status: 'correction',
    source: 'eodhd',
    stale: false,
    weekly,
    ...fields,
  } as MarketEntry;
}

function fakeSnapshot(markets: readonly MarketEntry[], generatedAt = '2026-10-10T23:31:00Z'): MarketsSnapshot {
  return {
    v: 1,
    generatedAt,
    markets: [...markets],
    summary: summarizeMarkets(markets),
  };
}

const RUN_DATE = '2026-10-12';

/* ------------------------------------------------------------------ *
 * Providers — parsers over saved sample responses
 * ------------------------------------------------------------------ */

describe('parseEodhdEodResponse', () => {
  it('parses the saved sample, tolerating the free-plan warning row', () => {
    const json = JSON.parse(readFileSync(new URL('eodhd-sample.json', FIXTURES), 'utf8'));
    const points = parseEodhdEodResponse(json, 'sp500');
    expect(points.length).toBeGreaterThan(0);
    expect(points.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.date))).toBe(true);
    expect(points.every((p) => p.value > 0)).toBe(true);
    for (let i = 1; i < points.length; i++) expect(points[i]!.date > points[i - 1]!.date).toBe(true);
  });

  it('drops rows without a positive finite close (R1)', () => {
    const points = parseEodhdEodResponse(
      [
        { date: '2026-10-08', close: 100 },
        { date: '2026-10-09', close: 0 },
        { date: '2026-10-10', close: null },
        { date: '2026-10-11', close: -5 },
        { date: '2026-10-12', close: 101, warning: 'Data is limited by one year as you have free subscription' },
      ],
      'sp500',
    );
    expect(points.map((p) => p.date)).toEqual(['2026-10-08', '2026-10-12']);
  });

  it('rejects an empty array (the FTSE case) and non-array answers', () => {
    expect(() => parseEodhdEodResponse([], 'ftse')).toThrow(ProviderError);
    expect(() => parseEodhdEodResponse({ error: 'x' }, 'ftse')).toThrow(ProviderError);
    expect(() => parseEodhdEodResponse([{ date: '2026-10-08', close: 0 }], 'ftse')).toThrow(ProviderError);
  });
});

describe('parseYahooChartResponse', () => {
  it('parses the saved sample, dropping null closes (R1)', () => {
    const json = JSON.parse(readFileSync(new URL('yahoo-sample.json', FIXTURES), 'utf8'));
    const points = parseYahooChartResponse(json, 'ftse');
    expect(points.length).toBeGreaterThan(0);
    expect(points.every((p) => p.value > 0)).toBe(true);
    for (let i = 1; i < points.length; i++) expect(points[i]!.date >= points[i - 1]!.date).toBe(true);
  });

  it('falls back to quote.close when adjclose is absent', () => {
    const json = {
      chart: {
        result: [
          {
            timestamp: [1791552600, 1791639000],
            indicators: { quote: [{ close: [7800.5, 7811.54] }] },
          },
        ],
      },
    };
    const points = parseYahooChartResponse(json, 'sp500');
    expect(points.map((p) => p.value)).toEqual([7800.5, 7811.54]);
    expect(points[1]!.date).toBe('2026-10-10'); // UTC rendering of the epoch seconds (+1 day)
  });

  it('rejects missing/empty answers loudly', () => {
    expect(() => parseYahooChartResponse({}, 'ftse')).toThrow(ProviderError);
    expect(() => parseYahooChartResponse({ chart: { result: [] } }, 'ftse')).toThrow(ProviderError);
    expect(() =>
      parseYahooChartResponse({ chart: { result: [{ timestamp: [], indicators: {} }] } }, 'ftse'),
    ).toThrow(ProviderError);
  });
});

/* ------------------------------------------------------------------ *
 * Providers — fetch halves with injected fetch (URL shape, errors)
 * ------------------------------------------------------------------ */

describe('fetchEodhdSeries / fetchYahooSeries', () => {
  const eodhdBody = JSON.stringify([
    ...Array.from({ length: 5 }, (_, i) => ({ date: `2026-10-0${i + 1}`, close: 100 + i })),
  ]);

  it('builds the spec §3.2 URLs (token and symbol encoded) and parses the answer', async () => {
    const calls: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return new Response(eodhdBody, { status: 200 });
    }) as typeof fetch;
    const s = await fetchEodhdSeries('sp500', {
      apiToken: 'abc/def+gh',
      fetchImpl,
      baseUrl: 'https://eodhd.test/api',
      from: '2025-09-08',
    });
    expect(s.source).toBe('eodhd');
    expect(calls[0]).toBe('https://eodhd.test/api/eod/GSPC.INDX?api_token=abc%2Fdef%2Bgh&fmt=json&period=d&from=2025-09-08');
    expect(s.points.length).toBe(5);
  });

  it('maps a non-OK answer to a ProviderError without leaking the token', async () => {
    const fetchImpl = (async () =>
      new Response('{"error":{"message":"limit exceeded"}}', { status: 429 })) as typeof fetch;
    await expect(
      fetchEodhdSeries('sp500', { apiToken: 'SECRET-TOKEN', fetchImpl, baseUrl: 'https://eodhd.test' }),
    ).rejects.toThrow(/429/);
    try {
      await fetchEodhdSeries('sp500', { apiToken: 'SECRET-TOKEN', fetchImpl, baseUrl: 'https://eodhd.test' });
    } catch (err) {
      expect((err as Error).message).not.toContain('SECRET-TOKEN');
    }
  });

  it('rejects markets without an EODHD code (FTSE) without any call', async () => {
    const fetchImpl = (async () => {
      throw new Error('must not be called');
    }) as typeof fetch;
    await expect(fetchEodhdSeries('ftse', { apiToken: 'k', fetchImpl })).rejects.toThrow(/no EODHD code/);
  });

  it('sends the declared honest User-Agent to Yahoo and encodes the symbol (T-25/F-09; range=2y — round 47, kept through the v3 merge: the yearly anchor needs history beyond the strict 365-day mark)', async () => {
    const calls: Array<{ url: string; headers: HeadersInit }> = [];
    const yahooBody = JSON.stringify({
      chart: { result: [{ timestamp: [1791552600], indicators: { quote: [{ close: [7811.54] }] } }] },
    });
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(input), headers: init?.headers ?? {} });
      return new Response(yahooBody, { status: 200 });
    }) as typeof fetch;
    await fetchYahooSeries('n225', { fetchImpl, baseUrl: 'https://yahoo.test/chart' });
    expect(calls[0]!.url).toBe('https://yahoo.test/chart/%5EN225?range=2y&interval=1d');
    expect(new Headers(calls[0]!.headers as HeadersInit).get('user-agent')).toMatch(/CurrenaDashboard\/1\.0/);
  });
});

/* ------------------------------------------------------------------ *
 * Derived numbers (§5.1)
 * ------------------------------------------------------------------ */

describe('trendOf', () => {
  it('is up above +1% of the 50-day average, down below −1%, flat inside', () => {
    // 60 flat points at 100, then the final point moves.
    const flat = (last: number) => series('sp500', 'eodhd', '2026-10-09', 140, () => 100).points.slice(0, 59).concat([{ date: '2026-10-09', value: last }]);
    expect(trendOf(flat(101.5))).toBe('up'); // +1.5%
    expect(trendOf(flat(100.5))).toBe('flat'); // +0.5%
    expect(trendOf(flat(99.5))).toBe('flat'); // −0.5%
    expect(trendOf(flat(98.5))).toBe('down'); // −1.5%
  });
});

describe('buildEntry — the derived numbers (round 46: the weekly/monthly lenses)', () => {
  it('derives chg1w from the last close on/before 7 calendar days earlier, chg1m from 30 — the same rolling-anchor rule as chg3m', () => {
    const s = series('sp500', 'eodhd', '2026-10-12', 300);
    const entry = buildEntry('sp500', s, undefined, RUN_DATE);
    const last = s.points[s.points.length - 1]!;
    const pctVs = (days: number): number => {
      const anchor = pointAtOrBefore(s.points, addDays(last.date, -days))!;
      return Math.round(((last.value - anchor.value) / anchor.value) * 100 * 100) / 100;
    };
    expect(entry.chg1w).not.toBeUndefined();
    expect(entry.chg1w).toBe(pctVs(7));
    expect(entry.chg1m).not.toBeUndefined();
    expect(entry.chg1m).toBe(pctVs(30));
    // The generator declines ~0.1 per trading day toward the end date, so
    // every window is negative and strictly deeper the longer it gets — a
    // window mix-up (e.g. chg1w reading the 30-day anchor) flattens the
    // ladder and fails here.
    expect(entry.chg1d).toBeGreaterThan(entry.chg1w!);
    expect(entry.chg1w!).toBeLessThan(0);
    expect(entry.chg1w!).toBeGreaterThan(entry.chg1m!);
    expect(entry.chg1m!).toBeGreaterThan(entry.chg3m);
    expect(entry.chg3m).toBe(pctVs(90));
  });
});

describe('buildEntry + yearAgoAnchor — the yearly lens (round 47)', () => {
  it('strict anchor: history beyond a year reads the close on/before 365 days back, rounding to 2 decimals like every lens', () => {
    const s = series('sp500', 'eodhd', '2026-10-12', 300); // ~420 calendar days
    const entry = buildEntry('sp500', s, undefined, RUN_DATE);
    const last = s.points[s.points.length - 1]!;
    const anchor = pointAtOrBefore(s.points, addDays(last.date, -365))!;
    expect(anchor).toBeDefined();
    expect(entry.chg1y).not.toBeUndefined();
    expect(entry.chg1y).toBe(Math.round(((last.value - anchor.value) / anchor.value) * 100 * 100) / 100);
    // The ladder keeps descending with the window: the yearly reading is
    // deeper than the quarterly one on the declining fixture.
    expect(entry.chg1y!).toBeLessThan(entry.chg3m);
  });

  it('one-year provider window: the series\' first close inside the ±15-day band IS the year-ago anchor (the yoyPctSeries convention)', () => {
    // 260 trading days ≈ 364 calendar days — both free providers cut
    // history at ~one year, so the strict 365-day target lands one or two
    // days BEFORE the series starts; the first close sits inside the
    // tolerance band and is the anchor.
    const s = series('sp500', 'eodhd', '2026-10-12', 260);
    const last = s.points[s.points.length - 1]!;
    const earliest = s.points[0]!;
    expect(pointAtOrBefore(s.points, addDays(last.date, -365))).toBeUndefined(); // strict anchor absent
    const distance = epochDay(earliest.date) - (epochDay(last.date) - 365);
    expect(distance).toBeGreaterThanOrEqual(-15);
    expect(distance).toBeLessThanOrEqual(15); // inside the band
    const entry = buildEntry('sp500', s, undefined, RUN_DATE);
    expect(entry.chg1y).not.toBeUndefined();
    expect(entry.chg1y).toBe(Math.round(((last.value - earliest.value) / earliest.value) * 100 * 100) / 100);
  });

  it('a window starting closer than 350 days to the last close omits chg1y — the honest dash, never a guess', () => {
    const s = series('sp500', 'eodhd', '2026-10-12', 240); // ~336 calendar days
    const last = s.points[s.points.length - 1]!;
    const earliest = s.points[0]!;
    expect(epochDay(earliest.date) - (epochDay(last.date) - 365)).toBeGreaterThan(15); // outside the band
    const entry = buildEntry('sp500', s, undefined, RUN_DATE);
    expect(entry.chg1y).toBeUndefined();
    // The rest of the row stays intact — only the yearly lens is absent.
    expect(entry.chg3m).toBeDefined();
    expect(entry.chg1d).toBeDefined();
  });
});

describe('statusOf — the 2-point exit buffer (§5.2)', () => {
  it('enters a harsher band immediately', () => {
    expect(statusOf(-9.9, undefined)).toBe('normal');
    expect(statusOf(-10, undefined)).toBe('correction');
    expect(statusOf(-19.9, 'correction')).toBe('correction');
    expect(statusOf(-20, 'correction')).toBe('bear');
    expect(statusOf(-25, undefined)).toBe('bear');
  });
  it('softens only above the line plus the buffer', () => {
    expect(statusOf(-18, 'bear')).toBe('bear'); // −18 is AT the exit line → held
    expect(statusOf(-17.9, 'bear')).toBe('correction'); // above −18 → correction (still ≤ −10)
    expect(statusOf(-8, 'correction')).toBe('correction'); // −8 at the line → held
    expect(statusOf(-7.9, 'correction')).toBe('normal');
    expect(statusOf(-5, 'normal')).toBe('normal');
  });
  it('deepening from normal through correction needs the full line', () => {
    expect(statusOf(-19, 'normal')).toBe('correction'); // not yet −20
    expect(statusOf(-20.1, 'normal')).toBe('bear');
  });
});

describe('weeklySeries — delta encoding', () => {
  it('keeps the LAST close of each calendar week, ≤52 points, decodes back to real dates', () => {
    // Two weeks: Mon–Fri then Mon–Wed (dates chosen as real weekdays).
    const pts = series('dax', 'eodhd', '2026-10-09', 140).points;
    const weekly = weeklySeries(pts);
    expect(weekly.length).toBeLessThanOrEqual(52);
    const decoded = decodeWeeklySeries(weekly);
    // Ascending decoded days, each mapping to a real source close (rounded).
    const byDay = new Map(
      pts.map((p) => [Math.round(Date.parse(`${p.date}T00:00:00Z`) / 86_400_000), Math.round(p.value)]),
    );
    for (const [day, value] of decoded) {
      expect(byDay.get(day)).toBe(value);
    }
    for (let i = 1; i < decoded.length; i++) expect(decoded[i]![0]).toBeGreaterThan(decoded[i - 1]![0]);
    // Consecutive calendar weeks are 7 days apart; a gap week carries a larger delta.
    const deltas = weekly.slice(1).map((p) => p[0]);
    expect(deltas.every((d) => d >= 7 && d % 7 === 0)).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * resolveMarket — R2, same-date stability, R3, R5 (§3.5)
 * ------------------------------------------------------------------ */

describe('resolveMarket — validation rules', () => {
  it('R2: a series older than the stored date is rejected', () => {
    const prev = storedEntry('sp500', { asOf: '2026-10-09' });
    const old = series('sp500', 'eodhd', '2026-10-08', 60);
    const r = resolveMarket({ id: 'sp500', primary: old }, prev, RUN_DATE);
    expect(r.held).toBe(true);
    expect(r.notes.join(' ')).toMatch(/R2/);
  });

  it('same-date stability: an agreeing re-fetch keeps the stored row (no write churn)', () => {
    const prev = storedEntry('sp500', { asOf: '2026-10-09', close: 100 });
    const fresh = { ...series('sp500', 'eodhd', '2026-10-09', 140), points: series('sp500', 'eodhd', '2026-10-09', 140).points.slice(0, -1).concat([{ date: '2026-10-09', value: 100.2 }]) };
    const r = resolveMarket({ id: 'sp500', primary: fresh }, prev, RUN_DATE);
    expect(r.held).toBe(true); // 0.2% apart → the same data
  });

  it('same-date revision beyond 0.5% is accepted (a genuine provider revision)', () => {
    const prev = storedEntry('sp500', { asOf: '2026-10-09', close: 100 });
    const base = series('sp500', 'eodhd', '2026-10-09', 140);
    const revised = { ...base, points: base.points.slice(0, -1).concat([{ date: '2026-10-09', value: 103 }]) };
    const r = resolveMarket({ id: 'sp500', primary: revised }, prev, RUN_DATE);
    expect(r.held).toBe(false);
    expect(r.entry?.close).toBe(103);
  });

  it('R3: a fake 20% jump is held when the second provider disagrees', () => {
    const prev = storedEntry('sp500', { asOf: '2026-10-08' });
    // 59 calm days at 100, then 120 — a +20% "move".
    const jump = { ...series('sp500', 'eodhd', '2026-10-09', 140), points: series('sp500', 'eodhd', '2026-10-08', 139).points.concat([{ date: '2026-10-09', value: 120 }]) };
    const calm = series('sp500', 'yahoo', '2026-10-09', 140); // says 100.x
    const r = resolveMarket({ id: 'sp500', primary: jump, secondary: calm }, prev, RUN_DATE);
    expect(r.held).toBe(true);
    expect(r.notes.join(' ')).toMatch(/R3.*disagree/);
  });

  it('R3: a real 20% fall is accepted when both providers agree (a genuine crash)', () => {
    const prev = storedEntry('sp500', { asOf: '2026-10-08' });
    const falling = (src: 'eodhd' | 'yahoo') => ({
      ...series('sp500', src, '2026-10-08', 139),
      points: series('sp500', src, '2026-10-08', 139).points.concat([{ date: '2026-10-09', value: 80 }]),
    });
    const r = resolveMarket({ id: 'sp500', primary: falling('eodhd'), secondary: falling('yahoo') }, prev, RUN_DATE);
    expect(r.held).toBe(false);
    expect(r.entry?.close).toBe(80);
    expect(r.entry?.chg1d).toBeLessThan(-19);
  });

  it('R3: a suspicious move without any second voice is held', () => {
    const prev = storedEntry('sp500', { asOf: '2026-10-08' });
    const jump = {
      ...series('sp500', 'eodhd', '2026-10-09', 140),
      points: series('sp500', 'eodhd', '2026-10-08', 139).points.concat([{ date: '2026-10-09', value: 130 }]),
    };
    const r = resolveMarket({ id: 'sp500', primary: jump }, prev, RUN_DATE);
    expect(r.held).toBe(true);
  });

  it('R5: disagreement between providers is logged as a note while the winner serves', () => {
    const prev = storedEntry('sp500', { asOf: '2026-10-08' });
    const a = series('sp500', 'eodhd', '2026-10-09', 140);
    const b = { ...series('sp500', 'yahoo', '2026-10-09', 140), points: series('sp500', 'yahoo', '2026-10-09', 140).points.slice(0, -1).concat([{ date: '2026-10-09', value: 95 }]) };
    const r = resolveMarket({ id: 'sp500', primary: a, secondary: b }, prev, RUN_DATE);
    expect(r.held).toBe(false);
    expect(r.notes.join(' ')).toMatch(/R5/);
  });

  it('R6: a last close older than 5 calendar days is marked stale', () => {
    const r = resolveMarket({ id: 'sp500', primary: series('sp500', 'eodhd', '2026-10-02', 140) }, undefined, RUN_DATE);
    expect(r.entry?.stale).toBe(true); // 10 days old
    const fresh = resolveMarket({ id: 'sp500', primary: series('sp500', 'eodhd', '2026-10-09', 140) }, undefined, RUN_DATE);
    expect(fresh.entry?.stale).toBe(false);
  });

  it('R7: a first-ever suspicious move is accepted with a note (nothing to hold)', () => {
    const jump = {
      ...series('sp500', 'eodhd', '2026-10-09', 140),
      points: series('sp500', 'eodhd', '2026-10-08', 139).points.concat([{ date: '2026-10-09', value: 125 }]),
    };
    const r = resolveMarket({ id: 'sp500', primary: jump }, undefined, RUN_DATE);
    expect(r.held).toBe(false);
    expect(r.notes.join(' ')).toMatch(/first-ever/);
  });
});

/* ------------------------------------------------------------------ *
 * Snapshot assembly + the section signal (§5.3)
 * ------------------------------------------------------------------ */

describe('summarizeMarkets — the signal thresholds', () => {
  const row = (id: MarketId, status: MarketEntry['status']): MarketEntry =>
    storedEntry(id, { status, fromHigh: status === 'bear' ? -25 : status === 'correction' ? -12 : -3 });

  it('Normal: n ≤ 3 and no US correction', () => {
    const s = summarizeMarkets([row('hsi', 'correction'), row('ssec', 'correction'), row('ibov', 'bear'), row('dax', 'normal')]);
    expect(s.signal).toBe('normal');
    expect(s.worstGroup).toBe('asia'); // hsi+ssec
    expect(s.nAttention).toBe(2);
    expect(s.nUnusual).toBe(1);
  });

  it('Needs attention: n reaches 4', () => {
    const s = summarizeMarkets([
      row('hsi', 'correction'), row('ssec', 'correction'), row('ibov', 'bear'), row('dax', 'correction'), row('ftse', 'normal'),
    ]);
    expect(s.signal).toBe('attention');
  });

  it('Needs attention: the US override (S&P 500 alone in correction)', () => {
    const s = summarizeMarkets([row('sp500', 'correction'), row('dax', 'normal'), row('n225', 'normal')]);
    expect(s.signal).toBe('attention');
  });

  it('Needs attention: the US override (Nasdaq 100 alone in correction)', () => {
    const s = summarizeMarkets([row('ndx', 'correction'), row('dax', 'normal'), row('n225', 'normal')]);
    expect(s.signal).toBe('attention');
  });

  it('Unusual: n ≥ 8', () => {
    const ids = MARKET_IDS.slice(0, 8);
    const s = summarizeMarkets(ids.map((id) => row(id, 'correction')));
    expect(s.signal).toBe('unusual');
  });

  it('Unusual: the US override (S&P 500 in bear)', () => {
    const s = summarizeMarkets([row('sp500', 'bear'), row('dax', 'normal'), row('n225', 'normal')]);
    expect(s.signal).toBe('unusual');
  });

  it('worstGroup is null when every market is normal', () => {
    const s = summarizeMarkets([row('dax', 'normal'), row('n225', 'normal')]);
    expect(s.worstGroup).toBeNull();
  });
});

describe('buildMarketsSnapshot — merge + R7', () => {
  it('keeps a failed/held market row verbatim, only re-evaluating staleness', () => {
    const prev = fakeSnapshot([
      storedEntry('sp500', { asOf: '2026-10-09', stale: false }),
      storedEntry('n225', { asOf: '2026-09-28', stale: false }), // 14 days old at RUN_DATE
    ]);
    const ok: MarketResolution = {
      id: 'sp500',
      held: false,
      notes: [],
      entry: storedEntry('sp500', { asOf: '2026-10-09', close: 100 }),
    };
    const failed: MarketResolution = { id: 'n225', held: true, notes: ['both providers failed — row held (R7)'] };
    const snap = buildMarketsSnapshot({ resolutions: [ok, failed], prev, runDate: RUN_DATE, generatedAt: '2026-10-12T23:31:00Z' });
    expect(snap).toBeDefined();
    const n225 = snap!.markets.find((m) => m.id === 'n225')!;
    expect(n225.asOf).toBe('2026-09-28');
    expect(n225.stale).toBe(true); // honestly re-flagged
    expect(snap!.markets.find((m) => m.id === 'sp500')!.close).toBe(100);
    expect(snap!.summary.count).toBe(2);
  });

  it('omits a market that never produced data (never zero, never fabricated); an all-failure first run stores nothing at all', () => {
    const snap = buildMarketsSnapshot({ resolutions: [], prev: undefined, runDate: RUN_DATE, generatedAt: '2026-10-12T23:31:00Z' });
    expect(snap).toBeUndefined(); // nothing honest to store — no KV write
  });

  it('validates against the wire schema (poisoned shapes never survive)', () => {
    const good = buildMarketsSnapshot({
      resolutions: [{ id: 'dax', held: false, notes: [], entry: storedEntry('dax') }],
      prev: undefined,
      runDate: RUN_DATE,
      generatedAt: '2026-10-12T23:31:00Z',
    });
    expect(good).toBeDefined();
    expect(good!.v).toBe(1);
    expect(good!.markets.length).toBe(1);
  });
});

/* ------------------------------------------------------------------ *
 * Write-only-if-changed (§4 rule 2)
 * ------------------------------------------------------------------ */

describe('marketsContentHash / marketsContentEqual', () => {
  const base = fakeSnapshot([storedEntry('dax')]);

  it('ignores generatedAt — identical content hashes identically', () => {
    const a = fakeSnapshot([storedEntry('dax')], '2026-10-10T23:31:00Z');
    const b = fakeSnapshot([storedEntry('dax')], '2026-10-11T01:31:00Z');
    expect(marketsContentHash(a)).toBe(marketsContentHash(b));
    expect(marketsContentEqual(a, b)).toBe(true);
  });

  it('changes when a value changes', () => {
    const a = fakeSnapshot([storedEntry('dax', { close: 100 })]);
    const b = fakeSnapshot([storedEntry('dax', { close: 101 })]);
    expect(marketsContentEqual(a, b)).toBe(false);
  });

  it('undefined stored is never equal (the first run always writes)', () => {
    expect(marketsContentEqual(undefined, base)).toBe(false);
  });
});

describe('reStaleMarketsSnapshot — serve-time staleness (audit A-8)', () => {
  it('a stored stale:false row with asOf STALE_DAYS+1 old flips to stale:true; the fresh row is untouched', () => {
    const snap = fakeSnapshot([
      storedEntry('dax'),                                    // asOf 2026-10-09, stale:false
      storedEntry('sp500', { asOf: '2026-10-12' }),          // fresh vs 2026-10-15
    ]);
    // Today = 2026-10-15: dax is 6 days old (STALE_DAYS 5 + 1) → flips.
    const served = reStaleMarketsSnapshot(snap, '2026-10-15');
    const dax = served.markets.find((m) => m.id === 'dax')!;
    const sp500 = served.markets.find((m) => m.id === 'sp500')!;
    expect(dax.stale).toBe(true);
    expect(dax.asOf).toBe('2026-10-09'); // the row itself stays honest
    expect(sp500.stale).toBe(false);
    // The fresh row is the SAME object; only the aged row is rebuilt.
    expect(served.markets.find((m) => m.id === 'sp500')).toBe(snap.markets.find((m) => m.id === 'sp500'));
  });

  it('a snapshot with no flips comes back as the same object (byte-identical)', () => {
    const snap = fakeSnapshot([storedEntry('dax')]);
    expect(reStaleMarketsSnapshot(snap, '2026-10-10')).toBe(snap); // 1 day old — fresh
    expect(reStaleMarketsSnapshot(snap, '2026-10-14')).toBe(snap); // 5 days = the boundary, not yet stale
  });

  it('a row already stored stale:true never un-flips while asOf ages', () => {
    const snap = fakeSnapshot([storedEntry('dax', { stale: true })]);
    const served = reStaleMarketsSnapshot(snap, '2026-10-15');
    expect(served.markets.find((m) => m.id === 'dax')!.stale).toBe(true);
    expect(served).toBe(snap); // no change → same object
  });
});

describe('InMemoryMarketsStore — write gate (build step 3)', () => {
  it('running the job twice with the same data causes exactly one write', async () => {
    const store = new InMemoryMarketsStore();
    const snap = fakeSnapshot([storedEntry('dax')]);
    // A-6: the caller passes its own start-of-run read (undefined = nothing
    // stored) — the gate compares against it instead of re-reading.
    expect(await store.putMarketsIfChanged(snap, undefined)).toBe('written');
    const sameData = fakeSnapshot([storedEntry('dax')], '2026-10-11T01:31:00Z'); // new timestamp, same content
    const prev = await store.getMarkets();
    expect(await store.putMarketsIfChanged(sameData, prev)).toBe('unchanged');
    expect(await store.putMarketsIfChanged(sameData, prev)).toBe('unchanged');
    expect(store.ops.writes).toBe(1);
    await expect(store.getMarkets()).resolves.toMatchObject({ v: 1 });
  });
});

/* ------------------------------------------------------------------ *
 * Retry gating + the job chain (§3.4)
 * ------------------------------------------------------------------ */

describe('lastExpectedCloseDate / marketsNeedingData / retryRunOptions', () => {
  it('walks back to the most recent weekday strictly before today', () => {
    expect(lastExpectedCloseDate('2026-10-13')).toBe('2026-10-12'); // Tue → Mon
    expect(lastExpectedCloseDate('2026-10-17')).toBe('2026-10-16'); // Sat → Fri
    expect(lastExpectedCloseDate('2026-10-12')).toBe('2026-10-09'); // Mon → Fri
  });

  it('marks markets whose stored asOf is behind the expected close', () => {
    const prev = fakeSnapshot([
      storedEntry('sp500', { asOf: '2026-10-12' }), // fresh
      storedEntry('n225', { asOf: '2026-10-09' }), // behind Monday
      storedEntry('hsi', { asOf: '2026-10-12', stale: true }), // stale → re-fetch
    ]);
    const ids = marketsNeedingData(prev, '2026-10-13');
    expect(ids).toContain('n225');
    expect(ids).toContain('hsi');
    expect(ids).not.toContain('sp500');
  });

  it('includes markets with no stored row at all', () => {
    const prev = fakeSnapshot([storedEntry('dax', { asOf: '2026-10-12' })]);
    const ids = marketsNeedingData(prev, '2026-10-13');
    expect(ids).toContain('sp500'); // absent → needs data
    expect(ids).not.toContain('dax');
  });

  it('the whole snapshot old → yahoo-first (quota guard); a few → eodhd-first', () => {
    const allOld = fakeSnapshot(MARKET_IDS.map((id) => storedEntry(id, { asOf: '2026-10-09' })));
    expect(retryRunOptions(allOld, '2026-10-13').providerOrder).toBe('yahoo-first');
    const oneOld = fakeSnapshot([
      ...MARKET_IDS.slice(1).map((id) => storedEntry(id, { asOf: '2026-10-12' })),
      storedEntry(MARKET_IDS[0]!, { asOf: '2026-10-09' }),
    ]);
    expect(retryRunOptions(oneOld, '2026-10-13').providerOrder).toBe('eodhd-first');
  });

  it('no stored snapshot → the first run covers everything', () => {
    expect(retryRunOptions(undefined, '2026-10-13').onlyIds?.length).toBe(16);
  });
});

describe('runMarketsJob — the §3.4 chain with injected fetchers', () => {
  const good = (id: MarketId): MarketSeries => series(id, 'eodhd', '2026-10-12', MIN_CLOSES + 5);
  const goodYahoo = (id: MarketId): MarketSeries => series(id, 'yahoo', '2026-10-12', MIN_CLOSES + 5);

  it('happy path: one EODHD call per market, no Yahoo calls', async () => {
    const fetchers: MarketJobFetchers = {
      fetchEodhd: async (id) => good(id),
      fetchYahoo: async (id) => {
        throw new Error(`yahoo must not be called for ${id}`);
      },
    };
    const res = await runMarketsJob(fetchers, { kind: 'main', providerOrder: 'eodhd-first' }, undefined, RUN_DATE);
    expect(res.providerCalls.eodhd).toBe(16);
    expect(res.providerCalls.yahoo).toBe(0);
    expect(res.resolutions.every((r) => !r.held)).toBe(true);
  });

  it('fallback: EODHD failing for one market is served by Yahoo (R4 too)', async () => {
    const short = series('ftse', 'eodhd', '2026-10-12', 50); // under MIN_CLOSES → R4 rejection
    const fetchers: MarketJobFetchers = {
      fetchEodhd: async (id) => (id === 'ftse' ? short : good(id)),
      fetchYahoo: async (id) => goodYahoo(id),
    };
    const res = await runMarketsJob(fetchers, { kind: 'main', providerOrder: 'eodhd-first' }, undefined, RUN_DATE);
    const ftse = res.reports.find((r) => r.id === 'ftse')!;
    expect(ftse.usedSource).toBe('yahoo');
    expect(ftse.called).toEqual(['eodhd', 'yahoo']);
    expect(res.providerCalls.eodhd).toBe(16);
    expect(res.providerCalls.yahoo).toBe(1);
  });

  it('total failure keeps the market held with honest notes (R7)', async () => {
    const fetchers: MarketJobFetchers = {
      fetchEodhd: async () => {
        throw new ProviderError('eodhd', 'sp500', 'HTTP 429: limit');
      },
      fetchYahoo: async () => {
        throw new ProviderError('yahoo', 'sp500', 'HTTP 999');
      },
    };
    const prev = fakeSnapshot([storedEntry('sp500', { asOf: '2026-10-09' })]);
    const res = await runMarketsJob(fetchers, { kind: 'retry', providerOrder: 'eodhd-first', onlyIds: ['sp500'] }, prev, RUN_DATE);
    const r = res.reports[0]!;
    expect(r.usedSource).toBe('none');
    expect(r.held).toBe(true);
    expect(r.notes.join(' ')).toMatch(/both providers failed/);
  });

  it('a suspicious day move pulls the second provider in (R3 cross-check)', async () => {
    const calm = series('sp500', 'eodhd', '2026-10-09', MIN_CLOSES);
    const jumping = {
      ...calm,
      points: calm.points.slice(0, -1).concat([{ date: '2026-10-12', value: calm.points[calm.points.length - 1]!.value * 1.2 }]),
    };
    let yahooCalls = 0;
    const fetchers: MarketJobFetchers = {
      fetchEodhd: async () => jumping,
      fetchYahoo: async (id) => {
        yahooCalls++;
        return { ...goodYahoo(id), points: goodYahoo(id).points }; // disagrees (calm values)
      },
    };
    const prev = fakeSnapshot([storedEntry('sp500', { asOf: '2026-10-09', close: 100 })]);
    const res = await runMarketsJob(fetchers, { kind: 'main', providerOrder: 'eodhd-first', onlyIds: ['sp500'] }, prev, RUN_DATE);
    expect(yahooCalls).toBe(1);
    expect(res.reports[0]!.held).toBe(true); // disagreement → held
  });

  it('onlyIds restricts the run (the retry shape)', async () => {
    let eodhdCalls = 0;
    const fetchers: MarketJobFetchers = {
      fetchEodhd: async (id) => {
        eodhdCalls++;
        return good(id);
      },
      fetchYahoo: async (id) => goodYahoo(id),
    };
    const res = await runMarketsJob(fetchers, { kind: 'retry', providerOrder: 'eodhd-first', onlyIds: ['n225', 'hsi'] }, undefined, RUN_DATE);
    expect(eodhdCalls).toBe(2);
    expect(res.resolutions.map((r) => r.id).sort()).toEqual(['hsi', 'n225']);
  });
});

/* ------------------------------------------------------------------ *
 * RestMarketsStore + parseStoredMarkets (QA audit C-5 — the manual-
 * runner REST twin had zero tests; the 429/10048 daily-cap ladder is
 * the documented recovery path).
 * ------------------------------------------------------------------ */

describe('RestMarketsStore — daily-cap retry + read failures (audit C-5)', () => {
  it('a 429/10048 write retries the ladder then succeeds', async () => {
    const snap = buildMarketsSnapshot({
      resolutions: [{ id: 'dax', held: false, notes: [], entry: storedEntry('dax') }],
      prev: undefined,
      runDate: RUN_DATE,
      generatedAt: '2026-10-12T23:31:00Z',
    });
    expect(snap).toBeDefined();
    let putAttempts = 0;
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      if (init?.method === 'PUT') {
        putAttempts++;
        if (putAttempts === 1) {
          return new Response('{"errors":[{"code":10048,"message":"free usage limit"}]}', { status: 429 });
        }
        return new Response('{"success":true}', { status: 200 });
      }
      return new Response('404 not found', { status: 404 }); // GET: key absent
    });
    const store = new RestMarketsStore({ apiToken: 'tok', accountId: 'acc', namespaceId: 'ns', fetchImpl, retryDelaysMs: [1] });
    await store.putMarketsIfChanged(snap!, undefined);
    expect(putAttempts).toBe(2);
    expect(store.ops.retriedWrites).toBe(1);
  });

  it('a non-cap PUT failure never retries; a non-404 GET failure throws loudly', async () => {
    const snap = buildMarketsSnapshot({
      resolutions: [{ id: 'dax', held: false, notes: [], entry: storedEntry('dax') }],
      prev: undefined,
      runDate: RUN_DATE,
      generatedAt: '2026-10-12T23:31:00Z',
    });
    const denied = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      if (init?.method === 'PUT') {
        return new Response('{"errors":[{"code":10000}]}', { status: 403 });
      }
      return new Response('404', { status: 404 });
    });
    const storeA = new RestMarketsStore({ apiToken: 'tok', accountId: 'acc', namespaceId: 'ns', fetchImpl: denied, retryDelaysMs: [1] });
    await expect(storeA.putMarketsIfChanged(snap!, undefined)).rejects.toThrow(/HTTP 403/);
    expect(storeA.ops.writes).toBe(1);

    const broken = vi.fn(async () => new Response('boom', { status: 500 }));
    const storeB = new RestMarketsStore({ apiToken: 'tok', accountId: 'acc', namespaceId: 'ns', fetchImpl: broken });
    await expect(storeB.getMarkets()).rejects.toThrow(/HTTP 500/);
  });
});

describe('parseStoredMarkets — poisoned-entry defense (audit C-5)', () => {
  it('round-trips a valid snapshot through the stored-string boundary', async () => {
    const snap = buildMarketsSnapshot({
      resolutions: [{ id: 'dax', held: false, notes: [], entry: storedEntry('dax') }],
      prev: undefined,
      runDate: RUN_DATE,
      generatedAt: '2026-10-12T23:31:00Z',
    });
    expect(parseStoredMarkets(JSON.stringify(snap))).toEqual(snap);
  });

  it('malformed JSON and wrong-shape values read as absent (never rendered)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseStoredMarkets('not json')).toBeUndefined();
    expect(parseStoredMarkets(JSON.stringify({ v: 1, markets: [], summary: { count: 9 } }))).toBeUndefined();
    expect(parseStoredMarkets(null)).toBeUndefined();
    expect(parseStoredMarkets(undefined)).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});

/* ------------------------------------------------------------------ *
 * World-markets MAP (docs/insights/world-markets-map-spec.md D1/D2):
 * the quote-time / market-state fields, their honest absence for EODHD,
 * and the Open/Closed derivation rules.
 * ------------------------------------------------------------------ */

describe('parseYahooQuoteMeta — MAP D2 quote freshness metadata', () => {
  it('reads regularMarketTime + marketState from the saved sample shape', async () => {
    const json = JSON.parse(readFileSync(new URL('yahoo-sample.json', FIXTURES), 'utf8'));
    const meta = parseYahooQuoteMeta(json);
    // The saved sample carries regularMarketTime but no marketState.
    expect(meta).toBeDefined();
    expect(meta!.quoteTime).toBe(new Date(1791560129 * 1000).toISOString());
    expect(meta!.marketState).toBeUndefined();
  });

  it('regularMarketTime → marketState mapping: only REGULAR is open', () => {
    const shape = (meta: Record<string, unknown>) => ({ chart: { result: [{ meta }] } });
    expect(parseYahooQuoteMeta(shape({ marketState: 'REGULAR' }))).toEqual({ marketState: 'REGULAR' });
    expect(parseYahooQuoteMeta(shape({ marketState: 'POST' }))?.marketState).toBe('POST');
    expect(parseYahooQuoteMeta(shape({ marketState: 'CLOSED' }))?.marketState).toBe('CLOSED');
    // Degraded shapes: absent, non-numeric, empty — never a throw.
    expect(parseYahooQuoteMeta({})).toBeUndefined();
    expect(parseYahooQuoteMeta(shape({}))).toBeUndefined();
    expect(parseYahooQuoteMeta(shape({ marketState: '', regularMarketTime: 'x' }))).toBeUndefined();
  });
});

describe('marketOpenAt — the D2 rules over one series', () => {
  const RUN = '2026-10-12T23:30:00Z';
  it('provider field wins: REGULAR open, every other phase closed', () => {
    expect(marketOpenAt({ quoteMeta: { marketState: 'REGULAR' } }, RUN)).toBe(true);
    expect(marketOpenAt({ quoteMeta: { marketState: 'PRE' } }, RUN)).toBe(false);
    expect(marketOpenAt({ quoteMeta: { marketState: 'POST' } }, RUN)).toBe(false);
    expect(marketOpenAt({ quoteMeta: { marketState: 'COVERED' } }, RUN)).toBe(false);
  });
  it('fallback: open only while the quote is ≤ OPEN_MAX_AGE_MIN minutes old', () => {
    const at = (minAgo: number) => ({ quoteTime: new Date(Date.parse(RUN) - minAgo * 60_000).toISOString() });
    expect(marketOpenAt({ quoteMeta: at(5) }, RUN)).toBe(true);
    expect(marketOpenAt({ quoteMeta: at(30) }, RUN)).toBe(true);
    expect(marketOpenAt({ quoteMeta: at(31) }, RUN)).toBe(false);
    expect(marketOpenAt({ quoteMeta: at(90) }, RUN)).toBe(false);
  });
  it('EODHD-style answers (no metadata at all) are honestly closed-by-absence', () => {
    expect(marketOpenAt({}, RUN)).toBeUndefined();
    expect(marketOpenAt({ quoteMeta: {} }, RUN)).toBeUndefined();
  });
});

describe('buildEntry — MAP D1/D2 fields on the stored row', () => {
  it('a Yahoo series carries quoteTime + open into the row', () => {
    const s = series('sp500', 'yahoo', '2026-10-12', 300);
    s.quoteMeta = { marketState: 'CLOSED', quoteTime: '2026-10-12T20:55:00Z' };
    const entry = buildEntry('sp500', s, undefined, RUN_DATE, '2026-10-12T23:30:00Z');
    expect(entry.quoteTime).toBe('2026-10-12T20:55:00Z');
    expect(entry.open).toBe(false);
  });
  it('a live REGULAR session caught mid-run reads open', () => {
    const s = series('asx200', 'yahoo', '2026-10-12', 300);
    s.quoteMeta = { marketState: 'REGULAR', quoteTime: '2026-10-12T23:29:00Z' };
    const entry = buildEntry('asx200', s, undefined, RUN_DATE, '2026-10-12T23:30:00Z');
    expect(entry.open).toBe(true);
  });
  it('an EODHD series omits both fields (pre-map rows stay valid)', () => {
    const s = series('dax', 'eodhd', '2026-10-12', 300);
    const entry = buildEntry('dax', s, undefined, RUN_DATE, '2026-10-12T23:30:00Z');
    expect('open' in entry).toBe(false);
    expect('quoteTime' in entry).toBe(false);
    // And the zod contract accepts the row.
    expect(() => MarketEntrySchema.parse(entry)).not.toThrow();
  });
  it('the snapshot contract round-trips the new optional fields', () => {
    const s = series('n225', 'yahoo', '2026-10-12', 300);
    s.quoteMeta = { marketState: 'REGULAR', quoteTime: '2026-10-12T23:25:00Z' };
    const snap = buildMarketsSnapshot({
      resolutions: [{ id: 'n225', held: false, notes: [], entry: buildEntry('n225', s, undefined, RUN_DATE, '2026-10-12T23:30:00Z') }],
      prev: undefined,
      runDate: RUN_DATE,
      generatedAt: '2026-10-12T23:30:00Z',
    });
    expect(snap!.markets[0]!.open).toBe(true);
    expect(MarketsSnapshotSchema.parse(snap!)).toEqual(snap);
  });
});

describe('MAP §9.7 — the map fields change ZERO KV operations', () => {
  it('one refresh run: identical store ops with and without quote metadata', async () => {
    const run = async (withMeta: boolean) => {
      const store = new InMemoryMarketsStore();
      const fetchers: MarketJobFetchers = {
        fetchEodhd: async (id) => {
          const s = series(id, 'eodhd', '2026-10-12', 300);
          return s;
        },
        fetchYahoo: async (id) => {
          const s = series(id, 'yahoo', '2026-10-12', 300);
          if (withMeta) s.quoteMeta = { marketState: 'CLOSED', quoteTime: '2026-10-12T20:00:00Z' };
          return s;
        },
      };
      await runMarketsUpdate({ store, fetchers, now: new Date('2026-10-12T23:30:00Z') }, 'main');
      return { ...store.ops };
    };
    const withoutMeta = await run(false);
    const withMeta = await run(true);
    // The SAME single read + the SAME at-most-one write — the map's fields
    // ride the existing payload, never a new key, never an extra op.
    expect(withMeta).toEqual(withoutMeta);
    expect(withoutMeta.reads).toBe(1);
    expect(withoutMeta.writes).toBeLessThanOrEqual(1);
    expect(withMeta.reads).toBe(1);
    expect(withMeta.writes).toBeLessThanOrEqual(1);
  });

  it('a Yahoo-sourced refresh writes the open/quoteTime fields into the ONE key', async () => {
    const store = new InMemoryMarketsStore();
    const fetchers: MarketJobFetchers = {
      fetchEodhd: async () => {
        throw new Error('eodhd down');
      },
      fetchYahoo: async (id) => {
        const s = series(id, 'yahoo', '2026-10-12', 300);
        s.quoteMeta = { marketState: 'REGULAR', quoteTime: '2026-10-12T23:25:00Z' };
        return s;
      },
    };
    const result = await runMarketsUpdate({ store, fetchers, now: new Date('2026-10-12T23:30:00Z') }, 'main');
    expect(result.wroteSnapshot).toBe(true);
    const asx = result.snapshot!.markets.find((m) => m.id === 'asx200')!;
    expect(asx.open).toBe(true);
    expect(asx.quoteTime).toBe('2026-10-12T23:25:00Z');
    // Still exactly one read + one write for the whole refresh.
    expect(store.ops).toEqual({ reads: 1, writes: 1 });
  });
});
