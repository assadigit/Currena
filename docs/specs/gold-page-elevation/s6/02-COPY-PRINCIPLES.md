> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S6/02 — Copy Principles for the Elevated /gold (M2) — FA/EN, BINDING

**Session:** S6 of the Gold Page Elevation program · **Date:**
2026-11-17 · **Branch:** `docs/gold-page-elevation`

**What this is:** the binding copy rules for every section of the
elevated page (`s6/01`'s zones A–O), both locales. "Binding" means:
S7 (framework design), S8 (roadmap) and every Phase-D implementation
session comply with these rules; a rule changes only by a recorded
decision (the program's decision discipline). Each rule carries its
evidence citation. FA strings below are *proposed wording* for the
spec — final strings go through the repo's Persian-copy manifest
rounds (`pnpm copy:audit`, `docs/localization/persian-copy-workflow.md`)
in Phase D; **no em dashes in fa copy** (repo rule).

**Evidence base (cited throughout):** GPE-S3-04/-05 (the competitor's
undisclosed-convention defects), GPE-S2-11 (the outlook tension),
S3-D3c (the series-named rule), S4-D1 (the CPI base label), S4/03 §1c
(the حباب divergence), S4/02 §3 (the TE anti-pattern), S4/01 §4 (the
WGC terms verbatim), S4/04 §3 (the prediction-market licence reading),
S4/03 §1d (the TGJU vocabulary), s1/13 §5 (the TA honesty rules).

---

## C1 · Series named at point of use (the anti-GPE-S3-04 rule)

**Rule.** Every number, level, chart, change and statistic on the
elevated page states — at its point of use, not in a distant footnote
— the series it is computed from: instrument (spot vs futures vs
index), venue/source (already covered by C6), window, and sampling
where relevant. A reader must never have to guess which series a
claim rides.

**Why binding (evidence):** the competitor's flagship defects are
exactly this class: the DMA distance statement computed from COMEX
futures while the hero quotes spot (13.3% vs 9.4% below the 200-DMA
depending on series, undisclosed — GPE-S3-04) and the correlation
number that reproduces only under Friday-weekly sampling (−0.13 →
−0.26 under Monday sampling, GPE-S3-05). Kitco, by contrast, discloses
its series definition at point of use ("derived from the most actively
traded gold futures contract together with over-the-counter dealing")
— the habit Currena copies (S4/02 §2c). S3-D3c recorded the rule for
every new section; S4-D1 extended it to the CPI base label.

**Applications:**

| Where | The series statement that must render |
|---|---|
| TA band (Zone H) + F7 overlay | "SMA20/50/100/200 of XAUUSD daily closes (EODHD, London-fix-independent spot)" — the MA/decile/pivot rows name the series once per table header, and the distance statement names it again: "+6.2% above the 200-day average of XAUUSD daily closes — 78th percentile of the last decade" |
| CPI card (the S4-D1 extension) | when the gap rule fires: «مبنا: میانگین دو ماه مجاور (شکست انتشار مهر ۱۴۰۴)» / "base: adjacent-months average (Oct-2025 publication gap)" — labelled at point of use, auto-expiring when the base month exists again; stored levels stay pure |
| Correlation companion (Zone K / F11) | window + sampling pre-registered and printed on the panel ("weekly, Friday closes, trailing 10 years") — the anti-GPE-S3-05 discipline; the window is registered in the spec, never chosen post hoc |
| F5 yield card (Zone D) | each leg named (nominal 10y Treasury, 10y real yield, breakeven = nominal − real, term premium per the ACM series) with as-of per leg |
| Bridge (Zone F) | the toman-per-ounce intermediate named in the parity line (C2 below); mesghal's آبشده convention documented on the card |
| Multi-currency grid (F10) | the KGX-style validation sentence names the crosses it compares (S4/02 §2b's adopted wording pattern) |

---

## C2 · The حباب documentation grammar (the bridge's differentiation)

**Rule.** The bridge's حباب block documents itself completely, in this
grammar: **(a) state the intrinsic formula; (b) show the decomposition;
(c) stamp as-of; (d) teach the divergence.** No حباب number ever
renders without its four parts.

**The grammar, concretely:**

1. **State the formula** (EN + FA) on the card, once, visibly:
   `ارزش ذاتی = انس جهانی × دلار آزاد × عیار خالص` — "intrinsic =
   global ounce × free-market dollar × pure-gold content". The
   constants table (pure content per instrument, the CBI
   900-fineness family; gerami ≈1.01 g total / ~0.909 g pure **[default
   band, one build-time pin pending]**; mesghal = 4.6083 g × ≈0.705
   fineness = 3.249 g pure, the آبشده convention) renders in the
   card's expandable "method" block.
2. **Show the decomposition** per instrument: market price − intrinsic
   = premium, in toman, with both legs visible — the reader can
   reproduce the arithmetic (the S2 §5a sanity pattern:
   `$3,883.92 × 268,705 toman × 0.23542 ozt → 245.7M intrinsic vs
   250.6M market → +2.0%`).
3. **Stamp as-of**: the Tehran market day per row («۲۵ آبان» in FA,
   Gregorian converted in EN) + the snapshot timestamp — the bridge
   as-ofs its rows the way SA as-ofs its COT (GPE-S3-24's one good
   habit).
4. **Teach the divergence** (S4/03 §1c, S4/04 §6): the card's
   interpretation copy teaches that the same word printed three
   different numbers within one hour on 2026-11-17 — TGJU 7.88M /
   Currena-method 8.08M / Union-press 5.99M toman — and that
   Currena's number is the one that *reconciles visibly*: every rival
   publishes حباب undocumented; this card's number is reproducible
   from the stated formula. The three-way divergence (dated,
   attributed) is the exhibit; the wording never mocks rivals, it
   documents the reproducibility gap.

**Why binding:** S4-D3a narrowed and strengthened the bridge's claim —
incumbents DO publish حباب (TGJU live symbols + the news chains); the
differentiation is *the documented, reproducible premium* and it holds
"only as long as the documentation quality does" (S5/01 T2). Drop any
of the four grammar parts and the moat collapses into another
undocumented number.

---

## C3 · The outlook-language resolution for F15 (GPE-S2-11, resolved)

**The problem:** "Gold outlook: **Bearish**" and "Signs point to a
potential decline in gold prices" (silver: "potential **significant**
decline") sit paragraphs away from "It is not a forecast" /
«پیش‌بینی نیست» — directional forecast-adjacent language on a
conditions product, both locales (GPE-S2-11; s1/06 G6).

**The resolution (four binding clauses; wording drafts for the
Phase-D copy rounds, owner reads them at CP-B):**

1. **Re-scope the word to conditions, keep the market's vocabulary.**
   The outlook line renders as «چشم‌انداز شرایط: نزولی» / "Conditions
   outlook: bearish" — the market's word (نزولی / bearish) survives
   (the owner's OI-1 precedent in the sibling gold-balance program
   chose to keep the forecast wording *with* hedging language; this
   resolution respects that choice while re-scoping the noun from
   "gold" to "conditions"). The line never reads "gold outlook".
2. **The no-forecast line renders inline, adjacent** — not paragraphs
   away: the outlook word and «این توصیف شرایط فعلی است، نه پیش‌بینی»
   / "this describes current conditions, not a forecast" co-render in
   the same visual unit (the S2 audit's own finding was the *distance*
   between the two statements).
3. **The derivation always co-renders:** the outlook line carries its
   lane counts (as the hero counts already do) — "conditions outlook:
   bearish (4 firing against · 2 for · 2 not leaning · 1 unread)" —
   the reader sees the word is arithmetic on conditions, not a price
   opinion.
4. **No escalation intensifiers:** "potential significant decline" and
   every intensifier family («کاهش سنگین»، "steep", "sharp") is banned
   from outlook-adjacent copy; strength is expressed by the existing
   strong/moderate ladder (goldOutlookOf's L/A ≥ 3 strong rule),
   nothing else. Silver's takeaway gets the same grammar.

**Why this resolution (weighed):** (a) dropping the outlook word
entirely was rejected — the owner's OI-1 record keeps the market
vocabulary, and the verdict word ("Leaning against gold") already
carries the conditions frame; duplicating it gains nothing; (b) keeping
the wording as-is was rejected — the S3 verdict put the page's
credibility under a competitor whose numbers reproduce; the
forecast-adjacent phrasing is the one place the page's copy contradicts
its own published no-edge record; (c) the re-scope keeps the word
readers search for, binds it to the conditions frame, and costs one
noun + one inline sentence. **F15 closes with this record.**

---

## C4 · The forecast anti-pattern — binding (the TE rule)

**Rule.** No forecast numbers, no "expected to trade at X by [date]"
language, no attribution to unnamed models ("global macro models",
"analysts' expectations" without names/methods) anywhere on the
elevated page. The honest posture is the published no-edge backtest;
the *constructive* alternative is the LBMA forecast-accuracy
retrospective (F23).

**Why binding (evidence):** Trading Economics' headline — "Gold is
expected to trade at 3834.52 USD/t oz. by the end of this quarter,
according to Trading Economics global macro models and analysts
expectations" (verbatim, S4/02 §3) — is unverifiable by construction,
and the measured counter-evidence is LBMA's own survey record:
named professional consensus under-forecast gold in 10 of 16 years
(mean miss −2.1%, mean-abs 8.1%, −20.2% in 2025). **Currena's version
of "what lies ahead" is F23 + F24: the measured failure rate of
professional forecasts, and the market's own implied probabilities —
both attributed, both reproducible.** The TE *narrative* pattern
(price move + 1-month context + 1-year context, series convention
disclosed) is adopted for F1; the forecast headline is the part
banned (S4/05's split verdict).

---

## C5 · The TA block: TGJU vocabulary + the classic-only guard + the honesty rules

**Vocabulary rule (FA owns the market's words).** The TA band's FA copy
uses the vocabulary the Persian reader already knows from TGJU
(S4/03 §1d, s1/13 §5): «سطوح پیوت» (pivot levels), «نقطه پیوت» (PP),
«حمایت» / «مقاومت» (support/resistance rows), «میانگین متحرک ساده»
(SMA) — meet the reader where TGJU put them, then teach the honest
version. The zone header draft: «سطوح مرجع» / "PRICE LEVELS".

**The classic-only guard (binding scope).** Currena ships **classic
daily + weekly pivots only** — the exclusion of فیبوناچی /
کاماریلا / وودی / دی‌مارک is now *evidenced* restraint against the
incumbent's sprawl (TGJU's own five-method table, S4/03 §1d), not a
missing feature; the MA set is the four standard windows
(20/50/100/200) — a deliberate subset of TGJU's 7-row granularity,
and the copy may say «چهار بازهٔ استاندارد» without implying the
others exist. Revisit only on new owner instruction or measured
demand (the burden is on expansion, s1/13 §4). The full zoo
(RSI/MACD/Bollinger/Ichimoku/OBV, multi-timeframe signal matrices)
stays Excluded (F19).

**The honesty rules (s1/13 §5, carried verbatim into the IA):**

1. Every level is labelled **descriptive reference**, never
   support/resistance "guarantee" language («سطح مرجع است، نه تضمین
   حمایت/مقاومت»).
2. Crossovers are **dated events, not signals**; the events list
   shows what followed *including the whipsaws* — symmetric with the
   backtest-honesty culture.
3. The **decile treatment** anchors the TA block in the page's
   statistical framework — the same grammar as every voter
   ("distance from the 200-DMA as a percentile of the decade").
4. **No TA element joins the 37-voter meter** (display-only context;
   meter membership is a versioned governance decision).
5. FA copy owns the TGJU vocabulary, then teaches the honest version
   (the rule above).

**Series rule applies (C1):** the whole block names its series (XAUUSD
daily closes, EODHD) at the table header — the anti-GPE-S3-04 clause.

---

## C6 · Attribution wording per source (binding table)

| Source | The wording that renders | Evidence / posture |
|---|---|---|
| **WGC (Tier-2: GDT stack, ETF flows, prices workbook)** | **"Source: World Gold Council — Gold Demand Trends"** + link to the dataset/article page on every rendered number and chart; the terms-and-conditions page linked in the licence footer; raw XLSX never re-hosted in public web assets (dated source files live in the private `data/wgc/` ingestion path; only derived/aggregated numbers render) | S4/01 §4 verbatim terms (the accreditation clause + info@gold.org contact); the ETF page's chart sources line is WGC's own house pattern; D7's L2-owner-accepted posture; the data-drop decision S4-D2 |
| **LBMA (vault, clearing, forecast survey)** | **"Source: LBMA"** + link; the four-field disclosure block (length/frequency, update schedule, units, methodology) per WGC's own dataset-page grammar (S4/01 §1) | S4/02 §1b–§1d: free direct XLSX, no click-through terms, footer copyright only — the L1-style attribution treatment |
| **TGJU (the bridge's instruments + history)** | **"Source: TGJU"** + link, per row/block; the honest caveats: the revision practice documented (s1/11 §6), and the terms sentence «هر گونه کپی برداری … صرفا با موافقت مکتوب مجاز می باشد» is *recorded repo-side* (not user-facing) so the owner-accepted posture stays honest; backfill history labelled "reconstructed from source history" vs "computed live from our snapshots" | S4/03 §1e verbatim; the Gate-2 owner-approved scrape posture, not re-litigated |
| **Kalshi + Polymarket (F24)** | Display-only + attribution + link to the markets + **no key'd endpoints, no bulk redistribution**; the card's own disclaimer mirrors SA's honest pattern: «این انتظار معامله‌گرهاست، نه پیش‌بینی ما» / "market-implied probabilities — the traders' expectation, not ours"; name both venues (venue diversification, the SA pattern) | S4/04 §3: the prohibited classes are capital-market clients and market-data distributors; the conservative informational-display posture stands. The Kalshi Developer Agreement wording = one build-time read **[default: first implementation session]** |
| **IMF (CB-demand Tier-1)** | "Source: IMF (monthly reserves)" + the WGC cross-reference link for readers who want the curated version; the "reported-world" total labelled as such (86 reporters, aggregates/outliers excluded — never claimed as the world total); revision caveat («داده‌های ماهانه بازنگری می‌شود» — monthly data is revised; some buyers report with lag) | S4/04 §2d: IL `RGV_REVS` + IRFCL `IRFCL56V_FTO`, keyless L1; s1/12 §2's provenance-label pattern |
| **CFTC / FRED / Treasury [default] / EODHD / gold-api** | the existing per-card source discipline continues unchanged (as-of + stale + sourceName); the Treasury-direct switch (S4-D5) changes the ingest leg, not the user-facing source line | S2 §1/§7 (the existing discipline); S4/04 §2f |

**The universal rider (matrix §5c):** every new section carries as-of
on every card, stale badges, and fail-closed states at the existing
discipline's level — SA's COT stamp is the minimum, not the target.

---

## C7 · Meta-rules (the frame every rule above lives inside)

1. **Bilingual native, both locales, no translation smell:** EN + FA
   dictionaries (`apps/web/src/i18n/`), `dir` from locale, CSS logical
   properties only, `Intl.NumberFormat('fa-IR')` digits, Jalali dates
   in FA, every new fa string through the Persian-copy manifest gate
   (`pnpm copy:audit`); **no em dashes in fa copy**. The Persian terms
   that own their concepts (حباب، سطوح پیوت، چرخش خریدار) carry an EN
   gloss at first use, never a substitution.
2. **The F1 narrative's honesty rules (S4/01 §2, binding):** the
   narrative is organized by the five (six) driver families with their
   observed firing states and the day's raw deltas; it **never fakes
   GRAM's attribution arithmetic** (no "X% of the move was real
   yields"); the standing caveat renders with it: "the meter explains
   conditions, not the price move" / «برآیند، شرایط را توصیف می‌کند،
   نه حرکت قیمت را»; GRAM's "drivers do not fully explain returns"
   maps to the `mixed`/`unreadable` lane words — the honest
   "we don't know" bucket.
3. **The CB-demand copy rules (s1/12 §3, carried):** the rotation term
   «چرخش خریدار» with the honest revision/lag caveat; the
   share-of-reserves framing stated carefully (a rising gold share can
   be price arithmetic, not active buying — the copy must say so);
   the mirror-framing reconciliation with the `usd-reserve-share` seat
   (s6/01 §2b): each names its object and sign convention at point of
   use, and the two cross-link.
4. **The bridge interpretation copy (s1/11 §7, carried):** the premium
   is a market-structure reading (scarcity/demand pressure), copy is
   descriptive, dated, no advice, no political commentary; the copy
   *teaches the decomposition* (C2), never forecasts the coin.
5. **The education voice (F4/F13/F16, from the S3/S4 findings):**
   plain one-line meanings on every ratio/level («نسبت ۸۲ یعنی چه»);
   the honest wall explains *why* each item is absent and what the
   owner's lever is; the why-lines state causes, not apologies
   (upstream-stopped / upstream-gap / pipeline-lag / rule-driven).
6. **Dates and regimes, not numbers, in teaching copy:** market values
   in education/narrative copy are dated snapshots (program rule 6);
   the analytical sentences must survive any particular day's numbers
   (S5/01 §6's durable-content rule).

---

## Method and limitations

These rules consolidate the copy-relevant decisions already recorded
across S2–S5 (cited per rule) and resolve the one open copy item this
session owns (F15, C3). The FA strings are proposed wording: the
binding element is the *rule*, the strings are drafts for the
Phase-D Persian-copy rounds (the manifest fingerprint gate). Nothing
was implemented (standing constraint); no code, `main`, or shared
bookkeeping files were touched. The F15 resolution and the C6
attribution table go to the owner at CP-B with the S7 framework.
