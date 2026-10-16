/**
 * insights-auth.test.ts — T-24 (Step 3 §9): every Insights data endpoint
 * answers 401 with NO data when the request is not signed in, the login
 * route signs a usable cookie, and the gate fails closed when the secret is
 * unconfigured. The payload-shape tests run with SITE_MODE 'public' (their
 * envs say so); this file is the gate's own coverage.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp, type Bindings } from './index';
import { INSIGHTS_SESSION_COOKIE, sessionTokenFor } from './insights-auth';
import { __resetRateLimiterForTests } from './security';
import { InMemoryInsightsStore } from '@currena/insights/store';
import type { InsightsSnapshot } from '@currena/core';


const PASSWORD = 'correct-horse-battery-staple';

/** A minimal VALID snapshot — the gate tests only prove data does/doesn't flow. */
const snapshot = {
  generatedAt: '2026-10-07T04:20:00.000Z',
  summary: {
    global: { section: 'global', label: null, warningCount: 0, votingCount: 0, excludedCount: 0 },
    australia: { section: 'australia', label: null, warningCount: 0, votingCount: 0, excludedCount: 0 },
  },
  readings: [],
  changedThisWeek: [],
  calendar: [],
  ruleVersion: 2,
} as unknown as InsightsSnapshot;

function makeEnv(overrides: Partial<Bindings> = {}): Bindings {
  return {
    RATES: { get: async () => null } as unknown as KVNamespace,
    INSIGHTS_PASSWORD: PASSWORD,
    ...overrides,
  };
}

function makeApp() {
  const store = new InMemoryInsightsStore();
  const app = createApp({ makeInsightsReader: () => store, makeMarketsReader: () => store as never });
  return { app, store };
}

const GATED_GETS = [
  '/api/insights',
  '/api/insights/markets',
  '/api/insights/fx',
  '/api/insights/status',
  '/api/insights/us10y/history',
  '/api/insights/archive/2026-10-15',
];

describe('the Insights private gate (T-24)', () => {
  beforeEach(() => __resetRateLimiterForTests());
  afterEach(() => __resetRateLimiterForTests());

  it('every data endpoint answers 401 with no data when unauthenticated', async () => {
    const { app, store } = makeApp();
    await store.putSnapshot(snapshot as InsightsSnapshot);
    for (const path of GATED_GETS) {
      const res = await app.request(path, undefined, makeEnv());
      expect(res.status, path).toBe(401);
      const body = (await res.json()) as { error?: { code?: string } };
      expect(body.error?.code).toBe('private_page');
      // No data leaks: the body is the tiny envelope only.
      expect(JSON.stringify(body)).not.toContain('ruleVersion');
      expect(JSON.stringify(body)).not.toContain('readings');
      expect(res.headers.get('cache-control')).toBe('no-store');
      expect(res.headers.get('x-robots-tag')).toContain('noindex');
    }
  });

  it('fails closed when INSIGHTS_PASSWORD is unset (an unconfigured gate refuses everything)', async () => {
    const { app } = makeApp();
    const res = await app.request('/api/insights', undefined, makeEnv({ INSIGHTS_PASSWORD: undefined }));
    expect(res.status).toBe(401);
    const login = await app.request('/api/insights/login', { method: 'POST', body: JSON.stringify({ password: 'x' }) }, makeEnv({ INSIGHTS_PASSWORD: undefined }));
    expect(login.status).toBe(401);
  });

  it('the login route signs a cookie that unlocks every endpoint (then answers private,no-store)', async () => {
    const { app, store } = makeApp();
    await store.putSnapshot(snapshot as InsightsSnapshot);
    const denied = await app.request('/api/insights', undefined, makeEnv());
    expect(denied.status).toBe(401);
    const login = await app.request(
      '/api/insights/login',
      { method: 'POST', body: JSON.stringify({ password: PASSWORD }) },
      makeEnv(),
    );
    expect(login.status).toBe(200);
    const cookie = login.headers.get('set-cookie') ?? '';
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    const presented = cookie.split(';')[0]!;
    const ok = await app.request('/api/insights', { headers: { cookie: presented } }, makeEnv());
    expect(ok.status).toBe(200);
    expect(ok.headers.get('cache-control')).toBe('private, no-store');
    expect(ok.headers.get('x-robots-tag')).toContain('noindex');
  });

  it('a wrong password gets the same neutral 401 (no hints) and a tampered/expired cookie is refused', async () => {
    const { app } = makeApp();
    const wrong = await app.request(
      '/api/insights/login',
      { method: 'POST', body: JSON.stringify({ password: 'wrong' }) },
      makeEnv(),
    );
    expect(wrong.status).toBe(401);
    expect(((await wrong.json()) as { error: { code: string } }).error.code).toBe('private_page');
    // Tampered token.
    const tamperedRes = await app.request(
      '/api/insights',
      { headers: { cookie: `${INSIGHTS_SESSION_COOKIE}=9999999999999.deadbeef` } },
      makeEnv(),
    );
    expect(tamperedRes.status).toBe(401);
    // Expired token (signed in the past with a past expiry).
    const expired = await sessionTokenFor(PASSWORD, Date.now() - 13 * 60 * 60 * 1000).then((t) => t.token);
    const expiredRes = await app.request(
      '/api/insights',
      { headers: { cookie: `${INSIGHTS_SESSION_COOKIE}=${expired}` } },
      makeEnv(),
    );
    expect(expiredRes.status).toBe(401);
  });

  it('SITE_MODE=public skips the gate (AC-08) — content eligibility is then T-15\u2019s job', async () => {
    const { app, store } = makeApp();
    await store.putSnapshot(snapshot as InsightsSnapshot);
    const res = await app.request('/api/insights', undefined, makeEnv({ SITE_MODE: 'public' }));
    expect(res.status).toBe(200);
  });

  it('rate limits the guessing surface (429 with Retry-After)', async () => {
    const { app } = makeApp();
    let saw429 = false;
    for (let i = 0; i < 30; i++) {
      const res = await app.request(
        '/api/insights/login',
        { method: 'POST', body: JSON.stringify({ password: 'guess' }) },
        makeEnv(),
      );
      if (res.status === 429) {
        saw429 = true;
        expect(res.headers.get('retry-after')).toBeDefined();
        break;
      }
      expect(res.status).toBe(401);
    }
    expect(saw429).toBe(true);
  });
});
