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
import { Coins } from 'lucide-react';
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
 * the verdict chip's face.
 * 2026-10-20 (owner sketch): the chip header puts the artwork in a SMALL
 * tinted corner box (56/64px) — the chart, not the artwork, owns the
 * chip now. The tint follows the price tiles' language: gold wears the
 * brand-gold box, silver the quiet context tint. */
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

/** The chip header's boxed artwork (2026-10-20 owner sketch) — the same
 * tinted-box language as the prices board's PriceIconBox, miniaturised. */
export function MetalIconBox({ metal }: { metal: 'gold' | 'silver' }) {
  const isGold = metal === 'gold';
  const icon = indicatorIconUrl(metal === 'gold' ? 'gold-usd' : 'silver-usd');
  return (
    <span
      aria-hidden="true"
      className={`grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] ring-1 ring-[var(--color-border)] sm:h-16 sm:w-16 ${
        isGold ? 'bg-[var(--color-accent-gold)]/25' : 'bg-currena-soft/70'
      }`}
    >
      {icon !== null ? (
        <IconImg src={icon} size={40} desktopSize={48} />
      ) : (
        <Coins
          aria-hidden
          strokeWidth={1.2}
          className="currena-icon text-[var(--color-status-context)]"
          style={{ '--icon-size': '40px', '--icon-size-sm': '48px' } as CSSProperties}
        />
      )}
    </span>
  );
}

export const verdictTone: Record<SignalVerdict, string> = {
  up: 'text-[var(--color-status-normal)]',
  down: 'text-[var(--color-status-alert)]',
  flat: 'text-[var(--color-status-stale)]',
};

/* ---------------------------------------------------------------- *
 * Round 33 (owner): the Estimation chip's white space is the metal's
 * own price history — clickable range chips (Quarter · One year · Five
 * years · — since 2026-10-20's owner request — Ten years) + a signed
 * window delta. Round 34 (owner): the charts grew real X/Y axes and a
 * hover inspector, and they moved into the SHARED TrendPanel
 * (TrendChart.tsx) — the exact structure the money panel's mini charts
 * now wear, so both sections stay aligned by construction. Data rides
 * the same module-cached /api/insights/:id/history fetch the details
 * panel uses, so opening a card later never re-downloads.
 * ---------------------------------------------------------------- */

export type StripRange = 'quarter' | '1y' | '5y' | '10y';

/** The per-metal trend chart inside an Estimation chip (round 33/34).
 * 2026-10-20 (owner sketch): the chart is THE body of the chip — a tall
 * plot (h-40 mobile / h-52 desktop, vs the old h-20) so the TREND, not
 * the price, is the emphasis. Same day (owner): "Add 10 year View of the
 * gold and silver price as well" — the chips offer the full decade; the
 * history feed already carries the complete 10-year daily series for
 * both metals, so the window is always plottable in practice. */
export function MetalTrendChart({
  metal,
  copy,
  numberLocale,
  plotHeightClass = 'h-40 sm:h-52',
}: {
  metal: 'gold' | 'silver';
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  plotHeightClass?: string;
}) {
  const s = copy.signals;
  const id = metal === 'gold' ? 'gold-usd' : 'silver-usd';
  return (
    <TrendPanel
      id={id}
      copy={copy}
      numberLocale={numberLocale}
      plotHeightClass={plotHeightClass}
      ranges={['quarter', '1y', '5y', '10y']}
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
  prices,
  copy,
  numberLocale,
}: {
  gold: SignalReading;
  silver: SignalReading;
  /** Each metal's current price, display-formatted (2026-10-20 owner
   * sketch): the header carries it in a LIGHTER ink — the price already
   * leads the prices board above; here the TREND is the emphasis. */
  prices: { gold: string | null; silver: string | null };
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const s = copy.signals;
  const rows = [
    { reading: gold, verdict: verdictOf(gold), price: prices.gold },
    { reading: silver, verdict: verdictOf(silver), price: prices.silver },
  ];
  if (rows.every((r) => r.verdict === null)) return null;
  /* Round 31 (owner): the strip is THE answer of the whole card — "it's
   * the verdict and estimation of the whole section" — so it carries the
   * app's focal-section recipe (a brand-gold gradient field, 2px gold
   * ring, gold-tinted shadow) so the white verdict chips pop.
   * 2026-10-20 OWNER SKETCH — the chip is redrawn as an ANALYSIS card:
   *   [ boxed artwork (start corner) · name + verdict · price (lighter) ]
   *   [ THE TREND — one BIG chart filling the rest of the chip           ]
   *   [ range chips · window delta                                       ]
   * ONE anatomy for mobile AND desktop (the old artwork-column-vs-chart
   * side split is gone — "do the same for mobile view"). The price rides
   * in the muted ink (it already leads the prices board; the trend is
   * the emphasis), the artwork shrinks into a small tinted box, and the
   * chart grows to h-40/h-52. The verdict word keeps a floored two-line
   * slot so the two desktop chips' charts start on the same baseline
   * (the round-34 alignment rule, kept by structure). */
  return (
    <div
      className="flex flex-col gap-2 rounded-[var(--radius-lg)] bg-gradient-to-b from-[var(--color-accent-gold)]/[0.16] via-[var(--color-accent-gold)]/[0.07] to-transparent p-3.5 shadow-[0_10px_34px_rgba(168,126,28,0.15)] ring-2 ring-[var(--color-accent-gold)]/45 sm:p-4 dark:shadow-[0_14px_44px_rgba(0,0,0,0.45)]"
      data-signal-verdict
    >
      <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-secondary)]">
        {s.verdictTitle}
      </h4>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 sm:flex-row">
        {rows.map(({ reading, verdict, price }) => (
          <li
            key={reading.metal}
            data-verdict-metal={reading.metal}
            data-verdict-direction={verdict ?? 'none'}
            className="flex min-w-0 flex-1 flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)]"
          >
            {/* Header: boxed artwork · name + verdict · price (lighter). */}
            <div className="flex items-center gap-3">
              <MetalIconBox metal={reading.metal} />
              <span className="min-w-0 flex-1">
                <span className="block text-[length:var(--type-label)] font-bold leading-snug text-[var(--color-text-primary)]">
                  {s.metals[reading.metal]}
                </span>
                <span
                  className={`mt-0.5 inline-flex min-h-[2.5em] items-center gap-1.5 ${
                    verdict !== null ? verdictTone[verdict] : 'text-[var(--color-status-stale)]'
                  }`}
                >
                  <VerdictIcon verdict={verdict ?? 'flat'} />
                  <span className="text-[length:var(--type-label)] font-bold leading-tight">
                    {verdict === 'up' ? s.verdictUp : verdict === 'down' ? s.verdictDown : verdict === 'flat' ? s.verdictFlat : s.verdictNone}
                  </span>
                </span>
              </span>
              {price !== null ? (
                <bdi className="shrink-0 whitespace-nowrap text-[length:var(--type-label)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
                  {price}
                </bdi>
              ) : null}
            </div>
            {/* THE TREND — the big chart fills the rest of the chip. */}
            <div
              data-verdict-chart={reading.metal}
              className="flex min-w-0 flex-1 flex-col justify-center gap-1.5"
            >
              <MetalTrendChart metal={reading.metal} copy={copy} numberLocale={numberLocale} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
