// The WGC translation forced run — the deliberate, exactly-one
// translation of an ALREADY-CAPTURED issue through the PRODUCTION
// translation module (wgc-watch/src/translate.ts translateCommentary —
// imported, never copied: the same logic the watch worker's fire runs),
// per the 2026-11-25 sitting's Step 5.
//
//   WORKERS_AI_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… \
//     bun scripts/wgc-translate-once.ts --db db/custom.db [--month 2026-10] [--force]
//   WORKERS_AI_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… \
//     bun scripts/wgc-translate-once.ts --remote [--month 2026-10] [--force]
//
//   --db <sqlite>    the local archive (the DDL's tables must exist —
//                    wgc-watch/ddl.sql is applied first, idempotently)
//   --remote         the live D1 (aurum-desk): the current state is read
//                    through wrangler, the translation's writes are taped
//                    and applied through wrangler d1 execute --file —
//                    the backfill's own proven pattern
//   --month YYYY-MM   the issue to translate (default: the latest captured)
//   --force          re-translate even when a fresh translation exists —
//                    the deliberate path (replacing sandbox-test data with
//                    the real Workers-AI run, or a model swap); the row is
//                    replaced, never duplicated, and the run is logged
//
// The AI runs over REST with WORKERS_AI_TOKEN (env-only, never stored,
// never printed); the worker itself uses the [ai] binding — the same
// model, the same module, one code path.
//
// Idempotence: without --force, a fresh (hash-matching) stored
// translation is a no-op — "already up-to-date, nothing applied".

import { Database } from "bun:sqlite";
import { translateCommentary, type AiLike } from "../wgc-watch/src/translate";
import { type D1Like, type D1Statement, type WgcRow } from "../wgc-watch/src/pipeline";

const REPO_ROOT = new URL("..", import.meta.url).pathname;
const DDL_PATH = `${REPO_ROOT}wgc-watch/ddl.sql`;
const RAN_AT = new Date();
const OUT_PATH = `tests/wgc-translate-once-${RAN_AT.toISOString().slice(0, 10)}.json`;

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
const MONTH = flag("month");
const FORCE = args.includes("--force");
if (!LOCAL_DB && !REMOTE) {
  console.error("usage: bun scripts/wgc-translate-once.ts (--db <sqlite-path> | --remote) [--month YYYY-MM] [--force]");
  process.exit(2);
}
if (!(process.env.WORKERS_AI_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID)) {
  console.error("WORKERS_AI_TOKEN and CLOUDFLARE_ACCOUNT_ID must be in the environment (env-only, never stored)");
  process.exit(2);
}
if (REMOTE && !process.env.CLOUDFLARE_API_TOKEN) {
  console.error("--remote requires CLOUDFLARE_API_TOKEN in the environment (env-only, never stored)");
  process.exit(2);
}
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const TOKEN = process.env.WORKERS_AI_TOKEN!;

/* ------------------------------------------------------------------ *
 * The D1-compatible adapters (the backfill's same SQLite surface and
 * recording wrapper — the write tape for the remote emission)
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
    // free-plan queueing (the live bake-off's own envelope — one run
    // crossed 60s, none crossed 120s).
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${model}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(240_000),
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
 * The store this run computes against (and writes to)
 * ------------------------------------------------------------------ */

const ddl = await Bun.file(DDL_PATH).text();

let store: D1Like;
let recorder: RecordingD1 | null = null;
const cleanup: (() => void)[] = [];
let month: string;

if (LOCAL_DB) {
  const db = new Database(LOCAL_DB);
  db.exec(ddl); // idempotent — CREATE TABLE IF NOT EXISTS
  cleanup.push(() => db.close());
  const row = MONTH
    ? (db.prepare("SELECT month_key FROM wgc_commentary WHERE month_key = ?").get(MONTH) as { month_key: string } | undefined)
    : (db.prepare("SELECT month_key FROM wgc_commentary WHERE status = 'ok' ORDER BY month_key DESC LIMIT 1").get() as
        | { month_key: string }
        | undefined);
  if (!row) throw new Error(`no commentary row found (${MONTH ?? "latest"}) in ${LOCAL_DB}`);
  month = row.month_key;
  store = sqliteD1(db);
} else {
  // --remote: a scratch seeded from the live state; the tape applies after.
  const rows = (await wranglerJson(
    MONTH
      ? `SELECT * FROM wgc_commentary WHERE month_key = '${MONTH}'`
      : "SELECT * FROM wgc_commentary WHERE status = 'ok' ORDER BY month_key DESC LIMIT 1",
  )) as unknown as WgcRow[];
  if (rows.length === 0) throw new Error(`no commentary row found (${MONTH ?? "latest"}) in the remote D1`);
  month = rows[0]!.month_key;
  const faRows = (await wranglerJson(
    `SELECT * FROM wgc_commentary_fa WHERE month_key = '${month}'`,
  )) as Record<string, unknown>[];
  const logs = (await wranglerJson(
    `SELECT ts, month_key, event, detail FROM wgc_scrape_log WHERE month_key = '${month}'`,
  )) as { ts: string; month_key: string; event: string; detail: string | null }[];
  const db = new Database(":memory:");
  db.exec(ddl);
  const ins = db.prepare(
    `INSERT INTO wgc_commentary (month_key, source_url, headline, published_at, fetched_at, highlights_json, block_variant, content_hash, status, attempts, last_attempt_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const r of rows) {
    ins.run(r.month_key, r.source_url, r.headline, r.published_at, r.fetched_at, r.highlights_json, r.block_variant, r.content_hash, r.status, r.attempts, r.last_attempt_at, r.updated_at);
  }
  const faIns = db.prepare(
    `INSERT INTO wgc_commentary_fa (month_key, fa_headline, fa_json, source_model, translated_at, content_hash) VALUES (?, ?, ?, ?, ?, ?)`,
  );
  for (const r of faRows) {
    faIns.run(r.month_key, r.fa_headline, r.fa_json, r.source_model, r.translated_at, r.content_hash);
  }
  const logIns = db.prepare("INSERT INTO wgc_scrape_log (ts, month_key, event, detail) VALUES (?, ?, ?, ?)");
  for (const l of logs) logIns.run(l.ts, l.month_key, l.event, l.detail ?? null);
  cleanup.push(() => db.close());
  recorder = new RecordingD1(sqliteD1(db));
  store = recorder;
}

console.log(`WGC translation forced run — ${RAN_AT.toISOString()}`);
console.log(`issue: ${month} · store: ${REMOTE ? "remote D1 (aurum-desk)" : LOCAL_DB}${FORCE ? " · --force (the deliberate re-translation)" : ""}`);

/* The deliberate path: --force drops a stale engine's row so the run
   replaces it (never duplicated — the write is INSERT OR REPLACE). */
if (FORCE) {
  await store
    .prepare("DELETE FROM wgc_commentary_fa WHERE month_key = ?")
    .bind(month)
    .run();
}

const outcome = await translateCommentary(store, restAi, month, RAN_AT);
console.log(`outcome: ${JSON.stringify(outcome)}`);

/* ------------------------------------------------------------------ *
 * Apply (local writes already landed; the remote emits + applies the tape)
 * ------------------------------------------------------------------ */

let appliedNote = `local store written directly (${LOCAL_DB})`;
if (REMOTE && recorder) {
  const tape = recorder.tape;
  if (tape.length === 0) {
    appliedNote = "0 statements — the stored translation is already fresh; nothing applied";
  } else {
    const file = `${REPO_ROOT}db/wgc-translate-once-remote.sql`;
    const header = `-- WGC translation forced run ${RAN_AT.toISOString()} — ${tape.length} statement(s), generated by scripts/wgc-translate-once.ts\n`;
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
  month,
  force: FORCE,
  outcome,
  applied: appliedNote,
});
await Bun.write(OUT_PATH, JSON.stringify(evidence, null, 2));
console.log(`evidence appended → ${OUT_PATH} (${evidence.runs.length} run(s) recorded)`);

for (const fn of cleanup) fn();
