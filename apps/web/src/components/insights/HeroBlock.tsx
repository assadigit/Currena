/**
 * HeroBlock — the page's first screen, rebuilt by the v3 UI_SPEC §3
 * (UI-01..UI-14, 2026-10-20).
 *
 * Top to bottom: the two hero cards (GLOBAL first — decision D7; each a
 * VerdictBlock: verdict word + generated sentence, reading bar, why-3,
 * calm line, what's-next, freshness chip, data-trust alert box), the
 * what-changed one-liner (H5), and the single disclaimer line (N2/UI-09).
 *
 * REMOVED here (v3 §3.1: "Remove from the hero: repeated explanatory
 * paragraphs, the long rule text, duplicated counts, decorative elements
 * that carry no information"):
 *   - the biggest-move CARD (R4) — the move now lives in the MovesNextStrip
 *     directly under this hero (UI-18), one place, one pattern;
 *   - the world-markets/currencies alert bullets and the two world-section
 *     indicators (§5.3/§6.5/§6.11) — the two sections carry their own
 *     verdict lines with their full numbers where they render, and the
 *     rebuilt card's alert box is reserved for the data-trust caveat
 *     (UI-08's "only when"). Documented choice, see VerdictMeter.tsx.
 */

import { useMemo } from 'react';
import type { CalendarEvent, IndicatorId, IndicatorReading, InsightsSection } from '@currena/core';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { VerdictBlock } from './VerdictMeter';

function num(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
}

export function HeroBlock({
  readings,
  calendar,
  generatedAt,
  changedThisWeek,
  copy,
  numberLocale,
  locale,
  onJumpSection,
  onJumpAbout,
  onFocusCard,
}: {
  readings: readonly IndicatorReading[];
  /** The snapshot's calendar — each card's "what is next" line (UI-05). */
  calendar: readonly CalendarEvent[];
  /** The snapshot's generation time — the freshness chips (UI-06). */
  generatedAt: string;
  changedThisWeek: readonly { id: IndicatorId; to: string }[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  locale: 'en' | 'fa';
  onJumpSection: (section: InsightsSection) => void;
  onJumpAbout: () => void;
  onFocusCard: (id: IndicatorId) => void;
}) {
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

  return (
    <section aria-label={copy.ui.heroTitle} className="m-0">
      <h2 className="sr-only">{copy.ui.heroTitle}</h2>
      {/* UI-10: the two cards sit side by side ≥sm (items-stretch keeps one
       * height — no void under the shorter card), stacked on mobile; the
       * grid keeps its 16px gap (v3 task instruction). */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {/* D7/R1: Global first, always. */}
        <VerdictBlock
          section="global"
          sectionLabel={copy.sections.global}
          readings={readings}
          calendar={calendar}
          generatedAt={generatedAt}
          copy={copy}
          numberLocale={numberLocale}
          locale={locale}
          onJumpSection={onJumpSection}
          onJumpAbout={onJumpAbout}
          onFocusCard={onFocusCard}
        />
        <VerdictBlock
          section="australia"
          sectionLabel={copy.sections.australia}
          readings={readings}
          calendar={calendar}
          generatedAt={generatedAt}
          copy={copy}
          numberLocale={numberLocale}
          locale={locale}
          onJumpSection={onJumpSection}
          onJumpAbout={onJumpAbout}
          onFocusCard={onFocusCard}
        />
      </div>

      {/* H5: what changed — one line under the hero (or the calm line). */}
      <p className="mt-3 mb-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>{changedLine}</bdi>
      </p>

      {/* N2/UI-09: ONE short disclaimer line — links to the full text below. */}
      <div role="note" className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{copy.ui.disclaimerBar}</span>
        <button
          type="button"
          onClick={onJumpAbout}
          className="insights-focusable -my-1.5 inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border-0 bg-transparent px-1 py-1.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2"
        >
          {copy.ui.aboutTitle} ↧
        </button>
      </div>
    </section>
  );
}
