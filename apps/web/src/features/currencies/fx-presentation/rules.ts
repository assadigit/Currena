/**
 * fx-presentation/rules — §9.3's status table, the pattern-card ordering
 * and the quiet-area selection (Phase: WS-4 module split of the former
 * fx-presentation.ts monolith — zero behavior change, code moved
 * verbatim). Engine names are internal; the screen shows Active /
 * Watching / Quiet + the page's own severity chips (V1: nothing invented).
 */

import type { FxRuleId, FxRuleState } from '@currena/core';

/* ------------------------------------------------------------------ *
 * §9.3's status table — engine names are internal, the screen shows
 * Active / Watching / Quiet + the page's own severity chips
 * ------------------------------------------------------------------ */

export type FxScreenStatus = 'active' | 'watching' | 'quiet';

/** The copy corpus keys the seven rules ride (r1…r7), from the engine ids. */
export function fxRuleCopyKey(id: FxRuleId): 'r1' | 'r2' | 'r3' | 'r4' | 'r5' | 'r6' | 'r7' {
  return id.slice(0, 2) as 'r1' | 'r2' | 'r3' | 'r4' | 'r5' | 'r6' | 'r7';
}

export interface FxRuleView {
  rule: FxRuleState;
  /** The screen status word (V1: only Active / Watching / Quiet). */
  status: FxScreenStatus;
  /** The page's severity chip; null when the §9.3 table says none. */
  chip: 'normal' | 'attention' | 'unusual' | null;
}

/** The §9.3 status table, applied. Nodata rows stay rows (grey, no guess). */
export function fxRuleView(rule: FxRuleState): FxRuleView {
  switch (rule.outcome) {
    case 'warning':
      // The R4 confidence-wobble wears the Unusual chip and forces the
      // section to Unusual (§9.3 row 2); a plain warning is Needs attention.
      return { rule, status: 'active', chip: rule.variant === 'wobble' ? 'unusual' : 'attention' };
    case 'supportive':
      return { rule, status: 'active', chip: 'normal' };
    case 'watch':
      return { rule, status: 'watching', chip: null };
    case 'context':
      return { rule, status: 'active', chip: null };
    case 'quiet':
      return { rule, status: 'quiet', chip: null };
    case 'nodata':
      return { rule, status: 'quiet', chip: null };
  }
}

/* ------------------------------------------------------------------ *
 * The pattern-card ordering (§9.3 item 3)
 * ------------------------------------------------------------------ */

/** Screen seriousness: Unusual chip > Needs attention > Watching > Active
 * (healthy) > context > quiet/nodata. Ties go by rule number. */
const ORDER_SEVERITY: Record<FxRuleId, number> = {
  r1_risk_mood: 1,
  r2_carry_trade: 2,
  r3_dollar_strength: 3,
  r4_money_hiding: 4,
  r5_china_link: 5,
  r6_europe_worry: 6,
  r7_dollar_or_euro: 7,
};

function severityRank(view: FxRuleView): number {
  if (view.rule.outcome === 'nodata') return 90; // last: "Not enough data"
  if (view.status === 'quiet') return 80;
  if (view.rule.outcome === 'context') return 60;
  if (view.status === 'active' && view.chip === 'normal') return 40; // supportive
  if (view.status === 'watching') return 30;
  if (view.status === 'active' && view.chip === 'attention') return 20;
  return 10; // active + unusual (incl. the wobble)
}

/** The rules the PATTERN AREA shows (§9.3): non-quiet patterns, most
 * serious first, at most 3; R7 rides only when EUR/USD moved ≥2.5%. */
export function fxPatternOrder(rules: readonly FxRuleState[]): FxRuleState[] {
  const r7 = rules.find((r) => r.id === 'r7_dollar_or_euro');
  const r7Showing = r7 !== undefined && r7.outcome === 'context';
  return [...rules]
    .filter((r) => {
      if (r.outcome === 'quiet' || r.outcome === 'nodata') return false;
      if (r.id === 'r7_dollar_or_euro') return r7Showing; // below 2.5%: the card stays away
      return true;
    })
    .sort((a, b) => {
      const rank = severityRank(fxRuleView(a)) - severityRank(fxRuleView(b));
      return rank !== 0 ? rank : ORDER_SEVERITY[a.id] - ORDER_SEVERITY[b.id];
    })
    .slice(0, 3);
}

/** The quiet rules (§9.3 item 4): Quiet AND Nodata rows are left out of
 * the closest-to-warning choice; the quiet list holds only true Quiets.
 * R7 never rides the list — it is a context rule: it either shows its card
 * or stays away entirely (a "quiet" R7 renders no row, so counting it
 * would break the "{n} more" number). v1.3 fix B6: pass the closest
 * pattern's id and it is LEFT OUT of the list — the closest row and the
 * "more quiet patterns" list must never repeat the same pattern. */
export function fxQuietRules(rules: readonly FxRuleState[], excludeId?: FxRuleId): FxRuleState[] {
  return rules.filter((r) => r.outcome === 'quiet' && r.id !== 'r7_dollar_or_euro' && r.id !== excludeId);
}

/** The quiet pattern closest to its warning (highest progress; §6.7).
 * Nodata rows are excluded (spec §9.5). */
export function fxClosestToWarning(rules: readonly FxRuleState[]): FxRuleState | null {
  const quiet = rules.filter((r) => r.outcome === 'quiet' && r.progress > 0);
  if (quiet.length === 0) return null;
  return quiet.reduce((best, r) => (r.progress > best.progress ? r : best), quiet[0]!);
}
