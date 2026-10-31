# GOLD_BACKTEST_SPEC — Session 4: the gold-score backtest harness

**Status:** IMPLEMENTED (Session 4, 2026-10-31) — §5 carries the
measured numbers; **Session 5 (2026-10-31, the close-out)** recorded its
verdicts in §5's Session-5 subsection + the decision log below: D-5
decided-YES (a 21st voter — its own session, not S5), D-7 decided-NO,
the C4 honest note shipped on the panel (round-55), the asOf-watch
re-check scheduled 2026-11-02, the C5 refresh blocked-pending-credential
(the read-only KV token was revoked mid-session; the ~14:36 UTC
credential retry failed identically; the ~15:00 UTC third round landed
the GitHub side — PR #9 merged as 758298d, CI run 364 green — but the
Cloudflare tokens are unchanged, so the round-55 note is MERGED but
NOT DEPLOYED and C5 stays blocked — §5's retry + third-round bullets). **Parent specs:** `docs/insights/GOLD_SCORE_SPEC.md` (S1+S2+
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

### Session 5 (2026-10-31, the close-out round) — the decisions, the watch disposition, the C5 blocker

Ran ~13:35–15:00 UTC (before the 11-01/11-02 rungs — the watch's days
2–3 were NOT observable at session time, per the timing note). The
session's verification + decisions, all measured or owner-quoted:

- **The corpus at S5 open:** live `/api/insights` carries `goldSummary`
  (netScore −2, headwind) + `breakeven-tilt` (−0.24, asOf 2026-10-30) ✓;
  read-only KV counted **16 full archives** (2026-10-15 → 10-31; 10-20
  absent, the known outage day; the public pair starts 10-16 — recorded,
  pre-existing); the newest (10-31) carries `goldSummary` ✓. **Day 1 of
  the asOf-watch re-confirmed from the archive pair itself:** 10-30 →
  10-31 moved the trio 10-28 → 10-29 (us10y 5.05 → 4.98, us30y 5.37 →
  5.32, real-yield-10y 2.67 → 2.63, all `warning`) while the decade group
  moved 10-29 → 10-30 (t5yie 2.47 → 2.46, T5YIFR 2.23 → 2.22) — same
  rung, both +1 trading day, lag zero. **Days 2–3 stay pending** (the
  11-01/11-02 rungs); an automated one-shot re-check is scheduled for
  2026-11-02 ~04:30 UTC to pull both rungs and record the verdict here
  whichever way it falls (lockstep → validated-by-watch, still not
  "proven"; divergence → escalate to the owner with the measured days —
  the cross-fill does NOT silently extend to the trio).
- **D-5 — decided-YES** (the owner, on S4's B4 evidence: "we can have
  21"). The promotion is a production voter-table change and therefore
  NOT S5 work: it opens as its own session with its own gates (the
  20→21 pin-test update, the 21st voter's name in both dictionaries
  behind a Persian-copy round, the harness-local table + its pin, the
  GOLD_SCORE_SPEC contract bump). S5 left `GOLD_LANE_VOTERS` untouched —
  the 20-voter pin test stays green.
- **D-7 — decided-NO** (the owner: "EODHD api is very limited and
  problematic in free mode"). The Yahoo GC=F record + gold-api points
  remain the realized-move venues; the offered key, if ever revisited,
  lives in env/secrets only (secret scan stays clean; nothing committed).
- **C4 — the honest note SHIPPED (the owner's (a) pick):** the gold
  tailwind panel now states the measured reality under its S2.1 footnote
  — EN + fa (`signals.goldScore.measuredNote` + `measuredNoteLink`,
  Persian-copy round-55,
  `docs/localization/persian-copy-round-55-gold-honest-note.md`;
  copy:audit clean, manifest 4,851 entries) — "no positive association
  with the next 5–60 days… conditions, not direction", with the link
  word pointing at the public report (this file's home in the public
  repository). No engine, voter-table, threshold, or label change; 2 new
  render tests (gold-panels.test.tsx, 25 total).
- **C5 — blocked-pending-credential (honest):** the corpus re-dump could
  not run. The read-only KV token that authenticated the §0 verification
  reads at ~13:35 UTC (16 keys listed, values read) was REVOKED
  mid-session: by ~14:05 UTC every Cloudflare REST call answered
  `Invalid API Token` (the second provided token is active but
  KV-unscoped; the GitHub token died in the same window — the push/PR
  carry the same blocker). `gold-corpus-dump` was NOT run; the S4 corpus
  (recorded 2026-10-31T12:34Z, stage blob 04:20Z) stands as the
  session-of-record until a fresh read-only token allows the refresh
  (dump → backtest; the report regenerates with its `recordedAt`
  lineage). Nothing was guessed at.
- **The credential retry (~14:29–14:37 UTC, the owner re-supplied all
  three): BLOCKED AGAIN, measured.** The "Workers API" Cloudflare token
  verifies Invalid (revoked); the "AI WORKERS" token verifies active
  but is Workers-AI-scoped — KV REST answers `Authentication error` on
  the insights namespace; the GitHub token answers 401 `Bad
  credentials` on REST and `Invalid username or token` on a push
  dry-run (the session's earlier ls-remote "success" was an anonymous
  public-repo read — it validated nothing). No stored credentials
  exist in the sandbox (no helper, no netrc, no env). C5 and the
  push/PR therefore stay blocked; the S5 commit sits complete and
  gates-green on the LOCAL branch (re-verified post-retry:
  gold-panels 25/25, gold core + score 61/61, copy:audit clean, secret
  scan clean), pushed the moment a valid GitHub token lands. A refresh
  before the 11-01 rung would be a data no-op anyway (the stage blob
  was written 04:20Z and the 10-31 archive is already in the S4
  corpus) — the scheduled 2026-11-02 re-check now carries the C5
  refresh too, so ONE working KV-scoped token closes both.
- **The third round (~14:50–15:00 UTC, post-close-out): the GitHub
  side LANDED; the Cloudflare side is unchanged — measured again.**
  The re-supplied GitHub token authenticated (login assadigit, admin
  on the repo): the branch pushed, PR #9 opened, CI run 364 ran the
  full gates green (typecheck, lint, the vitest suite, the SPA build,
  the bundle budget, the copy audit — 1m37s), and the merge landed as
  758298d. The Cloudflare pair re-measured identically to the ~14:36
  round: the "Workers API" token still verifies Invalid; the "AI
  WORKERS" token is active but Workers-AI-scoped — KV REST answers
  `Authentication error`, and `wrangler deploy` (run from the merged
  main, the SPA freshly built from 758298d) answers `Authentication
  error [code: 10000]` on /workers/services/currena-api. Production
  is therefore untouched and healthy (currena.ir /api/health ok, KV
  ok; the insights snapshot fresh at 04:20 UTC via the Worker's own
  minute-cron) — the round-55 note is MERGED but NOT DEPLOYED, and C5
  stays blocked (the S4 corpus stands as the session-of-record). ONE
  token scoped `Workers KV Storage: Read` + `Workers Scripts: Edit`
  closes the deploy, C5, and the repo Actions secret in a single
  pass.

### The standard block (S4)

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

- **D-5 (decided-YES 2026-10-31, Session 5 — implementation deferred to
  its own session)** — promote `breakeven-tilt` to a 21st gold voter. The
  owner's call on S4's B4 evidence: **"we can have 21."** The S4
  measurement stands as the context (the tilt fired in 46.7% of windows,
  moved the label bucket in 10.2%, shifted sign-agreements
  +0.4/+0.7/+0.0pp — no material difference): the promotion is a scope
  choice the owner is entitled to make, NOT an edge claim the harness
  supports. Because it changes score semantics (the 5-step label's
  shares, the strong-crowd minimum, the backtest contract), it ships in
  a dedicated session with its own gates: the 20→21 pin-test update, the
  21st voter's name in both dictionaries behind a Persian-copy round,
  the harness-local `HARNESS_GOLD_VOTERS_21` + its equality pin, the
  GOLD_SCORE_SPEC contract bump, and a fresh backtest run on the grown
  corpus. S5 changed nothing in production (`GOLD_LANE_VOTERS` untouched,
  the 20-voter pin test green).
- **D-7 (decided-NO 2026-10-31, Session 5)** — EODHD as an alternative
  gold-price history source. The owner: **"No, EODHD api is very limited
  and problematic in free mode."** Default confirmed as the outcome: the
  Yahoo GC=F ~10-year record + the gold-api live points remain the
  realized-move venues; nothing was fetched, nothing was committed. If
  the question ever reopens (intraday or pre-Yahoo-record depth), the
  key rides env/secrets only and the secret scan stays clean.
- **D-8 (recorded 2026-10-31)** — the daily archive pair retains
  indefinitely (no pruning code exists; ~18.8 MB/year against the 1 GB
  KV free tier). The backtest corpus is allowed to grow unbounded by
  design; any future retention floor is an owner decision taken with
  the KV bill in hand, never silently.
