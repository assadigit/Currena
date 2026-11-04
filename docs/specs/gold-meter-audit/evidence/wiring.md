# GA-S2 evidence — the wiring trace (A2's second half, 03 §2)

**Status: delivered 2026-11-05 by the GA-S2-completion session, against the
LOCKED denominator** (02-REFERENCE-TAXONOMY v1.1 = 85 rows, LOCKED
2026-11-05 — the owner's delegated instruction; the lock record at 02's
foot). This file completes A2 beside `evidence/inventory.md` (the
source-side half + the voters table §5): **§1** the full wiring trace for
each of the 21 gold-lane voters; **§2** the abbreviated traces for the
63 context-marked gold-relevant series (D-GA-4), each ending in "never
votes"; **§3** the history depths — the per-voter point counts `evalLeg`
can actually reach (the runnable record:
`packages/insights/scripts/ga-s2-history-depths.sh`, its committed run
`evidence/history-depths-2026-11-05.txt`).

**Method and citation rules (03 §2).** Every hop cites `path:line`; a hop
that cannot be shown in code is `TRACE-BROKEN` — itself a finding. Nothing
here classifies anything (D-GA-6 — the six classes are GA-S3's, against the
locked taxonomy); every row records wiring facts only. No production worker
was run, no KV written (D-GA-3): the wire facts quote the committed scan
runs (`evidence/wire-scan-2026-11-05.txt`, the freshest), the corpus facts
quote the committed corpus fixture, and the code facts were read from the
files this session. **"What the visitor sees"** is the same hop for every
voter: the SPA re-derives the balance client-side from the SAME
`/api/insights` payload (`goldBalance(readings)` called at
`apps/web/src/components/insights/signals/MergedCard.tsx:113`), one chip per
lane with **the member line one tap away in the lane's ledger**
(`MergedCard.tsx:220-224` — id · supports/pressures/steady/unread · the
evaluator's evidence word rising/falling/high/low,
`MergedCard.tsx:187-195`), the header prose from the same result
(`metalLeanLanes`, `MergedCard.tsx:158-163`) and the Outlook sentence
(`goldOutlookOf(balance, …)`, `MergedCard.tsx:121`). The per-row column
therefore says only what is voter-specific.

---

## 1. The voter wiring traces — source endpoint → adapter → rung → reading → staleness → evalLeg inputs → seat → visitor

| # | voter (seat @ gold-score.ts) | source endpoint | adapter (file, fn) | rung | reading id · staleness (d) | evalLeg inputs (the history the legs read) | seat (lane · polarity) | the voter-specific visitor line |
|---|---|---|---|---|---|---|---|---|
| 1 | `real-yield-10y` @158 | `fredgraph.csv?id=DFII10` (`fred.ts:22` + `fredSeriesUrl` :39) | `fred.ts` — its OWN 'since' bulk group, whole history cosd 2003-01-02 (`fred.ts:301-305`; `FRED_SERIES.realYield10y` :144) | 04:10 main | `real-yield-10y` · 4 (daily default, `freshness.ts:80`) | move: change30d vs **0.1 pts** (`connections.ts:576`); level: percentile10y over trailing 3650d of the level (`scoring.ts:63/115-120/511-515`) — base **2,497 pts** (§3) | borrowing-costs · −1 | member line ("THE textbook driver" seat) |
| 2 | `us10y` @159 | `fredgraph.csv?id=DGS10,DGS30` (full history, `fred.ts:293-296`) | `fred.ts` — the FULL-history pair group (`FRED_SERIES.us10y` :145) | 04:10 main | `us10y` · 4 (default) | move: **0.15 pts** (`connections.ts:582`); level: trailing 3650d — base **2,497** | borrowing-costs · −1 | member line |
| 3 | `us30y` @160 | `fredgraph.csv?id=DGS10,DGS30` | `fred.ts` — the FULL-history pair group (`FRED_SERIES.us30y` :171) | 04:10 main | `us30y` · 4 (override `definitions.ts:147`) | move: none — level only; level base **2,497** | borrowing-costs · −1 | member line |
| 4 | `fed-target` @161 | `fredgraph.csv` monthly-US-macro ZIP group (`fred.ts:333-348`) | `fred.ts` — DFEDTARL+DFEDTARU in group 4 (`FRED_SERIES.fedTargetLower/Upper` :160-161) | 04:10 main | `fed-target` · 5 (override `definitions.ts:108`) | move: none; level base **3,649** (daily corridor series) — steps on decisions, `lastChange` attached (`scoring.ts:505-506`) | borrowing-costs · −1 | member line + "Last change" step line |
| 5 | `fed-expectations` @162 | derived: DGS2 − corridor midpoint | `derived.ts:415-418` (the derivation; DGS2 = `FRED_SERIES.us2y` :170, decade group `fred.ts:321`) | 04:10 main (derived after collect) | `fed-expectations` · 4 (override `definitions.ts:127`) | move: none; level over the derived series — base **2,497** | borrowing-costs · −1 | member line |
| 6 | `ecb-dfr` @163 | `data-api.ecb.europa.eu/service/data/FM/D.U2.EUR.4F.KR.DFR.LEV?format=csvdata` (`ecb.ts:17-20, 45-48`) | `ecb.ts` — `fetchEcbDfrSeries` (collect.ts:366) | 04:10 main | `ecb-dfr` · 7 (override `definitions.ts:225`) | move: none; level over the full-history DFR — base **3,649**. **The hold rule: a failed fetch carries value+asOf with status `stale` and DROPS both derived fields** (`snapshot.ts:451-465`) — the 2026-11-05 drift's mechanism | borrowing-costs · −1 | member line; on outage days the unread member |
| 7 | `yield-curve-10y2y` @164 | `fredgraph.csv` daily rates/stress ZIP group (`fred.ts:315-329`) | `fred.ts` — T10Y2Y in group 3 (`FRED_SERIES.yieldCurve10y2y` :139) | 04:10 main | `yield-curve-10y2y` · 4 (default) | move: none; level base **2,495** | borrowing-costs · −1 | member line |
| 8 | `yield-curve-10y3m` @165 | same group 3 request | `fred.ts` — T10Y3M beside 10y2y (`FRED_SERIES.yieldCurve10y3m` :142) | 04:10 main | `yield-curve-10y3m` · 4 (default) | move: none; level base **2,495** | borrowing-costs · −1 | member line |
| 9 | `dollar-basket` @168 | Frankfurter `…/v1/{start}..?from=USD&to=EUR,JPY,GBP,CAD,SEK,CHF` (`frankfurter.ts:13/45-50`) | `basket.ts:18-49` + `derived.ts:321-355` (the DXY-recipe weighted geometric mean) | 04:10 main (derived) | `dollar-basket` · 4 (override `definitions.ts:1754`) | move: **1.0 pts** (`connections.ts:580`); level over the basket series — base **2,555** | dollar · −1 | member line |
| 10 | `usdjpy` @169 | same Frankfurter request (JPY leg) | `frankfurter.ts:58-66` (per-ccy series) | 04:10 main | `usdjpy` · 4 (default) | move: none; level base **2,555**; **pct changeKind** — the only pct seat | dollar · −1 | member line |
| 11 | `us-japan-10y-gap` @170 | derived: staged us10y × the jgb series the 04:20 phase resolved | `ingest/run.ts:886-899` (`quantizedGap` over `stage.series['us10y']` × the stored∪fetched jgb) + the mirror path `derived.ts:575-580` | 04:20 rung-2 | `us-japan-10y-gap` · 5 (override `definitions.ts:1787`) | move: none; level over the join — **the staged series is 21 pts (base 20 < 30): the percentile exists only when the reading-time join reaches the stored jgb accumulation + OECD monthly mirror tail — 6/9 recorded days** (§3) | dollar · −1 | member line; percentile-only most days |
| 12 | `stress-stlfsi` @173 | group 3 ZIP (`fred.ts:315-329`) | `fred.ts` — STLFSI4 (`FRED_SERIES.stressStlfsi` :143) | 04:10 main | `stress-stlfsi` · 14 (override `definitions.ts:1410`) | move: none; level base **521** (weekly cadence) | stress · +1 | member line |
| 13 | `nfci` @174 | group 3 ZIP | `fred.ts` — NFCI (`FRED_SERIES.nfci` :162) | 04:10 main | `nfci` · 14 (override `definitions.ts:1433`) | move: none; level base **521** | stress · +1 | member line |
| 14 | `vix` @175 | group 3 ZIP | `fred.ts` — VIXCLS (`FRED_SERIES.vix` :168) | 04:10 main | `vix` · 4 (override `definitions.ts:1447`) | move: none; level base **2,544** | stress · +1 | member line |
| 15 | `gold-silver` @176 | gold-api XAU/XAG spot + the WB Pink Sheet history + KV seeds | `derived.ts:548-564` (the union, live wins) | 04:10 main (derived) | `gold-silver` · 2 (override `definitions.ts:1740`) | move: none; level over the union — base **119 (THIN vs the ~250 bar)**; change30d **0/19 recorded days** (the live leg of the union was <30d old through the corpus record; both fields present on the 2026-11-04/05 wires) | stress · +1 | member line |
| 16 | `cftc-gold-positioning` @177 | `cftc.gov/dea/newcot/deafut.txt` (the GOLD row) | `cftc.ts:35-44, 104-117` (net non-comm share of OI, the file's own arithmetic asserted) | 04:20 rung-2 · Saturday gate (`rung2.ts:327-336`) | `cftc-gold-positioning` · 12 (override `definitions.ts:735`) | move: none; level over the accumulated weekly series — **the staged series is 1 point (base 0): neither leg has an input — 0/9 recorded days** (§3). "One weekly point per fetch — the series accumulates each Saturday" (`rung2.ts:327-328`) | stress · −1 | member line; structurally unread today |
| 17 | `us-cpi-yoy` @179 | group 4 monthly ZIP (`fred.ts:333-348`) | `fred.ts` CPIAUCNS (:156) → `derived.ts:451` (yoyPctSeries) | 04:10 main (derived) | `us-cpi-yoy` · 75 (override `definitions.ts:513`) | move: none; level base **118** (monthly cadence — a decade of prints); change30d = previous-release change (`scoring.ts:495-497`) | inflation · +1 | member line |
| 18 | `us-pce-core-yoy` @180 | the mixed early-warning ZIP group (`fred.ts:393-405`) | `fred.ts` PCEPILFE (:199) → `derived.ts:455` | 04:10 main (derived) | `us-pce-core-yoy` · 95 (override `definitions.ts:548`) | move: none; level base **119**; previous-release change | inflation · +1 | member line |
| 19 | `euro-hicp` @181 | `data-api.ecb.europa.eu/…/HICP/M.U2.N.000000.4D0.ANR?format=csvdata&startPeriod=<decade>` (`ecb.ts:43-68`) | `ecb.ts` — the post-Feb-2026 4D0 dataset (collect.ts) | 04:10 main | `euro-hicp` · 60 (override `definitions.ts:615`) | move: none; level base **119**; previous-release change | inflation · +1 | member line |
| 20 | `breakeven-5y5y` @182 | group 3 ZIP (`fred.ts:315-329`) | `fred.ts` T5YIFR (:146) | 04:10 main | `breakeven-5y5y` · 4 (default) | move: **0.1 pts** (`connections.ts:581`); level base **2,495** | inflation · +1 | member line |
| 21 | `breakeven-tilt` @183 | derived: T5YIFR − T5YIE (both collected) | `derived.ts:478-483` (common-date join, 4dp) | 04:10 main (derived) | `breakeven-tilt` · 5 (override `definitions.ts:1279`); **rule `info` — wire status `context`** | move: none (the D-5 promotion's recorded level-only variant, `gold-score.ts:145-153`); level base **2,495**; `readable()` admits context-status (`gold-balance.ts:127-129`) | inflation · +1 | member line (a prices-heat context card holding a gold-lane seat) |

**The trace verdict: no TRACE-BROKEN rows.** Every hop of every one of the
21 chains is shown in code above — source endpoint, adapter, rung, reading,
staleness window, both evalLeg input paths, the seat, and the visitor's
member line. What the trace FOUND is not broken hops but **four input-quality
findings and one structural finding**, recorded as facts for GA-S3's H-questions
(03 §4):

1. **`cftc-gold-positioning` — the never-fires seat, now numbered.** The
   staged series holds **1 point** (2026-10-27), percentile base **0**,
   change30d input absent; over the 9 recorded archive days **0/9 carried
   either input** (`history-depths-2026-11-05.txt` §2/§3). The spec's own
   "never fires today" note is now a measured number: the level leg needs
   ≥ 30 accumulated Saturdays (MIN_PERCENTILE_OBS) before it can even
   exist — the earliest possible fire is ~30 weeks of clean Saturday
   fetches after the accumulation began.
2. **`us-japan-10y-gap` — the intermittent percentile.** The staged series
   is **21 points** (base 20 < 30); the reading-time derivation
   (`run.ts:886-899`) joins the STAGED us10y (decade-deep) with the
   stored-jgb accumulation (+ the OECD monthly mirror tail on MOF outage
   days, `run.ts:864-873`), so the live reading's percentile appears only
   when that join runs deep enough — **6/9 recorded days** had pct10y,
   **1/9** had change30d. The self-flagged "stale most windows" is now
   "the level leg is intermittent, the move leg effectively absent".
3. **`gold-silver` — the thin union base.** The union series (WB monthly
   decade ∪ KV seeds ∪ live XAU/XAG) holds **122 points, base 119** —
   under the H2 ~250 bar; and **change30d was absent 19/19 recorded days**
   (the live leg of the union was younger than 30 days across the whole
   corpus record — a move input could not exist yet). Both fields are
   present on the 2026-11-04/05 wires (the live tail has aged past 30
   days), so the move-input history begins now — the level leg stays the
   only structural one.
4. **`ecb-dfr` — the honest hold.** The 2026-11-05 drift record's question
   ("why did the ECB seat age out between the snapshots with BOTH inputs
   gone?") is answered by one rule: a failed fetch holds the last good
   value with the original asOf and status `stale`, and the held line
   carries NO derived fields (`snapshot.ts:451-465`) — change30d and
   percentile10y drop with the rebuild. The trigger (the ECB venue's WAF
   blocking that run's fetch) is the drift record's own fact; the mechanism
   is the wiring fact recorded here.
5. **The structural finding — 17 of 21 seats are level-leg only.**
   `SIGNAL_LEG_MOVE` carries thresholds for only 4 ids
   (`connections.ts:575-585`), so for 17 seats the ONLY fire path is the
   decade-extreme percentile (> 0.8 / < 0.2 of the trailing-3650d level
   base). A readable-but-typical seat reads `steady` by construction —
   H1/H2 territory for GA-S3, quantified per seat by §3's bases.

---

## 2. The context traces — the 63 gold-relevant series that never vote (D-GA-4)

**Method.** The mirror sweep (inventory.md §4) marked every one of the 161
ingested ids `voter` / `context` / `not-gold`; the 63 `context` marks are
traced here, abbreviated per 03 §2: source · ref, the adapter file:line,
the rung (RUNGS.md canonical), the staleness window, the card it renders
on — and the explicit **never votes** note. "Never votes" means **never a
gold-lane seat**: several of these ARE scored voters in their own non-gold
gauges (brent in prices-heat, copper-gold in growth-health,
sp500-breadth-ratio in the dedollar shadow) — they render beside the gold
story without ever entering `GOLD_LANE_VOTERS`. The mechanical columns are
transcribed from inventory.md §1.3 (itself the `ga-s2-wire-scan.sh` record)
and the adapter/rung facts from this session's code reads (cited per row);
the re-derived table check: the 161-row parse yields exactly voter 21 ·
context 63 · not-gold 77 (the committed tally).
<!-- parsed 161 rows; context-marked: 63 (the committed tally: voter 21 · context 63 · not-gold 77) -->

| id | source · ref | adapter (path:line) | rung | stale (d) | the card it renders on | never votes — the mirror-sweep reason |
|---|---|---|---|---|---|---|
| `bank-reserves` | fred · WRESBAL | rung4.ts — the FRED_S3 ZIP groups (S3-M3.2) | 04:35 rung-4 | 21 | market-stress · context | never votes — liquidity |
| `boe-rate` | boe · Bank of England official Bank Rate history | boe.ts (the Bank-Rate page) | 04:10 main | – | borrowing-costs · context | never votes — foreign-policy-rate |
| `boj-rate` | fred · IRSTCI01JPM156N | fred.ts:103 (bulk) — the groups fred.ts:286-405 | 04:10 main | 75 | borrowing-costs · context | never votes — foreign-policy-rate |
| `breakeven-10y` | fred · T10YIE | fred.ts:103 (bulk) — the groups fred.ts:286-405 | 04:10 main | 4 | prices-heat · context | never votes — spot-breakeven |
| `brent` | fred · DCOILBRENTEU | fred.ts:103 (bulk) — the groups fred.ts:286-405 | 04:10 main | 12 | prices-board · voter · prices-heat | never votes — connection-leg |
| `btc-usd` | gold-api · gold-api.com BTC spot | goldapi.ts:33-38 (spot) | 04:10 main | 2 | prices-board · context | never votes — store-of-value |
| `btp-bund-spread` | derived · FRED IRLTLT01ITM156N | derived.ts:435-440 | 04:10 main | 75 | borrowing-costs · context | never votes — EU-sovereign-stress |
| `bund-10y` | fred · IRLTLT01DEM156N | fred.ts:103 (bulk) — the groups fred.ts:286-405 | 04:10 main | 75 | borrowing-costs · context | never votes — foreign-10y |
| `copper-gold` | derived · World Bank copper ÷ gold | derived.ts:647 | 04:10 main | 60 | growth-health · voter · growth-health | never votes — ratio |
| `ebp` | frb · Federal Reserve Board:EBP | credit.ts (runInsightsCreditPhase, ebp) | 04:35 rung-4 | 75 | market-stress · context | never votes — credit-premium |
| `epu-us` | epu · Baker-Bloom-Davis US Economic Policy Uncerta | monthly-indexes.ts:137 (the BBD workbook) | 04:20 rung-2 | 75 | growth-health · context | never votes — policy-uncertainty |
| `eur-usd` | frankfurter · Frankfurter USD→EUR | frankfurter.ts:45-66 (one 8-ccy fetch) | 04:10 main | 4 | dollar-strength · context | never votes — dollar-leg |
| `euro-aaa-10y` | ecb · YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y | ecb.ts:45-68 | 04:10 main | 7 | borrowing-costs · context | never votes — euro-10y |
| `gilt-10y` | fred · IRLTLT01GBM156N | fred.ts:103 (bulk) — the groups fred.ts:286-405 | 04:10 main | 75 | borrowing-costs · context | never votes — foreign-10y |
| `gold-aud` | derived · gold-api.com XAU × Frankfurter USD→AUD | derived.ts:844-847 | 04:10 main | 4 | au-trade-currency · context | never votes — gold-price |
| `gold-btc` | derived · gold-api.com XAU ÷ BTC | derived.ts:773-775 | 04:10 main | 4 | prices-board · context | never votes — ratio |
| `gold-oil-ratio` | derived · gold-usd ÷ brent | derived.ts:743-749 | 04:10 main | 3 | prices-heat · context | never votes — ratio |
| `gold-usd` | gold-api · gold-api.com XAU spot | goldapi.ts:33-38 (spot) | 04:10 main | 2 | prices-board · context | never votes — price-tile |
| `govt-interest-revenue` | derived · A091RC1Q027SBEA ÷ FRED:W006RC1Q027SBEA | derived.ts:395-403 | 04:10 main | 215 | borrowing-costs · voter · borrowing-costs | never votes — excluded-by-design |
| `gpr-acts` | gpr · Caldara-Iacoviello GPR acts sub-index | monthly-indexes.ts:194 (the monthly GPR export) | 04:20 rung-2 | 75 | market-stress · context | never votes — event-risk |
| `gpr-australia` | gpr · Caldara-Iacoviello country GPR: Australia | monthly-indexes.ts:194 (the monthly GPR export) | 04:20 rung-2 | 75 | market-stress · context | never votes — event-risk |
| `gpr-china` | gpr · Caldara-Iacoviello country GPR: China | monthly-indexes.ts:194 (the monthly GPR export) | 04:20 rung-2 | 75 | market-stress · context | never votes — event-risk |
| `gpr-daily` | gpr · Caldara-Iacoviello daily GPR, 7-day moving a | monthly-indexes.ts (the daily GPR export, fetchGprDaily) | 04:20 rung-2 (daily fetch) | 12 | market-stress · context | never votes — event-risk |
| `gpr-index` | gpr · Caldara-Iacoviello Geopolitical Risk Index | monthly-indexes.ts:194 (the monthly GPR export) | 04:20 rung-2 | 75 | market-stress · context | never votes — event-risk |
| `gpr-israel` | gpr · Caldara-Iacoviello country GPR: Israel | monthly-indexes.ts:194 (the monthly GPR export) | 04:20 rung-2 | 75 | market-stress · context | never votes — event-risk |
| `gpr-russia` | gpr · Caldara-Iacoviello country GPR: Russia | monthly-indexes.ts:194 (the monthly GPR export) | 04:20 rung-2 | 75 | market-stress · context | never votes — event-risk |
| `gpr-saudi` | gpr · Caldara-Iacoviello country GPR: Saudi Arabia | monthly-indexes.ts:194 (the monthly GPR export) | 04:20 rung-2 | 75 | market-stress · context | never votes — event-risk |
| `gpr-taiwan` | gpr · Caldara-Iacoviello country GPR: Taiwan | monthly-indexes.ts:194 (the monthly GPR export) | 04:20 rung-2 | 75 | market-stress · context | never votes — event-risk |
| `gpr-threats` | gpr · Caldara-Iacoviello GPR threats sub-index | monthly-indexes.ts:194 (the monthly GPR export) | 04:20 rung-2 | 75 | market-stress · context | never votes — event-risk |
| `gpr-ukraine` | gpr · Caldara-Iacoviello country GPR: Ukraine | monthly-indexes.ts:194 (the monthly GPR export) | 04:20 rung-2 | 75 | market-stress · context | never votes — event-risk |
| `jgb-10y` | mof · Japan Ministry of Finance jgbcme.csv | mof.ts:148-166 (jgbcme.csv) | 04:20 rung-2 | 4 | borrowing-costs · context | never votes — YCC-regime |
| `m2-us` | fred · M2SL | fred.ts:103 (bulk) — the groups fred.ts:286-405 | 04:10 main | 90 | growth-health · context | never votes — money |
| `median-cpi` | fred · MEDCPIM158SFRBCLE | rung4.ts — the FRED_S3 ZIP groups (S3-M3.2) | 04:35 rung-4 | 75 | prices-heat · context | never votes — inflation-persistence |
| `michigan-1y-expectations` | fred · MICH | fred.ts:103 (bulk) — the groups fred.ts:286-405 | 04:10 main | 75 | growth-health · context | never votes — expectations |
| `mortgage-30y` | fred · MORTGAGE30US | fred.ts:103 (bulk) — the groups fred.ts:286-405 | 04:10 main | 14 | borrowing-costs · context | never votes — US-transmission |
| `net-liquidity` | derived · WALCL | rung4.ts:141-165 | 04:35 rung-4 | 21 | market-stress · context | never votes — liquidity |
| `nyfed-custody` | fred · WSEFINTL1 | fred.ts:103 (bulk) — the groups fred.ts:286-405 | 04:10 main | 21 | borrowing-costs · context | never votes — foreign-official-holdings |
| `ofr-fsi` | ofr · Office of Financial Research:OFR-FSI | credit.ts (runInsightsCreditPhase, fsi.csv) | 04:35 rung-4 | 7 | market-stress · context | never votes — stress-composite |
| `platinum` | gold-api · gold-api.com XPT spot | goldapi.ts:33-38 (spot) | 04:10 main | 2 | prices-heat · context | never votes — precious |
| `repo-stress` | derived · SOFR | rung4.ts:132-138 | 04:35 rung-4 | 4 | market-stress · context | never votes — funding-stress |
| `reverse-repo` | fred · RRPONTSYD | rung4.ts — the FRED_S3 ZIP groups (S3-M3.2) | 04:35 rung-4 | 4 | market-stress · context | never votes — liquidity |
| `silver-usd` | gold-api · gold-api.com XAG spot | goldapi.ts:33-38 (spot) | 04:10 main | 2 | prices-board · context | never votes — precious |
| `sloos-ci-tightening` | fred · DRTSCILM | fred.ts:103 (bulk) — the groups fred.ts:286-405 | 04:35 rung-4 | 215 | market-stress · context | never votes — credit-standards |
| `sofr` | fred · SOFR | fred.ts:103 (bulk) — the groups fred.ts:286-405 | 04:10 main | 4 | borrowing-costs · context | never votes — funding-rate |
| `sp500-breadth-ratio` | yahoo · RSP ÷ SPY daily closes | yahoo.ts:131 (chart/quote API) | 04:20 rung-2 | 4 | dedollar-concentration · shadow · dedollar-concentration | never votes — dedollar-shadow |
| `sticky-cpi` | fred · STICKCPIM158SFRBATL | rung4.ts — the FRED_S3 ZIP groups (S3-M3.2) | 04:35 rung-4 | 75 | prices-heat · context | never votes — inflation-persistence |
| `t5yie` | fred · T5YIE | fred.ts:103 (bulk) — the groups fred.ts:286-405 | 04:10 main | 5 | prices-heat · context | never votes — spot-breakeven |
| `term-premium-10y` | fred · THREEFYTP10 | rung4.ts — the FRED_S3 ZIP groups (S3-M3.2) | 04:35 rung-4 | 14 (def) | market-stress · context | never votes — term-premium |
| `tga` | fred · WTREGEN | fred.ts:103 (bulk) — the groups fred.ts:286-405 | 04:35 rung-4 | 21 (def) | market-stress · context | never votes — liquidity |
| `tpu-us` | epu · Baker-Bloom-Davis US Trade Policy Uncertaint | monthly-indexes.ts:137 (the BBD workbook) | 04:20 rung-2 | 75 | growth-health · context | never votes — policy-uncertainty |
| `treasury-auction-10y-indirect` | fiscaldata · Treasury FiscalData:auctions_query | auctions.ts:227 (Node venue ONLY) | 04:35 rung-4 · Node venue ONLY | 45 | borrowing-costs · context | never votes — auction-demand |
| `treasury-auction-10y` | fiscaldata · Treasury FiscalData:auctions_query | auctions.ts:227 (Node venue ONLY) | 04:35 rung-4 · Node venue ONLY | 45 | borrowing-costs · context | never votes — auction-demand |
| `treasury-auction-30y-indirect` | fiscaldata · Treasury FiscalData:auctions_query | auctions.ts:227 (Node venue ONLY) | 04:35 rung-4 · Node venue ONLY | 45 | borrowing-costs · context | never votes — auction-demand |
| `treasury-auction-30y` | fiscaldata · Treasury FiscalData:auctions_query | auctions.ts:227 (Node venue ONLY) | 04:35 rung-4 · Node venue ONLY | 45 | borrowing-costs · context | never votes — auction-demand |
| `us-2y` | fred · DGS2 | fred.ts:103 (bulk) — the groups fred.ts:286-405 | 04:10 main | 4 | borrowing-costs · context | never votes — policy-path |
| `us-cpi-core-yoy` | fred · CPILFENS | derived.ts:452 | 04:10 main | 75 | prices-heat · context | never votes — core-inflation |
| `us-deficit-12m` | derived · MTSDS133FMS | rung4.ts:172-199 | 04:35 rung-4 | 75 | borrowing-costs · context | never votes — fiscal |
| `us-deficit-monthly` | fred · MTSDS133FMS | rung4.ts — the FRED_S3 ZIP groups (S3-M3.2) | 04:35 rung-4 | 75 | borrowing-costs · context | never votes — fiscal |
| `us-wages` | fred · AHETPI | derived.ts:461 | 04:10 main | 75 | prices-heat · context | never votes — wages |
| `usd-reserve-share` | imf · IMF COFER | cofer.ts:203 (SDMX 3.0) | 04:20 rung-2 | 200 | dedollar-concentration · shadow · dedollar-concentration | never votes — dedollar-shadow |
| `usdaed` | yahoo · USD/AED daily closes | yahoo.ts:131 (chart/quote API) | 04:10 main | 4 | dollar-strength · context | never votes — dollar-leg |
| `usdtry` | frankfurter · Frankfurter USD→TRY | frankfurter.ts:45-66 (one 8-ccy fetch) | 04:10 main | 4 | dollar-strength · context | never votes — EM-pressure |
| `walcl` | fred · WALCL | fred.ts:103 (bulk) — the groups fred.ts:286-405 | 04:10 main | 21 | market-stress · context | never votes — liquidity |

---

## 3. The history depths — the numbers evalLeg can actually reach (03 §2)

**The runnable record:** `packages/insights/scripts/ga-s2-history-depths.sh`
(read-only, keyless, fetchless — the corpus fixture + source parses only; no
worker, no KV, no wire). Its committed run:
`evidence/history-depths-2026-11-05.txt`, against the corpus recorded
`2026-11-03T04:43:54Z` (the gold-corpus-dump record: 147 staged series, the
gold-usd history key, 19 raw archive days — the GB-S7 pre-parse rule
honoured). **Every number below is from that run.**

- **The healthy 15** — real-yield-10y · us10y · us30y · fed-target ·
  fed-expectations · ecb-dfr · yield-curve-10y2y · yield-curve-10y3m ·
  dollar-basket · usdjpy · stress-stlfsi · nfci · vix · breakeven-5y5y ·
  breakeven-tilt: percentile bases **2,495–3,649 points** (the trailing-3650d
  window of a decade-plus of dailies), move inputs present, archive-day input
  availability 17–19 of the recorded days. The two weekly seats
  (stress-stlfsi, nfci) carry **521-point** bases — a decade of weeklies.
- **The monthly three** — us-cpi-yoy · us-pce-core-yoy · euro-hicp: bases
  **118–119 points** — a full decade at monthly cadence (the H2 bar's "a
  decade of monthlies" reading; the ~250 figure is the daily-calibrated
  wording). Level legs exist; change30d is the previous-release change.
- **The suspects, numbered** — `cftc-gold-positioning` **1 staged point,
  base 0, 0/9 archive days with either input**; `us-japan-10y-gap`
  **21 staged points, base 20, pct10y 6/9 · change30d 1/9 recorded days**;
  `gold-silver` **122 staged points, base 119, change30d 0/19 recorded
  days** (both fields present on the 2026-11-04/05 wires — the live tail
  aged past 30 days). The interpretations are §1's findings 1–3.
- **The corpus's own bounds, stated:** the staged series record the
  stage as of 2026-11-03 (the newer ids' accumulations had just begun —
  yield-curve-10y3m appears on 9/19 archive days, us-pce-core-yoy and
  euro-hicp on 10/19, breakeven-tilt on 4/19: the A-1/M6/D-5 shipping
  dates, recorded as presence facts, not defects). The LIVE wire truth of
  the day is the committed scan family (`wire-scan-2026-11-04/-05.txt`).

---

## 4. What GA-S3 receives from this pack

- The locked denominator: **02 v1.1 = 85 rows** (S13 · F16 · X7 added by the
  owner's delegated pre-lock research; the lock record at 02's foot).
- The voters table: inventory.md §5 — 21 seats, verbatim, with the evalLeg
  rule per seat (4 move-threshold seats, 17 level-only).
- This trace: 21 full chains, no TRACE-BROKEN hops, five recorded findings
  (§1) — the H1/H2/H4 evidence base.
- The context set: §2's 63 never-votes rows — the D-GA-4 reverse list.
- The history depths: §3's numbers + the committed script and run.
- Nothing classified, nothing mapped to taxonomy rows (D-GA-1/D-GA-6):
  GA-S3 classifies every one of the 85 rows against this evidence.
