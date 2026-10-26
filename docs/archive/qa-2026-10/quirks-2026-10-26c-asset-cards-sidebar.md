# QA — 2026-10-26c asset-cards sidebar: Persian copy review basis

The round: the owner's sidebar directive ("The more details must show up
in side bar") — the «جزئیات بیشتر» sections moved from the inline card
disclosure into the F5 details side panel, and the card no longer expands.
This document is the review basis for the round's Persian-copy changes
(the `persian-copy-manifest.json` round-52 entry references it).

Review method: the round introduces NO new user-facing Persian sentences.
Every section heading, value template and note renders verbatim from the
2026-10-25b round's reviewed strings (round-51,
`docs/QA/quirks-2026-10-25b-asset-cards-polish.md`) — only their RENDER
LOCATION changed (the details side panel instead of the inline
disclosure). The single manifest action this round:

| Id | Action | Basis |
|---|---|---|
| `ui.lessDetails` («نمایش کمتر») | REMOVED from the fa dictionary + the manifest | The disclosure's collapse label is gone with the disclosure — «جزئیات بیشتر» now opens the side panel, whose close affordance (× / Escape / scrim) is the panel's own; nothing ever reads «نمایش کمتر» again. Retired per the copy workflow's removal rule (delete the manifest entry in the same commit). |
| `hardcoded.…PriceDetails.a489ae36` (`٪`) | RE-HOMED technical entry | The U+066A Arabic percent glyph moved verbatim with the `{pct}`-placeholder formatting it terminates (ma200 / fromRecord templates) from `PricesBoard.tsx` to `PriceDetails.tsx`; a technical character, not copy — same classification as the 2026-10-24c round's original entry. |

## What deliberately did NOT change

- The five section headings (تغییرات قیمت / محدودهٔ قیمت در ۵۲ هفتهٔ
  گذشته / سوابق تاریخی قیمت / جایگاه قیمت نسبت به شاخص‌های مرجع /
  منبع داده و زمان به‌روزرسانی) — reviewed round-51 text, byte-identical.
- «جزئیات بیشتر» (`ui.moreDetails`) stays the button's label — it opens
  the same details it always promised, now in the side bar.
- The 52-week range rendering («۳٬۹۶۱ تا ۵٬۳۱۸ دلار» with «تا» between
  the endpoints, in the locale's own direction) — the same isolated-`<bdi>`
  construction, now inside the panel.
- The methodology note stays removed (2026-10-26b) — nothing about it
  returned with the move.
