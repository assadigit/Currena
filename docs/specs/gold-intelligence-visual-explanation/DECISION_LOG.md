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
