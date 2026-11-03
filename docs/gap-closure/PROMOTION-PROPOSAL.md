# S6-M6.4 — Shadow review and promotion proposal

**Status: PROPOSAL — awaiting owner approval. Nothing in this document
changes production. Per G-5 no indicator is promoted, no rule version is
bumped, and no voter flag flips until the owner approves a list below.**

Written 2026-11-03 (~00:30 UTC) by the S6 gap-closure agent. The evidence
is reproducible: `evidence/M6.4/harness.py` + `evidence/M6.4/data/` (the
providers' own answers) + `evidence/M6.4/eval-results.json` (the raw
output). The method follows `docs/insights/BACKTEST.md` (the Phase-I1
discipline: frozen clock, every denominator stated) and
`docs/insights/BACKTEST-GOLD.md` (the gold program's stricter harness: no
lookahead by construction, multiple testing named, sensitivity splits
reported beside, never selected from — and its "no edge" verdict on the
gold table is the honesty bar this proposal holds itself to).

---

## 1. Method (frozen before any outcome was computed)

- **Rule vocabulary:** the repo's own. The primary uniform rule is the
  reading's **trailing 10-year percentile — warning = the top decile
  (≥ 90th percentile) of the last 120 monthly observations** (exactly
  `percentile10y` with the repo's 120-observation floor), or the bottom
  decile where low is bad. Slope candidates use the same percentile rule
  on the 12-month change. This is exactly the existing
  `{ kind: 'percentile', tail: 'high', cutoff: 0.1 }` production rule.
- **Exception rules, stated in advance and not tuned:**
  `cfnai` uses the Chicago Fed's own published recession marker
  (reading < −0.7); `chokepoint-suez` uses the transit-collapse class
  (MA7 < 0.85 × the prior-4-week mean — the Red Sea event shape);
  `usd-reserve-share` uses a 12-month change ≤ −0.5pp (a meaningful
  diversification year).
- **No lookahead:** every trailing percentile at month t uses
  observations at or before t only (the harness slices the window before
  any comparison; the gold harness's `seriesUpTo` discipline).
- **Outcomes (frozen):**
  - **eq_dd6** — a ≥ 10% peak-to-trough decline of the S&P 500 real
    monthly closes (the provider's own Shiller `ie_data.xls` column P)
    within the next 6 months;
  - **unrate_up12** — US unemployment (UNRATE) ≥ +0.5pp higher 12 months
    ahead; **au_unrate_up12** the same on the ABS LF M13 series;
  - **cpi_surp12** — CPI year-on-year ≥ +0.5pp higher 12 months ahead;
  - **oil_shock6** — brent monthly average ≥ +25% six months ahead;
  - **usd_down12** — the broad dollar index (DTWEXBGS) ≤ −3% twelve
    months ahead; **us10y_up12** — the 10-year Treasury yield ≥ +0.75pp
    twelve months ahead; **fwd_ret12_lt0** — a negative S&P real
    12-month forward return (the CAPE classic).
- **Windows:** monthly, wherever a candidate carries ≥ 120 trailing
  observations and the outcome horizon is fully observable (COFER is
  quarterly with a 40-quarter floor — see §4). Daily-cadence candidates
  are evaluated on their own observation dates.
- **Multiple testing is named:** 15 candidate–outcome pairs were
  registered before computation; ALL results are reported in §3/§4, none
  picked post-hoc. Two sensitivity splits (the post-2000 modern era for
  the two strongest candidates) are reported BESIDE the full-sample
  numbers, never selected from (the gold harness's mature-subsample
  discipline).
- **Data:** the providers' own answers — FRED fredgraph CSVs fetched
  2026-11-03, the repo's committed fixtures for EBP / OFR FSI / GSCPI /
  GPR (the production parsers' own inputs), the ABS SDMX API (LF M13 /
  M12 / LF_UNDER M23), the IMF COFER evidence copy (M6.3), the IMF
  PortWatch FeatureServer (Suez, 2019-01-01 → 2026-10-25, 2,855 daily
  rows), and the provider's own Shiller `ie_data.xls`.

## 2. The bar

The repo's culture is strict by design: the gold program's own backtest
verdict was that even a 21-voter production table shows no reliable
directional edge on gold. A promotion here therefore needs (a) a
**material lift** (the conditional outcome rate clearly above both the
base rate and the no-warning rate), (b) **enough warning events** that
the lift is not an artifact of a handful of episodes, (c) **persistence
in the modern era** (the post-2000 split), and (d) **no double-counting**
of an outcome family the gauge already votes on. Candidates that fail any
leg stay context-only — "context" is not a demotion; it is the honest
default the whole gap-closure program has used since G-5.

## 3. The evaluated pool — every result, best lift first

| # | Candidate | Outcome | n | Warn windows (share) | Base rate | P(outcome \| warn) | P(outcome \| no warn) | Lift | Today's state under the rule |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `cfnai` (rule: the provider's own < −0.7) | unrate_up12 | 583 | 54 (9.3%) | 0.208 | **0.685** | 0.159 | **3.30** | normal (2026-09: +0.07) |
| 2 | `ofr-fsi` | eq_dd6 | 197 | 10 (5.1%) | 0.157 | **0.500** | 0.139 | **3.18** | normal |
| 3 | `sloos-ci-tightening` | unrate_up12 | 22 | 5 (22.7%) | 0.136 | 0.400 | 0.059 | 2.93 | normal |
| 4 | `continuing-claims` (12m change) | unrate_up12 | 573 | 58 (10.1%) | 0.211 | **0.552** | 0.173 | **2.61** | normal |
| 5 | `ebp` | eq_dd6 | 521 | 79 (15.2%) | 0.169 | **0.304** | 0.145 | **1.80** | normal (2026-09: −0.39) |
| 6 | `nyfed-custody` (12m change) | us10y_up12 | 144 | 42 (29.2%) | 0.194 | 0.286 | 0.157 | 1.47 | **WARN today** |
| 7 | `gscpi` | cpi_surp12 | 212 | 51 (24.1%) | 0.382 | 0.549 | 0.329 | 1.44 | normal |
| 8 | `au-underemployment` | au_unrate_up12 | 453 | 135 (29.8%) | 0.161 | 0.222 | 0.135 | 1.38 | normal |
| 9 | `au-participation` (12m change) | au_unrate_up12 | 441 | 51 (11.6%) | 0.166 | 0.216 | 0.159 | 1.30 | normal |
| 10 | `gpr-index` | oil_shock6 | 376 | 56 (14.9%) | 0.202 | 0.214 | 0.200 | 1.06 | normal |
| 11 | `walcl` (12m change) | eq_dd6 | 150 | 60 (40.0%) | 0.167 | 0.133 | 0.189 | 0.80 | normal |
| 12 | `shiller-cape` | fwd_ret12_lt0 | 1509 | 348 (23.1%) | 0.324 | 0.272 | 0.340 | 0.84 | **WARN today** (CAPE 40.7 = its decade top) |
| 13 | `median-cpi` | cpi_surp12 | 393 | 44 (11.2%) | 0.369 | 0.273 | 0.381 | 0.74 | normal |
| 14 | `chokepoint-suez` (the 15% collapse rule) | oil_shock6 | 2642 | 64 (2.4%) | 0.266 | 0.094 | 0.270 | 0.35 | normal |
| 15 | `usd-reserve-share` (12m change ≤ −0.5pp) | usd_down12 | **0** | — | — | — | — | — | not evaluable (§4) |

**Sensitivity splits (reported beside, never selected from):**

| Candidate | Split | n | P(outcome \| warn) | Lift |
|---|---|---|---|---|
| `cfnai` | post-2000 | 308 | **0.760** | **3.78** |
| `ebp` | post-2000 | 316 | **0.511** | **2.27** |

## 4. Not evaluable (honest)

- **`usd-reserve-share`** — the provider carries 42 quarters; a trailing
  10-year (40-quarter) slope base leaves ZERO fully-formed windows. The
  latest quarter's 12-month change is +0.53pp (the opposite of the
  diversification-warning direction). Re-check when the base accrues; the
  card is context-only regardless (G-5).
- **Every family younger than the 120-observation floor at the reading
  level:** the NZ mirrors, the China property/steel pair, the M6.3 trio
  (`sp500-breadth-ratio`, `btp-bund-spread` — plus COFER above), the
  Pink Sheet energy trio's stored readings, and the TIC-section
  composites. They stay context-only until their stored histories cross
  the floor; this proposal deliberately does not guess at them.

## 5. The recommendations

### 5.1 PROPOSED FOR PROMOTION (2)

#### A. `cfnai` → a growth-health voter

- **Evidence:** the strongest signal in the pool. 583 monthly windows
  (1977-02 → 2025-09); the provider's own −0.7 marker precedes a ≥ 0.5pp
  unemployment rise within 12 months **68.5%** of the time vs a 20.8%
  base rate (lift 3.30); the post-2000 split is stronger still (76.0%,
  lift 3.78). 54 warning windows over 48 years ≈ one per year; 37 were
  followed by the outcome, 17 were not (≈ one false alarm per 2.8 years).
- **Proposed rule:** `{ kind: 'threshold', direction: 'below', value: -0.7 }`
  (the Chicago Fed's own published threshold — frozen by the provider,
  not tuned by us; monthly cadence, maxAge 75).
- **Proposed gauge:** growth-health ("Is the economy growing?"). The
  CFNAI is a weighted composite of 85 monthly activity series — a
  breadth-of-activity reading, not another unemployment count (see the
  overlap note in §6).
- **Effect at today's data (2026-11-02 snapshot, 158 readings):** the
  2026-09 reading is **+0.07 → normal**. growth-health goes 1/10 → 1/11
  in warning; the Global summary 8/30 → 8/32 (26.7% → 25.0%, same label
  step). **No verdict changes today.**
- **Recommendation: PROMOTE.**

#### B. `ebp` → a market-stress voter

- **Evidence:** 521 monthly windows (1982-12 → 2026-04); the trailing-10y
  top-decile rule precedes a ≥ 10% S&P drawdown within 6 months **30.4%**
  of the time vs a 16.9% base rate (lift 1.80); the modern era is
  cleaner: post-2000, **51.1%** vs 22.5% (lift 2.27). 79 warning windows
  over 43 years; 24 hits, 55 quiet (≈ 1.3 false alarms/year full-sample;
  ≈ 1/year post-2000). The EBP is the literature's own credit-stress
  measure (Gilchrist–Zakrajšek) — the credit channel the existing stress
  voters (STLFSI, NFCI, VIX) approach from the funding/volatility side.
- **Proposed rule:** `{ kind: 'percentile', tail: 'high', cutoff: 0.1 }`
  (exactly the harness rule; monthly cadence, maxAge 75).
- **Proposed gauge:** market-stress.
- **Effect at today's data:** the 2026-09 reading is **−0.39, 10-year
  percentile 13.7% → normal**. market-stress goes 1/5 → 1/6 in warning.
  **No verdict changes today.**
- **Recommendation: PROMOTE.**

### 5.2 EVIDENCE-QUALIFIED BUT DELIBERATELY NOT PROPOSED (2)

- **`ofr-fsi`** (lift 3.18) — the lift is real but it rests on **10
  warning windows in 16 years**, and those windows are the same 2008 /
  2011 / 2020 / 2023 episodes in which STLFSI, NFCI and VIX already
  fire: the marginal information beyond the existing three stress voters
  is small, and the repo's bar (§2 leg b) says a handful of episodes is
  not a promotion basis. **Keep as context; re-check as episodes accrue.**
- **`continuing-claims`** (lift 2.61, P 0.552) — the evidence clears the
  statistical bar, but growth-health already votes on the same outcome
  through `us-unemployment`, `sahm-rule` and `initial-jobless-claims`.
  Adding a fourth labour voter is exactly the **labour-voter overlap**
  the S6 spec reserves as a separate explicit owner decision. **Not
  proposed unasked; recorded in §6 as the owner's option.**

### 5.3 KEEP AS CONTEXT — the measured negatives (11)

`gscpi` (1.44), `nyfed-custody` (1.47 — and it reads WARN today; a
promotion would add a warning on sub-2× lift), `au-underemployment`
(1.38 — its warning fires 29.8% of the time, too loose to be a signal),
`au-participation` (1.30), `gpr-index` (1.06 — geopolitical-risk spikes
do NOT precede oil shocks at this rule; the honest null), `walcl`
(0.80), `shiller-cape` (0.84 — the classic result: no 12-month edge; and
it reads WARN today, which would have been a false alarm), `median-cpi`
(0.74 — top-decile median CPI historically clustered in eras inflation
was about to COOL), `chokepoint-suez` (0.35 — transit collapses have
coincided with calm oil, not shocks; the card stays the honest
situational reading it was designed to be), `sloos-ci-tightening`
(lift 2.93 but n=22 — the quarterly series only crossed the 120-obs
floor in 2020; re-check ~2028), `usd-reserve-share` (not evaluable, §4).

**No indicator is proposed for removal or hiding (G-3).** Every
keep-context row keeps its card, its lane and its copy exactly as is.

## 6. The rebalancing questions (separate explicit owner decisions — NOT proposed)

Per the S6 spec, these are recorded for the owner and executed only on an
explicit instruction (G-3):

1. **The gold-specific voters in market-stress.** `gold-silver` and
   `cftc-gold-positioning` vote in market-stress as gold-program
   artifacts (cftc fires in warning TODAY — one of the gauge's two
   current warnings). If ebp is promoted, market-stress carries six
   voters of which two are gold-flavored. The owner may wish to rebalance
   (e.g. move the pair to a gold-specific context lane) — a scoring
   change this proposal does not make.
2. **The labour-voter overlap in growth-health.** With cfnai promoted,
   growth-health would carry four labour-adjacent voters
   (us-unemployment, sahm-rule, initial-jobless-claims, cfnai) plus the
   not-proposed continuing-claims (lift 2.61). The owner may prefer a
   different mix (e.g. promote continuing-claims AND retire an existing
   labour voter, or keep the current three and cfnai only). Any such
   swap is the owner's explicit call.

## 7. What approval executes (the M6.4 item-5 plan, unchanged until then)

On the owner's approval of §5.1 (and any §6 decisions): flip the two
`voter` flags in `definitions.ts`, bump RULE_VERSION (4 → 5) in
`ruleVersion.ts`, update the two cards' gauge descriptions and the
"not scored yet" labels (growth-health and market-stress lane headers),
update the pin tests (`definitions.test.ts`, `about-sources.test.ts`,
the layer1 validator), regenerate the narrator vocabulary, refresh
AGENTS.md §A/§B + `docs/INDICATORS_AND_DATA_SOURCES.md`, add the
CHANGELOG entry, deploy api + web, verify, and record the before/after
verdict counts (today's before-state: Global **stressed 8/30**, market-
stress 1/5, growth-health 1/10; the after-state at today's data: **no
label changes** — 8/32, 1/6, 1/11 — the first honest after-reading
lands with the next rung).

**The proposal stops here. No promotion happens without the owner's
recorded approval (G-5).**
