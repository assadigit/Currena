/**
 * @vitest-environment jsdom
 *
 * TrendChart.test.tsx — GPE R01 (wave 0, D6-A relabel-now): the decade
 * range chip states its TRUE window, never the requested 10 years.
 *
 * What is pinned:
 *   - trendRangeWord (pure): the 10y word is the span the loaded series
 *     actually carries (a 1,900-day bounded feed → "5.2 years"; a full
 *     10-year feed → "10 years"); the other ranges keep their dictionary
 *     words; a too-short decade series falls back to the dictionary word
 *     (never a guess).
 *   - the panel (DOM): the fourth chip renders the computed word and the
 *     signed window delta reads the SAME word — "+X% 5.2 years", never
 *     "+X% 10 years" over a 5.2-year feed (the GPE-S2-01 defect class).
 *
 * House discipline (prices-cards.test.tsx's own): stubbed fetch per test —
 * tests NEVER hit live sites; the history endpoint serves dense synthetic
 * series shaped exactly like the public feed (the 1,900-day bound's own
 * slice, apps/api/src/routes/insights.ts PUBLIC_HISTORY_WINDOW_DAYS).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { IndicatorId } from '@currena/core';
import { insightsCopyEn } from '../i18n/insights-copy-en';
import { TREND_RANGES, TrendPanel, trendRangeWord, trendTickFormatter } from './TrendChart';

/** Today's epoch day — the synthetic series end at "now". */
const T = Math.floor(Date.now() / 86_400_000);

/** A dense daily series spanning `days` back from today (the public feed
 * shape: [epochDay, value] pairs, one per day). */
function series(days: number, startValue = 1790, endValue = 3873): [number, number][] {
  const points: [number, number][] = [];
  for (let d = T - days + 1; d <= T; d += 1) {
    const t = (d - (T - days + 1)) / Math.max(days - 1, 1);
    points.push([d, startValue + t * (endValue - startValue)]);
  }
  return points;
}

function historyResponse(points: [number, number][]): Response {
  return new Response(JSON.stringify({ v: 1, id: 'gold-usd', points }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

const EN = insightsCopyEn.ui;

describe('trendRangeWord (R01: the true window)', () => {
  it('the decade range states the span the feed carries — 1,900 days → 5.2 years', () => {
    // The public-history bound: PUBLIC_HISTORY_WINDOW_DAYS = 1900 (~5.2y).
    expect(trendRangeWord('10y', series(1900), 'en-US', EN)).toBe('5.2 years');
  });

  it('a full 10-year feed reads "10 years" — the word self-corrects (F7/R18)', () => {
    expect(trendRangeWord('10y', series(3653), 'en-US', EN)).toBe('10 years');
  });

  it('a shorter feed states its own true span (never overstates)', () => {
    // 1,461 days = 4.0 years — a young series is labelled what it is.
    expect(trendRangeWord('10y', series(1461), 'en-US', EN)).toBe('4 years');
  });

  it('the other ranges keep their dictionary words', () => {
    const pts = series(1900);
    expect(trendRangeWord('quarter', pts, 'en-US', EN)).toBe(EN.rangeQuarter);
    expect(trendRangeWord('1y', pts, 'en-US', EN)).toBe(EN.range1y);
    expect(trendRangeWord('5y', pts, 'en-US', EN)).toBe(EN.range5y);
  });

  it('a too-short decade series falls back to the dictionary word (never a guess)', () => {
    // <2 plottable points: the chip is disabled and the word falls back.
    expect(trendRangeWord('10y', [], 'en-US', EN)).toBe(EN.range10y);
    expect(trendRangeWord('10y', series(1), 'en-US', EN)).toBe(EN.range10y);
  });

  it('TREND_RANGES keeps the canonical four-range order (the chip contract)', () => {
    expect(TREND_RANGES).toEqual(['quarter', '1y', '5y', '10y']);
  });
});

describe('TrendPanel (R01: the chip + the delta read the true window)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => historyResponse(series(1900))),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('the fourth chip reads the computed span, and the delta names the same horizon', async () => {
    render(
      <TrendPanel
        id={'gold-usd' as IndicatorId}
        copy={insightsCopyEn}
        numberLocale="en-US"
        ariaLabelFor={(range, word) => `${range}: ${word}`}
        formatValue={(v) => `${v}`}
        formatTickValue={trendTickFormatter('en-US')}
        ranges={TREND_RANGES}
      />,
    );
    // The chips render once the history resolves.
    await waitFor(() => {
      expect(screen.getAllByRole('button').some((b) => b.textContent === '5.2 years')).toBe(true);
    });
    // The delta beside the chips names the SAME horizon (the active range
    // is 'quarter' by default — click the decade chip first).
    const decade = screen
      .getAllByRole('button')
      .find((b) => b.textContent === '5.2 years')!;
    decade.click();
    await waitFor(() => {
      expect(document.querySelector('[data-trend-delta="gold-usd"]')?.textContent).toMatch(
        /\+1\d\d(\.\d)?% 5\.2 years/,
      );
    });
    // The mislabeled "10 years" word never appears over a 5.2-year feed.
    expect(document.body.textContent).not.toContain('10 years');
  });
});
