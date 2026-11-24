/**
 * The WGC watch pipeline — the bounded-window fetch logic of
 * docs/wgc-monthly-commentary-spec.md §4.2–§4.6, implemented once and
 * shared by the currena-wgc-watch Worker's scheduled handler, the one-off
 * backfill (scripts/wgc-backfill.ts) and the verification harness
 * (tests/wgc-harness.ts). Plain TypeScript over a D1-compatible
 * interface; zero dependencies.
 *
 * The calendar facts this encodes (the 2026-11-24 census, 48 URLs):
 *  - The issue that reviews month M lives at
 *    gold.org/goldhub/research/gold-market-commentary-{month}-{year} and
 *    publishes in the FOLLOWING month, 4–12 days after M ends (median 7,
 *    always 08:00 London). The month key everywhere is the REVIEWED
 *    month "YYYY-MM", never the publication month.
 *  - Ten issues a year: every June and November has no issue (clean
 *    404s) — zero requests are ever made for a June/November target.
 *    The June-2026 URL 301-redirects to July's issue instead, which is
 *    exactly why every 200 passes the slug guard first.
 *  - The window: daily 09:30 UTC on days 1–15 of the following month
 *    plus grace days 17/19/21/23/25; stop-on-success; at most 20
 *    attempts per month; day 25 closes the window (status "missed").
 *
 * Rows exist only in the three documented states — ok | missed |
 * structure_alert (spec §4.6). The waiting phase is the absence of a
 * row: every fetch attempt is logged (fetch-404 | fetch-redirect-
 * rejected | fetch-error), and the attempt count is derived from the
 * log until the row materializes on capture, alert or window close.
 */

import {
  parseHighlights,
  reportLd,
  storageGates,
  contentHash,
  canonicalSegmentsJson,
  type WgcSegment,
} from "./parser";

/* ------------------------------------------------------------------ *
 * The calendar + URL contract
 * ------------------------------------------------------------------ */

export const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

/** The cron triggers, mirrored in wgc-watch/wrangler.toml (single source: this array). */
export const WGC_CRONS = ["30 9 1-15 * *", "30 9 17-25/2 * *"] as const;

/** The hard bound: at most 20 fetch attempts per month (the calendar itself allows exactly 20 fires). */
export const MAX_ATTEMPTS_PER_MONTH = 20;

/** The window closes on day 25 of the following month. */
export const WINDOW_CLOSE_DAY = 25;

/** The tested headers (the probe's exact set). */
export const WGC_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept-Language": "en-GB,en;q=0.9",
};

export function monthKeyOf(year: number, month1: number): string {
  return `${year}-${String(month1).padStart(2, "0")}`;
}

export function monthParts(monthKey: string): { year: number; month: number } {
  return { year: Number(monthKey.slice(0, 4)), month: Number(monthKey.slice(5, 7)) };
}

/** The target of a fire: the previous calendar month (UTC) — in January, December of the prior year. */
export function targetMonthOf(now: Date): string {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth(); // 0-based
  return m === 0 ? monthKeyOf(y - 1, 12) : monthKeyOf(y, m);
}

/** June and November never have an issue — the series' own calendar. */
export function isSkipMonthKey(monthKey: string): boolean {
  const m = monthParts(monthKey).month;
  return m === 6 || m === 11;
}

export function slugOf(monthKey: string): string {
  const { year, month } = monthParts(monthKey);
  return `${MONTH_NAMES[month - 1]}-${year}`;
}

export function canonicalUrlFor(monthKey: string): string {
  return `https://www.gold.org/goldhub/research/gold-market-commentary-${slugOf(monthKey)}`;
}

/**
 * The slug guard: a 200's final URL must be the requested month's own
 * issue. The observed June-2026 case (…-june-2026 → 301 → …-july-2026)
 * is treated as "this month's issue does not exist" — never stored.
 */
export function slugGuardOk(finalUrl: string, monthKey: string): boolean {
  try {
    const u = new URL(finalUrl);
    const last = u.pathname.split("/").filter(Boolean).pop() ?? "";
    return last === `gold-market-commentary-${slugOf(monthKey)}`;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * The D1-compatible surface (the real binding and the test adapters
 * both satisfy this; nothing outside this file writes SQL)
 * ------------------------------------------------------------------ */

export interface D1Statement {
  bind(...vals: unknown[]): D1Statement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: true }>;
}

export interface D1Like {
  prepare(sql: string): D1Statement;
}

export interface WgcRow {
  month_key: string;
  source_url: string;
  headline: string | null;
  published_at: string | null;
  fetched_at: string;
  highlights_json: string;
  block_variant: string;
  content_hash: string;
  status: string; // ok | missed | structure_alert
  attempts: number;
  last_attempt_at: string | null;
  updated_at: string | null;
}

export interface LogLine {
  ts: string;
  month_key: string;
  event: string;
  detail: string | null;
}

/** The events that each represent one real fetch attempt (for attempt counting). */
export const ATTEMPT_LOG_EVENTS = ["fetch-404", "fetch-redirect-rejected", "fetch-error"] as const;

/* ------------------------------------------------------------------ *
 * The SQL (raw D1 statements — the watch worker carries no Prisma)
 * ------------------------------------------------------------------ */

export async function getRow(db: D1Like, monthKey: string): Promise<WgcRow | null> {
  return db
    .prepare("SELECT * FROM wgc_commentary WHERE month_key = ?")
    .bind(monthKey)
    .first<WgcRow>();
}

export async function logEvent(
  db: D1Like,
  nowIso: string,
  monthKey: string,
  event: string,
  detail?: string,
): Promise<void> {
  await db
    .prepare("INSERT INTO wgc_scrape_log (ts, month_key, event, detail) VALUES (?, ?, ?, ?)")
    .bind(nowIso, monthKey, event, detail ?? null)
    .run();
}

export async function countLogAttempts(db: D1Like, monthKey: string): Promise<number> {
  const row = await db
    .prepare(
      "SELECT COUNT(*) AS n FROM wgc_scrape_log WHERE month_key = ? AND event IN ('fetch-404', 'fetch-redirect-rejected', 'fetch-error')",
    )
    .bind(monthKey)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/** The attempt count a fire works from: the row's own counter once the row exists, else the log. */
export async function priorAttemptsOf(db: D1Like, monthKey: string): Promise<number> {
  const row = await getRow(db, monthKey);
  return row ? row.attempts : await countLogAttempts(db, monthKey);
}

async function emptyContentHash(): Promise<string> {
  return contentHash([]);
}

/* ------------------------------------------------------------------ *
 * The capture path — shared by the scheduled fire and the backfill
 * ------------------------------------------------------------------ */

export type StoreOutcome =
  | { outcome: "stored"; monthKey: string; variant: string; segments: number; attempts: number }
  | { outcome: "re-stored"; monthKey: string; variant: string; segments: number; attempts: number }
  | { outcome: "unchanged"; monthKey: string }
  | { outcome: "redirect-rejected"; monthKey: string; finalUrl: string }
  | { outcome: "structure-alert"; monthKey: string; reason: string };

async function recordFailedAttempt(
  db: D1Like,
  monthKey: string,
  now: Date,
  event: "fetch-404" | "fetch-redirect-rejected" | "fetch-error",
  detail: string,
): Promise<void> {
  const nowIso = now.toISOString();
  const row = await getRow(db, monthKey);
  if (row) {
    await db
      .prepare("UPDATE wgc_commentary SET attempts = ?, last_attempt_at = ? WHERE month_key = ?")
      .bind(row.attempts + 1, nowIso, monthKey)
      .run();
  }
  await logEvent(db, nowIso, monthKey, event, detail);
}

async function recordStructureAlert(
  db: D1Like,
  monthKey: string,
  now: Date,
  reason: string,
  variantSeen: string,
  ld: { datePublished?: string; headline?: string } | null,
): Promise<void> {
  const nowIso = now.toISOString();
  const row = await getRow(db, monthKey);
  const attempts = (row ? row.attempts : await countLogAttempts(db, monthKey)) + 1;
  if (!row) {
    // Nothing was ever captured for this month — an empty row records the
    // alarm (the NOT NULL content columns carry the empty markers).
    await db
      .prepare(
        `INSERT INTO wgc_commentary
           (month_key, source_url, headline, published_at, fetched_at, highlights_json,
            block_variant, content_hash, status, attempts, last_attempt_at, updated_at)
         VALUES (?, ?, ?, ?, ?, '[]', ?, ?, 'structure_alert', ?, ?, NULL)`,
      )
      .bind(
        monthKey,
        canonicalUrlFor(monthKey),
        ld?.headline ?? null,
        ld?.datePublished ?? null,
        nowIso,
        variantSeen || "none",
        await emptyContentHash(),
        attempts,
        nowIso,
      )
      .run();
  } else {
    // The last known good stays in the row untouched — only the status
    // and the attempt counters move.
    await db
      .prepare("UPDATE wgc_commentary SET status = 'structure_alert', attempts = ?, last_attempt_at = ? WHERE month_key = ?")
      .bind(attempts, nowIso, monthKey)
      .run();
  }
  await logEvent(db, nowIso, monthKey, "structure-alert", reason);
}

/**
 * Apply one fetched 200 to the store: slug guard → parse → gates →
 * upsert. Used identically by the live fire and the backfill, so the
 * two can never drift. Unchanged content writes nothing.
 */
export async function applyCapture(
  db: D1Like,
  monthKey: string,
  finalUrl: string,
  html: string,
  now: Date,
): Promise<StoreOutcome> {
  if (!slugGuardOk(finalUrl, monthKey)) {
    await recordFailedAttempt(
      db,
      monthKey,
      now,
      "fetch-redirect-rejected",
      `requested ${slugOf(monthKey)} but the final URL is ${finalUrl} — this month's issue does not exist`,
    );
    return { outcome: "redirect-rejected", monthKey, finalUrl };
  }

  const ld = reportLd(html);
  const parsed = parseHighlights(html);
  const gates = storageGates(parsed, ld);
  if (!gates.pass) {
    const reason = gates.reason ?? "unknown gate failure";
    await recordStructureAlert(db, monthKey, now, reason, parsed.variant, ld);
    return { outcome: "structure-alert", monthKey, reason };
  }

  const segments: WgcSegment[] = parsed.segments;
  const highlightsJson = canonicalSegmentsJson(segments);
  const hash = await contentHash(segments);
  const nowIso = now.toISOString();
  const row = await getRow(db, monthKey);
  const attempts = (row ? row.attempts : await countLogAttempts(db, monthKey)) + 1;

  if (row && row.status === "ok" && row.content_hash === hash) {
    // Unchanged (a re-walk, or WGC re-serving the same box): nothing is
    // written — no row update, no log line. The idempotence contract.
    return { outcome: "unchanged", monthKey };
  }

  // A change over a row that already carries real content is a re-store
  // (updated_at bumped, a re-stored log line); everything else — first
  // capture, a missed month captured late, an alert healing — is a store.
  const hadContent = row !== null && row.highlights_json !== "[]" && row.highlights_json !== "";
  const reStore = row !== null && row.content_hash !== hash && (row.status === "ok" || hadContent);

  if (!row) {
    await db
      .prepare(
        `INSERT INTO wgc_commentary
           (month_key, source_url, headline, published_at, fetched_at, highlights_json,
            block_variant, content_hash, status, attempts, last_attempt_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ok', ?, ?, NULL)`,
      )
      .bind(
        monthKey,
        canonicalUrlFor(monthKey),
        ld?.headline ?? null,
        ld?.datePublished ?? null,
        nowIso,
        highlightsJson,
        parsed.variant,
        hash,
        attempts,
        nowIso,
      )
      .run();
  } else {
    await db
      .prepare(
        `UPDATE wgc_commentary SET
           source_url = ?, headline = ?, published_at = ?, fetched_at = ?, highlights_json = ?,
           block_variant = ?, content_hash = ?, status = 'ok', attempts = ?, last_attempt_at = ?,
           updated_at = ?
         WHERE month_key = ?`,
      )
      .bind(
        canonicalUrlFor(monthKey),
        ld?.headline ?? null,
        ld?.datePublished ?? null,
        nowIso,
        highlightsJson,
        parsed.variant,
        hash,
        attempts,
        nowIso,
        reStore ? nowIso : null,
        monthKey,
      )
      .run();
  }

  await logEvent(
    db,
    nowIso,
    monthKey,
    reStore ? "re-stored" : "stored",
    reStore
      ? `WGC edited the box after publication (content hash changed); box variant ${parsed.variant}, ${segments.length} segments re-stored`
      : `box variant ${parsed.variant}, ${segments.length} segments, published ${ld?.datePublished ?? "?"}`,
  );
  return {
    outcome: reStore ? "re-stored" : "stored",
    monthKey,
    variant: parsed.variant,
    segments: segments.length,
    attempts,
  };
}

/* ------------------------------------------------------------------ *
 * The scheduled fire (spec §4.2–§4.3)
 * ------------------------------------------------------------------ */

export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string>; redirect?: "follow"; signal?: AbortSignal },
) => Promise<{ status: number; url: string; text(): Promise<string> }>;

export interface FireResult {
  action: string;
  target: string;
  detail?: string;
}

/**
 * One cron fire. The target is the previous calendar month (UTC); a
 * June/November target exits before any request; a captured month
 * (status ok) never re-fetches inside the window; otherwise one fetch:
 * 404 → attempts + a log line; a 200 → slug guard → parse → gates →
 * upsert or structure alarm; timeouts/5xx → attempts (logged honestly);
 * day 25 with nothing captured and no alert → the window closes missed.
 */
export async function runFire(
  env: { DB: D1Like },
  now: Date,
  fetchImpl: FetchLike,
): Promise<FireResult> {
  const db = env.DB;
  const target = targetMonthOf(now);

  // 1. The skip months — the series publishes no June or November issue;
  //    no request is ever made for them.
  if (isSkipMonthKey(target)) {
    await logEvent(db, now.toISOString(), target, "skip-month", "the series publishes no June or November issue");
    return { action: "skip-month", target };
  }

  // 2. Stop-on-success / the window already closed.
  const row = await getRow(db, target);
  if (row?.status === "ok") return { action: "stop-on-success", target };
  if (row?.status === "missed") return { action: "window-closed", target };

  // 3. The hard bound.
  const priorAttempts = row ? row.attempts : await countLogAttempts(db, target);
  let action: string;
  let detail: string | undefined;
  let captured = false;
  let alerted = false;

  if (priorAttempts >= MAX_ATTEMPTS_PER_MONTH) {
    action = "attempt-bound";
    detail = `${priorAttempts} attempts already recorded — the month bound holds`;
  } else {
    // 4. One fetch.
    const url = canonicalUrlFor(target);
    try {
      const res = await fetchImpl(url, {
        headers: WGC_HEADERS,
        redirect: "follow",
        signal: AbortSignal.timeout(25_000),
      });
      if (res.status === 404) {
        await recordFailedAttempt(db, target, now, "fetch-404", `HTTP 404 — the issue is not published yet`);
        action = "fetch-404";
      } else if (res.status !== 200) {
        const why = `HTTP ${res.status}`;
        await recordFailedAttempt(db, target, now, "fetch-error", why);
        action = "fetch-error";
        detail = why;
      } else {
        const html = await res.text();
        const outcome = await applyCapture(db, target, res.url, html, now);
        action = outcome.outcome;
        if (outcome.outcome === "stored" || outcome.outcome === "re-stored") {
          captured = true;
          detail = `${outcome.segments} segments, variant ${outcome.variant}, attempts ${outcome.attempts}`;
        } else if (outcome.outcome === "structure-alert") {
          alerted = true;
          detail = outcome.reason;
        } else if (outcome.outcome === "redirect-rejected") {
          detail = `final URL ${outcome.finalUrl}`;
        }
      }
    } catch (e) {
      const why = `network error: ${String(e).slice(0, 120)}`;
      await recordFailedAttempt(db, target, now, "fetch-error", why);
      action = "fetch-error";
      detail = why;
    }
  }

  // 5. The window close: day 25 (the last fire day) or later, nothing
  //    captured, no alert standing — a stated miss, never a silent gap.
  if (!captured && !alerted && now.getUTCDate() >= WINDOW_CLOSE_DAY) {
    const attempts = await countLogAttempts(db, target);
    const nowIso = now.toISOString();
    await db
      .prepare(
        `INSERT INTO wgc_commentary
           (month_key, source_url, headline, published_at, fetched_at, highlights_json,
            block_variant, content_hash, status, attempts, last_attempt_at, updated_at)
         VALUES (?, ?, NULL, NULL, ?, '[]', 'none', ?, 'missed', ?, ?, NULL)`,
      )
      .bind(target, canonicalUrlFor(target), nowIso, await emptyContentHash(), attempts, nowIso)
      .run();
    await logEvent(
      db,
      nowIso,
      target,
      "missed",
      `the window closed on day ${now.getUTCDate()} after ${attempts} attempts with no issue`,
    );
    action = "missed";
    detail = `${attempts} attempts, window closed`;
  }

  return { action, target, detail };
}
