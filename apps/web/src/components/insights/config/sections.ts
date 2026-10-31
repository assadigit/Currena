/**
 * Section / group layout for the Insights page (Phase 3-c split of the
 * former config.ts monolith — see ./index.ts). Pure, platform-free.
 */

import type {
  IndicatorId,
  IndicatorReading,
  InsightsSection,
  IndicatorGroupId,
} from '@currena/core';
import { DEFINITIONS, GAUGES } from '@currena/insights';

/* ------------------------------------------------------------------ *
 * Section / group layout (the I15 question-group restructure)
 * ------------------------------------------------------------------ */

/** Page order: Global BEFORE Australia everywhere (round-2 decision D7/R1 —
 * the old Australia-first hero + swap setting retired). */
export const SECTION_ORDER: readonly InsightsSection[] = ['global', 'australia'];

/** Group order within each section (the gauge/lane order, GAUGES-first). */
export const GROUP_ORDER: Readonly<Record<InsightsSection, readonly IndicatorGroupId[]>> = {
  global: ['borrowing-costs', 'prices-heat', 'market-stress', 'dollar-strength', 'growth-health'],
  australia: ['au-inflation-rates', 'au-households', 'au-trade-currency'],
};

/**
 * R9-04 (2026-10-27 owner round — "merge 'Is the dollar strong?' into the
 * currencies section"): the LANE presentation order. The dollar-strength
 * question group no longer renders its own lane — its six cards join the
 * world currencies section (WorldCurrencies) as additional cards under a
 * sub-heading. GROUP_ORDER above stays the FULL gauge order (the R18
 * counting invariant + the hero's gauge names ride it); only the lane's
 * render follows LANE_GROUP_ORDER. The dollar-strength GAUGE itself is
 * untouched (packages/insights/src/gauges.ts): the hero count and every
 * step computation are unchanged.
 */
export const LANE_GROUP_ORDER: Readonly<Record<InsightsSection, readonly IndicatorGroupId[]>> = {
  global: ['borrowing-costs', 'prices-heat', 'market-stress', 'growth-health'],
  australia: ['au-inflation-rates', 'au-households', 'au-trade-currency'],
};

/**
 * R9-04: the dollar-strength ids that render inside the world currencies
 * section (3 voters + context rows, definition order = snapshot order).
 * 2026-10-29 owner round ("add dollar against UAE currency"): usdaed —
 * the pegged Gulf petro-currency — joins as a context row after usdtry.
 */
export const DOLLAR_STRENGTH_IDS: readonly IndicatorId[] = [
  'dollar-basket',
  'usdjpy',
  'us-japan-10y-gap',
  'eur-usd',
  'usdtry',
  'usdaed',
  'usdcny',
];

/**
 * R9-07 (2026-10-27 owner round — "special container for US-based
 * indicators that affect global markets"): the nine US-based (plus the
 * euro-area mirror) indicators pulled out of their lanes into ONE
 * dedicated container inside the Global section, with an analytical brief
 * generated from the live values. Their GAUGE memberships are untouched —
 * the borrowing-costs / prices-heat / market-stress steps still count
 * them; only the lane render moves.
 */
export const US_GLOBAL_REACH_IDS: readonly IndicatorId[] = [
  'real-yield-10y',
  'us10y',
  'us30y',
  'euro-hicp',
  'us-cpi-yoy',
  'us-pce-core-yoy',
  'walcl',
  'stress-stlfsi',
  'nfci',
];

/**
 * R9-04 + R9-07: ids rendered in a special container instead of their
 * lane group — the QuestionGroup filter skips them so no card renders
 * twice. (Companion-ONLY ids are separate — they always ride a parent.)
 * gap-closure S2-M2.4: nyfed-custody renders inside the "Who holds US
 * government debt" section (the ticSlot composition in Insights.tsx),
 * not in the borrowing-costs lane — one reading, one surface.
 */
export const HIDDEN_FROM_LANE_IDS: ReadonlySet<IndicatorId> = new Set<IndicatorId>([
  ...DOLLAR_STRENGTH_IDS,
  ...US_GLOBAL_REACH_IDS,
  'nyfed-custody',
]);

/**
 * R9-05 (2026-10-27 owner round — "consolidate ALL Australian indicators
 * into one container"): the Australia section's three lane groups render
 * as SUB-headed card groups inside the one Australia mother container
 * (the section heading + the hero's Australia verdict stay as-is). The
 * Global groups keep their full question headings.
 */
export const SUBHEADING_SECTIONS: ReadonlySet<InsightsSection> = new Set<InsightsSection>(['australia']);

/** The prices strip (round-2 R10): FOUR tiles. Order (financial-asset-cards
 * spec pack 02 §10): Gold → Silver → Oil → Bitcoin — the spec's default;
 * no user-configurable ordering exists in the app (verified 2026-10-17:
 * PricesBoard maps PRICE_ROWS filtered by readings; no persistence of
 * order), so the spec default applies. Copper and iron ore move into the
 * indicator lanes (copper's definition group is 'growth-health'; iron-ore
 * was always an au-trade-currency row). */
export const PRICE_ROWS: readonly IndicatorId[] = [
  'gold-usd',
  'silver-usd',
  'brent',
  'btc-usd',
];

/** The Bitcoin context ratio (Block PB2; silver-btc retired 2026-10-23, OD-7) + the gold row's AUD companion. */
export const BTC_RATIO_IDS: readonly IndicatorId[] = ['gold-btc'];

/**
 * Step-1 audit item A3: companion-only readings — carried in the payload and
 * rendered INSIDE another card (core CPI on the US inflation card), never as
 * their own row. The question-group filter skips them.
 */
export const COMPANION_ONLY_IDS: ReadonlySet<IndicatorId> = new Set<IndicatorId>([
  'us-cpi-core-yoy',
  // M4 Wave 1 (OD-8/D-42, 2026-10-24): the Michigan survey's 1y inflation
  // expectations ride inside the michigan-sentiment card.
  'michigan-1y-expectations',
]);

/**
 * Step-2 add-list §B2: companion lines rendered INSIDE a parent card — a
 * full card of its own in another group can still ride along for comparison
 * (the AU 10-year card carries the US 10-year yield beside it; the US number
 * keeps its own card in borrowing-costs — one reading, two surfaces, no
 * possible disagreement). Companion-ONLY ids (COMPANION_ONLY_IDS) render
 * nowhere else; shared ids keep their own card too.
 */
export const COMPANIONS: Readonly<Partial<Record<IndicatorId, readonly IndicatorId[]>>> = {
  'us-cpi-yoy': ['us-cpi-core-yoy'],
  'au-10y': ['us10y'],
  // M4 Wave 1 (OD-8/D-42, 2026-10-24): the sentiment card carries its
  // survey's 1y inflation-expectations companion (the review's §5.1 row:
  // "carries the 1y expectations leg (FRED MICH, verified 4.2%)").
  'michigan-sentiment': ['michigan-1y-expectations'],
};

/** The parent card a companion belongs to, or null when it rides nowhere. */
export function companionParentOf(id: IndicatorId): IndicatorId | null {
  for (const [parent, companions] of Object.entries(COMPANIONS) as [IndicatorId, readonly IndicatorId[]][]) {
    if (companions.includes(id)) return parent;
  }
  return null;
}

/**
 * Step-2 add-list §B5: ids whose card ALWAYS shows the 10-year position bar
 * (the VIX card's interim presentation — "the value and its 10-year
 * position" — before the Step-3 verdict rules fix the calm/nervous words).
 * gap-closure S2-M2.4: the weekly custody card joins — the spec's
 * "standard indicator card with 10-year position".
 */
export const ALWAYS_POSITION_IDS: ReadonlySet<IndicatorId> = new Set<IndicatorId>([
  'vix',
  'nyfed-custody',
]);

export function definitionsForGroup(
  section: InsightsSection,
  group: IndicatorGroupId,
): typeof DEFINITIONS {
  return DEFINITIONS.filter((d) => d.section === section && d.group === group);
}

export function definitionFor(id: IndicatorId): (typeof DEFINITIONS)[number] {
  const def = DEFINITIONS.find((d) => d.id === id);
  if (!def) throw new Error(`insights: no definition for '${id}'`);
  return def;
}

/** Per-group status line counts: voters, alerts, excluded within one group.
 *  Fix spec B-14 (2026-10-14): the counts follow the GAUGE membership (the
 *  area's scored list — oil counts in prices-heat while its card renders on
 *  the prices strip), so the area counts, the hero count and the summary all
 *  describe the same list.
 */
export function groupCounts(
  readings: readonly IndicatorReading[],
  section: InsightsSection,
  group: IndicatorGroupId,
): { alertCount: number; votingCount: number; excludedCount: number } {
  const gauge = GAUGES.find((g) => g.id === group && g.section === section);
  const ids = new Set<IndicatorId>(
    gauge ? gauge.members : definitionsForGroup(section, group).map((d) => d.id),
  );
  let alertCount = 0;
  let votingCount = 0;
  let excludedCount = 0;
  for (const r of readings) {
    if (!ids.has(r.id)) continue;
    if (r.status === 'warning' || r.status === 'normal') {
      votingCount += 1;
      if (r.status === 'warning') alertCount += 1;
    } else if (r.status === 'stale' || r.status === 'no-history' || r.status === 'check-pending' || r.status === 'unavailable') {
      excludedCount += 1;
    }
  }
  return { alertCount, votingCount, excludedCount };
}
