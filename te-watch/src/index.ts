/**
 * currena-te-watch — the Trading Economics daily gold briefing watch
 * Worker (docs/te-daily-briefing-spec.md §4.1).
 *
 * A minimal, dependency-free Cloudflare Worker — the wgc-watch's own
 * sibling pattern: a scheduled handler that runs the twice-daily capture
 * pipeline (te-watch/src/pipeline.ts) against the desk's own D1
 * (aurum-desk), and a read-only fetch handler answering its workers.dev
 * URL with the health glance (§4.7): the last three scrape-log lines, the
 * latest stored briefing's row, its Persian translation, and the fire
 * schedule. It never touches the desk's OpenNext worker entry and claims
 * no route on currena.ir — the zone stays exactly as it is.
 *
 * The cron trigger (§4.2): "0 5,16 * * *" UTC — two fires a day on ONE
 * trigger, the account's fifth and last free cron slot (5/5 stated
 * plainly; the slot trade-off was the owner's own §11 Q2 answer). The
 * [ai] binding is the translation engine (the same platform-native path
 * the WGC watch carries — no secret surface); the REST + token path is
 * what the seed script uses from outside the worker
 * (scripts/te-seed.ts).
 *
 * Deploy: from te-watch/, with the account token + id env-only —
 *   CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… bunx wrangler deploy
 */

import {
  runFire,
  TE_CRONS,
  type D1Like,
  type D1Statement,
  type TeRow,
  type LogLine,
  type FetchLike,
} from "./pipeline";
import type { TeFaRow, AiLike } from "./translate";

/** The bindings (structural types — the worker carries zero dependencies). */
interface Env {
  DB: D1Like;
  /** The Workers AI binding (wrangler.jsonc "ai") — the translation step's engine. */
  AI: AiLike;
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
    const result = await runFire({ DB: env.DB, AI: env.AI }, now, fetch as FetchLike);
    console.log(`[te-watch] ${now.toISOString()} fire → ${JSON.stringify(result)}`);
  },

  /** The read-only health endpoint — SELECTs only, no route on currena.ir is claimed. */
  async fetch(_request: Request, env: Env, _ctx: unknown): Promise<Response> {
    try {
      const now = new Date();

      const lastLog = await env.DB
        .prepare("SELECT ts, news_id, event, detail FROM te_scrape_log ORDER BY ts DESC, rowid DESC LIMIT 3")
        .all<LogLine>();

      const latestStmt: D1Statement = env.DB
        .prepare("SELECT * FROM te_briefing WHERE status = 'ok' ORDER BY published_at DESC LIMIT 1");
      const latestRow = await latestStmt.first<TeRow>();

      let latestFa: TeFaRow | null = null;
      if (latestRow) {
        latestFa = await env.DB
          .prepare("SELECT * FROM te_briefing_fa WHERE news_id = ?")
          .bind(latestRow.news_id)
          .first<TeFaRow>();
      }

      return Response.json(
        {
          ok: true,
          worker: "currena-te-watch",
          now: now.toISOString(),
          cronSchedule: TE_CRONS,
          window: "twice daily 05:00 and 16:00 UTC on one trigger — 05:00 captures the Asia-morning piece, 16:00 any intraday second piece",
          lastLog: lastLog.results,
          latestBriefing: latestRow ?? null,
          latestFa: latestFa ?? null,
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
