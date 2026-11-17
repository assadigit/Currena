> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S1/14 — Gap Analysis: Master Draft (first pass, post-D6–D8)

*Consolidates the S1 audit gaps (s1/06 G1–G12), the competitor
adoptables (s1/07), the benchmark top-10 (s1/08), and the owner's
D6–D8 decisions into one master list with the
Core / Supporting / Advanced / Excluded classification. This is the
S5 deliverable pulled forward as a draft — S2/S3 deep audits will add
issues; S5 finalises; nothing here is committed for build until CP-A
scope lock and the S8 roadmap.*

**Tier definitions (working):**
- **Core** — the elevated page is broken without it; ships first.
- **Supporting** — strengthens comprehension; ships in the second wave.
- **Advanced** — differentiation depth for the returning researcher;
  ships later, behind progressive disclosure.
- **Excluded** — deliberately not built (identity/ cost/ licence), with
  the reason recorded so future sessions don't relitigate silently.

## 1. The master list (gaps → features → tier → status)

| # | Gap (source) | Feature that closes it | Tier | Data needed | Complexity | Status after D6–D8 |
|---|---|---|---|---|---|---|
| F1 | G2 — no narrative layer; competitor's best feature | "Why gold moved" driver narrative, bound to the meter (Idea 1) | **Core** | none | Low-Med | Feasible now (S1/09) |
| F2 | G1 — demand story absent (2/37 voters); the decade's structural driver invisible | CB-demand tracker: IFS monthly purchases + 2022-rotation chart (Chain 4; s1/12) | **Core** | IMF IFS (licensed L1) + WGC Tier 2 (D7) | Med | **Decided (D7)** — spec prep s1/12 |
| F3 | G12 — no Iran dimension; the Persian market's most-asked question unowned | Iran bridge card: instrument board + parity + حباب premium series (Chain 8; s1/11) | **Core** | TGJU (already ingested — S1b discovery) | Med (was High) | **Decided (D6)** — spec prep s1/11 |
| F4 | G4/G10 — no education on-ramp; jargon exposed | Mechanism explainers on every major family (real yields, term premium, COT, حباب…) + one-line ratio meanings (S7 scope) | **Core** | none | Med (editorial) | S7 designs |
| F5 | G5 — yield lesson never assembled | Yield-decomposition card: nominal = real + breakeven + term premium (Idea 5, Chain 3) | **Core** | none (all three series present) | Low-Med | Feasible now |
| F6 | G3 — no history on the page | Episode Explorer: 1971→present annotated playbook (Idea 4) | **Supporting** | one-time public/academic series | Med (editorial) | Feasible; licence-clean sources only |
| F7 | G9 — sparklines not explorable; competitor has 1m–20y + DMA overlays | Interactive price chart (pan/zoom, log, 50/200DMA overlay per D8) | **Core** (chart) | XAUUSD daily (have) | Med | TA overlay rides D8 (s1/13) |
| F8 | — (competitor has it; TGJU-familiar readers expect it) | Minimal TA suite: SMA table + distance-decile + cross events + classic pivots (s1/13) | **Supporting** | XAUUSD daily OHLC (have) | Low | **Decided (D8)** — spec prep s1/13 |
| F9 | G1-adjacent — ETF flows are Chain 1's transmission observable | Daily/weekly ETF holdings & flows view (WGC Tier 2; s1/12 §2) | **Supporting** | WGC ETF XLSX (D7) | Low-Med | **Decided (D7)** — rides F2 |
| F10 | Chain 2 — dollar-arithmetic lesson invisible | Multi-currency gold grid (EUR/JPY/GBP/CNY/AUD + IRR via bridge) with local deciles (Idea 7) | **Supporting** | XAUxxx daily (EODHD verified) | Low | Feasible now |
| F11 | Indicator relationships shown only as lanes (dim 5 score 2.5) | Rolling-correlation panel: gold vs real yields, gold vs DXY, pre-registered windows (Idea 3, Chain 1) | **Supporting** | none | Low | Feasible now |
| F12 | Meter's honesty is invisible to new users | Time machine: the meter on any past date (Idea 2) | **Advanced** | readings history (exists) | Med | Feasible; post-modularization API surface |
| F13 | G8-adjacent — licence wall is passive | Sharpened "what we cannot show you" transparency wall with per-item why + owner actions (Idea 10) | **Core** | none | Trivial | Feasible now |
| F14 | Positioning stats lack the extremes view | COT percentile bands + crowd-gauge flags (Idea 9, Chain 6) | **Supporting** | none (pattern exists) | Low | Feasible now |
| F15 | G6 — "Bearish" vs "not a forecast" terminology tension | Outlook-language review (conditions grammar) | **Core** | none | Low (copy) | S6/S7 wording decision |
| F16 | G7 — hero chips don't announce interaction; G8 — unread voters lack "why/when back" | Interaction affordances + unread-voter explainer states | **Core** | none | Low-Med | S2 deep-audit will size it |
| F17 | G11 — silver a near-passenger | Silver story: its own conditions strip or a deliberate keep-small note | **Advanced** | mostly present | Low-Med | S5 decision |
| F18 | — | Gold-miner equities/ETF quotes layer | **Excluded** | — | — | Deliberate (S1/04 near-misses): competitor's different business; link-out suffices |
| F19 | — | Full TA suite (RSI/MACD/Bollinger/variants) | **Excluded** (beyond D8's minimal set) | — | — | Scope guard s1/13 §4; revisit only on evidence |
| F20 | — | Qaurum-style scenario valuation tool | **Excluded** | — | — | Registration-gated, high cost; concept rides F6 episodes instead |
| F21 | — | Real-time tick-by-tick everything | **Excluded** | — | — | Honest cadence: daily macro + ~5min TGJU + live price; don't fake granularity (S1/05 §10) |

## 2. What the tier draft implies (for S5 to pressure-test)

- **The Core wave is assembly-dominated**: of 8 Core items, only F2
  (IFS/WGC ingestion) and F7 (chart engine) need real pipeline work;
  F1, F4, F5, F13, F15, F16 are narrative/copy/UX over existing data.
  The page's biggest holes are explanation holes — exactly the S1
  headline ("rigor without explanation").
- **D6–D8 converted the two "strategic prizes" into ordinary roadmap
  items** — F2 and F3 now have spec-preps, verified data paths, and no
  remaining owner gate. Their complexity dropped (F3 from High to Med)
  because the TGJU family was already ingested.
- **Sequencing hint for S8** (roadmap session decides): F1+F5+F13
  (cheap, visible, explanation-first) → F3 Bridge-1 + F2 Tier-1 (the
  differentiation pair) → F7+F8 (chart + TA) → the Supporting wave →
  F12/F17 Advanced. Measurement (S12 in the program plan) verifies the
  explanation-layer thesis against engagement.
- **The Excluded list is an asset**: F18–F21 stay recorded with
  reasons, so the page's restraint remains a deliberate, documented
  positioning choice (the "more information ≠ better product"
  principle, now enforced as a list).

## 3. Classification cross-check (the master-prompt lens)

Every Core/Supporting item maps to one of the 8 causal chains (s1/03):
F1 (all chains), F2 (Chain 4), F3 (Chains 2+8), F4 (all), F5 (Chain
3), F7 (context), F8 (trend context), F9 (Chains 1+4), F10 (Chain 2),
F11 (Chains 1+2), F13 (trust layer), F14 (Chain 6). No feature exists
without a mechanism it teaches — the discipline that keeps depth from
becoming clutter.
