> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S1/12 — Central-Bank Demand & the WGC Datasets: Spec Preparation (D7)

*Owner decision D7: implement the demand story now, do not wait for the
WGC licence. This document records what WGC actually publishes (probed
live 2026-11-17), what the mechanical access path is, and the two-tier
build that satisfies "implement now" honestly. Chain 4 (the buyer
rotation — the structural demand story of the decade) is the target.*

## 1. What WGC publishes (Goldhub, verified 2026-11-17)

The Goldhub data catalog (`gold.org/goldhub/data`) is public. Dataset
pages found live: gold prices, ETF holdings & flows, futures curves &
open interest, trading volumes, price volatility, returns, correlation,
premiums, AISC (mine supply costs), production by country, reserves by
country, demand by country, "how much gold".

**Central-bank reserves page — download links observed:**

| File | What it is | Access |
|---|---|---|
| `World_official_gold_holdings_as_of_Nov2026_IFS.xlsx` | World official gold holdings — **IFS-derived** | login-gated |
| `Changes_latest_as_of_Nov2026_IFS.xlsx` | Latest monthly changes in official reserves — **IFS-derived** | login-gated |
| `Quarterly_gold_and_FX_Reserves_Q3_2026.xlsx` | Quarterly gold & FX reserves | login-gated |
| `CBGA_sales.xlsx` | Central Bank Gold Agreements sales (historical) | login-gated |

**Demand page** — `GDT Tables_Q326_EN.xlsx` (the quarterly Gold Demand
Trends tables: jewellery, technology, ETFs, central banks, bar & coin —
the full demand stack), plus methodology PDFs. Login-gated.

**ETF page** — `ETF_Flows_2026-11-03.xlsx` (daily holdings & flows,
file dated ~2 weeks old at probe time) + methodology PDF. Direct fetch
returns **403**; the file is behind WGC's free-account login wall.

**Probe conclusions.** (i) No public API. (ii) The catalogue is public
and the file names/dates are visible without login. (iii) Every XLSX
fetch without a session returned either the login page or 403
(verified). (iv) The CB-reserves tables are explicitly **IFS-based** —
the same IMF data Currena already licenses directly (L1) with no gate.

## 2. The two-tier build (how "implement now" works honestly)

### Tier 1 — IMF IFS primary (licence-clean, zero gate, start here)

Build the CB-demand tracker on **IMF IFS monthly official reserve
assets** (gold, tonnes) — already an L1-licensed repo source (S1/09 §2)
— which is the same underlying compilation WGC republishes.

Derived series and views (all computed, all dated):
- Monthly net purchases per country (Δ holdings) — top buyers table
  (China, India, Turkey, Poland, Kazakhstan, … the rolling cast).
- Rolling 12-month global net purchases — the regime chart with the
  **2022 annotation** (the sanctions-response rotation that broke the
  old inverse gold/real-yield correlation — Chain 1's "exception"
  made visible).
- Share-of-total-reserves trend (gold % of reserves) for the top
  holders — the de-dollarisation framing, stated carefully (a rising
  gold share can be price arithmetic, not active buying — the copy
  must say so).
- Provenance label: "Source: IMF IFS (monthly)" with the WGC
  cross-reference link for readers who want the curated version.

Cadence: monthly, T+weeks (IFS publication lag); staleness handling
per the repo's fail-closed culture.

### Tier 2 — WGC-unique datasets (owner-accepted, D7)

What IFS cannot give, only WGC's compilation does:
- **The quarterly demand stack** (GDT tables): jewellery / technology
  / ETFs / central banks / bar & coin — the full "who is buying"
  decomposition. Quarterly.
- **Daily ETF holdings & flows** (global, by fund geography) — the
  transmission observable of Chain 1 at daily resolution.
- **Premium data** (Shanghai/other premiums) — complements the Iran
  bridge's own premium (s1/11) with the global physical-market view.

Access mechanics (S4 finalises): authenticated download via the owner's
free WGC account (session cookie in a scheduled worker, or the simpler
**data-drop pattern**: owner downloads the XLSX on release day and
commits it as a dated source file, e.g. `data/wgc/2026-Q3-gdt.xlsx`,
which the ingestion parses — fully auditable, no stored credentials).
Attribution on every rendered number and chart: **"Source: World Gold
Council"** + link to the dataset page; WGC's terms-and-conditions page
is linked in the licence footer (S4 quotes the exact attribution
wording required).

Risk note (survives D7, recorded for the owner): WGC's terms seek prior
written authorisation for data use; the owner has accepted proceeding
without waiting. The parallel action — sending the authorisation
request letter (the page's own "draft is the owner's lever") — remains
recommended; if granted it removes the residual exposure and may unlock
cleaner access (possibly including API discussion).

### What each tier buys the page

| View | Tier 1 (IFS) | Tier 2 (WGC) |
|---|---|---|
| CB monthly purchases, top buyers, 2022-regime chart | ✓ | ✓ (same numbers, curated) |
| Gold share of reserves | ✓ | ✓ |
| Full demand stack (jewellery/tech/ETF/CB/bar&coin) | ✗ | ✓ quarterly |
| Daily ETF flows | ✗ | ✓ daily |
| Global physical premiums | ✗ | ✓ |

## 3. The Chain-4 visual (S7 designs; sketch for the spec)

- Main chart: rolling-12m global CB net purchases (tonnes), 20-year
  window, annotated: 2009–2011 post-GFC wave · 2014–2018 official-
  sector selling → buying flip · **2022 "the buyer rotated"** ·
  current pace.
- Companion: gold vs 10y real yield dual-axis with the same 2022
  annotation (the Chain-1/Chain-4 crossover — the single most
  important lesson the page can teach).
- Country table: latest month + 12m sum, sorted, with the
  share-of-reserves column.
- FA copy: the term rotation — «چرخش خریدار» — with the honest caveat
  that monthly IFS data is revised and some buyers report with lag
  (China's reporting pattern is itself a story the copy can teach).

## 4. Ingestion sketch (for the S8 roadmap; post-modularization)

- New adapter in the (modularized) ingestion layer: `wgc-gdt`
  (quarterly, data-drop parse) + `wgc-etf-flows` (weekly file-check,
  daily rows) + IFS gold-reserves query (monthly).
- Storage: dated rows with `source`, `asOf`, `retrievedAt` — the
  traceability discipline (docs/specs/traceability.md) applies.
- Update gates: quarterly GDT ~30 days after quarter end (WGC's own
  release rhythm); ETF weekly; IFS monthly with revision-tolerance
  (re-fetch trailing 3 months, keep both vintage and latest — the
  repo's revision practice question, S4 checks existing precedent).
- Meter integration (governance question for S6/S8): should a CB-
  purchases voter join the demand lane? The lane is 2/37 today (G1).
  Recommendation to debate at S6: **present before voting** — add the
  section as display-only first (conditions-meter reweighting is a
  governance event with backtest implications; the repo's governance
  docs treat voter changes as versioned decisions).

## 5. Open items (S4 / S6 / S7)

1. S4: exact IMF IFS series IDs + the cleanest endpoint for monthly
   gold reserves (the repo's IFS adapter pattern); WGC attribution
   wording (quote ToS); the authenticated-download vs data-drop
   decision (recommend data-drop for auditability); GDT XLSX structure
   mapping (columns, sheets) once a file is in hand.
2. S4: LBMA vault data licence check (the S1 fallback idea) — keep as
   a complement for institutional stock, not a dependency.
3. S6: whether the CB section also carries the ETF-flows view (Tier 2)
   or the page stays CB-first (recommend CB-first; ETF flows join the
   narrative and the opportunity-cost lane).
4. S7: the 2022-rotation annotation copy (FA+EN) and its cross-links
   to Chain 1 (real yields) and the Episode Explorer (Idea 4).
