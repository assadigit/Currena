# PROPOSALS — additive sections menu (awaiting owner approval)

Session 2 (2026-11-27). Written after live source-verification from the sandbox
(see "Verification log" at the bottom — every endpoint below was probed today,
this session, with results recorded). Nothing here is implemented yet: the
owner reviews this menu and approves items; approved items become phases.

Context: Phase 1 (FAQ + glossary + sources band) is shipped on this branch.
The owner's new asks this session: **reliable data for the gold futures market**
and **the physical market**, plus any other proposals worth considering.

---

## A. Futures market band — "Paper market: COMEX gold futures" (id `gold-futures`)

**The owner's ask #1.** Today the page uses GC=F only as the trend chart's
quiet underlying (trend.ts); the reader never learns the futures market
exists, what the front month is, or how it relates to spot.

What the band shows (all plain-language, bilingual, house design):

1. **Front-month card** — proper contract name (e.g. "Gold Dec '26"), price,
   day change, day high/low, volume, updated stamp, honest "delayed" note.
2. **Futures vs spot basis** — front price minus the hero spot, both stamps
   visible (the store spot syncs once per UTC day; the futures leg is live),
   with the one-line why: futures usually sit above spot because the buyer
   carries storage + financing until delivery.
3. **Term-structure mini-table** — the next ~6 quarterly contracts (Feb, Apr,
   Jun, Aug, Oct, Dec '27), each with price and $ vs the front; one verdict
   chip for the whole curve: contango (normal) / flat / backwardation
   (unusual — often a tight-physical-demand signal), each word translated.
4. **Globex session chip** — open/closed, computed from the New York clock
   (deterministic, no data source needed).
5. **Beginner collapsible** — what a futures contract is, why it is "paper
   gold", why the front month matters, and a cross-link to the existing CFTC
   positions band (the two are the same market's price and its traders).

**Data (verified today):** Yahoo public chart/spark API — the exact pattern
trend.ts already uses (GC=F already feeds the trend chart; cache + TTL +
fail-closed already the house style). One spark call returns all contract
months at once. Verified live: front "Gold Dec 26" $3,652.8; GC=F volume
197,606; GCG27.CMX / GCJ27.CMX / GCM27.CMX all return valid quotes.

**Deliberately excluded (with reasons):** open interest per contract (Yahoo
does not publish it; the existing CFTC band tells positioning better); CME
direct quotes (blocks datacenter IPs — probed today, refused); EODHD futures
(daily quota exhausted today so unverifiable — and unnecessary, Yahoo is
already the repo's proven futures leg).

**Effort:** medium. **Risk:** low (new files + minimal mount insertions;
mounts after PhysicalBand per the placement law). **Checklist served:** the
average buyer's "where does this price even come from" — deepens #1/#4.

## B. Physical market (the owner's ask #2)

What already exists: Shanghai premium verdict (PhysicalBand), London vault +
clearing (its collapsible), the full Tehran board with per-instrument حباب
(BridgeBand). What is missing is the unified physical-vs-paper view and the
"how physical actually trades" education. Three proposals:

### B1. "One metal, four prices" unifier card (id `gold-four-prices`)

One table, one glance, every row with its own source and timestamp (house
honesty pattern):

| Venue | Today | vs spot | Why it differs (one line) |
|---|---|---|---|
| Global spot (XAU/USD store) | $x | — | the world's reference price |
| COMEX front future (from A) | $x | +$y | paper + carry until delivery |
| Shanghai premium (existing) | +z% | premium | China's physical buyers pay over spot when demand is strong |
| Tehran Emami حباب (existing) | +w% | premium | Iran's own premium — coin demand + supply |

Rides numbers already on the page plus the new futures row; no new source
beyond A. **This is my single best recommendation on the menu** — it answers
the exact confusion an average buyer hits first ("why does gold have four
prices at once?"). **Effort:** small–medium. **Risk:** low.

### B2. Physical venues explainer (education, static)

How physical gold actually trades around the world: London OTC (the wholesale
venue behind "spot"), COMEX New York (paper/settlement), Shanghai SGE (the
source of the premium), Tehran bazaar + union rate (where the board's coin
prices come from) — each with what premium/حباب means there, cross-linked to
the existing sections, "last reviewed" stamped. No data risk. **Effort:** small.

### B3. (Optional) Digital-gold row

TGJU carries PAXG/XAUt (the physical-backed token, $3,620.19 live today) —
one row in B1 or one card inside the future buying guide's "digital gold"
section, labeled exactly "a token claiming 1:1 physical backing — a market
price, not an endorsement". **Effort:** tiny.

## C. Already-planned phases (from PLAN.md, awaiting their sessions)

- **Phase 2 — the buying guide** (ways to own, purity checks, the اجرت/سود/VAT
  fee picture, storage, scams). The audit's Must-gap; medium–large.
- **Phase 3 — "Gold in 30 seconds"** dated plain read + ATH/record watch +
  why-people-hold-gold cards. Should; medium.
- **Phase 4 — tools strip** (in-content links to the calculators). Tiny.

## D. Rejected / blocked (nothing to approve here, reasons recorded)

- CME direct quotes API — anti-scraping block (probed 2026-11-27). Unusable.
- LBMA live benchmark JSON (prices.lbma.org.uk) — Cloudflare-challenged from
  this sandbox (probed today). LBMA data already lives in cited static tables.
  Can retry from production later if wanted.
- EODHD futures — daily quota exhausted today, unverifiable; unnecessary.
- ETF holdings driver — remains blocked upstream (licensing, R-26).
- IME gold-bar options (TGJU carries them) — too technical for this audience.
- Tehran retail price rows (retail_sekee etc. on TGJU) — would sit beside the
  existing board's market prices and invite two-numbers confusion; skip unless
  the owner wants a "what you'd actually pay at a shop" card in Phase 2.

## Recommended order (my suggestion)

1. A + B1 (one session — they share one new data leg and answer both asks),
2. Phase 2 (buying guide),
3. B2 + Phase 3,
4. Phase 4 (tiny, anytime).

---

## Verification log (probed 2026-11-27, ~15:20–15:35 UTC, from the sandbox)

| Endpoint | Result |
|---|---|
| Yahoo chart `GC=F` (front) | OK — "Gold Dec 26" $3,652.8, vol 197,606, day range, 52w range; instrument FUTURE/COMEX; meta has volume, no open interest |
| Yahoo spark `GCG27.CMX,GCJ27.CMX,GCM27.CMX` | OK — multi-contract in one call (fulldayPrice, previousClose, change%) |
| Yahoo chart `XAUUSD=X` / `XAU=X` | NOT FOUND — no spot symbol on Yahoo; basis pairs with the EODHD store spot (both stamps shown) |
| CME `CmeWS …/Quotes/Future/4378/G` | BLOCKED — "IP address blocked due to suspected web scraping" |
| LBMA `prices.lbma.org.uk/json/gold_pm.json` | BLOCKED — Cloudflare challenge page |
| EODHD real-time/search/exchange-list | "You exceeded your daily API requests limit" (key works; quota resets) |
| TGJU `call1.tgju.org/ajax.json` | OK — sekee 264,735,000 (rial), sekeb 255,560,000, retail_* rows, sekeb_blubber, geram18/geram24, mesghal, tether_gold_xaut $3,620.19, all with fresh ts |
| TGJU `api.tgju.org/v1/market/indicator/summary-table-data/sekee` | OK — full OHLC history, fa+en dates (the repo's own existing pattern for price_dollar_rl / geram18) |

Front-month identification note: today GC=F's `shortName` is "Gold Dec 26"
(sandbox date 2026-11-27), so the band must read the contract name from the
feed, never hard-code a month.

---

## OWNER DECISION (2026-11-27, session 2)

Approved: **A** (futures band), **B1** (four prices), **B2** (venues
explainer), **B3** (digital-gold row, as a card inside B1), **"Gold in 30
seconds"** and the **ATH record watch** (as one band).

Not approved / still pending: Phase 2 (buying guide), the why-hold-gold
cards, and everything under "Needs my approval" in PROGRESS.md.

The implementation work order for these approved items is
`docs/gold-page/SESSION-3-PROMPT.md` (self-contained; verified sources,
exact mounting + chip lines, quality gates). Extra anchors pinned for it
this session: NAV_SECTIONS chips are one-liners between `gold-other` and
`gold-faq`; the new cluster mounts between `<PhysicalBand/>` and
`<FaqBand/>` where `data`, `projection.data`, `rates.data`, `showIran`,
`locale`, `fmt`, `t` are in scope; `/api/gold/trend?range=all` serves all
eight windows (points + chgPct + source per window); the projection payload
carries 48 readings incl. `shanghai-gold-premium` with value/percentile/
from-peak fields; TGJU per-indicator endpoint verified for
`tether_gold_xaut` ($3,567.41 close, 2026-11-26 row).
