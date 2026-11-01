/**
 * @vitest-environment jsdom
 *
 * freshness-line.test.tsx — the P1 page-honesty safety net
 * (docs/insights/layer2/INSIGHTS-L2-PREP-SPEC.md §3.4):
 *
 *   where a reading is stale or unavailable, a small muted "Data as of
 *   {date}" line renders — ONLY if the card does not already say so.
 *
 * "Already says so" is resolved conservatively (D-22): the status-stale
 * cards carry the grey flag + the "stale, N days old" meta segment, and
 * EVERY card's meta row carries its "Data for {date}" segment — so the
 * line fires only for readings whose P1 FRESHNESS is stale/unavailable
 * while their status stays presentable (a future frozen feed with a
 * widened status override, or a future surface without the meta row).
 * Today that set is empty — the last test pins that invariant against
 * the visual fixtures.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import type { IndicatorReading } from '@currena/core';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { CardMetaRow, freshnessAsOfLineOf } from './CardMeta';

const NOW = '2026-10-28T04:10:00.000Z';

/** A minimal but valid reading shape for the meta row (asOf drives everything). */
function readingOf(overrides: Partial<IndicatorReading> & { id: IndicatorReading['id'] }): IndicatorReading {
  return {
    value: 1.25,
    asOf: '2026-10-27',
    change30d: 0.1,
    status: 'normal',
    sourceName: 'Test Source',
    sourceUrl: 'https://example.org',
    updatedAt: NOW,
    ...overrides,
  } as IndicatorReading;
}

describe('P1 freshness line — the pure gate', () => {
  it('null for a fresh reading', () => {
    expect(freshnessAsOfLineOf(readingOf({ id: 'vix' }), NOW)).toBeNull();
  });

  it('null for a status-stale reading — the card already flags and ages it', () => {
    expect(
      freshnessAsOfLineOf(readingOf({ id: 'vix', asOf: '2026-10-01', status: 'stale' }), NOW),
    ).toBeNull();
  });

  it('null for an unavailable reading — no date exists; the face reason owns it', () => {
    expect(
      freshnessAsOfLineOf(readingOf({ id: 'vix', value: null, asOf: null, status: 'unavailable' }), NOW),
    ).toBeNull();
  });

  it('renders for a freshness-stale reading whose status stays presentable (the safety net)', () => {
    // us10y: daily, no staleAfterDays override → 4-day default. 20 days old
    // but the (constructed) status says normal — the line must fire.
    expect(freshnessAsOfLineOf(readingOf({ id: 'us10y', asOf: '2026-10-08' }), NOW)).toEqual({
      freshness: 'stale',
    });
  });

  it('the AU trio at the live September asOf is fresh (monthly refinement, D-21)', () => {
    for (const id of ['au-10y', 'rba-expectations', 'au-us-10y-gap'] as const) {
      expect(freshnessAsOfLineOf(readingOf({ id, asOf: '2026-09-30' }), NOW)).toBeNull();
    }
  });
});

describe('P1 freshness line — the rendered line (EN + FA)', () => {
  // Deterministic clock (the briefing.test.tsx pattern): the rendered
  // component reads the VISITOR's clock (new Date() inside
  // FreshnessAsOfLine), so the "nothing extra for a fresh reading"
  // invariant is only true while the fixture's asOf (2026-10-27) is
  // young. Pin NOW so the suite stays green as real time marches on
  // (it broke at the 2026-11-01 UTC midnight crossing).
  beforeEach(() => {
    vi.setSystemTime(new Date(NOW));
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('renders the muted line with the data marker when it fires', () => {
    const { container } = render(
      <CardMetaRow reading={readingOf({ id: 'us10y', asOf: '2026-10-08' })} copy={insightsCopyEn} numberLocale="en-US" />,
    );
    const line = container.querySelector('[data-freshness-asof="stale"]');
    expect(line?.textContent).toContain('Data as of');
    // the meta row itself is untouched beside it
    expect(container.querySelector('[data-meta-row]')).not.toBeNull();
  });

  it('renders the Persian line, RTL-safe wording, when it fires', () => {
    const { container } = render(
      <CardMetaRow reading={readingOf({ id: 'us10y', asOf: '2026-10-08' })} copy={insightsCopyFa} numberLocale="fa-IR" />,
    );
    const line = container.querySelector('[data-freshness-asof="stale"]');
    expect(line?.textContent).toContain('آخرین داده:');
    // The {date} renders through the fa locale formatter — Persian-calendar
    // digits at render (the template string itself carries none).
    expect(line?.textContent).toMatch(/[\u06F0-\u06F9]/);
    expect(line?.textContent).not.toContain('{date}');
  });

  it('renders nothing extra for a fresh reading (byte-for-byte the old meta row)', () => {
    const { container } = render(
      <CardMetaRow reading={readingOf({ id: 'vix' })} copy={insightsCopyEn} numberLocale="en-US" />,
    );
    expect(container.querySelector('[data-freshness-asof]')).toBeNull();
    expect(container.querySelectorAll('p')).toHaveLength(1);
  });
});
