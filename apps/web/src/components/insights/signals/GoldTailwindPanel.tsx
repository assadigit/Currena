/**
 * signals/GoldTailwindPanel — the Gold Program's directional panel (S2 →
 * S2.1, docs/insights/GOLD_SCORE_SPEC.md §4.4): the macro drivers re-cut
 * for gold direction, rendered INSIDE the merged gold card, directly
 * under the balance visual («برآیند عوامل مؤثر بر قیمت طلا») — the
 * owner's 2026-10-31 directive ("it must place here"), moved from the
 * prices strip.
 *
 * Content (top to bottom):
 *   1. the NET SCORE — the signed tailwind-minus-headwind number, big
 *      and tabular like a price;
 *   2. the 5-STEP LABEL — "Strong tailwind" … "Strong headwind", or the
 *      honest "Cannot read yet" when no voter fired;
 *   3. the firing line + the LANE COUNTS — "3 of 20 drivers firing ·
 *      1 tailwind · 2 headwind · 0 mixed" (the counts describe the four
 *      LANES, the spec's own vocabulary);
 *   4. the FOUR SUB-GAUGE READINGS — borrowing costs tight/relief, the
 *      dollar strong/under stress, market stress elevated/calm,
 *      inflation running hot/cooling (each with its firing count);
 *   5. the FIRING VOTERS list — re-derived client-side through the SAME
 *      pure engine the ingest used (the gauges.ts contract: one
 *      function, server and SPA, no drift);
 *   6. the "conditions, not advice" footnote (the signals-card
 *      discipline — words and counts, never a recommendation).
 *
 * Data: `snapshot.goldSummary` (the ingest's compact stamp) when the
 * served snapshot carries it; otherwise the panel DERIVES the reading
 * from the readings it already holds (old snapshots, and instant
 * re-render on any client-side reading change — same pure function).
 *
 * BILINGUAL since S2.1 (the owner's directive): the copy rides the
 * `copy` prop from the web i18n dictionaries (signals.goldScore) — EN
 * and fa both render through the reviewed-copy path, behind the
 * Persian-copy audit gate.
 */

import { useMemo } from 'react';
import type { GoldSummary, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { GOLD_LANE_VOTERS, goldTailwindScore, type GoldTailwindLabel } from '@currena/insights';
import { Wind } from 'lucide-react';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';

/** The signed net score, localized digits with an explicit + for wins. */
function signedNet(netScore: number, numberLocale: 'en-US' | 'fa-IR'): string {
  const n = formatNumber(netScore, numberLocale, { maximumFractionDigits: 0 });
  return netScore > 0 ? `+${n}` : n;
}

export function GoldTailwindPanel({
  goldSummary,
  readings,
  copy,
  numberLocale,
}: {
  /** The served snapshot's compact stamp; absent → derived below. */
  goldSummary?: GoldSummary | undefined;
  /** The page's current readings (the voters list + the fallback derivation). */
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const C = copy.signals.goldScore;
  // The firing voters always derive from the page's current readings
  // (includes the live-prices overlay's refresh); the headline numbers
  // prefer the served goldSummary and fall back to the same derivation.
  const derived = useMemo(() => goldTailwindScore(readings), [readings]);
  const s = goldSummary ?? {
    netScore: derived.netScore,
    label: derived.label,
    firingVoters: derived.firingVoters,
    tailwindVoters: derived.tailwindVoters,
    headwindVoters: derived.headwindVoters,
    laneCounts: derived.laneCounts,
    subGauges: derived.subGauges,
  };

  const labelWord: string = s.label !== null ? C.labels[s.label as GoldTailwindLabel] : C.noReadWord;
  const netFiringLine =
    s.firingVoters > 0
      ? interpolate(C.netFiringLine, {
          firing: formatNumber(s.firingVoters, numberLocale, { maximumFractionDigits: 0 }),
          total: formatNumber(GOLD_LANE_VOTERS.length, numberLocale, { maximumFractionDigits: 0 }),
        })
      : C.netFiringNone;
  const countsLine = interpolate(C.laneCountsLine, {
    tailwind: formatNumber(s.laneCounts.tailwind, numberLocale, { maximumFractionDigits: 0 }),
    headwind: formatNumber(s.laneCounts.headwind, numberLocale, { maximumFractionDigits: 0 }),
    mixed: formatNumber(s.laneCounts.mixed, numberLocale, { maximumFractionDigits: 0 }),
  });

  return (
    <article
      id="insights-gold-tailwind"
      className="gold-panel flex h-full flex-col rounded-[var(--radius-lg)] bg-currena-soft/60 p-3 ring-1 ring-[var(--color-border)]"
      data-gold-label={s.label ?? 'none'}
      data-gold-net={s.netScore}
    >
      {/* 1. the header — the card-inner block anatomy (a quiet icon +
       * the title-block), matching the balance block's heading scale. */}
      <span className="flex w-full items-center gap-2">
        <Wind
          aria-hidden
          strokeWidth={1.6}
          className="currena-icon shrink-0 text-[var(--color-text-secondary)]"
          style={{ '--icon-size': '18px' } as React.CSSProperties}
        />
        <span className="min-w-0 flex-1">
          <h4 className="m-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">
            {C.title}
          </h4>
          <span className="block text-[length:var(--type-caption)] leading-snug text-[var(--color-text-secondary)]">
            {C.subtitle}
          </span>
        </span>
      </span>

      {/* 2. the net score + the label word — the panel's loud number. */}
      <span className="mt-2 flex w-full flex-wrap items-baseline gap-x-2">
        <bdi className="type-number tabular-nums text-[26px] font-bold leading-none tracking-tight text-[var(--color-text-primary)]">
          {signedNet(s.netScore, numberLocale)}
        </bdi>
        <span className="text-[13px] font-semibold leading-none text-[var(--color-text-secondary)]">{labelWord}</span>
      </span>
      <span className="mt-1.5 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">{netFiringLine}</span>

      {/* 3. the lane counts (the four lanes, one line). */}
      <span className="mt-2 flex w-full flex-wrap items-baseline gap-x-2 border-t border-[var(--color-border)] pt-2 text-[length:var(--type-caption)]">
        <span className="font-medium text-[var(--color-text-secondary)]">{C.laneCountsLabel}:</span>
        <bdi data-gold-counts>{countsLine}</bdi>
      </span>

      {/* 4. the four sub-gauge readings, in lane order. */}
      <ul className="m-0 mt-1.5 flex list-none flex-col gap-1 p-0" data-gold-lanes>
        {s.subGauges.map((g) => (
          <li
            key={g.lane}
            className="flex items-baseline justify-between gap-2 text-[length:var(--type-caption)]"
            data-gold-lane={g.lane}
            data-gold-lane-reading={g.reading}
          >
            <span className="min-w-0 text-[var(--color-text-secondary)]">{C.laneNames[g.lane]}</span>
            <bdi className="whitespace-nowrap font-semibold text-[var(--color-text-primary)]">
              {C.subGaugeWords[g.reading]}
              {g.tailwindVoters + g.headwindVoters > 0
                ? ` (${formatNumber(g.tailwindVoters + g.headwindVoters, numberLocale, { maximumFractionDigits: 0 })})`
                : ''}
            </bdi>
          </li>
        ))}
      </ul>

      {/* 5. the firing voters — re-derived from the page's readings. */}
      <span className="mt-2 block border-t border-[var(--color-border)] pt-2 text-[length:var(--type-caption)] font-medium text-[var(--color-text-secondary)]">
        {C.votersTitle}
      </span>
      {derived.voters.length === 0 ? (
        <span className="mt-1 block text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{C.votersNone}</span>
      ) : (
        <ul className="m-0 mt-1 flex list-none flex-col gap-0.5 p-0" data-gold-voters>
          {derived.voters.map((v) => (
            <li
              key={v.id}
              className="flex items-baseline justify-between gap-2 text-[11px] leading-4"
              data-gold-voter={v.id}
              data-gold-voter-impact={v.impact}
            >
              <span className="min-w-0 text-[var(--color-text-secondary)]">
                {C.voterNames[v.id as keyof typeof C.voterNames]}
                <span className="ms-1 text-[var(--color-text-tertiary)]">· {C.evidenceWords[v.evidence]}</span>
              </span>
              <bdi className="whitespace-nowrap font-semibold text-[var(--color-text-primary)]">
                {C.impactWords[v.impact]}
              </bdi>
            </li>
          ))}
        </ul>
      )}

      {/* 6. the honesty footnote. */}
      <span className="mt-auto block pt-2 text-[11px] leading-4 text-[var(--color-text-tertiary)]">{C.footnote}</span>
    </article>
  );
}
