# PROGRESS — the gold meter audit program

The running record of the owner's audit program (the spec set:
`docs/specs/gold-meter-audit/` — README + 01–04 + PROMPTS; the session plan
GA-S1..GA-S4). One line per milestone, one block per session; every number
comes from a run or a citation the session actually made. The audited
predecessor program (gold balance consolidation) is CLOSED — COMPLETE,
LIVE 2026-11-04 (its record: `docs/specs/gold-balance-consolidation/
PROGRESS.md`); this program changes nothing it shipped (D-GA-3).

## The milestone table

| ID | Milestone (spec ref) | State |
|---|---|---|
| A | The reference taxonomy verified + v1 delivered for the owner's lock; the blind-spot sweep; the presence pre-scan (01 §2 A1; 02) | ✅ COMPLETE — GA-S1 (2026-11-04): 02 is v1 (82 rows: v0 72 + 10 sweep adds − 0 strikes), every row verified live, the sweep + pre-scan recorded, PR merged; **awaiting the owner's lock (OI-GA-1)** |
| B | The inventory + wiring evidence pack; the mirror sweep (01 §2 A2; 03 §1–§2) | 🔶 **PARTIAL — GA-S2 (2026-11-04): the source-side half delivered** — `evidence/inventory.md`: the full 161-row readings table with the mirror-sweep column (**voter 21 · context 63 · not-gold 77 = 161**), the 25 derived-series recipes + the adapter metrics, the rung map; the runnable record `packages/insights/scripts/ga-s2-wire-scan.sh` + its committed run `evidence/wire-scan-2026-11-04.txt`. **The voters table (03 §1.1), the wiring trace + the context traces + the history depths (03 §2) are DEFERRED** — the owner was not reachable in-session, OI-GA-1 (the taxonomy lock) is still OPEN, and the GA-S2 prompt's fallback bound the session to 03 §1.2–§1.4 (the trace needs the locked denominator, D-GA-1). The completion session (its prompt is in PROMPTS.md) resumes A2 after the lock |
| C | The coverage matrix classified + the half-implementation defect list; the header arithmetic (01 §2 A3, §5; 03 §3–§4) | ⏳ PENDING — GA-S3 |
| D | The audit report `docs/insights/GOLD-METER-AUDIT-REPORT.md` (01 §2 A4; 04 §1–§2) | ⏳ PENDING — GA-S4 |
| E | The fill-program design + its GF-S1.. prompts; the owner's decision list stated (04 §3–§5) | ⏳ PENDING — GA-S4 |

## Session log

### GA-S2 (2026-11-04) — the source-side inventory delivered under the lock fallback

- **The lock first (OI-GA-1):** the owner was **not reachable in-session**, so
  the session took the GA-S2 prompt's explicit fallback path — the
  inventory's **source-side work only (03 §1.2–§1.4)**, which locks nothing,
  and a hard stop before the voter wiring trace (03 §2). `02-REFERENCE-
  TAXONOMY.md` is **untouched** (v1, delivered, still awaiting the owner's
  lock — no lock line, no amendment). **The lock question is printed at the
  head of this session's final message and opens the next prompt.**
- **Delivery:** `evidence/inventory.md` — the readings table (161 rows,
  every id with source · ref, cadence, staleness window, layer, licence,
  gauge role, the mirror-sweep mark and today's wire state), the
  derived-series recipes (the 25 `derived`-provider rows with exact
  formulas + code cites, plus the CFTC positioning metric, the S&P breadth
  ratio and the price-row composition family), and the rung map (04:10
  main / 04:20 rung-2 / 04:25+04:27 daily-history halves / 04:30 rung-3 /
  04:35 rung-4 / 04:40 periodic, the Saturday + first-of-month + 21st–25th
  gates, the hourly :13/:50 and quarter-hour slots, the 10:10/20:10
  sweeps — per `docs/gap-closure/RUNGS.md`, the canonical map).
- **The runnable record:** `packages/insights/scripts/ga-s2-wire-scan.sh`
  (read-only, keyless — GET /api/insights + read-only parses of
  definitions.ts, gold-score.ts, gauges.ts and the doc's inventory table;
  the `ga-s1-fred-verify.sh` precedent). Its full output is committed as
  `evidence/wire-scan-2026-11-04.txt`. **Every number below is from that
  run** (01 §4.3).
- **The denominators, cross-checked:** the live wire serves **161 readings**
  (161 unique ids; generatedAt 2026-11-04T12:18:13.290Z; `goldSummary`
  ABSENT — the OI-3/GB-S7 retirement verified holding on the live wire) ·
  DEFINITIONS holds **161 ids** (48 scored-gauge rules + 113 info rules) ·
  GAUGES holds **12 gauges, 48 scored voters in the 8 non-shadow gauges**
  (borrowing-costs 9 · prices-heat 5 · market-stress 5 · dollar-strength 3
  · growth-health 10 · au-inflation-rates 5 · au-households 7 ·
  au-trade-currency 4) **+ 4 shadow gauges (G-5) with 20 context-only
  members** · the doc's inventory table has **159 rows** (missing
  `term-premium-10y` + `tga`, both live rung-4 ids since S3-M3.2) while
  its own header claims 161 and its `**Counts:**` line claims 145 — the
  doc drift is recorded as inventory facts; the doc's per-row voter flags
  **agree with gauges.ts on all 159 rows**.
- **The mirror sweep (01 §5.4, D-GA-4):** every one of the 161 ids marked
  **voter / context / not-gold with a one-word reason** (the method and
  criteria are stated in inventory.md §4; the marks are today's wiring
  facts, not classes — D-GA-6, and nothing maps against the unlocked
  taxonomy — D-GA-1). **Tally: voter 21 · context 63 · not-gold 77 = 161**
  (counted by `grep -c` of the three mark strings over the delimited
  readings-table region of inventory.md — the commands are stated in the
  file).
- **Today's wire facts recorded (not defects — the day's states):** all 21
  gold-lane voters present; `dollar-basket` + `usdjpy` read `stale` with
  no `change30d`/`percentile10y` (the dollar lane runs 2/3 unread today —
  the whole Frankfurter family reads stale on 2026-11-04);
  `cftc-gold-positioning` reads `warning` (46.99 % @ 2026-10-27) but
  carries neither `change30d` nor `percentile10y` — neither `evalLeg` leg
  has an input on today's wire; `us-japan-10y-gap` is percentile-only
  today; `breakeven-tilt` carries wire status `context` (a prices-heat
  context card holding a gold-lane seat — `readable()` admits it).
- **Doc-drift facts found and recorded (inventory.md):** the doc's
  inventory table is 2 rows short of the wire (term-premium-10y, tga) and
  its counts line is 14 stale; the doc's provider-key list names only 20
  of the 25 `derived`-provider ids; the doc's rung table's "Saturday 04:25
  +2 fetches" line is superseded by RUNGS.md (the CFTC + EIA fetches ride
  the 04:20 rung-2 Saturday gate — rung2.ts:68-69).
- **Nothing classified, nothing wired, nothing deployed** (D-GA-3/D-GA-6:
  the mirror-sweep marks are wiring facts with reasons, not classes; GA-S3
  classifies against the locked taxonomy). No code, worker, schema,
  adapter or copy file touched; one read-only script + its committed
  output + docs only.
- **Blocked on the owner:** **OI-GA-1 — the taxonomy lock.** LOCK or AMEND
  the 82-row v1 taxonomy; the completion session (voters table + wiring
  trace + history depths — 03 §1.1 + §2) starts by resolving it. The
  GA-S2-completion prompt is in PROMPTS.md.

### GA-S1 (2026-11-04) — the taxonomy verified, swept, delivered as v1

- **Delivery:** `02-REFERENCE-TAXONOMY.md` is **v1 — delivered for the owner's
  lock (OI-GA-1)**. Every v0 row verified against the live source this
  session; the blind-spot sweep (01 §5.3) ran with the 13-question walk;
  10 rows added before the v1 stamp, 0 struck; the presence pre-scan
  (labelled, bounded) appended at the file's foot; a per-row changelog at
  the file's foot. The runnable verification record:
  `packages/insights/scripts/ga-s1-fred-verify.sh` (read-only, keyless —
  FRED's public `fredgraph.csv` route, the same route the ingest reads).
- **Row arithmetic:** v0 72 rows → **+10 adds** (R13 TIPS liquidity/
  breakeven–swap basis · R14 JGB 10y/YCC regime · D7 USD/CHF · D8 EM
  devaluation episodes · D9 EME trade-weighted dollar · I11 global
  liquidity/CB balance-sheet aggregate · S12 EM sovereign stress (EMBI-class)
  · F13 official-sector monthly purchases · F14 COMEX–LBMA EFP basis ·
  F15 SGE monthly withdrawals) → **−0 strikes** (the pruning walk found no
  v0 row that fails the classic bar — recorded, with the close calls and
  the considered-not-added list, in 02's sweep record) → **v1 = 82 rows**
  (R14 + D9 + I11 + S12 + F15 + X6 + G7 + H4 + M4; cross-listed
  placeholders I5/I6/X6 resolve to primaries at classification).
- **Rows amended by verification** (the one-line reasons are in 02's
  changelog): R3 (`DFII2` does not exist — 404; proxy-only), R4 (live
  tenors), R9 (the repo's `term-premium-10y` is FRED `THREEFYTP10`
  Kim-Wright, not ACM — code-verified; both free objects named), R10 (ECB
  venue-block note), I4 (FRED has no 5–10y Michigan series — SIE portal is
  the source), I8 (id fixed: `MEDCPIM158SFRBCLE`, not `…SFRBCML`), S2/S3
  (ICE BofA pair: pre-approval licence tag + a rolling ~3-year served
  window, first obs 2023-11-06 — honest D-GA-5 re-class with the S5-proxy
  named), S9 (pinned to FRED `DPCREDIT`, weekly, live; BTFP series ended
  2026-05-06, `DISCBORR` dead 2020-08), F1 (legacy file carries
  *non-commercial*, not managed money — wording corrected), F3 (WGC
  monthly XLSX is the clean free object; SPDR export is JS-driven), F4/F5/
  H1–H4 (WGC GDT URL amended to the live `/goldhub/research/` page), F6
  (SGE UA-sensitive; LBMA leg bot-challenged — free-first derivation
  named), F8 (CME automation-hostile), F11 (US Mint venue-blocked).
- **Pre-scan tally** (02's foot; presence against
  `docs/INDICATORS_AND_DATA_SOURCES.md` ONLY): PRESENT-VOTER 15 ·
  PRESENT-CONTEXT 23 · ABSENT 41 · UNKNOWN 0, over 79 primary rows —
  directional only; GA-S2/GA-S3 decide.
- **Sources checked this session, each opened and read** (curl, UA
  `CurrenaDashboard/1.0` or a browser UA where noted; the FRED batch ran
  via `ga-s1-fred-verify.sh`):
  - FRED series pages + `fredgraph.csv` (keyless):
    `https://fred.stlouisfed.org/series/{DFII10,DFII5,DFII7,DFII20,DFII30,
    DFEDTARU,DFEDTARL,DFF,DGS2,DGS10,DGS30,T10Y2Y,T5YIFR,T5YIE,T10YIE,
    CPIAUCSL,CPILFESL,PCEPILFE,MICH,UMCSENT,M2SL,MEDCPIM158SFRBCLE,
    STICKCPIM158SFRBATL,VIXCLS,BAMLH0A0HYM2,BAMLC0A0CM,NFCI,STLFSI4,
    DTWEXBGS,DTWEXAFEGS,DTWEXEMEGS,GFDEGDQ188S,WSEFINTL1,MTSDS133FMS,
    WALCL,WRESBAL,SOFR,IORB,RRPONTSYD,WTREGEN,DPCREDIT,MPCREDIT,
    H41RESPPALDKNWW,DISCBORR}` — the live ones dated to their last
    observation (DFII10 → 2026-11-02; DFEDTARU/L → 2026-11-04; T5YIFR/
    T5YIE/T10YIE/VIXCLS → 2026-11-03; NFCI/STLFSI4/DTWEXBGS/DTWEXEMEGS →
    2026-10-30; CPI/PCE/MICH/M2SL/median/sticky → 2026-09; GFDEGDQ188S →
    2026-04-01; WSEFINTL1/WALCL → 2026-10-28; DPCREDIT → 2026-11-02);
    the dead/wrong ones recorded (DFII2 404; MEDCPIM158SFRBCML 404;
    STICKCPIM158SFRBCLE 404; STLFSI2 ends 2022-01-07; DISCBORR ends
    2020-08-01; H41RESPPALDKNWW ends 2026-05-06; BAML pair: first obs
    2023-11-06 — the rolling ~3y window). FRED search pages used for the
    absences: Michigan expectations (only MICH/UMCSENT), discount window
    (`DPCREDIT`/`MPCREDIT`/`RIFSRPF02NA`), BTFP (`H41RESPPALDKNWW`),
    TIPS tenor enumeration (DFII5/7/10/20/30), negative-yielding (none).
    FRED copyright-tag pass over 22 named series (public-domain vs
    citation-required vs pre-approval) — recorded per-row in 02.
  - Providers: `https://api.frankfurter.app/latest` (200; CHF 0.81548,
    JPY 158.25, TRY 50.022 @ 2026-11-04) · `https://api.gold-api.com/price/XAU`
    (200) · `https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp`
    (200) · `https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/jgbcme.csv`
    (200) · `https://www.boj.or.jp/en/index.htm` (200) ·
    `https://www.federalreserve.gov/econres/notes/feds-notes/ebp_csv.csv`
    (200, 44,606 B) · `https://www.financialresearch.gov/financial-stress-index/data/fsi.csv`
    (200, 517,372 B) · `https://www.cftc.gov/dea/newcot/deafut.txt` (200,
    439,640 B; `deacot.txt`/`dfut.txt` 404 — not cited) ·
    `https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table5.txt`
    (200) · `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query?size=1`
    (200) · `https://www.newyorkfed.org/medialibrary/media/research/data_indicators/ACMTermPremium.xls`
    (200, 10,168,832 B) · `https://www.newyorkfed.org/research/policy/rstar`
    (200; the `Holston_Laubach_Williams_current_estimates.xlsx` link present)
    · `https://www.matteoiacoviello.com/gpr_files/data_gpr_export.xls` (200,
    2,718,208 B) + `data_gpr_daily_recent.xls` (200, 3,276,288 B) ·
    `https://www.gold.org/goldhub/research/gold-demand-trends` (200; the
    `/goldhub/data/` variant 404s) · `https://www.gold.org/goldhub/data/gold-etfs-holdings-and-flows`
    (200; serves `Flows_2026-10-02_1401.xlsx`) · `https://www.spdrgoldshares.com/`
    (200; export JS-driven) · `https://en.sge.com.cn/` (403 default UA, 200
    browser UA) · `https://www.lbma.org.uk/prices-and-data/precious-metal-prices`
    (200 but Cloudflare-style interstitial to automation) ·
    `https://www.clevelandfed.org/indicators-and-data/inflation-nowcasting`
    (200) · `https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.STA/COFER/7.0.1/*`
    (Accept: application/json → 200, 126,820 B — matches the repo's own
    recorded payload) · `https://data.sca.isr.umich.edu/` (200 — the UoM
    SIE portal).
  - **Venue blocks recorded, never circumvented** (the RULES 4.3 lineage):
    ECB Data Portal + `data-api.ecb.europa.eu` (WAF block page; availability
    grounded by the repo's own live `ecb-dfr`/`euro-hicp` voters + the
    licence register) · `policyuncertainty.com` workbooks (403 both hosts,
    both UAs; grounded by the repo's live `epu-us`/`tpu-us` first-of-month
    ingest) · `usmint.gov` (403) · `www.usgs.gov` gold statistics (405) ·
    `cmegroup.com` (403).
  - Code grounding (read-only, per the owner's re-check instruction):
    `packages/insights/src/sources.ts`, `adapters/{fred,derived,cftc,
    mof,boe,goldapi,monthly-indexes,rung4}.ts`, `licences.ts` — the exact
    series ids the repo ingests (`fed-target`=DFEDTARL/U,
    `term-premium-10y`=THREEFYTP10, `stress-stlfsi`=STLFSI4,
    `michigan-1y-expectations`=MICH, `m2-us`=M2SL, `median-cpi`=
    MEDCPIM158SFRBCLE, `sticky-cpi`=STICKCPIM158SFRBATL, `repo-stress`=
    SOFR−IORB, `us-deficit-12m`=MTSDS133FMS, COFER=`G001.AFXRA.CI_USD.SHRO_PT.Q`,
    CFTC=`dea/newcot/deafut.txt`, GPR/EPU URLs).
- **Nothing classified, nothing wired, nothing deployed** (D-GA-3/D-GA-6:
  the pre-scan's marks are not classes; GA-S3 classifies). No code, worker,
  schema, adapter or copy file touched; one read-only script added.
- **Blocked on the owner:** **OI-GA-1 — the taxonomy lock.** Amend or lock
  82-row v1; until then GA-S2 must not map wiring against an unlocked
  denominator (its prompt starts by resolving the lock).

### Spec session (2026-11-04) — the program specified

- **Delivery:** the spec set written and delivered on `spec/gold-meter-audit`
  (this PR) — README (decisions D-GA-1..10, open items OI-GA-1..6),
  01-AUDIT-SPEC (the contract, honesty rules, completeness guarantee,
  classification rubric), 02-REFERENCE-TAXONOMY (draft v0: 9 families,
  72 rows, every row with classic claim + sign + free source + cadence +
  treatment), 03-METHOD-AND-EVIDENCE (inventory, wiring trace, matrix,
  H1–H7 defect checks, evidence rules), 04-REPORT-AND-FILL-DESIGN (report
  shape, severity components, the GF-P0..P5 fill phases, standing
  constraints), PROMPTS (the GA-S1 kickoff prompt, full), PROGRESS (this
  file). AGENT_HANDOFF.md rewritten for the audit program; CHANGELOG entry.
- **Grounding facts used (verified against the repo at spec time):** the
  21-voter table (borrowing costs 8 · dollar 3 · market stress 5 ·
  inflation 5; `docs/specs/gold-balance-consolidation/
  02-ENGINE-AND-DECISION-TABLE.md` §4); the self-flagged thin voters
  (`cftc-gold-positioning` "one stored point: never fires today";
  `us-japan-10y-gap` "stale most windows"; `gold-silver` "thin history";
  the yield-curve polarity "ambiguous"); the ingested-but-not-voting
  context set (`docs/INDICATORS_AND_DATA_SOURCES.md`: gpr-* ×10, ebp,
  ofr-fsi, sloos-ci-tightening, term-premium-10y, tga, reverse-repo,
  bank-reserves, repo-stress, net-liquidity, m2-us,
  michigan-1y-expectations, usd-reserve-share [the dedollar shadow,
  S6-M6.4 pending], sp500-breadth-ratio, us-deficit-12m,
  govt-interest-revenue, treasury-auction-10y/30y + indirect, nyfed-custody,
  btp-bund-spread, t5yie, breakeven-10y, median-cpi, sticky-cpi,
  gold-oil-ratio, gold-btc, gold-aud, copper-gold); the free-source
  licence table (L0/L1). None of this pre-classifies anything — the matrix
  is GA-S3's, against the locked taxonomy (D-GA-1).
- **Nothing audited yet.** The program's first finding will be GA-S1's.

## Owner must decide

1. **OI-GA-1 — the taxonomy lock** (after GA-S1 delivers v1): amend or lock.
   The audit cannot count coverage against an unlocked denominator.
2. OI-GA-2..OI-GA-6 — as scheduled in the README's table (GA-S4's decision
   list, unless the owner calls them earlier in chat).

## Standing constraints (every session)

- D-GA-3: read-only against the meter — no edits to `gold-score.ts`,
  `gold-balance.ts`, `GOLD_LANE_VOTERS`, the harness tables, schemas,
  adapters or copy dictionaries; docs + read-only scripts only; deploy
  nothing.
- D-GA-2: no forecasting claim, anywhere, ever (the no-edge record stands).
- D-GA-1: the taxonomy is the fixed denominator; amendments after the lock
  are owner-recorded decisions with dates.
- Every number from a run or a citation; recommendations re-checked against
  code before they are written down (the owner's 2026-10-31 instruction).
- Full gates green before every push; branch + PR per phase; self-merge when
  the exit gate holds; CI green verified on main after every merge.
- D-GA-9: end every session with the next prompt rewritten, committed,
  pushed, and printed.
