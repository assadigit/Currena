/**
 * meta.test.ts — the /api/meta contract's single-source tests (B-4
 * consolidation: the schema lived duplicated in apps/api/src/meta.ts and
 * apps/web/src/lib/api.ts; it now lives HERE and both import it — parity
 * by construction). The api's contract suite parses the real served body
 * against this same schema.
 */

import { describe, expect, it } from 'vitest';
import { buildMeta, MetaResponseSchema } from './meta';
import { CURRENCIES } from './currencies';

describe('buildMeta', () => {
  const meta = buildMeta();

  it('produces a contract-valid payload (its own schema parses it)', () => {
    expect(() => MetaResponseSchema.parse(meta)).not.toThrow();
  });

  it('carries all 17 legacy currencies with TGJU profile URLs where slugs exist', () => {
    expect(meta.currencies).toHaveLength(CURRENCIES.length);
    for (const c of meta.currencies) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.minorUnits).toBeGreaterThanOrEqual(0);
    }
    // AED has a TGJU profile slug (currencies.ts) — representative check.
    const aed = meta.currencies.find((c) => c.code === 'AED')!;
    expect(aed.tgjuProfileUrl).toContain('tgju.org');
  });

  it('served lists: TGJU = IRR + the slug-carrying currencies; Frankfurter = USD + 29 ECB codes (2026-09-16 capture)', () => {
    expect(meta.sources.tgju.base).toBe('IRR');
    expect(meta.sources.tgju.currencies[0]).toBe('IRR');
    const expectedTgju = ['IRR', ...CURRENCIES.filter((c) => c.tgjuProfile).map((c) => c.code)];
    expect(meta.sources.tgju.currencies).toEqual(expectedTgju);
    expect(meta.sources.frankfurter.base).toBe('USD');
    expect(meta.sources.frankfurter.currencies).toHaveLength(30); // USD + 29
    // AED and VND deliberately absent (the documented limitation).
    expect(meta.sources.frankfurter.currencies).not.toContain('AED');
    expect(meta.sources.frankfurter.currencies).not.toContain('VND');
  });

  it('documents the three limitations (AED/VND support, the capture caveat, TOMAN canonical)', () => {
    expect(meta.limitations).toHaveLength(3);
    expect(meta.limitations.join(' ')).toMatch(/AED or VND/);
    expect(meta.limitations.join(' ')).toMatch(/TOMAN/);
  });
});

describe('MetaResponseSchema (the boundary contract both api and web import)', () => {
  it('rejects an empty currencies list', () => {
    expect(MetaResponseSchema.safeParse({ currencies: [], sources: {}, limitations: [] }).success).toBe(false);
  });

  it('rejects a non-3-letter currency code', () => {
    const bad = buildMeta();
    expect(
      MetaResponseSchema.safeParse({
        ...bad,
        currencies: [{ ...bad.currencies[0]!, code: 'EURO' }],
      }).success,
    ).toBe(false);
  });

  it('rejects missing limitations (the payload must document its limits)', () => {
    const { limitations: _omit, ...rest } = buildMeta();
    expect(MetaResponseSchema.safeParse(rest).success).toBe(false);
  });
});
