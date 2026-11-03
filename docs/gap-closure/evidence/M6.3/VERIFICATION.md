# M6.3 evidence — the de-dollarization and concentration family

**Verification pass: 2026-11-03 ~00:05 UTC (this session re-verified every
provider answer live from the work sandbox; the fifth continuation session's
probe record agrees on every value).**

## 1. IMF COFER — `usd-reserve-share`

- Endpoint: `https://api.imf.org/external/sdmx/2.1/data/COFER/G001.AFXRA.CI_USD.SHRO_PT.Q?startPeriod=2016-01-01&detail=dataonly`
- Live answer (this session, ~00:05 UTC): HTTP **200**, `text/csv`,
  **5,177 B**, **1.07 s** — raw copy: `cofer-live-answer-2026-11-03.csv`.
- **42 quarterly rows**, 2016-Q1 = **63.9291976** → 2026-Q2 =
  **56.704761505127** (the latest published quarter; ~one-quarter lag).
- Every identity dimension verified per row: DATAFLOW `IMF.STA:COFER(7.0.1)`,
  COUNTRY `G001`, INDICATOR `AFXRA`, FXR_CURRENCY `CI_USD`,
  TYPE_OF_TRANSFORMATION `SHRO_PT`, FREQUENCY `Q`.
- Licence: the response's own LICENSE column ("© International Monetary Fund
  Copyright. All Rights Reserved. https://www.imf.org/external/terms.htm") +
  the suggested citation; the IMF statistical-data special terms (the
  portwatch class, quoted verbatim in sources.ts/licences.ts). L1.
- Worker egress (the fifth session's probe, 2026-11-02 22:58 UTC, the
  temporary `currena-probe` Worker, deleted after): 200 `text/csv` ~1.1 s on
  BOTH runs — recorded in VERIFIED-SOURCES.

## 2. Yahoo RSP/SPY — `sp500-breadth-ratio`

- Endpoints: `https://query1.finance.yahoo.com/v8/finance/chart/{RSP,SPY}?range=10y&interval=1d`
- Live answer (this session, ~00:06 UTC): both HTTP **200**; **2,512** daily
  adjusted closes EACH over the IDENTICAL window, last common date
  **2026-11-02**: RSP **219.98** / SPY **752.10** → ratio **0.292488**
  (6 dp). Zero missing values on either leg.
- The ratio's decade path (from the committed fixtures, the provider's own
  answers): ~0.38 in late 2016 → the high 0.20s now — the giants' slice of
  the index grew.
- Licence: Yahoo L2, the owner-accepted class (the S6 spec's own
  parenthetical: "RSP and SPY; L2, already owner-accepted for Yahoo").

## 3. FRED OECD mirrors — `btp-bund-spread`

- Italy leg `IRLTLT01ITM156N`: live answer (this session): HTTP 200, **427
  rows**, 1991-03 → **2026-08 = 3.986** — raw copy:
  `fred-italy-10y-live-2026-11-03.csv`. Citation-required (T-16 record
  added).
- Germany leg `IRLTLT01DEM156N` (the existing bund-10y series): live answer:
  HTTP 200, through **2026-09 = 3.4695** — raw copy:
  `fred-germany-10y-live-2026-11-03.csv`.
- The derived spread at the last common month **2026-08**:
  3.986 − 3.18571428571429 = **0.8003** percentage points (4 dp: 0.8003) —
  provider-exact from this session's own fetches.
- Both legs ride the SAME FRED OECD mirror bulk group (the Italy leg joined
  as the 5th member — zero new fetches anywhere).

## 4. What is honestly NOT done (the credentials gap)

This session (the sixth continuation) has **no GitHub or Cloudflare
credentials** (the continuation message's credential section arrived empty;
the environment carries no tokens — checked by presence only). Therefore,
at the M6.3 code close:

- **No git push** — the commit chain is local, ready to push.
- **No worker/web deploy** — api stays at `ecd3ff63`, markets at `58c4eebd`.
- **No KV landing for the three readings** — the designed recovery recipe:
  once the code is pushed to `main`, the **04:20 UTC rung-2 bootstrap**
  (GHA scheduled, repo-secret auth) fetches `usd-reserve-share` (Saturday
  gate + bootstrap-missing) and `sp500-breadth-ratio` (daily) on its next
  firing, and the **04:10 main rung** derives `btp-bund-spread` from the
  Italy leg once the bulk group carries it. Alternatively a credentialed
  session fires the manual lever:
  `pnpm --filter @currena/insights rung2-run --cofer --breadth` (then the
  main phase or `--bootstrap` for the spread's stage entry).
- The same constraint applies to the **M6.2 China readings' landing** (see
  PROGRESS.md M6.2): the 00:07 UTC manual lever could not fire from this
  session; the 04:20 UTC rung-2 bootstrap owns it.

The parsers are fixture-pinned (fail-closed, every identity dimension) and
the full gates suite is green at this state: **14,508 tests** (baseline
14,257 + the M6.3 family's 251), Insights lazy **1522.36/352.01** under the
justified **1530/353** ceiling (CHANGELOG §2026-11-02j).
