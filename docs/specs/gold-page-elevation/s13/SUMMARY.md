# S13 — Session Summary (Gold Page Elevation)

**Session:** S13 of the Gold Page Elevation (GPE) program — the FOURTH
Phase-D implementation session: **P2, the interactive chart (wave 2, first
session)**. **Date:** 2026-11-18 ~21:1x UTC → 2026-11-19 ~01:2x UTC (one
context interruption — the session's second leg verified + closed the
first leg's landed work). **Branch:**
`gold-elevation/p2-chart-ta` (off the S12 close `2e22c428` — production
`49ae8ce7` was built from it; git `main` still sits at the R-5 close
`19131b0`). **Status: DONE AND VERIFIED LIVE** — production currena-api
`3b8a8c6a` @ 100% (created 2026-11-19T01:04:39Z; the redeploy carries
the R19 pivot-basis fix) + the gold-xau KV seed landed (360 final bars,
`fetchedAt 2026-11-19T00:00:59Z`).

The gate state at session start (verified, not assumed): the CP-C lock
COMPLETE; the Phase-D gate OPEN; P1-a/P1-b/P1-c DELIVERED + DEPLOYED +
LIVE-VERIFIED (`f0844e59` / `23ce6b06` / `49ae8ce7` + the gold-cb seed).

## The session's shape (one interruption, honestly recorded)

The session ran in two legs. **The first leg** (2026-11-18 21:18 →
~22:17 UTC) delivered M1 (the citation re-verification + the two
build-time checks, `daf8de47`), M2 (the R18 backend `97c64303` + the
four rows `46766c0c`), and M3's first half (the manifest round 86 + the
budget bump + gates, `2e38ace2`) — then ran the deploy sequence: the
`EODHD_API_TOKEN` secret (deployment `b34108a5`, 22:16:40Z) + the
wrangler deploy (production `62d38fa8` @ 100%, 22:17:00Z, first attempt
clean) + the KV seed via `gold-xau-run` (the landing lever; the same
`runGoldXauIngest` the rung runs) — and ran out of context BEFORE the
deploy commit, the live verification, and the close. **The second leg**
(this one, 2026-11-19 00:46 UTC →) verified rather than assumed: the
deployments API read (production = the expected S13 build — the served
entry `index-CP6lc85D.js` + the GoldPage chunk `GoldPage-BfK93Nwt.js`
150,666 B BYTE-IDENTICAL to the local dist), the secret list
(`EODHD_API_TOKEN` present), the route (`GET /api/insights/gold-ohlc`
serving the full seeded series), and gates re-run green in the session
(9/9, suite 15,326). **The live verification then found one real
defect** — the R19 daily-pivot off-by-one — which the second leg fixed
(`a012d544`), re-gated (9/9, suite 15,327), redeployed (`3b8a8c6a` @
100%), and re-verified before closing.

## What was delivered

**M1 — Citation re-verification + the two build-time checks** (commit
`daf8de47`; `s13/M1-CITATION-AND-CHECKS.md`). Every file path the rows
R18–R21 cite re-verified read-only against the branch HEAD — zero
material drift (the s6/03 §2 module map's addresses all hold; the R5
no-renames constraint governs — no moves, only NEW files + in-place
edits). The checks, honestly recorded: (a) **the R07 Treasury-rung
outcome — the rung had NOT fired at the session's start** (~7 h before
04:10 UTC Nov 19; the live readings still FRED-provenance) and **at the
close re-check (01:09 UTC Nov 19) it had STILL not fired** (~3 h early;
us10y 5.12 @ 2026-11-16 "FRED (DGS10)" + the family still FRED; the
status blob healthy, failedSources []) — **the carry extends to S14's
M1** (the S12-D4 pattern, one more session; nothing this session
shipped blocks or alters the flip — the deploys carry the same R07
code). (b) **the R15 drop-calendar re-check → no WGC GDT drop** (no
`data/wgc/` path, no owner notice) → **R15 stays pending** (the fold
record §0.2 rule; the wall's WGC CB line stays; R23/R25's data rides
the same calendar). The session's own probes: **the EODHD XAUUSD.FOREX
live probe — 361 rows, 2025-11-18 → 2026-11-18, the free-tier ONE-YEAR
depth CONFIRMED LIVE** (the provider's own trailing warning; the
day's Yahoo cross-check GC=F 3,728.8 — the spot/futures gap the C1
series-naming rule exists for) — the roadmap's "one-time 10y fetch" is
NOT available on this key; the row's second branch applies (S13-D1).
And the stored gold-usd history verified NOT usable as the TA basis
(a different series — C1 forbids mixing).

**M2 — the rows, exactly R18–R21 (R15 pending):**

- **R18 · F7 the interactive price chart** (S13-D2): `GoldPriceChart`
  replaces the gold chip's fixed-range `MetalTrendChart` (silver keeps
  its TrendPanel, OI-4). Pan (single-pointer drag) + zoom
  (wheel/pinch around the pointer) + the log-scale toggle + the
  unit-aware header (oz/gram with the 31.1035 g conversion disclosed +
  the series named at point of use per C1 + the EODHD link) + the D8
  50/200 DMA overlay toggles (both ON by default, fail-closed when the
  stored window lacks the history) + the window as a USER CONTROL
  (quarter/1y/ALL chips + pan/zoom; the All chip states the honest
  stored span — the #01 "10 years" mislabel dissolved by construction)
  + the hover/keyboard inspector (the TrendPanel accessibility pattern)
  + the honest loading/none states + the 44px floor on every control.
  The shared fetch layer `gold-xau.ts` (module-cached — ONE fetch
  serves the chart AND the TA band; localStorage last-good, the M-17
  paint). **The backend leg:** the zod contract `GoldXauOhlcSnapshotSchema`
  (strictly-ascending final bars) + the adapter
  `domains/gold/adapters/eodhd-xauusd.ts` (the markets client's
  URL/parse/token/kill-switch pattern; S13-D3 drops today's partial
  bar — the forex day wraps 22:00 UTC) + the store/job
  `domains/gold/xau-ohlc.ts` (`insights:gold-xau:v1`; the trailing
  3-day revision-tolerant re-fetch, revisions win on merge,
  write-if-changed; the REST adapter for the landing lever) + the rung4
  registration `gold-xau` (daily, budget 4 — the all-gates rung4 day
  49/50; the registry keeps gold-cb LAST per S12-D3) + the route
  `GET /api/insights/gold-ohlc` (one KV read, ETag + edge cache, the
  calm not-ready 503, the hidden-boards kill switch). **S13-D1: the
  api worker's rung4 venue** (the account's free 5-cron limit is full;
  the markets worker's worst-case day is budget-tight; the rung4
  arithmetic fits with margin) — the `EODHD_API_TOKEN` secret set at
  deploy time. **The depth posture (S13-D1):** the free tier's ~1-year
  ceiling is the honest basis; the daily appends grow it forward; the
  code treats the whole stored series as the basis (a plan upgrade
  simply deepens it).
- **R19 · F8 the minimal TA band** (Zone H, between the seats and the
  ratios; `#gold-ta`): `GoldTaLevels` + the pure engine
  `domains/gold/ta-levels.ts` — the four SMA reference rows (SMA
  20/50/100/200, each value named for its window) + the
  distance-from-200DMA decile sentence ALWAYS visible at 390 (the
  meter's own percentileOf over the stored basis, the current point
  excluded, **the basis window named at point of use** — "the stored 5
  months" today, self-widening) + the dated 50/200 cross events with
  what followed 20 sessions on (whipsaws included; fail-closed when the
  window cannot see one — honestly rendered today) + the classic
  daily/weekly pivots (the standard formulas ONLY; S1-S3 | PP |
  R1-R3, values right-aligned, the session date disclosed) + the C5
  honesty copy (descriptive reference, never a trading signal) + the
  390 collapse (the tables behind one tap; the header + decile
  sentence always visible). **The pivot-basis fix (S13-D4, found live
  at the verification):** the daily pivots originally read
  `series[n-2]` — one session stale for every visitor ("from the
  session of Nov 17" while the freshest final bar was Nov 18); the
  S13-D3 ingest invariant (today's partial bar is never stored) makes
  the LAST bar the previous completed session — the fix reads it, and
  the weekly pivots became now-aware (the Monday posture: the last
  bar's own week IS the previous completed week; the caller owns the
  clock, deterministic for every given now).
- **R20 · F4a the education on-ramp** (Zone D's third element, the
  collapsed accordion): `GoldOnRamp` — the five drivers (Kitco's five,
  the S7-D2 taxonomy), each closing LIVE at its lane (the count + lane
  word from the SAME goldBalance the hero reads, pinned byte-match by
  test) + the two closing notes (fuel-not-driver; the governance
  asymmetry) + the six-question FAQ tail, every close on CARD-LEVEL
  anchors (the honest degrades: driver 3's currency check → the
  gold-aud card, driver 5's ETF card → plain text until R23). The
  s7/02 approved drafts are the shipped wording.
- **R21 · F4b the one-liners + the Chain-7 physical grouping:** every
  context card gains its plain-meaning sentence (13 one-liners, gold-usd
  the hero excepted) + the «بازار فیزیکی» mini-header with the ONE
  shared sensor-not-verdict reading line under the three physical cards
  (the COT pair stays outside the subgroup; S7-D1; one coherent edit).

**M3 — the manifest round + gates + deploy + live verification + close:**

- **The Persian-copy manifest round 86** (commit `2e38ace2`): ONE round
  for the session's **93 fa strings** (R18's chart chrome 15 + R19's TA
  band 33 + R20's on-ramp 34 + R21's one-liners + the physical grouping
  15); manifest 8,130 → 8,223 entries; copy:audit clean; the round file
  `persian-copy-round-86-gpe-s13-p2.md` + the terminology entries
  (تلاقی، سطوح مرجع، سطوح پیوت، بازار فیزیکی، حسگر نه حکم، میانگین
  متحرک ساده، صدک از بازهٔ ذخیره‌شده، جلسه).
- **Gates 9/9 GREEN, re-run by the second leg after the fix** (2m 55s):
  secret scan · typecheck (6) · lint (0/0) · copy:audit (clean) ·
  narrator vocabulary · narrator eval · layer1 strict (11,969/11,969) ·
  **full suite 15,327** (+37 vs the S12 close: core 195 · scraper 69 ·
  insights 1,468 · markets 13 · api 419 · web 13,163) · build + budget.
  **The budget move (S13's own measured bump, as S12-D6 planned):** the
  GoldPage chunk measured 150.67/34.33 with the four wave-2 surfaces —
  bumped 116/27.5 → **152/34.5** (verified NOT duplication: each new
  module's markers appear exactly once; the dictionaries + the engine
  stay in their own chunks). The GB-S6 byte snapshot re-pinned (the
  conscious S13-D2 chart swap).
- **The deploy trail (honest, two legs):** the first leg set the
  `EODHD_API_TOKEN` secret + ran the wrangler deploy (production
  `62d38fa8` @ 100%, 22:17:00Z, first attempt clean) + seeded
  `insights:gold-xau:v1` via the `gold-xau-run` landing lever (360
  final bars 2025-11-19 → 2026-11-18, last close 3,792.59, the EODHD
  venue named in the payload). The second leg verified it (the D-43
  read FIRST — production = the expected S13 build, the chunk
  BYTE-IDENTICAL; the portwatch window clear Thursday), then **the
  pivot fix redeployed: production `3b8a8c6a` @ 100% (01:04:39Z, first
  attempt clean)** — the served entry `index-BryTVkMk.js` + the
  GoldPage chunk `GoldPage-CUNdjhOq.js` (150,677 B) byte-verified
  against the dist. Rollback: `62d38fa8` remains on the version list.
- **Live-verify per AGENTS.md §9 (all GREEN; the screenshots are
  `s13/verify-*.png`, seven):**
  - **EN desktop (1440)** — the chart: the unit-aware header + the
    control toggles all exercised live (Ounce/Gram — the gram y-axis
    «121.9…150.5» per g; Log; the DMA toggles — aria-pressed verified,
    the overlay paths 2→3 with 50DMA re-enabled, both ON by default;
    the window chips — Quarter/1y/All, the default window's honest
    "8 months" delta word computed from the data) + **wheel zoom
    verified** (the axis narrowed around the pointer) + **drag pan
    verified** (the axis moved to earlier data, the readout updated)
    + the hover inspector («3,850 per oz · O 3,863 · H 3,891 · L
    3,837 · Nov 17, 2026») + the keyboard inspector (focusable plot,
    the arrows walk) + the affordance line. Silver's chip keeps its
    fixed-range panel.
  - **EN desktop — the TA band:** every number hand-checked against
    the live series (the four SMAs 3,952.7/4,051.3/4,225.9/4,255.7; the
    decile −10.9% = the 25th percentile of the stored 5 months; "No
    50/200 crossover in the stored window yet" verified TRUE by
    independent computation over the live data) + the classic daily
    pivots NOW "from the session of Nov 18, 2026" with every level
    hand-checked (PP 3,809.23 · S1 3,769.0 · R1 3,832.8 · S2 3,745.4 ·
    R2 3,873.0 · S3 3,705.2 · R3 3,896.6) + the weekly "from the
    session of Nov 9, 2026" + the honesty line.
  - **EN desktop — the on-ramp:** the five drivers each closing at its
    lane ("7 of the 37 factors", "10 of the 37" — byte-matching the
    hero) + the FAQ tail. **R21:** the 13 one-liners + "The physical
    market" mini-header with the ONE shared reading line, the COT pair
    outside the subgroup.
  - **fa/RTL desktop** — dir=rtl · «OHLC روزانهٔ XAUUSD (نقطه‌ای) ·
    EODHD» · «داده‌های ۲۷ آبان ۱۴۰۵» (Jalali) · «انس/گرم · لگاریتمی ·
    میانگین ۵۰/۲۰۰ روزه» · the Persian-digit axes («۵٬۱۹۷ ۴٬۴۹۵
    ۳٬۷۹۳») · «سه‌ماهه یک سال همه · ۱ سال» · «−۲۵٫۳٪ ۸ ماه» · «سطوح
    مرجع» + «صدک ۲۵ از بازهٔ ذخیره‌شدهٔ ۵ ماه» + the SMA rows in
    Persian digits + «تلاقی ۵۰ و ۲۰۰ روزه» + «پیوت‌های کلاسیک
    روزانه/هفتگی» «از جلسهٔ ۱۴۰۵/۰۸/۲۷» · «چه چیزی طلا را حرکت
    می‌دهد» · «بازار فیزیکی» + the shared reading line in Persian.
  - **mobile 390×844 (fa, fresh load)** — NO horizontal overflow
    (390 === 390) · the TA band collapsed behind one tap
    (aria-expanded false; the tables absent from the DOM; the header +
    the decile sentence ALWAYS visible) · the tables expand on tap ·
    the chart controls ALL at the 44px floor.
  - **ZERO console messages, ZERO page errors** across every surface
    exercised (both locales, three viewports, all interactions).

## Key findings in one paragraph

The chart wave is live: the gold page's price panel is now a real
interactive chart (pan/zoom/log, the window a user control, the honest
stored span named everywhere — the #01 mislabel class dissolved by
construction) fed by the page's own dedicated EODHD XAUUSD daily-OHLC
leg (a one-key KV series, revision-tolerant, seeded at ~1 year by the
free tier and growing forward daily); the TA band under it speaks the
TGJU vocabulary with the house honesty (the SMA reference rows, the
decile with its basis named, the dated crossovers, the classic pivots
— every number reproducible and every one hand-checked at the
verification); the education on-ramp teaches the five drivers each
closing at its own live lane; and every ratio card now carries its
plain meaning. The honest notes: the free tier's one-year depth is
the stored basis (disclosed at point of use, self-widening), the
50/200 crossover section honestly reports none-in-window (the
computable range is 161 bars), the R07 Treasury flip fires 04:10 UTC
Nov 19 — three hours after this session's close, so the verification
carries to S14 — and R15 still waits on the owner's WGC GDT drop.

## Decisions taken in S13 (for the program record; DECISIONS.md at reconciliation)

- **S13-D1** — the OHLC ingest venue + the depth posture: the api
  worker's rung4 registry (04:35 UTC; the cb-demand/tic twin; the
  free-5-cron limit + the markets worker's budget-tight worst case +
  the 49/50 arithmetic) with `EODHD_API_TOKEN` as a new secret; the
  free-tier ~1-year ceiling disclosed at point of use, the code
  treating the whole stored series as the basis (a plan upgrade
  deepens it via the trailing re-fetch).
- **S13-D2** — the F7 chart replaces the gold chip's fixed-range panel
  (the D6-A "widening rides F7" made literal; silver keeps its panel;
  the R01 record's stale comment cleared).
- **S13-D3** — the OHLC row-dating guard: only bars dated ≤ yesterday
  UTC are accepted (final bars only; the forex day wraps 22:00 UTC);
  the trailing 3-day re-fetch covers revisions.
- **S13-D4** — the pivot-basis correction (found live at the
  verification): the daily pivots read the LAST final bar (the S13-D3
  invariant makes it "yesterday" for every visitor — the original
  `series[n-2]` was one session stale against the s1/13 §3 "previous
  session's OHLC" convention); the weekly pivots became now-aware (an
  optional nowMs — the caller owns the clock — fixing the
  Monday-morning posture where the last bar's own week is the previous
  completed week). The tests re-pinned + the Monday-posture pin added.

## Open questions for the owner

None blocking. The standing items carry: (1) **the WGC GDT data drop**
(R15 — tell the next session when the quarterly release arrives; the
wall's CB line retires with it; R23/R25's data rides the same
calendar); (2) the WGC authorisation letter (D9 locked: send — your
parallel action, non-blocking); (3) the two operational P0s (CFTC +
GPR) remain open on main, outside GPE; (4) the R07 flip — no action
needed; the rung fires 04:10 UTC Nov 19 and S14's M1 verifies.

## Done-criteria check (this session)

- [x] The two M1 checks performed and recorded (the R07 rung honestly
  still pending at BOTH the start AND the close re-check — carries to
  S14's M1; R15 stays pending — no drop).
- [x] The rows landed (R18, R19, R20, R21 — R15 conditional on its
  drop, which did not arrive), tested, and live-verified (one defect
  found at the live verification — the R19 pivot basis — fixed,
  re-gated, redeployed, and re-verified the same session).
- [x] The Persian-copy manifest round landed with copy:audit green
  (round 86; 93 fa strings; manifest 8,130 → 8,223; clean).
- [x] pnpm gates green (9/9 re-run by the closing leg after the fix;
  suite 15,327, +37).
- [x] Deployed per docs/DEPLOY.md and live-verified (desktop + mobile
  + RTL both locales; production `3b8a8c6a` @ 100% + the gold-xau KV
  seed; the deploy-lock re-checked FIRST; both deploy attempts clean —
  no 10013).
- [x] The session summary + the next-session prompt written (this doc
  + the S14 prompt below).
- [x] Everything committed and pushed (branch
  `gold-elevation/p2-chart-ta`; this session's commits: the M1 docs ·
  the R18 backend · the four rows · the manifest round + the budget
  bump · the pivot fix · the deploy + verification · the close).

## Known problems carried forward (cite, do not re-litigate)

- **R07's first Treasury-primary rung** fires 04:10 UTC Nov 19 —
  S14's M1 verifies the flip (the carry recorded at S12-D4, S13's M1
  §2, and this close's re-check).
- **R15 / the WGC GDT drop** — still pending; the wall's WGC CB line
  stays; the ETF/prices drops (R23/R25) ride the same calendar.
- **The EODHD free-tier depth** — the stored OHLC basis is ~1 year
  (disclosed at point of use; self-widens daily; a plan upgrade
  deepens it via the trailing re-fetch).
- **The two operational P0s** (CFTC Saturday gate; GPR re-fetch) —
  open on main, outside GPE; the why-lines render their state
  honestly. The Kalshi fallback re-attempt rides R28 (P3).
- **The CBI gerami pin** — the default band (0.90–0.92 g pure) stands;
  a further pin rides Bridge-2 (R30).
- **The AGENTS.md drift items** (GPE-S2-28/29) — end-of-program
  reconciliation only.

## Next-session prompt (S14 — P3, the Supporting tier's first session)

```
Read AGENTS.md in the repo root first and follow it for the whole session.

You are running Session S14 of the Gold Page Elevation (GPE) program —
the FIFTH Phase-D implementation session: P3, the Supporting tier (wave
3, first session). Gate state at this session's start: the CP-C lock
is COMPLETE (all twelve owner decisions locked as recommended —
s9/CP-C-RECORD.md §1 with its S9b + S9c addenda); the Phase-D gate is
OPEN; P1-a DELIVERED + DEPLOYED + LIVE-VERIFIED (production
f0844e59 — the S10 rows R01–R06); P1-b DELIVERED + DEPLOYED +
LIVE-VERIFIED (production 23ce6b06 — the S11 rows R07–R12;
docs/specs/gold-page-elevation/s11/SUMMARY.md); P1-c DELIVERED +
DEPLOYED + LIVE-VERIFIED (production 49ae8ce7 @ 100% + the gold-cb KV
seed — the S12 rows R13 + R14 + R16 + R17, R15 slipped on its drop
calendar; docs/specs/gold-page-elevation/s12/SUMMARY.md); P2 DELIVERED +
DEPLOYED + LIVE-VERIFIED (production 3b8a8c6a @ 100% + the gold-xau KV
seed — the S13 rows R18 + R19 + R20 + R21, the interactive chart + the
TA band + the on-ramp + the one-liners; R15 still pending on its drop;
docs/specs/gold-page-elevation/s13/SUMMARY.md).

Read, in order: AGENTS.md, docs/specs/gold-page-elevation/
00-PROGRAM-PLAN.md (the program plan), docs/specs/gold-page-elevation/
s9/CP-C-RECORD.md (§1 the locked decisions; §2 the locked queue), docs/
specs/gold-page-elevation/s8/01-RECOMMENDATION-TABLE.md §4 (rows
R22–R30 — the P3 scope; this session takes R22 + R24 + R26 + R27,
below), docs/specs/gold-page-elevation/s8/02-DATA-SOURCE-MAP.md (the
data-source map; the LBMA + EODHD-crosses rows), and docs/specs/
gold-page-elevation/s13/SUMMARY.md (the predecessor session, this
one).

Working mode (the repo's normal discipline): a fresh feature branch off
the S13 close (gold-elevation/p2-chart-ta at HEAD — production 3b8a8c6a
is built from it; git main still sits at the R-5 close 19131b0) named
gold-elevation/p3-supporting; small verified steps; commit + push after
each milestone; the shared bookkeeping files (docs/HANDOFF.md,
CHANGELOG.md, docs/DECISIONS.md) follow the repo's normal rules for
this session's own changes — but do NOT bulk-copy the GPE research
decision history into them (that lands in the one end-of-program
reconciliation commit with the owner). First step of the session:
RE-VERIFY every file path the rows below cite against the live tree
(the citation-re-verification discipline — the R5 no-renames constraint
and the s6/03 §2 module map govern).

M1 — The build-time checks, before any row:
(a) The R07 Treasury-rung outcome (carried from S12-D4 THROUGH S13's
close — the honest clock: the rung fired 04:10 UTC Nov 19, three hours
after S13's close; S13's close re-check at 01:09 UTC found the live
readings still FRED-provenance): NOW the clock has passed — verify the
live readings flipped (the /gold yield legs + the /usa cards: the
source lines name U.S. Treasury, the as-of is the freshest date; if
the rung recorded a Treasury fetch failure, the FRED fallback carried
the day — record which, honestly; check the status blob).
(b) The WGC drop-calendar re-check: has the owner's WGC GDT quarterly
data drop arrived (the private data/wgc/ path or the owner's message)?
If yes → R15 SHIPS THIS SESSION (the code waits on the file; the
wall's WGC CB line retires as it lands); if no → R15 stays pending
(record; the rest of P3 proceeds — R23/R25's data rides the same
calendar).

M2 — The rows, exactly R22 + R24 + R26 + R27 (s8/01 §4; the locked
modes from the CP-C record §1), plus R15 if its drop arrived:
- R22 · F11 the correlation companion — the mandated Zone K design
  (s7/01 §3 in full): the dual-axis gold-vs-real-yield chart + the
  52-week rolling-correlation strip + the dated 2022 «چرخش خریدار»
  annotation linking the F6 episode and the Zone K tracker + the
  methodology footer. Rides the R18 OHLC leg + the existing 10y real
  yield (Treasury-direct primary / DFII10) — zero new data; the
  pre-registered windows (Friday closes, 52-week, levels, trailing-10y
  — S7-D7) are binding; the scatter stays rejected; fail-closed when
  either series is stale. Modules: GoldCorrelation.tsx + pure
  domains/gold/correlation.ts.
- R24 · F22 the London vault + clearing cards — the two LBMA XLSX
  workbooks (cdn.lbma.org.uk, free, monthly T+1, Worker-egress 200
  pre-verified; the 124/360-month backfills on day one): the vault
  stock card + the clearing volumes companion, Zone K riders
  (collapsed headers + top-line at 390), "Source: LBMA" attribution
  with the four-field disclosure block. Modules: GoldLondonVault.tsx +
  the lbma-vault.ts / lbma-clearing.ts adapters (deterministic parse,
  fail-closed on shape).
- R26 · F10 the multi-currency gold grid — gold in EUR/JPY/GBP/CNY/AUD
  via EODHD XAU<CCY>.FOREX crosses on the owner's existing plan: each
  cross's own 10-year decile flag + the KGX-style validation sentence
  (rises in USD and others = genuine demand; USD-only = the dollar
  story). NOTE the S13-D1 lesson: the free tier's one-year depth is
  what it is — the decile basis must be the STORED basis with the
  window named at point of use (the honest posture), or the plan
  upgrade path disclosed. Zone I compact sub-card; module:
  GoldCurrencyGrid.tsx + pure domains/gold/xau-crosses.ts.
- R27 · F14 the COT percentile bands + crowd gauge — the 10-year
  percentile bands on both COT cards + the crowd-gauge flag (position +
  band, never direction; the days–weeks horizon label always renders);
  zero new data (percentile10y over the existing CFTC series); the
  convention decision stands [default: the existing non-commercial
  share-of-OI, named at point of use per C1/C7]; the Saturday-gate P0
  stays with its why-lines. Zone J compact band chips, no new rows at
  390.
- R15 · F2b (ONLY if the drop arrived): the GDT quarterly demand stack
  beside the Tier-1 tracker + the four-field WGC disclosure block +
  the verbatim attribution per C6; the wall's WGC CB line RETIRES as it
  lands (update the R09 wall + the manifest).

M3 — The Persian-copy manifest round + the gates + deploy + live
verification + the close (the same discipline as S10–S13 M3): ONE
manifest round covering this session's FA strings; pnpm gates green;
deploy per docs/DEPLOY.md (the portwatch window — check the day; the
D-43 deploy-lock re-check; the wrangler 10013 retry rule); live-verify
per AGENTS.md §9 (desktop + mobile + RTL both locales); close per
AGENTS.md §10 (the S14 summary + the S15 next-session prompt + the
TLDR with the program counter).

Scope guard: EXACTLY R22 + R24 + R26 + R27 (+ R15 if its drop
arrived), nothing more — no drive-by refactors, no R23/R25/R28+ rows
(they ride the drop calendar, the Kalshi wording read, and the S15+
sessions; no roadmap edits — the queue is locked). Known context to
carry — cite, do not re-litigate: R07's Treasury-primary posture (the
M1(a) outcome this session finally verifies); the two operational P0s
(CFTC + GPR — open on main, outside GPE; the why-lines render their
state honestly; the Kalshi fallback re-attempt rides R28); S4-D1..D5;
S5-D1..D5; S6-D1..D8; S7-D1..D8; S8-D1..D7; the twelve locked
decisions D1–D12; S10-D1..D4; S11-D1..D4; S12-D1..D6; S13-D1..D4 (the
rung4 venue + the free-tier depth posture; the chart swap; the
row-dating guard; the pivot-basis correction — the daily pivots read
the LAST final bar, the weekly is now-aware); the hard gates (R01
before R18/R19 — SATISFIED; Bridge-1/R13 before Bridge-2/R30 —
SATISFIED at S12); the WGC letter = the owner's parallel action (D9
locked: send; non-blocking — R15's calendar rides it); the CBI gerami
default band (0.90–0.92 g pure until a further pin at R30); the
EODHD free-tier one-year depth (S13-D1: the honest stored-basis
posture, self-widening).

Done-criteria: the two M1 checks performed and recorded; the rows
landed (R15 conditional on its drop), tested, and live-verified; the
Persian-copy manifest round landed with copy:audit green; pnpm gates
green; deployed per docs/DEPLOY.md and live-verified (desktop + mobile
+ RTL both locales); the session summary + the next-session prompt
written; everything committed and pushed. Use AGENTS.md §9's status
words strictly.
```

## TLDR (per AGENTS.md §10)

```
## TLDR
Status: Done and verified live
Goal of this session: S13 P2 the interactive chart — implement rows
  R18–R21 of the Gold Page Elevation program on https://currena.ir/gold
  (R15 still waits on the WGC quarterly data drop, recorded).
Milestones: ✅ M1 the two build-time checks (the R07 rung honestly
  pending at both the start and the close re-check — the clock was
  ~7h/~3h early; the carry rides S14; R15 no drop) · ✅ M2 R18 + R19 +
  R20 + R21 · ✅ M3 manifest round 86 + gates 9/9 + deploy + the KV
  seed + live-verify + close (one honest interruption: the first leg
  landed the code + the deploy + the seed, the second leg verified it
  all, found and fixed one real defect, and closed).
What changed (plain words):
  - THE INTERACTIVE CHART is live: the gold price panel is now a real
    chart — drag to pan, wheel/pinch to zoom, a log-scale toggle, ounce
    and gram units, the 50/200-day-average overlays, and the window as
    YOUR control — fed by the page's own dedicated daily price series
    (about one year deep on the current data plan, stated honestly on
    the chart) (R18).
  - THE REFERENCE LEVELS band is live under the seats: the four
    standard moving averages, how far price sits from the 200-day (a
    percentile of the stored history), the dated 50/200 crossovers
    when the window can see them, and the classic daily + weekly
    pivot levels in the TGJU vocabulary — every number reproducible,
    every level labeled "descriptive reference, never a trading
    signal" (R19).
  - THE EDUCATION ON-RAMP is live: "What moves gold" — the five
    drivers, each measured on this page by its own gauge and closing
    at its own lane, plus the two honesty notes and the FAQ (R20).
  - EVERY RATIO CARD NOW EXPLAINS ITSELF in one plain sentence, and
    the three physical-market cards (SGE, Swiss, Shanghai) share one
    "physical market" reading line — a sensor, not a verdict (R21).
Where it is now: pushed to branch gold-elevation/p2-chart-ta; live at
  https://currena.ir/gold (production currena-api 3b8a8c6a @ 100% +
  the gold-xau price series seeded in KV the same night).
What I checked: gates 9/9 GREEN re-run after the fix (suite 15,327,
  +37); copy:audit clean (manifest round 86 — 93 fa strings);
  live-verified on EN desktop + FA/RTL desktop + mobile 390×844 — the
  chart's pan/zoom/log/units/averages/window/keyboard all exercised
  live, every TA number hand-checked against the live series, the
  on-ramp + one-liners + physical grouping rendered in both locales,
  zero console errors. The verification found one real defect — the
  daily pivots read one session stale — fixed, re-tested, redeployed,
  and re-verified the same session.
Decisions made: S13-D1 the OHLC leg's venue (the api worker's rung4)
  + the free-tier depth posture; S13-D2 the chart swap (the gold chip's
  fixed panel retired); S13-D3 the final-bar-only ingest guard;
  S13-D4 the pivot-basis correction (found live: daily pivots read the
  LAST final bar; weekly now-aware). Details in docs/DECISIONS.md at
  the end-of-program reconciliation.
Needs your attention: (1) the WGC GDT data drop (R15) — when the
  quarterly release arrives, tell the next session; the wall's CB line
  retires with it. (2) The WGC authorisation letter (D9, your parallel
  action) — non-blocking. (3) The R07 Treasury flip fires 04:10 UTC
  Nov 19 — nothing needed; the next session verifies. (4) The EODHD
  free plan stores ~1 year of price history (honest on the chart);
  a plan upgrade would deepen it — your call, no action needed.
Next session: the S14 P3 prompt is below (the Supporting tier's first
  session: the correlation companion + the London vault/clearing
  cards + the currency grid + the COT bands; R15 if the drop arrives).
  Program counter: Session 13/18 · 5 remaining.
```

**Credentials:** used only for the clone (read-only), the pushes, the
Cloudflare deploy + deployments API + the secret set + the KV seed,
and the live verification reads. Not stored in any tracked file. No
secret committed. Rotate the GitHub + Cloudflare + EODHD tokens at
your discretion per the standing §7 reminder.
