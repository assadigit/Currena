/**
 * Insights copy dictionary — ENGLISH (source of truth, Phase I4).
 *
 * The Insights page carries by far the largest string corpus in the app
 * (30 indicators × 6 copy fields + structural strings, both languages) —
 * ~2× the whole existing main dictionary. Loading it through the eager
 * en.ts/fa.ts dictionaries would grow the ENTRY bundle the roadmap
 * explicitly protects ("the Insights route must be lazy-loaded so initial
 * JS does not regress"). So this pair of modules keeps every rule of the
 * house i18n system — en.ts-style source of truth, fa shape-checked at
 * compile time, no hardcoded text in components — while living inside the
 * lazy /insights route chunk (only nav.title/title strings join the eager
 * dictionaries).
 *
 * Copy rules (docs/insights/01/02 specs + D4): plain language, general
 * information only, never personal advice, no buy/sell wording. The
 * "forYou" field is general-information framing aimed at an
 * Australian reader, not a recommendation. Phase I5 does the native
 * review pass on this text.
 */

import type { IndicatorId } from '@currena/core';

/** One indicator's copy fields — `ticker` is optional (pair-style names carry it implicitly). */
export interface IndicatorCopyEntry {
  name: string;
  ticker?: string;
  oneLiner: string;
  whatItIs: string;
  whyItMatters: string;
  tendedToMean: string;
  cantTell: string;
  forYou: string;
}

const INDICATORS: Record<IndicatorId, IndicatorCopyEntry> = {
  'yield-curve-10y2y': {
    name: 'US 10Y minus 2Y yield',
    oneLiner:
      'The gap between long and short-term US government borrowing. Negative values (an “inverted curve”) are the classic recession warning.',
    whatItIs:
      'The 10-year minus 2-year Treasury yield difference — the most-watched shape of the US “yield curve”.',
    whyItMatters:
      'Banks borrow short and lend long; an inverted curve squeezes that business and has preceded most US recessions.',
    tendedToMean:
      'An inverted curve preceded every US recession of the past 60 years — usually by 6 to 24 months, with occasional false alarms.',
    cantTell:
      'It says nothing about timing or size of any downturn, and other countries’ curves can tell a different story.',
    forYou:
      'One of the most-watched early-warning gauges in finance — useful context, never a signal to act on alone.',
  },
  'stress-stlfsi': {
    name: 'US financial stress index',
    ticker: 'STLFSI4',
    oneLiner:
      'The St. Louis Fed’s single gauge of stress across US money and credit markets — zero is average, above zero is above-average stress.',
    whatItIs:
      'The STLFSI4 index, combining 18 market measures (yields, spreads, volatility) into one number centred on zero.',
    whyItMatters:
      'It condenses many separate stress signals into one number that analysts and policymakers actually watch.',
    tendedToMean:
      'Readings above zero for a month or more marked 2008 and the 2020 COVID shock; brief blips above zero are common and harmless.',
    cantTell:
      'It is backward-looking and US-centred — it cannot say where markets go next.',
    forYou:
      'Background for headlines about “financial stress”: calm here broadly means market plumbing is working.',
  },
  'real-yield-10y': {
    name: 'US 10-year real yield',
    oneLiner:
      'What 10-year US government bonds pay after inflation — the “real” return the world’s biggest debt market demands.',
    whatItIs:
      'The market yield on 10-year US Treasuries minus the inflation rate markets expect over the same term.',
    whyItMatters:
      'Real yields anchor the pricing of everything — homes, shares, currencies — and sat at historic highs through 2023–26.',
    tendedToMean:
      'High real yields make cash and bonds compete harder against riskier assets; the negative real yields of the 2010s did the opposite.',
    cantTell:
      'It prices one market’s value of time — not the whole economy, and not future returns on anything.',
    forYou:
      'A dial for how attractive “safe” money is: high real yields generally mean tighter conditions for borrowers and asset prices everywhere.',
  },
  us10y: {
    name: 'US 10-year Treasury yield',
    oneLiner:
      'The interest rate the US government pays to borrow for ten years — often called the world’s most important number.',
    whatItIs: 'The market yield on the 10-year US Treasury note, set afresh every trading day.',
    whyItMatters:
      'It steers mortgage rates, corporate borrowing and the valuation of assets globally — including in Australia.',
    tendedToMean:
      'Fast rises of half a point or more within weeks have often accompanied big policy shifts or financial accidents.',
    cantTell:
      'The level alone doesn’t say why it moved — growth, inflation and fear each tell a different story at the same number.',
    forYou:
      'A rough dial for global borrowing costs: up generally means money is getting tighter worldwide.',
  },
  'breakeven-5y5y': {
    name: 'US inflation expectations (5y5y)',
    oneLiner:
      'The annual inflation rate markets expect, on average, five to ten years from now.',
    whatItIs:
      'The “5y5y forward breakeven”: derived from the gap between ordinary and inflation-protected Treasury yields, five years forward starting in five years.',
    whyItMatters:
      'The cleanest read on long-horizon inflation expectations — the thing central banks watch to keep their credibility.',
    tendedToMean:
      'Sustained moves above roughly 2.5% have historically unsettled central banks; slides toward 1% signal feared deflation.',
    cantTell:
      'It reflects market prices, which can move on liquidity and hedging — not just on genuine belief.',
    forYou:
      'A gauge of whether markets still trust inflation to stay near target over the long run.',
  },
  'govt-interest-revenue': {
    name: 'US interest payments vs revenue',
    oneLiner:
      'How big the US federal government’s interest bill has become relative to its income.',
    whatItIs:
      'US government interest outlays divided by total receipts, from the national accounts (both quarterly).',
    whyItMatters:
      'Rising interest costs crowd out other spending and sharpen deficit and debt-ceiling politics.',
    tendedToMean:
      'Peaks historically coincided with high-rate or high-debt eras; the ratio climbed steeply after 2022.',
    cantTell:
      'It moves slowly (quarterly) and says nothing about any single year’s politics or decisions.',
    forYou: 'Quiet background for US deficit and debt-ceiling headlines.',
  },
  'dollar-broad': {
    name: 'Broad US dollar index',
    oneLiner:
      'The US dollar’s average value against a wide basket of its trading partners’ currencies.',
    whatItIs: 'The Federal Reserve’s trade-weighted broad dollar index.',
    whyItMatters:
      'A strong dollar tightens conditions worldwide — it prices commodities, debts and trade for nearly everyone.',
    tendedToMean:
      'Dollar surges have coincided with global stress episodes — 1997 Asia, 2008, 2022.',
    cantTell:
      'It is an index, not an exchange rate — it quotes no single pair (and says nothing about USD/Toman).',
    forYou:
      'A broad strength gauge: sustained high readings pressure emerging-market currencies and commodity prices.',
  },
  usdjpy: {
    name: 'USD/JPY',
    oneLiner:
      'How many Japanese yen one US dollar buys — the busiest Asian currency pair.',
    whatItIs: 'The USD/JPY exchange rate.',
    whyItMatters:
      'The yen funds the classic “carry trade”; sharp yen moves force global positioning to unwind.',
    tendedToMean:
      'Fast falls (yen surges) forced carry-trade unwinds — notably in 2008 and August 2024.',
    cantTell:
      'The pair reflects two economies and intervention rumours at once; direction alone is not a signal.',
    forYou:
      'A watched proxy for global risk appetite: yen strength usually means investors are de-risking.',
  },
  'gold-usd': {
    name: 'Gold price (ounce)',
    ticker: 'XAU',
    oneLiner: 'The world gold price — what one troy ounce costs in US dollars.',
    whatItIs:
      'The spot price of one troy ounce of gold, quoted in US dollars; the history chart shows World Bank monthly averages.',
    whyItMatters:
      'Gold is the classic hedge: its price tends to draw bid when investors fear inflation, crisis or currency debasement.',
    tendedToMean:
      'Long run-ups marked the inflationary 1970s, the 2000s commodity boom and the post-2020 era; the sharpest falls came when real interest rates spiked.',
    cantTell:
      'Real yields, the dollar, central-bank buying and fear all pull at once — the level alone is not a forecast of anything.',
    forYou: 'The headline hard-asset price the other precious-metal cards on this page are built on.',
  },
  'silver-usd': {
    name: 'Silver price (ounce)',
    ticker: 'XAG',
    oneLiner: 'The world silver price — what one troy ounce costs in US dollars.',
    whatItIs:
      'The spot price of one troy ounce of silver, quoted in US dollars; the history chart shows World Bank monthly averages.',
    whyItMatters:
      'Silver is half precious metal, half industrial input — investment demand and factory demand (electronics, solar panels) pull on the same price.',
    tendedToMean:
      'Its famous spikes (1980, 2011) came when investment fever met tight supply; long quiet stretches followed as the memory faded.',
    cantTell:
      'Far more volatile than gold, and its industrial and investment sides can pull in opposite directions at once.',
    forYou: 'Gold’s industrial cousin — the other leg of the Gold / Silver ratio card.',
  },
  'gold-silver': {
    name: 'Gold / Silver',
    ticker: 'XAU/XAG',
    oneLiner:
      'How many ounces of silver one ounce of gold buys — the classic hard-asset ratio.',
    whatItIs: 'The world gold price divided by the silver price.',
    whyItMatters:
      'Silver is half precious metal, half industrial input — the ratio pits monetary hedging against growth demand.',
    tendedToMean:
      'Very high ratios (gold very expensive versus silver) marked stress eras — 1991, 2008, 2020, and records in 2025–26.',
    cantTell:
      'Both metals often move together; the ratio is not a forecast for either price.',
    forYou:
      'A long-standing stress-and-demand gauge that metals watchers keep an eye on at extremes.',
  },
  'gold-btc': {
    name: 'Gold / Bitcoin',
    ticker: 'XAU/BTC',
    oneLiner: 'How many bitcoins one ounce of gold buys — old money priced in new money.',
    whatItIs: 'The gold price in US dollars divided by the bitcoin price.',
    whyItMatters:
      'A shorthand for how the market values the two flagship “hard” assets against each other.',
    tendedToMean:
      'The ratio collapsed during crypto manias (2020–21) and spiked whenever bitcoin fell harder than gold.',
    cantTell:
      'These are two very different assets — this is a ratio, not a view on either one.',
    forYou: 'Context for conversations comparing bitcoin with gold as a store of value.',
  },
  'silver-btc': {
    name: 'Silver / Bitcoin',
    ticker: 'XAG/BTC',
    oneLiner: 'Silver’s price expressed in bitcoin terms.',
    whatItIs: 'The silver price divided by the bitcoin price.',
    whyItMatters:
      'Tracks the industrial precious metal against the flagship crypto asset in one number.',
    tendedToMean: 'Its history is dominated almost entirely by the bitcoin side of the fraction.',
    cantTell: 'The silver leg barely moves — this ratio mostly mirrors bitcoin.',
    forYou: 'A curiosity ratio for comparing very different asset classes.',
  },
  'copper-gold': {
    name: 'Copper / Gold',
    oneLiner: 'Copper’s price relative to gold — growth versus safety in one ratio.',
    whatItIs: 'The World Bank copper price divided by the gold price (monthly averages).',
    whyItMatters:
      'Copper wires the world’s growth — “Dr Copper” — while gold is the fear hedge; the ratio pits the two against each other.',
    tendedToMean:
      'A low copper/gold ratio has coincided with growth scares; high readings came with industrial booms.',
    cantTell:
      'Monthly and slow-moving, and both legs are US-dollar priced — dollar swings leak in.',
    forYou: 'A broad gauge of the world economy’s appetite for growth.',
  },
  brent: {
    name: 'Brent oil',
    oneLiner: 'The world’s benchmark oil price.',
    whatItIs:
      'Brent crude — the price of a barrel of North Sea oil, the benchmark for most of the world’s traded oil.',
    whyItMatters:
      'Oil feeds fuel, transport and electricity costs everywhere, and energy is a swing factor in inflation.',
    tendedToMean:
      'Spikes above roughly $120 usually meant war or supply shocks feeding inflation; crashes below about $40 marked demand collapses.',
    cantTell:
      'Supply, demand and geopolitics pull the price at once — the level alone doesn’t separate them.',
    forYou: 'A rough leading input for the direction of fuel and energy costs.',
  },
  'm2-us': {
    name: 'US money supply',
    ticker: 'M2',
    oneLiner: 'The amount of money in the US economy — cash, current accounts and most savings.',
    whatItIs: 'The Federal Reserve’s M2 measure of the money supply (monthly).',
    whyItMatters:
      'Money growth feeds spending power; the 2020–22 surge and the following contraction framed the whole inflation cycle.',
    tendedToMean:
      'Year-on-year falls are rare — they clustered around recessions and the 2022–23 tightening.',
    cantTell:
      'How fast money changes hands matters as much as how much of it exists; supply alone doesn’t set prices.',
    forYou: 'Background that makes inflation debates easier to follow.',
  },
  'china-pmi': {
    name: 'China manufacturing PMI',
    oneLiner: 'A monthly survey of Chinese factory activity — above 50 means expansion.',
    whatItIs:
      'China’s official manufacturing Purchasing Managers’ Index from the national statistics bureau (hand-entered here).',
    whyItMatters:
      'China is the world’s factory and Australia’s biggest export customer; PMI is one of the first indicators to turn in any cycle.',
    tendedToMean:
      'Runs below 50 have marked Chinese slowdowns that fed through to commodity prices and the Australian dollar.',
    cantTell:
      'It measures breadth (how many firms grew), not size — one month’s dip is not a trend.',
    forYou: 'A key early indicator of demand for Australian exports.',
  },
  usdcny: {
    name: 'USD/CNY',
    oneLiner: 'How many Chinese yuan one US dollar buys — the world’s most managed major rate.',
    whatItIs: 'The USD/CNY exchange rate, steered by China’s central bank inside a band.',
    whyItMatters:
      'It affects the price of Chinese goods worldwide and sets the tone of trade politics.',
    tendedToMean:
      'Moves toward either edge of the tolerated band have historically carried trade-war signalling.',
    cantTell: 'Managed, not free — the level reflects policy choices as much as markets.',
    forYou: 'Context for trade and tariff headlines.',
  },
  'rba-cash-rate': {
    name: 'RBA cash rate',
    oneLiner: 'Australia’s official interest rate — the Reserve Bank’s single policy dial.',
    whatItIs:
      'The RBA’s cash rate target, decided at board meetings through the year.',
    whyItMatters:
      'It flows directly into mortgage, deposit and business borrowing costs across Australia.',
    tendedToMean:
      'Moves come in steps and runs — hikes into inflation, cuts into weakness — and set the cycle for years at a time.',
    cantTell:
      'The current setting says nothing about the next move; markets reprice that constantly.',
    forYou: 'The anchor for variable mortgage and savings rates in Australia.',
  },
  'au-cpi': {
    name: 'Australian CPI inflation',
    oneLiner: 'How fast Australian consumer prices are rising, compared with a year ago.',
    whatItIs: 'The ABS headline CPI (all groups) annual change, quarterly.',
    whyItMatters:
      'The RBA’s 2–3% inflation target drives its rate decisions — this is the scoreboard.',
    tendedToMean:
      'Sustained runs above 3% invited rate hikes (2007, 2022); readings below 2% marked soft-demand eras.',
    cantTell:
      'Headline inflation swings with volatile items — fuel, fruit, one-off electricity measures.',
    forYou: 'The broad cost-of-living gauge behind rate headlines.',
  },
  'au-trimmed-mean': {
    name: 'Australian trimmed-mean inflation',
    oneLiner: 'The RBA’s preferred core inflation measure — the steady middle of price changes.',
    whatItIs:
      'The ABS trimmed mean, which drops the wildest price rises and falls each quarter before averaging.',
    whyItMatters:
      'This is the gauge the RBA actually targets — steadier and more persistent than headline CPI.',
    tendedToMean:
      'Sustained readings above 3% signal persistent inflation pressure; it led the 2021–24 episode.',
    cantTell: 'Smoother means slower — it lags turning points by design.',
    forYou: 'The number that most directly moves the RBA’s hand.',
  },
  audusd: {
    name: 'AUD/USD',
    oneLiner: 'The Australian dollar’s value in US cents.',
    whatItIs: 'The AUD/USD exchange rate.',
    whyItMatters:
      'Australia’s key pair — it prices imports, exports and overseas travel in one number.',
    tendedToMean:
      'Historic lows (under roughly 62¢) came with global panics; sustained strength (above 80¢) with commodity booms.',
    cantTell:
      'Commodity prices, US rates and global risk sentiment all move it at once.',
    forYou:
      'A weaker dollar makes travel and imports dearer and exports cheaper; the reverse when it strengthens.',
  },
  audjpy: {
    name: 'AUD/JPY',
    oneLiner: 'The Australian dollar against the Japanese yen — the classic carry pair.',
    whatItIs: 'The AUD/JPY exchange rate.',
    whyItMatters:
      'Australian dollars are held for their yield while the yen funds that carry — sharp reversals hit both sides.',
    tendedToMean:
      'Plunges of 5% or more within weeks have marked global de-risking episodes.',
    cantTell:
      'Both central banks’ policies move it over years, not just risk sentiment this week.',
    forYou: 'A watched risk barometer for world markets.',
  },
  'au-us-10y-gap': {
    name: 'Australia–US 10-year gap',
    oneLiner: 'Whether Australian 10-year yields sit above or below US ones.',
    whatItIs: 'Australia’s 10-year government bond yield minus the US 10-year yield.',
    whyItMatters:
      'The gap steers the Australian dollar: global investors compare the two when placing money.',
    tendedToMean:
      'A negative gap — US yields above Australia’s — has coincided with weaker eras for the AUD.',
    cantTell: 'Both legs move — the gap can shift with no Australian news at all.',
    forYou: 'Background for why the Australian dollar moves with US rate news.',
  },
  'gold-aud': {
    name: 'Gold price in AUD',
    oneLiner: 'The world gold price in Australian dollars.',
    whatItIs: 'The gold price in US dollars converted into Australian dollars.',
    whyItMatters:
      'For Australian buyers of coins, ETFs or jewellery, this — not the US-dollar price — is the real price.',
    tendedToMean:
      'It rose through most of the 2000s and 2020s as gold climbed and the AUD varied around it.',
    cantTell:
      'It is mostly the US-dollar gold price plus the AUD/USD rate — either can move it.',
    forYou: 'The gold price Australian buyers actually face.',
  },
  'iron-ore': {
    name: 'Iron ore price',
    oneLiner: 'The price of iron ore — Australia’s single biggest export.',
    whatItIs: 'The World Bank’s spot price for iron ore delivered to China (monthly).',
    whyItMatters:
      'Iron ore funds Australian miners, budgets and the broader terms of trade.',
    tendedToMean:
      'Sub-$60 stretches marked Chinese slowdowns; the 2020–21 surge above $200 marked stimulus booms.',
    cantTell:
      'China’s property and stimulus cycle dominates — forecasts for this price are famously poor.',
    forYou: 'A big swing factor in Australian government revenue and the AUD.',
  },
  'terms-of-trade': {
    name: 'Terms of trade',
    oneLiner: 'Australia’s export prices versus its import prices.',
    whatItIs:
      'The ABS terms-of-trade index — export price index divided by import price index (quarterly).',
    whyItMatters:
      'Rising terms of trade make the country richer without shipping anything more; falling ones squeeze national income.',
    tendedToMean:
      'The mining booms (2000s, 2020–21) sent it soaring; the GFC and the 2012–15 commodity slide sank it.',
    cantTell:
      'Slow, quarterly, and a rear-view measure of price shifts already felt in incomes.',
    forYou: 'The quiet driver behind Australian budget booms and busts.',
  },
  'au-unemployment': {
    name: 'Australian unemployment rate',
    oneLiner: 'The share of Australians looking for work who cannot find it.',
    whatItIs: 'The ABS Labour Force unemployment rate (monthly).',
    whyItMatters:
      'The RBA watches the labour market closely — jobs drive spending, wages and rate decisions.',
    tendedToMean:
      'Rises of half a point off a low have often marked turning points toward slowdowns.',
    cantTell:
      'Monthly and seasonally noisy; the participation rate moves it too, and averages hide regions.',
    forYou: 'The broadest single gauge of how the economy is treating households.',
  },
  'au-home-values': {
    name: 'Australian home values',
    oneLiner: 'The average price of Australian homes, as an index.',
    whatItIs: 'The ABS residential property price index (quarterly).',
    whyItMatters:
      'Housing is the biggest asset and debt source for Australian households; prices feed wealth and confidence.',
    tendedToMean:
      'Falls have been rare and mostly brief — 2008, pockets of 2017–19, and 2022–23 with rate hikes.',
    cantTell:
      'A national average hides big city differences, and values lag actual transactions.',
    forYou: 'Background to the biggest financial decision most households make.',
  },
  'au-household-debt-arrears': {
    name: 'Australian household debt to income',
    oneLiner: 'How large Australian household debt is relative to income — among the world’s highest.',
    whatItIs:
      'The household debt-to-income ratio the RBA republishes from ABS calculations (quarterly).',
    whyItMatters:
      'High debt makes household spending sensitive to every rate move — a key sensitivity the RBA weighs.',
    tendedToMean:
      'Australia has sat above 150% since the mid-2000s; trouble historically shows up in arrears with a lag after rate rises.',
    cantTell:
      'An aggregate — averages hide who actually holds the debt and how comfortably.',
    forYou: 'Context for why rate moves dominate Australian household finances.',
  },
};

export const insightsCopyEn = {
  ui: {
    subtitle: 'What global and Australian money indicators are saying, in plain language.',
    updated: 'Updated',
    summaryTitle: 'Market summary',
    dataFrom: 'Showing saved data from {date} — it could not be refreshed.',
    loadError: 'Insights could not be loaded.',
    retry: 'Try again',
    disclaimerBar: 'General information only — not financial advice.',
    howCalculated: 'How this is calculated',
    howCalculatedHide: 'Hide the calculation',
    explainerIntro:
      'Every indicator with a warning rule casts one equal vote: warning or not. Info-only cards never vote.',
    explainerScore: 'The score is simply warnings ÷ voters — no hidden weighting.',
    explainerLabels:
      'Under 20% in warning reads Relaxed, 20–39% Cautious, 40–59% Stressed, 60% or more Alarmed.',
    explainerStale:
      'Data older than its normal update cycle (plus a grace period) is greyed out and excluded from the counts.',
    explainerBacktest:
      'Thresholds were tested against 2008, 2020 and 2022 history before launch.',
    inWarning: '{warnings} of {voting} indicators in warning',
    excludedNote: '{n} excluded — stale or missing data',
    noSummary: 'Not enough voting data to summarise yet.',
    jumpTo: 'Jump to:',
    whatChangedTitle: 'What changed this week',
    quietWeek: 'No indicator changed state this week.',
    quietWeekHint: 'Quiet stretches are normal — Coming up below lists the next scheduled updates.',
    movedToWarning: '{name} moved into its warning zone',
    movedToNormal: '{name} stepped out of its warning zone',
    bigMoversTitle: 'The biggest 30-day moves',
    moversUnitNote: 'Moves shown in each indicator’s own units.',
    viewCard: 'View card',
    filterLabel: 'Filter indicators',
    searchLabel: 'Search indicators',
    searchPlaceholder: 'Search {n} indicators…',
    searchClear: 'Clear search',
    filterAll: 'All',
    filterWarning: 'Warning',
    filterNormal: 'Normal',
    filterContext: 'Context',
    resultsShown: '{shown} of {total} cards shown',
    clearFilters: 'Clear filters',
    noMatches: 'No indicator matches these filters.',
    comingUpTitle: 'Coming up',
    noEvents: 'No key dates recorded yet — this calendar is maintained by hand.',
    daysAway: '{n} days away',
    today: 'Today',
    withinDays: 'Within {n} days',
    expand: 'Show details',
    collapse: 'Hide details',
    position10y: '10-year position',
    positionValue: '{pct} of the past 10 years were lower than this',
    positionNoData: 'Not enough history to place this value.',
    days7: '7-day',
    days30: '30-day',
    updatedOn: 'Updated {date}',
    sourceLabel: 'Source',
    viewSource: 'View source',
    shareCard: 'Share this card',
    shareCopied: 'Link copied',
    chartTitle: 'The last {range}',
    range10y: '10 years',
    range5y: '5 years',
    range1y: '1 year',
    chartRangeLabel: 'Chart time range',
    viewSection: 'View section',
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
    unavailableCard: 'No data available for this indicator right now.',
    staleSince: 'Not updated since {date} — shown greyed and excluded from counts.',
    noHistoryStatus: 'Too little history to score this indicator yet.',
    ruleTitle: 'Warning when',
    infoOnly: 'Info only — shown for context, never votes.',
    whatItIs: 'What it is',
    whyItMatters: 'Why it matters',
    tendedToMean: 'What it has tended to mean',
    cantTell: 'What it can’t tell you',
    forYou: 'What this means for you',
    chartAria: '{name}, 10-year history: lowest {low}, highest {high}, latest {latest}.',
    aboutTitle: 'About this data',
    aboutSourcesTitle: 'Sources',
    aboutSourcesBody:
      'Official and public sources only: the US Federal Reserve (FRED), the Reserve Bank of Australia, the Australian Bureau of Statistics, the World Bank, the European Central Bank (via Frankfurter), TGJU and gold-api.com. Each card names and links its own source.',
    aboutScheduleTitle: 'Update schedule',
    aboutScheduleBody:
      'A scheduled job refreshes every source once a day (04:20 UTC) and writes one precomputed snapshot; the page you are reading serves that snapshot. Daily series update daily, monthly and quarterly ones when their publisher releases.',
    aboutRulesTitle: 'How “warning” is decided',
    aboutRulesBody:
      'Each indicator has one fixed, published rule (shown on its card). When the rule fires, the card is in warning and adds one vote to its section summary. Thresholds were backtested against 2008, 2020 and 2022.',
    disclaimerTitle: 'Full disclaimer',
    disclaimerBody1:
      'Insights is general information about economic and market indicators. It is not financial advice, and nothing here is a recommendation to buy, sell or hold anything.',
    disclaimerBody2:
      'Indicators describe the past and present, not the future. Data can be delayed, revised or wrong. Before acting on money decisions, check primary sources and consider qualified advice — Currena is not licensed to provide it.',
  },

  sections: {
    global: 'Global',
    australia: 'Australia',
  },

  groups: {
    'rates-credit': 'Rates and credit',
    currencies: 'Currencies',
    'metals-crypto': 'Metals, crypto and hard assets',
    'stocks-growth': 'Stocks, growth and liquidity',
    'interest-inflation': 'Interest and inflation',
    'currency-trade': 'Currency and trade',
    'jobs-housing': 'Jobs and housing',
  },

  status: {
    warning: 'Warning',
    normal: 'Normal',
    context: 'Context',
    stale: 'Stale',
    'no-history': 'Limited history',
    unavailable: 'No data',
  },

  label: {
    relaxed: 'Relaxed',
    cautious: 'Cautious',
    stressed: 'Stressed',
    alarmed: 'Alarmed',
  },

  units: {
    none: '',
    percent: '%',
    points: 'pts',
    usd: 'US$',
    aud: 'A$',
    'usd-bn': 'bn',
  },

  rule: {
    info: 'info only — never votes',
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
    or: 'or',
  },

  indicators: INDICATORS,
};

export type InsightsCopy = typeof insightsCopyEn;
