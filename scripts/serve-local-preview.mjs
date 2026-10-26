/**
 * serve-local-preview.mjs — serves the built SPA (apps/web/dist) with the
 * local live-snapshot preview at /api/insights (real data, the post-deploy
 * 100-reading shape); every other /api route proxies the live site.
 *
 * Usage: node scripts/serve-local-preview.mjs  (port 8899)
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const DIST = '/home/z/my-project/Currena/apps/web/dist';
const SNAPSHOT = '/tmp/local-snapshot.json';
const PORT = 8899;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json',
  '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  try {
    if (url.pathname === '/api/insights') {
      const body = await readFile(SNAPSHOT);
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      return res.end(body);
    }
    if (url.pathname.startsWith('/api/')) {
      const upstream = await fetch(`https://currena.ir${req.url}`);
      res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'application/json' });
      return res.end(Buffer.from(await upstream.arrayBuffer()));
    }
    let file = join(DIST, normalize(decodeURIComponent(url.pathname)).replace(/^([.]{2}[/\\])+/, ''));
    try { await stat(file); } catch { file = join(DIST, 'index.html'); }
    if ((await stat(file)).isDirectory()) file = join(DIST, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    res.writeHead(500); res.end(String(err));
  }
});
server.listen(PORT, () => console.log(`[preview] http://localhost:${PORT}/#/insights`));
