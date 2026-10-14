/**
 * Operational routes (Phase 3 split of the former index.ts monolith):
 *
 *   GET  /api/health  — deep liveness (version + KV reachability, BACKLOG #39)
 *   GET  /api/status  — per-source SourceStatus + cache age
 *   GET  /api/meta    — currency asset list + limitations
 */

import { CORE_VERSION } from '@currena/core';
import { Hono } from 'hono';
import { buildMeta } from '../meta';
import { NO_STORE } from '../http';
import { RatesService } from '../rates-service';
import type { Bindings } from '../index';

interface OpsRouteDeps {
  /** Service construction (route tests inject a fake ladder). */
  makeService: (env: Bindings) => RatesService;
}

export function createOpsRoutes(deps: OpsRouteDeps): Hono<{ Bindings: Bindings }> {
  const app = new Hono<{ Bindings: Bindings }>();

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

  app.get('/api/status', async (c) => {
    const report = await deps.makeService(c.env).status();
    return c.json(report, 200, NO_STORE);
  });

  app.get('/api/meta', (c) => {
    // Static data + zod-validated shape; safe to cache briefly.
    return c.json(buildMeta(), 200, { 'Cache-Control': 'public, max-age=300' });
  });

  return app;
}
