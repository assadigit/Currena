> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S2 — Session Summary (Gold Page Elevation)

**Session date:** 2026-11-17 · **Branch:** `docs/gold-page-elevation` ·
**Status:** Done in code (docs), not deployed (research program; standing
constraint: no interference with the modularization program on `main`).

## What was delivered

1. `docs/audits/2026-11-17-gold-page-deep-audit.md` — the deep audit of
   `https://currena.ir/gold`: all 13 sections × both locales (EN/FA) ×
   three viewports (1440/768/390), every interactive element exercised,
   loading/cached/error/stale states triggered for real (network
   blocking), **30 numbered issues** (GPE-S2-01…30) + a 16-item
   verified-good register, **12 dimension scores** with issue
   cross-references, the **integration-site map** for the three decided
   features (D6 bridge / D7 CB-demand / D8 TA), the **modularized-gold
   module inventory** (live section → `features/gold/` +
   `domains/gold/` file map for the S6/S7 specs), and a **19-row data
   cross-check** against FRED, CFTC, IMF COFER, BAZG, gold-api, EODHD,
   Frankfurter, TGJU and the GPR daily file.
2. `docs/assets/gold-audit-s2-2026-11-17/` — 30 screenshots (both
   locales, all three viewports, states, indicator pages, the
   /live-rates gold board).
3. This summary + the S3 prompt.

## Key findings in one paragraph

The rigor layer survived the deep audit with its reputation intact but
**not spotless**: three communication defects sit exactly where the
page's credibility claim lives — the "10 years" chart actually renders a
**5.2-year window** and labels the 5.2-year return "+115.3% 10 years"
(#01, the public history API's 1,900-day bound vs a stale code
comment); the FA SGE/Swiss cards say **"million tonnes"** where the
values are tonnes (#02, a corpus unit string reused from China-steel
data); and the Gold Positions "−8.8 pts" is an **unlabeled 30-day
change** in a weekly-report section (#09 — the S1 audit itself misread
it as w/w). The 16–17 Nov unread cluster **persists** (8/37 seats) and
decomposes into three distinct causes: upstream-stopped (UoM/UMCSENT
ends Sep 2026 upstream), upstream-blocked (Oct 2026 CPI published but
its Oct 2025 YoY base is empty on FRED from the 2025 shutdown gap), and
two plain pipeline misses (CFTC's Nov 10 report and the GPR daily file
are both published upstream and un-ingested — plus the stored GPR value
no longer matches the provider's revised file). The data arithmetic
itself is outstanding: **13 of 19 cross-checked rows matched upstream
exactly at their as-of dates** (COFER to 4 decimals, CFTC to 2, BAZG to
the kilogram), zero value mismatches. The three decided features all
have measured integration slots (§5 of the audit): bridge below the
conditions story, CB-demand after the flows cards (display-only), TA
table before the ratios — and the bridge's data plane was re-verified
end-to-end live (all 9 TGJU instruments exact; the 11-glyph toman
mobile question answered empirically: it fits).

## Dimension scores (deep, vs S1 survey)

completeness 3.5 (=) · sophistication 4.5 (↓0.5, #01+#09) · coverage
3.5 (=) · macro interpretation 3 (=) · relationships 2.5 (=) ·
historical context **1.5 (↓0.5 — the only history render is the
shortened 10y chart)** · data quality 4.5 (↓0.5, #01/#02/#04/#05) ·
charts 2 (↓0.5, #01) · education 2 (=) · UX 3.5 (↓0.5, #17/#18/#15/#16)
· mobile 4.5 (=) · differentiation 4.5 (=).

## Decisions taken in S2 (for the program record; DECISIONS.md at
reconciliation)

- **S2-D1:** the audit's three HIGH/MED mislabel defects (#01, #02, #09)
  are recorded as the **fix-first list for Phase D** — the S6 IA and the
  S8 roadmap must sequence them before/alongside the first new section
  (they sit in the credibility lane the new sections borrow). They are
  *findings*, not fixes: nothing was implemented (standing constraint).
- **S2-D2:** integration-slot recommendations recorded for S6 (bridge §5a
  slot A · CB-demand §5b slot A display-only · TA table §5c slot B with
  the overlay riding F7). These are recommendations with measured
  pros/cons, not placements — S6 owns the decision.
- **S2-D3:** the CPI shutdown-gap (Oct 2025 base month empty on FRED) is
  recorded as an **S4 data-policy item** (skip-month base vs BLS's own
  YoY), not a bug in the current fail-closed behavior.
- **S2-D4:** two operational P0s outside GPE's build scope were
  identified and left untouched per the standing constraint: the CFTC
  Saturday-gate miss (Nov 10 report un-ingested) and the GPR daily
  re-fetch (14 days behind + vintage divergence). They belong to the
  modularization-closeout window; flagged to the owner below.

## Open questions for the owner (non-blocking for S3)

1. **The two pipeline P0s (S2-D4):** the CFTC Nov 10 report and the GPR
   daily file are published upstream but un-ingested on the live page
   (both render "Couldn't be read" today). Options: A) a one-off
   ops session on main fixes both now (outside GPE, inside the normal
   repo discipline); B) they wait for the modularization closeout.
   *Recommend A — they are the meter's only two self-inflicted dark
   seats, and one is a whole lane (Flows) voting "unread".*
2. **#02 (million-tonnes FA) is a one-string fix on main.** Same
   A/B question as above. *Recommend A.*

## Known problems carried forward (from the audit, for S3+/S6/S8)

- The full issue log GPE-S2-01…30 with evidence lives in the audit doc;
  the fix-first three are #01, #02, #09.
- AGENTS.md drift items (#28, #29: basket currency count, live-price
  source attribution) are recorded for the end-of-program
  reconciliation commit only.

## Done-criteria check (this session)

audit covers all sections × locales × viewports ✅ · ≥30 numbered issues
with evidence ✅ (30) · 12 dimension scores justified ✅ · integration-site
map for all three decided features ✅ · modularized-gold module inventory
table ✅ · data cross-check table complete ✅ (19 rows) · all committed
and pushed ✅ · S3 prompt written ✅ (below).

## Next-session prompt (S3)

```
Read AGENTS.md in the repo root first and follow it for the whole session.

You are running Session S3 of the Gold Page Elevation (GPE) program on
branch docs/gold-page-elevation. Read, in order: AGENTS.md,
docs/specs/gold-page-elevation/00-PROGRAM-PLAN.md (the program plan and
its rules, decisions D1–D8),
docs/specs/gold-page-elevation/s1/SUMMARY.md (S1 + the S1b addendum),
docs/specs/gold-page-elevation/s2/SUMMARY.md (S2 — this session's
predecessor), then the S2 deep audit
docs/audits/2026-11-17-gold-page-deep-audit.md (the Currena baseline
you will compare against — its §4 dimension scores are the head-to-head
benchmark) and the S1 docs you need: s1/07 (the Saham Analiz survey
audit this session deepens), s1/03 (causal chains), s1/08 (benchmarks),
s1/11–s1/13 (the three decided features whose integration lens applies
again).

Standing constraints (owner-reaffirmed S1b): research and spec
preparation ONLY. Do NOT touch main, any code, or the shared
bookkeeping files (docs/HANDOFF.md, CHANGELOG.md, docs/DECISIONS.md) —
the modularization program owns them. Do not implement anything —
implementation waits until the modularization program completes and the
owner lifts the constraint. Work only on docs/gold-page-elevation.
Commit and push after each milestone.

S3 objective: the DEEP audit of https://sahamanaliz.com/pages/gold and
the head-to-head comparison matrix against Currena's audited baseline.

M1 — Section-by-section field audit of sahamaliz.com/pages/gold
(browser, rendered): every section from the s1/07 inventory, both
locales if the site has them (check FA/EN), three viewports
(1440/768/390), every interactive element (chart ranges 1m–20y, the
50/200DMA overlays, calculators, tabs, prediction-market probabilities,
any narrative/prediction toggles — click them all), loading/empty/
error/stale states, and the data behind their claims where checkable
(their weekly gold-vs-real-yields correlation, their Fed probability
source, their calculator math). Log every finding as a numbered issue
(ID, section, observation, severity, evidence), same format as S2's
GPE-S2-## series — continue the numbering as GPE-S3-##.

M2 — Head-to-head comparison matrix: Currena (from the S2 audit, no
re-audit needed except where a comparison requires a fresh look) vs
Saham Analiz across the 12 audit dimensions, with per-cell evidence
citations (issue IDs from both audits), plus a section-by-section
feature matrix (what each page has/lacks), and the honest-treatment
comparison (both pages made honesty claims S1 noted — verify both again
today). Include the integration lens: for each of the three decided
features (Iran bridge, CB-demand, TA block), how does Saham Analiz's
current handling look (their USD-only jewelry calculator, any demand/
positioning content, their DMA overlays) and what does the comparison
imply for Currena's build (borrow / differentiate / ignore)?

M3 — Scoring + verdict: score Saham Analiz on the same 12 dimensions
with written justifications and issue cross-references; write the
head-to-head verdict (which page wins which dimension and why, with the
strategic implication for S6 IA); flag every claim on their page that
failed a data check (match/mismatch/stale/unverifiable), mirroring the
S2 §7 method with at least 8 sampled readings where their sources are
identifiable.

Write the deliverable to docs/audits/2026-11-XX-sahamanaliz-competitor-deep-audit.md
+ the comparison matrix (same doc or a companion
docs/audits/2026-11-XX-gold-head-to-head-matrix.md — your call, keep
AGENTS.md §3 format), commit, push, then write
docs/specs/gold-page-elevation/s3/SUMMARY.md with findings, decisions,
open questions, and the S4 next-session prompt (international benchmark
deep-dive: WGC Goldhub data model, LBMA, Kitco, Trading Economics; the
Persian ecosystem map; the data-source reality check per candidate
indicator — including the S2-flagged verification items: TGJU unit
conventions, CBI mint specs, WGC attribution wording + download
workflow, IMF IFS series IDs, and the CPI shutdown-gap policy).

Done-criteria: competitor audit doc covers all their sections ×
locales × viewports with ≥25 numbered issues with evidence; the 12-
dimension head-to-head matrix complete with per-cell citations; ≥8
data checks on their claims with verdicts; the integration-lens
comparison for all three decided features; the S4 prompt written; all
committed and pushed. Known context to carry: S2's fix-first list
(GPE-S2-01/02/09) and the two operational P0s (CFTC + GPR pipeline
misses) — do not re-litigate them, cite them.
```
