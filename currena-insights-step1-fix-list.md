# Currena Insights: Step 1 Fix List

Page: https://currena.ir/#/insights
Audit date: 12 October 2026 (snapshot data dated 8 to 11 October 2026)

## How to use this file

This is Step 1 of 3.

1. **Step 1 (this file):** fix everything that is wrong on the existing page.
2. **Step 2 (later):** add the missing indicators.
3. **Step 3 (later):** build verdicts that change with the live numbers, using only math and economic rules, no LLM.

Rules for the coding agent:

- Work through the sections in order. Section A to C matter most because they affect correctness.
- Tick each box only after the check described in Section J passes for that item.
- Items marked **(verify)** could not be fully confirmed from outside sources. Check the official release first, then change the page.
- Do not add new indicators in this step. Only fix what exists.
- If a fix needs a decision (for example a threshold), write the rule down in one place in the code and show it on the page.

## Reference values (checked against outside sources on 12 Oct 2026)

Use these to verify the fixes.

| Item | Correct value | Notes |
|---|---|---|
| Fed target range | 3.75% to 4.00% | The Fed raised rates on 16 Sep 2026 |
| Next FOMC | Meeting 27 to 28 Oct, decision on 28 Oct | Page shows 27 Oct |
| RBA cash rate | 4.60% | Raised on 29 Sep 2026, fourth hike of 2026 |
| Next RBA decision | Tuesday 3 Nov 2026 | Page shows 2 Nov |
| Australian CPI (annual) | 4.0% for August 2026, trimmed mean 3.6% | Released 30 Sep. ABS now publishes a full monthly CPI |
| Next ABS CPI | 28 Oct 2026, September 2026 monthly CPI | Page says "September quarter" on 27 Oct |
| US CPI (annual) | 3.4% for August 2026, core 2.4% | Released 11 Sep. Next release 14 Oct |
| Gold, 9 Oct close | about $4,168 | Page shows $4,191 on a Sunday snapshot, which is plausible |
| Bitcoin, 9 Oct | about $81,700 | Page shows $82,266, plausible |
| EUR/USD, 7 Oct | about 1.118 | Page implies 1.118, matches |
| 11 Oct 2026 | Sunday | No stock market traded |
| 12 Oct 2026 | Monday | "Today" for the audit |

Official places to verify: federalreserve.gov (FOMC calendar), rba.gov.au (cash rate, lending rates, meeting dates), abs.gov.au (CPI, wages, unemployment, home prices, release calendar), bls.gov (US CPI), FRED (fred.stlouisfed.org) for US series.

---

## A. Wrong or outdated numbers

- [ ] **Fed interest rate card.** Show the full target range (3.75% to 4.00%). Take lower and upper bounds from FRED series DFEDTARL and DFEDTARU. The current "3.75% to 3.88%" mixes the lower bound with the midpoint.
- [ ] **Australian inflation card.**
  - [ ] Switch from the old quarterly figure to the ABS monthly CPI (headline annual and trimmed mean annual).
  - [ ] Show the data month (for example "August 2026") and the release date.
  - [ ] Current page shows 3.9% dated 31 Mar 2026. Latest is 4.0%.
- [ ] **US inflation card.**
  - [ ] Replace "Updated Jul 31" with the data month ("August 2026") and the release date.
  - [ ] Show core CPI (2.4%) next to headline CPI (3.4%).
  - [ ] Add one plain line explaining that the gap between them is mainly energy.
- [ ] **Australian home-loan rate card.**
  - [ ] Refresh from the RBA lending-rates table. The 30 Aug figure is before the September hike.
  - [ ] Add an RBA cash rate card (4.60%).
- [ ] **Other Australian cards (verify).** Wages, home prices and terms of trade are dated 31 Mar 2026. Unemployment is dated 31 Jul 2026. Newer releases should exist. Check each against its latest ABS release and update.
- [ ] **US cards (verify).** Unemployment, M2 and any other macro series dated July. Check each against its latest release and update.
- [ ] **Stock markets: dates.**
  - [ ] Show each index's real last trading date. Never show the fetch date.
  - [ ] Americas rows stop at 8 Oct. Add the 9 Oct close.
  - [ ] If an index is more than one trading day behind, show a "delayed" tag.
- [ ] **Brent.**
  - [ ] Confirm which price it is: front-month futures or the FRED spot series (the FRED series lags by about a week).
  - [ ] Name the source and the contract on the card.
- [ ] **Bitcoin.** Name the source on the card.

## B. Dates and calendar

- [ ] Show the **decision day**, not the first day of the meeting:
  - [ ] FOMC: 28 Oct 2026
  - [ ] RBA: 3 Nov 2026
  - [ ] ABS CPI: 28 Oct 2026, labelled "September 2026 monthly CPI" (not "September quarter")
- [ ] Fix the one-day shift. The countdowns (16 and 22 days) are correct but the printed dates are one day early, so dates are being converted through UTC. Store each event as a plain date plus its own time zone and do not convert it.
- [ ] Calculate "days away" when the page loads, from today's date, not when the snapshot was built.
- [ ] Add US CPI (14 Oct 2026) to the calendar.
- [ ] Show an "updated" or "data for" date on **every** card, including cards in the "Normal" state. Terms of trade currently shows none.

## C. Calculation and label errors

- [ ] **Gold per Bitcoin (0.0509).** This is bitcoin per ounce of gold, so the label is inverted. Replace with "One bitcoin buys 19.6 oz of gold".
- [ ] **Silver per Bitcoin (0.00070).**
  - [ ] Replace with "One bitcoin buys about 1,360 oz of silver".
  - [ ] The current number should be about 0.00074 anyway.
- [ ] **Gold/silver ratio** shows 69.0 but the displayed prices give 69.3. Compute every derived number from the same snapshot as the prices shown.
- [ ] **Euro per US dollar.** Change "US$0.8944" to "€0.8944".
- [ ] **Percent changes on rates.**
  - [ ] Use percentage points for inflation, interest rates, yields and unemployment.
  - [ ] Wrong ones today: inflation +88.1%, inflation +35.6%, home-loan rate +12.7%.
  - [ ] Use % only for prices and indexes.
- [ ] **US CPI "+1.49% 30-day".** Remove it. For monthly and quarterly series, show "change since the previous release" instead of "30-day".
- [ ] **M2** shows "bn23,343". Show "US$23.3 trillion" plus its data month.
- [ ] **"Savings and interest" card.**
  - [ ] It shows the inflation rate (3.9%), a stock-exchange icon and the status "Earning more interest".
  - [ ] Make it use a real savings or deposit rate with the right icon, or rename the card.
- [ ] **"10-year position" on trending totals.**
  - [ ] M2 (100%) and home prices (97%) are always near the top because they trend upward.
  - [ ] Use year-on-year growth for those.
  - [ ] Keep "10-year position" only for rates, ratios and inflation.
- [ ] **Gold and silver "easing from highs".** Add "distance from the 10-year peak", the same way stocks show distance from the 52-week high.
- [ ] **Estimation chart "-5.5% Quarter".** Label it clearly as the past quarter's change.
- [ ] **Real yields (2.87%).**
  - [ ] It shows a value but says "Cannot read". Make the card use the value and show "Works against gold".
  - [ ] Add a warning when gold is at a decade high while real yields are also high.

## D. Contradictions to remove

- [ ] **Status is the single source of truth.** Generate every card's text from its status and number so wording cannot contradict them. A rising value must never say "easing".
- [ ] **Home-loan rate.** It is "easing" on one card and "becoming more expensive" on another. Both must read from the same status.
- [ ] **ECB card.** "Unusually large" and "usual range" appear together. Show the size of the move and the level as two separate lines.
- [ ] **Inflation expectations (2.32%).**
  - [ ] It is marked "Needs attention" and "elevated" while the text says pressure is easing.
  - [ ] 2.32% is close to a normal long-run level.
  - [ ] Re-run the backtest, set the threshold from the evidence and show the rule on the card.
- [ ] **"Prices are context, not scored" versus oil in the hero count.** Either say "oil is scored, other prices are context" or remove oil from the count. Recommended: keep oil scored and say so.
- [ ] **Petrol card.** It says "No clear direction" while the text says oil has left its usual range and pump prices follow. Derive the label from the same oil rule.
- [ ] **Oil text ("often war or supply shocks").** Remove cause claims, or label them as "usually", unless a source supports them.

## E. Hero summary and verdict words

- [ ] **One mapping from counts to verdict words.**
  - [ ] Today Australia says "Cautious" with 2 of 3 areas Stressed, and Global says "Stressed" with 1 of 5 Critical.
  - [ ] Write the rule in one place, use it for both, and display it.
- [ ] **Stock headline.** Do not say "Correcting" when only 5 of 16 markets are in correction. Use "Mixed: 5 of 16 in correction" until Step 3 defines it properly.
- [ ] **Global hero.** Also say which indicators are calm. Financial stress and the yield curve are normal, so the stress is in prices, not in markets.

## F. Stock rows

- [ ] **Column header.** State which number is shown (Today, 3 months or from the 52-week high). Show the same fields for every row.
- [ ] **Trend word and number.** Take both from the same period. Use one "flat" threshold for all markets. Today ASX at -0.3% is "Down" while FTSE at +1.1% is "Flat".
- [ ] **DAX.** It shows +0.6% with an up arrow but the label "Down". Make arrow and label come from the same number.
- [ ] **Local currency.** Label returns "in local currency", or add a US-dollar view. Ibovespa's +17.5% is not comparable with the others.
- [ ] **Distance from 52-week high.** Show it for every index, including S&P 500 and Nasdaq.

## G. Wording, compliance and trust

- [ ] **"Estimation: gold will go down / silver will go down".**
  - [ ] This is a forecast and contradicts your own "conditions, not forecasts" line.
  - [ ] Rename the card "Conditions for gold and silver" and use "supports" and "works against" only.
- [ ] **Forecast wording.** Search the whole page for "will", "should", "time to" and "expected to". Rewrite each as a condition.
- [ ] **Disclaimer.** Have an Australian professional review it before the site goes commercial.
- [ ] **Sources line.**
  - [ ] Replace "official and public sources only" with an accurate list. You also use EODHD, Yahoo Finance and gold-api.
  - [ ] Check each provider's licence terms before going commercial.
- [ ] **Dollar basket.**
  - [ ] Put "not the official DXY" on the card itself, not only in the sources.
  - [ ] Consider renaming it so it is not confused with DXY.
- [ ] **Backtest sentence.** It appears twice. Remove the duplicate. Also state that the test covers only three crises, so users know the sample is small.
- [ ] **"Live" wording.**
  - [ ] Bitcoin says "live feed" but everything refreshes once a day.
  - [ ] Say "daily snapshot", or refresh prices more often.
  - [ ] Show the snapshot time at the top of the page.

## H. Data pipeline

- [ ] **Stale tags.** Add one to every card based on its normal release schedule: more than 45 days old for monthly series, more than 120 days old for quarterly series.
- [ ] **Relationship cards.**
  - [ ] Two of six say "not enough fresh data", including the one linking oil, inflation expectations and borrowing costs. That is the most relevant link right now.
  - [ ] Fix the feeds (FRED real yields update daily) and set an allowed age for each relationship.
- [ ] **Fetch failures.** If a source fails, keep the last good value, mark it stale, and never show it as today's.

## I. Priority order if time is short

1. Section G: remove "will go down" forecast wording (legal risk).
2. Section A: Fed range, Australian CPI, home-loan rate, RBA cash rate, US CPI dates.
3. Section B: calendar dates and the UTC date shift.
4. Section C: inverted Gold per Bitcoin and Silver per Bitcoin, % versus percentage points.
5. Section D and E: contradictions and the verdict-word mapping.
6. Sections F and H: stock rows and the freshness tags.

## J. How to confirm everything is fixed

- [ ] Recompute every ratio from the inputs shown on the card and match it within rounding.
- [ ] Compare Fed, ECB, RBA, US CPI and Australian CPI against the official sites.
- [ ] Open the page on a weekend and check that no trading date is a Saturday or Sunday.
- [ ] Check that every card's text matches its status.
- [ ] Search the page for forecast words ("will", "should", "time to", "expected to").
- [ ] Check that every card shows a source and a data date.
- [ ] Compare the calendar dates and countdowns against the official calendars.
- [ ] Take a fresh screenshot of the page and send it back for a second audit.
