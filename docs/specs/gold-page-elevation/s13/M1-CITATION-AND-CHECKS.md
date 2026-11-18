> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S13 / M1 — Citation re-verification + the two build-time checks

**Session:** S13 of the Gold Page Elevation (GPE) program — the FOURTH
Phase-D implementation session: **P2, the interactive chart (wave 2, first
session)**. **Date:** 2026-11-18 (~21:1x UTC start). **Branch:**
`gold-elevation/p2-chart-ta` (off the S12 close `2e22c428` — production
`49ae8ce7` was built from it; git `main` still sits at the R-5 close
`19131b0`).

Scope: exactly R18–R21 (`s8/01` §3; the locked modes from the CP-C record
§1), plus R15 only if its WGC GDT data drop arrived. **The R15 check ran
first: the drop has NOT arrived** (no `data/wgc/` path anywhere in the
repo — checked read-only; the owner's kickoff message carries no drop
notice) → **R15 stays pending** (the fold record §0.2 rule; the licence
wall's WGC CB line stays until the drop lands; the rest of P2 proceeds
exactly as the S12 close planned).

## 1. Citation re-verification (the discipline — every path the rows cite, against the live tree)

Read-only, at this session's start, on the branch HEAD `2e22c428`. **Zero
material drift.** The rows' cited targets, one by one:

| The citation (s8/01 §3 + s6/03 §2) | The live tree | Verdict |
|---|---|---|
| `apps/web/src/features/gold/signals/GoldPriceChart.tsx` (R18's module; the s6/03 zone E landing spot) | does not exist yet — the NEW module this session creates there | the landing spot is free (the siblings exist) |
| `features/gold/Signals.tsx` (the Zone E shell) | exists (247 l, the shell-only post-WS-4 split) | ✓ |
| `signals/verdict.tsx` (MetalTrendChart + VerdictStrip — the chip F7 rides in) | exists; `MetalTrendChart` renders the shared `TrendPanel` for gold + silver | ✓ |
| `shared/components/TrendChart.tsx` (the fixed-range panel F7 supersedes FOR GOLD) | exists (560 l; the range-chips + inspector pattern to follow) | ✓ |
| `apps/api/src/routes/insights.ts:155` (`PUBLIC_HISTORY_WINDOW_DAYS = 1900`, the /:id/history bound R01 relabeled) | exists (the constant + the route at :855) | ✓ |
| `domains/gold/adapters/eodhd-xauusd.ts` (the adapter s8/01 R18 names) | does not exist yet — the NEW adapter this session creates there | free |
| The markets worker's EODHD client (the pattern the adapter reuses) | `packages/insights/src/domains/world-markets/markets/providers.ts` exists (the EOD URL shape, `parseEodhdEodResponse`, the token-injection + kill-switch discipline) | ✓ (see §4-D1 for the venue decision) |
| `domains/gold/ta-levels.ts` (R19's pure computation, s6/03 zone H) | does not exist yet — the NEW module this session creates there | free |
| `features/gold/GoldTaLevels.tsx` (Zone H's band component) | does not exist yet — NEW | free |
| Zone H placement: between the seats (G) and the RATIOS (I) | `GoldPage.tsx` renders `GoldSeats` then `GoldContext` — the insertion point exists | ✓ |
| `features/gold/GoldOnRamp.tsx` (R20's module per s6/03 zone D) | does not exist yet — NEW | free |
| The lane anchors R20's closes need: `#lane-borrowing-costs` / `-dollar` / `-stress` / `-inflation` / `-flows` | `GoldSeats.tsx` renders `id={`lane-${lane.lane}`}` per lane card | ✓ |
| The card-level anchors: `usa-card-real-yield-10y`, `usa-card-fed-expectations`, `usa-card-us-cpi-yoy`, `usa-card-breakeven-5y5y`, `usa-card-vix` | `UsaTierCards.tsx:211` renders `id={`usa-card-${entry.id}`}` | ✓ |
| `currencies-card-dollar-basket` | `CurrenciesTierCards.tsx:158` renders `id={`currencies-card-${entry.id}`}` | ✓ |
| `#gold-zone-k` (driver 4's close) | `GoldCbDemand.tsx:339` | ✓ |
| `#gold-zone-f` (FAQ Q5's close) | `GoldIranBridge.tsx:281` | ✓ |
| `features/gold/GoldContext.tsx` + `gold-tiles.ts` (`GOLD_DISPLAY`, the 14 context cards — R21's surfaces) | exist; the flows group carries the 5 Zone-J cards (cftc ×2 + sge/swiss/shanghai) | ✓ |
| Zone J's physical grouping (the 3 physical cards under «بازار فیزیکی») | the flows group renders them flat — the grouping is THIS session's edit | the edit's basis verified |
| The Zone D band (R20's placement: the on-ramp as the band's third element) | `GoldPage.tsx` renders the `data-gold-zone-d-band` grid (GoldNarrative + GoldYieldDecomposition) | ✓ |
| `docs/localization/persian-copy-manifest.json` (the manifest gate, C7 rule 1) | exists (8,130 entries; round 85 is the last) | ✓ |
| `scripts/check-bundle-budget.mjs` (the GoldPage ceiling) | exists — the current line `GoldPage` at 116,000/27,500 (the S12-D6 bump; ~0.9 kB raw headroom) | ✓ (F7 ships its own measured bump) |
| The R15 surfaces (IF the drop had arrived): `GoldDemandStack.tsx` + `domains/gold/adapters/wgc-gdt.ts` + the R09 wall | not created — the drop did not arrive; nothing to re-verify | n/a (R15 pending) |

The s6/03 §2 module map's post-modularization addresses all hold on the
live tree (`features/gold/` + `domains/gold/` are the homes; the engine /
presentation split is the rule; the R5 no-renames constraint governs —
no file moves this session, only NEW files + in-place edits).

## 2. The R07 Treasury-rung outcome (M1(a), carried from S12-D4)

**The honest clock:** the first Treasury-primary collect fires **04:10 UTC
Nov 19** — and this session started **2026-11-18 ~21:18 UTC**, ~7 hours
BEFORE the rung. The flip therefore had NOT fired at this session's start,
exactly as S12-D4 recorded; the live readings still carry FRED provenance.

**The live reads (the production API, this session's start ~21:1x UTC):**

- `GET /api/insights` (generatedAt `2026-11-18T13:12:23.401Z`): `us10y`
  5.12 @ 2026-11-16 — **"FRED (DGS10)"**; `us30y` 5.46 @ 2026-11-16 —
  "FRED (DGS30)"; `real-yield-10y` 2.92 @ 2026-11-16 — "FRED (DFII10)";
  `fed-expectations` 0.955 — "FRED (DGS2 − policy-rate midpoint)";
  `sofr` 3.92 @ 2026-11-17 — "New York Fed via FRED (SOFR)".
- `GET /api/insights/pages/gold` (the /gold yield legs): the same FRED
  provenance on the R12 card's inputs (the projection is the 13:12Z
  snapshot's).
- `GET /api/insights/status`: the blob healthy — `failedSources: []`,
  staleCount 21, the validation summary 13/14 (T-04 the standing FRED-edge
  note carried since the gap-audit build).

**What this means for the session:** nothing blocks — this session's
deploys carry the R07 code unchanged from the S11/S12 deploys (the flip
rides the overnight rung whatever this session ships). **The re-check is
scheduled at this session's close** (if the clock has passed 04:10 UTC Nov
19 by then, the live readings re-read and the outcome recorded in the
summary; if not, the carry extends to S14's M1 honestly — the S12-D4
pattern, one more session).

## 3. The R15 drop-calendar re-check (M1(b))

**No WGC GDT data drop.** Three ways checked: (1) the private `data/wgc/`
path — absent (the repo's `data/` carries the registry files + the manual/
+ shiller/ folders, no wgc); (2) the owner's kickoff message — no drop
notice (the credentials block aside, nothing owner-authored); (3) the S12
close's standing item said "tell the P2 session when the quarterly release
arrives" — no such notice came. **R15 stays pending** (its slip destination
was P2, but the calendar — the owner's download on release day — governs;
nothing blocks on it). The wall's WGC CB line renders on; the ETF/prices
drops (R23/R25) ride the same calendar. The rest of P2 proceeds exactly as
scoped.

## 4. The session's build-time data probes (the rows' own planes)

**4a. The EODHD XAUUSD.FOREX live probe** (the row's required data, read
live against the publisher with the production key, this session ~21:2x
UTC): `GET eodhd.com/api/eod/XAUUSD.FOREX?period=d&from=2016-01-01` →
**361 rows, 2025-11-18 → 2026-11-18**, the last row `close 3,792.59` with
the provider's own trailing warning `"Data is limited by one year as you
have free subscription"`. Cross-check: the day's live gold reading (Yahoo
GC=F) 3,728.8 @ 2026-11-18 (the spot/futures gap the C1 series-naming
rule exists for — the chart and the TA band name their series, never
blending the legs). **The free-tier one-year depth is CONFIRMED LIVE** —
the roadmap's "one-time 10y fetch at build" is NOT available on this key;
the row's second branch applies (the percentile computed over the STORED
basis, the window disclosed at point of use). See D1 below.

**4b. The stored gold-usd history** (the public endpoint): 1,310 points
spanning 1,898 days — exactly the `PUBLIC_HISTORY_WINDOW_DAYS` bound; the
feed's own span is what it is. NOT usable as the TA basis: a different
series (gold-api/Yahoo legs) — C1 forbids mixing (the GPE-S3-04 lesson:
the DMA distance must be computed on the series the chart draws).

## 5. The session's design decisions (recorded here; DECISIONS.md at the end-of-program reconciliation)

- **S13-D1 — the OHLC ingest venue + the depth posture.** The s8/01 R18
  wording ("rides the markets worker's existing EODHD client") is honored
  as the CLIENT PATTERN (the EOD URL shape + parse + token injection + the
  `providerFetchEnabled('eodhd')` kill switch, reused verbatim from the
  markets providers module), with the daily collect registered in the
  **api worker's rung4 (04:35 UTC)** — the `insights-extra-rungs`
  registry, the cb-demand/tic twin — rather than on the markets worker's
  crons. Reasons: (a) the account's free 5-cron limit is FULL (the api
  minute cron + the markets worker's four) — no new trigger exists either
  way, and the extra-rung registry is the designed extension point for
  exactly this class of source; (b) the markets worker's invocations are
  budget-tight on worst-case days (its main run's combined worst case sits
  ≤48/50) and its job files are post-modularization leave-alone surfaces;
  (c) the rung4 arithmetic fits with margin: the registry's worst
  all-gates day becomes 1 (status) + 24 (fred-s3) + 10 (frb-ebp) + 10
  (ofr-fsi) + 4 (gold-xau) = **49 ≤ 50**; (d) the api worker already
  fetches external providers (FRED/ECB/IMF/ABS/PortWatch) and serves the
  route that reads the key — one worker owns the feature. The EODHD token
  becomes a new `EODHD_API_TOKEN` secret on `currena-api` (the same free
  key the markets worker holds; set at deploy time per §7 rules — never
  in any tracked file). **The depth posture:** the one-time build fetch
  seeds ~1 year (the free tier's ceiling — the probe's 361 rows), the
  daily appends grow it forward (the LBMA "124-month backfill" pattern
  applied at the plan's actual depth), and the distance-from-200DMA
  decile is computed over the STORED basis with the basis window named
  at point of use (the "server-side percentile10y" branch of the row) —
  honest now, self-widening when the owner's plan ever upgrades (the
  code treats the whole stored series as the basis; a plan upgrade simply
  deepens it via the trailing re-fetch).
- **S13-D2 — the F7 chart replaces the gold chip's fixed-range panel.**
  The VerdictStrip's GOLD chip's `MetalTrendChart` (the fixed-range
  TrendPanel with quarter/1y/5y/10y chips over the bounded gold-usd
  series) is superseded by `GoldPriceChart` (the EODHD OHLC leg; pan/zoom
  /log + the unit-aware header + the DMA overlays + the window as a user
  control). Silver's chip keeps its TrendPanel (OI-4, unchanged). This is
  the D6-A "widening rides F7/R18 where the window becomes a user
  control" made literal: the #01 mislabel dissolves by construction for
  the gold chart (the window word states the loaded span, computed from
  the data — the `trendRangeWord` discipline, now over the unbounded OHLC
  series). The R01 record's stale comment in `verdict.tsx` clears with
  it.
- **S13-D3 — the OHLC row-dating guard.** The EODHD forex EOD row dated
  TODAY can be a partial bar (the forex day wraps 22:00 UTC; the probe
  at 21:2x UTC already returned today's row). The ingest accepts only
  rows dated **≤ yesterday (UTC)** — final bars only; the trailing
  3-day re-fetch covers revisions (the TIC "revision-tolerant" pattern;
  a genuine revision wins on merge).

## 6. Method and limitations

All reads this milestone were live (the production API + the EODHD venue
probe, read-only; credentials used, not stored). The R07 flip could not be
verified for the honest clock reason recorded in §2 — it is scheduled for
re-check at the session's close, and no claim is made before that read.
The citation re-verification is read-only against the branch HEAD; the
live tree governs (zero renames, zero moves — the R5 constraint holds).
