> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# Deep Audit: sahamanaliz.com/pages/gold (GPE Session S3 — the competitor)

**Session:** S3 of the Gold Page Elevation program · **Date:** 2026-11-17
(~03:02–04:10 UTC) · **Branch:** `docs/gold-page-elevation`
**Auditor method:** rendered-browser field audit (agent-browser/Playwright,
Chromium) on the live production page, live API reads, upstream cross-checks
by direct fetch (gold-api, Treasury.gov CSV endpoints, FRED, CFTC, Kalshi
trade API, Polymarket gamma API, Yahoo chart API, EODHD), read-only code
reading where applicable. Screenshots:
`docs/assets/gold-audit-s3-2026-11-17/` (17 files, `fa-*` + `currena-*`).
This document deepens the S1 survey audit (`s1/07`) and feeds the companion
head-to-head matrix (`docs/audits/2026-11-17-gold-head-to-head-matrix.md`).

**Coverage matrix (all verified rendered this session):**

| Axis | Covered |
|---|---|
| Locales | FA only — **confirmed: no EN version exists** (`/en/pages/gold` → 404; no locale selector; `?locale=en` serves the same FA content) |
| Viewports | 1440×900 · 768×1024 · 390×844 (no horizontal overflow at any) |
| Sections | all 18 from the s1/07 inventory (§1 below) |
| Interactive elements | gold/silver toggle, all 5 chart ranges (1m/6m/1y/5y/20y, at desktop AND 390), FAQ accordions (all 5), jewelry calculator (weight, karat, اجرت, tax — recomputation verified), DCA calculator (amount, year), market links (both), miner ticker (NEM — followed end-to-end to their stock product), mobile bottom nav (4 links), PWA install banner (dismiss present, not clicked) |
| States | loading placeholder ("در حال بارگذاری…" on reload), live-refresh (price moved $3,870.45 → $3,873.67 over 6 min, timestamps ۰۴:۰۲ → ۰۴:۰۸ CET), offline reload (served from HTTP cache — see §10 limitations); no stale/error states exist to trigger (see GPE-S3-30) |
| Upstream cross-checks | 20 rows: gold-api, Treasury nominal + real curves, FRED (T10YIE, CPIAUCNS, CPILFESL, PPIFIS, PPIACO), CFTC (deafut.txt legacy + fut_disagg 2026 archive), Kalshi trade API (all 5 Dec-2026 markets), Polymarket gamma API, Yahoo (DX-Y.NYB, GC=F, SI=F, ^GSPC, BTC-USD), EODHD (XAUUSD 1y), calculator math (§7) |

Snapshot of the day (page values as rendered ~03:02–03:08 UTC = ۰۴:۰۲–۰۴:۰۸
CET, 2026-11-17; the hero live-updates each minute): gold $3,870.45 +0.31%
(per-gram $124.44, prior session $3,858.60), silver $47.42 +1.02% (per-gram
$1.52, prior $46.94); "بازار باز است"; gold 13.3% below the 200-DMA and
6.9% below the 50-DMA; CPI Oct 2026 4.0% (prior 3.7%), core 2.8%, PPI 6.5%;
nominal 10y 5.12%, real 10y 2.92%, breakeven 2.2%, DXY 103.6; Kalshi
+0.25% hike 91%, Polymarket 92%; gold/silver ratio 81.7 (20y avg 71);
COT gold net 112,341 (Nov 10 report), COT silver net 3,615.

---

## 1. Verified section inventory (top → bottom, 1440 FA)

| # | Section | Contents verified this session | Notes (issue refs) |
|---|---|---|---|
| 1 | Top bar / nav | 🏠 صفحه اصلی · 🏆 مسابقه (→ /pages/contest-portfolio) · 👤 ورود مشترکین (→ /account/login) | commerce funnels (GPE-S3-14) |
| 2 | Hero quotes | Gold $3,870.45 +0.31%, per-gram $124.44, prior session $3,858.60; Silver $47.42 +1.02%, per-gram $1.52, prior $46.94; "بازار باز است"; 1-min refresh; last-price timestamp CET | live refresh verified (GPE-S3-10 timezone) |
| 3 | Auto-narrative | gold +0.3% today, real-yield +0.26pp w/w, DXY +1.4% w/w, "معمولاً به ضرر طلاست", silver +0.8%; "یادداشت خودکار… توصیه‌ی خرید یا فروش نیست" | GPE-S3-06 skew, GPE-S3-27 template |
| 4 | Price chart | gold/silver toggle · 1m/6m/1y/5y/20y · 50/200 DMA overlays + auto distance statement; at 5y/20y the overlays swap to a CPI-adjusted price line ("قیمت با حذف اثر تورم") | GPE-S3-03, -04, -12 |
| 5 | Inflation & rates | CPI 4.0% Oct 2026 (prior 3.7% ▲), core 2.8% (prior 2.6% ▲), breakeven 2.2% (1w −0.02), PPI 6.5%; assembled reading: "نامیل ۵.۱ − ۲.۲ → واقعی ≈ ۲.۹؛ نگه‌داشتن طلا پرهزینه" | GPE-S3-18, -25 |
| 6 | 10-year inflation chart | CPI/core/PPI lines vs 2% Fed target, 2016–2026, axis −2.6%→12.7% | verified good |
| 7 | Gold vs real yields | dual-axis (Jan 2024→Nov 2026 axis), rolling weekly-change correlation −0.13 + 2022 CB-buying explanation + "یک عامل است، نه فرمول پیش‌بینی" | GPE-S3-05 |
| 8 | Fed decision market | Kalshi (+25: 91%, +50: 6%, 0: 5%, −25: 1%, −50: 1%) + Polymarket (+25: 92%, +50: 5%, 0: 4%), 30-min refresh, both with "مشاهده‌ی بازار ↗" links, disclaimers | GPE-S3-07; links verified clean |
| 9 | Gold/silver ratio | 81.7 · prose "82 اونس نقره" · 20y avg 71 · range 32–126 | GPE-S3-15 rounding |
| 10 | Economic calendar | next Fed Dec 9, 2026 (23 days) · next CPI Dec 10, 2026 8:30 NY | verified consistent |
| 11 | Main factors | real yield 2.92% (1w +0.26, 1y +1.06) · nominal 5.12% · DXY 103.6 (1w +1.4, 1y +4.0) · COT gold net 112,341 (L 127,406/S 15,065, report Nov 10, "mid 1y range") · COT silver 3,615 (L 17,182/S 13,567, "near 1y lows") | GPE-S3-23, -24 |
| 12 | Asset comparison table | gold −5%/+107%/+218%/+523% · silver −6%/+88%/+183%/+271% · S&P +10%/+58%/+241%/+430% · BTC −30%/+7%/×87/—; honest footnotes | verified §7 rows 16–18 |
| 13 | Miners & ETFs | 13 live-quoted tickers (NEM→CDE) each → /pages/stocks/*; ETF row GLD/IAU/SLV linked + GDX/GDXJ/SIL inert | GPE-S3-08, -09 |
| 14 | Jewelry calculator (USD) | weight × karat (24/22/21/18/14) × اجرت% × tax% → pure value + اجرت + approximate price; live recomputation verified at 1440 and 390 | GPE-S3-16 |
| 15 | DCA calculator | $X/month since year Y (2006–2025) → gold/silver/S&P/BTC totals; month-count = Jan-of-year → current month; verified $100/2016 and $200/2020 | GPE-S3-17 |
| 16 | Education | 5 explainers: how prices are set, real yields, dollar, CB/ETF/speculators, silver dual nature | strongest education layer in Persian |
| 17 | FAQ | 5 `<details>` accordions, all expanded/verified, keyboard-accessible | verified good |
| 18 | Sources footer + Shopify chrome | gold-api (live), COMEX near futures (charts), BLS (inflation), Treasury (yields), Kalshi/Polymarket (Fed) + disclaimer; newsletter, socials, German unsubscribe text, mobile bottom nav | GPE-S3-01, -02, -14, -20 |

---

## 2. Issue log (numbered; severity HIGH/MED/LOW/INFO)

*Evidence = this session's screenshots (file names), API reads, upstream
fetches, or live DOM extraction (2026-11-17 ~03:02–03:40 UTC). s1/07 refs
(SA-strengths/gaps) noted where the deep audit confirms/refines them.*

### Content & data

**GPE-S3-01 · HIGH · The document is misdeclared as English LTR while the
content is Persian.** `<html lang="en">` with no `dir` attribute; the
document-level computed direction is `ltr`; RTL is scoped only to the
custom app containers (`.rzgs{direction:rtl}` / `#rzg`). Screen readers
announce Persian text with an English voice profile; mixed-direction
text outside the app container renders LTR; browsers pick wrong
fonts/line-breaking for the actual language. For a page whose entire
audience is Persian, this is the single cheapest correctness fix
available (one `lang="fa" dir="rtl"` pair). Evidence: `eval` reads
`document.documentElement.lang === "en"`, `dir === ""`,
`getComputedStyle(document.body).direction === "ltr"`;
`fa-1440-01-top.png`.

**GPE-S3-02 · MED · The page shell is English while the content is
Persian.** The Shopify scaffolding renders "Your cart is empty /
Estimated total / Subtotal" (cart drawer), a "Kindly agree" alert SVG
title, and a console log "Terms And Condition - Gm Infotech INC" — the
store platform locale is EN (also why `lang="en"` above). The reader
sees an English chrome (header/footer, cart, account) wrapped around a
Persian product. No EN content version exists (`/en/pages/gold` → 404;
`?locale=en` serves the same FA page). Compounds GPE-S3-01.

**GPE-S3-03 · MED · The 1-month chart range renders six repeated
month-only axis labels.** At 1m the axis reads "اکتبر ۲۶ · اکتبر ۲۶ ·
اکتبر ۲۶ · نوامبر ۲۶ · نوامبر ۲۶ · نوامبر ۲۶" — six ticks, three
identical pairs, no day-level differentiation (screenshots
`fa-1440-04-chart-1m.png`). A 1-month window needs day-of-month labels;
as rendered, the axis carries zero information. 6m/1y/5y/20y ranges label
correctly.

**GPE-S3-04 · MED · The hero price and the DMA statement are computed
from two different gold series, undisclosed at point of use.** The hero
tracks spot gold via gold-api ($3,870.45 live, per-gram = price/31.1);
the 50/200-DMA statement is computed from COMEX near-futures closes
(their stated chart source, disclosed only in the footer sources line).
Today the same "how far below the averages" question answers materially
differently by series — verified both ways this session:
futures-based (GC=F): −13.21% vs SMA200, −6.82% vs SMA50 (what the page
shows as 13.3%/6.9% ✓); spot-based (EODHD XAUUSD): −9.41% / −4.97%. The
4.7pp gap on the 200-DMA distance is not a rounding nuance — the two
series' 200-day means differ by ~4.7% in the current regime. A reader
reconciling the hero spot price against the chart's average lines sees
numbers that cannot be reproduced from the price they are shown. Fix:
label the series on the chart ("COMEX near contract") or compute the
statement from the same spot series the hero quotes.

**GPE-S3-05 · MED · The stated gold-vs-real-yield correlation (−0.13) is
reproducible — but only under one unstated sampling convention, and
neighbouring conventions give materially different numbers.** Verified
this session with Friday-anchored weekly changes of COMEX gold vs the
Treasury daily real 10y curve over the chart window (2024-01 →
2026-11): r = **−0.132** ✓ exact. But Monday-anchored weekly sampling
gives −0.259, Wednesday −0.321, daily −0.166, and FRED's DFII10 mirror
with ISO-week sampling gives −0.263. The number on the page is honest
under their convention, yet a reader cannot know the convention
(Friday-to-Friday, futures series, Treasury curve), and the result is
fragile enough that a methodology footnote is warranted — the exact
discipline Currena applies to its own published stats. (The CB-2022
regime sentence beside it remains one of the best honest-nuance
treatments in Persian.)

**GPE-S3-06 · LOW · The auto-narrative and the hero quote are sampled at
different moments and visibly disagree.** Narrative: "نقره هم ۰٫۸٪ بالا
رفته" (silver +0.8%) while the same viewport's hero showed silver
+1.02% ($47.42 vs prior $46.94); gold "۰٫۳٪" vs +0.31% (consistent
rounding). The narrative's snapshot and the hero's live tick run on
different clocks; a careful reader sees two numbers for the same
"today" move. Small, but on the page's flagship feature.

**GPE-S3-07 · LOW · The Polymarket option set over-rounds and is
asymmetric vs Kalshi's.** Polymarket card: +25 92% (live API mid: 91.5%),
+50 5% (4.7%), unchanged 4% (actual 3.2%) — sum 101%, and the two
"decrease" markets that exist on Polymarket (~0.5%) are omitted, while
the Kalshi card shows all five options. Rounding conventions mix (some
round-to-integer, one residual). Kalshi's five all verified exact (91/6/
5/1/1). Minor, but on a module whose whole value is precision-probability
literacy.

**GPE-S3-08 · MED · The ETF row is half-functional: GDX/GDXJ/SIL are
inert spans while GLD/IAU/SLV are links.** The six ETF references sit in
one visual row; three open the /pages/stocks/* product (GLD/IAU/SLV),
three are non-clickable `<span>`s (no pointer cursor, no href). The
inert three do not look disabled — the row reads as uniform chips.
Either link them (the destination pages exist for tickers) or style
them apart.

**GPE-S3-09 · LOW/MED · The miners strip carries no as-of: the quotes
are prior-session closes presented beside a live hero.** Verified via
the destination page (NEM → "قیمت پایانی · ۱۶ نوامبر ساعت ۱۶:۰۰ به
وقت نیویورک" — close of Nov 16, 16:00 NY): the 13 ticker quotes on the
gold page are one session behind the hero's spot price, with no date or
"close" label on the strip itself. The +0.50%/−1.56% changes are
prior-day changes — a reader comparing them against the hero's "today"
move mixes two days. (Currena stamps as-of on every card — the
comparison point for the matrix.)

**GPE-S3-10 · LOW · Mixed timezone conventions: hero in CET, calendar
in New York time.** The hero's refresh stamp reads "به وقت اروپای مرکزی"
(CET — presumably the operator's timezone), the CPI calendar entry "۸:۳۰
به وقت نیویورک", the miners' close "به وقت نیویورک". For an Iranian
audience, none of the three is Tehran-local; for consistency, at least
one convention should win. (Currena renders UTC + locale-aware dates.)

**GPE-S3-11 · INFO · The loading state is a bare text placeholder.**
On reload the app area renders "در حال بارگذاری…" (captured) — no
skeletons, no progressive disclosure. Acceptable for a server-rendered
page; noted for completeness against Currena's dedicated
loading/cached/error state machine.

**GPE-S3-12 · LOW · Chart interactivity is chip-only: no pan/zoom/
tooltip/log-scale; overlays are not toggleable.** The 5 ranges and the
metal toggle work (verified at desktop and 390); there is no way to
hover-read values, no log axis on the 20y view (gold 2006→2026 spans
$316→$5,709 — a linear axis flattens the first decade), and the DMA
overlays cannot be toggled off. At 5y/20y the DMA lines silently swap
for the CPI-adjusted price line (legend updates — correct — but the
swap itself is undiscoverable).

**GPE-S3-13 · LOW · Dark-only presentation inside a light shell.** The
app container is hardcoded dark (`--bg:#0b1726`, gold-on-dark accents);
no theme toggle, no light mode; the Shopify page above/below renders on
the store's light chrome — the page visibly changes personality at the
container boundary. A design choice, but a mixed one.

**GPE-S3-14 · MED · Commerce funnels sit on the data surface (s1/07
"commerce-driven layout" re-verified and sharpened).** Subscriber login
in the top bar, the €500 contest in the nav AND the mobile bottom bar
("۵۰۰€🏆مسابقه"), all 13 miner tickers + 3 ETF links route to their
subscription stock-analysis product, the newsletter block, and the
PWA-install banner. On mobile the contest is one tap away at every
scroll position. Nothing wrong commercially — but it is the direct
opposite of Currena's data-purity positioning, and it taxes reading
trust.

**GPE-S3-15 · LOW · The gold/silver ratio block internally
disagrees on rounding (81.7 shown, "82 اونس" in prose) and asserts
range statistics without any window note.** 81.7 vs 81.76 live (fine),
but "82" in the same sentence; "میانگین ۲۰ ساله 71" and "دامنه ۳۲ تا
۱۲۶" carry no as-of or method. Educational honesty would state the
window once.

**GPE-S3-16 · INFO · The jewelry calculator is USD-only and
arithmetically correct (verified live, twice, both viewports).** Formula
verified: pure = weight × karat-fraction × live per-gram; اجرت =
اجرت% × pure; tax = tax% × (pure + اجرت); total = sum. 25g 18k @ $124.47
→ $2,333.90 + $233.39 (+ tax 20% → $513.46) = $3,080.75 — recomputed
correctly each time, karat switch native-verified. No toman/IRR leg, no
coin premium, no parity — the Iran-bridge gap stands open (s1/07 §4;
integration lens in the matrix doc).

**GPE-S3-17 · INFO · The DCA calculator is self-consistent (month
count = January of chosen year → current month, disclosed).** $200/mo
since 2020 → total $16,600 = 83 months × $200 ✓; totals/percentages
arithmetically coherent; the underlying monthly price series is their
own (not externally verifiable), honestly footnoted ("بدون کارمزد و
مالیات"، "بازده گذشته تضمینی نیست").

**GPE-S3-18 · LOW · The inflation cards' "تغییر ماهانه" label is
ambiguous.** Displayed "تغییر ماهانه ۰.۳٪" reads as month-over-month
index change (actual MoM ≈ +0.17%) but is actually the YoY-rate delta
(4.0 − 3.7 = 0.3pp). Same on core. A label like "تغییر نسبت به ماه قبل
(١٢ماهه)" would disambiguate.

**GPE-S3-19 · LOW · Touch targets below the 44px guideline at 390.**
Chart range chips measure 50–65 × **30px**; the karat select and inputs
are adequate (162×41). Functional at 390 (verified by tap), but under
the accessibility floor.

**GPE-S3-20 · LOW · The mobile bottom navigation embeds the contest
funnel permanently.** Four fixed links: تحلیل سهام · طلا و نقره ·
اخبار و مقالات · ۵۰۰€ مسابقه — the fourth is commerce, in the
highest-affordance position on the page, at every scroll depth
(`fa-390-01-top.png`).

**GPE-S3-21 · INFO · Calendar verified: Dec 9 Fed (23 days), Dec 10
CPI 8:30 NY — consistent with the FOMC schedule and BLS release
calendar; the Kalshi market closes 2026-12-09 (same date).** No issue;
recorded because Currena lacks the calendar (F-GPE gap) and the
verification matters for the matrix.

**GPE-S3-22 · INFO · FAQ semantics are correct (native
`<details>/<summary>`, keyboard-accessible), and the education section
teaches accurate mechanics** (31.1g division, 18k = 75%, opportunity
cost, Au/Ag ratio meaning, 50/200-DMA meaning including golden/death
cross naming). Strongest FAQ+education combo in the Persian gold-web.

**GPE-S3-23 · MED · No as-of stamps on the macro factor cards.** Real
yield 2.92% / nominal 5.12% / DXY 103.6 / COT — all verified exactly
current today (Treasury Nov 16; ICE-quoted DXY; CFTC Nov 10 report —
see §7), i.e., the data is FRESH — but nothing on the cards says so:
no date, no "as of", no staleness marker anywhere. A stale render and
a fresh render are indistinguishable to the reader. (Only the COT cards
carry the report date "گزارش ۱۰ نوامبر ۲۰۲۶" — good — and the Fed module
says "هر ۳۰ دقیقه به‌روز".) This is the structural inverse of Currena's
as-of-everywhere discipline.

**GPE-S3-24 · INFO/MED · COT freshness beats Currena today — the
flip side of GPE-S2-05.** SA carries the **Nov 10** disaggregated
managed-money report (raw contracts, both legs, report date stamped),
verified exact against the CFTC archive; Currena's gold meter still
shows the Nov 3 report (stale, the S2-D4 pipeline P0). On positioning
data, the competitor is one week fresher than the page whose brand is
data discipline — a direct, citable head-to-head fact for the matrix
and the fix-first urgency.

**GPE-S3-25 · LOW/MED · The PPI figure is reproducible only by guessing
the right series.** "تورم قیمت تولیدکننده ۶.۵٪" reproduces exactly from
**PPIFIS (final demand)**: 160.254/150.439 − 1 = 6.52% ✓ — but the
all-commodities PPIACO gives 12.79%, and nothing on the page identifies
which PPI. A reader or auditor cannot pick the series without trial.
One-word fix: "PPI نهایی (final demand)".

**GPE-S3-26 · INFO · Prediction-market links are clean and correct.**
kalshi.com/markets/kxfeddecision/fed-meeting/kxfeddecision-26dec and
polymarket.com/event/fed-decision-in-december-… — no referral
parameters, both resolve to the live, correct markets (verified via
both APIs). Good hygiene.

**GPE-S3-27 · LOW/MED · The narrative engine is an unpublished,
ungoverned template.** The daily note's structure is rule-generated
(slot-filling: today's %, w/w deltas, mechanism sentence, disclaimer) —
verified by structure across the session's reads. Nothing wrong with
automation; the gap vs Currena's governance culture is that the
template's rules, thresholds, and wording history are neither published
nor versioned — the note is trusted because it reads well, not because
it is measured (s1/07 §3.2 confirmed deepened).

**GPE-S3-28 · INFO · No console errors, no page errors, no horizontal
overflow at any viewport × locale; the page is technically clean.**
The only console output is the theme vendor's watermark log. Mobile
bottom nav + PWA banner behave (dismiss present).

**GPE-S3-29 · LOW · The PWA install banner occupies fixed viewport
space at 768/390 until dismissed** ("نصب" / "بستن" present, not
exercised — OS-level prompt cannot be meaningfully tested headless).

**GPE-S3-30 · MED · The page has no stale/error/fail-closed discipline
at all.** No stale badges (concept absent), no cached-vs-live
distinction (the offline reload rendered from HTTP cache with zero
indication), no per-module error states, no "couldn't be read" for any
component. Everything always renders as if current. For 15 of 20
cross-checked values it genuinely IS current — but the discipline is
luck-of-freshness, not architecture (§10 limitations: the hard-offline
first visit could not be exercised; the platform would show its own
error page, not the product's). This is the single largest structural
asymmetry vs Currena's fail-closed culture, and the reason the
page's excellent numbers still score below Currena on data quality.

---

## 3. What the deep audit adds over the S1 survey (s1/07)

1. **The survey's "well-written collection" verdict is now measured:**
   20 upstream cross-checks, 16 exact matches (§7) — the page's numbers
   are not just plausible, they are (today) a *current, honest* macro
   snapshot: Treasury Nov 16 yields, the Nov 10 COT report, all five
   Kalshi probabilities, and a CPI gap-method that is disclosed AND
   reproducible.
2. **The survey's "no systematic framework" verdict is confirmed and
   sharpened** into five specific discipline gaps: no as-of (GPE-S3-23),
   no stale/fail-closed architecture (GPE-S3-30), unstated series
   conventions (GPE-S3-04, -05, -25), unpublished narrative rules
   (GPE-S3-27), and no statistics layer anywhere (soft prose readings
   only — "mid range", "near 1y lows" — both of which I verified are
   *accurate* against the 2026 COT archive, but they are words, not
   computed percentiles).
3. **New findings the survey missed:** the lang/dir misdeclaration
   (GPE-S3-01), the English shell (GPE-S3-02), the 1m axis-label bug
   (GPE-S3-03), the futures-vs-spot DMA convention gap (GPE-S3-04),
   the half-functional ETF row (GPE-S3-08), the hidden
   inflation-adjusted overlay at 5y/20y (a genuine feature the S1
   inventory did not record), and the fact that their COT is one week
   FRESHER than Currena's today (GPE-S3-24).
4. **The S1 "adopt" list survives intact** — the narrative, the
   assembled macro reading, prediction markets, calendar, calculators —
   now each with a verified-working reference implementation to borrow
   patterns from.

---

## 4. The 12 audit dimensions — deep scores (M3a)

*(The same 12 dimensions as s1/06 §4 / the S2 audit §4; scale 1–5;
every score justified against this session's issue IDs. The head-to-head
against Currena's S2 scores is the companion matrix doc §1.)*

| # | Dimension | Score | Justification (issue cross-refs) |
|---|---|---|---|
| 1 | Information completeness | **3.5** | Broad surface: hero + 5-range chart + 4 inflation metrics + correlation chart + Fed probabilities + ratio + calendar + 5 factor cards + asset table + 13 miners + ETF row + 2 calculators + education + FAQ + sources (§1). Depth per element is thin; the physical market, demand story, term premium, and any conditions abstraction are absent; the ETF row is half-inert (GPE-S3-08). Completeness by *breadth*, not by *closure*. |
| 2 | Financial sophistication | **3** | Genuinely sophisticated explanation: the assembled real-yield reading (nominal − breakeven → real → cost-of-carry), the correlation + 2022-regime lesson, managed-money raw legs, prediction-market literacy, DMA distances (GPE-S3-04 notwithstanding). But zero statistical apparatus: no percentiles/deciles/z-scores anywhere, no governance or backtest (GPE-S3-27), conventions unstated (GPE-S3-04/-05/-25). Explanation sophistication ≈ 4.5; measurement sophistication ≈ 1.5; the average is honest. |
| 3 | Gold-market coverage | **2.5** | Macro drivers + positioning + ETF/miners equity layer + education. No physical market (SGE/Swiss/Shanghai premium — Currena has all three), no central-bank demand data (one education paragraph + the correlation caveat only), no reserve metrics, no supply. The demand side is *taught*, not *shown*. |
| 4 | Macro interpretation | **4.5** | The best macro interpretation layer in the Persian web, re-verified today with exact-current numbers: the daily narrative (GPE-S3-06/-27 caveats), the assembled inflation→real-yield→cost-of-carry reading, the correlation lesson, the Fed-probability module with both venues, and the event calendar (GPE-S3-21). Deducted half a point for the template's unpublished rules (GPE-S3-27) and the ambiguous monthly-change label (GPE-S3-18). |
| 5 | Indicator relationships | **3.5** | One real rendered relationship (gold vs real yields, dual-axis + correlation), one assembled relationship (the inflation arithmetic), and mechanism explanations for every factor. No multi-currency grid, no yield decomposition card beyond the sentence, no demand/flow relationships. Above Currena's lane-grouping (2.5) because relationships are *explained*, not just *adjacent*. |
| 6 | Historical context | **2.5** | More history surface than any Persian competitor: 20y chart, 10y inflation chart, 1/5/10/20y asset table, DCA since 2006. But no episodes, no annotations (the 2022 note is prose only), no long-run series narrative, and the 20y series is futures-continuous (convention caveats, GPE-S3-04 family). Window-maximal, depth-minimal. |
| 7 | Data quality / credibility | **3.5** | The day's headline: 16 of 20 cross-checked values EXACT (§7) — Treasury-current yields, Nov 10 COT exact to the contract, all five Kalshi probabilities exact, CPI method disclosed AND reproduced, PPI reproducible (GPE-S3-25). Freshness beats Currena today on yields and positioning (GPE-S3-24). Deducted 1.5: no as-of anywhere (GPE-S3-23), no stale/fail-closed architecture (GPE-S3-30), series conventions undisclosed (GPE-S3-04/-05/-25), rounding asymmetries (GPE-S3-07/-15/-06). The values are honest; the *metadata* that makes honesty durable is absent. |
| 8 | Chart quality / usefulness | **3.5** | Five ranges + metal toggle + DMA overlays + auto distance statements + a dual-axis correlation chart + a 3-line inflation chart + the hidden CPI-adjusted overlay at 5y/20y — the richest chart suite in Persian gold pages. Deducted: the 1m axis-label bug (GPE-S3-03), no pan/zoom/tooltip/log (GPE-S3-12), mixed series conventions (GPE-S3-04), non-toggleable overlays. |
| 9 | Educational value | **4.5** | On-page education (5 mechanism explainers), a 5-question FAQ with correct math and semantics (GPE-S3-22), two calculators that convert prices into personal meaning (GPE-S3-16/-17), plain-language meanings on every factor card and the ratio, the data-gap transparency note (Oct 2025 shutdown — with a method that actually reproduces, §7 row 8), and the correlation regime lesson. The reference standard for Persian gold education. |
| 10 | UX / readability | **3.5** | Clean dark layout, no overflow at 1440/768/390, competent stacking, accessible FAQ semantics, mobile bottom nav, working calculators at 390 (all verified). Deducted: lang/dir misdeclaration + English shell (GPE-S3-01/-02), dark-only (GPE-S3-13), sub-44px chart chips (GPE-S3-19), half-functional ETF row (GPE-S3-08), timezone mix (GPE-S3-10), PWA banner persistence (GPE-S3-29), no skip-link/landmark structure observed (the page is a single app container; contrast Currena's semantic regions). |
| 11 | Mobile experience | **4** | No overflow at 390, all interactions re-verified at 390 (chart ranges, calculator recompute), bottom nav present, FAQ accordions work. Deducted: touch-target floor (GPE-S3-19), the permanent contest funnel in the bottom nav (GPE-S3-20), the install banner's viewport cost (GPE-S3-29). |
| 12 | Differentiation | **3** | The narrative+education+calculators+prediction-markets combo is genuinely differentiated *today* — no other Persian page has the assembled macro reading or prediction-market probabilities. But none of it is defensible: the template is copyable in a week (GPE-S3-27), the data has no proprietary layer, TGJU already ships MA tables, and the commerce funnels (GPE-S3-14/-20) tax the trust the differentiation needs. Currena's governed meter + backtest + licence wall is a structural moat; SA's edge is editorial polish without a moat. |

**Headline:** the competitor's numbers are honest and current (16/20
exact — a better verification day than most institutional pages would
pass), its explanation layer is the best in Persian, and its governance
layer does not exist. Rigor without infrastructure is SA's inverse of
Currena's infrastructure without explanation.

---

## 5. Data cross-check (M3b) — 20 rows, 2026-11-17

*Method: every claim read from the rendered page (or its live
recomputation) and compared against the upstream publisher fetched
directly this session. Verdicts: **MATCH** (value exact at the page's
own as-of), **MATCH-CONV** (matches under the page's convention, which
is undisclosed on the page), **APPROX** (within rounding/venue variance).*

| # | Claim (page value @ observed time) | Upstream check | Verdict |
|---|---|---|---|
| 1 | Gold live $3,870.45 → $3,873.67 (03:02→03:08 UTC; 1-min refresh) | gold-api.com XAU $3,872.30 @ 03:10 UTC | **MATCH** (live drift < 0.1%) |
| 2 | Silver live $47.42 → $47.49 | gold-api.com XAG $47.365 @ 03:10 UTC | **MATCH** |
| 3 | Per-gram gold $124.44–124.54 | price/31.1 each minute ✓ | **MATCH** (internal) |
| 4 | Real 10y yield 2.92% (1w +0.26) | Treasury daily real curve CSV, Nov 16 = 2.92; Nov 9 = 2.66 → +0.26 | **MATCH** (exact, current; 7-day delta convention) |
| 5 | Nominal 10y 5.12% (1w +0.24) | Treasury daily curve CSV, Nov 16 = 5.12; Nov 9 = 4.88 → +0.24 | **MATCH** (exact, current) |
| 6 | 10y breakeven 2.2% | FRED T10YIE Nov 16 = 2.20; and 5.12 − 2.92 = 2.20 | **MATCH** |
| 7 | DXY 103.6 (1w +1.4) | Yahoo DX-Y.NYB Nov 16 close 103.55, Nov 17 intraday 103.54; Nov 10→17 +1.28% | **APPROX** (level ✓ rounded; weekly delta within venue variance) |
| 8 | CPI Oct 2026 4.0% (prior 3.7% ▲) — gap method: "average of two adjacent months" | CPIAUCNS: 337.511 / avg(324.800 Sep-25, 324.122 Nov-25) − 1 = **4.02%**; Sep YoY = 3.74% | **MATCH** — and the disclosed method is exactly what reproduces it |
| 9 | Core CPI 2.8% (prior 2.6% ▲) | CPILFESL: 339.900 / avg(330.418, 331.043) − 1 = **2.77%**; Sep = 2.57% | **MATCH** (same method) |
| 10 | PPI 6.5% | PPIFIS final demand: 160.254/150.439 − 1 = **6.52%** (PPIACO would give 12.79% — series unidentified on page, GPE-S3-25) | **MATCH** (series-guessed) |
| 11 | COT gold net 112,341 (L 127,406 · S 15,065 · report Nov 10) | CFTC fut_disagg 2026 archive, GOLD row 2026-11-10: Managed Money L 127,406 / S 15,065 → net 112,341 | **MATCH** (exact, to the contract; disaggregated managed-money category) |
| 12 | COT silver net 3,615 (L 17,182 · S 13,567 · "near 1y lows") | CFTC fut_disagg 2026-11-10: MM L 17,182 / S 13,567 → net 3,615; the 2026 series' minimum | **MATCH** (exact; the soft reading "near 1y lows" verified accurate) |
| 13 | Kalshi: +25 91% · +50 6% · 0 5% · −25 1% · −50 1% | Kalshi trade API (all five Dec-2026 markets): last 0.91 / 0.06 / 0.05 / 0.01 / 0.01 | **MATCH** (all five exact) |
| 14 | Polymarket: +25 92% · +50 5% · 0 4% | Polymarket gamma API: 0.915 / 0.047 / 0.032 (+ cut markets 0.003/0.005 omitted on page) | **APPROX** (91.5→92 ✓; 3.2→4 over-rounds; option set asymmetric vs Kalshi — GPE-S3-07) |
| 15 | DMA statement: gold 13.3% below SMA200, 6.9% below SMA50 (recomputed live at 13.4/7.0) | Yahoo GC=F (COMEX futures, their stated source): SMA200 4,463.89 → −13.21%; SMA50 4,157.75 → −6.82%; **spot (EODHD XAUUSD): −9.41% / −4.97%** | **MATCH-CONV** (futures ✓; spot diverges 4.3pp — GPE-S3-04) |
| 16 | Correlation −0.13 (weekly changes, chart window) | Friday-anchored weekly Δ of GC=F vs Treasury real 10y, 2024-01→2026-11: **r = −0.132**; Monday-anchor −0.259; Wednesday −0.321; daily −0.166; DFII10/ISO-week −0.263 | **MATCH-CONV** (exact under their convention; convention unstated and result is convention-fragile — GPE-S3-05) |
| 17 | Asset table: gold +218% 10y / +523% 20y; S&P +241%/+430%; BTC ×87 | Yahoo: S&P +237%/+430% (20y EXACT); BTC 64,651/745.7 = **87× EXACT**; gold with exact-date futures base (Nov 2016 ≈ $1,216 → +218% ✓; Nov 2006 ≈ $12.8→ silver +271% ✓) vs roll-adjusted continuous bases (+231%/+499%) | **MATCH-CONV** (base-date granularity; futures-continuous conventions) |
| 18 | Gold/silver ratio 81.7 (prose "82"; 20y avg 71) | 3,872.30/47.365 = 81.76 | **MATCH** (internal rounding inconsistency GPE-S3-15) |
| 19 | Jewelry calculator outputs (25g 18k → $2,333.90 pure; +10% اجرت $233.39; +20% tax $513.46; total $3,080.75) | recomputed: 25×0.75×per-gram; اجرت=%×pure; tax=%×(pure+اجرت) — all exact at the live price | **MATCH** (verified live, both viewports) |
| 20 | DCA calculator ($200/mo since 2020 → spent $16,600; gold $28,987 +75%) | 83 months × $200 = $16,600 ✓; totals/percentages arithmetically coherent; underlying series is theirs (unverifiable externally, honestly footnoted) | **MATCH** (mechanics self-consistent) |

**Summary: 14 MATCH + 3 MATCH-CONV + 2 APPROX + 0 value MISMATCH.** Zero
false numbers found today. The page's arithmetic is trustworthy; its
*conventions* (series, sampling, base dates) are the reproducibility
gap — and its as-of/stale/metadata discipline is the structural gap
(GPE-S3-23/-30).

---

## 6. What this means for S6/S7/S8 (one paragraph each)

**S6 (IA):** SA validates three placement instincts: the
narrative/calculus pair belongs near the top (their strongest real
estate); prediction-market probabilities + calendar form a coherent
"what happens next" band; calculators belong at the bottom near the
education layer. The head-to-head (companion matrix §3) says Currena's
IA must sequence the explanation-layer features (F1 narrative, F4
education, F5 yield decomposition — SA's winning dimensions) alongside
the differentiation prizes (F2/F3), not after them. SA's defects
(GPE-S3-01/-04/-23/-30) are the checklist Currena's versions must not
inherit: lang/dir correctness, series labeling at point of use, as-of
on every new card, and no mixed live/close quotes without labels.

**S7 (framework):** their correlation sentence + 2022 CB-buying caveat
is the exact copy pattern for the Chain-1/Chain-4 crossover chart;
their assembled reading (nominal − breakeven → real) is the yield-
decomposition card's (F5) plain-language proof of concept; their FAQ's
50/200-DMA explainer is the D8 TA block's on-ramp wording. Borrow
patterns, keep the statistical grammar.

**S8 (roadmap):** quick-win P1s confirmed against a live reference:
per-card as-of (the discipline SA lacks — trust win), the calendar
(F-next), prediction markets (F-something — the licence-clean
Fed-probability route S1/08 §3 already identified), the DCA calculator
(adoptable in Currena's statistical voice). Do NOT copy: the commerce
funnel placement, the ungoverned template, the mixed conventions.

---

## 7. Coverage of the S1/07 inventory (all 18 rows re-verified)

Every row of the s1/07 §1 inventory was re-verified this session
(§1 above): top bar, hero quotes, auto-narrative, price chart (+ the
newly-recorded CPI-adjusted overlay at 5y/20y), inflation & rates,
10y inflation chart, gold-vs-real-yields, Fed decision market,
gold/silver ratio, economic calendar, main factors, asset comparison,
miners & ETFs, jewelry calculator, DCA calculator, education, FAQ,
sources footer. Two s1/07 items were sharpened: the "COT silver 3,615
near 1y lows" soft reading is now verified accurate against the CFTC
archive (§5 row 12), and the "auto-narrative" is now confirmed
rule-generated (GPE-S3-27). The s1/07 mobile note ("no overflow at
390px; everything stacks; calculators usable") re-verified with
interactions exercised.

---

## 8. Verified-good register (behaviors exercised and working)

- **V-01** Live refresh works: hero price moved $3,870.45 → $3,873.67
  across 6 minutes; timestamp advanced ۰۴:۰۲ → ۰۴:۰۸ CET; DMA
  statement recomputed (13.3%→13.4% as price moved).
- **V-02** Metal toggle re-renders the chart + axis + statement for
  silver (30.5%/18.4% below DMA pair; axis $33.38–$119.70).
- **V-03** All five range chips work at desktop AND 390; the 5y/20y
  ranges swap to the CPI-adjusted overlay with a correct legend.
- **V-04** FAQ accordions: all five expand (native details/summary);
  keyboard accessible.
- **V-05** Jewelry calculator recomputes on weight, karat, اجرت, tax —
  verified at 1440 and 390 (math §5 row 19).
- **V-06** DCA calculator recomputes on amount and year (month-count
  convention verified).
- **V-07** Miner ticker link verified end-to-end (NEM → their stock
  product, same quote +0.50%, as-of label present on the destination).
- **V-08** No horizontal overflow at 1440/768/390; no console/page
  errors all session; mobile bottom nav + calculator interactions
  work at 390.
- **V-09** Prediction-market links resolve to the correct live
  markets with no referral parameters (both APIs).
- **V-10** The data-gap disclosure (Oct 2025 shutdown + adjacent-month
  method) is not just honest wording — the method exactly reproduces
  the printed numbers (§5 rows 8–9). The best honesty-execution
  moment of the audit.

---

## 9. Integration-lens notes for the three decided features

*(The full borrow/differentiate/ignore verdicts with implications
live in the companion matrix §4; findings summary here.)*

1. **Iran bridge (D6):** SA has zero local content — USD-only jewelry
   calculator (GPE-S3-16), no toman/coin/mesghal, no parity/premium.
   The gap Currena decided to own is confirmed still unowned, twice
   (S1 probe + today).
2. **CB-demand (D7):** SA teaches the 2022 rotation in prose (the
   correlation caveat + one education paragraph) but shows no data,
   no chart, no numbers. Their prose is the copy pattern; the data
   story is unwon.
3. **TA block (D8):** SA ships exactly the overlay Currena decided on
   (50/200 DMA) with honest framing ("توصیف، نه پیش‌بینی") — validating
   the demand — while demonstrating the convention trap (GPE-S3-04)
   Currena's build must avoid by labeling its series at point of use.

---

## 10. Method and limitations

Rendered-browser audit (agent-browser/Playwright, Chromium) on the live
production page 2026-11-17 ~03:02–03:40 UTC; upstream checks via direct
fetch: gold-api.com, home.treasury.gov CSV endpoints (nominal + real
daily curves), FRED fredgraph CSVs (T10YIE, CPIAUCNS, CPILFESL, PPIFIS,
PPIACO, DFII10, DGS10, DTWEXBGS), CFTC (dea/newcot/deafut.txt legacy +
files/dea/history/fut_disagg_txt_2026.zip disaggregated archive),
Kalshi trade API v2 (api.elections.kalshi.com, all five Dec-2026
tickers), Polymarket gamma API, Yahoo chart API (DX-Y.NYB, GC=F, SI=F,
^GSPC, BTC-USD), EODHD (XAUUSD.FOREX — owner key used from environment,
never written to disk; credentials used, not stored). Currena spot-check
(currena.ir/gold, the S2 baseline's honest-treatment claims + fix-first
items) re-verified live in this session: GPE-S2-01 (the "10 years"
5.2-year window + "+115.3% 10 years") still renders; the "−8.8 pts"
unlabeled change still renders; COT still Nov-3 stale; licence wall +
honest record render; screenshots `currena-spotcheck-*.png`.
Limitations: (1) one point in time — live values move; the analytical
findings are time-independent, the data rows are dated snapshots.
(2) The hard-offline cold first visit could not be exercised — with
offline emulation the document rendered from HTTP cache with full data
(no service worker exists; `navigator.serviceWorker.controller` null),
so no product-owned error state was observable (recorded as GPE-S3-30's
evidence base). (3) The PWA install banner was not clicked (OS-level
prompt; headless). (4) SA's DCA/jewelry underlying price series are
their private data — only the arithmetic mechanics, not the series,
were verified. (5) Their `deafut.txt` parse used the repo's own verified
column map (`packages/insights/src/domains/gold/adapters/cftc.ts`,
COL after name-strip) as the reference for the legacy file's layout,
cross-checked by the COT arithmetic identity.
