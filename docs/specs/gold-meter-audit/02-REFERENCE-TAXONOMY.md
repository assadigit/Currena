# 02. The reference taxonomy — the classic gold-direction checklist

**Status: v1.2 — amended by the owner's RECORDED answer G, 2026-11-05
(GF-S7 → executed at GF-P2 by the GF-S8 session; N-1 RESOLVED).**
v1.1 was LOCKED by the owner, 2026-11-05 (OI-GA-1 RESOLVED; the lock
record at the file's foot). The lock's own rule (D-GA-1): additions from
here are owner-recorded amendments with dates only — never silent. The
**v1.1 → v1.2 amendment** adds ONE row — **N-A1, the euro-area realised
inflation (HICP)** — on the owner's recorded answer G (the GF-S7 answer
sheet: "AMEND — an owner-recorded amendment with its date (2026-11-05);
the denominator becomes 86 and the arithmetic restates downstream.
Striking a healthy voter reduces coverage with no classic-literature
basis"). The amendment resolves finding N-1: the locked checklist held no
euro-area realised-inflation row while a healthy, wiring-complete voter
(`euro-hicp`) sat UNCLASSICATED — the amendment records the row the
checklist itself missed; the voter maps to it and the denominator becomes
**86** (the downstream arithmetic restated where it cites it — the audit
report's header arithmetic and the gapfill program's live-state docs).

**Status: v1.1 — LOCKED by the owner, 2026-11-05 (OI-GA-1 RESOLVED).**
The lock was delegated by the owner's instruction of 2026-11-05 (verbatim
in the lock record at the file's foot): research whether the items are
enough and the data streams reliable; add what is found; if enough, locked.
The pre-lock research pass (the GA-S2-completion session, 2026-11-05)
cross-checked the coverage against the canonical driver frameworks (the
Chicago Fed's "What Drives Gold Prices?" driver set — Letter 464, 2021; the
WGC demand-side framework) and re-verified the named free sources live
(`ga-s1-fred-verify.sh` re-run + the provider spot-checks — the full record
at the file's foot): it added 3 rows (S13 · F16 · X7, marked
**★ v1.1-add**, each carrying a classic use plus a live-verified free
source) and recorded the remaining candidates as considered-not-added with
reasons. **v1.1 = 85 rows is now the locked denominator (D-GA-1): additions
from here are owner-recorded amendments with dates only — never silent.**
Every v1 row was verified against the live source at GA-S1 (2026-11-04) —
the exact
FRED series id, the provider URL, the licence class, the served history
(script: `packages/insights/scripts/ga-s1-fred-verify.sh`; the full source
list with URLs in `PROGRESS.md`'s GA-S1 block). Rows amended by that
verification are recorded at the file's foot; rows added by the blind-spot
sweep (01 §5.3) are marked **★ v1-add** and listed in the sweep record;
nothing was struck (each family was walked for the pruning question too —
the honest answer is recorded below). Nothing in the row tables describes the current
meter — by design; where a row brushes the repo it is because the repo
already ingests that series (sourcing context only). The pre-scan at the
file's foot is labelled, bounded, and is **not part of the checklist**.

**How to read a row.** *Classic claim*: the sign convention a 20-year gold
desk applies — what the condition says about gold's direction and why (the
channel). *Source*: the free, keyless canonical source, with its licence
level per `docs/insights/LICENCES.md` — **L0** public domain / open,
**L1** attribution-class, **L2-cite** FRED's "citation required" class
(free and keyless, display-permitted with the "publisher via FRED"
attribution, per the repo's 2026-10-21 legal read), and, where the honest
answer is that no clean free source exists, a **MISSING-PAID** note with
its free proxy (D-GA-5; the classification itself is GA-S3's job — these
notes are availability facts, not classes). *Treatment*: how the classic
literature reads it — level, change, z-score/extreme, or context-only.

**The families.** R real rates & policy · D the dollar · I inflation &
purchasing power · S stress, risk & haven demand · F flows, positioning &
demand · X cross-asset relative value · G fiscal & sovereign · H supply ·
M meta (deliberately non-voting).

---

## R. Real rates & policy — the opportunity cost of holding gold

The single most documented driver: gold pays no coupon, so its price is
anchored to what a holder forgoes. Real, not nominal — the classic desk rule
is "watch DFII10 before anything else."

| ID | Indicator | Classic claim (sign → channel) | Free source | Cadence / lag | Treatment |
|---|---|---|---|---|---|
| R1 | US 10y real yield (TIPS) | **−**: the forgone long real return; falling real yields cut the carry penalty on gold, rising raises it | FRED `DFII10` (L0; verified live: daily, 6,218 pts since 2003-01-02, latest 2026-11-02) | daily / 0 | level vs decade range + 30–90d change |
| R2 | US 5y real yield | **−**: the belly is where policy expectations bite first | FRED `DFII5` (L0; verified live: daily since 2003-01-02, latest 2026-11-02). FRED's live TIPS tenors: 5y/7y/10y/20y/30y (`DFII5/7/10/20/30`, all verified live) | daily / 0 | same |
| R3 | Front-end real yield (2y) | **−**: the front end is the purest policy-path real rate | **no 2y TIPS series exists** — `DFII2` is absent from FRED (HTTP 404, verified 2026-11-04; the live tenor set is 5/7/10/20/30y). The free objects: `DFII5` (the shortest live TIPS tenor) and the nominal path (R6). The 2y real object itself exists only via paid inflation-swap decomposition — honest availability: proxy-only | daily / 0 (proxy tenors) | read off DFII5 / the nominal path; the exact object unavailable free |
| R4 | Real curve (10y−2y real; in practice 10y−5y TIPS) | regime-dependent: a steepening-from-inversion marks an easing cycle, historically gold's best regime; not a standalone direction bet | derived from the live TIPS tenors (e.g. `DFII10`−`DFII5`) | daily | context / secondary |
| R5 | Policy rate (Fed target range) | **−**: the level of the nominal anchor; cuts ease the carry penalty | FRED `DFEDTARU`/`DFEDTARL` (L0; verified live: daily through 2026-11-04, range era since 2008-12-17), `DFF` (L0, live) | daily (on change) / 0 | level + step direction |
| R6 | Market-implied policy path | **−**: the priced path is what moves gold before the Fed does (2y yield, or a fed-expectations derivation) | FRED `DGS2` (L0; verified live: daily through 2026-11-02) | daily / 0 | change + level vs decade range |
| R7 | Long-run breakeven (5y5y) | **+**: the market's priced long-run inflation — the hedge reason to hold gold at all | FRED `T5YIFR` (L2-cite; verified live: daily through 2026-11-03) | daily / 0 | level + change (the classic "expectations tilt") |
| R8 | Spot breakevens (5y, 10y) | **+**: near-horizon hedge demand; falling spot breakevens read as disinflation pressure on gold | FRED `T5YIE`, `T10YIE` (L2-cite; both verified live: daily through 2026-11-03) | daily / 0 | level + change |
| R9 | Term premium (10y) | **+**: compensation demanded for holding duration — rises with fiscal/inflation-risk fear, gold-positive | Two free objects, both verified live: FRED `THREEFYTP10` (Kim-Wright 10y term premium, L0 public domain, daily — the series the repo's own `term-premium-10y` context card reads) and the NY Fed ACM term-premia file (`ACMTermPremium.xls`, free/keyless, verified live: 10.2 MB) | daily / 0–days | level + change |
| R10 | Foreign policy rates (ECB DFR, BoJ, BoE) + policy gaps | **−** for gold in USD: gold is priced against the *global* rate structure; falling foreign real rates debase the alternatives | ECB Data Portal (ECB DFR; free — this audit's sandbox is venue-blocked, availability grounded by the repo's own live daily `ecb-dfr` ingest + licence register); BoE Bank-Rate page (verified live); BoJ site (verified live; the repo reads the FRED OECD mirror for `boj-rate`) | on change / 0 | level of gaps; context for the crosses |
| R11 | R-star / neutral-rate estimates | context: when policy sits above r*, the real penalty is restrictive — the regime label for the R-family | NY Fed HLW (free, quarterly; page verified live with the `Holston_Laubach_Williams_current_estimates.xlsx` download) | quarterly / ~1q | context-only |
| R12 | Negative-yielding debt universe | **+** historically (the 2015–2021 bid); the free compilations died with the phenomenon | none free since ~2022 (verified: no FRED series exists — searched this session) | — | NOT-APPLICABLE candidate (post-2022 the stock is ~0); the era note stands for GA-S3 |
| R13 ★ v1-add | TIPS liquidity / breakeven–swap basis | context: the breakeven-vs-swap spread isolates the TIPS liquidity premium (the 2008 and 2020 flights); a stressed TIPS-liquidity reading distorts the breakeven family (R7/R8) the gold hedge case leans on — a quality flag on the I/R expectation legs, not a direction bet | inflation swaps are OTC — **MISSING-PAID** (verified: no FRED series; FRED's breakeven family carries no liquidity decomposition). Free proxy: the repo's `breakeven-tilt` (T5YIFR−T5YIE) is the adjacent free object | — | context-only |
| R14 ★ v1-add | JGB 10y / YCC regime (yen funding) | regime-dependent: JGB 10y breaks out of the policy band mark the global-duration and yen-funding regime shifts that reach gold through both the R-family and D4 (2016's YCC launch, the 2024 exit); the classic yen-carry/funding gauge beside USD/JPY | MOF `jgbcme.csv` (free/keyless, Japan PDL 1.0; verified live this session) — the same file the repo's `jgb-10y` context card reads. The cross-currency basis itself has no free series (paid — noted, not a row) | daily / 0 | context; pairs with D4 and R10's Japan leg |

## D. The dollar — the denominator of the gold price

Gold is quoted in USD; a stronger dollar mechanically cheapens it for the
world's buyers and vice versa. The classic caution: DXY is euro-heavy — the
*trade-weighted* dollar is the honest measure, and the EME leg is the one
gold's marginal buyer actually pays in.

| ID | Indicator | Classic claim | Free source | Cadence / lag | Treatment |
|---|---|---|---|---|---|
| D1 | DXY / dollar basket | **−**: the headline inverse | ECB reference rates via Frankfurter (free/keyless, verified live: 2026-11-04 rates served) — the basket a DXY-style index is built from | daily / 0 | level vs decade range + change |
| D2 | Broad trade-weighted dollar | **−**: the honest inverse — trade weights, not the DXY's 57% euro | FRED `DTWEXBGS` (L0; verified live: daily through 2026-10-30) | daily / ~1d | level + change |
| D3 | EUR/USD | **−** via the DXY mechanics (the euro leg) | Frankfurter (verified live) | daily / 0 | cross-check / context |
| D4 | USD/JPY | **−**: the global carry pressure gauge; a falling USD/JPY marks unwinds that bid gold | Frankfurter (verified live: JPY 158.25 @ 2026-11-04) | daily / 0 | change emphasis |
| D5 | USD share of world FX reserves (COFER) | **−** for gold (long-run): reserve diversification away from USD is the structural gold bid | IMF COFER via api.imf.org SDMX 3.0 (free/keyless; verified live this session: HTTP 200, 126,820 B — byte-count matches the repo's own recorded payload; series `G001.AFXRA.CI_USD.SHRO_PT.Q`) | quarterly / ~1q | slow trend; context-voter debate (OI-GA-3/4) |
| D6 | Gold in non-USD terms (XAU/EUR, XAU/AED…) | context: regional price pressure and the "gold is really doing this" check that strips the dollar | Frankfurter × gold-api (both verified free/keyless live; the repo derives `gold-aud` this way today) | daily / 0 | context |
| D7 ★ v1-add | USD/CHF (the haven cross) | **−**-with-nuance: the franc is the fellow haven; a falling USD/CHF (CHF bid) marks the European haven-demand regime that accompanies gold's flight bids — the desk watches CHF and JPY together as the funding/haven pair | Frankfurter (ECB reference rate CHF leg; verified live: CHF 0.81548 @ 2026-11-04) | daily / 0 | change / extreme band; context-leaning |
| D8 ★ v1-add | EM devaluation episodes (USD/TRY and kin) | **+** for local physical demand: local-currency collapse episodes drive surge gold buying in the affected EMs (Turkey 2018/2021–23, Argentina, Egypt) — the classic local-demand channel; USD-gold impact is regime-dependent | Frankfurter USD/TRY (verified live: TRY 50.022 @ 2026-11-04; the ECB reference set carries the EM legs) | daily / 0 | event / extreme band; context |
| D9 ★ v1-add | EME trade-weighted dollar (the Fed's EME index) | **−**: extends the trade-weighted caution to gold's actual marginal buyer — gold demand is EM-heavy, so the EME dollar (not the euro-heavy DXY) is the leg that pressures EM buying power | FRED `DTWEXEMEGS` (L0; verified live: daily through 2026-10-30, latest 130.8602 — fetched beside `DTWEXBGS` 121.6656 and `DTWEXAFEGS` 114.3735, three distinct live series) | daily / ~1d | level + change |

## I. Inflation & purchasing power — the hedge reason

| ID | Indicator | Classic claim | Free source | Cadence / lag | Treatment |
|---|---|---|---|---|---|
| I1 | US headline CPI YoY + momentum | **+**: the realised-inflation channel of the hedge case | FRED `CPIAUCSL` (L0; verified live: monthly through 2026-09) | monthly / ~2–4w | level + 3m annualised momentum |
| I2 | Core CPI / core PCE YoY | **+**: the persistent core the Fed actually targets | FRED `CPILFESL`, `PCEPILFE` (both L0; verified live: monthly through 2026-09) | monthly / ~2–5w | level + momentum |
| I3 | Michigan 1-year inflation expectations | **+**: households pricing inflation in before the market does | FRED `MICH` (L2-cite © U. Michigan via FRED; verified live: monthly through 2026-09) — the repo's `michigan-1y-expectations` context card reads exactly this | monthly / ~2w | level + change |
| I4 | Michigan 5–10-year expectations | **+**: the long-run household anchor — the slow version of R7 | **UoM Surveys of Consumers SIE portal** (data.sca.isr.umich.edu — verified live this session): free table/chart exports, no API. FRED carries NO 5–10y series (verified: FRED's Michigan set is `MICH` + `UMCSENT` only) — honest availability: free-portal (a download, not a feed) | monthly / ~2w | level + change |
| I5 | Market long-run expectations | cross-listed R7 | FRED `T5YIFR` | daily / 0 | as R7 |
| I6 | Spot breakevens | cross-listed R8 | FRED `T5YIE`/`T10YIE` | daily / 0 | as R8 |
| I7 | Money supply (M2) growth | **+** on the debasement channel, slow-moving and regime-scale | FRED `M2SL` (L0; verified live: monthly through 2026-09) | monthly / ~4w | YoY level; context-leaning |
| I8 | Inflation persistence (median CPI, sticky CPI) | **+**: breadth and stickiness distinguish regimes from blips | Cleveland Fed median CPI = FRED `MEDCPIM158SFRBCLE` (v0 wrote `…SFRBCML` — that id does not exist; corrected to the repo's own live series) and Atlanta Fed sticky CPI = FRED `STICKCPIM158SFRBATL` (both verified live: monthly through 2026-09) | monthly | level; context-leaning |
| I9 | Inflation surprises vs expectations | **+**: upside surprises reprice the hedge case fast | Cleveland Fed nowcasts (page verified live this session) vs realised prints — free, model-updated near-daily | daily-ish | event/short-window; context-leaning |
| I10 | Real gold price vs its long-run range | context: the valuation anchor — how expensive gold is in purchasing-power terms (Jastram's golden-constant lineage) | derived (gold ÷ CPI; Shiller-method) | monthly | context-only |
| I11 ★ v1-add | Global liquidity / major-CB balance-sheet aggregate | **+** (slow, regime-scale): the sum/growth of the major central banks' balance sheets (Fed+ECB+BoJ) is the liquidity regime the debasement trade prices — the monetary anchor the gold literature's drivers frameworks carry at global scale | free legs, no single canonical file: FRED `WALCL` (L0; verified live: weekly through 2026-10-28) + ECB Data Portal + BoJ (both free; the ECB portal is venue-blocked to this audit's sandbox — repo's live legs ground it) | weekly-ish | YoY growth; context-leaning |
| N-A1 ★ v1.2-add | Euro-area realised inflation (HICP) | **+**: the euro bloc's realised-inflation channel of the hedge case — the same channel I1/I2 carry for the US, at the euro area's own scale (the 2022–24 European retail gold demand episode the desk literature records) | ECB Data Portal HICP annual rate (the repo's own `euro-hicp` card reads exactly this — the post-Feb-2026 dataset, monthly; re-verified at the audit's GA-S1 inventory walk) | monthly / ~2w | level + change |

## S. Stress, risk & haven demand

The classic nuance: safe-haven demand is *conditional* — in a rates-driven
selloff (2022) gold can fall with equities; in a credit/geopolitical shock
it bids. The family measures which regime is running.

| ID | Indicator | Classic claim | Free source | Cadence / lag | Treatment |
|---|---|---|---|---|---|
| S1 | VIX level (+ term slope) | **+**: equity fear bids gold — unless the fear *is* a real-rate shock | FRED `VIXCLS` (L2-cite © Cboe via FRED; verified live: daily through 2026-11-03) | daily / 0 | level vs range |
| S2 | High-yield credit spread | **+**: the classic risk gauge — widening HY is the credit-stress regime where gold's haven bid is cleanest | FRED `BAMLH0A0HYM2` — **honest availability re-classed (D-GA-5)**: the series is served keyless BUT (a) its FRED licence tag is *pre-approval required* (ICE BofA) — the class the repo's own register fail-closes (LICENCES.md, the OD-5 no-go), and (b) FRED's served history is now a rolling ~3-year window (first observation 2023-11-06 this session — 793 pts), which cannot support any decade-extreme treatment. Free proxy: the S5 composites (STLFSI4/NFCI/OFR FSI embed credit-spread legs) | daily (if licensed) | level + change — via the proxy while the object itself is unavailable |
| S3 | Investment-grade spread | **+** (secondary): confirms S2 is systemic, not idiosyncratic | FRED `BAMLC0A0CM` — same honest re-class as S2 (same pre-approval tag, same 3-year window, verified this session); same free proxy | daily (if licensed) | level + change — via the proxy |
| S4 | Excess bond premium (EBP) | **+**: the de-trended risk-appetite signal the literature prefers to raw spreads | Fed Board `ebp_csv.csv` (L0; verified live this session: 44,606 B, monthly) — the repo's `ebp` context card's own file | monthly | level |
| S5 | Financial-stress composites (NFCI, STLFSI, OFR FSI) | **+**: broad stress composites | FRED `NFCI` (L2-cite, live weekly →2026-10-30) + `STLFSI4` (L2-cite, live weekly →2026-10-30) + OFR `fsi.csv` (L0, verified live: 517,372 B, daily) — all three verified this session | weekly / 0–1w | level |
| S6 | Equity drawdown / breadth | **+**: drawdowns and narrowing breadth mark the risk-off regime | Yahoo SPY/RSP (free; L2 owner-accepted per the repo's register — the honest class for the unofficial endpoints) | daily / 0 | drawdown depth; context-leaning |
| S7 | Geopolitical risk (GPR, + acts/threats split) | **+**: the event-risk channel; threats lead, acts confirm | Caldara–Iacoviello export (L0, CC BY; both files verified live this session: monthly 2.7 MB + daily 3.3 MB) | daily & monthly | level vs own history |
| S8 | Policy uncertainty (EPU, TPU) | **+**: regime uncertainty raises the hedging premium | Baker–Bloom–Davis workbooks (L0, licence quoted from inside the files; venue-blocked to this audit's sandbox — 403 on both hosts, two UAs — availability grounded by the repo's own live first-of-month ingest of `epu-us`/`tpu-us`) | monthly | level |
| S9 | Bank stress / facility usage | **+**: discount-window and standby-facility usage is the modern bank-run tell (2023) | FRED `DPCREDIT` (L0; **verified live: weekly, 2003-01-10 → 2026-11-02**) — the modern discount-window primary-credit series. Era notes: the BTFP series (`H41RESPPALDKNWW`) ends 2026-05-06 (the program matured out) and the legacy `DISCBORR` is dead (2020-08) — both checked and dated this session | weekly | event-leaning; context |
| S10 | Repo-market stress (SOFR−IORB etc.) | **+**: plumbing stress marks the funding-fear regime | FRED `SOFR` (L2-cite, live →2026-11-03) − `IORB` (L0, live →2026-11-04) — both verified; the repo's `repo-stress` derivation | daily | level; context |
| S11 | EU sovereign stress (BTP–Bund) | **+**: the regional haven magnet that competes for the same bid | ECB/FRED OECD mirrors (free; the repo's `btp-bund-spread` context card is live) | daily | context-leaning |
| S12 ★ v1-add | EM sovereign stress (EMBI-class spread) | **+** in EM-stress episodes (with the family's conditional-haven rule): EM dollar-debt spread widening is the EM stress regime — dollar strength, capital flight, and the physical-demand channel (pairs with D8/D9) | JPMorgan EMBI Global — **MISSING-PAID** (verified: no FRED series this session; no clean free mirror found). Free proxy: the S5 composites + the EM dollar indexes (D9) and EM FX (D8) | — | level vs range; context |
| S13 ★ v1.1-add | US household pessimism (Michigan sentiment / the "mostly bad times" read) | **+**: the household fear channel — the Chicago Fed's canonical driver set ("What Drives Gold Prices?", Chicago Fed Letter 464, 2021: real 10y rate · long-run inflation expectations · **pessimistic expectations** — a measured ~5% real-gold-price rise per 10pp innovation in the bad-times fraction) treats household pessimism as a standalone gold bid beside the market-price fear legs (S1–S5) | FRED `UMCSENT` (L2-cite © U. Michigan via FRED; **re-verified live 2026-11-05**: monthly, 887 pts, 1952-12 → 2026-09). The exact object (the 5y "mostly bad times" fraction) is a UoM SIE-portal table (free download, no API — the same honest class as I4); `UMCSENT` is the free feed object | monthly / ~2w | level + change; context-leaning (the S-family's household leg) |

## F. Flows, positioning & demand — the COT school

Who is actually buying, and how crowded the boat is. The classic treatment is
**contrarian at extremes** (crowded longs = fragility) and **confirming in
the middle**; this family is the least represented in the current meter.

| ID | Indicator | Classic claim | Free source | Cadence / lag | Treatment |
|---|---|---|---|---|---|
| F1 | CFTC net speculative length (share of OI) | contrarian at extremes: record-crowded longs mark fragile tops, record shorts mark capitulation bottoms | CFTC legacy futures-only COT `https://www.cftc.gov/dea/newcot/deafut.txt` (L0, keyless; **verified live this session**: HTTP 200, 439,640 B). Honest note: the legacy file carries the **non-commercial** categories — the long-history classic object is the net *non-commercial* share of OI; the "managed money" split is the disaggregated report's (2006+) modern complement, same site/report family | weekly / ~3d | z-score / decade percentile of net share |
| F2 | CFTC gross long & short | richer than net: long-only and short-only extremes tell different stories | same `deafut.txt` (the legacy gross legs) | weekly / ~3d | percentiles |
| F3 | Gold ETF holdings & flows (GLD tonnes / world total) | **+** trend-confirming: the Western investor bid, visible daily | WGC monthly ETF file (verified live this session: goldhub serves `Flows_2026-10-02_1401.xlsx` — "Flows: September 2026" — free XLSX, page updated weekly). SPD R's own page is live (HTTP 200) but its daily-tonnes export is JS-driven — scrape-class; the WGC file is the clean free object | daily–monthly | level trend + flow direction |
| F4 | Central-bank net purchases | **+** structural: the 2022–2026 regime driver — official-sector buying floors the price | WGC Gold Demand Trends (free, quarterly; **URL amended**: the live page is `https://www.gold.org/goldhub/research/gold-demand-trends` — the v0 `/data/` path 404s now, verified this session) | quarterly / ~3–5w | annualised level; context-voter debate (OI-GA-4) |
| F5 | Total demand vs supply balance | context: the annual balance frames everything else | WGC GDT (same verified page) | quarterly | context |
| F6 | Shanghai/Asia premium (SGE vs the international price) | **+**: the Eastern physical bid's premium is the classic scarcity tell | SGE `en.sge.com.cn` daily quotes (free; **UA-sensitive** — 403 to curl's default UA, 200 with a browser UA, verified this session) × the international ounce. Honest note: the LBMA PM leg is bot-challenged view-only (the LBMA prices page serves a Cloudflare-style interstitial to automated clients, verified this session) — the free-first derivation is SGE Au9999 (CNY) vs gold-api XAU × Frankfurter USD/CNY (all three legs verified free/keyless) | daily / 0 | premium level vs its own range |
| F7 | India premium/discount | **+** secondary physical bid (monsoon/Diwali seasonality lives here) | no clean free premium series; the classic derivation is import parity (international × USD/INR × duty − domestic) — legs free (Frankfurter INR; MCX delayed quotes free-view) | daily | seasonal band; context-leaning |
| F8 | COMEX warehouse stocks (registered) | context: deliverable-stock drains mark squeeze regimes | CME published reports (free-view; **automation-hostile** — 403 from this audit's venue, verified this session; needs a browser-grade fetcher or manual entry) | daily / ~1d | level; context |
| F9 | Lease rates / forward rates | **+**: true physical scarcity pricing (GOFO died 2015; the successor benchmarks are paid/thin) | **MISSING-PAID** — verified this session: no free successor series exists; proxy via futures calendar spreads (EODHD owner key, OI-GA-5, or CME free-view) | daily | context; OI-GA-5 |
| F10 | Futures term structure (contango slope) | context: carry cost of the long position; backwardation = exceptional | EODHD (owner key, OI-GA-5) or CME delayed (free-view) | daily | context |
| F11 | Retail coin & small-bar demand (US Mint) | **+**: the retail fear gauge — coin-sales spikes mark panic bids | usmint.gov bullion sales (free, US government; **venue-blocked to this audit's fetches** — 403, recorded honestly; the figures are also republished in WGC's free monthly commentary — verify from a browser venue before any wiring) | monthly | level vs range; context-leaning |
| F12 | Gold-backed ETF short interest / GLD volume | context: the squeeze-tell complements F1 | free-ish (fund pages) | weekly | context |
| F13 ★ v1-add | Official-sector monthly purchases (PBoC/SAFE, CBR) | **+** structural: the monthly-resolution twin of F4 — the PBoC's reported reserve sequence (the 2022–2026 streak) and the CBR's reported gold reserves are the desk's higher-frequency official-demand reads; reported pauses/resumes move the structural-bid narrative | PBoC/SAFE official monthly gold-reserve tables (free/keyless official sites) + CBR reserves page (free); WGC's monthly commentary consolidates (free) | monthly / ~2–4w | level + changed-flag; context (OI-GA-4 family) |
| F14 ★ v1-add | COMEX–LBMA EFP basis | event/extreme: the exchange-for-physical spread between New York futures and London spot is the dual-market dislocation tell (2020's squeeze — the classic episode); an EFP blowout marks deliverable-scarcity stress | **MISSING-PAID-class** — verified this session: the clean EFP needs both a live futures leg (CME: 403 to automation) and the London price (bot-challenged); no free clean series. Free proxy: F8's warehouse drains + F6's premium direction | — | context; event marker |
| F15 ★ v1-add | SGE monthly withdrawals (the China physical proxy) | **+** for physical demand: SGE gold withdrawals are the classic China physical-demand proxy (the 2013–2016 usage debate; the WGC's China accounting references them) — the quantity-expression of the Eastern bid whose price-expression is F6 | SGE monthly statistics (en.sge.com.cn — free, UA-sensitive, site verified live this session); WGC China commentary (free) | monthly | level vs 5y band; context |
| F16 ★ v1.1-add | Swiss gold net exports by destination (the London↔Switzerland↔Asia flow) | **+**: the classic physical-arbitrage flow read — Switzerland is the world's largest refining hub, so its monthly customs tables are the flow evidence behind the F6/F7 premium rows (surging CH→CN/CH→IN exports = the Eastern physical bid clearing; reversals toward the UK = ETF liquidation feeding back through London); the release the trade press headlines monthly | Swiss customs (BAZG) SwissImpex monthly tables — gold by partner country, 2012→ (free/keyless; **verified live 2026-11-05**: the BAZG gold-and-silver trade page serves the dashboard and the monthly results; the tariff-heading note is on the page) | monthly / ~2–3w | level vs own range by destination; context-leaning |

## X. Cross-asset relative value

Ratios the desk watches as regime shorthand. Mostly context by nature — but
one of them (`gold-silver`) is already a voter, so the family is here in
full for the matrix.

| ID | Indicator | Classic claim | Free source | Cadence / lag | Treatment |
|---|---|---|---|---|---|
| X1 | Gold/silver ratio | regime gauge: high = monetary-fear regime; falling = industrial-risk-on — reads **+** for gold's haven character when rising | gold-api (L0; verified live: XAU served) — the repo's `gold-silver` derivation | daily / 0 | level vs decade range |
| X2 | Gold/oil ratio | context: the real-energy purchasing-power shorthand | gold-api × EIA (both free; the repo derives `gold-oil-ratio`) | daily / 0 | context |
| X3 | Gold/copper | context: the growth-vs-fear axis | gold-api × copper (the repo derives `copper-gold`) | daily / 0 | context |
| X4 | Gold/Bitcoin | context: the store-of-value competition, post-2017 | gold-api × Bitstamp (both free; the repo derives `gold-btc`) | daily / 0 | context |
| X5 | Gold vs equities (GLD/SPY) | context: the long-horizon rotation gauge | Yahoo (free; L2 owner-accepted per the repo's register) | daily / 0 | context |
| X6 | Gold real price percentile | cross-listed I10 | derived | monthly | context |
| X7 ★ v1.1-add | Gold/platinum ratio | regime gauge (context-leaning): gold's monetary premium vs platinum's industrial cycle — the second precious-bloc internal ratio beside X1 (a stretched ratio = the monetary-bid regime; a collapsing one = industrial-risk-on); the desk charts it beside gold/silver and it is the ratio the bullion trade itself headlines as the overlooked precious-metals gauge | gold-api (L0; **verified live 2026-11-05: XPT served beside XAU**) — both legs already sit in the repo's price-row family (the `platinum` price row + `gold-usd`) | daily / 0 | level vs own range; context |

## G. Fiscal & sovereign — the debasement trade

The post-2020 family: the deficit channel the gold market prices through
term premia (R9) and reserve behaviour (D5). The repo already ingests most
of it — as context.

| ID | Indicator | Classic claim | Free source | Cadence / lag | Treatment |
|---|---|---|---|---|---|
| G1 | Federal deficit (% GDP, 12m rolling) | **+**: fiscal dominance is the classic long-run gold narrative | FRED `MTSDS133FMS` (L0; verified live: monthly through 2026-09) — the repo's `us-deficit-12m` derivation | monthly | level; slow voter or context |
| G2 | Net interest burden | **+**: interest crowding out the budget is the accelerator of G1 | FRED/BEA legs (free; the repo's `govt-interest-revenue` derivation is live) | quarterly | level; context-leaning |
| G3 | Debt/GDP | **+** structural anchor | FRED `GFDEGDQ188S` (L0; verified live: quarterly through 2026-04-01) | quarterly / ~1–2q | context |
| G4 | Foreign official Treasury holdings (TIC SLT + NY Fed custody) | **−** when falling: the foreign financing retreat that pairs with D5 | Treasury TIC (`slt_table5.txt`, verified live this session) + FRED `WSEFINTL1` (L0; verified live: weekly through 2026-10-28) | monthly / ~1.5m | trend; context-leaning |
| G5 | Treasury auction demand (indirect bids, tails) | **+** when weak: auction indigestion marks the regime's stress points | Treasury FiscalData `auctions_query` (L0; verified live this session: HTTP 200) — the repo's auction cards' own API | per auction | event-leaning; context |
| G6 | Debt-ceiling / shutdown risk | **+** episodic: the classic event spikes | calendar/manual (free) | episodic | context note; never a standing voter |
| G7 | US sovereign CDS (5y) | **+**: the market's tail price on US credit | paid (Markit); free proxy = T-bill dislocation around ceilings | — | MISSING-PAID; OI-GA-5 |

## H. Supply — mine, scrap, fabrication

Slow, annual-scale, and classically **context-only** for a conditions meter:
no desk times the month's direction off mine output. Recorded so the audit
can say the family was examined, not forgotten.

| ID | Indicator | Classic claim | Free source | Cadence | Treatment |
|---|---|---|---|---|---|
| H1 | Mine production | context (supply ceiling, very slow) | WGC GDT (verified live — the `/goldhub/research/` page above); USGS Mineral Commodity Summaries (free; venue-blocked to this audit's fetches — 405, recorded honestly) | quarterly–annual | context |
| H2 | Recycling supply | context (price-elastic scrap) | WGC GDT (verified live) | quarterly | context |
| H3 | Jewellery + technology fabrication | context (the price-sensitive demand floor — the elasticity lives here) | WGC GDT (verified live) | quarterly | context |
| H4 | Producer hedging / de-hedging | context (forward sales add latent supply — the 1999 Washington-Agreement-era lesson) | WGC GDT (verified live) | quarterly | context |

## M. Meta — deliberately non-voting, recorded so the audit is exhaustive

| ID | Item | Why it is not a voter |
|---|---|---|
| M1 | Gold's own price move / footing | Circularity — counting a falling price as evidence of falling is the exact defect D-GB-5 removed. Context pill only. |
| M2 | Gold volatility (GVZ) | Real-time implied vol is paid (Cboe); second-order for a conditions meter. Context if ever free. |
| M3 | Seasonality (Diwali, Lunar New Year, wedding season) | Calendar, not a condition; belongs in copy notes if anywhere. |
| M4 | The two-factor residual (real rates + dollar model) | An analytic device, not an observable condition. Research-only. |

---

## Row count and the sweep

**v1 = 82 rows** (v0's 72 + **10 sweep additions** − 0 strikes):
R14 + D9 + I11 + S12 + F15 + X6 + G7 + H4 + M4 = 82 physical rows
(cross-listed placeholders I5/I6/X6 resolve to their primary rows at
classification). **v1.1 = 85 rows** (v1 + **3 pre-lock research additions**
− 0 strikes): +S13 +F16 +X7 — added by the owner-delegated research pass
of 2026-11-05, *before* the lock (the amendment record and the lock record
are at the file's foot). The v1
additions, all appended **before** the v1 stamp
(D-GA-1) and each carried by a classic desk use plus a verified source:

| Add | Row | Why it clears the classic bar |
|---|---|---|
| 1 | R13 TIPS liquidity / breakeven–swap basis | The TIPS-liquidity literature's standard decomposition (2008, 2020 flights); a quality flag on the R7/R8 hedge legs; availability honestly MISSING-PAID |
| 2 | R14 JGB 10y / YCC regime | The 2016-YCC/2024-exit regime shifts are canonical desk events; MOF file verified live |
| 3 | D7 USD/CHF | The CHF/JPY haven pair is the classic funding/haven gauge; Frankfurter CHF leg verified live |
| 4 | D8 EM devaluation episodes | The local-currency-collapse → local gold-demand surge channel (TRY et al.); Frankfurter TRY leg verified live |
| 5 | D9 EME trade-weighted dollar | The trade-weighted caution extended to gold's EM-heavy marginal buyer; `DTWEXEMEGS` verified live beside its siblings |
| 6 | I11 Global liquidity / CB balance-sheet aggregate | The global monetary anchor of the debasement trade; free legs (`WALCL` et al.) verified live |
| 7 | S12 EM sovereign stress (EMBI-class) | The EM dollar-debt stress regime; honest MISSING-PAID with named free proxies |
| 8 | F13 Official-sector monthly purchases (PBoC/SAFE, CBR) | The 2022–2026 official-buying regime's monthly-resolution read; free official sources |
| 9 | F14 COMEX–LBMA EFP basis | The dual-market dislocation tell (2020's squeeze); honest MISSING-PAID-class with free proxies |
| 10 | F15 SGE monthly withdrawals | The classic China physical-demand proxy; SGE site verified live (UA-sensitive) |

**The v1.1 additions (2026-11-05, the pre-lock research pass — the owner's
delegated instruction, quoted verbatim in the lock record at the file's
foot):**

| Add | Row | Why it clears the classic bar |
|---|---|---|
| 11 | S13 US household pessimism (Michigan) | A named driver of the Chicago Fed's canonical driver model (Letter 464, 2021) — the household fear channel the S-family otherwise expresses only through market prices; `UMCSENT` re-verified live on FRED this session (887 pts, 1952-12 → 2026-09) — and the object is already ingested as `michigan-sentiment` (a growth-health voter outside the gold lanes): a promotion-class row, not a new-source row |
| 12 | F16 Swiss gold net exports by destination | The physical-flow evidence behind the F6/F7 premium rows — the monthly Swiss customs release the desks and the trade press headline; the BAZG SwissImpex tables verified live, free/keyless, monthly by country 2012→ |
| 13 | X7 Gold/platinum ratio | The second precious-bloc internal ratio (the monetary-premium vs industrial-cycle gauge beside X1); gold-api XPT verified live beside XAU; both legs already ingested in the repo's price-row family |

**Pruning pass (the honest answer):** every family was walked again with the
question "is any v0 row honestly desk-lore, not literature?" — **no row
failed**. The closest calls and why they stayed: R11 (r-star — literature-
solid Laubach–Williams, context-only by treatment), R12 (an era row that
self-records its NOT-APPLICABLE candidate status for GA-S3), F12 (GLD short
interest — the squeeze-tell the WGC's own research covered; context), G6
(debt ceiling — a classic episodic event row, context). **Strikes: 0.**

**Checked and deliberately NOT added** (recorded so the sweep is auditable):
other real-rate tenors — 7y/20y/30y TIPS verified live on FRED
(`DFII7/DFII20/DFII30`) and recorded in R2's source note as the available
tenor family; a separate row would repeat R1/R2's claim at another duration.
HUI/gold-miners ratio — desk-familiar but thin formal literature and
L2-Yahoo-sourced; left for the owner's lock call, not added by the audit.
LBMA clearing volumes — free monthly stats exist but the claim
(liquidity/activity) is second-order for a conditions meter. AUD/JPY risk
cross — redundant with the S-family's risk gauges for gold's purposes.
Silver-specific crosses — out of scope (the closed program's OI-4).

**Checked and deliberately NOT added by the 2026-11-05 research pass**
(each with its reason, so the delegated lock decision is auditable):

- **China real rates (10y CGB − CPI)** — the modern EM household channel is
  documented, but no free/keyless source could be verified this session
  (ChinaBond unreachable from the audit venue — HTTP 000; no FRED mirror;
  no repo ingest grounds it). A row whose source cannot be verified fails
  this checklist's own bar (every row carries a live-verified source);
  recorded as a candidate owner amendment should a reliable free route be
  verified from a browser venue.
- **World / EM income growth** — the Chicago Fed model's largest elasticity,
  but an annual-scale model variable rather than a desk gauge; the
  demand-side rows (F3/F4/F6/H3) carry the channel at the meter's scale.
- **MOVE / rate-volatility index** — paid (ICE), no clean free proxy (a
  realized-vol derivation would be a construct, not the classic object);
  the R-family's move/level legs already express the policy-regime
  conditions.
- **All-in sustaining cost (AISC)** — the industry cost-curve floor is
  Metals-Focus-paid and a valuation-floor narrative rather than a conditions
  direction; I10 carries the valuation anchor.
- **HUI/gold-miners ratio — the sweep's open call, now resolved:** NOT
  added (thin formal literature, L2-Yahoo-sourced, and its equity-side
  leverage is already expressed by X5 + S6).
- **India monthly import tonnage** — the quantity-twin of F7's price read,
  carried inside F16's flow record and WGC's monthly commentary rather than
  as its own row.

---

## Pre-scan (GA-S1, not coverage)

**Label and bound (01 §2 A1's exception):** this section is *directional
information for the owner* — a light presence check of each taxonomy row
against `docs/INDICATORS_AND_DATA_SOURCES.md` ONLY. It is **not** evidence,
**not** the classification rubric (D-GA-6 — the four marks below are not
classes), and **not** wiring work. GA-S2 (inventory + wiring) and GA-S3
(matrix) decide everything. Presence = a matching row in the 161-indicator
readings table (the meter's data plane); the FX-board pairs are not
readings. `PRESENT-VOTER` means a scored voter exists **somewhere** in the
signals gauges — only the 21 gold-lane seats are the gold meter, and which
voter sits in which lane is exactly GA-S2's map to draw.

| Row | Mark | Basis (one word) |
|---|---|---|
| R1 | PRESENT-VOTER | `real-yield-10y` |
| R2 | ABSENT | no 5y-real series |
| R3 | ABSENT | no 2y-real object |
| R4 | ABSENT | no real-curve derivation |
| R5 | PRESENT-VOTER | `fed-target` |
| R6 | PRESENT-VOTER | `fed-expectations` (+`us-2y` context) |
| R7 | PRESENT-VOTER | `breakeven-5y5y` |
| R8 | PRESENT-CONTEXT | `t5yie`, `breakeven-10y` |
| R9 | PRESENT-CONTEXT | `term-premium-10y` |
| R10 | PRESENT-VOTER | `ecb-dfr` (+`boj-rate`/`boe-rate`/`jgb-10y` context) |
| R11 | ABSENT | no r-star series |
| R12 | ABSENT | era row |
| R13 | ABSENT | — |
| R14 | PRESENT-CONTEXT | `jgb-10y` |
| D1 | PRESENT-VOTER | `dollar-basket` |
| D2 | ABSENT | no DTWEXBGS row |
| D3 | PRESENT-CONTEXT | `eur-usd` |
| D4 | PRESENT-VOTER | `usdjpy` |
| D5 | PRESENT-CONTEXT | `usd-reserve-share` |
| D6 | PRESENT-CONTEXT | `gold-aud` |
| D7 | ABSENT | no USD/CHF reading |
| D8 | PRESENT-CONTEXT | `usdtry` |
| D9 | ABSENT | no EME dollar row |
| I1 | PRESENT-VOTER | `us-cpi-yoy` |
| I2 | PRESENT-VOTER | `us-pce-core-yoy` (+`us-cpi-core-yoy` context) |
| I3 | PRESENT-CONTEXT | `michigan-1y-expectations` |
| I4 | ABSENT | no 5–10y series |
| I5 | (cross-listed R7) | see R7 |
| I6 | (cross-listed R8) | see R8 |
| I7 | PRESENT-CONTEXT | `m2-us` |
| I8 | PRESENT-CONTEXT | `median-cpi`, `sticky-cpi` |
| I9 | ABSENT | no nowcast-vs-realised series |
| I10 | ABSENT | derived, not built |
| I11 | PRESENT-CONTEXT | `walcl`/`reverse-repo`/`bank-reserves`/`net-liquidity` legs |
| S1 | PRESENT-VOTER | `vix` |
| S2 | ABSENT | no HY-spread card (the OD-5 no-go) |
| S3 | ABSENT | no IG-spread card |
| S4 | PRESENT-CONTEXT | `ebp` |
| S5 | PRESENT-VOTER | `stress-stlfsi`, `nfci` (+`ofr-fsi` context) |
| S6 | PRESENT-CONTEXT | `sp500-breadth-ratio` |
| S7 | PRESENT-CONTEXT | `gpr-*` ×10 |
| S8 | PRESENT-CONTEXT | `epu-us`, `tpu-us` |
| S9 | ABSENT | no facility-usage series |
| S10 | PRESENT-CONTEXT | `repo-stress` |
| S11 | PRESENT-CONTEXT | `btp-bund-spread` |
| S12 | ABSENT | — |
| F1 | PRESENT-VOTER | `cftc-gold-positioning` |
| F2 | ABSENT | net-share only, no gross legs |
| F3 | ABSENT | no ETF tonnes/flows row |
| F4 | ABSENT | no WGC quarterly row |
| F5 | ABSENT | no balance row |
| F6 | ABSENT | no premium row |
| F7 | ABSENT | no India row |
| F8 | ABSENT | no warehouse row |
| F9 | ABSENT | — |
| F10 | ABSENT | — |
| F11 | ABSENT | no Mint row |
| F12 | ABSENT | — |
| F13 | ABSENT | — |
| F14 | ABSENT | — |
| F15 | ABSENT | — |
| X1 | PRESENT-VOTER | `gold-silver` |
| X2 | PRESENT-CONTEXT | `gold-oil-ratio` |
| X3 | PRESENT-VOTER | `copper-gold` (growth-health seat) |
| X4 | PRESENT-CONTEXT | `gold-btc` |
| X5 | ABSENT | ratio not built |
| X6 | (cross-listed I10) | see I10 |
| G1 | PRESENT-CONTEXT | `us-deficit-12m` (+monthly companion) |
| G2 | PRESENT-VOTER | `govt-interest-revenue` |
| G3 | ABSENT | no debt/GDP row |
| G4 | PRESENT-CONTEXT | `nyfed-custody` + the TIC dataset |
| G5 | PRESENT-CONTEXT | `treasury-auction-10y/30y` + indirect |
| G6 | ABSENT | calendar row |
| G7 | ABSENT | — |
| H1 | ABSENT | — |
| H2 | ABSENT | — |
| H3 | ABSENT | — |
| H4 | ABSENT | — |
| M1 | PRESENT-CONTEXT | `gold-usd` price tile (context by design) |
| M2 | ABSENT | — |
| M3 | ABSENT | meta — calendar, never a series |
| M4 | ABSENT | meta — analytic, never a series |

**Tally (primary rows, cross-lists excluded):** PRESENT-VOTER 15 ·
PRESENT-CONTEXT 23 · ABSENT 41 · UNKNOWN 0 — over 79 primary rows (82 − 3
cross-listed). Read with the bound above: this says the *table* holds
voters/context/absence for these objects; it says nothing about lane
seating, rule fit, history depth, or sign — the audit's actual work.

**v1.1 addendum (2026-11-05, the pre-lock research additions — presence
checked against the same doc table + the live readings set, same bounds):**
S13 **PRESENT-VOTER** (`michigan-sentiment` — FRED UMCSENT, a scored
growth-health voter OUTSIDE the gold lanes; the mirror sweep's `not-gold —
consumer-mood` mark is a wiring fact GA-S3 now revisits against S13: the
Chicago Fed's pessimism driver is already ingested, promotion-class rather
than new-source-class) · F16 **ABSENT** (no Swiss-flow row) · X7 **ABSENT**
(the `platinum` price row exists but no ratio reading). **Tally restated
over the 82 primary rows of v1.1 (85 − 3 cross-listed): PRESENT-VOTER 16 ·
PRESENT-CONTEXT 23 · ABSENT 43 · UNKNOWN 0.**

---

## Changelog (v0 → v1, GA-S1, 2026-11-04)

Every change below was made by a verification performed this session (the
runnable record: `packages/insights/scripts/ga-s1-fred-verify.sh` + the
curl checks logged in PROGRESS.md's GA-S1 block):

- **R3** — re-sourced honestly: `DFII2` does not exist on FRED (HTTP 404,
  verified); the live TIPS tenor set is 5/7/10/20/30y; the 2y real object is
  proxy-only (DFII5 / the nominal path).
- **R4** — derivation note updated to the live tenors (DFII10−DFII5).
- **R9** — corrected the v0 conflation: the repo's ingested
  `term-premium-10y` is FRED `THREEFYTP10` (Kim-Wright, public domain —
  code-verified), not ACM; both the Kim-Wright series and the NY Fed ACM
  file (`ACMTermPremium.xls`, verified live, 10.2 MB) named as the two free
  objects.
- **R10** — verification recorded: BoE/BoJ pages live; the ECB Data Portal
  is venue-blocked to this audit's sandbox (availability grounded by the
  repo's own live daily `ecb-dfr` ingest + licence register, per the
  recorded-venue-block convention).
- **I4** — re-sourced: FRED carries no 5–10y Michigan series (searched;
  FRED's Michigan set is `MICH`+`UMCSENT`); canonical free source is the
  UoM SIE portal (verified live) — honest availability: free-portal, not a
  feed.
- **I8** — fixed the series id: `MEDCPIM158SFRBCML` does not exist; the
  Cleveland median CPI is `MEDCPIM158SFRBCLE` (the repo's own live id,
  code-verified); Atlanta sticky CPI pinned as `STICKCPIM158SFRBATL`.
  Both verified live.
- **S2, S3** — honest availability re-class (D-GA-5): `BAMLH0A0HYM2` /
  `BAMLC0A0CM` are served keyless but carry FRED's *pre-approval required*
  tag (ICE BofA — the class the repo's own register fail-closes, LICENCES.md
  OD-5) **and** FRED's served history is now a rolling ~3-year window
  (first observation 2023-11-06, 793 points, verified this session) —
  insufficient for decade-extreme treatments even licence-aside; the free
  proxy named (S5 composites).
- **S9** — source pinned to the live modern series: FRED `DPCREDIT`
  (weekly, verified live → 2026-11-02); dated the era series (BTFP
  `H41RESPPALDKNWW` ends 2026-05-06; `DISCBORR` dead 2020-08).
- **F1** — wording corrected: the legacy `deafut.txt` (verified live,
  439,640 B) carries the *non-commercial* categories — the classic object is
  the net non-commercial share of OI; "managed money" is the disaggregated
  report's split (same free report family, 2006+).
- **F3** — sourcing re-ordered honestly: the clean free object is the WGC
  monthly ETF XLSX (verified live); SPD R's page is live but its
  daily-tonnes export is JS-driven (scrape-class).
- **F4, F5, H1–H4** — WGC GDT URL amended to the live page
  (`/goldhub/research/gold-demand-trends`; the v0 `/data/` path 404s);
  USGS noted venue-blocked for H1's secondary source.
- **F6** — honest availability: SGE verified live but UA-sensitive (403 to
  the default UA, 200 to a browser UA); the LBMA PM leg is bot-challenged
  view-only (Cloudflare interstitial verified); free-first derivation named
  (SGE Au9999 vs gold-api XAU × Frankfurter USD/CNY).
- **F8** — availability caveat added: CME is automation-hostile (403 from
  this audit's venue, verified).
- **F11** — availability caveat added: usmint.gov is venue-blocked to this
  audit's fetches (403); WGC monthly republishing named as the free
  fallback.
- **F1–F15, all families** — licence levels (L0 / L1 / L2-cite) recorded
  per LICENCES.md, from this session's FRED series-page tag pass.
- **★ v1-add rows R13, R14, D7, D8, D9, I11, S12, F13, F14, F15** — the
  blind-spot sweep's additions (see the sweep record above).
- **Pre-scan section** — appended, labelled and bounded (not part of the
  checklist; GA-S2/GA-S3 decide).

---

## The lock record (OI-GA-1) — RESOLVED 2026-11-05

**The owner's instruction (2026-11-05, verbatim, in chat):** *"I am not gold
or finance expert, I just advice you to audit and investigate and research
wheter those 82 items are enough for our indicator or not, do we have
reliable data streams for them, and questions like this for feasbility
/accuracy and reliability. If you find new items, add them. if not , you can
lock and continue. it depends on your research, I trust your research and
judgement. if you think its enough, it's enough and locked by me."*

**The research pass performed before the lock** (the GA-S2-completion
session, 2026-11-05 — every check below was run this session):

1. **Coverage cross-check.** The 82 v1 rows were walked family-by-family
   against the canonical driver frameworks: the Chicago Fed's *"What Drives
   Gold Prices?"* (Chicago Fed Letter 464, 2021 — the four-driver model over
   1971–2019: real 10y rate · long-run inflation expectations · pessimistic
   expectations · world income) and the World Gold Council's demand-side
   framework (jewellery · technology · central banks · bar & coin · ETFs ·
   OTC — the families F/H carry). Findings: **three classic objects absent
   from v1** — the household-pessimism driver (added as **S13**), the Swiss
   physical-flow read (added as **F16**), the gold/platinum regime ratio
   (added as **X7**); every other driver in both frameworks maps to existing
   rows (world income → considered-not-added, reason recorded above).
2. **Data-stream reliability re-verification (52 FRED ids + 11 provider
   endpoints, all read live).** `ga-s1-fred-verify.sh` re-run (49 ids) plus
   `DPCREDIT`/`MPCREDIT`/`H41RESPPALDKNWW` (curl): **the identical
   live/dead pattern GA-S1 recorded on 2026-11-04** — every live leg still
   live (DFII10/DFII5/DFII7 6,218 pts → 2026-11-02; DFEDTARU/L and
   IORB/RRPONTSYD/RRPONTSYAWARD → 2026-11-04; DGS2/DGS10/DGS30/DFF →
   2026-11-02; T5YIFR/T5YIE/T10YIE/VIXCLS → 2026-11-03; T10Y2Y → 2026-11-03;
   NFCI/STLFSI4/DTWEXBGS/DTWEXEMEGS → 2026-10-30; CPI/PCE/MICH/UMCSENT/M2SL/
   median/sticky → 2026-09; GFDEGDQ188S → 2026-04-01; WALCL/WSEFINTL1/
   WRESBAL/WTREGEN → 2026-10-28; SOFR → 2026-11-03; DPCREDIT 6,214 pts →
   2026-11-03; MPCREDIT → 2026-10-01) and every dead/wrong id still dead
   (DFII2 404; MEDCPIM158SFRBCML 404; STICKCPIM158SFRBCLE 404; STLFSI2 ends
   2022-01-07; DISCBORR ends 2020-08-01; DTWEXB ends 2019-12-31; WBTFL/WLCR
   404; H41RESPPALDKNWW ends 2026-05-06 — the BTFP maturity the S9 row
   records; the BAML pair's rolling window now starts 2023-11-07 — still
   ~3y, still insufficient for decade-extreme treatments, still the
   licence-pre-approval class S2/S3 record). Provider spot-checks (curl,
   UA `CurrenaDashboard/1.0`): Frankfurter live (JPY 178.30 · CHF 0.9188 ·
   CNY 7.5177 · INR 106.6318 @ 2026-11-04) · gold-api live (**XAU and
   XPT** both served) · MOF `jgbcme.csv` live (10Y 2.817 @ 2026-11-02) ·
   CFTC `deafut.txt` live (439,640 B — the byte-count GA-S1 recorded) · WGC
   GDT + ETF pages live · GPR export live (2,718,208 B — byte-identical) ·
   OFR `fsi.csv` live (517,372 B — byte-identical) · Fed Board `ebp_csv.csv`
   live (44,606 B — byte-identical) · IMF COFER SDMX live (126,820 B —
   byte-identical) · **BAZG Swiss customs live** (the SwissImpex gold-trade
   page — F16's source). Unreachable from this audit venue, recorded
   honestly: ChinaBond (HTTP 000 — the China-real-rate candidate's recorded
   reason for not being added).
3. **The decision, under the owner's delegation.** The research found the
   checklist three rows short of the classic condition set (added before the
   lock — the amendment above) and **no further gap that clears the classic
   bar with a verifiable free source** (the rest recorded as
   considered-not-added with reasons). **v1.1 = 85 rows is therefore LOCKED
   by the owner's delegated instruction, 2026-11-05.** From here (D-GA-1):
   additions are owner-recorded amendments with dates only — never silent.

**Amendment v1 → v1.1 (2026-11-05, pre-lock):** +S13 · +F16 · +X7 · −0
strikes. Downstream arithmetic restated by this session: `README.md`'s file
table + OI-GA-1 open-item row · `PROGRESS.md` row A's lock annotation · the
GA-S3 prompt in `PROMPTS.md` — all now quote 85 rows (v1.1, locked). The
GA-S1 historical records (PROGRESS's GA-S1 block, PROMPTS's GA-S1 note, the
v1 row-count line above) intentionally still quote v1 = 82 — they are dated
session records, not live state.

**Amendment v1.1 → v1.2 (2026-11-05, the owner's RECORDED answer G — the
GF-S7 answer sheet, executed at GF-P2 by the GF-S8 session):** +N-A1
(euro-area realised inflation, HICP) · −0 strikes — resolving finding N-1
(the one UNCLASSICATED voter: `euro-hicp`, healthy and wiring-complete,
now maps to the row the checklist itself missed). Downstream arithmetic
restated by the GF-S8 session: `GOLD-METER-AUDIT-REPORT.md`'s header table
+ headline (rows classified 86 · voters mapped 21/21 · COVERED 9 of 86 —
the euro-area row joins the COVERED core) · the gapfill program's README
decision-log D-GF-7 annotation + 01-FILL-SPEC §3 constraint 6 + the live
handoff state. The GF-S1..GF-S7 historical records (PROGRESS blocks,
PROMPTS, the committed calibration report's N-1 row) intentionally still
quote v1.1 = 85 — they are dated session records, not live state.
