# GIE-S1 — The spec-vs-code matrix (requirement → current state → gap → owning session)

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

The new programme's four planning documents (filed at `docs/specs/gold-intelligence-visual-explanation/`) compared against the current page and source. Status legend: ✅ exists (evidence cited) · 🟡 partial · ❌ missing · ⛔ approval-gated. The "Session" column names the session that owns the work in the 15-session plan.

## A. The main spec (`01-…UPGRADE.md`)

| Requirement | Current state | Status | Session |
|---|---|---|---|
| §2.1 Briefing: price + movement + conditions + separate outlook + 2–3 reasons + what-could-change | Hero + BriefingCard deliver all except the **separate outlook** (slots render nothing; Q2-gated) | 🟡 | S2 (method) → S8 (build) |
| §2.1 primary horizon 1–3m, secondary 1–2w | No horizon construct exists; the backtest record is the honest starting evidence | ❌ ⛔ | S2 |
| §2.2 Supporting visuals: consolidated force explanations, not 37 equal cards | LaneBars + one mechanism visual (yield decomposition); the seats remain 37 visible cards; no dollar/inflation/stress/stock-flow/positioning concept visuals | 🟡 | S3 (architecture) → S5 (prototypes) → S9 (build) |
| §2.3 Roots: every metric, units, timestamps, sources, history, methodology | The record sheet's three tiers + the content module (52 records × both locales) + per-card sources/freshness | ✅ | S10 (organize + claim links) |
| §2.4 evidence flows upward; visitor drills downward | One projection, one truth (D-48); the drill-down exists (cards → sheet); the **claim→record anchor chain** is missing | 🟡 | S3 (schema) → S10 |
| §3.7 conditions ≠ forecast | Held everywhere (the caveat rides every conditions surface; GB-S5) | ✅ | protect |
| §3.13 bilingual by locale | Both dictionaries + the content module; runtime renders one locale; copy-audit gated | ✅ | protect |
| §5.3 briefing content list (headline, horizon, direction, magnitude, consistency, reasons, invalidation, links, freshness) | All present except horizon/direction/magnitude (the outlook construct) | 🟡 | S2/S8 |
| §5.4 recent movement ≠ outlook | The movement is shown (7d window) and the narrative's price fact is editorial; no forward framing anywhere | ✅ | protect |
| §6.2 the per-visual contract (question, concept, meaning, reading, notice, gold relation, limits, metrics, inspection) | Exists for the yield-decomposition card (the R12 record); not for the other concepts (no visuals yet) | 🟡 | S4 (atlas) → S5 |
| §8 up-to-five featured indicators with explainable selection | `briefingReasonsOf`: ≤3, one per lane, firing-count order, no new score (S5-D2 contract) — explainable and conservative | ✅ (3 not 5, by design) | S3 (decide whether to widen) |
| §9 conventional relationships with evidence classes | The 25-record explorer (M/C/X/K), the honesty footer, the no-edge anchor | ✅ | S11 (integrate) |
| §10 copy rules (cautious verbs, no good/bad, no buy/sell) | The S3-GUX bilingual copy rules + the corpus; the round-95 manifest discipline | ✅ | protect |
| §13 comprehension acceptance (15s/1m/2m/3–5m) | 15s: structurally yes (headline + word + price). 1m: the outlook missing. 2m: forces identifiable but not explainable. 3–5m: requires self-study | 🟡 | S8–S14 |
| §13 professional depth (all metrics accessible) | 52/52 + modules, sources, freshness, history | ✅ | protect |
| §14 Gate A / Gate B | Not yet run (S6/S7) | ❌ (scheduled) | S6/S7 |

## B. The visual atlas (`02-…ATLAS.md`)

| Atlas requirement | Current state | Status | Session |
|---|---|---|---|
| §2 the ten separate inventories | `02-metric-and-module-inventory.md` (this session) | ✅ (baseline) | refresh at S4 |
| §3 the mapping register (19 fields per metric) | Partially: the S3-GUX content schema (10 dimensions × 52 records) + the registry columns (cadence/maxAge/rule/source); the atlas's visual-family/default-visibility/QA fields unbuilt | 🟡 | S4 |
| §4 visual families V1–V12 | V2 exists (yield decomposition); V9 exists (TA band + chart); V8-adjacent (correlation companion); V6 data without the stock/flow distinction visual; V12 (ranges) is the dominant family; V1/V3/V4/V5/V7/V10/V11 absent | 🟡 | S5 |
| §6 three display tiers | The record sheet's default/expanded/technical tiers + the seat cards' closed form; Tier-1 "featured metric with concept visual" exists only for the yield concept | 🟡 | S5/S9 |
| §7 relationship atlas records | 24 records + 1 blocked (the explorer's own set, with evidence classes) | ✅ | S4 (extend per the atlas fields) |
| §8 prohibited shortcuts (no 0–100 gauges, no percentile-as-probability, no stock/flow conflation…) | The house rules already encode most (the two-channel rule, the honest states); the Positions bars use defined 0–100 scales (net % of OI; gross share of OI — meaningful scales) | ✅ | protect + S13 (verify) |
| §10 scenario-based visual verification | The GUX S8 honest-states suite (7 forced states) + the fixture server exist; the atlas's 12-scenario table is broader | 🟡 | S7 (fixtures) → S13 |

## C. The prototype plan (`03-…PROTOTYPE_PLAN.md`)

| Prototype | Current nearest equivalent | Status | Session |
|---|---|---|---|
| P1 unified briefing | The hero (price + BriefingCard + CompositionStack) | 🟡 (no outlook slots content) | S5 |
| P2 integrated forces visual | The CompositionStack's LaneBars (a stance summary, not a mechanism map) | 🟡 | S5 |
| P3 real-yield mechanism | **The yield-decomposition card** (built, live, V2) | ✅ (the reference pattern) | S5 (extend) |
| P4 dollar strength | No concept visual (seat verdicts + the basket card on /currencies) | ❌ | S5 |
| P5 institutional demand stock-vs-flow | The CB tracker + London vault render the data; no stock/flow distinction visual | ❌ | S5 |
| P6 investor positioning | The Positions bars show position-in-range; no who/what-long-means explanation | ❌ | S5 |
| P7 root evidence card | **The record sheet** (three tiers, both locales) | ✅ (the reference pattern) | S5 (claim back-links) |
| §5 viewport matrix (1440/1280/1024/tablet/390/360) | The S1 baseline covers 1440/390 (+ dark/fa); tablet deferred | 🟡 | S5/S6 |
| §7 rubric (16 points, ★ mandatory) | Not yet applied | ❌ | S5 (first pass) → S6 (gate) |
| §9 cross-scenario plan (MKT/DAT) | The GUX S8 states + the fixture set; the MKT scenarios (mixed/contradictory/outlook-unavailable…) unbuilt | 🟡 | S7 |

## D. The execution prompt (`04-AGENT_EXECUTION_PROMPT.md`)

| Requirement | Status |
|---|---|
| Read AGENTS.md first; startup sequence; filing conventions | ✅ this session (the spec pack filed under `docs/specs/gold-intelligence-visual-explanation/`) |
| S1 audit-only: real rendered page, unique metrics vs voters separated, price instrument verified, comprehension gaps documented | ✅ this deliverable set |
| One session per invocation; stop and hand off | ✅ (this session ends at S1's close-out) |
| Financial boundaries (protected model, no new providers, fail-closed) | ✅ held (no runtime change at all) |
| Verification evidence standard (designed/implemented/tested/deployed/verified stated separately) | ✅ the acceptance walk (01 §8) |

## E. The parent strategy (`CURRENA_GOLD_UX_STRATEGY_AND_PHASED_PLAN.md`, still in force)

All 28+ owner decisions and the §2.1 second-round decisions were executed by the GUX programme and verified live at its close (report 17). The new programme refines, not reopens: the three-layer architecture is the GUX hierarchy made explicit; the outlook construct was left deliberately unbuilt (Q2) and is now this programme's S2. One explicit refinement to surface at S3: the parent's decision-7 "one combined overview, followed by five expandable/detail groups" currently renders with the member cards **visible** — the new spec's "not 37+ equal-weight cards in the default journey" may ask for collapsed-by-default groups. That is a visible product change → owner-visible decision at S3, tested at S6.
