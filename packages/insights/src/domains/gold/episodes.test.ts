/**
 * episodes.test.ts — GPE R25 / F6: the Episode Explorer's pure engine
 * + store tests — the month arithmetic, the window/since returns over
 * a synthetic monthly series (the honest null states: a window the
 * leg's depth cannot support, a series that starts after an episode),
 * the path slices + extremes, the snapshot builder's wire contract,
 * and the KV/REST store halves.
 *
 * The SPINE IS DROP-GATED in production (the WGC workbook — S15-D4);
 * the tests compute over synthetic series because the arithmetic must
 * be pinned BEFORE the drop lands (the same discipline the LBMA
 * adapters shipped under: the parse halves pure and total).
 */

import { describe, expect, it } from 'vitest';
import type { EpisodeLeg, EpisodePoint, GoldEpisodesSnapshot } from '@currena/core';
import { GoldEpisodesSnapshotSchema } from '@currena/core';
import {
  GOLD_EPISODES_KV_KEY,
  KvGoldEpisodesStore,
  RestGoldEpisodesStore,
  buildGoldEpisodesSnapshot,
  episodePath,
  episodeSeriesViews,
  goldSeriesView,
  monthAdd,
  monthDiff,
  pathExtremes,
  sinceReturn,
  windowReturn,
  type EpisodeSeriesView,
} from './episodes';

/** A synthetic monthly series generator (ascending, one value per month). */
function series(from: string, to: string, valueOf: (month: string, i: number) => number): EpisodePoint[] {
  const rows: EpisodePoint[] = [];
  let m = from;
  let i = 0;
  while (m <= to) {
    rows.push({ month: m, value: valueOf(m, i) });
    m = monthAdd(m, 1);
    i += 1;
  }
  return rows;
}

const NOW = new Date('2026-11-19T06:00:00Z');

/** A minimal valid snapshot for the engine tests (2018-01 → 2026-10, the doubling spine). */
const SPINE = series('1978-01', '2026-10', (_m, i) => 100 * Math.pow(1.04, i));
const LEGS: readonly EpisodeLeg[] = [
  {
    id: 'silver',
    seriesNamed: 'Silver (troy ounce, US$) — the stored insights history',
    rows: series('2021-09', '2026-10', (_m, i) => 24 * Math.pow(1.02, i)),
  },
];
const SNAPSHOT: GoldEpisodesSnapshot = buildGoldEpisodesSnapshot(
  SPINE,
  LEGS,
  { sourceUrl: 'https://www.gold.org/goldhub/data/gold-prices', fileName: 'Gold_price_averages_in_a_range_of_currencies_since_1978.xlsx' },
  NOW,
);

describe('the month arithmetic (the workbook\'s own monthly axis)', () => {
  it('monthAdd carries the year boundary and never trips JS Date edge days', () => {
    expect(monthAdd('2026-01', -1)).toBe('2025-12');
    expect(monthAdd('2026-01', -12)).toBe('2025-01');
    expect(monthAdd('2024-02', -13)).toBe('2023-01');
    expect(monthAdd('2026-10', 2)).toBe('2026-12');
    expect(monthAdd('2026-12', 1)).toBe('2027-01');
  });

  it('monthDiff is signed months (positive when a is later)', () => {
    expect(monthDiff('2026-10', '2026-10')).toBe(0);
    expect(monthDiff('2026-01', '2025-12')).toBe(1);
    expect(monthDiff('2025-12', '2026-01')).toBe(-1);
    expect(monthDiff('2026-10', '2021-10')).toBe(60);
  });
});

describe('windowReturn (the 1/5/10/20y windows, named at point of use)', () => {
  const view: EpisodeSeriesView = { seriesNamed: 'test', rows: SPINE };

  it('computes the window over the actual anchor (the workbook\'s monthly average at the window start)', () => {
    // 2026-10 minus 20y = 2006-10 → the anchor names its own month.
    const w = windowReturn(view, '2026-10', 20);
    expect(w).not.toBeNull();
    expect(w!.fromMonth).toBe('2006-10');
    expect(w!.toMonth).toBe('2026-10');
    // 4%/month compounding over 240 months: (1.04^240 − 1)·100 — the pin.
    expect(w!.pct).toBeCloseTo((Math.pow(1.04, 240) - 1) * 100, 5);
  });

  it('a window the series depth cannot support is null — never a shorter window in disguise', () => {
    const shortView: EpisodeSeriesView = { seriesNamed: 'short', rows: series('2021-09', '2026-10', () => 1) };
    expect(windowReturn(shortView, '2026-10', 5)).not.toBeNull(); // 2021-09 <= 2021-10 anchor
    expect(windowReturn(shortView, '2026-10', 10)).toBeNull();
    expect(windowReturn(shortView, '2026-10', 20)).toBeNull();
  });
});

describe('sinceReturn (the since-episode returns, the anchor at the episode\'s close)', () => {
  it('anchors at the LAST row at-or-before the episode end (the exit an investor at the episode close could realize)', () => {
    const view: EpisodeSeriesView = { seriesNamed: 'test', rows: SPINE };
    const r = sinceReturn(view, '2011-09'); // the QE-era top episode end
    expect(r).not.toBeNull();
    expect(r!.fromMonth).toBe('2011-09');
    expect(r!.toMonth).toBe('2026-10');
    // 4%/month compounding over 181 months (2011-09 → 2026-10) — the pin.
    expect(r!.pct).toBeCloseTo((Math.pow(1.04, 181) - 1) * 100, 5);
  });

  it('a series that starts AFTER the episode end is null (the honest not-enough-history state)', () => {
    const lateView: EpisodeSeriesView = { seriesNamed: 'late', rows: series('2021-09', '2026-10', () => 2) };
    expect(sinceReturn(lateView, '2020-03')).toBeNull(); // the COVID episode — silver's series starts 2021-09
  });
});

describe('episodePath + pathExtremes (the per-record price-path slices)', () => {
  it('slices the record\'s period with the pad (the eye sees the path entering and leaving)', () => {
    const path = episodePath(SNAPSHOT, '1979-10', '1980-01', 3);
    expect(path[0]!.month).toBe('1979-07');
    expect(path[path.length - 1]!.month).toBe('1980-04');
  });

  it('the extremes are the path\'s own min/max rows', () => {
    const path = episodePath(SNAPSHOT, '2011-09', '2013-12', 0);
    const ext = pathExtremes(path)!;
    expect(ext.min.month).toBe('2011-09');
    expect(ext.max.month).toBe('2013-12');
  });
});

describe('the comparison views (S15-D6: the legs the repo honestly serves)', () => {
  it('gold leads, the legs follow, each named for what it is', () => {
    const views = episodeSeriesViews(SNAPSHOT);
    expect(views.length).toBe(2);
    expect(views[0]!.seriesNamed).toContain('World Gold Council');
    expect(views[1]!.seriesNamed).toContain('stored insights history');
  });
});

describe('the snapshot builder (the wire contract)', () => {
  it('validates: ascending months, the asOf = the spine\'s newest month, unique legs', () => {
    expect(() => GoldEpisodesSnapshotSchema.parse(SNAPSHOT)).not.toThrow();
    expect(SNAPSHOT.asOf).toBe('2026-10');
    expect(SNAPSHOT.spine.rows.length).toBe(586); // 1978-01 → 2026-10
    expect(SNAPSHOT.spine.sourceUrl).toBe('https://www.gold.org/goldhub/data/gold-prices');
  });

  it('refuses a descending spine (fail-closed on shape)', () => {
    expect(() =>
      buildGoldEpisodesSnapshot(
        [...SPINE].reverse(),
        [],
        { sourceUrl: 'https://www.gold.org/goldhub/data/gold-prices', fileName: 'f.xlsx' },
        NOW,
      ),
    ).toThrow();
  });

  it('refuses duplicate comparison legs', () => {
    expect(() =>
      buildGoldEpisodesSnapshot(
        SPINE,
        [LEGS[0]!, LEGS[0]!],
        { sourceUrl: 'https://www.gold.org/goldhub/data/gold-prices', fileName: 'f.xlsx' },
        NOW,
      ),
    ).toThrow();
  });

  it('goldSeriesView names the spine per C1 (the workbook\'s own axis + attribution)', () => {
    const view = goldSeriesView(SNAPSHOT);
    expect(view.seriesNamed).toBe('Gold (troy ounce, US$, monthly averages) — World Gold Council workbook');
    expect(view.rows.length).toBe(SNAPSHOT.spine.rows.length);
  });
});

describe('the store halves (the ONE KV key)', () => {
  it('the key is the insights:gold-episodes:v1 literal; poisoned values are ignored', async () => {
    expect(GOLD_EPISODES_KV_KEY).toBe('insights:gold-episodes:v1');
    const map = new Map<string, string>([[GOLD_EPISODES_KV_KEY, '{"v":1,"poison":true}']]);
    const store = new KvGoldEpisodesStore({
      get: async (k) => map.get(k) ?? null,
      put: async (k, v) => void map.set(k, v),
    });
    expect(await store.getGoldEpisodes()).toBeUndefined();
  });

  it('the KV store round-trips the snapshot zod-clean', async () => {
    const map = new Map<string, string>();
    const store = new KvGoldEpisodesStore({
      get: async (k) => map.get(k) ?? null,
      put: async (k, v) => void map.set(k, v),
    });
    await store.writeGoldEpisodes(SNAPSHOT);
    expect(await store.getGoldEpisodes()).toEqual(SNAPSHOT);
  });

  it('the REST adapter round-trips through the KV REST API shapes (404 = the honest not-yet)', async () => {
    const seen: Array<{ method?: string; body?: string }> = [];
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      seen.push({ method: init?.method, body: typeof init?.body === 'string' ? init.body : undefined });
      if (init?.method === 'PUT') return new Response('{}', { status: 200 });
      return new Response(JSON.stringify(SNAPSHOT), { status: 200 });
    }) as typeof fetch;
    const store = new RestGoldEpisodesStore({ apiToken: 't', accountId: 'a', namespaceId: 'n', fetchImpl });
    expect(await store.getGoldEpisodes()).toEqual(SNAPSHOT);
    await store.writeGoldEpisodes(SNAPSHOT);
    expect(seen[1]!.method).toBe('PUT');
    expect(JSON.parse(seen[1]!.body!)).toEqual(SNAPSHOT);
    const empty = new RestGoldEpisodesStore({
      apiToken: 't',
      accountId: 'a',
      namespaceId: 'n',
      fetchImpl: (async () => new Response('', { status: 404 })) as typeof fetch,
    });
    expect(await empty.getGoldEpisodes()).toBeUndefined();
  });
});
