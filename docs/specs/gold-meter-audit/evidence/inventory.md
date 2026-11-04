# GA-S2 evidence — the inventory (the source-side half)

**Status: PARTIAL (2026-11-04) — delivered under the GA-S2 prompt's lock
fallback.** The owner was not reachable in-session, so **OI-GA-1 (the
taxonomy lock) is still OPEN** and this file carries only the inventory's
**source-side work (03 §1.2–§1.4): the readings table, the derived-series
recipes, the rungs** — everything that locks nothing. The wiring-dependent
halves are **DEFERRED to the post-lock completion session** (see the last
section): the voters table (03 §1.1), the wiring trace + the context
traces + the history depths (03 §2). `02-REFERENCE-TAXONOMY.md` is
untouched by this session (v1, delivered, **awaiting the owner's lock**).

Nothing in this file classifies anything (D-GA-6 — the six classes are
GA-S3's, against the locked taxonomy) and nothing maps wiring against the
unlocked checklist (D-GA-1). Every mechanical fact below is transcribed
from the code, the canonical rung map, or the live wire of 2026-11-04, and
every number names the script or command that produced it (01 §4.3):

- **The scan:** `packages/insights/scripts/ga-s2-wire-scan.sh` (read-only,
  keyless; run 2026-11-04 against the live `GET /api/insights`). The full
  output is committed beside this file:
  `evidence/wire-scan-2026-11-04.txt`. It parses, read-only:
  `packages/insights/src/definitions.ts` (DEFINITIONS),
  `packages/insights/src/gold-score.ts` (GOLD_LANE_VOTERS, for the voter
  marks only), `packages/insights/src/gauges.ts` (GAUGES membership) and
  `docs/INDICATORS_AND_DATA_SOURCES.md` (the 159-row inventory table), and
  cross-checks all of them against the wire.
- **The GB-S7 rule honoured:** no retired `goldSummary` field is needed for
  this half (the served payload is the ground truth); the scan verifies its
  absence on the live wire anyway — the retirement holds.

---

## 1. The readings (03 §1.2)

### 1.1 The three denominators, cross-checked (the scan's section 3)

| Denominator | Count | Note |
|---|---|---|
| The live wire (`GET /api/insights`) | **161** readings (161 unique ids) | generatedAt `2026-11-04T12:18:13.290Z`, `displayMode: public`, `ruleVersion: 4` |
| `DEFINITIONS` (definitions.ts) | **161** ids | 48 scored-gauge rules + 113 info (context) rules = 161 |
| The doc's inventory table (§1 of `docs/INDICATORS_AND_DATA_SOURCES.md`) | **159** rows | its own header claims 161; its own `**Counts:**` line claims 145 — both stale lines, see below |
| `GAUGES` (gauges.ts) | 12 gauges · 68 listed members | **48 scored voters in the 8 non-shadow gauges** (borrowing-costs 9 · prices-heat 5 · market-stress 5 · dollar-strength 3 · growth-health 10 · au-inflation-rates 5 · au-households 7 · au-trade-currency 4) + **4 shadow gauges (G-5) with 20 context-only members** (geo-fragmentation, au-activity, au-external, dedollar-concentration — `isShadowGauge`, gauges.ts:259-263) |

**Deltas (facts, from the scan):**

- `wire − doc table = {term-premium-10y, tga}` — both live on the wire and
  in DEFINITIONS but have **no row in the doc's inventory table** (both are
  rung-4 `fred-s3` ids shipped with gap-closure S3-M3.2, 2026-11-01; the
  doc's table was never extended for them). The doc's own numbers disagree
  with themselves: header "161 ids", table 159 rows, `**Counts:**` line
  "145 ids total". The **wire and DEFINITIONS agree exactly (161 = 161)** —
  the code and the wire are the ground truth; the doc's table is two rows
  short and its counts line is 14 stale.
- `doc-voter flags vs GAUGES`: **AGREE on all 159 doc rows** (the scan's
  cross-check) — the doc's ✓/– column is accurate; only the two missing
  rows and the counts lines drift.

### 1.2 The wire today — the ground truth of what the meter can see (2026-11-04)

Facts of this run (`ga-s2-wire-scan.sh` §1–§2; today's states, not defect
judgments — the ingest rungs and the 10:10/20:10 sweeps heal daily):

- `goldSummary` **absent** from the payload — the OI-3/GB-S7 wire
  retirement holds on the live wire.
- Reading statuses: **context 100 · normal 26 · stale 20 · warning 15**
  (161 total).
- The snapshot's own summary lines: global `stressed` (votingCount 29,
  warningCount 10, excludedCount 13, staleCount 3 — **staleVoters:
  govt-interest-revenue, dollar-basket, usdjpy**); australia `stressed`
  (votingCount 12, staleCount 10).
- **All 21 gold-lane voters are present on the wire** (scan §2, printed
  with their `gold-score.ts` line numbers). Today's per-voter field
  availability — what `evalLeg` can actually reach right now:
  - `dollar-basket` and `usdjpy` are **`stale`** with **no `change30d` and
    no `percentile10y`** — the dollar lane runs with 2 of its 3 voters
    `unread` in today's balance (the whole Frankfurter dollar family reads
    stale today: eur-usd, usdtry, audjpy, audusd, audnzd, usdcny too —
    the day's ladder state, not a wiring property).
  - `cftc-gold-positioning` reads `warning` (46.99 %, asOf 2026-10-27) but
    carries **no `change30d` and no `percentile10y`** — neither of
    `evalLeg`'s two legs has an input on today's wire (the stored-history
    depth behind this is exactly the deferred §2 measurement).
  - `us-japan-10y-gap` reads `normal` (asOf 2026-10-30) with
    `percentile10y = 0.302` present but **no `change30d`** — only the
    level leg is reachable today (there is no `SIGNAL_LEG_MOVE` threshold
    for it either way — connections.ts:575-585 defines none).
  - `breakeven-tilt` — a gold-lane voter — carries wire status
    **`context`** (its DEFINITIONS rule is `info`; it is a prices-heat
    context card that also holds a gold-lane seat). The balance's
    `readable()` admits `context` (only `stale`/`check-pending`/
    `unavailable` never fire — gold-balance.ts:127-129), and both its
    `change30d` and `percentile10y` are present.
  - The remaining 17 voters: readable today, both fields present.

### 1.3 The full readings table (161 rows, alphabetical)

Columns: **id** · **source · ref** (the provider and the series key, from
DEFINITIONS' `sourceRef`) · **cadence** · **staleness (d)** (the doc
table's per-row `maxAge` — the `staleAfterDays` overrides; defaults when
absent: daily 4 · weekly 10 · monthly 45 · quarterly 120 · per-change — ·
manual 45, freshness.ts:79-86; ` (def)` = the definition's own override,
used where the doc table has no row) · **layer** (DEFINITIONS' `group` —
the rendering lane; the four gold-lane-home gauges are borrowing-costs,
prices-heat, market-stress, dollar-strength) · **licence** (the doc
table's per-row level; `L0*` = not in the doc table — fred, per-series
T-16 tag not re-verified this session) · **gauge role** (gauges.ts:
`voter · <gauge>` = a scored member of a non-shadow gauge; `shadow ·
<gauge>` = a G-5 context-only shadow member; `context` = an info-rule
card) · **gold role (the mirror sweep)** — this session's editorial mark
with a one-word reason (method in §4) · **wire 2026-11-04** (asOf · status
from the scan).

<!-- TABLE:161 -->
| id | source · ref | cadence | staleness (d) | layer | licence | gauge role | gold role (mirror sweep) | wire 2026-11-04 |
|---|---|---|---|---|---|---|---|---|
| `au-10y` | rba · F2 FCMYGBAG10D | daily | 40 | au-inflation-rates | L0 | voter · au-inflation-rates | not-gold — australia | 10-28 · warning |
| `au-building-approvals` | abs · BA_GCCSA 1.1.9.1.100.10.AUS.M | monthly | 75 | au-activity | L0 | shadow · au-activity | not-gold — australia | 09-01 · context |
| `au-cpi` | abs · monthly CPI All groups index | monthly | 95 | au-inflation-rates | L0 | voter · au-inflation-rates | not-gold — australia | 09-01 · warning |
| `au-deposit-rate` | rba · F4.1 PDRNTH | monthly | 70 | au-households | L0 | context | not-gold — australia | 08-31 · context |
| `au-gdp-growth` | abs · ANA_AGG M1.GPM.20.AUS.Q | quarterly | 215 | au-activity | L0 | shadow · au-activity | not-gold — australia | 04-01 · stale |
| `au-home-loan` | rba · F6 FLRHOOTA | monthly | 70 | au-households | L0 | voter · au-households | not-gold — australia | 08-31 · warning |
| `au-home-values` | abs · RES_DWELL_ST residential dwelling price inde | quarterly | 225 | au-households | L0 | voter · au-households | not-gold — australia | 04-01 · normal |
| `au-household-debt-arrears` | rba · E2 'Household debt to income' | quarterly | 190 | au-households | L0 | voter · au-households | not-gold — australia | 06-30 · normal |
| `au-household-spending` | abs · HSI_M 9.TOT.CUR.10.AUS.M | monthly | 75 | au-activity | L0 | shadow · au-activity | not-gold — australia | 09-01 · context |
| `au-housing-finance` | abs · LEND_HOUSING/FIN_VAL.NEWCOMMITS.DV8368.TOTDW | quarterly | 230 | au-households | L0 | voter · au-households | not-gold — australia | 04-01 · normal |
| `au-job-vacancies` | abs · JV/M1.7.TOT.20.AUS.Q | quarterly | 240 | au-households | L0 | context | not-gold — australia | 07-01 · context |
| `au-nom` | abs · ERP_COMP_Q 9.AUS.Q | quarterly | 270 | au-activity | L0 | context | not-gold — australia | 01-01 · stale |
| `au-participation` | abs · LF M12.3.1599.20.AUS.M | monthly | 60 | au-activity | L0 | shadow · au-activity | not-gold — australia | 09-01 · stale |
| `au-petrol-yoy` | abs · CPI Automotive fuel index | monthly | 95 | au-inflation-rates | L0 | context | not-gold — australia | 09-01 · context |
| `au-population-growth` | abs · ERP_COMP_Q 10.AUS.Q | quarterly | 270 | au-activity | L0 | shadow · au-activity | not-gold — australia | 01-01 · stale |
| `au-rent-yoy` | abs · CPI Rents index, monthly | monthly | 95 | au-households | L0 | voter · au-households | not-gold — australia | 09-01 · normal |
| `au-saving-ratio` | abs · ANA_AGG/M7.HSR.20.AUS.Q | quarterly | 250 | au-households | L0 | context | not-gold — australia | 04-01 · context |
| `au-trade-balance` | abs · ITGS M1.170.20.AUS.M | monthly | 75 | au-external | L0 | shadow · au-external | not-gold — australia | 08-01 · stale |
| `au-trimmed-mean` | abs · monthly CPI Trimmed Mean index | monthly | 95 | au-inflation-rates | L0 | voter · au-inflation-rates | not-gold — australia | 09-01 · warning |
| `au-underemployment` | abs · LF_UNDER M23.3.1599.20.AUS.M | monthly | 60 | au-activity | L0 | shadow · au-activity | not-gold — australia | 09-01 · stale |
| `au-unemployment` | abs · Labour Force M13 | monthly | 60 | au-households | L0 | voter · au-households | not-gold — australia | 09-01 · stale |
| `au-us-10y-gap` | derived · F2 10y | daily | 40 | au-inflation-rates | L0 | voter · au-inflation-rates | not-gold — australia | 10-28 · normal |
| `au-wage-growth` | abs · WPI total hourly rates excluding bonuses | quarterly | 230 | au-households | L0 | voter · au-households | not-gold — australia | 04-01 · warning |
| `audjpy` | derived · Frankfurter USD→JPY ÷ USD→AUD | daily | 4 | au-trade-currency | L1 | voter · au-trade-currency | not-gold — australia | 11-03 · stale |
| `audnzd` | derived · Frankfurter USD→NZD ÷ USD→AUD | daily | 4 | au-external | L1 | shadow · au-external | not-gold — australia | 11-03 · stale |
| `audusd` | derived · 1 ÷ Frankfurter USD→AUD | daily | 4 | au-trade-currency | L1 | voter · au-trade-currency | not-gold — australia | 11-03 · stale |
| `bank-reserves` | fred · WRESBAL | weekly | 21 | market-stress | L0 | context | context — liquidity | 10-28 · context |
| `boe-rate` | boe · Bank of England official Bank Rate history | per-change | – | borrowing-costs | L2 | context | context — foreign-policy-rate | 11-04 · context |
| `boj-rate` | fred · IRSTCI01JPM156N | monthly | 75 | borrowing-costs | L2 | context | context — foreign-policy-rate | 09-01 · context |
| `breakeven-10y` | fred · T10YIE | daily | 4 | prices-heat | L2 | context | context — spot-breakeven | 11-03 · context |
| `breakeven-5y5y` | fred · T5YIFR | daily | 4 | prices-heat | L2 | voter · prices-heat | **voter** — inflation seat | 11-03 · normal |
| `breakeven-tilt` | derived · T5YIFR | daily | 5 | prices-heat | L2 | context | **voter** — inflation seat | 11-03 · context |
| `brent` | fred · DCOILBRENTEU | daily | 12 | prices-board | L2 | voter · prices-heat | context — connection-leg | 10-30 · warning |
| `btc-usd` | gold-api · gold-api.com BTC spot | daily | 2 | prices-board | L2 | context | context — store-of-value | 11-04 · context |
| `btp-bund-spread` | derived · FRED IRLTLT01ITM156N | monthly | 75 | borrowing-costs | L2 | context | context — EU-sovereign-stress | 08-01 · stale |
| `bund-10y` | fred · IRLTLT01DEM156N | monthly | 75 | borrowing-costs | L2 | context | context — foreign-10y | 09-01 · context |
| `cfnai` | fred · CFNAI | monthly | 95 | growth-health | L2 | context | not-gold — growth | 09-01 · context |
| `cftc-gold-positioning` | cftc · CFTC Commitments of Traders | weekly | 12 | market-stress | L0 | voter · market-stress | **voter** — stress seat | 10-27 · warning |
| `china-cpi` | nbs · NBS English press release | monthly | 45 | growth-health | L1 | voter · growth-health | not-gold — growth | 09-30 · normal |
| `china-pmi` | nbs · NBS English press release | monthly | 45 | growth-health | L1 | voter · growth-health | not-gold — growth | 10-31 · warning |
| `china-property-investment` | nbs · NBS English press release | monthly | 75 | au-trade-currency | L2 | context | not-gold — australia | 09-30 · context |
| `china-steel-output` | nbs · NBS English press release | monthly | 75 | au-trade-currency | L2 | context | not-gold — australia | 09-30 · context |
| `chokepoint-bab-el-mandeb` | portwatch · IMF PortWatch daily transits, Bab el-Mandeb  | daily | 14 | geo-fragmentation | L1 | shadow · geo-fragmentation | not-gold — shipping | 10-25 · context |
| `chokepoint-malacca` | portwatch · IMF PortWatch daily transits, Strait of Mala | daily | 14 | geo-fragmentation | L1 | shadow · geo-fragmentation | not-gold — shipping | 10-25 · context |
| `chokepoint-panama` | portwatch · IMF PortWatch daily transits, Panama Canal | daily | 14 | geo-fragmentation | L1 | shadow · geo-fragmentation | not-gold — shipping | 10-25 · context |
| `chokepoint-suez` | portwatch · IMF PortWatch daily transits, Suez Canal | daily | 14 | geo-fragmentation | L1 | shadow · geo-fragmentation | not-gold — shipping | 10-25 · context |
| `chokepoint-taiwan` | portwatch · IMF PortWatch daily transits, Taiwan Strait | daily | 14 | geo-fragmentation | L1 | shadow · geo-fragmentation | not-gold — shipping | 10-25 · context |
| `coal-aus` | world-bank · (Coal, Australian; $/metric ton) | monthly | 60 | au-trade-currency | L1 | context | not-gold — australia | 10-01 · context |
| `continuing-claims` | fred · CCSA | weekly | 28 | growth-health | L0 | context | not-gold — labour | 10-17 · context |
| `copper-gold` | derived · World Bank copper ÷ gold | monthly | 60 | growth-health | L1 | voter · growth-health | context — ratio | 10-01 · normal |
| `copper-usd` | gold-api · gold-api.com HG spot × 2204.62262 | daily | 2 | growth-health | L1 | context | not-gold — industrial-metal | 11-04 · context |
| `crypto-fng` | alternative-me · alternative.me /fng/ API | daily | 4 | market-stress | L0 | context | not-gold — crypto-sentiment | 11-04 · context |
| `dollar-basket` | derived · Frankfurter six-currency basket | daily | 4 | dollar-strength | L1 | voter · dollar-strength | **voter** — dollar seat | 11-03 · stale |
| `ebp` | frb · Federal Reserve Board:EBP | monthly | 75 | market-stress | L0 | context | context — credit-premium | 09-01 · context |
| `ecb-dfr` | ecb · FM/D.U2.EUR.4F.KR.DFR.LEV | daily | 7 | borrowing-costs | L1 | voter · borrowing-costs | **voter** — borrowing-costs seat | 11-04 · normal |
| `eia-crude-stocks` | eia · EIA WCRSTUS1 | weekly | 12 | prices-heat | L0 | context | not-gold — energy | 10-23 · context |
| `empire-state` | fred · GACDISA066MSFRBNY | monthly | 60 | growth-health | L2 | context | not-gold — growth | 10-01 · context |
| `epu-us` | epu · Baker-Bloom-Davis US Economic Policy Uncerta | monthly | 75 | growth-health | L0 | context | context — policy-uncertainty | 10-01 · context |
| `eur-usd` | frankfurter · Frankfurter USD→EUR | daily | 4 | dollar-strength | L1 | context | context — dollar-leg | 11-03 · stale |
| `euro-aaa-10y` | ecb · YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y | daily | 7 | borrowing-costs | L1 | context | context — euro-10y | 11-03 · context |
| `euro-hicp` | ecb · HICP/M.U2.N.000000.4D0.ANR | monthly | 60 | prices-heat | L1 | voter · prices-heat | **voter** — inflation seat | 10-01 · warning |
| `fed-expectations` | derived · DGS2 | daily | 4 | borrowing-costs | L0 | voter · borrowing-costs | **voter** — borrowing-costs seat | 11-02 · normal |
| `fed-target` | fred · DFEDTARL | daily | 5 | borrowing-costs | L0 | voter · borrowing-costs | **voter** — borrowing-costs seat | 11-03 · normal |
| `food-index` | world-bank · (Monthly Indices, Food; 2010=100) | monthly | 60 | prices-heat | L1 | context | not-gold — softs | 10-01 · context |
| `gas-europe` | world-bank · (Natural gas, Europe; $/mmbtu) | monthly | 60 | prices-heat | L1 | context | not-gold — energy | 10-01 · context |
| `gdpnow` | fred · GDPNOW | quarterly | 150 | growth-health | L2 | context | not-gold — growth | 10-01 · context |
| `gilt-10y` | fred · IRLTLT01GBM156N | monthly | 75 | borrowing-costs | L2 | context | context — foreign-10y | 09-01 · context |
| `gold-aud` | derived · gold-api.com XAU × Frankfurter USD→AUD | daily | 4 | au-trade-currency | L1 | context | context — gold-price | 11-04 · context |
| `gold-btc` | derived · gold-api.com XAU ÷ BTC | daily | 4 | prices-board | L0 | context | context — ratio | 11-04 · context |
| `gold-oil-ratio` | derived · gold-usd ÷ brent | daily | 3 | prices-heat | L2 | context | context — ratio | 10-30 · stale |
| `gold-silver` | derived · gold-api.com XAU ÷ XAG | daily | 2 | market-stress | L1 | voter · market-stress | **voter** — stress seat | 11-04 · normal |
| `gold-usd` | gold-api · gold-api.com XAU spot | daily | 2 | prices-board | L2 | context | context — price-tile | 11-04 · context |
| `govt-interest-revenue` | derived · A091RC1Q027SBEA ÷ FRED:W006RC1Q027SBEA | quarterly | 215 | borrowing-costs | L0 | voter · borrowing-costs | context — excluded-by-design | 04-01 · stale |
| `gpr-acts` | gpr · Caldara-Iacoviello GPR acts sub-index | monthly | 75 | market-stress | L0 | context | context — event-risk | 10-01 · context |
| `gpr-australia` | gpr · Caldara-Iacoviello country GPR: Australia | monthly | 75 | market-stress | L0 | context | context — event-risk | 10-01 · context |
| `gpr-china` | gpr · Caldara-Iacoviello country GPR: China | monthly | 75 | market-stress | L0 | context | context — event-risk | 10-01 · context |
| `gpr-daily` | gpr · Caldara-Iacoviello daily GPR, 7-day moving a | daily | 12 | market-stress | L0 | context | context — event-risk | 11-02 · context |
| `gpr-index` | gpr · Caldara-Iacoviello Geopolitical Risk Index | monthly | 75 | market-stress | L0 | context | context — event-risk | 10-01 · context |
| `gpr-israel` | gpr · Caldara-Iacoviello country GPR: Israel | monthly | 75 | market-stress | L0 | context | context — event-risk | 10-01 · context |
| `gpr-russia` | gpr · Caldara-Iacoviello country GPR: Russia | monthly | 75 | market-stress | L0 | context | context — event-risk | 10-01 · context |
| `gpr-saudi` | gpr · Caldara-Iacoviello country GPR: Saudi Arabia | monthly | 75 | market-stress | L0 | context | context — event-risk | 10-01 · context |
| `gpr-taiwan` | gpr · Caldara-Iacoviello country GPR: Taiwan | monthly | 75 | market-stress | L0 | context | context — event-risk | 10-01 · context |
| `gpr-threats` | gpr · Caldara-Iacoviello GPR threats sub-index | monthly | 75 | market-stress | L0 | context | context — event-risk | 10-01 · context |
| `gpr-ukraine` | gpr · Caldara-Iacoviello country GPR: Ukraine | monthly | 75 | market-stress | L0 | context | context — event-risk | 10-01 · context |
| `gscpi` | nyfed · NY Fed Global Supply Chain Pressure Index | monthly | 75 | geo-fragmentation | L1 | shadow · geo-fragmentation | not-gold — supply-chain | 09-01 · context |
| `housing-permits` | fred · PERMIT | monthly | 75 | growth-health | L0 | context | not-gold — growth | 09-01 · context |
| `initial-jobless-claims` | fred · ICSA | weekly | 12 | growth-health | L0 | voter · growth-health | not-gold — labour | 10-24 · normal |
| `iron-ore` | world-bank · iron ore, cfr spot | monthly | 60 | au-trade-currency | L1 | context | not-gold — australia | 10-01 · context |
| `jgb-10y` | mof · Japan Ministry of Finance jgbcme.csv | daily | 4 | borrowing-costs | L2 | context | context — YCC-regime | 09-01 · stale |
| `job-openings` | fred · JTSJOL | monthly | 110 | growth-health | L0 | context | not-gold — labour | 09-01 · context |
| `lng-japan` | world-bank · (Liquefied natural gas, Japan; $/mmbtu) | monthly | 60 | au-trade-currency | L1 | context | not-gold — australia | 10-01 · context |
| `m2-us` | fred · M2SL | monthly | 90 | growth-health | L0 | context | context — money | 09-01 · context |
| `maize` | world-bank · (Maize; $/metric ton) | monthly | 60 | prices-heat | L1 | context | not-gold — softs | 10-01 · context |
| `median-cpi` | fred · MEDCPIM158SFRBCLE | monthly | 75 | prices-heat | L2 | context | context — inflation-persistence | 09-01 · context |
| `michigan-1y-expectations` | fred · MICH | monthly | 75 | growth-health | L2 | context | context — expectations | 09-01 · context |
| `michigan-sentiment` | fred · UMCSENT | monthly | 75 | growth-health | L2 | voter · growth-health | not-gold — consumer-mood | 09-01 · warning |
| `mortgage-30y` | fred · MORTGAGE30US | weekly | 14 | borrowing-costs | L2 | context | context — US-transmission | 10-29 · context |
| `natgas` | fred · DHHNGSP | daily | 12 | prices-heat | L0 | context | not-gold — energy | 10-27 · context |
| `net-liquidity` | derived · WALCL | weekly | 21 | market-stress | L0 | context | context — liquidity | 10-28 · context |
| `nfci` | fred · NFCI | weekly | 14 | market-stress | L2 | voter · market-stress | **voter** — stress seat | 10-23 · normal |
| `nyfed-custody` | fred · WSEFINTL1 | weekly | 21 | borrowing-costs | L0 | context | context — foreign-official-holdings | 10-28 · context |
| `nz-10y` | fred · IRLTLT01NZM156N | monthly | 75 | au-external | L2 | shadow · au-external | not-gold — australia | 09-01 · context |
| `nz-short-rate` | oecd · OECD FINMARK IR3TIB NZL | monthly | 75 | au-external | L1 | shadow · au-external | not-gold — australia | 09-01 · context |
| `oecd-cli-cn` | oecd · OECD Composite leading indicator | monthly | 75 | growth-health | L0 | context | not-gold — growth | 09-01 · context |
| `oecd-cli-de` | oecd · OECD Composite leading indicator | monthly | 75 | growth-health | L0 | context | not-gold — growth | 09-01 · context |
| `oecd-cli-us` | oecd · OECD Composite leading indicator | monthly | 75 | growth-health | L0 | voter · growth-health | not-gold — growth | 09-01 · normal |
| `ofr-fsi` | ofr · Office of Financial Research:OFR-FSI | daily | 7 | market-stress | L0 | context | context — stress-composite | 10-30 · context |
| `philly-fed` | fred · GACDFSA066MSFRBPHI | monthly | 60 | growth-health | L2 | voter · growth-health | not-gold — australia | 10-01 · normal |
| `platinum` | gold-api · gold-api.com XPT spot | daily | 2 | prices-heat | L1 | context | context — precious | 11-04 · context |
| `rba-cash-rate` | rba · statistical table F1 | per-change | – | au-households | L0 | context | not-gold — australia | 11-03 · context |
| `rba-expectations` | derived · F2 FCMYGBAG3D | daily | 40 | au-inflation-rates | L0 | voter · au-inflation-rates | not-gold — australia | 10-28 · normal |
| `rba-fed-gap` | derived · Cash Rate Target | per-change | – | au-trade-currency | L0 | voter · au-trade-currency | not-gold — australia | 11-03 · normal |
| `real-yield-10y` | fred · DFII10 | daily | 4 | borrowing-costs | L0 | voter · borrowing-costs | **voter** — borrowing-costs seat | 11-02 · warning |
| `recession-probability` | fred · RECPROUSM156N | monthly | 100 | growth-health | L0 | voter · growth-health | not-gold — recession | 09-01 · normal |
| `repo-stress` | derived · SOFR | daily | 4 | market-stress | L0 | context | context — funding-stress | 11-02 · context |
| `retail-sales` | fred · RSAFS | monthly | 75 | growth-health | L0 | context | not-gold — consumption | 09-01 · context |
| `reverse-repo` | fred · RRPONTSYD | daily | 4 | market-stress | L1 | context | context — liquidity | 11-03 · context |
| `sahm-rule` | fred · SAHMREALTIME | monthly | 75 | growth-health | L0 | voter · growth-health | not-gold — recession | 09-01 · normal |
| `shiller-cape` | shiller · Robert Shiller ie_data.xls | monthly | 45 | market-stress | L2 | context | not-gold — equity-valuation | 10-01 · context |
| `shiller-ecy` | shiller · Robert Shiller ie_data.xls | monthly | 45 | market-stress | L2 | context | not-gold — equity-valuation | 10-01 · context |
| `silver-usd` | gold-api · gold-api.com XAG spot | daily | 2 | prices-board | L2 | context | context — precious | 11-04 · context |
| `sloos-ci-tightening` | fred · DRTSCILM | quarterly | 215 | market-stress | L0 | context | context — credit-standards | 10-01 · context |
| `sofr` | fred · SOFR | daily | 4 | borrowing-costs | L2 | context | context — funding-rate | 11-02 · context |
| `sp500-breadth-ratio` | yahoo · RSP ÷ SPY daily closes | daily | 4 | dedollar-concentration | L2 | shadow · dedollar-concentration | context — dedollar-shadow | 11-03 · context |
| `sticky-cpi` | fred · STICKCPIM158SFRBATL | monthly | 75 | prices-heat | L2 | context | context — inflation-persistence | 09-01 · context |
| `stress-stlfsi` | fred · STLFSI4 | weekly | 14 | market-stress | L2 | voter · market-stress | **voter** — stress seat | 10-23 · normal |
| `t5yie` | fred · T5YIE | daily | 5 | prices-heat | L2 | context | context — spot-breakeven | 11-03 · context |
| `term-premium-10y` | fred · THREEFYTP10 | daily | 14 (def) | market-stress | L0* | context | context — term-premium | 10-30 · context |
| `terms-of-trade` | abs · national accounts | quarterly | 215 | au-trade-currency | L0 | voter · au-trade-currency | not-gold — australia | 04-01 · stale |
| `tga` | fred · WTREGEN | weekly | 21 (def) | market-stress | L0* | context | context — liquidity | 10-28 · context |
| `tpu-us` | epu · Baker-Bloom-Davis US Trade Policy Uncertaint | monthly | 75 | growth-health | L0 | context | context — policy-uncertainty | 10-01 · context |
| `treasury-auction-10y` | fiscaldata · Treasury FiscalData:auctions_query | monthly | 45 | borrowing-costs | L0 | context | context — auction-demand | 10-07 · context |
| `treasury-auction-10y-indirect` | fiscaldata · Treasury FiscalData:auctions_query | monthly | 45 | borrowing-costs | L0 | context | context — auction-demand | 10-07 · context |
| `treasury-auction-30y` | fiscaldata · Treasury FiscalData:auctions_query | monthly | 45 | borrowing-costs | L0 | context | context — auction-demand | 10-08 · context |
| `treasury-auction-30y-indirect` | fiscaldata · Treasury FiscalData:auctions_query | monthly | 45 | borrowing-costs | L0 | context | context — auction-demand | 10-08 · context |
| `us-2y` | fred · DGS2 | daily | 4 | borrowing-costs | L0 | context | context — policy-path | 11-02 · context |
| `us-cpi-core-yoy` | fred · CPILFENS | monthly | 75 | prices-heat | L0 | context | context — core-inflation | 09-01 · context |
| `us-cpi-yoy` | fred · CPIAUCNS | monthly | 75 | prices-heat | L0 | voter · prices-heat | **voter** — inflation seat | 09-01 · warning |
| `us-crude-production` | eia · EIA WCRFPUS2 | weekly | 12 | geo-fragmentation | L0 | shadow · geo-fragmentation | not-gold — energy-security | 10-23 · context |
| `us-deficit-12m` | derived · MTSDS133FMS | monthly | 75 | borrowing-costs | L0 | context | context — fiscal | 09-01 · context |
| `us-deficit-monthly` | fred · MTSDS133FMS | monthly | 75 | borrowing-costs | L0 | context | context — fiscal | 09-01 · context |
| `us-gdp-growth` | fred · A191RL1Q225SBEA | quarterly | 215 | growth-health | L0 | context | not-gold — growth | 07-01 · context |
| `us-japan-10y-gap` | derived · DGS10 | daily | 5 | dollar-strength | L2 | voter · dollar-strength | **voter** — dollar seat | 10-30 · normal |
| `us-nfp` | derived · PAYEMS | monthly | 70 | growth-health | L0 | context | not-gold — labour | 09-01 · context |
| `us-pce-core-yoy` | fred · PCEPILFE | monthly | 95 | prices-heat | L0 | voter · prices-heat | **voter** — inflation seat | 09-01 · warning |
| `us-spr` | eia · EIA WCSSTUS1 | weekly | 12 | geo-fragmentation | L0 | shadow · geo-fragmentation | not-gold — energy-security | 10-23 · context |
| `us-unemployment` | fred · UNRATE | monthly | 75 | growth-health | L0 | voter · growth-health | not-gold — labour | 09-01 · normal |
| `us-wages` | fred · AHETPI | monthly | 75 | prices-heat | L0 | context | context — wages | 09-01 · context |
| `us10y` | fred · DGS10 | daily | 4 | borrowing-costs | L0 | voter · borrowing-costs | **voter** — borrowing-costs seat | 11-02 · warning |
| `us30y` | fred · DGS30 | daily | 4 | borrowing-costs | L0 | voter · borrowing-costs | **voter** — borrowing-costs seat | 11-02 · warning |
| `usd-reserve-share` | imf · IMF COFER | quarterly | 200 | dedollar-concentration | L1 | shadow · dedollar-concentration | context — dedollar-shadow | 06-30 · context |
| `usdaed` | yahoo · USD/AED daily closes | daily | 4 | dollar-strength | L2 | context | context — dollar-leg | 11-04 · context |
| `usdcny` | frankfurter · Frankfurter USD→CNY | daily | 4 | growth-health | L1 | context | not-gold — FX-peg | 11-03 · stale |
| `usdjpy` | frankfurter · Frankfurter USD→JPY | daily | 4 | dollar-strength | L1 | voter · dollar-strength | **voter** — dollar seat | 11-03 · stale |
| `usdtry` | frankfurter · Frankfurter USD→TRY | daily | 4 | dollar-strength | L1 | context | context — EM-pressure | 11-03 · stale |
| `vix` | fred · VIXCLS | daily | 4 | market-stress | L2 | voter · market-stress | **voter** — stress seat | 11-02 · normal |
| `walcl` | fred · WALCL | weekly | 21 | market-stress | L0 | context | context — liquidity | 10-28 · context |
| `wheat` | world-bank · (Wheat, US SRW; $/metric ton) | monthly | 60 | prices-heat | L1 | context | not-gold — softs | 10-01 · context |
| `wti` | fred · DCOILWTICO | daily | 12 | prices-heat | L0 | context | not-gold — energy | 10-27 · context |
| `yield-curve-10y2y` | fred · T10Y2Y | daily | 4 | borrowing-costs | L2 | voter · borrowing-costs | **voter** — borrowing-costs seat | 11-03 · normal |
| `yield-curve-10y3m` | fred · T10Y3M | daily | 4 | borrowing-costs | L2 | voter · borrowing-costs | **voter** — borrowing-costs seat | 11-03 · normal |
<!-- /TABLE -->


*The 161 data rows above: the mechanical columns are printed by
`ga-s2-wire-scan.sh` (section 4 of the committed run record,
`evidence/wire-scan-2026-11-04.txt`); the only editorial column is the
mirror-sweep mark. `term-premium-10y` and `tga` carry ` (def)` staleness
and `L0*` licence because the doc's inventory table has no row for them
(see §1.1's delta) — their facts come from DEFINITIONS + the wire.*

---

## 2. The derived-series recipes (03 §1.3)

Every id whose provider is `derived` (25 rows — the doc's provider-key
list names only 20 of them; `audnzd`, `btp-bund-spread`, `repo-stress`,
`net-liquidity`, `us-deficit-12m` are missing from that list, another
doc-drift fact), plus the two adapter-computed metrics and the price-row
composition family. Formulas verbatim from the code; the quantization is
the F4 float-noise discipline (4 decimal places unless noted); ratio joins
are `combineSeries` inner joins on exact common dates.

| id | exact formula | inputs | code |
|---|---|---|---|
| `fed-expectations` | `DGS2 − (DFEDTARL+DFEDTARU)/2` (the 2y yield minus the policy-rate corridor midpoint), 4dp | FRED DGS2 · DFEDTARL · DFEDTARU | derived.ts:415-418 |
| `breakeven-tilt` | `T5YIFR − T5YIE` on common dates (the priced acceleration), 4dp | FRED T5YIFR · T5YIE | derived.ts:478-483 |
| `btp-bund-spread` | `IRLTLT01ITM156N − IRLTLT01DEM156N` (inner join on common months — the legs' revision cycles differ), 4dp | the two FRED OECD monthly mirrors | derived.ts:435-440 |
| `us-japan-10y-gap` | `DGS10 − jgb10y` (inner join on common dates), 4dp | FRED DGS10 + the rung-2 MOF jgbcme 10Y | derived.ts:575-580 |
| `dollar-basket` | `50.14348112 × EUR^0.576 × JPY^0.136 × GBP^0.119 × CAD^0.091 × SEK^0.042 × CHF^0.036` (DXY-recipe weighted geometric mean of Frankfurter per-USD quotes; weights sum = 1, asserted) | Frankfurter ×6 legs | basket.ts:18-49 · derived.ts:321-355 |
| `gold-silver` | WB gold ÷ WB silver (history) ∪ stored seedHistory ∪ live `XAU÷XAG` — union by date, live wins (the percentile base keeps the decade of monthly history; the live point makes 7/30-day changes measurable) | World Bank Pink Sheet + gold-api XAU/XAG + KV seeds | derived.ts:548-564 |
| `gold-oil-ratio` | `gold-usd ÷ brent` on the two assembled series' common dates, 2dp | assembled gold-usd + brent | derived.ts:743-749 |
| `gold-btc` | `XAU spot ÷ BTC spot` — exactly ONE live observation, no history (honest: no daily history in the verified sources) | gold-api XAU · BTC | derived.ts:773-775 |
| `gold-aud` | `XAU spot × last AUD-per-USD quote` — one live point | gold-api XAU + Frankfurter AUD | derived.ts:844-847 |
| `copper-gold` | WB copper ÷ WB gold on common dates (monthly history only — no live point) | World Bank Pink Sheet | derived.ts:647 |
| `audusd` | `1 ÷ Frankfurter USD→AUD` (invert) | Frankfurter AUD | derived.ts:825 (invert:217) |
| `audjpy` | `JPY-per-USD ÷ AUD-per-USD` | Frankfurter JPY · AUD | derived.ts:826-828 |
| `audnzd` | `NZD-per-USD ÷ AUD-per-USD` (the audjpy pattern) | Frankfurter NZD · AUD | derived.ts:833-835 |
| `govt-interest-revenue` | `(A091RC1Q027SBEA ÷ W006RC1Q027SBEA) × 100` (stored as a percentage, display scale 1) | FRED quarterly interest · receipts | derived.ts:395-403 |
| `us-cpi-yoy` | `yoyPctSeries(CPIAUCNS)` — the 12-month % change of the index | FRED CPIAUCNS | derived.ts:451 |
| `us-cpi-core-yoy` | `yoyPctSeries(CPILFENS)` | FRED CPILFENS | derived.ts:452 |
| `us-pce-core-yoy` | `yoyPctSeries(PCEPILFE)` | FRED PCEPILFE | derived.ts:455 |
| `us-wages` | `yoyPctSeries(AHETPI)` | FRED AHETPI | derived.ts:461 |
| `us-nfp` | `monthlyChangeSeries(PAYEMS)` — the month-on-month level change (thousands of jobs) | FRED PAYEMS | derived.ts:654 (monthlyChangeSeries:238) |
| `rba-expectations` | `RBA 3y bond − RBA cash rate`, 4dp | RBA F2 FCMYGBAG3D · F1 | derived.ts:786-788 |
| `au-us-10y-gap` | `RBA au10y − DGS10`, 4dp | RBA F2 + FRED DGS10 | derived.ts:789-791 |
| `rba-fed-gap` | `RBA cash rate − Fed corridor midpoint`, 4dp, per-change (steps only on decisions) | RBA F1 + FRED DFEDTARL/U | derived.ts:798-801 |
| `repo-stress` | `SOFR − IORB` (inner join on same dates), 4dp — fail-closed [] when the legs share no date | FRED SOFR (04:10 main) + IORB (rung-4, future-rows trimmed) | rung4.ts:132-138 |
| `net-liquidity` | `WALCL − (TGA + RRP×1000)` (RRP is $B; WALCL/TGA are $M — the ×1000 is the derivation's documented constant), Wednesday-joined, 4dp, fail-closed | FRED WALCL · WTREGEN · RRPONTSYD | rung4.ts:141-165 |
| `us-deficit-12m` | rolling trailing-12-month sum of MTSDS133FMS ($M; negative = deficit), 4dp, fail-closed under 12 obs; `us-deficit-monthly` = the MTSDS133FMS series itself | FRED MTSDS133FMS | rung4.ts:172-199 |
| `cftc-gold-positioning` (adapter metric) | `(NonComm Long − NonComm Short) ÷ Open Interest × 100`, bounded [−100, 100]; the parse asserts the file's own arithmetic identity (NonComm Long + Spread + Commercial Long = Total Reportable Long); **one weekly point per fetch** — the file carries only the latest week, the series accumulates each Saturday | CFTC `dea/newcot/deafut.txt`, row `GOLD - COMMODITY EXCHANGE INC.` | cftc.ts:35-44 · 104-117 |
| `sp500-breadth-ratio` (adapter metric) | `RSP ÷ SPY` adjusted closes (inner join on common dates), 4dp; the last bar of each leg is the live session's provisional close | Yahoo chart API ×2 | sp500-breadth.ts:1-30 |
| the price-row family (`gold-usd`, `silver-usd`, `btc-usd`, `platinum`, `copper-usd`, `brent`) | Yahoo 10y daily closes (the value history) ∪ WB monthly ∪ stored seeds ∪ the live spot — union by date, live wins; `brent` = FRED EIA spot extended by Yahoo `BZ=F` daily closes (`fillBrentGap`); `copper-usd` = live HG × 2204.62262 (lb→mt) | Yahoo · World Bank · gold-api · FRED | derived.ts:680-738 (fillBrentGap:283) |

The YoY family `au-cpi` / `au-trimmed-mean` / `au-wage-growth` /
`au-rent-yoy` / `au-petrol-yoy` are `yoyPctSeries` of their ABS indexes
(derived.ts:778-814); `china-pmi` / `china-cpi` are
`nbsUnionSeries` unions of the NBS release parse with the stored
accumulation (derived.ts:264-281 · 610-611); `fed-target` is FRED
`DFEDTARL` direct with `DFEDTARU` attached as the corridor's upper bound
(derived.ts:372-375); `jgb-10y` is the MOF daily file with the FRED OECD
mirror as the labelled fallback (derived.ts:441-445); `usd-reserve-share`
is the direct IMF COFER SDMX series `G001.AFXRA.CI_USD.SHRO_PT.Q` (no
arithmetic — cofer.ts:47-56).

**Sources.ts note (the licence register):** every provider sits in
`SOURCE_RISK_REGISTER` (sources.ts) with its verbatim terms-lines quote —
the per-row licence levels in §1.3's table are the doc table's record of
that register; `L0*` marks the two rows the doc's table never recorded.

---

## 3. The rungs (03 §1.4)

The canonical map is `docs/gap-closure/RUNGS.md` (maintained with every
rung change; the doc §2's rung table is the older summary — its
"Saturday 04:25 +2 fetches: EIA + CFTC" line is superseded by RUNGS.md's
rung-2 row: the CFTC and EIA-crude-stocks fetches ride the **04:20 rung-2
Saturday gate**, rung2.ts:68-69, the plan's `cftcWeekly`/`eiaWeekly` flags
at run.ts:835). Everything schedules inside the currena-api Worker's
`* * * * *` minute-cron via UTC hour:minute gates
(`apps/api/src/insights-ingest-cron.ts`).

| UTC | rung | what lands (the gold-relevant sources bolded where applicable) | gate notes |
|---|---|---|---|
| `04:10` | **main ingest** | collect every source — FRED bulk groups (SEVEN: the nominal full-history pair, DFII10's own `cosd=2003-01-02` request, five decade-window groups — **real-yield-10y, us10y, us30y, us-2y, fed-target, yield-curve-10y2y/10y3m, brent, breakeven-5y5y/10y, t5yie, vix, stress-stlfsi, nfci, euro-hicp legs, us-cpi/pce/wages indexes, m2-us…**), **ECB (ecb-dfr, euro-aaa-10y, euro-hicp)**, BoE, NBS, **Frankfurter (usdjpy, eur-usd, usdtry + the dollar-basket legs)**, World Bank, **gold-api (gold-usd, silver-usd, gold-silver's live legs)**, Yahoo, ABS, RBA, Bitstamp, Alternative.me — then derive, validate, write snapshot + status + public projection + archives + stage. The real-yield scoring input carries the counted DGS10−T10YIE cross-fill (real-yield-fill.ts; the stored history stays pure DFII10). | ~47/50 subrequests, ~5 KV writes; FULL — never add fetches |
| `04:20` | **rung 2** | **MOF jgbcme.csv (jgb-10y daily)** + the daily-history-ALPHA phase + the gated additions: **CFTC gold positioning (Saturday)** · EIA crude stocks (Saturday) · **OECD CLI + GPR + EPU (first-of-month)** · the S6-M6.1 NZ mirrors (first-of-month) · the NBS China property/steel pair (the 21st–25th release window) · **IMF COFER usd-reserve-share (Saturday gate, idempotent)** · **sp500-breadth-ratio (DAILY, +2 sequential Yahoo calls)** + bootstraps; fetch, patch, re-stage | ~12–41 subrequests, ~4 writes |
| `04:25` | history daily-a | daily-cadence history writes, first half (the exceededCpu split) | ~26 |
| `04:27` | history daily-b | daily-cadence history writes, second half | ~26 |
| `04:30` | rung 3 | the extra-sources slot: TIC SLT (15th–25th daily until the new data month, else Saturdays) · IMF PortWatch chokepoints (daily) · the ABS au-macro family (daily) | own 50-budget, per-source isolation |
| `04:35` | rung 4 | the second slot: the `fred-s3` FRED ZIP groups (**term-premium-10y, tga, reverse-repo, bank-reserves + the repo-stress/net-liquidity legs + median-cpi, sticky-cpi, gdpnow, empire-state, continuing-claims, sloos-ci-tightening, the deficit pair**), daily · **frb-ebp (Saturday re-check)** · **ofr-fsi (daily)** · the Treasury auction four (**Node venue ONLY** — fiscaldata is blocked from Worker egress) | declared 24 + 10 + 10 |
| `04:40` | history periodic | monthly/quarterly/per-change history writes — read-compared (only on change) | ~26 reads + rare writes |
| hourly `:13` | live prices | Yahoo quotes → the prices board (gold-usd's change fields refresh here) | 4 fetches |
| hourly `:50` | narrator | Layer-2 states from the public projection | ≤3 model calls |
| quarter-hours | Frankfurter | the ECB pair rides the ever-green ladder | 1 |
| `10:10`/`20:10` | sweeps | gated re-runs only on failures/staleness (>10h) + the extra-rung heal (day gate bypassed) | 1 healthy read |

**The freshest possible age of each reading** (the rungs' whole point):
daily FRED/ECB/MOF/gold-api/Frankfurter series land at 04:10–04:20 UTC
same-day (a daily card's honest floor is ~1 day + the staleness window);
the weekly CFTC point lands Saturday (~3d report lag, one point per
fetch); the monthly trio (OECD CLI/GPR/EPU) lands the 1st; COFER
Saturdays (quarterly, idempotent); the auctions land on the Node venue's
inline build (GHA) whenever it runs. The 10:10/20:10 sweeps heal failures
within hours.

---

## 4. The mirror sweep (01 §5.4, D-GA-4) — method and tally

**Method (stated so every mark is auditable).** The sweep's question is
about **today's wiring, not the classic set**: for every one of the 161
ingested ids, what role does it hold in the gold meter's data plane right
now? The marks:

- **`voter`** (21) — the id is one of the `GOLD_LANE_VOTERS` seats
  (gold-score.ts:158-183). A pure code fact.
- **`context`** (63) — never a gold-lane seat, but part of the gold
  story's rendering neighborhood today: (a) the context rows of the four
  gold-lane-home gauges (borrowing-costs, dollar-strength, market-stress,
  prices-heat — the gauges the gold lanes' voters belong to), unless the
  card's subject is plainly non-gold (crypto sentiment, equity valuation,
  energy, soft commodities); (b) the gold-family price/ratio surfaces
  (gold-usd's price tile, silver-usd, platinum, btc-usd, gold-btc,
  gold-oil-ratio, copper-gold, gold-aud); (c) the gold connection cards'
  legs (brent — the dollar-gold-oil card, connections.ts:195-203); (d) the
  dedollar-concentration shadow (usd-reserve-share, sp500-breadth-ratio —
  context-only until S6-M6.4, G-5); (e) the spec's own D-GA-4 enumeration
  of gold-classic context series where they render in other lanes
  ("GPR, EBP, OFR FSI, M2, Michigan expectations, term premium, COFER USD
  share, TIC, …" — README D-GA-4 — plus the same event-risk class's
  epu-us/tpu-us, a judgment this session records openly).
- **`not-gold`** (77) — no gold role on today's page: the Australian
  lanes (except gold-aud), the growth/labour cards that are not D-GA-4
  gold-classic, the geo-fragmentation supply cards, the energy/soft
  commodity cards, crypto-fng, the Shiller pair, the non-dollar FX legs.

**These marks are wiring-status facts with one-word reasons — not the six
classification classes (D-GA-6) and not taxonomy mappings (D-GA-1).**
GA-S3 re-derives every gold-relevance question against the locked
checklist; this sweep only guarantees the reverse list exists so nothing
gold-relevant can be "discovered later by accident" — and so the
`not-gold` set is a recorded, reviewable opinion, not an omission.

**Tally — counted from the delimited readings-table region of this file
(between the `<!-- TABLE:161 -->` / `<!-- /TABLE -->` markers) with
`grep -c` of each of the three mark strings:**

> **voter 21 · context 63 · not-gold 77 = 161** (every id in the wire's
> reading set marked exactly once)

---

## 5. Deferred to the post-lock completion session (blocked on OI-GA-1)

Per the GA-S2 prompt's fallback (the owner not reachable in-session), the
following halves of A2 are **not done** — the wiring trace needs the
locked denominator (D-GA-1):

1. **The voters table (03 §1.1)** — the 21 seats transcribed verbatim with
   line numbers, lane, polarity, and the `evalLeg` rule that applies per
   voter (which `SIGNAL_LEG_MOVE` threshold exists — connections.ts:575-585
   defines one for only 4 of the 21 ids — and the percentile basis). The
   scan already prints each voter's `gold-score.ts` line number
   (evidence/wire-scan-2026-11-04.txt §2); the transcription itself is
   wiring work.
2. **The wiring trace (03 §2)** — `evidence/wiring.md`: all 21 voters
   source → reading → seat with path:line citations (TRACE-BROKEN as a
   finding), plus the abbreviated context traces ending in "never votes".
3. **The history depths (03 §2)** — the per-voter point counts `evalLeg`
   can reach in the stored corpus (the known suspects:
   `cftc-gold-positioning`, `gold-silver`, `us-japan-10y-gap`), read-only
   from `packages/insights/fixtures/gold-backtest-corpus.json` (the
   recorded corpus of 2026-11-03T04:43:54Z) + the KV-dump fixtures, via a
   read-only script in the `gold-corpus-dump` precedent's footsteps.

**The owner's lock question (OI-GA-1):** LOCK or AMEND the 82-row v1
taxonomy (`02-REFERENCE-TAXONOMY.md`). Until then the audit cannot count
coverage (D-GA-1) and GA-S3 cannot run.
