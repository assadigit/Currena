# Gold balance v6 — Iteration 4: the factors REST ON real pans (2026-10-26)

The owner's Iteration-4 directive: v5's factors-above-the-beam
composition did not "convincingly communicate that the factors are the
loads causing the balance to tilt". v6 rebuilds the drawing as one
connected weighing machine — real pans hang from the beam ends by thin
suspension lines, the compact factor tiles rest on the pan floors, and
the pans translate by exactly their beads' drop.

Captured on the temporary harness (route deleted before commit — no
test data ships). The verification numbers live in
`docs/insights/gold-balance-card-notes.md` §v6.

| File | What it shows |
|---|---|
| `before-v5-en-1280.png`, `before-v5-en-360.png` | The BEFORE state: v5's columns-above + abstract beam with endpoint dots — the disconnected composition the owner rejected |
| `compare-before-after-en-1280.png` | The before/after board (top: v5, bottom: v6) — the VLM verdict: "highly successful Iteration-4 implementation" |
| `draft1-v6-caseA-en-1280.png`, `draft1b-*`, `draft2-v6-*` | The design-iteration trail: draft 1 (thin beam, ghost pans) → draft 2 (weightier beam, junction dots, solid pans) |
| `sweep-en-caseA…H-1280.png` | The en scenario sweep, desktop: A (1 against, 4°, empty for-pan) · B (2v2, level) · C (3 for, 9°) · D (all unread, level, both pans "Nothing to weigh yet") · E (4 against, the full 12°) · F (1v1) · G (1v1+2 unread, level) · H (6/3 with "+4 more"/"+1 more" pills) |
| `sweep-fa-caseA/C/D/E/H-1280.png` | The fa RTL mirrors: for-pan (green) on the RIGHT, Persian digits, Persian markers — tilt directions verified per case |
| `sweep-en-caseA/E/H-360.png`, `sweep-fa-caseA/E/H-360.png` | Mobile 360: both pans fit side by side, tiles legible, zero horizontal overflow (also verified at 320px) |
| `sweep-en-caseA-1280-dark.png`, `sweep-fa-caseE-1280-dark.png` | Dark theme after the hanger/reference contrast fix (tertiary ink): beads, lines, pans and tiles all verified visible |
| `interact-en-caseH-expanded-1280.png` | Case H with the for list EXPANDED: the "+4 more" pill opened the full 6-row list below the assessment |
| `full-en-caseH-banner-1280.png` | The full-page case H with the banner variant riding in the assessment box (harness placeholder text — production computes the C12 note) |
| `full-fa-caseH-320.png` | The narrowest supported viewport (320px, fa): no overflow |
| `detail-en-caseE-1280.png` | The max-tilt (12°) detail: bead/hanger/pan alignment verified (pan-pair = bead-pair = 66.53px = 320×sin12°) |
| `final-v6-caseA-en/fa-1280.png`, `final-v6-caseA-en/fa-360.png` | The final state, both locales, desktop + mobile |

The measured verification numbers behind this set (pan/bead sync at
every angle, the overflow checks, the keyboard pass, the VLM design
reviews, the gate numbers) live in
`docs/insights/gold-balance-card-notes.md` §v6.
