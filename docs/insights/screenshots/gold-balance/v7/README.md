# Gold balance v7 — the Iteration-5 addendum: rotate the beam ONLY (2026-10-26d)

The owner's addendum "Rotate the beam only, and visualize weight":
exactly one rotating element (the beam group, by
`rotate(θ, pivotX, pivotY)`), pans that translate plumb and never
rotate, hangers recomputed every frame from each beam-end joint to
the pan's two fixed rim corners, and a pointer-needle gauge that
makes the smaller (8° max / 2° floor) presentation scale readable.
The model is count-based — no per-side totals, no per-factor
weights — so the side-load bar and per-tile weight marker are
deliberately skipped (never fabricate).

Captured on the temporary harness (route deleted before commit — no
test data ships). The verification numbers live in
`docs/insights/gold-balance-card-notes.md` §v7.

| File | What it shows |
|---|---|
| `before-v6-caseA-en-1366.png`, `before-v6-caseA-fa-390.png` | The BEFORE state: v6 (pan tilt + CSS-calc drops, 4° floor) — the comparison baseline |
| `after-v7-caseA-en-1366-light.png` | Case A AFTER: 1 against + 3 unread → net −1/4 → the 2° floor, against pan lower, needle left of centre |
| `after-v7-caseB-en-1366-light.png` | The 1-heavy-vs-4 fixture (4 for + 1 against): net +3/5 → 4.8°, FOR pan lower — the count settles it (the model has no weights) |
| `after-v7-caseC-en-1366-light.png` | The mirror (1 for + 4 against): 4.8°, AGAINST pan lower |
| `after-v7-caseD-en-1366-light.png` | The exact 5-vs-5 split: net 0 → level, "Balanced", needle at centre, no directional label |
| `after-v7-caseE-en-1366-light.png` | The model's full range (5 against, 5 total): the 8° maximum — for pan raised 22.27px, against pan lowered 22.27px (160 × sin 8°) |
| `after-v7-caseF-en-1366-light.png` | The unavailable state (0 readable): level, «Can't read…» label, NO needle (hidden per the addendum) |
| `after-v7-caseG-en-1366-light.png` | 2 against + 1 neutral, empty for pan: 5.33°, the complete empty pan + evidence line |
| `after-v7-caseH-en-1366-light.png` | Capacity (6 against + 1 for): 5.71°, 2 tiles per pan + the "+4 more" pill (never on the pan surface) |
| `after-v7-caseA/E/F/H-fa-1366-light.png` | fa RTL mirrors: for pan (green) on the RIGHT, the beam rotation sign flipped so the heavy end still dips, Persian digits + markers, gauge aria «شیب تیر: ۲ درجه…» |
| `after-v7-caseA/E-en-1366-dark.png` | Dark theme: hangers/reference/arc in the tertiary ink, pan tint /90 — all parts verified visible |
| `after-v7-caseA-en-390-light.png`, `after-v7-caseA-fa-390-light.png` | Mobile 390: the drawing scales as one piece (stage 326px, drops ±11.34 = 81.5 × sin 8°), 12.48px horizontal tile labels, zero overflow |
| `after-v7-caseE-fa-390-light.png`, `after-v7-caseH-fa-390-light.png`, `after-v7-caseF-en-390-light.png` | Mobile max-tilt, capacity and unavailable states in RTL/LTR |
| `after-v7-caseE-en-768.png` | Tablet 768: the stage max-w-640 keeps the geometry at the design width |

Numeric verification per case (aggregate score, θ, lower pan) and the
DOM/mid-animation audits: see `docs/insights/gold-balance-card-notes.md`
§v7 "Verification".
