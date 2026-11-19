/**
 * @vitest-environment jsdom
 *
 * GoldEpisodes.test.tsx — GPE R25 / F6: the Episode Explorer's tests —
 * the nine-record launch list (the structure: the periods, the
 * hasData coverage, the out-bound-only links, the living flag), the
 * component's honest states (the collapsed takeaway, the list, the
 * per-record expansion with the family readings + the no-series
 * lines, the meter-era boundary note), and the DROP-GATED halves (the
 * price-path + the comparison waiting states; with a seeded snapshot
 * the path + the comparison + the since-episode lines render through
 * the pure engine).
 *
 * House discipline: stubbed fetch per test — tests NEVER hit live
 * sites; contract-valid fixtures sanity-parsed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { GoldEpisodesSnapshot } from '@currena/core';
import { GoldEpisodesSnapshotSchema } from '@currena/core';
import { GoldEpisodes } from './GoldEpisodes';
import { GOLD_EPISODES, EPISODE_FAMILY_ORDER } from './gold-episodes-records';
import { clearGoldEpisodesCacheForTests } from './gold-episodes';
import { useI18n } from '../../shared/lib/locale';

/** A contract-valid episodes snapshot (62 monthly spine rows + one leg). */
const spineRows = Array.from({ length: 62 }, (_, i) => {
  const total = 2021 * 12 + 8 + i; // 2021-09 + i months → 2026-10
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return { month: `${y}-${String(m).padStart(2, '0')}`, value: 1700 + i * 12 };
});
const episodesSnapshot: GoldEpisodesSnapshot = GoldEpisodesSnapshotSchema.parse({
  v: 1,
  asOf: '2026-10',
  fetchedAt: '2026-11-19T06:00:00.000Z',
  spine: {
    rows: spineRows,
    sourceUrl: 'https://www.gold.org/goldhub/data/gold-prices',
    fileName: 'Gold_price_averages_in_a_range_of_currencies_since_1978.xlsx',
  },
  legs: [
    { id: 'silver', seriesNamed: 'Silver (troy ounce, US$) — the stored insights history', rows: [{ month: '2021-09', value: 24 }, { month: '2026-10', value: 45 }] },
  ],
});

/** The locale wrapper (the GoldPositions pattern). */
function renderWithLocale(ui: React.ReactNode): ReturnType<typeof render> {
  function Wrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
    const { locale } = useI18n();
    void locale;
    return <>{children}</>;
  }
  return render(ui, { wrapper: Wrapper });
}

describe('the nine-record launch list (the typed structure)', () => {
  it('carries exactly the nine records 1971 → 2024–26 in order', () => {
    expect(GOLD_EPISODES.length).toBe(9);
    expect(GOLD_EPISODES.map((r) => r.period.start.slice(0, 4))).toEqual([
      '1971', '1979', '1999', '2008', '2011', '2013', '2020', '2022', '2024',
    ]);
  });

  it('the one living record is the 2024–26 melt-up (dated edits, never silent rewrites)', () => {
    const living = GOLD_EPISODES.filter((r) => r.living === true);
    expect(living.length).toBe(1);
    expect(living[0]!.id).toBe('episode-2024-26-melt-up');
  });

  it('the hasData flags match the families\' own series coverage (the honesty core)', () => {
    const byId = new Map(GOLD_EPISODES.map((r) => [r.id, r]));
    // 1971: dollar + inflation only (the families\' series barely reach back).
    expect(byId.get('episode-1971-bretton-woods')!.families.filter((f) => f.hasData).map((f) => f.family).sort()).toEqual(['dollar', 'inflation']);
    // 1999: + flows (CFTC 1986+).
    expect(byId.get('episode-1999-browns-bottom')!.families.filter((f) => f.hasData).map((f) => f.family).sort()).toEqual(['dollar', 'flows', 'inflation']);
    // 2008: five families (TIPS 1997+ covers; demand 2002+ does not).
    expect(byId.get('episode-2008-gfc')!.families.filter((f) => f.hasData).length).toBe(5);
    // 2020/2022/2024-26: all six.
    expect(byId.get('episode-2020-covid')!.families.filter((f) => f.hasData).length).toBe(6);
    expect(byId.get('episode-2022-sanctions-rotation')!.families.filter((f) => f.hasData).length).toBe(6);
    expect(byId.get('episode-2024-26-melt-up')!.families.filter((f) => f.hasData).length).toBe(6);
  });

  it('the links are OUT-BOUND only — the verified live seat cards (§3.5)', () => {
    const hrefs = new Set(GOLD_EPISODES.flatMap((r) => r.links.map((l) => l.href)));
    for (const href of hrefs) {
      expect(href.startsWith('/usa#') || href.startsWith('/currencies#') || href.startsWith('#')).toBe(true);
    }
    expect(hrefs.has('/usa#usa-card-real-yield-10y')).toBe(true);
    expect(hrefs.has('#gold-zone-k')).toBe(true);
  });

  it('every record covers all six families (the reading rows render total)', () => {
    for (const record of GOLD_EPISODES) {
      const covered = new Set(record.families.map((f) => f.family));
      for (const family of EPISODE_FAMILY_ORDER) {
        expect(covered.has(family)).toBe(true);
      }
    }
  });
});

describe('GoldEpisodes (the component)', () => {
  beforeEach(() => {
    clearGoldEpisodesCacheForTests();
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the collapsed zone O header + the takeaway line (the always-visible row)', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {})),
    );
    renderWithLocale(<GoldEpisodes />);
    expect(document.getElementById('gold-zone-o')).toBeTruthy(); // the zone-level anchor
    expect(document.querySelector('[data-gold-zone-o-band]')).toBeTruthy();
    expect(document.querySelector('[data-episodes-takeaway]')?.textContent).toContain('Nine episodes');
    // Collapsed by default: no list yet.
    expect(document.querySelector('[data-episodes-list]')).toBeNull();
  });

  it('expanded (the pre-drop state): the meter-era boundary note + the nine records + the DROP-GATED waiting states — never an invented series', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 })),
    );
    renderWithLocale(<GoldEpisodes />);
    await fireEvent.click(screen.getByRole('button', { name: /explore the episodes/i }));
    const list = document.querySelector('[data-episodes-list]')!;
    // The meter-era boundary note (s7/03 §3.4 — taught, not hidden).
    expect(list.querySelector('[data-episodes-meter-era]')?.textContent).toContain('only since 2016');
    // The nine records render (era + title + annotation).
    const records = list.querySelectorAll('[data-episode]');
    expect(records.length).toBe(9);
    expect(list.textContent).toContain('Bretton Woods ends');
    expect(list.textContent).toContain('The sanctions rotation');
    expect(list.textContent).toContain('The melt-up and correction');
    // The price path + the comparison carry the honest waiting states.
    expect(document.querySelector('[data-episode-comparison="waiting"]')).toBeTruthy();
  });

  it('one record expanded: the interpretation + the family readings with the hasData no-series lines + the sources + the out-bound links', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 })),
    );
    renderWithLocale(<GoldEpisodes />);
    await fireEvent.click(screen.getByRole('button', { name: /explore the episodes/i }));
    // Expand the 2022 record (the Zone K annotation's own target).
    const row = document.querySelector('[data-episode="episode-2022-sanctions-rotation"] button')!;
    await fireEvent.click(row);
    const detail = document.querySelector('[data-episode-detail]')!;
    expect(detail.querySelector('[data-episode-interpretation]')?.textContent).toContain('frozen in February 2022');
    // All six family rows render; the hasData=false ones carry the no-series line.
    const familyRows = detail.querySelectorAll('[data-episode-family]');
    expect(familyRows.length).toBe(6);
    const noData = detail.querySelectorAll('[data-has-data="false"]');
    expect(noData.length).toBe(0); // the 2022 record covers all six
    expect(detail.querySelector('[data-episode-family="borrowing-costs"]')?.textContent).toContain('TIPS real yields (1997+)');
    // The sources + the licence badges + the out-bound links.
    expect(detail.querySelector('[data-episode-sources]')?.textContent).toContain('World Gold Council');
    const links = detail.querySelectorAll('[data-episode-links] a');
    expect(links.length).toBeGreaterThan(0);
    // The price path is the waiting state (no drop yet).
    expect(detail.querySelector('[data-episode-path="waiting"]')).toBeTruthy();
  });

  it('the 1971 record renders the hasData=false no-series lines for the uncovered families (the honesty core)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 })),
    );
    renderWithLocale(<GoldEpisodes />);
    await fireEvent.click(screen.getByRole('button', { name: /explore the episodes/i }));
    const row = document.querySelector('[data-episode="episode-1971-bretton-woods"] button')!;
    await fireEvent.click(row);
    const detail = document.querySelector('[data-episode-detail]')!;
    const noData = detail.querySelectorAll('[data-has-data="false"]');
    expect(noData.length).toBe(4); // borrowing-costs, stress, flows, demand
    expect(detail.textContent).toContain('No series for this family in this period.');
  });

  it('seeded (the drop landed): the price path + the comparison table + the since-episode line render through the pure engine', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(episodesSnapshot), { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    renderWithLocale(<GoldEpisodes />);
    // The comparison rider renders INSIDE the expanded list — open first,
    // then await the drop's arrival (the honest waiting state until then).
    await fireEvent.click(screen.getByRole('button', { name: /explore the episodes/i }));
    await waitFor(() => {
      expect(document.querySelector('[data-episode-comparison="ready"]')).not.toBeNull();
    });
    // The comparison table renders the legs' windows with the honest no-data cells
    // (the 62-month spine: the 1y window computes; 5/10/20y are not-enough-history).
    const table = document.querySelector('[data-episode-comparison-table]')!;
    expect(table.textContent).toContain('not enough stored history');
    // The 2024-26 record's price path renders (the spine slice inside its period).
    const row = document.querySelector('[data-episode="episode-2024-26-melt-up"] button')!;
    await fireEvent.click(row);
    const detail = document.querySelector('[data-episode-detail]')!;
    expect(detail.querySelector('[data-episode-path="ready"]')).toBeTruthy();
    expect(detail.querySelector('[data-episode-path-chart] svg')).toBeTruthy();
    expect(detail.querySelector('[data-episode-path-source]')?.textContent).toContain('World Gold Council');
    // The since-episode line renders (gold + the silver leg). The 2022 record
    // is the honest target: its end month (2022-11) sits inside BOTH series'
    // coverage (spine + silver 2021-09→2026-10), so both legs compute; the
    // living 2024-26 record's end (2026-11) is at/after the spine's asOf, so
    // its since return is honestly null (a degenerate anchor — never a guess).
    const row2022 = document.querySelector('[data-episode="episode-2022-sanctions-rotation"] button')!;
    await fireEvent.click(row2022);
    const detail2022 = document.querySelector('[data-episode-detail]')!;
    expect(detail2022.querySelector('[data-episode-since]')?.textContent).toContain('Since this episode');
  });
});
