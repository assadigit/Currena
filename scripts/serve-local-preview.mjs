/**
 * serve-local-preview.mjs — serves the built SPA (apps/web/dist) with
 * every /api route proxied to the live site (the S5 pattern: production
 * serves the S2 projection endpoints, so the freshly built SPA — with
 * the newest page builds — renders over the REAL stored data).
 *
 * Usage: node scripts/serve-local-preview.mjs [port]   (default 8899)
 *   UPSTREAM=https://currena.ir node scripts/serve-local-preview.mjs
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(HERE, '../apps/web/dist');
const UPSTREAM = process.env.UPSTREAM ?? 'https://currena.ir';
const PORT = Number(process.argv[2] ?? 8899);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json',
  '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  try {
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/internal/')) {
      const upstream = await fetch(`${UPSTREAM}${req.url}`, {
        method: req.method,
        headers: { accept: req.headers.accept ?? 'application/json', 'user-agent': 'CurrenaLocalPreview/1.0' },
      });
      const headers = { 'content-type': upstream.headers.get('content-type') ?? 'application/json' };
      const etag = upstream.headers.get('etag');
      if (etag !== null) headers.etag = etag;
      res.writeHead(upstream.status, headers);
      return res.end(Buffer.from(await upstream.arrayBuffer()));
    }
    let file = join(DIST, decodeURIComponent(url.pathname).replace(/^([.]{2}[/\\])+/, ''));
    try { await stat(file); } catch { file = join(DIST, 'index.html'); }
    if ((await stat(file)).isDirectory()) file = join(DIST, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    res.writeHead(500); res.end(String(err));
  }
});
server.listen(PORT, () => console.log(`[preview] http://localhost:${PORT}/ — dist ${DIST} · upstream ${UPSTREAM}`));
