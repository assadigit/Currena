import { Hono } from 'hono';

/**
 * @currena/api — Hono on Cloudflare Workers.
 *
 * Phase 0: minimal health endpoint so the Phase 2 spike has something to deploy.
 * Phase 4 adds the real surface (per mission §7):
 *   GET  /api/rates                       — fallback ladder (§6)
 *   GET  /api/convert?from&to&amount      — server-side math via @currena/core
 *   GET  /api/meta                        — asset list for UI dropdowns
 *   GET  /api/status                      — per-source last_status
 *   POST /internal/refresh                — header-secret manual scrape
 * RPC types are exported so apps/web uses hc<AppType>.
 */

const app = new Hono();

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    service: 'currena-api',
    phase: 0,
    time: new Date().toISOString(),
  }),
);

export default app;
