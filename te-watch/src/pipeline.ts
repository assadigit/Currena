/**
 * The TE watch pipeline — the twice-daily capture logic of
 * docs/te-daily-briefing-spec.md §4.2–§4.6, implemented once and shared by
 * the currena-te-watch Worker's scheduled handler and the one-off seed
 * (scripts/te-seed.ts). Plain TypeScript over a D1-compatible interface;
 * zero dependencies — the wgc-watch pipeline's own sibling pattern.
 *
 * The clock facts this encodes (the 2026-11-24 census + the §12.1 re-probe):
 *  - The commodity page's News Stream exposes exactly the latest three
 *    items, newest first; the top item's body is byte-identical to the
 *    page's own h2#description.
 *  - TE publishes 1–2 briefings/day (an Asia-morning piece ~02:00 UTC and
    an intraday second piece ~14:46 UTC observed).
 *  - The fire clock: "0 5,16 * * *" UTC — 05:00 (08:30 Tehran, captures
 *    the Asia-morning piece) and 16:00 (19:30 Tehran, captures the
 *    intraday piece), ONE trigger, the account's fifth and last cron slot.
 *
 * The target rule, per fire: fetch the page once; take the
 * BRIEFING-QUALIFIED items in order (body ≥ 200 chars — the flash-item
 * discovery's own scope: price-change notes are skipped, never stored,
 * never fetched, never an alarm); for each qualified item whose news_id
 * is not already stored (status ok) → capture it (one detail GET, the
 * gates, the upsert); items already stored → the hash rule (unchanged →
 * nothing written; changed → re-store, updated_at bumped, a re-stored log
 * line — never silent). Nothing new → exit (the honest quiet fire: one
 * `fire` log line, zero briefing writes — the card keeps showing the
 * last briefing with its own date, a stated fact, not a gap). A stream
 * whose slots are ALL flash items passes the gates through its real
 * h2#description and exits quiet (the window rotated past the briefing).
 *
 * The Persian translation rides the same path (§5): right after a
 * store/re-store, plus a retry pre-step at the top of every fire for
 * stored-but-untranslated rows (at most ONE row per fire — the latest;
 * an AI failure never fails the capture, never re-fetches English,
 * retries on the next fire). The step is a no-op without an AI binding.
 *
 * The alarm vocabulary (§4.5): a 200 page that fails the gates is a
 * structure alarm — status = 'structure_alert', the log line names the
 * failed gate, the last known good stays served. A challenge/interstitial
 * page (403 or the "Just a moment" signature) is a fetch-failed, NOT an
 * alarm — the alarm vocabulary stays for template drift. Timeouts, 5xx,
 * 403 and 429 are fetch-failed too: no in-window backoff, the fire clock
 * is the backoff.
 */

import {
  parseNewsStream,
  h2Description,
  articleLd,
  detailBody,
  pageGates,
  itemGates,
  briefingItemsOf,
  contentHash,
  emptyContentHash,
  isChallengePage,
  type TeStreamItem,
  type TeStreamParse,
} from "./parser";
import { translateBriefing, translateNote, type AiLike } from "./translate";

/* ------------------------------------------------------------------ *
 * The source + clock contract
 * ------------------------------------------------------------------ */

/** The cron trigger, mirrored in te-watch/wrangler.jsonc (single source: this constant). */
export const TE_CRONS = ["0 5,16 * * *"] as const;

/** The commodity page every fire GETs (§4.3's one page GET). */
export const TE_PAGE_URL = "https://tradingeconomics.com/commodity/gold";

/** The detail page template per item (§4.3's one detail GET per NEW item). */
export function teDetailUrl(newsId: string): string {
  return `https://tradingeconomics.com/commodity/gold/news/${newsId}`;
}

/** The tested headers (the probe's exact set, §12.1 re-run with the same). */
export const TE_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept-Language": "en-GB,en;q=0.9",
};

/** The fetch timeout (§4.3: redirects followed, 25 s). */
export const TE_TIMEOUT_MS = 25_000;

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

export interface TeRow {
  news_id: string;
  published_at: string;
  title: string;
  body: string;
  source_url: string;
  author: string | null;
  fetched_at: string;
  content_hash: string;
  status: string; // ok | structure_alert
  updated_at: string | null;
}

export interface LogLine {
  ts: string;
  news_id: string | null;
  event: string;
  detail: string | null;
}

/* ------------------------------------------------------------------ *
 * The SQL (raw D1 statements — the watch worker carries no Prisma)
 * ------------------------------------------------------------------ */

export async function getRow(db: D1Like, newsId: string): Promise<TeRow | null> {
  return db
    .prepare("SELECT * FROM te_briefing WHERE news_id = ?")
    .bind(newsId)
    .first<TeRow>();
}

/**
 * One log line. The ts is stamped at write time (real wall-clock ISO UTC,
 * monotonic within a fire) — the rows carry the fire's own `now`, the log
 * carries when each line actually landed; both honest, both ordered.
 */
export async function logEvent(
  db: D1Like,
  newsId: string | null,
  event: string,
  detail?: string,
): Promise<void> {
  await db
    .prepare("INSERT INTO te_scrape_log (ts, news_id, event, detail) VALUES (?, ?, ?, ?)")
    .bind(new Date().toISOString(), newsId, event, detail ?? null)
    .run();
}

/** The latest stored briefing row that is real content (status ok). */
export async function latestOkRow(db: D1Like): Promise<TeRow | null> {
  return db
    .prepare("SELECT * FROM te_briefing WHERE status = 'ok' ORDER BY published_at DESC LIMIT 1")
    .first<TeRow>();
}

/** The latest stored-but-untranslated row (the pre-step's retry target — at most one per fire). */
export async function latestUntranslatedRow(db: D1Like): Promise<TeRow | null> {
  return db
    .prepare(
      `SELECT b.* FROM te_briefing b
         LEFT JOIN te_briefing_fa f ON f.news_id = b.news_id
        WHERE b.status = 'ok' AND (f.news_id IS NULL OR f.content_hash <> b.content_hash)
        ORDER BY b.published_at DESC LIMIT 1`,
    )
    .first<TeRow>();
}

/* ------------------------------------------------------------------ *
 * The capture path — shared by the scheduled fire and the seed
 * ------------------------------------------------------------------ */

export type StoreOutcome =
  | { outcome: "stored"; newsId: string; hash: string }
  | { outcome: "re-stored"; newsId: string; hash: string }
  | { outcome: "unchanged"; newsId: string }
  | { outcome: "skipped"; newsId: string; reason: string };

/**
 * Apply one NEW stream item to the store: the detail GET happens in the
 * caller (the fire and the seed fetch identically); this runs the gates
 * and the upsert. Store nothing that fails: a failed gate is returned as
 * a skip (the fire logs it as the structure alert it names), the English
 * row is never written half.
 */
export async function applyStreamItem(
  db: D1Like,
  item: TeStreamItem,
  ld: { headline?: string; datePublished?: string; dateModified?: string; url?: string; author?: string | null } | null,
  detail: string | null,
  now: Date,
): Promise<StoreOutcome> {
  const gates = itemGates(item, ld, detail);
  if (!gates.pass) {
    return { outcome: "skipped", newsId: item.news_id, reason: gates.reason ?? "unknown gate failure" };
  }

  const nowIso = now.toISOString();
  const hash = await contentHash(item.title, item.body);
  const row = await getRow(db, item.news_id);
  const sourceUrl = ld?.url ?? teDetailUrl(item.news_id);
  const publishedAt = ld?.datePublished ?? "";
  const author = ld?.author ?? null;

  if (row && row.status === "ok" && row.content_hash === hash) {
    // Unchanged (a re-walk, or TE re-serving the same briefing): nothing
    // is written — no row update, no log line. The idempotence contract.
    return { outcome: "unchanged", newsId: item.news_id };
  }

  // A change over a row that already carries real content is a re-store
  // (updated_at bumped, a re-stored log line); everything else — first
  // capture, an alert healing — is a store.
  const hadContent = row !== null && row.body !== "";
  const reStore = row !== null && (row.status === "ok" || hadContent);

  if (!row) {
    await db
      .prepare(
        `INSERT INTO te_briefing
           (news_id, published_at, title, body, source_url, author, fetched_at, content_hash, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ok', NULL)`,
      )
      .bind(item.news_id, publishedAt, item.title, item.body, sourceUrl, author, nowIso, hash)
      .run();
  } else {
    await db
      .prepare(
        `UPDATE te_briefing SET
           published_at = ?, title = ?, body = ?, source_url = ?, author = ?, fetched_at = ?,
           content_hash = ?, status = 'ok', updated_at = ?
         WHERE news_id = ?`,
      )
      .bind(publishedAt, item.title, item.body, sourceUrl, author, nowIso, hash, reStore ? nowIso : null, item.news_id)
      .run();
  }

  await logEvent(
    db,
    item.news_id,
    reStore ? "re-stored" : "stored",
    reStore
      ? `TE edited the briefing after publication (content hash changed); published ${publishedAt || "?"}`
      : `published ${publishedAt || "?"}, ${item.body.length} chars${author ? `, by ${author}` : ""}`,
  );
  return { outcome: reStore ? "re-stored" : "stored", newsId: item.news_id, hash };
}

/**
 * The stored-item hash rule (§4.3 step 4): recompute the content hash from
 * the commodity page's copy; unchanged → nothing written; changed →
 * re-store. No detail GET — only genuinely NEW items pay one.
 */
export async function applyStoredItem(db: D1Like, item: TeStreamItem, now: Date): Promise<StoreOutcome> {
  const hash = await contentHash(item.title, item.body);
  const row = await getRow(db, item.news_id);
  if (row && row.status === "ok" && row.content_hash === hash) {
    return { outcome: "unchanged", newsId: item.news_id };
  }
  const nowIso = now.toISOString();
  const hadContent = row !== null && row.body !== "";
  const reStore = row !== null && (row.status === "ok" || hadContent);
  if (!row) {
    // The stream re-served an item we never stored (a healed alert or a
    // seed gap) — but the detail fields are unknown without a detail GET;
    // the fire's new-item path is the honest route. A stored-less item
    // reaching here is returned as a skip the fire handles by fetching.
    return { outcome: "skipped", newsId: item.news_id, reason: "no stored row — the new-item path (detail GET) owns the first capture" };
  }
  await db
    .prepare(
      `UPDATE te_briefing SET
         title = ?, body = ?, fetched_at = ?, content_hash = ?, status = 'ok', updated_at = ?
       WHERE news_id = ?`,
    )
    .bind(item.title, item.body, nowIso, hash, reStore ? nowIso : null, item.news_id)
    .run();
  await logEvent(
    db,
    item.news_id,
    "re-stored",
    `TE edited the briefing after publication (content hash changed); body now ${item.body.length} chars`,
  );
  return { outcome: "re-stored", newsId: item.news_id, hash };
}

/* ------------------------------------------------------------------ *
 * The structure alarm (§4.5 — the last known good stays served)
 * ------------------------------------------------------------------ */

/**
 * Record a structure alarm: the log line names the failed gate; the last
 * known good stays served. The row side mirrors the WGC discipline — when
 * a row exists for the stream's top item it keeps its content untouched
 * and only its status moves; when the top item parsed but was never
 * stored, a marker row records the alarm (empty content markers, never a
 * partial briefing); when the stream did not parse at all, the latest
 * stored row is the one marked (still untouched); when nothing exists
 * anywhere, the log line alone carries the alarm.
 */
export async function recordStructureAlert(
  db: D1Like,
  parsed: TeStreamParse,
  now: Date,
  reason: string,
): Promise<void> {
  const nowIso = now.toISOString();
  // The marker key: the top BRIEFING-QUALIFIED item when one exists (a
  // flash at the raw top slot is not the briefing the alarm is about),
  // else the raw top item, else the latest stored row.
  const topKey =
    briefingItemsOf(parsed.items)[0]?.news_id ??
    (parsed.items.length > 0 ? parsed.items[0]!.news_id : null);

  let key = topKey;
  if (!key) {
    const latest = await db
      .prepare("SELECT news_id FROM te_briefing ORDER BY rowid DESC LIMIT 1")
      .first<{ news_id: string }>();
    key = latest?.news_id ?? null;
  }

  if (key) {
    const row = await getRow(db, key);
    if (!row) {
      await db
        .prepare(
          `INSERT INTO te_briefing
             (news_id, published_at, title, body, source_url, author, fetched_at, content_hash, status, updated_at)
           VALUES (?, '', '', '', ?, NULL, ?, ?, 'structure_alert', NULL)`,
        )
        .bind(key, teDetailUrl(key), nowIso, await emptyContentHash())
        .run();
    } else {
      // The last known good stays in the row untouched — only the status moves.
      await db
        .prepare("UPDATE te_briefing SET status = 'structure_alert' WHERE news_id = ?")
        .bind(key)
        .run();
    }
  }
  await logEvent(db, key, "structure-alert", reason);
}

/* ------------------------------------------------------------------ *
 * The scheduled fire (§4.2–§4.3)
 * ------------------------------------------------------------------ */

export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string>; redirect?: "follow"; signal?: AbortSignal },
) => Promise<{ status: number; url: string; text(): Promise<string> }>;

export interface FireResult {
  action: string;
  detail?: string;
}

/**
 * One cron fire. The pre-step retries the latest stored-but-untranslated
 * row (at most one, without re-fetching English); then one page GET:
 * a non-200 or a challenge signature → fetch-failed (next fire is the
 * backoff); a 200 → parse → page gates → the items in order (new → one
 * detail GET each, the item gates, the upsert; stored → the hash rule);
 * nothing new and nothing changed → the honest quiet fire (one `fire` log
 * line, zero briefing writes). The translation rides every store and
 * re-store — an AI failure never fails the capture.
 */
export async function runFire(
  env: { DB: D1Like; AI?: AiLike },
  now: Date,
  fetchImpl: FetchLike,
): Promise<FireResult> {
  const db = env.DB;
  const nowIso = now.toISOString();
  const notes: string[] = [];

  // 1. The translation retry pre-step — at the top of every fire, at most
  //    one row, zero English fetches. An AI failure never fails the fire.
  if (env.AI) {
    const pending = await latestUntranslatedRow(db);
    if (pending) {
      const note = translateNote(await translateBriefing(db, env.AI, pending.news_id, now));
      if (note) notes.push(note);
    }
  }

  // 2. One page GET.
  let res: Awaited<ReturnType<FetchLike>>;
  try {
    res = await fetchImpl(TE_PAGE_URL, {
      headers: TE_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(TE_TIMEOUT_MS),
    });
  } catch (e) {
    const why = `network error: ${String(e).slice(0, 120)}`;
    await logEvent(db, null, "fetch-failed", why);
    return { action: "fetch-failed", detail: why };
  }

  if (res.status !== 200) {
    const why = `HTTP ${res.status}${res.status === 403 ? " (the challenge posture — no arms race, the card keeps the last known good)" : ""}`;
    await logEvent(db, null, "fetch-failed", why);
    return { action: "fetch-failed", detail: why };
  }

  let html: string;
  try {
    html = await res.text();
  } catch (e) {
    const why = `body read error: ${String(e).slice(0, 120)}`;
    await logEvent(db, null, "fetch-failed", why);
    return { action: "fetch-failed", detail: why };
  }

  if (isChallengePage(html)) {
    const why = "a challenge/interstitial page was served (the “Just a moment” signature) — fetch-failed, not a structure alarm";
    await logEvent(db, null, "fetch-failed", why);
    return { action: "fetch-failed", detail: why };
  }

  // 3. Parse + the page-level gates.
  const parsed = parseNewsStream(html);
  const gates = pageGates(parsed, h2Description(html));
  if (!gates.pass) {
    const reason = gates.reason ?? "unknown gate failure";
    await recordStructureAlert(db, parsed, now, reason);
    return { action: "structure-alert", detail: reason };
  }

  // 4. The briefing-qualified items, in order (flash items skipped — the
  //    discovery's scope: not briefings, not fetched, not stored).
  const briefings = briefingItemsOf(parsed.items);
  const flashSkipped = parsed.items.length - briefings.length;
  let anyWrite = false;
  let stored = 0;
  let reStored = 0;
  let unchanged = 0;
  let skipped = 0;

  for (const item of briefings) {
    const row = await getRow(db, item.news_id);
    let outcome: StoreOutcome;

    if (row && (row.status === "ok" || row.body !== "")) {
      // A stored item — the hash rule, no detail GET.
      outcome = await applyStoredItem(db, item, now);
    } else {
      // A genuinely new item — one detail GET, then the gates + upsert.
      let detailHtml: string | null = null;
      try {
        const detailRes = await fetchImpl(teDetailUrl(item.news_id), {
          headers: TE_HEADERS,
          redirect: "follow",
          signal: AbortSignal.timeout(TE_TIMEOUT_MS),
        });
        if (detailRes.status === 200) detailHtml = await detailRes.text();
      } catch {
        detailHtml = null; // the item gates fail-closed below — next fire retries
      }
      const ld = detailHtml !== null ? articleLd(detailHtml) : null;
      const detail = detailHtml !== null ? detailBody(detailHtml) : null;
      outcome = await applyStreamItem(db, item, ld, detail, now);
    }

    if (outcome.outcome === "stored" || outcome.outcome === "re-stored") {
      anyWrite = true;
      if (outcome.outcome === "stored") stored++;
      else reStored++;
      // The translation rides the capture path — one run, once per
      // briefing (a re-store re-translates through the freshness gate
      // inside). Never fails the capture.
      if (env.AI) {
        const note = translateNote(await translateBriefing(db, env.AI, item.news_id, now));
        if (note) notes.push(note);
      }
    } else if (outcome.outcome === "unchanged") {
      unchanged++;
    } else {
      // A skipped NEW item is a failed gate — the structure alarm path.
      skipped++;
      await logEvent(db, item.news_id, "structure-alert", outcome.reason);
    }
  }

  // 5. The honest quiet fire: nothing new, nothing changed — exactly one
  //    `fire` log line, zero briefing writes. The card keeps showing the
  //    last briefing with its own date — a stated fact, not a gap. (A
  //    translation heal from the pre-step rides the same line's detail —
  //    the fire's liveness evidence, never a second silent path.)
  if (!anyWrite && skipped === 0) {
    const quietDetail =
      (flashSkipped > 0
        ? `quiet fire — the stream's ${briefings.length} briefing item(s) all unchanged, ${flashSkipped} flash item(s) skipped`
        : `quiet fire — the stream's ${briefings.length} briefing item(s) all unchanged`) +
      (notes.length > 0 ? `; ${notes.join("; ")}` : "");
    await logEvent(db, null, "fire", quietDetail);
    return { action: "quiet", detail: `${unchanged} briefing item(s) unchanged${flashSkipped > 0 ? `, ${flashSkipped} flash item(s) skipped` : ""}` };
  }

  const summary: string[] = [];
  if (stored > 0) summary.push(`${stored} stored`);
  if (reStored > 0) summary.push(`${reStored} re-stored`);
  if (unchanged > 0) summary.push(`${unchanged} unchanged`);
  if (flashSkipped > 0) summary.push(`${flashSkipped} flash item(s) skipped (not briefings)`);
  if (skipped > 0) summary.push(`${skipped} skipped (gate failures logged as structure alerts)`);
  if (notes.length > 0) summary.push(notes.join("; "));
  if (summary.length === 0) summary.push("nothing written");
  return { action: anyWrite ? "capture" : skipped > 0 ? "gates-failed" : "quiet-with-translation", detail: summary.join("; ") };
}
