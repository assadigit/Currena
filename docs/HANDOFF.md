# HANDOFF — Currena current state & next steps

## This session (S18 — GPE THE PROGRAM CLOSEOUT — THE PROGRAM COMPLETE; bookkeeping-only: NO new features, NO deploys)

**Outcome:** the program's ninth and final session closed the Gold Page
Elevation program per its own bookkeeping rules, in three milestones,
all committed + pushed on the branch `gold-elevation/s18-closeout`
(off the S17 close `0dc85eac` — the branch tip carrying the S17
bookkeeping; `26529924` is its code parent, the tree production
`65f7c0bb` was built from — the one-line branch-base note recorded in
s18/01 §0). **M1 the research-branch reconciliation**
(`docs/specs/gold-page-elevation/s18/01-RESEARCH-BRANCH-RECONCILIATION.md`):
the program plan's D2 close-out — the read-only row-by-row disposition
of the full recommendation table (**31 of 33 queued rows DELIVERED +
deployed + live-verified; R15/R23 pending on the owner-side WGC fold
[never a defect]; R28's Kalshi leg deliberately dropped per the
pre-committed wording read; the Excluded 5 held**) + the ten divergences
each with its recorded reason (the Kalshi drop · the WGC fold · the P3
regrouping · the +1 session numbering · the D2-rule form after the
gate lift · GPE-S2-28/29 → AGENTS.md this session · GPE-S2-30 verified
fixed with R01 · the D1-locked-A wording rounds · R01's mode-A
absorption) + the WGC drop re-check (data/wgc/ absent on every branch,
no owner notice — the fold stands as the program's standing owner-side
lever). **M2 the DECISIONS + AGENTS.md reconciliation + the final sweep**:
the DECISIONS set verified COMPLETE (BD-S34…S41 against every SUMMARY's
own decision list — S10's in prose form predating the literal-ID
convention; the fold/drop decisions all recorded; the one addition
BD-S42 this session) · the two AGENTS.md drift items GPE-S2-28/29
reconciled INTO the facts (§C the dollar basket = SIX currencies, the
DXY recipe, no AUD, + the true post-modularization module path · §F
the live prices = the Yahoo minute-board [BZ=F · GC=F COMEX · SI=F ·
BTC-USD] with sourceName at point of use, gold-api = the ratio/
platinum/copper + accumulated-history legs) · GPE-S2-30 verified fixed
· the §11 project-facts refreshed to the post-program state (the GPE
COMPLETE block + the gold page's render-order zone map + the
gold-family rung registry + the gold-family KV key inventory + the
GoldPage budget 240/50) · `s18/02-PROGRAM-CLOSURE-RECORD.md` written
(the 18-session ledger — every sitting one line · the standing
owner-side levers in one place · the program-closure statement).
**M3 the close:** this HANDOFF rewrite + the CHANGELOG S18 entry +
BD-S42 + the S18 summary + the program-closure TLDR. **Gates 9/9 GREEN
re-run on the exact S18 tree (3m 05s): the full suite 15,599 IDENTICAL
to S17's close (ZERO delta — the docs-only proof, the M16 precedent) ·
the GoldPage budget 237.70/49.35 under the 240/50 ceiling · copy:audit
clean · secret scan clean · lint 0/0.** NO deploy (bookkeeping-only —
production stays S17's `65f7c0bb` @ 100%, untouched; the deploy-lock
was not re-checked because no deploy ran, per the docs-only M16
precedent). **The program counter: Session 18/18 · 0 remaining — THE
PLAN IS COMPLETE.** Nothing needed next; the standing owner-side
levers (below + s18/02 §3) are the open menu for any future session.

## Previous session (S17 — GPE P4, the Advanced tier — the LAST feature wave; DONE AND VERIFIED LIVE — P4 COMPLETE, every feature wave done)

**Outcome:** ALL THREE of the tier's rows landed, tested, deployed,
and live-verified — **R31 (F12 the time machine**, the collapsed Zone
C Advanced affordance inside the hero: the era-boundary note taught
with the Jalali month, the date picker bounded by the era + today, the
reconstructed verdict word + counts + five lane chips in the hero's
own corpus vocabulary, the as-of mapping line, the versioned-table
line, the two provenance honesty lines; the data plane: the dated
four-entry voter-table registry [the S4-frozen 20-seat era basis ·
the S6 21 · the GF-P2 32 · the current GF-S10 37 — the intra-day
versions never selected], the backtest's own reconstruction
machinery, the D7-locked compact row, the YEAR-sharded one-read store,
the 04:47 UTC rung, the /gold-meter date-parameterized READINGS-ONLY
projection with the era-boundary + future + malformed rejections ·
the meter-era boundary 2016+ NEVER crossed) · **R32 (F23 the
forecast-accuracy retrospective**, the collapsed Zone M companion
inside the honest-record footer: the LBMA analyst-survey vs actual
2010–2026 — the series EXTRACTED LIVE from the publisher's own
performance page after the "already extracted" hand-off claim was
found stale; every recorded aggregate reproduces exactly [10/16
under-forecast · mean −2.11% · mean-abs 8.13% · 2025 −20.24% · 2024
−13.71%]; the static typed module, NO KV/NO route, the bundle carries
17 pairs; the miss convention disclosed at point of use, the pending
row never scored early, the pairing note beside the no-edge backtest,
the dated attribution link) · **R33 (F26 the "if you'd bought"
calculator**, the collapsed Zone O card beside the Episode Explorer:
gold vs S&P vs BTC vs silver, the lump multiple + the $100/month
monthly DCA at month-end closes, the decile among same-length windows
with the R19 min-base 30 posture and the honest waiting line at the
121-month window, every window named at point of use, the method line
+ the first-year November note + the disclaimers + the named S&P
venue; the ONE-key store + the 04:49 UTC rung [the four running
points from the page's own planes, KV reads zero fetches] + the
/gold-ifbought route + the backfill runner [the stage for
gold/silver/btc + the markets board's own keyless Yahoo provider for
the S&P leg, recorded]). **The year-grouping verification fix** (found
live at the EN desktop pass, the S13-D4 precedent): years render
UNGROUPED (2016/۲۰۱۶, never 2,026/۲٬۰۲۶) through formatNumber's
useGrouping:false while the locale digits still apply — the $
amounts keep their grouping. **R15/R23 + the prices workbook stayed
pending** (no WGC drop — the seventh consecutive session for R15; the
fold rule). Production is currena-api **`65f7c0bb` @ 100%** (two
deploys, honestly recorded: the first `c1efe3be` at 19:01:49Z — the
D-43 deploy-lock re-checked FIRST, `ea45d06c` still active, no drift;
the year-fix redeploy at 19:06:14Z; the served GoldPage chunk
byte-verified identical to the fixed tree) **+ the two KV seeds**
(the year-sharded `insights:gold-meter-history:v1:<YYYY>` backfill
serving the full 2016-11→now era under the then-current versioned
voter tables + `insights:gold-ifbought:v1`: the 120-month four-asset
backfill 2016-11 → 2026-10 + the current running points [gold
3,726.25 · silver 45.16 · btc 63,378.22 · sp500 7,218.42]). The
branch `gold-elevation/p4-advanced` is pushed with the session's
eight commits (the M1 docs `3ec96e60` · the R31 backend `9e091db5` ·
the R31 frontend `c66ecbde` · the R32 `631a91fe` · the R33 `ca715b5f`
· the manifest round 90 + budget `268e8c50` · the lint pass `25168264`
· the year-fix commit `26529924`) + the close. Gates 9/9 GREEN
(re-run by the closing leg on the fixed tree, 3m 07s; suite **15,599**,
+89). The Persian-copy manifest round 90 landed the session's 44 fa
entries (8,439 → **8,483** entries; copy:audit clean; the terminology
additions: ماشین زمان · جدول رأی‌دهی · بازسازی از سری‌های ذخیره‌شده ·
حتی اجماع هم خطا می‌کند · گذشته‌نگری · اگر خریده بودید · پایانیِ ماه ·
پنجرهٔ هم‌طول · خرید ماهانه). The GoldPage budget bumped 218/46 →
**240/50** (measured 237.59/49.31, verified not duplication — the
justification inline in check-bundle-budget.mjs). The live-verify
matrix: EN desktop ×3 surfaces + fa RTL ×3 (the retrospective's
17-row table with ungrouped Persian-digit years + the time machine at
۱۳۹۸/۱۲/۲۶ under s4-frozen-20 + the calculator at both window shapes)
+ fa mobile 390 (no overflow, all three collapsed by default, the
touch targets ≥44px, the tap-expand working) — zero console errors;
the 9-route sibling smoke all 200; the three meter boundary probes
(the nine screenshots: s17/verify-*.png). The session ran in two legs
(one context interruption, honestly recorded): the closing leg
re-verified the production state (the deployments-API lineage + the
served-chunk byte-compare) before committing the fix. The session
summary + the S18 closeout prompt are
docs/specs/gold-page-elevation/s17/SUMMARY.md.

**Program counter: Session 17/18 · 1 remaining (S18 = the program
closeout — the research-branch reconciliation + the DECISIONS/AGENTS.md
reconciliation [the GPE-S2-28/29 drift items] + the final sweep + the
program-plan closure record; NO new features; the S18 prompt is in
s17/SUMMARY.md's next-session section — if the WGC drop has arrived,
the closeout session extends per the fold record rule FIRST).**

## Previous session (S16 — GPE P3, the Supporting tier's third + FINAL session; DONE AND VERIFIED LIVE — P3 COMPLETE)

**Outcome:** the row **R30 (F3b Bridge-2 — the حباب premium HISTORY)**
landed, tested, deployed, and live-verified: the one-time TGJU
profile-history backfill (the s4/03 §1e verified route, re-verified
live + extended to the `/history` full-list pages: 30 daily rows per
leg, BOTH calendars per row — the Gregorian column authoritative, no
calendar conversion anywhere; the four legs [sekee · sekeb · ons ·
price_dollar_rl] inner-joined on common days — 24 at launch, Tehran
Mon–Thu; the premium COMPUTED from the legs' own closes, never
scraped as a claim; the reconstructed series reconciles the s1/11 §5
probe values EXACTLY) + the forward accumulation (the 20:33 UTC =
00:03 Tehran daily rung — the PRICES_CRON_MINUTE pattern, NO new cron
trigger; the day's last snapshot over the same `coinPremium()`
computation the bridge board renders; write-if-changed; a missing or
>24 h-old snapshot writes nothing) + the premium DECILES (the R19
posture — min base 30, the current point excluded, the basis window
named; the honest sub-30 waiting line at launch) + the day-move
attribution strip (the EXACT identity arithmetic Δln(coin) =
Δln(ounce) + Δln(USD/IRR) + Δln(1+premium), the formula printed
VERBATIM at point of use — «تفکیک حسابی است، نه برآورد آماری
(رگرسیون)» — NEVER GRAM-style regression, the s7/01 §8 binding copy)
+ the honesty line («بازسازی‌شده از تاریخچهٔ منبع» vs «محاسبهٔ زنده از
اسنپ‌شات‌های خودمان» — rendered on the chart's own boundary marker
«آغاز محاسبهٔ زنده») — all on the Zone F extension below the bridge
board (`GoldPremiumHistory.tsx`, the same band, s1/11 §8's phase 2).
**The CBI gerami pin was attempted** (the WAF block re-verified; a
third-party corroboration at ~0.909 g pure recorded as corroboration
only — not the CBI primary): **the 0.90–0.92 g band stands** (S16-D5).
**R15/R23 + the prices workbook stayed pending** (no WGC drop — the
sixth consecutive session for R15; the fold rule). Production is
currena-api **`ea45d06c` @ 100%** (the D-43 deploy-lock re-checked
FIRST — `83359c39` still active, no drift; first attempt clean) **+
the gold-premium KV seed** (`insights:gold-premium-history:v1`: the
24-day backfill 2026-10-15 → 2026-11-18 + the live 2026-11-19 row —
the backfill→live boundary exact; the Emami premium 7.33% at the
backfill close → 6.78% live at the seed). The branch
`gold-elevation/p3-bridge2` is pushed with the session's five commits
(the M1 docs `1283afa1` · the backend `f848446c` · the frontend
`8fb812ff` · the manifest + budget + gates `ac05da94` + the close).
Gates 9/9 GREEN (suite **15,510**, +48: the insights 25 engine + the
scraper 9 parser + the api 8 route/cron + the web 6 component tests).
The Persian-copy manifest round 89 landed the session's 22 fa entries
(8,417 → **8,439** entries; copy:audit clean; the terminology
additions: نوار تفکیک حرکت روز · اتحادِ دقیق · مِلت · خط صداقت). The
GoldPage budget bumped 210/45.5 → **218/46** (measured 216.67/45.35,
verified not duplication — the component + client each once; the pure
engines ride the shared insights chunk). The live-verify matrix:
13/13 PASS across EN desktop + fa RTL + mobile 390, zero console
errors (the four screenshots: s16/verify-*.png). **P3 IS COMPLETE**
— every queued P3 row (R22–R30) delivered + deployed + live-verified
across S14–S16. The session summary + the S17 next-session prompt are
docs/specs/gold-page-elevation/s16/SUMMARY.md.

**Program counter: Session 16/18 · 2 remaining (S17–S18).** Next:
S17 = P4 the Advanced tier (R31 the time machine + R32 the
forecast-accuracy retrospective + R33 the "if you'd bought" calculator
— ALL THREE, the last feature wave; the S17 prompt is in
s16/SUMMARY.md's next-session section); S18 = the program closeout
(the research-branch reconciliation + the AGENTS.md drift items +
the final sweep).

## Previous session (S15 — GPE P3, the Supporting tier's second session; DONE AND VERIFIED LIVE)

**Outcome:** the rows R28 (F24 the Fed-probabilities card — **the
Kalshi leg DELIBERATELY DROPPED on the Developer-Agreement wording
read's verdict** [s15 M1 §1: the agreement's own §3/§3.1 prohibit
non-own-trading use, collecting/caching/storing, and third-party
sharing; the pre-committed worst case fired exactly as the roadmap
recorded it] — the card renders the POLYMARKET leg alone, honestly
named as ONE venue with the traders'-not-ours disclaimer, the
30-minute :23/:53 cron refresh, the rolling discovery rule, the
gold-expectations-run seed runner) · R29 (F25 the calendar strip —
the next Fed/CPI events off the SAME insights snapshot's calendar
field, zero new fetches, the zone named at point of use, Jalali
dates for fa) · R25 (F6 the Episode Explorer — the nine-record
launch list 1971→2024-26 as the typed static module with every
EN/FA editorial string riding the dictionaries, the hasData
honesty flags, the 2016+ meter-era boundary, the out-bound-only
links, and the DROP-GATED price path + comparison rider rendering
the honest waiting states until the WGC prices-workbook drop
lands — the adapter/runner/route/engine all ship READY: the day
the drop lands at data/wgc/prices/, one `gold-episodes-run` command
lights the paths) landed, tested, deployed, and live-verified.
**R15/R23 stayed pending** (no WGC drop — the fifth consecutive
session for R15; the fold rule; the wall's WGC CB line stays).
Production is currena-api **`83359c39` @ 100%** (created
2026-11-19T06:10:56Z, first attempt clean; the D-43 deploy-lock
re-checked FIRST — `61180d7f` was still active, no drift) **+ the
gold-expectations KV seed** (the December Fed event: +25 bp 91.5% ·
+50+ 6.3% · unchanged 2.4% — the :23 rung refreshed it live minutes
after the seed, the honest as-of label carrying the move). The
branch `gold-elevation/p3-expectations` is pushed with the
session's four commits (the M1 docs `75f7a55f` · the backend
`023e2e92` · the three surfaces `f0ac6b96` · the manifest round +
budget `9f7a8cc7`) + the close commit. Gates 9/9 GREEN (suite
**15,462**, +87: the insights 56 + the api 14 + the web 18 new
tests). The Persian-copy manifest round 88 landed the session's 140
fa strings (8,277 → **8,417** entries; copy:audit clean; the
terminology additions: واحد پایه · احتمال ضمن بازار · رخداد ·
میانگین ماهانه). The GoldPage budget bumped 179/40 → **210/45.5**
(measured 207.17/44.12, verified not duplication). The live-verify
matrix: 13/13 PASS across EN desktop + fa RTL + mobile 390, zero
console errors (the seven screenshots: s15/verify-*.png). One
environment incident, honestly recorded: the sandbox's direct tool
channel wedged mid-session — the remaining work ran through
delegated subagent shells with every step still verified. The
session summary + the S16 next-session prompt are
docs/specs/gold-page-elevation/s15/SUMMARY.md.

**Program counter: Session 15/18 · 3 remaining (S16–S18).** Next:
S16 = P3's third session (R30 Bridge-2 — the حباب premium history +
deciles + the day-move attribution strip + the TGJU profile-history
backfill + the CBI gerami pin attempt; **if the WGC prices workbook
has arrived, run the gold-episodes-run runner to light the
Explorer's paths** — the S15-shipped machinery; R15/R23 stay
drop-conditional — the S16 prompt is in s15/SUMMARY.md's
next-session section).

## Previous session (S14 — GPE P3, the Supporting tier's first session; DONE AND VERIFIED LIVE)

**Outcome:** the rows R22 (F11 the correlation companion — the four
mandated layers, the pre-registered windows printed) · R24 (F22 the
London vault + clearing cards — LBMA's own 9,850 t figure matched) ·
R26 (F10 the five-currency grid — EUR/AUD native + JPY/GBP/CNY derived,
the KGX validation sentence) · R27 (F14 the COT band chips + the crowd
gauge) landed, tested, deployed, and live-verified. **R15 stayed
pending** (no WGC GDT drop — the fold record §0.2 rule, the third
consecutive session; the wall's WGC CB line stays). **The R07 Treasury
flip finally verified live mid-session**: the 04:10:18Z Nov 19 rung
fired while the session deployed — the yield family now reads "U.S.
Department of the Treasury" primary with the freshest as-of (us10y 5.07
· us30y 5.41 · real-yield-10y 2.88 @ 2026-11-18), closing the carry
that ran S11 → S12 → S13. Production is currena-api **`61180d7f` @
100%** (created 2026-11-19T04:08Z, first attempt clean; the deploy-lock
checked first — `3b8a8c6a` was still active, no drift) **+ the two KV
seeds** (`insights:gold-crosses:v1`: EUR 362 native · JPY 267 · GBP 263
· CNY 261 derived · AUD 308 native, asOf 2026-11-18;
`insights:gold-lbma:v1`: vault 124 rows → 2026-10, clearing 360 rows →
2026-09). The branch `gold-elevation/p3-supporting` is pushed with the
session's four commits (the M1 docs `52489933` · the backend
`77bcc2bc` · the frontend + manifest + budget `70895a5e` · the close).
Gates 9/9 GREEN (suite **15,375**, +48; the M2 commit's 10 lint errors
cleared by the closing leg). The Persian-copy manifest round 87 landed
the session's 54 new fa strings + the faqA3 re-pin (8,223 → **8,277**
entries; copy:audit clean). The GoldPage budget bumped 152/34.5 →
**179/40** (measured 177.57/39.31, verified not duplication). The
session ran in two legs (one context interruption — the first leg
landed M1 + the entire backend + the drafted frontend; the closing leg
finished, wired, gated, deployed, seeded, verified, closed). The
session summary + the S15 next-session prompt are
docs/specs/gold-page-elevation/s14/SUMMARY.md.

**The honest live context the surfaces report:** gold sits at the
BOTTOM of its 1-year stored window in every numeraire (XAUUSD
3,793–5,513 over the year, closing 2026-11-18 at the minimum, −6.46%
over 30 days) — the grid's five rows read «bottom 0–1%», the KGX
renders the honest mixed «0 of 5 up» (S14-D5), the correlation strip
carries its first 2 rolling points (the self-widening state).

**Program counter: Session 14/18 · 4 remaining (S15–S18).** Next: S15 =
P3's second session (R28 the Fed-probabilities card — the Kalshi
developer-agreement wording read is the FIRST task · R29 the calendar
strip · R25 the Episode Explorer; R30 Bridge-2 is S16's; R15/R23 stay
drop-conditional — the S15 prompt is in s14/SUMMARY.md's next-session
section).

## Previous session (S13 — GPE P2, the interactive chart + the TA band; DONE AND VERIFIED LIVE)

**Outcome:** the rows R18 (F7 the interactive price chart) · R19 (F8 the
minimal TA band) · R20 (F4a the education on-ramp) · R21 (F4b the
one-liners + the Chain-7 physical grouping) landed, tested, deployed,
and live-verified. **R15 stayed pending** (no WGC GDT drop — the fold
record §0.2 rule; the wall's WGC CB line stays). Production is
currena-api `3b8a8c6a` @ 100% (created 2026-11-19T01:04:39Z) **+ the
gold-xau KV seed** (the `gold-xau-run` landing lever: 360 final bars
2025-11-19 → 2026-11-18, last close 3,792.59 —
`GET /api/insights/gold-ohlc` serves it). The branch
`gold-elevation/p2-chart-ta` is pushed with the session's eight commits
(the M1 docs · the R18 backend · the four rows · the manifest round 86
· the budget bump · the pivot fix · the deploy/seed/verification · the
close). Gates 9/9 GREEN (suite 15,327, +37; re-run after the fix).
The Persian-copy manifest round 86 landed the session's 93 fa strings
(8,130 → 8,223 entries; copy:audit clean). The session summary + the
S14 next-session prompt are
docs/specs/gold-page-elevation/s13/SUMMARY.md.

**The session's honest shape:** one context interruption — the first
leg (Nov 18 21:18–22:17 UTC) landed M1 + M2 + the manifest/gates +
the deploy (`62d38fa8`) + the secret + the KV seed, then died before
the deploy commit/verification/close; the second leg (Nov 19 00:46 →)
verified rather than assumed (the D-43 read, the byte-identical chunk,
the route, gates re-run), **found one real defect at the live
verification — the R19 daily-pivot basis was one session stale — fixed
it (`a012d544`), re-gated, redeployed (`3b8a8c6a`), re-verified, and
closed.**

**The honest R07 carry (one more session):** the first
Treasury-primary rung fires **04:10 UTC Nov 19** — at this session's
close re-check (01:09 UTC) the live readings still carried FRED
provenance (us10y 5.12 @ 2026-11-16 "FRED (DGS10)"; the status blob
healthy). **S14's M1 verifies the flip** — the clock has now passed it.

**Program counter: Session 13/18 · 5 remaining (S14–S18).** Next: S14 =
P3 the Supporting tier's first session (R22 F11 the correlation
companion · R24 F22 the London vault + clearing cards · R26 F10 the
multi-currency gold grid · R27 F14 the COT percentile bands; **+ R15 the
GDT stack if the owner's drop arrives** — the S14 prompt is in
s13/SUMMARY.md's next-session section).

## Previous session (S12 — GPE P1-c, the prizes; DONE AND VERIFIED LIVE)

**Outcome:** the rows R13 (Bridge-1 the Iran bridge) · R14 (the IMF
CB-demand Tier-1 tracker) · R16 (the affordances + the market-state
pill) · R17 (the #21 de-dup) landed, tested, deployed, and
live-verified. **R15 slipped to P2** (the M1(b) drop check: no WGC GDT
file, no owner notice — the fold record §0.2 rule; the wall's WGC CB
line stays until Tier-2 lands). Production was currena-api `49ae8ce7`
@ 100% (created 2026-11-18T18:51:04Z) + the gold-cb KV seed (asOf
2026-10 · 250 rolling points · the 10 buyers · reported world 35,003 t
/ 103 reporters — `GET /api/insights/gold-cb` serves it). The branch
`gold-elevation/p1c-prizes` is pushed with the session's commits.
Gates 9/9 GREEN (suite 15,290, +43). The Persian-copy manifest round 85
landed the session's 98 fa strings (8,032 → 8,130 entries; copy:audit
clean). The session summary + the S13 next-session prompt are
docs/specs/gold-page-elevation/s12/SUMMARY.md.

## Previous session (S11 — GPE P1-b, the explanation band; DONE AND VERIFIED LIVE)

**Outcome:** all six rows R07–R12 landed, tested, deployed, and
live-verified. Production is currena-api `23ce6b06` @ 100% (created
2026-11-18T14:31:20Z). The branch `gold-elevation/p1b-explanation-band`
(HEAD `6a3d55de`, 10 commits: M1 docs + R07–R12 + the manifest round +
the budget bump) is pushed. Gates 9/9 GREEN (suite 15,247, +28
positive-only). The Persian-copy manifest round 84 landed the wave's 57
fa strings (7997 → 8032 entries; copy:audit clean). The session summary
+ the S12 next-session prompt are
docs/specs/gold-page-elevation/s11/SUMMARY.md.

**The honest R07 note:** the Treasury-primary collect code is DEPLOYED
and verified in the Worker bundle, but the live KV snapshot predates
the deploy (generated 13:12 UTC) — the readings still carry FRED
provenance (as-of Nov 16). The first Treasury-primary rung fires
**04:10 UTC Nov 19**; the 10:10/20:10 sweeps correctly skip (healthy
status, under the 10-hour stale threshold). **The S12 M1 verifies the
flip** (S11-D4).

**Program counter: Session 11/18 · 7 remaining (S12–S18).** Next: S12 =
P1-c the prizes (R13 Bridge-1 the Iran bridge · R14 the IMF CB-demand
tracker · R15 the GDT stack (drop-dependent) · R16 the affordances +
market pill · R17 the #21 de-dup — the S12 prompt is in s11/SUMMARY.md's
next-session section).

## Current state (after the GPE S11 P1-b explanation-band session)

**The Gold Page Elevation (GPE) S11 P1-b explanation band is DELIVERED,
DEPLOYED + LIVE-VERIFIED. Production is now currena-api Version ID
`23ce6b06` (created 2026-11-18T14:31:20Z @ 100%, superseding the S10
P1-a deploy `f0844e59`). The code is committed + pushed to origin at the
branch `gold-elevation/p1b-explanation-band` (HEAD `6a3d55de`, off the
p1a tip `ec57261e`). Gates 9/9 GREEN (suite 15,247 — delta +28 from the
S10 close, positive-only). The session summary is
docs/specs/gold-page-elevation/s11/SUMMARY.md; the program plan is
docs/specs/gold-page-elevation/00-PROGRAM-PLAN.md.**

The six wave-1 rows shipped: the US yield family reads Treasury-direct
as PRIMARY with FRED as basis/fallback/cross-check (R07 — the deployed
swap; the first Treasury-primary rung fires 04:10 UTC Nov 19); the
outlook line speaks the conditions grammar ("Conditions outlook" + the
inline "this describes current conditions, not a forecast" — the 14
forecast-ish verdict sentences re-worded, both locales) (R08); the
licence wall states each blocked item's why + the owner's lever + the
one link-out to the public data-sources document (R09); every seat link
is a card-level #hash anchor with the name-match rule (R10); the F1
daily narrative "Why gold moved" renders the price fact + the five
driver families' states + raw deltas + the standing caveat (R11); the
F5 yield-decomposition card renders the four legs, the exact identity
(real + breakeven = nominal, the breakeven derived on matching as-ofs),
the moved block, the three named configurations + the 2022-gilt
exception, the Kim–Wright/ACM provenance, and the chain's two live
seats (R12). The Persian-copy manifest round 84 landed the 57 fa
strings; copy:audit clean. The GoldPage chunk budget bumped 82.5/21 →
89.5/22.5 (R12's binding education block, measured 88.41/21.91 — the
S11-D3 record; ~1.1 kB raw headroom for P1-c).

## The green baseline — the S10 P1-a record (2026-11-18)

- **Gates:** 9/9 GREEN (2m 50s). secret scan (clean — 8 patterns · 1053
  files) · typecheck (6 packages) · lint (0/0) · copy:audit (clean —
  manifest round 83, 7988 → 7997 entries) · narrator vocabulary (in
  sync, 193×2 + 56×2 — regenerated after the insights-copy change) ·
  narrator eval (50) · layer1 strict (11969/11969) · **full test suite
  15,219** (core 195 · scraper 67 · insights 1391 · markets 13 · api 414
  · web 13139) · build + bundle budget (entry 270.52/81.97; GoldPage
  73.85/19.11 under the new 75/19.5 ceiling — budget bumped 72/18.5 →
  75/19.5 with justification inline).
- **Suite delta:** **15,184 → 15,219 = +35** (positive-only: the R01–R06
  characterization tests — TrendChart, GoldPositions, GoldPage,
  GoldSeats, yoy-gap, series; nothing deleted).
- **Production:** currena-api Version ID **`f0844e59`** @ 100% (created
  2026-11-18T11:37:29Z). Deploy-lock re-checked FIRST (D-43: production
  was still `6ae72ba7` @ 100% — no drift). Wrangler FIRST attempt clean
  (no 10013 retry). The §21 portwatch window clear (Wednesday). The
  served entry hash `index-sQcXoEPe.js` MATCHES the dist build.
- **Live-verify matrix (all GREEN):** EN desktop — R01 the chart chip
  "5.2 years" (not "10 years"), R02 SGE "92 tonnes" / Swiss "228 tonnes",
  R03 "30-day change", R04 the 5 dark seats' why-lines, R06 #15 absent-
  count "4...", #26 footer `/about#privacy` + `/about#terms`, #27 hero
  spacing, F17 silver note · **fa/RTL desktop** — R02 «۹۲ تن» / «۲۲۸ تن»,
  R03 «تغییر ۳۰ روزه», R04 the FA why-lines («منبع داده انتشار را متوقف
  کرده (آخرین داده: شهریور ۱۴۰۵)» etc.), R06 #15 «۴ از داده‌های...»
  (Persian digit), F17 «عمقِ نقره یک انتخابِ آگاهانه است...», dir="rtl" ·
  **mobile 390×844** — R01 chip "5.2 years", R04 5 why-lines render, the
  layout holds · **R06 #23 fresh path** — data-prices-as-of="fresh" (the
  cached "last successful" qualifier is the outage-only case, verified
  via the test) · **zero console errors** on every surface exercised.

## The prior R-5 port record (2026-11-18, earlier — superseded by S10)


- **Gates:** 9/9 GREEN ×2 (run 1 on the working tree with all edits applied uncommitted: 2m 43s; commit `f66efa44` landed; run 2 on the clean tree with `git status` empty: 2m 46s — IDENTICAL results). secret scan · typecheck (6 packages) · lint (0/0) · copy:audit (clean — zero new copy keys) · narrator vocabulary (193×2 + 56×2 — UNCHANGED) · narrator eval (50) · layer1 strict (11969/11969) · **full test suite 15,184** (core 195 · scraper 67 · insights 1383 · markets 13 · api 414 · web 13,112) · build + bundle budget (entry 270.48/81.94 UNCHANGED; 10 destination-page chunks within budget; AsiaPage raw re-baselined 16.5→16.75 — +0.03 kB of opener plumbing, justified in scripts/check-bundle-budget.mjs).
- **Suite delta:** **15,165 → 15,184 = +19** (positive-only: 17 panel characterization tests + the UsaPage wiring test + the CommoditiesPage wiring test; nothing deleted). All 13,093 pre-existing web tests passed UNCHANGED before the new tests landed — the stretched-opener pattern is transparent to every characterization query.
- **Production:** currena-api Version ID **`6ae72ba7`** (`6ae72ba7-d32d-4fa2-88ee-b83546e50630`, created 2026-11-18T00:03:29Z, @ 100%). Deploy-lock re-checked FIRST (D-43: production was still `c0858d06` @ 100% — no drift). Wrangler FIRST attempt clean (no 10013 retry): 38 assets uploaded (106 content-hashed unchanged skipped), Worker Startup Time 39 ms. The deploy ran 00:03 UTC Wednesday — OUTSIDE the §21 portwatch window (Tuesday 11:00–14:00 UTC).
- **Live-verify matrix (all GREEN):** `/usa` — the fed-target card click opens the panel (role=dialog + aria-modal, the corpus name, the five F5 sections, the Layer-1 block, the chart svg, the rule line, the source footer; focus on the heading, body scroll locked; Escape closes + focus returns to the opener + scroll restored) · `/commodities` — the «More details» click opens the brent panel (the VERIFIED price-row title + the Layer-1 plainName + the changes section + the 52-week range + the chart; the §19.6 navigate-to-Global stopgap GONE) · **fa/RTL** — the Persian panel (نفت برنت + the Persian F5 sections + the chart + the Layer-1 block) · **mobile 390×844** — the /gold gold-silver context card opens the BOTTOM SHEET (full width, docked bottom, chart renders, the Persian heading + plainName) · `/world-markets` — the gpr-index risk card opens the panel with its chart · `/` — Global loads · **the §19.6 option-B redirect regression-checked** (`/insights?card=us10y` → `/usa`, title "آمریکا - Currena") · **zero console errors, zero page errors** on every surface exercised · the served entry hash `index-C4b9WhvK.js` MATCHES the dist build.

## The R-5 session record (what was done)

1. **Environment setup** (the §19.6 sandbox pattern): the repo re-cloned to `/home/z/currena`; pnpm@10.34.5; `pnpm install` (8.1s). Token verified (HTTP 200 — login `assadigit`).
2. **Baseline verification:** origin/main at the §19.6 close (`47b9a34`); production STILL `c0858d06` @ 100% (D-43 holds at session open AND re-checked before the deploy).
3. **The audit (in-session):** the retired DetailsPanel recovered from `ecc64a05^`; every dependency verified alive in the shared layer (HistoryChart · PriceDetails · layer1 · config helpers · fetchIndicatorHistory · the corpus · the insights-panel CSS); the eight §21-trio card surfaces enumerated (UsaTierCards 72 · EuropeTierCards · AsiaTierCards · AustraliaTierCards · CurrenciesTierCards · GoldContext · WorldRiskCards · the Commodities PriceTiles); the §19.6 in-file stopgap comment on CommoditiesTierCards pointed at this port by name.
4. **The spec (docs/page-division/07-R5-DETAILS-PANEL-PORT.md)** — committed + pushed FIRST (`1a072a55`): goal, scope (the eight surfaces), out of scope (R-7/R-8 unchanged, the Global hub navigates, the markets feeds have no panel), the decisions D-R5-1…D-R5-5 (later + D-R5-6 in BD-S33), the plan, the done criteria.
5. **The port (`f66efa44`, 21 files: 3 new + 18 modified):**
   - NEW `shared/components/IndicatorDetailsPanel.tsx` — the retired panel verbatim minus the pin (the five F5 sections, the rule line, CardFacts, the price-row sections, the status lines, Layer1Block, PanelHistory→HistoryChart, the source footer, the focus discipline).
   - NEW `CardDetailsOpener` (the panel module) — the stretched transparent `<button>` overlay (valid HTML, `aria-haspopup="dialog"`, the corpus `Details: <name>` label; the card DOM byte-identical).
   - NEW `shared/hooks/useIndicatorDetails.tsx` — `useIndicatorDetailsPanel(readings)` → `{ openCard, closeCard, panel }` (fail-closed on an absent reading).
   - WIRED the eight surfaces + their pages (each page: the hook call + `onOpenDetails={openCard}` + `{panel}` at the root — a three-line page diff).
   - The Commodities «more details» stopgap REPLACED by `openCard` (the legacy 2026-10-26c behaviour restored on the commodities home).
   - Tests: +19 (the panel characterization ×17 + the UsaPage wiring + the CommoditiesPage wiring).
   - Budget: the AsiaPage raw ceiling 16.5 → 16.75 (the justification comment in the script).
6. **Gates ×2 GREEN** (2m 43s / 2m 46s), suite 15,184 (+19).
7. **Commit + push** (`f66efa44`; the staged diff secret-scanned clean before the commit). Local HEAD == origin/main == `f66efa44`.
8. **Deploy + live verify** (the matrix above; the browser closed clean).

## Operational notes worth carrying

- **The stretched-opener pattern (D-R5-6)** is the house pattern for "whole card is the tap zone" over cards with real headings: a transparent `<button>` at `absolute inset-0 z-10` as the article's last child (the article carries `relative`). The card's DOM stays byte-identical — the characterization suites never noticed. Text selection inside such a card is blocked by the overlay (accepted for data cards; recorded in BD-S33 D3's revisit).
- **The panel's chunk topology:** the panel + HistoryChart + PriceDetails + the corpus ride the SHARED chunks every destination page already loads (`useInsightsCopy-*` etc.) — the per-page cost of the port is the opener button + the callback plumbing (the AsiaPage row is the measured evidence: +0.03 kB). The money page's entry graph is UNTOUCHED (the entry budget unchanged).
- **The `/api/insights/:id/history` endpoint** now has a page consumer again (the panel's chart + the tile sparklines + the price sections — one module-cached fetch, three consumers). No API change shipped.
- **The standing limits carry forward (AGENTS.md §11):** the §21 portwatch window (never run Tuesdays 11:00–14:00 UTC) + the deploy-lock re-check FIRST (D-43) + the wrangler 10013 retry rule + the `run`-required-under-pnpm-10 rule + the R5 no-renames constraint.

## Owner-side levers waiting (the GPE program's bequest — the full list is docs/specs/gold-page-elevation/s18/02-PROGRAM-CLOSURE-RECORD.md §3)

- **The WGC GDT quarterly drop → unlocks R15 (the CB-demand Tier-2 demand stack) + R23 (the ETF flows card)** — save the dated XLSX at `data/wgc/<…>` and tell the next session; the adapter path ships drop-ready; the wall's WGC CB line retires as it lands.
- **The WGC prices workbook drop → unlocks R25's drop-gated halves** (the Episode Explorer's price paths + the comparison rider) — save the dated file at `data/wgc/prices/<date>-<file-as-published>.xlsx`; ONE `gold-episodes-run` command lights the paths (the S15-shipped machinery).
- **The EODHD plan upgrade** — deepens the crosses' + the OHLC stored bases.
- **The Kalshi written authorization** — re-opens R28's Kalshi leg (the card honestly renders the Polymarket leg alone until then).
- **The CBI gerami pin** — the owner's browser on a cbi.ir /coin/ press-release page tightens one constant; the 0.90–0.92 g pure band renders honestly until then.
- **The WGC authorisation letter (info@gold.org)** — the owner's own parallel action (D9, non-blocking).
- **The two operational P0s** (CFTC Saturday gate + GPR re-fetch) — open on main, outside GPE; the small ops session remains the recommendation.
- **The fa-string triage queue** (copy:audit's unreviewed entries — the manifest carries them; the audit does not fail).
- **The credential rotation** — the session credentials were used again this session (used, never stored); rotate when convenient.

## Known state worth knowing

- **The Persian-copy manifest: 8,483 entries (round 90, the S17 wave — the last GPE round; copy:audit clean).**
- **The dist topology (post-S17, unchanged at S18 — docs-only):** entry 271.13/82.13 (within the 296/89.5 budget); the GoldPage lazy chunk 237.70/49.35 under the 240/50 ceiling (the program's final budget). Build deterministic.
- **The narrator vocabulary: 193×2 + 56×2 (UNCHANGED).**
- **Production: currena-api `65f7c0bb` @ 100% (S17's close, untouched by the S18 bookkeeping session).**

## The next-session pointer — THE GPE PROGRAM IS COMPLETE (nothing needed — the plan is complete)

**The 18-session Gold Page Elevation program is closed.** Every
feature wave delivered + deployed + live-verified (31 of the 33
queued rows; the two remaining rows are owner-drop-gated by the plan's
own fold rule); the research record stands as the never-rewritten
historical record (PR #48 open); the shared bookkeeping carried every
session; the AGENTS.md facts are at the post-program state. **No
next-session prompt exists because none is needed — the plan is
complete.** Whenever the owner wants to open any of the standing
levers above (the WGC drops first), a fresh session starts from this
HANDOFF + AGENTS.md + `docs/specs/gold-page-elevation/s18/`.
