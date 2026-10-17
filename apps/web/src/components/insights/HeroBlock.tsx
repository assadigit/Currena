/**
 * HeroBlock — the page's first screen (round-2 Blocks R1/R2/R3/R4 + H5).
 *
 * Top to bottom: the two verdict blocks (GLOBAL first — decision D7, the old
 * Australia-first swap setting is retired), ONE biggest-move CARD (R4 — the
 * line always carries its "unusually large for this indicator" reason; the
 * owner's 11 Oct follow-up puts it back in a proper container), and the
 * what-changed one-liner (H5 — the hero no longer names the next scheduled
 * event; "Next up" lives once, below the indicators, R16).
 *
 * N2 retired (owner, 2026-10-17): the short disclaimer line + the
 * «درباره این داده‌ها ↧» jump button no longer sit under the hero — the
 * page-bottom About section carries the full text and the global footer
 * already carries the app-wide non-advice disclaimer.
 */

import { useMemo } from 'react';
import type { IndicatorId, IndicatorReading, InsightsSection } from '@currena/core';
import { formatNumber } from '@currena/core';
import { TrendingUp } from 'lucide-react';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { bandWordsOf, bigMovers, changeToneClass, consequenceLine, formatChangeParts } from './config';
import { VerdictBlock, type MarketsAlert, type FxAlert, type SectionIndicatorState } from './VerdictMeter';

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
  fxAlert,
  onJumpFx,
  sectionIndicators,
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
  /** §6.5 (currencies build step 11): the world-currencies signal when
   * raised — joins the same attention module with its pattern names. */
  fxAlert?: FxAlert;
  /** Scroll to the world-currencies section (the alert line's destination). */
  onJumpFx?: () => void;
  /** §6.11/§9.10: the two world sections as separate indicators in the
   * transparent count — each with its own measure label and chip. */
  sectionIndicators?: readonly SectionIndicatorState[];
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
  // The mover's change in PARTS: the signed number rides its own ltr island;
  // a WORD unit («واحد درصد» / 'pts') rides OUTSIDE as its own element so the
  // RTL line reads «+۰٫۲۵ واحد درصد» and never the scattered
  // «واحد درصد … +۰٫۲۵» the owner reported (2026-10-17).
  const moverChange =
    mover && moverReading
      ? formatChangeParts(mover.change30d, mover.changeKind, numberLocale, copy.units)
      : null;
  const moverTone = mover ? changeToneClass(mover.change30d) : '';

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
          fxAlert={fxAlert}
          onJumpFx={onJumpFx}
          sectionIndicators={sectionIndicators}
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
       * The signed number keeps its own ltr island; the WORD unit (fa
       * «واحد درصد») rides OUTSIDE the island as its own span so the RTL
       * line never scatters it (2026-10-17 owner glitch report). The value
       * speaks the owner's sign inks: positive green, negative red. */}
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
            <bdi dir="ltr" className={`type-number shrink-0 font-bold tabular-nums ${moverTone || 'text-[var(--color-text-primary)]'}`}>
              {moverChange!.value}
            </bdi>
            {moverChange!.unit !== null ? (
              <span className="shrink-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]">
                {moverChange!.unit}
              </span>
            ) : null}
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

      {/* N2 retired (owner, 2026-10-17): the short disclaimer + the
       * about-jump button no longer live under the hero. The full text is
       * the page-bottom About section; the global footer carries the
       * app-wide non-advice disclaimer. */}
    </section>
  );
}
