import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext Cloudflare adapter config for the AURUM desk.
 *
 * The desk is fully dynamic (`export const dynamic = "force-dynamic"` on
 * every route handler, no ISR pages), so no remote cache bindings are
 * configured: the default build serves every request from the worker
 * itself, backed by the D1 binding (see wrangler.jsonc and src/lib/db.ts).
 */
export default defineCloudflareConfig();
