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
    id: 'jgb-10y',
    section: 'global',
    group: 'borrowing-costs',
    name: 'Japan 10-year government bond yield',
    source: 'fred',
    sourceRef: 'FRED:IRLTLT01JPM156N (long-term government bond yield, monthly)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 75,
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
    id: 'boe-rate',
    section: 'global',
    group: 'borrowing-costs',
    name: 'Bank of England policy rate (overnight)',
    source: 'fred',
    sourceRef: 'FRED:IRSTCI01GBM156N (overnight rate, monthly)',
    cadence: 'monthly',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 75,
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
  /* ---------------- Global — Are markets nervous? ---------------- */
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
  {
    // 2026-10-21 data-integrity round: the fourth dollar-bloc pair (the
    // agenda's missing currency) — the same ECB reference-rate source and
    // invert recipe as AUD/USD.
    id: 'nzd-usd',
    section: 'global',
    group: 'dollar-strength',
    name: 'NZD/USD',
    source: 'frankfurter',
    sourceRef: 'Frankfurter USD→NZD',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 4,
  },
  /* ---------------- Global — Is growth healthy? ---------------- */
  {
    id: 'china-pmi',
    section: 'global',
    group: 'growth-health',
    name: 'China manufacturing PMI',
    source: 'manual',
    sourceRef: 'data/manual/china-pmi.json (NBS official releases, hand-entered)',
    cadence: 'manual',
    changeKind: 'points',
    phase: 'P2',
    rule: { kind: 'threshold', direction: 'below', value: 50 },
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
    rule: { kind: 'yoy-negative' },
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
    id: 'platinum',
    section: 'global',
    group: 'growth-health',
    name: 'Platinum price',
    source: 'world-bank',
    sourceRef: 'World Bank Pink Sheet (Platinum, $/troy oz)',
    cadence: 'monthly',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
    staleAfterDays: 60,
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
  {
    // Defect E-12 (2026-10-16): same orientation fix — the value is bitcoin
    // per ounce of silver (XAG ÷ BTC ≈ 0.0007).
    id: 'silver-btc',
    section: 'global',
    group: 'prices-board',
    name: 'Bitcoin priced in silver (BTC per ounce)',
    source: 'derived',
    sourceRef: 'gold-api.com XAG ÷ BTC (bitcoin per troy ounce)',
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
    staleAfterDays: 200,
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
    staleAfterDays: 215, // ABS quarter-start dating
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
