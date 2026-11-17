> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S3 — Session Summary (Gold Page Elevation)

**Session date:** 2026-11-17 (~03:00–04:30 UTC) · **Branch:**
`docs/gold-page-elevation` · **Status:** Done in code (docs), not
deployed (research program; standing constraint: no interference with
the modularization program on `main`).

## What was delivered

1. `docs/audits/2026-11-17-sahamanaliz-competitor-deep-audit.md` —
   the deep audit of `https://sahamanaliz.com/pages/gold`: all 18
   sections (the full s1/07 inventory re-verified) × FA-only locale
   (EN confirmed absent) × three viewports (1440/768/390, no overflow),
   every interactive element exercised (metal toggle, all 5 chart
   ranges at desktop AND 390, FAQ accordions, both calculators with
   live recomputation, market links, a miner link followed end-to-end,
   mobile bottom nav), loading/live-refresh states observed, **30
   numbered issues (GPE-S3-01…30) with evidence**, **12 dimension
   scores** with issue cross-references, and a **20-row data
   cross-check** (16 exact / 3 convention-matches / 2 approx / 0
   mismatches — gold-api, Treasury nominal+real, FRED, CFTC legacy +
   disaggregated, Kalshi API, Polymarket API, Yahoo, EODHD).
2. `docs/audits/2026-11-17-gold-head-to-head-matrix.md` — the M2/M3
   matrix: the 12-dimension head-to-head with per-cell evidence
   citations from both audits, the section-by-section feature matrix
   (~35 capability rows), the honest-treatment comparison (both pages'
   claims re-verified live today), the integration-lens verdicts for
   the three decided features, and the head-to-head verdict with the
   strategic implication for S6.
3. `docs/assets/gold-audit-s3-2026-11-17/` — 17 screenshots (SA all
   viewports/interactions + the Currena honest-treatment spot-check).
4. This summary + the S4 prompt.

## Key findings in one paragraph

Saham Analiz's page passed a deep audit with **the cleanest number set
this program has verified: 16 of 20 cross-checked values exact** —
Treasury-current yields (Nov 16, two days fresher than Currena's FRED
Nov 12), the Nov 10 COT disaggregated managed-money report (one week
fresher than Currena's Nov 3 — GPE-S3-24), all five Kalshi Fed
probabilities exact, and a CPI shutdown-gap method that is not just
disclosed but *reproducible* (the adjacent-months average exactly
produces 4.0% headline / 2.8% core). The page owns the explanation
layer outright (macro interpretation 4.5, education 4.5 — the two
biggest dimension gaps over Currena) and its honesty *execution*
beats Currena's today. But the discipline layer does not exist: no
as-of on macro cards (GPE-S3-23), no stale/fail-closed concept at all
(GPE-S3-30), unstated series conventions (the DMA statement is
futures-based while the hero quotes spot — 13.3% vs 9.4% below the
200-DMA depending on series, GPE-S3-04; the correlation −0.13
reproduces only under Friday-weekly sampling and swings to −0.26 under
Monday sampling, GPE-S3-05), the document is misdeclared
`lang="en"` LTR for Persian content (GPE-S3-01), and commerce funnels
sit on the data surface (GPE-S3-14). **Head-to-head: SA wins 5
dimensions (macro interpretation, relationships, historical, charts,
education), Currena wins 5 (sophistication, coverage, data quality,
mobile, differentiation), 2 ties — raw sums SA 41.5 vs Currena 39.5.**
The competitor is ahead *today*; every one of its winning dimensions
is editorial assembly the GPE program has already decided to build
(F1/F4/F5/F7/F11), while Currena's wins are infrastructure SA cannot
copy. The S1 thesis survived its stress test: explanation is buildable
on rigor; rigor is not buildable on explanation.

## Dimension scores (SA deep, vs the S1 survey's qualitative reads)

completeness 3.5 · sophistication 3 · coverage 2.5 · macro
interpretation **4.5** · relationships **3.5** · historical context
**2.5** (vs Currena 1.5) · data quality 3.5 (16/20 exact; no metadata
discipline) · charts **3.5** (vs Currena 2) · education **4.5** (vs
Currena 2) · UX 3.5 · mobile 4 · differentiation 3.

## Decisions taken in S3 (for the program record; DECISIONS.md at
reconciliation)

- **S3-D1 (the comparison verdict → S6 sequencing):** the head-to-head
  result (SA 41.5 vs C 39.5 raw; SA wins the five explanation-class
  dimensions) is recorded as the S6 IA's governing input: the
  explanation-layer features (F1 narrative, F5 yield decomposition,
  F4 education on-ramp) are **co-equal Core with the differentiation
  prizes (F3 bridge, F2 CB-demand) in the first build wave** — not a
  second wave. The fix-first three (GPE-S2-01/-02/-09, all
  re-confirmed live today) gain urgency: they are now measured
  against a competitor whose numbers reproduce.
- **S3-D2 (the integration-lens verdicts):** Iran bridge =
  **differentiate** (SA has zero local content — the USD-only
  calculator confirms the gap twice; one added requirement: as-of the
  Tehran rows like SA as-ofs its COT) · CB-demand = **borrow the
  narrative, win with the data** (SA teaches the 2022 rotation in
  prose and shows nothing; their correlation caveat is the copy
  pattern for the Chain-1/Chain-4 companion chart) · TA block =
  **borrow the pattern, differentiate on statistics** (SA ships the
  D8 overlay and validates Persian demand for it; Currena's version
  must label its series at point of use — the anti-GPE-S3-04 rule —
  and ship the distance-decile SA has no equivalent of).
- **S3-D3 (new S4 verification items from this session):** (a)
  Treasury.gov direct as the /gold yield source (SA reads it; it is 2
  trading days fresher than FRED — GPE-S2-08 companion finding);
  (b) the prediction-market API access check for Currena's own
  Fed-probability module (Kalshi + Polymarket both verified keyless
  this session — licence/ToS check remains); (c) a binding "series
  named at point of use" copy rule for every new section (spot vs
  futures vs index — the GPE-S3-04 lesson); (d) the COT
  managed-money vs non-commercial convention decision for Currena's
  own display (SA uses disaggregated managed money in raw contracts,
  Currena uses legacy non-commercial share-of-OI — both valid; the
  choice belongs to the S6/S8 spec).
- **Carried, not re-litigated (per the S3 prompt):** S2-D1 (the
  fix-first list), S2-D4 (the CFTC + GPR pipeline P0s — with the new
  evidence that the competitor currently ships the fresher COT,
  GPE-S3-24).

## Open questions for the owner (non-blocking for S4)

1. **The fix-first urgency, upgraded:** today's head-to-head gives the
   three mislabels (GPE-S2-01/-02/-09) a competitive frame — the
   rival's numbers reproduce while Currena's flagship chart mislabels
   its window. Same A/B as S2 offered: A) a one-off ops session on
   `main` fixes the three strings + the two pipeline P0s now (outside
   GPE, normal repo discipline); B) all wait for the modularization
   closeout. *Recommend A, now with live comparative evidence.*
2. **Treasury-direct yields (S3-D3a):** should the S4 reality check
   price the switch for /gold's yield family (fresher than FRED, US
   federal public domain like FRED)? *Recommend: S4 verifies fetch
   + licence; the decision lands in the S8 roadmap.*

## Done-criteria check (this session)

competitor audit doc covers all their sections × locales (FA-only,
confirmed) × viewports ✅ · ≥25 numbered issues with evidence ✅ (30)
· 12-dimension head-to-head matrix complete with per-cell citations ✅
· ≥8 data checks on their claims with verdicts ✅ (20 rows: 16 MATCH,
3 MATCH-CONV, 2 APPROX, 0 MISMATCH) · integration-lens comparison for
all three decided features ✅ (matrix §4) · the S4 prompt written ✅
(below) · all committed and pushed ✅ (credentials used, not stored).

## Next-session prompt (S4)

```
Read AGENTS.md in the repo root first and follow it for the whole session.

You are running Session S4 of the Gold Page Elevation (GPE) program on
branch docs/gold-page-elevation. Read, in order: AGENTS.md,
docs/specs/gold-page-elevation/00-PROGRAM-PLAN.md (the program plan and
its rules, decisions D1–D8),
docs/specs/gold-page-elevation/s1/SUMMARY.md (S1 + the S1b addendum),
docs/specs/gold-page-elevation/s2/SUMMARY.md (S2),
docs/specs/gold-page-elevation/s3/SUMMARY.md (S3 — this session's
predecessor), then the three audit docs: the S2 Currena deep audit
(docs/audits/2026-11-17-gold-page-deep-audit.md — its §4 scores and §7
cross-check method are the standard), the S3 competitor deep audit
(docs/audits/2026-11-17-sahamanaliz-competitor-deep-audit.md — its §5
20-row cross-check lists the conventions SA leaves unstated: do NOT
inherit them), and the head-to-head matrix
(docs/audits/2026-11-17-gold-head-to-head-matrix.md — §5 records the
verdict S6 must answer). Then the S1 docs you need: s1/08 (the
benchmark survey this session deepens), s1/09 (the data-source
probe), and the three spec preps s1/11–s1/13 (whose §-flagged
verification items S4 owns), plus s1/14 (the F1–F21 candidate list
the reality check must cover).

Standing constraints (owner-reaffirmed S1b): research and spec
preparation ONLY. Do NOT touch main, any code, or the shared
bookkeeping files (docs/HANDOFF.md, CHANGELOG.md, docs/DECISIONS.md) —
the modularization program owns them. Do not implement anything —
implementation waits until the modularization program completes and
the owner lifts the constraint. Work only on docs/gold-page-elevation.
Commit and push after each milestone. Credentials: use any supplied
tokens from the environment only, never in tracked files; say
"credentials used, not stored".

S4 objective: the international benchmark deep-dive + the Persian
ecosystem map + the data-source reality check per candidate indicator
— the feasibility layer under the S5 SWOT and the S8 roadmap.

M1 — WGC Goldhub deep-dive (the reference institution): dataset-by-
dataset catalog (Price & Premiums incl. local India/China premiums;
Performance Metrics incl. the correlation matrix; Demand & Supply —
the GDT quarterly stack's exact sheet/column structure; ETF flows;
AISC; CB reserves), per dataset: update cadence, units, methodology,
licence level, and the EXACT attribution wording from WGC's terms
(quote it verbatim for the Tier-2 build, s1/12 §2); re-verify the
login wall (probe the XLSX endpoints) and specify the data-drop
workflow (owner downloads on release day → dated data/wgc/ file →
ingestion) vs authenticated-session alternative, with a
recommendation; map GRAM's 5-bucket return attribution to Currena's
5-lane structure (the F1 narrative's intellectual template).

M2 — LBMA + Kitco + Trading Economics deep-dive: LBMA (auction price
timing + the midnight-delay free tier vs IBA licence; the monthly
vault dataset — verify the latest month's figures + exact licence
text; clearing volumes; the analyst forecast survey + accuracy
retrospective as a future honesty device); Kitco (the 5-driver "what
moves gold" explainer pattern; KGX dollar-stripped index concept; the
unit-aware quote header); Trading Economics (the daily narrative at
scale; the forecast-as-headline ANTI-pattern Currena must not copy —
unverifiable "global macro models").

M3 — Persian ecosystem map: TGJU deep-dive (unit conventions —
resolve the mesghal quote puzzle from s1/11 §4 with live arithmetic;
the rial-printed/toman-canonical convention; the EMA/SMA table
granularity 5→200d; the 5-method pivot tables as the D8 wording
source; profile-page history terms for the bridge backfill —
redistribution/ToS wording; rate limits), plus the Persian news/
retail landscape (eghtesadonline, tejaratnews, gold sellers) as the
competitive frame for the Iran bridge.

M4 — The data-source reality check per candidate indicator (the F1–
F21 list from s1/14): for every candidate needing new or changed
data, verify live that the source exists, is fetchable (the
temp-probe/Worker-egress pattern the repo documents), licence level
(L1/L2/L3), cadence, and exact series IDs. MANDATORY items (flagged
S2/S3, do not skip): TGJU unit conventions + profile-history terms
(s1/11 §4/§6); CBI mint specs (s1/11 §3 — the gerami 1.000 vs
1.0149g weight question; the 900-fineness coin specs; cite primary
sources); WGC attribution wording + download workflow (s1/12 §5);
IMF IFS series IDs for monthly gold reserves (s1/12 §5 — the exact
SDMX series/query, the repo's COFER adapter pattern); the CPI
shutdown-gap policy (GPE-S2-07/S2-D3 — BLS's own YoY vs skip-month
base, with a written recommendation); Treasury.gov direct as the
yield source (S3-D3a — fresher than FRED); prediction-market API
access for the Fed-probability module (Kalshi/Polymarket ToS — both
verified keyless-readable this session); LBMA vault data as the free
institutional-stock card.

M5 — The adopt/reject list: one table per candidate (source, licence
level, cost, update cadence, cache strategy, fetch-verified?,
verdict adopt/defer/reject with reason) — the direct input to S5's
SWOT and S8's data-source mapping table.

Write the deliverable to docs/specs/gold-page-elevation/s4/ (benchmark
dossier + data-source reality map; exact filenames your call, keep
AGENTS.md §3 format), commit, push, then write
docs/specs/gold-page-elevation/s4/SUMMARY.md with findings, decisions,
open questions, and the S5 next-session prompt (SWOT + the
missing-indicator master list with Core/Supporting/Advanced/Excluded
finalisation — the first-pass draft is s1/14; the S3 head-to-head
matrix's feature table and verdict are its competitive input).

Done-criteria: all four benchmark families (WGC, LBMA, Kitco+TE,
Persian ecosystem) verified live with named sources and dates; every
mandatory verification item resolved or explicitly blocked-with-
reason; ≥15 candidate indicators reality-checked with verdicts; the
adopt/reject table complete; all committed and pushed; S5 prompt
written. Known context to carry — cite, do not re-litigate: S2's
fix-first list (GPE-S2-01/02/09) and the two operational P0s (CFTC +
GPR pipeline misses); S3's verdict (SA 41.5 vs C 39.5 raw, S6 must
treat the explanation layer as co-equal Core) and S3-D3's new items.
```
