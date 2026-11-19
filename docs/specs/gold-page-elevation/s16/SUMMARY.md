# S16 — Session Summary (Gold Page Elevation)

**Session:** S16 of the Gold Page Elevation (GPE) program — the SEVENTH
Phase-D implementation session: **P3, the Supporting tier (wave 3, third
and FINAL session of the wave)**. **Date:** 2026-11-19 (~15:2x → ~16:5x
UTC). **Branch:** `gold-elevation/p3-bridge2` (off the S15 close
`1a4b35d1`; production at the session's start `83359c39`; at its close
**`ea45d06c` @ 100%**). **Scope (delivered):** R30 (F3b Bridge-2) +
the CBI gerami pin attempt — exactly as the S16 prompt scoped. R15/R23
+ the prices workbook stayed pending (no WGC drop — the sixth
consecutive session for R15; the fold record §0.2 rule). **P3 IS NOW
COMPLETE: every queued P3 row (R22–R30) is delivered + deployed +
live-verified across S14–S16.**

## What was delivered — R30 · F3b Bridge-2, the حباب premium history

**The data plane (backend):**
- **The one-time TGJU profile-history backfill** — the s4/03 §1e
  verified route, re-verified live at M1 and EXTENDED to the
  profile page's own "full history list" route (`profile/<slug>/history`):
  30 daily rows per leg (~6 weeks), each row carrying BOTH calendars
  (the Gregorian column authoritative — no Jalali→Gregorian conversion
  anywhere), the 8-column shape
  (open/low/high/close/Δ/Δ%/میلادی/شمسی). The parser:
  `packages/scraper/src/tgju-history.ts` (fail-closed on shape — a
  typed error on any upstream layout change; the four live-captured
  fixtures `tgju-history-{sekee,sekeb,ons,price_dollar_rl}.html`).
  NO deeper pagination exists (probed: `?page=2` serves the identical
  page, `/history/2` redirects onto it, no AJAX offset endpoint).
- **The premium-history engine** — `packages/insights/src/domains/gold/
  premium-history.ts`: the inner join over the four legs' dates (only
  days ALL FOUR carry a row — Tehran Mon–Thu, the two markets'
  overlap; 24 common days at launch), the premium COMPUTED from the
  legs' own closes (never scraped as a claim — s1/11 §6), the merge
  upsert (a live row overwrites a backfill row, never the reverse),
  the R19-posture deciles (min base 30, the current point excluded,
  the basis window named), and the EXACT identity-arithmetic
  attribution strip
  (Δln(coin) = Δln(ounce) + Δln(USD/IRR) + Δln(1+premium) — fails
  closed on any non-zero residual). The launch backfill reconciles
  the specs' own recorded values EXACTLY: the 2026-11-16 row carries
  dollar 268,705 toman + Emami 250,555,000 toman (the s1/11 §5 probe
  values) → premium +2.48%.
- **The forward accumulation** — the 20:33 UTC = 00:03 Tehran daily
  rung (the PRICES_CRON_MINUTE pattern, NO new cron trigger — the
  account's 5-cron limit stays full; the minute clear of every other
  rung): reads the ladder's own snapshot (the bridge board's own
  plane, the fresh-window cache — no extra scrape when warm), computes
  the day row over the SAME `coinPremium()` computation the board
  renders (all instruments the snapshot carries), upserts
  write-if-changed. A missing or >24 h-old snapshot writes NOTHING
  (the last-good discipline — an honest gap, never a stale quote under
  today's date).
- **The ONE-key store** `insights:gold-premium-history:v1` (the
  gold-lbma twin: the KV store + the REST twin) + the wire contracts
  in core (`GoldPremiumHistorySnapshotSchema` — the two provenances
  with the honesty line rendered at point of use) + the
  `/api/insights/gold-premium` literal-path route + the
  composition-root plumbing + the `gold-premium-run` manual runner
  (the live-row seed + the one-time `--backfill` mode, the four pages
  SEQUENTIAL — the off-hours discipline).

**The surface (frontend):** `GoldPremiumHistory.tsx` — the Zone F
extension (the same band, below the bridge board — s1/11 §8's phase 2:
the same zone, later wave, without moving it; the #gold-zone-f anchor
untouched on the bridge card). The three blocks:
1. **The day-move attribution strip** (always visible — the 390
   headline): today's coin move decomposed into the ounce, the dollar
   and the premium, each factor its own signed % move, the
   multiplicative identity printed VERBATIM at point of use —
   «اتحادِ دقیق: Δln(سکه) = Δln(انس) + Δln(دلار) + Δln(۱+حباب)؛ سه
   عامل در حرکت سکه ضرب می‌شوند، نه جمع. تفکیک حسابی است، نه برآورد
   آماری (رگرسیون)» — NEVER GRAM-style regression, the s7/01 §8
   binding copy. The base observation = the last stored day strictly
   before today's Tehran day; the current = the LIVE snapshot (the
   board's own computation — no cross-source skew).
2. **The premium history chart** (collapsed at 390, expanded on
   desktop — the GoldCorrelation pattern): both coins' premium-%
   series, the melt (0%) reference line, and the BACKFILL/LIVE
   BOUNDARY marker («آغاز محاسبهٔ زنده») — the honesty line rendered
   ON the chart.
3. **The premium deciles** — the page's statistical identity applied
   to حباب: each coin's decile position over its own stored basis,
   the honest sub-30 waiting line at launch («صدک با رسیدن به ۳۰ روز
   روشن می‌شود و با رشد سری دقیق‌تر می‌شود»), the band
   (min/p10/median/p90/max) once the base lights.

Plus: the `gold-premium.ts` web client (the gold-lbma twin), the EN/FA
dictionary additions (18 keys), the per-block degradation (no live
snapshot → the strip waits while the chart renders; no store → the
card's honest unavailable line).

## The CBI gerami pin attempt (s8/02 §2b — the band stands)

Three attempts: the CBI 5953 page (200 — carries the Bahar 8.136 g ×
900 spec, no gerami figure), the `/coin/` paths (the WAF block
«درخواست رد شد» — the same block three sessions running), and a
different egress (a web search): third-party retail sites corroborate
«وزن کل ۱٫۰۱۰ گرم · طلای خالص ۰٫۹۰۹ گرم · عیار ۹۰۰» — the recorded
band's first candidate reading. **Third-party corroboration is not the
CBI primary — the band 0.90–0.92 g pure stands** (the constants'
0.91 midpoint unchanged; the pin stays an owner-side lever). The full
record: `M1-CITATION-AND-CHECKS.md` §3.

## The manifest, the budget, the gates

- **The Persian-copy manifest round 89** — the session's 22 fa entries
  (18 premium-card strings + the 4 parser-matcher technicals on the
  round-2 `technical.tgju.dayHighLabel` precedent); manifest
  8,417 → **8,439 entries**; copy:audit clean; the reference doc
  `docs/localization/persian-copy-round-89-gpe-s16-p3.md`; the
  terminology additions (نوار تفکیک حرکت روز · اتحادِ دقیق · مِلت ·
  خط صداقت).
- **The budget move:** the GoldPage chunk measured **216.67/45.35** —
  bumped 210/45.5 → **218/46** (verified NOT duplication: the
  component + client each appear exactly once in the GoldPage chunk;
  the pure engines ride the shared insights chunk — the S15 posture).
- **Gates 9/9 GREEN** (2m 56s; lint 0/0 — the session's own unused-var
  cleared same-change; the two pre-existing react-hooks/purity
  warnings in S13/S14 files remain warnings, not errors): secret scan
  clean · typecheck 6 · copy:audit clean (round 89) · narrator
  vocabulary in sync · narrator eval 50 · layer1 strict 11,969/11,969
  · **the full suite 15,510** (+48 from S15's 15,462: the insights 25
  engine + the scraper 9 parser + the api 8 route/cron + the web 6
  component tests; nothing deleted) · build + budget green.

## Deploy + the KV seed (verified live)

The D-43 deploy-lock re-checked FIRST (the deployments API): the
newest deployment was still S15's `83359c39` @ 100% (created
06:10:56Z) — **no drift**. The §21 portwatch window clear (Thursday).
Wrangler first attempt clean (no 10013 retry): **production
`ea45d06c` @ 100%**. The landing lever ran immediately after:
`gold-premium-run --backfill` fetched the four pages live (30 rows
each, sequential) and wrote the 24-day reconstructed series; then
`gold-premium-run` seeded the live 2026-11-19 row (all 8 coins — the
provisional day row tonight's 00:03-Tehran rung finalizes). The smoke:
`/api/health` 200 · `/api/insights/gold-premium` 200 (25 days, the
backfill→live boundary exact: backfill 2026-10-15 → 2026-11-18, live
2026-11-19, the Emami premium 7.33% at the backfill close → 6.78%
live) · the sibling routes all 200.

## Live-verify matrix (13/13 PASS; four screenshots, s16/verify-*.png)

- **EN desktop 1440:** the strip live — "Today vs Nov 18, 2026: the
  Emami coin −0.5% — ounce −1.3%, dollar +1.4%, premium −0.5%" (the
  exact identity working end-to-end against the real live snapshot) ·
  the boundary marker renders («live compute begins») · the chart
  carries 25 points · the decile waiting lines (24-day base).
- **fa/RTL desktop:** dir="rtl" · «امروز نسبت به ۱۴۰۵/۰۸/۲۷: سکه
  امامی −۰٫۵%؛ انس −۱٫۳%، دلار +۱٫۴%، حباب −۰٫۵%» · the formula
  verbatim in fa · the Jalali dates + Persian digits throughout ·
  «تاریخچهٔ حباب».
- **fa mobile 390×844 fresh load:** no horizontal overflow (390 ==
  390, before and after expanding) · collapsed by default (the 390
  rule) · expands on tap · the boundary label «آغاز محاسبهٔ زنده» +
  the melt label «مِلت» on the chart + the decile line all render.
- **Zero console/page errors on every surface exercised** + the
  10-route sibling smoke all 200.

## Key findings in one paragraph

The verified backfill route turned out to be richer than the spec
record assumed: the profile pages' own "full history list" route
serves 30 daily rows with BOTH calendars printed per row (the
Gregorian column is authoritative — the calendar-conversion problem
the s1/11 §6 sketch feared simply does not exist), and the
reconstructed series reconciles the research specs' own recorded
probe values exactly (the strongest possible provenance check). The
trading-day geometry is now documented honestly: the four legs
inner-join to Tehran Mon–Thu only (the Tehran market rests Fri–Sat,
the global market rests the Tehran Sat–Sun) — the 24-day launch basis
is the two markets' overlap, named at point of use. And the
attribution strip's first live reading told the story it was built
for: on a day the ounce fell 3.1% while the coin held, the strip
shows the premium absorbing the move — the KGX question ("did the
coin move because of the ounce, the dollar, or the premium?")
answered with exact arithmetic, disclosed on the card.

## Decisions taken in S16 (for the program record; DECISIONS.md at reconciliation)

- **S16-D1** The backfill route = the four `/history` pages (30 rows
  each, both calendars per row; no deeper pagination exists); the
  other six instruments' histories begin at launch (forward
  accumulation) — the 6-page extension is a recorded future lever.
- **S16-D2** The forward accumulation = ONE row per Tehran day, the
  day's last snapshot (the rung fires 20:33 UTC = 00:03 Tehran; a
  mid-day runner write is provisional and the rung finalizes it); all
  instruments the live snapshot carries ride the row (the same
  coinPremium computation the board renders); a live row overwrites a
  backfill row on date collision, never the reverse.
- **S16-D3** The attribution strip = exact identity arithmetic over
  two observations (the live snapshot vs the last stored day strictly
  before today's Tehran day), the formula disclosed at point of use,
  NEVER regression — the s7/01 §8 binding copy; the strip renders the
  Emami (the flagship); the three factors render as their own %
  moves with the multiplicative identity printed verbatim.
- **S16-D4** The deciles ride the repo's own R19 posture
  (CROSS_DECILE_MIN_BASE = 30, the current point excluded, the basis
  window named) — at the 24-day launch base the decile honestly
  renders its waiting line and lights within ~a week of forward
  accumulation.
- **S16-D5** The gerami band stands (the WAF block re-verified; a
  third-party corroboration recorded at ~0.909 g pure — not the CBI
  primary); the pin stays an owner-side lever.

## Open questions for the owner

None blocking. The standing reminders: **the WGC drops** (the GDT
quarterly [R15/R23] + **the prices workbook** — the Explorer's price
paths + comparison light up the day it lands: save the dated file at
`data/wgc/prices/<date>-<file-as-published>.xlsx` and tell the next
session) · the EODHD plan upgrade (deepens the crosses' + OHLC stored
bases) · the Kalshi re-opening path (a written authorization —
owner-side) · **NEW: the CBI gerami pin** (the owner's browser on a
cbi.ir /coin/ press-release page would tighten one constant — the
band 0.90–0.92 g pure renders honestly until then).

## Done-criteria check (this session)

- [x] The branch `gold-elevation/p3-bridge2` created off the S15
  close; every milestone committed + pushed (`1283afa1` · `f848446c`
  · `8fb812ff` · `ac05da94` + the close).
- [x] R30 delivered: the backfill + the forward accumulation + the
  premium-history engine + the deciles + the attribution strip + the
  honesty line + the card + the wiring, live-verified.
- [x] The gerami pin attempted honestly (the band stands; §3 above).
- [x] R15/R23 + the prices workbook honestly pending (the sixth
  session for R15; the fold rule cited).
- [x] The manifest round 89 + copy:audit clean.
- [x] Gates 9/9 GREEN (the suite 15,510, +48).
- [x] Deployed per docs/DEPLOY.md (the deploy-lock first;
  `ea45d06c` @ 100%) + the KV seeded live (the backfill + the live
  row).
- [x] Live verification: desktop + mobile + RTL, both locales on the
  new surface; zero console errors (13/13 checks).
- [x] The session summary + the next-session prompt written (this
  doc + the S17 prompt below).

## Known problems carried forward (cite, do not re-litigate)

- **R15 / R23 / the WGC drops** — still pending (the sixth session
  for R15); the wall's WGC CB line stays; the drops' arrival unlocks
  both rows AND the Explorer's data-gated halves.
- **The deciles' 30-day gate** — the base is 24 days at launch (the
  honest waiting line renders); the decile lights within ~a week of
  the nightly rung and sharpens as the series grows (S16-D4).
- **The first live rung firing** — tonight 20:33 UTC (00:03 Tehran
  Friday); the rung is pinned by tests + the seed already proved the
  write path end-to-end (the provisional 11-19 row gets its
  day-close finalize).
- **The EODHD free-tier depth** — unchanged (disclosed;
  self-widening; the plan upgrade deepens it).
- **The two operational P0s** (CFTC Saturday gate; GPR re-fetch) —
  open on main, outside GPE.
- **The AGENTS.md drift items** (GPE-S2-28/29) — end-of-program
  reconciliation only.

## Next-session prompt (S17 — P4, the Advanced tier)

```
Read AGENTS.md in the repo root first and follow it for the whole session.

You are running Session S17 of the Gold Page Elevation (GPE) program —
the EIGHTH Phase-D implementation session: P4, the Advanced tier (the
LAST feature wave). Gate state at this session's start: the CP-C lock
is COMPLETE (s9/CP-C-RECORD.md §1); the Phase-D gate is OPEN; P1-a
DELIVERED + DEPLOYED + LIVE-VERIFIED (production f0844e59 — the S10
rows R01–R06); P1-b DELIVERED + DEPLOYED + LIVE-VERIFIED (production
23ce6b06 — the S11 rows R07–R12); P1-c DELIVERED + DEPLOYED +
LIVE-VERIFIED (production 49ae8ce7 @ 100% + the gold-cb KV seed — the
S12 rows R13 + R14 + R16 + R17); P2 DELIVERED + DEPLOYED +
LIVE-VERIFIED (production 3b8a8c6a @ 100% + the gold-xau KV seed —
the S13 rows R18–R21); P3 COMPLETE across its three sessions: S14
(production 61180d7f @ 100% — R22 + R24 + R26 + R27 + the gold-crosses
+ gold-lbma KV seeds), S15 (production 83359c39 @ 100% + the
gold-expectations KV seed — R28 + R29 + R25, the Kalshi leg
DELIBERATELY DROPPED per the wording read), S16 (production ea45d06c
@ 100% + the gold-premium KV seed — R30 Bridge-2: the backfill +
forward accumulation + deciles + the exact-identity attribution strip;
docs/specs/gold-page-elevation/s16/SUMMARY.md).

Read, in order: AGENTS.md, docs/specs/gold-page-elevation/
00-PROGRAM-PLAN.md, docs/specs/gold-page-elevation/s9/CP-C-RECORD.md
(§1 the locked decisions; §2 the locked queue), docs/specs/
gold-page-elevation/s8/01-RECOMMENDATION-TABLE.md §5 (the P4 rows
R31–R33 — this session's scope, ALL THREE), docs/specs/
gold-page-elevation/s7/03-INTEGRATION-AND-VISUAL-LANGUAGE.md (the
zone C + zone M + zone O placement rules + the progressive-disclosure
discipline), and docs/specs/gold-page-elevation/s16/SUMMARY.md (the
predecessor session). (The pre-S10 research specs live on the
origin/docs/gold-page-elevation branch — read them with git show
origin/docs/gold-page-elevation:<path>; the implementation branch
carries only the s10+ session folders.)

This session's scope: R31 (F12 the time machine — the collapsed Zone
C control over the readings archive: any past date's readings/beam/
lane counts under the then-current versioned voter table, THE ONLY
historical-meter surface, the 2016+ meter-era boundary NEVER crossed;
the D7-locked minimal sizing: a date-parameterized, readings-only
projection — no historical narrative/outlook re-derivation) + R32
(F23 the forecast-accuracy retrospective — the LBMA analyst-survey vs
actual 2010–2026, the collapsed Zone M companion inside the honest
record, the already-extracted series, annual dated upkeep) + R33 (F26
the "if you'd bought" calculator — the collapsed Zone O card: gold vs
S&P vs BTC vs silver, lump + DCA since year Y, every window named at
point of use, the decile framing where a 10y history exists, all
series in-repo). R15/R23 + the prices workbook stay drop-conditional
(check the private data/wgc/ path at M1(b); the fold record §0.2 rule
if absent).

Working mode (the repo's normal discipline): a fresh feature branch
off the S16 close (gold-elevation/p3-bridge2 at HEAD — production
ea45d06c is built from it) named gold-elevation/p4-advanced; small
verified steps; commit + push after each verified milestone; the ONE
Persian-copy manifest round at M3; pnpm gates green before any
deploy; the deploy per docs/DEPLOY.md (the D-43 deploy-lock re-check
FIRST, the §21 portwatch window check, the wrangler 10013 retry
rule); live verification on desktop + mobile + RTL both locales; the
session close per AGENTS.md §10 (HANDOFF + CHANGELOG + DECISIONS +
the summary + the S18 closeout prompt + the TLDR). The R5 no-renames
constraint governs; the GoldPage budget carries ~1.3 kB raw headroom
(218/46 — bump again only on a measured overage, with the
not-duplication check).

Milestones: M1 the citation re-verification + the drop re-check (the
wgc path) + the archive/API-surface reality check (the readings
archive's actual shape + the versioned voter tables + what the
projection endpoint can serve) + the LBMA survey series hand-off
check + the build-time checks → M2 the three rows (the time machine's
API surface + the Zone C control; the retrospective's Zone M
companion; the calculator's Zone O card; the wiring + the tests) →
M3 the manifest round + gates + deploy + live verification + the
close (the S18 prompt = the program closeout: the research-branch
reconciliation + the AGENTS.md drift items + the final sweep).
```
