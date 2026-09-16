/**
 * @currena/api — Hono on Cloudflare Workers (mission §7).
 *
 * Surface:
 *   GET  /api/health                  — liveness
 *   GET  /api/rates?source=           — fallback ladder (mission §6)
 *   GET  /api/convert?from&to&amount  — server-side math via @currena/core
 *   GET  /api/meta                    — currency asset list + limitations
 *   GET  /api/status                  — per-source SourceStatus + cache age
 *   POST /internal/refresh?source=    — header-secret manual scrape
 *
 * Routing rule (AGENTS.md rule 8): either side IRR → TGJU ladder; otherwise
 * Frankfurter ladder. Never mix sources within one conversion.
 *
 * All errors use the RatesError envelope with correct status codes. RPC types
 * are exported (`AppType`) so apps/web uses `hc<AppType>`.
 *
 * `createApp(deps?)` allows route tests to inject a RatesService built over
 * the in-memory RateStore fake + fake scrapers — no Workers, no live sites.
 */

import { convert, CoreError, SnapshotSourceSchema } from '@currena/core';
import type { ConversionResult, RatesError, SnapshotSource } from '@currena/core';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { scrapeFrankfurter, scrapeTgju } from '@currena/scraper';
import { KvRateStore } from './adapters/kv-store';
import { buildMeta } from './meta';
import { RatesService, RatesServiceError } from './rates-service';

export type Bindings = {
  /** Workers KV namespace (snapshot/status/lock keys — see adapters/kv-store.ts). */
  RATES: KVNamespace;
  /** Shared secret for POST /internal/refresh (wrangler secret / .dev.vars). */
  REFRESH_SECRET?: string;
  /** Static-assets binding (implicit when wrangler.jsonc has `assets`); serves the SPA. */
  ASSETS?: Fetcher;
};

export interface AppDeps {
  /** Override service construction (route tests inject a fake ladder). */
  makeService?: (env: Bindings) => RatesService;
}

const NO_STORE: Readonly<Record<string, string>> = { 'Cache-Control': 'no-store' };
const MAX_AMOUNT = 1e15;

type ErrorStatus = 400 | 401 | 404 | 500 | 501 | 503;

/** RatesError envelope with the right status + no-store. */
function errorResponse(
  c: Context<{ Bindings: Bindings }>,
  status: ErrorStatus,
  code: string,
  message: string,
  retryAfterSec?: number,
) {
  const body: RatesError = {
    error: { code, message, ...(retryAfterSec !== undefined ? { retryAfterSec } : {}) },
  };
  return c.json(body, status, NO_STORE);
}

/** Validate the ?source= query param; empty/absent → default 'tgju'. */
function parseSourceParam(raw: string | undefined): SnapshotSource | undefined {
  if (raw === undefined || raw === '') return 'tgju';
  const parsed = SnapshotSourceSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

/** Constant-time-ish string comparison (early length check is unavoidable). */
function secretMatches(provided: string, expected: string): boolean {
  const len = Math.max(provided.length, expected.length);
  let diff = provided.length === expected.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    diff |= (provided.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function makeDefaultService(env: Bindings): RatesService {
  return new RatesService({
    store: new KvRateStore(env.RATES),
    scrapers: {
      tgju: () => scrapeTgju(),
      frankfurter: () => scrapeFrankfurter(),
    },
  });
}

export function createApp(deps: AppDeps = {}) {
  const makeService = deps.makeService ?? makeDefaultService;

  const app = new Hono<{ Bindings: Bindings }>();

  app.get('/api/health', (c) =>
    c.json({ ok: true, service: 'currena-api', phase: 4, time: new Date().toISOString() }, 200, NO_STORE),
  );

  /* ---------------------------- rates ladder ---------------------------- */

  app.get('/api/rates', async (c) => {
    const source = parseSourceParam(c.req.query('source'));
    if (!source) {
      return errorResponse(
        c,
        400,
        'invalid_source',
        `Invalid 'source' parameter ${JSON.stringify(c.req.query('source'))} — must be 'tgju' or 'frankfurter'`,
      );
    }
    try {
      const response = await makeService(c.env).getRates(source);
      return c.json(response, 200, NO_STORE);
    } catch (err) {
      if (err instanceof RatesServiceError) {
        return errorResponse(c, 503, err.code, err.message, err.retryAfterSec);
      }
      throw err; // app.onError backstop
    }
  });

  /* ------------------------------ convert ------------------------------- */

  app.get('/api/convert', async (c) => {
    const rawFrom = c.req.query('from');
    const rawTo = c.req.query('to');
    const rawAmount = c.req.query('amount');

    // Case-normalizing validation: codes are 3 uppercase letters (ISO 4217).
    const from = (rawFrom ?? '').trim().toUpperCase();
    const to = (rawTo ?? '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(from)) {
      return errorResponse(
        c,
        400,
        'invalid_currency',
        `Invalid 'from' parameter ${JSON.stringify(rawFrom ?? '')} — must be exactly 3 letters`,
      );
    }
    if (!/^[A-Z]{3}$/.test(to)) {
      return errorResponse(
        c,
        400,
        'invalid_currency',
        `Invalid 'to' parameter ${JSON.stringify(rawTo ?? '')} — must be exactly 3 letters`,
      );
    }

    // Positive finite amount (reject 0 / negative / NaN / > 1e15).
    const amount = Number(rawAmount);
    if (
      rawAmount === undefined ||
      rawAmount.trim() === '' ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > MAX_AMOUNT
    ) {
      return errorResponse(
        c,
        400,
        'invalid_amount',
        `Invalid 'amount' parameter ${JSON.stringify(rawAmount ?? '')} — must be a positive finite number no greater than 1e15`,
      );
    }

    // Same-currency short-circuit (Gate 1 decision #5): local, rate 1, no network.
    if (from === to) {
      const result: ConversionResult = { amount, rate: 1, source: 'local', fetchedAt: new Date().toISOString() };
      return c.json(result, 200, NO_STORE);
    }

    // Routing rule (AGENTS.md rule 8): either side IRR → TGJU; else Frankfurter.
    const source: SnapshotSource = from === 'IRR' || to === 'IRR' ? 'tgju' : 'frankfurter';

    try {
      const { snapshot } = await makeService(c.env).getRates(source);
      const result = convert(snapshot, from, to, amount);
      return c.json(result, 200, NO_STORE);
    } catch (err) {
      if (err instanceof RatesServiceError) {
        return errorResponse(c, 503, err.code, err.message, err.retryAfterSec);
      }
      if (err instanceof CoreError && err.code === 'rate_not_found') {
        const unsupported = [from, to].some((code) => code === 'AED' || code === 'VND');
        const hint =
          source === 'frankfurter' && unsupported
            ? ' — Frankfurter does not serve AED or VND; pairs against IRR remain available via TGJU'
            : '';
        return errorResponse(
          c,
          503,
          'currency_not_supported',
          `Currency pair ${from}→${to} is not supported by source '${source}'${hint}`,
        );
      }
      throw err;
    }
  });

  /* ------------------------------- meta --------------------------------- */

  app.get('/api/meta', (c) => {
    // Static data + zod-validated shape; safe to cache briefly.
    return c.json(buildMeta(), 200, { 'Cache-Control': 'public, max-age=300' });
  });

  /* ------------------------------ status -------------------------------- */

  app.get('/api/status', async (c) => {
    const report = await makeService(c.env).status();
    return c.json(report, 200, NO_STORE);
  });

  /* ------------------------- internal refresh ---------------------------- */

  app.post('/internal/refresh', async (c) => {
    const secret = c.env.REFRESH_SECRET;
    if (!secret) {
      return errorResponse(
        c,
        501,
        'refresh_not_configured',
        'REFRESH_SECRET is not configured for this deployment',
      );
    }
    const provided = c.req.header('X-Refresh-Secret');
    if (provided === undefined || !secretMatches(provided, secret)) {
      return errorResponse(c, 401, 'unauthorized', 'Missing or invalid X-Refresh-Secret header');
    }

    const source = parseSourceParam(c.req.query('source'));
    if (!source) {
      return errorResponse(
        c,
        400,
        'invalid_source',
        `Invalid 'source' parameter ${JSON.stringify(c.req.query('source'))} — must be 'tgju' or 'frankfurter'`,
      );
    }

    try {
      // force: bypass MIN_SCRAPE_INTERVAL_SEC, still best-effort single-flight.
      const response = await makeService(c.env).getRates(source, { force: true });
      return c.json(response, 200, NO_STORE);
    } catch (err) {
      if (err instanceof RatesServiceError) {
        return errorResponse(c, 503, err.code, err.message, err.retryAfterSec);
      }
      throw err;
    }
  });

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

export default app;
/** Hono RPC client type: `const client = hc<AppType>('/');` in apps/web. */
export type AppType = typeof app;
