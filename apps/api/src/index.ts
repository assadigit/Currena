/**
 * @currena/api — Hono on Cloudflare Workers (mission §7).
 *
 * Surface:
 *   GET  /api/health                  — liveness
 *   GET  /api/rates?source=           — fallback ladder (mission §6)
 *   GET  /api/convert?from&to&amount  — server-side math via @currena/core
 *   GET  /api/history?source=         — rolling rate history for sparklines (Task 24)
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

import { convert, CoreError, CORE_VERSION, SnapshotSourceSchema, sourceForPair } from '@currena/core';
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
import { KvInsightsReader } from './adapters/insights-store';
import { createInsightsRoutes } from './routes/insights';
import { recordHistory, readHistory } from './history';
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
  /** Override the Insights store (route tests inject the in-memory fake). */
  makeInsightsReader?: (env: Bindings) => import('@currena/insights/store').InsightsReader;
}

const NO_STORE: Readonly<Record<string, string>> = { 'Cache-Control': 'no-store' };
const MAX_AMOUNT = 1e15;
/** The no-JS admin form is well under 1 KB; 8 KB is a generous cap. */
const MAX_ADMIN_BODY_BYTES = 8192;

/* --------------------------- rate limiting ---------------------------- */

/**
 * Best-effort in-memory rate limit on the two secret-guessing surfaces
 * (POST /admin, POST /internal/refresh) — BACKLOG #18 / SWOT T3.
 *
 * Token bucket per (IP, surface), PER ISOLATE: Workers isolates are
 * ephemeral and per-PoP, so a patient attacker rotating PoPs can exceed
 * this — it is defense-in-depth on top of the real gates (constant-time
 * secret compare, uniform 401-before-render, body cap), not a hard
 * guarantee. Zero dependencies, no external state; the map is capped so
 * a hostile IP spray cannot grow isolate memory unboundedly.
 */
const RATE_LIMIT_CAPACITY = 10; // burst size
const RATE_LIMIT_REFILL_PER_MIN = 5; // sustained attempts/minute
const RATE_LIMIT_MAP_MAX = 10_000;

interface RateBucket {
  tokens: number;
  lastRefillMs: number;
}

const rateBuckets = new Map<string, RateBucket>();

/** Client IP as seen by the edge (absent in tests/local dev → 'unknown'). */
function clientIp(c: Context<{ Bindings: Bindings }>): string {
  return c.req.header('CF-Connecting-IP') ?? 'unknown';
}

/** Take one token; false = the bucket is empty (429). */
function rateLimitTake(key: string, nowMs: number): boolean {
  const bucket = rateBuckets.get(key) ?? { tokens: RATE_LIMIT_CAPACITY, lastRefillMs: nowMs };
  const elapsedMs = Math.max(0, nowMs - bucket.lastRefillMs);
  bucket.tokens = Math.min(
    RATE_LIMIT_CAPACITY,
    bucket.tokens + (elapsedMs / 60_000) * RATE_LIMIT_REFILL_PER_MIN,
  );
  bucket.lastRefillMs = nowMs;
  const allowed = bucket.tokens >= 1;
  if (allowed) bucket.tokens -= 1;
  rateBuckets.set(key, bucket);
  // Opportunistic eviction: keep the map bounded (oldest-refill first).
  if (rateBuckets.size > RATE_LIMIT_MAP_MAX) {
    const entries = [...rateBuckets.entries()].sort((a, b) => a[1].lastRefillMs - b[1].lastRefillMs);
    for (const [k] of entries.slice(0, Math.floor(RATE_LIMIT_MAP_MAX / 10))) rateBuckets.delete(k);
  }
  return allowed;
}

/** Test-only: reset the isolate-local buckets between test cases. */
export function __resetRateLimiterForTests(): void {
  rateBuckets.clear();
}

/** Seconds until one token is available again (for Retry-After). */
function rateLimitRetryAfterSec(key: string, nowMs: number): number {
  const bucket = rateBuckets.get(key);
  if (!bucket) return 1;
  const deficit = 1 - bucket.tokens;
  if (deficit <= 0) return 1;
  return Math.max(1, Math.ceil((deficit / RATE_LIMIT_REFILL_PER_MIN) * 60));
}

type ErrorStatus = 400 | 401 | 404 | 413 | 429 | 500 | 501 | 503;

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

  // Insights serve path: ONE KV read per request (KvInsightsReader is a
  // lazy singleton — the binding is stable for the isolate's lifetime).
  let insightsReader: import('@currena/insights/store').InsightsReader | undefined;
  const getInsightsReader = (env: Bindings): import('@currena/insights/store').InsightsReader => {
    insightsReader ??= deps.makeInsightsReader ? deps.makeInsightsReader(env) : new KvInsightsReader(env.RATES);
    return insightsReader;
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

  app.get('/api/health', async (c) => {
    // Deep health (BACKLOG #39, SWOT O8): version + KV reachability. The
    // binding is exercised with the cheapest possible read (the tgju
    // status key — one KV GET); a KV failure means the ladder cannot
    // serve ANY cached snapshot, so the service is genuinely degraded
    // and the probe reports 503 for monitors to alert on.
    let kv: 'ok' | 'error' = 'ok';
    try {
      await c.env.RATES.get('status:tgju');
    } catch {
      kv = 'error';
    }
    const body = {
      ok: kv === 'ok',
      service: 'currena-api',
      version: CORE_VERSION,
      kv,
      time: new Date().toISOString(),
    };
    return c.json(body, kv === 'ok' ? 200 : 503, NO_STORE);
  });

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
      // Task 24: a LIVE scrape means fresh market data — record it as a
      // history generation (content-deduped inside; no-op when unchanged).
      // A direct await (not waitUntil) keeps this test-safe — Hono's
      // c.executionCtx throws outside a real Workers context; the write rides
      // on a response that already paid for the scrape, so latency is fine.
      if (response.servedFrom === 'live') {
        try {
          await recordHistory(c.env.RATES, source, response.snapshot);
        } catch (err) {
          console.warn(`[history] record ${source} failed:`, err);
        }
      }
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

  /* ----------------------------- rate history ---------------------------- */

  // Task 24 (sparkline honesty): the recorded server-side generations feed
  // the client rate-history hydration so sparklines draw REAL per-currency
  // movement (days of diverging re-quotes) instead of each device's own
  // handful of app-seen checks. 60s browser cache — the payload only changes
  // when a rate actually moves — plus a content-addressed ETag for 304s.
  app.get('/api/history', async (c) => {
    const source = parseSourceParam(c.req.query('source'));
    if (!source) {
      return errorResponse(
        c,
        400,
        'invalid_source',
        `Invalid 'source' parameter ${JSON.stringify(c.req.query('source'))} — must be 'tgju' or 'frankfurter'`,
      );
    }
    const generations = await readHistory(c.env.RATES, source);
    const newest = generations[generations.length - 1];
    const etag = `"history:${source}:${generations.length}:${newest?.at ?? 'empty'}"`;
    if (c.req.header('if-none-match') === etag) {
      return c.body(null, 304, { 'Cache-Control': 'public, max-age=60', ETag: etag });
    }
    return c.json(
      { source, count: generations.length, generations },
      200,
      { 'Cache-Control': 'public, max-age=60', ETag: etag },
    );
  });

  /* ----------------------------- insights ------------------------------- */

  // Phase I3: precomputed snapshot + per-indicator history, both written by
  // the daily GitHub Actions ingestion runner (roadmap §2). Read-only here.
  app.route('/api/insights', createInsightsRoutes({ getReader: getInsightsReader }));

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
    const [report, tgju, frankfurter, insights] = await Promise.all([
      service.status(),
      service.snapshot('tgju'),
      service.snapshot('frankfurter'),
      // Insights freshness is optional telemetry — a failed read (broken KV
      // binding, poisoned entry) must never take the whole console down;
      // the card simply omits itself when the status is absent.
      getInsightsReader(c.env)
        .getStatus()
        .catch(() => undefined),
    ]);
    const html = renderAdminPage({
      report,
      snapshots: { tgju, frankfurter },
      insights,
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
    // Rate limit FIRST (BACKLOG #18): every attempt on this surface costs
    // edge + KV time, and wrong-secret guesses must not amplify. 429 comes
    // before any body read or secret work.
    const rlKey = `${clientIp(c)}#admin`;
    if (!rateLimitTake(rlKey, Date.now())) {
      return c.html(
        renderAdminNotice({
          error: {
            code: 'rate_limited',
            message: 'Too many attempts — wait a minute before trying again.',
          },
        }),
        429,
        { ...ADMIN_HEADERS, 'Retry-After': String(rateLimitRetryAfterSec(rlKey, Date.now())) },
      );
    }

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
    // Rate limit FIRST (BACKLOG #18) — same defense-in-depth as POST /admin.
    const rlKey = `${clientIp(c)}#internal`;
    if (!rateLimitTake(rlKey, Date.now())) {
      return errorResponse(
        c,
        429,
        'rate_limited',
        'Too many refresh attempts — wait a minute before trying again.',
        rateLimitRetryAfterSec(rlKey, Date.now()),
      );
    }

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

/** Hono RPC client type: `const client = hc<AppType>('/');` in apps/web. */
export type AppType = typeof app;

/* ------------------------------------------------------------------ *
 * Ever-green cron entrypoint (wrangler.jsonc `triggers.crons`, 1/min).
 *
 * The ladder used to be pull-only: with no visitors the KV snapshot aged
 * unboundedly, and a failed scrape served the stale-cache rung — the
 * "last updated 3 hours ago" symptom. The cron re-runs the SAME ladder
 * (not a private path): getRates() honors the per-source fresh window
 * (tgju 300s / frankfurter 900s — fresh cache → zero scrapes) and
 * MIN_SCRAPE_INTERVAL_SEC, so the effective TGJU cadence is ~1 scrape /
 * 5 min. Frankfurter is ECB reference data (updates ~once per business
 * day), runs on the quarter hour, and its 15-min fresh window keeps the
 * fetch-context requests on the fresh-cache rung between cron ticks.
 * Failures are logged (observability) and never rethrow — a thrown
 * handler marks the whole cron invocation failed in the CF dashboard.
 * ------------------------------------------------------------------ */

/** Minutes (UTC) on which the cron also refreshes the Frankfurter source. */
const FRANKFURTER_CRON_MOD_MIN = 15;

async function runScheduled(env: Bindings, scheduledTimeMs: number): Promise<void> {
  const service = makeDefaultService(env);
  const minute = new Date(scheduledTimeMs).getUTCMinutes();
  const sources: SnapshotSource[] = minute % FRANKFURTER_CRON_MOD_MIN === 0
    ? ['tgju', 'frankfurter']
    : ['tgju'];
  await Promise.all(
    sources.map(async (source) => {
      try {
        const response = await service.getRates(source);
        // Task 24: record every live-scraped generation — the content
        // fingerprint inside recordHistory makes unchanged re-quotes no-ops.
        if (response.servedFrom === 'live') {
          try {
            const recorded = await recordHistory(env.RATES, source, response.snapshot);
            if (recorded) {
              console.log(`[history] ${source} recorded generation ${response.snapshot.fetchedAt}`);
            }
          } catch (err) {
            console.warn(`[history] record ${source} failed:`, err instanceof Error ? err.message : err);
          }
        }
        console.log(
          `[cron] ${source} ok — servedFrom=${response.servedFrom} fetchedAt=${response.snapshot.fetchedAt}${response.stale ? ' (STALE)' : ''}`,
        );
      } catch (err) {
        // Ladder bottom rung (no usable cache): logged, retried next tick.
        console.warn(`[cron] ${source} failed:`, err instanceof Error ? err.message : err);
      }
    }),
  );
}

export default {
  fetch: async (request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> =>
    app.fetch(request, env, ctx),
  scheduled: (event: ScheduledController, env: Bindings, ctx: ExecutionContext): Promise<void> => {
    const work = runScheduled(env, event.scheduledTime);
    ctx.waitUntil(work);
    return work;
  },
};
