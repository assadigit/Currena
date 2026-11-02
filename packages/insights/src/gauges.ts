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
 *   (S1-M1.4, 2026-10-31: the share's base is fresh voters PLUS stale
 *   members — a stale member never votes and never shrinks the base, so
 *   a calm member going stale can never make the gauge read more severe.)
 * Verdict per region: see sectionVerdictStep (the E1 count rule).
 * Gauge members are the SCORED indicators of an area (fix B-14: oil is
 * scored and sits in prices-heat); context cards (info rules) never do.
 */

import type { IndicatorGroupId, IndicatorId, IndicatorReading, InsightsSection, SummaryLine } from '@currena/core';
import { DEFINITIONS } from './definitions';

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
    // Fix spec C-03/C-04 (2026-10-14): the Fed-expectations gap and the
    // 30-year yield join the voters (both scored rate series).
    members: [
      'yield-curve-10y2y',
      // 2026-10-26 gap-audit build, A-1: the 10y−3m leg joins the voters —
      // the Fed's own preferred recession lens beside its 10y−2y sibling.
      'yield-curve-10y3m',
      'fed-expectations',
      'real-yield-10y',
      'us10y',
      'us30y',
      'fed-target',
      'ecb-dfr',
      'govt-interest-revenue',
    ],
  },
  {
    // Fix spec B-14 (2026-10-14): oil IS scored (its change rule votes) and
    // now sits in the prices area it belongs to — the hero count, the area
    // count and the prices strip all count the same scored list. The card
    // still renders on the Prices board; only the count membership moved.
    // M4 Wave 1 (2026-10-24): core PCE joins the voters — the
    // Fed's own target gauge, scored against its published 2% goal.
    // M6 Wave 3 (2026-10-25): euro-hicp joins the voters — the euro
    // area's inflation scored against the ECB's own 2% symmetric target
    // (the prices lane's second central-bank goal line beside the Fed's).
    id: 'prices-heat',
    section: 'global',
    members: ['us-cpi-yoy', 'us-pce-core-yoy', 'euro-hicp', 'breakeven-5y5y', 'brent'],
  },
  // Step-2 add-list §B5: VIX joins the market-stress voters (scored on its
  // 10-year position; the calm/nervous word thresholds arrive with Step 3).
  // 2026-10-26 gap-audit build, A-7: gold COT positioning joins the
  // voters — the crowded-book gauge beside VIX and the stress pair.
  {
    id: 'market-stress',
    section: 'global',
    members: ['stress-stlfsi', 'nfci', 'vix', 'gold-silver', 'cftc-gold-positioning'],
  },
  // 2026-10-26 gap-audit build, A-3: the US−Japan 10y gap joins the
  // voters — the carry trade's fuel line beside USD/JPY.
  {
    id: 'dollar-strength',
    section: 'global',
    members: ['dollar-basket', 'usdjpy', 'us-japan-10y-gap'],
  },
  // Step-2 add-list §B3/§B4: US unemployment and the Sahm rule join the
  // growth-health voters, next to the US macro series already there.
  // Fix spec C-05 (2026-10-14): the Philadelphia Fed survey joins them.
  // OD-7 demotion (2026-10-23, D-42): m2-us left the voters — it is
  // context only now (the card keeps its year-on-year percentile; the
  // gauge counts the members below — the iron-ore precedent).
  // M4 Wave 1 (OD-8/D-42, 2026-10-24): the early-warning trio joins the
  // voters — weekly claims (the fastest labor read), the Chauvet recession
  // probability (scored at the 0.50 line) and Michigan sentiment (scored
  // on its 10-year low tail). sofr / us-2y / breakeven-10y stay context
  // (info rules — never voters; the iron-ore precedent), and
  // michigan-1y-expectations is companion-only.
  {
    id: 'growth-health',
    section: 'global',
    members: [
      'china-pmi',
      // M7 (2026-10-26): the China consumer-prices leg joins the voters —
      // scored at China's own "around 3%" target, the review's growth-health
      // China pair with the factory PMI.
      'china-cpi',
      'philly-fed',
      'initial-jobless-claims',
      // 2026-10-26 gap-audit build, A-8: the OECD CLI joins the voters —
      // the licensed-PMI replacement, the growth lane's leading edge
      // (the CN/DE companions stay context, one vote per family).
      'oecd-cli-us',
      'us-unemployment',
      'sahm-rule',
      'recession-probability',
      'michigan-sentiment',
      'copper-gold',
    ],
  },
  {
    id: 'au-inflation-rates',
    section: 'australia',
    // Step-2 add-list §B2: the AU 10-year yield is a scored rate (its
    // 10-year position), joining the CPI and gap voters.
    // Fix spec C-06 (2026-10-14): the RBA-expectations gap joins them.
    members: ['au-cpi', 'au-trimmed-mean', 'rba-expectations', 'au-10y', 'au-us-10y-gap'],
  },
  {
    id: 'au-households',
    section: 'australia',
    // M6 Wave 3 (OD-8/D-42, 2026-10-25): au-housing-finance joins the
    // voters — the mortgage pipeline, scored on year-on-year growth (the
    // au-home-values discipline). au-saving-ratio / au-job-vacancies stay
    // context (info rules — never voters; the iron-ore precedent).
    members: [
      'au-home-loan',
      'au-wage-growth',
      'au-rent-yoy',
      'au-household-debt-arrears',
      'au-unemployment',
      'au-home-values',
      'au-housing-finance',
    ],
  },
  {
    id: 'au-trade-currency',
    section: 'australia',
    // Step-2 add-list §B6: iron ore left the voters — it is context only
    // now (the card says so; the au-trade gauge counts only the FX and
    // terms-of-trade members).
    // 2026-10-26 gap-audit build, A-5: the RBA−Fed policy-rate gap joins
    // the voters — the short-rate carry leg beside audusd.
    members: ['audusd', 'rba-fed-gap', 'audjpy', 'terms-of-trade'],
  },
  // gap-closure S4-M4.3 (2026-11-01): the geopolitics/supply lane — "Is
  // the world getting more fragmented?". A SHADOW gauge (G-5): every
  // member is context-only until S6 promotes them, so votingCount is
  // always 0, the step stays 0 (excluded from sectionVerdictStep by
  // design — the global summary counts are unchanged), and the lane
  // header reads the "not scored yet" words (isShadowGauge + the UI copy).
  // The members list exists so the counts + the stale badge read the
  // lane's own membership.
  // gap-closure S4-M4.5 (2026-11-01): the lane's supply members join —
  // the GSCPI + the EIA SPR/production pair (all context-only, the same
  // G-5 shadow; the members list mirrors the group's definitions).
  {
    id: 'geo-fragmentation',
    section: 'global',
    members: [
      'chokepoint-suez',
      'chokepoint-panama',
      'chokepoint-bab-el-mandeb',
      'chokepoint-malacca',
      'chokepoint-taiwan',
      'gscpi',
      'us-spr',
      'us-crude-production',
    ],
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
  /** Members with a READING that is past its staleness window (S1-M1.4).
   * They never vote — and they never shrink the share's denominator:
   * a stale member dilutes (its silence can never make the gauge read
   * MORE severe than the fresh evidence supports). Unavailable members
   * (no reading at all) stay fully excluded — nothing exists to dilute
   * with. */
  staleCount: number;
}

const votable = (s: IndicatorReading['status']): boolean => s === 'warning' || s === 'normal';

/** gap-closure S4-M4.3 (2026-11-01): is this gauge a SHADOW gauge — every
 * member a context-only (info-rule) definition, pending S6's promotion
 * decision (G-5)? Such a gauge never claims a verdict: its header reads
 * "not scored yet" and the count line reads the context readings. Pure
 * (derived from the definitions table). */
export function isShadowGauge(gauge: GaugeDef): boolean {
  const memberSet = new Set(gauge.members as readonly string[]);
  const members = DEFINITIONS.filter((d) => memberSet.has(d.id));
  return members.length > 0 && members.every((d) => d.rule.kind === 'info');
}

/** One gauge's reading from the snapshot readings (pure). */
export function gaugeReading(
  gauge: GaugeDef,
  readings: readonly IndicatorReading[],
): GaugeReading {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  let votingCount = 0;
  let warningCount = 0;
  let staleCount = 0;
  for (const id of gauge.members) {
    const r = byId.get(id);
    if (!r) continue;
    if (r.status === 'stale') {
      // S1-M1.4: a stale member never votes, but it stays in the base so
      // its going silent cannot INFLATE the warning share (the old code
      // read 1 fresh warning + 1 stale member as 1/1 = 100% → step 4).
      staleCount += 1;
      continue;
    }
    if (!votable(r.status)) continue;
    votingCount += 1;
    if (r.status === 'warning') warningCount += 1;
  }
  const base = votingCount + staleCount;
  const share = base === 0 ? 0 : warningCount / base;
  let step: number;
  if (votingCount === 0) step = 0; // nothing fresh could vote — cannot read
  else if (share === 0) step = 1;
  else if (share <= 1 / 3) step = 2;
  else if (share <= 2 / 3) step = 3;
  else step = 4;
  return { gauge: gauge.id, section: gauge.section, step, votingCount, warningCount, staleCount };
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
  // S1-M1.4: the stale voters are NAMED, not just folded into the excluded
  // count — the API consumer (and the hero badge) can say exactly which
  // readings are out of date.
  let staleCount = 0;
  const staleVoters: IndicatorId[] = [];
  for (const id of memberIds) {
    const r = byId.get(id);
    if (!r) continue; // reading absent entirely (subset snapshot) — not counted
    if (r.status === 'stale') {
      staleCount += 1;
      staleVoters.push(id as IndicatorId);
      excludedCount += 1; // stale members are still excluded from voting
      continue;
    }
    if (votable(r.status)) {
      votingCount += 1;
      if (r.status === 'warning') warningCount += 1;
    } else {
      excludedCount += 1; // unavailable / no-history / check-pending (context members are never gauge members)
    }
  }
  const step = sectionVerdictStep(section, readings);
  return {
    section,
    label: labelForVerdictStep(step),
    warningCount,
    votingCount,
    excludedCount,
    staleCount,
    staleVoters,
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
