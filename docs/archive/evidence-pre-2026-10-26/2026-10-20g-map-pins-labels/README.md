# Evidence — 2026-10-20g map owner round (live)

**Owner asks (this round):**
1. *Add any remaining indice of the app to the world map* — all **16 registry
   indices** now pin and card (was 9).
2. *When country is selected the border… add an animating and moving
   `- - - - -` around the country instead* — the selected country wears a
   **marching-ants dash** (`stroke-dasharray: 3.5 2.8`, `wm-ants 1.05s
   linear infinite`, one dash-period per cycle; `prefers-reduced-motion`
   keeps the dash and stops the march).
3. *In the selected country write its name with 60% opacity like Brazil USA
   Australia* — the selected country's short name renders at
   **`opacity: 0.6`** (USA / Brazil / Australia / … ; Persian in fa —
   آمریکا for any of the US trio's cards). One label at a time; it retires
   when the pointer leaves the map.
4. *The dots should be 3D with filled-in red/green, like pins on a map* —
   every index renders a **3D teardrop pin**: filled with the direction
   colour (green rise / red fall — filled whether open or closed), a rim cut
   ~22 mix-points hotter than the fill, a specular highlight, a ground
   shadow, and the open/closed core (solid = open, hollow = closed). The
   flat dot retires.

**Deploy:** `currena-api` version `49380c2e-a1bd-41be-bd55-1312653f0e8f`
(web-only round — the diff touches `apps/web` + docs, so no markets worker
deploy). Main commit `c1c7699`.

## Live verification (currena.ir, 2026-10-21)

EN desktop 1440 (`en-1440.png`):
- `land: 173` paths, `pins: 16`, `cards: 16`, `lines: 16`, layout `map`.
- Real hover on the S&P 500 card → US path `wm-c s-u on`,
  `animationName: wm-ants`, `strokeDasharray: 3.5px, 2.8px`; the dash
  **marches** (two samples of `strokeDashoffset`: −1.999px → −4.398px).
- Label `USA` at `opacity: 0.6`; leaving the map → `0` labels, US `on`
  class gone.
- Pin anatomy on all 16 (`wm-pin-hl` + `wm-pin-sh` + `wm-pin-core`
  present); live directions: dow/tsx/ibov/cac/dax/stoxx50/nifty50/taiex/
  n225 red-down, sp500/ndx/ftse/hsi/ssec/kospi/asx200 green-up; all
  honestly `closed` (the KV snapshot predates the session).
- Exactly **12 tinted countries** — 036 076 124 156 158 250 276 356 392
  410 826 840 — the aggregated set: no Hong Kong (no 110 m path) and no
  Eurozone tint (the Euro Stoxx 50 has no single country).
- VLM review of the capture: 3D teardrop pins red/green ✓, exactly 16
  cards in the intended bands ✓, country tints ✓, "professional and highly
  readable… does not feel cluttered".

FA desktop 1440 (`fa-1440.png`): page `rtl`, stage `ltr`, 16/16/173;
hover → label `آمریکا` at 0.6.

EN mobile 390 (`en-390.png`): layout `list`, 16 pins, 173 land,
`horizontalOverflow: 0`.

Zero page errors, zero console errors/warnings on every visit.

## Local gates (fixture server)

- `world-map.plw.ts` **45/45** — the 20 screenshots, container switch,
  centring inset, no-clip, card/line geometry (16 cards, no overlap, no
  crossing, order = §4.1), contrast both themes (27→48 cell inks, pin
  fill ≥3:1 vs land AND surface, rim ≠ fill, tints ≥1.1 vs land with the
  UK at the flat-band floor t=34%, monotone tint distance), axe zero
  serious/critical, keyboard walk (16 cards, Enter opens the detail),
  Farsi (Persian digits/minus/٪, unmirrored map, FA label), the mock
  states, the list-layout pin tap, and the new round's tests: ants march +
  reduced motion, label texts + 60% + retirement, pin anatomy, and the
  aggregation honesty trio (strongest-mover tint; removing one US index
  keeps the tint; removing all three neutralises the country).
- U-suite 19/19, screenshots project 4/4, web vitest 698/698, repo
  suites 1,835 green (core 191, scraper 67, insights 532, markets 13,
  api 334, web 698), `tsc --noEmit` clean, eslint 0 errors (15
  pre-existing warnings), `copy:audit` clean (manifest +17 entries,
  round `owner-2026-10-20g-map-pins-labels`).

## Design notes

- **NY fan:** the S&P 500 stays exactly on New York; the Dow fans SW and
  the Nasdaq NE (build-time display fans, ~1.75%×2.3% of the map box).
  The Euro Stoxx 50 pins at Brussels (the EU capital) with a small SE fan
  off the tight London/Paris/Frankfurt cluster.
- **Aggregation:** a country hosting several indices tints by its
  STRONGEST fresh mover in the selected period — the biggest
  single-index move on screen, never an average.
- **Tint base:** the tint now mixes over the `--wm-land` token (not the
  surface) so its distance from neutral land grows strictly monotonically
  with the mix in both themes.
- **Mark ramp:** pin fill 60→90 with the rim at fill+22 (cap 100), so
  fill ≠ rim at every weight and the fill holds ≥3:1 on land and surface.
- **Label anchors:** hand-cleared against all sixteen cards, their leader
  lines and the pin bulbs at the fixture width (see `MAP_LABELS` in
  world-map-config.ts for the per-country rationale).
- **One-visit PWA transition** (unchanged from 2026-10-20f): returning
  visitors may see one transitional visit with cards-but-no-land while
  the old service worker updates; the loader is retryable and the new SW
  precaches both SVGs.
