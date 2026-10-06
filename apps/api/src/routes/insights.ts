/**
 * Insights read routes (Phase I3, roadmap §2 "API"):
 *
 *   GET /api/insights                — the precomputed snapshot
 *   GET /api/insights/:id/history    — one indicator's downsampled 10-year series
 *
 * The Worker only READS what the GitHub Actions ingestion runner wrote
 * (cheap: exactly one KV read per request, no scoring at the edge). Both
 * routes carry content-addressed ETags + If-None-Match 304s like /api/rates
 * and /api/history, and a short public cache (the payload changes at most
 * once a day). Errors use the RatesError envelope, same as the rest of /api.
 */

import { IndicatorIdSchema } from '@currena/core';
import type { IndicatorId, RatesError } from '@currena/core';
import { Hono } from 'hono';
import type { Context } from 'hono';
import type { InsightsReader } from '@currena/insights/store';
import type { Bindings } from '../index';

export interface InsightsRouteDeps {
  /** Store construction (route tests inject the in-memory fake). */
  getReader: (env: Bindings) => InsightsReader;
}

/** Mirrors index.ts's errorResponse (private there) — same envelope, no import cycle. */
function errorResponse(
  c: Context<{ Bindings: Bindings }>,
  status: 400 | 404 | 503,
  code: string,
  message: string,
) {
  const body: RatesError = { error: { code, message } };
  return c.json(body, status, { 'Cache-Control': 'no-store' });
}

export function createInsightsRoutes(deps: InsightsRouteDeps): Hono<{ Bindings: Bindings }> {
  const app = new Hono<{ Bindings: Bindings }>();

  app.get('/', async (c) => {
    const snapshot = await deps.getReader(c.env).getSnapshot();
    if (!snapshot) {
      return errorResponse(
        c,
        503,
        'insights_not_ready',
        'No Insights snapshot stored yet — the daily ingestion run has not completed.',
      );
    }
    const etag = `"insights:${snapshot.generatedAt}"`;
    if (c.req.header('if-none-match') === etag) {
      return c.body(null, 304, { 'Cache-Control': 'public, max-age=60', ETag: etag });
    }
    return c.json(snapshot, 200, { 'Cache-Control': 'public, max-age=60', ETag: etag });
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
    const history = await deps.getReader(c.env).getHistory(id);
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
