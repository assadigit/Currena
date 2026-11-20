# S7 screenshot set — the answered Q1 + the S4 patterns on the lower-page surfaces (GUX-S7 M6)

22 captures over the visual harness's fixture server (`visual/fixture-server.mjs`, port 4050 — never a live site). The corpus: the S5/S6 fixtures + two new fixture-server routes this session added (`/api/insights/gold-expectations` — the GoldExpectations.test snapshot shape — and `/api/insights/pages/global`, the gold-fixture pattern). The playwright project `gux-s7` (`apps/web/visual/gux-s7-screenshots.plw.ts`).

## The set (22 files)

| Surface | Files |
|---|---|
| `briefing-{viewport}-{locale}-{theme}.png` | 4 — the five-state CONDITIONS word in the hero's summary spine (Q1-B: «شرایط…حمایت/فشار می‌کند» replaces the market vocabulary), light-desktop + dark-mobile pairs |
| `bridge-{...}.png` | 4 — the regional chapter chrome: the teal ring + the "Regional market · Tehran · Toman (IRR)" chip over the board |
| `onramp-{...}.png` | 4 — the education accordion open: the drivers' LaneBar closes (drivers 1/2/3/5; driver 4 display-only) |
| `timemachine-{...}.png` | 4 — the machine open: the five lanes in the same LaneBar grammar |
| `expectations-{...}.png` | 4 — the five outcome rows with the neutral-ink probability bars (the leader emphasized) |
| `global-tile-desktop-{en|fa}-light.png` | 2 — the /global (home) Gold Balance tile carrying the SAME five-state word |

## The verification (programmatic)

- All 22 files substantive (the min-size + non-blank histogram probe).
- The pair discipline: light-desktop + dark-mobile for every surface; en + fa throughout.

The owner's own reading: `briefing-desktop-en-light.png` beside `briefing-desktop-fa-light.png` — the summary line now reads "Conditions … gold" («شرایط … طلا») in both; then `bridge-desktop-en-light.png` — the teal chapter frame reads as its own regional section, unmistakable from the global sections above it.
