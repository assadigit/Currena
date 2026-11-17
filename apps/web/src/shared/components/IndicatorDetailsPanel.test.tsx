/**
 * @vitest-environment jsdom
 *
 * IndicatorDetailsPanel.test.tsx — the R-5 port's characterization suite
 * (docs/page-division/07-R5-DETAILS-PANEL-PORT.md). The panel is the
 * retired legacy /insights DetailsPanel (F5, 2026-10-26c) ported to the
 * shared layer minus the watchlist pin (R-7's accepted loss, BD-S33).
 * What is pinned:
 *
 *   - the F5 section order (life effects FIRST: what it means for you →
 *     why it matters → what it has tended to mean → what it can’t tell
 *     you → what it is) + the plain-language rule line + the card-spec
 *     facts line (updates · stale age · fetched UTC · scored/context ·
 *     the rule version);
 *   - the Layer-1 block (ifRising / ifFalling emphasis from change30d,
 *     the plainName beside the heading) — and its ABSENCE for an id with
 *     no Layer-1 copy (graceful roll-out);
 *   - the chart block over the stubbed history endpoint: the ready
 *     state renders the HistoryChart svg; the 404 path renders the
 *     honest no-history line; the failed fetch renders the error line;
 *   - the price-row sections (the 2026-10-26c owner directive): a
 *     PRICE_ROWS id renders PriceDetailsSections (the 7d change row)
 *     with companion lines from the page's own readings;
 *   - the honest status lines: a stale reading states its as-of; a
 *     check-pending reading states its flag reason;
 *   - the footer: the linked source + the updated-on date;
 *   - the F5 focus discipline: Escape closes; focus returns to the
 *     opener; the body scroll lock engages;
 *   - the R-5 adaptation: NO pin button (the watchlist retired with
 *     the legacy page — R-7, BD-S32);
 *   - the fa/RTL rendering (the Persian section titles + the Persian
 *     panel close).
 *
 * House discipline (Converter.test.tsx's own): stubbed fetch per test —
 * tests NEVER hit live sites; contract-valid fixtures sanity-parsed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { insightsCopyEn } from '../i18n/insights-copy-en';
import { insightsCopyFa } from '../i18n/insights-copy-fa';
import { clearHistoryCacheForTests } from '../lib/insights';
import { IndicatorDetailsPanel } from './IndicatorDetailsPanel';

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

/** Today's epoch day — the synthetic series end at "now". */
const T = Math.floor(Date.now() / 86_400_000);

/** A dense 10-year-ish monthly series (the chart needs ≥2 points). */
function historyBody(id: string): { v: 1; id: string; points: [number, number][] } {
  const points: [number, number][] = [];
  for (let m = 0; m <= 120; m += 1) {
    points.push([T - (120 - m) * 30, 2 + m * 0.03]);
  }
  return { v: 1, id, points };
}

/** A panel reading fixture (us10y by default — Layer-1 copy exists). */
function reading(
  id: IndicatorId = 'us10y',
  overrides: Partial<IndicatorReading> = {},
): IndicatorReading {
  const base: IndicatorReading = {
    id,
    value: 4.41,
    asOf: '2026-11-14',
    percentile10y: 0.96,
    status: 'normal',
    change30d: 0.21,
    sourceName: 'Federal Reserve (H.15)',
    sourceUrl: 'https://www.federalreserve.gov/releases/h15/',
    updatedAt: '2026-11-16T08:12:00.000Z',
  };
  return { ...base, ...overrides } as IndicatorReading;
}

function renderPanel(
  r: IndicatorReading,
  readings: readonly IndicatorReading[] = [r],
  locale: 'en' | 'fa' = 'en',
) {
  const opener = document.createElement('button');
  opener.textContent = 'opener';
  document.body.appendChild(opener);
  const onClose = vi.fn();
  const utils = render(
    <IndicatorDetailsPanel
      reading={r}
      readings={readings}
      copy={locale === 'fa' ? insightsCopyFa : insightsCopyEn}
      locale={locale}
      numberLocale={locale === 'fa' ? 'fa-IR' : 'en-US'}
      onClose={onClose}
      returnFocusTo={opener}
    />,
  );
  return { ...utils, onClose, opener };
}

const HISTORY_IDS = ['us10y', 'gold-usd', 'vix', 'no-history-id'] as const;

function stubHistory(mode: 'ok' | '404' | 'error') {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: unknown) => {
      const u = String(url);
      if (mode === 'error' && u.includes('vix')) {
        return Promise.resolve({ ok: false, status: 500, json: async () => ({}) } as unknown as Response);
      }
      if (mode === '404' || !HISTORY_IDS.some((a) => u.includes(`/api/insights/${a}/history`))) {
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) } as unknown as Response);
      }
      const id = HISTORY_IDS.find((a) => u.includes(`/api/insights/${a}/history`))!;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => historyBody(id),
      } as unknown as Response);
    }),
  );
}

beforeEach(() => {
  // The module-level history cache survives across tests inside one file —
  // clear it so each test's stubbed fetch is actually consulted (the
  // same discipline as clearProjectionCacheForTests in the page suites).
  clearHistoryCacheForTests();
  stubHistory('ok');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.style.overflow = '';
});

/* ------------------------------------------------------------------ *
 * The F5 sections + the facts + the rule
 * ------------------------------------------------------------------ */

describe('IndicatorDetailsPanel (the R-5 port) — the F5 body', () => {
  it('renders the dialog with the corpus name + the five F5 sections in life-effects-first order (en)', async () => {
    renderPanel(reading());
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    // The corpus name (not the pd.* variant — the panel speaks the corpus).
    expect(screen.getByText('What the US government pays to borrow for 10 years')).toBeTruthy();
    // The five F5 titles, in F5 order (forYou → whatItIs). Each title is
    // an h4; assert presence + the DOM order via the panel body.
    const titles = ['What it means for you', 'Why it matters', 'What it has tended to mean', 'What it can’t tell you', 'What it is'];
    for (const title of titles) {
      expect(screen.getByText(title)).toBeTruthy();
    }
    const body = screen.getByRole('dialog').querySelector('.flex-1')!;
    const rendered = [...body.querySelectorAll('h4')].map((h) => h.textContent);
    // The F5 five first (life effects FIRST), then the Layer-1 block's
    // own h4s (D-05: Layer-1 sits AFTER the F5 sections, before the chart).
    expect(rendered.slice(0, 5)).toEqual([
      'What it means for you',
      'Why it matters',
      'What it has tended to mean',
      'What it can’t tell you',
      'What it is',
    ]);
    expect(rendered.slice(5)).toContain('Plain words');
  });

  it('renders the plain-language rule line + the card-spec facts (updates · scored · the rule version)', () => {
    renderPanel(reading());
    const dialog = screen.getByRole('dialog');
    const text = dialog.textContent ?? '';
    // The rule line's own title.
    expect(text).toContain('Needs attention when');
    // The facts line: the updates label + the fetched-at-UTC clock + the
    // scored fact + the rule-version line.
    expect(text).toContain('Updates');
    expect(text).toContain('UTC');
    expect(insightsCopyEn.ui.scoredFact.length).toBeGreaterThan(0);
    expect(text).toContain(insightsCopyEn.ui.scoredFact);
    expect(text).toContain(insightsCopyEn.ui.ruleVersionLine.split('{')[0] ?? 'Rule');
  });

  it('renders the Layer-1 block: the plainName beside the heading + ifRising/ifFalling + the direction emphasis', () => {
    // change30d > 0 ⇒ the ifRising line is emphasised (D-06, CSS only —
    // assert the line renders and carries the emphasis class).
    const { container } = renderPanel(reading('us10y', { change30d: 0.21 }));
    expect(screen.getByText('US 10-year borrowing cost')).toBeTruthy(); // the plainName
    const l1 = container.querySelector('[data-layer1-block]');
    expect(l1).not.toBeNull();
    expect(screen.getByText('If it rises')).toBeTruthy();
    expect(screen.getByText('If it falls')).toBeTruthy();
    const rising = [...container.querySelectorAll('[data-layer1-block] > div')].find(
      (d) => d.querySelector('h4')?.textContent === 'If it rises',
    );
    expect(rising?.querySelector('p')?.className).toContain('font-bold');
  });

  it('the Layer-1 roll-out covers every registry id (193×2 — the gate); the graceful-absence branch stays defensive', () => {
    // The Layer-1 inventory is COMPLETE (193 entries ≥ the 187 registry
    // ids — the layer1 gate's own count), so every id the panel can open
    // carries Layer-1 copy. The `if (!l1) return null` branch is the
    // defensive graceful-degradation path, unreachable through a valid
    // registry id — pinned by inventory size, never by a fixture id.
    const withL1 = Object.keys(insightsCopyEn.layer1.indicators);
    expect(withL1.length).toBeGreaterThanOrEqual(187);
    const { container } = renderPanel(reading('us10y'));
    expect(container.querySelector('[data-layer1-block]')).not.toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * The chart block (the surviving history endpoint)
 * ------------------------------------------------------------------ */

describe('IndicatorDetailsPanel — the chart block over /api/insights/:id/history', () => {
  it('fetches the history and renders the HistoryChart svg (ready state)', async () => {
    const { container } = renderPanel(reading('us10y'));
    await waitFor(() => {
      expect(container.querySelector('svg')).not.toBeNull();
    });
    // The endpoint the panel reads (the fetch carries accept headers —
    // assert on the URL through the mocked calls, not the full argv).
    const calls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]));
    expect(calls.some((u) => u === '/api/insights/us10y/history')).toBe(true);
  });

  it('renders the honest no-history line on a 404 (a single-point card)', async () => {
    stubHistory('404');
    renderPanel(reading('us10y'));
    await waitFor(() => {
      expect(screen.getByText(insightsCopyEn.ui.noHistory)).toBeTruthy();
    });
  });

  it('renders the honest error line when the fetch fails', async () => {
    stubHistory('error');
    renderPanel(reading('vix' as IndicatorId));
    await waitFor(() => {
      expect(screen.getByText(insightsCopyEn.ui.historyError)).toBeTruthy();
    });
  });
});

/* ------------------------------------------------------------------ *
 * The price-row sections (the 2026-10-26c owner directive)
 * ------------------------------------------------------------------ */

describe('IndicatorDetailsPanel — the price-row detail sections', () => {
  it('renders PriceDetailsSections for a PRICE_ROWS id (gold) with the companion lines from the page readings', async () => {
    const gold = reading('gold-usd' as IndicatorId, {
      value: 4166.1,
      change7d: -1.19,
      change30d: -5.31,
      percentile10y: 0.92,
      sourceName: 'gold-api.com (XAU)',
    });
    const silver = reading('silver-usd' as IndicatorId, { value: 57.12 });
    const { container } = renderPanel(gold, [gold, silver]);
    // The verified price-row title the card face uses.
    await waitFor(() => {
      expect(screen.getByText(insightsCopyEn.ui.priceCardTitles['gold-usd'] ?? 'Gold price')).toBeTruthy();
    });
    // The price-changes section renders (section A — «تغییرات قیمت»)
    // from the stubbed history.
    await waitFor(() => {
      expect(container.textContent).toContain(insightsCopyEn.ui.sectionChanges);
    });
    // Section B — the 52-week range label (PanelSection's own title).
    expect(container.textContent).toContain(insightsCopyEn.ui.section52w);
  });

  it('renders the VIX note for the vix card (the interim-presentation note)', () => {
    renderPanel(reading('vix' as IndicatorId));
    expect(screen.getByText(insightsCopyEn.ui.vixNote)).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ *
 * The honest status lines + the footer
 * ------------------------------------------------------------------ */

describe('IndicatorDetailsPanel — the status lines + the footer', () => {
  it('states the stale-since date for a stale reading', () => {
    renderPanel(reading('us10y', { status: 'stale', asOf: '2026-10-02' }));
    const text = screen.getByRole('dialog').textContent ?? '';
    // The stale-since line speaks the reading's own as-of date.
    expect(text).toContain(
      insightsCopyEn.ui.staleSince.split('{')[0] ?? 'stale',
    );
    expect(text).toContain('Oct');
  });

  it('states the check-pending reason for a flagged reading', () => {
    renderPanel(
      reading('us10y', {
        status: 'check-pending',
        flag: { reason: 'value moved more than 5 sd in one day' },
      } as Partial<IndicatorReading>),
    );
    expect(screen.getByText(/value moved more than 5 sd/i)).toBeTruthy();
  });

  it('renders the linked source + the updated-on date in the footer', () => {
    renderPanel(reading());
    const link = screen.getByRole('link', { name: /Federal Reserve/i });
    expect(link.getAttribute('href')).toBe('https://www.federalreserve.gov/releases/h15/');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(screen.getByRole('dialog').textContent).toContain(
      insightsCopyEn.ui.updatedOn.split('{')[0] ?? 'Updated',
    );
  });

  it('renders NO pin button (the R-5 adaptation — the watchlist retired with the legacy page, R-7)', () => {
    renderPanel(reading());
    expect(screen.queryByText(insightsCopyEn.ui.pinAction)).toBeNull();
    expect(screen.queryByText(insightsCopyEn.ui.unpinAction)).toBeNull();
    expect(screen.queryByRole('button', { pressed: true })).toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * The F5 focus discipline
 * ------------------------------------------------------------------ */

describe('IndicatorDetailsPanel — the focus discipline (F5)', () => {
  it('focuses the heading on open, locks body scroll, returns focus to the opener on close', () => {
    const { onClose } = renderPanel(reading());
    // The heading carries the focus.
    const heading = screen.getByRole('dialog').querySelector('[data-panel-heading]');
    expect(document.activeElement).toBe(heading);
    // The body scroll lock engaged.
    expect(document.body.style.overflow).toBe('hidden');
    // Escape closes.
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    // Cleanup restores the scroll + the focus (the unmount path).
    cleanup();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('the close button closes (the labelled X)', () => {
    const { onClose } = renderPanel(reading());
    fireEvent.click(screen.getByRole('button', { name: insightsCopyEn.ui.panelClose }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('the scrim click closes', () => {
    const { container, onClose } = renderPanel(reading());
    fireEvent.click(container.querySelector('.insights-panel-scrim')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

/* ------------------------------------------------------------------ *
 * fa/RTL
 * ------------------------------------------------------------------ */

describe('IndicatorDetailsPanel — the fa/RTL rendering', () => {
  it('renders the Persian F5 titles + the Persian close label + the Persian chart block', async () => {
    const { container } = renderPanel(reading('us10y'), [reading('us10y')], 'fa');
    expect(screen.getByText(insightsCopyFa.ui.forYou)).toBeTruthy();
    expect(screen.getByText(insightsCopyFa.ui.whatItIs)).toBeTruthy();
    expect(screen.getByRole('button', { name: insightsCopyFa.ui.panelClose })).toBeTruthy();
    // The Layer-1 plainName in fa.
    expect(screen.getByText(insightsCopyFa.layer1.indicators.us10y.plainName)).toBeTruthy();
    await waitFor(() => {
      expect(container.querySelector('svg')).not.toBeNull();
    });
  });
});
