# Session 4 — Visual references (the pattern sketch sheet)

**Spec:** `../11-visual-design-principles.md` (the rules) + `../12-visualization-mapping.md` (the 68-row assignments)
**Form:** `core-patterns-sketch.html` — one self-contained sketch sheet (no external dependencies; the shipped token values from `apps/web/src/index.css` inlined), rendered and captured at two widths.

## The files

| File | What it is |
|---|---|
| `core-patterns-sketch.html` | The sketch sheet itself — 12 panels, openable in any browser (it is a design reference, not production code; no framework, no build) |
| `core-patterns-desktop-1280.png` | Full-page capture at 1280×900 viewport (1,280 × 6,228 px) |
| `core-patterns-mobile-390.png` | Full-page capture at 390×844 viewport (594 × 12,231 px at 1.5× DPR) |

## The 12 panels (→ spec section)

1. **The five gold-impact states** — the semantic map: supports / pressures / steady+split / unread (dotted) / blocked (recessed+lock), plus the two-channel rule card (§11.4)
2. **The Composition Stack** — verdict said once → the brass beam sketch (tilt ≈ the S1 capture state) → the five LaneBars → the ledger affordance → the not-a-forecast caveat (§11.5)
3. **The BriefingCard** — the outlook container with the Q1-gated five-state word and the Q2-gated horizon/scenario slots drawn as dashed gates (§11.10, §12.6)
4. **The closed indicator card** — default tier, four examples: a 30-day band card (real yields), a zero-average diverging card (STLFSI), an unread card with its why-line, an inverted-polarity card (breadth) (§11.7.3)
5. **The expanded tier** — the desktop popover (VIX record: expanded content + the technical `<details>`) beside the mobile bottom-sheet sketch (§11.7.2)
6. **The RangeBand family** — band+trail, RangeBandYoY (the CPI/M2 basis exception), BandStepped (policy rates), and the fa variant (magnitude axis stays LTR; labels/digits localized; stacking mirrors) (§11.6.1, §12.1.1)
7. **CFTC two-track** — net (−100..+100, centre-zero, fill-from-centre) vs gross (0–100, origin-anchored) side by side with definitions (§12.4.5)
8. **Yield decomposition** — the StackedComposition identity with neutral component inks + the 30-day "which piece moved" line (§12.4.2)
9. **Flows vs stocks + correlation** — FlowColumn (SGE) vs LevelSpark (London vault) + the CorrelationStrip with the 2022 rotation marker (§12.4.3/§12.4.4)
10. **PriceMap + ProbabilityRow + AsOfChip** — the technical price ladder (SMA rules, pivot dashed, price marker + distance), the market-expectations row, and the one freshness grammar (§12.4.6, §12.1.9, §11.6.4)
11. **The relationship explorer** — the radial-hub sketch with M (solid) / C (dashed) / X (pennant) / K (heaviest + evidence tag) edges, the blocked-edge legend row, and the honesty footer (§12.5)
12. **Dark theme** — one card of each family in the dark token set, plus the BeamGlyph compact fidelity and the brass-weight rims on the dark ramp (§11.4.4, §11.5.2)

## Honest scope notes

- **All data is illustrative placeholder** (≈ the S1 capture state: "Leaning against gold", 1 for · 3 against, price ≈ $3,599, VIX ≈ 17.4) — never a live reading; the sheet is a *shape and grammar* reference.
- The brass beam in panel 2 is a simplified sketch of the shipped `BalanceScale` drawing (the production component is 1,401 lines with weights, dial ticks, hanger geometry, and the ledger — all preserved by the spec; the sketch shows the composition relationships only).
- **Verification:** both PNGs were captured from the HTML file in a real browser and reviewed (VLM) for render defects — all 12 panels render, no overlaps/clipping/broken SVGs; the two mobile soft spots the review noted (the radial explorer's density at 390 px; lane-count tightness) are precisely what the spec answers with the list-first mobile explorer (§12.5.1) and the stacked mobile LaneBar row (§12.7).
- The dark-panel tertiary-copy contrast the review flagged uses the shipped dark token values as-is (the spec's §11.2 consolidation list carries the general chart-typography floor for implementation).
