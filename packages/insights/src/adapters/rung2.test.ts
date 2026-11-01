/**
 * rung2.test.ts — the 2026-10-26 gap-audit build's second-rung machinery:
 * the fetch plan (cadence gates + bootstrap), the snapshot carry-forward
 * (the main rung's half of the split), the pure patch, and the phase
 * itself against an in-memory store with the global fetch stubbed
 * (AGENTS.md rule 7 — never a live site).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { InsightsSnapshot, IndicatorHistory, IndicatorId, InsightsStatus } from '@currena/core';
import { buildInsightsSnapshot, patchInsightsSnapshot } from './snapshot';
import { collectRung2Sources, rung2FetchPlanFor, RUNG2_IDS } from './rung2';
import { runInsightsRung2Phase, runInsightsHistoryPhase, historyPhaseIds } from '../ingest/run';
import { DEFINITIONS } from '../definitions';
import type { InsightsStore } from '../store';
import type { SeriesPoint } from '../series';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', '..', 'fixtures');
const mofCurrentCsv = readFileSync(join(fixtures, 'mof-jgbcme-current.csv'), 'utf8');
// 2026-10-26 gap-audit build, A-8..A-10: the monthly trio's captures.
const cliCsv = readFileSync(join(fixtures, 'oecd-cli.csv'), 'utf8');
const gprBuf = readFileSync(join(fixtures, 'gpr-export.xls')).buffer;
const epuBuf = readFileSync(join(fixtures, 'epu-main-news-index.xlsx')).buffer;
// gap-closure S4-M4.2: the geopolitics family's captures.
const gprDailyBuf = readFileSync(join(fixtures, 's4', 'gpr-daily-2026-11-01.xls')).buffer;
const tpuBuf = readFileSync(join(fixtures, 's4', 'tpu-categorical-epu-2026-11-01.xlsx')).buffer;
// gap-closure S4-M4.4 (2026-11-01): the supply-chain and energy family's
// captures — the GSCPI workbook + the two EIA weekly pages (plus the main
// crude-stocks fixture the weekly family test reuses).
const gscpiBuf = readFileSync(join(fixtures, 's4', 'gscpi-2026-11-01.xls')).buffer;
const stocksHtml = readFileSync(join(fixtures, 'eia-crude-stocks.html'), 'utf8');
const sprHtml = readFileSync(join(fixtures, 's4', 'eia-spr-2026-11-01.html'), 'utf8');
const productionHtml = readFileSync(join(fixtures, 's4', 'eia-crude-production-2026-11-01.html'), 'utf8');

afterEach(() => {
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ *
 * The fetch plan
 * ------------------------------------------------------------------ */

describe('rung2FetchPlanFor (the cadence gates + the bootstrap rule)', () => {
  const all = new Set<string>();

  it('an ordinary Tuesday: MOF + the GPR daily file only (the weekly pair waits for Saturday, the monthly trio for the first)', () => {
    const plan = rung2FetchPlanFor(new Date('2026-10-27T04:20:00Z'), all);
    expect(plan).toEqual({ mof: true, eiaWeekly: false, cftcWeekly: false, monthly: false, gprDaily: true });
  });

  it('Saturday arms the weekly pair; the first of the month arms the monthly trio', () => {
    expect(rung2FetchPlanFor(new Date('2026-10-31T04:20:00Z'), all)).toMatchObject({ eiaWeekly: true, cftcWeekly: true, monthly: false });
    expect(rung2FetchPlanFor(new Date('2026-11-01T04:20:00Z'), all)).toMatchObject({ eiaWeekly: false, monthly: true });
  });

  it('a MISSING id bootstraps its feed regardless of the date (first deploy / disaster recovery)', () => {
    const plan = rung2FetchPlanFor(new Date('2026-10-27T04:20:00Z'), new Set(['eia-crude-stocks', 'epu-us']));
    expect(plan).toEqual({ mof: true, eiaWeekly: true, cftcWeekly: false, monthly: true, gprDaily: true });
  });

  // gap-closure S4-M4.4 (2026-11-01): the new family's bootstrap legs.
  it('S4-M4.4: a missing SPR/production id bootstraps the EIA weekly gate; a missing GSCPI bootstraps the monthly plan', () => {
    const weekday = new Date('2026-11-03T04:20:00Z'); // a Tuesday
    expect(rung2FetchPlanFor(weekday, new Set(['us-spr']))).toMatchObject({ eiaWeekly: true, monthly: false });
    expect(rung2FetchPlanFor(weekday, new Set(['us-crude-production']))).toMatchObject({ eiaWeekly: true });
    expect(rung2FetchPlanFor(weekday, new Set(['gscpi']))).toMatchObject({ monthly: true, eiaWeekly: false });
  });
});

/* ------------------------------------------------------------------ *
 * The snapshot carry-forward (the main rung's half)
 * ------------------------------------------------------------------ */

describe('the rung-2 carry-forward at the main build (carryForwardIds)', () => {
  const NOW = '2026-10-27T04:10:00.000Z';

  function baseSnapshot(): InsightsSnapshot {
    // A minimal snapshot where every definition has SOME reading: the
    // rung-2 ids carry their last patched values, the rest compute.
    const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
    for (const def of DEFINITIONS) {
      if ((RUNG2_IDS as readonly string[]).includes(def.id)) continue;
      series[def.id] = [{ date: '2026-10-26', value: 1 }];
    }
    return buildInsightsSnapshot({ series, calendar: [], now: '2026-10-26T04:20:00.000Z' });
  }

  it('a rung-2 id with NO series keeps its previous reading VERBATIM (status, value, asOf) — not the H3 stale-hold', () => {
    const previous = baseSnapshot();
    // Simulate yesterday's 04:20 patch: jgb-10y fresh from MOF.
    const patched = patchInsightsSnapshot(
      previous,
      [
        {
          id: 'jgb-10y',
          value: 2.914,
          asOf: '2026-10-22',
          status: 'context',
          sourceName: 'Japan Ministry of Finance (JGB interest rates, daily)',
          sourceUrl: MOF_URL,
          updatedAt: '2026-10-26T04:20:00.000Z',
        },
      ],
      '2026-10-26T04:20:00.000Z',
    );
    expect(patched.readings.find((r) => r.id === 'jgb-10y')!.value).toBe(2.914);

    // Today's 04:10 main build: no jgb series (by design) → the reading
    // carries verbatim, still 'context' with its MOF asOf.
    const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
    for (const def of DEFINITIONS) {
      if ((RUNG2_IDS as readonly string[]).includes(def.id)) continue;
      series[def.id] = [{ date: '2026-10-27', value: 1 }];
    }
    const today = buildInsightsSnapshot({
      series,
      previous: patched,
      calendar: [],
      now: NOW,
      carryForwardIds: new Set(RUNG2_IDS as readonly string[]),
    });
    const jgb = today.readings.find((r) => r.id === 'jgb-10y')!;
    expect(jgb.status).toBe('context');
    expect(jgb.value).toBe(2.914);
    expect(jgb.asOf).toBe('2026-10-22');
    expect(jgb.updatedAt).toBe(NOW);
  });

  it('a NON-rung-2 id with no series still takes the honest stale-hold (the carry is scoped)', () => {
    const previous = baseSnapshot();
    const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
    for (const def of DEFINITIONS) {
      if (def.id === 'us10y' || (RUNG2_IDS as readonly string[]).includes(def.id)) continue;
      series[def.id] = [{ date: '2026-10-27', value: 1 }];
    }
    const today = buildInsightsSnapshot({
      series,
      previous,
      calendar: [],
      now: NOW,
      carryForwardIds: new Set(RUNG2_IDS as readonly string[]),
    });
    const us10y = today.readings.find((r) => r.id === 'us10y')!;
    expect(us10y.status).toBe('stale'); // the H3 honesty, unchanged
  });
});

const MOF_URL = 'https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/jgbcme.csv';

/* ------------------------------------------------------------------ *
 * patchInsightsSnapshot (the pure patch)
 * ------------------------------------------------------------------ */

describe('patchInsightsSnapshot', () => {
  const NOW = '2026-10-27T04:20:00.000Z';

  it('replaces the patched rows in place, keeps the others byte-equal, recomputes the summary', () => {
    const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
    for (const def of DEFINITIONS) series[def.id] = [{ date: '2026-10-26', value: 1 }];
    const stored = buildInsightsSnapshot({ series, calendar: [], now: '2026-10-27T04:10:00.000Z' });
    const jgbRow = stored.readings.find((r) => r.id === 'jgb-10y')!;

    const patched = patchInsightsSnapshot(
      stored,
      [{ ...jgbRow, value: 2.914, asOf: '2026-10-26', status: 'context', updatedAt: NOW }],
      NOW,
    );
    expect(patched.readings).toHaveLength(stored.readings.length);
    expect(patched.readings.find((r) => r.id === 'jgb-10y')!.value).toBe(2.914);
    // untouched rows keep their identity + values
    expect(patched.readings.find((r) => r.id === 'us10y')).toEqual(stored.readings.find((r) => r.id === 'us10y'));
    expect(patched.generatedAt).toBe(NOW);
  });
});

/* ------------------------------------------------------------------ *
 * The phase (in-memory store, stubbed fetch)
 * ------------------------------------------------------------------ */

/** A minimal in-memory InsightsStore. */
class MemoryStore implements InsightsStore {
  snapshot: InsightsSnapshot | undefined;
  status: InsightsStatus | undefined;
  histories = new Map<IndicatorId, IndicatorHistory>();

  async getSnapshot() {
    return this.snapshot;
  }
  async putSnapshot(s: InsightsSnapshot) {
    this.snapshot = s;
  }
  async getHistory(id: IndicatorId) {
    return this.histories.get(id);
  }
  async putHistory(h: IndicatorHistory) {
    this.histories.set(h.id, h);
  }
  async getStatus() {
    return this.status;
  }
  async putStatus(s: InsightsStatus) {
    this.status = s;
  }
  async getArchive() {
    return undefined;
  }
  async putArchive() {
    /* test store */
  }
  async getPublicSnapshot() {
    return undefined;
  }
  async putPublicSnapshot() {
    /* test store */
  }
  async getPublicArchive() {
    return undefined;
  }
  async putPublicArchive() {
    /* test store */
  }
}

/** A stage-like KV: the main rung's blob shape (us10y + jgb-mirror). */
class MemoryKv {
  value: string | null = null;
  async get() {
    return this.value;
  }
  async put(_key: string, value: string) {
    this.value = value;
  }
}

describe('runInsightsRung2Phase (the 04:20 orchestration)', () => {
  it('fetches MOF, patches the snapshot + public projection, updates the stage, appends status rows', async () => {
    const original = globalThis.fetch;
    const urls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.includes('jgbcme')) return new Response(mofCurrentCsv, { status: 200 });
      return new Response('{"ok":1}', { status: 200 });
    }) as typeof fetch;

    try {
      // The pre-state: a stored snapshot from the 04:10 main build (jgb-10y
      // unavailable — no previous 04:20 ever ran) + a stage with us10y.
      const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
      for (const def of DEFINITIONS) {
        if ((RUNG2_IDS as readonly string[]).includes(def.id)) continue;
        series[def.id] = [{ date: '2026-10-27', value: 1 }];
      }
      series.us10y = [{ date: '2026-10-26', value: 4.96 }];
      const store = new MemoryStore();
      store.snapshot = buildInsightsSnapshot({
        series,
        calendar: [],
        now: '2026-10-27T04:10:00.000Z',
        carryForwardIds: new Set(RUNG2_IDS as readonly string[]),
      });
      const kv = new MemoryKv();
      kv.value = JSON.stringify({
        v: 1,
        writtenAt: '2026-10-27T04:10:00.000Z',
        series: {
          // epoch day 20747 = 2026-10-21 (inside the MOF fixture's month).
          us10y: [
            [20731, 4.9],
            [20747, 4.96],
            [20748, 4.95],
          ],
          'jgb-mirror': [[19000, 2.8]],
        },
      });

      const result = await runInsightsRung2Phase({
        store: store as unknown as InsightsStore,
        stageKv: kv as unknown as Parameters<typeof runInsightsRung2Phase>[0]['stageKv'],
        mode: 'scheduled',
        now: new Date('2026-10-26T04:20:00Z'),
      });

      // MOF fetched (current-month file; an ordinary Monday — no all-file)
      expect(urls.filter((u) => u.includes('jgbcme.csv'))).toHaveLength(1);
      expect(result.patched).toBe(true);
      // the patched snapshot: jgb-10y fresh from the MOF file
      const jgb = store.snapshot!.readings.find((r) => r.id === 'jgb-10y')!;
      expect(jgb.value).toBe(2.914);
      expect(jgb.asOf).toBe('2026-10-22');
      expect(jgb.sourceName).toContain('Ministry of Finance');
      expect(jgb.status).toBe('context');
      // the stage update carries the fresh series for the 04:25 phase
      const stage = JSON.parse(kv.value!) as { series: Record<string, unknown> };
      expect(stage.series['jgb-10y']).toBeDefined();
      expect(stage.series['jgb-mirror']).toBeDefined(); // preserved
      // A-3: the US−Japan gap derived from the staged us10y + the MOF jgb
      // series — the stage's us10y (4.96 @ 2026-10-26) joins the MOF file's
      // newest common date (2026-10-22 → the stage series is date-mapped by
      // epoch day; the gap's value must be a true difference, never stale).
      const gap = store.snapshot!.readings.find((r) => r.id === 'us-japan-10y-gap')!;
      expect(gap).toBeDefined();
      expect(gap.value).not.toBeNull();
      expect(gap.gapLegs).toBeDefined();
      expect(gap.gapLegs!.a.id).toBe('us10y');
      expect(gap.gapLegs!.b.id).toBe('jgb-10y');
      // the report rows appended
      expect(result.reports.some((r) => r.source === 'mof' && r.ok)).toBe(true);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('a MOF outage: the OECD mirror fills from the stage, LABELLED — never a silent substitution', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response('service unavailable', { status: 503 })) as typeof fetch;
    try {
      const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
      for (const def of DEFINITIONS) {
        if ((RUNG2_IDS as readonly string[]).includes(def.id)) continue;
        series[def.id] = [{ date: '2026-10-27', value: 1 }];
      }
      const store = new MemoryStore();
      store.snapshot = buildInsightsSnapshot({
        series,
        calendar: [],
        now: '2026-10-27T04:10:00.000Z',
        carryForwardIds: new Set(RUNG2_IDS as readonly string[]),
      });
      const kv = new MemoryKv();
      kv.value = JSON.stringify({
        v: 1,
        writtenAt: '2026-10-27T04:10:00.000Z',
        series: { 'jgb-mirror': [[19000, 2.8], [19100, 2.9]] },
      });

      const result = await runInsightsRung2Phase({
        store: store as unknown as InsightsStore,
        stageKv: kv as unknown as Parameters<typeof runInsightsRung2Phase>[0]['stageKv'],
        mode: 'scheduled',
        now: new Date('2026-10-27T04:20:00Z'),
      });

      expect(result.patched).toBe(true);
      const jgb = store.snapshot!.readings.find((r) => r.id === 'jgb-10y')!;
      expect(jgb.sourceName).toContain('OECD via FRED');
      expect(jgb.sourceName).toContain('MOF outage fallback');
      expect(jgb.value).toBe(2.9);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('neither MOF nor the mirror available: the stored tail holds (nothing fabricated)', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () => new Response('nope', { status: 500 })) as typeof fetch;
    try {
      const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
      for (const def of DEFINITIONS) {
        if ((RUNG2_IDS as readonly string[]).includes(def.id)) continue;
        series[def.id] = [{ date: '2026-10-27', value: 1 }];
      }
      const store = new MemoryStore();
      store.snapshot = buildInsightsSnapshot({
        series,
        calendar: [],
        now: '2026-10-27T04:10:00.000Z',
        carryForwardIds: new Set(RUNG2_IDS as readonly string[]),
      });
      // A stored jgb history (the accumulated daily tail).
      store.histories.set('jgb-10y', {
        v: 1,
        id: 'jgb-10y',
        points: [
          [20636, 2.92],
          [20641, 2.914],
        ],
      } as unknown as IndicatorHistory);
      const kv = new MemoryKv(); // NO stage → no mirror, no us10y

      const result = await runInsightsRung2Phase({
        store: store as unknown as InsightsStore,
        stageKv: kv as unknown as Parameters<typeof runInsightsRung2Phase>[0]['stageKv'],
        mode: 'scheduled',
        now: new Date('2026-10-27T04:20:00Z'),
      });

      expect(result.patched).toBe(true);
      const jgb = store.snapshot!.readings.find((r) => r.id === 'jgb-10y')!;
      expect(jgb.value).toBe(2.914); // the stored tail's newest point
      expect(jgb.sourceName).toContain('Ministry of Finance'); // the primary line
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('collectRung2Sources (the shared collect)', () => {
  it('the kill switch gates the MOF fetch (M-6: a disabled source is never requested)', async () => {
    const original = globalThis.fetch;
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      return new Response(mofCurrentCsv, { status: 200 });
    }) as typeof fetch;
    const register = await import('../sources');
    const before = register.SOURCE_RISK_REGISTER['mof-japan']!.enabled;
    register.SOURCE_RISK_REGISTER['mof-japan']!.enabled = false;
    try {
      const out = await collectRung2Sources({ mof: true, eiaWeekly: false, cftcWeekly: false, monthly: false, gprDaily: false });
      expect(called).toBe(false);
      expect(out.series['jgb-10y']).toBeUndefined();
      expect(out.reports.some((r) => r.source === 'mof' && r.kind === 'disabled')).toBe(true);
    } finally {
      register.SOURCE_RISK_REGISTER['mof-japan']!.enabled = before;
      globalThis.fetch = original;
    }
  });

  it('A-8..A-10 (S4-M4.2: the full geopolitics family): the monthly plan fetches the trio + the TPU — three CLI series + the GPR column set + EPU + TPU from their captures', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('sdmx.oecd.org')) return new Response(cliCsv, { status: 200 });
      if (url.includes('data_gpr_export.xls')) return new Response(gprBuf, { status: 200 });
      if (url.includes('Categorical_EPU_Data')) return new Response(tpuBuf, { status: 200 });
      if (url.includes('policyuncertainty.com')) return new Response(epuBuf, { status: 200 });
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;
    try {
      const out = await collectRung2Sources({ mof: false, eiaWeekly: false, cftcWeekly: false, monthly: true, gprDaily: false });
      expect(out.series['oecd-cli-us']!.at(-1)).toEqual({ date: '2026-09-01', value: 100.9993 });
      expect(out.series['oecd-cli-cn']!.at(-1)).toEqual({ date: '2026-09-01', value: 97.41035 });
      expect(out.series['oecd-cli-de']!.at(-1)).toEqual({ date: '2026-09-01', value: 101.0066 });
      expect(out.series['gpr-index']!.at(-1)!.value).toBeCloseTo(146.2099, 3);
      // S4-M4.2: the SAME download also served the threat/act/country
      // columns (zero extra subrequests — the one-request design).
      expect(out.series['gpr-threats']!.at(-1)!.value).toBeCloseTo(173.0874, 3);
      expect(out.series['gpr-acts']!.at(-1)!.value).toBeCloseTo(144.288, 3);
      expect(out.series['gpr-taiwan']!.at(-1)!.value).toBeCloseTo(0.25924, 4);
      expect(out.series['gpr-australia']!.at(-1)!.value).toBeCloseTo(0.12242, 4);
      for (const id of ['gpr-threats', 'gpr-acts', 'gpr-taiwan', 'gpr-china', 'gpr-russia', 'gpr-ukraine', 'gpr-israel', 'gpr-saudi', 'gpr-australia']) {
        expect(out.series[id as IndicatorId]!.length).toBe(501);
      }
      expect(out.series['epu-us']!.at(-1)).toEqual({ date: '2026-09-01', value: 218.94095727491293 });
      // S4-M4.2: the TPU workbook — the Categorical EPU trade column.
      expect(out.series['tpu-us']!.at(-1)).toEqual({ date: '2026-10-01', value: 1326.4193494653071 });
      expect(out.series['tpu-us']!.length).toBe(502);
      // One OECD fetch served all three countries; ONE GPR fetch served
      // the whole family; the TPU is a second policyuncertainty fetch.
      expect(out.reports.filter((r) => r.source === 'oecd')).toHaveLength(1);
      expect(out.reports.filter((r) => r.source === 'gpr' && r.ok)).toHaveLength(1);
      expect(out.reports.filter((r) => r.source === 'epu' && r.ok)).toHaveLength(2);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('S4-M4.2: the daily plan fetches the GPR daily export — the provider\'s own GPRD_MA7 (15,274 rows through 2026-10-26)', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('data_gpr_daily_recent.xls')) return new Response(gprDailyBuf, { status: 200 });
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;
    try {
      const out = await collectRung2Sources({ mof: false, eiaWeekly: false, cftcWeekly: false, monthly: false, gprDaily: true });
      const gprDaily = out.series['gpr-daily']!;
      expect(gprDaily.length).toBe(15274);
      expect(gprDaily[0]).toEqual({ date: '1985-01-01', value: 230.0394287109375 });
      expect(gprDaily.at(-1)).toEqual({ date: '2026-10-26', value: 181.41552734375 });
      expect(out.reports.filter((r) => r.source === 'gpr' && r.ok)).toHaveLength(1);
    } finally {
      globalThis.fetch = original;
    }
  });

  // gap-closure S4-M4.4 (2026-11-01): the EIA weekly family — THREE pages on
  // the Saturday gate (stocks + SPR + production), provider-exact pins off
  // the M4.1 captures.
  it('S4-M4.4: the eiaWeekly plan fetches all three EIA pages — stocks + the SPR level + field production', async () => {
    const original = globalThis.fetch;
    const urls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url.includes('WCRSTUS1')) return new Response(stocksHtml, { status: 200 });
      if (url.includes('WCSSTUS1')) return new Response(sprHtml, { status: 200 });
      if (url.includes('WCRFPUS2')) return new Response(productionHtml, { status: 200 });
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;
    try {
      const out = await collectRung2Sources({ mof: false, eiaWeekly: true, cftcWeekly: false, monthly: false, gprDaily: false });
      expect(out.series['eia-crude-stocks']!.at(-1)).toEqual({ date: '2026-10-16', value: 695200 });
      expect(out.series['us-spr']!.at(-1)).toEqual({ date: '2026-10-23', value: 282583 });
      expect(out.series['us-spr']!.length).toBeGreaterThan(2000);
      expect(out.series['us-crude-production']!.at(-1)).toEqual({ date: '2026-10-23', value: 13992 });
      // THREE distinct EIA fetches, one report row each.
      expect(urls).toHaveLength(3);
      expect(out.reports.filter((r) => r.source === 'eia' && r.ok)).toHaveLength(3);
    } finally {
      globalThis.fetch = original;
    }
  });

  // gap-closure S4-M4.4: the GSCPI joins the monthly plan — the nyfed
  // provider's first fetch (one more first-of-month subrequest).
  it('S4-M4.4: the monthly plan also fetches the GSCPI workbook (345 rows through 2026-09)', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('sdmx.oecd.org')) return new Response(cliCsv, { status: 200 });
      if (url.includes('data_gpr_export.xls')) return new Response(gprBuf, { status: 200 });
      if (url.includes('Categorical_EPU_Data')) return new Response(tpuBuf, { status: 200 });
      if (url.includes('policyuncertainty.com')) return new Response(epuBuf, { status: 200 });
      if (url.includes('newyorkfed.org')) return new Response(gscpiBuf, { status: 200 });
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;
    try {
      const out = await collectRung2Sources({ mof: false, eiaWeekly: false, cftcWeekly: false, monthly: true, gprDaily: false });
      expect(out.series['gscpi']!.length).toBe(345);
      expect(out.series['gscpi']!.at(-1)).toEqual({ date: '2026-09-01', value: 1.284014886203148 });
      expect(out.reports.filter((r) => r.source === 'nyfed' && r.ok)).toHaveLength(1);
    } finally {
      globalThis.fetch = original;
    }
  });
});

/* ------------------------------------------------------------------ *
 * The split daily-history rungs (2026-10-26 wave-3 — the exceededCpu fix:
 * the whole-set 04:25 rung died with zero writes once the gap-audit ids
 * grew it past the free plan's per-invocation CPU ceiling)
 * ------------------------------------------------------------------ */

describe('historyPhaseIds (the daily split)', () => {
  it('the a/b halves partition the daily set exactly — no id lost, no id twice', () => {
    const whole = historyPhaseIds('daily');
    const a = historyPhaseIds('daily-a');
    const b = historyPhaseIds('daily-b');
    expect(a).toEqual(whole.slice(0, Math.ceil(whole.length / 2)));
    expect(b).toEqual(whole.slice(Math.ceil(whole.length / 2)));
    expect([...a, ...b]).toEqual(whole);
    expect(new Set([...a, ...b]).size).toBe(whole.length);
    // The periodic set is untouched by the split.
    expect(historyPhaseIds('periodic')).not.toContain(a[0]);
  });
});

describe('runInsightsRung2Phase — the first-of-month monthly trio', () => {
  it('patches the five monthly readings + stages their series (one OECD fetch, three countries)', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('jgbcme')) return new Response(mofCurrentCsv, { status: 200 });
      if (url.includes('sdmx.oecd.org')) return new Response(cliCsv, { status: 200 });
      if (url.includes('data_gpr_daily_recent.xls')) return new Response(gprDailyBuf, { status: 200 });
      if (url.includes('matteoiacoviello.com')) return new Response(gprBuf, { status: 200 });
      if (url.includes('Categorical_EPU_Data')) return new Response(tpuBuf, { status: 200 });
      if (url.includes('policyuncertainty.com')) return new Response(epuBuf, { status: 200 });
      if (url.includes('newyorkfed.org')) return new Response(gscpiBuf, { status: 200 });
      throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;
    try {
      const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
      for (const def of DEFINITIONS) {
        if ((RUNG2_IDS as readonly string[]).includes(def.id)) continue;
        series[def.id] = [{ date: '2026-10-31', value: 1 }];
      }
      series.us10y = [{ date: '2026-10-30', value: 4.96 }];
      const store = new MemoryStore();
      store.snapshot = buildInsightsSnapshot({
        series,
        calendar: [],
        now: '2026-11-01T04:10:00.000Z',
        carryForwardIds: new Set(RUNG2_IDS as readonly string[]),
      });
      const kv = new MemoryKv();
      kv.value = JSON.stringify({
        v: 1,
        writtenAt: '2026-11-01T04:10:00.000Z',
        series: { us10y: [[20750, 4.96]], 'jgb-mirror': [[19000, 2.8]] },
      });

      const result = await runInsightsRung2Phase({
        store: store as unknown as InsightsStore,
        stageKv: kv as unknown as Parameters<typeof runInsightsRung2Phase>[0]['stageKv'],
        mode: 'scheduled',
        now: new Date('2026-11-01T04:20:00Z'), // the first of the month
      });

      expect(result.plan.monthly).toBe(true);
      expect(result.patched).toBe(true);
      const byId = new Map(store.snapshot!.readings.map((r) => [r.id as string, r]));
      // The CLI trio: live values @ 2026-09; the US card's rule evaluated
      // (the rising 2026 tail reads Normal — 6-month annualised ≈ +1.1,
          // below the +2 V-turn line, no declines).
      const us = byId.get('oecd-cli-us')!;
      expect(us.value).toBe(100.9993);
      expect(us.asOf).toBe('2026-09-01');
      expect(us.status).toBe('normal');
      expect(us.percentile10y).toBeDefined(); // the 141-point decade base
      const cn = byId.get('oecd-cli-cn')!;
      expect(cn.value).toBe(97.41035);
      expect(cn.status).toBe('context'); // info rule — never a vote
      expect(byId.get('oecd-cli-de')!.value).toBe(101.0066);
      // The GPR + EPU context cards carry their SD-regime z-scores (the
      // rolling decade recomputed on write; both sit in the typical zone
      // on the capture day).
      const gpr = byId.get('gpr-index')!;
      expect(gpr.value).toBeCloseTo(146.2099, 3);
      expect(gpr.asOf).toBe('2026-09-01');
      expect(gpr.status).toBe('context');
      // z vs the decade trailing the phase's clock (2026-11-01): both
      // indexes sit in their typical zone on the capture day.
      expect(gpr.sd10y).toBeCloseTo(0.619, 2);
      const epu = byId.get('epu-us')!;
      expect(epu.value).toBeCloseTo(218.941, 2);
      expect(epu.status).toBe('context');
      expect(epu.sd10y).toBeCloseTo(0.066, 2);
      // S4-M4.2: the geopolitics family patches from the same fetches —
      // the threat/act/country companions carry their SD-regime z-scores,
      // the daily card reads the MA7 tail, and the TPU lands its October
      // value (the freshest month the Categorical workbook carries).
      const threats = byId.get('gpr-threats')!;
      expect(threats.value).toBeCloseTo(173.0874, 3);
      expect(threats.status).toBe('context');
      expect(threats.sd10y).toBeDefined();
      const taiwan = byId.get('gpr-taiwan')!;
      expect(taiwan.value).toBeCloseTo(0.25924, 4);
      expect(taiwan.status).toBe('context');
      const gprDaily = byId.get('gpr-daily')!;
      expect(gprDaily.value).toBeCloseTo(181.4155, 3);
      expect(gprDaily.asOf).toBe('2026-10-26');
      expect(gprDaily.status).toBe('context');
      const tpu = byId.get('tpu-us')!;
      expect(tpu.value).toBeCloseTo(1326.4193, 3);
      expect(tpu.asOf).toBe('2026-10-01');
      expect(tpu.status).toBe('context');
      // S4-M4.4: the GSCPI joins the monthly patch — the supply-pressure
      // member of the geo-fragmentation lane (345 monthly rows on the
      // capture; the reading carries its SD-regime z-score).
      const gscpi = byId.get('gscpi')!;
      expect(gscpi.value).toBeCloseTo(1.284014886203148, 6);
      expect(gscpi.asOf).toBe('2026-09-01');
      expect(gscpi.status).toBe('context');
      expect(gscpi.sd10y).toBeDefined();
      // The stage carries all five + the family (the 04:40 periodic phase's
      // input; gpr-daily rides the daily halves).
      const stage = JSON.parse(kv.value!) as { series: Record<string, unknown> };
      for (const id of [
        'oecd-cli-us', 'oecd-cli-cn', 'oecd-cli-de', 'gpr-index', 'epu-us',
        'gpr-threats', 'gpr-taiwan', 'gpr-daily', 'tpu-us', 'gscpi',
      ]) {
        expect(stage.series[id]).toBeDefined();
      }
      // The periodic history phase then writes them (monthly cadence →
      // the periodic read-compare phase).
      const hist = await runInsightsHistoryPhase({
        kv: kv as unknown as Parameters<typeof runInsightsHistoryPhase>[0]['kv'],
        phase: 'periodic',
        now: new Date('2026-11-01T04:40:00Z'),
      });
      expect(hist.written).toBeGreaterThan(0);
      expect(store.snapshot!.readings).toHaveLength(145); // 96 + the five (2026-10-29 owner round: +usdaed) + the Session-3 breakeven-tilt (G2) + the S2-M2.4 nyfed-custody (the weekly custody card) + the S3-M3.2 liquidity/funding six + the S3-M3.3 credit pair + the S3-M3.4 growth-nowcast/survey six + the S3-M3.5 fiscal/Treasury-supply six + the S4-M4.2 geopolitics eleven + the S4-M4.3 chokepoint five + the S4-M4.4 supply-chain/energy six
    } finally {
      globalThis.fetch = original;
    }
  });
});

/* ------------------------------------------------------------------ *
 * The CFTC accumulation across two Saturdays (the wave-3 stage fix —
 * the A-7 commit's first-point deadlock: a single-point fetch must
 * reach the stage so week 2 JOINS week 1 instead of replacing it)
 * ------------------------------------------------------------------ */

describe('runInsightsRung2Phase — the CFTC single-point accumulation (the A-7 fix)', () => {
  it('week 1 stages its lone point; week 2 merges onto it and the history phase writes the pair', async () => {
    const original = globalThis.fetch;
    const deafutWeek1 = readFileSync(join(fixtures, 'cftc-deafut.txt'), 'utf8');
    // Week 2's file: the same shape, one week later (2026-10-27).
    const deafutWeek2 = deafutWeek1.replaceAll('2026-10-20', '2026-10-27');

    const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
    for (const def of DEFINITIONS) {
      if ((RUNG2_IDS as readonly string[]).includes(def.id)) continue;
      series[def.id] = [{ date: '2026-10-24', value: 1 }];
    }
    const store = new MemoryStore();
    store.snapshot = buildInsightsSnapshot({
      series,
      calendar: [],
      now: '2026-10-24T04:10:00.000Z',
      carryForwardIds: new Set(RUNG2_IDS as readonly string[]),
    });
    const kv = new MemoryKv();

    try {
      // Week 1 (Saturday 2026-10-24): the gold COT file's lone point.
      globalThis.fetch = (async () => new Response(deafutWeek1, { status: 200 })) as typeof fetch;
      const week1 = await runInsightsRung2Phase({
        store: store as unknown as InsightsStore,
        stageKv: kv as unknown as Parameters<typeof runInsightsRung2Phase>[0]['stageKv'],
        mode: 'scheduled',
        now: new Date('2026-10-24T04:20:00Z'),
      });
      expect(week1.patched).toBe(true);
      expect(store.snapshot!.readings.find((r) => r.id === 'cftc-gold-positioning')!.value).toBeCloseTo(49.68, 1);
      let stage = JSON.parse(kv.value!) as { series: Record<string, Array<[number, number]>> };
      // THE FIX: the single point stages (the old > 1 gate dropped it —
      // the accumulation could never start).
      expect(stage.series['cftc-gold-positioning']).toHaveLength(1);
      // The daily history phase floors at 2 points: nothing written yet.
      const hist1 = await runInsightsHistoryPhase({
        kv: kv as unknown as Parameters<typeof runInsightsHistoryPhase>[0]['kv'],
        phase: 'daily',
        now: new Date('2026-10-24T04:25:00Z'),
      });
      expect(hist1.written).toBe(0);

      // Week 2 (Saturday 2026-10-31): a NEW lone point — it must JOIN
      // the staged week-1 point (the stage arms the accumulation base
      // while the stored history key does not exist yet).
      globalThis.fetch = (async () => new Response(deafutWeek2, { status: 200 })) as typeof fetch;
      const week2 = await runInsightsRung2Phase({
        store: store as unknown as InsightsStore,
        stageKv: kv as unknown as Parameters<typeof runInsightsRung2Phase>[0]['stageKv'],
        mode: 'scheduled',
        now: new Date('2026-10-31T04:20:00Z'),
      });
      expect(week2.patched).toBe(true);
      const cftc = store.snapshot!.readings.find((r) => r.id === 'cftc-gold-positioning')!;
      expect(cftc.value).toBeCloseTo(49.68, 1); // the same share, one week later
      expect(cftc.asOf).toBe('2026-10-27');
      stage = JSON.parse(kv.value!) as { series: Record<string, Array<[number, number]>> };
      expect(stage.series['cftc-gold-positioning']).toHaveLength(2); // joined, not replaced
      // And now the daily history phase writes the accumulated pair.
      const hist2 = await runInsightsHistoryPhase({
        kv: kv as unknown as Parameters<typeof runInsightsHistoryPhase>[0]['kv'],
        phase: 'daily',
        now: new Date('2026-10-31T04:25:00Z'),
      });
      expect(hist2.written).toBeGreaterThan(0);
    } finally {
      globalThis.fetch = original;
    }
  });
});
