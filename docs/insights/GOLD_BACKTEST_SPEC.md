# GOLD_BACKTEST_SPEC — Session 4: the gold-score backtest harness

**Status:** IMPLEMENTED (Session 4, 2026-10-31) — §5 carries the
measured numbers. **Parent specs:** `docs/insights/GOLD_SCORE_SPEC.md` (S1+S2+
S2.1 shipped — the 20-voter directional score) and
`docs/insights/GOLD_FRED_GAPFILL_SPEC.md` (S3 shipped — D-5 names this
harness as the venue to evaluate the tilt promotion). `AGENTS.md` §A
closes with: "NEXT: Session 4, the backtest harness (reads the frozen
20-voter table)." The harness (
`packages/insights/scripts/gold-backtest.ts` + `gold-corpus-dump.ts` +
`src/gold-backtest-core.ts`), the report (`docs/insights/BACKTEST-GOLD.md`)
and the tests (28) shipped the same day; the headline finding is in §5:
**no edge in the table's own direction over the stored-history corpus —
the measurable association runs the other way at the longer horizons**
(the mature-base sign-agreements depart BELOW 50% at 5/20/60td; the 60td
tailwind−headwind mean spread is −3.09%). The panel's "conditions, not
advice" caption is the operative description, not a disclaimer.
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

## 5. Validation record (S4 — measured 2026-10-31, the harness run's numbers)

**Status: IMPLEMENTED (Session 4, 2026-10-31).** The runner is
`packages/insights/scripts/gold-backtest.ts` (`pnpm --filter @currena/insights
gold-backtest`), its corpus recorder `scripts/gold-corpus-dump.ts`
(`gold-corpus-dump`, read-only KV → `fixtures/gold-backtest-corpus.json`,
688 KB, zod-validated), its pure core `src/gold-backtest-core.ts` +
`src/gold-backtest-core.test.ts` (28 tests). The full report with every
table is `docs/insights/BACKTEST-GOLD.md`; the numbers below are its
headlines, all measured from the frozen corpus (recorded 2026-10-31T12:34Z,
stage blob written 04:20Z).

### The corpus at run time

- **16 full archive days** (`insights:archive:v1:*`, 2026-10-15 → 10-31;
  10-20 absent — a rung outage day). The newest (10-31) carries
  `goldSummary` (netScore −2, headwind) — the only day that does (the
  field shipped with S2.1/S3 and the 10-31 04:10 rung was the first to
  stamp it). Live API at session start: `goldSummary` + `breakeven-tilt`
  both present ✓.
- **Stored-history span:** the daily FRED family starts 2016-09-23
  (~10.1 years) — 18 of the 20 voters carry full-depth dense series;
  `cftc-gold-positioning` has 1 point (never fires in the re-run era),
  `us-japan-10y-gap` 97 sparse points (monthly jgb until the 2026-10-26
  MOF upgrade), `gold-silver` 142 (monthly backfill + daily seeds since
  2026-10-08).
- **Realized series:** `insights:hist:gold-usd` — 2,514 observations,
  2016-11-02 → 2026-10-31 (the stage's copy is 2,516 — 2 points deeper at
  the head; recorded, not reconciled).

### B1 — the re-run

**2,514 windows** (every gold trading day, the daily grid). Label
distribution: tailwind ×966 · strong-tailwind ×274 · balanced ×244 ·
headwind ×634 · strong-headwind ×396 · null ×0. Average 10.0 firing
voters per window; netScore −8 to +9. The D-6 cross-fill applied per
window exactly as in production: **0 fills across all 2,514 windows**
(the stored series are dense — the S3 audit's healthy-day expectation;
the fill's production value is freshness-rescue on transient degraded
days, which a dense stored corpus cannot replay).

### B2 — the realized-move join (the headline numbers; full tables in BACKTEST-GOLD.md)

All windows (2,514; joinable per horizon 2,509 / 2,494 / 2,454), flat
band = the engine's own ±2%/30d bar scaled (±0.47% / ±1.87% / ±5.60%):

| horizon | sign-agreement | tailwind mean | headwind mean | all mean |
|---|---|---|---|---|
| 5td | 952/1842 = **51.7%** | +0.26% (n=1240) | +0.29% (n=1025) | +0.25% |
| 20td | 663/1415 = **46.9%** | +0.84% (n=1240) | +1.44% (n=1010) | +1.06% |
| 60td | 446/1016 = **43.9%** | +2.19% (n=1240) | +5.16% (n=970) | +3.47% |

Mature-base subsample (≥ 2021-09-23, a ≥ 5-year percentile base; n =
1,281 / 1,266 / 1,226): sign-agreement **46.8% / 42.5% / 32.7%** —
every horizon departs BELOW the 50% coin by more than 2 binomial SE
(±3.2 / ±3.6 / ±4.0 pp), and the tailwind−headwind mean spread is
negative at every horizon (−0.10% / −0.63% / −3.09%). **The verdict by
the stated-in-advance rule: no edge in the table's own direction — the
measurable association runs the OTHER way over this corpus.** Over this
decade, gold's advance ran THROUGH tight real rates and a strong dollar,
so the classical-relationship table reads persistently against the move
it lived through. The 9+ confusion cells per horizon × 2 table-sets are
all in the report (none picked); the archive era (16 days, 11 joinable
at 5td — sign-agreement 11/11 — 0 at 20/60td) is plumbing, not power.

### B4 — the 21-voter delta (the D-5 evidence)

The tilt fired in **1,174 of 2,514 windows (46.7%)** — mostly headwind
(910 of 1,174: the tilt sat at decade lows, i.e. fading, for most of the
corpus) — and moved the label bucket in **256 windows (10.2%)**. The
sign-agreements moved +0.4pp (5td) · +0.7pp (20td) · +0.0pp (60td):
**no material difference in the measured association** — the 21-voter
variant is not better or worse on this corpus, only noisier in its label
vocabulary. `GOLD_LANE_VOTERS` in production is untouched; the 20-voter
pin test stays green; the harness-local table is pinned equal to the
production engine by test. **D-5 remains the owner's call** — the
evidence says the promotion would not have changed the measured story.

### The asOf-watch (§0's first action, days 2–3)

Day 1 stands (the 2026-10-31 archive — the first S3 rung): the trio and
the decade group advanced in lockstep, both +1 trading day at the same
rung (us10y/us30y/real-yield-10y asOf 10-28 → 10-29 while
T5YIFR/t5yie moved 10-29 → 10-30; us10y 5.05 → 4.98), all three trio
readings `warning` (fresh, voting). **Days 2–3 are NOT YET OBSERVABLE at
the S4 close:** the corpus ends 2026-10-31 (the session ran ~12:20 UTC,
before the 11-01/11-02 rungs). The watch stays open — carried to the
next session/owner round; nothing here claims the D-4 split proven.

### The standard block

- `corepack pnpm -r test` — green (the insights package gains
  `gold-backtest-core.test.ts`, 28 tests: the equivalence pin against
  `goldTailwindScore`, the 21-voter table shape, `seriesUpTo`, the
  no-lookahead percentile (truncated-vs-full + future-spike mutation),
  the forward-return join, the flat band, the bucket folds, the sign
  agreement).
- `corepack pnpm -r typecheck` — 6/6 packages clean (the scripts
  tsconfig covers the two new scripts).
- `eslint` on every touched file — 0 errors, 0 warnings.
- `pnpm copy:audit` — clean (no user-facing copy moved; script-side +
  docs only).
- `corepack pnpm gates` — all green (secret scan clean — the corpus is
  recorded data, credentials never touched disk inside the repo).
- CI stays red account-wide (the GHA-minutes exhaustion, owner-known).

### Known gaps (honest — the full list is BACKTEST-GOLD.md's §B3)

1. The corpus depth is ~10.1 years — not decades; windows before
   2021-09-23 ride percentile bases shorter than 5 years (both
   table-sets reported side by side).
2. Three voters are structurally thin in the re-run era (cftc never
   fires; us-japan-10y-gap and gold-silver fire only near their sparse
   observation dates) — the stress lane effectively ran 4-voter.
3. The cross-fill cannot be replayed historically (0 fills on dense
   stored series) — its production effect is freshness, not score.
4. The realized series mixes the Yahoo GC=F backfill with live-price
   seed appends at the tail (both recorded, treated identically).
5. Multiple testing: ~110 reported numbers; the stated-in-advance
   conclusion rule (2-SE departure + sign-consistent spread, direction
   stated) is the guard, and it fired in the NEGATIVE direction.
6. The asOf-watch days 2–3 pending (above).
7. The harness's corpus is a snapshot — re-run `gold-corpus-dump` then
   `gold-backtest` as the archive grows (the report regenerates; the
   recordedAt line carries the lineage).

## Decision log

- **D-5 (open — S4's evidence delivered, the owner's call)** — promote
  `breakeven-tilt` to a 21st gold voter. S4's B4 measured the variant
  over 2,514 windows: the tilt fires in 46.7% of them (mostly headwind
  — the tilt sat at decade lows), moves the label bucket in 10.2%, and
  shifts the sign-agreements by +0.4/+0.7/+0.0pp — **no material
  difference** (BACKTEST-GOLD.md §B4). The promotion would not have
  changed the measured story; it remains an owner decision in a later
  round.
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
