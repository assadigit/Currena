# Currena Insights: Step 2 Add List

Page: https://currena.ir/#/insights
Audience: a regular person in Australia who wants digested global finance information for savings and investments.

## How to use this file

> **Implementation record (2026-10-13):** Step 2 is COMPLETE and live-verified
> — every box below that is ticked passed its Section G check (see
> docs/evidence/step2-audit/ for the fresh full-page screenshots, en/fa/mobile,
> and CHANGELOG.md §2026-10-13 for the itemised record). Section C (the two
> optional cards) is NOT ticked: it was not approved, so nothing was built.
> Noted decisions: (1) iron ore keeps the World Bank Pink Sheet source —
> FRED's PIORECRUSDM mirror of the same series lags ~2 months (verified:
> WB carries Sep 2026 = 97.7 while FRED ends Jul 2026); (2) the FRED
> release-dates API needs an API key the project does not hold, so US
> calendar dates are hand-maintained in data/insights-calendar.json after
> verification (a key is the documented future upgrade); (3) the RBA's
> deposit-rate table is F4.1 "Paid Deposit Rates" — the old F5 layout no
> longer exists (venue-verified 2026-10-13).

This is Step 2 of 3.

1. **Step 1 (done):** fix everything wrong on the existing page.
2. **Step 2 (this file):** add the few missing indicators that matter to this audience.
3. **Step 3 (later):** build verdicts that change with the live numbers, using only math and economic rules, no LLM.

Rules for the coding agent:

- Add only what is listed in Section B and, if approved, Section C. Do not add anything from the "Do not add" list in Section F.
- Every new card must follow the card spec in Section A.
- Tick a box only after the check in Section G passes.
- Series IDs and table names below come from general knowledge. **Confirm each one exists and is current before building.** If one has changed, use the current equivalent and note the change.
- Do not break anything fixed in Step 1. Re-run the Step 1 checks (Section J of the Step 1 file) on the new cards too.

## Why this list is short

An indicator earns a card only if all four are true:

1. A regular person can understand it in one sentence.
2. It could change something they do or watch (where they save, their mortgage, what they invest in).
3. It is free, reliable and legally usable.
4. The page does not already cover it.

Fewer cards that are correct and well explained are better than many cards that go stale or contradict each other.

---

## A. Rules that apply to every new card

- [x] **Store history, not just the latest value.** Step 3 needs it. Keep at least 10 years of monthly data and at least 2 years of daily data (10 years if the source allows) for every new series. Store history in a form your daily refresh can append to and your page can read.
- [x] **Use this card spec for every new card.** Write it down in code or config and show it on the page where relevant:
  - Plain-language title (no jargon)
  - Source name, series ID or table, and a link
  - How often the source updates
  - How old the data may be before the card shows "stale" (monthly series: 45 days, weekly: 10 days, daily: 4 days)
  - Unit (use percentage points for rates, % only for prices and indexes)
  - "Scored" or "context only" (to avoid the Step 1 contradiction about oil)
  - Two lines on what it means, written as a condition, never as a forecast
  - "Data for" date, "published" date and "fetched" date
- [x] **Check licences before going commercial** for every source used.
- [x] **Check request limits.** If the daily refresh runs on a free tier (for example Cloudflare's free Workers plan allows about 50 outside requests per run), add the new series without exceeding the limit. Split work across several scheduled runs if needed.
- [x] **Never show a stale value as current.** If a fetch fails, keep the last good value and mark it stale.
- [x] **Use the same wording rules as Step 1.** No "will go up/down", "should", "time to", or "expected to".

## B. Add these (required)

- [x] **1. RBA cash rate (currently 4.60%).**
  - Source: RBA statistical tables (cash rate target). Confirm the table.
  - Updates: after each RBA decision (the next is Tuesday 3 Nov 2026). Check daily.
  - Scored or context: context only (the policy rate itself); the verdict logic comes in Step 3.
  - What it means (draft): "This is the Reserve Bank's official rate. It sets the direction for savings, term deposit and home loan rates."
  - Also show the last change (date and size) and the next decision date.
  - Place it next to the existing home-loan rate card and make both read from the same status.
- [x] **2. Australian 10-year government bond yield.**
  - Source: RBA statistical tables for government bond yields (confirm the table), or the nearest free official source.
  - Updates: daily.
  - Scored or context: scored (use the "10-year position" because it is a rate).
  - What it means (draft): "This is what the Australian government pays to borrow for 10 years. It influences fixed home loan rates and term deposits."
  - Show the US 10-year yield beside it for comparison.
- [x] **3. US unemployment rate.**
  - Source: FRED `UNRATE`.
  - Updates: monthly.
  - Scored or context: scored.
  - What it means (draft): "A steady rise in unemployment is usually the first sign of a slowing US economy."
- [x] **4. Recession alarm (Sahm rule).**
  - Source: FRED `SAHMREALTIME`.
  - Updates: monthly.
  - Scored or context: scored.
  - What it means (draft): "This flags when US unemployment is rising fast enough that a recession has usually already started. A reading of 0.50 or more is the standard signal."
  - Explain the rule in one plain line on the card.
- [x] **5. Market fear gauge (VIX).**
  - Source: FRED `VIXCLS` (check its licence) or the stock-price feed you already use.
  - Updates: daily.
  - Scored or context: scored.
  - What it means (draft): "This measures how nervous US stock market investors are. Low means calm, high means fear."
  - Thresholds for "calm" and "nervous" are decided in Step 3 from the stored history. For now show the value and its 10-year position.
- [x] **6. Iron ore price.**
  - Source: FRED `PIORECRUSDM` (monthly). Use a daily source only if it is free and legally usable.
  - Updates: monthly.
  - Scored or context: context only.
  - What it means (draft): "Iron ore is Australia's biggest export. Its price influences the Australian dollar and the large mining shares on the ASX."
  - Keep the existing relationship card that mentions iron ore, and make it read from this new card.
- [x] **7. Make the "Savings and interest" card use a real savings or deposit rate.** (This finishes the Step 1 item.) Use an RBA deposit-rate table (confirm), show the data month, and use the right icon.

## C. Optional (add only if approved)

- [ ] **Australian petrol price.** Source: Australian Institute of Petroleum weekly prices. Context only. It links oil to household costs.
- [ ] **Australian dollar against the Chinese yuan.** The ECB reference rates in your existing feed already include the yuan. Calculate AUD/CNY as the CNY per EUR rate divided by the AUD per EUR rate. Context only.

## D. Calendar

- [x] Keep only the events that move Australian money:
  - [x] RBA decision
  - [x] ABS CPI
  - [x] ABS jobs report
  - [x] Fed decision
  - [x] US CPI (next: 14 Oct 2026)
  - [x] US jobs report
- [x] For US events, use the FRED release-dates API if it fits your limits. *(recorded decision: the API needs a key the project does not hold — dates hand-maintained after verification; a key is the documented future upgrade)*
- [x] For Australian events, use the ABS and RBA calendars. *(ABS Labour Force dates read from abs.gov.au; RBA dates were verified in Step 1)*
- [x] Follow the Step 1 date rule: store each event as a plain date plus its own time zone, with no conversion through UTC. Show the decision day, not the first day of a meeting.

## E. Placement on the page

- [x] Put each new card in the existing area where it fits best. Suggested placement:
  - RBA cash rate and Australian 10-year yield: next to the Australian home-loan rate and interest-rate cards.
  - US unemployment and Sahm rule: a "US economy" group, or next to the US inflation card.
  - VIX: next to the market stress and stock cards.
  - Iron ore: next to the commodity price cards and the relationship card that uses it.
- [x] If an existing area cannot take a card, create one clearly named area and tell the owner before adding it. *(not needed — every card fit an existing question group)*
- [x] Update the hero counts and verdict words by the same mapping rule used in Step 1 (one rule for all areas). Do not hardcode a new rule for the new cards. *(the E1 rule stays the one mapping — the new voters flow through it unchanged)*

## F. Do not add (out of scope for this audience)

Do not build these in Step 2. They can come later in a folded "Advanced" section if the audience grows.

- Credit spreads and other bond-market stress gauges
- Natural gas prices
- GDPNow, jobless claims, payrolls
- US factory surveys, retail sales, industrial production
- Supply chain pressure, shipping rates, tariffs, customs duties
- Food prices, copper prices
- Japan interest rates, Fed balance sheet, the US 30-year yield and term premium
- Stock valuation (CAPE), geopolitical risk index, central bank gold buying, China property
- Emerging-market currencies, household debt and arrears, consumer sentiment
- Equal-weight versus cap-weight S&P 500

## G. How to confirm each card is done

- [x] The card shows its source, link, data date, published date and fetched date.
- [x] The value matches the official source (RBA, ABS, FRED) at the moment of checking.
- [x] Units are correct (percentage points for rates, % only for prices and indexes).
- [x] History for the series is stored and covers the minimum period in Section A.
- [x] The stale tag appears when the data is older than the allowed age (test it by faking an old date).
- [x] The card text matches its status and contains no forecast wording.
- [x] The card is marked "scored" or "context only", and the hero count follows that.
- [x] The calendar shows the correct decision dates and countdowns.
- [x] A weekend test: no trading date shown is a Saturday or Sunday.
- [x] A fresh screenshot of the full page has been taken and sent back for a second audit.

## H. After Step 2

Step 3 (verdicts) will use the stored history from this step. Examples of what it will compute:

- Stock market state (bullish, correcting, range) from price against moving averages and distance from the 52-week high.
- Whether the usual relationships between markets (for example the dollar and gold) are currently working, using rolling correlations.
- A calm, nervous or fearful reading from VIX, based on its own history.

Nothing in Step 2 should be hardcoded in a way that blocks those calculations. Keep the numbers and history in a simple, consistent format.
