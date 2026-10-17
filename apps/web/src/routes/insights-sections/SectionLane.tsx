/**
 * SectionLane — the Insights indicator lane: the search-miss box, the I10
 * watchlist strip (PinnedSection) and the two dedicated region sections with
 * their QuestionGroups. Moved verbatim from routes/Insights.tsx in the
 * Phase 3-e route split — the props carry the route's state through in
 * unchanged form.
 */

import type { IndicatorGroupId, IndicatorId, InsightsSnapshot } from '@currena/core';
import type { IndicatorReading } from '@currena/core';
import { Search } from 'lucide-react';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { CompactRow } from '../../components/insights/CompactRow';
import { IconImg, sectionIconUrl } from '../../components/icons/currena';
import {
  GROUP_ORDER,
  SECTION_ORDER,
  attentionToneClass,
  type StatusFilter,
} from '../../components/insights/config';
import { num, QuestionGroup } from './QuestionGroup';

/** The I10 watchlist strip (pinned items, snapshot order) — inside the lane. */
function PinnedSection({
  readings,
  copy,
  numberLocale,
  onOpenDetails,
  pinned,
}: {
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onOpenDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
  pinned: ReadonlySet<IndicatorId>;
}) {
  const voting = readings.filter((r) => r.status === 'warning' || r.status === 'normal');
  const attention = voting.filter((r) => r.status === 'warning');
  return (
    <section id="insights-pinned" aria-labelledby="insights-pinned-title" className="scroll-mt-24">
      <header className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="insights-pinned-title" className="type-question m-0 text-[var(--color-text-primary)]">
          <span aria-hidden="true">★ </span>
          {copy.ui.pinnedTitle}
        </h2>
        {voting.length > 0 ? (
          <p className={`m-0 text-[length:var(--type-caption)] font-semibold ${attentionToneClass(attention.length)}`}>
            {interpolate(copy.ui.inAlert, {
              warnings: num(attention.length, numberLocale),
              voting: num(voting.length, numberLocale),
            })}
          </p>
        ) : null}
      </header>
      {/* Round 22: .lane-fill here too — one pinned row fills the lane. */}
      <div className="lane-fill lane-fill-rows gap-1.5">
        {readings.map((r) => (
          <CompactRow
            key={r.id}
            reading={r}
            copy={copy}
            numberLocale={numberLocale}
            onOpenDetails={onOpenDetails}
            pinned={pinned.has(r.id)}
          />
        ))}
      </div>
    </section>
  );
}

export function SectionLane({
  snapshot,
  copy,
  numberLocale,
  visibleIds,
  pinnedReadings,
  openDetails,
  pinned,
  sectionIds,
  revealIds,
  searchActive,
  setStatusFilter,
  setQuery,
}: {
  snapshot: InsightsSnapshot;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  /** I13: null while the snapshot loads; empty set = the search-miss box. */
  visibleIds: ReadonlySet<IndicatorId> | null;
  /** I10: the pinned readings (snapshot order) for the watchlist strip. */
  pinnedReadings: readonly IndicatorReading[];
  /** F5: open the details panel (records the opener for focus return). */
  openDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
  pinned: ReadonlySet<IndicatorId>;
  /** I10: ids rendering inside the lanes (visible, not pinned). */
  sectionIds: ReadonlySet<IndicatorId> | null;
  /** R7: ids explicitly opened (deep link, tile click) — always visible. */
  revealIds: ReadonlySet<IndicatorId>;
  /** R7: while the Tools search is active, nothing collapses. */
  searchActive: boolean;
  /** The search-miss box's "clear" button resets both Tools filters. */
  setStatusFilter: (status: StatusFilter) => void;
  setQuery: (query: string) => void;
}) {
  return (
    <div id="insights-section-lane" className="scroll-mt-24 flex flex-col gap-10">
      {visibleIds !== null && visibleIds.size === 0 ? (
        <div className="rounded-[var(--radius-lg)] bg-currena-muted/[0.05] px-5 py-8 text-center ring-1 ring-[var(--color-border)]">
          <div
            aria-hidden="true"
            className="mx-auto mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-currena-muted/10 text-[var(--color-text-secondary)]"
          >
            <Search size={24} strokeWidth={1.8} />
          </div>
          <p className="mt-1 mb-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-primary)]">
            {copy.ui.noMatches}
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setQuery('');
            }}
            className="insights-focusable mt-3 inline-flex min-h-[44px] cursor-pointer items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-text-secondary)]/50 hover:text-[var(--color-text-primary)]"
          >
            {copy.ui.clearFilters}
          </button>
        </div>
      ) : (
        <>
          {pinnedReadings.length > 0 ? (
            <PinnedSection
              readings={pinnedReadings}
              copy={copy}
              numberLocale={numberLocale}
              onOpenDetails={openDetails}
              pinned={pinned}
            />
          ) : null}
          {SECTION_ORDER.map((sec) => (
            <section
              key={sec}
              id={`insights-section-${sec}`}
              aria-labelledby={`insights-section-${sec}-title`}
              /* Round 39 (owner): "put all of global metrics inside a
               * mother container, currently the heading of global looks
               * stray, it needs depth and container" + "australia must
               * have separate mother container" → EACH region section
               * IS its own mother container now: the soft family tint
               * (the same currena-soft field the no-match box wears),
               * a hairline ring and a quiet shadow for depth — the
               * heading + its 96/128 artwork and every metric group
               * live INSIDE it. Gold stays the money panel's focal
               * accent; the regions get the neutral depth. Separate
               * containers by structure — the map renders one <section>
               * per region, so global and australia can never share
               * or fuse their boxes. The anchors, aria and scroll
               * margins are untouched. */
              className="scroll-mt-24 flex flex-col gap-6 rounded-[var(--radius-lg)] bg-currena-muted/[0.05] p-4 shadow-[0_10px_34px_rgba(15,23,42,0.07)] ring-1 ring-[var(--color-border)] sm:p-6 dark:shadow-[0_14px_44px_rgba(0,0,0,0.4)]"
            >
              <h2
                id={`insights-section-${sec}-title`}
                className="type-section m-0 flex items-center gap-4"
              >
                <IconImg src={sectionIconUrl(sec)} size={96} desktopSize={128} className="shrink-0" />
                <span className="min-w-0">{copy.sections[sec]}</span>
              </h2>
              {GROUP_ORDER[sec].map((group: IndicatorGroupId) => (
                <QuestionGroup
                  key={group}
                  group={group}
                  section={sec}
                  snapshot={snapshot}
                  copy={copy}
                  numberLocale={numberLocale}
                  onOpenDetails={openDetails}
                  pinned={pinned}
                  renderableIds={sectionIds}
                  revealIds={revealIds}
                  searchActive={searchActive}
                />
              ))}
            </section>
          ))}
        </>
      )}
    </div>
  );
}
