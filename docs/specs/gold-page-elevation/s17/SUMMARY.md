# S17 — Session Summary (Gold Page Elevation)

**Session:** S17 of the Gold Page Elevation (GPE) program — the EIGHTH
Phase-D implementation session: **P4, the Advanced tier (wave 4, the
LAST feature wave — ALL THREE of its rows)**. **Date:** 2026-11-19
(~18:0x → ~19:5x UTC). **Branch:** `gold-elevation/p4-advanced` (off
the S16 close `46c4048e`; production at the session's start
`ea45d06c`; at its close **`65f7c0bb` @ 100%** — two deploys, §Deploy
below). **Scope (delivered):** R31 (F12 the time machine) + R32 (F23
the forecast-accuracy retrospective) + R33 (F26 the "if you'd bought"
calculator) — exactly as the S17 prompt scoped. R15/R23 + the prices
workbook stayed pending (no WGC drop — the seventh consecutive
session for R15; the fold record §0.2 rule). **P4 IS NOW COMPLETE —
every recommendation-table row with a Phase-D session is delivered;
the ONLY remaining program session is S18, the closeout.**

The session ran in two legs (one context interruption, honestly
recorded — the S13/S14 precedent): the first leg landed M1 (the
docs) + M2 (all three rows, backend + frontend + tests) + M3a (the
manifest round 90 + the budget bump) + the M3 lint pass + the first
deploy + BOTH KV seeds + the EN/fa verification captures, and found +
fixed one real defect at the live verification (the year-grouping fix,
below); the closing leg re-verified rather than assumed (the
deployments-API lineage + the served-chunk byte-compare), completed the
fa RTL verification legs (the retrospective table + the time machine +
the calculator, DOM-verified), the mobile 390 pass, re-ran the gates
GREEN on the fixed tree, committed + pushed the fix, and closed.

## What was delivered — R31 · F12 the time machine (Zone C)

**The data plane (backend):**
- **The meter-history domain** (`packages/insights/src/domains/gold/
  meter-history.ts` + the store/job halves): the dated voter-table
  registry **S17-D2** — `GOLD_METER_TABLE_VERSIONS` with FOUR
  selectable end-of-day entries (the S4-frozen 20-seat as the ERA
  BASIS at 2016-11-01 · the S6 21-seat at 2026-10-31 · the GF-P2
  32-seat at 2026-11-05 · the current GF-S10 37-seat = production
  `GOLD_LANE_VOTERS` at 2026-11-06), the two intra-day-only versions
  (GF-P1 19-seat, GF-P3 36-seat) recorded in the lineage comments and
  NEVER selected — the end-of-day convention (the LAST entry with
  effectiveFrom ≤ date) is the daily archive's own. The frozen
  20/21-seat literals are pinned against the harness tables
  (`HARNESS_GOLD_VOTERS_20/_21`) + production by test.
- **The reconstruction** — `computeReading` + `seriesUpTo` (the
  backtest's own loop factored pure) + the D-6 real-yield cross-fill
  at the frozen 04:10 clock; the compact row per the D7-locked
  minimal sizing: `{date, source, tableVersion, state, beamAngle,
  fullyTipped, net, readable, counts, lanes[5]}` — the readings/beam/
  lane counts, NO per-voter member lists (the historical view mirrors
  the hero's own lane-chip surface).
- **The YEAR-sharded one-read-per-request store** (S17-D1):
  `insights:gold-meter-history:v1:<YYYY>` (~260 compact rows/year
  ≈ ~100 KB/shard — the free-plan CPU budget respected) + the upsert
  merge rule (a live row overwrites a backfill row on date collision,
  never the reverse — the S16-D2 rule).
- **The 04:47 UTC rung** (S17-D3) + the `/gold-meter` literal-path
  route: the date-parameterized, READINGS-ONLY projection — the
  era-boundary rejection (`gold_meter_era_boundary` — no earlier
  meter state exists or is ever synthesized), the future rejection
  (`gold_meter_future`), the malformed-date 400, the latest-row-≤-date
  mapping (a Sunday asks for Saturday's row — honestly named), the
  prior-year fallback, the meta document (the era start + the four
  table versions) on the bare route.
- **The `gold-meter-run` runner** — the stage/hist-fallback backfill
  (the `histFallback` pattern: the stage blob's 172 series first, the
  per-id `insights:hist:*` keys for exactly the ids the stage lacks —
  the ebp finding, M1 §4).

**The surface (frontend):** `GoldTimeMachine.tsx` — the collapsed
Advanced affordance INSIDE the Zone C hero section (S17-D6): the
era-boundary note TAUGHT at the top of the card («عصر متر از نوامبر
۲۰۱۶ (آبان ۱۳۹۵) آغاز می‌شود — پنجرهٔ خودِ سری‌های ذخیره‌شده — و هیچ
قرائتِ پیش از آن وجود ندارد یا ساخته نمی‌شود»), the date picker
bounded by the era + today, the row's verdict word + counts + five
lane chips in the HERO'S OWN corpus-pinned vocabulary, the as-of
mapping line naming the last reading day honestly, the
versioned-table line («زیر جدول رأی‌دهی s4-frozen-20 (۲۰ کرسی)»), the
two provenance honesty lines (backfill: «بازسازی از سری‌های
ذخیره‌شده — ماشین‌آلاتِ خودِ بک‌تستِ منتشرشده، بدون نگاه به آینده»),
the honest gap + unavailable + loading degradations. The client
`gold-meter.ts`: zod-validated, ONE fetch per date per session, NO
localStorage — the honest cache is the HTTP layer.

## What was delivered — R32 · F23 the forecast-accuracy retrospective (Zone M)

- **`lbma-forecast.ts`** — the static series + pure compute, THE
  provenance pin: the series EXTRACTED LIVE from the publisher's own
  performance page this session (M1 §3 — the s4/02 §1d "already
  extracted" claim was found stale; the appendix table never existed
  in the repo; re-extracted per the owner's rule 5, never assume a
  number). Every recorded research aggregate reproduces exactly over
  the extracted chart bytes: **10/16 under-forecast · mean −2.11% ·
  mean-abs 8.13% · 2025 −20.24% · 2024 −13.71%**; the 2026 forecast
  average $4,741.97 + the July mid-year revision $4,604 recorded
  with their own contexts (the two LBMA-internal divergences recorded,
  never reconciled — they are LBMA's own).
- **The root-barrel export** (S17-D4) — the `gold-episodes-records`
  precedent: NO KV, NO route; the bundle carries the 17 pairs.
- **`GoldForecastRetrospective.tsx`** — the Zone M COLLAPSED companion
  inside the honest-record footer (the trust-band contiguity
  preserved — S6-D2): the takeaway line («حتی اجماع هم خطا می‌کند»),
  the headline (the 10-of-16 + the −2.11%/8.13% with the
  "این عدد، عددِ خودِ LBMA است" attribution), the 2025 line (the
  largest recorded miss, the consensus vs actual figures printed),
  the 17-row table with the DISCLOSED miss convention («خطا =
  (پیش‌بینی − واقعیت) ÷ واقعیت. عدد منفی یعنی اجماع، میانگین واقعی
  قیمت را کمتر از واقعیت دیده»), the pending row NEVER scored early
  («در جریان», —), the pairing note beside the no-edge backtest
  («مترِ کرنا هیچ لبهٔ پیش‌بینی‌ای ادعا نمی‌کند — … این کارت برای
  نشان دادنِ آن است که اجماعِ منتشرشدهٔ حرفه‌ای‌ها واقعاً چه کرد، نه
  برای این‌که بگوید ما بهتر پیش‌بینی می‌کنیم»), the dated attribution
  link («استخراج‌شده در 2026-11-19»).

## What was delivered — R33 · F26 the "if you'd bought" calculator (Zone O)

- **`if-bought.ts`** — the pure engine: the lump multiple + the
  MONTHLY DCA at $100/month-end close + the decile among all
  same-length windows with the R19 min-base 30 posture (the honest
  waiting line «صدک از ۳۰ پنجرهٔ هم‌طول روشن می‌شود — این پنجره ۱
  پنجره دارد» for the 121-month window; the live decile «صدکِ ۶ از
  ۹۹ پنجرهٔ هم‌طول» for the 23-month window) + the honest
  first-year-note (2016 = from November — a 121-month window, not a
  calendar decade); EVERY window named at point of use.
- **The ONE-key store** (S17-D5) `insights:gold-ifbought:v1` (the
  gold-lbma twin) + the month-turn anchor rule (the running point
  freezes as the prior month's last point when the month turns) + the
  04:49 UTC rung (the four running points from the page's own planes —
  the public projection + the markets board, KV reads ZERO fetches;
  the last-good discipline; per-leg honest degradation).
- **The `/gold-ifbought` literal-path route** + the `gold-ifbought-run`
  backfill runner — the stage for gold/silver/btc + the markets board's
  OWN keyless Yahoo provider for the S&P leg (the s17 M1 §5 record:
  the in-repo provider sense; the S&P stored-series did not exist —
  the runner CREATES it from the board's own venue, recorded, never
  silently assumed).
- **`GoldIfBought.tsx`** — the Zone O collapsed card beside the
  Episode Explorer: the method line («خرید یک‌جا: یک خرید در پایانیِ
  نخستین ماه. خرید ماهانه: ۱۰۰ دلار در هر پایانیِ ماه…»), the year
  picker (2016 + the November note → 2026), the four stacked result
  rows in the R33 order (طلا · S&P 500 · بیت‌کوین · نقره) each with
  the lump multiple + the named window + the DCA line + the decile
  line, the disclaimer + the named S&P venue («پایانی‌های ماه
  2016-11 تا 2026-10: طلا، نقره و بیت‌کوین از سری روزانهٔ خودمان؛
  S&P 500 از مسیر یاهوی خودِ تابلوی بازارهای جهانی»). The client
  `gold-ifbought.ts`: the gold-lbma twin's zod + localStorage pattern.

## The verification fix (found live, the S13-D4 precedent)

The EN desktop pass found the YEARS rendering GROUPED — "2,026"
instead of "2026" (and «۲٬۰۲۶» in fa) in the retrospective's year
column + the calculator's year picker and window names. Fixed same
session through `formatNumber`'s existing `useGrouping: false` support
(the corpus's own number grammar — the S14-D4 precedent): years
render UNGROUPED while the locale digits still apply; the $ amounts
KEEP their grouping. Redeployed; the served GoldPage chunk
byte-verified; re-verified live in both locales; committed + re-gated
GREEN on the exact tree (`26529924`).

## The manifest, the budget, the gates

- **The Persian-copy manifest round 90** — the session's 44 fa
  entries (the 12 time-machine + the 14 retrospective + the 18
  calculator strings); manifest 8,439 → **8,483 entries**;
  copy:audit clean; the reference doc
  `docs/localization/persian-copy-round-90-gpe-s17-p4.md`; the
  terminology additions (ماشین زمان · جدول رأی‌دهی · بازسازی از
  سری‌های ذخیره‌شده · حتی اجماع هم خطا می‌کند · گذشته‌نگری · اگر
  خریده بودید · پایانیِ ماه · پنجرهٔ هم‌طول · خرید ماهانه).
- **The budget move:** the GoldPage chunk measured 237.59/49.31 —
  bumped 218/46 → **240/50** (verified NOT duplication: each new
  component + client exactly once in the GoldPage chunk; the lbma
  static series co-located by rollup, used only here; the
  justification inline in check-bundle-budget.mjs).
- **Gates 9/9 GREEN** (3m 07s, re-run by the closing leg on the
  year-fixed tree): secret scan clean (8 patterns · 1,173 files) ·
  typecheck 6 packages · lint 0/0 · copy:audit clean (round 90) ·
  narrator vocabulary in sync · narrator eval 50 · layer1 strict
  11,969/11,969 · **the full suite 15,599** (+89 from S16's 15,510:
  the meter 27 + the lbma 11 + the if-bought 13 engine tests · the
  15 route · the 6 cron · the 18 web component tests) · build +
  budget green (the GoldPage 237.70/49.35 under 240/50).

## Deploy + the KV seeds (verified live)

The D-43 deploy-lock re-checked FIRST (the deployments API): the
newest pre-session deployment was still S16's `ea45d06c` @ 100%
(created 16:36:59Z) — no drift. The §21 portwatch window clear
(Thursday). **Two deploys, honestly recorded:** the first at 19:01:49Z
(`c1efe3be` @ 100%, first attempt clean — no 10013), the KV seeds
landed immediately after (`gold-ifbought-run` at 19:02:57Z; the meter
backfill), the live verification then found the year-grouping defect,
and the fix redeployed at 19:06:14Z — **production `65f7c0bb` @
100%**; the served `GoldPage-DpBR-wGI.js` chunk byte-identical to
the dist built from the fixed tree.

- **The meter seed** — the year-sharded backfill serving the full
  era: `?date=2016-11-18` → the s4-frozen-20 row (tipped-against,
  fullyTipped, 2 against · 1 neutral · 2 unread); `?date=2019-06-15`
  → the 2019-06-14 row under s4-frozen-20 («Learning for gold — 3
  for · 1 against · 1 unread»); `?date=2026-11-19` → the current
  gf-s10-37 row (tipped-against, beam 5, 1 for · 3 against · 1
  neutral). The boundary behaviors verified: pre-era →
  `gold_meter_era_boundary` · future → `gold_meter_future` ·
  malformed → 400. The first LIVE rung fires tomorrow 04:47 UTC
  (today's row is the honest reconstructed one until then).
- **The if-bought seed** — `insights:gold-ifbought:v1`: the 120-month
  backfill 2016-11 → 2026-10 for all four assets + the current
  running points (gold 3,726.25 · silver 45.16 · btc 63,378.22 ·
  sp500 7,218.42; asOf 2026-11-19).
- **The smoke:** `/api/health` 200 · the 9-route sibling smoke all
  200 (gold-cb · gold-crosses · gold-lbma · gold-expectations ·
  gold-premium · gold-ohlc · gold-meter · gold-ifbought).

## Live-verify matrix (PASS; nine screenshots, s17/verify-*.png)

- **EN desktop 1440:** the time machine expanded at 2020-03-16 — the
  era note verbatim, «The meter as of Mar 16, 2020 — Learning for
  gold, 3 for · 1 against · 1 unread», the five lane chips, "Under the
  s4-frozen-20 voter table (20 seats)", the no-lookahead provenance
  line · the retrospective's full 17-row table (2010 $1,199 vs $1,225
  −2.1% → 2025 $2,736.69 vs $3,431.54 −20.2%; 2026 $4,741.97 "in
  progress"; the miss convention + the mid-year revision notes
  verbatim; years ungrouped, $ grouped) · the calculator at 2016
  (gold +218.3% · S&P +228.3% · BTC +8,399.3% · silver +175.3%; the
  121-month named windows; the DCA lines; the honest decile waiting
  line "this window has 1").
- **fa/RTL desktop:** dir=rtl · the retrospective's 17-row table in
  fa — the years «۲۰۱۰»…«۲۰۲۶» UNGROUPED in Persian digits while the
  $ amounts keep «۱٬۱۹۹٫۰۰» grouping; every honesty note in fa · the
  time machine at 2020-03-16 → «متر در ۱۳۹۸/۱۲/۲۶» (the Jalali
  as-of), «تمایل به نفع طلا · ۳ موافق · ۱ مخالف · ۱ ناخوانده», the
  five lane chips, «زیر جدول رأی‌دهی s4-frozen-20 (۲۰ کرسی)» · the
  calculator's year picker «۲۰۱۶ (از نوامبر)»…«۲۰۲۶» ungrouped, the
  four rows at both the 23-month window (the live decile «صدکِ ۶ از
  ۹۹») and the 121-month window (the waiting line), the DCA lines
  («خرید ماهانه: ۱۲٬۱۰۰ ← ۹۱٬۱۰۵ (+۶۵۲٫۹٪)» — byte-parity with the
  EN values).
- **fa mobile 390×844 fresh load:** no horizontal overflow (before
  AND after expanding) · all three cards COLLAPSED by default · the
  touch targets 53/100/53 px (≥44) · the time machine expands on tap
  with the date input at exactly 44px · zero console/page errors.
- **Zero console/page errors on every surface exercised** + the
  9-route sibling smoke all 200 + the three meter boundary probes.

## Key findings in one paragraph

The program's last feature wave closed with its three heaviest
honesty surfaces. The time machine's data plane turned out to be
richer than the spec sketch assumed: the stage blob carries the full
2016-11+ grid (172 series, the CFTC outage healed — 522 points where
the recorded corpus had one), the ebp voter needs the hist-fallback
pattern, and the versioned-table lineage resolved cleanly into FOUR
selectable end-of-day tables with the intra-day versions honestly
never selected. The retrospective's series had to be re-extracted
live (the "already extracted" hand-off claim was stale — the appendix
table never existed), and the publisher's own chart bytes reproduce
every recorded research figure exactly — the strongest possible
provenance, with LBMA's own two internal divergences recorded with
their contexts rather than reconciled. And the calculator's first
live readings told the story it was built for: at the 121-month
window the decile honestly waits (ONE same-length window exists —
no thin statistics rendered), while at the 23-month window it reads
live («صدکِ ۶ از ۹۹»); every window named at point of use, the S&P
leg's series created from the board's own Yahoo venue and recorded
as such.

## Decisions taken in S17 (for the program record; DECISIONS.md at reconciliation)

- **S17-D1** The meter data plane = YEAR-sharded KV keys (one read
  per request preserved; ~100 KB/shard), the compact row per the
  D7-locked minimal sizing; the upsert merge rule live-over-backfill.
- **S17-D2** The voter-table registry = four selectable end-of-day
  entries (the S4-frozen 20-seat as the era basis); the intra-day
  versions never selected; selection pinned by test incl. boundaries.
- **S17-D3** The rungs at 04:47 (meter) + 04:49 (if-bought) UTC, both
  clear of every other rung, NO new cron trigger; both fail closed.
- **S17-D4** The retrospective = the static typed module (NO KV, NO
  route — the bundle carries 17 pairs); annual dated entry as the
  upkeep; the 2026 forecast + the mid-year revision recorded with
  their own contexts.
- **S17-D5** The calculator's data plane = ONE KV key; per-asset
  month-end closes since 2016-11 (the stage + the board's own Yahoo
  provider for the S&P leg — recorded); the current running points
  refreshed by the rung from the page's own planes (KV reads, zero
  fetches); the decile base ≥30 same-length windows with the honest
  waiting line.
- **S17-D6** The zones: the time machine inside the Zone C hero
  (the collapsed Advanced affordance), the retrospective inside the
  Zone M honest-record footer (the collapsed companion), the
  calculator in Zone O beside the Episode Explorer — all three
  collapsed by default on desktop AND 390.
- **(The session's verification fix)** — years render UNGROUPED
  through `formatNumber`'s `useGrouping: false` while the locale
  digits still apply (the corpus's own number grammar, the S14-D4
  precedent); the $ amounts keep their grouping.

## Open questions for the owner

None blocking. The standing reminders: **the WGC drops** (the GDT
quarterly [R15/R23 — the seventh session] + the prices workbook —
the Explorer's price paths light up the day it lands: save the dated
file at `data/wgc/prices/<date>-<file-as-published>.xlsx` and tell
the next session) · the EODHD plan upgrade (deepens the crosses' +
OHLC stored bases) · the Kalshi re-opening path (a written
authorization — owner-side) · the CBI gerami pin (owner-side; the
band renders honestly until then) · **the credential rotation** (the
session credentials were used again this session — rotate when
convenient).

## Done-criteria check (this session)

- [x] The branch `gold-elevation/p4-advanced` created off the S16
  close; every milestone committed + pushed (`3ec96e60` · `9e091db5`
  · `c66ecbde` · `631a91fe` · `ca715b5f` · `268e8c50` · `25168264` ·
  the fix `26529924` + the close).
- [x] R31 delivered: the meter-history domain + the year-sharded
  store + the rung + the route + the runner + the Zone C control,
  live-verified (the versioned tables serving 2016→now).
- [x] R32 delivered: the live-extracted series + the pure compute +
  the Zone M companion, live-verified (the 17-row table both locales).
- [x] R33 delivered: the engine + the ONE-key store + the rung +
  the route + the runner + the Zone O card, live-verified (both
  window shapes).
- [x] R15/R23 + the prices workbook honestly pending (the seventh
  session for R15; the fold rule cited).
- [x] The manifest round 90 + copy:audit clean.
- [x] Gates 9/9 GREEN (the suite 15,599, +89) — re-run by the
  closing leg on the year-fixed tree.
- [x] Deployed per docs/DEPLOY.md (the deploy-lock first; `65f7c0bb`
  @ 100%; the served chunk byte-verified) + both KV seeds live.
- [x] Live verification: desktop + mobile + RTL, both locales on
  all three new surfaces; zero console errors; the sibling smoke +
  the boundary probes.
- [x] The session summary + the next-session prompt written (this
  doc + the S18 closeout prompt below).

## Known problems carried forward (cite, do not re-litigate)

- **R15 / R23 / the WGC drops** — still pending (the seventh session
  for R15); the wall's WGC CB line stays; the drops' arrival unlocks
  both rows AND the Explorer's price-path + comparison halves.
- **The meter's first live rung** — fires tomorrow 04:47 UTC (today's
  row is the honest reconstructed one; the rung is pinned by tests +
  the write path proved by the backfill).
- **The calculator's decile at the longest windows** — the 121-month
  window has ONE same-length window (the honest waiting line
  renders; the decile lights only for windows with ≥30
  same-length peers — by design, no thin statistics).
- **The EODHD free-tier depth** — unchanged (disclosed;
  self-widening; the plan upgrade deepens it).
- **The two operational P0s** (CFTC Saturday gate; GPR re-fetch) —
  open on main, outside GPE.
- **The AGENTS.md drift items** (GPE-S2-28/29 — the basket currency
  count + the live-price source attribution) — end-of-program
  reconciliation, i.e. S18's scope.

## Next-session prompt (S18 — the program closeout)

```
Read AGENTS.md in the repo root first and follow it for the whole session.

You are running Session S18 of the Gold Page Elevation (GPE) program —
the NINTH and FINAL session: THE PROGRAM CLOSEOUT (no new features).
Gate state at this session's start: the CP-C lock is COMPLETE
(s9/CP-C-RECORD.md §1); the Phase-D gate is OPEN; every feature wave
DELIVERED + DEPLOYED + LIVE-VERIFIED — P1-a (production f0844e59, the
S10 rows R01–R06), P1-b (23ce6b06, the S11 rows R07–R12), P1-c
(49ae8ce7 @ 100% + the gold-cb KV seed, the S12 rows R13 + R14 + R16
+ R17), P2 (3b8a8c6a @ 100% + the gold-xau seed, the S13 rows
R18–R21), P3 COMPLETE across S14 (61180d7f @ 100% + the gold-crosses +
gold-lbma seeds, R22 + R24 + R26 + R27), S15 (83359c39 @ 100% + the
gold-expectations seed, R28 + R29 + R25 — the Kalshi leg DELIBERATELY
DROPPED per the wording read), S16 (ea45d06c @ 100% + the gold-premium
seed, R30 Bridge-2), and P4 (65f7c0bb @ 100% + the gold-meter +
gold-ifbought seeds, R31 + R32 + R33 — docs/specs/gold-page-elevation/
s17/SUMMARY.md).

Read, in order: AGENTS.md, docs/specs/gold-page-elevation/
00-PROGRAM-PLAN.md (on origin/docs/gold-page-elevation — read with
git show origin/docs/gold-page-elevation:<path>; the implementation
branch carries only the s10+ session folders), docs/specs/
gold-page-elevation/s9/CP-C-RECORD.md (§1 + §2), docs/specs/
gold-page-elevation/s8/01-RECOMMENDATION-TABLE.md (the FULL table
walk — every row's final disposition), docs/specs/
gold-page-elevation/s16/SUMMARY.md + s17/SUMMARY.md (the two
predecessor sessions).

This session's scope (the closeout, per the program plan's own
bookkeeping rules):
1. THE RESEARCH-BRANCH RECONCILIATION — the one reconciliation commit
   the program plan's D2 rule reserved for the close: reconcile the
   research branch's record (origin/docs/gold-page-elevation) against
   what shipped (read-only diff of the recommendation table's rows
   vs the delivered set; every divergence recorded with its reason —
   the Kalshi drop, the WGC-fold, any wording-level drift). The
   research docs themselves stay as the historical record (never
   rewritten); the reconciliation lands as a dated closeout doc in
   docs/specs/gold-page-elevation/s18/.
2. THE DECISIONS RECONCILIATION — docs/DECISIONS.md carries the
   per-session BD-S36…S41 entries already; verify the set is complete
   against the session SUMMARYs' own decision lists (S10-D1…S17-D6 +
   the fold/drop decisions), and add any missing records. The
   AGENTS.md drift items GPE-S2-28/29 (the basket currency count +
   the live-price source attribution) get reconciled INTO AGENTS.md's
   facts section now — the end-of-program window the research record
   reserved them for.
3. THE FINAL SWEEP — the full- table's status column closed out
   (delivered / dropped-with-reason / pending-with-owner-lever);
   the standing owner-side levers listed in one place (the WGC drops
   [R15/R23 + the prices workbook — the seventh + eighth sessions of
   the fold record; the drop's arrival unlocks them at any future
   session], the EODHD plan upgrade, the Kalshi written
   authorization, the CBI gerami pin, the credential rotation); the
   program-plan closure record written (the 18-session ledger: what
   each session shipped, in one table); the AGENTS.md project-facts
   section refreshed to the post-program state (the gold page's zone
   map + the rung registry + the KV key inventory as they now stand).
4. THE WGC DROP RE-CHECK (the fold record §0.2 rule one last time):
   if data/wgc/ has landed (or an owner notice arrived), the
   closeout EXTENDS per the rule — the S18 scope becomes the
   R15/R23 + prices-workbook session FIRST, then the closeout;
   otherwise the fold is recorded as the program's standing
   owner-side lever (never a defect).

Working mode (the repo's normal discipline): the same branch
discipline (a fresh gold-elevation/s18-closeout branch off the S17
close 26529924 on gold-elevation/p4-advanced — production 65f7c0bb is
built from it); small verified steps; commit + push after each
verified milestone; NO new features; NO deploys (a bookkeeping-only
session — unless the WGC drop arrived, in which case the feature
work follows the full deploy discipline: pnpm gates green, the D-43
deploy-lock re-check FIRST, the §21 portwatch window check, the
wrangler 10013 retry rule, live verification, the per-AGENTS.md-§10
close). The R5 no-renames constraint governs any file moves; the
GoldPage budget stands at 240/50.

Milestones: M1 the research-branch reconciliation (the divergence
record) → M2 the DECISIONS + AGENTS.md reconciliation (the drift
items + the facts refresh) + the final sweep (the status column +
the owner-lever list + the program-plan closure record) → M3 the
close per AGENTS.md §10 (HANDOFF + CHANGELOG + the S18 summary +
the program-closure TLDR — no next-session prompt: write "nothing
needed — the plan is complete" + the standing owner-side levers
instead).
```
