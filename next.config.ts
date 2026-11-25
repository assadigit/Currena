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
// wealth. Next 16 forbids internal rewrites outside the basePath (and
// basePath-mounted proxies never see raw outside paths), so the whole
// /tools mount lives in worker-entry.ts — the wrapper around the
// OpenNext worker that wrangler deploys. It rewrites /tools/* onto the
// basePath'd routes, 301s the trailing-slash forms, and 301s the
// internal /gold/tools/* spelling to the canonical public one. Unknown
// paths under /tools/ flow through to the app's own 404. The sandbox
// dev server (no basePath) serves /tools/* natively; src/proxy.ts
// gives the dev server the same 301s.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig: NextConfig = {
  output: "standalone",
  ...(basePath ? { basePath } : {}),

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
