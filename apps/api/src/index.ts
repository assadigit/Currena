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

import { convert, CoreError, SnapshotSourceSchema, sourceForPair } from '@currena/core';
import type { ConversionResult, RatesError, Snapshot, SnapshotSource } from '@currena/core';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { scrapeFrankfurter, scrapeTgju } from '@currena/scraper';
import {
  ADMIN_HEADERS,
  ADMIN_VIEW_COOKIE,
  adminViewToken,
  renderAdminGate,
  renderAdminNotice,
  renderAdminPage,
  type AdminBanner,
} from './admin';
import { KvRateStore } from './adapters/kv-store';
import { buildMeta } from './meta';
import { RatesService, RatesServiceError } from './rates-service';

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
}

const NO_STORE: Readonly<Record<string, string>> = { 'Cache-Control': 'no-store' };
const MAX_AMOUNT = 1e15;
/** The no-JS admin form is well under 1 KB; 8 KB is a generous cap. */
const MAX_ADMIN_BODY_BYTES = 8192;

type ErrorStatus = 400 | 401 | 404 | 413 | 500 | 501 | 503;

/** RatesError envelope with the right status + no-store (+ Retry-After). */
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
  return c.json(body, status, {
    ...NO_STORE,
    // Standards-level retry hint mirroring the body's retryAfterSec (503s).
    ...(retryAfterSec !== undefined ? { 'Retry-After': String(retryAfterSec) } : {}),
  });
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

/*
 * Isolate-lifetime micro-cache for snapshot reads. Workers reuses isolates
 * across requests, and every /api/rates request inside the fresh window pays
 * a KV read for the SAME unchanged snapshot — a 5s memo removes almost all
 * of those reads (KV reads are billed and eventually consistent). Writes
 * refresh the memo so a just-scraped snapshot is served immediately.
 */
const SNAPSHOT_MEMO_TTL_MS = 5_000;
const snapshotMemo = new Map<SnapshotSource, { snapshot: Snapshot | undefined; readAtMs: number }>();
let defaultStore: KvRateStore | undefined;

function makeDefaultService(env: Bindings): RatesService {
  defaultStore ??= new KvRateStore(env.RATES);
  const store = {
    getSnapshot: async (source: SnapshotSource): Promise<Snapshot | undefined> => {
      const hit = snapshotMemo.get(source);
      if (hit !== undefined && Date.now() - hit.readAtMs < SNAPSHOT_MEMO_TTL_MS) return hit.snapshot;
      const snapshot = await defaultStore!.getSnapshot(source);
      snapshotMemo.set(source, { snapshot, readAtMs: Date.now() });
      return snapshot;
    },
    putSnapshot: async (source: SnapshotSource, snapshot: Snapshot, ttlSec: number): Promise<void> => {
      snapshotMemo.set(source, { snapshot, readAtMs: Date.now() });
      await defaultStore!.putSnapshot(source, snapshot, ttlSec);
    },
    getStatus: (source: SnapshotSource) => defaultStore!.getStatus(source),
    putStatus: (source: SnapshotSource, status: Parameters<KvRateStore['putStatus']>[1]) =>
      defaultStore!.putStatus(source, status),
    tryAcquireLock: (source: SnapshotSource, ttlSec: number) => defaultStore!.tryAcquireLock(source, ttlSec),
    releaseLock: (source: SnapshotSource, token: string) => defaultStore!.releaseLock(source, token),
  };
  return new RatesService({
    store,
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
    c.json({ ok: true, service: 'currena-api', time: new Date().toISOString() }, 200, NO_STORE),
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
      // Content-addressed ETag: the snapshot identity is (source, fetchedAt),
      // so a conditional re-poll within the same generation is a tiny 304
      // instead of a full payload (the SPA polls every 30s per source).
      const etag = `"${response.snapshot.source}:${response.snapshot.fetchedAt}"`;
      if (c.req.header('if-none-match') === etag) {
        return c.body(null, 304, { ...NO_STORE, ETag: etag });
      }
      return c.json(response, 200, { ...NO_STORE, ETag: etag });
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

    // Routing rule (AGENTS.md rule 8) — shared with the SPA via @currena/core.
    const source: SnapshotSource = sourceForPair(from, to);

    try {
      const rates = await makeService(c.env).getRates(source);
      const result = convert(rates.snapshot, from, to, amount);
      // Propagate the ladder's staleness so clients can banner stale math
      // exactly like they do for /api/rates (additive fields).
      return c.json(
        {
          ...result,
          ...(rates.stale ? { stale: true, notice: rates.notice } : {}),
        },
        200,
        NO_STORE,
      );
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

  /* ------------------------- admin stub (Phase 6) ------------------------- */

  /** Shared page render: status report + cached snapshots, escaped HTML. */
  async function renderAdmin(
    c: Context<{ Bindings: Bindings }>,
    opts: {
      refreshed?: 'tgju' | 'frankfurter';
      error?: AdminBanner;
      status?: 200 | 401 | 413;
    } = {},
  ) {
    const service = makeService(c.env);
    const [report, tgju, frankfurter] = await Promise.all([
      service.status(),
      service.snapshot('tgju'),
      service.snapshot('frankfurter'),
    ]);
    const html = renderAdminPage({
      report,
      snapshots: { tgju, frankfurter },
      now: new Date(),
      publicMode: c.env.ADMIN_VIEW_SECRET === undefined,
      ...opts,
    });
    return c.html(html, opts.status ?? 200, ADMIN_HEADERS);
  }

  /** True when the request carries a valid admin view session (or gating is off). */
  async function hasAdminViewSession(c: Context<{ Bindings: Bindings }>): Promise<boolean> {
    const viewSecret = c.env.ADMIN_VIEW_SECRET;
    if (viewSecret === undefined || viewSecret === '') return true; // not gated
    const token = await adminViewToken(viewSecret);
    return getCookie(c, ADMIN_VIEW_COOKIE) === token;
  }

  app.get('/admin', async (c) => {
    if (!(await hasAdminViewSession(c))) {
      // Gate page: zero KV reads, zero operational data.
      return c.html(renderAdminGate(), 401, ADMIN_HEADERS);
    }
    // ?refreshed= is set by the POST below (PRG flash) — validated, never trusted.
    const raw = c.req.query('refreshed');
    const refreshed = raw === 'tgju' || raw === 'frankfurter' ? raw : undefined;
    return renderAdmin(c, { refreshed });
  });

  app.post('/admin', async (c) => {
    // Cap the body before buffering it (the no-JS form is < 1 KB).
    const contentLength = Number(c.req.header('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > MAX_ADMIN_BODY_BYTES) {
      return c.html(
        renderAdminNotice({ error: { code: 'payload_too_large', message: 'Admin form body exceeds the size limit.' } }),
        413,
        ADMIN_HEADERS,
      );
    }

    const viewSecret = c.env.ADMIN_VIEW_SECRET;
    const gated = viewSecret !== undefined && viewSecret !== '';
    const viewOk = await hasAdminViewSession(c);

    // application/x-www-form-urlencoded body (the no-JS form).
    let form: Record<string, string | undefined> = {};
    try {
      const contentType = c.req.header('content-type') ?? '';
      if (/application\/x-www-form-urlencoded/i.test(contentType)) {
        const text = (await c.req.text()).slice(0, MAX_ADMIN_BODY_BYTES);
        const params = new URLSearchParams(text);
        form = {
          action: params.get('action') ?? undefined,
          source: params.get('source') ?? undefined,
          secret: params.get('secret') ?? undefined,
        };
      }
    } catch {
      form = {}; // fall through to validation errors below
    }

    // View-gated deployments: only the sign-in action is reachable without a
    // session, and wrong secrets render the gate (never the console).
    if (gated && !viewOk) {
      if (form.action === 'view' && form.secret !== undefined && secretMatches(form.secret, viewSecret!)) {
        setCookie(c, ADMIN_VIEW_COOKIE, await adminViewToken(viewSecret!), {
          httpOnly: true,
          secure: true,
          sameSite: 'Strict',
          path: '/admin',
          maxAge: 3600,
        });
        return c.redirect('/admin', 303);
      }
      return c.html(
        renderAdminGate({ error: { message: 'Missing or invalid view secret.' } }),
        401,
        ADMIN_HEADERS,
      );
    }

    const secret = c.env.REFRESH_SECRET;
    if (!secret) {
      return renderAdmin(c, {
        error: {
          code: 'refresh_not_configured',
          message: 'REFRESH_SECRET is not configured for this deployment.',
        },
      });
    }

    const source = parseSourceParam(form.source);
    if (!source) {
      return renderAdmin(c, {
        error: { message: `Invalid 'source' — must be 'tgju' or 'frankfurter'.` },
      });
    }

    const provided = form.secret ?? '';
    if (provided === '' || !secretMatches(provided, secret)) {
      // Uniform message for missing/wrong secret; no echo of the input.
      return renderAdmin(c, {
        error: { code: 'unauthorized', message: 'Missing or invalid refresh secret.' },
      });
    }

    try {
      await makeService(c.env).getRates(source, { force: true });
      // PRG: redirect so a browser refresh never re-submits the form.
      return c.redirect(`/admin?refreshed=${source}`, 303);
    } catch (err) {
      if (err instanceof RatesServiceError) {
        return renderAdmin(c, { error: { code: err.code, message: err.message } });
      }
      throw err;
    }
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
