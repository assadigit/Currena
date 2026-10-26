# Baseline test results — the new checks run against the 15 Oct export

AGENT_RUNBOOK Phase 1: "Run these tests against the baseline fixtures. For
each defect they must fail, proving they catch it."

- Fixture: `tests/fixtures/insights-baseline-2026-10-15.json`, parsed from
  `docs/insights/baseline/currena-insights-full-2026-10-15.md` by
  `packages/insights/scripts/parse-baseline-export.ts` (9 tables, 51
  indicator rows, no interpretation).
- Runner: `corepack pnpm --filter @currena/insights exec tsx
  scripts/baseline-defect-check.ts` — the checks live in
  `packages/insights/src/validation-step3.ts` (pure functions).
- Date run: 2026-10-16.
- The T-01…T-14 suite already existed and passed on live data before this
  branch (see CURRENT_STATE_REPORT S-03/S-06); the baseline export cannot
  feed those series-level tests directly — the checks below are the ones
  this runbook asked for, and each defect-derived one FAILS on the
  baseline, which is the proof it catches the defect. T-19 PASSing on the
  baseline is correct: the audit found no advice wording in the 15 Oct
  text (its defects are different ones), so a pass there is the honest
  result, not a skipped test.

| id | check | result | failures (verbatim) |
|---|---|---|---|
| E-04 | Frozen daily series (single-snapshot precision fingerprint) | FAIL | copper-usd: daily price carries 6 decimals (14772.999807) — stale cache fingerprint, mark stale |
| E-05 | Identical daily moves on unrelated symbols | FAIL | identical daily move -0.44% on unrelated symbols: KOSPI, Nifty 50 — check for a copy/mapping bug ; identical daily move -1.11% on unrelated symbols: S&P/TSX Composite, S&P 500 — check for a copy/mapping bug |
| E-06 | Daily series past max age carry the stale tag | FAIL | au-10y: 8 days old (max 4) but status 'Needs attention' — must show the stale tag ; rba-expectations: 8 days old (max 4) but status 'Normal' — must show the stale tag ; au-us-10y-gap: 8 days old (max 4) but status 'Normal' — must show the stale tag |
| E-10 | M2 stored in billions, unit says so | FAIL | m2-us: value 23342.8 is a billions figure but unit reads 'trillion' — store 'US$ billion' |
| E-11 | US interest bill stored as a percentage | FAIL | govt-interest-revenue: fraction 0.335539 labelled '%' — store the percentage (33.55) |
| E-18 | Trend labels reproducible from the stated rule | FAIL | DAX: 3-month change 1.54% → rule says 'Up', card says 'Down' ; Nasdaq 100: 3-month change 3.19% → rule says 'Up', card says 'Flat' ; S&P/TSX Composite: 3-month change 0.69% → rule says 'Flat', card says 'Down' ; FTSE 100: 3-month change 1.44% → rule says 'Up', card says 'Flat' ; S&P 500: 3-month change 2.46% → rule says 'Up', card says 'Flat' |
| E-24 | Export price table carries the peak columns | FAIL | price table lacks the 'Peak' column ; price table lacks the 'Peak date' column ; price table lacks the 'Peak basis' column ; price table lacks the 'Below peak %' column |
| T-22 | Highest-since: the year comes from the full stored history | FAIL | us10y baseline row (value 5.21%, 10-year position 0.995994) carries no highest-since year — the export cannot prove the claim from its own data |
| T-19 | No advice wording in generated text | PASS | — |

Result: **1 pass · 8 fail** — every defect-derived check fails on the
baseline data exactly as the audit recorded it. Notes:

- E-05 also flags KOSPI/Nifty 50 (-0.44% both) — the check flags identical
  2-dp moves for human eyes; the defect file names the S&P/TSX pair, which
  is flagged.
- T-19's one deliberate mask: the ratio sentence "One bitcoin buys 19.6 oz
  of gold / about 1430 oz of silver" is arithmetic the Step 3 spec keeps
  (E-12's fix keeps that orientation), so it is not treated as advice; the
  repeated-on-every-row problem is defect E-13 and is fixed in Phase 2.
- E-06's authority: the defect file classifies the RBA F2 yield family as
  daily (max age 4 days); the registry's weekly label is part of the
  defect and is re-labelled in Phase 2.


---

## v3 package re-run (2026-10-20, Phase 1 of the v3 runbook)

Re-run against the SAME fixture (`tests/fixtures/insights-baseline-2026-10-15.json`)
after the v3 spec package landed: the defect checks still FAIL on the
baseline (the proof they catch it), T-19 still PASSes honestly.

New since the v2 run (all GREEN on current data, red only where the v3 UI
has not landed yet):

| id | check | status |
|---|---|---|
| T-25 | honest declared UA on every Insights fetch (fetch-policy) | green (fetch-policy.test.ts, collect-gates.test.ts, adapters/markets pins) |
| T-26 | terms gate: enabled sources record terms lines + date + level | green (sources.test.ts, registry-sync pins) |
| T-27 | 403/418/429/bot-check → "blocked by the site", one request, no circumvention | green (fetch-policy + collect-gates) |
| T-28 | definitional sanity ranges reject out-of-range values | green (sources.test.ts, snapshot-gates.test.ts) |
| T-29 | format change → "format changed" + status message | green (collect classification + builder gate; adapters throw FormatChangedError) |
| T-30 | new L2 sources disabled by default — never requested, never shown | green (sources.test.ts, collect-gates.test.ts, registry-sync) |
| T-31 | an L3 leg is never requested | green (sources.test.ts legMayBeFetched) |
| T-32 | one request per source document per refresh (no retries; RBA F2 fetched once) | green (collect-gates.test.ts) |
| T-33 | manual-entry expiry (exists since v2) | green (snapshot.test.ts E-08) |
| T-34 | CNN-vs-VIX directional cross-check | green (validation-step3 crossCheckFngVsVix; the CNN source itself stays disabled) |
| T-35 | relationship summaries: "Trigger not present", N-of-M match counts, per-leg markers | green (connections.test.ts — engine ready; the UI copy lands in Phase 6) |
| T-24 | public minimisation + panic switch + owner-only export | green (apps/api routes/insights-mitigations.test.ts — 96 new tests) |

U-01..U-14 (the UI acceptance suite): the Playwright harness EXISTS and
runs (`pnpm --filter @currena/web run visual:test`, fixtures served from
disk — never live). Baseline measured 2026-10-20: **9 pass** (U-02 overflow
at 768/1200, U-04a vocabulary, U-05, U-06, U-07, U-08a, U-10, U-11, U-12,
U-13, U-03-dark) and **9 expected-fail** — the honest red list the Phase 6
UI work must turn green (U-01 hero, U-02 360px overflow, U-03 light-theme
contrast, U-04b v3 vocabulary, U-08b match summary, U-09/U-09a balance,
U-14 export auth). Screenshots live in `docs/insights/screenshots/`.
