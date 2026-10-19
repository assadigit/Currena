/**
 * insights-mitigations.test.ts — RULES.md §3 M-2/M-3/M-4/M-5 at the ROUTE level
 * (T-24 + U-14-API):
 *
 *   M-5 the panic switch (PANIC_PRIVATE / the KV runtime override /
 *      ACCESS_MODE / the legacy SITE_MODE) gating every Insights data endpoint
 *      through the EXISTING password session — plus POST /api/insights/mode,
 *      the owner's minutes-level flip.
 *   M-3 the owner token (INSIGHTS_OWNER_TOKEN) + the owner-only full export
 *      (GET /api/insights/export?format=md|csv|json) + the owner session
 *      cookie endpoint.
 *   M-4 rate limiting on every Insights data GET (a separate 120-burst /
 *      60-per-minute bucket — generous for the SPA, hostile to bulk copying).
 *   M-2 public-mode data minimisation: the bounded public history for
 *      L2-but-public-ok ids, and the trimmed public status document.
 *
 * All requests ride the real createApp with in-memory stores + a writable,
 * counting KV fake for the access-mode key — no Workers, no live sites.
 */

import type {
  IndicatorHistory,
  IndicatorId,
  InsightsSnapshot,
  InsightsStatus,
  LivePricesSnapshot,
} from '@currena/core';
import { InMemoryInsightsStore } from '@currena/insights/store';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp, type Bindings } from '../index';
import { ACCESS_MODE_KV_KEY, __resetAccessModeMemoForTests } from '../access-mode';
import { INSIGHTS_SESSION_COOKIE, sessionTokenFor } from '../insights-auth';
import { INSIGHTS_OWNER_COOKIE } from '../owner-auth';
import { __resetRateLimiterForTests } from '../security';

/* ------------------------------- constants -------------------------------- */

const PASSWORD = 'mitigations-test-password';
const OWNER_TOKEN = 'mitigations-test-owner-token';

/* ------------------------- contract-valid fixtures ------------------------- */

const snapshot: InsightsSnapshot = {
  generatedAt: '2026-10-12T04:20:00.000Z',
  summary: {
    global: { section: 'global', label: 'cautious', warningCount: 1, votingCount: 11, excludedCount: 1 },
    australia: { section: 'australia', label: 'relaxed', warningCount: 0, votingCount: 6, excludedCount: 2 },
  },
  readings: [
    {
      id: 'brent',
      value: 107.14,
      asOf: '2026-10-12',
      status: 'normal',
      peak: { value: 128.5, date: '2022-03-07', basis: 'daily-close' },
      sourceName: 'FRED (DCOILBRENTEU)',
      sourceUrl: 'https://fred.stlouisfed.org/series/DCOILBRENTEU',
      updatedAt: '2026-10-12T12:13:00.000Z',
    },
    {
      id: 'us10y',
      value: 3.9,
      asOf: '2026-10-06',
      status: 'normal',
      sourceName: 'FRED (DGS10)',
      sourceUrl: 'https://fred.stlouisfed.org/series/DGS10',
      updatedAt: '2026-10-07T04:20:00.000Z',
    },
    {
      id: 'ecb-dfr',
      value: 3.5,
      asOf: '2026-09-30',
      status: 'stale',
      sourceName: 'ECB Data Portal',
      updatedAt: '2026-10-01T04:20:00.000Z',
    },
    {
      id: 'vix',
      value: 20.1,
      asOf: '2026-10-10',
      status: 'normal',
      sourceName: 'FRED (VIXCLS)',
      sourceUrl: 'https://fred.stlouisfed.org/series/VIXCLS',
      updatedAt: '2026-10-11T04:20:00.000Z',
    },
  ],
  changedThisWeek: [],
  calendar: [],
  ruleVersion: 2,
};

/** brent: 500 consecutive daily points → the public 400-day bound bites at 400. */
const brentHistory: IndicatorHistory = {
  v: 1,
  id: 'brent',
  points: Array.from({ length: 500 }, (_, i) => [19000 + i, 60 + i * 0.1] as [number, number]),
};
const us10yHistory: IndicatorHistory = { v: 1, id: 'us10y', points: [[19723, 3.88], [19730, 3.97]] };

const status: InsightsStatus = {
  v: 1,
  generatedAt: '2026-10-12T04:21:00.000Z',
  mode: 'scheduled',
  dryRun: false,
  sources: [
    { source: 'fred', ok: true, detail: '10/10 series' },
    { source: 'gold-api', ok: false, detail: 'HTTP 429 blocked — upstream https://goldapi.io refused' },
  ],
  validation: [
    { test: 'T-01', name: 'sanity ranges', ok: true, flagged: [], failures: [] },
    { test: 'T-02', name: 'duplicate check', ok: false, flagged: ['ecb-dfr'], failures: ['duplicate monthly value'] },
  ],
  ruleVersion: 2,
};

/* ------------------------------ envs + helpers ----------------------------- */

/**
 * A writable, counting KVNamespace fake. Only the access-mode key rides it
 * (the readers are injected), so get/put counts == access-mode-key traffic.
 */
function makeKv(initial: string | null = null) {
  const store = new Map<string, string>();
  if (initial !== null) store.set(ACCESS_MODE_KV_KEY, initial);
  let gets = 0;
  let puts = 0;
  return {
    env: {
      get: async (key: string): Promise<string | null> => {
        gets++;
        return store.get(key) ?? null;
      },
      put: async (key: string, value: string): Promise<void> => {
        puts++;
        store.set(key, value);
      },
    } as unknown as KVNamespace,
    counts: { get reads() { return gets; }, get writes() { return puts; } },
    value: () => store.get(ACCESS_MODE_KV_KEY) ?? null,
  };
}

/** The PUBLIC-mode reader contract: the projection keys, never the private doc. */
function publicReader(store: InMemoryInsightsStore) {
  const publicSnapshot: InsightsSnapshot = {
    ...snapshot,
    readings: snapshot.readings.filter((r) => r.id !== 'vix'),
    displayMode: 'public',
  };
  return {
    getSnapshot: () => store.getPublicSnapshot(),
    getPublicSnapshot: () => store.getPublicSnapshot(),
    getHistory: (id: IndicatorId) => store.getHistory(id),
    getStatus: () => store.getStatus(),
    getArchive: (date: string) => store.getPublicArchive(date),
    getPublicArchive: (date: string) => store.getPublicArchive(date),
    __publicSnapshot: publicSnapshot,
  };
}

/** The flat headers record for a signed session cookie (callers wrap it in
 * `headers:` inside their RequestInit — postMode already does). */
async function authedCookieHeader(): Promise<Record<string, string>> {
  const { token } = await sessionTokenFor(PASSWORD, Date.now());
  return { cookie: `${INSIGHTS_SESSION_COOKIE}=${token}` };
}

function bearerHeader(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

/** The full M-5 gated surface. */
const DATA_GETS = [
  '/api/insights',
  '/api/insights/markets',
  '/api/insights/fx',
  '/api/insights/status',
  '/api/insights/archive/2026-10-12',
  '/api/insights/us10y/history',
];

beforeEach(() => {
  __resetRateLimiterForTests();
  __resetAccessModeMemoForTests();
});

/* ==================================================================== *
 * M-5 — the panic switch
 * ==================================================================== */

describe('M-5 the panic switch (T-24)', () => {
  it('PANIC_PRIVATE=true forces private: EVERY data endpoint 401s with the neutral envelope, even with SITE_MODE=public', async () => {
    const kv = makeKv();
    const store = new InMemoryInsightsStore();
    await store.putSnapshot(snapshot);
    const app = createApp({ makeInsightsReader: () => store });
    const env: Bindings = {
      RATES: kv.env,
      SITE_MODE: 'public',
      INSIGHTS_PASSWORD: PASSWORD,
      PANIC_PRIVATE: 'true',
    };
    for (const path of DATA_GETS) {
      const res = await app.request(path, undefined, env);
      expect(res.status, path).toBe(401);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code, path).toBe('private_page');
      expect(res.headers.get('cache-control')).toBe('no-store');
      expect(JSON.stringify(body)).not.toContain('brent');
      expect(JSON.stringify(body)).not.toContain('ruleVersion');
    }
  });

  it('a KV override to private gates the data endpoints with NO env change (the minutes-level switch)', async () => {
    const kv = makeKv('private');
    const store = new InMemoryInsightsStore();
    await store.putSnapshot(snapshot);
    const app = createApp({ makeInsightsReader: () => store });
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public', INSIGHTS_PASSWORD: PASSWORD };
    for (const path of DATA_GETS) {
      const res = await app.request(path, undefined, env);
      expect(res.status, path).toBe(401);
    }
  });

  it('ACCESS_MODE=private (the deploy-time var) gates the data endpoints', async () => {
    const kv = makeKv();
    const store = new InMemoryInsightsStore();
    await store.putSnapshot(snapshot);
    const app = createApp({ makeInsightsReader: () => store });
    const env: Bindings = {
      RATES: kv.env,
      SITE_MODE: 'public',
      ACCESS_MODE: 'private',
      INSIGHTS_PASSWORD: PASSWORD,
    };
    for (const path of DATA_GETS) {
      const res = await app.request(path, undefined, env);
      expect(res.status, path).toBe(401);
    }
  });

  it('SITE_MODE=public with no PANIC/ACCESS_MODE/KV stays public (the default deployment)', async () => {
    const kv = makeKv();
    const store = new InMemoryInsightsStore();
    await store.putSnapshot(snapshot);
    const app = createApp({ makeInsightsReader: () => store });
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public' };
    const res = await app.request('/api/insights', undefined, env);
    expect(res.status).toBe(200);
  });

  it('the panic gate reuses the EXISTING password session: login unlocks the endpoints under PANIC_PRIVATE', async () => {
    const kv = makeKv();
    const store = new InMemoryInsightsStore();
    await store.putSnapshot(snapshot);
    const app = createApp({ makeInsightsReader: () => store });
    const env: Bindings = {
      RATES: kv.env,
      SITE_MODE: 'public',
      INSIGHTS_PASSWORD: PASSWORD,
      PANIC_PRIVATE: 'true',
    };
    const login = await app.request(
      '/api/insights/login',
      { method: 'POST', body: JSON.stringify({ password: PASSWORD }) },
      env,
    );
    expect(login.status).toBe(200);
    const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]!;
    const authed = await app.request('/api/insights', { headers: { cookie } }, env);
    expect(authed.status).toBe(200);
    expect(authed.headers.get('cache-control')).toBe('private, no-store');
  });

  it('the 60s KV memo is honoured: two requests → ONE access-mode KV read', async () => {
    const kv = makeKv('private');
    const store = new InMemoryInsightsStore();
    await store.putSnapshot(snapshot);
    const app = createApp({ makeInsightsReader: () => store });
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public', INSIGHTS_PASSWORD: PASSWORD };
    await app.request('/api/insights', undefined, env);
    await app.request('/api/insights/us10y/history', undefined, env);
    expect(kv.counts.reads).toBe(1);
  });
});

/* ==================================================================== *
 * M-5 — POST /api/insights/mode (the owner's runtime switch)
 * ==================================================================== */

describe('POST /api/insights/mode (M-5 runtime switch)', () => {
  function modeEnv(kv: ReturnType<typeof makeKv>, extra: Partial<Bindings> = {}): Bindings {
    return { RATES: kv.env, SITE_MODE: 'public', INSIGHTS_PASSWORD: PASSWORD, ...extra };
  }

  async function postMode(
    app: ReturnType<typeof createApp>,
    env: Bindings,
    body: unknown,
    headers: Record<string, string> = {},
  ) {
    return app.request('/api/insights/mode', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers,
    }, env);
  }

  it('401 owner_auth_required without any owner credential (token configured)', async () => {
    const kv = makeKv();
    const app = createApp({ makeInsightsReader: () => new InMemoryInsightsStore() });
    const res = await postMode(app, modeEnv(kv, { INSIGHTS_OWNER_TOKEN: OWNER_TOKEN }), { mode: 'private' });
    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('owner_auth_required');
    expect(kv.value()).toBeNull(); // nothing was written
  });

  it('403 owner_disabled when INSIGHTS_OWNER_TOKEN is unset and no session exists (fail closed)', async () => {
    const kv = makeKv();
    const app = createApp({ makeInsightsReader: () => new InMemoryInsightsStore() });
    const res = await postMode(app, modeEnv(kv), { mode: 'private' });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('owner_disabled');
  });

  it('200 with the owner bearer: writes the KV override and returns {mode}; the flip is IMMEDIATE (no 60s blind window)', async () => {
    const kv = makeKv();
    const store = new InMemoryInsightsStore();
    await store.putSnapshot(snapshot);
    const app = createApp({ makeInsightsReader: () => store });
    const env = modeEnv(kv, { INSIGHTS_OWNER_TOKEN: OWNER_TOKEN });

    const panic = await postMode(app, env, { mode: 'private' }, bearerHeader(OWNER_TOKEN));
    expect(panic.status).toBe(200);
    expect(((await panic.json()) as { mode: string }).mode).toBe('private');
    expect(panic.headers.get('cache-control')).toBe('no-store');
    expect(kv.value()).toBe('private');
    expect(kv.counts.writes).toBe(1);

    // The very next request is gated (the memo was primed by the write).
    const denied = await app.request('/api/insights', undefined, env);
    expect(denied.status).toBe(401);

    // And the switch back is equally immediate — recovery needs no redeploy.
    const back = await postMode(app, env, { mode: 'public' }, bearerHeader(OWNER_TOKEN));
    expect(back.status).toBe(200);
    expect(kv.value()).toBe('public');
    const open = await app.request('/api/insights', undefined, env);
    expect(open.status).toBe(200);
  });

  it('200 with the EXISTING password session cookie (owner token unset — the password still unlocks the switch)', async () => {
    const kv = makeKv();
    const app = createApp({ makeInsightsReader: () => new InMemoryInsightsStore() });
    const env = modeEnv(kv); // no INSIGHTS_OWNER_TOKEN
    const res = await postMode(app, env, { mode: 'private' }, await authedCookieHeader());
    expect(res.status).toBe(200);
    expect(kv.value()).toBe('private');
  });

  it('a wrong bearer is refused with the same 401 as no bearer (no hints)', async () => {
    const kv = makeKv();
    const app = createApp({ makeInsightsReader: () => new InMemoryInsightsStore() });
    const env = modeEnv(kv, { INSIGHTS_OWNER_TOKEN: OWNER_TOKEN });
    const res = await postMode(app, env, { mode: 'private' }, bearerHeader('wrong-token'));
    expect(res.status).toBe(401);
    expect(kv.value()).toBeNull();
  });

  it('400 for an invalid body (validate-mode: only public|private)', async () => {
    const kv = makeKv();
    const app = createApp({ makeInsightsReader: () => new InMemoryInsightsStore() });
    const env = modeEnv(kv, { INSIGHTS_OWNER_TOKEN: OWNER_TOKEN });
    for (const body of [{ mode: 'banana' }, {}, { mode: 'PRIVATE' }, 'garbage']) {
      const res = await postMode(app, env, body, bearerHeader(OWNER_TOKEN));
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(((await res.json()) as { error: { code: string } }).error.code).toBe('invalid_mode');
    }
  });

  it('rate limited: a burst beyond the standard bucket gets 429 + Retry-After', async () => {
    const kv = makeKv();
    const app = createApp({ makeInsightsReader: () => new InMemoryInsightsStore() });
    const env = modeEnv(kv, { INSIGHTS_OWNER_TOKEN: OWNER_TOKEN });
    let saw429 = false;
    for (let i = 0; i < 30; i++) {
      const res = await postMode(app, env, { mode: 'private' }, bearerHeader(OWNER_TOKEN));
      if (res.status === 429) {
        saw429 = true;
        expect(res.headers.get('retry-after')).toBeDefined();
        break;
      }
      expect(res.status).toBe(200);
    }
    expect(saw429).toBe(true);
  });
});

/* ==================================================================== *
 * M-3 — the owner-only export + owner session
 * ==================================================================== */

describe('GET /api/insights/export (M-3 owner-only full export)', () => {
  function makeExportApp(kv: ReturnType<typeof makeKv> = makeKv()) {
    const store = new InMemoryInsightsStore();
    return { store, app: createApp({ makeInsightsReader: () => store }), kv };
  }

  it('401 owner_auth_required without a token (secret configured); no data in the body', async () => {
    const { store, app, kv } = makeExportApp();
    await store.putSnapshot(snapshot);
    const env: Bindings = {
      RATES: kv.env,
      SITE_MODE: 'public',
      INSIGHTS_OWNER_TOKEN: OWNER_TOKEN,
    };
    const res = await app.request('/api/insights/export', undefined, env);
    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('owner_auth_required');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('403 owner_disabled when INSIGHTS_OWNER_TOKEN is unset (the export is disabled, fail closed)', async () => {
    const { store, app, kv } = makeExportApp();
    await store.putSnapshot(snapshot);
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public' };
    const res = await app.request('/api/insights/export', undefined, env);
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('owner_disabled');
  });

  it('200 with the bearer: an attachment (md), no-store, carrying the E-23 columns', async () => {
    const { store, app, kv } = makeExportApp();
    await store.putSnapshot(snapshot);
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public', INSIGHTS_OWNER_TOKEN: OWNER_TOKEN };
    const res = await app.request('/api/insights/export?format=md', { headers: bearerHeader(OWNER_TOKEN) }, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toBe(
      'attachment; filename="currena-insights-full-2026-10-12.md"',
    );
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-robots-tag')).toContain('noindex');
    const md = await res.text();
    // The E-23 columns appear (level / ownerAccepts / enabled spot-check).
    expect(md).toContain('ownerAccepts');
    expect(md).toContain('enabled');
    expect(md).toContain('L2');
    // Real values from the private snapshot + the audit sidecar ride the file.
    expect(md).toContain('brent');
    expect(md).toContain('107.14');
    expect(md).toContain('No reuse licence offered (unofficial endpoints)');
    expect(md).toContain('"kind":"change"'); // the rule JSON verbatim
  });

  it('format=csv → BOM + CRLF attachment; format=json → the document as JSON', async () => {
    const { store, app, kv } = makeExportApp();
    await store.putSnapshot(snapshot);
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public', INSIGHTS_OWNER_TOKEN: OWNER_TOKEN };

    const csv = await app.request('/api/insights/export?format=csv', { headers: bearerHeader(OWNER_TOKEN) }, env);
    expect(csv.status).toBe(200);
    expect(csv.headers.get('content-disposition')).toContain('.csv"');
    // UTF-8 BOM (Excel on every locale decodes it) — checked on the RAW
    // BYTES: fetch's text() strips a leading BOM, so the string compare can
    // never see it.
    const bom = new Uint8Array(await csv.arrayBuffer());
    expect([bom[0], bom[1], bom[2]]).toEqual([0xef, 0xbb, 0xbf]);

    const json = await app.request('/api/insights/export?format=json', { headers: bearerHeader(OWNER_TOKEN) }, env);
    expect(json.status).toBe(200);
    const doc = (await json.json()) as { sections: { key: string }[] };
    expect(doc.sections.map((s) => s.key)).toContain('indicators');
  });

  it('400 for an unknown format', async () => {
    const { store, app, kv } = makeExportApp();
    await store.putSnapshot(snapshot);
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public', INSIGHTS_OWNER_TOKEN: OWNER_TOKEN };
    const res = await app.request('/api/insights/export?format=xlsx', { headers: bearerHeader(OWNER_TOKEN) }, env);
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('invalid_export_format');
  });

  it('serves the CURRENT PRIVATE snapshot even in a public-mode deployment (the projection never reduces the owner export)', async () => {
    const kv = makeKv();
    const store = new InMemoryInsightsStore();
    const reader = publicReader(store);
    await store.putSnapshot(snapshot); // the private document (with vix)
    await store.putPublicSnapshot(reader.__publicSnapshot); // the public projection (no vix)
    const app = createApp({
      makeInsightsReader: () => reader as never,
      makeExportReader: () => store, // the export reads the PRIVATE document
    });
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public', INSIGHTS_OWNER_TOKEN: OWNER_TOKEN };

    const page = await app.request('/api/insights', undefined, env);
    const pageBody = (await page.json()) as InsightsSnapshot;
    expect(pageBody.readings.some((r) => r.id === 'vix')).toBe(false); // the public projection

    const exportRes = await app.request('/api/insights/export', { headers: bearerHeader(OWNER_TOKEN) }, env);
    const exportBody = await exportRes.text();
    expect(exportRes.status).toBe(200);
    expect(exportBody).toContain('vix'); // the owner's export keeps the private-only row
  });

  it('the owner SESSION cookie unlocks the export too (the web menu flow)', async () => {
    const { store, app, kv } = makeExportApp();
    await store.putSnapshot(snapshot);
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public', INSIGHTS_OWNER_TOKEN: OWNER_TOKEN };
    const session = await app.request('/api/insights/owner/session', {
      method: 'POST',
      headers: bearerHeader(OWNER_TOKEN),
    }, env);
    expect(session.status).toBe(200);
    const cookie = (session.headers.get('set-cookie') ?? '').split(';')[0]!;
    const res = await app.request('/api/insights/export', { headers: { cookie } }, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toContain('attachment');
  });

  it('rate limited: a burst beyond the standard bucket gets 429', async () => {
    const { store, app, kv } = makeExportApp();
    await store.putSnapshot(snapshot);
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public', INSIGHTS_OWNER_TOKEN: OWNER_TOKEN };
    let saw429 = false;
    for (let i = 0; i < 30; i++) {
      const res = await app.request('/api/insights/export', { headers: bearerHeader(OWNER_TOKEN) }, env);
      if (res.status === 429) {
        saw429 = true;
        expect(res.headers.get('retry-after')).toBeDefined();
        break;
      }
      expect(res.status).toBe(200);
    }
    expect(saw429).toBe(true);
  });
});

describe('POST /api/insights/owner/session (M-3, U-14-API)', () => {
  it('verifies the bearer and sets a signed HttpOnly 12h cookie; returns {ok:true}', async () => {
    const kv = makeKv();
    const app = createApp({ makeInsightsReader: () => new InMemoryInsightsStore() });
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public', INSIGHTS_OWNER_TOKEN: OWNER_TOKEN };
    const res = await app.request('/api/insights/owner/session', {
      method: 'POST',
      headers: bearerHeader(OWNER_TOKEN),
    }, env);
    expect(res.status).toBe(200);
    expect(((await res.json()) as { ok: boolean }).ok).toBe(true);
    const cookie = res.headers.get('set-cookie') ?? '';
    expect(cookie).toContain(`${INSIGHTS_OWNER_COOKIE}=`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Max-Age=43200');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('a WRONG bearer gets 401 owner_auth_required and no cookie', async () => {
    const kv = makeKv();
    const app = createApp({ makeInsightsReader: () => new InMemoryInsightsStore() });
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public', INSIGHTS_OWNER_TOKEN: OWNER_TOKEN };
    const res = await app.request('/api/insights/owner/session', {
      method: 'POST',
      headers: bearerHeader('not-the-token'),
    }, env);
    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('owner_auth_required');
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('403 owner_disabled when the secret is unset (fail closed)', async () => {
    const kv = makeKv();
    const app = createApp({ makeInsightsReader: () => new InMemoryInsightsStore() });
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public' };
    const res = await app.request('/api/insights/owner/session', {
      method: 'POST',
      headers: bearerHeader('anything'),
    }, env);
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('owner_disabled');
  });
});

/* ==================================================================== *
 * M-4 — rate limiting on every Insights data GET
 * ==================================================================== */

describe('M-4 the insights-data token bucket (120 burst / 60 per minute)', () => {
  function publicDataApp(kv: ReturnType<typeof makeKv> = makeKv()) {
    const store = new InMemoryInsightsStore();
    return { store, app: createApp({ makeInsightsReader: () => store }), kv };
  }

  it('a bulk burst: the first 120 requests pass, the 121st gets 429 + Retry-After', async () => {
    const { store, app, kv } = publicDataApp();
    await store.putSnapshot(snapshot);
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public' };
    let fourTwoNine: number | null = null;
    for (let i = 1; i <= 130; i++) {
      const res = await app.request('/api/insights', undefined, env);
      if (i <= 120) {
        expect(res.status, `request ${i}`).toBe(200);
      } else if (fourTwoNine === null && res.status === 429) {
        fourTwoNine = i;
        expect(res.headers.get('retry-after')).toBeDefined();
        expect(((await res.json()) as { error: { code: string } }).error.code).toBe('rate_limited');
      }
    }
    expect(fourTwoNine).toBe(121);
  });

  it('a normal page-load pattern (10 requests, mixed 200/304/404) never hits the limit', async () => {
    const { store, app, kv } = publicDataApp();
    await store.putSnapshot(snapshot);
    await store.putHistory(us10yHistory);
    await store.putStatus(status);
    await store.putArchive('2026-10-12', snapshot);
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public' };
    const etag = (await app.request('/api/insights', undefined, env)).headers.get('etag')!;
    const histEtag = (await app.request('/api/insights/us10y/history', undefined, env)).headers.get('etag')!;
    const paths = [
      '/api/insights',
      '/api/insights/status',
      '/api/insights/us10y/history',
      '/api/insights/archive/2026-10-12',
      '/api/insights/markets', // 404 hidden (public mode) — still counted, still under the cap
      '/api/insights/fx',
    ];
    for (const path of paths) {
      const res = await app.request(path, undefined, env);
      // The page-load surface answers 200/304/404 — never the 429 a bulk
      // copying burst earns.
      expect(res.status, path).not.toBe(429);
    }
    // Conditional revalidations ride the same budget without a fresh body.
    const revalidate = await app.request('/api/insights', { headers: { 'if-none-match': etag } }, env);
    expect(revalidate.status).toBe(304);
    const revalidateHistory = await app.request('/api/insights/us10y/history', {
      headers: { 'if-none-match': histEtag },
    }, env);
    expect(revalidateHistory.status).toBe(304);
    // 10 requests in total (2 ETag primes + 6 paths + 2 revalidations) — a
    // normal visit never meets the 120-burst / 60-per-minute bucket.
  });

  it('the limiter never touches the LOGIN bucket (a data burst does not lock the owner out)', async () => {
    const { store, app, kv } = publicDataApp();
    await store.putSnapshot(snapshot);
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public', INSIGHTS_PASSWORD: PASSWORD };
    // Drain the data bucket to zero.
    for (let i = 0; i < 121; i++) await app.request('/api/insights', undefined, env);
    const denied = await app.request('/api/insights', undefined, env);
    expect(denied.status).toBe(429);
    // The login route rides its own family and still answers.
    const login = await app.request(
      '/api/insights/login',
      { method: 'POST', body: JSON.stringify({ password: PASSWORD }) },
      env,
    );
    expect(login.status).toBe(200);
  });
});

/* ==================================================================== *
 * M-2 — public-mode data minimisation
 * ==================================================================== */

describe('M-2 the bounded PUBLIC history (L2-but-public-ok ids)', () => {
  it('brent (L2 + public-ok) serves at most the most recent 400 calendar days in public mode; the tail matches', async () => {
    const kv = makeKv();
    const store = new InMemoryInsightsStore();
    await store.putHistory(brentHistory);
    const app = createApp({ makeInsightsReader: () => store });
    const publicEnv: Bindings = { RATES: kv.env, SITE_MODE: 'public' };

    const res = await app.request('/api/insights/brent/history', undefined, publicEnv);
    expect(res.status).toBe(200);
    const body = (await res.json()) as IndicatorHistory;
    expect(body.points.length).toBe(400); // 500 consecutive days → exactly the last 400
    expect(body.points[body.points.length - 1]).toEqual(brentHistory.points[499]); // the LAST point matches the private tail
    expect(body.points[0]![0]).toBe(19499 - 399); // the window is calendar-day based
    // The ETag is computed over the TRUNCATED payload (a public ETag ≠ the private one).
    expect(res.headers.get('etag')).toBe(`"insights-hist:brent:400:${brentHistory.points[499]![0]}"`);
  });

  it('PRIVATE mode keeps the FULL series for the same id (the bound is a public-mode behaviour)', async () => {
    const kv = makeKv();
    const store = new InMemoryInsightsStore();
    await store.putHistory(brentHistory);
    const app = createApp({ makeInsightsReader: () => store });
    const privateEnv: Bindings = { RATES: kv.env, INSIGHTS_PASSWORD: PASSWORD };
    const res = await app.request('/api/insights/brent/history', { headers: await authedCookieHeader() }, privateEnv);
    expect(res.status).toBe(200);
    const body = (await res.json()) as IndicatorHistory;
    expect(body.points.length).toBe(500);
    expect(res.headers.get('etag')).toBe(`"insights-hist:brent:500:${brentHistory.points[499]![0]}"`);
  });

  it('an L0 public id (us10y) still serves the FULL series in public mode', async () => {
    const kv = makeKv();
    const store = new InMemoryInsightsStore();
    await store.putHistory(us10yHistory);
    const app = createApp({ makeInsightsReader: () => store });
    const publicEnv: Bindings = { RATES: kv.env, SITE_MODE: 'public' };
    const res = await app.request('/api/insights/us10y/history', undefined, publicEnv);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(us10yHistory); // untouched, byte-identical contract
  });
});

describe('M-2 the trimmed PUBLIC status (no full validation details, no fetch URLs)', () => {
  it('public mode serves the minimised document only', async () => {
    const kv = makeKv();
    const store = new InMemoryInsightsStore();
    const reader = publicReader(store);
    await store.putPublicSnapshot(reader.__publicSnapshot);
    await store.putStatus(status);
    const app = createApp({ makeInsightsReader: () => reader as never });
    const publicEnv: Bindings = { RATES: kv.env, SITE_MODE: 'public' };

    const res = await app.request('/api/insights/status', undefined, publicEnv);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      generatedAt: string;
      staleCount: number;
      failedSources: { source: string; ok: boolean }[];
      validationSummary: { test: string; passed: boolean }[];
    };
    expect(body.generatedAt).toBe('2026-10-12T04:21:00.000Z');
    expect(body.staleCount).toBe(1); // ecb-dfr is stale in the public projection
    expect(body.failedSources).toEqual([{ source: 'gold-api', ok: false }]);
    expect(body.validationSummary).toEqual([
      { test: 'T-01', passed: true },
      { test: 'T-02', passed: false },
    ]);
    // The minimisation: NO private-only fields leak.
    const raw = JSON.stringify(body);
    expect(raw).not.toContain('detail'); // no per-source fetch details/URLs
    expect(raw).not.toContain('flagged');
    expect(raw).not.toContain('failures');
    expect(raw).not.toContain('dryRun');
    expect(raw).not.toContain('mode');
  });

  it('private mode keeps the FULL document (the owner console unchanged)', async () => {
    const kv = makeKv();
    const store = new InMemoryInsightsStore();
    await store.putSnapshot(snapshot);
    await store.putStatus(status);
    const app = createApp({ makeInsightsReader: () => store });
    const privateEnv: Bindings = { RATES: kv.env, INSIGHTS_PASSWORD: PASSWORD };
    const res = await app.request('/api/insights/status', { headers: await authedCookieHeader() }, privateEnv);
    expect(res.status).toBe(200);
    const body = (await res.json()) as InsightsStatus;
    expect(body.sources[1]!.detail).toContain('HTTP 429'); // the full detail survives privately
    expect(body.dryRun).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * A final cross-cutting guard: the live-prices merge skip and the
 * /markets /fx 404s remain PUBLIC-mode behaviours (they follow the
 * resolved access mode, not the raw env var).
 * ------------------------------------------------------------------ */
describe('public-mode behaviours follow the RESOLVED access mode', () => {
  it('under a KV panic the /markets 404 is replaced by the gate (a logged-in owner gets the board back)', async () => {
    const kv = makeKv('private');
    const app = createApp({
      makeInsightsReader: () => new InMemoryInsightsStore(),
      makeMarketsReader: () => ({ getMarkets: async () => undefined }) as never,
    });
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public', INSIGHTS_PASSWORD: PASSWORD };
    // Unauthenticated: the gate answers 401 BEFORE the public-404 logic.
    const denied = await app.request('/api/insights/markets', undefined, env);
    expect(denied.status).toBe(401);
    // Authenticated: private mode serves the board (no hidden_site_mode 404).
    const authed = await app.request('/api/insights/markets', { headers: await authedCookieHeader() }, env);
    expect(authed.status).toBe(503); // markets_not_ready — the hidden-404 was NOT taken
    expect(((await authed.json()) as { error: { code: string } }).error.code).toBe('markets_not_ready');
  });

  it('public mode keeps skipping the Yahoo live-prices merge (the EOD projection answers alone)', async () => {
    const kv = makeKv();
    const store = new InMemoryInsightsStore();
    const reader = publicReader(store);
    await store.putPublicSnapshot(reader.__publicSnapshot);
    const app = createApp({
      makeInsightsReader: () => reader as never,
      makePricesReader: () => ({
        getLivePrices: async (): Promise<LivePricesSnapshot | undefined> => {
          throw new Error('the public serve path must not read the Yahoo quotes key');
        },
      }) as never,
    });
    const env: Bindings = { RATES: kv.env, SITE_MODE: 'public' };
    const res = await app.request('/api/insights', undefined, env);
    expect(res.status).toBe(200);
    expect((await res.json() as InsightsSnapshot).displayMode).toBe('public');
  });
});
