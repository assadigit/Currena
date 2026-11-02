# M6.1 — The New Zealand link: the measured evidence (2026-11-02)

The S6 spec's decision rule (G-6): *include New Zealand only if the measured
correlation is high and stable AND at least one structural link is verified
from an official source.* This file records the measurements, the structural
links and the decision. Raw data: `raw-series.json` + `measurements.json` +
`equity-correlation-detail.json` (this folder); the probe scripts ran
2026-11-02 13:20–13:45 UTC from the work venue with the repo's declared
honest UA.

## 1. The measurements

All correlations are Pearson r. "Full sample" = the 10-year window
2016-11 → 2026-11 unless stated. Rolling 1-year windows advance 21 trading
days; n = the number of windows.

| Link | Measure | Result | Stability |
|---|---|---|---|
| ASX 200 vs NZX 50 (local currency, daily returns) | full sample | **r = 0.31** (n = 2,226) | rolling-1y mean 0.27, min −0.02, p10 0.02, median 0.26, p90 0.47, max 0.51 (95 windows) |
| ASX 200 vs NZX 50 (weekly returns) | full sample | **r = 0.73** (n = 244 weeks) | high — the daily figure is attenuated by the ~2-hour close stagger (the NZX closes before the ASX; lag structure measured: same-day 0.31, ±1 day 0.18/0.09, ±2 days 0.05) |
| ASX 200 vs NZX 50 (USD terms, daily returns) | full sample | **r = 0.43** (n = 1,984) | rolling-1y mean 0.45, min 0.25, median 0.44, max 0.65 (83 windows) |
| AUD/USD vs NZD/USD (daily changes) | full sample | **r = 0.86** (n = 2,558) | rolling-1y mean 0.85, **min 0.62**, median 0.88, max 0.94 (110 windows) — high AND stable |
| AUD/USD vs NZD/USD (levels) | full sample | r = 0.87 (n = 2,559) | — |
| AU vs NZ 10-year yield (monthly levels, 1970-01 → 2026-09) | full sample | **r = 0.93** (n = 681) | the spread: mean +0.00pp, sd 1.47pp, p10 −1.06, p90 +1.70; latest (2026-09) AU 5.283 − NZ 4.94 = **+0.34pp** |

Data sources (each verified from the provider's own response, 2026-11-02):

- ASX 200 `^AXJO` (AUD) and S&P/NZX 50 `^NZ50` (NZD): Yahoo Finance chart
  API, range=10y, interval=1d — 2,529 / 2,502 daily closes. `^NZ50` is
  "S&P/NZX 50 INDEX GROSS (NZD)" per Yahoo's own meta (currency NZD,
  exchange NZSE) — the symbol verified live before any use.
- AUD/USD + NZD/USD: Frankfurter (ECB reference rates), USD base,
  2016-11-01 → 2026-10-30, 2,559 business days.
- AU 10y FRED `IRLTLT01AUM156N` and NZ 10y FRED `IRLTLT01NZM156N` (OECD
  monthly mirrors, both fresh through 2026-09).

Honest notes: the daily local-currency equity correlation (0.31) is the
weakest of the set — the close stagger and daily noise attenuate it; the
weekly horizon (0.73) and the USD-terms measure (0.43) recover the
connection. The strongest, most stable links are the currencies (0.86,
never below 0.62 in any 1-year window) and the long-yield levels (0.93
across 56 years).

## 2. The structural links (official sources, quoted verbatim)

1. **Banking integration** — Reserve Bank of New Zealand, "The banking
   sector" page (rbnz.govt.nz, last updated 2026-09-01, read 2026-11-02):
   > "New Zealand currently has 26 registered banks, with four large
   > Australian-owned banks (ANZ, ASB, BNZ and Westpac) responsible for
   > **84% of bank lending**."
   >
   > "Of the share of lending held by banks, Australian-owned banks hold
   > 84%, New Zealand-owned banks hold 10%, and other banks 6%."

2. **Trade integration** — New Zealand Ministry of Foreign Affairs and
   Trade, "CER overview" (mfat.govt.nz, read 2026-11-02):
   > "Australia is our most important trading partner, with two-way trade
   > accounting for **$32.76 billion in 2024**, and is the first export
   > market many New Zealand companies look to, to grow."

## 3. The decision

**INCLUDE.** The decision rule is met: the AUD/USD–NZD/USD correlation
(0.86 full sample, rolling-1y never below 0.62) and the AU–NZ 10-year
yield-levels correlation (0.93 across 1970–2026) are high and stable, the
weekly equity correlation (0.73) confirms the market link at the horizon
that filters the close stagger, and TWO structural links are verified from
official sources (the RBNZ's own 84%-of-bank-lending figure; MFAT's
$32.76bn two-way trade). The weakest measure (daily local-currency equity
correlation 0.31) is recorded above with its explanation — the inclusion
does not rest on it.

What ships (all context-only per G-5, in the au-external shadow lane unless
noted):

- **NZX 50** on the Australian markets board (Yahoo `^NZ50`, its own
  `newzealand` group, NZD-denominated — the board's currency note says so;
  the one-line leading/lagging summary keeps describing the Australian
  groups only).
- **`audnzd`** — AUD/NZD derived from the two Frankfurter legs (NZD
  rejoined the one timeseries request; zero new fetches).
- **`nz-short-rate`** — the OECD FINMARK monthly average (the honest mirror;
  see the naming note below).
- **`nz-10y`** — the FRED OECD monthly mirror (the bund/gilt sibling).

### The `nz-short-rate` naming note (honesty)

The spec asked for "the RBNZ Official Cash Rate". The RBNZ's own site
(rbnz.govt.nz) answers **403** to the work venue's honest UA (the RBA/
Akamai class — same block profile; recorded in VERIFIED-SOURCES). The FRED
OCR-family mirror `IRSTCI01NZM156N` is (a) **stale — frozen at 2024-12**
and (b) titled by FRED itself "Immediate Rates (< 24 Hours): Call
Money/Interbank Rate" — not the OCR. The licence-clean, fresh, honest
mirror is the OECD FINMARK `IR3TIB` series (NZL, monthly average, fresh
through 2026-09 = 3.13; 141 points since 2015-01) — but it is the
**short-term money-market rate**, so the card is named exactly that
("New Zealand short-term interest rate (monthly average)"), never the
Official Cash Rate. Cross-check: the OECD series reads 4.27 at 2024-12 vs
FRED's frozen 4.33 — different vintages of neighbouring-but-distinct
series; the OECD (the primary source) is the one wired. The current OCR
itself (2.75% after the 2026-10-28 decision, read 2026-11-02 from the
RBNZ's own page via a real-browser read) is recorded here as evidence
context only — it does not ship as a card because no production venue can
fetch it honestly.
