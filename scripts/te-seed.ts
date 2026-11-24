// The TE pipeline seed — the one-off walk of the CURRENT news stream
// (docs/te-daily-briefing-spec.md §8): the briefing-qualified items in
// today's fetched page, applying the same detail-GET, gates and upserts
// the watch worker's fire runs (te-watch/src/pipeline.ts runFire —
// imported, never copied: the seed IS a fire against the store), plus
// the census backstop — the evidence's recorded items that rotated OUT
// of the 3-slot window before the seed ran get their one detail GET
// (the meta description is rotation-proof) plus the fingerprint gates
// and the same upsert — the owner's §11 Q3 answer ("all three"), no
// archive crawling — then translating each item once.
//
//   bun scripts/te-seed.ts --db db/custom.db                     # captures only (no AI)
//   WORKERS_AI_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… \
//     bun scripts/te-seed.ts --db db/custom.db                   # captures + translates
//   WORKERS_AI_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… \
//     bun scripts/te-seed.ts --remote                            # the live D1 (aurum-desk)
//
//   --db <sqlite>    the local archive (the DDL's tables are applied
//                    first, idempotently — the sandbox preview's store)
//   --remote         the live D1: the current state is read through
//                    wrangler, the seed's writes are taped and applied
//                    through wrangler d1 execute --file — the WGC
//                    forced-run's own proven pattern
//
// The AI runs over REST with WORKERS_AI_TOKEN (env-only, never stored,
// never printed); the worker itself uses the [ai] binding — the same
// model, the same module, one code path. Without WORKERS_AI_TOKEN the
// seed captures the English rows only (the honest interim: the card
// serves the English verbatim, no fa field) — exactly the pipeline's own
// env.AI-optional behavior.
//
// Idempotence: a re-run over unchanged content writes nothing (the
// runFire hash rule); fresh translations answer up-to-date, zero calls.

import { Database } from "bun:sqlite";
import {
  runFire,
  getRow,
  applyStreamItem,
  latestUntranslatedRow,
  teDetailUrl,
  TE_PAGE_URL,
  TE_HEADERS,
  type D1Like,
  type D1Statement,
  type FetchLike,
  type TeRow,
} from "../te-watch/src/pipeline";
import { articleLd, detailBody, type TeStreamItem } from "../te-watch/src/parser";
import { translateBriefing, type AiLike, type TranslateOutcome, type TeFaRow } from "../te-watch/src/translate";

const REPO_ROOT = new URL("..", import.meta.url).pathname;
const DDL_PATH = `${REPO_ROOT}te-watch/ddl.sql`;
const RAN_AT = new Date();
const OUT_PATH = `tests/te-seed-${RAN_AT.toISOString().slice(0, 10)}.json`;

/* ------------------------------------------------------------------ *
 * Arguments
 * ------------------------------------------------------------------ */

const args = process.argv.slice(2);
const flag = (name: string): string | null => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? "") : null;
};
const LOCAL_DB = flag("db");
const REMOTE = args.includes("--remote");
if (!LOCAL_DB && !REMOTE) {
  console.error("usage: bun scripts/te-seed.ts (--db <sqlite-path> | --remote) [WORKERS_AI_TOKEN + CLOUDFLARE_ACCOUNT_ID env to translate]");
  process.exit(2);
}
const HAS_AI = Boolean(process.env.WORKERS_AI_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID);
if (REMOTE && !process.env.CLOUDFLARE_API_TOKEN) {
  console.error("--remote requires CLOUDFLARE_API_TOKEN in the environment (env-only, never stored)");
  process.exit(2);
}
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const TOKEN = process.env.WORKERS_AI_TOKEN!;

/* ------------------------------------------------------------------ *
 * The D1-compatible adapters (the WGC forced-run's same SQLite surface
 * and recording wrapper — the write tape for the remote emission)
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

/** Wraps a scratch store and tapes every bound WRITE statement (sql + params). */
class RecordingD1 implements D1Like {
  readonly tape: { sql: string; vals: unknown[] }[] = [];
  constructor(private inner: D1Like) {}
  prepare(sql: string): D1Statement {
    const inner = this.inner.prepare(sql);
    const head = sql.trimStart().slice(0, 6).toUpperCase();
    const isWrite = head.startsWith("INSERT") || head.startsWith("UPDATE") || head.startsWith("DELETE");
    const tape = this.tape;
    return {
      bind(...vals: unknown[]): D1Statement {
        if (isWrite) tape.push({ sql, vals });
        return inner.bind(...vals);
      },
      first<T = unknown>() {
        return inner.first<T>();
      },
      all<T = unknown>() {
        return inner.all<T>();
      },
      run() {
        return inner.run();
      },
    };
  }
}

function sqlQuote(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
  throw new Error(`cannot quote value of type ${typeof v}`);
}

function renderStatement(sql: string, vals: unknown[]): string {
  let i = 0;
  const rendered = sql.replace(/\?/g, () => sqlQuote(vals[i++]!));
  if (i !== vals.length) throw new Error(`placeholder/parameter mismatch in: ${sql}`);
  return `${rendered};`;
}

async function wranglerJson(sql: string): Promise<Record<string, unknown>[]> {
  const proc = Bun.spawn(
    ["bunx", "wrangler", "d1", "execute", "aurum-desk", "--remote", "--json", "--command", sql],
    { cwd: REPO_ROOT, env: { ...process.env }, stdout: "pipe", stderr: "pipe" },
  );
  const [out, err] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  const code = await proc.exited;
  if (code !== 0) throw new Error(`wrangler d1 execute failed: ${err.trim().slice(0, 300)}`);
  const parsed = JSON.parse(out) as Array<{ results?: Record<string, unknown>[] }>;
  return parsed[0]?.results ?? [];
}

async function wranglerFile(path: string): Promise<string> {
  const proc = Bun.spawn(
    ["bunx", "wrangler", "d1", "execute", "aurum-desk", "--remote", "--file", path],
    { cwd: REPO_ROOT, env: { ...process.env }, stdout: "pipe", stderr: "pipe" },
  );
  const [out, err] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  const code = await proc.exited;
  if (code !== 0) throw new Error(`wrangler d1 execute --file failed: ${err.trim().slice(0, 300)}`);
  return out.trim();
}

/* ------------------------------------------------------------------ *
 * The REST AI adapter (the AiLike the production module runs against)
 * ------------------------------------------------------------------ */

const restAi: AiLike = {
  async run(model: string, input: Record<string, unknown>): Promise<unknown> {
    // 120s: the selected chat model's observed serving latency under
    // free-plan queueing (the live bake-off's own envelope).
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${model}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(120_000),
      },
    );
    const body = (await res.json().catch(() => null)) as
      | { success?: boolean; result?: unknown; errors?: { message?: string }[] }
      | null;
    if (!res.ok || !body || body.success !== true) {
      const why = body?.errors?.[0]?.message ?? `HTTP ${res.status}`;
      throw new Error(`${model} run failed: ${why}`);
    }
    return body.result;
  },
};

/* ------------------------------------------------------------------ *
 * The real network (the seed fetches the live page, like the fire)
 * ------------------------------------------------------------------ */

const realFetch: FetchLike = async (url, init) => {
  const res = await fetch(url, { ...init, headers: TE_HEADERS, redirect: "follow", signal: AbortSignal.timeout(25_000) });
  return { status: res.status, url: res.url, text: () => res.text() };
};

/* ------------------------------------------------------------------ *
 * The store this run computes against (and writes to)
 * ------------------------------------------------------------------ */

const ddl = await Bun.file(DDL_PATH).text();

let store: D1Like;
let recorder: RecordingD1 | null = null;
const cleanup: (() => void)[] = [];

if (LOCAL_DB) {
  const db = new Database(LOCAL_DB);
  db.exec(ddl); // idempotent — CREATE TABLE IF NOT EXISTS
  cleanup.push(() => db.close());
  store = sqliteD1(db);
} else {
  // --remote: a scratch seeded from the live state; the tape applies after.
  const rows = (await wranglerJson("SELECT * FROM te_briefing")) as unknown as TeRow[];
  const faRows = (await wranglerJson("SELECT * FROM te_briefing_fa")) as Record<string, unknown>[];
  const logs = (await wranglerJson("SELECT ts, news_id, event, detail FROM te_scrape_log ORDER BY rowid ASC")) as Array<{
    ts: string;
    news_id: string | null;
    event: string;
    detail: string | null;
  }>;
  const db = new Database(":memory:");
  db.exec(ddl);
  const ins = db.prepare(
    `INSERT INTO te_briefing (news_id, published_at, title, body, source_url, author, fetched_at, content_hash, status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const r of rows) {
    ins.run(r.news_id, r.published_at, r.title, r.body, r.source_url, r.author, r.fetched_at, r.content_hash, r.status, r.updated_at);
  }
  const faIns = db.prepare(
    `INSERT INTO te_briefing_fa (news_id, fa_title, fa_body, source_model, translated_at, content_hash) VALUES (?, ?, ?, ?, ?, ?)`,
  );
  for (const r of faRows) {
    faIns.run(r.news_id, r.fa_title, r.fa_body, r.source_model, r.translated_at, r.content_hash);
  }
  const logIns = db.prepare("INSERT INTO te_scrape_log (ts, news_id, event, detail) VALUES (?, ?, ?, ?)");
  for (const l of logs) logIns.run(l.ts, l.news_id, l.event, l.detail ?? null);
  cleanup.push(() => db.close());
  recorder = new RecordingD1(sqliteD1(db));
  store = recorder;
}

console.log(`TE seed — ${RAN_AT.toISOString()}`);
console.log(`store: ${REMOTE ? "remote D1 (aurum-desk)" : LOCAL_DB}${HAS_AI ? " · AI translation ON (REST adapter, the worker's own module)" : " · captures only (no WORKERS_AI_TOKEN — the honest interim)"}`);

/* ------------------------------------------------------------------ *
 * The seed run: one fire (the production capture path), then the
 * seed's own completeness — every current item translated once
 * ------------------------------------------------------------------ */

const fire = await runFire({ DB: store, AI: HAS_AI ? restAi : undefined }, RAN_AT, realFetch);
console.log(`fire → ${JSON.stringify(fire)}`);

/* ------------------------------------------------------------------ *
 * The census backstop — the rotated-out items (spec §8, the owner's
 * "all three" §11 Q3 answer): each census-recorded item not already
 * stored gets its ONE detail GET (the meta description is the
 * rotation-proof body source), the fingerprint gates (the census's own
 * body_chars/body_first/body_last + the JSON-LD headline and
 * datePublished identity), then the same upsert. Nothing else is ever
 * fetched — no archive crawling (§8's own bound).
 * ------------------------------------------------------------------ */

const census = await Bun.file(`${REPO_ROOT}docs/evidence/te-gold-census-2026-11-24.json`).json();
const censusItems: Array<{ news_id: string; title: string; body_chars: number; body_first: string; body_last: string; datePublished: string }> =
  census.observed_stream;
const censusBackstop: Array<Record<string, unknown>> = [];
for (const c of censusItems) {
  if (await getRow(store, c.news_id)) continue; // the stream walk already captured it

  let detailHtml: string | null = null;
  try {
    const res = await realFetch(teDetailUrl(c.news_id), {});
    if (res.status === 200) detailHtml = await res.text();
  } catch {
    detailHtml = null;
  }
  if (detailHtml === null) {
    censusBackstop.push({ news_id: c.news_id, outcome: "skipped", reason: "the detail page was unreachable — retried honestly on a future run" });
    continue;
  }

  const ld = articleLd(detailHtml);
  const body = detailBody(detailHtml);
  const checks = {
    jsonld_headline_is_census_title: ld?.headline === c.title,
    jsonld_datePublished_is_census_date: ld?.datePublished === c.datePublished,
    body_chars: body !== null && body.length === c.body_chars,
    body_first: body !== null && body.startsWith(c.body_first),
    body_last: body !== null && body.endsWith(c.body_last),
  };
  if (!Object.values(checks).every(Boolean)) {
    censusBackstop.push({ news_id: c.news_id, outcome: "skipped", reason: "the census fingerprint failed — nothing stored", checks });
    continue;
  }

  const item: TeStreamItem = { news_id: c.news_id, title: c.title, body: body! };
  const outcome = await applyStreamItem(store, item, ld, body, RAN_AT);
  censusBackstop.push({
    news_id: c.news_id,
    outcome: outcome.outcome,
    ...("hash" in outcome ? { hash: outcome.hash } : {}),
  });
  console.log(`census backstop ${c.news_id} → ${JSON.stringify(outcome)}`);
}
if (censusBackstop.length > 0) {
  console.log(`census backstop: ${JSON.stringify(censusBackstop)}`);
}

const translations: Array<{ newsId: string; outcome: TranslateOutcome }> = [];
if (HAS_AI) {
  // The pre-step bound is one row per FIRE; the seed's own scope is every
  // current item — loop the same exported discipline until none is left
  // (bounded: a persistent failure retries honestly on the next fire, the
  // loop stops after the first failing pass).
  let pass = 0;
  for (;;) {
    const pending = await latestUntranslatedRow(store);
    if (!pending) break;
    const outcome = await translateBriefing(store, restAi, pending.news_id, RAN_AT);
    translations.push({ newsId: pending.news_id, outcome });
    if (outcome.outcome === "failed" || outcome.outcome === "skipped") break;
    if (++pass > 10) break; // a hard bound — never a loop over a moving store
  }
  for (const t of translations) console.log(`translate ${t.newsId} → ${JSON.stringify(t.outcome)}`);
}

/* ------------------------------------------------------------------ *
 * Apply (local writes already landed; the remote emits + applies the tape)
 * ------------------------------------------------------------------ */

let appliedNote = `local store written directly (${LOCAL_DB})`;
if (REMOTE && recorder) {
  const tape = recorder.tape;
  if (tape.length === 0) {
    appliedNote = "0 statements — the stream is unchanged and every translation fresh; nothing applied";
  } else {
    const file = `${REPO_ROOT}db/te-seed-remote.sql`;
    const header = `-- TE seed ${RAN_AT.toISOString()} — ${tape.length} statement(s), generated by scripts/te-seed.ts\n`;
    await Bun.write(file, header + tape.map((t) => renderStatement(t.sql, t.vals)).join("\n") + "\n");
    const out = await wranglerFile(file);
    appliedNote = `${tape.length} statement(s) applied to the remote D1 via wrangler d1 execute --file`;
    console.log(out.split("\n").slice(-3).join("\n"));
  }
}
console.log(appliedNote);

/* ------------------------------------------------------------------ *
 * The evidence append (every run recorded)
 * ------------------------------------------------------------------ */

const storedRows: TeRow[] = (await store
  .prepare("SELECT * FROM te_briefing WHERE status = 'ok' ORDER BY published_at DESC")
  .all<TeRow>()).results;
const faStored: TeFaRow[] = (await store
  .prepare("SELECT news_id, fa_title, source_model, translated_at, content_hash, length(fa_body) AS fa_body_chars FROM te_briefing_fa")
  .all<TeFaRow>()).results;

const evidence = { runs: [] as Array<Record<string, unknown>> };
try {
  const prev = await Bun.file(OUT_PATH).json();
  if (Array.isArray(prev.runs)) evidence.runs = prev.runs;
} catch {
  /* the first run */
}
evidence.runs.push({
  ranAt: RAN_AT.toISOString(),
  store: REMOTE ? "remote-d1" : `local:${LOCAL_DB}`,
  ai: HAS_AI ? "rest-adapter" : "none (captures only)",
  fire,
  censusBackstop,
  translations,
  storedBriefings: storedRows.map((r) => ({
    news_id: r.news_id,
    published_at: r.published_at,
    title: r.title,
    body_chars: r.body.length,
    author: r.author,
    status: r.status,
    updated_at: r.updated_at,
  })),
  faStored,
  applied: appliedNote,
});
await Bun.write(OUT_PATH, JSON.stringify(evidence, null, 2));
console.log(`evidence appended → ${OUT_PATH} (${evidence.runs.length} run(s) recorded, ${storedRows.length} briefing row(s), ${faStored.length} fa row(s))`);

for (const fn of cleanup) fn();
