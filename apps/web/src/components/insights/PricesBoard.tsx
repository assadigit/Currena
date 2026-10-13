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
 *  - Position words follow the price position band's status ink —
 *    expensive = the alert red, cheap = the supportive green, typical
 *    stays neutral (R31 owner decree, restoring the pre-R30 valence:
 *    "everywhere which is marked 'expensive' use red color"). Never
 *    colour alone: the word rides beside the change numbers.
 *  - Gold, silver and Bitcoin changes are derived CLIENT-SIDE from the
 *    same 10-year history the sparklines fetch (module-cached) — the
 *    feed currently carries change fields for oil only, which is why
 *    only oil used to show changes. Missing data renders "—", never a
 *    fabricated number.
 *  - The Bitcoin ratios collapse into the tile's single context line so
 *    the tile stops being "structured differently".
 */

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { Coins } from 'lucide-react';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { fetchIndicatorHistory } from '../../lib/insights';
import { IconImg, indicatorIconUrl } from '../icons/currena';
import {
  BTC_RATIO_IDS,
  PRICE_ROWS,
  bandToneClass,
  bandWordsOf,
  consequenceLine,
  definitionFor,
  formatChange,
  formatFromPeak,
  formatIndicatorValue,
  friendlySource,
  positionBand,
} from './config';
import { formatAsOf } from './HistoryChart';

/* ------------------------------------------------------------------ *
 * Round 24 (roast #5): a small PICTOGRAM per commodity — the price
 * lane was the last icon-less strip (the roast: "add warmth via small
 * commodity pictograms"). Round 28 (owner): the stroke glyphs are GONE
 * — every tile now wears the owner's own artwork (oil barrel, gold
 * bar, silver bar, bitcoin) at its natural colours inside the same
 * tinted box; gold keeps the brand-gold box, the others the quiet
 * context tint. aria-hidden — the name carries the meaning.
 * ------------------------------------------------------------------ */
/** The tile's icon box — gold wears the brand-gold accent (round 24),
 * the rest stay in the neutral context tint (money-panel language).
 * Round 29r2 (owner): "the main prices … must have at least 128×128 icon
 * in pc." The artwork IS the tile's face now — 96px on mobile, 128px on
 * ≥640px screens (the 256px sources downscale cleanly), filling the
 * tinted box edge to edge like a framed plate. The box sits ABOVE the
 * name/price (stacked card) — beside a 128px artwork the 4-across grid
 * left only ~100px for the largest number on the page, and in fa the
 * price wrapped to three lines (owner: numbers must align). */
function PriceIconBox({ id }: { id: IndicatorId }) {
  const isGold = id === 'gold-usd';
  const icon = indicatorIconUrl(id);
  return (
    <span
      aria-hidden="true"
      className={`grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] ring-1 ring-[var(--color-border)] sm:h-32 sm:w-32 ${
        isGold ? 'bg-[var(--color-accent-gold)]/25' : 'bg-currena-soft/70'
      }`}
    >
      {icon !== null ? (
        <IconImg src={icon} size={96} desktopSize={128} />
      ) : (
        <Coins
          aria-hidden
          strokeWidth={1.2}
          className="currena-icon text-[var(--color-status-context)]"
          style={{ '--icon-size': '96px', '--icon-size-sm': '128px' } as CSSProperties}
        />
      )}
    </span>
  );
}

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
          <Coins aria-hidden size={26} strokeWidth={1.8} className="shrink-0 text-[var(--color-status-context)]" />
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
          // Step-1 audit item C2: the ratios are INVERTED for display —
          // "One bitcoin buys 19.6 oz of gold" / "about 1,368 oz of silver"
          // (the stored gold-btc/silver-btc are oz-per-₿ fractions; the old
          // "Gold per Bitcoin: 0.0509" label read as the inverse of itself).
          if (goldPerBtc && goldPerBtc.value !== null && goldPerBtc.value > 0) {
            const ozGold = formatNumber(1 / goldPerBtc.value, numberLocale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            });
            contextParts.push(interpolate(copy.ui.btcBuysGold, { value: ozGold }));
          }
          if (silverPerBtc && silverPerBtc.value !== null && silverPerBtc.value > 0) {
            const ozSilver = formatNumber(1 / silverPerBtc.value, numberLocale, {
              maximumFractionDigits: 0,
            });
            contextParts.push(interpolate(copy.ui.btcBuysSilver, { value: ozSilver }));
          }
          // Step-1 audit item C9: distance from the 10-year peak — the same
          // honesty the stock tiles carry ("easing from highs" now says HOW far).
          const fromPeak = reading.fromPeak10y;
          if (fromPeak !== undefined && fromPeak < -0.05) {
            contextParts.push(
              formatFromPeak(fromPeak, numberLocale, (pct) => interpolate(copy.ui.belowPeak, { pct })),
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
                {/* h-full: buttons vertically centre short content (UA
                 * behaviour) — without it the name/price/change rows start
                 * at a DIFFERENT y per tile (owner: every heading on the
                 * same line, every number aligned). Filling the button
                 * pins the column to the top in all four tiles.
                 * Round 29r2 (owner): the 128px artwork leads the tile as
                 * its face; the name and the big price stack UNDER it at
                 * full tile width (beside it they wrapped fa prices to
                 * three lines). The name rides in a fixed two-line slot so
                 * the price — and everything under it — starts at the SAME
                 * y in every tile, wrapped or not. */}
                <span className="flex h-full w-full flex-col items-start gap-1">
                  <PriceIconBox id={id} />
                  {/* Plain name — no tickers, no series ids (R14). The
                   * two-line min-height (2 × leading-snug) keeps the price
                   * rows aligned across tiles even when a neighbour's name
                   * wraps (round 24, roast #5). */}
                  <span className="min-h-[2.75em] text-[length:var(--type-label)] font-bold leading-snug text-[var(--color-text-secondary)]">
                    {entry.name}
                  </span>
                  {/* The large price with unit — the largest text in the tile.
                   * Plain <bdi> (auto direction): the fa unit word lands on
                   * the same side of the digits in EVERY tile — the old
                   * dir="ltr" flipped "۱۲۵٫۴۴ دلار" to "دلار ۱۲۵٫۴۴" in
                   * some tiles and not others (owner: numbers must align). */}
                  {valueText !== null ? (
                    <bdi className={`type-number tabular-nums text-[var(--color-text-primary)] ${isStale ? 'text-[var(--color-text-secondary)]' : ''}`}>
                      {valueText}
                    </bdi>
                  ) : (
                    <span className="type-number text-[var(--color-text-secondary)]">{copy.ui.na}</span>
                  )}
                  {reading.status === 'unavailable' ? (
                    <span className="text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
                      {copy.ui.unavailableCard}
                    </span>
                  ) : null}
                  {/* R30 → round 24 (roast #5): the change row keeps ONE
                   * anatomy, but a missing change renders a QUIET em-dash —
                   * the old "ناموجود / n/a" twice per tile read as six empty
                   * labels in a strip that should be clean. */}
                  <span className="flex w-full flex-wrap items-baseline gap-x-4 gap-y-0.5 text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
                    <span className="inline-flex items-baseline gap-1">
                      <bdi dir="ltr" className="min-w-[4.75rem]">
                        {c7 !== undefined ? formatChange(c7, def.changeKind, numberLocale, copy.units) : '—'}
                      </bdi>
                      <span className="opacity-80">{copy.ui.days7}</span>
                    </span>
                    <span className="inline-flex items-baseline gap-1">
                      <bdi dir="ltr" className="min-w-[4.75rem]">
                        {c30 !== undefined ? formatChange(c30, def.changeKind, numberLocale, copy.units) : '—'}
                      </bdi>
                      <span className="opacity-80">{copy.ui.days30}</span>
                    </span>
                    {band && positionWord ? (
                      <span
                        className={`ms-auto whitespace-nowrap font-bold ${
                          bandToneClass(band) || 'text-[var(--color-text-primary)]'
                        }`}
                        data-price-position={band}
                      >
                        {positionWord}
                      </span>
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
                  {/* PB3: "as of {date}"; stale chips only past the limit.
                   * Step-1 audit item A9: the tile names its SOURCE AND
                   * CONTRACT (Brent futures BZ=F vs the EIA spot base; the
                   * metals' live futures vs the EOD spot backbone) — the
                   * reader can tell exactly which price this is. */}
                  <span className="flex flex-wrap items-baseline gap-x-2 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
                    {reading.asOf ? <bdi>{interpolate(copy.ui.pricesAsOf, { date: formatAsOf(reading.asOf, locale) })}</bdi> : null}
                    {reading.status === 'stale' && reading.asOf ? (
                      <bdi className="font-semibold">{interpolate(copy.ui.staleSince, { date: formatAsOf(reading.asOf, locale) })}</bdi>
                    ) : null}
                    <bdi className="opacity-80">· {friendlySource(reading.sourceName)}</bdi>
                  </span>
                  <span className="sr-only">, {copy.ui.viewCard}</span>
                </span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
