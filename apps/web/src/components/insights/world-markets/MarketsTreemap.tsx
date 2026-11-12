/**
 * world-markets/MarketsTreemap — the TE-style market heat map on the
 * standalone /world-markets page (the 2026-11-12 treemap round,
 * docs/specs/world-markets-treemap.md).
 *
 * The tradingeconomics.com/stocks/treemap anatomy (69-tile DOM snapshot,
 * measured): one responsive SVG holding a two-level squarified treemap —
 * region groups (AMERICAS · ASIA-PACIFIC · EUROPE) sized by their summed
 * constituent market cap, leaf tiles sized by each index's own cap and
 * COLOURED by the selected period's return on a diverging red↔gray↔green
 * ramp, dark gutters between tiles, white bold labels with a 1px black
 * text shadow, a native <title> tooltip per tile.
 *
 * Rules that shape this file (the section's standing disciplines):
 *  - NEVER A SECOND ARITHMETIC (D-48): the return the colour encodes is
 *    the SAME periodValueOf read the breadth/movers/tiles speak — a
 *    missing lens keeps the honest neutral gray + dash, never a 0.
 *  - The market-cap table is ILLUSTRATIVE DEMO DATA (approx constituent
 *    caps, USD trillions) — no provider field exists in the stored
 *    contract, so the card's footer says so plainly (Rule 5: never
 *    present an estimate as measured data).
 *  - ZERO new dependencies: the squarified layout (Bruls et al., "Squarified
 *    Treemaps", greedy worst-aspect-ratio rows) is a deterministic pure
 *    function — same snapshot, same pixels, SSR-safe, no hydration drift.
 *  - Colour is never the only signal (§3.6): every readable tile carries
 *    its name + exact SIGNED percentage, and the grids below carry the
 *    same content; tiles too small for labels keep the <title> tooltip.
 *  - Tiles are real buttons (the MarketsHeatmap pattern): keyboard focus
 *    and Enter/Space open the SAME detail panel the briefing's tiles
 *    open — one open panel at a time, the shared openId.
 */

import { useCallback, useMemo } from 'react';
import type { MarketEntry, MarketGroupId, MarketId } from '@currena/core';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../../i18n';
import { useI18n } from '../../../lib/locale';
import type { TranslationKey } from '../../../lib/locale';
import { periodValueOf } from './briefing';
import { signedPct, statusWordKeyOf, type MarketsView, type StockStateWordKey } from './shared';
import { formatAsOf } from '../HistoryChart';
/* ------------------------------------------------------------------ *
 * The constants (viewBox units; TE-measured proportions)
 * ------------------------------------------------------------------ */

/** The drawing's coordinate system (TE's own 1400-wide canvas, trimmed
 * to 580 for a 12:5 card ratio; everything scales with the container). */
const VIEW_W = 1400;
const VIEW_H = 580;
/** The dark canvas's outer breathing room (TE pads ~5px). */
const CANVAS_PAD = 5;
/** The region header band (TE's 15px band + 5px label inset). */
const HEADER_H = 20;

/** A tile too small for even the smallest label pair keeps only its
 * <title> tooltip (TE hides labels below ~40px; 44×40 after rounding). */
const LABEL_MIN_W = 44;
const LABEL_MIN_H = 40;

/** The tile label's shrink-to-fit coefficient: the name's rough average
 * glyph width as a share of its font size (0.58 for the 700-weight cut). */
const NAME_WIDTH_FACTOR = 0.58;
/** The drawn name's outer margin inside the tile (2×5px, both sides). */
const NAME_PAD = 10;

/** Approx constituent market cap, USD TRILLIONS — ILLUSTRATIVE DEMO
 * DATA (the stored contract carries no cap field; the footer says so).
 * Order-independent: the map is keyed by id. Sources: the big names'
 * exchange-published figures rounded to the cleanest single digit; the
 * tail (tsx/ibov/kospi/asx200/…) to one decimal. Update from EODHD
 * fundamentals or WFE stats when live caps join the contract. */
const MARKET_CAP_T: Record<MarketId, number> = {
  sp500: 55,
  ndx: 44,
  dow: 19,
  tsx: 3.2,
  ibov: 1.1,
  ssec: 9.5,
  n225: 6.8,
  hsi: 4.6,
  nifty50: 5.4,
  taiex: 3.0,
  kospi: 2.4,
  asx200: 1.8,
  stoxx50: 4.4,
  ftse: 3.3,
  cac: 3.1,
  dax: 2.7,
};

/** The unknown-symbol fallback (never used by the closed 16-id set —
 * the map is total, a future id renders at the honest minimum weight
 * rather than vanishing). */
export const CAP_FALLBACK_T = 1;

/** Tile names short enough to fit narrow tiles without truncation
 * (the Latin canvas stays LTR even in Farsi — §6.7's chart rule; the
 * canonical localized name rides the tooltip + the aria). */
const SHORT_NAME: Partial<Record<MarketId, string>> = {
  ssec: 'Shanghai',
  tsx: 'S&P/TSX',
};

/** Short country forms for the treemap's third label line (the full
 *  localized country rides the tooltip, the aria and the detail modal).
 *  Only the long names need shortening; short countries pass through. */
const SHORT_COUNTRY: Partial<Record<MarketId, string>> = {
  sp500: 'USA',
  ndx: 'USA',
  dow: 'USA',
  ftse: 'UK',
  kospi: 'S. Korea',
};

/** Where the colour saturates, per lens (|change| in percent). The
 * daily moves of a single session live in a much narrower band than a
 * year's — a fixed ±3 clamp would read every yearly tile as a saturated
 * extreme, so the clamp widens with the horizon (the map's own
 * dynamic-scale discipline, heatmapScale). */
export const CLAMP_PCT: Record<MarketsView, number> = {
  today: 3,
  '1w': 5,
  '1m': 8,
  '3m': 12,
  '1y': 15,
  '5y': 20,
};

/** The diverging ramp's anchors — conventional financial green/red (the
 * universal "up = green, down = red" convention), deep enough for white
 * label ink with the black text shadow. Down #dc2626 · neutral gray ·
 * up #16a34a. The legend gradient uses the same hues. */
const NEUTRAL_RGB: readonly [number, number, number] = [75, 75, 75];
const UP_RGB: readonly [number, number, number] = [22, 163, 74];
const DOWN_RGB: readonly [number, number, number] = [220, 38, 38];

/** The dark canvas's own tones (the treemap is a DARK drawing inside the
 * light card treatment — the TE contrast, in the page's warm-dark ink
 * family rather than TE's navy). */
const CANVAS_BG = '#141210';
const REGION_FILL = '#141210';
const REGION_STROKE = '#141210';
const SELECTED_STROKE = 'var(--color-currena-warning)';

/* ------------------------------------------------------------------ *
 * The pure helpers (exported for the tests)
 * ------------------------------------------------------------------ */

export interface TreemapRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TreemapItem {
  id: MarketId;
  /** The tile's weight — the approx market cap (USD trillions). */
  value: number;
}

/** The worst aspect ratio a candidate row would reach (Bruls et al. §3,
 * "worst": max over the row's items of max(len/thickness,
 * thickness/len)). Pure — exported for the geometry tests. */
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

/** The squarified treemap (Bruls et al., 2000): items placed desc by
 * value, greedy rows grown while the worst aspect ratio improves,
 * each row a column (w ≥ h) or a strip (h > w) of the remaining rect.
 * Deterministic and allocation-free — the same items and rect always
 * produce the same tiles, so SSR and hydration agree byte-for-byte. */
export function squarify(items: readonly TreemapItem[], rect: TreemapRect): Map<MarketId, TreemapRect> {
  const out = new Map<MarketId, TreemapRect>();
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
  let row: Array<{ id: MarketId; value: number }> = [];

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
      // Degenerate remainder (floating-point dust at the rect's edge):
      // stop — the placed tiles already cover the rect's area honestly.
      placeRow();
      queue.length = 0;
    }
  }
  placeRow();
  return out;
}

/** The tile's fill for a period return: piecewise-linear RGB from the
 * neutral warm gray toward the up/down anchor, clamped at the lens's
 * saturation bound. A missing reading keeps the neutral (never 0). */
export function changeFill(pct: number | null, view: MarketsView): string {
  if (pct === null || pct === 0) return rgb(NEUTRAL_RGB);
  const clamp = CLAMP_PCT[view];
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

/** The label set's font sizes for a tile: the base scales with the tile's
 * geometric mean side (TE's 10–35px ladder), the name shrinks to fit
 * narrow tiles. Returns null when the tile is too small for labels (the
 * tooltip still carries everything). `country` is the optional third line
 * — the index's country — shrink-to-fit to the tile width, only present
 * when the tile is tall enough for a third line. */
export function tileLabelSizes(
  w: number,
  h: number,
  name: string,
  country: string,
): { name: number; pct: number; country: number | null } | null {
  if (w < LABEL_MIN_W || h < LABEL_MIN_H) return null;
  const base = Math.min(Math.max(Math.sqrt(w * h) / 210, 1), 3.5) * 10;
  const nameSize = Math.min(base, (w - NAME_PAD) / (name.length * NAME_WIDTH_FACTOR));
  if (nameSize < 7) return null; // no honest label fits — tooltip only
  const pct = base >= 14 ? base * 0.85 : base;
  // The country line: a smaller secondary label, shrink-to-fit the tile
  // width, shown only on tiles tall enough for a third line (h >= 50) and
  // where the country fits at a readable size (>= 7px).
  const countryBase = Math.round(nameSize * 0.72);
  const countryFit = (w - NAME_PAD) / (country.length * NAME_WIDTH_FACTOR);
  const countrySize = Math.min(countryBase, countryFit);
  const countryLine = countrySize >= 7 && h >= 50 ? countrySize : null;
  return { name: nameSize, pct, country: countryLine };
}

/* ------------------------------------------------------------------ *
 * The model (pure, memo-friendly)
 * ------------------------------------------------------------------ */

export interface TreemapRegionModel {
  group: MarketGroupId;
  /** The region band's own rect (header included). */
  rect: TreemapRect;
  /** The leaf rects, region-local — ids in desc cap order. */
  tiles: Map<MarketId, TreemapRect>;
  entries: readonly MarketEntry[];
}

/** Build the full two-level model: the regions squarified by their
 * summed caps into the padded canvas, then each region's indices
 * squarified into the band below its 20px header. Pure — exported for
 * the geometry tests (area proportionality, no overlap, containment). */
export function buildModel(entries: readonly MarketEntry[]): TreemapRegionModel[] {
  const regions: Array<{ group: MarketGroupId; items: TreemapItem[] }> = [];
  for (const group of ['asia', 'europe', 'americas'] as const) {
    const items = entries
      .filter((e) => MARKET_CAP_GROUP[e.id] === group)
      .map((e) => ({ id: e.id, value: MARKET_CAP_T[e.id] ?? CAP_FALLBACK_T }));
    if (items.length === 0) continue;
    regions.push({ group, items });
  }
  // TE's order: biggest first (the Americas' cap dominates the canvas).
  regions.sort((a, b) => b.items.reduce((s, i) => s + i.value, 0) - a.items.reduce((s, i) => s + i.value, 0));

  const canvas: TreemapRect = { x: CANVAS_PAD, y: CANVAS_PAD, w: VIEW_W - 2 * CANVAS_PAD, h: VIEW_H - 2 * CANVAS_PAD };
  const regionWeights = regions.map((r) => ({ id: r.group as unknown as MarketId, value: r.items.reduce((s, i) => s + i.value, 0) }));
  const regionRects = squarify(regionWeights, canvas);

  const out: TreemapRegionModel[] = [];
  for (const r of regions) {
    const rect = regionRects.get(r.group as unknown as MarketId);
    if (rect === undefined) continue;
    const inner: TreemapRect = { x: rect.x, y: rect.y + HEADER_H, w: rect.w, h: rect.h - HEADER_H };
    out.push({
      group: r.group,
      rect,
      tiles: squarify(r.items, inner),
      entries: entries.filter((e) => MARKET_CAP_GROUP[e.id] === r.group),
    });
  }
  return out;
}

/** The group lookup the model reads (the definitions' own grouping —
 * imports avoided here to keep the module leaf-lean; the 16-id table is
 * closed, and the test pins it against MARKETS). */
const MARKET_CAP_GROUP: Record<MarketId, MarketGroupId> = {
  n225: 'asia',
  asx200: 'asia',
  kospi: 'asia',
  hsi: 'asia',
  ssec: 'asia',
  taiex: 'asia',
  nifty50: 'asia',
  stoxx50: 'europe',
  dax: 'europe',
  cac: 'europe',
  ftse: 'europe',
  sp500: 'americas',
  ndx: 'americas',
  dow: 'americas',
  tsx: 'americas',
  ibov: 'americas',
};

/* ------------------------------------------------------------------ *
 * The component
 * ------------------------------------------------------------------ */

const GROUP_KEY: Record<MarketGroupId, TranslationKey> = {
  asia: 'pd.worldMarkets.groups.asia',
  europe: 'pd.worldMarkets.groups.europe',
  americas: 'pd.worldMarkets.groups.americas',
};

export function MarketsTreemap({
  snapshot,
  view,
  openId,
  onToggle,
}: {
  snapshot: { markets: readonly MarketEntry[] } | undefined;
  view: MarketsView;
  /** The briefing's shared one-open id — the treemap's tiles and the
   * grid tiles open the SAME panel. */
  openId: MarketId | null;
  onToggle: (id: MarketId) => void;
}): React.JSX.Element | null {
  const { t, numberLocale } = useI18n();
  const entries = snapshot?.markets;
  const model = useMemo(() => (entries !== undefined ? buildModel(entries) : []), [entries]);
  const clampX = formatNumber(CLAMP_PCT[view], numberLocale, { maximumFractionDigits: 0 });
  const periodWord = t(PERIOD_WORD_KEY[view]);
  const canvasAria = interpolate(t('pd.worldMarkets.treemap.canvasAria'), {
    count: formatNumber(entries?.length ?? 0, numberLocale, { maximumFractionDigits: 0 }),
  });
  const onKeyDown = useCallback(
    (id: MarketId) => (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle(id);
      }
    },
    [onToggle],
  );

  // The honest empty state: no board, no drawing (never an empty canvas).
  if (entries === undefined || entries.length === 0) return null;

  return (
    <div data-markets-treemap-block className="flex min-w-0 flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-4">
      <h3 id="markets-treemap-title" className="m-0">
        <span className="block text-[length:var(--type-caption)] font-bold uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
          {t('pd.worldMarkets.treemap.heading')}
        </span>
        <span className="mt-0.5 block text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
          <bdi>{interpolate(t('pd.worldMarkets.treemap.subtitle'), { period: periodWord })}</bdi>
        </span>
      </h3>

      {/* The legend: the period's own saturation bounds on either end of
       * the ramp (the §3.6 visible-legend rule — the bounds are part of
       * the reading, and they MOVE with the lens). LTR even in Farsi
       * (the §6.7 chart rule). */}
      <div dir="ltr" className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="sr-only">{interpolate(t('pd.worldMarkets.treemap.legendAria'), { down: clampX, up: clampX })}</span>
        <span className="flex items-center gap-1.5" aria-hidden="true">
          <bdi className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
            −{clampX}%
          </bdi>
          <span
            className="h-2.5 w-28 rounded-full ring-1 ring-[var(--color-border)] sm:w-40"
            style={{ background: 'linear-gradient(to right, #dc2626, rgb(75,75,75), #16a34a)' }}
          />
          <bdi className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
            +{clampX}%
          </bdi>
        </span>
      </div>

      {/* The dark canvas inside the light card (the TE contrast): the
       * overflow-x-auto wrapper keeps the 680px-min drawing pannable on
       * phones without ever overflowing the page. */}
      <div className="overflow-x-auto rounded-[calc(var(--radius-md)-4px)]" data-markets-treemap>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="group"
          aria-label={canvasAria}
          className="block h-auto w-full min-w-[680px] select-none"
          style={{ background: CANVAS_BG }}
        >
          {model.map((region) => {
            const regionLabel = t(GROUP_KEY[region.group]);
            const countX = formatNumber(region.entries.length, numberLocale, { maximumFractionDigits: 0 });
            return (
              <g key={region.group} data-treemap-region={region.group}>
                {/* The region band: dark fill + the 1px gutter stroke. */}
                <rect x={region.rect.x} y={region.rect.y} width={region.rect.w} height={region.rect.h} fill={REGION_FILL} stroke={REGION_STROKE} strokeWidth={1} />
                {/* TE's uppercase band label (Latin stays LTR, §6.7). */}
                <text
                  x={region.rect.x + 9}
                  y={region.rect.y + 14.5}
                  fontSize={12}
                  fontWeight={800}
                  letterSpacing={1.1}
                  fill="rgba(245,241,234,.88)"
                  style={{ textTransform: 'uppercase' }}
                >
                  {regionLabel}
                  <tspan fill="rgba(201,194,180,.55)" fontWeight={600}>{` · ${countX}`}</tspan>
                </text>
                {region.entries.map((entry) => {
                  const tile = region.tiles.get(entry.id);
                  if (tile === undefined) return null;
                  return (
                    <TreemapTile
                      key={entry.id}
                      entry={entry}
                      tile={tile}
                      view={view}
                      open={openId === entry.id}
                      onKeyDown={onKeyDown}
                      onToggle={onToggle}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* The honest footer: the demo-cap line (Rule 5 — an estimate is
       * labelled an estimate), the clamp rule, and the panel hint. */}
      <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]" data-markets-treemap-footer>
        <bdi>
          {interpolate(t('pd.worldMarkets.treemap.footerNote'), {
            count: formatNumber(entries.length, numberLocale, { maximumFractionDigits: 0 }),
            clamp: clampX,
          })}
        </bdi>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * One tile (the button + the label pair + the tooltip)
 * ------------------------------------------------------------------ */

function TreemapTile({
  entry,
  tile,
  view,
  open,
  onToggle,
  onKeyDown,
}: {
  entry: MarketEntry;
  tile: TreemapRect;
  view: MarketsView;
  open: boolean;
  onToggle: (id: MarketId) => void;
  onKeyDown: (id: MarketId) => (e: React.KeyboardEvent) => void;
}): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const pct = periodValueOf(entry, view);
  const fill = changeFill(pct, view);
  const name = t(`pd.worldMarkets.entries.${entry.id}.name`);
  const country = t(`pd.worldMarkets.entries.${entry.id}.country`);
  const capT = MARKET_CAP_T[entry.id] ?? CAP_FALLBACK_T;
  const drawnName = SHORT_NAME[entry.id] ?? entry.id.toUpperCase();
  const drawnCountry = SHORT_COUNTRY[entry.id] ?? country;
  const sizes = tileLabelSizes(tile.w, tile.h, drawnName, drawnCountry);
  // The label baselines: a centered stack of the name, the optional country
  // line, and the signed pct. Explicit y (not dy) so the three lines keep
  // even spacing whatever their per-line font sizes.
  const centerY = tile.y + tile.h / 2;
  const cx = tile.x + tile.w / 2;
  const gap = 3;
  let nameY = centerY;
  let countryY: number | null = null;
  let pctY = centerY;
  if (sizes !== null) {
    if (sizes.country !== null) {
      const blockH = sizes.name + sizes.country + sizes.pct + 2 * gap;
      const top = centerY - blockH / 2;
      nameY = top + sizes.name;
      countryY = nameY + gap + sizes.country;
      pctY = countryY + gap + sizes.pct;
    } else {
      const blockH = sizes.name + sizes.pct + gap;
      const top = centerY - blockH / 2;
      nameY = top + sizes.name;
      pctY = nameY + gap + sizes.pct;
    }
  }
  const periodWord = t(PERIOD_WORD_KEY[view]);
  const srValue = pct === null ? t('pd.worldMarkets.noReadingAria') : signedPct(pct, numberLocale, locale);

  const aria = interpolate(t('pd.worldMarkets.treemap.tileAria'), {
    name,
    country,
    value: srValue,
    period: periodWord,
    cap: formatNumber(capT, numberLocale, { maximumFractionDigits: 1 }),
    date: formatAsOf(entry.asOf, locale),
  });

  return (
    <g
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-controls={`insights-market-detail-${entry.id}`}
      aria-label={aria}
      data-treemap-tile={entry.id}
      onClick={() => onToggle(entry.id)}
      onKeyDown={onKeyDown(entry.id)}
      className="insights-focusable cursor-pointer"
      style={{ outline: 'none' }}
    >
      <title>{interpolate(t('pd.worldMarkets.treemap.tileTooltip'), {
        name,
        country,
        level: formatNumber(entry.close, numberLocale, { maximumFractionDigits: entry.close >= 1000 ? 0 : 2 }),
        period: periodWord,
        change: pct === null ? t('pd.worldMarkets.noReadingAria') : signedPct(pct, numberLocale, locale),
        fromHigh: signedPct(entry.fromHigh, numberLocale, locale),
        status: t(STATUS_KEY[statusWordKeyOf(entry.fromHigh)]),
        cap: formatNumber(capT, numberLocale, { maximumFractionDigits: 1 }),
      })}</title>
      <rect
        x={tile.x}
        y={tile.y}
        width={tile.w}
        height={tile.h}
        fill={fill}
        stroke={REGION_STROKE}
        strokeWidth={1}
        className="treemap-tile-rect transition-[fill] duration-300"
      />
      {/* The selection ring (the briefing tile's amber tone) + the hover
       * brighten ride CSS: the rect above transitions fill, the ring is
       * a second stroke-only rect so the gutter never widens. */}
      {open ? (
        <rect x={tile.x + 1} y={tile.y + 1} width={Math.max(tile.w - 2, 0)} height={Math.max(tile.h - 2, 0)} fill="none" stroke={SELECTED_STROKE} strokeWidth={2} pointerEvents="none" />
      ) : null}
      {sizes !== null ? (
        <g pointerEvents="none">
          <text
            x={cx}
            y={nameY}
            textAnchor="middle"
            fontSize={sizes.name}
            fontWeight={700}
            fill="#fff"
            style={{ textShadow: 'rgba(0,0,0,.85) 1px 1px 1px' }}
          >
            {drawnName}
          </text>
          {countryY !== null && sizes.country !== null ? (
            <text
              x={cx}
              y={countryY}
              textAnchor="middle"
              fontSize={sizes.country}
              fontWeight={600}
              fill="rgba(255,255,255,.82)"
              style={{ textShadow: 'rgba(0,0,0,.85) 1px 1px 1px' }}
            >
              {drawnCountry}
            </text>
          ) : null}
          <text
            x={cx}
            y={pctY}
            textAnchor="middle"
            fontSize={sizes.pct}
            fontWeight={700}
            fill="#fff"
            style={{ textShadow: 'rgba(0,0,0,.85) 1px 1px 1px', fontVariantNumeric: 'tabular-nums' }}
          >
            {pct === null ? t('pd.worldMarkets.naWord') : signedPct(pct, numberLocale, locale)}
          </text>
        </g>
      ) : null}
    </g>
  );
}

/* The status words (the briefing's own keys — one status language). */
const STATUS_KEY: Record<StockStateWordKey, TranslationKey> = {
  statusNearHigh: 'pd.worldMarkets.statusNearHigh',
  statusPullback: 'pd.worldMarkets.statusPullback',
  statusCorrection: 'pd.worldMarkets.statusCorrection',
  statusBear: 'pd.worldMarkets.statusBear',
};

const PERIOD_WORD_KEY: Record<MarketsView, TranslationKey> = {
  today: 'pd.worldMarkets.map.periodWordToday',
  '1w': 'pd.worldMarkets.map.periodWordWeek',
  '1m': 'pd.worldMarkets.map.periodWordMonth',
  '3m': 'pd.worldMarkets.map.periodWord3M',
  '1y': 'pd.worldMarkets.map.periodWordYear',
  '5y': 'pd.worldMarkets.map.periodWord5Y',
};
