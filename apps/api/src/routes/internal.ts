/**
 * POST /internal/refresh (Phase 3 split of the former index.ts monolith):
 * header-secret manual scrape bypassing MIN_SCRAPE_INTERVAL_SEC (still
 * best-effort single-flight).
 *
 * POST /internal/insights-ingest (2026-10-21 data-integrity round): the
 * SAME header-secret surface for the daily insights ingest — runs the
 * Worker rung's full orchestration on demand (the owner's ops lever when
 * a rung failed or fresh data is wanted early; the scheduled 04:10 rung
 * remains the primary). The route is rate-limited like the refresh twin.
 */

import { Hono } from 'hono';
import { errorResponse, parseSourceParam } from '../http';
import { clientIp, rateLimitTake, rateLimitRetryAfterSec, secretMatches } from '../security';
import { RatesService, RatesServiceError } from '../rates-service';
import { runScheduledInsightsIngest, runScheduledInsightsHistories } from '../insights-ingest-cron';
import { runExtraRung } from '../insights-extra-rungs';
import type { Bindings } from '../index';

interface InternalRouteDeps {
  /** Service construction (route tests inject a fake ladder). */
  makeService: (env: Bindings) => RatesService;
}

export function createInternalRoutes(deps: InternalRouteDeps): Hono<{ Bindings: Bindings }> {
  const app = new Hono<{ Bindings: Bindings }>();

  app.post('/internal/refresh', async (c) => {
    // Rate limit FIRST (BACKLOG #18) — same defense-in-depth as POST /admin.
    const rlKey = `${clientIp(c)}#internal`;
    if (!rateLimitTake(rlKey, Date.now())) {
      return errorResponse(
        c,
        429,
        'rate_limited',
        'Too many refresh attempts — wait a minute before trying again.',
        rateLimitRetryAfterSec(rlKey),
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
      const response = await deps.makeService(c.env).getRates(source, { force: true });
      return c.json(response, 200, { 'Cache-Control': 'no-store' });
    } catch (err) {
      if (err instanceof RatesServiceError) {
        return errorResponse(c, 503, err.code, err.message, err.retryAfterSec);
      }
      throw err;
    }
  });

  app.post('/internal/insights-ingest', async (c) => {
    // Rate limit FIRST — same defense-in-depth as POST /admin and the
    // refresh twin (the ingest is a heavyweight run: one at a time).
    const rlKey = `${clientIp(c)}#internal`;
    if (!rateLimitTake(rlKey, Date.now())) {
      return errorResponse(
        c,
        429,
        'rate_limited',
        'Too many refresh attempts — wait a minute before trying again.',
        rateLimitRetryAfterSec(rlKey),
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

    const phase = c.req.query('phase');
    if (phase === 'daily' || phase === 'daily-a' || phase === 'daily-b' || phase === 'periodic') {
      const result = await runScheduledInsightsHistories(c.env, phase);
      return c.json(
        { ok: result.ok, phase, written: result.written, unchanged: result.unchanged, singlePoint: result.singlePoint },
        200,
        { 'Cache-Control': 'no-store' },
      );
    }
    // gap-closure S2-M2.2: the extra-rung manual lever — runs rung3 AND
    // rung4 with the day gates BYPASSED (force mode). The TIC fetch (the
    // first registered source) is the post-deploy verification path:
    // curl -X POST '/internal/insights-ingest?phase=extra' with the
    // refresh secret, then read the rung status record.
    if (phase === 'extra') {
      const [rung3, rung4] = await Promise.all([
        runExtraRung(c.env, 3, { force: true }),
        runExtraRung(c.env, 4, { force: true }),
      ]);
      return c.json(
        {
          ok: rung3.rows.every((r) => r.ok) && rung4.rows.every((r) => r.ok),
          phase,
          rung3,
          rung4,
        },
        200,
        { 'Cache-Control': 'no-store' },
      );
    }
    if (phase !== undefined) {
      return errorResponse(
        c,
        400,
        'invalid_phase',
        `Invalid 'phase' parameter ${JSON.stringify(phase)} — must be 'daily', 'daily-a', 'daily-b', 'periodic' or 'extra' (or omitted for the main run)`,
      );
    }

    await runScheduledInsightsIngest(c.env);
    return c.json(
      { ok: true, ranAt: new Date().toISOString(), note: 'main ingest run complete — see /api/insights/status and the worker logs' },
      200,
      { 'Cache-Control': 'no-store' },
    );
  });

  return app;
}
