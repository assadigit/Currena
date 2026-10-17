/**
 * Insights read routes (Phase I3, roadmap §2 "API"):
 *
 *   POST /api/insights/login        — the private gate's sign-in (Step 3 §2.2)
 *   GET /api/insights               — the precomputed snapshot
 *   GET /api/insights/markets       — the world stock markets snapshot
 *   GET /api/insights/fx            — the world currencies snapshot
 *   GET /api/insights/:id/history   — one indicator's downsampled 10-year series
 *
 * Step 3 §2.2 (runbook Phase 3, 2026-10-16): EVERY data route here sits
 * behind the private gate (`requireInsightsAuth`) — an unauthenticated
 * request returns 401 with no data; the page shell stays public. In
 * SITE_MODE=public the gate skips (content eligibility is T-15's job).
 * Authenticated responses carry `Cache-Control: private, no-store` (AC-05).
 * The Worker only READS what a scheduled job wrote (cheap: exactly one KV
 * read per request, no scoring at the edge — for the markets route the
 * read rides the spec's 5-minute KV edge cache). Routes carry
 * content-addressed ETags + If-None-Match 304s like /api/rates. Errors use
 * the RatesError envelope, same as the rest of /api.
 *
 * 2026-10-14 (owner-approved, D-13): the /markets and /fx edge TTL was
 * tightened from 1 hour to 5 minutes (s-maxage 3600 → 300, KV read
 * cacheTtl ditto) so a daily update becomes visible within ~5 minutes.
 * Paired with the zone-side Browser Cache TTL fix (D-12) that had been
 * rewriting the browser's max-age to 4 hours on edge-cache HITs.
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
import type { InsightsReader } from '@currena/insights/store';
import { reStaleMarketsSnapshot } from '@currena/insights/markets';
import type { MarketsReader } from '@currena/insights/markets';
import { reStaleFxSnapshot } from '@currena/insights/fx';
import type { FxReader } from '@currena/insights/fx';
import { mergeLivePricesIntoSnapshot } from '@currena/insights/prices';
import type { PricesReader } from '@currena/insights/prices';
import { errorResponse } from '../http';
import { handleInsightsLogin, requireInsightsAuth } from '../insights-auth';
import { HIDDEN_BOARDS, HIDDEN_INDICATOR_IDS, siteModeOf } from '../public-mode';
import type { Bindings } from '../index';

interface InsightsRouteDeps {
  /** Store construction (route tests inject the in-memory fake). */
  getReader: (env: Bindings) => InsightsReader;
  /** Markets store construction (route tests inject the in-memory fake). */
  getMarketsReader: (env: Bindings) => MarketsReader;
  /** Fx store construction (route tests inject the in-memory fake). */
  getFxReader: (env: Bindings) => FxReader;
  /** Live-prices store construction (route tests inject the in-memory fake). */
  getPricesReader: (env: Bindings) => PricesReader;
  /**
   * Injectable clock for the serve-time staleness re-evaluation (audit
   * A-8, D-21) — defaults to the real time. Tests pin it so aged fixtures
   * flip deterministically instead of depending on the wall clock.
   */
  now?: () => Date;
}

export function createInsightsRoutes(deps: InsightsRouteDeps): Hono<{ Bindings: Bindings }> {
  const app = new Hono<{ Bindings: Bindings }>();
  const now = deps.now ?? (() => new Date());

  // The private gate (Step 3 §2.2, runbook Phase 3): ONE middleware wraps
  // every data route below; the login route itself mounts BEFORE it.
  app.post('/login', handleInsightsLogin);
  app.use('*', requireInsightsAuth());

  app.get('/', async (c) => {
    // KV-failure honesty (QA audit A-2): a reader rejection is NOT "not
    // ready" — it is a degraded store. Same calm 503 surface, distinct
    // machine code for observability; the SPA's insights client already
    // treats any non-200 as its designed "being prepared" fallback.
    let snapshot: InsightsSnapshot | undefined;
    try {
      snapshot = await deps.getReader(c.env).getSnapshot();
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
    // PUBLIC MODE (2026-10-19, LR-02): the quotes are Yahoo-sourced — the
    // merge is skipped entirely and the projection's EOD backbone answers
    // alone (its price rows are hidden by the overrides anyway).
    let live: LivePricesSnapshot | undefined;
    if (siteModeOf(c.env) !== 'public') {
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
    // PUBLIC MODE (2026-10-19, LR-02 → 2026-10-18b owner directive): the
    // board's public visibility is the GENERATED overrides file's call —
    // data/site-mode-overrides.json no longer declares 'markets' hidden
    // (the owner restored the section on their own EODHD key), so public
    // mode serves it exactly like private mode. The fx twin stays hidden.
    // A future generator run that re-adds 'markets' to hiddenBoards arms
    // this refusal again — 404 with zero data, BEFORE any KV read.
    if (siteModeOf(c.env) === 'public' && HIDDEN_BOARDS.has('markets')) {
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
    // PUBLIC MODE (2026-10-19, LR-02 — still in force): the markets twin,
    // and unlike the markets board it carries NO owner directive — the
    // generated overrides file keeps 'fx' hidden, so public mode refuses
    // with zero data before any read. (If the owner ever lifts it, the
    // generator's OWNER_PUBLIC_BOARD_OVERRIDE + this check flip together.)
    if (siteModeOf(c.env) === 'public' && HIDDEN_BOARDS.has('fx')) {
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
    if (typeof caches !== 'undefined') {
      const edgeCached = await caches.default.match(c.req.raw);
      if (edgeCached !== undefined) return edgeCached;
    }
    let status: InsightsStatus | undefined;
    try {
      status = await deps.getReader(c.env).getStatus();
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
    const response = c.json(status, 200, {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      ETag: etag,
    });
    if (typeof caches !== 'undefined') {
      try {
        await caches.default.put(c.req.raw, response.clone());
      } catch {
        /* cache warm failures never fail the request */
      }
    }
    return response;
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
      snapshot = await deps.getReader(c.env).getArchive(raw);
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
    // PUBLIC MODE (2026-10-19, LR-02): a hidden id's history IS its data —
    // refused with zero rows before any KV read.
    if (siteModeOf(c.env) === 'public' && HIDDEN_INDICATOR_IDS.has(id)) {
      return errorResponse(c, 404, 'hidden_site_mode', 'This indicator is not published on the public site.');
    }
    // KV-failure honesty (QA audit A-2) — same calm 503, distinct code.
    let history: IndicatorHistory | undefined;
    try {
      history = await deps.getReader(c.env).getHistory(id);
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
    const last = history.points[history.points.length - 1]!;
    const etag = `"insights-hist:${id}:${history.points.length}:${last[0]}"`;
    if (c.req.header('if-none-match') === etag) {
      return c.body(null, 304, { 'Cache-Control': 'public, max-age=300', ETag: etag });
    }
    return c.json(history, 200, { 'Cache-Control': 'public, max-age=300', ETag: etag });
  });

  return app;
}
