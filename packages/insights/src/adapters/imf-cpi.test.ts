/**
 * imf-cpi.test.ts — page-division S25 fill session (2026-11-12, BD-S23a):
 * the IMF SDMX 3.0 CPI dataflow adapter's suites, against the recorded
 * captures (AGENTS.md rule 7 — never a live site):
 *   s25/imf-cpi-{jpn,kor,ind}-2026-11-12.json   the provider's own SDMX 3.0
 *     responses, trimmed to the trailing decade 2016-M01→ (live fetch
 *     2026-11-10, byte-identical from Worker egress — BD-S23a; the live
 *     pins: Japan 2026-M09 = 2.232142857142857 — the Statistics Bureau's
 *     own 2025-base headline reads +2.1% for the same month, the
 *     documented base-revision wedge — Korea 2026-M10 = 2.818940555271674
 *     — KOSTAT's own October release says +2.8%, an EXACT match — and
 *     India 2026-M07 = 4.44121915820029 — MoSPI's own July press note
 *     says 4.45%, the same number within display rounding).
 *
 * The fail-closed mutations pin every shape assumption: the envelope, the
 * dimension set, the series resolution, the period format, the value
 * plausibility, the missing-observation honesty and the truncation floor.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseImfCpiYoy,
  fetchImfCpiYoy,
  imfCpiDataUrl,
  IMF_CPI_IDS,
  imfCpiLabel,
  type ImfCpiCountry,
} from './imf-cpi';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', '..', 'fixtures');

const captures: Record<ImfCpiCountry, unknown> = {
  JPN: JSON.parse(readFileSync(join(fixtures, 's25', 'imf-cpi-jpn-2026-11-12.json'), 'utf8')) as unknown,
  KOR: JSON.parse(readFileSync(join(fixtures, 's25', 'imf-cpi-kor-2026-11-12.json'), 'utf8')) as unknown,
  IND: JSON.parse(readFileSync(join(fixtures, 's25', 'imf-cpi-ind-2026-11-12.json'), 'utf8')) as unknown,
};

function mutate(country: ImfCpiCountry, fn: (root: unknown) => void): unknown {
  const clone = JSON.parse(JSON.stringify(captures[country])) as unknown;
  fn(clone);
  return clone;
}

/** The capture's series-observations map, typed once for the mutations below. */
function observationsOf(root: unknown): Record<string, unknown[]> {
  const series = (root as { data: { dataSets: Array<{ series: Record<string, { observations?: Record<string, unknown[]> }> }> } })
    .data.dataSets[0]!.series['0:0:0:0:0']!;
  if (series.observations === undefined) throw new Error('fixture shape changed');
  return series.observations;
}

/** The capture's TIME_PERIOD value labels, typed once for the mutations below. */
function periodValuesOf(root: unknown): Array<{ value: string }> {
  return (root as { data: { structures: Array<{ dimensions: { observation: Array<{ values: Array<{ value: string }> }> } }> } })
    .data.structures[0]!.dimensions.observation[0]!.values;
}

describe('parseImfCpiYoy (S25, BD-S23a: the IMF SDMX 3.0 CPI dataflow parse)', () => {
  it('parses the recorded Japan capture: the trailing decade, live-pinned to the bureau cross-check', () => {
    const out = parseImfCpiYoy('JPN', captures.JPN);
    expect(out.length).toBe(129);
    expect(out[0]).toEqual({ date: '2016-01-31', value: -0.1022494887525562 });
    // The live pin: the mirror's Sep 2026 = 2.2321% — the bureau's own
    // 2025-base headline reads +2.1% for the same month (the Aug-2026
    // re-weighting wedge, BD-S23a); the IMF's own IX series reproduces
    // this exactly (114.5 ÷ 112.0).
    const byDate = new Map(out.map((p) => [p.date, p.value]));
    expect(byDate.get('2026-09-30')!).toBeCloseTo(2.232142857142857, 9);
    expect(byDate.get('2026-08-31')!).toBeCloseTo(1.962533452274755, 9);
    expect(byDate.get('2026-07-31')!).toBeCloseTo(2.055406613047364, 9);
    // Ascending, month-end dates, one point per month.
    for (let i = 1; i < out.length; i++) {
      expect(out[i]!.date > out[i - 1]!.date).toBe(true);
    }
    expect(new Set(out.map((p) => p.date)).size).toBe(out.length);
    expect(out.every((p) => /-(0[13578]|1[02])-31|-(0[469]|11)-30|-02-(28|29)$/.test(p.date))).toBe(true);
  });

  it('parses the recorded Korea capture: the live pin is KOSTAT’s own October release (EXACT)', () => {
    const out = parseImfCpiYoy('KOR', captures.KOR);
    expect(out.length).toBe(130);
    const last = out[out.length - 1]!;
    expect(last.date).toBe('2026-10-31');
    // KOSTAT's own October 2026 release: consumer prices +2.8% YoY —
    // the mirror's 2.8189… rounds to 2.8 EXACTLY (BD-S23a).
    expect(last.value).toBeCloseTo(2.818940555271674, 9);
    expect(last.value).toBeLessThan(2.85);
    expect(last.value).toBeGreaterThanOrEqual(2.75);
  });

  it('parses the recorded India capture: the live pin is MoSPI’s own July press note (display rounding)', () => {
    const out = parseImfCpiYoy('IND', captures.IND);
    expect(out.length).toBe(127);
    const last = out[out.length - 1]!;
    // MoSPI's own July 2026 press note: 4.45% (Provisional) — the
    // mirror's 4.4412 rounds to 4.44 (BD-S23a: the same number within
    // display rounding; the mirror lags MoSPI by 1–3 months).
    expect(last.date).toBe('2026-07-31');
    expect(last.value).toBeCloseTo(4.44121915820029, 9);
    expect(Math.round(last.value * 10) / 10).toBeCloseTo(4.4, 9);
  });

  it('the three fetches feed exactly the three §15 D-36 ids', () => {
    expect(IMF_CPI_IDS).toEqual(['japan-cpi', 'korea-cpi', 'india-cpi']);
    expect(imfCpiDataUrl('JPN')).toBe(
      'https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/CPI/5.0.0/JPN.CPI._T.YOY_PCH_PA_PT.M',
    );
    expect(imfCpiLabel('KOR')).toContain('Korea');
    expect(imfCpiLabel('IND')).toContain('India');
  });

  it('fails closed on a missing structures envelope', () => {
    expect(() => parseImfCpiYoy('JPN', { data: {} })).toThrow(/missing data.structures/);
    expect(() => parseImfCpiYoy('JPN', { data: { structures: [] } })).toThrow(/missing data.structures/);
  });

  it('fails closed on a changed dimension set (added, removed or renamed)', () => {
    const renamed = mutate('JPN', (root) => {
      const dims = (root as { data: { structures: Array<{ dimensions: { series: Array<{ id: string }> } }> } }).data
        .structures[0]!.dimensions.series;
      dims[0]!.id = 'COUNTRY_RENAMED';
    });
    expect(() => parseImfCpiYoy('JPN', renamed)).toThrow(/dimension COUNTRY missing/);
    const removed = mutate('JPN', (root) => {
      const dims = (root as { data: { structures: Array<{ dimensions: { series: Array<{ id: string }> } }> } }).data
        .structures[0]!.dimensions.series;
      dims.splice(4, 1);
    });
    expect(() => parseImfCpiYoy('JPN', removed)).toThrow(/unexpected dimension count/);
  });

  it('fails closed when the dimension value ids move (the dataset membership changed)', () => {
    const swapped = mutate('KOR', (root) => {
      const dims = (root as {
        data: { structures: Array<{ dimensions: { series: Array<{ values: Array<{ id: string }> }> } }> };
      }).data.structures[0]!.dimensions.series;
      const trans = dims.find((d) => Array.isArray(d.values) && d.values.some((v) => v.id === 'YOY_PCH_PA_PT'));
      if (trans === undefined) throw new Error('fixture shape changed');
      trans.values[0]!.id = 'SOME_OTHER_TRANSFORMATION';
    });
    expect(() => parseImfCpiYoy('KOR', swapped)).toThrow(/dimension value TYPE_OF_TRANSFORMATION=YOY_PCH_PA_PT not present/);
  });

  it('fails closed when the wanted series disappears from the dataset', () => {
    const dropped = mutate('IND', (root) => {
      delete (root as { data: { dataSets: Array<{ series: Record<string, unknown> }> } }).data.dataSets[0]!.series['0:0:0:0:0'];
    });
    expect(() => parseImfCpiYoy('IND', dropped)).toThrow(/absent from the dataset/);
  });

  it('fails closed on a non-monthly period reaching the monthly series', () => {
    const annual = mutate('JPN', (root) => {
      periodValuesOf(root)[0]!.value = '2016';
    });
    expect(() => parseImfCpiYoy('JPN', annual)).toThrow(/annual period 2016 reached a monthly series/);
    const garbage = mutate('JPN', (root) => {
      periodValuesOf(root)[0]!.value = 'not-a-period';
    });
    expect(() => parseImfCpiYoy('JPN', garbage)).toThrow(/not YYYY-MMn/);
  });

  it('skips a missing observation honestly (a null value is a gap, never a zero)', () => {
    const gapped = mutate('KOR', (root) => {
      const obs = observationsOf(root);
      const keys = Object.keys(obs).sort((a, b) => Number(a) - Number(b));
      obs[keys[Math.floor(keys.length / 2)]!] = [null];
    });
    const out = parseImfCpiYoy('KOR', gapped);
    expect(out.length).toBe(129); // one fewer point — the gap stays a gap
  });

  it('fails closed on an implausible YoY value (a provider artifact, never rendered garbage)', () => {
    const absurd = mutate('IND', (root) => {
      const obs = observationsOf(root);
      const keys = Object.keys(obs);
      obs[keys[keys.length - 1]!] = [5000];
    });
    expect(() => parseImfCpiYoy('IND', absurd)).toThrow(/outside plausibility/);
  });

  it('fails closed on a truncated answer (the ≥60-point floor)', () => {
    const truncated = mutate('JPN', (root) => {
      const obs = observationsOf(root);
      for (const k of Object.keys(obs).slice(0, -30)) delete obs[k];
    });
    expect(() => parseImfCpiYoy('JPN', truncated)).toThrow(/the answer is truncated/);
  });
});

describe('fetchImfCpiYoy (the HTTP seam)', () => {
  it('fetches through the shared fetch policy with the JSON accept header', async () => {
    let seenAccept: string | null = null;
    const fetchImpl = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      seenAccept = new Headers(init?.headers).get('accept');
      return new Response(JSON.stringify(captures.JPN), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;
    const out = await fetchImfCpiYoy('JPN', { fetchImpl, baseUrl: 'https://api.imf.org/test' });
    expect(out.length).toBe(129);
    expect(seenAccept).toBe('application/json');
  });

  it('fails closed on a non-200 answer', async () => {
    const fetchImpl = (async () =>
      new Response('nope', { status: 503 })) as typeof fetch;
    await expect(fetchImfCpiYoy('KOR', { fetchImpl, baseUrl: 'https://api.imf.org/test' })).rejects.toThrow(
      /HTTP 503/,
    );
  });

  it('fails closed on a non-JSON answer', async () => {
    const fetchImpl = (async () => new Response('<html>challenge</html>', { status: 200 })) as typeof fetch;
    await expect(fetchImfCpiYoy('IND', { fetchImpl, baseUrl: 'https://api.imf.org/test' })).rejects.toThrow(
      /non-JSON answer/,
    );
  });
});
