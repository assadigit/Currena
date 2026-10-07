import type { RatesResponse, Snapshot } from '@currena/core';
import { InMemoryRateStore } from '@currena/scraper';
import type { RateStore } from '@currena/scraper';
import { beforeEach, describe, expect, it } from 'vitest';
import { humanizeAge, RatesService, RatesServiceError } from './rates-service';

const T0_MS = Date.parse('2026-09-16T12:00:00.000Z');
const SEC = 1000;
const MIN = 60 * SEC;

function tgjuSnapshot(fetchedAt: string): Snapshot {
  return {
    base: 'IRR',
    source: 'tgju',
    fetchedAt,
    rates: [
      { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 1, unit: 'TOMAN' },
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 / 230_500 },
    ],
  };
}

function frankfurterSnapshot(fetchedAt: string): Snapshot {
  return {
    base: 'USD',
    source: 'frankfurter',
    fetchedAt,
    rates: [
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.86678 },
    ],
  };
}

describe('RatesService ladder (in-memory store + fake scrapers)', () => {
  let clockMs = T0_MS;
  let store: InMemoryRateStore;
  let scrapeCalls: string[] = [];
  let snapshots: Record<string, Snapshot | Error>;

  beforeEach(() => {
    clockMs = T0_MS;
    store = new InMemoryRateStore(() => clockMs);
    scrapeCalls = [];
    snapshots = {
      tgju: tgjuSnapshot(new Date(clockMs).toISOString()),
      frankfurter: frankfurterSnapshot(new Date(clockMs).toISOString()),
    };
  });

  function makeService(): RatesService {
    return new RatesService({
      store,
      scrapers: {
        tgju: async () => {
          scrapeCalls.push('tgju');
          const snap = snapshots['tgju']!;
          if (snap instanceof Error) throw snap;
          return snap;
        },
        frankfurter: async () => {
          scrapeCalls.push('frankfurter');
          const snap = snapshots['frankfurter']!;
          if (snap instanceof Error) throw snap;
          return snap;
        },
      },
      now: () => new Date(clockMs),
    });
  }

  it('step 1 — fresh cache: serves from cache with zero network', async () => {
    await store.putSnapshot('tgju', tgjuSnapshot(new Date(T0_MS - 60 * SEC).toISOString()), 7 * 86_400);

    const res = await makeService().getRates('tgju');

    expect(res.servedFrom).toBe('cache');
    expect(res.stale).toBe(false);
    expect(res.notice).toBeUndefined();
    expect(scrapeCalls).toEqual([]); // ZERO network
  });

  it('step 2 — live scrape on cold cache: stores snapshot + updates status', async () => {
    const res = await makeService().getRates('tgju');

    expect(res.servedFrom).toBe('live');
    expect(res.stale).toBe(false);
    expect(scrapeCalls).toEqual(['tgju']);

    const stored = await store.getSnapshot('tgju');
    expect(stored?.base).toBe('IRR');

    const status = await store.getStatus('tgju');
    expect(status?.lastScrapeAt).toBe(new Date(T0_MS).toISOString());
    expect(status?.lastSuccessAt).toBe(new Date(T0_MS).toISOString());
    expect(typeof status?.lastDurationMs).toBe('number');
  });

  it('step 2 — second call right after a live scrape hits the fresh cache', async () => {
    const service = makeService();
    await service.getRates('tgju');
    const second = await service.getRates('tgju');

    expect(second.servedFrom).toBe('cache');
    expect(second.stale).toBe(false);
    expect(scrapeCalls).toEqual(['tgju']); // still exactly one scrape
  });

  it('step 2 failure → step 4 — no cache at all: 503 source_unavailable', async () => {
    snapshots['tgju'] = new Error('connection reset');

    await expect(makeService().getRates('tgju')).rejects.toBeInstanceOf(RatesServiceError);

    try {
      await makeService().getRates('tgju');
      expect.unreachable('must throw');
    } catch (err) {
      const e = err as RatesServiceError;
      expect(e.code).toBe('source_unavailable');
      expect(e.retryAfterSec).toBe(60);
    }

    const status = await store.getStatus('tgju');
    expect(status?.lastError?.code).toBe('scrape_failed');
    expect(status?.lastError?.message).toContain('connection reset');
  });

  it('step 2 failure → step 3 — stale cache served with notice', async () => {
    await store.putSnapshot('tgju', tgjuSnapshot(new Date(T0_MS - 400 * SEC).toISOString()), 7 * 86_400);
    snapshots['tgju'] = new Error('CF error 1042');

    const res = await makeService().getRates('tgju');

    expect(res.servedFrom).toBe('cache');
    expect(res.stale).toBe(true);
    expect(res.notice).toMatch(/^Using cached rates — last updated \d+ minutes? ago$/);
    expect(scrapeCalls).toEqual(['tgju']); // scrape WAS attempted, failed, fell through
  });

  // I12 (2026-10-07 incident, second measurement): frankfurter's fresh
  // window is 15 min, aligned with the quarter-hour cron refresh. The
  // 10.5-min-per-15-min fetch-context 500 windows existed because a
  // 5-min TTL let the snapshot go stale between cron ticks — every
  // request in those windows hit the lock path while KV writes were
  // failing from fetch context. With the aligned TTL, a quarter-hour-old
  // ECB snapshot is served from the FRESH-cache rung: zero lock, zero
  // scrape, no window.
  it('frankfurter fresh window (I12) — 12-min-old ECB snapshot still serves fresh-cache: no lock, no scrape', async () => {
    await store.putSnapshot(
      'frankfurter',
      frankfurterSnapshot(new Date(T0_MS - 12 * MIN).toISOString()),
      7 * 86_400,
    );

    const res = await makeService().getRates('frankfurter');

    expect(res.servedFrom).toBe('cache');
    expect(res.stale).toBe(false);
    expect(res.notice).toBeUndefined();
    expect(scrapeCalls).toEqual([]); // ZERO network — the incident window never opens
  });

  it('frankfurter fresh window boundary — past 15 min the honest stale ladder applies', async () => {
    await store.putSnapshot(
      'frankfurter',
      frankfurterSnapshot(new Date(T0_MS - 16 * MIN).toISOString()),
      7 * 86_400,
    );
    snapshots['frankfurter'] = new Error('ECB down');

    const res = await makeService().getRates('frankfurter');

    expect(res.servedFrom).toBe('cache');
    expect(res.stale).toBe(true);
    expect(res.notice).toBeDefined();
    expect(scrapeCalls).toEqual(['frankfurter']); // stale now — the live rung was honestly attempted
  });

  it('min-interval guard — lastScrapeAt < 60s ago: no scrape attempt', async () => {
    await store.putSnapshot('tgju', tgjuSnapshot(new Date(T0_MS - 400 * SEC).toISOString()), 7 * 86_400);
    await store.putStatus('tgju', {
      source: 'tgju',
      lastScrapeAt: new Date(T0_MS - 30 * SEC).toISOString(), // 30s ago
    });

    const res = await makeService().getRates('tgju');

    expect(scrapeCalls).toEqual([]); // guard blocked the scrape
    expect(res.servedFrom).toBe('cache');
    expect(res.stale).toBe(true);
  });

  it('min-interval guard with NO cache — still no scrape, then 503', async () => {
    await store.putStatus('tgju', {
      source: 'tgju',
      lastScrapeAt: new Date(T0_MS - 10 * SEC).toISOString(),
    });

    await expect(makeService().getRates('tgju')).rejects.toMatchObject({
      code: 'source_unavailable',
      retryAfterSec: 60,
    });
    expect(scrapeCalls).toEqual([]);
  });

  it('min-interval guard expires after 60s — scrape happens', async () => {
    await store.putSnapshot('tgju', tgjuSnapshot(new Date(T0_MS - 10 * MIN).toISOString()), 7 * 86_400);
    await store.putStatus('tgju', {
      source: 'tgju',
      lastScrapeAt: new Date(T0_MS - 61 * SEC).toISOString(),
    });

    const res = await makeService().getRates('tgju');
    expect(res.servedFrom).toBe('live');
    expect(scrapeCalls).toEqual(['tgju']);
  });

  it('single-flight lock — lock held by another request: no double scrape', async () => {
    await store.putSnapshot('tgju', tgjuSnapshot(new Date(T0_MS - 10 * MIN).toISOString()), 7 * 86_400);
    expect(await store.tryAcquireLock('tgju', 25)).not.toBe(false); // someone else is scraping

    const res = await makeService().getRates('tgju');
    expect(scrapeCalls).toEqual([]); // lock prevented a second in-flight scrape
    expect(res.servedFrom).toBe('cache');
    expect(res.stale).toBe(true);
  });

  it('single-flight lock with NO cache — 503 rather than double scrape', async () => {
    expect(await store.tryAcquireLock('tgju', 25)).not.toBe(false);

    await expect(makeService().getRates('tgju')).rejects.toMatchObject({ code: 'source_unavailable' });
    expect(scrapeCalls).toEqual([]);
  });

  it('concurrency stampede — two simultaneous cold getRates deduplicate to ONE scrape', async () => {
    // Real async interleaving (the exact scenario the lock exists for).
    let resolveScrape: ((snap: Snapshot) => void) | undefined;
    const slowService = new RatesService({
      store,
      scrapers: {
        tgju: () =>
          new Promise<Snapshot>((resolve) => {
            scrapeCalls.push('tgju');
            resolveScrape = resolve;
          }),
        frankfurter: async () => frankfurterSnapshot(new Date(clockMs).toISOString()),
      },
      now: () => new Date(clockMs),
      scrapeDeadlineMs: 0,
    });

    const first = slowService.getRates('tgju');
    const second = slowService.getRates('tgju');

    // Let both requests run through their pre-scrape awaits (getSnapshot →
    // getStatus → lock) before unblocking the winner's scraper.
    for (let i = 0; i < 20 && resolveScrape === undefined; i++) {
      await Promise.resolve();
    }
    resolveScrape!(tgjuSnapshot(new Date(clockMs).toISOString()));

    const [a, b] = await Promise.allSettled([first, second]);
    expect(a.status).toBe('fulfilled');
    expect((a as PromiseFulfilledResult<RatesResponse>).value.servedFrom).toBe('live');
    expect(b.status).toBe('rejected'); // cold cache + lock held → 503, never a 2nd scrape
    expect(scrapeCalls).toEqual(['tgju']); // EXACTLY one scrape
  });

  it('scrape deadline — a pathological chain falls through to stale cache, not minutes of latency', async () => {
    await store.putSnapshot('tgju', tgjuSnapshot(new Date(T0_MS - 10 * MIN).toISOString()), 7 * 86_400);

    const hungService = new RatesService({
      store,
      scrapers: {
        tgju: () => new Promise<Snapshot>(() => {}), // never settles
        frankfurter: async () => frankfurterSnapshot(new Date(clockMs).toISOString()),
      },
      now: () => new Date(clockMs),
      scrapeDeadlineMs: 20, // 20ms budget
    });

    const res = await hungService.getRates('tgju');
    expect(res.servedFrom).toBe('cache'); // stale fallback after the deadline
    expect(res.stale).toBe(true);

    // The failure was recorded in status for the ops console.
    const status = await store.getStatus('tgju');
    expect(status?.lastError?.message).toContain('deadline');
  });

  it('KV persist failure degrades gracefully — live data still served, no 500', async () => {
    // NB: explicit delegation — spreading a class instance drops prototype methods.
    const failingStore: RateStore = {
      getSnapshot: (source) => store.getSnapshot(source),
      putSnapshot: async () => {
        throw new Error('KV put failed');
      },
      getStatus: (source) => store.getStatus(source),
      putStatus: async () => {
        throw new Error('KV put failed');
      },
      tryAcquireLock: (source, ttlSec) => store.tryAcquireLock(source, ttlSec),
      releaseLock: (source, token) => store.releaseLock(source, token),
    };
    const service = new RatesService({
      store: failingStore,
      scrapers: {
        tgju: async () => tgjuSnapshot(new Date(clockMs).toISOString()),
        frankfurter: async () => frankfurterSnapshot(new Date(clockMs).toISOString()),
      },
      now: () => new Date(clockMs),
      scrapeDeadlineMs: 0,
    });

    const res = await service.getRates('tgju');
    expect(res.servedFrom).toBe('live'); // fresh data in hand → serve it anyway
    expect(res.stale).toBe(false);
  });

  it('lock release failure does not break the response (TTL reclaims)', async () => {
    const failingRelease: RateStore = {
      getSnapshot: (source) => store.getSnapshot(source),
      putSnapshot: (source, snapshot, ttlSec) => store.putSnapshot(source, snapshot, ttlSec),
      getStatus: (source) => store.getStatus(source),
      putStatus: (source, status) => store.putStatus(source, status),
      tryAcquireLock: (source, ttlSec) => store.tryAcquireLock(source, ttlSec),
      releaseLock: async () => {
        throw new Error('KV delete failed');
      },
    };
    const service = new RatesService({
      store: failingRelease,
      scrapers: {
        tgju: async () => tgjuSnapshot(new Date(clockMs).toISOString()),
        frankfurter: async () => frankfurterSnapshot(new Date(clockMs).toISOString()),
      },
      now: () => new Date(clockMs),
      scrapeDeadlineMs: 0,
    });

    const res = await service.getRates('tgju');
    expect(res.servedFrom).toBe('live');
  });

  it('force=true scrapes even when the cache is FRESH (refresh semantics)', async () => {
    await store.putSnapshot('tgju', tgjuSnapshot(new Date(T0_MS - 30 * SEC).toISOString()), 7 * 86_400);

    const res = await makeService().getRates('tgju', { force: true });
    expect(res.servedFrom).toBe('live');
    expect(res.stale).toBe(false);
    expect(scrapeCalls).toEqual(['tgju']);
  });

  it('force=true bypasses the min-interval guard (internal/refresh)', async () => {
    await store.putStatus('tgju', {
      source: 'tgju',
      lastScrapeAt: new Date(T0_MS - 5 * SEC).toISOString(), // way inside the interval
    });

    const res = await makeService().getRates('tgju', { force: true });
    expect(res.servedFrom).toBe('live');
    expect(scrapeCalls).toEqual(['tgju']);
  });

  it('step 4 — cache older than the 7-day hard TTL is NOT served', async () => {
    // Stored with a giant TTL so the STORE would still return it; the service's
    // own age check must refuse to serve an 8-day-old snapshot.
    await store.putSnapshot('tgju', tgjuSnapshot(new Date(T0_MS - 8 * 86_400 * SEC).toISOString()), 10 ** 9);
    snapshots['tgju'] = new Error('down');

    await expect(makeService().getRates('tgju')).rejects.toMatchObject({ code: 'source_unavailable' });
  });

  it('a scraper returning an INVALID snapshot is treated as a scrape failure', async () => {
    snapshots['tgju'] = { ...tgjuSnapshot(new Date(T0_MS).toISOString()), rates: [] } as unknown as Snapshot;

    await expect(makeService().getRates('tgju')).rejects.toMatchObject({ code: 'source_unavailable' });

    const status = await store.getStatus('tgju');
    expect(status?.lastError?.code).toBe('scrape_failed'); // zod error wrapped by errorToCodeMessage
  });

  it('keeps lastSuccessAt/lastError history across a later failure', async () => {
    const service = makeService();
    await service.getRates('tgju'); // success
    clockMs += 10 * MIN;
    snapshots['tgju'] = new Error('later outage');
    await service.getRates('tgju').catch(() => undefined); // failure

    const status = await store.getStatus('tgju');
    expect(status?.lastSuccessAt).toBe(new Date(T0_MS).toISOString()); // kept
    expect(status?.lastError?.message).toContain('later outage'); // recorded
  });

  it('sources are independent — frankfurter cache never serves a tgju request', async () => {
    await store.putSnapshot('frankfurter', frankfurterSnapshot(new Date(T0_MS).toISOString()), 7 * 86_400);

    const res = await makeService().getRates('frankfurter');
    expect(res.servedFrom).toBe('cache');
    expect(res.snapshot.base).toBe('USD');

    expect(scrapeCalls).toEqual([]);
  });

  // 2026-10-07 production incident: KV writes (lock puts) started failing
  // mid-afternoon — reads stayed healthy, a good 7-day snapshot sat in KV,
  // yet every stale-path /api/rates + /api/convert request escaped the
  // ladder as a raw 500. The ladder must degrade to its cached rungs.
  describe('store-failure degradation (2026-10-07 incident: KV writes dead, reads healthy)', () => {
    /** Explicit delegation — spreading a class instance drops prototype methods. */
    function makeStoreWith(overrides: Partial<RateStore>): RateStore {
      return {
        getSnapshot: (source) => store.getSnapshot(source),
        putSnapshot: (source, snapshot, ttlSec) => store.putSnapshot(source, snapshot, ttlSec),
        getStatus: (source) => store.getStatus(source),
        putStatus: (source, status) => store.putStatus(source, status),
        tryAcquireLock: (source, ttlSec) => store.tryAcquireLock(source, ttlSec),
        releaseLock: (source, token) => store.releaseLock(source, token),
        ...overrides,
      };
    }
    function makeServiceWith(storeOverride: RateStore): RatesService {
      return new RatesService({
        store: storeOverride,
        scrapers: {
          tgju: async () => {
            scrapeCalls.push('tgju');
            const snap = snapshots['tgju']!;
            if (snap instanceof Error) throw snap;
            return snap;
          },
          frankfurter: async () => {
            scrapeCalls.push('frankfurter');
            const snap = snapshots['frankfurter']!;
            if (snap instanceof Error) throw snap;
            return snap;
          },
        },
        now: () => new Date(clockMs),
        scrapeDeadlineMs: 0,
      });
    }

    it('lock-acquire failure (KV writes dead) → stale cache with notice, never a 500', async () => {
      await store.putSnapshot('tgju', tgjuSnapshot(new Date(T0_MS - 400 * SEC).toISOString()), 7 * 86_400);
      const noWrites = makeStoreWith({
        tryAcquireLock: async () => {
          throw new Error('KV put failed (write budget exhausted)');
        },
      });

      const res = await makeServiceWith(noWrites).getRates('tgju');

      expect(res.servedFrom).toBe('cache');
      expect(res.stale).toBe(true);
      expect(res.notice).toMatch(/^Using cached rates — last updated \d+ minutes? ago$/);
      expect(scrapeCalls).toEqual([]); // single-flight is a store guarantee — no lock, no scrape
    });

    it('status-read failure → skips the live rung, serves stale cache', async () => {
      await store.putSnapshot('tgju', tgjuSnapshot(new Date(T0_MS - 400 * SEC).toISOString()), 7 * 86_400);
      const noStatusReads = makeStoreWith({
        getStatus: async () => {
          throw new Error('KV get failed');
        },
      });

      const res = await makeServiceWith(noStatusReads).getRates('tgju');

      expect(res.servedFrom).toBe('cache');
      expect(res.stale).toBe(true);
      expect(scrapeCalls).toEqual([]);
    });

    it('snapshot-read failure with a working scraper → ladder continues and serves live', async () => {
      const noSnapshotReads = makeStoreWith({
        getSnapshot: async () => {
          throw new Error('KV get failed');
        },
      });

      const res = await makeServiceWith(noSnapshotReads).getRates('tgju');

      expect(res.servedFrom).toBe('live'); // cache treated as absent, scrape succeeded
      expect(scrapeCalls).toEqual(['tgju']);
    });

    it('snapshot-read failure + scrape failure + no cache → honest 503 RatesServiceError, not a raw store error', async () => {
      snapshots['tgju'] = new Error('upstream down');
      const noSnapshotReads = makeStoreWith({
        getSnapshot: async () => {
          throw new Error('KV get failed');
        },
      });

      await expect(makeServiceWith(noSnapshotReads).getRates('tgju')).rejects.toBeInstanceOf(
        RatesServiceError,
      );
    });

    it('forced refresh still scrapes when only the status read fails', async () => {
      const noStatusReads = makeStoreWith({
        getStatus: async () => {
          throw new Error('KV get failed');
        },
      });

      const res = await makeServiceWith(noStatusReads).getRates('tgju', { force: true });

      expect(res.servedFrom).toBe('live');
      expect(scrapeCalls).toEqual(['tgju']);
    });

    it('incident replay — writes dead + fresh-cache miss → stale-cache rung (the exact 19:57 UTC sequence)', async () => {
      // Snapshot 5+ min old (fresh TTL expired), status says a scrape is due,
      // but every KV write fails: the cache must still be served.
      await store.putSnapshot('tgju', tgjuSnapshot(new Date(T0_MS - 400 * SEC).toISOString()), 7 * 86_400);
      await store.putStatus('tgju', {
        source: 'tgju',
        lastScrapeAt: new Date(T0_MS - 10 * MIN).toISOString(),
      });
      const writesDead = makeStoreWith({
        tryAcquireLock: async () => {
          throw new Error('KV put failed');
        },
        putStatus: async () => {
          throw new Error('KV put failed');
        },
        putSnapshot: async () => {
          throw new Error('KV put failed');
        },
      });

      const res = await makeServiceWith(writesDead).getRates('tgju');

      expect(res.servedFrom).toBe('cache');
      expect(res.stale).toBe(true);
      expect(res.notice).toBeDefined();
      expect(scrapeCalls).toEqual([]);
    });
  });

  it('status() reports per-source status + cache age/freshness', async () => {
    const service = makeService();
    await service.getRates('tgju'); // populates cache + status

    const report = await service.status();
    expect(report.now).toBe(new Date(T0_MS).toISOString());
    expect(report.sources).toHaveLength(2);

    const tgju = report.sources.find((s) => s.source === 'tgju');
    expect(tgju?.status?.lastSuccessAt).toBeDefined();
    expect(tgju?.cache.present).toBe(true);
    expect(tgju?.cache.fresh).toBe(true);
    expect(tgju?.cache.ageSec).toBe(0);

    const frankfurter = report.sources.find((s) => s.source === 'frankfurter');
    expect(frankfurter?.cache.present).toBe(false);
    expect(frankfurter?.cache.fresh).toBe(false);
    expect(frankfurter?.status).toBeUndefined();
  });
});

describe('humanizeAge', () => {
  it('formats seconds, minutes, hours and days', () => {
    expect(humanizeAge(45)).toBe('45 seconds');
    expect(humanizeAge(59)).toBe('59 seconds');
    expect(humanizeAge(60)).toBe('1 minute');
    expect(humanizeAge(300)).toBe('5 minutes');
    expect(humanizeAge(3_600)).toBe('1 hour');
    expect(humanizeAge(7_200)).toBe('2 hours');
    expect(humanizeAge(86_400)).toBe('1 day');
    expect(humanizeAge(5 * 86_400)).toBe('5 days');
  });
});
