/**
 * signals/balance — the per-metal balance tally for the v3 gold/silver
 * balance visual (UI_SPEC §9, task PH6-B, 2026-10-20). Pure grouping +
 * the beam's tilt arithmetic; the SVG lives in Balance.tsx.
 *
 * UI-39/40 rules, verbatim:
 *  - all conditions weigh equally; one equal-sized token per SCORED
 *    READABLE condition rests on its end of the beam;
 *  - neutral conditions sit in the aside (grey tokens), never on the beam;
 *  - unreadable conditions are dashed tokens, never counted in the tilt;
 *  - tilt = (supporting − pressuring) / readable scored conditions,
 *    scaled to a maximum of 12 degrees;
 *  - fewer than 3 readable scored conditions: the beam stays LEVEL.
 *
 * An engine condition whose readability says false is unreadable here even
 * when the engine folded it into 'neutral' (a dataless neutral is not a
 * weighed condition) — the grouping stays honest toward UI-40.
 */

import type { IndicatorId } from '@currena/core';
import type { SignalConditionKey, SignalConditionReading, SignalReading } from '@currena/insights';

export interface BalanceItem {
  key: SignalConditionKey;
  state: SignalConditionReading['state'];
  /** The indicator rows whose live values the balance row shows. */
  inputs: readonly IndicatorId[];
}

export interface BalanceTally {
  supporting: readonly BalanceItem[];
  pressuring: readonly BalanceItem[];
  neutral: readonly BalanceItem[];
  unreadable: readonly BalanceItem[];
  supportingCount: number;
  pressuringCount: number;
  neutralCount: number;
  unreadableCount: number;
  /** Readable scored conditions (supporting + pressuring + neutral). */
  readableCount: number;
  /** All scored conditions for this metal (gold 5, silver 6). */
  totalCount: number;
  /** UI-40: fewer than 3 readable conditions — the beam stays level. */
  level: boolean;
  /** Signed degrees, positive = supporting side heavier; 0 when level. */
  tilt: number;
}

/** The beam's maximum tilt in degrees (UI-39.3). */
export const MAX_TILT_DEGREES = 12;

/** Fewer readable scored conditions than this keeps the beam level (UI-40). */
export const MIN_READABLE_TO_WEIGH = 3;

/**
 * Group one metal's conditions into the balance's sides. `readableOf` maps
 * each condition key to its readability (see signals/readable.ts); a
 * condition that is not readable lands in the unreadable group whatever
 * the engine folded its state into.
 */
export function balanceOf(
  signal: SignalReading,
  readableOf: (key: SignalConditionKey) => boolean,
): BalanceTally {
  const supporting: BalanceItem[] = [];
  const pressuring: BalanceItem[] = [];
  const neutral: BalanceItem[] = [];
  const unreadable: BalanceItem[] = [];
  for (const condition of signal.conditions) {
    const item: BalanceItem = { key: condition.key, state: condition.state, inputs: condition.inputs };
    if (!readableOf(condition.key)) {
      unreadable.push(item);
      continue;
    }
    switch (condition.state) {
      case 'supportive':
        supporting.push(item);
        break;
      case 'against':
        pressuring.push(item);
        break;
      default:
        neutral.push(item);
        break;
    }
  }
  const supportingCount = supporting.length;
  const pressuringCount = pressuring.length;
  const neutralCount = neutral.length;
  const unreadableCount = unreadable.length;
  const readableCount = supportingCount + pressuringCount + neutralCount;
  const level = readableCount < MIN_READABLE_TO_WEIGH;
  const tilt = level
    ? 0
    : Math.max(
        -MAX_TILT_DEGREES,
        Math.min(MAX_TILT_DEGREES, ((supportingCount - pressuringCount) / readableCount) * MAX_TILT_DEGREES),
      );
  return {
    supporting,
    pressuring,
    neutral,
    unreadable,
    supportingCount,
    pressuringCount,
    neutralCount,
    unreadableCount,
    readableCount,
    totalCount: signal.conditions.length,
    level,
    tilt,
  };
}
