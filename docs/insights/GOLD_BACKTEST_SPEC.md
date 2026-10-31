# GOLD_BACKTEST_SPEC — Session 4: the gold-score backtest harness

**Status:** AUTHORED (2026-10-31, at the S3 session close) — the contract
for the NEXT session. Nothing here is implemented yet; §5 fills in when
S4 ships. **Parent specs:** `docs/insights/GOLD_SCORE_SPEC.md` (S1+S2+
S2.1 shipped — the 20-voter directional score) and
`docs/insights/GOLD_FRED_GAPFILL_SPEC.md` (S3 shipped — D-5 names this
harness as the venue to evaluate the tilt promotion). `AGENTS.md` §A
closes with: "NEXT: Session 4, the backtest harness (reads the frozen
20-voter table)."
**Discipline:** the harness READS production data and never changes it;
no voter-table edits flow from results without an owner round; every
number in the report states its sample size and its data lineage; no
new upstream sources without owner ratification (the D-3/D-7 rule).

---

## 0. Session starter (paste into the S4 session)

Read `AGENTS.md` first, then `GOLD_SCORE_SPEC.md`, then this file, then
`BACKTEST.md` (the Phase-I1 gauge backtest — the pattern this harness
reuses). The repo is `assadigit/Currena`; `main` should be at or past
`84a5e1c` (the S3 post-rung verification merge). Work on a branch off
`main`, local gates green (CI stays red account-wide — the GHA-minutes
exhaustion), commit AND push before the session ends (the Session-1
lesson, twice burned). **First action:** verify the corpus — (a) `curl -s
https://currena.ir/api/insights` still carries `goldSummary` +
`breakeven-tilt`; (b) read-only KV: count the `insights:archive:v1:*`
keys (one per day; ~19 expected at S4 start) and confirm the newest
carries `goldSummary`; (c) pull the trio `asOf`-watch days 2–3 from the
newest two archives (the S3 known-gap: did us10y/us30y/real-yield-10y
keep moving WITH the decade group?) — record the answer in §5 whichever
way it falls.

## 1. Why this session exists

The gold engine has never been tested against realized gold moves. S1
shipped a directional score on classical driver relationships; S2 wired
it end-to-end; S3 deepened its data. Everything validates the MECHANISM
(the score computes, renders, and reads honest data) — nothing yet
validates the HYPOTHESIS (that the 20-voter table's net direction has
ANY relationship with where gold actually goes). Two owner decisions
wait on exactly this evidence: **D-5** (promote `breakeven-tilt` to a
21st voter?) and any future threshold re-tuning round. The panel's own
caption — "conditions, not advice" — is a claim this harness is
obligated to test honestly, including the possibility that the honest
answer is "no measurable edge."

## 2. The corpus (what already gathers itself — no new cron)

The data-gathering cronjob the program needs ALREADY EXISTS — two
venues, same bytes, both idempotent:

1. **The Worker minute-cron ingest** (`apps/api/src/insights-ingest-cron.ts`)
   — the PRIMARY venue since the 2026-10-20 GHA exhaustion (verified
   live through the 04:10/04:20/04:25/04:27/04:40 rungs). Its main rung
   writes the day's archive pair exactly once (the sweeps skip an
   already-written day — `run.ts` lines ~594–615).
2. **The GHA `insights-ingest.yml`** (04:20 UTC daily) — belt-and-braces;
   currently failing at runner allocation (free minutes exhausted,
   owner-known). If GHA recovers, both venues write identical content.

**What lands each day** (measured 2026-10-31, read-only KV):

| archive key | contents | size |
|---|---|---|
| `insights:archive:v1:YYYY-MM-DD` | the FULL snapshot: 102 readings (value, asOf, status, percentile10y, changes) + `goldSummary` (netScore, lanes, voters — since 2026-10-31) + calendar + changedThisWeek | 51,375 B (2026-10-31) |
| `insights:archive-public:v1:YYYY-MM-DD` | the public projection of the same | ~51 KB |

**Retention: indefinite.** No pruning code exists anywhere in the ingest
path (audited at the S3 close: no `delete` of archive keys in
production code) — ~18.8 MB/year at one pair per day against the KV
free tier's 1 GB. The corpus only ever grows; that is the intent (D-8).

**The depth gap (honest):** archives begin 2026-10-15 — seventeen days
at S4 authorship. The LIVE corpus alone cannot backtest years. The
harness's historical depth therefore comes from RE-RUNNING the frozen
voter table over the STORED HISTORIES — the `insights:hist:*` per-series
keys + the `insights:ingest-stage:v1` blob (the same series feeding the
scoring math, G1a-audited) — with the archive era as the held-out
live-verification slice. Realized gold moves come from
`insights:hist:gold-usd` (the Yahoo GC=F ~10-year daily record already
collected). ZERO new fetches, zero new KV keys, zero new sources.

## 3. The harness (S4 scope)

Pattern: extend the proven Phase-I1 runner (`packages/insights/scripts/
backtest.ts` — frozen clock, recorded data only, writes a docs report).
A sibling `gold-backtest.ts` (or a `--gold` mode) rather than a rewrite.

- **B1 — the historical re-run.** For each week (or trading day, if the
  compute budget allows — state which) across the stored-history span:
  reconstruct each voter's input AS OF that date (value, percentile over
  the trailing 10 years of the SAME stored series, 7d/30d changes), run
  the FROZEN 20-voter table, record netScore + label + firing voters.
  No wall-clock reads; percentiles computed strictly from data at or
  before the as-of date (no lookahead); the cross-fill (D-6) applies to
  the scoring input exactly as in production, counted aloud per window.
- **B2 — the realized-move join.** Forward N-trading-day gold returns
  (N ∈ {5, 20, 60} to start) from `insights:hist:gold-usd`, joined to
  each re-run date. Report: sign-agreement rate (netScore sign vs
  forward-return sign), label-conditional mean/median forward returns,
  the confusion table (tailwind/mixed/headwind × up/flat/down with an
  explicit flat band), and the SAME table for the archive era (live
  out-of-sample, tiny-n, stated as such).
- **B3 — the honesty rules.** Every table carries n. Multiple-testing
  is named: 3 horizons × 3 labels is already 9 cells — report all, pick
  none. Data gaps (weekends, FRED holes, the pre-2003 wall) are stated
  per series, never silently interpolated. The conclusion section must
  survive the question "would this have been visible ex-ante?"
- **B4 — the D-5 evaluation.** Re-run the same windows with a
  tilt-augmented 21-voter variant (a HARNESS-LOCAL copy of the voter
  table — `GOLD_LANE_VOTERS` in production stays untouched) and report
  the delta honestly, including "no material difference." This produces
  the evidence D-5 has been waiting for; the decision stays the owner's.
- **Deliverables:** `docs/insights/BACKTEST-GOLD.md` (the report, in
  BACKTEST.md's format), the runner script, tests for the harness's
  pure parts (window joins, no-lookahead percentile, the flat band),
  §5 below filled with the measured numbers.

## 4. What S4 must NOT do

- No production voter-table changes (D-5 stays open until the owner
  reads the report; the 20-voter pin test stays green).
- No new upstream sources. The owner has offered an EODHD key — that is
  D-7 (open): "add EODHD as an alternative gold-price history?"
  Default: NO — the Yahoo GC=F record + gold-api points already cover
  realized moves; EODHD's edge (longer intraday history) serves no
  current question. Never commit the key anywhere regardless.
- No wall-clock reads inside the harness; no live fetches in tests
  (AGENTS.md rule 7); no bundle-budget changes (the harness is
  script-side, not in the Worker or web bundles).
- No archive pruning "to save space" — retention is indefinite by
  design until an owner round says otherwise (D-8).

## 5. Validation record (S4 — to fill at session close)

Placeholder. Expected entries: the corpus count at run time (archive
days + stored-history span per voter), the re-run window count, the
B2 tables with n's, the B4 delta, the asOf-watch days 2–3 verdict
(carried from §0's first action), the standard gates block, and the
honest known-gaps list.

## Decision log

- **D-5 (open — S4 is its evaluation venue)** — promote `breakeven-tilt`
  to a 21st gold voter. S4's B4 produces the comparison evidence; the
  promotion itself remains an owner decision in a later round.
- **D-7 (open — authored 2026-10-31, default NO)** — EODHD as an
  alternative gold-price history source (owner offered a key at the S3
  close). Default: not needed for B1–B4; revisiting only if the owner
  wants intraday or pre-Yahoo-record depth, which no current question
  requires.
- **D-8 (recorded 2026-10-31)** — the daily archive pair retains
  indefinitely (no pruning code exists; ~18.8 MB/year against the 1 GB
  KV free tier). The backtest corpus is allowed to grow unbounded by
  design; any future retention floor is an owner decision taken with
  the KV bill in hand, never silently.
