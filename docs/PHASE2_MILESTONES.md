# Phase-2 Milestones — the D-42 implementation tracker

The owner approved OD-1/OD-2/OD-5/OD-7/OD-8 on 2026-10-23 (chat directive,
recorded as **D-42** in `DECISIONS_FOR_ALI.md`): *"Do them in phases. add a
milestone for each phase."* This file is the live tracker — one row per
milestone, each closed only with its gates green, its deploy verified, and its
CHANGELOG/DEPLOY records written. Waves and OD numbering follow
`docs/EXPERT_REVIEW.md` §8–§9 (the 2026-10-23 v2 review, Iran-excluded per
D-41).

## The map

| # | Milestone | Scope (from the approved waves) | Status |
|---|---|---|---|
| **M0** | Owner decisions recorded | D-42 in `DECISIONS_FOR_ALI.md` + this tracker | **done 2026-10-23** (docs only) |
| **M1** | The unhide round (OD-1/OD-2) | Shiller pair (`shiller-cape`, `shiller-ecy`) + `china-pmi` public: register/licence flips (owner-accepted, display-ok), ingest wiring (the committed converted file; ECY ×100 to percent), NBS attribution honesty, all test pins moved to the new reality | **done 2026-10-23** — deployed + live-verified (`currena.ir`, voting pool 22→23) |
| **M1†** | The rung CPU fix (carried by M1) | `baseReadingCache` in `adapters/snapshot.ts` — the draft+final double build collapses to one deterministic pass (the 04:10/10:10/20:10 rungs were dying `exceededCpu` at exactly 2050 ms; the fixed rung completed at 1831 ms), phase timings surfaced to the tail | **done 2026-10-23** — the 16:05 UTC rung healthy, captured via `wrangler tail` |
| **M1††** | The CPU margin restored (unplanned, landed via the 2026-10-23c reconciliation) | The 20:10 sweep died `exceededCpu` at 2050 ms on the M1† build (~220 ms headroom, variance ate it). `epochDay` memoized in `series.ts` (the profiled top self-time — `assertAscending`'s O(n) re-walks); verified live via a temporary 22:35 diagnostic rung: **cpu 617 ms, outcome ok**. Margin ~3.3× — the rung-split follow-up retired | **done 2026-10-23** — the 22:35 rung healthy (observability-captured); a parallel session's deploy briefly overwrote M2 (the honest incident, D-43) — the reconciliation landed M2 + M1†† together |
| **M2** | The subtraction set (OD-7) | Retire `nzd-usd` + `silver-btc` (the eth-usd KV-migration pattern — id retirement is a schema migration across the stored snapshot/status/archives), demote `m2-us` scored→context, relabel the five OECD mirrors (`bund-10y`, `jgb-10y`, `gilt-10y`, `boj-rate`, `boe-rate`) to "monthly average, lagged" in both locales | **done 2026-10-23** — `75517285` deployed after the KV surgery (16 writes + 2 deletes); 65→63 indicators, voting 23→22, live-verified EN+fa |
| **M3** | The credit-spread licence row (OD-5) — **the honest no-go** | The T-16 scan (2026-10-24, live series-page reads) found the ICE BofA indices (`BAMLH0A0HYM2`, `BAMLC0A0CM`) carry FRED's **"copyright: pre-approval required"** tag — NOT the citation-required class OD-5 assumed. The pre-approval class fail-closes on BOTH gates (`sources.ts riskRowForLeg`: no fetch; `licences.ts fredLicenceForSeries`: never public) + the `fred-pre-approval` register row + the T-16 records + D-44: **no hy-oas/ig-oas card ships until the owner secures ICE's written permission** (the owner's "exclude private/unavailable" directive covers the exclusion) | **done 2026-10-24** — the no-go recorded, the register hardened (D-44) |
| **M4** | Wave 1 — the early-warning pack (OD-8) | `initial-jobless-claims` · `sofr` · `recession-probability` · `us-pce-core-yoy` · `michigan-sentiment` (+ the `michigan-1y-expectations` companion) + the Tier-0 displays `us-2y`, `breakeven-10y` — one FRED bulk-group edit (the new 5-series Wave-1 group + SOFR into the daily group) + the register rows; all series live-verified 2026-10-24; **`hy-oas` excluded by the M3 licence no-go** | **pending verification** — code + gates green, deploying |
| **M5** | Wave 2 — household costs & the euro long end | Pink Sheet `food-index` + wheat/maize · `euro-aaa-10y` (series key verified at build time — the review's honest negative) · `usdtry` (the EM-pressure first member) | **pending** |
| **M6** | Wave 3/4 — the leading edge + probes | `mortgage-30y` · `walcl` · `retail-sales` · `housing-permits` · `cfnai` · ~~`ig-oas`~~ (inherits the M3/D-44 no-go — ICE pre-approval required) · `job-openings` · `t5yie` · `us-wages` · `euro-hicp` · `china-cpi` · platinum-daily · the AU leading-edge trio (`au-housing-finance`, `au-saving-ratio`, `au-job-vacancies`) · the venue-probe afternoon (BoE/BoJ/EODHD au-10y/NBS) — M2's OECD relabels are its stopgap until the probes land | **pending** (probe-conditioned; may split further) |

## Standing rules (inherited from the review + the repo's own gates)

- **Fail-closed licences**: every new FRED series needs its copyright tag
  scanned (T-16) before display; the credit-spread row (M3) rides the
  VIXCLS/NFCI precedent, nothing invents an acceptance.
- **Iran stays excluded** (D-41) — no Iran-economy indicator enters any wave;
  the TGJU converter feed is untouched by this tracker.
- **Retirement is a schema migration** (M2): removing an id invalidates the
  stored snapshot/status/archives that carry it (strict parse) — the
  eth-usd precedent (2026-10-21c) is the runbook: surgical KV rewrite before
  the deploy, or the page 500s until the next rung.
- **Every milestone closes with**: typecheck 6/6, tests green (the recorded
  jsdom baseline aside), `registry:generate` regenerated + committed, T-15
  build gate run, budget check, deploy, live verification, CHANGELOG +
  DEPLOY records, and this tracker updated.
- **The rung CPU budget** (~2 s on the free plan) is a live constraint: every
  milestone that adds collectors or readings re-checks the phase timings via
  the tail before closing. M1††'s epochDay memoization brought the sweep
  shape to **617 ms** (2026-10-23, observability-captured) — ~3.3× headroom
  even for the heavier main 04:10 shape; the rung-split follow-up is
  retired. Re-check after Wave-scale additions (M4+) and re-profile with
  `node --cpu-prof` on the local ingest twin if the tail ever shows >1.5 s.

## Session log (newest first)

- **2026-10-24 (the M3+M4 session — Wave 1 lands):** the early-warning pack
  shipped as ONE code round with the licence prerequisite inside it.
  **M3's honest finding first:** the T-16 scan of the credit-spread series
  (live FRED series-page reads from the work venue) found the ICE BofA
  indices carry the "copyright: **pre-approval required**" tag — not the
  citation-required class OD-5 assumed. The register fail-closed on both
  gates (a new `fred-pre-approval` posture in `sources.ts` + `licences.ts`:
  no fetch, no display, private or public, until ICE's written permission
  exists) and the no-go is recorded as **D-44** — `hy-oas`/`ig-oas` ship
  only after the owner secures that permission (the owner's standing
  "exclude private/unavailable" directive covers the exclusion).
  **M4 then delivered the rest of the pack:** eight cards — claims (ICSA,
  scored, percentile-high), the Chauvet recession probability
  (RECPROUSM156N, scored at the 0.50 line — already reading 0.62 warning
  at the dry-run), Michigan sentiment (UMCSENT, scored on its 10y low
  tail — 48.1 reads bottom-decile warning) with its 1y-expectations
  companion (MICH) inside the card, core PCE (PCEPILFE → 12-month %
  change, scored against the Fed's 2% — 3.01 warning), plus three
  context rows: SOFR (the funding leg), us-2y (the Tier-0 display from
  the already-collected DGS2) and breakeven-10y (T10YIE leaves
  validation-only). The global voting pool 22→26, growth-health 5→8,
  prices-heat 3→4; the FRED consolidation grows to six bulk groups
  (48/50 subrequests on the 04:10 shape). Gates: typecheck 6/6, core 191,
  scraper 67, insights 559, markets 13, api 344, web 676 + the recorded
  16-failure briefing jsdom baseline, lint 0/15 advisories, copy audit
  clean (92 new fa strings processed to 2026-10-24a-m4-wave1, 2596
  entries), T-15 public passed (0 hidden), budgets: entry 295.28/88.80
  held, Insights lazy 780.48/188.46 vs the bumped 782/189 (the bump is
  the eight-card bilingual copy corpus, justified in the script +
  CHANGELOG); local dry-run verified all 8 values live (194,000 claims /
  3.90 SOFR / 62% recession probability / 48.1 Michigan / 3.01% core PCE /
  4.65% us-2y / 2.34% breakeven-10y / 4.6% 1y expectations). EODHD quota
  untouched (0 requests).

- **2026-10-23c (the reconciliation session):** two parallel sessions had
  worked the tracker simultaneously — the M2 session shipped `75517285`
  (21:55 UTC), then the CPU-margin session — unaware — deployed `b6e1541b`
  (22:11) from the pre-M2 tree + the epochDay memoization, overwriting M2
  for ~90 minutes (both window endpoints were owner-approved states; the
  22:35 diagnostic rung re-poisoned the snapshot + public projection the
  M2 migration had cleaned). The reconciliation reset onto `ef84606`,
  re-applied the CPU fix (+2 behavior tests, the reverted-rung note),
  closed the copy-manifest gate the M2 tree had not (audit exit 0, 2,504
  entries — 28 processed, 18 removals deleted, the shiller 14
  re-processed), re-ran the idempotent KV surgery, and redeployed M2 +
  M1†† together. The CPU story: the 20:10 sweep's exceededCpu death at
  exactly 2050 ms (observability-captured), root-caused to `epochDay`
  (~0.84 s profiled self time via `node --cpu-prof` — the assertAscending
  invariant's O(n) re-walks), fixed by memoization, verified live at
  **cpu 617 ms** by the 22:35 diagnostic rung.

- **2026-10-23 (the M2 session, same day as M1):** the subtraction set
  closed. The two retirements followed the eth-usd pattern end-to-end —
  schema/definitions/adapters/copy in both locales, plus the KV surgery
  (`scripts/retire-ids-migration.ts`, dry-run then real: 16 writes + 2
  deletes, every rewritten doc validated against the new schema, run
  BEFORE the deploy so the page never broke). The m2-us demotion kept the
  series and lost the vote (rule → info, growth-health → 5 members, the
  migration set the stored reading to context, the regression fixture
  expectation moved with it). The five OECD mirrors now honestly say
  "monthly average, lagged" in both locales — the stopgap until the
  M6/Wave-4 daily-source probes. Gates: typecheck 6/6, insights 557 /
  api 344 / web 680+baseline, T-15 public, budgets held (the chunk
  shrank). Live-verified on currena.ir: hero 5-of-22, both retired ids
  400 on history, archives serve, relabels in the Bund details panel EN
  + fa. Deployed `75517285`.

- **2026-10-23 (the M0+M1 session, resumed after a sandbox reset):** M0+M1
  closed. The unhide round landed as Worker versions `34a8e385` →
  `25f613f2` (the CPU cache) → `32c47cad` (the diagnostic rungs reverted);
  the 16:05 UTC rung verified healthy via tail (cpu 1831 ms, 62 series
  staged, all three unhidden ids serving; `china-pmi` joined the global
  voting pool, 22→23). The source tree was then reconstructed from the
  deployed Worker's sourcemap after the sandbox reset destroyed the
  uncommitted working tree (7 files recovered byte-exact; the licences.ts
  display flips + the test pins re-derived against the recovered audit —
  the regenerated registry matches the deployed audit on all 65 entries).
  An honest note carried from the round: shillerdata.com was unreachable
  from the work venue (2026-10-23) — the committed file (latestDate
  2026-10-01) must be refreshed from a reaching venue before ~2026-11-15.
