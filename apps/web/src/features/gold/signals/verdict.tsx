/**
 * signals/verdict — the gold stated outlook. Round 23's mechanical
 * tally (supportive minus against; the sign is the direction), the
 * verdict icons/artwork and the Estimation chip strip with the gold
 * price-history chart (rounds 26–34) — and, since 2026-10-21, the
 * owner's SEVEN-STATE "Gold Market Outlook" classification
 * (`outlookOf` + the exact bilingual sentences) replacing the old
 * up/down/flat words that had drifted apart between locales.
 * (Phase: WS-4 module split of the former Signals.tsx monolith; the
 * shell and the merged card import these so the collapsed line and the
 * strip can never drift apart on tally semantics.)
 *
 * GUX-S10 (Q3-A, the owner's 2026-11-2x answer — the ratio-only home):
 * this strip is GOLD-ONLY. Silver's analysis card (its verdict sentence
 * + its TrendPanel chart + its keep-small note) RETIRED from /gold —
 * silver lives in the seats it already owns honestly (the gold-silver
 * ratio seat, the if-you'd-bought row, the London vault's silver row);
 * the OI-4-protected sentence is consciously ended on this page. The
 * silver classifier (`outlookOf`) stays exported for the engine-parity
 * pins; no UI surface on /gold calls it anymore.
 */

import type { CSSProperties } from 'react';
import { Coins } from 'lucide-react';
import type { InsightsCopy } from '../../../shared/i18n/insights-copy-en';
import { DIRECTION_DOWN_URL, DIRECTION_UP_URL, IconImg, indicatorIconUrl } from '../../../components/icons/currena';
import { GoldPriceChart } from './GoldPriceChart';

/* S3 extraction (2026-11-08): the seven-state outlook classifier moved
 * VERBATIM to ./outlook-core (pure, lean-chunk importable — the Global
 * page's Gold Balance tile needs it without this file's view imports).
 * Re-exported here so every existing import (Signals, the tests) keeps
 * working unchanged. */
import type { OutlookState } from '../../../shared/components/outlook-core';
export { RANGE_SPEED_PCT, goldOutlookOf, outlookOf } from '../../../shared/components/outlook-core';
export type { OutlookState } from '../../../shared/components/outlook-core';

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

/** The metal's own artwork beside its name (round 28) — the gold bar;
 * GUX-S10 (Q3-A): gold-only. Round 29 (owner): 28/36 defaults; round 31:
 * the verdict strip calls it at the price tiles' scale — 96px mobile /
 * 128×128 desktop — the artwork IS the verdict chip's face.
 * 2026-10-20 (owner sketch): the chip header puts the artwork in a SMALL
 * tinted corner box (56/64px) — the chart, not the artwork, owns the
 * chip now. The gold chip wears the brand-gold box. */
export function MetalIcon({
  size = 28,
  desktopSize = 36,
}: {
  size?: number;
  desktopSize?: number;
}) {
  const icon = indicatorIconUrl('gold-usd');
  return icon !== null ? <IconImg src={icon} size={size} desktopSize={desktopSize} /> : null;
}

/** The chip header's boxed artwork (2026-10-20 owner sketch) — the same
 * tinted-box language as the prices board's PriceIconBox, miniaturised.
 * GUX-S10 (Q3-A): gold-only — the quiet silver tint variant retired
 * with the silver card. */
export function MetalIconBox() {
  const icon = indicatorIconUrl('gold-usd');
  return (
    <span
      aria-hidden="true"
      className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] ring-1 ring-[var(--color-border)] bg-[var(--color-accent-gold)]/25 sm:h-16 sm:w-16"
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
 * Round 33 (owner): the Estimation chip's white space was the metal's
 * own price history — clickable range chips (Quarter · One year · Five
 * years · — since 2026-10-20's owner request — Ten years) + a signed
 * window delta. Round 34 (owner): the charts grew real X/Y axes and a
 * hover inspector, and they moved into the SHARED TrendPanel
 * (TrendChart.tsx) — the exact structure the money panel's mini charts
 * now wear, so both sections stay aligned by construction.
 * GPE R18 / F7 (2026-11-18, S13-D2): the GOLD chip's chart became the
 * interactive GoldPriceChart over the EODHD XAUUSD OHLC leg (pan/zoom/
 * log + the DMA overlays + the window as a user control — the #01
 * widening dissolved by construction there).
 * GUX-S10 (Q3-A, the ratio-only home): the SILVER chip — and with it
 * the MetalTrendChart wrapper (the TrendPanel over the bounded
 * silver-usd series) — RETIRED from /gold entirely. Silver's price
 * history surface is the if-you'd-bought row's own legs, and the
 * ratio seat carries its canonical read.
 * ---------------------------------------------------------------- */

export function VerdictStrip({
  goldOutlook,
  price,
  copy,
  numberLocale,
}: {
  /** GB-S5 (P3, 01 §5.2 + AC-3): the gold Outlook derived from the SAME
   * goldBalance() result that drives the lane balance. Since the GB-S6
   * flip this is THE gold derivation (the flag-off outlookOf(gold)
   * legacy path retired with the flag). GUX-S10 (Q3-A): gold is the
   * strip's ONLY leg — silver's outlookOf sentence retired from /gold,
   * consciously ending the OI-4-protected sentence on this page. A null
   * value still renders (the honest `verdictNone` line beside the chart
   * — never silence: the one-metal strip never hides). */
  goldOutlook: OutlookState | null;
  /** Gold's current price, display-formatted (2026-10-20 owner
   * sketch): the header carries it in a LIGHTER ink — the price already
   * leads the prices board above; here the TREND is the emphasis. */
  price: string | null;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const s = copy.signals;
  const verdict = goldOutlook;
  /* Round 31 (owner): the strip is THE answer of the whole card — "it's
   * the verdict and estimation of the whole section" — so it carries the
   * app's focal-section recipe (a brand-gold gradient field, 2px gold
   * ring, gold-tinted shadow) so the white verdict chips pop.
   * 2026-10-20 OWNER SKETCH — the chip is redrawn as an ANALYSIS card:
   *   [ boxed artwork (start corner) · name · price (lighter)           ]
   *   [ the OUTLOOK sentence — its own full-width line (2026-10-21)     ]
   *   [ THE TREND — one BIG chart filling the rest of the chip           ]
   * ONE anatomy for mobile AND desktop. GUX-S10 (Q3-A): ONE card —
   * the gold card; the two-chip side-by-side layout was itself a
   * two-metal artifact and retires with the silver chip. */
  return (
    <div
      /* GUX-S5 M5 (11 §3.1/§5.4): the FOCAL recipe retires here — the
       * gold gradient field + the ring-2 + --shadow-focal belong to
       * exactly ONE element per page, the hero's BriefingCard. The
       * strip keeps its full anatomy (artwork · name · price · the
       * outlook sentence · the chart) in the standard card recipe. */
      className="flex flex-col gap-2 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-3.5 ring-1 ring-[var(--color-border)] shadow-[var(--shadow-card)] sm:p-4"
      data-signal-verdict
    >
      {/* GPE R08 / F15 (C3 clause 2): the title re-scopes to CONDITIONS and
       * the no-forecast caveat co-renders in the same title row — the
       * sentence below it is a conditions claim, and the reader meets the
       * honesty clause at the same glance (never paragraphs away). */}
      <h4 className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[length:var(--type-label)] font-bold text-[var(--color-text-secondary)]" data-verdict-title>
        {s.verdictTitle}
        <span className="font-normal text-[var(--color-text-tertiary)]">{s.verdictCaveat}</span>
      </h4>
      <div
        data-verdict-metal="gold"
        data-verdict-direction={verdict ?? 'none'}
        className="flex min-w-0 flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)]"
      >
        {/* Header: boxed artwork · name · price (lighter).
         * 2026-10-17 owner: the metal's name is the card's TITLE —
         * much larger than a caption ("Gold" at 20px bold), the price
         * stays the lighter, quieter end of the row. */}
        <div className="flex items-center gap-3">
          <MetalIconBox />
          <span className="min-w-0 flex-1 text-xl font-bold leading-snug text-[var(--color-text-primary)]">
            {s.metals.gold}
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
         * width. Colour never rides alone: the zigzag icon leads it. */}
        <span
          className={`inline-flex min-h-[2.5em] items-center gap-1.5 ${
            verdict !== null ? verdictTone[verdict] : 'text-[var(--color-status-stale)]'
          }`}
        >
          <VerdictIcon verdict={verdict} />
          <span className="text-[length:var(--type-label)] font-bold leading-tight">
            {verdict !== null ? s.verdictStates[verdict].gold : s.verdictNone}
          </span>
        </span>
        {/* THE TREND — the big chart fills the rest of the chip.
         * GPE R18 / F7 (S13-D2): the interactive chart over the EODHD
         * XAUUSD OHLC leg — pan/zoom/log + the D8 50/200 DMA overlays +
         * the unit-aware header + the window as a user control. GUX-S10
         * (Q3-A): the ONLY chart — the silver TrendPanel retired with
         * the silver card. */}
        <div data-verdict-chart="gold" className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <GoldPriceChart copy={copy} numberLocale={numberLocale} />
        </div>
      </div>
    </div>
  );
}
