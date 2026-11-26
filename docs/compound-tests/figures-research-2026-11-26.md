# W4 figures research record — 2026-11-26 (UTC)

Every row of `src/lib/compound/figures.ts` re-verified in this sitting. Sources
opened and read on this date; derived rows recomputed independently with the
working below. No number is taken from memory.

## Sources opened today (all reachable except where noted)

| Source | URL | What was read | Result |
|---|---|---|---|
| Vanguard Australia 2026 Index Chart (Andex) | fund-docs.vanguard.com/AU-Vanguard_Index_Chart_poster.pdf | the returns table + footnotes | AU shares 20y **7.2** / 30y **9.0**; U.S. Shares (S&P 500 TR in AUD) 20y **11.8** / 30y **10.8**; International Shares (MSCI World ex-Aus Net TR AUD) 20y **9.1** / 30y **8.6**; Cash (Bloomberg AusBond Bank Bill) 20y **3.3** / 30y **4.0**; CPI 20y/30y **2.7**/**2.7**; as at 30 June 2026 — **every AUD share row matches the figures file exactly** |
| NYU Stern — Damodaran histretSP.xls | pages.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xls | the "Returns by year" and "Gold Prices" sheets | S&P 500 (incl. dividends) 2006–2025 = **×7.9205 → 10.90%/yr**; 1996–2025 = **×18.7103 → 10.26%/yr**; CPI 2006–2025 = **×1.6475 → 2.53%/yr**; 1996–2025 = **×2.1123 → 2.52%/yr**; gold year-ends **387.00 (Dec 1995), 513.00 (Dec 2005), 4,339.645 (Dec 2025)** — **all match the file** |
| MSCI World Index (USD) factsheet | msci.com/documents/10199/255599/msci-world-index.pdf | cumulative gross-return chart + performance table, 30 Oct 2026 | 100 → **562.23** over Oct 2011–Oct 2026 = ×5.6223 → **12.20%/yr** (15y); 10y 13.50; since 31-Dec-1987 8.98 — **matches the file** |
| BIS CBPOL bulk CSV | data.bis.org/static/bulk/WS_CBPOL_csv_col.zip | monthly policy-rate series | AU 20y to Oct 2026 mean **3.0321%**, 30y **3.7561%**; US 20y **1.6953%**, 30y **2.4052%** (240/360 month-ends) — **all match the file (3.03/3.76/1.70/2.41)** |
| BIS XRU bulk CSV | data.bis.org/static/bulk/WS_XRU_csv_col.zip | daily FX month-ends (AUD per USD) | Dec 1995 **1.343187**, Dec 2005 **1.365517**, Dec 2025 **1.496255**; Sep 2006 1.34218; Sep 1996 1.261358; Sep 2026 1.435227; Jun 2006 1.352153; Jun 2026 1.451992 — **the three Dec month-ends match the file's FX exactly** |
| ABS latest CPI release (Oct 2026) | abs.gov.au/.../consumer-price-index-australia/latest-release | headline + latest-release text | **CPI annual inflation 4.9% in the 12 months to October 2026** (up from 4.3% to September); monthly all-groups index (Sep-2025=100 base) Sep 2026 = 104.34, Oct 2026 = 104.91 — the W3 honesty figure |
| ABS media release (Sep 2026) | abs.gov.au/media-centre/media-releases/cpi-rose-43-year-september-2026 | headline | **CPI rose 4.3% in the 12 months to September 2026** |
| FRED CPIAUCNS | fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCNS | full monthly index | 12m to Sep 2026 = **3.7355%**; 20y Dec05→Dec25 **2.5250%/yr**; 30y Dec95→Dec25 **2.5220%/yr** — **cross-checks the Damodaran-derived US inflation rows (2.53/2.52) within 0.01 points** |
| BLS September CPI release (text via search + DOL mirror) | bls.gov (page IP-blocked; the release text read via search results and dol.gov/newsroom/economicdata/cpi_10142026.pdf snippet) | headline 12-month line | **"Over the last 12 months, the all items index increased 3.7 percent"** (September 2026 data) — the US W3 honesty figure. The October 2026 release states the 12-month rate was **not estimated** (the 2025 shutdown left no October 2025 base) |

## Derived rows recomputed today (tolerance 0.05 points)

- **Gold AUD (spec §6.3):** 20y: USD ×8.4593 (513.00 → 4,339.645) × (0.732323 ÷ 0.668335) = ×9.2693 → **11.78%/yr**. 30y: ×11.2136 × (0.744498 ÷ 0.668335) = ×12.4914 → **8.78%/yr**. USD-only: **11.27%** / **8.39%**. All match the file.
- **US S&P 500:** ×7.9205 → **10.90%**; ×18.7103 → **10.26%**. Match.
- **US CPI:** ×1.6475 → **2.53%**; ×2.1123 → **2.52%**. Match (FRED cross-check 2.5250/2.5220).
- **Cash averages:** recomputed from the raw BIS series (see table above). Match.

## Cross-checks against independent published figures

| Row | Our figure | Independent figure | Source | Gap | Explanation |
|---|---|---|---|---|---|
| AU shares 20y | 7.2% (All Ordinaries TR, to 30 Jun 2026) | 6.97% (S&P/ASX 300 Accumulation, to 30 Sep 2026) | Colonial First State "Investment essentials" — **the spec's own recorded reference; the PDF itself is IP-blocked from this sandbox (403 F5 firewall)** | 0.23 pts | index difference (All Ordinaries vs ASX 300) + the 3-month date offset the spec sanctions; under 0.5 |
| World shares A$ 20y | 9.1% (MSCI World ex-Aus Net TR AUD, to 30 Jun 2026) | 8.95% (MSCI World Net, A$, to 30 Sep 2026) | CFS (same spec-recorded reference) | 0.15 pts | same; under 0.5 |
| Cash AU 20y | 3.03% (RBA cash-rate target average, to Oct 2026) | 3.25% (Bloomberg AusBond Bank Bill, to 30 Sep 2026) CFS; 3.3% (same index, to 30 Jun 2026) Vanguard | CFS (spec-recorded) + Vanguard (read today) | 0.22 / 0.27 pts | basis difference: bank-bill indices track the cash rate plus a small spread; the spec prescribes the policy rate |
| Cash US 20y | 1.70% (Fed target midpoint average, to Oct 2026) | 1.68% (effective fed funds, 20y window) | NY Fed EFFR — recorded in the previous session's research; not re-read this sitting (nyfed.org not probed) | 0.02 pts | effective vs target midpoint; negligible |
| US inflation 20y/30y | 2.53%/2.52% (Damodaran annual CPI) | 2.5250%/2.5220% (FRED CPIAUCNS index) | FRED (read today) | ≤0.01 pts | same series, annual vs monthly endpoints |
| AU inflation 20y/30y | 2.76%/2.71% (ABS quarterly endpoints, Sep 2006→Sep 2026 / Sep 1996→Sep 2026) | 2.7%/2.7% | Vanguard 2026 Index Chart (read today) | 0.06/0.01 pts | different index vintage (to 30 Jun 2026); under 0.5 |
| S&P 500 AUD 20y | 11.8% (Vanguard, read today) | 10.90% USD (Damodaran) × FX effect ≈ +0.5pt/yr | Damodaran + BIS FX (recomputed today) | ~0.4 pts | the AUD depreciation (0.7323 → 0.6683 USD per AUD) adds ≈ +0.46%/yr to the USD return: 10.90 × (9.2693/8.4593)^(1/20) ≈ 11.4% — consistent with Vanguard's 11.8% given index-vintage and window differences |

## The one rule not achievable: a single common quarter-end

The spec asks every row to end on the same quarter-end (target 30 Sep 2026).
Doors probed in this sitting:

- **CFS PDF** (30 Sep 2026 figures): 403-blocked from this sandbox (F5 firewall, three fetch methods).
- **S&P DJI** (spdji.com): blocked (as in the previous sitting).
- **MSCI 20y/30y**: login-gated interactive tools; the public factsheet is the 30 Oct 2026 edition only.
- **LBMA** (month-end gold prices): 403-blocked.
- **RBA** (rba.gov.au, incl. statistical tables): 403-blocked.
- **BLS** (bls.gov news releases): blocked (figures verified through FRED, the release text via search, and the DOL mirror).
- **archive.org / Wayback**: unreachable (connection refused).
- **EODHD** (the owner's market-data key): daily request quota exhausted during this sitting.
- **Vanguard** publishes 20/30-year figures only to **30 June 2026** (yearly cadence, next update July 2027).

Conclusion: no quarter-end later than the current per-row windows is verifiable for
every row from this sandbox. The file keeps each row at its own disclosed,
freshly re-verified period end; the largest gaps against Sep-2026 cross-checks
are all under 0.5 points and explained above.

## The v7 blocked-doors retry — 2026-11-26 (second sitting, ~10 minutes, hard 30-minute timebox)

The owner's v7 direction asked for one retry of the blocked doors. Result:

| Door | Method | Result |
|---|---|---|
| **CFS "Investment essentials" PDF** | direct curl (200, 1.06 MB) + the page-reading tool | **OPENED.** Read first-hand: 20 years to 30 September 2026 — Australian shares (S&P/ASX 300 Accumulation) **6.97%**, global shares (MSCI World Net, $A) **8.95%**, cash (Bloomberg AusBond Bank Bill) **3.25%**; every 20-year cross-check in the table above now verified directly from the document instead of via search snippets. The PDF's own window note: "Data from 30 September 2006 to 30 September 2026". |
| LBMA precious-metal prices | page shell loads (200) | The page renders, but the historical price series itself is a paid data feed — no quarter-end history without a licence (spec §7 forbids restricted-licence data). Historical door stays closed. |
| RBA (rba.gov.au, incl. statistical tables) | curl 403; reader returns a titled but empty body | Still closed. |
| BLS (bls.gov CPI news release) | curl 403; reader returns an empty body | Still closed — the US inflation rows remain verified via FRED CPIAUCNS, the DOL mirror and the release text through search, as recorded above. |
| MSCI interactive (20y/30y) | the tools page shell loads; the data needs a login | Still login-gated; the public factsheet (30 Oct 2026, 15-year window) remains the only open MSCI door. |

**The common quarter-end after the retry:** still not achievable. CFS publishes the 20-year
figures only (no 30-year row); Vanguard publishes 20- and 30-year figures but only to
30 June 2026 (yearly cadence); MSCI's 20/30-year figures are login-gated; LBMA history is
paid. Re-anchoring every row to 30 September 2026 would mean mixing windows and indexes
across rows — worse than the current per-row disclosed period ends, all of which are
freshly verified. The file keeps its per-row period ends; the CFS cross-checks are upgraded
from snippet-read to document-read.
