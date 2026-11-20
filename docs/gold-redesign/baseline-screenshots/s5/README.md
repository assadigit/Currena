# S5 screenshot set — the redesigned /gold page (GUX-S5 M6)

28 captures over the visual harness's fixture server (`visual/fixture-server.mjs`, port 4050 — never a live site). The corpus: `visual/fixtures/gold-projection.json` (the S2 gold projection, derived from the harness's own snapshot by `scripts/build-gold-fixture.mjs`) + `gold-ohlc.json` (300 XAUUSD daily bars, the GoldPage.test generator). The optional legs (gold-cb · gold-episodes · gold-premium · ifbought) are not part of the fixture set — the page renders their calm unavailable states by design (the console check ignores exactly those designed 404s).

## The set (28 files)

| Surface | Viewports × locales × themes |
|---|---|
| `hero-{viewport}-{locale}-{theme}.png` | desktop/mobile × en/fa × light/dark (8) — the price block + the BriefingCard + the CompositionStack |
| `seats-{viewport}-{locale}-{theme}.png` | 8 — the five-force overview: the LaneBar summaries + the closed cards |
| `sheet-{viewport}-{locale}-{theme}.png` | 8 — the record sheet open on the first lane card (the 09 expanded tier landed, the technical `<details>` collapsed) |
| `full-{desktop|mobile}-{en|fa}-{light|dark}.png` | 4 — the full page (the sticky nav made static for the capture, the gb-s3 pattern) |

## The verification (programmatic)

- All 28 files substantive (size + compressibility: no blank/near-blank captures).
- The RTL mirror confirmed structurally: the desktop hero's dense price column sits right-of-center in en and **left in fa** (`dir="rtl"` flips the grid as designed).
- The sheet's scrim renders (the edge-darkness probe).
- The seats page renders the LaneBar pills + impact inks (the saturated-pixel probe).
- Zero real console errors on every captured surface (the designed feed-404s excluded — see above).

The owner's own reading: open `hero-desktop-en-light.png` beside `hero-desktop-fa-light.png` — the briefing card wears the page's single focal treatment in both; then `seats-desktop-en-light.png` — the five LaneBars answer "how does each force lean" at a glance, the closed cards underneath.
