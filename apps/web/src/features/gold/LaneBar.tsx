/**
 * LaneBar — the ONE lane-summary renderer (GUX-S5 M2, 11 §5.3).
 *
 * One component renders every lane summary, everywhere a lane appears:
 * the hero's CompositionStack, the five-force overview, the time
 * machine's rows, the narrative's family lines, the on-ramp closes.
 *
 * The anatomy (fixed slot order):
 *   1. the audience label (08 §5.1's finals — the S3-D4 vocabulary)
 *   2. the state word — the lane's OWN condition in its natural
 *      vocabulary (relief/tight · stress/strong · elevated/calm ·
 *      hot/cool · calm/elevated), rendered in the lane's IMPACT ink
 *      (the two-channel rule at lane level: the word names the
 *      condition, the ink carries the relationship to gold)
 *   3. the stacked pill — the shipped `.bal-lanes-bar` upgraded from
 *      44×6 to a full-width 8px strip: segments proportional to the
 *      lane's member counts (supports status-normal · pressures
 *      status-alert · steady stone · unread dotted), stacking order
 *      following the reading direction so "for" always starts at the
 *      reading origin (plain DOM order + logical flex — RTL mirrors
 *      for free); `aria-hidden` (the words carry the meaning)
 *   4. the tally in words — the numbers the engine exposes, no new
 *      scores
 *
 * The special cases (the honesty rules): a SPLIT lane renders both
 * hued segments + the amber compact word; an UNREAD lane (zero
 * readable members) renders the whole pill dotted with its why-line —
 * never as all-steady. The row's accessible name is
 * "«lane label»: «state word». «tally».".
 */

import { useI18n } from '../../shared/lib/locale';
import { formatNumber } from '@currena/core';
import type { TranslationKey } from '../../shared/lib/locale';
import type { GoldBalanceLane, GoldLane } from '@currena/insights';
import type { GoldSeatLane } from './gold-tiles';

/** The lane id → its two condition words (for / against). */
const LANE_COND_KEY: Readonly<Record<GoldLane, { for: TranslationKey; against: TranslationKey }>> = {
  'borrowing-costs': { for: 'pd.gold.laneCondBorrowingCostsFor', against: 'pd.gold.laneCondBorrowingCostsAgainst' },
  dollar: { for: 'pd.gold.laneCondDollarFor', against: 'pd.gold.laneCondDollarAgainst' },
  stress: { for: 'pd.gold.laneCondStressFor', against: 'pd.gold.laneCondStressAgainst' },
  inflation: { for: 'pd.gold.laneCondInflationFor', against: 'pd.gold.laneCondInflationAgainst' },
  flows: { for: 'pd.gold.laneCondFlowsFor', against: 'pd.gold.laneCondFlowsAgainst' },
};

export const LANE_BAR_LABEL_KEY: Readonly<Record<GoldLane, TranslationKey>> = {
  'borrowing-costs': 'pd.gold.laneBorrowingCosts',
  dollar: 'pd.gold.laneDollar',
  stress: 'pd.gold.laneStress',
  inflation: 'pd.gold.laneInflation',
  flows: 'pd.gold.laneFlows',
};

/** The neutral/unread words stay RELATIONAL (11 §5.3: a lane firing
 * under minimum has no condition to name — honest over natural). */
const NEUTRAL_KEY: TranslationKey = 'pd.gold.laneStateNeutral';
const UNREAD_KEY: TranslationKey = 'pd.gold.laneStateUnread';

const STATE_TONE: Readonly<Record<string, string>> = {
  for: 'text-[var(--color-status-normal)]',
  against: 'text-[var(--color-status-alert)]',
  neutral: 'text-[var(--color-text-secondary)]',
  unread: 'text-[var(--color-text-tertiary)]',
  split: 'text-[var(--color-status-watch)]',
};

/** The normalized lane summary the LaneBar renders (built from either
 * the engine's GoldBalanceLane or the page's GoldSeatLane). */
export interface LaneBarData {
  lane: GoldLane;
  side: 'for' | 'against' | 'neutral' | 'unread';
  split: boolean;
  supports: number;
  pressures: number;
  steady: number;
  unread: number;
  /** The unread lane's why-line (only when side === 'unread'). */
  whyLine?: string;
}

export function laneBarDataOf(lane: GoldBalanceLane): LaneBarData {
  const steady = lane.members.filter((m) => m.impact === 'steady').length;
  const unread = lane.members.filter((m) => m.impact === 'unread').length;
  return {
    lane: lane.lane,
    side: lane.side,
    split: lane.split,
    supports: lane.supports,
    pressures: lane.pressures,
    steady,
    unread,
  };
}

export function laneBarDataOfSeatLane(lane: GoldSeatLane): LaneBarData {
  const steady = lane.seats.filter((s) => s.impact === 'steady').length;
  const unread = lane.seats.filter((s) => s.impact === 'unread').length;
  return {
    lane: lane.lane,
    side: lane.side,
    split: lane.split,
    supports: lane.supports,
    pressures: lane.pressures,
    steady,
    unread,
  };
}

export function LaneBar({ data, className = '' }: { data: LaneBarData; className?: string }): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const label = t(LANE_BAR_LABEL_KEY[data.lane]);
  const total = data.supports + data.pressures + data.steady + data.unread;
  const pct = (n: number): string => `${(total > 0 ? (n / total) * 100 : 0).toFixed(3)}%`;

  const stateWord =
    data.side === 'for' || data.side === 'against'
      ? t(data.side === 'for' ? LANE_COND_KEY[data.lane].for : LANE_COND_KEY[data.lane].against)
      : data.side === 'neutral'
        ? t(NEUTRAL_KEY)
        : t(UNREAD_KEY);
  const splitWord = data.split
    ? t('pd.gold.laneCondSplit', { supports: num(data.supports), pressures: num(data.pressures) })
    : null;
  const stateTone = data.split ? STATE_TONE.split : STATE_TONE[data.side] ?? '';
  const shownWord = splitWord ?? stateWord;

  const tallyParts: string[] = [];
  if (data.supports > 0) tallyParts.push(t('pd.gold.heroCountFor', { n: num(data.supports) }));
  if (data.pressures > 0) tallyParts.push(t('pd.gold.heroCountAgainst', { n: num(data.pressures) }));
  if (data.steady > 0) tallyParts.push(t('pd.gold.heroCountNotLeaning', { n: num(data.steady) }));
  if (data.unread > 0) tallyParts.push(t('pd.gold.heroCountUnread', { n: num(data.unread) }));
  const tally = tallyParts.length > 0 ? tallyParts.join(' · ') : t('pd.gold.laneTallyNone');

  const ariaName = `${label}: ${shownWord}. ${tally}.`;

  return (
    <div
      className={`flex flex-col gap-1 ${className}`}
      data-lanebar={data.lane}
      data-lanebar-side={data.split ? 'split' : data.side}
      role="group"
      aria-label={ariaName}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="type-label font-semibold text-[var(--color-text-primary)]">{label}</span>
        <span className={`type-label font-semibold ${stateTone}`} data-lanebar-state>
          {shownWord}
        </span>
      </div>
      <div
        aria-hidden="true"
        data-lanebar-pill={data.side === 'unread' ? 'dotted' : true}
        className="lanebar-pill"
      >
        {data.side === 'unread' ? (
          <span className="lanebar-seg lanebar-seg-dotted" style={{ width: '100%' }} />
        ) : (
          <>
            {data.supports > 0 && (
              <span className="lanebar-seg lanebar-seg-for" style={{ width: pct(data.supports) }} />
            )}
            {data.pressures > 0 && (
              <span className="lanebar-seg lanebar-seg-against" style={{ width: pct(data.pressures) }} />
            )}
            {data.steady > 0 && (
              <span className="lanebar-seg lanebar-seg-steady" style={{ width: pct(data.steady) }} />
            )}
            {data.unread > 0 && (
              <span className="lanebar-seg lanebar-seg-unread" style={{ width: pct(data.unread) }} />
            )}
          </>
        )}
      </div>
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
        {tally}
        {data.side === 'unread' && data.whyLine !== undefined ? ` — ${data.whyLine}` : ''}
      </p>
    </div>
  );
}
