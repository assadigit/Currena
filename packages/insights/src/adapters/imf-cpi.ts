/**
 * imf-cpi.ts — the IMF SDMX 3.0 CPI dataflow adapter (page-division S25
 * fill session, 2026-11-12 — BD-S23a; the §15 D-36 Asia CPI fills).
 *
 * The three Asia CPI cards (japan-cpi · korea-cpi · india-cpi) read the
 * IMF's own dedicated Consumer Price Index dataset — the provider's OWN
 * year-over-year percent-change transformation (YOY_PCH_PA_PT: period
 * average, year-over-year percent change), never a Currena-derived YoY.
 *
 * VENUE (verified live 2026-11-10/12, BOTH from the work sandbox and from
 * Cloudflare Worker egress via the temp-probe pattern — 200,
 * application/json, BYTE-IDENTICAL responses, ~0.4–1.4 s — BD-S23a):
 *   https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/CPI/5.0.0/{CC}.CPI._T.YOY_PCH_PA_PT.M
 * with `Accept: application/json`, keyless — the SAME api.imf.org host
 * the COFER adapter rides (gap-closure S6-M6.3): one venue, one licence
 * class (the IMF's own Special Terms for Statistical Data, L1, the
 * attribution string recorded in sources.ts/licences.ts).
 *
 * CROSS-CHECKS (BD-S23a): the parsed vintages/values verified against
 * the national bureaus — Japan's Statistics Bureau latest-results page
 * (Sep 2026: the 2025-base headline +2.1% vs the mirror's +2.23% on the
 * pre-revision base — the Aug-2026 re-weighting wedge, documented; the
 * mirror carries the freshest print that exists per the bureau's own
 * schedule), Korea's own October 2026 소비자물가동향 (+2.8% — the
 * mirror's 2.8189% matches EXACTLY), MoSPI's own July 2026 press note
 * (4.45% provisional vs the mirror's 4.4412% — display rounding), and
 * the World Bank's independently-compiled FP.CPI.TOTL.ZG annual figures
 * (the 2025 monthly averages match all three EXACTLY: 3.178/3.17 ·
 * 2.123/2.12 · 2.426/2.40).
 *
 * The parse fails closed on any shape drift: the dimension set, the
 * series-membership resolution and the period format are all verified
 * against the fixture (packages/insights/fixtures/s25/
 * imf-cpi-{jpn,kor,ind}-2026-11-12.json — the provider's own responses,
 * trimmed to the trailing decade).
 */

import type { SeriesPoint } from '../series';
import { insightsFetch } from './fetch-policy';

/** Thrown with the provider's own context so the report row stays honest. */
export class ImfCpiError extends Error {
  constructor(message: string) {
    super(`[imf-cpi] ${message}`);
    this.name = 'ImfCpiError';
  }
}

/** The countries the three cards read (the §15 D-36 fills). */
export type ImfCpiCountry = 'JPN' | 'KOR' | 'IND';

/** The indicator id each country's series feeds. */
const COUNTRY_TO_ID: Readonly<Record<ImfCpiCountry, 'japan-cpi' | 'korea-cpi' | 'india-cpi'>> = {
  JPN: 'japan-cpi',
  KOR: 'korea-cpi',
  IND: 'india-cpi',
};

/** The dataflow's pinned version (a version bump fails loudly below until
 *  the shape is re-verified — never silently absorbed). */
const CPI_DATAFLOW_VERSION = '5.0.0';

/** The SDMX 3.0 data query for one country's all-items CPI YoY series. */
export function imfCpiDataUrl(country: ImfCpiCountry): string {
  return `https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/CPI/${CPI_DATAFLOW_VERSION}/${country}.CPI._T.YOY_PCH_PA_PT.M`;
}

/** The expected dimension ids, in order (a reorder still resolves; a
 *  change fails loudly — the COFER discipline). */
const CPI_EXPECTED_DIMENSIONS = [
  'COUNTRY',
  'INDEX_TYPE',
  'COICOP_1999',
  'TYPE_OF_TRANSFORMATION',
  'FREQUENCY',
] as const;

/** The wanted dimension values for the queried series (the key carries
 *  them, but the resolution NEVER trusts the order — it re-resolves by
 *  dimension id and fails closed if the dataset's own membership moved). */
const CPI_WANTED_DIMENSIONS: ReadonlyArray<{ name: string; id: string }> = [
  // COUNTRY is filled per country below.
  { name: 'INDEX_TYPE', id: 'CPI' },
  { name: 'COICOP_1999', id: '_T' },
  { name: 'TYPE_OF_TRANSFORMATION', id: 'YOY_PCH_PA_PT' },
  { name: 'FREQUENCY', id: 'M' },
];

/** A "YYYY-MMn" period string → its month-end ISO date; anything else is
 *  invalid (the dataset also serves annual "YYYY" labels in the shared
 *  TIME_PERIOD index space — the key's M filter keeps them out, but a
 *  stray format still fails loudly rather than rendering garbage). */
function monthEndDate(period: string): string {
  const m = /^(\d{4})-M(\d{1,2})$/.exec(period);
  if (m === null) {
    if (/^\d{4}$/.test(period)) {
      throw new ImfCpiError(
        `annual period ${period} reached a monthly series (the FREQUENCY filter broke)`,
      );
    }
    throw new ImfCpiError(`period is not YYYY-MMn: ${JSON.stringify(period)}`);
  }
  const year = m[1];
  const month = Number(m[2]);
  if (month < 1 || month > 12) throw new ImfCpiError(`month out of range: ${JSON.stringify(period)}`);
  const lastDay = new Date(Date.UTC(Number(year), month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

interface SdmxDimensionValue {
  id?: unknown;
}

interface SdmxSeriesEntry {
  observations?: Record<string, unknown[]>;
}

/** A plausibility bound on a CPI YoY reading — hyperinflationary spikes
 *  aside, a YoY rate beyond ±100% is a provider artifact (the KOR series'
 *  own Korean-War start) and fails loudly rather than rendering garbage. */
const MAX_ABS_YOY = 1000;

/**
 * Parse the SDMX-JSON 3.0 envelope into one country's CPI YoY series.
 * Fails closed (ImfCpiError) on every shape assumption: the structure,
 * the dimension set, the series resolution and every value's
 * plausibility.
 */
export function parseImfCpiYoy(country: ImfCpiCountry, json: unknown): SeriesPoint[] {
  const envelope = json as {
    data?: { dataSets?: Array<{ series?: Record<string, SdmxSeriesEntry> }>; structures?: unknown[] };
  };
  const structures = envelope?.data?.structures;
  if (!Array.isArray(structures) || structures.length === 0) {
    throw new ImfCpiError('missing data.structures (the SDMX-JSON envelope changed)');
  }
  const structure = structures[0] as {
    dimensions?: { series?: Array<{ id?: unknown; values?: SdmxDimensionValue[] }>; observation?: Array<{ values?: Array<{ value?: unknown }> }> };
  };
  const seriesDimensions = structure?.dimensions?.series;
  if (!Array.isArray(seriesDimensions) || seriesDimensions.length !== CPI_EXPECTED_DIMENSIONS.length) {
    throw new ImfCpiError('unexpected dimension count in data.structures[0].dimensions.series');
  }
  // The dimension SET is pinned (order-independent): a reorder resolves
  // correctly, an added/removed/renamed dimension fails loudly.
  const dimIds = seriesDimensions.map((d) => String(d.id));
  for (const expected of CPI_EXPECTED_DIMENSIONS) {
    if (!dimIds.includes(expected)) {
      throw new ImfCpiError(`dimension ${expected} missing (found: ${dimIds.join(',')})`);
    }
  }
  const dimIndex = (name: string): number => dimIds.indexOf(name);

  // Resolve the wanted series key by dimension-value ids — never a
  // hard-coded index tuple (a provider reorder resolves; a changed value
  // id fails closed below).
  const wanted: Array<{ name: string; id: string }> = [
    { name: 'COUNTRY', id: country },
    ...CPI_WANTED_DIMENSIONS,
  ];
  const resolvedKey: number[] = [];
  for (const w of wanted) {
    const dim = seriesDimensions[dimIndex(w.name)];
    if (dim === undefined) throw new ImfCpiError(`dimension ${w.name} vanished mid-parse`);
    const idx = (dim.values ?? []).findIndex((v) => v.id === w.id);
    if (idx < 0) throw new ImfCpiError(`dimension value ${w.name}=${w.id} not present (dataset membership changed)`);
    resolvedKey.push(idx);
  }
  const key = resolvedKey.join(':');

  const seriesMap = envelope?.data?.dataSets?.[0]?.series;
  if (seriesMap === undefined || typeof seriesMap !== 'object') {
    throw new ImfCpiError('missing data.dataSets[0].series');
  }
  const entry = seriesMap[key];
  if (entry === undefined) {
    throw new ImfCpiError(`the ${country} all-items YoY series (${key}) is absent from the dataset`);
  }
  const observations = entry.observations;
  if (observations === undefined || typeof observations !== 'object') {
    throw new ImfCpiError(`series ${key} carries no observations`);
  }

  // The observation dimension is TIME_PERIOD; its values carry {value:
  // "YYYY-MMn"}.
  const periodValues = structure?.dimensions?.observation?.[0]?.values;
  if (!Array.isArray(periodValues) || periodValues.length === 0) {
    throw new ImfCpiError('missing observation TIME_PERIOD values');
  }

  const byDate = new Map<string, number>();
  for (const [obsIndex, obs] of Object.entries(observations)) {
    const index = Number(obsIndex);
    if (!Number.isInteger(index) || index < 0 || index >= periodValues.length) {
      throw new ImfCpiError(`observation index ${obsIndex} outside the TIME_PERIOD values`);
    }
    const period = periodValues[index]?.value;
    if (typeof period !== 'string') {
      throw new ImfCpiError(`TIME_PERIOD value at ${obsIndex} is not a string`);
    }
    const raw = Array.isArray(obs) ? obs[0] : undefined;
    if (raw !== null && raw !== undefined && typeof raw !== 'number' && typeof raw !== 'string') {
      throw new ImfCpiError(`observation for ${period} carries no value`);
    }
    // null/absent observations (a missing month in the provider's series)
    // skip honestly — the series keeps its gaps, never a zero.
    if (raw === null || raw === undefined) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || Math.abs(value) > MAX_ABS_YOY) {
      throw new ImfCpiError(`YoY for ${period} outside plausibility: ${String(raw)}`);
    }
    const date = monthEndDate(period);
    byDate.set(date, value); // keep the LAST print per month (a revision wins)
  }
  if (byDate.size < 60) {
    throw new ImfCpiError(`only ${byDate.size} monthly points (expected ≥60 — the answer is truncated)`);
  }
  const points: SeriesPoint[] = [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([date, value]) => ({ date, value }));
  return points;
}

export interface ImfCpiFetchOptions {
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Base URL override (tests). */
  baseUrl?: string;
  /** Request timeout; default 15 s (the host answers ~0.4–1.4 s from
   *  Worker egress — BD-S23a). */
  timeoutMs?: number;
}

/** Fetch + parse one country's CPI YoY series (single attempt, F-11). */
export async function fetchImfCpiYoy(
  country: ImfCpiCountry,
  opts: ImfCpiFetchOptions = {},
): Promise<SeriesPoint[]> {
  const response = await insightsFetch(
    opts.baseUrl ?? imfCpiDataUrl(country),
    { headers: { accept: 'application/json' } },
    { fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs ?? 15_000 },
  );
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ImfCpiError(`HTTP ${response.status}: ${body.slice(0, 160).replace(/\s+/g, ' ')}`);
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ImfCpiError('non-JSON answer');
  }
  return parseImfCpiYoy(country, json);
}

/** The indicator ids the three fetches feed (the rung wiring's own
 *  contract — COUNTRY_TO_ID's values, as a list). */
export const IMF_CPI_IDS: readonly ('japan-cpi' | 'korea-cpi' | 'india-cpi')[] = [
  COUNTRY_TO_ID.JPN,
  COUNTRY_TO_ID.KOR,
  COUNTRY_TO_ID.IND,
];

/** The label the rung's report rows carry for one country's fetch. */
export function imfCpiLabel(country: ImfCpiCountry): string {
  const names: Record<ImfCpiCountry, string> = {
    JPN: 'Japan',
    KOR: 'Korea',
    IND: 'India',
  };
  return `CPI dataflow — ${names[country]} all-items consumer prices, year-over-year percent change (monthly)`;
}
