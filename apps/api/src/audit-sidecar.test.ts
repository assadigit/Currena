/**
 * audit-sidecar.test.ts — the bundled per-indicator licence + rule facts
 * (defect E-23's sidecar, data/indicator-audit.json) and the M-2 public
 * history bound derived from it at startup.
 *
 * M-2 (RULES.md §3): public endpoints serve no bulk history for L2 sources —
 * ids whose audit level is L2 while publicDisplayOk is 'yes' (the owner
 * accepted public display) are exactly the ids whose PUBLIC history gets
 * bounded to the visible chart window.
 */

import { describe, expect, it } from 'vitest';
import { INDICATOR_AUDIT_BY_ID, PUBLIC_BOUNDED_HISTORY_IDS } from './audit-sidecar';

describe('the bundled indicator-audit sidecar', () => {
  it('parses at startup and maps every entry by id', () => {
    expect(INDICATOR_AUDIT_BY_ID.size).toBeGreaterThan(30);
    for (const entry of INDICATOR_AUDIT_BY_ID.values()) {
      expect(entry.id).toBeTruthy();
      expect(entry.licenceName).toBeTruthy();
      expect(['yes', 'no', 'unknown']).toContain(entry.publicDisplayOk);
      expect(['L0', 'L1', 'L2', 'L3']).toContain(entry.level);
      expect(typeof entry.ruleVersion).toBe('number');
      expect(typeof entry.rule).toBe('string');
    }
  });

  it('carries the owner-side switch fields the export needs (ownerAccepts, enabled, level)', () => {
    const brent = INDICATOR_AUDIT_BY_ID.get('brent')!;
    expect(brent.level).toBe('L2');
    expect(brent.ownerAccepts).toBe(true);
    expect(brent.enabled).toBe(true);
    // The rule rides VERBATIM (the raw JSON string, never re-serialized).
    expect(brent.rule).toContain('"kind":"change"');
  });
});

describe('PUBLIC_BOUNDED_HISTORY_IDS (M-2: L2 + publicDisplayOk yes)', () => {
  it('is exactly the L2 sources that are public today (the 2026-10-21c licence round + the 2026-10-23 unhide + the 2026-10-24 M4 Wave-1 + the 2026-10-25 M6 Wave-3 additions)', () => {
    // brent/gold-usd/silver-usd (Yahoo legs), btc-usd (gold-api), the
    // FRED citation-required set (display-permitted with "publisher via
    // FRED" attribution — FRED legal read 2026-10-21: STLFSI/NFCI/VIX/
    // T10Y2Y/T5YIFR/GACDFSA + the OECD bond/rate series), eth-usd retired
    // 2026-10-21c, the Shiller pair since the D-42/OD-1 unhide (2026-10-23),
    // and the Wave-1 citation-required set (2026-10-24): SOFR (NY Fed),
    // the Michigan pair (U. Michigan) and the 10y breakeven (T10YIE,
    // citation-required since the 2026-10-21 scan — its card left
    // validation-only status this round). Twenty-four L2-but-public ids per
    // the audit sidecar today (M6 Wave 3: +cfnai, +mortgage-30y, +t5yie — the
    // citation-required FRED additions; the BoE fix keeps boe-rate here but
    // under the OGL-attribution licence).
    expect([...PUBLIC_BOUNDED_HISTORY_IDS].sort()).toEqual([
      'boe-rate',
      'boj-rate',
      'breakeven-10y',
      'breakeven-5y5y',
      // Session 3 (G2, 2026-10-31): the interplay card — derived from the
      // two citation-required FRED legs (T5YIFR + T5YIE), both already in
      // this list's licence class (display-permitted with attribution).
      'breakeven-tilt',
      'brent',
      'btc-usd',
      'bund-10y',
      'cfnai',
      'gilt-10y',
      'gold-oil-ratio',
    'gold-usd',
      'jgb-10y',
      'michigan-1y-expectations',
      'michigan-sentiment',
      'mortgage-30y',
      'nfci',
      'philly-fed',
      'shiller-cape',
      'shiller-ecy',
      'silver-usd',
      'sofr',
      'stress-stlfsi',
      't5yie',
      // A-3: the US−Japan gap (DGS10 public-domain + MOF PDL1.0 + the OECD
    // mirror's citation-required leg, display-permitted).
    'us-japan-10y-gap',
    // 2026-10-29 owner round ("add dollar against UAE currency"): the
    // dirham card — Yahoo L2 (ownerAccepts, the register row the Brent
    // gap-fill already rides) + the owner's own display directive.
    'usdaed',
    'vix',
      'yield-curve-10y2y',
      // 2026-10-26 gap-audit build, A-1: the 10y−3m curve leg (T10Y3M,
      // citation-required — display-permitted with attribution).
      'yield-curve-10y3m',
    ]);
  });

  it('an L0 public id (us10y: DGS10, public domain) is never bounded', () => {
    const us10y = INDICATOR_AUDIT_BY_ID.get('us10y')!;
    expect(us10y.level).toBe('L0');
    expect(PUBLIC_BOUNDED_HISTORY_IDS.has('us10y')).toBe(false);
  });

  it('an L2 public id (vix: citation-required FRED, display-permitted 2026-10-21) joins the bounded set — its public history serves only the visible chart window', () => {
    const vix = INDICATOR_AUDIT_BY_ID.get('vix')!;
    expect(vix.level).toBe('L2');
    expect(vix.publicDisplayOk).toBe('yes');
    expect(PUBLIC_BOUNDED_HISTORY_IDS.has('vix')).toBe(true);
    // The 2026-10-23 unhide (D-42/OD-1): shiller-cape is also L2 but now
    // owner-accepted and display-ok — it joins the bounded set too (its
    // public history serves, bounded like every other L2 id).
    const cape = INDICATOR_AUDIT_BY_ID.get('shiller-cape')!;
    expect(cape.level).toBe('L2');
    expect(cape.publicDisplayOk).toBe('yes');
    expect(PUBLIC_BOUNDED_HISTORY_IDS.has('shiller-cape')).toBe(true);
  });
});
