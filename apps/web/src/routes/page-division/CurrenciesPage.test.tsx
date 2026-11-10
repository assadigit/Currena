/**
 * @vitest-environment jsdom
 *
 * CurrenciesPage.test.tsx (S18, 2026-11-11) — the Currencies page's
 * DOM-level characterization suite. What is pinned:
 *
 *   - the page shell: the destination's own title + purpose + the
 *     data-as-of line (the In-build chip RETIRED at the S18 gates pass —
 *     the S16/S17 one-session trajectory: the build and the gates ship
 *     in this one session, so once the §21 diff, the freshness audit,
 *     the render audit and the browser pass are green the chip comes off
 *     before the deploy);
 *   - the 7 rule lights hero (D-41): every light renders its name +
 *     status word + the outcome-specific headline through the SAME §9.3
 *     mapping (fxRuleView) + the everyday explanation + the reliability
 *     line; the downgrade path keeps its warning sentence + the caution
 *     line; nodata speaks the noData word;
 *   - the 11-pair board (D-42): every pair renders its rate, the four
 *     period changes (the legacy signedPct join), the move rank, the
 *     bigMove tag on the flagging row, the 52-week chart, the old-data
 *     tag on the stale row — AUDNZD the 11th;
 *   - the two registry-card sections (D-32): the 7 pair-context cards +
 *     the 7 dollar-standing cards with the §21 trio (value · 10-year
 *     position · freshness), the values rendered through the DISPLAY
 *     registry's own joins (the currency prefixes '₺34.56' EN / the fa
 *     suffix '۳۴٫۵۶ لیر ترکیه'; the AED suffix; the tight percent);
 *   - the honest fail-closed paths: an absent card reading renders the
 *     unavailable word; a dead projection with no cache renders the
 *     error state + retry; a dead fx feed renders the calm "being
 *     prepared" line (never an error);
 *   - the M-17 last-good path: a failed refresh after a good load keeps
 *     the page on screen, labelled;
 *   - the fa/RTL rendering (the Persian title + the Persian section
 *     headings + the Persian card value joins, including the fa unit
 *     suffix words).
 *
 * House discipline (Converter.test.tsx's own): stubbed fetch per test —
 * tests NEVER hit live sites; contract-valid fixtures sanity-parsed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import type { FxSnapshot, IndicatorReading, PageProjection } from '@currena/core';
import { FxSnapshotSchema, PageProjectionSchema } from '@currena/core';
import { pageReadingIds } from '@currena/insights/page-division';
import { CurrenciesPage } from './CurrenciesPage';
import { CURRENCIES_BOARD_PAIR_IDS, CURRENCIES_CARD_IDS, CURRENCIES_DOLLAR_STANDING_IDS, CURRENCIES_PAIR_CARD_IDS } from './currencies-tiles';
import { clearProjectionCacheForTests } from '../../lib/page-division';

/* ------------------------------------------------------------------ *
 * Fixtures — contract-valid payloads (sanity-parsed inside the tests)
 * ------------------------------------------------------------------ */

function reading(id: string, partial: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id: id as IndicatorReading['id'],
    value: 1,
    asOf: '2026-11-09',
    percentile10y: 0.5,
    status: 'normal',
    sourceName: 'fixture',
    updatedAt: '2026-11-09T20:10:18.486Z',
    ...partial,
  } as IndicatorReading;
}

/** The 14 Currencies home cards' displayed values — real-world magnitudes
 *  so the §21 trio asserts the DISPLAY registry's own joins (the currency
 *  prefixes in EN, the suffix words in fa, the tight percent). */
const CARD_OVERRIDES: Record<string, Partial<IndicatorReading>> = {
  'dollar-basket': { value: 101.85, percentile10y: 0.72, asOf: '2026-11-09' }, // index · typical
  'dollar-broad': { value: 120.44, percentile10y: 0.65, asOf: '2026-11-09' },
  'dollar-eme': { value: 130.86, percentile10y: 0.81, asOf: '2026-11-09' }, // high · top 19%
  'us-japan-10y-gap': { value: 2.03, percentile10y: 0.9, asOf: '2026-11-05' },
  usdtry: { value: 34.56, percentile10y: 0.95, asOf: '2026-11-09' }, // try · high
  usdaed: { value: 3.67, percentile10y: 0.5, asOf: '2026-11-09' },
  'usd-reserve-share': { value: 56.7, percentile10y: 0.05, asOf: '2026-06-30' }, // percent · low
  usdjpy: { value: 150.23, percentile10y: 0.44, asOf: '2026-11-09' },
  'eur-usd': { value: 0.9012, percentile10y: 0.06, asOf: '2026-11-09' },
  usdchf: { value: 0.8795, percentile10y: 0.99, asOf: '2026-11-09' },
  usdcny: { value: 7.1025, percentile10y: 0.12, asOf: '2026-11-09' },
  audusd: { value: 0.6585, percentile10y: 0.28, asOf: '2026-11-09' },
  audjpy: { value: 98.94, percentile10y: 0.33, asOf: '2026-11-09' },
  audnzd: { value: 1.2283, percentile10y: 0.98, asOf: '2026-11-09' },
};

/** The Currencies projection: the placement's own reading order (14 home
 *  readings, no mirrors), every card present in public mode (absentIds
 *  empty). The boards field declares the fx board (the placement §14). */
function currenciesProjectionFixture(): PageProjection {
  const readings: IndicatorReading[] = pageReadingIds('currencies').map((id) => reading(id, CARD_OVERRIDES[id] ?? {}));
  return {
    page: 'currencies',
    generatedAt: '2026-11-09T20:10:18.486Z',
    displayMode: 'public',
    readings,
    absentIds: [],
    boards: ['fx'],
  };
}

/** One contract-valid fx pair row. */
function fxPairRow(id: string, partial: Partial<FxSnapshot['pairs'][number]> = {}): FxSnapshot['pairs'][number] {
  const weekly: Array<[number, number]> = [[2144, 1]];
  for (let i = 1; i < 52; i++) weekly.push([7, 1 + i * 0.0001]);
  return {
    id: id as FxSnapshot['pairs'][number]['id'],
    asOf: '2026-11-09',
    rate: 1.1234,
    chg: { d1: -0.12, m1: -0.92, m3: -3.27, y1: -3.19 },
    moveRank: 35.16,
    bigMove: false,
    source: 'frankfurter',
    stale: false,
    weekly: weekly as FxSnapshot['pairs'][number]['weekly'],
    ...partial,
  };
}

/** One contract-valid rule state. */
function fxRuleRow(id: string, partial: Partial<FxSnapshot['rules'][number]> = {}): FxSnapshot['rules'][number] {
  return {
    id: id as FxSnapshot['rules'][number]['id'],
    outcome: 'quiet',
    counted: false,
    numbers: {},
    confirmedBy: [],
    progress: 0,
    legs: [],
    pattern: { status: 'holding', agreeWeeks: 9, ofWeeks: 13, weeks: [] },
    chart: { expect: 'together', series: [] },
    ...partial,
  };
}

/** A contract-valid fx board: 11 pairs (D-42) + 7 rules covering every
 *  outcome shape the page must render (warning + chip, watch, supportive,
 *  the R4 wobble, the R7 context leads, a downgraded warning, nodata). */
function fxSnapshotFixture(): FxSnapshot {
  const pairs = CURRENCIES_BOARD_PAIR_IDS.map((id) =>
    fxPairRow(id, id === 'eurchf' ? { moveRank: 92.4, bigMove: true } : id === 'audnzd' ? { rate: 1.2283, asOf: '2026-10-28', stale: true } : {}),
  );
  const rules: FxSnapshot['rules'] = [
    fxRuleRow('r1_risk_mood', { outcome: 'warning', counted: true, progress: 100, numbers: { audjpy_m1: -4.1 } }),
    fxRuleRow('r2_carry_trade', { outcome: 'watch', progress: 42 }),
    fxRuleRow('r3_dollar_strength', { outcome: 'supportive', variant: 'm1', numbers: { dollar_m1: -3.4, dollar_m3: -2.1 } }),
    fxRuleRow('r4_money_hiding', { outcome: 'watch', downgraded: true, variant: 'wobble', progress: 61 }),
    fxRuleRow('r5_china_link', { outcome: 'quiet' }),
    fxRuleRow('r6_europe_worry', { outcome: 'nodata' }),
    fxRuleRow('r7_dollar_or_euro', { outcome: 'context', variant: 'dollar-led', numbers: { eurusd_m1: -3.1, dollar_m1: 2.6 } }),
  ];
  return {
    v: 1,
    generatedAt: '2026-11-09T08:50:19.106Z',
    dollarMeasure: {
      asOf: '2026-11-09',
      value: 102.05955,
      chg: { d1: 0.47, m1: 0.25, m3: 2.32, y1: 2.23 },
      weekly: [[2144, 100]],
    },
    pairs,
    rules,
    summary: { signal: 'attention', countedWarnings: 1, headlineRule: 'r1_risk_mood' },
    plain: { dollarYearExtreme: null, movers: { EUR: -0.92 } },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function notFound(): Response {
  return jsonResponse({ error: { code: 'not_found', message: 'nope' } }, 404);
}

/** Route the stubbed fetch: the Currencies projection + the fx board (the
 *  page's TWO feeds). */
function stubFeeds(overrides: { projection?: () => Response; fx?: () => Response } = {}): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/insights/pages/currencies')) return (overrides.projection ?? (() => jsonResponse(currenciesProjectionFixture())))();
      if (url.includes('/api/insights/fx')) return (overrides.fx ?? (() => jsonResponse(fxSnapshotFixture())))();
      return notFound();
    }),
  );
}

/** Seat the SPA at a route (the router reads window.location.pathname). */
function atRoute(path: string): void {
  window.history.pushState(null, '', path);
}

beforeEach(() => {
  clearProjectionCacheForTests();
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

describe('CurrenciesPage', () => {
  it('fixture sanity: both fixtures satisfy their contracts', () => {
    expect(() => PageProjectionSchema.parse(currenciesProjectionFixture())).not.toThrow();
    expect(() => FxSnapshotSchema.parse(fxSnapshotFixture())).not.toThrow();
    expect(fxSnapshotFixture().pairs).toHaveLength(11);
    expect(fxSnapshotFixture().rules).toHaveLength(7);
  });

  it('renders the honest loading line before the projection arrives', () => {
    vi.stubGlobal('fetch', vi.fn(async () => notFound()));
    atRoute('/currencies');
    const { container } = render(<CurrenciesPage />);
    expect(container.querySelector('[role="status"]')).not.toBeNull();
  });

  it('renders the shell + the 7 rule lights + the 11-pair board + the two card sections over the real derivations', async () => {

    atRoute('/currencies');
    stubFeeds();
    render(<CurrenciesPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-currencies-section="rules"]')).not.toBeNull();
    });

    // S19 (2026-11-12): the wayfinding row — Home › Currency Pairs (BD-S19b).
    expect(document.querySelector('[data-page-breadcrumbs] [aria-current=\'page\']')?.textContent).toBe('Currency Pairs');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');

    // The shell: title + purpose + the data-as-of line. The In-build chip
    // is RETIRED (S18's gate pass — the one-session trajectory); it must
    // NOT render on the Currencies page.
    const h1 = document.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1!.textContent).toMatch(/Currency Pairs/i);
    expect(document.body.textContent).toContain('Data as of');

    /* ---- the 7 rule lights (D-41) ---- */
    const lights = document.querySelectorAll('[data-currencies-rule]');
    expect(lights).toHaveLength(7);
    const lightIds = Array.from(lights).map((el) => el.getAttribute('data-currencies-rule'));
    expect(lightIds).toEqual(['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7']);
    // r1: a warning light — the Active status word + the Needs-attention
    // chip + the warning headline sentence.
    const r1 = document.querySelector('[data-currencies-rule="r1"]')!;
    expect(r1.getAttribute('data-currencies-rule-outcome')).toBe('warning');
    expect(r1.textContent).toContain('Active');
    expect(r1.textContent).toContain('Needs attention');
    expect(r1.querySelector('[data-currencies-rule-headline]')?.textContent).toBe('Investors look nervous');
    expect(r1.textContent).toContain('Nervous or relaxed?');
    // r2: a watch light — the Watching status word + the watch headline.
    const r2 = document.querySelector('[data-currencies-rule="r2"]')!;
    expect(r2.textContent).toContain('Watching');
    expect(r2.querySelector('[data-currencies-rule-headline]')?.textContent).toBe('The yen is very weak');
    // r3: a supportive light — Active + the Normal chip + the supportive
    // headline.
    const r3 = document.querySelector('[data-currencies-rule="r3"]')!;
    expect(r3.querySelector('[data-currencies-rule-chip="normal"]')).not.toBeNull();
    expect(r3.querySelector('[data-currencies-rule-headline]')?.textContent).toBe('The dollar is getting much weaker');
    // r4: a DOWNGRADED wobble — the Watching word + the KEPT warning
    // (wobble) headline + the caution line.
    const r4 = document.querySelector('[data-currencies-rule="r4"]')!;
    expect(r4.getAttribute('data-currencies-rule-downgraded')).toBe('true');
    expect(r4.textContent).toContain('Watching');
    expect(r4.querySelector('[data-currencies-rule-headline]')?.textContent).toBe('Money is leaving even the dollar');
    expect(r4.querySelector('[data-currencies-rule-caution]')).not.toBeNull();
    // r6: nodata — the noData word, NO headline.
    const r6 = document.querySelector('[data-currencies-rule="r6"]')!;
    expect(r6.querySelector('[data-currencies-rule-nodata]')?.textContent).toBe('Not enough data right now');
    expect(r6.querySelector('[data-currencies-rule-headline]')).toBeNull();
    // r7: the context card — the dollar-led headline.
    const r7 = document.querySelector('[data-currencies-rule="r7"]')!;
    expect(r7.querySelector('[data-currencies-rule-headline]')?.textContent).toBe('Mostly a dollar story');
    // The everyday explanation + the reliability line ride every
    // non-nodata light.
    expect(r1.textContent).toContain('When people get scared');
    expect(r2.textContent).toContain('Held in 9 of the last 13 weeks');

    /* ---- the 11-pair board (D-42) ---- */
    const board = document.querySelector('[data-currencies-section="board"]')!;
    const pairCards = board.querySelectorAll('[data-currencies-pair]');
    expect(pairCards).toHaveLength(11);
    const pairIds = Array.from(pairCards).map((el) => el.getAttribute('data-currencies-pair'));
    expect(pairIds).toEqual([...CURRENCIES_BOARD_PAIR_IDS] as string[]);
    expect(pairIds![pairIds!.length - 1]).toBe('audnzd');
    // eurusd: the rate + the four signed changes + the move rank + the
    // 52-week chart.
    const eurusd = board.querySelector('[data-currencies-pair="eurusd"]')!;
    expect(eurusd.querySelector('[data-currencies-pair-rate]')?.textContent).toBe('1.1234');
    expect(eurusd.textContent).toContain('−0.9%'); // the m1 change (1dp, the legacy signedPct)
    expect(eurusd.querySelector('[data-currencies-pair-moverank]')?.textContent).toBe('35');
    expect(eurusd.querySelector('svg')).not.toBeNull(); // the 52-week chart
    expect(eurusd.getAttribute('data-currencies-pair-big-move')).toBeNull();
    // eurchf: the bigMove flag earns the tag.
    const eurchf = board.querySelector('[data-currencies-pair="eurchf"]')!;
    expect(eurchf.getAttribute('data-currencies-pair-big-move')).toBe('true');
    expect(eurchf.textContent).toContain('Unusually large move');
    // audnzd: the 11th pair + the honest stale tag (the old-data word).
    const audnzd = board.querySelector('[data-currencies-pair="audnzd"]')!;
    expect(audnzd.querySelector('[data-currencies-pair-rate]')?.textContent).toBe('1.2283');
    expect(audnzd.getAttribute('data-currencies-pair-stale')).toBe('true');
    expect(audnzd.textContent).toContain('Old data');
    // The board's ECB footer line.
    expect(board.textContent).toContain('European Central Bank (ECB) reference rates');

    /* ---- the two registry-card sections (D-32/D-42) ---- */
    const pairsSection = document.querySelector('[data-currencies-section="pairs"]');
    const standingSection = document.querySelector('[data-currencies-section="dollar-standing"]');
    expect(pairsSection).not.toBeNull();
    expect(standingSection).not.toBeNull();
    expect(pairsSection!.querySelectorAll('[data-currencies-card]').length).toBe(CURRENCIES_PAIR_CARD_IDS.length);
    expect(standingSection!.querySelectorAll('[data-currencies-card]').length).toBe(CURRENCIES_DOLLAR_STANDING_IDS.length);
    // The §21 trio spot checks (the DISPLAY registry's own joins):
    // usdtry's try unit is PREFIXED in EN ('₺34.56').
    const usdtry = standingSection!.querySelector('[data-currencies-card="usdtry"]')!;
    expect(usdtry.querySelector('[data-currencies-value]')?.textContent).toBe('₺34.56');
    expect(usdtry.textContent).toContain('high');
    // usdaed's AED unit SUFFIXES with a space in EN ('3.67 AED').
    const usdaed = standingSection!.querySelector('[data-currencies-card="usdaed"]')!;
    expect(usdaed.querySelector('[data-currencies-value]')?.textContent).toBe('3.67 AED');
    // usd-reserve-share's percent binds tight ('56.70%') + the low band.
    const reserve = standingSection!.querySelector('[data-currencies-card="usd-reserve-share"]')!;
    expect(reserve.querySelector('[data-currencies-value]')?.textContent).toBe('56.70%');
    expect(reserve.textContent).toContain('low');
    // dollar-basket's index word suffixes ('101.85 index').
    const basket = standingSection!.querySelector('[data-currencies-card="dollar-basket"]')!;
    expect(basket.querySelector('[data-currencies-value]')?.textContent).toBe('101.85 index');
    // audnzd's nzd unit is PREFIXED in EN ('NZ$1.2283').
    const audnzdCard = pairsSection!.querySelector('[data-currencies-card="audnzd"]')!;
    expect(audnzdCard.querySelector('[data-currencies-value]')?.textContent).toBe('NZ$1.2283');

    // The whole-registry audit: 14 cards render, in the page's §12
    // layout order (the pair-context section above the dollar-standing
    // section — the placement's own GROUP order is the projection's
    // reading order, not the page's render order), and the rendered set
    // equals CURRENCIES_CARD_IDS exactly.
    expect(document.querySelectorAll('[data-currencies-card]').length).toBe(14);
    const renderedIds = Array.from(document.querySelectorAll('[data-currencies-card]')).map((el) => el.getAttribute('data-currencies-card'));
    expect(renderedIds).toEqual([...CURRENCIES_PAIR_CARD_IDS, ...CURRENCIES_DOLLAR_STANDING_IDS] as string[]);
    expect([...renderedIds].sort()).toEqual([...CURRENCIES_CARD_IDS].sort());

    // The In-build chip is RETIRED AND no "in build" claim remains — the
    // page's cards are complete and verified (the S18 gates pass, the
    // S16/S17 one-session trajectory).
    expect(document.body.textContent ?? '').not.toContain('In build');
  });

  it('the fail-closed path: an absent card reading renders the unavailable word, never a guess', async () => {
    atRoute('/currencies');
    // usd-reserve-share is honestly absent (a licence-hidden id) — the
    // projection reports it in absentIds and the card speaks the word.
    const fixture = currenciesProjectionFixture();
    const readings = fixture.readings.filter((r) => (r.id as string) !== 'usd-reserve-share');
    stubFeeds({
      projection: () =>
        jsonResponse({
          ...fixture,
          readings,
          absentIds: ['usd-reserve-share'],
        }),
    });
    render(<CurrenciesPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-currencies-card="usd-reserve-share"]')).not.toBeNull();
    });
    const reserve = document.querySelector('[data-currencies-card="usd-reserve-share"]')!;
    expect(reserve.getAttribute('data-currencies-status')).toBe('absent');
    expect(reserve.querySelector('[data-currencies-value]')).toBeNull();
    expect(reserve.textContent).toMatch(/\S/); // non-empty honesty line
    // The 14 cards still render (the absent one speaks the word).
    expect(document.querySelectorAll('[data-currencies-card]')).toHaveLength(14);
    // The absent note speaks (the projection's own honest report).
    expect(document.body.textContent).toMatch(/1\s+of this page/);
  });

  it('the fail-closed path: a dead fx feed renders the calm "being prepared" line, never an error', async () => {
    atRoute('/currencies');
    stubFeeds({ fx: () => jsonResponse({ error: { code: 'fx_not_ready', message: 'nope' } }, 503) });
    render(<CurrenciesPage />);
    await waitFor(() => {
      expect(document.querySelector('[data-currencies-fx-empty]')).not.toBeNull();
    });
    // The calm line speaks; the registry cards still render; no rule
    // lights, no board (the fx feed is absent, never faked).
    expect(document.querySelector('[data-currencies-fx-empty]')?.textContent).toContain('being prepared');
    expect(document.querySelectorAll('[data-currencies-card]').length).toBe(14);
    expect(document.querySelectorAll('[data-currencies-rule]').length).toBe(0);
    expect(document.querySelectorAll('[data-currencies-pair]').length).toBe(0);
  });

  it('the fail-closed path: a dead projection with no cache renders the honest error state + the retry', async () => {
    atRoute('/currencies');
    stubFeeds({ projection: () => jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503) });
    render(<CurrenciesPage />);
    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeTruthy();
    });
    await waitFor(() => {
      expect(document.body.textContent?.toLowerCase()).toMatch(/unavailable|error|try/);
    });
    // Nothing is faked — no cards, no lights.
    expect(document.querySelectorAll('[data-currencies-card]').length).toBe(0);
    expect(document.querySelectorAll('[data-currencies-rule]').length).toBe(0);
  });

  it('the M-17 last-good path: a failed refresh after a good load keeps the page on screen, labelled', async () => {
    atRoute('/currencies');
    stubFeeds();
    render(<CurrenciesPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-currencies-card]').length).toBe(14);
    });
    cleanup();
    vi.unstubAllGlobals();
    // A fresh page load (the module promise cache resets with the page;
    // the localStorage last-good copy persists — the M-17 offline
    // fallback). The fx cache keeps the last good board too.
    clearProjectionCacheForTests();
    // Second visit: the projection feed dies (the fx feed stays up).
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/insights/fx')) return jsonResponse(fxSnapshotFixture());
        return jsonResponse({ error: { code: 'store_empty', message: 'empty' } }, 503);
      }),
    );
    render(<CurrenciesPage />);
    await waitFor(() => {
      expect(document.querySelectorAll('[data-currencies-card]').length).toBe(14);
    });
    await waitFor(() => {
      expect(document.body.textContent).toContain('Showing the last good copy');
    });
    expect(document.querySelector('[data-currencies-cached]')).not.toBeNull();
    // The cached fx board still renders its lights + pairs.
    expect(document.querySelectorAll('[data-currencies-rule]').length).toBe(7);
    expect(document.querySelectorAll('[data-currencies-pair]').length).toBe(11);
  });

  it('the fa/RTL rendering: the Persian title + the Persian section headings + the Persian card value joins', async () => {
    // The fa locale rides the app's own locale store (the I18nApi's
    // setter — the same door the language switch uses).
    const { useI18n } = await import('../../lib/locale');
    function SetLocale({ locale }: { locale: 'en' | 'fa' }): React.JSX.Element | null {
      const { setLocale } = useI18n();
      useEffect(() => {
        setLocale(locale);
      }, [locale, setLocale]);
      return null;
    }
    atRoute('/currencies');
    stubFeeds();
    const { unmount } = render(
      <>
        <SetLocale locale="fa" />
        <CurrenciesPage />
      </>,
    );
    try {
      await waitFor(() => {
        expect(document.querySelector('[data-currencies-section="rules"]')).not.toBeNull();
      });
      // The page title in the corpus's Persian (resilient — assert the h1
      // contains Persian-script characters rather than the exact string).
      const h1 = document.querySelector('h1');
      expect(h1).not.toBeNull();
      expect(h1!.textContent ?? '').toMatch(/[\u0600-\u06FF]/);
      // A section heading in Persian (the rules hero's h2 carries Persian
      // characters).
      const rulesHeading = document.querySelector('[data-currencies-section="rules"] h2')?.textContent ?? '';
      expect(rulesHeading).not.toBe('');
      expect(rulesHeading).toMatch(/[\u0600-\u06FF]/);
      // The r1 warning headline in the corpus's Persian.
      const r1 = document.querySelector('[data-currencies-rule="r1"]')!;
      expect(r1.querySelector('[data-currencies-rule-headline]')?.textContent).toBe('سرمایه‌گذاران نگران به نظر می‌رسند');
      // The usdtry value in Persian digits + the fa try suffix word
      // ('۳۴٫۵۶ لیر ترکیه' — the currency units suffix in fa).
      const usdtry = document.querySelector('[data-currencies-card="usdtry"]')!;
      expect(usdtry.querySelector('[data-currencies-value]')?.textContent).toBe('\u06F3\u06F4\u066B\u06F5\u06F6 \u0644\u06CC\u0631 \u062A\u0631\u06A9\u06CC\u0647');
      // The audnzd pair value ('۱٫۲۲۸۳ دلار نیوزیلند').
      const audnzdCard = document.querySelector('[data-currencies-card="audnzd"]')!;
      expect(audnzdCard.querySelector('[data-currencies-value]')?.textContent).toBe('\u06F1\u066B\u06F2\u06F2\u06F8\u06F3 \u062F\u0644\u0627\u0631 \u0646\u06CC\u0648\u0632\u06CC\u0644\u0646\u062F');
      // The RTL document direction rides the store's own apply().
      expect(document.documentElement.dir).toBe('rtl');
    } finally {
      unmount();
      cleanup();
      const { useI18n: useI18n2 } = await import('../../lib/locale');
      const Probe = (): React.JSX.Element | null => {
        const { setLocale } = useI18n2();
        useEffect(() => {
          setLocale('en');
        }, [setLocale]);
        return null;
      };
      render(<Probe />);
    }
  });
});
