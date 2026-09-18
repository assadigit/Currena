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
 * Unit a gold quote is DENOMINATED in — TGJU's own display unit, kept
 * verbatim on purpose (NO Rial→Toman normalization here):
 *   - 'USD'  : the global ounce (انس طلا), e.g. 4,383.45 per troy ounce;
 *   - 'RIAL' : the Tehran market items (gold grams / coins) — the Iranian
 *     gold market quotes in Rial exactly as TGJU prints them (e.g.
 *     طلای ۱۸ عیار = 233,630,000). The currency side of the app stays
 *     TOMAN-canonical (AGENTS.md §6 applies to FX `rates`, not to these
 *     display commodities); the UI labels both units explicitly.
 */
export const GoldUnitSchema = z.enum(['USD', 'RIAL']);
export type GoldUnit = z.infer<typeof GoldUnitSchema>;

/** One gold/coin quote — TGJU's published value, in its native unit. */
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
   * TGJU's native units; absent on legacy snapshots (pre-2026-09-27 KV
   * entries, Frankfurter snapshots, the profile-page fallback path) and
   * the UI degrades to dashes, never guesses.
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
