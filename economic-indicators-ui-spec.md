# Economic Indicators — UI Redesign Specification

**Page:** Currena → Insights (`#/insights`) — titled "Economic Indicators" / «شاخص‌های اقتصادی»
**Status:** Approved redesign direction, implementation-ready
**Scope:** Visual redesign of the Insights page only (`apps/web` insights route + shared insights CSS tokens). No financial-logic, data, or copy changes.
**Companions:** `AGENTS.md` (engineering rules), `docs/insights/06-ux-round-2-spec.md` (behavioral spec — behavior preserved), `docs/localization/persian-copy-workflow.md` (copy gate).

---

## 1. Purpose and approved direction

The current page is information-dense and functional, but its visual layer is loud: four severity hues (green / yellow / orange / red) are painted across verdict words, segmented meters at three sizes, status chips, gauge groups, tinted card gradients, plus brand gold and blue accents, coral tags, and full-color artwork. Everything is colored, so nothing stands out.

The approved redesign:

1. **Grayscale structural foundation.** Every structural and navigational element — surfaces, borders, text, chips, meters, links, buttons, tools, tabs, charts, artwork, section tints — renders in the neutral ink ramp.
2. **Selective, meaningful severity colors.** The existing IBM Carbon severity palette is retained ONLY where it carries meaning: status words and chips for flagged/unusual states, the flagged-card accent, the attention module, the region verdict words, and signed direction (up/down). A calm state never shouts: "Normal", "Context", "Stale" and equivalent states render in neutral gray.
3. **Clean, professional, authoritative, and readable by ordinary (non-financial) users.** The result reads like a serious financial publication: neutral paper, strong typography, red and amber reserved for things that genuinely need attention.
4. **Top three flagged indicators first.** Each region summary initially shows exactly the three most important flagged indicators, with a clear expand control for the remaining flagged indicators (and collapse back).
5. **Bilingual RTL/LTR and fully responsive**, preserved from the current implementation.
6. **Financial context preserved.** No indicator, explanation, data source, date, chart, download, or control is removed. Secondary context stays behind the existing collapse/expand mechanisms.

## 2. Guardrails — what must NOT change

- No changes to financial calculations, indicator rules, thresholds, status classification, scoring, gauge math, or the `attentionTiles` importance ordering (deepest-into-its-own-10-year-tail first). (`packages/insights`, `packages/core`, `config/*` logic — untouched.)
- No fabricated or hardcoded data; the page keeps serving `/api/insights` (and the world feeds in private mode) exactly as before.
- No indicator, category, explanation line, companion value, calendar event, source note, date, or download is removed.
- No user-facing copy string is added or changed (EN or FA). New UI states must reuse existing dictionary keys, so `pnpm copy:audit` stays green with an untouched manifest.
- Data fetching, refresh, localStorage last-good cache, stale banner, private/public display modes, error and loading states — behavior preserved.
- Existing keyboard model preserved: `/` tools + search, `j`/`k` card walking, roving tablists, DetailsPanel focus trap + Escape + focus-return, scroll-spy JumpNav, `aria-*` labels, never-color-alone (icon + word) chips.
- No new dependencies. No changes outside the Insights page (other routes, the app header/footer, and the rates pages keep the shared brand look).
- Bundle budget for the Insights lazy chunk continues to hold (scripts/check-bundle-budget.mjs).

## 3. Color system

### 3.1 Neutral ink ramp (the foundation)

Unchanged tokens, used for ALL structure:

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--color-text-primary` | `#2C3E50` | `#E8EDF4` | primary text, active states, chart lines, focus ring |
| `--color-text-secondary` | `#47525D` | `#A9B5C5` | body/labels, inactive controls, icon fallbacks |
| `--color-text-tertiary` | `#4F5A66` | `#A2AEBC` | captions, timestamps, sources |
| `--color-surface` | `#FFFFFF` | `#1A222E` | all card surfaces |
| `--color-surface-raised` | `#FFFFFF` | `#202A38` | raised chips/tiles inside cards |
| `--color-border` | `rgba(44,62,80,.14)` | `rgba(232,237,244,.16)` | all borders/rings |
| `currena-muted` at 5–15% alpha | — | — | neutral tint fills (group boxes, chips, toolbars, note boxes) |

**Structural rule:** the pale-blue `currena-soft` surface tint, the `currena-blue`/`--color-status-context` ink, the `currena-coral` tag, and the `--color-accent-gold` family no longer appear anywhere on the Insights page. Their previous uses become neutral: links/labels → `text-primary`/`text-secondary`; tinted surfaces → `currena-muted` at low alpha; gold-highlight boxes → standard surface cards with `ring-[var(--color-border)]`.

### 3.2 Severity inks (the only color on the page)

The existing Carbon-pinned tokens, values unchanged:

| Ink | Token | Allowed on (exhaustive) |
|---|---|---|
| **Alert red** | `--color-status-alert` | ① needs-attention status chips (icon+word) ② flagged-card inline-start accent border ③ hero attention count line and alert box (tint + ring + bullet words) ④ the "Critical" region verdict word ⑤ negative signed changes ⑥ error / failed-source / unavailable-data states ⑦ bearish outlook words ⑧ market "Correction" chips + tile rings ⑨ money-panel "pressure" (costs-up) lines ⑩ band word "expensive"/top-of-range + rule-zone ticks on the position bar ⑪ connection "moves down" lines |
| **Watch amber** | `--color-status-watch` | ① Unusual-tier status chips + card inline-start accent ② the "Cautious" region verdict word ③ unusual section signals (bear-market chips, unusual FX patterns, section-signal bullets) ④ watch notes (stale sources in About, dates-differ tag) |
| **Stressed orange** | `--color-status-stressed` | the "Stressed" region verdict word ONLY |
| **Normal green** | `--color-status-normal` | ① the "Stable" region verdict word ② positive signed changes ③ money-panel "relief" lines ④ band word "cheap"/bottom-of-range ⑤ market "trend up" chip ⑥ bullish outlook words ⑦ connection "moves up" lines ⑧ Together "disagree" state stays amber (see below) |

Everything else on the page is neutral. In particular, these LOSE their color: "Normal", "Context", "Stale", "Check pending", "Limited history", "No data" status chips (neutral gray, keeping their distinct icons + words); all verdict meters; gauge-group boxes and their step-word pills; the biggest-move card (plain card, signed value keeps red/green); the Money panel box (plain card); the JumpNav active pill (charcoal fill, not gold); Tools menu, filters, search, download buttons; calendar event-kind chips; chart lines/crosshairs/range controls; DetailsPanel headers and actions; pinned indicator ring/star; all artwork (grayscale filter).

### 3.3 The verdict meter goes neutral

The four-segment meter (all sizes: hero `lg`, gauge `sm`, question headers) stops painting step hues. Filled segments grade in ONE neutral ramp toward the current step; unfilled segments stay `--color-border`:

```
on-1: color-mix(in srgb, var(--color-text-primary) 40%, var(--color-surface))
on-2: color-mix(in srgb, var(--color-text-primary) 60%, var(--color-surface))
on-3: color-mix(in srgb, var(--color-text-primary) 80%, var(--color-surface))
on-4: var(--color-text-primary)
```

The meter keeps `direction: ltr` (analytical axis, G9), its `data-step` attribute, segment count = step, and its `role="img"` + aria-label. The colored verdict WORD beside each meter carries the severity meaning; the meter communicates position only (like a signal-strength bar).

### 3.4 Artwork

All Insights-page artwork PNGs (region marks, state icons, indicator icons, money-area icons, metal icons) render desaturated: `filter: grayscale(1)` applied via a page-scoped CSS rule (`.insights-page .currena-icon`). Sizes, layout, and decorative-aria treatment are unchanged. Shapes stay recognizable; color stops competing with severity inks.

### 3.5 Focus and interaction inks

- Focus ring (`.insights-focusable:focus-visible` and all chart/control `focus-visible:outline-*`): 2px `var(--color-text-primary)`, offset 2px (offset 1px on dense chart controls) — visible in both themes, no longer blue.
- Links: `text-[var(--color-text-primary)]` + `underline decoration-[var(--color-border)]` (hover: `decoration-[var(--color-text-secondary)]`). No blue link ink, no brand-blue decoration.
- Selected/active controls (JumpNav active pill, active Tools filter chip, active chart-range button): solid `bg-[var(--color-text-primary)]` with `text-[var(--color-surface)]` — the charcoal "selected" language.
- Hover states on cards/rows/tiles: existing neutral darkens (`bg-currena-muted/[0.05–0.13]`, border → `--color-text-secondary`-tinted); nothing turns blue/gold.

## 4. Layout and component hierarchy

The page's section order and anatomy are PRESERVED from the round-2/33 structure (this is a reskin, not a re-layout):

```
Header: title · subtitle · "Data as of {date}" · Tools disclosure (search, filters, keyboard hints, CSV/ICS downloads)
Hero (id=insights-hero):
  Global card   — region mark · kicker · "View section" link
                 — [state artwork][verdict word][meter lg] · "?" how-computed tip
                 — gauge groups (step-word pills + gauge rows w/ sm meters) · "?" verdict-rule tip
                 — attention module: count line + alert box (markets/fx/section bullets)
                 — flagged tiles (3) + expand
  Australia card — same anatomy (no alert bullets)
  Biggest-move card · what-changed line
Sticky JumpNav: Status · Prices · Together · Signals · Indicators · About
Prices strip (4 tiles) → World markets → US shares in AUD → World currencies   [private mode only]
Money panel ("What it means for my money", ≤4 lines)
Together (collapsed) · Signals (collapsed, private)
Indicator lane: watchlist strip (pinned) → Global section → Australia section
  (each: big region artwork + heading + per-question groups; needs-attention +
   unusual cards always visible; normal rows capped at 3 per group + "See all")
Next-up calendar → "About this data" (collapsed) → app footer
DetailsPanel: side sheet (≤767px bottom sheet) per card
```

Grid and spacing rules are unchanged: page column `max-w-[480px] → sm:max-w-2xl → md:max-w-3xl → lg:max-w-6xl`, `px-4 lg:px-8`, section stack `gap-7`; hero grid `grid-cols-1 sm:grid-cols-2` with `items-stretch`; tile rows `grid-cols-1 sm:grid-cols-3`; card lanes `.lane-fill` (flex-wrap, `flex: 1 1 300px`); cards `rounded-[var(--radius-lg)] p-4 ring-1`; group boxes `rounded-[var(--radius-md)] bg-currena-muted/[0.05] ring-[var(--color-border)]/60`.

Hero region cards: ring is ALWAYS `ring-[var(--color-border)]` (the previous red ring on a Critical verdict is retired — the red verdict word + alert module carry the alarm).

## 5. The flagged-indicator rule (top three + expand)

Both hero region cards use ONE identical module:

1. **Importance order** — unchanged `attentionTiles(readings, section)`: warning-status members of the section's gauges, sorted by rule-tail extremity (deepest into its own watched 10-year tail first).
2. **Initial state** — exactly **3 tiles** ("the three most important flagged indicators"), regardless of whether the card carries alert bullets. (The previous 6-tile variant for bullet-less cards is retired.)
3. **Expand** — when more flagged indicators exist, a `+{n} more` pill (existing key `ui.attentionTileMore`) below the row reveals ALL remaining flagged tiles in place (no navigation, no duplicates — the actual remaining readings).
4. **Collapse** — after expanding, a "Show fewer" control (existing key `ui.showFewer`) returns the module to 3 tiles. Both controls are ≥24px-tall rounded pills, neutral ink, `aria-expanded` semantics on the container module are preserved via the existing list label (`ui.attentionTilesLabel`).
5. Tile anatomy is unchanged: 2-line-clamped name + artwork, large value + small unit, 3-line-clamped generated rule line, click → reveal card + scroll + open DetailsPanel.
6. The count line ("{warnings} of {voting} indicators need attention") keeps its red-when-flagged ink (`attentionToneClass`); the alert box (raised markets/fx/section signals) keeps its soft red tint + ring.

The indicator LANE below keeps its existing expandable-group behavior verbatim (needs-attention + unusual cards always visible; ≤3 normal rows + "Show all {n} hidden indicators"; deep links reveal; pins persist).

## 6. Indicator cards and rows

- **AlertCard (needs-attention / unusual tiers):** white surface, `ring-1 ring-[var(--color-border)]`, 4px inline-start accent border — red for needs-attention, amber for unusual (`.alert-card[data-tier]`). The previous tinted background gradient is removed: the surface is plain `--color-surface`. Status chip top-inline-end (severity ink per §3.2); name + artwork (grayscale) + big value + 7d/30d changes + generated rule line (rule line box: `bg-currena-muted/[0.07]`, primary text) + consequence line + sparkline (neutral) + date row. Pinned ring: `ring-[var(--color-text-primary)]/25`; pin star: tertiary ink. "Details ›": primary ink.
- **CompactRow (normal/context/stale):** unchanged neutral anatomy; "Details ›" link becomes primary ink.
- **StatusChip:** `warning` → red text on `currena-warning/15`; `unusual` → amber on `currena-warning/10`; **all other statuses → `bg-currena-muted/15 text-[var(--color-text-secondary)]`** (normal loses green, context loses blue). Icons and words per status are unchanged — severity labels never rely on color alone.
- **DetailsPanel:** neutral headings (secondary ink), neutral action buttons/pills, note boxes `bg-currena-muted/[0.06]`; the history chart goes neutral (§7); status-colored content lines (history error, held/stale notes) keep their current inks.

## 7. Charts and data visualization

- History/Trend chart line + area + crosshair + inspector dot: `--color-text-primary` (area at ≤12% alpha). Grid/borders neutral as today.
- Sparkline: stays neutral.
- MarketsChart area fill: neutral ≤10% alpha.
- Range toggle groups (1Y/5Y/10Y buttons): track `bg-currena-muted/[0.08]`, active button `bg-[var(--color-surface)] text-[var(--color-text-primary)]` + subtle ring/shadow, inactive `text-secondary`; focus ring per §3.5.
- Verdict meters: §3.3. Position bars: neutral track; the rule-zone band + zone ticks keep the red severity ink; marker unchanged.

## 8. Supporting sections

- **Prices board:** four identical tiles, neutral structure; metal chips `bg-currena-muted/[0.08]`; signed 7d/30d changes and fact bullets keep the red/green sign inks (owner convention 2026-10-17d); "Gold"/"Silver" title emphasis (2026-10-17d) unchanged.
- **World markets / US-shares AUD / World currencies (private mode):** section shells become standard surface cards (`bg-[var(--color-surface)]`, neutral ring) instead of pale-blue tinted panels; severity chips (Correction/Bear, pattern attention/unusual) keep their inks; table/tile hovers go neutral; `dt` stat labels secondary ink.
- **Money panel:** the gold-gradient feature box becomes a standard card (`bg-[var(--color-surface)] ring-1 ring-[var(--color-border)]`); direction lines keep red/green valence inks; ≤4 lines unchanged.
- **Together:** collapsed-by-default unchanged; state chips neutral except `disagree` (amber); expanded detail cards standard surfaces.
- **Signals (private):** merged card loses the gold feature box → standard card; outlook verdict words keep green/red; the BalanceScale component is untouched.
- **Next-up calendar:** event-kind chips all `bg-currena-muted/15 text-secondary`; "Add to calendar" and card links primary ink; date/`tz` handling unchanged.
- **About this data:** quiet collapsible unchanged; links primary ink; failed-sources line keeps red, stale line keeps amber.
- **JumpNav:** sticky scroll-spy pills; active = charcoal fill + surface text; inactive = surface + border + secondary text (hover → primary text).

## 9. Typography and spacing

Unchanged type system: `--type-verdict 1.6rem/800` (region verdict words), `--type-number 1.45rem/800 tabular-nums` (values), `.type-section 19px/700` (section titles), `.type-question 15px/600`, `--type-label 0.875rem/600`, `--type-caption 0.78rem/500`, `.type-kicker 0.72rem/600 uppercase` (no letter-spacing for FA). Radii `--radius-sm .5rem / -md .75rem / -lg 1.125rem`. Spacing `--space-1..5`. Persian renders in Vazirmatn, Latin in Poppins; numbers format only at render via `Intl.NumberFormat(numberLocale)` with Persian digits in FA. No type-role changes are part of this redesign.

## 10. RTL (FA) and LTR (EN)

- `dir` on `<html>` from locale; all offsets use logical properties (`ms-/me-/ps-/pe-/start/end`); the alert-card accent border stays on the inline-start edge; the details sheet slides from the inline-end (bottom sheet ≤767px); connection arrows mirror under `[dir=rtl]`.
- Verdict meters keep `direction: ltr` in FA (time/level axis convention, G9).
- Signed numbers keep their `dir="ltr"` islands with the word-unit OUTSIDE the island (2026-10-17 bidi fix preserved).
- Persian digit rendering, Jalali dates, and the copy corpus are untouched.

## 11. Responsive behavior

Unchanged breakpoints, verified at 360, 768, 1024, 1440 px: single column ≤639px (hero cards stack; JumpNav horizontally scrollable; tile rows 1-col; DetailsPanel bottom sheet) → hero 2-col + tiles 3-col at `sm:` → lane cards 2-col `md:` → 3-col `lg:` with `lane-fill` stretch. No horizontal overflow at 320px. Touch targets ≥44px for primary controls (≥24px for compact in-card pills, as today).

## 12. Interaction, loading, and error states

Preserved from the current implementation, reskinned neutral where structural:

- **Loading:** neutral skeleton shells (`InsightsLoadingState`).
- **Error:** red error card + retry (severity ink, retained).
- **Stale cache:** red-tinted stale banner (retained) + per-card stale tags (neutral chips + word).
- **Private mode:** neutral sign-in explanation state (`InsightsPrivateState`), no data leaked.
- **Unavailable indicators:** honest "No data" cards/rows (neutral).
- **Expand/collapse:** the existing `expandToken` + localStorage idiom for Together/Signals/About; in-place reveals for tiles and groups; reduced-motion honored (`scroll-behavior: auto`, no meter transitions).
- **Tooltips:** GlossaryTip "?" pills (click-toggle, `aria-expanded`, `aria-controls`) — panel background becomes neutral `bg-currena-muted/[0.06]`; content unchanged.

## 13. Dark mode

All changes are token-driven and must hold in `.dark`: neutral ramp inverts via tokens; severity inks keep their existing dark-theme values (Carbon dark siblings already defined); meter neutral grading uses the same `color-mix` over dark tokens (light-on-dark); grayscale artwork filter is theme-independent; charcoal selected-pills become `--color-text-primary` (#E8EDF4) fill with `--color-surface` text — i.e. inverted, still "the dark pill". Verify contrast ≥4.5:1 for text, ≥3:1 for UI accents in both themes.

## 14. Accessibility requirements

- Every severity chip keeps icon + word (never color alone); verdict words keep their meter + aria-label.
- Focus ring visible on every interactive element (neutral, 2px).
- Keyboard model unchanged: `/`, `j`/`k`, roving arrow keys, Home/End, Escape closes the panel, focus returns to the opener, body scroll lock while the panel is open.
- `role="img"` meters with text alternatives; `aria-expanded`/`aria-controls` on all disclosures; screen-reader-only text for icon-only buttons.
- The expand/collapse controls for flagged tiles are real `<button>`s in tab order.

## 15. Acceptance criteria

1. Both hero region cards show exactly 3 flagged tiles initially; `+{n} more` reveals the remaining flagged tiles in place; "Show fewer" collapses back; ordering matches `attentionTiles` (unchanged logic, verified against live data: 6 global + 6 AU warnings).
2. No `currena-blue`, `--color-status-context`, `currena-soft`, `currena-coral`, or `--color-accent-gold*` ink remains anywhere in the Insights page render (light and dark).
3. Severity inks appear only in the §3.2 allowed locations (spot-check: chips, cards, meters, links, nav, tools, charts, calendar, artwork).
4. "Normal" and "Context" status chips render neutral with their icons; severity labels remain understandable in grayscale (icon + word test).
5. All verdict meters render the neutral graded ramp at `lg`/`sm`/question sizes, LTR in FA, with `data-step` intact.
6. Signed changes still render red/green; band words still colored; verdict words still 4-hue; attention count still red when flagged.
7. AlertCards keep the red/amber inline-start border on a plain white/dark surface (no gradient tint); flagged rule line box is neutral.
8. EN (LTR) and FA (RTL) both render correctly: logical edges, mirrored arrows, bidi islands, Persian digits, Vazirmatn.
9. No horizontal overflow or clipped content at 360/768/1024/1440; details panel bottom-sheet on mobile; footer sticks/pushes naturally.
10. Keyboard: tab order sensible; focus ring visible; `/`, `j`/`k`, Escape, focus-return all work; tooltips keyboard-operable.
11. Loading, error, stale, private, and unavailable states render correctly (verified by blocking the API and using cached data).
12. `pnpm -r typecheck`, `pnpm -r test`, `pnpm lint`, `pnpm copy:audit` all pass; `pnpm --filter @currena/web build` + bundle budget hold.
13. No user-facing string was added or changed (manifest untouched); no financial logic, data source, or endpoint changed.
14. Dark mode verified for the above in both themes.
