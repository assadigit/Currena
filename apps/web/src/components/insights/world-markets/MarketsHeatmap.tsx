/**
 * world-markets/MarketsHeatmap — the optional desktop performance map
 * (02-ui-spec §3.6, the 2026-10-18 world-indices handoff round).
 *
 * Rules that shape this file:
 *  - EQUAL-AREA tiles: the source supplies no comparable weighting metric
 *    (no market caps in the contract), so a tile's size never implies
 *    importance — 16 identical cells, trading-day order (§3.6's hard
 *    rule; a treemap by return magnitude is explicitly a non-goal).
 *  - Colour encodes the SELECTED period's return on a symmetric scale
 *    (briefing.heatmapScale); the legend is visible, centred on zero, and
 *    states that intensity is relative to the selected period.
 *  - Colour is never the only signal: every tile shows its name and its
 *    exact SIGNED percentage, and the index list/table carries the same
 *    content (§3.6, §9 — the heatmap is secondary to precise comparison).
 *  - Hover is supplementary: tiles are real buttons — keyboard focus and
 *    tap open the same detail panel the list's tiles open, so mobile and
 *    keyboard users lose nothing. A missing lens reading keeps the tile
 *    neutral with the honest dash (never 0).
 */

import type { MarketEntry, MarketId } from '@currena/core';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { heatToneOf, heatmapScale, periodValueOf } from './briefing';
import { bandedArrow, periodWord, percentGlyph, signedPct, type MarketsView } from './shared';

/** The tint ramp: three intensity steps per direction on the app's own
 * success/alert families (light and dark variants both resolve), the
 * neutral surface for zero/missing. Text ink stays the theme's primary —
 * readable on every step, both themes. */
const TONE_CLASS: Record<ReturnType<typeof heatToneOf>, string> = {
  zero: 'bg-[var(--color-surface)]',
  pos1: 'bg-currena-success/15',
  pos2: 'bg-currena-success/30',
  pos3: 'bg-currena-success/55',
  neg1: 'bg-currena-warning/15',
  neg2: 'bg-currena-warning/30',
  neg3: 'bg-currena-warning/55',
};

export function MarketsHeatmap({
  markets,
  view,
  copy,
  locale,
  numberLocale,
  onOpenTile,
}: {
  /** Rows in trading-day order (the shell passes them grouped east→west,
   * flattened); DOM order = reading order in both directions. */
  markets: readonly MarketEntry[];
  view: MarketsView;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  /** Opens the same detail panel the list's tiles open (§3.6). */
  onOpenTile: (id: MarketId, opener: HTMLElement | null) => void;
}) {
  const scale = heatmapScale(markets, view);
  const period = periodWord(view, copy);
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });

  return (
    <div className="flex flex-col gap-2">
      {/* The equal-area grid: 16 identical cells — size carries NO meaning
       * (no weighting metric exists in the contract; §3.6). */}
      <ul className="m-0 grid list-none grid-cols-2 gap-1.5 p-0 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        {markets.map((m) => {
          const marketCopy = copy.markets.entries[m.id];
          const pct = periodValueOf(m, view);
          const tone = heatToneOf(pct, scale);
          const arrow = pct === null ? null : bandedArrow(pct);
          const aria = interpolate(copy.markets.heatmapValueAria, {
            name: marketCopy.name,
            country: marketCopy.country,
            value: pct === null ? copy.markets.noReadingAria : signedPct(pct, numberLocale, locale),
            period,
          });
          return (
            <li key={m.id}>
              <button
                type="button"
                id={`insights-market-heat-${m.id}`}
                aria-label={aria}
                title={aria}
                onClick={(e) => onOpenTile(m.id, e.currentTarget)}
                className={`insights-focusable flex min-h-[64px] w-full cursor-pointer flex-col items-start justify-between gap-1 rounded-[var(--radius-md)] p-2 text-start ring-1 ring-[var(--color-border)] transition-colors hover:ring-currena-muted/60 ${TONE_CLASS[tone]}`}
              >
                <span className="w-full truncate text-[length:var(--type-caption)] font-bold leading-snug text-[var(--color-text-primary)]">
                  {marketCopy.name}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-text-primary)]">
                  <bdi dir="ltr" className="tabular-nums">
                    {pct === null ? '—' : signedPct(pct, numberLocale, locale)}
                  </bdi>
                  {arrow === null ? null : (
                    <span aria-hidden="true" className="text-[0.8em] leading-none">
                      {arrow === 'up' ? '▲' : arrow === 'down' ? '▼' : '→'}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {/* The visible legend, centred on zero (§3.6). The axis runs
       * left→right even in Farsi — the same LTR rule the charts follow
       * (§6.7) — with the period-relative note beside it. */}
      <div dir="ltr" className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="flex items-center gap-1.5">
          <bdi className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
            −{num(scale)}{percentGlyph(locale)}
          </bdi>
          <span
            aria-hidden="true"
            className="h-2 w-28 rounded-full sm:w-40"
            style={{
              background:
                'linear-gradient(to right, var(--color-currena-warning) 0%, color-mix(in srgb, var(--color-currena-warning) 15%, transparent) 50%, color-mix(in srgb, var(--color-currena-success) 15%, transparent) 50%, var(--color-currena-success) 100%)',
            }}
          />
          <bdi className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
            +{num(scale)}{percentGlyph(locale)}
          </bdi>
        </span>
        <span dir={locale === 'fa' ? 'rtl' : 'ltr'} className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          {copy.markets.heatmapLegendLabel}
        </span>
      </div>
    </div>
  );
}
