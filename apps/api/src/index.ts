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
import type { InsightsReader } from '@currena/insights/store';
import { KvInsightsReader, KvMarketsReader, KvFxReader, KvPricesReader } from './adapters/insights-store';
import { resolveAccessModeForRequest, type AccessMode } from './access-mode';
import { KvAccessModeStore, type AccessModeKvStore } from './adapters/access-mode-store';
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
  /**
   * 2026-10-21 data-integrity round: the owner's EODHD key — the eth-usd
   * indicator card's source on the daily ingest rung (the same key the
   * currena-markets worker already carries for the world-markets board;
   * server-side only, never in client code). Optional: an unset token
   * skips the ETH fetch honestly (the card holds its last good value).
   */
  EODHD_API_TOKEN?: string;
  /** Shared secret for POST /internal/refresh (wrangler secret / .dev.vars). */
  REFRESH_SECRET?: string;
  /** Optional: when set, GET /admin requires a sign-in (HMAC cookie session). */
  ADMIN_VIEW_SECRET?: string;
  /**
   * Step 3 §2.2 (runbook Phase 3): the Insights private gate's password.
   * UNSET = the gate fails closed (every /api/insights* route answers 401).
   * Set with `wrangler secret put INSIGHTS_PASSWORD` (OWNER_SETUP step 1).
   */
  INSIGHTS_PASSWORD?: string;
  /**
   * Step 3 §2.2 AC-08: 'private' (default) gates every Insights data
   * route; 'public' skips the gate — the build then enforces T-15 (every
   * displayed source must be public-display-ok). Set as a wrangler var.
   * M-5 back-compat: the LOWEST layer of the resolved access mode
   * (access-mode.ts) — PANIC_PRIVATE / the KV override / ACCESS_MODE win.
   */
  SITE_MODE?: string;
  /**
   * M-5 (RULES.md §3, T-24): the deploy-time access-mode var — 'public' |
   * 'private'. Any private signal wins; the panic switch resolves within
   * one refresh cycle. Set as a wrangler var (SITE_MODE's successor).
   */
  ACCESS_MODE?: string;
  /**
   * M-5 (RULES.md §3, T-24): the HARD panic — 'true' | '1' forces private
   * mode on every Insights data endpoint immediately, with no KV read at
   * all (it survives a broken KV and clears only on redeploy). Set as a
   * wrangler var.
   */
  PANIC_PRIVATE?: string;
  /**
   * M-3 (RULES.md §3, runbook Phase 3): the OWNER-ONLY surfaces' secret —
   * the full export (GET /api/insights/export) and the mode switch's
   * bearer auth. UNSET = every owner endpoint answers 403 owner_disabled
   * (fail closed; the export is simply disabled). Set with
   * `wrangler secret put INSIGHTS_OWNER_TOKEN` (OWNER_SETUP step 2).
   * Never logged, never echoed, compared constant-time only.
   */
  INSIGHTS_OWNER_TOKEN?: string;
  /**
   * The ingest watchdog's dispatch token (2026-10-16c, ingest-watchdog.ts):
   * a GitHub token with repo + Actions write. When the daily
   * insights-ingest schedule silently stops firing (GitHub-side schedule
   * delays/skips — observed live), the Worker's own cron re-dispatches the
   * workflow through the GitHub API. UNSET = the watchdog logs and does
   * nothing (graceful, like the optional Telegram alerter). Set with
   * `wrangler secret put GH_INGEST_DISPATCH_TOKEN`; rides the owner's
   * token-rotation pass.
   */
  GH_INGEST_DISPATCH_TOKEN?: string;
  /** Static-assets binding (implicit when wrangler.jsonc has `assets`); serves the SPA. */
  ASSETS?: Fetcher;
};

export interface AppDeps {
  /** Override service construction (route tests inject a fake ladder). */
  makeService?: (env: Bindings) => RatesService;
  /** Override the Insights store (route tests inject the in-memory fake). */
  makeInsightsReader?: (env: Bindings) => InsightsReader;
  /**
   * M-3: override the EXPORT reader — ALWAYS the private document family
   * (route tests inject a fake that holds the private snapshot).
   */
  makeExportReader?: (env: Bindings) => InsightsReader;
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

  /* ------------------ M-5: the resolved access mode ------------------- *
   * The panic switch's own plumbing (access-mode.ts): PANIC_PRIVATE → the
   * KV runtime override (`insights:access-mode:v1`, written by POST
   * /api/insights/mode) → ACCESS_MODE → the legacy SITE_MODE. The KV read
   * rides access-mode.ts's per-isolate 60-second memo, so the whole app
   * costs at most ONE access-mode KV read per minute — the gate, the
   * reader family and every public-mode behaviour share one resolution.
   * ------------------------------------------------------------------- */
  const getAccessModeKv = (env: Bindings): AccessModeKvStore => new KvAccessModeStore(env.RATES);
  const accessModeOf = (env: Bindings): Promise<AccessMode> =>
    resolveAccessModeForRequest(env, () => getAccessModeKv(env).get(), Date.now());

  // Insights serve path: ONE KV read per request (the reader is a lazy
  // singleton per resolved mode). Mode-aware since the M-5 rework: public
  // mode reads ONLY the public projection keys — re-keyed when the
  // resolved mode changes, so a runtime panic flip re-keys on the very
  // next request (KV failure degrades calmly: access-mode.ts never
  // throws, and the env chain answers).
  let insightsReader: InsightsReader | undefined;
  let insightsReaderMode: AccessMode | undefined;
  const getInsightsReader = async (env: Bindings): Promise<InsightsReader> => {
    if (deps.makeInsightsReader !== undefined) return deps.makeInsightsReader(env);
    const mode = await accessModeOf(env);
    if (insightsReader === undefined || insightsReaderMode !== mode) {
      insightsReader = new KvInsightsReader(env.RATES, mode);
      insightsReaderMode = mode;
    }
    return insightsReader;
  };

  // M-3: the export's reader — ALWAYS the PRIVATE document family,
  // whatever the site's resolved access mode is (the owner's export is
  // never reduced to the public projection). A lazy singleton in the
  // production path; tests inject their own fake.
  let exportReader: InsightsReader | undefined;
  const getExportReader = (env: Bindings): InsightsReader => {
    if (deps.makeExportReader !== undefined) return deps.makeExportReader(env);
    if (deps.makeInsightsReader !== undefined) return deps.makeInsightsReader(env);
    exportReader ??= new KvInsightsReader(env.RATES, 'private');
    return exportReader;
  };

  // The /admin console's freshness card: the STATUS key is mode-
  // independent, so the console keeps its own plain private-family reader
  // (sync signature) — the mode-aware serve path stays the data routes'.
  let adminInsightsReader: InsightsReader | undefined;
  const getAdminInsightsReader = (env: Bindings): InsightsReader => {
    adminInsightsReader ??= deps.makeInsightsReader
      ? deps.makeInsightsReader(env)
      : new KvInsightsReader(env.RATES, 'private');
    return adminInsightsReader;
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
  app.route('/', createAdminRoutes({ makeService, getInsightsReader: getAdminInsightsReader }));
  app.route('/', createInternalRoutes({ makeService }));

  /* ----------------------------- insights ------------------------------- */

  // Phase I3: precomputed snapshot + per-indicator history, both written by
  // the scheduled jobs. Read-only here.
  app.route(
    '/api/insights',
    createInsightsRoutes({
      getReader: getInsightsReader,
      getExportReader,
      getMarketsReader,
      getFxReader,
      getPricesReader,
      getAccessModeKv,
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
