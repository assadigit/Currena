# S2 — Foreign holdings of US Treasuries (the priority feature)

**Estimated length:** 3 to 4 hours. **Depends on:** S1 (`rung3`, egress probe). Read `00-OPERATING-RULES.md` first.

## Why

"Who is buying and selling US government debt" is a major world signal (Japan and
China holdings are falling) and is absent from Insights. Latest verified figures
(Table 5, billions USD, 2026-08 vs 2026-02): Japan 1,068.3 vs 1,239.3; China
590.7 vs 694.2; United Kingdom 1,009.5 vs 897.3; Canada 464.6 vs 446.4.

## Honest-data warnings (design these in; do not skip)

1. **Holdings fall for two reasons**: net selling and price changes (when yields
   rise, bond values fall). Table 3 separates **Net U.S. Sales** (real buying or
   selling) from **Valuation Change**. The headline "X is selling" must be based on
   the net-transaction column, never on the holdings change alone. Show both.
2. **Custody distortion**: holdings are recorded where they are held, not by owner.
   Belgium, Luxembourg, Cayman Islands, Ireland, the UK and Switzerland include
   third-party and fund custody. Treasury says so itself. Show a one-line caveat on the card.
3. **Lag**: monthly, about 6 to 7 weeks (Aug 2026 released 2026-10-16; Sep 2026
   due 2026-11-18). Always show "data for <month>, released <date>".
4. **Official vs private**: Table 5 splits foreign official holdings; show the split.
5. Wording rules apply: describe conditions, no causes, no forecasts.

## Sources (see `VERIFIED-SOURCES.md`)

- **Table 5** `slt_table5.txt`: top holders, 13 months, billions. Verified.
- **Table 3** `slt_table3.txt`: all countries, holdings, net U.S. sales, valuation change, millions. Partially verified: read the full layout first. Contains Australia and every other country.
- **Weekly custody series** (FRED, verify id `WSEFINTL1`): Treasuries held in custody at the New York Fed for foreign official accounts. Weekly and timely, no country split.
- **Dead**: `mfh.txt`, `slt3d.txt` (frozen at Jan 2023). Do not use.
- Licence: US government work, public domain (L0). Quote the terms lines, date read.

## Data model

New composite dataset (not 100 separate indicators):

```ts
// packages/insights/src/tic/  (new)
type TicHolder = {
  id: string;                 // stable slug, e.g. "japan", "china-mainland"
  name: string;               // as published
  holdingsBn: number;         // billions USD, latest month
  months: { ym: string; holdingsBn: number }[];       // up to 24 months
  netSalesBn?: { ym: string; value: number }[];       // Table 3, converted from millions; positive = foreigners bought
  valuationChangeBn?: { ym: string; value: number }[];
  isCustodyHub: boolean;      // Belgium, Luxembourg, Cayman Islands, Ireland, UK, Switzerland, Bermuda
};
type TicSnapshot = {
  dataMonth: string; releasedAt?: string; fetchedAt: string;
  totalBn: number; officialBn?: number; privateBn?: number;
  holders: TicHolder[];       // top N from Table 5 plus every country needed for highlights (Australia from Table 3)
  sourceUrls: string[];
};
```

Store as one KV key `insights:tic:v1` (no TTL), validated by zod on write **and** on read. History: keep the last 24 months inside the snapshot; no separate per-id history keys.

## Milestones

### M2.1 Source verification and fixtures
1. From the Worker-egress probe (S1) confirm `ticdata.treasury.gov` is reachable. If blocked, record it and stop this session's data work (write the venue options into PROGRESS.md; do not circumvent).
2. Fetch `slt_table5.txt` and `slt_table3.txt`. Read the full layout. **Hex-dump** a few rows to see the real delimiters (the planning preview showed apparently merged numbers such as `862.5901.3`).
3. Save both responses as fixtures under `packages/insights/fixtures/tic/` (record date in the filename). Add one earlier-period fixture if available, to test series continuity.
4. Document the exact layouts, units (billions vs millions), country-name quirks (`China, Mainland`, `Korea, South`), the `All Other` and `Grand Total` rows, and the official/private rows in `docs/insights/SCRAPING_SPEC.md` as a method card, and update `VERIFIED-SOURCES.md`.
5. Licence records (`LICENCES.md`, `RISK_REGISTER.md`, `sources.ts`, `licences.ts`): provider `tic` L0.

Acceptance: fixtures committed; layouts documented; licence recorded.

### M2.2 Parser, data model and ingest rung
1. Tests first: parser rejects wrong column counts, non-numeric cells, unit mix-ups, a header that is not the expected month format, totals that do not equal the sum of parts within tolerance, and implausible month-over-month jumps (flag, do not drop silently).
2. Implement `packages/insights/src/tic/` parser + zod schemas + the `TicSnapshot` builder; merge Table 5 and Table 3 by a normalised country key (keep an explicit alias map and test it).
3. Compute derived fields: share of total, 1-month and 12-month change (bn and %), net sales sum over 12 months, valuation effect, rank change. All pure functions with tests.
4. Wire a fetch step into `rung3` with a **release-aware gate**: run daily from the 15th to the 25th of each month until the new data month appears, otherwise once a week (cheap check). Use at most 2 subrequests. Idempotent write (skip if the data month is unchanged).
5. Extend the sweep so a failed run heals.

Acceptance: `insights:tic:v1` written on a manual trigger and validates on read; unit tests cover every rejection case; subrequests and KV writes reported.

### M2.3 Public endpoint, store and calendar
1. `GET /api/insights/tic`: free and unauthenticated like the other Insights endpoints, exactly **one KV read**, rate-limited like its siblings, honours `ACCESS_MODE`/panic switch and per-source kill switch, `Cache-Control` like siblings, `X-Robots-Tag: noindex`. Add to the endpoint list in `docs/INDICATORS_AND_DATA_SOURCES.md` §3.
2. Typed client for the web app (Hono RPC types as elsewhere).
3. Add calendar entries to `data/insights-calendar.json` (and `insights-release-schedule.json` if that is the pattern) for the TIC release dates: 2026-11-18 (Sep 2026 data) and later ones from the Treasury "Release Dates of TIC Data" page (verify; do not guess).
4. Endpoint tests (200, validation failure path, stale path).

Acceptance: endpoint live in `wrangler dev`, tests green, calendar entries present and verified against the Treasury page.

### M2.4 UI: holders table, trend chart, weekly custody card
Place a new section **"Who holds US government debt"** in the Global region, directly after the borrowing-costs gauge group. Follow the existing design tokens, card anatomy and hero-section patterns in `UI_SPEC.md` and the existing components (reuse, do not restyle).

Required content:
1. **Headline summary** (plain language, conditions only), for example: "Foreign holdings of US Treasuries were $X trillion in August. Japan held $Y, down $Z from six months earlier; China held $A, down $B." Generated from data, EN + fa.
2. **Table** (sortable by holdings, 1-month change, 12-month change, net purchases): Country, Holdings ($bn), Share of foreign total, 1-month change, 12-month change, **Net buying or selling over 12 months** (from Table 3), **Price effect** (valuation), mini sparkline of 24 months. Rows for the top 15 holders plus **Australia** (Table 3), always visible. Mobile: collapse to cards, show the first 6 with "Show all".
3. **Net sellers / net buyers chips**: the 3 countries with the largest net selling and net buying over 12 months (transactions, not holdings).
4. **Japan and China trend chart**: two lines, 24 months, same style as existing relationship charts, with an accessible text summary.
5. **Official vs private** split bar for the foreign total.
6. **Weekly custody card** (FRED `WSEFINTL1` once verified in S3-M3.1, otherwise add the series here following the recipe): "Foreign official holdings at the New York Fed (weekly)", standard indicator card with 10-year position. If the series fails verification, ship without it and record why.
7. **Caveat line**: custody hubs distort country totals; show a "?" tooltip with the Treasury's own wording paraphrased in plain language.
8. States: loading, stale (more than 70 days old), unavailable ("can't tell right now"). Never show a stale table as current.
9. RTL: logical properties only; numbers via `Intl.NumberFormat` (`fa-IR` renders Persian digits); country names from an i18n dictionary (EN + fa), not from the source string.
10. Accessibility: real `<table>` with headers and `scope`, sortable buttons with `aria-sort`, focus order, 44px touch targets, contrast per tokens.

Acceptance: section renders from the live endpoint in EN and fa at 360, 768, 1200 px; screenshots in `docs/gap-closure/evidence/M2.4/`; keyboard test; no console errors.

### M2.5 Bilingual copy, glossary, narrator and licences
1. All strings in `insights-copy-en.ts` / `insights-copy-fa.ts` and the main i18n dictionaries; glossary terms: "custody hub", "net purchases", "valuation change", "foreign official holdings", "Treasury securities". Run `pnpm copy:audit`, review the fa wording against `docs/localization/persian-terminology.md`, then `pnpm copy:audit:update`. No em dashes in fa.
2. Layer-2 narrator: add the TIC facts to the narrator's state (see `docs/insights/layer2/NARRATION-STATE.md` and `packages/insights/src/narrator/`) so the AI summary can mention foreign holdings; update the vocabulary (`pnpm narrator:vocabulary`, then `:check`). Keep the narrator's no-causes rule: it may state "Japan's holdings fell", never why. If extending the narrator state is large, ship the table first and record the narrator work as a follow-up in PROGRESS.md.
3. "About this data": add the source line and attribution for Treasury TIC.

Acceptance: audit gates green; fa reviewed; narrator vocabulary check green.

### M2.6 Deploy verification, docs and session close
1. Deploy per rules §3; trigger the `rung3` TIC step manually per DEPLOY.md; verify `insights:tic:v1` and the endpoint on production; verify the section in a real browser, EN and fa.
2. Update `AGENTS.md` (new section for the TIC dataset), `docs/INDICATORS_AND_DATA_SOURCES.md` §2 and §3, `docs/insights/SCRAPING_SPEC.md`, CHANGELOG, `VERIFIED-SOURCES.md`.
3. PROGRESS.md: tick G2, milestones, session log (versions, KV numbers). Follow the session close protocol and print the S3 prompt.

## Risks

- Table layout changes: parser fails closed; the card shows "can't tell right now".
- Egress blocked: stop, record, propose a venue (for example a scheduled GitHub Action that writes the snapshot through a narrow write path), do not circumvent.
- Country-name mismatches between tables: alias map with tests.
