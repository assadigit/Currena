> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.
# Gold Visual Reference and Prototype Plan

**Companion to:** `GOLD_INTELLIGENCE_AND_VISUAL_EXPLANATION_UPGRADE.md` and `GOLD_VISUAL_EXPLANATION_ATLAS.md`  
**Purpose:** Require tangible visual proof before scaling the redesign across the Gold page.

---

## 1. Design intent

The desired experience is professional market intelligence with editorial data journalism: clear, sophisticated, visually distinctive and accessible to people without financial training.

The design is not:
- A specialist trading terminal as the default.
- A financial textbook.
- A wall of equal-weight cards.
- A collection of 37 identical range bars.
- A childish or cartoonish explainer.
- A decorative image-led page where the data is secondary or unverified.

The information hierarchy is:

1. **Briefing — Flower and Fruit:** the distilled market story.
2. **Supporting Visuals — Leaves and Tree:** the main mechanisms and forces that explain the story.
3. **Expert Cards and Numerical Data — Roots:** verifiable raw evidence and technical depth.

The metaphor is structural. Do not automatically turn it into a literal plant/tree graphic.

## 2. Prototype-first policy

Before implementing the full visual system, build representative working prototypes. The prototypes must use the repository's real UI stack and existing design conventions. Use current, schema-valid data where available. Where real readings are unavailable or unsuitable for prototype iteration, use clearly labelled fixtures; never present fixture values as live market data.

Prototypes must be working interface components, not merely written descriptions or static moodboards. Static reference boards and annotated screenshots are supporting artifacts, not substitutes for working prototypes.

Do not add a new charting or illustration dependency until the current stack and existing shared components have been audited. Prefer the repository's existing visualization tools and SVG/HTML/CSS for bespoke diagrams.

## 3. Required prototype set

### P1 — Unified Briefing (Flower/Fruit)

Must communicate:
- Current international gold price and recent movement.
- Current-conditions assessment (existing balance model).
- Separate 1–3 month forward outlook, if methodologically supported.
- Secondary 1–2 week outlook.
- Two or three leading reasons.
- The main uncertainty / what could change the outlook.

Test whether a first-time visitor can answer “what is happening?” in 15 seconds. Avoid multiple competing hero cards or repeated verdicts.

### P2 — Integrated Forces Visual (Tree/Leaves)

A single coherent composition that shows:
- The audience-facing themes/groups.
- Which forces support, pressure or leave the situation mixed/unknown.
- How the major forces connect to the gold assessment.
- A traceable path to the underlying metrics.

Use only existing defensible model outputs. Do not invent quantitative weights or make the size of a visual shape imply numeric contribution unless such a measure exists.

### P3 — Real-Yield Mechanism

Explain in plain language:
- What real yield means.
- How an inflation-adjusted bond return is conceptually derived.
- Why it can change the opportunity cost of holding non-yielding gold.
- The current reading and its period.
- Why the present reading is/n't important to the current gold story.

A decomposition/bridge plus a small historical chart is a candidate. Validate the actual series and calculation convention before drawing an equation.

### P4 — US Dollar Strength

Explain:
- What the selected dollar index/basket measures.
- Whether it is strengthening or weakening over a stated period.
- How dollar-denominated gold pricing can affect buyers using other currencies.
- The current index value and history.
- The conditional nature of the relationship.

A directional comparison and trend is a candidate. Name the actual index; do not use a generic “dollar strength” icon without a defined series.

### P5 — Institutional Demand / Stock vs Flow

Show the difference between:
- How much gold an institution/sector holds (stock).
- How much it added or sold during a period (flow).

Use a visual that makes this distinction immediately apparent. Explain reporting delay and coverage where relevant.

### P6 — Investor Positioning

Explain:
- Who is being measured.
- What long and short positions mean.
- Difference between gross longs, gross shorts and net positioning.
- Current position and historical movement.
- Why positioning is a sentiment/positioning measure rather than physical demand or a certain forecast.

### P7 — Root Evidence Card

Build a compact expert card/detail panel that lets a professional verify the visual:
- Exact numerical reading and unit.
- Timestamp and reference period.
- Source.
- Technical name and canonical ID.
- Historical context/methodology where supported.
- Data-quality state.
- Back-link to the relevant briefing/visual claim.

## 4. Visual design system requirements

The prototypes should establish:

- Typography hierarchy: headline, plain-language explanation, metric value, technical annotation.
- Spacing and grouping rules.
- Consistent support / pressure / mixed / unavailable semantics.
- Chart legend and axis patterns.
- How the UI explains what to look at.
- How values and units remain visible without dominating.
- How visual evidence links to the Roots layer.
- Desktop popovers/details and mobile bottom sheets.
- Expand/collapse patterns for secondary/advanced detail.
- Accessible keyboard, focus, touch, reduced-motion and screen-reader behavior.

Use colour as a supporting code, never as the sole signal. The visual direction may use an editorial palette, but status semantics must remain consistent and accessible.

## 5. Screenshot and viewport matrix

For each required prototype, capture and review:

- Desktop: at least 1440 × 900 and 1280 × 800.
- Mobile: at least 390 × 844 and a narrower 360px viewport.
- Tablet: one representative intermediate width.
- English LTR.
- Persian RTL.
- Light/dark themes if both are supported by the current application.
- Normal data, stale/missing data and loading/error states where relevant.

Record the page/commit, viewport, locale, theme, data fixture/source and capture date in screenshot metadata or the accompanying report.

## 6. Mandatory pre-implementation verification gates

The prototypes are a design exploration, not automatic permission to begin full production implementation. Two dedicated sessions must verify readiness.

### Gate A — product/design readiness

Before production implementation, the agent must:
- Map every requirement in the main spec and visual atlas to a prototype, UI element, interaction, content record or explicit limitation.
- Inspect every prototype in English LTR and Persian RTL, desktop and mobile. Record screenshots with viewport, locale, theme, fixture/source, commit and capture date.
- Check that the default experience communicates the main message without hover or expansion; interactions reveal evidence rather than hide the explanation.
- Check that Briefing, Supporting Visuals and Expert Cards/Numerical Data form one coherent hierarchy and never show competing or contradictory verdicts.
- Check that each visual explains the measure/mechanism and its qualified relationship to gold, not merely its historical percentile.
- Re-score prototypes using Section 7. A failed mandatory criterion requires redesign and retest.
- Freeze the accepted visual grammar, component families, information hierarchy, interaction patterns and known limitations.

**Gate A exit:** all critical design requirements have evidence; all mandatory prototypes score at least 14/16 and receive 2 on every starred criterion; no unresolved critical design ambiguity remains. Record a dedicated verification report. No production feature implementation begins before Gate A passes.

### Gate B — technical/data/test readiness

Before production implementation, the agent must:
- Verify source fields, canonical metric IDs, units, periods, timestamps, cadence, freshness and missing-data semantics required by every prototype.
- Verify that all claims and diagrams can be driven by real repository data or explicitly labelled demonstration fixtures.
- Confirm no new provider, recurring request, paid dependency, financial-model change or unsupported causal claim is required.
- Create a deterministic fixture catalogue for every market/data scenario in Section 9.
- Define expected visual output and expected interpretation for each fixture, including what must not appear.
- Define automated and manual checks for numerical consistency, component behavior, accessibility, localization, responsive layout, performance, regression and post-deployment smoke tests.
- Confirm test browser/tooling, CI gates, deployment lock and rollback steps.

**Gate B exit:** every production component has a verified data contract; every high-priority claim has a metric/evidence mapping; scenario fixtures and test procedures exist; all critical technical dependencies are resolved or explicitly approval-gated. No production feature implementation begins before both gates pass.

## 7. Prototype evaluation rubric

Score each prototype 0–2 per criterion: 0 = fails, 1 = partial, 2 = clear. A prototype should score at least 14/16 and must score 2 on the mandatory criteria marked ★ before the pattern is scaled.

| Criterion | What to check |
|---|---|
| ★ Immediate meaning | Can a non-specialist say what the graphic is communicating? |
| ★ Why it matters | Is its relationship to gold clear and correctly qualified? |
| ★ Evidence | Can a visitor identify the actual reading, unit and period? |
| ★ Traceability | Can a professional reach the underlying metric/source? |
| Visual hierarchy | Is the main message unmistakable? |
| Cognitive load | Does the graphic avoid too many labels, colours and competing values? |
| Responsive | Does the meaning survive mobile and desktop? |
| Locale/accessibility | Does it work in RTL/LTR and without colour/hover alone? |

Also run the same questions through a structured cognitive walkthrough:

1. In 15 seconds, what is happening to gold?
2. What is the outlook and for which period?
3. Which forces support or pressure gold?
4. Why does one selected force matter?
5. What information would you open to verify the claim?

If the evaluator must explain the chart verbally before the visitor understands it, the design has failed.

## 8. Visual references

Create a reference board for:
- Professional data journalism / editorial financial visualization.
- Yield decomposition and opportunity-cost explanations.
- Currency strength comparisons.
- Stock-vs-flow explanations.
- Long/short positioning.
- Scenario paths and uncertainty communication.
- Integrated multi-force diagrams.

References are directional only. Do not copy third-party layouts or brand identity. Record the design principle extracted from each reference rather than just collecting screenshots.

## 9. Cross-scenario test plan

The same design must remain legible and truthful across market scenarios, data failures, locales and viewports. Use deterministic fixtures or controllable mocks; never manipulate production data to create test conditions.

### 9.1 Market interpretation scenarios

| ID | Fixture/scenario | Expected behavior |
|---|---|---|
| MKT-01 | Broad support/upside conditions | Show supportive conditions only if existing evidence supports that conclusion; never imply a guaranteed rise. |
| MKT-02 | Broad pressure/downside conditions | Make headwinds clear without turning the assessment into an unsupported sell instruction. |
| MKT-03 | Mixed/contradictory forces | Communicate disagreement; do not force a false single verdict. |
| MKT-04 | Extreme/outlier metric value | Keep labels, marks and scales legible; prevent clipping and scale distortion. |
| MKT-05 | Gold price moves while macro indicators barely change | Keep observed price movement separate from macro conditions and forward outlook. |
| MKT-06 | Current conditions and forward outlook disagree | Keep the assessments distinct and explain the divergence. |
| MKT-07 | Short- and medium-term outlook differ | Label each horizon clearly; do not blend them into one ambiguous statement. |
| MKT-08 | Forecast method unavailable or unsupported | Do not fabricate outlook, magnitude, probability or scenario; use an honest fallback. |
| MKT-09 | Important driver unavailable while other evidence remains | Do not substitute zero/neutral; disclose reduced coverage and qualify conclusions. |

### 9.2 Data integrity and operational scenarios

| ID | Fixture/scenario | Expected behavior |
|---|---|---|
| DAT-01 | Fresh normal data | Values, units, periods and source timestamps reconcile with Roots evidence. |
| DAT-02 | Stale/delayed feed | Freshness is visible; stale data is not presented as current. |
| DAT-03 | One missing metric | Other valid content remains; missing metric is explicitly unavailable. |
| DAT-04 | Entire force/group unavailable | Never treat the group as neutral; disclose coverage limitations. |
| DAT-05 | Partial API response | Valid fields render; missing fields do not break the page or fabricate data. |
| DAT-06 | Provider timeout/error and recovery | Error state is clear; recovered values replace stale/error presentation correctly. |
| DAT-07 | Invalid, out-of-range, null, NaN or malformed value | Invalid value does not enter calculations or create a misleading visual mark. |
| DAT-08 | Unit/currency/period mismatch | Block or qualify comparison; never put incompatible measures on the same scale. |
| DAT-09 | Timezone/daylight/time-boundary difference | Observation time and local display time remain distinct and correctly labelled. |
| DAT-10 | Spot price market status/feed gap | Instrument identity, price timestamp and market status remain accurate. |

### 9.3 Presentation and interaction matrix

- Viewports: 1440×900, 1280×800, 1024×768, a representative tablet width, 390×844 and 360px-wide mobile.
- Locales: English LTR and Persian RTL, including long labels and mixed-script units/source names.
- Themes: all themes actually supported by the application.
- Data states: fresh, loading, stale, partial, missing, unavailable and error.
- Interaction states: default, expanded, collapsed, popover/sheet open, keyboard-only, touch and focus-visible.
- Accessibility: contrast, text resizing, semantic labels, screen-reader announcements, reduced motion and no color-only meaning.

Not every permutation must be tested if a pairwise/risk-based matrix gives equivalent coverage. Every failure class above must nevertheless be exercised and results recorded.

### 9.4 Evidence required for each test

For each scenario record: fixture ID, commit/build, route, viewport, locale, theme, expected output, actual output, screenshot or recording, automated test result, defect reference, retest result and pass/fail status.

A scenario passes only when both functional output and visual interpretation are correct. A component rendering without crashing is not sufficient.

## 10. Implementation notes

- Actual dynamic data graphics must be rendered from data and code; never use a generated raster image as a chart, measurement or evidence.
- SVG is suitable for crisp, responsive diagrams when it fits the current stack.
- Use existing components/helpers before introducing new dependencies.
- Keep data logic separate from visual presentation.
- Use fixtures for prototype states, but identify them visibly as examples.
- All graphical text must localize; do not bake English labels into SVG paths or static images.
- Keep technical values and chart axes correct in both LTR and RTL.

## 11. Autonomous progression rule

The agent should build, evaluate and refine these prototypes without requiring routine owner approval. It should pause only if the visual direction materially conflicts with the agreed product architecture, if the prototypes require a change to financial methodology/data contracts, or if a material and expensive-to-reverse decision cannot be resolved from the existing strategy.

If a prototype fails the rubric, revise it and retest before scaling. Do not ask the owner to approve a weak prototype merely to transfer responsibility.
