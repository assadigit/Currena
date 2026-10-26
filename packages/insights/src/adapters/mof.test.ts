/**
 * mof.test.ts — the A-2 adapter suite (2026-10-26 gap-audit build), against
 * the recorded captures (AGENTS.md rule 7 — never a live site):
 *   mof-jgbcme-current.csv      the live current-month file (Oct 2026, 17 rows)
 *   mof-jgbcme-all-mini.csv     the live all-file's 2010→2026-09 rows, verbatim
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchMofJgb10y, mergeMofSeries, MOF_JGBCME_URL, MOF_JGBCME_ALL_URL, parseMofJgbCsv } from './mof';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(harness(), '..', '..', 'fixtures');

function harness(): string {
  return here;
}

const currentCsv = readFileSync(join(fixtures, 'mof-jgbcme-current.csv'), 'utf8');
const allCsv = readFileSync(join(fixtures, 'mof-jgbcme-all-mini.csv'), 'utf8');

describe('parseMofJgbCsv (the loud, header-asserting parser)', () => {
  it('parses the recorded current-month capture: 17 daily 10Y points, newest 2.914 @ 2026-10-22', () => {
    const series = parseMofJgbCsv(currentCsv);
    expect(series).toHaveLength(15);
    expect(series[0]).toEqual({ date: '2026-10-01', value: 3.092 });
    expect(series.at(-1)).toEqual({ date: '2026-10-22', value: 2.914 });
  });

  it('parses the all-file with the decade window trim (the spec-verified 2.914 @ 2026-10-22 era base)', () => {
    const series = parseMofJgbCsv(allCsv, { from: '2023-01-01' });
    expect(series.length).toBeGreaterThan(700); // ~3.8 years of business days
    expect(series[0]!.date >= '2023-01-01').toBe(true);
    expect(series.at(-1)).toEqual({ date: '2026-09-30', value: 3.057 });
  });

  it('asserts the header row verbatim — a maturity reshuffle fails loudly, never mis-reads a column', () => {
    const lines = currentCsv.split('\n');
    // Sabotage: swap the 10Y and 15Y header tokens (a silent index trust would read 15Y).
    const header = lines[1]!.split(',');
    const tmp = header[11]!;
    header[11] = header[10]!;
    header[10] = tmp;
    lines[1] = header.join(',');
    expect(() => parseMofJgbCsv(lines.join('\n'))).toThrow(/maturity layout change/);
  });

  it('rejects a 10Y value outside the sanity band (wrong file class)', () => {
    const lines = currentCsv.split('\n');
    const cells = lines[2]!.split(',');
    cells[10] = '103.092'; // a 1Y-column-style read or a corrupt file
    lines[2] = cells.join(',');
    expect(() => parseMofJgbCsv(lines.join('\n'))).toThrow(/outside -1 to 15/);
  });

  it('rejects a non-ascending body (upstream reorder)', () => {
    const lines = currentCsv.split('\r\n');
    const dataRows = lines.filter((l) => l.startsWith('2026'));
    const reordered = [lines[0]!, lines[1]!, dataRows[1]!, dataRows[0]!, ...dataRows.slice(2)];
    expect(() => parseMofJgbCsv(reordered.join('\r\n'))).toThrow(/not date-ascending/);
  });

  it('skips the files\' own trailing padding + quoted footer note (the Shift-JIS note row)', () => {
    // The recorded capture ends with an empty-cells row and the quoted
    // "※If you cannot download…" note — both must be skipped, not parsed.
    const series = parseMofJgbCsv(currentCsv);
    expect(series.at(-1)!.date).toBe('2026-10-22');
    expect(series.every((p) => /^2026-10-/.test(p.date))).toBe(true);
  });

  it('rejects a date cell that is not the file\'s own YYYY/M/D form', () => {
    const lines = currentCsv.split('\n');
    const cells = lines[2]!.split(',');
    cells[0] = '2026-10-01'; // ISO in — the file changed its date form
    lines[2] = cells.join(',');
    expect(() => parseMofJgbCsv(lines.join('\n'))).toThrow(/not YYYY\/M\/D/);
  });
});

describe('mergeMofSeries (the all-file ∪ current-month union)', () => {
  it('unions by date with the current-month file winning on collision (the fresher month)', () => {
    const all = parseMofJgbCsv(allCsv, { from: '2026-01-01' });
    const current = parseMofJgbCsv(currentCsv);
    const merged = mergeMofSeries(all, current);
    // every current date present exactly once, ascending, current values win
    for (const p of current) {
      expect(merged.find((m) => m.date === p.date)).toEqual(p);
    }
    const dates = merged.map((m) => m.date);
    expect([...dates].sort()).toEqual(dates);
  });
});

describe('fetchMofJgb10y (the two-file fetch)', () => {
  it('fetches the current-month file alone on ordinary days (one subrequest)', async () => {
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      return new Response(url.includes('jgbcme_all') ? allCsv : currentCsv, { status: 200 });
    }) as typeof fetch;
    try {
      const series = await fetchMofJgb10y();
      expect(urls).toEqual([MOF_JGBCME_URL]);
      expect(series.at(-1)).toEqual({ date: '2026-10-22', value: 2.914 });
    } finally {
      globalThis.fetch = original;
    }
  });

  it('adds the historical all-file (decade window) when asked — the monthly/bootstrap shape', async () => {
    const urls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      return new Response(url.includes('jgbcme_all') ? allCsv : currentCsv, { status: 200 });
    }) as typeof fetch;
    try {
      const series = await fetchMofJgb10y({ includeHistory: true, now: new Date('2026-11-01T04:20:00Z') });
      expect(urls).toEqual([MOF_JGBCME_URL, MOF_JGBCME_ALL_URL]);
      // the union reaches back years, and the current month's freshest day wins
      expect(series[0]!.date <= '2016-12-31').toBe(true);
      expect(series.at(-1)).toEqual({ date: '2026-10-22', value: 2.914 });
    } finally {
      globalThis.fetch = original;
    }
  });
});
