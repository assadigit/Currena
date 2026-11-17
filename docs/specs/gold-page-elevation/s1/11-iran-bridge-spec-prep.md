> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S1/11 — Iran Bridge: Spec Preparation (D6)

*The Iran bridge is the owner's answer A with an amendment: the staged
bridge card must carry the Tehran-market instrument prices — Seke
Emami, Seke 1-grami, and the rest of the family — alongside the parity
decomposition and the coin premium (حباب). This document is the spec
prep: what exists, what the numbers mean, what must be built, and what
must be verified before build. Implementation happens only after the
modularization program closes (standing constraint).*

## 1. What the bridge card is (product definition, draft)

A section of `/gold` that answers, in one screen, the Persian market's
most-asked question — *"why does the coin cost what it costs?"* — by
decomposing every Tehran instrument into its global and local parts:

```
XAUUSD (global ounce, USD)
   × USD/IRR free-market rate (نرخ آزاد)
   × pure-gold content of the instrument
   = intrinsic value (ارزش ذاتی) in toman
   ─ market price (TGJU quote)
   = premium / حباب (positive = above melt, negative = discount)
```

…presented as: (a) the live instrument board (all TGJU gold symbols,
toman), (b) the parity line for each coin, (c) the premium as a tracked
number with history, (d) one paragraph of honest interpretation
(dated, descriptive, never advice). Nobody in the Persian market
publishes the premium as a *computed, charted, interpreted series* —
TGJU prints prices, Saham Analiz has a USD-only calculator (S1/07).
This card is the differentiation claim of the whole program.

## 2. Data reality (what S1b verified — the re-pricing)

**Already in the repo, end-to-end (no new source needed):**

| Layer | File (verified read 2026-11-17) | What it provides |
|---|---|---|
| Ingestion | `packages/scraper/src/tgju.ts` | `call1.tgju.org/ajax.json` (primary) + 16 profile-page fallback; `TGJU_GOLD_SYMBOLS` maps all 9 instruments |
| Units | same + AGENTS.md §6 | TGJU prints Rial; the scraper converts ÷10 to **toman** (owner rule 2026-09-19) — the rial/toman question is already solved in code |
| Schema | `packages/core/src/schemas.ts` | `GoldId` / `GoldQuote` (`p` current, `h`/`l` day range, `dp` change %), `snapshot.gold` |
| Storage | KV snapshot (`currena:snapshot:tgju`), refreshed ~5 min (`docs/INDICATORS_AND_DATA_SOURCES.md` cron table) | Live quotes with `fetchedAt` staleness discipline |
| Display | `apps/web/src/components/LedGoldBoard.tsx` (on `/live-rates`, `/converter`) | The full طلا و سکه board with day stats — but **not** on `/gold` |
| FX leg | `price_dollar_rl` (base currency of the converter) | USD/IRR free-market rate, same feed, same snapshot |

**Live feed probe (2026-11-17, `call1.tgju.org/ajax.json`, 1052
symbols — all present):**

| TGJU slug | Instrument | `p` (Rial) | Day range (Rial) |
|---|---|---|---|
| `ons` | انس طلا (ounce, USD) | 3,883.92 | 3,883.92 / 3,883.92 |
| `sekee` | سکه امامی | 2,505,550,000 | 2,523,300,000 / 2,486,100,000 |
| `sekeb` | سکه بهار آزادی | 2,414,050,000 | 2,431,300,000 / 2,391,500,000 |
| `nim` | نیم سکه | 1,319,300,000 | 1,329,700,000 / 1,310,300,000 |
| `rob` | ربع سکه | 711,900,000 | 719,300,000 / 704,100,000 |
| `gerami` | سکه گرمی | 360,000,000 | 360,000,000 / 360,000,000 |
| `geram18` | طلای ۱۸ عیار (per gram) | 245,674,000 | 247,714,000 / 243,905,000 |
| `geram24` | طلای ۲۴ عیار (per gram) | 327,562,000 | 330,283,000 / 325,204,000 |
| `gold_mini_size` | طلای دست دوم (per gram) | 242,398,090 | 244,411,600 / 240,653,350 |
| `mesghal` | مثقال | 1,064,150,000 | 1,073,050,000 / 1,056,550,000 |
| `price_dollar_rl` | دلار آزاد | 2,687,050 | 2,699,000 / 2,658,600 |

TGJU's own timestamp on the Tehran rows: ۲۵ آبان (25 Aban 1405 =
2026-11-16). Values are observations, not assertions about "the" price;
the card must carry the same as-of discipline the rest of the page
uses.

**What does NOT exist yet (the actual build list):**
1. Gold-symbol **history** — only current snapshots are stored (FX has
   `rate-history`; gold has none). See §6.
2. The **premium computation** (pure derived series — §5).
3. The **gold-page presentation** (the card itself, both locales).
4. Interpretation copy + education on-ramp (S7 scope).

## 3. Instrument specification table (CBI mint specs — VERIFY IN S4)

The premium needs each instrument's pure-gold content. Standard
published specifications (Central Bank of Iran / Iran Mint), to be
re-verified against primary sources in S4 before any computation ships:

| Instrument | Total weight | Fineness | Pure gold | Troy oz (pure) | Verify flag |
|---|---|---|---|---|---|
| سکه امامی (full) | 8.133 g | 0.900 | 7.3197 g | 0.23542 | standard, verify vs CBI |
| سکه بهار آزادی (full, new design) | 8.133 g | 0.900 | 7.3197 g | 0.23542 | same spec as Emami; design difference only |
| نیم سکه | 4.0667 g | 0.900 | 3.6600 g | 0.11771 | verify |
| ربع سکه | 2.0334 g | 0.900 | 1.8301 g | 0.05886 | verify |
| سکه گرمی | ≈1.0149 g | 0.9999 | ≈1.0148 g | ≈0.03263 | **weight convention uncertain — must verify** (some sources quote exactly 1 g pure + alloy) |
| مثقال (unit) | 4.6083 g of refined gold | — | 4.6083 g | 0.14812 | unit definition vs TGJU quote — see §4 puzzle |
| طلای ۱۸ عیار | per gram | 0.750 | 0.75 g | 0.02411 | per-gram quote; no coin premium concept — parity ≈ melt |

**S4 must pin these from primary sources** (CBI / Iran Mint / a
numismatic reference), because the premium is only as honest as the
pure-gold content. The 900-fineness full-coin spec is the
market-standard figure; treat everything above as "widely published,
unverified by this program yet".

## 4. The unit-convention puzzle found in the probe (S4 item)

Using the probe values: `geram24` implies a 24k gram at 327,562,000
Rial, so a mesghal (4.6083 g of 24k) "should" quote ≈ 1,509,600,000
Rial — but `mesghal` quotes 1,064,150,000 Rial. The naïve arithmetic
does not reconcile (ratio 3.249 g-equivalent, not 4.6083). Possible
explanations (to verify, not guess): the TGJU mesghal quote follows the
bazaar convention for *melted gold (طلای آب‌شده)* with a different
karat/weight convention, or it embeds a different market (maker)
adjustment. `s1/11` records this openly: **the premium engine must not
include mesghal until S4 resolves its quote convention.** The coin
family (Emami, Bahar, half, quarter, gerami) is unaffected — their
parity arithmetic is clean (§5).

Also note `geram18`/`geram24` reconcile exactly at ratio 24/18 = 1.3333
(observed 1.3332) — consistent per-gram quotes; `gold_mini_size`
(دست دوم) sits slightly below `geram18` as expected for used gold.

## 5. The premium (حباب) — formulas and a worked sanity check

**Formulas (per instrument, computed at snapshot time):**

```
toman_per_oz  = XAUUSD(ons.p) × price_dollar_rl.p ÷ 10        // USD→toman
intrinsic     = toman_per_oz × pure_oz_content(instrument)      // toman
premium_abs   = market_p ÷ 10 − intrinsic                       // toman
premium_pct   = premium_abs / intrinsic × 100                   // %
```

Note the two independent price legs: the ounce in USD (`ons`) and the
free-market dollar in rial (`price_dollar_rl`) — both already in the
same TGJU snapshot, so the premium is computed from one consistent
observation set (no cross-source timestamp skew).

**Worked sanity check on the probe values (2026-11-17 observation,
rounded, sanity-check grade only):**

- toman_per_oz = 3,883.92 × 268,705 = **≈ 1.0436 billion toman**
- Emami: intrinsic = 1.0436B × 0.23542 ≈ **245.7M toman**; market
  250.555M → **premium ≈ +4.9M toman (+2.0%)**
- Gerami: intrinsic = 1.0436B ÷ 31.1035 × 1.0148 ≈ **34.05M toman**;
  market 36.0M → **premium ≈ +1.95M toman (+5.7%)**
- Sanity shape: small coins carry visibly higher premiums than full
  coins — matches the well-known market pattern. ✓

A ~2% Emami premium is historically low (crisis regimes have printed
20–40%+); the *level*, its history, and its regime changes are exactly
what the chart will make visible. (All numbers above are one dated
observation, not a claim about today.)

**Why this series is the prize.** The premium fuses three stories in
one number: global gold (USD), the rial's shadow price (free-market
USD/IRR), and Tehran-market local demand pressure (scarcity, hoarding,
sanctions-period distortion). It is simultaneously the best education
device (Chain 2 + Chain 8 in one chart) and the most defensible
differentiator — nobody computes it, charts it, and explains it.

## 6. History strategy (the only genuinely new data work)

The premium's value compounds with history. Options, in build order:

1. **Forward accumulation (zero new cost).** From launch day, append
   each computed premium row to a dated KV/D1 series (the snapshot
   cadence is ~5 min; store one row per day close + intraday
   extrema). This starts the clock immediately.
2. **Backfill from TGJU profile history (S4 verifies).** Each
   `tgju.org/profile/<slug>` page exposes historical series (the
   scraper already parses these pages as the ajax fallback — the
   parser extension is mechanical but must respect the same fetch
   discipline). Backfills `ons`, `price_dollar_rl`, and the coin
   quotes; the premium history is then *computed* from the three
   backfilled legs — never scraped as a claim.
3. **EODHD cross-check leg.** `XAUUSD.FOREX` daily works (S1/09) —
   useful as an independent ounce verification, not as the primary
   (TGJU `ons` is the same snapshot family as the rial leg; EODHD has
   no IRR series).

Caveat to document in the card: pre-launch premium history inherits
TGJU's own data history and revision practice; the card's honesty line
should distinguish "computed live from our snapshots" vs "reconstructed
from source history".

## 7. Presentation and UX decisions for S6 (draft positions)

- **Units:** toman as canonical (the repo's rule), rial shown as
  secondary notation where needed; the ÷10 is owner-settled — do not
  reopen.
- **Locales:** full FA/EN bilingual, like the rest of the page; the FA
  copy owns the term حباب with an EN gloss ("coin premium over melt").
- **Placement (S6 decides):** a dedicated "پل ایران / The Iran bridge"
  section below the global conditions meter (global-first identity,
  local bridge second — matches the owner's A answer), NOT in the hero.
- **Relationship to `LedGoldBoard`:** one data plane (`snapshot.gold`),
  two presentations — the LED board stays on `/live-rates`;
  `/gold` gets the analytical card (parity + premium + interpretation).
  Never duplicate the board markup; reuse the schema.
- **Staleness & failure:** same fail-closed culture — dashes, never
  guesses; TGJU's Tehran rows quote on Tehran market days (the
  timestamp column must render, e.g. "۲۵ آبان", converted for EN).
- **Interpretation copy (S7):** descriptive, dated, no advice, no
  political commentary; the premium is a *market-structure* reading
  (scarcity/demand pressure), and the copy should teach the
  decomposition, not forecast the coin.

## 8. Phased build proposal (for the S8 roadmap)

| Phase | Contents | New data? | Complexity |
|---|---|---|---|
| Bridge-1 (the owner's A) | Instrument board (all TGJU gold symbols) + parity lines + live premium numbers + one-paragraph interpretation | none | Low — assembly of existing snapshot + one derived calc |
| Bridge-2 | Premium history chart (forward accumulation + TGJU backfill), premium deciles/percentiles (the page's statistical identity applied to حباب), event annotations | history backfill | Medium |
| Bridge-3 | Education deep-dive (Chain 8 explainer), premium-vs-dollar decomposition contributions, optional alerts | none | Low-medium |

## 9. Open items (S4 / S6 / S7)

1. S4: verify CBI mint specs (§3), resolve the mesghal convention
   (§4), verify TGJU ToS/redistribution terms for the profile-history
   backfill (§6) and confirm the ajax feed's rate limits for the
   existing cadence.
2. S4: pin the gerami coin's exact weight convention (1.000 vs 1.0149 g
   total).
3. S6: exact section slot, mobile behaviour of the 11-glyph toman
   values (the LED board's pattern: one column below md), and whether
   the ounce row joins the card or stays implied in the parity line.
4. S7: the interpretation copy grammar (what a +2% vs +25% premium
   "means", with historical regime examples — Episode Explorer cross-
   link, Idea 4).
5. S8: sequencing vs the other P1 candidates (the narrative, Idea 1,
   remains the cheapest headline win; Bridge-1 is the biggest
   differentiation win).
