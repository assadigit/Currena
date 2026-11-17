> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S1/09 — Data-Source Probe & Feasibility Notes

*The owner's constraint is real: no expensive feeds, no unlimited API
access. This note records what was actually verified (dates, endpoints,
results) and what it implies for feature feasibility. Credentials were
used for probing, are not stored, and must be rotated when the program
ends (AGENTS.md §7).*

## 1. EODHD probe (owner-provided key; tested 17 Nov 2026)

| Ticker tested | Result |
|---|---|
| `XAUUSD.FOREX` (daily EOD) | ✅ Works — OHLC, matches live spot (~$3,874 close 2026-11-13/14) |
| `XAUEUR.FOREX` (daily EOD) | ✅ Works — gold in EUR (~€3,537) |
| `XAUUSD.FOREX` (real-time endpoint) | ⚠️ Plan-gated — returns NA except previousClose |
| `US10Y.GBOND` | ❌ Plan-gated ("not available for your subscription plan") |
| `GLD.US`, `BTC-USD.CC` | ✅ Work (daily) |
| `DXY.IND`, `GSPC.IND`, `GC.COMEX`, `XAUUSD.FX/.CC` | ❌ Not found (wrong ticker or plan) |

**Implications.** (i) EODHD is viable as a *daily-history* source for
multi-currency gold (Idea 7) but not for real-time and not for yields on
the current plan. (ii) Currena's existing live price (gold-api.com,
L2-per-repo-terms) stays the live source. (iii) Yields/rates continue
via the existing FRED/Treasury pipelines (57 FRED series already
licensed in `docs/SOURCES.md`). (iv) CME-style futures data: not from
CME (S1/08 §3) and not from EODHD on this plan — any futures-based
feature needs the free public alternatives (CFTC CoT for positioning;
prediction markets for Fed odds).

## 2. What the repo already licenses (from `docs/SOURCES.md`, read 17 Nov 2026)

- **L0/public domain:** CFTC (COT), EIA, fiscaldata, GPR index, OFR,
  US Treasury TIC, World Bank Pink Sheet, ABS, RBA (CC BY).
- **L1:** ECB, IMF (incl. IFS — the central-bank reserves fallback),
  OECD, China NBS, portwatch.
- **L2 (owner-accepted):** FRED (57 series), gold-api.com (live metals),
  SGE, NY Fed, BoE, Cleveland Fed, Shiller dataset, Frankfurter FX.
- **L3 (never fetched, link-only):** WGC — prior written authorisation
  required.
- **Fail-closed today:** fund-pages (ETF holdings), PBoC.

**This is the most important S1 data finding:** the page's Flows & demand
weakness (2/37 voters) is *not* an engineering gap — the repo already
ingests IMF IFS (L1) and the page itself names the fix: the WGC
permission letter ("the draft is the owner's lever"). Concrete options,
to be decided at CP-A:

- **Option A (best):** owner sends the WGC authorisation request → if
  granted, the demand stack (Chain 4) unlocks at full depth.
- **Option B (fallback, no letter needed):** build the CB-demand view on
  IMF IFS monthly reserves (L1, already active) + LBMA vault data
  (free, monthly — S4 verifies licence text) + existing SGE/Swiss/
  Shanghai cards. Slower cadence, licence-clean, still unique in
  Persian.
- **Option C (minimum):** link-out treatment for WGC quarterly numbers
  (L3 discipline), prose-only context.

## 3. Candidate new sources flagged in S1 (S4 verifies terms)

| Source | For | Access observed | Licence check |
|---|---|---|---|
| Kalshi / Polymarket | Fed decision probabilities | Competitor embeds them live (30-min refresh) with links | S4: ToS for programmatic use + attribution requirements |
| LBMA vault & clearing | Institutional stock/flow cards | Public pages, Excel downloads | S4: licence text (benchmarks saw clean public publication) |
| CFTC CoT CSVs | Positioning percentiles | Public domain, already a repo source | ✅ already licensed |
| EODHD (current key tier) | Multi-currency gold daily history | Verified working 17 Nov 2026 | S4: confirm EODHD ToS display rights (L2-style) |
| Domestic Iranian quotes (tgju API / union data) | Iran bridge (Idea 8) | TGJU exposes a web-service; union rates via news sites | S4: licensing + reliability + rial/toman decisions — only if owner approves the bridge at CP-A |

## 4. Feasibility map for the S1/04 ideas (this program's working notes)

| Idea | New data needed? | Verdict from the probe |
|---|---|---|
| 1 Narrative | None (template over existing voters) | Feasible now |
| 2 Time machine | None (readings history exists in KV/backtest base) | Feasible; needs API surface (post-modularization) |
| 3 Correlation panel | None (gold + real yields + DXY present) | Feasible now |
| 4 Episode explorer | One-time historical series (public/academic) | Feasible; editorial-heavy, data-light |
| 5 Yield decomposition | None (real, nominal, breakeven, ACM premium present) | Feasible now |
| 6 CB demand tracker | WGC (letter) or IMF IFS+LBMA (fallback) | Blocked on owner decision (CP-A) |
| 7 Multi-currency grid | XAUxxx daily crosses (EODHD verified) | Feasible now |
| 8 Iran bridge | Domestic quotes + USD/IRR | Blocked on owner decision (CP-A) + S4 licence work |
| 9 Positioning percentiles | None (COT present; percentile10y pattern exists) | Feasible now |
| 10 Transparency wall | None (copy/structure) | Feasible now |

**Headline:** seven of ten distinctive ideas require *no new data
family at all* — they are assembly, narrative, and education over
series Currena already ingests. The two strategic prizes (CB demand,
Iran bridge) are decision-gated, not engineering-gated. This validates
the master prompt's suspicion that sophistication ≠ more data.
