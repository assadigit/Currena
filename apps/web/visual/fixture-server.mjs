/**
 * fixture-server.mjs — the visual-harness fixture server (PH1-VISUAL).
 *
 * A zero-dependency node:http server that serves, on the port in
 * FIXTURE_PORT (default 4050):
 *
 *   (a) the BUILT SPA from apps/web/dist — or a clear 500 error page when
 *       dist/index.html is missing (run `pnpm --filter @currena/web build`),
 *   (b) GET /api/insights               → visual/fixtures/snapshot.json,
 *   (c) GET /api/insights/:id/history   → visual/fixtures/history-<id>.json
 *       (missing id → 404 history_not_found, like production),
 *   (d) GET /api/insights/status        → visual/fixtures/status.json,
 *   (e) GET /api/insights/markets       → visual/fixtures/markets.json
 *       (private-mode parity, so U-11 can test the stock board),
 *       GET /api/insights/fx            → 404 hidden_site_mode (public-mode
 *       parity: the currencies feed is licence-hidden on the fixture page),
 *   (f) every other /api/* path         → 404 with a RatesError envelope.
 *
 * Non-API GETs fall back to dist/index.html (hash-router SPA). This server
 * NEVER touches a live site: it serves only the synthetic fixtures built by
 * build-fixtures.ts, so the U-xx acceptance tests cannot leak onto production
 * (worklog rule: "Tests never hit live sites"). Nothing sensitive is logged —
 * there is nothing sensitive to log.
 */

/* Node globals for `pnpm lint` (no eslint languageOptions block covers this
 * directory; the shared flat config maps globals per-path — see
 * eslint.config.mjs, which this task adds no entries to). */
/* global process, URL */

import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(HERE, '..');
const DIST = path.join(WEB_ROOT, 'dist');
const FIXTURES = path.join(HERE, 'fixtures');
const PORT = Number(process.env.FIXTURE_PORT ?? process.env.PORT ?? 4050);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.ics': 'text/calendar; charset=utf-8',
  '.map': 'application/json',
};

/** The RatesError envelope (packages/core RatesErrorSchema shape). */
function sendJson(res, status, body, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  });
  res.end(payload);
}

function sendError(res, status, code, message) {
  sendJson(res, status, { error: { code, message } });
}

function readFixture(name) {
  return JSON.parse(readFileSync(path.join(FIXTURES, name), 'utf8'));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] ?? 'application/octet-stream';
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(readFileSync(filePath));
}

const NO_DIST_PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>Visual harness: no build</title></head>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem">
<h1>Visual harness: the SPA build is missing</h1>
<p>The fixture server is running, but <code>apps/web/dist/index.html</code> does not exist yet.</p>
<p>Build the SPA first:</p>
<pre style="background:#f4f4f5;padding:1rem;border-radius:.5rem">pnpm --filter @currena/web build</pre>
<p>Then re-run the visual suite. (The fixture API routes work regardless.)</p>
</body></html>`;

const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url ?? '/', 'http://localhost');
  } catch {
    sendError(res, 400, 'bad_request', 'Malformed request URL');
    return;
  }
  const pathname = decodeURIComponent(url.pathname);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendError(res, 405, 'method_not_allowed', `Method ${req.method} is not supported by the fixture server`);
    return;
  }

  /* ---------------- API routes (fixture snapshots only) ---------------- */

  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/insights') {
      sendJson(res, 200, readFixture('snapshot.json'), { etag: '"fixture-insights"' });
      return;
    }
    if (pathname === '/api/insights/status') {
      sendJson(res, 200, readFixture('status.json'), { etag: '"fixture-status"' });
      return;
    }
    if (pathname === '/api/insights/markets') {
      // Private-mode parity: the full private snapshot shows the stock board.
      sendJson(res, 200, readFixture('markets.json'), { etag: '"fixture-markets"' });
      return;
    }
    if (pathname === '/api/insights/fx') {
      // Public-mode parity for the twin feed: licence-hidden → hidden_site_mode.
      sendError(res, 404, 'hidden_site_mode', 'This section is not published on the fixture.');
      return;
    }
    if (pathname === '/api/insights/export') {
      // The owner-only export is served by the REAL Worker only (apps/api
      // routes/insights.ts — GET /api/insights/export, gated by the
      // INSIGHTS_OWNER_TOKEN bearer, 401/403 without it, RULES.md M-3). The
      // visual harness boots a local wrangler-dev instance of that Worker
      // (playwright.config.ts webServer, :8799) and U-14 asserts the 401/403
      // refusal against it — this zero-dependency fixture server cannot
      // host the Worker and intentionally keeps answering 404 for the path.
      sendError(res, 404, 'not_found', 'The owner-only export is not part of the fixture server (real Worker route).');
      return;
    }
    const history = pathname.match(/^\/api\/insights\/([^/]+)\/history$/);
    if (history) {
      const file = path.join(FIXTURES, `history-${history[1]}.json`);
      if (existsSync(file)) {
        sendJson(res, 200, JSON.parse(readFileSync(file, 'utf8')), { etag: `"fixture-hist-${history[1]}"` });
      } else {
        // Production parity: single-point cards carry no history key.
        sendError(res, 404, 'history_not_found', `No stored history for '${history[1]}'`);
      }
      return;
    }
    // Everything else under /api:
    sendError(res, 404, 'not_found', `No fixture route for ${pathname}`);
    return;
  }

  /* ---------------- health probe for Playwright's webServer ---------------- */

  if (pathname === '/healthz') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('ok');
    return;
  }

  /* ---------------- the built SPA + static assets ---------------- */

  if (!existsSync(path.join(DIST, 'index.html'))) {
    res.writeHead(500, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(NO_DIST_PAGE);
    return;
  }

  const candidate = path.join(DIST, path.normalize(pathname).replace(/^([/\\])+/, ''));
  const inside = candidate.startsWith(DIST);
  if (inside && existsSync(candidate) && statSync(candidate).isFile()) {
    sendFile(res, candidate);
    return;
  }
  // Hash-router SPA fallback (all non-API GETs serve the shell).
  sendFile(res, path.join(DIST, 'index.html'));
});

server.listen(PORT, () => {
  // One quiet startup line; nothing sensitive is ever logged (fixtures only).
  process.stderr.write(`fixture-server: http://localhost:${PORT} (dist: ${existsSync(path.join(DIST, 'index.html')) ? 'ready' : 'MISSING — run pnpm --filter @currena/web build'})\n`);
});
