/**
 * build-fixtures.ts — the visual-harness fixture builder (PH1-VISUAL).
 *
 * Generates the contract-valid FIXTURE snapshot the Playwright suite renders
 * (UI_SPEC.md §12: "render the page from a fixture snapshot"). The harness
 * NEVER hits a live site: everything below is synthetic, plausible data that
 * parses against THE zod contracts from @currena/core — the same schemas
 * /api/insights answers with (rule 3: import, never redefine).
 *
 * Re-implements the SNAPSHOT builder pattern from
 * apps/web/src/lib/insights.test.ts (the reading() helper + per-status
 * coverage), extended to the full 52-indicator board and the Step-3 fields
 * (periodStart/periodEnd, peak, ma200GapPct, gapLegs, flag, …). Test files are
 * never imported; the shape is copied deliberately.
 *
 * Coverage (every status class + the Step-3 card features the v3 UI will test):
 *  - normal / warning (needs attention) / context / stale / check-pending /
 *    unavailable (value null) / no-history — one reading per class at least,
 *    plus one "normal" reading in the unusual percentile tier (chip
 *    "Unusual" — retired from display in v3, the tier stays internal).
 *  - v3 §4 (2026-10-20): THIRTY-SIX warnings are NOT needed, but the hero's
 *    why-3 rows need three per section — Global: us10y, brent, sahm-rule;
 *    Australia: au-cpi, au-rent-yoy, au-home-loan (each carries a moveScore
 *    so the |moveScore| ranking is exercised); usdjpy rides one trading day
 *    behind the daily peers (asOf -4 vs -1) for the Delayed chip (U-04b's
 *    six-word coverage); shiller-cape/shiller-ecy (Phase-5 additions) carry
 *    context rows so the builder covers every definition.
 *  - a quarterly card with periodStart/periodEnd (au-cpi → "… quarter 20XX"),
 *  - price rows with peak{value,date,basis}, fromPeak10y and ma200GapPct,
 *  - a calendar with 7 FUTURE events, tz fields and all the event kinds
 *    (v3 UI-47: five in the strip, two behind the full-calendar expansion),
 *  - displayMode absent — this is the FULL private snapshot, so the private
 *    page shows everything (U-11 needs the stock board).
 *
 * ALL DAILY asOfs sit at T-1 (the freshest daily peers), EXCEPT the one
 * deliberate delayed row — weekday-dependent false "delayed" flapping was
 * measured at T-2 vs T-1 (some weeks the -2/--1 pair spans a weekend); a
 * single -4 row is deterministically ≥1 trading day behind in every week.
 *
 * Dates are computed RELATIVE TO BUILD TIME so calendar events stay in the
 * future and staleness looks honest as the days pass. Values are hand-picked
 * and internally consistent (fromPeak10y derives from the peak).
 *
 * Run: pnpm --filter @currena/web run visual:fixtures
 * (wired through the tsx binary that ships with @currena/insights — plain
 * node cannot import the workspace's TypeScript sources.)
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { ZodType } from 'zod';
import {
  InsightsSnapshotSchema,
  InsightsStatusSchema,
  IndicatorHistorySchema,
  MarketsSnapshotSchema,
} from '@currena/core';
import type {
  IndicatorId,
  IndicatorReading,
  CalendarEvent,
  ChangedEvent,
  InsightsSection,
  InsightsSnapshot,
  MarketEntry,
  SummaryLine,
} from '@currena/core';
import { DEFINITIONS } from '@currena/insights';
import { MARKETS } from '@currena/insights/markets/definitions';

/* ------------------------------------------------------------------ *
 * Paths + tiny date helpers (all UTC; the fixture is timezone-honest)
 * ------------------------------------------------------------------ */

const FIXTURES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

const DAY_MS = 86_400_000;
const now = new Date();
const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const isoDay = (offsetDays: number): string =>
  new Date(today.getTime() + offsetDays * DAY_MS).toISOString().slice(0, 10);
const generatedAt = new Date().toISOString();
const epochDay = (offsetDays: number): number => Math.floor((today.getTime() + offsetDays * DAY_MS) / DAY_MS);

/** The quarter that contains `dateIso` → {periodStart, periodEnd}. */
function quarterOf(dateIso: string): { periodStart: string; periodEnd: string } {
  const [y, m] = dateIso.split('-').map(Number) as [number, number];
  const qStartMonth = Math.floor((m - 1) / 3) * 3 + 1; // 1, 4, 7, 10
  const periodStart = new Date(Date.UTC(y, qStartMonth - 1, 1)).toISOString().slice(0, 10);
  const periodEnd = new Date(Date.UTC(y, qStartMonth + 2, 0)).toISOString().slice(0, 10);
  return { periodStart, periodEnd };
}

/** The most recent COMPLETE quarter: {periodStart, periodEnd, releaseDate}. */
function previousQuarter(): { periodStart: string; periodEnd: string; releaseDate: string } {
  let end = new Date(today);
  end.setUTCDate(1); // month start; step back one more day → last day of the previous month
  end = new Date(end.getTime() - DAY_MS);
  const q = quarterOf(end.toISOString().slice(0, 10));
  // ABS/RBA quarterly prints land ~30-45 days after quarter end.
  const releaseDate = new Date(new Date(`${q.periodEnd}T00:00:00Z`).getTime() + 35 * DAY_MS)
    .toISOString()
    .slice(0, 10);
  return { ...q, releaseDate };
}

const Q = previousQuarter();
const ARREARS_ASOF = isoDay(-170); // the stale RBA E2 quarter, ~2 quarters back
const ARREARS_Q = quarterOf(ARREARS_ASOF);

/** Deterministic pseudo-noise for history series (no Math.random flakiness). */
function noise(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ *
 * Source naming — mirrors the production card footers
 * ------------------------------------------------------------------ */

type Def = (typeof DEFINITIONS)[number];

function sourceNameOf(def: Def): string {
  const ref = def.sourceRef.replace(/^FRED:/, '');
  switch (def.source) {
    case 'fred':
      return `FRED (${ref})`;
    case 'abs':
      return 'Australian Bureau of Statistics';
    case 'rba':
      return 'Reserve Bank of Australia';
    case 'world-bank':
      return 'World Bank Pink Sheet';
    case 'ecb':
      return 'European Central Bank';
    case 'gold-api':
      return 'gold-api';
    case 'bitstamp':
      return 'Bitstamp';
    case 'alternative-me':
      return 'Alternative.me';
    case 'frankfurter':
      return 'Frankfurter (ECB)';
    case 'manual':
      return 'Manual entry (NBS China)';
    case 'derived':
      return 'Derived from published rates';
    default:
      return def.source;
  }
}

function sourceUrlOf(def: Def): string | undefined {
  if (def.source === 'fred' && def.sourceRef.startsWith('FRED:')) {
    return `https://fred.stlouisfed.org/series/${def.sourceRef.slice('FRED:'.length)}`;
  }
  if (def.source === 'abs') return 'https://www.abs.gov.au/statistics';
  if (def.source === 'rba') return 'https://www.rba.gov.au/statistics/';
  if (def.source === 'world-bank') return 'https://www.worldbank.org/en/research/commodity-markets';
  if (def.source === 'ecb') return 'https://data.ecb.europa.eu/';
  if (def.source === 'gold-api') return 'https://www.gold-api.com/';
  if (def.source === 'bitstamp') return 'https://www.bitstamp.net/';
  if (def.source === 'alternative-me') return 'https://alternative.me/crypto/fear-and-greed-index/';
  if (def.source === 'frankfurter') return 'https://frankfurter.dev/';
  return undefined;
}

/* ------------------------------------------------------------------ *
 * The per-id reading table — exactly the DEFINITIONS set.
 *
 * Statuses cover every class the U-xx tests assert against:
 *   warning      us10y, brent, sahm-rule (Global's 3 why rows) ·
 *                au-cpi, au-rent-yoy, au-home-loan (Australia's 3)
 *   unusual tier us30y + gold-usd (status normal, percentile ≥ 0.9 — the
 *                tier stays internal in v3; the chip reads Normal)
 *   delayed tier usdjpy (asOf -4 vs the -1 daily peers — U-04b's word)
 *   normal       most rows
 *   context      rba-expectations, crypto-fng, gold-btc, iron-ore,
 *                shiller-cape, shiller-ecy
 *   stale        dollar-basket, au-household-debt-arrears
 *   check-pending stress-stlfsi (flag: duplicate held for verification)
 *   no-history   philly-fed (value shows, no verdict yet)
 *   unavailable  china-pmi (manual entry expired: value null, asOf null)
 *   quarterly    govt-interest-revenue, au-wage-growth, au-home-values,
 *                terms-of-trade, au-household-debt-arrears (the genuinely
 *                cadence-quarterly ids; au-cpi/au-trimmed-mean are monthly)
 * ------------------------------------------------------------------ */

interface RowSpec {
  value: number | null;
  status: IndicatorReading['status'];
  /** Days back for the asOf (overridden by periodStart/lastChange where set). */
  asOfDays?: number;
  change7d?: number;
  change30d?: number;
  change90d?: number;
  percentile10y?: number;
  moveScore?: number;
  fromPeak10y?: number;
  peak?: { value: number; date: string; basis: 'daily-high' | 'daily-close' };
  ma200GapPct?: number;
  periodStart?: string;
  periodEnd?: string;
  releaseDate?: string;
  nextReleaseToday?: boolean;
  lastChange?: { date: string; points: number };
  decidedDate?: string;
  rangeLow?: number;
  rangeHigh?: number;
  highestSinceYear?: number;
  gapLegs?: { a: { id: IndicatorId; asOf: string }; b: { id: IndicatorId; asOf: string } };
  flag?: { test: string; reason: string };
  note?: { text: string; authored: string; expires: string };
}

const ROWS: Record<IndicatorId, RowSpec> = {
  /* Global — borrowing costs */
  'yield-curve-10y2y': { value: 0.48, status: 'normal', change7d: 0.11, change30d: 0.07, percentile10y: 0.56 },
  'real-yield-10y': { value: 1.98, status: 'normal', change7d: 0.03, change30d: 0.06, percentile10y: 0.62 },
  us10y: {
    value: 5.31,
    status: 'warning',
    change7d: 0.07,
    change30d: 0.53,
    percentile10y: 1,
    highestSinceYear: 2007,
    // v3 UI-03: the |moveScore| ranking input (second-largest move).
    moveScore: 1.2,
  },
  'fed-target': {
    value: 4.25,
    status: 'normal',
    percentile10y: 0.72,
    rangeLow: 4.25,
    rangeHigh: 4.5,
    lastChange: { date: isoDay(-21), points: -0.25 },
    decidedDate: isoDay(-22),
    asOfDays: -21,
  },
  'ecb-dfr': {
    value: 2.15,
    status: 'normal',
    percentile10y: 0.35,
    lastChange: { date: isoDay(-35), points: -0.25 },
    asOfDays: -35,
  },
  'govt-interest-revenue': {
    value: 0.191,
    status: 'normal',
    percentile10y: 0.83,
    periodStart: Q.periodStart,
    periodEnd: Q.periodEnd,
    releaseDate: Q.releaseDate,
  },
  'fed-expectations': { value: -0.62, status: 'normal', percentile10y: 0.35, change30d: -0.08 },
  us30y: { value: 5.72, status: 'normal', change30d: 0.41, percentile10y: 0.95, highestSinceYear: 2007 },
  'philly-fed': { value: -6.4, status: 'no-history' },
  'rba-expectations': { value: 4.0, status: 'context' },
  /* Global — prices heating up */
  'us-cpi-yoy': { value: 3.1, status: 'normal', percentile10y: 0.74, change30d: 0.1 },
  'us-cpi-core-yoy': { value: 2.9, status: 'normal', percentile10y: 0.7 },
  'breakeven-5y5y': { value: 2.35, status: 'normal', change7d: 0.01, change30d: -0.02, percentile10y: 0.58 },
  brent: {
    value: 74.5,
    status: 'warning',
    change7d: -3.1,
    change30d: -8.4,
    change90d: -6.1,
    moveScore: 3.2,
    percentile10y: 0.17,
    ma200GapPct: -6.2,
    peak: { value: 120.8, date: '2022-03-08', basis: 'daily-high' },
    fromPeak10y: -38.16,
    note: {
      text: 'Weekly batched print; the daily overlay is the exchange futures price.',
      authored: isoDay(-9),
      expires: isoDay(60),
    },
  },
  /* Global — market stress */
  'stress-stlfsi': {
    value: 0.42,
    status: 'check-pending',
    change30d: 0.05,
    flag: { test: 'T-04', reason: 'Duplicate daily value held pending verification' },
  },
  nfci: { value: -0.98, status: 'normal', percentile10y: 0.22 },
  vix: { value: 17.8, status: 'normal', change7d: -1.2, change30d: -2.4, percentile10y: 0.47 },
  'crypto-fng': { value: 72, status: 'context', asOfDays: -1 },
  'gold-silver': { value: 88.4, status: 'normal', percentile10y: 0.31, change30d: 1.2 },
  /* Global — dollar strength */
  'dollar-basket': { value: 102.4, status: 'stale', change30d: 2.86, percentile10y: 0.79, asOfDays: -20 },
  // v3 §4 Delayed (U-04b): 3 calendar days behind the -1 daily peers —
  // ≥1 trading day behind in every weekday layout, still within max age.
  usdjpy: { value: 149.2, status: 'normal', change7d: 0.8, change30d: 1.9, percentile10y: 0.83, asOfDays: -4 },
  'eur-usd': { value: 1.084, status: 'normal', change7d: -0.4, change30d: -0.9, percentile10y: 0.44 },
  /* Global — growth health */
  'china-pmi': { value: null, status: 'unavailable' },
  'm2-us': { value: 2.1, status: 'normal', percentile10y: 0.28, change30d: 0.1 },
  'us-unemployment': { value: 4.1, status: 'normal', percentile10y: 0.55, change30d: 0.1 },
  // v3 UI-01/UI-03: the third Global warning (the Sahm rule above 0.5) —
  // the hero's why-3 ranking exercises the smallest |moveScore|.
  'sahm-rule': { value: 0.53, status: 'warning', percentile10y: 0.85, change30d: 0.2, moveScore: 0.9 },
  'copper-gold': { value: 0.0042, status: 'normal', percentile10y: 0.5, change30d: -1.1 },
  usdcny: { value: 7.24, status: 'normal', percentile10y: 0.66, change30d: 0.3 },
  /* Global — prices board */
  'gold-usd': {
    value: 3870.4,
    status: 'normal',
    change7d: 1.1,
    change30d: 2.9,
    moveScore: 2.4,
    percentile10y: 0.97,
    ma200GapPct: 12.4,
    peak: { value: 3912, date: isoDay(-3), basis: 'daily-close' },
    fromPeak10y: -1.06,
    asOfDays: -1,
  },
  'silver-usd': {
    value: 47.2,
    status: 'normal',
    change30d: 3.8,
    percentile10y: 0.93,
    ma200GapPct: 5.1,
    peak: { value: 53.85, date: '2026-04-21', basis: 'daily-high' },
    fromPeak10y: -12.34,
    asOfDays: -1,
  },
  'copper-usd': { value: 4.55, status: 'normal', percentile10y: 0.55, change30d: 1.2, asOfDays: -1 },
  'btc-usd': {
    value: 91500,
    status: 'normal',
    change7d: -2.2,
    change30d: -4.1,
    moveScore: 2.6,
    percentile10y: 0.88,
    ma200GapPct: 8.9,
    peak: { value: 112800, date: '2026-01-20', basis: 'daily-high' },
    fromPeak10y: -18.88,
    asOfDays: -1,
  },
  'gold-btc': { value: 0.0423, status: 'context', change30d: 2.1 },
  /* Global — market-stress context, Phase-5 additions (FS-06): the
   * Shiller cards carry context rows here so the builder covers every
   * definition (in production they stay hidden until the owner flips
   * owner_accepts — T-30); the live-verified values from the Phase-5 run
   * (CAPE 40.71, ECY 0.56, October 2026) keep the fixture plausible. */
  'shiller-cape': { value: 40.71, status: 'context', change30d: 0.6 },
  'shiller-ecy': { value: 0.56, status: 'context', change30d: -0.04 },
  /* Australia — inflation and rates. au-cpi / au-trimmed-mean are ABS
   * MONTHLY series: no periodStart/periodEnd (quarter fields), the card
   * honestly says "data for July 2026" — the U-06 quarterly assertions run
   * on the five genuinely-quarterly rows below instead. */
  'au-cpi': {
    value: 3.9,
    status: 'warning',
    change30d: 0.2,
    percentile10y: 0.86,
    releaseDate: Q.releaseDate,
    nextReleaseToday: true,
    moveScore: 1.5,
  },
  'au-trimmed-mean': {
    value: 3.4,
    status: 'normal',
    percentile10y: 0.71,
    releaseDate: Q.releaseDate,
  },
  'au-10y': { value: 4.52, status: 'normal', change7d: -0.03, change30d: 0.12, percentile10y: 0.68 },
  'au-us-10y-gap': {
    value: -0.79,
    status: 'normal',
    percentile10y: 0.6,
    gapLegs: { a: { id: 'au-10y', asOf: isoDay(-2) }, b: { id: 'us10y', asOf: isoDay(-3) } },
  },
  'au-petrol-yoy': { value: 2.1, status: 'normal', percentile10y: 0.42, change30d: -0.3 },
  /* Australia — households */
  'rba-cash-rate': {
    value: 4.35,
    status: 'normal',
    percentile10y: 0.5,
    lastChange: { date: isoDay(-21), points: -0.25 },
    decidedDate: isoDay(-22),
    asOfDays: -21,
  },
  // v3 UI-01/UI-03: the third Australia warning — the why-3 ranking's
  // smallest |moveScore| (the fixture's plausible lift in mortgage rates).
  'au-home-loan': { value: 6.28, status: 'warning', percentile10y: 0.82, change30d: 0.15, moveScore: 0.6 }, // sinceDecision ABSENT → "Pass-through pending"
  'au-deposit-rate': { value: 4.1, status: 'normal', percentile10y: 0.6 },
  'au-wage-growth': {
    value: 3.9,
    status: 'normal',
    percentile10y: 0.5,
    periodStart: Q.periodStart,
    periodEnd: Q.periodEnd,
    releaseDate: Q.releaseDate,
  },
  'au-rent-yoy': { value: 5.8, status: 'warning', percentile10y: 0.9, change30d: -0.1, moveScore: 2.5 },
  'au-unemployment': { value: 4.35, status: 'normal', percentile10y: 0.5, change30d: -0.1 },
  'au-home-values': {
    value: 8.9,
    status: 'normal',
    percentile10y: 0.62,
    periodStart: Q.periodStart,
    periodEnd: Q.periodEnd,
    releaseDate: Q.releaseDate,
  },
  'au-household-debt-arrears': {
    value: 1.9,
    status: 'stale',
    percentile10y: 0.75,
    periodStart: ARREARS_Q.periodStart,
    periodEnd: ARREARS_Q.periodEnd,
    asOfDays: -170,
  },
  /* Australia — trade and currency */
  audusd: { value: 0.664, status: 'normal', change7d: -0.9, change30d: -1.8, percentile10y: 0.34 },
  audjpy: { value: 99.1, status: 'normal', change7d: 0.4, change30d: 1.2, percentile10y: 0.6 },
  'terms-of-trade': {
    value: 98.4,
    status: 'normal',
    percentile10y: 0.55,
    periodStart: Q.periodStart,
    periodEnd: Q.periodEnd,
    releaseDate: Q.releaseDate,
  },
  'iron-ore': { value: 97.7, status: 'context', change30d: -3.2 },
  'gold-aud': { value: 5826, status: 'normal', percentile10y: 0.62, change30d: 2.1, asOfDays: -1 },

  /* ------------------------------------------------------------------ *
   * R10-4 (2026-10-28) — the 47 post-M4..M8 row specs the visual fixture
   * pipeline has been missing since before R9 (the builder bailed on the
   * first absent id, so the visual fixtures stopped regenerating). The
   * values below are plausible per indicator (each one's nature, source
   * and rule kind); they cover every status class the U-xx tests assert
   * against, with at least one warning, one stale, one context and the
   * rest normal. Quarterly rows carry the periodStart/End + releaseDate
   * trio (the U-06 quarterly-label assertions run on these).
   * ------------------------------------------------------------------ */

  /* Australia — households (the three quarterly ABS rows the v3 Australia
   * section added between M4 and M8). */
  'au-housing-finance': {
    value: 95.4,
    status: 'normal',
    percentile10y: 0.58,
    periodStart: Q.periodStart,
    periodEnd: Q.periodEnd,
    releaseDate: Q.releaseDate,
  },
  'au-job-vacancies': {
    value: 363.5,
    status: 'context',
    periodStart: Q.periodStart,
    periodEnd: Q.periodEnd,
    releaseDate: Q.releaseDate,
  },
  'au-saving-ratio': {
    value: 4.8,
    status: 'context',
    periodStart: Q.periodStart,
    periodEnd: Q.periodEnd,
    releaseDate: Q.releaseDate,
  },
  /* Australia — trade and currency: the RBA−Fed gap (the A-5 addition). */
  'rba-fed-gap': {
    value: 0.35,
    status: 'normal',
    percentile10y: 0.45,
    lastChange: { date: isoDay(-21), points: 0.25 },
    decidedDate: isoDay(-22),
    asOfDays: -21,
  },

  /* Global — borrowing costs (the M4..M8 wave: peer sovereign yields +
   * the short end + the 10y−3m curve leg + the 30y mortgage). */
  'yield-curve-10y3m': { value: 0.78, status: 'normal', change7d: 0.04, change30d: 0.09, percentile10y: 0.62 },
  'us-2y': { value: 4.21, status: 'normal', change7d: 0.02, change30d: 0.18, percentile10y: 0.55 },
  sofr: { value: 4.33, status: 'context', change7d: 0.0, change30d: 0.0 },
  'jgb-10y': { value: 1.42, status: 'context', change30d: 0.08, percentile10y: 0.71 },
  'bund-10y': { value: 2.31, status: 'context', change30d: 0.05, percentile10y: 0.48 },
  'gilt-10y': { value: 4.18, status: 'context', change30d: 0.04, percentile10y: 0.62 },
  'euro-aaa-10y': { value: 2.65, status: 'context', change7d: 0.01, change30d: 0.03 },
  'boe-rate': {
    value: 4.75,
    status: 'context',
    percentile10y: 0.68,
    lastChange: { date: isoDay(-28), points: -0.25 },
    asOfDays: -28,
  },
  'boj-rate': { value: 0.25, status: 'context', percentile10y: 0.42, lastChange: { date: isoDay(-42), points: 0.15 } },
  'mortgage-30y': { value: 6.85, status: 'context', change7d: -0.05, change30d: -0.12, percentile10y: 0.74 },

  /* Global — dollar strength: the USD/TRY + the US−Japan 10y gap (the
   * M5 additions beside the existing usdjpy, eur-usd, usdcny, dollar-basket). */
  usdtry: { value: 34.18, status: 'context', change7d: 0.4, change30d: 1.2, percentile10y: 0.97 },
  'us-japan-10y-gap': { value: 3.89, status: 'normal', change30d: 0.06, percentile10y: 0.58 },

  /* Global — growth health: the M4..M7 wave — the early-warning pack +
   * the OECD CLI trio + the China CPI + the EPU + the GPR + the
   * recession probability. */
  'us-gdp-growth': {
    value: 2.4,
    status: 'context',
    periodStart: Q.periodStart,
    periodEnd: Q.periodEnd,
    releaseDate: Q.releaseDate,
  },
  'us-nfp': { value: 227.0, status: 'context', change30d: 12.0 },
  'us-pce-core-yoy': { value: 2.7, status: 'normal', percentile10y: 0.66, change30d: -0.1 },
  'us-wages': { value: 4.1, status: 'context', change30d: 0.0 },
  'recession-probability': { value: 4.3, status: 'normal', percentile10y: 0.18 },
  'michigan-sentiment': { value: 71.6, status: 'normal', percentile10y: 0.32, change30d: -1.4 },
  'michigan-1y-expectations': { value: 3.1, status: 'context', change30d: 0.1 },
  'initial-jobless-claims': { value: 221.0, status: 'normal', percentile10y: 0.41, change7d: -3.0 },
  'job-openings': { value: 7.8, status: 'context', change30d: -0.2 },
  'retail-sales': { value: 710.0, status: 'context', change30d: 0.4 },
  'housing-permits': { value: 1428.0, status: 'context', change30d: -1.2 },
  cfnai: { value: -0.21, status: 'context', change30d: 0.08 },
  'oecd-cli-us': { value: 101.0, status: 'normal', change30d: 0.1, percentile10y: 0.54 },
  'oecd-cli-cn': { value: 99.2, status: 'context', change30d: -0.1 },
  'oecd-cli-de': { value: 99.5, status: 'context', change30d: 0.0 },
  'china-cpi': { value: 0.4, status: 'normal', percentile10y: 0.22, change30d: -0.1 },
  'epu-us': { value: 218.9, status: 'context', change30d: -22.4 },

  /* Global — market stress: the M6 weekly additions + the CFTC + the GPR. */
  walcl: { value: 7_240_000, status: 'context', change30d: -8_400, percentile10y: 0.78 },
  'cftc-gold-positioning': { value: 49.7, status: 'warning', change30d: 1.2, percentile10y: 0.92, moveScore: 0.7 },
  'gpr-index': { value: 146.2, status: 'context', change30d: -8.4, percentile10y: 0.68 },

  /* Global — prices heat: the M6 wave — the breakeven/food/wheat/maize/
   * natgas/wti/platinum + the EIA stocks + the gold-oil ratio + the
   * euro-area HICP + the 10y breakeven. */
  'breakeven-10y': { value: 2.34, status: 'context', change7d: 0.0, change30d: -0.01 },
  t5yie: { value: 2.47, status: 'context', change7d: 0.01, change30d: 0.02 },
  wti: { value: 70.2, status: 'context', change7d: -2.3, change30d: -7.1, percentile10y: 0.19 },
  natgas: { value: 2.84, status: 'context', change7d: 0.05, change30d: 0.18, percentile10y: 0.34 },
  'eia-crude-stocks': { value: 427.0, status: 'context', change30d: -2.1 },
  platinum: { value: 1010.5, status: 'context', change7d: 0.9, change30d: 3.4, percentile10y: 0.62 },
  'gold-oil-ratio': { value: 53.2, status: 'context', change30d: 1.8 },
  'euro-hicp': { value: 2.4, status: 'normal', percentile10y: 0.58, change30d: -0.1 },
  'food-index': { value: 102.3, status: 'context', change30d: -0.4 },
  wheat: { value: 568.5, status: 'context', change30d: -1.2 },
  maize: { value: 423.0, status: 'context', change30d: -0.8 },
};

/** Default asOf by cadence (ABS/RBA are month/quarter-START dated).
 * v3 §4: dailies sit at T-1 — the freshest daily peer set — so only the
 * deliberate delayed row (usdjpy, -4) can wear the Delayed tier (see the
 * header note: a T-2 default flapped with the trading-day rule across
 * weekends). */
function defaultAsOfDays(cadence: Def['cadence']): number {
  switch (cadence) {
    case 'daily':
      return -1;
    case 'weekly':
      return -6;
    case 'monthly':
      return -12; // previous-month print, released mid-month
    case 'quarterly':
      return -45;
    default:
      return -7;
  }
}

function buildReadings(): IndicatorReading[] {
  const readings: IndicatorReading[] = [];
  for (const def of DEFINITIONS) {
    const spec = ROWS[def.id];
    if (!spec) throw new Error(`build-fixtures: no row spec for '${def.id}' — the table must cover every definition`);
    const unavailable = spec.status === 'unavailable';
    const asOf =
      spec.periodStart !== undefined
        ? spec.periodStart
        : unavailable
          ? null
          : isoDay(spec.asOfDays ?? defaultAsOfDays(def.cadence));
    const reading: IndicatorReading = {
      id: def.id,
      value: unavailable ? null : spec.value,
      asOf,
      status: spec.status,
      sourceName: sourceNameOf(def),
      sourceUrl: sourceUrlOf(def),
      updatedAt: generatedAt,
    };
    if (!unavailable) {
      const extra: Record<string, unknown> = {};
      if (spec.change7d !== undefined) extra.change7d = spec.change7d;
      if (spec.change30d !== undefined) extra.change30d = spec.change30d;
      if (spec.change90d !== undefined) extra.change90d = spec.change90d;
      if (spec.percentile10y !== undefined) extra.percentile10y = spec.percentile10y;
      if (spec.moveScore !== undefined) extra.moveScore = spec.moveScore;
      if (spec.fromPeak10y !== undefined) extra.fromPeak10y = spec.fromPeak10y;
      if (spec.ma200GapPct !== undefined) extra.ma200GapPct = spec.ma200GapPct;
      if (spec.peak !== undefined) extra.peak = spec.peak;
      if (spec.periodStart !== undefined) extra.periodStart = spec.periodStart;
      if (spec.periodEnd !== undefined) extra.periodEnd = spec.periodEnd;
      if (spec.releaseDate !== undefined) extra.releaseDate = spec.releaseDate;
      if (spec.nextReleaseToday !== undefined) extra.nextReleaseToday = spec.nextReleaseToday;
      if (spec.lastChange !== undefined) extra.lastChange = spec.lastChange;
      if (spec.decidedDate !== undefined) extra.decidedDate = spec.decidedDate;
      if (spec.rangeLow !== undefined) extra.rangeLow = spec.rangeLow;
      if (spec.rangeHigh !== undefined) extra.rangeHigh = spec.rangeHigh;
      if (spec.highestSinceYear !== undefined) extra.highestSinceYear = spec.highestSinceYear;
      if (spec.gapLegs !== undefined) extra.gapLegs = spec.gapLegs;
      if (spec.flag !== undefined) extra.flag = spec.flag;
      if (spec.note !== undefined) extra.note = spec.note;
      Object.assign(reading, extra);
    }
    readings.push(reading);
  }
  return readings;
}

/* ------------------------------------------------------------------ *
 * Calendar — 7 FUTURE events, every key kind, tz fields (fix spec C-07).
 * v3 UI-47 (2026-10-20, PH6-C): the strip now shows FIVE events (was
 * three), so the fixture carries seven — five in the strip + two behind
 * the "Full calendar" expansion (U-12 pins both). Every tz value mirrors
 * data/insights-calendar.json's zones (Australia/Sydney,
 * America/New_York, Europe/Frankfurt — the ECB decision was Berlin in the
 * old fixture; Frankfurt is the value the real data carries).
 * ------------------------------------------------------------------ */

const ym = (offset: number): string => isoDay(offset).slice(0, 7).replace('-', '');

const calendar: CalendarEvent[] = [
  {
    id: `rba-${ym(1)}`,
    date: isoDay(1),
    titleEn: 'RBA cash rate decision',
    titleFa: 'تصمیم نرخ بهره رزرو بانک استرالیا',
    kind: 'rba',
    tz: 'Australia/Sydney',
  },
  {
    id: `us-cpi-${ym(3)}`,
    date: isoDay(3),
    titleEn: 'US CPI (monthly)',
    titleFa: 'شاخص قیمت مصرفی آمریکا (ماهانه)',
    kind: 'us-cpi',
    tz: 'America/New_York',
  },
  {
    id: `fed-${ym(8)}`,
    date: isoDay(8),
    titleEn: 'Fed interest rate decision (FOMC)',
    titleFa: 'تصمیم نرخ بهره فدرال رزرو (فومک)',
    kind: 'fed',
    tz: 'America/New_York',
  },
  {
    id: `abs-jobs-${ym(14)}`,
    date: isoDay(14),
    titleEn: 'ABS jobs report',
    titleFa: 'گزارش اشتغال اداره آمار استرالیا',
    kind: 'abs-jobs',
    tz: 'Australia/Sydney',
  },
  {
    id: `ecb-${ym(21)}`,
    date: isoDay(21),
    titleEn: 'ECB rate decision',
    titleFa: 'تصمیم نرخ بهره بانک مرکزی اروپا',
    kind: 'ecb',
    tz: 'Europe/Frankfurt',
  },
  {
    id: `abs-cpi-${ym(28)}`,
    date: isoDay(28),
    titleEn: 'ABS monthly CPI',
    titleFa: 'شاخص قیمت ماهانهٔ اداره آمار استرالیا',
    kind: 'abs-cpi',
    tz: 'Australia/Sydney',
  },
  {
    id: `us-jobs-${ym(35)}`,
    date: isoDay(35),
    titleEn: 'US jobs report (Employment Situation)',
    titleFa: 'گزارش وضعیت بازار کار آمریکا',
    kind: 'us-jobs',
    tz: 'America/New_York',
  },
];

const changedThisWeek: ChangedEvent[] = [
  { id: 'us10y', from: 'normal', to: 'warning', asOf: isoDay(-1) },
];

const readings = buildReadings();

/**
 * The summary lines computed FROM the fixture readings — warning/normal
 * vote, everything else is excluded — so the snapshot is internally
 * consistent (the same honesty the /api/insights builder guarantees;
 * the page renders its hero from the gauge engine either way).
 */
const SECTION_OF = new Map(DEFINITIONS.map((def) => [def.id, def.section] as const));

function summaryLineFor(section: InsightsSection): SummaryLine {
  const own = readings.filter((r) => SECTION_OF.get(r.id) === section);
  const voting = own.filter((r) => r.status === 'warning' || r.status === 'normal');
  return {
    section,
    label: 'cautious',
    warningCount: own.filter((r) => r.status === 'warning').length,
    votingCount: voting.length,
    excludedCount: own.length - voting.length,
  };
}

const snapshot: InsightsSnapshot = {
  generatedAt,
  pricesAsOf: generatedAt,
  summary: {
    global: summaryLineFor('global'),
    australia: summaryLineFor('australia'),
  },
  readings,
  changedThisWeek,
  calendar,
  ruleVersion: 2,
  // displayMode deliberately ABSENT: the full private snapshot — the page
  // shows every section (U-11 needs the world stock markets board).
};

/* ------------------------------------------------------------------ *
 * Run status (About this data) — one failed source + one flagged test,
 * mirroring the china-pmi manual expiry and the held STLFSI reading.
 * ------------------------------------------------------------------ */

const status = {
  v: 1 as const,
  generatedAt,
  mode: 'scheduled' as const,
  dryRun: false,
  sources: [
    { source: 'fred', ok: true, detail: '15 series fetched' },
    { source: 'ecb', ok: true, detail: 'deposit facility rate fetched' },
    { source: 'frankfurter', ok: true, detail: '8 reference rates fetched' },
    { source: 'abs', ok: true, detail: '8 series fetched' },
    { source: 'rba', ok: true, detail: '7 series fetched' },
    { source: 'world-bank', ok: true, detail: 'pink sheet fetched' },
    { source: 'gold-api', ok: true, detail: '4 spot prices fetched' },
    { source: 'bitstamp', ok: true, detail: 'BTC-USD fetched' },
    { source: 'alternative-me', ok: true, detail: 'crypto fear & greed fetched' },
    { source: 'manual', ok: false, detail: 'china-pmi manual entry expired — reading held unavailable' },
  ],
  validation: [
    {
      test: 'T-04',
      name: 'No frozen daily values',
      ok: false,
      flagged: ['stress-stlfsi'],
      failures: ['stress-stlfsi: duplicate daily value held on its last good reading'],
    },
    {
      test: 'T-08',
      name: 'Hero equals the gauge counts',
      ok: true,
      flagged: [],
      failures: [],
    },
  ],
  ruleVersion: 2,
};

/* ------------------------------------------------------------------ *
 * Per-indicator history — a handful of plottable series (the rest 404
 * history_not_found at serve time, like single-point cards).
 * ------------------------------------------------------------------ */

function historyFor(id: IndicatorId, points: number, startDaysBack: number, endValue: number, drift: number): unknown {
  const rnd = noise(id.length * 7919 + points);
  const values: [number, number][] = [];
  for (let i = 0; i < points; i += 1) {
    const day = epochDay(-startDaysBack + Math.round((i * startDaysBack) / (points - 1)));
    const t = i / (points - 1);
    const value = endValue - drift * (1 - t) + (rnd() - 0.5) * Math.abs(drift) * 0.2;
    values.push([day, Math.round(value * 100) / 100]);
  }
  return { v: 1, id, points: values };
}

const histories: unknown[] = [
  historyFor('us10y', 40, 720, 5.31, 1.2),
  historyFor('vix', 40, 720, 17.8, 6),
  historyFor('au-cpi', 24, 1440, 3.9, 1.5), // quarterly → ~4 years back
  // 2026-10-21 owner round (the prices board's period switch): the four
  // PRICE assets get DENSE daily series (one point per calendar day) so
  // every lens the switch speaks computes an honest window: the 1-day
  // reference (pick(1)'s ±3-day tolerance) and the 7/30/90/365-day windows
  // all land exactly on stored observations. (The old 40-point series
  // spaced ~18 days apart could only answer the sparse-window honest
  // "unavailable" — the switch deserved real data.)
  // 2026-10-27 owner round ("add five year and 3 months to all view
  // points"): the series grow to 1,901 points over 1,900 days (~5.2
  // years) — the 1,826-day 5-year window anchors with margin, mirroring
  // the widened PUBLIC_HISTORY_WINDOW_DAYS the route now serves.
  historyFor('gold-usd', 1901, 1900, 3870.4, 900),
  historyFor('silver-usd', 1901, 1900, 47.2, 9),
  historyFor('brent', 1901, 1900, 74.5, 12),
  historyFor('btc-usd', 1901, 1900, 91500, 24000),
];

/* ------------------------------------------------------------------ *
 * World stock markets — all 16 board rows, the four L2-01 state words
 * (Near its high / Pullback / Correction / Bear market) with EXACTLY FOUR
 * markets per band and summary counts consistent with the rows. U-11's
 * target. The band a row lands in is derived on the page from fromHigh
 * alone (config/labels.ts statusWordKeyOf: > -5 Near its high · -5..-10
 * Pullback · -10..-20 Correction · ≤ -20 Bear market), so the targets
 * below place 4 of the 16 markets in each band.
 * ------------------------------------------------------------------ */

/** fromHigh targets per market (≤ 0): 4 rows in each of the four bands. */
const FROM_HIGH: Record<string, number> = {
  n225: -11.5, // Correction
  asx200: -1.2, // Near its high
  kospi: -4.4, // Near its high
  hsi: -7.2, // Pullback
  ssec: -14.8, // Correction
  taiex: -8.8, // Pullback
  nifty50: -5.6, // Pullback
  stoxx50: -21.6, // Bear market
  dax: -12.2, // Correction
  cac: -16.7, // Correction
  ftse: -20.8, // Bear market
  sp500: -2.1, // Near its high
  ndx: -6.4, // Pullback
  dow: -3.5, // Near its high
  tsx: -22.7, // Bear market
  ibov: -24.6, // Bear market
};

const CLOSE: Record<string, number> = {
  n225: 38450.2,
  asx200: 8321.4,
  kospi: 2568.9,
  hsi: 19842.6,
  ssec: 3312.8,
  taiex: 22105.5,
  nifty50: 24118.3,
  stoxx50: 4892.7,
  dax: 18654.1,
  cac: 7298.4,
  ftse: 8164.9,
  sp500: 5624.3,
  ndx: 19482.5,
  dow: 41239.7,
  tsx: 23184.2,
  ibov: 118924.6,
};

const CHG1D: Record<string, number> = {
  n225: -0.8, asx200: 0.4, kospi: 1.1, hsi: -1.4, ssec: 0.2, taiex: 0.6, nifty50: 0.9,
  stoxx50: -0.5, dax: -0.9, cac: -0.3, ftse: 0.1, sp500: 0.7, ndx: 1.0, dow: 0.5, tsx: -0.2, ibov: -1.8,
};

const CHG3M: Record<string, number> = {
  n225: -9.2, asx200: 2.8, kospi: 4.5, hsi: -5.4, ssec: -1.9, taiex: 3.2, nifty50: 5.6,
  stoxx50: -3.8, dax: -6.4, cac: -8.1, ftse: -0.9, sp500: 3.4, ndx: 1.2, dow: 2.6, tsx: 1.8, ibov: -14.2,
};

/**
 * World-markets MAP (world-markets-map-spec.md D1/D2): the fixture carries
 * the quote-freshness fields so the map exercises BOTH market states in
 * every screenshot run — S&P 500 and Nifty 50 answer as OPEN (their
 * quoteTime is this build's generatedAt, minutes old at capture time),
 * every other market honestly Closed like the EOD production cadence.
 * The dynamic §9 state tests mock their own payloads; this static fixture
 * only needs to be visually complete.
 */
const MAP_OPEN: Record<string, boolean> = { sp500: true, nifty50: true };

function buildMarkets(): { markets: MarketEntry[]; summary: Record<string, unknown> } {
  const asOf = isoDay(-2); // a weekday close two days back
  const markets: MarketEntry[] = MARKETS.map((m) => {
    const close = CLOSE[m.id]!;
    const targetFromHigh = FROM_HIGH[m.id]!;
    const high52w = Math.round((close / (1 + targetFromHigh / 100)) * 100) / 100;
    const low52w = Math.round(close * 0.72 * 100) / 100;
    const rangePos = Math.round(((close - low52w) / (high52w - low52w)) * 1000) / 10;
    const chg3m = CHG3M[m.id]!;
    // Weekly closes for the detail chart: 8 points ending at the last close,
    // delta-encoded from the 2020-01-01 weekly epoch base.
    const weekly: [number, number][] = [];
    const WEEKLY_EPOCH_BASE = Math.floor(Date.UTC(2020, 0, 1) / DAY_MS);
    const lastDay = epochDay(-2);
    for (let i = 7; i >= 0; i -= 1) {
      const day = lastDay - i * 7;
      const t = (7 - i) / 7;
      const w = Math.round(close * (1 + (targetFromHigh / 100) * 0.4 * (1 - t)) * 100) / 100;
      weekly.push([i === 7 ? day - WEEKLY_EPOCH_BASE : 7, w]);
    }
    return {
      id: m.id,
      asOf,
      close,
      chg1d: CHG1D[m.id]!,
      chg1m: Math.round((chg3m / 3) * 10) / 10,
      // Restored with the full lens table (owner directive, 2026-10-20):
      // the 1-week and 1-year synthetic lenses return so the visual page
      // exercises the restored columns with numbers, like production rows
      // (the contract keeps both optional — a missing lens renders a dash,
      // never a guess).
      chg1w: Math.round((chg3m / 13) * 100) / 100,
      chg1y: Math.round(chg3m * 3.2 * 10) / 10,
      // 2026-10-27 owner round ("add five year and 3 months to all view
      // points"): the synthetic 5-year lens joins (chg3m × 7.5 — a
      // plausible five-year compounding of the quarterly move) so the
      // visual page exercises the new switch lens, card cells, table
      // column and CSV export with numbers, like production rows (the
      // contract keeps it optional — a missing lens renders a dash).
      chg5y: Math.round(chg3m * 7.5 * 10) / 10,
      chg3m,
      high52w,
      low52w,
      fromHigh: Math.round(((close / high52w - 1) * 100) * 100) / 100,
      rangePos,
      trend: chg3m > 1 ? ('up' as const) : chg3m < -1 ? ('down' as const) : ('flat' as const),
      status: targetFromHigh > -10 ? ('normal' as const) : targetFromHigh > -20 ? ('correction' as const) : ('bear' as const),
      source: 'eodhd' as const,
      stale: false,
      // MAP D1/D2 (see MAP_OPEN above): every row carries the quote time
      // (this build's clock — minutes old at capture), the two OPEN rows
      // say so, the rest stay honestly Closed.
      quoteTime: generatedAt,
      open: MAP_OPEN[m.id] === true,
      weekly,
    };
  });
  const nAttention = markets.filter((m) => m.status === 'correction').length;
  const nUnusual = markets.filter((m) => m.status === 'bear').length;
  const roseToday = markets.filter((m) => m.chg1d > 0).length;
  const groupOf = (id: string): string => MARKETS.find((m) => m.id === id)!.group;
  const worst = new Map<string, number>();
  for (const m of markets) {
    if (m.status === 'correction' || m.status === 'bear') {
      const g = groupOf(m.id);
      worst.set(g, (worst.get(g) ?? 0) + 1);
    }
  }
  const worstGroup = [...worst.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    markets,
    summary: {
      count: markets.length,
      roseToday,
      nAttention,
      nUnusual,
      signal: nUnusual > 0 ? 'unusual' : nAttention > 0 ? 'attention' : 'normal',
      worstGroup,
    },
  };
}

const marketsBuilt = buildMarkets();
const marketsSnapshot = {
  v: 1 as const,
  generatedAt,
  markets: marketsBuilt.markets,
  summary: marketsBuilt.summary,
};

/* ------------------------------------------------------------------ *
 * Validate EVERYTHING against THE contracts, then write.
 * The snapshot parse is the required build-time gate.
 * ------------------------------------------------------------------ */

/** zod's own generic (zod is @currena/web's dependency) — validate returns
 * the PARSED value typed, so the snapshot needs no cast at the call site. */
function validate<T>(schema: ZodType<T>, label: string, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    // Fixtures are synthetic — no secrets, safe to print the zod issues.
    console.error(`✗ ${label} failed its contract check`);
    console.error(JSON.stringify(parsed.error.issues, null, 2));
    process.exit(1);
  }
  return parsed.data;
}

const checkedSnapshot = validate(InsightsSnapshotSchema, 'snapshot', snapshot);
validate(InsightsStatusSchema, 'status', status);
validate(MarketsSnapshotSchema, 'markets', marketsSnapshot);
for (const h of histories) validate(IndicatorHistorySchema, 'history', h);

/* ------------------------------------------------------------------ *
 * Low-readable VARIANT snapshot (v3 UI_SPEC §9 UI-40, task PH6-B,
 * 2026-10-20) — the same synthetic board with two gold/silver driver
 * readings degraded so the U-09a honesty test can pin the level beam:
 *
 *   real-yield-10y  → stale (asOf 10 days back)
 *   breakeven-5y5y  → check-pending (the T-04 duplicate flag)
 *
 * With the base fixture's held STLFSI + stale dollar-basket + unavailable
 * china-pmi, both metals drop to ONE readable scored condition (their own
 * footing) — under the 3-readable floor, so the beam must stay level and
 * show "Not enough readable conditions to weigh" while the missing-data
 * line still states "1 of 5 / 6 conditions readable".
 *
 * Served ONLY by the U-09a test's own request interception — the fixture
 * server never hands this variant out, so no other U-test can see it.
 * ------------------------------------------------------------------ */

const lowReadableReadings = readings.map((r): IndicatorReading => {
  if (r.id === 'real-yield-10y') {
    return { ...r, status: 'stale', asOf: isoDay(-10) };
  }
  if (r.id === 'breakeven-5y5y') {
    return {
      ...r,
      status: 'check-pending',
      flag: { test: 'T-04', reason: 'Duplicate daily value held pending verification' },
    };
  }
  return r;
});
const snapshotLowReadable: InsightsSnapshot = { ...snapshot, readings: lowReadableReadings };
const checkedLowReadable = validate(InsightsSnapshotSchema, 'snapshot-low-readable', snapshotLowReadable);

mkdirSync(FIXTURES_DIR, { recursive: true });
writeFileSync(path.join(FIXTURES_DIR, 'snapshot.json'), `${JSON.stringify(checkedSnapshot, null, 2)}\n`);
writeFileSync(path.join(FIXTURES_DIR, 'snapshot-low-readable.json'), `${JSON.stringify(checkedLowReadable, null, 2)}\n`);
writeFileSync(path.join(FIXTURES_DIR, 'status.json'), `${JSON.stringify(status, null, 2)}\n`);
writeFileSync(path.join(FIXTURES_DIR, 'markets.json'), `${JSON.stringify(marketsSnapshot, null, 2)}\n`);
for (const h of histories) {
  const { id } = h as { id: IndicatorId };
  writeFileSync(path.join(FIXTURES_DIR, `history-${id}.json`), `${JSON.stringify(h, null, 2)}\n`);
}

const statusCounts = checkedSnapshot.readings.reduce<Record<string, number>>((acc, r) => {
  acc[r.status] = (acc[r.status] ?? 0) + 1;
  return acc;
}, {});
console.log(
  `✓ fixtures written to ${FIXTURES_DIR}: ${checkedSnapshot.readings.length} readings ` +
    `(${Object.entries(statusCounts).map(([k, v]) => `${k}:${v}`).join(', ')}), ` +
    `${calendar.length} future calendar events, ${marketsSnapshot.markets.length} market rows, ` +
    `${histories.length} history series, 1 low-readable variant.`,
);
