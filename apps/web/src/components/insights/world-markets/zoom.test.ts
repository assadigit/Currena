/**
 * zoom.test.ts (page-division S8, 2026-11-08) — the REGION_ZOOMS config's
 * own pins (the §9 layout-test lineage: the config is the ONE file the
 * zooms read, so its geometry is pinned here, red on drift).
 *
 * What is pinned:
 *   - the four windows sit INSIDE the world box, with positive extents;
 *   - every zoomed dot sits inside its own window with margin (a pin the
 *     window crops would be an honest bug — the market would vanish);
 *   - the membership: every world-map index is seated in EXACTLY ONE
 *     zoom except tsx/ibov (D-44: they stay on World Markets until the
 *     OECD page exists) — and each subset matches the engine registry's
 *     own groups (MARKETS), never a hand-copied list that could drift;
 *   - every zoom index has a card entry, inside the stage bounds with
 *     its width accounted for, and NO two cards in one zoom overlap
 *     (the flat-band geometry the §9 layout probe measures live);
 *   - the label-anchor overrides land INSIDE their windows (the world's
 *     own anchors that fall outside are the documented reason they
 *     exist — this pins the fix, not the intent).
 */

import { describe, expect, it } from 'vitest';
import geo from './world-map-geo.json';
import { MAP_INDICES, REGION_ZOOMS } from './world-map-config';
import type { MapRegionId } from './world-map-config';
import { MARKETS } from '@currena/insights/markets/definitions';
import type { MarketId } from '@currena/core';

const WORLD_W = geo.viewBox.width;
const WORLD_H = geo.viewBox.height;
const ALL_MAP_IDS = new Set(MAP_INDICES.map((c) => c.id));
const REGIONS = Object.keys(REGION_ZOOMS) as MapRegionId[];

/** A dot's centre in world-box units. */
function dotWorld(id: MarketId): { x: number; y: number } {
  const d = geo.dots[id as keyof typeof geo.dots];
  if (d === undefined) throw new Error(`no dot for ${id}`);
  return { x: (d.x / 100) * WORLD_W, y: (d.y / 100) * WORLD_H };
}

describe('REGION_ZOOMS — the windows', () => {
  it('has exactly the four D-44 regions', () => {
    expect(REGIONS).toEqual(['europe', 'asia', 'us', 'australia']);
  });

  it('every window sits inside the world box with positive extents', () => {
    for (const region of REGIONS) {
      const { x, y, w, h } = REGION_ZOOMS[region].viewBox;
      expect(x, `${region} x`).toBeGreaterThanOrEqual(0);
      expect(y, `${region} y`).toBeGreaterThanOrEqual(0);
      expect(x + w, `${region} right`).toBeLessThanOrEqual(WORLD_W);
      expect(y + h, `${region} bottom`).toBeLessThanOrEqual(WORLD_H);
      expect(w).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);
    }
  });

  it('every zoomed dot sits inside its own window with ≥8 world units of margin', () => {
    for (const region of REGIONS) {
      const { viewBox } = REGION_ZOOMS[region];
      for (const id of REGION_ZOOMS[region].indices) {
        const d = dotWorld(id);
        expect(d.x - viewBox.x, `${region}/${id} left margin`).toBeGreaterThanOrEqual(8);
        expect(viewBox.x + viewBox.w - d.x, `${region}/${id} right margin`).toBeGreaterThanOrEqual(8);
        expect(d.y - viewBox.y, `${region}/${id} top margin`).toBeGreaterThanOrEqual(8);
        expect(viewBox.y + viewBox.h - d.y, `${region}/${id} bottom margin`).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it('the label-anchor overrides land inside their windows (the outside-the-window world anchors are the documented reason they exist)', () => {
    for (const region of REGIONS) {
      const { viewBox, labels } = REGION_ZOOMS[region];
      if (labels === undefined) continue;
      for (const [cc, a] of Object.entries(labels)) {
        const x = (a.x / 100) * WORLD_W;
        const y = (a.y / 100) * WORLD_H;
        expect(x, `${region}/${cc} label x`).toBeGreaterThan(viewBox.x);
        expect(x, `${region}/${cc} label x`).toBeLessThan(viewBox.x + viewBox.w);
        expect(y, `${region}/${cc} label y`).toBeGreaterThan(viewBox.y);
        expect(y, `${region}/${cc} label y`).toBeLessThan(viewBox.y + viewBox.h);
      }
    }
  });
});

describe('REGION_ZOOMS — the membership (D-43/D-44)', () => {
  it('every zoom index is a world-map index (never a second registry)', () => {
    for (const region of REGIONS) {
      for (const id of REGION_ZOOMS[region].indices) {
        expect(ALL_MAP_IDS.has(id), `${region}/${id}`).toBe(true);
      }
    }
  });

  it('every world-map index is seated in EXACTLY ONE zoom — except tsx/ibov, which stay on World Markets (D-44)', () => {
    const seats = new Map<MarketId, number>();
    for (const region of REGIONS) {
      for (const id of REGION_ZOOMS[region].indices) {
        seats.set(id, (seats.get(id) ?? 0) + 1);
      }
    }
    for (const id of ALL_MAP_IDS) {
      if (id === 'tsx' || id === 'ibov') {
        expect(seats.get(id), `${id} must NOT be zoomed (D-44)`).toBeUndefined();
      } else {
        expect(seats.get(id), `${id} must sit in exactly one zoom`).toBe(1);
      }
    }
  });

  it('the subsets match the engine registry\'s own groups (MARKETS) — the S7 never-a-hand-copied-list discipline', () => {
    const groupOf = (id: MarketId) => MARKETS.find((m) => m.id === id)!.group;
    const sorted = (ids: readonly MarketId[]) => [...ids].sort();
    // Europe: the registry's europe group, whole.
    expect(sorted(REGION_ZOOMS.europe.indices)).toEqual(sorted(MARKETS.filter((m) => m.group === 'europe').map((m) => m.id)));
    // Asia: the registry's asia group MINUS asx200 (Australia is its own
    // continent zoom, D-43 — the world board's only AU row rides there).
    expect(sorted(REGION_ZOOMS.asia.indices)).toEqual(sorted(MARKETS.filter((m) => m.group === 'asia' && m.id !== 'asx200').map((m) => m.id)));
    // US: the registry's americas group MINUS tsx/ibov (D-44).
    expect(sorted(REGION_ZOOMS.us.indices)).toEqual(sorted(MARKETS.filter((m) => m.group === 'americas' && m.id !== 'tsx' && m.id !== 'ibov').map((m) => m.id)));
    // Australia: the world board's one AU row (the 19-symbol AU Markets
    // board is S16's own scope — a table there, never map pins).
    expect(sorted(REGION_ZOOMS.australia.indices)).toEqual(['asx200']);
    // Sanity: the groupOf check agrees for every seated id (europe→
    // 'europe', asia-minus-asx→'asia', us trio→'americas').
    expect(groupOf('ftse')).toBe('europe');
    expect(groupOf('asx200')).toBe('asia');
    expect(groupOf('sp500')).toBe('americas');
  });

  it('each zoom seats its indices in the world map\'s own west-to-east order (DOM order = tab order, the §4.1 convention)', () => {
    for (const region of REGIONS) {
      const worldOrder = MAP_INDICES.map((c) => c.id).filter((id) => (REGION_ZOOMS[region].indices as readonly string[]).includes(id));
      expect([...REGION_ZOOMS[region].indices], region).toEqual(worldOrder);
    }
  });

  it('the seat counts are the designed 4 · 6 · 3 · 1', () => {
    expect(REGION_ZOOMS.europe.indices).toHaveLength(4);
    expect(REGION_ZOOMS.asia.indices).toHaveLength(6);
    expect(REGION_ZOOMS.us.indices).toHaveLength(3);
    expect(REGION_ZOOMS.australia.indices).toHaveLength(1);
  });
});

describe('REGION_ZOOMS — the callout cards (the §9 flat geometry)', () => {
  /** A card's rendered height, as a share of the stage height, is at
   * most ~18% in every zoom (the world map's own cards measure ~19% of
   * theirs; the zooms' cards are the same content at wider widths). */
  const CARD_H_PCT = 18;

  it('every zoom index has a card entry, seated inside the stage with its width accounted for', () => {
    for (const region of REGIONS) {
      const { cards, cardWidthPct, indices } = REGION_ZOOMS[region];
      expect(cardWidthPct).toBeGreaterThan(0);
      expect(cardWidthPct).toBeLessThanOrEqual(40);
      for (const id of indices) {
        const c = cards[id];
        expect(c, `${region}/${id} has a card`).toBeDefined();
        expect(c!.x).toBeGreaterThan(cardWidthPct / 2);
        expect(c!.x).toBeLessThan(100 - cardWidthPct / 2);
        expect(c!.y).toBeGreaterThanOrEqual(CARD_H_PCT / 2);
        expect(c!.y).toBeLessThanOrEqual(100 - CARD_H_PCT / 2);
      }
      // No stray card entries for indices the zoom does not seat.
      for (const id of Object.keys(cards) as MarketId[]) {
        expect(indices, `${region} card for unseated ${id}`).toContain(id);
      }
    }
  });

  it('no two cards in one zoom overlap (centre distance beyond the half-widths, or clear vertically)', () => {
    for (const region of REGIONS) {
      const { cards, cardWidthPct, indices } = REGION_ZOOMS[region];
      for (let i = 0; i < indices.length; i++) {
        for (let j = i + 1; j < indices.length; j++) {
          const a = cards[indices[i]!]!;
          const b = cards[indices[j]!]!;
          const apartX = Math.abs(a.x - b.x) >= cardWidthPct;
          const apartY = Math.abs(a.y - b.y) >= CARD_H_PCT;
          expect(apartX || apartY, `${region}: ${indices[i]} × ${indices[j]} must not overlap`).toBe(true);
        }
      }
    }
  });

  it('the card widths are wider than the world\'s 16-card width (fewer cards, more room)', () => {
    for (const region of REGIONS) {
      expect(REGION_ZOOMS[region].cardWidthPct).toBeGreaterThan(14.5);
    }
  });
});
