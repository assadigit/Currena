/**
 * The v2 indicator definitions — the static configuration the scoring engine
 * and the SPA (via a static import; no network) both read.
 *
 * I15 restructure (2026-10-08, the owner's data + UI specs):
 *  - Groups are QUESTIONS now, not asset classes (readers ask questions).
 *    Each lane group maps 1:1 onto a gauge; `prices-board` holds the price
 *    rows the Prices section renders (never in a lane, never a gauge member).
 *  - `dollar-broad` (FRED DTWEXBGS, lags ~5d upstream) is REPLACED by the
 *    Currena dollar basket (DXY-style weighted geometric mean of six ECB
 *    reference rates, computed from Frankfurter — see src/basket.ts).
 *  - `staleAfterDays` carries the per-series freshness limits (data spec §3)
 *    so weekly-batched dailies (Brent/EIA) and monthly ABS CPI items stop
 *    tripping false staleness. Absent → cadence-based GRACE_DAYS.
 *  - New indicators: fed-target (target-range midpoint), ecb-dfr (ECB Data
 *    Portal), us-cpi-yoy (CPIAUCSL 12-month change), nfci (Chicago Fed),
 *    eur-usd, au-home-loan (RBA F6 outstanding owner-occupier), au-wage-growth
 *    (ABS WPI, below-aux vs CPI), au-rent-yoy / au-petrol-yoy (ABS CPI items),
 *    btc-usd + copper-usd (gold-api live prices on the Prices board).
 *  - TGJU is OUT of Insights (unverified licence, data spec §1) — gold now
 *    comes from gold-api XAU exactly like silver.
 *
 * Cadence notes closed/recorded across I1–I2 (no contract change needed):
 *  - `au-cpi` / `au-trimmed-mean` stay `quarterly` — the keyless Data API
 *    route (CPI + CPI_Q flows) is verified current.
 *  - `gold-silver`, `gold-usd`, `silver-usd` history is monthly (World Bank
 *    backfill) + accumulated daily live points even though the live value is
 *    daily; cadence says how often the *data* updates.
 *  - `au-us-10y-gap` is `weekly` (Phase I2 venue finding): RBA F2 publishes
 *    with a 2–4 business-day lag; the value stays daily.
 *  - `au-rent-yoy` / `au-petrol-yoy` ride the MONTHLY CPI indicator series
 *    (verified current through the CPI dataflow); their percentile base is
 *    the monthly history (~4 years so far — the engine's 30-obs floor guards
 *    it, and the base grows every month).
 */

import type { IndicatorDefinition } from '@currena/core';

export const DEFINITIONS: readonly IndicatorDefinition[] = [
  /* ------------- Global — Is borrowing getting costlier? ------------- */
  {
    id: 'yield-curve-10y2y',
    section: 'global',
    group: 'borrowing-costs',
    name: 'US 10Y minus 2Y yield',
    source: 'fred',
    sourceRef: 'FRED:T10Y2Y',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'below', value: 0 },
  },
  {
    // 2026-10-26 gap-audit build, A-1 (INSIGHTS_DATA_SPEC.md): the US
    // 10-year minus 3-month Treasury yield — the 3-month leg the Fed itself
    // watches (deep 3m inversions preceded every modern US recession with
    // 6–24 months of lead). Rides the SAME FRED bulk group as T10Y2Y (zero
    // new fetches); SCORED beside its 10y−2y sibling so the borrowing lane
    // carries both classic curve legs.
    id: 'yield-curve-10y3m',
    section: 'global',
    group: 'borrowing-costs',
    name: 'US 10Y minus 3M yield',
    source: 'fred',
    sourceRef: 'FRED:T10Y3M',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: {
      kind: 'any-of',
      of: [
        { kind: 'threshold', direction: 'below', value: 0 },
        { kind: 'threshold', direction: 'below', value: -0.5 },
        { kind: 'change', mode: 'points', direction: 'rise', magnitude: 1, windowWeeks: 4 },
      ],
    },
  },
  {
    id: 'real-yield-10y',
    section: 'global',
    group: 'borrowing-costs',
    name: 'US 10-year real yield',
    source: 'fred',
    sourceRef: 'FRED:DFII10',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.2 },
  },
  {
    id: 'us10y',
    section: 'global',
    group: 'borrowing-costs',
    name: 'US 10-year Treasury yield',
    source: 'fred',
    sourceRef: 'FRED:DGS10',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: {
      kind: 'any-of',
      of: [
        { kind: 'percentile', tail: 'high', cutoff: 0.1 },
        { kind: 'change', mode: 'points', direction: 'rise', magnitude: 0.5, windowWeeks: 4 },
      ],
    },
  },
  {
    // Step-1 audit item A1: the value is the range's LOWER bound
    // (DFEDTARL); the runner attaches the upper bound (DFEDTARU) as
    // `rangeHigh`, so the card renders the true corridor "3.75–4.00%"
    // straight from the two published series. Percentile/change math runs
    // on the lower bound — post-2008 it is the midpoint shifted by a
    // constant 12.5bp, so the verdicts are identical.
    id: 'fed-target',
    section: 'global',
    group: 'borrowing-costs',
    name: 'Federal funds target rate',
    source: 'fred',
    sourceRef: 'FRED:DFEDTARL (lower bound) + DFEDTARU (upper bound)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.1 },
    staleAfterDays: 5,
  },
  {
    // Fix spec C-03 (2026-10-14): "What markets expect from the Fed" — the
    // US 2-year Treasury yield minus the Fed policy rate (the target range's
    // lower bound, the same leg the fed-target card renders beside its
    // upper). When the 2-year yield sits well above the policy rate, markets
    // price higher future policy; well below, they price cuts. Scored
    // through the engine's standard percentile machinery — the explicit
    // word thresholds are a Step-3 deliverable and the card says so.
    id: 'fed-expectations',
    section: 'global',
    group: 'borrowing-costs',
    name: 'What markets expect from the Fed (2-year gap)',
    source: 'derived',
    sourceRef: 'FRED:DGS2 − FRED:DFEDTARL/DFEDTARU midpoint (2-year yield minus the policy-rate midpoint)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.1 },
    staleAfterDays: 4,
  },
  {
    // Fix spec C-04 (2026-10-14): the US 30-year Treasury yield — the long
    // end of the borrowing-costs lane; shows "highest since {year}" (B-19).
    id: 'us30y',
    section: 'global',
    group: 'borrowing-costs',
    name: 'US 30-year Treasury yield',
    source: 'fred',
    sourceRef: 'FRED:DGS30',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P2',
    rule: {
      kind: 'any-of',
      of: [
        { kind: 'percentile', tail: 'high', cutoff: 0.1 },
        { kind: 'change', mode: 'points', direction: 'rise', magnitude: 0.5, windowWeeks: 4 },
      ],
    },
    staleAfterDays: 4,
  },
  {
    // M4 Wave 1 (OD-8/D-42, 2026-10-24): the overnight funding rate — the
    // transmission leg the rates panel was missing (policy set ✓ → funding
    // ✗ → long end ✓). CONTEXT (info): its warning content is redundant
    // with fed-target (both track the corridor); the card's value is the
    // "rate set = rate transmitted" CHECK — SOFR sitting ABOVE the target
    // range is the repo-stress read, and the copy says so.
    id: 'sofr',
    section: 'global',
    group: 'borrowing-costs',
    name: 'The overnight funding rate (SOFR)',
    source: 'fred',
    sourceRef: 'FRED:SOFR (Secured Overnight Financing Rate)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
  },
  {
    // M4 Wave 1 (OD-8/D-42): the 2-year Treasury yield as its own CONTEXT
    // display — Tier 0 (the series is already collected for
    // fed-expectations + the Treasury fallback; the review's §5.1 row:
    // "completes the Treasury-curve display; makes yield-curve-10y2y
    // self-explanatory"). The scored vote stays with fed-expectations (the
    // 2y-gap voter) so the lane never double-votes one series.
    id: 'us-2y',
    section: 'global',
    group: 'borrowing-costs',
    name: 'US 2-year Treasury yield',
    source: 'fred',
    sourceRef: 'FRED:DGS2',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
  },
  {
    // M5 Wave 2 (OD-8/D-42, 2026-10-24): the euro-area AAA 10-year yield —
    // THE daily fix for the structurally stale OECD bund mirror (the
    // review's "single highest-value rates add"). CONTEXT (info): the
    // scored euro vote stays with ecb-dfr (the policy rate); this is the
    // long-end display. The series key the review could not find, verified
    // live at build time: YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y ("AAA yield
    // curve - 10-year spot rate"; the G_N_C sibling is the ALL-rated
    // curve — not the safe-asset leg).
    id: 'euro-aaa-10y',
    section: 'global',
    group: 'borrowing-costs',
    name: 'What the safest euro-area governments pay for 10 years',
    source: 'ecb',
    sourceRef: 'ECB Data Portal YC/B.U2.EUR.4F.G_N_A.SV_C_YM.SR_10Y (AAA yield curve, 10-year spot rate)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 7, // the ECB's T+1 publication; the same window as ecb-dfr
  },
  {
    id: 'ecb-dfr',
    section: 'global',
    group: 'borrowing-costs',
    name: 'ECB deposit facility rate',
    source: 'ecb',
    sourceRef: 'ECB Data Portal FM/D.U2.EUR.4F.KR.DFR.LEV',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.1 },
    staleAfterDays: 7,
  },
  {
    id: 'govt-interest-revenue',
    section: 'global',
    group: 'borrowing-costs',
    name: 'US government interest payments / receipts',
    source: 'derived',
    sourceRef: 'FRED:A091RC1Q027SBEA ÷ FRED:W006RC1Q027SBEA',
    cadence: 'quarterly',
    // Step-1 audit item C5: a share — its changes speak in percentage points.
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.2 },
    // I19: BEA NIPA obs date from Q-01 and the obs first appears with the
    // advance estimate ~30d after quarter end, staying latest until the
    // next advance — ages up to ~212d between releases (the latent Oct
    // window the 190d quarterly grace false-alarms in: verified live
    // 2026-10-10, obs 2026-04-01 at 192d while FRED confirmed it is the
    // freshest data that exists). 215 covers it — same ABS discipline.
    staleAfterDays: 215,
  },
  // ---- 2026-10-21 data-integrity round: sovereign-yield & policy-rate ----
  // ---- coverage — context cards, private-only (citation-required). ----
  {
    // 2026-10-21 data-integrity round: sovereign-yield & policy-rate
    // coverage — CONTEXT CARDS (info rule: live value, percentile and
    // asOf render; never a scored vote, so the gauge/verdict calibration
    // is untouched — T-09's scored⇔gauge-member invariant).
    id: 'bund-10y',
    section: 'global',
    group: 'borrowing-costs',
    name: 'German 10-year government bond yield',
    source: 'fred',
    sourceRef: 'FRED:IRLTLT01DEM156N (long-term government bond yield, monthly)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 75,
  },
  {
    // A-2 (2026-10-26 gap-audit build): the DAILY upgrade — the Ministry of
    // Finance's own jgbcme.csv (next-business-day publication, 15 maturity
    // columns, the header row asserted) replaces the OECD monthly mirror as
    // the primary. The mirror stays as the LABELLED fallback for MOF
    // outages (the 04:20 rung-2 phase arms it from the stage helper);
    // retire it after two clean weeks per the fix-or-retire discipline.
    // Context card as before (never a gauge vote).
    id: 'jgb-10y',
    section: 'global',
    group: 'borrowing-costs',
    name: 'Japan 10-year government bond yield',
    source: 'mof',
    sourceRef: 'Japan Ministry of Finance jgbcme.csv (10Y column, daily)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 4,
  },
  {
    id: 'gilt-10y',
    section: 'global',
    group: 'borrowing-costs',
    name: 'UK 10-year government bond yield',
    source: 'fred',
    sourceRef: 'FRED:IRLTLT01GBM156N (long-term government bond yield, monthly)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 75,
  },
  {
    // The overnight call-rate average tracks the BoJ's policy target
    // (when the target is 1.0%, the uncollateralized overnight average
    // reads ~1.04%) — the honest monthly proxy while no daily official
    // series is free (probed 2026-10-21: FRED IRSTCI01JPM156N live, last
    // 2026-09 = 1.043).
    id: 'boj-rate',
    section: 'global',
    group: 'borrowing-costs',
    name: 'Bank of Japan policy rate (overnight)',
    source: 'fred',
    sourceRef: 'FRED:IRSTCI01JPM156N (overnight call rate, monthly)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 75,
  },
  {
    // M6 Wave-4 probe fix (2026-10-25): the BoE's own Bank Rate history —
    // the decision table (258 rows back to 1975, expanded to the F1-shaped
    // daily step series) replaces the FRED OECD monthly mirror. Current at
    // every decision, never stale by age (the rba-cash-rate pattern).
    id: 'boe-rate',
    section: 'global',
    group: 'borrowing-costs',
    name: 'Bank of England policy rate (overnight)',
    source: 'boe',
    sourceRef: 'Bank of England official Bank Rate history (decision table)',
    cadence: 'per-change',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
  },
  {
    // M6 Wave 3 (OD-8/D-42, 2026-10-25): the US household's own borrowing
    // cost — the mortgage leg of the transmission chain (policy → funding
    // → long end → THE 30-YEAR HOME LOAN → housing demand), the US twin of
    // au-home-loan for the two-audience household story. CONTEXT: the
    // scored borrowing vote stays with the market-rate family.
    id: 'mortgage-30y',
    section: 'global',
    group: 'borrowing-costs',
    name: 'The US 30-year home-loan rate',
    source: 'fred',
    sourceRef: 'FRED:MORTGAGE30US (30-Year Fixed Rate Mortgage Average, weekly)',
    cadence: 'weekly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    // Freddie Mac's PMMS survey publishes Thursdays for the week's
    // Wednesday — one missed print reads ~10d of obs age; 14 keeps a
    // single miss from false-alarming before the next lands.
    staleAfterDays: 14,
  },
  {
    // gap-closure S2-M2.4 (2026-10-31, the S2 spec's weekly custody card):
    // Treasuries held in custody at the New York Fed for foreign official
    // accounts — the WEEKLY pulse of foreign official demand for US
    // government debt, beside the monthly TIC country table that lags
    // ~6–7 weeks. CONTEXT (info): never a vote — it is the level the
    // reader watches beside the "Who holds US government debt" section
    // (the card renders there via HIDDEN_FROM_LANE_IDS, the
    // US-global-reach/dollar-strength one-surface pattern). The walcl
    // twin: same Fed H.4.1-family Wednesday-level weekly series, same
    // $-millions unit (displayed ×1e-6 as trillions), same public-domain
    // licence class (data/fred-copyright.json, verified 2026-10-31 from
    // the series page's own schema.org license field).
    id: 'nyfed-custody',
    section: 'global',
    group: 'borrowing-costs',
    name: 'Foreign official holdings at the New York Fed (weekly)',
    source: 'fred',
    sourceRef: 'FRED:WSEFINTL1 (Treasuries held in custody for foreign official accounts, Wednesday level, $ millions)',
    cadence: 'weekly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    // The H.4.1-family release publishes Thursday for the Wednesday
    // level — the walcl precedent: one missed print reads ~10d of obs
    // age; 21 covers two.
    staleAfterDays: 21,
  },
  {
    // gap-closure S3-M3.5 (2026-11-01): the rolling 12-month federal
    // deficit — how much the US government borrowed over the last year,
    // the supply side of the Treasury market beside the yields family
    // (G4's fiscal leg; the govt-interest-revenue voter is the interest
    // side of the same ledger). DERIVED: rolling 12-month sum of FRED
    // MTSDS133FMS (monthly $ millions; negative = deficit), pure, no
    // joins. CONTEXT (info). The latest monthly figure rides INSIDE this
    // card as the us-deficit-monthly companion. Rides rung4 (the macro
    // group already fetches MTSDS133FMS since M3.2).
    id: 'us-deficit-12m',
    section: 'global',
    group: 'borrowing-costs',
    name: 'US federal deficit (12-month total)',
    source: 'derived',
    sourceRef: 'FRED:MTSDS133FMS (federal surplus or deficit, monthly $M; derived: rolling 12-month sum)',
    cadence: 'monthly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    // The Monthly Treasury Statement publishes the month ~4–7 weeks after
    // it ends (verified live: the 2026-09 stamp is the freshest print on
    // 2026-11-01) — obs M-01 ages ~75d between releases, the us-cpi-yoy
    // monthly convention.
    staleAfterDays: 75,
  },
  {
    // gap-closure S3-M3.5: COMPANION-ONLY — the latest MONTHLY federal
    // surplus/deficit figure, rendered INSIDE the us-deficit-12m card
    // (the michigan-1y-expectations pattern), never as its own row.
    // CONTEXT (info): the month's own number beside the 12-month total.
    id: 'us-deficit-monthly',
    section: 'global',
    group: 'borrowing-costs',
    name: 'US federal deficit (monthly)',
    source: 'fred',
    sourceRef: 'FRED:MTSDS133FMS (federal surplus or deficit [-], monthly, $ millions)',
    cadence: 'monthly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 75, // the parent's MTS publication rhythm
  },
  {
    // gap-closure S3-M3.5: the latest 10-year-family Treasury auction —
    // bid-to-cover (bids accepted per dollar offered: the demand gauge)
    // at the AUCTION date. Treasury FiscalData auctions_query (the
    // M3.1-verified request: one page[size]=4000 sorted -auction_date
    // fetch, client-side family selection; filters are silently ignored,
    // fields + sort + paging work). CONTEXT (info). The indirect-bidder
    // share of accepted rides INSIDE this card as the companion.
    // Worker egress BLOCKED — the GHA/Node venue fetches it; the id
    // joins RUNG4_IDS (the main rung carries it; the Node inline build
    // writes it). EVENT-BASED cadence: each 10y-family auction lands
    // roughly monthly (monthly reopenings + quarterly new issues).
    id: 'treasury-auction-10y',
    section: 'global',
    group: 'borrowing-costs',
    name: 'US 10-year Treasury auction demand',
    source: 'fiscaldata',
    sourceRef: 'Treasury FiscalData:auctions_query (10-Year family, ex TIPS, bid_to_cover_ratio, per auction)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    // The event-based stale rule (the spec's explicit demand): a fresh
    // 10y-family auction lands roughly monthly (reopenings monthly, new
    // issues quarterly — the family never skips more than ~6 weeks); 45
    // days covers one missed or delayed cycle, then honest stale.
    staleAfterDays: 45,
  },
  {
    // gap-closure S3-M3.5: COMPANION-ONLY — the same 10y auction's
    // indirect-bidder share of accepted (indirect_bidder_accepted ÷
    // total_accepted, % — the foreign/intermediary demand read), rendered
    // INSIDE the treasury-auction-10y card.
    id: 'treasury-auction-10y-indirect',
    section: 'global',
    group: 'borrowing-costs',
    name: 'US 10-year auction indirect share',
    source: 'fiscaldata',
    sourceRef: 'Treasury FiscalData:auctions_query (10-Year family, indirect_bidder_accepted ÷ total_accepted, per auction)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 45, // the parent auction's event rhythm
  },
  {
    // gap-closure S3-M3.5: the latest 30-year-family Treasury auction —
    // the long-bond demand gauge, the treasury-auction-10y twin.
    id: 'treasury-auction-30y',
    section: 'global',
    group: 'borrowing-costs',
    name: 'US 30-year Treasury auction demand',
    source: 'fiscaldata',
    sourceRef: 'Treasury FiscalData:auctions_query (30-Year family, ex TIPS, bid_to_cover_ratio, per auction)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 45, // the 10y twin's event-based rule (a fresh 30y-family auction lands roughly monthly)
  },
  {
    // gap-closure S3-M3.5: COMPANION-ONLY — the same 30y auction's
    // indirect-bidder share of accepted, rendered INSIDE the
    // treasury-auction-30y card.
    id: 'treasury-auction-30y-indirect',
    section: 'global',
    group: 'borrowing-costs',
    name: 'US 30-year auction indirect share',
    source: 'fiscaldata',
    sourceRef: 'Treasury FiscalData:auctions_query (30-Year family, indirect_bidder_accepted ÷ total_accepted, per auction)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 45, // the parent auction's event rhythm
  },
  /* ---------------- Global — Are prices heating up? ---------------- */
  {
    id: 'us-cpi-yoy',
    section: 'global',
    group: 'prices-heat',
    name: 'US inflation (yearly)',
    source: 'fred',
    sourceRef: 'FRED:CPIAUCNS (12-month % change, not seasonally adjusted — the BLS headline basis)',
    cadence: 'monthly',
    // Step-1 audit item C5: a yearly RATE — its changes are expressed in
    // percentage points, never as a percent-of-percent.
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'above', value: 3 },
    // Spec said 50 (release-date aging); the engine ages from the OBS date
    // (M-01), which is up to ~73d old just before the next release — 75
    // keeps the monthly cadence honest instead of false-alarming.
    staleAfterDays: 75,
  },
  {
    // Step-1 audit item A3: core CPI (ex food & energy) — a CONTEXT
    // companion to the headline card ("Core CPI: 2.4% next to headline
    // 3.4%, the gap is mainly energy"). Never its own card, never a gauge
    // member; the UI renders it inside the us-cpi-yoy card only.
    id: 'us-cpi-core-yoy',
    section: 'global',
    group: 'prices-heat',
    name: 'US core inflation (yearly)',
    source: 'fred',
    sourceRef: 'FRED:CPILFENS (12-month % change, not seasonally adjusted)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 75,
  },
  {
    // M4 Wave 1 (OD-8/D-42, 2026-10-24): the Fed's preferred inflation
    // gauge — core PCE, computed as the 12-month % change of the PCEPILFE
    // index exactly like us-cpi-yoy (the repo's derived-yoy pattern).
    // SCORED against the Fed's own 2% target (the published goal is the
    // threshold — the same honest posture as us-cpi-yoy's 3% line).
    id: 'us-pce-core-yoy',
    section: 'global',
    group: 'prices-heat',
    name: 'US core inflation by the Fed’s gauge (PCE)',
    source: 'fred',
    sourceRef: 'FRED:PCEPILFE (12-month % change, core PCE price index)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'above', value: 2 },
    // BEA publishes ~30d after month end; the obs (M-01) ages ~91d between
    // releases — 95 covers it without a false stale (the same
    // publication-cycle discipline as govt-interest-revenue's 215).
    staleAfterDays: 95,
  },
  {
    // gap-closure S3-M3.4 (2026-11-01): the Cleveland Fed's median CPI —
    // the trimmed-middle inflation read the Fed's own researchers track,
    // beside the headline and core CPI cards. CONTEXT (info). FRED
    // MEDCPIM158SFRBCLE, monthly 12-month % change, citation-required
    // (T-16, verified live from the series page 2026-11-01 — displayed
    // with the FRED attribution). Rides rung4.
    id: 'median-cpi',
    section: 'global',
    group: 'prices-heat',
    name: 'US median inflation (Cleveland Fed)',
    source: 'fred',
    sourceRef: 'FRED:MEDCPIM158SFRBCLE (Median Consumer Price Index, 12-month % change, monthly)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    // The Cleveland Fed's CPI suite publishes ~mid-month following the
    // BLS print (the us-cpi-yoy calendar): obs M-01 ages ~75d between
    // releases — the monthly convention keeps the cadence honest.
    staleAfterDays: 75,
  },
  {
    // gap-closure S3-M3.4 (2026-11-01): the Atlanta Fed's sticky-price CPI
    // — inflation in the basket whose prices rarely change (the
    // expectations-sensitive read). CONTEXT (info): reads beside the
    // median-CPI and headline-CPI yearly family. FRED STICKCPIM158SFRBATL
    // — the 12-MONTH sibling of the spec's MoM id (STICKCPIM157SFRBATL,
    // verified too), chosen so the card reads beside yearly cards; the
    // deviation is recorded in PROGRESS + VERIFIED-SOURCES (M3.1).
    // Citation-required (T-16, verified live 2026-11-01). Rides rung4.
    id: 'sticky-cpi',
    section: 'global',
    group: 'prices-heat',
    name: 'US sticky-price inflation (Atlanta Fed)',
    source: 'fred',
    sourceRef: 'FRED:STICKCPIM158SFRBATL (Sticky Price Consumer Price Index, 12-month % change, monthly)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    // The Atlanta Fed's sticky-CPI suite publishes ~mid-month following
    // the BLS print: obs M-01 ages ~75d between releases — the monthly
    // convention (the us-cpi-yoy precedent).
    staleAfterDays: 75,
  },
  {
    // M6 Wave 3 (OD-8/D-42, 2026-10-25): the euro area's inflation — the
    // P0/P1 review's "thinnest major economy" fix (the euro area had only
    // a policy rate). SCORED against the ECB's own 2% symmetric target
    // (the us-pce-core-yoy posture: the central bank's published goal is
    // the threshold). The series key is the NEW post-Feb-2026 HICP dataset
    // (the old ICP flow died 2025-12 upstream; verified live 2026-10-25:
    // 4D0 provider, history back-filled to the full decade).
    id: 'euro-hicp',
    section: 'global',
    group: 'prices-heat',
    name: 'Euro-area inflation (yearly)',
    source: 'ecb',
    sourceRef:
      'ECB Data Portal HICP/M.U2.N.000000.4D0.ANR (euro-area HICP all-items, annual rate of change, monthly)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'above', value: 2 },
    // Eurostat publishes the flash ~2d and the final ~2-3 weeks after
    // month end; the obs (M-01) ages ~50d between releases — 60 covers it.
    staleAfterDays: 60,
  },
  {
    // M6 Wave 3 (OD-8/D-42, 2026-10-25): the wage leg of the wage-price
    // loop — AU has one, the US didn't. CONTEXT (info): the inflation vote
    // belongs to the CPI/PCE/HICP family; the wage card is the loop's
    // second leg, read beside them.
    id: 'us-wages',
    section: 'global',
    group: 'prices-heat',
    name: 'US wage growth (yearly)',
    source: 'fred',
    sourceRef: 'FRED:AHETPI (average hourly earnings, all employees → 12-month % change)',
    cadence: 'monthly',
    // A yearly RATE — its changes speak in percentage points.
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 75,
  },
  {
    // M6 Wave 3 (OD-8/D-42, 2026-10-25): the 5-year spot breakeven — the
    // missing middle leg between Michigan's 1y survey expectation and the
    // 5y5y forward (which strips the near-term term). CONTEXT (info):
    // T5YIFR's own card carries the market-expectations vote.
    id: 't5yie',
    section: 'global',
    group: 'prices-heat',
    name: 'Expected US inflation, five years ahead',
    source: 'fred',
    sourceRef: 'FRED:T5YIE (5-Year Breakeven Inflation Rate, daily)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 5,
  },
  {
    id: 'breakeven-5y5y',
    section: 'global',
    group: 'prices-heat',
    name: 'Inflation expectations (5y5y forward)',
    source: 'fred',
    sourceRef: 'FRED:T5YIFR',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P2',
    // Step-1 audit item D4, re-backtested 2026-10-13 against the full FRED
    // history: the old top-20%-of-decade rule flagged 2.32% as "Needs
    // attention" even though 2.32 sits near the 2024–26 regime (median 2.26)
    // and the text said pressure was easing — a contradiction. The decade's
    // distribution: p50 2.18 · p80 2.30 · p95 2.40; episodes above 2.4%
    // cluster in the 2022 spike and autumn 2023 (longest run 41 days);
    // above 2.5% is single-day noise only. The evidence rule: above 2.4%
    // SUSTAINED 4 weeks — it fired exactly once in the decade (autumn 2023)
    // and never on noise. The card shows the rule verbatim.
    rule: { kind: 'threshold', direction: 'above', value: 2.4, sustainedWeeks: 4 },
  },
  {
    // 2026-10-26 gap-audit build, A-4 (INSIGHTS_DATA_SPEC.md): gold
    // measured in oil — the classic long-run relative-value ratio between
    // the two biggest commodities, derived gold-usd ÷ brent on their
    // common dates. CONTEXT per the spec's gauge table (the gold beam's
    // neutral factor; never a scored vote). Percentile-based reading
    // bands (the spec's threshold regime: the ratio's range shifts across
    // regimes — 1970s ~30, 2015 ~20, 2020s wide — so fixed numbers age
    // badly); the percentile bar renders from the 10-year history.
    id: 'gold-oil-ratio',
    section: 'global',
    group: 'prices-heat',
    name: 'Gold measured in oil',
    source: 'derived',
    sourceRef: 'gold-usd ÷ brent (both collected; barrels of Brent per troy ounce of gold)',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 3,
  },
  {
    // 2026-10-26 gap-audit build, A-6 (INSIGHTS_DATA_SPEC.md): US crude-oil
    // inventories (ending stocks, thousands of barrels) from the EIA's
    // KEYLESS website route (the v2 API needs a registered key — the
    // owner's terms forbid registering one). Weekly with the Wednesday
    // Petroleum Status Report; fetched on the Saturday rung-2 phase.
    // CONTEXT per the spec's gauge table (the oil-price context beside
    // brent/wti; the scored energy vote stays with brent).
    id: 'eia-crude-stocks',
    section: 'global',
    group: 'prices-heat',
    name: 'US crude oil inventories',
    source: 'eia',
    sourceRef: 'EIA WCRSTUS1 (U.S. ending stocks of crude oil, weekly, thousand barrels)',
    cadence: 'weekly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 12,
  },
  {
    // 2026-10-26 gap-audit build, A-7 (INSIGHTS_DATA_SPEC.md): trader
    // positioning in gold — the CFTC's futures-only COT, net
    // non-commercial as a share of open interest (percent). Weekly
    // (Tuesday data, Friday 17:30 ET publish); fetched on the Saturday
    // rung-2 phase; one weekly point per file, the series accumulates in
    // the stored history. SCORED with the spec's thresholds (net long
    // above 45% of OI — the crowded-long squeeze-then-slump zone — or
    // below 0, the rare net-short floor signal; plus the 10-year
    // percentile tails at 2%, unevaluable until the base fills).
    id: 'cftc-gold-positioning',
    section: 'global',
    group: 'market-stress',
    name: 'Trader positioning in gold (COT)',
    source: 'cftc',
    sourceRef: 'CFTC Commitments of Traders (futures-only, GOLD - COMMODITY EXCHANGE INC.)',
    cadence: 'weekly',
    changeKind: 'points',
    phase: 'P1',
    rule: {
      kind: 'any-of',
      of: [
        { kind: 'threshold', direction: 'above', value: 45 },
        { kind: 'threshold', direction: 'below', value: 0 },
        { kind: 'percentile', tail: 'high', cutoff: 0.02 },
        { kind: 'percentile', tail: 'low', cutoff: 0.02 },
      ],
    },
    staleAfterDays: 12,
  },
  {
    // 2026-10-26 gap-audit build, A-8 (INSIGHTS_DATA_SPEC.md): the OECD's
    // amplitude-adjusted Composite Leading Indicator, US leg — the
    // licensed-PMI replacement the spec names ("the growth lane gains its
    // leading edge without ISM/S&P data"), so this card is the SCORED
    // voter of the CLI trio. One filtered SDMX fetch carries all three
    // countries (REF_AREA USA+CHN+DEU on the first-of-month rung-2 phase;
    // the spec's EA19 does not exist in the dataflow — probed live
    // 2026-10-26 — Germany is the honest euro substitute, recorded in the
    // implementation report's Assumptions). The rule folds the spec's two
    // tiers into one any-of (the A-1 pattern): 6-month annualised growth
    // below −1 (turning down) or below −2 (the recession-approach zone) or
    // three consecutive monthly falls; the rare V-turn reads as a 3-month
    // annualised rise above +2. maxAgeDays 75 (a ~5-week publication lag).
    id: 'oecd-cli-us',
    section: 'global',
    group: 'growth-health',
    name: 'OECD leading indicator (US)',
    source: 'oecd',
    sourceRef: 'OECD Composite leading indicator (amplitude-adjusted), United States',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: {
      kind: 'any-of',
      of: [
        { kind: 'growth', direction: 'below', value: -1, months: 6 },
        { kind: 'growth', direction: 'below', value: -2, months: 6 },
        { kind: 'consecutive-decline', periods: 3 },
        { kind: 'growth', direction: 'above', value: 2, months: 3 },
      ],
    },
    staleAfterDays: 75,
  },
  {
    // A-8's China companion: the same one-fetch CLI, CONTEXT per the
    // m2-us/iron-ore discipline (one signal family, one vote — the US leg
    // carries it; the China card displays beside china-pmi as the factory
    // gauge's leading companion).
    id: 'oecd-cli-cn',
    section: 'global',
    group: 'growth-health',
    name: 'OECD leading indicator (China)',
    source: 'oecd',
    sourceRef: 'OECD Composite leading indicator (amplitude-adjusted), China',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 75,
  },
  {
    // A-8's euro companion (DEU — the EA19 substitute, see oecd-cli-us):
    // CONTEXT beside the euro cards in the growth lane.
    id: 'oecd-cli-de',
    section: 'global',
    group: 'growth-health',
    name: 'OECD leading indicator (Germany)',
    source: 'oecd',
    sourceRef: 'OECD Composite leading indicator (amplitude-adjusted), Germany',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 75,
  },
  {
    // 2026-10-26 gap-audit build, A-9 (INSIGHTS_DATA_SPEC.md): the
    // Geopolitical Risk Index (Iacoviello), monthly. CONTEXT per the
    // spec's gauge table — the market-stress lane's shock gauge beside
    // VIX/COT, never a scored vote. The threshold regime is SD-based (the
    // spec's own): the reading carries sd10y (the rolling 10-year z-score
    // recomputed on write) and the card's lines speak the zones — above
    // +1 SD the war-scare zone, above +2 SD the 2001/2022-03/2023-10
    // class. The legacy .xls parses through the repo's own biff reader
    // (the EIA-workbook path — the spec's honest-build note expected a
    // BLOCKED outcome; the live file proved otherwise, probed live
    // 2026-10-26: 501 GPR points 1985-01 → 2026-09).
    id: 'gpr-index',
    section: 'global',
    group: 'market-stress',
    name: 'Geopolitical Risk Index',
    source: 'gpr',
    sourceRef: 'Caldara-Iacoviello Geopolitical Risk Index (monthly)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 75,
  },
  {
    // 2026-10-26 gap-audit build, A-10 (INSIGHTS_DATA_SPEC.md): Baker-
    // Bloom-Davis US Economic Policy Uncertainty, monthly headline index.
    // CONTEXT per the spec's gauge table — the confidence leg beside
    // michigan-sentiment in the growth lane. Same SD regime as A-9 (the
    // reading's sd10y + the card's zone lines: above +1 SD the elections/
    // tariff-fight episodes, above +2 SD the 2016-11/2018-12/2020-03
    // spikes). OOXML — the Pink Sheet reader path directly.
    id: 'epu-us',
    section: 'global',
    group: 'growth-health',
    name: 'US policy uncertainty (EPU)',
    source: 'epu',
    sourceRef: 'Baker-Bloom-Davis US Economic Policy Uncertainty index (monthly)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 75,
  },
  {
    // 2026-10-21 data-integrity round: the two EIA energy spots — context
    // cards in the prices lane (info rule; never prices-board tiles, the
    // board's four-tile layout is spec-fixed, and never scored votes —
    // T-09's invariant). Brent's own scored card carries the energy vote.
    id: 'wti',
    section: 'global',
    group: 'prices-heat',
    name: 'WTI crude oil',
    source: 'fred',
    sourceRef: 'FRED:DCOILWTICO (EIA WTI spot)',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 12,
  },
  {
    // Henry Hub spot: the household utility/heating-cost driver — a
    // context card; the copy carries the decade-position words.
    id: 'natgas',
    section: 'global',
    group: 'prices-heat',
    name: 'US natural gas (Henry Hub)',
    source: 'fred',
    sourceRef: 'FRED:DHHNGSP (EIA Henry Hub spot)',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 12,
  },
  {
    // M4 Wave 1 (OD-8/D-42): the 10-year breakeven — Tier 0 CONTEXT display
    // (the series is already collected for the T-01 validation
    // reconciliation; the review's §5.1 row: "the near/long expectations
    // pair with 5y5y — both legs of the anchoring story").
    id: 'breakeven-10y',
    section: 'global',
    group: 'prices-heat',
    name: 'Expected US inflation, ten years ahead',
    source: 'fred',
    sourceRef: 'FRED:T10YIE (10-year breakeven inflation rate)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
  },
  {
    // Session 3 (2026-10-31, GOLD_FRED_GAPFILL_SPEC G2): the breakeven
    // interplay — the 5y5y forward MINUS the 5y spot (T5YIFR − T5YIE, both
    // already collected on the decade group; ZERO new fetches). Positive =
    // the market prices inflation BUILDING into the second five years;
    // negative = FADING. CONTEXT beside the family's other two cards, and
    // the gold panel's inflation lane carries its phrase (GoldTailwindPanel,
    // copy-keyed both locales). The 21st GOLD VOTER since Session 6 (the
    // D-5 promotion, the owner's "we can have 21") — level-leg only, the
    // S4-B4-measured variant; still an info card for its own gauge (the
    // gauges and the gold engine are separate votes). Phase P2 like
    // breakeven-10y (its closest sibling): a derived card whose legs' own
    // alerts carry the outage signal.
    id: 'breakeven-tilt',
    section: 'global',
    group: 'prices-heat',
    name: 'Breakeven tilt (forward minus spot)',
    source: 'derived',
    sourceRef: 'FRED:T5YIFR − FRED:T5YIE (both collected; points)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 5, // the t5yie grace — the fresher leg's own family cadence
  },
  {
    // M5 Wave 2 (OD-8/D-42, 2026-10-24): the Pink Sheet Food index — the
    // world food-price gauge (2010=100). CONTEXT (info): groceries are the
    // most-felt line of household inflation; the energy-vs-food pairing
    // reads beside Brent's scored card. The series rides the SAME workbook
    // the metals already download (the Monthly Indices sheet — zero new
    // requests; verified live 2026-10-24: 124.1 @ 2026M09).
    id: 'food-index',
    section: 'global',
    group: 'prices-heat',
    name: 'World food prices',
    source: 'world-bank',
    sourceRef: 'World Bank Pink Sheet (Monthly Indices, Food; 2010=100)',
    cadence: 'monthly',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 60, // B-09: the Pink Sheet publishes month M in the first days of M+1
  },
  {
    // M5 Wave 2: the staple grains from the SAME Monthly Prices sheet
    // (columns AK + AE in the live workbook) — the grocery-shelf raw
    // materials. CONTEXT rows (info) beside the Food index.
    id: 'wheat',
    section: 'global',
    group: 'prices-heat',
    name: 'Wheat price',
    source: 'world-bank',
    sourceRef: 'World Bank Pink Sheet (Wheat, US SRW; $/metric ton)',
    cadence: 'monthly',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 60,
  },
  {
    id: 'maize',
    section: 'global',
    group: 'prices-heat',
    name: 'Maize price',
    source: 'world-bank',
    sourceRef: 'World Bank Pink Sheet (Maize; $/metric ton)',
    cadence: 'monthly',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 60,
  },
  {
    // M5 Wave 2 (OD-8/D-42): the EM-pressure first member — the canonical
    // high-inflation currency as a live case study in the inflation→
    // devaluation dynamic. CONTEXT (info) in the dollar lane; monitoring
    // breadth for the allocation reader, not a household decision. The
    // Frankfurter request gains the TRY leg (zero extra requests).
    id: 'usdtry',
    section: 'global',
    group: 'dollar-strength',
    name: 'Dollar vs Turkish lira',
    source: 'frankfurter',
    sourceRef: 'Frankfurter USD→TRY (ECB reference rates)',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
  },
  {
    // 2026-10-29 owner round ("add dollar against UAE currency"): the
    // dollar against the UAE dirham — the pegged petro-currency lens for
    // the owner's Gulf-exposure audience. CONTEXT (info) in the dollar
    // lane beside usdtry; the peg keeps the pair in a famously tight
    // band, which is exactly what makes a BREAK of the band newsworthy.
    // Frankfurter (ECB reference rates) does not serve AED, so the series
    // rides Yahoo's USD/AED daily closes (AED=X) — one extra subrequest on
    // the daily run, the same provider the Brent gap-fill already uses.
    id: 'usdaed',
    section: 'global',
    group: 'dollar-strength',
    name: 'Dollar vs UAE dirham',
    source: 'yahoo',
    sourceRef: 'Yahoo Finance USD/AED daily closes (AED=X)',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
  },
  /* ---------------- Global — Are markets nervous? ---------------- */
  {
    // M6 Wave 3 (OD-8/D-42, 2026-10-25): the Fed's balance sheet — the
    // liquidity driver of 2020–26 (QE→QT), pairs with m2-us as the money
    // side of the story. CONTEXT (info): never a stress voter — the
    // plumbing gauges (STLFSI/NFCI) carry that vote; this is the level
    // the reader watches beside them.
    id: 'walcl',
    section: 'global',
    group: 'market-stress',
    name: 'The Fed’s balance sheet',
    source: 'fred',
    sourceRef: 'FRED:WALCL (Total Assets of the Federal Reserve, weekly, $ millions)',
    cadence: 'weekly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    // The H.41 release publishes Thursday for the Wednesday as-of —
    // one missed print reads ~10d of obs age; 21 covers two.
    staleAfterDays: 21,
  },
  {
    id: 'stress-stlfsi',
    section: 'global',
    group: 'market-stress',
    name: 'St. Louis Fed Financial Stress Index',
    source: 'fred',
    sourceRef: 'FRED:STLFSI4',
    cadence: 'weekly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'above', value: 0, sustainedWeeks: 4 },
    // R10-2 (2026-10-28): the St. Louis Fed occasionally misses a weekly
    // STLFSI publication (verified live 2026-10-27: FRED's latest obs is
    // 2026-10-16 — the 2026-10-23 Thursday release never landed; the
    // 04:10 main rung's FRED bulk fetch succeeded, all 9 sibling daily
    // series in the same bulk group are fresh). The 10-day weekly default
    // (RULES.md §6) flagged 11-day-old data stale; NFCI — the Chicago Fed's
    // weekly twin in the same bulk group — already carries staleAfterDays:14
    // for exactly this reason. Pin STLFSI to the same 14-day window so one
    // missed weekly release reads fresh with its honest asOf date, and the
    // next Thursday's release re-tightens it inside the same week.
    staleAfterDays: 14,
  },
  {
    // Zero is average; above zero = tighter than average (data spec §4).
    id: 'nfci',
    section: 'global',
    group: 'market-stress',
    name: 'Chicago Fed National Financial Conditions Index',
    source: 'fred',
    sourceRef: 'FRED:NFCI',
    cadence: 'weekly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'above', value: 0 },
    staleAfterDays: 14,
  },
  {
    // Step-2 add-list §B5: the market fear gauge (Cboe VIX via FRED VIXCLS,
    // daily, licence noted on the card/About — Cboe data redistributed
    // through FRED with attribution). Scored through the engine's standard
    // percentile machinery (= the card's "10-year position"); the explicit
    // calm/nervous/fearful word thresholds are a Step-3 deliverable computed
    // from the stored history — the card says so, and invents no verdict
    // words before then.
    id: 'vix',
    section: 'global',
    group: 'market-stress',
    name: 'Market fear gauge (VIX)',
    source: 'fred',
    sourceRef: 'FRED:VIXCLS (Cboe Volatility Index, close)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.2 },
    // Step-2 card spec: daily series go stale after 4 days. VIXCLS prints
    // every US trading day (verified live 2026-10-13: latest obs Oct 9), so
    // the only >4-day gaps are multi-day US market closures.
    staleAfterDays: 4,
  },
  {
    // Step 3 L1-18 (2026-10-16): the Alternative.me crypto Fear and Greed
    // Index — CONTEXT ONLY (rule info): the spec's L3-03 forbids composite
    // sentiment scores and the card never presents the index as a signal.
    // The publisher's own description and attribution render beside the
    // data; the 0-100 scale is the publisher's (0 fear, 100 greed).
    //
    // 2026-10-21c owner round: the eth-usd context card (2026-10-21
    // data-integrity round) is RETIRED — the owner's verdict: a second
    // crypto price is not a market-stress indicator; this area keeps the
    // FNG card as its only crypto context row (the prices board carries
    // the crypto asset prices).
    id: 'crypto-fng',
    section: 'global',
    group: 'market-stress',
    name: 'Crypto Fear and Greed Index',
    source: 'alternative-me',
    sourceRef: 'alternative.me /fng/ API (daily, 0-100)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 4,
  },
  {
    // Step 3 L1-14 / FS-06 (v3, 2026-10-20): the Shiller CAPE — a published
    // long-run valuation measure, shown as the publisher's own reading
    // (context only, never a signal; L2-10's "valuation says little about
    // the next few months" rides the card copy). The source is DISABLED
    // until the owner sets owner_accepts to yes in RISK_REGISTER.md (T-30):
    // the kill-switch machinery hides these cards and the ingest never
    // requests the file until that flip.
    id: 'shiller-cape',
    section: 'global',
    group: 'market-stress',
    name: 'US share prices versus long-run earnings (Shiller CAPE)',
    source: 'shiller',
    sourceRef: 'Robert Shiller ie_data.xls (monthly, CAPE column)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 45,
  },
  {
    // Step 3 L1-14 / L2-10: the Excess CAPE Yield — the inverse of CAPE
    // minus the real 10-year Treasury yield, exactly as the publisher
    // computes it (the ie_data.xls ECY column; never recomputed by us).
    id: 'shiller-ecy',
    section: 'global',
    group: 'market-stress',
    name: 'Excess CAPE Yield (Shiller)',
    source: 'shiller',
    sourceRef: 'Robert Shiller ie_data.xls (monthly, Excess CAPE Yield column)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 45,
  },
  {
    // gap-closure S3-M3.2 (2026-11-01): the 10-year term premium (Kim-
    // Wright) — the extra yield investors demand for holding long US
    // bonds instead of rolling short ones. CONTEXT (info): never a vote;
    // the plumbing level the reader watches beside the stress gauges (the
    // spec's "how much extra investors demand to lend long"). FRED
    // THREEFYTP10, daily percent, public domain (T-16, M3.1). Rides rung4
    // (the 'fred-s3' extra source), carried forward at the 04:10 main rung.
    id: 'term-premium-10y',
    section: 'global',
    group: 'market-stress',
    name: 'US 10-year term premium',
    source: 'fred',
    sourceRef: 'FRED:THREEFYTP10 (10-Year Treasury Term Premium, Kim-Wright, daily, %)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    // LIVE-VERIFIED publication rhythm (2026-11-01, the first production
    // reading): the observations are business-daily but the Fed Board
    // uploads the Kim-Wright model with a ~1-WEEK LAG (the provider's own
    // file on 2026-11-01 ends at 2026-10-23 — 9 days of obs age at fresh
    // publication; the M3.1 fixture's tail shows the same rhythm). The
    // daily-family 4-day window false- alarmed as stale on day one. 14
    // days = the walcl two-missed-prints convention applied to a
    // weekly-lag publisher: two missed weekly uploads, then honest stale.
    staleAfterDays: 14,
  },
  {
    // gap-closure S3-M3.2: the Treasury General Account — the US
    // government's checking balance at the Fed. Drawdowns add liquidity to
    // the system; rebuilds drain it. CONTEXT (info). FRED WTREGEN, weekly
    // Wednesday $ millions, public domain (T-16, M3.1). Rides rung4.
    id: 'tga',
    section: 'global',
    group: 'market-stress',
    name: 'US Treasury General Account',
    source: 'fred',
    sourceRef: 'FRED:WTREGEN (Liabilities and Capital: Other Factors Draining Reserve Balances: Treasury, General Account: Wednesday Level, weekly, $ millions)',
    cadence: 'weekly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    // H.4.1-family Wednesday level published Thursdays — the walcl
    // precedent: one missed print reads ~10d of obs age; 21 covers two.
    staleAfterDays: 21,
  },
  {
    // gap-closure S3-M3.2: the overnight reverse repo facility — cash
    // parked AT the Fed (the floor of the plumbing: money that earns the
    // ON RRP rate instead of reaching private markets). CONTEXT (info).
    // FRED RRPONTSYD, daily $ billions, citation-required (T-16, M3.1 —
    // displayed with the FRED attribution per the licence walk). Rides
    // rung4.
    id: 'reverse-repo',
    section: 'global',
    group: 'market-stress',
    name: 'Fed overnight reverse repo (RRP)',
    source: 'fred',
    sourceRef: 'FRED:RRPONTSYD (Overnight Reverse Repurchase Agreements: Treasury Securities Sold by the Federal Reserve in the Temporary Open Market Operations, daily, $ billions)',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    // NY Fed publication is every business day; 4 covers weekends and a
    // holiday bridge (the daily family's window).
    staleAfterDays: 4,
  },
  {
    // gap-closure S3-M3.2: reserve balances — the deposits banks hold at
    // the Fed, the banking system's own liquidity buffer. CONTEXT (info).
    // FRED WRESBAL, weekly Wednesday $ millions, public domain (T-16,
    // M3.1). Rides rung4.
    id: 'bank-reserves',
    section: 'global',
    group: 'market-stress',
    name: 'US bank reserves at the Fed',
    source: 'fred',
    sourceRef: 'FRED:WRESBAL (Reserve Balances with Federal Reserve Banks: Wednesday Level, weekly, $ millions)',
    cadence: 'weekly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    // The walcl/tga H.4.1-family window: 21 days covers two missed prints.
    staleAfterDays: 21,
  },
  {
    // gap-closure S3-M3.2: the funding-pressure spread — SOFR minus the
    // interest rate on reserve balances. When overnight money trades ABOVE
    // what the Fed pays banks, the plumbing is squeezed; at or below, it is
    // calm. DERIVED (the breakeven-tilt discipline: inner join on common
    // dates, 4dp quantized, both legs must exist or the card reads
    // can't-tell). CONTEXT (info). Legs: FRED SOFR (the main rung's daily
    // group, staged for the 04:35 phase) + FRED IORB (rung4; the series
    // carries administratively ANNOUNCED future-dated rows — trimmed to
    // today before the join). Rides rung4.
    id: 'repo-stress',
    section: 'global',
    group: 'market-stress',
    name: 'Repo funding pressure (SOFR minus IORB)',
    source: 'derived',
    sourceRef: 'FRED:SOFR − FRED:IORB (derived, daily, percentage points)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 4,
  },
  {
    // gap-closure S3-M3.2: net liquidity — the Fed's balance sheet minus
    // the Treasury's General Account minus the reverse repo pile: the
    // money actually available to the private system. DERIVED (inner join
    // on the shared Wednesday dates; RRP converted $B → $M before the
    // subtraction; 4dp quantized). CONTEXT (info). Legs: FRED WALCL (the
    // main rung's mixed-frequency group, staged) + FRED WTREGEN +
    // RRPONTSYD (rung4). Rides rung4.
    id: 'net-liquidity',
    section: 'global',
    group: 'market-stress',
    name: 'US net liquidity',
    source: 'derived',
    sourceRef: 'FRED:WALCL − FRED:WTREGEN − FRED:RRPONTSYD (derived, weekly Wednesday, $ millions)',
    cadence: 'weekly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    // The walcl-family H.4.1 window: the Wednesday level publishes
    // Thursday; 21 days covers two missed prints.
    staleAfterDays: 21,
  },
  {
    // gap-closure S3-M3.3 (2026-11-01): the excess bond premium — the
    // piece of corporate bond spreads left over after the expected
    // default risk is subtracted: how much extra investors demand to
    // lend to risky companies beyond compensation for likely losses
    // (the credit-cycle gauge the market-stress gauge's story was
    // missing; the ICE BofA spreads are licence-rejected, this is the
    // licence-clean substitute). CONTEXT (info). The Fed Board's own
    // EBP file (federalreserve.gov FEDS Notes, ebp_csv.csv, the ebp
    // column) — L0 public domain (17 U.S.C. § 105, the us-tic class).
    // Rides rung4 (its own 'frb-ebp' source — different host + rhythm
    // than the FRED groups; monthly file, Saturday re-check).
    id: 'ebp',
    section: 'global',
    group: 'market-stress',
    name: 'Excess bond premium (EBP)',
    source: 'frb',
    sourceRef: 'Federal Reserve Board:EBP (FEDS Notes excess bond premium file, ebp column, monthly, percentage points)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    // The file's own rhythm (M3.1, read live 2026-11-01): monthly rows,
    // latest observation 2026-09-01 — the Fed Board uploads the model
    // with a 1–2 month lag. 75 days = the us-cpi-yoy monthly convention:
    // one full publication cycle plus grace, then honest stale.
    staleAfterDays: 75,
  },
  {
    // gap-closure S3-M3.3: the OFR Financial Stress Index — the Treasury's
    // own daily composite of credit, funding, volatility, safe-asset and
    // equity-valuation stress (10 documented columns; the card reads the
    // AGGREGATE, the layer-1 copy explains the components in words).
    // CONTEXT (info) — the stress-stlfsi/nfci family. L0 public domain
    // (17 U.S.C. § 105 — the OFR is a Treasury bureau; the file was
    // DISCOVERED in M3.1: financial-stress-index/data/fsi.csv). Rides
    // rung4 (its own 'ofr-fsi' source, daily gate).
    id: 'ofr-fsi',
    section: 'global',
    group: 'market-stress',
    name: 'OFR Financial Stress Index',
    source: 'ofr',
    sourceRef: 'Office of Financial Research:OFR-FSI (OFR FSI file, aggregate column, daily, index sd)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    // The file's own rhythm (M3.1, read live 2026-11-01 on a Sunday):
    // daily rows, latest observation 2026-10-28 — business-day
    // publication with a 1–2 day lag. 7 days = the ecb-dfr daily
    // convention: covers a long weekend plus missed publication days,
    // then honest stale.
    staleAfterDays: 7,
  },
  {
    // gap-closure S3-M3.4 (2026-11-01): the Senior Loan Officer Survey —
    // the net share of US banks TIGHTENING lending standards for
    // businesses, the credit-conditions read the market-stress gauge's
    // story was missing beside EBP. CONTEXT (info): a quarterly survey,
    // zero = standards basically unchanged. FRED DRTSCILM (SLOOS, large
    // + middle-market firms), quarterly net %, public domain (T-16,
    // verified live from the series page 2026-11-01). Rides rung4.
    id: 'sloos-ci-tightening',
    section: 'global',
    group: 'market-stress',
    name: 'Banks tightening business lending (SLOOS)',
    source: 'fred',
    sourceRef: 'FRED:DRTSCILM (Net Percentage of Domestic Banks Tightening C&I Standards, SLOOS, quarterly)',
    cadence: 'quarterly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    // The SLOOS cadence (verified from the FRED series' own tail
    // 2026-11-01): quarterly first-month stamps (Jan/Apr/Jul/Oct), each
    // survey publishing in the first week of the survey quarter's THIRD
    // month (the July stamp lands ~Sep 3; the October stamp ~Dec 3) — the
    // newest stamp serves up to ~157d. 215 = the us-gdp-growth quarterly
    // convention with margin.
    staleAfterDays: 215,
  },
  {
    id: 'gold-silver',
    section: 'global',
    group: 'market-stress',
    name: 'Gold / Silver',
    source: 'derived',
    sourceRef: 'gold-api.com XAU ÷ XAG (history: World Bank gold ÷ silver)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.2 },
    staleAfterDays: 2,
  },
  /* ---------------- Global — Is the dollar strong? ---------------- */
  {
    // The Currena dollar basket — DXY-style weighted geometric mean of six
    // ECB reference currencies against USD (see src/basket.ts). Values are
    // close to the published DXY but NOT the official DXY; the page always
    // calls it "Currena dollar basket".
    //
    // Fix spec B-03 (2026-10-14): the SPEED RULE joins the level rule — a
    // 30-day move at or above the world-currencies alarm threshold (the
    // dollar basket moving 3% against six majors, R3_DOLLAR_M1_STRONG in
    // the fx module) counts as needs-attention on the main page too, so the
    // dollar card, the hero and the currencies section read the same number
    // the same way (unrounded values, >= comparison). The fx alarm speaks
    // in percent of the basket; the card's change30d is in points on a
    // ~100 index, so the rule measures the PERCENT move over its own
    // window (mode 'pct', 4 weeks ≈ the 30-day window).
    id: 'dollar-basket',
    section: 'global',
    group: 'dollar-strength',
    name: 'Currena dollar basket',
    source: 'derived',
    sourceRef: 'Frankfurter six-currency basket (DXY weights, 50.14348112 base)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: {
      kind: 'any-of',
      of: [
        { kind: 'percentile', tail: 'high', cutoff: 0.1 },
        { kind: 'change', mode: 'pct', direction: 'rise', magnitude: 3, windowWeeks: 4 },
      ],
    },
    staleAfterDays: 4,
  },
  {
    // 2026-10-26 gap-audit build, A-3 (INSIGHTS_DATA_SPEC.md): the
    // US−Japan 10-year yield gap — DGS10 − the MOF's daily 10Y. The
    // carry trade's fuel line: unwinds historically accelerate as the gap
    // compresses toward the funding-cost line (the Aug-2024 pattern).
    // Derived at the 04:20 rung-2 phase after both parents land (the
    // main rung carries it); fails closed on missing parents (the
    // au-us-10y-gap discipline — never a stale gap).
    id: 'us-japan-10y-gap',
    section: 'global',
    group: 'dollar-strength',
    name: 'US−Japan 10Y yield gap',
    source: 'derived',
    sourceRef: 'FRED:DGS10 − MOF jgbcme 10Y (daily)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: {
      kind: 'any-of',
      of: [
        // Needs attention: below 2.00 (carry unwinds accelerate; the
        // trade's risk-reward inverts). Unusual: below 1.50 (the historic
        // JPY-short squeeze zone — strictly inside below-2.00 for the
        // vote) or above 4.00 (blow-off-top extremes).
        { kind: 'threshold', direction: 'below', value: 2 },
        { kind: 'threshold', direction: 'above', value: 4 },
      ],
    },
    staleAfterDays: 5,
  },
  {
    id: 'usdjpy',
    section: 'global',
    group: 'dollar-strength',
    name: 'USD/JPY',
    source: 'frankfurter',
    sourceRef: 'Frankfurter USD→JPY',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'change', mode: 'pct', direction: 'fall', magnitude: 5, windowWeeks: 4 },
  },
  {
    id: 'eur-usd',
    section: 'global',
    group: 'dollar-strength',
    name: 'EUR/USD',
    source: 'frankfurter',
    sourceRef: 'Frankfurter USD→EUR',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 4,
  },
  /* ---------------- Global — Is growth healthy? ---------------- */
  {
    // M7 (2026-10-26): the manual hand-entry era ends — the NBS English
    // press-release automation owns the card (adapters/nbs.ts; the M6
    // probe + this session's ToS read made the fetch licence-evidenced:
    // "Welcome to reprint or quote… You are allowed to download and use
    // the statistical data on this website"). The committed file stays
    // as the seed history (data/manual/china-pmi.json, all 10
    // observations verified identical against the NBS's own Table 1
    // this session); the fetched 13-month table wins on collisions and
    // the monthly cadence's 45-day grace replaces the E-08 manual
    // expiry (the Sep obs publishes on the 1st of Oct → max age ~33d).
    id: 'china-pmi',
    section: 'global',
    group: 'growth-health',
    name: 'China manufacturing PMI',
    source: 'nbs',
    sourceRef: 'NBS English press release (Purchasing Managers Index, Table 1; seed data/manual/china-pmi.json)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'threshold', direction: 'below', value: 50 },
  },
  {
    // M7 (2026-10-26): the China consumer-prices leg — the review's
    // growth-health "China leg" beside the factory PMI (China's
    // inflation matters to the AU trade story and global demand).
    // SCORED against China's own published "around 3%" annual target —
    // the same posture as us-cpi-yoy's 3% and euro-hicp's 2%: the
    // government's own goal line is the threshold, never an invented
    // one. The deflation nuance (Sep 2025 read −0.3) lives in the card
    // copy + trend, not in an unofficial below-zero rule.
    id: 'china-cpi',
    section: 'global',
    group: 'growth-health',
    name: 'China inflation (yearly)',
    source: 'nbs',
    sourceRef: 'NBS English press release (Consumer Price Index, YoY; seed data/manual/china-cpi.json)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'above', value: 3 },
    // The month-end obs publishes ~T+10 (verified: Sep-2026 CPI out
    // 2026-10-15) → the obs ages ~41 days between releases — the monthly
    // cadence's 45-day grace covers it without a false stale.
  },
  {
    id: 'm2-us',
    section: 'global',
    group: 'growth-health',
    name: 'US M2 money supply',
    source: 'fred',
    sourceRef: 'FRED:M2SL',
    cadence: 'monthly',
    changeKind: 'pct',
    phase: 'P2',
    // OD-7 demotion (2026-10-23, D-42): scored → context — "keep the
    // series, lose the vote" (the monetarist framing was overweighted as
    // a scored gauge member of a framework the product doesn't otherwise
    // run; the growth-health gauge drops to 5 voters, the iron-ore
    // precedent). The card keeps its year-on-year percentile context.
    rule: { kind: 'info' },
    // Step-1 audit item C10: M2 trends upward — the 10-year position is
    // measured on the year-on-year GROWTH, not the level, so it is not
    // permanently pinned near 100% just for existing.
    percentileBasis: 'yoy',
    // B-09: FRED's H.6 release publishes month M in the LAST week of M+1 —
    // the obs (month-start dated) legitimately ages ~90 days between
    // releases (verified live 2026-10-14: obs 2026-08-01 is the freshest
    // print that exists).
    staleAfterDays: 90,
  },
  {
    // Fix spec C-05 (2026-10-14): one free US activity survey — the
    // Philadelphia Fed manufacturing index (FRED GACDFSA066MSFRBPHI, monthly
    // SA diffusion index, series confirmed live on FRED 2026-10-14:
    // Sep 2026 = 37.8). Below zero reads as contraction — the scored rule.
    id: 'philly-fed',
    section: 'global',
    group: 'growth-health',
    name: 'Philadelphia Fed manufacturing index',
    source: 'fred',
    sourceRef: 'FRED:GACDFSA066MSFRBPHI (Philadelphia Fed manufacturing index, SA)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'threshold', direction: 'below', value: 0 },
    // Monthly obs (M-01) ages ~46 days between releases (published ~3rd
    // week of M+1) — 60 keeps the cadence honest.
    staleAfterDays: 60,
  },
  {
    // gap-closure S3-M3.4 (2026-11-01): the Empire State manufacturing
    // survey — the New York Fed's free monthly manufacturing diffusion
    // index (the headline "current general business conditions" reading).
    // CONTEXT (info): the philly-fed twin beside it in the lane; below zero
    // reads as contraction exactly like its sibling. FRED
    // GACDISA066MSFRBNY, monthly diffusion index, citation-required (T-16,
    // verified live from the series page 2026-11-01 — displayed with the
    // FRED attribution per the licence walk). Rides rung4.
    id: 'empire-state',
    section: 'global',
    group: 'growth-health',
    name: 'Empire State manufacturing survey',
    source: 'fred',
    sourceRef: 'FRED:GACDISA066MSFRBNY (Current General Business Conditions: Diffusion Index for New York, SA, monthly)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    // The philly-fed convention: the survey publishes mid-month for the
    // same month (obs M-01 ages ~46d between releases) — 60 keeps the
    // cadence honest.
    staleAfterDays: 60,
  },
  {
    // M4 Wave 1 (OD-8/D-42, 2026-10-24): the weekly early-warning layer —
    // the highest-frequency labor read on the page (Thursday print, weeks
    // before the monthly data, months before Sahm). SCORED on its 10-year
    // position like its sibling us-unemployment (top quintile of the
    // decade = clearly abnormal labor shedding); the level's slow drift is
    // what the percentile window absorbs, and the sustained-jumps story is
    // the copy's job, not a second rule.
    id: 'initial-jobless-claims',
    section: 'global',
    group: 'growth-health',
    name: 'New unemployment claims (US)',
    source: 'fred',
    sourceRef: 'FRED:ICSA (initial claims, weekly)',
    cadence: 'weekly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.2 },
    // Weekly Saturday-dated obs publish the following Thursday — one missed
    // week is 10+ days of obs age; 12 keeps a single missed print from
    // reading stale the same day the next one lands.
    staleAfterDays: 12,
  },
  {
    // gap-closure S3-M3.4 (2026-11-01): continuing claims — the number of
    // people ALREADY receiving unemployment insurance, the stock beside
    // initial-jobless-claims' flow. CONTEXT (info): the sibling voter
    // carries the weekly labour signal; this adds the persistence read.
    // FRED CCSA, weekly Saturday, public domain (T-16, verified live from
    // the series page 2026-11-01). Rides rung4.
    id: 'continuing-claims',
    section: 'global',
    group: 'growth-health',
    name: 'Americans on unemployment benefits',
    source: 'fred',
    sourceRef: 'FRED:CCSA (Continued Claims, Insured Unemployment, weekly Saturday, persons)',
    cadence: 'weekly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    // The DOL print carries a built-in ~12-day lag (the Thursday release
    // covers the initial week ending the prior Saturday AND the continuing
    // week ending one week earlier — verified live: the freshest print
    // 2026-11-01 carries the 2026-10-17 Saturday stamp). Fresh reads 12–19d
    // of obs age, so 28 = the initial-jobless-claims convention (one missed
    // print plus grace) adjusted for the one-week-longer publication lag.
    staleAfterDays: 28,
  },
  {
    // Step-2 add-list §B3: US unemployment (FRED UNRATE, monthly, verified
    // live 2026-10-13: Sep 2026 = 4.2). Scored on its own 10-year level
    // ("high unemployment for the decade") — the "rising fast" signal is
    // the Sahm rule card's job next to it, so the two never duplicate.
    id: 'us-unemployment',
    section: 'global',
    group: 'growth-health',
    name: 'US unemployment rate',
    source: 'fred',
    sourceRef: 'FRED:UNRATE (US Bureau of Labor Statistics)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.2 },
    staleAfterDays: 75, // monthly BLS obs (M-01) ages up to ~73d between releases
  },
  {
    // Step-2 add-list §B4: the Sahm recession alarm (FRED SAHMREALTIME,
    // monthly, verified live 2026-10-13: Sep 2026 = 0.00). The standard
    // signal is 0.50 or more — the rule the card explains in one line.
    id: 'sahm-rule',
    section: 'global',
    group: 'growth-health',
    name: 'US recession alarm (Sahm rule)',
    source: 'fred',
    sourceRef: 'FRED:SAHMREALTIME (real-time vintage)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'above', value: 0.5 },
    staleAfterDays: 75,
  },
  {
    // M4 Wave 1 (OD-8/D-42, 2026-10-24): the single-number recession
    // probability (Marcelle-Chauvet smoothed probabilities) — completes the
    // Sahm/curve detection toolkit with a model output, beside sahm-rule.
    // SCORED at the half-way line (0.50 — the classic recession-call
    // threshold, mirroring the Sahm rule's own 0.50); stored as the
    // published fraction (0.62), displayed scaled ×100 ("62%").
    id: 'recession-probability',
    section: 'global',
    group: 'growth-health',
    name: 'US recession probability',
    source: 'fred',
    sourceRef: 'FRED:RECPROUSM156N (smoothed US recession probability)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'above', value: 0.5 },
    // The model block publishes with a ~2-month lag (obs M-01 serves until
    // the next obs lands ~M+55d) — 100 covers the longest honest gap
    // (verified live 2026-10-24: the 2026-08 obs 0.62 is the freshest print).
    staleAfterDays: 100,
  },
  {
    // M4 Wave 1 (OD-8/D-42): US consumer mood (University of Michigan
    // sentiment). SCORED on its 10-year position, low tail — bottom-quintile
    // readings have marked recession-era collapses in household mood. The
    // card carries the survey's 1y inflation-expectations companion
    // (michigan-1y-expectations) inside it, the us-cpi-core-yoy pattern.
    id: 'michigan-sentiment',
    section: 'global',
    group: 'growth-health',
    name: 'US consumer mood (Michigan survey)',
    source: 'fred',
    sourceRef: 'FRED:UMCSENT (University of Michigan consumer sentiment)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'percentile', tail: 'low', cutoff: 0.2 },
    staleAfterDays: 75, // monthly survey obs (M-01) ages up to ~73d between releases
  },
  {
    // M4 Wave 1 (OD-8/D-42): COMPANION-ONLY — the Michigan survey's median
    // expected price change over the next 12 months, rendered INSIDE the
    // michigan-sentiment card (COMPANION_ONLY_IDS + COMPANIONS), never as
    // its own row. Context (info): expectations feed the Fed's read on
    // where inflation psychology sits; the vote belongs to the parent card.
    id: 'michigan-1y-expectations',
    section: 'global',
    group: 'growth-health',
    name: 'US expected inflation next year (Michigan)',
    source: 'fred',
    sourceRef: 'FRED:MICH (median expected price change, next 12 months)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 75,
  },
  {
    // M6 Wave 3 (OD-8/D-42, 2026-10-25): the consumption pulse (~68% of US
    // GDP) — the real-economy link the transmission chain was missing
    // (policy → rates → BORROWING → SPENDING). CONTEXT (info): the growth
    // vote stays with the labor/leading family.
    id: 'retail-sales',
    section: 'global',
    group: 'growth-health',
    name: 'US retail sales (monthly)',
    source: 'fred',
    sourceRef: 'FRED:RSAFS (Advance Retail Sales: Retail Trade, monthly, $ millions)',
    cadence: 'monthly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 75,
  },
  {
    // M6 Wave 3 (OD-8/D-42, 2026-10-25): building permits — the classic
    // long-leading, most rate-sensitive sector; completes the
    // rates→housing narrative beside mortgage-30y (the two ends of the
    // same pipe). CONTEXT (info).
    id: 'housing-permits',
    section: 'global',
    group: 'growth-health',
    name: 'US building permits',
    source: 'fred',
    sourceRef: 'FRED:PERMIT (New Private Housing Units Authorized by Building Permits, monthly, thousands, seasonally adjusted annual rate)',
    cadence: 'monthly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 75,
  },
  {
    // M6 Wave 3 (OD-8/D-42, 2026-10-25): the Chicago Fed's composite
    // activity gauge — 85 monthly indicators in one weighted index (zero =
    // trend growth); the free ISM substitute the review called for (the
    // ISM paywall hold stands). CONTEXT (info): an index in points.
    id: 'cfnai',
    section: 'global',
    group: 'growth-health',
    name: 'US economic activity scorecard (Chicago Fed)',
    source: 'fred',
    sourceRef: 'FRED:CFNAI (Chicago Fed National Activity Index, monthly)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    // CFNAI publishes month M's index ~4 weeks into M+1 — just before a
    // release the freshest obs is ~85-90d old (venue-verified 2026-10-25:
    // the Aug obs at 84d while Sept publishes ~Oct 28). 95 keeps the
    // rhythm honest.
    staleAfterDays: 95,
  },
  {
    // M6 Wave 3 (OD-8/D-42, 2026-10-25): JOLTS job openings — openings roll
    // over before unemployment rises (the Powell-era dashboard's leading
    // edge, the ratio the Fed watched in 2021-22). CONTEXT (info).
    id: 'job-openings',
    section: 'global',
    group: 'growth-health',
    name: 'US job openings (JOLTS)',
    source: 'fred',
    sourceRef: 'FRED:JTSJOL (Job Openings: Total Nonfarm, monthly, thousands)',
    cadence: 'monthly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    // JOLTS publishes mid-month for the month TWO PRIOR — the freshest
    // obs is ~6-7 weeks old on release day and ages to ~105d just before
    // the next print. 110 keeps the cadence honest (the ABS-215
    // publication-cycle discipline, scaled to the JOLTS rhythm).
    staleAfterDays: 110,
  },
  {
    id: 'copper-gold',
    section: 'global',
    group: 'growth-health',
    name: 'Copper / Gold',
    source: 'derived',
    sourceRef: 'World Bank copper ÷ gold',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'percentile', tail: 'low', cutoff: 0.2 },
    // B-09: the Pink Sheet publishes month M in the first days of M+1 — the
    // month-start-dated obs legitimately ages ~40 days between releases.
    staleAfterDays: 60,
  },
  {
    id: 'usdcny',
    section: 'global',
    group: 'growth-health',
    name: 'USD/CNY',
    source: 'frankfurter',
    sourceRef: 'Frankfurter USD→CNY',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
  },
  {
    // 2026-10-21 data-integrity round: growth coverage — the quarterly real
    // GDP growth rate (QoQ annualized percent) and the monthly nonfarm-
    // payrolls CHANGE (the NFP print; thousands of jobs). Context cards
    // (info rules): the unemployment + Sahm voters already carry the
    // labour-market vote; these add the headline numbers.
    id: 'us-gdp-growth',
    section: 'global',
    group: 'growth-health',
    name: 'US economic growth (real GDP)',
    source: 'fred',
    sourceRef: 'FRED:A191RL1Q225SBEA (real GDP growth, QoQ annualized)',
    cadence: 'quarterly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    // The advance estimate lands ~30d after quarter end and stays latest
    // until the next advance — the SAME BEA release cycle as
    // govt-interest-revenue's 215d (verified live: obs 2026-04-01 is the
    // freshest print that exists through late October).
    staleAfterDays: 215,
  },
  {
    // gap-closure S3-M3.4 (2026-11-01): the Atlanta Fed's GDPNow — the
    // real-time nowcast of the CURRENT quarter's real GDP growth (annualised
    // rate), updated several times a month as data lands. CONTEXT (info):
    // never a vote; the us-gdp-growth card carries the official print beside
    // it. FRED GDPNOW, % SAAR, quarterly first-day stamps (the stamp IS the
    // quarter it refers to — verified against the Atlanta Fed's own page
    // 2026-11-01: "3.2% Fourth-Quarter GDPNow Estimate for 2026:Q4, updated
    // October 29, 2026"; FRED revises the quarter's row in place as nowcasts
    // update). Rides rung4 (the 'fred-s3' macro group).
    id: 'gdpnow',
    section: 'global',
    group: 'growth-health',
    name: 'US growth nowcast (GDPNow)',
    source: 'fred',
    sourceRef: 'FRED:GDPNOW (Atlanta Fed GDPNow, real GDP growth, QoQ annualized, quarterly stamps)',
    cadence: 'quarterly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    // The stamp only advances quarterly (quarter first-day) while the VALUE
    // revises in place several times a month; the next quarter's initial
    // nowcast lands within days of the advance GDP release (~30d after
    // quarter end) — the newest stamp ages up to ~120d between quarters
    // (the Atlanta page's own cadence, verified 2026-11-01). 150 = one full
    // quarter-boundary cycle plus grace, then honest stale.
    staleAfterDays: 150,
  },
  {
    id: 'us-nfp',
    section: 'global',
    group: 'growth-health',
    name: 'US jobs added each month',
    source: 'derived',
    sourceRef: 'FRED:PAYEMS (monthly change, thousands)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    // BLS reference-week dating: the Sep print (dated Sep-01) publishes
    // early Oct and is replaced ~Nov-06 — ages up to ~66d. 70 covers it.
    staleAfterDays: 70,
  },
  {
    // 2026-10-21 data-integrity round: platinum — the precious/industrial
    // metal from the SAME Pink Sheet workbook the other metals ride
    // (monthly, zero extra requests). Context card beside copper in the
    // growth lane (info rule — the copper/gold voter carries the metals
    // signal).
    // M6 Wave 3 (OD-8/D-42, 2026-10-25) — the CADENCE FIX: platinum goes
    // DAILY on gold-api XPT (verified live 2026-10-25: $1,558), the exact
    // gold-usd pattern — the Pink Sheet monthly history stays as the
    // percentile base, the live XPT spot rides the day's point, and the
    // card moves beside the other metals in the PRICES LANE — the
    // wti/natgas precedent (the four-tile Prices board itself is
    // spec-fixed: PRICE_ROWS gold/silver/oil/bitcoin, so non-tile metals
    // render as the prices lane's context rows, exactly where wti/natgas
    // and copper render; gold-api row, one new subrequest, the SEED_ID
    // appends ride the 04:25 phase).
    id: 'platinum',
    section: 'global',
    group: 'prices-heat',
    name: 'Platinum price (ounce)',
    source: 'gold-api',
    sourceRef: 'gold-api.com XPT spot (history: World Bank Pink Sheet platinum, monthly + daily accumulation)',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 2,
  },
  /* ------------- Global — Prices board (not a gauge) ------------- */
  {
    // EIA publishes daily Brent in weekly batches — 12-day freshness limit
    // (data spec §3) replaces the false-alarm 3-day daily grace. The series
    // now carries a Yahoo BZ=F gap-fill past FRED's last published date
    // (2026-10-12 stale-oil fix — see derived.ts fillBrentGap) and the SERVED
    // value is refreshed hourly from the live-prices key (prices/merge.ts),
    // so a lagging EIA batch can never freeze the board's oil price again.
    id: 'brent',
    section: 'global',
    group: 'prices-board',
    name: 'Brent oil',
    source: 'fred',
    sourceRef: 'FRED:DCOILBRENTEU + Yahoo Finance BZ=F (gap-fill + live refresh)',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'change', mode: 'pct', direction: 'rise', magnitude: 25, windowWeeks: 13 },
    staleAfterDays: 12,
  },
  {
    // Ounce price rows (owner request 2026-10-07) on the Prices board.
    // gold-api XAU is the primary source (TGJU retired — unverified licence);
    // history = World Bank monthly + accumulated daily live points.
    id: 'gold-usd',
    section: 'global',
    group: 'prices-board',
    name: 'Gold price (ounce)',
    source: 'gold-api',
    sourceRef: 'gold-api.com XAU spot (history: World Bank Pink Sheet gold, monthly + daily accumulation)',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 2,
  },
  {
    id: 'silver-usd',
    section: 'global',
    group: 'prices-board',
    name: 'Silver price (ounce)',
    source: 'gold-api',
    sourceRef: 'gold-api.com XAG spot (history: World Bank Pink Sheet silver, monthly + daily accumulation)',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 2,
  },
  {
    // Live face value from gold-api HG (USD per pound) converted to per
    // metric tonne (× 2204.62262) so the series joins the World Bank monthly
    // history (USD/mt) for the 10-year position (data spec §3 note).
    // Round-2 R10: copper left the prices strip for the indicator lanes —
    // it rides the growth-health group next to copper-gold (its economic
    // story: Chinese factories + industrial demand). Info rule: never votes.
    id: 'copper-usd',
    section: 'global',
    group: 'growth-health',
    name: 'Copper price',
    source: 'gold-api',
    sourceRef: 'gold-api.com HG spot × 2204.62262 (history: World Bank Pink Sheet copper, monthly)',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 2,
  },
  {
    // No 10-year position (gold-api offers no multi-year history — data
    // spec §3); 7/30-day changes come from accumulated daily snapshots.
    id: 'btc-usd',
    section: 'global',
    group: 'prices-board',
    name: 'Bitcoin price',
    source: 'gold-api',
    sourceRef: 'gold-api.com BTC spot (history: accumulated daily snapshots)',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    staleAfterDays: 2,
  },
  {
    // Defect E-12 (2026-10-16): the stored value is BITCOIN PER OUNCE
    // (XAU ÷ BTC ≈ 0.0509) — the old title 'Gold / Bitcoin' read as the
    // inverse (gold per bitcoin, ≈ 19.6 oz). The title now names the value
    // exactly as stored.
    id: 'gold-btc',
    section: 'global',
    group: 'prices-board',
    name: 'Bitcoin priced in gold (BTC per ounce)',
    source: 'derived',
    sourceRef: 'gold-api.com XAU ÷ BTC (bitcoin per troy ounce)',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
  },
  /* -------- Australia — Are inflation and rates a problem? -------- */
  {
    // Step-1 audit item A2: switched from the retired quarterly key to the
    // ABS monthly CPI (all groups) — the full monthly measure the ABS now
    // publishes. asOf is the data month (M-01); the card also carries the
    // official release date from data/insights-release-schedule.json.
    id: 'au-cpi',
    section: 'australia',
    group: 'au-inflation-rates',
    name: 'Australian CPI (annual change)',
    source: 'abs',
    sourceRef: 'ABS monthly CPI All groups index (annual change derived)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'above', value: 3 },
    // Monthly obs (M-01) ages up to ~62d between releases (released ~4w
    // after month end) — 95 matches the monthly cadence grace.
    staleAfterDays: 95,
  },
  {
    id: 'au-trimmed-mean',
    section: 'australia',
    group: 'au-inflation-rates',
    name: 'Australian trimmed-mean inflation',
    source: 'abs',
    sourceRef: 'ABS monthly CPI Trimmed Mean index (annual change derived)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'above', value: 3 },
    staleAfterDays: 95, // same monthly cadence as au-cpi
  },
  {
    // Step-2 add-list §B2: the Australian 10-year government bond yield —
    // RBA statistical table F2, series FCMYGBAG10D ("Australian Government
    // 10 year bond", daily, venue-verified 2026-10-13: published 09-Oct,
    // the same series the au-us-10y-gap card already subtracts DGS10 from).
    // Scored on its 10-year position (a rate, like us10y); the US 10-year
    // rides along as the card's comparison companion (the same companion
    // pattern as core CPI on the US inflation card).
    id: 'au-10y',
    section: 'australia',
    group: 'au-inflation-rates',
    name: 'Australian 10-year government bond yield',
    source: 'rba',
    sourceRef: 'RBA F2 FCMYGBAG10D (daily) / F2.1 FCMYGBAG10 (monthly fallback)',
    // Defect E-06 (2026-10-16): a DAILY series — the F2 table publishes
    // each business day (with a 2–4 business-day publication lag, the
    // Phase-I2 venue finding), so the max age is the daily default of 4
    // days and an older row wears the stale tag instead of reading fresh.
    // F3 (2026-10-21 venue round): while the Akamai edge 403s the daily
    // f2-data.csv path from Cloudflare egress, the series rides the F2.1
    // MONTHLY table (published the 2nd of each month) — the max age
    // widens to 40 days so a live monthly print reads fresh with its own
    // honest asOf date, and the source row explains the granularity.
    // When the daily path returns, the 4-day discipline re-tightens.
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.1 },
    staleAfterDays: 40,
  },
  {
    // Fix spec C-06 (2026-10-14): "What markets expect from the RBA" — the
    // Australian 3-year government bond yield (RBA F2 FCMYGBAG3D, series ID
    // confirmed from the F2 CSV's own Series ID row) minus the cash rate.
    // When the 3-year yield sits above the cash rate, markets price higher
    // future policy; below it, cuts. Scored through the percentile
    // machinery — the explicit words are a Step-3 deliverable.
    id: 'rba-expectations',
    section: 'australia',
    group: 'au-inflation-rates',
    name: 'What markets expect from the RBA (3-year gap)',
    source: 'derived',
    sourceRef: 'RBA F2 FCMYGBAG3D (3-year bond) − RBA F1 cash rate target',
    // Defect E-06 (2026-10-16): the 3-year leg is the same daily F2 table —
    // daily cadence, 4-day max age (the lag is publication-side, not cadence).
    // F3 (2026-10-21 venue round): the monthly-F2.1 fallback widens the
    // effective age the same way as au-10y (40 days) while the daily path
    // stays Akamai-blocked.
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.1 },
    staleAfterDays: 40,
  },
  {
    id: 'au-us-10y-gap',
    section: 'australia',
    group: 'au-inflation-rates',
    name: 'Australia vs US 10-year yield gap',
    source: 'derived',
    sourceRef: 'RBA F2 10y − FRED:DGS10',
    // Defect E-06 (2026-10-16): the Australian leg is the daily F2 table —
    // daily cadence, 4-day max age. The same-date join (B-10/gapLegs) stays.
    // F3 (2026-10-21 venue round): the monthly-F2.1 fallback widens the
    // effective age the same way as au-10y (40 days) while the daily path
    // stays Akamai-blocked.
    // S1-M1.5 (2026-10-31): the gap-leg date GUARD — the legs carry their
    // own dates (gapLegs), any inequality is marked (datesDiffer, T-20), and
    // a divergence beyond GAP_LEG_MAX_DIVERGENCE_DAYS (7) stops the vote
    // (status 'stale'): the monthly AU leg must never silently colour a
    // verdict against the marching daily US leg.
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'below', value: 0 },
    staleAfterDays: 40,
  },
  {
    // An index, not a pump price (data spec §3 note) — context item.
    id: 'au-petrol-yoy',
    section: 'australia',
    group: 'au-inflation-rates',
    name: 'Petrol prices vs a year ago',
    source: 'abs',
    sourceRef: 'ABS CPI Automotive fuel index (12-month % change)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    // Spec said 70 (release-date aging); ABS monthly obs (M-01) ages ~87d
    // between releases — 95 matches the cadence grace.
    staleAfterDays: 95,
  },
  /* -------- Australia — Are households under pressure? -------- */
  {
    // Step-1 audit item A4 + Step-2 add-list §B1: the RBA's official policy
    // rate (F1 daily Cash Rate Target — a decision-day move shows at once).
    // CONTEXT ONLY (the policy rate itself; verdict logic arrives in Step 3)
    // and placed in au-households NEXT TO the home-loan card so the two
    // always render from the same snapshot — the card also states the last
    // change (date + size, `lastChange`) and the next RBA decision date
    // (from the calendar, kind 'rba').
    id: 'rba-cash-rate',
    section: 'australia',
    group: 'au-households',
    name: 'RBA cash rate',
    source: 'rba',
    sourceRef: 'RBA statistical table F1 (Cash Rate Target, daily)',
    cadence: 'per-change',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
  },
  {
    // I15, 2026-10-08 data spec §3: what borrowers actually pay — F6 series
    // ID FLRHOOTA (outstanding, owner-occupier, all loans, all institutions),
    // matched by Series ID because RBA rewords column titles over time.
    id: 'au-home-loan',
    section: 'australia',
    group: 'au-households',
    name: 'Home-loan rate people actually pay',
    source: 'rba',
    sourceRef: 'RBA F6 FLRHOOTA (owner-occupier outstanding, all institutions)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.1 },
    staleAfterDays: 70, // RBA F6 dates obs at month END — the spec number works as-is
  },
  {
    // Step-2 add-list §B7 — finishes the Step-1 C8 item: a REAL savings
    // rate, not the inflation number under a savings icon. RBA F4.1 "Paid
    // Deposit Rates", series PDRNTH — the weighted-average rate banks
    // actually pay on NEW household term deposits (the rate a saver
    // shopping today can get; venue-verified 2026-10-13, table published
    // 08-Oct-2026). The series starts Jul-2019 (the table's full extent —
    // the 10-year history the Step-2 spec asks for "if the source allows"
    // does not exist; the card says so honestly). CONTEXT ONLY: it feeds
    // the money panel's savings row, which leads with this number, its data
    // month and the piggy-bank artwork.
    id: 'au-deposit-rate',
    section: 'australia',
    group: 'au-households',
    name: 'Savings rates (new term deposits)',
    source: 'rba',
    sourceRef: 'RBA F4.1 PDRNTH (paid rate, new household term deposits)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 70, // RBA F4.1 dates obs at month END, same as F6
  },
  {
    // Below-aux rule: wage growth below yearly CPI ("pay is not keeping up
    // with prices") — the runner supplies the au-cpi yoy series as aux.
    id: 'au-wage-growth',
    section: 'australia',
    group: 'au-households',
    name: 'Wage growth (yearly)',
    source: 'abs',
    sourceRef: 'ABS WPI total hourly rates excluding bonuses (12-month % change)',
    cadence: 'quarterly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'below-aux' },
    // Spec said 130 (release-date aging); ABS WPI obs (Q-01) ages up to
    // ~197d between quarterly releases — 200 keeps it honest.
    // M6 calibration fix (2026-10-25): ABS WPI: the Q2 obs (Apr 1) meets the Q3 release ~Nov 11 = 224d — 200 false-staled it on 2026-10-17 (the live stale card this fixes).
    staleAfterDays: 230,
  },
  {
    id: 'au-rent-yoy',
    section: 'australia',
    group: 'au-households',
    name: 'Rent inflation (yearly)',
    source: 'abs',
    sourceRef: 'ABS CPI Rents index, monthly (12-month % change)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.1 },
    // Spec said 70 (release-date aging); ABS monthly obs (M-01) ages ~87d
    // between releases — 95 matches the cadence grace.
    staleAfterDays: 95,
  },
  {
    id: 'au-unemployment',
    section: 'australia',
    group: 'au-households',
    name: 'Australian unemployment rate',
    source: 'abs',
    sourceRef: 'ABS Labour Force M13 (persons, SA, Australia)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'above-low', rise: 0.5 },
    // B-09: the ABS publishes month M's Labour Force ~2 weeks into M+1
    // (obs month-start dated) — ages ~46 days between releases.
    staleAfterDays: 60,
  },
  {
    id: 'au-home-values',
    section: 'australia',
    group: 'au-households',
    name: 'Australian residential property price index',
    source: 'abs',
    sourceRef: 'ABS RES_DWELL_ST residential dwelling price index',
    cadence: 'quarterly',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'consecutive-decline', periods: 3 },
    // Step-1 audit item C10: home values trend upward — the 10-year
    // position is measured on year-on-year growth, not the index level.
    percentileBasis: 'yoy',
    // M6 calibration fix (2026-10-25): ABS RPPI: obs quarter-start to next release ~6 weeks after quarter end = ~219d — 215 left a false-stale week.
    staleAfterDays: 225, // ABS quarter-start dating
  },
  {
    id: 'au-household-debt-arrears',
    section: 'australia',
    group: 'au-households',
    name: 'Australian household finances (debt ratios / arrears)',
    source: 'rba',
    sourceRef: "RBA E2 'Household debt to income' (ABS-calculated ratios republished by the RBA)",
    cadence: 'quarterly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.2 },
    // B-09: RBA E2's quarterly obs ages up to ~190 days between releases
    // (quarter dating + release lag) — the documented override that keeps
    // the 120-day quarterly default honest for the rest.
    staleAfterDays: 190,
  },
  {
    // M6 Wave 3 (OD-8/D-42, 2026-10-25): the AU LEADING EDGE — new housing
    // loan commitments lead home values and housing demand (the mortgage
    // pipeline the review's AU-household journey was missing). SCORED on
    // year-on-year growth (the au-home-values discipline — nominal levels
    // trend, so the 10-year position measures the YoY, not the level).
    // Series verified live 2026-10-25: ABS LEND_HOUSING went QUARTERLY in
    // the SDMX API (the review's "monthly" assumption corrected at
    // build time — 28 quarterly obs since 2019-09 in the published table,
    // the SDMX series carries 2002-Q3 onward); SA, $ millions, all
    // lenders, total dwellings. 2026-Q2 = AU$97.6bn.
    id: 'au-housing-finance',
    section: 'australia',
    group: 'au-households',
    name: 'New Australian home loans (quarterly)',
    source: 'abs',
    sourceRef:
      'ABS LEND_HOUSING/FIN_VAL.NEWCOMMITS.DV8368.TOTDWELL.TOT.TOT.20.AUS.Q (new housing loan commitments, total dwellings, SA, $ millions)',
    cadence: 'quarterly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.2 },
    // The level's changes speak in percent; the percentile measures YoY.
    percentileBasis: 'yoy',
    // ABS quarterly obs (Q-01) first appears ~5-6 weeks after quarter end
    // and ages up to ~215d between releases — the au-home-values window.
    // M6 calibration fix (2026-10-25): ABS LEND_HOUSING quarterly: obs-to-next-release ~220d — 215 left a false-stale week at the Q3 boundary.
    staleAfterDays: 230,
  },
  {
    // M6 Wave 3 (OD-8/D-42, 2026-10-25): the hunkering-down gauge — the
    // household saving ratio, the same ANA_AGG national-accounts flow as
    // terms-of-trade (M7 measure, HSR item, SA, quarterly). CONTEXT
    // (info): the pulse beside the scored pipeline card. Verified live
    // 2026-10-25: 6.5% @ 2026-Q2.
    id: 'au-saving-ratio',
    section: 'australia',
    group: 'au-households',
    name: 'The Australian household saving rate',
    source: 'abs',
    sourceRef: 'ABS ANA_AGG/M7.HSR.20.AUS.Q (household saving ratio, seasonally adjusted, % of disposable income)',
    cadence: 'quarterly',
    // A share of income — its changes speak in percentage points.
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
    // M6 calibration fix (2026-10-25): ABS ANA: the slowest quarterly cycle — Q2 obs (Apr 1) meets the Q3 release ~Dec 2 = 245d; 215 would false-stale the whole month of November.
    staleAfterDays: 250,
  },
  {
    // M6 Wave 3 (OD-8/D-42, 2026-10-25): leading labor for the AU jobs
    // card — vacancies roll over before unemployment rises (the JOLTS
    // logic, Australian edition). CONTEXT (info). Verified live
    // 2026-10-25: 325.0k @ 2026-Q3, SA, all sectors, thousands.
    id: 'au-job-vacancies',
    section: 'australia',
    group: 'au-households',
    name: 'Australian job vacancies',
    source: 'abs',
    sourceRef: 'ABS JV/M1.7.TOT.20.AUS.Q (job vacancies, all sectors, seasonally adjusted, thousands)',
    cadence: 'quarterly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
    // M6 calibration fix (2026-10-25): ABS JV: obs quarter-start to next release ~Feb = ~232d across the year-end quarter — 215 false-staled mid-February otherwise.
    staleAfterDays: 240,
  },
  /* -------- Australia — How is trade and the currency? -------- */
  {
    id: 'audusd',
    section: 'australia',
    group: 'au-trade-currency',
    name: 'AUD/USD',
    source: 'derived',
    sourceRef: '1 ÷ Frankfurter USD→AUD',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'percentile', tail: 'low', cutoff: 0.2 },
  },
  {
    // 2026-10-26 gap-audit build, A-5 (INSIGHTS_DATA_SPEC.md): the
    // RBA−Fed policy-rate gap — rba-cash-rate minus the Fed target-range
    // MIDPOINT (the E-15 (DFEDTARL+DFEDTARU)/2 basis). Zero new fetches:
    // both parents are decision-table feeds collected by the main rung.
    // Per-change cadence (the rba-cash-rate pattern): the gap moves only
    // on decisions, so it never goes stale by age. Completes the AU rate
    // story au-us-10y-gap (−0.01) tells for the long end.
    id: 'rba-fed-gap',
    section: 'australia',
    group: 'au-trade-currency',
    name: 'RBA−Fed policy rate gap',
    source: 'derived',
    sourceRef: 'RBA Cash Rate Target (F1/decision table) − FRED:DFEDTARL/DFEDTARU midpoint',
    cadence: 'per-change',
    changeKind: 'points',
    phase: 'P1',
    rule: {
      kind: 'any-of',
      of: [
        // Needs attention: RBA cuts far below the Fed (historic
        // AUD-carry-outflow setting, import inflation pressure) or the
        // gap above +1.50.
        { kind: 'threshold', direction: 'below', value: -1 },
        { kind: 'threshold', direction: 'above', value: 1.5 },
      ],
    },
  },
  {
    id: 'audjpy',
    section: 'australia',
    group: 'au-trade-currency',
    name: 'AUD/JPY',
    source: 'derived',
    sourceRef: 'Frankfurter USD→JPY ÷ USD→AUD',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'change', mode: 'pct', direction: 'fall', magnitude: 5, windowWeeks: 4 },
  },
  {
    id: 'terms-of-trade',
    section: 'australia',
    group: 'au-trade-currency',
    name: 'Terms of trade',
    source: 'abs',
    sourceRef: 'ABS national accounts (ANA_AGG export ÷ import price index)',
    cadence: 'quarterly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'consecutive-decline', periods: 2 },
    staleAfterDays: 215, // ABS quarter-start dating
  },
  {
    // Step-2 add-list §B6: iron ore is CONTEXT ONLY — the price answers
    // "what does it cost / how is trade", and the page says so explicitly
    // (the Step-1 D5 oil-scoring contradiction, avoided by design: iron ore
    // never votes, so the hero counts can never contradict a "context"
    // label). Source note: the World Bank Pink Sheet is the primary source
    // and is FRESHER than FRED's PIORECRUSDM mirror of the same series
    // (verified 2026-10-13: WB carries Sep 2026 = 97.7 while FRED ends
    // Jul 2026) — the direct WB fetch stays, and the card names it.
    // The iron-terms-aud relationship card reads THIS card's reading (the
    // same series object), so the two can never disagree.
    id: 'iron-ore',
    section: 'australia',
    group: 'au-trade-currency',
    name: 'Iron ore price',
    source: 'world-bank',
    sourceRef: 'World Bank Pink Sheet iron ore, cfr spot (FRED mirror PIORECRUSDM lags ~2 months)',
    cadence: 'monthly',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
    // B-09: Pink Sheet monthly cadence — same ~40-day honest age as
    // copper-gold.
    staleAfterDays: 60,
  },
  {
    id: 'gold-aud',
    section: 'australia',
    group: 'au-trade-currency',
    name: 'Gold price in AUD',
    source: 'derived',
    sourceRef: 'gold-api.com XAU × Frankfurter USD→AUD',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'info' },
  },
] as const;
