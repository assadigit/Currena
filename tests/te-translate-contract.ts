// The TE translation module's contract test — the chat-contract runner of
// te-watch/src/translate.ts (the WGC sitting's committed contract test,
// carried over TE-shaped), guarded standalone, zero network, a scratch
// SQLite through the same D1-compatible adapter the harness uses:
//
//   bun tests/te-translate-contract.ts
//
// The contract proven here (each check states itself; evidence appends to
// tests/te-translate-contract-<date>.json):
//  - the chat contract SENT: the model, the system line's strict
//    {"headline","body"} shape, the user payload's shape, max_tokens 2048;
//  - the happy path: ONE call per briefing, the fa row written, the
//    `translated` log line naming the model;
//  - the freshness gate: a second run is up-to-date, zero further calls;
//  - the failure discipline: a failing engine logs `translate-failed` and
//    stores nothing — the English row stays safe;
//  - the identity discipline: an untranslated headline or body (the
//    observed llama-4-scout failure mode) fails the run, nothing stored;
//  - the mirror discipline: a dropped/empty headline or body, a drifted
//    shape, an empty content channel (the observed gpt-oss failure mode)
//    all fail closed;
//  - the defensive parse: a legacy {response} envelope still parses; a
//    markdown-fenced reply still parses;
//  - the re-store path: a changed English hash re-opens the gate and
//    re-translates;
//  - the attribution discipline: a non-binding adapter's sourceModel is
//    recorded in the row, never silently attributed;
//  - runFire without env.AI runs exactly the pre-translation behavior
//    (no translation step, no fa write, no log line).

import { Database } from "bun:sqlite";
import { contentHash } from "../te-watch/src/parser";
import {
  translateBriefing,
  TRANSLATION_MODEL,
  type AiLike,
  type TranslateOutcome,
  type TeFaRow,
} from "../te-watch/src/translate";
import { runFire, type D1Like, type D1Statement, type TeRow } from "../te-watch/src/pipeline";

const REPO_ROOT = new URL("..", import.meta.url).pathname;
const RAN_AT = new Date();
const OUT_PATH = `tests/te-translate-contract-${RAN_AT.toISOString().slice(0, 10)}.json`;

/* ------------------------------------------------------------------ *
 * The D1-compatible adapter over Bun's SQLite (the harness's own)
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
 * The assertion bookkeeping (the WGC contract test's own pattern)
 * ------------------------------------------------------------------ */

const failures: string[] = [];
const results: Array<{ check: string; pass: boolean; extra?: unknown }> = [];
function check(name: string, pass: boolean, extra?: unknown): void {
  results.push({ check, name, pass, extra } as { check: string; pass: boolean; extra?: unknown });
  results[results.length - 1] = { check: name, pass, extra };
  if (!pass) failures.push(name);
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${extra !== undefined && !pass ? ` — ${JSON.stringify(extra)}` : ""}`);
}

/* ------------------------------------------------------------------ *
 * The scratch store (the DDL, one English row)
 * ------------------------------------------------------------------ */

const ddl = await Bun.file(`${REPO_ROOT}te-watch/ddl.sql`).text();
const db = new Database(":memory:");
db.exec(ddl);

const EN_TITLE = "Gold Holds Gains Amid Recovery in Equity Markets";
const EN_BODY =
  "Gold held above $3,600 per ounce on Tuesday after recovering from more than one-year lows in the previous session, as a rally in technology stocks and renewed optimism surrounding AI helped ease selling pressure on precious metals. Markets are currently assigning roughly a 95% probability to a 25-basis-point rate hike in December.";
const NEWS_ID = "603757";
const HASH_A = await contentHash(EN_TITLE, EN_BODY);
/** The second-day English body the failure-mode checks run against (the re-seeded row). */
const SECOND_BODY = `${EN_BODY} A second day's body, long enough to pass every gate and carry the whole contract.`;

/** Reset the fa + log state so each failure-mode check starts clean. */
function resetFa(): void {
  db.exec("DELETE FROM te_briefing_fa");
  db.exec("DELETE FROM te_scrape_log");
}

async function seedEnglish(hash: string): Promise<void> {
  db.prepare(
    `INSERT INTO te_briefing
       (news_id, published_at, title, body, source_url, author, fetched_at, content_hash, status, updated_at)
     VALUES (?, '2026-11-24T02:17:13Z', ?, ?, 'https://tradingeconomics.com/commodity/gold/news/603757', 'Jam Kaimo Samonte', '2026-11-24T05:00:41Z', ?, 'ok', NULL)`,
  ).run(NEWS_ID, EN_TITLE, EN_BODY, hash);
}
async function seedEnglishBody(body: string, hash: string): Promise<void> {
  db.prepare(
    `INSERT INTO te_briefing
       (news_id, published_at, title, body, source_url, author, fetched_at, content_hash, status, updated_at)
     VALUES (?, '2026-11-25T02:00:00Z', ?, ?, 'https://tradingeconomics.com/commodity/gold/news/603757', 'X', '2026-11-25T05:00:41Z', ?, 'ok', NULL)`,
  ).run(NEWS_ID, EN_TITLE, body, hash);
}
await seedEnglish(HASH_A);

function faRows(): TeFaRow[] {
  return db.prepare("SELECT * FROM te_briefing_fa").all() as TeFaRow[];
}
function logLines(): Array<{ event: string; news_id: string | null; detail: string | null }> {
  return db.prepare("SELECT event, news_id, detail FROM te_scrape_log").all() as Array<{ event: string; news_id: string | null; detail: string | null }>;
}

/* ------------------------------------------------------------------ *
 * The mock engine (records the calls; the reply is scriptable)
 * ------------------------------------------------------------------ */

const calls: Array<{ model: string; input: Record<string, unknown> }> = [];
let reply: string | null = "json";
let failMode = false;
const FA_TITLE = "طلا سودهای خود را در میان بازیابی بازارهای سهام حفظ می‌کند";
const FA_BODY = "طلا روز سه‌شنبه بالای ۳٬۶۰۰ دلار در هر اونس ماند و از کف‌های بیش از یک‌سالهٔ جلسهٔ قبل بازیابی شد؛ بازارها احتمال ۹۵ درصدی افزایش نرخ ۲۵ واحدی در دسامبر را قیمت‌گذاری می‌کنند.";

const mockAi: AiLike = {
  async run(model: string, input: Record<string, unknown>) {
    calls.push({ model, input });
    if (failMode) throw new Error("the mock engine failed (the simulated quota wall)");
    if (reply === "json") {
      return { choices: [{ message: { content: JSON.stringify({ headline: FA_TITLE, body: FA_BODY }) } }] };
    }
    return { response: JSON.stringify({ headline: FA_TITLE, body: FA_BODY }) };
  },
};

function lastCall(): { model: string; input: Record<string, unknown> } {
  return calls[calls.length - 1]!;
}

/* ------------------------------------------------------------------ *
 * The checks
 * ------------------------------------------------------------------ */

// 1-3. The chat contract the runner SENDS.
let out: TranslateOutcome = await translateBriefing(sqliteD1(db), mockAi, NEWS_ID, RAN_AT);
check("the happy path: outcome translated, one call, the fa row written", out.outcome === "translated" && calls.length === 1 && faRows().length === 1, { out, faRows: faRows().length });
check("the chat contract sent: the model is the bake-off's selection", lastCall().model === TRANSLATION_MODEL, { model: lastCall().model });
{
  const input = lastCall().input as { messages?: Array<{ role: string; content: string }>; max_tokens?: number };
  const system = input.messages?.[0]?.content ?? "";
  const user = input.messages?.[1]?.content ?? "";
  const userParsed = JSON.parse(user) as { headline?: string; body?: string };
  check(
    "the chat contract sent: the system line carries the strict TE shape {\"headline\",\"body\"}, the user payload mirrors the briefing, max_tokens 2048",
    input.messages?.length === 2 &&
      input.messages[0]!.role === "system" &&
      input.messages[1]!.role === "user" &&
      system.includes('{"headline": <string>, "body": <string>}') &&
      userParsed.headline === EN_TITLE &&
      userParsed.body === EN_BODY &&
      input.max_tokens === 2048,
    { system: system.slice(0, 120), user: user.slice(0, 80), max_tokens: input.max_tokens },
  );
}
check("the translated log line names the model and the item", logLines().some((l) => l.event === "translated" && l.news_id === NEWS_ID && (l.detail ?? "").includes(TRANSLATION_MODEL)), { log: logLines() });

// 4. The freshness gate: the second run is up-to-date, zero further calls.
out = await translateBriefing(sqliteD1(db), mockAi, NEWS_ID, RAN_AT);
check("the freshness gate: a fresh (hash-matching) stored translation is up-to-date, zero further calls", out.outcome === "up-to-date" && calls.length === 1 && faRows().length === 1, { out, calls: calls.length });

// 5. The failure discipline: a failing engine logs translate-failed, nothing stored (new row).
db.exec("DELETE FROM te_briefing");
db.exec("DELETE FROM te_briefing_fa");
db.exec("DELETE FROM te_scrape_log");
const HASH_B = await contentHash(EN_TITLE, SECOND_BODY);
await seedEnglishBody(SECOND_BODY, HASH_B);
failMode = true;
out = await translateBriefing(sqliteD1(db), mockAi, NEWS_ID, RAN_AT);
check("the failure discipline: a failed run logs translate-failed and stores NOTHING (never throws)", out.outcome === "failed" && faRows().length === 0 && logLines().some((l) => l.event === "translate-failed"), { out, faRows: faRows().length, log: logLines() });
failMode = false;

// 6. The identity discipline: an untranslated headline (the llama-4-scout mode).
resetFa();
{
  const identityAi: AiLike = {
    async run() {
      return { choices: [{ message: { content: JSON.stringify({ headline: EN_TITLE, body: FA_BODY }) } }] };
    },
  };
  out = await translateBriefing(sqliteD1(db), identityAi, NEWS_ID, RAN_AT);
  check("the identity discipline: an untranslated headline fails the run, nothing stored", out.outcome === "failed" && faRows().length === 0 && (out as { reason?: string }).reason?.includes("untranslated"), { out });
}

// 7. The identity discipline: an untranslated body.
resetFa();
{
  const identityAi: AiLike = {
    async run() {
      return { choices: [{ message: { content: JSON.stringify({ headline: FA_TITLE, body: SECOND_BODY }) } }] };
    },
  };
  out = await translateBriefing(sqliteD1(db), identityAi, NEWS_ID, RAN_AT);
  check("the identity discipline: an untranslated body fails the run, nothing stored", out.outcome === "failed" && faRows().length === 0, { out });
}

// 8. The mirror/shape discipline: a dropped headline.
resetFa();
{
  const dropAi: AiLike = {
    async run() {
      return { choices: [{ message: { content: JSON.stringify({ body: FA_BODY }) } }] };
    },
  };
  out = await translateBriefing(sqliteD1(db), dropAi, NEWS_ID, RAN_AT);
  check("the mirror discipline: a dropped headline fails the run, nothing stored", out.outcome === "failed" && faRows().length === 0, { out });
}

// 9. The shape discipline: a drifted shape (segments, the WGC shape).
resetFa();
{
  const driftAi: AiLike = {
    async run() {
      return { choices: [{ message: { content: JSON.stringify({ headline: FA_TITLE, body: FA_BODY, segments: [] }) } }] };
    },
  };
  out = await translateBriefing(sqliteD1(db), driftAi, NEWS_ID, RAN_AT);
  check("the shape discipline: the strict two-field contract is enforced (extra fields never break it — the strict pair is read)", out.outcome === "translated" && faRows().length === 1, { out });
}

// 10. The empty content channel (the gpt-oss mode).
resetFa();
{
  const emptyAi: AiLike = {
    async run() {
      return { choices: [{ message: { content: null } }] };
    },
  };
  out = await translateBriefing(sqliteD1(db), emptyAi, NEWS_ID, RAN_AT);
  check("the empty-channel discipline: content null fails the run, nothing stored", out.outcome === "failed" && faRows().length === 0, { out });
}

// 11. The legacy {response} envelope still parses.
resetFa();
reply = "legacy";
out = await translateBriefing(sqliteD1(db), mockAi, NEWS_ID, RAN_AT);
check("the defensive parse: a legacy {response} envelope still parses and stores", out.outcome === "translated" && faRows().length === 1, { out });
db.exec("DELETE FROM te_briefing_fa");
db.exec("DELETE FROM te_scrape_log");

// 12. A markdown-fenced reply still parses.
{
  const fenceAi: AiLike = {
    async run() {
      return { choices: [{ message: { content: "```json\n" + JSON.stringify({ headline: FA_TITLE, body: FA_BODY }) + "\n```" } }] };
    },
  };
  out = await translateBriefing(sqliteD1(db), fenceAi, NEWS_ID, RAN_AT);
  check("the defensive parse: a markdown-fenced reply still parses and stores", out.outcome === "translated" && faRows().length === 1, { out });
  db.exec("DELETE FROM te_briefing_fa");
  db.exec("DELETE FROM te_scrape_log");
}

// 13. The re-store path: a changed English hash re-opens the gate.
{
  const freshAi: AiLike = {
    async run() {
      return { choices: [{ message: { content: JSON.stringify({ headline: FA_TITLE, body: FA_BODY }) } }] };
    },
  };
  out = await translateBriefing(sqliteD1(db), freshAi, NEWS_ID, RAN_AT);
  const storedHash = faRows()[0]!.content_hash;
  check("the re-store gate: the stored fa row carries the ENGLISH row's hash at translation time", out.outcome === "translated" && storedHash === HASH_B, { storedHash, HASH_B });
  // re-store the English under a new hash; the gate re-opens.
  const HASH_C = await contentHash(EN_TITLE, `${EN_BODY} Edited after publication.`);
  db.exec("DELETE FROM te_briefing");
  await seedEnglishBody(`${EN_BODY} Edited after publication.`, HASH_C);
  let callsC = 0;
  const countingAi: AiLike = {
    async run(model: string, input: Record<string, unknown>) {
      callsC++;
      return freshAi.run(model, input);
    },
  };
  out = await translateBriefing(sqliteD1(db), countingAi, NEWS_ID, RAN_AT);
  check("the re-store path: a changed English hash re-translates through the gate", out.outcome === "translated" && callsC === 1 && faRows()[0]!.content_hash === HASH_C, { out, callsC, faHash: faRows()[0]?.content_hash });
}

// 14. The attribution discipline: a non-binding adapter declares itself.
{
  db.exec("DELETE FROM te_briefing_fa");
  db.exec("DELETE FROM te_scrape_log");
  const namedAi: AiLike = {
    sourceModel: "contract-test-adapter",
    async run() {
      return { choices: [{ message: { content: JSON.stringify({ headline: FA_TITLE, body: FA_BODY }) } }] };
    },
  };
  out = await translateBriefing(sqliteD1(db), namedAi, NEWS_ID, RAN_AT);
  check("the attribution discipline: a non-binding adapter's sourceModel is recorded in the row, never silent", out.outcome === "translated" && faRows()[0]!.source_model === "contract-test-adapter", { row: faRows()[0]?.source_model });
}

// 15. runFire without env.AI is the pre-translation behavior.
{
  db.exec("DELETE FROM te_scrape_log");
  db.exec("DELETE FROM te_briefing_fa");
  db.exec("DELETE FROM te_briefing");
  await seedEnglish(HASH_A);
  const fetchLike = (async () => ({ status: 404, url: "https://tradingeconomics.com/commodity/gold", text: async () => "" })) as unknown as Parameters<typeof runFire>[2];
  const fire = await runFire({ DB: sqliteD1(db) }, RAN_AT, fetchLike);
  check("runFire without env.AI: the fire runs exactly the capture behavior (no translation step, no fa write)", fire.action === "fetch-failed" && faRows().length === 0 && !logLines().some((l) => l.event.startsWith("translate")), { fire });
}

db.close();

await Bun.write(OUT_PATH, JSON.stringify({ ranAt: RAN_AT.toISOString(), results, failures }, null, 2));
console.log(`\ncontract evidence → ${OUT_PATH} (${failures.length} failure(s), ${results.length} checks)`);
if (failures.length > 0) {
  console.error(failures.map((f) => `  FAIL ${f}`).join("\n"));
  process.exit(1);
}
