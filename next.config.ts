import type { NextConfig } from "next";

// The Currena deployment serves the desk under currena.ir/gold (zone
// workers routes → the currena-gold-desk worker), so the worker build
// runs with NEXT_PUBLIC_BASE_PATH=/gold: Next.js basePath moves every
// route, asset link and RSC fetch under /gold. The sandbox dev server
// leaves it unset and keeps serving the desk at / (the Preview Panel
// contract) — one code path, two mount points.
//
// THE TOOLS NAMESPACE (spec COMPOUND-WEALTH-SPEC.md §3): the tools live
// at the PUBLIC URLs currena.ir/tools and currena.ir/tools/compound-
// wealth. The worker build (basePath set) adds:
//   - rewrites that map /tools/* onto the basePath-mounted app routes
//     (so direct links and refreshes serve the pages at the public URL);
//   - a 301 from the internal /gold/tools/* spelling to the canonical
//     public one, so the two never coexist;
//   - 301s from the trailing-slash forms of the two real pages (the
//     spec asks for 301; Next's built-in normalisation is 308).
// Unknown paths under /tools/ flow through to the app's own 404.
// The sandbox dev server (no basePath) serves /tools/* natively — the
// same rules are simply absent.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig: NextConfig = {
  output: "standalone",
  ...(basePath ? { basePath } : {}),
  ...(basePath
    ? {
        redirects: () => [
          {
            source: "/tools/",
            destination: "/tools",
            basePath: false,
            permanent: true, // 301
          },
          {
            source: "/tools/compound-wealth/",
            destination: "/tools/compound-wealth",
            basePath: false,
            permanent: true, // 301
          },
          {
            source: "/gold/tools/:path*",
            destination: "/tools/:path*",
            basePath: false,
            permanent: true, // 301
          },
        ],
        rewrites: () => [
          { source: "/tools", destination: "/gold/tools", basePath: false },
          { source: "/tools/:path*", destination: "/gold/tools/:path*", basePath: false },
        ],
      }
    : {}),
  // The sandbox's Preview Panel proxies the dev server from its own host;
  // allowing it keeps HMR + dev tooling working through the proxy.
  allowedDevOrigins: ["*.space-z.ai"],
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
