/**
 * Page-division projection routes (S2, 2026-11-08 —
 * docs/page-division/02-PAGE-DIVISION-SPEC.md §14 + the roadmap's S2).
 *
 *   GET /api/insights/pages        — the projection surface's index
 *                                     (9 destinations: counts, boards,
 *                                     decisions — static per deploy)
 *   GET /api/insights/pages/:page  — ONE destination's data projection
 *                                     (home + mirror readings, the boards
 *                                     manifest, honest absentIds)
 *
 * The contract between engine and pages: every destination page fetches
 * ONE curated payload instead of the legacy full snapshot — the placement
 * itself lives in @currena/insights/page-division (shared by the API, the
 * SPA and the PLACEMENT.generated.md generator, so the three cannot
 * drift).
 *
 * Serving discipline — inherited, not reinvented:
 *
 *  - **Gate + rate limit.** These routes mount INSIDE createInsightsRoutes
 *    below the auth middleware and the M-4 data bucket, so the private
 *    gate, the 120/60 token bucket and the no-store private caching all
 *    apply exactly as they do to GET /api/insights.
 *  - **Mode-appropriate snapshot.** The reader is the same getReader the
 *    composition root resolves per access mode — public mode projects the
 *    PUBLIC projection (licence-hidden ids absent → the payload's
 *    absentIds says so honestly), private mode the full document.
 *  - **Live-prices overlay.** The same merge as GET /api/insights: the
 *    ribbon/hero/commodity live values ride the readings (a missing or
 *    poisoned prices key degrades calmly to the EOD backbone).
 *  - **Caching.** The page payload rides the snapshot's own generation
 *    stamps for its ETag (`insights-page:{page}:{generatedAt}+prices:{…}`,
 *    the GET / pattern) with max-age=60; the index is deploy-static with a
 *    content-hash ETag and max-age=3600.
 *  - **Fail closed.** Unknown page ids answer 404 unknown_page with zero
 *    data BEFORE any read; a store rejection is the calm 503 with its own
 *    machine code (KV-failure honesty, QA audit A-2); ids the served
 *    snapshot lacks are REPORTED in absentIds, never guessed.
 *
 * Registered BEFORE /:id/history so the literal /pages paths win over the
 * parameterised id route (the /markets, /fx, /tic house pattern).
 */

import type { InsightsSnapshot, LivePricesSnapshot } from '@currena/core';
import { buildPageIndex, isPageDivisionPageId, projectSnapshotToPage } from '@currena/insights/page-division';
import { mergeLivePricesIntoSnapshot } from '@currena/insights/prices';
import type { PricesReader } from '@currena/insights/prices';
import type { InsightsReader } from '@currena/insights/store';
import { Hono } from 'hono';
import { errorResponse } from '../http';
import type { Bindings } from '../index';

/** The composition root's deps, reused (see InsightsRouteDeps in insights.ts). */
export interface InsightsPagesRouteDeps {
  /** The mode-aware snapshot reader (private full vs public projection). */
  getReader: (env: Bindings) => Promise<InsightsReader>;
  /** The live-prices store for the serve-time overlay merge. */
  getPricesReader: (env: Bindings) => PricesReader;
}

/** The deploy-static index document (computed once — no snapshot read). */
const PAGE_INDEX_DOC = buildPageIndex();

/** Its content-addressed ETag — the web-standard subtle crypto (Workers + Node ≥ 20), memoized. */
let indexEtagPromise: Promise<string> | undefined;
function pageIndexEtag(): Promise<string> {
  indexEtagPromise ??= (async () => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(PAGE_INDEX_DOC)));
    const hex = Array.from(new Uint8Array(digest).slice(0, 8))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `"insights-pages-index:${hex}"`;
  })();
  return indexEtagPromise;
}

export function createInsightsPagesRoutes(deps: InsightsPagesRouteDeps): Hono<{ Bindings: Bindings }> {
  const app = new Hono<{ Bindings: Bindings }>();

  /* ------------------ GET /pages — the projection index ------------------ */
  app.get('/pages', async (c) => {
    const etag = await pageIndexEtag();
    if (c.req.header('if-none-match') === etag) {
      return c.body(null, 304, { 'Cache-Control': 'public, max-age=3600', ETag: etag });
    }
    return c.json(PAGE_INDEX_DOC, 200, {
      'Cache-Control': 'public, max-age=3600',
      ETag: etag,
    });
  });

  /* ---------------- GET /pages/:page — one destination ---------------- */
  app.get('/pages/:page', async (c) => {
    const page = c.req.param('page');
    if (!isPageDivisionPageId(page)) {
      // Fail closed, zero data, BEFORE any KV read — the same discipline
      // as the boards' hidden_site_mode refusals.
      return errorResponse(
        c,
        404,
        'unknown_page',
        `No such page projection: ${JSON.stringify(page)} — see GET /api/insights/pages for the destination list.`,
      );
    }

    // KV-failure honesty (QA audit A-2): a reader rejection is NOT "not
    // ready" — it is a degraded store. Same calm 503 surface, distinct
    // machine code for observability.
    let snapshot: InsightsSnapshot | undefined;
    try {
      snapshot = await (await deps.getReader(c.env)).getSnapshot();
    } catch (err) {
      console.warn('[insights-pages] snapshot read failed:', err instanceof Error ? err.message : err);
      return errorResponse(
        c,
        503,
        'pages_unavailable',
        'Page data is temporarily unavailable — please retry shortly.',
      );
    }
    if (!snapshot) {
      return errorResponse(
        c,
        503,
        'pages_not_ready',
        'No Insights snapshot stored yet — the daily ingestion run has not completed.',
      );
    }

    // The live-prices overlay — the GET / twin: merge before projecting so
    // the ribbon/hero/live-commodity readings carry the freshest quotes; a
    // missing or poisoned key degrades calmly to the EOD backbone.
    let live: LivePricesSnapshot | undefined;
    try {
      live = await deps.getPricesReader(c.env).getLivePrices();
    } catch (err) {
      console.warn('[insights-pages] live-prices read failed — serving the EOD snapshot:', err instanceof Error ? err.message : err);
    }
    const served = live !== undefined ? mergeLivePricesIntoSnapshot(snapshot, live) : snapshot;

    const projection = projectSnapshotToPage(served, page);

    // The ETag covers BOTH generations — a new hourly quote busts caches
    // the same way a new daily snapshot does (the GET / pattern).
    const etag = `"insights-page:${page}:${snapshot.generatedAt}+prices:${live?.generatedAt ?? 'none'}"`;
    if (c.req.header('if-none-match') === etag) {
      return c.body(null, 304, { 'Cache-Control': 'public, max-age=60', ETag: etag });
    }
    return c.json(projection, 200, { 'Cache-Control': 'public, max-age=60', ETag: etag });
  });

  return app;
}
