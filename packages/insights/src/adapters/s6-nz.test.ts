/**
 * s6-nz.test.ts — gap-closure S6-M6.1 (2026-11-02): the New Zealand link
 * family's suites, against the recorded captures (AGENTS.md rule 7 — never
 * a live site):
 *   s6/oecd-nz-short-rate-2026-11-02.csv   the OECD FINMARK SDMX export
 *     (141 monthly rows 2015-01 → 2026-09, jumbled order, live fetch
 *     2026-11-02; the live pin: 3.13 @ 2026-09, 3.67 @ 2015-01)
 *   s6/fred-nz-10y-2026-11-02.csv          the FRED fredgraph verbatim
 *     response (682 lines, 1970-01 → 2026-09; the live pin: 4.94 @ 2026-09)
 *
 * The audnzd derivation is pinned from the live Frankfurter legs recorded
 * in docs/gap-closure/evidence/M6.1/raw-series.json (the audjpy pattern's
 * worldbank-derived.test.ts twin).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseOecdNzShortRateCsv, OECD_NZ_SHORT_RATE_URL } from './oecd';
import { parseFredCsv } from '../parsers';
import { buildIndicatorSeries } from './derived';
import type { SeriesPoint } from '../series';
import { FormatChangedError } from './fetch-policy';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', '..', 'fixtures');
const nzShortRateCsv = readFileSync(join(fixtures, 's6', 'oecd-nz-short-rate-2026-11-02.csv'), 'utf8');
const nz10yCsv = readFileSync(join(fixtures, 's6', 'fred-nz-10y-2026-11-02.csv'), 'utf8');

describe('parseOecdNzShortRateCsv (S6-M6.1: the OECD FINMARK NZ mirror)', () => {
  it('parses the recorded capture: the jumbled export order sorts into an ascending series, live-pinned', () => {
    const out = parseOecdNzShortRateCsv(nzShortRateCsv);
    expect(out.length).toBe(141);
    expect(out[0]).toEqual({ date: '2015-01-01', value: 3.67 });
    expect(out.at(-1)).toEqual({ date: '2026-09-01', value: 3.13 });
    // The COVID low + the 2024 peak (the provider's own numbers, read live
    // 2026-11-02 from this same file).
    const byDate = new Map(out.map((p) => [p.date, p.value]));
    expect(byDate.get('2020-05-01')).toBe(0.26);
    expect(byDate.get('2024-02-01')).toBe(5.71);
  });

  it('fails closed when the OBS_VALUE column is absent (layout change)', () => {
    const broken = nzShortRateCsv.replace('OBS_VALUE', 'RENAMED');
    expect(() => parseOecdNzShortRateCsv(broken)).toThrow(FormatChangedError);
  });

  it('fails closed on an out-of-band value', () => {
    const lines = nzShortRateCsv.split('\n');
    const header = lines[0]!;
    const iObs = header.split(',').indexOf('OBS_VALUE');
    const cells = lines[1]!.split(',');
    cells[iObs] = '99.5';
    expect(() => parseOecdNzShortRateCsv([header, cells.join(',')].join('\n'))).toThrow(FormatChangedError);
  });

  it('the request is the filtered FINMARK dataflow (NZL monthly IR3TIB, the decade window)', () => {
    expect(OECD_NZ_SHORT_RATE_URL).toBe(
      'https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_FINMARK,4.0/NZL.M.IR3TIB.........?format=csvfilewithlabels&startPeriod=2015-01',
    );
  });
});

describe('nz-10y (S6-M6.1: the FRED OECD monthly mirror via parseFredCsv)', () => {
  it('parses the recorded capture (the bund-10y sibling, live-pinned at the tail)', () => {
    const out = parseFredCsv(nz10yCsv);
    // 681 data rows, one of which (1979-09-01) carries an EMPTY value —
    // the provider's own missing point, skipped by the parser.
    expect(out.length).toBe(680);
    expect(out[0]).toEqual({ date: '1970-01-01', value: 5.54 });
    expect(out.at(-1)).toEqual({ date: '2026-09-01', value: 4.94 });
  });
});

describe('audnzd derivation (S6-M6.1: NZD per AUD from the two Frankfurter USD legs)', () => {
  it('derives the cross exactly as the audjpy pattern does (NZD/USD ÷ AUD/USD)', () => {
    const fx = {
      AUD: [
        { date: '2026-10-28', value: 1.431 },
        { date: '2026-10-29', value: 1.4322 },
        { date: '2026-10-30', value: 1.4236 },
      ] as SeriesPoint[],
      NZD: [
        { date: '2026-10-28', value: 1.77 },
        { date: '2026-10-29', value: 1.7735 },
        { date: '2026-10-30', value: 1.7743 },
      ] as SeriesPoint[],
    };
    const out = buildIndicatorSeries({ today: '2026-11-02T00:00:00Z', fred: {}, fx });
    expect(out.audnzd).toHaveLength(3);
    // 1.7743 / 1.4236 = 1.24645... (the live 2026-10-30 cross from the
    // recorded evidence legs)
    expect(out.audnzd!.at(-1)!.value).toBeCloseTo(1.246347, 5);
    expect(out.audnzd![0]).toEqual({ date: '2026-10-28', value: 1.77 / 1.431 });
  });

  it('omits the cross when either leg is absent (fail closed, never a half pair)', () => {
    const out1 = buildIndicatorSeries({ today: '2026-11-02T00:00:00Z', fred: {}, fx: { AUD: [{ date: '2026-10-30', value: 1.4236 }] } });
    expect(out1.audnzd).toBeUndefined();
    const out2 = buildIndicatorSeries({ today: '2026-11-02T00:00:00Z', fred: {}, fx: { NZD: [{ date: '2026-10-30', value: 1.7743 }] } });
    expect(out2.audnzd).toBeUndefined();
  });
});
