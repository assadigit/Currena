# Evidence — 2026-10-20 (owner UI restore): the previous hero + ContinueStrip + full lens table live over the v3 data layer

The owner's directive: "I liked the previous UI more, especially for the
world and australia header sections. please revert back to the previous
version UI, but keep the new data, connections etc. I mean keep those part
of updates which are about the indicators and their connection and
reliability. but in the PREVIOUS UI."

Deployed tree: `0bd742c` → currena-api **`d51b0afe-d59f-46c0-a12d-3b58cc1cd273`**
(currena-markets untouched this round — its worker did not change; it stays
at `3f245d75` from the 2026-10-19 v3-merge deploy).

## Screenshots (currena.ir, live, 2026-10-20)

| File | What it shows |
|---|---|
| `live-en-1440-hero.png` | The RESTORED editorial hero, EN desktop — the two art-band region cards side by side (Global first), the tinted verdict pills (both Stressed) + four-step meters, flagged rows with values, compact gauge rows with state badges |
| `live-en-1440-full-table.png` | The RESTORED full markets table — Market · Today · 1 week · 1 month · 3 months · 1 year · From 52-week high · Trend · Status · Last close, 16 live rows, the kept local-currency note |
| `live-en-390-hero-carousel.png` | Mobile 390px — the Global-first swipe carousel (swipe cue, 2 position dots, prev/next bar) |
| `live-fa-390-carousel-australia.png` | fa RTL mobile after one Next click — the Australia card snapped into view (active dot 1) |

## DOM probes (agent-browser, live)

- `Insights-BV1B4d2b.js` served — hash-identical to the restored local build.
- Hero: 2 `[data-region-card]`, first `global` then `australia`; 2 verdict
  pills + 2 large meters; 2 art-band layers; 2 attention-tile lists; 8
  gauge rows; the R4 biggest-move card ("US 10-year interest after
  inflation +0.16pts … unusually large").
- Global card (§5.3/§6.11 restored): count line "5 of 10 indicators need
  attention" WITH `data-markets-in-count`; the World signals panel ("World
  stock markets · Needs attention: 5 of 16 markets are 10% or more below
  their 52-week high." + the section-indicator chip).
- Australia card: its own signals box, 3 area bullets (owner round 4).
- fa RTL: «جهانی» / «پرتنش», «۵ شاخص از ۱۰ شاخص نیازمند توجه‌اند.»,
  «سیگنال‌های جهانی», «برای دیدن استرالیا بکشید», Persian digits,
  zero horizontal overflow.
- Mobile carousel: track scrolls + snaps, 2 dots, 2 prev/next buttons,
  Next click → Australia in view, active dot 1, zero overflow.
- Kept v3 data surface live: the data-health chip ("4 stale · View About
  this data"), the per-metal balances (2 BalanceScale elements), the
  5-lens view pills, and — resolved by tonight's cron — the **1-year
  column carries real values** (the §12 chg1y backfill check passes).
- Zero console errors, zero page errors (EN + fa, 390 + 1440).
