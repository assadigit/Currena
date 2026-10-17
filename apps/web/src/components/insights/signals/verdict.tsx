/**
 * signals/verdict — the metals' stated outlook. Round 23's mechanical
 * tally (supportive minus against; the sign is the direction), the
 * verdict icons/artwork and the Estimation chip strip with its per-metal
 * price-history charts (rounds 26–34) — and, since 2026-10-21, the
 * owner's SEVEN-STATE "Gold Market Outlook" classification
 * (`outlookOf` + the exact bilingual sentences) replacing the old
 * up/down/flat words that had drifted apart between locales.
 * (Phase: WS-4 module split of the former Signals.tsx monolith; the
 * shell and the merged card import these so the collapsed line and the
 * strip can never drift apart on tally semantics.)
 */

import type { CSSProperties } from 'react';
import type { SignalReading } from '@currena/insights';
import { LEAN_STRONG } from '@currena/insights';
import { Coins } from 'lucide-react';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { DIRECTION_DOWN_URL, DIRECTION_UP_URL, IconImg, indicatorIconUrl } from '../../icons/currena';
import { formatIndicatorValue } from '../config';
import { TREND_RANGE_COPY_KEY, TrendPanel, trendTickFormatter } from '../TrendChart';

/* ------------------------------------------------------------------ *
 * The gold/silver OUTLOOK (2026-10-21 owner directive, "Gold Market
 * Outlook — Complete State List"): SEVEN states with exact bilingual
 * sentences, replacing the old up/down/flat tally words whose EN
 * ("Works against") and FA («شرایط موجود با الگوی معمول هم‌خوانی ندارد»)
 * had drifted into saying different things — the bug this fixes.
 *
 * The owner's state logic, mapped onto the condition tally (S supportive
 * vs A against; gold 5 conditions, silver 6):
 *   strong-bullish / strong-bearish — STRONG signals favor the move: the
 *     same bar the card's lean already speaks (LEAN_STRONG = 4 conditions
 *     on one side; ≥4 implies the majority, so no second check needed).
 *   bullish / bearish — a majority of the directional conditions favors
 *     the move.
 *   mixed — the directional conditions conflict with no majority (S = A).
 *   range-bound — no clear driver edge (the split within one) AND the
 *     price itself consolidates: |30-day speed| < RANGE_SPEED_PCT with
 *     the price in the typical band of its 10-year range. The owner's
 *     distinction is kept honest: Neutral = no directional bias (all
 *     readable conditions sit neutral); Range-Bound = the affirmative
 *     "prices trade within a defined range, no breakout" read, which
 *     needs the quiet-price evidence; Mixed = the indicators disagree.
 *   neutral — readable conditions, none directional.
 * `null` stays "nothing could be read" (every condition unreadable —
 * verdictNone), exactly as before.
 * ------------------------------------------------------------------ */

export type OutlookState =
  | 'strong-bullish'
  | 'bullish'
  | 'neutral'
  | 'range-bound'
  | 'bearish'
  | 'strong-bearish'
  | 'mixed';

/** A 30-day move under this many PERCENT is a consolidation for the metals
 * (trending months run well above it) — half of the range-bound evidence,
 * beside the price sitting in the typical band of its 10-year range.
 * Percent units by construction: change30d on price rows is % (scoring). */
export const RANGE_SPEED_PCT = 2;

export function outlookOf(reading: SignalReading): OutlookState | null {
  const supportive = reading.conditions.filter((c) => c.state === 'supportive').length;
  const against = reading.conditions.filter((c) => c.state === 'against').length;
  const unknown = reading.conditions.filter((c) => c.state === 'unknown').length;
  if (unknown === reading.conditions.length) return null; // nothing could be read
  if (supportive >= LEAN_STRONG) return 'strong-bullish'; // ≥4 of ≤6 ⇒ majority
  if (against >= LEAN_STRONG) return 'strong-bearish';
  const rangeEvidence =
    reading.speed !== null &&
    Math.abs(reading.speed) < RANGE_SPEED_PCT &&
    reading.position !== null &&
    reading.position.band === 'typical';
  if (rangeEvidence && Math.abs(supportive - against) <= 1) return 'range-bound';
  if (supportive === against) return supportive > 0 ? 'mixed' : 'neutral';
  return supportive > against ? 'bullish' : 'bearish';
}

export function VerdictIcon({
  verdict,
  size = 28,
  desktopSize = 36,
}: {
  verdict: OutlookState | null;
  size?: number;
  desktopSize?: number;
}) {
  /* Round 28 (owner artwork): the metals' up/down arrows wear the owner's
   * green zigzag / red zigzag PNGs — their fixed colours match this card's
   * valence by construction (up = the holder's gain). The flat dash stays
   * a stroke glyph in the neutral ink (there is no "flat" artwork); the
   * outlook's calm states (neutral / range-bound / mixed) and the unread
   * null share it.
   * Round 29 (owner): both grow to the strip's new scale (28 mobile /
   * 36 desktop) — the estimation is this card's answer. */
  if (verdict === 'strong-bullish' || verdict === 'bullish')
    return <IconImg src={DIRECTION_UP_URL} size={size} desktopSize={desktopSize} />;
  if (verdict === 'strong-bearish' || verdict === 'bearish')
    return <IconImg src={DIRECTION_DOWN_URL} size={size} desktopSize={desktopSize} />;
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

/** The outlook's ink: the bullish family wears the normal (green) ink, the
 * bearish family the alert (red) ink — colour never rides alone, the
 * zigzag icon leads every sentence — and the calm no-direction states
 * (neutral / range-bound / mixed) stay in the muted stale ink. */
export const verdictTone: Record<OutlookState, string> = {
  'strong-bullish': 'text-[var(--color-status-normal)]',
  bullish: 'text-[var(--color-status-normal)]',
  neutral: 'text-[var(--color-status-stale)]',
  'range-bound': 'text-[var(--color-status-stale)]',
  mixed: 'text-[var(--color-status-stale)]',
  bearish: 'text-[var(--color-status-alert)]',
  'strong-bearish': 'text-[var(--color-status-alert)]',
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
    { reading: gold, verdict: outlookOf(gold), price: prices.gold },
    { reading: silver, verdict: outlookOf(silver), price: prices.silver },
  ];
  if (rows.every((r) => r.verdict === null)) return null;
  /* Round 31 (owner): the strip is THE answer of the whole card — "it's
   * the verdict and estimation of the whole section" — so it carries the
   * app's focal-section recipe (a brand-gold gradient field, 2px gold
   * ring, gold-tinted shadow) so the white verdict chips pop.
   * 2026-10-20 OWNER SKETCH — the chip is redrawn as an ANALYSIS card:
   *   [ boxed artwork (start corner) · name · price (lighter)           ]
   *   [ the OUTLOOK sentence — its own full-width line (2026-10-21)     ]
   *   [ THE TREND — one BIG chart filling the rest of the chip           ]
   *   [ range chips · window delta                                       ]
   * ONE anatomy for mobile AND desktop (the old artwork-column-vs-chart
   * side split is gone — "do the same for mobile view"). The price rides
   * in the muted ink (it already leads the prices board; the trend is
   * the emphasis), the artwork shrinks into a small tinted box, and the
   * chart grows to h-40/h-52. 2026-10-21: the verdict WORD became the
   * outlook's full sentence and moved to its own line under the header
   * (a sentence cannot live beside the artwork and the price at 375px);
   * the sentence keeps a floored two-line slot so the two desktop chips'
   * charts start on the same baseline (the round-34 alignment rule,
   * kept by structure). */
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
            {/* Header: boxed artwork · name · price (lighter).
             * 2026-10-17 owner: the metal's name is the card's TITLE —
             * much larger than a caption («نقره» / "Silver" at 20px bold),
             * the price stays the lighter, quieter end of the row. */}
            <div className="flex items-center gap-3">
              <MetalIconBox metal={reading.metal} />
              <span className="min-w-0 flex-1 text-xl font-bold leading-snug text-[var(--color-text-primary)]">
                {s.metals[reading.metal]}
              </span>
              {price !== null ? (
                <bdi className="shrink-0 whitespace-nowrap text-[length:var(--type-label)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
                  {price}
                </bdi>
              ) : null}
            </div>
            {/* The outlook sentence rides its OWN full-width line between
             * the header and the chart (2026-10-21 owner state list): a
             * sentence cannot live in the header's narrow column next to
             * the artwork and the price — there it wrapped into a 4-6-line
             * staircase at 375px. Here it wraps at most twice at any
             * width, and the floored slot keeps the two desktop chips'
             * charts on one baseline (the round-34 alignment rule).
             * Colour never rides alone: the zigzag icon leads it. */}
            <span
              className={`inline-flex min-h-[2.5em] items-center gap-1.5 ${
                verdict !== null ? verdictTone[verdict] : 'text-[var(--color-status-stale)]'
              }`}
            >
              <VerdictIcon verdict={verdict} />
              <span className="text-[length:var(--type-label)] font-bold leading-tight">
                {verdict !== null ? s.verdictStates[verdict][reading.metal] : s.verdictNone}
              </span>
            </span>
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
