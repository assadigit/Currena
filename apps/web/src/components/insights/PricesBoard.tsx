/**
 * PricesBoard — round-2 Block R10, re-anatomised by R30 (roast 11 Oct).
 *
 * ONE anatomy for all four tiles, in the same order, with no floating
 * labels: name → LARGE price → the 7d/30d change row (ALWAYS rendered,
 * an em-dash marking a change that does not exist) with the position
 * word INLINE at the row's end → one hedged consequence line → one
 * optional context line (gold in A$ / the Bitcoin ratios — same slot,
 * same style, one line) → "as of".
 *
 * R30 changes:
 *  - Position words are NEUTRAL ink — colour carries status, not
 *    direction (the roast: red "expensive" made gold, silver and oil all
 *    read as warnings).
 *  - Gold, silver and Bitcoin changes are derived CLIENT-SIDE from the
 *    same 10-year history the sparklines fetch (module-cached) — the
 *    feed currently carries change fields for oil only, which is why
 *    only oil used to show changes. Missing data renders "—", never a
 *    fabricated number.
 *  - The Bitcoin ratios collapse into the tile's single context line so
 *    the tile stops being "structured differently".
 */

import { useEffect, useMemo, useState } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { Coins } from 'lucide-react';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { fetchIndicatorHistory } from '../../lib/insights';
import {
  BTC_RATIO_IDS,
  PRICE_ROWS,
  bandWordsOf,
  consequenceLine,
  definitionFor,
  formatChange,
  formatIndicatorValue,
  positionBand,
} from './config';
import { formatAsOf } from './HistoryChart';

/** Client-side 7d/30d change for tiles whose feed reading lacks them. */
function useDerivedChanges(ids: readonly IndicatorId[]): Partial<Record<string, { c7?: number; c30?: number }>> {
  const [derived, setDerived] = useState<Partial<Record<string, { c7?: number; c30?: number }>>>({});
  const needed = ids.filter((id) => PRICE_ROWS.includes(id)).join(',');
  useEffect(() => {
    if (!needed) return;
    let cancelled = false;
    for (const id of needed.split(',')) {
      void fetchIndicatorHistory(id as IndicatorId)
        .then((history) => {
          if (cancelled || !history) return;
          const pts = history.points.filter((p): p is [number, number] => typeof p[1] === 'number');
          if (pts.length < 2) return;
          const last = pts[pts.length - 1]!;
          // The nearest point to N days back — but only if it is really
          // NEAR (≤3 days): a sparse series (early Bitcoin accumulation)
          // must yield "—", never one number repeated for both windows.
          const pick = (back: number): [number, number] | null => {
            const target = last[0] - back;
            let best: [number, number] | null = null;
            for (const p of pts) {
              if (best === null || Math.abs(p[0] - target) < Math.abs(best[0] - target)) best = p;
            }
            return best !== null && Math.abs(best[0] - target) <= 3 ? best : null;
          };
          const kind = definitionFor(id as IndicatorId).changeKind;
          const conv = (then: [number, number] | null): number | undefined => {
            if (!then || then[1] === 0 || last[1] === undefined) return undefined;
            return kind === 'pct' ? ((last[1] - then[1]) / then[1]) * 100 : last[1] - then[1];
          };
          setDerived((prev) =>
            prev[id] && prev[id]!.c7 !== undefined && prev[id]!.c30 !== undefined
              ? prev
              : { ...prev, [id]: { c7: conv(pick(7)), c30: conv(pick(30)) } },
          );
        })
        .catch(() => {
          /* honest absence — the tile shows "—" for a missing change */
        });
    }
    return () => {
      cancelled = true;
    };
  }, [needed]);
  return derived;
}

export function PricesBoard({
  readings,
  copy,
  locale,
  numberLocale,
  onFocusCard,
}: {
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  numberLocale: 'en-US' | 'fa-IR';
  onFocusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
}) {
  const byId = useMemo(() => new Map(readings.map((r) => [r.id as string, r])), [readings]);
  const rows = useMemo(
    () =>
      PRICE_ROWS.map((id) => ({ id, reading: byId.get(id) })).filter(
        (r): r is { id: IndicatorId; reading: IndicatorReading } => r.reading !== undefined,
      ),
    [byId],
  );
  const derived = useDerivedChanges(PRICE_ROWS);
  if (rows.length === 0) return null;

  const ratioRow = (id: IndicatorId): IndicatorReading | undefined =>
    BTC_RATIO_IDS.includes(id) ? byId.get(id) : undefined;
  const goldAud = byId.get('gold-aud');

  return (
    <section id="insights-prices" aria-labelledby="insights-prices-title" className="scroll-mt-24">
      <h2 id="insights-prices-title" className="type-section m-0 mb-1">
        <span className="inline-flex items-center gap-1.5">
          <Coins aria-hidden size={23} strokeWidth={1.8} className="shrink-0 text-[var(--color-status-context)]" />
          {copy.ui.pricesTitle}
        </span>
      </h2>
      <p className="m-0 mb-2 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">
        {copy.ui.pricesSubtitle}
      </p>
      {/* R10: four tiles, one grid, ONE anatomy (R30). Default stretch so
       * the four containers are the SAME width and height — the owner's
       * 11 Oct follow-up: ragged tile bottoms read as a layout bug.
       * h-full on the tile + button keeps the whole box clickable. */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(({ id, reading }) => {
          const def = definitionFor(id);
          const entry = copy.indicators[id];
          const isStale = reading.status === 'stale' || reading.status === 'unavailable';
          const band =
            reading.percentile10y !== undefined
              ? positionBand(reading.percentile10y)
              : null;
          const positionWord = band
            ? band === 'low'
              ? copy.ui.pricePositionLow
              : band === 'high'
                ? copy.ui.pricePositionHigh
                : copy.ui.pricePositionTypical
            : null;
          const valueText =
            reading.value !== null ? formatIndicatorValue(id, reading.value, numberLocale, copy.units) : null;

          // R30: feed changes first, client-side derivation second.
          const c7 = reading.change7d ?? derived[id]?.c7;
          const c30 = reading.change30d ?? derived[id]?.c30;

          // R30: ONE context line per tile, same slot, same style — gold's
          // A$ companion and Bitcoin's two ratios (the roast: "the Bitcoin
          // tile is structured differently").
          const goldPerBtc = id === 'btc-usd' ? ratioRow('gold-btc') : undefined;
          const silverPerBtc = id === 'btc-usd' ? ratioRow('silver-btc') : undefined;
          const contextParts: string[] = [];
          if (id === 'gold-usd' && goldAud && goldAud.value !== null) {
            contextParts.push(
              interpolate(copy.ui.goldAudLine, {
                value: formatIndicatorValue('gold-aud', goldAud.value, numberLocale, copy.units),
              }),
            );
          }
          if (goldPerBtc && goldPerBtc.value !== null) {
            contextParts.push(
              interpolate(copy.ui.goldPerBtc, { value: formatIndicatorValue('gold-btc', goldPerBtc.value, numberLocale, copy.units) }),
            );
          }
          if (silverPerBtc && silverPerBtc.value !== null) {
            contextParts.push(
              interpolate(copy.ui.silverPerBtc, { value: formatIndicatorValue('silver-btc', silverPerBtc.value, numberLocale, copy.units) }),
            );
          }

          return (
            <article
              key={id}
              id={`insights-card-${id}`}
              className={`price-row scroll-mt-24 h-full rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)] ${isStale ? 'opacity-80' : ''}`}
              data-status={reading.status}
            >
              <button
                type="button"
                onClick={(e) => onFocusCard(id, e.currentTarget)}
                aria-expanded={false}
                className="insights-focusable block h-full w-full cursor-pointer border-0 bg-transparent p-0 text-start"
              >
                <span className="flex w-full flex-col items-start gap-1">
                  {/* Plain name — no tickers, no series ids (R14). */}
                  <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-secondary)]">
                    {entry.name}
                  </span>
                  {/* The large price with unit — the largest text in the tile. */}
                  {valueText !== null ? (
                    <bdi dir="ltr" className={`type-number text-[var(--color-text-primary)] ${isStale ? 'text-[var(--color-text-secondary)]' : ''}`}>
                      {valueText}
                    </bdi>
                  ) : (
                    <span className="type-number text-[var(--color-text-secondary)]">—</span>
                  )}
                  {reading.status === 'unavailable' ? (
                    <span className="text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
                      {copy.ui.unavailableCard}
                    </span>
                  ) : null}
                  {/* R30: the change row ALWAYS renders — same anatomy for
                   * all four tiles; "—" marks a change that doesn't exist.
                   * The position word rides INLINE at the row's end (the
                   * roast: "the 'expensive' label floats alone") and stays
                   * NEUTRAL ink — colour carries status, not direction. */}
                  <span className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
                    <bdi dir="ltr">
                      {c7 !== undefined ? formatChange(c7, def.changeKind, numberLocale, copy.units) : '—'}
                      <span className="ms-1 opacity-80">{copy.ui.days7}</span>
                    </bdi>
                    <bdi dir="ltr">
                      {c30 !== undefined ? formatChange(c30, def.changeKind, numberLocale, copy.units) : '—'}
                      <span className="ms-1 opacity-80">{copy.ui.days30}</span>
                    </bdi>
                    {band && positionWord ? (
                      <span className="ms-auto font-bold text-[var(--color-text-primary)]">{positionWord}</span>
                    ) : null}
                  </span>
                  {/* One hedged practical consequence line. */}
                  {reading.status !== 'unavailable' ? (
                    <span className="block text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
                      {consequenceLine(reading, entry, true, bandWordsOf(copy))}
                    </span>
                  ) : null}
                  {/* R30: the ONE optional context line — same slot and
                   * style on every tile (gold A$ / Bitcoin ratios). */}
                  {contextParts.length > 0 ? (
                    <span
                      className="block text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]"
                      data-price-context
                    >
                      <bdi>{contextParts.join(' · ')}</bdi>
                    </span>
                  ) : null}
                  {/* PB3: "as of {date}"; stale chips only past the limit. */}
                  <span className="flex flex-wrap items-baseline gap-x-2 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
                    {reading.asOf ? <bdi>{interpolate(copy.ui.pricesAsOf, { date: formatAsOf(reading.asOf, locale) })}</bdi> : null}
                    {reading.status === 'stale' && reading.asOf ? (
                      <bdi className="font-semibold">{interpolate(copy.ui.staleSince, { date: formatAsOf(reading.asOf, locale) })}</bdi>
                    ) : null}
                  </span>
                  <span className="sr-only"> — {copy.ui.viewCard}</span>
                </span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
