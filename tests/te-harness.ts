// The TE pipeline verification harness — the implementing sitting's
// evidence for docs/te-daily-briefing-spec.md §12 acceptance items
// 2 (the parser harness + the negatives), 3 (the clock walk) and the
// DDL's local idempotence twin (item 4's scratch half; the remote twin
// runs at deploy).
//
// Run: `bun tests/te-harness.ts` (from the repository root).
//
// What it proves, phase by phase:
//   A. The PRODUCTION parser (te-watch/src/parser.ts — imported, never
//      copied) over the LIVE commodity page, fetched with the probe's
//      exact headers, diffed against the recorded census
//      (docs/evidence/te-gold-census-2026-11-24.json): the News Stream
//      card located, the census's three items with verbatim titles and
//      the recorded body lengths (939/910/948), the h2#description
//      cross-check true — or, if the live stream moved on (a genuinely
//      new briefing published since the census), the structural identity
//      still holds (≥1 item, the h2 cross-check, top title verbatim-
//      shaped) and the moved-on fact is recorded honestly.
//      Plus the detail page's Article JSON-LD contract: the headline
//      equals the stream title, datePublished present, the detail body
//      byte-identical to the commodity copy.
//   B. The negatives: a synthetic login-page negative (a stream item
//      whose body is under the 200-character gate → the structure alarm
//      path, nothing stored) — plus a page with no News Stream at all
//      (the same alarm vocabulary) — and a challenge-page negative (the
//      "Just a moment" signature → fetch-failed, nothing parsed as
//      content, never an alarm).
//   C. The clock walk over the production fire (te-watch/src/pipeline.ts
//      runFire) against a scratch SQLite D1 with a mock network and a
//      mock AI: the first fire captures the three items (three detail
//      GETs, three stores); a nothing-new fire is the honest quiet fire
//      (ONE `fire` log line, zero briefing writes); a translate failure
//      logs `translate-failed` with the English row safe and the next
//      fire's pre-step heals it; a new top item is captured (detail GET +
//      store + translation); a TE edit re-stores with the hash bumped,
//      `updated_at` moved and a `re-stored` log line; a re-translation
//      follows the re-store through the freshness gate; an unchanged
//      re-run writes nothing.
//   D. The DDL applies idempotently — twice against the scratch database,
//      no error (the remote D1 twin of this proof runs at deploy).
//
// Evidence: tests/te-harness-<date>.json (this file's structured record)
// — the house pattern: JSON under tests/.

import { Database } from "bun:sqlite";
import {
  parseNewsStream,
  h2Description,
  articleLd,
  detailBody,
  pageGates,
  isChallengePage,
  briefingItemsOf,
  BRIEFING_BODY_FLOOR,
  type TeStreamItem,
} from "../te-watch/src/parser";
import {
  runFire,
  teDetailUrl,
  TE_PAGE_URL,
  TE_HEADERS,
  getRow,
  type D1Like,
  type D1Statement,
  type FetchLike,
} from "../te-watch/src/pipeline";
import { translateBriefing, type AiLike, type TeFaRow } from "../te-watch/src/translate";

const RAN_AT = new Date().toISOString();
const CENSUS_PATH = "docs/evidence/te-gold-census-2026-11-24.json";
const DDL_PATH = "te-watch/ddl.sql";
const SCRATCH = "/tmp/te-harness-scratch.db";
const OUT_PATH = `tests/te-harness-${RAN_AT.slice(0, 10)}.json`;

/* ------------------------------------------------------------------ *
 * The D1-compatible adapter over Bun's SQLite (the same engine D1 runs)
 * ------------------------------------------------------------------ */

class SqliteStatement implements D1Statement {
  constructor(private db: Database, private sql: string, private vals: unknown[] = []) {}
  bind(...vals: unknown[]): D1Statement {
    return new SqliteStatement(this.db, this.sql, vals);
  }
  async first<T = unknown>(): Promise<T | null> {
    const stmt = this.db.prepare(this.sql);
    const row = this.vals.length ? stmt.get(...this.vals) : stmt.get();
    return (row === undefined ? null : row) as T | null;
  }
  async all<T = unknown>(): Promise<{ results: T[] }> {
    const stmt = this.db.prepare(this.sql);
    const rows = this.vals.length ? stmt.all(...this.vals) : stmt.all();
    return { results: rows as T[] };
  }
  async run(): Promise<{ success: true }> {
    const stmt = this.db.prepare(this.sql);
    if (this.vals.length) stmt.run(...this.vals);
    else stmt.run();
    return { success: true };
  }
}

function sqliteD1(db: Database): D1Like {
  return { prepare: (sql: string) => new SqliteStatement(db, sql) };
}

/* ------------------------------------------------------------------ *
 * The assertion bookkeeping (the WGC harness's own pattern)
 * ------------------------------------------------------------------ */

const failures: string[] = [];
const evidence: Record<string, unknown> = { ranAt: RAN_AT, phases: {} };

function check(phase: string, name: string, pass: boolean, extra?: unknown): void {
  const phases = evidence.phases as Record<string, Array<{ check: string; pass: boolean; extra?: unknown }>>;
  if (!Array.isArray(phases[phase])) phases[phase] = [];
  phases[phase].push({ check: name, pass, extra });
  if (!pass) failures.push(`${phase}: ${name}`);
  console.log(`${pass ? "PASS" : "FAIL"}  [${phase}] ${name}${extra !== undefined && !pass ? ` — ${JSON.stringify(extra)}` : ""}`);
}

/* ------------------------------------------------------------------ *
 * Phase A — the production parser over the LIVE page, diffed vs census
 * ------------------------------------------------------------------ */

const census = await Bun.file(CENSUS_PATH).json();
const censusItems: Array<{ news_id: string; title: string; body_chars: number; datePublished: string }> =
  census.observed_stream;

const liveRes = await fetch(TE_PAGE_URL, { headers: TE_HEADERS, redirect: "follow", signal: AbortSignal.timeout(25_000) });
const liveHtml = await liveRes.text();
check("A", `the live commodity page answered 200 (${liveHtml.length} bytes)`, liveRes.status === 200, { status: liveRes.status, bytes: liveHtml.length });

const liveParsed = parseNewsStream(liveHtml);
check("A", "the News Stream card was located and items parsed", liveParsed.found && liveParsed.items.length >= 1, { found: liveParsed.found, items: liveParsed.items.length });

/* The flash-item discovery's own scope: the capture set is the
   briefing-qualified items (body ≥ the floor); flash items are excluded. */
const liveBriefings = briefingItemsOf(liveParsed.items);
const liveFlash = liveParsed.items.filter((i) => i.body.length < BRIEFING_BODY_FLOOR);
check(
  "A",
  "the briefing-qualified scope: every item under the 200-char floor is excluded, at least one briefing remains (the flash-item discovery's own rule)",
  liveBriefings.length >= 1 && liveBriefings.every((i) => i.body.length >= BRIEFING_BODY_FLOOR),
  {
    flash: liveFlash.map((f) => ({ news_id: f.news_id, body_chars: f.body.length })),
    briefingIds: liveBriefings.map((b) => b.news_id),
  },
);

const liveH2 = h2Description(liveHtml);
check(
  "A",
  "the h2#description cross-check is true (the TOP BRIEFING-QUALIFIED item's body equals the page's own summary — the flash at the raw top slot does not move the h2)",
  liveH2 !== null && liveH2 === liveBriefings[0]!.body,
  { h2Chars: liveH2?.length ?? 0, topBriefingChars: liveBriefings[0]?.body.length ?? 0, flashAtTop: liveFlash.length > 0 },
);

// The census identity: each census item still inside the live window
// matches verbatim; the rotated-out ones are named honestly (the stream
// is a 3-slot window — items rotate out as new ones publish).
const rotatedOut: string[] = [];
for (const c of censusItems) {
  const live = liveBriefings.find((i) => i.news_id === c.news_id);
  if (!live) {
    rotatedOut.push(c.news_id);
    continue;
  }
  check("A", `census item ${c.news_id}: title verbatim`, live.title === c.title, { live: live.title, census: c.title });
  check("A", `census item ${c.news_id}: body ${c.body_chars} chars (census byte count)`, live.body.length === c.body_chars, { live: live.body.length, census: c.body_chars });
}
check(
  "A",
  "the live window state is honest — the rotated-out census items named, the in-window items carry the structural identity",
  liveBriefings.length >= 1,
  { rotatedOut, liveIds: liveParsed.items.map((i) => i.news_id), liveBriefingIds: liveBriefings.map((b) => b.news_id), censusIds: censusItems.map((c) => c.news_id) },
);

// The detail page contract, over the top briefing-qualified item.
const topBriefing = liveBriefings[0]!;
const detailRes = await fetch(teDetailUrl(topBriefing.news_id), { headers: TE_HEADERS, redirect: "follow", signal: AbortSignal.timeout(25_000) });
const detailHtml = await detailRes.text();
const ld = articleLd(detailHtml);
check("A", `the detail page ${topBriefing.news_id} answered 200 and carries the Article JSON-LD`, detailRes.status === 200 && ld !== null, { status: detailRes.status, ld: ld === null ? null : "present" });
check("A", "the detail JSON-LD headline equals the stream title (verbatim identity)", ld?.headline === topBriefing.title, { ld: ld?.headline, title: topBriefing.title });
check("A", "the detail JSON-LD datePublished is present", typeof ld?.datePublished === "string" && ld.datePublished !== "", { datePublished: ld?.datePublished });
const detailTopBody = detailBody(detailHtml);
check("A", "the detail page's own body copy (its meta description — the rotation-proof source) is byte-identical to the commodity page's", detailTopBody === topBriefing.body, { detailChars: detailTopBody?.length ?? 0, commodityChars: topBriefing.body.length });

(evidence.phases as Record<string, unknown>).A_live = {
  pageBytes: liveHtml.length,
  items: liveParsed.items.map((i) => ({ news_id: i.news_id, kind: i.body.length >= BRIEFING_BODY_FLOOR ? "briefing" : "flash", body_chars: i.body.length })),
  h2EqualsTopBriefingBody: liveH2 === liveBriefings[0]!.body,
  detailLd: ld,
};

/* ------------------------------------------------------------------ *
 * Phase B — the negatives (synthetic, never stored)
 * ------------------------------------------------------------------ */

const ddl = await Bun.file(DDL_PATH).text();

/** A synthetic page in the commodity page's exact markup shape. The h2
 *  models the observed reality: it carries the TOP BRIEFING-QUALIFIED
 *  item's body (the flash at the raw top slot does not move the h2), or
 *  nothing when the page carries no briefing — an explicit override rides
 *  the rotated-window case (a real h2 with an all-flash stream). */
function buildPage(items: Array<{ news_id: string; title: string; body: string }>, h2Override?: string): string {
  const blocks = items
    .map(
      (it) => `
                <div class="list-group-item indc_news_stream te-stream-repeater">
                    <b>
                        <a href='/commodity/gold/news/${it.news_id}'>${it.title}</a>
                    </b>
                    <div class="comment more">${it.body}</div>
                    <small class="te-stream-date">2026-11-24</small><br />
                </div>
            `,
    )
    .join("");
  const brief = items.find((it) => it.body.length >= BRIEFING_BODY_FLOOR);
  const h2 = h2Override !== undefined ? h2Override : (brief?.body ?? "");
  return `<html><body>
        <div role="tabpanel" class="tab-pane card"><div class="card-header">Gold - Summary</div><div class="card-body"><h2 id="description" style="line-height: 1.45em;">${h2}</h2></div></div>
        <div role="tabpanel" class="tab-pane card"><div class="card-header">News Stream</div>
        ${blocks}
        </div></body></html>`;
}

/** A synthetic detail page carrying the Article JSON-LD and the body in
 *  its meta description — the rotation-proof source the production
 *  detailBody reads (entities escaped exactly as TE writes them). */
function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function buildDetail(item: { news_id: string; title: string; body: string }, datePublished: string): string {
  return `<html><head><meta id="metaDesc" name="description" content="${escapeAttr(item.body)}"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"${item.title}","datePublished":"${datePublished}","dateModified":"${datePublished}","author":{"@type":"Person","name":"Clock Walk"},"url":"${teDetailUrl(item.news_id)}"}</script></head><body>
        <div class="list-group-item indc_news_stream te-stream-repeater"><b><a href='/commodity/gold/news/${item.news_id}'>${item.title}</a></b><div class="comment more">${item.body}</div></div>
        <div class="list-group-item indc_news_stream te-stream-repeater"><b><a href='/commodity/gold/news/1'>related</a></b><div class="comment more">related body</div></div>
        </body></html>`;
}

// B1 — the login-page negative: a stream item whose body is under the
// 200-character gate (an interstitial parsed as a briefing). The live
// items themselves ride the clock walk below; here the bodies are real
// (the top briefing's) with one deliberately truncated, and the page's
// own h2 is empty — an interstitial carries no real summary.
const loginBody = topBriefing.body.slice(0, 120);
const loginPage = buildPage([{ news_id: "600001", title: "Sign in to continue", body: loginBody }]);
const loginParsed = parseNewsStream(loginPage);
const loginGates = pageGates(loginParsed, h2Description(loginPage));
check("B", "the login-page negative: the body gate fires (structure alarm, not a store)", loginParsed.items.length === 1 && !loginGates.pass && loginGates.reason !== null && loginGates.reason.includes("200-character gate"), { gates: loginGates, bodyChars: loginBody.length });

// B1b — a page with no News Stream card at all (a pure interstitial).
const noStreamPage = `<html><head><title>Trading Economics</title></head><body><div class="container"><form>Username</form></div></body></html>`;
const noStreamGates = pageGates(parseNewsStream(noStreamPage), h2Description(noStreamPage));
check("B", "the no-stream negative: the no-card gate fires (structure alarm)", !noStreamGates.pass && (noStreamGates.reason ?? "").includes("no News Stream card"), { gates: noStreamGates });

// B1c — the rotated-window reaction (the addendum's gate reaction 2): an
// all-flash stream with a REAL h2 → the gates PASS — the window rotated
// past the briefing; the fire exits quiet, never an alarm.
const flashItem: TeStreamItem = liveFlash[0] ?? {
  news_id: "604014",
  title: "Gold is down by 2%",
  body: "Gold decreased 2% to 3562.37 USD/t.oz",
};
const rotatedPage = buildPage([flashItem], topBriefing.body);
const rotatedGates = pageGates(parseNewsStream(rotatedPage), h2Description(rotatedPage));
check("B", "the rotated-window reaction: zero briefing-qualified items + a real h2 → the gates PASS (the quiet fire — the window rotated past the briefing, never an alarm)", rotatedGates.pass, { gates: rotatedGates });

// B2 — the challenge-page negative: the "Just a moment" signature.
const challengePage = `<html><head><title>Just a moment...</title></head><body>challenge-error-text Enable JavaScript and cookies to continue</body></html>`;
check("B", "the challenge-page negative: the signature is detected", isChallengePage(challengePage), {});
check("B", "the real commodity page is NOT a challenge page", !isChallengePage(liveHtml), {});

/* ------------------------------------------------------------------ *
 * Phase C — the clock walk (the production runFire over a scratch D1)
 * ------------------------------------------------------------------ */

Bun.write(SCRATCH, "");
const walkDb = new Database(SCRATCH);
walkDb.exec(ddl);
const walk = sqliteD1(walkDb);

// The clock walk's items: the LIVE stream's briefing-qualified items (real
// bodies) with the flash item riding the raw top slot exactly as the live
// page serves it (the discovery's own shape — when the live window has no
// flash, the addendum's recorded one rides in so the skip path is always
// exercised), plus a clearly-synthetic briefing for the new-item day.
const walkItems: TeStreamItem[] = [
  { ...flashItem },
  ...liveBriefings.map((i) => ({ ...i })),
];
const nBrief = liveBriefings.length;
const syntheticNewItem: TeStreamItem = {
  news_id: "999999",
  title: "Clock-walk synthetic briefing — not a real Trading Economics item",
  body: `${topBriefing.body.slice(0, 400)} (synthetic continuation for the clock walk — never stored anywhere but the scratch database.) ${topBriefing.body.slice(-200)}`,
};

const calls: string[] = [];
let pageCount = 0;
let detailCount = 0;
/** The mock network: pages keyed by a mutable script. */
const CENSUS_DATE: Record<string, string> = Object.fromEntries(censusItems.map((c) => [c.news_id, c.datePublished]));
const net: { page: () => string; detail: (id: string) => string | null } = {
  page: () => buildPage(walkItems),
  detail: (id) => {
    const item = walkItems.find((i) => i.news_id === id) ?? (id === syntheticNewItem.news_id ? syntheticNewItem : undefined);
    if (!item) return null;
    const date = id === syntheticNewItem.news_id ? "2026-11-25T02:00:00Z" : CENSUS_DATE[id] ?? "2026-11-24T02:17:13Z";
    return buildDetail(item, date);
  },
};

const mockFetch: FetchLike = async (url) => {
  calls.push(url);
  if (url === TE_PAGE_URL) {
    pageCount++;
    return { status: 200, url, text: async () => net.page() };
  }
  if (url.startsWith("https://tradingeconomics.com/commodity/gold/news/")) {
    detailCount++;
    const body = net.detail(url.split("/").pop() ?? "");
    return body === null
      ? { status: 404, url, text: async () => "" }
      : { status: 200, url, text: async () => body };
  }
  return { status: 404, url, text: async () => "" };
};

/** The mock AI: records calls, honors a fail-mode switch. */
const aiCalls: Array<{ model: string; input: unknown }> = [];
let aiFail = false;
const mockAi: AiLike = {
  sourceModel: "clock-walk-mock-engine",
  async run(model: string, input: Record<string, unknown>) {
    aiCalls.push({ model, input });
    if (aiFail) throw new Error("mock engine quota exhaustion (the clock walk's simulated failure)");
    const user = JSON.parse(String(input.messages?.[1]?.content ?? "{}")) as { headline?: string; body?: string };
    return {
      choices: [{ message: { content: JSON.stringify({ headline: `ترجمهٔ آزمایشی: ${user.headline ?? ""}`, body: `متن فارسی آزمایشی برای نیم‌ساعت شبانه‌روزی — ${user.body ?? ""}` }) } }],
    };
  },
};

function logRows(): Array<{ ts: string; event: string; news_id: string | null; detail: string | null }> {
  return walkDb
    .prepare("SELECT ts, event, news_id, detail FROM te_scrape_log ORDER BY rowid ASC")
    .all() as Array<{ ts: string; event: string; news_id: string | null; detail: string | null }>;
}

/** A synchronous row lookup (the walk's own scratch store). */
function getRowSync(newsId: string): { news_id: string } | null {
  return (walkDb.prepare("SELECT news_id FROM te_briefing WHERE news_id = ?").get(newsId) ?? null) as { news_id: string } | null;
}

// C1 — the first fire (empty store): the briefings stored, the flash skipped, no AI binding.
let r = await runFire({ DB: walk }, new Date("2026-11-24T16:00:00Z"), mockFetch);
check("C", `fire 1 (empty store, no AI): action capture, ${nBrief} stored`, r.action === "capture" && (r.detail ?? "").includes(`${nBrief} stored`), r);
check("C", `fire 1: exactly one page GET and ${nBrief} detail GETs (the flash item pays NO detail GET)`, pageCount === 1 && detailCount === nBrief, { pageCount, detailCount });
check("C", `fire 1: ${nBrief} ok rows, verbatim titles and bodies, no fa rows — and the flash item NEVER stored`, walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing WHERE status='ok'").get().n === nBrief && walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing_fa").get().n === 0 && getRowSync(flashItem.news_id) === null, { flashId: flashItem.news_id });
const fire1Row = await getRow(walk, topBriefing.news_id);
check("C", "fire 1: the JSON-LD author and datePublished landed verbatim (from the walk's own detail pages)", fire1Row?.author === "Clock Walk" && fire1Row?.published_at === CENSUS_DATE[topBriefing.news_id], { author: fire1Row?.author, published_at: fire1Row?.published_at });

// C2 — the quiet fire: nothing new, nothing changed, no AI.
const logBefore = logRows().length;
const briefingWritesBefore = walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing").get().n;
r = await runFire({ DB: walk }, new Date("2026-11-24T16:10:00Z"), mockFetch);
const quietLines = logRows().slice(logBefore);
check("C", "fire 2 (nothing new): the honest quiet fire — action quiet", r.action === "quiet", r);
check("C", "fire 2: exactly ONE fire log line, zero other lines", quietLines.length === 1 && quietLines[0]!.event === "fire", { quietLines });
check("C", "fire 2: zero briefing writes (row count unchanged, no updated_at bumps)", walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing").get().n === briefingWritesBefore && walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing WHERE updated_at IS NOT NULL").get().n === 0, {});

// C3 — the translate-failure discipline: a new day, the AI fails.
aiFail = true;
walkItems.unshift(syntheticNewItem);
net.page = () => buildPage(walkItems.slice(0, 3)); // a new day: the newest three, the oldest rotated out
r = await runFire({ DB: walk, AI: mockAi }, new Date("2026-11-25T05:00:00Z"), mockFetch);
check("C", "fire 3 (new item, AI failing): the capture still lands — English stored, action capture", r.action === "capture" && (r.detail ?? "").includes("1 stored"), r);
check("C", "fire 3: the synthetic item's English row is safe (status ok)", (await getRow(walk, syntheticNewItem.news_id))?.status === "ok", {});
check("C", "fire 3: translate-failed logged, no fa row", logRows().some((l) => l.event === "translate-failed" && l.news_id === syntheticNewItem.news_id) && walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing_fa").get().n === 0, {});

// C4 — the retry-on-next-fire discipline: the AI heals, the next fire's
// pre-step translates the stored-but-untranslated row WITHOUT any English
// re-fetch.
aiFail = false;
const callsBeforeHeal = calls.length;
r = await runFire({ DB: walk, AI: mockAi }, new Date("2026-11-25T16:00:00Z"), mockFetch);
const healLines = logRows().filter((l) => l.event === "translated" || l.event === "fire");
check("C", "fire 4 (AI healed): the pre-step healed the translation — translated + the quiet fire line", r.action === "quiet" && logRows().filter((l) => l.event === "translated" && l.news_id === syntheticNewItem.news_id).length === 1, r);
check("C", "fire 4: the healing fire re-fetched the page (the clock's own rule) but made ZERO detail GETs", calls.length - callsBeforeHeal === 1 && calls.slice(callsBeforeHeal).every((u) => u === TE_PAGE_URL), { newCalls: calls.slice(callsBeforeHeal) });
const healedFa = walkDb.prepare("SELECT * FROM te_briefing_fa WHERE news_id = ?").get(syntheticNewItem.news_id) as TeFaRow | undefined;
check("C", "fire 4: the fa row landed with the mock adapter's honest sourceModel", healedFa !== undefined && healedFa.source_model === "clock-walk-mock-engine", { healedFa });

// C5 — the re-store: TE edits the synthetic item's body post-publication.
const editedItem: TeStreamItem = { ...syntheticNewItem, body: `${syntheticNewItem.body} Edited post-publication by the clock walk — the hash moves.` };
walkItems[0] = editedItem;
r = await runFire({ DB: walk, AI: mockAi }, new Date("2026-11-26T05:00:00Z"), mockFetch);
const reStoredRow = await getRow(walk, editedItem.news_id);
check("C", "fire 5 (TE edited the body): re-store — hash bumped, updated_at moved, re-stored log", r.action === "capture" && reStoredRow !== null && reStoredRow.updated_at !== null && logRows().some((l) => l.event === "re-stored" && l.news_id === editedItem.news_id), { r, reStoredRow });
check("C", "fire 5: the re-store re-translated through the freshness gate (hash-keyed)", logRows().filter((l) => l.event === "translated" && l.news_id === editedItem.news_id).length === 2, {});

// C6 — an unchanged re-run writes nothing to the briefings (the pre-step
// still heals at most ONE untranslated row per fire — the walk's own
// discipline; the pure one-line quiet fire was fire 2, before any AI).
const logBeforeC6 = logRows().length;
const briefingsBeforeC6 = walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing").get().n;
const updatedBeforeC6 = walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing WHERE updated_at IS NOT NULL").get().n;
r = await runFire({ DB: walk, AI: mockAi }, new Date("2026-11-26T16:00:00Z"), mockFetch);
const c6Lines = logRows().slice(logBeforeC6);
check("C", "fire 6 (unchanged): quiet again — zero briefing writes, the pre-step's one-row heal + the fire line the only writes", r.action === "quiet" && walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing").get().n === briefingsBeforeC6 && walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing WHERE updated_at IS NOT NULL").get().n === updatedBeforeC6 && c6Lines.length === 2 && c6Lines.some((l) => l.event === "translated") && c6Lines.some((l) => l.event === "fire"), { r, c6Lines });

// C7 — the fetch-failure posture: a 403 challenge → fetch-failed, nothing
// parsed as content, the store untouched.
const challengeRes = () => ({ status: 403, url: TE_PAGE_URL, text: async () => challengePage });
const challengeFetch: FetchLike = async (url) => (url === TE_PAGE_URL ? challengeRes() : mockFetch(url));
const briefingCountBefore = walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing").get().n;
r = await runFire({ DB: walk, AI: mockAi }, new Date("2026-11-27T05:00:00Z"), challengeFetch);
check("C", "fire 7 (403 challenge): fetch-failed, the challenge posture — never an alarm, never a store", r.action === "fetch-failed" && walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing").get().n === briefingCountBefore && logRows().filter((l) => l.event === "fetch-failed").length === 1, r);

// C8 — the structure alarm from the login-page negative through the fire.
const loginFetch: FetchLike = async (url) => (url === TE_PAGE_URL ? { status: 200, url, text: async () => loginPage } : mockFetch(url));
r = await runFire({ DB: walk, AI: mockAi }, new Date("2026-11-27T16:00:00Z"), loginFetch);
check("C", "fire 8 (login page 200): the structure alarm path — the log names the 200-character gate, the last known good stays served", r.action === "structure-alert" && (r.detail ?? "").includes("200-character gate"), r);
const alarmRows = walkDb.prepare("SELECT * FROM te_briefing WHERE status='structure_alert'").all() as Array<{ news_id: string; body: string }>;
check("C", `fire 8: the alarm marked the login item as a marker row — the ${nBrief + 1} captured rows all keep their content and ok status`, alarmRows.length === 1 && alarmRows[0]!.news_id === "600001" && walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing WHERE status='ok'").get().n === nBrief + 1, { alarmRows: alarmRows.map((a) => a.news_id) });

// C9 — the rotated-window fire (the addendum's gate reaction 2): an
// all-flash stream with a REAL h2 → the quiet fire — zero briefing
// writes, exactly one fire log line, never an alarm.
const originalPage = net.page;
const rowsBeforeC9 = walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing").get().n;
const logBeforeC9 = logRows().length;
net.page = () => rotatedPage;
r = await runFire({ DB: walk, AI: mockAi }, new Date("2026-11-27T17:00:00Z"), mockFetch);
const c9Lines = logRows().slice(logBeforeC9);
net.page = originalPage;
check("C", "fire 9 (all-flash window, real h2): the rotated window — the quiet fire, zero briefing writes, at most a pre-step heal beside the one fire line, never an alarm", r.action === "quiet" && walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing").get().n === rowsBeforeC9 && c9Lines.length <= 2 && c9Lines.some((l) => l.event === "fire") && c9Lines.every((l) => l.event === "fire" || l.event === "translated") && (c9Lines.find((l) => l.event === "fire")?.detail ?? "").includes("flash"), { r, c9Lines });

(evidence.phases as Record<string, unknown>).C_walk = {
  fires: 9,
  aiCalls: aiCalls.length,
  fetchCalls: calls.length,
  finalLog: logRows().map((l) => ({ event: l.event, news_id: l.news_id, detail: (l.detail ?? "").slice(0, 110) })),
};

/* ------------------------------------------------------------------ *
 * Phase D — the DDL applies idempotently (twice, no error)
 * ------------------------------------------------------------------ */

try {
  walkDb.exec(ddl); // second apply
  check("D", "the DDL applied a second time with no error (idempotence)", true, {});
  check("D", `the tables still carry the walk's rows after the re-apply (${nBrief} captured + the synthetic + the alarm marker)`, walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing").get().n === nBrief + 2, { n: walkDb.prepare("SELECT COUNT(*) AS n FROM te_briefing").get().n });
} catch (e) {
  check("D", "the DDL applied a second time with no error (idempotence)", false, { error: String(e).slice(0, 200) });
}
walkDb.close();

/* ------------------------------------------------------------------ *
 * The record
 * ------------------------------------------------------------------ */

evidence.failures = failures;
await Bun.write(OUT_PATH, JSON.stringify(evidence, null, 2));
console.log(`\nharness evidence → ${OUT_PATH} (${failures.length} failure(s))`);
if (failures.length > 0) {
  console.error(failures.map((f) => `  FAIL ${f}`).join("\n"));
  process.exit(1);
}
