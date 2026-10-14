# Currena Insights: Fix and Foundation Spec

Page: https://currena.ir/#/insights
Audit basis: export dated 14 October 2026 (prices updated 12:13 pm), after Step 1 and Step 2 were implemented.
Audience: a regular person in Australia who wants digested global finance information for savings and investments.

---

## 0. How to use this file

This spec has four parts. Work in this order.

1. **Part A: Foundation.** Make the page self-checking so errors are caught automatically instead of by a human audit.
2. **Part B: Fixes.** Everything that is wrong or inconsistent in the current page.
3. **Part C: Additions.** A small number of indicators that are missing and matter now.
4. **Part D: Validation tests.** The automatic tests that must pass before any data is published.

Rules for the agent:

- Tick a box only after the "Done when" line for that item is true and you have checked it yourself.
- Do not invent series IDs, table names or numbers. Confirm every source against the provider before using it. If you cannot confirm something, write it in the report as "not verified" and leave the old behaviour in place.
- Do not add anything that is not in this spec.
- Do not change the visual design. Only change data, logic, labels and tests.
- Wording rule for every sentence shown to users: describe conditions, never forecast. No "will", "should", "time to", "expected to". No claims about causes in the news (for example "war" or "supply shock") unless they come from a dated, human-written context note (see A-06).
- Units rule: percentage points for rates, inflation, yields and unemployment. Use % only for prices and indexes.
- Platform constraint: the page runs on Cloudflare Workers with free KV. Stay inside the free limits. Combine history into a few large keys instead of many small ones, keep daily writes low, and if one scheduled run would exceed the outside-request limit (50 per run on the free Workers plan), split the work across several scheduled runs. State in the report how many KV reads, KV writes and outside requests a full refresh uses.
- Work on your own until every item is done, tested and verified. Do not stop to ask questions. If something cannot be verified, record it in the report and continue.
- After finishing, produce the report described in Part E.

---

## Part A: Foundation (do this first)

The goal is that a wrong number, a stale date or a sentence that contradicts its card cannot reach the live page without being flagged.

- [ ] **A-01 Single indicator registry.** Create one file (for example `indicators.json` or `indicators.yaml`) that defines every indicator in one place. For each one: id, plain-language title, area, source name and link, series ID or table, unit, update cadence, maximum age before "stale", scored or context-only, history window to store, thresholds or rule, and the text templates for each status.
  - Done when: every card on the page is produced from a registry entry, and no card has numbers or conclusions typed directly into code.
- [ ] **A-02 Generated text only.** Every sentence on a card is produced from a template that takes the status and the numbers as input. No hand-written conclusion is allowed in code or data.
  - Done when: changing a value changes its text automatically, and no card can say "easing" while the value is rising.
- [ ] **A-03 Validation suite runs on every refresh.** Implement the tests in Part D. Run them after data is fetched and before anything is published.
  - Done when: a deliberately broken input (for example a fake duplicate monthly value) is caught and does not reach the live page.
- [ ] **A-04 Safe failure.** If a source fails or a test fails, keep the last good value, mark the card "stale" or "check pending", record the reason, and never show it as today's data.
  - Done when: you can switch off one source in a test run and the card shows a stale tag with its last good date.
- [ ] **A-05 Daily snapshot archive.** Save one snapshot per day (all values, statuses and rule versions) in a dated file. Keep at least 2 years of daily data and 10 years of monthly data for every series.
  - Done when: you can open yesterday's snapshot and see exactly what the page showed.
- [ ] **A-06 Context notes (optional, off by default).** If a human-written note is ever added (for example "oil moved because of X"), it must carry an author date and an expiry date, and it disappears automatically after expiry.
  - Done when: an expired note is not shown. No note is shown by default.
- [ ] **A-07 Rule versions.** Give each scoring rule a version number and show it in "How is this calculated?". Keep a short change log in the repository.
  - Done when: every threshold is listed in one visible place with its version.
- [ ] **A-08 Status page.** On "About this data", show the snapshot time with a time zone, any source that failed, and any card that is stale.
  - Done when: a failed source appears there on the next refresh.

---

## Part B: Fixes

### B1. Calculations that are wrong (serious)

- [ ] **B-01 "Below its 10-year peak" is wrong for Bitcoin, gold, silver and possibly Brent.**
  - Bitcoin shows 0.5% below its peak at $83,768. Its record is about $126,210 (6 Oct 2025), so it should be about 34% below.
  - Gold shows 17.5% below at $4,166. Its January 2026 record is about $5,590, so it should be about 25% below.
  - Silver shows 36.3% below at $58.77. That implies a peak of about $92. Its January 2026 high was much higher (one tracker says about $121.6; confirm with two sources), so the real gap is larger.
  - Brent shows 23.6% below, which implies a $139 peak. That was the March 2022 intraday high. Its closing peak was about $128 (confirm). Do not mix intraday peaks with closing prices.
  - Fix: compute every peak from the full stored price history on one defined basis (highest close, or highest intraday, but the same basis as the current price). Show the peak value and its date on the card (for example "peak $126,210 on 6 Oct 2025"). State the basis in the card details.
  - Done when: test T-05 (known records) passes for all four assets.
- [ ] **B-02 US M2 shows "+0.00% since previous release" while the relationship card says "rising".** A monthly series should almost never show exactly 0.00%.
  - Fix: investigate whether the latest value is a duplicate or a fetch error. If the change is exactly zero, mark the card "check pending". Make the relationship card read the same status as the indicator card.
  - Done when: the card and the relationship card agree, and test T-08 (duplicate values) is in place.
- [ ] **B-03 The dollar alarm and the hero disagree.**
  - The currency section says the alarm sounds when the dollar moves 3.0% in a month. The dollar is up 3.1% (the Dollar index change shown is +3.10 pts), yet the pattern says "Watching".
  - The global hero lists "The US dollar" as Calm.
  - Fix: use unrounded values and the same comparison (greater than or equal to the threshold) everywhere. Add a speed rule to the dollar indicator on the main page (a 30-day move at or above the alarm threshold counts as "needs attention"). Make the hero read from the same result.
  - Done when: both sections give the same answer for the same number.
- [ ] **B-04 Relationship cards use inconsistent logic.** Rewrite each relationship as an explicit rule.
  - Oil, inflation expectations, borrowing costs: today it says "Active" while oil and inflation expectations are "steady". A pattern may be "Active" only if every required leg meets its rule. Check several windows (7, 30 and 90 days) for oil, because oil is up about 65% over a year.
  - Dollar, gold, oil: today it says "Signals disagree" while the dollar is rising and gold is falling, which is the usual pattern. Use the same method for every leg (direction over the same window with a minimum move).
  - RBA rate, home loans, household debt: today it compares the September rate hike with August loan rates (before the hike passes through). Compare the change in the cash rate with the change in the loan rate 1 to 3 months later and show "pass-through pending" until the data exists. Debt-to-income is not a debt-servicing measure. Either use a servicing ratio or label it correctly.
  - Copper/gold ratio, China factory activity, US money supply: the link to US money supply is weak. Either remove that leg or label the card "weaker link".
  - Iron ore, terms of trade, Australian dollar: add the US dollar as a context line, because today's fall in the Australian dollar is mostly US dollar strength.
  - Done when: every relationship has its rule written in the registry, and no card says "Active" with a "steady" leg.

### B2. Labels and dates

- [ ] **B-05 US prices card.** It says "data for August 2026 · released Oct 14, 2026". August data was released on 11 Sep 2026. Today's release (14 Oct) is September data, as the calendar says.
  - Fix: show the real release date of the data shown. If newer data is due today and not yet in, show "next release: today".
  - Done when: the card and the calendar agree.
- [ ] **B-06 "Last change" dates for central banks.**
  - Fed: the decision was 16 Sep 2026 (the card says 17 Sep, which is the effective date on the data source).
  - ECB: the decision was 10 Sep 2026 and the new rates took effect 16 Sep (the card says 16 Sep).
  - Fix: show "decided [date] · effective [date]".
  - Done when: both cards show both dates.
- [ ] **B-07 Quarterly series show "April 2026".** This applies to wage growth, terms of trade and the US government interest bill.
  - Fix: label quarterly data by quarter name and period end (for example "June quarter 2026"). If the value is actually for the March quarter, fetch the newer release.
  - Done when: no quarterly series shows a month name without a quarter.
- [ ] **B-08 Time zone.** "Prices updated 12:13 pm" has no time zone.
  - Fix: show the time zone (and show UTC in the details).
- [ ] **B-09 Stale and delayed tags.** None are visible.
  - Fix: add a tag to every card using its maximum age from the registry. Suggested defaults: daily series 4 days, weekly 10 days, monthly 45 days, quarterly 120 days.
  - Known cases to check: Australian 10-year yield (dated 7 Oct), US 10-year and real yields (dated 9 Oct while other US data is dated 13 Oct), FTSE 100 (dated 12 Oct while other European markets are 13 Oct).
  - Done when: each of those shows its real age.
- [ ] **B-10 Mixed dates inside one number.** The Australian versus US 10-year gap mixes dates (7 Oct and 9 Oct).
  - Fix: calculate gaps and spreads only from values of the same date. If dates differ, show both dates and mark the gap "dates differ".
- [ ] **B-11 Source on every card.** The first export showed the source on each card (FRED, RBA, ABS). This export shows only "data for…".
  - Fix: show the source name and a link on every card, or in a clearly visible "Source" line in details.
  - Done when: every card has a source and a data date.

### B3. Rules and counts that disagree

- [ ] **B-12 Inflation expectations are treated two ways.** The global card calls 2.33% "Normal". The gold card lists it as "Supports" with "Elevated long-run inflation expectations".
  - Fix: use the same status for the same indicator in every section.
- [ ] **B-13 Check which series the inflation-expectations card uses.** The title says "five to ten years ahead", but the value (2.33%) equals the 10-year nominal yield minus the real yield (5.24% - 2.91%), which suggests the 10-year breakeven. Confirm the series ID and fix either the label or the series.
- [ ] **B-14 Hero counts do not add up.** The global hero says "4 of 19 indicators need attention" and lists oil, but the areas show 3 attention items, and the Prices section says oil is "context, not scored".
  - Fix: decide whether oil is scored. Recommended: keep oil scored and rename the section "Prices (oil is scored)". Compute every hero count from the same list of scored indicators.
  - Done when: the hero count equals the sum of the area counts.
- [ ] **B-15 Copper/gold ratio.** The card shows 3.35 (September monthly value) while the live prices ($14,773 copper and $4,166 gold) give 3.55.
  - Fix: calculate it from live daily prices, or label it clearly as a monthly value.
- [ ] **B-16 Silver per Bitcoin shows 1,429 oz** while the displayed prices give about 1,425. Calculate all derived values from the same snapshot as the prices shown.

### B4. "What it means for my money" panel

- [ ] **B-17 Percent changes on rates.** The panel shows +12.7% (home loan), +33.3% (savings) and +16.7% (shop prices) one year. Show percentage points, or remove the figure.
- [ ] **B-18 Add the real return on savings.** Show "term deposit rate minus inflation" (today 4.80% - 4.0% = about +0.8 pts, before tax). Label it "before tax". Keep the wording as a condition, not advice.
- [ ] **B-19 Long-history context for yields.** The US 10-year yield (5.24%) says "decade high", but it is at levels last seen in 2002. A 10-year window cannot say this.
  - Fix: for yields (and any long-history series), show "highest since [year]", found by searching the full stored history for the last time the value was this high.
  - Done when: the US 10-year card shows "highest since" with the right year.

---

## Part C: Additions (only these)

Confirm each series ID or table with the provider before building. Each card must follow the card spec: plain title, source with link, update cadence, maximum age, unit, scored or context, two lines on what it means (conditions only), and data date, published date and fetched date.

- [ ] **C-01 RBA cash rate card (currently 4.60%).** Source: RBA statistics tables. Show the last change (decided and effective dates) and the next decision date (3 Nov 2026). Scored: context.
- [ ] **C-02 Iron ore price card.** Source: FRED `PIORECRUSDM` (monthly) or another free, legally usable source. Scored: context. The relationship card must read from this card.
- [ ] **C-03 "What markets expect from the Fed": US 2-year yield minus the Fed policy rate.** Source: FRED `DGS2` and the policy-rate series. Scored: yes (rule to be defined in Step 3). Plain meaning: when the 2-year yield is well above the policy rate, markets expect more hikes.
- [ ] **C-04 US 30-year yield.** Source: FRED `DGS30`. Show "highest since [year]" (see B-19).
- [ ] **C-05 One free US activity survey.** Suggested: Philadelphia Fed manufacturing index (FRED `GACDFSA066MSFRBPHI`). Confirm the series. Scored: yes.
- [ ] **C-06 "What markets expect from the RBA": Australian 3-year government bond yield minus the cash rate.** Source: RBA capital market yields table (confirm). Scored: yes (rule in Step 3).
- [ ] **C-07 Calendar.** Add RBA decision (3 Nov), ECB decision (29 Oct), and the US jobs report. Show decision days, not meeting start days. Store events as plain dates with their own time zone and do not convert through UTC.

---

## Part D: Validation tests (run before every publish)

Each test must have a name, run automatically, and write its result to the status file.

- [ ] **T-01 Reconciliation.** Real yield plus breakeven inflation equals the nominal yield within 0.05 pts (same date).
- [ ] **T-02 Derived values.** Every ratio (gold/silver, bitcoin per ounce of gold, copper/gold, gaps) is recomputed from the displayed inputs and matches within rounding.
- [ ] **T-03 Dates.** No trading date is a Saturday or Sunday. No release date is in the future. Data date is on or before the release date. "Days away" is calculated from today's date when the page loads.
- [ ] **T-04 Freshness.** Every card's age is under its maximum age, or it carries a stale tag.
- [ ] **T-05 Known records.** Stored peaks must be at least these values (confirm each with two sources before hardcoding):
  - Bitcoin: about $126,000 (6 Oct 2025)
  - Gold: about $5,300 or more (record about $5,590 on 28 Jan 2026)
  - Silver: about $89 or more (record at least $89.10 on 13 Jan 2026, probably much higher)
  - Brent: closing peak about $128, intraday about $139 (March 2022)
- [ ] **T-06 Text matches status.** The text template used for a card matches the card's status. No "easing" text on a rising value.
- [ ] **T-07 Forbidden words.** No "will", "should", "time to" or "expected to" in any generated sentence.
- [ ] **T-08 Suspicious values.** A monthly series may not show exactly 0.00% change, and no value may repeat unchanged beyond its normal cadence.
- [ ] **T-09 Counts.** Every hero count equals the sum of the area counts, and every count comes from scored indicators only.
- [ ] **T-10 Units.** Rates, inflation, yields and unemployment use percentage points. Percent is used only for prices and indexes.
- [ ] **T-11 Same indicator, same status.** An indicator that appears in several sections shows the same status everywhere.
- [ ] **T-12 Relationship rules.** A relationship card may not say "Active" unless every required leg meets its rule.
- [ ] **T-13 Source present.** Every card has a source name and a data date.
- [ ] **T-14 Regression fixtures.** Feed the engine saved data from known past episodes (for example March 2020, 2022) and check that the resulting statuses match expected results stored in the repository. This protects against accidental rule changes.

---

## Part E: Report the agent must produce

At the end, create `FIX_REPORT.md` with:

1. Every checklist ID, with "done", "partly done" or "not done", and one line on how you checked it.
2. Every number you changed and why.
3. Every item marked "not verified", with what you would need to verify it.
4. The test results from the latest run.
5. Instructions for producing a new full export of the page (expand every "Show hidden indicators", "Show full table" and "Full calendar" before saving) so the next audit can check it.

---

## Reference values (as of 14 Oct 2026, for checking)

| Item | Correct value |
|---|---|
| Fed target range | 3.75% to 4.00%, decided 16 Sep 2026, next decision 28 Oct 2026 |
| ECB deposit rate | 2.50%, decided 10 Sep 2026, effective 16 Sep 2026, next decision 29 Oct 2026 |
| RBA cash rate | 4.60%, next decision 3 Nov 2026 |
| Australian CPI | 4.0% (August 2026, released 30 Sep 2026), trimmed mean 3.6% |
| US CPI | August 2026 data released 11 Sep 2026 (3.4%, core 2.4%). September data due 14 Oct 2026 |
| US 10-year yield | about 5.24% on 9 Oct on the page. It touched about 5.3% in early October, the highest since 2002 |
| KOSPI | closed 6,384.24 on 12 Oct 2026. The page shows 6,035 (-5.5%) for 13 Oct, which is consistent |
| Bitcoin record | about $126,210 on 6 Oct 2025 |
| Gold record | about $5,590 (intraday) on 28 Jan 2026 |
