import { describe, expect, it } from 'vitest';

import {
  CACHE_HARD_TTL_SEC,
  FRESH_TTL_SEC,
  MIN_SCRAPE_INTERVAL_SEC,
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
    expect(FRESH_TTL_SEC).toBe(300);
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
