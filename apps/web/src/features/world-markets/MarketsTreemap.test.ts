/**
 * MarketsTreemap tests (the 2026-11-12 treemap round,
 * docs/specs/world-markets-treemap.md — the spec's done-criteria turned
 * into fixtures):
 *
 *   - the squarify geometry: coverage (no area lost), containment (every
 *     tile inside its rect), no overlap, and the aspect-ratio greedy rule
 *   - the two-level model: region areas proportional to the summed caps
 *     (the Americas ≈ 72% · Asia-Pacific ≈ 20% · Europe ≈ 8% split),
 *     the leaf band starting below the 20px header, the TE order
 *     (biggest region first)
 *   - the diverging colour ramp: neutral at 0/missing, the per-period
 *     clamp bounds, the endpoints, never a fabricated 0
 *   - the label rules: hidden below 44×40, the shrink-to-fit name, the
 *     pct scale-down on large bases
 *   - the cap table: total over the closed 16-id set, sp500 biggest and
 *     ibov smallest (the spec's proportionality check)
 *
 * Pure-math fixtures only — no live site, no provider (AGENTS.md rule 7).
 */

import { describe, expect, it } from 'vitest';
import type { MarketEntry, MarketId } from '@currena/core';
import {
  CAP_FALLBACK_T,
  CLAMP_PCT,
  buildModel,
  changeFill,
  squarify,
  tileLabelSizes,
  worstAspectRatio,
  type TreemapItem,
  type TreemapRect,
} from './MarketsTreemap';
import { MARKETS, MARKET_GROUP_ORDER } from '@currena/insights/markets/definitions';

/* ------------------------------------------------------------------ *
 * Fixtures
 * ------------------------------------------------------------------ */

const entry = (id: MarketId, fields: Partial<MarketEntry> = {}): MarketEntry => ({
  id,
  asOf: '2026-11-11',
  close: 5000,
  chg1d: 0.5,
  chg3m: 2,
  high52w: 5200,
  low52w: 4500,
  fromHigh: -3.8,
  rangePos: 71,
  trend: 'up',
  status: 'normal',
  source: 'eodhd',
  stale: false,
  weekly: [[300, 5000]],
  ...fields,
});

/** The full 16-row board (one entry per MARKETS definition id). */
const board: readonly MarketEntry[] = MARKETS.map((m) => entry(m.id));

const RECT: TreemapRect = { x: 5, y: 5, w: 1390, h: 570 };

const items = (vals: Array<[MarketId, number]>): TreemapItem[] => vals.map(([id, value]) => ({ id, value }));

/* ------------------------------------------------------------------ *
 * squarify — the geometry
 * ------------------------------------------------------------------ */

describe("worstAspectRatio — the greedy rule's measure", () => {
  it('a single square row on a square side is 1', () => {
    expect(worstAspectRatio([100], 10)).toBeCloseTo(1, 5);
  });
  it('an empty row or a zero side is infinite (never a candidate)', () => {
    expect(worstAspectRatio([], 10)).toBe(Number.POSITIVE_INFINITY);
    expect(worstAspectRatio([1], 0)).toBe(Number.POSITIVE_INFINITY);
  });
  it('a long thin row is worse than a balanced one', () => {
    expect(worstAspectRatio([100], 5)).toBeGreaterThan(worstAspectRatio([25, 25, 25, 25], 20));
  });
});

describe('squarify — placement', () => {
  it('places every item and loses no area (the rect is covered)', () => {
    const out = squarify(items([['sp500', 55], ['ndx', 44], ['dow', 19]]), RECT);
    expect(out.size).toBe(3);
    const area = [...out.values()].reduce((s, r) => s + r.w * r.h, 0);
    expect(area).toBeCloseTo(RECT.w * RECT.h, 5);
  });
  it('keeps every tile inside the rect (containment)', () => {
    const out = squarify(items([['sp500', 55], ['ndx', 44], ['dow', 19], ['tsx', 3.2]]), RECT);
    for (const r of out.values()) {
      expect(r.x).toBeGreaterThanOrEqual(RECT.x - 1e-6);
      expect(r.y).toBeGreaterThanOrEqual(RECT.y - 1e-6);
      expect(r.x + r.w).toBeLessThanOrEqual(RECT.x + RECT.w + 1e-6);
      expect(r.y + r.h).toBeLessThanOrEqual(RECT.y + RECT.h + 1e-6);
    }
  });
  it('tiles never overlap', () => {
    const out = squarify(
      items([['sp500', 55], ['ndx', 44], ['dow', 19], ['tsx', 3.2], ['ibov', 1.1], ['n225', 6.8]]),
      RECT,
    );
    const rects = [...out.entries()];
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        const a = rects[i]![1];
        const b = rects[j]![1];
        const overlapX = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
        const overlapY = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
        expect(overlapX * overlapY).toBeCloseTo(0, 6);
      }
    }
  });
  it('is deterministic (the same inputs, byte-identical tiles)', () => {
    const a = squarify(items([['sp500', 55], ['ndx', 44]]), RECT);
    const b = squarify(items([['sp500', 55], ['ndx', 44]]), RECT);
    expect([...a.entries()]).toEqual([...b.entries()]);
  });
  it('an empty input or zero-weight input places nothing', () => {
    expect(squarify([], RECT).size).toBe(0);
    expect(squarify(items([['sp500', 0]]), RECT).size).toBe(0);
  });
});

/* ------------------------------------------------------------------ *
 * buildModel — the two-level anatomy
 * ------------------------------------------------------------------ */

describe('buildModel — the region bands and the leaf tiles', () => {
  const model = buildModel(board);

  it('renders all three regions in TE order (biggest cap first)', () => {
    expect(model.map((r) => r.group)).toEqual(['americas', 'asia', 'europe']);
  });
  it('every region rect covers its share of the canvas (area ∝ summed cap)', () => {
    // The region areas as a share of the padded canvas:
    const canvasArea = (1400 - 10) * (580 - 10);
    const americas = model.find((r) => r.group === 'americas');
    const asia = model.find((r) => r.group === 'asia');
    const europe = model.find((r) => r.group === 'europe');
    expect(americas).toBeDefined();
    expect(asia).toBeDefined();
    expect(europe).toBeDefined();
    if (!americas || !asia || !europe) return;
    const shareA = (americas.rect.w * americas.rect.h) / canvasArea;
    const shareB = (asia.rect.w * asia.rect.h) / canvasArea;
    const shareC = (europe.rect.w * europe.rect.h) / canvasArea;
    // The spec's proportions: Americas ≈ 72% · Asia-Pacific ≈ 20% · Europe ≈ 8%.
    expect(shareA).toBeGreaterThan(0.68);
    expect(shareA).toBeLessThan(0.76);
    expect(shareB).toBeGreaterThan(0.16);
    expect(shareB).toBeLessThan(0.24);
    expect(shareC).toBeGreaterThan(0.05);
    expect(shareC).toBeLessThan(0.11);
    expect(shareA + shareB + shareC).toBeCloseTo(1, 3);
  });
  it('the leaves start below the 20px header band', () => {
    for (const region of model) {
      for (const tile of region.tiles.values()) {
        expect(tile.y).toBeGreaterThanOrEqual(region.rect.y + 20 - 1e-6);
      }
    }
  });
  it('every tile of a region stays inside that region band', () => {
    for (const region of model) {
      for (const tile of region.tiles.values()) {
        expect(tile.x).toBeGreaterThanOrEqual(region.rect.x - 1e-6);
        expect(tile.x + tile.w).toBeLessThanOrEqual(region.rect.x + region.rect.w + 1e-6);
        expect(tile.y + tile.h).toBeLessThanOrEqual(region.rect.y + region.rect.h + 1e-6);
      }
    }
  });
  it('carries exactly the 16 tiles across the three groups', () => {
    const total = model.reduce((s, r) => s + r.tiles.size, 0);
    expect(total).toBe(16);
    expect(model.map((r) => r.entries.length)).toEqual([5, 7, 4]);
  });
  it('the biggest tile is the S&P 500 and the smallest is Ibovespa', () => {
    const all = model.flatMap((r) => [...r.tiles.entries()]);
    const byArea = [...all].sort((a, b) => b[1].w * b[1].h - a[1].w * a[1].h);
    expect(byArea[0]?.[0]).toBe('sp500');
    expect(byArea[byArea.length - 1]?.[0]).toBe('ibov');
  });
  it('an empty board renders no regions (the honest empty case)', () => {
    expect(buildModel([])).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * changeFill — the diverging ramp
 * ------------------------------------------------------------------ */

describe('changeFill — the per-period clamped ramp', () => {
  it('zero and missing keep the neutral gray (never a fabricated 0)', () => {
    expect(changeFill(0, 'today')).toBe('rgb(75, 75, 75)');
    expect(changeFill(null, 'today')).toBe('rgb(75, 75, 75)');
  });
  it('the saturation bounds move with the lens (±3 today · ±15 on the year)', () => {
    expect(CLAMP_PCT.today).toBe(3);
    expect(CLAMP_PCT['1w']).toBe(5);
    expect(CLAMP_PCT['1m']).toBe(8);
    expect(CLAMP_PCT['3m']).toBe(12);
    expect(CLAMP_PCT['1y']).toBe(15);
    expect(CLAMP_PCT['5y']).toBe(20);
  });
  it('the clamp saturates exactly at the bound', () => {
    expect(changeFill(-3, 'today')).toBe('rgb(220, 38, 38)');
    expect(changeFill(-6, 'today')).toBe('rgb(220, 38, 38)'); // clamped beyond
    expect(changeFill(3, 'today')).toBe('rgb(22, 163, 74)');
    expect(changeFill(15, '1y')).toBe('rgb(22, 163, 74)');
  });
  it('half the bound is the exact midpoint of the ramp', () => {
    expect(changeFill(-1.5, 'today')).toBe('rgb(148, 57, 57)');
    expect(changeFill(1.5, 'today')).toBe('rgb(49, 119, 75)');
  });
  it('a yearly reading inside the daily clamp stays quieter (the wider lens)', () => {
    // +3% on the daily lens saturates; on the year lens it is t = 0.2.
    expect(changeFill(3, 'today')).not.toBe(changeFill(3, '1y'));
  });
});

/* ------------------------------------------------------------------ *
 * tileLabelSizes — the label rules
 * ------------------------------------------------------------------ */

describe('tileLabelSizes — hide, shrink, scale', () => {
  it('hides labels below 44×40 (the tooltip keeps the content)', () => {
    expect(tileLabelSizes(43, 40, 'DAX', 'Germany')).toBeNull();
    expect(tileLabelSizes(44, 39, 'DAX', 'Germany')).toBeNull();
    expect(tileLabelSizes(44, 40, 'DAX', 'Germany')).not.toBeNull();
  });
  it('shrinks the name to fit narrow tiles, never overflows', () => {
    const wide = tileLabelSizes(300, 200, 'NASDAQ 100', 'USA');
    const narrow = tileLabelSizes(60, 200, 'NASDAQ 100', 'USA');
    expect(wide).not.toBeNull();
    expect(narrow).not.toBeNull();
    if (wide && narrow) expect(narrow.name).toBeLessThan(wide.name);
  });
  it('a name that cannot honestly fit at 7px+ hides entirely', () => {
    expect(tileLabelSizes(44, 60, 'NASDAQ 100', 'USA')).toBeNull();
  });
  it('the pct size follows the base at 90% once the base reaches 14px', () => {
    const big = tileLabelSizes(400, 300, 'DAX', 'Germany');
    const small = tileLabelSizes(60, 60, 'DAX', 'Germany');
    // A wide tile: the name keeps the full base, the pct steps down to 90%.
    expect(big).not.toBeNull();
    expect(small).not.toBeNull();
    if (big) expect(big.pct).toBeCloseTo(big.name * 0.9, 1);
    if (small && small.name < 14) expect(small.pct).toBeCloseTo(small.name, 5);
  });
  it('shows the country line on tall tiles, hides it on short ones', () => {
    const tall = tileLabelSizes(300, 200, 'S&P 500', 'USA');
    const short = tileLabelSizes(60, 45, 'DAX', 'Germany');
    if (tall) expect(tall.country).not.toBeNull();
    if (short) expect(short.country).toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * The cap table
 * ------------------------------------------------------------------ */

describe('the cap table — the closed 16-id set', () => {
  it('the fallback weight is a positive honest minimum', () => {
    expect(CAP_FALLBACK_T).toBeGreaterThan(0);
  });
  it('sp500 outweighs every other single index (the biggest tile)', () => {
    const caps: Array<[MarketId, number]> = [
      ['sp500', 55], ['ndx', 44], ['dow', 19], ['tsx', 3.2], ['ibov', 1.1],
      ['ssec', 9.5], ['n225', 6.8], ['hsi', 4.6], ['nifty50', 5.4], ['taiex', 3.0],
      ['kospi', 2.4], ['asx200', 1.8], ['stoxx50', 4.4], ['ftse', 3.3], ['cac', 3.1], ['dax', 2.7],
    ];
    const out = squarify(caps.map(([id, value]) => ({ id, value })), RECT);
    const areas = [...out.entries()].map(([id, r]) => ({ id, area: r.w * r.h }));
    const biggest = [...areas].sort((a, b) => b.area - a.area)[0];
    expect(biggest?.id).toBe('sp500');
  });
  it('MARKET_GROUP_ORDER stays east to west on the grids (the model is TE order, not this one)', () => {
    expect(MARKET_GROUP_ORDER).toEqual(['asia', 'europe', 'americas']);
  });
});
