/**
 * Question gauges (2026-10-08 data spec §4) — the v1 gauge membership table
 * and the step/verdict arithmetic. Gauges replaced the flat warning-share
 * summary: each lane group IS one gauge, and a region's verdict is the
 * rounded average of its gauge steps (with an escalation rule).
 *
 * Pure, platform-free (AGENTS.md rule 2) so the ingest's summarize() and the
 * SPA's hero meters compute the SAME numbers from the same readings — they
 * cannot drift apart. The snapshot's summary lines are written by the
 * ingest through these functions; the hero meters re-derive per-gauge steps
 * client-side for the segmented display.
 *
 * Step mapping (data spec §4 "Gauges"):
 *   share of scored, non-stale members in alert → step
 *   0 → 1 · up to ⅓ → 2 · up to ⅔ → 3 · above ⅔ → 4
 * Verdict per region: see sectionVerdictStep (the E1 count rule).
 * Gauge members are the SCORED indicators of an area (fix B-14: oil is
 * scored and sits in prices-heat); context cards (info rules) never do.
 */

import type { IndicatorGroupId, IndicatorId, IndicatorReading, InsightsSection, SummaryLine } from '@currena/core';

export interface GaugeDef {
  /** The lane group this gauge maps 1:1 onto (question groups). */
  id: IndicatorGroupId;
  section: InsightsSection;
  /** Scored members (voters). Context items listed in a group's lane but
   * absent here never vote (data spec gauge lists are the source of truth). */
  members: readonly IndicatorId[];
}

/**
 * Version 1 gauge membership (data spec §4). Order = lane order within each
 * section. `gold-silver` carries an implicit "mixed evidence" tag in the UI
 * (spec: "gold-to-silver ratio (tag 'mixed')") — a display concern, not a
 * vote-weight concern.
 */
export const GAUGES: readonly GaugeDef[] = [
  {
    id: 'borrowing-costs',
    section: 'global',
    members: ['yield-curve-10y2y', 'real-yield-10y', 'us10y', 'fed-target', 'ecb-dfr', 'govt-interest-revenue'],
  },
  {
    // Fix spec B-14 (2026-10-14): oil IS scored (its change rule votes) and
    // now sits in the prices area it belongs to — the hero count, the area
    // count and the prices strip all count the same scored list. The card
    // still renders on the Prices board; only the count membership moved.
    id: 'prices-heat',
    section: 'global',
    members: ['us-cpi-yoy', 'breakeven-5y5y', 'brent'],
  },
  // Step-2 add-list §B5: VIX joins the market-stress voters (scored on its
  // 10-year position; the calm/nervous word thresholds arrive with Step 3).
  { id: 'market-stress', section: 'global', members: ['stress-stlfsi', 'nfci', 'vix', 'gold-silver'] },
  { id: 'dollar-strength', section: 'global', members: ['dollar-basket', 'usdjpy'] },
  // Step-2 add-list §B3/§B4: US unemployment and the Sahm rule join the
  // growth-health voters, next to the US macro series already there.
  { id: 'growth-health', section: 'global', members: ['china-pmi', 'm2-us', 'us-unemployment', 'sahm-rule', 'copper-gold'] },
  {
    id: 'au-inflation-rates',
    section: 'australia',
    // Step-2 add-list §B2: the AU 10-year yield is a scored rate (its
    // 10-year position), joining the CPI and gap voters.
    members: ['au-cpi', 'au-trimmed-mean', 'au-10y', 'au-us-10y-gap'],
  },
  {
    id: 'au-households',
    section: 'australia',
    members: [
      'au-home-loan',
      'au-wage-growth',
      'au-rent-yoy',
      'au-household-debt-arrears',
      'au-unemployment',
      'au-home-values',
    ],
  },
  {
    id: 'au-trade-currency',
    section: 'australia',
    // Step-2 add-list §B6: iron ore left the voters — it is context only
    // now (the card says so; the au-trade gauge counts only the FX and
    // terms-of-trade members).
    members: ['audusd', 'audjpy', 'terms-of-trade'],
  },
];

export interface GaugeReading {
  /** The gauge's identity (also its lane group id). */
  gauge: IndicatorGroupId;
  section: InsightsSection;
  /** Step 1–4 (see module doc). 0 gauges → step 0 means "cannot read". */
  step: number;
  /** Members that voted (scored, fresh, rule-evaluated). */
  votingCount: number;
  /** Voting members currently in their warning zone. */
  warningCount: number;
}

const votable = (s: IndicatorReading['status']): boolean => s === 'warning' || s === 'normal';

/** One gauge's reading from the snapshot readings (pure). */
export function gaugeReading(
  gauge: GaugeDef,
  readings: readonly IndicatorReading[],
): GaugeReading {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  let votingCount = 0;
  let warningCount = 0;
  for (const id of gauge.members) {
    const r = byId.get(id);
    if (!r || !votable(r.status)) continue;
    votingCount += 1;
    if (r.status === 'warning') warningCount += 1;
  }
  const share = votingCount === 0 ? 0 : warningCount / votingCount;
  let step: number;
  if (votingCount === 0) step = 0; // nothing could vote — cannot read
  else if (share === 0) step = 1;
  else if (share <= 1 / 3) step = 2;
  else if (share <= 2 / 3) step = 3;
  else step = 4;
  return { gauge: gauge.id, section: gauge.section, step, votingCount, warningCount };
}

/** All gauge readings for one section, in GAUGES order (pure). */
export function gaugesForSection(
  section: InsightsSection,
  readings: readonly IndicatorReading[],
): GaugeReading[] {
  return GAUGES.filter((g) => g.section === section).map((g) => gaugeReading(g, readings));
}

/**
 * A region's verdict step from its gauges — Step-1 audit item E1: ONE
 * count-based mapping, used by BOTH regions (the ingest's summary and the
 * SPA's hero render the same function, so the word can never disagree with
 * the areas it names). Gauges that cannot read (step 0, no voters) are
 * EXCLUDED from every count; a region with no readable gauges returns
 * step 0 (the honest "cannot read" the UI renders as no label).
 *
 * The rule, in one breath (displayed verbatim in the hero's "How is this
 * calculated?" panel):
 *   alarmed  — at least two areas at step 4, or every area at step ≥ 3;
 *   stressed — at least two areas at step ≥ 3, or most areas at step ≥ 2;
 *   cautious — any area at step ≥ 2;
 *   relaxed  — every area at step 1.
 */
export function sectionVerdictStep(
  section: InsightsSection,
  readings: readonly IndicatorReading[],
): number {
  const gauges = gaugesForSection(section, readings);
  const readable = gauges.filter((g) => g.step > 0);
  if (readable.length === 0) return 0;
  const atLeast = (step: number): number => readable.filter((g) => g.step >= step).length;
  // alarmed: two critical areas, or every area stressed-or-worse
  if (atLeast(4) >= 2 || atLeast(3) === readable.length) return 4;
  // stressed: two areas stressed-or-worse, or a majority cautious-or-worse
  if (atLeast(3) >= 2 || atLeast(2) > readable.length / 2) return 3;
  // cautious: anything above calm
  if (atLeast(2) >= 1) return 2;
  return 1;
}

/**
 * Map a verdict step onto the existing four label words (UI spec Block H1:
 * "Use the existing four verdict labels"). Step 0 → null — never invented.
 */
export function labelForVerdictStep(step: number): 'relaxed' | 'cautious' | 'stressed' | 'alarmed' | null {
  switch (step) {
    case 1:
      return 'relaxed';
    case 2:
      return 'cautious';
    case 3:
      return 'stressed';
    case 4:
      return 'alarmed';
    default:
      return null;
  }
}

/**
 * The summary line for one section under the gauge regime — the same wire
 * shape the flat-share summarize() wrote (contract stability for the CSV
 * export and /admin), with counts now describing GAUGE MEMBERS and the
 * label derived from the verdict step.
 */
export function summarizeSectionByGauges(
  section: InsightsSection,
  readings: readonly IndicatorReading[],
): SummaryLine {
  const sectionGauges = GAUGES.filter((g) => g.section === section);
  const memberIds = new Set<string>();
  for (const g of sectionGauges) for (const id of g.members) memberIds.add(id);
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  let warningCount = 0;
  let votingCount = 0;
  let excludedCount = 0;
  for (const id of memberIds) {
    const r = byId.get(id);
    if (!r) continue; // reading absent entirely (subset snapshot) — not counted
    if (votable(r.status)) {
      votingCount += 1;
      if (r.status === 'warning') warningCount += 1;
    } else {
      excludedCount += 1; // stale / no-history / unavailable (context members are never gauge members)
    }
  }
  const step = sectionVerdictStep(section, readings);
  return {
    section,
    label: labelForVerdictStep(step),
    warningCount,
    votingCount,
    excludedCount,
  };
}

/** Both summary lines under the gauge regime (same wire shape as the old
 * summarize()) — the ingest's writer, so the snapshot's summary and the
 * SPA's hero verdicts agree by construction.
 */
export function summarizeByGauges(readings: readonly IndicatorReading[]): {
  global: SummaryLine;
  australia: SummaryLine;
} {
  return {
    global: summarizeSectionByGauges('global', readings),
    australia: summarizeSectionByGauges('australia', readings),
  };
}
