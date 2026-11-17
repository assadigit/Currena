> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S1 — Session Summary (Gold Page Elevation)

**Session date:** 2026-11-17 · **Branch:** `docs/gold-page-elevation` ·
**Status:** Done in code (docs), not deployed (research program; standing
constraint: no interference with the modularization program on `main`).

## What was delivered

1. `00-PROGRAM-PLAN.md` — the multi-session program (Phases A–D,
   checkpoints CP-A…CP-D, session rules, S1 decisions D1–D5).
2. `s1/01` — analytical perspective & the program's evidence standards.
3. `s1/02` — independent gold-ecosystem brainstorm (monetary policy →
   cross-asset, A–J) collapsing into 5 frameworks + 2 missing layers.
4. `s1/03` — the 8 causal chains (mechanism, indicators, exceptions,
   horizon, visual treatment) — the seed of the S7 framework design.
5. `s1/04` — 10 distinctive feature ideas ranked, with costs/risks and
   4 deliberate near-misses (parked with reasons).
6. `s1/05` — 12 challenged assumptions (incl. the "Bearish" label
   tension and the deliberate TA-suite exclusion).
7. `s1/06` — initial live audit of currena.ir/gold (verified inventory,
   10 strengths, 12 gaps, 12-dimension survey scores, quick wins).
8. `s1/07` — initial live audit of sahamanaliz.com/pages/gold (full
   inventory, what they do better, adopt/improve/avoid, head-to-head).
9. `s1/08` — benchmark consolidation (WGC/LBMA/CME/Kitco/TE/
   goldprice/TGJU/Persian news) + the Persian gap map + top-10 adoptables.
10. `s1/09` — data-source probe (EODHD verified results, existing repo
    licences, the WGC letter decision, feasibility map for all 10 ideas).
11. Screenshots: `docs/assets/gold-audit-s1-2026-11-17/` (both sites,
    desktop/FA/mobile).

## Key findings in one paragraph

Currena's gold page owns the *rigor* layer of the Persian market (the
37-voter meter, decile statistics, licence honesty, published no-edge
backtest, bilingual quality) but not the *explanation* layer (no daily
narrative, no assembled macro reading, no history, no education on-ramp,
no demand-side story). Saham Analiz owns explanation but not rigor.
Seven of the ten proposed distinctive features need no new data family —
they are assembly and education over series already ingested. The two
strategic prizes — the central-bank demand story (WGC letter or IMF IFS
fallback) and the Iran bridge (ounce × USD/IRR → coin premium
decomposition) — are owner decisions, not engineering problems.

## Decisions taken in S1 (D1–D5 in the program plan)

Isolated branch; no main/bookkeeping edits; PR opened not merged;
survey-level audits now with deep audits deferred to S2/S3; every market
claim dated and sourced.

## Open questions for the owner (answer at or before CP-A)

1. **Iran bridge (Idea 8):** A) staged bridge card now, B) full local
   coverage, C) stay global-only. *Recommend A.*
2. **WGC letter (Chain 4):** A) owner sends the authorisation request,
   B) IMF IFS + LBMA fallback, C) link-out only. *Recommend A with B as
   the no-reply fallback.*
3. **TA suite:** A) keep excluded (positioning bet), B) add minimal
   MA/pivot tables. *Recommend A until user-demand evidence.*

## Next-session prompt (S2)

```
Read AGENTS.md in the repo root first and follow it for the whole session.

You are running Session S2 of the Gold Page Elevation (GPE) program on
branch docs/gold-page-elevation. Read, in order: AGENTS.md,
docs/specs/gold-page-elevation/00-PROGRAM-PLAN.md (the program plan and
its rules), then docs/specs/gold-page-elevation/s1/SUMMARY.md (where S1
left off), then the S1 docs you need — especially
s1/06-live-audit-currena-initial.md (the survey audit this session
deepens) and s1/03-key-economic-relationships.md (for domain context).

Standing constraints (unchanged): research only; do NOT touch main, any
code, or the shared bookkeeping files (docs/HANDOFF.md, CHANGELOG.md,
docs/DECISIONS.md) — the modularization program owns them. Work only on
docs/gold-page-elevation. Commit and push after each milestone.

S2 objective: the DEEP audit of https://currena.ir/gold.
Milestones:
M1 — Section-by-section field audit (browser, rendered): every section
from the s1/06 inventory, both locales (FA + EN), three viewports
(1440/768/390), every interactive element (toggles, expansions, chart
ranges, links — click them all), loading/empty/error/stale states, and
the indicator pages the voters link to (sample at least: Real yields,
Dollar basket, COT positioning, 5y5y breakeven). Log every finding as a
numbered issue (ID, section, observation, severity, evidence).
M2 — Score the page against the 12 audit dimensions
(completeness, sophistication, coverage, macro interpretation,
relationships, historical context, data quality, charts, education, UX,
mobile, differentiation) with written justification per score,
cross-referencing issue IDs from M1.
M3 — Data-freshness cross-check: for 10 sampled readings on the page,
verify the value/date against the upstream source (FRED, CFTC, LBMA,
gold-api) and record match/mismatch/stale. Write the deep audit to
docs/audits/2026-11-XX-gold-page-deep-audit.md (AGENTS.md §3 format),
commit, push, then update s1/SUMMARY-style summary by writing
docs/specs/gold-page-elevation/s2/SUMMARY.md with findings, decisions,
and the S3 next-session prompt (deep audit of sahamanaliz.com/pages/gold
+ head-to-head comparison matrix).

Done-criteria: audit doc covers all sections × locales × viewports;
≥30 numbered issues with evidence; 12 dimension scores justified; data
cross-check table complete; all committed and pushed; next-session
prompt written. Known problems to watch: several voters showed
"couldn't be read" on 16-17 Nov (US CPI, expectations, geopolitical
risk, US-JP gap, consumer mood) — check whether they recovered and
record the pattern.
```
