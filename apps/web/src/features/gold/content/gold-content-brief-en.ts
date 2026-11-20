/**
 * gold-content-brief-en.ts — the EAGER tier of the gold indicator
 * records (S5 M1): plainLabel + defaultCopy for the 37 lane voters,
 * transcribed byte-faithful from docs/gold-redesign/09 §3 (Session 3's
 * authored records; the field contract is 08 §3).
 *
 * Consumed eagerly by the closed cards + the BriefingCard reason rows
 * (the M3/M4 milestones wire the module — nothing imports it yet). The
 * deep tier (all 52 records) lives in the two gold-content-deep-* files
 * behind the loadGoldDeep() dynamic-import branches of gold-content.ts,
 * so this file stays the only content the first screen pays for.
 */

import type { GoldBriefMap } from './gold-content-core';

export const briefEn: GoldBriefMap = {
  'real-yield-10y': {
    plainLabel: 'Real yields (inflation-adjusted)',
    defaultCopy: "What a 10-year US government bond really earns after expected inflation. High real yields are gold's classic headwind; falling ones its classic tailwind.",
  },
  us10y: {
    plainLabel: 'US 10-year Treasury yield',
    defaultCopy: "The headline interest rate the US government pays to borrow for ten years. Through this page's meter it counts as a gold headwind when it climbs.",
  },
  us30y: {
    plainLabel: 'US 30-year Treasury yield',
    defaultCopy: 'What the US government pays to borrow for thirty years — the long-horizon price of money. High-for-its-decade readings count against gold in this meter.',
  },
  'fed-target': {
    plainLabel: "The Fed's policy rate",
    defaultCopy: 'The overnight interest rate the Federal Reserve sets — the base price of dollar money. A high setting counts against gold in this meter.',
  },
  'fed-expectations': {
    plainLabel: 'Where markets see the Fed next',
    defaultCopy: "What short-term market rates imply about the Fed's next moves. A market pricing higher-for-longer counts against gold here.",
  },
  'ecb-dfr': {
    plainLabel: 'ECB deposit rate',
    defaultCopy: "The eurozone's equivalent of the Fed's policy rate — what banks earn parking money at the ECB. High global policy rates count against gold here.",
  },
  'real-yield-5y': {
    plainLabel: 'Real yields, 5-year',
    defaultCopy: 'The inflation-adjusted return on 5-year US government lending — the part of the curve where Fed policy bites first.',
  },
  'dollar-basket': {
    plainLabel: 'The dollar against six big currencies',
    defaultCopy: "The US dollar's strength against six major currencies in one weighted number. A stronger dollar usually weighs on gold.",
  },
  usdjpy: {
    plainLabel: 'Dollar against the yen',
    defaultCopy: 'How many yen one dollar buys. A rising dollar-yen usually means dollar strength and carry appetite — both lean against gold.',
  },
  'us-japan-10y-gap': {
    plainLabel: 'US–Japan 10-year yield gap',
    defaultCopy: "How much more the US pays to borrow for ten years than Japan. A wider gap pulls money toward dollars — usually gold's pressure side.",
  },
  'usd-reserve-share': {
    plainLabel: "The dollar's share of world reserves",
    defaultCopy: "What share of the world's foreign-exchange reserves sits in dollars. A rising share means the world is still concentrating on the dollar — gold's pressure side.",
  },
  'nyfed-custody': {
    plainLabel: 'Foreign official custody at the NY Fed',
    defaultCopy: "US government bonds held for foreign central banks at the New York Fed. Rising custody means official demand for dollar assets — gold's pressure side here.",
  },
  'dollar-broad': {
    plainLabel: 'The broad trade-weighted dollar',
    defaultCopy: "The dollar against a wide basket of US trading partners' currencies — the honest inverse of gold's usual pattern.",
  },
  'dollar-eme': {
    plainLabel: 'The dollar vs emerging markets',
    defaultCopy: "The dollar against emerging-market currencies — the marginal gold buyer's leg. EME dollar strength squeezes the buyers who set the price at the margin.",
  },
  'stress-stlfsi': {
    plainLabel: 'US financial stress index',
    defaultCopy: "A single number for how stressed US money markets and funding are — zero means historically average. Elevated stress usually feeds gold's safe-haven bid.",
  },
  nfci: {
    plainLabel: 'US financial conditions index',
    defaultCopy: "The Chicago Fed's alternative reading of US financial conditions — how easy or tight money is across markets. Tight conditions usually lean toward gold.",
  },
  vix: {
    plainLabel: "The stock market's fear gauge",
    defaultCopy: 'The price the options market charges for insurance against stock-market drops. Expensive insurance means fear — and fear usually feeds gold.',
  },
  'gold-silver': {
    plainLabel: 'The gold-to-silver ratio',
    defaultCopy: 'How many ounces of silver one ounce of gold buys. A very high ratio is a classic fear reading — markets paying up for monetary metal over industrial metal.',
  },
  'term-premium-10y': {
    plainLabel: 'The 10-year term premium',
    defaultCopy: 'The extra yield investors demand for holding long-dated bonds beyond expected short rates — the fear-and-supply compensation. A rising premium has historically supported, not hurt, gold.',
  },
  ebp: {
    plainLabel: 'Excess bond premium',
    defaultCopy: "The extra yield corporate bonds pay beyond what their expected defaults justify — the research literature's preferred risk-appetite gauge. Elevated readings lean toward gold.",
  },
  'michigan-sentiment': {
    plainLabel: 'US consumer mood',
    defaultCopy: 'How cheerful or gloomy American households feel about the economy. Gloom is the gold-positive side of this seat — pessimism historically feeds haven demand.',
  },
  'gpr-daily': {
    plainLabel: 'Geopolitical risk (7-day)',
    defaultCopy: "How much war, terror and tension coverage fills the world's newspapers this week. Spikes usually feed gold's headline bid — often briefly.",
  },
  'epu-us': {
    plainLabel: 'US economic policy uncertainty',
    defaultCopy: "How uncertain US policy looks — elections, regulation, fiscal fights. Elevated uncertainty raises gold's hedging premium.",
  },
  'sp500-breadth-ratio': {
    plainLabel: 'Stock market breadth',
    defaultCopy: 'Whether the stock rally is broad or carried by a handful of giants. Narrowing breadth is the risk-off side — gold-positive in this meter.',
  },
  'bank-stress': {
    plainLabel: 'Bank stress (discount window price)',
    defaultCopy: "The price at which banks borrow emergency cash from the Fed's standing facility. This rate moving is itself the signal — it normally only moves when banks are stressed.",
  },
  'us-cpi-yoy': {
    plainLabel: 'US consumer inflation',
    defaultCopy: "How fast US consumer prices are rising over the past year. Hot inflation feeds gold's hedge demand — but how the Fed responds matters more for the price (see real rates).",
  },
  'us-pce-core-yoy': {
    plainLabel: "US core inflation (the Fed's gauge)",
    defaultCopy: "The Fed's preferred inflation gauge — the stickier, food-and-energy-excluded measure. Persistent core inflation keeps the hedge case alive.",
  },
  'euro-hicp': {
    plainLabel: 'Euro-area inflation',
    defaultCopy: 'Eurozone consumer inflation — the other half of the rich-world inflation picture gold is priced against.',
  },
  'breakeven-5y5y': {
    plainLabel: 'Long-horizon inflation expectations',
    defaultCopy: "The inflation rate markets expect for the five years starting five years from now — the cleanest read on long-run faith in money. Rising long expectations are gold's side.",
  },
  'breakeven-tilt': {
    plainLabel: 'The tilt of inflation expectations',
    defaultCopy: 'Whether long-run inflation expectations are pulling ahead of near-term ones — expectations building rather than receding.',
  },
  t5yie: {
    plainLabel: '5-year breakeven inflation',
    defaultCopy: 'The inflation markets expect over the next five years, read off the yield gap between nominal and inflation-protected bonds.',
  },
  'michigan-1y-expectations': {
    plainLabel: "Households' 1-year inflation expectations",
    defaultCopy: 'What American households expect prices to do next year. Households often price inflation in before markets do.',
  },
  'm2-us': {
    plainLabel: 'US money supply growth',
    defaultCopy: 'How fast the US money stock is growing. Fast money growth is the debasement channel — the long-horizon argument for owning the asset outside the banking system.',
  },
  'us-deficit-12m': {
    plainLabel: 'The US federal deficit (12-month)',
    defaultCopy: 'How much more Washington spends than it collects, over the trailing year. Big sustained deficits are the fiscal leg of the debasement argument.',
  },
  'michigan-5y-expectations': {
    plainLabel: "Households' long-run inflation expectations",
    defaultCopy: 'The inflation rate American households expect for the next 5–10 years — the slow, household version of the long breakeven.',
  },
  'cftc-gold-positioning': {
    plainLabel: 'Trader positioning in gold',
    defaultCopy: "What futures speculators are doing in gold — the market's fuel gauge. Very crowded long positions are historically fragile.",
  },
  'cftc-gold-gross-long': {
    plainLabel: 'Gross long positioning',
    defaultCopy: 'How much of the gold futures market is outright long — the crowd gauge without the shorts netted out.',
  },
};
