# 2026-10-20f — the map's owner round: visible borders, centred box, D/W/M cards, relative colours

The owner's four directives on the live map, all shipped in web-only round
`07baddc` (worker `8399274f-01d8-483e-a8af-758e07c0d322`, after the first
cut `eaa7c85` / `0cd8585d`):

1. **Visible grey country borders** — the near-white `--color-surface`
   stroke retired for a 32%-ink grey line (`--wm-line`) at 0.7 units, and
   the neutral land fill deepened 6%→10% ink. Measured live: border
   srgb(0.769 0.783 0.797) on land srgb(0.928 0.932 0.936).
2. **Centred, not full width** — the map layout's stage centres at
   `calc(100% - clamp(150px, 20cqw, 280px))`: measured live module 1272 →
   stage 1018 (inset **254px**, inside the owner's 200–300px band),
   centring offset 0px. The list layout (phone) keeps the full width;
   header/summary/switch/legend keep the module's full width.
3. **D/W/M performance in every card** — each card carries three cells
   (1D/1W/1M; fa روزانه/هفتگی/ماهانه — the app's own priceChange* terms):
   an up/down triangle (green/red) + the signed percent at 1dp, the
   selected period emphasised. `chg1w` joins the map's feed (the stored
   contract already carried it). The switch speaks Today | 1 week |
   1 month (the map's 1Y retires; the section's own lens keeps the yearly
   view). The Open/Closed tag became the legend-keyed state dot so every
   EN name fits at the narrower box (No data / Old data keep their words).
4. **Relative colours** — the five discrete steps retired for a continuous
   scale: `mapWeightOf` normalises each period on its biggest fresh mover
   (0 inside the honest flat band, 1 for the max, 0.75-power curve),
   driving four `color-mix` ramps of the EXISTING status tokens
   (`--t` tint 34→66%, `--m` dot mark 55→100%, `--b` card border 35→75%,
   `--i` cell ink 58→100%). The threshold legend retired for a
   red→grey→green gradient key (RTL-mirrored): "Bigger fall / Bigger
   rise". Live measured `--t` weights: KOSPI +1.76% → 66% (the max),
   DAX −1.18% → 57.2%, NIFTY −1.11% → 56%, … IBOV −0.17% → 37% —
   more down = more red, more up = more saturated green.

## Live captures (currena.ir, 2026-10-20 ~17:20 UTC)

- `en-1440.png` — all four asks in one frame; VLM pass on each point plus
  no-truncation; zero console/page errors.
- `fa-1440.png` — RTL page, LTR stage, Persian triplet (روزانه=+۰٫۴٪ …),
  FA gradient legend (افت بیشتر / رشد بیشتر), FA summary.
- `en-390-list.png` — the phone list layout: full-width small map, zero
  horizontal overflow, the explorer below carrying the entries.

## Gates

world-map plw **38/38** (20 screenshots regenerated, centring/geometry/
no-clip, contrast incl. border ≥1.3:1 vs surface + monotonic tint
distance, axe, keyboard, Farsi, triangle directions, all mock states) ·
U-suite 19/19 · screenshots 4/4 · web vitest 698/698 · every repo suite
green (1,835) · typecheck + lint (0 errors) + copy:audit clean (9 new fa
keys triaged, 5 retired).

## Note — the PWA service-worker transition

A returning visitor's OLD precached SW (from before the map existed) can
serve its SPA fallback for `/assets/map/world-map.svg` during the update
window: the fetch 200s, parses to zero `path[data-iso]`, and the module
shows cards over an empty stage until the next mount. The loader is
retryable by design and the new SW (whose precache carries both SVGs)
takes over on the following visit — observed live: unregister→reload and
every subsequent SW-controlled reload render the 173-path land. Fresh
visitors never see it.
