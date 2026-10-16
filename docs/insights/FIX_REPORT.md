# FIX_REPORT.md — the insights-rebuild report (AGENT_RUNBOOK Phase 6)

Report date: 16 October 2026 (UTC). Branch: `insights-rebuild`.
Scope: every ID in `INSIGHTS_DEFECTS_2026-10-15.md` (E-01…E-24) and every ID
in `INSIGHTS_FIX_SPEC.md` (Parts A–D). The Parts A–D implementation of
15 October is reported in `docs/insights/FIX_REPORT-2026-10-15.md` (per-ID
evidence; commits 2dd2eae…aeb701d on main); this report re-verifies each
part against this branch and records the defect fixes.

Verification tooling on this branch:
- the T-01…T-14 engine suite (`packages/insights/src/validation.ts`), run on
  every ingest AND by `pnpm --filter @currena/insights selfcheck`;
- the Step 3 / defect checks (`packages/insights/src/validation-step3.ts`),
  each defect-derived check proven to FAIL on the 15 Oct baseline
  (`docs/insights/baseline-test-results.md`) and pass on the fixed pipeline
  (unit tests + the fresh self-check);
- `docs/insights/SELF_AUDIT.md` — the latest full-suite result (19/19 pass).

## 1. The defect file (E-01…E-24) — all done

| ID | Status | How checked |
|---|---|---|
| E-01 Yahoo private-only | **done** | The registry generator walks each card's UPSTREAM legs (`scripts/generate-indicators-registry.ts` UPSTREAM_LEGS): brent/gold-usd/silver-usd/btc-usd carry a Yahoo leg → `publicDisplayOk: 'no'` in `data/indicator-audit.json`; T-15 refuses any public build while one remains. Yahoo stays only as the flagged fallback the spec's LR-02 keeps where no permitted free source exists (FTSE 100 has none). |
| E-02 gold-api terms | **done** | `licences.ts` GOLD_API records the quoted terms §9 ("Commercial use of the API is always permitted…"); RE-VERIFIED first-hand 2026-10-16 by fetching gold-api.com/terms from this venue — the quote matches verbatim. |
| E-03 futures wording | **done** | The Brent/gold/silver tiles (PricesBoard contextParts) and the export price detail lines open with the futures note (copy key `ui.exportFuturesNote`, en+fa). |
| E-04 frozen daily series | **done** | T-08 tightened to ZERO exact repeats on daily series — in-series and cross-day vs the previous snapshot (validation.ts, `previousReadings`); the check functions exist in validation-step3 (proven on the baseline). Two new unit tests pin both halves. |
| E-05 identical moves | **done** | `checkE05IdenticalMoves` wired into the markets run report (`markets/run.ts` moveWarnings, ⚠ lines in formatRunReport). No copy/mapping bug found: the id→symbol map is 1:1 (markets/definitions.ts). |
| E-06 AU yields stale | **done** | au-10y / rba-expectations / au-us-10y-gap are DAILY with `staleAfterDays: 4`; an older F2 row wears the stale tag (scoring.ts machinery). checkE06 proven on the baseline. |
| E-07 quarterly labels | **done** | Quarterly readings carry `periodStart`/`periodEnd` (core schema, additive); both source bases (ABS/FRED quarter-start, RBA E2 quarter-end) label the SAME quarter; `dataPeriodText` names the quarter from the stored period end; snapshot tests pin both bases. |
| E-08 manual expiry | **done** | Manual files REQUIRE `enteredOn`/`expires` (zod — an undated file fails loudly); china-pmi.json dated (entered 2026-10-15, expires 2026-10-31 = the next NBS release); an expired entry shows stale with its E-08 reason; MAINTENANCE.md documents the monthly update. |
| E-09 past calendar events | **done** | `buildInsightsSnapshot` keeps only today-and-future events; the export and the page's Next-up strip can never list a released event. |
| E-10 M2 scale | **done** | The export + CSV cells carry the DISPLAYED value (`exportValue` applies the display scale — 23.3 under "trillion"); the self-check's E-10 run reads the scaled cells. |
| E-11 interest bill | **done** | The engine stores the TRUE percentage (33.55); the display scale is retired; the web test pins the render. |
| E-12 BTC orientation | **done** | Retitled to the stored orientation: "Bitcoin priced in gold/silver (BTC per ounce)" (definitions + en/fa copy). |
| E-13 repeated BTC line | **done** | The sentence renders on the bitcoin row only (PricesBoard + full-export guards). |
| E-14 NSA CPI | **done** | US inflation computes from CPIAUCNS/CPILFENS (the BLS headline basis; T-16 scan covers both, public-domain). Compare-with-BLS note: the ingest venue should re-check the published figure on the next CPI day — recorded in MAINTENANCE. |
| E-15 Fed midpoint | **done** | fed-expectations = DGS2 − (DFEDTARL+DFEDTARU)/2 (L2-08). |
| E-16 Fed range + dates | **done (verified)** | rangeLow/rangeHigh attach from DFEDTARU and the card renders the corridor; "decided · effective" rides data/policy-decisions.json (fed-target entry present) + CompactRow's decidedEffectiveLine — no new code needed; pinned by existing tests. |
| E-17 T10YIE | **done (verified)** | T10YIE is fetched (FRED_SERIES.breakeven10y) and T-01 consumes it; T5YIFR stays the 5y5y card. No new card (the defect asks for the reconciliation series, not a hero-count change). |
| E-18 trend labels | **done** | The engine's trendOf IS the 3-month rule (≥+1 Up, ≤−1 Down); the export + CSV recompute from chg3m (the number beside the label); the page already did (Step-1 F2). |
| E-19 trigger leg | **done** | Connections carry a TRIGGER leg; without its move the card reads "Not showing" (the audited 'Partly active with oil falling' case). New unit tests pin it. |
| E-20 window documentation | **done** | The uniform method unchanged; every leg's windows documented in the registry comments and the module doc; L3-02's wording change removes the confusing verdict words. |
| E-21 Unusual tier | **done** | The export + CSV status columns use the page's two-tier word (tierOf) — a 95th-percentile row reads "Unusual", never plain "Normal". The rule did not change, so no rule-change-log entry is needed (the loss was export-side). |
| E-22 L2-01 words | **done** | Near its high / Pullback / Correction / Bear market, from the closing-basis distance (statusWordKeyOf); the page tiles/table + full export + markets CSV all read it; the coarse band still drives the summary counts. |
| E-23 audit columns | **done** | The indicators export block carries Published / Stale(with age) / Source URL / Licence / Private only / Public display OK / Rule version / Thresholds(rule JSON) — backed by the generated sidecar `data/indicator-audit.json`. |
| E-24 peak columns | **done** | The export price table carries Peak / Peak date / Peak basis / Below peak %; T-05 floors verify the values (gold 5590 on 2026-01-28 pinned in the export test). |

## 2. The fix spec (Parts A–D) — re-verified on this branch

Part A (A-01…A-08): **done** — the 15 Oct report's evidence stands
(`FIX_REPORT-2026-10-15.md` §Part A); this branch adds the licence block to
the registry (Step 3 §8) and the audit sidecar. A-03/A-04 now also cover the
daily frozen-value class (E-04).

Part B (B-01…B-19): **done** — evidence in `FIX_REPORT-2026-10-15.md`
§Part B; B-09's stale machinery now also tags the AU yield family (E-06);
B-01's peaks now also ride the export (E-24).

Part C (C-01…C-07): **done** — evidence in `FIX_REPORT-2026-10-15.md`
§Part C.

Part D (T-01…T-14): **done** — the suite runs on every ingest, in CI unit
tests, and in the daily self-check; T-08 was tightened (E-04) and T-19's
matcher refined to the advice sense with named masks (commit history).

## 3. Not-verified items

| Item | What is missing |
|---|---|
| E-14's compare-with-BLS | The NSA YoY numbers should be eyeballed against the BLS release on the next CPI day (the ingest venue can fetch www.bls.gov); the series switch itself is verified. |
| World Bank / ECB / Frankfurter / Bitstamp verbatim terms | Their pages are JS-rendered; the register marks them `unknown` → fail closed in public mode. Read in a browser at the quarterly licence review. |
