/**
 * QuestionGroup — one question group of the Insights indicator lane (moved
 * verbatim from routes/Insights.tsx in the Phase 3-e route split; rendered by
 * SectionLane.tsx). Also exports the tiny `num` formatter the lane's
 * watchlist strip (PinnedSection, SectionLane.tsx) shares.
 */

import { useMemo, useState } from 'react';
import type { IndicatorGroupId, IndicatorId, InsightsSection, InsightsSnapshot } from '@currena/core';
import type { IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { gaugesForSection } from '@currena/insights';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { AlertCard } from '../../components/insights/AlertCard';
import { CompactRow } from '../../components/insights/CompactRow';
import {
  COMPANION_ONLY_IDS,
  attentionToneClass,
  companionParentOf,
  definitionsForGroup,
  groupVisibility,
  nextEventDate,
  stepToneClass,
  tierIsCard,
  tierOf,
} from '../../components/insights/config';

export function num(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
}

/** Cached per-call gauges helper (the package function is pure). */
function gaugesForSectionCached(
  section: InsightsSection,
  readings: readonly IndicatorReading[],
) {
  return gaugesForSection(section, readings);
}

/**
 * L2/L3/R5/R7: one question group — the question heading, the gauge reading
 * (step + word + count), the one-line answer, then the items: needs-attention
 * AND unusual cards first (L3, extremity-sorted), then normal rows — with
 * the R7 signals-first collapse: everything not in the first GROUP_MIN_VISIBLE
 * items hides behind "See all {n} indicators" (needs-attention is never
 * hidden). Deep links, tile clicks and Tools search reveal hidden items
 * (revealIds / searchActive).
 */
export function QuestionGroup({
  group,
  section,
  snapshot,
  copy,
  numberLocale,
  onOpenDetails,
  pinned,
  renderableIds,
  revealIds,
  searchActive,
}: {
  group: IndicatorGroupId;
  section: InsightsSection;
  snapshot: InsightsSnapshot;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onOpenDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
  pinned: ReadonlySet<IndicatorId>;
  renderableIds: ReadonlySet<IndicatorId> | null;
  /** R7: ids explicitly opened (deep link, tile click) — always visible. */
  revealIds: ReadonlySet<IndicatorId>;
  /** R7: while the Tools search is active, nothing collapses. */
  searchActive: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const readings = useMemo(() => {
    const defs = definitionsForGroup(section, group);
    return snapshot.readings.filter(
      (r) =>
        defs.some((d) => d.id === r.id) &&
        // Step-1 A3: companion-only readings (core CPI) render INSIDE their
        // parent card, never as their own row.
        !COMPANION_ONLY_IDS.has(r.id) &&
        (renderableIds === null || renderableIds.has(r.id)),
    );
  }, [snapshot, section, group, renderableIds]);

  // Step-1 A3 + Step-2 §B2: the companion readings rendered inside this
  // group's cards (core CPI on the US inflation card; the US 10-year beside
  // the AU 10-year). Parents live in this group; companions may be any
  // reading in the snapshot (us10y keeps its own card elsewhere).
  const companionsByParent = useMemo(() => {
    const defs = definitionsForGroup(section, group);
    const parentIds = new Set(defs.map((d) => d.id));
    const byParent = new Map<IndicatorId, IndicatorReading[]>();
    for (const r of snapshot.readings) {
      const parent = companionParentOf(r.id);
      if (parent !== null && parentIds.has(parent)) {
        byParent.set(parent, [...(byParent.get(parent) ?? []), r]);
      }
    }
    return byParent;
  }, [snapshot, section, group]);

  // Step-2 §B1: the next RBA decision date, threaded to the cash-rate card
  // (computed once per group from the snapshot's calendar — plain dates,
  // the Step-1 rule: no UTC conversion, computed at render).
  const nextRbaDecision = useMemo(
    () => nextEventDate(snapshot.calendar, 'rba', new Date().toISOString().slice(0, 10)),
    [snapshot.calendar],
  );

  // Step-2 §B2: the companion note line per parent ("the gap is mainly
  // energy" for the CPI card, "shown for comparison" for the AU 10-year).
  const companionNoteOf = (parent: IndicatorId): string | undefined =>
    copy.ui.companionNotes[parent];

  const gauge = useMemo(() => {
    return gaugesForSectionCached(section, snapshot.readings).find((g) => g.gauge === group);
  }, [section, snapshot, group]);

  if (readings.length === 0) return null;

  const question = copy.groups[group];
  const answer = copy.gaugeAnswers[group];
  // L2: the gauge reading (this group IS a gauge).
  const step = gauge?.step ?? 0;
  const stepWord =
    step === 0 ? copy.ui.gaugeNoReading : step === 1 ? copy.label.relaxed : step === 2 ? copy.label.cautious : step === 3 ? copy.label.stressed : copy.label.alarmed;
  const countText = interpolate(copy.ui.inAlert, {
    warnings: num(gauge?.warningCount ?? 0, numberLocale),
    voting: num(gauge?.votingCount ?? 0, numberLocale),
  });

  // R5 ordering: needs-attention cards first (extremity-sorted), unusual
  // cards next, then the compact rows (normal, context, stale) in snapshot
  // order — one tier per card, the tier decides the layout.
  const sorted = [...readings].sort((a, b) => {
    const rank = (r: IndicatorReading): number => {
      const tier = tierOf(r);
      return tier === 'needs-attention' ? 0 : tier === 'unusual' ? 1 : tier === 'normal' || tier === 'context' ? 2 : 3;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 0) {
      // Both needs-attention: deeper into the watched tail first.
      const pa = a.percentile10y ?? 0;
      const pb = b.percentile10y ?? 0;
      return pb - pa;
    }
    return 0; // stable — snapshot order within tiers
  });

  // R7: the signals-first split — needs-attention + unusual always visible,
  // normal rows fill up to the minimum, the rest collapse behind "See all".
  const visibility = groupVisibility(sorted);
  const hidden = visibility.collapsed.filter(
    (r) => !revealIds.has(r.id) && !pinned.has(r.id),
  );
  const hiddenIds = new Set(hidden.map((r) => r.id));
  const collapsed = !searchActive && !showAll && hidden.length > 0;
  const visibleList = collapsed ? sorted.filter((r) => !hiddenIds.has(r.id)) : sorted;
  const cardList = visibleList.filter((r) => tierIsCard(tierOf(r)));
  const rowList = visibleList.filter((r) => !tierIsCard(tierOf(r)));

  return (
    <section id={`insights-group-${group}`} aria-labelledby={`insights-group-${group}-title`} className="scroll-mt-24">
      <header className="mb-2.5">
        <h3 id={`insights-group-${group}-title`} className="type-question m-0 text-[var(--color-text-primary)]">
          {question}
        </h3>
        <p className="m-0 mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
          {/* L2: the gauge reading + count. */}
          <span
            className="verdict-meter !h-1.5 max-w-[120px]"
            data-step={step}
            role="img"
            aria-label={interpolate(copy.ui.gaugeStepAria, { question, label: stepWord, step: num(step, numberLocale) })}
          >
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={`verdict-meter-seg ${step >= i ? `on-${i}` : ''}`} />
            ))}
          </span>
          <span className={`font-bold ${stepToneClass(step)}`}>{stepWord}</span>
          <span className={`font-semibold ${attentionToneClass(gauge?.warningCount ?? 0)}`}>{countText}</span>
          {/* L2 answer: no min-w-0 — the flex item keeps its min-content width
           * (the longest word) so the flex-wrap row moves it to its own line on
           * narrow phones instead of squeezing it below word width, which bled
           * ~50px of horizontal scroll onto the whole page at 375px (I18). */}
          <span className="flex-1">{answer}</span>
        </p>
      </header>
      {/* R5/R7: needs-attention AND unusual cards in a responsive lane —
       * R30: min 300px (the 4-column 260px grid wrapped titles to five
       * lines). Round 22 (owner): "such gaps must never happen" — the old
       * auto-fill grid reserved a dead track whenever fewer cards than
       * tracks existed (two attention cards + a dead third column of
       * white). .lane-fill makes every line fill edge to edge: 2 cards
       * split the row, 1 card takes it whole. */}
      {cardList.length > 0 ? (
        <div className="lane-fill mb-2 gap-2.5">
          {cardList.map((r) => (
            <AlertCard
              key={r.id}
              reading={r}
              copy={copy}
              numberLocale={numberLocale}
              onOpenDetails={onOpenDetails}
              pinned={pinned.has(r.id)}
              companionReadings={companionsByParent.get(r.id) ?? []}
              companionNote={companionNoteOf(r.id)}
              nextRbaDecision={nextRbaDecision}
            />
          ))}
        </div>
      ) : null}
      {rowList.length > 0 ? (
        /* Round 22: .lane-fill — a lone compact row spans the lane instead
         * of leaving a dead half-column beside it (owner: gaps never). */
        <div className="lane-fill lane-fill-rows gap-1.5">
          {rowList.map((r) => (
            <CompactRow
              key={r.id}
              reading={r}
              copy={copy}
              numberLocale={numberLocale}
              onOpenDetails={onOpenDetails}
              pinned={pinned.has(r.id)}
              showMixedTag={r.id === 'gold-silver'}
              companionReadings={companionsByParent.get(r.id) ?? []}
              companionNote={companionNoteOf(r.id)}
              nextRbaDecision={nextRbaDecision}
            />
          ))}
        </div>
      ) : null}
      {/* R7: the "See all {n}" collapse — per session state. R30: honest
       * plural ("See all 1 indicators" was wrong) and a QUIET text button
       * (the heavy blue pill competed with the cards). */}
      {collapsed ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="insights-focusable mt-2 inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-4 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-border)] underline-offset-4 transition-colors hover:decoration-[var(--color-status-context)]"
        >
          {hidden.length === 1 ? copy.ui.seeAllOne : interpolate(copy.ui.seeAll, { n: num(hidden.length, numberLocale) })}
        </button>
      ) : null}
      {!collapsed && showAll && hidden.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="insights-focusable mt-2 inline-flex min-h-[44px] cursor-pointer items-center rounded-full px-4 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] underline decoration-[var(--color-border)] underline-offset-4 transition-colors hover:text-[var(--color-status-context)]"
        >
          {copy.ui.showFewer}
        </button>
      ) : null}
    </section>
  );
}
