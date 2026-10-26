/**
 * eia-stocks.test.ts + cftc.test.ts's suites live together here (the A-6/A-7
 * gap-audit pair, 2026-10-26) — against the recorded captures
 * (AGENTS.md rule 7 — never a live site):
 *   eia-crude-stocks.html   the live WCRSTUS1 weekly page (245 KB, 2026-10-26)
 *   cftc-deafut.txt         the live futures-only COT file (gold row 2026-10-20)
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EIA_CRUDE_STOCKS_URL, parseEiaCrudeStocksHtml } from './eia-stocks';
import { CFTC_DEAFUT_URL, CFTC_GOLD_MARKET, parseCftcGoldPositioning } from './cftc';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', '..', 'fixtures');
const stocksHtml = readFileSync(join(fixtures, 'eia-crude-stocks.html'), 'utf8');
const deafut = readFileSync(join(fixtures, 'cftc-deafut.txt'), 'utf8');

describe('parseEiaCrudeStocksHtml (A-6: the keyless weekly stocks page)', () => {
  it('parses the recorded capture: decades of weekly points, newest 695,200 thousand barrels @ 2026-10-16', () => {
    const series = parseEiaCrudeStocksHtml(stocksHtml);
    expect(series.length).toBeGreaterThan(2000); // 1982→2026 weekly
    expect(series.at(-1)).toEqual({ date: '2026-10-16', value: 695200 });
    // A December row's January-ending week rolls the year (the page's own
    // cross-year rows — e.g. 2012-12's 01/04/2013 week must land in 2013).
    const crossYear = series.find((p) => p.date === '2013-01-04');
    expect(crossYear).toBeDefined();
  });

  it('asserts the page identity before trusting a number (wrong series / missing unit)', () => {
    expect(() => parseEiaCrudeStocksHtml(stocksHtml.replace(/WCRSTUS1/g, 'OTHERSERIES'))).toThrow(
      /WCRSTUS1 series id/,
    );
    expect(() => parseEiaCrudeStocksHtml(stocksHtml.replace(/Thousand Barrels/g, 'Some Other Unit'))).toThrow(
      /Thousand Barrels/,
    );
  });

  it('rejects an out-of-band value (a corrupt cell never renders)', () => {
    const sabotaged = stocksHtml.replace('>695,200', '>9,999,999,999');
    expect(() => parseEiaCrudeStocksHtml(sabotaged)).toThrow(/outside the plausible weekly band/);
  });

  it('the URL is the keyless website route (never the registered-key v2 API)', () => {
    expect(EIA_CRUDE_STOCKS_URL).toBe(
      'https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=WCRSTUS1&f=W',
    );
  });
});

describe('parseCftcGoldPositioning (A-7: the weekly COT file)', () => {
  it('parses the recorded capture: gold net non-commercial 49.68% of OI @ 2026-10-20', () => {
    const row = parseCftcGoldPositioning(deafut);
    expect(row.date).toBe('2026-10-20');
    expect(row.openInterest).toBe(402279);
    // (237,142 − 37,277) / 402,279 = 49.68% — the spec-verified live read.
    expect(row.netSharePct).toBeCloseTo(49.68324, 4);
  });

  it('never matches the MICRO GOLD sibling row (the exact-name discipline)', () => {
    // Remove the true gold row; the parser must FAIL, not fall back to
    // MICRO GOLD (a silent sibling match would misread the metric).
    const withoutGold = deafut
      .split('\n')
      .filter((l) => !l.startsWith(`"${CFTC_GOLD_MARKET}"`))
      .join('\n');
    expect(() => parseCftcGoldPositioning(withoutGold)).toThrow(/no "GOLD - COMMODITY EXCHANGE INC\." row/);
  });

  it('asserts the file’s own arithmetic identity (a column shift fails loudly)', () => {
    // Sabotage one middle field of the gold row: the reportable-positions
    // identity must break (a silent column misread is impossible).
    const lines = deafut.split('\n');
    const idx = lines.findIndex((l) => l.startsWith(`"${CFTC_GOLD_MARKET}"`));
    const cells = lines[idx]!.split(',');
    cells[9] = '  99999'; // NonComm Short (raw index 9: after name+6) — the identity now fails
    lines[idx] = cells.join(',');
    expect(() => parseCftcGoldPositioning(lines.join('\n'))).toThrow(
      /fails the reportable-positions identity/,
    );
  });

  it('rejects a market name containing commas via the quoted-name discipline (the file’s own format)', () => {
    // A row like "CRUDE OIL, LIGHT SWEET-WTI - ICE FUTURES EUROPE" must
    // parse its NAME as one field — the gold row is still found after it.
    expect(deafut).toContain('"CRUDE OIL, LIGHT SWEET-WTI');
    const row = parseCftcGoldPositioning(deafut);
    expect(row.date).toBe('2026-10-20');
  });

  it('the URL is the agency’s own weekly file', () => {
    expect(CFTC_DEAFUT_URL).toBe('https://www.cftc.gov/dea/newcot/deafut.txt');
  });
});
