> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.
# Gold Intelligence & Visual Explanation Upgrade

**Repository:** https://github.com/assadigit/Currena  
**Page:** https://currena.ir/gold  
**Parent strategy:** `CURRENA_GOLD_UX_STRATEGY_AND_PHASED_PLAN.md`  
**Status:** Owner-approved follow-up programme; audit-first; verification-gated; implementation split into small sequential sessions.  
**Primary objective:** Turn Currena Gold from an impressive information display into a gold-market briefing that ordinary, normally educated visitors can understand, while preserving a verifiable expert evidence layer.

---

## 1. The product problem

The owner has shown the current Gold page to several people. Their visible reaction is often “wow” because the page contains substantial information, indicators, charts, cards and technical detail. But that reaction does not establish comprehension. Visitors may scroll through the page, recognize that it is sophisticated, and still be unable to explain:

1. What is happening in the gold market now?
2. Is the short-to-medium-term outlook favourable, unfavourable or uncertain?
3. Which forces matter most to the current assessment?
4. Why do those forces matter to gold?
5. What could change the outlook?

This is the actual product gap. The project must not optimize for the number of indicators displayed, the number of charts shipped, the amount of text written, or how sophisticated the page looks. It must optimize for user understanding, traceable evidence and honest uncertainty.

**The 37+ indicators and expert cards are not the product. Understanding the gold market is the product.** The exact current count must be verified from the current Gold module and its data sources; do not hard-code an old count from previous audits.

## 2. Owner-approved information architecture: Flower / Tree / Roots

The owner has explicitly described the intended structure as:

1. **BRIEFING — “Flower and Fruit”**
2. **SUPPORTING VISUALS — “Leaves and Tree”**
3. **CARDS FOR EXPERTS AND NUMERICAL DATA — “Roots”**

Treat this as the primary information architecture and content hierarchy. The plant analogy is a way to reason about the layers; do not automatically draw a literal flower/tree illustration in the interface. Only use the metaphor visually if it genuinely improves understanding.

### 2.1 Flower and Fruit — the briefing layer

This is the first and most important experience. It is the distilled result that the visitor came to find.

It must answer, with minimal reading:

- What is the current international gold price and recent movement?
- What do current conditions say about gold: supportive, mixed or pressuring?
- What is the separate short-to-medium-term outlook?
- What are the two or three most important reasons behind the assessment?
- What could change the outlook?

The briefing should combine a strong editorial headline, a concise explanation and a clear visual summary. It must not become a miniature financial terminal or a paragraph-heavy research note.

**Default hierarchy:**

1. One clear market headline/assessment.
2. Primary international spot gold price (XAU/USD per troy ounce), subject to verifying the actual instrument and feed in the repository.
3. Recent price movement, with timeframe and timestamp.
4. Current-conditions assessment from the existing gold-balance model, clearly labelled as current conditions.
5. Forward-looking outlook as a separate assessment. The primary horizon is 1–3 months; 1–2 weeks is secondary. A 6–12 month outlook is optional and only if evidence and method support it.
6. Two or three concise reasons that explain the main story, plus the most important risk/condition that could change it.
7. A direct path to supporting visuals and underlying evidence.

The exact desktop/mobile composition must be established through prototypes. Do not let a large balance graphic, price chart, several verdict chips and multiple summaries all compete as equal heroes.

### 2.2 Leaves and Tree — supporting visuals

This layer explains the briefing. It turns the underlying economic mechanisms and groups of indicators into a small number of clear, connected visual explanations.

It should help visitors understand:

- Which broad forces support gold and which put pressure on it.
- How those forces work in ordinary terms.
- How the most relevant forces interact.
- Why the highlighted drivers matter now.
- Where the current reading sits in a useful context.

The current model's canonical lanes/groups must be audited and preserved unless the owner approves a methodology change. If the best audience-facing presentation consolidates them into three or four broader themes, retain an explicit mapping from those themes to the model's original groups. Do not rename or merge the financial model itself as a UI shortcut.

The page should show a combined overview first, then reveal the relevant force explanations and supporting diagrams. The visitor must not be confronted with 37+ equal-weight cards in the default journey.

### 2.3 Roots — expert cards and numerical evidence

This layer is the evidence foundation. It is for visitors who want to verify the briefing and visuals, analysts, professionals and technically curious users.

It preserves access to:

- Every unique underlying indicator/measurement currently used on the Gold page.
- Actual numerical value, units, dates, observation period and freshness.
- Technical names and canonical IDs.
- Source, methodology, transformation and limitations.
- Historical time series, ranges, percentiles and other advanced context where valid.
- The relevant engine/model state and whether the metric votes, provides context, or belongs to another analytical module.

This information must be discoverable through expandable groups, detail panels, popovers or a dedicated advanced library. It must not dominate the first screen. It is not to be deleted merely because it is not visible by default.

### 2.4 Evidence must flow upward; visitor exploration flows downward

There are two directions:

- **Analytical/data direction:** source readings → canonical metrics → existing model outputs and evidence → supporting visual interpretation → briefing statement.
- **Visitor direction:** briefing → supporting visual explanations → expert cards/raw data/methodology.

A visitor must be able to trace an important briefing claim back to the visual and the numerical evidence that support it. The visual and raw card must not quietly use different readings, time windows, units or dates.

### 2.5 Decision provenance and working defaults

The owner explicitly approved the Flower/Fruit, Leaves/Tree and Roots hierarchy in the latest clarification. That hierarchy is locked unless the owner changes it. The previously recorded decisions in `CURRENA_GOLD_UX_STRATEGY_AND_PHASED_PLAN.md` also remain in force unless this follow-up specification explicitly refines them.

The latest visual-design question round established agreement with the overall direction and the three-layer structure, but did not separately select an option for every individual design question. Therefore, the recommendations in that round are **working defaults for prototyping**, not irreversible owner decisions. The agent should validate them against the audit and prototype comprehension tests, record reversible refinements in `docs/DECISIONS.md`, and continue autonomously. Ask the owner only when a decision materially changes the product promise, financial interpretation, data contract, or is expensive to reverse.

## 3. Product principles (non-negotiable)

1. **Comprehension over information volume.** Do not use “more cards”, “more charts” or “more words” as proxies for improvement.
2. **Brief first, explanation second, evidence third.** The default experience is a market briefing, not a course or terminal.
3. **Visual explanations must explain meaning.** A range marker shows where a number sits; it does not by itself explain what the metric measures or why it matters to gold.
4. **Concept-specific visualizations.** Rates, currency strength, inflation, market stress, stock, flow, positioning, ratios and price paths are different data concepts. Do not force them all into one generic range-bar template.
5. **One source of truth.** A briefing claim, supporting diagram and expert card must reconcile to the same canonical reading and its metadata.
6. **Progressive disclosure, not deletion.** Lower-priority material remains available in the Roots layer.
7. **Current conditions are not a forecast.** The existing gold-balance model must not be labelled as a forward prediction.
8. **Prominence is not causation.** An indicator highlighted because it is unusual/relevant is not automatically the cause of a price move or the strongest future predictor.
9. **No false precision.** Do not fabricate probabilities, contribution percentages, forecast ranges, price targets, confidence scores or causal claims.
10. **Financial integrity is protected.** UI refactors and visual composition can proceed. Changes to score logic, thresholds, voter tables, indicator weights, data sources, model interpretation or forecasting methodology are approval-gated.
11. **Global first.** XAU/USD global gold is the primary context. The Iranian market remains a clearly separate regional section near the bottom, with a compact introduction and expandable detail.
12. **Professionals remain served.** The simplified view must not erase numerical proof, sources, methodology or history.
13. **Bilingual by selected locale.** The page shows Persian when Persian is selected and English when English is selected. Do not show both languages simultaneously by default.
14. **Responsive and RTL/LTR by design.** Not a desktop layout squeezed onto mobile.
15. **No decorative visual noise.** Every graphic must communicate a measure, relationship, mechanism, comparison, scenario or state.

## 4. Current repository constraints and facts to verify

The repository is a TypeScript pnpm monorepo. The README describes the SPA under `apps/web/`, page features under `apps/web/src/features/`, and the shared Insights engine under `packages/insights/`. The Gold page is a distinct feature territory; the engine is separate.

The current repository's `AGENTS.md` is authoritative. It requires reading the operating instructions first, auditing before large work, storing audits under `docs/audits/`, active specifications under `docs/specs/`, adding non-obvious decisions to `docs/DECISIONS.md`, updating `docs/HANDOFF.md` and `CHANGELOG.md`, and ending every multi-session with a ready-to-copy next-session prompt. Sessions should be small, generally with no more than three milestones. Follow its commit, push, deployment-lock, test, backtest, screenshot and secret-handling rules.

The current `docs/HANDOFF.md` records the previous nine-session Gold UX programme and its deferred gate as complete. This specification is a **new follow-up programme**, not a reason to reopen the old programme or overwrite its historical evidence.

The current `AGENTS.md` describes a consolidated Gold balance with four lanes and 21 voters in its historical record. Earlier product documentation refers to five audience-facing driver groups and a larger displayed metric set. These may be different concepts (model voters, context measures, page cards and audience-facing groups). The agent must reconcile them from current source code and the current rendered page.

**Do not assume that “37 indicators”, “21 voters”, “four engine lanes” and “five visitor-facing groups” refer to the same inventory.** Session 1 must produce separate counts and mappings for:

- Current unique indicators shown anywhere on `/gold`.
- Current balance-model voters/inputs.
- Context-only indicators and measurements.
- Price/technical/market-expectation modules.
- Repeated presentations of the same canonical metric.
- Visitor-facing themes/groups and their mapping to canonical engine categories.

Read the current `docs/insights/GOLD_SYSTEM_COMPLETE_REFERENCE.md` before touching or interpreting gold model behavior. Treat source code and current tests as authoritative; documentation is its map, not a substitute for inspection.

The primary implementation territory is expected to be `apps/web/src/features/gold/`. Confirm the exact path before edits. Shared packages and model code are outside this visual project's default scope.

## 5. Briefing requirements

### 5.1 Current conditions vs forward outlook

Always keep these as separately labelled ideas:

- **Current conditions:** what the existing gold-balance system says about present supporting, pressuring, mixed, steady or unread conditions.
- **Forward outlook:** what the available evidence suggests for a stated future horizon, with assumptions, risks and uncertainty.

Never copy the current balance verdict into an outlook label and call it a forecast.

### 5.2 Outlook format

The intended horizons are:

- **Primary:** 1–3 months.
- **Secondary:** 1–2 weeks.
- **Optional:** 6–12 months, only if a separate evidence/method review says it is defensible.

The default outlook should use plain-language directional wording and qualitative magnitude (for example: modest, moderate, substantial) where that wording is supported. Use three scenarios where the method supports them:

- Base case: the most defensible central scenario and its assumptions.
- Upside: which conditions would strengthen gold's outlook.
- Downside: which conditions would weaken gold's outlook.

Do not show numeric percentage ranges, probabilities or price targets unless a validated method supports those quantities and the owner has approved the methodology. If a forecast method is not defensible, clearly say that a validated forecast is not available yet; do not invent one. In the meantime, the product may show a structured forward-looking evidence assessment, clearly labelled as such and not represented as a calibrated forecast.

### 5.3 Required briefing content

- Plain-language headline.
- Stated time horizon.
- Clear direction: upward bias / sideways or mixed / downward bias / insufficient evidence.
- Qualitative magnitude only when supportable.
- Evidence consistency or uncertainty in ordinary words (strong/moderate/weak or a similarly defensible qualitative description; no made-up confidence percentage).
- Two or three most important supporting/opposing reasons.
- What could change or invalidate the assessment.
- Link/anchor to supporting visuals.
- Data freshness and limitations where material.

### 5.4 Recent price movement vs forward outlook

Explain recent observed price movement separately from the future outlook. A recent move explanation may identify contemporaneous conditions or verified events, but must not state that a factor caused the move unless causal evidence supports that claim.

## 6. Supporting visual requirements

### 6.1 Consolidation

The supporting layer should consolidate dozens of metrics into a small number of readable stories. It must not replicate the 37+ cards as 37+ equally sized charts.

The initial design target is:

- A single integrated visual summary of the gold-market forces.
- Three or four higher-level visitor themes if the audit shows this improves comprehension, with explicit mapping back to the canonical engine groups.
- Stable summaries for every canonical group/lane.
- Two or three dominant current drivers in the briefing; up to five individually featured metrics only where they materially improve the story.
- A complete expandable path to every canonical metric.

The exact number and layout must be tested on desktop and mobile. A “top drivers” selection is a prioritization aid, not a new financial score.

### 6.2 What each major visual must communicate

For each major visual, document:

1. The question it answers.
2. The economic concept being represented.
3. What the shapes, positions, lines, arrows or areas mean.
4. The current reading and period.
5. What the visitor should notice.
6. How it relates to gold (support, pressure, conditional, mixed or unknown).
7. The limitations and conditions under which the relationship changes.
8. Which underlying metrics/source records support it.
9. How a professional can inspect the numerical evidence.

A visualization is not complete because it contains a chart and a legend. A normally educated visitor must be able to understand its main message without opening a tooltip or reading a technical definition first.

### 6.3 Visual system

Use a coherent family of reusable chart/diagram primitives, with custom compositions where the concept requires it. Expected visual families include:

- Economic mechanism/flow diagrams.
- Yield or return decomposition.
- Currency strength and relative-value comparison.
- Inflation vs inflation-expectation comparison.
- Historical time-series and regime comparisons.
- Market-stress/volatility progression.
- Stock vs flow (holdings vs purchases/sales over a period).
- Long/short positioning and net exposure.
- Asset-relative performance and ratios.
- Price map with actual price and technical reference levels.
- Conditional scenario paths/fan charts only if supported by a validated method.

Do not create bespoke art for every card just for novelty. Standardize layout, typography, legends, color semantics, interaction and accessibility. Customize the visual grammar to the data concept.

## 7. Expert cards and numerical evidence

The Roots layer must make the briefing verifiable.

For each unique metric, preserve where applicable:

- Friendly display name and technical name.
- Canonical metric ID.
- Current actual value and unit.
- Observation date/time, reference period and update cadence.
- Data freshness/status (fresh, delayed, stale, unavailable, licensed, error, insufficient history or unread).
- Source and source link where permitted.
- Historical series/range/percentile with a clearly stated reference window where valid.
- Existing model participation (voter, context-only, technical reference, flow, positioning, etc.).
- Existing interpretation/polarity and its limits.
- A link back to the visual/briefing claim it supports.

The visitor should never be shown “zero”, “neutral” or an empty chart when the data is actually unavailable. Data quality is not a market signal.

### 7.1 Default vs expanded content

For the few most important drivers, show the plain-language explanation and a useful concept-specific visual by default. For less important metrics, show a compact summary and reveal the detailed visual/copy inside an expandable detail panel. In every case, the full numerical evidence remains accessible.

## 8. Selection, ranking and attribution safeguards

The system may select up to five featured indicators. It must inspect current, legitimate engine outputs and existing metadata before proposing a rule. It may consider:

- Existing contribution/relevance in the current model, where explicitly defined.
- How unusual the reading is relative to a justified metric-specific historical reference.
- Relevance to the current market narrative or scenario.
- Data freshness, reliability and completeness.

Do not create an opaque weighted score merely to rank cards. Explain why each featured item appears. Do not call prominence “impact” unless actual price-impact attribution exists.

Distinguish:

- Number of indicators signalling a direction.
- Indicators selected as relevant/prominent.
- Economic importance of a mechanism.
- Measured contribution to observed gold-price movement.
- Predictive power for future returns.

These are separate claims requiring different evidence.

## 9. Conventional relationships and financial explanation

Cover common, established relationships that help people understand gold. Examples to investigate (not assume as universal laws):

- Real yields and the opportunity cost of holding non-yielding gold.
- Nominal yields, inflation expectations and real-yield decomposition.
- US dollar strength and the international dollar-denominated gold price.
- Inflation, purchasing power and changing real rates.
- Financial stress/uncertainty and safe-haven demand.
- Central-bank gold holdings and demand.
- ETF holdings/flows, physical demand and market positioning.
- Futures positioning, gross longs, shorts and net exposure.
- Gold relationships with silver, oil, platinum, equities and other assets where relevant.

Every relationship must be classified as one of:

- Economic mechanism (explain why it can work).
- Historical correlation (state the sample/window and that correlation is not causation).
- Conditional relationship (explain the conditions/regimes where it holds).
- Causal evidence (only where credible causal evidence exists).
- Weak/disputed/unsupported (do not present as a reliable signal).

Use plain-language explanations in the UI and retain evidence/source detail in the Roots layer. Do not turn every possible correlation into a story.

## 10. Copy and language rules

- Selected website language only: Persian in Persian mode; English in English mode.
- Plain, natural adult language; avoid both specialist jargon and childish tone.
- The main briefing must be concise.
- Every prominent driver must explain what it means, why it matters now and how it relates to gold.
- Use analogies/examples only where they help.
- Never claim that every high reading is bad or every low reading is good. Direction depends on the metric's meaning and relationship to gold.
- State uncertainty and time-varying relationships plainly.
- Preserve established financial terminology in secondary/technical labels where appropriate.
- Persian copy must follow the repository's localization and copy-audit workflow.

## 11. Visual and interaction behavior

- Professional market-intelligence aesthetic with editorial visual explanations; precise, restrained, memorable and not playful/cartoonish.
- Data and explanation take priority over decoration.
- Static graphics must communicate the main meaning without hover. Interactions reveal further evidence, not the only explanation.
- Desktop: accessible popover/detail panel is acceptable for individual metric depth.
- Mobile: bottom sheet or mobile-native scrollable panel.
- Responsive design must be intentional; mobile prioritizes the briefing and a concise force overview.
- Persian RTL and English LTR must be verified independently.
- Do not rely on color alone; pair colors with labels/icons/patterns. Respect accessible contrast, keyboard navigation and reduced motion.
- Use SVG/HTML/CSS or the repository's existing charting stack for data-driven graphics. Do not use static generated images to represent live numerical data or precise charts. Raster/AI-generated art may be used only as optional editorial illustration, never as evidence or as a replacement for data graphics.

## 12. Scope boundaries

### In scope

- Gold feature page experience and its presentation/content composition.
- Information distillation and hierarchy.
- Concept-specific visual explanations and diagrams.
- Traceability from briefing to visual to underlying metric cards.
- Bilingual content for selected-locale presentation.
- Responsive/accessibility improvements within Gold feature territory.
- Safe presentational refactors backed by audit evidence.

### Out of scope unless separately approved

- Changing gold score, voters, thresholds, weights, canonical lane calculations, model outputs or engine semantics.
- Silently converting balance outputs into forecast outputs.
- Adding new paid providers, new provider fetches, new API calls or recurring backend load.
- Replacing the international gold price feed or changing spot/futures semantics without verifying the source and obtaining approval for any material data contract change.
- Changing routes or splitting out new pages without a documented case and approval where necessary.
- Removing indicators/data sources to simplify the page.
- Rewriting unrelated Currena features or shared components outside the Gold territory.

## 13. Acceptance criteria

### Comprehension

A normally educated visitor with no financial training should be able to:

- Within 15 seconds: state the current gold situation and find the current international price.
- Within about one minute: state the primary short-to-medium-term outlook and its uncertainty.
- Within about two minutes: identify the two or three most relevant forces.
- Within 3–5 minutes: explain in ordinary language why those forces matter and identify what could change the outlook.

### Evidence

- Every prominent briefing statement traces to visible supporting visuals and canonical source metrics.
- Every important visual exposes the actual value, units, timestamp/reference period and limitations where applicable.
- No contradiction between hero, supporting visual and expert card.
- No duplicate primary presentation of the same canonical metric.
- No invented attribution, confidence, probability, forecast or causal claim.

### Visuals

- Main experience is not a 37-card wall.
- The major forces are explained through a small number of concept-specific visuals.
- Generic historical range bars are secondary context, not the only or dominant visualization for most metrics.
- The exact metric inventory is mapped to appropriate visual families in the atlas.
- Key concepts are understandable without opening a tooltip.

### Professional depth

- All existing unique metrics remain accessible unless separately approved for removal.
- Raw numerical data, units, periods, sources, freshness, history and methods are available where existing data supports them.
- A user can move from a briefing claim to the supporting visual and to the corresponding raw metric.

### Quality

- English LTR and Persian RTL validated.
- Desktop, tablet and mobile tested at the documented viewport matrix.
- Loading, fresh, stale, missing, partial, unavailable and error states tested.
- Existing model outputs remain unchanged unless a separately approved methodology change exists.
- Tests, gates, bundle limits and live verification follow `AGENTS.md` and `docs/DEPLOY.md`.
- S6/S7 product/design and technical/test-readiness gates are recorded as passed before production implementation.
- S13 includes deterministic scenario testing across favourable, unfavourable, mixed, contradictory, extreme, stale, missing, partial, failed-data and forecast-method-unavailable states.
- S15 verifies the deployed route in a real browser and records post-deployment smoke-test evidence.

### Scenario-based verification

The final implementation must pass the market interpretation, data-integrity and presentation/interaction scenarios in `GOLD_VISUAL_REFERENCE_AND_PROTOTYPE_PLAN.md` Section 9. At minimum, test:

- Supportive, pressuring and mixed/contradictory market conditions.
- Current-condition assessment and forward outlook that agree, disagree or are unavailable.
- Different short- and medium-term outlooks.
- Extreme/outlier readings and sudden price moves while slower macro indicators remain unchanged.
- Missing one metric, an unavailable group, stale data, partial API responses, provider errors and recovery.
- Invalid values, unit/period mismatches, timezone boundaries and instrument/market-status changes.
- EN LTR and Persian RTL, desktop/tablet/mobile, supported themes, keyboard/touch, expanded/collapsed and loading/error states.

For each case, verify both the functional result and the meaning communicated by the rendered visual. A test that only checks for a successful render is insufficient. Every critical scenario must pass; every failure must have a defect, owner, retest and final disposition.

### Human comprehension testing

Produce a short test with at least five participants who have no professional financial-analysis background, if participants can be recruited by the owner. Do not claim testing was performed if no participants were available. Record:

- Time to identify current conditions.
- Correct identification of the primary outlook/horizon.
- Ability to name the main two or three forces.
- Ability to explain why one force matters.
- Ability to identify an important uncertainty or invalidating condition.

Also perform a structured cognitive walkthrough using the same questions. A visually attractive result that fails comprehension is not accepted.

## 14. Verification gates before and after implementation

Verification is a sequence of dedicated sessions, not a final checklist added at the end. The agent must not begin production implementation merely because a prototype looks attractive or because the specification has been written. The product, design, data contracts, test scenarios and implementation dependencies must first pass explicit readiness gates.

### Gate A — design and product verification (S6)

Before production implementation, verify that:
- Every owner-approved requirement maps to a specific page element, visual, content record or interaction.
- The Briefing / Supporting Visuals / Expert Cards and Numerical Data layers form one coherent experience, with no duplicate or competing verdicts.
- Representative working prototypes have been evaluated against the comprehension rubric, including English LTR and Persian RTL, desktop and mobile.
- Important visuals explain concepts and economic mechanisms, rather than merely placing readings on historical ranges.
- Primary messages, current values, periods, uncertainty and source traceability are clear without hover or expansion.
- All unresolved questions are classified as non-blocking, approval-required or implementation-blocking.

**Exit gate:** no unresolved critical product/design ambiguity; all mandatory prototypes pass the rubric; the design/requirements baseline is versioned and ready for implementation. If a prototype fails, revise and retest it before proceeding.

### Gate B — technical and test-readiness verification (S7)

Before production implementation, verify that:
- Every visual and briefing claim maps to canonical metrics, source fields, units, observation periods, timestamps and data-quality states.
- The exact current metric inventory, card destinations, API/data contracts and existing component boundaries are confirmed from the repository.
- No planned display requires invented data, unsupported causal claims, unapproved provider calls or unapproved model changes.
- Fresh, stale, partial, missing, unavailable, contradictory, extreme and error states have deterministic fixtures or reproducible test conditions.
- Functional, visual, responsive, locale, accessibility, data-integrity and regression tests are assigned to implementation milestones.
- The integration sequence, performance/bundle risks, deployment gates and rollback approach are understood.

**Exit gate:** implementation tickets are traceable to verified requirements; test fixtures and scenario matrix exist; data and component contracts are known; no critical technical dependency remains unresolved. Production implementation must not begin before both Gate A and Gate B pass.

### Verification evidence standard

A verification claim must point to evidence: screenshot, browser recording, test result, data fixture, source mapping, commit, or documented inspection. “Looks good”, “works locally” or “implemented” is not sufficient by itself. Report separately whether an item is designed, implemented, tested, deployed and verified in the deployed environment.

## 15. Multi-session roadmap

Execute sequentially. Each session should have no more than three principal milestones, in line with `AGENTS.md`. Each milestone is verified, committed and pushed before proceeding. Stop after each session, update the repository handoff, and generate the full next-session prompt. **S6 and S7 are mandatory pre-implementation verification sessions.** Production implementation may start only after both gates pass.

### S1 — Current-state and evidence audit
**Goal:** Establish exactly what is deployed and what the Gold feature actually contains.

- M1: Read repository instructions, current strategy, Gold system reference, HANDOFF, CHANGELOG, DECISIONS, recent history and working tree. Capture desktop/mobile screenshots in EN and fa RTL; record route, viewport, date and build/commit.
- M2: Trace the Gold feature components and data path. Create separate inventories for rendered metrics, balance voters, context-only measures, market modules, duplicate presentations and visitor-facing groups. Verify price instrument/feed and data freshness.
- M3: Produce a spec-vs-code matrix, comprehension gap audit, current baseline screenshot set, risk list and recommendations. No visual redesign implementation in S1.

**Deliverables:** dated audit under `docs/audits/`, actual inventory, current journey/section map, visual baseline and gap matrix.  
**Exit:** every current major section and unique metric is accounted for; unknowns are explicitly listed.

### S2 — Outlook and evidence-method review
**Goal:** Decide what the page can honestly say about future gold conditions without changing the existing balance engine.

- M1: Document current-condition model semantics separately from any future-looking evidence.
- M2: Audit data availability, cadence, history, regimes and candidate methods for 1–2 week and 1–3 month scenario assessment. Research percentage/magnitude estimates only if supportable.
- M3: Produce an evidence/method decision memo: what is publishable now, what is not, uncertainties, validation/backtest requirements and any owner-approval request.

**Deliverables:** current-vs-outlook contract, evidence matrix, scenario template, methodology feasibility memo.  
**Exit:** no forecasts or probabilities are invented; any engine/model change is gated for owner approval.

### S3 — Three-layer information architecture and claim-to-evidence model
**Goal:** Turn Flower/Tree/Roots into a concrete page architecture and traceability contract.

- M1: Define the briefing contents and visible hierarchy.
- M2: Consolidate the supporting layer into 3–4 audience themes if supported, while mapping back to canonical groups/lanes.
- M3: Design how a briefing claim links to supporting visual IDs and raw metric IDs; finalize visible/collapsed/advanced placement and deduplication.

**Deliverables:** page map, user journey, claim-to-evidence schema, canonical placement/dedup matrix.  
**Exit:** a visitor can trace every prominent message to evidence without seeing all metrics at once.

### S4 — Indicator and relationship content atlas
**Goal:** Build the complete content/evidence specification for every actual unique Gold metric and common relationship.

- M1: Verify canonical metric inventory and classify each metric's type, unit, cadence, role, polarity, source and data quality.
- M2: Document per-metric plain-language explanation, current-reading interpretation, high/low caveats, why it matters now and relationship classification.
- M3: Assign every metric to a visual family and document established relationships, limitations and sources.

**Deliverables:** updated `GOLD_VISUAL_EXPLANATION_ATLAS.md` equivalent under `docs/specs/...`, full mapping and bilingual copy coverage plan.  
**Exit:** no unique metric is left unmapped; weak evidence and unavailable content are flagged rather than guessed.

### S5 — Visual system and representative working prototypes
**Goal:** Validate that the new visual approach communicates meaning, not merely ranges.

Build working prototypes using existing project technology and representative, schema-valid data (fixtures clearly labelled as illustrative where not live). Required prototypes:
- Unified briefing/fruit-and-flower composition.
- Integrated forces/tree diagram.
- Real-yield mechanism/decomposition visual.
- US dollar strength visual.
- One flow/stock or central-bank demand visual.
- One investor-positioning visual.

- M1: Establish visual grammar, layout/typography/colour and standard chart/diagram families.
- M2: Build the representative working prototypes in EN LTR and fa RTL, desktop and mobile.
- M3: Evaluate against the comprehension rubric, revise, document component/visual rules and prototype evidence.

**Deliverables:** working prototype route/storyboard, screenshots, visual standards and prototype evaluation report.  
**Exit:** each prototype answers an ordinary-language question; the main meaning is visible without hover; no generic range bar is used as a substitute for explanation. S5 creates prototypes only; it does not authorize full production rollout.

### S6 — Pre-implementation verification: product, content and design gate
**Goal:** Verify that the complete product/design solution is coherent and ready before production implementation begins.

- M1: Run a requirement-to-design traceability review across the parent strategy, main specification, visual atlas and prototype plan. Every requirement must map to a concrete component, content item, visual, interaction or explicit out-of-scope note.
- M2: Review every required prototype in desktop/mobile and EN/fa RTL. Verify visual hierarchy, information distillation, default-visible explanations, expandable expert evidence, no competing verdicts, no misleading scale/causal implication, and successful traceability from briefing to visual to metric. Rework any failed prototype.
- M3: Freeze the product/design baseline: page map, component inventory, default/collapsed rules, visual family choices, content contracts, accepted screenshots, known limitations and unresolved approval gates.

**Deliverables:** pre-implementation design verification report, traceability matrix, accepted/revised prototype screenshots, frozen design baseline and blocker register under `docs/audits/` and `docs/specs/`.  
**Exit:** all critical requirements have evidence; all mandatory prototypes pass the rubric (minimum 14/16 and mandatory criteria score 2); no critical design or content ambiguity remains. No production feature implementation in S6.

### S7 — Pre-implementation verification: technical, data and test-readiness gate
**Goal:** Prove that the frozen design can be implemented safely with the existing repository, data and infrastructure.

- M1: Verify canonical metric IDs, data contracts, sources, units, timestamps, observation periods, freshness rules, empty/error states and every claim-to-metric mapping. Confirm no unsupported provider/API/backend work is required.
- M2: Create deterministic test fixtures and a scenario matrix covering favourable, unfavourable, mixed, contradictory, extreme, stale, missing, partial, unavailable and failed-data states; include price-market status and forecast-method-unavailable fallback.
- M3: Create implementation tickets/dependencies and test coverage map for functional behavior, numerical consistency, visual rendering, locales, responsive breakpoints, accessibility, performance, regression, deployment and rollback. Verify required tooling and browser access.

**Deliverables:** technical readiness report, verified data/contract map, fixture catalogue, scenario-based test plan, implementation backlog and release/deployment dependency map.  
**Exit:** no critical data/architecture dependency is unknown; every high-priority claim maps to verified evidence; deterministic scenarios exist; all implementation work has testable acceptance criteria. No production feature implementation before S6 and S7 both pass.

### S8 — Implement the Briefing layer
**Goal:** Ship the fruit/flower experience.

- M1: Implement the current price/movement and one authoritative current-conditions summary, keeping XAU/USD spot instrument semantics accurate.
- M2: Implement the separate forward outlook/scenario display only to the degree approved by S2 evidence/method review. Otherwise show an honest evidence-based assessment without implying a calibrated forecast.
- M3: Implement top reasons, uncertainty/what-could-change copy and traceable links to supporting visuals.

**Deliverables:** functioning briefing with responsive/RTL support, fixtures/tests and screenshots.  
**Exit:** 15-second test is passed in cognitive walkthrough; hero, outlook and balance are not competing or contradictory.

### S9 — Implement the Supporting Visuals layer
**Goal:** Ship the tree/leaves explanation system.

- M1: Implement the integrated forces overview and audience-facing themes mapped to canonical model groups.
- M2: Implement mechanism diagrams for the most important drivers and selected concepts from the atlas.
- M3: Implement explanatory relationships and links from visuals to the Roots evidence. Add relevant detail interactions.

**Deliverables:** supporting visual chapter, reusable components and visual tests.  
**Exit:** a visitor can explain the main forces without reading technical cards; visuals reconcile to the raw data.

### S10 — Implement the Roots expert/evidence layer
**Goal:** Preserve and improve the professional verification experience.

- M1: Organize all unique metrics into canonical expandable groups/library; remove duplicate primary presentations without deleting model inputs.
- M2: Implement expert cards with numerical values, units, period/timestamp, freshness, source, technical name and history/method where available.
- M3: Connect prominent briefing/visual claims to the exact root cards and verify numerical consistency.

**Deliverables:** complete evidence layer and traceability checks.  
**Exit:** professionals can verify the page; ordinary visitors are not forced into the expert layer.

### S11 — Relationships and secondary research integration
**Goal:** Make deeper market context coherent without disrupting the main experience.

- M1: Implement the dedicated relationship explorer using classified/evidenced relationship records.
- M2: Integrate institutional demand, flows, market expectations, asset comparisons, technical context, historical episodes and investment calculator according to the approved hierarchy.
- M3: Move the Iran market experience to the bottom as a compact regional intro with expandable details; check duplicates across all sections.

**Deliverables:** coherent secondary/advanced chapters and relationship map.  
**Exit:** primary briefing remains dominant; secondary research remains accessible and correctly labelled.

### S12 — Cross-layer integration and functional verification
**Goal:** Verify that the three layers function together as one coherent product.

- M1: Run end-to-end claim-to-evidence checks: briefing claims → supporting visuals → canonical expert cards. Verify identical values, units, periods, timestamps and status semantics.
- M2: Test all interactions and transitions: navigation, expand/collapse, desktop popovers, mobile sheets, links, filters, charts, scenario controls and keyboard/touch behavior.
- M3: Run integration, regression, accessibility, performance and localization checks; resolve defects before scenario-based QA.

**Deliverables:** integration test report, traceability test results, defect register and verified build.  
**Exit:** no critical cross-layer mismatch, broken interaction, duplicate primary metric or severe regression remains.

### S13 — Dedicated scenario-based visual and functional QA
**Goal:** Prove that the page remains understandable and correct across materially different market/data conditions and device states.

- M1: Run deterministic market scenarios: broad support/upside conditions; broad pressure/downside conditions; mixed/contradictory forces; extreme/outlier readings; rapidly changing readings; price moves while macro data is unchanged; current conditions and outlook disagree; and outlook method unavailable.
- M2: Run data-quality scenarios: delayed/stale feeds, one missing metric, an entire lane unavailable, partial API response, provider error/timeout, malformed/out-of-range values, unit/period mismatch, timestamp/time-zone boundary and recovery after error. Never turn missing data into zero or neutral.
- M3: Run the visual/interaction matrix across desktop/tablet/mobile, EN LTR/fa RTL, supported themes, normal/loading/empty/stale/error states, keyboard/touch, reduced motion and narrow widths. Capture screenshots and fix/retest every critical or high-priority failure.

**Deliverables:** scenario test matrix, deterministic fixture results, screenshot matrix, defects/retest log and visual QA report.  
**Exit:** every critical scenario passes; no visual clipping/overlap or unreadable RTL; data states are honest; no unsupported market interpretation appears under edge conditions.

### S14 — Dedicated comprehension and usability validation
**Goal:** Verify that people, not just the code, understand the redesigned product.

- M1: Run a structured cognitive walkthrough against 15-second, 1-minute, 2-minute and 3–5-minute tasks. Record where the user looks, what they infer and where they hesitate.
- M2: When participants can be recruited, test with at least five normally educated people without professional financial-analysis backgrounds. Ask neutral tasks; do not teach them the answer during the test.
- M3: Score comprehension, identify misunderstandings, revise the affected hierarchy/copy/visuals and repeat the failed tasks. If real participants are unavailable, report that honestly and do not claim user testing.

**Deliverables:** comprehension test script, task scores, findings, before/after evidence and remediation report.  
**Exit:** acceptance thresholds in Section 13 are met, or remaining failures/limitations are explicitly documented and not represented as complete.

### S15 — Release readiness, deployment and post-deployment verification
**Goal:** Establish that the final result is complete, safe to release and correct in production.

- M1: Run a release-candidate review against every requirement, milestone, open defect, source mapping, data-quality state, accessibility criterion, localization requirement and performance budget. All P0/blocker and P1/critical defects must be closed and retested. P2/P3 items require a documented impact, workaround and disposition. Confirm no unresolved blocker or unapproved methodology change.
- M2: Run all repository-required checks, tests/backtests, secret scans, bundle/performance budgets and deployment-lock procedure. Prepare a release record and rollback plan.
- M3: Deploy through the documented workflow, verify the actual live `/gold` route in a real browser across the critical viewport/locale matrix, run post-deployment smoke checks, and roll back immediately if a critical defect appears.

**Deliverables:** release-readiness checklist, final audit, final screenshots, test/QA reports, deployment record, live verification evidence and handoff.  
**Exit:** all critical acceptance criteria are verified in the deployed environment; all non-critical limitations are clearly disclosed; rollback readiness is confirmed.

## 16. Session operating rules

- Work one session per agent invocation. Do not run the entire programme in one uninterrupted pass.
- Start each session by reading `AGENTS.md` first, then the repository's required startup reading order, this specification, the previous audit/session records and current git state.
- Use the repository's `docs/HANDOFF.md`, `CHANGELOG.md`, `DECISIONS.md`, `docs/audits/`, `docs/specs/`, `docs/assets/` and `docs/sessions/` conventions.
- Every session has no more than three major milestones. Break larger milestones into verifiable sub-milestones.
- **Do not begin production feature implementation before S6 (design/product verification) and S7 (technical/data/test-readiness verification) both pass.** Prototype work in S5 is allowed; production rollout is not.
- S13, S14 and S15 are separate mandatory sessions. Do not collapse scenario QA, comprehension testing and release/deployment into a single rushed final session.
- Scenario QA must use deterministic fixtures and verify both the data interpretation and the rendered visual. Passing unit tests alone does not pass scenario QA.
- A release candidate is not “final” until S15 verifies the deployed page in a real browser and records post-deployment smoke-test evidence.
- Commit and push after every meaningful verified sub-milestone, using the repository's branch/commit rules. Never force-push, rewrite history, or overwrite another person's work.
- Deploy only under the repository's standing deployment procedure, with the deploy-lock re-check first, all required gates green, and post-deploy verification. Documentation-only sessions do not deploy. Parallel lane sessions do not deploy or push `main`; follow `AGENTS.md` §15 and use an integration session.
- Do not use parallel agents on the Gold feature concurrently. The project is sequential unless the owner explicitly initiates a compliant lane wave.
- At the end of every session: update required handoff/changelog/decision records, report what was tested and what was not, give progress as `Session X/15 · Y remaining`, and produce a complete copy-paste prompt for the next session.
- Do not ask the owner questions already answered here or in the parent strategy. Ask no more than three questions at a time and only for critical, expensive-to-reverse decisions.
- Continue autonomously for reversible design/implementation choices. Pause only for material conflicts with the agreed product direction, changes to financial methodology/model/data contracts, new paid providers/costs, destructive/irreversible changes, security/production-risk issues or unavailable authority.

## 17. Definition of success

The success state is not “all 37 cards have been redesigned.” It is:

- A visitor can understand the gold briefing in seconds.
- Supporting visuals explain the few forces that matter most.
- The full evidence base is available for verification by professionals.
- The page is visually rich without being cognitively exhausting.
- The user can travel from fruit/flower to leaves/tree to roots, while every briefing claim is traceable back to trustworthy data.
- The design feels sophisticated and credible, not childish, gimmicky or like a generic financial terminal.
