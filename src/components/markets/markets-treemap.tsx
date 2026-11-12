/**
 * markets/MarketsTreemap — the TE-style market heat map on /world-markets
 * (spec docs/specs/world-markets-treemap.md, the tradingeconomics.com/
 * stocks/treemap adaptation).
 *
 * One responsive SVG holds a two-level squarified treemap:
 *   - REGION groups (AMERICAS · ASIA-PACIFIC · EUROPE) sized by their summed
 *     constituent market cap, each with a 20px header band + count;
 *   - LEAF tiles (one per index) sized by each index's own cap and COLOURED
 *     by the selected period's return on a diverging red↔warm-gray↔green
 *     ramp, dark gutters between tiles, white bold labels with a 1px black
 *     text shadow, a native <title> tooltip per tile.
 *
 * Standing disciplines (spec §1, §2):
 *   - NEVER A SECOND ARITHMETIC: the return the colour encodes is the SAME
 *     periodValueOf read the breadth/movers/grid tiles speak — a missing
 *     lens keeps the honest neutral gray + dash, never a 0.
 *   - The market-cap table is ILLUSTRATIVE DEMO DATA — the card's footer
 *     says so plainly (an estimate is labelled an estimate).
 *   - ZERO new dependencies: the squarified layout (Bruls et al., greedy
 *     worst-aspect-ratio rows) is a deterministic pure function — same
 *     snapshot, same pixels, SSR-safe, no hydration drift.
 *   - Colour is never the only signal: every readable tile carries its name
 *     + exact SIGNED percentage; tiles too small for labels keep the
 *     <title> tooltip.
 *   - Tiles are real buttons: keyboard focus + Enter/Space open the SAME
 *     detail panel the grid tiles open (one open panel, the shared state).
 */

import { useCallback, useMemo } from 'react';
import type { EnrichedIndex, PeriodDef } from './types';
import { fmtLevel, fmtPct, fmtMinusPct, fmtCap, fmtDate } from '@/lib/format';
import {
  clampOf,
  periodWordOf,
  periodValueOf,
  regionLabel,
  drawdownKindOf,
  DRAWDOWN_KIND_LABEL,
} from '@/lib/markets';

/* ------------------------------------------------------------------ *
 * The constants (viewBox units; TE-measured proportions — spec §4)
 * ------------------------------------------------------------------ */

/** The drawing's coordinate system (TE's own 1400-wide canvas, trimmed to
 *  580 for a 12:5 card ratio; everything scales with the container). */
const VIEW_W = 1400;
const VIEW_H = 580;
/** The dark canvas's outer breathing room (TE pads ~5px). */
const CANVAS_PAD = 5;
/** The region header band (TE's 15px band + 5px label inset). */
const HEADER_H = 20;

/** A tile too small for even the smallest label pair keeps only its
 *  <title> tooltip (TE hides labels below ~40px; 44×40 after rounding). */
const LABEL_MIN_W = 44;
const LABEL_MIN_H = 40;

/** The tile label's shrink-to-fit coefficient: the name's rough average
 *  glyph width as a share of its font size (0.58 for the 700-weight cut). */
const NAME_WIDTH_FACTOR = 0.58;
/** The drawn name's outer margin inside the tile (2×5px, both sides). */
const NAME_PAD = 10;

/** The diverging ramp's anchors, in Currena's own return inks (the page's
 *  --color-return-down/up hues, deep enough for white label ink — spec §5):
 *  down #c0392b · neutral warm gray rgb(72,68,62) · up #2e9e5b. */
const NEUTRAL_RGB: readonly [number, number, number] = [72, 68, 62];
const UP_RGB: readonly [number, number, number] = [46, 158, 91];
const DOWN_RGB: readonly [number, number, number] = [192, 57, 43];

/** The dark canvas's own tones (the treemap is a DARK drawing inside the
 *  light card treatment — the TE contrast, in the page's warm-dark ink
 *  family rather than TE's navy — spec §2). */
const CANVAS_BG = '#141210';
const REGION_FILL = '#141210';
const REGION_STROKE = '#141210';
const SELECTED_STROKE = 'var(--currena-warning)';

/* ------------------------------------------------------------------ *
 * The pure helpers (squarified treemap — Bruls et al., spec §4)
 * ------------------------------------------------------------------ */

export interface TreemapRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TreemapItem {
  id: string;
  /** The tile's weight — the approx market cap (USD trillions). */
  value: number;
}

/** The worst aspect ratio a candidate row would reach (Bruls et al. §3,
 *  "worst": max over the row's items of max(len/thickness, thickness/len)). */
export function worstAspectRatio(row: readonly number[], side: number): number {
  if (row.length === 0 || side <= 0) return Number.POSITIVE_INFINITY;
  const sum = row.reduce((a, b) => a + b, 0);
  const thickness = sum / side;
  if (thickness <= 0) return Number.POSITIVE_INFINITY;
  let worst = 0;
  for (const v of row) {
    const len = v / thickness;
    worst = Math.max(worst, len / thickness, thickness / len);
  }
  return worst;
}

/** The squarified treemap (Bruls et al., 2000): items placed desc by value,
 *  greedy rows grown while the worst aspect ratio improves, each row a
 *  column (w ≥ h) or a strip (h > w) of the remaining rect. Deterministic
 *  and allocation-free — the same items and rect always produce the same
 *  tiles, so SSR and hydration agree byte-for-byte. */
export function squarify(items: readonly TreemapItem[], rect: TreemapRect): Map<string, TreemapRect> {
  const out = new Map<string, TreemapRect>();
  if (items.length === 0 || rect.w <= 0 || rect.h <= 0) return out;

  const total = items.reduce((a, b) => a + b.value, 0);
  if (total <= 0) return out;
  // Scale the weights to the rect's area (unit = 1 px² of this rect).
  const scaled = items.map((it) => ({ id: it.id, value: (it.value / total) * rect.w * rect.h }));
  scaled.sort((a, b) => b.value - a.value);

  let x = rect.x;
  let y = rect.y;
  let w = rect.w;
  let h = rect.h;
  let row: Array<{ id: string; value: number }> = [];

  const placeRow = () => {
    if (row.length === 0) return;
    const side = Math.min(w, h);
    const rowArea = row.reduce((a, b) => a + b.value, 0);
    const thickness = rowArea / side;
    if (w >= h) {
      // A left column of the remaining rect: fixed width = thickness.
      let cy = y;
      for (const it of row) {
        const ih = it.value / thickness;
        out.set(it.id, { x, y: cy, w: thickness, h: ih });
        cy += ih;
      }
      x += thickness;
      w -= thickness;
    } else {
      // A top strip: fixed height = thickness.
      let cx = x;
      for (const it of row) {
        const iw = it.value / thickness;
        out.set(it.id, { x: cx, y, w: iw, h: thickness });
        cx += iw;
      }
      y += thickness;
      h -= thickness;
    }
    row = [];
  };

  const queue = [...scaled];
  while (queue.length > 0) {
    const next = queue[0];
    if (next === undefined) break;
    const side = Math.min(w, h);
    const rowValues = row.map((r) => r.value);
    const withNext = [...rowValues, next.value];
    // Greedy: add while the row's worst ratio does not worsen.
    if (row.length === 0 || worstAspectRatio(withNext, side) <= worstAspectRatio(rowValues, side)) {
      row.push(next);
      queue.shift();
    } else {
      placeRow();
    }
    if (w <= 0.01 || h <= 0.01) {
      // Degenerate remainder (floating-point dust at the rect's edge).
      placeRow();
      queue.length = 0;
    }
  }
  placeRow();
  return out;
}

/** The tile's fill for a period return (spec §5): piecewise-linear RGB from
 *  the neutral warm gray toward the up/down anchor, clamped at the lens's
 *  saturation bound. A missing reading keeps the neutral (never 0). */
export function changeFill(pct: number | null, period: PeriodDef): string {
  if (pct === null || pct === 0) return rgb(NEUTRAL_RGB);
  const clamp = clampOf(period);
  const t = Math.min(Math.abs(pct) / clamp, 1);
  const to = pct > 0 ? UP_RGB : DOWN_RGB;
  const mixed: [number, number, number] = [
    Math.round(NEUTRAL_RGB[0] + (to[0] - NEUTRAL_RGB[0]) * t),
    Math.round(NEUTRAL_RGB[1] + (to[1] - NEUTRAL_RGB[1]) * t),
    Math.round(NEUTRAL_RGB[2] + (to[2] - NEUTRAL_RGB[2]) * t),
  ];
  return rgb(mixed);
}

const rgb = (c: readonly [number, number, number]): string => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

/** The label pair's font sizes for a tile (spec §6): the base scales with
 *  the tile's geometric mean side (TE's 10–35px ladder), the name shrinks
 *  to fit narrow tiles. Returns null when the tile is too small for labels
 *  (the tooltip still carries everything). */
export function tileLabelSizes(w: number, h: number, name: string): { name: number; pct: number } | null {
  if (w < LABEL_MIN_W || h < LABEL_MIN_H) return null;
  const base = Math.min(Math.max(Math.sqrt(w * h) / 210, 1), 3.5) * 10;
  const nameSize = Math.min(base, (w - NAME_PAD) / (name.length * NAME_WIDTH_FACTOR));
  if (nameSize < 7) return null; // no honest label fits — tooltip only
  return { name: nameSize, pct: base >= 14 ? base * 0.85 : base };
}

/* ------------------------------------------------------------------ *
 * The model (pure, memo-friendly — spec §4 two-pass)
 * ------------------------------------------------------------------ */

export interface TreemapRegionModel {
  region: EnrichedIndex['region'];
  /** The region band's own rect (header included). */
  rect: TreemapRect;
  /** The leaf rects, region-local — ids in desc cap order. */
  tiles: Map<string, TreemapRect>;
  entries: readonly EnrichedIndex[];
}

/** Build the full two-level model (spec §4): the regions squarified by
 *  their summed caps into the padded canvas, then each region's indices
 *  squarified into the band below its 20px header. TE order, biggest
 *  region first. Pure — deterministic from the cap table. */
export function buildModel(entries: readonly EnrichedIndex[]): TreemapRegionModel[] {
  const regions: Array<{ region: EnrichedIndex['region']; items: TreemapItem[] }> = [];
  for (const region of ['americas', 'asia', 'europe'] as const) {
    const items = entries
      .filter((e) => e.region === region)
      .map((e) => ({ id: e.symbol, value: e.capT }));
    if (items.length === 0) continue;
    regions.push({ region, items });
  }
  // TE's order: biggest first (the Americas' cap dominates the canvas).
  regions.sort((a, b) => b.items.reduce((s, i) => s + i.value, 0) - a.items.reduce((s, i) => s + i.value, 0));

  const canvas: TreemapRect = { x: CANVAS_PAD, y: CANVAS_PAD, w: VIEW_W - 2 * CANVAS_PAD, h: VIEW_H - 2 * CANVAS_PAD };
  const regionWeights = regions.map((r) => ({ id: r.region, value: r.items.reduce((s, i) => s + i.value, 0) }));
  const regionRects = squarify(regionWeights, canvas);

  const out: TreemapRegionModel[] = [];
  for (const r of regions) {
    const rect = regionRects.get(r.region);
    if (rect === undefined) continue;
    const inner: TreemapRect = { x: rect.x, y: rect.y + HEADER_H, w: rect.w, h: rect.h - HEADER_H };
    out.push({
      region: r.region,
      rect,
      tiles: squarify(r.items, inner),
      entries: entries.filter((e) => e.region === r.region),
    });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The component (spec §6–§10)
 * ------------------------------------------------------------------ */

export function MarketsTreemap({
  items,
  period,
  asOfDisplay,
  selected,
  onSelect,
}: {
  items: readonly EnrichedIndex[];
  period: PeriodDef;
  asOfDisplay: string;
  /** The shared one-open symbol — the treemap's tiles and the grid tiles
   *  open the SAME panel (spec §8). */
  selected: string | null;
  onSelect: (symbol: string) => void;
}): React.JSX.Element | null {
  const model = useMemo(() => (items.length > 0 ? buildModel(items) : []), [items]);
  const clamp = clampOf(period);
  const clampX = clamp.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const periodWord = periodWordOf(period);
  const canvasAria = `World markets heat map: ${items.length} indices across 3 regions, tile size approximates market capitalization, color approximates ${periodWord} performance.`;

  const onKeyDown = useCallback(
    (symbol: string) => (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(symbol);
      }
    },
    [onSelect],
  );

  // The honest empty state: no board, no drawing (never an empty canvas).
  if (items.length === 0) return null;

  return (
    <div
      data-markets-treemap-block="true"
      className="flex min-w-0 flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-4"
    >
      <h3 id="markets-treemap-title" className="m-0">
        <span className="block text-[length:var(--type-caption)] font-bold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
          Market heat map
        </span>
        <span className="mt-0.5 block text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
          Tile size &asymp; market capitalization &middot; color &asymp; {periodWord} performance
        </span>
      </h3>

      {/* The legend (spec §5): the period's own saturation bounds on either
       * end of the ramp — the bounds are part of the reading, and they MOVE
       * with the lens. LTR even in RTL contexts. */}
      <div dir="ltr" className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="sr-only">
          Color scale: red for losses and green for gains, saturating at plus or minus {clampX} percent for {periodWord}.
        </span>
        <span className="flex items-center gap-1.5" aria-hidden="true">
          <bdi className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
            &minus;{clampX}%
          </bdi>
          <span
            className="h-2.5 w-28 rounded-full ring-1 ring-[var(--color-border)] sm:w-40"
            style={{ background: 'linear-gradient(to right, #c0392b, rgb(72,68,62), #2e9e5b)' }}
          />
          <bdi className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
            +{clampX}%
          </bdi>
        </span>
      </div>

      {/* The dark canvas inside the light card (the TE contrast — spec §2):
       * the overflow-x-auto wrapper keeps the 680px-min drawing pannable on
       * phones without ever overflowing the page (spec §9). */}
      <div
        className="markets-treemap-scroll overflow-x-auto rounded-[calc(var(--radius-md)-4px)]"
        data-markets-treemap="true"
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="group"
          aria-label={canvasAria}
          className="block h-auto w-full min-w-[680px] select-none"
          style={{ background: CANVAS_BG }}
        >
          {model.map((region) => {
            const label = regionLabel(region.region);
            const countX = region.entries.length.toLocaleString('en-US', { maximumFractionDigits: 0 });
            return (
              <g key={region.region} data-treemap-region={region.region}>
                {/* The region band: dark fill + the 1px gutter stroke. */}
                <rect
                  x={region.rect.x}
                  y={region.rect.y}
                  width={region.rect.w}
                  height={region.rect.h}
                  fill={REGION_FILL}
                  stroke={REGION_STROKE}
                  strokeWidth={1}
                />
                {/* TE's uppercase band label + dim count (spec §4). */}
                <text
                  x={region.rect.x + 9}
                  y={region.rect.y + 14.5}
                  fontSize={12}
                  fontWeight={800}
                  letterSpacing={1.1}
                  fill="rgba(245,241,234,.88)"
                  style={{ textTransform: 'uppercase' }}
                >
                  {label}
                  <tspan fill="rgba(201,194,180,.55)" fontWeight={600}>{` \u00b7 ${countX}`}</tspan>
                </text>
                {region.entries.map((entry) => {
                  const tile = region.tiles.get(entry.symbol);
                  if (tile === undefined) return null;
                  return (
                    <TreemapTile
                      key={entry.symbol}
                      entry={entry}
                      tile={tile}
                      period={period}
                      periodWord={periodWord}
                      asOfDisplay={asOfDisplay}
                      open={selected === entry.symbol}
                      onKeyDown={onKeyDown}
                      onToggle={onSelect}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* The honest footer (spec §10): the demo-cap line (an estimate is
       * labelled an estimate), the clamp rule, and the panel hint. */}
      <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]" data-markets-treemap-footer>
        {items.length} indices &middot; colors saturate at &plusmn;{clampX}% for {periodWord} &middot; select a tile
        for detail &middot; as of {asOfDisplay} &middot; illustrative demo data
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * One tile (spec §6–§8): the button + the label pair + the tooltip
 * ------------------------------------------------------------------ */

function TreemapTile({
  entry,
  tile,
  period,
  periodWord,
  asOfDisplay,
  open,
  onToggle,
  onKeyDown,
}: {
  entry: EnrichedIndex;
  tile: TreemapRect;
  period: PeriodDef;
  periodWord: string;
  asOfDisplay: string;
  open: boolean;
  onToggle: (symbol: string) => void;
  onKeyDown: (symbol: string) => (e: React.KeyboardEvent) => void;
}): React.JSX.Element {
  const pct = periodValueOf(entry, period);
  const fill = changeFill(pct, period);
  const drawnName = entry.shortName;
  const sizes = tileLabelSizes(tile.w, tile.h, drawnName);
  const kind = drawdownKindOf(entry.fromHigh);
  const kindLabel = DRAWDOWN_KIND_LABEL[kind];
  const srValue = pct === null ? 'no reading' : fmtPct(pct);
  const dirWord = pct === null ? 'flat' : pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';

  // The aria label mirrors the grid tile's sr-only phrasing (spec §8).
  const aria = `${entry.name}, ${entry.country}: ${srValue} over ${periodWord}, ${dirWord}, ${kindLabel}, tile sized by roughly $${fmtCap(entry.capT)}T market cap, as of ${asOfDisplay}`;

  // The native tooltip (spec §7): Name (Country) / Level / Period change /
  // From 52-week high / Market cap.
  const tooltip = `${entry.name} (${entry.country})\nLevel: ${fmtLevel(entry.level)}\n${periodWord.replace(/\b\w/g, (c) => c.toUpperCase())} change: ${pct === null ? 'no reading' : fmtPct(pct)}\nFrom 52-week high: ${fmtMinusPct(entry.fromHigh)} \u2014 ${kindLabel}\nMarket cap: \u2248 $${fmtCap(entry.capT)}T`;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-controls={`insights-market-detail-${entry.symbol}`}
      aria-label={aria}
      data-treemap-tile={entry.symbol}
      onClick={() => onToggle(entry.symbol)}
      onKeyDown={onKeyDown(entry.symbol)}
      className="insights-focusable cursor-pointer"
      style={{ outline: 'none' }}
    >
      <title>{tooltip}</title>
      <rect
        x={tile.x}
        y={tile.y}
        width={tile.w}
        height={tile.h}
        fill={fill}
        stroke={REGION_STROKE}
        strokeWidth={1}
        className="treemap-tile-rect"
      />
      {/* The selection ring (spec §8: amber currena-warning) + the hover
       * brighten rides CSS — the rect above transitions fill, the ring is a
       * second stroke-only rect so the gutter never widens. */}
      {open ? (
        <rect
          x={tile.x + 1}
          y={tile.y + 1}
          width={Math.max(tile.w - 2, 0)}
          height={Math.max(tile.h - 2, 0)}
          fill="none"
          stroke={SELECTED_STROKE}
          strokeWidth={2}
          pointerEvents="none"
        />
      ) : null}
      {sizes !== null ? (
        <g pointerEvents="none">
          <text
            x={tile.x + tile.w / 2}
            y={tile.y + tile.h / 2}
            dy="-0.4em"
            textAnchor="middle"
            fontSize={sizes.name}
            fontWeight={700}
            fill="#fff"
            style={{ textShadow: 'rgba(0,0,0,.85) 1px 1px 1px' }}
          >
            {drawnName}
          </text>
          <text
            x={tile.x + tile.w / 2}
            y={tile.y + tile.h / 2}
            dy="0.6em"
            textAnchor="middle"
            fontSize={sizes.pct}
            fontWeight={700}
            fill="#fff"
            style={{ textShadow: 'rgba(0,0,0,.85) 1px 1px 1px', fontVariantNumeric: 'tabular-nums' }}
          >
            {pct === null ? '\u2014' : fmtPct(pct)}
          </text>
        </g>
      ) : null}
    </g>
  );
}
