/**
 * insights-sweep.test.ts — the 2026-10-22 reliability round's intra-day
 * sweep rungs: the failure gate (sweepShouldFire), the rung minute wiring
 * (insightsIngestRung), and the gated runScheduledInsightsSweep flow
 * (one KV read on healthy days; the full re-run only on genuine failures).
 * Hermetic: KV is an in-memory fake, the ingest run is module-mocked.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const runInsightsUpdate = vi.hoisted(() =>
  vi.fn(async (opts: Record<string, unknown>) => {
    void opts; // the arg is captured via mock.calls below
    return {
      ok: true,
      snapshot: { generatedAt: '2026-10-22T10:10:20Z', readings: [] },
      series: {},
      p1Unavailable: [] as string[],
      heldP1: [] as string[],
      failedSources: [] as string[],
      reports: [] as unknown[],
      staged: true,
    };
  }));
const runInsightsHistoryPhase = vi.hoisted(() => vi.fn(async () => ({ ok: true, written: 0, unchanged: 0, singlePoint: 0, ids: [] })));

vi.mock('@currena/insights/ingest', () => ({
  runInsightsUpdate,
  runInsightsHistoryPhase,
  KvInsightsStore: class {},
  HIDDEN_PUBLIC_IDS: new Set<string>(),
}));

import {
  INGEST_SWEEP_STALE_MS,
  insightsIngestRung,
  runScheduledInsightsSweep,
  sweepShouldFire,
} from './insights-ingest-cron';

/** An in-memory KV fake (the insights:status key is all the gate reads). */
function fakeKv(initial: Record<string, string> = {}): KVNamespace {
  const store = new Map(Object.entries(initial));
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
  } as unknown as KVNamespace;
}

const NOW = new Date('2026-10-22T10:10:00Z');

describe('sweepShouldFire', () => {
  it('fires when a genuine fetch failure is recorded (the live 2026-10-22 status shape)', () => {
    const status = {
      generatedAt: '2026-10-22T04:10:18Z',
      sources: [
        { source: 'fred', ok: false, kind: 'failed' },
        { source: 'rba', ok: false, kind: 'disabled' }, // the venue-skip row — NOT a trigger
        { source: 'tgju', ok: true, kind: 'fetched' },
      ],
    };
    expect(sweepShouldFire(status, NOW)).toBe(true);
  });

  it('does NOT fire on a healthy rung (the disabled/manual rows are not failures)', () => {
    const status = {
      generatedAt: '2026-10-22T04:10:18Z',
      sources: [
        { source: 'fred', ok: true, kind: 'fetched' },
        { source: 'rba', ok: false, kind: 'disabled' },
        { source: 'manual', ok: true },
        { source: 'cross-check', ok: false }, // informational, no kind
      ],
    };
    expect(sweepShouldFire(status, NOW)).toBe(false);
  });

  it('fires when the status is stale (the main rung never landed — the sweep IS the ingest)', () => {
    const status = { generatedAt: '2026-10-21T04:10:18Z', sources: [{ source: 'fred', ok: true }] };
    expect(sweepShouldFire(status, NOW)).toBe(true); // 30h old > 10h bar
  });

  it('fires on a missing or malformed status', () => {
    expect(sweepShouldFire(undefined, NOW)).toBe(true);
    expect(sweepShouldFire({ generatedAt: 'garbage' }, NOW)).toBe(true);
  });

  it('the staleness bar is 10h (a dead 04:10 rung is caught by the 20:10 sweep at the latest)', () => {
    const age = INGEST_SWEEP_STALE_MS;
    expect(age).toBe(10 * 3_600_000);
    const fresh = { generatedAt: new Date(NOW.getTime() - 5 * 3_600_000).toISOString(), sources: [] };
    expect(sweepShouldFire(fresh, NOW)).toBe(false);
  });
});

describe('insightsIngestRung (the minute wiring)', () => {
  const at = (iso: string) => new Date(iso).getTime();
  it('the 04:xx rungs are unchanged', () => {
    expect(insightsIngestRung(at('2026-10-22T04:10:00Z'))).toEqual({ kind: 'main' });
    expect(insightsIngestRung(at('2026-10-22T04:25:00Z'))).toEqual({ kind: 'history-daily' });
    expect(insightsIngestRung(at('2026-10-22T04:40:00Z'))).toEqual({ kind: 'history-periodic' });
    expect(insightsIngestRung(at('2026-10-22T04:59:00Z'))).toBeUndefined();
  });
  it('the sweep rungs fire at 10:10 and 20:10 UTC', () => {
    expect(insightsIngestRung(at('2026-10-22T10:10:00Z'))).toEqual({ kind: 'sweep' });
    expect(insightsIngestRung(at('2026-10-22T20:10:00Z'))).toEqual({ kind: 'sweep' });
    expect(insightsIngestRung(at('2026-10-22T10:11:00Z'))).toBeUndefined();
    expect(insightsIngestRung(at('2026-10-22T20:09:00Z'))).toBeUndefined();
  });
});

describe('runScheduledInsightsSweep', () => {
  beforeEach(() => {
    runInsightsUpdate.mockClear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('a healthy status skips the sweep with exactly ONE KV read (no ingest run)', async () => {
    const healthy = {
      generatedAt: new Date(NOW.getTime() - 3_600_000).toISOString(),
      sources: [{ source: 'fred', ok: true, kind: 'fetched' }],
    };
    let reads = 0;
    const kv = {
      get: async (key: string) => {
        reads += 1;
        expect(key).toBe('insights:status');
        return JSON.stringify(healthy);
      },
      put: async () => {},
    } as unknown as KVNamespace;
    const outcome = await runScheduledInsightsSweep({ RATES: kv } as never);
    expect(outcome).toBe('skipped');
    expect(reads).toBe(1);
    expect(runInsightsUpdate).not.toHaveBeenCalled();
  });

  it('a failed status triggers the full ingest re-run in SWEEP mode', async () => {
    const failed = {
      generatedAt: '2026-10-22T04:10:18Z',
      sources: [{ source: 'fred', ok: false, kind: 'failed' }],
    };
    const kv = fakeKv({ 'insights:status': JSON.stringify(failed) });
    const outcome = await runScheduledInsightsSweep({ RATES: kv } as never);
    expect(outcome).toBe('ran');
    expect(runInsightsUpdate).toHaveBeenCalledTimes(1);
    const arg = runInsightsUpdate.mock.calls[0]![0] as { sweep?: boolean; mode: string };
    void arg;
    expect(arg.sweep).toBe(true);
    expect(arg.mode).toBe('scheduled');
  });
});
