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

/** A snapshot is fresh for 5 minutes; older cache is served with `stale: true`. */
export const FRESH_TTL_SEC = 300;

/** Minimum spacing between two live scrapes of the same source. */
export const MIN_SCRAPE_INTERVAL_SEC = 60;

/** Hard eviction age for cached snapshots (7 days) — beyond this, 503. */
export const CACHE_HARD_TTL_SEC = 7 * 24 * 3600;

/* ------------------------------------------------------------------ *
 * Insights (docs/insights/01-indicator-spec.md — Gate I0 approved)
 * ------------------------------------------------------------------ */

/** Stable slugs of every v1 Insights indicator (P1 + P2; blocked/licensed items excluded). */
export const IndicatorIdSchema = z.enum([
  // Global — Rates and credit
  'yield-curve-10y2y',
  'stress-stlfsi',
  'real-yield-10y',
  'us10y',
  'breakeven-5y5y',
  'govt-interest-revenue',
  // Global — Currencies
  'dollar-broad',
  'usdjpy',
  // Global — Metals, crypto and hard assets
  'gold-silver',
  'gold-btc',
  'silver-btc',
  'copper-gold',
  'brent',
  // Global — Stocks, growth and liquidity
  'm2-us',
  'china-pmi',
  'usdcny',
  // Australia — Interest and inflation
  'rba-cash-rate',
  'au-cpi',
  'au-trimmed-mean',
  // Australia — Currency and trade
  'audusd',
  'audjpy',
  'au-us-10y-gap',
  'gold-aud',
  'iron-ore',
  'terms-of-trade',
  // Australia — Jobs and housing
  'au-unemployment',
  'au-home-values',
  'au-household-debt-arrears',
]);
export type IndicatorId = z.infer<typeof IndicatorIdSchema>;

/** Card groups (UI section grouping, 01-indicator-spec.md section 1–2). */
export const IndicatorGroupIdSchema = z.enum([
  'rates-credit',
  'currencies',
  'metals-crypto',
  'stocks-growth',
  'interest-inflation',
  'currency-trade',
  'jobs-housing',
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
]);
export type IndicatorSource = z.infer<typeof IndicatorSourceSchema>;

/**
 * Warning rules — the seven rule types of 01-indicator-spec.md section 5
 * (one non-composite atom kind each), plus a flat OR-composite. Direction
 * (which tail is "bad") is part of each rule, never inferred.
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
  /** Rise of at least `rise` points from the lowest value of the last 12 months. */
  z.object({ kind: z.literal('above-low'), rise: z.number().positive().finite() }),
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
  phase: IndicatorPhaseSchema,
  rule: WarningRuleSchema,
});
export type IndicatorDefinition = z.infer<typeof IndicatorDefinitionSchema>;

/**
 * One indicator's computed state for the snapshot. Status semantics
 * (02-page-design-spec.md section 6 + Phase I1 refinements):
 *  - `warning` / `normal` — voted, counts in the summary
 *  - `context`           — info-only card, never votes
 *  - `stale`             — data older than cadence + grace; greyed, excluded
 *  - `no-history`        — fresh value, but too little history to evaluate
 *                          the rule (excluded; card shows the value, no verdict)
 *  - `unavailable`       — no data at all (`value`/`asOf` are null)
 */
export const IndicatorReadingStatusSchema = z.enum([
  'warning',
  'normal',
  'context',
  'stale',
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
    /** 7-day change in `changeKind` units (pct or points); absent when not measurable. */
    change7d: z.number().finite().optional(),
    /** 30-day change, same units; absent when not measurable. */
    change30d: z.number().finite().optional(),
    /** Share of the last 10 years' readings strictly below the current one (0–1); absent when the base is too short. */
    percentile10y: z.number().min(0).max(1).optional(),
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
  kind: z.enum(['rba', 'abs-cpi', 'fed', 'other']),
});
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

/** The precomputed snapshot the runner writes and `GET /api/insights` serves. */
export const InsightsSnapshotSchema = z
  .object({
    generatedAt: z.iso.datetime(),
    summary: z.object({ global: SummaryLineSchema, australia: SummaryLineSchema }),
    /** Exactly one reading per known indicator id (enforced below). */
    readings: z.array(IndicatorReadingSchema),
    changedThisWeek: z.array(ChangedEventSchema),
    calendar: z.array(CalendarEventSchema),
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
});
export type InsightsSourceReport = z.infer<typeof InsightsSourceReportSchema>;

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
});
export type InsightsStatus = z.infer<typeof InsightsStatusSchema>;
