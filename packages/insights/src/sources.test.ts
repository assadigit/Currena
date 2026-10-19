/**
 * sources.test.ts — the v3 source risk register (RULES §2, RISK_REGISTER,
 * Step 3 §8, SCRAPING_SPEC T-25…T-34 data-level gates).
 *
 * Tests written FIRST (Phase 1): the register rows and the worst-of-legs
 * walk must satisfy the spec's source gates before any of them may fetch
 * or display anything.
 */

import { describe, expect, it } from 'vitest';
import {
  SOURCE_RISK_REGISTER,
  UPSTREAM_LEGS,
  legMayBeFetched,
  providerFetchEnabled,
  riskRowForLeg,
  riskSummaryForLegs,
  upstreamLegsFor,
} from './sources';
import type { FredCopyrightRecord } from './licences';

const fredRecords: FredCopyrightRecord[] = [
  {
    seriesId: 'VIXCLS',
    license: 'citation-required',
    copyrightNotice: true,
    checkedOn: '2026-10-16',
    evidence: 'FRED license tag #copyright-citation-required',
    url: 'https://fred.stlouisfed.org/series/VIXCLS',
  },
  {
    seriesId: 'DGS10',
    license: 'public-domain',
    copyrightNotice: false,
    checkedOn: '2026-10-16',
    evidence: 'FRED license tag #copyright-public-domain',
    url: 'https://fred.stlouisfed.org/series/DGS10',
  },
  {
    seriesId: 'DCOILBRENTEU',
    license: 'public-domain',
    copyrightNotice: false,
    checkedOn: '2026-10-16',
    evidence: 'FRED license tag #copyright-public-domain',
    url: 'https://fred.stlouisfed.org/series/DCOILBRENTEU',
  },
];

describe('the v3 source risk register (T-26 terms gate)', () => {
  it('T-26: every ENABLED source records its terms lines, the date they were read, and a level', () => {
    for (const [id, row] of Object.entries(SOURCE_RISK_REGISTER)) {
      if (!row.enabled) continue; // disabled rows may still be "not verified"
      expect(row.termsLines.length, `${id} termsLines`).toBeGreaterThan(0);
      expect(row.termsReadOn, `${id} termsReadOn`).not.toBe('not verified');
      expect(['L0', 'L1', 'L2', 'L3'], `${id} level`).toContain(row.level);
      expect(row.attribution.length, `${id} attribution`).toBeGreaterThan(0);
    }
  });

  it('T-26: an unregistered provider fails closed (disabled, not owner-accepted, never fetched)', () => {
    const row = riskRowForLeg('mystery-provider');
    expect(row.enabled).toBe(false);
    expect(row.ownerAccepts).toBe(false);
    expect(providerFetchEnabled('mystery-provider')).toBe(false);
  });

  it('the register never invents an owner acceptance: every L2 row records owner_accepts, and the agent-side rows for NEW sources stay false', () => {
    // New (not-live-on-15-Oct-2026) sources must stay owner_accepts = false
    // until the owner flips RISK_REGISTER.md himself (runbook hard rule 2).
    for (const id of ['shiller', 'cnn-fng', 'asx-rate-tracker', 'westpac-mi', 'nab-survey', 'aip-petrol']) {
      const row = SOURCE_RISK_REGISTER[id]!;
      expect(row.ownerAccepts, `${id} ownerAccepts`).toBe(false);
      expect(row.enabled, `${id} enabled`).toBe(false); // T-30: disabled by default
    }
  });

  it('the already-live L2 sources carry the owner\u2019s recorded acceptance (RISK_REGISTER.md, 2026-10-17)', () => {
    for (const id of ['fred-copyright', 'eodhd', 'yahoo', 'gold-api']) {
      const row = SOURCE_RISK_REGISTER[id]!;
      expect(row.ownerAccepts, `${id} ownerAccepts`).toBe(true);
      expect(row.enabled, `${id} enabled`).toBe(true);
    }
  });

  it('no row ever carries an owner override (only the owner may write one, in RISK_REGISTER.md)', () => {
    for (const [id, row] of Object.entries(SOURCE_RISK_REGISTER)) {
      expect(row!.override, `${id} override`).toBe(false);
    }
  });
});

describe('T-30 disabled default: a new L2 source with owner_accepts = no is never fetched and never shown', () => {
  it('every not-yet-accepted source row is disabled, so its fetch gate and display gate both fail closed', () => {
    for (const id of ['shiller', 'cnn-fng', 'asx-rate-tracker', 'westpac-mi', 'nab-survey', 'aip-petrol']) {
      const row = SOURCE_RISK_REGISTER[id]!;
      expect(row.enabled).toBe(false);
      expect(legMayBeFetched(row.id)).toBe(false);
      // Display gate: an L2 row without acceptance is not owner-accepted.
      expect(riskSummaryForLegs([row.id]).ownerAccepts).toBe(false);
    }
  });

  it('a card whose legs include a disabled source is itself disabled and not owner-accepted', () => {
    const summary = riskSummaryForLegs(['shiller'], fredRecords);
    expect(summary.enabled).toBe(false);
    expect(summary.ownerAccepts).toBe(false);
  });
});

describe('T-31 L3 gate: an L3 source is never requested', () => {
  it('legMayBeFetched refuses any L3 leg (and only an owner-written override could ever change that)', () => {
    const l3Row = { ...SOURCE_RISK_REGISTER['cnn-fng'], level: 'L3' as const };
    expect(l3Row.enabled).toBe(false);
    expect(legMayBeFetched('cnn-fng')).toBe(false);
  });

  it('an un-overridden L3 leg keeps the card at L3 — the walk never upgrades it into displayability', () => {
    // Simulated: a hypothetical card with one L3 leg.
    const summary = riskSummaryForLegs(['fred:DGS10', 'shiller']);
    expect(summary.level).toBe('L2'); // shiller L2 governs over the L0 leg
    expect(summary.ownerAccepts).toBe(false); // shiller not accepted
    expect(summary.enabled).toBe(false);
  });
});

describe('the worst-of-legs walk (defect E-01/LR-02, Step 3 §8)', () => {
  it('a Yahoo leg makes the card L2 under the recorded acceptance (gold-usd)', () => {
    const legs = upstreamLegsFor({ id: 'gold-usd', source: 'gold-api', sourceRef: 'gold-api:XAU' });
    expect(legs).toEqual(UPSTREAM_LEGS['gold-usd']!);
    const summary = riskSummaryForLegs(legs, fredRecords);
    expect(summary.level).toBe('L2');
    expect(summary.ownerAccepts).toBe(true); // yahoo accepted + gold-api accepted/live
    expect(summary.enabled).toBe(true);
  });

  it('a public-domain FRED-only card is L0 with no acceptance needed (us10y)', () => {
    const legs = upstreamLegsFor({ id: 'us10y', source: 'fred', sourceRef: 'FRED:DGS10' });
    const summary = riskSummaryForLegs(legs, fredRecords);
    expect(summary.level).toBe('L0');
    expect(summary.ownerAccepts).toBeNull();
  });

  it('a citation-required FRED series is L2 under the recorded acceptance (VIX)', () => {
    const summary = riskSummaryForLegs(['fred:VIXCLS'], fredRecords);
    expect(summary.level).toBe('L2');
    expect(summary.ownerAccepts).toBe(true);
  });

  it('an unscanned FRED series fails closed (L2, not accepted, never fetched)', () => {
    const summary = riskSummaryForLegs(['fred:NEVERSEEN'], fredRecords);
    expect(summary.level).toBe('L2');
    expect(summary.ownerAccepts).toBe(false);
    expect(summary.enabled).toBe(false);
  });

  it('multi-leg walks name the governing leg in the terms lines', () => {
    const summary = riskSummaryForLegs(UPSTREAM_LEGS['brent']!, fredRecords);
    expect(summary.governingTermsLines).toContain('Worst of legs (fred:DCOILBRENTEU, yahoo:BZ=F)');
  });

  it('the kill switch: one disabled leg disables the whole card while the rest stay enabled', () => {
    const before = riskSummaryForLegs(UPSTREAM_LEGS['brent']!, fredRecords);
    expect(before.enabled).toBe(true);
    // fred-copyright row disabled → VIX card unavailable:
    const vix = riskSummaryForLegs(['fred:VIXCLS'], fredRecords);
    expect(vix.enabled).toBe(true);
  });
});

describe('provider fetch gates (M-6 kill switch)', () => {
  it('providerFetchEnabled follows the register (live providers on, new sources off)', () => {
    for (const p of ['fred', 'rba', 'abs', 'yahoo', 'gold-api', 'frankfurter', 'ecb', 'world-bank', 'bitstamp', 'alternative-me']) {
      expect(providerFetchEnabled(p), p).toBe(true);
    }
    for (const p of ['shiller', 'cnn', 'asx', 'westpac-mi', 'nab', 'aip']) {
      expect(providerFetchEnabled(p), p).toBe(false);
    }
  });

  it('the FRED adapter gate is the OR of its two rows (one fetch serves both)', () => {
    expect(providerFetchEnabled('fred')).toBe(true);
  });
});

describe('T-28: definitional sanity ranges live in the registry', () => {
  it('the bounded gauges carry their 0..100 definition; prices are strictly positive', async () => {
    const { SANITY_RANGES } = await import('./sources');
    // A 0-to-100 gauge must be a number in 0..100 (F-14 example, verbatim).
    expect(SANITY_RANGES['crypto-fng']).toEqual({ min: 0, max: 100 });
    expect(SANITY_RANGES['china-pmi']).toEqual({ min: 0, max: 100 });
    expect(SANITY_RANGES['us-unemployment']).toEqual({ min: 0, max: 100 });
    expect(SANITY_RANGES['au-unemployment']).toEqual({ min: 0, max: 100 });
    // Prices cannot be zero or negative.
    expect(SANITY_RANGES['brent']).toEqual({ minExclusive: true });
    expect(SANITY_RANGES['vix']).toEqual({ minExclusive: true });
    // Unbounded series (yields can go negative) carry NO invented band.
    expect(SANITY_RANGES['us10y']).toBeUndefined();
  });
});
