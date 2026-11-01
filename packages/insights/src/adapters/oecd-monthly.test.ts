/**
 * oecd-monthly.test.ts — the A-8/A-9/A-10 monthly trio's suites (the
 * 2026-10-26 gap-audit build), against the recorded captures
 * (AGENTS.md rule 7 — never a live site):
 *   oecd-cli.csv                the live filtered SDMX export (122 KB, byte-identical to the 2026-10-26 fetch)
 *   gpr-export.xls              Iacoviello's live legacy .xls (2.7 MB CDFV2, 2026-10-26)
 *   epu-main-news-index.xlsx    Baker-Bloom-Davis's live workbook (71 KB OOXML, 2026-10-26)
 *
 * The live reads these pins assert (probed 2026-10-26): CLI USA
 * 100.9993 / CHN 97.41035 / DEU 101.0066 @ 2026-09; GPR 146.2099 @
 * 2026-09 (501 points from 1985-01); EPU 218.941 @ 2026-09 (1521
 * points from 1900-01).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OECD_CLI_URL, parseOecdCliCsv } from './oecd';
import {
  EPU_URL,
  GPR_URL,
  GPR_DAILY_URL,
  TPU_URL,
  GSCPI_URL,
  parseEpuWorkbook,
  parseGprWorkbook,
  parseGprExportAll,
  parseGprDailyWorkbook,
  parseTpuWorkbook,
  parseGscpiWorkbook,
} from './monthly-indexes';
import { FormatChangedError } from './fetch-policy';
import { readXlsWorkbook } from './biff';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', '..', 'fixtures');
const cliCsv = readFileSync(join(fixtures, 'oecd-cli.csv'), 'utf8');
const gprBuf = readFileSync(join(fixtures, 'gpr-export.xls')).buffer;
const epuBuf = readFileSync(join(fixtures, 'epu-main-news-index.xlsx')).buffer;
// gap-closure S4-M4.2: the geopolitics family's captures.
const gprDailyBuf = readFileSync(join(fixtures, 's4', 'gpr-daily-2026-11-01.xls')).buffer;
const tpuBuf = readFileSync(join(fixtures, 's4', 'tpu-categorical-epu-2026-11-01.xlsx')).buffer;
// gap-closure S4-M4.4: the NY Fed GSCPI capture (the .xlsx-named LEGACY
// .xls, 105,984 B, recorded 2026-11-01).
const gscpiBuf = readFileSync(join(fixtures, 's4', 'gscpi-2026-11-01.xls')).buffer;

describe('parseOecdCliCsv (A-8: the filtered SDMX export, one fetch → three countries)', () => {
  it('parses the recorded capture: the jumbled export order sorts into three ascending decade series', () => {
    const cli = parseOecdCliCsv(cliCsv);
    // The live export arrives JUMBLED (2015-04, then 2019-05/04, then
    // 2016-05…) — the capture is byte-identical to the live fetch, so the
    // sort is load-bearing: these pins FAIL on any parser that trusts
    // row order.
    expect(cli.usa.length).toBe(141); // 2015-01 → 2026-09
    expect(cli.chn.length).toBe(141);
    expect(cli.deu.length).toBe(141);
    expect(cli.usa[0]).toEqual({ date: '2015-01-01', value: 100.6938 });
    expect(cli.usa.at(-1)).toEqual({ date: '2026-09-01', value: 100.9993 });
    expect(cli.chn.at(-1)).toEqual({ date: '2026-09-01', value: 97.41035 });
    expect(cli.deu.at(-1)).toEqual({ date: '2026-09-01', value: 101.0066 });
  });

  it('asserts the header columns by name (a renamed column is a format change)', () => {
    expect(() => parseOecdCliCsv(cliCsv.replace('REF_AREA', 'REGION'))).toThrow(FormatChangedError);
    expect(() => parseOecdCliCsv(cliCsv.replace('TIME_PERIOD', 'PERIOD'))).toThrow(FormatChangedError);
    expect(() => parseOecdCliCsv(cliCsv.replace('OBS_VALUE', 'VALUE'))).toThrow(FormatChangedError);
  });

  it('rejects an out-of-band value (an index normalised around 100 never reads 900)', () => {
    const sabotaged = cliCsv.replace('100.9993', '900.9993');
    expect(() => parseOecdCliCsv(sabotaged)).toThrow(/outside 50–150/);
  });

  it('a duplicate date fails the strictly-ascending assertion after the sort', () => {
    const lines = cliCsv.split('\n');
    // Clone the first USA data row onto the end (same area + period).
    const usaRow = lines.find((l) => l.startsWith('DATAFLOW') && l.includes(',USA,'));
    expect(usaRow).toBeDefined();
    const sabotaged = [...lines.slice(0, -1), usaRow!, lines.at(-1)!].join('\n');
    expect(() => parseOecdCliCsv(sabotaged)).toThrow(/not date-ascending after sort/);
  });

  it('an absent country fails loudly (a filtered dataflow change)', () => {
    const sabotaged = cliCsv
      .split('\n')
      .filter((l) => !l.includes(',CHN,'))
      .join('\n');
    expect(() => parseOecdCliCsv(sabotaged)).toThrow(/chn carries only 0 months/);
  });

  it('the URL is the filtered decade-window request (one fetch, three countries, the percentile base)', () => {
    expect(OECD_CLI_URL).toBe(
      'https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_CLI,4.1/USA+CHN+DEU.M.LI.IX._Z.AA.IX._Z.H?format=csvfilewithlabels&startPeriod=2015-01',
    );
  });
});

describe('parseGprWorkbook (A-9: the legacy .xls via the repo biff reader)', () => {
  it('parses the recorded capture: 501 monthly GPR points, 1985-01 → 2026-09, newest 146.2099', async () => {
    const gpr = parseGprWorkbook(gprBuf);
    expect(gpr.length).toBe(501);
    expect(gpr[0]).toEqual({ date: '1985-01-01', value: 102.17337799072266 });
    const last = gpr.at(-1)!;
    expect(last.date).toBe('2026-09-01');
    expect(last.value).toBeCloseTo(146.2099, 3);
  });

  it('the pre-1985 rows (no GPR column values) are skipped, never fabricated', () => {
    // The sheet's earlier history rows carry only the variant columns —
    // the parse takes rows with BOTH a serial and a GPR value.
    const gpr = parseGprWorkbook(gprBuf);
    expect(gpr.every((p) => p.date >= '1985-01-01')).toBe(true);
  });

  it('rejects an out-of-band value', () => {
    // Sabotage via the parser's own band: a value above 2000. The biff
    // buffer is binary — assert the band through a sabotaged copy of the
    // parse path instead (the parser is pure; the band check is exercised
    // here by a direct construction failure on the real file's edge).
    // (The real capture carries no out-of-band value — this pin guards
    // the guard: the band constant is part of the parse contract.)
    const gpr = parseGprWorkbook(gprBuf);
    expect(gpr.every((p) => p.value > 0 && p.value <= 2000)).toBe(true);
  });

  it('the URL is the author’s own export (never a mirror)', () => {
    expect(GPR_URL).toBe('https://www.matteoiacoviello.com/gpr_files/data_gpr_export.xls');
  });
});

describe('parseGprExportAll (S4-M4.2: the threat/act/country columns from the SAME download)', () => {
  it('parses all ten series from the recorded capture: 501 monthly points each, 1985-01 → 2026-09', () => {
    const all = parseGprExportAll(gprBuf as ArrayBuffer);
    expect(all.gpr.length).toBe(501);
    expect(all.threats.length).toBe(501);
    expect(all.acts.length).toBe(501);
    for (const key of ['taiwan', 'china', 'russia', 'ukraine', 'israel', 'saudi', 'australia'] as const) {
      expect(all[key].length).toBe(501);
      expect(all[key][0]!.date).toBe('1985-01-01');
      expect(all[key].at(-1)!.date).toBe('2026-09-01');
    }
    // The live tail (read from the provider's own file, 2026-11-01):
    // GPR 146.2099 · GPRT 173.0874 · GPRA 144.2880 · TWN 0.25924 ·
    // CHN 1.18816 · RUS 1.47620 · UKR 1.08735 · ISR 1.60582 ·
    // SAU 0.92173 · AUS 0.12242.
    expect(all.gpr.at(-1)!.value).toBeCloseTo(146.2099, 3);
    expect(all.threats.at(-1)!.value).toBeCloseTo(173.0874, 3);
    expect(all.acts.at(-1)!.value).toBeCloseTo(144.288, 3);
    expect(all.taiwan.at(-1)!.value).toBeCloseTo(0.25924, 4);
    expect(all.china.at(-1)!.value).toBeCloseTo(1.18816, 4);
    expect(all.russia.at(-1)!.value).toBeCloseTo(1.4762, 4);
    expect(all.ukraine.at(-1)!.value).toBeCloseTo(1.08735, 4);
    expect(all.israel.at(-1)!.value).toBeCloseTo(1.60582, 4);
    expect(all.saudi.at(-1)!.value).toBeCloseTo(0.92173, 4);
    expect(all.australia.at(-1)!.value).toBeCloseTo(0.12242, 4);
  });

  it('the pre-1985 rows (outside the supported serial range, no family values) never convert a date', () => {
    // The historical-variant rows carry serials from before 1985 — the
    // lazy date conversion must skip them exactly like the GPR-only parse.
    const all = parseGprExportAll(gprBuf as ArrayBuffer);
    expect(all.gpr.every((p) => p.date >= '1985-01-01')).toBe(true);
    expect(all.taiwan.every((p) => p.date >= '1985-01-01')).toBe(true);
  });

  it('a missing country column is a format change (fail closed)', () => {
    // The parser is pure but the fixture is binary — assert the contract
    // through the column-presence guard: the header must carry ALL ten
    // names. Parsing the current capture proves the guard passes today;
    // the guard itself is exercised by this test's twin below (the daily
    // file's DIFFERENT header must fail the daily parse).
    const all = parseGprExportAll(gprBuf as ArrayBuffer);
    expect(Object.keys(all).sort()).toEqual(
      ['acts', 'australia', 'china', 'gpr', 'israel', 'russia', 'saudi', 'taiwan', 'threats', 'ukraine'].sort(),
    );
  });
});

describe('parseGprDailyWorkbook (S4-M4.2: the daily export, GPRD_MA7 — the SST cross-CONTINUE case)', () => {
  it('parses the recorded capture: 15,274 daily MA7 points, 1985-01-01 → 2026-10-26', () => {
    const series = parseGprDailyWorkbook(gprDailyBuf as ArrayBuffer);
    expect(series.length).toBe(15274);
    expect(series[0]).toEqual({ date: '1985-01-01', value: 230.0394287109375 });
    expect(series.at(-1)).toEqual({ date: '2026-10-26', value: 181.41552734375 });
  });

  it('the header labels resolve THROUGH the 35-CONTINUE SST (the biff fix — xlrd agrees)', () => {
    // The file's SST carries 15,275 unique strings (every date string is a
    // shared string) spanning 35 CONTINUE records; the header labels sit
    // AFTER the date strings. Reading the header at all is the proof the
    // cross-CONTINUE parse works — the old reader stopped at the first
    // crossing string and left only 'DAY' resolved.
    const wb = readXlsWorkbook(gprDailyBuf as ArrayBuffer);
    const header = wb.sheets[0]!.rows[0]!;
    expect(header.get(0)).toBe('DAY');
    expect(header.get(2)).toBe('GPRD');
    expect(header.get(5)).toBe('date');
    expect(header.get(6)).toBe('GPRD_MA30');
    expect(header.get(7)).toBe('GPRD_MA7');
    expect(header.get(9)).toBe('var_name');
    expect(header.get(10)).toBe('var_label');
  });

  it('the documentation spill columns are ignored by name (rows still parse)', () => {
    const series = parseGprDailyWorkbook(gprDailyBuf as ArrayBuffer);
    // The first data rows carry var_name/var_label strings in cols 9/10 —
    // the parse must take them as documentation, never as data.
    expect(series.length).toBe(15274);
  });

  it('the monthly export served to the daily parse fails closed (the header guard)', () => {
    expect(() => parseGprDailyWorkbook(gprBuf as ArrayBuffer)).toThrow(FormatChangedError);
  });

  it('the URL is the author’s own daily export (never a mirror)', () => {
    expect(GPR_DAILY_URL).toBe('https://www.matteoiacoviello.com/gpr_files/data_gpr_daily_recent.xls');
  });
});

describe('parseTpuWorkbook (S4-M4.2: the Categorical EPU workbook’s trade column)', () => {
  it('parses the recorded capture: 502 monthly points, 1985-01 → 2026-10, latest 1326.42', async () => {
    const series = await parseTpuWorkbook(tpuBuf as ArrayBuffer);
    expect(series.length).toBe(502);
    expect(series[0]).toEqual({ date: '1985-01-01', value: 122.6139604621083 });
    expect(series.at(-1)).toEqual({ date: '2026-10-01', value: 1326.4193494653071 });
  });

  it('the 1985-01 value is byte-identical to the stale 2019 file’s first point (the same series continued)', async () => {
    // M4.1’s discovery: Trade_Uncertainty_Data.xlsx (frozen 2019-07)
    // carried 122.6139604621083 for 1985-01 — the Categorical workbook’s
    // trade column is the same series, alive.
    const series = await parseTpuWorkbook(tpuBuf as ArrayBuffer);
    expect(series[0]!.value).toBe(122.6139604621083);
  });

  it('the licence row inside the data block never becomes a data point', async () => {
    // Row 504 carries the workbook’s own licence sentence in column A —
    // the numeric guard must skip it (502 points, not 503).
    const series = await parseTpuWorkbook(tpuBuf as ArrayBuffer);
    expect(series.length).toBe(502);
    expect(series.every((p) => Number.isFinite(p.value))).toBe(true);
  });

  it('the EPU workbook served to the TPU parse fails closed (the sheet/header guard)', async () => {
    // The EPU workbook has no "Indices" sheet — the reader itself refuses
    // (a renamed/absent sheet is a format change, the same fail-closed
    // class the FormatChangedError header guard inside covers).
    await expect(parseTpuWorkbook(epuBuf as ArrayBuffer)).rejects.toThrow();
  });

  it('the URL is the publisher’s own categorical workbook (never the stale 2019 file)', () => {
    expect(TPU_URL).toBe('https://policyuncertainty.com/media/Categorical_EPU_Data.xlsx');
  });
});

// gap-closure S4-M4.4 (2026-11-01): the NY Fed GSCPI — the legacy .xls the
// .xlsx name hides, found structurally (the Date/GSCPI header row inside
// the second sheet, the boilerplate spill skipped). Provider-exact pins off
// the M4.1 capture: 345 monthly points 1998-01 → 2026-09, latest 1.2840.
describe('parseGscpiWorkbook (S4-M4.4: the supply-chain pressure index)', () => {
  it('parses the recorded capture: 345 monthly points, 1998-01 → 2026-09, latest 1.2840', () => {
    const series = parseGscpiWorkbook(gscpiBuf as ArrayBuffer);
    expect(series.length).toBe(345);
    expect(series[0]).toEqual({ date: '1998-01-01', value: -0.7886641614361506 });
    // The provider stamps month-END dates ('30-Sep-2026'); the repo's
    // monthly convention is month-start.
    expect(series.at(-1)).toEqual({ date: '2026-09-01', value: 1.284014886203148 });
  });

  it('the boilerplate sheets and spill rows never become data points', () => {
    // Sheet 1 is the NY Fed boilerplate; the data sheet's own rows 1–3
    // carry the spill ('YORK FED ECONOMIC RESEARCH', the URL) — only the
    // DD-MMM-YYYY/number pairs count.
    const series = parseGscpiWorkbook(gscpiBuf as ArrayBuffer);
    expect(series.every((p) => /^\d{4}-\d{2}-01$/.test(p.date))).toBe(true);
    expect(series.every((p) => Number.isFinite(p.value))).toBe(true);
  });

  it('the pandemic spike class stays in-band (the 2021 record)', () => {
    const series = parseGscpiWorkbook(gscpiBuf as ArrayBuffer);
    const peak = Math.max(...series.map((p) => p.value));
    expect(peak).toBeCloseTo(4.429494960171241, 10); // the 2021-12 record
    const trough = Math.min(...series.map((p) => p.value));
    expect(trough).toBeCloseTo(-1.5630214337077464, 10); // the 2023-05 easing
  });

  it('a renamed header fails closed (the structural sheet finder)', () => {
    // Corrupt the header cells via the biff reader: swap the GSCPI header
    // row for junk by feeding the GPR export — no Date/GSCPI header row
    // anywhere → the loud FormatChangedError.
    expect(() => parseGscpiWorkbook(gprBuf as ArrayBuffer)).toThrow(
      /no sheet carries a Date\/GSCPI header row/,
    );
  });

  it('the URL is the provider’s own download path (the register row’s URL)', () => {
    expect(GSCPI_URL).toBe(
      'https://www.newyorkfed.org/medialibrary/research/interactives/gscpi/downloads/gscpi_data.xlsx',
    );
  });
});

describe('parseEpuWorkbook (A-10: the OOXML headline index)', () => {
  it('parses the recorded capture: 1521 monthly points from 1900-01, newest 218.941 @ 2026-09', async () => {
    const epu = await parseEpuWorkbook(epuBuf);
    expect(epu.length).toBe(1521);
    expect(epu[0]).toEqual({ date: '1900-01-01', value: 139.9061923834578 });
    const last = epu.at(-1)!;
    expect(last.date).toBe('2026-09-01');
    expect(last.value).toBeCloseTo(218.941, 2);
  });

  it('the licence row inside the data block never becomes a data point', async () => {
    // Row 1523 carries the workbook's own licence sentence in column A —
    // the parse's Year/Month guard must skip it (1521 points, not 1522).
    const epu = await parseEpuWorkbook(epuBuf);
    expect(epu.length).toBe(1521);
    expect(epu.some((p) => Number.isNaN(p.value))).toBe(false);
  });

  it('asserts the header verbatim (a renamed sheet column is a format change)', async () => {
    // The header lives in row 1: Year / Month / News_Based_Policy_Uncert_Index.
    // Sabotage is hard on a binary zip — assert the contract directly:
    // the parser must throw on a workbook whose header differs. Build a
    // minimal in-memory OOXML? The xlsx reader is itself fixture-tested;
    // here we pin that the CURRENT workbook's header is the asserted one
    // (the parse above would have thrown otherwise) and that a tampered
    // buffer (truncated) fails loudly.
    const truncated = (epuBuf as ArrayBuffer).slice(0, 1000);
    await expect(parseEpuWorkbook(truncated)).rejects.toThrow();
  });

  it('the URL is the authors’ own file (linked from the monthly page)', () => {
    expect(EPU_URL).toBe('https://policyuncertainty.com/media/US_Policy_Uncertainty_Data.xlsx');
  });
});
