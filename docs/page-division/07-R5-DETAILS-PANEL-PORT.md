# 07 — The R-5 details-panel port (the per-page detail surface)

> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

> **Page-division successor · 2026-11-17.** The §19.6 retirement
> (06-LEGACY-RETIREMENT-S24.md, executed + deployed as `ecc64a05` /
> `c0858d06`) accepted R-5 — the details panels + per-id history — as a
> loss "unless the execution session ports a details surface." The
> retirement spec's RECOMMENDATION (§4 R-5): "port `DetailsPanel` (or a
> per-page variant) as part of the retirement execution — the §19.6
> burn-in exists partly to measure whether readers used it." The HANDOFF
>'s standing owner-side lever list carried it forward. This spec is that
> port: one shared panel module + the wiring behind the destination
> cards' click, on each indicator's home page.

---

## 1. Goal

Every destination-page card that renders the §21 trio (value · 10-year
position · freshness) over an engine reading becomes clickable and opens
the ported details panel — the side sheet (desktop) / bottom sheet
(phones) with the five F5 editorial sections, the Layer-1 plain-language
block, the 10-year history chart (via the surviving
`GET /api/insights/:id/history` endpoint), the price-row detail sections,
the card-spec facts, and the linked source. The panel is the retired
`features/insights-legacy/DetailsPanel.tsx` (F5, 2026-10-26c) ported to
the shared layer, minus the watchlist pin (R-7 stays an accepted loss).

## 2. Scope — what ships

1. **NEW `apps/web/src/shared/components/IndicatorDetailsPanel.tsx`** —
   the port of the retired DetailsPanel (recovered from git history
   `ecc64a05^`), adapted:
   - props `reading, readings, copy, locale, numberLocale, onClose,
     returnFocusTo` (the shared-layer convention — HistoryChart /
     PricesBoard / PriceDetails all take the corpus as props);
   - the watchlist pin button + `onPinChange`/`pinned` props REMOVED
     (R-7 accepted loss, BD-S32 — the pinned strip does not exist);
   - everything else verbatim: the header (icon + verified title +
     ticker + Layer-1 plainName + close), the rule line
     (`formatRuleText`), CardFacts (cadence · stale-after · fetched UTC ·
     scored/context · rule version), `PriceDetailsSections` for the four
     `PRICE_ROWS` (companion lines from the page's own readings), the
     VIX note, the stale / check-pending / no-history / note / info-only
     lines, the five F5 sections (forYou → whyItMatters → tendedToMean →
     cantTell → whatItIs), `Layer1Block`, `PanelHistory`
     (`fetchIndicatorHistory` → `HistoryChart`, loading/error/none
     states), the footer (source link + as-of);
   - the focus discipline unchanged: focus trap, Escape closes, focus
     returns to the opener, body scroll lock, `role="dialog"`.
   - The CSS classes (`insights-panel`, `insights-panel-scrim`,
     `insights-focusable`) survived the retirement in `index.css` — no
     CSS changes needed.

2. **NEW `apps/web/src/shared/hooks/useIndicatorDetails.ts`** — the
   per-page wiring hook: `useIndicatorDetailsPanel(readings)` returns
   `{ openCard, closeCard, panel }`. `openCard(id, opener)` stores the
   id + the opener element; `panel` renders the
   `IndicatorDetailsPanel` for the reading looked up by id from the
   page's readings (or null when closed / the id has no reading).
   Uses `useInsightsCopy()` internally — no new copy keys anywhere.

3. **Wire the eight §21-trio card surfaces** (each on its home page):

   | Page | Card module | Cards |
   |---|---|---|
   | `/usa` | `features/usa/UsaTierCards.tsx` | 72 |
   | `/europe` | `features/europe/EuropeTierCards.tsx` | the tiers |
   | `/asia-pacific` | `features/asia-pacific/AsiaTierCards.tsx` | the tiers |
   | `/australia` | `features/australia/AustraliaTierCards.tsx` | the tiers |
   | `/currencies` | `features/currencies/CurrenciesTierCards.tsx` | the tiers |
   | `/gold` | `features/gold/GoldContext.tsx` | the context cards |
   | `/world-markets` | `features/global/WorldRiskCards.tsx` | the risk cards |
   | `/commodities` | `features/commodities/CommoditiesTierCards.tsx` | the PriceTile cards |

   - The seven article-family cards: when `entry.reading` exists, the
     card's content wraps in a real `<button>` (the legacy CompactRow
     pattern — `insights-focusable block w-full cursor-pointer border-0
     bg-transparent p-0 text-start`, `aria-haspopup="dialog"`, aria-label
     from the corpus `copy.ui.detailsButton` + the corpus indicator
     name). An absent reading keeps the honest non-interactive
     unavailable card (fail-closed — the panel needs a reading).
   - The Commodities page: the `navigate('/')` stub (the §19.6
     stopgap, commented in-file) is replaced by the hook's `openCard` —
     `PriceTile`'s existing `onFocusCard` signature already matches; the
     face button and the «more details» button both open the panel.

4. **Pages render `{panel}`** — UsaPage, EuropePage, AsiaPage,
   AustraliaPage, CurrenciesPage, GoldPage, WorldMarketsPage,
   CommoditiesPage each call the hook with their readings and render the
   panel element once at the page root.

5. **Tests:**
   - NEW `shared/components/IndicatorDetailsPanel.test.tsx` — the panel
     characterization: a fixture reading renders the five F5 sections +
     the rule line + CardFacts + the Layer-1 block + the chart (stubbed
     history fetch, house discipline — never a live call); the
     loading/error/none chart states; the price-row sections for a
     `PRICE_ROWS` id; Escape closes + focus returns; both locales.
   - Extend `features/usa/UsaPage.test.tsx` — a card click opens the
     panel (the dialog role + the corpus title appear); an absent
     reading's card stays non-interactive.
   - Extend `features/commodities/CommoditiesPage.test.tsx` — the
     «more details» button opens the panel (replacing the navigate
     stub's assertion).
   - The other pages' characterization suites keep passing untouched
     (the wrapping button is transparent to their `[data-*-card]`
     queries + textContent assertions — verified against the UsaPage
     pattern before building).

## 3. Out of scope (recorded, not rebuilt)

- **R-7 the watchlist** — the pin button + the pinned strip stay
  retired (BD-S32). The panel's footer loses the pin.
- **R-7 the search/filter tools, the CSV/ics exports** — unchanged.
- **R-8 the calendar, About-the-data, TopMovers, MoneyPanel,
  UsGlobalReachGroup, CompaniesTable** — unchanged (the Global hub
  surfaces navigate to homes; that behaviour stays).
- **The Global hub's own surfaces** (BiggestMoveCard, TopMoversStrip,
  NextUpStrip, the board tiles) — they NAVIGATE to the indicator's home
  (`homePageOfIndicator`); they do not open the panel. The detail view
  lives on the card's home page — the page-division architecture.
- **The markets-feed surfaces** (MarketsTable, the region zooms,
  AustralianMarkets, the FX pair board, UsaTicSection,
  AsiaNzx50Card) — no engine reading, no §21 trio, no panel.
- **`/api/insights/:id/history`** — NO API change. The endpoint + its
  zod contract stay exactly as they are; the panel is its first page
  consumer since the retirement.

## 4. Decisions

- **D-R5-1 — one shared module, not eight per-page variants.** The
  retired panel's every dependency survived the retirement in the
  shared layer (HistoryChart, PriceDetails, layer1, config helpers,
  fetchIndicatorHistory, the corpus, the CSS classes — verified by
  grep this session). One ported module + one hook; the eight surfaces
  only wire the callback. Options: (a) per-page variants — rejected:
  eight copies of a 500-line panel, the god-module rule inverted;
  (b) the shared module — chosen: the mechanical port the retirement
  spec asked for.
- **D-R5-2 — the corpus name in the opener's aria-label.** The legacy
  `aria-label={copy.ui.detailsButton + ': ' + entry.name}` is kept,
  reading the corpus through `useInsightsCopy()` — zero new copy keys,
  zero fa-manifest changes, and the copy-pin tests already prove the
  pd.* card names match the corpus byte-for-byte.
- **D-R5-3 — absent reading ⇒ non-interactive card.** The panel needs
  an `IndicatorReading`; an id the projection did not carry renders the
  honest unavailable word with no button (fail-closed, the §21 rule).
  A reading with status `unavailable`/`stale`/`check-pending` STILL
  opens — the panel's own status lines + the last-good chart are its
  job (v3 UI-17).
- **D-R5-4 — the page's projection readings feed the companion
  lines.** `PriceDetailsSections`' companion lookups
  (`byId.get(...)`) already degrade gracefully; the page projection
  carries every id the page renders, so the companions that exist on
  the page render. (The legacy panel read the full snapshot; the
  per-page projection is the destination pages' data path — S2
  contract.)
- **D-R5-5 — the pin is dropped, everything else is verbatim.** The
  watchlist was R-7's accepted loss; porting its button without the
  pinned strip would render a dead control.

## 5. Step-by-step plan

1. Port the panel module (from `git show ecc64a05^:…DetailsPanel.tsx`),
   minus the pin, plus the prop-shape adaptation.
2. Write the hook.
3. Wire the seven article-family surfaces + their pages.
4. Wire the Commodities page (replace the navigate stub).
5. Write/extend the tests.
6. `pnpm -r typecheck` + the web package's vitest run; fix.
7. Full `pnpm gates` ×2 (the production-change two-run discipline).
8. Bundle-budget check: the panel rides the destination-page lazy
   chunks (shared/components) — verify no budget row trips; re-baseline
   only with a justified row comment if a chunk grows past its line.
9. Commit, push, deploy (D-43 deploy-lock re-check FIRST; the §21
   portwatch window — never Tuesday 11:00–14:00 UTC), live-verify the
   click-through matrix (desktop + mobile + fa/RTL), record
   (CHANGELOG + DECISIONS BD-S33 + HANDOFF + this doc's §6).

## 6. Done criteria

- [ ] A card click on each of the eight pages opens the panel for that
      indicator (verified live on `/usa`, `/commodities` at minimum;
      the rest verified by the characterization suites).
- [ ] The panel renders the five F5 sections, the Layer-1 block (for
      ids that have Layer-1 copy), the 10-year chart, the facts line,
      and the source footer — in BOTH locales.
- [ ] Escape closes the panel and focus returns to the opener; body
      scroll locks while open (the F5 discipline).
- [ ] The Commodities «more details» button opens the panel (the
      navigate stub is gone).
- [ ] Absent-reading cards remain non-interactive (fail-closed).
- [ ] `pnpm gates` 9/9 GREEN ×2; the suite delta is positive-only
      (new tests, none deleted).
- [ ] Deployed + live-verified; the records landed (CHANGELOG,
      DECISIONS, HANDOFF).
- [ ] Rollback: `npx wrangler rollback` from apps/api + `git revert`
      (the port is display-layer; no engine, API, or data change).
