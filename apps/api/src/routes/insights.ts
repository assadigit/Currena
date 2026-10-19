/**
 * Insights read routes (Phase I3, roadmap §2 "API"; v3 mitigations M-2/M-3/
 * M-4/M-5 — RULES.md §3, T-24):
 *
 *   POST /api/insights/login         — the private gate's sign-in (Step 3 §2.2)
 *   POST /api/insights/mode           — M-5: the owner's runtime panic switch
 *                                       (owner bearer OR password session)
 *   GET  /api/insights/export         — M-3: the OWNER-ONLY full export
 *                                       (?format=md|csv|json, attachment)
 *   POST /api/insights/owner/session  — M-3: bearer → signed owner cookie
 *   GET  /api/insights                — the precomputed snapshot
 *   GET  /api/insights/markets        — the world stock markets snapshot
 *   GET  /api/insights/fx             — the world currencies snapshot
 *   GET  /api/insights/status         — the run status (M-2: trimmed publicly)
 *   GET  /api/insights/archive/:date  — a past day's snapshot
 *   GET  /api/insights/:id/history    — one indicator's series (M-2: the
 *                                       public history is bounded to the
 *                                       visible chart window for L2 ids)
 *
 * Access mode (access-mode.ts): every gate/hide/trim decision uses the
 * RESOLVED mode (PANIC_PRIVATE → the KV runtime override → ACCESS_MODE → the
 * legacy SITE_MODE; any private wins). Private mode = the gate re-arms
 * (Step 3 §2.2: 401 with no data, AC-01…AC-08) and the FULL documents serve.
 * Public mode = the projection + the licence hides (T-15), the Yahoo
 * live-prices merge skip (LR-02), the trimmed status and the bounded history
 * (M-2). The owner endpoints sit BEFORE the gate: the panic switch and the
 * export must work with no session at all (bearer-only).
 *
 * M-4: the data GETs ride a separate token bucket (`ip#insights-data`,
 * 120 burst / 60 per minute) mounted after the gate — generous for the SPA,
 * hostile to bulk copying. The login/admin/internal buckets are untouched.
 *
 * Authenticated (private-mode) responses carry `Cache-Control: private,
 * no-store` (AC-05, stamped by the gate after next()). The Worker only READS
 * what a scheduled job wrote (cheap: at most one KV read per request — the
 * access-mode read rides a per-isolate 60s memo). Routes carry
 * content-addressed ETags + If-None-Match 304s like /api/rates. Errors use
 * the RatesError envelope, same as the rest of /api.
 */

import { IndicatorIdSchema } from '@currena/core';
import type {
  FxSnapshot,
  IndicatorHistory,
  IndicatorId,
  InsightsSnapshot,
  InsightsStatus,
  LivePricesSnapshot,
  MarketsSnapshot,
} from '@currena/core';
import { Hono } from 'hono';
import type { Context } from 'hono';
import type { InsightsReader } from '@currena/insights/store';
import { reStaleMarketsSnapshot } from '@currena/insights/markets';
import type { MarketsReader } from '@currena/insights/markets';
import { reStaleFxSnapshot } from '@currena/insights/fx';
import type { FxReader } from '@currena/insights/fx';
import { mergeLivePricesIntoSnapshot } from '@currena/insights/prices';
import type { PricesReader } from '@currena/insights/prices';
import { z } from 'zod';
import { errorResponse, NO_STORE } from '../http';
import { getCookie } from 'hono/cookie';
import {
  handleInsightsLogin,
  requireInsightsAuth,
  INSIGHTS_SESSION_COOKIE,
  verifySessionToken,
} from '../insights-auth';
import { HIDDEN_INDICATOR_IDS } from '../public-mode';
import { PUBLIC_BOUNDED_HISTORY_IDS } from '../audit-sidecar';
import { primeAccessModeMemo, resolveAccessModeForRequest, type AccessMode } from '../access-mode';
import type { AccessModeKvStore } from '../adapters/access-mode-store';
import {
  checkOwnerAuth,
  INSIGHTS_OWNER_COOKIE,
  ownerAuthRequiredResponse,
  ownerBearerToken,
  ownerDisabledResponse,
  ownerSessionTokenFor,
  ownerTokenMatches,
} from '../owner-auth';
import {
  buildInsightsExportDoc,
  insightsExportFilename,
  renderExportCsv,
  renderExportMarkdown,
  type ExportFormat,
} from '../insights-export';
import {
  clientIp,
  insightsDataRateKey,
  INSIGHTS_DATA_RATE_CAPACITY,
  INSIGHTS_DATA_RATE_REFILL_PER_MIN,
  rateLimitRetryAfterSec,
  rateLimitTake,
} from '../security';
import type { Bindings } from '../index';

interface InsightsRouteDeps {
  /**
   * Store construction (route tests inject the in-memory fake). ASYNC since
   * the M-5 rework: the reader family (private vs public projection) follows
   * the RESOLVED access mode, so picking it may consult the mode's KV memo.
   */
  getReader: (env: Bindings) => Promise<InsightsReader>;
  /**
   * M-3: the export's reader — ALWAYS the PRIVATE document family, whatever
   * the site's access mode is (the owner's export is never reduced to the
   * public projection). Defaults to the mode-aware injected reader's private
   * construction in the composition root.
   */
  getExportReader: (env: Bindings) => InsightsReader;
  /** Markets store construction (route tests inject the in-memory fake). */
  getMarketsReader: (env: Bindings) => MarketsReader;
  /** Fx store construction (route tests inject the in-memory fake). */
  getFxReader: (env: Bindings) => FxReader;
  /** Live-prices store construction (route tests inject the in-memory fake). */
  getPricesReader: (env: Bindings) => PricesReader;
  /**
   * M-5: the access-mode KV access (adapters/access-mode-store.ts). Defaults
   * to the Workers KV adapter; tests inject a counting writable fake.
   */
  getAccessModeKv: (env: Bindings) => AccessModeKvStore;
  /**
   * Injectable clock for the serve-time staleness re-evaluation (audit
   * A-8, D-21) — defaults to the real time. Tests pin it so aged fixtures
   * flip deterministically instead of depending on the wall clock.
   */
  now?: () => Date;
}

/** M-2: the public history window — the most recent 400 calendar days. */
const PUBLIC_HISTORY_WINDOW_DAYS = 400;

/** M-5: the mode-set body contract. */
const ModeSetBodySchema = z.object({ mode: z.enum(['public', 'private']) });

/** M-2: the TRIMMED public status document (zod-parsed subset — the route
 * layer's own projection schema; the full document is packages/core's). */
const PublicInsightsStatusSchema = z.object({
  generatedAt: z.iso.datetime(),
  /** How many served readings are stale (from the mode-appropriate snapshot). */
  staleCount: z.number().int().nonnegative(),
  /** Failed sources — names only, never the per-source fetch details/URLs. */
  failedSources: z.array(z.object({ source: z.string().min(1), ok: z.literal(false) })),
  /** Validation outcomes — test id + pass flag only, no flagged ids, no failure lines. */
  validationSummary: z.array(z.object({ test: z.string().min(1), passed: z.boolean() })),
});

export function createInsightsRoutes(deps: InsightsRouteDeps): Hono<{ Bindings: Bindings }> {
  const app = new Hono<{ Bindings: Bindings }>();
  const now = deps.now ?? (() => new Date());

  /** The RESOLVED access mode for this request (M-5; KV-memoized per isolate). */
  const accessModeOf = (c: Context<{ Bindings: Bindings }>): Promise<AccessMode> =>
    resolveAccessModeForRequest(c.env, () => deps.getAccessModeKv(c.env).get(), Date.now());

  /** True when the request carries a valid password session (the mode switch
   * accepts the EXISTING owner login as an alternative to the bearer). */
  const hasValidInsightsSession = async (c: Context<{ Bindings: Bindings }>): Promise<boolean> => {
    const password = c.env.INSIGHTS_PASSWORD;
    if (password === undefined || password === '') return false;
    return verifySessionToken(getCookie(c, INSIGHTS_SESSION_COOKIE), password, Date.now());
  };

  /** The uniform 429 for the new endpoint families (mirror of internal.ts). */
  const rateLimited = (c: Context<{ Bindings: Bindings }>, key: string, what: string) =>
    errorResponse(c, 429, 'rate_limited', `Too many ${what} attempts — please wait a minute and retry.`, rateLimitRetryAfterSec(key));

  // The private gate (Step 3 §2.2 + M-5): ONE middleware wraps every data
  // route below. The owner-only endpoints mount BEFORE it (bearer-only
  // surfaces: they must work with no session at all — a panic must be
  // flippable while logged out).
  app.post('/login', handleInsightsLogin);

  /* --------------------- M-5: POST /mode (panic switch) ------------------ */
  app.post('/mode', async (c) => {
    const rlKey = `${clientIp(c)}#insights-mode`;
    if (!rateLimitTake(rlKey, Date.now())) return rateLimited(c, rlKey, 'mode-set');
    // Auth: the owner bearer OR the existing password session. When the
    // owner token is UNSET and no session verifies → 403 owner_disabled
    // (fail closed: an unconfigured switch has no attackable surface).
    const bearerOk = ownerTokenMatches(ownerBearerToken(c), c.env);
    if (!bearerOk && !(await hasValidInsightsSession(c))) {
      if (c.env.INSIGHTS_OWNER_TOKEN === undefined || c.env.INSIGHTS_OWNER_TOKEN === '') {
        return ownerDisabledResponse(c);
      }
      return ownerAuthRequiredResponse(c);
    }
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return errorResponse(c, 400, 'invalid_mode', 'Body must be JSON: {"mode":"public"|"private"}');
    }
    const parsed = ModeSetBodySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(c, 400, 'invalid_mode', 'Body must be {"mode":"public"|"private"}');
    }
    try {
      await deps.getAccessModeKv(c.env).put(parsed.data.mode);
    } catch (err) {
      console.warn('[insights] access-mode write failed:', err instanceof Error ? err.message : err);
      return errorResponse(c, 503, 'access_mode_write_failed', 'The mode switch is temporarily unavailable — please retry shortly.');
    }
    // The flip is visible on the very next request of THIS isolate (the memo
    // is primed; other isolates converge within the 60s bound).
    primeAccessModeMemo(parsed.data.mode, Date.now());
    return c.json({ mode: parsed.data.mode }, 200, { ...NO_STORE, 'X-Robots-Tag': 'noindex, nofollow' });
  });

  /* --------------------- M-3: GET /export (owner-only) ------------------ */
  app.get('/export', async (c) => {
    const rlKey = `${clientIp(c)}#insights-export`;
    if (!rateLimitTake(rlKey, Date.now())) return rateLimited(c, rlKey, 'export');
    const auth = await checkOwnerAuth(c, Date.now());
    if (auth === 'owner_disabled') return ownerDisabledResponse(c);
    if (auth === 'unauthorized') return ownerAuthRequiredResponse(c);
    const rawFormat = c.req.query('format') ?? 'md';
    const parsedFormat = z.enum(['md', 'csv', 'json']).safeParse(rawFormat);
    if (!parsedFormat.success) {
      return errorResponse(c, 400, 'invalid_export_format', `Unknown export format ${JSON.stringify(rawFormat)} — must be md, csv or json`);
    }
    const format: ExportFormat = parsedFormat.data;

    // The CURRENT PRIVATE snapshot — whatever the site's access mode is.
    let snapshot: InsightsSnapshot | undefined;
    try {
      snapshot = await deps.getExportReader(c.env).getSnapshot();
    } catch (err) {
      console.warn('[insights] export snapshot read failed:', err instanceof Error ? err.message : err);
      return errorResponse(c, 503, 'export_unavailable', 'The export is temporarily unavailable — please retry shortly.');
    }
    if (snapshot === undefined) {
      return errorResponse(c, 503, 'export_not_ready', 'No Insights snapshot stored yet — the daily ingestion run has not completed.');
    }
    // The live-prices overlay merges exactly like the private serve path
    // (the page's export input); a missing/poisoned key degrades calmly.
    let live: LivePricesSnapshot | undefined;
    try {
      live = await deps.getPricesReader(c.env).getLivePrices();
    } catch (err) {
      console.warn('[insights] export live-prices read failed — exporting the EOD snapshot:', err instanceof Error ? err.message : err);
    }
    const served = live !== undefined ? mergeLivePricesIntoSnapshot(snapshot, live) : snapshot;
    // The boards: absent sections degrade calmly (the doc omits them).
    const markets = await deps
      .getMarketsReader(c.env)
      .getMarkets()
      .then((board): MarketsSnapshot | null => board ?? null)
      .catch((): MarketsSnapshot | null => null);
    const fx = await deps
      .getFxReader(c.env)
      .getFx()
      .then((board): FxSnapshot | null => board ?? null)
      .catch((): FxSnapshot | null => null);

    const doc = buildInsightsExportDoc({ snapshot: served, markets, fx });
    const body = format === 'json' ? JSON.stringify(doc) : format === 'csv' ? renderExportCsv(doc) : renderExportMarkdown(doc);
    const contentType =
      format === 'json' ? 'application/json; charset=utf-8' : format === 'csv' ? 'text/csv; charset=utf-8' : 'text/markdown; charset=utf-8';
    return c.body(body, 200, {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${insightsExportFilename(served.generatedAt, format)}"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    });
  });

  /* --------------- M-3: POST /owner/session (bearer → cookie) ------------ */
  app.post('/owner/session', async (c) => {
    const rlKey = `${clientIp(c)}#insights-owner-session`;
    if (!rateLimitTake(rlKey, Date.now())) return rateLimited(c, rlKey, 'owner-session');
    const ownerToken = c.env.INSIGHTS_OWNER_TOKEN;
    if (ownerToken === undefined || ownerToken === '') return ownerDisabledResponse(c);
    if (!ownerTokenMatches(ownerBearerToken(c), c.env)) return ownerAuthRequiredResponse(c);
    const { token, maxAge } = await ownerSessionTokenFor(ownerToken, Date.now());
    c.header(
      'Set-Cookie',
      `${INSIGHTS_OWNER_COOKIE}=${token}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`,
    );
    return c.json({ ok: true }, 200, { ...NO_STORE, 'X-Robots-Tag': 'noindex, nofollow' });
  });

  app.use('*', requireInsightsAuth({ accessModeOf }));

  /* -------- M-4: the data bucket on every data GET below the gate -------- */
  app.use('*', async (c, next) => {
    const rlKey = insightsDataRateKey(clientIp(c));
    if (
      !rateLimitTake(rlKey, Date.now(), INSIGHTS_DATA_RATE_CAPACITY, INSIGHTS_DATA_RATE_REFILL_PER_MIN)
    ) {
      return errorResponse(
        c,
        429,
        'rate_limited',
        'Too many requests — please slow down.',
        rateLimitRetryAfterSec(rlKey, INSIGHTS_DATA_RATE_REFILL_PER_MIN),
      );
    }
    await next();
  });

  app.get('/', async (c) => {
    // KV-failure honesty (QA audit A-2): a reader rejection is NOT "not
    // ready" — it is a degraded store. Same calm 503 surface, distinct
    // machine code for observability; the SPA's insights client already
    // treats any non-200 as its designed "being prepared" fallback.
    let snapshot: InsightsSnapshot | undefined;
    try {
      snapshot = await (await deps.getReader(c.env)).getSnapshot();
    } catch (err) {
      console.warn('[insights] snapshot read failed:', err instanceof Error ? err.message : err);
      return errorResponse(
        c,
        503,
        'insights_unavailable',
        'Insights are temporarily unavailable — please retry shortly.',
      );
    }
    if (!snapshot) {
      return errorResponse(
        c,
        503,
        'insights_not_ready',
        'No Insights snapshot stored yet — the daily ingestion run has not completed.',
      );
    }
    // Live-prices overlay (2026-10-12): the hourly :13 cron rung stores
    // Yahoo quotes under insights:prices-live:v1; the serve path merges
    // them into the four Prices-board tiles + companions. A missing,
    // poisoned or unreadable key degrades CALMLY to the plain snapshot —
    // the daily EOD backbone answers alone, never an error.
    // PUBLIC MODE (2026-10-19, LR-02 / M-2): the quotes are Yahoo-sourced —
    // the merge is skipped entirely and the projection's EOD backbone
    // answers alone (its price rows are hidden by the overrides anyway).
    let live: LivePricesSnapshot | undefined;
    if ((await accessModeOf(c)) !== 'public') {
      try {
        live = await deps.getPricesReader(c.env).getLivePrices();
      } catch (err) {
        console.warn('[insights] live-prices read failed — serving the EOD snapshot:', err instanceof Error ? err.message : err);
      }
    }
    const served = live !== undefined ? mergeLivePricesIntoSnapshot(snapshot, live) : snapshot;
    // The ETag covers BOTH generations — a new hourly quote busts caches the
    // same way a new daily snapshot does.
    const etag = `"insights:${snapshot.generatedAt}+prices:${live?.generatedAt ?? 'none'}"`;
    if (c.req.header('if-none-match') === etag) {
      return c.body(null, 304, { 'Cache-Control': 'public, max-age=60', ETag: etag });
    }
    return c.json(served, 200, { 'Cache-Control': 'public, max-age=60', ETag: etag });
  });

  // World stock markets (insights-world-markets-spec.md §4 rule 5): the
  // ONE-key snapshot, served read-only. Registered BEFORE /:id/history so
  // the literal path wins over the parameterised one.
  app.get('/markets', async (c) => {
    // PUBLIC MODE (2026-10-19, LR-02): the board is EODHD/Yahoo-backed end
    // to end — it must never appear in public mode (the T-15 build gate
    // verifies the overrides file declares it hidden). 404 with zero
    // data, BEFORE any KV read.
    if ((await accessModeOf(c)) === 'public') {
      return errorResponse(c, 404, 'hidden_site_mode', 'This section is not published on the public site.');
    }
    // The Worker's own edge cache — absent in plain test runtimes.
    if (typeof caches !== 'undefined') {
      const edgeCached = await caches.default.match(c.req.raw);
      if (edgeCached !== undefined) return edgeCached;
    }
    // KV-failure honesty (QA audit A-2) — same calm 503, distinct code.
    let snapshot: MarketsSnapshot | undefined;
    try {
      snapshot = await deps.getMarketsReader(c.env).getMarkets();
    } catch (err) {
      console.warn('[insights] markets read failed:', err instanceof Error ? err.message : err);
      return errorResponse(
        c,
        503,
        'markets_unavailable',
        'World markets are temporarily unavailable — please retry shortly.',
      );
    }
    if (!snapshot) {
      // The calm "being prepared" answer: the section has never been
      // populated (fresh deploy, or the scheduled job has not landed yet).
      return errorResponse(
        c,
        503,
        'markets_not_ready',
        'No world-markets snapshot stored yet — the scheduled job has not completed.',
      );
    }
    // A-8 (D-21): re-evaluate per-row staleness at SERVE time — the stored
    // flag freezes at write time, so a multi-day double-cron failure would
    // otherwise keep `stale:false` while asOf ages. Fresh snapshots come
    // back untouched (byte-identical); the 304 short-circuit below stays
    // cheap (no re-computation needed to answer "not modified").
    snapshot = reStaleMarketsSnapshot(snapshot, now().toISOString().slice(0, 10));
    const etag = `"insights-markets:${snapshot.generatedAt}"`;
    if (c.req.header('if-none-match') === etag) {
      return c.body(null, 304, { 'Cache-Control': 'public, max-age=300, s-maxage=300', ETag: etag });
    }
    const response = c.json(snapshot, 200, {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      ETag: etag,
    });
    if (typeof caches !== 'undefined') {
      // Best-effort warm of the Worker's edge cache; the response is
      // already on its way to the client.
      try {
        await caches.default.put(c.req.raw, response.clone());
      } catch {
        /* cache warm failures never fail the request */
      }
    }
    return response;
  });

  // World currencies (insights-world-currencies-spec.md §5 rules 3–4): the
  // ONE-key snapshot, served read-only behind the same cache discipline as
  // /markets (edge cache + ETag + the calm 503 "being prepared" answer).
  // Registered BEFORE /:id/history so the literal path wins.
  app.get('/fx', async (c) => {
    // PUBLIC MODE (2026-10-19, LR-02): the markets twin — EODHD/Yahoo-backed,
    // hidden by the overrides file, refused with zero data before any read.
    if ((await accessModeOf(c)) === 'public') {
      return errorResponse(c, 404, 'hidden_site_mode', 'This section is not published on the public site.');
    }
    // The Worker's own edge cache — absent in plain test runtimes.
    if (typeof caches !== 'undefined') {
      const edgeCached = await caches.default.match(c.req.raw);
      if (edgeCached !== undefined) return edgeCached;
    }
    // KV-failure honesty (QA audit A-2) — same calm 503, distinct code.
    let snapshot: FxSnapshot | undefined;
    try {
      snapshot = await deps.getFxReader(c.env).getFx();
    } catch (err) {
      console.warn('[insights] fx read failed:', err instanceof Error ? err.message : err);
      return errorResponse(
        c,
        503,
        'fx_unavailable',
        'World currencies are temporarily unavailable — please retry shortly.',
      );
    }
    if (!snapshot) {
      // The calm "being prepared" answer: the section has never been
      // populated (fresh deploy, or the scheduled job has not landed yet).
      return errorResponse(
        c,
        503,
        'fx_not_ready',
        'No world-currencies snapshot stored yet — the scheduled job has not completed.',
      );
    }
    // A-8 (D-21): the fx twin of the markets route's serve-time staleness
    // re-evaluation — same shape, honestly flipped values, fresh snapshots
    // byte-identical.
    snapshot = reStaleFxSnapshot(snapshot, now().toISOString().slice(0, 10));
    const etag = `"insights-fx:${snapshot.generatedAt}"`;
    if (c.req.header('if-none-match') === etag) {
      return c.body(null, 304, { 'Cache-Control': 'public, max-age=300, s-maxage=300', ETag: etag });
    }
    const response = c.json(snapshot, 200, {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      ETag: etag,
    });
    if (typeof caches !== 'undefined') {
      // Best-effort warm of the Worker's edge cache; the response is
      // already on its way to the client.
      try {
        await caches.default.put(c.req.raw, response.clone());
      } catch {
        /* cache warm failures never fail the request */
      }
    }
    return response;
  });

  app.get('/status', async (c) => {
    // Fix spec A-08 (2026-10-14): the run status for the "About this data"
    // panel — the snapshot time with its time zone, the failed sources and
    // the validation results of the last refresh. One KV read, cached at the
    // edge for 5 minutes like the other reads.
    //
    // M-2 (v3): in PUBLIC mode the document is TRIMMED to the minimum the
    // visible page needs — {generatedAt, staleCount, failedSources (names
    // only), validationSummary (test + pass only)} — zod-parsed as a subset
    // before serving. No full validation details, no source fetch URLs, no
    // rule JSONs leave the private boundary. The mode resolution runs BEFORE
    // any edge-cache consult so a cached full (private) document can never
    // reach a public visitor after a flip; the public trim caches under its
    // own mode-scoped key, and the private full document is never edge-cached.
    const mode = await accessModeOf(c);
    if (mode === 'public') {
      const edgeKey = new Request(`${c.req.url}${new URL(c.req.url).search ? '&' : '?'}__access_mode=public`, {
        method: 'GET',
      });
      if (typeof caches !== 'undefined') {
        const edgeCached = await caches.default.match(edgeKey);
        if (edgeCached !== undefined) return edgeCached;
      }
      let status: InsightsStatus | undefined;
      let staleCount: number | undefined;
      try {
        const reader = await deps.getReader(c.env);
        const [readStatus, snapshot] = await Promise.all([reader.getStatus(), reader.getSnapshot()]);
        status = readStatus;
        // staleCount comes from the mode-appropriate snapshot (the public
        // projection in public mode); an absent snapshot degrades calmly
        // to 0 — the run status still serves.
        staleCount = snapshot?.readings.filter((r) => r.status === 'stale').length ?? 0;
      } catch (err) {
        console.warn('[insights] status read failed:', err instanceof Error ? err.message : err);
        return errorResponse(
          c,
          503,
          'insights_status_unavailable',
          'Insights status is temporarily unavailable — please retry shortly.',
        );
      }
      if (!status) {
        return errorResponse(
          c,
          503,
          'insights_status_not_ready',
          'No Insights status stored yet — the daily ingestion run has not completed.',
        );
      }
      const trimmed = PublicInsightsStatusSchema.parse({
        generatedAt: status.generatedAt,
        staleCount: staleCount ?? 0,
        failedSources: status.sources
          .filter((s) => !s.ok)
          .map((s) => ({ source: s.source, ok: false as const })),
        validationSummary: (status.validation ?? []).map((v) => ({ test: v.test, passed: v.ok })),
      });
      const etag = `"insights-status-public:${trimmed.generatedAt}:${trimmed.staleCount}:${trimmed.failedSources
        .map((f) => f.source)
        .join(',')}:${trimmed.validationSummary.map((v) => (v.passed ? 'p' : 'f')).join('')}"`;
      if (c.req.header('if-none-match') === etag) {
        return c.body(null, 304, { 'Cache-Control': 'public, max-age=300, s-maxage=300', ETag: etag });
      }
      const response = c.json(trimmed, 200, {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        ETag: etag,
      });
      if (typeof caches !== 'undefined') {
        try {
          await caches.default.put(edgeKey, response.clone());
        } catch {
          /* cache warm failures never fail the request */
        }
      }
      return response;
    }
    // Private mode: the FULL document (the owner's console unchanged).
    let status: InsightsStatus | undefined;
    try {
      status = await (await deps.getReader(c.env)).getStatus();
    } catch (err) {
      console.warn('[insights] status read failed:', err instanceof Error ? err.message : err);
      return errorResponse(
        c,
        503,
        'insights_status_unavailable',
        'Insights status is temporarily unavailable — please retry shortly.',
      );
    }
    if (!status) {
      return errorResponse(
        c,
        503,
        'insights_status_not_ready',
        'No Insights status stored yet — the daily ingestion run has not completed.',
      );
    }
    const etag = `"insights-status:${status.generatedAt}"`;
    if (c.req.header('if-none-match') === etag) {
      return c.body(null, 304, { 'Cache-Control': 'public, max-age=300, s-maxage=300', ETag: etag });
    }
    return c.json(status, 200, {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      ETag: etag,
    });
  });

  // Fix spec A-05 (2026-10-14): the daily snapshot archive — the exact
  // snapshot the page showed on a past day (values, statuses, calendar and
  // rule version), written by the ingest under insights:archive:v1:<date>.
  // Registered BEFORE /:id/history so the literal path wins.
  app.get('/archive/:date', async (c) => {
    const raw = c.req.param('date');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return errorResponse(
        c,
        400,
        'invalid_archive_date',
        `Archive date must be YYYY-MM-DD, received ${JSON.stringify(raw)}`,
      );
    }
    let snapshot: InsightsSnapshot | undefined;
    try {
      snapshot = await (await deps.getReader(c.env)).getArchive(raw);
    } catch (err) {
      console.warn('[insights] archive read failed:', err instanceof Error ? err.message : err);
      return errorResponse(
        c,
        503,
        'archive_unavailable',
        'The snapshot archive is temporarily unavailable — please retry shortly.',
      );
    }
    if (!snapshot) {
      return errorResponse(c, 404, 'archive_not_found', `No archived snapshot for ${raw}`);
    }
    const etag = `"insights-archive:${raw}:${snapshot.generatedAt}"`;
    if (c.req.header('if-none-match') === etag) {
      return c.body(null, 304, { 'Cache-Control': 'public, max-age=300', ETag: etag });
    }
    return c.json(snapshot, 200, { 'Cache-Control': 'public, max-age=300', ETag: etag });
  });

  app.get('/:id/history', async (c) => {
    const raw = c.req.param('id');
    const parsed = IndicatorIdSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse(
        c,
        400,
        'invalid_indicator',
        `Unknown indicator id ${JSON.stringify(raw)} — must be a v1 Insights indicator id`,
      );
    }
    const id: IndicatorId = parsed.data;
    const mode = await accessModeOf(c);
    // PUBLIC MODE (2026-10-19, LR-02): a hidden id's history IS its data —
    // refused with zero rows before any KV read.
    if (mode === 'public' && HIDDEN_INDICATOR_IDS.has(id)) {
      return errorResponse(c, 404, 'hidden_site_mode', 'This indicator is not published on the public site.');
    }
    // KV-failure honesty (QA audit A-2) — same calm 503, distinct code.
    let history: IndicatorHistory | undefined;
    try {
      history = await (await deps.getReader(c.env)).getHistory(id);
    } catch (err) {
      console.warn(`[insights] history read failed for ${id}:`, err instanceof Error ? err.message : err);
      return errorResponse(
        c,
        503,
        'indicator_history_unavailable',
        'Indicator history is temporarily unavailable — please retry shortly.',
      );
    }
    if (!history) {
      // Unknown id → 400 above; known id with no stored history (missing run,
      // or a single-point live card that never gets a key) → honest 404.
      return errorResponse(c, 404, 'history_not_found', `No stored history for '${id}'`);
    }
    // M-2 (RULES.md §3): PUBLIC mode serves no bulk history for L2 sources —
    // ids whose audit level is L2 while publicDisplayOk is 'yes' (the owner
    // accepted public display: brent, gold-usd, silver-usd, btc-usd) are
    // bounded to the most recent 400 CALENDAR days of points (the visible
    // chart's default toggles). The response keeps the SAME shape — the
    // client slices by range anyway — and the ETag is computed over the
    // TRUNCATED payload, so a public ETag never matches a private one.
    let points = history.points;
    if (mode === 'public' && PUBLIC_BOUNDED_HISTORY_IDS.has(id)) {
      const lastDay = points[points.length - 1]![0];
      const cutoff = lastDay - (PUBLIC_HISTORY_WINDOW_DAYS - 1);
      let start = 0;
      while (start < points.length && points[start]![0] < cutoff) start++;
      if (start > 0) points = points.slice(start);
    }
    const last = points[points.length - 1]!;
    const etag = `"insights-hist:${id}:${points.length}:${last[0]}"`;
    if (c.req.header('if-none-match') === etag) {
      return c.body(null, 304, { 'Cache-Control': 'public, max-age=300', ETag: etag });
    }
    return c.json({ v: history.v, id: history.id, points }, 200, {
      'Cache-Control': 'public, max-age=300',
      ETag: etag,
    });
  });

  return app;
}
