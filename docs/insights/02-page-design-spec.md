# 02. Insights page: design spec

For the front-end designer first, and for the coding agent second. It says how the page is organised and how it behaves. It does not choose colours or final copy.

## 1. Purpose

Insights explains the state of global and Australian finance through about 30 indicators, in plain language. Visitors come to **learn and understand**. The page gives general information, never personal advice.

- Languages: Farsi (RTL) and English (LTR), using the existing language toggle.
- Main reader: someone curious about money who wants context, mostly on a phone.
- Success looks like: weekly return rate, share of visits that expand at least one card, share that reach the Australia section.
- Look and feel: calmer and more analytical than the rates pages, but clearly Currena. Reuse the existing navigation, card language and one recognisable Currena element (the LED-board number style) for headline numbers only.

## 2. Constraints from the existing app (non-negotiable)

- **Route:** add `/insights` to `ROUTES` in `apps/web/src/router.ts` (hash router, `#/insights`) and a nav entry in `Header.tsx` using a `nav.*` i18n key.
- **i18n:** every string goes through `apps/web/src/i18n/` (`en.ts` is the source of truth, `fa.ts` is shape-checked). No hardcoded text.
- **RTL/LTR:** CSS logical properties only (`ms-`, `me-`, `ps-`, `pe-`, never `ml-`/`mr-`). `dir` comes from the locale.
- **Numbers and dates:** stored canonically, formatted only at render with `Intl` (`fa-IR` / `en-US`). Persian digits in Farsi UI text; Latin digits stay inside DSEG7 LED modules (existing decision). Jalali dates in Farsi use the app's existing Persian-date formatting; Persian month plus Latin year in one span scrambles under bidi, so isolate (`<bdi>` or `dir`).
- **Fonts:** Vazirmatn (variable) for Farsi via `:lang(fa)`, Poppins for English, DSEG7 only for LED digits. No new typeface is needed.
- **Themes:** light is the default and a dark theme ("Currena Night") exists. The page must work in both. Do not hardcode colours; use the existing tokens.
- **Performance:** the Insights route must be lazy-loaded so initial JS does not regress.
- **Accessibility:** follow the existing standard (WCAG contrast, a text label for every status, reduced-motion respected).

## 3. Layout options considered

| Option | Verdict |
|---|---|
| **A. One scrolling page, grouped sections, expandable cards** | **Chosen.** Everything is findable, nothing hidden behind tabs, suits a "learn" visit. |
| B. Tabs per group | Hides content; second tabs are rarely opened. |
| C. Dense dashboard of 30 tiles | Too many choices at once (Hick's Law, Miller's Law). |

## 4. Page structure, top to bottom

> **Round-2 revision (2026-10-10, R1–R28 — see `06-ux-round-2-spec.md` and
> `ROUND2-LEDGER.md` for the per-block evidence).** The structure is now:
> header (title, subtitle, "Data as of", ONE Tools disclosure) → hero (Global
> verdict first, then Australia; meters + gauges + a fixed-table reason line
> + up to three needs-attention tiles with unit-ful numbers each; one
> biggest-move line) → sticky section pills (Status, Prices, Together,
> Signals, Indicators, About) → the four-tile prices strip → the slim "what
> it means for my money" panel (≤4 lines) → Together + Signals COLLAPSED by
> default with one-line summaries → the indicator lanes (Global default,
> visible Global|Australia switch, per-group signals-first collapse behind
> "See all {n}") → Next up → the footer "Before you act" box (exactly once)
> → the quiet collapsible "About this data" (FRED notice + credits +
> general-information always visible outside the toggle). Status words are
> the two tiers "Needs attention" / "Unusual" (internal ids unchanged); the
> "Alert" word is retired from the UI. The filter toolbar of item 5 below
> moved into the Tools menu (search, filter, shortcuts, .ics, CSV); dates
> render as month names in English; every number carries a unit.


1. **Header:** existing Currena header with "Insights" active.
2. **Summary block:** two lines, Global and Australia, each like "Cautious · 4 of 14 indicators in warning," with a "How this is calculated" link. Each line is a button that jumps to its section (I9) — the summary doubles as the page's table of contents. Directly under it a one-line disclaimer ("General information only, not advice") linking to the full text.
3. **What changed this week:** indicators that changed state, the five biggest moves, events in the next 7 days.
4. **Coming up:** the next key dates (RBA, Australian CPI, US Fed). Anything within 7 days is highlighted.
5. **Card filter toolbar (I8, 2026-10-08):** status chips (All / Warning / Normal / Context, each with its live count — I9) + a text search over names and tickers, directly before the Global section; "/" focuses the search (I9). A view tool only — it hides cards, groups, sections and jump pills that have nothing to show, but every warning-count line keeps describing the full snapshot; hidden on paper.
6. **My watchlist (I10, 2026-10-08):** pinned cards MOVE here from their groups — "stay on top" — in snapshot order, with the watchlist's own warning-count line. Pin/unpin is an aria-pressed pill in each card's expanded action row (☆/★); the collapsed card carries a ★ badge. Persisted in localStorage (`currena.insights.pinned.v1`) and synced across tabs. Same view-tool semantics as the filter: group count lines keep describing full data; the section hides when empty or fully filtered out; the jump row gains the watchlist pill while it exists.
7. **Global:** four groups (Rates and credit; Currencies; Metals, crypto and hard assets; Stocks, growth and liquidity).
8. **Australia:** three groups (Interest and inflation; Currency and trade; Jobs and housing).
9. **About the data and full disclaimer:** sources, update schedule, how "warning" is decided.

Each section header shows a small status line ("2 of 6 in warning" — locale digits, I10). Add a row of jump links to the sections; it scrolls sideways on mobile and must mirror correctly in Farsi. Global comes before Australia (owner decision, Gate I4 review 2026-10-07 — the original "reader is in Australia" ordering was reversed: the global picture sets the frame, then the local section lands). The summary block's two lines follow the same order. A thin reading-progress bar (I10) sits above the app header on the long page; the generated line under the title leads with the relative freshness ("Updated 3 hours ago · {exact}", I10). The Coming-up header carries a "Download calendar (.ics)" export of exactly the listed events (I10 — RFC 5545, localized titles, stable UIDs).

## 5. Indicator card

**Collapsed (always visible):**
- Indicator name (and ticker where relevant)
- Current value
- Direction arrow with the 7-day and 30-day change
- Status chip: **Warning**, **Normal** or **Context** (info-only), always with an icon and a word, never colour alone
- 10-year position bar
- One plain-language line saying what it means
- "Updated [date] · Source [name]"

**Expanded (tap to open):**
- What it is
- Why it matters
- What it has historically tended to mean
- What it can't tell you
- What this means for you (general information, Australia-focused)
- 10-year chart with a data-table alternative for screen readers. A 10y / 5y / 1y range control (I9, 2026-10-08) zooms the chart's visible window — anchored on the series' last point, ranges that cannot show two points disable themselves; the 10-year position bar and percentiles never change with the range.
- Action row (I10, 2026-10-08): linked source pill, then the watchlist pin (aria-pressed, ☆/★) and the share-this-card pills — both print-hidden (paper keeps the spelled-out source URL).

Several cards can be open at once on desktop. On mobile, opening one may close the previous one.

## 6. States to design

| State | What it needs |
|---|---|
| Loading | Skeleton placeholders for the summary and cards |
| Stale data | Card greyed, "not updated since [date]"; excluded from the summary count |
| Feed error / no data | Plain message, no empty chart |
| Info-only card | "Context" chip, no warning rule |
| Quiet week | "No indicator changed state this week," pointing to the calendar |
| Summary explainer | A sheet or panel with the voting rules in plain language |
| Language switch | Keeps scroll position and open cards |

## 7. Farsi and English decisions (made)

- The whole layout mirrors in Farsi. Tickers (XAU/XAG, USD/JPY) and numbers stay left-to-right inside right-to-left text.
- **Chart time axes keep time running left to right** (old to new) even in Farsi. Everything else mirrors.
- **Persian digits** in the Farsi UI, tabular figures so numbers line up.
- **Jalali dates always** in the Farsi version; English shows Gregorian. A small Gregorian date alongside in the Farsi calendar is optional (designer's call), since the official schedules use Gregorian.
- All copy exists in both languages. Farsi is written natively, not translated word for word.

### Status wording (proposed; a native Farsi reader should confirm)

| Where | English | Farsi |
|---|---|---|
| Card chip | Warning | هشدار |
| Card chip | Normal | عادی |
| Card chip (info-only) | Context | اطلاعات زمینه‌ای |
| Summary label | Relaxed | آرام |
| Summary label | Cautious | محتاطانه |
| Summary label | Stressed | تحت فشار |
| Summary label | Alarmed | نگران‌کننده |

"Alarmed" is deliberately a different word from "Warning" in Farsi so the overall label and the card chip don't read as the same thing. These labels describe how many indicators are in their warning zone. They are not advice.

## 8. Mobile and desktop

- Mobile first: single column, the summary visible without scrolling, large tap targets.
- Desktop: the summary spans the full width; cards in a 2 or 3 column grid within a comfortable maximum width.
- Never show all 30 cards expanded by default.

## 9. Accessibility

- Status never relies on colour alone.
- Real headings in order; expand controls are real buttons with expanded/collapsed state, keyboard reachable.
- Charts have a text or table alternative.
- Any new status colours need a contrast check in both themes before they are final.

## 10. Later

Per-indicator share links are for a later version.
