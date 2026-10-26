# Currena Economic Indicators — UI/UX Implementation Specification

**Status:** Approved visual direction; ready for implementation  
**Repository:** https://github.com/assadigit/Currena  
**Scope:** Economic Indicators page only, including its existing interactions  
**Locales:** Persian RTL and English LTR  
**Reference priority:** `references/01-approved-dashboard-reference.png` is the primary visual target; the remaining reference images provide context and design-system guidance.

## 1. Product intent

Refine the existing Economic Indicators page into a sophisticated, editorial financial interface: credible like a financial publication, understandable to the general public, and data-led without looking like a trading terminal. Keep the look restrained and minimalist, but not sterile: typography, useful contextual copy, small status cues, subtle illustration, and careful spacing should create its character.

The approved direction is:

- Editorial and financial, with a clean off-white background and deep navy typography.
- Neutral cards and borders; use amber/orange and red sparingly for actual severity states, with green reserved for supported stable/favorable states.
- The desktop layout has two equal primary region cards: **Australia on the left and Global on the right** in the supplied RTL reference.
- On mobile, show **Global first** and let the user swipe horizontally to **Australia**. Do not stack both cards into a long vertical page on mobile.
- Show the three highest-priority flagged indicators per region initially and let users expand the remaining flagged indicators inline.
- Support Persian RTL and English LTR as real layout directions, not just different text alignment.
- Preserve the application's actual data, formulas, severity thresholds, current classifications, routes, translations, and existing working controls.

## 2. Source-of-truth and scope rules

### In scope

- Page layout, card hierarchy, spacing, typography, colors, borders, background artwork, icons, and responsive treatment.
- The existing tools, language, data-download/export actions, tooltips, category groups, disclosures, and related navigation that already belong to this page.
- The three-item default list and inline expansion of the remaining flagged items.
- Mobile swipe navigation between Global and Australia.
- Accessibility and test coverage for this page.

### Out of scope

- Changing economic calculations, indicator definitions, severity thresholds, ranking/order logic, data sources, API behavior, or classifications.
- Inventing values, historical changes, categories, warning messages, routes, controls, or financial interpretations not supported by the application.
- Redesigning unrelated pages or performing a site-wide design-system migration.
- Replacing the current framework, localization system, routing, state management, or data fetching simply to match a screenshot.

**The application is authoritative for content and behavior.** Reference screenshots are visual guidance only. Do not copy values or wording from mockups if they conflict with live application data or the existing approved Persian/English copy.

## 3. Reference pack and how to use it

- `references/01-approved-dashboard-reference.png` — primary visual reference for page hierarchy, desktop card layout, restrained severity colors, metric rows, category summaries, and the related-content footer.
- `references/02-design-system-and-mobile-board.png` — supporting reference for compact mobile treatment, Global-first swipe interaction, palette, icon style, and the faded Sydney artwork.
- `references/03-desktop-mobile-rtl-style-board.png` — supporting reference for RTL layout, component styles, state badges, and iconography.
- `references/04-current-persian-interface.png` — reference for existing content density, data context, and product behavior; do not reproduce its visual clutter.
- `references/05-original-grayscale-wireframe.png` — reference for the original information hierarchy and restrained card structure.
- `assets/sydney-harbour-opera-house-faded.png` — subtle decorative artwork for the Australia card header only.
- `assets/global-map-faded-reference.png` — a very low-contrast map texture reference for the Global header, only if it works cleanly with the implementation.

Screenshots are **not** production page assets and must never be inserted as full-page UI images. Build real HTML/CSS/components using the existing data and interactions. Use the two separate illustration files only as decorative background assets; do not crop them again at runtime. Because the artwork in the pack is a softened crop from the approved reference board, the agent may recreate a cleaner equivalent with the project's existing asset pipeline if that produces better quality, but it must preserve the same muted treatment and must not fetch arbitrary remote assets.

## 4. Visual language

### Overall feel

- Editorial financial publication rather than generic SaaS or a trading terminal.
- Clear, composed, quietly confident, data-led.
- Avoid excessive gradients, glass effects, neon colors, deep shadows, dense nested cards, large decorative icons, and warning-red surfaces everywhere.
- Create visual interest through a strong navy typographic hierarchy, small rounded status badges, subtle blue-gray rules, consistent outline icons, and the two restrained header illustrations.
- Do not use emoji as production icons if the project already has a real icon set.

### Suggested tokens

Map these to existing project tokens if equivalent tokens already exist; do not create competing global theme systems.

| Token | Value | Use |
|---|---|---|
| `--ei-page-bg` | `#F8FAFC` | Soft neutral page background |
| `--ei-surface` | `#FFFFFF` | Main cards and rows |
| `--ei-surface-muted` | `#F1F5F9` | Quiet controls and secondary grouping |
| `--ei-navy` | `#0F2D4A` | Primary headings, important figures, strong icons |
| `--ei-text` | `#1F2937` | Primary body text |
| `--ei-text-secondary` | `#64748B` | Supporting descriptions |
| `--ei-text-muted` | `#64748B` | Metadata, only where contrast is sufficient |
| `--ei-border` | `#DCE5EE` | Main card/row outline |
| `--ei-border-soft` | `#E8EEF4` | Dividers and low-emphasis boundaries |
| `--ei-blue` | `#2563EB` | Interactive links and focus treatment where consistent with site tokens |
| `--ei-critical` | `#DC2626` | Crisis/critical state accent |
| `--ei-critical-bg` | `#FFF1F2` | Very pale red explanation surface |
| `--ei-warning` | `#F59E0B` | Tension/elevated state accent |
| `--ei-warning-bg` | `#FFF7E8` | Very pale amber surface |
| `--ei-success` | `#16A34A` | Stable/favorable state accent, only when supported |
| `--ei-success-bg` | `#F0FDF4` | Very pale green surface |
| `--ei-neutral-state` | `#64748B` | Calm, unknown, or insufficient-data states |

The exact existing product taxonomy controls which token is applied. These are presentation tokens only; they must not change how the application decides a status. Avoid light-colored text on pale backgrounds. Verify WCAG contrast for actual foreground/background combinations.

### Severity treatment

- Keep primary cards white or near-white regardless of their severity.
- Display severity in a compact, readable pill plus a small meaningful symbol if supported; use a short amber treatment for tension and red for a critical/crisis state.
- Keep the written state visible. Color must never be the only way to communicate severity.
- If the existing severity bar represents a real score or existing level, retain it with the exact underlying meaning; do not invent a score or filled-segment count.
- Green is reserved for an existing stable/favorable classification, not simply because a metric is low.
- Do not apply red borders to every indicator in a critical Global card. Use a restrained left/right logical accent or subtle border and a single low-tint explanatory panel where appropriate.
- Insufficient-data states are neutral and must not look positive or alarming.

## 5. Typography

1. Inspect the existing font stack and reuse the site's Persian and English fonts. Use the current app font if it is readable; prefer an already-installed/project-supported Persian typeface such as Vazirmatn or IRANSans only if the project already uses or bundles it. Do not add font files without a clear project need.
2. Use a clear three-level hierarchy: page title, region/section headings, and indicator names/values; use weight and spacing rather than many colors.
3. Suggested targets: page title 28–34 px desktop / 24–28 px mobile; region heading 24–30 px / 22–26 px; indicator name 15–17 px; key value 21–25 px desktop / 19–22 px mobile; description 14–15 px; metadata 12–14 px only if readable.
4. Body copy should normally be at least 14 px with line-height about 1.5–1.65, especially for Persian.
5. Use tabular numerals for comparable values if supported by the current font.
6. Long labels must wrap naturally; never shrink text merely to force identical card heights.

## 6. Desktop layout

Target width: 1024 px and wider.

- Use the existing page container with maximum width around 1440 px; maintain approximately 24–40 px page gutters based on viewport width.
- Page title, subtitle, data freshness, and existing header controls share a disciplined grid. For Persian, the title block aligns to the right, while utility controls occupy the opposite side without disrupting RTL reading order.
- Place Australia in the left card and Global in the right card as shown in the approved reference, including English locale. This stable placement is intentional; local text inside each card follows the active language direction.
- Use equal-width columns, a 20–24 px gap, 20–24 px inner card padding, 12–16 px corner radius, subtle 1 px borders, and little or no visible shadow.
- Use clear separation between page header and cards, roughly 24–32 px, depending on existing site spacing.
- The three important flagged indicators should be visible in the initial card view when screen height permits, with additional items behind a compact disclosure.
- Secondary category summaries sit below the flagged list. Keep them quiet, compact, and consistent across both cards.
- Avoid forcing equal heights by adding artificial blank space; do not clip content to align card bottoms.

## 7. Australia and Global header artwork

### Australia

- Use `assets/sydney-harbour-opera-house-faded.png` as a subdued background detail across the top/header band of the Australia card.
- Keep the artwork desaturated, low-contrast, and visually behind the flag/region title/status. Add a white/off-white linear gradient overlay so the region name, status pill, and count remain clearly readable.
- Crop with `background-size: cover` and position the Opera House/harbour toward the center-right of the art band; allow the art to fade into the neutral card background near the text-heavy edge.
- The graphic is decorative, not a primary content image. Mark it `aria-hidden` when implemented as a background. It must not make card text less legible.
- On narrow cards, reduce image visibility or disable the artwork if it competes with content. Preserve the clean card layout and do not force a minimum card height solely for the illustration.

### Global

- A subtle map texture may be used behind the Global card header if it matches the reference and renders cleanly. Keep opacity very low; the texture must not compete with the title or severity pill.
- Do not use both a large globe image and an oversized map at once. Use the existing flag/globe symbol at a restrained size and, at most, one faint map texture.

### Image implementation notes

- Resolve assets from local project paths; do not hotlink to external image URLs.
- If using CSS background-image, place the asset URL in the project’s existing asset conventions and include a fallback neutral background.
- Test crop positions in Persian and English. On mobile, text and artwork must not collide.
- If the supplied crop is visibly pixelated after resizing or does not integrate naturally, improve/recreate the art using the repository's asset pipeline and document the change.

## 8. Indicator rows and information hierarchy

Within each regional card, maintain this hierarchy:

1. Region title, status badge, and count of flagged indicators.
2. Short context or “why this state” explanation using the actual available data.
3. A heading for the key/flagged indicators.
4. The top three indicators, ordered by the existing application ranking/relevance.
5. A compact inline control to reveal remaining flagged indicators.
6. Secondary category summaries and existing calm/insufficient-data groups.
7. A concise explanation panel only when the page's actual data/content supports it.

### Indicator row

- Each row contains the indicator icon where useful, name, one short existing plain-language explanation, current value, and any supported historical/comparison metadata already shown in the product.
- Do not invent “change,” “previous value,” dates, or historical trend values. If existing data has these details, present them subtly; otherwise omit them.
- Use one consistent outline icon set and size (typically 18–22 px), with a soft neutral icon container only where it helps scanning.
- Key values should be visually strong navy text; severity accents should be restrained to an icon/edge/badge/short bar rather than a fully saturated card.
- Use flexible layout columns or grid areas. In RTL, row flow follows RTL; values and labels must never overlap.
- Target at least 76–88 px row height on desktop where descriptions are present, but allow rows to grow; use 12–16 px padding and consistent 10–12 px gaps.

### Expand additional indicators

- Show the top three flagged indicators by existing ordering by default.
- Provide a clear localized “show more” control only if additional flagged items exist.
- Expand inline and reveal actual remaining indicators; do not duplicate the initial three or create fake placeholder items.
- The label, `aria-expanded`, and interaction state update when expanded/collapsed. Avoid unwanted page jumps.
- The total count reflects the complete real data set, not only visible rows.

### Category summary groups

- Use compact rows or a restrained small grid for existing categories, with category label, existing state, and severity scale only when the application has one.
- Keep category cards lighter than the flagged indicators: white/near-white surface, fine border, compact icon, short label, small state badge or text.
- Do not repeat the same warning icon, status color, and alert background in every nested element.
- Calm and insufficient-data sections must remain visually secondary and semantically distinct.

### Explanation panel

- For a real existing explanation (such as Global crisis conditions), use a pale tinted background and neutral/red outline with a clear heading and concise bullets.
- Use red only for genuinely critical content according to the current application data.
- Match the shared card's corner radius and spacing. Avoid dense, tiny, underlined red paragraphs.
- Preserve wording and localization where it is already established; never derive financial advice or unsupported causality from a screenshot.

## 9. True RTL and LTR rules

Implement direction semantically at the page/component root using the current localization framework (`dir="rtl"` for Persian and `dir="ltr"` for English). `text-align: right` alone is not an RTL implementation.

### Required behaviors

- Persian headings, section labels, indicator names, descriptions, status badges, count labels, tooltips, and metadata align to the right and flow from right to left.
- Icon-and-label groups follow logical RTL order. For example, the icon should sit on the intended leading side of its label in Persian; it must not remain stranded on a left-side LTR layout because of fixed margins or DOM ordering.
- Use CSS logical properties (`margin-inline-start/end`, `padding-inline-start/end`, `border-inline-start`, `inset-inline-start/end`) in directional components instead of hard-coded left/right rules.
- Mirror only directional navigation symbols whose meaning is reading-direction dependent. Do not mirror the world/globe, national flags, warning marks, financial charts, house/bank, currency, or other non-directional icons.
- Keep desktop region card positions stable (Australia left, Global right). Do not indiscriminately reverse the entire two-card grid when locale changes. Only inner content and controls follow the locale.
- For percentages, dates, currencies, and embedded Latin text, use the existing locale-aware formatters and appropriate bidi isolation (`dir="auto"`, `<bdi>`, or the framework equivalent) where needed. Do not reverse number strings manually.
- Maintain correct tab order, arrow-key behavior, focus order, and tooltip placement in both directions.
- The Global-first mobile carousel is a specific product priority; it must start on Global even though desktop visual placement remains Global on the right.
- Test long Persian copy and mixed-script labels; no punctuation/value pairing may invert or detach from its label.

## 10. Mobile: Global-first swipe carousel

This requirement overrides generic “stack both cards vertically” responsive patterns.

- At the mobile breakpoint (below approximately 768 px), display a single card at a time in a horizontal swipeable carousel/track.
- The first active card is **Global**. The second card is **Australia**. The user swipes horizontally to move from Global to Australia.
- Use native horizontal overflow and CSS scroll snap or the project's existing carousel component when possible. Avoid adding a new dependency for a simple two-card carousel.
- Show a quiet, localized cue such as “Swipe to view Australia” in Persian, or equivalent accessible text; include visible pagination dots or a two-item position indicator.
- Provide accessible previous/next controls as a fallback for users who do not use touch gestures, and ensure the controls’ order/arrows are correct for RTL. Buttons must actually change the active panel.
- Do not expose both panels as a long vertically stacked list on mobile. It is acceptable for the user to horizontally swipe the one-card viewport, while each individual card can scroll vertically if its content extends beyond the screen.
- Keep the entire page from having accidental horizontal overflow; horizontal scrolling is limited to the carousel viewport and must be intentional.
- Each card should use full available viewport width minus 16 px outer gutters; avoid showing only a narrow sliver of the next card unless it is a deliberate, usable swipe cue.
- The carousel must be keyboard-operable, have meaningful labels (e.g., “Global card, 1 of 2” / “Australia card, 2 of 2”), and announce changes accessibly without overwhelming screen-reader users.
- Preserve each panel's expanded/collapsed state appropriately when swiping; do not reset the user’s place unless that is current established behavior.
- Ensure focus does not move into an off-screen card without a way to bring that card into view.

## 11. Breakpoints and spacing

Use existing project breakpoints if they are already established; otherwise start from these targets:

| Range | Layout |
|---|---|
| `>= 1200 px` | Two equal desktop cards; 24 px gap; page gutters 28–40 px |
| `1024–1199 px` | Two cards if each remains readable; reduce outer gutter to 20–24 px |
| `768–1023 px` | Prefer a single-card layout or stack only if necessary for tablet usability; no compressed two-column card contents |
| `< 768 px` | One horizontally swipeable panel at a time; Global first, swipe to Australia |

Use a 4 px spacing rhythm where practical: 4, 8, 12, 16, 20, 24, 32, 40 px. Keep the page header and cards aligned to the same container. Avoid fixed heights that clip content in either locale.

## 12. Controls and interaction states

Inspect each real control before restyling it.

- Preserve existing tools menu, language control, data download/export action, tooltip/help controls, and related navigation behavior.
- Do not delete a working action just because it is absent from a mockup. Do not invent a route or action because a screenshot depicts an illustrative control.
- Menus, disclosure controls, tooltip triggers, carousel navigation, and download controls must work with keyboard and touch.
- Tooltips must work with hover, focus, and tap where appropriate; they cannot contain the only copy of essential information.
- Show focus rings clearly against both white and tinted surfaces.
- Preserve actual loading, data-unavailable, error, and insufficient-data states; never substitute demo values or a false stable status during loading.
- Avoid animation that overstates financial severity. Respect `prefers-reduced-motion` if transitions are used.

## 13. Accessibility

Target WCAG 2.2 AA practices for applicable UI.

- Normal text contrast at least 4.5:1; large text at least 3:1; meaningful non-text controls/focus indicators target at least 3:1.
- Status uses readable text plus an icon or shape/color treatment; never color alone.
- Every interactive control is keyboard-operable and has a visible focus indicator.
- Use semantic headings in logical hierarchy. Icon-only controls require meaningful accessible names; purely decorative artwork/icons are hidden from assistive technology.
- Disclosure buttons expose their expanded/collapsed state. Mobile carousel controls expose their purpose and active panel.
- Prefer touch targets near 44 × 44 px where practical.
- Do not rely exclusively on hover; tooltips and essential information should be available through focus/tap.
- Keep screen-reader reading order sensible and aligned with visual order within the selected locale.

## 14. Engineering workflow and protection of existing functionality

1. Read repository-level instructions, package scripts, and existing page/component code before editing.
2. Locate actual data models, indicator sort/rank order, status mapping, translations, CSS variables, existing assets, and export behavior.
3. Run the existing app and capture a baseline where possible.
4. Make page-scoped changes using the current framework, component patterns, routing, localization, state management, and styling conventions.
5. Keep styling/status mapping separate from financial calculations. Do not alter API contracts or severity thresholds.
6. Prefer existing icon/font dependencies and components. Do not add dependencies without a concrete need.
7. Verify desktop, tablet, mobile, Persian RTL, and English LTR. Inspect text wrapping, overlay contrast, carousel behavior, data expansion, tooltips, header actions, and error/unavailable states.
8. Run relevant lint, tests, type check, and production build; report anything that could not be run.

## 15. Acceptance checklist

### Visual and content

- [ ] The result follows `references/01-approved-dashboard-reference.png` in overall hierarchy and restraint without copying the screenshot as a page image.
- [ ] The page feels editorial and financial: navy typography, off-white background, subtle borders, small status cues, and clear data hierarchy.
- [ ] Australia header artwork is subtle and does not reduce text contrast; the Global map texture, if used, is even more understated.
- [ ] Desktop shows Australia left and Global right; both panels retain equivalent visual weight.
- [ ] The three highest-priority existing flagged indicators are visible by default for each region.
- [ ] Expand/show-more reveals the remaining real indicators only when applicable.
- [ ] Secondary category groups and explanation panels remain quiet, legible, and data-accurate.
- [ ] No financial data, logic, thresholds, severity labels, classifications, or supported behavior was changed by the redesign.

### RTL/LTR

- [ ] Persian headings, icons, badges, labels, row contents, and expansion controls follow true RTL flow.
- [ ] English renders LTR cleanly with correct alignment and no accidental mirrored text.
- [ ] Flags, globe, warnings, charts, and non-directional icons are not mirrored incorrectly.
- [ ] Numbers, percentages, dates, and mixed English/Persian content render in the right order.
- [ ] Desktop card order remains stable across locales.

### Mobile and accessibility

- [ ] Mobile opens on Global and horizontal swipe/controls navigate to Australia.
- [ ] A visible, localized swipe affordance and accessible previous/next or equivalent controls are present.
- [ ] The two cards are not stacked into a long vertical sequence at the mobile breakpoint.
- [ ] No accidental page-level horizontal overflow occurs at 320, 375, or 430 px; intended scrolling is confined to the carousel.
- [ ] Keyboard, screen-reader labels, visible focus, tooltip access, and expand/collapse state are verified.
- [ ] Color contrast and non-color severity cues meet accessibility targets.

### Verification

- [ ] Relevant lint/test/type-check/build commands were run where available.
- [ ] Both locales and the key responsive widths were checked.
- [ ] Existing tools, downloads, data behavior, and categories still work.
- [ ] The final report accurately lists modified files, checks run, and unresolved items.

## 16. Final design principle

Make the page feel like a trustworthy editorial financial publication: disciplined navy typography, useful whitespace, crisp financial values, subtle country/global imagery, and severity colors used only where they carry meaning. On desktop, show Australia and Global side by side; on mobile, show Global first and let the user swipe to Australia. Implement the real page—not a static reproduction—and preserve existing financial logic and product behavior.
