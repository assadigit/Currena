You are the build agent for the Currena Insights gold card redesign. Work alone and finish the whole job. Do not ask me questions. When something is unclear, choose the safest reasonable option, write it into `docs/insights/gold-card/ASSUMPTIONS.md`, and continue.

SETUP (do this first)
1. The spec folder `gold-card-spec/` is in the repo root (or at `docs/insights/gold-card/`). If it is in the root, move it to `docs/insights/gold-card/` with `git mv` and commit.
2. Create a branch `feat/gold-card-balance`.
3. Read, in this order: `00-OVERVIEW.md`, `03-LOGIC-AND-DATA-SPEC.md`, `01-UX-SPEC.md`, `02-VISUAL-SPEC.md`, `04-COPY-EN-FA.md`, `05-ACCEPTANCE-AND-TESTS.md`. Open `reference/gold-card-reference.html` in a browser (or read its source) to see the target look.

DISCOVER
4. Inspect the repo. Find the framework, the styling method, the i18n method, the test runner, and the current gold card component (search for "aggregate of factors", "Price footing", "Couldn't read", "Real yields"). Write what you find into `ASSUMPTIONS.md`.
5. Check how the dark theme and Farsi/RTL are implemented, and reuse them.

BUILD
6. Replace the gold card's presentation with the new card from the spec. Reuse the existing factor states and data. Do not change how states are calculated. Do not add network calls or KV reads.
7. Add the pure logic function from file 03 and port the reference tests. All test vectors must pass.
8. Render the card for both assets (Gold and Silver) with the Gold | Silver control.
9. Move every string into the i18n files. Before using a Farsi string from file 04, search the repo for an existing Currena term and prefer it.
10. Match `reference/gold-card-reference.html` in structure, spacing, color and motion, in light and dark, English and Farsi, desktop and mobile.

VERIFY (loop)
11. Run the loop in `05-ACCEPTANCE-AND-TESTS.md`: tests, then 8 screenshots, then the checklists. Fix every miss and repeat. Stop after 6 loops at most.
12. Do not touch the hero, the stock-index section, or the currency section.

FINISH
13. Commit in small commits on the branch. Write `BUILD-REPORT.md` (what changed, files, assumptions, test results, screenshots). Write `OPEN-ITEMS.md` only if something stays open.
14. End with a short summary of what you built and anything I must check by eye.
