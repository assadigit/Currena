> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.
# Gold Visual Explanation Atlas

**Companion to:** `GOLD_INTELLIGENCE_AND_VISUAL_EXPLANATION_UPGRADE.md`  
**Purpose:** Specify how each actual Gold metric, group and established economic relationship is translated into an understandable visual, with numerical evidence available for verification.

---

## 1. Core rule

Do not redesign 37+ cards one by one and then place all of them on the page. Build a visual explanation system that distils the underlying data into a few coherent stories.

The three-layer structure is mandatory:

- **Briefing — Flower and Fruit:** the result a visitor came to find.
- **Supporting Visuals — Leaves and Tree:** the economic forces and mechanisms that explain the result.
- **Expert Cards and Numerical Data — Roots:** the detailed evidence that verifies the visuals and briefing.

The metaphor is an information hierarchy, not a requirement to draw a literal tree.

## 2. Inventory rule: count the real things separately

The first audit must not assume that the old number “37” is the same as the number of model voters, engine lanes, unique metrics or rendered cards. Populate this atlas from current source code, current browser output and canonical data definitions.

Maintain distinct inventories for:

1. Unique canonical metric IDs on `/gold`.
2. Gold balance voters/inputs.
3. Context-only measurements.
4. Price and technical-analysis series.
5. Institutional demand, ETF, vault and market-activity measures.
6. Positioning measures.
7. Market-expectation/event data.
8. Relative-value/asset comparison measures.
9. Regional Iranian-market measures.
10. Repeated UI presentations of the same canonical metric.

A metric may appear in several analytical calculations but should have one canonical expert-data record and a deliberate primary UI placement. Other uses should reference that record, not create a confusing duplicate card.

## 3. Required mapping register

Create one row for every unique canonical metric. Fill the exact current ID and facts from the repository; do not invent names, values, sources or history.

| Field | Required content |
|---|---|
| Canonical ID | Exact stable ID from current code/registry |
| Friendly name | Plain-language visitor label |
| Technical name | Established specialist terminology |
| Type | Rate, yield, index, flow, stock, position, ratio, price, event, etc. |
| Unit | Exact unit and scale |
| Cadence | Actual update frequency and expected freshness |
| Role | Voter, context-only, price, technical, market context, etc. |
| Model mapping | Existing engine lane/group and polarity; do not infer |
| What it measures | One-sentence definition |
| Why it matters to gold | Mechanism or qualified relationship |
| Current interpretation | Plain-language meaning of the current verified reading |
| High/low interpretation | What higher/lower values may mean, with caveats |
| Visual family | The most appropriate visual type |
| Main-layer use | Briefing, supporting visual, or Roots only |
| Default visibility | Visible or expandable, with rationale |
| Data evidence | Source, observation date, reference window, missing-data state |
| Relationships | Related canonical metric IDs and evidence class |
| Limitations | Regime changes, weak evidence, proxy limits, revisions, etc. |
| QA status | Verified, partial, missing, not currently available |

The completed atlas must contain no unexplained blank fields for the indicators that are promoted into the main briefing. If an item lacks sufficient data to support interpretation, mark it as unavailable/insufficient rather than guessing.

## 4. Visual families and when to use them

Use a compact, consistent family of visualization primitives. Choose based on the meaning of the data, not on visual novelty.

### V1 — Economic mechanism / flow diagram

**Use for:** explaining why a conventional relationship may exist.

Example structure:

`Higher real yields → more attractive inflation-adjusted bond returns → higher opportunity cost of holding non-yielding gold → potential pressure on gold.`

Requirements:
- Plain-language labels on every step.
- Use conditional language where the mechanism is not deterministic.
- Show which observed metrics support the current statement.
- Do not imply every step happened in the current market unless current data verifies it.

### V2 — Yield / return decomposition

**Use for:** nominal yield, inflation expectations, real yield and related borrowing-cost concepts.

Potential form: a bridge/waterfall or stacked decomposition that explains how nominal return and inflation expectations relate to an inflation-adjusted return.

Requirements:
- State the exact series and calculation convention.
- Explain real yield in everyday language.
- Use the data's actual units and observation period.
- Avoid an inaccurate simplified equation if the selected series uses a different convention.

### V3 — Currency-strength comparison

**Use for:** US dollar index/basket measures and other currency comparisons.

Potential form: a clear strengthening/weakening direction, current value, recent trajectory, and comparison with its own history.

Explain that dollar-denominated gold can become more or less expensive for buyers using other currencies. Do not overstate a stable inverse relationship.

### V4 — Inflation and expectations comparison

**Use for:** realized inflation, expected inflation, breakevens and purchasing-power context.

Potential form: two aligned lines or a spread/decomposition showing actual and expected inflation over a stated period.

Explain what is observed, what is expected by markets, and how expectations may affect real yields. Do not label market-implied expectations as guaranteed future inflation.

### V5 — Market-stress / uncertainty progression

**Use for:** volatility, financial stress and uncertainty indicators.

Potential form: a calm-to-stressed continuum plus a small history chart or event annotations.

Explain what the specific index measures. Do not make all stress indexes look interchangeable, and do not claim that stress always causes gold to rise.

### V6 — Stock vs flow

**Use for:** central-bank gold holdings, ETF holdings, vault inventories, purchases/sales and clearing activity.

Potential form: a stock illustration (how much is held) plus a separate flow graphic (how much was added/removed over a period).

Critical rule: holdings are a stock; purchases/sales are a flow. Never conflate total holdings with the size of purchases during the period.

### V7 — Investor positioning

**Use for:** CFTC longs, shorts, gross-long, gross-short and net-position measures.

Potential form: a diverging or stacked bar with long and short sides, plus a trend/history view.

Explain who is being measured and what “long” or “short” means. Distinguish gross long, gross short and net positioning. Do not present positioning as the same thing as actual physical demand or a guaranteed price signal.

### V8 — Relative performance / ratios

**Use for:** gold vs silver, oil, platinum, Bitcoin, equities or other assets.

Potential form: a ratio chart or normalized indexed performance chart, clearly naming the denominator and base date.

Explain whether the visual shows relative performance, relative price or correlation. These are not interchangeable.

### V9 — Historical price path / technical reference map

**Use for:** spot price, moving averages, pivots and historical episodes.

Potential form: a price chart with clearly labelled reference levels and period. Treat moving averages/pivots as descriptive context, not guaranteed support/resistance or predictive signals.

### V10 — Conditional scenario path

**Use for:** the forward-looking outlook only when a defensible method exists.

Potential form: base/upside/downside paths or a branching scenario diagram with clearly stated triggers and assumptions.

Do not draw a fan chart or numerical band unless the method supports the displayed uncertainty range. Otherwise use qualitative scenario branches without fabricated probabilities or prices.

### V11 — Attribution / contribution graphic (restricted)

**Use only if:** a validated attribution method measures the contributions of forces to an observed gold-price move or to a model output.

Do not use percentage contribution labels merely because the UI would look clearer. If the available model only counts directional signals or votes, label it as signal composition/count—not actual price impact.

### V12 — Historical position/range (supporting context)

**Use for:** showing whether an indicator is unusual relative to a justified historical sample.

This is a secondary visual family. State the sample period and what the percentile/range means. A percentile is not a probability of a gold-price move. Do not let this be the only visual form for most concepts.

## 5. Candidate mapping by concept (to validate against the actual inventory)

This is a design guide, not an assertion that every metric currently exists in Currena.

| Economic concept | Visitor's question | Preferred visual | Supporting evidence / cautions |
|---|---|---|---|
| Real yields | What return can investors keep after inflation? | Yield decomposition + opportunity-cost mechanism | Exact yield series, unit, period, calculation convention; relationship can vary by regime |
| Nominal yields | What interest return is being offered before inflation adjustment? | Line/level visual with historical comparison | Do not imply nominal yield alone determines real attractiveness |
| Inflation expectations | What inflation do markets currently expect? | Expectations line + realized inflation comparison | Market-implied measure is not guaranteed future inflation |
| US dollar strength | Is the dollar strengthening or weakening? | Currency-strength direction + trend | Name the exact index/basket; explain dollar pricing of international gold |
| Financial stress | Are financial conditions unusually tense? | Stress progression + time-series context | Use the named index's actual semantics; stress/gold relation conditional |
| Central-bank holdings | How much gold do official institutions hold? | Stock/holdings illustration + history | Distinguish reported holdings from purchases during the period; reporting lags |
| Central-bank net purchases | Are official institutions adding or reducing gold? | Period flow bars + cumulative trend | Period, reporting coverage and revisions must be explicit |
| ETF holdings | Are funds adding to or reducing gold exposure? | Holdings stock + flow change | Licence/coverage/freshness disclosures; holdings vs flows separated |
| ETF flows | Is money entering or leaving gold funds? | Positive/negative flow bars | State net/gross, currency, period and source |
| Vault inventories | How much gold is held in the relevant vault system? | Stock/inventory chart | Identify the vault system and what inventory does/does not represent |
| Gold clearing activity | How active is the relevant market infrastructure? | Activity/time-series visual | Activity is not automatically demand or directional buying |
| CFTC gross longs | How many/what size of positions are betting on price increases? | Long-position bar + history | Define trader category and contract units |
| CFTC gross shorts | How many/what size of positions are betting on price declines? | Short-position bar + history | Keep distinct from gross longs and net position |
| CFTC net position | What is the balance of reported long and short positions? | Diverging/stacked position visual | Net = defined long-short calculation; not physical demand or forecast |
| Gold/silver ratio | How is gold priced relative to silver? | Ratio chart + historical context | Explain ratio direction; avoid calling it correlation |
| Gold/oil or gold/equity comparisons | How has gold performed relative to another asset? | Normalized relative-performance chart | Define start date/base and comparison meaning |
| Moving averages | Where is price relative to its recent trend references? | Price map with moving-average lines | Descriptive reference, not deterministic prediction |
| Market expectations | What does the market imply about an upcoming event? | Timeline/probability display | Label market-implied expectations; never treat as gold-price probability |

## 6. Three display tiers for every indicator

### Tier 1 — Featured/important metric (visible in the Supporting Visuals layer)

Show only when the metric is relevant to the current briefing or is part of a core group explanation.

Required visible content:
- Plain-language name.
- Technical name as a secondary label if useful.
- Current numerical reading and unit.
- Plain-language current interpretation.
- A useful concept-specific visual.
- A short explanation of why it matters to gold now.
- Clear support/pressure/mixed/unknown semantics.

The primary explanation must not require hover or expansion to be understood.

### Tier 2 — Supporting metric (expandable)

Show a compact label/status/value where helpful. Expand to reveal:
- What it measures.
- Why it may matter to gold.
- What higher/lower readings can mean.
- The relevant visual/history.
- Related metrics and caveats.

### Tier 3 — Expert/root evidence

Make available:
- Raw and transformed value as appropriate.
- Unit, timestamp, observation period and source.
- Historical series and reference calculation.
- Methodology, formula and limitations.
- Model role/polarity and relevant data quality state.
- Links back to the briefing claim and supporting visual.

## 7. Relationship atlas

Create one record per conventional relationship, not one speculative edge for every pair of indicators.

Required fields:
- Relationship ID.
- Source metric IDs.
- Target metric ID (often gold price/conditions).
- Plain-language description.
- Mechanism explanation.
- Evidence classification: mechanism / historical correlation / conditional / causal evidence / weak or disputed.
- Direction and conditions (if known).
- Historical regimes where it changes.
- Source/reference and review date.
- What this relationship cannot prove.
- UI placements: briefing, supporting visual, expert detail, relationship explorer.

### Candidate relationships to investigate

- Real yields ↔ gold opportunity cost.
- Nominal yields + inflation expectations → real yields.
- US dollar strength ↔ dollar-denominated gold pricing.
- Inflation expectations ↔ real yields and purchasing-power concerns.
- Financial stress/uncertainty ↔ safe-haven demand.
- Central-bank purchases/holdings ↔ official-sector demand.
- ETF flows/holdings ↔ investment demand.
- Futures positioning ↔ sentiment/positioning and potential crowdedness.
- Silver and other asset comparisons ↔ relative performance, not automatic causation.
- Event expectations ↔ potential policy repricing, not direct gold-price probability.

Only include a relationship in the prominent visual system after verification. If a relationship is time-varying, show the condition or the changing history.

## 8. Prohibited visual shortcuts

- Do not use a generic 0–100 gauge for a metric without a meaningful 0–100 scale.
- Do not treat a historical percentile as a probability.
- Do not use a single common scale to compare unrelated units.
- Do not imply red/green is a universal good/bad property of the raw metric. Colour refers to its interpreted relationship to gold, and must be paired with text/icons.
- Do not display signal counts as economic impact or price attribution.
- Do not display correlation as causation.
- Do not conflate stock and flow.
- Do not present long/short positioning as physical buying/selling.
- Do not hide a stale or unavailable value behind a neutral-looking graphic.
- Do not use decorative illustrations instead of a real, data-bound visualization.
- Do not make hover the only way to understand the main message.
- Do not force a unique bespoke visualization when a standard family is clearer.

## 9. Pre-implementation verification for the atlas

The atlas is not implementation-ready merely because every row has a chart-family label. Before production work begins, S6/S7 must verify the atlas against the actual repository and data contracts.

For every unique canonical metric, confirm:
- Canonical ID and owning feature/source are correct.
- The metric is not confused with a model voter, duplicate card, derived value, or context-only measure.
- Exact unit, currency, observation period, timestamp semantics, update cadence and source are known.
- The intended visual is semantically valid for this metric and its scale.
- The visitor-facing label, definition, current interpretation and relationship-to-gold language are supported.
- The current reading can be shown without hiding stale, missing, partial or invalid data.
- A path exists from each prominent visual to the exact expert/root evidence record.
- The metric's default visibility is justified: featured metrics show their concept visual and interpretation by default; lower-priority metrics remain discoverable in expandable groups/library.

Produce a completeness matrix with one row per unique metric and explicit statuses: verified / partly verified / unavailable / approval required. Do not infer missing canonical metrics from old documentation.

## 10. Scenario-based visual verification

Every visual family must be tested against deterministic fixtures, not only the current live market snapshot. At minimum, verify:

| Scenario | What the visual must do |
|---|---|
| Broadly supportive conditions | Show support clearly without implying certainty or a guaranteed rise. |
| Broadly pressuring conditions | Show headwinds clearly without treating every negative reading as a sell signal. |
| Mixed/contradictory indicators | Communicate disagreement and avoid forcing a false single verdict. |
| Extreme/outlier value | Keep labels, marker and scale legible; avoid clipping or misleading compression. |
| Missing one indicator | Mark it unavailable; do not convert it to zero/neutral or distort the group. |
| Entire group unavailable | Show the limitation and recalculate/describe the overview only as supported by existing model rules. |
| Stale or delayed reading | Display timestamp/freshness and avoid implying it is current. |
| Partial provider/API response | Render valid data and clearly identify missing components. |
| Unit, currency or period mismatch | Fail safely; never compare incompatible values as if equivalent. |
| Current conditions conflict with outlook | Keep the two assessments distinct and explain the divergence. |
| Outlook method unavailable | Omit unsupported forecast claims and provide an honest fallback. |
| Persian long labels / RTL | Preserve reading order, axes, units, markers, tooltips and source links. |

Use pairwise/risk-based combinations when a full Cartesian test matrix is too large, but every listed failure class must be exercised. Record fixture IDs, expected interpretation, actual output, screenshot and result.

## 11. Visual QA checklist

For each visual, answer:

1. Can a non-specialist state what it measures after a brief look?
2. Does the graphic explain the concept or only plot a value?
3. Is the current numerical reading visible where it matters?
4. Is the direction/effect on gold explicit and accurate?
5. Are the timeframe, unit and reference window clear?
6. Is uncertainty or conditionality visible?
7. Can a visitor reach the underlying source card?
8. Does it remain understandable without colour alone?
9. Does it work at mobile size in both fa RTL and en LTR?
10. Does the visual imply a causal/predictive claim it cannot support?

A “no” to 1, 2, 4, 5, 7 or 10 requires revision before the visual is accepted. The same visual must also pass the relevant scenarios in Section 10 before production use.
