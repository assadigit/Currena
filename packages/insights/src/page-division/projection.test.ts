/**
 * The page-projection completeness gates (page-division S2, 2026-11-08 —
 * the roadmap's S2 gate: "projection endpoints return complete data for
 * every page's membership").
 *
 * A synthetic FULL snapshot (one reading per registry id) projects every
 * page completely: every home + mirror id carries a reading, in placement
 * order, each id at most once, absentIds empty. The public-projection
 * twin (the licence-hidden quartet absent) reports those ids HONESTLY in
 * absentIds — displayed as the Gold page's blocked notes, never guessed
 * (Agent Rule 5).
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading, InsightsSnapshot } from '@currena/core';
import { PageProjectionSchema } from '@currena/core';
import { PAGE_PLACEMENTS, pageHomeIds, pageMirrorIds, pageReadingIds } from './placement';
import { isPageDivisionPageId, projectSnapshotToPage } from './projection';

const registry = JSON.parse(
  readFileSync(new URL('../../../../data/indicators.json', import.meta.url), 'utf8'),
) as { indicators: { id: string }[] };
const ALL_IDS = registry.indicators.map((i) => i.id) as IndicatorId[];

const hiddenSet = JSON.parse(
  readFileSync(new URL('../../../../data/site-mode-overrides.json', import.meta.url), 'utf8'),
) as { hiddenIndicatorIds: string[] };
const HIDDEN = new Set<string>(hiddenSet.hiddenIndicatorIds);

const reading = (id: IndicatorId): IndicatorReading => ({
  id,
  value: 3.9,
  asOf: '2026-11-06',
  status: 'normal',
  sourceName: 'FRED (fixture)',
  sourceUrl: 'https://example.test/series',
  updatedAt: '2026-11-08T04:20:00.000Z',
});

const fullSnapshot: InsightsSnapshot = {
  generatedAt: '2026-11-08T04:20:00.000Z',
  summary: {
    global: { section: 'global', label: 'cautious', warningCount: 3, votingCount: 11, excludedCount: 1 },
    australia: { section: 'australia', label: 'relaxed', warningCount: 0, votingCount: 6, excludedCount: 2 },
  },
  readings: ALL_IDS.map(reading),
  changedThisWeek: [],
  calendar: [],
};

/** The public projection's shape: the hidden quartet absent + the stamp. */
const publicSnapshot: InsightsSnapshot = {
  ...fullSnapshot,
  displayMode: 'public',
  readings: fullSnapshot.readings.filter((r) => !HIDDEN.has(r.id)),
};

describe('projectSnapshotToPage — the completeness gate (private snapshot)', () => {
  it.each(PAGE_PLACEMENTS.map((p) => [p.page]))('page %s: every membership id carries a reading, in placement order', (page) => {
    const projection = projectSnapshotToPage(fullSnapshot, page);
    const expected = pageReadingIds(page);
    expect(projection.readings.map((r) => r.id)).toEqual(expected);
    expect(projection.absentIds).toEqual([]);
    expect(projection.boards).toEqual(PAGE_PLACEMENTS.find((p) => p.page === page)?.boards ?? []);
    expect(projection.generatedAt).toBe(fullSnapshot.generatedAt);
    expect(projection.displayMode).toBeUndefined();
  });

  it('global carries 52 mirror readings and no homes; gold 14 homes + 34 mirrors + 4 blocked; usa 72 + 14', () => {
    expect(projectSnapshotToPage(fullSnapshot, 'global').readings).toHaveLength(52);
    const gold = projectSnapshotToPage(fullSnapshot, 'gold');
    expect(gold.readings).toHaveLength(52); // 14 homes + 34 mirrors + 4 blocked-note readings
    expect(gold.readings.slice(0, 14).map((r) => r.id)).toEqual([...pageHomeIds('gold')]);
    expect(projectSnapshotToPage(fullSnapshot, 'usa').readings).toHaveLength(86); // 72 + 14
    expect(projectSnapshotToPage(fullSnapshot, 'australia').readings).toHaveLength(33); // 28 + 5
  });

  it('produces wire-contract-valid payloads (validated on construction)', () => {
    for (const p of PAGE_PLACEMENTS) {
      const projection = projectSnapshotToPage(fullSnapshot, p.page);
      expect(() => PageProjectionSchema.parse(projection)).not.toThrow();
    }
  });

  it('stamps pricesAsOf when the merged snapshot carries it', () => {
    const merged: InsightsSnapshot = { ...fullSnapshot, pricesAsOf: '2026-11-08T12:13:00.000Z' };
    expect(projectSnapshotToPage(merged, 'gold').pricesAsOf).toBe('2026-11-08T12:13:00.000Z');
  });
});

describe('projectSnapshotToPage — the public projection (fail-closed honesty)', () => {
  it('GOLD reports the licence-hidden quartet in absentIds (the blocked notes), everything else complete', () => {
    const projection = projectSnapshotToPage(publicSnapshot, 'gold');
    expect(projection.displayMode).toBe('public');
    expect(projection.absentIds.sort()).toEqual([...HIDDEN].sort());
    expect(projection.readings).toHaveLength(48); // 14 homes + 34 mirrors — the 4 blocked notes are the absences
  });

  it('every other page stays complete under the public projection (the quartet lives only on Gold)', () => {
    for (const p of PAGE_PLACEMENTS) {
      if (p.page === 'gold') continue;
      const projection = projectSnapshotToPage(publicSnapshot, p.page);
      expect(projection.absentIds).toEqual([]);
    }
  });
});

describe('projectSnapshotToPage — the degraded-store honesty', () => {
  it('a snapshot missing a membership id REPORTS it in absentIds instead of guessing', () => {
    const degraded: InsightsSnapshot = {
      ...fullSnapshot,
      readings: fullSnapshot.readings.filter((r) => r.id !== 'us-cpi-yoy' && r.id !== 'china-pmi'),
    };
    const usa = projectSnapshotToPage(degraded, 'usa');
    // china-pmi is a USA MIRROR too (a growth-health voter) — its absence
    // is reported on every page that expects it, which is the point.
    expect(usa.absentIds).toEqual(['us-cpi-yoy', 'china-pmi']);
    const asia = projectSnapshotToPage(degraded, 'asia-pacific');
    expect(asia.absentIds).toEqual(['china-pmi']);
    // The page's other readings still serve — one bad id never blanks the page.
    expect(usa.readings).toHaveLength(84);
  });
});

describe('the blocked-note readings ride the Gold projection (spec §16)', () => {
  it('the private snapshot serves the quartet as their honest readings (tail of the set)', () => {
    const gold = projectSnapshotToPage(fullSnapshot, 'gold');
    const blockedTail = gold.readings.slice(-4).map((r) => r.id);
    expect(blockedTail.sort()).toEqual([...HIDDEN].sort());
  });
});

describe('isPageDivisionPageId (the route guard)', () => {
  it('accepts the 9 destinations and rejects everything else (fail closed)', () => {
    for (const p of PAGE_PLACEMENTS) expect(isPageDivisionPageId(p.page)).toBe(true);
    expect(isPageDivisionPageId('insights')).toBe(false);
    expect(isPageDivisionPageId('converter')).toBe(false);
    expect(isPageDivisionPageId('pages')).toBe(false);
    expect(isPageDivisionPageId('')).toBe(false);
  });
});
