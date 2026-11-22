import type { NextConfig } from "next";

// The Currena deployment serves the desk under currena.ir/gold (zone
// workers routes → the currena-gold-desk worker), so the worker build
// runs with NEXT_PUBLIC_BASE_PATH=/gold: Next.js basePath moves every
// route, asset link and RSC fetch under /gold. The sandbox dev server
// leaves it unset and keeps serving the desk at / (the Preview Panel
// contract) — one code path, two mount points.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig: NextConfig = {
  output: "standalone",
  ...(basePath ? { basePath } : {}),
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
