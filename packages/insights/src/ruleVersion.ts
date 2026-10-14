/**
 * Fix spec A-07 (2026-10-14): every scoring rule carries a version number,
 * shown in "How is this calculated?" and stored with every snapshot and
 * daily archive. RULE_CHANGELOG is the repository's short change log.
 *
 * Version history (one line per change; the version that produced a stored
 * snapshot rides ON the snapshot, so a past page can be reproduced):
 *   1 — the v2 engine (Phase I1–I15 + Step-1/Step-2 audit fixes): the
 *       percentile/threshold/change/yoy-negative/consecutive-decline/
 *       above-low/below-aux atom set, gauge steps and the E1 verdict rule.
 *   2 — the 2026-10-14 fix spec: dollar speed rule (B-03), grace-day
 *       defaults 4/10/45/120 with per-series evidence overrides (B-09),
 *       Brent joins the prices-heat gauge (B-14), the connection v2
 *       direction-over-window rules (B-04), the four new Part C indicators,
 *       and the Part D validation suite gating every publish.
 */

/** The scoring-rule version stamp written onto every snapshot. */
export const RULE_VERSION = 2;

/** One change-log entry. */
export interface RuleChangeLogEntry {
  version: number;
  date: string;
  change: string;
}

/** The visible change log (rendered in "How is this calculated?"). */
export const RULE_CHANGELOG: readonly RuleChangeLogEntry[] = [
  {
    version: 1,
    date: '2026-10-08',
    change:
      'v2 engine: percentile/threshold/change/yoy-negative/consecutive-decline/above-low/below-aux rules, question gauges, E1 verdict mapping.',
  },
  {
    version: 2,
    date: '2026-10-14',
    change:
      'Fix spec: dollar speed rule (30-day move at or above 3% counts as needs attention), stale-after defaults 4/10/45/120 days with per-series overrides, oil scored in the prices area, connection rules rewritten as direction-over-window with minimum moves, four new indicators (Fed expectations, US 30-year yield, Philadelphia Fed survey, RBA expectations), validation tests T-01 to T-14 gate every publish.',
  },
];
