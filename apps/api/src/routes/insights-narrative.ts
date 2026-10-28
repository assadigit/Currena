/**
 * routes/insights-narrative.ts — M4 of the Layer-2 narrator build (spec
 * §9): `GET /api/insights/narrative` — the cached narrative endpoint.
 *
 * Serves the `insights:narrative:v1` KV document VERBATIM (the M4 cron
 * rung writes it; additive — the existing payloads are untouched). Edge
 * cache: `Cache-Control: public, max-age=300, s-maxage=600` (spec §9) so
 * visitors hit the edge, NOT the KV — visitor traffic costs zero KV reads
 * (D-38's budget: only the hourly cron rung touches the key).
 *
 * Access: NOT gated and NOT rate-limited (deliberately, D-38): the
 * document is derived exclusively from the PUBLIC projection snapshot +
 * the public boards, so it can never leak a private-only reading whatever
 * the site mode; it is Layer-1-copy-grade content, edge-cached like the
 * markets/fx boards. In private mode the page's display block is behind
 * the gate anyway — this endpoint simply keeps answering public-derived
 * text.
 *
 * Absent document (a fresh deploy before the first :50 rung): 404 with
 * the clean RatesError envelope — the display renders nothing (spec §11:
 * "Missing/failed fetch → render nothing; nothing breaks").
 */

import { Hono } from 'hono';
import { errorResponse } from '../http';
import { NARRATIVE_KV_KEY, parseNarrativeDoc } from '../narrator-cron';
import type { Bindings } from '../index';

export function createNarrativeRoutes(): Hono<{ Bindings: Bindings }> {
  const app = new Hono<{ Bindings: Bindings }>();

  app.get('/api/insights/narrative', async (c) => {
    const raw = await c.env.RATES.get(NARRATIVE_KV_KEY);
    const doc = parseNarrativeDoc(raw);
    if (doc === null) {
      return errorResponse(c, 404, 'narrative_not_ready', 'The plain-language narratives are not generated yet — the narrator runs hourly.');
    }
    return c.json(doc, 200, {
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    });
  });

  return app;
}
