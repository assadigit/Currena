# Gold card: balance visual (Insights page)

Place this file in the repository at `docs/insights/gold-balance-card-spec.md`.

## 1. Context

**Context:** The "Gold" signals card on the Insights page (`https://currena.ir/#/insights`, repository `assadigit/Currena`, Cloudflare Workers). The card now shows a grouped list: "Works against", "Sitting neutral" and "Price footing". Replace the driver list with a balance visual. Keep the data, the signal logic and the explanation texts as they are.

**Goal:** A visitor with no finance education sees in five seconds which way the conditions lean for gold, and how many drivers could not be read.

**Product type:** Information tool, not a store. Optimise for fast understanding, not for conversion.

## 2. Working rules for the agent

1. Work alone from start to finish. Do not ask the owner any question.
2. When a detail is missing, choose the simplest option that follows this spec. Write the choice in the notes file (section 15).
3. Inspect the repository first. The framework and the styling method are not known. Find them. Match the existing code style.
4. Add no new dependency. Build the beam with CSS transforms or inline SVG, whichever matches the existing page code.
5. Make no new API call. Make no new Cloudflare KV read or write. Use only the data the card already receives.
6. Build the visual as one reusable component that takes a list of drivers. Apply it to the Gold card only. Do not apply it to other cards.

## 3. What stays and what changes

**Stays unchanged:**
- The signal logic, the thresholds and the data sources.
- The verdict banner sentence at the top of the card (for example "Gold is near its 10-year high while real yields are also high ...").
- The explanation text of each driver (for example "Low or falling real yields usually support gold ...").
- The "Price footing" content: the gold and silver price, the 10-year position and the 30-day speed.
- The page language toggle, the Persian digits and the Jalali date rules.

**Changes:**
- Replace the groups "Works against" and "Sitting neutral" with the balance visual and two trays (sections 5 to 8).
- Move "Price footing" below the trays as a separate strip (section 9).

## 4. Data mapping

The Gold card has four drivers: real yields, inflation expectations, market stress and the US dollar. Read the list from the existing data. Do not hard-code four.

Give each driver one of four states:

| State | Meaning |
|---|---|
| `for` | The reading works with gold. |
| `against` | The reading works against gold. |
| `neutral` | The driver was read and has no effect on gold. |
| `unread` | The driver could not be read (the card shows "Cannot read"). |

Treat `neutral` and `unread` as different states. They have different meanings.

If the current data model merges `neutral` and `unread`, split them only when the underlying data allows it. Otherwise treat every merged item as `unread`, and write this in the notes file.

Define these values:
- `total` = the number of drivers in the card.
- `net` = the number of `for` drivers minus the number of `against` drivers.
- `readable` = the number of `for`, `against` and `neutral` drivers.

All drivers weigh the same.

## 5. Layout, top to bottom

1. **Verdict line.** One verdict word with an icon (section 13), then the count line.
2. **Verdict banner sentence.** Keep the existing sentence, unchanged.
3. **Balance.** The beam, the pivot and two pans with blocks.
4. **Trays.** "Neutral" tray and "Couldn't read" tray (section 8).
5. **Price footing strip.** (Section 9.)

**Why:** The verdict answers the first question ("which way?"). The balance answers the second ("which drivers?"). The tray answers the third ("what is missing?").

## 6. Beam and tilt rule

1. Draw a horizontal beam with a small pivot (fulcrum) in the centre. Draw one pan at each end of the beam.
2. Put the `for` pan at the inline-start end and the `against` pan at the inline-end end. In English this is left and right. In Farsi the layout mirrors.
3. Use this rule for the tilt:
   - If `net` = 0, keep the beam level.
   - If `net` > 0, lower the `for` side.
   - If `net` < 0, lower the `against` side.
   - Calculate the ratio as `abs(net) / total`.
   - Calculate the angle as `ratio × maxAngle` (suggested `maxAngle`: ~14°).
   - If `net` ≠ 0, apply a minimum angle so a one-driver lean stays visible (suggested minimum: ~3°).
4. If `readable` = 0, keep the beam level. Show the verdict "Can't read the conditions right now". Show all drivers in the "Couldn't read" tray.
5. Keep the text and the blocks upright. Rotate only the beam. Move each pan up or down to follow its beam end.
6. In Farsi (right-to-left), flip the sign of the rotation so the lowered side still matches the heavier side.
7. Animate a tilt change with a short ease (suggested: ~500 ms). If the user has `prefers-reduced-motion`, set the final position with no animation.

**Why:** Dividing by `total` (not by `readable`) makes unread drivers pull the beam toward level. A single reading from four drivers then does not cause a strong lean. The rule needs no extra threshold.

**Note:** The heavier side goes down, like a real scale. The icon and the label on each side state its meaning, so the position never carries the meaning alone.

## 7. Blocks

1. Draw one block for each `for` and each `against` driver. Make all blocks the same size. Stack them vertically inside their pan.
2. Show in each block: an icon, the short driver name and the current value (for example "Real yields 2.84%").
3. Use a different icon shape for each side. Use an upward-trend icon for `for` and a downward-trend icon for `against`. Add a text label above each pan ("For gold" and "Against gold").
4. Make each block a real `<button>`. Set `aria-expanded`. Give each block a visible focus style.
5. On a narrow screen (below about 900px), a tap on a block opens its existing explanation sentence in a detail panel directly under the balance. Allow one open panel at a time. A second tap closes it.
6. On a wide screen (about 900px and above), show the explanation sentence inside the block. No tap is needed.
7. Make the block height at least ~44px, so a thumb can tap it.
8. Wrap long names onto a second line. Do not cut text with an ellipsis. Keep the text size at or above ~14px.
9. If one pan has more than four blocks in the future, place the extra blocks in a second column inside that pan.

## 8. Trays

1. Under the balance, draw two small groups. Give each group its own heading.
2. **"Neutral" tray:** drivers with the state `neutral`. Draw them as small chips with a quiet style.
3. **"Couldn't read" tray:** drivers with the state `unread`. Draw them as small chips with a dashed outline and the existing clock icon.
4. Make every chip tappable. A tap shows the existing explanation sentence in the same detail panel as in section 7.
5. Hide a tray when it has no chips.
6. Never draw a tray chip on the beam.

**Why:** "Neutral" means "read, no effect". "Couldn't read" means "unknown". The visitor must see the difference.

## 9. Price footing strip

1. Keep the "Price footing" heading and the existing items (Gold and Silver, with the 10-year position and the 30-day speed).
2. Put the strip below the trays. Separate it from the balance with a clear gap and a divider line.
3. Do not count price footing items in `total`, `net` or `readable`.

**Why:** Price footing describes the price of gold. It is not a driver. Counting it would count the real-yield push twice.

## 10. Responsive behavior

1. Design the mobile layout first. Test it at a ~360px wide screen.
2. On mobile, make the beam the full width of the card. Make each pan about half of the card width, minus a small gap.
3. On desktop, centre the beam and limit its width (suggested: ~720px max).
4. Allow no horizontal scroll at any width from ~320px up.
5. Use relative units and the existing breakpoints of the project when they exist.
6. Use logical CSS properties (`padding-inline-start`, `margin-inline-end`, `inset-inline-start`). Do not use `left` or `right` for spacing or position.

## 11. Farsi and right-to-left

1. Use the existing language toggle and translation method of the page. Add the new strings to both languages.
2. Mirror the layout in Farsi: the `for` pan moves to the right, the `against` pan moves to the left.
3. Show all numbers in Persian digits in Farsi. Use the helper the page already uses.
4. Keep the beam rotation sign correct in right-to-left (section 6, step 6).

## 12. Accessibility

1. Give the balance `role="img"` and an `aria-label` that states the result. Example: "Balance for gold: 1 against, 3 couldn't be read. Leaning against gold."
2. Never let colour carry meaning alone. Every state has an icon and a text label as well as a colour.
3. Reuse the green and red tokens the page already uses for its chips. Do not invent new colours. Keep text contrast at WCAG AA (4.5:1) or better.
4. Keep the tab order logical: verdict, `for` blocks, `against` blocks, trays, price footing.

## 13. Copy

Use these strings. In Farsi, use the existing site term when the page already has one for the same idea. The Farsi strings below are proposals.

| Key | English | Farsi (proposal) |
|---|---|---|
| side.for | For gold | به نفع طلا |
| side.against | Against gold | به ضرر طلا |
| verdict.for | Leaning for gold | تمایل به نفع طلا |
| verdict.balanced | Balanced | متعادل |
| verdict.against | Leaning against gold | تمایل به ضرر طلا |
| verdict.none | Can't read the conditions right now | فعلاً شرایط قابل‌خواندن نیست |
| tray.neutral | Neutral | خنثی |
| tray.unread | Couldn't read | قابل‌خواندن نیست |

**Count line:** Join the non-zero parts with " · ". Omit a part when its number is zero.
- English: "{n} for · {n} against · {n} neutral · {n} couldn't be read".
- Farsi: "{n} به نفع · {n} به ضرر · {n} خنثی · {n} قابل‌خواندن نیست".
- Example: "1 against · 3 couldn't be read".

## 14. Verification (run on your own, loop until all pass)

1. Run the site locally.
2. Render the Gold card with these test cases. Use a temporary test harness or test file. Do not ship test data to production.
   - A: 1 `against` and 3 `unread` (the current state).
   - B: 2 `for` and 2 `against`.
   - C: 3 `for` and 1 `neutral`.
   - D: 4 `unread`.
   - E: 4 `against`.
3. Take screenshots of every case at ~360px and ~1280px width, in English and in Farsi. Take case A also at ~768px.
4. Check each point:
   - The beam tilts as section 6 states. Case B is level. Case D is level.
   - No horizontal scroll at ~320px.
   - No cut text. No overlapping blocks.
   - Every block and chip is ~44px high or more.
   - The Farsi layout is mirrored, shows Persian digits and tilts toward the correct side.
   - Keyboard: Tab reaches every block and chip. Enter or Space opens the detail panel.
   - `prefers-reduced-motion` stops the animation.
   - The browser console shows no error.
   - The network tab shows no new request.
5. If a check fails, fix it and run the full list again. Repeat until all checks pass.
6. If a tool for screenshots is missing, install it as a development dependency only (not in the production bundle). If that is impossible, write this in the notes file.

## 15. Notes, commit and final report

1. Create `docs/insights/gold-balance-card-notes.md`. Record the stack you found, every assumption, every deviation from this spec and the result of each check.
2. Save the screenshots in `docs/insights/screenshots/gold-balance/`.
3. Commit all work on a new branch named `feature/gold-balance-card`. Push the branch. Do not merge it. Do not deploy.
4. End with a short final report in plain language (no jargon): what changed, which checks passed, which assumptions you made, and the one command that merges the branch.

## 16. Do not

- Do not change the signal logic, the thresholds, the data sources or the explanation texts.
- Do not add weights. All drivers weigh the same.
- Do not put `neutral` or `unread` items on the beam.
- Do not apply the component to other cards.
- Do not add a dependency.
- Do not word anything as a prediction (for example "gold will fall"). The visual describes the pressure on gold today.
