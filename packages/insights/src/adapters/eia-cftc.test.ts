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
import {
  EIA_CRUDE_STOCKS_URL,
  EIA_SPR_URL,
  EIA_CRUDE_PRODUCTION_URL,
  EIA_SPR_SPEC,
  EIA_CRUDE_PRODUCTION_SPEC,
  parseEiaCrudeStocksHtml,
  parseEiaWeeklySeriesHtml,
} from './eia-stocks';
import { CFTC_DEAFUT_URL, CFTC_GOLD_MARKET, cftcArchiveUrl, parseCftcGoldArchiveAnnual, parseCftcGoldPositioning } from './cftc';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', '..', 'fixtures');
const stocksHtml = readFileSync(join(fixtures, 'eia-crude-stocks.html'), 'utf8');
const deafut = readFileSync(join(fixtures, 'cftc-deafut.txt'), 'utf8');
// gap-closure S4-M4.4 (2026-11-01): the M4.1 captures — the SPR level page
// (WCSSTUS1) and the US field-production page (WCRFPUS2).
const sprHtml = readFileSync(join(fixtures, 's4', 'eia-spr-2026-11-01.html'), 'utf8');
const productionHtml = readFileSync(join(fixtures, 's4', 'eia-crude-production-2026-11-01.html'), 'utf8');

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
      /the series id does not appear/,
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

// gap-closure S4-M4.4 (2026-11-01): the weekly pair's own suite — the SPR
// level and the US field production, off the M4.1 captures. Provider-exact
// pins: SPR 282,583 thousand barrels @ 2026-10-23; production 13,992
// thousand barrels per day @ 2026-10-23 (the M4.1 walk of the provider's
// own PET indexes — never guessed ids).
describe('parseEiaWeeklySeriesHtml (S4-M4.4: the SPR + field-production pages)', () => {
  it('parses the SPR capture: 282,583 thousand barrels @ 2026-10-23 (the LEVEL)', () => {
    const series = parseEiaWeeklySeriesHtml(sprHtml, EIA_SPR_SPEC);
    expect(series.length).toBeGreaterThan(2000); // 1982→2026 weekly
    expect(series.at(-1)).toEqual({ date: '2026-10-23', value: 282583 });
    // the 2020 peak class stays inside the band (the drawdown story)
    const peak = Math.max(...series.map((p) => p.value));
    expect(peak).toBeGreaterThan(700_000);
  });

  it('parses the production capture: 13,992 thousand barrels per day @ 2026-10-23 (the RATE)', () => {
    const series = parseEiaWeeklySeriesHtml(productionHtml, EIA_CRUDE_PRODUCTION_SPEC);
    expect(series.length).toBeGreaterThan(2000);
    expect(series.at(-1)).toEqual({ date: '2026-10-23', value: 13992 });
  });

  it('asserts each page’s own identity (the series id + its unit line)', () => {
    // The SPR page without its series id fails — the STOCKS spec cannot
    // read the production page (the unit needle differs).
    expect(() => parseEiaWeeklySeriesHtml(sprHtml.replace(/WCSSTUS1/g, 'OTHER'), EIA_SPR_SPEC)).toThrow(
      /the series id does not appear/,
    );
    expect(() =>
      parseEiaWeeklySeriesHtml(productionHtml.replace(/Thousand Barrels per Day/g, 'Some Other Unit'), EIA_CRUDE_PRODUCTION_SPEC),
    ).toThrow(/Thousand Barrels per Day/);
    // The production page fails the SPR spec's identity (wrong series id).
    expect(() => parseEiaWeeklySeriesHtml(productionHtml, EIA_SPR_SPEC)).toThrow(/the series id does not appear/);
  });

  it('rejects an out-of-band value on each page (a corrupt cell never renders)', () => {
    expect(() => parseEiaWeeklySeriesHtml(sprHtml.replace('>282,583', '>99,999,999'), EIA_SPR_SPEC)).toThrow(
      /outside the plausible weekly band/,
    );
    expect(() =>
      parseEiaWeeklySeriesHtml(productionHtml.replace('>13,992', '>999,999'), EIA_CRUDE_PRODUCTION_SPEC),
    ).toThrow(/outside the plausible weekly band/,
    );
  });

  it('the URLs are the keyless website route (the stocks page’s pattern twins)', () => {
    expect(EIA_SPR_URL).toBe(
      'https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=WCSSTUS1&f=W',
    );
    expect(EIA_CRUDE_PRODUCTION_URL).toBe(
      'https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=WCRFPUS2&f=W',
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

  // GF-P2 (2026-11-05, the owner's recorded answer K — §4 row 12 / F2): the
  // GROSS legs parse from the SAME row — the real object behind the flows
  // lane's second seat. The recorded capture's own fields: NonComm Long
  // 237,142 · NonComm Short 37,277 · OI 402,279.
  it('parses the gross legs too (GF-P2 F2): long 58.95% · short 9.27% of OI — the shares reconcile with the net', () => {
    const row = parseCftcGoldPositioning(deafut);
    // 237,142 / 402,279 = 58.95% — the F2 seat's own object.
    expect(row.grossLongSharePct).toBeCloseTo(58.949634, 4);
    // 37,277 / 402,279 = 9.27% — the recorded complement (never seated).
    expect(row.grossShortSharePct).toBeCloseTo(9.266454, 4);
    // the file's own arithmetic: long − short = net (the shares reconcile).
    expect(row.grossLongSharePct - row.grossShortSharePct).toBeCloseTo(row.netSharePct, 3);
    expect(row.grossLongSharePct + row.grossShortSharePct).toBeLessThanOrEqual(100);
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

/* ------------------------------------------------------------------ *
 * GF-P1 (2026-11-05, the owner's recorded go — the D-4/F1 repair): the
 * CFTC legacy futures-only HISTORICAL archive parse (the annual.txt long
 * format, dea/history/deacot<year>.zip). The gold rows carry EXACTLY the
 * weekly deafut.txt's column layout (verified 2026-11-05 against the
 * 2026 archive file), so these tests build the annual body from the
 * recorded deafut capture's own gold row — no live site (AGENTS.md 7).
 * ------------------------------------------------------------------ */

describe('parseCftcGoldArchiveAnnual (GF-P1 D-4/F1: the historical archive)', () => {
  /** The recorded deafut capture's gold row line (the shared column layout). */
  const goldRow = deafut.split('\n').find((l) => l.startsWith(`"${CFTC_GOLD_MARKET}"`))!;

  /** An annual.txt-shaped body: the header row, a noise market, then gold rows. */
  const annualBody = (rows: string[]): string =>
    ['"Market and Exchange Names",...', '"SOME OTHER MARKET - EXAMPLE EXCHANGE",1,2,3,4,5,6,7,8,9,10,11,12,13,14', ...rows].join('\n');

  it('parses the gold rows of the long format (the header + noise markets skipped), matching the weekly parse on the shared row', () => {
    expect(goldRow).toBeTruthy();
    const weeks = parseCftcGoldArchiveAnnual(annualBody([goldRow]));
    expect(weeks).toHaveLength(1);
    expect(weeks[0]).toEqual(parseCftcGoldPositioning(deafut)); // the same row, the same arithmetic
  });

  it('multi-week: two gold rows parse to two weeks', () => {
    // A sibling week's row: the same positions, the report dates moved.
    const cells = goldRow.split(',');
    cells[1] = '260121'; // the YYMMDD field
    cells[2] = '2026-01-21'; // the ISO date field
    const secondRow = cells.join(',');
    const weeks = parseCftcGoldArchiveAnnual(annualBody([secondRow, goldRow]));
    expect(weeks).toHaveLength(2);
    expect(weeks.map((w) => w.date)).toEqual(['2026-01-21', '2026-10-20']); // the caller sorts; the parse preserves order
  });

  it('asserts the arithmetic identity per row (a column shift fails loudly, never a silent skip)', () => {
    const cells = goldRow.split(',');
    cells[9] = '  99999'; // the NonComm Short position — the reportable-positions identity now fails
    expect(() => parseCftcGoldArchiveAnnual(annualBody([cells.join(',')]))).toThrow(
      /fails the reportable-positions identity/,
    );
  });

  it('the archive URL is the same site\'s historical route, one zip per report year', () => {
    expect(cftcArchiveUrl(2026)).toBe('https://www.cftc.gov/files/dea/history/deacot2026.zip');
    expect(cftcArchiveUrl(2016)).toBe('https://www.cftc.gov/files/dea/history/deacot2016.zip');
  });
});
