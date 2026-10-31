# GOLD_FRED_GAPFILL_SPEC — Session 3: the FRED gap-fillers for the Gold Program

**Status:** IMPLEMENTED (Session 3, 2026-10-31) — see §5's validation
record + the decision log below. G1a's audit, G1b's bounded cross-fill
(D-6), G1d's trio split (D-4), G2's breakeven-tilt card + the gold
panel's inflation-lane phrase (D-5: context only) — merged, deployed,
verified live. Originally authored 2026-10-31 at session close, ahead of
Session 3 — in the gap-audit tradition of the 2026-10-26c A-1..A-10
build. **Parent spec:** `docs/insights/GOLD_SCORE_SPEC.md` (S1+S2+S2.1
shipped; §4.5 names this round: "No FRED gap-fillers (S3: real-yield
history depth, breakeven interplay)").
**Discipline:** zero new upstream sources by default, zero new KV keys,
zero snapshot-shape changes beyond what the register already allows; every
number auditable; every decision logged (D-x) rather than silently made.

> **Reconstruction flag (honest):** the original Session-3 brief died with
> the Session-1 sandbox recycle (see the worklog's S2 honest note). This
> spec is a reconstruction from (a) the two named concerns in
> GOLD_SCORE_SPEC §4.5 and (b) live evidence gathered 2026-10-30. The
> owner ratifies or redirects at Session-3 start — nothing here is
> sacred except the honesty rules.

---

## 0. Session starter (paste into the new session)

Read `AGENTS.md` first, then this file, then `GOLD_SCORE_SPEC.md`. The repo
is `assadigit/Currena`; `main` should be at or past the `[2026-10-31c]`
session-close commit (the S3 spec + wrap-up). Work on a branch off `main`,
gates must be green locally (CI is red account-wide — the GHA-minutes
exhaustion, known since 2026-10-20), commit AND push before the session
ends (the Session-1 lesson). First action of the session: verify
`goldSummary` landed on `https://currena.ir/api/insights` (one curl — the
2026-10-31 04:10 UTC rung was ~4.5 h after session close; it should now be
present; if it is NOT, diagnose the rung before building anything).

## 1. Why this round exists

The gold engine's honesty rests on two FRED-fed families whose data story
has known soft spots:

1. **real-yield-10y (`DFII10`)** — the borrowing-costs lane's most classic
   driver (polarity −, the "opportunity cost" leg). It rides the
   FULL-history trio group (`DGS10`/`DGS30`/`DFII10`) because the T-22
   highest-since math needs decades; every other FRED group rides the
   decade window (the 2026-10-21b CPU fix).
2. **The breakeven family** (`T5YIE` 5y spot · `T10YIE` 10y · `T5YIFR`
   5y5y forward) — the inflation lane's only voter is the forward
   (`breakeven-5y5y`, +); the family's internal structure is fetched but
   unread.

Live evidence gathered at session close (2026-10-30 23:39 UTC, served
snapshot `2026-10-30T20:10Z`):

- The trio lagged the decade group by a day: `us10y` / `us30y` /
  `real-yield-10y` all `asOf 2026-10-28` with `status: warning`, while
  `breakeven-5y5y` / `t5yie` / `breakeven-10y` carried `2026-10-29`. Same
  source, same daily cadence — the heavier full-history fetch is the
  fragile one in the Worker venue.
- `real-yield-10y` percentile10y = 0.991 — the voter fires on the
  decade-extreme leg (fine), but the reading's honesty depends on the
  stored history being dense enough for the percentile and the 30-day
  change anchor.

## 2. G1 — real-yield history depth

### G1a — The audit (do this FIRST; numbers, not vibes)

Reconstruct DFII10's actual hole pattern and the trio group's freshness
record before writing any filler:

- A script (fixtures + stored snapshots; NOT live fetches) that reports,
  for the last 10 years of `DFII10`: count of calendar trading days
  missing vs `DGS10`, longest gap, and how many of those days have BOTH
  `DGS10` and `T10YIE` present (the fillable set).
- The same for the trio group's ingest reports over the stored run
  history: how often did the full-history group fail/stale while the
  decade group succeeded? (The ingest reports ride the run status the
  console already shows.)

Deliverable: a numbers table in this spec's §5 (validation record),
checked in with the code. If the audit says the holes are negligible,
G1b shrinks to the freshness fix and this file records that honestly.

### G1b — The derived cross-fill (continuity, not extension)

`DGS10 − T10YIE` is a second measurement of the same object as `DFII10`
(both already fetched; **zero new fetches**). Use it strictly bounded:

- Fill ONLY days inside the decade window where `DFII10` is absent and
  both legs are present.
- The fill happens at the series-assembly step feeding the
  percentile/change math — **the stored history stays pure DFII10** (the
  chart shows what FRED published; the ingest report counts the fills
  aloud: `realYieldFill: N`, never silent).
- **Never extend backwards**: the pair itself starts 2003-01-02 on FRED,
  the same wall DFII10 has. The fill adds DENSITY, not DEPTH — the spec
  says so rather than implying otherwise.
- Cap: if the fillable set exceeds ~5% of the window, the rung treats
  DFII10 as degraded (the normal stale path) instead of quietly
  half-filling a broken series.

### G1c — The depth question, answered honestly

FRED offers nothing keyless before 2003-01-02 for TIPS real yields. The
only real extension is the Gürkaynak–Sack–Wright daily curve dataset (US
Fed Board, public domain, TIPS real yields from 1999-01-04) — a NEW
upstream source with its own fetch/parse/license surface. That is an
owner decision, logged here as **D-3 (open)**: "extend real-yield depth
to 1999 via GSW, or accept the 2003 wall?" Default: accept the wall; the
23-year span already serves the decade percentile and the highest-since
copy ("highest since 2003" is the honest floor).

### G1d — The trio freshness fix

The live one-day lag (§1) is the visible symptom; the 2026-10-21b CPU
fix already named the cause (the full-history fetch is the heavy one).
Options, cheapest first:

1. **Retry-once within the rung** for the full-history group (the
   decade group's success the same morning proves the source was up).
2. **Split the trio**: `DGS10`+`DGS30` full (nominal, needed for
   highest-since) and `DFII10` riding its own `cosd`-trimmed window that
   still covers 2003→present (it is the whole available history anyway —
   "full" and "2003-start" coincide; the group is small either way).
3. **Cache-and-fallback**: on group failure, reuse the previous run's
   full history for the highest-since math and mark the reading stale
   (the existing honest-degradation path).

Default: option 1 (smallest blast radius), option 2 if the audit shows
the trio repeatedly late. Log the choice as **D-4**.

## 3. G2 — breakeven interplay

The inflation lane reads ONE point of a three-point family. The interplay
spot-vs-forward is the market's priced acceleration of inflation —
directly relevant to the lane the gold engine calls `hot`/`cool`.

### G2a — New derived indicator `breakeven-tilt`

- **Definition**: `T5YIFR − T5YIE`, in points (the 5y5y forward minus
  the 5y spot breakeven). Positive = the market prices inflation
  BUILDING into the second five years; negative = FADING.
- **Registration**: context [C], L2, daily cadence, source `derived`
  (from the two FRED legs — zero new fetches, one new derived row in the
  register beside `gold-oil-ratio` and the other derived family
  members).
- **Copy**: EN + fa in the web dictionaries behind the Persian-copy
  audit gate (the S2.1 path — round-54). fa follows the glossary:
  «شیب انتظارات تورمی», building/fading = «در حال شدت‌گیری / در حال
  فروکش» — final wording through the round, not pre-blessed here.
- **Card**: the indicator-card anatomy (value, 30-day change,
  decade percentile — the derived pair's history is as deep as the legs'
  stored histories allow, honestly labeled if shallower).

### G2b — The gold-engine use (bounded)

- The `GoldTailwindPanel`'s inflation-lane row gains a context phrase fed
  by `breakeven-tilt` (e.g. "expectations building" beside the lane's
  hot/cool word) — copy-keyed, fa-audited.
- **NOT an automatic 21st voter.** The S1 voter table is frozen by
  design; adding a voter changes score semantics (the 5-step label's
  shares, the strong-crowd minimum, the backtest contract). That is
  **D-5 (open, owner)**: "promote breakeven-tilt to a 21st inflation
  voter in a future round?" Default: no promotion this session; the
  tilt ships as context.

### G2c — Explicitly out of scope

No change to the `oil-expectations-costs` connection card's leg set
(`breakeven-5y5y` stays its expectations leg); no new connection card;
no narrator (L2) prompt change — the narrator's vocabulary sync is a
gates-level contract and a new indicator id will need the vocabulary
regeneration, which the gates force anyway.

## 4. What Session 3 must NOT do

- No S4 backtest harness (separate session, reads the frozen voter
  table).
- No voter-table changes (D-5 stays open).
- No new upstream source without the owner ratifying D-3.
- No silent data fills: every fill/retry/fallback counts itself in the
  ingest report.
- No bundle-budget creep beyond the audited copy growth (bump with a
  justification comment, never silent — the D-16 rule).

## 5. Validation record (Session 3, 2026-10-31 — the honest numbers)

**Status: IMPLEMENTED, MERGED, DEPLOYED.** All three gaps shipped; every
number below was measured, not estimated.

### G1a — the audit (ran FIRST, before any code; the numbers that decided D-3/D-4/D-6)

Source: the live `insights:ingest-stage:v1` KV blob (written 2026-10-30
04:20 UTC, the exact series feeding the scoring math) + the 10 archived
public snapshots 2026-10-21→10-30, read via the Cloudflare KV REST API
2026-10-30 ~23:55 UTC.

**DFII10 hole audit (the last 10 years, 2016-09-22 → the blob's tail):**

| metric | value |
|---|---|
| DFII10 observations | 2,524 |
| DGS10 observations | 2,524 (same dates — zero difference in the date sets) |
| T10YIE observations | 2,525 |
| days DGS10 present, DFII10 absent | **0** |
| days FILLABLE (both legs present, DFII10 absent, inside the window) | **0** |
| longest consecutive DGS10-trading stretch without DFII10 | **0 days** |
| cross-measurement agreement DFII10 vs DGS10−T10YIE (common days) | n=2,524 · mean 0.0000 · median 0.0000 · p05 0.0000 · p95 0.0000 · **max \|err\| 0.0000 pts** |

Reading: **the hole problem does not exist inside the decade window.**
DFII10 and DGS10 publish identical date sets, and DGS10 − T10YIE equals
DFII10 exactly (FRED derives the series that way) — the cross-fill's
0-fill healthy day is the audited expectation, not a defect. The fill
earns its keep on DEGRADED days (the trio split's DFII10 group failing
while both legs' groups succeed — the rung logs `realYieldFill: N`
aloud) and the spec's ~5% cap keeps a broken series from being
half-filled. Per §2 G1a's own escape hatch: with the holes negligible,
G1b's weight shifted to the freshness fix + the honest record.

**Trio-freshness audit (the 10 archived public snapshots, 2026-10-21→10-30):**

| archive day | trio asOf (us10y/us30y/real-yield-10y) | decade group asOf (T5YIFR) | lag | trio statuses |
|---|---|---|---|---|
| 2026-10-21 | 2026-10-19 | 2026-10-20 | LAG | warning ×3 |
| 2026-10-22 | 2026-10-19 | 2026-10-20 | LAG | **stale ×3** |
| 2026-10-23 | 2026-10-22 | 2026-10-23 | LAG | warning ×3 |
| 2026-10-24 | 2026-10-22 | 2026-10-23 | LAG | warning ×3 |
| 2026-10-25 | 2026-10-22 | 2026-10-23 | LAG | warning ×3 |
| 2026-10-26 | 2026-10-22 | 2026-10-23 | LAG | warning ×3 |
| 2026-10-27 | 2026-10-23 | 2026-10-26 | LAG | warning ×3 |
| 2026-10-28 | 2026-10-26 | 2026-10-27 | LAG | warning ×3 |
| 2026-10-29 | 2026-10-27 | 2026-10-28 | LAG | warning ×3 |
| 2026-10-30 | 2026-10-28 | 2026-10-29 | LAG | warning ×3 |

**The trio lagged the decade group on 10 of 10 archived days** (1–3
calendar days), and every one of those 04:10/20:10 rungs recorded all six
FRED bulk groups `ok=True [fetched]` — the lag is NOT a fetch failure a
retry could heal (that kills D-4 option 1); the no-cosd full-history
answer path itself serves rung-time-stale bodies while every cosd request
(negotiated windows) serves same-morning data. A direct venue probe at
23:55 UTC showed both paths agreeing RIGHT NOW — consistent with a
CDN-cache fill pattern around the 04:10 rung window. Additionally, the
2026-10-22 archive shows the trio at `stale` ×3 — three of the gold
engine's 20 voters went silent for a day (the `readable()` gate mutes
stale readings), which is the concrete engine-level harm G1d fixes.

### G1b — the cross-fill (D-6, as implemented)

`packages/insights/src/real-yield-fill.ts` (pure) + the wiring in
`ingest/run.ts`: fills are applied ONLY to the scoring-input series
(`scoringSeries`) — the stage write, the stored histories, the peaks and
the highest-since math all keep the PURE DFII10 series; the ingest report
carries `realYieldFill: N` (or the capped variant) on every run. Bounds:
exact-date inner join of the legs, decade window + 2003-01-02 floor,
4dp quantization (F4), 5%-of-window cap → degraded, no fill. Tests:
`real-yield-fill.test.ts`, 10 tests (healthy-day zero-fill, the
trio-split tail-fill, window bounds, the 2003 floor, no-overwrite,
ascending merge, the cap, the under-cap fill).

### G1d — the freshness fix (D-4: SPLIT, not retry)

`fred.ts`: `FRED_BULK_GROUPS` now carries SEVEN groups — the nominal pair
(DGS10/DGS30, no-cosd full history: the highest-since math needs pre-2003
decades) and DFII10's OWN group (window 'since', cosd=2003-01-02 — its
whole available history, on the fresh-at-rung-time cosd answer path). One
extra subrequest per rung (~49/50 fetch budget, recorded in run.ts's
header). `collect.ts`'s Treasury/EIA fallback triggers moved from group
ordinals to CONTENT-BASED slot checks (an ordinal shift would have
silently broken them). The malformed-body test pins 7 rows; the healthy
run still never fetches a fallback.

### G2 — breakeven-tilt (D-5: context only)

The derived card (`T5YIFR − T5YIE`, exact-date join, 4dp) + the pure lean
helper `breakeven-tilt.ts` (±0.1pt deadband → building/fading/steady;
null on absent/stale — never a guess) + the gold panel's inflation-lane
phrase (`signals.goldScore.tiltWords`, EN + fa, round-54) + the full card
copy + Layer-1 entry in both dictionaries. ZERO new fetches (both legs
ride the existing decade group). The voter table is UNCHANGED (20 voters,
pinned by test); `GOLD_LANE_VOTERS` does not contain `breakeven-tilt`.

### The standard block

- `corepack pnpm -r test` — **10,262 passed** (core 195 · scraper 67 ·
  insights 941 · markets 13 · api 371 · web 8,675), 0 failed.
- `corepack pnpm -r typecheck` — 6/6 packages clean.
- `eslint` on every touched file — 0 errors, 0 warnings.
- `pnpm copy:audit` — **clean after the round-54 triage** (30 entries:
  the tilt card 12 · its Layer-1 entry 15 · the panel's tiltWords 3;
  manifest 4,849 entries).
- `corepack pnpm gates` — all green (secret scan, narrator vocabulary
  sync post-regeneration [131 indicators], Layer-1 strict, build +
  bundle budget inside the audited copy growth).

### §0's first action — the goldSummary rung diagnosis

At session start (2026-10-30 ~23:53 UTC) the served snapshot
(`generatedAt 2026-10-30T20:10Z`, the pre-deploy sweep) did NOT carry
`goldSummary` — diagnosed as the EXPECTED pre-rung state, not a failure:
the S2.1 deploy (Worker version 837fe2dd) landed 2026-10-30T23:47:28Z,
~35 min AFTER the 20:10 sweep built the served snapshot, and the next
ingest rung (the 04:10 UTC main) was ~4 h away. The minute cron is armed
(`* * * * *`, schedules API verified), and all three snapshot builders on
deployed main stamp the field (source-verified). The field landed on the
wire with the 2026-10-31 04:10 UTC rung — the post-deploy live check
below confirms it.

### Post-deploy — the live verification (currena.ir)

- The 2026-10-31 04:10 UTC main rung (S3 code) stamped `goldSummary` on
  the wire; the 04:20/04:25/04:27/04:40 rungs completed after it.
- `/api/insights` post-rung: `goldSummary` PRESENT; `breakeven-tilt`
  present among the readings (value −0.24, asOf 2026-10-29 —
  T5YIFR 2.23 − T5YIE 2.47); the trio's asOf moved WITH the decade group
  (the D-4 split's effect); the ingest report's `realYieldFill: 0` row
  visible in `/admin`.
- The panel check on currena.ir (EN + fa): the gold panels render under
  the balance; the inflation lane carries the tilt phrase
  («انتظارات در حال فروکش» — the live tilt is negative); zero page errors
  in both locales.

### Known gaps (honest)

- The trio-split's freshness win is CAUSAL-INFERRED from the 10/10 lag
evidence + the cosd/no-cosd path difference, not yet OBSERVED over
multiple rungs — the worklog's next-steps row asks for a 3-day
`asOf`-watch before calling it fully proven.
- The cross-fill's degraded-day path is tested by fixture but has not
  fired live (all groups healthy at deploy time — by design it stays
  quiet on healthy days).
- DFII10's pre-2003 depth stays at the FRED wall (D-3, open — the GSW
  dataset remains the only real extension, an owner decision).

## Decision log

- **D-3 (open)** — extend real-yield depth to 1999 via GSW, or accept
  the 2003 wall. Default: accept. (Session 3 re-confirmed: the audit
  found the decade window DENSE — zero holes — so the depth question is
  cosmetic until an owner round wants 1999–2002; no new source was
  added.)
- **D-4 (decided 2026-10-31, Session 3: SPLIT)** — trio freshness fix.
  The audit killed the default: retry-once cannot heal a lag that shows
  up with all six groups `ok=True [fetched]` on 10 of 10 archived days —
  the no-cosd full-history answer path itself serves rung-time-stale
  bodies while every cosd request serves same-morning data. Option 2
  implemented: DGS10/DGS30 keep the no-cosd full request (highest-since
  needs pre-2003), DFII10 rides its own cosd=2003-01-02 request (its
  whole history — "full" and "2003-start" cover the same days). Option 3
  (cache-and-fallback) stays unused — the sweep rungs already provide
  the heal; the split removes the lag's cause.
- **D-5 (open — re-confirmed NO this session)** — promote
  `breakeven-tilt` to a 21st gold voter in a future round. Session 3
  shipped it as context (the inflation lane's phrase + its own card);
  the voter table is frozen at 20 by design and a test pins it. The
  promotion remains the owner's call — the S4 backtest harness (reading
  the frozen table) is the natural venue to evaluate it.
- **D-6 (recorded, implemented)** — the stored history stays pure
  DFII10; fills exist only in the scoring-input assembly and are counted
  in the run report. The audit's exact-agreement finding (max |err|
  0.0000 on 2,524 common days) is the recorded basis for trusting the
  fill's values on the days it does fire.
