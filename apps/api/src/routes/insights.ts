/**
 * Insights read routes (Phase I3, roadmap §2 "API"):
 *
 *   GET /api/insights                — the precomputed snapshot
 *   GET /api/insights/markets        — the world stock markets snapshot
 *   GET /api/insights/:id/history    — one indicator's downsampled 10-year series
 *
 * The Worker only READS what a scheduled job wrote (cheap: exactly one KV
 * read per request, no scoring at the edge — for the markets route the
 * read rides the spec's 1-hour KV edge cache, and the response itself is
 * double-cached: browser/CDN via Cache-Control and the Worker's own
 * caches.default). All routes carry content-addressed ETags +
 * If-None-Match 304s like /api/rates and /api/history, and a short public
 * cache (the payloads change at most once a day). Errors use the
 * RatesError envelope, same as the rest of /api.
 */

import { IndicatorIdSchema } from '@currena/core';
import type { IndicatorId, LivePricesSnapshot, RatesError } from '@currena/core';
import { Hono } from 'hono';
import type { Context } from 'hono';
import type { InsightsReader } from '@currena/insights/store';
import type { MarketsReader } from '@currena/insights/markets';
import { mergeLivePricesIntoSnapshot } from '@currena/insights/prices';
import type { PricesReader } from '@currena/insights/prices';
import type { Bindings } from '../index';

export interface InsightsRouteDeps {
  /** Store construction (route tests inject the in-memory fake). */
  getReader: (env: Bindings) => InsightsReader;
  /** Markets store construction (route tests inject the in-memory fake). */
  getMarketsReader: (env: Bindings) => MarketsReader;
  /** Live-prices store construction (route tests inject the in-memory fake). */
  getPricesReader: (env: Bindings) => PricesReader;
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
    // Live-prices overlay (2026-10-12): the hourly :13 cron rung stores
    // Yahoo quotes under insights:prices-live:v1; the serve path merges
    // them into the four Prices-board tiles + companions. A missing,
    // poisoned or unreadable key degrades CALMLY to the plain snapshot —
    // the daily EOD backbone answers alone, never an error.
    let live: LivePricesSnapshot | undefined;
    try {
      live = await deps.getPricesReader(c.env).getLivePrices();
    } catch (err) {
      console.warn('[insights] live-prices read failed — serving the EOD snapshot:', err instanceof Error ? err.message : err);
    }
    const served = mergeLivePricesIntoSnapshot(snapshot, live);
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
    // The Worker's own edge cache — absent in plain test runtimes.
    if (typeof caches !== 'undefined') {
      const edgeCached = await caches.default.match(c.req.raw);
      if (edgeCached !== undefined) return edgeCached;
    }
    const snapshot = await deps.getMarketsReader(c.env).getMarkets();
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
    const etag = `"insights-markets:${snapshot.generatedAt}"`;
    if (c.req.header('if-none-match') === etag) {
      return c.body(null, 304, { 'Cache-Control': 'public, max-age=300, s-maxage=3600', ETag: etag });
    }
    const response = c.json(snapshot, 200, {
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
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
