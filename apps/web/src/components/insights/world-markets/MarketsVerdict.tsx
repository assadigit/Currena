/**
 * world-markets/MarketsVerdict — the section's focal verdict box (owner
 * round 44) and its takeaway line (§8.3). marketsVerdictStep and
 * marketsTakeaway stay pure + exported: markets-verdict.test.ts drives
 * them directly. Split from WorldMarkets.tsx; code moved verbatim.
 */

import type { MarketEntry, MarketsSnapshot } from '@currena/core';
import { formatNumber } from '@currena/core';
import { SHOCK_DAY_COUNT, SHOCK_DAY_FALL } from '@currena/insights/markets/definitions';
import { VerdictMeter } from '../VerdictMeter';
import { SectionVerdictLine } from '../SectionVerdictLine';
import { stepToneClass } from '../config';
import { IconImg, stateIconUrl } from '../../icons/currena';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';

/* ------------------------------------------------------------------ *
 * The section verdict (owner round 44) — the focal box's word, computed
 * from the numbers like every other verdict on this page: the §5.3
 * signal sets the band (unusual → 4 Bearish, attention → 3 Correcting),
 * and a calm signal splits on 3-month BREADTH — most markets up → 1
 * Bullish, otherwise 2 Mixed. Pure and exported: the test drives it
 * directly (markets-verdict.test.ts).
 * ------------------------------------------------------------------ */

export type MarketsVerdictStep = 1 | 2 | 3 | 4;

export function marketsVerdictStep(snapshot: Pick<MarketsSnapshot, 'markets' | 'summary'>): MarketsVerdictStep {
  const { summary, markets } = snapshot;
  if (summary.signal === 'unusual') return 4;
  if (summary.signal === 'attention') return 3;
  if (markets.length === 0) return 2;
  const up = markets.filter((m) => m.chg3m > 0).length;
  return up > markets.length / 2 ? 1 : 2;
}

/** How many of the snapshot's markets sit in correction or a bear market. */
export function marketsInCorrectionCount(markets: readonly MarketEntry[]): number {
  return markets.filter((m) => m.status === 'correction' || m.status === 'bear').length;
}

const VERDICT_WORD: Record<MarketsVerdictStep, 'verdictBullish' | 'verdictMixed' | 'verdictCorrecting' | 'verdictBearish'> = {
  1: 'verdictBullish',
  2: 'verdictMixed',
  // Step-1 audit item E2: the attention tier says "Mixed" with the count
  // ("Mixed: 5 of 16 in correction"), NOT a section-wide "Correcting" —
  // 11 calm markets are not a correction. The dedicated word returns with
  // the Step-3 verdict rules.
  3: 'verdictMixed',
  4: 'verdictBearish',
};

/** The verdict box — the section's focal point, wearing the page's verdict
 * anatomy ([state artwork][word][meter], round 41 order: the artwork LEADS)
 * on a white surface card LAYERED on the mother container's soft field.
 * The takeaway line rides inside as its computed reason — one box answers
 * "calm or stressed" before any tile is read. */
export function MarketsVerdictBox({
  snapshot,
  copy,
  numberLocale,
}: {
  snapshot: MarketsSnapshot;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const step = marketsVerdictStep(snapshot);
  const word = copy.markets[VERDICT_WORD[step]];
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const ariaLabel = interpolate(copy.markets.verdictAria, { label: word, step: num(step) });
  // Step-1 E2: the attention tier's concrete count — "5 of 16 in correction"
  // beside the Mixed word (never a bare section-wide "Correcting").
  const inCorrection = marketsInCorrectionCount(snapshot.markets);
  const showCorrectionCount = step === 3 && inCorrection > 0;
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-4">
      <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2">
        {stateIconUrl(step) !== null ? (
          <IconImg src={stateIconUrl(step)!} size={44} desktopSize={60} className="drop-shadow-sm" />
        ) : null}
        <span className={`type-verdict ${stepToneClass(step)}`}>{word}</span>
        {showCorrectionCount ? (
          <span className="text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]">
            <bdi>
              {interpolate(copy.markets.inCorrectionCount, {
                n: num(inCorrection),
                count: num(snapshot.markets.length),
              })}
            </bdi>
          </span>
        ) : null}
        <VerdictMeter step={step} label={word} ariaLabel={ariaLabel} size="lg" />
      </p>
      {/* §6.11: the verdict line — the MEASURE LABEL plus the page's
       * severity chip, ABOVE the takeaway. Every section verdict names
       * what it measures (shared with the currencies section). */}
      <div className="mt-2">
        <SectionVerdictLine
          label={
            snapshot.summary.signal === 'unusual'
              ? copy.markets.measureUnusual
              : snapshot.summary.signal === 'attention'
                ? copy.markets.measureAttention
                : copy.markets.measureNormal
          }
          chip={snapshot.summary.signal}
          copy={copy}
        />
      </div>
      {/* §8.3, generated from the numbers — never free text. */}
      <p className="m-0 mt-1.5 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>{marketsTakeaway(snapshot, copy, numberLocale)}</bdi>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The takeaway line (§8.3): generated from the numbers, never free text
 * ------------------------------------------------------------------ */

export function marketsTakeaway(
  snapshot: Pick<MarketsSnapshot, 'markets' | 'summary'>,
  copy: InsightsCopy,
  numberLocale: 'en-US' | 'fa-IR',
): string {
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const { summary, markets } = snapshot;
  const stressed = summary.nAttention + summary.nUnusual;
  const count = num(markets.length);
  let line: string;
  if (summary.signal === 'normal') {
    line = interpolate(copy.markets.takeawayCalm, { up: num(summary.roseToday), count });
  } else if (summary.signal === 'attention') {
    line = interpolate(copy.markets.takeawaySome, {
      n: num(stressed),
      count,
      group: summary.worstGroup !== null ? copy.markets.groups[summary.worstGroup] : copy.markets.groups.asia,
    });
  } else {
    line = interpolate(copy.markets.takeawayHeavy, { n: num(stressed), count });
  }
  // The shock-day line (§5.3): takeaway text only, never part of the count.
  const shocks = markets.filter((m) => m.chg1d <= SHOCK_DAY_FALL).length;
  if (shocks >= SHOCK_DAY_COUNT) {
    line += ' ' + interpolate(copy.markets.takeawayShock, { k: num(shocks) });
  }
  return line;
}

