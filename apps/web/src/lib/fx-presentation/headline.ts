/**
 * fx-presentation/headline — §10.3's headline sentence and §9.10's verdict
 * measure label, incl. the CR §3.2 big-mover templates (Phase: WS-4 module
 * split of the former fx-presentation.ts monolith — zero behavior change,
 * code moved verbatim). Generated from the numbers, never free text.
 */

import type { FxPairId, FxRuleId, FxSnapshot } from '@currena/core';
import { FX_BIG_MOVE_M1_PCT } from '@currena/insights/fx/definitions';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { interpolate } from '../../i18n';
import { abs1 } from './format';
import { PAIR_CURRENCIES } from './pairs';
import { fxClosestToWarning, fxRuleCopyKey } from './rules';

export type FxMeasureLabel = 'measureNormal' | 'measureAttention' | 'measureUnusual';

/** §9.10's measure label for the section's current signal. */
export function fxMeasureKey(signal: FxSnapshot['summary']['signal']): FxMeasureLabel {
  if (signal === 'unusual') return 'measureUnusual';
  if (signal === 'attention') return 'measureAttention';
  return 'measureNormal';
}

/*
 * The big mover (CR §3.2): when the section signal is Normal but the dollar
 * measure or a pair made a visible big move (|M1| ≥ 3.0, or the pair's
 * stored bigMove tag), the headline says so — a calm verdict over a visible
 * big move reads as an error (fix B8's honest-verdict half).
 */
export interface FxBigMover {
  kind: 'dollar' | 'pair';
  pairId?: FxPairId;
  /** The 1-month change, percent (signed). */
  m1: number;
}

/** The biggest qualifying mover, or null on a genuinely quiet day. */
export function fxBigMoverOf(snapshot: FxSnapshot): FxBigMover | null {
  const candidates: FxBigMover[] = [];
  const d = snapshot.dollarMeasure.chg.m1;
  if (Math.abs(d) >= FX_BIG_MOVE_M1_PCT) candidates.push({ kind: 'dollar', m1: d });
  for (const p of snapshot.pairs) {
    if (Math.abs(p.chg.m1) >= FX_BIG_MOVE_M1_PCT || p.bigMove) {
      candidates.push({ kind: 'pair', pairId: p.id, m1: p.chg.m1 });
    }
  }
  if (candidates.length === 0) return null;
  // Biggest |M1| wins; ties go to the dollar measure (it is the headline row).
  candidates.sort((a, b) => Math.abs(b.m1) - Math.abs(a.m1) || (a.kind === 'dollar' ? -1 : 1));
  return candidates[0]!;
}

/** CR §3.2's {mover sentence} — "the US dollar is up {x}% this month" or
 * "the euro lost {x}% against the US dollar this month". */
function fxMoverSentence(mover: FxBigMover, copy: InsightsCopy['fx'], numberLocale: 'en-US' | 'fa-IR'): string {
  const x = abs1(mover.m1, numberLocale);
  if (mover.kind === 'dollar') {
    return interpolate(mover.m1 > 0 ? copy.moverDollarUp : copy.moverDollarDown, { x });
  }
  const [firstCcy, secondCcy] = PAIR_CURRENCIES[mover.pairId!]!;
  const params = {
    x,
    first: copy.currencyNames[firstCcy],
    second: copy.currencyNames[secondCcy],
  };
  return interpolate(mover.m1 < 0 ? copy.moverPairDown : copy.moverPairUp, params);
}

/** The §10.3 headline sentence — generated from the numbers, never free text.
 * v1.3 fix B2: only a pattern that COUNTS (a counted Warning) can lead the
 * headline — never a context card, never a supportive row. When nothing
 * counts: the calm headline, or the big-mover template when a big move is
 * visible (CR §3.2). */
export function fxHeadline(
  snapshot: FxSnapshot,
  copy: InsightsCopy['fx'],
  numberLocale: 'en-US' | 'fa-IR' = 'en-US',
): string {
  const { summary, rules } = snapshot;
  // The confidence wobble gets its own headline (§10.3 row 4).
  const wobble = rules.find((r) => r.id === 'r4_money_hiding' && r.variant === 'wobble' && r.counted);
  if (wobble !== undefined) return copy.headlineWobble;
  const nameOf = (id: FxRuleId): string => copy.rules[fxRuleCopyKey(id)].name;
  if (summary.signal === 'unusual' && summary.headlineRule !== null) {
    return interpolate(copy.headlineUnusual, { top: nameOf(summary.headlineRule) });
  }
  if (summary.countedWarnings >= 1 && summary.headlineRule !== null) {
    const more = summary.countedWarnings - 1;
    // §10.3's "{, plus {n} more}" is an OPTIONAL tail — two templates.
    return interpolate(more > 0 ? copy.headlineActiveMore : copy.headlineActive, {
      top: nameOf(summary.headlineRule),
      ...(more > 0 ? { n: String(more) } : {}),
    });
  }
  // Normal signal with a visible big move (CR §3.2).
  const mover = fxBigMoverOf(snapshot);
  if (mover !== null) {
    return interpolate(copy.headlineBigMover, { mover: fxMoverSentence(mover, copy, numberLocale) });
  }
  // Calm: name the pattern closest to a warning (§10.3 row 1).
  const closest = fxClosestToWarning(rules);
  return interpolate(copy.headlineCalm, { name: closest !== null ? nameOf(closest.id) : '—' });
}
