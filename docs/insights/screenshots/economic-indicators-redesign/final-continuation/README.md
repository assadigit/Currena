# Final-state re-verification (continuation session, 2026-10-19)

Re-verified the Economic Indicators redesign on the **current** live deployment
(entry `index-ChVkduNn.js`, Insights chunk `Insights-BwhME956.js` — the post-`d93bd0ba`
build that also carries the PWA deterministic-update fix `40a66f5` and the world
stock markets public-mode restore `130e8a8`). Purpose: confirm the redesign
(owner-trimmed scope: header/hero grayscale + restructured hero, original colored
design below) survives intact in the newer build other sessions shipped on top of it.

## Evidence

| File | What it shows |
| --- | --- |
| `en-desktop-1280-final-state.png` | Full-page EN light @1280: hero (Australia left / Global right, grayscale hero icons), colored cards below |
| `en-desktop-1280-dark.png` | Dark theme: computed `filter: grayscale(1)` active on `.insights-hero-grid .currena-icon` |
| `fa-mobile-360-dark-rtl.png` | FA @360 dark: RTL, Persian digits, no horizontal overflow |

## Checks performed (agent-browser, live prod)

- Hero cards: `[data-region-card]` = global + australia; desktop layout
  side-by-side **australia-left / global-right**; stacked on narrow viewport.
- Hero icon filter computed as `grayscale(1)` in **both** themes; the only
  page-scoped grayscale rule in live CSS is
  `.insights-hero-grid .currena-icon{filter:grayscale(100%)}` (plus stock Tailwind
  utility definitions) — colored artwork below the hero confirmed.
- Tile rule in hero cards: 3 initial tiles + `+3 more` (`aria-expanded=false`);
  below-hero sections keep the original pre-redesign behavior ("Show fewer"
  on bullet-less regions) exactly per the owner's scope trim (de897d4).
- FA round-trip: `+۳ مورد دیگر` → click → `نمایش کمتر` (`aria-expanded=true`) →
  click → back to `+۳ مورد دیگر` (`aria-expanded=false`).
- RTL: `dir=rtl`, Persian title `شاخص‌های اقتصادی`, Persian digits, 92 `[dir=ltr]`
  bidi islands.
- Zero horizontal overflow at 1280 and 360.
- Keyboard: `/` focuses the search input; Escape returns focus to the invoking
  control.
- Zero console errors and zero console messages across the whole session
  (theme toggle, language toggle, viewport changes, tile interactions).
