# DECISION LOG — Gold Intelligence & Visual Explanation programme

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

**Purpose.** Cross-session decision record for the 15-session Gold Intelligence
& Visual Explanation programme (the follow-up to the completed nine-session
Gold UX redesign). The spec set under `docs/specs/gold-intelligence-visual-explanation/`
is the programme source of truth; this log records implementation decisions,
discoveries and deviations *within* the sessions. Never record credentials here.

**Format:** newest first; one `GIE-S<n>-D<m>` block per decision.

---

## GIE-S1-D1 — The programme's session home and filing (2026-11-21)

The owner uploaded `gold_intelligence_visual_explanation_spec_pack.zip` to the
repo root (four markdown planning documents, plus the standing
`Gold Market Dashboard Infographic.png` concept reference already at root).
Filed per AGENTS.md §8/§13 conventions: the ZIP preserved byte-for-byte as
`spec-pack.zip` + the four documents extracted with numeric prefixes into
`docs/specs/gold-intelligence-visual-explanation/` (md5-verified identical to
the upload) + the infographic moved with `git mv` (history preserved) + this
README/DECISION_LOG pair. The original four file names remain valid
cross-references inside the documents; the README records the mapping. The
root ZIP stays (the owner's upload, preserved); it now has a documented home
in the spec folder. **Decided by:** the agent (routine filing, reversible).
**Revisit:** only if the owner wants the root ZIP removed.

## GIE-S1-D2 — S1's deliverables live under docs/audits/ (2026-11-21)

The spec's S1 asks for a "dated audit under `docs/audits/`" while the older
gold-redesign programme kept its session reports under `docs/gold-redesign/`.
Decision: this programme is a NEW programme — its S1 audit deliverables go to
`docs/audits/2026-11-21-gold-intelligence-s1/` per the spec's own words and
AGENTS.md §8's `docs/audits/` convention (the folder is created by this
session; it did not exist before). The programme's session reports from S2 on
land beside the spec set in `docs/specs/gold-intelligence-visual-explanation/`
(the gold-page-elevation `s<n>/SUMMARY.md` pattern). **Decided by:** the agent
(following the spec + repo conventions). **Revisit:** never — structure only.

---

## GIE-S1-D3 — S1's verified baseline counts (2026-11-21)

The audit's reconciled inventory, recorded so later sessions never re-derive or conflate: **52 unique canonical metrics** on /gold (37 voters + 11 context + 4 blocked-absent) · the voters 7/7/11/10/2 across the five lanes (polarity 19× +1, 18× −1) · ~16 non-indicator modules · 25 relationship records (M 14 · C 10 · X 1 · K 0) · 3 price surfaces (the live GC=F futures overlay, the EODHD XAUUSD.FOREX spot series, the gold-api history legs) · 17 first-party requests per full load · page 17,331 px / 26,399 px (en desktop/mobile). The "37+" of the spec = the 37-seat meter. Live state at capture: net −2, 1 for · 3 against · 1 not leaning, outlook bearish → "moderately pressure gold", US$3,539. **Decided by:** the audit (derived independently from the engine, the placement table and the live DOM; they reconcile). **Revisit:** S4 refreshes the atlas against the same method.

## GIE-S1-D4 — The price-instrument finding carried to S2 (2026-11-21)

The hero's live quote is **COMEX front-month futures (GC=F)**, not spot XAU/USD; the chart/history legs are XAUUSD spot. The engineering rationale (futures basis typically < 1%, the honest venue label, matching units) is recorded in `packages/insights/src/shared/prices/definitions.ts` and the labels are honest at point of use. The parent strategy's "XAU/USD spot preferred" decision + the new spec's §4 "verify the primary instrument" make this a **documented discrepancy, not a defect**: S2 must record the instrument semantics in the claim-to-evidence contract (the briefing must never mix "spot" language with the futures live quote) and propose any correction to the owner — never silently alter the feed. **Decided by:** the audit (evidence-based recording). **Revisit:** S2.

## GIE-S1-D5 — The live harness files are committed read-only tooling (2026-11-21)

`apps/web/visual/gie-s1-live.config.ts` + `gie-s1-screenshots.plw.ts` join the repo's visual harness (the gux-s9-live pattern; new files in `apps/web/visual/` are wiring-allowed per AGENTS.md §15.2). They capture production read-only (plain visitor GETs; the REAL `theme` key per S8-D3). **Decided by:** the agent (the repo's own harness convention). **Revisit:** S5/S6 extend the set for the prototype matrix.
