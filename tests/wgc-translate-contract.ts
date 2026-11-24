// The WGC translation module's contract test — the chat-contract runner of
// wgc-watch/src/translate.ts (the 2026-11-24 model swap: m2m100 →
// @cf/google/gemma-4-26b-a4b-it, the live bake-off's selection), guarded
// standalone, zero network, a scratch SQLite through the same D1-compatible
// adapter the harness uses:
//
//   bun tests/wgc-translate-contract.ts
//
// The contract proven here (each check states itself; evidence appends to
// tests/wgc-translate-contract-<date>.json):
//  - the happy path: ONE chat call per issue (the messages + max_tokens
//    envelope the module sends, verified on the recorded input), the fa
//    row written in the same order and shape, the `translated` log line
//    naming the model;
//  - the freshness gate: a second run is up-to-date, zero further calls;
//  - the failure discipline: a failing engine logs `translate-failed` and
//    stores nothing — the capture is never failed;
//  - the identity discipline: untranslated strings (the observed
//    llama-4-scout failure mode) fail the run, nothing stored;
//  - the shape discipline: drifted segment counts (the strict JSON
//    contract), empty content channels (the observed gpt-oss reasoning
//    mode) and dropped headlines all fail closed, nothing stored;
//  - the mirror discipline: an added headline where the source had none
//    fails; a legacy {response} envelope still parses;
//  - the re-store path: a changed English hash re-opens the gate and
//    re-translates;
//  - the attribution discipline: a non-binding adapter's sourceModel is
//    recorded in the row, never silently attributed;
//  - runFire without env.AI is byte-identical to the pre-translation
//    behavior (stop-on-success, no translation step, no detail note).
//
// This file commits what the 2026-11-25 sitting verified ad hoc (its
// scratch-D1 walk) — the runner swap makes the guard permanent.

import { Database } from "bun:sqlite";
import { contentHash } from "../wgc-watch/src/parser";
import {
  translateCommentary,
  TRANSLATION_MODEL,
  type AiLike,
  type TranslateOutcome,
  type WgcFaRow,
} from "../wgc-watch/src/translate";
import { type D1Like, type D1Statement, runFire, type WgcRow } from "../wgc-watch/src/pipeline";

const REPO_ROOT = new URL("..", import.meta.url).pathname;
const RAN_AT = new Date();
const OUT_PATH = `tests/wgc-translate-contract-${RAN_AT.toISOString().slice(0, 10)}.json`;

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
 * The assertion bookkeeping (the harness's own pattern)
 * ------------------------------------------------------------------ */

const failures: string[] = [];
const results: Array<{ check: string; pass: boolean; extra?: unknown }> = [];
function check(name: string, pass: boolean, extra?: unknown): void {
  results.push({ check: name, pass, extra });
  if (!pass) failures.push(name);
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${extra !== undefined && !pass ? ` — ${JSON.stringify(extra)}` : ""}`);
}

/* ------------------------------------------------------------------ *
 * The scratch store (the DDL, one English row per test month)
 * ------------------------------------------------------------------ */

const ddl = await Bun.file(`${REPO_ROOT}wgc-watch/ddl.sql`).text();
const db = new Database(":memory:");
db.exec(ddl);

const EN_HEADLINE = "Gold Market Commentary: Where floor art thou?";
const EN_SEGMENTS = [
  {
    heading: "October in review",
    body: "Gold fell in October, likely on asset rotation, de-grossing and Fed rate-path repricing.",
  },
  {
    heading: "Looking ahead",
    body: "The post-2011 downturn is a poor parallel for the current 25% drop from the January 2026 high.",
  },
];
const HASH_A = await contentHash(EN_SEGMENTS);

async function seedEnglish(monthKey: string, hash: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO wgc_commentary
         (month_key, source_url, headline, published_at, fetched_at, highlights_json,
          block_variant, content_hash, status, attempts, last_attempt_at, updated_at)
       VALUES (?, 'https://www.gold.org/x', ?, '2026-11-08T08:00:00Z', '2026-11-08T09:00:00Z', ?, 'h2+h3+p', ?, 'ok', 7, '2026-11-08T09:00:00Z', NULL)`,
    )
    .run(monthKey, EN_HEADLINE, JSON.stringify(EN_SEGMENTS), hash);
}

/** The null-headline seed — some months carry no JSON-LD headline. */
async function seedEnglishNullHeadline(monthKey: string, hash: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO wgc_commentary
         (month_key, source_url, headline, published_at, fetched_at, highlights_json,
          block_variant, content_hash, status, attempts, last_attempt_at, updated_at)
       VALUES (?, 'https://www.gold.org/x', NULL, '2026-11-08T08:00:00Z', '2026-11-08T09:00:00Z', ?, 'h2+h3+p', ?, 'ok', 7, '2026-11-08T09:00:00Z', NULL)`,
    )
    .run(monthKey, JSON.stringify(EN_SEGMENTS), hash);
}

const faRowOf = async (monthKey: string): Promise<WgcFaRow | null> =>
  db.prepare("SELECT * FROM wgc_commentary_fa WHERE month_key = ?").get(monthKey) as WgcFaRow | null;

const lastLogOf = async (monthKey: string) =>
  db
    .prepare("SELECT event, detail FROM wgc_scrape_log WHERE month_key = ? ORDER BY ts DESC, rowid DESC LIMIT 1")
    .get(monthKey) as { event: string; detail: string | null } | undefined;

/* ------------------------------------------------------------------ *
 * The mock chat engines (AiLike adapters over the chat.completion shape)
 * ------------------------------------------------------------------ */

type RecordedCall = { model: string; input: Record<string, unknown> };

function chatCompletion(content: string | null): unknown {
  return {
    id: "chatcmpl-test",
    object: "chat.completion",
    choices: [
      { index: 0, message: { role: "assistant", content, reasoning: "…" }, finish_reason: "stop" },
    ],
  };
}

/** Parses the module's user message back into the issue it carried. */
function issueOfInput(input: Record<string, unknown>): { headline: string | null; segments: { heading: string; body: string }[] } {
  const messages = input.messages as { role: string; content: string }[];
  const user = messages.find((m) => m.role === "user")!;
  return JSON.parse(user.content) as { headline: string | null; segments: { heading: string; body: string }[] };
}

class MockChatAi implements AiLike {
  readonly calls: RecordedCall[] = [];
  constructor(
    private respond: (issue: { headline: string | null; segments: { heading: string; body: string }[] }) => unknown,
    readonly sourceModel?: string,
  ) {}
  async run(model: string, input: Record<string, unknown>): Promise<unknown> {
    this.calls.push({ model, input });
    return this.respond(issueOfInput(input));
  }
}

/** The faithful translator — every string Persian-marked, shape and order mirrored. */
const goodResponder = (issue: { headline: string | null; segments: { heading: string; body: string }[] }) =>
  chatCompletion(
    JSON.stringify({
      headline: issue.headline !== null ? `فا:${issue.headline}` : null,
      segments: issue.segments.map((s) => ({ heading: `فا:${s.heading}`, body: `فا:${s.body}` })),
    }),
  );

/* ------------------------------------------------------------------ *
 * Phase A — the happy path + the freshness gate
 * ------------------------------------------------------------------ */

await seedEnglish("2026-10", HASH_A);
const goodAi = new MockChatAi(goodResponder, "sandbox-test/mock-chat (contract test)");
const outA = await translateCommentary(sqliteD1(db), goodAi, "2026-10", new Date("2026-11-24T10:00:00Z"));
const faA = await faRowOf("2026-10");

check(
  "the happy path: translated, the ADAPTER's sourceModel attributed, 5 strings (1 headline + 2 segments × 2), 2 segments",
  outA.outcome === "translated" &&
    outA.model === "sandbox-test/mock-chat (contract test)" &&
    outA.strings === 5 &&
    outA.segments === 2,
  outA,
);
check("the happy path: ONE chat call for the whole issue", goodAi.calls.length === 1, { calls: goodAi.calls.length });
const inputA = goodAi.calls[0]?.input as unknown as Record<string, unknown>;
const messagesA = inputA?.messages as { role: string; content: string }[] | undefined;
check(
  "the call's envelope: system + user messages, max_tokens 2048, the selected model named",
  Array.isArray(messagesA) &&
    messagesA.length === 2 &&
    messagesA[0]!.role === "system" &&
    messagesA[0]!.content.includes("English-to-Persian") &&
    messagesA[1]!.role === "user" &&
    inputA?.max_tokens === 2048 &&
    goodAi.calls[0]!.model === TRANSLATION_MODEL,
  { envelope: inputA },
);
check(
  "the fa row: the adapter's declared sourceModel recorded (never silently attributed), the English row's hash keyed, the shape mirrored in order",
  faA !== null &&
    faA.source_model === "sandbox-test/mock-chat (contract test)" &&
    faA.content_hash === HASH_A &&
    faA.fa_headline === `فا:${EN_HEADLINE}` &&
    (() => {
      const segs = JSON.parse(faA.fa_json) as { heading: string; body: string }[];
      return (
        segs.length === 2 &&
        segs[0]!.heading === `فا:${EN_SEGMENTS[0]!.heading}` &&
        segs[1]!.body === `فا:${EN_SEGMENTS[1]!.body}`
      );
    })(),
  faA,
);
const logA = await lastLogOf("2026-10");
check(
  "the log line: `translated`, the model named, the string count stated",
  logA?.event === "translated" &&
    logA.detail !== null &&
    logA.detail.includes("sandbox-test/mock-chat (contract test)") &&
    logA.detail.includes("5 strings"),
  logA,
);

const outB = await translateCommentary(sqliteD1(db), goodAi, "2026-10", new Date("2026-11-24T10:05:00Z"));
check(
  "the freshness gate: a hash-matching stored translation is up-to-date, zero further calls",
  outB.outcome === "up-to-date" && goodAi.calls.length === 1,
  { outcome: outB, calls: goodAi.calls.length },
);

/* ------------------------------------------------------------------ *
 * Phase B — the failure disciplines (each on its own month, nothing stored)
 * ------------------------------------------------------------------ */

async function provesNothingStored(month: string, outcome: TranslateOutcome, label: string): Promise<void> {
  const row = await faRowOf(month);
  const log = await lastLogOf(month);
  check(
    `the ${label} discipline: outcome failed, the \`translate-failed\` log written, NO fa row stored`,
    outcome.outcome === "failed" && row === null && log?.event === "translate-failed",
    { outcome, row, log },
  );
}

// A failing engine never fails the capture.
await seedEnglish("2025-09", HASH_A);
const throwingAi = new MockChatAi(() => {
  throw new Error("model endpoint 500");
});
const outThrow = await translateCommentary(sqliteD1(db), throwingAi, "2025-09", new Date());
await provesNothingStored("2025-09", outThrow, "failing-engine");

// The identity discipline — untranslated strings refused (the observed
// llama-4-scout failure mode: the headline and headings come back English).
await seedEnglish("2026-08", HASH_A);
const identityAi = new MockChatAi((issue) =>
  chatCompletion(JSON.stringify({ headline: issue.headline, segments: issue.segments })),
);
const outIdentity = await translateCommentary(sqliteD1(db), identityAi, "2026-08", new Date());
await provesNothingStored("2026-08", outIdentity, "untranslated-identity");
check(
  "the identity failure names the untranslated string honestly",
  outIdentity.outcome === "failed" && /untranslated/.test(outIdentity.reason),
  outIdentity,
);

// The shape discipline — drifted segment count (the strict JSON contract).
await seedEnglish("2026-07", HASH_A);
const driftAi = new MockChatAi((issue) =>
  chatCompletion(
    JSON.stringify({
      headline: "فا:x",
      segments: [...issue.segments.map((s) => ({ heading: `فا:${s.heading}`, body: `فا:${s.body}` })), { heading: "فا:extra", body: "فا:extra" }],
    }),
  ),
);
const outDrift = await translateCommentary(sqliteD1(db), driftAi, "2026-07", new Date());
await provesNothingStored("2026-07", outDrift, "shape-drift");

// The empty-channel discipline — content null (the observed gpt-oss mode:
// everything in the reasoning channel, the content channel empty).
await seedEnglish("2026-05", HASH_A);
const emptyAi = new MockChatAi(() => chatCompletion(null));
const outEmpty = await translateCommentary(sqliteD1(db), emptyAi, "2026-05", new Date());
await provesNothingStored("2026-05", outEmpty, "empty-channel");

// The dropped-headline discipline — a non-null source answered null.
await seedEnglish("2026-04", HASH_A);
const droppedAi = new MockChatAi((issue) =>
  chatCompletion(JSON.stringify({ headline: null, segments: issue.segments.map((s) => ({ heading: `فا:${s.heading}`, body: `فا:${s.body}` })) })),
);
const outDropped = await translateCommentary(sqliteD1(db), droppedAi, "2026-04", new Date());
await provesNothingStored("2026-04", outDropped, "dropped-headline");

// The added-headline discipline — a NULL-headline source answered with a
// headline (the mirror contract: the response must mirror the input).
await seedEnglishNullHeadline("2026-03", HASH_A);
const addedAi = new MockChatAi((issue) =>
  chatCompletion(JSON.stringify({ headline: "فا:invented", segments: issue.segments.map((s) => ({ heading: `فا:${s.heading}`, body: `فا:${s.body}` })) })),
);
const outAdded = await translateCommentary(sqliteD1(db), addedAi, "2026-03", new Date());
await provesNothingStored("2026-03", outAdded, "added-headline");
check(
  "the added-headline failure names the invented headline honestly",
  outAdded.outcome === "failed" && /headline was added/.test(outAdded.reason),
  outAdded,
);

// The skipped path — no captured content for the month.
const outSkipped = await translateCommentary(sqliteD1(db), goodAi, "2026-01", new Date());
check("a month with no captured commentary is skipped, never translated", outSkipped.outcome === "skipped", outSkipped);

/* ------------------------------------------------------------------ *
 * Phase C — the legacy envelope + the re-store path
 * ------------------------------------------------------------------ */

// A legacy {response: string} envelope still parses (the defensive dual read).
await seedEnglish("2025-12", HASH_A);
const legacyAi = new MockChatAi((issue) =>
  ({ response: JSON.stringify({ headline: `فا:${issue.headline}`, segments: issue.segments.map((s) => ({ heading: `فا:${s.heading}`, body: `فا:${s.body}` })) }) }),
);
const outLegacy = await translateCommentary(sqliteD1(db), legacyAi, "2025-12", new Date());
check(
  "a legacy {response} envelope parses — the dual-shape extraction holds",
  outLegacy.outcome === "translated" && (await faRowOf("2025-12")) !== null,
  outLegacy,
);

// A re-stored English (new hash) re-opens the gate and re-translates.
const EN_SEGMENTS_B = [
  ...EN_SEGMENTS,
  { heading: "A late addition", body: "WGC edited the box after publication." },
];
const HASH_B = await contentHash(EN_SEGMENTS_B);
await db
  .prepare("UPDATE wgc_commentary SET highlights_json = ?, content_hash = ? WHERE month_key = '2026-10'")
  .run(JSON.stringify(EN_SEGMENTS_B), HASH_B);
const reAi = new MockChatAi(goodResponder, "sandbox-test/mock-chat (re-store)");
const outRe = await translateCommentary(sqliteD1(db), reAi, "2026-10", new Date("2026-11-24T11:00:00Z"));
const faRe = await faRowOf("2026-10");
check(
  "a re-stored English re-opens the gate: re-translated, the new hash keyed, 3 segments mirrored",
  outRe.outcome === "translated" && outRe.segments === 3 && faRe?.content_hash === HASH_B && JSON.parse(faRe?.fa_json ?? "[]").length === 3,
  { outcome: outRe, row: faRe },
);
const logRe = await lastLogOf("2026-10");
check("the re-translation logs `translated` again (the refresh is observable)", logRe?.event === "translated", logRe);

/* ------------------------------------------------------------------ *
 * Phase D — runFire's behavior with and without the AI binding
 * ------------------------------------------------------------------ */

// Without env.AI: stop-on-success carries no translation step — the
// pre-translation behavior, byte-identical. (The fetch is never reached:
// the captured month exits before it.)
const nowTargeting = new Date("2026-11-24T09:30:00Z"); // the fire targets 2026-10
const neverFetch = async () => ({ status: 200, url: "https://www.gold.org/x", text: async () => "" });
const noAi = await runFire({ DB: sqliteD1(db) }, nowTargeting, neverFetch);
check(
  "runFire without env.AI: stop-on-success, no translation detail — the pre-translation behavior",
  noAi.action === "stop-on-success" && noAi.detail === undefined,
  noAi,
);

// With env.AI and a fresh translation: silence (up-to-date), the capture
// path untouched.
const withAi = await runFire({ DB: sqliteD1(db), AI: new MockChatAi(goodResponder, "sandbox-test/mock-chat (runFire)") }, nowTargeting, neverFetch);
check(
  "runFire with a fresh translation: stop-on-success with NO extra detail (up-to-date is silence)",
  withAi.action === "stop-on-success" && withAi.detail === undefined,
  withAi,
);

/* ------------------------------------------------------------------ *
 * The evidence file + the verdict
 * ------------------------------------------------------------------ */

const evidence = { ranAt: RAN_AT.toISOString(), module: "wgc-watch/src/translate.ts", model: TRANSLATION_MODEL, results, allPass: failures.length === 0 };
await Bun.write(OUT_PATH, JSON.stringify(evidence, null, 2));
console.log(`\n${failures.length === 0 ? "ALL CHECKS PASS" : `${failures.length} CHECK(S) FAILED`}`);
console.log(`evidence → ${OUT_PATH}`);
db.close();
process.exit(failures.length === 0 ? 0 : 1);
