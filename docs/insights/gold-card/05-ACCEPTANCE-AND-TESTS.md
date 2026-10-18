# 05 — Acceptance checklist, tests and verification loop

**Context:** how the build agent proves the gold and silver cards are finished, without asking the owner anything.

## A. Logic (automatic tests)
1. Port `reference/lean-logic.test.js` and make all 10 vectors from file 03 pass.
2. Add tests: all-unread gives verdict `none`; a stale reading becomes unread; a missing `flip` hides the flip line; silver with industrial demand unread and 4 others read is `enough`.

## B. Structure (checklist)
- [ ] Card order: header, verdict, beam, neutral/unread band, price context, rows, flip line, footnote.
- [ ] Price is not a weight and not counted. No "Works against" on the price line.
- [ ] Beam stays level when coverage is below 75%.
- [ ] Unread drivers always visible (ghost chips) and always have a row.
- [ ] Flip line hidden when no threshold exists.
- [ ] The old duplicated "Factors supporting gold's price" box and the old "Couldn't read" chip row are removed.
- [ ] Gold | Silver control works with keyboard.

## C. Visual (compare with `reference/gold-card-reference.html`)
- [ ] Render the card in 8 combinations: light/dark × English/Farsi × desktop(1280) / mobile(375). Capture a screenshot of each.
- [ ] Beam tilt direction matches the heavier side in both languages (in Farsi the supports end is on the right).
- [ ] No horizontal scroll at 375px.
- [ ] At 375px the in-beam token text is hidden and the two lists are shown.
- [ ] Numbers, prices and signed percentages keep their order in Farsi.
- [ ] Persian digits in Farsi, Latin digits in English.

## D. Accessibility
- [ ] Every state has an icon and a word, not only a color.
- [ ] Contrast pairs in file 02 are met (spot-check with a script).
- [ ] Tab order is logical; focus ring uses `--gc-accent`.
- [ ] `prefers-reduced-motion` removes the animation.
- [ ] SVG has title and description built from the data.

## E. Performance and limits
- [ ] No new KV reads or writes, no new API calls.
- [ ] No new runtime dependency unless the repo already uses it.
- [ ] Card renders without layout shift (reserve height while loading).

## F. Human check (after the agent finishes — the owner does this once)
Show the card to 5 people for 5 seconds each. Ask: "Is it good or bad for gold right now, and how sure is it?" Target: at least 4 of 5 answer both parts correctly.

## Verification loop for the agent
1. Implement the smallest working version of the card from the reference.
2. Run the tests (A). Fix failures. Repeat until green.
3. Render the 8 combinations (C). If a headless browser is available, take screenshots and compare each against the reference page in the same state. If no browser is available, install one the repo can use (for example Playwright with Chromium). If that fails, verify with a DOM/HTML snapshot test and state this in the report.
4. Walk checklists B and D. Fix every miss. Repeat steps 2 to 4 until all boxes are checked.
5. Stop after at most 6 full loops. If a box is still open, write it into `docs/insights/gold-card/OPEN-ITEMS.md` with the reason, and finish everything else.
6. Write `docs/insights/gold-card/BUILD-REPORT.md`: what changed, files touched, assumptions made, test results, screenshots list.
