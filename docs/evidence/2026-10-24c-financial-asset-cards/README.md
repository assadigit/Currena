# 2026-10-24c — financial-asset-cards spec pack (session 2026-10-22, rebased onto round-46 main)

Browser evidence for the prices-board redesign per the owner's
`financial-asset-cards-spec-pack.zip` (8 Markdown specs, repo root).
Captured against a production build of the rebased commit served locally
with the REAL production API (`currena-api.sedanama-ir.workers.dev`)
proxied through — fresh browser profile, service-worker precache purged
first (the repo's own PWA procedure; the SW otherwise serves the previous
deploy's chunk).

## Shots

- `desktop-en-cards.png` / `desktop-en-top.png` — 1440px EN light: the four
  cards in spec order (Gold → Silver → Oil → Bitcoin), identity → dominant
  price + secondary unit line → per-card as-of → the 7-day trend block
  (label + net % + day-spaced sparkline + trend word) → labelled daily
  change → hedged briefing.
- `desktop-en-expanded.png` / `desktop-en-expanded2.png` — the
  «جزئیات بیشتر» / "More details" disclosure expanded: 7d/30d/90d/6m/1y
  changes, 52-week range, the clarified 10-year price LEVEL, record high
  with date + basis, from-record, 200-day gap, futures note, source.
- `desktop-en-panel.png` — the card-body click-through to the details panel
  (preserved behavior).
- `desktop-fa-cards.png` / `desktop-fa-cards2.png` / `desktop-fa-full.png` —
  fa RTL: Persian digits, Jalali dates, «جزئیات بیشتر», full detail rows.
- `desktop-fa-dark.png` — dark theme.
- `desktop-fa-expanded.png` — fa disclosure expanded.
- `tablet-fa-768.png` — 2-column tablet grid.
- `mobile-fa-375.png` / `mobile-fa-320.png` — stacked mobile, no horizontal
  overflow at either width.
- `vlm-result.json` — the VLM visual-QA verdict on the desktop EN capture.

Verification notes (full detail in `docs/QA/quirks-2026-10-22-financial-asset-cards.md`):
keyboard disclosure toggle (Enter, aria-expanded/aria-controls, focus
retained), per-card independent expansion, zero console errors,
scrollWidth === viewport at every tested width.
