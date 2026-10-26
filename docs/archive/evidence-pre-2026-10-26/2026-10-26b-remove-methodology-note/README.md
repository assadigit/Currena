# 2026-10-26b — «دربارهٔ این اعداد» methodology note removed from the asset cards (owner directive)

The owner quoted the sixth expanded-detail section verbatim and asked for
its removal. The heading «دربارهٔ این اعداد» ("About these numbers") and
its three-sentence methodology body (the shared seven-day window, the
daily-change basis, the no-fabrication rule) no longer render on the four
asset cards — the panel now carries the five data sections A–E. The
methodology itself is untouched (it stays implemented and documented in
price-trend.ts / price-stats.ts and the QA docs); only the on-card
disclosure is gone.

Shipped as `648f5aa`:

- `PricesBoard.tsx` — the section F `<PanelSection>` block + its
  header-comment map entry removed (the comment carries this round's tag
  where the section used to be described).
- Copy — `aboutNumbersLabel` / `aboutNumbersBody` deleted from BOTH
  dictionaries; the two `persian-copy-manifest.json` entries deleted in
  the same commit per the copy workflow's removal rule (2,170 → 2,168;
  `copy:audit` clean).
- `prices-cards.test.tsx` — the F assertion replaced with removal guards
  in BOTH locales (`queryByText` must stay null for both 'About these
  numbers' and «دربارهٔ این اعداد»); A–F labels updated to A–E.

Gates: typecheck 6/6; lint 0 errors/15 accepted advisories; 1,520 tests
green; `copy:audit` clean (2,168 entries); build OK; budgets held — the
removed copy shrinks the Insights chunk ~1.2 kB (628.67 kB / 150.59 kB gz
vs the 630/151 budget; entry chunk untouched at 295.29/88.81).

## Live verification (production, worker f9571a79)

Deployed from `648f5aa`; both currena-api.sedanama-ir.workers.dev and
currena.ir reference `index-CKqYpOMM.js` and serve `Insights-7kn32ZoI.js`
— the fresh build's exact filenames (the entry hash rotated only because
it embeds the lazy chunk's name; its own size is byte-identical).

| Check | Result |
| --- | --- |
| EN desktop 1280, expanded Gold | EXACTLY 5 h4 sections (Price changes / Price range over the past 52 weeks / Historical price records / Price vs reference levels / Data source & freshness); 'About these numbers' 0 occurrences |
| Paint probe (2026-10-24d lesson) | elementFromPoint at the LAST section's coordinates hits that H4 itself — the panel paints inside the tile, nothing overlaps it |
| fa desktop 1280 RTL, expanded Gold | EXACTLY the 5 Persian sections (تغییرات قیمت / محدودهٔ قیمت در ۵۲ هفتهٔ گذشته / سوابق تاریخی قیمت / جایگاه قیمت نسبت به شاخص‌های مرجع / منبع داده و زمان به‌روزرسانی); «دربارهٔ این اعداد» 0 occurrences |
| Neighbours | the balance card below (چشم‌انداز / برآیند عوامل…) intact — other components untouched |
| Mobile 375 fa | no horizontal overflow (scrollWidth 375), 5 sections intact |
| Console / page errors | zero |

## Captures

- `en-desktop-expanded.png` — production EN, Gold expanded, ends at
  "Data source & freshness".
- `fa-desktop-expanded.png` — production fa RTL, ends at «منبع داده و
  زمان به‌روزرسانی».
- `fa-mobile-375-expanded.png` — production mobile 375 fa.

(The sandbox :3000 mirror's own captures + VLM check live with the
session's mirror documentation.)
