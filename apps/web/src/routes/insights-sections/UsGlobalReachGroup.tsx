/**
 * UsGlobalReachGroup — R9-07 (2026-10-27 owner round: "special container
 * for US-based indicators that affect global markets").
 *
 * The nine US-based indicators with global reach (real-yield-10y, us10y,
 * us30y, euro-hicp, us-cpi-yoy, us-pce-core-yoy, walcl, stress-stlfsi,
 * nfci) render here — ONE dedicated container inside the Global section —
 * instead of scattering across their lanes. The container carries:
 *
 *   1. its own question-scaled heading + the static analytical frame
 *      (what these numbers ARE for the world);
 *   2. the ANALYTICAL BRIEF — a three-sentence "what this means for the
 *      world" paragraph GENERATED from the live readings
 *      (config/us-global-reach.ts: fixed template table, words chosen by
 *      percentile/status bands, values interpolated from the cards' own
 *      numbers — the consequenceLine discipline, never free text);
 *   3. the nine cards themselves, the same card anatomy the lanes use
 *      (needs-attention first, then rows), companions riding their
 *      parents exactly as in the lane.
 *
 * The GAUGE memberships are untouched (packages/insights/src/gauges.ts):
 * borrowing-costs / prices-heat / market-stress still count these
 * indicators in their steps and the hero count — only the lane RENDER
 * moved (HIDDEN_FROM_LANE_IDS keeps them out of their old groups).
 *
 * Deep links keep working: the cards render with the same
 * `insights-card-{id}` anchors the lane rows carry.
 */

import { useMemo } from 'react';
import type { IndicatorId, IndicatorReading, InsightsSnapshot } from '@currena/core';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { AlertCard } from '../../components/insights/AlertCard';
import { CompactRow } from '../../components/insights/CompactRow';
import {
  US_GLOBAL_REACH_IDS,
  companionParentOf,
  dailyPeersOf,
  tierIsCard,
  tierOf,
} from '../../components/insights/config';
import { usGlobalBrief } from '../../components/insights/config/us-global-reach';

export function UsGlobalReachGroup({
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

  const readings = useMemo(() => {
    return US_GLOBAL_REACH_IDS.map((id) => snapshot.readings.find((r) => r.id === id))
      .filter((r): r is IndicatorReading => r !== undefined)
      .filter((r) => renderableIds === null || renderableIds.has(r.id));
  }, [snapshot, renderableIds]);

  // The companions that ride these cards (us-cpi-core-yoy on the US CPI
  // card — the same parent map the lanes use).
  const companionsByParent = useMemo(() => {
    const parentIds = new Set(US_GLOBAL_REACH_IDS);
    const byParent = new Map<IndicatorId, IndicatorReading[]>();
    for (const r of snapshot.readings) {
      const parent = companionParentOf(r.id);
      if (parent !== null && parentIds.has(parent)) {
        byParent.set(parent, [...(byParent.get(parent) ?? []), r]);
      }
    }
    return byParent;
  }, [snapshot]);

  // The analytical brief: generated from the LIVE readings (all nine,
  // regardless of the transient search filter — the brief describes the
  // container's own data, exactly as the cards' numbers do).
  const brief = useMemo(() => usGlobalBrief(snapshot.readings, copy, numberLocale), [snapshot, copy, numberLocale]);

  if (readings.length === 0) return null;

  const companionNoteOf = (parent: IndicatorId): string | undefined => copy.ui.companionNotes[parent];

  // The same tier split the lanes use: needs-attention AND unusual cards
  // first (extremity-sorted), then the compact rows in definition order.
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

  return (
    <section
      id="insights-group-us-global-reach"
      aria-labelledby="insights-group-us-global-reach-title"
      className="scroll-mt-24 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-4"
      data-us-global-reach
    >
      <header className="mb-2.5">
        <h3 id="insights-group-us-global-reach-title" className="type-question m-0 text-[var(--color-text-primary)]">
          {copy.usGlobalReach.heading}
        </h3>
        {/* The static analytical frame — WHAT these numbers are for the
         * world. The generated brief below carries the current reading. */}
        <p className="m-0 mt-0.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
          {copy.usGlobalReach.intro}
        </p>
      </header>
      {/* The analytical brief (§R9-07): three sentences generated from the
       * live values — borrowing costs, inflation, stress/liquidity — on the
       * surface card the section's other focal boxes wear. */}
      {brief !== null ? (
        <p
          className="m-0 mb-2.5 rounded-[var(--radius-sm)] bg-currena-soft/60 px-3 py-2.5 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]"
          data-us-global-brief
        >
          <bdi>{brief}</bdi>
        </p>
      ) : null}
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
