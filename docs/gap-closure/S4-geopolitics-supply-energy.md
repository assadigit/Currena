# S4 — Geopolitics, supply chain and energy

**Estimated length:** 3 to 4 hours. **Depends on:** S1. Read `00-OPERATING-RULES.md` first.

## Why

The owner follows geopolitical tension, but the only coverage today is one monthly
context row (`gpr-index`). On 2026-10-30 Brent was $117.64 (up about 20% in 30
days) and the GPR was up 20.6 points, yet nothing scores or explains it. This
session adds a dedicated global gauge **"Is the world getting more fragmented?"**
(working name) built from measured data, plus the energy links Australia depends on
(coal, LNG).

Wording rule (RULES §5): the page never explains a move by news events. Show
measurements and tendencies only.

All new items start context-only (G-5). The new gauge exists and renders, but its
members do not vote until S6.

## Candidates (unverified until M4.1)

| Group | Candidate | Source |
|---|---|---|
| Geopolitics | GPR country series (Taiwan, China, Russia, Ukraine, Israel, Saudi Arabia, Australia) and threats vs acts sub-indices | Existing GPR `.xls` already parsed (`gpr` provider) |
| Policy | Trade Policy Uncertainty index | policyuncertainty.com (same family as `epu-us`) |
| Chokepoints | Daily transit counts: Strait of Hormuz, Bab el-Mandeb, Suez Canal, Panama Canal, Strait of Malacca, Taiwan Strait (and others PortWatch carries) | IMF PortWatch ArcGIS (verified endpoint in VERIFIED-SOURCES) |
| Supply chain | NY Fed Global Supply Chain Pressure Index | NY Fed `.xls` (egress risk) |
| Energy supply | US Strategic Petroleum Reserve level; US crude production | Existing EIA route (`eia-crude-stocks` pattern) |
| Energy and Australia | Coal (Australian), LNG (Japan), natural gas (Europe) | World Bank Pink Sheet (existing `world-bank` provider, monthly) |

## Milestones

### M4.1 Verification and egress
1. Read the existing GPR parser and the stored `.xls`; list every column; confirm which country/sub-index columns exist (do not assume names). Check whether a daily file exists on the Caldara-Iacoviello site; if it does, note its URL, size and freshness.
2. Find the Trade Policy Uncertainty file on policyuncertainty.com; record URL/format/licence.
3. PortWatch: list the FeatureServer fields (transit counts by vessel type?), the chokepoint list and ids, latest date available, the record count per request, paging limits, and the licence/terms. Fetch a sample for each chokepoint of interest. Save fixtures.
4. GSCPI: read the S1 egress result for `newyorkfed.org`. If Worker egress is blocked (Akamai), do **not** circumvent: record it, and either use a different legitimate venue (scheduled GitHub Action writing through a narrow write path, if M1.2 allows) or reject it for now.
5. EIA series codes for SPR and crude production via the existing route; Pink Sheet column names for coal, LNG and natural gas Europe (read the current workbook).
6. Update `VERIFIED-SOURCES.md` for every candidate (verified/rejected with evidence).

Acceptance: a decision per candidate; fixtures saved; no guessed ids remain.

### M4.2 GPR country series and trade policy uncertainty
1. Extend the GPR adapter to emit extra readings from the **same file** (zero extra subrequests): `gpr-taiwan`, `gpr-china`, `gpr-russia`, `gpr-ukraine`, `gpr-israel`, `gpr-saudi`, `gpr-australia` (only those whose columns verified), and `gpr-threats` / `gpr-acts` if present. If a daily file exists and is reliable, add `gpr-daily` (7-day average) as the timely signal, with its own cadence and `maxAge`.
2. Add `tpu-us` (Trade Policy Uncertainty) following the `epu-us` pattern (first-of-month gate).
3. Tests with fixtures; percentile and z-score come from the existing machinery.

Acceptance: the new ids appear in `/api/insights`, context-only, with correct `asOf`; no new subrequest for the GPR extras.

### M4.3 Chokepoint transits
1. New provider `portwatch` (verify licence level and record). A `rung4` step fetches the last ~60 days for each chosen chokepoint (batched into the fewest subrequests; use `where` with an `IN` list and a date filter), computes: latest 7-day average transits, change vs the prior 4-week average, and vs the same weeks a year earlier if available.
2. Definitions: `chokepoint-hormuz`, `chokepoint-bab-el-mandeb`, `chokepoint-suez`, `chokepoint-panama`, `chokepoint-malacca`, `chokepoint-taiwan` (only those verified). Context cards showing transits per day (7-day average) and the change.
3. History: keep 400 days per chokepoint in one combined KV key (not one key per day). Validate the shape on write and on read.
4. Honest labelling: PortWatch estimates come from ship-tracking satellite data and are revised; show "estimate" and the data date; handle the ~few-day lag with `maxAge`.

Acceptance: six chokepoint cards live or a recorded rejection; a combined history key; subrequests and KV writes reported.

### M4.4 Supply chain and energy
1. `gscpi` (if M4.1 verified a legitimate venue), `us-spr` and `us-crude-production` (EIA, weekly), and `coal-aus`, `lng-japan`, `gas-europe` (Pink Sheet, monthly) added via the existing providers.
2. Pink Sheet items reuse the already-fetched workbook where possible (check the current `world-bank` adapter: do not add a second download).
3. Use consistent units in labels (USD per tonne, USD per MMBtu); state the unit on each card.

Acceptance: verified values match the source for the same month; units labelled; no extra subrequests for the Pink Sheet items.

### M4.5 New gauge and relationship cards
1. Add a new global gauge group (id for example `geo-fragmentation`) in `gauges.ts` containing the new ids as **context** members (no voters). The gauge header shows "not scored yet" in plain words until S6 (EN + fa), so it is honest that it is in shadow mode. Do not change the global summary counts.
2. Add 2 or 3 relationship cards to the "Together" section following the existing `connections.ts` pattern: (a) oil, geopolitical risk and chokepoint transits; (b) LNG/coal prices, Australia's terms of trade and the Australian dollar; (c) supply-chain pressure and inflation. Each card states a general tendency only, never a forecast, and a pass-through state when appropriate.
3. Tests for the gauge shape, the "not scored yet" state and the new connections.

Acceptance: gauge renders; summary counts unchanged; connections evaluate with fixtures.

### M4.6 UI, copy, docs and deploy close
1. Layer-1 copy (EN + fa) for every new id; glossary: "chokepoint", "transit", "supply chain pressure", "geopolitical risk index", "trade policy uncertainty", "strategic reserve", "LNG". `pnpm copy:audit` flow; narrator vocabulary update.
2. Show the Australian angle first where it applies (RULES §7): Hormuz and LNG/coal for Australian energy exporters and fuel prices; Malacca and Taiwan Strait for Australian trade routes; state as tendencies.
3. Docs: `AGENTS.md`, `INDICATORS_AND_DATA_SOURCES.md` (counts), method cards in `SCRAPING_SPEC.md`, CHANGELOG, `registry:generate`.
4. Deploy and verify (rules §3); update PROGRESS.md (G6, G7), session log, and print the S5 prompt.

## Risks

- GPR column names differ from expectations: adapt to what the file actually contains; drop what is missing.
- PortWatch API changes or throttling: fail closed; cache in KV; descriptive User-Agent; one batched request per rung.
- GSCPI egress block: reject rather than circumvent.
