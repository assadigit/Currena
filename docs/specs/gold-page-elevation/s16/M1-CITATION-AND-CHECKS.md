> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S16 / M1 — Citation re-verification + the drop re-check + the gerami pin attempt + the TGJU profile-history live re-probe

**Session:** S16 of the Gold Page Elevation (GPE) program — the SEVENTH
Phase-D implementation session: **P3, the Supporting tier (wave 3,
third session)**. **Date:** 2026-11-19 (started ~15:2x UTC; Tehran
18:5x Thursday). **Branch:** `gold-elevation/p3-bridge2` (off the S15
close `1a4b35d1` — production `83359c39` is built from it).

Scope: exactly R30 (F3b Bridge-2) + the CBI gerami pin attempt
(`s8/01` §4 R30 · `s8/02` §1 row 21 + §2b · `s7/01` §8 · `s1/11` §6/§8).
R15/R23 + the prices workbook stay drop-conditional (§2 below). The
Kalshi leg is CLOSED (S15-D1) — nothing here reopens it.

## 1. Citation re-verification (zero drift)

Every file path this session's rows cite, re-checked read-only against
the live tree at the branch point (the CP-C §3 discipline note):

| Citation | Status |
|---|---|
| `packages/insights/src/domains/gold/coin-premium.ts` (the Bridge-1 engine — COIN_SPECS, coinPremium, GERAMI_BAND) | present (156 l, read in full) |
| `apps/web/src/features/gold/GoldIranBridge.tsx` (the Zone F card — the board + method + interpretation blocks) | present (358 l, read in full) |
| `packages/scraper/src/tgju.ts` (the ajax + profile-page fallback parser — the backfill's package) | present (469 l, read in full) |
| `apps/api/src/cron.ts` (the ever-green cron + PRICES_CRON_MINUTE + EXPECTATIONS_CRON_MINUTES patterns) | present (222 l, read in full) |
| `apps/api/src/history.ts` (the rolling rate history — weighed, NOT reused: rates-only, 240-generation cap ≈ 10 days — the wrong shape for a permanent daily premium series) | present, read |
| `apps/api/src/routes/insights.ts` (the literal-path route twins + the deps plumbing) | present (the /gold-crosses · /gold-lbma · /gold-expectations · /gold-episodes block read) |
| `apps/api/src/index.ts` (the composition-root reader wiring) | present (§ read) |
| `packages/core/src/schemas.ts` (GoldQuote, Snapshot, the Gold*Snapshot contract family) | present (§ read) |
| `packages/insights/src/domains/gold/xau-crosses.ts` (the decile-stats pattern — CROSS_DECILE_MIN_BASE 30, the R19 posture) | present (§ read) |
| `packages/insights/src/shared/scoring.ts` (`percentileOf`) | present |
| `apps/web/src/features/gold/GoldPage.tsx` (the zone-F band wiring) | present (§ read) |
| `apps/web/src/features/gold/gold-lbma.ts` (the web-client twin the new client follows) | present (read in full) |
| `docs/localization/persian-copy-manifest.json` + `docs/localization/` round docs | present (round 88 is the latest; this session's round = 89) |
| `scripts/check-bundle-budget.mjs` (the GoldPage budget line: 210,000 raw / 45,500 gz — S15's measured bump) | present (line 1131) |
| `packages/insights/scripts/gold-expectations-run.ts` (the runner twin the new runner follows) | present (read in full) |

Zero drift. One structure note recorded for M2: `s6/03` zone F sketches
the backfill as "the TGJU profile-history backfill extension in
`packages/scraper/src/tgju.ts`" — that file is already 469 lines (over
the ~400 consider-splitting line of AGENTS.md §4), so the parser
extension lands as a NEW sibling module `packages/scraper/src/tgju-history.ts`
(one file, one responsibility) importing tgju.ts's own helpers — the
s6/03 sketch followed in spirit (same package, the same fetch
discipline), AGENTS.md §4's no-god-modules rule followed in letter.

## 2. The drop re-check (R15/R23 + the prices workbook — 6th consecutive session)

`data/wgc/` does not exist on the working tree (checked 2026-11-19
15:2x UTC): no GDT quarterly stack (R15 — the 6th consecutive session),
no ETF flows workbook (R23), no prices workbook (R25's Explorer paths +
the comparison rider). **The fold-record §0.2 rule holds** (the drops
gate the DATA, never the code; the wall's WGC CB line stays; the
Explorer's honest waiting states stay). No `gold-episodes-run` this
session — the runner runs the day the owner's drop lands at
`data/wgc/prices/` (the S15-shipped machinery, one command).

## 3. The CBI gerami pin attempt (s8/02 §2b — the band stands)

Three attempts this session, all recorded:

1. **`https://www.cbi.ir/page/5953.aspx`** — fetches 200 (78,775
   bytes; the commemorative-coins page): carries the Bahar family's
   8.136 g × 900 spec (as recorded s4/04 §2b) but NO gerami figure.
2. **`https://cbi.ir/coin`** (the press-release path family) — returns
   the WAF block page «درخواست رد شد» (200 with the rejection body,
   1,009 bytes): the SAME block s4/04 and the R13 session recorded;
   `www.cbi.ir/coin` does not even resolve from this egress (DNS).
3. **A different egress — the search route** (web search, 8 results):
   retail/market sites corroborate «وزن کل ۱٫۰۱۰ گرم · وزن طلای
   خالص ۰٫۹۰۹ گرم · عیار ۹۰۰» (bazaretala.com, a specs-page listing)
   — i.e. the 1.010 g/0.900 → 0.909 g pure reading, one of the two
   recorded candidates, both inside the band.

**The honest verdict:** third-party retail corroboration is NOT the
CBI primary source — the pin's own gate ("the owner's browser or a
different egress" reading the CBI press release) stays unmet. **The
recorded band 0.90–0.92 g pure stands** (the constants table's 0.91
midpoint unchanged; the market arithmetic and now a second independent
third-party voice both corroborate ~0.909 g pure). The pin remains an
owner-side lever (a future session tightens one constant the day a
CBI-primary reading lands). Nothing in R30 depends on the pin's
outcome (s8/02 §2b: "the bridge ships with the band documented; the
pin tightens one constant").

## 4. The TGJU profile-history live re-probe (the s4/03 §1e route re-verified + EXTENDED to the full-history page)

The s4/03 §1e route re-verified live, all fetches from this sandbox
egress (UTC times; browser-like UA; sequential):

| Page | HTTP | Size | Time | Rows | Window |
|---|---|---|---|---|---|
| `www.tgju.org/profile/sekee` (page 1) | 200 | 1,344,611 B | 2.20 s | 25 | ۱۴۰۵/۰۸/۰۳ → ۱۴۰۵/۰۸/۲۷ |
| `www.tgju.org/profile/sekee/history` | 200 | 688,252 B | 1.94 s | **30** | **2026/10/15 → 2026/11/18** |
| `www.tgju.org/profile/sekeb/history` | 200 | 688,606 B | 2.29 s | 30 | 2026/10/15 → 2026/11/18 |
| `www.tgju.org/profile/ons/history` | 200 | 687,326 B | 2.24 s | 30 | 2026/10/14 → 2026/11/18 |
| `www.tgju.org/profile/price_dollar_rl/history` | 200 | 687,684 B | 1.85 s | 30 | 2026/10/15 → 2026/11/18 |

**The /history page is the profile page's own "full history list"
route** (each profile page links it: «مشاهده لیست کامل تاریخچه» →
`profile/<slug>/history`) — the SAME table family s4/03 §1e verified,
serving the 30 most recent daily rows (~6 weeks of Tehran trading
days) instead of page 1's 25. No deeper pagination exists on either
shape (probed: `?page=2` serves the identical 30 rows; `/history/2`
301-redirects to `/history/history`, the same page; no AJAX offset
endpoint in the page source — the only "offset" hits are Highcharts
config). The pages print BOTH calendars per row — columns:
`بازگشایی (open) · کمترین (low) · بیشترین (high) · پایانی (close) ·
میزان تغییر · درصد تغییر · Gregorian date · Jalali date` — so the
parse is calendar-exact with **no Jalali→Gregorian conversion needed**
(the Gregorian column is authoritative; the Jalali column
cross-checks).

**The four-page set** (the verified scope, s8/01 R30 / s8/02 row 21):
`sekee` (coin-emami), `sekeb` (coin-bahar), `ons` (the ounce leg),
`price_dollar_rl` (the free-dollar leg) — exactly the legs the premium
history computes from (s1/11 §6 item 2: "backfills ons,
price_dollar_rl, and the coin quotes; the premium history is then
COMPUTED from the three backfilled legs — never scraped as a claim").

**The arithmetic reconciliation (the strongest probe result):** the
backfilled closes reproduce the specs' own recorded live observations
EXACTLY — the 2026-11-16 row carries dollar 268,705 toman and Emami
close 250,555,000 toman, the verbatim values of the s1/11 §5 worked
check and the s4/03 §1a snapshot. The computed Emami premium for
2026-11-16 is **+2.48%** (the s1/11 §5 live observation: ≈+2.0% on
the intraday 12:50 quote — the day-close reconciles within the day's
range). Sample of the reconstructed series (the day-close premiums,
computed by hand from the four legs' closes):

| Date | Ounce USD | Dollar toman | Emami premium | Bahar premium |
|---|---|---|---|---|
| 2026-11-11 | 3,986.84 | 264,070 | +2.63% | −0.23% |
| 2026-11-12 | 3,885.08 | 266,900 | +4.04% | +1.20% |
| 2026-11-16 | 3,865.00 | 268,705 | +2.48% | −1.26% |
| 2026-11-17 | 3,846.32 | 266,710 | +4.14% | +0.24% |
| 2026-11-18 | 3,725.80 | 266,330 | **+7.33%** | **+3.06%** |

The 2026-11-18 row is the attribution strip's own story rendered by
the data: the ounce fell 3.1% in a day while the coin held — the
premium absorbed the move (+2.14% → +7.33% Emami). The inner join of
the four legs' dates yields **24 common days** at launch (2026-10-15 →
2026-11-18) — the honest basis window, named at point of use.

**The live feed re-checked (the forward-accumulation leg):** the R13
snapshot plane is unchanged (the 9 gold symbols + `price_dollar_rl`
verified by the probe closes above); the forward accumulation rides
the SAME `snapshot:tgju` KV plane the bridge board reads — zero new
fetches for the daily row.

## 5. The build-time checks + the standing constraints

- **§21 portwatch window:** today is Thursday 2026-11-19 — clear (the
  window is Tuesdays 11:00–14:00 UTC).
- **The D-43 deploy-lock re-check** happens FIRST at the deploy
  milestone (M3), per docs/DEPLOY.md.
- **The R5 no-renames constraint** governs (no file moves this
  session; new modules only).
- **The GoldPage budget** carries 210,000 raw / 45,500 gz (S15's
  measured bump, 207.17/44.12 used) — ~2.8 kB raw headroom; a new
  component + client will need a measured bump at M3 with the
  not-duplication check (each new module appears exactly once; the
  pure engine rides the insights chunk, not GoldPage).
- **The one Persian-copy manifest round** (round 89) covers ALL of
  this session's fa strings at M3 — no interim rounds.
- **Tests never hit live sites** — the 4 history pages captured this
  session become trimmed fixtures (the s15 Polymarket-fixture
  discipline); the parse is pure + fixture-tested.

## 6. Design decisions taken at M1 (for the DECISIONS record at close)

- **S16-D1** The backfill route = the four `/history` pages (30 daily
  rows each, both calendars per row); no deeper pagination exists —
  the launch basis is the honest 24-common-day window, named at point
  of use; the other six instruments' histories begin at launch
  (forward accumulation) — the 6-page extension is a recorded future
  lever, not this session's scope.
- **S16-D2** The forward accumulation = ONE row per Tehran day, the
  day's last snapshot (the rung fires 20:33 UTC = 00:03 Tehran), all
  instruments the live snapshot carries (the same `coinPremium()`
  computation the board renders); a live row overwrites a backfill
  row on date collision; a backfill row never overwrites a live row.
- **S16-D3** The attribution strip = exact identity arithmetic over
  two observations (the live snapshot vs the last stored day), the
  formula disclosed at point of use, NEVER regression — the s7/01 §8
  binding copy; the three factors render as their own % moves with
  the multiplicative identity printed verbatim.
- **S16-D4** The deciles ride the repo's own R19 posture
  (CROSS_DECILE_MIN_BASE = 30, the current point excluded, the basis
  window named) — at the 24-day launch base the decile honestly
  renders its waiting line and lights within ~a week of forward
  accumulation.
- **S16-D5** The gerami band stands (§3 above); the pin stays an
  owner-side lever.

## 7. Method and limitations

Probes: direct fetches from this sandbox (curl, browser-like UA,
sequential — the off-hours discipline; Tehran 18:5x Thursday evening,
the market's last trading day was Wednesday 11-18); one web-search
egress for the gerami corroboration; git read-only checks against the
branch point. Limitations: (1) the TGJU pages' 30-row windows are
live observations at probe time — the backfill run at M2 re-fetches
and may serve one more trading day (2026-11-19 is a Tehran weekend
day — the newest completed row stays 11-18); (2) the search-egress
corroboration names its third-party sources honestly and weighs them
as corroboration only; (3) the WAF block on cbi.ir /coin/ paths is an
environment fact recorded three sessions running — the pin needs the
owner's browser.
