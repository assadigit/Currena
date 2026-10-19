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
  it('is exactly the L2 sources the owner accepted for public display', () => {
    // brent/gold-usd/silver-usd (Yahoo legs), btc-usd — the four L2-but-public
    // ids per the audit sidecar today.
    expect([...PUBLIC_BOUNDED_HISTORY_IDS].sort()).toEqual(['brent', 'btc-usd', 'gold-usd', 'silver-usd']);
  });

  it('an L0 public id (us10y: DGS10, public domain) is never bounded', () => {
    const us10y = INDICATOR_AUDIT_BY_ID.get('us10y')!;
    expect(us10y.level).toBe('L0');
    expect(PUBLIC_BOUNDED_HISTORY_IDS.has('us10y')).toBe(false);
  });

  it('an L2 id that is NOT public-ok (vix) never appears publicly at all, so it is not in the bound set either', () => {
    const vix = INDICATOR_AUDIT_BY_ID.get('vix')!;
    expect(vix.level).toBe('L2');
    expect(vix.publicDisplayOk).toBe('no');
    expect(PUBLIC_BOUNDED_HISTORY_IDS.has('vix')).toBe(false);
  });
});
