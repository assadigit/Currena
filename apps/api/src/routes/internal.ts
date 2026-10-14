/**
 * POST /internal/refresh (Phase 3 split of the former index.ts monolith):
 * header-secret manual scrape bypassing MIN_SCRAPE_INTERVAL_SEC (still
 * best-effort single-flight).
 */

import { Hono } from 'hono';
import { errorResponse, parseSourceParam } from '../http';
import { clientIp, rateLimitTake, rateLimitRetryAfterSec, secretMatches } from '../security';
import { RatesService, RatesServiceError } from '../rates-service';
import type { Bindings } from '../index';

export interface InternalRouteDeps {
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
      const response = await deps.makeService(c.env).getRates(source, { force: true });
      return c.json(response, 200, { 'Cache-Control': 'no-store' });
    } catch (err) {
      if (err instanceof RatesServiceError) {
        return errorResponse(c, 503, err.code, err.message, err.retryAfterSec);
      }
      throw err;
    }
  });

  return app;
}
