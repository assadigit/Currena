/**
 * expectations.test.ts — GPE R28 / F24: the Fed-meeting expectations'
 * store + rung job's tests — the KV contract (the ONE key, the
 * zod-validated parse), the snapshot builder's display order, the
 * job's every branch (bootstrap write, the quiet no-op on identical
 * prices, the refresh write, the event-close ROLL, the last-good
 * failure branch that never discards a stored snapshot), and the REST
 * adapter's own round trip.
 *
 * The Kalshi leg is deliberately absent everywhere (S15-D1: the
 * Developer Agreement wording read — the card is one venue, honest).
 * Tests never hit live sites (AGENTS.md rule 7) — the fetch half
 * replays the s15 fixture through an injected fetchImpl.
 */

import { describe, expect, it } from 'vitest';
import type { GoldExpectationsSnapshot } from '@currena/core';
import { GoldExpectationsSnapshotSchema } from '@currena/core';
import discoveryFixture from '../../../fixtures/s15/polymarket-fomc-events-2026-11-19.json';
import { parseFedDecisionEvents } from './adapters/polymarket';
import {
  GOLD_EXPECTATIONS_KV_KEY,
  KvGoldExpectationsStore,
  RestGoldExpectationsStore,
  buildGoldExpectationsSnapshot,
  runGoldExpectationsIngest,
  type GoldExpectationsKv,
} from './expectations';

const NOW = new Date('2026-11-19T05:23:00Z');

/** The fixture-backed fetchImpl (the s15 discovery payload). */
const fixtureFetch = (async () =>
  new Response(JSON.stringify(discoveryFixture), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })) as typeof fetch;

/** The in-memory KV fake (the lbma test pattern). */
function memoryKv(seed?: Record<string, string>): GoldExpectationsKv & { map: Map<string, string> } {
  const map = new Map<string, string>(Object.entries(seed ?? {}));
  return {
    map,
    async get(key: string) {
      return map.get(key) ?? null;
    },
    async put(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe('the KV contract (the ONE key)', () => {
  it('the key is the insights:gold-expectations:v1 literal', () => {
    expect(GOLD_EXPECTATIONS_KV_KEY).toBe('insights:gold-expectations:v1');
  });

  it('parseStored: a poisoned payload is ignored (never garbage)', () => {
    const kv = memoryKv({ [GOLD_EXPECTATIONS_KV_KEY]: '{"v":1,"not":"the schema"}' });
    const store = new KvGoldExpectationsStore(kv);
    return expect(store.getGoldExpectations()).resolves.toBeUndefined();
  });

  it('parseStored: an absent key is undefined (the honest not-yet state)', () => {
    const store = new KvGoldExpectationsStore(memoryKv());
    return expect(store.getGoldExpectations()).resolves.toBeUndefined();
  });
});

describe('buildGoldExpectationsSnapshot (the wire contract)', () => {
  it('the markets render in the stable move order (hike50 → cut50), the schema validates', () => {
    const events = parseFedDecisionEvents(discoveryFixture);
    const dec = events.find((e) => e.slug.startsWith('fed-decision-in-december'))!;
    const snapshot = buildGoldExpectationsSnapshot(dec, NOW);
    expect(() => GoldExpectationsSnapshotSchema.parse(snapshot)).not.toThrow();
    expect(snapshot.source).toBe('polymarket');
    expect(snapshot.markets.map((m) => m.move)).toEqual([
      'hike50plus',
      'hike25',
      'hold',
      'cut25',
      'cut50plus',
    ]);
    expect(snapshot.event.slug).toBe('fed-decision-in-december-20260729232808632');
    expect(snapshot.event.url).toBe('https://polymarket.com/event/fed-decision-in-december-20260729232808632');
  });

  it('duplicate moves are refused by the wire contract (the dedup refine)', () => {
    expect(() =>
      GoldExpectationsSnapshotSchema.parse({
        v: 1,
        fetchedAt: NOW.toISOString(),
        source: 'polymarket',
        event: { slug: 's', title: 't', endDate: '2026-12-10T04:59:00Z', url: 'https://polymarket.com/event/s' },
        markets: [
          { move: 'hold', question: 'q1', slug: 'm1', yesPrice: 0.9 },
          { move: 'hold', question: 'q2', slug: 'm2', yesPrice: 0.1 },
        ],
      }),
    ).toThrow();
  });
});

describe('runGoldExpectationsIngest (the :23/:53 rung body)', () => {
  it('bootstrap: nothing stored → one fetch, one write, the snapshot lands', async () => {
    const kv = memoryKv();
    const result = await runGoldExpectationsIngest(new KvGoldExpectationsStore(kv), { fetchImpl: fixtureFetch, now: NOW });
    expect(result.outcome.ok).toBe(true);
    expect(result.kv).toEqual({ reads: 1, writes: 1 });
    expect(kv.map.get(GOLD_EXPECTATIONS_KV_KEY)).toBeDefined();
    expect(result.snapshot!.markets.length).toBe(5);
  });

  it('the quiet no-op: identical event + identical prices → no write', async () => {
    const first = await runGoldExpectationsIngest(new KvGoldExpectationsStore(memoryKv()), { fetchImpl: fixtureFetch, now: NOW });
    const kv = memoryKv({ [GOLD_EXPECTATIONS_KV_KEY]: JSON.stringify(first.snapshot) });
    const second = await runGoldExpectationsIngest(new KvGoldExpectationsStore(kv), { fetchImpl: fixtureFetch, now: new Date('2026-11-19T05:53:00Z') });
    expect(second.outcome.ok).toBe(true);
    expect(second.outcome.note).toContain('no change');
    expect(second.kv).toEqual({ reads: 1, writes: 0 });
    // The stored fetchedAt stays the FIRST run's stamp (the no-op never rewrites).
    expect(JSON.parse(kv.map.get(GOLD_EXPECTATIONS_KV_KEY)!).fetchedAt).toBe(first.snapshot!.fetchedAt);
  });

  it('the refresh write: a moved price → one write with the new stamp', async () => {
    const first = await runGoldExpectationsIngest(new KvGoldExpectationsStore(memoryKv()), { fetchImpl: fixtureFetch, now: NOW });
    const mutatedFetch = (async () =>
      new Response(
        JSON.stringify(
          (discoveryFixture as unknown[]).map((e) =>
            typeof e === 'object' && e !== null && (e as { slug?: string }).slug === first.snapshot!.event.slug
              ? {
                  ...(e as object),
                  markets: ((e as { markets?: unknown[] }).markets ?? []).map((m) =>
                    typeof m === 'object' && m !== null && /no change/i.test(String((m as { question?: string }).question ?? ''))
                      ? { ...(m as object), outcomePrices: '["0.03", "0.97"]' }
                      : m,
                  ),
                }
              : e,
          ),
        ),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )) as typeof fetch;
    const kv = memoryKv({ [GOLD_EXPECTATIONS_KV_KEY]: JSON.stringify(first.snapshot) });
    const second = await runGoldExpectationsIngest(new KvGoldExpectationsStore(kv), { fetchImpl: mutatedFetch, now: new Date('2026-11-19T05:53:00Z') });
    expect(second.outcome.ok).toBe(true);
    expect(second.kv.writes).toBe(1);
    expect(second.outcome.note).toContain('refreshed');
    const stored: GoldExpectationsSnapshot = JSON.parse(kv.map.get(GOLD_EXPECTATIONS_KV_KEY)!);
    expect(stored.markets.find((m) => m.move === 'hold')!.yesPrice).toBeCloseTo(0.03, 4);
  });

  it('the ROLL: the event slug changes → one write, the rolled note', async () => {
    const first = await runGoldExpectationsIngest(new KvGoldExpectationsStore(memoryKv()), { fetchImpl: fixtureFetch, now: NOW });
    // After the December event closes, the listing no longer carries it.
    const rolledFetch = (async () =>
      new Response(
        JSON.stringify((discoveryFixture as unknown[]).filter((e) => (e as { slug?: string }).slug !== first.snapshot!.event.slug)),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )) as typeof fetch;
    const kv = memoryKv({ [GOLD_EXPECTATIONS_KV_KEY]: JSON.stringify(first.snapshot) });
    const second = await runGoldExpectationsIngest(new KvGoldExpectationsStore(kv), { fetchImpl: rolledFetch, now: new Date('2026-12-11T05:23:00Z') });
    expect(second.outcome.ok).toBe(true);
    expect(second.outcome.note).toContain('rolled to fed-decision-in-january');
    expect(second.kv.writes).toBe(1);
    expect(second.snapshot!.event.slug).toBe('fed-decision-in-january-20260729233815502');
  });

  it('the failure branch NEVER discards the stored snapshot (the last-good discipline)', async () => {
    const first = await runGoldExpectationsIngest(new KvGoldExpectationsStore(memoryKv()), { fetchImpl: fixtureFetch, now: NOW });
    const kv = memoryKv({ [GOLD_EXPECTATIONS_KV_KEY]: JSON.stringify(first.snapshot) });
    const failingFetch = (async () => new Response('', { status: 500 })) as typeof fetch;
    const second = await runGoldExpectationsIngest(new KvGoldExpectationsStore(kv), { fetchImpl: failingFetch, now: NOW });
    expect(second.outcome.ok).toBe(false);
    if (second.outcome.ok === false) {
      expect(second.outcome.kind).toBe('failed');
    }
    expect(second.kv.writes).toBe(0);
    expect(second.snapshot).toEqual(first.snapshot); // kept, labelled by its own fetchedAt
    expect(kv.map.get(GOLD_EXPECTATIONS_KV_KEY)).toBe(JSON.stringify(first.snapshot));
  });

  it('a failure with NOTHING stored stays empty (the route serves the calm 503)', async () => {
    const kv = memoryKv();
    const failingFetch = (async () => new Response('', { status: 429 })) as typeof fetch;
    const result = await runGoldExpectationsIngest(new KvGoldExpectationsStore(kv), { fetchImpl: failingFetch, now: NOW });
    expect(result.outcome.ok).toBe(false);
    if (result.outcome.ok === false) {
      expect(result.outcome.kind).toBe('blocked');
    }
    expect(result.snapshot).toBeUndefined();
    expect(kv.map.size).toBe(0);
  });
});

describe('the REST adapter (the manual runner\'s landing lever)', () => {
  it('round-trips the snapshot through the KV REST API shapes', async () => {
    const events = parseFedDecisionEvents(discoveryFixture);
    const dec = events.find((e) => e.slug.startsWith('fed-decision-in-december'))!;
    const snapshot = buildGoldExpectationsSnapshot(dec, NOW);
    const seen: Array<{ method?: string; body?: string }> = [];
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      seen.push({ method: init?.method, body: typeof init?.body === 'string' ? init.body : undefined });
      if (init?.method === 'PUT') return new Response('{}', { status: 200 });
      return new Response(JSON.stringify(snapshot), { status: 200 });
    }) as typeof fetch;
    const store = new RestGoldExpectationsStore({ apiToken: 't', accountId: 'a', namespaceId: 'n', fetchImpl });
    expect(await store.getGoldExpectations()).toEqual(snapshot);
    expect(seen[0]!.method).toBeUndefined(); // the GET
    await store.writeGoldExpectations(snapshot);
    expect(seen[1]!.method).toBe('PUT');
    expect(JSON.parse(seen[1]!.body!)).toEqual(snapshot);
  });

  it('a 404 read is undefined (the key never written — the honest not-yet)', async () => {
    const fetchImpl = (async () => new Response('', { status: 404 })) as typeof fetch;
    const store = new RestGoldExpectationsStore({ apiToken: 't', accountId: 'a', namespaceId: 'n', fetchImpl });
    return expect(store.getGoldExpectations()).resolves.toBeUndefined();
  });

  it('a failing write throws with the status (never a silent no-op)', async () => {
    const events = parseFedDecisionEvents(discoveryFixture);
    const dec = events.find((e) => e.slug.startsWith('fed-decision-in-december'))!;
    const snapshot = buildGoldExpectationsSnapshot(dec, NOW);
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) =>
      init?.method === 'PUT' ? new Response('boom', { status: 500 }) : new Response('', { status: 404 })) as typeof fetch;
    const store = new RestGoldExpectationsStore({ apiToken: 't', accountId: 'a', namespaceId: 'n', fetchImpl });
    await expect(store.writeGoldExpectations(snapshot)).rejects.toThrow('HTTP 500');
  });
});
