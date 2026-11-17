> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S4/03 — The Persian Ecosystem Map: TGJU Deep-Dive + the News/Retail Landscape (M3)

**Session:** S4 of the Gold Page Elevation program · **Date:** 2026-11-17
(~05:00–11:00 UTC; TGJU feed snapshot 12:50 Tehran time) · **Branch:**
`docs/gold-page-elevation`

**Method:** every claim verified live this session by direct fetch (curl,
desktop UA) from the planning machine: the TGJU ajax feed
(`call1.tgju.org/ajax.json`, 1,052 symbols, 190,689 B, ~1.5 s), four
profile pages (mesghal / geram18 / gerami / sekee, 0.8–1.0 MB each), the
حباب (coin-premium) profile `coin_blubber`, the terms page
(`tgju.org/terms`), eghtesadonline's daily gold article, tejaratnews'
gold price page, and persianapi.com (TGJU's official API shop). This
deepens the S1/08 §7–§8 survey and resolves the s1/11 §4 and §6
verification items (the unit-convention puzzle and the
profile-history/backfill terms). All arithmetic below is computed from
the same-snapshot feed values and shown reproducibly.

---

## 1. TGJU deep-dive

### 1a. The live feed re-verified (snapshot 2026-11-17 12:50 Tehran / 09:20 UTC)

All 9 gold instruments + the USD leg present in `current` (Rial
denominated, `ts` per symbol; the feed prints **Rial**, Currena's
scraper divides by 10 to canonical toman — owner rule 2026-09-19,
already in code per s1/11 §2):

| Symbol | p (Rial) | = toman | Δ% | ts |
|---|---|---|---|---|
| `ons` (ounce, USD) | 3,861.57 | — | +0.09 | 12:50:15 |
| `price_dollar_rl` | 2,689,000 | 268,900 | +0.07 | 12:50:17 |
| `geram24` (24k, per gram) | 329,298,000 | 32,929,800 | +0.53 | 12:50:27 |
| `geram18` (18k, per gram) | 246,976,000 | 24,697,600 | +0.53 | 12:50:27 |
| `gold_mini_size` (used, per gram) | 243,682,730 | 24,368,273 | +0.53 | 12:50:27 |
| `mesghal` | 1,069,950,000 | 106,995,000 | +0.55 | 12:50:30 |
| `sekee` (Emami) | 2,524,350,000 | 252,435,000 | +0.75 | 12:50:30 |
| `sekeb` (Bahar Azadi) | 2,420,450,000 | 242,045,000 | +0.27 | 12:50:30 |
| `nim` (half) | 1,325,700,000 | 132,570,000 | +0.49 | 11:24:39 |
| `rob` (quarter) | 722,000,000 | 72,200,000 | +1.42 | 11:41:42 |
| `gerami` (1-gram coin) | 360,000,000 | 36,000,000 | 0 | 11:17:14 |

Internal consistency checks (same snapshot): `geram24/geram18` =
1.3333 exactly (24/18 karat ratio ✓, the s1/11 §4 observation
re-confirmed); `gold_mini_size` = 0.98665 × `geram18` (used gold ~1.3%
below new 18k — the standard used-gold discount).

### 1b. THE MESGHAL PUZZLE — RESOLVED (s1/11 §4 closed)

Live arithmetic on the snapshot:

```
mesghal / geram24 = 1,069,950,000 / 329,298,000 = 3.2492  (exactly)
mesghal / geram18 = 4.3322
```

**The resolution:** TGJU's mesghal quote is **NOT** the value of
4.6083 g of 24-karat gold (which would be 4.6083 × geram24 =
**1,517,490,801 Rial** — 41.8% above the actual quote). It is the
value of **≈3.249 g of pure-gold content** — i.e. the bazaar's
melted-gold (طلای آبشده) convention: **1 mesghal of آبشده = 4.60826 g
total × ≈0.705 fineness = 3.2488 g pure**, and the quote is
pure-content × per-gram-24k rate. Cross-check:
4.60826 × 0.705 × 329,298,000 = **1,069,889,202** vs the live quote
**1,069,950,000** — a 0.006% match (ratio 1.0001). The exact
3.2492-equivalents: mesghal = geram24 × 3.249.

**Corroborating internal evidence:** `gold_mini_size` (طلای دست
دوم — used/melted gold per gram) = 243,682,730 = 0.7400 × geram24 —
also consistent with a ~0.74 pure-fraction-of-quote family (18k melt
× 0.9864, or 705-fineness × 1.050); the two melted-gold family quotes
(0.7400 and 0.7051 fractions of the 24k rate) sit within the same
bazaar convention band for scrap/melted gold.

**Consequence for the bridge (recorded for s1/11 §3 table and the S6
spec):** the premium engine CAN include mesghal — with the convention
**documented on the card**: "مثقال آبشده: 4.6083 g total, ≈705
fineness, 3.249 g pure content — the bazaar's melted-gold unit," and
the premium computed against the 3.249 g pure content. What it must
never do is apply the 4.6083 g-of-24k reading (the 41.8% error the
naïve arithmetic produces). **The s1/11 §4 open item is closed: the
mesghal convention is the آبشده/705-fineness family, resolved by live
arithmetic this session** (TGJU's own profile page does not document
it — quote-only, as S1/08 §7 said — so the resolution's authority is
the arithmetic itself + the آبشده family's internal consistency; flag
for one cross-check against a bazaar reference at build time).

### 1c. The coin-premium surprise: TGJU publishes حباب as live symbols (an s1/11 §1 correction)

The ajax feed carries **five حباب (coin-premium) symbols** —
`coin_blubber` (Emami), `sekeb_blubber`, `nim_blubber`, `rob_blubber`,
`gerami_blubber` — each with profile pages (`tgju.org/profile/
coin_blubber`, etc.) carrying history + the full technical-table
treatment. Snapshot values (Rial → toman):

| حباب symbol | Rial | toman |
|---|---|---|
| coin_blubber (Emami) | 78,790,000 | 7,879,000 |
| sekeb_blubber (Bahar) | 25,010,000 | 2,501,000 |
| nim_blubber | 103,340,000 | 10,334,000 |
| rob_blubber | 110,800,000 | 11,080,000 |
| gerami_blubber | 59,370,000 | 5,937,000 |

**Cross-check vs Currena's own method (same snapshot):** Currena's
premium (s1/11 §5 formulas, intrinsic = ounce×dollar melt) for Emami
= 252,435,000 − 244,353,829 = **8,081,171 toman** vs TGJU's 7,879,000
— a 2.5% difference; TGJU does not document its حباب formula anywhere
(the profile page is quote-only), so the divergence's cause (different
intrinsic anchor, rounding, or lag) is unknowable from the outside.
And the news sites publish a THIRD number the same hour: eghtesadonline's
daily article (۲۶ آبان, 12:12 Tehran) says «حباب سکه امامی ۵٬۹۸۸٬۰۰۰
تومان» — ~25% below TGJU's number at nearly the same time
(their Emami quote 251.8M toman vs TGJU's 252.4M at 12:50).

**What this means (a material s1/11 §1 correction, recorded for S5's
SWOT):** the claim "Nobody in the Persian market publishes the
premium as a computed series — TGJU prints prices" was **half-wrong**:
TGJU (and the news chain citing the Union) *do* publish حباب values
with history. What NOBODY does: **document the formula** (TGJU's page
carries no method; the news sites carry different numbers with no
reconciliation). The bridge's differentiation claim narrows to — and
strengthens as — *the documented, reproducible premium*: Currena's
حباب states its intrinsic formula, shows the decomposition (ounce ×
dollar × pure-content), stamps as-of, and reconciles visibly; every
rival prints an unreproducible number. The S6/S7 spec should cite
today's three-way divergence (7.88M / 8.08M / 5.99M toman within one
hour) as the exact problem Currena's version solves.

### 1d. The technical tables (the D8 wording source, verified live)

The profile pages (verified on mesghal and coin_blubber) render:

- **EMA table — میانگین متحرک نمایی (EMA)**, granularity **5 / 10 /
  20 / 30 / 50 / 100 / 200 روز** (7 rows; mesghal snapshot: EMA5 =
  1,072,789,012 … EMA200 = 934,135,211).
- **SMA table — میانگین متحرک ساده (SMA)**, same 7 granularities
  (SMA5 = 1,075,440,000 … SMA200 = 890,039,141).
- **Pivot table — سطوح حمایت و مقاومت in FIVE methods**: کلاسیک
  (Classic), فیبوناچی (Fibonacci), کاماریلا (Camarilla), وودی
  (Woodie), دی مارک (DM/DeMark) — rows حمایت ۳ (S3) · حمایت ۲ (S2) ·
  حمایت ۱ (S1) · **نقطه پیوت (PP)** · مقاومت ۱ (R1) · مقاومت ۲ (R2) ·
  مقاومت ۳ (R3); DeMark's column carries only S1/PP/R1 (the method's
  actual geometry).
- **RSI + MACD** blocks (the signal zoo — present on TGJU, excluded
  by Currena's D8 scope guard).

**The D8 wording consequences (recorded for s1/13/S6):**
1. TGJU's pivot vocabulary is the FA copy's anchor: «سطوح پیوت» /
   «نقطه پیوت» / «حمایت و مقاومت» — the words the Persian reader
   already knows (s1/13 §5's "meet the reader where TGJU put them").
2. TGJU's five-method table is the anti-pattern the scope guard
   already rejects: Currena ships **classic only** (+ weekly), and the
   exclusion of فیبوناچی/کاماریلا/وودی/دی‌مارک is now evidenced as a
   *restraint against the incumbent's sprawl*, not a missing feature.
3. TGJU's MA granularity is 5/10/20/30/50/100/200; Currena's D8 set
   (20/50/100/200) is a deliberate subset — the four windows the
   decile statistics ride; the S6 copy can say «چهار بازهٔ استاندارد»
   without implying the others exist.
4. The profile pages also carry a **performance ladder** (یک هفته /
   یک ماه / شش ماه / یک سال / سه سال changes with dates) — the same
   window-relative grammar Currena's charts already use.

### 1e. Profile-page history (the bridge backfill source, verified)

Every profile page (mesghal, sekee, coin_blubber — all checked) renders
a **daily history table** directly in HTML: rows of `تاریخ (Jalali) |
اولین (open) | کمترین (low) | بیشترین (high) | آخرین (close) |
تغییر % | حجم (volume)` — daily OHLC + change + volume per instrument
(mesghal rows observed back to at least ۱۴۰۵/۰۸/۱۳ on page 1; the
table paginates deeper). **This is the s1/11 §6 backfill source,
verified live**: the scraper already parses these pages as the ajax
fallback (s1/11 §2), so the parser extension for OHLC history is
mechanical, per the repo's existing fetch discipline.

**History terms (s1/11 §6's ToS question — the exact wording):**
TGJU's terms page (`tgju.org/terms`, fetched 200 today) carries one
operative sentence, verbatim:

> «هر گونه کپی برداری از محتوا، تولیدات، شکل و سایر اجزای سایت
> صرفا با موافقت مکتوب مجاز می باشد»

("Any copying of the content, products, form or other components of
the site is permitted only with written consent." Footer copyright
line: «© 1404-1388 شبکه اطلاع رسانی طلا، سکه و ارز».)

**Posture for the bridge (recorded for M5/S8):** the repo's existing
TGJU scrape is the owner-approved production path (Gate 2, 2026-09-16 —
the live-rate snapshot). The profile-history backfill rides the SAME
licence posture (L2-owner-accepted-by-practice, attribution "Source:
TGJU" + link on the card, honest caveats: TGJU's revision practice
documented in s1/11 §6). The terms sentence above is recorded so the
posture is honest: TGJU's written-consent clause exists; the owner's
production decision to scrape the feed predates GPE and is not
re-litigated here (per the prompt: carry, cite, don't re-litigate).
**The sanctioned alternative exists and is cheap: see §1f.**

### 1f. TGJU's official API — persianapi.com (the sanctioned route, priced)

TGJU operates a commercial API platform (**پرشین ای پی آی** —
persianapi.com, fetched 200 today): Open API/Swagger workspace, web
services by category. Prices observed on-page (in Rial, per month):
base package 20,000,000 ﷼ (1/3/6-month: 56M / 105M / 199M ﷼); the
domestic-market family: **وب سرویس قیمت سکه (coin-price service)
14,000,000 ﷼/mo**, قیمت آبشده 14M, قیمت دلار 14M, بازار ارز 20M;
global markets 110M. (At the snapshot's free-market dollar rate,
14M Rial ≈ $5.2/month — trivial in hard currency, real money in
rial-context; payment rails are Iranian.)

**The bridge-backfill decision shape (recorded for S8):** two viable
routes — (A) parse the public profile-page history tables (zero cost,
rides the existing scrape posture, mechanical parser work), or (B)
subscribe to the official coin-price web service (~14M Rial/month,
sanctioned, documented, presumably clean JSON + no parsing risk).
**Recommendation: A for the one-time backfill + forward accumulation
(the repo's own discipline already covers it); B becomes the
escalation route only if TGJU ever blocks the scrape — the same
Path-B fallback pattern the repo already documents for the live
feed.** The network's own published scale (persianapi homepage):
4.5M+ daily unique visitors, 9M+ daily page views, 11B+ monthly
requests — the incumbent's reach, now quantified for the SWOT.

### 1g. Rate limits (the s1/11 §9 item)

No published rate-limit documentation exists on TGJU's pages (terms
page is one sentence; no API ToS found beyond persianapi's own
قوانین و شرایط استفاده link). The empirical evidence the repo already
holds: the production scraper polls `call1.tgju.org/ajax.json` at the
~5-minute snapshot cadence without issue (AGENTS.md §A's cron table;
S2 §5a re-verified the feed live). This session's probes (4 profile
pages + 1 ajax fetch + terms, sequential) all served 200 in ~1.5 s.
**Verdict: the existing cadence is the known-safe envelope; the
backfill (a one-time deep pagination read) should run off-hours,
sequential, with the honest UA — and the S8 spec records it as a
one-time operation, not a recurring load.**

---

## 2. The Persian news/retail landscape (the bridge's competitive frame)

### 2a. eghtesadonline (verified live today — the daily gold article)

`eghtesadonline.com/fa/news/2176206/…` («قیمت طلا و سکه امروز
سه‌شنبه ۲۶ آبان ۱۴۰۵ | افزایش سنگین قیمت طلا در بازار + جدول», code
۲۱۷۶۲۰۶): a full daily snapshot article — 18k 24,618,000 · 24k
32,820,000 · used 24,439,809 · **مثقال 106,640,000 · اونس $3,868**
(toman tables) · Emami 251,800,000 · Bahar 243,500,000 · nim
132,300,000 · rob 72,300,000 · gerami 36,000,000 — **plus the حباب
row set** (Emami 5,988,000 toman; Bahar 3,212,000; nim 9,681,000; rob
10,063,000; gerami 5,934,000). The article cites «به نقل از» chain
reporting (the site's own econ-desk format), prices **in toman**, with
per-article publication stamps. **The news-site pattern: gold prices
as ARTICLES (S1/08 §8 confirmed) — daily tables inside editorial, no
series, no API, no interpretation, but the حباب numbers DO surface
here** (with the convention divergence documented in §1c above).

### 2b. tejaratnews (verified live today — the Union-sourced page)

`tejaratnews.com/قیمت-طلا` (HTTP 200): «قیمت طلای 18 عیار (مثقال 18
عیار، گرم 18 عیار) … به گزارش تجارت‌نیوز و **به نقل از اتحادیه طلا و
جواهر تهران**» — the Tehran Gold & Jewellery Union as the cited
source; 18k quoted ۲۴,۶۲۳,۰۰۰ toman (vs TGJU's same-hour 24,697,600
— a **0.3% venue spread** between the Union's rate and TGJU's feed;
both live in the same hour). The rial/toman duality S1/08 §8 recorded
re-verified: **tejaratnews and eghtesadonline print toman; TGJU
prints rial; Currena's ÷10 canonical conversion is the only
machine-consistent treatment in the ecosystem.**

### 2c. The retail/seller frame

TGJU's own header carries the commerce funnel («سامانه آنلاین
معاملات طلا / خرید طلا» — the incumbent is also a gold dealer), and
its site family includes فروشگاه (shop), مارکت بان, شاخص بان, مارکت
پانوراما, پرشین والت, and the persianapi shop (§1f). The news sites
are editorial-only. **The Iran bridge's competitive frame is
therefore: TGJU (terminal + dealer + paid API), two news chains
(articles-as-data, Union-sourced), and no analytical/product layer
anywhere — the S1/08 §9 gap map ("global-macro ↔ local-price
integration: nobody") re-confirmed live today.** For the bridge card's
trust posture: the seller-funnels sit ON the price surface at TGJU
(the incumbent's version of GPE-S3-14 at the competitor) — Currena's
clean-data-surface position (no commerce on the data) is confirmed as
the differentiating posture in the Persian frame too.

---

## 3. What this means for S5 / S6 / S8

- **S5 (SWOT):** two material corrections to carry: (1) the حباب
  premium IS published by incumbents (TGJU symbols + news chains) —
  the differentiation is the *documented, reproducible* premium (§1c's
  three-numbers-in-one-hour evidence); (2) TGJU's reach is now
  quantified (4.5M daily uniques via persianapi's own numbers). The
  venue spread (Union 0.3% under TGJU) and the rial/toman duality are
  the ecosystem's convention chaos Currena's discipline answers.
- **S6 (IA):** the bridge card's حباب block cites §1b's convention
  table (mesghal آبشده 705) and §1c's reproducibility claim; the TA
  block's FA copy uses §1d's TGJU vocabulary with the classic-only
  guard; the card attributes "Source: TGJU" + as-of per row.
- **S8 (roadmap):** backfill route A (profile-page history, one-time
  sequential parse) with route B (persianapi ~14M ﷼/mo) as the
  escalation fallback; forward accumulation unchanged (s1/11 §6).

## 4. Method and limitations

Direct fetches from the planning machine, 2026-11-17 ~09:00–11:00
UTC (TGJU feed snapshot 12:50 Tehran): ajax.json (1,052 symbols),
4 profile pages + coin_blubber + terms, persianapi.com, eghtesadonline
article, tejaratnews page. All arithmetic from the same-snapshot
values, reproducible from the table in §1a. Limitations: (1) the
mesghal 705-fineness resolution is arithmetic-based (TGJU documents
nothing on-page); one bazaar-reference cross-check at build time is
the recorded residual; (2) TGJU's حباب formula is undocumented — the
2.5% divergence vs Currena's method is observed, not explained;
(3) the persianapi package contents (exact symbol coverage of the
14M-﷼ coin service) were read from the pricing page, not from a
subscribed workspace — S8 can verify at purchase time; (4) one point
in time: all values are dated snapshots.
