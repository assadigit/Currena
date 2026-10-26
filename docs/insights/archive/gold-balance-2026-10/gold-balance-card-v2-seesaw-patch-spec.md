# Gold card: balance visual, v2 patch (seesaw geometry)

Place this file in the repository at `docs/insights/gold-balance-card-v2-seesaw-patch-spec.md`.

## 1. Context

**Context:** The balance visual on the "Gold" signals card of the Insights page (`https://currena.ir/#/insights`, repository `assadigit/Currena`, branch `feature/gold-balance-card`). Version 1 works in logic but fails in drawing. This patch replaces only the drawing of the balance (beam, pans, blocks, pivot). Keep everything else.

**Goal:** The picture must show the real lean, and nothing more. One reading out of four drivers must look like a small lean.

## 2. Working rules for the agent

1. Work alone from start to finish. Do not ask the owner any question.
2. Read `docs/insights/gold-balance-card-spec.md` and `docs/insights/gold-balance-card-notes.md` first.
3. The v1 spec stays valid. This patch overrides v1 sections 6 (geometry only), 7 (steps 5 to 8) and 10 (steps 2 and 3) where they conflict.
4. Continue on the existing branch `feature/gold-balance-card`. Add new commits. Do not merge. Do not deploy.
5. Change only the files that draw the balance, and the strings and tests that belong to it. Do not rewrite the card.
6. Add no dependency. Make no new API call. Make no new KV read or write.
7. Make a decision for every missing detail. Write each decision in the notes file.

## 3. Problems in v1 (reproduce them first, then fix them)

1. **The picture exaggerates the lean.** Each pan hangs below its beam end, so a tall stack pushes its pan far down. With 1 `against` block and 0 `for` blocks, the two pan bars sit about 150px apart, while the beam ends sit only about 30px apart. The picture shows a heavy lean for a light signal.
2. **The block is too big.** It contains the full explanation sentence. It is about 100px high.
3. **The pivot points the wrong way.** The triangle hangs under the beam like a pointer. A fulcrum must hold the beam up from below.
4. **The empty side looks broken.** It shows a bare grey bar.
5. **The beam is thin and pale.** The count line is small and light grey. The count line is the honesty element and must be easy to read.

## 4. What stays unchanged

- The data mapping and the four states (v1 section 4).
- The tilt rule: `net`, `total`, `ratio`, direction and the level beam when `readable` = 0 (v1 section 6, steps 3 and 4).
- The verdict word, the verdict banner sentence, the trays, the price footing strip, the copy, the RTL mirroring and the accessibility rules.
- The `role="img"` summary and the `aria-label`.

## 5. New geometry: a seesaw with level plates

Order from top to bottom: verdict line, count line, verdict banner sentence, balance zone, caption row, detail panel (only when open), trays, price footing strip.

### 5.1 Beam

1. Draw one straight beam. Rotate only the beam, around the pivot point at its centre.
2. Make the beam thick (suggested: ~10px) with fully rounded ends.
3. Colour the beam and the fulcrum with the existing secondary text colour of the page. The contrast against the card background must be at least 3:1.
4. Define `Lh` as the distance between the two hinge points (the beam ends, where the plates attach). Make `Lh` about half of the card's inner width on mobile (about 170px at a 360px screen). On desktop, limit the balance zone to ~520px width, so `Lh` is about 340px.
5. Set `maxAngle` to ~12° and the minimum angle for a non-zero `net` to ~4°. Keep the v1 formula `ratio × maxAngle`.

**Why:** The angle and `Lh` fix the beam-end height difference. `Lh × sin(angle)` is the only height difference the picture may show.

### 5.2 Fulcrum

1. Draw the fulcrum as a triangle that points up. Put its apex on the underside of the beam, at the centre.
2. Put its base on a short, flat base line below it (suggested: ~96px wide, ~6px high).
3. Make the fulcrum tall enough that the lowered beam end stays above the base line at `maxAngle`. Use this rule: fulcrum height = (`Lh` ÷ 2) × sin(`maxAngle`) + ~12px.
4. Keep the fulcrum and the base line fixed. Do not rotate them.

### 5.3 Level reference line

1. Draw a thin dotted horizontal line through the pivot point, across the full width of the balance zone.
2. Draw it behind the beam, the plates and the blocks. Use a low-contrast colour.

**Why:** The line lets the eye compare the tilted beam with level. A small lean stays easy to see.

### 5.4 Plates (pans)

1. Replace the hanging pans with two level plates. Mount each plate on top of one beam end, with a small round hinge dot.
2. Make each plate a thin, rounded bar (suggested: ~6px high) as wide as a block.
3. Keep each plate level. Move each plate only up or down, by (`Lh` ÷ 2) × sin(angle), following its beam end. Never rotate a plate.
4. Stack the blocks upward from the plate surface.
5. The position of a plate must not depend on the number of blocks on it.

**Why:** Blocks that stand on a plate cannot move the plate. The picture then shows the lean only.

### 5.5 Blocks

1. Make every block compact: an icon (~20px), the short driver name and the current value. Show no sentence inside a block, at any screen width.
2. Make all blocks the same height (suggested: ~56px). The height must stay between 44px and 72px, also when the name wraps to a second line.
3. Keep a small gap between stacked blocks (suggested: ~6px).
4. Keep the text size at or above ~14px. Do not cut text with an ellipsis.
5. Keep the v1 rules for the button role, the focus style, `aria-expanded` and the different icon shape per side.
6. Open the existing explanation sentence in the detail panel under the caption row, on every screen width (this replaces v1 section 7, step 6). Allow one open panel at a time.

### 5.6 Empty side

1. When a side has no block, draw one dashed empty slot of the same size as a block on that plate.
2. Put no text in the slot. Hide the slot from screen readers (`aria-hidden`).

### 5.7 Captions

1. Put the two side captions ("For gold" and "Against gold") in one fixed row under the base line of the fulcrum. Put each caption under its own half. Add its side icon and its side colour.
2. Never move a caption with the tilt.

### 5.8 Reserved height

1. Reserve the vertical space of the balance zone from the largest stack on screen: (number of blocks in the larger stack × block height) + the gaps + the plate thickness + the maximum plate rise at `maxAngle` + ~8px.
2. Anchor the beam and the fulcrum at the bottom of the zone. The tilt then changes no layout size.
3. Make sure a stack never touches the verdict banner sentence above, at any angle.

### 5.9 Motion

1. Keep the v1 ease (~500 ms) for beam rotation and plate movement. Move the plates and the beam with the same timing.
2. With `prefers-reduced-motion`, set the final position with no animation.

## 6. Legibility of the verdict and the count line

1. Put the count line on its own line, directly under the verdict word.
2. Set the count line to at least ~14px. Use the primary text colour or the secondary text colour with a contrast of at least 4.5:1.
3. Keep the count line content as in v1 (zero parts are omitted).

## 7. Responsive numbers

| Screen | Zone width | Plate and block width |
|---|---|---|
| ~360px | Full inner card width | About half of the zone, minus a gap |
| ~768px | Full inner card width, max ~520px | About 180px |
| ~1280px | ~520px, centred | About 180px |

Use logical properties for spacing and position. Mirror the zone in Farsi. Flip the rotation sign in right-to-left, as in v1.

## 8. Measurable checks (run on your own, loop until all pass)

Run the local site. Use these test cases (temporary harness only, never ship test data):

- **A:** 1 `against`, 3 `unread`.
- **B:** 2 `for`, 2 `against`.
- **C:** 3 `for`, 1 `neutral`.
- **D:** 4 `unread`.
- **E:** 4 `against`.
- **G:** 1 `for`, 1 `against`, 2 `unread`.

Measure with the browser (element positions), not by eye:

| # | Check | Pass condition |
|---|---|---|
| V1 | Tilt geometry | The measured height difference between the two plate surfaces equals `Lh × sin(angle)` within 2px. Cases B, D and G show 0 within 1px. |
| V2 | Stack independence | The plate positions in case B and case G are equal within 1px. |
| V3 | Block size | Every block is 44px to 72px high. All blocks are equal within 1px. |
| V4 | Fulcrum contact | The apex touches the beam underside within 1px at every angle. The lowered beam end stays above the base line in case E. |
| V5 | No overlap | No stack touches the banner sentence, a caption or the tray. This holds in cases A to G, in English and Farsi. |
| V6 | Visibility | Beam and fulcrum contrast is 3:1 or more. Count line size is 14px or more, with a contrast of 4.5:1 or more. |
| V7 | Visible lean | At ~360px, the plate height difference is 10px or more in case A and 30px or more in case E. |
| V8 | Empty side | Cases A, D and E show the dashed slot on every empty side. The captions stay visible. |
| V9 | Stable zone | Switching between cases with the same larger stack changes the zone height by 0px. |
| V10 | Old checks | Every check in v1 section 14 passes again. |

Then take screenshots of every case at ~360px and ~1280px, in English and in Farsi. Take cases A and E also at ~768px. Open each screenshot. Write one sentence per screenshot in the notes file that states what a first-time visitor sees. If the sentence does not match the data of the case (for example it says "heavy lean" for case A), treat it as a failure. Fix the failure and run all checks again. Repeat until everything passes.

## 9. Notes, commit and final report

1. Update `docs/insights/gold-balance-card-notes.md`. Add a "v2" section: the problems you reproduced, every decision, a table with the measured value for each check (V1 to V10) and the screenshot sentences.
2. Replace the old screenshots in `docs/insights/screenshots/gold-balance/` with the new ones. Name them `v2-<case>-<width>-<lang>.png`.
3. Commit on `feature/gold-balance-card` and push. Do not merge. Do not deploy.
4. End with a short final report in plain language (no jargon): what changed, which checks passed (with the measured numbers for V1 and V7), your decisions, and the one command that merges the branch.

## 10. Do not

- Do not change the signal logic, the thresholds, the data sources or the explanation texts.
- Do not put `neutral` or `unread` items on the beam.
- Do not add weights. All drivers weigh the same.
- Do not let a plate move because of the number of blocks.
- Do not show a sentence inside a block.
- Do not apply the component to other cards.
- Do not word anything as a prediction. The visual describes the pressure on gold today.
