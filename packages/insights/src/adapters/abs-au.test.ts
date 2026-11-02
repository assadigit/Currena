/**
 * abs-au.test.ts — gap-closure S5-M5.2 (2026-11-02): the Australian macro
 * family's ABS collection. Fixtures: the eight series recorded live
 * 2026-11-02 (M5.1's own probes, saved verbatim — tests never hit live
 * sites) + the RT-flow CEASED evidence.
 *
 * The provider-exact expectations (the latest values, the observation
 * counts) are read from the providers' own fixture rows — never invented
 * numbers. The derived YoY values are computed from the fixture levels and
 * cross-checked against the provider's own percentage-change sibling
 * (the GDP M2 pair: QoQ 0.4 published vs 0.42 computed from levels).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectAbsAuMacro, ABS_AU_IDS, ABS_AU_SERIES } from './abs-au';
import { parseAbsSdmxCsv } from '../parsers';
import { yoyPctSeries } from '../series';
import { DEFINITIONS } from '../definitions';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', '..', 'fixtures', 's5');

/** The 2026-11-02 captures (verbatim provider bodies). */
const fixtureText = (name: string): string => readFileSync(join(fixtures, name), 'utf8');
const gdpLevels = fixtureText('abs-gdp-chain-volume-2026-11-02.csv');
const gdpPct = fixtureText('abs-gdp-pct-change-2026-11-02.csv');
const tradeBalance = fixtureText('abs-trade-balance-sa-2026-11-02.csv');
const householdSpending = fixtureText('abs-household-spending-tty-2026-11-02.csv');
const approvals = fixtureText('abs-dwelling-approvals-2026-11-02.csv');
const erp = fixtureText('abs-erp-2026-11-02.csv');
const nom = fixtureText('abs-nom-2026-11-02.csv');
const participation = fixtureText('abs-participation-2026-11-02.csv');
const underemployment = fixtureText('abs-underemployment-2026-11-02.csv');

/** A fetchImpl that answers each series' URL with its fixture body. */
function fixtureFetch(): typeof fetch {
  const byUrl = new Map<string, string>([
    [
      `https://data.api.abs.gov.au/rest/data/${ABS_AU_SERIES.gdpChainVolume}?format=csv`,
      gdpLevels,
    ],
    [`https://data.api.abs.gov.au/rest/data/${ABS_AU_SERIES.tradeBalance}?format=csv`, tradeBalance],
    [
      `https://data.api.abs.gov.au/rest/data/${ABS_AU_SERIES.householdSpendingTty}?format=csv`,
      householdSpending,
    ],
    [
      `https://data.api.abs.gov.au/rest/data/${ABS_AU_SERIES.dwellingApprovals}?format=csv`,
      approvals,
    ],
    [`https://data.api.abs.gov.au/rest/data/${ABS_AU_SERIES.erp}?format=csv`, erp],
    [`https://data.api.abs.gov.au/rest/data/${ABS_AU_SERIES.nom}?format=csv`, nom],
    [`https://data.api.abs.gov.au/rest/data/${ABS_AU_SERIES.participation}?format=csv`, participation],
    [
      `https://data.api.abs.gov.au/rest/data/${ABS_AU_SERIES.underemployment}?format=csv`,
      underemployment,
    ],
  ]);
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const body = byUrl.get(url);
    if (body === undefined) throw new Error(`unexpected URL in test: ${url}`);
    return new Response(body, { status: 200, headers: { 'content-type': 'text/csv' } });
  }) as typeof fetch;
}

describe('the S5 fixtures parse through the shared ABS SDMX parser', () => {
  it('the GDP chain-volume levels: 268 valued quarterly obs, latest 699,461 @ 2026-Q2 (2026-04-01)', () => {
    const points = parseAbsSdmxCsv(gdpLevels);
    expect(points.length).toBe(268); // 269 rows minus the empty first observation
    expect(points.at(-1)).toEqual({ date: '2026-04-01', value: 699461 });
  });

  it('the goods trade balance: 662 monthly obs, latest +495 @ 2026-08-01 (the provider\'s own balance series, $m SA)', () => {
    const points = parseAbsSdmxCsv(tradeBalance);
    expect(points.length).toBe(662);
    expect(points.at(-1)).toEqual({ date: '2026-08-01', value: 495 });
  });

  it('the household spending indicator: 158 valued monthly obs, latest 6.6% @ 2026-08-01 (the CEASED RT flow\'s successor)', () => {
    const points = parseAbsSdmxCsv(householdSpending);
    expect(points.length).toBe(158);
    expect(points.at(-1)).toEqual({ date: '2026-08-01', value: 6.6 });
  });

  it('the dwelling approvals: 849 monthly obs, latest 18,264 @ 2026-09-01 (the freshest print)', () => {
    const points = parseAbsSdmxCsv(approvals);
    expect(points.length).toBe(849);
    expect(points.at(-1)).toEqual({ date: '2026-09-01', value: 18264 });
  });

  it('the ERP population levels: 180 quarterly obs, latest 27,921.2k @ 2026-Q1', () => {
    const points = parseAbsSdmxCsv(erp);
    expect(points.length).toBe(180);
    expect(points.at(-1)).toEqual({ date: '2026-01-01', value: 27921.2 });
  });

  it('the net overseas migration flow: 180 quarterly obs, latest 101.0k @ 2026-Q1', () => {
    const points = parseAbsSdmxCsv(nom);
    expect(points.length).toBe(180);
    expect(points.at(-1)).toEqual({ date: '2026-01-01', value: 101 });
  });

  it('the participation rate: 584 monthly obs, latest 66.7632% @ 2026-09-01', () => {
    const points = parseAbsSdmxCsv(participation);
    expect(points.length).toBe(584);
    expect(points.at(-1)!.date).toBe('2026-09-01');
    expect(points.at(-1)!.value).toBeCloseTo(66.76317272, 6);
  });

  it('the underemployment rate: 584 monthly obs, latest 6.3258% @ 2026-09-01', () => {
    const points = parseAbsSdmxCsv(underemployment);
    expect(points.length).toBe(584);
    expect(points.at(-1)!.date).toBe('2026-09-01');
    expect(points.at(-1)!.value).toBeCloseTo(6.3258024, 6);
  });
});

describe('the GDP YoY derivation (computed from the provider\'s own levels)', () => {
  it('2026-Q2 YoY = 2.14% (699,461 vs 684,822 the year before) and the QoQ 0.42% matches the provider\'s own M2 print of 0.4', () => {
    const levels = parseAbsSdmxCsv(gdpLevels);
    const yoy = yoyPctSeries(levels);
    const last = yoy.at(-1)!;
    expect(last.date).toBe('2026-04-01');
    expect(last.value).toBeCloseTo(2.1376, 3); // 699461/684822 - 1 (fixture-verified)
    // The cross-check: the provider's own QoQ percentage-change series.
    const pct = parseAbsSdmxCsv(gdpPct);
    expect(pct.at(-1)).toEqual({ date: '2026-04-01', value: 0.4 });
    const qoqComputed = (levels.at(-1)!.value / levels.at(-2)!.value - 1) * 100;
    expect(qoqComputed).toBeCloseTo(0.4196, 3); // rounds to the provider's 0.4
    // The YoY series needs a year of levels first — its first point is 4 quarters in.
    expect(yoy.length).toBe(levels.length - 4);
  });

  it('the population YoY derivation: 2026-Q1 = 1.43% (27,921.2 vs 27,528.4 a year earlier)', () => {
    const levels = parseAbsSdmxCsv(erp);
    const yoy = yoyPctSeries(levels);
    const last = yoy.at(-1)!;
    expect(last.date).toBe('2026-01-01');
    expect(last.value).toBeCloseTo(1.4269, 3);
  });
});

describe('collectAbsAuMacro (the fail-soft collection)', () => {
  it('derives all eight series from the fixtures with honest report rows', async () => {
    const result = await collectAbsAuMacro({ fetchImpl: fixtureFetch() });
    expect(result.reports.length).toBe(8);
    expect(result.reports.every((r) => r.ok)).toBe(true);
    expect(result.reports.every((r) => r.kind === 'fetched')).toBe(true);
    // The derived ids (au-nom rides along as the population card's companion).
    expect(Object.keys(result.series).sort()).toEqual([...ABS_AU_IDS].sort());
    // Provider-exact spot checks on the derived output.
    expect(result.series['au-gdp-growth']!.at(-1)!.value).toBeCloseTo(2.1376, 3);
    expect(result.series['au-trade-balance']!.at(-1)).toEqual({ date: '2026-08-01', value: 495 });
    expect(result.series['au-household-spending']!.at(-1)).toEqual({ date: '2026-08-01', value: 6.6 });
    expect(result.series['au-building-approvals']!.at(-1)).toEqual({ date: '2026-09-01', value: 18264 });
    expect(result.series['au-population-growth']!.at(-1)!.value).toBeCloseTo(1.4269, 3);
    expect(result.series['au-nom']!.at(-1)).toEqual({ date: '2026-01-01', value: 101 });
    expect(result.series['au-participation']!.at(-1)!.value).toBeCloseTo(66.76317272, 6);
    expect(result.series['au-underemployment']!.at(-1)!.value).toBeCloseTo(6.3258024, 6);
  });

  it('a failed fetch fails soft: the affected id is absent, the others still derive, the report row is honest', async () => {
    const failing: typeof fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.includes(ABS_AU_SERIES.tradeBalance)) {
        return new Response('NoRecordsFound', { status: 200 });
      }
      return fixtureFetch()(input);
    }) as typeof fetch;
    const result = await collectAbsAuMacro({ fetchImpl: failing });
    expect(result.series['au-trade-balance']).toBeUndefined();
    expect(result.series['au-gdp-growth']).toBeDefined();
    const tradeRow = result.reports.find((r) => r.detail.includes('balance on goods'));
    expect(tradeRow).toBeDefined();
    expect(tradeRow!.ok).toBe(false);
    expect(tradeRow!.detail).toContain('NoRecordsFound');
  });

  it('the ABS_AU_IDS list matches the definitions table (every id exists, all context rules)', () => {
    for (const id of ABS_AU_IDS) {
      const def = DEFINITIONS.find((d) => d.id === id);
      expect(def, `${id} must exist in DEFINITIONS`).toBeDefined();
      expect(def!.rule.kind, `${id} must be context-only per G-5`).toBe('info');
      expect(def!.source, `${id} rides the abs provider`).toBe('abs');
    }
  });
});
