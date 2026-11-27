# Compound Wealth — the spending receipt (v10 feature spec)

Status: decided with the owner (Ali) on 2026-11-27, right after v9 shipped. His words: **"People have many purchases that are impulsive or not essential at all — for example dozens of 5, 10, 20 dollar subscriptions that go out of pocket by automatically extending each month. This money could be saved and invested instead."** He wants **a section in Compound Wealth with a UI like a receipt**: the user adds non-essential purchases and costs (daily, monthly or annual — YouTube, Spotify, …), first sees how much they add up to (for example 127 dollars a month), then is **reminded how much that money could grow if it were invested instead** — a financial reminder to stop over-spending on trivial subscriptions.

This file governs the **v10 pass**. `COMPOUND-WEALTH-SPEC.md` (v6 + the v8 + v9 amendments) governs everything else. The implementing session folds the amendments in §10 into the main spec as minimal diffs (the v8/v9 pattern) and builds to this spec. The one rule above all others is unchanged: **SIMPLE** — when any rule here conflicts with simplicity, simplicity wins and the choice is recorded in the report. Nothing in this pass may touch the engine, the grid, the default screen, the cards or any existing number.

Not yet built: the branch `compound-wealth-v10` carries this spec and `COMPOUND-WEALTH-V10-PROMPT.md`.

## 1. Why

The tool's whole job is making compounding tangible. Its blind spot is the other side of the same coin: the small, invisible, auto-renewing spends that quietly cancel the plan. A dozen 5–20 subscriptions are individually forgettable and collectively enormous. The receipt makes the leak **visible** (an itemised paper total) and then flips it into the tool's own language (what that money becomes invested). It is a motivator, not a budgeting app: no categories, no history, no tracking — one list, one total, one projection, one strong sentence.

## 2. Where it lives — and what it must not touch

- A new section **directly under the "What if…" cards, before the More options groups** in `app.tsx` (the DOM slot between the what-if section and the `data-cw="more-options-groups"` block). Its own `type-kicker` h2 heading, one lede sentence, then the paper card. `id="spending-receipt"` for anchoring.
- **Below the fold.** The one-screen rule (test 14) and the default-screen inventory (tests 13, 41) are untouched: the receipt adds **no controls to the default screen**. The sticky mobile bar, the chart and its filters, the tiles, the share bar, the what-if cards, the compare table, the A4 and phone cards: untouched.
- The name is **"The spending receipt"** (fa: «رسید خرج‌های شما») — deliberately not "Receipt", because the exchange-receipt tool (رسیدساز ارزی, `/tools/exchange-receipt`) already exists. Do not touch that tool or its registry entry.

## 3. The model and the interactions

**The item model** (client state only): `{ id, label, amount, cadence }` — label optional (≤ 28 chars, default "Item N" / «مورد N»), amount > 0 and ≤ 999,999 with up to two decimals, cadence `daily | weekly | monthly | yearly`. The owner named daily, monthly and annual; weekly is added because takeout and coffee are weekly in practice — one factor, no new machinery (recorded choice; cut it if the owner objects).

**Answer on arrival (the §0.1.1 spirit):** the receipt starts with three example items, so the mechanic is visible before any typing — YouTube Premium 13.99 monthly, Spotify 10.99 monthly, iCloud+ 2TB 9.99 monthly — plus a one-line hint: "These three are examples — remove them and add your own." The example prices are illustrative stand-ins, clearly labelled; they are **not** figures-file data (§7 of the main spec governs market figures only).

**Adding:** one compact form on the paper — *What* (optional text), *Price* (number), *How often* (a native `<select>`: Daily / Weekly / Monthly / Yearly, default Monthly), and **Add**. Enter submits. On add: the item lands on the receipt, the What and Price fields clear, the cadence persists (rapid entry), and a polite live region announces ("Added Netflix. Total A$45.98 a month."). Validation follows the page's own rule: out-of-range or empty price clamps/rejects with **one small plain message**, never an error state; nothing is invented.

**Removing:** one × per line, a 44px target with label-in-name ("Remove Spotify, A$10.99 monthly"). After removing the last focusable row, focus returns to the Add button.

**Clear all:** a two-step button — the first tap re-words it to "Sure? Clear all" for 4 seconds, the second tap clears. No native `confirm()`. With zero items the paper stays, the projection hides, and one plain hint remains ("Add a cost to see what it could become.") — no empty state, no error.

**Store-nothing (locked):** nothing about the receipt is written anywhere — no localStorage, cookies, URL, or network. Reload resets to the three examples (the same deliberate no-memory as the v9 filters). No in-place item editing (remove and re-add). No item cap — a long receipt is the point ("look how long this list is"); long labels wrap, never scroll sideways.

## 4. The maths (main-spec amendment §6.7)

**Normalization to a monthly amount** (full precision inside, one helper in `maths.ts`):
`monthly = amount × { daily: 365/12, weekly: 52/12, monthly: 1, yearly: 1/12 }`
So: daily 3 → **91.25** exactly; weekly 10 → 43.33…; yearly 120 → **10** exactly. The factors live in the config block with a plain-English comment.

**The totals** (the combine step): *Total per month* = Σ normalized monthlies, exact; *Total per year* = monthly × 12, exact. With the examples: **34.97 a month, 419.64 a year.** Both shown with the page's own currency handling (symbol + `formatMoney` in EN; the fa currency word + Persian digits in fa).

**The projection (the reminder):** the **same engine** — `computeCompound` at the page's **current plan assumptions**: base = the monthly total, amount mode (never salary; salary never appears), startingAmount 0, yearlyIncrease 0, and the plan's own yearly cost, purchase fee, purchase frequency, rate mode, custom rates and inflation. One rule, easy to state and test: **"your plan's own assumptions, on your leak money"** — the receipt live-updates when the plan's asset or costs change. Horizon: chips **3 / 5 / 10 years, default 10** (the v9 chip pattern: real buttons, `aria-pressed`, a named group), matching the owner's 3-year example while the 10-year default gives compounding room to speak.

**Reference vectors** (computed with `compound_reference_check.py`, at the current default figures — AU shares 7.2% − 0.2% cost, monthly, no fee):
- Examples 34.97/mo, **10y**: final **5,981.7** → "about 6,000"; put in 4,196.4; growth 1,785.3; today's money (2.77% inflation) 4,551.6 → "about 4,600".
- Examples 5y: final 2,489.7; 3y: final 1,391.9.
- The owner's own example, 127/mo, 10y: final **21,723.6** → "about 21,700"; put in 15,240; growth 6,483.6.

**Rounding registers — the page's own three, each where it belongs:** the itemised lines and both totals are **exact to the cent** (a receipt is an exact ledger); the projection sentence uses **headline rounding** (nearest 100, "about", with today's money beside it, exactly like the main headline); the from-line uses **tile rounding** (nearest 10). The from-line uses the tiles' own words: "You put in 4,200 · growth added 1,790." (future money; the parenthetical today figure already carries the inflation honesty).

**The split bar:** the receipt's projection carries the v8 share bar (the chart's two tokens, `role="img"` with its sentence as aria-label) computed by `splitFinal` on the **future** final and put-in — the receipt's primary frame is the future value (the today figure is parenthetical, exactly like the headline). The honest edge is inherited unchanged: growth < 0 or final ≤ 0 → the bar hides and the sentence stays; shares under 1% render "<1%". The visible percentage key line is **not** repeated — the from-line already names both parts in money; record the deviation from §5.1.6 as a deliberate choice.

**Honest edges:** a fee that eats the monthly total falls through to the engine's own never-invests plain sentence. Zero items or a zero total hides the projection (hint stays, paper stays). Extreme inputs never give NaN or a broken page. **The engine, the 1200-row grid, the 15 UI scenarios and every existing number stay byte-identical.**

## 5. The paper (visual spec)

- One paper card — the receipt itself — with a small **fixed light palette in both themes** (a receipt is paper; the A4 card's ink-safe precedent): paper, ink, muted and rule colours as named constants in the config block, AA-verified pairs, calm, no gradients. Fixed light means dark-mode contrast is trivially stable.
- EN uses a monospace stack (`ui-monospace, SFMono-Regular, Menlo, monospace`); fa uses the site's own Persian font. **Alignment is always by layout** (flex `justify-between`), never by font metrics — dotted leaders between label and amount, robust in both scripts.
- Zones, top to bottom: the header line (the section's own word, no fake date), the itemised lines (label · dotted leader · price + cadence word, the × at the end), a dashed rule, the totals block (monthly primary, yearly secondary), a dashed rule, the projection block ("If you invested it instead" — the sentence, the from-line, the split bar, the assumption line "At your plan's own asset and costs above (Australian shares)."), then the footer: the one strong zinger — **"Every renewal is a withdrawal from your future self."** — and, if it costs under ~20 lines, a decorative barcode strip of pure divs (`aria-hidden`); cut the barcode without hesitation if it grows.
- The bottom edge: a plain dashed border is the baseline; a zigzag edge only if it is one cheap, robust CSS rule.
- fa/RTL fully mirrored (leaders, alignment, order), Persian digits, ٪. No animations, no hover states beyond focus visibility — calm.

## 6. The copy (EN + fa drafts; final voice in `content.ts` under a new `receipt` block)

| Key | EN | fa |
|---|---|---|
| heading | The spending receipt | رسید خرج‌های شما |
| lede | Add the subscriptions and small costs you pay for on autopilot. See what they add up to — and what that money could have been. | اشتراک‌ها و هزینه‌های خردی که خودکار تمدید می‌شوند را اضافه کنید؛ جمعشان را ببینید — و اینکه به‌جایش می‌توانست چه باشد. |
| hint (examples) | These three are examples — remove them and add your own. | این‌ها نمونه‌اند — حذفشان کنید و هزینه‌های خودتان را اضافه کنید. |
| form labels | What is it? · Price · How often · Add | چه هزینه‌ای؟ · قیمت · دوره · اضافه کردن |
| cadences | Daily / Weekly / Monthly / Yearly | روزانه / هفتگی / ماهانه / سالانه |
| totals | Total per month · Total per year | جمع ماهانه · جمع سالانه |
| projectionTitle | If you invested it instead | اگر به‌جایش سرمایه‌گذاری می‌کردید |
| projectionSentence | Investing {amount} a month for {years} years: about {final} (about {today} in today's money). | سرمایه‌گذاری {amount} در ماه، برای {years} سال: حدود {final} (حدود {today} به پول امروز). |
| fromLine | You put in {putIn} · growth added {growth}. | واردشده {putIn} · رشدِ افزوده {growth}. |
| assumption | At your plan's own asset and costs above ({asset}). | با همان دارایی و هزینه‌های برنامهٔ بالا ({asset}). |
| zinger | Every renewal is a withdrawal from your future self. | هر تمدید اشتراک، برداشتی از آیندهٔ خودتان است. |
| footer | Thank you for shopping! | از خرید شما سپاسگزاریم! |
| emptyHint | Add a cost to see what it could become. | یک هزینه اضافه کنید تا ببینید پولش می‌توانست چه شود. |
| clearAll / clearConfirm | Clear all / Sure? Clear all | پاک کردن همه / مطمئنید؟ پاک شود |
| removeAria | Remove {item}, {price} {cadence} | حذف {item}، {price} {cadence} |
| srSummary | Receipt: {n} costs, {monthly} a month, {yearly} a year. Invested instead at your plan's rate for {years} years: about {final} — {putIn} from you, {growth} from growth. | رسید: {n} هزینه، {monthly} در ماه، {yearly} در سال. اگر به‌جایش با بازدهٔ برنامهٔ شما برای {years} سال سرمایه‌گذاری می‌شد: حدود {final} — {putIn} از خودتان و {growth} از رشد. |

Example item labels: YouTube Premium / Spotify / iCloud+ 2TB — fa: یوتیوب پرمیوم / اسپاتیفای / آیکلاود ۲ ترابایت.

## 7. Accessibility and i18n

Section + h2 + `aria-label`; every form control labelled (visible or sr labels); the cadence select is native; the horizon chips reuse the v9 chip pattern (named group, `aria-pressed`, keyboard); remove buttons carry label-in-name; the totals line is announced politely; **one sr-only summary paragraph** mirrors the items, totals and projection (the v6 chart-summary pattern); the whole flow works keyboard-only. Axe EN + fa, light + dark: **zero NEW violations** against the recorded baseline (18/17/18/17 colour-contrast + zero new kinds) — the paper's fixed palette makes this straightforward.

## 8. Rules that govern, unchanged

Store-nothing; no network; no new runtime dependencies; the figures-file rule (the receipt adds **no figures** — it rides the plan's own rates); plain words and the sentence discipline (the zinger is the receipt's one strong sentence, mirroring the page's one-strong-sentence rule); no animations; `prefers-reduced-motion` respected if any transition appears; the one-screen rule and the default-screen inventory untouched.

## 9. Tests (main-spec §12, 48–53)

48. **Receipt maths unit tests** (`bun test`): normalization exactness (daily 3 → 91.25; weekly 10 → 43.33…; yearly 120 → 10; monthly 50 → 50); the examples' combined total 34.97 / 419.64; the projection equals `computeCompound` at the plan's inputs (spot: 34.97/mo, 10y, 7.2% − 0.2% → final ≈ 5,982, put in 4,196.4, growth 1,785.3); the 3/5/10 horizon set; zero items, zero total, huge amounts, empty labels — never NaN, never a broken page; the honest edge (a 0%-net plan → the bar hidden); the copy keys exist in both languages.
49. **Reference script:** `compound_reference_check.py --selftest` gains three lines — the two normalization equalities (daily, yearly) and the examples' 10-year projection (~5,982 ± 0.5%) — **nine PASS lines total** (record the new count everywhere the six was recorded). The weekly case lives in the unit tests.
50. **Browser harness (v10-1…):** through the real interface — the three examples on arrival with the total A$34.97/mo and the projection visible; add (label + price + cadence) updates totals, projection and the live region; remove; clear-all two-step and its timeout; cadence through the UI ($120 yearly adds exactly 10 to the monthly total); the clamp message; the projection's numbers match the reference at the page's own current rate (read the measured line, like the v6 grid-vs-live check); label-in-name on remove; keyboard-only add/remove/clear; the sr summary matches the visible numbers; store-nothing rechecked (reload restores the examples); the default-screen inventory and the one-screen rule untouched at the three sizes; the harness's allowed-prefix list gains the receipt's own prefixes.
51. **Receipt honesty:** the projection follows the plan (switch asset → the assumption line and the numbers change; costs on/off changes them); today's money always beside future money; the honest edge through the UI (cash asset or a 0% custom rate → the bar hidden, the sentence kept); the never-invests plain sentence when a large fee eats the total.
52. **Receipt reach:** fa/RTL (Persian digits, mirrored leaders, the fa fonts, ٪); 360px with a 28-char label wraps with no sideways scroll; the paper's fixed palette AA in light **and** dark; axe zero NEW violations EN + fa; plain-language check (sentence discipline, no jargon).
53. **The preflight merge evidence:** gates recorded on the merged base (v9 tip + main) with the drift explained before feature work — main's Batch V (the owner's second gold icon pack) is missing from live since the v9 deploy; the v10 deploy restores it, and the live gold page is verified with its icons after shipping.

## 10. The main-spec amendments (apply as minimal diffs, the v8/v9 pattern) and the definition of done

Amendments: the header's v10 addendum note (after the v9 note); new **§5.5 The spending receipt** (this file §2–§3, §5); new **§6.7 The receipt maths** (this file §4); §5.4 gains one plain line in "How is this worked out?" (the receipt's projection uses the plan's own rate and costs; nothing about it is stored); §11 config block gains the receipt constants (cadence factors, horizons, examples, label and amount bounds, the paper palette); §12 tests 48–53; §13.12 the v10 definition of done; Appendix **A.3** the v10 non-goals; A.1's v7-ordering note updates to "v7 rebases onto the **v10** surface — the three join points unmoved".

**§13.12 — the v10 definition of done:** preflight gates recorded on the merged branch with the drift explained (including the Batch V restoration) before feature work; the receipt built to this spec with the engine and the 1200-row grid byte-identical; tests 48–53 green with evidence (nine reference PASS lines, the maths and harness counts extended and recorded); no new runtime dependencies and the JS delta measured honestly from two full worker builds; axe zero NEW violations with any node delta explained; Lighthouse ≥ 98/97 (a11y at the 97 baseline); the live deploy verified end-to-end — the golden path in EN (examples → total → projection → add/remove/clear), fa + RTL + dark with Persian digits and ٪, the gold page's pack icons restored, screenshots to `docs/compound-tests/`, zero console/page errors; `COMPOUND-WEALTH-REPORT.md` gains the v10 section (decisions with reasons, the gate table, the cut list, the rollback to the v9 tip `7e315dbb`) and `COMPOUND-WEALTH-TEST-REPORT.md` gains the v10 pass; small commits, pushed.

## 11. Cuts (Appendix A.3 — considered and cut; do not re-propose without the owner)

- **Benchmark or asset comparisons inside the receipt** (S&P vs gold lines for the leak money): the chart's v9 filters already answer "what if in another asset"; the receipt rides the plan's asset.
- **An "add this to your plan" button:** the receipt never mutates the plan — it would break the three-control default-screen contract from below.
- **Persistence of items:** store-nothing is a locked owner decision.
- **In-place item editing:** remove and re-add is two calm actions; an edit mode is machinery.
- **Per-day / per-week total displays:** monthly and yearly are the two frames people think in.
- **The receipt on the A4/phone cards:** the cards are the plan's fixed share artifacts.
- **Printing the receipt:** the A4 card already owns the print path; a second one doubles maintenance.
- **Budgeting features** (categories, essential-vs-not, spend charts, history): a motivator, not a budgeting app.
- **A "cost so far" retrospective:** backward-looking; the tool is forward-looking (the phase-2 time machine owns history).
- **Animations** (paper unroll, counting totals): against the calm discipline.
