# GOLD_FRED_GAPFILL_SPEC — Session 3: the FRED gap-fillers for the Gold Program

**Status:** SPEC (authored 2026-10-31 at session close, ahead of Session 3 —
not yet implemented). Session 3's contract, in the gap-audit tradition of
the 2026-10-26c A-1..A-10 build.
**Parent spec:** `docs/insights/GOLD_SCORE_SPEC.md` (S1+S2+S2.1 shipped;
§4.5 names this round: "No FRED gap-fillers (S3: real-yield history depth,
breakeven interplay)").
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

## 5. Validation record (Session 3 fills this in)

- G1a audit table: (holes / fillable / longest gap / trio-freshness
  counts) — recorded here.
- `pnpm -r test` / typecheck / lint / `copy:audit` (round-54) /
  `pnpm gates` — the standard block, real numbers.
- The `goldSummary` on-the-wire confirmation (§0's first action).
- Post-deploy: the live panel check on currena.ir (EN + fa), the
  inflation-lane context phrase visible, zero page errors.

## Decision log

- **D-3 (open)** — extend real-yield depth to 1999 via GSW, or accept
  the 2003 wall. Default: accept.
- **D-4 (open)** — trio freshness fix: retry / split / cache-fallback.
  Default: retry-once.
- **D-5 (open)** — promote `breakeven-tilt` to a 21st gold voter in a
  future round. Default: no.
- **D-6 (recorded)** — the stored history stays pure DFII10; fills exist
  only in the scoring-input assembly and are counted in the run report.
