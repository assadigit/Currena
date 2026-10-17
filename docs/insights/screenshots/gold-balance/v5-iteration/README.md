# Gold balance v5 — the wireframe-reference re-composition (2026-10-26)

The owner's reference board lives at
`docs/ui-reference/gold-silver-balance-target-wireframe.png`. The v5
iteration re-composes the component to its hierarchy — the two opposing
factor columns ABOVE the abstract beam, the beads under the columns'
centres, the compact assessment box beneath, per-column progressive
disclosure — while keeping the v4 abstract editorial mark and the
untouched tilt law. Captured on the temporary harness route (deleted
before commit) at 1280×900 / 360×800, light + dark, en + fa.

## The loop

- `before-v4-A-1280-en.png` — the v4 baseline (illustration first, lists
  beneath, divider-separated verdict at the end) before any v5 edit.
- `v5-draft1-*` / `v5-draft2-*` — the iteration passes: draft1 = the
  first re-composition; draft2 adds the empty-state tint block and the
  verdict-word hierarchy the VLM critique rounds asked for.
- `v5-*-1280-en.png` (A, B, C, D, E, G, H) — the final battery.
- `v5-H-1280-en-expanded.png` — case H with the for-column expanded
  ("+3 more" → 6 rows + "Show fewer"); the SVG zone is byte-identical
  before/after (asserted by the test suite).
- `v5-B-banner-1280-en.png` — the C12 gold-high-with-high-real-yields
  banner riding inside the assessment box.
- `v5-A-1280-fa.png` / `v5-C-1280-fa.png` / `v5-H-1280-fa.png` — fa RTL
  at 1280: the for column and its green bead on the RIGHT (inline-start
  of RTL), the SVG mirrored by scaleX(-1), Persian digits.
- `v5-A-360-fa.png` / `v5-C-360-fa.png` / `v5-H-360-en.png` /
  `v5-B-banner-360-en.png` — mobile: columns stacked with both side
  labels, compact beam, no horizontal overflow.
- `v5-A-1280-en-dark.png` / `v5-A-1280-fa-dark.png` — the dark theme.

## The cases (same driver fixtures as the test suite)

- **A** 1 against + 3 unread → 4° floor, against bead down, the for
  side empty (evidence-based line in the tint block).
- **B** 2 for + 2 against → balanced, level beam.
- **C** 3 for + 1 neutral → 9° for-heavy, against side empty.
- **D** 4 unread → level beam, BOTH sides carrying the distinct
  unavailable line, everything in the unread tray.
- **E** 4 against → the full 12°, for side empty.
- **G** 1 for + 1 against + 2 unread → net 0, level.
- **H** 6 for + 3 against → the disclosure case (3 + "+3 more"),
  geometry identical to any other 3-net case.

## Verified on the harness

- Bead Δy = Lh×sin(angle), 0.0u diff on every case at 1280 AND 360
  (DOM-measured; the arm is the drawn 260u, the angle law untouched).
- Bead centres under the column centres (480 vs 477 px at 1280 — the
  3px residue is the grid gap).
- The pivot exactly on the footprint's centre axis; the assessment box
  centred under it.
- Keyboard: focus + Enter opens the shared detail panel
  (`data-balance-detail` follows); one panel at a time.
- No horizontal overflow at 320/360/1280 (scrollWidth === clientWidth).
- Zero console errors on every capture session.
- VLM final review: "professional editorial data visualization" — all
  tilt/empty/unavailable/RTL/mobile states pass.
