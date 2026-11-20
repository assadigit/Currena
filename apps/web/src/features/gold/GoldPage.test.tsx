/**
 * @vitest-environment jsdom
 *
 * GoldPage.characterization.test.tsx (S5, 2026-11-08) — the Gold page's
 * DOM-level characterization suite. What is pinned:
 *
 *   - the honest load state (the loading line, never a blank screen);
 *   - the hero: the live price value, the day change with its window
 *     tag, the 10-year position line, the balance verdict word, the
 *     7-state outlook and the for/against/not-leaning/unread counts —
 *     every one derived from the SAME engines (asserted against
 *     goldBalance over the same fixture, never hand-counted);
 *   - S6 (BD-S6a): the hero's balance-view ALTERNATION — the classic
 *     view (the previous brass balance shape, smaller) is the DEFAULT,
 *     the minimal glyph one radio away, the choice persisted; the
 *     classic stage renders the engine's own lane sides, weights and
 *     beam tilt through the SAME extracted drawing the legacy card
 *     renders (data-balance-*), and its words are the corpus's own;
 *   - the 37 seats: every chip renders with its lean word and, when it
 *     fires, its evidence word — the impact distribution matching the
 *     engine's own member lines;
 *   - the five lanes with their side words;
 *   - the seat home links (data-seat-home) — the placement's own table;
 *   - the context cards (13 visible + the hero), the four blocked
 *     notes, the honest-record footnote;
 *   - the fail-closed path: a dead projection renders the honest error
 *     state with the retry, never a guess;
 *   - the M-17 last-good path: a failed refresh keeps the cached copy
 *     on screen, labelled.
 *
 * House discipline (Converter.test.tsx's own): stubbed fetch per test —
 * tests NEVER hit live sites; contract-valid fixtures sanity-parsed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useEffect } from 'react';
import type { IndicatorReading, InsightsSnapshot, PageProjection } from '@currena/core';
import { PageProjectionSchema } from '@currena/core';
import { goldBalance } from '@currena/insights';
import { GOLD_VOTER_IDS } from '@currena/insights/page-division';
import { balanceTilt } from './signals/BalanceScale';
import { GoldPage } from './GoldPage';
import { GOLD_CONTEXT_IDS } from './gold-tiles';
import { clearProjectionCacheForTests } from '../../shared/lib/page-division';
import { clearHistoryCacheForTests } from '../../shared/lib/insights';
import { clearGoldXauCacheForTests } from './gold-xau';
import { snapshotStore } from '../../shared/lib/snapshot-store';
import { useI18n } from '../../shared/lib/locale';

/* GPE R17: the lane intros — the S3-D4 finals since S5 M1 (08 §5.1, the
 * GUX redesign's five-group label system; byte-identical in the corpus
 * and pd.gold, pinned by gold-copy-pin). */
const INTROS: Readonly<Record<string, string>> = {
  'borrowing-costs': 'What cash pays to hold — when interest beats inflation by a wide margin, gold has a tough rival.',
  dollar: 'Gold is priced in dollars — a stronger dollar usually makes gold more expensive everywhere else.',
  stress: 'When money is frightened, it often runs to gold; calm markets take that bid away.',
  inflation: 'Gold is bought as an inflation hedge — the hotter prices and expectations run, the stronger the case people make for it.',
  flows: 'What futures traders are doing with gold right now — very crowded bets can be fragile.',
};

/* ------------------------------------------------------------------ *
 * Fixtures — contract-valid payloads (sanity-parsed inside the tests)
 * ------------------------------------------------------------------ */

function reading(id: string, partial: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id: id as IndicatorReading['id'],
    value: 1,
    asOf: '2026-11-07',
    status: 'normal',
    sourceName: 'fixture',
    updatedAt: '2026-11-07T20:11:07.445Z',
    ...partial,
  } as IndicatorReading;
}

/** The Gold projection: all 37 voters + the 14 context homes (48 ids —
 * gold-silver and the CFTC pair serve both roles). Inputs chosen to
 * move four lanes for and one against, deterministically. */
function projectionFixture(): PageProjection {
  const readings: IndicatorReading[] = [];

  // The hero price (live-merged shape: value + changes + percentile).
  readings.push(reading('gold-usd', { value: 4072.1, change7d: 4.44, change30d: -3.42, percentile10y: 0.906 }));

  // All remaining ids — the 37 voters ∪ the 14 context homes, MERGED for
  // the dual-role ids (gold-silver + the CFTC pair are both voters and
  // context cards: one reading, both roles). The voter inputs set the
  // firing legs; the context values set the displayed numbers.
  // The firing inputs: borrowing-costs (two falling yields → supports),
  // dollar (three falling measures → supports), stress (three highs →
  // supports), inflation (three hot readings → supports), flows (two
  // crowded positioning reads → pressures, the contrarian lane).
  const inputs: Record<string, Partial<IndicatorReading>> = {
    'real-yield-10y': { change30d: -1.0 },
    us10y: { change30d: -1.0 },
    'dollar-basket': { change30d: -2.0 },
    'dollar-broad': { change30d: -2.0 },
    'dollar-eme': { change30d: -2.0 },
    'stress-stlfsi': { percentile10y: 0.9 },
    nfci: { percentile10y: 0.9 },
    vix: { percentile10y: 0.9 },
    'us-cpi-yoy': { percentile10y: 0.9 },
    'us-pce-core-yoy': { percentile10y: 0.9 },
    'euro-hicp': { percentile10y: 0.9 },
    'cftc-gold-positioning': { percentile10y: 0.9 },
    'cftc-gold-gross-long': { percentile10y: 0.9 },
  };
  const contextValues: Record<string, Partial<IndicatorReading>> = {
    'gold-silver': { value: 78.5, percentile10y: 0.366, change30d: 8.7 },
    'gold-btc': { value: 0.053727 },
    'gold-aud': { value: 5930.6095 },
    'gold-oil-ratio': { value: 41.45, percentile10y: 0.795 },
    'gold-platinum': { value: 2.64, percentile10y: 0.862 },
    'real-gold-price': { value: 1243, percentile10y: 0.931 },
    'copper-gold': { value: 3.5342265529841654, percentile10y: 0.263 },
    'gold-equities-ratio': { value: 0.5066, percentile10y: 0.587 },
    'cftc-gold-positioning': { value: 44.9804 },
    'cftc-gold-gross-long': { value: 55.2473 },
    'sge-gold-withdrawals': { value: 92.08 },
    'swiss-gold-flow': { value: 227.9, percentile10y: 0.824 },
    'shanghai-gold-premium': { value: -0.62, percentile10y: 0.439 },
  };
  const allIds = [...new Set([...GOLD_VOTER_IDS, ...GOLD_CONTEXT_IDS])];
  for (const id of allIds) {
    if (id === 'gold-usd') continue;
    readings.push(reading(id, { value: 1, ...(contextValues[id] ?? {}), ...(inputs[id] ?? { percentile10y: contextValues[id]?.percentile10y ?? 0.5 }) }));
  }

  return {
    page: 'gold',
    generatedAt: '2026-11-07T20:11:07.445Z',
    pricesAsOf: '2026-11-08T00:13:17.925Z',
    displayMode: 'public',
    readings,
    absentIds: ['wgc-etf-holdings', 'wgc-cb-demand', 'official-gold-demand', 'etf-short-interest'],
    boards: [],
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** GET /api/insights — the full snapshot the TM13 Signals section (and
 * the TM23 GoldPositions section) reads on mount. Built over the SAME
 * readings as the gold projection fixture (the signals' gold-balance
 * inputs), with the minimal contract-valid envelope (the
 * insights.test.ts SNAPSHOT pattern). Baseline-repair 2026-11-15: the
 * stub must route this feed or the ApiError escapes as an unhandled
 * rejection (vitest exits 1 despite green tests). */
function snapshotFixture(): InsightsSnapshot {
  const projection = projectionFixture();
  return {
    generatedAt: projection.generatedAt,
    pricesAsOf: projection.pricesAsOf,
    summary: {
      global: { section: 'global', label: 'cautious', warningCount: 0, votingCount: 2, excludedCount: 0 },
      australia: { section: 'australia', label: 'relaxed', warningCount: 0, votingCount: 2, excludedCount: 0 },
    },
    readings: projection.readings,
    changedThisWeek: [],
    calendar: [],
  };
}

function notFound(): Response {
  return jsonResponse({ error: { code: 'unknown_page', message: 'not found' } }, 404);
}

/** A locale probe — flips the app's locale store (module-level, no provider)
 * through the public API so a test can assert FA rendering. Every store
 * subscriber (GoldPage included) re-renders on the change. */
function LocaleProbe({ locale }: { locale: 'en' | 'fa' }): null {
  const { setLocale } = useI18n();
  useEffect(() => {
    setLocale(locale);
  }, [locale, setLocale]);
  return null;
}

/** Route the stubbed fetch by URL — the Gold projection feed + the
 * snapshot feed (TM13/TM23: GoldPage fires both on mount) + the R18 OHLC
 * leg (the chart + the TA band's shared feed). */
function stubFeeds(overrides: { projection?: () => Response; goldCb?: () => Response; goldOhlc?: () => Response } = {}): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/insights/pages/gold')) return (overrides.projection ?? (() => jsonResponse(projectionFixture())))();
      if (url === '/api/insights') return jsonResponse(snapshotFixture());
      // GPE R14: the CB tracker's one-key endpoint (the /tic twin).
      if (url === '/api/insights/gold-cb') return (overrides.goldCb ?? (() => notFound()))();
      // GPE R18: the XAUUSD OHLC leg's one-key endpoint (the chart + the
      // TA band — the module-cached shared feed).
      if (url === '/api/insights/gold-ohlc') return (overrides.goldOhlc ?? (() => jsonResponse(ohlcFixture(300))))();
      // The per-id /history payloads (the silver chart's TrendPanel — the
      // id the fetch layer's check demands; GPE R18 made silver the sole
      // /history consumer on this page).
      if (url.includes('/history')) {
        const id = url.split('/api/insights/')[1]?.split('/history')[0];
        return jsonResponse({ v: 1, id, points: historyPointsFixture() });
      }
      // GPE R13: the SHARED snapshot plane (the App-boot store the bridge
      // reads — served as the RatesResponse the endpoint returns).
      if (url.includes('/api/rates?source=tgju')) return jsonResponse({ snapshot: tgjuSnapshotFixture(), stale: false, servedFrom: 'cache' });
      if (url.includes('/api/rates?source=frankfurter')) return jsonResponse({ snapshot: frankfurterSnapshotFixture(), stale: false, servedFrom: 'cache' });
      return notFound();
    }),
  );
}

/* GPE R13: the SHARED TGJU snapshot fixture — the session's own live
 * capture of 2026-11-18 ~16:55 UTC (the coin-premium engine's frozen
 * scenario: the ounce 3,744.68 USD, the free dollar 266,330 toman, the
 * Tehran quotes; TGJU's own per-symbol marketAt stamps included). */
function tgjuSnapshotFixture(): Record<string, unknown> {
  return {
    base: 'IRR',
    source: 'tgju',
    fetchedAt: new Date().toISOString(),
    rates: [
      { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 / 266_330 },
    ],
    gold: [
      { id: 'gold-ounce', unit: 'USD', price: 3744.68, marketAt: '2026-11-18T20:25:27+03:30' },
      { id: 'gold-18k', unit: 'TOMAN', price: 24_459_600, marketAt: '2026-11-18T19:59:58+03:30' },
      { id: 'gold-24k', unit: 'TOMAN', price: 32_612_400, marketAt: '2026-11-18T19:59:58+03:30' },
      { id: 'gold-used', unit: 'TOMAN', price: 24_133_439, marketAt: '2026-11-18T19:59:58+03:30' },
      { id: 'coin-emami', unit: 'TOMAN', price: 250_740_000, marketAt: '2026-11-18T19:59:57+03:30' },
      { id: 'coin-bahar', unit: 'TOMAN', price: 240_745_000, marketAt: '2026-11-18T19:59:50+03:30' },
      { id: 'coin-half', unit: 'TOMAN', price: 132_260_000, marketAt: '2026-11-18T15:55:05+03:30' },
      { id: 'coin-quarter', unit: 'TOMAN', price: 70_920_000, marketAt: '2026-11-18T17:42:42+03:30' },
      { id: 'coin-gram', unit: 'TOMAN', price: 36_000_000, marketAt: '2026-11-18T11:07:14+03:30' },
      { id: 'gold-mesghal', unit: 'TOMAN', price: 105_954_000, marketAt: '2026-11-18T19:59:56+03:30' },
    ],
  };
}

/** The minimal valid frankfurter answer (the boot's other refresh leg). */
function frankfurterSnapshotFixture(): Record<string, unknown> {
  return {
    base: 'USD',
    source: 'frankfurter',
    fetchedAt: new Date().toISOString(),
    rates: [{ code: 'EUR', name: 'Euro', symbol: '€', rate: 0.9 }],
  };
}

/* GPE R14: the CB tracker's snapshot fixture — the session's own derived
 * numbers (the s12 record): the last rolling point 396.7 t @ 2026-10,
 * the POL/CHN/UZB cast with the IRFCL value legs for the first two. */
function cbSnapshotFixture(): Record<string, unknown> {
  // The real display shape: monthly from 2006-01 (the 20-year window),
  // the selling era negative, the 2009 wave, the 2015 catch-up peak, the
  // reported-world plateau — ending at the derived 396.7 t @ 2026-10.
  const series: Array<{ month: string; tonnes: number }> = [];
  const shape = (monthIdx: number): number => {
    const year = 2006 + Math.floor(monthIdx / 12);
    if (year <= 2007) return -450 + monthIdx * 4; // the selling era
    if (year <= 2009) return 40 + (monthIdx - 24) * 22; // the post-GFC wave
    if (year <= 2014) return 380 + 40 * Math.sin(monthIdx / 9); // elevated
    if (year === 2015) return 600 + (monthIdx - 108) * 25; // the catch-up step
    if (year <= 2018) return 850 - (monthIdx - 120) * 6; // easing
    if (year <= 2021) return 480 + 30 * Math.sin(monthIdx / 7); // re-acceleration
    if (year <= 2025) return 380 + 20 * Math.sin(monthIdx / 5); // the plateau
    return 396.735; // the derived end
  };
  for (let i = 0; i <= 249; i++) {
    const y = 2006 + Math.floor(i / 12);
    const m = (i % 12) + 1;
    series.push({ month: `${y}-${String(m).padStart(2, '0')}`, tonnes: Number(shape(i).toFixed(1)) });
  }
  series[series.length - 1] = { month: '2026-10', tonnes: 396.735 };
  return {
    v: 1,
    asOf: '2026-10',
    fetchedAt: '2026-11-01T04:30:00Z',
    series,
    buyers: [
      { code: 'POL', latestMonth: '2026-10', latestDelta: 17.107, sum12m: 159.088, tonnes: 690, holdingsMonth: '2026-10', goldUsd: 90_676_462_000, totalUsd: 295_437_566_000, valuePeriod: '2026-09' },
      { code: 'CHN', latestMonth: '2026-10', latestDelta: 25.816, sum12m: 130.946, tonnes: 2435.4, holdingsMonth: '2026-10', goldUsd: 323_517_000_000, totalUsd: 3_789_425_000_000, valuePeriod: '2026-09' },
      { code: 'UZB', latestMonth: '2026-07', latestDelta: -0.933, sum12m: 60.03, tonnes: 430.8, holdingsMonth: '2026-07' },
    ],
    reportedWorld: { tonnes: 33_070, reporters: 87, month: '2026-10' },
    sourceUrls: [
      'https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/IL/13.0.1/*.RGV_REVS.FTO.*',
      'https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/IRFCL/12.0.0/*.IRFCLDT1_IRFCL56V_FTO.*',
    ],
  };
}

/** A minimal plottable gold history ([epochDay, value] pairs, ascending). */
function historyPointsFixture(): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  for (let i = 0; i < 400; i++) {
    points.push([20000 + i * 7, 3000 + Math.sin(i / 24) * 400 + i]);
  }
  return points;
}

/* GPE R18 / F7 + R19 / F8: the XAUUSD OHLC fixture — n weekday-dated
 * final bars ending 2026-11-17 (the s13 M1 probe's honest last-bar date),
 * a two-frequency wave (a slow cycle + a fast ripple) so the SMA200
 * window, the distance decile AND at least one 50/200 cross all exist
 * at n=300. The closes anchor near the live probe's 3,792.59. */
function ohlcFixture(n: number): Record<string, unknown> {
  const series: Array<Record<string, unknown>> = [];
  const endDate = Date.parse('2026-11-17T00:00:00Z');
  // The bars, chronologically: bar i's close walks from the base minus the
  // trend (the LAST bar lands exactly on the probe's 3,792.59).
  const closes: number[] = [];
  for (let i = 0; i < n; i++) {
    const back = n - 1 - i; // bars from the end
    closes.push(3792.59 - 150 * Math.sin(back / 25) - 60 * Math.sin(back / 6.5) + back * 0.15);
  }
  let ms = endDate;
  const dates: string[] = [];
  for (let i = 0; i < n; ) {
    const weekday = new Date(ms).getUTCDay();
    if (weekday !== 6 && weekday !== 0) {
      dates.push(new Date(ms).toISOString().slice(0, 10));
      i += 1;
    }
    ms -= 86_400_000;
  }
  dates.reverse();
  for (let i = 0; i < n; i++) {
    const close = closes[i]!;
    series.push({
      date: dates[i],
      open: close - 6,
      high: close + 14,
      low: close - 17,
      close,
    });
  }
  return {
    v: 1,
    asOf: '2026-11-17',
    fetchedAt: '2026-11-18T04:35:00.000Z',
    series,
    sourceUrl: 'https://eodhd.com/api/eod/XAUUSD.FOREX',
  };
}

beforeEach(() => {
  clearProjectionCacheForTests();
  clearGoldXauCacheForTests();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ *
 * The page
 * ------------------------------------------------------------------ */

describe('GoldPage', () => {
  it('fixture sanity: the payload satisfies the projection contract', () => {
    expect(() => PageProjectionSchema.parse(projectionFixture())).not.toThrow();
  });

  it('renders the honest loading line before the projection arrives', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => (String(input) === '/api/insights' ? jsonResponse(snapshotFixture()) : notFound())),
    );
    const { container } = render(<GoldPage />);
    expect(container.textContent).toContain('Reading the gold meter');
  });

  it('renders the hero: live price + change + position + verdict + outlook + counts (the engines\' own values)', async () => {

    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-hero]')).not.toBeNull();
    });

    // S19 (2026-11-12): the wayfinding row — Home › Gold (BD-S19b).
    expect(document.querySelector('[data-page-breadcrumbs] [aria-current=\'page\']')?.textContent).toBe('Gold');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');

    // The engine's own derivations over the same fixture — never
    // hand-counted (the characterization pins the PIPE, the engine
    // provides the numbers).
    const balance = goldBalance(projectionFixture().readings);

    // The live price + its unit.
    const hero = document.querySelector('[data-gold-hero]')!;
    expect(hero.textContent).toContain('4,072');
    expect(hero.textContent).toContain('US$');
    // The day change with its VISIBLE window tag (change7d → 7d here).
    expect(hero.textContent).toContain('+4.44%');
    expect(hero.textContent).toContain('7d');
    // The 10-year position line (percentile 0.906 → top 9%).
    expect(hero.textContent).toContain('top 9%');
    // The hourly live-prices stamp.
    expect(hero.textContent).toContain('Live prices as of');

    // The balance verdict word + the outlook + the counts line.
    expect(document.querySelector('[data-hero-verdict]')?.getAttribute('data-hero-verdict')).toBe(
      balance.net > 0 ? 'for' : balance.net < 0 ? 'against' : 'balanced',
    );
    const countsText = `${balance.counts.for} for · ${balance.counts.against} against`;
    expect(hero.textContent).toContain(countsText);
    // gold's own 30-day move — the context line, never counted.
    expect(hero.textContent).toContain('Gold over the last 30 days');
    expect(hero.textContent).toContain('−3.42%');
  });

  it('GPE R11 / F1: the daily narrative — the price fact (TE pattern, C1-named) + the five families (byte-identical counts) + the standing caveat', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-narrative]')).not.toBeNull();
    });
    const band = document.querySelector('[data-gold-narrative]')!;

    // The arc item 1 — the price fact: the move + the context windows,
    // each window NAMED (C1), the series + as-of the reading's own.
    expect(band.textContent).toContain('Why gold moved');
    expect(band.textContent).toContain('Gold moved');
    expect(band.textContent).toContain('−3.42%'); // the fixture's 30-day move
    expect(band.textContent).toContain('over the past 30 days'); // the window named at point of use
    expect(band.textContent).toContain('fixture'); // the series named (the reading's own sourceName)
    expect(band.textContent).toContain('as of'); // the date-stamp
    expect(band.querySelector('a[href="#insights-signals"]')).toBeTruthy(); // the price sentence links the chart

    // The arc item 2 — the five family lines, lane order, each linking
    // its lane card (R10's anchors).
    const families = [...band.querySelectorAll('[data-narrative-family]')];
    expect(families.map((f) => f.getAttribute('data-narrative-family'))).toEqual([
      'borrowing-costs',
      'dollar',
      'stress',
      'inflation',
      'flows',
    ]);
    for (const family of families) {
      const lane = family.getAttribute('data-narrative-family')!;
      expect(family.querySelector(`a[href="#lane-${lane}"]`), `the ${lane} line links its lane card`).toBeTruthy();
    }

    // The one-projection consistency (s7/03 §2.4, binding): every family
    // line's tally is BYTE-IDENTICAL to the same-keys rendering over the
    // same lane counts. GPE R17: the seats lane cards no longer render the
    // tally (the #21 de-dup — the Signals ledger rows keep it), so the
    // comparator is the tally string the seats section ITSELF composes
    // (the same interpolate keys over the same lane model, built here —
    // the copy-pin test pins those keys to the corpus byte-for-byte).
    const balanceModel = goldBalance(projectionFixture().readings);
    for (const family of families) {
      const lane = family.getAttribute('data-narrative-family')!;
      const model = balanceModel.lanes.find((l) => l.lane === lane)!;
      const expected =
        model.firing > 0
          ? `${model.firing} of ${model.readable} drivers firing`
          : 'No driver firing';
      const familyText = family.querySelector('p')?.textContent ?? '';
      expect(familyText.startsWith(expected), `${lane}: the family tally is the section's own key over the same counts`).toBe(true);
    }

    // The movers — raw deltas of the seats that moved, the window named
    // (the fixture's dollar seats each carry a −2.0% 30-day change).
    const dollarLine = families.find((f) => f.getAttribute('data-narrative-family') === 'dollar')!;
    expect(dollarLine.textContent).toContain('−2.0%');
    expect(dollarLine.textContent).toContain('over the past 30 days');

    // The no-fake-GRAM rule (s7/03 §2.2): co-movement, never causation,
    // never attribution shares.
    expect(band.textContent).not.toContain('because');
    expect(band.textContent).not.toMatch(/% of the (move|price)/);

    // The arc item 4 — the caveat, standing and adjacent.
    expect(band.querySelector('[data-narrative-caveat]')?.textContent).toContain('conditions, not the price move');

    // The band carries the zone anchor (R10's contract).
    expect(document.getElementById('gold-zone-d')).toBeTruthy();
  });

  it('GPE R12 / F5: the yield-decomposition card — the four-leg stack + the exact identity + the moved line + the configurations + the exception + the seats', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-yield]')).not.toBeNull();
    });
    const card = document.querySelector('[data-gold-yield]')!;

    // The four legs in fixed order, each with its value right-aligned +
    // its one-line gloss (s7/02 §2.4) + its as-of inline (C1).
    const legs = [...card.querySelectorAll('[data-yield-leg]')];
    expect(legs.map((l) => l.getAttribute('data-yield-leg'))).toEqual([
      'nominal-10y',
      'real-10y',
      'breakeven-10y',
      'term-premium-10y',
    ]);
    expect(card.textContent).toContain('The 10-year yield, decomposed');
    expect(card.textContent).toContain("gold’s classic rival"); // the real leg's gloss
    expect(card.textContent).toContain('expected inflation, read off the yield curve'); // the breakeven gloss
    expect(card.textContent).toContain('as of'); // the as-of inline

    // The EXACT identity: real + breakeven = nominal (the fixture's values
    // 1 − 1 = 0.00; the derived breakeven carries the method note).
    const identity = card.querySelector('[data-yield-identity]');
    expect(identity).toBeTruthy();
    expect(identity!.textContent).toContain('=');
    expect(legs[2]!.textContent).toContain('derived'); // hmm — the method rides the source line, not the label

    // "Which piece moved this month" — the window named (C1/C7).
    const moved = card.querySelector('[data-yield-moved]');
    expect(moved).toBeTruthy();
    expect(moved!.textContent).toContain('Which piece moved this month');
    expect(moved!.textContent).toContain('over the past 30 days');

    // The three named configurations + the funding-stress exception
    // (s7/01 §4 items 3–4 — the static education block).
    expect(card.textContent).toContain('The three configurations');
    expect(card.textContent).toContain('classic gold headwind');
    expect(card.textContent).toContain('debasement configuration');
    expect(card.textContent).toContain('why is gold not collapsing');
    expect(card.textContent).toContain('2022 gilt');

    // The model-provenance disclosure (Idea 5's binding note).
    expect(card.querySelector('[data-yield-premium-note]')?.textContent).toContain('model estimate');

    // The chain's live seats — card-level links to the voters (R10's
    // anchor contract, the name-match rule).
    expect(card.querySelector('a[href="/usa#usa-card-term-premium-10y"]')).toBeTruthy();
    expect(card.querySelector('a[href="/usa#usa-card-us-deficit-12m"]')).toBeTruthy();
  });

  it('S6: the hero\u2019s balance view ALTERNATES — the classic previous shape is the default, the minimal glyph one radio away, the choice persisted', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-hero]')).not.toBeNull();
    });

    // The DEFAULT is the classic view (BD-S6a): the previous shape — the
    // brass stage + weights + tray through the extracted drawing — and
    // NO minimal glyph.
    expect(document.querySelector('[data-hero-balance-view]')?.getAttribute('data-hero-balance-view')).toBe('classic');
    expect(document.querySelector('[data-balance-classic]')).not.toBeNull();
    expect(document.querySelector('[data-balance-stage]')).not.toBeNull();
    expect(document.querySelector('[data-hero-beam]')).toBeNull();

    // The radio group: two real options, the group labelled.
    const group = document.querySelector('[data-hero-balance-view]')!;
    expect(group.querySelector('legend')?.textContent).toBe('Balance view');
    const radios = group.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(2);
    expect((radios[0] as HTMLInputElement).checked).toBe(true);
    expect((radios[1] as HTMLInputElement).checked).toBe(false);

    // Toggle to the minimal view: the glyph appears, the stage leaves,
    // and the choice persists to localStorage.
    fireEvent.click(radios[1]!);
    await waitFor(() => {
      expect(document.querySelector('[data-hero-balance-view]')?.getAttribute('data-hero-balance-view')).toBe('minimal');
    });
    expect(document.querySelector('[data-hero-beam]')).not.toBeNull();
    expect(document.querySelector('[data-balance-classic]')).toBeNull();
    expect(window.localStorage.getItem('currena:pd:gold:balance-view')).toBe('minimal');

    // The engine\u2019s own lines stay in BOTH views: the verdict word +
    // the outlook + the counts ride the hero block either way.
    expect(document.querySelector('[data-hero-verdict]')?.getAttribute('data-hero-verdict')).toBe('for');
    expect(document.querySelector('[data-hero-outlook]')).not.toBeNull();
  });

  it('S6: the classic view renders the engine\u2019s own lane sides + weights + beam tilt through the SAME drawing the legacy card renders', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-balance-classic]')).not.toBeNull();
    });

    // The engine\u2019s own derivations over the same fixture — never
    // hand-counted (the pipes, the engine provides the numbers).
    const balance = goldBalance(projectionFixture().readings);

    // One WEIGHT per lane (5), each on the pan its side belongs to, its
    // accessible name the laneChipAria composition (lane + side + tally —
    // the corpus's own words, gold-copy-pin's pins). Scoped to the hero's
    // [data-balance-classic] drawing: the TM13 Signals section renders
    // the SAME shared BalanceScale drawing below (the snapshot stub now
    // routes, so it renders — the baseline-repair fix surfaced this).
    const LANE_NAME: Record<string, string> = {
      'borrowing-costs': 'Interest rates & borrowing costs',
      dollar: 'The US dollar',
      stress: 'Market stress & uncertainty',
      inflation: 'Inflation & inflation expectations',
      flows: 'Trader positioning & flows',
    };
    const SIDE_WORD: Record<string, string> = {
      for: 'Supports',
      against: 'Works against',
      neutral: 'Sitting neutral',
      unread: 'Cannot read',
    };
    const weights = document.querySelectorAll('[data-balance-classic] [data-balance-weight]');
    expect(weights.length).toBe(balance.lanes.length);
    for (const lane of balance.lanes) {
      const weight = document.querySelector(`[data-balance-classic] [data-balance-weight="${lane.lane}"]`) as HTMLElement;
      expect(weight, `weight ${lane.lane}`).not.toBeNull();
      expect(weight.getAttribute('aria-label')).toContain(`${LANE_NAME[lane.lane]}: ${SIDE_WORD[lane.split ? 'neutral' : lane.side]}.`);
    }
    // The pans: the for pan holds the for lanes, the against pan the
    // against lanes (the fixture: 4 for · 1 against).
    const forPan = document.querySelector('[data-balance-classic] [data-balance-pan="for"]')!;
    const againstPan = document.querySelector('[data-balance-classic] [data-balance-pan="against"]')!;
    expect(forPan.querySelectorAll('[data-balance-weight]').length).toBe(balance.counts.for);
    expect(againstPan.querySelectorAll('[data-balance-weight]').length).toBe(balance.counts.against);
    expect(forPan.textContent).toContain('Factors supporting gold’s price');
    expect(againstPan.textContent).toContain('Factors pressuring gold’s price');

    // The tray speaks its empty state (every lane sits on a pan in this
    // fixture) — the not-leaning well is part of the previous shape.
    expect(document.querySelector('[data-balance-classic] [data-balance-tray="not-leaning"]')?.textContent).toContain('Every driver is on a pan.');

    // The beam swings on the engine\u2019s own tilt (balanceTilt over the
    // same counts — one math with the legacy card\u2019s beam).
    const beam = document.querySelector('[data-balance-classic] [data-balance-beam]') as HTMLElement;
    expect(beam).not.toBeNull();
    const counts = { ...balance.counts, total: balance.lanes.length, net: balance.net, readable: balance.readable };
    const expectedTilt = balanceTilt(counts, 320);
    const expectedSigned = expectedTilt.heavy === 'against' ? expectedTilt.angleDeg : expectedTilt.heavy === 'for' ? -expectedTilt.angleDeg : 0;
    expect(beam.getAttribute('data-tilt')).toBe(String(expectedSigned));
  });

  it('renders all 37 seat chips with lean + evidence words, the impact distribution matching the engine', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });

    const balance = goldBalance(projectionFixture().readings);
    const engineImpacts = balance.lanes.flatMap((l) => l.members.map((m) => m.impact));

    // Every seat renders with its lean word + evidence word (when firing).
    const seats = document.querySelectorAll('[data-seat]');
    const impactCounts: Record<string, number> = {};
    for (const seat of seats) {
      const impact = seat.getAttribute('data-seat-impact')!;
      impactCounts[impact] = (impactCounts[impact] ?? 0) + 1;
      // The lean word rides the chip text.
      expect(seat.textContent?.length ?? 0).toBeGreaterThan(0);
    }
    for (const impact of new Set(engineImpacts)) {
      expect(impactCounts[impact]).toBe(engineImpacts.filter((i) => i === impact).length);
    }

    // A firing seat carries its evidence word (real-yield-10y falling).
    const realYield = document.querySelector('[data-seat="real-yield-10y"]');
    expect(realYield?.textContent).toContain('falling');
    expect(realYield?.textContent).toContain('Supports gold');
    // A steady seat carries no evidence word.
    const us30y = document.querySelector('[data-seat="us30y"]');
    expect(us30y?.textContent).toContain('Not leaning');
    expect(us30y?.textContent).not.toContain('rising');
  });

  it('renders the five lanes with their side words (GPE R17: the tally + intro chrome is GONE — the #21 de-dup)', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-lane]').length).toBe(5);
    });
    const balance = goldBalance(projectionFixture().readings);
    for (const lane of balance.lanes) {
      const card = document.querySelector(`[data-lane="${lane.lane}"]`);
      expect(card).not.toBeNull();
      expect(card!.getAttribute('data-lane-side')).toBe(lane.split ? 'split' : lane.side);
      // GPE R17 / S6-D5 (the space donor): the lane card keeps the header
      // + the verdict state word + the seats list — the tally line and the
      // lane intro (byte-identical to the Signals ledger rows' chrome) NO
      // LONGER render here. The hero's and the Signals renderings keep
      // theirs (the balance is said twice with full grammar).
      if (!lane.split && lane.side !== 'unread' && lane.firing > 0) {
        expect(card!.textContent).not.toContain(`${lane.firing} of ${lane.readable} drivers firing`);
      }
      const intro = INTROS[lane.lane as keyof typeof INTROS] ?? '';
      if (intro !== '') {
        expect(card!.querySelector('header')?.textContent).not.toContain(intro);
      }
    }
    // The seat counts per lane (D-26: 7 · 7 · 11 · 10 · 2).
    expect(document.querySelectorAll('[data-lane="borrowing-costs"] [data-seat]').length).toBe(7);
    expect(document.querySelectorAll('[data-lane="dollar"] [data-seat]').length).toBe(7);
    expect(document.querySelectorAll('[data-lane="stress"] [data-seat]').length).toBe(11);
    expect(document.querySelectorAll('[data-lane="inflation"] [data-seat]').length).toBe(10);
    expect(document.querySelectorAll('[data-lane="flows"] [data-seat]').length).toBe(2);
  });

  it('GPE R10: the seat links are CARD-LEVEL (the placement table + the anchor contract — GPE-S2-18)', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });
    // The gold page's own seats link their context cards in-page.
    const goldSilver = document.querySelector('a[data-seat="gold-silver"]');
    expect(goldSilver?.getAttribute('href')).toBe('#gold-card-gold-silver');
    // The cross-page seats link the destination card's OWN anchor.
    const dollarBasket = document.querySelector('a[data-seat="dollar-basket"]');
    expect(dollarBasket?.getAttribute('href')).toBe('/currencies#currencies-card-dollar-basket');
    const fedTarget = document.querySelector('a[data-seat="fed-target"]');
    expect(fedTarget?.getAttribute('href')).toBe('/usa#usa-card-fed-target');
    const ecbDfr = document.querySelector('a[data-seat="ecb-dfr"]');
    expect(ecbDfr?.getAttribute('href')).toBe('/europe#europe-card-ecb-dfr');
    const gprDaily = document.querySelector('a[data-seat="gpr-daily"]');
    expect(gprDaily?.getAttribute('href')).toBe('/world-markets#wm-risk-gpr-daily');
    // The GPE-S2-18 name-match: the tooltip + accessible name carry the
    // DESTINATION CARD'S OWN TITLE (the same key the card renders).
    const destTitle = dollarBasket?.getAttribute('title') ?? '';
    expect(destTitle.length).toBeGreaterThan(3); // a real title, not a stub
    expect(dollarBasket?.getAttribute('aria-label')).toContain(destTitle);
    // The lane cards carry the contract's canonical lane anchors (s7/03 §1.2).
    for (const lane of ['borrowing-costs', 'dollar', 'stress', 'inflation', 'flows']) {
      expect(document.getElementById(`lane-${lane}`), `#lane-${lane}`).toBeTruthy();
    }
    // Every one of the 37 seats links a card-level anchor (never a bare page).
    const hrefs = [...document.querySelectorAll('a[data-seat][data-seat-home]')].map((a) => a.getAttribute('href') ?? '');
    expect(hrefs).toHaveLength(37);
    for (const href of hrefs) {
      expect(href, 'every seat href carries a card-level #hash').toContain('#');
    }
  });

  /* ---------------------------------------------------------------- *
   * GPE R13 / F3a — the Iran bridge (Zone F)
   * ---------------------------------------------------------------- */

  it('GPE R13: the bridge fail-closes without a snapshot (the honest unavailable line, never a guess)', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-iran-bridge]')).not.toBeNull();
    });
    const bridge = document.querySelector('[data-gold-iran-bridge]')!;
    expect(bridge.textContent).toContain('The Tehran board could not be read yet.');
    expect(bridge.querySelectorAll('[data-bridge-row]').length).toBe(0);
  });

  it('GPE R13 / F3a: the Iran bridge — the board + the حباب grammar + the four-move interpretation (the 2026-11-18 frozen snapshot)', async () => {
    // The SHARED data plane: seed the App-boot snapshot store (the same
    // store /live-rates reads — s6/03 rule 4; one fixture, both
    // presentations). The values are the session's own live capture
    // (the coin-premium engine's frozen scenario).
    window.localStorage.setItem('currena:snapshot:tgju', JSON.stringify(tgjuSnapshotFixture()));
    snapshotStore.boot();
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-iran-bridge]')).not.toBeNull();
    });
    const bridge = document.querySelector('[data-gold-iran-bridge]')!;
    expect(bridge.id).toBe('gold-zone-f'); // R10's zone-level anchor

    // Zone F sits between the explanation band (D) and the Signals
    // section (s6/01 §2a slot A — the page's second chapter).
    const zoneD = document.querySelector('[data-gold-zone-d-band]')!;
    const zoneF = document.querySelector('[data-gold-zone-f-band]')!;
    const signals = document.querySelector('[data-gold-signals]')!;
    expect(zoneD.compareDocumentPosition(zoneF) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(zoneF.compareDocumentPosition(signals) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // The board: the coin family + geram18/24 + mesghal, in order (the
    // ounce does NOT join — it stays implied in the parity line).
    const rows = [...bridge.querySelectorAll('[data-bridge-row]')];
    expect(rows.map((r) => r.getAttribute('data-bridge-row'))).toEqual([
      'coin-emami', 'coin-bahar', 'coin-half', 'coin-quarter', 'coin-gram', 'gold-18k', 'gold-24k', 'gold-mesghal',
    ]);

    // C2 rule 2/3: the Emami row carries its premium (the frozen
    // arithmetic: intrinsic 234.79M vs market 250.74M → +6.8%) and its
    // per-row as-of stamp (TGJU's own marketAt, converted Gregorian in en).
    const emami = bridge.querySelector('[data-bridge-row="coin-emami"]')!;
    expect(emami.textContent).toContain('+6.8% premium');
    expect(emami.textContent).toContain('Nov 18, 2026');

    // The parity behind one tap: the named toman-per-ounce intermediate
    // (C1) + both legs of the decomposition (the reader reproduces it).
    fireEvent.click(within(emami as HTMLElement).getByText('Show the parity'));
    const parity = emami.querySelector('[data-bridge-parity]')!;
    expect(parity.textContent).toContain('3,744.68');
    expect(parity.textContent).toContain('266,330');
    expect(parity.textContent).toContain('997,320,624');
    expect(parity.textContent).toContain('234.8M toman');
    expect(parity.textContent).toContain('250.7M toman');

    // C2 rule 1: the method block — the formula + the constants table +
    // the gerami BAND + the آبشده convention + the CBI variant note.
    fireEvent.click(within(bridge as HTMLElement).getByText('How it is computed'));
    const method = bridge.querySelector('[data-bridge-method]')!;
    expect(method.textContent).toContain('intrinsic = global ounce × free-market dollar × pure-gold content');
    expect(method.querySelectorAll('[data-bridge-constant]').length).toBe(8);
    expect(method.textContent).toContain('0.90–0.92 g pure');
    expect(method.textContent).toContain('آبشده');
    expect(method.textContent).toContain('8.136 g × 0.900');

    // The four moves (s7/01 §8, binding order) + the Chain-2 close at
    // the dollar lane anchor (name-matched).
    fireEvent.click(within(bridge as HTMLElement).getByText('What this board means'));
    const interp = bridge.querySelector('[data-bridge-interpretation]')!;
    const moves = [...interp.querySelectorAll('p')];
    expect(moves.length).toBe(4);
    expect(moves[0]!.textContent).toContain('global gold × the free-market dollar');
    expect(moves[1]!.textContent).toContain('market-structure reading');
    expect(moves[2]!.textContent).toContain('2026-11-17');
    const dollarLink = moves[3]!.querySelector('a[href="#lane-dollar"]');
    expect(dollarLink?.textContent).toBe('The US dollar');

    // C6's TGJU row: the source link + the revision caveat.
    expect(bridge.querySelector('a[href="https://www.tgju.org/"]')?.textContent).toBe('Source: TGJU');
    expect(bridge.textContent).toContain('may be revised');
  });

  /* ---------------------------------------------------------------- *
   * GPE R14 / F2a — the central-bank demand section (Zone K)
   * ---------------------------------------------------------------- */

  it('GPE R14 / F2a: the CB-demand section — the chart + the buyers + the honest exceptions + the mirror cross-link (display-only)', async () => {
    stubFeeds({ goldCb: () => jsonResponse(cbSnapshotFixture()) });
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-cb-demand] [data-cb-chart]')).not.toBeNull();
    });
    const zoneK = document.querySelector('[data-gold-cb-demand]')!;
    expect(zoneK.id).toBe('gold-zone-k'); // R10's zone-level anchor

    // Zone K sits between the FLOWS cards and the honest record (s6/01
    // §2b slot A); the licence wall's #gold-blocked anchor now rides the
    // page-tail disclosure (BD-S43) — still AFTER zone K in document order.
    const flows = [...zoneK.parentElement!.children].findIndex((el) => el === zoneK);
    expect(flows).toBeGreaterThan(0);
    const wall = document.getElementById('gold-blocked')!;
    expect(zoneK.compareDocumentPosition(wall) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // The chart: the rolling line + the three dated episodes + the
    // current pace (the reported-world label rides the caption).
    const chart = zoneK.querySelector('[data-cb-chart]')!;
    expect(chart.querySelector('[data-cb-line]')).not.toBeNull();
    expect(chart.querySelectorAll('[data-cb-episode]').length).toBe(3);
    expect(chart.querySelector('[data-cb-current-pace]')?.textContent).toContain('397');
    expect(chart.textContent).toContain('the reported world');

    // The buyers table: the fixture's cast with the share column (the
    // S12-D1 method at the fixture's own gold price 4,072.1 → POL 30.6%);
    // UZB carries no value legs → the honest dash.
    // The desktop table carries the cast (the mobile stacked list renders
    // the same top-5 rows, CSS-hidden above sm — both in the DOM).
    const buyers = [...zoneK.querySelectorAll('[data-cb-buyers-table] [data-cb-buyer]')];
    expect(buyers.map((b) => b.getAttribute('data-cb-buyer'))).toEqual(['POL', 'CHN', 'UZB']);
    const pol = zoneK.querySelector('[data-cb-buyer="POL"]')!;
    expect(pol.textContent).toContain('Poland');
    expect(pol.textContent).toContain('+159.1');
    expect(pol.querySelector('[data-cb-share]')?.textContent).toBe('30.6%');
    const uzb = zoneK.querySelector('[data-cb-buyer="UZB"]')!;
    expect(uzb.querySelector('[data-cb-share]')?.textContent).toBe('—');

    // The honest exceptions (s7/01 §6): the standing caveat, the
    // reported-world line, the revision + China notes, the governance
    // sentence, the WGC cross-reference.
    expect(zoneK.querySelector('[data-cb-caveat]')?.textContent).toContain('explains quarters, not weeks');
    expect(zoneK.textContent).toContain('not the whole world');
    expect(zoneK.textContent).toContain('Monthly data is revised');
    expect(zoneK.textContent).toContain('China reports irregularly');
    expect(zoneK.querySelector('[data-cb-method] a[href="https://gold.org/goldhub/data"]')).not.toBeNull();
    expect(zoneK.textContent).toContain('does not vote in the meter above');

    // The mirror-framing cross-link (s6/01 §2b): the usd-reserve-share
    // seat's own card-level anchor + its own name (R10's contract).
    const mirror = zoneK.querySelector('a[href="/currencies#currencies-card-usd-reserve-share"]');
    expect(mirror?.textContent).toBe('USD share of world FX reserves');
  });

  it('GPE R14: the CB section fail-closes when the rung has not landed (the calm unavailable line)', async () => {
    stubFeeds({ goldCb: () => jsonResponse({ error: 'gold_cb_not_ready' }, 503) });
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-cb-demand] [data-cb-unavailable]')).not.toBeNull();
    });
    const zoneK = document.querySelector('[data-gold-cb-demand]')!;
    expect(zoneK.querySelector('[data-cb-unavailable]')?.textContent).toContain('could not be read yet');
  });

  /* ---------------------------------------------------------------- *
   * GPE R16 / F16b — the market-state pill (Zone B)
   * ---------------------------------------------------------------- */

  it('GPE R16 / F16b: the market-state pill renders inline after the as-of — the market + timezone NAMED (GPE-S3-10)', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-hero]')).not.toBeNull();
    });
    const pill = document.querySelector('[data-market-pill]');
    expect(pill).not.toBeNull();
    // The pill sits INSIDE the as-of line (Zone B, inline after it).
    expect(pill!.closest('[data-prices-as-of]')).not.toBeNull();
    // The reference market + its timezone, at point of use — and one of
    // the two honest states (the schedule itself is unit-pinned).
    expect(pill!.textContent).toContain('COMEX gold futures, New York');
    expect(pill!.textContent).toMatch(/UTC−[45]/);
    expect(pill!.textContent).toMatch(/Market (open|closed)/);
    expect(['open', 'closed']).toContain(pill!.getAttribute('data-market-pill'));
  });

  it('GPE R16 / #19 + GPE R18: the view radio labels and BOTH charts\' range chips meet the 44px touch-target floor', async () => {
    stubFeeds();
    // The trend chips render once the chart's history leg answers; the
    // history fetch is MODULE-CACHED, so the earlier tests' notFound
    // answers must clear first (the test seam).
    clearHistoryCacheForTests();
    clearGoldXauCacheForTests();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/insights/pages/gold')) return jsonResponse(projectionFixture());
        if (url === '/api/insights') return jsonResponse(snapshotFixture());
        if (url.includes('/api/insights/gold-ohlc')) return jsonResponse(ohlcFixture(300));
        if (url.includes('/history')) {
          // The per-id payload the fetch layer's id check demands
          // (GPE R18: the silver chart is the /history consumer now).
          const id = url.split('/api/insights/')[1]?.split('/history')[0];
          return jsonResponse({ v: 1, id, points: historyPointsFixture() });
        }
        return notFound();
      }),
    );
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-hero]')).not.toBeNull();
    });
    for (const id of ['gold-balance-view-classic', 'gold-balance-view-minimal']) {
      const label = document.querySelector(`label[for="${id}"]`)!;
      expect(label.className).toContain('min-h-[44px]');
    }
    // GPE R18 / F7: the GOLD chip's interactive chart rides the OHLC leg —
    // its own range chips + toggles must meet the same 44px floor.
    await waitFor(() => {
      expect(document.querySelectorAll('[data-gold-price-chart] [data-chart-range] button').length).toBeGreaterThan(0);
    });
    for (const chip of document.querySelectorAll('[data-gold-price-chart] button')) {
      expect(chip.className).toContain('min-h-[44px]');
    }
    // Silver's TrendPanel keeps its own chips (OI-4) — the same floor.
    await waitFor(() => {
      expect(document.querySelectorAll('[data-verdict-chart="silver"] [data-trend-range] button').length).toBeGreaterThan(0);
    });
    for (const chip of document.querySelectorAll('[data-verdict-chart="silver"] [data-trend-range] button')) {
      expect(chip.className).toContain('min-h-[44px]');
    }
  });

  /* ---------------------------------------------------------------- *
   * GPE R18 / F7 — the interactive price chart (Zone E, the gold chip)
   * ---------------------------------------------------------------- */

  it('GPE R18 / F7: the interactive chart replaces the gold chip\'s fixed-range panel — the unit-aware header (the series named per C1) + the pan/zoom/log controls + the D8 DMA toggles + the window as a user control', async () => {
    stubFeeds();
    clearHistoryCacheForTests();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-price-chart] [data-chart-plot]')).not.toBeNull();
    });
    const chart = document.querySelector('[data-gold-price-chart]')!;
    // The #01 dissolution by construction (S13-D2): the GOLD chip renders
    // the OHLC chart; the fixed-range TrendPanel is SILVER's now (its own
    // history fetch resolves async — wait for it).
    expect(document.querySelector('[data-verdict-chart="gold"] [data-trend-range]')).toBeNull();
    await waitFor(() => {
      expect(document.querySelector('[data-verdict-chart="silver"] [data-trend-range]')).not.toBeNull();
    });
    // The unit-aware header: the series named at point of use (C1) + the
    // as-of (the fixture's last final bar) + the provider link.
    expect(chart.querySelector('a[href="https://eodhd.com/api/eod/XAUUSD.FOREX"]')?.textContent).toContain('XAUUSD');
    expect(chart.textContent).toContain('as of');
    // The unit toggle: oz + gram; the gram conversion disclosed (C1) once
    // gram is selected (the toggle below proves it).
    expect(chart.querySelector('[data-chart-unit] button[aria-pressed="true"]')?.textContent).toBe('Ounce');
    const gramButton = [...chart.querySelectorAll('[data-chart-unit] button')].find((b) => b.textContent === 'Gram')!;
    fireEvent.click(gramButton);
    await waitFor(() => {
      expect(chart.textContent).toContain('1 troy oz = 31.1035 g');
    });
    // The log toggle + the D8 overlay toggles (both ON by default — the
    // mandate; the fixture's 300 bars carry both averages).
    const logToggle = chart.querySelector('[data-chart-toggle-log]')!;
    expect(logToggle.getAttribute('aria-pressed')).toBe('false');
    const sma50 = chart.querySelector('[data-chart-toggle-sma50]')!;
    const sma200 = chart.querySelector('[data-chart-toggle-sma200]')!;
    expect(sma50.getAttribute('aria-pressed')).toBe('true');
    expect(sma200.getAttribute('aria-pressed')).toBe('true');
    expect(sma50.textContent).toContain('50-day');
    expect(sma200.textContent).toContain('200-day');
    // The window as a USER CONTROL: the three chips; the ALL chip states
    // the honest stored span (the #01 grammar — computed from the data).
    const chips = [...chart.querySelectorAll('[data-chart-range] button')];
    expect(chips.map((c) => c.getAttribute('data-chart-range-chip'))).toEqual(['quarter', '1y', 'all']);
    const allChip = chips.find((c) => c.getAttribute('data-chart-range-chip') === 'all')!;
    expect(allChip.textContent).toContain('All');
    fireEvent.click(allChip);
    await waitFor(() => {
      expect(allChip.getAttribute('aria-pressed')).toBe('true');
    });
    // The window delta: a signed percent + the span word computed from the
    // VISIBLE window (never a fixed label over another span).
    const delta = chart.querySelector('[data-chart-delta]')!;
    expect(delta.textContent).toMatch(/[+−−-]\d/);
    expect(delta.textContent).toMatch(/(months|years)/);
    // The plot + the inspector affordance are keyboard-reachable (the
    // TrendPanel accessibility pattern).
    expect(chart.querySelector('[data-chart-plot][tabindex="0"]')).not.toBeNull();
    // The pan/zoom hint (the #17 lesson applied forward).
    expect(chart.textContent).toContain('Drag to pan');
  });

  it('GPE R18: the chart fail-closes when the rung has not landed (the calm no-history line, never a guess)', async () => {
    stubFeeds({ goldOhlc: () => notFound() });
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-price-chart="none"]')).not.toBeNull();
    });
    expect(document.querySelector('[data-gold-price-chart="none"]')?.textContent).toContain('No chart history');
  });

  /* ---------------------------------------------------------------- *
   * GPE R19 / F8 — the minimal TA band (Zone H)
   * ---------------------------------------------------------------- */

  it('GPE R19 / F8: the TA band renders Zone H (between the seats and the ratios) — the SMA rows + the distance decile (its basis named) + the dated crosses + the classic daily/weekly pivots', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-ta-levels] [data-ta-distance]')).not.toBeNull();
    });
    const band = document.querySelector('[data-gold-ta-levels]')!;
    // The band's default open state follows the viewport (desktop expanded,
    // the 390 rule collapsed — the distance sentence ALWAYS visible); the
    // test environment may render either, so the toggle opens only if the
    // tables are hidden.
    if (band.querySelector('[data-ta-sma-rows]') === null) {
      fireEvent.click(band.querySelector('[data-ta-toggle]')!);
    }
    await waitFor(() => {
      expect(band.querySelector('[data-ta-sma-rows]')).not.toBeNull();
    });
    // Zone H sits between the seats (G) and the ratios (I): the band is
    // placed after the seats section and before the context section.
    const seats = document.getElementById('gold-seats')!;
    const context = document.getElementById('gold-context')!;
    expect(seats.compareDocumentPosition(band) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(band.compareDocumentPosition(context) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The honesty labels ride the copy (C5 rules 1 + the display-only note).
    expect(band.textContent).toContain('Descriptive reference');
    // The SMA rows: the four standard windows (the fixture's 300 bars
    // carry them all) + the series note named at the table header (C1).
    expect(band.querySelector('[data-ta-series-note]')?.textContent).toContain('XAUUSD');
    expect(band.querySelector('[data-ta-series-note]')?.textContent).toContain('EODHD');
    const smaRowIds = [...band.querySelectorAll('[data-ta-sma]')].map((el) => el.getAttribute('data-ta-sma'));
    expect(smaRowIds).toEqual(['20', '50', '100', '200']);
    // The distance-decile sentence — the ALWAYS-visible takeaway, its
    // basis window named (S13-D1: the honest word computed from the
    // stored span, never a "decade" the data cannot support).
    const distance = band.querySelector('[data-ta-distance]')!;
    expect(distance.textContent).toMatch(/(above|below)/);
    expect(distance.textContent).toContain('percentile');
    expect(distance.textContent).toContain('stored');
    expect(distance.textContent).toMatch(/(months|years)/);
    // The sentence cross-links the chart anchor (the s2 §5c split).
    expect(distance.querySelector('a[href="#insights-signals"]')).not.toBeNull();
    // The dated cross events (the fixture's two-frequency wave carries
    // at least one), each with the honest followed-by figure.
    const crosses = [...band.querySelectorAll('[data-ta-cross]')];
    expect(crosses.length).toBeGreaterThan(0);
    expect(['golden', 'death']).toContain(crosses[0]!.getAttribute('data-ta-cross'));
    expect(crosses[0]!.textContent).toMatch(/(then|edge)/);
    // The classic pivots: daily + weekly tables, S1-S3 + R1-R3 rows with
    // right-aligned values; the "from the session of {date}" disclosure.
    expect(band.querySelectorAll('[data-ta-pivot-set]').length).toBe(2);
    const first = band.querySelector('[data-ta-pivot-set]')!;
    expect(first.textContent).toContain('Support');
    expect(first.textContent).toContain('Resistance');
    expect(first.textContent).toContain('from the session of');
    // The TGJU vocabulary on the section titles («سطوح پیوت» grammar, C5).
    expect(band.textContent).toContain('pivots');
  });

  it('GPE R19: the TA band fail-closes without the OHLC leg (the calm unavailable line)', async () => {
    stubFeeds({ goldOhlc: () => notFound() });
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-ta-levels="none"]')).not.toBeNull();
    });
  });

  /* ---------------------------------------------------------------- *
   * GPE R20 / F4a — the education on-ramp (Zone D's third element)
   * ---------------------------------------------------------------- */

  it('GPE R20 / F4a: the education on-ramp renders collapsed in Zone D; opened, the five drivers each close LIVE at their lane (the counts byte-match the engine) + the two notes + the six-question FAQ', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-gold-onramp]')).not.toBeNull();
    });
    const onRamp = document.querySelector('[data-gold-onramp]')!;
    // The collapsed accordion is Zone D's desktop default (s6/01 zone D):
    // the title + subtitle visible, the drivers behind one tap.
    expect(onRamp.querySelector('[data-onramp-driver="1"]')).toBeNull();
    fireEvent.click(onRamp.querySelector('[data-onramp-toggle]')!);
    await waitFor(() => {
      expect(onRamp.querySelector('[data-onramp-driver="1"]')).not.toBeNull();
    });

    // The five drivers, one row each; driver 4 display-only (no lane).
    const driverRows = [...onRamp.querySelectorAll('[data-onramp-driver]')];
    expect(driverRows.map((el) => el.getAttribute('data-onramp-driver'))).toEqual(['1', '2', '3', '4', '5']);

    // The LIVE closes (s7/02 §1.6 — the one-projection rule): the count of
    // each driver's family byte-matches the SAME engine the hero reads.
    const projection = PageProjectionSchema.parse(projectionFixture());
    const balance = goldBalance(projection.readings);
    const laneMembers = (lane: string): number =>
      balance.lanes.find((l) => l.lane === lane)?.members.length ?? 0;
    const d1 = onRamp.querySelector('[data-onramp-driver="1"]')!;
    expect(d1.textContent).toContain(`${laneMembers('borrowing-costs')} of the 37 factors`);
    const d2 = onRamp.querySelector('[data-onramp-driver="2"]')!;
    expect(d2.textContent).toContain(`${laneMembers('inflation')} of the 37 factors`);
    const d3 = onRamp.querySelector('[data-onramp-driver="3"]')!;
    expect(d3.textContent).toContain(`${laneMembers('dollar')} of the 37 factors`);
    const d5 = onRamp.querySelector('[data-onramp-driver="5"]')!;
    expect(d5.textContent).toContain(`${laneMembers('stress')} of the 37 factors`);
    // The lane word renders the engine's own state vocabulary (the same
    // word the seats' lane cards render).
    const d1Lane = balance.lanes.find((l) => l.lane === 'borrowing-costs')!;
    const d1Word = d1Lane.split === true ? 'Split' : d1Lane.side === 'for' ? 'Leans for gold' : d1Lane.side === 'against' ? 'Leans against gold' : d1Lane.side === 'neutral' ? 'Not leaning' : "Couldn’t be read";
    expect(d1.textContent).toContain(d1Word);
    // Driver 4 closes display-only (the governance asymmetry taught).
    const d4 = onRamp.querySelector('[data-onramp-driver="4"]')!;
    expect(d4.textContent).toContain('does not vote on (yet)');
    expect(d4.querySelector('a[href="#gold-zone-k"]')).not.toBeNull();

    // The driver closes land on CARD-LEVEL anchors (the #18 pattern — the
    // name-match rule: the destination card's OWN title).
    expect(d1.querySelector('a[href="/usa#usa-card-real-yield-10y"]')?.textContent).toBe('US 10-year interest after inflation');
    expect(d1.querySelector('a[href="/usa#usa-card-fed-expectations"]')?.textContent).toBe('What markets expect from the Fed');
    expect(d2.querySelector('a[href="/usa#usa-card-us-cpi-yoy"]')).not.toBeNull();
    expect(d3.querySelector('a[href="/currencies#currencies-card-dollar-basket"]')).not.toBeNull();
    // The currency-grid bracket degrades to the one non-USD price card
    // that exists today (s7/02 §1.3's own note, until R26).
    expect(d3.querySelector('a[href="#gold-card-gold-aud"]')).not.toBeNull();
    // The ETF-flows card rides R23 — never a dead link today.
    expect(d5.querySelector('a[href*="etf" i]')).toBeNull();

    // The two closing notes: fuel-not-driver + the governance asymmetry.
    expect(onRamp.querySelector('[data-onramp-note="fuel"]')?.textContent).toContain('fuel gauge');
    expect(onRamp.querySelector('[data-onramp-note="fuel"] a[href="#gold-positions"]')).not.toBeNull();
    expect(onRamp.querySelector('[data-onramp-note="governance"]')?.textContent).toContain('not the same five');

    // The FAQ tail: the six questions, each closing at its anchor.
    const faq = [...onRamp.querySelectorAll('[data-onramp-faq]')];
    expect(faq.map((el) => el.getAttribute('data-onramp-faq'))).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(faq[3]!.querySelector('a[href="#gold-honest-record"]')).not.toBeNull(); // Q4 → the honest record
    expect(faq[4]!.querySelector('a[href="#gold-zone-f"]')).not.toBeNull(); // Q5 → the bridge
    expect(faq[5]!.querySelector('a[href="#gold-seats"]')).not.toBeNull(); // Q6 → the seats
  });

  /* ---------------------------------------------------------------- *
   * GPE R21 / F4b — the one-liners + the Chain-7 physical grouping
   * ---------------------------------------------------------------- */

  it('GPE R21 / F4b: every context card gains its plain meaning sentence; the five flows cards group with the «physical market» mini-header + the ONE shared reading line', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-context-card]').length).toBe(13);
    });
    // The 13 non-hero cards each carry a one-liner (the hero needs none —
    // its meaning is the as-of line + the market pill, Zone B).
    const cardsWithMeaning = [...document.querySelectorAll('[data-context-card]')].filter(
      (card) => card.querySelector('[data-card-meaning]') !== null,
    );
    expect(cardsWithMeaning.length).toBe(13);
    const silver = document.querySelector('[data-context-card="gold-silver"]')!;
    expect(silver.querySelector('[data-card-meaning]')?.textContent).toContain('ounces of silver');
    const shanghai = document.querySelector('[data-context-card="shanghai-gold-premium"]')!;
    expect(shanghai.querySelector('[data-card-meaning]')?.textContent).toContain('sensor');

    // The Chain-7 physical grouping (s7/01 §7): the three physical cards
    // under the mini-header + ONE shared reading line; the COT pair stays
    // above the subgroup (Chain 6's fuel-not-driver).
    const physical = document.querySelector('[data-physical-group]')!;
    expect(physical.querySelector('h4')?.textContent).toBe('The physical market');
    expect(physical.querySelectorAll('[data-context-card]').length).toBe(3);
    const physicalIds = [...physical.querySelectorAll('[data-context-card]')].map((c) => c.getAttribute('data-context-card'));
    expect(physicalIds).toEqual(['sge-gold-withdrawals', 'swiss-gold-flow', 'shanghai-gold-premium']);
    const sharedLine = document.querySelector('[data-physical-line]')!;
    expect(sharedLine.textContent).toContain('marginal bid');
    // The ONE shared line renders once (not per card).
    expect(document.querySelectorAll('[data-physical-line]').length).toBe(1);
    // The COT positioning pair renders OUTSIDE the physical subgroup.
    const flows = document.querySelector('[data-flows-group]')!;
    const cftc = flows.querySelector('[data-context-card="cftc-gold-positioning"]')!;
    expect(cftc.closest('[data-physical-group]')).toBeNull();
    expect(flows.querySelectorAll(':scope > div > [data-context-card]').length).toBe(2);
  });

  it('renders the context cards with values, the footer-positioned publication-notes disclosure (collapsed), and the honest record', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-context-card]').length).toBe(13);
    });

    // The cards render their values + the position line when present.
    const silver = document.querySelector('[data-context-card="gold-silver"]');
    expect(silver?.textContent).toContain('78.5');
    expect(silver?.textContent).toContain('ratio');
    expect(silver?.textContent).toContain('typical');
    const oil = document.querySelector('[data-context-card="gold-oil-ratio"]');
    expect(oil?.textContent).toContain('41.5');
    const sge = document.querySelector('[data-context-card="sge-gold-withdrawals"]');
    expect(sge?.textContent).toContain('92');

    // BD-S43 (the owner-directed relocation, 2026-11-20): the licence wall
    // (the blocked quartet + the absent-count line) NO LONGER rides the
    // main flow or the page header — it lives at the PAGE TAIL as the
    // publication-notes disclosure, COLLAPSED BY DEFAULT (the house
    // progressive-disclosure pattern). Closed: no blocked note in the DOM,
    // no absent note above the hero, the toggle carries aria-expanded=false.
    expect(document.querySelector('[data-gold-publication-notes]')).not.toBeNull();
    expect(document.querySelector('[data-blocked-note]')).toBeNull();
    expect(document.querySelector('[data-absent-note]')).toBeNull();
    const toggle = document.querySelector('[data-gold-publication-notes] [data-pubnotes-toggle]')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    // The disclosure is the page's LAST in-flow section — after the
    // if-you'd-bought calculator (the footer position).
    const disclosure = document.querySelector('[data-gold-publication-notes]')!;
    const ifBought = document.querySelector('[data-gold-ifbought]')!;
    expect(ifBought.compareDocumentPosition(disclosure) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The anchor contract survives: the historical #gold-blocked target.
    expect(document.getElementById('gold-blocked')).toBe(disclosure);

    // ONE tap opens the honest record — everything the wall ever carried,
    // byte-for-byte the same copy.
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    // The blocked quartet as honest NOTES (never cards).
    expect(document.querySelectorAll('[data-blocked-note]').length).toBe(4);
    expect(document.querySelector('[data-blocked-note="wgc-etf-holdings"]')?.textContent).toContain('WGC');

    // GPE R09 / F13 — the SHARPENED wall: every item states its WHY *and*
    // the owner's lever (C7 rule 5), the wall carries its ONE link-out
    // (#22, GPE-S2-22 — the public data-sources document), and the
    // absent-count line (the old Zone A header note) rides INSIDE the
    // disclosure (the count through formatNumber — Persian digits in FA,
    // GPE-S2-15; the fixture carries 4 absent ids).
    expect(document.querySelector('[data-blocked-note="wgc-etf-holdings"]')?.textContent).toContain("owner’s lever");
    expect(document.querySelector('[data-blocked-note="wgc-etf-holdings"]')?.textContent).toContain('info@gold.org');
    expect(document.querySelector('[data-blocked-note="wgc-cb-demand"]')?.textContent).toContain("owner’s lever");
    expect(document.querySelector('[data-blocked-note="official-gold-demand"]')?.textContent).toContain('fail-closed');
    expect(document.querySelector('[data-blocked-note="etf-short-interest"]')?.textContent).toContain('no licence-clean venue');
    const wall = document.querySelector('[data-gold-blocked]');
    expect(wall?.querySelector('a[href*="SOURCES.md"]')).toBeTruthy(); // the ONE link-out
    const absent = document.querySelector('[data-absent-note]');
    expect(absent?.textContent).toContain('4');
    expect(absent?.textContent).not.toContain('see why'); // the old in-page link retired with the header note

    // The honest-record footnote.
    const honest = document.querySelector('[data-gold-honest-record]');
    expect(honest?.textContent).toContain('no positive association');
    expect(honest?.textContent).toContain('46.8');
    expect(honest?.textContent).toContain('MIN2');
    expect(honest?.textContent).toContain('no forecasting edge');
  });

  it('the fail-closed path: a dead projection renders the honest error state with the retry', async () => {
    stubFeeds({ projection: () => jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503) });
    render(<GoldPage />);
    await waitFor(() => {
      expect(screen.getByText('The gold page is unavailable right now')).toBeTruthy();
    });
    expect(screen.getByText('Try again')).toBeTruthy();
    // Nothing is faked — no seats, no hero.
    expect(document.querySelector('[data-gold-hero]')).toBeNull();
    expect(document.querySelectorAll('[data-seat]').length).toBe(0);
  });

  it('the M-17 last-good path: a failed refresh after a good load keeps the page on screen, labelled', async () => {
    // First visit: a good projection lands in localStorage.
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });
    cleanup();
    vi.unstubAllGlobals();
    // A fresh page load (the module promise cache resets with the page).
    clearProjectionCacheForTests();
    // Second visit: the projection feed dies, the cached projection
    // paints — labelled. The snapshot feed stays alive (the M-17 ladder
    // is the projection's own; the snapshot fetch must never escape
    // unhandled — the baseline-repair fix).
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input) === '/api/insights' ? jsonResponse(snapshotFixture()) : jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503),
      ),
    );
    render(<GoldPage />);
    // The seats stay on screen (the cached copy), and the fromCache
    // label speaks.
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });
    await waitFor(() => {
      expect(document.body.textContent).toContain('Showing the last good copy');
    });
  });

  /* ---------------------------------------------------------------- *
   * GPE R04 (F16a) — the why-unread lines: one muted status line per
   * dark seat, its cause class derived from the projection's reading
   * metadata (the S2 §3 decomposition).
   * ---------------------------------------------------------------- */
  it('dark seats state WHY: the four cause classes render under the lean word', async () => {
    // The 16–17 Nov cluster, shaped exactly as the S2 §3 table found it:
    // UoM stopped (stale @ Sep 2026), CPI's base-month gap (stale),
    // CFTC/GPR pipeline lags (stale), US−Japan rule-driven (fresh
    // value, no decile history — the D-18 branch).
    const projection = projectionFixture();
    const patch: Record<string, Partial<IndicatorReading>> = {
      'michigan-sentiment': { status: 'stale', asOf: '2026-09-01', value: 48.1 },
      'michigan-1y-expectations': { status: 'stale', asOf: '2026-09-01', value: 4.6 },
      'michigan-5y-expectations': { status: 'stale', asOf: '2026-09-01', value: 3.4 },
      'us-cpi-yoy': { status: 'stale', asOf: '2026-09-01', value: 3.7377 },
      'cftc-gold-positioning': { status: 'stale', value: 44.9804 },
      'cftc-gold-gross-long': { status: 'stale', value: 55.2473 },
      'gpr-daily': { status: 'stale', value: 158.845 },
      'us-japan-10y-gap': { status: 'normal', value: 2.259, percentile10y: undefined, change30d: undefined },
    };
    projection.readings = projection.readings.map((r) =>
      patch[r.id] !== undefined ? ({ ...r, ...patch[r.id] } as IndicatorReading) : r,
    );
    stubFeeds({ projection: () => jsonResponse(projection) });
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });

    // The four cause classes render, each under its dark seat.
    const whyLine = (seatId: string): string | null =>
      document.querySelector(`[data-seat="${seatId}"] [data-seat-why]`)?.textContent ?? null;
    // upstream-stopped: the UoM family, with the last published month.
    expect(document.querySelector('[data-seat="michigan-sentiment"] [data-seat-why]')?.getAttribute('data-seat-why')).toBe('upstream-stopped');
    expect(whyLine('michigan-sentiment')).toContain('source stopped publishing');
    expect(whyLine('michigan-sentiment')).toContain('Sep 2026');
    // upstream-gap: the CPI seat.
    expect(document.querySelector('[data-seat="us-cpi-yoy"] [data-seat-why]')?.getAttribute('data-seat-why')).toBe('upstream-gap');
    expect(whyLine('us-cpi-yoy')).toContain('year-ago base month');
    // pipeline-lag: the CFTC pair + GPR.
    for (const id of ['cftc-gold-positioning', 'cftc-gold-gross-long', 'gpr-daily']) {
      expect(document.querySelector(`[data-seat="${id}"] [data-seat-why]`)?.getAttribute('data-seat-why')).toBe('pipeline-lag');
    }
    expect(whyLine('gpr-daily')).toContain('next ingest');
    // rule-driven: the US−Japan gap (fresh value, no decile history).
    expect(document.querySelector('[data-seat="us-japan-10y-gap"] [data-seat-why]')?.getAttribute('data-seat-why')).toBe('rule-driven');
    expect(whyLine('us-japan-10y-gap')).toContain('no decile history');

    // Readable seats never carry a why-line.
    expect(document.querySelector('[data-seat="real-yield-10y"] [data-seat-why]')).toBeNull();
    expect(document.querySelector('[data-seat="us30y"] [data-seat-why]')).toBeNull();
  });

  /* ---------------------------------------------------------------- *
   * GPE R05 (S4-D1) — the CPI seat lights with its method label: a
   * gap-derived reading (adjacent-months-average base) renders the
   * point-of-use disclosure on the LIT seat (the R04 pairing — the
   * upstream-gap why-line spoke while the seat was dark).
   * ---------------------------------------------------------------- */
  it('a gap-based CPI seat renders the adjacent-months-average method label (GPE R05)', async () => {
    const projection = projectionFixture();
    projection.readings = projection.readings.map((r) =>
      r.id === 'us-cpi-yoy'
        ? ({ ...r, value: 4.02, status: 'warning', asOf: '2026-10-01', percentile10y: 0.9, yoyBaseMethod: 'adjacent-months-average' } as IndicatorReading)
        : r,
    );
    stubFeeds({ projection: () => jsonResponse(projection) });
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });
    const seat = document.querySelector('[data-seat="us-cpi-yoy"]');
    // The seat is LIT (warning + percentile → readable, fires the lane).
    expect(seat?.getAttribute('data-seat-impact')).not.toBe('unread');
    // The method label renders — the S4-D1 sentence with the base month.
    const method = seat?.querySelector('[data-seat-method="adjacent-months-average"]');
    expect(method?.textContent).toContain('base: adjacent-months average');
    expect(method?.textContent).toContain('Oct 2025 publication gap');
    // No why-line on a lit seat.
    expect(seat?.querySelector('[data-seat-why]')).toBeNull();
  });

  /* ---------------------------------------------------------------- *
   * GPE R06 — the LOW riders (wave 0 batch): #15 the FA absent-count
   * Persian digit, #23 the live-prices "last successful" qualifier,
   * #24 the cold-load skeleton, + the F17 silver keep-small footer note.
   * ---------------------------------------------------------------- */
  it('#15: the absent-count renders Persian digits in FA (GPE-S2-15)', async () => {
    stubFeeds();
    render(
      <>
        <LocaleProbe locale="fa" />
        <GoldPage />
      </>,
    );
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });
    // BD-S43: the absent note now rides the page-tail publication-notes
    // disclosure — OPEN IT, then the count renders through formatNumber:
    // in FA the digit is Persian (۴), not the raw Western "4" interpolate
    // would stringify. The fixture carries 4 absent ids.
    fireEvent.click(document.querySelector('[data-pubnotes-toggle]')!);
    const note = document.querySelector('[data-absent-note]');
    expect(note).not.toBeNull();
    expect(note?.textContent).toContain('۴');
    expect(note?.textContent).not.toMatch(/(?<![\u06F0-\u06F9])4(?![\u06F0-\u06F9])/);
  });

  it('#15 (EN): the absent-count renders Western digits in EN (the parity)', async () => {
    stubFeeds();
    render(
      <>
        <LocaleProbe locale="en" />
        <GoldPage />
      </>,
    );
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });
    // BD-S43: the same disclosure, opened — the EN parity.
    fireEvent.click(document.querySelector('[data-pubnotes-toggle]')!);
    const note = document.querySelector('[data-absent-note]');
    expect(note?.textContent).toContain('4');
  });

  it('#23: a cached (outage) projection qualifies the live-prices line with "last successful" (GPE-S2-23)', async () => {
    // First visit: a good projection lands in localStorage.
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });
    // The fresh path: the live-prices line carries the plain as-of sentence.
    expect(document.querySelector('[data-prices-as-of]')?.getAttribute('data-prices-as-of')).toBe('fresh');
    expect(document.querySelector('[data-prices-as-of]')?.textContent).toContain('Live prices as of');
    expect(document.querySelector('[data-prices-as-of]')?.textContent).not.toContain('last successful');
    cleanup();
    vi.unstubAllGlobals();
    clearProjectionCacheForTests();
    // Second visit: the projection feed dies, the cached copy paints —
    // labelled. The live-prices line now qualifies its timestamp.
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input) === '/api/insights' ? jsonResponse(snapshotFixture()) : jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503),
      ),
    );
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });
    await waitFor(() => {
      expect(document.body.textContent).toContain('Showing the last good copy');
    });
    // The cached path: the line carries the "last successful" qualifier.
    const pricesLine = document.querySelector('[data-prices-as-of]');
    expect(pricesLine?.getAttribute('data-prices-as-of')).toBe('cached');
    expect(pricesLine?.textContent).toContain('last successful');
  });

  it('#24: the cold-load skeleton reserves the Signals section slot before the snapshot arrives (GPE-S2-24)', async () => {
    // The snapshot feed is delayed — GoldPage renders the projection
    // (seats) while insightsSnapshot is still null. The skeleton reserves
    // the Signals section's slot so the seats don't pop in above it.
    let releaseSnapshot!: () => void;
    const snapshotPromise = new Promise<Response>((resolve) => {
      releaseSnapshot = () => resolve(jsonResponse(snapshotFixture()));
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/insights/pages/gold')) return jsonResponse(projectionFixture());
        if (url === '/api/insights') return snapshotPromise;
        return notFound();
      }),
    );
    render(<GoldPage />);
    // The seats arrive (the projection feed resolved); the skeleton is
    // on screen because the snapshot has not.
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });
    const skeleton = document.querySelector('[data-gold-signals-skeleton]');
    expect(skeleton).not.toBeNull();
    expect(skeleton?.getAttribute('role')).toBe('status');
    // The skeleton carries the Signals section's heading + the loading
    // line (the copy corpus's signals.title + pd.gold.loadingLine) so the
    // slot is recognizably the signals section, not a generic loader.
    expect(skeleton?.textContent).toContain('What the signals say');
    expect(skeleton?.querySelector('.loader-dot')).not.toBeNull();
    // The signals block itself has not rendered yet.
    expect(document.querySelector('[data-gold-signals]')).toBeNull();
    // Release the snapshot: the skeleton is replaced by the real section.
    releaseSnapshot();
    await waitFor(() => {
      expect(document.querySelector('[data-gold-signals]')).not.toBeNull();
    });
    expect(document.querySelector('[data-gold-signals-skeleton]')).toBeNull();
  });

  it('F17: the silver card carries the keep-small footer note (S5-D3 made visible)', async () => {
    stubFeeds();
    render(<GoldPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-seat]').length).toBe(37);
    });
    // The Signals section renders the verdict strip; the silver chip
    // carries the keep-small note (the gold chip does not).
    const silverNote = document.querySelector('[data-verdict-metal="silver"] [data-silver-keep-small-note]');
    const goldNote = document.querySelector('[data-verdict-metal="gold"] [data-silver-keep-small-note]');
    expect(silverNote).not.toBeNull();
    expect(goldNote).toBeNull();
    // The note states the deliberate choice.
    expect(silverNote?.textContent).toContain('deliberate');
  });
});
