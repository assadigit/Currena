# World currencies — the evidence run (spec §6.6, build step 3)

**Run:** 2026-10-14T01:20:11.713Z · one-off history (Frankfurter currencies, Yahoo stocks/gold, FRED STLFSI4 — nothing from the EODHD free quota). Replayed **522 weeks** (2016-10-14 → 2026-10-09) through the production rule engine (R1–R7 incl. the §6.4 downgrade pass).

**v1.3 changes under test** (change request §3): R3 now fires on a one-month move of ±3.0% OR a three-month move of ±4.0% (the M1/M3 columns below split the two legs), and R7 works in dollar strength (dollar-led / euro-led / no card). The replay grid is WEEKLY, so shares are shares of weeks — the closest honest proxy for the change request's "share of days".

Thresholds below are the spec §6.3 starting values + the v1.3 additions (`R3_DOLLAR_M1_STRONG = +3.0`, `R3_DOLLAR_M1_WEAK = −3.0` in src/fx/definitions.ts). Ali approves or adjusts them; nothing on the page shows these counts.

| Rule | Warning episodes | Weeks in Warning | Share of weeks | S&P next month after a Warning start (n · median) | Known episodes it caught |
|---|---|---|---|---|---|
| R1 · Nervous or relaxed? | 17 | 39 | 7.5% | 17 reads · median 0.8% · lower in 8 | 2018–19 (Fed hikes/trade), March 2020, 2022 (Fed sprint / yen), August 2024 (yen carry unwind), April 2025 |
| R2 · Yen carry trade | 10 | 15 | 2.9% | 10 reads · median 2.1% · lower in 3 | 2018–19 (Fed hikes/trade), March 2020, 2022 (Fed sprint / yen), August 2024 (yen carry unwind), April 2025 |
| R3 · Strong or weak dollar **(v1.3)** | 21 | 74 | 14.2% · M1-leg 56w (10.7%) · M3-leg 90w · supportive 72w | 20 reads · median 2.9% · lower in 6 | 2018–19 (Fed hikes/trade), March 2020, 2022 (Fed sprint / yen) |
| R4 · Where does money hide? | 19 | 34 | 6.5% | 19 reads · median 2.8% · lower in 8 | 2018–19 (Fed hikes/trade), March 2020, 2022 (Fed sprint / yen), April 2025 |
| R5 · China link | 21 | 80 | 15.3% | 21 reads · median 0.8% · lower in 10 | 2018–19 (Fed hikes/trade), March 2020, 2022 (Fed sprint / yen) |
| R6 · Europe worry | 9 | 21 | 4.0% | 9 reads · median 0.5% · lower in 3 | 2018–19 (Fed hikes/trade), 2022 (Fed sprint / yen), August 2024 (yen carry unwind), April 2025 |
| R7 · Dollar or euro? (context) **(v1.3)** | 0 | 0 | 0.0% · dollar-led 106w (20.3%) · euro-led 0w · EUR/USD ≥2.5% in 107w | 0 reads · median — · lower in 0 | — |

## The 13-week pattern check (§6.4)

Across all 3654 rule-weeks: **Holding 21% · Mixed 28% · Not holding 22%** (no data 29%).

## Reading the table

- A share of weeks in Warning well under 15% is the spec's usefulness bar: a rule that is almost always on, or never on, is useless.
- The S&P column is descriptive, NOT a backtest of predictive power: n is small, episodes cluster, and the middle result is the honest summary.
- The 2008 window falls before this run's Frankfurter-based grid (the basket needs all six currencies); the euro-crisis years fall outside the 10-year window too — the engine's earliest readable weeks start once every input exists.

## Verdict for Ali (thresholds)

The spec §6.3 starting values (verbatim above, in src/fx/definitions.ts) are the ones now live. Adjustments belong in that ONE config block.

## The v1.3 decision rule (change request §3.1/§4)

Keep the starting thresholds unless a rule fires on more than 25% of days or never fires despite known episodes. The M1/M3 and dollar-led/euro-led splits above are the evidence for the two new behaviours; any change is recorded in docs/DECISIONS_FOR_ALI.md.
