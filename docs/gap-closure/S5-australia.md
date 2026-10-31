# S5 — Australia deep-dive and Australian markets

**Estimated length:** 3 to 4 hours. **Depends on:** S1. Read `00-OPERATING-RULES.md` first.

## Why

Australia has 23 indicators in 3 gauges (inflation and rates, households, trade and
currency) but no activity gauge (GDP, retail, building approvals, population) and
no external gauge tying commodities and China to Australia. The owner wants **all
important Australian indices** covered. ABS is CC BY 4.0 and already works from
Worker egress (the monthly CPI is live), so most of this session uses ABS.

RBA tables cannot be fetched from Worker egress (Akamai). Anything RBA-sourced is
handled by S1-M1.5; do not add new RBA dependencies here.

The existing 16-index world markets board stays exactly as is (G-3). Australian
indices go on a **separate** Australian markets board.

## Candidates (unverified until M5.1)

| Group | Candidate | Source |
|---|---|---|
| Activity | Real GDP growth (quarterly, annual %) | ABS National Accounts |
| External | Goods trade balance (monthly) | ABS International Trade in Goods and Services |
| Consumption | Retail trade (monthly, annual %) | ABS Retail Trade |
| Housing supply | Dwelling/building approvals (monthly) | ABS Building Approvals |
| Population | Population growth and net overseas migration (quarterly) | ABS National, State and Territory Population |
| Labour | Participation rate; underemployment rate (monthly) | ABS Labour Force (the `LF` dataflow already in use) |
| Indices | S&P/ASX All Ordinaries; ASX 200 sector indices (Financials, Materials, Energy, A-REIT, Health Care, Information Technology, Industrials, Consumer Discretionary/Staples, Utilities, Communication); ASX 200 VIX; ASX Small Ordinaries; the four major banks' share prices | Yahoo (and EODHD only if quota arithmetic allows) |
| Link | AUD/CNY (already on the FX board) | existing Frankfurter data |

## Milestones

### M5.1 ABS verification and fixtures
1. Use the ABS SDMX structure endpoints to confirm each dataflow id, dimensions and series key for every ABS candidate. Record the exact REST URLs (the CPI URLs in the existing code are the pattern). Save a sample response per series as a fixture; confirm units, frequency, latest period and the `asOf` mapping (quarterly periods like `2026-Q2`).
2. Confirm the release calendar (next release dates) from the ABS release calendar page for each series; these feed M5.5.
3. For indices, run a **symbol probe**: for each candidate Yahoo symbol fetch the last 30 days from the Worker-egress path (or locally, then re-probe from egress) and record: found or not, last date, number of points, plausibility vs the known ASX 200 level. **Keep only symbols that return complete, fresh, plausible data.** EODHD: only add if the free-plan quota arithmetic is proven (current calls per day + new calls <= 20 with margin); otherwise use the Yahoo path only (L2, owner-accepted).
4. Update `VERIFIED-SOURCES.md` with the confirmed ids and the symbol probe table.

Acceptance: every ABS series and every index symbol is verified or rejected with evidence.

### M5.2 Australian macro indicators
1. Add (only verified ones) `au-gdp-growth`, `au-trade-balance`, `au-retail-sales`, `au-building-approvals`, `au-population-growth` (with net overseas migration shown as a secondary value), `au-participation`, `au-underemployment`. Via the `abs` provider in the new rung (do not touch `main`).
2. Fail-closed parsers, fixtures, tests, correct `maxAge` (quarterly 120 days, monthly 45 days per RULES §6, with release-aware overrides where the existing definitions use them).
3. Context-only (G-5). Provide the Australian explanation first in Layer-1 copy.

Acceptance: each id on production matches the ABS table for the same period (spot check); no new subrequests on `main`.

### M5.3 Australian gauges
1. New gauge `au-activity` ("Is the economy growing?"): GDP, retail, building approvals, population growth, participation, underemployment as context members.
2. New gauge `au-external` ("How is Australia's trade and China link?"): existing `terms-of-trade`, `iron-ore`, plus S4's `coal-aus` and `lng-japan` (if S4 is done; otherwise add placeholders only if the ids exist), `au-trade-balance`, AUD/CNY. Check `connections.ts` for the existing `iron-ore` relationship and add one for coal/LNG.
3. Both gauges show "not scored yet" in plain words until S6 promotion. Do not change the Australia summary counts.
4. Tests for gauge membership and the shadow-state label.

Acceptance: gauges render with fixtures and on production; Australia summary counts unchanged.

### M5.4 Australian markets board
1. Add `packages/insights/src/markets/au-definitions.ts` (separate from `MARKETS`) listing only the **probe-verified** indices. Each entry: id, display name (EN + fa), group, provider symbols.
2. New ingest step in the **markets worker** (`apps/markets`) or a rung in api, choosing the one that does not break either budget; reuse the existing markets pipeline (snapshot shape, 52-week-high logic, "exchange open/closed" logic) so the new board behaves like the world board. Store under a new key `insights:markets-au:v1`.
3. Public endpoint `GET /api/insights/markets-au` (one KV read, same protections as `/api/insights/markets`).
4. UI: an "Australian markets" block inside the Australia region, using the same tile/table components as the world board: broad indices first (ASX 200 is already on the world board; show it here as the anchor), then sectors with their day, 1-week, 1-month, 1-year changes and distance from the 52-week high; the four banks; ASX 200 VIX. A one-line plain-language summary ("Which parts of the Australian market are leading or lagging") generated from data, EN + fa. Closed-market and stale handling identical to the world board.
5. Do not touch the 16 world indices.

Acceptance: board live in EN and fa with only verified symbols; quota arithmetic documented; world board unchanged (diff of its snapshot shape and a visual check).

### M5.5 "What it means for my money" and calendar
1. Extend the "What it means for my money" panel (Australia) only where a new indicator adds a clear everyday link (for example building approvals and rents, population growth and housing). Follow the existing item pattern and wording rules.
2. Add ABS release dates for the new series to `data/insights-calendar.json` / `insights-release-schedule.json` (verified from the ABS release calendar, not guessed).

Acceptance: calendar shows the new releases; panel text passes the wording validators (T-07/T-19).

### M5.6 UI, copy, docs and deploy close
1. Layer-1 copy (EN + fa) for every new id and the new gauges and board; glossary: "underemployment", "participation rate", "net overseas migration", "building approvals", "sector index", "A-REIT". `pnpm copy:audit` flow; narrator vocabulary and (if the narrator states the Australia region) the Australia state.
2. Docs: `AGENTS.md` (new indicator rows; markets-au board section), `INDICATORS_AND_DATA_SOURCES.md`, method cards, CHANGELOG, `registry:generate`.
3. Deploy (api + markets if changed) and verify; update PROGRESS.md (G8, G9), session log, and print the S6 prompt.

## Risks

- A Yahoo symbol disappears or changes: the board must show "can't tell right now" for that row only.
- EODHD quota: do not exceed; prefer Yahoo.
- Do not add Australian indices to the existing `MARKETS` array (it would change the world map and counts).
