Read `AGENTS.md` in the repo root first and follow it for the whole session.

# Agent execution prompt — Gold Intelligence & Visual Explanation Upgrade

Repository: https://github.com/assadigit/Currena  
Target: https://currena.ir/gold

The owner has uploaded the following planning files into the repository root:

1. `GOLD_INTELLIGENCE_AND_VISUAL_EXPLANATION_UPGRADE.md`
2. `GOLD_VISUAL_EXPLANATION_ATLAS.md`
3. `GOLD_VISUAL_REFERENCE_AND_PROTOTYPE_PLAN.md`
4. `AGENT_EXECUTION_PROMPT.md` (this file)

Read all four files completely, but **read `AGENTS.md` first**. Then follow the repository's mandatory startup sequence and filing conventions. The uploaded files are a planning bundle; after reading them, file them using the repository's rules (normally under `docs/specs/` with descriptive names), update internal references, and preserve the original contents. Do not leave duplicate/conflicting copies or delete owner content. Never change `AGENTS.md` unless the owner separately approves a proposed rule change.

## 1. What the owner is trying to achieve

The owner believes visitors are impressed by how much information Currena Gold displays but may not actually understand the gold market after scrolling through it.

The goal is not another card redesign. The goal is to transform the Gold page into an understandable gold-market intelligence experience:

- Explain what is happening to gold now.
- Communicate whether the short-to-medium-term outlook is favourable, unfavourable, mixed or uncertain.
- Explain the two or three most important forces behind the assessment.
- Show why those forces matter using clear visual explanations.
- Preserve full numerical and technical evidence so professionals can verify the briefing and visuals.

The governing principle is: **comprehension over information volume**. The 37+ indicators and expert cards are source material, not the product itself. The product is the understandable interpretation of the gold market.

## 2. Mandatory three-layer architecture — Flower / Tree / Roots

The owner explicitly selected this structure:

### BRIEFING — Flower and Fruit
The distilled market story: current international gold price/movement, current conditions, a separate short-to-medium-term outlook, two or three leading reasons, uncertainty and what could change the outlook.

### SUPPORTING VISUALS — Leaves and Tree
A small number of integrated visuals that explain the economic forces, mechanisms, relationships and why the highlighted drivers matter. These visuals consolidate the underlying indicator set. Do not show 37+ equally prominent cards or mini-charts by default.

### EXPERT CARDS AND NUMERICAL DATA — Roots
The complete verifiable evidence: unique metric cards, numbers, units, timestamps, sources, historical series, technical names, methodology and data quality. Keep this information accessible through progressive disclosure, not as the first thing an ordinary visitor must understand.

This is an information hierarchy, not an instruction to draw a literal flower/tree. Evidence/data flows from Roots through Supporting Visuals into the Briefing. The visitor experience starts at the Briefing and allows drilling down toward the evidence.

## 3. Repository-first requirements

The repository is a modular TypeScript pnpm monorepo. Confirm the exact current paths before making assumptions. The Gold page feature and shared insight/model packages must be treated as separate editing territories.

Before any implementation:

1. Read `AGENTS.md` completely.
2. Read `README.md`, `docs/HANDOFF.md`, `CHANGELOG.md`, `docs/DECISIONS.md`, relevant specs/audits, `docs/DEPLOY.md`, and recent `git log`/`git status` in the order required by AGENTS.
3. Read `docs/insights/GOLD_SYSTEM_COMPLETE_REFERENCE.md` before interpreting Gold model behavior.
4. Inspect the actual Gold feature components, current API/data contracts, shared UI and all relevant tests.
5. Inspect the current rendered `/gold` page in a real browser. Capture actual desktop, mobile, EN LTR and Persian RTL screenshots. Do not claim visual inspection from source code alone.
6. Compare current code and rendered experience against all three planning documents and the parent `CURRENA_GOLD_UX_STRATEGY_AND_PHASED_PLAN.md`.
7. Record requirements that are missing or partly built; do not silently claim completion.

## 4. Critical financial and data boundaries

- The existing Gold balance/current-conditions model and its thresholds, voters, weights and interpretations are protected.
- The current conditions assessment is not a forecast.
- A separate forward-looking outlook must use a documented, defensible method for each horizon.
- The primary horizon is 1–3 months; 1–2 weeks is secondary. A 6–12 month horizon is optional only if supported.
- Use qualitative direction and magnitude by default. Numeric percentage ranges, confidence probabilities and price targets require a validated method and explicit approval.
- Scenario narratives (base/upside/downside) must state conditions/assumptions and must not invent probabilities.
- Do not call a highlighted metric the cause of a price movement or the strongest predictor unless evidence supports that claim.
- Distinguish signal count, signal relevance, economic mechanism, measured contribution to price movement and predictive power.
- Do not add providers, paid APIs, provider requests or ongoing infrastructure cost without approval.
- Verify the primary instrument is XAU/USD spot per troy ounce as previously selected. If the current feed/contract differs, document evidence and propose a safe correction; do not silently alter provider/data contracts.
- Never show missing/stale data as zero or neutral.
- Any change to `packages/insights/`, gold score, voters, thresholds, weights, data-source semantics or forecast methodology requires a separate evidence memo and owner approval before implementation.

## 5. Visual requirements — do not repeat the previous failure mode

The previous implementation improved structure and introduced visualization primitives, but the owner still found that the page relied too heavily on historical ranges. That is not sufficient.

A range marker answers “where is this value versus its history?” It does not necessarily answer “what does this measure?”, “why does it matter?” or “how can it influence gold?”.

For important concepts, design visuals that explain the mechanism, such as:

- Real yields: yield/inflation decomposition and opportunity cost of holding non-yielding gold.
- Dollar strength: the currency basket/index and how dollar pricing can affect non-US buyers and gold demand.
- Inflation expectations: actual vs expected inflation and its relationship to real yields.
- Market stress: what the specific stress index measures and how uncertainty may influence safe-haven demand.
- Institutional demand: stock (holdings) vs flow (purchases/sales over a period).
- Investor positioning: who is long/short, gross vs net positions and what this does/does not indicate.

These are candidates. Confirm actual canonical metric IDs and sources before implementation.

Requirements:
- Build working prototypes before scaling to all indicators.
- Use existing React/SVG/CSS/chart tools where possible. Do not use static generated images as live data charts or financial evidence.
- Use a reusable family of 8–10 visual patterns, customized to the meaning of each metric.
- Give the most important indicators their concept visual and plain-language interpretation by default. Less important indicators remain expandable, but all metrics remain accessible.
- Historical ranges become supporting context, not the default visual for nearly every metric.
- Main visuals must communicate without hover. Interactions reveal deeper evidence, not the only explanation.
- All visuals must work in English LTR and Persian RTL, desktop and mobile, and with loading/stale/missing/error states.
- Capture screenshots and evaluate prototypes against the rubric in `GOLD_VISUAL_REFERENCE_AND_PROTOTYPE_PLAN.md`.

## 6. Mandatory verification gates — never skip these

There are two dedicated **pre-implementation** sessions. They are not optional paperwork and must not be folded into coding sessions.

### Gate A — S6: product/content/design verification

Before production implementation, verify and document:
- Requirement-to-design traceability across the main spec, visual atlas and prototype plan.
- The complete Flower/Tree/Roots hierarchy, content placement, default/collapsed behavior and deduplication.
- The mandatory prototypes in desktop/mobile and EN/fa RTL.
- That core visuals explain concepts and mechanisms, not only historical positions.
- That the main meaning, actual reading, unit/period, uncertainty and evidence link are visible without hover/expansion.
- That all prototype rubric scores meet the required threshold and all starred criteria pass.
- Known limitations, accepted trade-offs, unresolved questions and approval-required items.

**S6 must produce a written verification report and a frozen design baseline. No production feature code may begin before S6 passes.** If a prototype fails, revise and retest it; do not lower the rubric.

### Gate B — S7: technical/data/test-readiness verification

Before production implementation, verify and document:
- Canonical metric IDs, source fields, units, periods, timestamps, cadence, freshness and missing-data semantics.
- Claim-to-visual-to-metric traceability.
- Component boundaries, data contracts, API behavior, provider constraints, performance/bundle limits and repository conventions.
- Deterministic market/data fixtures and expected outcomes for all scenarios in the visual prototype plan.
- Test coverage map for functional, visual, numerical, responsive, locale, accessibility, performance and regression behavior.
- CI, deploy-lock, deployment procedure and rollback readiness.

**S7 must produce a technical readiness report, fixture catalogue, scenario matrix and implementation backlog. No production feature code may begin before both S6 and S7 pass.**

### Verification evidence standard

A verification claim must point to evidence: screenshot, browser recording, test result, data fixture, source mapping, commit or documented inspection. “Looks good”, “works locally” or “implemented” is not sufficient by itself. Report separately whether an item is designed, implemented, tested, deployed and verified in the deployed environment.

## 7. Autonomous operation

The owner prefers autonomous work. Do not interrupt for routine design, copy, component or reversible implementation choices. Use recommended decisions in the specifications and record non-obvious choices in `docs/DECISIONS.md`.

Ask no more than three questions at a time, and only if a decision is genuinely critical, expensive to reverse or blocked by contradictory requirements. Do not ask questions already answered in the strategy files.

Continue autonomously through prototypes, verification and implementation unless a material conflict emerges. Pause for owner approval before:

- Changing financial model calculations, weights, thresholds, voters or methodology.
- Introducing new price/forecast claims that cannot be supported by existing verified data/methods.
- Changing provider/data contracts or adding costs/requests.
- Destructive/irreversible changes or production/security/billing/access actions outside existing standing approval.
- Any major change to the agreed three-layer product architecture.

If approval is required, provide evidence, exact proposed change, alternatives and recommendation. Continue independent work that does not depend on the blocked decision.

## 8. Fifteen-session execution plan — one session per invocation

Execute the sessions sequentially. Each session has no more than three principal milestones. Do not complete multiple sessions in one enormous run. Complete and verify one session, then stop and provide the next-session prompt.

1. **S1 — Current-state and evidence audit.** Establish the real deployed state, module/data inventory and comprehension gap. Audit only; no redesign implementation.
2. **S2 — Outlook and evidence-method review.** Verify what can be responsibly said for the 1–2 week and 1–3 month horizons.
3. **S3 — Three-layer information architecture and claim-to-evidence model.** Define Briefing, Supporting Visuals and Roots with precise traceability.
4. **S4 — Indicator and relationship content atlas.** Map every unique metric, definition, value, role, visual family, relationship and source.
5. **S5 — Visual system and representative working prototypes.** Build the briefing, integrated forces, real-yield, dollar, institutional-demand and positioning prototypes.
6. **S6 — PRE-IMPLEMENTATION GATE A: product/content/design verification.** Verify the requirements, hierarchy, prototypes, visual comprehension, locales and responsive behavior. Freeze the design baseline. No production feature implementation.
7. **S7 — PRE-IMPLEMENTATION GATE B: technical/data/test-readiness verification.** Verify contracts, canonical metric mappings, deterministic fixtures, scenario coverage, test automation, CI/deployment/rollback readiness. No production feature implementation.
8. **S8 — Implement the Briefing layer.** Current price, current conditions, separate supported outlook, top reasons, uncertainty and evidence links.
9. **S9 — Implement the Supporting Visuals layer.** Consolidated forces, mechanism illustrations, relationships and drill-down links.
10. **S10 — Implement the Roots expert/evidence layer.** Complete unique indicator inventory, values, sources, history, freshness, technical details and verification links.
11. **S11 — Relationships and secondary research integration.** Relationship explorer, institutional flows, asset comparisons, technical context, historical episodes, investment comparison and regional Iran section as specified.
12. **S12 — Cross-layer integration and functional verification.** End-to-end claim/evidence consistency, interactions, accessibility, localization, regression and performance.
13. **S13 — DEDICATED SCENARIO-BASED VISUAL AND FUNCTIONAL QA.** Test favourable, unfavourable, mixed, contradictory, extreme, stale, missing, partial, unavailable, provider-error, timezone, locale, viewport and interaction scenarios using deterministic fixtures. Capture screenshots and fix/retest defects.
14. **S14 — DEDICATED COMPREHENSION AND USABILITY VALIDATION.** Cognitive walkthrough plus five-person test when participants are available. Revise and retest misunderstandings.
15. **S15 — RELEASE READINESS, DEPLOYMENT AND POST-DEPLOYMENT VERIFICATION.** Full acceptance audit, all required repository gates, deploy-lock, deployment, live-browser verification and rollback readiness.

### Current invocation

For the first invocation, execute **S1 only**. Do not start S2 in the same invocation.

### Session-specific instructions

- S1 is audit-only. It must capture the real rendered page, separate unique displayed metrics from model voters/context-only measures, verify price instrument/feed and freshness, and document the main comprehension gaps.
- S2 must not alter the existing balance engine. It must make a publishability decision for each outlook horizon and identify any approval-required methodology work.
- S5 creates working prototypes only; it is not permission for full production rollout.
- S6 and S7 are mandatory pre-implementation gates. A source-code review alone is insufficient: inspect working prototypes, browser output, data contracts and scenario fixtures.
- S12, S13, S14 and S15 are separate sessions. Do not compress integration, scenario QA, human comprehension tests and release deployment into one final pass.
- S13 must test both the functional output and the visual meaning for every required scenario. A component rendering without crashing does not pass.
- S15 is not complete until the deployed `/gold` page is verified in a real browser and post-deployment smoke evidence is recorded.

## 9. Git, checkpoints and deployment

Follow `AGENTS.md` and `docs/DEPLOY.md` exactly.

- Check `git status` before edits. Never overwrite other work.
- Use the repository's approved serial workflow. Do not launch parallel agents in the same Gold feature territory. Do not treat the Gold feature and shared engine as a single editing territory.
- After each meaningful verified sub-milestone, commit with a clear message and push according to repository branch rules. Every commit must leave the project in a valid state.
- Run the required tests/backtests/audits for the touched scope. Never weaken tests/gates.
- For runtime changes, use the repository's deployment method only after all required gates pass. Perform the deploy-lock re-check first, run required gates (including bundle budget/secret scan), deploy with the documented command, then verify the live route yourself. If deployed output is broken, roll back first.
- Docs-only/audit-only sessions do not deploy.
- If explicitly running as a parallel lane under AGENTS §15, obey its worktree/territory/session-record rules; do not deploy, merge or push `main`. An integration session owns merge/deploy.
- Never force-push, rewrite published history, skip hooks or expose credentials.

## 10. Required session close-out

At the end of every session:

1. Update required `docs/HANDOFF.md`, `CHANGELOG.md` and `docs/DECISIONS.md` records (or lane-local record if AGENTS §15 applies).
2. State each milestone as Done and verified live / Done in code, not deployed / Partly done / Not done / Not verified.
3. Provide commit hashes, branch, push result, deployment URL/version where applicable, tests, screenshots and unverified items.
4. Give the explicit progress counter: `Session X/15 · Y remaining`.
5. List what remains and any issue carried forward.
6. Generate a complete, standalone, ready-to-copy prompt for the next session. Its first sentence must be: `Read AGENTS.md in the repo root first and follow it for the whole session.` It must name files to read, objective, milestones, done criteria and known risks.
7. For S6 and S7, clearly state whether the pre-implementation gate passed, failed or is blocked, with evidence. Never proceed into S8 if either gate has failed or remains unverified.
8. For S13/S14/S15, include the scenario/comprehension/release evidence and unresolved defect status appropriate to that session.
9. Stop. Do not begin the next session in the same invocation.

## 11. Start now

Read `AGENTS.md` first and follow the mandatory startup sequence. Read all four uploaded planning files and the parent Gold UX strategy. Inspect the latest repository state and perform S1 only.

The key audit question is not “does the page display all its data?” It is:

**Can a normally educated visitor understand what is happening to gold, whether the 1–3 month outlook is favourable or unfavourable, and which forces matter most — and can a professional trace those conclusions back to the underlying numerical evidence?**
