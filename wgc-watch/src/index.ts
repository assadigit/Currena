/**
 * currena-wgc-watch — the WGC monthly commentary watch Worker.
 *
 * A minimal, dependency-free Cloudflare Worker (spec §4.1): a scheduled
 * handler that runs the bounded-window pipeline (wgc-watch/src/pipeline.ts)
 * against the desk's own D1 (aurum-desk), and a read-only fetch handler
 * answering its workers.dev URL with the health glance (spec §4.7): the
 * last three scrape-log lines, the current target month's row, and the
 * cron schedule. It never touches the desk's OpenNext worker entry.
 *
 * Deploy: from wgc-watch/, with the account token + id env-only —
 *   CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… bunx wrangler deploy
 */

import {
  runFire,
  targetMonthOf,
  WGC_CRONS,
  type D1Like,
  type D1Statement,
  type WgcRow,
  type LogLine,
  type FetchLike,
} from "./pipeline";

/** The bindings (structural types — the worker carries zero dependencies). */
interface Env {
  DB: D1Like;
}

/** What workerd passes the scheduled handler (structurally). */
interface ScheduledControllerLike {
  scheduledTime: number;
  noRetry?(): void;
}

const worker = {
  /** The cron fire — the pipeline owns every decision; this logs the outcome for observability. */
  async scheduled(controller: ScheduledControllerLike, env: Env, _ctx: unknown): Promise<void> {
    const now = new Date(controller.scheduledTime);
    const result = await runFire({ DB: env.DB }, now, fetch as FetchLike);
    console.log(`[wgc-watch] ${now.toISOString()} fire → ${JSON.stringify(result)}`);
  },

  /** The read-only health endpoint — SELECTs only, no route on currena.ir is claimed. */
  async fetch(_request: Request, env: Env, _ctx: unknown): Promise<Response> {
    try {
      const now = new Date();
      const target = targetMonthOf(now);

      const lastLog = await env.DB
        .prepare("SELECT ts, month_key, event, detail FROM wgc_scrape_log ORDER BY ts DESC, rowid DESC LIMIT 3")
        .all<LogLine>();

      const targetStmt: D1Statement = env.DB
        .prepare("SELECT * FROM wgc_commentary WHERE month_key = ?");
      const targetRow = await targetStmt.bind(target).first<WgcRow>();

      return Response.json(
        {
          ok: true,
          worker: "currena-wgc-watch",
          now: now.toISOString(),
          targetMonth: target,
          cronSchedule: WGC_CRONS,
          window: "daily 09:30 UTC on days 1–15 plus grace days 17, 19, 21, 23, 25; at most 20 attempts per month; June and November targets make zero requests",
          lastLog: lastLog.results,
          targetRow: targetRow ?? null,
        },
        { headers: { "cache-control": "no-store" } },
      );
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : "health check failed" },
        { status: 500, headers: { "cache-control": "no-store" } },
      );
    }
  },
};

export default worker;
