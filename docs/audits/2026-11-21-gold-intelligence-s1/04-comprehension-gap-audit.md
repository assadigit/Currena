# GIE-S1 — The comprehension gap audit (the 15-second → 5-minute walk)

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

Method: the programme's acceptance questions (the main spec §13) walked over the **live** page (the 2026-11-21 captures + the recorded first-viewport text + the DOM census), cross-checked with four VLM reviews (the EN hero, the EN full page, the fa RTL full page, the mobile full page). Every claim below traces to a capture, the fetch-audit record, or a VLM read that was itself cross-checked.

The live state at capture: verdict "Gold: conditions lean against it" · "Conditions moderately pressure gold · 1 for · 3 against · 1 not leaning" · US$3,539 · −8.94% 7d · stress lane for · borrowing/dollar/inflation against · flows neutral.

---

## 1. The 15-second test — "what is happening to gold, and the current price?"

**Verdict: PASS for current conditions; the price is found instantly.**

What the first viewport shows (recorded): the price block (US$3,539, −8.94% 7d, the sparkline, "top 12% of the last 10 years", as-of chip, market pill) beside the BRIEFING card ("Gold: conditions lean against it" · the five-state word · the counts · the caveat · the Why rows). The VLM hero review: "a first-time visitor gets the core answer quickly… the headline states the verdict plainly… the disclaimer prevents misreading."

**The gaps inside the pass:**
- **Three different red numbers** compete in the price block (−8.94% 7d · −23.9% over the spark window · −12.84% 30d context) — the VLM flagged the unclear hierarchy. A visitor cannot tell which number is "the" move.
- The **"Why" rows are verdicts, not reasons**: "Real yields (inflation-adjusted) — Pressures gold" tells the *what*, not the *why* (F-02). The one-line copy ("What a 10-year US government bond really earns after expected inflation…") is present but secondary and requires opening/reading beyond 15 seconds.
- The stress-lane reason is **apparently contradictory** at a glance (the VLM: "elevated stress *feeds* gold's bid yet is labeled 'Pressures gold'" — the stress-stlfsi seat pressures while the lane supports) — a mechanism explanation would dissolve this, a verdict label cannot.

## 2. The one-minute test — "the primary short-to-medium-term outlook and its uncertainty"

**Verdict: FAIL — the product does not exist.**

There is no forward-looking statement anywhere on the page. The five-state word is current conditions (correctly caveated). The Q2-gated outlook slots render nothing. A visitor asking "is the next 1–3 months favourable?" receives silence — honest silence, but silence. This is the single largest gap and the programme's critical path (S2).

## 3. The two-minute test — "the two or three most relevant forces"

**Verdict: PARTIAL — identifiable, but not explainable.**

The briefing names ≤3 firing drivers; the CompositionStack's five LaneBars show which lanes lean which way (with tallies). A visitor can **name** the forces. But:
- **No mechanism**: why does a high real yield pressure gold? The on-ramp's explainers exist but are collapsed one screen below and not connected to the highlighted drivers (F-05).
- **No prioritization inside the seats**: the 37 cards are visually co-equal; the VLM full-page review: "a novice can't tell which of ~30 tiles actually drove the conclusion." The LaneBar tallies help at the lane level; the member level is flat (F-04).
- **The colour/tag language is never legend-taught**: supports/pressures is consistent but no one place teaches it (the VLM's third obstacle).

## 4. The three-to-five-minute test — "why those forces matter, and what could change the outlook"

**Verdict: PARTIAL — the materials exist; the integration does not.**

A determined visitor finds: the on-ramp's five driver explainers + FAQ (collapsed), the yield-decomposition card (the one mechanism visual), the 25-record relationship explorer with evidence classes, the record sheet's expanded tiers, the "what could change this" line (the narrowest firing lane). This is genuinely strong material — the S3-GUX content foundation. But it is **self-service**: nothing in the briefing's reason rows links to the on-ramp's explanation of that force; the explorer is not reachable from the forces; the "what could change this" names a lane, not a condition in ordinary words. The visitor must be their own analyst to assemble the story.

## 5. The professional's test — "trace the conclusions to the numerical evidence"

**Verdict: PASS.** Every surface reads the same projection; the seat cards open the record sheet (value, unit, as-of, source, history, rule); the seat chips link to the metric's home card on its owning page (`#usa-card-real-yield-10y` etc.); the licence wall and absent count are honest; the engine re-derivation matches the render byte-for-byte (this session's own verification). The one refinement: the briefing's reason rows should anchor to their records directly (F-11).

## 6. Locale, theme and responsive observations (from the captures + VLM)

- **fa RTL**: correctly mirrored (nav, headings, meters; charts deliberately LTR per the axis settlement); Persian renders cleanly (ligatures, ZWNJ, Persian digits). The VLM's notes: mixed-digit conventions between charts (Latin) and body (Persian) are the documented house convention but read as inconsistent to a newcomer; a few stray Latin fragments near the top of the page (brand/metal tickers) ride the bidi rules.
- **Mobile 390**: the briefing-first order holds; the VLM's diagnosis — "mostly squeezed desktop… a long linear dump… no sticky in-page navigation to jump" — is **partially stale**: the sticky 7-chip nav DOES exist (the S8 one-row scroller, visible in capture 33), but the rest is fair: ~30+ screens of scroll, near-identical card templates, "Open indicator" links below the 44px touch floor standard (the S8 exemption for inline links), dense caption text. The mobile journey needs the briefing + a concise force overview before the long tail (the parent strategy's own mobile hierarchy, only partly realized).
- **Dark theme**: correct (avg RGB ≈ 25/33/43 on the dark captures; the S8-D3 real-key discipline held).

## 7. The gap list, prioritized (the programme's backlog input)

| # | Gap | Layer | Owning session |
|---|---|---|---|
| G-1 | No forward-looking outlook (any horizon) | Briefing | S2 → S8 |
| G-2 | Briefing reasons are verdicts without mechanisms | Briefing | S3/S8 (copy) + S5 (visuals) |
| G-3 | No concept visuals for dollar / inflation expectations / stress / stock-vs-flow / positioning | Supporting | S5 |
| G-4 | The 37-seat wall in the default journey (no member-level prioritization) | Supporting | S3 (decision) → S9 |
| G-5 | The on-ramp not integrated with the highlighted forces | Supporting | S3/S9 |
| G-6 | No taught legend for the supports/pressures language | All | S3/S9 |
| G-7 | Price-block number hierarchy (three competing change figures) | Briefing | S3/S8 |
| G-8 | Claim→visual→record anchor chain one-way | Traceability | S3 (schema) → S10 |
| G-9 | Mobile long-tail journey (the scroller exists; the compression does not) | Responsive | S9/S13 |
| G-10 | The stress-lane apparent contradiction (needs the mechanism sentence) | Briefing copy | S8 |

## 8. What NOT to change (the strengths the audit confirms)

The briefing-first hero, the one-instrument rule, the five-state word + caveat, the LaneBar family, the record sheet, the relationship explorer's honesty classes, the honest waiting states, the bilingual discipline, the zero-error engineering baseline. The GUX programme's architecture is the foundation this programme builds on — the gaps are additive layers, not teardowns.
