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
 * M5 (spec §11 staged rollout): the response is `{ ...doc, visible }`
 * — the stored KV document VERBATIM, plus ONE additive boolean flag
 * `visible` derived from `env.NARRATOR_VISIBLE === 'true'` (D-34 + D-39).
 * The web reads `visible` to decide whether the narrative blocks render
 * on the public URL or only at `?narrative=preview` — the preview marker
 * works REGARDLESS of `visible` (the owner's "read real text for a week
 * before flipping" path). `visible` is a runtime/env signal, never part
 * of the stored doc (the doc stays display-only-stable across deploys).
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
    // M5: spread the doc verbatim and add the additive `visible` flag from
    // the runtime env (D-34: NARRATOR_VISIBLE is display-only — the texts
    // always live in KV; the flag just gates the public URL path).
    return c.json({ ...doc, visible: c.env.NARRATOR_VISIBLE === 'true' }, 200, {
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    });
  });

  return app;
}
