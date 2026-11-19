> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S14 / M1 — Citation re-verification + the two build-time checks

**Session:** S14 of the Gold Page Elevation (GPE) program — the FIFTH
Phase-D implementation session: **P3, the Supporting tier (wave 3, first
session)**. **Date:** 2026-11-19 (started ~03:11 UTC). **Branch:**
`gold-elevation/p3-supporting` (off the S13 close `6d8622a9` — production
`3b8a8c6a` is built from it; git `main` still sits at the R-5 close
`19131b0`).

Scope: exactly R22 + R24 + R26 + R27 (`s8/01` §4; the locked modes from
the CP-C record §1), plus R15 only if its WGC GDT data drop arrived. **The
M1(b) check ran first: the drop has NOT arrived** (no `data/wgc/` path
anywhere in the repo — checked read-only; the owner's kickoff message
carries no drop notice) → **R15 stays pending** (the third consecutive
session; the fold record §0.2 rule; the licence wall's WGC CB line stays;
R23/R25's data rides the same calendar). The rest of P3 proceeds exactly
as scoped.

## 1. Citation re-verification (the discipline — every path the rows cite, against the live tree)

Read-only, at this session's start, on the branch HEAD `6d8622a9`. **Zero
material drift.** The rows' cited targets, one by one:

| The citation (s8/01 §4 + s6/03 §2 + s7/01 §3/§6) | The live tree | Verdict |
|---|---|---|
| `features/gold/GoldCorrelation.tsx` (R22's component; the s6/03 zone K landing spot) | does not exist yet — the NEW module this session creates there | the landing spot is free (the siblings exist) |
| `domains/gold/correlation.ts` (R22's pure engine, pre-registered windows) | does not exist yet — NEW | free |
| The R18 OHLC leg R22 rides: `features/gold/gold-xau.ts` + `domains/gold/xau-ohlc.ts` + `GET /api/insights/gold-ohlc` | all exist (the S13 ship, verified live: the seeded series serves) | ✓ |
| The 10y real yield R22 rides (Treasury-direct primary / DFII10): the `real-yield-10y` reading + `GET /api/insights/real-yield-10y/history` | both exist; the history serves **2,497 daily points, 2016-11-15 → 2026-11-16** (the full 10-year display window the registry names) | ✓ |
| Zone K placement: the companion CLOSES the zone (s7/01 §6 item 5) | `GoldCbDemand.tsx` renders the `#gold-zone-k` section through `GoldContext`'s zoneK slot (GoldContext.tsx:320) — the companion lands as the zone's last element | ✓ |
| `features/gold/GoldLondonVault.tsx` (R24's card component) | does not exist yet — NEW | free |
| `domains/gold/adapters/lbma-vault.ts` / `lbma-clearing.ts` (R24's adapters, deterministic parse, fail-closed on shape) | do not exist yet — NEW | free |
| The LBMA venues: `cdn.lbma.org.uk/downloads/LBMA-London-Vault-Holdings-Data-<Month>.xlsx` + the clearing workbook | re-probed LIVE this session (§4b below): the October-2026 vault file HTTP 200 (23,732 B, valid XLSX) parsed to the 124-row series; the clearing file name is `LBMA-Clearing-Data-<Month>.xlsx` (the s4/02 §1c record) — the September-2026 file HTTP 200 (38,272 B) parsed to the 360-row series; the October clearing file 403s (the clearing rhythm runs ~1 month deeper in arrears) | ✓ (see D2) |
| `features/gold/GoldCurrencyGrid.tsx` (R26's grid component; Zone I compact sub-card) | does not exist yet — NEW | free |
| `domains/gold/xau-crosses.ts` (R26's pure deciles engine) | does not exist yet — NEW | free |
| The EODHD XAU-cross venue (s8/02 §1a row 4 — "PARTIAL on the free key") | re-probed LIVE this session (§4a): **confirmed and made precise** — only `XAUEUR` (362 rows) and `XAUAUD` (309 rows) exist as native XAU crosses; `XAUJPY` / `XAUGBP` / `XAUCNY` answer the warning-only shape (zero data rows, symbol known); the plain FX legs `USDJPY` / `GBPUSD` / `USDCNY` serve normally | ✓ (see D1) |
| Zone I placement (the RATIOS group): F10 as a compact sub-card, 390 = one row | `GoldContext.tsx` renders the ratios `ContextGroup` — the grid lands as a sub-card inside that section | ✓ |
| R27's render surface: the Zone J COT cards in `GoldContext.tsx` (s6/03: "F14: percentile bands as a derivation in `gold-tiles.ts` + render in `GoldContext.tsx`") | exists; the flows group renders the two cftc cards; the live projection carries their `percentile10y` (0.7865 / 0.5577) — zero new data confirmed | ✓ |
| The rung registry (R24/R26's ingest legs): `apps/api/src/insights-extra-rungs.ts` | exists; the rung3 all-gates arithmetic (53/50 with gold-cb the designed LAST refusal victim — S12-D3) and the rung4 all-gates arithmetic (49/50) re-derived with the two new sources (D3 below) | ✓ |
| The route pattern: `apps/api/src/routes/insights.ts` (`/gold-cb` + `/gold-ohlc` — the literal-path twins) | exists (the two GPE routes registered before `/:id/history`) | ✓ |
| `docs/localization/persian-copy-manifest.json` (the manifest gate, C7 rule 1) | exists (8,223 entries; round 86 is the last) | ✓ |
| `scripts/check-bundle-budget.mjs` (the GoldPage ceiling) | exists — the current line `GoldPage` at 152,000/34,500 (the S13-D6 bump) | ✓ (this session ships its own measured bump if the four surfaces cross it) |

The s6/03 §2 module map's post-modularization addresses all hold on the
live tree; the R5 no-renames constraint governs — no file moves this
session, only NEW files + in-place edits.

## 2. The R07 Treasury-rung outcome (M1(a), carried from S12-D4 through S13's close)

**The honest clock:** the first Treasury-primary collect fires **04:10 UTC
Nov 19** — and this session started **2026-11-19 03:11 UTC, ~59 minutes
BEFORE the rung**. The flip therefore had NOT fired at this session's
start; the pre-rung live reads (the production API, ~03:1x UTC):

- `GET /api/insights` (generatedAt `2026-11-18T13:12:23.401Z` — the last
  pre-rung snapshot): `us10y` 5.12 @ 2026-11-16 — **"FRED (DGS10)"**;
  `us30y` 5.46 @ 2026-11-16 — "FRED (DGS30)"; `real-yield-10y` 2.92 @
  2026-11-16 — "FRED (DFII10)"; `fed-expectations` 0.955 — "FRED (DGS2 −
  policy-rate midpoint)"; `sofr` 3.92 @ 2026-11-17.
- `GET /api/insights/status`: the blob healthy — `failedSources: []`,
  staleCount 21.

**What this means for the session:** nothing blocks — the S14 rows ride
their own data planes (EODHD crosses, LBMA, the stored COT percentiles,
the R18 OHLC leg); this session's deploys carry the R07 code unchanged
(the flip rides the overnight rung whatever this session ships). **The
re-check is scheduled at this session's close** — by then the clock will
have passed 04:10 UTC (and the 10:10 sweep), and the outcome — flipped
readings (source lines naming U.S. Treasury, the freshest as-of) or an
honestly-recorded Treasury failure with the FRED fallback carrying the
day — lands in the session summary with the status blob's own record.

## 3. The R15 drop-calendar re-check (M1(b))

**No WGC GDT data drop.** Three ways checked: (1) the private `data/wgc/`
path — absent (the repo's `data/` carries the registry files + the
manual/ + shiller/ folders, no wgc); (2) the owner's kickoff message —
no drop notice (the credentials block aside, nothing owner-authored);
(3) the S13 close's standing item said "tell the next session when the
quarterly release arrives" — no such notice came. **R15 stays pending**
(the fold record §0.2 rule, the third consecutive session). The wall's
WGC CB line renders on; the ETF/prices drops (R23/R25) ride the same
calendar. The rest of P3 proceeds exactly as scoped.

## 4. The session's live data probes (the rows' own planes)

**4a. The EODHD XAU-cross probe** (R26's required data, read live against
the publisher with the plan key, this session ~03:2x UTC):

- `XAUEUR.FOREX` → **362 rows, 2025-11-19 → 2026-11-18** (last close
  3,408.795), the provider's own trailing one-year warning — the free
  tier's depth, exactly the S13-D1 posture.
- `XAUAUD.FOREX` → **309 rows, 2025-11-19 → 2026-11-19** (today's partial
  row included — the S13-D3 guard drops it at ingest).
- `XAUJPY.FOREX` / `XAUGBP.FOREX` / `XAUCNY.FOREX` → the **warning-only
  shape** (`[{"warning":"Data is limited by one year…"}]` — zero data
  rows; a truly unknown symbol answers "Ticker Not Found", so the symbols
  exist but carry no rows on this key). The symbol catalog search confirms
  it: only `XAUUSD`, `XAUEUR`, `XAUAUD` exist as FOREX gold crosses.
- The plain FX legs → `USDJPY` (159.33), `GBPUSD` (1.3144), `USDCNY`
  (6.666) all serve normally, daily EOD, the same convention.

**The consequence (S14-D1 below): the native crosses render as
themselves; the three missing crosses DERIVE from the EODHD legs** —
XAUJPY = XAUUSD × USDJPY, XAUGBP = XAUUSD ÷ GBPUSD, XAUCNY = XAUUSD ×
USDCNY — the repo's own `FX_PAIRS` derivation grammar (direct/inverse/
cross; the audjpy/audcny precedent), one provider, one convention, the
derivation named at point of use per C1. Arithmetic spot-check with the
day's readings: 3,792.59 × 159.33 ≈ 604,3xx ¥/oz — the published
gold-in-yen magnitude ✓.

**4b. The LBMA probe** (R24's required data, read live):

- The vault workbook `LBMA-London-Vault-Holdings-Data-October-2026.xlsx`
  → HTTP 200, 23,732 B, valid XLSX; one sheet ("London Vault Holdings
  Data"); the 3-row header (title / `Month End | Gold | Silver` / the
  troy-ounces-'000s unit row) then **124 monthly rows, newest-first,
  2026-10 → 2016-07**; mixed date cell shapes (the newest rows string
  `'YYYY-MM'`, the oldest datetime cells) — the parser normalizes both.
  Latest: gold 316,682 koz (= 9,849.9 t — LBMA's own printed figure ✓),
  silver 928,810.59 koz.
- The clearing workbook — the s4/02 §1c URL pattern
  `LBMA-Clearing-Data-<Month>.<Year>.xlsx` — the **September-2026** file
  HTTP 200, 38,272 B; one sheet ("Clearing Data"); the 3-row header then
  **360 monthly rows, newest-first, 2026-09 → 1996-11**; columns `Month |
  Gold: Ounces (mns), Value US$ (bns), Transfers | Silver: Ounces (mns),
  Value US$ (bns), Transfers`. The **October clearing file 403s** — the
  clearing rhythm runs ~one month deeper in arrears than the vault (the
  S4 record's own observation: vault at end-Oct live while clearing's
  latest was September). The November vault file also 403s (T+~2.5wk —
  October is the freshest, as at the S4 probe).

## 5. The session's design decisions (recorded here; DECISIONS.md at the end-of-program reconciliation)

- **S14-D1 — the crosses' native+derived posture.** The live probe makes
  the s8/02 "PARTIAL on the free key" note precise: only XAUEUR and
  XAUAUD exist natively; JPY/GBP/CNY carry zero rows on any plan-visible
  shape. The grid therefore renders TWO native EODHD crosses (EUR, AUD —
  fetched direct) and THREE derived crosses (JPY, GBP, CNY — exact
  arithmetic over the EODHD XAUUSD + USD<CCY> legs, the `FX_PAIRS`
  cross-derivation grammar, inner-joined on common dates, the audnzd
  4dp discipline). One provider, one daily-EOD convention, every leg
  named at point of use per C1 — no mixing with the Frankfurter family.
  The decile basis is each cross's own STORED series (~1 year on the
  free tier — the S13-D1 honest posture, the window named at point of
  use, self-widening with the plan).
- **S14-D2 — the LBMA ingest shape.** ONE KV key (`insights:gold-lbma:v1`)
  carrying both workbooks' parsed series (vault + clearing — one read
  serves both cards); the URL probe fetches the single most-plausible
  candidate per file (vault: currentMonth−1; clearing: currentMonth−2 —
  the measured arrears rhythms) and treats a 403 as the calm "not yet
  published, nothing to do" (the stored month never regresses; the
  workbook itself IS the full 124/360-row backfill, so the first 200
  bootstraps the whole history). Deterministic parse, fail-closed on
  shape (the header rows matched exactly; a drifted shape throws, never
  renders garbage).
- **S14-D3 — the rung registry arithmetic (the two new sources).**
  `gold-xau-crosses` rides RUNG4, weekdays only (Mon–Fri UTC — the forex
  week wraps Friday 22:00 UTC; Sat/Sun carry no new bars), budget 8
  (5 fetches + the stored-crosses read + the gold-xau key read for the
  derivation + the write). `gold-lbma` rides RUNG3, days 8–27 of the
  month (the publication window both rhythms land inside), budget 4
  (the 2 workbook fetches + the idempotence read + the write — exact,
  no headroom needed: the subrequest count is deterministic). Registry
  order keeps **gold-cb LAST** (the S12-D3 record): tic · portwatch ·
  abs · fred-s3 · frb-ebp · ofr-fsi · gold-xau · **gold-xau-crosses** ·
  **gold-lbma** · gold-cb. Re-derived all-gates days: rung4 Saturday
  49/50 (unchanged — the crosses' gate is closed), rung4 weekday
  47/50, rung3 weekday days 15–25 49/50 (tic + portwatch + abs +
  lbma + status), rung3 weekday days 8–14 45/50, rung3 days-1–5
  Saturday 53/50 → **gold-cb refused exactly as the S12-D3 design
  already records** (the collision victim is unchanged). The sweep-heal
  arithmetic holds: every transient failure heals same-day or next-day
  within the ceiling (worst case: a days-15–25 lbma failure heals at
  50/50 in the sweep's due+heal pass).
