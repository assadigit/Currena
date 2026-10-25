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
| **M4** | Wave 1 — the early-warning pack (OD-8) | `initial-jobless-claims` · `sofr` · `recession-probability` · `us-pce-core-yoy` · `michigan-sentiment` (+ the `michigan-1y-expectations` companion) + the Tier-0 displays `us-2y`, `breakeven-10y` — one FRED bulk-group edit (the new 5-series Wave-1 group + SOFR into the daily group) + the register rows; all series live-verified 2026-10-24; **`hy-oas` excluded by the M3 licence no-go** | **done 2026-10-24** — deployed `21d0b040` → `5924ed4f` (the temporary 15:40 publish rung, reverted) → `c1b36019` → `160ac6e2` (the rule-text scale fix found in live verification); the 15:40 rung wrote the first 71-reading snapshot (all writes completed — the pre-fix failure mode died before any write; the exact cpuTime capture rides the designed rungs), live-verified on currena.ir EN+fa: hero 7-of-25, growth lane Cautious 2-of-8, recession probability 62% warning, Michigan bottom-decile warning with its 1y companion, claims 194,000 normal, SOFR/us-2y/breakeven-10y context with the honest citations; evidence under `docs/insights/screenshots/m4-2026-10-24/` |
| **M5** | Wave 2 — household costs & the euro long end | Pink Sheet `food-index` + wheat/maize · `euro-aaa-10y` (series key verified at build time — the review's honest negative) · `usdtry` (the EM-pressure first member) | **done 2026-10-24** — the AAA key found + live-verified (`YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y`, "AAA yield curve - 10-year spot rate", 3.38 @ 2026-10-22; the review's four dotted/FM candidates 404'd — the slash-form YC key answers 200); the food trio rides the SAME Pink Sheet download (the Monthly Indices sheet read — zero new requests; live: food 124.1 / wheat 278.6 / maize 239.6 @ 2026M09); TRY joins the Frankfurter request as the ninth leg (usdtry 49.74, top of its decade — the inflation→devaluation case study); all context rows, voting stays 40; deployed + live-verified (see the DEPLOY 2026-10-24b record) |
| **M6** | Wave 3/4 — the leading edge + probes | `mortgage-30y` · `walcl` · `retail-sales` · `housing-permits` · `cfnai` · ~~`ig-oas`~~ (inherits the M3/D-44 no-go — ICE pre-approval required) · `job-openings` · `t5yie` · `us-wages` · `euro-hicp` · ~~`china-cpi`~~ (BOTH FRED OECD mirrors died upstream 2025-04 — carried to M7 via the NBS automation) · platinum-daily · the AU leading-edge trio (`au-housing-finance`, `au-saving-ratio`, `au-job-vacancies`) · the venue-probe afternoon (BoE/BoJ/EODHD au-10y/NBS) — M2's OECD relabels are its stopgap until the probes land | **done 2026-10-25/26** — 76→88 indicators, voting 40→42 (`euro-hicp` prices-heat scored at the ECB's 2%, `au-housing-finance` au-households scored percentile-yoy — audit item C10's rule fix); the probes: **BoE succeeded** (the Bank-Rate.asp decision table — boe-rate left the OECD mirror for the BoE's own current rate under OGL v3.0, the Wave-4 probe fix, +1 fetch/50), **EODHD au-10y no-go** ("not available for your subscription plan" — au-10y stays RBA F2.1 monthly), **BoJ DNS-blocked** from the work venue (the relabel stays boj-rate's stopgap — carried to M7), **NBS automation probed OK** (the china-cpi follow-up, M7). The session that deployed Wave 3 (2026-10-25 00:05–00:26 UTC, versions 211–214) was cut off before committing — this session recovered all 14 API files byte-exact from the deployed Worker's sourcemap + the 12 bilingual copy entries from the live Insights chunk, then landed the BoE fix, the quarterly staleness recalibration (au-wage-growth false-staled live 2026-10-17; WPI 224d/RPPI 219d/LEND 220d/JV 232d/ANA 245d arithmetic), the weekend T-03/T-08 metals carve-out (the 10-18/25 archive noise), R14 ticker fixes on recovery, and the internal archive 10-23 reconstruction (the D-43 incident's missing twin — schema-validated from its public twin, identity that day) |
| **M7** | The NBS automation + china-cpi | Automate the china-pmi fetch from the NBS english releases (the probe succeeded 2026-10-25 — the pages are readable and machine-parseable); `china-cpi` (both FRED OECD mirrors CHNCPIALLMINMEI/CPALTT01CHM659N died upstream 2025-04) rides the same automation as a second NBS card; the BoJ fix-or-retire (stat-search.boj.or.jp fails DNS from the work venue — re-probe from the Worker venue) | **done 2026-10-26** — 88→89 indicators, voting 42→43: the new `adapters/nbs.ts` (the index scan with the page-2 fallback + the PMI release's Table-1 13-month parse + the CPI release's YoY parse, headline-cross-checked) automates china-pmi (source `nbs`, cadence `monthly`; the E-08 manual expiry leaves the card — all 10 seed observations re-verified identical against the NBS's own Table 1) and china-cpi ships as the growth-health China leg, SCORED at China's own ~3% target with a 13-observation verified seed (Sep 2025 −0.3 → Sep 2026 +0.9) grown monthly by the stored accumulation. The fetch is licence-granted: the NBS ToS (read 2026-10-26) — "Welcome to reprint or quote…" + "You are allowed to download and use the statistical data on this website" — all four pages probed 200 from BOTH venues; the WAF-blocked easy-query API (403 UrlACL) and the dead RSS (404) are recorded as the honest reasons the press-release scan is the only machine-readable path. The BoJ fix-or-retire resolves to RETIRE: stat-search.boj.or.jp is dead from BOTH venues (DNS + the Worker-venue 530) and the BoJ's own rate decisions live only in PDF releases — the OECD mirror's "monthly average, lagged" relabel stays boj-rate's permanent source |

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

- **2026-10-26 (the M7 session — the NBS automation + the BoJ retire):**
  the tracker's last pending milestone closed. The NBS English
  press-release automation (`packages/insights/src/adapters/nbs.ts` +
  13 fixture-backed tests against trimmed captures of the real pages):
  the index scan finds the latest PMI/CPI release links (page 2 only
  when needed — verified live: the PMI link sat on page 2, the CPI link
  on page 1), the PMI release's "Table 1" yields a 13-month history per
  fetch (month-end dated, the year inferred across the December→January
  boundary), the CPI release yields its own month's YoY with the
  headline-sentence cross-check (a disagreement beyond 0.05 throws
  FormatChangedError). china-pmi leaves the M5 manual-entry regime (the
  manual file becomes the fetch-failure seed; the E-08 expiry leaves the
  card; the monthly 45-day grace owns freshness — the manual file would
  have staled 2026-10-31). china-cpi ships as the 89th indicator (the
  43rd voter) with a 13-observation verified seed — each month's value
  read from that month's own release page this session (the provenance
  table in data/manual/README.md) — and the stored accumulation
  (insights:hist:china-cpi) grows it monthly. The licence is granted, not
  assumed: the NBS Terms of Service (read 2026-10-26) carries BOTH
  affirmative quotes ("Welcome to reprint or quote…" + "You are allowed
  to download and use the statistical data on this website") — the
  register row flips (provider nbs, method M2, runtime worker) with the
  ToS recorded; all four NBS pages probed 200 from BOTH the sandbox and
  Cloudflare egress (rba-probe); the WAF-blocked easy-query API + the
  dead RSS are the recorded reasons the press releases are the only
  machine-readable path. The BoJ fix-or-retire resolves to RETIRE with
  fresh evidence: stat-search.boj.or.jp answers 530 from the Worker
  venue too, and the BoJ's rate decisions live only in PDF releases —
  the OECD mirror's honest relabel is permanent. Gates: typecheck 6/6,
  core 191, scraper 67, insights 582 (567 + 15 nbs tests), markets 13,
  api 344, web 680 + the recorded 16-failure briefing jsdom baseline,
  lint 0/15 advisories, copy audit clean (14 strings processed to
  2026-10-26-m7-nbs, manifest 2821), registry regenerated (89, 0
  hidden), budgets: entry 295.28/88.81 held, Insights lazy 846.29/205.01
  vs the bumped 850/206 (one card of bilingual content, the D-16 path).
  The local dry-run verified the live flow end-to-end (the page-2
  fallback, the 13-month Table-1, china-pmi 50.1 normal + china-cpi 0.9
  normal, the growth lane's 28 voters) before the deploy. Deployed as
  366a91de → 179c3397 (a first temporary 17:45 entry in the GATED sweep
  list — honestly SKIPPED by the gate itself: the status was healthy and
  only 7.6h old, the failure-gate working exactly as designed) → 7655b152
  (the ungated temporary publish rungs: an 18:05 main-shaped run + an
  18:07 periodic-history run, the M4 15:40 pattern) → 0ce6fa8d (reverted;
  the final state). The 18:05 rung's Worker-venue capture: status
  generatedAt 18:05:18Z, 89 live readings, all 4 NBS fetch rows ok (the
  index page-2 fallback fired from Cloudflare egress), zero genuine
  failures, the whole snapshot family written in 18.4 s wall (the
  writes' completion is the CPU-margin evidence — an exceededCpu death
  kills a run before any write, the M1† lesson); the 18:07 rung wrote
  insights:hist:china-cpi (13 points, −0.3@2025-09-30 → +0.9@2026-09-30)
  and GREW insights:hist:china-pmi 10 → 13 points (the fetched Table-1's
  Sep-Nov 2025 rows) — both history endpoints serve 13 points, the public
  archive 200, and the 20:10 designed sweep then read the fresh status
  and skipped, exactly as designed.

- **2026-10-25/26 (the M6 recovery + Wave-4 session):** the session that
  deployed Wave 3 overnight (versions 211-214, 00:05-00:26 UTC) was cut
  off before committing - a THIRD sandbox reset destroyed its tree. This
  session recovered everything: the 14 API-side files byte-exact from the
  deployed Worker's sourcemap (the fac13df precedent), the 12 new cards'
  bilingual copy from the live Insights chunk (the deployed bundle's
  minified dictionaries parsed back to source), the display configs +
  the four new unit tokens (aud-bn, permits, openings, vacancies) from
  the labels chunk. On top of the recovery it landed: the Wave-4 BoE
  probe fix (the Bank-Rate.asp decision table replaces the FRED OECD
  monthly mirror - boe-rate now the BoE's own current rate under OGL
  v3.0, per-change cadence, +1 fetch at ~42/50 with the KV-ops-don't-
  consume-fetch-subrequests empirical note), the T-16 scans re-verified
  LIVE for all 8 new FRED series (matching the deployed session's
  classes), the quarterly staleness recalibration (five AU cards -
  au-wage-growth had false-staled live on 2026-10-17), the weekend
  T-03/T-08 metals carve-out (the every-weekend archive noise since the
  seeds began), the R14 ticker fixes (CFNAI/JOLTS were code-like - the
  deploying session never ran the web gates), the internal archive
  2026-10-23 reconstruction (the D-43 incident's missing twin,
  schema-validated), and the latent typecheck fix in scoring.ts
  (percentileBasis 'level'|'yoy' - esbuild never typechecks). Gates:
  typecheck 6/6, core 191, scraper 67, insights 567 (559 + 8 new boe/
  weekend tests), markets 13, api 344, web 680 + the recorded 16-failure
  briefing jsdom baseline, lint 0 errors/15 advisories, copy audit
  clean (148 new fa strings processed to 2026-10-25-m6-wave3, manifest
  2808 entries), T-15 public passed (0 hidden), budgets: entry 295.28/
  88.80 held, Insights lazy bumped 800/194 -> 845/205 (measured 841.84/
  203.99 - twelve cards of bilingual content, the D-16 path). Deployed
  as a4d6ef37 at 03:37 UTC - 33 minutes AHEAD of the 04:10 main rung,
  which then ran the recovered code as its first designed-rung
  verification. EODHD quota untouched (the au-10y probe answered
  no-plan, 0 data requests).

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
