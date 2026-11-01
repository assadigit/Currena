/**
 * credit.test.ts — gap-closure S3-M3.3 (2026-11-01): the credit-stress
 * pair — the Fed Board's Excess Bond Premium (EBP) monthly CSV and the
 * OFR Financial Stress Index daily CSV. Fixtures: the two files recorded
 * in M3.1 (fetched from the providers 2026-11-01, saved verbatim — tests
 * never hit live sites).
 */

import { describe, expect, it, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { InsightsSnapshot, IndicatorHistory, IndicatorId, InsightsStatus } from '@currena/core';
import { buildInsightsSnapshot } from './snapshot';
import { DEFINITIONS } from '../definitions';
import { fredDecadeFrom } from './fred';
import {
  EBP_CSV_URL,
  OFR_FSI_CSV_URL,
  parseEbpCsv,
  parseOfrFsiCsv,
  fetchEbpCsv,
  fetchOfrFsiCsv,
  collectCreditSources,
} from './credit';
import { RUNG4_IDS } from './rung4';
import { CARRY_FORWARD_IDS, historyPhaseIds, runInsightsCreditPhase } from '../ingest/run';
import type { InsightsStore } from '../store';
import type { SeriesPoint } from '../series';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', '..', 'fixtures');

/** The M3.1 captures (served through an injectable fetch, verbatim bodies). */
const ebpCsv = readFileSync(join(fixtures, 's3', 'ebp-2026-11-01.csv'), 'utf8');
const ofrCsv = readFileSync(join(fixtures, 's3', 'ofr-fsi-2026-11-01.csv'), 'utf8');

afterEach(() => {
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ *
 * parseEbpCsv (fail closed on shape)
 * ------------------------------------------------------------------ */

describe('parseEbpCsv (the Fed Board EBP file)', () => {
  it('parses the M3.1 fixture: the ebp column, monthly dates, full history', () => {
    const series = parseEbpCsv(ebpCsv);
    expect(series).toHaveLength(645); // 1973-01 .. 2026-09 inclusive
    expect(series[0]).toEqual({ date: '1973-01-01', value: -0.04758657214441975 });
    expect(series.at(-1)).toEqual({ date: '2026-09-01', value: -0.3919245963723856 });
    // The OTHER columns must never leak into the card (gz_spread 0.9259 at
    // the same row — the aggregate-column pin, the OFR twin below).
    expect(series.at(-1)!.value).not.toBe(0.9259102941329188);
  });

  it('fails closed on a renamed/missing column (format changed)', () => {
    const bad = 'date,gz_spread,premium,est_prob\n2026-09-01,0.9,-0.39,0.09\n';
    expect(() => parseEbpCsv(bad)).toThrow(/EBP CSV/);
  });

  it('fails closed on a wrong column count', () => {
    const bad = 'date,gz_spread,ebp\n2026-09-01,0.9,-0.39\n';
    expect(() => parseEbpCsv(bad)).toThrow(/EBP CSV/);
  });

  it('fails closed on a non-numeric ebp value', () => {
    const bad = 'date,gz_spread,ebp,est_prob\n2026-09-01,0.9,n/a,0.09\n';
    expect(() => parseEbpCsv(bad)).toThrow(/EBP CSV/);
  });

  it('fails closed on a malformed date', () => {
    const bad = 'date,gz_spread,ebp,est_prob\n2026-9-01,0.9,-0.39,0.09\n';
    expect(() => parseEbpCsv(bad)).toThrow(/EBP CSV/);
  });

  it('fails closed on a header-only body (empty series — never a silent card)', () => {
    expect(() => parseEbpCsv('date,gz_spread,ebp,est_prob\n')).toThrow(/EBP CSV/);
  });
});

/* ------------------------------------------------------------------ *
 * parseOfrFsiCsv (fail closed on shape)
 * ------------------------------------------------------------------ */

describe('parseOfrFsiCsv (the OFR FSI file)', () => {
  it('parses the M3.1 fixture: the AGGREGATE column, never a component', () => {
    const series = parseOfrFsiCsv(ofrCsv);
    expect(series).toHaveLength(6790); // 2000-01-03 .. 2026-10-28 inclusive
    expect(series[0]).toEqual({ date: '2000-01-03', value: 2.14 });
    expect(series.at(-1)).toEqual({ date: '2026-10-28', value: -1.829 });
    // The aggregate-column pin: on 2026-10-27 the aggregate reads -1.913
    // while the Credit COMPONENT reads -0.891 (2026-10-26: -1.569 vs the
    // component -0.865). A component masquerading as the aggregate is the
    // exact silent-misparse this parser must never allow.
    const oct27 = series.find((p) => p.date === '2026-10-27')!;
    expect(oct27.value).toBe(-1.913);
    expect(oct27.value).not.toBe(-0.891);
    const oct26 = series.find((p) => p.date === '2026-10-26')!;
    expect(oct26.value).toBe(-1.569);
    expect(oct26.value).not.toBe(-0.865);
  });

  it('fails closed on a renamed aggregate column (format changed)', () => {
    const bad = 'Date,FSI,Credit,Equity valuation,Safe assets,Funding,Volatility,United States,Other advanced economies,Emerging markets\n2026-10-28,-1.829,-0.915,-0.498,-0.289,-0.143,0.016,-1.139,-0.186,-0.505\n';
    expect(() => parseOfrFsiCsv(bad)).toThrow(/OFR FSI CSV/);
  });

  it('fails closed on a wrong column count', () => {
    const bad = 'Date,OFR FSI\n2026-10-28,-1.829\n';
    expect(() => parseOfrFsiCsv(bad)).toThrow(/OFR FSI CSV/);
  });

  it('fails closed on a non-numeric aggregate', () => {
    const bad = 'Date,OFR FSI,Credit,Equity valuation,Safe assets,Funding,Volatility,United States,Other advanced economies,Emerging markets\n2026-10-28,,-0.915,-0.498,-0.289,-0.143,0.016,-1.139,-0.186,-0.505\n';
    expect(() => parseOfrFsiCsv(bad)).toThrow(/OFR FSI CSV/);
  });

  it('fails closed on a malformed date', () => {
    const bad = 'Date,OFR FSI,Credit,Equity valuation,Safe assets,Funding,Volatility,United States,Other advanced economies,Emerging markets\n2026-10-28,-1.829,-0.915,-0.498,-0.289,-0.143,0.016,-1.139,-0.186,-0.505\n2026/10/29,-1.8,-0.9,-0.5,-0.29,-0.14,0.02,-1.1,-0.19,-0.51\n';
    expect(() => parseOfrFsiCsv(bad)).toThrow(/OFR FSI CSV/);
  });

  it('fails closed on a header-only body', () => {
    expect(() => parseOfrFsiCsv('Date,OFR FSI,Credit,Equity valuation,Safe assets,Funding,Volatility,United States,Other advanced economies,Emerging markets\n')).toThrow(/OFR FSI CSV/);
  });
});

/* ------------------------------------------------------------------ *
 * The fetchers (URL + window discipline)
 * ------------------------------------------------------------------ */

describe('fetchEbpCsv / fetchOfrFsiCsv (the honest single fetch + the decade trim)', () => {
  const NOW = new Date('2026-11-01T04:35:00Z');

  it('fetches the EXACT provider URLs (never an invented one) and trims to the decade window', async () => {
    const original = globalThis.fetch;
    const urls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url === EBP_CSV_URL) return new Response(ebpCsv, { status: 200 });
      if (url === OFR_FSI_CSV_URL) return new Response(ofrCsv, { status: 200 });
      throw new Error(`unexpected fetch URL: ${url}`);
    }) as typeof fetch;
    try {
      const ebp = await fetchEbpCsv({ now: NOW });
      const ofr = await fetchOfrFsiCsv({ now: NOW });
      expect(urls).toEqual([EBP_CSV_URL, OFR_FSI_CSV_URL]);
      // The decade window (the same fredDecadeFrom basis the FRED groups
      // use): EBP keeps 121 monthly rows (2016-09 .. 2026-09), OFR keeps
      // 2616 daily rows (2016-08-05 .. 2026-10-28 — fredDecadeFrom(Now)
      // = 2016-08-05, so the Aug-03/04 fixture rows trim away).
      expect(ebp).toHaveLength(121);
      expect(ebp[0]).toEqual({ date: '2016-09-01', value: -0.06499652930297328 });
      expect(ebp.at(-1)).toEqual({ date: '2026-09-01', value: -0.3919245963723856 });
      expect(ofr).toHaveLength(2616);
      expect(ofr[0]).toEqual({ date: '2016-08-05', value: -0.977 });
      expect(ofr.at(-1)).toEqual({ date: '2026-10-28', value: -1.829 });
      // The window boundary is the SAME fredDecadeFrom arithmetic the S3
      // FRED groups ride (the percentile basis stays consistent).
      expect(fredDecadeFrom(NOW)).toBe('2016-08-05');
    } finally {
      globalThis.fetch = original;
    }
  });

  it('a 404 throws once (F-11 single attempt, no retry) — fail closed, never a partial', async () => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      return new Response('gone', { status: 404 });
    }) as typeof fetch;
    try {
      await expect(fetchEbpCsv({ now: NOW })).rejects.toThrow(/HTTP 404/);
      await expect(fetchOfrFsiCsv({ now: NOW })).rejects.toThrow(/HTTP 404/);
      expect(calls).toBe(2); // one per fetch call — no retries anywhere
    } finally {
      globalThis.fetch = original;
    }
  });
});

/* ------------------------------------------------------------------ *
 * collectCreditSources (the shared collect — the Node venue's twin)
 * ------------------------------------------------------------------ */

describe('collectCreditSources (fail-soft per file, honest rows)', () => {
  it('collects both files with per-file report rows', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === EBP_CSV_URL) return new Response(ebpCsv, { status: 200 });
      if (url === OFR_FSI_CSV_URL) return new Response(ofrCsv, { status: 200 });
      throw new Error(`unexpected fetch URL: ${url}`);
    }) as typeof fetch;
    try {
      const collected = await collectCreditSources({ now: new Date('2026-11-01T04:35:00Z') });
      expect(collected.series.ebp).toHaveLength(121);
      expect(collected.series.ofrFsi).toHaveLength(2616);
      expect(collected.reports).toHaveLength(2);
      expect(collected.reports.every((r) => r.ok)).toBe(true);
      expect(collected.reports.map((r) => r.source)).toEqual(['frb-ebp', 'ofr-fsi']);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('one failing file never sinks the other (the rung2/fred-s3 discipline)', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === EBP_CSV_URL) return new Response(ebpCsv, { status: 200 });
      return new Response('gone', { status: 404 });
    }) as typeof fetch;
    try {
      const collected = await collectCreditSources({ now: new Date('2026-11-01T04:35:00Z') });
      expect(collected.series.ebp).toBeDefined();
      expect(collected.series.ofrFsi).toBeUndefined(); // fail closed, never partial
      const ofrRow = collected.reports.find((r) => r.source === 'ofr-fsi')!;
      expect(ofrRow.ok).toBe(false);
      expect(ofrRow.kind).toBe('failed');
    } finally {
      globalThis.fetch = original;
    }
  });
});

/* ------------------------------------------------------------------ *
 * The phase (the 04:35 orchestration for the credit pair)
 * ------------------------------------------------------------------ */

/** A minimal in-memory InsightsStore (the rung2/rung4 tests' shape). */
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

/** A KV map for the stage + history writes (get/put by key). */
class MemoryKv {
  map = new Map<string, string>();
  async get(key: string) {
    return this.map.get(key) ?? null;
  }
  async put(key: string, value: string) {
    this.map.set(key, value);
  }
}

describe('runInsightsCreditPhase (the 04:35 credit orchestration)', () => {
  it('fetches both files, computes the readings, patches the snapshot + stage, writes its OWN histories, appends status rows', async () => {
    const original = globalThis.fetch;
    const urls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url === EBP_CSV_URL) return new Response(ebpCsv, { status: 200 });
      if (url === OFR_FSI_CSV_URL) return new Response(ofrCsv, { status: 200 });
      throw new Error(`unexpected fetch URL: ${url}`);
    }) as typeof fetch;
    try {
      // The pre-state: the 04:10 main build's snapshot (the credit ids
      // carried — their sources run 25 minutes later).
      const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
      for (const def of DEFINITIONS) {
        if ((RUNG4_IDS as readonly string[]).includes(def.id)) continue;
        series[def.id] = [{ date: '2026-10-31', value: 1 }];
      }
      const store = new MemoryStore();
      store.snapshot = buildInsightsSnapshot({
        series,
        calendar: [],
        now: '2026-11-01T04:10:00.000Z',
        carryForwardIds: new Set(CARRY_FORWARD_IDS),
      });
      store.status = {
        v: 1,
        generatedAt: '2026-11-01T04:10:00.000Z',
        mode: 'scheduled',
        sources: [],
        validation: [],
      } as unknown as InsightsStatus;
      const kv = new MemoryKv();

      const result = await runInsightsCreditPhase({
        files: ['ebp', 'ofr'],
        store: store as unknown as InsightsStore,
        kv: kv as unknown as Parameters<typeof runInsightsCreditPhase>[0]['kv'],
        mode: 'scheduled',
        now: new Date('2026-11-01T04:35:00Z'),
      });

      expect(urls).toEqual([EBP_CSV_URL, OFR_FSI_CSV_URL]);
      expect(result.patched).toBe(true);
      const reading = (id: IndicatorId) => store.snapshot!.readings.find((r) => r.id === id)!;
      // EBP: the fixture's latest month, the provider's own number.
      expect(reading('ebp')!.value).toBeCloseTo(-0.3919245963723856, 12);
      expect(reading('ebp')!.asOf).toBe('2026-09-01');
      expect(reading('ebp')!.status).toBe('context');
      expect(reading('ebp')!.percentile10y).toBeDefined();
      // OFR FSI: the fixture's latest day, the aggregate column.
      expect(reading('ofr-fsi')!.value).toBeCloseTo(-1.829, 12);
      expect(reading('ofr-fsi')!.asOf).toBe('2026-10-28');
      expect(reading('ofr-fsi')!.status).toBe('context');
      expect(reading('ofr-fsi')!.percentile10y).toBeDefined();
      // The source names ride the reading (the /api/insights data line).
      expect(reading('ebp')!.sourceName).toContain('Federal Reserve Board');
      expect(reading('ofr-fsi')!.sourceName).toContain('Office of Financial Research');
      // The stage updated with both series (the sweep bootstrap record).
      const stage = JSON.parse(kv.map.get('insights:ingest-stage:v1')!) as { series: Record<string, unknown> };
      expect(stage.series['ebp']).toBeDefined();
      expect(stage.series['ofr-fsi']).toBeDefined();
      // The phase's OWN history keys (the 04:25/04:40 phases exclude them).
      expect(result.histories.written).toBe(2);
      expect(kv.map.has('insights:hist:ebp')).toBe(true);
      expect(kv.map.has('insights:hist:ofr-fsi')).toBe(true);
      // Honest report rows appended to the status.
      expect(store.status!.sources.filter((r) => (r.source === 'frb-ebp' || r.source === 'ofr-fsi') && r.ok)).toHaveLength(2);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('a single-file phase (the frb-ebp source) fetches ONLY its file', async () => {
    const original = globalThis.fetch;
    const urls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      if (url === EBP_CSV_URL) return new Response(ebpCsv, { status: 200 });
      throw new Error(`unexpected fetch URL: ${url}`);
    }) as typeof fetch;
    try {
      const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
      for (const def of DEFINITIONS) {
        if ((RUNG4_IDS as readonly string[]).includes(def.id)) continue;
        series[def.id] = [{ date: '2026-10-31', value: 1 }];
      }
      const store = new MemoryStore();
      store.snapshot = buildInsightsSnapshot({ series, calendar: [], now: '2026-11-01T04:10:00.000Z' });
      const kv = new MemoryKv();
      const result = await runInsightsCreditPhase({
        files: ['ebp'],
        store: store as unknown as InsightsStore,
        kv: kv as unknown as Parameters<typeof runInsightsCreditPhase>[0]['kv'],
        mode: 'scheduled',
        now: new Date('2026-11-01T04:35:00Z'),
      });
      expect(urls).toEqual([EBP_CSV_URL]);
      expect(result.patched).toBe(true);
      expect(result.series['ofr-fsi']).toBeUndefined(); // never touched by this source
    } finally {
      globalThis.fetch = original;
    }
  });

  it('one failing file never sinks the other: the healthy one still patches (fail-soft per file)', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === EBP_CSV_URL) return new Response(ebpCsv, { status: 200 });
      return new Response('gone', { status: 404 });
    }) as typeof fetch;
    try {
      const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};
      for (const def of DEFINITIONS) {
        if ((RUNG4_IDS as readonly string[]).includes(def.id)) continue;
        series[def.id] = [{ date: '2026-10-31', value: 1 }];
      }
      const store = new MemoryStore();
      store.snapshot = buildInsightsSnapshot({ series, calendar: [], now: '2026-11-01T04:10:00.000Z' });
      const kv = new MemoryKv();
      const result = await runInsightsCreditPhase({
        files: ['ebp', 'ofr'],
        store: store as unknown as InsightsStore,
        kv: kv as unknown as Parameters<typeof runInsightsCreditPhase>[0]['kv'],
        mode: 'scheduled',
        now: new Date('2026-11-01T04:35:00Z'),
      });
      expect(result.patched).toBe(true);
      expect(result.series['ebp']).toBeDefined();
      expect(result.series['ofr-fsi']).toBeUndefined();
      expect(result.reports.find((r) => r.source === 'ofr-fsi')!.ok).toBe(false);
      expect(result.histories.written).toBe(1);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('no stored snapshot: patched stays false, nothing throws (the next main rung builds from scratch)', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === EBP_CSV_URL) return new Response(ebpCsv, { status: 200 });
      if (url === OFR_FSI_CSV_URL) return new Response(ofrCsv, { status: 200 });
      throw new Error(`unexpected fetch URL: ${url}`);
    }) as typeof fetch;
    try {
      const store = new MemoryStore(); // snapshot undefined
      const kv = new MemoryKv();
      const result = await runInsightsCreditPhase({
        files: ['ebp', 'ofr'],
        store: store as unknown as InsightsStore,
        kv: kv as unknown as Parameters<typeof runInsightsCreditPhase>[0]['kv'],
        mode: 'scheduled',
        now: new Date('2026-11-01T04:35:00Z'),
      });
      expect(result.patched).toBe(false);
    } finally {
      globalThis.fetch = original;
    }
  });
});

/* ------------------------------------------------------------------ *
 * The registry discipline (the rung ownership invariants)
 * ------------------------------------------------------------------ */

describe('the credit pair joins the rung-4 family (the ownership invariants)', () => {
  it('RUNG4_IDS carries the credit ids (the daily/periodic phases exclude them; the main rung carries them)', () => {
    expect(RUNG4_IDS).toContain('ebp');
    expect(RUNG4_IDS).toContain('ofr-fsi');
    for (const phase of ['daily', 'daily-a', 'daily-b', 'periodic'] as const) {
      expect(historyPhaseIds(phase), `ebp must not ride phase '${phase}'`).not.toContain('ebp');
      expect(historyPhaseIds(phase), `ofr-fsi must not ride phase '${phase}'`).not.toContain('ofr-fsi');
    }
    expect(CARRY_FORWARD_IDS).toContain('ebp');
    expect(CARRY_FORWARD_IDS).toContain('ofr-fsi');
  });

  it('the definitions carry the credit pair exactly once each, context-only (G-5)', () => {
    const ebp = DEFINITIONS.find((d) => d.id === 'ebp')!;
    const ofr = DEFINITIONS.find((d) => d.id === 'ofr-fsi')!;
    expect(ebp.rule.kind).toBe('info');
    expect(ebp.group).toBe('market-stress');
    expect(ofr.rule.kind).toBe('info');
    expect(ofr.group).toBe('market-stress');
    expect(ebp.staleAfterDays).toBe(75);
    expect(ofr.staleAfterDays).toBe(7);
  });
});
