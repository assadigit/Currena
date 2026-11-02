/**
 * NBS adapter tests (M7, 2026-10-26) — the press-release index scan, the
 * PMI Table-1 parse and the CPI YoY parse, against TRIMMED CAPTURES OF
 * THE REAL PAGES (read 2026-10-26: the index page 1 + page 2, the
 * Sep-2026 PMI release and the Sep-2026 CPI release — the live values in
 * the expectations are the NBS's own, cross-checked against the committed
 * china-pmi seed for all 10 overlapping observations), plus synthetic
 * pages for the failure modes (the boe.test.ts conventions).
 *
 * gap-closure S6-M6.2 (2026-11-02): the China property/steel family — the
 * index scan's two new link finders + the real-estate YTD parse + the
 * crude-steel output parse, against TRIMMED CAPTURES OF THE REAL PAGES
 * (read 2026-11-02: the live index page 1, the Jan-Sep 2026 real-estate
 * release and the Sep-2026 industrial production release — every expected
 * value is the NBS's own, cross-checked table-vs-headline inside the
 * parser itself).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  NBS_PRESS_INDEX_URL,
  latestCpiRelease,
  latestIndustrialProductionRelease,
  latestPmiRelease,
  latestRealEstateRelease,
  parseNbsCpiRelease,
  parseNbsIndustrialProductionRelease,
  parseNbsPmiRelease,
  parseNbsPressIndex,
  parseNbsRealEstateRelease,
} from './nbs';

const FIXTURES = join(__dirname, '..', '..', 'fixtures');
const fixture = (name: string): string => readFileSync(join(FIXTURES, name), 'utf-8');

describe('nbs adapter — the press-release index scan', () => {
  it('parses the real page 1: 15 dated release rows, newest first', () => {
    const links = parseNbsPressIndex(fixture('nbs-press-index.html'), NBS_PRESS_INDEX_URL);
    expect(links).toHaveLength(15);
    // the title ATTRIBUTE carries no list prefix (the anchor text's
    // "1."-style numbering is display chrome) and the span date can be
    // a day after the URL's t-date — both are the page's own conventions
    expect(links[0]).toEqual({
      url: 'https://www.stats.gov.cn/english/PressRelease/202610/t20261023_1965682.html',
      title: 'Market Prices of Important Means of Production in Circulation,October 11-20, 2026',
      published: '2026-10-24',
    });
    // all URLs resolved absolute against the index base
    for (const l of links) expect(l.url.startsWith('https://www.stats.gov.cn/english/PressRelease/')).toBe(true);
  });

  it('finds the Sep-2026 CPI release on page 1 (published 2026-10-15) and no PMI there', () => {
    const links = parseNbsPressIndex(fixture('nbs-press-index.html'), NBS_PRESS_INDEX_URL);
    const cpi = latestCpiRelease(links);
    expect(cpi).toBeDefined();
    expect(cpi!.title).toBe('Consumer Price Index in September 2026');
    expect(cpi!.url).toBe('https://www.stats.gov.cn/english/PressRelease/202610/t20261015_1965500.html');
    expect(cpi!.published).toBe('2026-10-15');
    expect(latestPmiRelease(links)).toBeUndefined();
  });

  it('finds the Sep-2026 PMI release on page 2 (published 2026-10-01)', () => {
    const links = parseNbsPressIndex(
      fixture('nbs-press-index-2.html'),
      'https://www.stats.gov.cn/english/PressRelease/index_1.html',
    );
    const pmi = latestPmiRelease(links);
    expect(pmi).toBeDefined();
    expect(pmi!.title).toBe("Purchasing Managers' Index for September 2026");
    expect(pmi!.url).toBe('https://www.stats.gov.cn/english/PressRelease/202610/t20261008_1965466.html');
    expect(pmi!.published).toBe('2026-10-01');
  });

  it('skips anchors without a following date span (the nav chrome)', () => {
    const noisy = `<!DOCTYPE html><html><body>
      <a target="_blank" title="Some navigation page" href="./202610/t20261023_1965682.html">nav</a>
      <a target="_blank" title="Consumer Price Index in September 2026" href="./202610/t20261015_1965500.html">13.Consumer Price Index in September 2026</a>
      <span>2026-10-15</span>
    </body></html>`;
    const links = parseNbsPressIndex(noisy, NBS_PRESS_INDEX_URL);
    expect(links).toHaveLength(1);
    expect(links[0]!.title).toBe('Consumer Price Index in September 2026');
  });
});

describe('nbs adapter — the PMI Table-1 parse (the real Sep-2026 release)', () => {
  it('parses the 13-month history: month-end dates, the year inferred across January', () => {
    const out = parseNbsPmiRelease(fixture('nbs-pmi-release.html'));
    expect(out).toHaveLength(13);
    expect(out[0]).toEqual({ date: '2025-09-30', value: 49.8 });
    // the December→January boundary: the bare labels after 2025-September
    // roll the year forward (2026-January onward)
    expect(out.find((p) => p.date === '2025-12-31')).toEqual({ date: '2025-12-31', value: 50.1 });
    expect(out.find((p) => p.date === '2026-01-31')).toEqual({ date: '2026-01-31', value: 49.3 });
    // the latest row is the release month itself, 50.1 (the seed's own value)
    expect(out.at(-1)).toEqual({ date: '2026-09-30', value: 50.1 });
    // every one of the committed seed's 10 observations matches the table
    // exactly (verified 2026-10-26 — the automation subsumes the manual file)
    const seed: ReadonlyArray<[string, number]> = [
      ['2025-12-31', 50.1], ['2026-01-31', 49.3], ['2026-02-28', 49.0], ['2026-03-31', 50.4],
      ['2026-04-30', 50.3], ['2026-05-31', 50.0], ['2026-06-30', 50.3], ['2026-07-31', 49.2],
      ['2026-08-31', 49.8], ['2026-09-30', 50.1],
    ];
    for (const [date, value] of seed) {
      expect(out.find((p) => p.date === date)).toEqual({ date, value });
    }
  });

  it('fails loudly when Table 1 is missing (F-16)', () => {
    const broken = fixture('nbs-pmi-release.html').replace(/Table 1/, 'Table A');
    expect(() => parseNbsPmiRelease(broken)).toThrowError(/Table 1 header was not found/);
  });

  it('fails loudly on an out-of-range PMI value', () => {
    // synthetic full-width table with one impossible value (the range
    // guard is deterministic — the real fixture's markup differs per cell)
    const monthNames = ['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September'];
    const body: string[] = [];
    monthNames.forEach((mn, i) => {
      const label = i === 0 ? `2025-${mn}` : mn;
      const v = i === 5 ? 500.1 : 50;
      body.push(`<p>${label}</p><p>${v}</p><p>51</p><p>49</p><p>48</p><p>48</p><p>50</p>`);
    });
    const html = `<!DOCTYPE html><html><body>
      <p>Table 1 China's Manufacturing PMI and Sub-indexes (Seasonally Adjusted)</p>
      <p>Unit: %</p>
      ${body.join('\n')}
      <p>Table 2 Other Related Indexes</p>
    </body></html>`;
    expect(() => parseNbsPmiRelease(html)).toThrowError(/out-of-range/);
  });

  it('fails loudly on a truncated table (fewer than 12 month rows)', () => {
    const html = `<!DOCTYPE html><html><body>
      <p>Table 1 China's Manufacturing PMI and Sub-indexes (Seasonally Adjusted)</p>
      <p>2025-September</p><p>49.8</p><p>51.9</p><p>49.7</p><p>48.5</p><p>48.5</p><p>50.8</p>
      <p>October</p><p>49.0</p><p>49.7</p><p>48.8</p><p>47.3</p><p>48.3</p><p>50.0</p>
      <p>Table 2 Other Related Indexes</p>
    </body></html>`;
    expect(() => parseNbsPmiRelease(html)).toThrowError(/expected the 13-month history/);
  });
});

describe('nbs adapter — the CPI YoY parse (the real Sep-2026 release)', () => {
  it('parses the table Y/Y (0.9) with the headline cross-check agreeing', () => {
    const out = parseNbsCpiRelease(fixture('nbs-cpi-release.html'));
    expect(out).toEqual([{ date: '2026-09-30', value: 0.9 }]);
  });

  it('parses a negative YoY month (the Sep-2025 deflation, synthetic)', () => {
    const html = `<!DOCTYPE html><html><body>
      <p>Consumer Price Index in September 2025</p>
      <p>In September 2025, China’s Consumer Price Index (CPI) decreased by 0.3% year on year.</p>
      <p>Consumer Price Indexes in September 2025</p>
      <p>Growth Rate M/M(%)Growth Rate Y/Y(%)Jan-Sep Growth Rate Y/Y(%)</p>
      <p>Consumer Price Index</p><p>0.1</p><p>-0.3</p><p>-0.1</p>
      <p>Of which: Urban</p><p>0.2</p><p>-0.2</p><p>0.1</p>
    </body></html>`;
    expect(parseNbsCpiRelease(html)).toEqual([{ date: '2025-09-30', value: -0.3 }]);
  });

  it('parses the January two-column table (no year-to-date column, synthetic)', () => {
    const html = `<!DOCTYPE html><html><body>
      <p>Consumer Price Index in January 2026</p>
      <p>In January 2026, China’s Consumer Price Index (CPI) increased by 0.2% year on year.</p>
      <p>Consumer Price Indexes in January 2026</p>
      <p>Growth Rate M/M(%)Growth Rate Y/Y(%)</p>
      <p>Consumer Price Index</p><p>0.2</p><p>0.2</p>
      <p>Of which: Urban</p><p>0.2</p><p>0.2</p>
    </body></html>`;
    expect(parseNbsCpiRelease(html)).toEqual([{ date: '2026-01-31', value: 0.2 }]);
  });

  it('fails loudly when the headline and the table disagree (F-16)', () => {
    const html = `<!DOCTYPE html><html><body>
      <p>Consumer Price Index in September 2026</p>
      <p>In September 2026, China’s Consumer Price Index (CPI) increased by 2.9% year on year.</p>
      <p>Consumer Price Indexes in September 2026</p>
      <p>Growth Rate M/M(%)Growth Rate Y/Y(%)Jan-Sep Growth Rate Y/Y(%)</p>
      <p>Consumer Price Index</p><p>0.2</p><p>0.9</p><p>0.9</p>
      <p>Of which: Urban</p><p>0.2</p><p>0.9</p><p>0.9</p>
    </body></html>`;
    expect(() => parseNbsCpiRelease(html)).toThrowError(/disagrees with the table/);
  });

  it('fails loudly when the title/table row is missing (layout changed)', () => {
    const broken = fixture('nbs-cpi-release.html').replace(/Consumer Price Indexes in September 2026/, 'Prices 2026');
    expect(() => parseNbsCpiRelease(broken)).toThrowError(/summary table header was not found/);
  });
});

describe('nbs adapter — the S6-M6.2 link finders (the live 2026-11-02 index)', () => {
  it('finds the Jan-Sep 2026 real-estate release (published 2026-10-20)', () => {
    const links = parseNbsPressIndex(fixture('nbs-press-index-3.html'), NBS_PRESS_INDEX_URL);
    const re = latestRealEstateRelease(links);
    expect(re).toBeDefined();
    expect(re!.title).toBe('Investment in Real Estate Development from January to September 2026');
    expect(re!.url).toBe('https://www.stats.gov.cn/english/PressRelease/202610/t20261020_1965663.html');
    expect(re!.published).toBe('2026-10-20');
  });

  it('finds the Sep-2026 industrial production release (published 2026-10-20)', () => {
    const links = parseNbsPressIndex(fixture('nbs-press-index-3.html'), NBS_PRESS_INDEX_URL);
    const ip = latestIndustrialProductionRelease(links);
    expect(ip).toBeDefined();
    expect(ip!.title).toBe('Industrial Production Operation in September 2026');
    expect(ip!.url).toBe('https://www.stats.gov.cn/english/PressRelease/202610/t20261020_1965665.html');
    expect(ip!.published).toBe('2026-10-20');
  });

  it('rejects the headline-style National Economy release (its title varies)', () => {
    // the comprehensive release is NOT the machine-readable path: its title
    // is a prose headline ("...was Generally Stable with..."), not a fixed
    // pattern — the dedicated per-topic releases are
    const links = parseNbsPressIndex(fixture('nbs-press-index-3.html'), NBS_PRESS_INDEX_URL);
    expect(
      links.some((l) => /National Economy/.test(l.title) && latestRealEstateRelease([l]) !== undefined),
    ).toBe(false);
  });
});

describe('nbs adapter — the real-estate YTD parse (the real Jan-Sep 2026 release)', () => {
  it('parses the YTD YoY (-20.6% @ 2026-09-30) with the headline cross-check agreeing', () => {
    const out = parseNbsRealEstateRelease(fixture('nbs-realestate-release.html'));
    expect(out).toEqual([{ date: '2026-09-30', value: -20.6 }]);
  });

  it('parses a growth month (synthetic, the wording verified against the real page)', () => {
    const html = `<!DOCTYPE html><html><body>
      <p>Investment in Real Estate Development from January to June in 2025</p>
      <p>From January to June, the investment in real estate development was 5,000.0 billion yuan, a year-on-year increase of 1.2%.</p>
      <p>Table 1 Real Estate Development and Sales from January to June 2025</p>
      <p>Indicator</p>
      <p>Absolute Value</p>
      <p>Growth Rate Y/Y (%)</p>
      <p>Investment in real estate development (100 million yuan)</p><p>50000</p><p>1.2</p>
      <p>Of which: Residential buildings</p><p>38000</p><p>0.5</p>
    </body></html>`;
    expect(parseNbsRealEstateRelease(html)).toEqual([{ date: '2025-06-30', value: 1.2 }]);
  });

  it('parses the combined January-February release (the real 2026 pair — no Table 1 prefix, −11.1 @ 2026-02-28)', () => {
    const out = parseNbsRealEstateRelease(fixture('nbs-realestate-release-janfeb.html'));
    expect(out).toEqual([{ date: '2026-02-28', value: -11.1 }]);
  });

  it('parses the 2025 title form (for January-November 2025: −15.9 @ 2025-11-30)', () => {
    const out = parseNbsRealEstateRelease(fixture('nbs-realestate-release-nov2025.html'));
    expect(out).toEqual([{ date: '2025-11-30', value: -15.9 }]);
  });

  it('parses the ANNUAL form (for 2025: −17.2 @ 2025-12-31)', () => {
    const out = parseNbsRealEstateRelease(fixture('nbs-realestate-release-annual2025.html'));
    expect(out).toEqual([{ date: '2025-12-31', value: -17.2 }]);
  });

  it('fails loudly when the headline and the table disagree (a column shift)', () => {
    const html = `<!DOCTYPE html><html><body>
      <p>Investment in Real Estate Development from January to September in 2026</p>
      <p>From January to September, the investment in real estate development was 5,336.4 billion yuan, a year-on-year decrease of 20.6%.</p>
      <p>Table 1 Real Estate Development and Sales from January to September 2026</p>
      <p>Indicator</p>
      <p>Absolute Value</p>
      <p>Growth Rate Y/Y (%)</p>
      <p>Investment in real estate development (100 million yuan)</p><p>53364</p><p>-12.9</p>
      <p>Of which: Residential buildings</p><p>41125</p><p>-20.5</p>
    </body></html>`;
    expect(() => parseNbsRealEstateRelease(html)).toThrowError(/disagrees with the table/);
  });

  it('fails loudly when the headline level and the table level disagree (unit shift)', () => {
    const html = `<!DOCTYPE html><html><body>
      <p>Investment in Real Estate Development from January to September in 2026</p>
      <p>From January to September, the investment in real estate development was 6,000.0 billion yuan, a year-on-year decrease of 20.6%.</p>
      <p>Table 1 Real Estate Development and Sales from January to September 2026</p>
      <p>Indicator</p>
      <p>Absolute Value</p>
      <p>Growth Rate Y/Y (%)</p>
      <p>Investment in real estate development (100 million yuan)</p><p>53364</p><p>-20.6</p>
      <p>Of which: Residential buildings</p><p>41125</p><p>-20.5</p>
    </body></html>`;
    expect(() => parseNbsRealEstateRelease(html)).toThrowError(/headline level/);
  });

  it('fails loudly when the Table 1 header is missing (F-16)', () => {
    const broken = fixture('nbs-realestate-release.html').replace(/Table 1 Real Estate Development and Sales/, 'Table A Property');
    expect(() => parseNbsRealEstateRelease(broken)).toThrowError(/Table 1 header was not found/);
  });

  it('fails loudly when the investment row is missing (F-16)', () => {
    const broken = fixture('nbs-realestate-release.html').replace(
      /Investment in real estate development \(100 million yuan\)/,
      'Property development spending (100 million yuan)',
    );
    expect(() => parseNbsRealEstateRelease(broken)).toThrowError(/investment row was not found/);
  });

  it('fails loudly on an out-of-range YTD value', () => {
    const html = `<!DOCTYPE html><html><body>
      <p>Investment in Real Estate Development from January to September in 2026</p>
      <p>Table 1 Real Estate Development and Sales from January to September 2026</p>
      <p>Indicator</p>
      <p>Absolute Value</p>
      <p>Growth Rate Y/Y (%)</p>
      <p>Investment in real estate development (100 million yuan)</p><p>53364</p><p>-220.6</p>
      <p>Of which: Residential buildings</p><p>41125</p><p>-220.5</p>
    </body></html>`;
    expect(() => parseNbsRealEstateRelease(html)).toThrowError(/out-of-range/);
  });
});

describe('nbs adapter — the crude-steel output parse (the real Sep-2026 release)', () => {
  it('parses the monthly output (7359 x 10k tons @ 2026-09-30) with the rolled-steel prose cross-check agreeing', () => {
    const out = parseNbsIndustrialProductionRelease(fixture('nbs-indprod-release.html'));
    expect(out).toEqual([{ date: '2026-09-30', value: 7359 }]);
  });

  it('parses a synthetic month with masked neighbour cells (the ellipsis rows)', () => {
    const html = `<!DOCTYPE html><html><body>
      <p>Industrial Production Operation in August 2026</p>
      <p>In terms of products, in August, the output of rolled steel was 100.00 million tons, down by 1.0% year on year.</p>
      <p>Output of Major Industrial Products of Enterprises Above the Designated Size</p>
      <p>Crude Steel (10,000 tons)</p><p>8000</p><p>0.5</p><p>64000</p><p>-1.0</p>
      <p>Rolled Steel (10,000 tons)</p><p>10000</p><p>-1.0</p><p>80000</p><p>-2.0</p>
      <p>Cement (10,000 tons)</p><p>…</p><p>…</p><p>…</p><p>…</p>
    </body></html>`;
    expect(parseNbsIndustrialProductionRelease(html)).toEqual([{ date: '2026-08-31', value: 8000 }]);
  });

  it('parses the real Sep-2025 release (the older header + spelled-out percent prose: 7349 @ 2025-09-30)', () => {
    const out = parseNbsIndustrialProductionRelease(fixture('nbs-indprod-release-2025.html'));
    expect(out).toEqual([{ date: '2025-09-30', value: 7349 }]);
  });

  it('parses the real Aug-2025 release (the LOWERCASE row labels: Crude steel 7737 @ 2025-08-31)', () => {
    const out = parseNbsIndustrialProductionRelease(fixture('nbs-indprod-release-aug2025.html'));
    expect(out).toEqual([{ date: '2025-08-31', value: 7737 }]);
  });

  it('fails loudly when the rolled-steel prose cross-check disagrees (a column shift)', () => {
    const html = `<!DOCTYPE html><html><body>
      <p>Industrial Production Operation in September 2026</p>
      <p>In terms of products, in September, the output of rolled steel was 118.17 million tons, down by 3.8% year on year.</p>
      <p>Output of Major Industrial Products of Enterprises Above the Designated Size</p>
      <p>Crude Steel (10,000 tons)</p><p>7359</p><p>0.1</p><p>72477</p><p>-2.9</p>
      <p>Rolled Steel (10,000 tons)</p><p>1181</p><p>-3.8</p><p>10671</p><p>-2.0</p>
    </body></html>`;
    expect(() => parseNbsIndustrialProductionRelease(html)).toThrowError(/rolled-steel cross-check/);
  });

  it('fails loudly when the products-table header is missing (F-16)', () => {
    const broken = fixture('nbs-indprod-release.html').replace(
      /Output of Major Industrial Products of Enterprises Above the Designated Size/,
      'Outputs of Products',
    );
    expect(() => parseNbsIndustrialProductionRelease(broken)).toThrowError(/products table was not found/);
  });

  it('fails loudly when the Crude Steel row is missing (F-16)', () => {
    const broken = fixture('nbs-indprod-release.html').replace(/Crude Steel \(10,000 tons\)/, 'Steel, Crude (10k tonnes)');
    expect(() => parseNbsIndustrialProductionRelease(broken)).toThrowError(/Crude Steel row was not found/);
  });

  it('fails loudly on an out-of-range output value', () => {
    const html = `<!DOCTYPE html><html><body>
      <p>Industrial Production Operation in September 2026</p>
      <p>Output of Major Industrial Products of Enterprises Above the Designated Size</p>
      <p>Crude Steel (10,000 tons)</p><p>735900</p><p>0.1</p><p>72477</p><p>-2.9</p>
      <p>Rolled Steel (10,000 tons)</p><p>11817</p><p>-3.8</p><p>106710</p><p>-2.0</p>
    </body></html>`;
    expect(() => parseNbsIndustrialProductionRelease(html)).toThrowError(/out-of-range/);
  });
});
