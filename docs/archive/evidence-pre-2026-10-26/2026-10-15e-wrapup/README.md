# 2026-10-15e wrap-up evidence

Baseline post-deploy captures from the wrap-up redeploy
(currena-api `97e8c38a`, 2026-10-15T03:05Z) — agent-browser
(Chromium), zero console errors / zero page errors on both passes:

- `insights-en-desktop-top.png` — EN, 1440×900, Insights page top
  (hero + verdict meters). Verified in-DOM before capture: 51
  readings render; "highest since 2007" (B-19); "prices updated
  03:13 am UTC" (B-08); the A-08 run-status block ("Snapshot
  generated 15 Oct, 01:39 am (UTC+0)… Every card is within its
  maximum age."); the Prices tab's record peaks ("24.6% below its
  record US$138.21 on Apr 7, 2026 (highest daily close)" — B-01)
  and same-snapshot ratios (B-16); the Together connections line
  "2 active, 3 partly active, 1 pass-through pending" (B-04).
- `insights-fa-mobile-top.png` — fa (RTL), 375×812, Insights page
  top. Verified in-DOM: `dir=rtl`, Persian h1 (شاخص‌های اقتصادی),
  no horizontal overflow at 375 px.

These double as the BEFORE baseline for the next session's
minor-UI/UX-quirks + look-tweaks pass (see
docs/NEXT_SESSION_PROMPT.md §0).
