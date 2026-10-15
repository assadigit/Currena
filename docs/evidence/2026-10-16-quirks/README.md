# 2026-10-16 quirk-pass evidence

Owner's polish commission (docs/NEXT_SESSION_PROMPT.md §0). Full
inventory + verification record: `docs/QA/quirks-2026-10-16.md`.

## Baseline sweep (before fixes)

- `q01-converter-en-light-desktop.png` + `q-<route>-en-light-desktop.png`
  / `q-<route>-fa-dark-mobile.png` — the 10-route sweep grid
  (Converter, Live, History, Batch, Calc, Splitter, Settle, Receipt,
  About, Insights), agent-browser DOM-audited before capture.
- `seg-ins-en-light-desktop-*.png` + `seg-ins-fa-dark-mobile-*.png` —
  the Insights page in full-page segments (the only route taller than
  one capture), EN desktop + FA mobile.
- `zoom-*.png` — close-ups behind the quirk decisions: alerts dialog
  EN/FA (focus trap + RTL mirror), fa converter rate/typed lines, fa
  live chip, fa live FAB, fa mobile menu, fa RTL disclosure (Q5), fa
  insights date (Q13), alerts row.

## Post-fix captures (this session's close)

- `f4-header-44px-en-light-desktop.png` /
  `f4-header-44px-en-dark-desktop.png` — Q6 fixed: all four header
  utility icon buttons at 44×44 (DOM-verified), both themes.
- `f6-chips-40px-en-light-mobile.png` — Q8 fixed: converter amount
  quick-chips at 40px, copy chip 36px (DOM-verified), 375 px.

## Production re-verification (post-deploy, currena.ir @ 375 px)

DOM numbers on the deployed version `9d995f01`: header buttons
44×44 ×4; footer links 32px ×4; chips 40px; copy chip 36px; receipt
delete 36px; `scrollWidth == clientWidth == 375`; zero page errors;
zero console messages. Numbers, not just pixels — every fix was
re-measured, not eyeballed.
