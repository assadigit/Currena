# World currencies — the evidence run (spec §6.6, build step 3)

**Run:** 2026-10-13T04:00:37.564Z · one-off history (Frankfurter currencies, Yahoo stocks/gold, FRED STLFSI4 — nothing from the EODHD free quota). Replayed **522 weeks** (2016-10-14 → 2026-10-09) through the production rule engine (R1–R7 incl. the §6.4 downgrade pass).

Thresholds below are the spec §6.3 starting values. Ali approves or adjusts them; nothing on the page shows these counts.

| Rule | Warning episodes | Weeks in Warning | Share of weeks | S&P next month after a Warning start (n · median) | Known episodes it caught |
|---|---|---|---|---|---|
| R1 · Nervous or relaxed? | 17 | 39 | 7.5% | 17 reads · median 0.8% · lower in 8 | 2018–19 (Fed hikes/trade), March 2020, 2022 (Fed sprint / yen), August 2024 (yen carry unwind), April 2025 |
| R2 · Yen carry trade | 10 | 15 | 2.9% | 10 reads · median 2.1% · lower in 3 | 2018–19 (Fed hikes/trade), March 2020, 2022 (Fed sprint / yen), August 2024 (yen carry unwind), April 2025 |
| R3 · Strong or weak dollar | 13 | 61 | 11.7% | 13 reads · median 2.1% · lower in 4 | 2018–19 (Fed hikes/trade), March 2020, 2022 (Fed sprint / yen) |
| R4 · Where does money hide? | 19 | 34 | 6.5% | 19 reads · median 2.8% · lower in 8 | 2018–19 (Fed hikes/trade), March 2020, 2022 (Fed sprint / yen), April 2025 |
| R5 · China link | 21 | 80 | 15.3% | 21 reads · median 0.8% · lower in 10 | 2018–19 (Fed hikes/trade), March 2020, 2022 (Fed sprint / yen) |
| R6 · Europe worry | 9 | 21 | 4.0% | 9 reads · median 0.5% · lower in 3 | 2018–19 (Fed hikes/trade), 2022 (Fed sprint / yen), August 2024 (yen carry unwind), April 2025 |
| R7 · Dollar or euro? (context) | 0 | 0 | 0.0% | 0 reads · median — · lower in 0 | — |

## The 13-week pattern check (§6.4)

Across all 3654 rule-weeks: **Holding 21% · Mixed 28% · Not holding 22%** (no data 29%).

## Reading the table

- A share of weeks in Warning well under 15% is the spec's usefulness bar: a rule that is almost always on, or never on, is useless.
- The S&P column is descriptive, NOT a backtest of predictive power: n is small, episodes cluster, and the middle result is the honest summary.
- The 2008 window falls before this run's Frankfurter-based grid (the basket needs all six currencies); the euro-crisis years fall outside the 10-year window too — the engine's earliest readable weeks start once every input exists.

## Verdict for Ali (thresholds)

The spec §6.3 starting values (verbatim above, in src/fx/definitions.ts) are the ones now live. Adjustments belong in that ONE config block.
