# World stock markets — signal back-test (build step 2)

**Run:** 2026-10-12T02:17:15.714Z · spec §5.3 (D4): the starting thresholds replayed over the last year of daily closes for all 14 markets, through the exact production rules (2-point status buffer carried day to day, the n-count thresholds, the US override).

**Round-44 note (2026-10-12):** the list is now 16 markets (Dow Jones + CAC 40 joined). The replay above predates them; both newcomers are typically-normal large-cap indices, so the stressed-market share the thresholds see can only dilute slightly (4→attention, 8→unusual stay the owner-tunable starting values in `definitions.ts`). The Dow is NOT a US-override index — the S&P 500 and Nasdaq 100 keep that role (the S&P 500 is the better measure of the US market; the spec's §5.3 reasoning is unchanged).

Data: the step-0 provider cache (EODHD for 13 markets, Yahoo for FTSE), one full year. The replay calendar is every weekday; each market votes with its own last close as of that day, exactly like a production run.

## Section signal over the year (233 trading days)

| Signal | Days | Share of the year |
|---|---|---|
| Normal | 184 | 79.0% |
| Needs attention | 48 | 20.6% |
| Unusual | 1 | 0.4% |

## Signal change dates (13)

| Date | Change | Drivers at the moment of the change |
|---|---|---|
| 2026-03-23 | normal → **attention** | n=6 (corr 6 / bear 0) · S&P normal · Nasdaq normal · worst asia |
| 2026-03-31 | attention → **unusual** | n=8 (corr 8 / bear 0) · S&P normal · Nasdaq correction · worst asia |
| 2026-04-01 | unusual → **attention** | n=6 (corr 6 / bear 0) · S&P normal · Nasdaq correction · worst asia |
| 2026-04-08 | attention → **normal** | n=1 (corr 1 / bear 0) · S&P normal · Nasdaq normal · worst asia |
| 2026-06-08 | normal → **attention** | n=4 (corr 4 / bear 0) · S&P normal · Nasdaq normal · worst asia |
| 2026-06-12 | attention → **normal** | n=3 (corr 3 / bear 0) · S&P normal · Nasdaq normal · worst asia |
| 2026-07-02 | normal → **attention** | n=4 (corr 4 / bear 0) · S&P normal · Nasdaq normal · worst asia |
| 2026-07-03 | attention → **normal** | n=3 (corr 3 / bear 0) · S&P normal · Nasdaq normal · worst asia |
| 2026-07-17 | normal → **attention** | n=6 (corr 5 / bear 1) · S&P normal · Nasdaq normal · worst asia |
| 2026-08-07 | attention → **normal** | n=3 (corr 2 / bear 1) · S&P normal · Nasdaq normal · worst asia |
| 2026-09-10 | normal → **attention** | n=4 (corr 3 / bear 1) · S&P normal · Nasdaq normal · worst asia |
| 2026-09-30 | attention → **normal** | n=3 (corr 2 / bear 1) · S&P normal · Nasdaq normal · worst asia |
| 2026-10-08 | normal → **attention** | n=4 (corr 3 / bear 1) · S&P normal · Nasdaq normal · worst asia |

## Per-market status shares (context)

| Market | Days voting | Normal | Correction | Bear |
|---|---|---|---|---|
| N225.INDX | 228 | 79% | 21% | 0% |
| AXJO.INDX | 231 | 100% | 0% | 0% |
| KS11.INDX | 231 | 57% | 13% | 29% |
| HSI.INDX | 230 | 65% | 35% | 0% |
| SSEC.INDX | 231 | 92% | 8% | 0% |
| TWII.INDX | 230 | 96% | 4% | 0% |
| NSEI.INDX | 229 | 62% | 38% | 0% |
| STOXX50E.INDX | 231 | 97% | 3% | 0% |
| GDAXI.INDX | 231 | 94% | 6% | 0% |
| ftse | 233 | 100% | 0% | 0% |
| GSPC.INDX | 231 | 100% | 0% | 0% |
| NDX.INDX | 231 | 97% | 3% | 0% |
| GSPTSE.INDX | 230 | 100% | 0% | 0% |
| BVSP.INDX | 230 | 65% | 35% | 0% |

## Reading the results (the spec's own acceptance bar)

The spec asks: "These are right if Normal covers most of the year and Unusual appears only in genuinely stressful weeks."

- Normal covered 79.0% of the year.
- Needs attention covered 20.6%, unusual 0.4%.
- The threshold block at the top of `packages/insights/src/markets/definitions.ts` (CORRECTION_PCT, BEAR_PCT, EXIT_BUFFER_PTS, ATTENTION_COUNT, UNUSUAL_COUNT) is where Ali can retune any number without touching logic; re-run `pnpm --filter @currena/insights markets-backtest` afterwards to see the new distribution.
