# TM24 — the /insights zero-card audit (2026-11-14)

> **Owner directive:** "Check the previous version, when only legacy insights was
> there. Make sure all of the indicators are distributed in the pages, and there
> is no remaining or orphan indicator without new page."

## The audit — every legacy /insights indicator has a new home

### 1. The legacy /insights (commit `f1789e8~1`, before TM7)

Before the TM7 migration, the legacy `/insights` page rendered every indicator
in the registry (187 ids today; was 184 before the S25 §15 Asia-CPI fills +
the §15 D-36 trio brought it to 187). The page's lane iterated 11 gauge groups
across two sections (`global` + `australia`), plus the prices strip, the world
markets board, the FX board, the world currencies section (with the
dollar-strength group), the TIC custody section, the AU markets board, the
Together connection cards, the Signals verdict strip, the hero verdicts, the
top movers strip, the upcoming-events calendar and the About-the-data
section.

### 2. The current state (HEAD `5362ace` + this TM24 commit)

Every legacy /insights surface has been migrated to a dedicated page by the
TM7–TM23 series, and this TM24 commit closes the last belt-and-suspenders
gap. The 10 destination pages:

| Page | Route | Registry cards | Mirror inputs | Boards | Migration |
|---|---|---|---|---|---|
| global | `/` | 0 | 52 | World Markets · FX | TM14 (hero + prices + movers) · TM11 (calendar) |
| gold | `/gold` | 14 + 4 blocked | 34 | — | TM13 (Signals) · TM16–TM19/TM23 (ratio + flow cards) · TM23 (Gold Positions) |
| world-markets | `/world-markets` | 9 | 0 | World Markets board | TM9 (world indices) |
| usa | `/usa` | 72 | 14 | World Markets · TIC | TM10 (every USA indicator + TIC custody) |
| europe | `/europe` | 8 | 0 | World Markets board | TM15 (Eurozone indicators) |
| asia-pacific | `/asia-pacific` | 14 | 0 | World Markets board | TM16–TM18 (Asia + CPI fills) |
| australia | `/australia` | 28 | 5 | AU Markets board | TM7 (every AU indicator + MoneyPanel) · TM20 (Together AU cards) |
| commodities | `/commodities` | 24 | 0 | — | TM14 (PricesBoard) · TM17–TM19/TM23 (energy + metals + agri + digital + routes) |
| currencies | `/currencies` | 14 | 0 | FX board | TM12 (WorldCurrencies + dollar-strength) · TM16 (reserve share) |
| economic-linkages | `/economic-linkages` | 0 (10 connection cards) | 0 | — | TM21–TM22 (the macroeconomic connection cards) |

### 3. The reconciliation verdict (`packages/insights/src/page-division/placement.ts`)

`reconcilePlacement(registryIds)` over `data/indicators.json` (187 ids):

| Check | Result |
|---|---|
| Registry ids | 187 |
| Placed (one home each — blocked notes included) | 187 |
| **Unplaced** | **0** |
| Duplicate homes | 0 |
| Unknown ids (placement ∖ registry) | 0 |
| Mirror/home overlaps | 0 |

**Verdict: every legacy /insights indicator has a new home. Zero orphans.**

### 4. The /insights page is zero-card-capable by construction

Before TM24, `HIDDEN_FROM_LANE_IDS` (the lane-render filter in
`apps/web/src/components/insights/config/sections.ts`) carried 175 ids — every
registry id whose lane group is iterated by the lane. The remaining 12 ids
(5 in `prices-board`, 3 in `dollar-strength`, 4 BLOCKED_NOTES in
`market-stress`) did not render on /insights either, because:

- the 5 `prices-board` ids (brent, gold-usd, silver-usd, btc-usd, gold-btc)
  rendered only inside the PricesBoard component, which TM14 cut from
  /insights;
- the 3 `dollar-strength` ids (dollar-broad, dollar-eme, usdchf) rendered
  only inside the WorldCurrencies section, which TM12 cut from /insights;
- the 4 BLOCKED_NOTES (wgc-etf-holdings, wgc-cb-demand,
  official-gold-demand, etf-short-interest) have NO fetches wired (the
  pre-approval class / the 404 venue), so they never carried readings, so
  they never rendered — but the lane filter did not explicitly hide them.

**TM24 (this commit)** adds the 4 BLOCKED_NOTES to
`HIDDEN_FROM_LANE_IDS` as belt-and-suspenders: even if a future session
wires a venue for one of them, the card renders ONLY on /gold (the
blocked-note surface) and never on /insights. The /insights page is now
**zero-card-capable by construction**, not by accident — every registry id
(187) is either in `HIDDEN_FROM_LANE_IDS` (179 ids) or its lane group is
not iterated (3 dollar-strength ids) or its rendering component was
removed by the TM cuts (5 prices-board ids).

### 5. The verification

- `pnpm --filter @currena/insights exec vitest run src/page-division/placement.test.ts` — 13/13 green (reconcile: 187 placed, 0 unplaced, 0 duplicate homes).
- `pnpm --filter @currena/web exec vitest run src/components/insights/round2.test.ts` — 62/62 green (the hidden-from-lane set is exactly the 6 special containers' members + the TIC custody card + the 4 BLOCKED_NOTES).
- The full web suite — 13,226/13,226 green (the same pre-existing 11 unhandled-rejection warnings main carries; zero new failures).
- The full insights suite — 1,383/1,383 green.
- The full API suite — 414/414 green.

Total: 15,023 tests pass.

### 6. The records

- The lane-hidden set's `BLOCKED_LANE_IDS` is exported from
  `apps/web/src/components/insights/config/sections.ts` + re-exported from
  the `config/index.ts` barrel.
- The round2.test.ts lane-hidden-set test pinning the 179-size verdict and
  the four new `expect(HIDDEN_FROM_LANE_IDS.has('wgc-etf-holdings'))` etc.
- This audit doc.

The /insights page is ready for the §19.6 retirement gate (the owner's
sign-off to remove the page entirely).
