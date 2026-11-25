/* =================================================================== *
 * CONFIG BLOCK — the /tools public mount (spec COMPOUND-WEALTH-SPEC §3)
 *
 * The desk app is built with basePath /gold (the zone routes claim
 * currena.ir/gold for this worker). The tools live at the PUBLIC URLs
 * currena.ir/tools and currena.ir/tools/compound-wealth. Next 16
 * forbids internal rewrites outside the basePath (and a basePath'd
 * proxy never sees raw outside paths), so this wrapper — the entry the
 * worker actually deploys — owns the whole /tools namespace:
 *
 *   1. /tools/…/ (trailing slash) → 301 to the canonical no-slash URL
 *      (the spec asks for 301, not Next's built-in 308);
 *   2. /tools/* → internally rewritten onto the basePath-mounted app
 *      route, so direct links and refreshes serve the pages at the
 *      public URL (the browser address never changes);
 *   3. /gold/tools/* → 301 to the canonical public spelling, so the
 *      internal and public URLs never coexist.
 *
 * Unknown paths under /tools/ flow through to the app's own 404. The
 * gold namespace passes through untouched. The sandbox dev server
 * (no basePath, no worker wrapper) serves /tools/* natively;
 * src/proxy.ts gives it the same 301s.
 * =================================================================== */

/** The public tools prefix. */
const TOOLS_PREFIX = "/tools";

/** The app's basePath mount (the imported worker sets the authoritative
 *  value on globalThis at load; this is the fallback). */
function basePath(): string {
  return (globalThis as { __NEXT_BASE_PATH__?: string }).__NEXT_BASE_PATH__ ?? "/gold";
}

/* =================================================================== *
 * The wrapper                                                        *
 * =================================================================== */

// The generated OpenNext worker (gitignored build output; `bun run
// worker:build` recreates it before every deploy).
// @ts-expect-error — the generated bundle has no type declarations.
import * as openNextWorker from "./.open-next/worker.js";

/** A 301 that keeps the query string. */
function permanentRedirect(url: URL, pathname: string): Response {
  const target = new URL(url);
  target.pathname = pathname;
  return new Response(null, { status: 301, headers: { Location: target.toString() } });
}

/** Re-dispatch a request at a different path (an internal rewrite). */
function requestAt(request: Request, url: URL, pathname: string): Request {
  const target = new URL(url);
  target.pathname = pathname;
  return new Request(target, request);
}

const worker = openNextWorker as {
  default: { fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> };
};

export default {
  async fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const base = basePath();

    // The tools' public namespace.
    if (path === TOOLS_PREFIX || path.startsWith(`${TOOLS_PREFIX}/`)) {
      // 1. Canonicalise the trailing slash (301).
      if (path.length > 1 && path.endsWith("/")) {
        return permanentRedirect(url, path.replace(/\/+$/, ""));
      }
      // 2. Serve at the public URL by rewriting onto the basePath mount.
      return worker.default.fetch(requestAt(request, url, base + path), env, ctx);
    }

    // 3. The internal spelling always points at the public one.
    const internalTools = `${base}${TOOLS_PREFIX}`;
    if (base && (path === internalTools || path.startsWith(`${internalTools}/`))) {
      const publicPath = path.slice(base.length) || TOOLS_PREFIX;
      return permanentRedirect(url, publicPath);
    }

    // Everything else — the gold namespace and the app itself — untouched.
    return worker.default.fetch(request, env, ctx);
  },
} as { fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> };

// Re-export the generated worker's named exports (the durable-object
// and cache-purge classes wrangler may bind).
export * from "./.open-next/worker.js";
