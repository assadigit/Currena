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

/** Page order: Global only on /insights now — every Australian indicator has
 *  moved to the /australia page (the TM7 migration). The AU section, its
 *  five groups, the Australia hero verdict, the AustralianMarkets board and
 *  the MoneyPanel are all cut from /insights and live on /australia. */
export const SECTION_ORDER: readonly InsightsSection[] = ['global'];

/** Group order within each section (the gauge/lane order, GAUGES-first). */
export const GROUP_ORDER: Readonly<Record<InsightsSection, readonly IndicatorGroupId[]>> = {
  global: [
    'borrowing-costs',
    'prices-heat',
    'market-stress',
    'dollar-strength',
    'growth-health',
    // gap-closure S4-M4.3 (2026-11-01): the geopolitics/supply lane — a
    // shadow gauge until S6 (context-only members, "not scored yet").
    'geo-fragmentation',
    // gap-closure S6-M6.3 (2026-11-02): the de-dollarization/concentration
    // lane — a shadow gauge until S6 (context-only members, "not scored
    // yet" — the COFER reserve share + the S&P 500 breadth proxy).
    'dedollar-concentration',
  ],
  australia: [
    'au-inflation-rates',
    'au-households',
    'au-trade-currency',
    // gap-closure S5-M5.2 (2026-11-02): the two Australian shadow lanes —
    // "Is the economy growing?" and "How is Australia's trade and China
    // link?" (context-only members until S6, "not scored yet" headers).
    'au-activity',
    'au-external',
  ],
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
  global: ['borrowing-costs', 'prices-heat', 'market-stress', 'growth-health', 'geo-fragmentation', 'dedollar-concentration'],
  australia: ['au-inflation-rates', 'au-households', 'au-trade-currency', 'au-activity', 'au-external'],
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
 * TM7 (the Australia migration): every Australian-relevant indicator has
 * moved to the /australia page. The 38 ids whose registry section is
 * 'australia' + gpr-australia (global section, AU placement home) are
 * hidden from the /insights lane so no AU card renders here — they live
 * on /australia as home cards (28) or seat-chip links (11). The readings
 * still ride the full snapshot so the hero verdicts, gauge counts and
 * calendar targets that read AU ids keep working.
 */
export const AUSTRALIA_LANE_MOVED_IDS: readonly IndicatorId[] = [
  // au-inflation-rates
  'au-cpi', 'au-trimmed-mean', 'rba-expectations', 'au-10y', 'au-us-10y-gap', 'au-petrol-yoy',
  // au-households
  'rba-cash-rate', 'au-home-loan', 'au-deposit-rate', 'au-wage-growth', 'au-rent-yoy',
  'au-unemployment', 'au-home-values', 'au-household-debt-arrears', 'au-housing-finance',
  'au-saving-ratio', 'au-job-vacancies',
  // au-trade-currency
  'audusd', 'rba-fed-gap', 'audjpy', 'terms-of-trade', 'iron-ore',
  'china-property-investment', 'china-steel-output', 'gold-aud', 'coal-aus', 'lng-japan',
  // au-activity
  'au-gdp-growth', 'au-household-spending', 'au-building-approvals', 'au-population-growth',
  'au-nom', 'au-participation', 'au-underemployment',
  // au-external
  'au-trade-balance', 'audnzd', 'nz-short-rate', 'nz-10y',
  // global section, AU placement home (AF-4)
  'gpr-australia',
];

/**
 * TM10 (the USA migration): every USA-related indicator has moved to the
 * /usa page. The 72 ids whose placement home is /usa (all have registry
 * section 'global' but belong to the USA thematic tiers) are hidden from
 * the /insights lane so no USA card renders here — they live on /usa as
 * tier cards (5 tiers). The readings still ride the full snapshot so the
 * hero verdicts, gauge counts and calendar targets that read USA ids keep
 * working. (8 of these were already in US_GLOBAL_REACH_IDS + nyfed-custody
 * was already listed — the Set deduplicates.)
 */
export const USA_LANE_MOVED_IDS: readonly IndicatorId[] = [
  // tier-1-world-watches
  'fed-target', 'fed-expectations', 'us-cpi-yoy', 'us-pce-core-yoy', 'us-nfp', 'us-unemployment', 'us10y',
  // tier-2-rates-fed
  'yield-curve-10y2y', 'yield-curve-10y3m', 'real-yield-10y', 'real-yield-5y', 'real-curve-10y5y',
  'us30y', 'us-2y', 'sofr', 'mortgage-30y', 'nyfed-custody',
  'us-deficit-monthly', 'us-deficit-12m', 'treasury-auction-10y', 'treasury-auction-10y-indirect',
  'treasury-auction-30y', 'treasury-auction-30y-indirect', 'rstar-us', 'debt-to-gdp', 'govt-interest-revenue',
  // tier-3-inflation
  'us-cpi-core-yoy', 'median-cpi', 'sticky-cpi', 'us-wages', 't5yie',
  'breakeven-5y5y', 'breakeven-10y', 'breakeven-tilt', 'cpi-nowcast', 'cpi-surprise',
  'michigan-5y-expectations', 'michigan-1y-expectations',
  // tier-4-labor-growth
  'initial-jobless-claims', 'continuing-claims', 'job-openings', 'sahm-rule', 'recession-probability',
  'michigan-sentiment', 'oecd-cli-us', 'philly-fed', 'empire-state', 'cfnai',
  'gdpnow', 'us-gdp-growth', 'retail-sales', 'housing-permits', 'epu-us', 'tpu-us', 'm2-us',
  // tier-5-liquidity-stress-valuation
  'walcl', 'tga', 'reverse-repo', 'bank-reserves', 'repo-stress', 'net-liquidity',
  'stress-stlfsi', 'nfci', 'vix', 'bank-stress', 'ebp', 'ofr-fsi',
  'sloos-ci-tightening', 'term-premium-10y', 'shiller-cape', 'shiller-ecy', 'sp500-breadth-ratio',
];

/**
 * TM15 (the Europe migration): every Eurozone-related indicator has
 *  moved to the /europe page. The 8 ids whose placement home is /europe
 *  (6 EU-members + 2 non-EU-UK) are hidden from the /insights lane so no
 *  Europe card renders here — they live on /europe as tier cards (2
 *  sections: EU + UK). The readings still ride the full snapshot so the
 *  hero verdicts, gauge counts and calendar targets keep working. (euro-hicp
 *  was already in US_GLOBAL_REACH_IDS — the Set deduplicates.)
 */
export const EUROPE_LANE_MOVED_IDS: readonly IndicatorId[] = [
  // eu-members
  'ecb-dfr', 'euro-hicp', 'euro-aaa-10y', 'bund-10y', 'btp-bund-spread', 'oecd-cli-de',
  // non-eu-uk
  'gilt-10y', 'boe-rate',
];

/**
 * TM16 (the Asia + Gold + Reserve migration): the remaining indicators
 *  whose placement homes are /asia-pacific, /gold, or /currencies are
 *  hidden from the /insights lane. 5 Asia ids (jgb-10y, boj-rate,
 *  china-pmi, oecd-cli-cn, china-cpi), 2 Gold ids (cftc-gold-positioning,
 *  cftc-gold-gross-long), and 1 reserve-share id (usd-reserve-share, the
 *  dollar's share of world reserves — placement home /currencies, read by
 *  the USA page's dedollar tile). They live on their dedicated pages now.
 */
export const ASIA_GOLD_RESERVE_LANE_MOVED_IDS: readonly IndicatorId[] = [
  // Asia-Pacific (Japan + China)
  'jgb-10y', 'boj-rate', 'china-pmi', 'oecd-cli-cn', 'china-cpi',
  // Gold (CFTC positioning)
  'cftc-gold-positioning', 'cftc-gold-gross-long',
  // Dollar reserve share (placement home /currencies, read by /usa)
  'usd-reserve-share',
];

/**
 * R9-04 + R9-07: ids rendered in a special container instead of their
 * lane group — the QuestionGroup filter skips them so no card renders
 * twice. (Companion-ONLY ids are separate — they always ride a parent.)
 * TM7: the 39 AU ids moved to /australia.
 * TM10: the 72 USA ids moved to /usa.
 * TM15: the 8 Europe ids moved to /europe.
 * TM16: the 8 Asia/Gold/Reserve ids moved to /asia-pacific, /gold, /currencies.
 */
export const HIDDEN_FROM_LANE_IDS: ReadonlySet<IndicatorId> = new Set<IndicatorId>([
  ...DOLLAR_STRENGTH_IDS,
  ...US_GLOBAL_REACH_IDS,
  ...AUSTRALIA_LANE_MOVED_IDS,
  ...USA_LANE_MOVED_IDS,
  ...EUROPE_LANE_MOVED_IDS,
  ...ASIA_GOLD_RESERVE_LANE_MOVED_IDS,
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
  // gap-closure S3-M3.5 (2026-11-01): the fiscal and Treasury-supply
  // family's companions — the latest monthly deficit figure rides INSIDE
  // the us-deficit-12m card ("show the monthly figure too", the spec's
  // own wording), and each auction's indirect-bidder share rides INSIDE
  // its family's demand card (one card per auction: bid-to-cover + the
  // indirect share, with the auction date).
  'us-deficit-monthly',
  'treasury-auction-10y-indirect',
  'treasury-auction-30y-indirect',
  // gap-closure S5-M5.2 (2026-11-02): the population growth card carries
  // its migration flow companion — the net overseas migration quarter.
  'au-nom',
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
  // gap-closure S3-M3.5 (2026-11-01): the 12-month deficit card carries
  // its latest monthly figure; each auction demand card carries its
  // auction's indirect-bidder share.
  'us-deficit-12m': ['us-deficit-monthly'],
  'treasury-auction-10y': ['treasury-auction-10y-indirect'],
  'treasury-auction-30y': ['treasury-auction-30y-indirect'],
  // gap-closure S5-M5.2 (2026-11-02): the population growth card carries
  // the net overseas migration quarter (the spec's "secondary value").
  'au-population-growth': ['au-nom'],
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
