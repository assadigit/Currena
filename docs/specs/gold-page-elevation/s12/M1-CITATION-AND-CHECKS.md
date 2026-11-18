> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S12 / M1 — Citation re-verification + the three build-time checks

**Session:** S12 of the Gold Page Elevation (GPE) program — the THIRD
Phase-D implementation session: **P1-c, the prizes** (Bridge-1 + the
CB-demand section, wave 1's second half). **Date:** 2026-11-18
(~16:30–17:0x UTC at this milestone). **Branch:**
`gold-elevation/p1c-prizes` (off the S11 close `aae44dda` — the
bookkeeping commit on top of `6a3d55de` from which production
`23ce6b06` was built; git `main` still sits at the R-5 close `19131b0`).

The gate state at session start (verified, not assumed): the CP-C lock
COMPLETE; the Phase-D gate OPEN; P1-a DELIVERED + DEPLOYED +
LIVE-VERIFIED (`f0844e59`, the S10 rows R01–R06); P1-b DELIVERED +
DEPLOYED + LIVE-VERIFIED (production currena-api `23ce6b06` @ 100%,
re-confirmed via the live API reads below — the S11 rows R07–R12).

## 1. Citation re-verification (every path the rows R13–R17 cite)

Re-verified read-only against the branch base (the S11 close tree).
**Zero material drift since the S11 close**; the one address change vs
the GPE research specs is the expected post-modularization move,
recorded here per the discipline:

| The citation (s6/03 §2 / s8/01) | The live tree | Verdict |
|---|---|---|
| `features/gold/GoldIranBridge.tsx` (new, R13) | not present (to create) | address free |
| `domains/gold/coin-premium.ts` (new, R13) | not present (to create) | address free |
| `GoldCbDemand.tsx` + `domains/gold/adapters/imf-reserves.ts` (new, R14) | not present (to create) | address free |
| the COFER adapter pattern | `packages/insights/src/domains/currencies/adapters/cofer.ts` (220 l) | ✅ exact |
| `LedGoldBoard.tsx` | `apps/web/src/features-tools/live-rates/LedGoldBoard.tsx` (414 l) | ✅ **moved** (the s6/03 map's pre-modularization address `apps/web/src/components/LedGoldBoard.tsx` is stale — the M13-era move; the shared-data-plane rule is unaffected) |
| `shared/lib/snapshot-store.ts` + `/api/rates?source=tgju` | `apps/web/src/shared/lib/snapshot-store.ts` (435 l); the store boots App-wide (App.tsx) | ✅ exact |
| `packages/scraper/src/tgju.ts` (`TGJU_GOLD_SYMBOLS`) | present (432 l) — 9 gold symbols; **mesghal NOT ingested** (R13 adds it, §4 below) | ✅ exact + one gap to close |
| `GoldPage.tsx` / `GoldHero.tsx` / `GoldSeats.tsx` / `GoldContext.tsx` / `gold-tiles.ts` / `signals/BalanceWeight.tsx` / `signals/BalanceScale.tsx` / `signals/MergedCard.tsx` / `narrative/GoldNarrative.tsx` / `GoldYieldDecomposition.tsx` | all present at the cited addresses (291/413/397/310/475/294/1396/434/184/221 l) | ✅ exact |
| `domains/gold/narrative.ts` + `yield-decomposition.ts` (the S11 engine pattern) | present (195/117 l) | ✅ exact |
| the i18n dictionaries (`pd.gold.*` + the `gold.*` board names) | `apps/web/src/shared/i18n/en.ts` (2,055 l) + `fa.ts` (1,964 l) | ✅ exact |
| the test pins (R17's frozen surface) | `GoldPage.test.tsx` (863) · `gold-balance-lanes.test.tsx` (+ snap) · `gold-copy-pin.test.ts` · `gold-tiles.test.ts` · `gold-anchors.test.ts` | ✅ exact |
| the bundle budget | `scripts/check-bundle-budget.mjs` — GoldPage ceiling 89.5/22.5 (measured 88.41/21.91 at the S11 close) | ✅ ~1.1 kB raw headroom |

The no-renames constraint (R5) governs: no existing file moves this
session; the two new modules land at their spec'd addresses.

## 2. M1(a) — the R07 Treasury-rung outcome (recorded honestly)

**The rung had NOT fired at this session's start.** The S11 close
recorded the first Treasury-primary collect at the **04:10 UTC rung on
Nov 19**; this session started 2026-11-18 ~16:31 UTC — **~11.6 hours
before** the rung. The S12 prompt's premise ("the first Treasury-primary
collect fired 04:10 UTC Nov 19 — verify the live readings flipped") is
therefore ahead of the clock; the honest record is the pre-flip state,
verified live (2026-11-18 ~16:33–16:37 UTC, production `23ce6b06`):

- **`GET /api/insights/pages/gold`** — `generatedAt`
  `2026-11-18T13:12:23.401Z` (the pre-deploy snapshot, exactly as S11
  recorded); the yield family still reads FRED provenance: us10y 5.12 @
  2026-11-16 "FRED (DGS10)" · us30y 5.46 "FRED (DGS30)" ·
  real-yield-10y 2.92 "FRED (DFII10)" · real-yield-5y 2.68
  "FRED (DFII5)" · term-premium-10y 0.9864 @ 2026-11-13 (Kim–Wright via
  FRED).
- **`GET /api/insights/pages/usa`** — same generatedAt; the /usa yield
  cards carry the same FRED mirror lines (T10Y2Y 0.30 @ 2026-11-17 —
  FRED's own latest there).
- **`GET /api/insights/status`** (public trim) — `generatedAt`
  `2026-11-18T13:12:23.401Z`, **`failedSources: []`** (the S11 `rba`
  failure healed at the 13:12 collect), staleCount 21, validation
  T-01..T-14 with **T-04 (freshness) false** — the pre-existing
  freshness flag, unchanged since the S11 close (the two operational P0s
  below + the blocked quartet's honest seats).
- **The two operational P0s** (carried, cited, not re-litigated): the
  CFTC seats still read as-of **2026-11-10** (the Saturday-gate miss)
  and GPR monthly at **2026-10-01** — both render honestly.

**Consequence, recorded:** the flip verification rides past this
session's window — the 04:10 UTC Nov 19 rung collects against whichever
production build is live then. This session's deploy (M3) carries the
same R07 Treasury-primary code (R07 is untouched by P1-c), so nothing
here blocks or alters the flip. **S13's M1 re-verifies the readings'
provenance + as-of flip** (the S11-D4 carry, one session later than the
S11 record projected — the honest clock, not an assumption).

## 3. M1(b) — the R15 drop-calendar check → **R15 SLIPS TO P2**

Checked both channels:

1. **The private `data/wgc/` path:** does not exist (fresh clone; no
   `data/wgc/` directory, no `*.xlsx` anywhere outside the committed
   fixtures, `.gitignore` covers `data/local-preview/` only — no WGC
   drop has ever landed in this repo).
2. **The owner's message:** this session's kickoff carries no drop
   notice (the S11 TLDR's "Needs your attention" item — "if the
   quarterly release has arrived, tell S12" — went unanswered).

**Verdict per the fold record §0.2 (the BROKEN rule): R15 slips to P2
gracefully.** Nothing else in P1 depends on it (F4's driver-4 close
degrades to the Tier-1 tracker; F1's demand clause is conditional by
design). The licence wall's WGC CB line (R09's) **stays as-is this
session** — it retires when Tier-2 lands (D7's visible payoff moves to
the P2 session that ships R15). The rest of P1-c proceeds: **this
session builds exactly R13, R14, R16, R17.**

## 4. M1(c) — the CBI gerami pin re-attempt → the default band stands

One venue re-attempt, per the prompt (recorded, not re-litigated):

- `https://www.cbi.ir/coin/` (the gerami press-release family of
  paths): **still WAF-blocked** — HTTP 200 serves the «درخواست رد شد»
  rejection page (1,008 B), the same block S4/04 §2b recorded.
- `https://www.cbi.ir/page/5953.aspx` (the commemorative-coins page
  that DID serve in S4): serves 200 (77,771 B) but carries **no gerami
  / ۱⁄۸-Bahar spec** (checked: «گرمی», «یک هشتم», «۱/۸» all absent —
  the page carries only the 1/2.5/5-Bahar family weights, which S4
  already read).

**Verdict: the default band `0.90–0.92 g pure` stands** (s8/02 §2b),
with its two candidate readings (1.01 g/0.900 → 0.909 g pure; 1.0149
g/0.900 → 0.9134 g pure) documented on the bridge card's method block
(C2 rule 1). The constant lands at the band's midpoint (0.91 g pure)
with the band itself printed — a ±0.5% intrinsic ambiguity, disclosed.
A further pin re-attempt rides Bridge-2 (R30, P3).

## 5. This session's own data-plane verifications (the rows' inputs, live)

Beyond the three checks above, the session verified its rows' data
paths live (Agent Rule 5 — never assume):

- **TGJU (`call1.tgju.org/ajax.json`, 2026-11-18 ~16:55 UTC):** all
  10 bridge symbols present, **including `mesghal`** (1,059,540,000
  Rial) — the s6/01 §2a board requires mesghal but the ingest's
  `TGJU_GOLD_SYMBOLS` carries only 9 symbols: **R13 adds `mesghal` to
  the shared snapshot plane** (one additive `GoldId`; `LedGoldBoard`'s
  own 9-row board is unchanged — one data plane, two presentations, per
  s6/03 rule 4). Per-symbol `ts` timestamps verified present
  («2026-11-18 20:25:27» Tehran-local; date-only on some legacy prints)
  — the per-row Jalali as-of stamps (C2 rule 3) parse them. The
  premium arithmetic reconciles on today's snapshot: toman-per-ounce
  3,744.68 × 266,330 = 997.26M; Emami intrinsic 234.7M vs market
  250.74M → **+6.8%**; the ladder monotone (Bahar +2.6% < Emami +6.8% <
  half +12.7% < quarter +20.8% < gerami +23.5%); **the mesghal آبشده
  convention exact**: mesghal ÷ geram24 = 3.248 g-equivalent ≈ 4.6083 g
  × 0.705 = 3.249 g pure (the melt-market premium ≈ +1.7% across
  geram18/geram24/mesghal, consistent).
- **IMF SDMX 3.0 (api.imf.org, keyless, 2026-11-18 ~17:0x UTC):**
  - **IL `RGV_REVS.FTO`** (`IMF.STA/IL/13.0.1`, 4.83 MB, 5.9 s):
    188 countries monthly; **USA 261,498,926.24 ozt @ 2026-M09 =
    8,133.5 t exact** (the S4 record reproduces); latest-month coverage
    61 countries @ M09 + 34 @ M10 (T+1..2); G163 (euro-area aggregate)
    present — excluded from sums per S4-D4; `startPeriod` is NOT
    honored by the venue (same 4.83 MB payload) — the full query is the
    fetch. **The TIME_PERIOD values are NOT index-chronological** (the
    observation index order is scrambled) — the parser maps
    index→period and sorts by date, exactly as the COFER parser does.
  - **IRFCL `IRFCLDT1_IRFCL56V_FTO`** (1.31 MB, 2.2 s): 89 countries;
    the complement confirmed — **RUS ends 2025-M11 in IL but is current
    in IRFCL** (2026-M09, 72.8M ozt vs IL's 74.8M @ M11: the decline
    visible in the fresher data); AGO + BRA present here (the S4-D4
    broken rows the value-band check drops).
  - **IRFCL value legs** (for the buyers table's share-of-reserves
    column, probed this session): `IRFCLDT1_IRFCL56_USD` (gold value,
    92 countries) + `IRFCLDT1_IRFCL65_USD` (total official reserve
    assets, 96 countries) — both serve. **The US book-value trap
    verified live:** USA gold "value" $11.04B = 261.5M ozt × $42.22
    (the statutory price) — a naive gold÷total share would print USA
    4.4% where every published table (market valuation) reads ~75–80%.
    See S12-D1.

## 6. The pre-build decisions (recorded for the program record)

- **S12-D1 — the share-of-reserves method (R14):** the buyers table's
  share column computes **gold at market over total official reserve
  assets with gold re-valued at the same price** — `(tonnes × P) ÷
  [(total_reported − gold_reported) + tonnes × P]`, `P` = the page's
  own live gold price (the `gold-usd` reading, named + dated at point
  of use). This is the WGC-consistent definition (their published table
  re-values gold at market); the IRFCL reporters that value gold at
  book (the US at the statutory $42.22) would otherwise print absurd
  shares (4.4% for the largest holder). All inputs are named IMF
  fields; the method sentence renders on the card (C1); the C7-rule-3
  caveat (a rising share can be price arithmetic, not buying) rides the
  table. Computed at RENDER time from the live price — the share moves
  with the market, which is exactly what the caveat teaches.
- **S12-D2 — the R17 de-dup's operational target:** the seats-section
  lane cards today render lane header (title + count) + state word +
  tally + intro + the seat chips. The elements byte-identical to the
  Signals section's expandable ledger rows are the **lane intro
  sentence + the tally line** (copy-pinned identical across the two
  sections by gold-copy-pin.test.ts). Per s6/01 §4 rule 5's keep-list
  ("lane header + verdict + seats list"), **R17 drops the intro + the
  tally from the seats lane cards** and keeps the header, the state
  word, and the full seats list. (There are no literal `<details>`
  expanders in GoldSeats — the audit's #21 "same expanders" phrasing
  named the duplicated chrome; the S12 prompt's "drop the expanders" is
  satisfied by dropping that chrome. The hero's and the Signals
  renderings keep theirs, untouched.)
- **S12-D3 — the gold-cb rung placement (R14):** the CB tracker rides
  **rung3 (04:30 UTC)** as a new registered extra source with a
  **day-1..5-of-month gate** + month-skip idempotence (the stored
  key's `fetchedAt` in the current UTC month → skip, 1 KV read): one
  real 4-fetch collect per month, cheap re-checks the days after, and
  the rare Saturday-1st budget collision self-heals (the next day's
  gate re-fires; the sweeps heal failures within hours, gate bypassed —
  the established pattern). Declared budget 8 (4 SDMX fetches + the KV
  read + the write + headroom); rung3's all-gates-day arithmetic stays
  ≤ 49/50 (1 status + 4 tic + 18 portwatch + 22 abs + 8 gold-cb − the
  tic gate only fires on the 15th–25th and Saturdays).
- **S12-D4 — R07's rung-pending posture carried one session:** the
  flip's verification rides S13's M1 (§2 above); recorded so the S13
  prompt carries it.

**Method:** the checks above were performed live (curl reads of the
production API + the venue fetches; the browser session verified the
live page's expander/lane structure — the hero weights carry no
aria-expanded/tooltip (GPE-S2-17 still open), the Signals ledger rows
do, the seats lane cards carry the intro+tally chrome R17 drops). The
IMF payloads were analyzed locally (USA/RUS/CHN spot values against the
S4 record; the dimension maps for the parser). Nothing was committed
from the probes; no credentials used.
