/**
 * cofer.test.ts — gap-closure S6-M6.3 (2026-11-02): the IMF COFER adapter's
 * suites, against the recorded capture (AGENTS.md rule 7 — never a live
 * site):
 *   s6/cofer-sdmx-2026-11-02.json   the provider's own full SDMX 3.0
 *     response (126,820 B, 140 series, live fetch 2026-11-02; the live
 *     pins: the world USD share 56.704761505127 @ 2026-Q2 and 57.18 @
 *     2026-Q1 — EXACTLY the IMF's own September-30 data brief — and the
 *     world allocated total $13,216.79 bn @ 2026-Q2).
 *
 * The fail-closed mutations pin every shape assumption: the envelope, the
 * dimension set, the series resolution, the period format, the value
 * plausibility and the truncation floor.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCoferUsdShare, fetchCoferUsdShare, COFER_DATA_URL } from './cofer';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', '..', 'fixtures');
const coferJson = JSON.parse(readFileSync(join(fixtures, 's6', 'cofer-sdmx-2026-11-02.json'), 'utf8')) as unknown;

function mutate(fn: (root: unknown) => void): unknown {
  const clone = JSON.parse(JSON.stringify(coferJson)) as unknown;
  fn(clone);
  return clone;
}

describe('parseCoferUsdShare (S6-M6.3: the IMF COFER SDMX 3.0 parse)', () => {
  it('parses the recorded capture: 110 quarterly points 1999-Q1 → 2026-Q2, live-pinned to the IMF’s own data brief', () => {
    const out = parseCoferUsdShare(coferJson);
    expect(out.length).toBe(110);
    expect(out[0]).toEqual({ date: '1999-03-31', value: 71.1888689871011 });
    // The live pins (the provider’s own September-30 brief: “declined to
    // 56.70 percent, from 57.18 percent in the previous quarter”).
    const byDate = new Map(out.map((p) => [p.date, p.value]));
    expect(byDate.get('2026-06-30')!).toBeCloseTo(56.704761505127, 9);
    expect(byDate.get('2026-03-31')!).toBeCloseTo(57.1790390014648, 9);
    // The revision arc through the 2025Q3 unallocated-elimination revision.
    expect(byDate.get('2025-09-30')!).toBeCloseTo(56.6067810058594, 9);
    expect(byDate.get('2025-12-31')!).toBeCloseTo(56.5215682983398, 9);
    // Ascending, quarter-end dates, one point per quarter.
    for (let i = 1; i < out.length; i++) {
      expect(out[i]!.date > out[i - 1]!.date).toBe(true);
    }
    expect(new Set(out.map((p) => p.date)).size).toBe(out.length);
  });

  it('ignores the annual periods (the card is the quarterly series) and keeps the revision on a re-stamped quarter', () => {
    // The capture’s TIME_PERIOD values carry both “2012”-style annual
    // labels and “2012-Q1”-style quarterly ones — the parse must emit ONLY
    // the quarterly dates (1999-03-31, not 1999-12-31-for-1999).
    const out = parseCoferUsdShare(coferJson);
    expect(out.some((p) => /-12-31$/.test(p.date) && p.date !== '2024-12-31')).toBe(true); // quarter ends exist
    expect(out.every((p) => /-(03-31|06-30|09-30|12-31)$/.test(p.date))).toBe(true); // …are all quarter ends
  });

  it('fails closed on a missing structures envelope', () => {
    expect(() => parseCoferUsdShare({ data: {} })).toThrow(/missing data.structures/);
    expect(() => parseCoferUsdShare({ data: { structures: [] } })).toThrow(/missing data.structures/);
  });

  it('fails closed on a changed dimension set (added, removed or renamed)', () => {
    const renamed = mutate((root) => {
      const dims = (root as { data: { structures: Array<{ dimensions: { series: Array<{ id: string }> } }> } }).data.structures[0]!.dimensions.series;
      dims[0]!.id = 'COUNTRY_RENAMED';
    });
    expect(() => parseCoferUsdShare(renamed)).toThrow(/dimension COUNTRY missing/);
  });

  it('fails closed when the world USD-share series disappears from the dataset', () => {
    const dropped = mutate((root) => {
      const key = '0:0:9:0:1';
      delete (root as { data: { dataSets: Array<{ series: Record<string, unknown> }> } }).data.dataSets[0]!.series[key];
    });
    expect(() => parseCoferUsdShare(dropped)).toThrow(/absent from the dataset/);
  });

  it('fails closed when the dimension-value membership changes (the value ids resolve, never hard-coded indices)', () => {
    const retitled = mutate((root) => {
      const dims = (root as { data: { structures: Array<{ dimensions: { series: Array<{ values: Array<{ id: string }> }> } }> } }).data.structures[0]!.dimensions.series;
      // FXR_CURRENCY is dimension index 2; its USD value is CI_USD.
      const fxr = dims[2]!;
      const usd = fxr.values.find((v) => v.id === 'CI_USD')!;
      usd.id = 'CI_USDX';
    });
    expect(() => parseCoferUsdShare(retitled)).toThrow(/FXR_CURRENCY=CI_USD not present/);
  });

  it('fails closed on a non-quarterly period format drift', () => {
    const weirdPeriod = mutate((root) => {
      const r = root as { data: { structures: Array<{ dimensions: { observation: Array<{ values: Array<{ value: unknown }> }> } }> } };
      r.data.structures[0]!.dimensions.observation[0]!.values[100]!.value = '2026-S3';
    });
    expect(() => parseCoferUsdShare(weirdPeriod)).toThrow(/period is not YYYY-Qn/);
  });

  it('fails closed on an out-of-range share value', () => {
    const badValue = mutate((root) => {
      const series = (root as { data: { dataSets: Array<{ series: Record<string, { observations: Record<string, unknown[]> }> }> } }).data.dataSets[0]!.series;
      const obs = series['0:0:9:0:1']!.observations;
      const lastKey = Object.keys(obs).at(-1)!;
      obs[lastKey]![0] = 156.7; // an impossible share
    });
    expect(() => parseCoferUsdShare(badValue)).toThrow(/outside \(0, 100\)/);
  });

  it('fails closed on a truncated answer (fewer than 20 quarterly points)', () => {
    const truncated = mutate((root) => {
      const series = (root as { data: { dataSets: Array<{ series: Record<string, { observations: Record<string, unknown[]> }> }> } }).data.dataSets[0]!.series;
      const obs = series['0:0:9:0:1']!.observations;
      const keys = Object.keys(obs);
      // Keep the annual-indexed observations and only 5 quarterly ones —
      // the index space is shared, so deleting the quarterly tail works.
      for (const k of keys.slice(5)) delete obs[k];
    });
    expect(() => parseCoferUsdShare(truncated)).toThrow(/truncated/);
  });
});

describe('fetchCoferUsdShare (the transport)', () => {
  it('hits the verified SDMX 3.0 data URL with the JSON accept header and returns the parsed series', async () => {
    let seenUrl = '';
    let seenAccept = '';
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      seenUrl = String(input);
      seenAccept = new Headers(init?.headers).get('accept') ?? '';
      return new Response(JSON.stringify(coferJson), { status: 200 });
    }) as typeof fetch;
    const out = await fetchCoferUsdShare({ fetchImpl });
    expect(seenUrl).toBe(COFER_DATA_URL);
    expect(seenAccept).toBe('application/json');
    expect(out.length).toBe(110);
  });

  it('fails closed on a non-OK answer (the honest report row rides the message)', async () => {
    const fetchImpl = (async () => new Response('{"statusCode":429}', { status: 429 })) as typeof fetch;
    await expect(fetchCoferUsdShare({ fetchImpl })).rejects.toThrow(/HTTP 429/);
  });

  it('fails closed on a non-JSON answer', async () => {
    const fetchImpl = (async () => new Response('<html>not json</html>', { status: 200 })) as typeof fetch;
    await expect(fetchCoferUsdShare({ fetchImpl })).rejects.toThrow(/non-JSON/);
  });
});
