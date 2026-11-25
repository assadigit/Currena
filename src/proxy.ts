import { NextResponse, type NextRequest } from "next/server";

/**
 * The /tools routing seam (spec §3) — Next 16's proxy (the middleware
 * successor; Next 16 renamed the file convention).
 *
 * In the sandbox dev server (no basePath) this proxy gives the tools'
 * public URLs their exact 301 trailing-slash canonicalisation. In the
 * production build (basePath /gold) the proxy's matcher is
 * basePath-anchored, so raw /tools/* never reaches it — there the
 * worker entry (worker-entry.ts, which wraps the OpenNext worker)
 * owns the whole /tools mount. One behaviour, two mount points, the
 * house pattern.
 *
 * This proxy never touches the /gold paths' own behaviour (their
 * trailing-slash normalisation stays Next's built-in 308, exactly as
 * the live site behaves today).
 */

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/tools" || pathname.startsWith("/tools/")) {
    // Canonicalise: /tools/…/ → /tools/… (301, permanent).
    if (pathname.length > 1 && pathname.endsWith("/")) {
      const url = req.nextUrl.clone();
      url.pathname = pathname.replace(/\/+$/, "");
      return NextResponse.redirect(url, 301);
    }
    // Dev mount: nothing to do — /tools/* is served natively here.
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Next 16 accepts both the legacy and the new export names; the new one
// keeps the build warning-free.
export default proxy;

export const config = {
  matcher: ["/(:path*)"],
};
