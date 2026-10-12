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
    // The Fed target range's midpoint ((lower+upper)/2 of DFEDTARL/DFEDTARU).
    // The card renders the 25bp corridor around this midpoint at display
    // time ("3.50–3.75%") — the corridor width is constant since 2008, and
    // the percentile/change math on the midpoint is exact.
    id: 'fed-target',
    section: 'global',
    group: 'borrowing-costs',
    name: 'Federal funds target rate (midpoint)',
    source: 'fred',
    sourceRef: 'FRED:(DFEDTARL + DFEDTARU) / 2',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.1 },
    staleAfterDays: 5,
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
    changeKind: 'pct',
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
  /* ---------------- Global — Are prices heating up? ---------------- */
  {
    id: 'us-cpi-yoy',
    section: 'global',
    group: 'prices-heat',
    name: 'US inflation (yearly)',
    source: 'fred',
    sourceRef: 'FRED:CPIAUCSL (12-month % change)',
    cadence: 'monthly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'above', value: 3 },
    // Spec said 50 (release-date aging); the engine ages from the OBS date
    // (M-01), which is up to ~73d old just before the next release — 75
    // keeps the monthly cadence honest instead of false-alarming.
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
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.2 },
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
    id: 'dollar-basket',
    section: 'global',
    group: 'dollar-strength',
    name: 'Currena dollar basket',
    source: 'derived',
    sourceRef: 'Frankfurter six-currency basket (DXY weights, 50.14348112 base)',
    cadence: 'daily',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'percentile', tail: 'high', cutoff: 0.1 },
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
    id: 'gold-btc',
    section: 'global',
    group: 'prices-board',
    name: 'Gold / Bitcoin',
    source: 'derived',
    sourceRef: 'gold-api.com XAU ÷ BTC',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
  },
  {
    id: 'silver-btc',
    section: 'global',
    group: 'prices-board',
    name: 'Silver / Bitcoin',
    source: 'derived',
    sourceRef: 'gold-api.com XAG ÷ BTC',
    cadence: 'daily',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
  },
  /* -------- Australia — Are inflation and rates a problem? -------- */
  {
    id: 'au-cpi',
    section: 'australia',
    group: 'au-inflation-rates',
    name: 'Australian CPI (annual change)',
    source: 'abs',
    sourceRef: 'ABS CPI All groups CPI index (annual change derived)',
    cadence: 'quarterly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'above', value: 3 },
    // ABS CPI quarters date from Q-01 and release ~4w after quarter END —
    // the obs ages up to ~209d between releases (the latent Oct-8→28 window
    // the 190d quarterly grace false-alarms in). 215 covers it.
    staleAfterDays: 215,
  },
  {
    id: 'au-trimmed-mean',
    section: 'australia',
    group: 'au-inflation-rates',
    name: 'Australian trimmed-mean inflation',
    source: 'abs',
    sourceRef: 'ABS CPI_Q Trimmed Mean index (annual change derived)',
    cadence: 'quarterly',
    changeKind: 'pct',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'above', value: 3 },
    staleAfterDays: 215, // same ABS quarter-start dating as au-cpi
  },
  {
    id: 'au-us-10y-gap',
    section: 'australia',
    group: 'au-inflation-rates',
    name: 'Australia vs US 10-year yield gap',
    source: 'derived',
    sourceRef: 'RBA F2 10y − FRED:DGS10',
    // Weekly cadence (not daily): RBA F2 publishes with a 2–4 business-day
    // lag (Phase I2 venue finding, docs/insights/03-data-sources.md).
    cadence: 'weekly',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'threshold', direction: 'below', value: 0 },
  },
  {
    id: 'rba-cash-rate',
    section: 'australia',
    group: 'au-inflation-rates',
    name: 'RBA cash rate',
    source: 'rba',
    sourceRef: 'RBA statistical table F1.1 (Cash Rate Target, monthly average)',
    cadence: 'per-change',
    changeKind: 'points',
    phase: 'P1',
    rule: { kind: 'info' },
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
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'info' },
    // Spec said 70 (release-date aging); ABS monthly obs (M-01) ages ~87d
    // between releases — 95 matches the cadence grace.
    staleAfterDays: 95,
  },
  /* -------- Australia — Are households under pressure? -------- */
  {
    // What borrowers actually pay: F6 series ID FLRHOOTA (outstanding,
    // owner-occupier, all loans, all institutions) — the runner matches by
    // Series ID because RBA rewords column titles over time (data spec §3).
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
    // Below-aux rule: wage growth below yearly CPI ("pay is not keeping up
    // with prices") — the runner supplies the au-cpi yoy series as aux.
    id: 'au-wage-growth',
    section: 'australia',
    group: 'au-households',
    name: 'Wage growth (yearly)',
    source: 'abs',
    sourceRef: 'ABS WPI total hourly rates excluding bonuses (12-month % change)',
    cadence: 'quarterly',
    changeKind: 'pct',
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
    changeKind: 'pct',
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
    // Also rendered as a price row on the Prices board (data spec PB1) —
    // the price answers "what does it cost", the gauge answers "is trade
    // healthy". One series, two presentations.
    id: 'iron-ore',
    section: 'australia',
    group: 'au-trade-currency',
    name: 'Iron ore price',
    source: 'world-bank',
    sourceRef: 'World Bank Pink Sheet iron ore, cfr spot',
    cadence: 'monthly',
    changeKind: 'pct',
    phase: 'P2',
    rule: { kind: 'percentile', tail: 'low', cutoff: 0.2 },
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
