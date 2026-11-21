# Gold Intelligence & Visual Explanation Upgrade — program home

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

## What this is

The owner-approved follow-up programme to the completed nine-session Gold UX
redesign (`docs/gold-redesign/`, closed 2026-11-2x at Session 9/9 + the S10
Q3-A execution). The product problem it answers: visitors are impressed by how
much the Gold page displays, but may not actually **understand** the gold
market after scrolling through it. The programme turns `/gold` into an
understandable gold-market intelligence experience — comprehension over
information volume — while preserving the full verifiable evidence layer for
professionals.

**Parent strategy:** `CURRENA_GOLD_UX_STRATEGY_AND_PHASED_PLAN.md` (repo root,
v2) remains in force unless a document here explicitly refines it.

## The mandatory three-layer architecture (owner-selected)

1. **BRIEFING — Flower and Fruit** — the distilled market story: price and
   movement, current conditions, a separate short-to-medium-term outlook, the
   two or three leading reasons, uncertainty and what could change the outlook.
2. **SUPPORTING VISUALS — Leaves and Tree** — a small number of integrated
   visuals that explain the economic forces, mechanisms and relationships.
   These consolidate the underlying indicator set; the default journey must
   never confront the visitor with 37+ equally prominent cards.
3. **EXPERT CARDS AND NUMERICAL DATA — Roots** — the complete verifiable
   evidence: values, units, timestamps, sources, history, methodology, data
   quality — accessible through progressive disclosure, never deleted.

This is an information hierarchy, not an instruction to draw a literal
flower/tree. Evidence flows Roots → Supporting Visuals → Briefing; the visitor
travels Briefing → Supporting Visuals → Roots.

## The documents (filed 2026-11-21 from the owner's ZIP upload, byte-preserved)

| File | Role |
|---|---|
| `01-GOLD_INTELLIGENCE_AND_VISUAL_EXPLANATION_UPGRADE.md` | The main specification: the product problem, the three-layer architecture, the product principles, the briefing requirements, scope boundaries, acceptance criteria and the 15-session roadmap. |
| `02-GOLD_VISUAL_EXPLANATION_ATLAS.md` | The visual companion: the inventory rule (count the real things separately), the required mapping register per canonical metric, the visual families V1–V12, the three display tiers, the relationship atlas and the prohibited visual shortcuts. |
| `03-GOLD_VISUAL_REFERENCE_AND_PROTOTYPE_PLAN.md` | The prototype plan: the required prototype set P1–P7, the visual design system requirements, the screenshot/viewport matrix, the two pre-implementation gates (A/B), the 16-point evaluation rubric and the cross-scenario test plan (MKT/DAT/presentation). |
| `04-AGENT_EXECUTION_PROMPT.md` | The execution protocol: the mandatory verification gates, the financial/data boundaries, the autonomous-operation rules, the 15-session plan and the required session close-out format. |
| `Gold-Market-Dashboard-Infographic.png` | The owner's broad visual concept reference (keep using it across sessions). |
| `spec-pack.zip` | The owner's original upload, preserved byte-for-byte. |
| `DECISION_LOG.md` | The programme's own decision log (per the gold-redesign programme pattern). |

The four documents above were extracted from the owner's
`gold_intelligence_visual_explanation_spec_pack.zip` (root, kept as the
preserved original) and filed here with numeric prefixes. Their contents are
byte-identical to the upload (md5-verified at filing time). Cross-references
inside the documents still name the original file names; the mapping is
`01-…UPGRADE.md` ↔ `GOLD_INTELLIGENCE_AND_VISUAL_EXPLANATION_UPGRADE.md`,
`02-…ATLAS.md` ↔ `GOLD_VISUAL_EXPLANATION_ATLAS.md`,
`03-…PROTOTYPE_PLAN.md` ↔ `GOLD_VISUAL_REFERENCE_AND_PROTOTYPE_PLAN.md`,
`04-AGENT_EXECUTION_PROMPT.md` ↔ `AGENT_EXECUTION_PROMPT.md`.

## The 15-session plan (one session per invocation)

S1 current-state + evidence audit → S2 outlook/evidence-method review →
S3 three-layer architecture + claim-to-evidence model → S4 indicator and
relationship content atlas → S5 visual system + working prototypes →
**S6 GATE A (product/design verification)** → **S7 GATE B
(technical/data/test readiness)** → S8 Briefing layer → S9 Supporting Visuals
layer → S10 Roots layer → S11 relationships + secondary integration →
S12 cross-layer integration → S13 scenario QA → S14 comprehension validation →
S15 release readiness + deployment + post-deploy verification.

**Hard rules:** no production feature implementation before S6 AND S7 both
pass; S13/S14/S15 are separate sessions; a session ends with the handoff
records, the `Session X/15 · Y remaining` counter and a complete copy-paste
prompt for the next session; the session audits and reports live under
`docs/audits/2026-11-21-gold-intelligence-s1/` onwards (S1's deliverables)
while the programme's own session reports join this folder from S2 on.

## Protected surfaces (unchanged from the parent strategy)

The gold balance engine, its voters/lanes/thresholds/weights, the
current-conditions ≠ forecast separation, provider/data contracts, the
Persian copy manifest workflow, the bundle budgets, and the deploy-lock
discipline. Any change to `packages/insights/`, gold score, voters,
thresholds, weights, data-source semantics or forecast methodology requires a
separate evidence memo and owner approval before implementation.
