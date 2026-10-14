/**
 * signals/verdict — Round 23's stated estimation (owner): the mechanical
 * tally (supportive minus against; the sign is the direction), the
 * verdict icons/artwork and the Estimation chip strip with its per-metal
 * price-history charts (rounds 26–34) (Phase: WS-4 module split of the
 * former Signals.tsx monolith — zero behavior change, code moved
 * verbatim; the shell and the merged card import these so the collapsed
 * line and the strip can never drift apart on tally semantics).
 */

import type { CSSProperties } from 'react';
import type { SignalReading } from '@currena/insights';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { DIRECTION_DOWN_URL, DIRECTION_UP_URL, IconImg, indicatorIconUrl } from '../../icons/currena';
import { formatIndicatorValue } from '../config';
import { TREND_RANGE_COPY_KEY, TrendPanel, trendTickFormatter } from '../TrendChart';

export type SignalVerdict = 'up' | 'down' | 'flat';

export function verdictOf(reading: SignalReading): SignalVerdict | null {
  const supportive = reading.conditions.filter((c) => c.state === 'supportive').length;
  const against = reading.conditions.filter((c) => c.state === 'against').length;
  if (supportive + against === 0) return null; // nothing could be read
  if (supportive > against) return 'up';
  if (against > supportive) return 'down';
  return 'flat';
}

export function VerdictIcon({
  verdict,
  size = 28,
  desktopSize = 36,
}: {
  verdict: SignalVerdict;
  size?: number;
  desktopSize?: number;
}) {
  /* Round 28 (owner artwork): the metals' up/down arrows wear the owner's
   * green zigzag / red zigzag PNGs — their fixed colours match this card's
   * valence by construction (up = the holder's gain). The flat dash stays
   * a stroke glyph in the neutral ink (there is no "flat" artwork).
   * Round 29 (owner): both grow to the strip's new scale (28 mobile /
   * 36 desktop) — the estimation is this card's answer. */
  if (verdict === 'up') return <IconImg src={DIRECTION_UP_URL} size={size} desktopSize={desktopSize} />;
  if (verdict === 'down') return <IconImg src={DIRECTION_DOWN_URL} size={size} desktopSize={desktopSize} />;
  const common = {
    className: 'currena-icon shrink-0',
    style: {
      '--icon-size': `${size}px`,
      '--icon-size-sm': `${desktopSize}px`,
    } as CSSProperties,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
  return (
    <svg {...common}>
      <path d="M3 8h10" />
    </svg>
  );
}

/** The metal's own artwork beside its name (round 28) — gold bar, silver
 * bar; unmapped metals (none today) fall back to no icon. Round 29
 * (owner): 28/36 defaults; round 31: the verdict strip calls it at the
 * price tiles' scale — 96px mobile / 128×128 desktop — the artwork IS
 * the verdict chip's face. */
export function MetalIcon({
  metal,
  size = 28,
  desktopSize = 36,
}: {
  metal: 'gold' | 'silver';
  size?: number;
  desktopSize?: number;
}) {
  const icon = indicatorIconUrl(metal === 'gold' ? 'gold-usd' : 'silver-usd');
  return icon !== null ? <IconImg src={icon} size={size} desktopSize={desktopSize} /> : null;
}

export const verdictTone: Record<SignalVerdict, string> = {
  up: 'text-[var(--color-status-normal)]',
  down: 'text-[var(--color-status-alert)]',
  flat: 'text-[var(--color-status-stale)]',
};

/* ---------------------------------------------------------------- *
 * Round 33 (owner): the Estimation chip's white space is the metal's
 * own price history — clickable range chips (Quarter · One year · Five
 * years) + a signed window delta. Round 34 (owner): the charts grew
 * real X/Y axes and a hover inspector, and they moved into the SHARED
 * TrendPanel (TrendChart.tsx) — the exact structure the money panel's
 * mini charts now wear, so both sections stay aligned by construction.
 * Data rides the same module-cached /api/insights/:id/history fetch
 * the details panel uses, so opening a card later never re-downloads.
 * ---------------------------------------------------------------- */

export type StripRange = 'quarter' | '1y' | '5y';

/** The per-metal trend chart inside an Estimation chip (round 33/34). */
export function MetalTrendChart({
  metal,
  copy,
  numberLocale,
}: {
  metal: 'gold' | 'silver';
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const s = copy.signals;
  const id = metal === 'gold' ? 'gold-usd' : 'silver-usd';
  return (
    <TrendPanel
      id={id}
      copy={copy}
      numberLocale={numberLocale}
      ariaLabelFor={(range: StripRange) =>
        interpolate(copy.ui.stripChartAria, {
          metal: s.metals[metal],
          range: copy.ui[TREND_RANGE_COPY_KEY[range]],
        })
      }
      formatValue={(v) => formatIndicatorValue(id, v, numberLocale, copy.units)}
      formatTickValue={trendTickFormatter(numberLocale)}
      rangeGroupData={{ 'data-verdict-chart-range': metal }}
      deltaData={{ 'data-verdict-chart-delta': metal }}
      plotData={{ 'data-verdict-plot': metal }}
    />
  );
}

export function VerdictStrip({
  gold,
  silver,
  copy,
  numberLocale,
}: {
  gold: SignalReading;
  silver: SignalReading;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const s = copy.signals;
  const rows = [
    { reading: gold, verdict: verdictOf(gold) },
    { reading: silver, verdict: verdictOf(silver) },
  ];
  if (rows.every((r) => r.verdict === null)) return null;
  /* Round 31 (owner): the strip is THE answer of the whole card — "it's
   * the verdict and estimation of the whole section" — so it now carries
   * the app's focal-section recipe (the money panel's, round 29): a
   * brand-gold gradient field with a 2px gold ring and a gold-tinted
   * shadow, so the white verdict chips pop against the card. The metal
   * artwork leads each chip at the price tiles' scale (96px mobile /
   * 128×128 desktop) with the metal name under it, and the verdict word
   * speaks at the price's own size in the verdict ink (icon + word,
   * never colour alone).
   * Round 33 (owner): the chip's white space is no longer empty — the
   * metal's own price history (chart + clickable Quarter / 1 year /
   * 5 years chips) fills the space right of the artwork on desktop and
   * sits under it on phones.
   * Round 34 (owner, alignment rule): the two chips align BY
   * STRUCTURE, not by luck — the verdict word owns a fixed two-line
   * slot (silver's «جهت روشنی ندارد» wraps, gold's «پایین می‌آید»
   * doesn't; the slot keeps both tiles' rows on the same baselines),
   * and the chart column owns a reserved height so loading/none states
   * can't pull one tile's chips row above the other's. */
  return (
    <div
      className="flex flex-col gap-2 rounded-[var(--radius-lg)] bg-gradient-to-b from-[var(--color-accent-gold)]/[0.16] via-[var(--color-accent-gold)]/[0.07] to-transparent p-3.5 shadow-[0_10px_34px_rgba(168,126,28,0.15)] ring-2 ring-[var(--color-accent-gold)]/45 sm:p-4 dark:shadow-[0_14px_44px_rgba(0,0,0,0.45)]"
      data-signal-verdict
    >
      <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-secondary)]">
        {s.verdictTitle}
      </h4>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 sm:flex-row">
        {rows.map(({ reading, verdict }) => (
          <li
            key={reading.metal}
            data-verdict-metal={reading.metal}
            data-verdict-direction={verdict ?? 'none'}
            className="flex min-w-0 flex-1 flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex shrink-0 flex-col items-start gap-1 sm:w-40">
              <MetalIcon metal={reading.metal} size={96} desktopSize={128} />
              <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-secondary)]">
                {s.metals[reading.metal]}
              </span>
              <span
                className={`inline-flex min-h-[2.5em] items-center gap-1.5 ${
                  verdict !== null ? verdictTone[verdict] : 'text-[var(--color-status-stale)]'
                }`}
              >
                <VerdictIcon verdict={verdict ?? 'flat'} />
                <span className="text-[length:var(--type-number)] font-bold leading-tight">
                  {verdict === 'up' ? s.verdictUp : verdict === 'down' ? s.verdictDown : verdict === 'flat' ? s.verdictFlat : s.verdictNone}
                </span>
              </span>
            </div>
            <div
              data-verdict-chart={reading.metal}
              className="flex min-h-[136px] min-w-0 flex-1 flex-col justify-center gap-1.5 sm:border-s sm:border-[var(--color-border)] sm:ps-4"
            >
              <MetalTrendChart metal={reading.metal} copy={copy} numberLocale={numberLocale} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
