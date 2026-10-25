/**
 * NBS adapter tests (M7, 2026-10-26) — the press-release index scan, the
 * PMI Table-1 parse and the CPI YoY parse, against TRIMMED CAPTURES OF
 * THE REAL PAGES (read 2026-10-26: the index page 1 + page 2, the
 * Sep-2026 PMI release and the Sep-2026 CPI release — the live values in
 * the expectations are the NBS's own, cross-checked against the committed
 * china-pmi seed for all 10 overlapping observations), plus synthetic
 * pages for the failure modes (the boe.test.ts conventions).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  NBS_PRESS_INDEX_URL,
  latestCpiRelease,
  latestPmiRelease,
  parseNbsCpiRelease,
  parseNbsPmiRelease,
  parseNbsPressIndex,
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
