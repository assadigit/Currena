# GIE-S1 baseline screenshots — the live evidence set

**Captured:** 2026-11-21, 13:14–13:25 UTC · **Route:** `https://currena.ir/gold` (live production, read-only visitor GETs) · **Tree:** the S10 close (`origin/main` `bead3ff2`'s runtime; this session's branch adds docs + the harness only — the served entry/CSS/GoldPage chunks byte-verified identical to the fresh build) · **Harness:** `apps/web/visual/gie-s1-live.config.ts` + `gie-s1-screenshots.plw.ts` (the gux-s9-live pattern; the REAL `theme` key per S8-D3).

**The live state at capture** (the full record in `fetch-audit.json`): headline "Gold: conditions lean against it" · five-state "moderately pressure gold" · outlook attr `bearish` · stack verdict `against` · lanes borrowing-costs/dollar/inflation against, stress for, flows neutral · US$3,539 · −8.94% 7d · hero as-of "01:13 pm UTC" · page height 17,331 px (en desktop) / 26,399 px (en mobile) · 37 seats · 5 lanes · 13 context cards · 2 position cards · 7 nav chips · 23 collapsed affordances · **zero console/page errors** except `gold-episodes`' designed 503 · **17 requests, all first-party**.

## The set

| File | Locale | Size | Theme | Content |
|---|---|---|---|---|
| `fetch-audit.json` | — | — | — | the network audit + the live-state record + the console census |
| `01-en-desktop-1440-full` | en | 1440×1000 (full 17,331 px) | light | the complete page |
| `02-en-desktop-hero` | en | 1440 | light | price block + BriefingCard + CompositionStack |
| `03-en-desktop-zoneD` | en | 1440 | light | narrative + yield decomposition + on-ramp + expectations |
| `04-en-desktop-zoneF` | en | 1440 | light | the Iran bridge + premium history |
| `05-en-desktop-signals` | en | 1440 | light | the gold verdict strip + interactive chart |
| `06-en-desktop-seats` | en | 1440 | light | the five lanes × 37 seats |
| `07-en-desktop-ta` | en | 1440 | light | the TA reference band |
| `08-en-desktop-context-zoneK` | en | 1440 | light | the 13 context cards + CB tracker + vault + correlation |
| `09-en-desktop-positions-relationships` | en | 1440 | light | the CFTC bars + the relationship explorer |
| `10-en-desktop-tail` | en | 1440 | light | Zone O: episodes (503 waiting) + if-bought + publication notes |
| `11-en-desktop-onramp-expanded` | en | 1440 | light | the education accordion OPEN |
| `12-en-desktop-expectations-expanded` | en | 1440 | light | the Polymarket + calendar strip OPEN |
| `13-en-desktop-seat-drill` | en | 1440 | light | a lane drill link followed (the on-ramp → #lane anchor) |
| `14-en-desktop-context-details` | en | 1440 | light | a context card's record sheet open |
| `20-fa-desktop-1440-full` | fa | 1440 (full 16,191 px) | light | the complete Persian page (RTL) |
| `21-fa-desktop-hero` | fa | 1440 | light | the hero, RTL |
| `22-fa-desktop-seats` | fa | 1440 | light | the seats, RTL |
| `23-fa-desktop-tail` | fa | 1440 | light | the tail, RTL |
| `30-en-mobile-390-full` | en | 390×844 (full 26,399 px) | light | the complete mobile page |
| `31-en-mobile-hero` | en | 390 | light | the mobile briefing |
| `32-en-mobile-seats` | en | 390 | light | the mobile lanes |
| `33-en-mobile-nav` | en | 390 | light | the sticky chip-scroller mid-scroll |
| `40-fa-mobile-390-full` | fa | 390 (full 23,569 px) | light | the complete Persian mobile page |
| `41-fa-mobile-hero` | fa | 390 | light | the mobile briefing, RTL |
| `50-en-desktop-dark-full` | en | 1440 | dark | the dark pair (avg RGB ≈ 25/33/43 — genuinely dark) |
| `51-en-desktop-dark-hero` | en | 1440 | dark | the dark hero |
| `60-fa-desktop-dark-hero` | fa | 1440 | dark | the RTL + dark composition |

## Machine verification

Every PNG was checked non-blank (the PIL histogram test — non-white ratios 0.32–1.00, sizes correct); the dark pairs' average RGB measured (25/33/43 full; 15/20/28 hero — the genuine-dark lineage). The VLM reviews (z-ai vision, glm-5.3-flash) of 02, 01, 20 and 30 are summarized in `04-comprehension-gap-audit.md` — each claim used there was cross-checked against the DOM record or source.

## Known limits (stated per the evidence standard)

Tablet width not captured (S5/S6 matrix adds it); no NVDA/VoiceOver session (the standing headless limit); the expanded-state captures cover four of the ~23 collapsed affordances (the S13 matrix walks the rest); live data is the capture-moment snapshot — the market moved after (the record preserves the state).
