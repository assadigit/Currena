# Production evidence — 2026-10-21 — the gold/silver OUTLOOK states (round-45)

## What shipped

The owner's bug report: the metals' verdict slot said EN "Works against" but
fa «شرایط موجود با الگوی معمول هم‌خوانی ندارد» — two different statements.
Fix: the owner's SEVEN-STATE "Gold Market Outlook" classification
("Strong Bullish / Bullish / Neutral / Range-Bound / Bearish / Strong Bearish
/ Mixed Signals") with the owner's own bilingual sentences, one state machine
so EN and fa can never drift again. See docs/QA/quirks-2026-10-21-outlook-states.md
for the verbatim state list + the mechanical mapping.

## Deployed

- currena-api version `d0d28c3f-f0a9-4619-b269-8f7337d9daa9` (second deploy —
  the first, `a5d2f793…`, put the sentence in the chip HEADER where it
  wrapped into a 4-6-line staircase at 375px; the sentence now rides its own
  full-width line under the header, above the chart — one anatomy, all widths).
- SITE_MODE=public untouched; currena-markets untouched (9b5ff7e0).
- Served Insights chunk `Insights-DlDkQ-3K.js` — sha256
  `1d0778c50aa8004ed94dad6b2f84dcf373aca6c3878aa9973871ffb1643fbdf7`,
  byte-identical local vs production (curl 200).
- Served-bundle copy check: the old mismatched fa sentence — 0 occurrences;
  the owner's sentences present (fa bearish-gold ×1, EN bearish-gold ×1,
  all 7 EN gold sentences present).
- /api/insights → 32 readings (unchanged engine output shape).

## Live browser verification (agent-browser, production, fresh SW-purged load)

Live data produced `bearish` for both metals (footing rows against, real
yields against, plus a quiet-but-directional quarter) — the mapping ran for
real and both locales render the SAME state:

- EN desktop 1280: heading "Outlook"; chips = [icon box · gold · US$4,165]
  / [icon box · silver · US$57.27]; red zigzag + "Signs point to a potential
  decline in gold/silver prices." on ONE line each; charts aligned on one
  baseline; range chips Quarter·1y·5y·10y with deltas (+4.3% / +2.5% Quarter).
- fa desktop 1280 (RTL): «چشم‌انداز»; mirrored chips; «نشانه‌ها حاکی از
  احتمال افت قیمت طلاست.» / «…قیمت نقره است.» one line each; Jalali X ticks;
  deltas «+۳٫۶٪ سهماهه» / «+۲٫۵٪ سهماهه».
- EN mobile 375 / fa mobile 375: same one-anatomy chips, sentence wraps ≤2
  lines at full chip width — NO staircase; scrollWidth 375 === 375 both.
- Collapsed line (both locales): "Outlook: Bearish" / «چشم‌انداز: نزولی»
  (data-collapsed-verdict="bearish").
- Condition rows keep their own supports/works-against words (the checklist
  is NOT the outlook — untouched scope); the prices board is intact
  (4 tiles + icons — the 2026-10-19e restore untouched).
- Zero page errors, zero console errors.

## Files

- en-desktop-strip.png / en-mobile-strip.png / fa-desktop-strip.png /
  fa-mobile-strip.png — production captures AFTER the layout fix (fresh
  loads; the PWA's stale precache was purged to get the new chunk — recorded
  here because the lesson generalises: verify the loaded chunk hash, not the
  deploy log).
- prod-status.txt — the commands' outputs (chunk sha, copy counts, API shape).

## Gates (all green, final state)

- pnpm copy:audit — clean (21 NEW triaged round-45, 2 CHANGED, 3 REMOVED).
- Tests: 1,446 green (core 191 · scraper 67 · insights 462 · markets 13 ·
  api 237 · web 476; +15 new outlook tests).
- typecheck 6/6 · lint 0 errors / 15 accepted advisories.
- Bundle budgets held: entry 295.15/88.76 kB raw/gz (296/89.5); Insights lazy
  596.60/141.83 (604/142.8) — +0.53 kB gz for the 28 authored sentences.
