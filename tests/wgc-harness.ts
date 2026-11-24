// The WGC pipeline verification harness — the implementing sitting's
// evidence for docs/wgc-monthly-commentary-spec.md §10 acceptance items
// 2–5 (the parser, the negative paths, the clock walk, the local DDL).
//
// Run: `bun tests/wgc-harness.ts` (from the repository root).
//
// What it proves, phase by phase:
//   A. The PRODUCTION parser (wgc-watch/src/parser.ts — imported, never
//      copied) over every one of the 17 box issues, fetched live, against
//      the research census (docs/evidence/wgc-census-2026-11-24.json):
//      17 × 2 segments, every heading non-empty, every body ≥ 40 chars,
//      byte-identical segments + variants + publication dates. The
//      2026-09 row IS the owner's pasted September snippet (the census
//      records it verbatim) — byte-identical, with the JSON-LD
//      description cross-check.
//   B. The negative paths, live: the no-box month 2023-02 → a structure
//      alarm and nothing stored; the June-2026 redirect → the slug guard
//      rejection; a 404 and a far-future month → the waiting state.
//   C. The clock walk over the production fire (wgc-watch/src/pipeline.ts
//      runFire) against a scratch SQLite D1: days 1–7 (six 404s then one
//      200) → attempts 7, status ok; later fires fetch nothing; June and
//      November fires make zero requests; the month bound never exceeds
//      20 attempts; day 25 closes the window → missed; a simulated WGC
//      edit re-stores with updated_at bumped and a re-stored log line;
//      an unchanged re-run writes nothing.
//   D. The DDL applies idempotently — twice against the scratch database,
//      no error (the remote D1 twin of this proof runs at deploy).
//
// Evidence: tests/wgc-harness-<date>.json (this file's structured record)
// — the house pattern: JSON under tests/.

import { Database } from "bun:sqlite";
import {
  applyCapture,
  canonicalUrlFor,
  countLogAttempts,
  getRow,
  runFire,
  slugGuardOk,
  targetMonthOf,
  type D1Like,
  type D1Statement,
  type FetchLike,
  type WgcRow,
} from "../wgc-watch/src/pipeline";
import { parseHighlights, reportLd, storageGates, canonicalSegmentsJson } from "../wgc-watch/src/parser";

const RAN_AT = new Date().toISOString();
const CENSUS_PATH = "docs/evidence/wgc-census-2026-11-24.json";
const DDL_PATH = "wgc-watch/ddl.sql";
const SCRATCH = "/tmp/wgc-harness-scratch.db";
const OUT_PATH = `tests/wgc-harness-${RAN_AT.slice(0, 10)}.json`;

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

function sqliteD1(path: string): D1Like {
  const db = new Database(path);
  return { prepare: (sql: string) => new SqliteStatement(db, sql) };
}

/* ------------------------------------------------------------------ *
 * The mock fetcher (the clock walk's clock-controllable network)
 * ------------------------------------------------------------------ */

interface MockStep {
  status: number;
  body?: string;
  finalUrl?: string; // "requested" (default) or an explicit other URL
}

function mockFetch(script: Record<string, MockStep[]>) {
  const state = { calls: [] as string[] };
  const fetchLike: FetchLike = async (url) => {
    state.calls.push(url);
    const slug = url.split("/").pop() ?? "";
    const queue = script[slug];
    if (!queue) throw new Error(`mock has no route for ${url}`);
    const step = queue.length > 1 ? queue.shift()! : queue[0]!;
    if (step.status !== 200) return { status: step.status, url, text: async () => "" };
    const finalUrl = !step.finalUrl || step.finalUrl === "requested" ? url : step.finalUrl;
    return { status: 200, url: finalUrl, text: async () => step.body ?? "" };
  };
  return { fetchLike, state };
}

/* ------------------------------------------------------------------ *
 * The assertion bookkeeping (every check recorded, nothing silent)
 * ------------------------------------------------------------------ */

const failures: string[] = [];
function check(name: string, pass: boolean, extra?: unknown): void {
  if (!pass) failures.push(name);
  console.log(`${pass ? "  ✓" : "  ✗"} ${name}${extra !== undefined ? ` — ${JSON.stringify(extra)}` : ""}`);
}

const realFetch: FetchLike = async (url, init) => {
  return fetch(url, init as RequestInit) as unknown as { status: number; url: string; text(): Promise<string> };
};

/* ------------------------------------------------------------------ *
 * Phase D first — the DDL, twice, on a fresh scratch database
 * ------------------------------------------------------------------ */

await Bun.write(SCRATCH, new Uint8Array()); // truncate
const ddl = await Bun.file(DDL_PATH).text();
const phaseD: Record<string, unknown> = {};
{
  const db = sqliteD1(SCRATCH);
  const db0 = (db as unknown as { prepare: never }) && new Database(SCRATCH);
  let applied = 0;
  try {
    db0.exec(ddl);
    applied++;
    db0.exec(ddl); // the idempotence proof — twice, no error
    applied++;
    phaseD.ddlAppliedTwice = true;
    phaseD.tables = db0.query("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'wgc%' ORDER BY name").all();
  } catch (e) {
    phaseD.ddlAppliedTwice = false;
    phaseD.error = String(e);
  }
  check("D1 DDL applies twice with no error (CREATE TABLE IF NOT EXISTS)", phaseD.ddlAppliedTwice === true, { applications: applied });
  db0.close();
}

/* ------------------------------------------------------------------ *
 * Phase A — the production parser over the 17 box issues, live
 * ------------------------------------------------------------------ */

interface CensusRow {
  monthKey: string;
  slug: string;
  status: number;
  redirectedTo?: string;
  publishedAt?: string;
  delayDays?: number;
  variant: string;
  segments: { heading: string; body: string }[];
  ldDescription?: string;
  ldMatch: boolean;
}

const census = (await Bun.file(CENSUS_PATH).json()) as CensusRow[];
// The 17 box issues: segments present, and NOT the June-2026 redirect row
// (that census row carries July's segments — it is the redirect the slug
// guard exists to reject, exercised as Phase B2, not one of the 17).
const boxRows = census.filter((r) => r.segments.length > 0 && !r.redirectedTo);
console.log(`\nPhase A — the production parser over ${boxRows.length} box issues (live fetches)`);
check("the census carries exactly 17 box issues (2025-03 → 2026-10)", boxRows.length === 17, { count: boxRows.length });

const phaseA: Record<string, unknown>[] = [];
let octoberHtml: string | null = null;
let octoberUrl = "";
let totalSegments = 0;
for (const row of boxRows) {
  const url = canonicalUrlFor(row.monthKey);
  const res = await realFetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36", "Accept-Language": "en-GB,en;q=0.9" }, redirect: "follow" });
  const html = await res.text();
  if (row.monthKey === "2026-10") {
    octoberHtml = html;
    octoberUrl = res.url;
  }
  const parsed = parseHighlights(html);
  const ld = reportLd(html);
  const gates = storageGates(parsed, ld);

  // the defensive-fallback witness: the block to the first </div> must
  // contain no nested <div> (the census invariant the fallback guards)
  const m = /<(h[234])[^>]*>\s*Highlights\s*<\/\1>/i.exec(html);
  let nestedDivInBlock: boolean | null = null;
  if (m) {
    const after = m.index + m[0].length;
    const close = html.indexOf("</div>", after);
    const block = html.slice(after, close < 0 ? after + 6000 : close);
    nestedDivInBlock = /<div[\s>]/i.test(block);
  }

  const entry = {
    monthKey: row.monthKey,
    httpStatus: res.status,
    slugGuard: slugGuardOk(res.url, row.monthKey),
    variantSeen: parsed.variant,
    variantMatches: parsed.variant === row.variant,
    segmentsParsed: parsed.segments.length,
    segmentsByteIdentical: canonicalSegmentsJson(parsed.segments) === canonicalSegmentsJson(row.segments),
    publishedAtMatches: (ld?.datePublished ?? null) === (row.publishedAt ?? null),
    gatesPass: gates.pass,
    headingsNonEmpty: parsed.segments.every((s) => s.heading.trim().length > 0),
    bodiesAtLeast40: parsed.segments.every((s) => s.body.trim().length >= 40),
    nestedDivInBlock,
    liBodiesInBlock: m ? /<li[\s>]/i.test(html.slice(m.index, html.indexOf("</div>", m.index))) : null,
  };
  totalSegments += parsed.segments.length;
  phaseA.push(entry);
  check(
    `${row.monthKey}: ${parsed.segments.length} segments, variant ${parsed.variant}, byte-identical vs census`,
    entry.httpStatus === 200 && entry.slugGuard && entry.variantMatches && entry.segmentsByteIdentical &&
      entry.publishedAtMatches && entry.gatesPass && entry.headingsNonEmpty && entry.bodiesAtLeast40 &&
      nestedDivInBlock === false,
  );
}
check("17 × 2 segments parsed in total", totalSegments === 34, { totalSegments });

// The five body styles, each exercised (the census's own variant labels):
const variantCounts: Record<string, number> = {};
for (const e of phaseA) variantCounts[String(e.variantSeen)] = (variantCounts[String(e.variantSeen)] ?? 0) + 1;
// The five body styles of §3.4, each with its own witness (the variant
// label collapses the li and p body styles into h2+h3-subheads, so the
// <li> bodies carry their own witness; the acceptance list's "2025-08
// <h3>+<p>" is the census's 2026-08 — 2025-08 is h2+h3+<p> — noted here
// so the record is exact):
const byKey = (k: string) => phaseA.find((e) => e.monthKey === k)!;
const styleWitnesses = {
  "style-1 h2+h3 subheads + p bodies (2025-04, 2026-10)": byKey("2025-04").segmentsByteIdentical === true && byKey("2026-10").segmentsByteIdentical === true,
  "style-2 h2+h3 subheads + ul-li bodies (2025-03, 2025-07)": byKey("2025-03").liBodiesInBlock === true && byKey("2025-07").liBodiesInBlock === true,
  "style-3 h2 + strong-p heads (2026-02, 2026-04, 2026-07)": ["2026-02", "2026-04", "2026-07"].every((k) => byKey(k).variantSeen === "h2+strong-p" && byKey(k).segmentsByteIdentical === true),
  "style-4 h2 + strong+<br> one-paragraph + trailing note (2026-05)": byKey("2026-05").variantSeen === "h2+strong-br-p" && byKey("2026-05").segmentsByteIdentical === true,
  "style-5 h3 box + strong-p heads (2026-08, 2026-09)": ["2026-08", "2026-09"].every((k) => byKey(k).variantSeen === "h3+strong-p" && byKey(k).segmentsByteIdentical === true),
};
for (const [style, pass] of Object.entries(styleWitnesses)) {
  check(`body style exercised: ${style}`, pass);
}
check(
  "all five body styles exercised over the 17 box issues",
  Object.values(styleWitnesses).every(Boolean),
  variantCounts,
);

// The owner's pasted September snippet — the 2026-09 census row records it
// verbatim; the production parser must reproduce it byte-identically, and
// the page's own JSON-LD description cross-checks the same words.
const sep = phaseA.find((e) => e.monthKey === "2026-09")!;
const sepCensus = boxRows.find((r) => r.monthKey === "2026-09")!;
const sepJoined = sepCensus.segments.map((s) => `${s.heading}: ${s.body}`).join(" ");
const sepLdCross = (sepCensus.ldDescription ?? "").includes(sepJoined.slice(0, 60));
check("the September snippet byte-identical (2026-09 census row, the owner's verified paste)", sep.segmentsByteIdentical === true && sep.segmentsParsed === 2);
check("the September segments cross-check against the page's own JSON-LD description", sepLdCross);

/* ------------------------------------------------------------------ *
 * Phase B — the negative paths, live
 * ------------------------------------------------------------------ */

console.log("\nPhase B — the negative paths (live fetches)");
const phaseB: Record<string, unknown>[] = [];

// B1. The no-box month: 2023-02 carries no Highlights box → a structure
//     alarm, nothing stored (the row records the alarm with empty content).
{
  const db = sqliteD1(SCRATCH);
  const res = await realFetch(canonicalUrlFor("2023-02"), { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36", "Accept-Language": "en-GB,en;q=0.9" } });
  const html = await res.text();
  const outcome = await applyCapture(db, "2023-02", res.url, html, new Date("2026-11-24T09:30:00Z"));
  const row = await getRow(db, "2023-02");
  const attempts = await countLogAttempts(db, "2023-02");
  const pass = outcome.outcome === "structure-alert" && row?.status === "structure_alert" &&
    row.highlights_json === "[]" && attempts === 0;
  phaseB.push({ case: "no-box-month-2023-02", outcome: outcome.outcome, reason: (outcome as { reason?: string }).reason, rowStatus: row?.status, storedHighlights: row?.highlights_json, attemptsLogged: attempts });
  check("2023-02 (no box) → structure alarm, nothing stored", pass, { outcome: outcome.outcome, rowStatus: row?.status });
}

// B2. The June-2026 redirect: the URL 301s to July's issue → the slug
//     guard rejects it, logged redirect-rejected, no row created.
{
  const db = sqliteD1(SCRATCH);
  const res = await realFetch(canonicalUrlFor("2026-06"), { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36", "Accept-Language": "en-GB,en;q=0.9" } });
  const html = await res.text();
  const guardBefore = slugGuardOk(res.url, "2026-06");
  const outcome = await applyCapture(db, "2026-06", res.url, html, new Date("2026-11-24T09:30:00Z"));
  const row = await getRow(db, "2026-06");
  const attempts = await countLogAttempts(db, "2026-06");
  const pass = !guardBefore && outcome.outcome === "redirect-rejected" && row === null && attempts === 1;
  phaseB.push({ case: "redirect-june-2026", finalUrl: res.url, slugGuardPassed: guardBefore, outcome: outcome.outcome, rowCreated: row !== null, attemptsLogged: attempts });
  check("June 2026 (301 → july-2026) → slug-guard rejection logged, no row", pass, { finalUrl: res.url });
}

// B3. A far-future month (2027-05) → the real 404 → the fire's waiting
//     state: no row, one logged attempt.
{
  const db = sqliteD1(SCRATCH);
  const now = new Date("2027-06-05T09:30:00Z");
  const fire = await runFire({ DB: db }, now, realFetch);
  const row = await getRow(db, "2027-05");
  const attempts = await countLogAttempts(db, "2027-05");
  const pass = fire.action === "fetch-404" && row === null && attempts === 1 && targetMonthOf(now) === "2027-05";
  phaseB.push({ case: "far-future-404-2027-05", target: fire.target, action: fire.action, rowCreated: row !== null, attemptsLogged: attempts });
  check("2027-05 (far future, live 404) → waiting: no row, attempts 1", pass, { action: fire.action });
}

// B4. Today's not-yet-published control (2026-12, 404 as of the run date)
//     via the real fetch — dated, because this issue publishes early
//     January 2027 and the same fetch will then 200.
{
  const db = sqliteD1(SCRATCH);
  const now = new Date("2027-01-03T09:30:00Z");
  const fire = await runFire({ DB: db }, now, realFetch);
  const row = await getRow(db, "2026-12");
  const attempts = await countLogAttempts(db, "2026-12");
  phaseB.push({ case: "not-yet-published-2026-12", ranAt: RAN_AT, target: fire.target, action: fire.action, rowCreated: row !== null, attemptsLogged: attempts });
  check("2026-12 (not yet published as of the run date) → fetch-404, no row", fire.action === "fetch-404" && row === null && attempts === 1, { action: fire.action, note: "dated: this issue publishes early January 2027" });
}

/* ------------------------------------------------------------------ *
 * Phase C — the clock walk (mock network, scratch database)
 * ------------------------------------------------------------------ */

console.log("\nPhase C — the clock walk");
const phaseC: Record<string, unknown>[] = [];

// C1. Days 1…7: six 404s then one 200 → attempts 7, status ok; further
//     fires exit without fetching.
{
  await Bun.write(SCRATCH, new Uint8Array());
  const db0 = new Database(SCRATCH); db0.exec(ddl); db0.close();
  const db = sqliteD1(SCRATCH);
  const { fetchLike, state } = mockFetch({
    "gold-market-commentary-december-2026": [
      { status: 404 }, { status: 404 }, { status: 404 }, { status: 404 }, { status: 404 }, { status: 404 },
      { status: 200, body: octoberHtml ?? "", finalUrl: "requested" },
    ],
  });
  const actions: string[] = [];
  for (let day = 1; day <= 7; day++) {
    const fire = await runFire({ DB: db }, new Date(`2027-01-${String(day).padStart(2, "0")}T09:30:00Z`), fetchLike);
    actions.push(fire.action);
  }
  const row = await getRow(db, "2026-12");
  const after7 = state.calls.length;
  for (let day = 8; day <= 9; day++) {
    const fire = await runFire({ DB: db }, new Date(`2027-01-${String(day).padStart(2, "0")}T09:30:00Z`), fetchLike);
    actions.push(fire.action);
  }
  const pass = row?.status === "ok" && row.attempts === 7 && after7 === 7 && state.calls.length === 7 &&
    actions.slice(0, 6).every((a) => a === "fetch-404") && actions[6] === "stored" &&
    actions.slice(7).every((a) => a === "stop-on-success");
  phaseC.push({
    case: "days-1-to-7-then-stop-on-success", target: "2026-12",
    actions, attempts: row?.attempts, status: row?.status, fetchCalls: state.calls.length,
    storedSegments: JSON.parse(row?.highlights_json ?? "[]").length,
    note: "the day-7 200 serves the live October 2026 page under the December URL (the mock's slug-guard pass) — the walk exercises the state machine",
  });
  check("days 1–7: six 404s then one 200 → attempts 7, status ok", pass, { actions, fetchCalls: state.calls.length });
  check("days 8–9: stop-on-success — zero further requests", state.calls.length === 7, { fetchCalls: state.calls.length });
}

// C2. The unchanged re-run writes nothing; a simulated WGC edit re-stores
//     with updated_at bumped and a re-stored log line.
{
  await Bun.write(SCRATCH, new Uint8Array());
  const db0 = new Database(SCRATCH); db0.exec(ddl); db0.close();
  const db = sqliteD1(SCRATCH);
  const decUrl = canonicalUrlFor("2026-12"); // the December URL serves the October page — same as the C1 mock
  await applyCapture(db, "2026-12", decUrl, octoberHtml ?? "", new Date("2027-01-07T09:30:00Z")); // the stored baseline
  const baseline = await getRow(db, "2026-12");
  const allLogs = async () => (await db.prepare("SELECT COUNT(*) AS n FROM wgc_scrape_log").first<{ n: number }>())!.n;

  // (a) unchanged — nothing written: no attempts bump, no log line, no row mutation
  const unchanged = await applyCapture(db, "2026-12", decUrl, octoberHtml ?? "", new Date("2027-01-08T09:30:00Z"));
  const afterUnchanged = await getRow(db, "2026-12");
  const unchangedWritesNothing = unchanged.outcome === "unchanged" && afterUnchanged?.attempts === baseline?.attempts &&
    afterUnchanged?.updated_at === null && (await allLogs()) === 1; // the baseline's single 'stored' line

  // (b) the simulated WGC edit: one word inside the first body — the
  //     phrase is the box's own wording (the JSON-LD description words it
  //     differently), so the edit lands inside the Highlights box itself
  const edited = (octoberHtml ?? "").replace(
    "Gold fell in October, likely on asset rotation",
    "Gold fell sharply in October, likely on asset rotation",
  );
  const editApplied = edited !== octoberHtml;
  const restored = await applyCapture(db, "2026-12", decUrl, edited, new Date("2027-01-09T09:30:00Z"));
  const afterEdit = await getRow(db, "2026-12");
  const editPass = editApplied && restored.outcome === "re-stored" && afterEdit?.updated_at !== null &&
    afterEdit.attempts === (baseline?.attempts ?? 0) + 1 &&
    JSON.parse(afterEdit.highlights_json)[0].body.includes("sharply") && (await allLogs()) === 2;

  // (c) the edited re-run is itself idempotent
  const again = await applyCapture(db, "2026-12", decUrl, edited, new Date("2027-01-10T09:30:00Z"));
  const idempotentPass = again.outcome === "unchanged" && (await allLogs()) === 2;

  phaseC.push({
    case: "unchanged-rerun-and-simulated-edit", target: "2026-12",
    unchangedOutcome: unchanged.outcome, unchangedWritesNothing,
    editOutcome: restored.outcome, editApplied, updatedAtAfterEdit: afterEdit?.updated_at,
    attemptsAfterEdit: afterEdit?.attempts, editedRerun: again.outcome,
    firstBodyAfterEdit: JSON.parse(afterEdit?.highlights_json ?? "[]")[0]?.body?.slice(0, 80),
  });
  check("unchanged re-run writes nothing (no attempts bump, no log line, no row mutation)", unchangedWritesNothing);
  check("a simulated WGC edit re-stores: updated_at bumped, attempts +1, a re-stored log line", editPass);
  check("the edited content re-runs unchanged", idempotentPass);
}

// C3. June and November fires make zero requests.
{
  await Bun.write(SCRATCH, new Uint8Array());
  const db0 = new Database(SCRATCH); db0.exec(ddl); db0.close();
  const db = sqliteD1(SCRATCH);
  const { fetchLike, state } = mockFetch({});
  const juneFire = await runFire({ DB: db }, new Date("2027-07-05T09:30:00Z"), fetchLike);
  const novFire = await runFire({ DB: db }, new Date("2026-12-05T09:30:00Z"), fetchLike);
  const logs = await db.prepare("SELECT month_key, event FROM wgc_scrape_log ORDER BY rowid").all();
  const pass = juneFire.action === "skip-month" && juneFire.target === "2027-06" &&
    novFire.action === "skip-month" && novFire.target === "2026-11" &&
    state.calls.length === 0 && logs.results.length === 2 &&
    logs.results.every((l) => l.event === "skip-month");
  phaseC.push({ case: "skip-months-zero-requests", june: juneFire, november: novFire, fetchCalls: state.calls.length, logLines: logs.results });
  check("a June-target fire and a November-target fire make zero requests (skip-month logged)", pass);
}

// C4. The month bound: 20 attempts, then the 21st fire fetches nothing;
//     day 25 closes the window → missed.
{
  await Bun.write(SCRATCH, new Uint8Array());
  const db0 = new Database(SCRATCH); db0.exec(ddl); db0.close();
  const db = sqliteD1(SCRATCH);
  const { fetchLike, state } = mockFetch({
    "gold-market-commentary-january-2027": [{ status: 404 }],
  });
  const actions: string[] = [];
  // twenty manual fires inside the window (days 1–20, before the close)
  for (let day = 1; day <= 20; day++) {
    const fire = await runFire({ DB: db }, new Date(`2027-02-${String(day).padStart(2, "0")}T09:30:00Z`), fetchLike);
    actions.push(fire.action);
  }
  const callsAt20 = state.calls.length;
  // the 21st fire — before the window close — must not fetch
  const fire21 = await runFire({ DB: db }, new Date("2027-02-21T09:30:00Z"), fetchLike);
  const callsAfter21 = state.calls.length;
  // day 25 — the window closes missed without fetching (the bound already holds)
  const fire25 = await runFire({ DB: db }, new Date("2027-02-25T09:30:00Z"), fetchLike);
  const row = await getRow(db, "2027-01");
  const logs = await db.prepare("SELECT event FROM wgc_scrape_log WHERE month_key = '2027-01' AND event = 'missed'").all();
  const pass = callsAt20 === 20 && callsAfter21 === 20 && fire21.action === "attempt-bound" &&
    fire25.action === "missed" && row?.status === "missed" && row.attempts === 20 && state.calls.length === 20 &&
    row.highlights_json === "[]" && logs.results.length === 1;
  phaseC.push({
    case: "month-bound-20-and-window-close", target: "2027-01",
    fetchCallsAtBound: callsAt20, fetchCallsAfter21st: callsAfter21, action21: fire21.action,
    action25: fire25.action, finalStatus: row?.status, finalAttempts: row?.attempts,
    storedHighlights: row?.highlights_json, missedLogLines: logs.results.length,
  });
  check("the month bound never exceeds 20 attempts (the 21st fire fetches nothing)", callsAt20 === 20 && callsAfter21 === 20 && fire21.action === "attempt-bound");
  check("window close (day 25) → status missed, a stated fact with its attempts recorded", pass);
}

// C5. The natural day-25 close after a real in-window 404: the last fire
//     fetches, fails, and closes the window in one step.
{
  await Bun.write(SCRATCH, new Uint8Array());
  const db0 = new Database(SCRATCH); db0.exec(ddl); db0.close();
  const db = sqliteD1(SCRATCH);
  const { fetchLike, state } = mockFetch({
    "gold-market-commentary-january-2027": [{ status: 404 }],
  });
  const actions: string[] = [];
  const fireDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 19, 21, 23, 25];
  for (const day of fireDays) {
    const fire = await runFire({ DB: db }, new Date(`2027-02-${String(day).padStart(2, "0")}T09:30:00Z`), fetchLike);
    actions.push(`${day}:${fire.action}`);
  }
  const row = await getRow(db, "2027-01");
  const pass = row?.status === "missed" && row.attempts === 20 && state.calls.length === 20 &&
    actions[actions.length - 1] === "25:missed";
  phaseC.push({ case: "natural-window-close-day-25", target: "2027-01", actions, finalStatus: row?.status, finalAttempts: row?.attempts, fetchCalls: state.calls.length });
  check("the cron's own 20 fires (days 1–15 + 17/19/21/23/25) end in one missed close", pass);
}

/* ------------------------------------------------------------------ *
 * The evidence file + the verdict
 * ------------------------------------------------------------------ */

const evidence = {
  harness: "tests/wgc-harness.ts",
  ranAt: RAN_AT,
  probeRerun: {
    ranAt: "2026-11-24",
    command: "bun scripts/wgc-probe.ts /tmp/wgc-census-rerun.json",
    diff: "48/48 rows byte-identical against docs/evidence/wgc-census-2026-11-24.json — gold.org had not drifted; the census and the spec stand unchanged",
  },
  productionParser: "wgc-watch/src/parser.ts (imported, not copied)",
  productionFire: "wgc-watch/src/pipeline.ts runFire/applyCapture (imported, not copied)",
  phaseA: { months: phaseA, summary: { boxIssues: boxRows.length, segments: totalSegments, variants: variantCounts } },
  septemberSnippet: { monthKey: "2026-09", byteIdentical: sep.segmentsByteIdentical === true, ldCrossCheck: sepLdCross },
  phaseB,
  phaseC,
  phaseD,
  allPass: failures.length === 0,
};
await Bun.write(OUT_PATH, JSON.stringify(evidence, null, 2));
console.log(`\n${failures.length === 0 ? "ALL CHECKS PASS" : `${failures.length} CHECK(S) FAILED`}`);
console.log(`evidence → ${OUT_PATH}`);
if (failures.length > 0) {
  console.log("failures:", failures);
  process.exit(1);
}
