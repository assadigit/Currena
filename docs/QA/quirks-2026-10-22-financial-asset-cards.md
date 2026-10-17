# QA record — the financial-asset-cards spec pack applied to the prices board (2026-10-22)

## The directive

The owner supplied the `financial-asset-cards-spec-pack.zip` (8 Markdown
specs, repo root). Scope: the four asset cards ONLY (Gold, Silver, Oil,
Bitcoin) plus strictly necessary supporting code — no page-level layout,
heading, navigation, provider, scoring or routing changes. This round
implements the pack on top of the 2026-10-17b owner-sketch anatomy and
supersedes that card layout while PRESERVING every statistic it
introduced (nothing is deleted; secondary stats move behind the
disclosure).

## How the spec maps to the shipped card

| Spec | Shipped as |
|---|---|
| 02 §2 hierarchy (identity → price → freshness → 7-day trend → daily change → briefing → disclosure) | The tile is re-anatomised in exactly that order. The body (rows 1–6) stays the whole-surface click-through to the details panel; the disclosure is a separate sibling button so no control nests inside another. |
| 02 §2/§4 price dominant, unit secondary | 26px bold tabular price; the unit rides in its own small caption-size line under the digits (the established fa-safe convention — every tile's price block shares one height, grouping is preserved in RTL and LTR). |
| 02 §6 / 04 — real-data 7-day sparkline, primary movement story | `PriceSparkline.tsx` (new, sibling of the shared Sparkline — other consumers untouched): day-based x positions (honest calendar gaps), neutral ink, ≥2.5% amplitude honesty pad, LTR in both locales, dashed <2-point state. Data: `price-trend.ts` `window7d()` over the same stored history endpoint the details panel charts fetch. |
| 04 §3 window semantics | Seven CALENDAR days ending at the latest stored observation; reference = last point at-or-before (latest − 7d) within the 3-day tolerance — the SAME convention as the API's `change7d`, so the chart and the percentage share boundaries. Documented in code + `aboutNumbersBody`. |
| 04 §5 documented trend classification | `classifyTrend()`: <4 points ⇒ insufficient; \|net\| < 1% ⇒ range (calm) or mixed (path ≥ 3%); \|net\| ≥ 1% ⇒ up/down ONLY when the net ≥ 50% of the traveled range. Thresholds are constants with rationale comments; 16 unit tests pin them. |
| 03 §2/§3 hedged bilingual briefings | `briefingText()` — deterministic templates from the dictionaries; observed movement + hedge; Bitcoin volatility-aware ("fluctuated" only on a genuinely mixed window); oil gets the drivers-evidence caveat; stale qualifies the summary; no causes/forecasts/probabilities/advice. |
| 03 §7 / spec-pack README — «بالا» audit | TRACED: `pricePositionHigh` = `positionBand(percentile10y)` — the price's percentile inside its own 10-YEAR history (level, not trend). Decision: the METRIC is defensible and stays, the BARE WORD left the card face; it returns in the disclosure as `priceLevelLabel`/`priceLevelHigh` («سطح قیمت نسبت به دامنهٔ ۱۰ ساله: بالا — ۲۰ درصد بالایی ده سال اخیر») with `priceLevelNote` stating it is a level, not a direction. |
| 02 §8 / spec README — expandable details | «جزئیات بیشتر» / "More details" disclosure per card: aria-expanded + aria-controls, keyboard + touch, focus stays on the trigger, chevron-only flip (motion-safe). Contains: 7d/30d/90d/6m/1y changes, 52-week range, the clarified level, the record high with date + basis, from-record, 200-day gap, futures note, gold A$ companion, Bitcoin ratios, source + as-of, and the about-these-numbers method note. |
| 02 §10 default order Gold → Silver → Oil → Bitcoin | `PRICE_ROWS` re-ordered (was brent-first). No user-configurable ordering exists (verified — no persistence), so the spec default applies; the CSV export rides the same list and changes with it (consistent). |
| 05 §3 failure states | Unavailable price ⇒ quiet system message (priceUnavailableCard), no stats, no trend — never red/alarm. Stale ⇒ timestamp kept + «ممکن است داده‌ها با تأخیر به‌روز شوند.» in freshness AND summary; trend still renders (window describes stored data) but is qualified. History fetch failure ⇒ trendUnavailable box, "—" rows — never a fabricated flat line. Incomplete window ⇒ trendIncomplete note. Per-card independence: one failed asset never breaks the grid. |
| 05 §1 accessibility | Direction = sign + arrow + tone (never colour alone); sparkline aria-label (asset + window + signed change); disclosure state exposed; visible focus ring (insights-focusable); 44px disclosure target; static SVG (reduced-motion safe); chevron transition is motion-safe only. |

## New copy keys (41 fa strings, round-49)

All wording follows spec 03's tables VERBATIM (the pack supplies exact
Persian and English sentences); the four asset subjects reuse the
dictionary's established names (طلا، نقره، نفت، بیت‌کوین).

Trend states: `past7days`, `trendUp`, `trendDown`, `trendRange`,
`trendMixed`, `trendInsufficient`, `trendUnavailable`, `trendIncomplete`,
`sparklineAria`.
Daily + freshness + failure: `dailyChangeLabel`, `dailyChangeBasis`,
`updatedUnknown`, `dataDelayed`, `priceUnavailableCard`.
Briefing templates: `sumUnavailable`, `sumUp`, `sumDown`, `sumRange`,
`sumMixed`, `sumHedge`, `sumBtcHedge`, `sumBtcMixed`, `sumOilDrivers`.
Disclosure + details: `moreDetails`, `lessDetails`, `changesLabel`,
`change30dLabel`, `change90dLabel`, `priceLevelLabel`, `priceLevelHigh`,
`priceLevelTypical`, `priceLevelLow`, `priceLevelNote`, `statRecordHigh`,
`priceSourceLabel`, `aboutNumbersLabel`, `aboutNumbersBody`.
Subjects: `priceSubjects.gold-usd`, `priceSubjects.silver-usd`,
`priceSubjects.brent`, `priceSubjects.btc-usd`.

fa renderings (spec-03 tables; reviewed against the house style — no em
dashes, ZWNJ hygiene, {placeholders} intact):

| Key | FA |
|---|---|
| past7days | هفت روز گذشته |
| trendUp | روند اخیر صعودی بوده است |
| trendDown | روند اخیر نزولی بوده است |
| trendRange | حرکت اخیر عمدتاً در یک محدوده بوده است |
| trendMixed | جهت مشخصی دیده نمی‌شود |
| trendInsufficient | دادهٔ کافی برای ارزیابی روند وجود ندارد |
| trendUnavailable | روند هفت روز گذشته فعلاً قابل ارزیابی نیست |
| trendIncomplete | داده‌های این بازه کامل نیستند؛ نمودار ممکن است تصویر کاملی ارائه نکند. |
| sparklineAria | روند قیمت {asset} در هفت روز گذشته: {change} |
| dailyChangeLabel | تغییر روزانه |
| dailyChangeBasis | نسبت به آخرین قیمت ثبت‌شدهٔ قبلی |
| updatedUnknown | زمان به‌روزرسانی مشخص نیست. |
| dataDelayed | ممکن است داده‌ها با تأخیر به‌روز شوند. |
| priceUnavailableCard | قیمت فعلاً در دسترس نیست. |
| sumUnavailable | برای ارائهٔ خلاصهٔ معتبر، دادهٔ کافی در دسترس نیست. |
| sumUp | قیمت {asset} در هفت روز گذشته افزایش یافته است. |
| sumDown | قیمت {asset} در هفت روز گذشته کاهش یافته است. |
| sumRange | قیمت {asset} در هفت روز گذشته عمدتاً در محدوده‌ای محدود مانده است؛ داده‌های فعلی جهت روشنی نشان نمی‌دهند. |
| sumMixed | نوسان قیمت {asset} در این بازه یکدست نبوده است؛ بنابراین، داده‌های فعلی جهت روشنی را نشان نمی‌دهند. |
| sumHedge | این توصیف فقط همین بازه را پوشش می‌دهد و به‌تنهایی جهت حرکت آینده را مشخص نمی‌کند. |
| sumBtcHedge | تغییرات این بازه لزوماً ادامه‌دار نیست و می‌تواند در کوتاه‌مدت با نوسان بیشتری همراه شود. |
| sumBtcMixed | قیمت {asset} در هفت روز گذشته نوسان داشته است. |
| sumOilDrivers | برای توضیح عوامل مؤثر بر این تغییر، باید داده‌های مرتبط با عرضه، تقاضا و شرایط بازار نیز بررسی شوند. |
| moreDetails | جزئیات بیشتر |
| lessDetails | نمایش کمتر |
| changesLabel | تغییرها |
| change30dLabel | ۳۰ روز |
| change90dLabel | ۹۰ روز |
| priceLevelLabel | سطح قیمت نسبت به دامنهٔ ۱۰ ساله |
| priceLevelHigh | بالا — ۲۰ درصد بالایی ده سال اخیر |
| priceLevelTypical | در محدودهٔ معمول خود |
| priceLevelLow | پایین — ۲۰ درصد پایینی ده سال اخیر |
| priceLevelNote | این توصیف دربارهٔ سطح قیمت نسبت به تاریخ ده‌سالهٔ خودِ دارایی است، نه جهت حرکت آن. |
| statRecordHigh | بیشترین مقدار تاریخی |
| priceSourceLabel | منبع داده |
| aboutNumbersLabel | دربارهٔ این اعداد |
| aboutNumbersBody | نمودار هفت‌روزه و درصد کنار آن از یک پنجرهٔ واحد استفاده می‌کنند: هفت روز تقویمیِ آخرین مشاهدات ثبت‌شده، با لنگر در آخرین مشاهدهٔ حداکثر سه روز پیش از مرز هفت روز. تغییر روزانه، آخرین مشاهده را با مشاهدهٔ ثبت‌شدهٔ قبلی مقایسه می‌کند. مقدار غایب هرگز ساخته یا درون‌یابی نمی‌شود. |
| priceSubjects.* | طلا · نقره · نفت · بیت‌کوین |

## Retired from the card face (keys stay in the dictionaries)

`descriptionLabel` and the price-position verdict word
(`pricePositionLow/Typical/High` — the bare «بالا») leave the DEFAULT card
face; the consequence line (`consequenceLine`) leaves the price tiles
(it stays on every other indicator card — CompactRow). The interpretive
content remains reachable: the clarified level row + note in the
disclosure, and the full "what it means" sections in the details panel
click-through. The previous four-window percentage rows
(daily/weekly/monthly/quarterly on the face) move behind the disclosure
with the daily change kept on the face as the spec's supporting measure.

## Files

- `apps/web/src/components/insights/price-trend.ts` — NEW: the window,
  the documented classification, the briefing rules (pure, tested).
- `apps/web/src/components/insights/price-trend.test.ts` — NEW: 16 tests.
- `apps/web/src/components/insights/PriceSparkline.tsx` — NEW: the
  day-spaced honest sparkline.
- `apps/web/src/components/insights/PricesBoard.tsx` — re-anatomised.
- `apps/web/src/components/insights/config/sections.ts` — PRICE_ROWS
  order (spec §10).
- `apps/web/src/i18n/insights-copy-en.ts` / `-fa.ts` — the 41 new keys.
- `docs/localization/persian-copy-manifest.json` — round-49 triage
  (this document is the reference).

No provider, scoring, API, routing or page-level change. The shared
`Sparkline.tsx` (LiveRates, compact rows) is untouched.

## Rebase addendum (2026-10-24c)

Rebased onto main @ round 46 (`0e411e6`) before push/deploy. Two
manifest additions beyond the original 41 strings:

- `hardcoded.apps.web.src.components.insights.PricesBoard.a489ae36` —
  the ma200-gap `{pct}` placeholder's locale percent glyph («٪» for
  fa-IR, `%` for en-US). `kind: "technical"`, same reviewed glyph (sha
  `a489ae36…`) as the existing technical entries in
  `world-currencies/QuietArea` and `lib/fx-presentation/format`. The
  round-46 audit scanner now fingerprints single-glyph literals in the
  insights components, so the glyph this round introduced is triaged the
  same way.
- No wording changes: all 41 round-49 strings ride unchanged; the
  concurrent sessions' markets-view keys, manifest entries and budget
  bumps are preserved byte-for-byte beneath this round.

Gates re-verified on the rebased tree: copy:audit clean (2,147);
1,505 tests; typecheck 6/6; lint 0 errors/15 advisories; budgets held
(entry 295.29/88.82; Insights lazy 624.65/149.59 vs 626/150).

## Addendum — 2026-10-24d: the «جزئیات بیشتر» white-space defect (owner-reported, post-deploy)

The owner reported that on the live deployment clicking «جزئیات بیشتر» /
"More details" produced "just a white space with no more extra detail",
and that the prices block and the markets section below it read as
collided. Diagnosis (reproduced on worker 7b939901):

- **The defect shipped with this round.** The card-body click-through
  button carried `h-full` (height:100%). The tile `article` is a
  stretched grid item: when the disclosure opened, the grid row grew to
  fit card+trigger+panel, the article stretched to the row, and the body
  button then resolved `h-full` against the FULL stretched article
  height — pushing the trigger and the expanded panel BELOW the tile's
  box. The panel kept its DOM/aria state (why the round's aria-based
  verification passed) but painted under later DOM siblings (the
  Silver/Brent tiles on mobile; the markets section on desktop),
  leaving ~690px of white space. Both LIVE evidence screenshots from
  this round show the defect; the expanded-state verification had
  relied on DOM/aria assertions where it should have probed pixels.
- **Fix**: the article becomes `flex h-full flex-col`; the body button
  drops `h-full` and keeps `grow` (it fills only the space the
  disclosure leaves it). Trigger + panel stay inside the tile; the tile
  grows naturally; equal tile heights preserved (grid stretch + grow).
- **Lesson recorded for verification procedure**: an expanded-state
  check must include an element-from-point (or equivalent paint) probe
  at the panel's own coordinates — aria-expanded + panel existence is
  NOT evidence of visible rendering under grid stretch.
- **Also**: the prices section gains `pb-3` (owner's spacing note) —
  40px of air to the markets block; the page-wide 28px rhythm untouched.

Gates: typecheck 6/6; lint clean; web 533 green; copy:audit clean (no
copy change); budgets held (entry 295.29/88.82; Insights 624.64/149.59
vs 626/150). Evidence:
`docs/evidence/2026-10-24d-disclosure-overflow-fix/`.
