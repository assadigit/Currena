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
