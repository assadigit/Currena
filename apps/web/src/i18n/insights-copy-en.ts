/**
 * Insights copy dictionary: ENGLISH (source of truth, Phase I4 → I15).
 *
 * The Insights page carries by far the largest string corpus in the app
 * (41 indicators × 6 copy fields + consequence lines + structural strings,
 * both languages): ~2× the whole existing main dictionary. Loading it
 * through the eager en.ts/fa.ts dictionaries would grow the ENTRY bundle
 * the roadmap explicitly protects ("the Insights route must be lazy-loaded
 * so initial JS does not regress"). So this pair of modules keeps every
 * rule of the house i18n system: en.ts-style source of truth, fa
 * shape-checked at compile time, no hardcoded text in components: while
 * living inside the lazy /insights route chunk (only nav.title/title
 * strings join the eager dictionaries).
 *
 * Copy rules (docs/insights/01/02 specs + the 2026-10-08 owner specs +
 * D4): plain language, general information only, never personal advice, no
 * buy/sell wording. Consequence lines (I15, data spec §6): hedged words
 * ("usually", "tends to"), stated position ("If you have a home loan…"),
 * ~15 words or fewer, state-keyed. The `forYou` field is
 * general-information framing aimed at an Australian reader, not a
 * recommendation. Phase I5 does the native review pass on this text.
 *
 * I15 (2026-10-08 UI spec): names are PLAIN first (Block F6: "What the US
 * government pays to borrow for 10 years"), the technical tag rides along
 * as the small `ticker` (Block G8); consequence lines are state-keyed
 * (Block F4).
 */

import type { IndicatorId } from '@currena/core';

/**
 * State-keyed consequence lines (data spec §6 + UI Block F4). Chosen by the
 * reading's position band and 30-day direction:
 *   high_rising : percentile ≥ 80 AND change30d > 0
 *   high_easing : percentile ≥ 80 and not rising
 *   typical     : 20–80 band
 *   low         : ≤ 20 band
 *   jumping     : price rows whose |moveScore| clears the big-mover threshold
 * All optional: an item without state lines falls back to `oneLiner`.
 */
export interface ConsequenceLines {
  highRising?: string;
  highEasing?: string;
  typical?: string;
  low?: string;
  jumping?: string;
}

/** One indicator's copy fields: `ticker` is optional (pair-style names carry it implicitly). */
export interface IndicatorCopyEntry {
  /** Plain-language title (F6): the reader-facing name. */
  name: string;
  /** Small technical tag shown beside the name (G8, isolated dir="ltr").
   *  Round-2 R14: helpful technical terms only ("CPI"): never source codes. */
  ticker?: string;
  /** The default consequence line + detail-panel opener (fallback when `lines` lacks a state). */
  oneLiner: string;
  /** State-keyed consequence lines (F4): see ConsequenceLines. */
  lines?: ConsequenceLines;
  /** Round-2 R28: the published band/goal this series is judged against.
   *  Lines that quote it carry the {bandPos} token, interpolated at render
   *  from the LIVE value (inside/above/below): never static text. */
  band?: { min?: number; max?: number; label: string };
  /** For prices-board rows: the unit note spelled out under the price (G7). */
  unitNote?: string;
  whatItIs: string;
  whyItMatters: string;
  tendedToMean: string;
  cantTell: string;
  forYou: string;
}

const INDICATORS: Record<IndicatorId, IndicatorCopyEntry> = {
  'yield-curve-10y2y': {
    name: 'The gap between 10-year and 2-year US borrowing',
    oneLiner:
      'The gap between long and short-term US government borrowing: negative values, an “inverted curve”, are the classic recession warning.',
    lines: {
      highRising: 'The gap is wide and widening: a steep curve usually comes with growth or inflation pressure.',
      highEasing: 'The gap is wide but narrowing: still the shape of normal, healthy conditions.',
      typical: 'The curve is near its usual shape: no unusual signal either way.',
      low: 'A small or negative gap: the shape that has preceded most US recessions.',
    },
    whatItIs:
      'The 10-year minus 2-year Treasury yield difference: the most-watched shape of the US “yield curve”, from FRED.',
    whyItMatters:
      'Banks borrow short and lend long; an inverted curve squeezes that business and has preceded most US recessions.',
    tendedToMean:
      'An inverted curve preceded every US recession of the past 60 years: usually by 6 to 24 months, with occasional false alarms.',
    cantTell:
      'It says nothing about timing or size of any downturn, and other countries’ curves can tell a different story.',
    forYou:
      'One of the most-watched early-warning gauges in finance: useful context, never a signal to act on alone.',
  },
  'real-yield-10y': {
    name: 'US 10-year interest after inflation',
    oneLiner:
      'What 10-year US government bonds pay after inflation: the “real” return the world’s biggest debt market demands.',
    lines: {
      highRising: 'Savings tend to earn more after inflation: borrowers and riskier assets usually face tighter conditions.',
      highEasing: 'Real yields are high but easing: a little relief for borrowers, if it lasts.',
      typical: 'Real yields sit in their usual range: balanced between savers and borrowers.',
      low: 'Real yields are low: the setting where holding “safe” money earns little after inflation.',
    },
    whatItIs:
      'The market yield on 10-year US inflation-protected Treasuries: the return lenders demand after inflation, from FRED.',
    whyItMatters:
      'Real yields anchor the pricing of everything (homes, shares, currencies) and have sat at historic highs since 2023.',
    tendedToMean:
      'High real yields make cash and bonds compete harder against riskier assets; the negative real yields of the 2010s did the opposite.',
    cantTell:
      'It prices one market’s value of time: not the whole economy, and not future returns on anything.',
    forYou:
      'A dial for how attractive “safe” money is: high real yields generally mean tighter conditions for borrowers and asset prices everywhere.',
  },
  us10y: {
    name: 'What the US government pays to borrow for 10 years',
    oneLiner:
      'The interest rate on 10-year US government debt: often called the world’s most important number.',
    lines: {
      highRising: 'Borrowing costs are high and rising: home loans and business credit usually follow, with a lag.',
      highEasing: 'Borrowing costs are high but easing: relief, if it lasts, usually reaches loans with a delay.',
      typical: 'Borrowing costs are in their usual range: no unusual pressure either way.',
      low: 'Borrowing costs are cheap by recent standards: usually supportive for loans and asset prices.',
    },
    whatItIs:
      'The market yield on the 10-year US Treasury note, set afresh every trading day.',
    whyItMatters:
      'It steers mortgage rates, corporate borrowing and the valuation of assets globally: including in Australia.',
    tendedToMean:
      'Fast rises of half a point or more within weeks have often accompanied big policy shifts or financial accidents.',
    cantTell:
      'The level alone doesn’t say why it moved: growth, inflation and fear each tell a different story at the same number.',
    forYou:
      'A rough dial for global borrowing costs: up generally means money is getting tighter worldwide.',
  },
  'fed-target': {
    name: 'The US central bank’s policy rate',
    oneLiner:
      'The US Federal Reserve’s target for its overnight interest rate: the base of the US rate system.',
    lines: {
      highRising: 'US policy is tight and tightening: borrowing, jobs and prices usually cool with a lag.',
      highEasing: 'US policy is tight but easing: the first stage of relief for borrowers, when it lasts.',
      typical: 'The policy rate sits in its usual range for the decade.',
      low: 'US policy is loose by recent standards: usually supportive for borrowing and asset prices.',
    },
    whatItIs:
      'The Federal Reserve’s target range for the overnight rate (FRED’s DFEDTARL and DFEDTARU): the card shows the full range, set at eight scheduled meetings a year.',
    whyItMatters:
      'It is the anchor of the US rate system: mortgages, savings, business loans and global dollar borrowing all reprice around it.',
    tendedToMean:
      'The near-zero setting after 2008 lasted seven years; the 2022 hikes were the fastest in four decades; settings this big take years to work through.',
    cantTell:
      'The setting says nothing about the next decision (markets reprice that constantly) and its effects arrive with long, uneven lags.',
    forYou:
      'The world’s most-copied rate dial: what the Fed decides tends to reach Australian mortgage and savings rates indirectly.',
  },
  'fed-expectations': {
    // Fix spec C-03 (2026-10-14): the 2-year yield minus the policy rate.
    name: 'What markets expect from the Fed',
    ticker: '2-year gap',
    oneLiner:
      'The 2-year US borrowing rate minus the Fed’s policy rate: a wide positive gap means the market’s short-term rate sits above today’s policy rate; a negative gap means below it.',
    lines: {
      highRising:
        'The 2-year rate sits well above the policy rate and the gap is widening: the market’s own pricing sits above today’s setting.',
      highEasing: 'The gap between the 2-year rate and the policy rate is positive but narrowing.',
      typical: 'The 2-year rate sits close to the policy rate: no strong lean either way.',
      low: 'The 2-year rate sits below the policy rate: the market’s own pricing sits below today’s setting.',
    },
    whatItIs:
      'The US 2-year Treasury yield (FRED’s DGS2) minus the Fed’s policy-rate midpoint (the average of the target range’s two bounds, FRED’s DFEDTARL and DFEDTARU), from FRED.',
    whyItMatters:
      'Two-year yields track the policy path the market itself prices: this gap is the market’s lean relative to today’s setting, watched by savers and borrowers everywhere.',
    tendedToMean:
      'Wide positive gaps have appeared when the market priced a rising policy path; negative gaps appeared in the run-ups to past rate-cutting cycles.',
    cantTell:
      'It describes market pricing, not the Fed’s own intentions, and it moves with growth and inflation news too.',
    forYou: 'A quick read on the direction of US borrowing costs the market has priced — context, never advice.',
  },
  us30y: {
    // Fix spec C-04 (2026-10-14): the long end of the US curve.
    name: 'US 30-year Treasury yield',
    ticker: '30-year',
    oneLiner:
      'The interest rate on 30-year US government borrowing: the long end of the world’s biggest bond market.',
    lines: {
      highRising:
        'Long-term US borrowing costs are high for their decade and rising: the setting where long-dated borrowing, including fixed home loans, is expensive.',
      highEasing: 'Long-term US borrowing costs are high for their decade but easing.',
      typical: 'The 30-year yield sits in its usual range for the decade.',
      low: 'Long-term US borrowing costs are low.',
    },
    whatItIs:
      'The market yield on 30-year US Treasury bonds, daily from FRED (DGS30).',
    whyItMatters:
      'The 30-year yield anchors long-term borrowing costs worldwide, from fixed-rate mortgages to corporate and government debt issuance.',
    tendedToMean:
      'Sustained rises in this yield tend to lift fixed-rate mortgage pricing; falls tend to ease it.',
    cantTell:
      'It is a market price, not a policy setting, and it moves with growth, inflation and borrowing-supply news.',
    forYou: 'A benchmark for long-term borrowing costs, including the pricing of long fixed-rate loans.',
  },
  'ecb-dfr': {
    name: 'The euro area’s policy rate',
    oneLiner:
      'The European Central Bank’s rate on bank deposits: the euro area’s main policy dial.',
    lines: {
      highRising: 'Euro-area policy is tight and rising: borrowing across Europe usually gets dearer and growth softer.',
      highEasing: 'Euro-area policy is tight but easing: early relief for European borrowers, if it lasts.',
      typical: 'The ECB’s rate sits in its usual range for the decade.',
      low: 'Euro-area policy is loose by recent standards: the 2010s setting that made saving pay little.',
    },
    whatItIs:
      'The ECB’s deposit facility rate: what banks earn on money parked overnight at the European Central Bank, from the ECB Data Portal.',
    whyItMatters:
      'The euro area is a huge bloc of savers and borrowers; this one rate steers their loans and deposits, and rivals the Fed’s dial in reach.',
    tendedToMean:
      'The negative-rate era of 2014–22 (a first for a major central bank) tried to revive inflation; the 2022–23 hikes fought it. Both worked slowly.',
    cantTell:
      'It describes one bloc’s policy, not the world’s: and like every policy rate, it works with long, uneven lags.',
    forYou:
      'A second anchor for world money: ECB tightening or easing tends to move global borrowing costs alongside the Fed’s.',
  },
  'govt-interest-revenue': {
    name: 'The US government’s interest bill vs its income',
    oneLiner:
      'How big the US federal government’s interest bill has become relative to its income.',
    lines: {
      highRising: 'Interest is eating a growing slice of US income: pressure that tends to sharpen deficit politics.',
      highEasing: 'The interest burden is high but easing: pressure on US budget politics slowly lifting.',
      typical: 'The interest burden sits in its usual range for the decade.',
      low: 'The interest bill is small relative to income: one less pressure on US budget politics.',
    },
    whatItIs:
      'US government interest payments divided by its total receipts, both quarterly national-accounts figures from FRED.',
    whyItMatters:
      'Rising interest costs crowd out other spending and sharpen deficit and debt-ceiling politics.',
    tendedToMean:
      'Peaks historically coincided with high-rate or high-debt eras; the ratio climbed steeply after 2022.',
    cantTell:
      'It moves slowly (quarterly) and says nothing about any single year’s politics or decisions.',
    forYou: 'Quiet background for US deficit and debt-ceiling headlines.',
  },
  'us-cpi-yoy': {
    name: 'US prices vs a year ago',
    ticker: 'CPI',
    oneLiner:
      'How fast US consumer prices are rising, compared with a year ago.',
    band: { min: 2, label: 'the Fed’s 2% goal' },
    lines: {
      highRising: 'US prices are rising faster than usual: pressure that tends to keep world rates high.',
      highEasing: 'US inflation is high but easing: the pressure on world rates slowly lifting.',
      typical: 'US inflation is {bandPos} {bandLabel}.',
      low: 'US inflation is low: the rare setting that usually lets central banks ease.',
    },
    whatItIs:
      'The 12-month change in the US consumer price index, not seasonally adjusted (FRED’s CPIAUCNS): the world’s most-watched inflation number, published monthly.',
    whyItMatters:
      'US inflation sets the mood for world interest rates: hot readings tend to delay rate cuts everywhere, cold ones hasten them.',
    tendedToMean:
      'The 2021–22 surge to a 9% peak forced the fastest Fed hikes in four decades; low readings, like 2020’s, preceded long easy-money eras.',
    cantTell:
      'It is one country’s prices in one month: a single reading sets no trend, and the mix of goods inside it shifts.',
    forYou:
      'The number behind world rate headlines: high US inflation usually means global borrowing stays dearer for longer.',
  },
  // Step-1 audit item A3: the core-CPI companion — rendered INSIDE the
  // headline card ("Core inflation 2.4% · The gap between them is mainly
  // energy"), never its own row.
  'us-cpi-core-yoy': {
    name: 'Core inflation',
    ticker: 'Core CPI',
    oneLiner: 'US prices excluding food and energy, compared with a year ago.',
    lines: {},
    whatItIs:
      'The 12-month change in the US core consumer price index, not seasonally adjusted (FRED’s CPILFENS): the steady underlying measure the Fed watches most.',
    whyItMatters:
      'Core strips the volatile food and energy swings: it is the cleaner read on where inflation is heading.',
    tendedToMean:
      'Core runs steadier than headline inflation: it moved far less during the 2022 energy spike.',
    cantTell: 'It is still one month of one country’s prices: not a trend on its own.',
    forYou: 'A cross-check on the headline: when the two disagree, energy is usually why.',
  },
  'breakeven-5y5y': {
    name: 'Expected US inflation, five to ten years ahead',
    oneLiner:
      'The annual inflation rate markets expect, on average, five to ten years from now.',
    lines: {
      highRising: 'Markets are pricing more future inflation: the mood that tends to keep long-term rates high.',
      highEasing: 'Markets still price above-normal future inflation, but the pressure is easing.',
      typical: 'Long-run US inflation expectations sit near their usual level.',
      low: 'Markets price weak future inflation: the deflation-fear setting that invites easy policy.',
    },
    whatItIs:
      'The “5y5y forward breakeven”: derived from the gap between ordinary and inflation-protected Treasury yields, five years forward starting in five years.',
    whyItMatters:
      'The cleanest read on long-horizon inflation expectations: the thing central banks watch to keep their credibility.',
    tendedToMean:
      'Sustained moves above roughly 2.5% have historically unsettled central banks; slides toward 1% signal feared deflation.',
    cantTell:
      'It reflects market prices, which can move on liquidity and hedging: not just on genuine belief.',
    forYou:
      'A gauge of whether markets still trust inflation to stay near target over the long run.',
  },
  'stress-stlfsi': {
    name: 'Stress in US money markets',
    oneLiner:
      'The St. Louis Fed’s single gauge of stress across US money and credit markets: zero is average, above zero is above-average stress.',
    lines: {
      highRising: 'Stress in US money markets is building: the backdrop that usually tightens lending worldwide.',
      highEasing: 'Stress is above average but easing: conditions repairing rather than panic.',
      typical: 'US financial stress sits near its average: the market plumbing working normally.',
      low: 'Stress is unusually low: the calm that usually comes with easy conditions.',
    },
    whatItIs:
      'The STLFSI4 index from FRED: 18 market measures (yields, spreads, volatility) combined into one weekly number centred on zero.',
    whyItMatters:
      'It condenses many separate stress signals into one number that analysts and policymakers actually watch.',
    tendedToMean:
      'Readings above zero for a month or more marked 2008 and the 2020 COVID shock; brief blips above zero are common and harmless.',
    cantTell:
      'It is backward-looking and US-centred: it cannot say where markets go next.',
    forYou:
      'Background for headlines about “financial stress”: calm here broadly means market plumbing is working.',
  },
  nfci: {
    name: 'US financial conditions',
    oneLiner:
      'The Chicago Fed’s broad gauge of how easily money moves through the US financial system: zero is average.',
    lines: {
      highRising: 'US financial conditions are tightening: money getting harder to move, which usually slows lending.',
      highEasing: 'Conditions remain tighter than average, but are easing.',
      typical: 'US financial conditions sit near their historical average.',
      low: 'Conditions are looser than average: money moving easily, usually supportive of credit.',
    },
    whatItIs:
      'The Chicago Fed’s National Financial Conditions Index (FRED): about 100 measures of money markets, debt markets and banking combined into one weekly number centred on zero.',
    whyItMatters:
      'A broad single dial for the tightness of the whole US financial system: the mood central banks react to.',
    tendedToMean:
      'Spikes above zero marked 2008 and the 2020 COVID shock; long stretches below zero marked the easy-money eras.',
    cantTell:
      'Weekly, backward-looking and US-only: it says how tight money was, not what happens next.',
    forYou:
      'A second opinion on the stress gauges: tight US conditions tend to spread to world lending, including the offshore funding Australian banks use.',
  },
  vix: {
    name: 'Market fear gauge',
    ticker: 'VIX',
    oneLiner:
      'How nervous US stock-market investors are: low means calm, high means fear.',
    lines: {
      highRising: 'US share-market fear is high and rising for its decade: the setting that usually comes with sharp swings in world markets.',
      highEasing: 'Market fear is elevated for its decade but easing.',
      typical: 'Market fear sits in its usual range for the decade.',
      low: 'Market fear is low: the calm setting for share markets.',
    },
    whatItIs:
      'The Cboe Volatility Index (VIX): the market’s own gauge of the size of S&P 500 swings priced into one-month options. Daily close from FRED (VIXCLS), © Cboe.',
    whyItMatters:
      'It is the market’s own fear thermometer: readings in the teens mean calm, those in the twenties mean nerves, and the rare spikes above 30 have marked panics.',
    tendedToMean:
      'The decade’s spikes (2015 China wobble, 2018 “Volmageddon”, 2020 COVID) each lined up with sharp share-market falls; calm stretches sit in the low teens.',
    cantTell:
      'It measures expected swings, not direction: a calm VIX says nothing about whether shares rise or fall, and it can jump overnight.',
    forYou:
      'The one-glance answer to “how jumpy are world share markets today?”, and useful background for super and share investments.',
  },
  'gold-silver': {
    name: 'Gold’s price versus silver',
    oneLiner:
      'How many ounces of silver one ounce of gold buys: the classic hard-asset ratio.',
    lines: {
      highRising: 'Gold is running dearer against silver: the mix that tends to appear when fear leads.',
      highEasing: 'Gold remains dear against silver, but the gap is easing.',
      typical: 'The gold-to-silver ratio sits in its usual range.',
      low: 'Silver is running dear against gold: the mix that tends to appear with industrial strength.',
    },
    whatItIs:
      'The gold price divided by the silver price, live from a metals feed, on a decade of World Bank monthly history.',
    whyItMatters:
      'Silver is half precious metal, half industrial input: the ratio pits monetary hedging against growth demand.',
    tendedToMean:
      'Very high ratios (gold very expensive versus silver) marked stress eras: 1991, 2008, 2020, and records in 2025–26.',
    cantTell:
      'Both metals often move together; the ratio is not a forecast for either price.',
    forYou:
      'A long-standing stress-and-demand gauge that metals watchers keep an eye on at extremes.',
  },
  'dollar-basket': {
    name: 'The dollar vs six big currencies',
    // Step-1 audit item G4: "not the official DXY" rides the CARD, not
    // only the footer's attribution line.
    oneLiner:
      'The Currena dollar basket (our own measure, not the official DXY index): the US dollar’s average value against the euro, yen, pound, Canadian dollar, krona and franc.',
    lines: {
      highRising: 'The dollar is strong and strengthening: a mix that tends to pressure world prices and debts.',
      highEasing: 'The dollar is strong but easing: pressure on world markets slowly lifting.',
      typical: 'The dollar sits in its usual range for the decade.',
      low: 'The dollar is weak by recent standards: usually easier conditions for world trade and debts.',
    },
    whatItIs:
      'The Currena dollar basket: a weighted average of the dollar against the euro, yen, pound, Canadian dollar, Swedish krona and Swiss franc, computed daily from ECB reference rates. It tracks close to the famous DXY index, but it is not the official DXY.',
    whyItMatters:
      'A strong dollar tightens conditions worldwide: it prices commodities, debts and trade for nearly everyone, including Australia.',
    tendedToMean:
      'Dollar surges have coincided with global stress episodes: 1997 Asia, 2008, 2022; weak-dollar stretches usually meant easier world money.',
    cantTell:
      'It is an index, not an exchange rate: it names no single pair, and its level says nothing about what to do.',
    forYou:
      'A broad strength gauge: a sustained strong dollar tends to pressure commodity prices and the Australian dollar.',
  },
  usdjpy: {
    name: 'Dollar vs yen',
    ticker: 'USD/JPY',
    oneLiner:
      'How many Japanese yen one US dollar buys: the busiest Asian currency pair.',
    lines: {
      highRising: 'A strong dollar against the yen: Japanese goods and travel tend to get cheaper elsewhere.',
      highEasing: 'The dollar sits high against the yen but is easing off it.',
      typical: 'Dollar–yen sits in its usual range for the decade.',
      low: 'The dollar is weak against the yen: the yen-surge setting that has shaken world markets.',
    },
    whatItIs:
      'The USD/JPY exchange rate: how many yen one US dollar buys, from ECB reference rates via Frankfurter.',
    whyItMatters:
      'The yen funds the classic “carry trade”; sharp yen moves force global positioning to unwind.',
    tendedToMean:
      'Fast falls (yen surges) forced carry-trade unwinds: notably in 2008 and August 2024.',
    cantTell:
      'The pair reflects two economies and intervention rumours at once; direction alone is not a signal.',
    forYou:
      'A watched proxy for global risk appetite: yen strength usually means investors are de-risking.',
  },
  'eur-usd': {
    name: 'Euro per US dollar',
    ticker: 'EUR/USD',
    oneLiner:
      'How many euros one US dollar buys: the world’s most-traded currency pair, shown for context.',
    lines: {
      highRising: 'The dollar is gaining on the euro: strength that tends to pressure world prices.',
      highEasing: 'The dollar sits strong against the euro but is easing off it.',
      typical: 'The dollar–euro rate sits in its usual range.',
      low: 'The dollar is weak against the euro: a setting that usually eases pressure on world prices.',
    },
    whatItIs:
      'How many euros one US dollar buys, from ECB reference rates via Frankfurter: the flip side of the market’s usual EUR/USD quote.',
    whyItMatters:
      'The world’s most-traded currency pair: a raw read on the dollar against the euro area, the planet’s other big money bloc.',
    tendedToMean:
      'Readings near or above parity (a dollar worth a euro or more) came in 2000–02 and 2022, strong-dollar stress eras; the 2010s sat well below.',
    cantTell:
      'A context card: one pair, information-only, voting in no gauge: and it says nothing about the Australian dollar directly.',
    forYou:
      'Context for European travel and purchases: the Australian dollar moves against the euro on its own, so the AUD rate is the one to check.',
  },
  'china-pmi': {
    name: 'Chinese factory activity',
    oneLiner:
      'A monthly survey of Chinese factory activity: above 50 means expansion.',
    lines: {
      highRising: 'Chinese factories are expanding and quickening: usually good news for Australian exporters.',
      highEasing: 'Chinese factories are still expanding, but more slowly.',
      typical: 'Chinese factory activity sits in its usual range for the decade.',
      low: 'Chinese factories are contracting: the reading that tends to pressure commodity prices and the AUD.',
    },
    whatItIs:
      'China’s official manufacturing Purchasing Managers’ Index, from the national statistics bureau’s monthly survey of factory managers, hand-entered here from official releases. Above 50 means expansion; below 50, contraction.',
    whyItMatters:
      'China is the world’s factory and Australia’s biggest export customer; PMI is one of the first indicators to turn in any cycle.',
    tendedToMean:
      'Runs below 50 have marked Chinese slowdowns that fed through to commodity prices and the Australian dollar.',
    cantTell:
      'It measures breadth (how many firms grew), not size: one month’s dip is not a trend.',
    forYou: 'A key early indicator of demand for Australian exports.',
  },
  'm2-us': {
    name: 'The amount of money in the US economy',
    ticker: 'M2 money',
    oneLiner:
      'The amount of money in the US economy: cash, current accounts and most savings.',
    lines: {
      highRising: 'US money is growing fast again: the setting that historically fed spending and price pressure.',
      highEasing: 'Money growth is elevated but easing: pressure on prices cooling with it.',
      typical: 'US money growth sits in its usual range.',
      low: 'US money is shrinking year-on-year: rare, and historically clustered around recessions.',
    },
    whatItIs:
      'The Federal Reserve’s M2 measure of the money supply, monthly from FRED: cash, current accounts and most savings.',
    whyItMatters:
      'Money growth feeds spending power; the 2020–22 surge and the following contraction framed the whole inflation cycle.',
    tendedToMean:
      'Year-on-year falls are rare: they clustered around recessions and the 2022–23 tightening.',
    cantTell:
      'How fast money changes hands matters as much as how much of it exists; supply alone doesn’t set prices.',
    forYou: 'Background that makes inflation debates easier to follow.',
  },
  'philly-fed': {
    // Fix spec C-05 (2026-10-14): the free US activity survey.
    name: 'US factory survey (Philadelphia Fed)',
    ticker: 'Philly Fed',
    oneLiner:
      'A monthly survey of manufacturers in the US mid-Atlantic: above zero means expansion.',
    lines: {
      highRising: 'More manufacturers are growing and the pace is quickening: a strong reading for US activity.',
      highEasing: 'Manufacturers are still growing, but more slowly.',
      typical: 'The survey sits in its usual range for the decade.',
      low: 'More manufacturers are shrinking than growing: the reading that marks contraction.',
    },
    whatItIs:
      'The Philadelphia Fed’s manufacturing index (FRED’s GACDFSA066MSFRBPHI): the share of firms reporting growth minus the share reporting decline, seasonally adjusted; above zero means expansion.',
    whyItMatters:
      'One of the first US activity numbers released each month — a same-month signal, before the national data.',
    tendedToMean:
      'Reads below zero have marked US manufacturing slowdowns; the survey moves early in the cycle.',
    cantTell:
      'It covers one Federal Reserve district, not the whole country, and one month’s dip is not a trend.',
    forYou: 'An early, free read on US factory activity for the month.',
  },
  'us-unemployment': {
    name: 'US unemployment',
    ticker: 'BLS: UNRATE',
    oneLiner:
      'The share of the US workforce without a job: a steady rise is usually the first sign of a slowing US economy.',
    lines: {
      highRising: 'US unemployment is high for its decade and rising: the classic early signal of a slowing US economy.',
      highEasing: 'US unemployment is high for its decade but easing.',
      typical: 'US unemployment sits in its usual range for the decade.',
      low: 'US unemployment is low: the setting that usually comes with a strong jobs market.',
    },
    whatItIs:
      'The US unemployment rate from the Bureau of Labor Statistics’ monthly Employment Situation report (FRED series UNRATE), published on the first Friday of the month.',
    whyItMatters:
      'The US is the world’s largest economy: its jobs numbers move global markets and the “risk-on, risk-off” mood that reaches Australian shares and the dollar.',
    tendedToMean:
      'Rises of half a point or more from the cycle low have lined up with the start of US recessions. That pattern is what the Sahm rule next to this card formalises.',
    cantTell:
      'Monthly and an average across the whole workforce; individual industries and states can move very differently.',
    forYou: 'The first number to check when asking whether the US economy is slowing.',
  },
  'sahm-rule': {
    name: 'US recession alarm (Sahm rule)',
    ticker: 'Sahm rule',
    oneLiner:
      'Flags when US unemployment is rising fast enough that a recession has usually already started. The signal is a reading of 0.50 or more.',
    lines: {
      highRising: 'The Sahm rule has fired: US unemployment has risen 0.50+ points from its recent low, the pattern that has coincided with the start of past US recessions.',
      highEasing: 'The Sahm reading is elevated but easing.',
      typical: 'The Sahm rule is silent: no recession signal.',
      low: 'The Sahm reading is well below the signal.',
    },
    whatItIs:
      'The Sahm rule compares the 3-month average US unemployment rate with its lowest point over the past year. A reading of 0.50 or more is the standard recession signal; it has flagged every US recession since 1970, usually as they began.',
    whyItMatters:
      'It turns one familiar number (unemployment) into a simple, rules-based recession alarm: no forecasts, just arithmetic on published data.',
    tendedToMean:
      'Half-point rises from a cycle low are how US recessions have started in the jobs data since 1970.',
    cantTell:
      'It lags by construction (it needs a low to rise from) and says nothing about depth or length, only that a downturn has usually begun.',
    forYou: 'A single glance at “is the US in recession territory?” before reading anything else.',
  },
  'copper-gold': {
    name: 'Copper’s price versus gold',
    oneLiner:
      'Copper’s price relative to gold: growth versus safety in one ratio.',
    lines: {
      highRising: 'Copper is running dear against gold: a signal that tends to come with industrial strength.',
      highEasing: 'Copper remains dear against gold, but the edge is easing.',
      typical: 'The copper price vs gold sits in its usual range.',
      low: 'Copper is cheap against gold: the growth-scare mix that tends to accompany world slowdowns.',
    },
    whatItIs:
      'The World Bank copper price divided by the gold price (monthly averages).',
    whyItMatters:
      'Copper wires the world’s growth (“Dr Copper”) while gold is the fear hedge; the ratio pits the two against each other.',
    tendedToMean:
      'A low copper/gold ratio has coincided with growth scares; high readings came with industrial booms.',
    cantTell:
      'Monthly and slow-moving, and both legs are US-dollar priced: dollar swings leak in.',
    forYou: 'A broad gauge of the world economy’s appetite for growth.',
  },
  usdcny: {
    name: 'Dollar vs Chinese yuan',
    ticker: 'USD/CNY',
    oneLiner:
      'How many Chinese yuan one US dollar buys: the world’s most managed major rate.',
    lines: {
      highRising: 'The dollar is firming against the managed yuan: a mix that tends to sharpen trade politics.',
      highEasing: 'The dollar sits firm against the yuan but is easing.',
      typical: 'Dollar–yuan sits in its usual managed range.',
      low: 'The dollar is soft against the yuan: a mix that usually eases trade-politics tension.',
    },
    whatItIs:
      'The USD/CNY exchange rate, steered by China’s central bank inside a band (ECB reference rates via Frankfurter).',
    whyItMatters:
      'It affects the price of Chinese goods worldwide and sets the tone of trade politics.',
    tendedToMean:
      'Moves toward either edge of the tolerated band have historically carried trade-war signalling.',
    cantTell: 'Managed, not free: the level reflects policy choices as much as markets.',
    forYou: 'Context for trade and tariff headlines.',
  },
  brent: {
    name: 'Oil price (Brent)',
    oneLiner:
      'The world’s benchmark oil price: what a barrel of Brent crude costs.',
    lines: {
      highRising: 'Oil is expensive and rising: petrol and delivery prices usually follow, with a lag.',
      highEasing: 'Oil is expensive but easing: relief for petrol prices, if it lasts.',
      typical: 'Oil is in its usual range for the decade: no unusual pressure on fuel costs.',
      low: 'Oil is cheap versus recent history: usually good news for fuel and transport costs.',
      jumping: 'Oil has jumped unusually fast: usually war or supply shocks; wait before reading a trend.',
    },
    unitNote: 'US dollars per barrel',
    whatItIs:
      'Brent crude: the price of a barrel of North Sea oil, the benchmark for most of the world’s traded oil. The backbone series is the spot price from the US Energy Information Administration via FRED; the live tile refreshes hourly from Brent front-month futures (BZ=F) on Yahoo Finance, which also fills any EIA gap.',
    whyItMatters:
      'Oil feeds fuel, transport and electricity costs everywhere, and energy is a swing factor in inflation.',
    tendedToMean:
      'Spikes above roughly $120 usually meant war or supply shocks feeding inflation; crashes below about $40 marked demand collapses.',
    cantTell:
      'Supply, demand and geopolitics pull the price at once: the level alone doesn’t separate them.',
    forYou: 'A rough leading input for the direction of fuel and energy costs.',
  },
  'gold-usd': {
    name: 'Gold price (ounce)',
    oneLiner: 'The world price of one troy ounce of gold, in US dollars.',
    lines: {
      highRising: 'Gold is expensive and rising: jewellery and coin buyers usually pay more, and some savers treat it as a stress signal.',
      highEasing: 'Gold is expensive but easing off its highs: jewellery and coin buyers usually pay a little less.',
      typical: 'Gold is trading in its usual range for the decade.',
      low: 'Gold is cheap versus recent history: the occasional buyer’s friend, the seller’s patience test.',
      jumping: 'Gold has jumped unusually fast: moves like this often accompany stress or big news; wait before reading a trend into it.',
    },
    unitNote: 'US dollars per troy ounce',
    whatItIs:
      'The spot price of gold per troy ounce: an hourly quote from COMEX gold futures (GC=F) on top of a daily gold-api.com spot and a decade of monthly World Bank prices.',
    whyItMatters:
      'Gold is the classic “fear + inflation” asset: it tends to rise when real rates fall or uncertainty spikes, and it anchors jewellery and savings prices in many countries.',
    tendedToMean:
      'Big multi-year gold runs have historically lined up with negative real interest rates or financial stress; long drags came when real rates were high.',
    cantTell:
      'It cannot tell you where it goes next, and its “record high” headlines ignore inflation: a record in dollars is not a record in purchasing power.',
    forYou:
      'Context for jewellery, coin and savings decisions: a high and rising price usually means paying more, nothing more.',
  },
  'silver-usd': {
    name: 'Silver price (ounce)',
    oneLiner: 'The world price of one troy ounce of silver, in US dollars.',
    lines: {
      highRising: 'Silver is expensive and rising: jewellery and electronics tend to cost more with it.',
      highEasing: 'Silver is expensive but easing from its highs: pressure on metal costs slowly lifting.',
      typical: 'Silver is trading in its usual range for the decade.',
      low: 'Silver is cheap versus recent history: a friend to jewellery budgets and industry.',
      jumping: 'Silver has jumped unusually fast: it moves harder than gold; wait before reading a trend.',
    },
    unitNote: 'US dollars per troy ounce',
    whatItIs:
      'The spot price of silver per troy ounce: an hourly quote from COMEX silver futures (SI=F) on top of a daily gold-api.com spot and a decade of monthly World Bank prices.',
    whyItMatters:
      'Silver is half precious metal, half industrial input: investment demand and factory demand (electronics, solar panels) pull on the same price.',
    tendedToMean:
      'Its famous spikes (1980, 2011) came when investment fever met tight supply; long quiet stretches followed as the memory faded.',
    cantTell:
      'Far more volatile than gold, and its industrial and investment sides can pull in opposite directions at once.',
    forYou:
      'Gold’s industrial cousin: the other leg of the gold-versus-silver ratio, and an ingredient in electronics and solar kit.',
  },
  'copper-usd': {
    name: 'Copper price',
    oneLiner:
      'The world price of copper: the metal that wires homes, grids and machines.',
    lines: {
      highRising: 'Copper is expensive and rising: wiring, appliances and building costs tend to follow.',
      highEasing: 'Copper is expensive but easing: pressure on construction and goods costs slowly lifting.',
      typical: 'Copper is trading in its usual range for the decade.',
      low: 'Copper is cheap versus recent history: usually a friend to builders and manufacturers.',
      jumping: 'Copper has jumped unusually fast: often industrial news; wait before reading a trend.',
    },
    unitNote: 'US dollars per metric tonne',
    whatItIs:
      'The live copper price from a metals feed (gold-api.com), converted to US dollars per metric tonne; the 10-year position comes from World Bank monthly data.',
    whyItMatters:
      'Copper is the economy’s wiring: demand for it is a proxy for construction, electrification and factory output worldwide.',
    tendedToMean:
      'Copper spikes came with industrial booms and stimulus (2020–21); deep slumps marked growth scares like 2008 and 2015.',
    cantTell:
      'A single world price with a monthly history: it cannot say whether demand or supply moved it, or where it heads next.',
    forYou:
      'A dial for building and renovation costs: dearer copper tends to show up in wiring, plumbing and appliances.',
  },
  'btc-usd': {
    name: 'Bitcoin price',
    ticker: 'BTC',
    oneLiner: 'The world price of one bitcoin, in US dollars.',
    lines: {
      highRising: 'Bitcoin is expensive and rising: a mood that tends to accompany easy money and risk appetite.',
      highEasing: 'Bitcoin is expensive but easing off its highs.',
      typical: 'Bitcoin is trading in its usual recent range.',
      low: 'Bitcoin is cheap versus its recent range: a smaller number on a famously jumpy asset.',
      jumping: 'Bitcoin has jumped unusually fast: normal for it; wait before reading a trend into it.',
    },
    unitNote: 'US dollars per bitcoin',
    whatItIs:
      'The live price of one bitcoin in US dollars: an hourly quote from Yahoo Finance’s spot index on a daily gold-api.com backbone. The 10-year position and the record peak come from ten years of Yahoo daily data.',
    whyItMatters:
      'Bitcoin is the flagship of the crypto world: its mood tends to set the tone for a whole family of digital assets.',
    tendedToMean:
      'The great booms (2020–21) met easy money; the deep crash (2022) met tightening: a pattern of risk appetite, nothing steadier.',
    cantTell:
      'Famously volatile: the price says nothing about value, and this page takes no view on holdings.',
    forYou:
      'A context price for crypto headlines: and a reminder that a fast-moving asset can move just as fast the other way.',
  },
  'crypto-fng': {
    // Step 3 L1-18 (2026-10-16): the Alternative.me index — context only.
    name: 'Crypto fear and greed',
    oneLiner: 'A daily 0-to-100 gauge of how fearful or greedy crypto markets feel today.',
    whatItIs:
      'The Alternative.me Crypto Fear and Greed Index, a daily 0-to-100 scale built from crypto market volatility, momentum, social media and dominance measures (0 = extreme fear, 100 = extreme greed). Shown with the publisher\u2019s own scale; attribution to Alternative.me.',
    whyItMatters:
      'A sentiment backdrop for crypto headlines: the number describes the mood of that market today, nothing more.',
    tendedToMean:
      'Extreme readings have often appeared near sharp market turns in that market — a tendency, not a rule.',
    cantTell:
      'Sentiment gauges describe feelings, not prices; this page never treats the index as a recommendation.',
    forYou: 'Context for crypto news — the same day-by-day honesty as every other card here.',
  },
  'gold-btc': {
    name: 'Bitcoin priced in gold (BTC per ounce)',
    oneLiner: 'How many bitcoins one ounce of gold buys: old money priced in new money.',
    whatItIs:
      'The gold price in US dollars divided by the bitcoin price, both from the same hourly snapshot (Yahoo Finance quotes on the gold-api backbone).',
    whyItMatters:
      'A shorthand for how the market values the two flagship “hard” assets against each other.',
    tendedToMean:
      'The ratio collapsed during crypto manias (2020–21) and spiked whenever bitcoin fell harder than gold.',
    cantTell:
      'These are two very different assets: this is a ratio, not a view on either one.',
    forYou: 'Context for conversations comparing bitcoin with gold as a store of value.',
  },
  'silver-btc': {
    name: 'Bitcoin priced in silver (BTC per ounce)',
    oneLiner: 'How many bitcoins one ounce of silver buys: the metal priced in crypto.',
    whatItIs:
      'The silver price divided by the bitcoin price, both from the same hourly snapshot (Yahoo Finance quotes on the gold-api backbone).',
    whyItMatters:
      'Tracks the industrial precious metal against the flagship crypto asset in one number.',
    tendedToMean: 'Its history is dominated almost entirely by the bitcoin side of the fraction.',
    cantTell: 'The silver leg barely moves: this ratio mostly mirrors bitcoin.',
    forYou: 'A curiosity ratio for comparing very different asset classes.',
  },
  'au-cpi': {
    name: 'Australian prices vs a year ago',
    ticker: 'CPI',
    oneLiner:
      'How fast Australian consumer prices are rising, compared with a year ago.',
    band: { min: 2, max: 3, label: 'the RBA’s 2–3% band' },
    lines: {
      highRising: 'Prices are {bandPos} {bandLabel} and rising: historically the setting that invites rate hikes.',
      highEasing: 'Prices are {bandPos} {bandLabel} but easing: the pressure cooling.',
      typical: 'Inflation is {bandPos} {bandLabel}.',
      low: 'Inflation is low: the setting that usually lets the RBA consider cuts.',
    },
    whatItIs: 'The ABS monthly CPI (all groups) annual change: the full monthly measure the ABS now publishes.',
    whyItMatters:
      'The RBA’s 2–3% inflation target drives its rate decisions: this is the scoreboard.',
    tendedToMean:
      'Sustained runs above 3% invited rate hikes (2007, 2022); readings below 2% marked soft-demand eras.',
    cantTell:
      'Headline inflation swings with volatile items: fuel, fruit, one-off electricity measures.',
    forYou: 'The broad cost-of-living gauge behind rate headlines.',
  },
  'au-trimmed-mean': {
    name: 'Underlying inflation',
    oneLiner:
      'The RBA’s preferred core inflation measure: the steady middle of price changes.',
    band: { min: 2, max: 3, label: 'the RBA’s 2–3% band' },
    lines: {
      highRising: 'Underlying inflation is {bandPos} {bandLabel} and rising: the reading that usually keeps rates high.',
      highEasing: 'Underlying inflation is {bandPos} {bandLabel} but easing: the pressure cooling from within.',
      typical: 'Underlying inflation is {bandPos} {bandLabel}.',
      low: 'Underlying inflation is low: the setting that usually opens the door to rate cuts.',
    },
    whatItIs:
      'The ABS monthly trimmed mean, which drops the wildest price rises and falls each month before averaging.',
    whyItMatters:
      'This is the gauge the RBA actually targets: steadier and more persistent than headline CPI.',
    tendedToMean:
      'Sustained readings above 3% signal persistent inflation pressure; it led the 2021–24 episode.',
    cantTell: 'Smoother means slower: it lags turning points by design.',
    forYou: 'The number that most directly moves the RBA’s hand.',
  },
  'au-10y': {
    name: 'What Australia pays to borrow for 10 years',
    ticker: 'RBA F2: 10y',
    oneLiner:
      'What the Australian government pays to borrow for 10 years; it influences fixed home-loan rates and term deposits.',
    lines: {
      highRising: 'Australian 10-year borrowing costs are high for their decade and rising: fixed home-loan rates and term deposits tend to sit higher in this setting.',
      highEasing: 'Australian 10-year borrowing costs are high for their decade but easing.',
      typical: 'The Australian 10-year yield sits in its usual range for the decade.',
      low: 'Australian 10-year borrowing costs are low: the setting that usually means cheaper fixed home-loan rates.',
    },
    whatItIs:
      'The yield on Australian Government 10-year bonds, daily from the RBA’s F2 statistical table (published with a 2–4 business-day lag). The US 10-year rides beside it for comparison.',
    whyItMatters:
      'Long-term rates set the price of multi-year money: fixed-rate home loans, term deposits and business borrowing price off this curve, not just the RBA’s cash rate.',
    tendedToMean:
      'The 2022–24 global rate reset pushed it from near 1% to multi-year highs; through the decade before, and especially after 2020’s emergency setting, it sat far lower.',
    cantTell:
      'It moves with world bond markets (US yields, global growth news), so it can shift with no Australian news at all.',
    forYou: 'Background for fixed home-loan and term-deposit pricing.',
  },
  'rba-expectations': {
    // Fix spec C-06 (2026-10-14): the 3-year bond yield minus the cash rate.
    name: 'What markets expect from the RBA',
    ticker: '3-year gap',
    oneLiner:
      'The 3-year Australian government borrowing rate minus the RBA cash rate: a positive gap means the market’s 3-year rate sits above today’s cash rate; a negative gap means below.',
    lines: {
      highRising:
        'The 3-year rate sits well above the cash rate and the gap is widening: the market’s own pricing sits above today’s setting.',
      highEasing: 'The gap between the 3-year rate and the cash rate is positive but narrowing.',
      typical: 'The 3-year rate sits close to the cash rate: no strong lean either way.',
      low: 'The 3-year rate sits below the cash rate: the market’s own pricing sits below today’s setting.',
    },
    whatItIs:
      'The RBA’s 3-year Australian Government bond yield (statistical table F2, series FCMYGBAG3D) minus the cash rate target (table F1), from the RBA.',
    whyItMatters:
      'This gap is the market’s lean relative to today’s cash rate — the same measure the financial press quotes as what the market prices for the RBA.',
    tendedToMean:
      'Positive gaps have appeared when the market priced a rising cash-rate path; negative gaps appeared in the run-ups to past rate-cutting cycles.',
    cantTell:
      'It describes market pricing, not the RBA’s own intentions, and it moves with world bond markets too.',
    forYou: 'A quick read on the direction of Australian borrowing costs the market has priced — context, never advice.',
  },
  'au-us-10y-gap': {
    name: 'The gap between Australian and US 10-year borrowing',
    oneLiner:
      'Whether Australian 10-year yields sit above or below US ones.',
    lines: {
      highRising: 'Australian 10-year rates sit well above US ones: a mix that tends to support the AUD.',
      highEasing: 'Australia’s 10-year premium over the US is high but narrowing.',
      typical: 'The Australia–US gap sits in its usual range.',
      low: 'US 10-year rates sit above Australia’s: the setting that has usually weighed on the AUD.',
    },
    whatItIs:
      'Australia’s 10-year government bond yield (RBA table F2) minus the US 10-year yield (FRED), published weekly with a short lag.',
    whyItMatters:
      'The gap steers the Australian dollar: global investors compare the two when placing money.',
    tendedToMean:
      'A negative gap (US yields above Australia’s) has coincided with weaker eras for the AUD.',
    cantTell: 'Both legs move: the gap can shift with no Australian news at all.',
    forYou: 'Background for why the Australian dollar moves with US rate news.',
  },
  'rba-cash-rate': {
    name: 'Australia’s official interest rate',
    oneLiner:
      'Australia’s official interest rate: the Reserve Bank’s single policy dial.',
    lines: {
      highRising: 'The RBA is tightening: variable home loans and savings rates usually follow within weeks.',
      highEasing: 'The cash rate is high but on hold or easing: first relief for variable borrowers.',
      typical: 'The cash rate sits in its usual range for the decade.',
      low: 'The cash rate is low: the setting that usually means cheap borrowing and thin savings returns.',
    },
    whatItIs:
      'The RBA’s cash rate target, decided at board meetings through the year (statistical table F1.1).',
    whyItMatters:
      'It flows directly into mortgage, deposit and business borrowing costs across Australia.',
    tendedToMean:
      'Moves come in steps and runs (hikes into inflation, cuts into weakness) and set the cycle for years at a time.',
    cantTell:
      'The current setting says nothing about the next move; markets reprice that constantly.',
    forYou: 'The anchor for variable mortgage and savings rates in Australia.',
  },
  'au-petrol-yoy': {
    name: 'Petrol prices vs a year ago',
    ticker: 'CPI: fuel',
    oneLiner: 'How much more (or less) fuel costs than a year ago.',
    lines: {
      highRising: 'Petrol is climbing faster than a year ago: pressure on family budgets and freight prices.',
      highEasing: 'Petrol inflation is high but easing: pressure at the bowser slowly lifting.',
      typical: 'Petrol prices are moving about as fast as they usually do.',
      low: 'Petrol is cheaper than a year ago: the rare reading that eases household budgets.',
    },
    whatItIs:
      'The 12-month change in the ABS CPI “automotive fuel” index: an index of fuel prices, not a pump price, published monthly.',
    whyItMatters:
      'Fuel is one of the most visible prices households meet: it feeds budgets, freight costs and headline inflation.',
    tendedToMean:
      'Big swings came with oil shocks: fuel inflation hit 35% in 2022 and fell hard in 2020; petrol usually leads headline CPI’s turning points.',
    cantTell:
      'Monthly and about a month behind: pump prices move daily and differ by city, so the index only approximates the pump.',
    forYou:
      'A read on the fuel part of the cost of living: when this is high, the weekly tank fill and delivery prices usually feel it.',
  },
  'au-home-loan': {
    name: 'The home-loan rate people actually pay',
    oneLiner:
      'The average interest rate on outstanding owner-occupier home loans: what Australian households actually pay.',
    lines: {
      highRising: 'If you have a home loan, repayments sit high and are still rising.',
      highEasing: 'The average home-loan rate is high but easing: relief reaching variable loans with a lag.',
      typical: 'The average home-loan rate sits in its usual range for the decade.',
      low: 'Home-loan rates are cheap by recent standards: the easy setting for housing.',
    },
    whatItIs:
      'The average interest rate on outstanding owner-occupier home loans across all lenders, from the RBA’s F6 table: not the advertised rate, but the one households actually pay.',
    whyItMatters:
      'Home loans are the biggest debt of most Australian households; this average moves with each RBA decision and refinancing wave.',
    tendedToMean:
      'The 2022–24 rate climbs pushed it from record lows toward multi-decade highs; easing tends to arrive only as loans reprice and refinance.',
    cantTell:
      'Monthly, published about a month late, and an average: your own rate depends on your loan, lender and fixed or variable mix.',
    forYou:
      'If you hold a variable loan, this is the crowd you travel with; if fixed, it is the rate your loan eventually resets toward.',
  },
  'au-deposit-rate': {
    name: 'Savings rates (new term deposits)',
    ticker: 'RBA F4.1',
    oneLiner:
      'The average rate banks pay on new household term deposits: the rate a saver shopping today can get.',
    lines: {
      highRising: 'New term-deposit rates are high and rising: the setting that usually means more interest for savers.',
      highEasing: 'Term-deposit rates are high but easing.',
      typical: 'New term-deposit rates sit in their usual range.',
      low: 'New term-deposit rates are low: thin returns for cash savers.',
    },
    whatItIs:
      'The weighted-average paid rate on new household term deposits, monthly from the RBA’s F4.1 table (the series starts July 2019, the table’s full extent).',
    whyItMatters:
      'It follows the RBA cash rate: term deposits and savings rates usually pay more after RBA hikes and less after cuts.',
    tendedToMean:
      'Term-deposit rates went from near zero in 2020–21 to multi-year highs through the 2022–24 hiking cycle, tracking the cash rate with a short lag.',
    cantTell:
      'An average across banks and terms: the best advertised rates (often online savings accounts and smaller lenders) sit above it, and it says nothing about locking money away.',
    forYou:
      'The savings twin of the home-loan card: what the crowd earns on new term deposits while borrowers pay the loan card’s rate.',
  },
  'au-wage-growth': {
    name: 'Wage growth vs a year ago',
    oneLiner:
      'How fast Australian wages are rising, compared with a year ago, by the wage price index.',
    lines: {
      highRising: 'Wages are growing faster than usual: the reading that usually means pay packets catching up.',
      highEasing: 'Wage growth is high but easing.',
      typical: 'Wage growth sits in its usual range for the decade.',
      low: 'Wage growth is weak: if prices rise faster, an hour’s pay covers less each year.',
    },
    whatItIs:
      'The 12-month change in the ABS Wage Price Index: the cost of an hour of labour, excluding bonuses, quarterly.',
    whyItMatters:
      'The card compares it with inflation: when wages grow slower than prices, an hour’s pay covers less year by year.',
    tendedToMean:
      'Wage growth above inflation marked the strong 2023–24 stretch; the long flat 2010s matched weak pay and weak prices together.',
    cantTell:
      'An average across all jobs: your own pay can move very differently, and bonuses are excluded.',
    forYou:
      'The scoreboard for whether the average pay packet is keeping up with the average price rise: context, not a personal forecast.',
  },
  'au-rent-yoy': {
    name: 'Rent growth vs a year ago',
    ticker: 'CPI: rents',
    oneLiner:
      'How fast Australian rents are rising, compared with a year ago.',
    lines: {
      highRising: 'Rents are rising unusually fast: pressure on renters’ budgets and the rental squeeze headlines.',
      highEasing: 'Rents are still rising fast, but the pace is easing.',
      typical: 'Rent growth sits in its usual range for the decade.',
      low: 'Rent growth is weak: the rare easing for renters’ budgets.',
    },
    whatItIs:
      'The 12-month change in the ABS CPI “rents” index: new and existing tenancies together, published monthly.',
    whyItMatters:
      'Rent is the biggest weekly bill for roughly a third of Australian households, and it feeds headline inflation and the RBA’s thinking.',
    tendedToMean:
      'The 2023–26 squeeze pushed rent growth to multi-decade highs as population growth met a tight supply of homes.',
    cantTell:
      'An Australia-wide average: city and regional markets can differ sharply, and existing rents move slower than new ones.',
    forYou:
      'If you rent, a fast-rising index matches a tough market at renewal time; if you own, it is background for the inflation story.',
  },
  'au-unemployment': {
    name: 'The share of Australians without work',
    oneLiner:
      'The share of Australians looking for work who cannot find it.',
    lines: {
      highRising: 'Unemployment is rising: the trend that usually makes job hunting harder and spending weaker.',
      highEasing: 'Unemployment is elevated but easing: job-market conditions slowly mending.',
      typical: 'The jobless rate sits in its usual range for the decade.',
      low: 'Jobs are plentiful: unemployment near its lows, usually good news for wages and confidence.',
    },
    whatItIs: 'The ABS Labour Force unemployment rate (monthly, table M13).',
    whyItMatters:
      'The RBA watches the labour market closely: jobs drive spending, wages and rate decisions.',
    tendedToMean:
      'Rises of half a point off a low have often marked turning points toward slowdowns.',
    cantTell:
      'Monthly and seasonally noisy; the participation rate moves it too, and averages hide regions.',
    forYou: 'The broadest single gauge of how the economy is treating households.',
  },
  'au-home-values': {
    name: 'Australian home prices',
    oneLiner:
      'The average price of Australian homes, as an index.',
    lines: {
      highRising: 'Home prices are high and rising: good for owners, harder for those trying to enter.',
      highEasing: 'Home prices are high but easing: the market cooling from its highs.',
      typical: 'Home prices are moving in their usual range for the decade.',
      low: 'Home prices are weak versus recent history: rare, and usually tied to rate squeezes or downturns.',
    },
    whatItIs:
      'The ABS residential property price index (quarterly): the average price of Australian dwellings, as an index.',
    whyItMatters:
      'Housing is the biggest asset and debt source for Australian households; prices feed wealth and confidence.',
    tendedToMean:
      'Falls have been rare and mostly brief: 2008, pockets of 2017–19, and 2022–23 with rate hikes.',
    cantTell:
      'A national average hides big city differences, and values lag actual transactions.',
    forYou: 'Background to the biggest financial decision most households make.',
  },
  'au-household-debt-arrears': {
    name: 'Australian household debt versus income',
    oneLiner:
      'How large Australian household debt is relative to income: among the world’s highest.',
    lines: {
      highRising: 'Household debt is unusually high and still building: every rate rise tends to bite harder.',
      highEasing: 'The debt burden is high but easing: household balance sheets slowly mending.',
      typical: 'Household debt sits in its usual range for the decade.',
      low: 'Household debt is low relative to income: the setting that usually softens rate impacts.',
    },
    whatItIs:
      'The household debt-to-income ratio the RBA republishes from ABS calculations (quarterly, table E2).',
    whyItMatters:
      'High debt makes household spending sensitive to every rate move: a key sensitivity the RBA weighs.',
    tendedToMean:
      'Australia has sat above 150% since the mid-2000s; trouble historically shows up in arrears with a lag after rate rises.',
    cantTell:
      'An aggregate: averages hide who actually holds the debt and how comfortably.',
    forYou: 'Context for why rate moves dominate Australian household finances.',
  },
  audusd: {
    name: 'Australian dollar vs US dollar',
    ticker: 'AUD/USD',
    oneLiner: 'The Australian dollar’s value in US cents.',
    lines: {
      highRising: 'The Australian dollar is strong and strengthening: imports and overseas travel tend to get cheaper.',
      highEasing: 'The Australian dollar is strong but easing off its highs.',
      typical: 'The Australian dollar sits in its usual range for the decade.',
      low: 'The Australian dollar is weak: overseas travel and imports dearer, exports cheaper abroad.',
    },
    whatItIs:
      'The AUD/USD exchange rate: how many US dollars one Australian dollar buys, from ECB reference rates via Frankfurter.',
    whyItMatters:
      'Australia’s key pair: it prices imports, exports and overseas travel in one number.',
    tendedToMean:
      'Historic lows (under roughly 62¢) came with global panics; sustained strength (above 80¢) with commodity booms.',
    cantTell:
      'Commodity prices, US rates and global risk sentiment all move it at once.',
    forYou:
      'A weaker dollar makes travel and imports dearer and exports cheaper; the reverse when it strengthens.',
  },
  audjpy: {
    name: 'Australian dollar vs yen',
    ticker: 'AUD/JPY',
    oneLiner:
      'The Australian dollar against the Japanese yen: the classic carry pair.',
    lines: {
      highRising: 'A firm Australian dollar against the yen: travel to Japan tends to get cheaper.',
      highEasing: 'The Australian dollar sits high against the yen but is easing.',
      typical: 'The Australian dollar–yen rate sits in its usual range.',
      low: 'The Australian dollar has fallen against the yen: the classic world de-risking signal.',
    },
    whatItIs:
      'The AUD/JPY exchange rate: how many yen one Australian dollar buys, derived from ECB reference rates.',
    whyItMatters:
      'Australian dollars are held for their yield while the yen funds that carry: sharp reversals hit both sides.',
    tendedToMean:
      'Plunges of 5% or more within weeks have marked global de-risking episodes.',
    cantTell:
      'Both central banks’ policies move it over years, not just risk sentiment this week.',
    forYou:
      'A watched risk barometer: and the rate that matters for Australian travel and shopping in Japan.',
  },
  'terms-of-trade': {
    name: 'Australia’s export prices vs import prices',
    oneLiner: 'Australia’s export prices versus its import prices.',
    lines: {
      highRising: 'Export prices are outrunning import prices: the country getting richer without shipping more.',
      highEasing: 'Terms of trade are high but easing: the mining-boom premium slowly fading.',
      typical: 'Terms of trade sit in their usual range for the decade.',
      low: 'Import prices are outrunning export prices: the squeeze on national income, budgets and the dollar.',
    },
    whatItIs:
      'The ABS terms-of-trade index: export prices divided by import prices, quarterly.',
    whyItMatters:
      'Rising terms of trade make the country richer without shipping anything more; falling ones squeeze national income.',
    tendedToMean:
      'The mining booms (2000s, 2020–21) sent it soaring; the GFC and the 2012–15 commodity slide sank it.',
    cantTell:
      'Slow, quarterly, and a rear-view measure of price shifts already felt in incomes.',
    forYou: 'The quiet driver behind Australian budget booms and busts.',
  },
  'iron-ore': {
    name: 'Iron ore price',
    oneLiner:
      'The price of iron ore: Australia’s single biggest export.',
    lines: {
      highRising: 'Iron ore is expensive and rising: usually good news for mining jobs, budgets and the dollar.',
      highEasing: 'Iron ore is expensive but easing: the boom premium slowly fading.',
      typical: 'Iron ore sits in its usual range for the decade.',
      low: 'Iron ore is cheap versus recent history: pressure on mining profits, budgets and the dollar.',
      jumping: 'Iron ore has jumped unusually fast: often Chinese news; wait before reading a trend.',
    },
    unitNote: 'US dollars per dry metric tonne unit',
    whatItIs:
      'The World Bank’s monthly spot price for iron ore delivered to China, priced per dry metric tonne unit.',
    whyItMatters:
      'Iron ore funds Australian miners, budgets and the broader terms of trade.',
    tendedToMean:
      'Sub-$60 stretches marked Chinese slowdowns; the 2020–21 surge above $200 marked stimulus booms.',
    cantTell:
      'China’s property and stimulus cycle dominates: forecasts for this price are famously poor.',
    forYou: 'A big swing factor in Australian government revenue and the AUD.',
  },
  'gold-aud': {
    name: 'Gold price in Australian dollars',
    ticker: 'gold in A$',
    oneLiner: 'The world gold price in Australian dollars.',
    lines: {
      highRising: 'Gold is expensive in Australian dollars and rising: coins, jewellery and local metal cost more.',
      highEasing: 'Gold in Australian dollars is high but easing off its highs.',
      typical: 'Gold in Australian dollars sits in its usual range for the decade.',
      low: 'Gold is cheap in Australian dollars: the local metal at a rare discount.',
    },
    whatItIs:
      'The world gold price converted into Australian dollars: the live ounce price from a metals feed times the AUD exchange rate.',
    whyItMatters:
      'For coins, jewellery and gold funds priced in Australia, this (not the US-dollar price) is the real price.',
    tendedToMean:
      'It rose through most of the 2000s and 2020s as gold climbed and the AUD varied around it.',
    cantTell:
      'It is mostly the US-dollar gold price plus the AUD/USD rate: either can move it.',
    forYou:
      'The gold price Australians actually face when pricing coins, jewellery or metal funds.',
  },
};

export const insightsCopyEn = {
  ui: {
    title: 'Insights',
    subtitle: 'What the world’s money is doing: plain-language gauges, prices and indicators.',
    updatedAgo: 'Updated {ago} · {date}',
    // I15 H4: "Data as of {date}": a daily snapshot, no seconds, honest.
    dataAsOf: 'Data as of {date}',
    dataAsOfTooltip: 'Daily snapshot, refreshed once a day.',
    progressLabel: 'Reading progress',
    loadError: 'Insights feed unavailable',
    retry: 'Try again',
    dataFrom: 'Data from an earlier snapshot ({date}): showing the last good copy.',
    summaryTitle: 'Summary',
    viewSection: 'View section',
    viewCard: 'View card',
    searchPlaceholder: 'Search {n} indicators…',
    searchLabel: 'Search indicators',
    searchClear: 'Clear search',
    // Round-2 R5: the retired word "Alert": the tier words are Needs
    // attention / Unusual; internal status ids unchanged.
    filterAll: 'All',
    filterLabel: 'Filter by tier',
    filterWarning: 'Needs attention',
    filterUnusual: 'Unusual',
    filterNormal: 'Normal',
    filterContext: 'Context',
    unusualWord: 'Unusual',
    unusualAria: 'in the top or bottom 10% of its own 10-year range',
    // R28: the band-position words (the {bandPos} token's rendered form).
    bandPosInside: 'inside',
    bandPosAbove: 'above',
    bandPosBelow: 'below',
    resultsShown: '{shown} of {total} shown',
    clearFilters: 'Clear filters',
    noMatches: 'No indicator matches these filters.',
    // Round-2 R7: the per-group collapse. R30: honest plurals ("See all
    // 1 indicators" was wrong) and what the button actually does.
    seeAll: 'Show all {n} hidden indicators',
    seeAllOne: 'Show 1 hidden indicator',
    showFewer: 'Show fewer',
    // Round-2 R15: the Tools disclosure.
    toolsLabel: 'Tools',
    toolsOpen: 'Open tools',
    toolsClose: 'Close tools',
    toolsShortcuts: 'Keyboard shortcuts',
    toolsSearch: 'Search',
    toolsFilter: 'Filter',
    toolsDownload: 'Download',
    // I10: the personal watchlist: pinned items render in their own
    // section above the groups; pins persist across visits.
    pinnedTitle: 'My watchlist',
    pinnedBadge: 'Pinned',
    pinAction: 'Add to watchlist',
    unpinAction: 'Remove from watchlist',
    // H1: verdict meters. Round-2 R2: the reason line is COMPUTED from the
    // gauge steps (fixed table): never a static per-label sentence.
    // Step 3 L3-01 (2026-10-16): the spec's label rename — the hero is a
    // SUMMARY of the gauges, never a verdict of its own.
    heroTitle: 'Summary of the gauges below',
    verdictStepAria: '{section}: {label}, step {step} of 4',
    verdictMeterLabel: 'Reading on a four-step scale',
    // Round 42 (owner): the computed reason sentence ("2 of 5 areas are
    // Stressed: … The rest are Stable") and the calm line are RETIRED —
    // they repeated, word for word, what the grouped status rows now say
    // (the roast: "it's everything and nothing because it's confusing").
    // The grouping IS the sentence now; heroReason stays in config, pinned
    // by its own tests.
    heroGaugesLabel: 'The gauges behind this verdict',
    inAlert: '{warnings} of {voting} indicators need attention',
    /** The count line's variant when the world-markets signal is raised
     * (world-markets spec §5.3 / build step 9: the section signal appears
     * in the transparent count AND in alerts) — the markets join the count
     * as one more attention item, named in plain words. */
    noSummary: 'Not enough voting data to read the gauges yet.',
    excludedNote: '{n} items set aside: stale or missing (see “How this is calculated”).',
    howCalculated: 'How is this calculated?',
    // Round 42 (owner): the long verdict-rule paragraph and the how-link
    // hide behind quiet "?" tips — the pill labels below are their
    // accessible names; the panels carry the full text.
    verdictRuleLabel: 'How the verdict word is chosen',
    explainerFullLink: 'Read the full explainer',
    // Fix spec A-08 (2026-10-14): the run-status block on About this data.
    statusTitle: 'Status of this data',
    statusTimeLocale: 'en-AU',
    statusGeneratedAt: 'Snapshot generated {time} ({tz}); UTC time is shown in the card details.',
    statusFailedSources: 'Sources that failed on the last refresh:',
    statusAllSourcesOk: 'Every source refreshed on the last run.',
    statusFlaggedTests: 'Validation tests that flagged readings (held on their last good values):',
    statusStaleCards: 'Cards not updated within their maximum age:',
    statusNoStaleCards: 'Every card is within its maximum age.',
    howCalculatedHide: 'Hide how this is calculated',
    explainerIntro:
      'Each question group is a gauge: the share of its voting indicators currently in their alert zone sets the gauge’s step (0 → step 1, up to ⅓ → 2, up to ⅔ → 3, more → 4).',
    // Step-1 audit item E1: the verdict rule, displayed — the SAME count
    // mapping for both regions (the code: gauges.ts sectionVerdictStep).
    verdictRule:
      'How the verdict word is chosen: each area’s gauge steps 1–4 from how many of its scored indicators need attention. Critical: at least two areas critical, or every area stressed or worse. Stressed: at least two areas stressed or worse, or most areas cautious or worse. Cautious: any area cautious or worse. Stable: every area calm.',
    explainerScore:
      'A region’s verdict word comes from a single count rule (shown above this line), the same for both regions: the word can never disagree with the areas it names.',
    explainerLabels: 'The labels describe conditions, not advice: Currena never recommends actions.',
    explainerStale: 'Stale or missing items are excluded from every gauge and count, and shown greyed with their last date.',
    // Step-1 audit item G5: the backtest sentence appears ONCE and states
    // its small sample ("only three crises" — the reader deserves the N).
    explainerBacktest:
      'Thresholds were backtested against three crises (2008, 2020 and 2022), a small sample; the tables live in the project docs.',
    // H1 note: the Australia-first reading order with a swap setting.
    // Round-2 D7: the swap is RETIRED: Global is always first.
    // H2 → R3: needs-attention tiles with numbers under each verdict.
    attentionTilesLabel: 'Needing attention now',
    attentionTileMore: '+{n} more',
    attentionTileRule: 'Rule: {rule} · now {value}',
    // H3 → R4: the biggest move: one line, always with its reason.
    bigMoverTitle: 'The biggest move right now',
    bigMoverReason: 'unusually large for this indicator',
    bigMoverMove: '{change} over 30 days',
    bigMoverView: 'View this indicator',
    // H5: what changed: one line. (Round-2 R16: the hero no longer names
    // the next scheduled event: “Next up” lives once, below the indicators.)
    whatChangedLine: 'This week: {changes}',
    quietWeekLine: 'A quiet week: no indicator changed state.',
    // H6: the next-up strip.
    comingUpTitle: 'Next up',
    noEvents: 'No key dates recorded yet: this calendar is maintained by hand.',
    daysAway: '{n} days away',
    today: 'Today',
    tomorrow: 'Tomorrow',
    fullCalendar: 'Full calendar',
    hideCalendar: 'Show less',
    gregorianDate: 'Gregorian date: {date}',
    sameEventSeries: '{title} · meeting {n}',
    // I10: RFC 5545 calendar export of the upcoming key dates.
    icsDownload: 'Download calendar (.ics)',
    // PB1: the prices board.
    pricesTitle: 'Prices',
    pricesSubtitle: 'Prices — oil is scored; gold, silver and Bitcoin are context.',
    pricePositionLow: 'cheap',
    pricePositionTypical: 'normal',
    pricePositionHigh: 'expensive',
    // Owner sketch (17 Oct 2026): the price card's FOUR change windows —
    // daily / weekly / monthly / quarterly — and its fact bullets.
    // days7/days30 stay for the alert/hero/compact change rows.
    priceChangeDaily: 'Daily',
    priceChangeWeekly: 'Weekly',
    priceChangeMonthly: 'Monthly',
    priceChangeQuarterly: 'Quarterly',
    descriptionLabel: 'Description',
    // 2026-10-25b (asset-cards polish): one consistent «X گذشته» label
    // family for every change window on the prices cards — the old mix
    // ('6-month change' / '30 days') read as different kinds of numbers.
    stat6mChange: 'Past 6 months',
    stat1yChange: 'Past 1 year',
    stat52wRange: '52-week range',
    rangeJoin: '–',
    btcRatiosLabel: 'Context only, not used in signals',
    // Step-1 audit item C2: the ratios inverted for display — "One bitcoin
    // buys 19.6 oz of gold" (the stored fraction is oz-per-bitcoin; the old
    // "Gold per Bitcoin: 0.0509" label read as its own inverse).
    btcBuysGold: 'One bitcoin buys {value} oz of gold',
    btcBuysSilver: 'One bitcoin buys about {value} oz of silver',
    goldAudLine: 'In Australian dollars: {value}',
    copperUnitNote: 'converted from the live US price',
    pricesAsOf: 'as of {date}',
    // Financial-asset-cards spec pack (02–05): the seven-day trend story,
    // the evidence-based briefing, the «جزئیات بیشتر» disclosure and its
    // detail rows. Wording follows spec 03's tables verbatim.
    past7days: 'Past 7 days',
    trendUp: 'Recent movement has been upward',
    trendDown: 'Recent movement has been downward',
    trendRange: 'Recent movement has been mostly range-bound',
    trendMixed: 'No clear direction is evident',
    trendInsufficient: 'Not enough data to assess the trend',
    trendUnavailable: 'Seven-day trend unavailable',
    trendIncomplete: 'Data for this period is incomplete; the chart may not show the full picture.',
    sparklineAria: '{asset} price movement over the past seven days: {change}',
    dailyChangeLabel: 'Daily change',
    dailyChangeBasis: 'vs the previous stored close',
    updatedUnknown: 'Update time is unknown.',
    dataDelayed: 'Data may be delayed.',
    priceUnavailableCard: 'Price is currently unavailable.',
    sumUnavailable: 'There is not enough data to provide a reliable summary.',
    sumUp: '{asset} has risen over the past seven days.',
    sumDown: '{asset} has declined over the past seven days.',
    sumRange: '{asset} has moved mostly within a range over the past seven days; the available data shows no clear direction.',
    sumMixed: 'Movement of {asset} has been uneven over this period, so the available data does not show a clear direction.',
    sumHedge: 'This describes the selected period and does not, by itself, establish the next move.',
    sumBtcHedge: 'This movement may not persist, and short-term volatility can remain high.',
    sumBtcMixed: '{asset} has fluctuated over the past seven days.',
    sumOilDrivers: 'Explaining the drivers would require supporting evidence about supply, demand, and market conditions.',
    moreDetails: 'More details',
    changesLabel: 'Changes',
    change30dLabel: 'Past 30 days',
    change90dLabel: 'Past 90 days',
    // 2026-10-25b (asset-cards polish, task §4/§6): the card header's
    // title + measurement-basis subtitle. The unit is VERIFIED against the
    // served instrument: gold/silver per troy ounce (XAU/XAG spot or the
    // GC=F/SI=F futures refresh — both quote per troy ounce), Brent per
    // barrel (EIA spot / BZ=F), Bitcoin in US dollars per coin.
    priceCardTitles: {
      'gold-usd': 'Gold price',
      'silver-usd': 'Silver price',
      brent: 'Brent crude oil',
      'btc-usd': 'Bitcoin price',
    } as Partial<Record<string, string>>,
    priceCardUnits: {
      'gold-usd': 'per troy ounce',
      'silver-usd': 'per troy ounce',
      brent: 'per barrel',
      'btc-usd': 'per bitcoin',
    } as Partial<Record<string, string>>,
    // 2026-10-25b (task §9): the expanded panel's semantic sections.
    sectionChanges: 'Price changes',
    section52w: 'Price range over the past 52 weeks',
    sectionRecords: 'Historical price records',
    sectionReferences: 'Price vs reference levels',
    sectionSource: 'Data source & freshness',
    // Task §9C: the records are 10-year-window peaks (computePeaks reads
    // the 10-year Yahoo histories; Brent's own series is capped to the
    // same window) — the label must not claim an all-time record.
    priceBelow10yHigh: '{pct} below its 10-year high',
    // Task §10 (instrument consistency): these coverage notes render ONLY
    // when the SERVED attribution actually is that instrument — the card
    // checks reading.sourceName (the live merge rewrites it to the Yahoo
    // futures attribution when a fresher quote wins).
    priceFuturesNote: 'The displayed price is the front-month futures contract, not the spot price.',
    priceBrentBlendNote: 'The Brent series is the EIA spot price, extended past its last published date by the BZ=F futures contract.',
    priceFetchedAt: 'Price fetched: {time}',
    // One line when both companion ratios exist (fa's second ratio is a
    // sentence continuation — two separate bullets read as a fragment).
    btcCompanions: 'One bitcoin buys {gold} oz of gold, or about {silver} oz of silver.',
    // The 10-year price LEVEL, precisely identified (the clarified
    // «بالا»): a percentile band of the asset's own decade, not a trend.
    priceLevelLabel: 'Price level vs 10-year range',
    priceLevelHigh: 'High — top 20% of the decade',
    priceLevelTypical: 'Within its usual range',
    priceLevelLow: 'Low — bottom 20% of the decade',
    priceLevelNote: 'This describes the price level relative to the asset’s own ten-year history — not its direction.',
    // 2026-10-25b: 10-year-window record (see computePeaks) — was
    // 'Historical high', which claimed more coverage than the data has.
    statRecordHigh: '10-year high',
    priceSourceLabel: 'Data source',
    priceSubjects: {
      'gold-usd': 'Gold',
      'silver-usd': 'Silver',
      brent: 'Oil',
      'btc-usd': 'Bitcoin',
    } as Partial<Record<string, string>>,
    // Step-1 B5/C6: the card's data-date + change-window vocabulary.
    dataFor: 'data for {date}',
    dataForStale: 'data for {date}, not updated since',
    releasedOn: 'released {date}',
    sincePreviousRelease: 'since previous release',
    // Step-2 add-list §B1: the policy cards' LAST DECISION (exact date +
    // size, the engine's `lastChange` — not a 30-day window) and the RBA
    // card's next decision date from the calendar.
    lastChangeLine: 'Last change: {change} on {date}',
    nextDecisionLine: 'Next RBA decision: {date}',
    staleTag: 'Stale',
    // Fix spec A-03/A-04 (2026-10-14): the held-value tag — the validation
    // suite flagged the fresh value, the card holds its last good reading.
    checkPendingTag: 'Check pending',
    checkPendingLine: 'Check pending — {reason}',
    // Fix spec A-02 (2026-10-14): the needs-attention line is GENERATED from
    // the reading's rule and value (the hand-written meanings are gone).
    attentionLine: 'Now {value} — in the zone its rule watches: {rule}.',
    // Fix spec A-07 (2026-10-14): the scoring-rule version rides the card.
    ruleVersionLine: 'Rule version {v} (changed {date}).',
    // Fix spec B-05 (2026-10-14): newer data is due today, not yet in.
    nextReleaseToday: 'Next release: today.',
    // Fix spec B-06 (2026-10-14): the policy cards' two dates.
    decidedEffectiveLine: 'Decided {decided} · effective {effective}',
    belowPeak: '{pct}% below its 10-year peak',
    // Fix spec B-01: the record line names the peak, its date and its basis.
    belowPeakRecord: '{pct}% below its record {value} on {date} ({basis})',
    peakBasisHigh: 'highest daily high',
    peakBasisClose: 'highest daily close',
    // Fix spec B-15: the copper/gold card's value is the monthly average.
    monthlyAverageNote: 'This is the monthly average, not a live price.',
    // Fix spec B-19: the highest-since line for long-history series.
    highestSince: 'highest since {year}',
    // Fix spec B-10: the gap card's mixed-dates tag.
    datesDiffer: 'dates differ',
    gapLegDates: '{a} ({aDate}) minus {b} ({bDate})',
    pricesUpdated: 'prices updated {time}',
    // Step-1 A3 + Step-2 §B2: the companion note line per parent card —
    // core CPI beside the headline, the US 10-year beside the AU one.
    companionNotes: {
      'us-cpi-yoy': 'The gap between them is mainly energy.',
      'au-10y': 'shown for comparison; the US card carries its own story',
    } as Partial<Record<string, string>>,
    // Step-2 §B5: the VIX card's interim presentation note (calm/nervous
    // words are the Step-3 verdict rules' deliverable).
    vixNote:
      'The calm/nervous word thresholds are computed from this series’ own history and arrive with the next update; today the value and its 10-year position tell the story.',
    // Step-2 §A (the card spec): the facts block on the details panel.
    updatesLabel: 'Updates',
    cadence: {
      daily: 'daily',
      weekly: 'weekly',
      monthly: 'monthly',
      quarterly: 'quarterly',
      'per-change': 'after each decision',
      manual: 'as released (manual entry)',
    },
    staleAfterLine: 'shows “Stale” after {n} days',
    staleNever: 'never goes stale by age (it changes only on decisions)',
    fetchedLabel: 'Fetched',
    scoredFact: 'Scored: counts toward its area’s verdict',
    contextOnlyFact: 'Context only: never counts toward a verdict',
    // L1: the lane switch.
    laneLabel: 'Region',
    laneAustralia: 'Australia',
    laneGlobal: 'Global',
    laneHint: 'Switch region',
    // L2: gauge group headings.
    gaugeStepAria: '{question}: {label}, step {step} of 4',
    gaugeNoReading: 'not enough data to read',
    mixedEvidenceTag: 'mixed evidence',
    // F1/F2: cards + rows.
    expand: 'Details',
    collapse: 'Hide details',
    detailsButton: 'Details',
    position10y: '10-year position',
    positionValue: '{pct} of the past 10 years were lower than this',
    positionNoData: 'Not enough history to place this value.',
    positionLow: 'low',
    positionTypical: 'typical',
    positionHigh: 'high',
    alertZoneLabel: 'Rule zone',
    rangeEndLow: 'lowest in 10 years',
    rangeEndHigh: 'highest in 10 years',
    days7: '7-day',
    days30: '30-day',
    updatedOn: 'Updated {date}',
    // Owner request (sources off the cards): the unused `sourceLabel` died
    // with the card-face source labels; `viewSource` stays for the details
    // panel footer link.
    viewSource: 'View source',
    shareCard: 'Share this card',
    shareCopied: 'Link copied',
    // F5: the details panel.
    panelSuffix: 'Details',
    panelClose: 'Close details',
    chartTitle: 'The last {range}',
    range10y: '10 years',
    range5y: '5 years',
    range1y: '1 year',
    // Round 33: the Conditions strip's own per-metal trend chart — the
    // quarter window joins the reader-facing zooms; the chips sit under
    // the chart that fills the chip's white space.
    rangeQuarter: 'Quarter',
    // Step-1 audit item C11: the delta's VISIBLE window word — "−5.5% over
    // the past quarter" is clearly a measured, past change ("−5.5%
    // Quarter" read like a forecast).
    rangePastQuarter: 'over the past quarter',
    rangePast1y: 'over the past year',
    rangePast5y: 'over the past 5 years',
    stripChartAria: 'Price history for {metal}, the last {range}',
    stripChartLabel: 'Price history',
    // Round 34: the money rows' mini charts — the same structure, keyed
    // by the indicator's own name.
    trendChartAria: 'Price history for {name}, the last {range}',
    chartRangeLabel: 'Chart time range',
    chartTable: 'Chart data',
    chartColDate: 'Date',
    chartColValue: 'Value',
    chartLowest: 'Lowest',
    chartHighest: 'Highest',
    chartLatest: 'Latest',
    chartStart: 'Start',
    noHistory: 'No chart history for this card yet.',
    historyLoading: 'Loading chart…',
    historyError: 'The chart could not be loaded.',
    unavailableCard: 'No data right now',
    na: 'n/a',
    lastKnownValue: 'Last known: {value} on {date}',
    staleSince: 'Last value on {date}: shown greyed and excluded from all gauges.',
    noHistoryStatus: 'Too little history to score this indicator yet.',
    ruleTitle: 'Needs attention when',
    infoOnly: 'Info only: shown for context, never votes.',
    whatItIs: 'What it is',
    whyItMatters: 'Why it matters',
    tendedToMean: 'What it has tended to mean',
    cantTell: 'What it can’t tell you',
    forYou: 'What it means for you',
    chartAria: '{name}, 10-year history: lowest {low}, highest {high}, latest {latest}.',
    // P1: the sticky section nav.
    navStatus: 'Status',
    navPrices: 'Prices',
    // I17 (v2): the Together pill joins the row with the connection cards.
    navTogether: 'Together',
    navIndicators: 'Indicators',
    navAbout: 'About',
    navLabel: 'Sections',
    // N1/N2: notices + the single disclaimer line.
    disclaimerBar: 'General information only: not advice.',
    aboutTitle: 'About this data',
    // R25: the quiet, collapsible About section.
    aboutShowDetails: 'Show details',
    aboutHideDetails: 'Hide details',
    aboutCreditsLine:
      'Sources: the US Federal Reserve (FRED), the European Central Bank, the Reserve Bank of Australia, the Australian Bureau of Statistics (CC BY 4.0), the World Bank, Frankfurter, gold-api.com, and EODHD with Yahoo Finance for the world stock markets.',
    aboutGeneralInfo: 'General information only: not financial advice.',
    aboutSourcesTitle: 'Sources',
    // Step-1 audit item G3 + Step-2: the accurate list — EODHD, Yahoo
    // Finance and gold-api ride beside the official publishers; the VIX is
    // Cboe data redistributed through FRED (© Cboe); the iron-ore price is
    // context only and never votes. Owner request (sources off the cards):
    // every source is named and linked HERE and in the details panel —
    // never on the card faces.
    aboutSourcesBody:
      'Sources: official publishers, namely the US Federal Reserve (FRED) and the US Bureau of Labor Statistics via FRED, the European Central Bank, the Reserve Bank of Australia, the Australian Bureau of Statistics (CC BY 4.0) and the World Bank, plus market-data providers Frankfurter (ECB reference rates), gold-api.com, EODHD and Yahoo Finance (world stock markets, live commodity quotes, currencies). The VIX fear gauge is Cboe data redistributed through FRED (© Cboe). Iron ore is shown for context and never counts toward the verdicts. Each source is named and linked in the details panel and in this section, never on the cards. Free-tier licences are personal use; they are being reviewed before any commercial use.',
    fredNotice:
      'This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis.',
    // Round 24 (roast): the English notice sits on its OWN dir=ltr line.
    // fa carries the Persian explanation on the next line; en needs no
    // second line (empty string renders nothing).
    fredLocalNote: '',
    fredTerms: 'FRED API terms',
    attributionTitle: 'Attribution',
    attributionRba: 'Source: Reserve Bank of Australia, 2026.',
    attributionAbs: 'Source: Australian Bureau of Statistics, licensed under CC BY 4.0.',
    attributionEcb: 'ECB reference rates, served by Frankfurter. Source: European Central Bank.',
    attributionBasket:
      'The Currena dollar basket is computed from ECB reference rates: it is not the official DXY index.',
    // Round 44 (owner): the world-markets section's source line, relocated
    // from the section itself to the page footer with the other credits.
    attributionEodhd:
      'Source: EODHD (Yahoo Finance as backup). End-of-day values in each market’s local currency.',
    aboutScheduleTitle: 'Update schedule',
    aboutScheduleBody:
      'A scheduled job refreshes every source once a day (04:20 UTC) and writes one precomputed snapshot; the page you are reading serves that snapshot. Daily series update daily, monthly and quarterly ones when their publisher releases. The world stock market values refresh on their own weekday-evening schedule (23:30 UTC).',
    aboutRulesTitle: 'How the tiers are decided',
    aboutRulesBody:
      'Needs attention: the indicator’s one fixed, published rule has fired (the rule is shown on its card). Unusual: no rule fired, but the latest value sits in the top or bottom 10% of its own 10-year range. Both tiers add context to the gauges.',
    disclaimerTitle: 'Full disclaimer',
    disclaimerBody1:
      'Insights is general information about economic and market indicators. It is not financial advice, and nothing here recommends any action on any asset.',
    disclaimerBody2:
      'Indicators describe the past and present, not the future. Data can be delayed, revised or wrong. Before acting on money decisions, check primary sources and consider qualified advice: Currena is not licensed to provide it.',
    // I13: the snapshot CSV export (About this data → download button).
    downloadCsv: 'Download the data (CSV)',
    // 2026-10-16 owner request: the one-file "download all data" export
    // (MD / TXT / CSV / XLSX) — the button lives beside Tools in the header.
    exportAllLabel: 'Download data',
    exportAllTitle: 'All the data on this page',
    exportAllNote: 'One file with every section of this page.',
    exportFormatMd: 'Markdown (.md)',
    exportFormatTxt: 'Plain text (.txt)',
    exportFormatCsv: 'CSV spreadsheet (.csv)',
    exportFormatXlsx: 'Excel workbook (.xlsx)',
    exportSection: 'Section',
    exportDetail: 'Details',
    exportPosition: 'Position',
    exportColDate: 'Date',
    exportRuleVersion: 'Rule version: {v}',
    exportVerdictCounts: '{warning} of {voting} in warning',
    // Step 3 L2-02: the price row's 200-day average line.
    ma200Above: '{pct} above its 200-day average',
    ma200Below: '{pct} below its 200-day average',
    // Step 3 L2-03: the US shares in Australian dollars box.
    usAudTitle: 'US shares in Australian dollars',
    usAudLevel: '{name}: {usd} · {aud} in AUD',
    usAudSameDate: 'both prices from the same date',
    usAudDatesDiffer: 'dates differ — the AUD view needs the same date',
    usAudChange: '1 month: {usd} in USD · {aud} in AUD · exchange-rate effect {fx}',
    // Step 3 §2.2 AC-03: the private gate's neutral state + sign-in form.
    privateTitle: 'Private page',
    privateBody:
      'This page is private. Its information is available to the owner only.',
    privatePasswordLabel: 'Password',
    privateSubmit: 'Sign in',
    privateWrong: 'That password did not open the page.',
    // Defect E-03: the futures wording on the Brent/gold/silver detail lines.
    exportFuturesNote: 'futures (front-month contract), not spot',
    // Defect E-23: the indicators table's audit columns + yes/no words.
    exportColPublished: 'Published',
    exportColStale: 'Stale',
    exportColSourceUrl: 'Source URL',
    exportColLicence: 'Licence',
    exportColPrivateOnly: 'Private only',
    exportColPublicOk: 'Public display OK',
    exportColRuleVersion: 'Rule version',
    exportColThresholds: 'Thresholds (rule JSON)',
    exportYes: 'yes',
    exportNo: 'no',
    exportStaleWithAge: 'yes ({days} days old)',
    // Defect E-24: the price table's peak columns.
    exportColPeak: 'Peak',
    exportColPeakDate: 'Peak date',
    exportColPeakBasis: 'Peak basis',
    exportColBelowPeak: 'Below peak %',
    changedThisWeekTitle: 'Changed this week',
    csvHint:
      'Every indicator on this page with its value, changes and source: plain numbers, ready for any spreadsheet.',
    csvColId: 'ID',
    csvColName: 'Indicator',
    csvColTicker: 'Ticker',
    csvColValue: 'Value',
    csvColUnit: 'Unit',
    csvColStatus: 'Status',
    csvColChange7d: '7-day change',
    csvColChange30d: '30-day change',
    csvColPosition10y: '10-year position',
    csvColAsOf: 'As of',
    csvColUpdated: 'Snapshot time',
    csvColSource: 'Source',
    // I13: j/k card navigation hints (FilterBar, desktop only).
    keyboardHints: 'Keyboard:',
    keyboardSearch: 'search',
    keyboardNext: 'next card',
    keyboardPrev: 'previous card',
  },

  /* ------------------------------------------------------------------ *
   * World stock markets (insights-world-markets-spec.md §7 + §8, verbatim)
   * ------------------------------------------------------------------ */
  markets: {
    /** The editorial market-briefing header (the 2026-10-18 world-indices
     * handoff round): the owner-directed title + descriptive label, the
     * provenance descriptor, and the last-close badge. "Indices", never
     * "exchanges"; "last available close", never "live" (02-ui-spec §3.1). */
    title: 'The pulse of world markets',
    sectionLabel: 'World stock indices',
    subtitle: 'How selected stock indices performed to the last trading close',
    lastCloseBadge: 'Latest data · end of trading day',
    asOf: 'as of {date}',
    /** Regional groups, east to west (the trading day's order). */
    groups: { asia: 'Asia-Pacific', europe: 'Europe', americas: 'Americas' },
    /** The period radiogroup (02-ui-spec §3.3, handoff round): daily,
     * weekly, monthly, quarterly — the four horizons the stored contract
     * actually carries. The 52-week-high distance is secondary context,
     * not a period; an annual/YTD horizon does not exist in the data
     * contract and must not appear here. */
    viewSwitchAria: 'Choose the performance period for the indices',
    viewDaily: 'Daily',
    viewWeekly: 'Weekly',
    viewMonthly: 'Monthly',
    viewQuarterly: 'Quarterly',
    /** The list / performance-map switch (02-ui-spec §3.6, desktop). */
    displaySwitchAria: 'Choose how the indices are shown',
    viewList: 'List',
    viewHeatmap: 'Performance map',
    heatmapLegendLabel: 'Intensity is relative to the selected period',
    heatmapValueAria: '{name}, {country}: {value} over {period}',
    noReadingAria: 'no data for this period',
    /** The focal verdict box's words (owner round 44) — market-speak on the
     * page's four-step instrument: step 1 Bullish (calm, most markets up
     * over 3 months), 2 Mixed (calm, no clear direction), 3 Mixed with the
     * in-correction count (the needs-attention signal — Step-1 audit E2:
     * never a section-wide "Correcting" while most markets are calm; the
     * dedicated word returns with the Step-3 verdict rules), 4 Bearish
     * (the unusual signal). */
    verdictBullish: 'Bullish',
    verdictMixed: 'Mixed',
    verdictCorrecting: 'Correcting',
    verdictBearish: 'Bearish',
    verdictAria: 'World stock markets verdict: {label}, step {step} of 4',
    /** Step-1 E2: the attention tier's count line beside the word. */
    inCorrectionCount: '{n} of {count} markets in correction',
    /** Market breadth (02-ui-spec §3.2): counts of indices up / down /
     * flat over the SELECTED period, computed from raw values; the
     * below-52w-high line is separate secondary context. */
    breadthPeriod: '{period} performance',
    breadthUp: 'Indices up',
    breadthDown: 'Indices down',
    breadthFlat: 'Flat',
    coverageNote: '{count} of {total} indices carry this period.',
    belowHighLine: '{n} of {count} indices are at least 10% below their 52-week high',
    /** The two featured movers (02-ui-spec §3.4): true extrema of the
     * selected period, never a fake winner. */
    moverGain: 'Biggest gain',
    moverLoss: 'Biggest fall',
    moverPeriodLabel: 'Selected period: {period}',
    moversNone: 'No data for this period yet.',
    /** Quiet-by-default tile tag (§6.3): correction/bear markets only. */
    tileTagBelow: '{x}% below 52-week high',
    /** Step-1 F5: the at-high tag — every tile carries its 52-week distance. */
    atHighTag: 'At its 52-week high',
    /** Step-1 A7: a market more than one trading day behind the freshest
     * close wears this tag (provider lag, honestly named). */
    delayedTag: 'Delayed',
    /** Step-1 F4: returns are in each market's own currency. */
    localCurrencyNote: 'Returns in each market’s local currency.',
    /** Status words (§8.2) — the L2-01 stock-state convention (defect E-22):
     * the word reads from the distance below the 52-week high (closing
     * basis): within 5% Near its high, 5–10% Pullback, 10–20% Correction,
     * 20% or more Bear market. Common market conventions, stated in the
     * section's how-it-is-calculated copy. */
    statusNearHigh: 'Near its high',
    statusPullback: 'Pullback',
    statusCorrection: 'Correction',
    statusBear: 'Bear market',
    /** Trend words (§8.1). */
    trendUp: 'Up',
    trendFlat: 'Flat',
    trendDown: 'Down',
    /** Old-data chip (§8.2). */
    oldData: 'Old data · {date}',
    /** Table disclosure (§8.2). */
    showTable: 'Show full table',
    hideTable: 'Hide table',
    tableLabel: 'All world stock markets',
    thMarket: 'Market',
    thToday: 'Today',
    thWeek: '1 week',
    thMonth: '1 month',
    th3m: '3 months',
    thFromHigh: 'From 52-week high',
    thTrend: 'Trend',
    thStatus: 'Status',
    thClose: 'Last close',
    /** States (§6.6). */
    empty: 'Market data is being prepared. Check back after the next daily update.',
    collapsedStale:
      'World stock market data is old; last update {date}. It returns after the next daily update.',
    // Round 44 (owner): the source line moved to the page footer (About this
    // data → the attribution list) beside every other source credit.
    /** Detail panel headings (§6.5) + numbers. */
    detailWhat: 'What it is',
    detailWhy: 'Why it matters to the world',
    detailYou: 'What it means for you',
    lastCloseLabel: 'Last close',
    high52wLabel: '52-week high',
    low52wLabel: '52-week low',
    chartLabel: '52-week chart',
    chartAria: 'Closing values over the last 52 weeks',
    chartValueAria: '{date}: {value}',
    /** Takeaway templates (§8.3) — generated from the numbers, never free
     * text. {count} is the live row count (16 once populated). */
    takeawayCalm: '{up} of {count} markets rose today. None is far below its 52-week high.',
    takeawaySome: '{n} of {count} markets are 10% or more below their 52-week high, mostly in {group}.',
    takeawayHeavy: '{n} of {count} markets are 10% or more below their 52-week high. The fall is widespread.',
    takeawayShock: 'A sharp one-day fall hit {k} markets.',
    /** Hero integration (§5.3): the section signal joins the Global verdict's
     * attention module when raised. */
    heroAlertAttention:
      'World stock markets · Needs attention: {n} of {count} markets are 10% or more below their 52-week high.',
    heroAlertUnusual:
      'World stock markets · Unusual: {n} of {count} markets are 10% or more below their 52-week high.',
    /** CSV export columns (the Tools menu, §6.4). */
    csvColMarket: 'Market',
    csvColToday: 'Today %',
    csvColWeek: '1 week %',
    csvColMonth: '1 month %',
    csvCol3m: '3 months %',
    csvColFromHigh: 'From 52-week high %',
    csvColTrend: 'Trend',
    csvColStatus: 'Status',
    csvColClose: 'Last close',
    csvColAsOf: 'As of',
    csvColSource: 'Source',
    csvColHigh52w: '52-week high',
    csvColLow52w: '52-week low',
    csvDownload: 'World markets CSV',
    /** Per-market context content (§7, verbatim). */
    entries: {
      n225: {
        name: 'Nikkei 225',
        latin: 'Nikkei 225',
        country: 'Japan',
        what: '225 large Japanese companies, many of them exporters.',
        why: 'It moves with the yen (you already track USD/JPY): a weak yen usually helps exporters, and a sudden yen jump can hit this index hard.',
        you: 'Big yen swings can shake global markets, as happened in August 2024.',
      },
      asx200: {
        name: 'ASX 200',
        latin: 'ASX 200',
        country: 'Australia',
        what: 'The 200 largest companies on the Australian Securities Exchange, led by banks and miners.',
        why: 'Your home market. It follows iron ore, China’s demand and the big banks.',
        you: 'Most Australian super funds hold a large slice of these companies, so it affects your retirement savings.',
      },
      kospi: {
        name: 'KOSPI',
        latin: 'KOSPI',
        country: 'South Korea',
        what: 'South Korea’s main stock index, led by Samsung Electronics and SK Hynix.',
        why: 'A bellwether for the world’s computer-chip cycle and for AI hardware demand.',
        you: 'Chip demand shapes the cost and availability of phones, cars and AI services.',
      },
      hsi: {
        name: 'Hang Seng',
        latin: 'Hang Seng',
        country: 'Hong Kong',
        what: 'Hong Kong’s biggest companies, including many Chinese technology and finance firms.',
        why: 'The main door through which foreign investors buy into China, so it reacts fast to China news.',
        you: 'Sharp moves here are an early hint of how global investors feel about China.',
      },
      ssec: {
        name: 'Shanghai Composite',
        latin: 'Shanghai Composite',
        country: 'China',
        what: 'All stocks listed on the Shanghai Stock Exchange.',
        why: 'A read on China’s domestic economy, which drives demand for oil, iron ore and copper.',
        you: 'China buys a large share of Australia’s iron ore, so a weak China market can mean weaker Australian exports and a softer Australian dollar.',
      },
      taiex: {
        name: 'TAIEX',
        latin: 'TAIEX',
        country: 'Taiwan',
        what: 'Taiwan’s main stock index. TSMC, which makes most of the world’s most advanced chips, carries a huge weight.',
        why: 'Shows the health of the AI-chip supply chain, and carries geopolitical risk around Taiwan.',
        you: 'Trouble in Taiwan would ripple through every technology and AI company.',
      },
      nifty50: {
        name: 'Nifty 50',
        latin: 'Nifty 50',
        country: 'India',
        what: 'The 50 largest companies on India’s National Stock Exchange.',
        why: 'India is one of the fastest-growing big economies and competes with China for global investor money.',
        you: 'Money moving into or out of India can shift emerging-market funds and demand for oil and gold.',
      },
      stoxx50: {
        name: 'Euro Stoxx 50',
        latin: 'Euro Stoxx 50',
        country: 'Eurozone',
        what: 'The 50 biggest companies in the eurozone.',
        why: 'One number for the health of the euro area, one of the world’s largest economic blocs.',
        you: 'It affects the euro and European interest rates, which matter for imports, travel and global funds.',
      },
      dax: {
        name: 'DAX',
        latin: 'DAX',
        country: 'Germany',
        what: 'The 40 largest German companies, heavy in cars, chemicals and machinery.',
        why: 'Germany sells goods worldwide, so the DAX is a good read on global trade and on demand from China.',
        you: 'Weakness can signal slowing world trade, which tends to cool growth and commodity prices.',
      },
      cac: {
        name: 'CAC 40',
        latin: 'CAC 40',
        country: 'France',
        what: 'The 40 largest companies on the Paris exchange: luxury goods, energy, banks and aerospace.',
        why: 'France is the eurozone’s second-largest economy; alongside the DAX and Euro Stoxx 50 it shows how Europe’s blue chips are faring.',
        you: 'It moves with the euro and European interest rates, which shape the cost of travel and goods imported from Europe.',
      },
      ftse: {
        name: 'FTSE 100',
        latin: 'FTSE 100',
        country: 'United Kingdom',
        what: 'The 100 largest companies on the London Stock Exchange.',
        why: 'Full of global miners, oil companies and banks that earn most of their money abroad, so it works more like a gauge of commodities and world growth than of the UK itself.',
        you: 'It often rises when oil and metal prices rise, even if the UK economy is weak.',
      },
      sp500: {
        name: 'S&P 500',
        latin: 'S&P 500',
        country: 'United States',
        what: 'The 500 biggest companies listed in the United States.',
        why: 'It is the world’s main stock-market benchmark; when it falls sharply, markets almost everywhere follow.',
        you: 'Many super and index funds hold US shares, so its moves reach your retirement savings.',
      },
      ndx: {
        name: 'Nasdaq 100',
        latin: 'Nasdaq 100',
        country: 'United States',
        what: 'The 100 largest non-financial companies on the Nasdaq exchange, led by big technology and AI firms.',
        why: 'Shows the mood for technology and growth stocks. It usually swings harder than the S&P 500.',
        you: 'Falls here often mean investors are pulling back from risk, which can ripple into crypto and growth funds.',
      },
      dow: {
        name: 'Dow Jones',
        latin: 'Dow Jones',
        country: 'United States',
        what: 'The 30 biggest and best-known US companies, the index the evening news quotes.',
        why: 'The world’s most famous market number: a big drop in the Dow leads the news everywhere and can set the mood for every market that opens after New York.',
        you: 'It weights companies by price and holds only 30 of them, so the S&P 500 above is the better measure, but the Dow still moves sentiment, including the US shares inside many super funds.',
      },
      tsx: {
        name: 'S&P/TSX Composite',
        latin: 'S&P/TSX',
        country: 'Canada',
        what: 'Canada’s main stock index, heavy in energy, banks and mining.',
        why: 'A read on oil and metal prices, and Canada is the US’s closest trading partner.',
        you: 'It often moves with oil prices, which affect what you pay for petrol.',
      },
      ibov: {
        name: 'Ibovespa',
        latin: 'Ibovespa',
        country: 'Brazil',
        what: 'Brazil’s main stock index, with large oil, mining and bank companies.',
        why: 'The usual stand-in for emerging markets and commodity exporters. It drops when investors flee riskier countries.',
        you: 'A sharp fall often goes with a stronger US dollar and weaker emerging-market currencies.',
      },
    },
    /** §6.11 verdict labels — every section verdict names what it measures. */
    measureNormal: 'Stock markets: near their yearly highs',
    measureAttention: 'Stock markets: several well below their highs',
    measureUnusual: 'Stock markets: far below their highs',
    /** §9.10: the hero's transparent count shows the section as its own
     * indicator, with its measure label — never merged with currencies. */
    heroIndicatorNormal: 'Stock markets: calm',
  },

  fx: {
    /** §10.2 — the section's own wording, spec-verbatim. */
    title: 'World currencies',
    subtitle: 'What the big currencies are telling us',
    asOf: 'As of {date}',
    groups: { dollarWorld: 'Dollar vs the world', warningLights: 'Warning lights', chinaLink: 'Australia–China' },
    /** Status words (V1): patterns show only Active, Watching or Quiet. */
    statusActive: 'Active',
    statusWatching: 'Watching',
    statusQuiet: 'Quiet',
    /** Severity rides the page's own chips (§9.3) — the same wording as
     * everywhere: Normal / Needs attention / Unusual. */
    chipNormal: 'Normal',
    chipAttention: 'Needs attention',
    chipUnusual: 'Unusual',
    /** §9.10 measure labels — the verdict line always names what it measures. */
    measureNormal: 'Currency patterns: calm',
    measureAttention: 'Currency patterns: worry signs',
    measureUnusual: 'Currency patterns: several warnings at once',
    /** §9.10: the hero's transparent count shows this section as its own
     * indicator with its measure label, never merged with the stock one. */
    heroIndicatorNormal: 'Currency patterns: calm',
    /** §10.2 reliability detail (under the dots). */
    reliabilityDetail: 'Held in {k} of the last 13 weeks',
    /** Table tag (§6.2) — the only extra tag in the section. */
    bigMoveTag: 'Unusually large move',
    /** Quiet area (§9.3 item 4 + CR §4.4). */
    quietAreaTitle: 'Nearest to sounding the alarm',
    quietMore: '{n} more quiet patterns',
    barLabel: 'How close to the alarm',
    /** The quiet rows' line 2 — the numbers, in words (one per rule; the
     * {dir} word is down/up for currencies, down/up for stocks in EN). */
    quietNumbers: {
      r1: 'The Australian dollar is {dir} {x}% against the yen this month. The alarm sounds at {line}%.',
      r2: 'The US dollar is {dir} {x}% against the yen this month. The alarm sounds at {line}%.',
      r3M1: 'The US dollar is {dir} {x}% against the big currencies this month. The alarm sounds at {line}%.',
      r3M3: 'The US dollar is {dir} {x}% against the big currencies over the past three months. The alarm sounds at {line}%.',
      r4: 'US stocks are {dir} {x}% this month. The alarm sounds at {line}%.',
      r5: 'The US dollar is {dir} {x}% against the yuan in three months. The alarm sounds at {line}%.',
      r6: 'The euro is {dir} {x}% against the Swiss franc this month. The alarm sounds at {line}%.',
    },
    dirDownCurrency: 'down',
    dirUpCurrency: 'up',
    dirDownStock: 'down',
    dirUpStock: 'up',
    /** Pattern cards (§9.3 item 3). */
    morePatterns: '{n} more patterns',
    /** v1.3 (CR §4.8): the chart captions say what the relationship means. */
    chartCaptionTogether: 'When one goes up, the other usually goes up too',
    chartCaptionOpposite: 'When one goes up, the other usually goes down',
    dotsTitle: 'How the pattern held in the last 13 weeks',
    dotsLegendHeld: 'Held',
    dotsLegendNotHeld: 'Did not hold',
    dotsLegendNoChange: 'No change',
    dotsEndStart: '13 weeks ago',
    dotsEndNow: 'now',
    pairsUsed: 'Pairs used in this pattern',
    /** v1.3 (CR §4.9): the dollar row's title is the plain name, with its
     * glossary tip. */
    dollarRowTitle: 'US dollar strength',
    /** v1.3 (CR §4.3 Level 2): the alarm level in words replaces the old
     * raw warning-line row (fix B5). */
    changeLineLabel: 'What would change this',
    /** v1.3 (CR §4.3 Level 3): the everyday explanation rides above the
     * why / seen-before / for-you lines. */
    everydayLabel: 'In everyday terms',
    downgradeCaution: 'The usual pattern has not been reliable lately.',
    level3Toggle: 'Why it works, and the numbers',
    /** The three meaning-line labels (§9.3 Level 3). */
    labelWhy: 'Why it works',
    labelSeenBefore: 'Seen before',
    labelForYou: 'What it means for you',
    noDataRow: 'Not enough data right now',
    /** Small labels for the two-part sentences (§10.2, optional on screen). */
    labelSee: 'We see',
    labelMeans: 'Usually means',
    /** Pairs table (§9.3 item 6). */
    showTable: 'Show all currency pairs',
    hideTable: 'Hide pairs',
    tableLabel: 'All world currency pairs',
    thPair: 'Pair',
    thToday: 'Today',
    thM1: '1 month',
    thM3: '3 months',
    thY1: '1 year',
    thTrend: 'Trend',
    trendUp: 'Up',
    trendFlat: 'Flat',
    trendDown: 'Down',
    directionLegend: '▲ = first currency stronger',
    oldData: 'Old data · {date}',
    /** v1.3 (CR §4.2): the "In plain words" block, directly under the
     * verdict line — this is what most visitors read. */
    plainTitle: 'In plain words',
    s1MuchStronger: 'The US dollar got much stronger this month: up {x}% against six major currencies{extreme}.',
    s1Stronger: 'The US dollar got stronger this month: up {x}% against six major currencies.',
    s1Steady: 'The US dollar was steady this month ({x}%).',
    s1Weaker: 'The US dollar got weaker this month: down {x}% against six major currencies.',
    s1MuchWeaker: 'The US dollar got much weaker this month: down {x}% against six major currencies{extreme}.',
    s1ExtremeHigh: ', its strongest in a year',
    s1ExtremeLow: ', its weakest in a year',
    s2Line: 'Against the dollar, the biggest changes this month: the {A} {dirA} {a}% and the {B} {dirB} {b}%.',
    s3Weaker: 'The Australian dollar got weaker against the US dollar: down {x}% this month. Things priced in US dollars (many imports, overseas trips, online shopping) cost more.',
    s3Stronger: 'The Australian dollar got stronger against the US dollar: up {x}% this month. Overseas trips and imports priced in US dollars cost less.',
    s3Steady: 'The Australian dollar was steady against the US dollar this month ({x}%).',
    s4None: 'No warning pattern is active. The closest to sounding the alarm is “{name}”.',
    s4One: '1 warning pattern active: {names}.',
    s4Many: '{n} warning patterns active: {names}.',
    /** v1.3 (CR §4.5): the "How to read this section" button + its five
     * items (closed by default). */
    howToRead: 'How to read this section',
    howToReadItems: [
      'This section watches the world’s biggest currencies. When money moves between them in certain ways, it often says something about how worried or relaxed investors are.',
      'A percentage such as −3.6% compares today with one month (or the period shown) ago. A minus means the first currency got weaker.',
      'A pattern is a link between currencies (sometimes stocks or gold) that has often shown up before market worries.',
      'Active means the pattern is showing right now. Watching means it is half there. Quiet means nothing to see.',
      'Patterns are tendencies, not predictions. They can be wrong.',
    ],
    /** v1.3 (CR §4.6): the glossary — a small "?" after a term opens the
     * one-sentence definition (tap or keyboard, never hover-only). */
    glossaryTitle: 'Words we use',
    glossary: {
      pair: {
        term: 'Currency pair',
        def: 'Two currencies compared, for example the euro and the US dollar. The rate tells you how much of the second one you get for one of the first.',
      },
      stronger: {
        term: 'Stronger / weaker currency',
        def: 'A currency is stronger when one unit buys more of another currency than before.',
      },
      dollarStrength: {
        term: 'US dollar strength',
        def: 'Currena’s own measure of how the US dollar is doing against six big currencies. It is not the official DXY index, but it moves in a similar way.',
      },
      safeHaven: {
        term: 'Safe haven',
        def: 'A currency or asset people buy when they are scared, such as the Swiss franc, the yen, the US dollar or gold.',
      },
      carryTrade: {
        term: 'Carry trade',
        def: 'Borrowing in a currency with very low interest (often the yen) to invest in something that pays more. It works until the borrowed currency suddenly gets stronger.',
      },
      centralBank: {
        term: 'Central bank',
        def: 'The institution that sets interest rates and looks after a country’s money, such as the US Federal Reserve or the European Central Bank (ECB).',
      },
      referenceRate: {
        term: 'Reference rate',
        def: 'An official rate the European Central Bank publishes once each working day.',
      },
      alarmLevel: {
        term: 'Alarm level',
        def: 'The size of move at which a pattern switches from Quiet to Active.',
      },
      vix: {
        term: 'Market fear gauge (VIX)',
        def: 'A number that rises when investors expect big swings in US stocks.',
      },
      tendency: {
        term: 'Tendency',
        def: 'Something that usually happens, but not always.',
      },
    },
    /** States (§9.5). */
    empty: 'Currency data is being prepared. Check back after the next daily update.',
    collapsedStale: 'Currency data is old; last update {date}. It returns after the next daily update.',
    /** Footer line (§9.3 item 7; v1.3 §4.1 rule 1 — the acronym is spelled
     * out on first use). */
    footerLine: 'European Central Bank (ECB) reference rates, once a day. A pattern is a tendency, not a prediction.',
    /** §10.3 headline templates — generated from the numbers, no AI call.
     * v1.3 (fix B2): only a pattern that COUNTS (a counted Warning) can
     * lead the headline; v1.3 §3.2 adds the big-mover template for a calm
     * verdict with a visible big move. */
    headlineCalm: 'No pattern is active. Closest to a warning: “{name}”.',
    headlineActive: '“{top}” is active.',
    headlineActiveMore: '“{top}” is active, plus {n} more.',
    headlineUnusual: 'Several patterns are active at once, led by “{top}”.',
    headlineWobble: 'Money is leaving stocks and the dollar together, which is unusual.',
    headlineBigMover: 'No warning pattern is active, but {mover}.',
    moverDollarUp: 'the US dollar is up {x}% this month',
    moverDollarDown: 'the US dollar is down {x}% this month',
    moverPairDown: 'the {first} lost {x}% against the {second} this month',
    moverPairUp: 'the {first} gained {x}% against the {second} this month',
    /** Hero integration (§6.5): raised currency signals appear in the
     * named-alerts block with the pattern names. */
    heroAlertAttention: 'World currencies · Needs attention: {patterns}.',
    heroAlertUnusual: 'World currencies · Unusual: {patterns}.',
    /** CSV export columns (the Tools menu, §9.3 item 6). */
    csvColPair: 'Pair',
    csvColToday: 'Today %',
    csvColM1: '1 month %',
    csvColM3: '3 months %',
    csvColY1: '1 year %',
    csvColTrend: 'Trend',
    csvColRate: 'Rate',
    csvColAsOf: 'As of',
    csvColSource: 'Source',
    csvDownload: 'World currencies CSV',
    /** Chart + aria (§9.7: every chart has a text summary). v1.3 (CR §4.8):
     * the captions say what “together/opposite” MEANS, and the extra line
     * says both lines start at 100 six months ago. */
    chartAria: 'Two lines rebased to 100 over the last 26 weeks',
    chartValueAria: 'week {i}: {value}',
    chartSummary: 'The two lines moved {relation} in {k} of the last 13 weeks',
    chartRelationTogether: 'together',
    chartRelationOpposite: 'in opposite directions',
    chartStartsAt100: 'Both lines start at 100 six months ago.',
    /** v1.3 (CR §4.7): plain names for the chart lines that are not pairs. */
    seriesNames: {
      dollar: 'US dollar strength',
      gold: 'Gold',
      sp500: 'US stocks (S&P 500)',
      n225: 'Japanese stocks (Nikkei 225)',
      stoxx50: 'European stocks (Euro Stoxx 50)',
    },
    /** v1.3 (CR §4.2/§4.7): single-currency plain names for the S2 movers
     * sentence and the big-mover headline; the plural forms ride the S5
     * money lines (“1,000 euros”, but “1,000 yen”). */
    currencyNames: {
      USD: 'US dollar',
      EUR: 'euro',
      JPY: 'yen',
      GBP: 'pound',
      CNY: 'yuan',
      CHF: 'Swiss franc',
      AUD: 'Australian dollar',
    },
    currencyPlural: {
      USD: 'US dollars',
      EUR: 'euros',
      JPY: 'yen',
      GBP: 'pounds',
      CNY: 'yuan',
      CHF: 'Swiss francs',
      AUD: 'Australian dollars',
    },
    wordLost: 'lost',
    wordGained: 'gained',
    dollarChartAria: 'The dollar measure over the last year',
    /** §8 — per-pair context content (spec-verbatim). */
    entries: {
      eurusd: {
        name: 'Euro vs US dollar',
        what: 'The world’s busiest pair, about a fifth of all currency trading. It follows the interest-rate gap between the US Fed and the European central bank.',
        you: 'A falling euro means a stronger dollar, which usually weighs on gold.',
      },
      usdjpy: {
        name: 'US dollar vs yen',
        what: 'The yen is the world’s main cheap-borrowing currency and a safe haven. The pair follows the interest-rate gap between the US and Japan.',
        you: 'A sudden yen jump can shake share markets worldwide.',
      },
      gbpusd: {
        name: 'Pound vs US dollar',
        what: 'The pound is the fourth most traded currency and London is the world’s biggest trading hub. Mostly context for the dollar measure.',
        you: 'A pound-only move is usually a UK story, not a world one.',
      },
      usdchf: {
        name: 'US dollar vs Swiss franc',
        what: 'The Swiss franc is a classic safe haven. The pair shows whether worried investors prefer the franc or the dollar.',
        you: 'A franc rising against the dollar can mean worry about the US specifically.',
      },
      usdcny: {
        name: 'US dollar vs yuan',
        what: 'One of the three busiest currency pairs. The yuan is steered by China’s central bank, so big moves are deliberate signals about China’s economy and trade.',
        you: 'A weaker yuan can mean weaker Chinese demand for oil, metals and Australian exports.',
      },
      audusd: {
        name: 'Australian dollar vs US dollar',
        what: 'Your home pair. It follows China’s demand, commodity prices and the world’s appetite for risk.',
        you: 'A falling Australian dollar makes imports and overseas travel dearer.',
      },
      audjpy: {
        name: 'Australian dollar vs yen',
        what: 'The classic “risk-measuring pair”: a growth currency against the safe-haven yen.',
        you: 'A sharp fall usually means investors are getting nervous.',
      },
      eurjpy: {
        name: 'Euro vs yen',
        what: 'A second opinion on world mood: Europe’s money against the safe-haven yen.',
        you: 'If it falls with AUD/JPY, the nervous signal is stronger.',
      },
      eurchf: {
        name: 'Euro vs Swiss franc',
        what: 'Europe’s safe-haven pair: it falls when worry about Europe rises.',
        you: 'A fall alongside falling European shares is a warning.',
      },
      audcny: {
        name: 'Australian dollar vs yuan',
        what: 'The Australian dollar against its biggest customer’s currency.',
        you: 'Shows the China link in one number.',
      },
    },
    /** The dollar measure's own row (§8's last line + v1.3 §4.9: the
     * meaning line follows the direction — fix B7). */
    dollarEntry: {
      name: 'US dollar strength',
      what: 'The US dollar against six big currencies (euro, yen, pound, yuan, franc, Australian dollar), by Currena’s own weights. Not the official DXY.',
      you: 'A strong dollar usually pressures gold and the Australian dollar.',
    },
    /** v1.3 (CR §4.9): the dollar row's meaning line, chosen by the
     * dollar's 1-month direction. */
    dollarMeaningStrong: 'A stronger dollar usually pushes gold down and makes imports and overseas trips dearer for people in other countries.',
    dollarMeaningWeak: 'A weaker dollar usually helps gold and makes imports and overseas trips cheaper for people in other countries.',
    dollarMeaningSteady: 'The dollar is steady, so no big effect is expected from it.',
    /** v1.3 (CR §4.2 S5): the "what it means in money" line for a pair's
     * detail panel — the same line in every pair's panel, using that
     * pair's currencies. old = new ÷ (1 + M1/100); whole numbers. */
    moneyLabel: 'What it means in money',
    moneyWorse: 'If you had changed 1,000 {first} into {second} a month ago, you would have got about {old} {second}. Today you get about {new}, which is {diff} fewer.',
    moneyBetter: 'If you had changed 1,000 {first} into {second} a month ago, you would have got about {old} {second}. Today you get about {new}, which is {diff} more.',
    moneySame: 'If you had changed 1,000 {first} into {second} a month ago, you would have got about {old} {second}. Today you get about the same.',
    /** §7 — rule content (spec-verbatim, both parts of every sentence) +
     * the v1.3 four-answer layer (CR §4.3): a headline verdict per outcome,
     * the everyday explanation, and the alarm level in words. */
    rules: {
      r1: {
        name: 'Nervous or relaxed?',
        headlineWarning: 'Investors look nervous',
        headlineSupportive: 'Investors look relaxed',
        headlineWatch: 'An early hint of nervousness',
        headlineQuiet: 'No sign of nervousness',
        everyday: 'When people get scared, they sell riskier money like the Australian dollar and buy the safer Japanese yen. This pair shows which way money is moving.',
        changeLine: 'The alarm sounds if the Australian dollar loses {line}% against the yen in a month while US stocks fall {line2}% or market fear (the VIX) is high.',
        warning: {
          see: 'The Australian dollar is down {x}% against the yen over the past month, while {stocks}.',
          means: 'This usually goes with nervous investors.',
        },
        supportive: {
          see: 'The Australian dollar is up {x}% against the yen over the past month, and the S&P 500 is up {y}%.',
          means: 'This usually goes with relaxed investors who are willing to take risk.',
        },
        watch: {
          see: 'The Australian dollar is down {x}% against the yen over the past month, but stocks have not followed yet.',
          means: 'If stocks join in, it would point to nervous investors.',
        },
        stocksSp500: 'the S&P 500 is down {y}%',
        stocksFear: 'market fear (the VIX) is elevated',
        why: 'Investors borrow cheap yen to buy higher-paying assets like the Australian dollar. When fear rises they sell those assets and buy yen back, so the pair falls.',
        seenBefore: '2008, August 2024, April 2025.',
        forYou: 'Nervous periods often come with falling share prices and retirement balances. A weaker Australian dollar also makes imports and overseas travel dearer.',
        confirmLine: 'Confirmed by the euro against the yen.',
      },
      r2: {
        /** v1.3 (CR §4.3): the plain title — the carry-trade jargon moves
         * into the card's everyday explanation. */
        name: 'Sudden yen jump',
        headlineWarning: 'The yen is jumping and markets may shake',
        headlineWatch: 'The yen is very weak',
        headlineQuiet: 'No sudden yen moves',
        everyday: 'Many investors borrow cheap yen to invest elsewhere (a “carry trade”). If the yen suddenly gets stronger, they must repay fast and sell their investments, which can hit stock markets worldwide.',
        changeLine: 'The alarm sounds if the yen gains {line}% against the US dollar in a month while Japanese stocks fall {line2}%.',
        warning: {
          see: 'The yen is up {x}% against the US dollar over the past month, while Japanese stocks (Nikkei 225) are down {y}%.',
          means: 'This often means carry trades are being unwound, as in August 2024.',
        },
        watch: {
          see: 'The yen is down {x}% against the US dollar over the past three months.',
          means: 'Japan has stepped in to support the yen after sharp falls before (2022, 2024), and a sudden reversal can shake markets.',
        },
        why: 'Japan’s very low interest rates make the yen the cheapest money to borrow. When the yen jumps, borrowers rush to repay, which forces sales of shares and other assets worldwide.',
        seenBefore: '2008, August 2024.',
        forYou: 'A yen jump can pull down share markets and crypto at the same time, even when nothing is wrong locally.',
      },
      r3: {
        name: 'Strong or weak dollar',
        headlineWarning: 'The dollar is getting much stronger',
        headlineSupportive: 'The dollar is getting much weaker',
        headlineQuiet: 'The dollar is moving normally',
        everyday: 'Oil, gold and a lot of loans are priced in US dollars. When the dollar gets stronger, they cost more for people who earn in other currencies.',
        changeLine: 'The alarm sounds if the dollar moves {line1}% in a month or {line2}% in three months against six major currencies.',
        warning: {
          see: 'The US dollar is up {x}% against the big currencies over the past three months.',
          means: 'A strong dollar usually makes money harder to get around the world.',
        },
        /** v1.3 (CR §3.1): the one-month wording. */
        warningM1See: 'The US dollar is up {x}% against the big currencies over the past month.',
        supportive: {
          see: 'The US dollar is down {x}% against the big currencies over the past three months.',
          means: 'A weaker dollar usually makes money easier to get around the world.',
        },
        supportiveM1See: 'The US dollar is down {x}% against the big currencies over the past month.',
        why: 'Oil, gold and much of the world’s debt are priced or borrowed in dollars. When the dollar rises they cost more for everyone else, which usually pressures gold, commodities and emerging markets.',
        seenBefore: '2022 (strong dollar), 2017 (weak dollar).',
        forYou: 'A strong US dollar usually means a weaker Australian dollar, so imports and overseas travel cost more.',
      },
      r4: {
        name: 'Where does money hide?',
        headlineFlight: 'Money is running to the dollar',
        headlineWobble: 'Money is leaving even the dollar',
        headlineQuiet: 'No rush to safety',
        everyday: 'In a scare, people usually move money into US dollars because it feels safe. When even the dollar is sold, trust is shaky, and gold often rises.',
        changeLine: 'The alarm sounds if US stocks fall {line1}% in a month while the dollar gains {line2}%.',
        flight: {
          see: 'The S&P 500 is down {y}% over the past month, while the US dollar is up {x}%.',
          means: 'In a scare, money usually runs to the dollar.',
        },
        wobble: {
          see: 'Over the past month the S&P 500 is down {y}%, the US dollar is down {x}% and gold is up {g}%.',
          means: 'Money is leaving the dollar as well as stocks, which is unusual (seen in April 2025).',
        },
        why: 'In a fright the dollar is normally the safe place to be. When it fails at that job, investors are doubting something deeper, such as US policy or US debt.',
        seenBefore: 'March 2020 and 2022 (usual pattern), April 2025 (unusual).',
        forYou: 'When money leaves stocks and the dollar together, gold often rises.',
      },
      r5: {
        name: 'China link',
        headlineWarning: 'Worry about China’s demand',
        headlineSupportive: 'China’s demand looks healthy',
        headlineWatch: 'An early hint of China worry',
        headlineQuiet: 'No sign of China worry',
        everyday: 'China is the biggest buyer of Australia’s iron ore. When China’s economy slows, the Australian dollar and the Chinese yuan often weaken together.',
        changeLine: 'The alarm sounds if both the yuan and the Australian dollar lose {line}% or more against the US dollar in three months.',
        warning: {
          see: 'Over the past three months the yuan is down {x}% and the Australian dollar is down {y}% against the US dollar.',
          means: 'This often points to worry about China’s demand.',
        },
        supportive: {
          see: 'Over the past three months the yuan is up {x}% and the Australian dollar is up {y}% against the US dollar.',
          means: 'China’s demand looks supportive.',
        },
        watch: {
          see: 'Only one of the two has moved so far: {leg}.',
          means: 'If both move together, it often points to China’s demand.',
        },
        legCny: 'the yuan is down {x}% against the US dollar',
        legAud: 'the Australian dollar is down {y}% against the US dollar',
        why: 'China buys much of Australia’s iron ore, so the Australian dollar tends to follow China’s economy. The yuan is steered by China’s central bank, so a big move is a deliberate signal.',
        seenBefore: '2015 (yuan devaluation), 2018–2019 (trade war).',
        forYou: 'Weaker Chinese demand hurts Australian mining incomes, and a weaker Australian dollar raises import prices.',
      },
      r6: {
        name: 'Europe worry',
        headlineWarning: 'Investors are worried about Europe',
        headlineWatch: 'The euro is slipping against the Swiss franc',
        headlineQuiet: 'No sign of Europe worry',
        everyday: 'The Swiss franc is a classic safe place for money. When Europeans get nervous they buy francs, so the euro falls against it.',
        changeLine: 'The alarm sounds if the euro loses {line1}% against the Swiss franc in a month while European stocks also fall {line2}%.',
        warning: {
          see: 'The euro is down {x}% against the Swiss franc over the past month, and the Euro Stoxx 50 is down {y}%.',
          means: 'Money often moves to the franc when investors worry about Europe.',
        },
        watch: {
          see: 'The euro is down {x}% against the Swiss franc over the past month, but European shares have not followed.',
          means: 'Moves by the Swiss central bank can also cause this.',
        },
        why: 'The Swiss franc is a classic safe haven. When Europeans get nervous they buy francs, so the euro-franc pair falls.',
        seenBefore: 'the euro crisis of 2010–2012, 2015.',
        forYou: 'Trouble in Europe can spill into world share markets and weaken the euro, which matters for travel and global funds.',
      },
      r7: {
        name: 'Dollar or euro?',
        headlineDollarLed: 'Mostly a dollar story',
        headlineEuroLed: 'Mostly a euro story',
        everyday: 'When the euro falls against the dollar, it can be because the dollar is strong everywhere (a world story) or because the euro itself is weak (a Europe story). This card tells you which.',
        /** v1.3 (CR §3.3): the we-see sentence uses the euro's OWN move
         * (lost/gained), never "moved"; the dollar verb carries direction
         * too (writing rule §4.1.3). */
        dollarLedEuroDown: {
          see: 'The euro lost {x}% against the US dollar over the past month, and the US dollar gained {d}% against the other big currencies.',
          means: 'That points to the dollar, which makes it a world story.',
        },
        dollarLedEuroUp: {
          see: 'The euro gained {x}% against the US dollar over the past month, and the US dollar lost {d}% against the other big currencies.',
          means: 'That points to the dollar, which makes it a world story.',
        },
        euroLedEuroDown: {
          see: 'The euro lost {x}% against the US dollar over the past month, while the US dollar barely moved ({d}%) against the other big currencies.',
          means: 'That points to something in Europe, such as interest rates, growth or politics.',
        },
        euroLedEuroUp: {
          see: 'The euro gained {x}% against the US dollar over the past month, while the US dollar barely moved ({d}%) against the other big currencies.',
          means: 'That points to something in Europe, such as interest rates, growth or politics.',
        },
        why: 'Telling the two apart shows whether the cause is global or local.',
      },
    },
  },

  sections: {
    global: 'Global',
    australia: 'Australia',
  },

  /** Question-group headings (L2): the gauge questions, verbatim from the owner spec. */
  groups: {
    'borrowing-costs': 'Is borrowing getting costlier?',
    'prices-heat': 'Are prices heating up?',
    'market-stress': 'Are markets nervous?',
    'dollar-strength': 'Is the dollar strong?',
    'growth-health': 'Is growth healthy?',
    'prices-board': 'Prices',
    'au-inflation-rates': 'Are inflation and rates a problem?',
    'au-households': 'Are households under pressure?',
    'au-trade-currency': 'How is trade and the currency?',
  },

  /** R30: SHORT gauge names for the hero: the reason line once embedded
   * the full question ("…Alarmed: Are prices heating up?."), which read
   * as a punctuation error. One compact name per gauge, no "?". */
  groupShort: {
    'borrowing-costs': 'Borrowing costs',
    'prices-heat': 'Prices',
    'market-stress': 'Market stress',
    'dollar-strength': 'The US dollar',
    'growth-health': 'Growth',
    'prices-board': 'Prices',
    'au-inflation-rates': 'Inflation & rates',
    'au-households': 'Households',
    'au-trade-currency': 'Trade & currency',
  },

  /** The one-line answer under each gauge heading (L2). */
  gaugeAnswers: {
    'borrowing-costs': 'Government and bank borrowing costs: they steer every other rate.',
    'prices-heat': 'Inflation pressure in the world’s biggest economy.',
    'market-stress': 'Fear and stress in money markets.',
    'dollar-strength': 'The US dollar against the currencies that matter to it.',
    'growth-health': 'The real-economy engines: China’s factories, US money, industrial metal demand.',
    'prices-board': 'What the key commodities cost.',
    'au-inflation-rates': 'Australian inflation and the rates that respond to it.',
    'au-households': 'Mortgages, rents, wages and jobs: the household squeeze.',
    'au-trade-currency': 'Exports, imports and the Australian dollar.',
  },

  status: {
    warning: 'Needs attention',
    unusual: 'Unusual',
    normal: 'Normal',
    context: 'Context',
    stale: 'Stale',
    'check-pending': 'Check pending',
    'no-history': 'Limited history',
    unavailable: 'No data',
  },

  label: {
    relaxed: 'Stable',
    cautious: 'Cautious',
    stressed: 'Stressed',
    alarmed: 'Critical',
  },

  units: {
    none: '',
    percent: '%',
    points: 'pts',
    usd: 'US$',
    aud: 'A$',
    'usd-bn': 'bn',
    // Step-1 C7: "US$23.3 trillion" — the EN render prefixes US$ and
    // suffixes the word; fa keeps its suffix form.
    'usd-tr': 'trillion',
    // Step-1 C4: EUR per USD renders with the € symbol.
    eur: '€',
    index: 'index',
    jpy: '¥',
    cny: 'CN¥',
    ratio: 'ratio',
  },

  rule: {
    info: 'info only: never votes',
    thresholdAbove: 'above {value}',
    thresholdAboveSustained: 'above {value} for {weeks} weeks in a row',
    thresholdBelow: 'below {value}',
    thresholdBelowSustained: 'below {value} for {weeks} weeks in a row',
    percentileHigh: 'in the highest {pct} of its 10-year range',
    percentileLow: 'in the lowest {pct} of its 10-year range',
    changeRisePct: 'up more than {magnitude} within {weeks} weeks',
    changeFallPct: 'down more than {magnitude} within {weeks} weeks',
    changeRisePoints: 'up more than {magnitude} within {weeks} weeks',
    changeFallPoints: 'down more than {magnitude} within {weeks} weeks',
    yoyNegative: 'falling year-on-year',
    consecutiveDecline: '{periods} declines in a row',
    aboveLow: 'up {rise} from its 12-month low',
    belowAux: 'below its paired comparison (wage growth below inflation)',
    or: 'or',
  },

  /* ---------------------------------------------------------------- *
   * Round 24 (roast, "fix this first" #1): every needs-attention card
   * and hero tile carries a ONE-LINE MEANING — what the fired rule
   * actually means for the reader, authored per indicator (the roast:
   * "a rule but no meaning"). One line, state-describing, hedged where
   * a tendency is claimed; the technical rule text stays in Details.
   * Typed as a Partial so the components can index any IndicatorId;
   * en and fa carry the same key set by hand.
   * ---------------------------------------------------------------- */

  /* ---------------------------------------------------------------- *
   * I17 (v2, Block T1): the "Together" connection cards.
   * Copy rules: hedged ("usually", "tends to"), never advice, no
   * buy/sell wording. Every evidence tag stays "to verify" until the
   * owner confirms the evidence (spec note): one string, one place.
   * ---------------------------------------------------------------- */
  together: {
    title: 'Together',
    subtitle:
      'How the indicators usually relate. Each card checks whether the usual pattern is showing today.',
    // R27: the quiet section-level note replaces the per-card placeholder tag.
    evidenceNote: 'Relationships are general tendencies, not forecasts.',
    // Step 3 L3-02 (2026-10-16): the verdict words are RETIRED — the card
    // is the current readings with their direction plus the usual tendency.
    // The chip now states presence only (conditions, never verdicts).
    state: {
      active: 'Showing',
      partly: 'Partly showing',
      pending: 'Pass-through pending',
      inactive: 'Not showing',
      disagree: 'Not showing',
      unknown: 'Not enough fresh data',
    },
    // Fix spec B-04 (2026-10-14): the context-leg and caveat labels.
    contextLeg: 'context',
    contextCaveat: 'a level, not a servicing cost',
    passThroughLine: 'The cash rate moved {policy} on {decided}; the home-loan data that follows it is not in yet (the loan rate has moved {loan} since that decision where data exists).',
    // R7b: the collapsed section’s one-line summary.
    summaryActive: '{n} showing',
    summaryPartly: '{n} partly showing',
    summaryPending: '{n} pass-through pending',
    summaryInactive: '{n} not showing',
    summaryDisagree: '{n} not showing',
    summaryUnknown: '{n} unreadable',
    seeAllConnections: 'See all {n} connections',
    viewLegCard: 'View this indicator',
    // R27: the one-clause “right now” line (truthful by state).
    rightNowShort: {
      active: 'Usual pattern showing right now.',
      partly: 'Part of the usual pattern showing right now.',
      pending: 'Pass-through pending: the rate decision is newer than the loan data.',
      inactive: 'Too quiet to read right now.',
      disagree: 'Usual pattern not showing: {a}, {b}.',
      unknown: 'Not enough fresh data right now.',
    },
    // The owner's 11 Oct follow-up: the pattern line must also say WHAT
    // moves and WHICH way — one clause per leg, colour carries the
    // direction here by explicit owner instruction (green rises, red
    // falls). EN stays TELEGRAPHIC (the phrases corpus is bilingual-safe:
    // no verb agreement — "borrowing costs rising", never "costs is");
    // fa carries the motion verbs («بالا می‌رود») — its leg names are all
    // singular, so the verb agrees everywhere.
    moves: {
      up: '{name} rising',
      down: '{name} falling',
      flat: '{name} steady',
      high: '{name} high',
      low: '{name} low',
      mid: '{name} mid-range',
    },
    // Leg phrase assembly (telegraphic: bilingual-safe, no verb agreement).
    phrases: {
      dirOnly: '{name}: {direction}',
      none: '{name}: no fresh reading',
      overWindow: '(over {days} days)',
    },
    level: { high: 'high', typical: 'mid-range', low: 'low' },
    direction: { rising: 'rising', falling: 'falling', steady: 'steady' },
    connections: {
      'real-yields-gold': {
        name: 'Real yields and gold',
        legs: { 'real-yield-10y': 'real yields', 'gold-usd': 'gold' },
        relation:
          'Real yields and gold usually move in opposite directions: when “safe” money pays more after inflation, gold tends to lose shine, and the other way round.',
        rightNow: {
          active: 'Right now {a} while {b}: the usual see-saw is working.',
          partly: 'Right now {a}; {b}: only part of the see-saw is showing.',
          inactive: 'Right now {a} and {b}: both too quiet to read.',
          disagree: 'Right now {a} and {b}: both stretched the same way, so the usual see-saw is not in place.',
          unknown: 'One side of this connection has no fresh data right now.',
        },
      },
      'dollar-gold-oil': {
        name: 'The dollar, gold and oil',
        legs: { 'dollar-basket': 'the dollar', 'gold-usd': 'gold', brent: 'oil' },
        relation:
          'Gold and oil are priced in US dollars, so a strong dollar tends to weigh on them, and a weak one tends to lift them.',
        rightNow: {
          active: 'Right now {a}, with {b} and {c}: the usual dollar pressure is showing.',
          partly: 'Right now {a}; {b}, {c}: only part of the pattern is showing.',
          inactive: 'Right now {a}, {b}, {c}: all too quiet to read.',
          disagree: 'Right now {a}, yet {b} and {c}: the usual dollar pressure is not showing.',
          unknown: 'One side of this connection has no fresh data right now.',
        },
      },
      'oil-expectations-costs': {
        name: 'Oil, inflation expectations and borrowing costs',
        legs: { brent: 'oil', 'breakeven-5y5y': 'inflation expectations', us10y: '10-year borrowing costs' },
        relation:
          'When oil jumps, markets tend to expect more inflation, and long-term borrowing costs tend to rise with it.',
        rightNow: {
          active: 'Right now {a}, {b}, {c}: the chain is in place.',
          partly: 'Right now {a}, {b}, {c}: the chain is only partly engaged.',
          inactive: 'Right now {a}, {b}, {c}: the chain is quiet.',
          disagree: 'Right now {a}, {b}, {c}: the links point against each other.',
          unknown: 'One link in this chain has no fresh data right now.',
        },
      },
      'copper-china-growth': {
        name: 'Copper demand, Chinese factories and money',
        legs: {
          'copper-gold': 'the copper price vs gold',
          'china-pmi': 'Chinese factory activity',
        },
        relation:
          'Copper is wired into industry, so a firm copper-to-gold ratio tends to come with busy factories. (The link to US money supply is weak, so that leg is no longer counted.)',
        rightNow: {
          active: 'Right now {a}, {b}, {c}: the growth mix is in place.',
          partly: 'Right now {a}, {b}, {c}: the growth mix is only partly showing.',
          inactive: 'Right now {a}, {b}, {c}: the growth mix is quiet.',
          disagree: 'Right now {a}, {b}, {c}: the pieces point against each other.',
          unknown: 'One piece of this mix has no fresh data right now.',
        },
      },
      'iron-terms-aud': {
        name: 'Iron ore, the terms of trade and the Australian dollar',
        legs: {
          'iron-ore': 'iron ore',
          'terms-of-trade': 'the terms of trade',
          audusd: 'the Australian dollar',
          'dollar-basket': 'the US dollar',
        },
        relation:
          'Iron ore is one of Australia’s biggest exports, so firm export prices tend to lift the terms of trade and, over time, the Australian dollar. The US dollar rides along as context: a falling Australian dollar is often mostly a rising US dollar.',
        rightNow: {
          active: 'Right now {a}, {b}, {c}: the export chain is in place.',
          partly: 'Right now {a}, {b}, {c}: only part of the export chain is showing.',
          inactive: 'Right now {a}, {b}, {c}: the export chain is quiet.',
          disagree: 'Right now {a}, {b}, {c}: the links point against each other.',
          unknown: 'One link in this chain has no fresh data right now.',
        },
      },
      'rba-loan-debt': {
        name: 'The RBA rate, home loans and household debt',
        legs: {
          'rba-cash-rate': 'the RBA cash rate',
          'au-home-loan': 'the home-loan rate people pay',
          'au-household-debt-arrears': 'household debt ratios',
        },
        relation:
          'When the RBA changes the cash rate, the home-loan rates people actually pay tend to follow one to three months later; the card reads pass-through pending until that data exists. (The debt leg is a debt-to-income level, not a debt-servicing cost.)',
        rightNow: {
          active: 'Right now {a}, {b}, {c}: the household rate chain is engaged.',
          partly: 'Right now {a}, {b}, {c}: the household rate chain is partly engaged.',
          inactive: 'Right now {a}, {b}, {c}: the household rate chain is quiet.',
          disagree: 'Right now {a}, {b}, {c}: the links point against each other.',
          unknown: 'One link in this chain has no fresh data right now.',
        },
      },
    },
  },

  /* ---------------------------------------------------------------- *
   * I17 (v2-gated, Blocks S1–S3): "What the signals say".
   * Conditions, never advice: no green/red for supportive/against,
   * icons + words only; the "before you act" box is always visible.
   * The lean words describe conditions: they never recommend action.
   * ---------------------------------------------------------------- */
  signals: {
    title: 'What the signals say',
    subtitle:
      'The conditions that usually surround each metal, in plain words: conditions, not forecasts, and not advice.',
    // R26: one merged gold-and-silver card. Step-1 audit item G1: the card
    // is named for its CONDITIONS, never an estimation.
    mergedTitle: 'Conditions for gold and silver',
    mergedSubtitle: 'The two precious metals share most of their drivers: shared conditions are listed once.',
    conditionsMet: '{met} of {total} conditions met',
    metalLean: '{metal}: {lean}, {met} of {total} conditions met',
    lean: {
      'mostly-supportive': 'mostly supportive',
      mixed: 'mixed',
      'mostly-unsupportive': 'mostly unsupportive',
    },
    // 2026-10-17 (owner, "comply with capital letters — write Silver"):
    // the metal's name is a TITLE everywhere it leads a card, a row or an
    // export column — first letter capitalized. fa is unaffected (طلا/نقره
    // carry no case).
    metals: { gold: 'Gold', silver: 'Silver' },
    // 2026-10-21 (owner, "Gold Market Outlook — Complete State List"): the
    // strip speaks SEVEN outlook states, each with its own authored
    // sentence — the old verdictUp/Down/Flat words are retired because EN
    // ("Works against") and the fa sentence had drifted into saying
    // different things. "Signs point to…" keeps the page's
    // conditions-not-forecasts contract. The gold sentences are the
    // owner's verbatim; silver mirrors them.
    verdictTitle: 'Outlook',
    verdictNone: 'Cannot read yet',
    verdictStates: {
      'strong-bullish': {
        gold: 'Signs point to a potential significant rise in gold prices.',
        silver: 'Signs point to a potential significant rise in silver prices.',
      },
      bullish: {
        gold: 'Signs point to a potential rise in gold prices.',
        silver: 'Signs point to a potential rise in silver prices.',
      },
      neutral: {
        gold: 'Signs point to a neutral outlook for gold prices.',
        silver: 'Signs point to a neutral outlook for silver prices.',
      },
      'range-bound': {
        gold: 'Signs point to gold prices trading within a defined range.',
        silver: 'Signs point to silver prices trading within a defined range.',
      },
      bearish: {
        gold: 'Signs point to a potential decline in gold prices.',
        silver: 'Signs point to a potential decline in silver prices.',
      },
      'strong-bearish': {
        gold: 'Signs point to a potential significant decline in gold prices.',
        silver: 'Signs point to a potential significant decline in silver prices.',
      },
      mixed: {
        gold: 'Market signals for gold prices are mixed.',
        silver: 'Market signals for silver prices are mixed.',
      },
    },
    // The collapsed summary line carries the short state names; the full
    // sentences live in the strip chips.
    verdictStateNames: {
      'strong-bullish': 'Strong bullish',
      bullish: 'Bullish',
      neutral: 'Neutral',
      'range-bound': 'Range-bound',
      bearish: 'Bearish',
      'strong-bearish': 'Strong bearish',
      mixed: 'Mixed signals',
    },
    // Step-1 audit item C12: the one named interaction the checklist's
    // separate lines cannot say — gold at its decade high WHILE real
    // yields sit high too.
    goldHighYieldsWarning:
      'Gold is near its 10-year high while real yields are also high: this combination has historically been difficult for gold. The conditions work against it even at a record price.',
    // R26: neutral side words (no check/cross marks, no green/red).
    // 2026-10-17e (owner spec docs/insights/gold-balance-card-spec.md): the
    // grouped driver list (Supports / Works against / Sitting neutral) is
    // REPLACED by the balance visual — the side* headings retired, the
    // side labels now speak the balance's own pan labels (§13 verbatim).
    balance: {
      // 2026-10-25 (owner Iteration-2 directive): the balance's own
      // HEADING + explanatory subtitle now lead the block (the concept
      // «برآیند عوامل مؤثر بر قیمت طلا»), the side captions name the two
      // lists, and the empty states stay evidence-based. Round-50, QA
      // record docs/QA/quirks-2026-10-25-balance-v4-fa-copy.md.
      heading: 'The aggregate of factors affecting the price of gold',
      subtitle:
        'Each factor is read against its usual range and weighed equally; the beam shows the combined lean of today’s readings.',
      sideFor: 'Factors supporting gold’s price',
      sideAgainst: 'Factors pressuring gold’s price',
      verdictFor: 'Leaning for gold',
      verdictBalanced: 'Balanced',
      verdictAgainst: 'Leaning against gold',
      verdictNone: "Can't read the conditions right now",
      trayNeutral: 'Neutral',
      trayUnread: "Couldn't read",
      countFor: '{n} for',
      countAgainst: '{n} against',
      countNeutral: '{n} neutral',
      countUnread: "{n} couldn't be read",
      aria: 'Balance for gold: {summary}. {verdict}.',
      // 2026-10-26 (owner Iteration-4 directive): the pans' own minimal
      // empty markers — panEmpty when the evaluation ran but this side
      // has no qualifying factors, panUnreadable when nothing could be
      // read at all (the full evidence-based lines still render in the
      // list area below). Round-51.
      panEmpty: 'No qualifying signals',
      panUnreadable: 'Nothing to weigh yet',
      // 2026-10-26 (owner Iteration-5 addendum): the needle gauge's
      // text equivalent — the whole mechanical drawing is one
      // role="img" whose label states the beam tilt and the verdict
      // (colour never rides alone). Round-52, QA record
      // docs/QA/quirks-2026-10-26d-balance-v7-fa-copy.md.
      gaugeAria: 'Beam tilt: {n}°, {verdict}.',
      listEmptyFor: 'None of the factors checked shows a meaningful signal supporting gold’s price right now.',
      listEmptyAgainst: 'None of the factors checked shows a meaningful signal working against gold’s price right now.',
      listEmptyNone: 'Nothing could be read yet, so neither side has been weighed.',
    },
    silverOnly: 'Silver only',
    footingTitle: 'Price footing',
    footingRow: '{metal}: {state}',
    footingPosition: '{band} of the last 10 years',
    conditionState: {
      supportive: 'in place',
      against: 'working against',
      neutral: 'sitting neutral',
      unknown: 'cannot read',
    },
    conditionStateShort: {
      supportive: 'Supports',
      against: 'Works against',
      neutral: 'Sitting neutral',
      unknown: 'Cannot read',
    },
    conditions: {
      'real-yield': {
        name: 'Real yields',
        how: 'Low or falling real yields usually support gold; high or rising ones usually work against it.',
      },
      expectations: {
        name: 'Inflation expectations',
        how: 'Elevated long-run inflation expectations usually support gold as an inflation hedge.',
      },
      stress: {
        name: 'Market stress',
        how: 'Above-average stress in US money markets usually supports safe-haven demand for metals.',
      },
      dollar: {
        name: 'The US dollar',
        how: 'A weak or falling dollar usually supports metals, which are priced in dollars.',
      },
      footing: {
        name: 'Price footing',
        how: 'A price holding or rising in its 10-year range is firm footing; a falling one is not.',
      },
      industrial: {
        name: 'Industrial demand',
        how: 'Busy Chinese factories and a firm copper-to-gold ratio usually support industrial demand for silver.',
        // S2 note: the industrial condition is always tagged "mixed".
        tag: 'mixed',
      },
    },
    // R26: the 30-day speed rides the footing row only when the data exists.
    speedLabel: '30-day speed',
    notEnoughData: 'Not enough fresh data to read this card yet.',
    // R7b: the collapsed summary: one line per metal ("Gold: mixed, 2 of
    // 5 conditions met: price in the top 7% of the last 10 years").
    collapsedFooting: 'price in the {band} of the last 10 years',
    // Round 24: the collapsed line gets its takeaway. 2026-10-21 (owner):
    // the takeaway names the seven-state outlook (the strip holds the
    // full sentences).
    collapsedVerdict: 'Outlook: {verdict}',
    bandTop: 'top {p}%',
    bandBottom: 'bottom {p}%',
    bandMid: 'the middle',
  },

  /* ---------------------------------------------------------------- *
   * Round-2 R11: "What it means for my money": at most 4 lines, one
   * per life area, chosen by the worst tier among the area's
   * indicators. Hedged sentences, no advice, no buy/sell, no "will".
   * Round 25 (owner override): each row ALSO carries a stated
   * estimation computed from the driver readings
   * (config.moneyAreaDirection). Round 26 (owner wording): the words
   * describe the COST, not the bare direction — "will go up" next to
   * red ink read misleading. Cost areas speak in prices ("Becoming
   * more expensive / Getting cheaper"); savings speaks in its own
   * valence, where up is the GOOD case ("Earning more interest /
   * Earning less"). The whole corpus is "will"-free again.
   * ---------------------------------------------------------------- */
  money: {
    title: 'What it means for my money',
    subtitle: 'The day-to-day areas the indicators usually touch.',
    calmLine: 'No money area is standing out right now: a calm background for household budgets.',
    direction: {
      cost: { up: 'Becoming more expensive', down: 'Getting cheaper', flat: 'No clear direction' },
      savings: { up: 'Earning more interest', down: 'Earning less', flat: 'No clear direction' },
    },
    // Fix spec B-18 (2026-10-14): the savings row's real return — the new
    // term-deposit rate minus yearly inflation, labelled before tax. A
    // condition, never advice.
    realReturn:
      'Real return on savings: new term deposits pay {deposit} and prices rose {inflation} over the past year — the difference is {real} points a year (before tax).',
    areas: {
      petrol: {
        name: 'Petrol and transport',
        attention: 'Oil has left its usual range: pump prices tend to follow within weeks, so fill-up budgets can wobble for a while.',
        unusual: 'Oil sits at an unusual point of its 10-year range: pump prices can move more than usual for a while.',
        calm: 'Fuel costs are doing nothing unusual for your area’s prices.',
      },
      homeLoan: {
        name: 'Home loan and rent',
        attention: 'A rate or rent number has left its usual range: loan interest and rents have usually stayed elevated for months after.',
        unusual: 'A loan or rent number sits at an unusual point of its 10-year range: budget room can shift.',
        calm: 'Loan and rent settings look unremarkable for now.',
      },
      savings: {
        name: 'Savings and interest',
        // Step-2 add-list §B7: the row speaks about the REAL deposit rate
        // (RBA F4.1, the number it shows) with the cash rate as context.
        attention: 'Deposit rates and inflation have left their usual ranges: new term deposits pay well when the RBA holds rates high, while prices keep rising.',
        unusual: 'Savings rates sit at an unusual point of their range: the interest a new term deposit pays moves with it.',
        calm: 'Savings rates and inflation sit in unremarkable settings: the interest on new term deposits roughly tracks the RBA cash rate.',
      },
      shop: {
        name: 'Shop prices and bills',
        attention: 'An inflation gauge has left its usual range: grocery and bill inflation has usually stayed elevated for a few quarters.',
        unusual: 'An inflation gauge sits at an unusual point of its 10-year range: bills can surprise for a while.',
        calm: 'Shop prices and bills are doing nothing unusual.',
      },
      overseas: {
        name: 'Overseas money',
        attention: 'The Australian dollar is at an unusual point of its range: overseas purchases and travel money usually feel it quickly.',
        unusual: 'The exchange rate sits at an unusual point of its 10-year range: overseas money can stretch further, or less, for a while.',
        calm: 'Exchange rates are doing nothing unusual for overseas money.',
      },
      jobs: {
        name: 'Jobs and pay',
        attention: 'A jobs or pay number has left its usual range: hiring and wage growth have usually held their direction for quarters.',
        unusual: 'A jobs or pay number sits at an unusual point of its 10-year range.',
        calm: 'Jobs and pay settings look unremarkable for now.',
      },
    },
  },

  indicators: INDICATORS,
};

export type InsightsCopy = typeof insightsCopyEn;
