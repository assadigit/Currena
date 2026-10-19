# 2026-10-25b — the asset-cards polish round (owner task)

The owner's polish task: make the four financial asset cards feel like a
premium editorial financial publication — visual quality, information
hierarchy, Persian typography, numerical presentation, usability — while
strictly preserving the card's scope and every working calculation.

## What changed (all inside the prices cards + their supporting copy)

1. **The asset header** — icon vertically centred against a title block:
   the plain title («قیمت طلا» / "Gold price", 18px semibold) over a
   measurement-basis subtitle («هر اونس تروی» / "per troy ounce", 13px
   secondary). The unit left the title ("Gold price (ounce)" retired).
   Units verified against the served instruments (task §6/§10).
2. **The one-line price** — the number (28px bold tabular) and its
   currency on ONE baseline («۴٬۱۶۶ دلار» / "US$4,166") via the new
   `priceValueParts` display helper — never separate lines, each part an
   isolated `<bdi>` so direction changes cannot split or reorder them.
3. **The expanded panel reorganised into six semantic sections** (task
   §9): تغییرات قیمت (one «X گذشته» label family) → محدودهٔ قیمت در ۵۲
   هفتهٔ گذشته («۳٬۹۶۱ تا ۵٬۳۱۸ دلار») → سوابق تاریخی قیمت (the 10-year
   high + date + basis) → جایگاه قیمت نسبت به شاخص‌های مرجع (level,
   200-day gap, distance from the 10-year high, companion ratios) →
   منبع داده و زمان به‌روزرسانی (attribution + observation vs fetch
   time + coverage notes) → دربارهٔ این اعداد.
4. **Data corrections** (verified against the implementation, task §10):
   - The futures note was UNCONDITIONAL on gold/silver/oil while the
     served EOD snapshot is gold-api **XAU/XAG spot** — now shown ONLY
     when the served attribution actually is the futures quote (the
     serve-time live merge rewrites `sourceName` to the Yahoo GC=F/SI=F/
     BZ=F attribution when a fresher quote wins).
   - Brent's EOD attribution (EIA spot + BZ=F gap-fill) gets its own
     accurate blend note.
   - «بیشترین مقدار تاریخی» ("Historical high") claimed all-time
     coverage; `computePeaks` reads the 10-YEAR window — relabelled
     «بیشترین قیمت ۱۰ سال اخیر» / "10-year high".
   - fa's Bitcoin ratio pair rendered as two bullets, the second a
     sentence fragment («یا حدود X اونس نقره است») — now one sentence.
5. **Persian typography** — section headings drop the latin-only
   uppercase/letter-spacing treatments in fa (tracking visually
   separates joined Persian script); the 52-week range renders in the
   locale's own direction with «تا» BETWEEN the endpoints.

## Verification (production build + real production API, harness :4173)

- Layout probes: title/subtitle/icon vertical centring (mobile 375:
  icon centre == title-block centre); price + currency one line in en
  AND fa (same row, baseline-aligned, 4px gap; BTC «۸۱٬۵۸۳ دلار» fits);
  no horizontal overflow at 375 or 320; tablet 768 = 2 columns; the
  expanded panel stays INSIDE its tile (the 2026-10-24d fix intact,
  Silver 10px below the grown Gold tile on mobile); prices↔markets air
  still 40px.
- Bidi probes (caret-range): the fa 52-week range reads exactly
  «۳٬۹۶۱ تا ۵٬۳۱۸ دلار» — rightmost «۳٬۹۶۱», «تا» between the endpoints,
  «دلار» at the end of the reading order; the separators are U+066C
  (۲ Persian ٬, 0 ASCII commas).
- Instrument notes against the live API (EOD snapshot served):
  gold/silver/btc (XAU/XAG/BTC spot) carry NO futures note; brent
  (EIA+BZ=F) carries the blend note; every card shows the fetch time
  distinct from the observation date.
- Keyboard: the disclosure toggles with Enter, focus retained on the
  trigger; the card-body click-through still opens the details panel;
  Escape closes it. Zero console errors.
- VLM reviews: EN collapsed PASS (hierarchy/one-line price/centring);
  EN expanded PASS on all six sections (an initial "missing Past 7
  days" was a full-page misread — the exact crop reads PRICE CHANGES →
  Past 7/30/90 days, 6 months, 1 year → 52-WEEK → RECORDS); fa expanded
  PASS (joined script, RTL, Persian digits) — its one "FAIL" claimed
  ASCII commas in the range, disproven by the codepoint probe above.
- Gates: typecheck 6/6; lint 0 errors/15 accepted advisories; 1,520
  tests green (web 548, +14 new: prices-cards.test.tsx 11 +
  price-value-parts.test.ts 3); copy:audit clean (round-51, 2,170
  entries — 18 new + 5 relabelled strings triaged against
  docs/QA/quirks-2026-10-25b-asset-cards-polish.md); build OK; budgets
  held after the documented conscious bump (Insights 626/150 → 630/151,
  measured 629.04/150.69 — bilingual copy + panel structure; entry
  untouched at 295.29/88.81).

## Files

| File | Role |
|---|---|
| `apps/web/src/components/insights/PricesBoard.tsx` | the card restructure (header, price line, sections A–F, conditional notes) |
| `apps/web/src/components/insights/config/display.ts` + `config/index.ts` | the new pure `priceValueParts` helper (+ export) |
| `apps/web/src/i18n/insights-copy-en.ts` / `-fa.ts` | 18 new keys + 5 relabelled (titles, units, section headings, notes) |
| `apps/web/src/components/insights/prices-cards.test.tsx` (NEW) | 11 component tests (header, one-line price, sections, bidi range, conditional notes, disclosure) |
| `apps/web/src/components/insights/price-value-parts.test.ts` (NEW) | 3 unit tests for the split helper |
| `scripts/check-bundle-budget.mjs` | the documented Insights budget bump |
| `docs/QA/quirks-2026-10-25b-asset-cards-polish.md` (NEW) | the copy review basis (manifest round-51) |
| `docs/localization/persian-copy-manifest.json` | round-51 triage (23 strings) |

## Evidence

| File | State |
|---|---|
| `before/BEFORE-live-desktop-1280-en-collapsed.png` | LIVE worker cc6f28e6 — "Gold price (ounce)" with the unit in the title, price digits with «دلار»/US$ on its own line below |
| `before/BEFORE-live-desktop-1280-en-expanded.png` | LIVE — the old three-block panel (Changes / range+record merged / source) |
| `before/BEFORE-live-desktop-1280-fa-collapsed.png` | LIVE fa — «قیمت طلا (اونس)» |
| `before/BEFORE-live-desktop-1280-fa-expanded.png` | LIVE fa — the old panel with the false futures note and «بیشترین مقدار تاریخی» |
| `after/AFTER-desktop-1280-en-collapsed.png` | the polished cards (title+subtitle, one-line price) |
| `after/AFTER-desktop-1280-en-expanded.png` | the six semantic sections |
| `after/AFTER-desktop-1280-fa-collapsed.png` | fa titles/subtitles, «۴٬۱۶۶ دلار» one line |
| `after/AFTER-desktop-1280-fa-expanded.png` | fa sections, «۳٬۹۶۱ تا ۵٬۳۱۸ دلار», «بیشترین قیمت ۱۰ سال اخیر» |
| `after/AFTER-mobile-375-fa-expanded.png` | mobile — panel inside the tile, no overflow |
| `after/AFTER-tablet-768-en-dark-expanded.png` | tablet 2-col + dark mode |


## Live verification (post-deploy, worker ead002b6)

Deployed as worker `ead002b6-3c9e-4e9a-aae9-4535bb462f9f` (pushed as
`db31745`, rebased over the balance-v5 round). Both
`currena-api.sedanama-ir.workers.dev` and `currena.ir` serve the
deploy's `Insights-BMyE-MXL.js`.

| File | State |
|---|---|
| `LIVE-desktop-1280-fa-expanded.png` | LIVE fa — the six sections, «۳٬۹۶۱ تا ۵٬۳۱۸ دلار», «بیشترین قیمت ۱۰ سال اخیر», fetch-time line |
| `LIVE-desktop-1280-en-collapsed.png` | LIVE en — the polished cards |
| `LIVE-mobile-375-en-collapsed.png` | LIVE mobile — "Gold price"/"per troy ounce", "US$ 4,166" one line, no overflow |

Live DOM probes: title/subtitle/one-line price in both locales; the
fa range reads exactly «۳٬۹۶۱ تا ۵٬۳۱۸ دلار»; gold's XAU spot
attribution carries NO futures note; scrollWidth == viewport at 375;
zero console errors.
