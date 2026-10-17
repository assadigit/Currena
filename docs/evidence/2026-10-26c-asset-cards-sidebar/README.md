# 2026-10-26c — the asset cards' details moved to the side panel (owner directive)

The owner's directive: "The more details must show up in side bar." The
«جزئیات بیشتر» button no longer expands the card inline — it opens the
F5 DETAILS SIDE PANEL (desktop: inline-end sheet / RTL: start sheet /
phones: bottom sheet), with the five sections (تغییرات قیمت … منبع داده
و زمان به‌روزرسانی) rendered inside it, directly under the card facts.
No section content changed — the same reviewed copy, the same data paths.

## Verification (:4173 harness — production build + real API)

| Check | Result |
| --- | --- |
| EN desktop 1280 — button semantics | «More details» × 4, `aria-haspopup="dialog"`, NO `aria-expanded` (not a disclosure anymore), zero `h4` sections inside the cards |
| EN panel open | right sheet 440px flush inline-end; heading "Gold price" (the card's verified title — NOT the registry's legacy "Gold price (ounce)"); sections in order: Price changes / Price range over the past 52 weeks / Historical price records / Price vs reference levels / Data source & freshness, then the panel's own generic sections; focus trapped inside; body scroll locked |
| Close + focus return | Escape closes the panel, focus RETURNS to the «More details» trigger, body unlocked; scrim click closes too |
| fa RTL panel | dir=rtl, heading «قیمت طلا», the five Persian sections, sheet flush LEFT (start side) |
| Bidi caret probes (fa range) | caretRangeFromPoint on «۳٬۹۶۱ تا ۵٬۳۱۸ دلار»: right edge → «۶۱» (the end of ۳٬۹۶۱), center → « ۵» (the تا/۵٬۳۱۸ boundary), left edge → «لا» (دلار) — the intended Persian reading order survived the move |
| Mobile 375 fa | bottom sheet (top ≈ 97px, full width 375), no horizontal overflow; the four tiles compact, zero inline sections |
| Console / page errors | zero |
| VLM visual check (en-desktop-panel.png) | side panel on the right, section headings present, page dimmed by the scrim, no overlapping/clipped text |

## Captures

- `en-desktop-panel.png` — EN 1280, Gold's side panel open (scrim over
  the page, sections under the facts).
- `fa-desktop-panel.png` — fa RTL 1280, «قیمت طلا» panel from the LEFT.
- `fa-mobile-375-panel.png` — mobile 375 fa bottom sheet.
- `sandbox-fa-sheet.png`, `sandbox-fa-mobile-375.png` — the :3000 demo
  mirror (shadcn Sheet) for the sandbox preview.

The sandbox mirror (src/components/asset-cards in the demo project)
mirrors the same behavior with a Sheet side panel (side flips with the
locale; Escape + focus return verified; no inline expansion).
