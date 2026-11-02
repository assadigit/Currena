/**
 * cofer.ts — the IMF COFER dataset adapter (gap-closure S6-M6.3, 2026-11-02).
 *
 * The Currency Composition of Official Foreign Exchange Reserves: the
 * world's official FX reserves broken down by currency. The card's series
 * is the USD share of world ALLOCATED reserves (percent) — the
 * de-dollarization lane's reserve-concentration measure.
 *
 * VENUE (verified live 2026-11-02, both from the work sandbox and from
 * Cloudflare Worker egress via a temporary probe worker — 200,
 * byte-identical, ~1.2–1.5 s): the IMF's new SDMX 3.0 API serves the
 * full dataset KEYLESS at
 *   https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/COFER/7.0.1/*
 * with `Accept: application/json` (the old dataservices.imf.org SDMX 2.1
 * host is DEAD — DNS no longer resolves; the DataMapper API carries no
 * COFER indicator; the portal.api.imf.org developer portal gates its
 * interactive docs behind sign-in but the data endpoints themselves are
 * open). The provider's own API page (data.imf.org/en/Resource-Pages/
 * IMF-API, read 2026-11-02) states: "Our data are available through SDMX
 * 2.1 and SDMX 3.0 APIs. You can use the APIs to import data from
 * datasets available on http://data.imf.org into your data systems or
 * applications."
 *
 * CROSS-CHECK (the provider's own brief, 2026-11-02): the parsed latest
 * value 56.70 % @ 2026-Q2 matches the IMF's own September-30 data brief
 * ("the dollar's share of global foreign exchange reserves declined to
 * 56.70 percent, from 57.18 percent in the previous quarter") EXACTLY,
 * and the parsed total ($13.22 tn @ 2026-Q2) matches the same brief.
 *
 * The parse fails closed on any shape drift: the dimension set, the
 * series-membership resolution and the period format are all verified
 * against the fixture (packages/insights/fixtures/s6/
 * cofer-sdmx-2026-11-02.json — the provider's own full response).
 */

import type { SeriesPoint } from '../series';
import { insightsFetch } from './fetch-policy';

/** Thrown with the provider's own context so the report row stays honest. */
export class CoferError extends Error {
  constructor(message: string) {
    super(`[cofer] ${message}`);
    this.name = 'CoferError';
  }
}

/** The SDMX 3.0 data query for the full COFER dataset (140 series, ~127 kB). */
export const COFER_DATA_URL =
  'https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/COFER/7.0.1/*';

/** The series the card reads: world allocated reserves, USD, share in percent, quarterly. */
const COFER_DIMENSIONS = {
  country: 'G001', // World (the G110/G200 advanced/emerging splits died 1999-Q4)
  indicator: 'AFXRA', // allocated foreign exchange reserves
  currency: 'CI_USD', // U.S. dollar
  transformation: 'SHRO_PT', // share, percent
  frequency: 'Q', // quarterly
} as const;

/** The expected dimension ids, in order (a reorder still resolves; a change fails loudly). */
const COFER_EXPECTED_DIMENSIONS = [
  'COUNTRY',
  'INDICATOR',
  'FXR_CURRENCY',
  'TYPE_OF_TRANSFORMATION',
  'FREQUENCY',
] as const;

/** A "YYYY-Qn" period string → its quarter-end ISO date; anything else is invalid. */
function quarterEndDate(period: string): string {
  const m = /^(\d{4})-Q([1-4])$/.exec(period);
  if (m === null) throw new CoferError(`period is not YYYY-Qn: ${JSON.stringify(period)}`);
  const year = Number(m[1]);
  const quarter = Number(m[2]);
  const monthEnd = quarter * 3; // the last month of the quarter
  // The last day of that month (UTC, no DST games).
  const lastDay = new Date(Date.UTC(year, monthEnd, 0)).getUTCDate();
  return `${m[1]}-${String(monthEnd).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

interface SdmxDimensionValue {
  id?: unknown;
}

interface SdmxSeriesEntry {
  observations?: Record<string, unknown[]>;
}

/**
 * Parse the SDMX-JSON 3.0 envelope into the USD-share series. Fails closed
 * (CoferError) on every shape assumption: the structure, the dimension set,
 * the series resolution and every value's plausibility.
 */
export function parseCoferUsdShare(json: unknown): SeriesPoint[] {
  const envelope = json as {
    data?: { dataSets?: Array<{ series?: Record<string, SdmxSeriesEntry> }>; structures?: unknown[] };
  };
  const structures = envelope?.data?.structures;
  if (!Array.isArray(structures) || structures.length === 0) {
    throw new CoferError('missing data.structures (the SDMX-JSON envelope changed)');
  }
  const structure = structures[0] as {
    dimensions?: { series?: Array<{ id?: unknown; values?: SdmxDimensionValue[] }>; observation?: Array<{ values?: Array<{ value?: unknown }> }> };
  };
  const seriesDimensions = structure?.dimensions?.series;
  if (!Array.isArray(seriesDimensions) || seriesDimensions.length !== COFER_EXPECTED_DIMENSIONS.length) {
    throw new CoferError('unexpected dimension count in data.structures[0].dimensions.series');
  }
  // The dimension SET is pinned (order-independent): a reorder resolves
  // correctly, an added/removed/renamed dimension fails loudly.
  const dimIds = seriesDimensions.map((d) => String(d.id));
  for (const expected of COFER_EXPECTED_DIMENSIONS) {
    if (!dimIds.includes(expected)) {
      throw new CoferError(`dimension ${expected} missing (found: ${dimIds.join(',')})`);
    }
  }
  const dimIndex = (name: string): number => dimIds.indexOf(name);

  // Resolve the wanted series key by dimension-value ids — never a
  // hard-coded index tuple (a provider reorder resolves; a changed value
  // id fails closed below).
  const wanted: Array<{ name: string; id: string }> = [
    { name: 'COUNTRY', id: COFER_DIMENSIONS.country },
    { name: 'INDICATOR', id: COFER_DIMENSIONS.indicator },
    { name: 'FXR_CURRENCY', id: COFER_DIMENSIONS.currency },
    { name: 'TYPE_OF_TRANSFORMATION', id: COFER_DIMENSIONS.transformation },
    { name: 'FREQUENCY', id: COFER_DIMENSIONS.frequency },
  ];
  const resolvedKey: number[] = [];
  for (const w of wanted) {
    const dim = seriesDimensions[dimIndex(w.name)];
    if (dim === undefined) throw new CoferError(`dimension ${w.name} vanished mid-parse`);
    const idx = (dim.values ?? []).findIndex((v) => v.id === w.id);
    if (idx < 0) throw new CoferError(`dimension value ${w.name}=${w.id} not present (dataset membership changed)`);
    resolvedKey.push(idx);
  }
  const key = resolvedKey.join(':');

  const seriesMap = envelope?.data?.dataSets?.[0]?.series;
  if (seriesMap === undefined || typeof seriesMap !== 'object') {
    throw new CoferError('missing data.dataSets[0].series');
  }
  const entry = seriesMap[key];
  if (entry === undefined) {
    throw new CoferError(`the world USD-share series (${key}) is absent from the dataset`);
  }
  const observations = entry.observations;
  if (observations === undefined || typeof observations !== 'object') {
    throw new CoferError(`series ${key} carries no observations`);
  }

  // The observation dimension is TIME_PERIOD; its values carry {value:
  // "YYYY-Qn" | "YYYY"} (annual + quarterly share one index space).
  const periodValues = structure?.dimensions?.observation?.[0]?.values;
  if (!Array.isArray(periodValues) || periodValues.length === 0) {
    throw new CoferError('missing observation TIME_PERIOD values');
  }

  const byDate = new Map<string, number>();
  for (const [obsIndex, obs] of Object.entries(observations)) {
    const index = Number(obsIndex);
    if (!Number.isInteger(index) || index < 0 || index >= periodValues.length) {
      throw new CoferError(`observation index ${obsIndex} outside the TIME_PERIOD values`);
    }
    const period = periodValues[index]?.value;
    if (typeof period !== 'string') {
      throw new CoferError(`TIME_PERIOD value at ${obsIndex} is not a string`);
    }
    // Annual periods ("2012") are ignored: the card is the quarterly
    // series (1999-Q1 → present). A non-quarterly, non-annual period
    // format fails loudly — the layout changed.
    if (/^\d{4}$/.test(period)) continue;
    const raw = Array.isArray(obs) ? obs[0] : undefined;
    if (typeof raw !== 'number' && typeof raw !== 'string') {
      throw new CoferError(`observation for ${period} carries no value`);
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0 || value >= 100) {
      throw new CoferError(`USD share for ${period} outside (0, 100): ${String(raw)}`);
    }
    const date = quarterEndDate(period);
    byDate.set(date, value); // keep the LAST print per quarter (a revision wins)
  }
  if (byDate.size < 20) {
    throw new CoferError(`only ${byDate.size} quarterly points (expected ≥20 — the answer is truncated)`);
  }
  const points: SeriesPoint[] = [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([date, value]) => ({ date, value }));
  return points;
}

export interface CoferFetchOptions {
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Base URL override (tests). */
  baseUrl?: string;
  /** Request timeout; default 15 s (the host answers ~1.5 s from Worker egress). */
  timeoutMs?: number;
}

/** Fetch + parse the COFER USD share series (single attempt, F-11). */
export async function fetchCoferUsdShare(opts: CoferFetchOptions = {}): Promise<SeriesPoint[]> {
  const response = await insightsFetch(
    opts.baseUrl ?? COFER_DATA_URL,
    { headers: { accept: 'application/json' } },
    { fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs ?? 15_000 },
  );
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new CoferError(`HTTP ${response.status}: ${body.slice(0, 160).replace(/\s+/g, ' ')}`);
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new CoferError('non-JSON answer');
  }
  return parseCoferUsdShare(json);
}
