> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S5/02 — The Missing-Indicator / Feature Master List — FINAL (Core / Supporting / Advanced / Excluded)

**Session:** S5 of the Gold Page Elevation program · **Date:** 2026-11-17
· **Branch:** `docs/gold-page-elevation`

**What this is:** the M2 deliverable of CP-A — the finalisation of the
s1/14 first-pass draft (F1–F21) using the four inputs the S5 prompt
names: (a) the S3 head-to-head feature matrix + verdict; (b) the S4/05
adopt/reject verdicts (feasibility verified, not assumed); (c) the S4
corrections (the حباب claim, the gerami ladder, the GRAM/lane mapping,
the CPI gap policy); (d) S3-D1's rule that the explanation layer is
co-equal Core. Every tier change from the draft is recorded with its
reason (§3). This list is what the owner locks at CP-A and what S8
sequences into the roadmap.

**Tier definitions (unchanged from s1/14):** **Core** — the elevated
page is broken without it; ships first. **Supporting** — strengthens
comprehension; second wave. **Advanced** — differentiation depth for
the returning researcher; later, behind progressive disclosure.
**Excluded** — deliberately not built (identity / cost / licence),
reason recorded so future sessions don't relitigate silently.

---

## 1. The finalised master list

| # | Feature (gap source) | Tier | Data path (S4-verified) | Complexity | Status |
|---|---|---|---|---|---|
| F1 | "Why gold moved" daily narrative, bound to the meter (s1/06 G2; Idea 1) | **Core** | none — assembly over existing series; GRAM/lane mapping is the template (S4/01 §2); TE skeleton + the forecast anti-pattern rule adopted (S4/02 §3, S4/05 §6) | Low-Med | Feasibility verified; S3-D1 co-equal Core in wave 1 |
| F2 | CB-demand tracker + 2022-rotation chart (G1; Chain 4; s1/12; D7) | **Core** | Tier-1: IMF SDMX 3.0 **IL `RGV_REVS` + IRFCL `IRFCL56V_FTO`** — keyless L1, monthly, Worker-egress verified, USA 8,133.5 t exact (S4/04 §2d); Tier-2: WGC GDT via the owner data-drop, attribution verbatim (S4/01 §4–§5); ADOPT (S4/05 §1) | Med | **Corrected**: "IMF IFS" → IL/IRFCL (the IFS dataflow does not exist on the modern API); display-only first (S2 §5b) |
| F3 | Iran bridge: instrument board + parity + حباب premium series (G12; Chain 8; s1/11; D6) | **Core** | the existing TGJU snapshot plane, re-verified live both venues (S2 §5a, S4/03 §1a); CBI constants pinned (S4/04 §2b); backfill route A verified (S4/03 §1e); all ADOPT (S4/05 §4) | Med | **Corrected**: the differentiation claim is the *documented, reproducible* premium — incumbents publish حباب undocumented (S4/03 §1c); gerami ladder recomputed monotone |
| F4 | Education on-ramp: mechanism explainers + one-line ratio meanings (G4/G10; S7 scope) | **Core** | none — the Kitco 5-driver pattern adopted (S4/02 §2a, S4/05 §6); Currena's twist: each driver closes at its gauge | Med (editorial) | S7 designs; closes the largest single dimension gap (education 2 vs 4.5, matrix §1) |
| F5 | Yield-decomposition card: nominal = real + breakeven (+ term premium) (G5; Chain 3) | **Core** | all three series present; Treasury-direct inputs verified fresher from both venues (+2 trading days; S4/04 §2f, S4-D5) | Low-Med | Feasibility verified; wave 1 (matrix §5a) |
| F6 | Episode Explorer: 1971→present annotated playbook (G3; Idea 4) | **Supporting** | long-run series solved via the WGC prices workbook drop (monthly averages since 1978; S4/04 §5 row 19 ADOPT); FRED supplement deferred-with-reason | Med (editorial) | **Unblocked**: the draft's data question is closed at zero marginal cost |
| F7 | Interactive price chart (pan/zoom/log; D8 overlays) (G9) | **Core** | EODHD XAUUSD daily OHLC re-verified, 360 rows to Nov 16 (S4/04 §5 row 17); the 10y decile rides the owner plan or server-side `percentile10y`; unit-aware header pattern adopted (S4/02 §2c) | Med | **Gated on wave 0**: #01 must be fixed first (S2 §5c) |
| F8 | Minimal TA suite: SMA 20/50/100/200 + distance-decile + cross events + classic daily/weekly pivots (s1/13; D8) | **Supporting** | XAUUSD daily OHLC (same as F7); no new data family (s1/13 §6) | Low | Decided (D8); TGJU's 5-method sprawl now evidences the classic-only restraint (S4/03 §1d) |
| F9 | ETF holdings & flows view (Chain 1's transmission observable; s1/12 §2; D7) | **Supporting** | WGC `ETF_Flows` XLSX rides the same data-drop (S4/05 §1 ADOPT) | Low-Med | Rides F2's drop; joins the narrative (s1/12 §5 item 3) |
| F10 | Multi-currency gold grid + local deciles (Chain 2; Idea 7) | **Supporting** | XAU-crosses on the owner's EODHD plan (S1/09-verified; free-key degradation documented, S4/04 §5 row 18); the KGX validation sentence adopted (S4/02 §2b) | Low | ADOPT on the owner plan (S4/05 §5) |
| F11 | Rolling-correlation panel: gold vs real yields / DXY, pre-registered windows (dim-5 score 2.5; Idea 3, Chain 1) | **Supporting** | none (derived); the anti-GPE-S3-05 answer: windows pre-registered, series named at point of use (S3-D3c) | Low | Feasibility verified |
| F12 | Time machine: the meter on any past date (Idea 2) | **Advanced** | readings history (exists); post-modularization API surface | Med | Unchanged |
| F13 | Sharpened transparency wall: per-item why + owner actions (G8-adjacent; Idea 10) | **Core** | none; the WGC blocked lines retire as Tier-2 lands (S2 §5b) | Trivial | Feasibility verified |
| F14 | COT percentile bands + crowd-gauge flags (Idea 9, Chain 6) | **Supporting** | none (pattern exists); the managed-money vs non-commercial convention choice → S6/S8 (S3-D3d) | Low | Feasibility verified |
| F15 | Outlook-language review (conditions grammar) (G6) | **Core** | none (copy); the binding anti-pattern rule + the LBMA retrospective as the constructive device (S4/02 §1d, §3) | Low (copy) | S6/S7 wording decision; resolves GPE-S2-11 |
| F16 | Interaction affordances + unread-voter explainer states (+ market open/closed pill, S3 matrix row) (G7/G8) | **Core** | none; the CPI seat's "why" = the S4-D1 gap label («مبنا: میانگین دو ماه مجاور»); UoM seats = "upstream stopped" status lines (GPE-S2-06 decomposition, S2 §3) | Low-Med | S2-sized: #06, #17, #18, #19 |
| F17 | Silver story: keep-small deliberate (its own strip only on evidence) (G11) | **Advanced** | mostly present | Low-Med | **S5 decision recorded (S5-D3): deliberate keep-small** — the S3 evidence shows silver depth is not a differentiator (SA's silver ETF row half-inert, GPE-S3-08); revisit only on measured demand |
| F18 | Gold-miner equities/ETF quotes layer | **Excluded** | — | — | Deliberate (S1/04 near-misses): SA's different business (GPE-S3-08/-09); link-out suffices |
| F19 | Full TA suite (RSI/MACD/Bollinger/variants) | **Excluded** | — | — | Scope guard s1/13 §4, now *evidenced*: TGJU ships the zoo (RSI+MACD blocks + 5 pivot methods) — the restraint is against the incumbent's sprawl (S4/03 §1d) |
| F20 | Qaurum-style scenario valuation tool | **Excluded** | — | — | Registration-gated, high cost; the concept rides F6 episodes |
| F21 | Real-time tick-by-tick everything | **Excluded** | — | — | Honest cadence: daily macro + ~5-min TGJU + live price; don't fake granularity (S1/05 §10) |
| **F22** | **London vault + clearing monthly cards** (institutional stock/flow) — *S4-added* | **Supporting** | LBMA XLSX free, both venues 200, arithmetic exact (124-month vault: 9,849.9 t / +0.293%; 360-month clearing) — S4/02 §1b–§1c; ADOPT ×2 (S4/05 §2) | Low | New this session; attribution "Source: LBMA" |
| **F23** | **Analyst-forecast accuracy retrospective** (the honesty device) — *S4-added* | **Advanced** | LBMA forecast-survey pages, 2010–2026 series extracted (consensus −2.1% mean / 8.1% mean-abs / −20.2% in 2025) — S4/02 §1d; ADOPT "Advanced tier, later phases" (S4/05 §2) | Low | New this session; pairs with the no-edge backtest |
| **F24** | **Market-implied Fed probabilities** (Kalshi + Polymarket card) — *S1/07 adopt item, S4-verified* | **Supporting** | both APIs keyless-readable from planning machine AND Worker egress (S4/04 §2g); ToS postures read (S4/04 §3); ADOPT ×2 (S4/05 §3); the Kalshi agreement wording = one build-time read | Low-Med | New this session; 30-min refresh, display-only + attribution + link |
| **F25** | **Gold event calendar strip** (next Fed/CPI, Tehran + NY time) — *S1/07 adopt item, S3-matrix gap* | **Supporting** | the existing in-repo calendar feed (`data/insights-calendar.json`, the Insights "Next up" strip); zero new fetches; the GPE-S3-10 mixed-timezone lesson: name the zone at point of use | Trivial-Low | New this session; S6 placement |
| **F26** | **"If you'd bought" historical investment calculator** (gold vs S&P vs BTC vs silver, DCA since year Y) — *S1/07 adopt item* | **Advanced** | all series in-repo (gold/silver/btc live-priced; sp500 on the world board); SA's precedent verified self-consistent (GPE-S3-17); Currena's version adds the decile framing | Low-Med | New this session; fits the statistical identity (s1/07 §4) |
| **F27** | **Retail jewelry calculator** (toman weight × karat × اجرت × tax) — *S3-matrix row, disposed* | **Excluded** | — | — | Retail tool, not analysis; the bridge's premium decomposition carries the analytical core (melt vs market IS the jewelry arithmetic); may join Bridge-3 education (s1/11 §8) if the owner wants a retail utility |

**Counts: Core 9 (F1–F5, F7, F13, F15, F16) · Supporting 9 (F6, F8,
F9, F10, F11, F14, F22, F24, F25) · Advanced 4 (F12, F17, F23, F26) ·
Excluded 5 (F18, F19, F20, F21, F27) — 27 items.**

## 2. Why the draft's tiers survived (the honest headline)

**No F1–F21 item changed tier.** That is a finding, not a failure of
rigour — three independent checks confirm the S1b draft was
well-calibrated:

1. **S3-D1's co-equal-Core rule was already reflected** — the draft
   (written post-D6–D8) placed F1/F4/F5 Core beside F2/F3; the S3
   verdict's demand ("the explanation layer is co-equal Core with the
   differentiation prizes in the first build wave — not a second
   wave") changes the *sequencing*, which s1/14 §2 had only hinted at,
   not the tiers. The build-wave proposal (S5/03 §3) is where that
   rule lands.
2. **S4's verdicts confirmed rather than demoted** — every Core and
   Supporting row came back ADOPT or ADOPT-with-conditions in S4/05;
   nothing failed feasibility. The two REJECT families (WGC AISC,
   futures/OI) were never F-features; the LBMA price-feed rejection
   affects no row (gold-api/EODHD serve the price family).
3. **The S4 corrections are content corrections, not tier moves** —
   the حباب claim narrows and strengthens (F3), the gerami ladder is
   recomputed (F3 constants), the IFS→IL/IRFCL resolution makes F2
   cheaper than drafted, the prices-workbook drop unblocks F6's data
   question. In every case the feature's page-level importance was
   unchanged by the correction.

## 3. The change log vs s1/14 (every change, with reason)

| Item | s1/14 draft | Final | Reason (evidence) |
|---|---|---|---|
| F1–F5, F7, F13, F15, F16 | Core | **Core (unchanged)** | Confirmed by inputs (a)–(d): matrix §5's first-wave call-out names F1/F5 (+F4/F7 for the two largest gaps); S4/05 feasibility ADOPTs; S3-D1 co-equal rule; no correction touches tier |
| F6 | Supporting | **Supporting (unchanged)** | Historical context is the page's lowest dimension (1.5) but not "page broken without it" (S2 §4 dim 6); S3-D1 names F1/F5/F4 as the explanation Core, not F6. **Content**: data question closed — the WGC prices workbook drop (S4/04 §5 row 19) |
| F8 | Supporting | **Supporting (unchanged)** | s1/13 §6 itself assigns Supporting; D8 decided it *ships*, not that it outranks; the chart/TA wave carries it (S5/03 §3). **Content**: classic-only restraint now evidenced against TGJU's sprawl (S4/03 §1d) |
| F9 | Supporting | **Supporting (unchanged)** | ADOPT rides F2's drop (S4/05 §1); joins the narrative per s1/12 §5 item 3 |
| F10 | Supporting | **Supporting (unchanged)** | ADOPT on the owner plan (S4/05 §5); KGX sentence adopted (S4/02 §2b). **Content**: the free-key depth degradation documented for the record (S4/04 §5 row 18) |
| F11 | Supporting | **Supporting (unchanged)** | The S3 relationship win (3.5 vs 2.5) is answered; pre-registered windows + series-named-at-point-of-use are binding (S3-D3c, GPE-S3-05) |
| F12 | Advanced | **Advanced (unchanged)** | No new evidence |
| F14 | Supporting | **Supporting (unchanged)** | The COT convention choice (managed-money vs non-commercial) is an S6/S8 spec item (S3-D3d) |
| F17 | Advanced, "S5 decision" open | **Advanced — decision CLOSED: deliberate keep-small** (S5-D3) | Silver depth is not a differentiator (SA's silver ETF row half-inert, GPE-S3-08; Currena's ratio cards verify exact); the elevated page documents the choice instead (GPE-S2-13 "now a documented choice"); a silver strip returns only on measured demand |
| F18, F20, F21 | Excluded | **Excluded (unchanged)** | No new evidence against building them |
| F19 | Excluded | **Excluded (unchanged), reason sharpened** | TGJU's own pages (RSI+MACD blocks, 5 pivot methods — S4/03 §1d) evidence the zoo the scope guard rejects: restraint against incumbent sprawl, not a missing feature |
| **F22** | — (new, S4-added) | **Supporting** | LBMA vault + clearing: free, both venues verified, arithmetic exact, zero new paid feeds (S4/05 §2 ADOPT ×2); the institutional stock/flow complement s1/12 §5 asked S4 to check |
| **F23** | — (new, S4-added) | **Advanced** | S4/05 §2 records it "Advanced tier, later phases" explicitly; the honesty device pairs with the no-edge backtest (S4/02 §1d) |
| **F24** | — (new; S1/07 adopt item, S4-verified) | **Supporting** | Both venues keyless-verified + ToS read (S4/04 §2g, §3; S4/05 §3 ADOPT ×2); strengthens macro interpretation but the fed-expectations voter already fires — an added lens, not a hole |
| **F25** | — (new; S1/07 adopt item, S3-matrix gap) | **Supporting** | The matrix's "Economic calendar ✗" row + S3 §1 row 10 (next Fed Dec 9 / CPI Dec 10, verified consistent); data already in-repo; trivial cost; the GPE-S3-10 timezone lesson carried |
| **F26** | — (new; S1/07 adopt item) | **Advanced** | "Fits Currena's statistical identity" (s1/07 §4); SA precedent self-consistent (GPE-S3-17); all series in-repo; a returning-researcher tool behind progressive disclosure |
| **F27** | — (new; S3-matrix row, disposed) | **Excluded** | SA's calculator is USD-only retail tooling; the bridge's decomposition covers the analytical core; recorded so the matrix row is disposed, not dangling |

### S3-matrix residual rows — every "SA has / Currena lacks" row disposed

DMA overlays → F7/F8 (D8) · daily narrative → F1 · assembled macro
reading → F5 · relationship chart → F11 · inflation history chart →
F5/F7 scope (same series, chart upgrade renders it) · Fed prediction
markets → F24 · economic calendar → F25 · asset comparison table
(1/5/10/20y) → F6 scope (the same long-run series; S6/S7 decide
presentation) · miners/ETF layer → F18 Excluded · jewelry calculator →
F27 Excluded · DCA calculator → F26 Advanced · market open/closed
state → F16 scope note (a status affordance; S6 decides) · FAQ → F4
scope (a format choice of the on-ramp). *(Matrix §2, all rows
accounted for.)*

## 4. What feeds S8 (sequencing + the infrastructure decisions)

- **The build-wave proposal** (carried to S5/03 §3, the CP-A brief):
  wave 0 fix-first (#01/#02/#09 + F16's why-lines) → wave 1
  explanation + prizes (F1, F5, F13, F15, F16 + F3 Bridge-1 + F2
  Tier-1) → wave 2 chart/TA + education (F7, F8, F4) → wave 3
  Supporting (F6, F9, F10, F11, F14, F22, F24, F25) → wave 4 Advanced
  (F12, F23, F26; F17 only on evidence). S8 owns the final P1–P4 cut.
- **Two infrastructure adoptions ride alongside (not F-features):**
  the **Treasury-direct yield switch** (S4-D5 — one ingest-leg swap,
  zero schema change, FRED stays fallback/cross-check; the S8 roadmap
  decision, owner A/B at CP-A) and the **CPI shutdown-gap policy**
  (S4-D1 — adjacent-months-average base, computed at read time,
  labelled at point of use, auto-expiring; stored levels stay pure).
- **The two operational P0s** (CFTC Saturday gate; GPR re-fetch) stay
  outside GPE's build order — the modularization-closeout window owns
  them (S2-D4, carried cited through S3/S4/S5).

## 5. Method and limitations

The finalisation applies the four prompt inputs to each s1/14 row and
to the S4/S3-derived additions; every verdict cites S4/05's table or
the S3 matrix. Limitations: (1) tier semantics are page-level
importance, not effort — S8 sequences within tiers using the wave
logic; (2) F25/F26/F27 were verified only at the concept/data-existence
level (the S4 reality check did not probe the in-repo calendar feed or
re-derive the DCA series — both are existing repo surfaces, cited to
AGENTS.md §E and the S3 audit); (3) the Excluded list is a positioning
asset — revisit only with new evidence, never silently (s1/14 §2).
Values named are 2026-11-17 snapshots; the tier logic is not
date-sensitive. Nothing was implemented (standing constraint).
