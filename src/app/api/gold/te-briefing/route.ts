import { NextResponse } from "next/server";
import { db, unwrapD1Text } from "@/lib/db";
import type { TeBriefing, TeBriefingFa, TeScrapeLog } from "@prisma/client";

/**
 * GET /api/gold/te-briefing — the Trading Economics daily gold
 * briefing, read-only from the desk's own store
 * (docs/te-daily-briefing-spec.md §6).
 *
 *   no query            → the latest captured briefing's state
 *   ?id={news_id}       → that specific briefing
 *
 * Honest statuses, always:
 *   ok              — the latest briefing is captured; the flat §6
 *                     fields ride along verbatim
 *   waiting         — nothing captured yet; the next fire is named
 *                     (the schedule is the worker's own "0 5,16 * * *")
 *   structure_alert — the source's template changed; the last known
 *                     good stays served beside the alert, stated plainly
 *
 * A trailing run of fetch-failed fires (TE unreachable — the no-arms-race
 * posture, §11 Q6) rides ANY of these as an additive `fetchFailed`
 * {fires, since} field: the last captured briefing keeps serving, dated,
 * while the streak is stated as a fact — never a silent gap.
 *
 * The Persian translation (§5) rides the ok payload — and the
 * lastKnownGood payloads — as an ADDITIVE `fa` field, always-include
 * when a fresh one is stored, absent otherwise (the WGC route's own
 * decided shape: the card is the Persian-first page's, the field is
 * purely additive so the flat §6 shape stays backward-compatible).
 * Fresh means the side row's content_hash matches the English row's —
 * a translation of OLD English after a re-store is never served; a
 * malformed fa payload never degrades the English response (the fa
 * layer fails closed to absent).
 *
 * D1 only: this route never fetches tradingeconomics.com — the
 * currena-te-watch Worker owns the network. Fail-closed: any store
 * failure answers 500 with the reason, never a guess.
 */

/** The flat briefing shape (spec §6) — the response body when status is ok. */
interface BriefingPayload {
  newsId: string;
  title: string;
  publishedAt: string;
  fetchedAt: string;
  sourceUrl: string;
  author: string | null;
  body: string;
  /** The stored Persian translation when one is fresh for this content — absent otherwise. */
  fa?: FaPayload;
}

/** The Persian payload — provenance rides along (the honest label's back). */
interface FaPayload {
  title: string;
  body: string;
  sourceModel: string; // the engine recorded at translation time
  translatedAt: string; // ISO UTC — when the translation was stored
}

/** The trailing unreachability streak — additive, rides any status. */
interface FetchFailedPayload {
  fires: number; // consecutive fetch-failed fires at the log's tail
  since: string; // ISO UTC — when the streak began
}

/** The watch worker's cron (te-watch/src/pipeline.ts TE_CRONS — mirrored, single source beside the worker's own). */
const SCHEDULE = "0 5,16 * * *";

/** The next 05:00 or 16:00 UTC after now — the waiting state names it (spec §7). */
function nextFireAt(now: Date): string {
  const next = new Date(now);
  next.setUTCSeconds(0, 0);
  if (next.getUTCHours() < 5) {
    next.setUTCHours(5, 0, 0, 0);
  } else if (next.getUTCHours() < 16) {
    next.setUTCHours(16, 0, 0, 0);
  } else {
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(5, 0, 0, 0);
  }
  return next.toISOString();
}

function payloadOf(row: TeBriefing): BriefingPayload {
  return {
    newsId: row.newsId,
    title: row.title,
    // the ISO TEXT timestamps ride through the D1 adapter's read-side
    // shim (src/lib/db.ts) — restored verbatim here
    publishedAt: unwrapD1Text(row.publishedAt) ?? "",
    fetchedAt: unwrapD1Text(row.fetchedAt) ?? "",
    sourceUrl: row.sourceUrl,
    author: unwrapD1Text(row.author),
    body: row.body,
  };
}

/**
 * The stored Persian translation of one briefing, when one is FRESH for
 * the row's content: the side row's content_hash must equal the English
 * row's (a translation of pre-edit English is never served after a
 * re-store), and both strings must be non-empty. Any miss — no row, a
 * stale hash, empty strings — is absent, never an error in the English
 * response: the fa layer fails closed.
 */
async function faOf(row: TeBriefing): Promise<FaPayload | null> {
  let faRow: TeBriefingFa | null = null;
  try {
    faRow = await db.teBriefingFa.findUnique({ where: { newsId: row.newsId } });
  } catch {
    return null; // the side table is additive — its absence never degrades the English
  }
  if (!faRow) return null;
  if (faRow.contentHash !== row.contentHash) return null; // stale against a re-stored English
  if (faRow.faTitle === "" || faRow.faBody === "") return null; // the mirror law, read-side
  return {
    title: faRow.faTitle,
    body: faRow.faBody,
    sourceModel: faRow.sourceModel,
    translatedAt: unwrapD1Text(faRow.translatedAt) ?? "",
  };
}

/** The briefing with its Persian payload when a fresh one is stored. */
async function payloadOfRow(row: TeBriefing): Promise<BriefingPayload> {
  const fa = await faOf(row);
  return fa === null ? payloadOf(row) : { ...payloadOf(row), fa };
}

/** The latest row that carries real content (a captured briefing), newest published first. */
async function latestOkRow(): Promise<TeBriefing | null> {
  try {
    return await db.teBriefing.findFirst({
      where: { status: "ok", body: { not: "" } },
      orderBy: { publishedAt: "desc" },
    });
  } catch {
    return null;
  }
}

/** The earliest stored row's date — the coverage floor, stated on the card (spec §8). */
async function coverageSince(): Promise<string | null> {
  try {
    const row = await db.teBriefing.findFirst({
      where: { status: "ok", body: { not: "" } },
      orderBy: { publishedAt: "asc" },
    });
    return row ? (unwrapD1Text(row.publishedAt) ?? row.newsId) : null;
  } catch {
    return null;
  }
}

/**
 * The trailing fetch-failed streak from the scrape log's tail: counting
 * back from the most recent line, every consecutive fetch-failed line is
 * one unreachable fire. Any other latest line (a quiet fire, a store, a
 * translation) means TE was reachable and the streak is zero.
 */
async function fetchFailedStreak(): Promise<FetchFailedPayload | null> {
  let logs: TeScrapeLog[];
  try {
    logs = await db.teScrapeLog.findMany({
      orderBy: { ts: "desc" },
      take: 30, // 2 fires/day → ~15 days of failures, far past any honest concern
    });
  } catch {
    return null;
  }
  if (logs.length === 0 || logs[0]!.event !== "fetch-failed") return null;
  let fires = 0;
  let since = "";
  for (const line of logs) {
    if (line.event !== "fetch-failed") break;
    fires++;
    since = unwrapD1Text(line.ts) ?? since; // the oldest in the run wins
  }
  return fires > 0 && since !== "" ? { fires, since } : null;
}

/**
 * Whether the pipeline is currently in a structure alarm: the scrape
 * log's most recent line is a structure-alert (the fire that raised it
 * is the last thing that happened; any later line — a store, a quiet
 * fire — means the alarm healed).
 */
async function alarmActive(): Promise<{ reason: string; ts: string } | null> {
  let logs: TeScrapeLog[];
  try {
    logs = await db.teScrapeLog.findMany({ orderBy: { ts: "desc" }, take: 1 });
  } catch {
    return null;
  }
  const last = logs[0];
  if (!last || last.event !== "structure-alert") return null;
  return { reason: last.detail ?? "the source's template changed", ts: unwrapD1Text(last.ts) ?? "" };
}

export async function GET(request: Request) {
  try {
    const idParam = new URL(request.url).searchParams.get("id");

    if (idParam !== null) {
      if (!/^\d{4,10}$/.test(idParam)) {
        return NextResponse.json(
          { error: "id must be the news id as digits (e.g. 603757)" },
          { status: 400, headers: { "cache-control": "no-store" } },
        );
      }
      const row = await db.teBriefing.findUnique({ where: { newsId: idParam } });
      if (!row || row.body === "") {
        // A marker row (an alarm's empty placeholder) and an absent row
        // are the same honest answer: nothing captured for that id.
        return NextResponse.json(
          { error: "No captured briefing for that id." },
          { status: 404, headers: { "cache-control": "no-store" } },
        );
      }
      const payload = await payloadOfRow(row);
      return NextResponse.json(
        row.status === "ok"
          ? { status: "ok", ...payload }
          : { status: "structure_alert", reason: "this row was marked by a structure alarm", lastKnownGood: payload },
        { headers: { "cache-control": "no-store" } },
      );
    }

    const now = new Date();
    const served = await latestOkRow();

    if (!served) {
      return NextResponse.json(
        {
          status: "waiting",
          schedule: SCHEDULE,
          nextFireAt: nextFireAt(now),
        },
        { headers: { "cache-control": "no-store" } },
      );
    }

    const alarm = await alarmActive();
    const payload = await payloadOfRow(served);
    const coverage = await coverageSince();
    const fetchFailed = await fetchFailedStreak();

    const base: Record<string, unknown> = { status: "ok", ...payload };
    if (coverage !== null && coverage !== payload.publishedAt) {
      base.coverageSince = coverage; // additive — the card's record-basis line
    }
    if (fetchFailed) base.fetchFailed = fetchFailed;

    if (alarm) {
      // The last known good stays served, dated — the alert beside it,
      // stated plainly (§6).
      return NextResponse.json(
        {
          status: "structure_alert",
          reason: alarm.reason,
          lastKnownGood: base,
        },
        { headers: { "cache-control": "no-store" } },
      );
    }

    return NextResponse.json(base, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected failure" },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
