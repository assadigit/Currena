/**
 * BoE adapter tests (M6 Wave-4 probe fix, 2026-10-25) — the Bank Rate
 * decision-table parse and the daily step expansion, following the
 * rba.test.ts fixture conventions (synthetic HTML, loud failures).
 */

import { describe, expect, it } from 'vitest';
import {
  BOE_BANK_RATE_URL,
  boeBankRateDailySeries,
  boeWindowStart,
  parseBoeBankRateHtml,
} from './boe';

/** The page's real shape (verified live 2026-10-25): a header row then
 * decision rows, newest first, two-digit years. */
const SYNTHETIC_PAGE = `<!DOCTYPE html>
<html><body>
<table>
<thead><tr><th>Date Changed</th><th>Rate</th></tr></thead>
<tbody>
<tr><td>18 Dec 25</td><td>3.75</td></tr>
<tr><td>07 Aug 25</td><td>4.00</td></tr>
<tr><td>08 May 25</td><td>4.25</td></tr>
<tr><td>19 Dec 24</td><td>4.75</td></tr>
<tr><td>10 Feb 75</td><td>10.75</td></tr>
</tbody>
</table>
</body></html>`;

describe('boe adapter (Bank Rate history page)', () => {
  it('parses the decision table: header-identified, sorted ascending, two-digit years resolved', () => {
    const out = parseBoeBankRateHtml(SYNTHETIC_PAGE);
    expect(out).toEqual([
      { date: '1975-02-10', value: 10.75 },
      { date: '2024-12-19', value: 4.75 },
      { date: '2025-05-08', value: 4.25 },
      { date: '2025-08-07', value: 4.0 },
      { date: '2025-12-18', value: 3.75 },
    ]);
  });

  it('skips note/spacer rows inside the table', () => {
    const noisy = SYNTHETIC_PAGE.replace(
      '<tr><td>07 Aug 25</td><td>4.00</td></tr>',
      '<tr><td colspan="2">&nbsp;</td></tr><tr><td>07 Aug 25</td><td>4.00</td></tr><tr><td colspan="2">Historic rates are indicative</td></tr>',
    );
    const out = parseBoeBankRateHtml(noisy);
    expect(out).toHaveLength(5);
    expect(out.find((p) => p.date === '2025-08-07')).toEqual({ date: '2025-08-07', value: 4 });
  });

  it('throws loudly when the header is absent (layout change)', () => {
    expect(() => parseBoeBankRateHtml('<html><body><p>no table</p></body></html>')).toThrow(
      /header not found/,
    );
  });

  it('throws loudly when a data row carries no parseable rate', () => {
    const broken = SYNTHETIC_PAGE.replace('<td>3.75</td>', '<td>—</td>');
    expect(() => parseBoeBankRateHtml(broken)).toThrow(/no parseable rate/);
  });

  it('expands the decisions into the F1-shaped daily step series over the decade window', () => {
    const decisions = parseBoeBankRateHtml(SYNTHETIC_PAGE);
    const now = new Date('2026-10-25T00:00:00Z');
    const daily = boeBankRateDailySeries(decisions, now);
    // The window start: a decade + 90d back from now (3740 days).
    expect(boeWindowStart(now)).toBe('2016-07-29');
    expect(daily[0]).toEqual({ date: '2016-07-29', value: 10.75 });
    expect(daily.at(-1)).toEqual({ date: '2026-10-25', value: 3.75 });
    // One point per calendar day, no gaps.
    const days = (Date.parse('2026-10-25') - Date.parse('2016-07-29')) / 86_400_000 + 1;
    expect(daily).toHaveLength(days);
    // A decision steps the series on its own effective day.
    const step = daily.find((p) => p.date === '2025-12-18')!;
    expect(step.value).toBe(3.75);
    const before = daily.find((p) => p.date === '2025-12-17')!;
    expect(before.value).toBe(4);
  });

  it('returns empty from an empty decision set (the failed-fetch slot stays undefined)', () => {
    expect(boeBankRateDailySeries([], new Date())).toEqual([]);
  });

  it('exposes the published URL', () => {
    expect(BOE_BANK_RATE_URL).toBe('https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp');
  });
});
