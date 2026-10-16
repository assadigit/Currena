/**
 * The ingest watchdog tests (2026-10-16c) — every branch of the hourly
 * staleness check, hermetic: the KV binding is the in-memory fake, the
 * GitHub call is an injected fetch spy. No Workers, no live API.
 *
 * The branches: fresh → nothing; missing/malformed status counts as
 * maximally stale; stale + no token → the honest no-token log path;
 * stale + recent nudge → bounded (no machine-gunning); stale + token →
 * exactly one well-formed dispatch (URL, method, headers incl. the
 * User-Agent GitHub requires, body {"ref":"main"}); non-204 and network
 * throws → no marker, retried next rung; the marker only lands on an
 * ACCEPTED dispatch.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NUDGE_EVERY_HOURS,
  STALE_AFTER_HOURS,
  runIngestWatchdog,
} from './ingest-watchdog';

function makeKv(): { kv: KVNamespace; map: Map<string, string> } {
  const map = new Map<string, string>();
  const kv = {
    get: async (key: string): Promise<string | null> => map.get(key) ?? null,
    put: async (key: string, value: string): Promise<void> => {
      map.set(key, value);
    },
  } as unknown as KVNamespace;
  return { kv, map };
}

const NOW = Date.UTC(2026, 9, 16, 18, 40, 0);
const iso = (ms: number): string => new Date(ms).toISOString();

function statusKey(generatedAtMs: number): string {
  return JSON.stringify({ v: 1, generatedAt: iso(generatedAtMs), mode: 'scheduled' });
}

function fetch204(): typeof fetch {
  return vi.fn(async () => new Response(null, { status: 204 })) as unknown as typeof fetch;
}

let kv: KVNamespace;
let map: Map<string, string>;

beforeEach(() => {
  ({ kv, map } = makeKv());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the ingest watchdog (Worker-side self-heal for a silent schedule outage)', () => {
  it('a FRESH snapshot does nothing — zero writes, zero requests', async () => {
    map.set('insights:status', statusKey(NOW - 5 * 3_600_000)); // 5 h old
    const fetchFn = fetch204();

    const outcome = await runIngestWatchdog({ RATES: kv, GH_INGEST_DISPATCH_TOKEN: 't' }, { now: new Date(NOW), fetchFn });

    expect(outcome).toBe('fresh');
    expect(fetchFn).not.toHaveBeenCalled();
    expect(map.has('insights:ingest-nudge:v1')).toBe(false);
  });

  it('a MISSING status key counts as maximally stale → dispatches', async () => {
    const fetchFn = fetch204();

    const outcome = await runIngestWatchdog({ RATES: kv, GH_INGEST_DISPATCH_TOKEN: 't' }, { now: new Date(NOW), fetchFn });

    expect(outcome).toBe('dispatched');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('a MALFORMED status record counts as stale → dispatches', async () => {
    map.set('insights:status', '{not json');
    const fetchFn = fetch204();

    const outcome = await runIngestWatchdog({ RATES: kv, GH_INGEST_DISPATCH_TOKEN: 't' }, { now: new Date(NOW), fetchFn });

    expect(outcome).toBe('dispatched');
  });

  it('a stale snapshot dispatches EXACTLY the documented request and marks the nudge', async () => {
    map.set('insights:status', statusKey(NOW - (STALE_AFTER_HOURS + 4) * 3_600_000));
    const fetchFn = fetch204();

    const outcome = await runIngestWatchdog({ RATES: kv, GH_INGEST_DISPATCH_TOKEN: 'gh-token' }, { now: new Date(NOW), fetchFn });

    expect(outcome).toBe('dispatched');
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.github.com/repos/assadigit/Currena/actions/workflows/insights-ingest.yml/dispatches');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer gh-token');
    expect(headers.Accept).toBe('application/vnd.github+json');
    expect(headers['User-Agent']).toBe('currena-ingest-watchdog');
    expect(JSON.parse(String(init.body))).toEqual({ ref: 'main' });
    expect(Number(map.get('insights:ingest-nudge:v1'))).toBe(NOW);
  });

  it('a stale snapshot WITHOUT the token is the honest no-op — no request, no marker', async () => {
    map.set('insights:status', statusKey(NOW - (STALE_AFTER_HOURS + 4) * 3_600_000));
    const fetchFn = fetch204();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const outcome = await runIngestWatchdog({ RATES: kv }, { now: new Date(NOW), fetchFn });

    expect(outcome).toBe('no-token');
    expect(fetchFn).not.toHaveBeenCalled();
    expect(map.has('insights:ingest-nudge:v1')).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('GH_INGEST_DISPATCH_TOKEN is not set'));
    warn.mockRestore();
  });

  it('a recent nudge bounds the dispatching — no request while the marker is fresh', async () => {
    map.set('insights:status', statusKey(NOW - (STALE_AFTER_HOURS + 10) * 3_600_000));
    map.set('insights:ingest-nudge:v1', String(NOW - (NUDGE_EVERY_HOURS - 1) * 3_600_000));
    const fetchFn = fetch204();

    const outcome = await runIngestWatchdog({ RATES: kv, GH_INGEST_DISPATCH_TOKEN: 't' }, { now: new Date(NOW), fetchFn });

    expect(outcome).toBe('recent-nudge');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('an OLD nudge does not block a new dispatch', async () => {
    map.set('insights:status', statusKey(NOW - (STALE_AFTER_HOURS + 10) * 3_600_000));
    map.set('insights:ingest-nudge:v1', String(NOW - (NUDGE_EVERY_HOURS + 1) * 3_600_000));
    const fetchFn = fetch204();

    const outcome = await runIngestWatchdog({ RATES: kv, GH_INGEST_DISPATCH_TOKEN: 't' }, { now: new Date(NOW), fetchFn });

    expect(outcome).toBe('dispatched');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('a GitHub rejection (non-204) leaves NO marker — the next rung retries', async () => {
    map.set('insights:status', statusKey(NOW - (STALE_AFTER_HOURS + 4) * 3_600_000));
    const fetchFn = vi.fn(async () =>
      new Response('{"message":"Bad credentials"}', { status: 401 }),
    ) as unknown as typeof fetch;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const outcome = await runIngestWatchdog({ RATES: kv, GH_INGEST_DISPATCH_TOKEN: 't' }, { now: new Date(NOW), fetchFn });

    expect(outcome).toBe('dispatch-failed');
    expect(map.has('insights:ingest-nudge:v1')).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('HTTP 401'));
    warn.mockRestore();
  });

  it('a network throw is caught and logged — never a cron failure', async () => {
    map.set('insights:status', statusKey(NOW - (STALE_AFTER_HOURS + 4) * 3_600_000));
    const fetchFn = vi.fn(async () => {
      throw new Error('dns hiccup');
    }) as unknown as typeof fetch;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const outcome = await runIngestWatchdog({ RATES: kv, GH_INGEST_DISPATCH_TOKEN: 't' }, { now: new Date(NOW), fetchFn });

    expect(outcome).toBe('dispatch-failed');
    expect(map.has('insights:ingest-nudge:v1')).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('dispatch request failed'), expect.anything());
    warn.mockRestore();
  });
});
