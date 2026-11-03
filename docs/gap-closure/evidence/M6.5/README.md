# M6.5 evidence — the final quality pass (S6, 2026-11-03)

## The venue note (honest)

The production deploy is blocked from this session (no Cloudflare
credentials — see PROGRESS.md's sixth claim note). The pass therefore ran
on a **local verification stack**: the repo's own web dev server
(`apps/web` vite, the working-tree code) proxying a **pass-through mock
API** that serves the LIVE production snapshot with exactly THREE
injected readings — the S6-M6.3 ids at their provider-exact values
(usd-reserve-share 56.7048 @ 2026-Q2 start, sp500-breadth-ratio 0.292488
@ 2026-11-02, btp-bund-spread 0.8003 @ 2026-08-01; the percentiles/sd/
changes computed from the provider series; usd-reserve-share's
percentile honestly absent — 42 quarters < the 120-observation floor).
Everything else on the page is the live production data. The production
state itself (M6.1/M6.2) was browser-verified by the earlier S6 sessions;
the M6.3 cards' production verification rides the post-push session.

## 1. The fix the pass caught (the headline)

**`usd-reserve-share` was missing from `DOLLAR_STRENGTH_IDS`** — the
dollar lane's render list in `sections.ts`. The reading would have
landed in the snapshot but the card would NEVER have rendered on the
page (the lane renders exactly that list). Caught live when the local
lane render showed six cards and no COFER row; fixed in the same
session (the card joins at the lane's foot, after the crosses), the
R9-04 pin test updated, and the full gates re-run green (14,508). This
is exactly the class of bug the pre-deploy render check exists to
catch — the check paid for itself.

## 2. The render verification (both locales, provider-exact)

- **EN**: all three cards render — "US dollar share of official FX
  reserves **56.7%** · data for June quarter 2026 · IMF COFER" (the
  dollar lane); "S&P 500 equal-weight vs cap-weight (concentration
  proxy) **0.2925** … the giants are carrying the index — a narrow
  market" (market-stress); "Italy–Germany 10-year spread **0.80 pts**
  ↓−0.01 pts … near its recent lows" (borrowing). VLM-verified on the
  screenshots (layout clean, no defects).
- **fa (RTL)**: «سهم دلار آمریکا از ذخایر ارزی رسمی ۵۶٫۷٪»، «هم‌وزن در
  برابر وزنیِ S&P 500 (سنجهٔ تمرکز) ۰٫۲۹۲۵»، «فاصلهٔ ۱۰ سالهٔ ایتالیا و
  آلمان ۰٫۸۰ واحد درصد» — Persian digits, RTL, the round-75 copy.
  VLM-verified. The details dialog opens in fa with the full copy incl.
  the Jalali dates (۱۴۰۵/۰۸/۱۲).
- The lane disclosures (the R7 "Show all N hidden" rows — the known
  verification trap) were expanded before every check.

## 3. Responsive + overflow (360 / 768 / 1200, EN + fa)

**0px horizontal overflow at 360 in BOTH locales** (measured
`document.documentElement.scrollWidth` 360 = clientWidth). Full-page
screenshots at all three widths in both languages.

## 4. The screenshot set (`screenshots/`, 22 files)

EN @1200: full page · the dollar lane (COFER card) · the TIC "Who holds
US government debt" section · the geopolitics/fragmentation gauge · the
growth lane · the market-stress lane (the breadth card) · the borrowing
lane (the BTP card) · the Australia trade/partner links lane · the
Australian markets board · the "Next up" calendar. EN @768 + @360 full
pages. fa @1200: the same set (full · dollar lane · TIC ·
fragmentation · economy · trade links · AU markets · next-up). fa @768
+ @360 full pages.

## 5. Accessibility sweep (the S6 additions)

- The three new cards render as `<button>` rows — keyboard-focusable,
  visible focus (outline/box-shadow confirmed via computed styles).
- The details panel opens via keyboard activation and is a proper
  `[role=dialog]`; **Escape closes it** (tested).
- No new interactive components were added by S6 beyond card rows in
  the existing lanes (no new sortable tables or meters); the M6.1 AU
  board + NZX row were swept in their own milestone.
- Console: **zero errors** across the session (only vite/devtools
  noise in dev mode).
- Contrast: the cards use the established design system's tokens
  (VLM-verified legibility in both locales and both themes' light
  default; the dark mode toggle renders the same tokens).

## 6. Performance + request count

- Bundle budget (the gates check): entry 294.45/88.49 kB · **Insights
  lazy 1522.36/352.01 vs the 1530/353 ceiling** (the S6-M6.3 justified
  bump, CHANGELOG §2026-11-02j).
- Page-load request shape unchanged: **one snapshot read
  (`/api/insights`) + the dataset endpoints** (markets, fx, tic,
  markets-au, narrative) + the existing lazy per-card history fetches
  (the details panels' charts) — no new endpoint classes were added by
  S6.

## 7. Free-tier audit (the final numbers)

- **Cron triggers: 5/5 — FULL.** api worker ×1 (the `* * * * *`
  minute-cron; every rung gates inside it by UTC hour:minute) + markets
  worker ×4 (23:30 UTC weekdays · 01:30 UTC · 08:50 UTC · 07:00 UTC
  weekdays). No new cron is possible on the free plan — any new
  cadence must ride the minute-cron's gates (the S6-M6.3 COFER
  Saturday gate does exactly that).
- **KV writes/day: ~89 typical** (the S5 close's ~88 + the
  sp500-breadth-ratio daily history key; the COFER reading rides the
  snapshot/public/stage/status writes that already happen, and its
  history key writes only on quarterly change; the btp-bund-spread
  derives at the main build — zero new writes). Well inside the
  1,000/day free cap — the S4 cap-exhaustion lesson (dispatch-heavy
  days) stands recorded.
- **Subrequests per rung (worst case):** main 04:10 **~47/50 (FULL —
  never add)** · rung2 04:20 **~8–44** (a plain weekday ~8 +2 for the
  RSP/SPY pair; Saturdays +1 COFER; the first-Saturday-of-a-month
  stacking ~19 — all inside 50) · history 04:25/04:27 ~26 each · rung3
  04:30 **~45/50 on all-gates days** (tic 4 + portwatch 18 +
  abs-au-macro 22 + status) · rung4 04:35 **~45/50** · hourly prices
  4 fetches · narrator ≤3 AI calls.
- Reads: the page serve = 1 KV read per page hit + 1 per dataset
  endpoint (unchanged by S6).

## 8. Data-health review (production, read-only)

`/api/insights/status` @ generatedAt 2026-11-02T17:20:46Z: **zero
failed sources, all 14 validation tests pass**, staleCount 16. The
honest exceptions, each explained by its own design: nz-short-rate +
both China ids read `unavailable` (the OECD 500 class + the pending KV
landings — the 04:20 UTC bootstrap owns both); the 16 stale are the
monthly/quarterly families whose refreshes ride their own gates (the
ABS monthly set, euro-hicp, copper-gold — all inside their
staleAfterDays design or awaiting the next rung). The three consecutive
daily runs' green check is **deferred to the post-push session** (this
session cannot dispatch); the observable state (zero failed sources +
green validation + the honest unavailable faces) is recorded here.

## 9. What was fixed

1. `DOLLAR_STRENGTH_IDS` — the missing usd-reserve-share row (§1).
2. (Carried from the M6.3 close, same session:) the breadth.test.ts
   unused-var lint error; the three missing btp-bund-spread
   glossaryTerms manifest rows; the duplicated IMF COFER LICENCES.md
   row; the stale §A/§1 section-split counts corrected to
   definitions.ts-exact 123/38.
