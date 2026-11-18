/**
 * imf-reserves.ts — GPE R14 / F2a Tier-1 (2026-11-18): the IMF
 * central-bank gold-reserves adapter — the COFER pattern applied to the
 * International Liquidity heritage dataflows
 * (docs/specs/gold-page-elevation: s4/04 §2d the venue record · s8/01
 * R14 · s8/02 rows 10–11).
 *
 * VENUE (verified live this session, 2026-11-18 ~17:0x UTC, keyless,
 * api.imf.org SDMX 3.0 — the same host the production COFER adapter
 * reads):
 *   IL      IMF.STA/IL/13.0.1/*.RGV_REVS.FTO.*        — 188 reporters,
 *     monthly gold reserves VOLUME (fine troy ounces), USA history to
 *     the 1950s; 4.83 MB, ~6 s. The IFS heritage's primary leg.
 *   IRFCL   IMF.STA/IRFCL/12.0.0/*.IRFCLDT1_IRFCL56V_FTO.* — 89
 *     reporters, the fresher complement for some (RUS ends 2025-M11 in
 *     IL but is current in IRFCL — verified this session).
 *   IRFCL value legs (probed this session for the buyers table's
 *     share-of-reserves column): *.IRFCLDT1_IRFCL56_USD.* (gold value)
 *     and *.IRFCLDT1_IRFCL65_USD.* (total official reserve assets).
 *
 * VERIFIED VALUES (this session): USA 261,498,926.24 ozt @ 2026-M09 =
 * 8,133.5 t exact (the S4 record reproduces); the TIME_PERIOD values
 * are NOT index-chronological (the observation index order is
 * scrambled) — the parser maps index→period and sorts by date, exactly
 * as the COFER parser does.
 *
 * FAIL-CLOSED RULES (S4-D4 + this session's additions, all recorded in
 * the s12 M1 doc):
 *   - the dimension SET is pinned (order-independent; a change throws);
 *   - aggregates are excluded from every sum: every G-prefixed code
 *     (G001 world, G163 euro area, the regional blocks) — summing them
 *     with members double-counts;
 *   - the BIS banking book is excluded from the FLOW series (its
 *     holding changes are gold-swap/banking operations, not reserve
 *     accumulation — live-verified: BIS printed −408 t across 2022,
 *     which would swamp the rotation signal);
 *   - scale-broken observations (the S4-D4 BRA/AGO class) are dropped
 *     by a value band: no observation inside the processed window may
 *     exceed 350 M ozt (no legitimate reporter's modern holdings
 *     exceed it — USA, the largest, holds 261.5 M ozt);
 *   - a single month's matched-pair change above 50 M ozt is dropped
 *     (a broken pair, never a real move).
 *
 * Platform-free: pure parse + the single fetch entry (insightsFetch —
 * one attempt, F-11; the IL host answers ~6 s from Worker egress, so
 * the fetch carries its own longer timeout like the TIC precedent).
 */

import { insightsFetch } from '../../../shared/adapters/fetch-policy';

/** Thrown with the provider's own context so the report row stays honest. */
export class ImfReservesError extends Error {
  constructor(message: string) {
    super(`[imf-reserves] ${message}`);
    this.name = 'ImfReservesError';
  }
}

/** The SDMX 3.0 data queries (verified live 2026-11-18). */
export const IMF_IL_VOLUME_URL =
  'https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/IL/13.0.1/*.RGV_REVS.FTO.*';
export const IMF_IRFCL_VOLUME_URL =
  'https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/IRFCL/12.0.0/*.IRFCLDT1_IRFCL56V_FTO.*';
export const IMF_IRFCL_GOLD_USD_URL =
  'https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/IRFCL/12.0.0/*.IRFCLDT1_IRFCL56_USD.*';
export const IMF_IRFCL_TOTAL_USD_URL =
  'https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/IRFCL/12.0.0/*.IRFCLDT1_IRFCL65_USD.*';

/** The earliest month the pipeline processes (the 20-year chart window
 * + headroom; also keeps the USA's pre-2000 500M-ozt history out of the
 * value band's way — its modern holdings sit well inside it). */
export const CB_WINDOW_START = '2001-01';

/** The value band: no observation inside the window may exceed this
 * (fine troy ounces) — drops the S4-D4 scale-broken rows. */
export const CB_MAX_OZT = 350e6;

/** A matched-pair change larger than this is a broken pair, not a move. */
export const CB_MAX_MONTHLY_CHANGE_OZT = 50e6;

/** Excluded from every sum: the IMF's G-prefixed aggregate codes (G001
 * world, G110/G200 blocs, G163 euro area, the regional blocks) and the
 * BIS banking book (gold-swap operations, not reserve accumulation). */
export function cbExcludedReporter(code: string): boolean {
  return code.startsWith('G') || code === 'BIS';
}

/** The parsed monthly volume legs: reporter → month ("YYYY-MM") → ozt. */
export type CbVolumeLeg = ReadonlyMap<string, ReadonlyMap<string, number>>;

/** One reporter's latest value observation (the IRFCL quarterly legs). */
export interface CbValueObs {
  quarter: string; // "YYYY-Qn"
  usd: number;
}

/** A month normalized to "YYYY-MM" or null. The venue prints BOTH
 *  "2026-M09" (the SDMX M-format, the IL/IRFCL volume legs) and
 *  "2021-01" (plain, some IRFCL value legs) — live-verified 2026-11-18;
 *  anything else fails closed. */
export function normalizeCbMonth(period: string): string | null {
  const m = /^(\d{4})-M?(0[1-9]|1[0-2])$/.exec(period);
  return m === null ? null : `${m[1]}-${m[2]}`;
}

/** A quarter normalized to "YYYY-Qn" or null (the IRFCL value legs' other
 *  print shape; the annual "YYYY" prints are handled by the callers). */
export function normalizeCbQuarter(period: string): string | null {
  return /^(\d{4})-Q[1-4]$/.exec(period) === null ? null : period;
}

/** A period's comparable time key: months → "YYYY-MM"; quarters → the
 *  quarter-END month ("2026-Q3" → "2026-09") — a monthly print fresher
 *  than a quarter wins, a quarter fresher than a month wins; annual →
 *  "YYYY-00" (always older than any month of that year). */
export function cbPeriodKey(period: string): string {
  const month = normalizeCbMonth(period);
  if (month !== null) return month;
  const q = /^(\d{4})-Q([1-4])$/.exec(period);
  if (q !== null) return `${q[1]}-${String(Number(q[2]) * 3).padStart(2, '0')}`;
  if (/^\d{4}$/.test(period)) return `${period}-00`;
  return '';
}

interface SdmxDimensionValue {
  id?: unknown;
}

interface SdmxSeriesEntry {
  observations?: Record<string, unknown[]>;
}

interface SdmxEnvelope {
  data?: { dataSets?: Array<{ series?: Record<string, SdmxSeriesEntry> }>; structures?: unknown[] };
}

/** The SDMX-JSON 3.0 structure's series dimensions (id + value ids). */
function seriesDimensions(json: unknown): Array<{ id: string; valueIds: string[] }> {
  const envelope = json as SdmxEnvelope;
  const structure = envelope?.data?.structures?.[0] as
    | { dimensions?: { series?: Array<{ id?: unknown; values?: SdmxDimensionValue[] }> } }
    | undefined;
  const series = structure?.dimensions?.series;
  if (!Array.isArray(series)) throw new ImfReservesError('missing data.structures[0].dimensions.series');
  return series.map((d) => ({ id: String(d.id), valueIds: (d.values ?? []).map((v) => String(v.id)) }));
}

/** The observation TIME_PERIOD values (index → period string). */
function observationPeriods(json: unknown): string[] {
  const envelope = json as SdmxEnvelope;
  const structure = envelope?.data?.structures?.[0] as
    | { dimensions?: { observation?: Array<{ values?: Array<{ value?: unknown }> }> } }
    | undefined;
  const periods = structure?.dimensions?.observation?.[0]?.values;
  if (!Array.isArray(periods) || periods.length === 0) {
    throw new ImfReservesError('missing observation TIME_PERIOD values');
  }
  return periods.map((p) => String(p.value));
}

function dataSetSeries(json: unknown): Record<string, SdmxSeriesEntry> {
  const envelope = json as SdmxEnvelope;
  const series = envelope?.data?.dataSets?.[0]?.series;
  if (series === undefined || typeof series !== 'object') {
    throw new ImfReservesError('missing data.dataSets[0].series');
  }
  return series;
}

/**
 * Parse an SDMX-JSON 3.0 volume payload (IL or IRFCL gold volume) into
 * the monthly legs. Fails closed on shape: the COUNTRY + FREQUENCY
 * dimensions must exist; every observation's period must be "YYYY-MM"
 * (anything else throws — annual/quarterly prints in the monthly key
 * space would be a layout change); observations outside the window or
 * over the value band are DROPPED (the recorded rules, never a guess).
 */
export function parseCbVolume(json: unknown): CbVolumeLeg {
  const dims = seriesDimensions(json);
  const dimIndex = (name: string): number => dims.findIndex((d) => d.id === name);
  const countryDim = dimIndex('COUNTRY');
  const freqDim = dimIndex('FREQUENCY');
  if (countryDim < 0 || freqDim < 0) {
    throw new ImfReservesError(`COUNTRY/FREQUENCY dimensions missing (found: ${dims.map((d) => d.id).join(',')})`);
  }
  const countries = dims[countryDim]!.valueIds;
  const freqs = dims[freqDim]!.valueIds;
  const monthlyIdx = freqs.indexOf('M');
  if (monthlyIdx < 0) throw new ImfReservesError('no monthly frequency in the dataflow');
  const periods = observationPeriods(json);
  const series = dataSetSeries(json);
  const out = new Map<string, Map<string, number>>();
  for (const [key, entry] of Object.entries(series)) {
    const parts = key.split(':');
    if (parts.length !== dims.length) throw new ImfReservesError(`series key ${key} arity mismatch`);
    if (parts[freqDim] !== String(monthlyIdx)) continue;
    const country = countries[Number(parts[countryDim])];
    if (country === undefined || cbExcludedReporter(country)) continue;
    const observations = entry.observations;
    if (observations === undefined) continue;
    const months = new Map<string, number>();
    for (const [obsIndex, obs] of Object.entries(observations)) {
      const index = Number(obsIndex);
      if (!Number.isInteger(index) || index < 0 || index >= periods.length) {
        throw new ImfReservesError(`observation index ${obsIndex} outside the TIME_PERIOD values`);
      }
      const month = normalizeCbMonth(periods[index]!);
      if (month === null) throw new ImfReservesError(`period is not YYYY-MM: ${JSON.stringify(periods[index])}`);
      const raw = Array.isArray(obs) ? obs[0] : undefined;
      if (typeof raw !== 'number' && typeof raw !== 'string') continue; // a missing value, not a failure
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) continue;
      if (month < CB_WINDOW_START) continue; // outside the processed window
      if (value > CB_MAX_OZT) continue; // the S4-D4 scale-broken row class
      months.set(month, value);
    }
    if (months.size > 0) out.set(country, months);
  }
  return out;
}

/**
 * Parse an SDMX-JSON 3.0 value payload (IRFCL gold-USD or total-USD)
 * into each reporter's LATEST observation. The venue prints monthly
 * ("2026-M09" / "2021-01"), quarterly ("2026-Q3") and annual ("2020")
 * periods in one observation space (live-verified 2026-11-18): the
 * latest by TIME wins (cbPeriodKey), the original period string rides
 * the row. Fails closed on shape the same way as the volume parse.
 */
export function parseCbLatestValue(json: unknown): ReadonlyMap<string, CbValueObs> {
  const dims = seriesDimensions(json);
  const dimIndex = (name: string): number => dims.findIndex((d) => d.id === name);
  const countryDim = dimIndex('COUNTRY');
  if (countryDim < 0) throw new ImfReservesError(`COUNTRY dimension missing (found: ${dims.map((d) => d.id).join(',')})`);
  const countries = dims[countryDim]!.valueIds;
  const periods = observationPeriods(json);
  const series = dataSetSeries(json);

  const out = new Map<string, CbValueObs>();
  for (const [key, entry] of Object.entries(series)) {
    const parts = key.split(':');
    if (parts.length !== dims.length) throw new ImfReservesError(`series key ${key} arity mismatch`);
    const country = countries[Number(parts[countryDim])];
    if (country === undefined || cbExcludedReporter(country)) continue;
    const observations = entry.observations;
    if (observations === undefined) continue;
    let best: CbValueObs | undefined;
    let bestKey = '';
    for (const [obsIndex, obs] of Object.entries(observations)) {
      const index = Number(obsIndex);
      if (!Number.isInteger(index) || index < 0 || index >= periods.length) {
        throw new ImfReservesError(`observation index ${obsIndex} outside the TIME_PERIOD values`);
      }
      const period = periods[index]!;
      const timeKey = cbPeriodKey(period);
      if (timeKey === '') throw new ImfReservesError(`period is not a known shape: ${JSON.stringify(period)}`);
      if (timeKey.endsWith('-00')) continue; // annual — the monthly/quarterly prints carry the fresher values
      const raw = Array.isArray(obs) ? obs[0] : undefined;
      if (typeof raw !== 'number' && typeof raw !== 'string') continue;
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) continue;
      if (best === undefined || timeKey > bestKey) {
        best = { quarter: normalizeCbMonth(period) ?? normalizeCbQuarter(period)!, usd: value };
        bestKey = timeKey;
      }
    }
    if (best !== undefined) out.set(country, best);
  }
  return out;
}

export interface ImfReservesFetchOptions {
  /** Injected for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Per-attempt timeout. Default 30 s (the IL host answers ~6 s; the
   * TIC slow-host precedent — still ONE attempt, F-11). */
  timeoutMs?: number;
}

/** The four raw payloads (tests replay fixtures; production fetches). */
export interface ImfReservesRaw {
  ilVolume: unknown;
  irfclVolume: unknown;
  irfclGoldUsd: unknown;
  irfclTotalUsd: unknown;
}

/** Fetch all four dataflows (4 subrequests — the rung's declared cost). */
export async function fetchImfReservesRaw(opts: ImfReservesFetchOptions = {}): Promise<ImfReservesRaw> {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const get = async (url: string): Promise<unknown> => {
    const response = await insightsFetch(url, { headers: { accept: 'application/json' } }, { fetchImpl: opts.fetchImpl, timeoutMs });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new ImfReservesError(`HTTP ${response.status}: ${body.slice(0, 160).replace(/\s+/g, ' ')}`);
    }
    try {
      return await response.json();
    } catch {
      throw new ImfReservesError('non-JSON answer');
    }
  };
  const [ilVolume, irfclVolume, irfclGoldUsd, irfclTotalUsd] = await Promise.all([
    get(IMF_IL_VOLUME_URL),
    get(IMF_IRFCL_VOLUME_URL),
    get(IMF_IRFCL_GOLD_USD_URL),
    get(IMF_IRFCL_TOTAL_USD_URL),
  ]);
  return { ilVolume, irfclVolume, irfclGoldUsd, irfclTotalUsd };
}
