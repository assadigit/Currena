/**
 * @currena/api — Hono on Cloudflare Workers (mission §7).
 *
 * Surface (routes live in src/routes/* since the Phase 3 split):
 *   GET  /api/health                  — liveness                      (routes/ops)
 *   GET  /api/rates?source=           — fallback ladder (mission §6)  (routes/rates)
 *   GET  /api/convert?from&to&amount  — server-side math via core     (routes/rates)
 *   GET  /api/history?source=         — rolling history for sparklines(routes/rates)
 *   GET  /api/meta                    — currency asset list           (routes/ops)
 *   GET  /api/status                  — per-source status + cache age (routes/ops)
 *   GET  /api/insights(/…)            — precomputed Insights sections (routes/insights)
 *   GET/POST /admin                   — zero-JS ops console           (routes/admin)
 *   POST /internal/refresh?source=    — header-secret manual scrape   (routes/internal)
 *   cron  * * * * *                   — keep-warm + :13 prices rung   (cron.ts)
 *
 * This module is the COMPOSITION ROOT only: bindings, dependency
 * construction, the shared security-header middleware, the SPA fallback,
 * the error backstop, and the Worker entrypoints.
 *
 * All errors use the RatesError envelope with correct status codes. RPC types
 * are exported (`AppType`) so apps/web uses `hc<AppType>`.
 *
 * `createApp(deps?)` allows route tests to inject a RatesService built over
 * the in-memory RateStore fake + fake scrapers — no Workers, no live sites.
 */

import { Hono } from 'hono';
import type { MarketsReader } from '@currena/insights/markets';
import { KvInsightsReader, KvMarketsReader, KvFxReader, KvPricesReader } from './adapters/insights-store';
import { createInsightsRoutes } from './routes/insights';
import { createRatesRoutes } from './routes/rates';
import { createOpsRoutes } from './routes/ops';
import { createAdminRoutes } from './routes/admin';
import { createInternalRoutes } from './routes/internal';
import { errorResponse } from './http';
import { makeDefaultService } from './default-service';
import { runScheduled } from './cron';
import { RatesService, RatesServiceError } from './rates-service';
import { CoreError } from '@currena/core';

export type Bindings = {
  /** Workers KV namespace (snapshot/status/lock keys — see adapters/kv-store.ts). */
  RATES: KVNamespace;
  /** Shared secret for POST /internal/refresh (wrangler secret / .dev.vars). */
  REFRESH_SECRET?: string;
  /** Optional: when set, GET /admin requires a sign-in (HMAC cookie session). */
  ADMIN_VIEW_SECRET?: string;
  /** Static-assets binding (implicit when wrangler.jsonc has `assets`); serves the SPA. */
  ASSETS?: Fetcher;
};

export interface AppDeps {
  /** Override service construction (route tests inject a fake ladder). */
  makeService?: (env: Bindings) => RatesService;
  /** Override the Insights store (route tests inject the in-memory fake). */
  makeInsightsReader?: (env: Bindings) => import('@currena/insights/store').InsightsReader;
  /** Override the world-markets store (route tests inject the in-memory fake). */
  makeMarketsReader?: (env: Bindings) => MarketsReader;
  /** Override the world-currencies store (route tests inject the in-memory fake). */
  makeFxReader?: (env: Bindings) => import('@currena/insights/fx').FxReader;
  /** Override the live-prices store (route tests inject the in-memory fake). */
  makePricesReader?: (env: Bindings) => import('@currena/insights/prices').PricesReader;
  /**
   * Injectable clock for the serve-time staleness re-evaluation (audit
   * A-8) — defaults to the real time. Tests pin it so fixtures with frozen
   * dates stay deterministic.
   */
  now?: () => Date;
}

export function createApp(deps: AppDeps = {}) {
  const makeService = deps.makeService ?? makeDefaultService;

  // Insights serve path: ONE KV read per request (KvInsightsReader is a
  // lazy singleton — the binding is stable for the isolate's lifetime).
  let insightsReader: import('@currena/insights/store').InsightsReader | undefined;
  const getInsightsReader = (env: Bindings): import('@currena/insights/store').InsightsReader => {
    insightsReader ??= deps.makeInsightsReader ? deps.makeInsightsReader(env) : new KvInsightsReader(env.RATES);
    return insightsReader;
  };

  // World stock markets serve path: the section's ONE key behind the spec's
  // 5-minute KV edge cache (KvMarketsReader — same lazy-singleton pattern).
  let marketsReader: MarketsReader | undefined;
  const getMarketsReader = (env: Bindings): MarketsReader => {
    marketsReader ??= deps.makeMarketsReader ? deps.makeMarketsReader(env) : new KvMarketsReader(env.RATES);
    return marketsReader;
  };

  // World currencies serve path: the section's ONE key behind the same
  // 5-minute KV edge cache (KvFxReader — same lazy-singleton pattern).
  let fxReader: import('@currena/insights/fx').FxReader | undefined;
  const getFxReader = (env: Bindings): import('@currena/insights/fx').FxReader => {
    fxReader ??= deps.makeFxReader ? deps.makeFxReader(env) : new KvFxReader(env.RATES);
    return fxReader;
  };

  // Live-prices serve path: the quotes key behind a 60-second KV edge cache
  // (KvPricesReader — same lazy-singleton pattern).
  let pricesReader: import('@currena/insights/prices').PricesReader | undefined;
  const getPricesReader = (env: Bindings): import('@currena/insights/prices').PricesReader => {
    pricesReader ??= deps.makePricesReader ? deps.makePricesReader(env) : new KvPricesReader(env.RATES);
    return pricesReader;
  };

  const app = new Hono<{ Bindings: Bindings }>();

  // Security headers on every Worker-answered response (SWOT hardening
  // 2026-09-19: /api, /internal, /admin and the SPA fallback this code owns
  // — platform-served static assets keep Cloudflare's own baseline).
  // Hand-rolled instead of hono/secure-headers so the set stays explicit:
  // no HSTS (the zone already forces HTTPS at the edge), no CSP (the admin
  // console and the pre-paint boot script need inline allowances — a wrong
  // CSP breaks more than it protects here; revisited with hashes later).
  app.use('*', async (c, next) => {
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  });

  app.route('/', createOpsRoutes({ makeService }));
  app.route('/', createRatesRoutes({ makeService }));
  app.route('/', createAdminRoutes({ makeService, getInsightsReader }));
  app.route('/', createInternalRoutes({ makeService }));

  /* ----------------------------- insights ------------------------------- */

  // Phase I3: precomputed snapshot + per-indicator history, both written by
  // the scheduled jobs. Read-only here.
  app.route(
    '/api/insights',
    createInsightsRoutes({
      getReader: getInsightsReader,
      getMarketsReader,
      getFxReader,
      getPricesReader,
      // A-8: the serve-time staleness re-evaluation needs a clock; tests
      // pin it so aged fixtures flip deterministically.
      now: deps.now ?? (() => new Date()),
    }),
  );

  /* ------------------------- error envelopes ----------------------------- */

  app.notFound((c) => {
    // SPA fallback (Phase 5): non-API paths that miss every route serve the
    // built index.html via the Workers assets binding, so legacy-style deep
    // links (/receipt, /live-rates, …) boot the hash-routed SPA. API/internal
    // paths (and any request without the assets binding, e.g. route tests)
    // keep the JSON RatesError envelope.
    const path = new URL(c.req.url).pathname;
    const isApiPath = path === '/api' || path.startsWith('/api/') || path === '/internal' || path.startsWith('/internal/');
    const canServeSpa =
      (c.req.method === 'GET' || c.req.method === 'HEAD') && !isApiPath && typeof c.env.ASSETS?.fetch === 'function';
    if (canServeSpa) {
      const indexUrl = new URL('/index.html', c.req.url).toString();
      return c.env.ASSETS!.fetch(new Request(indexUrl, { method: 'GET' }));
    }
    return errorResponse(c, 404, 'not_found', `No such route: ${c.req.method} ${path}`);
  });

  app.onError((err, c) => {
    if (err instanceof RatesServiceError) {
      return errorResponse(c, 503, err.code, err.message, err.retryAfterSec);
    }
    if (err instanceof CoreError) {
      return errorResponse(c, 500, err.code, err.message);
    }
    console.error('[api] unhandled error:', err);
    return errorResponse(c, 500, 'internal_error', 'An unexpected error occurred');
  });

  return app;
}

const app = createApp();

/** Hono RPC client type: `const client = hc<AppType>('/');` in apps/web. */
export type AppType = typeof app;

/* ------------------------------------------------------------------ *
 * Worker entrypoints. The ever-green cron body lives in cron.ts.
 * ------------------------------------------------------------------ */

export default {
  fetch: async (request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> =>
    app.fetch(request, env, ctx),
  scheduled: (event: ScheduledController, env: Bindings, ctx: ExecutionContext): Promise<void> => {
    const work = runScheduled(env, event.scheduledTime);
    ctx.waitUntil(work);
    return work;
  },
};

/* Test-only resets re-exported so existing test imports stay stable.
 * NOTE: workerd's local dev runtime rejects non-handler VALUE exports —
 * only functions / ExportedHandlers may pass through `export { … }` here.
 * PRICES_CRON_MINUTE (a number) is therefore imported from './cron' by
 * tests directly; re-exporting it here breaks `wrangler dev` (it deployed
 * fine, which is how this slipped past CI — caught 2026-10-15 polish pass). */
export { __resetRateLimiterForTests } from './security';
export { __resetSnapshotMemoForTests } from './default-service';
export { runScheduled, runScheduledPricesRefresh } from './cron';
