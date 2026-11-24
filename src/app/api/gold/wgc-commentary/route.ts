import { NextResponse } from "next/server";
import { db, unwrapD1Text } from "@/lib/db";
import type { WgcCommentary, WgcCommentaryFa } from "@prisma/client";

/**
 * GET /api/gold/wgc-commentary — the World Gold Council's monthly Gold
 * Market Commentary Highlights, read-only from the desk's own store
 * (docs/wgc-monthly-commentary-spec.md §5).
 *
 *   no query               → the latest issue's state
 *   ?month=YYYY-MM         → that specific reviewed month
 *
 * Honest statuses, always:
 *   ok              — the issue is captured; the segments ride along
 *                     verbatim (the flat shape of spec §5)
 *   waiting         — the target month's issue is not published yet;
 *                     the attempt count is read from the scrape log and
 *                     the last known good rides beside it
 *   missed          — the window closed without an issue (a stated fact,
 *                     never a silent gap); the last known good beside it
 *   structure_alert — the source's template changed; the last known good
 *                     stays served, the alert stated plainly
 *
 * The Persian translation (spec §8, implemented 2026-11-25) rides the ok
 * payload — and the lastKnownGood payloads — as an ADDITIVE `fa` field,
 * always-include when a fresh one is stored, absent otherwise (decided,
 * not parameterized: the card is the Persian-first page, no consumer
 * needs to opt in, and the field is purely additive so the flat §5 shape
 * stays backward-compatible). Fresh means the side row's content_hash
 * matches the English row's — a translation of OLD English after a
 * re-store is never served; a malformed fa payload never degrades the
 * English response (the fa layer fails closed to absent). Months with no
 * stored Farsi (the 17 pre-feature issues, an AI failure) simply answer
 * without the field — the English serves verbatim, no fake translation.
 *
 * The month key is the REVIEWED month "YYYY-MM" everywhere — never the
 * publication month (the issue reviewing October publishes in November).
 * D1 only: this route never fetches gold.org — the currena-wgc-watch
 * Worker owns the network. Fail-closed: any store failure answers 500
 * with the reason, never a guess.
 */

/** The flat issue shape (spec §5) — the response body when status is ok. */
interface IssuePayload {
  month: string;
  headline: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  sourceUrl: string;
  blockVariant: string;
  segments: { heading: string; body: string }[];
  /** The stored Persian translation when one is fresh for this content — absent otherwise. */
  fa?: FaPayload;
}

/** The Persian payload — provenance rides along (the honest label's back). */
interface FaPayload {
  headline: string | null;
  segments: { heading: string; body: string }[];
  sourceModel: string; // the engine recorded at translation time (the bake-off's selection)
  translatedAt: string; // ISO UTC — when the translation was stored
}

/** The events that each represent one real fetch attempt by the watch worker. */
const ATTEMPT_EVENTS = ["fetch-404", "fetch-redirect-rejected", "fetch-error"] as const;

/** The window the watch worker polls inside (spec §4.2). */
const WINDOW_CLOSES_DAY = 25;

function issueOf(row: WgcCommentary): IssuePayload {
  return {
    month: row.monthKey,
    headline: row.headline,
    // the ISO TEXT timestamps ride through the D1 adapter's read-side
    // shim (src/lib/db.ts) — restored verbatim here
    publishedAt: unwrapD1Text(row.publishedAt),
    fetchedAt: unwrapD1Text(row.fetchedAt) ?? "",
    sourceUrl: row.sourceUrl,
    blockVariant: row.blockVariant,
    segments: JSON.parse(row.highlightsJson) as { heading: string; body: string }[],
  };
}

/** A segment-shaped object (the defensive parse of the fa payload). */
function isSegment(v: unknown): v is { heading: string; body: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { heading?: unknown }).heading === "string" &&
    (v as { heading?: string }).heading !== "" &&
    typeof (v as { body?: unknown }).body === "string" &&
    (v as { body?: string }).body !== ""
  );
}

/**
 * The stored Persian translation of one issue, when one is FRESH for the
 * row's content: the side row's content_hash must equal the English
 * row's (a translation of pre-edit English is never served after a
 * re-store), and its JSON must parse into the segment shape. Any miss —
 * no row, a stale hash, a malformed payload — is absent, never an error
 * in the English response: the fa layer fails closed.
 */
async function faOf(row: WgcCommentary): Promise<FaPayload | null> {
  let faRow: WgcCommentaryFa | null = null;
  try {
    faRow = await db.wgcCommentaryFa.findUnique({ where: { monthKey: row.monthKey } });
  } catch {
    return null; // the side table is additive — its absence never degrades the English
  }
  if (!faRow) return null;
  if (faRow.contentHash !== row.contentHash) return null; // stale against a re-stored English
  let segments: { heading: string; body: string }[] | null = null;
  try {
    const parsed: unknown = JSON.parse(faRow.faJson);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isSegment)) {
      segments = parsed;
    }
  } catch {
    /* a malformed fa payload serves absent, never an error */
  }
  if (segments === null) return null;
  return {
    headline: unwrapD1Text(faRow.faHeadline),
    segments,
    sourceModel: faRow.sourceModel,
    translatedAt: unwrapD1Text(faRow.translatedAt) ?? "",
  };
}

/** The issue with its Persian payload when a fresh one is stored. */
async function issueOfRow(row: WgcCommentary): Promise<IssuePayload> {
  const fa = await faOf(row);
  return fa === null ? issueOf(row) : { ...issueOf(row), fa };
}

/** The row's own content when it is real (a captured box), else null. */
async function ownContent(row: WgcCommentary): Promise<IssuePayload | null> {
  if (row.highlightsJson === "[]" || row.highlightsJson === "") return null;
  return await issueOfRow(row);
}

async function latestOkBefore(monthKey: string): Promise<IssuePayload | null> {
  const row = await db.wgcCommentary.findFirst({
    where: { status: "ok", monthKey: { lt: monthKey } },
    orderBy: { monthKey: "desc" },
  });
  return row ? await issueOfRow(row) : null;
}

async function latestOkAny(): Promise<IssuePayload | null> {
  const row = await db.wgcCommentary.findFirst({
    where: { status: "ok" },
    orderBy: { monthKey: "desc" },
  });
  return row ? await issueOfRow(row) : null;
}

/** The previous calendar month (UTC) — the watch worker's own target rule. */
function targetMonthOf(now: Date): string {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth(); // 0-based
  const key = (yy: number, mm: number) => `${yy}-${String(mm).padStart(2, "0")}`;
  return m === 0 ? key(y - 1, 12) : key(y, m);
}

function isSkipMonth(monthKey: string): boolean {
  const m = Number(monthKey.slice(5, 7));
  return m === 6 || m === 11;
}

/** The honest state of one not-yet-captured target month (waiting, or the derived close). */
async function pendingState(target: string, now: Date): Promise<NextResponse> {
  const attempts = await db.wgcScrapeLog.count({
    where: { monthKey: target, event: { in: [...ATTEMPT_EVENTS] } },
  });
  const windowClosed = now.getUTCDate() > WINDOW_CLOSES_DAY;
  const lastKnownGood = await latestOkBefore(target);
  return NextResponse.json(
    {
      status: windowClosed ? "missed" : "waiting",
      month: target,
      attempts,
      windowClosesDay: WINDOW_CLOSES_DAY,
      lastKnownGood,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function GET(request: Request) {
  try {
    const now = new Date();
    const target = targetMonthOf(now);
    const monthParam = new URL(request.url).searchParams.get("month");

    if (monthParam !== null) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam)) {
        return NextResponse.json(
          { error: "month must be the reviewed month as YYYY-MM (e.g. 2026-10)" },
          { status: 400, headers: { "cache-control": "no-store" } },
        );
      }
      const row = await db.wgcCommentary.findUnique({ where: { monthKey: monthParam } });
      if (row && row.status === "ok") {
        return NextResponse.json({ status: "ok", ...await issueOfRow(row) }, { headers: { "cache-control": "no-store" } });
      }
      if (row && row.status === "missed") {
        return NextResponse.json(
          {
            status: "missed",
            month: monthParam,
            attempts: row.attempts,
            windowClosesDay: WINDOW_CLOSES_DAY,
            lastKnownGood: await latestOkBefore(monthParam),
          },
          { headers: { "cache-control": "no-store" } },
        );
      }
      if (row && row.status === "structure_alert") {
        return NextResponse.json(
          {
            status: "structure_alert",
            month: monthParam,
            attempts: row.attempts,
            windowClosesDay: WINDOW_CLOSES_DAY,
            lastKnownGood: (await ownContent(row)) ?? (await latestOkBefore(monthParam)),
          },
          { headers: { "cache-control": "no-store" } },
        );
      }
      // No row: the current target may still be pending (in-window, or the
      // close not yet recorded); every other absent month is honestly 404.
      if (monthParam === target) return pendingState(target, now);
      const reason = isSkipMonth(monthParam)
        ? "The series publishes no June or November issue."
        : Number(monthParam.slice(0, 4)) < 2025 || (Number(monthParam.slice(0, 4)) === 2025 && Number(monthParam.slice(5, 7)) < 3)
          ? "The Highlights box exists only since the March 2025 issue; the 22 earlier issues carried none and are not backfilled."
          : "No commentary row for that month.";
      return NextResponse.json({ error: reason }, { status: 404, headers: { "cache-control": "no-store" } });
    }

    // The latest view. A June/November target never has an issue — the
    // latest captured issue serves, with the skip stated as a fact.
    if (isSkipMonth(target)) {
      const latest = await latestOkAny();
      if (latest) {
        return NextResponse.json(
          { status: "ok", ...latest, skipTarget: target },
          { headers: { "cache-control": "no-store" } },
        );
      }
      return NextResponse.json(
        { status: "waiting", month: target, attempts: 0, windowClosesDay: WINDOW_CLOSES_DAY, skipTarget: target, lastKnownGood: null },
        { headers: { "cache-control": "no-store" } },
      );
    }

    const row = await db.wgcCommentary.findUnique({ where: { monthKey: target } });
    if (!row) return pendingState(target, now);
    if (row.status === "ok") {
      return NextResponse.json({ status: "ok", ...await issueOfRow(row) }, { headers: { "cache-control": "no-store" } });
    }
    if (row.status === "missed") {
      return NextResponse.json(
        {
          status: "missed",
          month: target,
          attempts: row.attempts,
          windowClosesDay: WINDOW_CLOSES_DAY,
          lastKnownGood: await latestOkBefore(target),
        },
        { headers: { "cache-control": "no-store" } },
      );
    }
    // structure_alert
    return NextResponse.json(
      {
        status: "structure_alert",
        month: target,
        attempts: row.attempts,
        windowClosesDay: WINDOW_CLOSES_DAY,
        lastKnownGood: (await ownContent(row)) ?? (await latestOkBefore(target)),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected failure" },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
