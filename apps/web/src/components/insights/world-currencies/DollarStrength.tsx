/**
 * world-currencies/DollarStrength — R9-04 (2026-10-27 owner round:
 * "merge 'Is the dollar strong?' into the currencies section").
 *
 * The dollar-strength question group's six indicator cards (dollar-basket,
 * usdjpy, us-japan-10y-gap + context: eur-usd, usdtry, usdcny) render
 * INSIDE the world currencies section — as additional cards in the same
 * container, under the question's own sub-heading with its gauge reading
 * (step meter + word + count). The standalone "Is the dollar strong?"
 * lane group is retired from the indicators lane
 * (HIDDEN_FROM_LANE_IDS / LANE_GROUP_ORDER).
 *
 * The dollar-strength GAUGE is untouched (packages/insights/src/gauges.ts):
 * the hero count, the section verdict steps and every summary line still
 * count these three voters — only the UI presentation moved. The block
 * rides the currencies section's container in EVERY section state
 * (loading/empty/stale/ready): it reads the INSIGHTS snapshot, not the fx
 * feed, so it stays visible while the fx skeletons paint.
 *
 * The cards are the lane's own anatomy (needs-attention first, then rows,
 * the same `insights-card-{id}` deep-link anchors), so a visitor coming
 * from the hero's dollar tile lands on the exact same card.
 */

import { useMemo } from 'react';
import type { IndicatorId, IndicatorReading, InsightsSnapshot } from '@currena/core';
import { gaugesForSection } from '@currena/insights';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { AlertCard } from '../AlertCard';
import { CompactRow } from '../CompactRow';
import {
  DOLLAR_STRENGTH_IDS,
  attentionToneClass,
  companionParentOf,
  dailyPeersOf,
  stepToneClass,
  tierIsCard,
  tierOf,
} from '../config';
import { num } from '../../../routes/insights-sections/QuestionGroup';

export function DollarStrengthCards({
  snapshot,
  copy,
  numberLocale,
  onOpenDetails,
  pinned,
  renderableIds,
}: {
  snapshot: InsightsSnapshot;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onOpenDetails: (id: IndicatorId, opener: HTMLElement | null) => void;
  pinned: ReadonlySet<IndicatorId>;
  /** I13: null while the snapshot loads; the search filter's visible set. */
  renderableIds: ReadonlySet<IndicatorId> | null;
}) {
  const peers = useMemo(() => dailyPeersOf(snapshot.readings), [snapshot]);
  const readings = useMemo(
    () =>
      DOLLAR_STRENGTH_IDS.map((id) => snapshot.readings.find((r) => r.id === id))
        .filter((r): r is IndicatorReading => r !== undefined)
        .filter((r) => renderableIds === null || renderableIds.has(r.id)),
    [snapshot, renderableIds],
  );
  const companionsByParent = useMemo(() => {
    const parentIds = new Set<IndicatorId>(DOLLAR_STRENGTH_IDS);
    const byParent = new Map<IndicatorId, IndicatorReading[]>();
    for (const r of snapshot.readings) {
      const parent = companionParentOf(r.id);
      if (parent !== null && parentIds.has(parent)) {
        byParent.set(parent, [...(byParent.get(parent) ?? []), r]);
      }
    }
    return byParent;
  }, [snapshot]);

  if (readings.length === 0) return null;

  // The gauge reading (the same gauge the lane used to render): step +
  // word + count, from the SAME gaugesForSection computation the hero and
  // the summaries ride — the gauge's step is unchanged by the move.
  const gauge = gaugesForSection('global', snapshot.readings).find((g) => g.gauge === 'dollar-strength');
  const step = gauge?.step ?? 0;
  const stepWord =
    step === 0
      ? copy.ui.gaugeNoReading
      : step === 1
        ? copy.label.relaxed
        : step === 2
          ? copy.label.cautious
          : step === 3
            ? copy.label.stressed
            : copy.label.alarmed;
  const countText = interpolate(copy.ui.inAlert, {
    warnings: num(gauge?.warningCount ?? 0, numberLocale),
    voting: num(gauge?.votingCount ?? 0, numberLocale),
  });
  const question = copy.groups['dollar-strength'];

  const sorted = [...readings].sort((a, b) => {
    const rank = (r: IndicatorReading): number => {
      const tier = tierOf(r, peers);
      return tier === 'needs-attention' ? 0 : tier === 'unusual' ? 1 : 2;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 0) {
      const pa = a.percentile10y ?? 0;
      const pb = b.percentile10y ?? 0;
      return pb - pa;
    }
    return 0;
  });
  const cardList = sorted.filter((r) => tierIsCard(tierOf(r, peers)));
  const rowList = sorted.filter((r) => !tierIsCard(tierOf(r, peers)));
  const companionNoteOf = (parent: IndicatorId): string | undefined => copy.ui.companionNotes[parent];

  return (
    <section
      id="insights-group-dollar-strength"
      aria-labelledby="insights-group-dollar-strength-title"
      className="scroll-mt-24 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-4"
      data-dollar-strength
    >
      <header className="mb-2.5">
        {/* R9-04: the question becomes a SUB-heading inside the currencies
         * container — the compact label scale the Australia consolidation
         * uses, keeping the gauge reading + count beneath it. */}
        <h3
          id="insights-group-dollar-strength-title"
          className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]"
        >
          {question}
        </h3>
        <p className="m-0 mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
          <span
            className="verdict-meter !h-1.5 max-w-[120px]"
            data-step={step}
            role="img"
            aria-label={interpolate(copy.ui.gaugeStepAria, {
              question,
              label: stepWord,
              step: num(step, numberLocale),
            })}
          >
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={`verdict-meter-seg ${step >= i ? `on-${i}` : ''}`} />
            ))}
          </span>
          <span className={`font-bold ${stepToneClass(step)}`}>{stepWord}</span>
          <span className={`font-semibold ${attentionToneClass(gauge?.warningCount ?? 0)}`}>{countText}</span>
          <span className="flex-1">{copy.gaugeAnswers['dollar-strength']}</span>
        </p>
      </header>
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
              peers={peers}
              companionReadings={companionsByParent.get(r.id) ?? []}
              companionNote={companionNoteOf(r.id)}
            />
          ))}
        </div>
      ) : null}
      {rowList.length > 0 ? (
        <div className="lane-fill lane-fill-rows gap-1.5">
          {rowList.map((r) => (
            <CompactRow
              key={r.id}
              reading={r}
              copy={copy}
              numberLocale={numberLocale}
              onOpenDetails={onOpenDetails}
              pinned={pinned.has(r.id)}
              peers={peers}
              companionReadings={companionsByParent.get(r.id) ?? []}
              companionNote={companionNoteOf(r.id)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
