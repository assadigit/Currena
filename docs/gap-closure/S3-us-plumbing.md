# S3 — US credit, liquidity, fiscal and growth nowcast

**Estimated length:** 3 to 4 hours. **Depends on:** S1. Read `00-OPERATING-RULES.md` first.

## Why

The `market-stress` gauge has no credit, funding or liquidity voter (two of its
five voters are gold-specific). The ICE BofA credit spreads were rejected for
licence reasons, so we need licence-clean substitutes. Treasury supply, term
premium and a real-time growth nowcast are missing, while the 10y and 30y yields
sit in the top 10% of their ten-year range.

All new items in this session are **context-only** (decision G-5).

## Candidates (all unverified until M3.1; see `VERIFIED-SOURCES.md`)

| Group | Candidate | Source | Cadence |
|---|---|---|---|
| Term premium | 10-year term premium (`THREEFYTP10`, Kim-Wright) | FRED | daily |
| Liquidity | Treasury General Account (`WTREGEN`), reverse repo (`RRPONTSYD`), bank reserves (`WRESBAL`) | FRED | weekly/daily |
| Funding | Interest on reserve balances (`IORB`) to derive **repo stress = SOFR minus IORB** | FRED + existing `sofr` | daily |
| Liquidity (derived) | **Net liquidity = Fed balance sheet (`walcl`) minus TGA minus reverse repo** | derived from existing `walcl` + above | weekly |
| Credit | **Excess Bond Premium (EBP)** | Federal Reserve Board CSV (URL in VERIFIED-SOURCES) | monthly |
| Credit/stress | **OFR Financial Stress Index** | financialresearch.gov (discover file/API) | daily |
| Credit conditions | Senior Loan Officer Survey, C&I tightening (`DRTSCILM`) | FRED | quarterly |
| Growth nowcast | Atlanta Fed GDPNow (`GDPNOW`) | FRED | multiple per month |
| Survey | Empire State manufacturing (`GACDISA066MSFRBNY`) | FRED | monthly |
| Labor | Continuing claims (`CCSA`) | FRED | weekly |
| Inflation | Cleveland Fed median CPI (`MEDCPIM158SFRBCLE`), Atlanta Fed sticky CPI (`STICKCPIM157SFRBATL`) | FRED | monthly |
| Fiscal | Federal surplus/deficit monthly (`MTSDS133FMS`) | FRED | monthly |
| Treasury supply | Auction bid-to-cover and indirect bidder share (10y, 30y) | Treasury FiscalData API | per auction |

## Milestones

### M3.1 Series verification and licence scan
1. For every FRED candidate, confirm it exists, frequency, units, latest observation date, and the copyright class using the repo's T-16 scan (`data/fred-copyright.json`, see `docs/insights/LICENCES.md`). Accept only `public domain` or `citation required`. Record each decision in `VERIFIED-SOURCES.md` (including rejected ones with the reason).
2. Read the first rows of the Fed EBP CSV (`ebp_csv.csv`); record the column names, units and the latest month.
3. Discover the OFR Financial Stress Index machine-readable source from `https://www.financialresearch.gov/financial-stress-index/` (the CSV guess returned 404; inspect the page and the OFR data API documentation). Record the exact URL, terms and freshness. If no reliable machine-readable source exists, reject it (G-4).
4. Discover the FiscalData auctions dataset and fields (`api.fiscaldata.treasury.gov`), with a sample response saved as a fixture.
5. Check Worker egress results from S1 for `federalreserve.gov`, `financialresearch.gov`, `fiscaldata`.

Acceptance: a verified/rejected decision per candidate with evidence; fixtures saved for EBP, OFR (if verified) and FiscalData.

### M3.2 Liquidity and term premium from FRED
1. Add the verified FRED series to the **new rung** (`rung3`/`rung4`), not the full `main` rung (budget). If a FRED bulk request can carry several ids in one subrequest, use that.
2. Definitions: `term-premium-10y`, `tga`, `reverse-repo`, `bank-reserves`, `repo-stress` (derived), `net-liquidity` (derived). Pure derived functions with tests (same-date rule: both legs must share a date or the card shows both dates).
3. Cadences/`maxAge` per RULES §6 (weekly 10 days, daily 4 days). History handling per the periodic/daily history rungs (read the existing split before adding writes; keep daily KV writes within the budget in rules §4).
4. Group them under `market-stress` or a new context group "Liquidity and funding" inside the Global region (choose after reading `gauges.ts`; context-only).

Acceptance: values on production match the FRED source for the same date (spot check three); all `context`; subrequests/KV writes reported.

### M3.3 Credit stress sources
1. Implement the Fed EBP adapter (monthly) and the OFR FSI adapter if verified. Parsers fail closed with fixtures. Provider records: Fed Board L0 (public domain, verify the terms line), OFR L0 (verify).
2. Definitions: `ebp` (excess bond premium), `ofr-fsi` (and its components if available as separate columns; show only what is clearly documented).
3. Plain-language framing: "How much extra investors demand to lend to risky companies" (EBP). Wording rules apply.

Acceptance: both cards live with correct `asOf`; stale handling tested; licence records complete.

### M3.4 Growth nowcast and surveys
1. Add `gdpnow`, `empire-state`, `continuing-claims`, `median-cpi`, `sticky-cpi`, `sloos-ci-tightening` (the verified ones) via the new rung.
2. GDPNow updates several times a month; set `maxAge` accordingly; show the quarter it refers to.
3. Context-only. Do not change existing growth voters.

Acceptance: cards live; GDPNow quarter label verified against the Atlanta Fed page.

### M3.5 Fiscal and auctions
1. `us-deficit-12m` (derived: 12-month sum of `MTSDS133FMS`, show the monthly figure too) and, if verified, `treasury-auctions` (bid-to-cover and indirect share for the latest 10y and 30y auction, with the auction date).
2. Auctions are event-based (like per-change series): define the cadence and stale rule (`maxAge` about 45 days) explicitly in the definition and a test.

Acceptance: cards live; auction values match the Treasury results page for the same auction date (spot check).

### M3.6 UI, copy, docs and deploy close
1. Layer-1 copy (EN + fa) for every new id; glossary terms: "term premium", "reverse repo", "Treasury General Account", "bank reserves", "excess bond premium", "financial stress index", "nowcast", "bid-to-cover".
2. UI: reuse existing card components; add the new context group(s) with a plain "what this tells you" intro; Australia-first notes where the existing pattern calls for it (RULES §7: for example how US term premium and liquidity tend to flow to Australian yields, as a tendency, not a forecast).
3. Narrator vocabulary update and check.
4. Docs: `AGENTS.md` §A, `INDICATORS_AND_DATA_SOURCES.md` §1 and §2 (counts rise from 102), CHANGELOG, `registry:generate`.
5. Deploy and verify per rules §3; report KV writes/day. Update PROGRESS.md (G3, G4, G5), session log, and print the S4 prompt.

## Risks

- OFR or EBP file format changes: fail closed.
- FRED licence class surprises: reject, do not ship (G-4).
- KV write budget: if daily history writes would exceed the cap in rules §4, move low-frequency ids to the `history-periodic` rung.
