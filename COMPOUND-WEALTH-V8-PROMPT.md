# Start prompt for the v8 session — the outcome visuals pass

You are working in the Currena repository (github.com/assadigit/Currena, Cloudflare Workers, site currena.ir). The **Compound Wealth** tool is live at https://currena.ir/tools/compound-wealth, complete to spec v6 — every gate green on 2026-11-26 (maths 94/94, browser harness 64/64 on the live build, grid replay 1200/1200 with 15/15 through the real interface, Phase A 32/32, Lighthouse 98/97, lint clean; the record is in `COMPOUND-WEALTH-REPORT.md` §10 and `COMPOUND-WEALTH-TEST-REPORT.md`). Since then main has absorbed the consolidated tools suite and the shared site chrome, so the live tool carries the site header/nav/footer like the other tools.

My direction for this session: **the tool already explains its outcomes in words and numbers; show more of them visually, so a visitor understands the outcome at a glance.** I asked for an audit first — it is recorded below, and it shaped this plan: the chart is already visually rich, so this pass is deliberately narrow. This is the **v8 addendum** (also committed as `COMPOUND-WEALTH-V8-PROMPT.md` in the repo root). `COMPOUND-WEALTH-SPEC.md` (v6) stays the governing document except for the amendments in step 4; every other v6 rule — above all the simplicity contract — applies unchanged.

The most important rule is unchanged: **the tool must stay simple.** This pass adds exactly **one small visual to the default screen**; everything else enriches elements that already exist, in place, below the fold or behind More options. If anything here conflicts with simplicity, simplicity wins: slim it, push it deeper in, or cut it and say so in the report.

## The audit (done 2026-11-26 — read it, do not re-discover)

Already visual — do not duplicate any of these:

- The main chart (`src/components/compound/chart.tsx`, page variant): the stacked areas (money you put in, growth on top), the total line, the what-if band with dashed edges, the other assets as dashed thin lines and cash dotted, collision-free end labels, year ticks (Jalali in fa), milestone dots with amounts, the crossover mark (the month growth overtakes money put in), and an sr-only summary.
- The phone card: big number + compact stacked-area spark + next-milestone chip. The A4 card: the full print chart, tiles, milestone list, assumptions. The sticky mobile bar. The milestones list (the text twin of the chart dots).

Text-only — the gaps this pass fills:

1. **The tiles** state the parts (put in / growth / total) but nothing shows their **proportion**, and the chart's two area colours have **no key anywhere on the page**.
2. **The what-if cards** — the small change, the later start, the cash comparison, the costs — are the tool's most persuasive outcome facts, and they are **prose only**.
3. **The compare table** (behind More options) is numbers only.

## Do this, in order, on your own

0. **Preflight.** Branch `compound-wealth-v8` **from main** — not from `compound-wealth-v6` (main carries the tools suite and the chrome the live tool now uses; the old branch-from-v6 instruction is superseded for every future session). Run the v6 gates unmodified and record the starting state: `python3 compound_reference_check.py --selftest` (six PASS lines), `bun test tests/compound-maths.test.ts`, `bun tests/compound-browser-harness.ts`, `bun tests/compound-grid-replay.ts`, `bun run lint`. If a count differs from the recorded 94/64/1200+15/32 because main moved, re-baseline honestly and record which gate and why **before** any feature work.

1. **The share bar — the default screen's one new visual.**
   - A slim full-width two-segment horizontal bar directly under the three tiles: the put-in part in the chart's put-in token, the growth part in the chart's growth token — **the same tokens as the chart's areas, so the bar doubles as the chart's key**; one short caption line says so in plain words.
   - Percentages visible beside the segments in words (for example "62% money you put in"), one plain sentence under it in the existing caption style, and the same sentence as the sr-only twin of the bar (aria-hidden graphic + sr-only text, or role="img" with aria-label — pick one, use it everywhere).
   - It follows the future/today money toggle exactly like the tiles do (shares computed from the shown values).
   - Reuse the chart's own labels (`content.ts` `chart.putInLabel` / `chart.growthLabel`) so bar and chart share vocabulary.
   - **Honest-edge rule:** draw the bar only when growth ≥ 0 and final > 0; otherwise hide the bar and keep the sentence. The today view can make real growth negative — hiding is honest; never draw a misleading bar. Shares under 1% render as "<1%".
   - If the bar breaks the one-screen rule at any of the three sizes, slim it (a 6px track with the percentages in the caption line) or fold the percentages into the tiles as small footer text instead — measure, decide, record the choice.

2. **The what-if micro-bars — the persuasive facts get shapes.**
   - One small shared component rendering thin labelled bars on a common scale per card, reused across all four cards: small change → three bars (a bit less / your plan / a bit more), later start → two (your plan / starting N years later), cash → two (invested / in cash), costs → two (before costs / after costs).
   - The bars' endpoints are **exactly the numbers already in the card's sentence** — the bar adds shape, never new maths. Labels in words, an sr-only sentence per card, bars non-interactive (no hover, no tooltips), calm: 4–6px tracks, no animation.
   - This section is below the fold, so there is no one-screen pressure — but if a card grows past about 1.5× its current height at 360px, slim the bars or drop that card's bars and record the cut.

3. **The quiet visual extras.**
   - Compare table (behind More options): one slim proportional bar under each final value — only if it fits 360px without widening the table; if nothing fits, cut it and record.
   - Phone card: the share bar as a slim two-segment strip under the big number (screenshot-safe, dark + light styles).
   - A4 print card: the share bar under the tiles in the ink-safe palette, percentages in the caption line.
   - The **fa language-toggle label-in-name fix** carried from the test report's owner decisions: add the visible "EN"/"فا" text to its aria-label in the shared chrome — one line, no visual change; walk two other tool pages afterwards to confirm nothing moved.

4. **Tests, copy, spec.**
   - One tiny pure helper in `maths.ts` (for example `splitFinal(final, putIn)` → null when not drawable, else the two shares with their rounding rules) with unit tests: growth 0, final < put-in, final 0, put-in 0, sub-1% shares, the future-vs-today pair. The what-if bars need no new maths — they draw the existing numbers.
   - Grid replay: extend with a share-bar assertion across the strata (drawable iff growth ≥ 0; the two shares sum to 100%; the bar's numbers equal the tiles' numbers).
   - Browser harness: bar presence and segment widths ≈ shares; the toggle flips the bar with the tiles; fa/RTL (logical direction, Persian digits, ٪); AA contrast on every new token use in both themes; sr-only sentences; phone card and A4 card bars; the negative-growth fallback; the one-screen rule at 360×800 / 390×844 / 430×932 with the bar present; the compare-table bars; store-nothing and no-network re-checked; axe light+dark EN+fa zero new violations. The default-screen inventory check gains the bar — that is the only intended inventory change.
   - Copy in `content.ts`, EN + fa: the caption sentence, "<1%", the segment labels (reuse the chart labels), the card bar words — plain, calm, no jargon, RTL-correct, Persian digits in fa.
   - Spec amendments in place, minimal diffs: §5 gains the bar under the tiles; §8 gains the card parity; §12 gains the new tests numbered onward; §13 gains this pass's definition of done; the non-goals list gains the cuts below.

5. **Mobile + performance.**
   - The one-screen rule at the three sizes with the bar present; the sticky bar and safe-area behaviour unchanged.
   - No new dependencies; the bars are plain divs or inline SVG; the JS delta must be negligible — record it. Lighthouse (mobile, live, after deploy) not below 98/97; record the numbers either way.

6. **Finish.**
   - All gates green with evidence pasted into the report. Deploy exactly as v6 did: `NEXT_PUBLIC_BASE_PATH=/gold bun run worker:build && bunx wrangler deploy` with the Cloudflare token in the environment. Re-verify live: the golden path with the bar and the toggle, fa + dark, mobile screenshots into `docs/compound-tests/`, zero console errors.
   - Update `COMPOUND-WEALTH-REPORT.md` with the v8 section (the audit table, every decision with its reason, the cut list) and `COMPOUND-WEALTH-TEST-REPORT.md` with the v8 pass.
   - Small, clear commits on `compound-wealth-v8`; push. Rollback: revert the v8 commits, or `git checkout` the pre-v8 main sha and redeploy.

## Considered and cut (record these with reasons)

- A donut/pie of the final composition — the straight bar already matches the chart's stacked semantics; pies read worse at small sizes and for screen readers.
- Hover/touch tooltips on the chart — desktop-biased, a11y and payload cost; the milestone dots, end labels and sr-only summary already anchor the numbers.
- A second chart or a "stop investing" line — clutter; the put-in layer already is the no-growth path, and the later-start card covers waiting's cost.
- A year-by-year numbers table — more numbers, not more understanding; the maths is already grid-verified.
- Animations on the chart or bars — against the calm discipline and the reduced-motion rules.
- A goal/target visual — a new input; against the three-control default screen.

## Where v7 (tax) stands — decided, do not re-decide

The v7 tax prompt stays committed on branch `compound-wealth-v7`, unstarted; **v8 ships first**. A short rebase addendum is committed at the top of `COMPOUND-WEALTH-V7-PROMPT.md` on that branch (branch from main after v8; three joins onto the v8 surface: the Costs row unchanged, the share bar caption when tax is on, the "tax takes" line joining the costs card's bars). Nothing in v8 starts tax work.

## Rules

- Simplicity first. The default screen gains exactly one small visual; with it the tool stays the quiet v6 page.
- Never ask me questions. Make the best decision, write it in the report, and continue.
- Never invent a number. Bars draw proportions of computed results only; no hand-tuned widths; never mark a test PASS without evidence.
- Never show the person's income or salary on a card, in the URL, or in storage. Store nothing; no data network calls.
- Do not break, move, rename or restyle existing pages. The other eight tools, the gold pages and the site chrome stay unchanged (the one-line fa aria-label fix is the only chrome touch).
- Plain language everywhere, calm tone, the one strong sentence unchanged, no finance jargon in visible text.
- No new runtime dependencies. Every touched module keeps a clearly-marked configuration block at the top, with comments in plain English.

## Definition of done (v8)

1. Preflight gates recorded on the main-based branch; any baseline drift explained before feature work.
2. Default screen: exactly one new visual (the share bar); the unmodified v6 suites still pass; store-nothing intact.
3. The what-if cards, compare table, phone card and A4 card show their bars; every bar has its words and sr-only twin; every new token use is AA in both themes.
4. Helper unit tests, grid extension and browser-harness extensions green with evidence; the negative-growth fallback proven; the today-view behaviour recorded.
5. Spec, report and test report updated; the cut list recorded with reasons; the v7 ordering decision recorded.
6. Mobile one-screen rule at the three sizes holds; sticky bar intact; Lighthouse ≥98/97 recorded; axe zero new violations.
7. Live deploy verified end-to-end; the fa toggle fix walked on two other tools.
8. Insights, the converter, the narrator, the gold pages and the other tools unaffected.

## Credentials

The GitHub push token and the Cloudflare deploy token + account ID come at the start of the session. Never write them into a file, a commit, or the report.
