# Currena Insights: Step 3 Spec (version 3): Data, Indicators and Coverage

Audience: a regular person living in Australia who wants digested global finance information for savings, a mortgage, and buying shares on foreign exchanges (S&P 500 and big US tech).
Research date: 16 to 17 October 2026. Provider terms change. The agent must re-read each source's terms (see `RULES.md` and `SCRAPING_SPEC.md`).
This version replaces earlier Step 3 specs. Access, licence and risk policy now live in `RULES.md` and `RISK_REGISTER.md`. Visual work lives in `UI_SPEC.md`. Fetching methods live in `SCRAPING_SPEC.md`.

---

## 0. What Step 3 is

Three layers:

1. **Layer 1: published indicators, shown as published.** Someone else owns the method and the track record. We fetch, label and display it correctly.
2. **Layer 2: standard definitions and plain arithmetic.** Conventions and arithmetic, not predictions.
3. **Layer 3: our own summaries, kept small.** Hero words and relationship cards, shown as summaries of gauges, never as forecasts or advice.

Prerequisites: `INSIGHTS_FIX_SPEC.md` and `INSIGHTS_DEFECTS_2026-10-15.md` are implemented first (see `AGENT_RUNBOOK.md`).

Owner decisions are in `RULES.md` section 1. In short: public, non-commercial, owner accepts the risk for L2 sources, no permission requests, no paid data.

---

## 1. Phase 0 outputs (read-only)

The agent first writes `CURRENT_STATE_REPORT.md` covering:

- [ ] **S-01** Inventory of every indicator: id, title, area, source, series ID or URL, unit, cadence, whether text is generated or typed, scored or context, where thresholds live.
- [ ] **S-02** Inventory of every source: name, how it is called, which cards use it, terms found, level, date checked.
- [ ] **S-03** Status against `INSIGHTS_FIX_SPEC.md`: done, partly done, not done, with evidence.
- [ ] **S-04** Status against this spec, `UI_SPEC.md` and `SCRAPING_SPEC.md`.
- [ ] **S-05** Hosting and limits: how refresh runs, KV usage, request counts, free-tier limits close to being hit.
- [ ] **S-06** Test suite: what exists, how to run it, current results.
- [ ] **S-07** Public exposure: every URL that returns Insights data, and what it exposes (keys, bulk history, third-party raw series).
- [ ] **S-08** Other risks found (exposed keys, missing attribution, stale data shown as current).

---

## 2. Principles

- [ ] **P-1 Show what it is, who publishes it, when, and its limits.** Each published indicator card has "What it is", "What it isn't", publisher with link, data date, and a track-record caveat where one exists.
- [ ] **P-2 Fail closed.** Stale, failed, duplicate, blocked or unverified inputs show a stale tag or "can't tell right now", never a verdict.
- [ ] **P-3 Readings, not instructions.** "Real yields 2.88%, highest since 2002" is allowed. "Gold: sell" is not. Sentiment gauges are never presented as signals.
- [ ] **P-4 Source level gate.** Every source has `level` (L0 to L3), `owner_accepts`, `attribution_text`, `terms_lines`, `terms_read_on`. L3 is never shown. L2 is shown only while `owner_accepts` is yes.
- [ ] **P-5 FRED copyright check.** For every FRED series, check its notes for the word "Copyright" (the FRED API series search supports this). If present, set level L2.
- [ ] **P-6 Attribution** next to every value from a source that requires or expects it. Never imply endorsement.
- [ ] **P-7 Australia first.** Where a global item matters mainly because of its effect on Australia (oil, the US dollar, China), show it with its Australian link (section 7).

---

## 3. Layer 1: published indicators

Status: **Use** (terms confirmed, L0 or L1), **Use, L2** (shown only while the owner accepts the risk), **Fetch** (per `SCRAPING_SPEC.md`, disabled until accepted), **Link out** (do not fetch).

### 3.1 Australia: savings, mortgage, prices

| ID | Indicator | Source | Updates | Status |
|---|---|---|---|---|
| L1-01 | RBA cash rate (currently 4.60%) | RBA tables | After each decision | **Use** (L0). The cash rate has its own terms: personal or commercial use allowed if no RBA endorsement is implied. |
| L1-02 | Australian government 10-year and 3-year bond yields | RBA capital market yields table (confirm which) | Daily, short lag | **Use** (L0) |
| L1-03 | Home-loan rates and term-deposit rates | RBA tables | Monthly | **Use** (L0) |
| L1-04 | CPI (monthly), trimmed mean, unemployment, wages, terms of trade | ABS | Monthly or quarterly | **Use** (L0, CC BY 4.0) |
| L1-05 | RBA Index of Commodity Prices | RBA table I2 | Monthly | **Use after checking** the table's third-party source notes (L0 or L1) |
| L1-06 | ASX RBA Rate Tracker (market pricing of RBA moves) | ASX | End of each business day | **Fetch** (FS-02), or link out if L3 |
| L1-07 | Westpac-Melbourne Institute Consumer Sentiment | Melbourne Institute / Westpac | Monthly | **Manual entry** (FS-03) or link out |
| L1-08 | NAB Monthly Business Survey | NAB | Monthly | **Not verified.** Link out or manual entry |

### 3.2 US and global: for buying US shares

| ID | Indicator | Source | Updates | Status |
|---|---|---|---|---|
| L1-10 | VIX | Cboe via FRED `VIXCLS` | Daily | **Use, L2** (copyright series; already live) |
| L1-11 | Recession probability from the yield curve | NY Fed published method; input FRED `T10Y3M` | Monthly | **Use.** Reproduce the NY Fed's published formula exactly. Do not invent coefficients. Caveat shown: a probability within a year, not timing; more information can change the estimate. |
| L1-12 | Sahm rule | FRED `SAHMREALTIME` | Monthly | **Use** (confirm copyright flag) |
| L1-13 | Financial stress and financial conditions | St. Louis Fed stress index, Chicago Fed NFCI | Weekly | **Use** (confirm copyright flag) |
| L1-14 | Shiller CAPE and Excess CAPE Yield | Robert Shiller dataset (`ie_data.xls`) | Monthly | **Use, L2** (FS-06), disabled until accepted. Excess CAPE Yield = (1 / CAPE) x 100 minus the real 10-year Treasury yield. Long-term valuation, not a timing tool. Archive every download. |
| L1-15 | What markets expect from the Fed | CME FedWatch | Daily | **Link out.** Paid API declined. Use the free proxy L2-08. No unofficial scrapers. |
| L1-16 | US CPI, unemployment, payrolls | BLS via FRED (not seasonally adjusted series for year-on-year rates) | Monthly | **Use** (confirm copyright flag) |
| L1-17 | One US activity survey | Philadelphia Fed manufacturing survey via FRED, or Atlanta Fed GDPNow | Monthly or several times a month | **Use after confirming** the series ID and copyright flag |
| L1-18 | Crypto Fear and Greed | Alternative.me free API | Daily | **Use** (L0). Attribution next to the data. Show the publisher's own description. |
| L1-19 | CNN Fear and Greed (US stocks) | CNN | Daily | **Fetch** (FS-01), disabled until accepted. L3 if terms, robots.txt or a block say so. |

### 3.3 Not recommended

- **Recreating CNN's index ourselves.** CNN does not publish how each component is scaled. Fetching its published number (L1-19) is different from rebuilding it.
- **ICE BofA credit spreads on FRED.** Licence terms apply and FRED may limit history. Skip unless the terms are confirmed.

---

## 4. Layer 2: standard definitions and plain arithmetic

Each card shows its definition in "How is this calculated?".

- [ ] **L2-01 Stock market state for S&P 500, Nasdaq 100 and ASX 200** by distance below the 52-week high (closing basis, one consistent definition): within 5% "Near its high"; 5% to 10% below "Pullback"; 10% to 20% below "Correction"; 20% or more below "Bear market". The 10% and 20% lines are common market conventions; say so. No "range" or "bullish" verdicts.
- [ ] **L2-02 Price against the 200-day average.** "Above" or "below" and the percentage gap.
- [ ] **L2-03 US shares in Australian dollars.** For the S&P 500 and Nasdaq 100: the USD level, the AUD level (USD level times AUD/USD, same date), the 1-month change in USD and in AUD, and the currency effect.
- [ ] **L2-04 "Highest since [year]".** For yields, inflation and other long-history series, find the last time the value was this high or low in the full stored history. Examples: US 10-year and 30-year yields.
- [ ] **L2-05 Spreads, all from the same date:** US 10-year minus 2-year; Australian 10-year minus US 10-year; Australian 3-year minus the RBA cash rate.
- [ ] **L2-06 Real return on savings.** Term-deposit rate minus Australian inflation, "before tax". Do not call it good or bad.
- [ ] **L2-07 Real-yield reconciliation.** 10-year real yield plus the 10-year breakeven (T10YIE) equals the 10-year nominal yield within 0.05 pts, same date.
- [ ] **L2-08 Fed expectations proxy.** US 2-year yield minus the policy-rate **midpoint**. Label: "When the 2-year yield is well above the policy rate, markets have usually been pricing further hikes. This is a rough read, not a probability."
- [ ] **L2-09 RBA expectations proxy.** Australian 3-year yield minus the cash rate, with the same label. Link to the ASX RBA Rate Tracker.
- [ ] **L2-10 Valuation context** (when FS-06 is enabled): CAPE, its percentile in its own full history, and the Excess CAPE Yield. One line: valuation measures say little about the next few months.

Everything here is generated from the registry. No hand-typed conclusions.

---

## 5. Layer 3: our own summaries, kept small

- [ ] **L3-01 Hero words** stay, with the visible rule. Label: "Summary of the gauges below". Layout and content: `UI_SPEC.md` section 3.
- [ ] **L3-02 Relationship cards:** readings, direction, one line on the usual tendency, and a neutral "N of M readings match the usual pattern". No "Active", "Partly active" or "Signals disagree". Layout: `UI_SPEC.md` section 8. Logic: section 6 below.
- [ ] **L3-03 No new composite scores.** No self-made fear and greed score or recession score.
- [ ] **L3-04 Context notes** follow rule A-06 of the fix spec (dated, with expiry, off by default).

---

## 6. Relationship rules (cause and effect)

Each relationship lives in the registry with: trigger leg, other legs, windows, tendency text, direction, typical lag, strength (strong, moderate, weak) and one line on when it breaks.

- [ ] **R-01** A card counts matches only if its **trigger leg** is present. Otherwise it shows "Trigger not present".
- [ ] **R-02** All legs use the same method (direction over a stated window with a minimum move). Windows are 7, 30 and 90 days unless the registry says otherwise, and are shown in the details.
- [ ] **R-03** Lags are explicit. A cash-rate change is compared with the loan-rate change 1 to 3 months later. Until the data exists, show "Pass-through pending".
- [ ] **R-04** Add the dollar as a context leg where it dominates (for example the Australian dollar and iron ore).
- [ ] **R-05** Only relationships supported by standard economics are allowed. Mark weak ones "weaker link". The agent must not invent links. The next session's relationship map extends this list.

Initial relationships (existing): real yields and gold; oil, inflation expectations and borrowing costs; copper, China factories and money (weaker link); iron ore, terms of trade and the Australian dollar; the dollar, gold and oil; the RBA rate, home loans and household debt.

---

## 7. Coverage required for an Australian reader

The page makes these chains visible with current readings and no forecasts:

- [ ] **Oil to Australia:** Brent (with long-history context), Australian petrol prices (ABS fuel CPI today; a legal weekly feed if one is confirmed), CPI and trimmed mean, the RBA cash rate.
- [ ] **US dollar to Australia:** AUD/USD, the dollar index, and US shares in AUD (L2-03).
- [ ] **China and commodities to Australia:** China factory activity, iron ore, the RBA Index of Commodity Prices, terms of trade.
- [ ] **Rates to the household:** cash rate, bond yields, home-loan rate, term-deposit rate, real return on savings, wages against prices, unemployment.
- [ ] **US shares:** S&P 500 and Nasdaq 100 state and AUD view, VIX, valuation context, US 10-year and 30-year yields with highest-since context, Fed expectations proxy, US CPI and jobs, the recession alarm and probability.
- [ ] **Calendar:** RBA, ABS CPI, ABS jobs, Fed, US CPI, US jobs, ECB. Major US tech earnings dates only if a free, legal source exists, otherwise omit.

### 7.1 "Know before you buy US shares" (static information)

One collapsed box. Only text approved by an Australian tax professional and placed in `docs/insights/approved-text/`. Until then, only these two lines: "Returns are affected by the AUD/USD exchange rate." and "Currency conversion and brokerage fees apply." Topics the approved text may cover: US dividend withholding tax and the W-8BEN form, Australian tax on foreign gains, estate-tax rules for some non-US residents, and "General information only. Not financial or tax advice."

---

## 8. Registry additions (extends the fix spec registry)

Per indicator: `layer`, `publisher`, `publisher_url`, `method_url`, `what_it_is`, `what_it_isnt`, `track_record_note`, `definition` (Layer 2), `fail_closed_conditions`, and a `source` block: `level`, `owner_accepts`, `enabled`, `terms_lines`, `terms_read_on`, `attribution_text`, `method` (M1 to M5), `runtime`.

---

## 9. Tests (run with T-01 to T-14 of the fix spec, T-25 to T-34 of the scraping spec, and U-01 to U-14 of the UI spec)

- [ ] **T-15 Source level gate.** The build fails if any displayed source is L3, or is L2 with `owner_accepts` not yes.
- [ ] **T-16 FRED copyright scan.** Every FRED series is checked and the result stored.
- [ ] **T-17 Attribution present** for every source that requires it.
- [ ] **T-18 Fail closed.** Force a stale input for each Layer 1 and Layer 2 card and confirm "can't tell right now".
- [ ] **T-19 No advice wording** (extends T-07): no "buy", "sell", "hold", "undervalued", "overvalued", "opportunity", "bullish", "bearish".
- [ ] **T-20 Same-date spreads.**
- [ ] **T-21 AUD conversion** equals USD level times AUD/USD on the same date.
- [ ] **T-22 Highest-since** comes from the full stored history and matches a spot-check.
- [ ] **T-23 Regression fixtures** from known episodes (for example March 2020 and 2022).
- [ ] **T-24 Public data minimisation.** Public endpoints expose no API key, no bulk history for L2 sources, and no raw full-series download. The panic switch `ACCESS_MODE = private` makes every Insights data endpoint return 401 or 403 without login. The export tool requires the owner's token.
- [ ] **T-35 Relationship rules.** Fixtures prove R-01 to R-03 (a card with an absent trigger shows "Trigger not present"; pass-through shows "Pending").

---

## 10. Reports the agent produces

`STEP3_REPORT.md` with: every ID done, partly done or not done and how it was checked; for every source its level, terms lines, date read, attribution, `owner_accepts` and `enabled`; items left as "Link out" or "Not verified" and what would unblock them; latest test results; KV reads, KV writes and outside requests per full refresh; a "Fetched sources" section as defined in `SCRAPING_SPEC.md`.

## 11. Owner's weekly routine (10 minutes)

For `MAINTENANCE.md`:

- [ ] Open the status panel. Any failed source or failed test? If yes, do not rely on the affected cards.
- [ ] Check stale tags and update any manual-entry values before they expire.
- [ ] Before acting on any reading, check its data date and source.
- [ ] Once a quarter: review rule thresholds and `RISK_REGISTER.md`.
- [ ] If a provider objects or changes terms: set that source's `enabled` to no, or set `ACCESS_MODE` to `private`, then update the registry and re-run the tests.

## 12. Not in scope

- Any buy, sell or hold recommendation, price target or forecast.
- A self-made fear and greed score or recession score.
- Personalised advice or portfolio tools.
- Circumventing blocks or fetching behind a login or payment.
- Individual company analysis.

## 13. Optional later

- **Decision journal.** The owner attaches a note to the daily snapshot saved when he makes a decision, so he can later compare what the page showed with what happened.
