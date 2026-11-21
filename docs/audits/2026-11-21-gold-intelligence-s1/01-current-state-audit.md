# Gold Intelligence & Visual Explanation — Session 1: Current-State and Evidence Audit

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

**Program:** Gold Intelligence & Visual Explanation Upgrade (15 sessions) — the follow-up to the completed nine-session Gold UX redesign (`docs/gold-redesign/`, closed 2026-11-2x).
**Session:** 1 of 15 — Current-state and evidence audit (`01-GOLD_INTELLIGENCE_AND_VISUAL_EXPLANATION_UPGRADE.md` §15 S1; `04-AGENT_EXECUTION_PROMPT.md` §8 S1).
**Mode:** Audit only. No redesign implementation, no production code change, no financial-model surface touched, nothing deployed.
**Date:** 2026-11-21
**Audited surface:** `https://currena.ir/gold` (live production) + the `main` branch source at `bead3ff2` (merged with the S1 filing branch `docs/gold-intelligence-s1-filing`, docs-only).
**Companion deliverables:** `02-metric-and-module-inventory.md` · `03-spec-vs-code-matrix.md` · `04-comprehension-gap-audit.md` · `baseline-screenshots/` (+ `fetch-audit.json`) · the programme `DECISION_LOG.md` (`docs/specs/gold-intelligence-visual-explanation/`).

---

## 1. Executive summary

The `/gold` page today is the **finished artefact of the nine-session GUX redesign**: briefing-first hero (price + BriefingCard + one CompositionStack), sticky seven-chip section nav, a five-force overview over the 37 seats, one canonical record sheet, a 25-record relationship explorer, and honest states everywhere. It is honest, bilingual, fast, and free of rendering defects. **The GUX programme solved the hierarchy problems it was given** (the balance verdict's six competing summaries are gone; CFTC is down to role-distinct surfaces; the outlook is honestly caveated).

What remains is exactly the gap this new programme names: **the page explains the market's *state* well, but it does not yet explain the market's *mechanics* to a normally educated visitor.** The GUX programme's own records state the boundary plainly (report 17: "a genuine forward-looking outlook does not exist"; S4's visual system: RangeBand is the dominant family; the GPE-S2 audit's recorded drift: "the page relied too heavily on historical ranges"). Concretely, today:

1. **The briefing layer exists and works** (15-second test passes structurally — headline, five-state word, counts, up to three reasons, what-could-change, evidence word, caveat). But its "reasons" are one-line seat verdicts ("Real yields (inflation-adjusted) — Pressures gold"), not explanations of *why* the force matters or *how* it works.
2. **No forward-looking outlook exists.** The BriefingCard's outlook container renders the five-state **current-conditions** word only; the Q2 horizon/scenario slots render nothing (the owner's standing answer: no horizon until a validated method exists). The 1–3-month and 1–2-week horizons the new spec requires are **unbuilt and method-gated** — S2 of this programme must decide what is honestly publishable.
3. **The supporting-visuals layer is thin.** One mechanism visual exists (the yield-decomposition card, V2 family). The dollar, inflation-expectations, stress, stock-vs-flow and positioning concepts have **no mechanism/decomposition visuals** — they render as seat verdicts, LaneBars, range bands and position charts. The spec's repeated diagnosis ("range markers answer *where*, not *what/why/how*") is accurate for the current default journey.
4. **The Roots layer is strong.** All 52 indicators (37 voters + 11 context + 4 blocked) plus ~16 modules are present, fresh-stamped, source-named, and reachable through the record sheet's three tiers. The professional evidence path is the healthiest of the three layers.
5. **Scale:** 17,331 px tall at 1440 desktop (16,191 px fa), 26,399 px at 390 mobile (en). 37 seat cards + 13 context cards + 2 position cards + ~16 module surfaces; 23 collapsed-by-default affordances; 7 nav chips. The full load makes **17 requests, all first-party**; the only non-200 is `gold-episodes`' designed 503 (the WGC-workbook waiting state).

The engineering baseline is green: live production is **byte-identical** to the current tree's build (entry, CSS and GoldPage chunk all `cmp`-clean), zero console/page errors, GoldPage budget 223.66/50.13 kB against 240/55.50 ceilings.

---

## 2. Method and evidence base

| Evidence | How captured |
|---|---|
| Live deploy ↔ source | Byte-comparison of the three served assets (`index-Dk-QJO9M.js`, `index-DqoA_iWG.css`, `GoldPage-Cef859tD.js`) against a fresh `pnpm --filter @currena/web build` — all three identical (the S1-GUX §3 method) |
| Screenshots | 28 files in `baseline-screenshots/` — en/fa × 1440/390 × light/dark + 4 expanded interaction states, via the committed harness `apps/web/visual/gie-s1-live.config.ts` + `gie-s1-screenshots.plw.ts` (the gux-s9-live pattern, read-only) |
| Live-state + network record | `fetch-audit.json` — 17 first-party requests, the console census, the DOM census (seats/lanes/cards/nav), the first-viewport text |
| Visual analysis | VLM reviews (z-ai vision) of the EN hero, the EN full page, the fa RTL full page, and the mobile full page; every claim used below was cross-checked against the DOM record or source |
| Source audit | Full trace of `apps/web/src/features/gold/**` (24,783 lines incl. tests) — GoldPage render order, gold-tiles derivations, BriefingCard + gold-briefing rules, the engine (`GOLD_LANE_VOTERS` 37 = 7/7/11/10/2, polarity 19+/18−, `goldBalance`, `outlook-core`, `outlook-five-state`), the content module (37 brief + 52 deep records, both locales), the placement table, the two price feeds |
| Live API | `GET /api/insights/pages/gold` (48 readings, `pricesAsOf` 13:13 UTC), `GET /api/insights` (183 readings, 24 calendar events), the 8 gold-family planes (expectations/premium/crosses/cb/lbma/ohlc/ifbought/episodes) |
| Engine verification | The live projection re-derived through the engine locally (`goldBalance` → net −2, 1 for · 3 against · 1 neutral; `goldOutlookOf` → `bearish`; `fiveStateOf` → `moderately-pressure`) — matching the rendered page exactly |

What could **not** be tested (stated per the spec's evidence standard):

- **Tablet width (768/1024)** — not captured this session (the spec's matrix adds it at S5/S6; the GUX S8 checks hold it green).
- **Screen-reader (NVDA/VoiceOver) pass** — the standing headless-sandbox limit (the S9 record's own honesty); the S8 live-region and aria-modal suites remain the proxy.
- **Human comprehension testing** — not S1 scope (S14's dedicated session).
- **The meter time machine's historical states** — probed the API (`/api/insights/gold-meter?date=` 200, `tableVersion gf-s10-37`); the full historical walkthrough is S2/S4 material.

---

## 3. Deployment ↔ source verification

- **Live:** `https://currena.ir/gold` serves the S10-close tree: entry `index-Dk-QJO9M.js`, CSS `index-DqoA_iWG.css`, GoldPage chunk `GoldPage-Cef859tD.js` — **all three byte-identical** to the fresh build of this session's tree (which adds only docs + the harness files, no runtime code).
- **`origin/main`:** `bead3ff2` (the S10 Q3-A close, "Add files via upload" — the GUX programme's final state). The S1 filing branch adds docs only.
- **Deploy-lock (D-43, read-only):** no deploy was attempted (docs-only session, per `04-AGENT_EXECUTION_PROMPT.md` §9: "Docs-only/audit-only sessions do not deploy"). Production remains the S10 deploy `41c8a56f`-lineage (the DEPLOY.md record's active version).
- **The gold-family KV inventory** (per AGENTS.md §11): all 8 planes answered — expectations 200 (Polymarket, December Fed decision), premium 200 (26 days, latest 2026-11-20), crosses 200, cb 200 (asOf 2026-10), lbma 200 (vault 2026-10, clearing 2026-09), ohlc 200 (362 bars, 2025-11-19 → 2026-11-20), ifbought 200 (gold/silver/btc/sp500), **episodes 503** (the designed WGC-workbook waiting state — the standing owner-side lever).

---

## 4. The separate inventories (the spec's §2 core demand)

The new spec's §2/§4 insists the counts below are **different things** and must never be conflated. They were derived independently — the engine table, the placement table, and the live DOM census — and they reconcile exactly. Full detail: `02-metric-and-module-inventory.md`.

| Inventory | Count | Source of truth |
|---|---|---|
| Unique canonical metric IDs on `/gold` | **52** (37 voters + 11 context + 4 blocked-absent) | placement table + `GOLD_RECORD_IDS` + the projection (48 present + 4 `absentIds`) |
| Balance-model voters | **37** (borrowing-costs 7 · dollar 7 · stress 11 · inflation 10 · flows 2; polarity 19 supporting-side +1, 18 pressure-side −1) | `GOLD_LANE_VOTERS` (engine, verified by direct import) |
| Context-only measurements (non-voter, rendered) | **11** (gold-silver is both a voter AND a context card — the one dual-role id) | `GOLD_CONTEXT_IDS` / placement `ratios`+`flows-positioning` |
| Licence/source-blocked absentees | **4** (wgc-etf-holdings · wgc-cb-demand · official-gold-demand · etf-short-interest) | `BLOCKED_NOTES` + live `absentIds` |
| Non-indicator modules | **~16** (narrative, yield-decomposition, on-ramp, expectations, bridge ×2, signals, time machine, TA, CB tracker, London vault, correlation, forecast retrospective, episodes, if-bought, publication notes, record sheet) | GoldPage render order |
| Price/technical series | **3** (live GC=F overlay, EODHD XAUUSD.FOREX daily OHLC 362 bars, the TA DMAs/pivots derived from it) | prices engine + xau-ohlc |
| Repeated presentations of one canonical metric | **by-design set** (CFTC ×3 role-distinct, real-yield-10y ×3 additive, gold-usd ×3 designed, lane state via ONE LaneBar renderer) | the S9 census + this session's DOM census (zero uncontrolled duplicates) |
| Visitor-facing groups | **5 lanes** (audience labels: Interest rates & borrowing costs · The US dollar · Market stress & uncertainty · Inflation & inflation expectations · Trader positioning & flows) + 7 nav chips | `goldSeatLanes` + GoldSectionNav |
| Relationship records | **25** (M 14 · C 10 · X 1 · K 0; R-26 blocked, legend-only) | `GOLD_RELATIONSHIPS` |
| The "37+" of the new spec | **The page's own 37 voters** (the spec's "37+ indicators" = the 37-seat meter; the wider page shows 52 unique metrics) | reconciliation above |

**Live market state at capture** (the engine re-derivation, matching the rendered page): net −2 · readable 5 · **1 for · 3 against · 1 not leaning** (borrowing-costs/dollar/inflation against, stress for, flows neutral) · outlook `bearish` → five-state **"Conditions moderately pressure gold"** · US$3,539 · −8.94% 7d · −12.84% 30d · top-12% of 10y. Seat-level: 13 firing (5 supports · 8 pressures), 23 steady, 1 unread (us-japan-10y-gap, rule-driven).

**Data freshness distribution** (the 48 present readings): 4 today · 17 yesterday · 3 Nov-19 · 1 Nov-18 · 2 Nov-17 · 1 Nov-16 · 5 Nov-13 · 11 month-stamped (Oct-01: monthly cadence) · 3 Sep-01 (monthly) · 1 Jun-30 (quarterly COFER). All within their cadence/staleAfterDays rules (the summary's own stale census: 1 stale voter insights-wide, none gold-page-side). Prices as-of 13:13 UTC — the hourly GC=F rung live.

---

## 5. The three-layer map (Flower / Leaves / Roots vs the current page)

The new programme's mandatory architecture, mapped onto what renders today:

| Layer (the spec) | Current state | Coverage |
|---|---|---|
| **BRIEFING — Flower and Fruit** | The hero: price block + BriefingCard (headline, five-state current-conditions word, counts, ≤3 reasons, what-could-change, evidence word, caveat) + CompositionStack (verdict → instrument → 5 LaneBars → ledger → caveat) | **~70%**: the current-conditions briefing is strong; the **separate forward-looking outlook (1–3m primary, 1–2w secondary) does not exist** (Q2-gated); recent movement is shown but not narrated as its own idea |
| **SUPPORTING VISUALS — Leaves and Tree** | Zone D (narrative + yield-decomposition + on-ramp + expectations) + LaneBars + the explorer | **~25%**: one mechanism visual (yield decomposition); the narrative is state-focused; no dollar-strength, inflation-expectations, stress-progression, stock-vs-flow or positioning *mechanism* visuals; the on-ramp is a collapsed education accordion, not an integrated explanation layer |
| **EXPERT CARDS AND NUMERICAL DATA — Roots** | 13 context cards + 37 seat cards + record sheet (3 tiers, both locales) + positions bars + the 8 planes + publication notes | **~90%**: complete, source-named, freshness-stamped, progressive-disclosure; the one gap vs the spec: no per-card back-link from a briefing claim to its root record (the reasons link to the record popover — the path exists but is one-way from the card, not claim-anchored) |

The direction of travel the spec demands (evidence flows upward, visitor drills downward) is architecturally present — every surface reads the same projection and the same engines (the D-48 one-truth rule). What is missing is the **middle layer's content**: the concept visuals and mechanism explanations that would let a visitor understand *why* the highlighted forces matter.

---

## 6. Findings (F-01…F-12)

Each finding: severity (high/medium/low for the new programme's goals) · evidence · what it means for S2+.

**F-01 — No forward-looking outlook exists (HIGH, approval-gated).** The BriefingCard's outlook slots render nothing (the owner's Q2 standing answer: no horizon/scenario until a validated method). The page's only "outlook" is the five-state current-conditions word (`fiveStateOf(goldOutlookOf(...))`), correctly caveated "this describes current conditions, not a forecast". The new spec's primary horizon (1–3 months) requires an evidence/method review (S2) and, if any method touches the engine, owner approval. The backtest record (`GOLD_BACKTEST_SPEC`, the measured no-edge result) is the honest starting point — S2 must decide what is *publishable*, which may be a structured forward-looking **evidence assessment** rather than a forecast (the main spec §5.2's own fallback).

**F-02 — The briefing's "reasons" are verdicts, not explanations (HIGH).** The BriefingCard renders up to three firing voters (`briefingReasonsOf`: one per lane, firing-count order) as name + impact word + the one-line plainLabel copy. The VLM hero review caught it precisely: "real yields (inflation-adjusted)… opaque to a non-financial visitor despite the explanatory sentences, which require reading past the 15-second window". The reason rows open the record popover (the evidence path exists), but the default text does not explain the **mechanism** (why high real yields pressure gold). This is the briefing layer's main content gap.

**F-03 — One mechanism visual exists; the spec's required set is unbuilt (HIGH).** `GoldYieldDecomposition` (V2 family: nominal = real + breakeven, the moved block, three named configurations) is the only concept-decomposition visual on the page. The prototype plan's P2 (integrated forces — the LaneBars are a stance summary, not a mechanism map), P4 (dollar strength), P5 (stock vs flow — the CB tracker and London vault render stock/flow data but without the distinction visual), P6 (positioning — the Positions bars show *where*, not *who/what long-short means*) have no equivalents. The TA band (V9 family) and the correlation chart (a relationship companion) are the only other chart families beyond ranges/sparks.

**F-04 — The default journey still surfaces the 37-seat wall (MEDIUM).** The five-force overview improved it (LaneBars over closed member cards), but the seats section remains 37 always-visible cards in five lane groups — the spec's "the visitor must not be confronted with 37+ equal-weight cards in the default journey". The GUX programme deliberately kept all seats visible (the owner's decision-7 "one combined overview, followed by five expandable/detail groups" — executed as overview + visible groups). Whether the member cards become expandable-by-default is an **owner-visible product change** (S3's architecture decision, presented at S6).

**F-05 — The on-ramp is education, not explanation (MEDIUM).** `GoldOnRamp` ("What moves gold") is a collapsed accordion below the narrative — five driver explainers + FAQ. The spec's supporting-visuals layer wants the explanation **integrated beside the forces it explains**, not one collapsed accordion. Content is strong (the S3/S5 bilingual records); placement and form are the gaps.

**F-06 — Iran bridge placement already matches the spec (RESOLVED-BY-DESIGN).** The bridge renders as the clearly-chipped regional chapter (Zone F, "Regional market · Tehran · Toman"), compact by default — exactly the new spec's §12 "Iranian market… clearly separate regional section near the bottom" (it sits above Signals rather than the very bottom, per the GUX programme's own locked decision; no action needed unless S3 revisits order).

**F-07 — The explorer is list-first and honest, but not integrated with the forces (MEDIUM).** The 25-record relationship explorer renders M/C/X/K classes with the honesty footer — but as a standalone advanced section, not connected to the briefing's highlighted forces. The spec's §6.2 wants "how it relates to gold" visible from each major visual; the connection points (the on-ramp closes, the lane drills) link to lanes, not to relationship records.

**F-08 — Duplicate presentations are controlled (LOW).** The S9 census + this session's DOM census: 37 seats, 13 context cards, gold-usd absent from cards (F-06-GUX held), ONE balance instrument, one LaneBar renderer. The remaining "duplicates" are the by-design role-distinct set (CFTC seat+card+bar; real-yield seat+decomposition+correlation; gold-usd hero+footing+fact). The new spec's "no duplicate primary presentation" is satisfied; the Roots layer just needs the claim→record back-links (F-11).

**F-09 — Price instrument verification (RESOLVED, one nuance for S2).** Three gold-price surfaces, all honestly labelled at point of use: (1) the **hero's live value** = Yahoo **COMEX gold futures GC=F** (hourly rung, "Market closed · COMEX gold futures, New York" pill, the merge names the venue); (2) the **chart/TA series** = EODHD **XAUUSD.FOREX spot daily bars** (362 bars, ~1y free-tier depth); (3) the **context history legs** = gold-api XAU. The parent strategy's decision: "XAU/USD spot per troy ounce… Session 1 must verify the existing source". **Finding: the hero's live quote is front-month futures, not spot** — the recorded engineering rationale (futures basis typically < 1%, the free 24/5 venue) is sound, the label is honest, and the units match; the sparkline/percentiles ride the XAU spot history. This is a **documented discrepancy to carry into S2** (the main spec §4: "If the current feed/contract differs, document evidence and propose a safe correction; do not silently alter") — not a defect to fix silently.

**F-10 — The comprehension obstacles are known and specific (HIGH, the programme's reason to exist).** The VLM full-page review independently reproduced the spec's diagnosis: (1) jargon density without integrated scaffolding (term premium, breakeven, breadth, COT); (2) no prioritization inside the 37-seat grid — "a novice can't tell which tiles actually drove the conclusion" (the LaneBar tallies help; the seats themselves are co-equal); (3) the colour/tag language (supports/pressures) is consistent but never legend-taught in one place. Mobile adds: ~30+ screens of scroll, near-identical card templates, and tap-target/legend gaps the S8 programme partially closed. Full detail: `04-comprehension-gap-audit.md`.

**F-11 — Claim-to-evidence traceability is one-way (MEDIUM).** Every surface reads the same projection (one truth), and seat/context cards open the record sheet. But the **briefing's reason rows and the LaneBars do not anchor to the specific root records** that support them (the ledger link goes to the seats section, not to the three firing voters' own records). The spec's §2.4 ("a visitor must be able to trace an important briefing claim back to the visual and the numerical evidence") needs the explicit claim→visual→record chain (S3's schema).

**F-12 — Bundle headroom is generous for the first time (LOW, an enabler).** GoldPage 223.66/50.13 against 240/55.50 (~16.3 kB raw headroom) + the tail chunk 31.83/6.61 against 34/8.0 + the near-viewport lazy pattern (GoldTail, the explorer chunk) as the standing budget play. The S5 prototype work has room without a ceiling ask; the S10 close's ~2.3 kB shrink is the current baseline.

---

## 7. Risks and recommendations for S2+

1. **The outlook is the critical path** (S2): the evidence-method review must produce a publishability decision per horizon. The measured backtest record (no directional edge in the 21-voter table) argues for the honest fallback (a structured forward-looking **evidence assessment**, scenarios without probabilities) unless new validated method work is approved. Any engine-touching method needs the owner's explicit approval (the protected-surface rule).
2. **Do not relitigate the GUX programme's closed decisions** (the five lanes, the briefing-first hero, the record sheet, the collapsed-on-ramp) — build on them. The new programme's changes are additive layers (mechanism visuals, the outlook construct, claim links), not another teardown.
3. **The 37-seat visibility question (F-04) is the one place this programme visibly reverses a GUX-era choice** — present it as an explicit S3 decision with the comprehension trade-off, and let S6's rubric decide.
4. **The price-instrument nuance (F-09)**: keep the futures quote (honest label, sound rationale), but S2 should record the instrument semantics in the claim-to-evidence contract so the briefing never mixes "spot" language with the futures live quote.
5. **Bilingual copy**: every new explanation string is copy-audit-gated (the round-95 manifest discipline, 9,251 entries) — the S4 atlas must budget the manifest round.
6. **The headless-sandbox limits** (no NVDA/VoiceOver, no human participants) will recur at S13/S14 — record them honestly per the evidence standard; the owner runs the human test at S14 if participants are available.

---

## 8. Acceptance walk (the S1 exit criteria)

| The spec's S1 exit: "every current major section and unique metric is accounted for; unknowns are explicitly listed" | Status |
|---|---|
| Every major section accounted for | **Done** — the 13-block render order with file:line evidence (`02-metric-and-module-inventory.md` §1) |
| Every unique metric accounted for | **Done** — 52 canonical ids + 11 non-voter context + 4 blocked + 16 modules, reconciled across engine/placement/DOM (`02`) |
| Balance voters vs displayed metrics vs groups separated | **Done** — the §4 inventory table; no count conflation |
| Price instrument + feed verified | **Done** — the three surfaces, their venues, units, freshness (F-09) |
| Data freshness verified | **Done** — the as-of distribution, the hourly prices stamp, the cadence rules |
| Desktop/mobile + EN/fa captures | **Done** — 28 live screenshots, all machine-verified non-blank, dark pairs genuinely dark (RGB ≈ 25/33/43) |
| Spec-vs-code gap matrix | **Done** — `03-spec-vs-code-matrix.md` (requirement → current state → gap → owning session) |
| Comprehension gap audit | **Done** — `04-comprehension-gap-audit.md` (the 15s/1m/2m/3–5m walk over the live captures) |
| No implementation, no deploy | **Held** — docs + the read-only harness only; production untouched (byte-verified equal) |

**The audit's one-sentence answer to the programme's key question** ("Can a normally educated visitor understand what is happening to gold, whether the 1–3 month outlook is favourable, and which forces matter most — and can a professional trace the conclusions?"): **the first and last halves are largely yes (a strong conditions briefing; a complete evidence layer); the middle — the forward-looking outlook — does not exist yet, and the "which forces matter and why" step still requires the visitor to be their own analyst.**
