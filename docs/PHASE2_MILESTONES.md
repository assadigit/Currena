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
| **M2** | The subtraction set (OD-7) | Retire `nzd-usd` + `silver-btc` (the eth-usd KV-migration pattern — id retirement is a schema migration across the stored snapshot/status/archives), demote `m2-us` scored→context, relabel the five OECD mirrors (`bund-10y`, `jgb-10y`, `gilt-10y`, `boj-rate`, `boe-rate`) to "monthly average, lagged" in both locales | **done 2026-10-23** — `75517285` deployed after the KV surgery (16 writes + 2 deletes); 65→63 indicators, voting 23→22, live-verified EN+fa |
| **M3** | The credit-spread licence row (OD-5) | The ICE BofA indices via FRED enter the register (the VIXCLS/NFCI citation-required posture) — display permission + attribution rows; enables the Wave-1 spread cards | **pending** |
| **M4** | Wave 1 — the early-warning pack (OD-8) | `initial-jobless-claims` · `hy-oas` · `sofr` · `recession-probability` · `us-pce-core-yoy` · `michigan-sentiment` + the Tier-0 displays `us-2y`, `breakeven-10y` — one FRED bulk-group edit + one register row; all series live-verified in the review (§10) | **pending** |
| **M5** | Wave 2 — household costs & the euro long end | Pink Sheet `food-index` + wheat/maize · `euro-aaa-10y` (series key verified at build time — the review's honest negative) · `usdtry` (the EM-pressure first member) | **pending** |
| **M6** | Wave 3/4 — the leading edge + probes | `mortgage-30y` · `walcl` · `retail-sales` · `housing-permits` · `cfnai` · `ig-oas` · `job-openings` · `t5yie` · `us-wages` · `euro-hicp` · `china-cpi` · platinum-daily · the AU leading-edge trio (`au-housing-finance`, `au-saving-ratio`, `au-job-vacancies`) · the venue-probe afternoon (BoE/BoJ/EODHD au-10y/NBS) — M2's OECD relabels are its stopgap until the probes land | **pending** (probe-conditioned; may split further) |

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
  the tail before closing (M1†'s 1831 ms leaves ~220 ms headroom; the main
  04:10 shape carries ~7 more writes than the sweep shape — if it ever dies
  at the write tail, the 10:10 sweep heals the page and the rung-split is
  the recorded follow-up).

## Session log (newest first)

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
