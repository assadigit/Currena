/**
 * oecd.ts — the A-8 adapter (2026-10-26 gap-audit build): the OECD's
 * amplitude-adjusted Composite Leading Indicators via the SDMX REST API
 * (one filtered request, THREE country series).
 *
 * The FILTERED key (verified live 2026-10-26, 122 KB): the dataflow
 * OECD.SDD.STES,DSD_STES@DF_CLI,4.1 with REF_AREA=USA+CHN+DEU, MEASURE=LI
 * (Composite leading indicator), ADJUSTMENT=AA (amplitude adjusted — the
 * series the spec names) and startPeriod=2015-01 — the 10-year percentile
 * base rides the one request. NOTE: the spec's EA19 (euro area) does not
 * exist in this dataflow (probed live: the CLI carries member countries +
 * aggregates like G7/G20 but no EA19) — Germany (DEU) is the honest euro
 * substitute, the euro area's largest economy and the page's existing
 * euro anchor (bund-10y/euro-hicp); recorded in the implementation
 * report's Assumptions.
 *
 * Licence: OECD statistics — free reuse with attribution (the OECD's
 * terms: data may be reproduced with attribution to the OECD as the
 * source + a link to the dataset; recorded in the register row).
 */

import { insightsFetch, FormatChangedError } from './fetch-policy';
import { assertAscending, type SeriesPoint } from '../series';
import type { FetchDeps } from './types';

/** The filtered SDMX request (one fetch, three series, the decade window). */
export const OECD_CLI_URL =
  'https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_CLI,4.1/USA+CHN+DEU.M.LI.IX._Z.AA.IX._Z.H?format=csvfilewithlabels&startPeriod=2015-01';

export const OECD_TIMEOUT_MS = 45_000;

/** The three country series the one request carries (REF_AREA keyed). */
export interface OecdCliSeries {
  usa: SeriesPoint[];
  chn: SeriesPoint[];
  deu: SeriesPoint[];
}

/** The plausible CLI band (an index normalised around 100). */
const CLI_MIN = 50;
const CLI_MAX = 150;

/**
 * Parse the SDMX csvfilewithlabels body (pure — fixture-testable).
 * Asserts the header columns by NAME (REF_AREA / TIME_PERIOD /
 * OBS_VALUE), the three areas' presence, and each series' length + band.
 *
 * ROW ORDER: the live export arrives JUMBLED (verified live twice
 * 2026-10-26 — the byte-identical fixture: 2015-04, then 2019-05/04,
 * then 2016-05… — the SDMX service's own export order, not a capture
 * artefact), so each area's points are SORTED by date before the
 * ascending assertion (the EPU newest-first discipline: sort, then
 * assert strictly ascending — a duplicate date still fails loudly).
 */
export function parseOecdCliCsv(text: string): OecdCliSeries {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
  if (lines.length < 10) {
    throw new FormatChangedError(`OECD CLI: only ${lines.length} lines (layout change?)`);
  }
  const header = lines[0]!.split(',').map((h) => h.trim());
  const col = (name: string): number => {
    const idx = header.indexOf(name);
    if (idx < 0) {
      throw new FormatChangedError(`OECD CLI: the ${JSON.stringify(name)} column is absent (layout change?)`);
    }
    return idx;
  };
  const cArea = col('REF_AREA');
  const cPeriod = col('TIME_PERIOD');
  const cValue = col('OBS_VALUE');
  const byArea: Record<string, SeriesPoint[]> = { USA: [], CHN: [], DEU: [] };
  for (let i = 1; i < lines.length; i += 1) {
    const cells = lines[i]!.split(',');
    if (cells.length < header.length) {
      throw new FormatChangedError(`OECD CLI: row ${i + 1} carries ${cells.length} cells (expected ${header.length})`);
    }
    const area = cells[cArea]!.trim();
    const period = cells[cPeriod]!.trim();
    const value = Number(cells[cValue]!.trim());
    if (!(area in byArea)) continue; // the labels columns may echo other areas' rows — no
    const m = /^(\d{4})-(\d{2})$/.exec(period);
    if (!m) {
      throw new FormatChangedError(`OECD CLI: period ${JSON.stringify(period)} is not YYYY-MM (layout change?)`);
    }
    if (!Number.isFinite(value) || value < CLI_MIN || value > CLI_MAX) {
      throw new FormatChangedError(
        `OECD CLI: ${area} value ${JSON.stringify(cells[cValue])} at ${period} is outside ${CLI_MIN}–${CLI_MAX} (layout change?)`,
      );
    }
    byArea[area]!.push({ date: `${m[1]}-${m[2]}-01`, value });
  }
  const out = { usa: byArea.USA!, chn: byArea.CHN!, deu: byArea.DEU! };
  for (const [area, series] of Object.entries(out)) {
    if (series.length < 24) {
      throw new FormatChangedError(
        `OECD CLI: ${area} carries only ${series.length} months (expected the decade window — layout change?)`,
      );
    }
    // The export order is not chronological (see the doc comment): sort,
    // then assert strictly ascending — duplicates still fail loudly.
    series.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    try {
      assertAscending(series);
    } catch (err) {
      throw new FormatChangedError(`OECD CLI: ${area} is not date-ascending after sort (${err instanceof Error ? err.message : err})`);
    }
  }
  return out;
}

/** Fetch the three CLI series (one request). */
export async function fetchOecdCli(deps: FetchDeps = {}): Promise<OecdCliSeries> {
  const res = await insightsFetch(OECD_CLI_URL, {}, { ...deps, timeoutMs: deps.timeoutMs ?? OECD_TIMEOUT_MS });
  return parseOecdCliCsv(await res.text());
}
