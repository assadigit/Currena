# Currena Insights: Step 3 Spec (version 2)

Page: https://currena.ir/#/insights
Owner: Ali. Based in, or moving to, Australia. Buys or plans to buy shares on foreign exchanges (S&P 500 and big US tech).
Research date: 16 October 2026. Provider terms change. Re-check each source's terms before relying on it.
This version replaces the earlier Step 3 spec.

---

## 0. Read this first

### 0.1 What Step 3 is

The original Step 3 was "invent verdict formulas". That is replaced by three layers:

1. **Layer 1: published indicators, shown as published.** Someone else owns the method and the track record. We fetch, label and display it correctly.
2. **Layer 2: standard definitions and plain arithmetic.** Things like "10% below the 52-week high" and "price in Australian dollars". These are conventions or arithmetic, not predictions.
3. **Layer 3: our own summaries, kept small.** The hero words and relationship cards, shown as summaries of the gauges, never as forecasts or advice.

### 0.2 Prerequisites

- `INSIGHTS_FIX_SPEC.md` (Parts A to D) must be implemented and its tests passing before Layer 1 to 3 work starts. If it is not, implement the missing parts of that spec first.
- Phase 0 below (current-state check) must be done first.

### 0.3 Owner decisions (recorded, do not ask again)

| ID | Question | Answer |
|---|---|---|
| D-1 | Will Currena be monetised? | **No**, not in the mid-term. The owner uses the information to guide his own financial decisions. |
| D-2 | Ask Cboe, Shiller, Melbourne Institute or ASX for permission? | **No.** The owner wants to avoid legal trouble. |
| D-3 | Pay for data (for example the CME FedWatch API)? | **No.** Use free sources only. |

Consequences the agent must apply:

- **The Insights page is private by default** (section 2). Many free data sources allow personal use but not public display, even on a site with no revenue.
- Sources whose terms are unknown or personal-use-only are allowed in private mode and blocked in public mode.
- No permission requests, no paid data. Where a source needs either, it becomes a link-out.

### 0.4 Rules for the agent

- Never invent a series ID, table name, URL or number. Confirm each source in the provider's own documentation or data. If you cannot, mark it "not verified" in the report and do not use it.
- Do not scrape websites that offer no feed or API and no stated reuse terms. Link out instead.
- All user-facing text follows the wording rules in the fix spec: conditions only. No forecasts, no "will", "should", "time to", "expected to", no buy, sell or hold language, no claims about causes from the news.
- Units: percentage points for rates, inflation, yields, spreads and unemployment. % only for prices and indexes.
- Work on a branch named `insights-rebuild`. Commit after each phase. **Do not deploy to production.** Deploy to a preview or staging address if one exists, and tell the owner how to review it. Never push to the live site on your own.
- Never commit API keys or tokens. Keep them in Cloudflare secrets. Never expose them to the browser.
- Work without asking questions. Record blockers in the report and continue.
- Stay inside the free Cloudflare limits. Report KV reads, KV writes and outside requests per full refresh.

---

## 1. Phase 0: current-state check (read-only)

Before changing anything, the agent produces `CURRENT_STATE_REPORT.md`. No code changes in this phase.

- [ ] **S-01 Inventory of every indicator.** For each card: id, title, area, source, series ID or URL, unit, update cadence, how its text is produced (generated or typed), scored or context, where thresholds live.
- [ ] **S-02 Inventory of every source.** Name, how it is called (key, endpoint), which cards use it, licence or terms found, and the date checked.
- [ ] **S-03 Status against `INSIGHTS_FIX_SPEC.md`.** For every ID in Parts A to D: done, partly done, not done, with evidence (file and line, or a test result).
- [ ] **S-04 Status against this spec.** For every item below: done, partly done, not done.
- [ ] **S-05 Hosting and limits.** How refresh runs (scheduled worker or other), KV usage, request counts per refresh, and any free-tier limits close to being hit.
- [ ] **S-06 Test suite.** What tests exist, how to run them, current results.
- [ ] **S-07 Access.** Whether Insights data endpoints are public today. List every URL that returns Insights data without a login.
- [ ] **S-08 Risks found.** Anything else wrong or risky (exposed keys, public endpoints returning third-party data, missing attribution, stale data shown as current).

Done when: the report exists, every claim in it points to evidence, and nothing in the repository was changed.

---

## 2. Access and licence policy

### 2.1 Why

A free-to-view, no-revenue public page can still need a data licence. One data provider's own guidance says a free public website can require a display agreement even when the developer earns nothing from it. Another says its personal plans cover only dashboards that the owner alone uses, and that serving data to other people counts as redistribution. EODHD sells separate personal and commercial licences. FRED says series with a copyright notice belong to third parties and need the owner's written permission for anything beyond personal use.

Given D-1 to D-3, the safest design is:

- **Private mode (default):** only the owner can see Insights data. All sources are allowed under their personal-use terms.
- **Public mode (optional, later):** only sources marked `public_display_ok = yes` are shown. Everything else becomes a link-out or disappears.

### 2.2 Access control (private mode)

- [ ] **AC-01 Choose the simplest gate that works on the current hosting.** Preferred: Cloudflare Access in front of the Insights data endpoints (confirm it is available on the owner's plan and domain). Fallback: a login handled by the Worker with a password stored as a secret and a signed, expiring cookie.
- [ ] **AC-02 Gate the data, not just the page.** The page is a client-side app and its shell is public. Every endpoint that returns Insights data (JSON, KV reads, snapshot archive) must require authentication. An unauthenticated request returns 401 or 403 with no data.
- [ ] **AC-03 Unauthenticated visitors** see a neutral "Private page" message with no values, no source names and no hints.
- [ ] **AC-04 No keys in the browser.** All third-party API calls happen on the server side. No API key appears in the client code, the repository or any response.
- [ ] **AC-05 Cache safety.** Authenticated responses use `Cache-Control: private, no-store`. Nothing is cached where another visitor could receive it.
- [ ] **AC-06 Search engines.** Add noindex for the Insights route and exclude its data paths in robots rules.
- [ ] **AC-07 Who can log in.** Owner only by default. Personal-use data licences apply to the licensee. Do not add other users unless the owner confirms each provider's terms allow it.
- [ ] **AC-08 Mode switch.** A single config value `SITE_MODE` is `private` (default) or `public`. In public mode, the build fails if any displayed source has `public_display_ok` other than `yes` (test T-15).

Done when: tests T-15 and T-24 pass, and a manual check with no login shows no Insights data anywhere.

### 2.3 Licence register for existing and planned sources

The agent fills in the real terms and date checked. Starting points from research:

| Source | Used for | Private mode | Public mode | Notes |
|---|---|---|---|---|
| RBA tables (cash rate, yields, loan and deposit rates, commodity index) | Australia rates, commodity prices | OK | OK with attribution | CC BY 4.0 for most material. The cash rate and "financial data" have their own terms: commercial or personal use is allowed if you do not imply RBA endorsement. Required attribution: "Source: Reserve Bank of Australia [year]". Third-party content inside RBA tables needs that third party's consent, so check each table's source notes. |
| ABS data | CPI, jobs, wages, terms of trade | OK | OK with attribution | CC BY 4.0. Keep the attribution already used. |
| FRED series without a copyright notice (Fed, BLS, Treasury) | US rates, CPI, jobs, stress indexes | OK | OK | Check each series (P-5). |
| FRED series with a copyright notice (for example VIX from Cboe) | Fear gauge and others | OK for personal use | **No** | Needs the owner's written permission for anything else. |
| ECB reference rates via Frankfurter | World currencies | OK | Check | Confirm ECB terms and the Frankfurter terms. Attribute. |
| World Bank | Background data | OK | Check | Usually CC BY 4.0. Confirm. |
| gold-api.com | Gold and silver spot | Check | **Unknown, treat as no** | Read their terms before any public use. |
| EODHD | World stock markets | OK on a personal plan, owner only | **No** unless a commercial/display licence is bought | Do not exceed the plan's limits. |
| Yahoo Finance (unofficial endpoints) | Brent, gold, silver, Bitcoin, FTSE 100 | Owner-only, personal use, every use flagged `private_only` | **No** | Unofficial endpoints can break or be blocked, so fail closed (stale tag, last good value). Replace with a permitted free source wherever one exists. Never used in public mode. |
| Alternative.me | Crypto fear and greed | OK | OK | Free API, attribution shown next to the data. |
| Shiller (Yale) dataset | Valuation | OK with attribution | **No** | Open academic data, but no formal commercial terms found. |
| Australian Institute of Petroleum | Petrol prices | Check | Check | Confirm terms. |

- [ ] **LR-01 Create `LICENCES.md` or a registry block** with the real terms, attribution text and date checked for every source in use.
- [ ] **LR-02 Flag every Yahoo Finance use as `private_only`** (Brent, gold, silver, Bitcoin, FTSE 100 and their derived ratios). Yahoo data must never appear when `SITE_MODE = public` (test T-15). Where a permitted free source exists for the same series, switch to it and keep Yahoo only as a flagged fallback.
- [ ] **LR-03 Mark every source** with `private_ok` and `public_display_ok` (yes, no, unknown).
- [ ] **LR-04 Show attribution text** in "About this data" for every source used, even in private mode.

---

## 3. Principles

- [ ] **P-1 Show what it is, who publishes it, when, and its limits.** Every published indicator card has: "What it is" (one line), "What it isn't" (one line), publisher with link, data date, and a track-record caveat where one exists.
- [ ] **P-2 Fail closed.** If an input is stale, failed a test, or comes from a source whose terms are unconfirmed, the card shows "can't tell right now" and no verdict word. A blank is better than a wrong number. This matters most because the owner uses the page for his own money.
- [ ] **P-3 Readings, not instructions.** "Real yields 2.91%, highest since 2002" is allowed. "Gold: sell" is not. Sentiment gauges are never presented as signals.
- [ ] **P-4 Licence gate.** Every source has `licence_name`, `attribution_text`, `private_ok`, `public_display_ok`, `permission_ref` (none needed by default) and `terms_checked_on`.
- [ ] **P-5 FRED copyright check.** For every FRED series, check its notes for the word "Copyright" (the FRED API series search supports this). If present, set `public_display_ok = no`.
- [ ] **P-6 Attribution.** Show the exact attribution each source requires. Never imply the RBA, ABS or any publisher endorses the page.
- [ ] **P-7 Australia first.** Where a global item matters mainly because of its effect on Australia (oil, the US dollar, China), show it with its Australian link (section 7).

---

## 4. Layer 1: published indicators

Status: **Use**, **Check** (confirm series and terms before use), **Link out** (do not fetch automatically).

### 4.1 Australia: savings, mortgage, prices

| ID | Indicator | Publisher and source | Updates | Status |
|---|---|---|---|---|
| L1-01 | RBA cash rate (currently 4.60%) | RBA tables | After each board decision | **Use** |
| L1-02 | Australian government 10-year and 3-year bond yields | RBA capital market yields table (confirm which) | Daily, short lag | **Use** |
| L1-03 | Home-loan and term-deposit rates | RBA tables | Monthly | **Use** |
| L1-04 | CPI (monthly), trimmed mean, unemployment, wages, terms of trade | ABS | Monthly or quarterly | **Use** |
| L1-05 | RBA Index of Commodity Prices | RBA table I2 | Monthly | **Check** (third-party content) |
| L1-06 | ASX RBA Rate Tracker (market pricing of RBA moves) | ASX | End of each business day | **Link out** (no free feed or reuse terms found) |
| L1-07 | Westpac-Melbourne Institute Consumer Sentiment | Melbourne Institute / Westpac | Monthly | **Link out** |
| L1-08 | NAB Monthly Business Survey | NAB | Monthly | **Not verified**, research later |

### 4.2 US and global: for buying US shares

| ID | Indicator | Publisher and source | Updates | Status |
|---|---|---|---|---|
| L1-10 | VIX | Cboe via FRED `VIXCLS` | Daily | **Use in private mode only** (copyright series) |
| L1-11 | Recession probability from the yield curve | NY Fed published method, input FRED `T10Y3M` | Monthly | **Check.** Reproduce the NY Fed's published formula exactly. Do not invent coefficients. Caveat shown: probability within a year, not timing; more information can change the estimate. |
| L1-12 | Sahm rule | FRED `SAHMREALTIME` | Monthly | **Use** (confirm copyright flag) |
| L1-13 | Financial stress and financial conditions | St. Louis Fed stress index, Chicago Fed NFCI | Weekly | **Use** (confirm copyright flag) |
| L1-14 | Shiller CAPE and Excess CAPE Yield | Robert Shiller dataset (`ie_data.xls`) | Monthly, first or second week | **Use in private mode only.** Attribute Shiller. Shiller keeps no history of past versions, so archive every download. Excess CAPE Yield = (1 / CAPE) x 100 minus the real 10-year Treasury yield. It is a long-term valuation measure, not a timing tool. If reading the Excel file inside a Worker is impractical, convert it to JSON in a monthly scheduled GitHub Action and commit the small result to a private location. |
| L1-15 | What markets expect from the Fed | CME FedWatch | Daily | **Link out.** Paid API, owner declined. Use the free proxy L2-08. Do not use unofficial scrapers. |
| L1-16 | US CPI, unemployment, payrolls | BLS via FRED | Monthly | **Use** (confirm copyright flag) |
| L1-17 | One US activity survey | Philadelphia Fed manufacturing survey via FRED, or Atlanta Fed GDPNow | Monthly or several times a month | **Check** |
| L1-18 | Crypto Fear and Greed | Alternative.me free API | Daily | **Use.** Attribution next to the data. Show the publisher's own description. Never present it as a recommendation. |

### 4.3 Not recommended

- **CNN stock-market Fear and Greed.** Seven US stock measures, CNN does not publish how each is scaled, and there is no free official feed. Recreating it is inventing again.
- **ICE BofA credit spreads on FRED.** Licence terms apply and FRED may limit history. Skip unless licensing is confirmed.

---

## 5. Layer 2: standard definitions and plain arithmetic

Each card shows its definition in "How is this calculated?".

- [ ] **L2-01 Stock market state for S&P 500, Nasdaq 100 and ASX 200** by distance below the 52-week high (closing basis, one consistent definition):
  - within 5% of its high: "Near its high"
  - 5% to 10% below: "Pullback"
  - 10% to 20% below: "Correction"
  - 20% or more below: "Bear market"
  The 10% and 20% lines are common market conventions. Say so in the details. Do **not** add "range" or "bullish" verdicts.
- [ ] **L2-02 Price against the 200-day average.** Show "above" or "below" and the percentage gap.
- [ ] **L2-03 US shares in Australian dollars.** For the S&P 500 and Nasdaq 100, show the USD level and the AUD-converted level (USD level times AUD/USD, same date). Show the 1-month change in USD, in AUD, and the exchange-rate effect.
- [ ] **L2-04 "Highest since [year]".** For yields, inflation and other long-history series, find the last time the value was this high or low in the full stored history and show the year. Needs full history, not just 10 years. Examples: US 10-year and 30-year yields.
- [ ] **L2-05 Spreads, all from the same date:** US 10-year minus 2-year; Australian 10-year minus US 10-year; Australian 3-year minus the RBA cash rate.
- [ ] **L2-06 Real return on savings.** Term deposit rate minus Australian inflation, "before tax". Do not call it good or bad.
- [ ] **L2-07 Real-yield reconciliation.** Nominal yield minus real yield equals breakeven inflation within tolerance.
- [ ] **L2-08 Market-expectations proxy for the Fed.** US 2-year yield minus the policy rate midpoint. Label: "When the 2-year yield is well above the policy rate, markets have usually been pricing further hikes. This is a rough read, not a probability."
- [ ] **L2-09 Market-expectations proxy for the RBA.** Australian 3-year yield minus the cash rate, same label. Link to the ASX RBA Rate Tracker for the market's own pricing.
- [ ] **L2-10 Valuation context.** From L1-14: show the CAPE, its percentile in its own full history, and the Excess CAPE Yield. One line: valuation measures say little about the next few months.

Everything here comes from the registry. No hand-typed conclusions.

---

## 6. Layer 3: our own summaries, kept small

- [ ] **L3-01 Hero words.** Keep them, with the visible rule from the fix spec. Rename the label "Summary of the gauges below".
- [ ] **L3-02 Relationship cards.** Reduce each card to the current readings with their direction and one line on the usual tendency. Remove "Active", "Partly active" and "Signals disagree". Rules must follow the fix spec (B-04).
- [ ] **L3-03 No new composite scores.** Do not build our own fear and greed score or recession score. Show VIX and the stress index separately.
- [ ] **L3-04 Context notes** follow rule A-06 of the fix spec (dated, with expiry, off by default).

---

## 7. Coverage required for an Australian reader

The page makes these chains visible with current readings and no forecasts:

- [ ] **Oil to Australia:** Brent price (with long-history context), Australian petrol price, Australian CPI and trimmed mean, the RBA cash rate.
- [ ] **US dollar to Australia:** AUD/USD, the dollar index, and US shares in AUD (L2-03).
- [ ] **China and commodities to Australia:** China factory activity, iron ore price, RBA Index of Commodity Prices, terms of trade.
- [ ] **Rates to the household:** cash rate, bond yields, home-loan rate, term deposit rate, real return on savings, wages against prices, unemployment.
- [ ] **US shares:** S&P 500 and Nasdaq 100 state and AUD view, VIX (private mode), valuation context, US 10-year and 30-year yields with highest-since context, Fed expectations proxy, US CPI and jobs, the recession alarm and probability.
- [ ] **Calendar:** RBA, ABS CPI, ABS jobs, Fed, US CPI, US jobs. Major US tech earnings dates only if a free, legal source exists, otherwise omit.

### 7.1 "Know before you buy US shares" (static information)

One collapsed information box, reviewed by an Australian tax professional before the owner relies on it:

- Returns are affected by the AUD/USD exchange rate.
- US dividends can face US withholding tax, and Australians usually complete a US tax form with their broker (W-8BEN).
- Currency conversion and brokerage fees apply.
- Gains and dividends from foreign shares are taxable in Australia.
- Estate-tax rules can apply to some non-US residents' US-listed holdings.
- "General information only. Not financial or tax advice."

The agent must not add numbers or tax rules beyond what a professional approves. If no approved text exists, show only the exchange-rate and fees lines.

---

## 8. Registry additions (extends the fix spec registry)

Per indicator: `layer`, `publisher`, `publisher_url`, `method_url`, `what_it_is`, `what_it_isnt`, `track_record_note`, `definition` (Layer 2), `fail_closed_conditions`, and a `licence` block: `licence_name`, `attribution_text`, `private_ok`, `public_display_ok`, `terms_checked_on`.

---

## 9. Tests (run with T-01 to T-14 from the fix spec)

- [ ] **T-15 Mode gate.** With `SITE_MODE = public`, the build fails if any displayed source has `public_display_ok` other than `yes`.
- [ ] **T-16 FRED copyright scan.** Every FRED series is checked for a copyright notice and the result is stored.
- [ ] **T-17 Attribution present.** Every source with an attribution requirement shows the exact text.
- [ ] **T-18 Fail closed.** Force a stale input for each Layer 1 and Layer 2 card and confirm it shows "can't tell right now".
- [ ] **T-19 No advice wording.** No "buy", "sell", "hold", "undervalued", "overvalued", "opportunity", "bullish", "bearish" in generated text.
- [ ] **T-20 Same-date spreads.** Every spread uses values of the same date, or says "dates differ".
- [ ] **T-21 AUD conversion.** AUD-converted level equals USD level times AUD/USD on the same date, within rounding.
- [ ] **T-22 Highest-since.** The year comes from the full stored history and matches a spot-check.
- [ ] **T-23 Regression fixtures.** Saved inputs from known episodes (for example March 2020 and 2022) produce the expected Layer 2 labels.
- [ ] **T-24 Access.** Requests to every Insights data endpoint without a login return 401 or 403 and no data. No API key appears in any client file or response.

---

## 10. Report the agent must produce

Create `STEP3_REPORT.md`:

1. Every checklist ID: done, partly done or not done, with how you checked it.
2. For every source: series ID or URL, licence name, attribution text, `private_ok`, `public_display_ok`, date terms checked.
3. Every item left as "Link out" or "Not verified", with what would unblock it.
4. Latest test results.
5. KV reads, KV writes and outside requests per full refresh.
6. How to review the branch and how to deploy it after the owner approves.
7. Instructions for a full export (all hidden sections expanded) for the next audit.

---

## 11. Owner's weekly routine (10 minutes)

For the owner, not the agent. Add to the repository as `MAINTENANCE.md`.

- [ ] Open the status panel. Any failed source or failed test? If yes, do not rely on the affected cards.
- [ ] Check stale tags. Anything older than its normal age?
- [ ] Before acting on any reading, check its data date and source.
- [ ] Once a quarter: review rule thresholds and the licence register.
- [ ] After any provider announces a change (terms, API, series): update the registry and re-run the tests.

---

## 12. Not in scope

- Any buy, sell or hold recommendation, price target or forecast.
- A self-made fear and greed score or recession score.
- Personalised advice or portfolio tools.
- Scraping websites that offer no feed, API or stated reuse terms.
- Individual company analysis.
- Public launch. If the owner later wants to open Insights to the public, that is a separate task: switch `SITE_MODE` to `public`, resolve every failing test, and have an Australian professional review the page.

## 13. Optional later

- **Decision journal.** The owner can attach a short note to the daily snapshot saved when he makes a decision, so he can later compare what the page showed with what happened. Uses the snapshot archive from the fix spec.
