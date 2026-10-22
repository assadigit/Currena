/**
 * eia.test.ts — the 2026-10-22 reliability round's FRED-fallback adapter,
 * parsed against a REAL .xls workbook (xlwt-written, the same OLE2+BIFF8
 * structure the live EIA files carry: a Contents cover sheet + a "Data 1"
 * sheet with the Date/price grid). No network — AGENTS.md rule 7.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseEiaSpotXls, EIA_WTI_URL, EIA_BRENT_URL, EIA_NATGAS_URL } from './eia';
import { excelSerialToIso, readXlsWorkbook } from './biff';
import { FormatChangedError } from './fetch-policy';

const FIXTURE = readFileSync(join(__dirname, '../../fixtures/eia-wti-mini.xls'));
const FIXTURE_BUF = FIXTURE.buffer.slice(
  FIXTURE.byteOffset,
  FIXTURE.byteOffset + FIXTURE.byteLength,
) as ArrayBuffer;

describe('excelSerialToIso', () => {
  it('converts 1900-system serials (live cross-check: 46315 = 2026-10-20, the EIA/FRED WTI date)', () => {
    expect(excelSerialToIso(46315)).toBe('2026-10-20');
    expect(excelSerialToIso(31414)).toBe('1986-01-02'); // the live file's first row
  });

  it('refuses serials before the 1900 leap-window (< 61)', () => {
    expect(() => excelSerialToIso(60)).toThrow();
  });
});

describe('readXlsWorkbook', () => {
  it('parses both sheets of the EIA-style workbook with SST strings resolved', () => {
    const wb = readXlsWorkbook(FIXTURE_BUF);
    expect(wb.sheets).toHaveLength(2);
    expect(wb.sheets[0]!.rows[2]!.get(1)).toBe('Cushing, OK WTI Spot Price FOB (Dollars per Barrel)');
    const data = wb.sheets[1]!;
    expect(data.rows[2]!.get(0)).toBe('Date');
    expect(data.rows[1]!.get(1)).toBe('RWTC');
  });
});

describe('parseEiaSpotXls', () => {
  it('reads the full daily series off the fixture (structure + identity + ascending)', () => {
    const spot = parseEiaSpotXls(FIXTURE_BUF, 'WTI');
    expect(spot.title).toContain('WTI');
    expect(spot.series.length).toBe(115);
    expect(spot.series[0]).toEqual({ date: '2026-06-01', value: 60.1 });
    expect(spot.series.at(-1)).toEqual({ date: '2026-11-06', value: 71.5 });
  });

  it('throws FormatChangedError when the title needle is absent (wrong file / layout change)', () => {
    expect(() => parseEiaSpotXls(FIXTURE_BUF, 'Henry Hub')).toThrow(FormatChangedError);
  });

  it('throws FormatChangedError when no sheet carries a Date header', () => {
    const garbage = new ArrayBuffer(64);
    expect(() => parseEiaSpotXls(garbage, 'WTI')).toThrow(); // not even OLE2 — loud, never garbage
  });
});

describe('EIA URLs (the live venue-verified endpoints)', () => {
  it('points at the RWTCd/RBRTEd/RNGWHHDd daily workbooks', () => {
    expect(EIA_WTI_URL).toBe('https://www.eia.gov/dnav/pet/hist_xls/RWTCd.xls');
    expect(EIA_BRENT_URL).toBe('https://www.eia.gov/dnav/pet/hist_xls/RBRTEd.xls');
    expect(EIA_NATGAS_URL).toBe('https://www.eia.gov/dnav/ng/hist_xls/RNGWHHDd.xls');
  });
});
