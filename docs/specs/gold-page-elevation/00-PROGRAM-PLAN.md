> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# Gold Page Elevation (GPE) — Multi-Session Program Plan

**Program owner:** Ali Assadi (Currena owner)
**Program branch:** `docs/gold-page-elevation` (research phases; never `main`)
**Program start:** 2026-11-17 (Session S1)
**Standing constraint (owner, 2026-11-17):** research only while the
modularization program (M12 global, M13 insights-legacy) is running on
`main`. This program must not touch `main`, its bookkeeping files
(`docs/HANDOFF.md`, `CHANGELOG.md`, `docs/DECISIONS.md`), or any code the
modularization program is moving. All GPE output lives on this branch as
docs. The one reconciliation commit (bookkeeping) happens at the end, with
the owner, after the modularization program closes.

## 1. Why this program exists

`https://currena.ir/gold` is already the most sophisticated gold page in
the Persian web — a 37-voter, 5-lane descriptive conditions meter with a
published, honestly-reported backtest (no forecasting edge claimed), full
FA/EN bilingual coverage, and disciplined data licensing. The owner's
ambition is bigger: make it a **gold-market intelligence destination** —
macro context, historical understanding, and clear interpretation, not
just conditions — while keeping the page clean.

The direct competitor, `sahamanaliz.com/pages/gold`, is macro-literate in
a different way: auto-generated narrative, inflation/rates education,
prediction-market Fed probabilities, calculators, and a stock/ETF layer.
Two different theories of "sophistication" are competing: **Currena's
meter (structured, systematic)** vs **Saham Analiz's narrative
(explanatory, contextual)**. The winning page will do both.

## 2. Program phases

### Phase A — Research & Intelligence (S1–S5) — RESEARCH ONLY

| Session | Objective | Key deliverables | Milestones |
|---|---|---|---|
| **S1** (done 2026-11-17) | Foundation: analytical perspective, independent gold-ecosystem brainstorming, initial live audits of both pages, benchmark scan, data-source probe, this program plan | `s1/01`–`s1/09` docs | M1 workspace+branch · M2 audits+benchmarks · M3 docs pushed |
| **S2** | Deep audit of Currena's gold page — every section, both locales, 3 viewports, interaction/loading/error states, data-freshness cross-check, against 12 audit dimensions; **post-D6–D8: audit through the integration lens** (where the bridge card / TA block / CB-demand section land) and inventory the modularized `features/gold/` tree for the spec references | `docs/audits/2026-11-XX-gold-page-deep-audit.md` + issue log | M1 section-by-section · M2 dimensions scoring · M3 issue log |
| **S3** | Deep audit of Saham Analiz + head-to-head comparison table | `docs/audits/…-sahamanaliz-competitor-audit.md` + comparison matrix | M1 full inventory · M2 evaluation · M3 comparison matrix |
| **S4** | International benchmark deep-dive (WGC Goldhub data model, LBMA, Kitco, Trading Economics; Persian ecosystem map) + data-source reality check per candidate indicator; **post-D6–D8 additions: TGJU unit conventions + CBI mint specs + profile-history terms (s1/11 §3–§4, §9), WGC attribution wording + download workflow (s1/12 §5), IFS series IDs** | benchmark dossier + data-source/feasibility map | M1 benchmarks · M2 data feasibility · M3 adopt/reject list |
| **S5** | SWOT (page + competitive position) + missing-indicator master list with Core/Supporting/Advanced/Excluded classification (first pass already drafted post-D6–D8: `s1/14`) | SWOT doc + classified opportunities list | M1 SWOTs · M2 master list · M3 checkpoint report |

**Checkpoint CP-A (end of S5):** owner reviews SWOT + classified list →
GO/NO-GO and scope decisions for Phase B. *Update (S1b, 2026-11-17):
the owner answered the three strategic CP-A questions early — D6 (Iran
bridge GO, staged, with coin prices on the card), D7 (WGC implement
now, no licence wait), D8 (minimal TA suite GO) — recorded in
`s1/10-owner-decisions.md` with spec preps `s1/11`–`s1/13` and the
pulled-forward gap-analysis draft `s1/14`. CP-A therefore reduces to
SWOT review + scope lock; no strategic question remains open.*

### Phase B — Design (S6–S7) — STILL DOCS ONLY

| Session | Objective | Key deliverables |
|---|---|---|
| **S6** | Information architecture for the elevated page: section map, density tiers (Core/Supporting/Advanced), placement, exclusions, copy principles (FA/EN), mobile behavior; **must place the three decided elements: Iran-bridge section (s1/11 §7), TA reference block (s1/13 §6), CB-demand section (s1/12 §3)** | IA spec `01-IA-SPEC.md` … numbered spec set under `docs/specs/gold-page-elevation/` |
| **S7** | Analytical framework design: causal chains to visualize, "why gold moves" education layer, how the meter integrates with narrative and history; visual language per relationship | framework spec + education-content outline |

**Checkpoint CP-B (end of S7):** owner approves the architecture and the
framework (A/B/C decisions recorded in `docs/DECISIONS.md` at
reconciliation).

### Phase C — Roadmap (S8)

Prioritized P1–P4 roadmap: every recommendation with problem, user value,
economic justification, presentation, required data, update frequency,
complexity (Low/Medium/High), priority. Includes a data-source mapping
table (licence level, cost, update cadence, cache strategy) and the
owner-decision list. *Input ready: the F1–F21 master draft with tiers
(`s1/14`) and the three decided spec-preps (`s1/11`–`s1/13`).*

**Checkpoint CP-C:** owner locks priorities → implementation queue.

### Phase D — Implementation (S9+) — GATED

Gate: modularization program COMPLETE (M12 + M13 delivered, `main` green,
owner lifts the research-only constraint). Implementation sessions then
follow the repo's normal feature-branch discipline (one branch per
session, small verified steps), each ending with the standard TLDR +
next-session prompt.

Anticipated sequence (to be finalized in S8): S9 P1 essentials → S10 P2
high-value → S11 P3 differentiation → S12 P4 advanced + measurement.
Every implementation session ships, deploys, and verifies live per
AGENTS.md §9.

## 3. Session rules (this program)

1. Every session: read `AGENTS.md` first, then this plan, then the
   previous session's `SUMMARY.md`.
2. Research sessions never modify code, `main`, or shared bookkeeping
   files. Findings, audits and specs live under
   `docs/specs/gold-page-elevation/` (and `docs/audits/` for S2/S3).
3. Commit and push after every milestone within a session.
4. Every session ends with `SUMMARY.md` (deliverables, decisions,
   open questions) and the next-session prompt, per AGENTS.md §10.
5. Live-page claims must come from a rendered browser visit in that
   session (AGENTS.md §0 honesty). Data claims must name their source
   and date. Nothing is invented; limitations are stated.
6. Market observations in GPE docs are dated snapshots — the analytical
   frameworks must remain valid independent of any particular day's
   numbers.

## 4. Session-1 status

- M1 workspace+branch ✅ (cloned, `docs/gold-page-elevation` branch,
  repo conventions read, concurrent modularization program identified and
  avoided)
- M2 audits+benchmarks ✅ (currena.ir/gold EN/FA desktop+mobile,
  sahamanaliz.com/pages/gold desktop+mobile, WGC/LBMA institutional
  benchmark, Kitco/TE/TGJU/Persian retail benchmark, EODHD data probe)
- M3 docs pushed ✅ (`s1/01`–`s1/09` + this plan)

### Session S1b (2026-11-17, later) — owner decisions + spec prep

- Owner answered the three CP-A strategic questions early → **D6–D8**
  recorded (`s1/10`), program plan updated (this file).
- S1b probes: TGJU feed re-verified live (all 9 gold symbols + USD/IRR;
  premium sanity check worked); WGC Goldhub catalog mapped, XLSX login
  wall verified, IFS overlap identified.
- Spec preps written: Iran bridge (`s1/11`), CB demand + WGC
  (`s1/12`), minimal TA (`s1/13`); gap-analysis master draft pulled
  forward (`s1/14`, F1–F21 with tiers).
- Standing constraint reaffirmed by owner: research/spec only until the
  modularization program closes; nothing implemented.

## 5. Decisions made in S1 and S1b (record for reconciliation)

| # | Decision | Reason |
|---|---|---|
| D1 | Work on `docs/gold-page-elevation` branch, never `main` | Owner's no-interference instruction vs concurrent modularization program; AGENTS.md §0 puts the owner's explicit instruction above file rules |
| D2 | Do not edit `docs/HANDOFF.md` / `CHANGELOG.md` / `docs/DECISIONS.md` during research phases | Same instruction; a single reconciliation commit at program close |
| D3 | Open a PR for the research branch, leave it open | Makes the work visible on the repo page without touching `main` |
| D4 | Session-1 audit is a *survey* audit; deep audits are S2/S3 | Owner's Phase-1 instruction: start with perspective + brainstorming + begin examination |
| D5 | All market data in docs cites the page/source and date it was observed on | AGENTS.md honesty rules + the user's "never invent data" standard |
| D6 | Iran bridge GO: staged card (Option A), **amended by owner** — the card carries the Tehran instrument prices (Seke Emami, Seke 1-grami, full family) + parity + حباب premium | Owner answer 2026-11-17 (s1/10 §2); S1b discovery: all instruments already ingested via TGJU — cost re-priced High→Med; spec prep `s1/11` |
| D7 | WGC data implementable now, no licence wait: WGC reclassified L3 → **L2-owner-accepted** (attribution required; letter still recommended in parallel); build is two-tier — IMF IFS primary (clean, ungated) + WGC-unique datasets via authenticated download | Owner answer 2026-11-17 (s1/10 §3); probes verified the login wall + IFS overlap; spec prep `s1/12` |
| D8 | Minimal TA suite GO (MA 20/50/100/200 + classic daily/weekly pivots), reversing S1/05 §7; scope guard binding: descriptive framing, no signals, no indicator zoo | Owner answer 2026-11-17 (s1/10 §4); no existing MA/pivot code; spec prep `s1/13` |
