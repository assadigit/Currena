/**
 * fx-csv.test.ts — the pairs-table export (spec §9.3 item 6: "CSV goes in
 * the existing Tools menu"): stable column order, machine-readable values,
 * the injection guard, CRLF endings, group-block row order.
 */

import { describe, expect, it } from 'vitest';
import type { FxPairEntry, FxSnapshot } from '@currena/core';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { buildFxCsv, fxCsvFilename, fxCsvHeaders } from './fx-csv';

function pairOf(id: FxPairEntry['id'], m1: number): FxPairEntry {
  return {
    id,
    asOf: '2026-10-12',
    rate: 1.12345,
    chg: { d1: 0.12, m1, m3: -0.34, y1: 5.67 },
    moveRank: 42,
    bigMove: false,
    source: 'frankfurter',
    stale: false,
    weekly: [[1, 1.1]],
  } as FxPairEntry;
}

describe('buildFxCsv', () => {
  it('writes the localized headers and one row per pair, CRLF-terminated', () => {
    const snapshot = {
      v: 1,
      generatedAt: '2026-10-13T17:01:00Z',
      dollarMeasure: { asOf: '2026-10-12', value: 100, chg: { d1: 0, m1: 0, m3: 0, y1: 0 }, weekly: [[1, 100]] },
      pairs: [pairOf('audjpy', -3.2), pairOf('eurusd', 1.1)],
      rules: [],
      summary: { signal: 'normal', countedWarnings: 0, headlineRule: null },
    } as unknown as FxSnapshot;
    const csv = buildFxCsv(snapshot, insightsCopyEn);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe(fxCsvHeaders(insightsCopyEn).join(','));
    // Group order: eurusd (dollarWorld) before audjpy (warningLights).
    expect(lines[1]!.startsWith('Euro vs US dollar')).toBe(true);
    expect(lines[2]!.startsWith('Australian dollar vs yen')).toBe(true);
    expect(csv.endsWith('\r\n')).toBe(true);
    expect(lines).toHaveLength(4); // header + 2 rows + trailing empty
  });

  it('neutralizes formula-like pair names (the OWASP guard rides every text column)', () => {
    // The names come from the copy corpus (never user text), but the guard
    // is part of the export's contract — pin it with a poisoned copy view.
    const poisoned = {
      ...insightsCopyEn,
      fx: {
        ...insightsCopyEn.fx,
        entries: {
          ...insightsCopyEn.fx.entries,
          eurusd: { ...insightsCopyEn.fx.entries.eurusd, name: '=HYPERLINK("x")' },
        },
      },
    } as typeof insightsCopyEn;
    const snapshot = {
      v: 1,
      generatedAt: '2026-10-13T17:01:00Z',
      dollarMeasure: { asOf: '2026-10-12', value: 100, chg: { d1: 0, m1: 0, m3: 0, y1: 0 }, weekly: [[1, 100]] },
      pairs: [pairOf('eurusd', 0)],
      rules: [],
      summary: { signal: 'normal', countedWarnings: 0, headlineRule: null },
    } as unknown as FxSnapshot;
    const csv = buildFxCsv(snapshot, poisoned);
    expect(csv).not.toMatch(/^=HYPERLINK/m);
    expect(csv).toContain("'=HYPERLINK");
  });

  it('the filename carries the snapshot date', () => {
    expect(fxCsvFilename('2026-10-13T17:01:00Z')).toBe('currena-world-currencies-2026-10-13.csv');
  });
});
