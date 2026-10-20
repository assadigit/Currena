# Evidence — 2026-10-20h map owner round (fixture-verified; deploy pending the owner's token)

**Owner asks (this round, on the map's period switch):**
1. *"Move this to center"* — the period segmented control **centres** under the
   breadth summary (it hugged the start edge since 2026-10-20f; in fa it hugged
   the end edge).
2. *"add yearly performance"* — **1 year returns to the map** as the switch's
   fourth lens (Today | 1 week | 1 month | 1 year). `chg1y` — the stored
   contract's yearly field the section lens already speaks — now drives the map
   exactly like the other lenses: country tints, 3D pins, leader lines, card
   borders, the breadth summary ("8 of 16 markets up this year") and the hero
   emphasis. `MAP_THRESHOLDS['1Y'] = 3` (a ±3% year is an honestly flat year).
3. *"make it 50% bigger and easier to see"* — the switch grows **~50%**:
   48px pills (was 32), `caption × 1.5 ≈ 18.7px` words (was 12.5), roomier
   padding. On phones (module < 480px) a container-query step keeps all four
   pills whole (~15.6px words — still clearly bigger than before; the
   alternative was a half-cut "1 year").

**Discovered and fixed along the way (both pre-existing on the live map):**
- **The D/W/M values collided.** The 2026-10-20f cards gave each period a
  35px cell but the 12.5px values paint ~44–51px — `+0.7%+0.3%+1.1%` ran
  together and the last value clipped the card edge (fixture-measured
  `scrollWidth 51 > clientWidth 35`; VLM read the values as one continuous
  string). Every card now speaks a **YEARLY hero row** (caption × 1.5, the
  percent glyph's only visible home) above **compact D/W/M cells**
  (11.5px, glyph dropped — an sr-only `%` keeps the accessible name
  reading "1D +0.7 percent"). The visible last close rides in the accessible
  name only (the explorer + detail view carry it). A new §9.2 guard asserts
  every value/caption fits its box.
- **The Sydney pin and the Australia label were covered** by the asx200 card
  (the pin at 70.93% sat inside the card's 68.3–85.7% band; VLM confirmed
  "no visible map pin at Sydney"). The taller cards re-band the layout and
  every label anchor is re-cleared — the Sydney pin now sits in a clear
  gutter and "Australia" moved west over the Indian Ocean. China joins the
  tuned-label list (its centroid sat on the Korea label); Brazil's centroid
  stays the one honest default.

**Switch a11y:** the radiogroup now roves properly — arrow keys move focus
AND selection (the WAI-ARIA pattern; before, arrows re-checked a distant
button and focus stayed behind).

## Verification (fixture server :4050, the built SPA — what will deploy)

- `world-map` Playwright project: **48/48 green** (49 tests, 1 intentional
  skip). New this round: the switch trio (centred ≤2px asymmetry / four
  labels + aria roving / 1Y drives summary+US/BR/CN tints+hero emphasis+
  back to Today), the value-collision guard, and the gotoInsights hardening
  (the module must be attached before the scroll — the lazy land otherwise
  races the markets fetch).
- Contrast §9.3 (both themes): **64** performance inks (16 cards × 1Y hero +
  D/W/M) all ≥4.5:1; the hero font computes ≥18px.
- Farsi §9.6: captions read `سالانه / روزانه / هفتگی / ماهانه`, the hero
  keeps the `٪` glyph, the compact cells speak Persian digits + the true
  minus with the unit in sr-only.
- U-suite 19/19 + section screenshots; repo vitest **1,835 green**;
  typecheck clean; eslint 0 errors (15 pre-existing warnings);
  `copy:audit` clean (manifest +3 entries, round `owner-2026-10-20h-map-yearly`).
- VLM review of the regenerated module screenshots: EN light, fa light, EN
  dark, EN 390 — all four asks confirmed, no collisions, no broken glyphs;
  the 1Y-lens capture confirms the yearly scale (+29.4% / −45.4%), Brazil's
  strong red, the USA label, and the centred active "1 year" pill.

## Captures

- `en-1280-today-lens.png` — the default (Today) map, EN light.
- `en-1280-1y-lens.png` — the map on the **1 year** lens.
- `en-1280-1y-lens-usa.png` — 1Y lens + the S&P card hovered (USA at 60% ink).
- `fa-1280.png` — fa light (سالانه hero, RTL page, LTR map).
- `en-390.png` — mobile list layout, all four pills whole.

## Deploy

**Pending** — this session has no `CLOUDFLARE_API_TOKEN` (the runbook keeps
it env-only, never persisted). The verified build sits in `apps/web/dist`;
to ship:

```sh
CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… pnpm --filter @currena/api exec wrangler deploy
```

Then re-verify on currena.ir per DEPLOY.md §smoke (the PWA one-visit
transition note from 2026-10-20f still applies to returning visitors).
