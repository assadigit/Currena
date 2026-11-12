> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# Spec — the "Market Heat Map" treemap on /world-markets (TE-style)

Status: spec (2026-11-12, the owner round after S31) · reference:
https://tradingeconomics.com/stocks/treemap (DOM snapshot analyzed — 69
tiles, full SVG anatomy).

## Goal

A TE-style treemap on the standalone `/world-markets` page showing the 16
world indices, **tile area ∝ approximate constituent market cap, tile color
= the selected period's return** on a diverging red↔warm-gray↔green scale,
integrated into the existing briefing flow (the same one-open detail panel
the grid tiles open).

## Scope

- One new module: `apps/web/src/components/insights/world-markets/MarketsTreemap.tsx`
  (the lean route chunk; zero new dependencies — the squarify layout is a
  pure local function, SSR-safe, deterministic).
- Integration inside `WorldMarketsBriefing.tsx` between the movers row and
  the regional tile explorer, following the page's ONE period lens
  (MarketsView) and the section's existing `openId` detail-panel state.
- i18n: new `pd.worldMarkets.treemap.*` keys × 2 locales (EN + FA), fa
  strings queued in the Persian copy manifest (the S7/S31 precedent).
- Budget: the World Markets lazy chunk ceiling rises 40/9 → 50/10 kB with
  the measured number recorded (the S31 precedent — justify in CHANGELOG).

## Out of scope (v1)

- Live market-cap data (EODHD fundamentals) — the capT table below is
  illustrative demo data, labelled as such in the UI.
- Log-scale / equal-size toggle, region drill-down, click-through to a
  dedicated per-index page, Monthly/YTD tooltip rows (no stored fields).

## Decisions

- **Colors**: Currena tokens, not TE's navy. Root `#141210`-tone group
  fill with 1px gutter strokes; tile fill diverges
  `#c0392b` (down) ↔ `rgb(72,68,62)` (neutral) ↔ `#2e9e5b` (up) — the
  page's own `--color-return-down/up` hues; linear RGB interpolation,
  clamped per period: today 3 · 1w 5 · 1m 8 · 3m 12 · 1y 15 · 5y 20.
  Missing lens reading → the neutral gray, the honest dash, never 0.
- **Cap table** (approx constituent market cap, USD trillions, demo):
  sp500 55 · ndx 44 · dow 19 · tsx 3.2 · ibov 1.1 · ssec 9.5 · n225 6.8 ·
  hsi 4.6 · nifty50 5.4 · taiex 3.0 · kospi 2.4 · asx200 1.8 · stoxx50 4.4 ·
  ftse 3.3 · cac 3.1 · dax 2.7. Unknown symbol fallback: 1. Result: the
  Americas ≈ 72% of the canvas, Asia-Pacific ≈ 20%, Europe ≈ 8% (authentic
  TE proportions). Short tile names: ssec → "Shanghai", tsx → "S&P/TSX".
- **Layout**: two squarify passes (regions by summed capT into the padded
  canvas; leaves per region under a 20px region header band). Constants:
  viewBox 1400×580, canvas pad 5, header 20, min label tile 44×40.
- **Labels**: name + signed % centered in the tile, white bold with a
  1px black text shadow (TE-exact `dy` −0.4em/+0.6em); font size scales
  with tile area, shrinks to fit narrow tiles, hidden below 44×40 (the
  native `<title>` tooltip remains). Percent text uses the shared
  `signedPct` (+/− signs, tabular-nums).
- **Interaction**: tiles are real buttons (`<g role="button" tabIndex=0>`,
  aria-expanded/aria-controls to `insights-market-detail-{id}`), Enter/Space
  toggle the SAME `openId` the briefing tiles share, then the panel
  scroll-into-view (the briefing's own rAF discipline). Hover brightens
  (filter); selected tile wears the 2px `--color-currena-warning` stroke;
  focus ring via `.insights-focusable`.
- **Responsive**: `overflow-x-auto` wrapper; the SVG keeps a 680px min
  width (mobile pans horizontally; the page never overflows).

## Step plan

1. Constants + pure helpers (capT table, squarify, color clamp, label
   metrics) — exported for tests.
2. The component: card shell (title/legend/footer), the SVG, region
   groups, tiles with labels/tooltips.
3. Integration in `WorldMarketsBriefing` (shared openId + scroll).
4. i18n keys × 2 locales + copy-manifest queueing.
5. Unit tests (squarify geometry, color scale, label rules, region
   proportions) + copy-pin arm.
6. Gates + budget bump + browser pass.

## Done criteria (checklist)

- [ ] Treemap section renders between the movers row and the regional
      tile explorer on `/world-markets`.
- [ ] All 16 indices present; areas roughly proportional to the capT
      table (S&P 500 biggest, Ibovespa smallest).
- [ ] Region bands with uppercase names + counts; leaves start below a
      20px band.
- [ ] Colors: gainers green, losers red, near-zero warm gray; legend
      labels track the per-period clamp.
- [ ] Labels hidden on tiles < 44×40; no text overflows; % uses +/− and
      tabular figures.
- [ ] Hover brightens; click/Enter toggles selection + the shared detail
      panel + smooth scroll; keyboard focus visible.
- [ ] Mobile: horizontal scroll inside the card only; body never
      overflows.
- [ ] Zero console errors; typecheck/lint/tests green; budget held.
