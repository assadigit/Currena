/**
 * Insights copy dictionary — ENGLISH (source of truth, Phase I4 → I15).
 *
 * The Insights page carries by far the largest string corpus in the app
 * (41 indicators × 6 copy fields + consequence lines + structural strings,
 * both languages) — ~2× the whole existing main dictionary. Loading it
 * through the eager en.ts/fa.ts dictionaries would grow the ENTRY bundle
 * the roadmap explicitly protects ("the Insights route must be lazy-loaded
 * so initial JS does not regress"). So this pair of modules keeps every
 * rule of the house i18n system — en.ts-style source of truth, fa
 * shape-checked at compile time, no hardcoded text in components — while
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
 * I15 (2026-10-08 UI spec): names are PLAIN first (Block F6 — "What the US
 * government pays to borrow for 10 years"), the technical tag rides along
 * as the small `ticker` (Block G8); consequence lines are state-keyed
 * (Block F4).
 */

import type { IndicatorId } from '@currena/core';

/**
 * State-keyed consequence lines (data spec §6 + UI Block F4). Chosen by the
 * reading's position band and 30-day direction:
 *   high_rising  — percentile ≥ 80 AND change30d > 0
 *   high_easing  — percentile ≥ 80 and not rising
 *   typical      — 20–80 band
 *   low          — ≤ 20 band
 *   jumping      — price rows whose |moveScore| clears the big-mover threshold
 * All optional: an item without state lines falls back to `oneLiner`.
 */
export interface ConsequenceLines {
  highRising?: string;
  highEasing?: string;
  typical?: string;
  low?: string;
  jumping?: string;
}

/** One indicator's copy fields — `ticker` is optional (pair-style names carry it implicitly). */
export interface IndicatorCopyEntry {
  /** Plain-language title (F6) — the reader-facing name. */
  name: string;
  /** Small technical tag shown beside the name (G8, isolated dir="ltr"). */
  ticker?: string;
  /** The default consequence line + detail-panel opener (fallback when `lines` lacks a state). */
  oneLiner: string;
  /** State-keyed consequence lines (F4) — see ConsequenceLines. */
  lines?: ConsequenceLines;
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
    ticker: 'T10Y2Y',
    oneLiner:
      'The gap between long and short-term US government borrowing — negative values, an “inverted curve”, are the classic recession warning.',
    lines: {
      highRising: 'The gap is wide and widening — a steep curve usually comes with growth or inflation pressure.',
      highEasing: 'The gap is wide but narrowing — still the shape of normal, healthy conditions.',
      typical: 'The curve is near its usual shape — no unusual signal either way.',
      low: 'A small or negative gap — the shape that has preceded most US recessions.',
    },
    whatItIs:
      'The 10-year minus 2-year Treasury yield difference — the most-watched shape of the US “yield curve”, from FRED.',
    whyItMatters:
      'Banks borrow short and lend long; an inverted curve squeezes that business and has preceded most US recessions.',
    tendedToMean:
      'An inverted curve preceded every US recession of the past 60 years — usually by 6 to 24 months, with occasional false alarms.',
    cantTell:
      'It says nothing about timing or size of any downturn, and other countries’ curves can tell a different story.',
    forYou:
      'One of the most-watched early-warning gauges in finance — useful context, never a signal to act on alone.',
  },
  'real-yield-10y': {
    name: 'US 10-year interest after inflation',
    ticker: 'DFII10',
    oneLiner:
      'What 10-year US government bonds pay after inflation — the “real” return the world’s biggest debt market demands.',
    lines: {
      highRising: 'Savings tend to earn more after inflation — borrowers and riskier assets usually face tighter conditions.',
      highEasing: 'Real yields are high but easing — a little relief for borrowers, if it lasts.',
      typical: 'Real yields sit in their usual range — balanced between savers and borrowers.',
      low: 'Real yields are low — the setting where holding “safe” money earns little after inflation.',
    },
    whatItIs:
      'The market yield on 10-year US inflation-protected Treasuries — the return lenders demand after inflation, from FRED.',
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
    name: 'What the US government pays to borrow for 10 years',
    ticker: 'DGS10',
    oneLiner:
      'The interest rate on 10-year US government debt — often called the world’s most important number.',
    lines: {
      highRising: 'Borrowing costs are high and rising — home loans and business credit usually follow, with a lag.',
      highEasing: 'Borrowing costs are high but easing — relief, if it lasts, usually reaches loans with a delay.',
      typical: 'Borrowing costs are in their usual range — no unusual pressure either way.',
      low: 'Borrowing costs are cheap by recent standards — usually supportive for loans and asset prices.',
    },
    whatItIs:
      'The market yield on the 10-year US Treasury note, set afresh every trading day.',
    whyItMatters:
      'It steers mortgage rates, corporate borrowing and the valuation of assets globally — including in Australia.',
    tendedToMean:
      'Fast rises of half a point or more within weeks have often accompanied big policy shifts or financial accidents.',
    cantTell:
      'The level alone doesn’t say why it moved — growth, inflation and fear each tell a different story at the same number.',
    forYou:
      'A rough dial for global borrowing costs: up generally means money is getting tighter worldwide.',
  },
  'fed-target': {
    name: 'The US central bank’s policy rate',
    ticker: 'DFEDTARL/U',
    oneLiner:
      'The US Federal Reserve’s target for its overnight interest rate — the base of the US rate system.',
    lines: {
      highRising: 'US policy is tight and tightening — borrowing, jobs and prices usually cool with a lag.',
      highEasing: 'US policy is tight but easing — the first stage of relief for borrowers, when it lasts.',
      typical: 'The policy rate sits in its usual range for the decade.',
      low: 'US policy is loose by recent standards — usually supportive for borrowing and asset prices.',
    },
    whatItIs:
      'The midpoint of the Federal Reserve’s target range for the overnight rate (FRED’s DFEDTARL and DFEDTARU) — the card shows the full range, set at eight scheduled meetings a year.',
    whyItMatters:
      'It is the anchor of the US rate system: mortgages, savings, business loans and global dollar borrowing all reprice around it.',
    tendedToMean:
      'The near-zero setting after 2008 lasted seven years; the 2022 hikes were the fastest in four decades — settings this big take years to work through.',
    cantTell:
      'The setting says nothing about the next decision — markets reprice that constantly — and its effects arrive with long, uneven lags.',
    forYou:
      'The world’s most-copied rate dial: what the Fed decides tends to reach Australian mortgage and savings rates indirectly.',
  },
  'ecb-dfr': {
    name: 'The euro area’s policy rate',
    ticker: 'DFR',
    oneLiner:
      'The European Central Bank’s rate on bank deposits — the euro area’s main policy dial.',
    lines: {
      highRising: 'Euro-area policy is tight and rising — borrowing across Europe usually gets dearer and growth softer.',
      highEasing: 'Euro-area policy is tight but easing — early relief for European borrowers, if it lasts.',
      typical: 'The ECB’s rate sits in its usual range for the decade.',
      low: 'Euro-area policy is loose by recent standards — the 2010s setting that made saving pay little.',
    },
    whatItIs:
      'The ECB’s deposit facility rate — what banks earn on money parked overnight at the European Central Bank, from the ECB Data Portal.',
    whyItMatters:
      'The euro area is a huge bloc of savers and borrowers; this one rate steers their loans and deposits, and rivals the Fed’s dial in reach.',
    tendedToMean:
      'The negative-rate era of 2014–22 — a first for a major central bank — tried to revive inflation; the 2022–23 hikes fought it. Both worked slowly.',
    cantTell:
      'It describes one bloc’s policy, not the world’s — and like every policy rate, it works with long, uneven lags.',
    forYou:
      'A second anchor for world money: ECB tightening or easing tends to move global borrowing costs alongside the Fed’s.',
  },
  'govt-interest-revenue': {
    name: 'The US government’s interest bill vs its income',
    ticker: 'A091 ÷ W006',
    oneLiner:
      'How big the US federal government’s interest bill has become relative to its income.',
    lines: {
      highRising: 'Interest is eating a growing slice of US income — pressure that tends to sharpen deficit politics.',
      highEasing: 'The interest burden is high but easing — pressure on US budget politics slowly lifting.',
      typical: 'The interest burden sits in its usual range for the decade.',
      low: 'The interest bill is small relative to income — one less pressure on US budget politics.',
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
    ticker: 'CPIAUCSL',
    oneLiner:
      'How fast US consumer prices are rising, compared with a year ago.',
    lines: {
      highRising: 'US prices are rising faster than usual — pressure that tends to keep world rates high.',
      highEasing: 'US inflation is high but easing — the pressure on world rates slowly lifting.',
      typical: 'US inflation sits in its usual range — near or below the Fed’s 2% goal.',
      low: 'US inflation is low — the rare setting that usually lets central banks ease.',
    },
    whatItIs:
      'The 12-month change in the US consumer price index (FRED’s CPIAUCSL) — the world’s most-watched inflation number, published monthly.',
    whyItMatters:
      'US inflation sets the mood for world interest rates: hot readings tend to delay rate cuts everywhere, cold ones hasten them.',
    tendedToMean:
      'The 2021–22 surge to a 9% peak forced the fastest Fed hikes in four decades; low readings, like 2020’s, preceded long easy-money eras.',
    cantTell:
      'It is one country’s prices in one month — a single reading sets no trend, and the mix of goods inside it shifts.',
    forYou:
      'The number behind world rate headlines: high US inflation usually means global borrowing stays dearer for longer.',
  },
  'breakeven-5y5y': {
    name: 'Expected US inflation, five to ten years ahead',
    ticker: 'T5YIFR',
    oneLiner:
      'The annual inflation rate markets expect, on average, five to ten years from now.',
    lines: {
      highRising: 'Markets are pricing more future inflation — the mood that tends to keep long-term rates high.',
      highEasing: 'Markets still price above-normal future inflation, but the pressure is easing.',
      typical: 'Long-run US inflation expectations sit near their usual level.',
      low: 'Markets price weak future inflation — the deflation-fear setting that invites easy policy.',
    },
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
  'stress-stlfsi': {
    name: 'Stress in US money markets',
    ticker: 'STLFSI4',
    oneLiner:
      'The St. Louis Fed’s single gauge of stress across US money and credit markets — zero is average, above zero is above-average stress.',
    lines: {
      highRising: 'Stress in US money markets is building — the backdrop that usually tightens lending worldwide.',
      highEasing: 'Stress is above average but easing — conditions repairing rather than panic.',
      typical: 'US financial stress sits near its average — the market plumbing working normally.',
      low: 'Stress is unusually low — the calm that usually comes with easy conditions.',
    },
    whatItIs:
      'The STLFSI4 index from FRED — 18 market measures (yields, spreads, volatility) combined into one weekly number centred on zero.',
    whyItMatters:
      'It condenses many separate stress signals into one number that analysts and policymakers actually watch.',
    tendedToMean:
      'Readings above zero for a month or more marked 2008 and the 2020 COVID shock; brief blips above zero are common and harmless.',
    cantTell:
      'It is backward-looking and US-centred — it cannot say where markets go next.',
    forYou:
      'Background for headlines about “financial stress”: calm here broadly means market plumbing is working.',
  },
  nfci: {
    name: 'US financial conditions',
    ticker: 'NFCI',
    oneLiner:
      'The Chicago Fed’s broad gauge of how easily money moves through the US financial system — zero is average.',
    lines: {
      highRising: 'US financial conditions are tightening — money getting harder to move, which usually slows lending.',
      highEasing: 'Conditions remain tighter than average, but are easing.',
      typical: 'US financial conditions sit near their historical average.',
      low: 'Conditions are looser than average — money moving easily, usually supportive of credit.',
    },
    whatItIs:
      'The Chicago Fed’s National Financial Conditions Index (FRED) — about 100 measures of money markets, debt markets and banking combined into one weekly number centred on zero.',
    whyItMatters:
      'A broad single dial for the tightness of the whole US financial system — the mood central banks react to.',
    tendedToMean:
      'Spikes above zero marked 2008 and the 2020 COVID shock; long stretches below zero marked the easy-money eras.',
    cantTell:
      'Weekly, backward-looking and US-only — it says how tight money was, not what happens next.',
    forYou:
      'A second opinion on the stress gauges: tight US conditions tend to spread to world lending, including the offshore funding Australian banks use.',
  },
  'gold-silver': {
    name: 'Gold’s price versus silver',
    ticker: 'XAU/XAG',
    oneLiner:
      'How many ounces of silver one ounce of gold buys — the classic hard-asset ratio.',
    lines: {
      highRising: 'Gold is running dearer against silver — the mix that tends to appear when fear leads.',
      highEasing: 'Gold remains dear against silver, but the gap is easing.',
      typical: 'The gold-to-silver ratio sits in its usual range.',
      low: 'Silver is running dear against gold — the mix that tends to appear with industrial strength.',
    },
    whatItIs:
      'The gold price divided by the silver price, live from a metals feed, on a decade of World Bank monthly history.',
    whyItMatters:
      'Silver is half precious metal, half industrial input — the ratio pits monetary hedging against growth demand.',
    tendedToMean:
      'Very high ratios (gold very expensive versus silver) marked stress eras — 1991, 2008, 2020, and records in 2025–26.',
    cantTell:
      'Both metals often move together; the ratio is not a forecast for either price.',
    forYou:
      'A long-standing stress-and-demand gauge that metals watchers keep an eye on at extremes.',
  },
  'dollar-basket': {
    name: 'The dollar vs six big currencies',
    ticker: 'CURRENA BASKET',
    oneLiner:
      'The Currena dollar basket — the US dollar’s average value against the euro, yen, pound, Canadian dollar, krona and franc.',
    lines: {
      highRising: 'The dollar is strong and strengthening — a mix that tends to pressure world prices and debts.',
      highEasing: 'The dollar is strong but easing — pressure on world markets slowly lifting.',
      typical: 'The dollar sits in its usual range for the decade.',
      low: 'The dollar is weak by recent standards — usually easier conditions for world trade and debts.',
    },
    whatItIs:
      'The Currena dollar basket: a weighted average of the dollar against the euro, yen, pound, Canadian dollar, Swedish krona and Swiss franc, computed daily from ECB reference rates. It tracks close to the famous DXY index, but it is not the official DXY.',
    whyItMatters:
      'A strong dollar tightens conditions worldwide — it prices commodities, debts and trade for nearly everyone, including Australia.',
    tendedToMean:
      'Dollar surges have coincided with global stress episodes — 1997 Asia, 2008, 2022; weak-dollar stretches usually meant easier world money.',
    cantTell:
      'It is an index, not an exchange rate — it names no single pair, and its level says nothing about what to do.',
    forYou:
      'A broad strength gauge: a sustained strong dollar tends to pressure commodity prices and the Australian dollar.',
  },
  usdjpy: {
    name: 'Dollar vs yen',
    ticker: 'USD/JPY',
    oneLiner:
      'How many Japanese yen one US dollar buys — the busiest Asian currency pair.',
    lines: {
      highRising: 'A strong dollar against the yen — Japanese goods and travel tend to get cheaper elsewhere.',
      highEasing: 'The dollar sits high against the yen but is easing off it.',
      typical: 'Dollar–yen sits in its usual range for the decade.',
      low: 'The dollar is weak against the yen — the yen-surge setting that has shaken world markets.',
    },
    whatItIs:
      'The USD/JPY exchange rate — how many yen one US dollar buys, from ECB reference rates via Frankfurter.',
    whyItMatters:
      'The yen funds the classic “carry trade”; sharp yen moves force global positioning to unwind.',
    tendedToMean:
      'Fast falls (yen surges) forced carry-trade unwinds — notably in 2008 and August 2024.',
    cantTell:
      'The pair reflects two economies and intervention rumours at once; direction alone is not a signal.',
    forYou:
      'A watched proxy for global risk appetite: yen strength usually means investors are de-risking.',
  },
  'eur-usd': {
    name: 'Euro per US dollar',
    ticker: 'EUR/USD',
    oneLiner:
      'How many euros one US dollar buys — the world’s most-traded currency pair, shown for context.',
    lines: {
      highRising: 'The dollar is gaining on the euro — strength that tends to pressure world prices.',
      highEasing: 'The dollar sits strong against the euro but is easing off it.',
      typical: 'The dollar–euro rate sits in its usual range.',
      low: 'The dollar is weak against the euro — a setting that usually eases pressure on world prices.',
    },
    whatItIs:
      'How many euros one US dollar buys, from ECB reference rates via Frankfurter — the flip side of the market’s usual EUR/USD quote.',
    whyItMatters:
      'The world’s most-traded currency pair — a raw read on the dollar against the euro area, the planet’s other big money bloc.',
    tendedToMean:
      'Readings near or above parity — a dollar worth a euro or more — came in 2000–02 and 2022, strong-dollar stress eras; the 2010s sat well below.',
    cantTell:
      'A context card: one pair, information-only, voting in no gauge — and it says nothing about the Australian dollar directly.',
    forYou:
      'Context for European travel and purchases: the Australian dollar moves against the euro on its own, so the AUD rate is the one to check.',
  },
  'china-pmi': {
    name: 'Chinese factory activity',
    ticker: 'NBS PMI',
    oneLiner:
      'A monthly survey of Chinese factory activity — above 50 means expansion.',
    lines: {
      highRising: 'Chinese factories are expanding and quickening — usually good news for Australian exporters.',
      highEasing: 'Chinese factories are still expanding, but more slowly.',
      typical: 'Chinese factory activity sits in its usual range for the decade.',
      low: 'Chinese factories are contracting — the reading that tends to pressure commodity prices and the AUD.',
    },
    whatItIs:
      'China’s official manufacturing Purchasing Managers’ Index, from the national statistics bureau’s monthly survey of factory managers, hand-entered here from official releases. Above 50 means expansion; below 50, contraction.',
    whyItMatters:
      'China is the world’s factory and Australia’s biggest export customer; PMI is one of the first indicators to turn in any cycle.',
    tendedToMean:
      'Runs below 50 have marked Chinese slowdowns that fed through to commodity prices and the Australian dollar.',
    cantTell:
      'It measures breadth (how many firms grew), not size — one month’s dip is not a trend.',
    forYou: 'A key early indicator of demand for Australian exports.',
  },
  'm2-us': {
    name: 'The amount of money in the US economy',
    ticker: 'M2',
    oneLiner:
      'The amount of money in the US economy — cash, current accounts and most savings.',
    lines: {
      highRising: 'US money is growing fast again — the setting that historically fed spending and price pressure.',
      highEasing: 'Money growth is elevated but easing — pressure on prices cooling with it.',
      typical: 'US money growth sits in its usual range.',
      low: 'US money is shrinking year-on-year — rare, and historically clustered around recessions.',
    },
    whatItIs:
      'The Federal Reserve’s M2 measure of the money supply, monthly from FRED — cash, current accounts and most savings.',
    whyItMatters:
      'Money growth feeds spending power; the 2020–22 surge and the following contraction framed the whole inflation cycle.',
    tendedToMean:
      'Year-on-year falls are rare — they clustered around recessions and the 2022–23 tightening.',
    cantTell:
      'How fast money changes hands matters as much as how much of it exists; supply alone doesn’t set prices.',
    forYou: 'Background that makes inflation debates easier to follow.',
  },
  'copper-gold': {
    name: 'Copper’s price versus gold',
    ticker: 'Cu ÷ Au',
    oneLiner:
      'Copper’s price relative to gold — growth versus safety in one ratio.',
    lines: {
      highRising: 'Copper is running dear against gold — a signal that tends to come with industrial strength.',
      highEasing: 'Copper remains dear against gold, but the edge is easing.',
      typical: 'The copper-to-gold ratio sits in its usual range.',
      low: 'Copper is cheap against gold — the growth-scare mix that tends to accompany world slowdowns.',
    },
    whatItIs:
      'The World Bank copper price divided by the gold price (monthly averages).',
    whyItMatters:
      'Copper wires the world’s growth — “Dr Copper” — while gold is the fear hedge; the ratio pits the two against each other.',
    tendedToMean:
      'A low copper/gold ratio has coincided with growth scares; high readings came with industrial booms.',
    cantTell:
      'Monthly and slow-moving, and both legs are US-dollar priced — dollar swings leak in.',
    forYou: 'A broad gauge of the world economy’s appetite for growth.',
  },
  usdcny: {
    name: 'Dollar vs Chinese yuan',
    ticker: 'USD/CNY',
    oneLiner:
      'How many Chinese yuan one US dollar buys — the world’s most managed major rate.',
    lines: {
      highRising: 'The dollar is firming against the managed yuan — a mix that tends to sharpen trade politics.',
      highEasing: 'The dollar sits firm against the yuan but is easing.',
      typical: 'Dollar–yuan sits in its usual managed range.',
      low: 'The dollar is soft against the yuan — a mix that usually eases trade-politics tension.',
    },
    whatItIs:
      'The USD/CNY exchange rate, steered by China’s central bank inside a band (ECB reference rates via Frankfurter).',
    whyItMatters:
      'It affects the price of Chinese goods worldwide and sets the tone of trade politics.',
    tendedToMean:
      'Moves toward either edge of the tolerated band have historically carried trade-war signalling.',
    cantTell: 'Managed, not free — the level reflects policy choices as much as markets.',
    forYou: 'Context for trade and tariff headlines.',
  },
  brent: {
    name: 'Oil price (Brent)',
    ticker: 'DCOILBRENTEU',
    oneLiner:
      'The world’s benchmark oil price — what a barrel of Brent crude costs.',
    lines: {
      highRising: 'Oil is expensive and rising — petrol and delivery prices usually follow, with a lag.',
      highEasing: 'Oil is expensive but easing — relief for petrol prices, if it lasts.',
      typical: 'Oil is in its usual range for the decade — no unusual pressure on fuel costs.',
      low: 'Oil is cheap versus recent history — usually good news for fuel and transport costs.',
      jumping: 'Oil has jumped unusually fast — often war or supply shocks; wait before reading a trend.',
    },
    unitNote: 'US dollars per barrel',
    whatItIs:
      'Brent crude — the price of a barrel of North Sea oil, the benchmark for most of the world’s traded oil, from the US Energy Information Administration via FRED. Daily values arrive in weekly batches, so the figure is normally about a week old.',
    whyItMatters:
      'Oil feeds fuel, transport and electricity costs everywhere, and energy is a swing factor in inflation.',
    tendedToMean:
      'Spikes above roughly $120 usually meant war or supply shocks feeding inflation; crashes below about $40 marked demand collapses.',
    cantTell:
      'Supply, demand and geopolitics pull the price at once — the level alone doesn’t separate them.',
    forYou: 'A rough leading input for the direction of fuel and energy costs.',
  },
  'gold-usd': {
    name: 'Gold price (ounce)',
    ticker: 'XAU',
    oneLiner: 'The world price of one troy ounce of gold, in US dollars.',
    lines: {
      highRising: 'Gold is expensive and rising — jewellery and coin buyers usually pay more, and some savers treat it as a stress signal.',
      highEasing: 'Gold is expensive but easing from its highs — often a sign calm is returning to markets.',
      typical: 'Gold is trading in its usual range for the decade.',
      low: 'Gold is cheap versus recent history — the occasional buyer’s friend, the seller’s patience test.',
      jumping: 'Gold has jumped unusually fast — moves like this often accompany stress or big news; wait before reading a trend into it.',
    },
    unitNote: 'US dollars per troy ounce',
    whatItIs:
      'The spot price of gold per troy ounce, from a live metals feed (gold-api.com), on top of a decade of monthly World Bank prices.',
    whyItMatters:
      'Gold is the classic “fear + inflation” asset: it tends to rise when real rates fall or uncertainty spikes, and it anchors jewellery and savings prices in many countries.',
    tendedToMean:
      'Big multi-year gold runs have historically lined up with negative real interest rates or financial stress; long drags came when real rates were high.',
    cantTell:
      'It cannot tell you where it goes next, and its “record high” headlines ignore inflation — a record in dollars is not a record in purchasing power.',
    forYou:
      'Context for jewellery, coin and savings decisions — a high and rising price usually means paying more, nothing more.',
  },
  'silver-usd': {
    name: 'Silver price (ounce)',
    ticker: 'XAG',
    oneLiner: 'The world price of one troy ounce of silver, in US dollars.',
    lines: {
      highRising: 'Silver is expensive and rising — jewellery and electronics tend to cost more with it.',
      highEasing: 'Silver is expensive but easing from its highs — pressure on metal costs slowly lifting.',
      typical: 'Silver is trading in its usual range for the decade.',
      low: 'Silver is cheap versus recent history — a friend to jewellery budgets and industry.',
      jumping: 'Silver has jumped unusually fast — it moves harder than gold; wait before reading a trend.',
    },
    unitNote: 'US dollars per troy ounce',
    whatItIs:
      'The spot price of silver per troy ounce, from a live metals feed (gold-api.com), on top of a decade of monthly World Bank prices.',
    whyItMatters:
      'Silver is half precious metal, half industrial input — investment demand and factory demand (electronics, solar panels) pull on the same price.',
    tendedToMean:
      'Its famous spikes (1980, 2011) came when investment fever met tight supply; long quiet stretches followed as the memory faded.',
    cantTell:
      'Far more volatile than gold, and its industrial and investment sides can pull in opposite directions at once.',
    forYou:
      'Gold’s industrial cousin — the other leg of the gold-versus-silver ratio, and an ingredient in electronics and solar kit.',
  },
  'copper-usd': {
    name: 'Copper price',
    ticker: 'HG',
    oneLiner:
      'The world price of copper — the metal that wires homes, grids and machines.',
    lines: {
      highRising: 'Copper is expensive and rising — wiring, appliances and building costs tend to follow.',
      highEasing: 'Copper is expensive but easing — pressure on construction and goods costs slowly lifting.',
      typical: 'Copper is trading in its usual range for the decade.',
      low: 'Copper is cheap versus recent history — usually a friend to builders and manufacturers.',
      jumping: 'Copper has jumped unusually fast — often industrial news; wait before reading a trend.',
    },
    unitNote: 'US dollars per metric tonne',
    whatItIs:
      'The live copper price from a metals feed (gold-api.com), converted to US dollars per metric tonne; the 10-year position comes from World Bank monthly data.',
    whyItMatters:
      'Copper is the economy’s wiring — demand for it is a proxy for construction, electrification and factory output worldwide.',
    tendedToMean:
      'Copper spikes came with industrial booms and stimulus (2020–21); deep slumps marked growth scares like 2008 and 2015.',
    cantTell:
      'A single world price with a monthly history — it cannot say whether demand or supply moved it, or where it heads next.',
    forYou:
      'A dial for building and renovation costs: dearer copper tends to show up in wiring, plumbing and appliances.',
  },
  'btc-usd': {
    name: 'Bitcoin price',
    ticker: 'BTC',
    oneLiner:
      'The world price of one bitcoin, in US dollars, from a live feed.',
    lines: {
      highRising: 'Bitcoin is expensive and rising — a mood that tends to accompany easy money and risk appetite.',
      highEasing: 'Bitcoin is expensive but easing off its highs.',
      typical: 'Bitcoin is trading in its usual recent range.',
      low: 'Bitcoin is cheap versus its recent range — a smaller number on a famously jumpy asset.',
      jumping: 'Bitcoin has jumped unusually fast — normal for it; wait before reading a trend into it.',
    },
    unitNote: 'US dollars per bitcoin',
    whatItIs:
      'The live price of one bitcoin in US dollars, from gold-api.com. By design there is no 10-year position here — the feed carries no multi-year history — so the 7- and 30-day changes come from stored daily snapshots.',
    whyItMatters:
      'Bitcoin is the flagship of the crypto world: its mood tends to set the tone for a whole family of digital assets.',
    tendedToMean:
      'The great booms (2020–21) met easy money; the deep crash (2022) met tightening — a pattern of risk appetite, nothing steadier.',
    cantTell:
      'Famously volatile — the price says nothing about value, and nothing here is a view on what anyone should hold.',
    forYou:
      'A context price for crypto headlines — and a reminder that a fast-moving asset can move just as fast the other way.',
  },
  'gold-btc': {
    name: 'Gold versus Bitcoin',
    ticker: 'XAU/BTC',
    oneLiner: 'How many bitcoins one ounce of gold buys — old money priced in new money.',
    whatItIs:
      'The gold price in US dollars divided by the bitcoin price, both from a live metals feed (gold-api.com).',
    whyItMatters:
      'A shorthand for how the market values the two flagship “hard” assets against each other.',
    tendedToMean:
      'The ratio collapsed during crypto manias (2020–21) and spiked whenever bitcoin fell harder than gold.',
    cantTell:
      'These are two very different assets — this is a ratio, not a view on either one.',
    forYou: 'Context for conversations comparing bitcoin with gold as a store of value.',
  },
  'silver-btc': {
    name: 'Silver versus Bitcoin',
    ticker: 'XAG/BTC',
    oneLiner: 'Silver’s price expressed in bitcoin terms.',
    whatItIs:
      'The silver price divided by the bitcoin price, both from a live metals feed (gold-api.com).',
    whyItMatters:
      'Tracks the industrial precious metal against the flagship crypto asset in one number.',
    tendedToMean: 'Its history is dominated almost entirely by the bitcoin side of the fraction.',
    cantTell: 'The silver leg barely moves — this ratio mostly mirrors bitcoin.',
    forYou: 'A curiosity ratio for comparing very different asset classes.',
  },
  'au-cpi': {
    name: 'Australian prices vs a year ago',
    ticker: 'ABS CPI',
    oneLiner:
      'How fast Australian consumer prices are rising, compared with a year ago.',
    lines: {
      highRising: 'Prices are rising faster than the RBA’s 2–3% band — the setting that invites rate hikes.',
      highEasing: 'Inflation is above the band but easing — pressure on rates slowly lifting.',
      typical: 'Inflation sits inside or near the RBA’s usual 2–3% band.',
      low: 'Inflation is low — the setting that usually lets the RBA consider cuts.',
    },
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
    name: 'The steady middle of Australian price rises',
    ticker: 'ABS trimmed mean',
    oneLiner:
      'The RBA’s preferred core inflation measure — the steady middle of price changes.',
    lines: {
      highRising: 'Underlying inflation is above target and rising — the reading that usually keeps rates high.',
      highEasing: 'Underlying inflation is above target but easing — the pressure cooling from within.',
      typical: 'Underlying inflation sits near the RBA’s 2–3% band.',
      low: 'Underlying inflation is low — the setting that usually opens the door to rate cuts.',
    },
    whatItIs:
      'The ABS trimmed mean, which drops the wildest price rises and falls each quarter before averaging.',
    whyItMatters:
      'This is the gauge the RBA actually targets — steadier and more persistent than headline CPI.',
    tendedToMean:
      'Sustained readings above 3% signal persistent inflation pressure; it led the 2021–24 episode.',
    cantTell: 'Smoother means slower — it lags turning points by design.',
    forYou: 'The number that most directly moves the RBA’s hand.',
  },
  'au-us-10y-gap': {
    name: 'The gap between Australian and US 10-year borrowing',
    ticker: 'F2 − DGS10',
    oneLiner:
      'Whether Australian 10-year yields sit above or below US ones.',
    lines: {
      highRising: 'Australian 10-year rates sit well above US ones — a mix that tends to support the AUD.',
      highEasing: 'Australia’s 10-year premium over the US is high but narrowing.',
      typical: 'The Australia–US gap sits in its usual range.',
      low: 'US 10-year rates sit above Australia’s — the setting that has usually weighed on the AUD.',
    },
    whatItIs:
      'Australia’s 10-year government bond yield (RBA table F2) minus the US 10-year yield (FRED), published weekly with a short lag.',
    whyItMatters:
      'The gap steers the Australian dollar: global investors compare the two when placing money.',
    tendedToMean:
      'A negative gap — US yields above Australia’s — has coincided with weaker eras for the AUD.',
    cantTell: 'Both legs move — the gap can shift with no Australian news at all.',
    forYou: 'Background for why the Australian dollar moves with US rate news.',
  },
  'rba-cash-rate': {
    name: 'Australia’s official interest rate',
    ticker: 'RBA F1.1',
    oneLiner:
      'Australia’s official interest rate — the Reserve Bank’s single policy dial.',
    lines: {
      highRising: 'The RBA is tightening — variable home loans and savings rates usually follow within weeks.',
      highEasing: 'The cash rate is high but on hold or easing — first relief for variable borrowers.',
      typical: 'The cash rate sits in its usual range for the decade.',
      low: 'The cash rate is low — the setting that usually means cheap borrowing and thin savings returns.',
    },
    whatItIs:
      'The RBA’s cash rate target, decided at board meetings through the year (statistical table F1.1).',
    whyItMatters:
      'It flows directly into mortgage, deposit and business borrowing costs across Australia.',
    tendedToMean:
      'Moves come in steps and runs — hikes into inflation, cuts into weakness — and set the cycle for years at a time.',
    cantTell:
      'The current setting says nothing about the next move; markets reprice that constantly.',
    forYou: 'The anchor for variable mortgage and savings rates in Australia.',
  },
  'au-petrol-yoy': {
    name: 'Petrol prices vs a year ago',
    ticker: 'ABS CPI: Fuel',
    oneLiner:
      'How much more (or less) fuel costs than a year ago, as the ABS measures it.',
    lines: {
      highRising: 'Petrol is climbing faster than a year ago — pressure on family budgets and freight prices.',
      highEasing: 'Petrol inflation is high but easing — pressure at the bowser slowly lifting.',
      typical: 'Petrol prices are moving about as fast as they usually do.',
      low: 'Petrol is cheaper than a year ago — the rare reading that eases household budgets.',
    },
    whatItIs:
      'The 12-month change in the ABS CPI “automotive fuel” index — an index of fuel prices, not a pump price, published monthly.',
    whyItMatters:
      'Fuel is one of the most visible prices households meet — it feeds budgets, freight costs and headline inflation.',
    tendedToMean:
      'Big swings came with oil shocks: fuel inflation hit 35% in 2022 and fell hard in 2020 — petrol usually leads headline CPI’s turning points.',
    cantTell:
      'Monthly and about a month behind — pump prices move daily and differ by city, so the index approximates the bowser.',
    forYou:
      'A read on the fuel part of the cost of living: when this is high, the weekly tank fill and delivery prices usually feel it.',
  },
  'au-home-loan': {
    name: 'The home-loan rate people actually pay',
    ticker: 'RBA F6',
    oneLiner:
      'The average interest rate on outstanding owner-occupier home loans — what Australian households actually pay.',
    lines: {
      highRising: 'If you have a home loan, repayments sit high and are still rising.',
      highEasing: 'The average home-loan rate is high but easing — relief reaching variable loans with a lag.',
      typical: 'The average home-loan rate sits in its usual range for the decade.',
      low: 'Home-loan rates are cheap by recent standards — the easy setting for housing.',
    },
    whatItIs:
      'The average interest rate on outstanding owner-occupier home loans across all lenders, from the RBA’s F6 table — not the advertised rate, but the one households actually pay.',
    whyItMatters:
      'Home loans are the biggest debt of most Australian households; this average moves with each RBA decision and refinancing wave.',
    tendedToMean:
      'The 2022–24 rate climbs pushed it from record lows toward multi-decade highs; easing tends to arrive only as loans reprice and refinance.',
    cantTell:
      'Monthly, published about a month late, and an average — your own rate depends on your loan, lender and fixed or variable mix.',
    forYou:
      'If you hold a variable loan, this is the crowd you travel with; if fixed, it is the rate your loan eventually resets toward.',
  },
  'au-wage-growth': {
    name: 'Wage growth vs a year ago',
    ticker: 'WPI',
    oneLiner:
      'How fast Australian wages are rising, compared with a year ago, by the ABS wage price index.',
    lines: {
      highRising: 'Wages are growing faster than usual — the reading that usually means pay packets catching up.',
      highEasing: 'Wage growth is high but easing.',
      typical: 'Wage growth sits in its usual range for the decade.',
      low: 'Wage growth is weak — if prices rise faster, an hour’s pay covers less each year.',
    },
    whatItIs:
      'The 12-month change in the ABS Wage Price Index — the cost of an hour of labour, excluding bonuses, quarterly.',
    whyItMatters:
      'The card compares it with inflation: when wages grow slower than prices, an hour’s pay covers less year by year.',
    tendedToMean:
      'Wage growth above inflation marked the strong 2023–24 stretch; the long flat 2010s matched weak pay and weak prices together.',
    cantTell:
      'An average across all jobs — your own pay can move very differently, and bonuses are excluded.',
    forYou:
      'The scoreboard for whether the average pay packet is keeping up with the average price rise — context, not a personal forecast.',
  },
  'au-rent-yoy': {
    name: 'Rent growth vs a year ago',
    ticker: 'ABS CPI: Rents',
    oneLiner:
      'How fast Australian rents are rising, compared with a year ago.',
    lines: {
      highRising: 'Rents are rising unusually fast — pressure on renters’ budgets and the rental squeeze headlines.',
      highEasing: 'Rents are still rising fast, but the pace is easing.',
      typical: 'Rent growth sits in its usual range for the decade.',
      low: 'Rent growth is weak — the rare easing for renters’ budgets.',
    },
    whatItIs:
      'The 12-month change in the ABS CPI “rents” index — new and existing tenancies together, published monthly.',
    whyItMatters:
      'Rent is the biggest weekly bill for roughly a third of Australian households, and it feeds headline inflation and the RBA’s thinking.',
    tendedToMean:
      'The 2023–26 squeeze pushed rent growth to multi-decade highs as population growth met a tight supply of homes.',
    cantTell:
      'An Australia-wide average — city and regional markets can differ sharply, and existing rents move slower than new ones.',
    forYou:
      'If you rent, a fast-rising index matches a tough market at renewal time; if you own, it is background for the inflation story.',
  },
  'au-unemployment': {
    name: 'The share of Australians without work',
    ticker: 'ABS M13',
    oneLiner:
      'The share of Australians looking for work who cannot find it.',
    lines: {
      highRising: 'Unemployment is rising — the trend that usually makes job hunting harder and spending weaker.',
      highEasing: 'Unemployment is elevated but easing — job-market conditions slowly mending.',
      typical: 'The jobless rate sits in its usual range for the decade.',
      low: 'Jobs are plentiful — unemployment near its lows, usually good news for wages and confidence.',
    },
    whatItIs: 'The ABS Labour Force unemployment rate (monthly, table M13).',
    whyItMatters:
      'The RBA watches the labour market closely — jobs drive spending, wages and rate decisions.',
    tendedToMean:
      'Rises of half a point off a low have often marked turning points toward slowdowns.',
    cantTell:
      'Monthly and seasonally noisy; the participation rate moves it too, and averages hide regions.',
    forYou: 'The broadest single gauge of how the economy is treating households.',
  },
  'au-home-values': {
    name: 'Australian home prices',
    ticker: 'ABS RPPI',
    oneLiner:
      'The average price of Australian homes, as an index.',
    lines: {
      highRising: 'Home prices are high and rising — good for owners, harder for those trying to enter.',
      highEasing: 'Home prices are high but easing — the market cooling from its highs.',
      typical: 'Home prices are moving in their usual range for the decade.',
      low: 'Home prices are weak versus recent history — rare, and usually tied to rate squeezes or downturns.',
    },
    whatItIs:
      'The ABS residential property price index (quarterly) — the average price of Australian dwellings, as an index.',
    whyItMatters:
      'Housing is the biggest asset and debt source for Australian households; prices feed wealth and confidence.',
    tendedToMean:
      'Falls have been rare and mostly brief — 2008, pockets of 2017–19, and 2022–23 with rate hikes.',
    cantTell:
      'A national average hides big city differences, and values lag actual transactions.',
    forYou: 'Background to the biggest financial decision most households make.',
  },
  'au-household-debt-arrears': {
    name: 'Australian household debt versus income',
    ticker: 'RBA E2',
    oneLiner:
      'How large Australian household debt is relative to income — among the world’s highest.',
    lines: {
      highRising: 'Household debt is unusually high and still building — every rate rise tends to bite harder.',
      highEasing: 'The debt burden is high but easing — household balance sheets slowly mending.',
      typical: 'Household debt sits in its usual range for the decade.',
      low: 'Household debt is low relative to income — the setting that usually softens rate impacts.',
    },
    whatItIs:
      'The household debt-to-income ratio the RBA republishes from ABS calculations (quarterly, table E2).',
    whyItMatters:
      'High debt makes household spending sensitive to every rate move — a key sensitivity the RBA weighs.',
    tendedToMean:
      'Australia has sat above 150% since the mid-2000s; trouble historically shows up in arrears with a lag after rate rises.',
    cantTell:
      'An aggregate — averages hide who actually holds the debt and how comfortably.',
    forYou: 'Context for why rate moves dominate Australian household finances.',
  },
  audusd: {
    name: 'Australian dollar vs US dollar',
    ticker: 'AUD/USD',
    oneLiner: 'The Australian dollar’s value in US cents.',
    lines: {
      highRising: 'The Australian dollar is strong and strengthening — imports and overseas travel tend to get cheaper.',
      highEasing: 'The Australian dollar is strong but easing off its highs.',
      typical: 'The Australian dollar sits in its usual range for the decade.',
      low: 'The Australian dollar is weak — overseas travel and imports dearer, exports cheaper abroad.',
    },
    whatItIs:
      'The AUD/USD exchange rate — how many US dollars one Australian dollar buys, from ECB reference rates via Frankfurter.',
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
    name: 'Australian dollar vs yen',
    ticker: 'AUD/JPY',
    oneLiner:
      'The Australian dollar against the Japanese yen — the classic carry pair.',
    lines: {
      highRising: 'A firm Australian dollar against the yen — travel to Japan tends to get cheaper.',
      highEasing: 'The Australian dollar sits high against the yen but is easing.',
      typical: 'The Australian dollar–yen rate sits in its usual range.',
      low: 'The Australian dollar has fallen against the yen — the classic world de-risking signal.',
    },
    whatItIs:
      'The AUD/JPY exchange rate — how many yen one Australian dollar buys, derived from ECB reference rates.',
    whyItMatters:
      'Australian dollars are held for their yield while the yen funds that carry — sharp reversals hit both sides.',
    tendedToMean:
      'Plunges of 5% or more within weeks have marked global de-risking episodes.',
    cantTell:
      'Both central banks’ policies move it over years, not just risk sentiment this week.',
    forYou:
      'A watched risk barometer — and the rate that matters for Australian travel and shopping in Japan.',
  },
  'terms-of-trade': {
    name: 'Australia’s export prices vs import prices',
    ticker: 'ABS ToT',
    oneLiner: 'Australia’s export prices versus its import prices.',
    lines: {
      highRising: 'Export prices are outrunning import prices — the country getting richer without shipping more.',
      highEasing: 'Terms of trade are high but easing — the mining-boom premium slowly fading.',
      typical: 'Terms of trade sit in their usual range for the decade.',
      low: 'Import prices are outrunning export prices — the squeeze on national income, budgets and the dollar.',
    },
    whatItIs:
      'The ABS terms-of-trade index — export prices divided by import prices, quarterly.',
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
    ticker: 'World Bank',
    oneLiner:
      'The price of iron ore — Australia’s single biggest export.',
    lines: {
      highRising: 'Iron ore is expensive and rising — usually good news for mining jobs, budgets and the dollar.',
      highEasing: 'Iron ore is expensive but easing — the boom premium slowly fading.',
      typical: 'Iron ore sits in its usual range for the decade.',
      low: 'Iron ore is cheap versus recent history — pressure on mining profits, budgets and the dollar.',
      jumping: 'Iron ore has jumped unusually fast — often Chinese news; wait before reading a trend.',
    },
    unitNote: 'US dollars per dry metric tonne unit',
    whatItIs:
      'The World Bank’s monthly spot price for iron ore delivered to China, priced per dry metric tonne unit.',
    whyItMatters:
      'Iron ore funds Australian miners, budgets and the broader terms of trade.',
    tendedToMean:
      'Sub-$60 stretches marked Chinese slowdowns; the 2020–21 surge above $200 marked stimulus booms.',
    cantTell:
      'China’s property and stimulus cycle dominates — forecasts for this price are famously poor.',
    forYou: 'A big swing factor in Australian government revenue and the AUD.',
  },
  'gold-aud': {
    name: 'Gold price in Australian dollars',
    ticker: 'XAU/AUD',
    oneLiner: 'The world gold price in Australian dollars.',
    lines: {
      highRising: 'Gold is expensive in Australian dollars and rising — coins, jewellery and local metal cost more.',
      highEasing: 'Gold in Australian dollars is high but easing off its highs.',
      typical: 'Gold in Australian dollars sits in its usual range for the decade.',
      low: 'Gold is cheap in Australian dollars — the local metal at a rare discount.',
    },
    whatItIs:
      'The world gold price converted into Australian dollars — the live ounce price from a metals feed times the AUD exchange rate.',
    whyItMatters:
      'For coins, jewellery and gold funds priced in Australia, this — not the US-dollar price — is the real price.',
    tendedToMean:
      'It rose through most of the 2000s and 2020s as gold climbed and the AUD varied around it.',
    cantTell:
      'It is mostly the US-dollar gold price plus the AUD/USD rate — either can move it.',
    forYou:
      'The gold price Australians actually face when pricing coins, jewellery or metal funds.',
  },
};

export const insightsCopyEn = {
  ui: {
    title: 'Insights',
    subtitle: 'What the world’s money is doing — plain-language gauges, prices and indicators.',
    updatedAgo: 'Updated {ago} · {date}',
    // I15 H4: "Data as of {date}" — a daily snapshot, no seconds, honest.
    dataAsOf: 'Data as of {date}',
    dataAsOfTooltip: 'Daily snapshot, refreshed once a day.',
    progressLabel: 'Reading progress',
    loadError: 'Insights feed unavailable',
    retry: 'Try again',
    dataFrom: 'Data from an earlier snapshot ({date}) — showing the last good copy.',
    summaryTitle: 'Summary',
    viewSection: 'View section',
    viewCard: 'View card',
    searchPlaceholder: 'Search {n} indicators…',
    searchLabel: 'Search indicators',
    searchClear: 'Clear search',
    filterAll: 'All',
    filterLabel: 'Filter by status',
    filterWarning: 'Alert',
    filterNormal: 'Normal',
    filterContext: 'Context',
    resultsShown: '{shown} of {total} shown',
    clearFilters: 'Clear filters',
    noMatches: 'No indicator matches these filters.',
    // I10: the personal watchlist — pinned items render in their own
    // section above the groups; pins persist across visits.
    pinnedTitle: 'My watchlist',
    pinnedBadge: 'Pinned',
    pinAction: 'Add to watchlist',
    unpinAction: 'Remove from watchlist',
    // H1: verdict meters.
    heroTitle: 'Where things stand',
    verdictStepAria: '{section}: {label}, step {step} of 4',
    verdictMeterLabel: 'Reading on a four-step scale',
    verdictSentence: {
      relaxed: 'Conditions are calm across the board — nothing needs your attention today.',
      cautious: 'A few gauges are elevated — worth knowing about, not worth worrying about.',
      stressed: 'Several gauges are stretched at once — the kind of backdrop that makes finance headlines.',
      alarmed: 'Most gauges are flashing at once — the historical company this keeps is rough.',
    },
    inAlert: '{warnings} of {voting} indicators in alert',
    noSummary: 'Not enough voting data to read the gauges yet.',
    excludedNote: '{n} items set aside — stale or missing (see “How this is calculated”).',
    howCalculated: 'How is this calculated?',
    howCalculatedHide: 'Hide how this is calculated',
    explainerIntro:
      'Each question group is a gauge: the share of its voting indicators currently in their alert zone sets the gauge’s step (0 → step 1, up to ⅓ → 2, up to ⅔ → 3, more → 4).',
    explainerScore:
      'A region’s verdict is the rounded average of its gauge steps — escalated when any single gauge sits at step 4. The four words (Relaxed, Cautious, Stressed, Alarmed) describe conditions, never actions.',
    explainerLabels: 'The labels describe conditions, not advice — Currena never recommends actions.',
    explainerStale: 'Stale or missing items are excluded from every gauge and count, and shown greyed with their last date.',
    explainerBacktest: 'Thresholds were backtested against 2008, 2020 and 2022 — the tables live in the project docs.',
    // H1 note: the Australia-first reading order with a swap setting.
    orderSwap: 'Show {other} first',
    // H2: alerting-indicator chips under each verdict meter.
    alertChipsTitle: 'Alerting now',
    alertChipMore: '+{n} more',
    // H3: the big-mover callout.
    bigMoverTitle: 'The biggest move right now',
    bigMoverMove: '{change} over 30 days',
    bigMoverView: 'View this indicator',
    // H5: what changed — one line.
    whatChangedLine: 'This week: {changes}',
    quietWeekLine: 'A quiet week — no indicator changed state.',
    quietWeekNext: 'Next up: {event} on {date}',
    // H6: the next-up strip.
    comingUpTitle: 'Next up',
    noEvents: 'No key dates recorded yet — this calendar is maintained by hand.',
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
    pricesSubtitle: 'What the key commodities cost — context, not scored indicators.',
    pricePositionLow: 'cheap',
    pricePositionTypical: 'normal',
    pricePositionHigh: 'expensive',
    btcRatiosLabel: 'Context only, not used in signals',
    goldPerBtc: 'Gold per Bitcoin: {value}',
    silverPerBtc: 'Silver per Bitcoin: {value}',
    goldAudLine: 'In Australian dollars: {value}',
    copperUnitNote: 'converted from the live US price',
    pricesAsOf: 'as of {date}',
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
    alertZoneLabel: 'Alert zone',
    rangeEndLow: 'lowest in 10 years',
    rangeEndHigh: 'highest in 10 years',
    days7: '7-day',
    days30: '30-day',
    updatedOn: 'Updated {date}',
    sourceLabel: 'Source',
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
    lastKnownValue: 'Last known: {value} on {date}',
    staleSince: 'Last value on {date} — shown greyed and excluded from all gauges.',
    noHistoryStatus: 'Too little history to score this indicator yet.',
    ruleTitle: 'Alert when',
    infoOnly: 'Info only — shown for context, never votes.',
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
    disclaimerBar: 'General information only — not advice.',
    aboutTitle: 'About this data',
    aboutSourcesTitle: 'Sources',
    aboutSourcesBody:
      'Official and public sources only: the US Federal Reserve (FRED), the European Central Bank, the Reserve Bank of Australia, the Australian Bureau of Statistics, the World Bank, Frankfurter and gold-api.com. Each card names and links its own source.',
    fredNotice:
      'This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis.',
    fredTerms: 'FRED API terms',
    attributionTitle: 'Attribution',
    attributionRba: 'Source: Reserve Bank of Australia, 2026.',
    attributionAbs: 'Source: Australian Bureau of Statistics, licensed under CC BY 4.0.',
    attributionEcb: 'ECB reference rates, served by Frankfurter. Source: European Central Bank.',
    attributionBasket:
      'The Currena dollar basket is computed from ECB reference rates — it is not the official DXY index.',
    aboutScheduleTitle: 'Update schedule',
    aboutScheduleBody:
      'A scheduled job refreshes every source once a day (04:20 UTC) and writes one precomputed snapshot; the page you are reading serves that snapshot. Daily series update daily, monthly and quarterly ones when their publisher releases.',
    aboutRulesTitle: 'How “alert” is decided',
    aboutRulesBody:
      'Each indicator has one fixed, published rule (shown on its card). When the rule fires, the card is in alert and adds one vote to its gauge. Thresholds were backtested against 2008, 2020 and 2022.',
    disclaimerTitle: 'Full disclaimer',
    disclaimerBody1:
      'Insights is general information about economic and market indicators. It is not financial advice, and nothing here recommends any action on any asset.',
    disclaimerBody2:
      'Indicators describe the past and present, not the future. Data can be delayed, revised or wrong. Before acting on money decisions, check primary sources and consider qualified advice — Currena is not licensed to provide it.',
    // I13: the snapshot CSV export (About this data → download button).
    downloadCsv: 'Download the data (CSV)',
    csvHint:
      'Every indicator on this page with its value, changes and source — plain numbers, ready for any spreadsheet.',
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

  sections: {
    global: 'Global',
    australia: 'Australia',
  },

  /** Question-group headings (L2) — the gauge questions, verbatim from the owner spec. */
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

  /** The one-line answer under each gauge heading (L2). */
  gaugeAnswers: {
    'borrowing-costs': 'Government and bank borrowing costs — they steer every other rate.',
    'prices-heat': 'Inflation pressure in the world’s biggest economy.',
    'market-stress': 'Fear and stress in money markets.',
    'dollar-strength': 'The US dollar against the currencies that matter to it.',
    'growth-health': 'The real-economy engines: China’s factories, US money, industrial metal demand.',
    'prices-board': 'What the key commodities cost.',
    'au-inflation-rates': 'Australian inflation and the rates that respond to it.',
    'au-households': 'Mortgages, rents, wages and jobs — the household squeeze.',
    'au-trade-currency': 'Exports, imports and the Australian dollar.',
  },

  status: {
    warning: 'Alert',
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
    index: '',
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
    belowAux: 'below its paired comparison (wage growth below inflation)',
    or: 'or',
  },

  /* ---------------------------------------------------------------- *
   * I17 (v2, Block T1) — the "Together" connection cards.
   * Copy rules: hedged ("usually", "tends to"), never advice, no
   * buy/sell wording. Every evidence tag stays "to verify" until the
   * owner confirms the evidence (spec note) — one string, one place.
   * ---------------------------------------------------------------- */
  together: {
    title: 'Together',
    subtitle:
      'How the indicators usually relate. Each card checks whether the usual pattern is showing today.',
    state: {
      active: 'Active',
      partly: 'Partly active',
      inactive: 'Not active',
      disagree: 'Signals disagree',
      unknown: 'Not enough fresh data',
    },
    evidenceToVerify: 'Evidence: to verify',
    viewLegCard: 'View this indicator',
    // Leg phrase assembly (telegraphic — bilingual-safe, no verb agreement).
    phrases: {
      levelDir: '{name}: {level} and {direction}',
      levelOnly: '{name}: {level}',
      dirOnly: '{name}: {direction}',
      none: '{name}: no fresh reading',
    },
    level: { high: 'high', typical: 'mid-range', low: 'low' },
    direction: { rising: 'rising', falling: 'falling', steady: 'steady' },
    connections: {
      'real-yields-gold': {
        name: 'Real yields and gold',
        legs: { 'real-yield-10y': 'real yields', 'gold-usd': 'gold' },
        relation:
          'Real yields and gold usually move in opposite directions — when “safe” money pays more after inflation, gold tends to lose shine, and the other way round.',
        rightNow: {
          active: 'Right now {a} while {b} — the usual see-saw is working.',
          partly: 'Right now {a}; {b} — only part of the see-saw is showing.',
          inactive: 'Right now {a} and {b} — both too quiet to read.',
          disagree: 'Right now {a} and {b} — both stretched the same way, so the usual see-saw is not in place.',
          unknown: 'One side of this connection has no fresh data right now.',
        },
      },
      'dollar-gold-oil': {
        name: 'The dollar, gold and oil',
        legs: { 'dollar-basket': 'the dollar', 'gold-usd': 'gold', brent: 'oil' },
        relation:
          'Gold and oil are priced in US dollars, so a strong dollar tends to weigh on them, and a weak one tends to lift them.',
        rightNow: {
          active: 'Right now {a}, with {b} and {c} — the usual dollar pressure is showing.',
          partly: 'Right now {a}; {b}, {c} — only part of the pattern is showing.',
          inactive: 'Right now {a}, {b}, {c} — all too quiet to read.',
          disagree: 'Right now {a}, yet {b} and {c} — the usual dollar pressure is not showing.',
          unknown: 'One side of this connection has no fresh data right now.',
        },
      },
      'oil-expectations-costs': {
        name: 'Oil, inflation expectations and borrowing costs',
        legs: { brent: 'oil', 'breakeven-5y5y': 'inflation expectations', us10y: '10-year borrowing costs' },
        relation:
          'When oil jumps, markets tend to expect more inflation, and long-term borrowing costs tend to rise with it.',
        rightNow: {
          active: 'Right now {a}, {b}, {c} — the chain is in place.',
          partly: 'Right now {a}, {b}, {c} — the chain is only partly engaged.',
          inactive: 'Right now {a}, {b}, {c} — the chain is quiet.',
          disagree: 'Right now {a}, {b}, {c} — the links point against each other.',
          unknown: 'One link in this chain has no fresh data right now.',
        },
      },
      'copper-china-growth': {
        name: 'Copper demand, Chinese factories and money',
        legs: {
          'copper-gold': 'the copper-to-gold ratio',
          'china-pmi': 'Chinese factory activity',
          'm2-us': 'US money supply',
        },
        relation:
          'Copper is wired into industry, so a firm copper-to-gold ratio tends to come with busy factories and growing money — and the mix tends to soften together too.',
        rightNow: {
          active: 'Right now {a}, {b}, {c} — the growth mix is in place.',
          partly: 'Right now {a}, {b}, {c} — the growth mix is only partly showing.',
          inactive: 'Right now {a}, {b}, {c} — the growth mix is quiet.',
          disagree: 'Right now {a}, {b}, {c} — the pieces point against each other.',
          unknown: 'One piece of this mix has no fresh data right now.',
        },
      },
      'iron-terms-aud': {
        name: 'Iron ore, the terms of trade and the Australian dollar',
        legs: {
          'iron-ore': 'iron ore',
          'terms-of-trade': 'the terms of trade',
          audusd: 'the Australian dollar',
        },
        relation:
          'Iron ore is one of Australia’s biggest exports, so firm export prices tend to lift the terms of trade and, over time, the Australian dollar.',
        rightNow: {
          active: 'Right now {a}, {b}, {c} — the export chain is in place.',
          partly: 'Right now {a}, {b}, {c} — only part of the export chain is showing.',
          inactive: 'Right now {a}, {b}, {c} — the export chain is quiet.',
          disagree: 'Right now {a}, {b}, {c} — the links point against each other.',
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
          'When the RBA lifts the cash rate, the home-loan rates people actually pay tend to follow, and debt servicing tends to get heavier.',
        rightNow: {
          active: 'Right now {a}, {b}, {c} — the household rate chain is engaged.',
          partly: 'Right now {a}, {b}, {c} — the household rate chain is partly engaged.',
          inactive: 'Right now {a}, {b}, {c} — the household rate chain is quiet.',
          disagree: 'Right now {a}, {b}, {c} — the links point against each other.',
          unknown: 'One link in this chain has no fresh data right now.',
        },
      },
    },
  },

  /* ---------------------------------------------------------------- *
   * I17 (v2-gated, Blocks S1–S3) — "What the signals say".
   * Conditions, never advice: no green/red for supportive/against,
   * icons + words only; the "before you act" box is always visible.
   * The lean words describe conditions — they never recommend action.
   * ---------------------------------------------------------------- */
  signals: {
    title: 'What the signals say',
    subtitle:
      'The conditions that usually surround each metal, in plain words — conditions, not forecasts, and not advice.',
    conditionsMet: '{met} of {total} conditions met',
    lean: {
      'mostly-supportive': 'Mostly supportive',
      mixed: 'Mixed',
      'mostly-unsupportive': 'Mostly unsupportive',
    },
    sideSupportive: 'Usually supports {metal}',
    sideAgainst: 'Usually works against {metal}',
    sideNeutral: 'Sitting neutral',
    sideUnknown: 'Cannot read right now',
    conditionState: {
      supportive: 'in place',
      against: 'working against',
      neutral: 'sitting neutral',
      unknown: 'cannot read',
    },
    metals: { gold: 'gold', silver: 'silver' },
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
    // The three plain checks (S1).
    checkPosition: '10-year position',
    checkDrivers: 'Usual drivers',
    checkSpeed: '30-day speed',
    speedMeasuring: 'Measuring — the daily history is still building.',
    notEnoughData: 'Not enough fresh data to read this card yet.',
    // S3: the fixed "before you act" box — never behind a click.
    beforeYouActTitle: 'Before you act',
    beforeYouAct: [
      'Signals cannot predict prices.',
      'Prices can fall even when conditions look supportive.',
      'These logics play out over months and years, not days.',
      'Dealing costs — the gap between a dealer’s buying and selling prices — can matter more to small buyers than timing.',
    ],
  },

  indicators: INDICATORS,
};

export type InsightsCopy = typeof insightsCopyEn;
