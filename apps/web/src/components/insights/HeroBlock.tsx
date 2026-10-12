/**
 * HeroBlock — the page's first screen (round-2 Blocks R1/R2/R3/R4 + H5/N2).
 *
 * Top to bottom: the two verdict blocks (GLOBAL first — decision D7, the old
 * Australia-first swap setting is retired), ONE biggest-move CARD (R4 — the
 * line always carries its "unusually large for this indicator" reason; the
 * owner's 11 Oct follow-up puts it back in a proper container), the
 * what-changed one-liner (H5 — the hero no longer names the next scheduled
 * event; "Next up" lives once, below the indicators, R16), and the single
 * disclaimer line (N2).
 */

import { useMemo } from 'react';
import type { IndicatorId, IndicatorReading, InsightsSection } from '@currena/core';
import { formatNumber } from '@currena/core';
import { TrendingUp } from 'lucide-react';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { bandWordsOf, bigMovers, consequenceLine, formatChange } from './config';
import { VerdictBlock, type MarketsAlert } from './VerdictMeter';

function num(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
}

export function HeroBlock({
  readings,
  changedThisWeek,
  copy,
  numberLocale,
  onJumpSection,
  onJumpAbout,
  onFocusCard,
  marketsAlert,
  onJumpMarkets,
}: {
  readings: readonly IndicatorReading[];
  changedThisWeek: readonly { id: IndicatorId; to: string }[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onJumpSection: (section: InsightsSection) => void;
  onJumpAbout: () => void;
  onFocusCard: (id: IndicatorId) => void;
  /** §5.3 (build step 9): the world-markets signal when raised — joins the
   * GLOBAL verdict's attention module; undefined when calm or unpopulated. */
  marketsAlert?: MarketsAlert;
  /** Scroll to the world-markets section (the alert line's destination). */
  onJumpMarkets?: () => void;
}) {
  // R4: ONE mover line — |z| ≥ 2 only, stale items already excluded by the
  // engine (stale readings never carry a move score — test below pins it).
  const mover = useMemo(() => bigMovers(readings, 1)[0] ?? null, [readings]);

  // H5: one line — the week's status changes, or the calm quiet-week line.
  const changedLine = useMemo(() => {
    if (changedThisWeek.length === 0) return copy.ui.quietWeekLine;
    const names = changedThisWeek
      .slice(0, 3)
      .map((e) => `${copy.indicators[e.id].name}${e.to === 'warning' ? ' ↑' : ' ↓'}`)
      .join(' · ');
    const suffix = changedThisWeek.length > 3 ? ` +${num(changedThisWeek.length - 3, numberLocale)}` : '';
    return interpolate(copy.ui.whatChangedLine, { changes: `${names}${suffix}` });
  }, [changedThisWeek, copy, numberLocale]);

  const moverEntry = mover ? copy.indicators[mover.id] : null;
  const moverReading = mover ? readings.find((r) => r.id === mover.id) : null;

  return (
    <section aria-label={copy.ui.heroTitle} className="m-0">
      <h2 className="sr-only">{copy.ui.heroTitle}</h2>
      {/* R30: items-STRETCH (was items-start) — the two verdict cards share
       * one height, so the shorter one carries no floating void beside the
       * taller one (the roast: "a void under Australia"). */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {/* D7/R1: Global first, always — the blocks array is fixed order. The
         * world-markets alert (when raised) lives in the GLOBAL block: world
         * stock markets are a global question (§5.3). */}
        <VerdictBlock
          section="global"
          sectionLabel={copy.sections.global}
          readings={readings}
          copy={copy}
          numberLocale={numberLocale}
          onJumpSection={onJumpSection}
          onJumpAbout={onJumpAbout}
          onFocusCard={onFocusCard}
          marketsAlert={marketsAlert}
          onJumpMarkets={onJumpMarkets}
        />
        <VerdictBlock
          section="australia"
          sectionLabel={copy.sections.australia}
          readings={readings}
          copy={copy}
          numberLocale={numberLocale}
          onJumpSection={onJumpSection}
          onJumpAbout={onJumpAbout}
          onFocusCard={onFocusCard}
        />
      </div>

      {/* R4 → owner follow-up (11 Oct) → round 24 (roast #7): the biggest
       * move is the page's FOCAL MOMENT — it now carries the brand gold
       * (the one accent): a gold ring on the card and a gold kicker icon.
       * The 30-day label sits OUTSIDE the ltr bdi so it never collides with
       * the value ("نقطه۳۰ روز" squish). */}
      {mover && moverReading && moverEntry ? (
        <div
          className="mt-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-accent-gold)]/45"
          data-biggest-move
        >
          <p className="m-0 mb-1 flex items-center gap-1.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-tertiary)]">
            <TrendingUp aria-hidden="true" size={16} strokeWidth={1.8} className="shrink-0 text-[var(--color-accent-gold-deep)]" />
            {copy.ui.bigMoverTitle}
          </p>
          <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
            <button
              type="button"
              onClick={() => onFocusCard(mover.id)}
              className="insights-focusable -ms-1 cursor-pointer rounded-lg border-0 bg-transparent px-1 py-0.5 font-bold text-[var(--color-text-primary)] underline decoration-currena-coral/50 underline-offset-4 transition-colors hover:decoration-currena-coral"
            >
              {moverEntry.name}
            </button>
            <bdi dir="ltr" className="type-number shrink-0 font-bold tabular-nums text-[var(--color-text-primary)]">
              {formatChange(mover.change30d, mover.changeKind, numberLocale, copy.units)}
            </bdi>
            <span className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">{copy.ui.days30}</span>
            <span>{copy.ui.bigMoverReason}</span>
            <span className="sr-only">{consequenceLine(moverReading, moverEntry, false, bandWordsOf(copy))}</span>
          </p>
        </div>
      ) : null}

      {/* H5: what changed — one line under the hero (or the calm line). */}
      <p className="mt-3 mb-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>{changedLine}</bdi>
      </p>

      {/* N2: ONE short disclaimer line — links to the full text below. */}
      <div role="note" className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.ui.disclaimerBar}</span>
        <button
          type="button"
          onClick={onJumpAbout}
          className="insights-focusable -my-1.5 cursor-pointer rounded-lg border-0 bg-transparent px-1 py-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2"
        >
          {copy.ui.aboutTitle} ↧
        </button>
      </div>
    </section>
  );
}
