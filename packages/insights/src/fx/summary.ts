/**
 * Section summary + snapshot assembly (spec §6.5, §5) — Phase 3 split of
 * the former compute.ts monolith.
 */

import type {
  FxDollarMeasure,
  FxPairEntry,
  FxPairId,
  FxPlain,
  FxRuleId,
  FxRuleState,
  FxSnapshot,
  FxSummary,
} from '@currena/core';
import { FxSnapshotSchema } from '@currena/core';
import { FX_STALE_DAYS, FX_WEEKLY_POINTS, VERDICT_ATTENTION_COUNT, VERDICT_UNUSUAL_COUNT } from './definitions';
import { round2 } from './maths';
import { daysBetween } from '../series';

export function summarizeFxRules(rules: readonly FxRuleState[]): FxSummary {
  const counted = rules.filter((r) => r.outcome === 'warning' && r.counted);
  const wobble = rules.find((r) => r.id === 'r4_money_hiding' && r.variant === 'wobble' && r.counted);
  const signal: FxSummary['signal'] =
    counted.length >= VERDICT_UNUSUAL_COUNT || wobble !== undefined
      ? 'unusual'
      : counted.length >= VERDICT_ATTENTION_COUNT
        ? 'attention'
        : 'normal';
  // v1.3 (fix B2): the headline names only the leading pattern that
  // COUNTS (a counted Warning). Supportive/Watch rows never lead it, and
  // the R7 context card can never appear here — a context card is not an
  // active pattern ("calm" + "Dollar or euro? is active" contradicted
  // itself). When nothing counts, the UI falls back to the calm headline
  // (§10.3 + CR §3.2's big-mover template).
  const headlineRule: FxRuleId | null = wobble !== undefined ? wobble.id : (counted[0]?.id ?? null);
  return { signal, countedWarnings: counted.length, headlineRule };
}

/**
 * The v1.3 plain-language helpers (CR §6 “Build notes”): tiny derived
 * fields stored once so the page never re-derives them. Under 1 KB:
 * `dollarYearExtreme` is one word, `movers` six small numbers.
 *
 * - `dollarYearExtreme`: 'high'/'low' when the dollar measure sits at its
 *   52-week extreme (S1's optional "its strongest/weakest in a year"
 *   clause) — computed from the stored weekly closes, null otherwise.
 * - `movers`: each big currency's OWN one-month change against the US
 *   dollar, percent, positive = the currency GAINED on the dollar (S2).
 *   X/USD pairs (euro, pound, Australian dollar) ride their own pair
 *   change; USD/X pairs (yen, yuan, franc) invert: 1 ÷ (1 + chg) − 1.
 */
export function buildFxPlain(
  dollarMeasure: FxDollarMeasure,
  pairs: readonly FxPairEntry[],
): FxPlain {
  const window = dollarMeasure.weekly.map(([, v]) => v).slice(-FX_WEEKLY_POINTS);
  let dollarYearExtreme: 'high' | 'low' | null = null;
  if (window.length > 0) {
    const max = Math.max(...window);
    const min = Math.min(...window);
    const v = dollarMeasure.value;
    if (v >= max && v > min) dollarYearExtreme = 'high';
    else if (v <= min && v < max) dollarYearExtreme = 'low';
  }
  const byId = new Map(pairs.map((p) => [p.id as string, p]));
  const own = (xUsd: FxPairId): number | undefined => byId.get(xUsd)?.chg.m1;
  const inv = (usdX: FxPairId): number | undefined => {
    const m1 = byId.get(usdX)?.chg.m1;
    return m1 === undefined ? undefined : round2((1 / (1 + m1 / 100) - 1) * 100);
  };
  return {
    dollarYearExtreme,
    movers: {
      EUR: own('eurusd'),
      JPY: inv('usdjpy'),
      GBP: own('gbpusd'),
      CNY: inv('usdcny'),
      CHF: inv('usdchf'),
      AUD: own('audusd'),
    },
  };
}

/** Assemble the ONE stored object (schema-validated before it is written). */
export function buildFxSnapshot(input: {
  generatedAt: string;
  dollarMeasure: FxDollarMeasure;
  pairs: readonly FxPairEntry[];
  rules: readonly FxRuleState[];
}): FxSnapshot {
  const summary = summarizeFxRules(input.rules);
  const snapshot: FxSnapshot = {
    v: 1,
    generatedAt: input.generatedAt,
    dollarMeasure: input.dollarMeasure,
    pairs: [...input.pairs],
    rules: [...input.rules],
    summary,
    plain: buildFxPlain(input.dollarMeasure, input.pairs),
  };
  return FxSnapshotSchema.parse(snapshot);
}

/**
 * Serve-time staleness re-evaluation (audit A-8, D-21 — the fx twin of
 * markets/compute.ts's reStaleMarketsSnapshot): the stored pairs' `stale`
 * flags freeze at WRITE time (job.ts's reStale), so if BOTH crons fail
 * for days KV keeps `stale:false` while `asOf` ages. The serve path
 * (currena-api's /api/insights/fx route) re-evaluates every pair row
 * against today's UTC date here — one daysBetween per row, same JSON
 * shape, honestly flipped values. Fresh snapshots come back as the SAME
 * object (byte-identical response). The dollar measure and the rules
 * carry no stale flag by schema; their freshness rides asOf/notes as
 * designed.
 */
export function reStaleFxSnapshot(snapshot: FxSnapshot, todayIso: string): FxSnapshot {
  let changed = false;
  const pairs = snapshot.pairs.map((p) => {
    const staleNow = daysBetween(p.asOf, todayIso) > FX_STALE_DAYS;
    if (staleNow === p.stale) return p;
    changed = true;
    return { ...p, stale: staleNow };
  });
  return changed ? { ...snapshot, pairs } : snapshot;
}
