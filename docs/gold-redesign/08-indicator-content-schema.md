# Gold Page Redesign — Session 3: Indicator Content Schema

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

**Session:** 3 of 9 — Indicator taxonomy and bilingual explanation system (`CURRENA_GOLD_UX_STRATEGY_AND_PHASED_PLAN.md` §10, Session 3)
**Mode:** Data/content design and copy production. No page implementation, no component code, no financial-model logic, no data sources, no ingestion, no provider requests, no production behavior changed.
**Date:** 2026-11-2x
**Companion deliverables:** `09-indicator-explanations-fa-en.md` (the full fa/en records + the coverage report) · `10-indicator-relationship-map.md` (the relationship records + the explorer taxonomy) · `DECISION_LOG.md` (S3-D1…S3-Dxx)
**Authoritative sources used:** `packages/insights/src/shared/gold-score.ts` (the 37-voter table — polarity source of truth) · `packages/insights/src/shared/connections.ts` (`evalLeg` + `SIGNAL_LEG_MOVE` + the position bands) · `docs/gold-redesign/03-indicator-and-module-inventory.csv` (the S1 inventory) · `docs/gold-redesign/01-current-state-audit.md` + `02-section-and-component-map.md` + `04-duplicate-and-overlap-matrix.md` (the S1 evidence) · the master plan §2–§2.2 (locked owner decisions) and §5 (the content system requirements) · `apps/web/src/shared/i18n/{en,fa}.ts` (the shipped corpus wording this content must stay consistent with)

---

## 1. Purpose and scope

This document defines the **content model** for every unique indicator and module the `/gold` page shows (or honestly discloses as blocked): the canonical row set, the plain-language label system, the explanatory-dimension schema, the progressive depth tiers, the bilingual copy rules, the briefing/outlook vocabulary drafts (owner-review items), and the integration contract that turns these records into runtime dictionary entries in Session 5.

It is the schema and rulebook. The records themselves live in `09-indicator-explanations-fa-en.md`. The relationships live in `10-indicator-relationship-map.md`.

**Out of scope (Session 3 boundaries, held):** visual implementation beyond this document's textual "visual reading" descriptions (Session 4), any runtime copy change (the dictionaries and the Persian-copy manifest are untouched this session — integration is Session 5), any change to financial-model logic, thresholds, polarity, percentile windows, data sources, KV rungs, or production behavior (master plan §9.3; nothing was changed).

---

## 2. The canonical row set — 68 rows, reconciled from the live sources

> **S3-D1 (the state discrepancy, recorded first because it shapes everything below).** The owner's Session-3 assignment references Session-2 deliverables (`05-product-principles-and-visitor-journey.md` §7–§9, `06-final-information-architecture.md`, `07-canonical-placement-and-deduplication-plan.md`, DECISION_LOG entries S2-D1..S2-D15). **These files do not exist in the repository** — not on `main` (tip `8890690a`, the S1 closeout), not on any `origin/*` branch, not in any open or closed PR (verified via `git ls-remote`, a full `git cat-file -e` sweep of every remote ref, and the GitHub PR list at session open). Session 2 was never executed, or its work was never pushed. Rather than halt the content session (its inputs — the indicator set, polarity, thresholds, units, the master plan's §5 requirements — all exist in live sources), this session **derives the needed S2 inputs from the authoritative sources** and flags each derivation here and in `DECISION_LOG.md` so a future Session 2 (or a catch-up session) can reconcile. The prompt's own description of the 68-row set (37 voters + 11 non-voter present readings + 4 licence-blocked absentees + 16 modules) reconciles exactly with the S1 inventory CSV — that is the derivation below.

### 2.1 The reconciliation

The S1 inventory (`03-indicator-and-module-inventory.csv`) lists 68 data rows: 48 present indicator readings + 4 absent indicators + 16 non-indicator modules. Cross-checked against the engine:

- **37 voters** — exactly `GOLD_LANE_VOTERS` in `gold-score.ts` (7 borrowing-costs · 7 dollar · 11 stress · 10 inflation · 2 flows). The CSV's `role` column marks each; every id, lane and polarity matches the engine table (the CSV's "voter" rows = the engine's 37, verified one by one this session).
- **11 non-voter present readings** — the 48 present readings minus the 37 voters: `gold-usd` (the hero price), `gold-btc`, `gold-aud`, `gold-oil-ratio`, `gold-platinum`, `real-gold-price`, `copper-gold`, `gold-equities-ratio`, `sge-gold-withdrawals`, `swiss-gold-flow`, `shanghai-gold-premium`. Context-only by design (G-5); `gold-usd` is the page's primary price, never a voter.
- **4 licence-blocked absentees** — `wgc-etf-holdings`, `wgc-cb-demand`, `official-gold-demand`, `etf-short-interest`: registry ids whose sources are disabled; they render as honest blocked notes in the publication-notes disclosure (never fake data). Their explanation records exist (09 §5) with the blocked dimension documented.
- **16 modules** — the non-indicator surfaces (narrative, yield decomposition, on-ramp, expectations, bridge ×2, signals, time machine, TA levels, CB demand, London vault, correlation, forecast retrospective, episodes, if-bought, publication notes). They are **not indicators**; they get the reduced module record (§7), and Session 4 maps them to visuals.

**Drift check (task 1, "from the current source, not an old documentation count"):** AGENTS.md §A's registry header says "54 voting [V]" for the whole 187-indicator insights registry — that is the *insights-wide* count, not the gold page's. The gold page's voter set is the engine's 37 (verified against `GOLD_LANE_VOTERS` and the live DOM's 37 `[data-seat]` chips, S1 §5). No drift found between the CSV, the engine, and the S1 live audit. The canonical set is the 68 rows above; **52 unique indicators** (48 present + 4 blocked) carry full explanation records; the 16 modules carry module records.

### 2.2 The row registry (authoritative for Sessions 4–9)

| # | Canonical ID | Kind | Lane / home | Voter? | Polarity (gold) | Record |
|---|---|---|---|---|---|---|
| 1 | `real-yield-10y` | indicator | borrowing-costs | ✅ | −1 | 09 §3.1 |
| 2 | `us10y` | indicator | borrowing-costs | ✅ | −1 | 09 §3.2 |
| 3 | `us30y` | indicator | borrowing-costs | ✅ | −1 | 09 §3.3 |
| 4 | `fed-target` | indicator | borrowing-costs | ✅ | −1 | 09 §3.4 |
| 5 | `fed-expectations` | indicator | borrowing-costs | ✅ | −1 | 09 §3.5 |
| 6 | `ecb-dfr` | indicator | borrowing-costs | ✅ | −1 | 09 §3.6 |
| 7 | `real-yield-5y` | indicator | borrowing-costs | ✅ | −1 | 09 §3.7 |
| 8 | `dollar-basket` | indicator | dollar | ✅ | −1 | 09 §3.8 |
| 9 | `usdjpy` | indicator | dollar | ✅ | −1 | 09 §3.9 |
| 10 | `us-japan-10y-gap` | indicator | dollar | ✅ | −1 | 09 §3.10 |
| 11 | `usd-reserve-share` | indicator | dollar | ✅ | −1 | 09 §3.11 |
| 12 | `nyfed-custody` | indicator | dollar | ✅ | −1 | 09 §3.12 |
| 13 | `dollar-broad` | indicator | dollar | ✅ | −1 | 09 §3.13 |
| 14 | `dollar-eme` | indicator | dollar | ✅ | −1 | 09 §3.14 |
| 15 | `stress-stlfsi` | indicator | stress | ✅ | +1 | 09 §3.15 |
| 16 | `nfci` | indicator | stress | ✅ | +1 | 09 §3.16 |
| 17 | `vix` | indicator | stress | ✅ | +1 | 09 §3.17 |
| 18 | `gold-silver` | indicator | stress | ✅ | +1 | 09 §3.18 |
| 19 | `term-premium-10y` | indicator | stress | ✅ | +1 | 09 §3.19 |
| 20 | `ebp` | indicator | stress | ✅ | +1 | 09 §3.20 |
| 21 | `michigan-sentiment` | indicator | stress | ✅ | **−1** (pessimism = gold-positive) | 09 §3.21 |
| 22 | `gpr-daily` | indicator | stress | ✅ | +1 | 09 §3.22 |
| 23 | `epu-us` | indicator | stress | ✅ | +1 | 09 §3.23 |
| 24 | `sp500-breadth-ratio` | indicator | stress | ✅ | **−1** (falling breadth = gold-positive) | 09 §3.24 |
| 25 | `bank-stress` | indicator | stress | ✅ | +1 | 09 §3.25 |
| 26 | `us-cpi-yoy` | indicator | inflation | ✅ | +1 | 09 §3.26 |
| 27 | `us-pce-core-yoy` | indicator | inflation | ✅ | +1 | 09 §3.27 |
| 28 | `euro-hicp` | indicator | inflation | ✅ | +1 | 09 §3.28 |
| 29 | `breakeven-5y5y` | indicator | inflation | ✅ | +1 | 09 §3.29 |
| 30 | `breakeven-tilt` | indicator | inflation | ✅ | +1 (level-leg only, D-5) | 09 §3.30 |
| 31 | `t5yie` | indicator | inflation | ✅ | +1 | 09 §3.31 |
| 32 | `michigan-1y-expectations` | indicator | inflation | ✅ | +1 | 09 §3.32 |
| 33 | `m2-us` | indicator | inflation | ✅ | +1 (percentileBasis: yoy) | 09 §3.33 |
| 34 | `us-deficit-12m` | indicator | inflation | ✅ | +1 | 09 §3.34 |
| 35 | `michigan-5y-expectations` | indicator | inflation | ✅ | +1 (level-leg only) | 09 §3.35 |
| 36 | `cftc-gold-positioning` | indicator | flows | ✅ | −1 (crowded longs fragile) | 09 §3.36 |
| 37 | `cftc-gold-gross-long` | indicator | flows | ✅ | −1 | 09 §3.37 |
| 38 | `gold-usd` | indicator | hero price (ratios-group exception) | ✗ context | n/a (the price itself) | 09 §4.1 |
| 39 | `gold-btc` | indicator | ratios | ✗ | n/a | 09 §4.2 |
| 40 | `gold-aud` | indicator | ratios | ✗ | n/a | 09 §4.3 |
| 41 | `gold-oil-ratio` | indicator | ratios | ✗ | n/a | 09 §4.4 |
| 42 | `gold-platinum` | indicator | ratios | ✗ | n/a | 09 §4.5 |
| 43 | `real-gold-price` | indicator | ratios | ✗ | n/a | 09 §4.6 |
| 44 | `copper-gold` | indicator | ratios (growth-health registry group) | ✗ | n/a | 09 §4.7 |
| 45 | `gold-equities-ratio` | indicator | ratios | ✗ | n/a | 09 §4.8 |
| 46 | `sge-gold-withdrawals` | indicator | physical subgroup | ✗ | n/a | 09 §4.9 |
| 47 | `swiss-gold-flow` | indicator | physical subgroup | ✗ | n/a | 09 §4.10 |
| 48 | `shanghai-gold-premium` | indicator | physical subgroup | ✗ | n/a | 09 §4.11 |
| 49 | `wgc-etf-holdings` | indicator | ABSENT (licence) | ✗ | would-be context | 09 §5.1 (blocked) |
| 50 | `wgc-cb-demand` | indicator | ABSENT (licence) | ✗ | would-be context | 09 §5.2 (blocked) |
| 51 | `official-gold-demand` | indicator | ABSENT (source dead) | ✗ | would-be context | 09 §5.3 (blocked) |
| 52 | `etf-short-interest` | indicator | ABSENT (no licence-clean venue) | ✗ | would-be context | 09 §5.4 (blocked) |
| 53–68 | the 16 modules | module | their zones (02 map) | — | — | 09 §6 (module records) |

**Placement note (derived, flagged for Session 2):** the twelve-chapter hierarchy this content targets is the master plan §4's own twelve sections (1 Gold today · 2 What is influencing gold · 3 The main drivers right now · 4 Market activity and institutional demand · 5 What markets expect · 6 Gold relative to other markets · 7 Technical gold-price context · 8 How gold's forces connect · 9 Gold through history · 10 If you'd bought · 11 Iranian gold market · 12 Sources, methodology and publication notes). Where a record's "visual reading" mentions its surface, it references the *current* surface (per 02) so the copy stays true to what the data can show; Session 2's formal placement table, when it exists, supersedes placement wording only — never the indicator facts.

---

## 3. The content schema — every required dimension, typed and ruled

Master plan §5.1 defines ten required dimensions; the seven owner-requested explanation dimensions are mandatory content coverage, some combinable in default copy but none silently omissible from the record. The schema below is the authoring contract for every record in 09. Field names are stable keys (Session 5 will transform them into dictionary entries mechanically — see §9).

### 3.1 Identity fields

| Field | Type | Rule |
|---|---|---|
| `id` | string | The canonical engine id, never invented or renamed (financial-model protection §9.3). |
| `plainLabel.en` / `plainLabel.fa` | string | The audience-facing label, understandable before any technical name. Plain nouns or short noun phrases; no unexplained abbreviations; Latin tickers allowed as secondary parentheses, never as the whole label. FA: natural Persian terminology per the glossary; «،»/«؛»/«(...)»/«...» punctuation, **no em dashes**; Persian digits in static copy; ZWNJ where meaningful. |
| `techName.en` / `techName.fa` | string | The recognized financial/economic name (e.g. "10-Year Treasury Constant Maturity Inflation-Indexed Security yield, FRED DFII10"). Preserved but always **secondary** to the plain label (owner decision 18). FA technical names keep the Latin series id where the corpus does (e.g. «شاخص VIX»). |
| `kind` | enum | `voter` \| `context` \| `blocked` \| `module`. |
| `lane` | enum \| null | `borrowing-costs` \| `dollar` \| `stress` \| `inflation` \| `flows` \| null (non-voters). The engine lane ids are frozen (protected); audience labels for the five groups live in §5 of this document. |

### 3.2 Measurement fields (the data context, expanded)

| Field | Type | Rule |
|---|---|---|
| `whatItMeasures.en/.fa` | string (1–2 sentences) | What is **actually measured** — the thing, not the name. E.g. "the extra yield an investor demands for holding 10-year US government bonds instead of cash, beyond expected inflation" — not "the real yield". |
| `unit` | string | The display unit exactly as the page renders it (from the CSV `rule_or_unit`): USD per troy ounce, points, %, ratio, tonnes… |
| `dataType` | enum | `level` (a level in its own units) \| `ratio` (X ÷ Y) \| `percent-change` (YoY-type) \| `index` (constructed index) \| `probability` (0–100 market-implied). |
| `cadence` | string | The publication rhythm (daily/weekly/monthly/quarterly/per-change) with the honest lag where material (e.g. CFTC weekly with days lag; LBMA vault T+2.5 weeks). |
| `referencePeriod` | string | The historical reference the position/percentile uses. Default: **the rolling 10-year window** (`percentile10y`), the engine's own basis; exceptions named (e.g. `m2-us` reads its **year-over-year** percentile basis; if-bought deciles use same-length windows, min base 30). Always exposed in technical tier; simplified to "its usual range of the past ten years" in expanded tier. |
| `firingRule` (voters only) | string | How the seat fires: the 30-day move threshold in its own units (from `SIGNAL_LEG_MOVE`) **or** level-only via the 10-year position bands (high > 80th pct, low < 20th pct). This is descriptive of the protected engine; the copy may simplify but never contradict it. |
| `source` | string | The named source at point of use (the CSV `source` + `source_ref`), e.g. "FRED (DFII10)", "CFTC COT futures-only, GOLD - COMEX (deafut.txt)", "derived: XAU ÷ XAG (gold-api legs)". |

### 3.3 Explanation fields (the seven owner dimensions)

| Field | Type | Rule |
|---|---|---|
| `whyGold.en/.fa` | string (1–3 sentences) | Why it matters for gold, in **cautious language** (§6.2 verb lists). State the channel (opportunity cost, pricing currency, safe haven, hedge demand, positioning) and its conditionality. Never "X makes gold rise". |
| `whenRises.en/.fa` | string | What a **higher** reading may mean — written through the indicator's **actual polarity** from `gold-score.ts` (the source of truth). For a −1 voter: "a rise typically presses on gold (…)". For a +1 voter: "a rise typically supports gold (…)". Include the honest caveat where the link is conditional (10 records the caveats). For non-voters: what the higher reading means for the comparison it frames, without a directional gold claim. |
| `whenFalls.en/.fa` | string | The mirror of `whenRises`, same discipline. |
| `analogy.en/.fa` | string \| OMITTED | Everyday analogy **only where it materially clarifies** (owner decision 19/§2.1: selective, never forced, never childish). ~9 of 52 indicators get one (09 marks the rest `—` with the reason implicit: the concept is already plain or an analogy would distort). Analogies must be honest about limits — a good analogy names where it breaks if that matters. |
| `visualReading.en/.fa` | string | What the selected visual shows: what is compared (current vs the 10-year range/band), where the current marker sits, the reference period, and what to notice (e.g. "the marker near the top edge means the reading is high in its decade, not that it is 'bad'"). Written against the **current** surface (02 map) so Session 4 can verify the data type still fits; Session 4 owns the visual form. |
| `relationships` | array of ids + short pointer | The conventional relationships this indicator participates in, by `record id` in `10-indicator-relationship-map.md` (e.g. `R-01 real yields ↔ gold`). The one-line version appears in the expanded tier; the full records live in 10 (one home, referenced everywhere — the §5.4 reuse rule). |
| `defaultCopy.en/.fa` | string (≤ 2 sentences) | The **default tier** sentence(s): the shortest useful explanation + the current state hook. This is what the closed card/popover headline shows. Written separately from the expanded explanation where the expanded adds real depth (master plan task 13); for most records the default copy is a strict prefix-compression of `whatItMeasures` + `whyGold`. |

### 3.4 State and tier fields

| Field | Type | Rule |
|---|---|---|
| `stateVocabulary` | enum set | The gold-impact states the surface may show for this indicator: `supports` / `pressures` / `steady` / `unread` (voters, from the seat contract) or `context` (non-voters; value + position + freshness only). Color semantics (green=supports, red=pressures, distinct neutral/unavailable) are locked by owner decision 24/§3.6; copy never uses "good/bad". |
| `blocked` (blocked records only) | object | `{ reason: 'licence' | 'source-dead' | 'no-clean-venue', disclosed: 'publication-notes (collapsed)', ownerLever: string }`. The record explains what the indicator would show and why it cannot — the honesty-first discipline; never a fake neutral. |
| `notes` | string | Authoring notes, drift warnings, cross-page homes (e.g. `nyfed-custody` renders inside /global's TIC section there), and Q1–Q4 dependencies where copy depends on owner answers. |

### 3.5 The complete-field rule (the coverage contract)

Every indicator record must carry ALL of: `plainLabel` (en+fa), `techName` (en+fa), `whatItMeasures` (en+fa), `whyGold` (en+fa), `whenRises` (en+fa), `whenFalls` (en+fa), `visualReading` (en+fa), `relationships`, `defaultCopy` (en+fa), and the measurement fields. `analogy` is the **only** optional field (omission is a decision, per §2.1 owner direction). The coverage report (09 §7) audits exactly this contract.

---

## 4. Progressive depth tiers (master plan §5.2, operationalized)

| Tier | Contains | Where it appears (design intent for Sessions 4–5) |
|---|---|---|
| **Default** | `plainLabel` · `defaultCopy` (1–2 sentences) · the visual with its current reading · the gold-impact state word (`supports`/`pressures`/`steady`/`unread`/`context`) | The closed card / seat chip / lane summary. Understandable without opening anything. |
| **Expanded** | + `whyGold` · `whenRises`/`whenFalls` · `analogy` (where present) · the relationship one-liners | The desktop popover / mobile bottom sheet (owner decision §2.1 interaction pattern). |
| **Technical** | + `techName` · raw value + `unit` · `source` + as-of · `referencePeriod` definition · `firingRule`/method · known limitations | A disclosure section inside the same popover/sheet; also the publication-notes home for the blocked quartet. |

**Sentence-count discipline:** length follows comprehension, not quota (master plan §5.2 end). Default copy ≤ 2 sentences; `whatItMeasures` ≤ 2; `whyGold` ≤ 3; `whenRises`/`whenFalls` ≤ 2 each. The coverage report flags any record that busts these budgets.

---

## 5. The label system — five groups and the label conventions

### 5.1 The five driver groups (audience-facing labels, finalizing the §9 direction)

The engine lane ids are frozen (protected); these are the audience-facing labels and one-line summaries that ride above them. They finalize the direction the (missing) 05 §9 would have proposed, per master plan decision 9 ("retain the five canonical categories… improve labels and explanations"). All wording is **pending runtime integration** (Session 5) and rides the fa manifest workflow then; recorded as S3-D4.

| Engine lane | Label EN (proposed final) | Label FA (proposed final) | One-line intro EN (proposed) | One-line intro FA (proposed) |
|---|---|---|---|---|
| `borrowing-costs` | **Interest rates & borrowing costs** | **نرخ بهره و هزینهٔ استقراض** | What cash pays to hold — when interest beats inflation by a wide margin, gold has a tough rival. | پولِ نشسته چه بازدهی می‌دهد؛ وقتی بهرهٔ واقعی بالا برود، طلا رقیبی سرسخت پیدا می‌کند. |
| `dollar` | **The US dollar** | **دلار آمریکا** | Gold is priced in dollars — a stronger dollar usually makes gold more expensive everywhere else. | طلا به دلار قیمت می‌خورد؛ دلارِ قوی‌تر معمولاً طلا را برای بقیهٔ دنیا گران‌تر می‌کند. |
| `stress` | **Market stress & uncertainty** | **تنش و عدم قطعیت بازار** | When money is frightened, it often runs to gold; calm markets take that bid away. | وقتی پول می‌ترسد، اغلب به طلا پناه می‌برد؛ آرامشِ بازار این تقاضا را برمی‌دارد. |
| `inflation` | **Inflation & inflation expectations** | **تورم و انتظارات تورمی** | Gold is bought as an inflation hedge — the hotter prices and expectations run, the stronger the case people make for it. | طلا به‌عنوان پوششی برابر تورم خریده می‌شود؛ هرچه قیمت‌ها و انتظارات داغ‌تر باشند، این نقش پررنگ‌تر می‌شود. |
| `flows` | **Trader positioning & flows** | **پوزیشن معامله‌گران و جریان‌ها** | What futures traders are doing with gold right now — very crowded bets can be fragile. | معامله‌گران بازار آتی الان با طلا چه می‌کنند؛ شرط‌بندی‌های شلوغ می‌توانند شکننده باشند. |

Design notes: (a) the labels keep the shipped corpus's semantic families (the current «هزینهٔ استقراش» → «نرخ بهره و هزینهٔ استقراض» adds the plain "interest rates" anchor a general visitor needs; «تنش بازار» → «تنش و عدم قطعیت بازار» names the uncertainty channel the lane actually measures); (b) each intro is one sentence, cautious-voiced ("usually", "often", "can be"), no good/bad framing; (c) the group **summaries** (the lane verdict words: relief/tight, strong/stress, elevated/calm, hot/cool, elevated/calm) keep the engine vocabulary — the audience words ride the summary sentence, the engine words stay in the technical tier.

### 5.2 Indicator label conventions

1. Plain noun phrases a visitor can parse before knowing finance: "Real yields (inflation-adjusted)" not "DFII10"; «بازده واقعی (خالص از تورم)».
2. Technical/ticker forms ride as secondary labels in parentheses or the technical tier: "VIX — the stock-market fear gauge" / «شاخص VIX، سنجهٔ ترس بازار سهام».
3. FA labels reuse the shipped corpus names (09 keeps every shipped `voterNames`/`cardNames` fa wording as the base — S3-D5) unless the record improves clarity; improvements are listed per-record and flagged for the manifest round at integration.
4. No label implies prediction: "conditions", "reading", "position" — never "signal to buy".

---

## 6. Bilingual copy rules (master plan §5.3, operationalized)

### 6.1 Native-voice rule

EN and FA are **authored separately** — same facts, same caution level, independent phrasing. FA is not a translation of EN: sentence order, idiom and rhythm follow Persian conventions (verb-final, «،» and «؛» cadence, the corpus's established register). Where a concept has an established corpus term («حباب» for the premium, «پوزیشن» for positioning, «بازده واقعی» for real yield), it is reused verbatim.

### 6.2 Cautious verb lists (the approved hedging vocabulary)

**EN (approved):** "may support", "can put pressure on", "is often associated with", "currently points to", "in this period", "typically", "historically has", "the usual pattern is", "tends to".
**EN (banned):** "will", "guarantees", "always", "proven to", "signals a buy/sell", "is about to", "must".
**FA (approved):** «می‌تواند از طلا حمایت کند»، «معمولاً بر طلا فشار می‌آورد»، «غالباً همراهِ … دیده شده است»، «در این دوره به … اشاره می‌کند»، «الگوی معمولش … است»، «تمایل دارد».
**FA (banned):** «قطعاً»، «همیشه»، «تضمین»، «سیگنال خرید/فروش»، «بدون تردید»، «حتماً خواهد».

**Correlation/causation discipline:** correlations are described as "move together / have moved together / tend to move in opposite directions"; mechanisms as "the channel is… / the mechanism usually works through…"; conditions never become predictions ("when X rises" describes the association, never "when X rises, gold will rise").

### 6.3 The fa-copy workflow discipline (this session vs Session 5)

The Persian-copy manifest gates **runtime dictionary strings** (`apps/web/src/**`). Session 3's fa copy lives in `docs/gold-redesign/09-*.md` as the authored content of record, written to the workflow's standards (native voice, no em dashes, glossary terms, ZWNJ, Persian digits in static text). At Session 5 integration, the strings enter the dictionaries and **then** ride the manifest round + `pnpm copy:audit` triage; the terminology additions this session introduces are recorded in `docs/localization/persian-terminology.md` now (S3-D6) so the manifest round has its reference. Nothing in the audit's covered sources changed this session (verified: no `apps/web/src` edits; `pnpm copy:audit` was not needed for a docs-only change, and running the full gate suite is not required for markdown-only deliverables — recorded honestly in the completion report).

### 6.4 No good/bad, no buy/sell, no false precision

- Color/state words describe the **relationship to gold** (supports/pressures), never the indicator's own virtue: a high VIX is not "bad", it is "stress elevated — usually supportive of gold".
- No record contains investment advice, price targets, probabilities of moves, or confidence percentages (master plan §8.4). Market-implied probabilities (Polymarket) are labelled as what markets price, not what will happen.
- Numbers in copy stay qualitative ("near the top of its decade range") unless the number IS the point (the spot price).

---

## 7. Module records (the 16 non-indicator surfaces)

Modules get a reduced schema (they are surfaces, not data series): `whatItShows` (en/fa), `honestState` (en/fa — the waiting/stale/blocked states it renders), `readsFrom` (its data plane), `relationships` (which indicator records it visualizes), and `copyHome` (the dictionary keys / engine module that own its wording today). The full set is 09 §6. This keeps every visible surface accounted for without pretending modules are indicators (master plan §5.4: "If an indicator has multiple distinct measures or views, explain the distinction").

---

## 8. The briefing/outlook vocabulary — drafts for owner review (Q1/Q2-dependent)

Master plan §2.1 locks the five plain-language outlook conditions and the qualitative evidence-consistency scale; S1-D6/F-02 record that the current "Conditions outlook" line is the balance re-worded and that its fate is an **owner-approval item (Q1)**. Session 3's job (task 10) is to draft the wording in both locales so the owner can review it alongside Q1/Q2. **Nothing here is decided for the runtime; these are review drafts** (S3-D7).

### 8.1 The five outlook conditions (master plan §2.1 wording, both locales)

| State (locked semantics) | EN draft | FA draft |
|---|---|---|
| Strongly supportive | "Conditions strongly support gold" | «شرایط به‌شدت از طلا حمایت می‌کند» |
| Moderately supportive | "Conditions moderately support gold" | «شرایط در حد متوسط از طلا حمایت می‌کند» |
| Mixed / unclear | "Conditions are mixed or unclear" | «شرایط مختلط یا نامشخص است» |
| Moderately pressuring | "Conditions moderately pressure gold" | «شرایط در حد متوسط بر طلا فشار می‌آورد» |
| Strongly pressuring | "Conditions strongly pressure gold" | «شرایط به‌شدت بر طلا فشار می‌آورد» |

Mapping note (for the owner's review): the engine's current 7-state `goldOutlookOf` (strong-bullish … strong-bearish, range-bound, mixed) is a **conditions-direction classifier**, not a forward-looking outlook (GB-S5's same-engine contract, protected §9.3). The five-state wording above would replace the 7-state *presentation* only if Q1 approves retiring the "Bearish" line; the honest one-line caveat («این توصیف شرایط فعلی است، نه پیش‌بینی» / "this describes current conditions, not a forecast") stays beside whichever wording ships. The genuine forward-looking briefing (headline + summary + reasons + what-could-change-this, horizon-labelled) is a Session 2/5 construct that must NOT be filled by relabelling this line (master plan §3.2 — locked).

### 8.2 Evidence-consistency words (locked semantics, wording drafted)

| Consistency (locked) | EN draft | FA draft |
|---|---|---|
| Broadly aligned | "Evidence is broadly aligned" | «شواهد عمدتاً هم‌جهت‌اند» |
| Mixed | "Evidence is mixed" | «شواهد مختلط‌اند» |
| Limited | "Evidence is limited" | «شواهد محدودند» |

### 8.3 Horizon labels (locked candidates, wording drafted)

| Horizon | EN | FA |
|---|---|---|
| 1–2 weeks | "over the next 1–2 weeks" | «در ۱ تا ۲ هفتهٔ پیش رو» |
| 1–3 months | "over the next 1–3 months" | «در ۱ تا ۳ ماه پیش رو» |
| 6–12 months | "over the next 6–12 months" | «در ۶ تا ۱۲ ماه پیش رو» |

Publish-only-what-a-method-supports (master plan §2.1) governs which of these ever render: the current model supports **none** as a validated forecast horizon (S1 F-02: no forward-looking methodology exists); a documented method is a prerequisite, owner-approved before implementation (§9.3).

### 8.4 The briefing template wording frame (from the master plan §3.2.1, both locales, for the Session 5 implementation)

1. **Headline** — one plain sentence. EN frame: "Gold: {direction phrase} — {condition state}." FA frame: «طلا: {عبارت جهت}، {وضعیت شرایط}.»
2. **Summary** — one sentence with the horizon IF a horizon is published.
3. **Evidence** — 2–3 reasons, each traceable to a lane/indicator record (the explanation system of this session is what makes every reason inspectable).
4. **What could change this** — one conditional caveat naming the most live uncertainty.
5. **Current conditions** — the separately-labelled balance line (the five-lane composition), never merged with 1–4.

---

## 9. Integration contract (Session 5)

1. Every record in 09 is keyed by the canonical `id` — the registry key never a display label (master plan §5.4). Session 5 transforms the records into dictionary entries (`insights-copy-{en,fa}.ts` or a dedicated gold-content module behind the same audit discipline), one mechanical pass, no re-authoring.
2. Runtime renders **only the selected locale** (locked): one record → two locale entries, never both in one view.
3. The fa strings enter the Persian-copy manifest through the round workflow (`pnpm copy:audit` → triage → `copy:audit:update`) with this session's terminology entries as the reference (S3-D6).
4. The relationship records in 10 become the Session 6 explorer's dataset (one home, referenced from each indicator's expanded tier).
5. The tier split maps to the interaction pattern: default = closed surface, expanded = popover/bottom sheet, technical = the sheet's disclosure section.

---

## 10. Session 3 acceptance walk (against the master plan §10 Session 3 criteria)

- **100% fa/en coverage for all required dimensions, or explicitly blocked with a documented reason** — the coverage report (09 §7) audits all 52 indicators + 16 modules field-by-field; the 4 blocked records carry their blocked dimension. ✅ (verified by the report's own audit table)
- **Runtime shows only the selected locale** — the design contract (§9.2) + no runtime change this session. ✅
- **Technical names preserved but secondary** — every record's `techName` rides the technical tier; labels are plain (§5.2). ✅
- **Explanations never turn correlations into causes or conditions into predictions** — the verb lists (§6.2), the relationship taxonomy (10 §2), and the per-record caveats enforce this; the honest-record backtest note (the model's own measured no-edge) is carried into the records that need it. ✅
- **Default copy short and understandable** — the ≤2-sentence budget + the coverage report's length audit. ✅
- **No unsupported market claims or investment recommendations** — §6.4 rules; no record contains advice, targets, or invented confidence. ✅

*This document is the content rulebook; the records live in 09; the relationships live in 10.*
