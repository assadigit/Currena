# Start prompt for the new session (paste once, then leave it running)

You are working in the Currena repository (github.com/assadigit/Currena, Cloudflare Workers, site currena.ir). The **Compound Wealth** tool is already live at https://currena.ir/tools/compound-wealth. Your job is to upgrade it to **spec v6**, then test it rigorously and fix every real defect, without asking me any questions.

The most important rule: **the tool must be simple.** If anything seems to conflict with simplicity, simplicity wins: put the feature in "More options" or leave it out and say so in the report.

## Files you have been given

They are in `compound-wealth-pack.zip` in the repo root. **Unzip it into the repo root first** (overwrite older copies), then you will have:

- `COMPOUND-WEALTH-SPEC.md` — spec v6. It replaces all older versions and is complete on its own.
- `COMPOUND-WEALTH-START-PROMPT.md` — this file.
- `COMPOUND-WEALTH-TEST-PROMPT.md` — the full testing instructions you will follow in step 8.
- `compound_reference_check.py` — an independent reference engine. Run `python3 compound_reference_check.py --selftest` first; every line must say PASS. It recomputes every number the tool shows and can generate a grid of scenarios.

Do not commit `compound-wealth-pack.zip` itself; commit the unzipped files.

## Do this, in order, on your own

1. **Prepare.** Read `COMPOUND-WEALTH-SPEC.md` completely, especially section 0 (simplicity contract), section 1 (what is live, what to protect, the work list W1–W8), section 5.1.1 (the percent-of-salary mini calculator), section 6 (maths), section 7 (figures and verification), section 12 (tests). Then read `AGENTS.md` / `agent.md` if present, `INSIGHTS-L1-STYLE-GUIDE.md`, the existing Compound Wealth code and figures file, `COMPOUND-WEALTH-REPORT.md` if it exists, and the Worker routing. Find the repo's single gates command and run it now to record the starting state. Open the live page in a real browser and note how it behaves today.
2. **Plan privately.** Add a short plan to `COMPOUND-WEALTH-REPORT.md`. Where the spec is silent, choose the simplest option that serves its goal and note it. Do not ask me anything.
3. **Protect what works.** Before changing anything, write regression tests that lock today's verified numbers (section 1.1 of the spec) so nothing regresses. They must pass on the current code.
4. **Fix the audit items.** W1 (small-changes wording in money or percentage points, never "1% more" when it is 10% of the amount), W2 (no yearly cost on Cash, with the config switch `APPLY_COST_TO_CASH = false`), W3 (inflation caption next to today's money and recent inflation in "How is this worked out?"), W5 (name the exact index behind each asset), W6 (currency symbol on the tiles, working "Tools" link in the header, no "↗" icon on links that stay on currena.ir). Add the tests 33–38 from the spec as you go.
5. **Build the percent-of-salary mini calculator (W7).** Exactly as section 5.1.1: an **Amount | % of salary** switch inside the "Per month" group; Amount mode with an "Add your salary (optional)" link and the live "That is 2.0% of your salary." line; % mode with percent box, stepper, chips 1·3·5·10, salary box with per year / per month, and the always-visible live line "3% of A$90,000 a year = A$225 a month."; mode switching that keeps the person's place; the amount growing with salary in % mode; cards showing the percentage and monthly amount but never the salary. The default screen must still show the answer on arrival in Amount mode, with the same three control groups and two buttons. Add tests 25–32.
6. **Refresh and verify the figures (W4).** Use the latest quarter-end common to all rows (target 30 September 2026 or later). Re-verify every row against its source, recompute derived rows yourself, and cross-check against independent sources as listed in section 7 of the spec. **Do not invent, estimate, or take any number from memory.** Do not scrape sites that forbid it, do not use paid data, do not copy whole tables. If a reliable figure cannot be found, hide that chip and list exactly what is missing and where it could come from in the report. If you have no web access, still build everything with the missing rows hidden and list every needed figure with suggested sources in the report.
7. **Run the unit and browser tests.** Run the gates command and every test in section 12 of the spec (1–38). Run the reference engine's grid against the live page. Fix and re-run until everything that can pass has passed.
8. **Run the full test pass.** Now read `COMPOUND-WEALTH-TEST-PROMPT.md` and follow it completely: Phase A (test only, write everything into `COMPOUND-WEALTH-TEST-REPORT.md` and evidence into `docs/compound-tests/`), then Phase B (fix every code or wording defect it finds, add regression tests, re-test). The items it lists as "found by hand" (A–F) are the same as work items W1–W6, so confirm they are fixed. Product decisions go in the "Owner decisions needed" list; do not change them yourself.
9. **Finish.** Update `COMPOUND-WEALTH-REPORT.md` as described in section 13 of the spec. Commit in small clear commits on a branch named `compound-wealth-v6`, push it, and open a pull request if the setup allows. If something cannot be done automatically, say exactly what and why in the report, with the exact command or click needed, but only after trying every reasonable alternative.

## Rules

- Simplicity first. The default screen keeps three control groups and two buttons. Everything else is in "More options".
- Work in a loop: implement, test, verify, fix, repeat until the definition of done in the spec is met.
- Never ask me questions. Make the best decision, write it in the report, and continue.
- Never invent numbers. Never use unclear-terms, paid, or scraped data. Never mark a test PASS without evidence.
- Plain language everywhere, calm tone, one stronger sentence at the result. No finance jargon in visible text.
- Do not break, move, rename or restyle existing pages. Insights, the converter and any narrator work must stay unchanged.
- Never show the person's salary on a card or put it in the URL or storage.
- Every new script or config file starts with a clearly marked configuration block, with comments in plain English.
