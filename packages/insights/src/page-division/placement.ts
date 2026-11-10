/**
 * The page-division placement table (S2, 2026-11-08).
 *
 * THE CONTRACT BETWEEN ENGINE AND PAGES: which registry indicator's
 * detail-card home is which destination page, which readings each page
 * mirrors (shared verdict displays), and which boards each page consumes.
 * Source of truth: docs/page-division/02-PAGE-DIVISION-SPEC.md §4–§14
 * (the §14 placement rules) + the decision record D-1…D-48
 * (03-STRATEGY-LOG.md §5).
 *
 * Three properties, by construction:
 *
 *  1. **Typed membership.** Every id is an `IndicatorId` — a typo is a
 *     typecheck error, not a runtime surprise.
 *  2. **Engine-derived mirrors.** The mirror-input sets (gauge voters for
 *     verdict tiles, the gold meter's 37 voters for seat chips, the AU
 *     gauges' moved-out seats) are DERIVED from the engine's own tables —
 *     `GAUGES` + `GOLD_LANE_VOTERS` — never hand-copied, so an engine
 *     membership change surfaces here as visible drift against the
 *     committed PLACEMENT.generated.md (regenerate + review, never
 *     silently absorb).
 *  3. **One home per card (spec §3.2).** Homes are hand-encoded from the
 *     spec's §14 lists (the spec's intent); `reconcilePlacement` proves
 *     them against `data/indicators.json` — every registry id placed
 *     exactly once, zero unplaced, zero duplicates — and reports drift as
 *     audit findings (record, never silently fix — Agent Rule 5).
 *
 * The display layer keeps its side of the separation (spec §3.3): gauge
 * membership, the gold voter table, thresholds and calibration are
 * untouched; this module only decides WHERE things are shown.
 *
 * Pure, platform-free (AGENTS.md rule 2): the API routes, the SPA's page
 * chunks and the PLACEMENT.generated.md generator all import this one
 * module, so the three cannot drift.
 */

import type { BoardAttachmentId, IndicatorId, PageDivisionPageId } from '@currena/core';
import { GAUGES } from '../gauges';
import { GOLD_LANE_VOTERS } from '../gold-score';

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

/** One registry group of detail cards on a page (the page's section). */
export interface PlacementGroup {
  /** Stable group id — doc anchor + the SPA's section key (copy via i18n). */
  id: string;
  /** Registry ids whose detail-card HOME is this group, in spec order. */
  ids: readonly IndicatorId[];
  /** The decision-record entries this group traces to (§5 of the log). */
  decisions: string;
  /**
   * Honest note printed in the generated table (board-only sections,
   * pending fills, owner-ratification flags — the fail-closed voice).
   */
  note?: string;
}

/** One page destination's placement (spec §4–§12 + §14 row). */
export interface PagePlacement {
  page: PageDivisionPageId;
  /** The page's registry groups (detail-card homes), in page order. */
  groups: readonly PlacementGroup[];
  /**
   * Mirror-input readings (spec §3.2): ids whose HOME is elsewhere but
   * whose readings this page needs to render shared verdict displays —
   * gauge-verdict tiles, gold seat chips, the prices ribbon. Derived from
   * the engine tables above; NEVER includes a home id of this page.
   */
  mirrors: readonly IndicatorId[];
  /** The existing board endpoints this page consumes (§14's boards). */
  boards: readonly BoardAttachmentId[];
  /** The decision-record entries this page traces to. */
  decisions: string;
}

/**
 * A registry id that is NOT a detail card anywhere: blocked with a visible
 * note on its natural page (spec §16 — displayed honestly, never hidden).
 */
export interface BlockedNote {
  id: IndicatorId;
  page: PageDivisionPageId;
  /** The §16 row's reason, in substance. */
  why: string;
}

/* ------------------------------------------------------------------ *
 * Engine-derived membership (the mirror sources — never hand-copied)
 * ------------------------------------------------------------------ */

/** The 5 thematic global gauges (spec §4's tiles ②–⑥; D-21). Exported since
 *  S3: the Global page's verdict-board tiles derive their gauge list from
 *  this engine-side constant (never a hand-copied duplicate). */
export const THEMATIC_GAUGE_IDS = ['borrowing-costs', 'prices-heat', 'market-stress', 'dollar-strength', 'growth-health'] as const;

/**
 * The thematic gauges' scored members — Global's five gauge-verdict tiles
 * (D-21) and the USA page's D-30 verdict strip both re-derive their
 * verdicts from these readings client-side (the same pure gauges.ts).
 */
export const THEMATIC_GAUGE_MEMBER_IDS: readonly IndicatorId[] = [
  ...new Set(
    GAUGES.filter((g) => (THEMATIC_GAUGE_IDS as readonly string[]).includes(g.id)).flatMap((g) => [...g.members]),
  ),
];

/** The gold meter's 37 voters (gold-score.ts) — Gold's seat chips + Global's Gold Balance tile. */
export const GOLD_VOTER_IDS: readonly IndicatorId[] = GOLD_LANE_VOTERS.map((v) => v.id);

/** The AU gauges' members (3 voting + 2 shadow) — the AU page's seat-chip mirrors (D-37). */
export const AU_GAUGE_MEMBER_IDS: readonly IndicatorId[] = [
  ...new Set(GAUGES.filter((g) => g.section === 'australia').flatMap((g) => [...g.members])),
];

/** Dedupe an id list against a set, preserving order. */
const minus = (ids: readonly IndicatorId[], remove: ReadonlySet<IndicatorId>): IndicatorId[] =>
  ids.filter((id) => !remove.has(id));

/** Union two ordered lists, deduped, first-list order. */
const union = (a: readonly IndicatorId[], b: readonly IndicatorId[]): IndicatorId[] => [...new Set([...a, ...b])];

/** A group list's id set (for the mirror derivations). */
const idSet = (groups: readonly PlacementGroup[]): ReadonlySet<IndicatorId> =>
  new Set(groups.flatMap((g) => [...g.ids]));

/* ------------------------------------------------------------------ *
 * Per-page groups — spec §14's lists, hand-encoded (the spec's intent)
 * ------------------------------------------------------------------ */

/** Gold's blocked notes (spec §16 — shown as notes on the Gold page, never as cards). */
export const BLOCKED_NOTES: readonly BlockedNote[] = [
  {
    id: 'wgc-etf-holdings',
    page: 'gold',
    why: 'WGC licence class (L3): needs prior written authorisation — the draft is the owner\'s lever (docs/insights/LICENCES.md).',
  },
  { id: 'wgc-cb-demand', page: 'gold', why: 'WGC licence class (L3): same authorisation gate as wgc-etf-holdings.' },
  { id: 'official-gold-demand', page: 'gold', why: 'PBoC English URL 404 — venue re-find pending (fail closed until then).' },
  { id: 'etf-short-interest', page: 'gold', why: 'No licence-clean venue for ETF short interest.' },
];

const GOLD_GROUPS: readonly PlacementGroup[] = [
  {
    id: 'ratios',
    ids: ['gold-usd', 'gold-silver', 'gold-btc', 'gold-aud', 'gold-oil-ratio', 'gold-platinum', 'real-gold-price', 'copper-gold', 'gold-equities-ratio'],
    decisions: 'D-5 · D-27',
    note: 'gold-usd is the hero card (live hourly overlay via the serve-time prices merge).',
  },
  {
    id: 'flows-positioning',
    ids: ['cftc-gold-positioning', 'cftc-gold-gross-long', 'sge-gold-withdrawals', 'swiss-gold-flow', 'shanghai-gold-premium'],
    decisions: 'D-5 · D-26',
    note: 'shanghai-gold-premium stays context-only — never a voter (§16).',
  },
];

const WORLD_MARKETS_GROUPS: readonly PlacementGroup[] = [
  {
    id: 'world-risk',
    ids: ['gpr-index', 'gpr-threats', 'gpr-acts', 'gpr-daily', 'gpr-russia', 'gpr-ukraine', 'gpr-israel', 'gpr-saudi', 'global-liquidity'],
    decisions: 'D-13 · D-43 · D-47',
  },
];

const USA_GROUPS: readonly PlacementGroup[] = [
  {
    id: 'tier-1-world-watches',
    ids: ['fed-target', 'fed-expectations', 'us-cpi-yoy', 'us-pce-core-yoy', 'us-nfp', 'us-unemployment', 'us10y'],
    decisions: 'D-14 · D-29',
    note: 'The seven numbers the planet reacts to first (D-29; the F9↔F12 reconciliation moved dollar-basket to Currency Pairs by D-32).',
  },
  {
    id: 'tier-2-rates-fed',
    ids: ['yield-curve-10y2y', 'yield-curve-10y3m', 'real-yield-10y', 'real-yield-5y', 'real-curve-10y5y', 'us30y', 'us-2y', 'sofr', 'mortgage-30y', 'nyfed-custody', 'us-deficit-monthly', 'us-deficit-12m', 'treasury-auction-10y', 'treasury-auction-10y-indirect', 'treasury-auction-30y', 'treasury-auction-30y-indirect', 'rstar-us', 'debt-to-gdp', 'govt-interest-revenue'],
    decisions: 'D-14',
    note: 'Spec §7 labels this tier "(22)" while listing 19 ids — AF-2 in the audit findings.',
  },
  {
    id: 'tier-3-inflation',
    ids: ['us-cpi-core-yoy', 'median-cpi', 'sticky-cpi', 'us-wages', 't5yie', 'breakeven-5y5y', 'breakeven-10y', 'breakeven-tilt', 'cpi-nowcast', 'cpi-surprise', 'michigan-5y-expectations', 'michigan-1y-expectations'],
    decisions: 'D-14',
    note: 'michigan-1y-expectations is AF-3: absent from every spec §7/§14 list (the 184th id) — placed here beside its 5y twin per evident intent; OWNER RATIFICATION PENDING.',
  },
  {
    id: 'tier-4-labor-growth',
    ids: ['initial-jobless-claims', 'continuing-claims', 'job-openings', 'sahm-rule', 'recession-probability', 'michigan-sentiment', 'oecd-cli-us', 'philly-fed', 'empire-state', 'cfnai', 'gdpnow', 'us-gdp-growth', 'retail-sales', 'housing-permits', 'epu-us', 'tpu-us', 'm2-us'],
    decisions: 'D-14',
    note: 'Spec §7 labels this tier "(19)" while listing 17 ids — AF-2.',
  },
  {
    id: 'tier-5-liquidity-stress-valuation',
    ids: ['walcl', 'tga', 'reverse-repo', 'bank-reserves', 'repo-stress', 'net-liquidity', 'stress-stlfsi', 'nfci', 'vix', 'bank-stress', 'ebp', 'ofr-fsi', 'sloos-ci-tightening', 'term-premium-10y', 'shiller-cape', 'shiller-ecy', 'sp500-breadth-ratio'],
    decisions: 'D-14',
  },
];

const EUROPE_GROUPS: readonly PlacementGroup[] = [
  {
    id: 'eu-members',
    ids: ['ecb-dfr', 'euro-hicp', 'euro-aaa-10y', 'bund-10y', 'btp-bund-spread', 'oecd-cli-de'],
    decisions: 'D-15 · D-33',
    note: '+ the §15 FRED-only fills (D-34: euro-area unemployment · industrial production · ECB-SDMX liquidity) are verified-pending-ingest — S12 attempted live verification against the publisher (Rule 5) but FRED serves a JS challenge to the dev sandbox and the ECB M3 SDMX key needs the dimension walk the production adapter does; NO fill ingested unverified. The candidates + the verification status are recorded in DECISIONS.md (BD-S12a) for the next session to verify from production egress + ingest.',
  },
  {
    id: 'non-eu-uk',
    ids: ['gilt-10y', 'boe-rate'],
    decisions: 'D-17 · D-33',
    note: 'FTSE rides the markets board (the Europe zoom map).',
  },
];

const ASIA_GROUPS: readonly PlacementGroup[] = [
  {
    id: 'china',
    ids: ['china-pmi', 'china-cpi', 'oecd-cli-cn', 'gpr-china', 'gpr-taiwan', 'china-property-investment', 'china-steel-output'],
    decisions: 'D-35',
    note: 'china-property-investment + china-steel-output moved in from the AU page (D-35); SGE links point to /gold.',
  },
  {
    id: 'japan',
    ids: ['jgb-10y', 'boj-rate', 'japan-cpi'],
    decisions: 'D-35 · D-36',
    note: '+ the Japan CPI fill (D-36) LANDED in the S25 fill session (BD-S23a): the IMF SDMX 3.0 CPI dataflow card — verified live at both venues + against the Statistics Bureau’s own release, the FRED OECD mirror family is DEAD (BD-S14a).',
  },
  {
    id: 'korea-taiwan-hk',
    ids: ['korea-cpi'],
    decisions: 'D-35 · D-36',
    note: 'KOSPI · TAIEX · HSI ride the markets board (the Asia zoom map); the Korea CPI fill (D-36) LANDED in the S25 fill session (BD-S23a) — the IMF SDMX 3.0 CPI dataflow card, verified against KOSTAT’s own October release.',
  },
  {
    id: 'india',
    ids: ['india-cpi'],
    decisions: 'D-35 · D-36',
    note: 'NIFTY50 rides the markets board (the Asia zoom map); the India CPI fill (D-36) LANDED in the S25 fill session (BD-S23a) — the IMF SDMX 3.0 CPI dataflow card, verified against MoSPI’s own July press note (the mirror lags MoSPI by 1–3 months, labelled).',
  },
  {
    id: 'pacific-nz',
    ids: ['nz-short-rate', 'nz-10y'],
    decisions: 'D-17 · D-35',
    note: 'New Zealand lives here (D-17); NZX50 rides the AU Markets board — the S21 Pacific—NZ mirror card renders its row here (BD-S21b), and the board\'s home is /australia.',
  },
];

const AUSTRALIA_GROUPS: readonly PlacementGroup[] = [
  {
    id: 'au-inflation-rates',
    ids: ['au-cpi', 'au-trimmed-mean', 'rba-expectations', 'au-10y', 'au-us-10y-gap', 'au-petrol-yoy'],
    decisions: 'D-6 · D-37',
  },
  {
    id: 'au-households',
    ids: ['au-home-loan', 'au-wage-growth', 'au-rent-yoy', 'au-household-debt-arrears', 'au-unemployment', 'au-home-values', 'au-housing-finance', 'rba-cash-rate', 'au-deposit-rate', 'au-saving-ratio', 'au-job-vacancies'],
    decisions: 'D-6 · D-37',
  },
  {
    id: 'au-trade-currency',
    ids: ['rba-fed-gap', 'terms-of-trade'],
    decisions: 'D-37',
    note: 'audusd · audjpy (and the context cards iron-ore · coal-aus · lng-japan · china-property-investment · china-steel-output · gold-aud) moved out per D-32/D-19/D-35/D-27 — their gauge seat chips remain (mirrors below).',
  },
  {
    id: 'au-external',
    ids: ['au-trade-balance'],
    decisions: 'D-37',
    note: 'audnzd · nz-short-rate · nz-10y moved out (D-17/D-35/D-42); seat chips remain.',
  },
  {
    id: 'au-activity',
    ids: ['au-gdp-growth', 'au-household-spending', 'au-building-approvals', 'au-population-growth', 'au-participation', 'au-underemployment', 'au-nom'],
    decisions: 'D-37',
  },
  {
    id: 'au-world-risk',
    ids: ['gpr-australia'],
    decisions: 'D-6',
    note: 'AF-4: a GLOBAL-section registry id whose page home is Australia (the GPR-family wrap-up note 5) — placement is display-layer; the registry section is engine-side.',
  },
];

const COMMODITIES_GROUPS: readonly PlacementGroup[] = [
  {
    id: 'energy',
    ids: ['brent', 'wti', 'natgas', 'gas-europe', 'lng-japan', 'coal-aus', 'eia-crude-stocks', 'us-spr', 'us-crude-production'],
    decisions: 'D-2 · D-38',
    note: 'brent (with gold · silver · BTC) carries the live hourly overlay via the serve-time prices merge.',
  },
  {
    id: 'metals',
    ids: ['silver-usd', 'platinum', 'copper-usd', 'iron-ore'],
    decisions: 'D-19 · D-27 · D-38',
    note: 'Commodity PRICES only — their gold ratios stay on /gold (D-27).',
  },
  {
    id: 'agriculture',
    ids: ['food-index', 'wheat', 'maize'],
    decisions: 'D-2 · D-38',
  },
  {
    id: 'digital',
    ids: ['btc-usd', 'crypto-fng'],
    decisions: 'D-28 · D-38 · D-40',
    note: 'BTC also rides the Global ribbon (D-22); gold-btc stays on /gold (D-27).',
  },
  {
    id: 'trade-routes-supply',
    ids: ['chokepoint-suez', 'chokepoint-panama', 'chokepoint-bab-el-mandeb', 'chokepoint-malacca', 'chokepoint-taiwan', 'gscpi'],
    decisions: 'D-39',
  },
];

const CURRENCIES_GROUPS: readonly PlacementGroup[] = [
  {
    id: 'dollar-standing',
    ids: ['dollar-basket', 'dollar-broad', 'dollar-eme', 'us-japan-10y-gap', 'usdtry', 'usdaed', 'usd-reserve-share'],
    decisions: 'D-32',
    note: 'The dollar-strength verdict tops the USA page (D-30) — its detail cards live HERE (verdicts mirror; detail cards don\'t).',
  },
  {
    id: 'pairs',
    ids: ['usdjpy', 'eur-usd', 'usdchf', 'usdcny', 'audusd', 'audjpy', 'audnzd'],
    decisions: 'D-18 · D-32 · D-42',
    note: 'Registry pair cards; the 11-pair BOARD (incl. AUDNZD, D-42) rides the fx snapshot. Gold crosses stay on /gold (D-18).',
  },
];

/* ------------------------------------------------------------------ *
 * The placement table (mirrors derived from the engine tables)
 * ------------------------------------------------------------------ */

/**
 * The 9 destinations (spec §2/§4–§12; order = the §2 table). Global has
 * ZERO registry cards by design (D-7/D-11: verdict board only, mirrors
 * link out); legacy `/insights` is not a placement destination — it keeps
 * the full snapshot.
 */
export const PAGE_PLACEMENTS: readonly PagePlacement[] = [
  {
    // D-22's ribbon reads gold-usd · brent · btc-usd (brent arrives as a
    // prices-heat voter; gold-usd + btc-usd are added as ribbon inputs);
    // D-25's dedollar tile reads usd-reserve-share + nyfed-custody (both
    // gold voters); the FX Lights + World Markets tiles ride the boards.
    page: 'global',
    groups: [],
    mirrors: union(union(THEMATIC_GAUGE_MEMBER_IDS, GOLD_VOTER_IDS), ['gold-usd', 'btc-usd']),
    boards: ['markets', 'fx'],
    decisions: 'D-4 · D-7 · D-10 · D-11 · D-21…D-25',
  },
  {
    page: 'gold',
    groups: GOLD_GROUPS,
    mirrors: minus(GOLD_VOTER_IDS, idSet(GOLD_GROUPS)),
    boards: [],
    decisions: 'D-5 · D-26…D-29',
  },
  {
    page: 'world-markets',
    groups: WORLD_MARKETS_GROUPS,
    mirrors: [],
    boards: ['markets'],
    decisions: 'D-13 · D-43 · D-47',
  },
  {
    // D-30: the five thematic gauge verdicts top the page — their voter
    // readings arrive as mirrors (the non-USA voters: ecb-dfr · euro-hicp
    // · brent · gold-silver · cftc pair · china-pmi · china-cpi ·
    // copper-gold …).
    page: 'usa',
    groups: USA_GROUPS,
    mirrors: minus(THEMATIC_GAUGE_MEMBER_IDS, idSet(USA_GROUPS)),
    boards: ['markets', 'tic'],
    decisions: 'D-14 · D-29…D-32 · D-44',
  },
  {
    page: 'europe',
    groups: EUROPE_GROUPS,
    mirrors: [],
    boards: ['markets'],
    decisions: 'D-15 · D-33 · D-34',
  },
  {
    page: 'asia-pacific',
    groups: ASIA_GROUPS,
    mirrors: [],
    boards: ['markets'],
    decisions: 'D-16 · D-17 · D-35 · D-36',
  },
  {
    // D-37: the AU gauges keep their moved-out members as seat chips —
    // the engine's AU gauge members minus the 28 homes (audusd · audjpy ·
    // audnzd · nz-short-rate · nz-10y) arrive as mirrors.
    page: 'australia',
    groups: AUSTRALIA_GROUPS,
    mirrors: minus(AU_GAUGE_MEMBER_IDS, idSet(AUSTRALIA_GROUPS)),
    boards: ['markets-au'],
    decisions: 'D-6 · D-37',
  },
  {
    page: 'commodities',
    groups: COMMODITIES_GROUPS,
    mirrors: [],
    boards: [],
    decisions: 'D-2 · D-19 · D-38…D-40',
  },
  {
    page: 'currencies',
    groups: CURRENCIES_GROUPS,
    mirrors: [],
    boards: ['fx'],
    decisions: 'D-18 · D-32 · D-41 · D-42',
  },
];

/* ------------------------------------------------------------------ *
 * Lookups + the reconciliation
 * ------------------------------------------------------------------ */

/** Fast lookup by page id. */
export const PAGE_PLACEMENTS_BY_PAGE: ReadonlyMap<PageDivisionPageId, PagePlacement> = new Map(
  PAGE_PLACEMENTS.map((p) => [p.page, p]),
);

/**
 * The page whose detail-card home holds this registry id — the seat-chip
 * link target (page-division S5, 2026-11-08 — 03-STRATEGY-LOG §7 wrap-up
 * note 4: "Seat chips link to the seat's home page"). Derived from the
 * placement table itself, never hand-copied, so a placement change
 * re-points every seat chip automatically. Blocked ids count as their
 * page's placement (they ARE registry ids, spec §16). null = not a placed
 * id (a mirror-only id or a typo — the caller renders no link, fail-closed).
 */
export function homePageOfIndicator(id: IndicatorId): PageDivisionPageId | null {
  for (const placement of PAGE_PLACEMENTS) {
    if (pageHomeIds(placement.page).includes(id)) return placement.page;
  }
  const note = BLOCKED_NOTES.find((n) => n.id === id);
  return note !== undefined ? note.page : null;
}

/** A page's detail-card home ids (group order). */
export function pageHomeIds(page: PageDivisionPageId): readonly IndicatorId[] {
  return PAGE_PLACEMENTS_BY_PAGE.get(page)?.groups.flatMap((g) => [...g.ids]) ?? [];
}

/**
 * A page's NAMED placement group's ids (group order) — page-division S9
 * (2026-11-09): the USA page's tiers derive their card lists from the
 * placement table's own groups this way, never a hand-copied list (the S7
 * pageHomeIds('world-markets') discipline, per-group — a placement change
 * re-points every tier automatically and surfaces as visible drift in
 * PLACEMENT.generated.md). Unknown page or group id → empty (fail-closed:
 * the caller's TOTAL display/copy map turns a missing id into a typecheck
 * error long before an empty list could render).
 */
export function pageGroupIds(page: PageDivisionPageId, groupId: string): readonly IndicatorId[] {
  return PAGE_PLACEMENTS_BY_PAGE.get(page)?.groups.find((g) => g.id === groupId)?.ids ?? [];
}

/** A page's mirror-input ids (after pageHomeIds, deterministic order). */
export function pageMirrorIds(page: PageDivisionPageId): readonly IndicatorId[] {
  return PAGE_PLACEMENTS_BY_PAGE.get(page)?.mirrors ?? [];
}

/** The blocked-note ids attached to a page (spec §16 — Gold's quartet). */
export function pageBlockedIds(page: PageDivisionPageId): readonly IndicatorId[] {
  return BLOCKED_NOTES.filter((n) => n.page === page).map((n) => n.id);
}

/**
 * A page's full reading set — homes, then mirrors, then blocked notes,
 * each id at most once (mirrors are engine-derived and provably disjoint
 * from homes; a future accidental overlap is caught by
 * reconcilePlacement as a red finding). The blocked ids ride too: in
 * private mode they arrive as their honest (unavailable) readings; in
 * public mode the licence-hidden quartet is REPORTED in the projection's
 * absentIds — the Gold page's notes, never a guess.
 */
export function pageReadingIds(page: PageDivisionPageId): readonly IndicatorId[] {
  return [...pageHomeIds(page), ...pageMirrorIds(page), ...pageBlockedIds(page)];
}

/** Every home id across all pages (the §14 count basis, blocked notes included via reconcile). */
export function allPlacedHomeIds(): readonly IndicatorId[] {
  return PAGE_PLACEMENTS.flatMap((p) => [...pageHomeIds(p.page)]);
}

/** One recorded audit finding (drift — recorded, never silently fixed). */
export interface PlacementFinding {
  /** Stable finding id (AF-n) — cited by tests, docs and hand-offs. */
  id: string;
  severity: 'red' | 'amber' | 'info';
  text: string;
}

/**
 * The STATIC audit findings — the spec's own drift against the registry
 * and the engine, recorded at S2 generation time (2026-11-08). Dynamic
 * drift (unknown/duplicate/unplaced) is computed by reconcilePlacement;
 * these are the hand-count defects found while encoding §14.
 */
export const PLACEMENT_AUDIT_FINDINGS: readonly PlacementFinding[] = [
  {
    id: 'AF-1',
    severity: 'amber',
    text: 'Spec §2\'s count line "~72 + 13 + 9 + 8 + 11 + 28 + 24 + 14 = 184" sums to 179, and §2\'s table says Gold has 13 cards while §5/§14 list 14 (gold-usd included). The authoritative arithmetic: 14 + 4 blocked + 9 + 72 + 8 + 11 + 28 + 24 + 14 = 184. This table is the authority (spec §14: "the lists below are the spec\'s intent; the generator reconciles").',
  },
  {
    id: 'AF-2',
    severity: 'amber',
    text: 'Spec §7\'s tier labels hand-count drift from their own lists: tier 2 says "(22)" but lists 19 ids; tier 3 says "(13)" but lists 11 (+1 with AF-3 = 12); tier 4 says "(19)" but lists 17. Tiers 1 (7) and 5 (17) match their lists. Recorded, not corrected in the spec.',
  },
  {
    id: 'AF-3',
    severity: 'amber',
    text: 'michigan-1y-expectations (registry id · prices-heat group · the gold meter\'s inflation-lane voter I3) is absent from every §7/§14 list — the 184th id. The generator places it in USA tier-3 (Inflation) beside michigan-5y-expectations per evident intent. OWNER RATIFICATION PENDING (same pattern as S1\'s /converter decision).',
  },
  {
    id: 'AF-4',
    severity: 'info',
    text: 'gpr-australia: counted in the AU page\'s 28 homes (§10) while the registry carries it in the GLOBAL section (geo-fragmentation group). Both are true at their layers — placement is display-layer (D-6 + the GPR-family wrap-up note 5); the registry area is engine-side (spec §3.3). No action.',
  },
  {
    id: 'AF-5',
    severity: 'info',
    text: 'Spec §10\'s gauge numbers (au-inflation-rates 6 · au-households 11 · au-trade-currency 10 · au-activity 7 · au-external 4 = 38) are the registry DISPLAY-group counts; the engine\'s scored AU gauge voters are 26 (5 · 7 · 4 · 6 · 4). Both true at their layers — the page renders registry groups; the gauge verdicts score the engine\'s voters. Recorded so neither gets "fixed" into the other.',
  },
  {
    id: 'AF-6',
    severity: 'info',
    text: 'S21 spec audit (2026-11-12): spec §6 item 2 lists the Asia grid as "N225 · KOSPI · HSI · SSEC · TAIEX · NIFTY50" (6) while its own §6 hero requires 16 map indices — the three grid lists total 15, missing ASX200. The world-board registry is the authority (16 = Asia-Pacific 7 [incl. ASX200] · Europe 4 · Americas 5, the engine\'s own MARKETS table); the /world-markets Asia grid renders the registry\'s 7, heading "Asia-Pacific". Spec-side hand-list drift, the AF-2 class — recorded, not corrected in the spec.',
  },
  {
    id: 'AF-7',
    severity: 'info',
    text: 'S21 spec audit (2026-11-12): spec §10 item 1 says the AU Markets board is "19 symbols: … 10 ASX-200 sectors …" — but 2 broad + 10 sectors + 4 banks + VIX + NZX50 sums to 18, not its own 19. The board carries ELEVEN ASX 200 GICS sector rows (markets-au/definitions.ts, self-described "the eleven ASX 200 GICS sector indices") and totals 19 ✓. The "10" is a spec typo — the code is right; recorded so nobody "fixes" the board to match the typo.',
  },
  {
    id: 'AF-8',
    severity: 'info',
    text: 'S25 fill session (2026-11-12, BD-S23a): spec §15\'s three D-36 Asia fills name the "FRED OECD mirror family" as the candidate source — that family is DEAD (verified stale/discontinued live in S14, BD-S14a: JPNCPIALLMINMEI + CPALTT01JPM659N end 2021-06; the KR pair ends 2023-11; the IN pair ends 2025-03 — never re-try those ids). The fills LANDED from the IMF\'s own SDMX 3.0 CPI dataflow instead (Rule 5 verified at both venues + against the national bureaus — Japan\'s Statistics Bureau, KOSTAT, MoSPI, and the World Bank annual cross-check), the "fresh FRED/IMF IFS series" option the roadmap recorded. The spec §15 table (and §9\'s "+ fill" notes naming it) rides the spec-v2 pass — recorded here, never silently edited.',
  },
];

/** The reconciliation verdict over a registry's id list. */
export interface PlacementReconciliation {
  /** False = structural red (unknown/duplicate/unplaced/mirror-overlap) — the generator exits non-zero. */
  ok: boolean;
  placedCount: number;
  unplaced: string[];
  unknownIds: string[];
  duplicateHomes: string[];
  mirrorOverlaps: string[];
  perPage: ReadonlyArray<{ page: PageDivisionPageId; registryCards: number; mirrorInputs: number }>;
}

/**
 * Reconcile the placement table against the live registry
 * (data/indicators.json's id list): every registry id placed exactly once
 * (blocked notes count as their page's placement — they ARE registry ids),
 * zero unplaced, zero duplicate homes, zero mirror/home overlaps. Drift is
 * RETURNED, never auto-fixed (Agent Rule 5) — the generator prints it and
 * the doc records it.
 */
export function reconcilePlacement(registryIds: readonly string[]): PlacementReconciliation {
  const registry = new Set(registryIds);
  const homeOf = new Map<string, PageDivisionPageId>();
  const unknownIds: string[] = [];
  const duplicateHomes: string[] = [];
  const mirrorOverlaps: string[] = [];

  for (const placement of PAGE_PLACEMENTS) {
    const homes = new Set<string>(pageHomeIds(placement.page));
    for (const id of homes) {
      if (!registry.has(id)) {
        if (!unknownIds.includes(id)) unknownIds.push(id);
        continue;
      }
      if (homeOf.has(id)) duplicateHomes.push(id);
      else homeOf.set(id, placement.page);
    }
    for (const id of placement.mirrors) {
      if (!registry.has(id) && !unknownIds.includes(id)) unknownIds.push(id);
      if (homes.has(id) && !mirrorOverlaps.includes(id)) mirrorOverlaps.push(id);
    }
  }
  for (const note of BLOCKED_NOTES) {
    if (!registry.has(note.id) && !unknownIds.includes(note.id)) unknownIds.push(note.id);
    if (homeOf.has(note.id)) duplicateHomes.push(note.id);
    else homeOf.set(note.id, note.page);
  }

  const unplaced = registryIds.filter((id) => !homeOf.has(id));

  return {
    ok: unknownIds.length === 0 && duplicateHomes.length === 0 && unplaced.length === 0 && mirrorOverlaps.length === 0,
    placedCount: homeOf.size,
    unplaced,
    unknownIds,
    duplicateHomes,
    mirrorOverlaps,
    perPage: PAGE_PLACEMENTS.map((p) => ({
      page: p.page,
      registryCards: pageHomeIds(p.page).length,
      mirrorInputs: p.mirrors.length,
    })),
  };
}
