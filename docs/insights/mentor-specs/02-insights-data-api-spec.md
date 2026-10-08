> **Provenance:** delivered by the UI/UX mentor session on 2026-10-08 (round 1). Kept for reference.
> **The repo's `../03-data-sources.md` is the register of record** (it already holds the verified licence verdicts, including that FRED CSV access is keyless via `fredgraph.csv`, and the Phase I0 decisions D1 to D3). Where this file differs, `03-data-sources.md` and `AGENTS.md` win. Use this file for the new-indicator roster, formulas, proposed alert rules (approved by the owner on 2026-10-08) and the licence cautions (S&P 500, VIX, ECB-via-FRED are third-party restricted).

# Currena Insights — data and API specification

**Date:** 2026-10-08. **Audience:** the coding agent and the owner.
**Status of facts.** I checked official pages in this session for the items marked ✅. Items marked 🔎 come from secondary summaries, so confirm them on the official page. Items marked ❓ I could not verify. I have not seen the owner's pipeline code, so this file gives endpoints, rules, and formulas, not edits to existing code. The one complete script is `dollar_basket.py`.

## 0. The short version

- Commercial use is "not now, maybe later". So every source below carries a licence class: **Green** (free, commercial use allowed with attribution), **Amber** (confirm terms before public or commercial use), **Red** (do not launch without written permission).
- **Correction to my earlier suggestion:** the S&P 500 and the VIX on FRED are third-party copyrighted series, and so is the ECB policy rate on FRED. They are gated (section 2).
- Oil from public sources is normally about a week old. The page must stop calling it "stale" (section 3).
- Bitcoin and copper prices are available from the gold-api.com feed you already use (section 3).

---

## 1. Licence findings that drive the choices

| # | Source | What the terms say | Confidence |
|---|---|---|---|
| 1 | **FRED API** | Free key. You must show this notice prominently: "This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis." You must not use "FRED" in a host name, must not imply endorsement, and must show users a link to the FRED API terms. Series whose notes contain the word "Copyright" are owned by third parties. For anything beyond personal use you must get the data owner's permission, and FRED cannot give it. | ✅ |
| 2 | **FRED prohibited uses** | The terms list applications connected with "professional services regulated by state licensing regimes". A buy/sell signals section may fall near this. Get a legal reading before you launch the signals section. | ✅ |
| 3 | **RBA** | Most material is CC BY 4.0 with attribution "Source: Reserve Bank of Australia [year]". The Cash Rate and "Financial Data" have special terms: personal or commercial use is allowed if you do not imply RBA endorsement, and you must not charge for access without telling customers the data is free on the RBA site. Material labelled with a third-party source is excluded. | ✅ |
| 4 | **ABS** | Creative Commons Attribution 4.0 (attribute the ABS). Confirm on the ABS copyright page. | 🔎 |
| 5 | **ECB data** | Free reuse with attribution. Confirm on the ECB copyright page. | 🔎 |
| 6 | **Frankfurter** | Free, no key, no documented rate limit (fair use expected). ECB reference rates, back to 1999, published about 16:00 CET on working days. | 🔎 |
| 7 | **gold-api.com** | Terms effective 10 Sep 2026 say commercial use is always permitted. No rate limit on real-time prices. Assets include XAU, XAG, XPT, XPD, HG (copper), BTC, and ETH. There is no oil. History is described for gold and silver. | ✅ |
| 8 | **EIA (US government)** | Free API key. Brent and WTI spot prices are daily values published in weekly batches. | 🔎 |
| 9 | **TGJU** | The screenshot shows TGJU as the gold-ounce source. Its terms are unverified. | ❓ |
| 10 | **World Bank Pink Sheet** | Monthly commodity prices (iron ore, copper). The World Bank open-data licence is CC BY 4.0. Confirm on the World Bank site. | 🔎 |

**Rule for the agent:** before using any FRED series, call `https://api.stlouisfed.org/fred/series?series_id=<ID>&api_key=<KEY>&file_type=json`. If the `notes` field contains "Copyright", mark the series Amber or Red and do not publish it.

---

## 2. Corrections and gated items

| Item | What I suggested earlier | What to do now |
|---|---|---|
| **S&P 500** (FRED `SP500`) | Add as the stock-level indicator | **Red / gated.** Notes say S&P Dow Jones Indices owns it and reproduction needs prior written permission. FRED also needs the data owner's permission for non-personal use. Gate it. |
| **VIX** (FRED `VIXCLS`) | Add as the fear gauge | **Red / gated.** Notes carry a Cboe copyright. Gate it. |
| **ECB rate** (FRED `ECBDFR`) | Add from FRED | **Amber.** Notes carry an ECB copyright "reprinted with permission". Use the ECB Data Portal directly instead (section 3). |
| **ASX 200** | Optional | **Gated.** No free, legitimate index feed found. |
| **Natural gas** | Optional | Skip in v1. The free series is US Henry Hub, a weak link to Australian bills. |
| **Interim fear gauge** | — | Use the St. Louis financial stress index (already on the page) plus the Chicago Fed National Financial Conditions Index (`NFCI`, weekly). Verify its notes for "Copyright" first. |

**Unblocking the gated items:** either ask S&P Dow Jones Indices and Cboe for written permission, or pick a licensed data vendor whose terms allow public display. Do not store the full 10-year history of a gated series on your own server.

---

## 3. Indicator roster: new and changed items

Freshness limit = the age after which the item is marked "stale" (see section 5, rule 6).

| ID | Name | Source and endpoint | Frequency | Normal delay | Stale after | Licence |
|---|---|---|---|---|---|---|
| `us_cpi_yoy` | US inflation (yearly) | FRED `CPIAUCSL`. Compute the 12-month % change. | Monthly | About 2 weeks after month end | 50 days | Green (verify notes) |
| `fed_target` | Fed rate (target range) | FRED `DFEDTARL` and `DFEDTARU` (lower and upper). Show as a range, e.g. "3.50–3.75%". | Daily (changes at meetings) | 1 day | 5 days | Green (verify notes) |
| `ecb_dfr` | ECB deposit rate | ECB Data Portal `https://data-api.ecb.europa.eu/service/data/FM/D.U2.EUR.4F.KR.DFR.LEV?format=csvdata&startPeriod=2016-01-01` (series key confirmed on the ECB portal) | Daily | 1 day | 7 days | Green (🔎 confirm ECB terms) |
| `eur_usd` | Euro per US dollar | Frankfurter `…/latest?base=USD&symbols=EUR` | Daily | 1 working day | 4 days | Green |
| `dollar_basket` | Currena dollar basket (replaces the stale broad dollar index) | Computed by `dollar_basket.py` from Frankfurter | Daily | 1 working day | 4 days | Green |
| `nfci` | US financial conditions | FRED `NFCI` | Weekly | About 1 week | 14 days | Green (verify notes) |
| `au_home_loan` | Home-loan rate people actually pay | RBA table F6, owner-occupier outstanding loans: `https://www.rba.gov.au/statistics/tables/csv/f6-data.csv` | Monthly | About 25 business days after month end (RBA states this) | 70 days | Green (RBA terms) |
| `au_home_loan_adv` (optional) | Advertised variable rate | RBA table F5: `https://www.rba.gov.au/statistics/tables/csv/f5-data.csv` | Monthly | Monthly | 70 days | Green (RBA terms) |
| `au_wage_growth` | Wage growth (yearly) | ABS Wage Price Index (dataflow `WPI`), total hourly rates excluding bonuses, all sectors. Compute the 12-month % change. | Quarterly | About 6 weeks after quarter end | 130 days | Green (🔎 ABS terms) |
| `au_rent_yoy` | Rent inflation (yearly) | ABS CPI dataflow (`CPI`), item "Rents". Compute the 12-month % change. | Monthly | About 4 weeks | 70 days | Green (🔎 ABS terms) |
| `au_petrol_yoy` | Petrol prices vs a year ago | ABS CPI dataflow, item "Automotive fuel". Compute the 12-month % change. This is an index, not a pump price. | Monthly | About 4 weeks | 70 days | Green (🔎 ABS terms) |
| `btc_usd` | Bitcoin price | gold-api.com, symbol `BTC` (read gold-api.com/docs for the exact URL ❓) | Live | Seconds | 2 days | Green |
| `copper_usd` | Copper price (face value) | gold-api.com, symbol `HG` ❓ (check unit: per pound or per tonne) | Live | Seconds | 2 days | Green |
| `brent` (changed) | Oil (Brent) | Keep FRED `DCOILBRENTEU` (EIA). | Daily, published in weekly batches | About 1 week | **12 days** (was 7) | Green (verify notes) |
| `gold`, `silver` (changed) | Gold and silver | gold-api.com `XAU` and `XAG` as the primary source. Convert to AUD with the Frankfurter AUD rate. | Live | Seconds | 2 days | Green |

**Notes on specific rows**

- **Brent.** Show "latest official daily price, as of {date}". A same-day oil price needs a licensed futures feed, which is not free ❓.
- **Copper.** Use the live `HG` price for the face value. Keep the World Bank monthly series only for the 10-year position and the copper-to-gold ratio history.
- **Gold and silver.** Prefer gold-api.com as the primary source. Keep TGJU out of anything public or commercial until its terms are confirmed.
- **Home-loan rate.** F6 shows what borrowers actually pay on average. F5 shows advertised rates. The column headers change over time, so find the column by matching the words "Owner-occupier" and "Outstanding", then check the value by hand once.
- **ABS.** Reuse the existing ABS client that already pulls CPI and unemployment. The ABS Indicator API takes no custom queries (verified), so use the ABS Data API for WPI and CPI items, and read each dataflow's structure to find dimension codes.
- **Bitcoin.** gold-api.com offers no multi-year history. Show the 7-day and 30-day changes from your own stored daily snapshots. Skip the 10-year position for Bitcoin.

---

## 4. Calculations and proposed alert rules

**Definitions (use the same code for every item)**

- `change_7d` and `change_30d`: percent change against the last observation on or before that many calendar days earlier. For monthly or quarterly series, use `change_1p` (previous period) and `change_12m` instead.
- `percentile_10y`: the share of observations in the last 10 years that are less than or equal to the latest value, from 0 to 100.
- `position_word`: below 20 → "low" ("cheap" for prices). From 20 to 80 → "typical" ("normal" for prices). Above 80 → "high" ("expensive" for prices).
- `move_score` (for the big-mover callout): `(latest change − mean of that change over 10 years) / standard deviation`. Use the 30-day change for daily series and the 1-period change for slower series. Flag an item when `abs(move_score) >= 2.0` (suggested; tune after you see the history). Exclude stale items.

**Proposed alert rules for new scored indicators** (the owner approves each one)

| ID | Alert when… | Why |
|---|---|---|
| `us_cpi_yoy` | Yearly rate is 3.0% or higher | Mirrors the 3% rule used for Australian CPI |
| `fed_target`, `ecb_dfr`, `au_home_loan` | Percentile is 90 or higher | Same rule type as the existing yield cards |
| `dollar_basket` | Percentile is 90 or higher | A very strong dollar |
| `nfci` | Value is above 0 | Zero is average. Above zero means tighter than average. |
| `au_wage_growth` | Wage growth is below yearly CPI | "Pay is not keeping up with prices" |
| `au_rent_yoy` | Percentile is 90 or higher | Rents very high versus recent history |

**Gauges.** A gauge reading comes from the share of its scored, non-stale members that are in alert.

| Share in alert | Step | Meaning |
|---|---|---|
| 0 | 1 | First (calmest) verdict label |
| Up to one third | 2 | Second label |
| Up to two thirds | 3 | Third label |
| Above two thirds | 4 | Fourth label |

**Verdict per region:** the rounded average of its gauge steps. If any gauge is at step 4, the verdict is at least step 3. The thresholds are proposals. Before launch, compute how often each label would have appeared over the last 10 years and tune them.

**Gauge members (version 1)**

*Global*
1. **Is borrowing getting costlier?** `DGS10`, `DFII10`, `T10Y2Y`, `fed_target`, `ecb_dfr`, government interest burden.
2. **Are prices heating up?** `us_cpi_yoy`, `T5YIFR`. (Brent feeds the big-mover callout, not this gauge.)
3. **Are markets nervous?** `STLFSI4`, `nfci`, gold-to-silver ratio (tag "mixed").
4. **Is the dollar strong?** `dollar_basket`, USD/JPY.
5. **Is growth healthy?** China PMI, US money supply `M2SL`, copper-to-gold ratio.

*Australia*
1. **Are inflation and rates a problem?** CPI, trimmed-mean CPI, AU–US 10-year spread. (RBA cash rate and petrol are context items.)
2. **Are households under pressure?** `au_home_loan`, `au_wage_growth`, `au_rent_yoy`, household debt to income, unemployment, house prices.
3. **How is trade and the currency?** AUD/USD, AUD/JPY, terms of trade, iron ore. (Gold in AUD is a context item.)

**Counts:** Global has 16 scored indicators and Australia has 13, so 29 in total. The count may change if you re-assign context items.

---

## 5. Snapshot data format (what the page reads)

One object per item. The page must not call any external API at view time.

```json
{
  "id": "brent",
  "type": "price",
  "group": "inflation_pressure",
  "value": 113.96,
  "unit": "USD per barrel",
  "as_of": "2026-10-07",
  "fetched_at": "2026-10-08T04:20:11Z",
  "freshness": { "limit_days": 12, "age_days": 1, "state": "fresh" },
  "change": { "d7_pct": -0.81, "d30_pct": 26.97 },
  "percentile_10y": 97,
  "position_word": "high",
  "move_score": 2.6,
  "status": "context",
  "alert_rule": null,
  "line": { "state": "high_rising", "fa": "…", "en": "…" },
  "details": { "means_for_you": "…", "why_it_matters": "…", "what_follows": "…", "cannot_tell": "…", "definition": "…" },
  "source": { "name": "U.S. Energy Information Administration via FRED", "url": "https://fred.stlouisfed.org/series/DCOILBRENTEU", "licence": "green", "attribution": "…" },
  "history": [ { "date": "2026-09-01", "value": 108.2 } ]
}
```

**Rules**

1. `status` is one of `alert`, `normal`, `context`, `stale`, `missing`.
2. `type` is one of `scored`, `price`, or `context`. Only `scored` items count toward gauges and verdicts.
3. Never overwrite a good value with a failed fetch. Keep the last good value, keep its `as_of`, and let the freshness rule decide the state.
4. Write the whole snapshot to a temporary file. Rename it to the live file only when every step has finished.
5. For any item whose licence is not green, omit `history` and show only derived readings.
6. `freshness.state` is `fresh` when `age_days` is at most `limit_days`. Otherwise it is `stale`.

---

## 6. Consequence lines (authoring format and rules)

Store one record for each item. Choose a line by the item's `state`.

**State keys:** `high_rising`, `high_easing` (high and not rising), `typical`, `low`. For prices, add `jumping` when the move score is at or above the threshold.

**Authoring rules**

1. Say what the state means for daily life. Name the effect: petrol, groceries, home-loan repayments, savings interest, overseas money, jobs.
2. Use hedged words: "usually", "tends to", "can". Never "will".
3. Write from a stated position when the effect differs by person, for example "If you have a home loan…" and "If you save in deposits…".
4. Never use "buy" or "sell".
5. Keep each line to about 15 words or fewer.
6. Add the Persian line first. Add the English line later.
7. A person qualified in Australian financial-services rules reviews all lines before launch.

**Format example (wording is an illustration only, not final copy):**

```json
{
  "id": "brent",
  "plain_name": { "fa": "…", "en": "Oil price (Brent)" },
  "tag": "Brent",
  "effects": ["petrol", "groceries"],
  "states": {
    "high_rising": "Oil is expensive and rising, so petrol and delivery costs usually follow.",
    "high_easing": "Oil is high but easing, so petrol prices may ease with a delay.",
    "typical": "Oil is in its usual range, so petrol costs should stay steady.",
    "low": "Oil is cheap, which usually lowers petrol and transport costs."
  }
}
```

**Write these first (about 12):** Brent, gold, US 10-year real yield, US inflation expectations (5-year, 5-year forward), US CPI, Fed rate, financial stress, dollar basket, Australian CPI, RBA cash rate, home-loan rate, wage growth.

---

## 7. Daily job

1. Keep the existing run time (04:20 UTC). ECB reference rates (published about 16:00 CET) will be available by then.
2. Fetch each source with a timeout of about 15 seconds and up to 3 retries with a growing wait.
3. Compute the derived fields (section 4), then the gauges and verdicts.
4. Write the snapshot atomically (section 5, rule 4).
5. Log one line for each source: name, duration, result, and `as_of`.
6. If more than 20% of sources fail, keep the previous snapshot and raise an alert to the owner.
7. Run `python dollar_basket.py` and read its JSON output as the `dollar_basket` item.

---

## 8. Checks the agent must run before building

1. For each FRED series in section 3, read the `notes` field. Stop on any "Copyright".
2. Request the ECB series key and confirm that data comes back.
3. Download the RBA F6 CSV. List the column headers. Find the owner-occupier outstanding column. Compare the latest value with the number on the RBA "Lenders' interest rates" page.
4. Read the ABS `WPI` and `CPI` dataflow structures. Record the dimension codes you use.
5. Open gold-api.com/docs. Confirm the URL format and units for `BTC` and `HG`.
6. Run `python dollar_basket.py --selftest`. Then run it for real and compare the value with a published DXY quote. Expect a close but not identical number.
7. Confirm the FRED notice is on the page (UI file, Block N1).

---

## 9. Attribution lines to show

- **FRED:** "This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis." Link to the FRED API terms.
- **RBA:** "Source: Reserve Bank of Australia, 2026." Do not imply RBA endorsement.
- **ABS:** "Source: Australian Bureau of Statistics, licensed under CC BY 4.0." (confirm exact wording on the ABS page)
- **ECB and Frankfurter:** "ECB reference rates, served by Frankfurter. Source: European Central Bank."
- **World Bank, EIA:** name the publisher on each card (already shown as the card's source).

---

## 10. Flags for the owner (not legal advice)

- The FRED terms list "professional services regulated by state licensing regimes" among prohibited uses. A section that suggests when to buy or sell may fall near it. Ask someone qualified before turning on the signals section.
- Australian rules can treat recommendations about financial products as regulated advice, depending on what is recommended and how. Have the signals wording reviewed before launch.
- If you charge for access later, the RBA terms require telling customers that the RBA publishes its data free of charge.
- Gated series (S&P 500, VIX, ASX 200) need permission or a licensed vendor before public display.

## 11. Open questions

1. Which ABS client and which ABS API does the current pipeline use?
2. Is the 10-year position computed from stored history or fetched each day?
3. Do you want the optional items (natural gas, food prices, advertised home-loan rate) in version 1?
4. Do you want to request permission for S&P 500 and VIX data, or pick a licensed vendor?
5. Paste the pipeline code, and I will write the exact additions.
