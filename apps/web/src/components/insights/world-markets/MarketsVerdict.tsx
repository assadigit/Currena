/**
 * world-markets/MarketsVerdict — the section's focal summary card (the
 * editorial market-briefing round, 02-ui-spec §3.2) and its takeaway
 * line (§8.3). marketsVerdictStep and marketsTakeaway stay pure +
 * exported: markets-verdict.test.ts drives them directly.
 *
 * The card stacks the page-consistent verdict anatomy ([state artwork]
 * [word] [meter], round 44 — preserved: the §6.11 measure label, the
 * hero count and the alert module all still read it) over the round's
 * NEW evidence layer: the up/down/flat breadth counts over the SELECTED
 * period (from briefing.marketBreadth — raw values, honest denominator)
 * and the separate below-52-week-high line. The verdict word is never
 * the only summary: the takeaway sentence and the counts always ride
 * with it (§3.2: no bare «مختلط»).
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
import { belowHighCount, marketBreadth } from './briefing';
import { CORRECTION_PCT } from '@currena/insights/markets/definitions';
import { periodWord, type MarketsView } from './shared';

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

/** How many of the snapshot's markets sit in correction or a bear market.
 * S1-M1.6 #2 (2026-10-31 audit): the RAW ≥10%-below-high rule — the same
 * number belowHighCount reads and the cards' distances show — so every
 * sentence and the stat box share ONE computed value. The stored STATUS
 * keeps its exit-buffer memory for the per-card tags (a −9% market that
 * was ≤ −10% still reads "Correcting"), but no summary count may cite the
 * buffered tag against the visible evidence (the audit saw "7 of 16 in
 * correction" beside six ≥10% distances). */
export function marketsInCorrectionCount(markets: readonly MarketEntry[]): number {
  return markets.filter((m) => m.fromHigh <= CORRECTION_PCT).length;
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
 * The takeaway line rides inside as its computed evidence — one card
 * answers "calm or stressed, and how many moved" before any tile is read.
 *
 * R9-06 (2026-10-27 owner round — "a specialized box for today's exchange/
 * index performance … a prominent, visually distinct box, the FIRST thing
 * the reader sees"): the breadth layer is redesigned into the box's own
 * headline — LARGE up/down/flat numbers (the bright return inks) over a
 * PROPORTIONAL breadth bar (green/red/grey sized by each count's share of
 * the valid rows), under the period's own label. The verdict word + state
 * artwork + meter stay the box's crown; the counts and the bar are the
 * first evidence below them. The bar is decorative (aria-hidden — the
 * numbers beside it carry the meaning; colour never rides alone). */
export function MarketsVerdictBox({
  snapshot,
  copy,
  numberLocale,
  view,
}: {
  snapshot: MarketsSnapshot;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  /** The selected return period — the breadth counts follow it (§3.2). */
  view: MarketsView;
}) {
  const step = marketsVerdictStep(snapshot);
  const word = copy.markets[VERDICT_WORD[step]];
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const ariaLabel = interpolate(copy.markets.verdictAria, { label: word, step: num(step) });
  // Step-1 E2: the attention tier's concrete count — "5 of 16 in correction"
  // beside the Mixed word (never a bare section-wide "Correcting").
  const inCorrection = marketsInCorrectionCount(snapshot.markets);
  const showCorrectionCount = step === 3 && inCorrection > 0;
  // The round's evidence layer (02-ui-spec §3.2): raw-value breadth over
  // the SELECTED period + the separate below-high count.
  const breadth = marketBreadth(snapshot.markets, view);
  const belowHigh = belowHighCount(snapshot.markets);
  // 2026-10-27 owner round ("write the positive indexes with more clear and
  // bright green … do the same for red, down and brighter red"): the up/down
  // breadth counts speak the BRIGHT return inks — clearer and brighter than
  // the calm status hues (which stay the verdict vocabulary above).
  // R9-06: the counts render as LARGE numbers, one block per kind.
  const counts: Array<['up' | 'down' | 'flat', string, number, string]> = [
    ['up', copy.markets.breadthUp, breadth.up, 'text-[var(--color-return-up)]'],
    ['down', copy.markets.breadthDown, breadth.down, 'text-[var(--color-return-down)]'],
    ['flat', copy.markets.breadthFlat, breadth.flat, 'text-[var(--color-text-secondary)]'],
  ];
  // R9-06: the proportional breadth bar's denominator — the rows that
  // actually carry the lens (the honest share, never an implied "all").
  const barTotal = breadth.up + breadth.down + breadth.flat;
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
      {/* §3.2 → R9-06: THE BREADTH HEADLINE — the up/down/flat counts as
       * LARGE numbers over a proportional bar, under the SELECTED period's
       * own label. The period is named in the strip's own label, and the
       * denominator is the rows that actually carry the lens (the honest
       * count, never an implied "all 16" when a stored row predates a
       * lens). DOM order keeps dt → dd (label then number) inside each
       * block; the blocks lay out number-first via flex-col-reverse. */}
      <div className="mt-3" data-markets-breadth-block>
        <p className="m-0 mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            <bdi>{interpolate(copy.markets.breadthPeriod, { period: periodWord(view, copy) })}</bdi>
          </span>
          {breadth.valid < breadth.total ? (
            <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
              <bdi>{interpolate(copy.markets.coverageNote, { count: num(breadth.valid), total: num(breadth.total) })}</bdi>
            </span>
          ) : null}
        </p>
        <dl className="m-0 grid grid-cols-3 gap-2" data-markets-breadth>
          {counts.map(([kind, label, count, tone]) => (
            <div
              key={kind}
              data-breadth-kind={kind}
              className="flex flex-col-reverse items-center justify-end gap-1.5 rounded-[var(--radius-sm)] bg-currena-soft/50 px-1.5 py-2.5 ring-1 ring-[var(--color-border)]/60"
            >
              <dt className="text-center text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">{label}</dt>
              <dd className={`m-0 text-[1.75rem] font-bold leading-none tabular-nums sm:text-[2rem] ${tone}`}>
                <bdi>{num(count)}</bdi>
              </dd>
            </div>
          ))}
        </dl>
        {/* The proportional breadth bar (R9-06): green/red/grey segments
         * sized by each count's share of the valid rows. Decorative —
         * aria-hidden, the numbers carry the meaning; in RTL the row
         * mirrors with the document direction, which is exactly the
         * reading order the counts above already speak. */}
        {barTotal > 0 ? (
          <div
            aria-hidden="true"
            data-markets-breadth-bar
            className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full ring-1 ring-[var(--color-border)]/70"
          >
            <span style={{ flexGrow: breadth.up }} className="bg-[var(--color-return-up)]" />
            <span style={{ flexGrow: breadth.down }} className="bg-[var(--color-return-down)]" />
            <span style={{ flexGrow: breadth.flat }} className="bg-[var(--color-text-tertiary)] opacity-40" />
          </div>
        ) : null}
        {/* S1-M1.6 #2: state the flat threshold — the band that decides
         * up/flat/down is a rule the reader can now check against the
         * numbers (the audit asked for the sentence and the counts to
         * agree, threshold stated). */}
        <p className="m-0 mt-1.5 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]" data-markets-flat-band-note>
          {copy.markets.flatBandNote}
        </p>
      </div>
      {/* §3.2's separate secondary context line: how many indices sit at
       * least 10% below their 52-week high — RAW fromHigh values, counted
       * by briefing.belowHighCount (a −9.96% that displays as −10% is NOT
       * counted). Quiet when the answer is zero. */}
      {belowHigh > 0 ? (
        <p className="m-0 mt-1 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
          <bdi>
            {interpolate(copy.markets.belowHighLine, {
              n: num(belowHigh),
              count: num(snapshot.markets.length),
            })}
          </bdi>
        </p>
      ) : null}
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
  // S1-M1.6 #2: the calm line's up-count is the BANDED today breadth — the
  // same ±1% definition the breadth box beside it speaks (the old raw
  // any-positive count said "8 rose" under a box reading "5 up · 3 flat").
  const todayBreadth = marketBreadth(markets, 'today');
  let line: string;
  if (summary.signal === 'normal') {
    line = interpolate(copy.markets.takeawayCalm, { up: num(todayBreadth.up), count });
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

