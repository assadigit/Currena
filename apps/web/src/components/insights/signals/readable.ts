/**
 * signals/readable — the per-condition READABILITY rule for the v3
 * gold/silver balance (UI_SPEC §9, task PH6-B, 2026-10-20).
 *
 * The engine (packages/insights/src/signals.ts) evaluates each S1–S3
 * condition from the readings, but its 'unknown' state folds two different
 * stories into one word (a stale/failed driver, or a readable driver with
 * too little data to compute a lean) and its neutral states can also arise
 * from inputs that simply were not there. The balance needs the explicit
 * per-condition answer the spec demands (UI-40): a condition is READABLE
 * when its driver reading exists, is not stale/check-pending/unavailable,
 * AND the condition actually computed — the same freshness set the engine
 * itself uses, plus each evaluator's own input requirements:
 *
 *   real-yield   change30d (30-day direction) or percentile10y (level)
 *   expectations status (the breakeven's own scored rule — always computed
 *                 while the reading is fresh)
 *   stress       BOTH indices fresh + at least one value present
 *   dollar       change30d or percentile10y
 *   footing      the metal's own price row: change30d or percentile10y
 *   industrial   BOTH China PMI + copper-to-gold fresh + at least one leg
 *                carrying a lean input
 *
 * Pure, platform-free (AGENTS.md rule 2); mirrors the S1–S3 definitions
 * verbatim — if the engine's evaluators ever change, this mirror must
 * change with them (pinned by signals/readable.test.ts).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { SignalConditionKey } from '@currena/insights';

/** The statuses a driver must NOT carry to be fresh (the engine's own set). */
function fresh(reading: IndicatorReading | undefined): boolean {
  return (
    reading !== undefined &&
    reading.status !== 'stale' &&
    reading.status !== 'check-pending' &&
    reading.status !== 'unavailable'
  );
}

/** Did the reading carry ANY lean input the evaluator could compute from? */
function hasLeanInput(reading: IndicatorReading): boolean {
  return (
    (reading.change30d !== undefined && Number.isFinite(reading.change30d)) ||
    reading.percentile10y !== undefined
  );
}

/**
 * Is this scored condition readable right now? priceId is the metal's own
 * price row (gold-usd / silver-usd) — the footing condition reads it.
 */
export function isConditionReadable(
  key: SignalConditionKey,
  byId: ReadonlyMap<string, IndicatorReading>,
  priceId: IndicatorId,
): boolean {
  switch (key) {
    case 'real-yield': {
      const r = byId.get('real-yield-10y');
      return fresh(r) && hasLeanInput(r!);
    }
    case 'expectations':
      // conditionExpectations: the breakeven's own status decides — the
      // status always exists on a fresh reading, so fresh == computed.
      return fresh(byId.get('breakeven-5y5y'));
    case 'stress': {
      const stlfsi = byId.get('stress-stlfsi');
      const nfci = byId.get('nfci');
      return (
        fresh(stlfsi) &&
        fresh(nfci) &&
        ((stlfsi !== undefined && stlfsi.value !== null) || (nfci !== undefined && nfci.value !== null))
      );
    }
    case 'dollar': {
      const r = byId.get('dollar-basket');
      return fresh(r) && hasLeanInput(r!);
    }
    case 'footing': {
      const r = byId.get(priceId);
      return fresh(r) && hasLeanInput(r!);
    }
    case 'industrial': {
      const pmi = byId.get('china-pmi');
      const copper = byId.get('copper-gold');
      return fresh(pmi) && fresh(copper) && (hasLeanInput(pmi!) || hasLeanInput(copper!));
    }
  }
}
