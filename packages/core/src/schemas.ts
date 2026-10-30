/**
 * Data contracts for the whole Currena monorepo — THE single source of truth
 * (AGENTS.md rule 3). Import these schemas/types; never redefine them.
 *
 * Consumers:
 *   - apps/api    — validates scraper output + shapes every JSON response
 *   - apps/web    — parses API responses, drives the UI type system
 *   - packages/scraper — normalizer output is validated against SnapshotSchema
 *
 * Everything crossing a trust boundary is zod-validated; an upstream layout
 * change must fail loudly, never render garbage.
 */

import { z } from 'zod';

/* ------------------------------------------------------------------ *
 * Sources
 * ------------------------------------------------------------------ */

/**
 * Where a number can come from.
 *
 * - `tgju` / `frankfurter` — live upstream sources (snapshot-level).
 * - `manual` — user-supplied custom rate (legacy "Manual" source parity).
 * - `local` — same-currency short-circuit and offline last-good snapshot
 *   markers (Gate 1 decision #5, 2026-09-16: same-currency conversions
 *   resolve locally with rate 1, no network).
 */
export const SourceSchema = z.enum(['tgju', 'frankfurter', 'manual', 'local']);
export type Source = z.infer<typeof SourceSchema>;

/** Sources that can back a *Snapshot* (upstream rate providers only). */
export const SnapshotSourceSchema = z.enum(['tgju', 'frankfurter']);
export type SnapshotSource = z.infer<typeof SnapshotSourceSchema>;

/**
 * Source that backs a currency pair (AGENTS.md rule 8 routing): either side
 * IRR/Toman → TGJU (open-market); international-only → Frankfurter. Never
 * fall IRR pairs back to the free API (interbank IRR ≠ open-market Toman).
 *
 * Lives in core so the API and every SPA route share ONE implementation.
 */
export function sourceForPair(from: string, to: string): SnapshotSource {
  return from === 'IRR' || to === 'IRR' ? 'tgju' : 'frankfurter';
}

/* ------------------------------------------------------------------ *
 * Rate & Snapshot
 * ------------------------------------------------------------------ */

/**
 * ISO 4217-style alphabetic code: exactly 3 uppercase letters.
 *
 * Deliberately a pattern, not an enum of the 17 supported currencies —
 * Frankfurter serves ~30 codes and the API surface should accept them;
 * UI dropdowns are restricted via `currencies.ts` instead.
 */
export const CurrencyCodeSchema = z.string().regex(/^[A-Z]{3}$/, {
  message: 'Currency code must be exactly 3 uppercase letters (ISO 4217)',
});

/**
 * The only non-ISO unit tag we carry: TOMAN.
 *
 * Canonical Iranian unit is TOMAN under code `IRR` (AGENTS.md §6). TGJU
 * serves Toman-denominated quotes; any Rial↔Toman conversion happens ONLY
 * inside the scraper normalizer — never in UI code.
 */
export const RateUnitSchema = z.enum(['TOMAN']);

/** One quoted rate inside a snapshot. */
export const RateSchema = z
  .object({
    /** ISO 4217 uppercase code, e.g. 'USD', 'IRR'. */
    code: CurrencyCodeSchema,
    /** International common name (ISO 4217 / CLDR en), e.g. 'US Dollar', 'UAE Dirham'. */
    name: z.string().min(1),
    /**
     * Units of `code` per 1 unit of the snapshot `base`.
     * E.g. base 'USD' → { code: 'IRR', rate: 230500 } means 1 USD = 230,500
     * Toman (TGJU open-market quote, unit: 'TOMAN').
     * This matches Frankfurter's native `rates` convention, so the scraper
     * can pass values through unchanged.
     */
    rate: z.number().positive().finite(),
    /**
     * TGJU daily stats, quote-side (Toman per 1 unit of `code`) — the INVERSE
     * direction of `rate`. They mirror TGJU's published «نرخ فعلی / بالاترین
     * قیمت روز / پایین ترین قیمت روز» columns (ajax.json `h`/`l` + profile
     * summary table) and are display-oriented (the LED board renders them
     * beside the current price). Rial→Toman normalization happens ONLY in
     * the scraper (AGENTS.md §6). Absent on: Frankfurter rates, the IRR
     * self-rate, legacy persisted snapshots, and TGJU entries whose day
     * stats are not (yet) published — the UI shows dashes, never guesses.
     */
    dayHigh: z.number().positive().finite().optional(),
    /** See `dayHigh` — «پایین ترین قیمت روز», Toman per 1 unit of `code`. */
    dayLow: z.number().positive().finite().optional(),
    /** 'TOMAN' — allowed ONLY on code 'IRR' (enforced below). */
    unit: RateUnitSchema.optional(),
    /** Optional display symbol, e.g. '$', '€'. */
    symbol: z.string().optional(),
  })
  .refine((rate) => rate.unit !== 'TOMAN' || rate.code === 'IRR', {
    message: "unit 'TOMAN' is only valid on code 'IRR' (canonical Iranian unit, AGENTS.md §6)",
    path: ['unit'],
  });
export type Rate = z.infer<typeof RateSchema>;

/* ------------------------------------------------------------------ *
 * Gold & coins (TGJU display commodities, 2026-09-27)
 * ------------------------------------------------------------------ */

/**
 * The gold & coin items the LED gold board shows — TGJU's own published
 * quotes, EXACTLY as TGJU prints them (owner request 2026-09-27: "show this
 * data"). NOT currencies: they never enter `rates`, never feed convert() —
 * they are display-only commodities riding the tgju snapshot.
 *
 * ids are semantic (the TGJU ajax slug mapping lives in the scraper).
 */
export const GoldIdSchema = z.enum([
  'gold-ounce', // انس طلا — global troy ounce, ajax `ons`, USD
  'gold-18k', // طلای ۱۸ عیار — ajax `geram18`
  'gold-24k', // طلای ۲۴ عیار — ajax `geram24`
  'gold-used', // طلای دست دوم — ajax `gold_mini_size`
  'coin-emami', // سکه امامی — ajax `sekee`
  'coin-bahar', // سکه بهار آزادی — ajax `sekeb`
  'coin-half', // نیم سکه — ajax `nim`
  'coin-quarter', // ربع سکه — ajax `rob`
  'coin-gram', // سکه گرمی — ajax `gerami`
]);
export type GoldId = z.infer<typeof GoldIdSchema>;

/**
 * Unit a gold quote is DENOMINATED in:
 *   - 'USD'   : the global ounce (انس طلا), e.g. 4,383.45 per troy ounce;
 *   - 'TOMAN' : the Tehran market items (gold grams / coins) — TGJU PRINTS
 *     these in Rial, but the board reads in Toman (owner request
 *     2026-09-19: “1000 Rial = 100 Toman — write in Toman”): the scraper
 *     converts Rial→Toman (÷10) at parse via the same rialToToman the FX
 *     ladder uses, so the whole app stays TOMAN-canonical (AGENTS.md §6);
 *     e.g. طلای ۱۸ عیار 233,630,000 Rial → 23,363,000 Toman.
 */
export const GoldUnitSchema = z.enum(['USD', 'TOMAN']);
export type GoldUnit = z.infer<typeof GoldUnitSchema>;

/** One gold/coin quote — TGJU's published value, normalized to USD / Toman. */
export const GoldQuoteSchema = z.object({
  id: GoldIdSchema,
  unit: GoldUnitSchema,
  /** Current price (TGJU «نرخ فعلی», ajax `p`) in the quote's unit. */
  price: z.number().positive().finite(),
  /** Day high («بالاترین قیمت روز», ajax `h`) — same unit; dashes if absent. */
  dayHigh: z.number().positive().finite().optional(),
  /** Day low («پایین ترین قیمت روز», ajax `l`) — same unit; dashes if absent. */
  dayLow: z.number().positive().finite().optional(),
  /**
   * Change vs previous close (TGJU ajax `dp`) in PERCENT, e.g. 0.05 = +0.05%.
   * May be negative (market down) or 0 (closed market). Absent → the board
   * shows a dash, never a guess.
   */
  changePct: z.number().finite().optional(),
});
export type GoldQuote = z.infer<typeof GoldQuoteSchema>;

/**
 * A coherent set of quotes fetched from ONE source at ONE point in time.
 * Never mix sources within a snapshot (AGENTS.md rule 8).
 */
export const SnapshotSchema = z.object({
  /** The currency all `rates` are quoted against. */
  base: CurrencyCodeSchema,
  /** Upstream provider of this snapshot. */
  source: SnapshotSourceSchema,
  /** ISO 8601 datetime (UTC, Z-suffixed — always from `new Date().toISOString()`). */
  fetchedAt: z.iso.datetime(),
  /** At least one quoted rate. */
  rates: z.array(RateSchema).min(1),
  /**
   * Gold & coin quotes (tgju snapshots only) — display commodities in
   * USD / Toman (Tehran items converted from TGJU's printed Rial);
   * absent on legacy snapshots (pre-gold KV entries, Frankfurter
   * snapshots, the profile-page fallback path) and the UI degrades to
   * dashes, never guesses.
   */
  gold: z.array(GoldQuoteSchema).optional(),
  /** Optional hard-expiry timestamp (cache eviction hint). */
  expiresAt: z.iso.datetime().optional(),
});
export type Snapshot = z.infer<typeof SnapshotSchema>;

/* ------------------------------------------------------------------ *
 * Source operational status (persisted in the RateStore)
 * ------------------------------------------------------------------ */

/** One recorded upstream failure (kept across later successes — history). */
export const SourceStatusErrorSchema = z.object({
  /** Machine code from `errorToCodeMessage`, e.g. 'tgju_scrape_failed'. */
  code: z.string().min(1),
  /** Human-readable English message. */
  message: z.string().min(1),
  /** ISO 8601 datetime (UTC, Z-suffixed) of the failure. */
  at: z.iso.datetime(),
});
export type SourceStatusError = z.infer<typeof SourceStatusErrorSchema>;

/**
 * Operational status of one upstream source. Crosses the KV trust boundary,
 * so it is zod-validated on read (rule #3) — a poisoned status entry is
 * treated as absent, exactly like a poisoned snapshot.
 */
export const SourceStatusSchema = z.object({
  source: SnapshotSourceSchema,
  /** ISO datetime of the last scrape ATTEMPT (success or failure). */
  lastScrapeAt: z.iso.datetime().optional(),
  /** ISO datetime of the last SUCCESSFUL scrape. */
  lastSuccessAt: z.iso.datetime().optional(),
  /** Last scrape error, if any (history, not state). */
  lastError: SourceStatusErrorSchema.optional(),
  /** Wall-clock duration of the last scrape attempt (ms). */
  lastDurationMs: z.number().finite().nonnegative().optional(),
});
export type SourceStatus = z.infer<typeof SourceStatusSchema>;

/* ------------------------------------------------------------------ *
 * API envelope
 * ------------------------------------------------------------------ */

/** Success envelope for `GET /api/rates` (and the SPA's snapshot cache). */
export const RatesResponseSchema = z.object({
  snapshot: SnapshotSchema,
  /**
   * True when the snapshot was served from cache beyond `freshTtlSec`
   * (mission §6 semantics) → the SPA shows the stale/notice banner.
   */
  stale: z.boolean(),
  /** Human-oriented English notice, e.g. 'Using cached rates — last updated 5 minutes ago'. */
  notice: z.string().optional(),
  /** Where the response physically came from. */
  servedFrom: z.enum(['live', 'cache']),
});
export type RatesResponse = z.infer<typeof RatesResponseSchema>;

/** Error envelope shared by every API route. */
export const RatesErrorSchema = z.object({
  error: z.object({
    /** Machine code, e.g. 'source_unavailable'. */
    code: z.string().min(1),
    /** Human-readable English message (localized again in the SPA). */
    message: z.string().min(1),
    /** Optional retry hint in seconds. */
    retryAfterSec: z.number().int().positive().optional(),
  }),
});
export type RatesError = z.infer<typeof RatesErrorSchema>;

/* ------------------------------------------------------------------ *
 * Source configuration
 * ------------------------------------------------------------------ */

/** Per-source runtime configuration (apps/api reads its env/vars into this). */
export const SourceConfigSchema = z.object({
  source: SnapshotSourceSchema,
  baseUrl: z.url(),
  /** Currency codes this source serves. */
  currencies: z.array(CurrencyCodeSchema).min(1),
  timeoutMs: z.number().int().positive(),
  retries: z.number().int().min(0),
  freshTtlSec: z.number().int().positive(),
  minIntervalSec: z.number().int().positive(),
});
export type SourceConfig = z.infer<typeof SourceConfigSchema>;

/* ------------------------------------------------------------------ *
 * Timing constants (mission §5/§6 ladder)
 * ------------------------------------------------------------------ */

/**
 * Freshness windows, PER SOURCE. A cached snapshot younger than its window
 * is served with zero network; older cache is served with `stale: true`
 * (honest banner) — or 503 at the ladder's bottom rung.
 *
 * - `tgju` — 5 min. Iranian open-market quotes move intraday; the every-
 *   minute cron keeps the snapshot ≤ ~6 min old, so fetch-context requests
 *   only hit the stale path for seconds at a time.
 * - `frankfurter` — 15 min. ECB reference data (updates ~once per business
 *   day); the quarter-hour cron refresh (`FRANKFURTER_CRON_MOD_MIN`) keeps
 *   the snapshot inside this window, so fetch-context requests virtually
 *   never reach the stale/lock path. Incident 2026-10-07: with a 5-min TTL
 *   here, every quarter-hour gap left a ~10-minute window in which
 *   fetch-context requests hit the stale path and (with KV writes failing
 *   from fetch context) hard-500'd — 70% of all minutes. Aligning the TTL
 *   with the cron cadence closes those windows at the root, independent of
 *   KV write health.
 */
export const FRESH_TTL_SEC_BY_SOURCE: Record<SnapshotSource, number> = {
  tgju: 300,
  frankfurter: 900,
};

/** Freshness window (seconds) for a given source. */
export function freshTtlSec(source: SnapshotSource): number {
  return FRESH_TTL_SEC_BY_SOURCE[source];
}

/** Minimum spacing between two live scrapes of the same source. */
export const MIN_SCRAPE_INTERVAL_SEC = 60;

/** Hard eviction age for cached snapshots (7 days) — beyond this, 503. */
export const CACHE_HARD_TTL_SEC = 7 * 24 * 3600;

/* ------------------------------------------------------------------ *
 * Insights (docs/insights/01-indicator-spec.md — Gate I0 approved)
 * ------------------------------------------------------------------ */

/** Stable slugs of every v1 Insights indicator (P1 + P2; blocked/licensed items excluded). */
export const IndicatorIdSchema = z.enum([
  // Global — Is borrowing getting costlier?
  'yield-curve-10y2y',
  // 2026-10-26 gap-audit build (A-1): the 10y−3m leg of the curve — the
  // Fed's own preferred recession lens, riding the same FRED bulk group
  // as T10Y2Y (zero new fetches).
  'yield-curve-10y3m',
  // 2026-10-26 gap-audit build (A-3): the US−Japan 10-year yield gap —
  // the carry trade's fuel line, derived DGS10 − MOF.
  'us-japan-10y-gap',
  'real-yield-10y',
  'us10y',
  'fed-target',
  'ecb-dfr',
  'govt-interest-revenue',
  // Global — Are prices heating up?
  'us-cpi-yoy',
  'us-cpi-core-yoy',
  'breakeven-5y5y',
  // Fix spec Part C (2026-10-14): the four additions.
  'fed-expectations',
  'us30y',
  'philly-fed',
  'rba-expectations',
  // Global — Are markets nervous?
  'stress-stlfsi',
  'nfci',
  'vix',
  'crypto-fng', // Step 3 L1-18: the Alternative.me crypto Fear and Greed index (context)
  // Step 3 L1-14 / FS-06 (v3, 2026-10-20) — the Shiller cards. L2 source,
  // disabled until the owner accepts (T-30); the ids exist in the contract
  // so the registry, validation and history endpoints can carry them.
  'shiller-cape',
  'shiller-ecy',
  'gold-silver',
  // Global — Is the dollar strong?
  'dollar-basket',
  'usdjpy',
  'eur-usd',
  // Global — Is growth healthy?
  'china-pmi',
  // M7 (2026-10-26): the China consumer-prices leg rides the same NBS
  // press-release automation as china-pmi (both FRED OECD mirrors died
  // upstream 2025-04 — the card is NBS-sourced from birth).
  'china-cpi',
  'm2-us',
  'us-unemployment',
  'sahm-rule',
  'copper-gold',
  'usdcny',
  // Data-integrity round 2026-10-21 — the coverage additions (all context
  // rows: group members that never join a gauge's voter list, so the
  // existing verdict calibration is untouched).
  'us-gdp-growth', // FRED A191RL1Q225SBEA (real GDP growth, QoQ annualized)
  'us-nfp', // FRED PAYEMS monthly change (nonfarm payrolls, thousands)
  'platinum', // World Bank Pink Sheet monthly (USD/troy ounce)
  // Global — Is the dollar strong?
  // OD-7 retirement (2026-10-23, D-42): the nzd-usd id is RETIRED — an
  // indicator card for an audience that doesn't exist (no NZ coverage
  // anywhere; not in the FX module's 10 pairs). The KV documents carrying
  // its reading were migrated the same deploy (the eth-usd pattern).
  // ---- M4 Wave 1 — the early-warning pack (OD-8/D-42, 2026-10-24) ----
  // All series live-verified 2026-10-24 (fredgraph CSV) + T-16 licence
  // classes scanned the same day (data/fred-copyright.json). hy-oas is
  // EXCLUDED from the pack: the ICE BofA indices carry FRED's
  // "copyright-pre-approval" tag — publisher permission required, never
  // public (the OD-5 honest no-go, D-44).
  'initial-jobless-claims', // FRED ICSA (weekly) — scored, growth-health
  'recession-probability', // FRED RECPROUSM156N (monthly) — scored, growth-health
  'michigan-sentiment', // FRED UMCSENT (monthly) — scored, growth-health
  'michigan-1y-expectations', // FRED MICH (monthly) — companion-only inside michigan-sentiment
  'us-pce-core-yoy', // FRED PCEPILFE (12-month % change) — scored, prices-heat
  'sofr', // FRED SOFR (daily) — context, borrowing-costs
  'us-2y', // FRED DGS2 (daily) — context display (already collected), borrowing-costs
  'breakeven-10y', // FRED T10YIE (daily) — context display (validation-only today), prices-heat
  // ---- M5 Wave 2 (OD-8/D-42, 2026-10-24): household costs & the euro long end ----
  'euro-aaa-10y', // ECB YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y (daily, key verified 2026-10-24) — context, borrowing-costs
  'food-index', // World Bank Pink Sheet Monthly Indices, Food (2010=100) — context, prices-heat
  'wheat', // Pink Sheet Monthly Prices, Wheat US SRW ($/mt) — context, prices-heat
  'maize', // Pink Sheet Monthly Prices, Maize ($/mt) — context, prices-heat
  'usdtry', // Frankfurter USD→TRY (daily) — context, dollar-strength (the EM-pressure first member)
  // 2026-10-29 owner round ("add dollar against UAE currency"): the UAE
  // dirham — a pegged petro-currency the owner's audience watches for Gulf
  // exposure. Frankfurter/ECB does not serve AED, so the series rides
  // Yahoo's USD/AED daily closes (AED=X) — the same unofficial-but-accepted
  // provider the Brent gap-fill and the metals histories already use.
  'usdaed', // Yahoo USD/AED daily closes (AED=X) — context, dollar-strength
  // ---- M6 Wave 3 (OD-8/D-42, 2026-10-25): the leading-edge batch ----
  // All series live-verified 2026-10-25 + T-16 licence classes scanned the
  // same day (data/fred-copyright.json). ig-oas inherits the D-44 no-go.
  // china-cpi does NOT ship: BOTH FRED OECD mirrors (CHNCPIALLMINMEI,
  // CPALTT01CHM659N) died at 2025-04 upstream — the NBS automation probe
  // succeeded and carries the follow-up (M7).
  'mortgage-30y', // FRED MORTGAGE30US (weekly) — context, borrowing-costs
  'walcl', // FRED WALCL (weekly) — context, market-stress
  'retail-sales', // FRED RSAFS (monthly) — context, growth-health
  'housing-permits', // FRED PERMIT (monthly SAAR) — context, growth-health
  'cfnai', // FRED CFNAI (monthly index) — context, growth-health
  'job-openings', // FRED JTSJOL (monthly) — context, growth-health
  't5yie', // FRED T5YIE (daily) — context, prices-heat
  'us-wages', // FRED AHETPI (monthly → 12-month % change) — context, prices-heat
  'euro-hicp', // ECB HICP/M.U2.N.000000.4D0.ANR (monthly, key verified 2026-10-25) — SCORED, prices-heat
  'au-housing-finance', // ABS LEND_HOUSING quarterly — SCORED, au-households
  'au-saving-ratio', // ABS ANA_AGG M7.HSR.20.AUS.Q (quarterly) — context, au-households
  'au-job-vacancies', // ABS JV/M1.7.TOT.20.AUS.Q (quarterly) — context, au-households
  // Global — Prices lane companions (context rows rendered in lanes)
  // 2026-10-26 gap-audit build (A-4): gold measured in oil — the classic
  // long-run relative-value ratio, derived gold-usd ÷ brent.
  'gold-oil-ratio',
  // 2026-10-26 gap-audit build (A-6): US crude-oil inventories — the EIA's
  // keyless weekly stocks page, Saturday rung.
  'eia-crude-stocks',
  // 2026-10-26 gap-audit build (A-7): trader positioning in gold (COT) —
  // the CFTC's weekly futures-only file, Saturday rung.
  'cftc-gold-positioning',
  // 2026-10-26 gap-audit build (A-8): the OECD's amplitude-adjusted
  // Composite Leading Indicators — one fetch, three rows (USA, CHN, and
  // DEU — the euro-area substitute; EA19 does not exist in the dataflow,
  // probed live 2026-10-26).
  'oecd-cli-us',
  'oecd-cli-cn',
  'oecd-cli-de',
  // 2026-10-26 gap-audit build (A-9): the Geopolitical Risk Index —
  // Iacoviello's monthly .xls via the repo's own biff reader.
  'gpr-index',
  // 2026-10-26 gap-audit build (A-10): US Economic Policy Uncertainty —
  // Baker-Bloom-Davis's monthly headline index.
  'epu-us',
  'wti', // FRED DCOILWTICO (WTI spot, USD/barrel)
  'natgas', // FRED DHHNGSP (Henry Hub spot, USD/MMBtu)
  // Global — market-stress lane context row (crypto price beside FNG):
  // the eth-usd id (2026-10-21 data-integrity round) is RETIRED — the
  // 2026-10-21c owner round removed the card (not a market-stress
  // indicator; the prices board carries the crypto asset prices).
  // Global — sovereign yield coverage (FRED OECD monthly; licence note:
  // citation-required series display with "publisher via FRED" attribution,
  // per the FRED legal page read 2026-10-21)
  'bund-10y', // FRED IRLTLT01DEM156N
  'jgb-10y', // FRED IRLTLT01JPM156N
  'gilt-10y', // FRED IRLTLT01GBM156N
  'boj-rate', // FRED IRSTCI01JPM156N (overnight call rate ≈ policy)
  'boe-rate', // FRED IRSTCI01GBM156N (overnight rate ≈ Bank Rate)
  // Global — Prices board (price rows + context ratios; never a gauge member)
  'brent',
  'gold-usd',
  'silver-usd',
  'copper-usd',
  'btc-usd',
  'gold-btc',
  // OD-7 retirement (2026-10-23, D-42): the silver-btc id is RETIRED —
  // the weaker twin of gold-btc (the silver leg barely moves; the ratio
  // mirrored bitcoin). The KV documents carrying its reading were migrated
  // the same deploy (the eth-usd pattern).
  // Australia — Are inflation and rates a problem?
  'au-cpi',
  'au-trimmed-mean',
  'au-10y',
  'au-us-10y-gap',
  'au-petrol-yoy',
  // Australia — Are households under pressure?
  'rba-cash-rate',
  'au-home-loan',
  'au-deposit-rate',
  'au-wage-growth',
  'au-rent-yoy',
  'au-unemployment',
  'au-home-values',
  'au-household-debt-arrears',
  // 2026-10-26 gap-audit build (A-5): the RBA−Fed policy-rate gap — the
  // short-rate carry leg beside audusd (the 10y version au-us-10y-gap
  // already exists in au-inflation-rates).
  'rba-fed-gap',
  // Australia — How is trade and the currency?
  'audusd',
  'audjpy',
  'terms-of-trade',
  'iron-ore',
  'gold-aud',
]);
export type IndicatorId = z.infer<typeof IndicatorIdSchema>;

/**
 * Card groups (UI section grouping). The I15 question-group restructure
 * (2026-10-08 owner spec): readers ask questions, not asset classes. Each
 * lane group maps 1:1 onto a gauge except `prices-board`, which holds the
 * price rows and context ratios rendered by the Prices section (never in
 * a lane, never a gauge member).
 */
export const IndicatorGroupIdSchema = z.enum([
  'borrowing-costs',
  'prices-heat',
  'market-stress',
  'dollar-strength',
  'growth-health',
  'prices-board',
  'au-inflation-rates',
  'au-households',
  'au-trade-currency',
]);
export type IndicatorGroupId = z.infer<typeof IndicatorGroupIdSchema>;

/** The two summary lines: Global and Australia. */
export const InsightsSectionSchema = z.enum(['global', 'australia']);
export type InsightsSection = z.infer<typeof InsightsSectionSchema>;

/** How often the indicator's upstream data updates (drives stale detection). */
export const IndicatorCadenceSchema = z.enum([
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'per-change',
  'manual',
]);
export type IndicatorCadence = z.infer<typeof IndicatorCadenceSchema>;

/** Release wave (roadmap: P1 = first release, P2 = second wave). */
export const IndicatorPhaseSchema = z.enum(['P1', 'P2']);
export type IndicatorPhase = z.infer<typeof IndicatorPhaseSchema>;

/** Upstream provider of the indicator's series. */
export const IndicatorSourceSchema = z.enum([
  'fred',
  'rba',
  'abs',
  'tgju',
  'frankfurter',
  'gold-api',
  'bitstamp',
  'world-bank',
  'manual',
  'derived',
  'ecb', 'alternative-me',
  // Step 3 L1-14 / FS-06 (v3): the Shiller dataset (converted bulk file).
  'shiller',
  // M6 Wave-4 probe fix (2026-10-25): the Bank of England's own Bank Rate
  // history page — the boe-rate card left the FRED OECD monthly mirror.
  'boe',
  // M7 (2026-10-26): the NBS English press releases — china-pmi left the
  // manual-entry regime and the new china-cpi card is NBS-sourced (the
  // row's ToS grants the automated download; the manual seeds remain as
  // the fetch-failure fallback history in data/manual/).
  'nbs',
  // 2026-10-26 gap-audit build, A-2: the Japan Ministry of Finance's own
  // daily JGB yield CSVs (the jgb-10y upgrade; the OECD mirror becomes
  // the labelled fallback).
  'mof',
  // 2026-10-26 gap-audit build, A-6..A-10: the rung-2 feeds — the EIA
  // weekly stocks page (the existing eia provider gains a second use),
  // the CFTC's COT file, the OECD SDMX CLI, Iacoviello's GPR export and
  // Baker-Bloom-Davis's EPU workbook.
  'eia',
  'cftc',
  'oecd',
  'gpr',
  'epu',
  // 2026-10-29 owner round (the usdaed card): Yahoo Finance joins the
  // indicator sources — the same unofficial-but-accepted provider the
  // Brent gap-fill, the metals 10-year histories and the live-prices
  // refresh already use (sources.ts register row: L2, ownerAccepts).
  'yahoo',
  // 2026-10-21 data-integrity round: EODHD crypto (eth-usd) — RETIRED with
  // the card (2026-10-21c owner round); the insights ingest no longer calls
  // EODHD. The id stays OUT of the enum; the markets worker's EODHD usage
  // (the world-markets board) lives in packages/insights/src/markets/.
]);
export type IndicatorSource = z.infer<typeof IndicatorSourceSchema>;

/**
 * Warning rules — the rule types of 01-indicator-spec.md section 5 (one
 * non-composite atom kind each), plus a flat OR-composite. Direction
 * (which tail is "bad") is part of each rule, never inferred.
 * I15 additions (2026-10-08 data spec §4): `below-aux` compares the value
 * with a second series supplied by the runner (wage growth vs yearly
 * inflation). `staleAfterDays` on the definition (below) carries the
 * per-series freshness limits of data-spec §3.
 */
export const WarningRuleAtomSchema = z.discriminatedUnion('kind', [
  /** No vote — info-only card (shows data, never votes). */
  z.object({ kind: z.literal('info') }),
  /** Value above/below a fixed number; optionally sustained for N weeks (STLFSI4). */
  z.object({
    kind: z.literal('threshold'),
    direction: z.enum(['above', 'below']),
    value: z.number().finite(),
    sustainedWeeks: z.number().int().positive().optional(),
  }),
  /** Value in the high or low tail of its 10-year history (cutoff as a fraction). */
  z.object({
    kind: z.literal('percentile'),
    tail: z.enum(['high', 'low']),
    cutoff: z.number().min(0).max(1),
  }),
  /** Rise/fall of `magnitude` (percent or points) over `windowWeeks`. */
  z.object({
    kind: z.literal('change'),
    mode: z.enum(['pct', 'points']),
    direction: z.enum(['rise', 'fall']),
    magnitude: z.number().positive().finite(),
    windowWeeks: z.number().int().positive(),
  }),
  /** Year-on-year change below zero. */
  z.object({ kind: z.literal('yoy-negative') }),
  /** N period-over-period declines in a row ending at the current value. */
  z.object({ kind: z.literal('consecutive-decline'), periods: z.number().int().positive() }),
  /**
   * 2026-10-26 gap-audit build (A-8, the OECD CLI): the ANNUALISED
   * percent growth over the last `months` months (the CLI's own
   * convention — "6-month annualised growth below −1 means turning
   * down"). The engine finds the point ~months back (tolerance for
   * monthly dating) and annualises (v_t/v_then − 1) × 100 × (12/months).
   */
  z.object({
    kind: z.literal('growth'),
    direction: z.enum(['above', 'below']),
    value: z.number().finite(),
    months: z.number().int().positive(),
  }),
  /** Rise of at least `rise` points from the lowest value of the last 12 months. */
  z.object({ kind: z.literal('above-low'), rise: z.number().positive().finite() }),
  /**
   * I15: value below the paired aux series at (or before) the same
   * observation date — e.g. wage growth below yearly inflation ("pay is
   * not keeping up with prices"). The runner supplies the aux series;
   * without it the rule is honestly unevaluable, never guessed.
   */
  z.object({ kind: z.literal('below-aux') }),
]);
export type WarningRuleAtom = z.infer<typeof WarningRuleAtomSchema>;

/**
 * A warning rule: either a single atom or an OR of two or more atoms
 * (e.g. us10y = highest 10% of 10 years OR up 0.5 point in 4 weeks).
 * Atoms only — the composite is deliberately flat so the contract stays
 * inspectable; deeper composition would need a deliberate contract change.
 */
export const WarningRuleSchema = z.union([
  WarningRuleAtomSchema,
  z.object({ kind: z.literal('any-of'), of: z.array(WarningRuleAtomSchema).min(2) }),
]);
export type WarningRule = z.infer<typeof WarningRuleSchema>;

/** Static config for one indicator (the definitions table lives in @currena/insights). */
export const IndicatorDefinitionSchema = z.object({
  id: IndicatorIdSchema,
  section: InsightsSectionSchema,
  group: IndicatorGroupIdSchema,
  /** Canonical English name; the SPA renders localized names from the i18n dictionary. */
  name: z.string().min(1),
  source: IndicatorSourceSchema,
  /** Human descriptor of the upstream series or composition, e.g. 'FRED:T10Y2Y' or 'WB gold ÷ WB silver'. */
  sourceRef: z.string().min(1),
  cadence: IndicatorCadenceSchema,
  /** How change7d/change30d are expressed on the card. */
  changeKind: z.enum(['pct', 'points']),
  /**
   * Which series the 10-year percentile describes (Step-1 audit item C10):
   * 'level' (default) — the reading's own series; 'yoy' — the year-on-year
   * growth of the series, so trending totals (M2, home values) are not
   * permanently pinned at the top of their range just for rising.
   */
  percentileBasis: z.enum(['level', 'yoy']).optional(),
  phase: IndicatorPhaseSchema,
  rule: WarningRuleSchema,
  /**
   * I15 per-series freshness limit (days) — the 2026-10-08 data spec §3
   * "stale after" column. Overrides the cadence-based grace so that
   * weekly-batched dailies (Brent/EIA, 12 days) and monthly ABS CPI items
   * (70 days) stop tripping false staleness. Absent → GRACE_DAYS.
   */
  staleAfterDays: z.number().int().positive().optional(),
});
export type IndicatorDefinition = z.infer<typeof IndicatorDefinitionSchema>;

/**
 * One indicator's computed state for the snapshot. Status semantics
 * (02-page-design-spec.md section 6 + Phase I1 refinements + the fix spec
 * 2026-10-14):
 *  - `warning` / `normal` — voted, counts in the summary
 *  - `context`           — info-only card, never votes
 *  - `stale`             — data older than cadence + grace; greyed, excluded
 *  - `check-pending`      — the validation suite flagged the fresh value
 *                          (duplicate monthly print, failed source, failed
 *                          test): the LAST GOOD value is held with its
 *                          original asOf and never shown as today's data
 *  - `no-history`        — fresh value, but too little history to evaluate
 *                          the rule (excluded; card shows the value, no verdict)
 *  - `unavailable`       — no data at all (`value`/`asOf` are null)
 */
export const IndicatorReadingStatusSchema = z.enum([
  'warning',
  'normal',
  'context',
  'stale',
  'check-pending',
  'no-history',
  'unavailable',
]);
export type IndicatorReadingStatus = z.infer<typeof IndicatorReadingStatusSchema>;

export const IndicatorReadingSchema = z
  .object({
    id: IndicatorIdSchema,
    /** Current value; null iff status is 'unavailable'. */
    value: z.number().finite().nullable(),
    /** Observation date of the value (YYYY-MM-DD); null iff status is 'unavailable'. */
    asOf: z.iso.date().nullable(),
    /**
     * Step 3 L2-02 (2026-10-16): the price's gap to its 200-DAY average, in
     * percent (signed; >0 above, <0 below) — a standard definition, shown as
     * "above/below its 200-day average". Computed by the snapshot builder
     * from the stored daily series when at least 200 closes exist; absent
     * otherwise (never a guess from a shorter base).
     */
    ma200GapPct: z.number().finite().optional(),
    /**
     * Defect E-07 (2026-10-16): a QUARTERLY observation's period start and
     * period end, stored on the reading so the card can name the quarter
     * ("June quarter 2026") regardless of which date the source series
     * carries (ABS/FRED quarterlies are quarter-START dated, RBA E2 is
     * quarter-END dated — the same quarter must label identically).
     * Absent on non-quarterly series.
     */
    periodStart: z.iso.date().optional(),
    periodEnd: z.iso.date().optional(),
    /** 7-day change in `changeKind` units (pct or points); absent when not measurable. */
    change7d: z.number().finite().optional(),
    /** 30-day change, same units; absent when not measurable. */
    change30d: z.number().finite().optional(),
    /** Share of the last 10 years' readings strictly below the current one (0–1); absent when the base is too short. */
    percentile10y: z.number().min(0).max(1).optional(),
    /**
     * 2026-10-26 gap-audit build (A-9/A-10): the current value's SIGNED
     * z-score against the trailing 10-year window's mean and standard
     * deviation — the spec's "rolling 10-year mean/SD recomputed on write"
     * regime (the GPR war-scare zones: above +1 SD needs attention, above
     * +2 SD the historic spikes). Absent when the base is too short or its
     * SD is zero; only the A-9/A-10 cards' copy reads it today.
     */
    sd10y: z.number().finite().optional(),
    /**
     * I15 big-mover score (2026-10-08 data spec §4): (latest change − mean)
     * ÷ std of the same change over the 10-year window — the 30-day change
     * for daily series, the previous-period change for slower ones. Absent
     * when the change history is too short to standardise.
     */
    moveScore: z.number().finite().optional(),
    /**
     * Step-1 audit item C10: distance from the 10-year peak, in percent
     * (≤ 0; 0 = sitting at the peak). Computed from the same series as the
     * reading; absent when the series is too short or not positive.
     */
    fromPeak10y: z.number().finite().optional(),
    /**
     * Step-1 audit items A2/A3: the official RELEASE (publication) date of
     * the observation, when known — from the hand-maintained release
     * schedule (data/insights-release-schedule.json). Monthly/quarterly
     * cards show "data for {asOf month} · released {releaseDate}".
     */
    releaseDate: z.iso.date().optional(),
    /**
     * Fix spec B-05 (2026-10-14): newer data for this indicator is due
     * TODAY and is not yet in — the card shows "next release: today"
     * beside the current data's release date instead of stamping today's
     * date on last month's data.
     */
    nextReleaseToday: z.boolean().optional(),
    /**
     * Step-1 audit item A1: the Fed target range's bounds (DFEDTARL/DFEDTARU).
     * `value` carries the lower bound; rangeHigh the upper. Other
     * indicators leave both absent.
     */
    rangeLow: z.number().finite().optional(),
    rangeHigh: z.number().finite().optional(),
    /**
     * Step-2 add-list §B1: the series' LAST STEP CHANGE — the most recent
     * observation whose value differs from the one before it (policy rates
     * move in steps; the card shows "last change: +0.25 pts on 29 Sep").
     * Absent when the series has no earlier observation. Computed generically
     * by the engine for every series; rendered on the policy-rate cards.
     */
    lastChange: z
      .object({
        /** Observation date of the FIRST value in the new regime (the move's effective date). */
        date: z.iso.date(),
        /** The step's size in the series' own units (percentage points for rates). */
        points: z.number().finite(),
      })
      .optional(),
    /**
     * Fix spec B-04 (2026-10-14): the 90-day change for daily series, same
     * units — the oil leg of the oil→expectations→costs connection checks
     * several windows (7, 30 and 90 days) because a big annual move can hide
     * behind a calm month. Absent when not measurable or for cadences that
     * express changes since the previous release instead.
     */
    change90d: z.number().finite().optional(),
    /**
     * Fix spec B-01 (2026-10-14): the full-history PEAK the distance is
     * measured against — the value, its date and the basis (highest daily
     * high vs highest daily close), so the card can state all three. Only the
     * price rows carry it (gold/silver/Bitcoin/Brent).
     */
    peak: z
      .object({
        value: z.number().finite().positive(),
        date: z.iso.date(),
        basis: z.enum(['daily-high', 'daily-close']),
      })
      .optional(),
    /**
     * Fix spec B-19 (2026-10-14): for long-history series (yields), the year
     * of the last time the value was this high, found by searching the full
     * stored history — a 10-year window cannot say "highest since 2002".
     * Absent when the value is not at (or within 1% of) the 10-year high or
     * the history is too short to search.
     */
    highestSinceYear: z.number().int().positive().optional(),
    /**
     * Fix spec B-06 (2026-10-14): the policy-rate cards show BOTH dates —
     * "decided 16 Sep 2026 · effective 17 Sep 2026". The series' step date
     * is the EFFECTIVE date (lastChange.date); the decision date comes from
     * the hand-maintained data/policy-decisions.json (the provider series
     * carries no decision calendar).
     */
    decidedDate: z.iso.date().optional(),
    /**
     * Fix spec B-10 (2026-10-14): the two legs' latest observation dates for a
     * derived gap/spread (au-us-10y-gap). The VALUE is always computed from
     * same-date observations (exact-date join), but when the legs' freshest
     * dates differ from the gap's own asOf the card shows both dates and the
     * "dates differ" tag instead of letting the reader subtract the two
     * displayed numbers and get a third answer.
     */
    gapLegs: z
      .object({
        a: z.object({ id: IndicatorIdSchema, asOf: z.iso.date() }),
        b: z.object({ id: IndicatorIdSchema, asOf: z.iso.date() }),
      })
      .optional(),
    /**
     * Fix spec B-04 (2026-10-14): the home-loan reading's change since the
     * LATEST RBA cash-rate decision — the pass-through card compares the
     * decision (rba-cash-rate.lastChange) with the loan move 1–3 months
     * later, and shows "pass-through pending" until this field exists.
     * Computed by the ingest from the loan series against the decision date.
     */
    sinceDecision: z
      .object({
        /** The decision the change is measured from. */
        decisionDate: z.iso.date(),
        /** The loan-rate change since that decision, in points. */
        points: z.number().finite(),
      })
      .optional(),
    /**
     * Fix spec A-03/A-04 (2026-10-14): why a reading sits in `check-pending` —
     * the validation test id and the reason it flagged the fresh value.
     * Rendered in the details panel ("Check pending — duplicate monthly
     * value") and the status page.
     */
    flag: z
      .object({
        test: z.string().min(1),
        reason: z.string().min(1),
      })
      .optional(),
    /**
     * Fix spec A-06 (2026-10-14): an optional human-written context note with
     * an author date and an expiry date, filtered by the ingest (expired
     * notes never leave the runner). Off by default: no note exists unless
     * data/insights-context-notes.json carries one.
     */
    note: z
      .object({
        text: z.string().min(1),
        authored: z.iso.date(),
        expires: z.iso.date(),
      })
      .optional(),
    status: IndicatorReadingStatusSchema,
    sourceName: z.string().min(1),
    sourceUrl: z.url().optional(),
    /** When the runner produced this reading (ISO 8601 UTC). */
    updatedAt: z.iso.datetime(),
  })
  .refine((r) => (r.value === null) === (r.status === 'unavailable'), {
    message: "value must be null exactly when status is 'unavailable'",
    path: ['value'],
  })
  .refine((r) => (r.asOf === null) === (r.status === 'unavailable'), {
    message: "asOf must be null exactly when status is 'unavailable'",
    path: ['asOf'],
  });
export type IndicatorReading = z.infer<typeof IndicatorReadingSchema>;

/**
 * One summary line ("Global: Cautious · 4 of 14 indicators in warning").
 * `label` is null when nothing could vote (votingCount 0) — the UI decides
 * the wording; it must never present a made-up label.
 */
export const SummaryLineSchema = z.object({
  section: InsightsSectionSchema,
  label: z.enum(['relaxed', 'cautious', 'stressed', 'alarmed']).nullable(),
  warningCount: z.number().int().nonnegative(),
  votingCount: z.number().int().nonnegative(),
  excludedCount: z.number().int().nonnegative(),
});
export type SummaryLine = z.infer<typeof SummaryLineSchema>;

/** A voting indicator that changed state within the last week. */
export const ChangedEventSchema = z.object({
  id: IndicatorIdSchema,
  from: z.enum(['warning', 'normal']),
  to: z.enum(['warning', 'normal']),
  /** Observation date of the reading that established the new state. */
  asOf: z.iso.date(),
});
export type ChangedEvent = z.infer<typeof ChangedEventSchema>;

/** Hand-maintained calendar entry (data/insights-calendar.json). */
export const CalendarEventSchema = z.object({
  id: z.string().min(1),
  date: z.iso.date(),
  titleEn: z.string().min(1),
  titleFa: z.string().min(1),
  // Step-2 add-list §D: the six event kinds that move Australian money —
  // RBA and Fed decisions, ABS CPI + the ABS jobs report, US CPI + the US
  // jobs report (Employment Situation).
  kind: z.enum(['rba', 'abs-cpi', 'abs-jobs', 'fed', 'us-cpi', 'us-jobs', 'ecb', 'other']),
  /**
   * Fix spec C-07 (2026-10-14): the event's OWN time zone as an IANA name
   * (e.g. 'Australia/Sydney'). "Days away" is computed IN this zone so a
   * plain date is never converted through UTC. Absent → the browser's zone.
   */
  tz: z.string().min(1).optional(),
});
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

/* ------------------------------------------------------------------ *
 * The gold directional summary (Gold Program, S1 engine + S2 wiring —
 * docs/insights/GOLD_SCORE_SPEC.md §4.1). ADDITIVE and OPTIONAL on the
 * snapshot: stored snapshots without it and old readers are unaffected;
 * the SPA re-derives the full reading (voters included) client-side, so
 * only the COMPACT numbers ride the KV write (~0.5 KB).
 * ------------------------------------------------------------------ */

/** The four driver lanes the gold score re-cuts the gauge voters into. */
export const GoldLaneSchema = z.enum(['borrowing-costs', 'dollar', 'stress', 'inflation']);
export type GoldLane = z.infer<typeof GoldLaneSchema>;

/**
 * A lane's word. The four directional pairs are lane-specific
 * (borrowing-costs tight/relief, dollar strong/stress, market-stress
 * elevated/calm, inflation hot/cool); 'mixed' = the lane's firing
 * voters disagree; 'unreadable' = nothing in the lane could fire.
 */
export const GoldSubGaugeWordSchema = z.enum([
  'tight',
  'relief',
  'strong',
  'stress',
  'elevated',
  'calm',
  'hot',
  'cool',
  'mixed',
  'unreadable',
]);
export type GoldSubGaugeWord = z.infer<typeof GoldSubGaugeWordSchema>;

/** One lane's compact reading (the lane's own firing counts). */
export const GoldSubGaugeSummarySchema = z.object({
  lane: GoldLaneSchema,
  reading: GoldSubGaugeWordSchema,
  tailwindVoters: z.number().int().nonnegative(),
  headwindVoters: z.number().int().nonnegative(),
});
export type GoldSubGaugeSummary = z.infer<typeof GoldSubGaugeSummarySchema>;

/** The 5-step directional label (null when no voter could fire). */
export const GoldTailwindLabelSchema = z.enum([
  'strong-tailwind',
  'tailwind',
  'balanced',
  'headwind',
  'strong-headwind',
]);
export type GoldTailwindLabel = z.infer<typeof GoldTailwindLabelSchema>;

/** The model-vs-reality comparison chip. */
export const ModelVsRealityChipSchema = z.enum([
  'aligned-tailwind',
  'aligned-headwind',
  'diverging-up',
  'diverging-down',
  'neutral',
  'no-read',
]);
export type ModelVsRealityChip = z.infer<typeof ModelVsRealityChipSchema>;

/**
 * The compact gold summary stamped by the ingest (goldSummaryOf in
 * @currena/insights) — the numbers only; the firing voter LIST never
 * rides the snapshot (the SPA re-derives it through the same pure
 * engine, the gauges.ts contract).
 */
export const GoldSummarySchema = z.object({
  /** tailwind voters − headwind voters (signed). */
  netScore: z.number().int(),
  label: GoldTailwindLabelSchema.nullable(),
  firingVoters: z.number().int().nonnegative(),
  tailwindVoters: z.number().int().nonnegative(),
  headwindVoters: z.number().int().nonnegative(),
  /** How many of the four LANES read tailwind / headwind / mixed. */
  laneCounts: z.object({
    tailwind: z.number().int().nonnegative(),
    headwind: z.number().int().nonnegative(),
    mixed: z.number().int().nonnegative(),
  }),
  /** The four lane readings, in lane order — exactly four. */
  subGauges: z.array(GoldSubGaugeSummarySchema).length(4),
  modelVsReality: z.object({
    chip: ModelVsRealityChipSchema,
    modelDirection: z.enum(['tailwind', 'headwind', 'neutral']).nullable(),
    realityDirection: z.enum(['rising', 'falling', 'flat']).nullable(),
    realityBasis: z.enum(['change30d', 'ma200GapPct']).nullable(),
    realityValue: z.number().nullable(),
  }),
});
export type GoldSummary = z.infer<typeof GoldSummarySchema>;

/** The precomputed snapshot the runner writes and `GET /api/insights` serves. */
export const InsightsSnapshotSchema = z
  .object({
    generatedAt: z.iso.datetime(),
    /**
     * Step-1 audit item G7: when the live-prices overlay refreshed the
     * board (the hourly quotes key's clock). Absent on the stored snapshot;
     * `GET /api/insights` stamps it at serve time so the page can say
     * "prices updated {time}" honestly.
     */
    pricesAsOf: z.iso.datetime().optional(),
    summary: z.object({ global: SummaryLineSchema, australia: SummaryLineSchema }),
    /** Exactly one reading per known indicator id (enforced below). */
    readings: z.array(IndicatorReadingSchema),
    changedThisWeek: z.array(ChangedEventSchema),
    calendar: z.array(CalendarEventSchema),
    /**
     * Fix spec A-07 (2026-10-14): the scoring-rule version that produced
     * this snapshot — surfaced in "How is this calculated?" and archived with
     * every daily snapshot so a past page can be reproduced exactly.
     */
    ruleVersion: z.number().int().positive().optional(),
    /**
     * The PUBLIC projection (2026-10-19 owner decree; Step 3 §2.2 AC-08):
     * stamped 'public' ONLY on the licence-legal subset snapshot built by
     * projectSnapshotToPublic and served when SITE_MODE=public — the page
     * hides its private-only world sections when it sees it. Absent on the
     * full private snapshot. ADDITIVE: stored old snapshots and old readers
     * are unaffected.
     */
    displayMode: z.literal('public').optional(),
    /**
     * Gold Program S2 (docs/insights/GOLD_SCORE_SPEC.md §4.1): the
     * compact gold directional summary (tailwind score + model-vs-
     * reality), stamped by the ingest beside the section summaries and
     * recomputed by the public projection over its surviving readings.
     * OPTIONAL → zero breaking change: snapshots written before the
     * field (and every stored archive) stay valid, and the SPA derives
     * the reading client-side when it is absent.
     */
    goldSummary: GoldSummarySchema.optional(),
  })
  .refine(
    (snap) => new Set(snap.readings.map((r) => r.id)).size === snap.readings.length,
    { message: 'readings must contain each indicator id at most once' },
  );
export type InsightsSnapshot = z.infer<typeof InsightsSnapshotSchema>;

/* ------------------------------------------------------------------ *
 * Insights storage wire formats (Phase I3 — runner writes, Worker reads)
 *
 * KV layout (inside the existing RATES namespace, domain-separated by
 * the `insights:` prefix — see @currena/insights/store.ts):
 *   insights:snapshot   — InsightsSnapshot JSON
 *   insights:hist:<id>  — IndicatorHistory JSON (downsampled 10-year series)
 *   insights:status     — InsightsStatus JSON (per-source freshness)
 * None of these carry an expirationTtl: freshness is carried by the data
 * (generatedAt/asOf/status vocabulary), and history must never expire.
 * ------------------------------------------------------------------ */

/**
 * The downsampled 10-year series stored per indicator under
 * `insights:hist:<id>` and served by `GET /api/insights/:id/history`.
 * Points are `[epochDay, value]` pairs — epoch days (days since
 * 1970-01-01 UTC) keep the payload compact; values are raw numbers
 * (no fixed-point scaling: ~30 keys × ≤520 points ≈ 300 KB total,
 * far inside the 1 GB free storage limit).
 */
export const IndicatorHistorySchema = z
  .object({
    v: z.literal(1),
    id: IndicatorIdSchema,
    /** [epochDay, value] pairs, strictly ascending by epochDay. */
    points: z.array(z.tuple([z.number().int().nonnegative(), z.number().finite()])).min(1),
  })
  .refine(
    (h) => h.points.every((p, i) => i === 0 || p[0]! > h.points[i - 1]![0]!),
    { message: 'points must be strictly ascending by epochDay' },
  );
export type IndicatorHistory = z.infer<typeof IndicatorHistorySchema>;

/** One ingestion source row inside InsightsStatus (fetch outcome, loud detail). */
export const InsightsSourceReportSchema = z.object({
  /** Provider slug: fred, rba, abs, world-bank, gold-api, bitstamp, tgju, frankfurter, manual, cross-check. */
  source: z.string().min(1),
  ok: z.boolean(),
  detail: z.string().min(1),
  /**
   * v3 (2026-10-20) SCRAPING_SPEC outcome classification: fetched | blocked |
   * format-changed | failed | disabled | cross-check. Optional for
   * backward compatibility with stored statuses.
   */
  kind: z.enum(['fetched', 'blocked', 'format-changed', 'failed', 'disabled', 'cross-check']).optional(),
  /**
   * F-18: content hash of the fetched value block (unchanged repeats can be
   * detected without re-parsing). Optional.
   */
  hash: z.string().optional(),
});
export type InsightsSourceReport = z.infer<typeof InsightsSourceReportSchema>;

/**
 * Fix spec Part D (2026-10-14): one validation test's result, written to the
 * status file by the ingest AFTER the data is fetched and BEFORE anything
 * is published. `ok` false means the flagged readings were held on their
 * last good values (status `check-pending`) — never published as fresh.
 */
export const ValidationTestResultSchema = z.object({
  /** The test id: 'T-01' … 'T-14' (INSIGHTS_FIX_SPEC.md Part D). */
  test: z.string().min(1),
  /** The test's plain-language name. */
  name: z.string().min(1),
  ok: z.boolean(),
  /** The readings flagged by this test (empty when ok). */
  flagged: z.array(IndicatorIdSchema),
  /** One line per flagged reading explaining the failure. */
  failures: z.array(z.string().min(1)),
  /**
   * Skip notes — why a test could not run its full check this refresh
   * (e.g. a validation-only series the provider did not return). A skip is
   * NOT a failure: ok stays true and the note is recorded for the status page.
   */
  notes: z.array(z.string().min(1)).optional(),
});
export type ValidationTestResult = z.infer<typeof ValidationTestResultSchema>;

/**
 * Per-source freshness of the last insights ingestion run, stored under
 * `insights:status` and rendered on the /admin console (roadmap I3).
 */
export const InsightsStatusSchema = z.object({
  v: z.literal(1),
  /** When the run finished (ISO 8601 UTC) — the status identity. */
  generatedAt: z.iso.datetime(),
  /** How the runner was invoked. */
  mode: z.enum(['scheduled', 'manual']),
  /** True for a fetch-and-score pass that wrote nothing to KV. */
  dryRun: z.boolean(),
  sources: z.array(InsightsSourceReportSchema),
  /**
   * Fix spec Part D (2026-10-14): the validation suite's results — every
   * test that ran on this refresh, what it flagged, and whether it passed.
   * The "About this data" status page renders this (A-08).
   */
  validation: z.array(ValidationTestResultSchema).optional(),
  /**
   * Fix spec A-07 (2026-10-14): the scoring-rule version of this run.
   */
  ruleVersion: z.number().int().positive().optional(),
});
export type InsightsStatus = z.infer<typeof InsightsStatusSchema>;

/* ------------------------------------------------------------------ *
 * World stock markets (insights-world-markets-spec.md)
 *
 * The whole section is ONE KV key — `insights:markets:v1` — written by the
 * dedicated currena-markets Worker cron (its own 2 cron triggers, so each
 * invocation stays well under the 50-subrequest cap) and served read-only
 * by GET /api/insights/markets. Page requests never touch a provider.
 *
 * Field semantics come from spec §4 "Stored object" + §5 "Derived numbers"
 * (camelCase here to match every other contract in this file):
 *   asOf     — the market's own last-close date (its calendar, not UTC's)
 *   chg1d    — last close vs previous close, percent
 *   chg1w    — last close vs the last close on/before the same date one week
 *              earlier, percent (the weekly lens, round 46) — OPTIONAL
 *   chg1m    — last close vs the last close on/before the same date one month
 *              earlier, percent (the currencies rules read it) — OPTIONAL
 *   chg3m    — last close vs the last close on/before the same date three
 *              months earlier, percent (the section's NORMAL timeframe —
 *              owner round 44, spec v1.2)
 *   chg1y    — last close vs the last close on/before the same date one year
 *              earlier, percent (the yearly lens, round 47; when the
 *              provider's one-year window starts inside the ±15-day year-ago
 *              anchor band, the earliest close IS the anchor — the repo's
 *              year-on-year rule) — OPTIONAL
 *   chg5y    — last close vs the last close on/before the same date five
 *              years earlier, percent (the 5-year lens, 2026-10-27 owner
 *              round; anchored off the job's Yahoo range=10y supplement) —
 *              OPTIONAL
 *   fromHigh — last close vs high52w, percent (always ≤ 0)
 *   rangePos — (last − low) ÷ (high − low) × 100
 *   trend    — vs the 50-day average: up > +1%, down < −1%, else flat
 *   status   — distance-from-52w-high band with a 2-point exit buffer
 *   weekly   — ≤52 [epochDay, close] pairs for the detail panel's chart
 * ------------------------------------------------------------------ */

/**
 * The world indices (spec §2 as amended by owner round 44, v1.2 — the
 * Dow Jones and CAC 40 joined the original 14). Groups stay ≤ 7 tiles
 * (spec §6.3): Asia-Pacific 7 · Europe 4 · Americas 5.
 */
export const MarketIdSchema = z.enum([
  'n225',
  'asx200',
  'kospi',
  'hsi',
  'ssec',
  'taiex',
  'nifty50',
  'stoxx50',
  'dax',
  'cac',
  'ftse',
  'sp500',
  'ndx',
  'dow',
  'tsx',
  'ibov',
]);
export type MarketId = z.infer<typeof MarketIdSchema>;

/** Regional group; the section renders the groups east to west. */
export const MarketGroupIdSchema = z.enum(['asia', 'europe', 'americas']);
export type MarketGroupId = z.infer<typeof MarketGroupIdSchema>;

/** Trend vs the 50-day average (spec §5.1). */
export const MarketTrendSchema = z.enum(['up', 'flat', 'down']);
export type MarketTrend = z.infer<typeof MarketTrendSchema>;

/**
 * Distance-from-52-week-high status (spec §5.2). `correction` maps onto the
 * page's needs-attention tier, `bear` onto the unusual tier (spec §8.2).
 */
export const MarketStatusSchema = z.enum(['normal', 'correction', 'bear']);
export type MarketStatus = z.infer<typeof MarketStatusSchema>;

/** Which provider produced the row (spec §3.2: EODHD primary, Yahoo fallback). */
export const MarketSourceSchema = z.enum(['eodhd', 'yahoo']);
export type MarketSource = z.infer<typeof MarketSourceSchema>;

/** One market's row inside the stored snapshot. */
export const MarketEntrySchema = z.object({
  id: MarketIdSchema,
  /** Last close date, YYYY-MM-DD on the market's own calendar. */
  asOf: z.iso.date(),
  /** Last close level in the market's local currency (> 0 — rule R1). */
  close: z.number().finite().positive(),
  /** Last close vs previous close, percent. */
  chg1d: z.number().finite(),
  /**
   * Last close vs the last close on or before the same date one week
   * earlier, percent — the weekly lens of the view switch (round 46:
   * Today | 1 week | 1 month | 3 months | From 52-week high). OPTIONAL
   * for back-compat with stored rows written before this change, exactly
   * like chg1m below: a row without it is a pre-lens row, never a guess —
   * the UI shows an honest dash. The next markets run rewrites every row
   * with it.
   */
  chg1w: z.number().finite().optional(),
  /**
   * Last close vs the last close on/before the same date one month earlier,
   * percent — the leg the currency section's rules read (currencies spec
   * §6.3: S&P 500, Nikkei 225, Euro Stoxx 50 1-month changes). OPTIONAL for
   * one honest reason: a snapshot written before 2026-10-13 does not carry
   * it, and the fx engine treats its absence as "input missing" (a nodata
   * rule row), never a guess. The next markets run rewrites every row with it.
   */
  chg1m: z.number().finite().optional(),
  /** Last close vs ~three months earlier (the normal timeframe), percent. */
  chg3m: z.number().finite(),
  /**
   * Last close vs the last close on/before the same date one year earlier,
   * percent — the yearly lens of the view switch (round 47). The anchor rule
   * mirrors the repo's year-on-year convention (series.ts yoyPctSeries): the
   * latest close on/before 365 days back, and when the provider's free
   * one-year window starts INSIDE the ±15-day band around that date, the
   * earliest close is the year-ago anchor. OPTIONAL for back-compat with
   * stored rows written before this change, exactly like chg1w/chg1m: a row
   * without it is a pre-lens row, never a guess — the UI shows an honest
   * dash. The next markets run rewrites every row with it.
   */
  chg1y: z.number().finite().optional(),
  /**
   * Last close vs the last close on/before the same date five years earlier,
   * percent — the 5-year lens of the view switch (the 2026-10-27 "add 3
   * months and 5 years to all view points" owner round). The anchor rule
   * mirrors chg1y's (1826 days back, ±15-day tolerance band). OPTIONAL for
   * back-compat: neither free provider's DEFAULT window reaches 5 years back
   * (EODHD free = 1 year), so the field only lands when the job's long
   * Yahoo range=10y supplement could anchor it — a row without it is a row
   * without an honest reading, never a guess; the UI shows the dash.
   */
  chg5y: z.number().finite().optional(),
  /** Highest daily close in the last 365 days. */
  high52w: z.number().finite().positive(),
  /** Lowest daily close in the last 365 days. */
  low52w: z.number().finite().positive(),
  /** Last close vs high52w, percent — zero or negative by construction. */
  fromHigh: z.number().finite().max(0),
  /** Position inside the 52-week range, 0–100. */
  rangePos: z.number().min(0).max(100),
  trend: MarketTrendSchema,
  status: MarketStatusSchema,
  source: MarketSourceSchema,
  /** True when asOf is more than 5 calendar days old (rule R6). */
  stale: z.boolean(),
  /**
   * World-markets MAP (docs/insights/world-markets-map-spec.md D1/D2): the
   * provider's market-state answer for the winning series, reduced to a
   * boolean — true only when the session was in its REGULAR phase at fetch
   * time. Absent for EODHD (its EOD endpoint carries no market-state
   * field, and an end-of-day close is by definition not a live quote) and
   * for rows written before this field existed: those rows render Closed,
   * never a guess. The UI additionally requires a fresh quoteTime before
   * it shows Open, so a stored `true` can never go stale on screen.
   */
  open: z.boolean().optional(),
  /**
   * MAP D1: the last-update timestamp of the winning series' latest quote
   * — Yahoo's meta.regularMarketTime as ISO 8601 UTC; absent when the
   * provider carries no per-quote time (EODHD EOD rows are dated, not
   * timestamped). Age vs the viewer's clock drives the Open/Closed
   * fallback rule (OPEN_MAX_AGE_MIN, definitions.ts) and the map's
   * "Updated {time}" line.
   */
  quoteTime: z.iso.datetime().optional(),
  /**
   * ≤52 weekly closes for the detail chart, delta-encoded to keep the ONE
   * stored object under the route's 13 KB budget (spec §4; raised from 12 KB
   * by round 46 — the weekly lens field): each entry is
   * [dayDelta, close] where dayDelta counts days from the previous entry
   * (the first from the WEEKLY_EPOCH_BASE of 2020-01-01, exported from
   * @currena/insights/markets/definitions) and close is rounded to integer
   * chart precision. Consecutive calendar weeks are 7 apart; a gap (a
   * market's holiday week) simply carries a larger delta — never a
   * fabricated value.
   */
  weekly: z
    .array(z.tuple([z.number().int().nonnegative(), z.number().finite().positive()]))
    .min(1)
    .max(52)
    .refine((w) => w.every((p, i) => i === 0 || p[0] > 0), {
      message: 'weekly day deltas must be positive after the first entry',
    }),
});
export type MarketEntry = z.infer<typeof MarketEntrySchema>;

/** Section rollup (spec §5.3) — feeds the hero count and the takeaway line. */
export const MarketsSummarySchema = z.object({
  /** Rows in this snapshot (16 once every market has spoken once). */
  count: z.number().int().positive(),
  /** Markets whose chg1d is above zero (mixed as-of dates are expected). */
  roseToday: z.number().int().nonnegative(),
  /** Markets in `correction` — the needs-attention tier. */
  nAttention: z.number().int().nonnegative(),
  /** Markets in `bear` — the unusual tier. */
  nUnusual: z.number().int().nonnegative(),
  /** The section signal: highest matching row of the §5.3 table. */
  signal: z.enum(['normal', 'attention', 'unusual']),
  /** Group holding the most correction+bear markets; null when all normal. */
  worstGroup: MarketGroupIdSchema.nullable(),
});
export type MarketsSummary = z.infer<typeof MarketsSummarySchema>;

/** The value of `insights:markets:v1`, verbatim over the wire. */
export const MarketsSnapshotSchema = z
  .object({
    v: z.literal(1),
    /** When the writing run finished (ISO 8601 UTC). */
    generatedAt: z.iso.datetime(),
    markets: z.array(MarketEntrySchema),
    summary: MarketsSummarySchema,
  })
  .refine((s) => new Set(s.markets.map((m) => m.id)).size === s.markets.length, {
    message: 'markets must contain each market id at most once',
  })
  .refine((s) => s.summary.count === s.markets.length, {
    message: 'summary.count must equal the number of market rows',
  })
  .refine((s) => s.summary.nAttention + s.summary.nUnusual <= s.markets.length, {
    message: 'summary attention+unusual counts cannot exceed the row count',
  })
  .refine((s) => s.summary.roseToday <= s.markets.length, {
    message: 'summary.roseToday cannot exceed the row count',
  })
  .refine(
    (s) => s.markets.every((m) => m.low52w <= m.close && m.close <= m.high52w && m.high52w > 0),
    { message: 'each close must sit inside its own 52-week range' },
  );
export type MarketsSnapshot = z.infer<typeof MarketsSnapshotSchema>;

/* ------------------------------------------------------------------ *
 * World currencies (insights-world-currencies-spec.md)
 *
 * The whole section is ONE KV key — `insights:fx:v1` — written by the fx
 * job (riding the currena-markets Worker's two cron triggers: the account's
 * 5-cron free limit is full, spec §4.4's fallback) and served read-only by
 * GET /api/insights/fx. Page requests never touch a provider, and no AI is
 * called at runtime — every sentence on screen comes from fixed templates
 * filled with the numbers below.
 *
 * Field semantics come from spec §4 "Stored object" + §6 "The analysis
 * engine" (camelCase to match every other contract here):
 *   chg       — d1/m1/m3/y1 percent changes, positive = first currency
 *               (or the dollar) got stronger
 *   moveRank  — share (0–100) of the last 365 days' rolling one-month
 *               moves smaller than today's (direction ignored)
 *   weekly    — ≤52 [dayDelta, close] pairs, delta-encoded exactly like
 *               the markets section (base day 2020-01-01)
 *   legs      — the warning-line rows (name, value, the line, met)
 *   pattern   — the 13-week health check (holding ≥9 · mixed 7–8 · not
 *               holding ≤6 · nodata), each week true/held, false/not held,
 *               null/skipped (no change)
 *   chart     — per rule, 2–3 rebased-to-100 weekly series (26 points)
 *   summary   — the section signal: 0 counted warnings = normal, 1–2 =
 *               attention, 3+ or the R4 confidence-wobble = unusual
 * ------------------------------------------------------------------ */

/** The 10 pairs (spec §3.1) — 6 direct/inverse + 4 crosses derived in code. */
export const FxPairIdSchema = z.enum([
  'eurusd',
  'usdjpy',
  'gbpusd',
  'usdchf',
  'usdcny',
  'audusd',
  'audjpy',
  'eurjpy',
  'eurchf',
  'audcny',
]);
export type FxPairId = z.infer<typeof FxPairIdSchema>;

/** The 6 non-USD currencies the provider must serve (spec §2). */
export const FxCurrencySchema = z.enum(['EUR', 'JPY', 'GBP', 'CHF', 'CNY', 'AUD']);
export type FxCurrency = z.infer<typeof FxCurrencySchema>;

/** The four period changes, percent (spec §6.1). */
export const FxChgSchema = z.object({
  d1: z.number().finite(),
  m1: z.number().finite(),
  m3: z.number().finite(),
  y1: z.number().finite(),
});
export type FxChg = z.infer<typeof FxChgSchema>;

/** Which provider produced the pair (spec §4.2: Frankfurter primary, Yahoo fallback). */
export const FxSourceSchema = z.enum(['frankfurter', 'yahoo']);
export type FxSource = z.infer<typeof FxSourceSchema>;

/** One pair's row inside the stored snapshot (spec §4 "Stored object"). */
export const FxPairEntrySchema = z.object({
  id: FxPairIdSchema,
  /** The pair's own last-rate date, YYYY-MM-DD. */
  asOf: z.iso.date(),
  /** Latest rate, quote units per 1 base (> 0 — rule V1). */
  rate: z.number().finite().positive(),
  chg: FxChgSchema,
  /** 0–100 (spec §6.2). */
  moveRank: z.number().min(0).max(100),
  /** True when moveRank ≥ 90 — the "Unusually large move" tag. */
  bigMove: z.boolean(),
  source: FxSourceSchema,
  /** True when asOf is more than 5 calendar days old (rule V6). */
  stale: z.boolean(),
  /** ≤52 weekly closes, delta-encoded like the markets rows. */
  weekly: z
    .array(z.tuple([z.number().int().nonnegative(), z.number().finite().positive()]))
    .min(1)
    .max(52)
    .refine((w) => w.every((p, i) => i === 0 || p[0] > 0), {
      message: 'weekly day deltas must be positive after the first entry',
    }),
});
export type FxPairEntry = z.infer<typeof FxPairEntrySchema>;

/** "Dollar vs the world" — Currena's own weighted measure (spec §3.2). */
export const FxDollarMeasureSchema = z.object({
  asOf: z.iso.date(),
  /** The basket's index level (not an exchange rate; base constant inside). */
  value: z.number().finite().positive(),
  chg: FxChgSchema,
  weekly: FxPairEntrySchema.shape.weekly,
});
export type FxDollarMeasure = z.infer<typeof FxDollarMeasureSchema>;

/** The 13-week pattern check (spec §6.4). */
export const FxPatternCheckSchema = z.object({
  status: z.enum(['holding', 'mixed', 'not_holding', 'nodata']),
  agreeWeeks: z.number().int().min(0).max(13),
  ofWeeks: z.literal(13),
  /** 13 entries: true = held, false = did not, null = skipped (no change). Empty when nodata / the rule has no check. */
  weeks: z.array(z.boolean().nullable()).max(13),
});
export type FxPatternCheck = z.infer<typeof FxPatternCheckSchema>;

/** One warning-line row: "AUD/JPY −4.1% · warning line −3.0%" (spec §9.3). */
export const FxLegSchema = z.object({
  name: z.string().min(1),
  value: z.number().finite(),
  line: z.number().finite(),
  met: z.boolean(),
});
export type FxLeg = z.infer<typeof FxLegSchema>;

/** One rebased chart line (spec §9.3 Level 2: 26 weeks, both start at 100). */
export const FxChartSeriesSchema = z.object({
  id: z.string().min(1),
  points: z.array(z.number().finite()).min(2),
});
export type FxChartSeries = z.infer<typeof FxChartSeriesSchema>;

/** The seven rules (spec §6.3). */
export const FxRuleIdSchema = z.enum([
  'r1_risk_mood',
  'r2_carry_trade',
  'r3_dollar_strength',
  'r4_money_hiding',
  'r5_china_link',
  'r6_europe_worry',
  'r7_dollar_or_euro',
]);
export type FxRuleId = z.infer<typeof FxRuleIdSchema>;

/**
 * One rule's state. `outcome` names are the ENGINE's (spec §6.3); on screen
 * they map to Active / Watching / Quiet plus the page's severity chips
 * (spec §9.3). `downgraded` marks the §6.4 pass: a Warning whose pattern is
 * Not holding lately becomes a Watch and does not count.
 */
export const FxRuleStateSchema = z.object({
  id: FxRuleIdSchema,
  outcome: z.enum(['warning', 'watch', 'supportive', 'quiet', 'context', 'nodata']),
  /** True when this row counts toward the section signal. */
  counted: z.boolean(),
  /** The numbers behind the sentence (only inputs that exist — never a guess). */
  numbers: z.record(z.string(), z.number().finite()),
  /** Cross-pair confirmations (R1: EUR/JPY). */
  confirmedBy: z.array(z.string()),
  /** 0–100: how far the main leg moved toward its warning line (spec §6.7). */
  progress: z.number().min(0).max(100),
  /** R4's two shapes, R7's two leads, and R3's fast/slow leg (v1.3: which
   * trigger fired — 'm1' = the one-month line ±3.0, 'm3' = the three-month
   * line ±4.0 — so the sentence can name its period honestly). */
  variant: z.enum(['flight', 'wobble', 'dollar-led', 'euro-led', 'm1', 'm3']).optional(),
  legs: z.array(FxLegSchema),
  pattern: FxPatternCheckSchema,
  chart: z.object({
    expect: z.enum(['together', 'opposite']),
    series: z.array(FxChartSeriesSchema),
  }),
  /** True when §6.4's downgrade pass demoted a Warning to Watch. */
  downgraded: z.boolean().optional(),
});
export type FxRuleState = z.infer<typeof FxRuleStateSchema>;

/** Section rollup (spec §6.5) — feeds the hero count, like the stock section. */
export const FxSummarySchema = z.object({
  signal: z.enum(['normal', 'attention', 'unusual']),
  /** Counted Warnings (after the downgrade pass). */
  countedWarnings: z.number().int().nonnegative(),
  /** The most serious active rule (the R4 wobble wins); null when none. */
  headlineRule: FxRuleIdSchema.nullable(),
});
export type FxSummary = z.infer<typeof FxSummarySchema>;

/**
 * The v1.3 plain-language additions (change request §6, "Build notes"):
 * two tiny fields the cron job derives once so the page never has to.
 * `dollarYearExtreme` powers S1's "its strongest/weakest in a year"
 * clause (from the 52-week range of the dollar measure); `movers` holds
 * each big currency's OWN one-month change against the US dollar
 * (positive = the currency gained on the dollar — USD/X pairs inverted).
 *
 * OPTIONAL on the snapshot: pre-v1.3 copies (KV + every visitor's
 * localStorage cache) must keep parsing; the page derives the same
 * values from the stored pairs/dollar rows when `plain` is absent.
 */
export const FxPlainSchema = z.object({
  dollarYearExtreme: z.enum(['high', 'low']).nullable(),
  movers: z.object({
    EUR: z.number().finite().optional(),
    JPY: z.number().finite().optional(),
    GBP: z.number().finite().optional(),
    CNY: z.number().finite().optional(),
    CHF: z.number().finite().optional(),
    AUD: z.number().finite().optional(),
  }),
});
export type FxPlain = z.infer<typeof FxPlainSchema>;

/** The value of `insights:fx:v1`, verbatim over the wire (spec §4). */
export const FxSnapshotSchema = z
  .object({
    v: z.literal(1),
    /** When the writing run finished (ISO 8601 UTC). */
    generatedAt: z.iso.datetime(),
    dollarMeasure: FxDollarMeasureSchema,
    pairs: z.array(FxPairEntrySchema),
    rules: z.array(FxRuleStateSchema),
    summary: FxSummarySchema,
    /** v1.3 plain-language helpers (CR §6) — optional: pre-v1.3 copies
     * (KV + localStorage caches) must keep parsing. */
    plain: FxPlainSchema.optional(),
  })
  .refine((s) => new Set(s.pairs.map((p) => p.id)).size === s.pairs.length, {
    message: 'fx pairs must contain each pair id at most once',
  })
  .refine((s) => new Set(s.rules.map((r) => r.id)).size === s.rules.length, {
    message: 'fx rules must contain each rule id at most once',
  });
export type FxSnapshot = z.infer<typeof FxSnapshotSchema>;

/* ------------------------------------------------------------------ *
 * Live prices (the volatility-scaled refresh — 2026-10-12)
 *
 * The Prices board's four assets (Brent, gold, silver, Bitcoin) plus their
 * companion ratios are the page's most volatile numbers, but their daily
 * backbone sources are end-of-day and can lag: EIA's Brent spot on FRED
 * stopped publishing on 2026-10-06 while the real market kept moving (the
 * stale-$125-oil incident — live Brent was ~$107). This ONE KV key
 * (`insights:prices-live:v1`) carries intraday quotes fetched from Yahoo
 * Finance (keyless) by the hourly :13 rung of the currena-api minute cron
 * and merged into `GET /api/insights` at serve time.
 *
 *   asOf          — the date of the quote's daily bar (the market's own
 *                   calendar, matching IndicatorReading.asOf semantics)
 *   change7d/30d  — the live value vs the daily close ~7/30 days back
 *                   (percent, the tile rows' changeKind), rounded 2 dp
 *   sourceSymbol  — the Yahoo symbol the quote came from (e.g. 'BZ=F')
 *   updatedAt     — when the fetch that produced this entry succeeded
 * ------------------------------------------------------------------ */

/** The Prices-board assets the live refresh covers (see prices/definitions). */
export const PriceAssetIdSchema = z.enum(['brent', 'gold-usd', 'silver-usd', 'btc-usd']);
export type PriceAssetId = z.infer<typeof PriceAssetIdSchema>;

/** One asset's live quote inside the stored snapshot. */
export const LivePriceEntrySchema = z.object({
  /** Live quote (last trade / spot), rounded to 2 dp at write time. */
  value: z.number().finite().positive(),
  /** Date of the latest daily bar the quote belongs to (YYYY-MM-DD). */
  asOf: z.iso.date(),
  /** Live value vs the daily close ~7 days back, percent; absent when the window is too short. */
  change7d: z.number().finite().optional(),
  /** Live value vs the daily close ~30 days back, percent; absent when the window is too short. */
  change30d: z.number().finite().optional(),
  /** Yahoo symbol the quote came from (attribution + debugging). */
  sourceSymbol: z.string().min(1),
  /** When the successful fetch ran (ISO 8601 UTC) — NOT part of content equality. */
  updatedAt: z.iso.datetime(),
});
export type LivePriceEntry = z.infer<typeof LivePriceEntrySchema>;

/** The value of `insights:prices-live:v1`, verbatim over the wire. */
export const LivePricesSnapshotSchema = z.object({
  v: z.literal(1),
  /** When the writing run finished (ISO 8601 UTC). */
  generatedAt: z.iso.datetime(),
  /**
   * Partial by design: an asset whose fetch failed (and was never stored) is
   * simply absent — z.partialRecord, because a plain z.record over an enum
   * key would demand every asset on every parse.
   */
  assets: z.partialRecord(PriceAssetIdSchema, LivePriceEntrySchema),
});
export type LivePricesSnapshot = z.infer<typeof LivePricesSnapshotSchema>;
