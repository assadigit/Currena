// The WGC backfill — the one-off, idempotent walk of every published
// Highlights box: 2025-03 → the latest published issue (17 issues as of
// 2026-11-24), skipping June and November, applying the SAME slug guard,
// parser, gates and upserts as the live watch worker (wgc-watch/src/
// pipeline.ts applyCapture — imported, never copied).
//
//   bun scripts/wgc-backfill.ts --db <sqlite-path>   apply to a local SQLite
//                                                     (the DDL is ensured first,
//                                                     idempotently)
//   bun scripts/wgc-backfill.ts --remote              apply to the remote D1
//                                                     (reads the current state
//                                                     through wrangler, computes
//                                                     the writes, applies them
//                                                     through wrangler; requires
//                                                     CLOUDFLARE_API_TOKEN +
//                                                     CLOUDFLARE_ACCOUNT_ID in
//                                                     the environment, env-only)
//   bun scripts/wgc-backfill.ts --db … --dry          walk + decide, write nothing
//
// The 22 pre-box issues (2023-01 → 2025-02) are NOT walked — the box did
// not exist then and the card states that fact.
//
// Idempotence: an unchanged re-run writes nothing — no row mutation, no
// log line (the pipeline's own contract, proven by the harness). A WGC
// edit after publication re-stores with updated_at bumped and a
// re-stored log line. Evidence of every run appends to
// tests/wgc-backfill-<date>.json.

import { Database } from "bun:sqlite";
import {
  applyCapture,
  canonicalUrlFor,
  isSkipMonthKey,
  monthKeyOf,
  targetMonthOf,
  type D1Like,
  type D1Statement,
  type WgcRow,
  type LogLine,
} from "../wgc-watch/src/pipeline";

const REPO_ROOT = new URL("..", import.meta.url).pathname;
const DDL_PATH = `${REPO_ROOT}wgc-watch/ddl.sql`;
const FROM = { y: 2025, m: 3 }; // the first issue with a Highlights box
const RAN_AT = new Date();
const OUT_PATH = `${REPO_ROOT}tests/wgc-backfill-${RAN_AT.toISOString().slice(0, 10)}.json`;

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
const DRY = args.includes("--dry");
if (!LOCAL_DB && !REMOTE) {
  console.error("usage: bun scripts/wgc-backfill.ts [--db <sqlite-path>] [--remote] [--dry]");
  process.exit(2);
}
if (REMOTE && !(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID)) {
  console.error("--remote requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment (env-only, never stored)");
  process.exit(2);
}

/* ------------------------------------------------------------------ *
 * The D1-compatible adapters (the harness's same SQLite surface, plus
 * a recording wrapper that tapes every write for the remote emission)
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

/** SQLite string-literal quoting (the only escape in SQLite is the doubled quote). */
function sqlQuote(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
  throw new Error(`cannot quote value of type ${typeof v}`);
}

function renderStatement(sql: string, vals: unknown[]): string {
  let i = 0;
  const rendered = sql.replace(/\?/g, () => sqlQuote(vals[i++]));
  if (i !== vals.length) throw new Error(`placeholder/parameter mismatch in: ${sql}`);
  return `${rendered};`;
}

/* ------------------------------------------------------------------ *
 * The remote D1 through wrangler (credentials ride the environment)
 * ------------------------------------------------------------------ */

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
 * The walk
 * ------------------------------------------------------------------ */

const target = targetMonthOf(RAN_AT);
const walked: string[] = [];
for (let y = FROM.y, m = FROM.m; ; ) {
  const key = monthKeyOf(y, m);
  if (key > target) break;
  if (!isSkipMonthKey(key)) walked.push(key);
  m++;
  if (m > 12) {
    m = 1;
    y++;
  }
}

console.log(`WGC backfill — ${RAN_AT.toISOString()}`);
console.log(`walk: 2025-03 → ${target} (June/November skipped) — ${walked.length} issues`);
console.log(`store: ${REMOTE ? "remote D1 (aurum-desk)" : LOCAL_DB!}${DRY ? " [dry]" : ""}`);

const ddl = await Bun.file(DDL_PATH).text();

/** Read a local store's current rows (for seeding a dry-run scratch). */
function readLocalRows(path: string): { rows: WgcRow[]; logs: LogLine[] } {
  const db = new Database(path, { readonly: true });
  const rows = db.query("SELECT * FROM wgc_commentary").all() as unknown as WgcRow[];
  const monthList = walked.map((k) => `'${k}'`).join(", ");
  const logs = monthList
    ? (db.query(`SELECT ts, month_key, event, detail FROM wgc_scrape_log WHERE month_key IN (${monthList})`).all() as unknown as LogLine[])
    : [];
  db.close();
  return { rows, logs };
}

/** A fresh in-memory scratch seeded with the given state (dry runs + the remote decision pass). */
function seededScratch(rows: WgcRow[], logs: LogLine[]): { d1: D1Like; db: Database } {
  const db = new Database(":memory:");
  db.exec(ddl);
  const ins = db.prepare(
    `INSERT INTO wgc_commentary (month_key, source_url, headline, published_at, fetched_at, highlights_json, block_variant, content_hash, status, attempts, last_attempt_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const r of rows) {
    ins.run(
      r.month_key, r.source_url, r.headline, r.published_at, r.fetched_at, r.highlights_json,
      r.block_variant, r.content_hash, r.status, r.attempts, r.last_attempt_at, r.updated_at,
    );
  }
  const logIns = db.prepare("INSERT INTO wgc_scrape_log (ts, month_key, event, detail) VALUES (?, ?, ?, ?)");
  for (const l of logs) logIns.run(l.ts, l.month_key, l.event, l.detail ?? null);
  return { d1: sqliteD1(db), db };
}

// The store this run computes against (and writes to, unless dry):
//  - local, not dry: the local SQLite itself (the DDL ensured first)
//  - remote, not dry: a recording scratch seeded from the live state;
//    the tape is then applied through wrangler d1 execute --file
//  - dry (either): a recording scratch seeded from the target's state;
//    nothing is applied anywhere
let store: D1Like;
let scratchDb: Database | null = null;
let recorder: RecordingD1 | null = null;
const cleanup: (() => void)[] = [];

if (LOCAL_DB && !DRY) {
  const db = new Database(LOCAL_DB);
  db.exec(ddl); // idempotent — CREATE TABLE IF NOT EXISTS
  scratchDb = db;
  cleanup.push(() => db.close());
  store = sqliteD1(db);
} else if (REMOTE && !DRY) {
  const rows = (await wranglerJson("SELECT * FROM wgc_commentary")) as unknown as WgcRow[];
  const monthList = walked.map((k) => `'${k}'`).join(", ");
  const logs = monthList
    ? ((await wranglerJson(`SELECT ts, month_key, event, detail FROM wgc_scrape_log WHERE month_key IN (${monthList})`)) as unknown as LogLine[])
    : [];
  console.log(`remote state seeded: ${rows.length} commentary rows, ${logs.length} log lines`);
  const scratch = seededScratch(rows, logs);
  scratchDb = scratch.db;
  cleanup.push(() => scratch.db.close());
  recorder = new RecordingD1(scratch.d1);
  store = recorder;
} else {
  const { rows, logs } = LOCAL_DB ? readLocalRows(LOCAL_DB) : { rows: [] as WgcRow[], logs: [] as LogLine[] };
  const scratch = seededScratch(rows, logs);
  scratchDb = scratch.db;
  cleanup.push(() => scratch.db.close());
  recorder = new RecordingD1(scratch.d1);
  store = recorder;
}

const results: Array<{ month: string; outcome: string; note?: string }> = [];
for (const month of walked) {
  const url = canonicalUrlFor(month);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(25_000),
    });
    if (res.status === 404) {
      results.push({ month, outcome: "not-published", note: `HTTP 404 — skipped, the live window owns this month` });
      console.log(`${month}  404 — skipped`);
      continue;
    }
    if (res.status !== 200) {
      results.push({ month, outcome: "fetch-error", note: `HTTP ${res.status}` });
      console.log(`${month}  HTTP ${res.status} — skipped`);
      continue;
    }
    const html = await res.text();
    const outcome = await applyCapture(store, month, res.url, html, RAN_AT);
    results.push({ month, outcome: outcome.outcome, note: "segments" in outcome ? `${outcome.segments} segments, variant ${outcome.variant}` : ("reason" in outcome ? outcome.reason : ("finalUrl" in outcome ? outcome.finalUrl : undefined)) });
    console.log(`${month}  ${outcome.outcome}${"segments" in outcome ? ` (${outcome.segments} segments, ${outcome.variant})` : ""}`);
  } catch (e) {
    results.push({ month, outcome: "fetch-error", note: String(e).slice(0, 120) });
    console.log(`${month}  error — ${String(e).slice(0, 120)}`);
  }
}

const tally: Record<string, number> = {};
for (const r of results) tally[r.outcome] = (tally[r.outcome] ?? 0) + 1;
console.log(`outcomes: ${JSON.stringify(tally)}`);

/* ------------------------------------------------------------------ *
 * Apply (local writes already landed; the remote emits + applies the tape)
 * ------------------------------------------------------------------ */

let appliedNote = DRY ? "dry — nothing written" : "local store written directly";
if (REMOTE && !DRY && recorder) {
  const tape = recorder.tape;
  if (tape.length === 0) {
    appliedNote = "0 statements — the remote state already matches; nothing applied";
    console.log(appliedNote);
  } else {
    const file = `${REPO_ROOT}db/wgc-backfill-remote.sql`;
    const header = `-- WGC backfill ${RAN_AT.toISOString()} — ${tape.length} statement(s), generated by scripts/wgc-backfill.ts\n`;
    await Bun.write(file, header + tape.map((t) => renderStatement(t.sql, t.vals)).join("\n") + "\n");
    const out = await wranglerFile(file);
    appliedNote = `${tape.length} statement(s) applied to the remote D1 via wrangler d1 execute --file`;
    console.log(appliedNote);
    console.log(out.split("\n").slice(-3).join("\n"));
  }
} else if (DRY && recorder) {
  appliedNote = `dry — ${recorder.tape.length} statement(s) computed, nothing written`;
  console.log(appliedNote);
} else {
  console.log(appliedNote);
}

/* ------------------------------------------------------------------ *
 * The evidence append (every run recorded, the re-runs prove idempotence)
 * ------------------------------------------------------------------ */

const evidence = {
  runs: [] as Array<Record<string, unknown>>,
};
try {
  const prev = await Bun.file(OUT_PATH).json();
  if (Array.isArray(prev.runs)) evidence.runs = prev.runs;
} catch {
  /* the first run */
}
evidence.runs.push({
  ranAt: RAN_AT.toISOString(),
  store: REMOTE ? "remote-d1" : `local:${LOCAL_DB}`,
  dry: DRY,
  walk: { from: "2025-03", to: target, issues: walked.length },
  outcomes: tally,
  results,
  applied: appliedNote,
});
await Bun.write(OUT_PATH, JSON.stringify(evidence, null, 2));
console.log(`evidence appended → tests/wgc-backfill-${RAN_AT.toISOString().slice(0, 10)}.json (${evidence.runs.length} run(s) recorded)`);

for (const fn of cleanup) fn();
