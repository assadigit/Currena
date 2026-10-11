/**
 * HeroBlock — the page's first screen (round-2 Blocks R1/R2/R3/R4 + H5/N2).
 *
 * Top to bottom: the two verdict blocks (GLOBAL first — decision D7, the old
 * Australia-first swap setting is retired), ONE biggest-move line (R4 — the
 * large beige callout box is gone; the line always carries its "unusually
 * large for this indicator" reason), the what-changed one-liner (H5 — the
 * hero no longer names the next scheduled event; "Next up" lives once,
 * below the indicators, R16), and the single disclaimer line (N2).
 */

import { useMemo } from 'react';
import type { IndicatorId, IndicatorReading, InsightsSection } from '@currena/core';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { bandWordsOf, bigMovers, consequenceLine, formatChange } from './config';
import { VerdictBlock } from './VerdictMeter';

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
}: {
  readings: readonly IndicatorReading[];
  changedThisWeek: readonly { id: IndicatorId; to: string }[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onJumpSection: (section: InsightsSection) => void;
  onJumpAbout: () => void;
  onFocusCard: (id: IndicatorId) => void;
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
        {/* D7/R1: Global first, always — the blocks array is fixed order. */}
        <VerdictBlock
          section="global"
          sectionLabel={copy.sections.global}
          readings={readings}
          copy={copy}
          numberLocale={numberLocale}
          onJumpSection={onJumpSection}
          onJumpAbout={onJumpAbout}
          onFocusCard={onFocusCard}
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

      {/* R4: the biggest move — one line, always with its reason. */}
      {mover && moverReading && moverEntry ? (
        <p className="mt-3 mb-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
          <span className="font-bold text-[var(--color-text-secondary)]">{copy.ui.bigMoverTitle}:</span>
          <button
            type="button"
            onClick={() => onFocusCard(mover.id)}
            className="insights-focusable -ms-1 cursor-pointer rounded-lg border-0 bg-transparent px-1 py-0.5 font-bold text-[var(--color-text-primary)] underline decoration-currena-coral/50 underline-offset-4 transition-colors hover:decoration-currena-coral"
          >
            {moverEntry.name}
          </button>
          <bdi dir="ltr" className="type-number shrink-0 font-bold text-[var(--color-text-primary)]">
            {formatChange(mover.change30d, mover.changeKind, numberLocale, copy.units)}
            <span className="ms-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
              {copy.ui.days30}
            </span>
          </bdi>
          <span>— {copy.ui.bigMoverReason}</span>
          <span className="sr-only">{consequenceLine(moverReading, moverEntry, false, bandWordsOf(copy))}</span>
        </p>
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
