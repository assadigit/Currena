# Currena Insights: Defects Found in the 15 October 2026 Export

Evidence file: `docs/insights/baseline/currena-insights-full-2026-10-15.md` (line numbers below refer to it).
Export header: data as of 2026-10-15, prices updated 2026-10-15 22:13 UTC, rule version 2.
Audit method: every number was checked for internal consistency; key values were compared with outside sources on 16 October 2026.

This file lists what is **still wrong or unverified**. The agent must fix every item (or record why it cannot), add a test for each, and tick the box. Items in section B are already fine and only need a regression check.

---

## A. Defects to fix

### A1. Licence and source problems

- [x] **E-01 Yahoo Finance is still used** for Brent, gold, silver, Bitcoin, FTSE 100, the gold/silver ratio, the gold/Bitcoin ratios and gold in Australian dollars (lines 41, 100, 111, 112, 113, 115, 116, 117, 136).
  - Fix: follow `INSIGHTS_STEP3_SPEC.md` LR-02. Flag each as `private_only`. Switch to a permitted free source where one exists (confirm terms first). Never show Yahoo-sourced values in public mode.
  - Test: T-15 (public mode build fails if any Yahoo-sourced card is shown).
- [x] **E-02 gold-api.com is used for copper** (line 114) and its terms are unconfirmed. Mark `private_only` until terms are read and recorded.
- [x] **E-03 Gold, silver and Brent are futures prices** ("COMEX gold futures", "Brent front-month futures", lines 111 to 113), not spot prices. The card titles say "Gold price (ounce)" and "Oil price (Brent)". Add "futures" to the card detail line so it is not mistaken for spot.

### A2. Stale, duplicate or wrongly dated values

- [x] **E-04 Copper price looks frozen.** Value 14772.999807 (line 114) is identical to the 14 October export (14,773), yet it is stamped as of 2026-10-15. A value unchanged to six decimals over a day is almost certainly a stale value shown as fresh.
  - Fix: find why, and make the card stale or "can't tell right now" when a daily series repeats exactly.
  - Test: T-08 extended to daily series across days.
- [x] **E-05 Two different symbols show the identical daily move.** S&P 500 and S&P/TSX Composite both show -1.11% today (lines 39 and 42). It may be a coincidence, but check for a copy or mapping bug and add a test that flags identical moves to two decimals for unrelated symbols in the same run.
- [x] **E-06 Australian bond yields are 8 days old.** `au-10y`, `rba-expectations` and `au-us-10y-gap` are as of 2026-10-07 (lines 120 to 122) in an export dated 2026-10-15, for a daily series.
  - Fix: find why the RBA yield table has no newer rows (feed lag, parse failure, or a table with a delay). Show a stale tag while data is older than 4 days.
  - Note: the AU/US gap correctly uses the same date for both sides (good). Keep that.
- [x] **E-07 Quarterly date labels are inconsistent.** Wage growth, terms of trade, home values and the US government interest bill are dated 2026-04-01 (quarter start; lines 93, 127, 130, 134), while household debt is dated 2026-06-30 (quarter end; line 131).
  - Fix: store both `period_start` and `period_end`. Show the quarter name ("June quarter 2026") on every quarterly card. Confirm that the latest ABS quarter available has actually been loaded (the June quarter releases came out in August and September).
- [x] **E-08 Manual-entry source has no expiry.** China factory activity is "China NBS (manual entry)" (line 104).
  - Fix: give each manual entry an `entered_on` date and an expiry equal to the next scheduled release. After expiry the card shows a stale tag. Document the monthly steps for updating it in `MAINTENANCE.md`.
- [x] **E-09 The calendar still lists a past event.** "US consumer price index: September 2026, 2026-10-14" is under "Next up" (line 142) in an export dated 2026-10-15.
  - Fix: remove or mark released events when their date has passed.

### A3. Calculation, unit and label errors

- [x] **E-10 Wrong unit and scale for money supply.** `m2-us` shows 23342.8 with unit "trillion" (line 105). The value is in billions.
  - Fix: store the unit as "US$ billion" and display "US$23.3 trillion".
- [x] **E-11 Wrong scale for the US interest bill.** `govt-interest-revenue` shows 0.335539 with unit "%" (line 93). A fraction is labelled as a percentage.
  - Fix: store 33.55 as a percentage, and define the denominator in the card ("federal interest payments as a share of federal tax receipts" or whatever the series is; confirm against the FRED series used).
- [x] **E-12 Gold versus Bitcoin and Silver versus Bitcoin rows are the wrong way round.** `gold-btc` = 0.050894 and `silver-btc` = 0.000699 (lines 116, 117) are bitcoin per ounce, but their titles say "Gold versus Bitcoin" and "Silver versus Bitcoin".
  - Fix: retitle ("Bitcoin priced in ounces of gold") or show the 19.6 and 1,430 orientation already used on the price cards.
- [x] **E-13 Bitcoin comparison text is repeated on unrelated rows.** The same line "One bitcoin buys 19.6 oz of gold · One bitcoin buys about 1430 oz of silver" appears on the Brent, gold, silver and Bitcoin price rows (lines 19 to 22).
  - Fix: show it only on the Bitcoin row (and, if wanted, once in a ratios section).
- [x] **E-14 US inflation is probably computed from seasonally adjusted data.** The source is `CPIAUCSL` and `CPILFESL` (lines 94, 95). The BLS headline annual rate is based on the not seasonally adjusted index (FRED `CPIAUCNS` and `CPILFENS`). The two can differ by a few hundredths.
  - Fix: use the not seasonally adjusted series for the year-on-year rates, and check the result against the published BLS figure.
  - Context: September consensus was about 3.7% headline and 2.4% core before the release. The page shows 3.717% and 2.566%. The published BLS numbers could not be confirmed here, so the agent must compare them with the BLS release.
- [x] **E-15 The Fed expectations gap uses the lower bound.** `fed-expectations` = DGS2 minus DFEDTARL (line 90). `INSIGHTS_STEP3_SPEC.md` L2-08 says to use the policy-rate midpoint (3.875%).
  - Fix: use the midpoint. The reading drops by about 0.125 pts and its status may change.
- [x] **E-16 The Fed policy rate card carries only the lower bound.** `fed-target` = 3.75 (line 89). The target range is 3.75% to 4.00%.
  - Fix: store lower and upper bounds and show the range. Also show "decided [date] · effective [date]" for the last change.
- [x] **E-17 Missing reconciliation series.** The 10-year real yield (DFII10) plus the 10-year breakeven (T10YIE) should equal the 10-year yield (DGS10). The page now has the 5-year, 5-year forward breakeven (T5YIFR, line 96), which is a different measure.
  - Fix: add T10YIE for the reconciliation test. Keep T5YIFR for the "five to ten years ahead" card.
  - Test: T-01 uses T10YIE, same date, tolerance 0.05 pts.

### A4. Rules and verdict logic

- [x] **E-18 "Trend" does not match the numbers beside it.** In the stock table the 3-month column and the Trend column disagree: DAX +1.54% is "Down", Nikkei +1.36% is "Up", FTSE +1.44% is "Flat", S&P 500 +2.46% is "Flat", Nasdaq 100 +3.19% is "Flat", ASX 200 -1.28% is "Down" (lines 33 to 42).
  - Fix: define the trend basis (period and thresholds) in the registry, show it in "How is this calculated?", and make the label reproducible from the stated rule.
  - Test: a test recomputes every Trend label from the stored inputs.
- [x] **E-19 A relationship says "Partly active" with its trigger missing.** "Oil, inflation expectations and borrowing costs": oil falling, expectations steady, yields rising (line 69). The tendency is "when oil jumps". With oil falling, the trigger is absent.
  - Fix: a relationship may be "Active" or "Partly active" only if its trigger leg is present. Otherwise show "Not showing". Document the windows used for each leg (for example 7, 30 and 90 days).
- [x] **E-20 A relationship says "Partly active" when every leg agrees.** "The dollar, gold and oil": dollar rising, gold falling, oil falling (line 68), which matches the tendency "a strong dollar weighs on gold and oil".
  - Fix: check the rule. Use the same method and windows for all three legs. Oil moved +1.31% in 7 days and -2.85% in 30 days (line 19), so the window choice decides the result and must be documented.
- [x] **E-21 The "Unusual" status vanished.** USD/JPY and AUD/JPY sit at about the 95th percentile of their 10-year range (lines 102 and 133) and are now "Normal". In the previous export they were "Unusual".
  - Fix: confirm whether the rule change in version 2 is intended. If yes, document it in the rule change log. If not, restore it.
- [x] **E-22 Stock labels use verdict words that the Step 3 spec replaces.** The stock table uses "Normal", "Correction" and "Bear market" (lines 28 to 43).
  - Fix: implement `INSIGHTS_STEP3_SPEC.md` L2-01: "Near its high" (within 5%), "Pullback" (5% to 10%), "Correction" (10% to 20%), "Bear market" (20% or more), closing basis. Replace "Normal".

### A5. Export and transparency gaps

- [x] **E-23 The export lacks fields needed for an audit.** Add these columns to the export generator: `published_date` (release date, for example the CPI release day), `fetched_at`, `stale` (yes or no, with age), `source_url`, `licence`, `private_only`, `public_display_ok`, peak value, peak date and peak basis for every price series, and the rule version and thresholds used for the status.
- [x] **E-24 Peak distance is not visible.** The price table has no peak column (lines 17 to 22). Add "below its 10-year peak" with the peak value, date and basis (closing or intraday, same basis as the current price).
  - Known records for the test: Bitcoin about $126,210 (6 Oct 2025); gold about $5,590 intraday (28 Jan 2026); silver and Brent peaks must be confirmed from two sources.
  - Test: T-05.

### A6. Step 3 items not yet present

These are expected and are covered by `INSIGHTS_STEP3_SPEC.md`: US shares in Australian dollars, the 200-day average, highest-since context, real savings return, NY Fed recession probability, Shiller CAPE, crypto Fear and Greed, "Know before you buy US shares", the private access gate, the licence register and the maintenance file.

---

## B. Verified as in place (regression check only)

- [x] Rule version shown (line 6) and hero rule counts reconcile: Global 6 of 23 (lines 86 to 136) and Australia 6 of 14 both match the status column.
- [x] Australian CPI 3.97% for August 2026 and trimmed mean 3.57% (lines 118, 119), consistent with the 4.0% and 3.6% published by the ABS on 30 September.
- [x] Calendar uses decision days: FOMC 28 Oct, ECB 29 Oct, RBA 3 Nov, ABS CPI 28 Oct (lines 144 to 147).
- [x] The "five to ten years ahead" card now uses T5YIFR (line 96).
- [x] M2 now shows a non-zero change (line 105).
- [x] Relationship card for the RBA says "Pass-through pending" (line 71).
- [x] Bitcoin ratios on the price cards are in the correct orientation (19.6 oz of gold, about 1,430 oz of silver; both match the displayed prices).
- [x] Brent and Bitcoin sources are named (lines 111, 115). Time zone shown as UTC (line 5).
- [x] New indicators present: RBA cash rate, Australian 10-year yield, RBA expectations gap, Fed expectations gap, US 30-year, Philadelphia Fed, iron ore, petrol (ABS fuel CPI), household debt, recession alarm, US unemployment, VIX (shown with "© Cboe").
- [x] Gold and silver "conditions" no longer treat 2.34% inflation expectations as supportive (lines 79, 80).
- [x] Gold/silver ratio 72.8 matches 4191.7 / 57.6.
- [x] Gold in Australian dollars 5979.88 matches gold / AUD-USD 0.700967.

---

## C. Done when

Every box in section A is ticked with evidence, the tests for them pass, and the next generated export shows the new columns from E-23.
