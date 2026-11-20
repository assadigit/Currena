# Currena Gold — UX Strategy & Phased Multi-Session Plan

**Target:** <https://currena.ir/gold>  
**Repository:** <https://github.com/assadigit/Currena>  
**Prepared:** 2026-11-20  
**Status:** Product direction finalized after three rounds of owner clarification; current-state audit and implementation remain to be performed  
**Document type:** Consolidated strategy, final decision register, work sequence, session briefs, and acceptance framework
**Revision:** v2 — incorporates the second and third clarification rounds  
**Primary audience:** Global gold-market visitors, especially people interested in gold as an investment but who are not professional analysts

---

## 1. Executive product direction

Currena Gold should be a **global gold-market briefing and decision-context page**, not an online gold-analysis course and not a specialist terminal.

The experience should behave more like a good weather programme:

- First, tell people what is happening now.
- Then give them a clear, careful view of the current outlook or market conditions.
- Explain the few most important reasons behind that view in ordinary language.
- Let interested visitors explore the underlying indicators, evidence, history, and technical details without forcing everyone to become an analyst.

The page must serve the visitor who wants to understand gold in seconds, while still providing credible depth for the visitor who wants to investigate further.

### The core promise

Within approximately 15 seconds, a first-time visitor should be able to understand:

1. The current global gold price and its recent direction.
2. The broad current conditions around gold: which forces are supporting it, which are putting pressure on it, and where the picture is mixed or unclear.
3. A concise, cautious forward-looking outlook, clearly separated from the assessment of current conditions, with its main reasons and uncertainties visible at a glance.

Within 3–5 minutes, the visitor should understand the current gold-market situation and the most important drivers behind it. The page may offer deeper context, but it must not require the visitor to become an analyst.

### Product hierarchy

1. **Primary:** Current gold price, recent movement, current market conditions, and a clear outlook/context briefing.
2. **Secondary:** A small number of the most relevant supporting drivers, selected from the existing indicator system.
3. **Supporting context:** Five driver groups, institutional demand, market expectations, comparisons, and historical context.
4. **Advanced exploration:** Detailed indicator definitions, technical analysis, methodology, source information, and deeper historical research.
5. **Regional context:** Iranian domestic gold information remains available as a clearly separate regional chapter near the bottom. It must not define the global page's main experience.

The page is not meant to become shorter by indiscriminately deleting useful material. Its job is to make the hierarchy obvious, keep redundant representations out of the way, and let visitors choose how deep to go.

---

## 2. Owner decisions — consolidated and locked

The following decisions reflect the owner's answers to the 28-question UX interview. They are product direction, not suggestions for the agent to reopen.

| # | Decision | Product interpretation |
|---:|---|---|
| 1 | **A primary; B/C contextual** | The page is primarily a gold market dashboard/briefing. Education and research explain the briefing; they are not the product's main identity. |
| 2 | **A + B** | The first view must communicate today's price/direction and whether current conditions broadly support or pressure gold. |
| 3 | **A + B** | After 3–5 minutes, visitors should understand the current situation and the major forces behind it. |
| 4 | **C + B** | Provide a clear market-condition/outlook assessment and educational investment context. Do not become a personalized recommendation service. |
| 5 | **D** | Combine price, movement, current assessment, and explanation in the hero, but establish one unmistakably dominant element. |
| 6 | **A** | Keep the existing gold-balance concept as the central organizing idea, subject to an audit of how it currently works and is explained. |
| 7 | **C** | Show one combined overview of the five forces, followed by five expandable/detail groups. |
| 8 | **C + D** | Show one summary per group and dynamically highlight the most relevant individual indicators. Do not show all indicators with equal prominence. |
| 9 | **A + C + D** | Retain the five canonical categories as a starting point, improve labels and explanations, and let the audit recommend any audience-facing reorganization. Preserve model lane identity unless separately approved. |
| 10 | **B** | Use a long-form page with sticky section navigation. Navigation must adapt to mobile rather than simply shrinking desktop navigation. |
| 11 | **C + D** | Keep the Iran Bridge as a clearly separated regional-market chapter near the bottom, not as part of the primary global market briefing. |
| 12 | **C** | Retain technical analysis, but make it understandable through visual explanations rather than specialist tables as the default. |
| 13 | **B** | Institutional demand and market infrastructure are important secondary context, behind the primary macro conditions. |
| 14 | **B** | Put the Federal Reserve calendar and Polymarket material together in a dedicated market-expectations section. |
| 15 | **B** | Keep historical Gold Episodes, but place them near the bottom as supporting context. |
| 16 | **B** | Keep the “If You'd Bought” comparison tool as a secondary interactive feature, not a dominant part of the page. |
| 17 | **A–G, all** | Every unique indicator needs: what it measures, why it matters to gold, what high/low readings may mean, an everyday analogy where useful, a visual/current reading, and relationships to other indicators. |
| 18 | **B** | Show a plain-language name prominently and retain the technical name as a secondary label. |
| 19 | **D** | Use clear adult language, everyday phrasing, and analogies where they make a concept easier to grasp. |
| 20 | **D** | Explanation length is adaptive. Use the shortest explanation that genuinely makes the indicator understandable. |
| 21 | **D** | Explain uncertain or changing relationships with a plain-language caveat and a historical chart where sufficient evidence exists. |
| 22 | **D** | Overall visual direction: professional market intelligence. |
| 23 | **C + D** | Use ambitious, highly visual communication, selecting the right visualization or visual metaphor for each concept rather than forcing every metric into one chart type. |
| 24 | **A** | Green means supportive of gold; red means pressure against gold. Neutral/mixed/unavailable states must remain distinct. |
| 25 | **D** | Make visuals the main way to understand the information; exact numbers remain visible where they materially help and are secondary where appropriate. |
| 26 | **C primary + B + A** | Mobile needs its own information hierarchy, while retaining useful content through progressive disclosure and compact presentation. |
| 27 | **C + D** | Show available information with a subtle missing-data disclosure; choose the exact treatment based on why data is missing. |
| 28 | **C + D** | Permit justified refactoring and deeper technical changes when the audit proves a real problem. Do not change financial methodology or data infrastructure casually. |

### 2.1 Final owner decisions — outlook, prioritization, relationships and behavior (Rounds 2–3)

These decisions were confirmed after the initial 28-question interview. They are authoritative and extend the initial decision table above. If wording elsewhere in this plan is less specific or conflicts with this section, follow this section and the decision hierarchy in Section 11.5.

| Area | Final owner decision | Implementation interpretation |
|---|---|---|
| Product identity | **Weather-briefing model** | Lead with a useful market briefing. The visitor should not have to interpret 37 indicators to understand the conclusion. Educational and research material is supporting context. |
| Current conditions and outlook | **Always separate** | Present current conditions (what currently supports/pressures gold) separately from forward-looking outlook (what current evidence suggests over a stated horizon). Do not merge them into one ambiguous verdict. |
| Outlook format | **Qualitative direction + scenarios** | Provide a concise qualitative directional assessment and explain plausible upside, downside and/or sideways scenarios where evidence supports them. Do not add numeric price targets in this scope. |
| Outlook horizons | **1–2 weeks; 1–3 months; 6–12 months, conditional on methodology** | These are candidate standard horizons. Publish only the horizons for which current data and a defensible method support an assessment. Never fill a horizon merely to complete the UI. |
| Spot price | **XAU/USD spot, per troy ounce** | This is the preferred primary global gold price. Session 1 must verify the existing source, instrument, unit and freshness. If the existing feed is not genuinely spot XAU/USD or has material limitations, document the discrepancy and propose a resolution before changing data contracts. |
| Outlook assessment language | **Five plain-language conditions** | Prefer: strongly supportive; moderately supportive; mixed/unclear; moderately pressuring; strongly pressuring. Validate that the existing model can support this granularity. Do not manufacture distinctions not present in its outputs. |
| Outlook confidence | **Qualitative evidence consistency** | Explain whether the evidence is broadly consistent, mixed, or limited. Do not invent a numerical confidence percentage or an unvalidated confidence score. |
| Hero priority | **Outlook-first** | The dominant focal point is the plain-language market briefing/outlook. The spot price and recent movement remain immediately visible and prominent, with the current-condition balance as supporting evidence. |
| Narrative format | **Headline + summary + reasons** | Use a short headline, one concise summary sentence, and usually two or three evidence-backed supporting reasons. Add a very concise “what could change this assessment” note. |
| Update cadence | **Narrative daily; data on source cadence** | The narrative may be reviewed/published daily. Price and indicator readings update independently according to their actual data cadence. Show freshness per relevant data item; never imply all components update together. |
| Five-force visualization | **Five visual lanes + balance** | Preserve the five forces and the central balance concept. Session 4 should design one coherent visual system in which the five lanes explain the composition of the overall balance, rather than two competing summary graphics. |
| Driver highlights | **Up to five, with group coverage and exceptions** | Keep all five group summaries available. By default, feature up to one standout individual indicator per group where it genuinely merits attention (up to five total). Exceptional signals may justify an additional callout, but explain why; do not fill a quota with weak signals. |
| Highlight selection | **Three evidence dimensions** | Consider (1) the indicator's existing contribution/relevance in the gold model, (2) how unusual its current reading is relative to an appropriate historical reference, and (3) its relevance to the current narrative. Use existing fields where available. Do not create a new opaque composite score or alter model weights. |
| Highlight explanation | **Required** | Each featured indicator must state briefly why it is highlighted now. “Highlighted” must not imply “predictive”. |
| Historical references | **Longest reliable history, adapted per indicator** | Use the longest reliable dataset when meaningful, but select an indicator-appropriate reference period. Always expose the period/population used and explain comparability limitations. |
| Indicator relationships | **Per-indicator explanations + visual relationship explorer** | Explain relevant conventional relationships inside indicator details and provide a dedicated visual relationship map/explorer for deeper exploration. Cover established, commonly used relationships—not every speculative correlation. |
| Relationship accuracy | **Mechanism, correlation and causation must be distinguished** | Identify whether a relationship is a plausible economic mechanism, an observed historical correlation, or a causal claim supported by evidence. Note when relationships vary over time or depend on context. |
| Indicator interaction | **Desktop popover; mobile bottom sheet** | On desktop, an accessible popover/panel opens from the indicator. On mobile, use a scrollable bottom sheet or equivalent mobile-native panel. Preserve keyboard, touch and focus behavior. |
| Visual templates | **Consistent family + justified custom visuals** | Establish a manageable system of standard patterns but allow custom visualizations when the data type or concept genuinely requires one. |
| Analogies and examples | **Use selectively** | Include a short everyday analogy or example only when it materially improves understanding. Do not force an analogy onto every indicator. |
| Iran Bridge | **Same page, bottom, compact intro + expandable detail** | Keep the section on `/gold`, clearly regional and below the global content. Show a concise introduction; expand for the full Iranian-market experience. |
| Data freshness and availability | **Per-item freshness + contextual disclosure** | Use timestamps/freshness where relevant and a small availability summary. The exact wording/state depends on the reason: stale, delayed, licensed, unavailable, insufficient history, or error. |
| Architecture freedom | **Refactor allowed; methodology changes approval-gated** | The agent may refactor components, presentation architecture and data composition when evidence supports it. It may propose changes to calculations, scoring, thresholds or methodology, but must document evidence and wait for explicit owner approval before implementing them. |
| Success criteria | **All dimensions** | Visual hierarchy, 15-second comprehension, one-minute driver understanding, deduplication, bilingual completeness, accessibility, performance and data integrity all matter. |

### 2.2 Important resolutions of apparent conflicts

1. **“Outlook” is not the same as the gold-balance model.** The balance describes current supporting/pressuring conditions. A separate forward-looking assessment may use scenario analysis, but only through a documented method appropriate to each horizon.
2. **Five lanes are stable; individual highlights are dynamic.** Every group remains represented in the overview. Up to five individual metrics earn extra prominence based on current evidence. This is not a requirement to show exactly one metric from every group when a group has no meaningful standout.
3. **Complete explanations do not mean long default cards.** All explanatory dimensions must exist in the content system; the default presentation remains short and visual, with details in a desktop popover/mobile bottom sheet.
4. **Visual first does not mean number-free.** Show exact values prominently where they are the point (especially spot gold price); otherwise make the visual interpretation dominant and expose technical values in the right level of detail.
5. **Relationships are important but must be truthful.** Explain conventional relationships and provide an advanced relationship explorer, while distinguishing mechanisms from correlation and avoiding universal claims.
6. **The Iran Bridge remains.** Keep it on the same page at the bottom, with a compact entry point and expandable regional detail. Do not move it to another route without owner approval.
7. **Forecasting is conditional.** The owner wants a forward-looking view and scenarios, but does not authorize invented probabilities, unsupported confidence scores, or numerical price targets.

### Audience assumption — do not turn into a public statistic

The owner believes that the overwhelming majority of visitors are interested in gold as an investment rather than in becoming gold analysts. Treat this as a product-design assumption about visitor intent, **not as a verified statistic**. Do not publish a “98%” claim or present it as researched audience data without independent evidence.

---

## 3. Critical interpretation rules

These rules reconcile the owner's decisions and prevent a visually attractive redesign from becoming misleading.

### 3.1 The weather-briefing analogy

Use the structure of a weather briefing, not literal weather-themed graphics:

- **Condition:** What is happening in the gold market now?
- **Outlook/context:** What do the current conditions suggest, and what is the level of confidence or uncertainty?
- **Reasons:** Which few factors matter most right now?
- **Details:** Where can a visitor inspect the evidence and technical definitions?

Do not turn the page into a tutorial on every economic variable. The normal visitor should receive a useful briefing, not a lecture.

### 3.2 Separate current conditions from a forward-looking outlook

The page must communicate both, but as two distinct assessments.

**Current conditions** answer: what is happening now, and which forces currently support or pressure gold? This is where the existing five-lane gold-balance model belongs.

**Forward-looking outlook** answers: given the available evidence, what direction or scenarios appear more plausible over a stated horizon? This must be based on an explicitly documented approach and must not be inferred mechanically from the current balance unless the existing model has been validated for that purpose.

Required behavior:

- Keep observed spot-price movement, the current gold-balance/conditions assessment, and the forward-looking outlook separate.
- The hero is **outlook-first**, but the current XAU/USD spot price and recent movement must remain immediately visible.
- Use a clear qualitative direction and scenario framing where supported. Plausible scenarios may include upward, downward and sideways paths, with their key conditions/drivers.
- Candidate horizons are **1–2 weeks, 1–3 months and 6–12 months**. Publish only the horizons supported by a documented methodology and available data; do not show empty or speculative horizons merely to complete a set.
- Do not publish numerical future price targets, target ranges, probabilities, or confidence percentages under this plan. Reconsider only if a separate forecasting method is developed, validated, documented, and explicitly approved.
- Express confidence as qualitative evidence consistency: for example, evidence is broadly aligned, mixed, or limited. Do not invent a numerical confidence score.
- Explain briefly what could change or invalidate the current assessment.
- A scenario is a conditional possibility, not a promise or a forecast certainty. Identify its triggering conditions and relevant limitations.
- Use cautious, natural language. Distinguish market expectations (such as prediction-market pricing) from Currena's own assessment.
- If the repository's existing outlook model is not a valid forecasting methodology, preserve the current-condition assessment and propose a clearly separate, evidence-based outlook method for owner review. Do not label a balance score as a forecast.

### 3.2.1 Required briefing format

The default briefing should follow this editorial structure:

1. **Headline:** one plain-language statement of the current outlook.
2. **Summary:** one concise sentence describing the main direction/conditions and stated horizon.
3. **Evidence:** usually two or three of the most relevant supporting or opposing reasons.
4. **What could change this:** one short conditional caveat or key upcoming development.
5. **Current conditions:** a separate, clearly labelled reading of the gold-balance model and its five forces.

The default should not read like a long research note. Deeper scenarios, assumptions, detailed driver relationships and technical methodology remain available below or through progressive disclosure.

### 3.3 Keep the balance central, but explain it naturally

The balance is the central organizing idea. The redesigned experience should make it intuitive to answer:

- What currently supports gold?
- What currently puts pressure on gold?
- What is mixed, neutral, or not sufficiently known?
- Which underlying factors are responsible for the current picture?

A single score or tilted graphic must not hide the composition, data quality, or uncertainty behind the result.

### 3.4 Dynamic highlights must be explainable and must not create duplication

Keep all five group summaries stable, then dynamically feature **up to five** individual indicators in the main briefing by default. Selection should consider three evidence dimensions:

1. The indicator's existing contribution/relevance in the current gold model, where a legitimate existing field is available.
2. How unusual its current reading is relative to an indicator-appropriate historical reference period.
3. Its relevance to the current market narrative and outlook.

Rules:

- First inspect whether the engine already exposes contribution, polarity, relevance, or other defensible selection information.
- Do not create a new weighted/composite “importance” or “prediction” score as a shortcut.
- The five driver groups must all remain represented by a summary. Individual highlights should represent relevant groups where possible, but never force a weak metric into the featured set merely to create equal coverage.
- An exceptional signal may receive an additional callout beyond the normal five only when the reason is clear and the extra prominence is justified. Avoid turning this exception into a second unbounded card grid.
- Each highlighted metric must include a short explanation of **why it matters now**.
- “Highlighted”, “unusual”, “contributing”, or “relevant” must not be presented as “predictive” unless a validated predictive method supports that claim.
- A featured indicator must link to or reuse its canonical presentation. Do not render a duplicate card in the top-drivers area and again in its detailed group.
- If no defensible dynamic ranking exists, the agent must document the gap and propose a transparent rule for owner review before implementing new scoring logic.
- Avoid unstable ordering or visual flicker. The selection should update in a predictable way consistent with data cadence.

### 3.5 All explanatory dimensions are required; not all must be displayed at once

Every unique indicator must have a complete explanation record covering all seven requested dimensions. The default interface should show only the shortest useful explanation and its visual. Additional explanation can be revealed on demand.

This resolves the apparent conflict between “ALL” explanation elements and “shorter is better”:

- **Content completeness:** every dimension exists for every unique item in the content model.
- **Default simplicity:** only the most useful sentence(s), status, and visualization are exposed initially.
- **Progressive detail:** extra explanation, analogy, relationships, technical name, value, unit, source, history, and methodology appear only where needed or requested.

### 3.6 Color represents the relationship to gold

The selected color convention is:

- **Green:** the current reading/condition supports gold, according to the documented interpretation of that indicator.
- **Red:** the current reading/condition puts pressure on gold.
- **Neutral/mixed:** neither direction is sufficiently clear, or the model explicitly classifies it as mixed/neutral.
- **Unavailable/unread/stale:** a separate data-quality state, never disguised as neutral.

Green and red must not mean universally “good” and “bad”, and must not simply encode whether the indicator's own number has risen or fallen. A rising value can support gold for one indicator and pressure gold for another.

Always pair color with text, iconography, or another accessible cue. Preserve readable contrast in both themes and both locales.

### 3.7 Visual ambition must preserve analytical truth

Use charts, bars, ranges, balances, diagrams, and visual metaphors where they improve understanding. A visual must not:

- Imply a forecast where there is only historical context.
- Suggest a causal relationship where only correlation is known.
- Compare unlike units on a misleading common scale.
- Turn a missing value into zero or a neutral value.
- Hide the period, units, data freshness, or reference population behind a percentile/range.
- Use decorative imagery as a substitute for explaining the data.

---

## 4. Proposed visitor journey and page architecture

This is the starting architecture for Session 2 to validate against the current page, actual data, and rendered experience. The agent may refine section names, exact grouping, and order when the audit provides evidence, but must preserve the locked product hierarchy.

### 4.1 Primary experience — the briefing

#### Section 1 — Gold today

**Purpose:** Answer the visitor's main question immediately.

Expected content:

- Current XAU/USD spot gold price per troy ounce, using the existing canonical source if it is genuinely a spot feed; verify instrument, unit and freshness before changing anything.
- Recent price movement with a clearly named period (for example, daily change; verify current implementation).
- One dominant, plain-language forward-looking briefing (outlook-first).
- The current balance/conditions result, clearly distinguished from observed price movement and from the separate forward-looking outlook.
- A concise indication of what is supporting and what is pressuring gold.
- Data freshness and relevant source context without cluttering the main message.

Design rules:

- One dominant hero element; do not create several equally prominent verdict cards.
- Avoid repeating the gold price in multiple hero-like cards.
- Avoid presenting the same balance verdict again in another nearby summary component.
- The visitor should understand the hero without knowing terms such as real yield, breakeven inflation, CFTC, or term premium.

#### Section 2 — What is influencing gold?

**Purpose:** Give the visitor a visual overview of the five existing driver groups.

- Use a coherent combined overview that pairs five visual lanes (one for each force) with the aggregate balance. The lanes explain the composition of the balance; they must not read as two competing or contradictory summaries.
- Give each group one concise plain-language summary and a clear direction/condition label.
- Allow each group to expand into its individual indicators.
- Preserve the five canonical model lanes as the technical starting point; improve audience-facing labels and explanatory order based on the audit.
- Use current data to identify up to five relevant individual indicators for featured treatment, with exceptional callouts only when justified. Keep each indicator in one canonical location and explain why each featured item matters now.
- Make “mixed”, “neutral”, and “unavailable” understandable and distinct.

The visitor should be able to get the overall picture without opening every group.

#### Section 3 — The main drivers right now

**Purpose:** Show a small, dynamic set of the indicators most useful for understanding the current briefing.

- Feature a restrained number of indicators overall; determine the appropriate cap during Session 2 using the actual distribution and screen sizes.
- Prefer representation across relevant driver groups rather than allowing one category to dominate without reason.
- Explain in plain language why each featured item matters *right now*.
- Do not duplicate the indicator if it is also part of an expanded driver group. Use one canonical component/record and a link/anchor or a single placement strategy.
- Clearly distinguish “most relevant to this briefing” from “most predictive” or “most important in all circumstances”.

If the audit shows that a separate featured-driver section causes repetition, place the highlights inside the five-group overview or use anchored emphasis within the canonical list instead.

### 4.2 Secondary global context

#### Section 4 — Market activity and institutional demand

Keep this as a secondary chapter after the main macro briefing. Organize related measures together, potentially including:

- Central-bank gold demand.
- ETF holdings/flows where data is available and properly licensed.
- London vault inventories and clearing activity.
- Investor/trader positioning, including CFTC data.
- Other existing measures of physical or institutional demand.

Requirements:

- Deduplicate CFTC positioning and gross-long measures across the context cards and dedicated Gold Positions section.
- Do not remove the underlying model input just because one visual presentation is redundant.
- Use clear, distinct visualizations for stock, flow, activity, and positioning data.
- Keep unavailable or licensed data transparent without turning the main page into a licensing notice.

#### Section 5 — What markets expect

Keep Federal Reserve calendar information and Polymarket expectations together in one dedicated section.

- Explain what each item represents in simple terms.
- Label prediction-market figures as market-implied expectations, not facts or guaranteed outcomes.
- Do not imply that an event probability is itself a gold-price probability.
- Preserve event dates, time zones, sources, and freshness.
- Make this section secondary to the current gold briefing.

#### Section 6 — Gold relative to other markets

Group existing comparisons by the question they answer: relative value, competition, or cross-asset context. Audit the current set before deciding the final membership.

- Avoid mixing price ratios, investor flows, and macroeconomic indicators in one undifferentiated card grid.
- Explain what a comparison can and cannot tell the visitor.
- Use normalized historical comparisons where units differ and normalization is methodologically appropriate.

### 4.3 Advanced and historical exploration

#### Section 7 — Technical gold-price context

Retain technical reference material, but redesign it for comprehension:

- Moving averages.
- Current price relative to selected averages.
- Pivot/reference levels where still supported.
- Historical cross events where meaningful.

Prefer a clear price map or timeline with the current price and reference levels rather than a wall of technical tables. Label these as reference/context levels, not predictions or guaranteed support/resistance.

#### Section 8 — How gold’s forces connect

Provide the dedicated advanced relationship explorer/map requested by the owner. It should help interested visitors understand the conventional links among the dollar, borrowing returns, inflation expectations, uncertainty, institutional demand, investor flows, positioning and gold. Keep it secondary to the main briefing and link to relevant indicator details. Use only researched relationship records, distinguish mechanisms from correlations and causation, and show historical/regime changes only where reliable data supports them.

#### Section 9 — Gold through history

Keep Gold Episodes toward the lower part of the page.

- Present historical episodes as concise stories with the context, period, and relevant drivers.
- Avoid overwhelming the main briefing with a long historical library.
- Clearly distinguish completed historical episodes from current conditions.
- If a required dataset is still unavailable, show an honest designed waiting/unavailable state; do not present empty charts as complete functionality.

#### Section 10 — If You'd Bought

Keep the investment comparison calculator as a secondary interactive tool.

- Explain what the comparison does and the limitations of historical returns.
- Clearly show selected period, initial amount/contribution assumptions, currencies, units, and end date.
- Keep the tool understandable without turning it into a recommendation or implication of future performance.

#### Section 11 — Iranian gold market (regional chapter)

Retain the Iran Bridge near the bottom as a distinct regional experience, not as a core global-market driver.

- Clearly label the geography and currencies.
- Separate global gold analysis from Iranian currency effects, domestic retail prices, coin premiums, and local karat prices.
- Keep the visual and navigation treatment clearly regional.
- Do not let Iran-specific cards appear in the global hero or five-force overview unless there is a separately justified global use case.

#### Section 12 — Sources, methodology and publication notes

Keep the main reading flow clean while preserving transparency.

- Provide a concise, discoverable data-quality summary.
- Put extended missing-data, licensing, methodology, and publication notes in a clearly labelled disclosure near the footer.
- Tailor the message to the actual reason for absence: unavailable source, licence restriction, delayed update, stale data, insufficient history, or technical error.
- Never imply that the full analysis is complete if a key input is unavailable.

### 4.4 Section navigation

The owner selected a sticky section navigation.

- Desktop: use a compact sticky anchor navigation that helps visitors understand where they are without competing with the hero.
- Mobile: use a mobile-native compact section index, such as a horizontally scrollable anchor strip or another tested pattern. Do not simply shrink a wide desktop nav.
- Highlight the current section without excessive movement or animation.
- Ensure sticky elements do not obscure headings, focused controls, or anchor destinations.
- Keep the primary sections visually distinct from regional and advanced chapters.

---

## 5. Indicator explanation and bilingual content system

Every unique visible indicator must have an explanation record in both Persian and English. Runtime display follows the selected site locale; never display both languages simultaneously in the same indicator presentation.

### 5.1 Required content dimensions for each indicator

| Field | Requirement |
|---|---|
| Plain-language label | Human-readable label that can be understood before the technical name. |
| Technical/original name | Preserve the recognized financial/economic name as a secondary label. |
| What it measures | State what is actually being measured, not merely what the indicator is called. |
| Why it matters for gold | Explain the plausible relationship with gold in cautious language. |
| When it rises | Describe what a higher reading may mean, accounting for the indicator's polarity and context. |
| When it falls | Describe what a lower reading may mean, accounting for the indicator's polarity and context. |
| Everyday analogy/example | Add a short relatable analogy where it materially helps; avoid forced or childish analogies. |
| Visual reading | Explain what the selected chart/range/bar means and identify the current reading. |
| Relationship to other indicators | Link related factors and explain interactions or conflicting evidence where relevant. |
| Data context | Preserve unit, reference period, timestamp/freshness, source, status, and methodology in the appropriate level of detail. |

The seven owner-requested explanation dimensions (what it measures; why it matters; high; low; analogy; visual/current position; relationships) are mandatory content coverage. Some may be combined in the default copy, but none should be silently omitted from the content record.

### 5.2 Progressive explanation depth

**Default indicator view:**

- Plain-language label.
- Shortest useful explanation, usually one or two sentences depending on complexity.
- Clear visual and current interpretation.
- Gold impact state: supports, pressures, mixed/neutral, or unavailable.

**Expanded explanation:**

- Why this indicator matters.
- What high and low readings may mean.
- Analogy/example where useful.
- Relevant relationships to other indicators.

**Technical details:**

- Original technical label.
- Raw value and unit.
- Data timestamp and source.
- Historical reference/percentile definition.
- Calculation/methodology and known limitations.

The exact number of sentences must follow comprehension, not a fixed word-count quota. Concision is the goal, but not at the expense of accuracy.

### 5.3 Copy standards

- Write native, natural Persian and English separately; do not rely on literal machine translation.
- Use clear adult language. It may be conversational and relatable, but should not sound childish, patronizing, or promotional.
- Avoid unexplained abbreviations and jargon in prominent labels.
- Use cautious formulations: “may support”, “can put pressure on”, “is often associated with”, “currently points to”, “in this period”.
- Explain uncertainty and exceptions, particularly when relationships can reverse or weaken.
- Never describe an indicator as universally good/bad.
- Do not make every indicator sound equally important.
- Keep financial language editorial and neutral; do not tell visitors to buy or sell.

### 5.4 Content quality control

- Maintain a canonical content registry keyed by stable indicator IDs, not display labels.
- Ensure every unique indicator has fa/en coverage for required fields.
- Reuse the same canonical explanation wherever an indicator is referenced elsewhere.
- If an indicator has multiple distinct measures or views, explain the distinction rather than treating them as duplicate names.
- Run the repository's existing copy-audit workflow and update its manifest only through the approved process.


### 5.5 Conventional indicator relationships and visual relationship explorer

The owner expects Currena to explain the common and conventional relationships that help visitors understand why gold reacts to economic and market conditions. This is not a request to claim that every possible correlation is established or causal.

Required deliverables:

- A relationship record for each meaningful indicator connection, keyed by stable indicator IDs.
- A short explanation available from the relevant indicator's own detail panel.
- A dedicated advanced **relationship explorer/map** that lets interested visitors explore how the main forces and indicators connect.
- A coverage matrix showing which conventional relationships were researched, included, excluded, or blocked for insufficient evidence.

For each relationship, record:

- The two or more indicators/concepts involved.
- The common proposed mechanism or interpretation.
- Whether it is an economic mechanism, a historical association/correlation, a conditional relationship, or a causal claim with specific evidence.
- Typical direction, if one is defensible, and important exceptions.
- Whether the relationship changes across periods/regimes.
- Supporting sources/methodology and a concise fa/en explanation.

Examples to investigate (not assumptions to hard-code): US dollar and international gold; real yields and non-yielding gold; nominal yields versus inflation expectations; inflation expectations and purchasing power; financial uncertainty and safe-haven demand; central-bank purchases and structural demand; ETF flows and investor demand; positioning and crowded trades; and the interaction among rates, currency, risk appetite and gold.

Do not imply a universal one-way relationship. Distinguish a plausible economic mechanism from a statistical correlation, and a correlation from causation. If the evidence is regime-dependent, show that caveat and use historical visualization only when data coverage supports it.

---

## 6. Visual language and visualization framework

### 6.1 Overall art direction

**Professional market intelligence with unusually accessible visual storytelling.**

The design should feel credible, precise, modern, editorial, and composed. It should not look like a toy, a children's learning app, an overloaded trading terminal, or a generic stack of pale cards.

Use the existing Currena design system as the foundation. Combine a modern analytical dashboard with expressive, educational visual storytelling, while retaining the restraint and credibility of an editorial financial publication. Use variable visual density according to importance: spacious for the briefing, more compact for supporting and advanced material. The redesign may introduce a more distinctive visualization language, but it must remain cohesive with the rest of the product.

### 6.2 Visualization principle

Choose the visual form based on the real data type and the question a visitor needs answered. Do not use one generic gauge for every indicator.

| Data/question type | Candidate visual form | Required caution |
|---|---|---|
| Current gold price and recent movement | Prominent XAU/USD spot price per troy ounce, period-labelled change, concise sparkline or price chart | Verify the actual instrument/source; keep observed movement separate from the balance/outlook model. |
| Forward-looking outlook | Plain-language directional statement plus conditional scenario cards/paths where supported | Do not display unsupported target prices, probabilities, or fake precision; state horizon and uncertainty. |
| Overall gold conditions | Existing balance concept, redesigned as a readable composition of supporting, pressuring, and mixed forces | A balance is not automatically a price forecast. Show composition and unknowns. |
| Five driver groups and overall balance | Five visual lanes feeding/explaining one aggregate balance composition | Keep the five group summaries legible and the aggregate meaning distinct; do not imply equal strength or certainty. |
| Conventional indicator relationships | Dedicated relationship map/explorer plus concise links in each relevant indicator detail | Clearly distinguish mechanisms, correlations, conditional relationships and causation. |
| Historical position/percentile | Range with current marker and a clearly named lookback/reference period | Define the population and period; do not imply a universal good/bad scale. |
| Rate/yield decomposition | Stacked composition or decomposition diagram | Keep units and components clear; totals must reconcile where mathematically appropriate. |
| Macro/economic time series | Time-series chart with readable events/periods | Use correct axes and avoid causal interpretation from correlation alone. |
| Rolling correlation | Timeline around zero with positive/negative regions and a named window | Correlation is not causation; show the rolling period. |
| Flows and demand | Inflow/outflow or directional flow visualization | Distinguish flow over a period from stock at a point in time. |
| Investor positioning | Diverging/zero-centred bars or a well-labelled historical range | Make long/short/net/gross definitions unambiguous. |
| Cross-asset comparison | Normalized indexed lines or clearly labelled ratio comparison | Do not compare raw unlike units on one axis. |
| Technical reference levels | Price map with current price and reference levels | Levels are descriptive references, not guaranteed support/resistance or predictions. |
| Central-bank/institutional demand | Time-series or period comparison with concise explanation | Respect source coverage, lag, and revisions. |
| Fed calendar | Compact event timeline/list | Preserve dates, time zones, and event status. |
| Polymarket expectations | Clearly labelled market-implied probability display | Not a probability of gold moving by the same percentage. |
| Historical episodes | Timeline or episode cards with date, context, and relevant evidence | Keep historical and current data clearly separated. |
| Investment comparison | Interactive outcome chart/table with explicit assumptions | Historical results are not future returns or a recommendation. |
| Iran/local premiums | Regional price/constituent breakdown with local units/currency | Keep fully separated from the global market model. |

These are candidates. Session 4 must map every actual indicator and module to a defensible visual form after inspecting its data type, scale, quality, and current implementation.

### 6.3 Color grammar

- Green: supports gold.
- Red: pressures gold.
- Neutral/mixed: neither direction is clear or the model says mixed/neutral.
- Unavailable/stale/error: separate data-quality treatment, not a neutral market signal.

Use the same semantics consistently across all sections. Pair color with labels and accessible icons/patterns. Validate color contrast and red/green accessibility; never rely on color alone.

### 6.4 Number visibility

Visual understanding comes first, but numbers must not disappear where they are essential.

- Show a number prominently when it is the thing being asked about, such as the gold spot price.
- Show values as secondary labels on historical ranges and charts where they help interpret the visual.
- Put dense raw values, technical labels, and methodology into expanded details when they are not needed for a first understanding.
- Preserve units, periods, and timestamps whenever a number is displayed.

### 6.5 Visual quality rules

- Avoid visual noise, unnecessary card borders, too many competing accent colors, and redundant status chips.
- Establish a strict hierarchy between the briefing, group summaries, detailed metrics, and advanced research.
- Avoid decorative illustrations that take more attention than the evidence.
- Use motion only when it clarifies state or interaction; respect reduced-motion preferences.
- Charts must remain legible in Persian RTL and English LTR, desktop and mobile, light and dark themes.

---

## 7. Responsive and interaction strategy

### 7.1 Mobile is a distinct experience

Do not treat mobile as a narrower desktop page.

Mobile priorities:

1. One clear, outlook-first briefing headline.
2. Current XAU/USD spot price and recent movement, immediately visible alongside or just below the headline.
3. One understandable current balance/conditions overview.
4. The five driver-group summaries and up to five relevant individual highlights.
5. Easy access to deeper groups, relationships, and advanced sections through progressive disclosure.

Use progressive disclosure, compact section navigation, appropriately simplified charts, and fewer simultaneously visible elements. Preserve access to the full underlying information.

### 7.2 Desktop and tablet

- Use available width to explain relationships, not simply to place more cards in a row.
- Maintain a readable maximum content width and coherent alignment.
- Sticky navigation should support orientation without dominating the viewport.
- Charts and comparison views may use more detail when it meaningfully improves comprehension.

### 7.3 Interaction patterns

Use **desktop popovers** for individual indicator details and a **mobile bottom sheet (or equivalent native panel)** for the same content on narrow screens. Do not make hover the only way to reveal information. Ensure dismissal, focus management, keyboard access, screen-reader semantics, touch behavior, and deep-link/anchor behavior are correct.

Audit and standardize:

- Expand/collapse behavior for five groups and individual indicators.
- Technical-details disclosures.
- Sticky section navigation and anchor behavior.
- Chart legends/tooltips and accessible summaries.
- Calculator controls and assumptions.
- Historical episode exploration.
- Selected period/range controls, if currently present.
- Keyboard focus, screen-reader names, touch target size, and reduced motion.

Controls must have clear affordances and functional behavior. Do not add interactions merely for decoration.

---

## 8. Data quality, trust and transparency

### 8.1 Data states must be explicit

The UI must correctly distinguish:

- Fresh/current.
- Delayed or stale.
- Temporarily unavailable.
- Unavailable due to licensing/source restrictions.
- Insufficient historical coverage.
- Pending/checking.
- Calculation or loading error.
- Mixed/neutral market interpretation.

A missing metric is not zero, neutral, stable, or evidence that there is no effect.

### 8.2 Missing-data presentation

Use a compact, subtle data-availability summary in the main experience where necessary, with detailed explanations in the footer publication disclosure. Tailor each explanation to the actual reason. Do not hide material limitations that would change the meaning of the overview.

### 8.3 Sources and methodology

Keep attribution discoverable. Exact technical sources, methodology, transformations, reference windows, and known limitations should be available in expanded detail or the publication-notes section.

### 8.4 No unsupported financial claims

No personalized investment advice, buy/sell calls, guaranteed price targets, numerical Currena forecast probabilities, or numerical confidence scores without a documented and validated method. A qualitative evidence-consistency label (aligned, mixed, or limited) is allowed. Clearly distinguish observed price movement, current-condition balance, conditional outlook scenarios, and external market-implied expectations (such as Polymarket).

---

## 9. Repository and engineering boundaries

The project is the Currena repository. The agent must inspect the current repository and current deployed page before making assumptions. Previous documentation and earlier page screenshots may be stale following the recent Gold Page Elevation work.

### 9.1 Required reconnaissance

At the start of Session 1:

1. Read the current root `AGENTS.md`, `README.md`, package scripts, route registry, and relevant architecture docs.
2. Trace the actual `/gold` route to the exact page entry point and rendered component tree.
3. Identify all current sections and their component/data ownership.
4. Distinguish the dedicated Gold feature from any Gold-related Insights page or legacy components.
5. Map each visible item to its canonical data/indicator ID, source, type, unit, freshness and calculation path.
6. Identify every component imported by other routes before modifying it.
7. Record branch, commit, deployment revision if available, and any source/live mismatch.
8. Capture the current real rendered page in the browser; do not claim pixel-level review from source code alone.

### 9.2 Scope

The target is the dedicated `/gold` experience. Shared components may be changed only after their other consumers and regression risk are understood.

The plan allows component/data-composition refactoring and deeper technical changes **when an evidence-based audit shows that they are necessary**. This is not blanket permission to alter financial methodology, data-provider behavior, or unrelated features.

### 9.3 Financial-model protection

Preserve the existing gold model's definitions and outputs unless a demonstrable correctness defect is discovered.

Do not casually change:

- Indicator membership or canonical IDs.
- Lane membership, polarity, weights, thresholds, scoring, balance mathematics, or outlook classification.
- Historical percentile/reference calculations.
- API schemas, data meanings, or unit conventions.
- Provider/source selection, data ingestion, scheduling, polling, cache/KV design, or request frequency.

If the audit finds a real defect or an architecture change that requires any of these:

1. Document the evidence and affected behavior.
2. Explain the user impact and alternatives.
3. Define the tests and migration/rollback considerations.
4. Stop before making the protected change and request owner approval.

Routine component refactoring, display adapters, canonical presentation registries, and i18n/content restructuring may proceed where justified and safely scoped.

### 9.4 Performance and resilience

- Do not add client polling, page-level provider calls, or new network dependencies merely to support visuals.
- Reuse existing cached/snapshotted data and established selectors wherever possible.
- Do not increase provider requests, CPU, KV operations, or page payload without a measured need and an explicit impact assessment.
- Ensure one unavailable indicator does not break the entire page.
- Prefer graceful loading, stale, partial, and error states.

### 9.5 Internationalization and design system

- Use existing i18n architecture; no hardcoded visible copy in components.
- Persian and English copy must be separately authored and naturally phrased.
- Runtime displays only the selected locale.
- Use native RTL/LTR layout and CSS logical properties.
- Preserve locale-aware numbers, dates, currencies, units, and time zones.
- Reuse the existing theme tokens and support light/dark themes where the route currently supports them.
- Follow existing accessibility, lint, type, testing, and Persian copy-audit conventions.

### 9.6 Deployment boundary

Do not deploy, publish, merge, push, change production routing, or alter live data jobs unless the owner explicitly authorizes it.

---

## 10. Phased multi-session execution plan

Each session is a bounded unit of work. The agent must complete its deliverables and update the shared decision log before moving to the next session. A later session must not silently undo a decision from an earlier session.

### Session 1 — Current-state audit and evidence baseline

**Mode:** Read-only reconnaissance and browser audit. No redesign implementation.

**Objective:** Establish exactly what is currently live and how it works after the recent page expansion.

**Tasks:**

1. Read repository instructions and trace the `/gold` route.
2. Verify the live deployment/source revision relationship.
3. Capture full-page and focused screenshots at desktop, tablet, and mobile widths, in Persian and English, and in supported themes.
4. Inspect sticky navigation, expanders, tabs, charts, calculator, historical modules, and all important interaction states.
5. Inventory all page sections and their current order.
6. Inventory all unique indicators and non-indicator modules.
7. Map canonical IDs, display components, data sources, data types, freshness, units, and current explanatory copy.
8. Identify repeated presentations, near-duplicates, competing summaries, and repeated price/balance/outlook modules.
9. Audit visual hierarchy, cognitive load, responsive UX, accessibility, and missing/stale/error states.
10. Record known incomplete features or data dependencies (for example, historical data modules that are intentionally waiting for a dataset).

**Deliverables:**

- `docs/gold-redesign/01-current-state-audit.md`
- `docs/gold-redesign/02-section-and-component-map.md`
- `docs/gold-redesign/03-indicator-and-module-inventory.csv` (or Markdown table if CSV is awkward)
- `docs/gold-redesign/04-duplicate-and-overlap-matrix.md`
- `docs/gold-redesign/baseline-screenshots/`
- Initial `docs/gold-redesign/DECISION_LOG.md`

**Acceptance criteria:**

- Every current page section is accounted for.
- Every unique indicator is mapped to a canonical ID or explicitly marked unresolved.
- Every suspected duplicate is supported by component/data evidence; similar names alone are not enough.
- Desktop and mobile have been inspected in both locales, or the report states precisely what could not be tested.
- Findings have severity, evidence, user impact, and recommendation.
- No code or production behavior has been changed.

**Handoff:** A factual picture of the current product, not a proposed redesign.

---

### Session 2 — Product hierarchy, visitor journey and information architecture

**Mode:** Strategy and architecture proposal. Do not implement the page yet.

**Objective:** Convert the owner's decisions and Session 1 evidence into the final section hierarchy and content placement rules.

**Tasks:**

1. Define the first-15-second experience and the 3–5-minute experience.
2. Define the outlook-first hero and distinguish spot-price movement, current balance/conditions, and the separate forward-looking outlook.
3. Specify candidate outlook horizons (1–2 weeks, 1–3 months, 6–12 months) and prove which are supported by current methods/data; define qualitative direction, scenarios, evidence consistency, and “what could change this” rules.
4. Define the briefing editorial template: headline, one summary sentence, two or three reasons, concise invalidation/caveat, plus a separately labelled current-conditions balance.
5. Confirm how the existing five groups should be labelled and presented to a general audience.
6. Decide dynamic-highlight rules: up to five individual indicators, group summaries always visible, exceptional callouts only with explicit rationale; combine existing model relevance, historical unusualness, and narrative relevance without inventing an opaque score.
7. Establish the canonical home for every unique indicator and module.
8. Produce the final duplicate-resolution matrix, including CFTC positioning/gross-long and any newly discovered overlap.
9. Place institutional demand, market expectations, asset comparisons, technical context, historical episodes, the investment calculator, and the compact expandable Iran Bridge in the hierarchy.
10. Design desktop sticky navigation and a mobile-specific section index.
11. Define which sections are visible by default, collapsed, summarized, or linked to deeper experiences.
12. Identify any feature that should become a separate route, but do not create a new route without documenting the trade-off and scope.

**Deliverables:**

- `docs/gold-redesign/05-product-principles-and-visitor-journey.md`
- `docs/gold-redesign/06-final-information-architecture.md`
- `docs/gold-redesign/07-canonical-placement-and-deduplication-plan.md`
- Updated decision log.

**Acceptance criteria:**

- The page has one clear main briefing, not multiple competing heroes.
- The five-force overview and five detailed groups have a coherent relationship.
- The dynamic-highlight mechanism is explainable and does not produce duplicate UI.
- Global analysis and Iranian regional analysis are clearly separated.
- Every existing feature has an explicit decision: primary, secondary, advanced, regional, relocated, or removed—with rationale.
- No financial indicators are deleted from the model simply because a UI presentation is redundant.

**Checkpoint:** If the audit shows that the proposed hierarchy would require a financial-model change, the plan documents it and requests owner approval before implementation.

---

### Session 3 — Indicator taxonomy and bilingual explanation system

**Mode:** Data/content design and copy production. Avoid visual implementation beyond small content prototypes.

**Objective:** Make every unique indicator understandable without turning the page into an educational textbook.

**Tasks:**

1. Confirm the final list of unique indicators from the current source, not an old documentation count.
2. Confirm canonical IDs, plain-language labels, technical names, units, reference periods, and data type.
3. Create a consistent content schema for all required explanatory dimensions.
4. Write natural Persian and English explanations for every unique indicator.
5. Explain why each indicator matters to gold, including conditions and caveats.
6. Explain what rising and falling readings may mean, based on the indicator's actual polarity and methodology.
7. Add an everyday analogy or short real-world example only when it genuinely clarifies the concept.
8. Describe the visual reading: what is being compared, the current marker, the reference period, and what the viewer should notice.
9. Map conventional relationships to other indicators, supported by evidence and appropriate sources.
10. Distinguish economic mechanisms, historical correlations, conditional relationships, and causal claims.
11. Flag indicators whose relationship with gold is time-varying, conditional, weak, or disputed.
12. Identify indicators for which the data is insufficient to support a simple directional claim.
13. Write concise default copy and expanded explanation separately where useful.

**Deliverables:**

- `docs/gold-redesign/08-indicator-content-schema.md`
- `docs/gold-redesign/09-indicator-explanations-fa-en.md` or a structured locale content file in the repository
- `docs/gold-redesign/10-indicator-relationship-map.md` (include the relationship explorer taxonomy and evidence classification)
- Explanation coverage report showing complete/missing fields for every unique indicator.

**Acceptance criteria:**

- 100% of unique visible indicators have natural Persian and English coverage for all required dimensions, or are explicitly blocked with a documented reason and owner decision.
- The runtime design will show only the selected locale.
- Technical names are preserved but secondary.
- Explanations do not turn correlations into causes or conditions into predictions.
- Default copy is short and understandable; deeper explanation remains available.
- No unsupported market claims or investment recommendations are introduced.

**Handoff:** A verified content foundation, not copy embedded ad hoc in components.

---

### Session 4 — Visual system and metric-to-visual mapping

**Mode:** Design specification and prototype/reference work. No broad production implementation yet.

**Objective:** Define a coherent visual language that makes the market briefing intuitive and gives each data type the right visual form.

**Tasks:**

1. Inspect the current Currena design tokens, typography, color, cards, charts, and themes.
2. Define the professional-market-intelligence art direction and visual hierarchy.
3. Define the green/supports and red/pressures color semantics, with neutral/mixed and unavailable states.
4. Create one coherent visual grammar combining five visual lanes with the aggregate gold balance; the lanes must explain the balance composition.
5. Map every indicator and module to a suitable visualization.
6. Define how current position, history, range, unit, period, freshness, and uncertainty are represented.
7. Design the default and expanded indicator patterns.
8. Define chart labels, legends, tooltips, accessible text alternatives, desktop indicator popovers, and mobile bottom sheets.
9. Prototype the outlook/scenario presentation and relationship explorer, as well as the most important difficult cases: historical percentile, yield decomposition, rolling correlation, flows versus stocks, CFTC positioning, and technical reference levels.
10. Ensure metaphors clarify rather than distort the financial concept.
11. Define variable visual density: spacious primary briefing, compact secondary/advanced material.

**Deliverables:**

- `docs/gold-redesign/11-visual-design-principles.md`
- `docs/gold-redesign/12-visualization-mapping.md`
- Visual references, component sketches, or implementation-ready diagrams for core patterns.
- Color/status semantics and chart-accessibility rules.

**Acceptance criteria:**

- Each data type has a justified visual form.
- No generic gauge is applied to every metric.
- The current gold balance is readable without looking like a guaranteed price prediction.
- Current conditions and forward-looking scenarios have distinct visual identities.
- The five lanes and aggregate balance read as one coherent explanatory system.
- Relationship diagrams distinguish mechanisms from correlation and avoid implying unsupported causation.
- Colors encode relationship to gold, not generic positive/negative sentiment.
- Every chart can be understood in Persian RTL and English LTR.
- Mobile variants are specified before implementation.

---

### Session 5 — Implement the primary gold briefing

**Mode:** Production implementation, limited to the core experience.

**Objective:** Rebuild the first screen and the five-force overview around the visitor's main question.

**Scope:**

- Gold today hero.
- Current price and recent movement presentation.
- One dominant, outlook-first market briefing.
- A separate forward-looking outlook/scenario presentation only for horizons validated in Session 2.
- Existing balance/conditions concept, separately labelled from the outlook.
- Combined five-force overview.
- Five group summaries and their expandable detail containers.
- Sticky section navigation foundation.
- Deduplication within the primary experience.

**Tasks:**

1. Implement the approved Session 2 hierarchy and Session 4 visual patterns.
2. Integrate Session 3 copy through the existing locale system.
3. Ensure price, movement, current balance/conditions, and forward-looking outlook are not conflated.
4. Implement the agreed headline + summary + reasons + “what could change this” briefing format, including qualitative evidence consistency and conditional scenarios where supported.
5. Implement clear data freshness and uncertainty.
6. Implement the five group summaries and expand/collapse behavior.
7. Make dynamic highlights consistent with canonical indicator placement.
8. Remove repeated UI presentations only after verifying the canonical source and retaining needed model inputs.
9. Test desktop, tablet, mobile, Persian, English, light, and dark modes.

**Deliverables:**

- Implemented core briefing and five-force overview.
- Focused component tests and/or integration tests.
- Updated screenshots.
- `docs/gold-redesign/13-session-5-implementation-report.md`

**Acceptance criteria:**

- First-time visitor can understand current price, recent direction, and broad gold-supporting/pressuring conditions in approximately 15 seconds.
- One hero dominates; no duplicate balance/outlook summaries compete with it.
- All five groups are understandable without opening the detailed lists.
- Featured indicators do not appear as duplicate cards.
- No protected financial logic or data pipeline was changed without approval.

---

### Session 6 — Implement global market context and expectations

**Mode:** Production implementation for secondary global-context sections.

**Objective:** Retain the useful new research additions while presenting them in coherent, secondary chapters.

**Scope:**

- Institutional demand and market activity.
- Central-bank and London-market context.
- ETF/positioning content where supported.
- Gold comparisons with other assets.
- Federal Reserve calendar and Polymarket expectations.
- Dedicated conventional indicator relationship explorer/map.
- Deduplication of CFTC and other repeated measures.

**Tasks:**

1. Group stock, flow, positioning, relative-value, and event/expectation data coherently.
2. Consolidate duplicate CFTC gold-positioning and gross-long presentations (verify actual current IDs and views in Session 1 before changing).
3. Keep each canonical indicator in one primary presentation.
4. Distinguish context-only indicators from model voters.
5. Explain central-bank and institutional demand in accessible language.
6. Label market-implied expectations correctly.
7. Preserve data coverage, lag, source, and unavailable states.
8. Avoid adding data requests or polling solely for the redesign.
9. Ensure the relationship explorer uses only verified relationship records and clearly labels mechanisms, correlations, conditional relationships and causal evidence.

**Deliverables:**

- Implemented secondary global-context sections.
- Updated duplicate matrix and tests.
- `docs/gold-redesign/14-session-6-implementation-report.md`

**Acceptance criteria:**

- Related market-context indicators are grouped by what they measure.
- Repeated CFTC/positioning information has one canonical presentation unless a second view is demonstrably distinct and clearly explained.
- No unavailable institutional data is presented as normal data.
- Polymarket/Fed content is clearly secondary and does not imply a gold-price forecast.
- No new provider requests or polling are introduced without explicit approval.

---

### Session 7 — Implement advanced, historical and regional experiences

**Mode:** Production implementation for lower-priority material.

**Objective:** Keep the page's richer capabilities without allowing them to overwhelm the main briefing.

**Scope:**

- Visually simplified technical analysis.
- Gold Episodes.
- “If You'd Bought” comparison calculator.
- Iran Bridge as a separate regional chapter.
- Footer methodology, sources, licensing and missing-data disclosures.

**Tasks:**

1. Convert technical reference tables into clear, labelled visual explanations where the data supports it.
2. Keep technical analysis secondary and avoid predictive wording.
3. Retain Gold Episodes near the bottom with historical context and clear data availability.
4. Keep the investment calculator secondary and show assumptions/limitations.
5. Keep the Iran Bridge near the bottom and visibly separate the regional market from global analysis; show a compact introduction with expandable detailed content.
6. Keep the detailed missing-data/licensing explanations in the footer disclosure while maintaining an honest main-page availability summary.
7. Check every lower-page module for overlap with the hero and five-force sections.

**Deliverables:**

- Implemented lower-priority chapters.
- Updated section navigation.
- `docs/gold-redesign/15-session-7-implementation-report.md`

**Acceptance criteria:**

- Technical references are understandable without specialist tables as the default.
- Historical experiences are clearly marked as historical.
- Calculator assumptions are transparent and do not imply future performance.
- Iranian-market data is clearly regional, compact by default, expandable on demand, and cannot be mistaken for the global gold model.
- Missing data and licensed data are disclosed accurately.

---

### Session 8 — Mobile-first refinement, interactions and accessibility

**Mode:** Cross-page refinement and QA remediation.

**Objective:** Ensure the design is coherent and usable across devices, locales, themes, and interaction states.

**Tasks:**

1. Re-evaluate mobile information hierarchy independently from desktop.
2. Refine compact section navigation and anchor behavior.
3. Optimize the five-force visualization and indicator patterns for narrow widths.
4. Test expanded/collapsed content and long Persian/English labels.
5. Test desktop indicator popovers and mobile bottom sheets, chart legends/tooltips, keyboard use, focus order, touch targets, and screen readers.
6. Validate status labels and color contrast; ensure no status depends on color alone.
7. Test reduced-motion behavior.
8. Test loading, stale, unavailable, insufficient-history, error, and partial-data states.
9. Check for horizontal overflow, clipping, unreadable labels, and sticky-element overlap.
10. Confirm that technical details remain discoverable without cluttering the default experience.

**Deliverables:**

- Responsive and accessibility refinement.
- `docs/gold-redesign/16-responsive-accessibility-report.md`
- Mobile/desktop fa/en screenshots and interaction evidence.

**Acceptance criteria:**

- Mobile is a deliberate layout, not merely a compressed desktop view.
- No horizontal overflow at agreed mobile widths.
- Sticky navigation does not obscure content or focus.
- RTL/LTR and light/dark modes remain correct.
- All important chart/indicator meanings have text equivalents.
- All important data states remain distinguishable.

---

### Session 9 — Final verification, regression and handoff

**Mode:** Verification and documentation. No new feature scope.

**Objective:** Prove the final page preserves the model, presents the intended hierarchy, and remains robust.

**Tasks:**

1. Repeat the original screenshot matrix at the same sizes, locales, and themes.
2. Compare before/after screenshots and record material changes.
3. Re-run the indicator inventory and duplicate audit.
4. Check explanation coverage for every unique indicator in both locales.
5. Test canonical rendering so each unique indicator appears in the intended location(s) only.
6. Verify that the model's inputs, output definitions, polarity, thresholds, scoring, and data states are unchanged unless explicitly approved.
7. Run relevant typecheck, lint, test, build, copy-audit, and self-check commands discovered in the current repository.
8. Check performance and ensure no unapproved network/data-fetch behavior was added.
9. Document known limitations, unfinished datasets, and any owner decisions still required.
10. Produce a concise implementation and handoff report.

**Deliverables:**

- `docs/gold-redesign/17-final-qa-and-regression-report.md`
- Final before/after screenshot set.
- Updated `DECISION_LOG.md`.
- Test/build/copy-audit results.
- Final changed-file summary and known limitations.

**Acceptance criteria:**

- Every acceptance criterion in this plan is accounted for as pass, fail, or explicitly blocked.
- No tests are claimed unless actually run.
- No pixel-level audit is claimed without real browser evidence.
- No financial-model or infrastructure change is left undocumented.
- The final page meets the first-15-second and 3–5-minute visitor goals.
- No unapproved deployment, push, merge, or production configuration change has occurred.

---

## 11. Cross-session working protocol

### 11.1 One session at a time

The agent must execute one numbered session per assignment. It must not silently jump ahead and implement future sessions while an earlier decision is unresolved.

A session may identify future work, but must leave it as a handoff note rather than implementing it prematurely.

### 11.2 Required start-of-session procedure

At the beginning of every session, the agent must:

1. Read this plan in full.
2. Read the current root `AGENTS.md`.
3. Read `docs/gold-redesign/DECISION_LOG.md` and the previous session's report.
4. Inspect the current branch and working tree; do not overwrite another agent's changes.
5. Verify whether the relevant files have changed since the previous session.
6. Restate the current session's scope and explicitly list excluded work.

### 11.3 Required end-of-session handoff

At the end of every session, update the decision log and report:

- Work completed.
- Files created/changed.
- Evidence/screenshots.
- Tests and checks actually run, with results.
- Decisions made within existing approval.
- New risks or discoveries.
- Items blocked pending owner approval.
- Exact recommended next session and its prerequisites.

### 11.4 Parallel-agent safety

Do not assume that the repository is untouched by other agents. Check branch, working tree, recent commits, and active changes. Do not reset, revert, overwrite, force-push, or deploy another agent's work. Coordinate shared-file changes and avoid concurrent edits to the same components or dictionaries.

### 11.5 Decision hierarchy

When instructions conflict, follow this order:

1. Current root `AGENTS.md` and repository safety requirements.
2. Owner decisions recorded in this plan and the latest decision log.
3. Verified current source and data contracts.
4. Evidence-based session audit/report.
5. Older documentation, screenshots, and previous specs.
6. Agent preference.

Do not allow older Gold-page specifications to overrule this updated strategy where they conflict. In particular, the current global page retains the Iran Bridge as a bottom regional chapter; it is not to be deleted solely because an earlier brief assumed a global-only page without Iran material.

---

## 12. Definition of success

The redesigned page is successful when:

### For a first-time visitor

- They can identify the current global gold price and recent movement quickly.
- They can understand the broad current conditions around gold without knowing financial jargon.
- They can distinguish current conditions from the separate, horizon-labelled forward-looking outlook and its conditional scenarios.
- They can see the main supporting and pressuring forces without reading 37 technical cards.
- The page gives a clear, cautious briefing without pretending that a conditions model is a guaranteed forecast.

### For a curious investor

- They can understand why the market assessment looks the way it does.
- They can inspect the most relevant indicators and relationships.
- They can explore institutional demand, market expectations, historical context, and comparisons.
- They can distinguish current market evidence from historical context and speculation.

### For an advanced visitor

- Technical names, raw values, sources, units, periods, methodologies, and limitations remain available.
- The visual simplification does not remove analytical depth or change the underlying meaning.

### For Currena

- The page has one coherent identity and hierarchy.
- Each unique indicator has one canonical explanation and presentation.
- Redundant visualizations are consolidated without deleting useful model inputs.
- Persian and English experiences are both natural and correctly laid out.
- Mobile is purpose-designed.
- Existing financial calculations and data integrity are protected.
- The richer new research features are retained where they add real value, but no longer compete with the main briefing.

---

## 13. Copy-paste agent kickoff instruction

Use this instruction when assigning the work to an AI coding agent:

> Read `CURRENA_GOLD_UX_STRATEGY_AND_PHASED_PLAN.md` in full, together with the repository root `AGENTS.md`. This plan contains the owner's confirmed product decisions and the nine-session execution sequence. Begin with **Session 1 only**: perform a read-only current-state repository and browser audit of the deployed `/gold` page, capture real evidence, map all sections/components/indicators, and produce the required audit deliverables. Do not implement redesign changes in Session 1. Do not assume earlier screenshots or specifications represent the current page. Do not change financial-model logic, data sources, ingestion, provider requests, or production behavior. At the end, update `docs/gold-redesign/DECISION_LOG.md` and provide a precise handoff for Session 2. Execute only one session per assignment; do not proceed to the next session until explicitly instructed.

---

## Appendix A — Session completion checklist

Use this checklist at the end of each session:

- [ ] Read current `AGENTS.md` and this plan.
- [ ] Confirmed scope and excluded work.
- [ ] Checked branch, working tree, and other agents' changes.
- [ ] Completed the session's objectives.
- [ ] Produced all required deliverables or documented blockers.
- [ ] Updated the decision log.
- [ ] Recorded files changed.
- [ ] Recorded screenshots/evidence.
- [ ] Recorded tests/checks actually run.
- [ ] Documented risks and owner-approval requirements.
- [ ] Provided the next-session handoff.
- [ ] Did not deploy, push, merge, or modify production behavior without authorization.

## Appendix B — Non-negotiable product principles at a glance

1. Brief first; explain second; technical depth on demand.
2. Current price, observed movement, current conditions, and forward-looking outlook must remain distinct.
3. The gold balance remains central but is not misrepresented as a forecast.
4. Five groups provide the overview; individual metrics explain the details.
5. Highlight the most relevant drivers dynamically without duplicating their canonical presentation.
6. Every unique indicator has complete concise fa/en explanation coverage.
7. Visuals lead; numbers and technical details remain available where useful.
8. Green means supportive of gold; red means pressure against gold; neutral and unavailable are distinct.
9. Keep the Iran Bridge as a clearly separate regional chapter near the bottom.
10. Keep advanced and historical capabilities, but give the main briefing priority.
11. Preserve the integrity of financial calculations and data; technical changes require evidence and appropriate approval.
12. Design mobile as its own experience.
13. Publish only outlook horizons supported by defensible methods and data.
14. Explain conventional indicator relationships without conflating mechanism, correlation and causation.
15. Use desktop popovers and mobile bottom sheets for indicator details.
