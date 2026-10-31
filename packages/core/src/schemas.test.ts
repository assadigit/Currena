import { describe, expect, it } from 'vitest';

import {
  CACHE_HARD_TTL_SEC,
  FRESH_TTL_SEC_BY_SOURCE,
  MIN_SCRAPE_INTERVAL_SEC,
  freshTtlSec,
  GoldQuoteSchema,
  RateSchema,
  RatesErrorSchema,
  RatesResponseSchema,
  SnapshotSchema,
  SourceConfigSchema,
  SourceStatusSchema,
  sourceForPair,
} from './schemas';

/** A realistic TGJU-style snapshot (matches the live legacy observation 2026-09-16: 1 USD = 230,500 Toman). */
const validSnapshot = {
  base: 'USD',
  source: 'tgju',
  fetchedAt: '2026-09-16T17:26:10.906Z',
  rates: [
    { code: 'USD', name: 'US Dollar', rate: 1 },
    { code: 'IRR', name: 'Iranian Rial', rate: 230500, unit: 'TOMAN' },
    { code: 'EUR', name: 'Euro', rate: 0.92 },
  ],
};

describe('RateSchema', () => {
  it('accepts a valid rate', () => {
    expect(RateSchema.safeParse({ code: 'USD', name: 'US Dollar', rate: 1 }).success).toBe(true);
  });

  it('accepts IRR with unit TOMAN (canonical form, AGENTS.md §6)', () => {
    const parsed = RateSchema.safeParse({ code: 'IRR', name: 'Iranian Rial', rate: 230500, unit: 'TOMAN' });
    expect(parsed.success).toBe(true);
  });

  it('rejects IRR with unit RIAL', () => {
    const parsed = RateSchema.safeParse({ code: 'IRR', name: 'Iranian Rial', rate: 230500, unit: 'RIAL' });
    expect(parsed.success).toBe(false);
  });

  it("rejects unit TOMAN on a non-IRR code", () => {
    const parsed = RateSchema.safeParse({ code: 'USD', name: 'US Dollar', rate: 1, unit: 'TOMAN' });
    expect(parsed.success).toBe(false);
  });

  it('rejects negative, zero and non-finite rates', () => {
    expect(RateSchema.safeParse({ code: 'USD', name: 'US Dollar', rate: -1 }).success).toBe(false);
    expect(RateSchema.safeParse({ code: 'USD', name: 'US Dollar', rate: 0 }).success).toBe(false);
    expect(RateSchema.safeParse({ code: 'USD', name: 'US Dollar', rate: Number.POSITIVE_INFINITY }).success).toBe(false);
    expect(RateSchema.safeParse({ code: 'USD', name: 'US Dollar', rate: Number.NaN }).success).toBe(false);
  });

  it('rejects lowercase / wrong-length codes and empty names', () => {
    expect(RateSchema.safeParse({ code: 'usd', name: 'US Dollar', rate: 1 }).success).toBe(false);
    expect(RateSchema.safeParse({ code: 'US', name: 'US Dollar', rate: 1 }).success).toBe(false);
    expect(RateSchema.safeParse({ code: 'USDD', name: 'US Dollar', rate: 1 }).success).toBe(false);
    expect(RateSchema.safeParse({ code: 'USD', name: '', rate: 1 }).success).toBe(false);
  });

  it('accepts TGJU day stats and strips nothing (quote-side, optional)', () => {
    const parsed = RateSchema.safeParse({
      code: 'USD',
      name: 'US Dollar',
      rate: 1 / 230_500,
      dayHigh: 230_520,
      dayLow: 227_860,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dayHigh).toBe(230_520);
      expect(parsed.data.dayLow).toBe(227_860);
    }
  });

  it('rejects negative, zero and non-finite day stats', () => {
    for (const dayHigh of [-1, 0, Number.POSITIVE_INFINITY, Number.NaN]) {
      expect(RateSchema.safeParse({ code: 'USD', name: 'US Dollar', rate: 1, dayHigh }).success).toBe(false);
    }
    for (const dayLow of [-1, 0, Number.POSITIVE_INFINITY, Number.NaN]) {
      expect(RateSchema.safeParse({ code: 'USD', name: 'US Dollar', rate: 1, dayLow }).success).toBe(false);
    }
  });
});

describe('SnapshotSchema', () => {
  it('accepts a valid snapshot (incl. optional expiresAt)', () => {
    expect(SnapshotSchema.safeParse(validSnapshot).success).toBe(true);
    expect(
      SnapshotSchema.safeParse({ ...validSnapshot, expiresAt: '2026-09-23T17:26:10.906Z' }).success,
    ).toBe(true);
  });

  it('rejects an empty rates array', () => {
    expect(SnapshotSchema.safeParse({ ...validSnapshot, rates: [] }).success).toBe(false);
  });

  it("rejects manual/local as a snapshot source (upstream providers only)", () => {
    expect(SnapshotSchema.safeParse({ ...validSnapshot, source: 'manual' }).success).toBe(false);
    expect(SnapshotSchema.safeParse({ ...validSnapshot, source: 'local' }).success).toBe(false);
  });

  it('rejects garbage datetimes and any invalid rate inside the array', () => {
    expect(SnapshotSchema.safeParse({ ...validSnapshot, fetchedAt: '2026-09-16 17:26' }).success).toBe(false);
    expect(
      SnapshotSchema.safeParse({
        ...validSnapshot,
        rates: [...validSnapshot.rates, { code: 'gbp', name: 'British Pound', rate: 0.79 }],
      }).success,
    ).toBe(false);
  });

  it('accepts an optional gold array (TGJU display commodities) and keeps it absent-friendly', () => {
    const gold = [
      { id: 'gold-ounce', unit: 'USD', price: 4383.45, dayHigh: 4383.45, dayLow: 4377.04, changePct: 0.05 },
      { id: 'gold-18k', unit: 'TOMAN', price: 23363000, dayHigh: 23499500, dayLow: 23210900, changePct: 0 },
      { id: 'coin-emami', unit: 'TOMAN', price: 231985000 },
    ];
    const withGold = SnapshotSchema.safeParse({ ...validSnapshot, gold });
    expect(withGold.success).toBe(true);
    // Legacy snapshots (pre-gold KV entries) stay valid: gold is optional.
    expect(SnapshotSchema.safeParse(validSnapshot).success).toBe(true);
    // Any invalid gold item poisons the snapshot (loud, never garbage).
    expect(SnapshotSchema.safeParse({ ...validSnapshot, gold: [...gold, { id: 'gold-18k', unit: 'EUR', price: 1 }] }).success).toBe(false);
    expect(SnapshotSchema.safeParse({ ...validSnapshot, gold: [{ id: 'gold-18k', unit: 'TOMAN', price: -1 }] }).success).toBe(false);
  });
});

describe('GoldQuoteSchema', () => {
  it('accepts the real live shapes: USD ounce with decimals, Toman items with 0% change', () => {
    const ounce = GoldQuoteSchema.safeParse({
      id: 'gold-ounce',
      unit: 'USD',
      price: 4383.45,
      dayHigh: 4383.45,
      dayLow: 4377.04,
      changePct: 0.05,
    });
    expect(ounce.success).toBe(true);
    const gram18 = GoldQuoteSchema.safeParse({
      id: 'gold-18k',
      unit: 'TOMAN',
      price: 23363000,
      dayHigh: 23499500,
      dayLow: 23210900,
      changePct: 0,
    });
    expect(gram18.success).toBe(true);
  });

  it('allows a NEGATIVE changePct (market down) but non-finite garbage is rejected', () => {
    expect(GoldQuoteSchema.safeParse({ id: 'coin-bahar', unit: 'TOMAN', price: 228105000, changePct: -0.42 }).success).toBe(true);
    expect(GoldQuoteSchema.safeParse({ id: 'coin-bahar', unit: 'TOMAN', price: 228105000, changePct: Number.NaN }).success).toBe(false);
  });

  it('rejects unknown item ids and unknown units', () => {
    expect(GoldQuoteSchema.safeParse({ id: 'gold-999k', unit: 'TOMAN', price: 1 }).success).toBe(false);
    expect(GoldQuoteSchema.safeParse({ id: 'gold-18k', unit: 'RIAL', price: 1 }).success).toBe(false);
  });

  it('rejects negative / zero / non-finite prices and day stats', () => {
    for (const price of [-1, 0, Number.POSITIVE_INFINITY, Number.NaN]) {
      expect(GoldQuoteSchema.safeParse({ id: 'coin-gram', unit: 'TOMAN', price }).success).toBe(false);
    }
    expect(GoldQuoteSchema.safeParse({ id: 'coin-gram', unit: 'TOMAN', price: 1, dayHigh: -5 }).success).toBe(false);
    expect(GoldQuoteSchema.safeParse({ id: 'coin-gram', unit: 'TOMAN', price: 1, dayLow: 0 }).success).toBe(false);
  });
});

describe('RatesResponseSchema', () => {
  it('accepts a live response', () => {
    const parsed = RatesResponseSchema.safeParse({ snapshot: validSnapshot, stale: false, servedFrom: 'live' });
    expect(parsed.success).toBe(true);
  });

  it('accepts a stale cached response with notice', () => {
    const parsed = RatesResponseSchema.safeParse({
      snapshot: validSnapshot,
      stale: true,
      notice: 'Using cached rates — last updated 5 minutes ago',
      servedFrom: 'cache',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a bogus servedFrom and a missing snapshot', () => {
    expect(
      RatesResponseSchema.safeParse({ snapshot: validSnapshot, stale: false, servedFrom: 'memory' }).success,
    ).toBe(false);
    expect(RatesResponseSchema.safeParse({ stale: false, servedFrom: 'live' }).success).toBe(false);
  });
});

describe('RatesErrorSchema', () => {
  it('accepts a valid error envelope', () => {
    const parsed = RatesErrorSchema.safeParse({
      error: { code: 'source_unavailable', message: 'TGJU is unreachable', retryAfterSec: 30 },
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects empty code/message and non-positive retryAfterSec', () => {
    expect(RatesErrorSchema.safeParse({ error: { code: '', message: 'x' } }).success).toBe(false);
    expect(RatesErrorSchema.safeParse({ error: { code: 'x', message: '' } }).success).toBe(false);
    expect(
      RatesErrorSchema.safeParse({ error: { code: 'x', message: 'y', retryAfterSec: 0 } }).success,
    ).toBe(false);
    expect(
      RatesErrorSchema.safeParse({ error: { code: 'x', message: 'y', retryAfterSec: 1.5 } }).success,
    ).toBe(false);
  });
});

describe('SourceConfigSchema', () => {
  const valid = {
    source: 'tgju',
    baseUrl: 'https://www.tgju.org/',
    currencies: ['USD', 'IRR', 'EUR'],
    timeoutMs: 8000,
    retries: 2,
    freshTtlSec: 300,
    minIntervalSec: 60,
  };

  it('accepts a valid config', () => {
    expect(SourceConfigSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects non-URL baseUrls, empty currency lists and bad numerics', () => {
    expect(SourceConfigSchema.safeParse({ ...valid, baseUrl: 'not a url' }).success).toBe(false);
    expect(SourceConfigSchema.safeParse({ ...valid, currencies: [] }).success).toBe(false);
    expect(SourceConfigSchema.safeParse({ ...valid, timeoutMs: 0 }).success).toBe(false);
    expect(SourceConfigSchema.safeParse({ ...valid, retries: -1 }).success).toBe(false);
    expect(SourceConfigSchema.safeParse({ ...valid, freshTtlSec: 1.5 }).success).toBe(false);
    expect(SourceConfigSchema.safeParse({ ...valid, source: 'manual' }).success).toBe(false);
  });
});

describe('timing constants (mission §5/§6 ladder)', () => {
  it('are the mission-mandated values', () => {
    // Per-source freshness (I12): tgju keeps the 5-min open-market window;
    // frankfurter gets 15 min aligned with the quarter-hour cron refresh
    // (2026-10-07 incident — closes the fetch-context stale windows).
    expect(FRESH_TTL_SEC_BY_SOURCE.tgju).toBe(300);
    expect(FRESH_TTL_SEC_BY_SOURCE.frankfurter).toBe(900);
    expect(freshTtlSec('tgju')).toBe(300);
    expect(freshTtlSec('frankfurter')).toBe(900);
    expect(MIN_SCRAPE_INTERVAL_SEC).toBe(60);
    expect(CACHE_HARD_TTL_SEC).toBe(7 * 24 * 3600);
    expect(CACHE_HARD_TTL_SEC).toBe(604800);
  });
});

describe('SourceStatusSchema (KV trust boundary)', () => {
  const valid = {
    source: 'tgju',
    lastScrapeAt: '2026-09-16T12:00:00.000Z',
    lastSuccessAt: '2026-09-16T12:00:00.000Z',
    lastError: { code: 'tgju_scrape_failed', message: 'boom', at: '2026-09-16T11:00:00.000Z' },
    lastDurationMs: 321,
  };

  it('accepts a fully-populated status', () => {
    expect(SourceStatusSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts the minimal shape (source only)', () => {
    expect(SourceStatusSchema.safeParse({ source: 'frankfurter' }).success).toBe(true);
  });

  it('rejects non-source enums, bad datetimes, negative/infinite durations', () => {
    expect(SourceStatusSchema.safeParse({ source: 'manual' }).success).toBe(false);
    expect(SourceStatusSchema.safeParse({ ...valid, lastScrapeAt: '2026-09-16 12:00' }).success).toBe(false);
    expect(SourceStatusSchema.safeParse({ ...valid, lastDurationMs: -1 }).success).toBe(false);
    expect(SourceStatusSchema.safeParse({ ...valid, lastDurationMs: Number.POSITIVE_INFINITY }).success).toBe(false);
    expect(SourceStatusSchema.safeParse({ ...valid, lastDurationMs: Number.NaN }).success).toBe(false);
  });

  it('requires complete lastError records', () => {
    expect(SourceStatusSchema.safeParse({ ...valid, lastError: { code: 'x' } }).success).toBe(false);
    expect(SourceStatusSchema.safeParse({ ...valid, lastError: { code: 'x', message: '', at: '2026-09-16T11:00:00.000Z' } }).success).toBe(false);
  });

  it('strips unknown keys (no passthrough, no pollution surface)', () => {
    const parsed = SourceStatusSchema.parse({ ...valid, injected: '__proto__ pollutant' });
    expect(parsed).not.toHaveProperty('injected');
  });
});

describe('sourceForPair (rule-8 routing)', () => {
  it('routes anything touching IRR to tgju (either side, both orders)', () => {
    expect(sourceForPair('USD', 'IRR')).toBe('tgju');
    expect(sourceForPair('IRR', 'USD')).toBe('tgju');
    expect(sourceForPair('IRR', 'EUR')).toBe('tgju');
    expect(sourceForPair('AED', 'IRR')).toBe('tgju');
  });

  it('routes international-only pairs to frankfurter', () => {
    expect(sourceForPair('USD', 'EUR')).toBe('frankfurter');
    expect(sourceForPair('EUR', 'GBP')).toBe('frankfurter');
    expect(sourceForPair('JPY', 'TRY')).toBe('frankfurter');
  });
});

/* ------------------------------------------------------------------ *
 * Insights contracts (Phase I1)
 * ------------------------------------------------------------------ */

import {
  CalendarEventSchema,
  ChangedEventSchema,
  IndicatorDefinitionSchema,
  IndicatorHistorySchema,
  IndicatorIdSchema,
  IndicatorReadingSchema,
  IndicatorReadingStatusSchema,
  InsightsSnapshotSchema,
  InsightsSourceReportSchema,
  InsightsStatusSchema,
  GoldSummarySchema,
  SummaryLineSchema,
  WarningRuleSchema,
} from './schemas';

describe('Insights: IndicatorIdSchema (contract shape is deliberate)', () => {
  it('pins the exact indicator set — 102 ids (the 2026-10-25 M6 Wave-3 round adds the leading-edge batch: mortgage-30y, walcl, retail-sales, housing-permits, cfnai, job-openings, t5yie, us-wages, euro-hicp, au-housing-finance, au-saving-ratio, au-job-vacancies; the 2026-10-26 M7 round adds china-cpi on the NBS press-release automation — both OECD mirrors died upstream 2025-04; the 2026-10-29 owner round adds usdaed — the UAE dirham card; the 2026-10-31 Session-3 round adds breakeven-tilt — the G2 interplay card), blocked/licensed items absent', () => {
    const ids = IndicatorIdSchema.options;
    expect(ids).toHaveLength(102); // the 2026-10-26 gap-audit build adds yield-curve-10y3m (A-1), rba-fed-gap (A-5), us-japan-10y-gap (A-3), gold-oil-ratio (A-4), eia-crude-stocks (A-6), cftc-gold-positioning (A-7) + the monthly trio: oecd-cli-us/cn/de, gpr-index, epu-us (A-8/A-9/A-10); the 2026-10-29 owner round adds usdaed (Yahoo USD/AED daily closes); the 2026-10-31 Session-3 round adds breakeven-tilt (T5YIFR − T5YIE, derived, context-only — D-5)
    // Step-2 add-list §B5: VIX is IN (FRED VIXCLS, licence noted); the rest
    // of the v1 blocked list stays blocked.
    for (const blocked of ['spx-gold', 'breadth', 'cape']) {
      expect(ids).not.toContain(blocked);
    }
    expect(ids).not.toContain('dollar-broad'); // replaced by the Currena dollar basket (I15)
    expect(ids).not.toContain('eth-usd'); // retired 2026-10-21c (not a market-stress indicator)
    expect(ids).not.toContain('nzd-usd'); // retired 2026-10-23 OD-7 (an audience that doesn't exist)
    expect(ids).not.toContain('silver-btc'); // retired 2026-10-23 OD-7 (the weaker twin of gold-btc)
    for (const expected of ['yield-curve-10y2y', 'stress-stlfsi', 'nfci', 'fed-target', 'ecb-dfr', 'us-cpi-yoy', 'us-cpi-core-yoy', 'dollar-basket', 'au-home-loan', 'au-wage-growth', 'au-rent-yoy', 'au-petrol-yoy', 'btc-usd', 'copper-usd', 'eur-usd', 'gold-usd', 'silver-usd', 'gold-silver', 'china-pmi', 'china-cpi', 'rba-cash-rate', 'au-us-10y-gap', 'terms-of-trade', 'au-household-debt-arrears', 'au-10y', 'us-unemployment', 'sahm-rule', 'vix', 'au-deposit-rate', 'shiller-cape', 'shiller-ecy', 'wti', 'natgas', 'platinum', 'bund-10y', 'jgb-10y', 'gilt-10y', 'boj-rate', 'boe-rate', 'us-gdp-growth', 'us-nfp', 'initial-jobless-claims', 'recession-probability', 'michigan-sentiment', 'michigan-1y-expectations', 'us-pce-core-yoy', 'sofr', 'us-2y', 'breakeven-10y', 'euro-aaa-10y', 'food-index', 'wheat', 'maize', 'usdtry', 'usdaed', 'mortgage-30y', 'walcl', 'retail-sales', 'housing-permits', 'cfnai', 'job-openings', 't5yie', 'us-wages', 'euro-hicp', 'au-housing-finance', 'au-saving-ratio', 'au-job-vacancies', 'breakeven-tilt']) {
      expect(ids).toContain(expected);
    }
    // The OD-5 honest no-go (D-44, 2026-10-24): the ICE BofA credit-spread
    // ids never enter the contract — FRED's pre-approval licence class
    // fail-closes them before a card can exist.
    for (const blocked of ['hy-oas', 'ig-oas']) {
      expect(ids).not.toContain(blocked);
    }
  });

  it('rejects unknown ids', () => {
    expect(IndicatorIdSchema.safeParse('cape').success).toBe(false);
    expect(IndicatorIdSchema.safeParse('made-up-id').success).toBe(false);
  });
});

describe('Insights: WarningRuleSchema (all atom kinds + composite)', () => {
  it('accepts each rule atom from the indicator spec', () => {
    expect(WarningRuleSchema.safeParse({ kind: 'info' }).success).toBe(true);
    expect(WarningRuleSchema.safeParse({ kind: 'threshold', direction: 'below', value: 0 }).success).toBe(true);
    expect(
      WarningRuleSchema.safeParse({ kind: 'threshold', direction: 'above', value: 0, sustainedWeeks: 4 }).success,
    ).toBe(true);
    expect(WarningRuleSchema.safeParse({ kind: 'percentile', tail: 'high', cutoff: 0.2 }).success).toBe(true);
    expect(WarningRuleSchema.safeParse({ kind: 'change', mode: 'pct', direction: 'fall', magnitude: 5, windowWeeks: 4 }).success).toBe(true);
    expect(WarningRuleSchema.safeParse({ kind: 'change', mode: 'points', direction: 'rise', magnitude: 0.5, windowWeeks: 4 }).success).toBe(true);
    expect(WarningRuleSchema.safeParse({ kind: 'yoy-negative' }).success).toBe(true);
    expect(WarningRuleSchema.safeParse({ kind: 'consecutive-decline', periods: 3 }).success).toBe(true);
    expect(WarningRuleSchema.safeParse({ kind: 'above-low', rise: 0.5 }).success).toBe(true);
  });

  it('accepts a flat OR-composite of atoms (us10y) and rejects degenerate ones', () => {
    const composite = {
      kind: 'any-of',
      of: [
        { kind: 'percentile', tail: 'high', cutoff: 0.1 },
        { kind: 'change', mode: 'points', direction: 'rise', magnitude: 0.5, windowWeeks: 4 },
      ],
    };
    expect(WarningRuleSchema.safeParse(composite).success).toBe(true);
    expect(WarningRuleSchema.safeParse({ kind: 'any-of', of: [composite.of[0]] }).success).toBe(false);
    expect(WarningRuleSchema.safeParse({ kind: 'any-of', of: [] }).success).toBe(false);
  });

  it('rejects malformed atoms: bad direction, cutoff out of range, non-positive magnitude', () => {
    expect(WarningRuleSchema.safeParse({ kind: 'threshold', direction: 'sideways', value: 0 }).success).toBe(false);
    expect(WarningRuleSchema.safeParse({ kind: 'percentile', tail: 'high', cutoff: 1.5 }).success).toBe(false);
    expect(WarningRuleSchema.safeParse({ kind: 'change', mode: 'pct', direction: 'fall', magnitude: -5, windowWeeks: 4 }).success).toBe(false);
    expect(WarningRuleSchema.safeParse({ kind: 'consecutive-decline', periods: 0 }).success).toBe(false);
    expect(WarningRuleSchema.safeParse({ kind: 'above-low', rise: 0 }).success).toBe(false);
  });
});

describe('Insights: IndicatorDefinitionSchema', () => {
  const valid = {
    id: 'yield-curve-10y2y',
    section: 'global',
    group: 'borrowing-costs',
    name: 'US 10Y minus 2Y yield',
    source: 'fred',
    sourceRef: 'FRED:T10Y2Y',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'below', value: 0 },
  };

  it('accepts a full definition', () => {
    expect(IndicatorDefinitionSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a definition whose id belongs to the wrong section vocabulary or missing fields', () => {
    expect(IndicatorDefinitionSchema.safeParse({ ...valid, id: 'au-cpi', section: 'global' }).success).toBe(true); // au-cpi exists; section is free-form by contract
    expect(IndicatorDefinitionSchema.safeParse({ ...valid, group: 'nonexistent-group' }).success).toBe(false);
    expect(IndicatorDefinitionSchema.safeParse({ ...valid, source: 'coinbase' }).success).toBe(false);
    expect(IndicatorDefinitionSchema.safeParse({ ...valid, cadence: 'hourly' }).success).toBe(false);
    expect(IndicatorDefinitionSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
    expect(IndicatorDefinitionSchema.safeParse({ ...valid, rule: { kind: 'unknown-kind' } }).success).toBe(false);
  });
});

describe('Insights: IndicatorReadingSchema', () => {
  const valid = {
    id: 'usdjpy',
    value: 149.25,
    asOf: '2026-10-05',
    change7d: -1.2,
    change30d: 3.4,
    percentile10y: 0.91,
    status: 'normal',
    sourceName: 'Frankfurter (ECB)',
    updatedAt: '2026-10-06T02:00:00.000Z',
  };

  it('accepts a full reading and the minimal shape', () => {
    expect(IndicatorReadingSchema.safeParse(valid).success).toBe(true);
    const { change7d: _7d, change30d: _30d, percentile10y: _p, ...minimal } = valid;
    expect(IndicatorReadingSchema.safeParse(minimal).success).toBe(true);
  });

  it('accepts an unavailable reading with null value and asOf', () => {
    expect(
      IndicatorReadingSchema.safeParse({ ...valid, value: null, asOf: null, status: 'unavailable', change7d: undefined, change30d: undefined, percentile10y: undefined })
        .success,
    ).toBe(true);
  });

  it('rejects value/asOf present on unavailable, and null value on any votable status', () => {
    expect(IndicatorReadingSchema.safeParse({ ...valid, status: 'unavailable' }).success).toBe(false);
    expect(IndicatorReadingSchema.safeParse({ ...valid, value: null, status: 'stale' }).success).toBe(false);
    expect(IndicatorReadingSchema.safeParse({ ...valid, asOf: null, status: 'normal' }).success).toBe(false);
    expect(IndicatorReadingSchema.safeParse({ ...valid, value: null, asOf: null, status: 'no-history' }).success).toBe(false);
  });

  it('rejects bad dates, unknown status, out-of-range percentile, non-finite values', () => {
    expect(IndicatorReadingSchema.safeParse({ ...valid, asOf: '2026/10/05' }).success).toBe(false);
    expect(IndicatorReadingSchema.safeParse({ ...valid, updatedAt: '2026-10-06 02:00' }).success).toBe(false);
    expect(IndicatorReadingSchema.safeParse({ ...valid, status: 'amber' }).success).toBe(false);
    expect(IndicatorReadingSchema.safeParse({ ...valid, percentile10y: 1.2 }).success).toBe(false);
    expect(IndicatorReadingSchema.safeParse({ ...valid, value: Number.NaN }).success).toBe(false);
    expect(IndicatorReadingSchema.safeParse({ ...valid, sourceUrl: 'not-a-url' }).success).toBe(false);
  });

  it('pins the reading-status vocabulary (contract shape is deliberate)', () => {
    expect(IndicatorReadingStatusSchema.options).toEqual([
      'warning',
      'normal',
      'context',
      'stale',
      // Fix spec A-03/A-04 (2026-10-14): the validation-flagged hold state.
      'check-pending',
      'no-history',
      'unavailable',
    ]);
  });
});

describe('Insights: SummaryLine / ChangedEvent / CalendarEvent', () => {
  it('summary accepts nullable label and non-negative integer counts', () => {
    expect(
      SummaryLineSchema.safeParse({ section: 'australia', label: 'cautious', warningCount: 4, votingCount: 14, excludedCount: 2 }).success,
    ).toBe(true);
    expect(
      SummaryLineSchema.safeParse({ section: 'global', label: null, warningCount: 0, votingCount: 0, excludedCount: 12 }).success,
    ).toBe(true);
    expect(
      SummaryLineSchema.safeParse({ section: 'global', label: 'relaxed', warningCount: -1, votingCount: 0, excludedCount: 0 }).success,
    ).toBe(false);
    expect(
      SummaryLineSchema.safeParse({ section: 'global', label: 'excited', warningCount: 0, votingCount: 1, excludedCount: 0 }).success,
    ).toBe(false);
  });

  it('changed events only ever move between warning/normal', () => {
    expect(ChangedEventSchema.safeParse({ id: 'us10y', from: 'normal', to: 'warning', asOf: '2026-10-05' }).success).toBe(true);
    expect(ChangedEventSchema.safeParse({ id: 'us10y', from: 'stale', to: 'warning', asOf: '2026-10-05' }).success).toBe(false);
  });

  it('calendar events are bilingual data with a known kind', () => {
    expect(
      CalendarEventSchema.safeParse({ id: 'rba-2026-11', date: '2026-11-03', titleEn: 'RBA board meeting', titleFa: 'جلسه کمیته بانک مرکزی استرالیا', kind: 'rba' }).success,
    ).toBe(true);
    expect(CalendarEventSchema.safeParse({ id: 'x', date: '2026-11-03', titleEn: 'T', titleFa: 'ف', kind: 'fomc' }).success).toBe(false);
  });
});

describe('Insights: InsightsSnapshotSchema', () => {
  const reading = (id: string) => ({
    id,
    value: 1,
    asOf: '2026-10-05',
    status: 'normal',
    sourceName: 'Test source',
    updatedAt: '2026-10-06T02:00:00.000Z',
  });

  const snap = {
    generatedAt: '2026-10-06T02:00:00.000Z',
    summary: {
      global: { section: 'global', label: 'relaxed', warningCount: 0, votingCount: 2, excludedCount: 0 },
      australia: { section: 'australia', label: null, warningCount: 0, votingCount: 0, excludedCount: 0 },
    },
    readings: [reading('usdjpy'), reading('us10y')],
    changedThisWeek: [],
    calendar: [],
  };

  it('accepts a coherent snapshot', () => {
    expect(InsightsSnapshotSchema.safeParse(snap).success).toBe(true);
  });

  it('rejects duplicated indicator ids in readings', () => {
    expect(InsightsSnapshotSchema.safeParse({ ...snap, readings: [reading('usdjpy'), reading('usdjpy')] }).success).toBe(false);
  });

  it('strips unknown keys (same pollution defence as the other envelopes)', () => {
    const parsed = InsightsSnapshotSchema.parse({ ...snap, injected: 'pollutant' });
    expect(parsed).not.toHaveProperty('injected');
  });

  it('Gold Program S2: goldSummary is OPTIONAL — a snapshot without it stays valid', () => {
    expect(InsightsSnapshotSchema.safeParse(snap).success).toBe(true);
    expect(InsightsSnapshotSchema.parse(snap).goldSummary).toBeUndefined();
  });
});

describe('Insights: GoldSummarySchema (the Gold Program wire shape)', () => {
  const reading = (id: string) => ({
    id,
    value: 1,
    asOf: '2026-10-05',
    status: 'normal',
    sourceName: 'Test source',
    updatedAt: '2026-10-06T02:00:00.000Z',
  });
  const snap = {
    generatedAt: '2026-10-06T02:00:00.000Z',
    summary: {
      global: { section: 'global', label: 'relaxed', warningCount: 0, votingCount: 2, excludedCount: 0 },
      australia: { section: 'australia', label: null, warningCount: 0, votingCount: 0, excludedCount: 0 },
    },
    readings: [reading('usdjpy'), reading('us10y')],
    changedThisWeek: [],
    calendar: [],
  };

  const sub = (lane: 'borrowing-costs' | 'dollar' | 'stress' | 'inflation', reading: string) => ({
    lane,
    reading,
    tailwindVoters: 1,
    headwindVoters: 0,
  });

  const gold = {
    netScore: 1,
    label: 'tailwind' as const,
    firingVoters: 3,
    tailwindVoters: 2,
    headwindVoters: 1,
    laneCounts: { tailwind: 1, headwind: 1, mixed: 1 },
    subGauges: [
      sub('borrowing-costs', 'relief'),
      sub('dollar', 'strong'),
      sub('stress', 'mixed'),
      sub('inflation', 'unreadable'),
    ],
    modelVsReality: {
      chip: 'diverging-down' as const,
      modelDirection: 'tailwind' as const,
      realityDirection: 'falling' as const,
      realityBasis: 'change30d' as const,
      realityValue: -4.2,
    },
  };

  it('accepts a coherent summary and stamps onto the snapshot beside the section summaries', () => {
    expect(GoldSummarySchema.safeParse(gold).success).toBe(true);
    const withGold = InsightsSnapshotSchema.safeParse({ ...snap, goldSummary: gold });
    expect(withGold.success).toBe(true);
    if (withGold.success) expect(withGold.data.goldSummary?.label).toBe('tailwind');
  });

  it('rejects a three-lane subGauge set, an unknown lane word and a fractional net score', () => {
    expect(GoldSummarySchema.safeParse({ ...gold, subGauges: gold.subGauges.slice(0, 3) }).success).toBe(false);
    expect(
      GoldSummarySchema.safeParse({ ...gold, subGauges: [...gold.subGauges.slice(0, 3), sub('inflation', 'windy')] })
        .success,
    ).toBe(false);
    expect(GoldSummarySchema.safeParse({ ...gold, netScore: 1.5 }).success).toBe(false);
    expect(GoldSummarySchema.safeParse({ ...gold, label: 'gale-force' }).success).toBe(false);
    expect(GoldSummarySchema.safeParse({ ...gold, modelVsReality: { ...gold.modelVsReality, chip: 'aligned-sideways' } }).success).toBe(false);
  });

  it('the null labels are legal (cannot-read is a state, never an error)', () => {
    expect(
      GoldSummarySchema.safeParse({
        ...gold,
        netScore: 0,
        label: null,
        firingVoters: 0,
        tailwindVoters: 0,
        headwindVoters: 0,
        modelVsReality: { chip: 'no-read', modelDirection: null, realityDirection: null, realityBasis: null, realityValue: null },
      }).success,
    ).toBe(true);
  });
});

describe('Insights: IndicatorHistorySchema (Phase I3 wire format)', () => {
  it('accepts a coherent epoch-day series and strips pollution', () => {
    const hist = { v: 1, id: 'us10y', points: [[19723, 3.88], [19730, 3.91], [19737, 3.97]] };
    const parsed = IndicatorHistorySchema.parse({ ...hist, injected: 'x' });
    expect(parsed).toEqual(hist);
    expect(parsed).not.toHaveProperty('injected');
  });

  it('rejects empty points, duplicate/unordered epoch days, negative days, unknown ids', () => {
    const bad = [
      { v: 1, id: 'us10y', points: [] },
      { v: 1, id: 'us10y', points: [[19730, 1], [19730, 2]] }, // duplicate day
      { v: 1, id: 'us10y', points: [[19730, 1], [19723, 2]] }, // descending
      { v: 1, id: 'us10y', points: [[-1, 1]] }, // pre-1970 date
      { v: 1, id: 'cape', points: [[19723, 1]] }, // not an indicator id (vix joined the set in Step 2)
      { v: 2, id: 'us10y', points: [[19723, 1]] }, // future wire version
    ];
    for (const input of bad) {
      expect(IndicatorHistorySchema.safeParse(input).success).toBe(false);
    }
  });
});

describe('Insights: InsightsStatusSchema (admin freshness wire format)', () => {
  const status = {
    v: 1,
    generatedAt: '2026-10-07T04:22:10.000Z',
    mode: 'scheduled',
    dryRun: false,
    sources: [
      { source: 'fred', ok: true, detail: '10/10 series fetched' },
      { source: 'rba', ok: false, detail: 'F1.1: HTTP 403' },
    ],
  };

  it('accepts a coherent run status', () => {
    expect(InsightsStatusSchema.safeParse(status).success).toBe(true);
    expect(InsightsStatusSchema.parse(status).sources).toHaveLength(2);
  });

  it('rejects unknown modes, missing detail text, bad timestamps', () => {
    expect(InsightsStatusSchema.safeParse({ ...status, mode: 'cron' }).success).toBe(false);
    expect(InsightsStatusSchema.safeParse({ ...status, sources: [{ source: 'fred', ok: true, detail: '' }] }).success).toBe(false);
    expect(InsightsStatusSchema.safeParse({ ...status, generatedAt: '2026-10-07' }).success).toBe(false);
  });

  it('source report rows are the shared InsightsSourceReport contract', () => {
    expect(InsightsSourceReportSchema.safeParse({ source: 'abs', ok: true, detail: 'CPI ok' }).success).toBe(true);
    expect(InsightsSourceReportSchema.safeParse({ source: '', ok: true, detail: 'x' }).success).toBe(false);
    expect(InsightsSourceReportSchema.safeParse({ source: 'abs', ok: 'yes', detail: 'x' }).success).toBe(false);
  });
});
