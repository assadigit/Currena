# Economic Indicators Page — UI/UX Design Specification

**Document type:** Implementation specification  
**Scope:** Economic indicators overview page and its existing interactions  
**Status:** Ready for implementation planning  
**Primary references:** The supplied grayscale proposed layout (1280 × 960) and the supplied current Persian interface (1129 × 777)

## 1. Goal

Refine the Economic Indicators page by using the proposed design's clearer hierarchy and spacious layout while retaining the current interface's meaningful severity colors, contextual explanations, indicator categories, and working functionality.

The page should feel calm, credible, modern, and understandable to people who are not financial professionals. Serious economic conditions should be visually clear without making the entire page feel like an alarm.

### Product principle

**Make the state easy to scan; make the reason easy to understand; keep deeper detail available without putting everything in the user's way.**

### Success outcomes

A first-time visitor should be able to identify:

1. The current assessment for Global and Australia.
2. Why each assessment has that state.
3. The three most important flagged indicators in each section.
4. The meaning of each displayed figure, in plain language.
5. Where to expand the section to see remaining flagged indicators and other existing categories.

## 2. Scope and guardrails

### Included

- Page layout, spacing, typography, surfaces, borders, icons, status treatment, and responsive behavior.
- Existing header actions and tools on this page.
- Global and Australia summary cards.
- Flagged-indicator lists, show-more/show-less behavior, existing calm/normal categories, and insufficient-data groups.
- Existing explanatory tooltips or information controls.
- Existing data-download/export action if it is currently implemented.
- Existing “next on the page” or related navigation notice, if this is a real part of the product experience.
- Persian RTL and English LTR presentation.
- Accessibility and implementation acceptance criteria.

### Not included

- Changing economic data, formulas, indicator definitions, data sources, severity thresholds, or status-classification logic.
- Inventing new financial metrics, new sections, new navigation destinations, or new controls that are not supported by the existing product.
- Replacing the application's framework, state-management approach, routing, localization, or data-fetching architecture.
- Redesigning unrelated pages or introducing a site-wide design-system migration.

### Preserve existing behavior

Before implementation, inspect the repository and identify which controls are real and what they do. Retain existing behavior unless a specific behavior is broken and the fix is necessary for this page. A control that is only illustrative in a screenshot must not be made to imply functionality that does not exist. Do not remove an existing working download/export action merely because it is omitted from the grayscale proposal.

## 3. Design direction

Use the grayscale proposal as the **structural foundation**:

- Clear page heading and short subtitle.
- Two prominent overview cards for Global and Australia.
- Strong distinction between status, explanation, and individual indicators.
- Three flagged indicators visible initially in each overview.
- A clear expansion control for the rest of the flagged list.
- Calm and insufficient-data sections visually secondary to the main findings.

Retain selectively from the current interface:

- Severity colors that have meaning.
- Indicator category labels and concise interpretation text.
- A visible data-as-of date, where already available.
- Existing tooltips, data-download functionality, and useful context.
- The product's current Persian font, icon set, branding, and established interaction patterns where suitable.

Do not copy the grayscale proposal literally as a monochrome production interface. Do not keep all the current screen's red/orange surfaces and nested boxes at full strength. Use color as a semantic signal rather than decoration.

## 4. Page anatomy and content hierarchy

The page should use this hierarchy:

1. **Page header:** title, short explanatory subtitle, data freshness text, and existing utility actions.
2. **Primary overview:** Global and Australia status cards.
3. **Status summary within each card:** region name, severity label, severity mark/scale if already supported, and a concise “Why” summary with an optional information control.
4. **Flagged indicators:** section heading with total count, followed by the top three indicators.
5. **Expanded flagged indicators:** the rest of the flagged indicators, available through a show-more/show-less control.
6. **Secondary groups:** existing calm/normal categories and insufficient-data groups, initially collapsed if consistent with current functionality.
7. **Existing follow-on/navigation notice:** a low-emphasis footer strip only where real product content or navigation exists.

### Summary wording

- Use the current localized state labels and existing severity logic. Do not invent replacement status labels or silently rename classifications.
- The “Why” line should summarize the count of flagged indicators and the most important contributing indicator, when the data model supports that information.
- Prefer short everyday-language explanations over technical shorthand.
- Preserve the difference between an indicator's observed value and the interpretation of what it may mean.
- Avoid making one indicator sound like proof of an overall economic conclusion. Use appropriately qualified wording already supported by the product's editorial rules.
- Do not fabricate missing values. Use the product's current unavailable/insufficient-data treatment.

## 5. Layout and spacing

Use the existing page container and styling conventions if they already meet these targets. The measurements below are design targets, not a reason to add a new layout framework.

### Spacing scale

Use a consistent 4 px base scale:

| Token | Target | Typical use |
|---|---:|---|
| `space-1` | 4 px | Icon/text micro-gap |
| `space-2` | 8 px | Compact inline spacing |
| `space-3` | 12 px | Label/value gaps |
| `space-4` | 16 px | Mobile card padding, compact section spacing |
| `space-5` | 20 px | Tablet gaps |
| `space-6` | 24 px | Desktop card padding and main grid gap |
| `space-8` | 32 px | Header/content separation |
| `space-10` | 40 px | Wide desktop outer margin |

### Desktop: 1024 px and wider

- Center the page in a fluid container with a maximum width of approximately **1440 px**.
- Use **32–40 px** outer horizontal padding on wide desktop viewports; never let content touch the viewport edge.
- Header and main content should share the same left/right alignment lines.
- Place Global and Australia cards in a two-column grid with equal width and approximately **24 px** gap.
- Keep **Global on the right and Australia on the left**, matching both supplied references. Do not automatically swap the two cards when the language changes; this ordering is an intentional content priority. Inner content must still obey RTL/LTR direction.
- Use approximately **24 px** card padding and **16 px** corner radius. Use a thin neutral border rather than heavy shadows.
- Keep the first three flagged indicators visible. Avoid making either overview card dramatically taller just to force equal heights; the two cards may stretch to the same row height where natural, but content must not be clipped or artificially spaced.
- Separate the header from the cards by approximately **28–36 px**.

### Tablet: 768–1023 px

- Use **20–24 px** outer horizontal padding.
- Stack the two overview cards vertically if two columns would make either card narrower than approximately **420 px**. At 1024 px and above, use the two-column desktop layout.
- Use a **20 px** vertical gap between stacked cards, and **20–24 px** card padding depending on available width.
- Keep actions from overflowing the header; allow them to wrap cleanly.

### Mobile: 320–767 px

- Use **16 px** outer horizontal padding (reduce only when necessary to avoid overflow on very narrow screens).
- Stack the overview cards vertically, Global first and Australia second, unless the existing product order is intentionally different for a documented reason.
- Use **16 px** card padding and **16 px** between major cards.
- Stack the header elements into a readable layout. Keep the page title and subtitle prominent; place existing utility actions in a separate row that can wrap without crowding the title.
- Allow long indicator labels and explanations to wrap. No text, value, badge, or control may cause horizontal page scrolling at **320 px** viewport width.
- Indicator rows may become taller on mobile. Do not shrink text to keep a fixed row height.

### Card and indicator structure

- Card title: region name and severity treatment share a row when there is enough room; wrap naturally on narrow screens.
- “Why” summary: place directly below the card heading, with optional info control adjacent to the relevant text.
- Flagged-list heading: visually distinct from the summary, but quieter than the region title.
- Indicator row: use a flexible text column and a compact value column. The value must stay readable and aligned consistently within the card.
- Indicator rows should normally have at least **72 px** vertical space on desktop, with **12–16 px** internal padding. Allow rows with longer descriptions to grow naturally.
- Use **12 px** corner radius for individual indicator rows, with a **1 px** neutral border and a subtle or white surface.
- The leading severity symbol, indicator text, and value must not collide or overlap when translated text becomes longer.
- On very narrow layouts, let the value move below the text if necessary rather than compressing either column excessively.

## 6. Visual design tokens

Start from the following suggested tokens. Map them onto the project's existing CSS variables/theme system if possible instead of introducing competing token systems. Check every actual foreground/background combination for contrast before release.

### Neutral palette

| Token | Suggested value | Use |
|---|---|---|
| `page-bg` | `#F4F5F6` | Page background; a quiet neutral |
| `surface` | `#FFFFFF` | Main cards and indicator rows |
| `surface-muted` | `#F7F8F9` | Secondary surfaces and low-emphasis sections |
| `text-primary` | `#242424` | Headings, core values, primary text |
| `text-secondary` | `#55585C` | Descriptions and secondary copy |
| `text-muted` | `#686D73` | Metadata and helper text; must remain readable |
| `border` | `#D2D5D8` | Default card and row borders |
| `border-strong` | `#9A9FA4` | Emphasized neutral outlines |
| `focus-ring` | `#1769AA` | Visible keyboard focus indicator |

### Severity colors

Severity colors should be applied consistently to the written state, icon/marker, and a small amount of supporting emphasis. A pale tint may be used behind a status badge or a genuinely important explanation. Do not color every row or the full card background solely because the overall status is severe.

| Semantic token | Accent / icon | Pale background | Typical meaning |
|---|---|---|---|
| `severity-critical` | `#C62832` | `#FFF1F2` | Critical/crisis state, only where the existing product defines it |
| `severity-elevated` | `#C65313` | `#FFF4E8` | Elevated/stressed/tense state, according to existing mapping |
| `severity-moderate` | `#946200` | `#FFF8E6` | Moderate/cautious state, according to existing mapping |
| `severity-stable` | `#187A45` | `#ECF8F0` | Stable/positive state, where supported |
| `severity-neutral` | `#686D73` | `#F0F1F2` | Calm, unclassified, or non-severity information |

**Important:** These are presentation tokens only. Match them to the application's current state taxonomy and thresholds after inspecting the code. Do not infer that a state is critical based only on a label in the screenshot. Do not communicate severity by color alone; keep the textual state and, where useful, a distinct shape/icon.

### Applying severity

- Use the strongest accent on the severity label and one primary marker (icon or scale).
- Prefer neutral borders and white surfaces for the main cards.
- Use pale severity backgrounds for small badges or a single focused explanatory panel, not as a flood of color across the whole section.
- Use one coherent severity scale everywhere on this page.
- Keep the severity scale/bar only if it conveys actual information already calculated by the application. Its number of filled segments and color must match existing severity logic; do not hard-code a visual severity level.
- Calm groups should not look like warnings. Insufficient-data groups should be neutral, not green or red.

## 7. Typography

First inspect the current font setup. Reuse the site's existing font family and licensed assets if they render Persian and English well. Do not introduce a new typeface solely for this page without a real need. Confirm Persian punctuation, numerals, mixed-script text, and percent/currency layouts in the browser.

### Target sizes

| Element | Desktop target | Mobile target | Weight |
|---|---:|---:|---|
| Page title | 32–36 px | 24–28 px | 700 |
| Region/card title | 26–30 px | 22–26 px | 700 |
| Severity label | 15–17 px | 14–16 px | 600–700 |
| Primary indicator value | 21–24 px | 19–22 px | 700 |
| Indicator name | 15–17 px | 15–16 px | 600–700 |
| Indicator explanation | 14–15 px | 14–15 px | 400 |
| Section label / count | 13–14 px | 13–14 px | 600–700 |
| Date and helper metadata | 13–14 px | 13–14 px | 400 |

- Body and explanatory copy must not be reduced to tiny text to fit a card. Aim for **14 px or larger** for routine readable text.
- Use a line height of approximately **1.45–1.65** for body text, especially Persian text.
- Use tabular numerals for comparable numeric values when the font supports them.
- Keep indicator values visually prominent, but not so large that they overpower the indicator names and explanations.
- Use boldness and spacing—not multiple font colors or excessive uppercase labels—to establish hierarchy.

## 8. Language, RTL and LTR

The page must support Persian RTL and English LTR. Reuse the project's established localization mechanism; do not add a new language switcher if one does not already exist.

### Direction rules

- Set the document/page direction from the active locale (for example, `dir="rtl"` for Persian and `dir="ltr"` for English); do not simulate RTL with text alignment alone.
- Use logical CSS properties such as `margin-inline-start`, `padding-inline-end`, `inset-inline-start`, and `border-inline-start` instead of hard-coded left/right properties where direction-dependent behavior is intended.
- Align headings, summaries, and descriptions to the reading direction.
- Within an indicator row, keep the severity symbol at the leading edge and the primary value at the trailing edge; these positions should adapt to the active direction.
- Preserve the desktop card locations (Global on the right, Australia on the left) in both locales for visual continuity. Do not mirror the main card ordering just because the page direction changed.
- Mirror directional icons (such as a back/forward arrow) only when their meaning depends on reading direction. Do not mirror logos, warning triangles, charts, or non-directional symbols.
- Keep percentages, dates, currencies, and mixed Persian/Latin text legible. Use the application's locale-aware formatter and appropriate bidi isolation for embedded LTR fragments when needed; do not hand-build numbers from strings.
- Translate all user-facing labels, tooltips, expansion controls, empty states, and accessibility names. Avoid hard-coded English strings inside components used by the Persian page.
- Verify that long Persian labels wrap naturally and that Latin indicator names, rates, and abbreviations do not reverse punctuation order.

## 9. Interaction behavior

Implement only interactions that exist in the product or are explicitly represented by the current page. Preserve established URLs, callbacks, and data behavior after the visual refactor.

### Header actions

- Keep the existing Tools control and any currently working data-download/export control.
- Preserve each action's actual menu, download, or navigation behavior.
- Menus/popovers must open and close using the existing interaction model, be keyboard-operable, and not be clipped by the page card/container.
- If the grayscale proposal omits a current working action, redesign its appearance or placement rather than silently deleting it.

### Info controls and tooltips

- Info icons must have accessible names and expose the existing explanation.
- On pointer devices, the explanation may appear on hover; it must also work on keyboard focus and tap.
- Tooltips must not contain the only copy of essential status information. They must be dismissible and remain readable on small screens.

### Show more / show less flagged indicators

- Initially show the **top three flagged indicators** for each region, ordered by the application's existing relevance/rank order.
- Display an expansion control only when more flagged indicators exist than are currently visible.
- Activating the control reveals the remaining flagged indicators without losing the current card state or jumping the page unexpectedly.
- The control label and accessible state must update correctly (for example, show-more/show-less and `aria-expanded`).
- If there are three or fewer flagged indicators, do not show a redundant expansion control.
- The total flagged count in the section heading must reflect the complete underlying count, not only visible rows.

### Calm and insufficient-data groups

- Retain the existing groups and their contents.
- If currently collapsible, keep them collapsible and ensure the visible disclosure control communicates the state.
- If the reference introduces a collapsed appearance but the application currently has no expand/collapse behavior, add it only if it is necessary to meet the agreed top-three information-density rule and can be implemented without changing data behavior.
- Do not fabricate calm indicators or fill in missing values.

### Related-page / next-on-page notice

The proposed wireframe shows a “next on the page” notice for prices, personal-finance implications, and a calendar. Treat it as a subdued informational strip only if this is part of the intended product navigation/content flow.

- Do not implement fake links or invent routes for these items.
- If real destinations already exist, preserve their destinations and make links clearly identifiable and keyboard-accessible.
- If it is only a planning note from the wireframe and has no user-facing role in the actual product, do not ship it as production UI.

### Loading, empty, and error states

- Inspect the existing data lifecycle and preserve its real states.
- Reuse the product's established loading, failed-data, and insufficient-data patterns. Do not show invented financial numbers or a false “stable” state while data is loading or unavailable.
- Avoid layout jumps where possible; keep card structure stable during loading.

## 10. Responsive interaction and overflow rules

- Controls must remain reachable and legible when cards stack.
- Expanded indicator lists must flow in document order and must not be cut off by fixed heights.
- Tooltips/popovers must reposition to stay within the viewport.
- The page must not use fixed heights that clip Persian text or longer English indicator names.
- Long titles, rates, explanatory sentences, and translated labels must wrap without colliding with icons or values.
- At mobile widths, the value may move to a new line, but it must remain visually associated with its indicator name.
- Test viewport widths of **320, 375, 768, 1024, and 1280 px**, plus one wide screen around **1440 px**.

## 11. Accessibility requirements

Meet WCAG 2.2 AA practices applicable to this page.

- Text contrast: at least **4.5:1** for normal text and **3:1** for large text.
- Non-text control boundaries, meaningful icons, and focus indicators: target at least **3:1** contrast against adjacent colors.
- Status is communicated by text plus color and/or icon/shape, never by color alone.
- All interactive controls work with keyboard alone, with logical focus order and a clearly visible focus ring.
- Use semantic headings in a logical order; do not select heading levels based only on desired font size.
- Buttons and disclosure controls have meaningful accessible names. Expansion controls announce their expanded/collapsed state.
- Every icon-only control has an accessible label. Decorative icons are hidden from assistive technology.
- Do not rely on hover as the only way to reveal information.
- Ensure touch targets are preferably at least **44 × 44 px** where practical, especially for icon-only controls.
- Respect reduced-motion preferences if transitions are used. Avoid decorative animation that communicates severity in place of readable text.
- Page reading order must remain sensible in both RTL and LTR locales and match the visual order of interactive controls.

## 12. Implementation instructions for the coding agent

Follow this sequence before editing the page.

### Step 1 — Inspect

1. Read the repository's setup/agent instructions and identify the framework, entry points, routes, UI library, and styling system.
2. Locate the implementation of this Economic Indicators page and its shared components.
3. Identify the source of Global/Australia data, indicator ordering, severity classification, localization, tooltip content, expansion behavior, and data-download action.
4. Identify existing breakpoints, typography, fonts, icon assets, CSS variables/tokens, and RTL handling.
5. Run the current page and note any baseline visual or functional issues before changing it.

### Step 2 — Plan

- Write a brief implementation plan in the agent session or existing project workflow before large edits.
- Map the specification to existing components and tokens; reuse project conventions where possible.
- Clearly distinguish visual changes from behavioral changes.
- Do not replace functional code simply to match the screenshot if an existing component can be restyled safely.

### Step 3 — Implement

- Build on the existing framework and component patterns.
- Keep the scope limited to this page and components directly required by it.
- Prefer small, reusable page-specific components where the current codebase supports them (for example, region summary card, indicator row, severity badge, and disclosure group).
- Use data-driven lists rather than hard-coded copies of the first three indicators.
- Keep severity style mapping separate from indicator calculations. Presentation changes must not alter data or state classification.
- Use the existing localization/formatting system for all copy, dates, and values.
- Preserve current routes, downloads, tooltip content, and event behavior.
- Do not add dependencies unless a clear need is demonstrated and approved by repository conventions.

### Step 4 — Verify

- Run the project's appropriate lint, type-check, unit-test, and build commands when available.
- Test Persian RTL and English LTR separately.
- Test default and expanded indicator lists, all existing header actions, tooltips, calm groups, insufficient-data groups, and unavailable-data behavior.
- Inspect responsive layouts at the required viewport widths.
- Check the browser console for new errors and verify there is no horizontal overflow at 320 px.
- Compare the result against both supplied references: the hierarchy and spacing should be closer to the proposed wireframe, while selective severity colors and useful details from the existing implementation remain.
- Report changed files, checks performed, any checks that could not be run, and any unresolved limitations. Do not claim a check passed unless it was actually run.

## 13. Acceptance criteria

The implementation is complete when all applicable criteria below pass.

### Visual hierarchy and layout

- [ ] A visitor can identify the page title, Global status, and Australia status quickly without reading every indicator.
- [ ] Global and Australia use equal-priority overview cards with Global on the right and Australia on the left on desktop, matching the supplied references.
- [ ] Cards have a light surface, subtle border, consistent radius, and clear internal spacing.
- [ ] Severity colors are selective and consistent; the entire page is not dominated by red/orange surfaces.
- [ ] Values remain prominent while names and explanations are still easy to read.
- [ ] The top three flagged indicators are shown by default in each region.
- [ ] Calm and insufficient-data groups are visually secondary to flagged indicators.

### Content and behavior

- [ ] Existing severity labels, thresholds, data, indicator rank/order, and calculations are unchanged.
- [ ] The displayed flagged count represents the full data count.
- [ ] Show-more/show-less appears only when needed, reveals the remaining items, and reports its state accessibly.
- [ ] Existing tooltips and header actions still work.
- [ ] Any working download/export action has not been removed.
- [ ] No new route, fake action, fabricated value, or unsupported indicator has been introduced.
- [ ] Data freshness and insufficient-data messages remain accurate according to existing data.

### Localization and responsiveness

- [ ] Persian content uses true RTL direction; English content uses true LTR direction.
- [ ] Card placement remains consistent across locales while inner alignment follows direction.
- [ ] Text, punctuation, numbers, and percentages render correctly in both locales.
- [ ] At 320 px width, there is no horizontal page scrolling or overlapping content.
- [ ] Desktop uses two columns; narrower layouts stack cards when their content would otherwise become cramped.
- [ ] Cards and rows grow to fit content instead of clipping it.

### Accessibility and engineering quality

- [ ] Text and controls meet the stated contrast targets.
- [ ] All interactive controls are keyboard-operable with visible focus.
- [ ] Icon-only controls have accessible names; status does not rely on color alone.
- [ ] No new console errors, lint failures, type errors, or build failures are introduced, where those checks exist.
- [ ] The existing framework, localization, data behavior, and project conventions have been preserved.
- [ ] The agent's final report accurately lists the files changed and verification actually completed.

## 14. Final design summary

Build a restrained, information-first dashboard: the proposed wireframe's layout and spacing, paired with the current product's meaningful severity colors and contextual explanations. Keep the main state and top three flagged indicators visible, provide an obvious path to the rest, support Persian RTL and English LTR properly, and preserve all existing product behavior. Optimize for readability and trust—not for maximum color or the largest possible amount of data on the first screen.
