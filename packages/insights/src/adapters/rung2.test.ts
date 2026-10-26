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
import { runInsightsRung2Phase } from '../ingest/run';
import { DEFINITIONS } from '../definitions';
import type { InsightsStore } from '../store';
import type { SeriesPoint } from '../series';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', '..', 'fixtures');
const mofCurrentCsv = readFileSync(join(fixtures, 'mof-jgbcme-current.csv'), 'utf8');

afterEach(() => {
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ *
 * The fetch plan
 * ------------------------------------------------------------------ */

describe('rung2FetchPlanFor (the cadence gates + the bootstrap rule)', () => {
  const all = new Set<string>();

  it('an ordinary Tuesday: MOF only (the weekly pair waits for Saturday, the monthly trio for the first)', () => {
    const plan = rung2FetchPlanFor(new Date('2026-10-27T04:20:00Z'), all);
    expect(plan).toEqual({ mof: true, eiaWeekly: false, cftcWeekly: false, monthly: false });
  });

  it('Saturday arms the weekly pair; the first of the month arms the monthly trio', () => {
    expect(rung2FetchPlanFor(new Date('2026-10-31T04:20:00Z'), all)).toMatchObject({ eiaWeekly: true, cftcWeekly: true, monthly: false });
    expect(rung2FetchPlanFor(new Date('2026-11-01T04:20:00Z'), all)).toMatchObject({ eiaWeekly: false, monthly: true });
  });

  it('a MISSING id bootstraps its feed regardless of the date (first deploy / disaster recovery)', () => {
    const plan = rung2FetchPlanFor(new Date('2026-10-27T04:20:00Z'), new Set(['eia-crude-stocks', 'epu-us']));
    expect(plan).toEqual({ mof: true, eiaWeekly: true, cftcWeekly: false, monthly: true });
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
          us10y: [[19000, 4.96]],
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
      const out = await collectRung2Sources({ mof: true, eiaWeekly: false, cftcWeekly: false, monthly: false });
      expect(called).toBe(false);
      expect(out.series['jgb-10y']).toBeUndefined();
      expect(out.reports.some((r) => r.source === 'mof' && r.kind === 'disabled')).toBe(true);
    } finally {
      register.SOURCE_RISK_REGISTER['mof-japan']!.enabled = before;
      globalThis.fetch = original;
    }
  });
});
