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

/* ------------------------------------------------------------------ *
 * Layer 1 — plain-language copy (docs/insights/layer1/PLAIN-LANGUAGE-SPEC.md).
 *
 * Layer 1 adds fixed, hand-quality plain-language writing to EVERY
 * indicator on the Insights page, in EN + FA, so each card answers
 * "what is this, and what does it mean for my everyday life?" NO AI at
 * runtime — the copy is static, bundled, identical for every visitor.
 *
 * The NEW Layer-1 fields live here (a new top-level `layer1` object on
 * `insightsCopyEn`/`insightsCopyFa`). The approved `whatItIs` /
 * `whyItMatters` from `IndicatorCopyEntry` are REUSED (decision D-02 in
 * docs/insights/layer1/DECISIONS.md — approved wording wins over the
 * style guide); the accessor `getIndicatorCopy(id, lang)` merges them.
 *
 * G1–G8 (spec §9) are enforced by the vitest test at
 * apps/web/src/components/insights/layer1/layer1.test.ts.
 * ------------------------------------------------------------------ */

/** A Layer-1 connection between two indicators (spec §4 `connections`). */
export interface Layer1Connection {
  /** The target indicator id (must exist in the Layer-1 inventory). */
  with: string;
  /** One plain sentence describing the relationship. */
  text: string;
  /** How reliable the relationship is (spec §4: reliable / usually / sometimes). */
  strength: 'reliable' | 'usually' | 'sometimes';
}

/** A glossary entry (spec §7): `{ term, plain (≤ 2 sentences), example? }`. */
export interface Layer1GlossaryEntry {
  /** The term itself (the word the copy uses). */
  term: string;
  /** A plain definition, ≤ 2 sentences. */
  plain: string;
  /** An optional example. May contain digits (G6-exempt). Clearly an example. */
  example?: string;
}

/**
 * The NEW Layer-1 fields for one indicator (spec §4). `whatItIs` /
 * `whyItMatters` are intentionally NOT here — they are reused from
 * `IndicatorCopyEntry` (decision D-02).
 */
export interface Layer1Entry {
  /** Friendly label ≤ 6 words, shown beside the official name (D-03). */
  plainName: string;
  /** ALWAYS-TRUE everyday effect; direction-neutral; state-independent. ≤ 16 words, 1 sentence. */
  oneLine: string;
  /** What a rise usually means for ordinary people. 1 sentence, ≤ 22 words. null when direction is meaningless (skipReason set). */
  ifRising: string | null;
  /** What a fall usually means. 1 sentence, ≤ 22 words. null when direction is meaningless (skipReason set). */
  ifFalling: string | null;
  /** Present only when ifRising/ifFalling is null: the reason direction is skipped (spec §4). */
  skipReason?: string;
  /** 0–3 connections to other indicators. */
  connections: Layer1Connection[];
  /** Australia-specific angle (only for AU + AUD/RBA/petrol/home-loan global indicators; D-08). */
  australiaAngle?: string;
  /** Glossary term ids used in this indicator's copy. */
  glossaryTerms: string[];
}

/** The Layer-1 UI labels for the expanded DetailsPanel block. whatItIs/whyItMatters are reused from the top-level `ui`. */
export interface Layer1Ui {
  /** Section header for the ifRising line. */
  ifRising: string;
  /** Section header for the ifFalling line. */
  ifFalling: string;
  /** Section header for the connections list. */
  connections: string;
  /** Section header for the australiaAngle line. */
  australiaAngle: string;
  /** The block title for the whole Layer-1 section in the expanded panel. */
  plainWords: string;
  /** Shown when ifRising/ifFalling are both null (patterns; D-09). */
  noDirection: string;
}

/**
 * Layer 1 — the EN source of truth. The FA mirror lives in
 * `insights-copy-fa.ts` and is shape-checked at compile time (the repo's
 * existing dictionary pattern). IDs are the existing stable indicator ids
 * (IndicatorId) plus the markets (MarketId) and FX pairs/patterns.
 *
 * BATCHED: copy is written in batches of 5–8 (spec §7). An id present in
 * the code inventory but not yet here is caught by gate G1 (the validator
 * lists it). Until an id's entry lands, the UI renders nothing extra for it
 * (graceful). See docs/insights/layer1/INVENTORY.md for progress.
 */
const LAYER1 = {
  ui: {
    ifRising: 'If it rises',
    ifFalling: 'If it falls',
    connections: 'How it connects',
    australiaAngle: 'The Australia angle',
    plainWords: 'Plain words',
    noDirection: 'Direction does not give a clear signal here',
  } satisfies Layer1Ui,

  glossary: {
    inflation: {
      term: 'inflation',
      plain: 'How fast prices are rising. Higher inflation means the same money buys less over time.',
      example: 'If inflation is 3%, something that cost $100 last year costs about $103 now.',
    },
    'core-inflation': {
      term: 'core inflation',
      plain: 'Inflation with food and energy prices taken out. It shows the steadier direction underneath the noisy monthly moves.',
    },
    'trimmed-mean': {
      term: 'trimmed mean',
      plain: 'An inflation reading that drops the wildest price rises and falls each month before averaging. It shows the steady middle of price changes.',
    },
    deflation: {
      term: 'deflation',
      plain: 'When prices are falling on average. It sounds good but can stall an economy and wages.',
    },
    'interest-rate': {
      term: 'interest rate',
      plain: 'The price of borrowing money. Higher rates make loans cost more and make saving pay more.',
    },
    'policy-rate': {
      term: 'policy rate',
      plain: 'The central bank’s main interest rate. It steers savings, loan and bond rates across the economy.',
    },
    bond: {
      term: 'bond',
      plain: 'A loan you give to a government or a company. They pay you interest and give the money back later.',
    },
    yield: {
      term: 'yield',
      plain: 'The yearly return you get from lending money through a bond.',
    },
    'real-yield': {
      term: 'real yield',
      plain: 'A bond yield after taking out expected inflation. It shows the real return a lender keeps.',
    },
    'yield-curve': {
      term: 'yield curve',
      plain: 'The shape of interest rates from short to long borrowing times. A flat or inverted curve is a classic warning.',
    },
    breakeven: {
      term: 'breakeven inflation',
      plain: 'The inflation rate markets are pricing, from the gap between a normal bond and an inflation-linked bond of the same length.',
    },
    'central-bank': {
      term: 'central bank',
      plain: 'The institution that controls a country’s interest rates and money supply, like the Reserve Bank of Australia or the US Fed.',
    },
    recession: {
      term: 'recession',
      plain: 'A period when a country’s economy shrinks and more people lose jobs.',
    },
    volatility: {
      term: 'volatility',
      plain: 'How wildly prices jump around. High volatility means big, fast swings.',
    },
    'safe-haven': {
      term: 'safe haven',
      plain: 'Something people tend to move money into when they are worried, like gold.',
    },
    commodity: {
      term: 'commodity',
      plain: 'A raw material bought and sold in bulk, like oil, gold or wheat.',
    },
    'stock-index': {
      term: 'stock index',
      plain: 'One number that tracks how a group of big companies’ shares is doing overall.',
    },
    mortgage: {
      term: 'mortgage',
      plain: 'A loan used to purchase a home, paid back with interest over many years.',
    },
    'carry-trade': {
      term: 'carry trade',
      plain: 'Borrowing money where it is cheap, like Japan, and putting it to work where it pays more. When the interest gap between the two sides shrinks, these trades usually unwind fast.',
    },
    pmi: {
      term: 'PMI',
      plain: 'A monthly survey of factory purchasing managers. Readings above the halfway line mean factories are getting busier; below means quieter.',
      example: 'The halfway mark is 50: a reading of 52 means factories are growing a little, 48 means shrinking a little.',
    },
    vix: {
      term: 'VIX',
      plain: 'A number the market prices from the size of the swings it sees coming in America’s main share index. It usually jumps when worry spreads.',
    },
    'money-supply': {
      term: 'money supply',
      plain: 'The total amount of money sitting in bank accounts and circulating in an economy. It grows when banks lend a lot.',
    },
    'leading-indicator': {
      term: 'leading indicator',
      plain: 'A measure that usually turns before the whole economy does. It is watched for early hints, never promises.',
    },
    /* gap-closure S2-M2.5: the foreign-holders section's terms (the
     * owner's top-priority feature). Plain words, Treasury's own
     * concepts. */
    'treasury-securities': {
      term: 'Treasury securities',
      plain: 'Loans to the US government: Treasury bills, notes and bonds. Foreign governments and investors hold trillions of dollars of them.',
    },
    'foreign-official-holdings': {
      term: 'foreign official holdings',
      plain: 'The part held by foreign central banks and governments, as opposed to private investors abroad.',
    },
    'net-purchases': {
      term: 'net purchases',
      plain: 'What investors actually bought minus what they sold over a period. It measures real buying or selling, not price changes.',
    },
    'valuation-change': {
      term: 'valuation change',
      plain: 'The change in what existing holdings are worth as market prices move. When yields rise, bond values fall, so holdings can shrink with no selling at all.',
    },
    'custody-hub': {
      term: 'custody hub',
      plain: 'A country whose reported holdings include much that belongs to investors elsewhere, because the securities are simply held there. Belgium, Luxembourg, the Cayman Islands, Ireland, the UK, Switzerland and Bermuda are the big ones.',
    },
    /* gap-closure S3 (2026-11-01): the liquidity/funding family's terms
     * (M3.6's list, landed with the cards that use them). Plain words,
     * the Fed's own concepts. */
    'liquidity': {
      term: 'liquidity',
      plain: 'How easily money can be had in a market: cash ready to use, rather than tied up in assets.',
    },
    'term-premium': {
      term: 'term premium',
      plain: 'The extra yield investors demand for lending long-term instead of rolling short-term loans, on top of the path of short rates.',
    },
    'treasury-general-account': {
      term: 'Treasury General Account',
      plain: 'The US government’s own bank account at the Federal Reserve, from which it pays its bills.',
    },
    'reverse-repo': {
      term: 'reverse repo',
      plain: 'An overnight deposit at the Federal Reserve: money funds and others park cash there at a set rate instead of lending it in private markets.',
    },
    'bank-reserves': {
      term: 'bank reserves',
      plain: 'The deposits banks keep at the central bank. They are the raw material of the overnight lending market between banks.',
    },
    'net-liquidity': {
      term: 'net liquidity',
      plain: 'The money actually available to markets: the Fed’s balance sheet minus the Treasury’s account and the overnight cash parked back at the Fed.',
    },
    /* gap-closure S3-M3.3 (2026-11-01): the credit pair's terms (M3.6's
     * list, landed with the cards that use them — the M3.2 pattern). */
    'excess-bond-premium': {
      term: 'excess bond premium',
      plain: 'The part of what investors demand for lending to risky companies that is NOT compensation for expected losses — the pure extra charge for risk appetite itself.',
    },
    'financial-stress-index': {
      term: 'financial stress index',
      plain: 'A daily score of how strained money markets are. The OFR’s own combines credit, funding, volatility, safe-asset and equity-valuation pressure into one number around zero (zero = its long-run average).',
    },
    // gap-closure S3-M3.4 (2026-11-01) — the growth-nowcast family's term
    // (the M3.6 glossary list, landed with the card that uses it).
    nowcast: {
      term: 'nowcast',
      plain: 'An estimate of something happening right now, built from data that arrives before the official number. “Now” plus “forecast”: no waiting, less certainty.',
      example: 'The Atlanta Fed’s GDPNow estimates this quarter’s growth while the quarter is still running.',
    },
    // gap-closure S3-M3.5 (2026-11-01) — the Treasury-supply family's term
    // (the M3.6 glossary list, landed with the card that uses it).
    'bid-to-cover': {
      term: 'bid-to-cover',
      plain: 'How many dollars were bid for every dollar of bonds a Treasury auction sold. A lower reading says demand was thinner.',
      example: 'A bid-to-cover of 2.5 means buyers offered two and a half dollars for every dollar of bonds sold — around 2.5 has been typical.',
    },
    // gap-closure S4-M4.3 (2026-11-01) — the chokepoint cards' terms (the
    // M4.6 glossary list, landed with the cards that use them).
    chokepoint: {
      term: 'chokepoint',
      plain: 'A narrow sea passage that a large share of world shipping passes through, such as a canal or a strait between two land masses.',
      example: 'The Suez Canal, the Panama Canal and the Strait of Malacca are the best-known chokepoints.',
    },
    'transit-estimate': {
      term: 'transit (estimate)',
      plain: 'One ship passing through a passage, counted once. The count is an estimate from ship-tracking data, so it can be revised.',
    },
    // gap-closure S4-M4.4 (2026-11-01) — the supply-chain and energy
    // cards' terms (the M4.6 glossary list, landed with the cards that
    // use them; the GPR/TPU terms below land with their cards' refresh).
    'supply-chain-pressure': {
      term: 'supply chain pressure',
      plain: 'How stretched the world\u2019s delivery chains are \u2014 a measure of how long and how costly it is to move goods, not of any single event.',
      example: 'When pressure is high, shipping a container tends to cost more and take longer.',
    },
    'strategic-reserve': {
      term: 'strategic reserve',
      plain: 'A stock of crude oil owned by a government and held for emergencies, separate from the inventories companies keep for normal business.',
      example: 'The US Strategic Petroleum Reserve is the largest of these government oil stocks.',
    },
    lng: {
      term: 'LNG',
      plain: 'Liquefied natural gas \u2014 natural gas cooled into a liquid so it can be shipped by tanker, the form in which gas crosses oceans.',
      example: 'Most of the gas Japan and Korea use arrives as LNG; Australia is one of the world\u2019s largest LNG exporters.',
    },
    'geopolitical-risk-index': {
      term: 'geopolitical risk index',
      plain: 'A measure of how much war and international tension fills the news, built by counting newspaper coverage \u2014 not a count of events themselves.',
      example: 'A reading of 200 means war-and-tension coverage was about twice as common as in the average month.',
    },
    'trade-policy-uncertainty': {
      term: 'trade policy uncertainty',
      plain: 'A measure of how much newspaper coverage is about trade policy \u2014 tariffs, deals and disputes \u2014 rather than what the policy actually is.',
      example: 'A high reading says trade dominates the news, not which way it goes.',
    },
  } satisfies Record<string, Layer1GlossaryEntry>,

  indicators: {
    /* ----- Batch 1 — borrowing-costs (8) ----- */
    'yield-curve-10y2y': {
      plainName: 'US borrowing gap (10y–2y)',
      oneLine: 'The gap between long and short-term US government borrowing.',
      ifRising: 'A widening gap usually comes with growth or inflation pressure.',
      ifFalling: 'A small or negative gap has preceded most US recessions.',
      connections: [
        { with: 'recession-probability', text: 'Both read the same recession signal from different angles.', strength: 'usually' },
      ],
      glossaryTerms: ['yield-curve', 'bond', 'recession', 'inflation'],
    },
    'yield-curve-10y3m': {
      plainName: 'US borrowing gap (10y–3m)',
      oneLine: 'The gap the Federal Reserve itself watches most closely.',
      ifRising: 'A steep gap usually comes with growth or inflation pressure.',
      ifFalling: 'Deep inversions of this leg have preceded every modern US recession.',
      connections: [
        { with: 'recession-probability', text: 'The 3-month leg and the recession model tell the same story.', strength: 'usually' },
      ],
      glossaryTerms: ['yield-curve', 'bond', 'recession', 'inflation'],
    },
    'real-yield-10y': {
      plainName: 'US lending return after inflation',
      oneLine: 'What lending to the US government pays after inflation is taken out.',
      ifRising: 'Safe savings pay more, so assets that pay no interest, like gold, often get less attractive.',
      ifFalling: 'Holding safe money earns little after inflation, which often helps non-interest assets.',
      connections: [
        { with: 'gold-usd', text: 'Higher real yields tend to weigh on gold.', strength: 'usually' },
      ],
      australiaAngle: 'High US real yields tend to pressure the Australian dollar and gold prices.',
      glossaryTerms: ['real-yield', 'bond', 'yield', 'inflation'],
    },
    us10y: {
      plainName: 'US 10-year borrowing cost',
      oneLine: 'The interest rate on 10-year US government debt.',
      ifRising: 'Home loans and business credit usually follow, with a lag.',
      ifFalling: 'Cheaper borrowing usually helps loans and asset prices.',
      connections: [
        { with: 'mortgage-30y', text: 'The 30-year US mortgage follows the 10-year Treasury.', strength: 'reliable' },
        { with: 'real-yield-10y', text: 'The nominal yield is roughly the real yield plus expected inflation.', strength: 'reliable' },
      ],
      australiaAngle: 'Australian long-term rates and the Australian dollar usually move with US long yields.',
      glossaryTerms: ['yield', 'bond', 'interest-rate', 'mortgage', 'real-yield', 'inflation'],
    },
    us30y: {
      plainName: 'US 30-year borrowing cost',
      oneLine: 'The interest rate on 30-year US government debt.',
      ifRising: 'Mortgages and long-dated borrowing usually cost more.',
      ifFalling: 'Long borrowing usually gets cheaper.',
      connections: [
        { with: 'mortgage-30y', text: 'The 30-year Treasury is the longest anchor for US mortgage pricing.', strength: 'reliable' },
      ],
      glossaryTerms: ['yield', 'bond', 'interest-rate', 'mortgage'],
    },
    'fed-target': {
      plainName: 'The Fed’s main rate',
      oneLine: 'The Federal Reserve’s main interest rate.',
      ifRising: 'Loans and mortgages usually cost more, and saving pays more.',
      ifFalling: 'Loans and mortgages usually ease, and saving pays less.',
      connections: [
        { with: 'us10y', text: 'The policy rate anchors the short end; the 10-year carries the long expectation.', strength: 'reliable' },
      ],
      australiaAngle: 'The Fed’s moves set the tone for global rates, including the path the RBA can credibly take.',
      glossaryTerms: ['policy-rate', 'central-bank', 'interest-rate', 'mortgage'],
    },
    'ecb-dfr': {
      plainName: 'The ECB’s main rate',
      oneLine: 'The rate banks earn on deposits at the European Central Bank.',
      ifRising: 'Euro-area loans usually cost more, and saving pays more.',
      ifFalling: 'Euro-area loans usually ease, and saving pays less.',
      connections: [
        { with: 'euro-aaa-10y', text: 'The deposit rate anchors the short end of the euro-area curve.', strength: 'reliable' },
      ],
      glossaryTerms: ['policy-rate', 'central-bank', 'interest-rate'],
    },
    'fed-expectations': {
      plainName: 'Where markets think the Fed goes',
      oneLine: 'What the 2-year Treasury implies about the Fed’s next moves.',
      ifRising: 'When markets price higher Fed rates, borrowing usually rises before the move.',
      ifFalling: 'When markets price lower Fed rates, borrowing usually eases before the move.',
      connections: [
        { with: 'fed-target', text: 'The 2-year-implied path is the market’s reading of where the Fed goes.', strength: 'usually' },
      ],
      glossaryTerms: ['yield', 'interest-rate', 'central-bank'],
    },

    /* ----- Batch 2 — borrowing-costs rest A (7) ----- */
    'govt-interest-revenue': {
      plainName: 'America’s interest bill vs income',
      oneLine: 'How big the US government’s interest bill on its debt is, versus its income.',
      ifRising: 'More tax money usually goes to interest payments, sharpening fights over the US budget.',
      ifFalling: 'A smaller interest slice usually leaves more room for other government spending.',
      connections: [
        { with: 'us10y', text: 'Higher long-term rates raise the interest the government pays over time.', strength: 'usually' },
      ],
      glossaryTerms: ['bond', 'interest-rate'],
    },
    'us-2y': {
      plainName: 'US 2-year borrowing cost',
      oneLine: 'The interest rate on 2-year US government debt.',
      ifRising: 'Markets usually expect higher Fed rates, and near-term borrowing costs often follow.',
      ifFalling: 'Markets usually expect lower Fed rates, bringing earlier relief for borrowers.',
      connections: [
        { with: 'fed-expectations', text: 'The market-expectations card is built from this 2-year rate.', strength: 'reliable' },
        { with: 'yield-curve-10y2y', text: 'This is the short leg of the 10-year-minus-2-year gap.', strength: 'reliable' },
      ],
      glossaryTerms: ['interest-rate', 'yield', 'bond'],
    },
    sofr: {
      plainName: 'The overnight bank cash rate',
      oneLine: 'What banks actually pay to borrow cash overnight in the US.',
      ifRising: 'Loans whose rate moves daily usually get more expensive.',
      ifFalling: 'Short-term borrowing usually gets cheaper, taking pressure off borrowers.',
      connections: [
        { with: 'fed-target', text: 'SOFR normally sits just under the top of the Fed’s target range.', strength: 'reliable' },
      ],
      glossaryTerms: ['interest-rate', 'policy-rate', 'central-bank'],
    },
    'mortgage-30y': {
      plainName: 'The typical US home-loan rate',
      oneLine: 'The average rate on a new 30-year US home loan.',
      ifRising: 'Monthly payments on new home loans usually rise, and fewer buyers can afford them.',
      ifFalling: 'New home loans usually get cheaper, letting buyers borrow a little more.',
      connections: [
        { with: 'us10y', text: 'The 30-year mortgage follows the 10-year Treasury rate.', strength: 'reliable' },
        { with: 'fed-target', text: 'Policy moves reach this rate through the long end, with a delay.', strength: 'usually' },
      ],
      glossaryTerms: ['mortgage', 'interest-rate'],
    },
    'jgb-10y': {
      plainName: 'Japan’s 10-year borrowing cost',
      oneLine: 'The interest rate on 10-year Japanese government debt.',
      ifRising: 'Japanese money usually gets tighter at home, and world markets often feel it.',
      ifFalling: 'Cheap Japanese money usually stays available for borrowers and world markets.',
      connections: [
        { with: 'us-japan-10y-gap', text: 'The US-Japan 10-year gap card is built from this rate.', strength: 'reliable' },
        { with: 'boj-rate', text: 'The Bank of Japan still leans heavily on this market.', strength: 'usually' },
      ],
      glossaryTerms: ['yield', 'bond', 'interest-rate', 'central-bank'],
    },
    'bund-10y': {
      plainName: 'Germany’s 10-year borrowing cost',
      oneLine: 'The interest rate on 10-year German government debt.',
      ifRising: 'Borrowing across Europe usually gets more expensive, from mortgages to business loans.',
      ifFalling: 'Borrowing across Europe usually eases, from home loans to business credit.',
      connections: [
        { with: 'euro-aaa-10y', text: 'The daily euro safe-rate and this monthly German mirror tell one story.', strength: 'usually' },
        { with: 'ecb-dfr', text: 'The ECB’s policy rate anchors the base this long-term rate floats above.', strength: 'usually' },
      ],
      glossaryTerms: ['yield', 'bond', 'interest-rate', 'mortgage', 'policy-rate', 'central-bank'],
    },
    'gilt-10y': {
      plainName: 'Britain’s 10-year borrowing cost',
      oneLine: 'The interest rate on 10-year UK government debt.',
      ifRising: 'UK mortgages and business loans usually get more expensive.',
      ifFalling: 'UK borrowing usually gets cheaper, helping loans and house prices.',
      connections: [
        { with: 'boe-rate', text: 'The Bank of England sets the short base; this is the market’s long rate.', strength: 'usually' },
      ],
      glossaryTerms: ['yield', 'bond', 'interest-rate', 'mortgage', 'central-bank'],
    },

    /* ----- Batch 3 — borrowing-costs B + dollar-strength (8) ----- */
    'euro-aaa-10y': {
      plainName: 'Europe’s safest 10-year rate',
      oneLine: 'The 10-year borrowing cost of the euro area’s safest governments.',
      ifRising: 'Safe long-term rates in Europe usually rise with it, making loans dearer.',
      ifFalling: 'Cheap safe money in Europe usually eases loans and asset prices.',
      connections: [
        { with: 'ecb-dfr', text: 'The ECB’s policy rate anchors the short end; this is the safe long end.', strength: 'reliable' },
        { with: 'bund-10y', text: 'The German mirror tells the same story with a monthly delay.', strength: 'usually' },
      ],
      glossaryTerms: ['yield', 'bond', 'interest-rate', 'policy-rate', 'central-bank'],
    },
    'boe-rate': {
      plainName: 'The Bank of England’s rate',
      oneLine: 'The Bank of England’s main interest rate.',
      ifRising: 'UK loans and mortgages usually cost more, and saving pays more.',
      ifFalling: 'UK borrowing usually eases and saving pays less.',
      connections: [
        { with: 'gilt-10y', text: 'The Bank sets the short rate; gilts carry the long one.', strength: 'usually' },
      ],
      glossaryTerms: ['policy-rate', 'central-bank', 'interest-rate', 'mortgage'],
    },
    'boj-rate': {
      plainName: 'The Bank of Japan’s rate',
      oneLine: 'The Bank of Japan’s main interest rate.',
      ifRising: 'Cheap Japanese money usually pulls back home, shaking world markets at times.',
      ifFalling: 'Cheap Japanese money usually stays easy fuel for world borrowing.',
      connections: [
        { with: 'jgb-10y', text: 'The Bank of Japan’s setting steers the 10-year bond market heavily.', strength: 'usually' },
        { with: 'usdjpy', text: 'The yen’s value moves with what Japan’s central bank does.', strength: 'usually' },
      ],
      glossaryTerms: ['policy-rate', 'central-bank', 'interest-rate', 'bond'],
    },
    'dollar-basket': {
      plainName: 'The dollar’s overall strength',
      oneLine: 'The US dollar measured against a group of six big currencies.',
      ifRising: 'A stronger dollar often pressures world prices, debts and other currencies.',
      ifFalling: 'A weaker dollar usually eases pressure on world trade and debts.',
      connections: [
        { with: 'gold-usd', text: 'A stronger dollar often weighs on gold prices.', strength: 'usually' },
        { with: 'eur-usd', text: 'The euro is the biggest weight inside the basket.', strength: 'reliable' },
      ],
      australiaAngle: 'A stronger US dollar usually weighs on the Australian dollar and on commodity prices.',
      glossaryTerms: ['commodity'],
    },
    usdjpy: {
      plainName: 'Dollar versus Japanese yen',
      oneLine: 'How many Japanese yen one US dollar buys.',
      ifRising: 'Japanese goods and travel usually get cheaper for people paying in other currencies.',
      ifFalling: 'A rising yen often means worry, as money borrowed in yen moves home fast.',
      connections: [
        { with: 'us-japan-10y-gap', text: 'The US-Japan rate gap is the reward that keeps the yen carry trade alive.', strength: 'reliable' },
        { with: 'boj-rate', text: 'The Bank of Japan’s rate is the yen’s home base.', strength: 'usually' },
      ],
      australiaAngle: 'When the yen surges on worry, the Australian dollar often sags with other risk currencies.',
      glossaryTerms: ['carry-trade', 'central-bank'],
    },
    'us-japan-10y-gap': {
      plainName: 'The US-Japan rate gap',
      oneLine: 'How much more the US pays to borrow for 10 years than Japan.',
      ifRising: 'The reward for borrowing cheap Japanese money to earn US rates usually grows.',
      ifFalling: 'The cheap-yen trade pays less, and its retreat can shake world markets.',
      connections: [
        { with: 'usdjpy', text: 'Dollar-yen is the trade; this gap is its fuel line.', strength: 'reliable' },
        { with: 'us10y', text: 'The US side of the gap is the 10-year Treasury rate.', strength: 'reliable' },
        { with: 'jgb-10y', text: 'The Japan side is the 10-year Japanese government bond.', strength: 'reliable' },
      ],
      australiaAngle: 'When this gap narrows fast, the Australian dollar often weakens with other carry favorites.',
      glossaryTerms: ['carry-trade', 'bond'],
    },
    'eur-usd': {
      plainName: 'Dollar versus the euro',
      oneLine: 'How many euros one US dollar buys.',
      ifRising: 'A stronger dollar against the euro often pressures world prices.',
      ifFalling: 'A weaker dollar usually eases pressure on world prices and trade.',
      connections: [
        { with: 'dollar-basket', text: 'The euro is the biggest single weight in the dollar basket.', strength: 'reliable' },
        { with: 'fed-target', text: 'The Fed steers the dollar’s side; the ECB steers the euro’s.', strength: 'usually' },
      ],
      glossaryTerms: ['central-bank'],
    },
    usdtry: {
      plainName: 'Dollar versus Turkish lira',
      oneLine: 'How many Turkish liras one US dollar buys.',
      ifRising: 'Imported goods in Turkey usually get dearer as the lira slides.',
      ifFalling: 'A firmer lira usually means calmer inflation and a rare stretch of stability.',
      connections: [
        { with: 'dollar-basket', text: 'Turkey sits outside the big-currency basket, but lira trouble often comes with a strong dollar.', strength: 'sometimes' },
      ],
      glossaryTerms: ['inflation'],
    },
    usdaed: {
      plainName: 'Dollar versus UAE dirham',
      oneLine: 'How many UAE dirhams one US dollar buys.',
      ifRising: 'The dirham\u2019s dollar peg usually absorbs this: the pair barely moves by design.',
      ifFalling: 'A meaningful drop would be an exceptional event: the peg has held for decades.',
      connections: [
        { with: 'dollar-basket', text: 'The dirham is pegged TO the dollar, so it moves with it against every other currency.', strength: 'reliable' },
        { with: 'brent', text: 'Gulf economies ride oil income; the peg keeps that income dollar-linked.', strength: 'sometimes' },
      ],
      glossaryTerms: ['central-bank'],
    },

    /* ----- Batch 4 — growth-health A (8) ----- */
    'us-unemployment': {
      plainName: 'The US jobless rate',
      oneLine: 'The share of the US workforce without a job.',
      ifRising: 'A steady climb usually means the US economy is cooling, and pay rises soften.',
      ifFalling: 'Falling joblessness usually comes with a strong jobs market and steadier pay growth.',
      connections: [
        { with: 'sahm-rule', text: 'The recession alarm beside this card is built from this rate.', strength: 'reliable' },
        { with: 'us-nfp', text: 'Jobs added and the jobless rate come from the same monthly report.', strength: 'reliable' },
      ],
      glossaryTerms: ['recession'],
    },
    'sahm-rule': {
      plainName: 'The US recession alarm',
      oneLine: 'An alarm built from US joblessness that rings when a downturn has usually begun.',
      ifRising: 'A fast rise in joblessness usually means a downturn has already started.',
      ifFalling: 'A falling reading usually means the jobs market is out of alarm territory.',
      connections: [
        { with: 'us-unemployment', text: 'The alarm watches this rate’s climb from its recent low.', strength: 'reliable' },
        { with: 'recession-probability', text: 'The model and the alarm read the same downturn from different angles.', strength: 'usually' },
      ],
      glossaryTerms: ['recession'],
    },
    'china-pmi': {
      plainName: 'Chinese factory pulse',
      oneLine: 'A monthly survey of factory managers in China.',
      ifRising: 'Chinese factories are usually getting busier, often good news for world trade.',
      ifFalling: 'Chinese factories are usually slowing, which often weighs on world trade and commodity prices.',
      connections: [
        { with: 'china-cpi', text: 'Read the factory pulse beside China’s price gauge to judge its demand.', strength: 'usually' },
        { with: 'copper-usd', text: 'Copper often moves with Chinese factory strength.', strength: 'usually' },
      ],
      glossaryTerms: ['pmi', 'commodity'],
    },
    'china-cpi': {
      plainName: 'China’s inflation rate',
      oneLine: 'How fast consumer prices in China are rising, versus a year ago.',
      ifRising: 'Overheating pressure in the world’s factory often builds, rippling into world goods prices.',
      ifFalling: 'Weak Chinese demand usually drags on world trade and commodity prices.',
      connections: [
        { with: 'china-pmi', text: 'The factory pulse and the price gauge together judge Chinese demand.', strength: 'usually' },
      ],
      glossaryTerms: ['inflation', 'commodity'],
    },
    'copper-gold': {
      plainName: 'Growth versus fear in metals',
      oneLine: 'Copper’s price measured against gold’s.',
      ifRising: 'Markets are usually paying up for growth signals, like factory building.',
      ifFalling: 'Money usually shifts toward safe havens, a mix that often comes with world slowdowns.',
      connections: [
        { with: 'copper-usd', text: 'Copper is the growth leg of this measure.', strength: 'reliable' },
        { with: 'gold-usd', text: 'Gold is the safety leg.', strength: 'reliable' },
      ],
      glossaryTerms: ['safe-haven'],
    },
    'michigan-sentiment': {
      plainName: 'US consumer mood',
      oneLine: 'How confident American households feel about their money.',
      ifRising: 'Confident households usually keep spending, which supports the economy.',
      ifFalling: 'Gloomy households usually cut back on spending first.',
      connections: [
        { with: 'michigan-1y-expectations', text: 'The price-worry number rides inside this survey.', strength: 'reliable' },
        { with: 'retail-sales', text: 'Mood often leads actual spending.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'initial-jobless-claims': {
      plainName: 'New US jobless claims',
      oneLine: 'How many Americans newly filed for jobless benefits last week.',
      ifRising: 'Layoffs are usually picking up, the earliest sign of a softening jobs market.',
      ifFalling: 'Layoffs are usually rare, a sign of a tight jobs market.',
      connections: [
        { with: 'us-unemployment', text: 'Weekly claims feed the monthly jobless rate.', strength: 'reliable' },
        { with: 'sahm-rule', text: 'Claim surges arrive long before this alarm can ring.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'philly-fed': {
      plainName: 'Early US factory survey',
      oneLine: 'An early monthly read on US factory activity.',
      ifRising: 'More US manufacturers are usually growing, an early sign of strength.',
      ifFalling: 'More US manufacturers are usually shrinking, an early sign of weakness.',
      connections: [
        { with: 'us-gdp-growth', text: 'Factory surveys often turn before the headline growth number.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },

    /* ----- Batch 5 — growth-health B (8) ----- */
    'recession-probability': {
      plainName: 'US recession odds',
      oneLine: 'A model’s estimate of the chance the US economy is in a downturn.',
      ifRising: 'The data looks more and more like past downturns, though models trail the real economy.',
      ifFalling: 'The data reads more and more like normal expansion.',
      connections: [
        { with: 'sahm-rule', text: 'The alarm and the model read the same downturn from different angles.', strength: 'usually' },
        { with: 'us-gdp-growth', text: 'The model weighs many inputs, growth among them, and publishes with a lag.', strength: 'usually' },
      ],
      glossaryTerms: ['recession'],
    },
    'oecd-cli-us': {
      plainName: 'The US early-turn gauge',
      oneLine: 'A gauge that usually turns before the whole US economy does.',
      ifRising: 'The US economy’s direction is usually improving several months out.',
      ifFalling: 'A US slowdown usually sits several months ahead.',
      connections: [
        { with: 'recession-probability', text: 'Read the early gauge beside the recession odds.', strength: 'usually' },
        { with: 'initial-jobless-claims', text: 'The claims number confirms turns much faster.', strength: 'usually' },
      ],
      glossaryTerms: ['leading-indicator', 'recession'],
    },
    'm2-us': {
      plainName: 'The US money pool',
      oneLine: 'The total money sitting in US bank accounts and wallets.',
      ifRising: 'Spending power usually builds, which can feed inflation later.',
      ifFalling: 'Rare shrinkage that has historically clustered around US downturns.',
      connections: [
        { with: 'us-cpi-yoy', text: 'Money growth is one input in inflation debates.', strength: 'sometimes' },
        { with: 'walcl', text: 'The central bank’s own balance sheet is one engine behind it.', strength: 'usually' },
      ],
      glossaryTerms: ['money-supply', 'inflation', 'central-bank'],
    },
    'retail-sales': {
      plainName: 'America’s shopping tally',
      oneLine: 'The monthly value of what American shops ring up.',
      ifRising: 'Consumer spending is usually carrying the economy.',
      ifFalling: 'A spending pullback usually opens the door to recession talk.',
      connections: [
        { with: 'michigan-sentiment', text: 'Mood often leads this spending number.', strength: 'usually' },
        { with: 'us-gdp-growth', text: 'Spending is most of the US economy.', strength: 'reliable' },
      ],
      glossaryTerms: ['recession'],
    },
    'housing-permits': {
      plainName: 'US homebuilding intentions',
      oneLine: 'How many new US homes were cleared to start this month.',
      ifRising: 'Builders usually expect enough demand to justify new homes.',
      ifFalling: 'Builders usually shelve projects, a classic early response to expensive borrowing.',
      connections: [
        { with: 'mortgage-30y', text: 'Permits are the market’s answer to the mortgage rate.', strength: 'usually' },
      ],
      glossaryTerms: ['mortgage'],
    },
    'job-openings': {
      plainName: 'America’s open jobs',
      oneLine: 'How many unfilled jobs US employers are trying to fill.',
      ifRising: 'Employers usually still want workers, a sign of labour demand.',
      ifFalling: 'Hiring appetite usually fades before joblessness rises.',
      connections: [
        { with: 'us-unemployment', text: 'Openings usually turn before the jobless rate does.', strength: 'usually' },
        { with: 'initial-jobless-claims', text: 'One counts employers pulling back; the other workers being let go.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'us-gdp-growth': {
      plainName: 'America’s growth pace',
      oneLine: 'How much bigger the US economy got last quarter.',
      ifRising: 'A faster US economy usually keeps world rates higher for longer.',
      ifFalling: 'Weak US growth usually brings rate-cut hopes and recession talk.',
      connections: [
        { with: 'retail-sales', text: 'Spending is most of the economy this number measures.', strength: 'reliable' },
        { with: 'us-nfp', text: 'Jobs and growth usually move together.', strength: 'usually' },
      ],
      glossaryTerms: ['recession'],
    },
    'us-nfp': {
      plainName: 'Monthly US jobs added',
      oneLine: 'How many jobs America added or lost last month.',
      ifRising: 'Strong hiring usually keeps world interest rates higher.',
      ifFalling: 'Job losses usually bring recession talk and rate-cut hopes.',
      connections: [
        { with: 'us-unemployment', text: 'Both come from the same monthly jobs report.', strength: 'reliable' },
        { with: 'fed-target', text: 'The Fed reads this number closely.', strength: 'reliable' },
      ],
      glossaryTerms: ['interest-rate', 'recession'],
    },

    /* ----- Batch 6 — growth-health C (7) ----- */
    usdcny: {
      plainName: 'Dollar versus Chinese yuan',
      oneLine: 'How many Chinese yuan one US dollar buys.',
      ifRising: 'Chinese goods usually get cheaper abroad, and trade politics usually sharpen.',
      ifFalling: 'A softer dollar-yuan mix usually calms trade politics.',
      connections: [
        { with: 'china-pmi', text: 'A weaker yuan often appears when Chinese factories slow.', strength: 'sometimes' },
      ],
      australiaAngle: 'A weaker yuan often drags on the Australian dollar through the China trade channel.',
      glossaryTerms: [],
    },
    'michigan-1y-expectations': {
      plainName: 'US price worry, next year',
      oneLine: 'What American households expect prices to do this coming year.',
      ifRising: 'Households brace for higher inflation, which can feed wage demands.',
      ifFalling: 'Americans usually feel calmer about prices ahead.',
      connections: [
        { with: 'michigan-sentiment', text: 'This number rides inside the mood survey.', strength: 'reliable' },
        { with: 'us-cpi-yoy', text: 'Worry tends to track what prices already did.', strength: 'usually' },
      ],
      glossaryTerms: ['inflation'],
    },
    cfnai: {
      plainName: 'US activity in one number',
      oneLine: 'One score blending many US economic readings.',
      ifRising: 'The US economy is usually running above its normal pace.',
      ifFalling: 'Below-normal readings have historically clustered around downturns.',
      connections: [
        { with: 'us-gdp-growth', text: 'Both measure the same economy; this one updates monthly.', strength: 'reliable' },
        { with: 'recession-probability', text: 'Low stretches here usually line up with the recession model.', strength: 'usually' },
      ],
      glossaryTerms: ['recession'],
    },
    'oecd-cli-cn': {
      plainName: 'China’s early-turn gauge',
      oneLine: 'A gauge that usually turns before China’s whole economy does.',
      ifRising: 'China’s direction is usually improving several months out.',
      ifFalling: 'A Chinese slowdown usually sits several months ahead.',
      connections: [
        { with: 'china-pmi', text: 'The monthly factory pulse confirms what this leads.', strength: 'usually' },
        { with: 'oecd-cli-us', text: 'The US and China gauges frame world industry together.', strength: 'usually' },
      ],
      glossaryTerms: ['leading-indicator'],
    },
    'oecd-cli-de': {
      plainName: 'Germany’s early-turn gauge',
      oneLine: 'A gauge that usually turns before Germany’s whole economy does.',
      ifRising: 'Europe’s largest economy is usually improving several months out.',
      ifFalling: 'A European slowdown usually sits several months ahead.',
      connections: [
        { with: 'oecd-cli-us', text: 'Siblings in the same leading-indicator family.', strength: 'reliable' },
        { with: 'bund-10y', text: 'German borrowing costs often echo the growth picture this leads.', strength: 'usually' },
      ],
      glossaryTerms: ['leading-indicator'],
    },
    'epu-us': {
      plainName: 'US policy-noise gauge',
      oneLine: 'How uncertain US policy news is right now.',
      ifRising: 'Businesses usually delay investment and hiring decisions.',
      ifFalling: 'A quieter policy backdrop usually lets plans proceed.',
      connections: [
        { with: 'michigan-sentiment', text: 'The mood pair: policy noise beside household mood.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'gpr-threats': {
      // gap-closure S4-M4.2: the war-and-tension gauge's threats half.
      plainName: 'War-threat news gauge',
      oneLine: 'How much war-and-tension news is threats and warnings.',
      ifRising: 'Markets usually price more caution when threats dominate coverage.',
      ifFalling: 'A smaller threats share usually reads as a calmer news mix.',
      connections: [
        { with: 'gpr-index', text: 'The headline gauge this threat share belongs to.', strength: 'reliable' },
        { with: 'gpr-acts', text: 'The threats and acts pair splits the same coverage.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },
    'gpr-acts': {
      plainName: 'War-acts news gauge',
      oneLine: 'How much war-and-tension news is realised acts.',
      ifRising: 'Coverage is shifting from warnings to actual events.',
      ifFalling: 'Fewer acts in the news mix usually reads as de-escalation.',
      connections: [
        { with: 'gpr-index', text: 'The headline gauge this acts share belongs to.', strength: 'reliable' },
        { with: 'gpr-threats', text: 'The threats and acts pair splits the same coverage.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },
    'gpr-daily': {
      plainName: 'War-tension weekly gauge',
      oneLine: 'The war-and-tension news gauge, refreshed weekly.',
      ifRising: 'A fresher read on the tension the monthly card reports.',
      ifFalling: 'A fresher read on the calm the monthly card reports.',
      connections: [
        { with: 'gpr-index', text: 'The monthly average this weekly reading tracks.', strength: 'reliable' },
        { with: 'vix', text: 'The fear gauge often moves with tension news.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'gpr-taiwan': {
      plainName: 'Taiwan tension gauge',
      oneLine: 'How much war-and-tension news mentions Taiwan.',
      ifRising: 'A larger share of tension coverage is about Taiwan.',
      ifFalling: 'A smaller share of tension coverage is about Taiwan.',
      connections: [
        { with: 'gpr-index', text: 'The headline gauge this country share belongs to.', strength: 'reliable' },
        { with: 'gpr-china', text: 'The two east-Asia lenses of the same news stream.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'gpr-china': {
      plainName: 'China tension gauge',
      oneLine: 'How much war-and-tension news mentions China.',
      ifRising: 'A larger share of tension coverage is about China.',
      ifFalling: 'A smaller share of tension coverage is about China.',
      connections: [
        { with: 'gpr-index', text: 'The headline gauge this country share belongs to.', strength: 'reliable' },
        { with: 'china-pmi', text: 'Tension news beside China’s factory gauge.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'gpr-russia': {
      plainName: 'Russia tension gauge',
      oneLine: 'How much war-and-tension news mentions Russia.',
      ifRising: 'A larger share of tension coverage is about Russia.',
      ifFalling: 'A smaller share of tension coverage is about Russia.',
      connections: [
        { with: 'gpr-index', text: 'The headline gauge this country share belongs to.', strength: 'reliable' },
        { with: 'gpr-ukraine', text: 'The pair usually moves together in this news stream.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'gpr-ukraine': {
      plainName: 'Ukraine tension gauge',
      oneLine: 'How much war-and-tension news mentions Ukraine.',
      ifRising: 'A larger share of tension coverage is about Ukraine.',
      ifFalling: 'A smaller share of tension coverage is about Ukraine.',
      connections: [
        { with: 'gpr-index', text: 'The headline gauge this country share belongs to.', strength: 'reliable' },
        { with: 'gpr-russia', text: 'The pair usually moves together in this news stream.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'gpr-israel': {
      plainName: 'Israel tension gauge',
      oneLine: 'How much war-and-tension news mentions Israel.',
      ifRising: 'A larger share of tension coverage is about Israel.',
      ifFalling: 'A smaller share of tension coverage is about Israel.',
      connections: [
        { with: 'gpr-index', text: 'The headline gauge this country share belongs to.', strength: 'reliable' },
        { with: 'brent', text: 'Middle-East tension often travels with the oil price.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'gpr-saudi': {
      plainName: 'Saudi tension gauge',
      oneLine: 'How much war-and-tension news mentions Saudi Arabia.',
      ifRising: 'A larger share of tension coverage is about Saudi Arabia.',
      ifFalling: 'A smaller share of tension coverage is about Saudi Arabia.',
      connections: [
        { with: 'gpr-index', text: 'The headline gauge this country share belongs to.', strength: 'reliable' },
        { with: 'brent', text: 'Gulf tension often travels with the oil price.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'gpr-australia': {
      plainName: 'Australia tension gauge',
      oneLine: 'How much war-and-tension news mentions Australia.',
      ifRising: 'A larger share of tension coverage is about Australia.',
      ifFalling: 'A smaller share of tension coverage is about Australia.',
      connections: [
        { with: 'gpr-index', text: 'The headline gauge this country share belongs to.', strength: 'reliable' },
        { with: 'audusd', text: 'Australia’s currency often reads the world mood.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'tpu-us': {
      plainName: 'Trade-fight noise gauge',
      oneLine: 'How much US policy news is about trade fights.',
      ifRising: 'Importers and exporters usually face harder planning.',
      ifFalling: 'A quieter trade-policy backdrop usually eases supply plans.',
      connections: [
        { with: 'epu-us', text: 'The trade column of the wider policy-noise gauge.', strength: 'reliable' },
        { with: 'gpr-index', text: 'Two lenses on world friction: trade words beside war words.', strength: 'usually' },
      ],
      glossaryTerms: ['trade-policy-uncertainty'],
    },
    // gap-closure S4-M4.3 (2026-11-01): the chokepoint cards — measured
    // ship traffic through the world's narrow sea gates. Measurements and
    // tendencies only; the copy never names an event as a cause.
    'chokepoint-suez': {
      plainName: 'Suez Canal traffic',
      oneLine: 'How many ships a day pass through the Suez Canal.',
      ifRising: 'More of the Europe-Asia sea route is flowing through the canal.',
      ifFalling: 'Fewer ships a day are using the Europe-Asia shortcut.',
      connections: [
        { with: 'chokepoint-bab-el-mandeb', text: 'The Red Sea gate on the canal\u2019s southern approach.', strength: 'reliable' },
        { with: 'brent', text: 'The oil price often reads long freight routes into its moves.', strength: 'usually' },
      ],
      glossaryTerms: ['chokepoint', 'transit-estimate'],
    },
    'chokepoint-panama': {
      plainName: 'Panama Canal traffic',
      oneLine: 'How many ships a day pass through the Panama Canal.',
      ifRising: 'More Atlantic-Pacific trade is moving through the canal.',
      ifFalling: 'Fewer ships a day are crossing between the two oceans.',
      connections: [
        { with: 'chokepoint-suez', text: 'The two canal gates between the world\u2019s biggest trade blocs.', strength: 'usually' },
        { with: 'brent', text: 'Longer freight routes tend to show up in oil\u2019s price moves.', strength: 'sometimes' },
      ],
      glossaryTerms: ['chokepoint', 'transit-estimate'],
    },
    'chokepoint-bab-el-mandeb': {
      plainName: 'Bab el-Mandeb traffic',
      oneLine: 'How many ships a day pass the gate into the Red Sea.',
      ifRising: 'More Suez-bound traffic is taking the Red Sea route.',
      ifFalling: 'Fewer ships a day are entering the Red Sea gate.',
      connections: [
        { with: 'chokepoint-suez', text: 'The canal the Red Sea gate feeds; the pair reads as one route.', strength: 'reliable' },
        { with: 'gpr-saudi', text: 'The tension gauge of the region this gate sits in.', strength: 'usually' },
      ],
      glossaryTerms: ['chokepoint', 'transit-estimate'],
    },
    'chokepoint-malacca': {
      plainName: 'Malacca Strait traffic',
      oneLine: 'How many ships a day pass between the Indian Ocean and east Asia.',
      ifRising: 'More of the Asia-bound trade is moving on the shortest sea lane.',
      ifFalling: 'Fewer ships a day are using the main east-Asia artery.',
      connections: [
        { with: 'chokepoint-taiwan', text: 'The two busiest gates on the east-Asia approach.', strength: 'reliable' },
        { with: 'china-pmi', text: 'Chinese factory runs tend to move with the raw-materials traffic.', strength: 'usually' },
      ],
      glossaryTerms: ['chokepoint', 'transit-estimate'],
    },
    'chokepoint-taiwan': {
      plainName: 'Taiwan Strait traffic',
      oneLine: 'How many ships a day pass through the Taiwan Strait.',
      ifRising: 'More north-east Asian trade is moving through the strait.',
      ifFalling: 'Fewer ships a day are crossing between mainland China and Taiwan.',
      connections: [
        { with: 'chokepoint-malacca', text: 'The two busiest gates on the east-Asia approach.', strength: 'reliable' },
        { with: 'gpr-taiwan', text: 'The tension gauge of the same waters, read beside the traffic.', strength: 'usually' },
      ],
      glossaryTerms: ['chokepoint', 'transit-estimate'],
    },
    // gap-closure S4-M4.4 (2026-11-01): the supply-chain and energy cards
    // — measured pressure, stocks and prices. The Australian angle leads
    // the coal and LNG cards (RULES §7); measurements and tendencies only.
    gscpi: {
      plainName: 'Supply chain pressure gauge',
      oneLine: 'How stretched the world\u2019s delivery chains are.',
      ifRising: 'Moving goods tends to take longer and cost more.',
      ifFalling: 'Goods tend to flow more freely and freight tends to cost less.',
      connections: [
        { with: 'us-cpi-yoy', text: 'Delivery-chain pressure tends to reach goods prices with a lag.', strength: 'usually' },
        { with: 'chokepoint-suez', text: 'The traffic gates the pressure index reads beside.', strength: 'sometimes' },
      ],
      glossaryTerms: ['supply-chain-pressure'],
    },
    'us-spr': {
      plainName: 'America\u2019s emergency oil store',
      oneLine: 'How much crude oil the US government holds in its strategic reserve.',
      ifRising: 'The emergency store is being refilled.',
      ifFalling: 'The emergency store is being drawn down.',
      connections: [
        { with: 'eia-crude-stocks', text: 'The commercial stocks that sit beside the government store.', strength: 'reliable' },
        { with: 'brent', text: 'The oil price the cushion stands behind.', strength: 'usually' },
      ],
      glossaryTerms: ['strategic-reserve'],
    },
    'us-crude-production': {
      plainName: 'US oil pumping',
      oneLine: 'How much crude oil US fields pump each day.',
      ifRising: 'American oil supply is growing.',
      ifFalling: 'American oil supply is falling back.',
      connections: [
        { with: 'brent', text: 'The price that tends to move with supply swings.', strength: 'usually' },
        { with: 'eia-crude-stocks', text: 'Supply and storage read as one balance.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'coal-aus': {
      plainName: 'Australian coal price',
      oneLine: 'The world price of Australia\u2019s largest energy export.',
      ifRising: 'Australia\u2019s coal export income tends to rise.',
      ifFalling: 'Australia\u2019s coal export income tends to ease.',
      connections: [
        { with: 'terms-of-trade', text: 'Coal is one of the big legs of Australia\u2019s export price basket.', strength: 'reliable' },
        { with: 'audusd', text: 'Resource export prices and the dollar tend to move together.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'lng-japan': {
      plainName: 'Asia\u2019s LNG price',
      oneLine: 'The price Asian buyers pay for shipped gas.',
      ifRising: 'Australia\u2019s LNG export income tends to rise.',
      ifFalling: 'Asia\u2019s gas import bill tends to ease.',
      connections: [
        { with: 'coal-aus', text: 'The two big energy-export prices of the region.', strength: 'usually' },
        { with: 'audusd', text: 'Resource export prices and the dollar tend to move together.', strength: 'usually' },
      ],
      glossaryTerms: ['lng'],
    },
    'gas-europe': {
      plainName: 'Europe\u2019s gas price',
      oneLine: 'The price of natural gas in Europe.',
      ifRising: 'European industry tends to face costlier energy.',
      ifFalling: 'European energy costs tend to ease.',
      connections: [
        { with: 'brent', text: 'The two fossil-fuel prices of the world\u2019s industrial core.', strength: 'usually' },
        { with: 'lng-japan', text: 'The Atlantic and Pacific reference prices of one world market.', strength: 'usually' },
      ],
      glossaryTerms: ['lng'],
    },
    'copper-usd': {
      plainName: 'The world copper price',
      oneLine: 'The world price of the metal that wires homes and grids.',
      ifRising: 'Wiring, appliances and building costs tend to climb.',
      ifFalling: 'A friend to builders, manufacturers and renovation budgets.',
      connections: [
        { with: 'china-pmi', text: 'Copper often moves with Chinese factory strength.', strength: 'usually' },
        { with: 'copper-gold', text: 'Copper is the growth leg of that metal measure.', strength: 'reliable' },
      ],
      glossaryTerms: ['commodity'],
    },

    /* ----- Batch 7 — market-stress A (6) ----- */
    'stress-stlfsi': {
      plainName: 'US money-market stress',
      oneLine: 'One weekly number for stress across US money and credit markets.',
      ifRising: 'Lending conditions usually tighten, in the US and often worldwide.',
      ifFalling: 'Market plumbing usually calms, which often eases lending.',
      connections: [
        { with: 'nfci', text: 'The Chicago cousin reads the same stress with a wider lens.', strength: 'reliable' },
        { with: 'vix', text: 'Market fear usually rises with money-market stress.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    nfci: {
      plainName: 'How easily US money moves',
      oneLine: 'How easily money moves through the US financial system.',
      ifRising: 'Money usually gets harder to move, which slows lending.',
      ifFalling: 'Easy money usually supports credit and spending.',
      connections: [
        { with: 'stress-stlfsi', text: 'The sister gauge from the St Louis Fed reads the same stress differently.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },
    vix: {
      plainName: 'The market fear gauge',
      oneLine: 'How nervous US share investors are right now.',
      ifRising: 'Big, fast swings in world share markets usually loom.',
      ifFalling: 'Calm usually settles over world share markets.',
      connections: [
        { with: 'gpr-index', text: 'War and tension news often lifts this gauge.', strength: 'usually' },
        { with: 'stress-stlfsi', text: 'Fear and money-market stress usually move together.', strength: 'usually' },
      ],
      glossaryTerms: ['vix', 'volatility'],
    },
    'gold-silver': {
      plainName: 'Gold priced in silver',
      oneLine: 'How many silver ounces one gold ounce buys.',
      ifRising: 'Fear usually leads, with gold the preferred safe haven.',
      ifFalling: 'Industrial strength usually shows, with silver running dearer.',
      connections: [
        { with: 'gold-usd', text: 'Gold is the fear leg of this measure.', strength: 'reliable' },
        { with: 'silver-usd', text: 'Silver is the half-industrial leg.', strength: 'reliable' },
      ],
      glossaryTerms: ['safe-haven'],
    },
    'cftc-gold-positioning': {
      plainName: 'The gold crowd gauge',
      oneLine: 'How crowded big traders’ gold bets have become.',
      ifRising: 'The gold trade usually gets crowded, the zone that unwinds hardest.',
      ifFalling: 'Crowding usually thins; rare net-short stretches have sat near price floors.',
      connections: [
        { with: 'vix', text: 'Stress plus crowding is the mix that unwinds hardest.', strength: 'usually' },
        { with: 'gold-usd', text: 'The bets being gauged are on this metal.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },
    walcl: {
      plainName: 'The Fed’s balance sheet',
      oneLine: 'The total size of what the US central bank owns.',
      ifRising: 'The system usually gets flooded with money, an emergency-style setting.',
      ifFalling: 'The Fed usually drains money steadily from the system.',
      connections: [
        { with: 'm2-us', text: 'One is the central bank’s own creation of money; the other the banking system’s.', strength: 'reliable' },
        { with: 'fed-target', text: 'The Fed’s two levers: the price of money and the quantity.', strength: 'reliable' },
      ],
      glossaryTerms: ['central-bank', 'money-supply'],
    },

    /* ----- Batch 8 — market-stress B (4) ----- */
    'crypto-fng': {
      plainName: 'Crypto mood today',
      oneLine: 'A daily gauge of how fearful or greedy crypto markets feel.',
      ifRising: 'Greed usually builds, and extreme greed has often appeared near sharp turns.',
      ifFalling: 'Fear usually deepens; extreme fear has often sat near rebounds.',
      connections: [
        { with: 'btc-usd', text: 'The mood gauge and the Bitcoin price read the same market.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'shiller-cape': {
      plainName: 'US shares vs long-run earnings',
      oneLine: 'How expensive US shares look against their own long-run earnings power.',
      ifRising: 'Shares get dearer against their earnings, which has often meant weaker decade-ahead returns.',
      ifFalling: 'Cheaper shares, a mix that has often come with better decade-ahead returns.',
      connections: [
        { with: 'shiller-ecy', text: 'The companion reading puts shares against safe government money instead.', strength: 'reliable' },
        { with: 'real-yield-10y', text: 'The safe-money leg of the companion reading is this real return.', strength: 'reliable' },
      ],
      glossaryTerms: ['stock-index', 'real-yield', 'yield'],
    },
    'shiller-ecy': {
      plainName: 'Shares versus safe money',
      oneLine: 'What US shares earn versus what safe US government money pays.',
      ifRising: 'Shares usually offer a fatter cushion over safe money.',
      ifFalling: 'Safe money usually competes harder, a mix that has weighed on decade-ahead returns.',
      connections: [
        { with: 'shiller-cape', text: 'Both read the same share prices; this one subtracts safe money.', strength: 'reliable' },
      ],
      glossaryTerms: ['real-yield', 'yield'],
    },
    'gpr-index': {
      plainName: 'War and tension gauge',
      oneLine: 'How much war and tension fills the world’s news.',
      ifRising: 'Oil and gold usually climb, and shares often slip.',
      ifFalling: 'A calmer news backdrop usually supports risk-taking.',
      connections: [
        { with: 'vix', text: 'The fear gauge often rises with war news.', strength: 'usually' },
        { with: 'brent', text: 'Oil often jumps on war and supply scares.', strength: 'usually' },
        { with: 'gold-usd', text: 'Gold often rises on worry.', strength: 'usually' },
      ],
      glossaryTerms: ['geopolitical-risk-index'],
    },

    /* ----- Batch 9 — prices-board (5) ----- */
    brent: {
      plainName: 'The world oil price',
      oneLine: 'The world’s main oil price: what a barrel of crude costs.',
      ifRising: 'Petrol, heating and delivery prices usually climb, feeding inflation nearly everywhere.',
      ifFalling: 'Cheaper fuel usually eases household budgets and takes pressure off inflation.',
      connections: [
        { with: 'wti', text: 'The American oil twin tracks this world price closely.', strength: 'reliable' },
        { with: 'eia-crude-stocks', text: 'The storage-tanks card explains what oil prices are reacting to.', strength: 'usually' },
        { with: 'us-cpi-yoy', text: 'Costlier oil usually feeds into US inflation readings with a lag.', strength: 'usually' },
      ],
      australiaAngle: 'Australia imports much of its fuel, so local petrol prices usually track this oil price with a delay.',
      glossaryTerms: ['inflation'],
    },
    'gold-usd': {
      plainName: 'The world gold price',
      oneLine: 'The world price of one ounce of gold, in US dollars.',
      ifRising: 'Jewellery and coins usually cost more, often because money is seeking a safe haven.',
      ifFalling: 'Coins and jewellery usually get cheaper, often while worry fades.',
      connections: [
        { with: 'dollar-basket', text: 'A stronger US dollar often weighs on this price.', strength: 'usually' },
        { with: 'real-yield-10y', text: 'Higher real yields tend to pull money away from gold.', strength: 'usually' },
        { with: 'silver-usd', text: 'Silver usually follows gold, only with bigger swings.', strength: 'usually' },
      ],
      australiaAngle: 'Australians pay this price through the local dollar: a weaker AUD makes each ounce dearer locally.',
      glossaryTerms: ['safe-haven', 'real-yield', 'yield'],
    },
    'silver-usd': {
      plainName: 'The world silver price',
      oneLine: 'The world price of one ounce of silver, in US dollars.',
      ifRising: 'Jewellery and electronics usually cost more, and silver often swings harder than gold.',
      ifFalling: 'Metal costs usually ease for makers of electronics, solar panels and jewellery.',
      connections: [
        { with: 'gold-usd', text: 'Silver usually follows its bigger sibling, only harder.', strength: 'usually' },
        { with: 'gold-silver', text: 'This is one leg of the gold-versus-silver reading.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },
    'btc-usd': {
      plainName: 'The bitcoin price',
      oneLine: 'The world price of one bitcoin, in US dollars.',
      ifRising: 'Crypto mood usually brightens across the whole family of digital assets.',
      ifFalling: 'Crypto mood usually darkens, and this famously jumpy asset can fall fast.',
      connections: [
        { with: 'crypto-fng', text: 'The daily mood gauge reads the same market.', strength: 'usually' },
        { with: 'gold-btc', text: 'This price is the new-money leg of the bitcoin-versus-gold reading.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },
    'gold-btc': {
      plainName: 'Bitcoin measured in gold',
      oneLine: 'How much gold one bitcoin buys.',
      ifRising: 'The market usually values the new digital money over the old metal money.',
      ifFalling: 'Gold usually holds its worth while bitcoin falls out of favour.',
      connections: [
        { with: 'btc-usd', text: 'Bitcoin is the new-money leg of this reading.', strength: 'reliable' },
        { with: 'gold-usd', text: 'Gold is the old-money leg.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },

    /* ----- Batch 10 — prices-heat A (8) ----- */
    'us-cpi-yoy': {
      plainName: 'US inflation',
      oneLine: 'How fast US consumer prices are rising, versus a year ago.',
      ifRising: 'Higher US inflation usually keeps world interest rates high for longer.',
      ifFalling: 'Cooling US inflation usually opens the door to cheaper borrowing worldwide.',
      connections: [
        { with: 'fed-target', text: 'The Fed reacts to this number when moving its main rate.', strength: 'usually' },
        { with: 'us-cpi-core-yoy', text: 'The core companion strips the food and energy swings.', strength: 'reliable' },
        { with: 'michigan-1y-expectations', text: 'What households expect next year tends to follow this.', strength: 'usually' },
      ],
      glossaryTerms: ['inflation', 'interest-rate'],
    },
    'us-pce-core-yoy': {
      plainName: 'The Fed’s inflation gauge',
      oneLine: 'US inflation without food and energy, measured the Fed’s way.',
      ifRising: 'The Fed usually stays tougher for longer, keeping world borrowing dearer.',
      ifFalling: 'Cooling toward the Fed’s goal usually brings talk of cheaper money closer.',
      connections: [
        { with: 'fed-target', text: 'The Fed’s stated inflation goal is defined on this measure.', strength: 'reliable' },
        { with: 'us-cpi-yoy', text: 'Both read US prices; this one is the Fed’s own yardstick.', strength: 'reliable' },
        { with: 'us-cpi-core-yoy', text: 'The other US core gauge reads the same stripped-out prices.', strength: 'reliable' },
      ],
      glossaryTerms: ['inflation'],
    },
    'euro-hicp': {
      plainName: 'Euro-area inflation',
      oneLine: 'How fast prices are rising across the euro area.',
      ifRising: 'The ECB usually keeps rates higher and euro loans dearer.',
      ifFalling: 'Calmer euro-area inflation usually lets cheaper money return.',
      connections: [
        { with: 'ecb-dfr', text: 'The ECB’s policy rate answers this number.', strength: 'reliable' },
        { with: 'us-cpi-yoy', text: 'The US and euro readings together frame world inflation.', strength: 'usually' },
      ],
      glossaryTerms: ['inflation', 'policy-rate'],
    },
    'breakeven-5y5y': {
      plainName: 'US inflation far ahead',
      oneLine: 'The US inflation rate markets expect five to ten years out.',
      ifRising: 'Markets are pricing more future inflation, the mood that keeps long rates high.',
      ifFalling: 'Markets fear weak future inflation, the setting that invites easy money.',
      connections: [
        { with: 'breakeven-10y', text: 'The ten-year companion reads the nearer window.', strength: 'reliable' },
        { with: 'us10y', text: 'Expected inflation is one building block of long-term rates.', strength: 'reliable' },
        { with: 'fed-target', text: 'Central banks watch it to judge their credibility.', strength: 'usually' },
      ],
      glossaryTerms: ['inflation', 'central-bank'],
    },
    'us-cpi-core-yoy': {
      plainName: 'US core inflation',
      oneLine: 'US inflation with the jumpy food and energy prices taken out.',
      ifRising: 'A rising core usually keeps the Fed tough for longer.',
      ifFalling: 'A cooling core usually signals inflation fading at its roots.',
      connections: [
        { with: 'us-cpi-yoy', text: 'Both come from the same monthly price report.', strength: 'reliable' },
        { with: 'us-pce-core-yoy', text: 'The Fed’s core gauge reads the same underlying direction.', strength: 'usually' },
      ],
      glossaryTerms: ['inflation', 'core-inflation'],
    },
    'us-wages': {
      plainName: 'US pay growth',
      oneLine: 'How fast American paychecks are growing, versus a year ago.',
      ifRising: 'Faster pay sustains spending, but can feed inflation, the loop central banks watch.',
      ifFalling: 'Pay growing slower than prices usually squeezes household budgets.',
      connections: [
        { with: 'us-cpi-yoy', text: 'The gap between this and price growth decides whether households gain ground.', strength: 'usually' },
        { with: 'fed-target', text: 'The Fed watches the pay-and-price loop when setting rates.', strength: 'usually' },
      ],
      glossaryTerms: ['inflation', 'central-bank'],
    },
    'breakeven-10y': {
      plainName: 'US inflation, ten years ahead',
      oneLine: 'The US inflation rate markets expect over the next ten years.',
      ifRising: 'Bond markets are pricing more future inflation, which usually lifts long-term rates.',
      ifFalling: 'Markets fear weak inflation ahead, the setting that invites easy money.',
      connections: [
        { with: 'breakeven-5y5y', text: 'The far-ahead companion reads the window beyond five years.', strength: 'reliable' },
        { with: 't5yie', text: 'The five-year companion reads the nearer window.', strength: 'reliable' },
        { with: 'us10y', text: 'Expected inflation is one building block of the ten-year rate.', strength: 'reliable' },
      ],
      glossaryTerms: ['inflation', 'bond'],
    },
    // Session 3 (GOLD_FRED_GAPFILL_SPEC G2, 2026-10-31): the interplay
    // card's plain-language entry — the market's priced acceleration of
    // inflation (forward minus spot). Context only; never a gold voter.
    'breakeven-tilt': {
      plainName: 'The inflation tilt, near vs far',
      oneLine: 'Whether markets price inflation building or fading into the far five years.',
      ifRising: 'Markets lean toward inflation building into the far window, a mood that tends to lift long-run hedging.',
      ifFalling: 'Markets lean toward inflation fading after the near window, reading today’s pressure as temporary.',
      connections: [
        { with: 't5yie', text: 'The near leg of the tilt: what markets price for the first five years.', strength: 'reliable' },
        { with: 'breakeven-5y5y', text: 'The far leg of the tilt: the window beyond it.', strength: 'reliable' },
        { with: 'breakeven-10y', text: 'The ten-year read blends both windows the tilt separates.', strength: 'reliable' },
      ],
      glossaryTerms: ['inflation', 'breakeven'],
    },
    't5yie': {
      plainName: 'US inflation, five years ahead',
      oneLine: 'The US inflation rate markets expect over the next five years.',
      ifRising: 'Markets are pricing more inflation over the medium term, usually lifting long rates.',
      ifFalling: 'Markets fear soft inflation ahead, the setting that invites easy money.',
      connections: [
        { with: 'breakeven-10y', text: 'The ten-year companion reads the wider window.', strength: 'reliable' },
        { with: 'breakeven-5y5y', text: 'The far-ahead companion reads beyond it.', strength: 'reliable' },
      ],
      glossaryTerms: ['inflation'],
    },

    /* ----- Batch 11 — prices-heat B (8) ----- */
    wti: {
      plainName: 'The American oil price',
      oneLine: 'What America pays for a barrel of its own crude.',
      ifRising: 'US petrol and delivery prices usually climb, feeding into US inflation.',
      ifFalling: 'Cheaper US oil usually eases American fuel costs and inflation pressure.',
      connections: [
        { with: 'brent', text: 'The world twin usually trades close to this price.', strength: 'reliable' },
        { with: 'eia-crude-stocks', text: 'The tanks gauge explains the supply side of this price.', strength: 'usually' },
        { with: 'natgas', text: 'Oil and gas together steer US household energy bills.', strength: 'usually' },
      ],
      glossaryTerms: ['inflation'],
    },
    natgas: {
      plainName: 'The US natural gas price',
      oneLine: 'The price of the gas that heats US homes and powers its grids.',
      ifRising: 'Winter heating and power bills in the US usually climb.',
      ifFalling: 'Cheaper gas usually eases heating and electricity bills for US households.',
      connections: [
        { with: 'brent', text: 'Oil and gas together steer the energy line of household budgets.', strength: 'usually' },
        { with: 'us-cpi-yoy', text: 'Gas moves the energy line of US inflation readings.', strength: 'usually' },
      ],
      glossaryTerms: ['inflation'],
    },
    'eia-crude-stocks': {
      plainName: 'Oil in America’s tanks',
      oneLine: 'How much crude oil sits in America’s storage tanks.',
      ifRising: 'A glut usually builds, which has often dragged crude and pump prices down.',
      ifFalling: 'Draining tanks can signal a supply squeeze that pushes petrol prices up.',
      connections: [
        { with: 'brent', text: 'Prices react to how full or empty the tanks run.', strength: 'usually' },
        { with: 'wti', text: 'The American price reads these tanks closely.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    platinum: {
      plainName: 'The world platinum price',
      oneLine: 'The world price of one ounce of platinum, in US dollars.',
      ifRising: 'Jewellery and the metal parts of cars usually cost more.',
      ifFalling: 'Cheaper platinum usually helps jewellers and car-part makers.',
      connections: [
        { with: 'gold-usd', text: 'The precious-metal cousin usually moves with gold, only harder.', strength: 'usually' },
        { with: 'silver-usd', text: 'Both metals straddle jewellery and factory demand.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'gold-oil-ratio': {
      plainName: 'Gold priced in barrels',
      oneLine: 'How many barrels of oil one ounce of gold buys.',
      ifRising: 'Gold usually buys more barrels, the mix that often marks fear-rich eras.',
      ifFalling: 'Each ounce usually buys fewer barrels, the mix that often marks energy-dominant eras.',
      connections: [
        { with: 'gold-usd', text: 'Gold is one leg of this reading.', strength: 'reliable' },
        { with: 'brent', text: 'Oil is the other leg.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },
    'food-index': {
      plainName: 'The world grocery gauge',
      oneLine: 'World food prices at the wholesale level, before they reach shelves.',
      ifRising: 'Grocery bills usually climb months later, hitting poorer households hardest.',
      ifFalling: 'Cheaper wholesale food usually brings relief to grocery budgets months ahead.',
      connections: [
        { with: 'wheat', text: 'Wheat is one ground-truth grain inside this basket.', strength: 'reliable' },
        { with: 'maize', text: 'Maize is the feed grain behind meat prices in the basket.', strength: 'reliable' },
        { with: 'brent', text: 'Food and fuel together move the household cost of living.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    wheat: {
      plainName: 'The world wheat price',
      oneLine: 'What the world pays for a tonne of wheat.',
      ifRising: 'Flour, bread and animal-feed costs usually climb.',
      ifFalling: 'Cheaper wheat usually eases bread and feed budgets.',
      connections: [
        { with: 'food-index', text: 'The food basket leans on this staple grain.', strength: 'reliable' },
        { with: 'maize', text: 'The two grains swap in feed and food demand at times.', strength: 'sometimes' },
      ],
      glossaryTerms: [],
    },
    maize: {
      plainName: 'The world maize price',
      oneLine: 'What the world pays for a tonne of maize.',
      ifRising: 'Feed, meat and egg prices usually climb in its wake.',
      ifFalling: 'Cheap feed usually eases meat and dairy budgets.',
      connections: [
        { with: 'food-index', text: 'The feed grain inside the food basket.', strength: 'reliable' },
        { with: 'wheat', text: 'The two grains swap in feed and food demand at times.', strength: 'sometimes' },
      ],
      glossaryTerms: [],
    },

    /* ----- Batch 12 — au-inflation-rates (6) ----- */
    'au-cpi': {
      plainName: 'Australian inflation',
      oneLine: 'How fast Australian consumer prices are rising, versus a year ago.',
      ifRising: 'The RBA usually keeps rates higher, making loans dearer and saving pay more.',
      ifFalling: 'Cooling inflation usually opens the door to RBA rate cuts.',
      connections: [
        { with: 'rba-cash-rate', text: 'The RBA moves its main rate in answer to this scoreboard.', strength: 'usually' },
        { with: 'au-trimmed-mean', text: 'The steadier companion shows the underlying direction.', strength: 'reliable' },
        { with: 'au-petrol-yoy', text: 'Petrol is one of the jumpy items inside this basket.', strength: 'reliable' },
      ],
      australiaAngle: 'This is Australia’s own cost-of-living gauge: the number behind nearly every home-loan rate move.',
      glossaryTerms: ['inflation', 'mortgage'],
    },
    'au-trimmed-mean': {
      plainName: 'Australia’s steady inflation',
      oneLine: 'The steadier middle of Australian price changes that the RBA targets.',
      ifRising: 'A rising underlying reading usually keeps the RBA tough on rates.',
      ifFalling: 'Cooling underlying inflation usually opens the door to RBA cuts.',
      connections: [
        { with: 'au-cpi', text: 'The headline reading swings more; this one shows the steady core.', strength: 'reliable' },
        { with: 'rba-cash-rate', text: 'The RBA steers the cash rate by this reading first.', strength: 'reliable' },
      ],
      australiaAngle: 'The RBA’s preferred gauge: when it sits outside the target band, mortgage relief usually waits.',
      glossaryTerms: ['inflation', 'trimmed-mean', 'mortgage'],
    },
    'au-10y': {
      plainName: 'Australia’s 10-year borrowing cost',
      oneLine: 'What the Australian government pays to borrow for ten years.',
      ifRising: 'Fixed home-loan rates and term-deposit rates usually climb.',
      ifFalling: 'Fixed home loans usually get cheaper and long savings pay less.',
      connections: [
        { with: 'rba-cash-rate', text: 'The cash rate anchors the short end; this is the market’s long rate.', strength: 'reliable' },
        { with: 'au-us-10y-gap', text: 'The gap card compares this yield with the US one.', strength: 'reliable' },
      ],
      australiaAngle: 'This long rate, not just the cash rate, prices Australia’s multi-year money: fixed loans and term deposits follow it.',
      glossaryTerms: ['yield', 'mortgage'],
    },
    'rba-expectations': {
      plainName: 'Where markets think the RBA goes',
      oneLine: 'Whether the market’s three-year rate sits above or below today’s cash rate.',
      ifRising: 'Markets usually price a rising cash-rate path ahead.',
      ifFalling: 'Markets usually price rate cuts ahead, the pattern that has opened past cutting cycles.',
      connections: [
        { with: 'rba-cash-rate', text: 'The gap is measured against today’s cash rate.', strength: 'reliable' },
        { with: 'au-10y', text: 'The long-rate companion shows the ten-year window.', strength: 'reliable' },
      ],
      australiaAngle: 'A positive gap usually means money is priced dearer ahead; a negative one has usually come before rate-cut cycles.',
      glossaryTerms: [],
    },
    'au-us-10y-gap': {
      plainName: 'The Australia-US long-rate gap',
      oneLine: 'Whether Australia pays more or less than the US to borrow for ten years.',
      ifRising: 'Global money usually finds Australian bonds more rewarding, supporting the local dollar.',
      ifFalling: 'US rates pulling above Australia’s have usually weighed on the local dollar.',
      connections: [
        { with: 'au-10y', text: 'The Australian leg of the gap.', strength: 'reliable' },
        { with: 'us10y', text: 'The US leg.', strength: 'reliable' },
        { with: 'audusd', text: 'The dollar often follows this pull of money across the Pacific.', strength: 'usually' },
      ],
      australiaAngle: 'This gap is one of the quiet levers on the Australian dollar: when the US pays clearly more, the AUD usually sags.',
      glossaryTerms: ['bond'],
    },
    'au-petrol-yoy': {
      plainName: 'Australian petrol vs last year',
      oneLine: 'How much more or less Australian fuel costs than a year ago.',
      ifRising: 'Family budgets and freight costs usually feel the squeeze first.',
      ifFalling: 'Cheaper fuel is the rare reading that eases household budgets.',
      connections: [
        { with: 'au-cpi', text: 'Fuel is a jumpy item inside the inflation basket.', strength: 'reliable' },
        { with: 'brent', text: 'World oil and the local dollar usually drive the pump together.', strength: 'reliable' },
      ],
      australiaAngle: 'The bowser is Australia’s most visible weekly price; it feeds headline inflation and the RBA’s mood.',
      glossaryTerms: ['inflation'],
    },

    /* ----- Batch 13 — au-households A (6) ----- */
    'rba-cash-rate': {
      plainName: 'Australia’s main rate',
      oneLine: 'Australia’s main interest rate, set by the Reserve Bank.',
      ifRising: 'Variable home loans and savings rates usually follow within weeks.',
      ifFalling: 'Borrowers usually get relief and savers earn less, with a lag.',
      connections: [
        { with: 'fed-target', text: 'The Fed sets the US twin of this dial.', strength: 'reliable' },
        { with: 'au-home-loan', text: 'Home-loan rates follow this dial with a lag.', strength: 'reliable' },
        { with: 'au-deposit-rate', text: 'Savings rates ride on it too.', strength: 'reliable' },
      ],
      australiaAngle: 'Every variable mortgage in Australia reprices with this dial; savings accounts follow.',
      glossaryTerms: ['interest-rate', 'central-bank', 'mortgage'],
    },
    'au-unemployment': {
      plainName: 'The Australian jobless rate',
      oneLine: 'The share of Australians looking for work who cannot find it.',
      ifRising: 'Job hunting usually gets harder and household spending softer.',
      ifFalling: 'Plentiful jobs usually support wages and confidence.',
      connections: [
        { with: 'au-job-vacancies', text: 'Vacancies usually turn before the jobless rate does.', strength: 'reliable' },
        { with: 'rba-cash-rate', text: 'The RBA watches the jobs market when setting rates.', strength: 'usually' },
      ],
      australiaAngle: 'A half-point rise off a low has often marked the start of an Australian slowdown.',
      glossaryTerms: [],
    },
    'au-wage-growth': {
      plainName: 'Australian pay growth',
      oneLine: 'How fast Australian wages are rising, versus a year ago.',
      ifRising: 'Pay packets usually catch up, though fast pay can feed prices.',
      ifFalling: 'An hour’s pay usually covers less when prices keep rising.',
      connections: [
        { with: 'au-cpi', text: 'The gap between this and price growth shows whether pay is winning.', strength: 'usually' },
        { with: 'au-unemployment', text: 'A strong jobs market usually keeps pay rising.', strength: 'usually' },
      ],
      australiaAngle: 'The wage-and-price scoreboard: through much of Australia’s inflation era, pay lagged prices, squeezing real budgets.',
      glossaryTerms: ['inflation'],
    },
    'au-rent-yoy': {
      plainName: 'Australian rent growth',
      oneLine: 'How fast Australian rents are rising, versus a year ago.',
      ifRising: 'Renters’ budgets usually squeeze harder at renewal time.',
      ifFalling: 'Weak rent growth is the rare relief for renters’ budgets.',
      connections: [
        { with: 'au-cpi', text: 'Rent is a big weight inside the inflation basket.', strength: 'reliable' },
        { with: 'au-home-values', text: 'Rent and house prices often move together, but not always.', strength: 'sometimes' },
        { with: 'rba-cash-rate', text: 'Rate moves usually cool the housing market with a delay.', strength: 'usually' },
      ],
      australiaAngle: 'Rent is the biggest weekly bill for roughly a third of Australian households.',
      glossaryTerms: ['inflation'],
    },
    'au-home-loan': {
      plainName: 'The mortgage rate people pay',
      oneLine: 'The average rate on outstanding Australian home loans.',
      ifRising: 'Monthly repayments usually rise, squeezing household budgets.',
      ifFalling: 'Relief usually reaches variable loans first, with a lag.',
      connections: [
        { with: 'rba-cash-rate', text: 'Each cash-rate move flows into this rate with a lag.', strength: 'reliable' },
        { with: 'au-deposit-rate', text: 'The savings twin: what the crowd pays versus earns.', strength: 'reliable' },
        { with: 'mortgage-30y', text: 'The US twin shows the American home-loan story.', strength: 'reliable' },
      ],
      australiaAngle: 'Home loans are the biggest debt of most Australian households; this is the rate they actually pay.',
      glossaryTerms: ['mortgage'],
    },
    'au-deposit-rate': {
      plainName: 'The savings rate on offer',
      oneLine: 'What banks pay on new household term deposits.',
      ifRising: 'Savers shopping today usually find more interest on offer.',
      ifFalling: 'Cash savings usually earn less, and locking money away pays less too.',
      connections: [
        { with: 'rba-cash-rate', text: 'Term-deposit rates usually track the cash rate with a short lag.', strength: 'reliable' },
        { with: 'au-home-loan', text: 'The borrowing twin of this savings rate.', strength: 'reliable' },
        { with: 'au-cpi', text: 'Real saving power depends on the gap to inflation.', strength: 'usually' },
      ],
      australiaAngle: 'The twin of the mortgage card: what the crowd earns on savings while borrowers pay the loan rate.',
      glossaryTerms: ['inflation', 'mortgage'],
    },

    /* ----- Batch 14 — au-households B (5) ----- */
    'au-home-values': {
      plainName: 'Australian home prices',
      oneLine: 'The average price of Australian homes, as an index.',
      ifRising: 'Owners feel richer and first-home buyers usually face a harder climb.',
      ifFalling: 'Cheaper homes usually make entering easier, but rarely last long in Australia.',
      connections: [
        { with: 'au-housing-finance', text: 'New lending usually turns before home values do.', strength: 'reliable' },
        { with: 'rba-cash-rate', text: 'Rate rises have usually cooled the market, with a delay.', strength: 'usually' },
      ],
      australiaAngle: 'Housing is the biggest asset and debt source for Australian households; prices feed wealth and confidence.',
      glossaryTerms: [],
    },
    'au-household-debt-arrears': {
      plainName: 'The household debt load',
      oneLine: 'How large Australian household debt sits against income.',
      ifRising: 'Every rate rise usually bites harder, and arrears tend to follow with a lag.',
      ifFalling: 'Household balance sheets usually mend, softening the blow of rate moves.',
      connections: [
        { with: 'rba-cash-rate', text: 'High debt is why RBA moves dominate Australian household budgets.', strength: 'reliable' },
        { with: 'au-home-loan', text: 'Home loans are the biggest slice of this debt.', strength: 'reliable' },
      ],
      australiaAngle: 'Australian households carry among the world’s heaviest debt loads, so rate moves dominate the national mood.',
      glossaryTerms: [],
    },
    'au-housing-finance': {
      plainName: 'New Australian home lending',
      oneLine: 'How much Australians are borrowing for homes right now.',
      ifRising: 'Households are committing; housing demand usually builds ahead.',
      ifFalling: 'Households stepping back is usually the leading edge of a housing slowdown.',
      connections: [
        { with: 'au-home-values', text: 'Loans are signed months before they show up in home values.', strength: 'reliable' },
        { with: 'rba-cash-rate', text: 'Lending usually cools after rate rises and warms after cuts.', strength: 'reliable' },
      ],
      australiaAngle: 'The Australian leading edge: a loan commitment turns first, home values follow.',
      glossaryTerms: [],
    },
    'au-job-vacancies': {
      plainName: 'Australian job openings',
      oneLine: 'How many jobs Australian employers are trying to fill.',
      ifRising: 'Employers are usually still hungry to hire; a strong jobs market.',
      ifFalling: 'Employers usually pull back here before unemployment rises.',
      connections: [
        { with: 'au-unemployment', text: 'One leads, one lags: vacancies first, joblessness second.', strength: 'reliable' },
        { with: 'rba-cash-rate', text: 'Hiring strength is one input the RBA reads.', strength: 'usually' },
      ],
      australiaAngle: 'Vacancies usually roll over long before joblessness does, the early-warning line for Australia.',
      glossaryTerms: [],
    },
    'au-saving-ratio': {
      plainName: 'The Australian saving rate',
      oneLine: 'The share of income Australian households save.',
      ifRising: 'Caution is usually rising, and spending often softens before income does.',
      ifFalling: 'Households are usually either stretched or confident enough to spend it all.',
      connections: [
        { with: 'au-housing-finance', text: 'Caution and borrowing usually move in opposite directions.', strength: 'usually' },
        { with: 'au-cpi', text: 'A saving cushion softens the sting of price rises.', strength: 'usually' },
      ],
      australiaAngle: 'The hunkering-down gauge: when uncertainty rises, Australian households save more and spend less first.',
      glossaryTerms: [],
    },

    /* ----- Batch 15 — au-trade-currency (6) ----- */
    audusd: {
      plainName: 'The Australian dollar rate',
      oneLine: 'How many US dollars one Australian dollar buys.',
      ifRising: 'Imports and overseas travel usually get cheaper for Australians.',
      ifFalling: 'Imports and travel usually get dearer, while exports earn more abroad.',
      connections: [
        { with: 'rba-fed-gap', text: 'The rate gap between the two central banks pulls this pair.', strength: 'reliable' },
        { with: 'iron-ore', text: 'Commodity booms usually lift the Australian dollar.', strength: 'usually' },
        { with: 'dollar-basket', text: 'This pair is one thread in the dollar’s overall strength.', strength: 'usually' },
      ],
      australiaAngle: 'Australia’s key pair: it prices imports, exports and overseas travel in one number.',
      glossaryTerms: ['central-bank', 'commodity'],
    },
    audjpy: {
      plainName: 'The Australian dollar in yen',
      oneLine: 'How many Japanese yen one Australian dollar buys.',
      ifRising: 'Travel to Japan usually gets cheaper for Australians, and risk appetite usually builds.',
      ifFalling: 'A fast fall is the classic world de-risking signal, as borrowed yen rushes home.',
      connections: [
        { with: 'us-japan-10y-gap', text: 'The US-Japan rate gap keeps the carry trade alive behind this pair.', strength: 'reliable' },
        { with: 'audusd', text: 'The dollar’s own strength often shows up here too.', strength: 'usually' },
        { with: 'boj-rate', text: 'The Bank of Japan anchors the yen side.', strength: 'usually' },
      ],
      australiaAngle: 'A watched world risk barometer, and the rate that matters for Australian travel and shopping in Japan.',
      glossaryTerms: ['carry-trade', 'central-bank'],
    },
    'terms-of-trade': {
      plainName: 'Export prices versus import prices',
      oneLine: 'Whether Australia’s export prices beat its import prices.',
      ifRising: 'The country usually gets richer without shipping anything more.',
      ifFalling: 'National income usually squeezes, along with budgets and the dollar.',
      connections: [
        { with: 'iron-ore', text: 'Iron ore is the biggest export weight in this measure.', strength: 'reliable' },
        { with: 'audusd', text: 'Export-versus-import strength usually steers the dollar over the years.', strength: 'usually' },
      ],
      australiaAngle: 'Mining booms send it soaring and lift Australian budgets, jobs and the dollar together.',
      glossaryTerms: [],
    },
    'rba-fed-gap': {
      plainName: 'The RBA-Fed rate gap',
      oneLine: 'How far Australia’s main rate sits above or below America’s.',
      ifRising: 'The carry trade usually earns more here, drawing money toward the Australian dollar.',
      ifFalling: 'Money usually leaves for the higher US yield, weighing on the Australian dollar.',
      connections: [
        { with: 'audusd', text: 'This gap is a key pull on the key pair.', strength: 'reliable' },
        { with: 'rba-cash-rate', text: 'The RBA side of the gap.', strength: 'reliable' },
        { with: 'fed-target', text: 'The Fed side.', strength: 'reliable' },
      ],
      australiaAngle: 'The short-term money pull between the two dollars: a wide gap either way usually moves the AUD.',
      glossaryTerms: ['carry-trade', 'yield'],
    },
    'gold-aud': {
      plainName: 'Gold in Australian dollars',
      oneLine: 'The world gold price, converted into Australian dollars.',
      ifRising: 'Coins, jewellery and local metal usually cost more in Australia.',
      ifFalling: 'Local buyers usually get the rare discount on the metal.',
      connections: [
        { with: 'gold-usd', text: 'The world price is the main ingredient of the local one.', strength: 'reliable' },
        { with: 'audusd', text: 'A weaker local dollar usually makes gold dearer in Australia.', strength: 'reliable' },
      ],
      australiaAngle: 'For coins, jewellery and metal funds priced in Australia, this is the real price, not the US-dollar one.',
      glossaryTerms: [],
    },
    'iron-ore': {
      plainName: 'Australia’s biggest export',
      oneLine: 'The world price of iron ore, Australia’s single biggest export.',
      ifRising: 'Mining jobs, company profits and government budgets usually fatten.',
      ifFalling: 'Pressure usually builds on mining profits, budgets and the dollar.',
      connections: [
        { with: 'terms-of-trade', text: 'Iron ore is the biggest weight in Australia’s export prices.', strength: 'reliable' },
        { with: 'china-pmi', text: 'Chinese factory strength usually drives this demand.', strength: 'usually' },
        { with: 'audusd', text: 'The dollar often rides on iron-ore fortunes.', strength: 'usually' },
      ],
      australiaAngle: 'Iron ore funds Australian miners, budgets and the broader export-price story, and China’s building cycle dominates its demand.',
      glossaryTerms: [],
    },

    /* ----- Batch 16 — world stock markets: Asia-Pacific (7) ----- */
    n225: {
      plainName: 'Japan’s biggest companies',
      oneLine: 'One number for how Japan’s largest companies are doing.',
      ifRising: 'Big Japanese firms are faring well, often a sign of healthy world trade.',
      ifFalling: 'Japan’s big firms are struggling; a strong yen or weak world demand is often behind it.',
      connections: [
        { with: 'usdjpy', text: 'Japan’s market usually moves with the yen; a cheaper yen helps its exporters.', strength: 'usually' },
        { with: 'r2_carry_trade', text: 'The yen-jump alarm reads this market beside the dollar-yen pair.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },
    asx200: {
      plainName: 'Australia’s biggest companies',
      oneLine: 'One number for how Australia’s largest listed companies are doing.',
      ifRising: 'Australian companies are doing well, often with firm iron-ore and metal prices.',
      ifFalling: 'Australian companies are under pressure, usually from weaker iron-ore prices or soft Chinese demand.',
      connections: [
        { with: 'iron-ore', text: 'The home market follows iron ore closely.', strength: 'usually' },
        { with: 'china-pmi', text: 'Chinese factory strength usually steers Australian company fortunes.', strength: 'usually' },
        { with: 'audusd', text: 'A firm home market and a firm local dollar sometimes move together.', strength: 'sometimes' },
      ],
      glossaryTerms: [],
    },
    kospi: {
      plainName: 'South Korea’s biggest companies',
      oneLine: 'One number for how South Korea’s largest companies are doing.',
      ifRising: 'Korean chipmakers and exporters are doing well, often a sign of strong world electronics demand.',
      ifFalling: 'Korea’s exporters are struggling, usually on weaker demand for phones, cars and chips.',
      connections: [
        { with: 'sp500', text: 'Korea’s market usually follows America’s lead.', strength: 'usually' },
        { with: 'hsi', text: 'The two Asian hubs often share the same regional mood.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    hsi: {
      plainName: 'Hong Kong’s biggest companies',
      oneLine: 'One number for how Hong Kong’s largest companies are doing.',
      ifRising: 'Investors often feel better about Chinese business, and money is flowing into Hong Kong.',
      ifFalling: 'Investors are often worried about China’s economy or politics, and money is leaving Hong Kong.',
      connections: [
        { with: 'ssec', text: 'Both read China’s mood from different doors.', strength: 'usually' },
        { with: 'china-pmi', text: 'China’s factory strength often lifts both doors.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    ssec: {
      plainName: 'China’s mainland market',
      oneLine: 'One number for how companies listed in Shanghai are doing.',
      ifRising: 'China’s home economy and its shoppers often look stronger, lifting demand for oil and metals.',
      ifFalling: 'China’s home market is struggling; its demand for oil, metals and many imports often cools too.',
      connections: [
        { with: 'china-pmi', text: 'Factory strength usually leads the home market’s mood.', strength: 'usually' },
        { with: 'iron-ore', text: 'China buys much of Australia’s iron ore, so this mood reaches Australian exports.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    taiex: {
      plainName: 'Taiwan’s biggest companies',
      oneLine: 'One number for how Taiwan’s largest companies are doing.',
      ifRising: 'The world’s appetite for advanced chips is usually strong, a healthy sign for technology everywhere.',
      ifFalling: 'Chip demand is often cooling, or investors are pricing trouble around Taiwan.',
      connections: [
        { with: 'kospi', text: 'Both ride the world’s chip cycle.', strength: 'reliable' },
        { with: 'ndx', text: 'America’s technology mood usually washes over Taiwan’s.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    nifty50: {
      plainName: 'India’s biggest companies',
      oneLine: 'One number for how India’s largest companies are doing.',
      ifRising: 'Investors usually feel confident about India’s fast-growing economy and are putting money in.',
      ifFalling: 'Foreign money is often leaving India, usually on worries about its growth or world risk appetite.',
      connections: [
        { with: 'hsi', text: 'India and China sometimes compete for the same global investor money.', strength: 'sometimes' },
        { with: 'sp500', text: 'Falls in America often pull money out of emerging markets like India.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },

    /* ----- Batch 17 — world stock markets: Europe + Americas A (8) ----- */
    stoxx50: {
      plainName: 'Europe’s biggest companies',
      oneLine: 'One number for how the euro area’s largest companies are doing.',
      ifRising: 'European business is doing well, often a sign of healthy world trade and steady European demand.',
      ifFalling: 'European business is struggling, often with worry about the euro area’s economy.',
      connections: [
        { with: 'dax', text: 'The German and euro-wide lists usually tell one European story.', strength: 'usually' },
        { with: 'eurusd', text: 'Europe’s health often shows in its money too.', strength: 'usually' },
        { with: 'r6_europe_worry', text: 'The Europe-worry alarm reads this list beside the euro-franc pair.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },
    dax: {
      plainName: 'Germany’s biggest companies',
      oneLine: 'One number for how Germany’s largest companies are doing.',
      ifRising: 'German factories and exporters are usually busy, a good sign for world trade.',
      ifFalling: 'German industry is struggling, often an early sign of slowing world trade.',
      connections: [
        { with: 'oecd-cli-de', text: 'The German leading indicator usually turns with this market.', strength: 'usually' },
        { with: 'stoxx50', text: 'Germany is the euro area’s biggest economy; its list usually leads Europe’s.', strength: 'usually' },
        { with: 'ssec', text: 'China’s demand pulls hard on German exports.', strength: 'usually' },
      ],
      glossaryTerms: ['leading-indicator'],
    },
    cac: {
      plainName: 'France’s biggest companies',
      oneLine: 'One number for how France’s largest companies are doing.',
      ifRising: 'French business is doing well, often with luxury brands, banks and energy firms in demand.',
      ifFalling: 'French business is under pressure, often with soft spending at home or weaker world demand.',
      connections: [
        { with: 'dax', text: 'France and Germany usually tell one European story.', strength: 'usually' },
        { with: 'stoxx50', text: 'France’s list is a big slice of Europe’s widest one.', strength: 'usually' },
        { with: 'eurusd', text: 'France’s list usually moves with the euro too.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    ftse: {
      plainName: 'Britain’s biggest companies',
      oneLine: 'One number for how the biggest London-listed companies are doing.',
      ifRising: 'The global mining, oil and banking giants usually earn well, since most make their money abroad.',
      ifFalling: 'The world-facing giants usually struggle, often with oil and metal prices down too.',
      connections: [
        { with: 'brent', text: 'A big slice of this list sells oil, so Brent often moves it.', strength: 'usually' },
        { with: 'gbpusd', text: 'The pound usually tells a UK story beside this world-facing list.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    sp500: {
      plainName: 'America’s main company list',
      oneLine: 'One number for how the largest US companies are doing.',
      ifRising: 'US business is confident, and world markets usually follow America’s lead higher.',
      ifFalling: 'US companies are under pressure, and markets almost everywhere often follow it down.',
      connections: [
        { with: 'vix', text: 'The market fear gauge usually climbs when this list falls.', strength: 'usually' },
        { with: 'dow', text: 'The two most-quoted US lists usually tell one story; this one is the broader.', strength: 'usually' },
        { with: 'r4_money_hiding', text: 'The money-hiding alarm reads this list beside the dollar and gold.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },
    ndx: {
      plainName: 'America’s technology giants',
      oneLine: 'One number for how big US technology and growth companies are doing.',
      ifRising: 'Investors usually want technology and growth stories, and are comfortable taking risk.',
      ifFalling: 'Investors are often pulling back from technology and pricier growth stories.',
      connections: [
        { with: 'sp500', text: 'This list usually swings harder than the broad one.', strength: 'usually' },
        { with: 'btc-usd', text: 'Falls here often ripple into crypto.', strength: 'usually' },
        { with: 'taiex', text: 'The chip chain links Taiwan’s list to this one.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    dow: {
      plainName: 'America’s headline market number',
      oneLine: 'The most-quoted number for US company shares.',
      ifRising: 'America’s best-known companies are doing well, often lifting the mood of markets that open next.',
      ifFalling: 'America’s best-known companies are falling, often souring the mood of markets that open after New York.',
      connections: [
        { with: 'sp500', text: 'Both tell the US story; the broad list is the better measure.', strength: 'reliable' },
        { with: 'ndx', text: 'The technology list reads the same country, louder.', strength: 'sometimes' },
      ],
      glossaryTerms: [],
    },
    tsx: {
      plainName: 'Canada’s biggest companies',
      oneLine: 'One number for how Canada’s largest companies are doing.',
      ifRising: 'Canadian energy, banking and mining firms usually earn well, often with firm oil and metal prices.',
      ifFalling: 'Canadian firms usually struggle, often with oil and metal prices down too.',
      connections: [
        { with: 'brent', text: 'Canada sells a lot of oil, so Brent often moves this list.', strength: 'usually' },
        { with: 'sp500', text: 'Canada’s market usually follows its giant next-door neighbour.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },

    /* ----- Batch 18 — world stock markets rest + FX pairs (7) ----- */
    ibov: {
      plainName: 'Brazil’s biggest companies',
      oneLine: 'One number for how Brazil’s largest companies are doing.',
      ifRising: 'Investors usually feel fine about riskier emerging markets and raw-material exporters.',
      ifFalling: 'Investors are often fleeing riskier markets, usually with a stronger US dollar nearby.',
      connections: [
        { with: 'dollar-basket', text: 'Emerging-market falls usually go with broad dollar strength.', strength: 'usually' },
        { with: 'brent', text: 'Brazil’s oil and mining giants ride world raw-material prices.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    eurusd: {
      plainName: 'The euro in dollars',
      oneLine: 'How many US dollars one euro buys.',
      ifRising: 'A stronger euro usually makes dollar-priced goods cheaper for people earning euros.',
      ifFalling: 'A weaker euro usually makes imports and travel dearer for people earning euros.',
      connections: [
        { with: 'dollar-basket', text: 'The euro is the biggest single weight in the dollar basket.', strength: 'reliable' },
        { with: 'ecb-dfr', text: 'The European Central Bank steers the euro’s side.', strength: 'usually' },
        { with: 'r7_dollar_or_euro', text: 'The dollar-or-euro pattern explains this pair’s moves.', strength: 'reliable' },
      ],
      glossaryTerms: ['central-bank'],
    },
    gbpusd: {
      plainName: 'The pound in dollars',
      oneLine: 'How many US dollars one British pound buys.',
      ifRising: 'A stronger pound usually makes dollar-priced goods and travel cheaper for Britons.',
      ifFalling: 'A weaker pound usually makes imports and US travel dearer for Britons.',
      connections: [
        { with: 'boe-rate', text: 'The Bank of England steers the pound’s side.', strength: 'usually' },
        { with: 'dollar-basket', text: 'The pound is one thread in the dollar’s overall strength.', strength: 'usually' },
      ],
      glossaryTerms: ['central-bank'],
    },
    usdchf: {
      plainName: 'The dollar versus the franc',
      oneLine: 'How many Swiss francs one US dollar buys.',
      ifRising: 'The dollar usually gains on the franc through broad strength or as world worry fades.',
      ifFalling: 'The franc usually gains on the dollar, often a sign of worry somewhere in the world.',
      connections: [
        { with: 'dollar-basket', text: 'The franc is one thread in the dollar’s overall strength.', strength: 'usually' },
        { with: 'eurchf', text: 'Europe’s worry pair reads this same franc.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },
    eurjpy: {
      plainName: 'The euro versus the yen',
      oneLine: 'How many Japanese yen one euro buys.',
      ifRising: 'A stronger euro against the yen often goes with calm world moods and cheaper Japan trips for Europeans.',
      ifFalling: 'A falling euro against the yen usually means worried investors are rushing back into the yen.',
      connections: [
        { with: 'audjpy', text: 'The Australian-dollar pair reads the same mood; a shared fall is the stronger signal.', strength: 'reliable' },
        { with: 'eurusd', text: 'The euro’s own health shows in both pairs.', strength: 'usually' },
        { with: 'boj-rate', text: 'The Bank of Japan anchors the yen side.', strength: 'usually' },
      ],
      glossaryTerms: ['central-bank'],
    },
    eurchf: {
      plainName: 'The euro versus the franc',
      oneLine: 'How many Swiss francs one euro buys.',
      ifRising: 'The euro gaining on the franc often means worry about Europe is fading.',
      ifFalling: 'The franc usually gains when investors worry about Europe; a fast fall is a classic warning.',
      connections: [
        { with: 'stoxx50', text: 'The Europe-worry alarm reads this pair beside Europe’s main company list.', strength: 'reliable' },
        { with: 'r6_europe_worry', text: 'This pattern card is built around this pair.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },
    audcny: {
      plainName: 'The Australian dollar in yuan',
      oneLine: 'How many Chinese yuan one Australian dollar buys.',
      ifRising: 'The Australian dollar usually gains on the yuan when China’s demand looks healthy.',
      ifFalling: 'The Australian dollar usually sags against the yuan when China’s economy cools.',
      connections: [
        { with: 'iron-ore', text: 'Iron ore is the biggest trade behind the link.', strength: 'usually' },
        { with: 'usdcny', text: 'The yuan against the US dollar is this pair’s other half.', strength: 'reliable' },
        { with: 'r5_china_link', text: 'The China-link pattern watches exactly these two legs.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },

    /* ----- Batch 19 — the 7 FX pattern cards (null directions, D-09) ----- */
    r1_risk_mood: {
      plainName: 'Nervous or relaxed money?',
      oneLine: 'When money is calm, the Australian dollar and US stocks usually move together.',
      ifRising: null,
      ifFalling: null,
      skipReason: 'This card tracks a link between two moving lines, not a level that rises or falls on its own.',
      connections: [
        { with: 'audjpy', text: 'The mood leg: a growth currency priced in yen.', strength: 'reliable' },
        { with: 'sp500', text: 'The mood’s other leg: America’s main company list.', strength: 'reliable' },
        { with: 'eurjpy', text: 'A second yen pair often confirms the same mood.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    r2_carry_trade: {
      plainName: 'The yen jump alarm',
      oneLine: 'A sudden yen surge usually shakes the carry trade and world markets.',
      ifRising: null,
      ifFalling: null,
      skipReason: 'This card tracks a link between two moving lines, not a level that rises or falls on its own.',
      connections: [
        { with: 'usdjpy', text: 'The pair this alarm reads.', strength: 'reliable' },
        { with: 'n225', text: 'The stock leg: Japan’s main company list.', strength: 'reliable' },
        { with: 'us-japan-10y-gap', text: 'The rate gap that keeps this trade alive.', strength: 'reliable' },
      ],
      glossaryTerms: ['carry-trade'],
    },
    r3_dollar_strength: {
      plainName: 'Dollar up, gold down?',
      oneLine: 'The US dollar and gold usually move in opposite directions.',
      ifRising: null,
      ifFalling: null,
      skipReason: 'This card tracks a link between two moving lines, not a level that rises or falls on its own.',
      connections: [
        { with: 'dollar-basket', text: 'The dollar leg: the dollar against six big currencies.', strength: 'reliable' },
        { with: 'gold-usd', text: 'The gold leg: the world price of an ounce.', strength: 'reliable' },
        { with: 'real-yield-10y', text: 'Higher US lending returns often lift the dollar and weigh on gold.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    r4_money_hiding: {
      plainName: 'Where money hides when scared',
      oneLine: 'In a scare money usually runs to the US dollar; if it leaves, gold often shines.',
      ifRising: null,
      ifFalling: null,
      skipReason: 'This card tracks a link between three moving lines, not a level that rises or falls on its own.',
      connections: [
        { with: 'sp500', text: 'The risk leg: America’s main company list.', strength: 'reliable' },
        { with: 'dollar-basket', text: 'The safety leg: the dollar against six currencies.', strength: 'reliable' },
        { with: 'gold-usd', text: 'The second safety leg: the world gold price.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },
    r5_china_link: {
      plainName: 'The China health check',
      oneLine: 'China’s demand usually moves the Australian dollar and the yuan in mirror-image ways.',
      ifRising: null,
      ifFalling: null,
      skipReason: 'This card tracks a link between two moving lines, not a level that rises or falls on its own.',
      connections: [
        { with: 'audusd', text: 'One leg: Australia’s key pair.', strength: 'reliable' },
        { with: 'usdcny', text: 'The other leg: the yuan against the dollar.', strength: 'reliable' },
        { with: 'iron-ore', text: 'The trade behind the link: iron ore, China’s biggest import from Australia.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    r6_europe_worry: {
      plainName: 'Europe’s worry meter',
      oneLine: 'When Europe worries, the euro usually slips against the franc and European companies fall.',
      ifRising: null,
      ifFalling: null,
      skipReason: 'This card tracks a link between two moving lines, not a level that rises or falls on its own.',
      connections: [
        { with: 'eurchf', text: 'The money leg: the euro against Switzerland’s franc.', strength: 'reliable' },
        { with: 'stoxx50', text: 'The company leg: Europe’s main company list.', strength: 'reliable' },
        { with: 'ecb-dfr', text: 'The European Central Bank’s rate often steers Europe’s mood.', strength: 'usually' },
      ],
      glossaryTerms: ['central-bank'],
    },
    r7_dollar_or_euro: {
      plainName: 'Whose story is this?',
      oneLine: 'Tells whether euro-versus-dollar moves are a dollar story or a euro story.',
      ifRising: null,
      ifFalling: null,
      skipReason: 'This card separates two possible causes behind one move, not a level that rises or falls on its own.',
      connections: [
        { with: 'eurusd', text: 'The pair being explained.', strength: 'reliable' },
        { with: 'dollar-basket', text: 'The yardstick that separates the two stories.', strength: 'reliable' },
        { with: 'stoxx50', text: 'A weak-euro story often shows here too.', strength: 'sometimes' },
      ],
      glossaryTerms: [],
    },
    // gap-closure S2-M2.4 — the weekly custody card that closes the
    // "Who holds US government debt" section (FRED WSEFINTL1).
    'nyfed-custody': {
      plainName: 'Foreign official holdings, New York Fed',
      oneLine: 'The US government debt that foreign central banks and governments keep at the New York Fed.',
      ifRising: 'Foreign central banks and governments are usually adding to their US Treasury holdings.',
      ifFalling: 'Foreign central banks and governments are usually reducing them.',
      connections: [],
      glossaryTerms: ['treasury-securities', 'foreign-official-holdings', 'central-bank'],
    },
    // gap-closure S3-M3.2 — the US liquidity and funding family (six
    // context cards in the market-stress lane).
    'term-premium-10y': {
      plainName: 'US 10-year term premium',
      oneLine: 'The extra yield investors demand for lending to the US for ten years.',
      ifRising: 'Investors are demanding more to commit money long-term.',
      ifFalling: 'Long-term lending is being priced closer to the path of short rates.',
      connections: [
        { with: 'us10y', text: 'The 10-year yield splits into the policy outlook plus this premium.', strength: 'reliable' },
        { with: 'real-yield-10y', text: 'Both are ways the long end prices risk and inflation.', strength: 'sometimes' },
      ],
      // gap-closure S3-M3.6 (2026-11-01): the spec's RULES §7 Australia-first
      // note — a tendency, never a forecast.
      australiaAngle:
        'A rising US term premium tends to lift long-term yields worldwide, and Australian long-term rates usually feel that pull.',
      glossaryTerms: ['term-premium', 'yield', 'inflation', 'treasury-securities'],
    },
    tga: {
      plainName: 'US Treasury General Account',
      oneLine: 'The US government’s own bank balance at the Federal Reserve.',
      ifRising: 'Bond sales and taxes are pulling cash into the government’s till.',
      ifFalling: 'Government spending is pushing cash back into the system.',
      connections: [
        { with: 'net-liquidity', text: 'The account is subtracted there: that cash is not in the system.', strength: 'reliable' },
        { with: 'walcl', text: 'The Fed’s balance sheet funds it on the other side of the ledger.', strength: 'sometimes' },
      ],
      glossaryTerms: ['treasury-general-account', 'bond'],
    },
    'reverse-repo': {
      plainName: 'Fed overnight reverse repo',
      oneLine: 'Cash parked at the Federal Reserve overnight instead of reaching private markets.',
      ifRising: 'More money is choosing the Fed’s floor over lending anywhere else.',
      ifFalling: 'That cash is moving back into markets and bills.',
      connections: [
        { with: 'net-liquidity', text: 'The pile is subtracted there: parked cash is not available cash.', strength: 'reliable' },
        { with: 'bank-reserves', text: 'The two sides of the system’s spare cash.', strength: 'usually' },
      ],
      glossaryTerms: ['reverse-repo'],
    },
    'bank-reserves': {
      plainName: 'US bank reserves',
      oneLine: 'The deposits banks keep at the Federal Reserve: the system’s liquidity buffer.',
      ifRising: 'The buffer behind the banking system is filling.',
      ifFalling: 'The buffer is thinning, the setting where funding pressure tends to appear.',
      connections: [
        { with: 'repo-stress', text: 'Pressure there with falling reserves is the classic squeeze pattern.', strength: 'reliable' },
        { with: 'walcl', text: 'Reserves are a liability the balance sheet creates.', strength: 'reliable' },
      ],
      glossaryTerms: ['bank-reserves', 'central-bank', 'liquidity'],
    },
    'repo-stress': {
      plainName: 'Repo funding pressure',
      oneLine: 'How much more overnight money costs than what the Fed pays banks: the plumbing’s stress gauge.',
      ifRising: 'Borrowers are paying up for overnight cash.',
      ifFalling: 'Cash is easy, trading at or below the Fed’s own rate.',
      connections: [
        { with: 'sofr', text: 'The card’s own upper leg.', strength: 'reliable' },
        { with: 'bank-reserves', text: 'A thinning reserve buffer is what usually drives the gap up.', strength: 'reliable' },
      ],
      glossaryTerms: [],
    },
    'net-liquidity': {
      plainName: 'US net liquidity',
      oneLine: 'The money actually available to markets after subtracting the Treasury account and reverse repos.',
      ifRising: 'The pool supporting trading and lending is growing.',
      ifFalling: 'The pool is being drained.',
      connections: [
        { with: 'walcl', text: 'The headline the net measure starts from.', strength: 'reliable' },
        { with: 'tga', text: 'One of the two drains subtracted.', strength: 'reliable' },
        { with: 'reverse-repo', text: 'The other drain subtracted.', strength: 'reliable' },
      ],
      // gap-closure S3-M3.6 (2026-11-01): the spec's RULES §7 Australia-first
      // note — a tendency, never a forecast.
      australiaAngle:
        'When US net liquidity drains, dollar funding tightens globally, and Australian banks usually pay more for offshore US-dollar funding.',
      glossaryTerms: ['net-liquidity', 'liquidity'],
    },
    /* gap-closure S3-M3.3 (2026-11-01): the credit pair’s layer-1 rows. */
    'ebp': {
      plainName: 'Excess bond premium',
      oneLine: 'How much extra investors demand to lend to risky companies, beyond covering the losses they expect.',
      ifRising: 'Lenders are charging more for risk appetite itself, not just for expected defaults.',
      ifFalling: 'Credit is priced closer to expected losses alone: the pure risk-appetite charge is coming down.',
      connections: [
        { with: 'ofr-fsi', text: 'A rising premium feeds the same strain the stress index folds together.', strength: 'sometimes' },
        { with: 'term-premium-10y', text: 'One is the extra charge for lending long to the government; this one for lending to companies.', strength: 'sometimes' },
      ],
      glossaryTerms: ['excess-bond-premium', 'bond'],
    },
    'ofr-fsi': {
      plainName: 'OFR Financial Stress Index',
      oneLine: 'The Treasury’s own daily score of how strained money markets are (zero = its long-run average).',
      ifRising: 'Strains in credit, funding or volatility are building together.',
      ifFalling: 'The system is calmer than its long-run average.',
      connections: [
        { with: 'stress-stlfsi', text: 'The St Louis twin: same question, different builder.', strength: 'usually' },
        { with: 'repo-stress', text: 'Funding pressure is one of the channels this index folds in.', strength: 'sometimes' },
      ],
      glossaryTerms: ['financial-stress-index', 'liquidity', 'volatility'],
    },
    /* gap-closure S3-M3.4 (2026-11-01): the growth-nowcast and survey
     * family’s layer-1 rows (six context cards: gdpnow, empire-state,
     * continuing-claims in growth-health; median-cpi + sticky-cpi in
     * prices-heat; sloos-ci-tightening in market-stress). */
    gdpnow: {
      plainName: 'US growth nowcast',
      oneLine: 'The Atlanta Fed’s running estimate of this quarter’s US growth.',
      ifRising: 'This quarter is tracking stronger as the data lands.',
      ifFalling: 'This quarter is tracking weaker as the data lands.',
      connections: [
        { with: 'us-gdp-growth', text: 'The official print for the quarter before; this nowcast runs the current one.', strength: 'reliable' },
        { with: 'retail-sales', text: 'Consumer spending is the biggest input the model aggregates.', strength: 'usually' },
      ],
      glossaryTerms: ['nowcast'],
    },
    'empire-state': {
      plainName: 'New York factory survey',
      oneLine: 'A monthly survey of New York manufacturers: above zero means growth.',
      ifRising: 'More New York manufacturers are reporting growth than decline.',
      ifFalling: 'More New York manufacturers are reporting decline than growth.',
      connections: [
        { with: 'philly-fed', text: 'The same question asked of Philadelphia factories.', strength: 'reliable' },
        { with: 'us-gdp-growth', text: 'Factory surveys often turn before the headline growth number.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'continuing-claims': {
      plainName: 'Americans on benefits',
      oneLine: 'The number of people already receiving unemployment benefits each week.',
      ifRising: 'Fewer people are ending up off the rolls: job-finding is slowing.',
      ifFalling: 'People are leaving the rolls faster: job-finding is picking up.',
      connections: [
        { with: 'initial-jobless-claims', text: 'One counts new filings; this counts everyone still claiming.', strength: 'reliable' },
        { with: 'us-unemployment', text: 'The monthly rate the weekly rolls feed into.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    'median-cpi': {
      plainName: 'US median inflation',
      oneLine: 'US inflation measured by the middle price change, ignoring the wildest moves.',
      ifRising: 'The steady middle of price changes is moving up.',
      ifFalling: 'The steady middle of price changes is coming down.',
      connections: [
        { with: 'us-cpi-yoy', text: 'The headline measure this middle read sits beside.', strength: 'reliable' },
        { with: 'sticky-cpi', text: 'Both strip noise from the monthly print, each a different way.', strength: 'usually' },
      ],
      glossaryTerms: ['inflation', 'trimmed-mean'],
    },
    'sticky-cpi': {
      plainName: 'US sticky-price inflation',
      oneLine: 'US inflation in the goods and services that rarely change price.',
      ifRising: 'Even rarely-changing prices are rising faster: underlying pressure is building.',
      ifFalling: 'Even rarely-changing prices are cooling: underlying pressure is coming down.',
      connections: [
        { with: 'median-cpi', text: 'The other quiet-inflation read, built the opposite way.', strength: 'usually' },
        { with: 'us-cpi-yoy', text: 'The headline print the sticky basket reads beside.', strength: 'reliable' },
      ],
      glossaryTerms: ['inflation'],
    },
    'sloos-ci-tightening': {
      plainName: 'Bank lending standards',
      oneLine: 'The net share of US banks making business loans harder to get.',
      ifRising: 'More banks are making business loans harder to obtain.',
      ifFalling: 'Fewer banks are making business loans hard to obtain.',
      connections: [
        { with: 'ebp', text: 'One is the price of lending to companies; this is the gate.', strength: 'sometimes' },
        { with: 'us-gdp-growth', text: 'A rising share here has usually lined up with weaker growth.', strength: 'usually' },
      ],
      glossaryTerms: [],
    },
    /* gap-closure S3-M3.5 (2026-11-01): the fiscal and Treasury-supply
     * family's layer-1 rows (four cards + two companion-only ids in the
     * borrowing-costs lane). */
    'us-deficit-12m': {
      plainName: 'The 12-month US deficit',
      oneLine: 'How much the US government borrowed over the last twelve months.',
      ifRising: 'The government is borrowing more, adding to the supply of bonds the market has to absorb.',
      ifFalling: 'The government is borrowing less, and the flow of new bonds is coming down.',
      connections: [
        { with: 'govt-interest-revenue', text: 'One is the borrowing flow; that one the interest bill it grows.', strength: 'reliable' },
        { with: 'us10y', text: 'More bonds to place is one of the pressures yields answer to.', strength: 'sometimes' },
      ],
      glossaryTerms: ['bond', 'yield'],
    },
    'us-deficit-monthly': {
      plainName: 'The month’s deficit',
      oneLine: 'What the US government borrowed or repaid in the latest month alone.',
      ifRising: 'The month’s borrowing gap is widening.',
      ifFalling: 'The month’s borrowing gap is narrowing.',
      connections: [],
      glossaryTerms: [],
    },
    'treasury-auction-10y': {
      plainName: '10-year auction demand',
      oneLine: 'How many dollars chased each dollar of 10-year bonds at the latest auction.',
      ifRising: 'Buyers bid more for each dollar of 10-year bonds: stronger demand.',
      ifFalling: 'Buyers bid less for each dollar of 10-year bonds: thinner demand.',
      connections: [
        { with: 'treasury-auction-30y', text: 'The same question for the long bond.', strength: 'reliable' },
        { with: 'us-deficit-12m', text: 'The supply the auctions answer for.', strength: 'usually' },
      ],
      glossaryTerms: ['bid-to-cover', 'bond'],
    },
    'treasury-auction-10y-indirect': {
      plainName: '10-year foreign share',
      oneLine: 'The share of the latest 10-year auction taken by indirect bidders.',
      ifRising: 'Indirect bidders took a bigger share of the 10-year auction.',
      ifFalling: 'Indirect bidders took a smaller share of the 10-year auction.',
      connections: [],
      glossaryTerms: [],
    },
    'treasury-auction-30y': {
      plainName: '30-year auction demand',
      oneLine: 'How many dollars chased each dollar of 30-year bonds at the latest auction.',
      ifRising: 'Buyers bid more for each dollar of long bonds: stronger demand.',
      ifFalling: 'Buyers bid less for each dollar of long bonds: thinner demand.',
      connections: [
        { with: 'treasury-auction-10y', text: 'The same question for the 10-year note.', strength: 'reliable' },
        { with: 'us30y', text: 'The yield the auctions clear against.', strength: 'usually' },
      ],
      glossaryTerms: ['bid-to-cover', 'bond', 'yield'],
    },
    'treasury-auction-30y-indirect': {
      plainName: '30-year foreign share',
      oneLine: 'The share of the latest 30-year auction taken by indirect bidders.',
      ifRising: 'Indirect bidders took a bigger share of the 30-year auction.',
      ifFalling: 'Indirect bidders took a smaller share of the 30-year auction.',
      connections: [],
      glossaryTerms: [],
    },
  } satisfies Record<string, Layer1Entry>,
};

const INDICATORS: Record<IndicatorId, IndicatorCopyEntry> = {
  'yield-curve-10y3m': {
    // 2026-10-26 gap-audit build, A-1 (INSIGHTS_DATA_SPEC.md): the 3-month
    // leg of the curve — the one the Fed itself watches.
    name: 'The gap between 10-year and 3-month US borrowing',
    ticker: '10Y−3M',
    oneLiner:
      'The gap between 10-year and 3-month US rates: the Federal Reserve’s own preferred recession gauge.',
    lines: {
      highRising: 'The gap is wide and widening: a steep curve usually comes with growth or inflation pressure.',
      highEasing: 'The gap is wide but narrowing: still the shape of normal, healthy conditions.',
      typical: 'The gap sits in its usual range for the decade: no unusual signal either way.',
      low: 'Short-term rates are above long-term ones — the “inverted” shape that has preceded every modern US recession.',
    },
    whatItIs:
      'The 10-year minus 3-month Treasury yield difference from FRED (T10Y3M): the shape of the US yield curve the Federal Reserve itself watches most closely.',
    whyItMatters:
      'When short-term rates top long-term rates, banks earn less on lending and the US economy has usually slowed within 6 to 24 months — a cue to be careful with big purchases and new debts.',
    tendedToMean:
      'Deep inversions of this leg preceded every modern US recession, usually by 6 to 24 months; the historic end-of-cycle steepening can arrive fast.',
    cantTell:
      'It says nothing about timing or size, and a few false alarms exist — it is a warning light, not a calendar.',
    forYou:
      'Read it beside its 10-year-minus-2-year sibling and the recession-probability card: two curve legs and one model telling the same story from different angles.',
  },
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
  // ---- M4 Wave 1 (OD-8/D-42, 2026-10-24) — the funding leg + the 2y display ----
  sofr: {
    name: 'The overnight funding rate',
    ticker: 'SOFR',
    oneLiner:
      'The actual overnight rate banks pay to borrow cash in the US: the rate the Federal Reserve’s setting is meant to deliver.',
    lines: {
      highRising: 'The overnight rate is high for its decade and rising: the setting that raises every floating-rate leg down the chain.',
      highEasing: 'The overnight rate is high for its decade but easing.',
      typical: 'The overnight funding rate sits in its usual range for the decade.',
      low: 'The overnight rate is low for its decade: cheap overnight money, the easy-policy setting.',
    },
    whatItIs:
      'The Secured Overnight Financing Rate (FRED’s SOFR): the cost of overnight borrowing against US Treasury collateral — the base rate that replaced LIBOR for trillions in loans and derivatives.',
    whyItMatters:
      'It completes the chain from the policy rate to the rates households and firms actually pay: when SOFR tracks the Fed’s target range, transmission works; when it jumps above it, funding markets are strained.',
    tendedToMean:
      'SOFR normally sits a hair under the top of the Fed’s target range. Spikes above it — September 2019 being the modern case — mark funding squeezes the Fed answers with market operations.',
    cantTell:
      'One overnight rate says little about next month: it is the plumbing check, not a forecast.',
    forYou:
      'When this rate sits inside the Fed’s target corridor, the policy you hear about in the news is the policy being delivered.',
  },
  'us-2y': {
    name: 'What the US pays to borrow for 2 years',
    ticker: '2-year',
    oneLiner:
      'The 2-year Treasury yield: the market’s live read on where the Federal Reserve’s policy rate is heading.',
    lines: {
      highRising: 'The 2-year yield is high for its decade and rising: markets price the Fed staying restrictive for longer.',
      highEasing: 'The 2-year yield is high for its decade but easing.',
      typical: 'The 2-year yield sits in its usual range for the decade.',
      low: 'The 2-year yield is low for its decade: markets price easier policy ahead.',
    },
    whatItIs:
      'The market yield on 2-year US Treasury notes, daily from FRED (DGS2) — the same series the Fed-expectations card derives its gap from.',
    whyItMatters:
      'Of all Treasury yields, the 2-year moves most with rate expectations; the 10-year-minus-2-year curve card reads best with this leg visible beside it.',
    tendedToMean:
      'A 2-year yield sitting far above the policy rate has marked markets pricing hikes; sitting well below, pricing cuts.',
    cantTell:
      'It prices the average expected policy path, not a promise — and it carries a small term premium on top.',
    forYou:
      'The number to glance at before asking whether markets are leaning toward rate cuts.',
  },
  // ---- M5 Wave 2 (OD-8/D-42, 2026-10-24): the euro long end + household costs + the EM pair ----
  'euro-aaa-10y': {
    name: 'What the safest euro-area governments pay for 10 years',
    ticker: '10-year',
    oneLiner:
      'The 10-year borrowing cost of the euro area’s AAA-rated governments: the eurozone’s safe-asset rate, daily.',
    lines: {
      highRising: 'The euro area’s safe long-term rate is high for its decade and rising: the setting that tightens borrowing across Europe.',
      highEasing: 'The euro area’s safe long-term rate is high for its decade but easing.',
      typical: 'The euro-area safe 10-year rate sits in its usual range for the decade.',
      low: 'The euro area’s safe long-term rate is low for its decade: the cheap-money setting European borrowers remember.',
    },
    whatItIs:
      'The AAA-rated euro-area 10-year yield from the ECB’s own yield curve (daily). Unlike the monthly Bund mirror on this page, it moves every trading day and covers the whole euro area’s safest borrowers, not only Germany.',
    whyItMatters:
      'This is the eurozone’s risk-free long rate — the floor under every European mortgage, corporate loan and government bond yield, and the ECB’s transmission check beside its policy rate.',
    tendedToMean:
      'Sustained rises in this rate have lifted European mortgage and corporate borrowing costs; falls have eased them, as in the US 30-year story.',
    cantTell:
      'It is a market price, not a policy setting, and AAA borrowing is not every government’s borrowing — stressed euro states pay more.',
    forYou:
      'The daily euro-side counterpart to the US 10-year card: what “risk-free” money costs across the euro area right now.',
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
  // ---- M4 Wave 1 (OD-8/D-42, 2026-10-24) — the early-warning pack ----
  'us-pce-core-yoy': {
    name: 'The Fed’s preferred inflation gauge',
    ticker: 'Core PCE',
    oneLiner:
      'US prices excluding food and energy, measured the way the Federal Reserve actually targets it — its stated goal is 2%.',
    lines: {
      highRising: 'Core PCE is above the Fed’s 2% goal and rising: the setting that keeps rate-cut talk waiting.',
      highEasing: 'Core PCE sits above the 2% goal but is easing toward it.',
      typical: 'Core PCE sits near the Fed’s 2% goal: the setting in which past easing cycles began.',
      low: 'Core PCE is below the 2% goal: unusually soft inflation by the Fed’s own yardstick.',
    },
    whatItIs:
      'The 12-month change in the core personal consumption expenditures price index (FRED’s PCEPILFE): excludes food and energy, and is the measure the Fed’s 2% inflation target is defined on.',
    whyItMatters:
      'The Fed’s reaction function runs on this number: how far it sits from 2% is the cleanest guide to how long policy stays restrictive.',
    tendedToMean:
      'Sustained runs above 2% marked the 2021–23 overshoot; the Fed has historically not declared victory until this measure is back near goal.',
    cantTell:
      'It publishes about a month after the month it describes, and revises: one print is not a trend.',
    forYou:
      'When this number closes in on 2%, rate-cut odds improve; far above it, expect the Fed to stay tough.',
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
  'breakeven-10y': {
    name: 'Expected US inflation, ten years ahead',
    ticker: '10y breakeven',
    oneLiner:
      'The yearly inflation rate markets expect, on average, over the next ten years.',
    lines: {
      highRising: 'Ten-year inflation expectations are rising above their norm: the pricing that pushes long rates up.',
      highEasing: 'Ten-year expectations sit above their norm but are easing.',
      typical: 'Ten-year inflation expectations sit near their usual level.',
      low: 'Markets price weak inflation a decade ahead: the deflation-fear setting that invites easy policy.',
    },
    whatItIs:
      'The 10-year breakeven inflation rate (FRED’s T10YIE): the gap between ordinary and inflation-protected 10-year Treasury yields — what the bond market prices as average inflation over the decade.',
    whyItMatters:
      'The near leg of the anchoring story beside the 5y5y card: together they show whether expected inflation stays pinned while the Fed fights.',
    tendedToMean:
      'Sustained moves above roughly 2.5% have historically unsettled central banks; slides toward 1% signal feared deflation.',
    cantTell:
      'It is derived from market prices, which move on liquidity and hedging as well as genuine belief.',
    forYou:
      'A gauge of long-run inflation trust: the number bond markets actually price every day.',
  },
  // Session 3 (GOLD_FRED_GAPFILL_SPEC G2, 2026-10-31): the interplay card —
  // the 5y5y forward minus the 5y spot. Context beside the family's other
  // two cards; the gold panel's inflation lane carries its phrase.
  'breakeven-tilt': {
    name: 'The market’s inflation tilt',
    ticker: '5y5y − 5y',
    oneLiner:
      'Whether markets price inflation building or fading between the near five years and the far five years.',
    lines: {
      highRising: 'Markets lean toward inflation building into the far window, and the tilt is widening.',
      highEasing: 'The tilt still prices more inflation in the far window, but the gap is closing.',
      typical: 'The tilt between near and far inflation pricing sits near zero: no priced acceleration either way.',
      low: 'Markets lean toward inflation fading after the near window: today’s pressure priced as temporary.',
    },
    whatItIs:
      'The 5y5y forward breakeven minus the 5-year spot breakeven (FRED’s T5YIFR − T5YIE, both already collected): positive means the market prices more inflation in years five to ten than in years one to five.',
    whyItMatters:
      'The inflation lane’s scored card reads one point of a three-point family; the tilt shows whether the market expects the pressure to build or fade further out — the interplay the lane’s word alone cannot say.',
    tendedToMean:
      'A widening tilt has often accompanied reflation narratives; a deeply negative tilt reads as the market pricing today’s pressure as temporary.',
    cantTell:
      'It is a small difference of two market prices: liquidity and hedging can move it without any real change in belief.',
    forYou:
      'Context for the gold panel’s inflation lane: building expectations tend to feed hedge demand; fading ones tend to remove it.',
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
  'us-japan-10y-gap': {
    // 2026-10-26 gap-audit build, A-3 (INSIGHTS_DATA_SPEC.md): the carry
    // trade's fuel line, derived at the 04:20 rung from DGS10 + the MOF 10Y.
    name: 'The gap between US and Japanese 10-year rates',
    ticker: '10Y gap',
    oneLiner:
      'How much more the US pays to borrow for ten years than Japan: the reward that keeps the yen carry trade alive.',
    lines: {
      highRising: 'The gap is wide and widening: the carry trade pays well — a setting that usually comes with calm markets.',
      highEasing: 'The gap remains wide but is narrowing: the carry trade’s reward is shrinking.',
      typical: 'The gap sits in its usual range for the decade.',
      low: 'The gap has narrowed toward the funding-cost line: the zone where carry unwinds have historically accelerated.',
    },
    whatItIs:
      'The US 10-year Treasury yield minus Japan’s 10-year government bond yield (4.96 − 2.914 ≈ 2.05 today): computed from the two published series on their common dates.',
    whyItMatters:
      'The interest gap between the US and Japan powers the yen carry trade — when it narrows, borrowed yen can rush home fast and world markets wobble.',
    tendedToMean:
      'The August-2024 carry unwind came after years of a wide gap; narrow gaps have historically coincided with JPY-short squeezes.',
    cantTell:
      'The gap explains the trade’s reward, not its crowding: positioning can unwind even while the gap stays wide.',
    forYou:
      'Read it beside the USD/JPY card: the pair is the trade, the gap is its fuel line.',
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
  // ---- M5 Wave 2 (2026-10-24): the EM-pressure first member ----
  usdtry: {
    name: 'Dollar vs Turkish lira',
    ticker: 'USD/TRY',
    oneLiner:
      'How many Turkish liras one US dollar buys: the live case study of high inflation meeting a sliding currency.',
    lines: {
      highRising: 'The dollar fetches more lira than usual and the move continues: the inflation-and-devaluation dynamic in action.',
      highEasing: 'The lira remains weak for its decade but the slide is easing.',
      typical: 'The dollar–lira rate sits in its usual range for the decade.',
      low: 'The lira is stronger than its decade norm: a rare stretch of lira stability.',
    },
    whatItIs:
      'The USD→TRY reference rate (ECB rates via Frankfurter, daily): how many liras one dollar buys in the foreign-exchange market.',
    whyItMatters:
      'Turkey is the canonical modern case of persistent high inflation: watching its currency is watching inflation become devaluation in real time — a live illustration of what the inflation cards warn about.',
    tendedToMean:
      'The lira has lost most of its dollar value over the past decade through repeated inflation episodes; every step down made imported goods dearer in lira terms.',
    cantTell:
      'One pair, one country: it says nothing about other emerging-market currencies, and managed exchange rates can keep levels that fundamentals question.',
    forYou:
      'A standing illustration of why the inflation cards on this page matter: high inflation, over years, ends up written in the exchange rate.',
  },
  // ---- 2026-10-29 owner round ("add dollar against UAE currency") ----
  usdaed: {
    name: 'Dollar vs UAE dirham',
    ticker: 'USD/AED',
    oneLiner:
      'How many UAE dirhams one US dollar buys: a petro-currency pegged to the dollar, so one of the calmest pairs in world finance.',
    lines: {
      highRising: 'The pair sits at the top of its famously tight band: a rare nudge in the peg.',
      highEasing: 'The dirham remains near the top of its band but the pressure is easing.',
      typical: 'The peg holds: the pair sits in its usual narrow range (around 3.67 dirhams per dollar).',
      low: 'The dirham reads stronger than its usual peg level: an exceptional print.',
    },
    whatItIs:
      'The USD/AED exchange rate (Yahoo Finance daily closes): how many UAE dirhams one dollar buys in the foreign-exchange market.',
    whyItMatters:
      'The UAE pegs the dirham to the dollar, which makes this pair the Gulf\u2019s financial anchor: it barely moves by design, and that is exactly why a meaningful break would be historic news for Gulf trade, remittances and oil pricing.',
    tendedToMean:
      'The dirham has held its dollar peg through oil booms and busts for decades; the pair\u2019s ten-year range is one of the narrowest in world finance.',
    cantTell:
      'A pegged pair carries no market judgement: the central bank sets the level, so the usual trend-reading does not apply.',
    forYou:
      'Anyone who earns dirhams but spends in another currency effectively rides the dollar; the peg makes this the quietest number on the page.',
  },
  // ---- M6 Wave 3 (2026-10-25): the leading-edge batch (recovered from the deployed bundle) ----
  'mortgage-30y': {
    name: 'The US 30-year home-loan rate',
    ticker: '30-year fixed',
    oneLiner:
      'The average rate on a new 30-year fixed US mortgage: the borrowing cost that reaches straight into the household budget.',
    lines: {
      highRising:
        'US mortgage rates are high for their decade and rising: each step prices more buyers out of the market.',
      highEasing:
        'US mortgage rates are high for their decade but easing: the first relief for housing demand.',
      typical: 'The 30-year mortgage rate sits in its usual range for the decade.',
      low:
        'Mortgage rates are low for their decade: the cheap-money setting that reignited US housing booms.',
    },
    whatItIs:
      'Freddie Mac’s weekly survey of the average 30-year fixed-rate mortgage (via FRED, published Thursdays): the reference rate quoted across the US housing market.',
    whyItMatters:
      'This is where monetary policy becomes a household bill: the policy rate moves the long end, the long end moves the mortgage, and the mortgage decides what a family can borrow. It is the transmission chain’s last stop before the real economy.',
    tendedToMean:
      'Each percentage point on this rate cuts roughly ten percent from what a buyer can borrow; the 2021-23 climb from under 3% to near 8% halved US affordability and froze existing owners in place.',
    cantTell:
      'It is a survey average of new loans only: actual offers vary by credit and region, and existing fixed loans from cheaper years are untouched by it.',
    forYou:
      'The US twin of the Australian home-loan card: together they show the two audiences’ single biggest borrowing cost moving with the same global long end.',
  },
  walcl: {
    name: 'The Fed’s balance sheet',
    ticker: 'Fed assets',
    oneLiner:
      'The total size of the Federal Reserve’s balance sheet: the money the central bank created for bond purchases, and is now letting run off.',
    lines: {
      highRising:
        'The Fed’s balance sheet is expanding again: the emergency setting that floods the system with liquidity.',
      highEasing:
        'The balance sheet remains large but is shrinking: quantitative tightening, draining liquidity at a steady pace.',
      typical: 'The balance sheet sits in its usual range for the decade.',
      low:
        'The balance sheet has fallen back toward its pre-pandemic trend: the tightening cycle largely done.',
    },
    whatItIs:
      'Total assets on the Federal Reserve’s balance sheet (the H.41 weekly report via FRED): the cumulative result of every bond the Fed has bought and holds.',
    whyItMatters:
      'This is the liquidity side of money: the Fed sets the price of money with its policy rate, and the quantity with this balance sheet. The 2020-26 round of creation and then run-off drove asset prices, bank reserves and the plumbing beneath markets.',
    tendedToMean:
      'QE rounds lifted the balance sheet in steps from under $1tn to nearly $9tn; the tightening since 2022 has been the largest run-off in the Fed’s history, watched for the liquidity squeezes it can create.',
    cantTell:
      'Size alone says little about stance: a growing balance sheet can mean crisis response or routine operations, and the composition of what is held matters as much as the total.',
    forYou:
      'Read it beside m2-us: one is the central bank’s own creation of money, the other the banking system’s. Together they frame the money story the rates cards tell the price of.',
  },
  'nyfed-custody': {
    name: 'Foreign official holdings at the New York Fed (weekly)',
    ticker: 'NY Fed custody',
    oneLiner:
      'The Treasuries foreign central banks and governments keep at the New York Fed: the weekly pulse of foreign official ownership of US government debt.',
    lines: {
      highRising:
        'Foreign official custody holdings are high for their decade and rising: foreign central banks and governments adding to their US Treasury holdings.',
      highEasing:
        'Custody holdings remain high for the decade but are easing lower.',
      typical: 'Custody holdings sit in their usual range for the decade.',
      low:
        'Custody holdings have fallen toward the low end of their decade range.',
    },
    whatItIs:
      'Securities held in custody at the Federal Reserve Bank of New York for foreign official accounts (the H.4.1 memorandum item via FRED): Treasury securities kept at the Fed on behalf of foreign central banks and governments. Weekly, Wednesday level.',
    whyItMatters:
      'This is the part of foreign holdings of US government debt that foreign central banks and governments keep at the New York Fed itself. It moves weekly, well before the monthly country table publishes, so it is the freshest reading of foreign official demand for US Treasuries.',
    tendedToMean:
      'The series climbed with foreign reserve growth for two decades and has stepped lower in the 2022-24 tightening round.',
    cantTell:
      'The custody total has no country split: it cannot say which countries are building or drawing down their positions (the monthly Treasury TIC table carries that, with its own six-to-seven-week lag), and some official holders keep securities somewhere other than the Fed.',
    forYou:
      'Read it beside the country table in the Who holds US government debt section above: the weekly custody level is the same story told with a shorter delay and no country detail.',
  },
  // gap-closure S3-M3.2 (2026-11-01): the US liquidity and funding family —
  // six context cards in the market-stress lane (FRED THREEFYTP10, WTREGEN,
  // RRPONTSYD, WRESBAL + the derived SOFR−IORB and WALCL−TGA−RRP).
  'term-premium-10y': {
    name: 'US 10-year term premium',
    ticker: 'Term premium',
    oneLiner:
      'The extra yield investors demand for holding 10-year US bonds instead of rolling short-term ones: the price of lending long.',
    lines: {
      highRising:
        'The term premium is high for its decade and rising: investors demanding ever more to lend long, a setting that pressures bonds and risky assets together.',
      highEasing:
        'The term premium remains high for the decade but is easing.',
      typical: 'The term premium sits in its usual range for the decade.',
      low:
        'The term premium is unusually low: long-term lending is priced close to the path of short rates.',
    },
    whatItIs:
      'The Kim-Wright 10-year Treasury term premium (the Federal Reserve Board’s own model, via FRED): the part of the 10-year yield left over after subtracting the average short rate the market expects over the bond’s life.',
    whyItMatters:
      'The 10-year yield is two stories in one number: what the market expects the Fed to do, and how much extra it demands for committing a decade. The second part, this premium, is what tends to move when investors worry about inflation, supply or holding risk.',
    tendedToMean:
      'The premium spent the 2010s near or below zero (the era of trusted low inflation and heavy central-bank bond purchases) and has been rebuilt since 2021, returning toward the positive territory that was normal before the financial crisis.',
    cantTell:
      'It is a model estimate, not a market price you can see on a screen, and it says nothing about the next move in yields: a high premium can rise further and a low one can vanish.',
    forYou:
      'Read it beside the 10-year yield card: when the yield rises while this premium stays quiet, the move is mostly about expected policy; when the premium itself rises, the market is charging more for the long end itself.',
  },
  tga: {
    name: 'US Treasury General Account',
    ticker: 'TGA',
    oneLiner:
      'The US government’s checking account at the Federal Reserve: the balance its spending draws down and its taxes and bond sales rebuild.',
    lines: {
      highRising:
        'The Treasury account is high for its decade and rebuilding: bond sales pulling cash out of the system and into the government’s till.',
      highEasing:
        'The Treasury account remains elevated but is being drawn down.',
      typical: 'The Treasury account sits in its usual range for the decade.',
      low:
        'The Treasury account is unusually low: the government spending down its balance, which adds cash back to the system.',
    },
    whatItIs:
      'The Treasury General Account at the Federal Reserve (the H.4.1 weekly report via FRED): the US government’s own balance at the central bank, held in millions of dollars at each Wednesday.',
    whyItMatters:
      'Every dollar the Treasury holds at the Fed is a dollar outside the banking system. A rebuilding account drains reserves; a drawdown pushes cash back out. Big swings in this balance can move market liquidity as much as a central-bank decision.',
    tendedToMean:
      'The balance hovered near tens of billions for years, then swung violently around the 2023 debt-ceiling standoff, and has since been held far larger, in the hundreds of billions.',
    cantTell:
      'The level alone says nothing about direction of policy: a big balance can sit idle while a small one is about to be rebuilt with a bond-sale wave.',
    forYou:
      'Read it with the reserves card and the net-liquidity card: the three together show how much money the system actually holds.',
  },
  'reverse-repo': {
    name: 'Fed overnight reverse repo (RRP)',
    ticker: 'RRP',
    oneLiner:
      'Cash parked overnight at the Federal Reserve by money funds and others: the pool choosing the Fed over private markets.',
    lines: {
      highRising:
        'The reverse repo pile is high for its decade and growing: money choosing the Fed’s floor over lending anywhere else.',
      highEasing:
        'The reverse repo pile remains large but is shrinking.',
      typical: 'The reverse repo balance sits in its usual range for the decade.',
      low:
        'The reverse repo pile is near empty: the facility barely used, as was normal before 2021.',
    },
    whatItIs:
      'The overnight reverse repurchase agreement facility (the Federal Reserve Bank of New York’s daily report via FRED): how many billions the Fed borrowed back overnight from money-market funds and other eligible users.',
    whyItMatters:
      'This is the plumbing floor: cash in the facility earns a set rate and reaches no private borrower. A large pile means the system has more cash than it wants to deploy; a shrinking pile means that cash is moving back into markets and bills.',
    tendedToMean:
      'The facility was a backwater for years, then exploded past two trillion dollars in 2022-23 as rates rose and funds had nowhere better to park, and has been draining since.',
    cantTell:
      'The balance is a symptom, not a signal: the pile shrinks as bills supply rises or reserves thin, and a low balance is not by itself good or bad.',
    forYou:
      'Read it beside the net-liquidity card: the reverse repo pile is subtracted there because that cash is at the Fed, not in the system.',
  },
  'bank-reserves': {
    name: 'US bank reserves at the Fed',
    ticker: 'Reserves',
    oneLiner:
      'The deposits banks keep at the Federal Reserve: the banking system’s own liquidity buffer.',
    lines: {
      highRising:
        'Bank reserves are high for their decade and rising: abundant liquidity behind the system.',
      highEasing:
        'Reserves remain elevated but are being absorbed.',
      typical: 'Bank reserves sit in their usual range for the decade.',
      low:
        'Reserves are unusually low for the decade: the buffer thinned, the setting where funding pressure tends to appear.',
    },
    whatItIs:
      'Reserve balances with Federal Reserve Banks (the H.4.1 weekly report via FRED): the total banks keep in their own accounts at the Fed, in millions of dollars at each Wednesday.',
    whyItMatters:
      'Reserves are the raw material of the funding market: banks lend them to each other overnight at SOFR. When reserves grow scarce, that rate tends to drift above what the Fed pays, the squeeze the repo-stress card measures.',
    tendedToMean:
      'Reserves quadrupled with the 2020 bond purchases and have fallen steadily as the balance sheet runs off; funding-market wobbles in 2019 showed how sensitive the system is when this buffer thins.',
    cantTell:
      'There is no agreed number for scarce: the system’s need for reserves grows with the banking system itself, so the same level can be ample one year and tight the next.',
    forYou:
      'Read it beside the repo-stress card: rising pressure there with falling reserves here is the classic sign the buffer is getting thin.',
  },
  'repo-stress': {
    name: 'Repo funding pressure (SOFR minus IORB)',
    ticker: 'SOFR−IORB',
    oneLiner:
      'The gap between what overnight money actually costs and what the Fed pays banks: the plumbing’s own stress gauge.',
    lines: {
      highRising:
        'Overnight money is trading well above what the Fed pays banks: real pressure in the funding plumbing.',
      highEasing:
        'Funding pressure remains but is easing.',
      typical: 'The funding gap sits in its usual range: plumbing calm.',
      low:
        'The gap is near zero or below: cash is easy, with banks content to park reserves at the Fed.',
    },
    whatItIs:
      'The secured overnight financing rate (SOFR) minus the interest rate on reserve balances (IORB), both via FRED: how many percentage points more (or less) borrowers pay for overnight cash compared with what banks earn parking money at the Fed.',
    whyItMatters:
      'This is the cleanest single read on funding stress: when overnight money costs more than the Fed’s own rate, cash is being scrambled for; when it trades below, liquidity is ample.',
    tendedToMean:
      'The gap sat near zero through most of the decade, spiked in the September 2019 repo squeeze, was pinned by the 2020-22 cash flood, and has returned to a small positive spread as the balance sheet runs off.',
    cantTell:
      'It measures one night’s funding, not the health of any bank or the economy, and end-of-quarter spikes fade as routinely as they appear.',
    forYou:
      'Read it beside the reserves and stress-index cards: a widening gap with falling reserves is the pattern that historically preceded policy responses.',
  },
  'net-liquidity': {
    name: 'US net liquidity',
    ticker: 'Net liquidity',
    oneLiner:
      'The Fed’s balance sheet minus the Treasury’s account and the reverse repo pile: the money actually available to markets.',
    lines: {
      highRising:
        'Net liquidity is high for its decade and rising: the setting that tends to support risk assets.',
      highEasing:
        'Net liquidity remains elevated but is being drained.',
      typical: 'Net liquidity sits in its usual range for the decade.',
      low:
        'Net liquidity is unusually low for the decade: the system operating with a thinner cushion of money.',
    },
    whatItIs:
      'A derived measure: total Fed assets minus the Treasury General Account minus the overnight reverse repo balance (all three legs via FRED). Stated in millions of dollars at each Wednesday.',
    whyItMatters:
      'The balance sheet’s headline size overstates the money available to markets: the Treasury’s own balance and the cash parked in reverse repos are both at the Fed, not in the system. Subtracting them gives the pool that actually supports trading and lending.',
    tendedToMean:
      'The measure became a market watchword in the 2020s: it surged with the bond purchases, and each trillion of run-off has shown up here first, often months before prices responded.',
    cantTell:
      'It is an accounting identity, not a forecast: the same liquidity level can accompany rising or falling markets depending on the demand for money at the time.',
    forYou:
      'Read it beside the Fed balance sheet card: when the headline shrinks but the Treasury account or the reverse repo pile shrinks faster, net liquidity can rise even in tightening times.',
  },
  /* gap-closure S3-M3.3 (2026-11-01): the credit pair. The history lines
   * quote the provider's own file (the M3.1 fixture read 2026-11-01):
   * EBP peaked 3.41 in Oct 2008; its decade range runs −0.95 (Feb 2021)
   * to +1.19 (Mar 2020), latest −0.39 in the lower part. OFR FSI peaked
   * 29.32 on 2008-10-10; decade range −4.36 (Feb 2021) to +10.27 (Mar
   * 2020), latest −1.83 mid-range. */
  'ebp': {
    name: 'Excess bond premium (EBP)',
    ticker: 'EBP',
    oneLiner:
      'How much extra investors demand to lend to risky companies beyond the losses they expect: the price of risk appetite itself.',
    lines: {
      highRising:
        'The premium is high for its decade and rising: lenders demanding ever more beyond expected losses, the setting where credit tightens first.',
      highEasing: 'The premium remains high for the decade but is easing.',
      typical: 'The premium sits in its usual range for the decade.',
      low:
        'The premium is unusually low: lending to risky companies is priced close to expected losses alone.',
    },
    whatItIs:
      'The Federal Reserve Board’s own model (its FEDS Notes file, monthly, percentage points): the part of corporate bond spreads left over after subtracting the compensation investors require for expected default losses.',
    whyItMatters:
      'A bond spread mixes two things: expected losses, and the extra charge for risk. Cycles of appetite and fear move the second part, and this is the gauge built to isolate it.',
    tendedToMean:
      'It peaked at 3.4 in October 2008. Its decade range has run from about −0.95 (February 2021) to +1.19 (March 2020), and the latest reading sits in the lower part of that range.',
    cantTell:
      'It is a model estimate published with a one-to-two month lag, and it says nothing about any individual company: a high premium can persist for years, and a low one carries no promise about the next turn.',
    forYou:
      'Read it beside the stress index cards: when the whole family rises together, the strain is broad; when this one alone rises, lenders are charging more for risk appetite while funding still works.',
  },
  'ofr-fsi': {
    name: 'OFR Financial Stress Index',
    ticker: 'OFR FSI',
    oneLiner:
      'The Treasury’s own daily composite of credit, funding, volatility, safe-asset and equity-valuation stress: one number around zero, where zero is its long-run average.',
    lines: {
      highRising: 'Stress is above the index’s average and building.',
      highEasing: 'Stress is above average but easing.',
      typical: 'Stress sits in its usual range for the decade.',
      low: 'Financial conditions are calmer than the index’s long-run average.',
    },
    whatItIs:
      'The Office of Financial Research’s own daily file: ten documented columns, of which this card reads the aggregate; the five components (credit, equity valuation, safe assets, funding, volatility) and three regions stay in the file’s documentation.',
    whyItMatters:
      'It is the Treasury’s own lens on the system-wide question: are money markets strained together, or is the pressure isolated to one corner?',
    tendedToMean:
      'It printed its all-time high of 29.3 on 10 October 2008. Its decade range has run from −4.36 (February 2021) to +10.27 (March 2020), and the latest reading sits around the middle of that range.',
    cantTell:
      'It is a coincident reading of strain, not a forecast: a calm index has sat beside every bubble, and it moves the day conditions move, not before.',
    forYou:
      'Read it beside the St Louis Fed’s own stress index: two builders, one question. When they disagree, the disagreement itself is the detail worth a look.',
  },
  /* gap-closure S3-M3.4 (2026-11-01): the growth-nowcast and survey family —
   * six context cards (GDPNow, Empire State, continuing claims, median CPI,
   * sticky CPI, SLOOS lending standards). Every historical number below is
   * extracted from the provider’s own data (the M3.1 fixture captures). */
  gdpnow: {
    name: 'US growth nowcast (GDPNow)',
    ticker: 'GDPNow',
    oneLiner:
      'The Atlanta Fed’s running estimate of this quarter’s US growth, updated several times a month as data lands.',
    lines: {
      highRising:
        'The nowcast is strong for its decade and rising: the quarter is tracking above the usual pace.',
      highEasing: 'The nowcast remains strong for its decade but is coming down.',
      typical: 'The nowcast sits in the usual range of the past decade’s quarters.',
      low:
        'The nowcast is unusually weak: the quarter is tracking toward contraction.',
    },
    whatItIs:
      'The Atlanta Fed’s GDPNow model (via FRED GDPNOW): a running estimate of real GDP growth for the CURRENT quarter, annualised, revised in place as monthly data lands. The as-of date is the quarter’s first day: the stamp tells you which quarter the number refers to.',
    whyItMatters:
      'Official GDP lands about a month after a quarter ends; this estimate updates while the quarter is still running. It is the freshest read on US growth that exists.',
    tendedToMean:
      'The pandemic quarters swing the decade’s range from about −32 (April 2020) to +37 (July 2020); outside those two, the last five quarters have run between about 1.2 and 4.2.',
    cantTell:
      'It is a model estimate that revises several times a month, not a promise: the official print can land far from the last nowcast, and it says nothing about the quarter after.',
    forYou:
      'Read it beside the official GDP card: this one moves while the quarter is still open, the official one lands later.',
  },
  'empire-state': {
    name: 'Empire State manufacturing survey',
    ticker: 'Empire State',
    oneLiner:
      'A monthly survey of New York State manufacturers: the share growing minus the share shrinking, where above zero means growth.',
    lines: {
      highRising:
        'More New York manufacturers are growing than shrinking, and the balance is improving.',
      highEasing: 'The factory balance remains positive but is softening.',
      typical: 'The factory balance sits in its usual range for the decade.',
      low:
        'More New York manufacturers are shrinking than growing: the balance is negative.',
    },
    whatItIs:
      'The New York Fed’s Empire State manufacturing survey (via FRED GACDISA066MSFRBNY): the general business conditions index — the share of firms reporting improvement minus the share reporting deterioration, seasonally adjusted.',
    whyItMatters:
      'One of the first reads on the US economy each month, published around the middle of the month it covers: factory surveys have often turned before the headline numbers.',
    tendedToMean:
      'The decade’s range runs from −80 (April 2020) to about +36; readings above +20 have been rare outside strong stretches, and the latest sits in that upper part.',
    cantTell:
      'It asks one region’s factories about conditions, not the country: a single month’s swing is noise, and the survey reports sentiment, not output.',
    forYou:
      'Read it beside the Philadelphia Fed’s survey: two regions, the same question — when they agree, the factory signal is broad.',
  },
  'continuing-claims': {
    name: 'Americans on unemployment benefits',
    ticker: 'Continuing claims',
    oneLiner:
      'The number of people receiving unemployment benefits in a given week: the stock of joblessness beside the weekly flow of new claims.',
    lines: {
      highRising:
        'The number of people on benefits is high for its decade and rising: joblessness is both arriving and sticking.',
      highEasing: 'The benefit rolls remain elevated but are coming down.',
      typical: 'The number of people on benefits sits in its usual range for the decade.',
      low:
        'The benefit rolls are near the decade’s floor: people are finding next jobs quickly.',
    },
    whatItIs:
      'Continued claims (via FRED CCSA, from the Department of Labor’s weekly report): how many people were receiving unemployment insurance in the week, published about a week and a half after the week it covers.',
    whyItMatters:
      'New claims tell you who just lost a job; this tells you who has not found the next one. A rising stock with steady flows is the job-finding story on its own.',
    tendedToMean:
      'The pandemic spring of 2020 pushed the rolls past 23 million; since 2022 they have mostly run between about 1.3 and 2.0 million, and the latest sits in the lower part of that range.',
    cantTell:
      'Benefit rolls count only people who qualify and claim: the level shifts with rules and the size of the workforce, and one quiet week is not a trend.',
    forYou:
      'Read it with the new-claims card: rising flows land here a week later, and a rising stock without rising flows is the job-finding story.',
  },
  'median-cpi': {
    name: 'US median inflation (Cleveland Fed)',
    ticker: 'Median CPI',
    oneLiner:
      'US inflation measured by the middle price change in the basket: the steady signal under the monthly noise.',
    lines: {
      highRising:
        'The middle of price changes is high for its decade and rising: underlying inflation is firm.',
      highEasing: 'Median inflation remains elevated but is easing.',
      typical: 'Median inflation sits in its usual range for the decade.',
      low:
        'Median inflation is unusually low for the decade: underlying price pressure is quiet.',
    },
    whatItIs:
      'The Cleveland Fed’s median CPI (via FRED MEDCPIM158SFRBCLE): the median price change across the consumption basket over 12 months — the wildest moves on both sides are ignored by construction.',
    whyItMatters:
      'Food and energy make headline inflation jump around; the median ignores the wild moves entirely, which is why the Fed’s own researchers track it as a cleaner signal of the underlying trend.',
    tendedToMean:
      'Its decade range runs from about 1.1 (2020) to 7.8 (June 2022), and the latest reading sits in the lower half of that range.',
    cantTell:
      'It is a different construction from the headline index: the two can disagree for months about the same economy, and neither is wrong.',
    forYou:
      'Read it beside headline and core inflation: when the median sits below the headline, the moves are concentrated in a few noisy categories.',
  },
  'sticky-cpi': {
    name: 'US sticky-price inflation (Atlanta Fed)',
    ticker: 'Sticky CPI',
    oneLiner:
      'US inflation in the goods and services that rarely change price: a read on where underlying pressure sits.',
    lines: {
      highRising:
        'Sticky-price inflation is high for its decade and rising: even slow-moving prices are firming.',
      highEasing: 'Sticky-price inflation remains elevated but is easing.',
      typical: 'Sticky-price inflation sits in its usual range for the decade.',
      low:
        'Sticky-price inflation is unusually low: even slow-moving prices are quiet.',
    },
    whatItIs:
      'The Atlanta Fed’s sticky-price CPI (via FRED STICKCPIM158SFRBATL): 12-month inflation in the basket of items whose prices change infrequently — rents, services and the like.',
    whyItMatters:
      'Prices that rarely move do not spike with a supply shock; they respond to underlying demand and expectations. Sticky inflation that stays high says the pressure is broad, not just in food and fuel.',
    tendedToMean:
      'Its decade range runs from about −1.8 (April 2020) to 8.3 (June 2022); the latest reading sits above the middle of that range.',
    cantTell:
      'The sticky basket leans toward services: it can stay elevated after goods prices cool, and it moves slowly by construction.',
    forYou:
      'Read it beside the median-CPI card: both quiet the monthly noise, one by ignoring the extremes, the other by watching slow prices.',
  },
  'sloos-ci-tightening': {
    name: 'Banks tightening business lending (SLOOS)',
    ticker: 'Bank lending',
    oneLiner:
      'The net share of US banks making business loans harder to get, from the Fed’s quarterly survey of loan officers.',
    lines: {
      highRising:
        'A high share of banks is tightening standards, and the share is rising: business credit is clearly tightening.',
      highEasing: 'Banks are still tightening, but the share is shrinking.',
      typical: 'The tightening share sits in its usual range for the decade.',
      low:
        'Banks are basically unchanged or easing: business credit is easy to obtain.',
    },
    whatItIs:
      'The Senior Loan Officer Opinion Survey (via FRED DRTSCILM): the net percentage of US banks reporting tighter standards for business loans — the share tightening minus the share easing, covering large and middle-market firms.',
    whyItMatters:
      'The price of credit has its own cards; this one is the gate. When banks tighten standards, borrowing gets harder at the same interest rate, and tightening spells have historically lined up with weaker credit and growth.',
    tendedToMean:
      'Tightening peaked at about 71 in July 2020 and swung to net easing of −32 in 2021; the latest reading sits around zero — standards basically unchanged.',
    cantTell:
      'It is a quarterly survey of bankers, not a market price: it reports what lenders say, not what borrowers do, and one quarter is not a wave.',
    forYou:
      'Read it beside the excess bond premium: one is the price of lending to companies, this is the gate — together they cover how easy business borrowing is.',
  },
  /* gap-closure S3-M3.5 (2026-11-01): the fiscal and Treasury-supply
   * family — the 12-month deficit + its monthly companion, and the two
   * auction demand cards + their indirect-share companions. Every
   * historical number below is extracted from the providers' own data
   * (the M3.1 fixture captures). */
  'us-deficit-12m': {
    name: 'US federal deficit (12-month total)',
    ticker: '12-month deficit',
    oneLiner:
      'How much more the US government spent than it raised over the last twelve months — the bond supply the market must absorb.',
    lines: {
      highRising:
        'The 12-month deficit is large for its decade and growing: bond supply building faster than the economy behind it.',
      highEasing: 'The 12-month deficit remains large but is narrowing.',
      typical: 'The 12-month deficit sits in its usual range for the decade.',
      low:
        'The 12-month deficit is unusually small for its decade: the government borrowing much less than the recent norm.',
    },
    whatItIs:
      'The rolling twelve-month total of the US federal surplus or deficit (FRED MTSDS133FMS, the Treasury’s Monthly Treasury Statement): every month, the sum of the last twelve months’ balances, in millions of dollars. The latest month’s own figure rides inside this card.',
    whyItMatters:
      'Every dollar of deficit is a dollar of bonds the Treasury must issue. The total supply, not any single month, is what the market prices — and what the interest-bill card down the lane compounds.',
    tendedToMean:
      'The pandemic year pushed the rolling total to about 4.1 trillion dollars at its 2021 peak; the decade’s smallest reading was about 0.5 trillion (2016). The latest sits between them, toward the larger half.',
    cantTell:
      'A deficit number is not a verdict: it moves with recessions, emergencies and tax cycles, and says nothing by itself about who bears it.',
    forYou:
      'Read it with the interest-bill card and the auction demand cards: this is the supply, that is the carrying cost, and the auctions are where the market answers.',
  },
  'us-deficit-monthly': {
    name: 'US federal deficit (monthly)',
    ticker: 'Monthly deficit',
    oneLiner:
      'What the US government borrowed or repaid in the latest month alone.',
    lines: {
      highRising: 'The month’s borrowing gap is wide and widening.',
      highEasing: 'The month’s gap remains wide but is narrowing.',
      typical: 'The month’s balance sits in its usual range for the decade.',
      low: 'The month’s gap is unusually small, or the month ran a surplus.',
    },
    whatItIs:
      'The latest month’s federal surplus or deficit (FRED MTSDS133FMS, from the Treasury’s Monthly Treasury Statement), in millions of dollars. Rendered inside the 12-month card as the month’s own figure.',
    whyItMatters:
      'The monthly figure is the noisy piece the 12-month total smooths: April’s tax receipts often print a surplus, other months bunch the outlays.',
    tendedToMean:
      'Single months swing hard with the calendar: tax-collection months have printed surpluses even in heavy-deficit years.',
    cantTell:
      'One month is a receipt-and-payment calendar artifact, never a trend.',
    forYou: 'Read it as the month’s contribution to the 12-month total beside it.',
  },
  'treasury-auction-10y': {
    name: 'US 10-year Treasury auction demand',
    ticker: '10y bid-to-cover',
    oneLiner:
      'How many dollars were bid for every dollar of 10-year bonds sold at the latest auction, with the auction date.',
    lines: {
      highRising:
        'Auction demand for the 10-year is strong for its decade and rising: buyers bidding more for each dollar offered.',
      highEasing: 'Auction demand remains strong but is softening.',
      typical: '10-year auction demand sits in its usual range for the decade.',
      low:
        'Auction demand is unusually thin for its decade: buyers bidding close to what was offered.',
    },
    whatItIs:
      'The bid-to-cover ratio of the latest 10-year-family Treasury auction (the Treasury FiscalData auctions_query record, ex TIPS): total bids accepted per dollar of bonds accepted — the standard gauge of how hard buyers fought for the bonds. The as-of date is the auction day; the card carries the same auction’s indirect-bidder share inside it.',
    whyItMatters:
      'This is the market’s answer to the supply the deficit card measures: thin demand at auction is where borrowing trouble shows up first, long before it shows up in yields alone.',
    tendedToMean:
      'The decade’s readings run from about 2.17 to 3.43, with most between roughly 2.2 and 2.8; the latest sits near the top of that range.',
    cantTell:
      'Bid-to-cover is one auction’s snapshot, not a level: it swings with the size of the offer, the time of year and what else was on sale that week.',
    forYou:
      'Read it with the indirect share inside the card: strong overall demand can hide a foreign pullback, and weak cover with a high indirect share says domestic buyers stepped back instead.',
  },
  'treasury-auction-10y-indirect': {
    name: 'US 10-year auction indirect share',
    ticker: '10y indirect share',
    oneLiner:
      'The share of the latest 10-year auction’s accepted bids taken by indirect bidders — the foreign and intermediary demand.',
    lines: {
      highRising: 'Indirect bidders are taking a larger share of the 10-year auctions.',
      highEasing: 'The indirect share remains high but is easing.',
      typical: 'The indirect share sits in its usual range for the decade.',
      low: 'Indirect bidders are taking an unusually small share: foreign demand for the 10-year is thin.',
    },
    whatItIs:
      'The indirect bidders’ share of accepted bids at the latest 10-year-family Treasury auction (the Treasury FiscalData record): the accepted dollar amount taken by indirect bidders — typically foreign and intermediary buyers — as a share of all accepted bids.',
    whyItMatters:
      'Foreign and intermediary bidders are the deep pocket behind Treasury demand. When they thin, the domestic base must absorb more of the supply.',
    tendedToMean:
      'The decade’s readings run from single digits to about 83 per cent; the latest sits near the top of that range.',
    cantTell:
      'Indirect bidders are a category, not a country list: the label mixes foreign official buyers with intermediaries whose end clients are unknown.',
    forYou: 'Read it inside the 10-year auction card, beside the bid-to-cover it complements.',
  },
  'treasury-auction-30y': {
    name: 'US 30-year Treasury auction demand',
    ticker: '30y bid-to-cover',
    oneLiner:
      'How many dollars were bid for every dollar of 30-year bonds sold at the latest auction, with the auction date.',
    lines: {
      highRising:
        'Auction demand for the long bond is strong for its decade and rising.',
      highEasing: 'Long-bond demand remains strong but is softening.',
      typical: 'Long-bond auction demand sits in its usual range for the decade.',
      low:
        'Long-bond demand is unusually thin for its decade: the hardest-to-place maturity meeting the least fight.',
    },
    whatItIs:
      'The bid-to-cover ratio of the latest 30-year-family Treasury auction (the Treasury FiscalData auctions_query record, ex TIPS): total bids accepted per dollar of bonds accepted. The as-of date is the auction day; the same auction’s indirect-bidder share rides inside the card.',
    whyItMatters:
      'The 30-year bond is the longest regular supply the Treasury issues: it is where patience for duration runs out first, so its auctions are watched as the demand canary.',
    tendedToMean:
      'The decade’s readings run from about 2.06 to 2.74, with most between roughly 2.1 and 2.6; the latest sits near the top of that range.',
    cantTell:
      'One auction is a snapshot: the ratio swings with offer size and season, and long-bond auctions are sparser than every other maturity.',
    forYou:
      'Read it beside the 10-year auction card: when the long bond lags the note, the market is telling you where its patience ends.',
  },
  'treasury-auction-30y-indirect': {
    name: 'US 30-year auction indirect share',
    ticker: '30y indirect share',
    oneLiner:
      'The share of the latest 30-year auction’s accepted bids taken by indirect bidders.',
    lines: {
      highRising: 'Indirect bidders are taking a larger share of the long-bond auctions.',
      highEasing: 'The long-bond indirect share remains high but is easing.',
      typical: 'The long-bond indirect share sits in its usual range for the decade.',
      low: 'Indirect bidders are taking an unusually small share of the long bond.',
    },
    whatItIs:
      'The indirect bidders’ share of accepted bids at the latest 30-year-family Treasury auction (the Treasury FiscalData record): indirect-accepted dollars as a share of all accepted bids.',
    whyItMatters:
      'The long bond leans hardest on deep-pocketed bidders: when the indirect share thins there, someone domestic ends up with more duration than they may want.',
    tendedToMean:
      'The decade’s readings run from about 37 to 79 per cent; the latest sits near the top of that range.',
    cantTell:
      'The category hides its clients: a high share may be a foreign official account, or an intermediary parking someone else’s bid.',
    forYou: 'Read it inside the 30-year auction card, beside the bid-to-cover.',
  },
  'retail-sales': {
    name: 'US retail sales',
    ticker: 'Retail',
    oneLiner:
      'The monthly value of what American shops ring up: the consumption pulse that drives roughly two-thirds of the US economy.',
    lines: {
      highRising:
        'US retail sales are strong for their decade and rising: consumption carrying the economy.',
      highEasing: 'Retail sales remain strong for their decade but are levelling off.',
      typical: 'US retail sales sit in their usual range for the decade.',
      low:
        'Retail sales are unusually weak: the consumption pullback that opens the door to recession talk.',
    },
    whatItIs:
      'Advance retail sales for the US retail trade sector (the Census Bureau’s monthly survey via FRED): the dollar value of the sector’s monthly turnover.',
    whyItMatters:
      'The missing real-economy link of the transmission chain: policy tightens, borrowing costs rise, and this is where the answer eventually shows up. Consumption is about two-thirds of US GDP, so its pulse is the economy’s pulse.',
    tendedToMean:
      'Retail sales grow with prices and population most of the time; genuine declines are rare outside recessions, which is exactly why they are watched.',
    cantTell:
      'The nominal figure mixes volume and price: high inflation makes weak volumes look like growth, and the series is revised as the month’s data completes.',
    forYou:
      'The spending pulse behind the labor cards: jobs feed it, inflation eats it, and the gap between the two is the household story.',
  },
  'housing-permits': {
    name: 'US building permits',
    ticker: 'Permits',
    oneLiner:
      'How many new US homes were authorized this month: the long-leading indicator that turns first when rates move.',
    lines: {
      highRising: 'US homebuilding is expanding: builders reading demand and cheaper money ahead.',
      highEasing: 'Homebuilding remains elevated for its decade but is cooling.',
      typical: 'US building permits sit in their usual range for the decade.',
      low:
        'Permits are unusually weak: builders shelving projects, the classic early response to expensive money.',
    },
    whatItIs:
      'New privately-owned housing units authorized by building permits (the Census Bureau via FRED), seasonally adjusted at an annual rate: the front of the housing pipeline.',
    whyItMatters:
      'Housing is the most rate-sensitive sector of the economy, and permits are its earliest signal: a builder files paperwork months before a home exists. Turning points here lead the wider economy by quarters.',
    tendedToMean:
      'Permits collapsed before each of the past US recessions and recovered with rate cuts; the 2022-23 mortgage spike cut them by roughly a third.',
    cantTell:
      'A permit is an intention, not a home: some are never built, and multi-unit projects can move the number in bursts.',
    forYou:
      'Read it beside the mortgage-rate card: one is the cost of the loan, the other the market’s answer to it.',
  },
  cfnai: {
    name: 'US economic activity (Chicago Fed)',
    // R14: 'CFNAI' is the source code — the readable publisher tag ships.
    ticker: 'Chicago Fed',
    oneLiner:
      'One number for the whole US economy: 85 indicators blended into a single activity score.',
    lines: {
      highRising: 'US activity is running above trend and accelerating.',
      highEasing: 'Activity is above trend but cooling.',
      typical: 'US economic activity sits in its usual range for the decade.',
      low:
        'Activity is below trend: values this low have historically clustered around recessions.',
    },
    whatItIs:
      'The Chicago Fed National Activity Index (via FRED): a weighted average of 85 monthly indicators of production, income, employment and sales. Zero is trend growth.',
    whyItMatters:
      'It is the free composite gauge the dashboard was missing: instead of reading jobs, spending and output separately, one index says whether the whole economy is above or below its trend, and by how much.',
    tendedToMean:
      'Sustained readings below -0.70 have accompanied every US recession of the past half-century; the index is built to be read as a level, month by month.',
    cantTell:
      'A weighted blend smooths the parts away: it cannot say which sector moved, and it is revised as its inputs are.',
    forYou:
      'The single-glance answer to the growth lane’s question: is the whole economy above or below its own trend line.',
  },
  'job-openings': {
    name: 'US job openings',
    // R14: 'JOLTS' is the survey's source code — the readable tag ships.
    ticker: 'Open jobs',
    oneLiner:
      'How many unfilled jobs America has: the labor-market gauge that turned first in past cycles.',
    lines: {
      highRising:
        'Employers are advertising more jobs than usual and hiring more: demand for labor still strong.',
      highEasing: 'Openings remain elevated for their decade but are coming down.',
      typical: 'US job openings sit in their usual range for the decade.',
      low:
        'Openings have fallen back: the labor market’s leading edge rolling over before unemployment rises.',
    },
    whatItIs:
      'Total nonfarm job openings from the JOLTS survey (the BLS via FRED): positions employers are actively trying to fill.',
    whyItMatters:
      'This is the Powell-era dashboard’s leading edge: openings rolled over months before unemployment rose in past cycles, because cutting a posting is easier than cutting a person. The Fed watched this number closely.',
    tendedToMean:
      'Openings roughly halved from their 2022 record as the tightening bit, without unemployment rising much: the soft landing’s signature.',
    cantTell:
      'An opening is not a hire: postings can linger unfilled, and the survey lags the month by about six weeks.',
    forYou:
      'Read it beside the claims card: one counts employers pulling back, the other workers being let go. The two ends of the labor market turning.',
  },
  t5yie: {
    name: 'Expected US inflation, five years ahead',
    ticker: '5-year breakeven',
    oneLiner:
      'What markets expect US inflation to average over the next five years: the middle leg of the expectations ladder.',
    lines: {
      highRising: 'The market’s five-year inflation expectation is high for its decade and rising.',
      highEasing: 'The five-year expectation is elevated for its decade but easing.',
      typical: 'The five-year inflation expectation sits in its usual range for the decade.',
      low: 'The five-year expectation is unusually low: markets pricing deflationary conditions.',
    },
    whatItIs:
      'The five-year breakeven inflation rate (via FRED): the gap between ordinary and inflation-protected Treasury yields, which is what the bond market pays to hedge inflation over the next five years.',
    whyItMatters:
      'The middle rung of the expectations ladder: the Michigan card asks households, the 5y5y card asks the long run, and this one is the market’s medium-term view. The Fed watches it because expectations can become self-fulfilling.',
    tendedToMean:
      'Breakevens tracked the actual inflation surge of 2021-22 and settled back with it; sustained moves above their range preceded policy responses.',
    cantTell:
      'The breakeven mixes inflation expectations with compensation for risk and liquidity: it can move without anyone truly changing their forecast.',
    forYou:
      'The market’s own five-year answer to the question the Michigan card asks households: together they show whether belief in rising prices is shared.',
  },
  'us-wages': {
    name: 'US wage growth',
    ticker: 'Wages',
    oneLiner: 'How fast American paychecks are growing: the wage leg of the wage-price loop.',
    lines: {
      highRising:
        'US wages are growing faster than their decade norm and accelerating: the loop’s fuel.',
      highEasing: 'Wage growth is elevated for its decade but easing.',
      typical: 'US wage growth sits in its usual range for the decade.',
      low: 'Wage growth is unusually weak: pay failing to keep up is the household squeeze.',
    },
    whatItIs:
      'The 12-month change in average hourly earnings of all US employees (the BLS via FRED): the pace of American pay growth.',
    whyItMatters:
      'Wages are both a cost and an income: rising pay sustains spending but pressures prices, which is why central banks watch the loop. This was the number the Fed cited when calling inflation persistent.',
    tendedToMean:
      'Wage growth near 4% proved compatible with 2% inflation in the decade before the pandemic; the 2021-23 climb above 5% fed the inflation the Fed then fought.',
    cantTell:
      'Average pay mixes who is working with what they earn: a shrinking workforce can lift the average while nobody gets a raise, and composition shifts distort it.',
    forYou:
      'Read it beside the inflation cards: when pay grows faster than prices, households gain ground; when it lags, the squeeze is on.',
  },
  'euro-hicp': {
    name: 'Euro-area inflation (yearly)',
    ticker: 'HICP',
    oneLiner:
      'How fast prices are rising across the euro area: the ECB’s own inflation gauge against its 2% target.',
    lines: {
      highRising: 'Euro-area inflation is above the ECB’s target and rising.',
      highEasing: 'Inflation is above target but easing toward it.',
      typical: 'Euro-area inflation sits in its usual range for the decade.',
      low:
        'Euro-area inflation is unusually low: the deflationary stretch that once forced the ECB into negative rates.',
    },
    whatItIs:
      'The euro-area Harmonised Index of Consumer Prices, annual rate (Eurostat via the ECB Data Portal): the comparable inflation measure across all euro-area countries.',
    whyItMatters:
      'The euro area finally has its inflation card: until now the region showed only a policy rate responding to a number the reader could not see. This is that number, scored against the ECB’s own published 2% target.',
    tendedToMean:
      'The euro area spent the 2010s below target, overshoot to above 10% in 2022-23, and ground back down as the ECB hiked; the target line is the anchor for all of it.',
    cantTell:
      'A weighted average of twenty countries: national experiences differ widely around it, and the harmonised method differs from any single country’s CPI.',
    forYou:
      'The missing half of the euro story on this page: the policy-rate card shows the ECB’s response, this shows what it is responding to.',
  },
  'au-housing-finance': {
    name: 'New Australian home loans',
    ticker: 'Housing finance',
    oneLiner:
      'How much Australians are borrowing for homes: the mortgage pipeline that leads the housing market.',
    lines: {
      highRising:
        'New home lending is strong for its decade and rising: households committing, demand ahead.',
      highEasing: 'New lending is strong for its decade but cooling.',
      typical: 'New home lending sits in its usual range for the decade.',
      low:
        'New lending is unusually weak: households stepping back, the leading edge of a housing slowdown.',
    },
    whatItIs:
      'The value of new housing loan commitments across Australia (the ABS lending indicators, quarterly, seasonally adjusted): all lenders, owner-occupier and investor together.',
    whyItMatters:
      'This is the AU leading edge: a loan commitment is signed months before it shows in home values, so it turns first. It is also a direct confidence reading: a home loan is the biggest financial commitment a household makes.',
    tendedToMean:
      'Lending collapsed with each rate-hike cycle and recovered with each cut; the 2022-23 tightening cut new commitments by roughly a third before values followed.',
    cantTell:
      'A commitment is not a settled loan, and the total mixes investors with owner-occupiers: the investor share can swing for tax settings rather than the economy.',
    forYou:
      'The pipeline card beside home values: when lending turns, values follow. Read the pair and you are reading the Australian housing cycle in order.',
  },
  'au-saving-ratio': {
    name: 'The Australian household saving rate',
    ticker: 'Saving rate',
    oneLiner: 'The share of income Australian households save: the hunkering-down gauge.',
    lines: {
      highRising:
        'Australian households are saving unusually much and cutting back further: caution in force.',
      highEasing:
        'The saving rate is high for its decade but households are easing back into spending.',
      typical: 'The household saving rate sits in its usual range for the decade.',
      low: 'Saving is unusually thin: households stretched, or confident enough to spend it all.',
    },
    whatItIs:
      'The ratio of household net saving to disposable income (the ABS national accounts, quarterly, seasonally adjusted): what remains after consumption.',
    whyItMatters:
      'The hunkering-down gauge: when uncertainty rises, households save more and spending falls before any income does. The pandemic’s forced saving and its slow release shaped the whole 2020s Australian consumer story.',
    tendedToMean:
      'The ratio spiked to unprecedented levels in 2020, then drained for three years as buffers funded spending; unusually low readings preceded past consumption slowdowns.',
    cantTell:
      'An aggregate ratio says nothing about distribution: the average household may be saving well while the bottom half saves nothing.',
    forYou:
      'The confidence gauge of the AU households lane: read it beside the lending card to see whether caution is rising or fading.',
  },
  'au-job-vacancies': {
    name: 'Australian job vacancies',
    ticker: 'Vacancies',
    oneLiner:
      'How many jobs Australian employers are trying to fill: the leading edge of the labor market.',
    lines: {
      highRising: 'Australian employers are advertising more jobs than usual and hiring more.',
      highEasing: 'Vacancies remain elevated for their decade but are coming down.',
      typical: 'Australian job vacancies sit in their usual range for the decade.',
      low: 'Vacancies have fallen sharply: employers pulling back before unemployment rises.',
    },
    whatItIs:
      'Total job vacancies across Australia (the ABS survey, quarterly, seasonally adjusted): positions employers are actively seeking to fill.',
    whyItMatters:
      'The JOLTS logic, Australian edition: vacancies roll over before unemployment rises, because a posting costs nothing to cut while a person costs everything. This is the labor market’s early-warning line for the AU audience.',
    tendedToMean:
      'Vacancies hit a record in 2022 and have fallen steadily since, while unemployment barely moved: the same soft-landing pattern the US card shows.',
    cantTell:
      'A vacancy is not a hire: postings linger, and skill mismatches can leave jobs unfilled beside unemployed workers.',
    forYou:
      'Read it beside the AU unemployment card: one leads, one lags. Both together tell you where the cycle is.',
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
      'China’s official manufacturing Purchasing Managers’ Index, from the national statistics bureau’s monthly survey of factory managers, read here from the bureau’s own English press releases. Above 50 means expansion; below 50, contraction.',
    whyItMatters:
      'China is the world’s factory and Australia’s biggest export customer; PMI is one of the first indicators to turn in any cycle.',
    tendedToMean:
      'Runs below 50 have marked Chinese slowdowns that fed through to commodity prices and the Australian dollar.',
    cantTell:
      'It measures breadth (how many firms grew), not size: one month’s dip is not a trend.',
    forYou: 'A key early indicator of demand for Australian exports.',
  },
  'china-cpi': {
    name: 'China inflation (yearly)',
    ticker: 'China CPI',
    oneLiner:
      'How fast Chinese consumer prices are rising, compared with a year ago: the gauge against the government’s own around-3% target.',
    band: { min: 3, label: 'the government’s ~3% goal' },
    lines: {
      highRising: 'Chinese consumer prices are rising faster than usual: overheating pressure in the world’s factory.',
      highEasing: 'Chinese inflation is above target but easing toward it.',
      typical: 'Chinese inflation sits in its usual range for the past decade.',
      low:
        'Chinese prices are barely rising or falling: the weak-demand reading that haunts global trade and commodity prices.',
    },
    whatItIs:
      'The year-on-year growth in China’s official Consumer Price Index, published monthly by the national statistics bureau and read here from its own English press releases.',
    whyItMatters:
      'China is the world’s factory and Australia’s biggest export customer: when its consumers and factories stop paying up, commodity prices and the AUD feel it. This is the demand temperature beside the factory PMI.',
    tendedToMean:
      'China spent 2023-25 flirting with deflation as property slumped and households saved; the long-run history spans deflationary dips to 8%+ overheating in the mid-1990s and 2008-11.',
    cantTell:
      'A national average over a vast economy: it says nothing about any one province, and food and energy swings can mask the underlying trend for months.',
    forYou:
      'The China pair’s second card: read it with the factory PMI to judge whether Chinese demand is heating, cooling or stalling.',
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
  // ---- M4 Wave 1 (OD-8/D-42, 2026-10-24) — the growth lane's early-warning pack ----
  'initial-jobless-claims': {
    name: 'New unemployment claims',
    ticker: 'Jobless claims',
    oneLiner:
      'How many Americans newly filed for unemployment benefits last week: the fastest read on the labor market there is.',
    lines: {
      highRising: 'New claims are high for the decade and rising: the pattern that has opened past US downturns.',
      highEasing: 'New claims are elevated for the decade but easing.',
      typical: 'New claims sit in their usual range for the decade.',
      low: 'New claims are unusually low: a tight labor market, where layoffs are rare.',
    },
    whatItIs:
      'Initial claims (FRED’s ICSA): the number of people newly registering for unemployment benefits each week, published every Thursday — weeks before the monthly jobs data, months before the Sahm rule can move.',
    whyItMatters:
      'Layoffs show up here first. Claims are the most-watched weekly number in US macro precisely because a sustained rise is the earliest public sign the labor market is cracking.',
    tendedToMean:
      'Sustained climbs off a cycle low — not one noisy week — have opened the labor turn of every modern US recession.',
    cantTell:
      'The series is weekly and noisy (holidays, strikes and weather all distort single weeks), and its level drifts with the workforce’s size: one week is never a trend.',
    forYou:
      'The earliest public sign that layoffs are picking up — worth a glance before trusting any “the labor market is fine” take.',
  },
  'recession-probability': {
    name: 'US recession probability',
    oneLiner:
      'A model’s estimate of the chance the US economy is in recession right now. Above 50% is the classic recession call.',
    lines: {
      highRising: 'The recession probability is above the 50% line: the model reads the current data as recession-like.',
      highEasing: 'The probability is elevated but easing off its highs.',
      typical: 'The recession probability sits in its usual low range.',
      low: 'The recession probability is near zero: the data reads as normal expansion.',
    },
    whatItIs:
      'Smoothed US recession probabilities (FRED’s RECPROUSM156N, the Marcelle-Chauvet model): a statistical model reads several monthly indicators and reports the probability the economy is in recession that month.',
    whyItMatters:
      'One number that weighs the same evidence you would otherwise read across five cards — and a model companion to the Sahm alarm beside it.',
    tendedToMean:
      'Crossings of the 50% line have coincided with the recognized starts of past US recessions, and fallen back only well into recoveries.',
    cantTell:
      'It is a model, not a fact: it publishes a month or two behind the data it reads, and it can briefly mistake noise for signal.',
    forYou:
      'A quick “how bad does the data say things are” number before reading the rest of the growth lane.',
  },
  'michigan-sentiment': {
    name: 'US consumer mood',
    ticker: 'Michigan',
    oneLiner:
      'How confident American households feel about their finances and the economy: the survey the news cites.',
    lines: {
      low: 'Consumer mood is in the bottom of its decade range: the pessimism that has preceded cutbacks in spending.',
      highRising: 'Consumer mood is unusually strong and improving.',
      highEasing: 'Consumer mood remains above its norm, though easing.',
      typical: 'US consumer mood sits in its usual range for the decade.',
    },
    whatItIs:
      'The University of Michigan consumer sentiment index (FRED’s UMCSENT): a monthly survey of households running since the 1950s. The card carries the survey’s one-year inflation expectations beside it.',
    whyItMatters:
      'Consumer spending is most of the US economy, and mood leads it. The Federal Reserve also watches the expectations leg for signs inflation psychology is un-anchoring.',
    tendedToMean:
      'Bottom-of-the-range readings clustered around the 1970s stagflation, the 2008–09 crisis and the 2022 inflation shock.',
    cantTell:
      'Mood is not spending: American households have kept spending through gloomy surveys before, so the card is a pressure gauge, not a forecast.',
    forYou:
      'Context for US consumer headlines — and the expectations number the Fed quotes when it talks about inflation psychology.',
  },
  'michigan-1y-expectations': {
    name: 'Expected inflation next year',
    ticker: 'Michigan 1y',
    oneLiner: 'What American households expect prices to do over the next 12 months.',
    lines: {},
    whatItIs:
      'The Michigan survey’s median expected price change over the next 12 months (FRED’s MICH), shown inside the consumer-mood card.',
    whyItMatters:
      'Expected inflation feeds wage demands and pricing decisions; the Fed watches it as a gauge of inflation psychology.',
    tendedToMean:
      'Expectations above roughly 4–5% marked the 2022 panic; the modern norm is near 2–3%.',
    cantTell:
      'Households systematically over-predict inflation: this is psychology, not a forecast.',
    forYou: 'A quick read on how stressed American households are about prices.',
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
      'The Alternative.me Crypto Fear and Greed Index, a daily 0-to-100 scale built from crypto market volatility, momentum, social media and dominance measures (0 = extreme fear, 100 = extreme greed). Shown with the publisher’s own scale; attribution to Alternative.me.',
    whyItMatters:
      'A sentiment backdrop for crypto headlines: the number describes the mood of that market today, nothing more.',
    tendedToMean:
      'Extreme readings have often appeared near sharp market turns in that market — a tendency, not a rule.',
    cantTell:
      'Sentiment gauges describe feelings, not prices; this page never treats the index as a recommendation.',
    forYou: 'Context for crypto news — the same day-by-day honesty as every other card here.',
  },
  'shiller-cape': {
    // Step 3 L1-14 / L2-10 (v3, 2026-10-20): the Shiller CAPE — context only,
    // shown as the publisher's own reading. Valuation, never a timing tool.
    name: 'US share prices versus long-run earnings (Shiller CAPE)',
    oneLiner: 'A long-run measure of how expensive US shares are against their own 10-year average of inflation-adjusted earnings.',
    whatItIs:
      'The Shiller CAPE ratio from Robert Shiller’s Irrational Exuberance dataset (ie_data.xls, monthly): the S&P 500 price divided by the average of 10 years of inflation-adjusted earnings. Shown with the publisher’s own number; attribution to Robert Shiller, Yale.',
    whyItMatters:
      'A way to compare today’s US share prices with more than 150 years of their own history on one consistent basis.',
    tendedToMean:
      'Very high CAPE readings have, historically, come with lower US share returns over the following decade, and very low readings with higher ones — a long-run tendency with wide variation around it.',
    cantTell:
      'Valuation measures say little about the next few months: CAPE has stayed high for years while shares rose, and low while they fell. It is not a timing tool and never a signal.',
    forYou: 'Long-run context for the US share market — one number, one publisher, no view attached.',
  },
  'shiller-ecy': {
    name: 'Excess CAPE Yield (Shiller)',
    oneLiner: 'The earnings yield of US shares minus what inflation-protected US government bonds pay.',
    whatItIs:
      'The Excess CAPE Yield from Robert Shiller’s ie_data.xls (monthly): the inverse of the CAPE ratio minus the real 10-year Treasury yield, exactly as the publisher computes it.',
    whyItMatters:
      'It lines up the earnings yield of US shares against the real return on “safe” US government money on one scale.',
    tendedToMean:
      'When the gap has been negative, the following decade’s US share returns have often been lower; when strongly positive, often higher — a long-run tendency, not a rule.',
    cantTell:
      'Like CAPE, it describes a relationship over long horizons; it says little about the next few months and is never a signal.',
    forYou: 'The companion reading to the CAPE card, in the publisher’s own units.',
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
      'The average market yield on 10-year Australian Government bonds over the latest full month: the RBA’s F2.1 monthly series (the daily F2 file is currently unreachable from this app’s servers, so the served series is the monthly average — lagged, refreshed in the first days of each month, so it can sit behind the day’s traded yield). The US 10-year rides beside it for comparison.',
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
      'The RBA’s 3-year Australian Government bond yield (monthly F2.1 series) minus the cash rate target (table F1), from the RBA. The 3-year leg is a monthly average, so it can lag the day’s traded rate.',
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
      'Australia’s 10-year government bond yield (RBA F2.1, monthly average) minus the US 10-year yield (FRED, daily). Both legs carry their own dates; while they sit more than a week apart the card shows “dates differ” and does not vote.',
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
  'rba-fed-gap': {
    // 2026-10-26 gap-audit build, A-5 (INSIGHTS_DATA_SPEC.md): the
    // short-rate carry leg — the policy-rate twin of au-us-10y-gap.
    name: 'The gap between Australian and US interest rates',
    ticker: 'RBA−Fed',
    oneLiner:
      'How far Australia’s central-bank rate sits above or below the Federal Reserve’s: the short-term money-flow pull between the two dollars.',
    lines: {
      highRising: 'Australian rates are far above US rates and the gap is widening: carry money tends to flow in, supporting the Australian dollar.',
      highEasing: 'Australian rates remain above US rates, but the gap is narrowing.',
      typical: 'The rate gap sits in its usual range for recent history.',
      low: 'Australian rates sit below US rates: money tends to leave for the higher yield, weighing on the Australian dollar.',
    },
    whatItIs:
      'The RBA’s cash rate target minus the midpoint of the Federal Reserve’s target range (4.60 − 3.875 = +0.725 today): the policy-setting gap that drives short-term carry flows.',
    whyItMatters:
      'When Australian rates fall far below US rates, money tends to leave for the higher yield — the Australian dollar weakens and imports cost more.',
    tendedToMean:
      'The 2022–23 hiking cycle sent the gap from deep negative to strongly positive; both tails have historically moved the Australian dollar.',
    cantTell:
      'The gap is one input among many: commodity prices and global risk appetite can overwhelm it for months at a time.',
    forYou:
      'Read it beside the AUD/USD card and the 10-year gap in the rates lane: together they tell the whole carry story.',
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
  // 2026-10-21 data-integrity round — the coverage additions (WTI,
  // natural gas, platinum, ETH, Bund/JGB/Gilt, BoJ/BoE rates, NZD/USD,
  // US GDP growth and nonfarm payrolls): recovered verbatim from the
  // deployed SPA bundle the round shipped with.
  'gold-oil-ratio': {
    // 2026-10-26 gap-audit build, A-4 (INSIGHTS_DATA_SPEC.md): gold
    // measured in oil — the long-run relative-value check, context only.
    name: 'Gold measured in oil',
    ticker: 'Gold/Oil',
    oneLiner:
      'How many barrels of oil one ounce of gold buys: the long-run value check between the world’s two biggest commodities.',
    lines: {
      highRising: 'Gold is unusually rich against oil: the setting that has historically favoured holding gold.',
      highEasing: 'Gold remains rich against oil but the ratio is easing back.',
      typical: 'The ratio sits in its usual range of the past decade.',
      low: 'Gold is unusually cheap against oil: the inflation-era pattern of energy dominance.',
    },
    whatItIs:
      'The gold price in US dollars divided by the Brent oil price on the same dates (≈ 3,997 ÷ 111.7 ≈ 35.8 barrels per ounce today): a ratio with no units of its own, best read against its own history.',
    whyItMatters:
      'How many barrels of oil one ounce of gold buys — a long-run value check between the two biggest commodities in the world.',
    tendedToMean:
      'The ratio’s range shifts across eras — around 30 in the 1970s, near 20 in the mid-2010s, very wide in the 2020s — which is why the card reads percentiles, not fixed numbers.',
    cantTell:
      'A low ratio can mean cheap gold, dear oil, or both at once: the ratio alone does not say which side moved.',
    forYou:
      'A neutral context line for the gold story: read it beside the gold price and the oil cards, never alone.',
  },
  'eia-crude-stocks': {
    // 2026-10-26 gap-audit build, A-6 (INSIGHTS_DATA_SPEC.md): the weekly
    // petroleum-tanks gauge, context beside the oil prices.
    name: 'US crude oil inventories',
    ticker: 'Crude stocks',
    oneLiner:
      'How much crude oil sits in America’s storage tanks: the weekly supply gauge behind the petrol-price story.',
    lines: {
      highRising: 'Oil is piling into storage: the glut setting that has historically dragged crude and pump prices down.',
      highEasing: 'Stocks remain high but are being drawn down.',
      typical: 'Inventories sit in their usual range for the time of year.',
      low: 'Storage is draining fast: the supply-squeeze setting that can push petrol prices up.',
    },
    whatItIs:
      'U.S. ending stocks of crude oil, in millions of barrels, from the Energy Information Administration’s weekly Petroleum Status Report (thousand-barrel series WCRSTUS1, published Wednesdays).',
    whyItMatters:
      'America’s oil tank levels: more oil in storage usually points to cheaper petrol ahead, while fast drains can signal supply squeezes.',
    tendedToMean:
      'The 2020 glut filled storage to its walls; the 2022 drawdown emptied it near five-decade lows — both moved pump prices within months.',
    cantTell:
      'One week’s build or draw is noise; the market reads the trend, the five-year average and the season together.',
    forYou:
      'The oil-price context card: read it beside Brent and WTI — the tanks explain what the prices are reacting to.',
  },
  'cftc-gold-positioning': {
    // 2026-10-26 gap-audit build, A-7 (INSIGHTS_DATA_SPEC.md): the crowded
    // book gauge, scored beside VIX in the market-stress lane.
    name: 'Trader positioning in gold',
    ticker: 'Gold COT',
    oneLiner:
      'What big speculators are betting on gold right now: how crowded the trade has become.',
    lines: {
      highRising: 'Speculators are more crowded into gold than usual and still adding: the squeeze-then-slump zone.',
      highEasing: 'Speculative positioning remains rich but is being trimmed.',
      typical: 'Speculative positioning sits in its usual range.',
      low: 'Speculators are net short gold — rare, and historically seen near price floors.',
    },
    whatItIs:
      'The net non-commercial position in gold futures (big speculators’ bets minus their shorts) as a share of all open interest, from the CFTC’s weekly Commitments of Traders report (Tuesday data, published Fridays).',
    whyItMatters:
      'What big speculators are betting on gold right now; crowded bets have historically unwound violently.',
    tendedToMean:
      'Reads above 45% of open interest have marked the crowded-long zone; net-short prints are rare and have clustered near price floors.',
    cantTell:
      'Positioning says how crowded the boat is, not which way the wind blows: crowded books can stay crowded for months.',
    forYou:
      'The gold market’s crowd gauge: read it beside VIX — stress plus crowding is the combination that unwinds hardest.',
  },
  'oecd-cli-us': {
    // 2026-10-26 gap-audit build, A-8 (INSIGHTS_DATA_SPEC.md): the OECD's
    // leading indicator, US leg — the growth lane's leading edge (scored:
    // the licensed-PMI replacement); the CN/DE companions follow.
    name: 'OECD leading indicator (US)',
    ticker: 'OECD',
    oneLiner:
      'A leading gauge of the US economy’s direction about six months ahead: the card to watch for turns before recessions and recoveries.',
    lines: {
      highRising: 'The leading indicator is rising away from its recent range: recoveries have historically begun this way.',
      highEasing: 'The leading indicator remains high but is easing back.',
      typical: 'The leading indicator sits in its usual range: no clear turn in either direction.',
      low: 'The leading indicator is low: the zone that has historically preceded recessions.',
    },
    whatItIs:
      'The OECD’s amplitude-adjusted Composite Leading Indicator for the United States: a single index built from orders, construction, consumer sentiment, financial and labour components, published monthly with roughly a five-week lag.',
    whyItMatters:
      'A leading gauge of the world economy’s direction about six months ahead; it has turned down before recessions and up before recoveries.',
    tendedToMean:
      'The OECD’s own turning-point convention: 6-month annualised growth below −1 means “turning down”, three consecutive monthly falls mark a slowdown, and drops below −2 have clustered around recessions — while rare 3-month surges above +2 mark policy-driven V-turns.',
    cantTell:
      'A leading indicator sees turns, not their size: false turns have happened, and the five-week publication lag means fast shocks arrive late to this card.',
    forYou:
      'The growth lane’s early-warning companion: read it beside the recession probability and the jobless claims, never alone.',
  },
  'oecd-cli-cn': {
    // A-8's China companion: context beside china-pmi.
    name: 'OECD leading indicator (China)',
    ticker: 'OECD',
    oneLiner:
      'A leading gauge of China’s economy about six months ahead: the factory gauge’s leading companion beside the PMI.',
    lines: {
      highRising: 'China’s leading indicator is rising: the early shape of a turnaround.',
      highEasing: 'China’s leading indicator remains high but is easing back.',
      typical: 'China’s leading indicator sits in its usual range.',
      low: 'China’s leading indicator is low: the zone that has preceded the country’s slowdowns.',
    },
    whatItIs:
      'The OECD’s amplitude-adjusted Composite Leading Indicator for China: the same component framework as the US card, published monthly with roughly a five-week lag.',
    whyItMatters:
      'A leading gauge of the world economy’s direction about six months ahead; it has turned down before recessions and up before recoveries.',
    tendedToMean:
      'The same convention as the US card: 6-month annualised growth below −1 means “turning down”; three consecutive monthly falls mark a slowdown.',
    cantTell:
      'China’s turning points have been policy-shaped and sharp: the indicator lags the decisions more than the economy.',
    forYou: 'The China pair’s leading half: read it beside the factory PMI for the direction of the world’s second economy.',
  },
  'oecd-cli-de': {
    // A-8's euro companion (DEU — the EA19 substitute, probed live:
    // the CLI dataflow carries no EA19).
    name: 'OECD leading indicator (Germany)',
    ticker: 'OECD',
    oneLiner:
      'A leading gauge of Europe’s largest economy about six months ahead: the euro area’s proxy reading.',
    lines: {
      highRising: 'Germany’s leading indicator is rising: the early shape of a European turnaround.',
      highEasing: 'Germany’s leading indicator remains high but is easing back.',
      typical: 'Germany’s leading indicator sits in its usual range.',
      low: 'Germany’s leading indicator is low: the zone that has preceded European slowdowns.',
    },
    whatItIs:
      'The OECD’s amplitude-adjusted Composite Leading Indicator for Germany — the euro-area substitute (the OECD’s CLI dataflow publishes member countries, not the EA19 aggregate; Germany is the area’s largest economy), monthly with roughly a five-week lag.',
    whyItMatters:
      'A leading gauge of the world economy’s direction about six months ahead; it has turned down before recessions and up before recoveries.',
    tendedToMean:
      'The same convention as the US card: 6-month annualised growth below −1 means “turning down”; three consecutive monthly falls mark a slowdown.',
    cantTell:
      'Germany is one economy, not the whole euro area: export-heavy turns can mislabel the region.',
    forYou: 'The euro leg of the leading-indicator family: read it beside the euro cards in the growth lane.',
  },
  'gpr-index': {
    // 2026-10-26 gap-audit build, A-9: the war-and-tension gauge, context
    // beside VIX/COT — the SD zones speak through the state lines.
    name: 'Geopolitical Risk Index',
    ticker: 'Geopolitics',
    oneLiner:
      'How much war and tension fills the news: the shock gauge behind the oil, gold and share moves that follow.',
    lines: {
      jumping:
        'A historic-spike-class reading (more than 2 standard deviations above its decade average — the 2001, 2022-03 and 2023-10 class).',
      highRising: 'The war-scare zone (more than 1 SD above the decade average) and still rising.',
      highEasing: 'Geopolitical tension remains elevated but is easing from its scare zone.',
      typical: 'Geopolitical tension sits in its usual range for the past decade.',
      low: 'An unusually calm stretch of geopolitical news — rare, and historically no reason to relax for long.',
    },
    whatItIs:
      'The Geopolitical Risk Index of Caldara and Iacoviello: a monthly measure of war, terrorism and tension terms across major newspapers, from 1985 to today.',
    whyItMatters:
      'A measure of war and tension in the news; spikes have usually pushed oil and gold up and shares down.',
    tendedToMean:
      'The zones are measured against the index’s own trailing decade: above 1 standard deviation is the historic war-scare zone, above 2 the 2001 / 2022-03 / 2023-10 class of episodes — both recomputed on every write, never fixed numbers.',
    cantTell:
      'The index counts mentions, not severity: a loud stalemate can outscore a quiet escalation, and markets habituate to chronic tension.',
    forYou: 'The shock input to the dollar-gold-oil story: read it beside VIX and the gold cards when the news turns hot.',
  },
  'epu-us': {
    // 2026-10-26 gap-audit build, A-10: the policy-noise gauge, context
    // beside michigan-sentiment — the confidence leg.
    name: 'US policy uncertainty (EPU)',
    ticker: 'Policy uncertainty',
    oneLiner:
      'How uncertain economic-policy news is in the US: the noise level around taxes, tariffs and the Fed’s path.',
    lines: {
      jumping:
        'A historic-spike-class reading (more than 2 standard deviations above its decade average — the 2016-11, 2018-12 and 2020-03 class).',
      highRising: 'The elevated-uncertainty zone (more than 1 SD above the decade average) and still rising.',
      highEasing: 'Policy uncertainty remains elevated but is easing.',
      typical: 'Policy uncertainty sits in its usual range for the past decade.',
      low: 'An unusually quiet stretch of policy news.',
    },
    whatItIs:
      'Baker, Bloom and Davis’s US Economic Policy Uncertainty index: a monthly count of policy-related uncertainty terms in major US newspapers, from 1900 to today.',
    whyItMatters:
      'How uncertain economic-policy news is in the US; high uncertainty has historically slowed business investment and hiring.',
    tendedToMean:
      'The zones are measured against the index’s own trailing decade: above 1 standard deviation are the elections, tariff fights and debt-ceiling episodes; above 2 the historic spikes — recomputed on every write, never fixed numbers.',
    cantTell:
      'Uncertainty is not direction: a spike says decisions are being delayed, not which way the decisions go.',
    forYou: 'The confidence pair’s policy leg: read it beside Michigan sentiment for the mood under the growth numbers.',
  },
  'gpr-threats': {
    // gap-closure S4-M4.2: the threats half of the war-and-tension gauge.
    name: 'Geopolitical Risk — threats',
    ticker: 'GPR threats',
    oneLiner:
      'The share of war-and-tension news that is threats and warnings rather than realised acts.',
    lines: {
      jumping:
        'A historic-spike-class threats reading (more than 2 standard deviations above its decade average).',
      highRising: 'Threat-heavy coverage is well above its decade average and still rising.',
      highEasing: 'Threat coverage remains elevated but is easing.',
      typical: 'The threats share sits in its usual range for the past decade.',
      low: 'An unusually quiet stretch for threats in the news.',
    },
    whatItIs:
      'Caldara and Iacoviello’s threats sub-index (GPRT): the threat-related portion of the monthly Geopolitical Risk Index, from 1985 to today.',
    whyItMatters:
      'How much of the war-and-tension news stream is warnings: the mix beside the acts card shows what the coverage is made of.',
    tendedToMean:
      'The zones are measured against the sub-index’s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'A threats reading measures newspaper coverage, not events on the ground; it is not a forecast of acts.',
    forYou: 'The threats half of the war-and-tension gauge — read it beside the acts card and the headline index.',
  },
  'gpr-acts': {
    name: 'Geopolitical Risk — acts',
    ticker: 'GPR acts',
    oneLiner:
      'The share of war-and-tension news that is realised acts rather than threats and warnings.',
    lines: {
      jumping:
        'A historic-spike-class acts reading (more than 2 standard deviations above its decade average).',
      highRising: 'Acts-heavy coverage is well above its decade average and still rising.',
      highEasing: 'Acts coverage remains elevated but is easing.',
      typical: 'The acts share sits in its usual range for the past decade.',
      low: 'An unusually quiet stretch for acts in the news.',
    },
    whatItIs:
      'Caldara and Iacoviello’s acts sub-index (GPRA): the realised-acts portion of the monthly Geopolitical Risk Index, from 1985 to today.',
    whyItMatters:
      'How much of the war-and-tension news stream is realised acts: the mix beside the threats card shows what the coverage is made of.',
    tendedToMean:
      'The zones are measured against the sub-index’s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'An acts reading measures newspaper coverage, not a tally of events; quiet coverage is not the same as quiet facts.',
    forYou: 'The acts half of the war-and-tension gauge — read it beside the threats card and the headline index.',
  },
  'gpr-daily': {
    name: 'Geopolitical Risk (7-day average)',
    ticker: 'GPR weekly',
    oneLiner:
      'The war-and-tension gauge averaged over the latest week of daily readings.',
    lines: {
      jumping:
        'A historic-spike-class week (more than 2 standard deviations above the decade average of weekly readings).',
      highRising: 'The weekly average is well above its decade average and still rising.',
      highEasing: 'The weekly average remains elevated but is easing.',
      typical: 'The weekly average sits in its usual range for the past decade.',
      low: 'An unusually calm stretch of weeks.',
    },
    whatItIs:
      'Caldara and Iacoviello’s daily Geopolitical Risk Index, averaged over 7 days by the provider (GPRD_MA7); the file trails the calendar by about a week.',
    whyItMatters:
      'A fresher read on the same news stream the monthly card measures: the weekly average smooths single-day spikes.',
    tendedToMean:
      'The zones are measured against the weekly average’s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'The provider’s file trails the calendar by about a week, so the reading describes last week, not today.',
    forYou: 'The timely half of the war-and-tension gauge — read it beside the monthly average it tracks.',
  },
  'gpr-taiwan': {
    name: 'Geopolitical Risk — Taiwan',
    ticker: 'GPR Taiwan',
    oneLiner:
      'How much war-and-tension news mentions Taiwan, as a share of that news stream.',
    lines: {
      jumping:
        'A historic-spike-class reading (more than 2 standard deviations above its decade average).',
      highRising: 'Taiwan’s share of tension coverage is well above its decade average and still rising.',
      highEasing: 'Taiwan’s coverage share remains elevated but is easing.',
      typical: 'Taiwan’s share of tension coverage sits in its usual range for the past decade.',
      low: 'An unusually quiet stretch for Taiwan in the tension news.',
    },
    whatItIs:
      'Caldara and Iacoviello’s country index for Taiwan (GPRC_TWN): war-and-tension newspaper coverage that mentions Taiwan, monthly from 1985.',
    whyItMatters:
      'Which places dominate the war-and-tension news stream: Taiwan’s share is the east-Asia lens beside China’s.',
    tendedToMean:
      'The zones are measured against the country index’s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'Country coverage is not country risk: a quiet month can mean calm, or simply that attention moved elsewhere.',
    forYou: 'The country lens on the war-and-tension gauge; a large share here also matters for Asia-bound trade routes.',
  },
  'gpr-china': {
    name: 'Geopolitical Risk — China',
    ticker: 'GPR China',
    oneLiner:
      'How much war-and-tension news mentions China, as a share of that news stream.',
    lines: {
      jumping:
        'A historic-spike-class reading (more than 2 standard deviations above its decade average).',
      highRising: 'China’s share of tension coverage is well above its decade average and still rising.',
      highEasing: 'China’s coverage share remains elevated but is easing.',
      typical: 'China’s share of tension coverage sits in its usual range for the past decade.',
      low: 'An unusually quiet stretch for China in the tension news.',
    },
    whatItIs:
      'Caldara and Iacoviello’s country index for China (GPRC_CHN): war-and-tension newspaper coverage that mentions China, monthly from 1985.',
    whyItMatters:
      'Which places dominate the war-and-tension news stream: China’s share sits beside the factory gauge in the China view.',
    tendedToMean:
      'The zones are measured against the country index’s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'Country coverage is not country risk: a quiet month can mean calm, or simply that attention moved elsewhere.',
    forYou: 'The China lens on the war-and-tension gauge, beside the China factory and CPI cards.',
  },
  'gpr-russia': {
    name: 'Geopolitical Risk — Russia',
    ticker: 'GPR Russia',
    oneLiner:
      'How much war-and-tension news mentions Russia, as a share of that news stream.',
    lines: {
      jumping:
        'A historic-spike-class reading (more than 2 standard deviations above its decade average).',
      highRising: 'Russia’s share of tension coverage is well above its decade average and still rising.',
      highEasing: 'Russia’s coverage share remains elevated but is easing.',
      typical: 'Russia’s share of tension coverage sits in its usual range for the past decade.',
      low: 'An unusually quiet stretch for Russia in the tension news.',
    },
    whatItIs:
      'Caldara and Iacoviello’s country index for Russia (GPRC_RUS): war-and-tension newspaper coverage that mentions Russia, monthly from 1985.',
    whyItMatters:
      'Which places dominate the war-and-tension news stream: Russia’s share is the energy-linked lens beside Ukraine’s.',
    tendedToMean:
      'The zones are measured against the country index’s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'Country coverage is not country risk: a quiet month can mean calm, or simply that attention moved elsewhere.',
    forYou: 'The Russia lens on the war-and-tension gauge — read it beside the Ukraine card.',
  },
  'gpr-ukraine': {
    name: 'Geopolitical Risk — Ukraine',
    ticker: 'GPR Ukraine',
    oneLiner:
      'How much war-and-tension news mentions Ukraine, as a share of that news stream.',
    lines: {
      jumping:
        'A historic-spike-class reading (more than 2 standard deviations above its decade average).',
      highRising: 'Ukraine’s share of tension coverage is well above its decade average and still rising.',
      highEasing: 'Ukraine’s coverage share remains elevated but is easing.',
      typical: 'Ukraine’s share of tension coverage sits in its usual range for the past decade.',
      low: 'An unusually quiet stretch for Ukraine in the tension news.',
    },
    whatItIs:
      'Caldara and Iacoviello’s country index for Ukraine (GPRC_UKR): war-and-tension newspaper coverage that mentions Ukraine, monthly from 1985.',
    whyItMatters:
      'Which places dominate the war-and-tension news stream: Ukraine’s share is the grain-and-energy-linked lens beside Russia’s.',
    tendedToMean:
      'The zones are measured against the country index’s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'Country coverage is not country risk: a quiet month can mean calm, or simply that attention moved elsewhere.',
    forYou: 'The Ukraine lens on the war-and-tension gauge — read it beside the Russia card.',
  },
  'gpr-israel': {
    name: 'Geopolitical Risk — Israel',
    ticker: 'GPR Israel',
    oneLiner:
      'How much war-and-tension news mentions Israel, as a share of that news stream.',
    lines: {
      jumping:
        'A historic-spike-class reading (more than 2 standard deviations above its decade average).',
      highRising: 'Israel’s share of tension coverage is well above its decade average and still rising.',
      highEasing: 'Israel’s coverage share remains elevated but is easing.',
      typical: 'Israel’s share of tension coverage sits in its usual range for the past decade.',
      low: 'An unusually quiet stretch for Israel in the tension news.',
    },
    whatItIs:
      'Caldara and Iacoviello’s country index for Israel (GPRC_ISR): war-and-tension newspaper coverage that mentions Israel, monthly from 1985.',
    whyItMatters:
      'Which places dominate the war-and-tension news stream: Israel’s share is the Middle-East lens beside Saudi Arabia’s.',
    tendedToMean:
      'The zones are measured against the country index’s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'Country coverage is not country risk: a quiet month can mean calm, or simply that attention moved elsewhere.',
    forYou: 'The Israel lens on the war-and-tension gauge — read it beside the Saudi card.',
  },
  'gpr-saudi': {
    name: 'Geopolitical Risk — Saudi Arabia',
    ticker: 'GPR Saudi',
    oneLiner:
      'How much war-and-tension news mentions Saudi Arabia, as a share of that news stream.',
    lines: {
      jumping:
        'A historic-spike-class reading (more than 2 standard deviations above its decade average).',
      highRising: 'Saudi Arabia’s share of tension coverage is well above its decade average and still rising.',
      highEasing: 'Saudi Arabia’s coverage share remains elevated but is easing.',
      typical: 'Saudi Arabia’s share of tension coverage sits in its usual range for the past decade.',
      low: 'An unusually quiet stretch for Saudi Arabia in the tension news.',
    },
    whatItIs:
      'Caldara and Iacoviello’s country index for Saudi Arabia (GPRC_SAU): war-and-tension newspaper coverage that mentions Saudi Arabia, monthly from 1985.',
    whyItMatters:
      'Which places dominate the war-and-tension news stream: Saudi Arabia’s share is the Gulf energy lens beside Israel’s.',
    tendedToMean:
      'The zones are measured against the country index’s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'Country coverage is not country risk: a quiet month can mean calm, or simply that attention moved elsewhere.',
    forYou: 'The Gulf lens on the war-and-tension gauge — read it beside the oil cards.',
  },
  'gpr-australia': {
    name: 'Geopolitical Risk — Australia',
    ticker: 'GPR Australia',
    oneLiner:
      'How much war-and-tension news mentions Australia, as a share of that news stream.',
    lines: {
      jumping:
        'A historic-spike-class reading (more than 2 standard deviations above its decade average).',
      highRising: 'Australia’s share of tension coverage is well above its decade average and still rising.',
      highEasing: 'Australia’s coverage share remains elevated but is easing.',
      typical: 'Australia’s share of tension coverage sits in its usual range for the past decade.',
      low: 'An unusually quiet stretch for Australia in the tension news.',
    },
    whatItIs:
      'Caldara and Iacoviello’s country index for Australia (GPRC_AUS): war-and-tension newspaper coverage that mentions Australia, monthly from 1985.',
    whyItMatters:
      'Which places dominate the war-and-tension news stream: Australia’s share is the home lens on the world tension gauge.',
    tendedToMean:
      'The zones are measured against the country index’s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'Country coverage is not country risk: a quiet month can mean calm, or simply that attention moved elsewhere.',
    forYou: 'The Australia lens on the war-and-tension gauge, beside the Australian currency cards.',
  },
  'tpu-us': {
    name: 'US trade policy uncertainty',
    ticker: 'Trade uncertainty',
    oneLiner:
      'How much US news is about trade-policy uncertainty: the tariff-and-trade-fight share of policy coverage.',
    lines: {
      jumping:
        'A historic-spike-class reading (more than 2 standard deviations above its decade average — the measured tariff-war episodes).',
      highRising: 'Trade-policy uncertainty is well above its decade average and still rising.',
      highEasing: 'Trade-policy uncertainty remains elevated but is easing.',
      typical: 'Trade-policy uncertainty sits in its usual range for the past decade.',
      low: 'An unusually quiet stretch for trade-policy news.',
    },
    whatItIs:
      'Baker, Bloom and Davis’s US Trade Policy Uncertainty index: the trade-policy column of their categorical EPU measure, monthly from 1985.',
    whyItMatters:
      'How much of US policy news is about trade: high readings have historically come with harder planning for importers and exporters.',
    tendedToMean:
      'The zones are measured against the index’s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'Uncertainty is not direction: a high reading says trade policy dominates the news, not which way it goes.',
    forYou: 'The trade leg of the policy-noise pair: read it beside the wider uncertainty gauge and the world-friction cards.',
  },
  // gap-closure S4-M4.3 (2026-11-01): the chokepoint cards. The number is
  // the provider's own 7-day average of estimated daily transits; the
  // comparison lines quote the reading's own chokepointCompare block
  // ({n} more/fewer transits a day) — measurements and tendencies only,
  // never an event as a cause.
  'chokepoint-suez': {
    name: 'Suez Canal transits',
    ticker: 'Suez',
    oneLiner: 'How many ships a day are passing through the Suez Canal, as a 7-day average.',
    lines: {
      highRising: 'Suez traffic is well above its recent average and still rising.',
      highEasing: 'Suez traffic remains above its recent average but is easing.',
      typical: 'Suez traffic sits in its usual range for the past year.',
      low: 'Unusually few ships a day are using the canal.',
    },
    unitNote: 'ships per day (7-day average, estimate)',
    whatItIs:
      'The IMF PortWatch estimate of daily transits through the Suez Canal, from ship-tracking data; the card reads the 7-day average and shows the change against the prior four weeks and the same weeks a year earlier.',
    whyItMatters:
      'The Suez Canal is the sea shortcut between Europe and Asia: about a tenth of world sea trade normally passes through it, so the count is a direct measure of how much of that route is being used.',
    tendedToMean:
      'The zones are measured against the strait\u2019s own trailing window, recomputed on every write — never fixed numbers.',
    cantTell:
      'The count is an estimate from ship-tracking data and is revised; a lower number says less traffic, never by itself why.',
    forYou: 'The Europe-Asia freight gate: read it beside its Red Sea approach and the oil price.',
  },
  'chokepoint-panama': {
    name: 'Panama Canal transits',
    ticker: 'Panama',
    oneLiner: 'How many ships a day are passing through the Panama Canal, as a 7-day average.',
    lines: {
      highRising: 'Panama traffic is well above its recent average and still rising.',
      highEasing: 'Panama traffic remains above its recent average but is easing.',
      typical: 'Panama traffic sits in its usual range for the past year.',
      low: 'Unusually few ships a day are crossing the canal.',
    },
    unitNote: 'ships per day (7-day average, estimate)',
    whatItIs:
      'The IMF PortWatch estimate of daily transits through the Panama Canal, from ship-tracking data; the card reads the 7-day average and shows the change against the prior four weeks and the same weeks a year earlier.',
    whyItMatters:
      'The Panama Canal links the Atlantic and the Pacific: the count measures how much of that crossing is being used, and its water levels set an independent limit no other gate shares.',
    tendedToMean:
      'The zones are measured against the canal\u2019s own trailing window, recomputed on every write — never fixed numbers.',
    cantTell:
      'The count is an estimate from ship-tracking data and is revised; a lower number says less traffic, never by itself why.',
    forYou: 'The Atlantic-Pacific gate: read it beside Suez — the two canals carry different trades.',
  },
  'chokepoint-bab-el-mandeb': {
    name: 'Bab el-Mandeb transits',
    ticker: 'Bab el-Mandeb',
    oneLiner: 'How many ships a day are passing the strait into the Red Sea, as a 7-day average.',
    lines: {
      highRising: 'Bab el-Mandeb traffic is well above its recent average and still rising.',
      highEasing: 'Bab el-Mandeb traffic remains above its recent average but is easing.',
      typical: 'Bab el-Mandeb traffic sits in its usual range for the past year.',
      low: 'Unusually few ships a day are entering the Red Sea gate.',
    },
    unitNote: 'ships per day (7-day average, estimate)',
    whatItIs:
      'The IMF PortWatch estimate of daily transits through the Bab el-Mandeb Strait, from ship-tracking data; the card reads the 7-day average and shows the change against the prior four weeks and the same weeks a year earlier.',
    whyItMatters:
      'Bab el-Mandeb is the gate into the Red Sea on the Suez approach: most Suez traffic between Europe and Asia also passes here, so the pair reads as one route.',
    tendedToMean:
      'The zones are measured against the strait\u2019s own trailing window, recomputed on every write — never fixed numbers.',
    cantTell:
      'The count is an estimate from ship-tracking data and is revised; a lower number says less traffic, never by itself why.',
    forYou: 'The Red Sea gate: read it beside the Suez count — one route, two measurements.',
  },
  'chokepoint-malacca': {
    name: 'Strait of Malacca transits',
    ticker: 'Malacca',
    oneLiner: 'How many ships a day are passing through the Strait of Malacca, as a 7-day average.',
    lines: {
      highRising: 'Malacca traffic is well above its recent average and still rising.',
      highEasing: 'Malacca traffic remains above its recent average but is easing.',
      typical: 'Malacca traffic sits in its usual range for the past year.',
      low: 'Unusually few ships a day are using the strait.',
    },
    unitNote: 'ships per day (7-day average, estimate)',
    whatItIs:
      'The IMF PortWatch estimate of daily transits through the Strait of Malacca, from ship-tracking data; the card reads the 7-day average and shows the change against the prior four weeks and the same weeks a year earlier.',
    whyItMatters:
      'Malacca is the main artery between the Indian Ocean and east Asia — the shortest route for the region\u2019s raw materials and finished goods, including Australian coal and iron ore exports.',
    tendedToMean:
      'The zones are measured against the strait\u2019s own trailing window, recomputed on every write — never fixed numbers.',
    cantTell:
      'The count is an estimate from ship-tracking data and is revised; a lower number says less traffic, never by itself why.',
    forYou: 'The east-Asia freight gate: read it beside the Taiwan Strait and China\u2019s factory gauge.',
  },
  'chokepoint-taiwan': {
    name: 'Taiwan Strait transits',
    ticker: 'Taiwan Strait',
    oneLiner: 'How many ships a day are passing through the Taiwan Strait, as a 7-day average.',
    lines: {
      highRising: 'Taiwan Strait traffic is well above its recent average and still rising.',
      highEasing: 'Taiwan Strait traffic remains above its recent average but is easing.',
      typical: 'Taiwan Strait traffic sits in its usual range for the past year.',
      low: 'Unusually few ships a day are crossing the strait.',
    },
    unitNote: 'ships per day (7-day average, estimate)',
    whatItIs:
      'The IMF PortWatch estimate of daily transits through the Taiwan Strait, from ship-tracking data; the card reads the 7-day average and shows the change against the prior four weeks and the same weeks a year earlier.',
    whyItMatters:
      'The Taiwan Strait is one of the busiest shipping lanes in the world; the traffic count is the measured flow beside the tension gauge of the same waters.',
    tendedToMean:
      'The zones are measured against the strait\u2019s own trailing window, recomputed on every write — never fixed numbers.',
    cantTell:
      'The count is an estimate from ship-tracking data and is revised; a lower number says less traffic, never by itself why.',
    forYou: 'The north-east Asia freight gate: read it beside the Taiwan tension gauge.',
  },
  // gap-closure S4-M4.4 (2026-11-01): the supply-chain and energy cards.
  // The units are stated on every card ($/mt vs $/mmbtu vs million barrels
  // vs million barrels a day — the M4.1 note); measurements and tendencies
  // only, never an event as a cause.
  gscpi: {
    name: 'Global supply chain pressure',
    ticker: 'Supply pressure',
    oneLiner: 'How stretched the world\u2019s delivery chains are, as a single index.',
    lines: {
      highRising: 'Supply chain pressure is well above its recent average and still rising.',
      highEasing: 'Pressure remains above its recent average but is easing.',
      typical: 'Supply chain pressure sits near its typical range of the past decade.',
      low: 'Delivery chains are running freer than usual.',
    },
    unitNote: 'standard deviations from the global average (zero = average)',
    whatItIs:
      'The New York Fed\u2019s Global Supply Chain Pressure Index, monthly — transport costs and manufacturing survey answers combined into one standardised number. The publisher\u2019s own notice says the index is currently published with limited data; the card shows the months the file carries.',
    whyItMatters:
      'When the index is high, moving goods tends to take longer and cost more — pressure that tends to show up in goods prices with a lag.',
    tendedToMean:
      'The zones are read as z-scores against the index\u2019s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'A single month\u2019s print is noisy; the index says how stretched chains are, never which event stretched them.',
    forYou: 'The delivery-chain lens on prices: read it beside the inflation cards and the chokepoint traffic.',
  },
  'us-spr': {
    name: 'US strategic petroleum reserve',
    ticker: 'SPR',
    oneLiner: 'How much crude oil the US government holds in its strategic reserve, in millions of barrels.',
    lines: {
      highRising: 'The reserve is above its recent average and still being refilled.',
      highEasing: 'The reserve remains above its recent average, with the refill easing.',
      typical: 'The reserve sits in its usual range for the past decade.',
      low: 'The reserve is unusually low for the past decade.',
    },
    unitNote: 'millions of barrels (weekly level)',
    whatItIs:
      'The EIA\u2019s weekly count of crude oil held in the US Strategic Petroleum Reserve — the government-owned stock, separate from the commercial inventories card.',
    whyItMatters:
      'The reserve is the country\u2019s measured cushion of crude: a lower level says the cushion is thinner, nothing more.',
    tendedToMean:
      'The zones are measured against the reserve\u2019s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'The level says how big the cushion is, never why it changed.',
    forYou: 'The supply cushion beside the oil price: read it with commercial inventories.',
  },
  'us-crude-production': {
    name: 'US crude oil production',
    ticker: 'US output',
    oneLiner: 'How much crude oil US fields pump each day, in millions of barrels.',
    lines: {
      highRising: 'US production is above its recent average and still rising.',
      highEasing: 'Production remains above its recent average but is easing.',
      typical: 'US production sits in its usual range for the past decade.',
      low: 'US production is unusually low for the past decade.',
    },
    unitNote: 'millions of barrels per day (weekly)',
    whatItIs:
      'The EIA\u2019s weekly estimate of US field production of crude oil — the supply side of the oil balance, in barrels per day (a rate, unlike the reserve\u2019s level).',
    whyItMatters:
      'Production is the domestic supply leg of the oil balance: more output tends to lean against price pressure, less tends to lean with it.',
    tendedToMean:
      'The zones are measured against production\u2019s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'The rate says how much is being pumped, never why the rig count or wells changed.',
    forYou: 'The supply leg beside the oil price and inventories.',
  },
  'coal-aus': {
    name: 'Australian coal price',
    ticker: 'Coal',
    oneLiner: 'The world price of Australian coal, in US dollars per metric ton.',
    lines: {
      highRising: 'Coal is well above its recent average and still rising.',
      highEasing: 'Coal remains above its recent average but is easing.',
      typical: 'Coal sits in its usual range for the past decade.',
      low: 'Coal is unusually cheap for the past decade.',
    },
    unitNote: 'US dollars per metric ton',
    whatItIs:
      'The World Bank\u2019s monthly price for Australian coal — the Newcastle benchmark the seaborne trade prices against.',
    whyItMatters:
      'Coal is one of Australia\u2019s largest energy exports: its world price feeds directly into Australia\u2019s export income and terms of trade.',
    tendedToMean:
      'The zones are measured against the price\u2019s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'The price says what a tonne fetches, never by itself why the demand or supply shifted.',
    forYou: 'An Australian export price: read it beside iron ore and the terms-of-trade gauge.',
  },
  'lng-japan': {
    name: 'LNG price (Japan)',
    ticker: 'LNG',
    oneLiner: 'The price of liquefied natural gas delivered to Japan, in US dollars per MMBtu.',
    lines: {
      highRising: 'LNG is well above its recent average and still rising.',
      highEasing: 'LNG remains above its recent average but is easing.',
      typical: 'LNG sits in its usual range for the past decade.',
      low: 'LNG is unusually cheap for the past decade.',
    },
    unitNote: 'US dollars per MMBtu',
    whatItIs:
      'The World Bank\u2019s monthly price for liquefied natural gas delivered to Japan — the Asia-Pacific benchmark for shipped gas.',
    whyItMatters:
      'Australia is one of the world\u2019s largest LNG exporters, and Asia\u2019s benchmark price is what the region\u2019s cargoes — including Australian ones — tend to price against.',
    tendedToMean:
      'The zones are measured against the price\u2019s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'The price says what shipped gas fetches, never by itself why demand or supply shifted.',
    forYou: 'Australia\u2019s other big energy export: read it beside coal and the terms-of-trade gauge.',
  },
  'gas-europe': {
    name: 'European natural gas price',
    ticker: 'Europe gas',
    oneLiner: 'The price of natural gas in Europe, in US dollars per MMBtu.',
    lines: {
      highRising: 'European gas is well above its recent average and still rising.',
      highEasing: 'European gas remains above its recent average but is easing.',
      typical: 'European gas sits in its usual range for the past decade.',
      low: 'European gas is unusually cheap for the past decade.',
    },
    unitNote: 'US dollars per MMBtu',
    whatItIs:
      'The World Bank\u2019s monthly price for European natural gas — the continent\u2019s benchmark, the Atlantic twin of the Japan LNG price.',
    whyItMatters:
      'Gas is a big input for European industry and electricity: its price tends to move European energy costs, and to travel to other regions through the shipped-gas market.',
    tendedToMean:
      'The zones are measured against the price\u2019s own trailing decade, recomputed on every write — never fixed numbers.',
    cantTell:
      'The price says what gas fetches in Europe, never by itself why demand or supply shifted.',
    forYou: 'The world\u2019s other gas benchmark: read it beside the LNG price and the oil price.',
  },
  'wti': {
    name: 'Oil price (WTI)',
    ticker: 'WTI',
    oneLiner: 'The price of a barrel of West Texas Intermediate crude: the benchmark oil price of the United States.',
    lines: {
      highRising: 'US oil is expensive and rising: petrol and delivery prices usually follow, with a lag.',
      highEasing: 'US oil is expensive but easing: relief for fuel costs, if it lasts.',
      typical: 'US oil is in its usual range for the decade: no unusual pressure on fuel costs.',
      low: 'US oil is cheap versus recent history: usually good news for fuel and transport costs.',
      jumping: 'US oil has jumped unusually fast: usually war or supply shocks; wait before reading a trend.',
    },
    unitNote: 'US dollars per barrel',
    whatItIs: 'West Texas Intermediate crude: the price of a barrel of US oil, the benchmark for most of the Americas. The series is the spot price from the US Energy Information Administration via FRED (DCOILWTICO), the American twin of the Brent card.',
    whyItMatters: 'WTI feeds US petrol and freight costs, and the US inflation readings that move world rates.',
    tendedToMean: 'Like Brent, spikes above roughly $120 usually meant war or supply shocks; crashes below about $40 marked demand collapses.',
    cantTell: 'Supply, demand and geopolitics pull the price at once: the level alone doesn’t separate them, and it can swing far from Brent.',
    forYou: 'A rough leading input for the direction of fuel and energy costs, read alongside Brent.',
  },
  'natgas': {
    name: 'US natural gas price',
    oneLiner: 'The price of natural gas in the United States: what households and power plants face for heating and generation.',
    lines: {
      highRising: 'US natural gas is expensive and rising: winter heating and power bills usually follow.',
      highEasing: 'US natural gas is expensive but easing: relief for heating and power costs, if it lasts.',
      typical: 'US natural gas is in its usual range for the decade: no unusual pressure on heating costs.',
      low: 'US natural gas is cheap versus recent history: usually good news for heating and power bills.',
      jumping: 'Natural gas has jumped unusually fast: often weather events; wait before reading a trend.',
    },
    unitNote: 'US dollars per MMBtu',
    whatItIs: 'The Henry Hub natural gas spot price: the US benchmark, in US dollars per million British thermal units (MMBtu), weekly from the US Energy Information Administration via FRED (DHHNGSP).',
    whyItMatters: 'Natural gas heats about half of US homes and generates much of its electricity: the price feeds US household energy bills and inflation readings.',
    tendedToMean: 'Spikes came with cold winters and supply shocks (2005, 2022); long quiet stretches followed as supply caught up.',
    cantTell: 'Deeply seasonal and jumpy: one cold snap can move it far, and the US price runs apart from the gas prices Europe and Asia pay.',
    forYou: 'A rough dial for US household energy costs: dearer gas usually means dearer heating and power bills there.',
  },
  'platinum': {
    name: 'Platinum price (ounce)',
    oneLiner: 'The world price of one troy ounce of platinum, in US dollars.',
    lines: {
      highRising: 'Platinum is expensive and rising: jewellery and catalytic converters tend to cost more with it.',
      highEasing: 'Platinum is expensive but easing from its highs: pressure on metal costs slowly lifting.',
      typical: 'Platinum is trading in its usual range for the decade.',
      low: 'Platinum is cheap versus recent history: a friend to jewellery budgets and industry.',
      jumping: 'Platinum has jumped unusually fast: often supply news from South Africa; wait before reading a trend.',
    },
    unitNote: 'US dollars per troy ounce',
    whatItIs:
      'The price of platinum per troy ounce: the live gold-api spot, moving daily, with the World Bank pink-sheet monthly prices carrying the decade of history.',
    whyItMatters: 'Platinum is half precious metal, half industrial input: catalytic converters, jewellery and hydrogen equipment all pull on the same price.',
    tendedToMean: 'It spent the years after 2008 well below gold; its big runs (the 2000s, 2025–26) came with supply squeezes or demand booms.',
    cantTell: 'Rarer than gold but far more industrial: its price follows factories as much as fear, and forecasts for it are famously poor.',
    forYou:
      'Gold’s industrial sibling: the third pillar of the precious-metals board and an ingredient in catalytic converters — now priced like the other metals, every day.',
  },
  // ---- M5 Wave 2 (2026-10-24): the household-cost staples (the Pink Sheet unlock) ----
  'food-index': {
    name: 'World food prices',
    ticker: 'Food index',
    oneLiner:
      'The World Bank’s index of world food prices: groceries at the wholesale level, where supermarket shelves start.',
    lines: {
      highRising: 'World food prices are high for their decade and rising: the pipeline pressure that reaches household grocery bills months later.',
      highEasing: 'World food prices remain elevated for the decade but are easing.',
      typical: 'World food prices sit in their usual range for the decade.',
      low: 'World food prices are low for their decade: the relief setting for household grocery budgets.',
    },
    unitNote: 'index, 2010 = 100',
    whatItIs:
      'The World Bank Pink Sheet’s Food index (2010 = 100): the world prices of the main food commodities — grains, oils, sugar, meat, fruit — combined into one monthly number.',
    whyItMatters:
      'Food is the most-felt line of household inflation everywhere. Wholesale food moves months ahead of the supermarket prices households actually pay, making this an early line on grocery bills.',
    tendedToMean:
      'The 2010–12 and 2021–22 food spikes reached household budgets worldwide within months; the 2016–19 calm did the same in reverse.',
    cantTell:
      'It measures traded commodities, not local shelf prices: exchange rates, subsidies and freight decide how much reaches any one country’s basket.',
    forYou:
      'The early line on grocery bills: read it beside the energy cards — food and fuel move the cost of living more than anything else on this page.',
  },
  wheat: {
    name: 'Wheat price',
    ticker: 'US SRW wheat',
    oneLiner: 'The world price of wheat, in US dollars per metric ton.',
    lines: {
      highRising: 'Wheat is high for its decade and rising: the input pressure behind flour, bread and feed prices.',
      highEasing: 'Wheat remains elevated for its decade but is easing.',
      typical: 'The wheat price sits in its usual range for the decade.',
      low: 'Wheat is low for its decade: the cheap-input setting for food prices.',
    },
    unitNote: 'US dollars per metric ton',
    whatItIs:
      'US soft red winter wheat, the Pink Sheet’s benchmark export price, monthly in $/metric ton.',
    whyItMatters:
      'Wheat is the world’s staple grain: its price feeds directly into flour, bread and animal-feed costs, and crop failures or export bans move it sharply.',
    tendedToMean:
      'The 2010–12 and 2022 spikes followed harvest failures and the war in Ukraine’s grain trade; long calm stretches mark plentiful harvests.',
    cantTell:
      'One benchmark grade in one market: local wheat prices diverge on freight, quality and policy.',
    forYou: 'A ground-truth line under the food index: what the raw grain itself costs.',
  },
  maize: {
    name: 'Maize price',
    ticker: 'Maize',
    oneLiner: 'The world price of maize (corn), in US dollars per metric ton.',
    lines: {
      highRising: 'Maize is high for its decade and rising: pressure on feed, meat and breakfast-table prices.',
      highEasing: 'Maize remains elevated for its decade but is easing.',
      typical: 'The maize price sits in its usual range for the decade.',
      low: 'Maize is low for its decade: the cheap-feed setting for food prices.',
    },
    unitNote: 'US dollars per metric ton',
    whatItIs:
      'US maize (corn), the Pink Sheet’s benchmark export price, monthly in $/metric ton.',
    whyItMatters:
      'Maize is the largest feed grain: its price passes through to meat, dairy and eggs, and it is the crop most diverted to biofuel when energy is dear.',
    tendedToMean:
      'The 2012 US drought and the 2022 supply shock took maize to decade highs; strong harvests bring it back quickly.',
    cantTell:
      'One benchmark in one market; local prices diverge on freight, harvests and policy.',
    forYou: 'The second ground-truth line under the food index: the feed grain behind meat prices.',
  },
  'bund-10y': {
    name: 'What the German government pays to borrow for 10 years',
    ticker: 'Bund',
    oneLiner: 'The interest rate on 10-year German government debt: the euro area’s benchmark borrowing cost — a monthly average that lags the live market.',
    lines: {
      highRising: 'German borrowing costs are high and rising: loans across the euro area usually follow, with a lag.',
      highEasing: 'German borrowing costs are high but easing: relief, if it lasts, usually reaches loans with a delay.',
      typical: 'German borrowing costs are in their usual range for the decade.',
      low: 'German borrowing costs are cheap by recent standards: usually supportive for loans and asset prices.',
    },
    whatItIs: 'The average market yield on 10-year German government bonds (Bunds) over the latest full month: an OECD monthly series via FRED (IRLTLT01DEM156N) — monthly average, lagged, so it can sit behind the day’s traded yield.',
    whyItMatters: 'Germany is the euro area’s benchmark borrower: Bund yields steer borrowing costs across Europe and set the yardstick for euro government debt.',
    tendedToMean: 'The sub-zero settings of 2016–22 lent Germany money for less than nothing; the 2022–23 reset lifted yields to their highest since 2011.',
    cantTell: 'A market price, not the ECB’s setting: inflation, growth and debt-supply news move it independently of the policy rate.',
    forYou: 'Europe’s counterpart to the US 10-year: a rough dial for borrowing costs across the euro area.',
  },
  'jgb-10y': {
    // A-2 (2026-10-26 gap-audit build): the DAILY upgrade — the Ministry of
    // Finance's own jgbcme.csv (next-business-day) replaces the OECD
    // monthly mirror; the mirror stays as the labelled outage fallback.
    name: 'What the Japanese government pays to borrow for 10 years',
    ticker: 'JGB',
    oneLiner: 'The interest rate on 10-year Japanese government debt: the benchmark of the world’s most-indebted rich economy, now read daily from the ministry’s own data.',
    lines: {
      highRising: 'Japanese borrowing costs are high and rising: a rare setting that tends to tighten money worldwide.',
      highEasing: 'Japanese borrowing costs are high for the decade but easing.',
      typical: 'Japanese borrowing costs are in their usual range for the decade.',
      low: 'Japanese borrowing costs are near zero: their setting for most of the past 25 years.',
    },
    whatItIs: 'The daily market yield on 10-year Japanese government bonds (JGBs), published by Japan’s Ministry of Finance each business day (the jgbcme file’s own 10-year column; during a ministry outage the card falls back to a labelled OECD monthly average).',
    whyItMatters:
      'What Japan pays to borrow for ten years: the anchor of one of the world’s biggest saver economies, and the other half of the yen carry trade.',
    tendedToMean: 'The yield sat at or near zero from 2016 to 2024 under yield-curve control; the breakout since has ended the era of free Japanese money.',
    cantTell: 'The Bank of Japan still leans on this market: the yield reflects policy as much as markets, unlike most government bonds.',
    forYou: 'The sleeper of world bond markets: when Japanese yields move, world markets usually notice.',
  },
  'gilt-10y': {
    name: 'What the UK government pays to borrow for 10 years',
    ticker: 'Gilt',
    oneLiner: 'The interest rate on 10-year UK government debt: Britain’s benchmark borrowing cost — a monthly average that lags the live market.',
    lines: {
      highRising: 'UK borrowing costs are high and rising: mortgages and business credit usually follow, with a lag.',
      highEasing: 'UK borrowing costs are high but easing: relief, if it lasts, usually reaches loans with a delay.',
      typical: 'UK borrowing costs are in their usual range for the decade.',
      low: 'UK borrowing costs are cheap by recent standards: usually supportive for loans and asset prices.',
    },
    whatItIs: 'The average market yield on 10-year UK government bonds (gilts) over the latest full month: an OECD monthly series via FRED (IRLTLT01GBM156N) — monthly average, lagged, so it can sit behind the day’s traded yield.',
    whyItMatters: 'Gilt yields steer UK fixed-rate mortgages and the pound: the 2022 mini-budget episode showed how fast they can move.',
    tendedToMean: 'Sustained readings above 4.5% have been rare since the 1990s; the 2022 mini-budget spike was the sharpest gilt episode in decades.',
    cantTell: 'A market price, not the Bank of England’s setting: inflation, growth and fiscal news move it independently of the policy rate.',
    forYou: 'Britain’s counterpart to the US 10-year: a rough dial for UK mortgage and borrowing costs.',
  },
  'boj-rate': {
    name: 'The Japanese central bank’s policy rate',
    ticker: 'BoJ',
    oneLiner: 'The Bank of Japan’s policy rate: the dial behind the world’s longest era of ultra-cheap money — a monthly average, lagged.',
    lines: {
      highRising: 'Japanese policy is tightening: a rare turn that tends to pull cheap Japanese money back home.',
      highEasing: 'Japanese policy is tight for its decade but easing.',
      typical: 'The Bank of Japan’s rate sits in its usual range for the decade.',
      low: 'Japanese policy is at or near zero: the setting that made the yen the world’s funding currency.',
    },
    whatItIs: 'The Bank of Japan’s policy rate, measured as the average overnight call rate over the latest full month (FRED IRSTCI01JPM156N) — a monthly average, lagged: it can trail an intra-month policy change.',
    whyItMatters: 'Near-zero Japanese rates funded carry trades and cheap borrowing worldwide for decades: each step away moves the yen and global money.',
    tendedToMean: 'The rate sat at or near zero from 1999 until the 2024–26 hikes: the longest cheap-money era in modern finance.',
    cantTell: 'Like every policy rate it works with long, uneven lags, and the setting says nothing about the next decision.',
    forYou: 'The dial behind the yen’s long cheapness: context for carry-trade headlines and yen swings.',
  },
  'boe-rate': {
    name: 'The UK central bank’s policy rate',
    ticker: 'BoE',
    oneLiner: 'The Bank of England’s policy rate: the base of UK borrowing costs — current at every decision.',
    lines: {
      highRising: 'UK policy is tight and tightening: borrowing, jobs and prices usually cool with a lag.',
      highEasing: 'UK policy is tight but easing: the first stage of relief for borrowers, when it lasts.',
      typical: 'The Bank of England’s rate sits in its usual range for the decade.',
      low: 'UK policy is loose by recent standards: usually supportive for borrowing and asset prices.',
    },
    whatItIs: 'The Bank of England’s official Bank Rate, straight from the central bank’s own rate history (daily, stepping at each decision): no averaging, no lag — it moves the day the Bank decides.',
    whyItMatters: 'It anchors UK mortgages, savings and business borrowing, and it moves the pound: one of the world’s oldest policy dials.',
    tendedToMean: 'The bank cut to 0.1% in 2020, its lowest since 1694, then lifted rates to multi-decade highs by 2023.',
    cantTell: 'Like every policy rate it works with long, uneven lags, and the setting says nothing about the next decision.',
    forYou: 'The UK’s counterpart to the Fed’s dial: what it decides tends to reach British mortgage and savings rates quickly.',
  },
  'us-gdp-growth': {
    name: 'How fast the US economy is growing',
    ticker: 'GDP',
    oneLiner: 'The pace of US economic growth: how much bigger the economy got last quarter, at an annual rate.',
    lines: {
      highRising: 'US growth is faster than usual: a setting that usually keeps rate cuts far away.',
      highEasing: 'US growth is strong for the decade but slowing.',
      typical: 'US growth is near its usual pace for the decade.',
      low: 'US growth is weak or negative: the setting that usually brings rate cuts and recession talk.',
    },
    whatItIs: 'US real GDP growth for the latest quarter, annualised (FRED’s A191RL1Q225SBEA): the economy’s headline growth number, published quarterly.',
    whyItMatters: 'The US is the world’s largest economy: its growth pace sets the mood for world rates and markets everywhere.',
    tendedToMean: 'Readings near 2% are the US cruise speed; two negative quarters in a row is the classic, unofficial recession definition.',
    cantTell: 'Quarterly, revised for months after release, and an average across a continent-sized economy.',
    forYou: 'The headline answer to “how is the world economy doing?”: context for rate and market headlines.',
  },
  'us-nfp': {
    name: 'US jobs added or lost each month',
    ticker: 'NFP',
    oneLiner: 'How many jobs the US added (or shed) last month: the headline number of the monthly jobs report.',
    lines: {
      highRising: 'US hiring is strong and quickening: a setting that usually keeps world rates high.',
      highEasing: 'US hiring is strong for the decade but slowing.',
      typical: 'US job gains are near their usual pace for the decade.',
      low: 'US jobs are being lost: the reading that usually brings recession talk and rate-cut hopes.',
    },
    whatItIs: 'The monthly change in US nonfarm payrolls (FRED’s PAYEMS), in thousands of jobs: positive means jobs added, negative means jobs lost.',
    whyItMatters: 'The jobs report is the world’s most-watched monthly data release: it moves the Fed’s thinking and global markets within minutes.',
    tendedToMean: 'Roughly 100,000–200,000 new jobs a month marks a healthy US economy; sustained job losses have lined up with every modern US recession.',
    cantTell: 'One month’s number is revised for months and swings with weather and strikes: never a trend alone.',
    forYou: 'The first number markets check each month for the Fed’s direction: context, never a signal alone.',
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
    // Layer-2 prep P1 (docs/insights/layer2/INSIGHTS-L2-PREP-SPEC.md §3.4): the
    // per-card honesty line — rendered ONLY on a card whose P1 freshness is
    // stale/unavailable AND that does not already say so (the status-stale
    // cards carry the grey flag + age segment; every card's meta row carries
    // its data date). A safety net, wording deliberately unlike the header's
    // dataAsOf (that one claims currency; this one dates the data).
    cardDataAsOf: 'Data as of {date}',
    /* ----------------------------------------------------------------
     * v3 UI_SPEC §10 (2026-10-20, UI-50) — the header's data-health chip,
     * computed from the page's own readings. Worst wins: an unavailable
     * count outranks a stale one; when both exist the title carries the
     * stale count beside the visible unavailable one. Static per snapshot
     * (no aria-live — it never changes on the page).
     * -------------------------------------------------------------- */
    healthAllCurrent: 'All data current',
    healthStaleChip: '{n} stale',
    healthUnavailableChip: '{n} unavailable',
    healthTitleBoth: '{stale} stale, {unavailable} unavailable',
    healthChipHint: 'View About this data',
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
    // v3 UI_SPEC §4 (2026-10-20): "Unusual" left the DISPLAY vocabulary too
    // — the filter option was removed with the word (the tier stays
    // internal: sorting, movers, exports; the cards show "Normal").
    filterAll: 'All',
    filterLabel: 'Filter by tier',
    filterWarning: 'Needs attention',
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
    // Editorial handoff (2026-10-19, economic-indicators-editorial-spec.md
    // §10): the mobile Global-first swipe carousel's accessible furniture.
    // The cue always names the OTHER card (Global ↔ Australia), the dots
    // and the "n of m" group labels announce position, and the prev/next
    // words are direction-neutral (their meaning follows the reading flow).
    carouselLabel: 'Region overview cards',
    swipeCue: 'Swipe to view {region}',
    cardPosition: '{card} card, {n} of {m}',
    prevCard: 'Previous',
    nextCard: 'Next',
    // Round 42 (owner): the computed reason sentence ("2 of 5 areas are
    // Stressed: … The rest are Stable") and the calm line are RETIRED —
    // they repeated, word for word, what the grouped status rows now say
    // (the roast: "it's everything and nothing because it's confusing").
    // The grouping IS the sentence now; heroReason stays in config, pinned
    // by its own tests.
    heroGaugesLabel: 'The gauges behind this verdict',
    // UI-fidelity round (2026-10-19, the owner's correction brief §7
    // "Contextual explanation panel"): the Global card's explanation panel
    // heading — the raised world-section signals (markets / currencies)
    // ride under it on the pale-red surface.
    worldSignalsTitle: 'World signals',
    // Owner round 4 (2026-10-20): the Australia card grows the SAME
    // emphasized signals box — its proper data is its OWN areas. One bullet
    // per gauge: the raised areas carry their n-of-m counts and state word
    // (the markets bullet's shape); the calm and unreadable ones sit in the
    // quiet ink beside them.
    australiaSignalsTitle: 'Australia signals',
    australiaSignalArea: '{area} · {word}: {warnings} of {voting} indicators need attention.',
    // 2026-10-21c owner round: the raised bullet names the flagged
    // indicators with their live values (additional data, not the counts
    // the area headers already carry).
    australiaSignalNamed: '{area} · {word} — {list}.',
    australiaSignalMore: 'and {n} more',
    // 2026-10-21 owner round: the ContinueStrip ("Keep reading" — the
    // one-line chevron row under the hero) is RETIRED with its key; the
    // sticky JumpNav pills already carry the same labels and the same
    // expand-then-scroll navigation.
    inAlert: '{warnings} of {voting} indicators need attention',
    /** The count line's variant when the world-markets signal is raised
     * (world-markets spec §5.3 / build step 9: the section signal appears
     * in the transparent count AND in alerts) — the markets join the count
     * as one more attention item, named in plain words. */
    noSummary: 'Not enough voting data to read the gauges yet.',
    /* ----------------------------------------------------------------
     * v3 UI_SPEC §3.1 (2026-10-20, UI-01..UI-08) — the rebuilt hero:
     * verdict word + generated sentence, reading bar, why-3, calm line,
     * what's next, freshness chip, alert box. All templates interpolate
     * count inputs from the gauge steps (config/hero.ts heroSentence):
     * no free text, no conclusions, no forecasts.
     * -------------------------------------------------------------- */
    heroSentenceCalm: 'All {n} gauges are calm right now.',
    heroSentenceAttention: '{areas} {isAre} attention: {k} of {n} gauges.',
    heroSentenceAnd: 'and',
    heroSentenceListSep: ', ',
    heroSentenceMore: '+{n} more',
    heroSentenceNeeds: 'needs',
    heroSentenceNeed: 'need',
    // UI-02 reading bar: the counts text beside the three-segment bar.
    heroCountsAttention: '{n} need attention',
    heroCountsNormal: '{n} normal',
    heroCountsCantTell: "{n} can't tell right now",
    heroCountsAria: "Gauge readings: {attention} need attention, {normal} normal, {cantTell} can't tell right now",
    // UI-03: the why list's accessible name.
    heroWhyLabel: 'Why: the readings behind this verdict',
    // UI-04: the calm line names up to three calm areas.
    heroCalmLine: 'Calm: {areas}',
    // UI-05: the next calendar event with its relative days.
    heroNextLine: 'Next: {title}, {date} · {when}',
    // UI-06: the freshness chip (the stale count links to About).
    heroFreshness: 'Updated {time} UTC',
    heroStaleSuffix: '{n} stale',
    // S1-M1.4 (2026-10-31): the calm out-of-date badge on the hero verdict
    // cards and the gauge headers — plain wording, no alarmist colour; the
    // card itself is never hidden.
    staleReadingsBadge: '{n} of {total} readings out of date',
    // gap-closure S4-M4.3 (2026-11-01): the shadow-gauge header — a gauge
    // whose members are all context-only (G-5) never claims a verdict; the
    // plain words say so, and the count line reads the context readings.
    gaugeNotScored: 'not scored yet',
    gaugeContextCount: '{n} context readings',
    // UI-08: the alert box (a stale or unavailable reading sits inside a
    // gauge whose members voted).
    heroAlertStaleLine: 'Some inputs are stale or missing — read the counts with care.',
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
    /* ----------------------------------------------------------------
     * v3 UI_SPEC §10 (2026-10-20, UI-49) — the About rework: the per-source
     * table (rows from the generated data/indicator-audit.json sidecar,
     * grouped one row per provider), the rule-version line with the plain
     * repository path (no invented hosted URL), the unavailable-card list
     * and the M-7 contact line (RULES §3; the URL stays Latin).
     * -------------------------------------------------------------- */
    statusUnavailableCards: "Cards that can't be read right now:",
    aboutColSource: 'Source',
    aboutColAttribution: 'Attribution',
    aboutColLicence: 'Licence',
    aboutColLevel: 'Level',
    aboutColEnabled: 'Enabled',
    aboutLevelL0: 'L0 — public display clearly allowed (open licence or public domain).',
    aboutLevelL1: 'L1 — probably fine for a non-commercial public site; the terms are not explicit.',
    aboutLevelL2: "L2 — terms restrict display or reuse; shown under the owner's recorded acceptance.",
    aboutLevelL3: 'L3 — never copied; linked out only.',
    aboutLevelMixed: "Levels {levels} across this source's series.",
    aboutSourceOn: 'On',
    aboutSourceOff: 'Off',
    aboutSourcePartly: '{n} of {m} switched off',
    aboutSeriesCount: '{n} series',
    aboutKillSwitchNote: 'A switched-off source is not fetched and its cards are not shown.',
    aboutRuleVersionLine: 'Rule version {v} — changes recorded in the repository: {path}',
    aboutContactLine: 'Questions about this data? Contact: {url}',
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
    /* ----------------------------------------------------------------
     * v3 UI_SPEC §5 (2026-10-20, UI-18/UI-19) — the moves-and-next strip
     * under the hero: the biggest movers (|moveScore| ranked) beside the
     * next calendar events; each item states its period and opens its card
     * (or scrolls to the calendar).
     * -------------------------------------------------------------- */
    movesNextTitle: 'Moves and what is next',
    stripChange7d: '7-day change',
    stripChange30d: '30-day change',
    // H5 retired (owner, 2026-10-21c): the hero's what-changed line is
    // removed — the week's status changes live in the full data export +
    // CSV. (Round-2 R16 note kept: “Next up” lives once, below the
    // indicators.)
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
    /* ----------------------------------------------------------------
     * v3 UI_SPEC §10 (2026-10-20, UI-47) — the calendar's per-event
     * time-zone labels, rendered only when the event carries a tz. The map
     * covers exactly the zone names present in data/insights-calendar.json.
     * -------------------------------------------------------------- */
    tzSydney: 'Sydney time',
    tzUsEastern: 'US Eastern',
    tzFrankfurt: 'Frankfurt time',
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
    // 2026-10-21 owner round ("add the same option for prices … oil
    // silver gold and bitcoin can be seen in different time formats by
    // those toggle"): the prices board grows the MAP's four-lens period
    // switch (Today | 1 week | 1 month | 1 year) — the trend row, the
    // sparkline, the trend word and the briefing all measure the SAME
    // selected window, so the briefing templates and the sparkline aria
    // interpolate {period} instead of hardcoding "the past seven days".
    past7days: 'Past 7 days',
    pastToday: 'Today',
    // The switch's own labels + aria (mirroring markets.map.periodToday…).
    pricePeriodSwitchAria: 'Choose the period shown on the price cards',
    pricePeriodToday: 'Today',
    pricePeriodWeek: '1 week',
    pricePeriodMonth: '1 month',
    pricePeriodYear: '1 year',
    /** 2026-10-27 owner round ("add five year and 3 months to all view
     * points"): the two new lenses' switch words — the SAME wording the
     * map's own switch speaks (markets.map.period3M / period5Y). */
    pricePeriod3M: '3 months',
    pricePeriod5Y: '5 years',
    // The {period} words the briefing templates and the sparkline aria
    // interpolate (one per lens — "over the past seven days" / "today").
    sumPeriod7d: 'over the past seven days',
    sumPeriod30d: 'over the past 30 days',
    sumPeriod1y: 'over the past year',
    sumPeriodToday: 'today',
    /** 2026-10-27: the new lenses' briefing phrases (the {period} the
     * templates interpolate — the SAME wording family as above). */
    sumPeriod3M: 'over the past 3 months',
    sumPeriod5Y: 'over the past 5 years',
    trendUp: 'Recent movement has been upward',
    trendDown: 'Recent movement has been downward',
    trendRange: 'Recent movement has been mostly range-bound',
    trendMixed: 'No clear direction is evident',
    trendInsufficient: 'Not enough data to assess the trend',
    trendUnavailable: 'Trend unavailable for this period',
    trendIncomplete: 'Data for this period is incomplete; the chart may not show the full picture.',
    sparklineAria: '{asset} price movement {period}: {change}',
    dailyChangeLabel: 'Daily change',
    dailyChangeBasis: 'vs the previous stored close',
    updatedUnknown: 'Update time is unknown.',
    dataDelayed: 'Data may be delayed.',
    priceUnavailableCard: 'Price is currently unavailable.',
    sumUnavailable: 'There is not enough data to provide a reliable summary.',
    sumUp: '{asset} has risen {period}.',
    sumDown: '{asset} has declined {period}.',
    sumRange: '{asset} has moved mostly within a range {period}; the available data shows no clear direction.',
    sumMixed: 'Movement of {asset} has been uneven {period}, so the available data does not show a clear direction.',
    sumHedge: 'This describes the selected period and does not, by itself, establish the next move.',
    sumBtcHedge: 'This movement may not persist, and short-term volatility can remain high.',
    sumBtcMixed: '{asset} has fluctuated {period}.',
    sumOilDrivers: 'Explaining the drivers would require supporting evidence about supply, demand, and market conditions.',
    moreDetails: 'More details',
    changesLabel: 'Changes',
    change30dLabel: 'Past 30 days',
    /** 2026-10-27 owner round ("add five year and 3 months to all view
     * points"): the 3-month and 5-year lenses' own row labels (the
     * «X گذشته» family the other lenses already speak). */
    past90days: 'Past 3 months',
    past5y: 'Past 5 years',
    /** 2026-10-29 owner round ("it can show top 5 changes"): the sticky
     * nav's top-movers strip label. */
    moversTitle: 'Biggest changes · 30 days',
    /** 2026-10-29 owner round (the timeframe reference price): the
     * parenthetical beside the main price when a period lens is selected —
     * the window's own starting price, so the percentage's basis is on the
     * card ("(1 year start: US$82.4)"). */
    priceAtWindowStart: '{period} start: {value}',
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
    // v3 §4 (2026-10-20): the details line speaks the six-word vocabulary
    // too — the retired "Check pending" display word is gone everywhere.
    checkPendingLine: "Can't tell right now — {reason}",
    // Fix spec A-02 (2026-10-14): the needs-attention line is GENERATED from
    // the reading's rule and value (the hand-written meanings are gone).
    attentionLine: 'Now {value} — in the zone its rule watches: {rule}.',
    // S1-M1.6 #4: the 30-day speed beside a percentile-zone level claim.
    attentionLineSpeed: '({pct} over the last 30 days)',
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
    /* ----------------------------------------------------------------
     * v3 UI_SPEC §6 (2026-10-20, UI-20..UI-23) — the one card anatomy.
     * Meta row, in order: data for {period} · released {date} · updated
     * {HH:mm UTC} · Source (link). The source is BACK ON the card face per
     * the v3 spec — this reverses the round-2 "sources off the cards"
     * request; the v3 UI_SPEC governs (noted in AlertCard/CompactRow too).
     * -------------------------------------------------------------- */
    updatedUtcTime: 'updated {time} UTC',
    staleAgeDays: '{n} days old',
    // v3 §4: the face reason line when a reading cannot be told — the
    // one-liner for an unavailable source with no structured flag reason.
    cantTellFaceUnavailable: 'The source did not update on the last refresh.',
    // v3 §4: no-history displays as Context — the value stays, the reason
    // rides the face in one line.
    noHistoryFace: 'Not enough stored history to evaluate its rule yet.',
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
    // v3 UI-22 (2026-10-20): the details facts block carries the fetched
    // time in UTC — the same clock the card faces' meta rows speak.
    fetchedAtUtc: 'Fetched: {date} · {time} UTC',
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
    /* ----------------------------------------------------------------
     * v3 UI_SPEC §10 (2026-10-20, UI-51 + RULES M-3) — the export tool is
     * owner-only: the Tools-menu unlock (bearer token pasted into a masked
     * input, never stored beyond the HttpOnly session cookie, never logged,
     * cleared after submit), the Owner badge, and the server-built audit
     * export (GET /api/insights/export, the E-23 columns).
     * -------------------------------------------------------------- */
    ownerToolsLabel: 'Owner tools',
    ownerSignIn: 'Owner sign-in',
    ownerTokenLabel: 'Owner token',
    ownerSignInSubmit: 'Sign in',
    ownerSignInWrong: 'Token not recognised.',
    ownerSignInDisabled: 'Export is disabled — the owner token secret is not set.',
    ownerSignInFailed: 'Sign-in did not complete — try again.',
    ownerBadge: 'Owner',
    ownerSignOut: 'Sign out',
    ownerSignedOutNote: 'Owner tools stay hidden until the next sign-in.',
    exportServerLabel: 'Full audit export (server)',
    exportServerNote: 'Every section with the audit columns, built by the server.',
    exportServerFailed: 'The server export did not complete — try again.',
    exportSection: 'Section',
    exportDetail: 'Details',
    exportPosition: 'Position',
    exportColDate: 'Date',
    exportRuleVersion: 'Rule version: {v}',
    exportVerdictCounts: '{warning} of {voting} in warning',
    // Step 3 L2-02: the price row's 200-day average line.
    ma200Above: '{pct} above its 200-day average',
    ma200Below: '{pct} below its 200-day average',
    // R9-01 (2026-10-27): the Step 3 L2-03 US-shares-in-AUD box was retired
    // at the owner's request — its usAud* copy entries went with it.
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
    exportColLevel: 'Level',
    exportColOwnerAccepts: 'Owner accepts',
    exportColSourceEnabled: 'Source enabled',
    exportColFetchMethod: 'Fetch method',
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
    // Layer-2 narrator (M5, spec §11): the plain-language block's UI
    // strings. Rendered ONLY when a NarrativeUnit is present AND the
    // staged-rollout gate is open (`?narrative=preview` OR
    // `NARRATOR_VISIBLE=true`). The `ai` disclaimer sits beside the
    // label only when `source === 'ai'` (templates carry no disclaimer —
    // the spec's "template → no AI label" rule).
    narrativeLabel: 'Plain-language summary',
    narrativeUpdated: 'Updated {time}',
    // The same-day form of `narrativeUpdated`'s {time} token — "today"
    // collapses the relative-time formatter (the spec's "Updated <time>"
    // line never claims a live clock; same-day generations are recent).
    narrativeUpdatedToday: 'today',
    narrativeAiDisclaimer: 'AI-written, not financial advice',
    // Part 3 ("In the news", spec §11): the visually separate block,
    // rendered only when `unit.news` is present.
    inTheNewsLabel: 'In the news',
    inTheNewsDisclaimer: 'Summarized by AI from web reports; not verified; not financial advice',
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
    /** 2026-10-29 owner round ("when the market is shut down it must show
     * the exchanges are not working right now"): the all-closed banner —
     * shown only when EVERY exchange's calendar says out-of-session
     * (weekend / global holiday), directly under the section descriptor. */
    closedTitle: 'The exchanges are closed right now.',
    closedBody:
      'All world stock exchanges are outside their trading sessions (weekend or public holiday) — the numbers below are the last completed session’s closes.',
    /** Regional groups, east to west (the trading day's order). */
    groups: { asia: 'Asia-Pacific', europe: 'Europe', americas: 'Americas' },
    /** The period lenses — 2026-10-21 owner round ("unify the map time
     * views with the other parts of the website"): the section's ONE
     * period switch is the WORLD MAP's four-lens segmented control
     * (markets.map.periodToday…periodYear); the old five-option
     * Daily|Weekly|Monthly|Quarterly|Yearly radiogroup and its keys are
     * RETIRED. viewQuarterly stays: '3m' keeps its word for the typed
     * fallback (the stored contract still carries chg3m — the table's
     * Trend column), it is just never a switch lens anymore. */
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
    // S1-M1.6 #2: the flat band, stated (the audit asked for the threshold).
    flatBandNote: 'A move within ±1% reads as flat.',
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
    thYear: '1 year',
    /** 2026-10-27 owner round ("add five year and 3 months to all view
     * points"): the full table's 5-year column (the job's
     * Yahoo-10y-anchored chg5y). */
    th5y: '5 years',
    thFromHigh: 'From 52-week high',
    thTrend: '3m trend',
    // v3 UI_SPEC §7a (2026-10-20, UI-27): the state column's header — the
    // table's exact columns are Market | Today | 3 months | From 52-week
    // high | State | Last close. thTrend/thStatus stay archived (§1.7:
    // nothing existing is deleted; the CSV builder keeps its own words).
    thState: 'State',
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
    csvColYear: '1 year %',
    csvCol3m: '3 months %',
    /** 2026-10-27 owner round ("add five year and 3 months to all view
     * points"): the 5-year export column (appended at the END, after the
     * 1-year column — see markets-csv.ts's stable-order note). */
    csvCol5y: '5 years %',
    csvColFromHigh: 'From 52-week high %',
    csvColTrend: 'Trend',
    csvColStatus: 'Status',
    csvColClose: 'Last close',
    csvColAsOf: 'As of',
    csvColSource: 'Source',
    csvColHigh52w: '52-week high',
    csvColLow52w: '52-week low',
    csvDownload: 'World markets CSV',
    /** The world-markets MAP module (docs/insights/world-markets-map-spec.md
     * §4.4): its own four-period switch (Today | 1 week | 1 month | 1 year —
     * the lenses the map colours speak; yearly returned 2026-10-20h), the
     * one-line breadth summary, the legend's gradient ends, the Open/Closed
     * tags and the honest missing/old-data labels. Kept under `markets.map.*`
     * so the module reads only its own block. */
    map: {
      periodSwitchAria: 'Choose the period shown on the map',
      periodToday: 'Today',
      periodWeek: '1 week',
      periodMonth: '1 month',
      /** 2026-10-20h owner round: yearly returns to the map's switch (the
       * stored contract's chg1y — the same wording as thYear above). */
      periodYear: '1 year',
      /** 2026-10-27 owner round ("add five year and 3 months to all view
       * points"): the two new lenses' switch words — the same wording as
       * the th3m column and the 5-year column beside them. */
      period3M: '3 months',
      period5Y: '5 years',
      /** The summary line's period word ("markets up today / this week…"). */
      periodWordToday: 'today',
      periodWordWeek: 'this week',
      periodWordMonth: 'this month',
      periodWordYear: 'this year',
      /** 2026-10-27: the new lenses' summary-line period words (the same
       * "this X" family — a quarter/five-year span reads naturally). */
      periodWord3M: 'over the past 3 months',
      periodWord5Y: 'over the past 5 years',
      open: 'Open',
      closed: 'Closed',
      noData: 'No data',
      oldData: 'Old data',
      stepFall: 'Fall',
      stepFlat: 'Flat',
      stepRise: 'Rise',
      /** The card's period captions (2026-10-20f: Day/Week/Month side by
       * side; 2026-10-20h: the yearly hero row joins above them;
       * 2026-10-27: the 3M and 5Y cells join the compact row). */
      cellD: '1D',
      cellW: '1W',
      cellM: '1M',
      cellY: '1Y',
      cell3M: '3M',
      cell5Y: '5Y',
      /** The relative-scale legend's two ends (colour strength = move size). */
      legendMoreDown: 'Bigger fall',
      legendMoreUp: 'Bigger rise',
      // 2026-10-29 owner round: the M10 one-glance breadth line under the
      // map is RETIRED (the verdict box's selected-period breadth counts
      // stay the section's one breadth surface) — the summary key went with it.
      // 2026-10-21 owner round: the M9 "Updated {time} · {age}" header
      // line and its keys are RETIRED — the KV snapshot's write time is
      // fixed by the nightly cron, so the line always read as a stale,
      // never-updating clock (the owner: "it seems stale and not
      // updateable"). The M17 showingFrom line below stays (a real
      // event: the refresh FAILED and the last good copy is on screen).
      /** M17: served from the last good local copy after a failed refresh. */
      showingFrom: 'Showing data from {time}',
      /** M16 + axe's label-in-name rule: the card's accessible name is
       * derived from its CONTENT — the visible strings plus these
       * screen-only glue phrases, so the name reads as one sentence that
       * contains every visible word. */
      srContext: '{country}, {step}',
      srPerf: 'performance:',
      srVal: 'last close',
      /** §M6's short card names: the cards use the short forms Iranian
       * stock sites show when the canonical name truncates inside the
       * 14.5%-wide card (Shanghai Composite, Euro Stoxx 50, S&P/TSX
       * Composite); the accessible name and the explorer keep the full
       * names regardless. */
      cardNameSsec: 'Shanghai',
      cardNameStoxx: 'Stoxx 50',
      cardNameTsx: 'S&P/TSX',
      cardNameNdx: 'Nasdaq',
      /** The selected country's short map name (2026-10-20g owner round:
       * "in the selected country write it's name with 60% opacity like
       * Brazil USA Australia") — one label per country, keyed by the
       * flag code the card already carries. */
      countryNames: {
        us: 'USA',
        ca: 'Canada',
        br: 'Brazil',
        gb: 'UK',
        fr: 'France',
        de: 'Germany',
        eu: 'Eurozone',
        in: 'India',
        hk: 'Hong Kong',
        cn: 'China',
        tw: 'Taiwan',
        kr: 'S. Korea',
        jp: 'Japan',
        au: 'Australia',
      },
    },
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

  /* ------------------------------------------------------------------ *
   * R10-3 (2026-10-28) — the global companies table behind a feature
   * flag. OFF by default; the UI renders the empty-state panel below
   * the markets tiles. The fa mirror sits in insights-copy-fa.ts;
   * both blocks carry the same key shape (the copy-audit gate enforces
   * parity). When the flag flips on (the owner's future paid EODHD
   * plan — see ROUND10_REPORT.md R10-3), the table renders the live
   * rows; the column headers below stay verbatim.
   * ------------------------------------------------------------------ */
  companies: {
    /** The editorial header (the 2026-10-28 R10-3 ask): the title sits
     * below the markets tiles as its own question — "what are the
     * world's leading companies doing today?". "Companies", never
     * "stocks" or "shares" (the section's naming discipline). */
    title: 'World-leading companies',
    sectionLabel: 'Coming soon',
    /** The empty-state line (shown while the feature flag is off —
     * R10-3 ships the table pre-built, the live data feed is the
     * owner's future EODHD plan upgrade). Names the R9-09 sample so a
     * visitor can see what the table carries; never a fake loading
     * spinner. RULES.md §5: no forecast wording — present tense, the
     * condition names when the live data appears. */
    emptyState:
      'This table is being prepared. About 50 world-leading companies (Nvidia, Microsoft, Apple, SAP, ASML, LVMH, Toyota, Sony and more) appear here with their daily prices once the data feed is enabled.',
    /** The column headers — Latin-script in both locales (the data
     * itself is Latin: company names are proper nouns, exchange codes
     * are Latin abbreviations, numbers stay LTR inside the RTL flow).
     * The fa dictionary carries localized headers; these English
     * strings are the source of truth. */
    colCompany: 'Company',
    colExchange: 'Exchange',
    colPrice: 'Price',
    colDailyChange: 'Daily change',
    colSparkline: 'Last 7 days',
    /** The attribution line — EODHD is the planned source (R9-09
     * audit); the line shows the publisher's name honestly, never
     * "live" or "real time". */
    attribution: 'Planned data source: EODHD',
    /** The planned-data note (small print under the table) — explains
     * WHY the table is empty without implying a missing feature. */
    plannedNote:
      'The data feed for this table is not yet connected. The list of companies and the table layout are already in place.',
  },

  tic: {
    /** gap-closure S2-M2.4 — "Who holds US government debt" (the owner's
     * top-priority feature). Every string generated from Treasury TIC
     * data describes CONDITIONS ONLY: who holds, who bought, who sold —
     * never causes, never forecasts. */
    title: 'Who holds US government debt',
    subtitle: 'Foreign holdings of US Treasuries — who holds them, and who has been buying or selling',
    /** The provenance line: the data month + the release date (the ~6–7
     * week lag is the TIC's own publication schedule). */
    provenance: 'Data for {month}, released {date}',
    /** The calm out-of-date badge (the >70-day gate; the M1.4 wording
     * family — never alarmist, never hides the table). */
    staleBadge: 'Data is more than 70 days old',
    /** The "being prepared" line (the markets/fx §6.6 family). */
    empty: 'Foreign-holdings data is being prepared. Check back after the next daily update.',
    /** The data-generated headline (conditions only): the total, then
     * Japan and China with their 6-month changes. */
    headline:
      'Foreign holders owned {total} of US Treasuries in {month}. Japan held {japan}, {japanPhrase}. China held {china}, {chinaPhrase}.',
    phraseDown: '{amount} less than six months earlier',
    phraseUp: '{amount} more than six months earlier',
    /** Unit phrases (the number rides {n}; the $ lives in the EN string,
     * the «دلار» in the fa string). */
    phraseTrillion: '${n} trillion',
    phraseBillion: '${n} billion',
    /** The official/private split bar (Table 5's "Of Which: Foreign
     * Official" row; the remainder is private). */
    splitTitle: 'Foreign official vs private holders',
    officialWord: 'Foreign official (central banks and governments)',
    privateWord: 'Private investors',
    /** The buyers/sellers chips — TRANSACTIONS over 12 months (Table 3's
     * "Net U.S. Sales"), never holdings changes. */
    buyersTitle: 'Largest net buyers, 12 months',
    sellersTitle: 'Largest net sellers, 12 months',
    netBuyingWord: 'net buying',
    netSellingWord: 'net selling',
    /** The Japan + China trend chart (24 months). */
    chartTitle: 'Japan and China, 24 months',
    chartSummary:
      'Japan went from {from} to {to} over the 24 months to {month} ({phrase}). China went from {cFrom} to {cTo} ({cPhrase}).',
    /** The table (desktop ≥900px; below that the card list). */
    tableCaption: 'Top foreign holders of US Treasuries, {month}',
    colCountry: 'Country',
    colHoldings: 'Holdings ($bn)',
    colShare: 'Share',
    col1m: '1-month change',
    col12m: '12-month change',
    colNet: 'Net buying/selling, 12m',
    colVal: 'Price effect, 12m',
    colTrend: 'Trend, 24 months',
    sortAria: 'Sort by {column}',
    /** The custody-hub marker on a row (the ◆ glyph carries the title). */
    custodyBadge: 'Custody hub',
    /** The honest-difference note: net transactions vs the price effect. */
    netVsValueNote:
      'Net buying/selling is real transactions (what investors actually bought or sold). The price effect is holdings changing value as market prices move. The two can point in different directions.',
    /** The custody caveat (plain-language paraphrase of Treasury's own
     * wording; the "?" tooltip carries the fuller version). */
    custodyCaveat:
      'Belgium, Luxembourg, the Cayman Islands, Ireland, the UK, Switzerland and Bermuda hold much that belongs to investors elsewhere: holdings are recorded where the securities are held, not who owns them.',
    custodyTooltip:
      'The US Treasury itself warns that these data are collected primarily from US-based custodians and cannot attribute ownership with complete accuracy: a security bought by a foreign resident but held in a custodial account in a third country is counted under that country, not the buyer.',
    /** A flagged month (the plausibility gate) — shown as a row note. */
    flaggedNote: 'Includes a month with an unusually large move — under review',
    /** When fewer than 12 months carry transactions data (the 2023-02
     * series break), the cell's title explains the partial window. */
    netMonthsNote: '{n} of the last 12 months carry transactions data',
    /** The mobile card list's disclosure (first 6 + show all). */
    showAllRows: 'Show all {n} holders',
    showFewerRows: 'Show fewer',
    /** Country display names (keyed by OUR stable slugs; a new entrant
     * without copy falls back to the provider's own published name). */
    countries: {
      japan: 'Japan',
      'united-kingdom': 'United Kingdom',
      'china-mainland': 'China',
      belgium: 'Belgium',
      canada: 'Canada',
      'cayman-islands': 'Cayman Islands',
      luxembourg: 'Luxembourg',
      france: 'France',
      ireland: 'Ireland',
      taiwan: 'Taiwan',
      switzerland: 'Switzerland',
      singapore: 'Singapore',
      'hong-kong': 'Hong Kong',
      india: 'India',
      norway: 'Norway',
      brazil: 'Brazil',
      'saudi-arabia': 'Saudi Arabia',
      'korea-south': 'South Korea',
      'united-arab-emirates': 'United Arab Emirates',
      bermuda: 'Bermuda',
      australia: 'Australia',
    },
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
    thTrend: '3m trend',
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
    // gap-closure S4-M4.3 (2026-11-01): the geopolitics/supply lane — a
    // shadow gauge until S6 (the header reads "not scored yet").
    'geo-fragmentation': 'Is the world getting more fragmented?',
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
    'geo-fragmentation': 'Fragmentation',
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
    'geo-fragmentation':
      'Measured world friction: tension news, policy fights and the sea gates trade passes through.',
  },

  status: {
    // v3 UI_SPEC §4 (2026-10-20): the six-word state language. "Unusual"
    // stays as a key only for the data exports (tier words in the CSV and
    // the full export, E-21); the card face never shows it anymore.
    warning: 'Needs attention',
    unusual: 'Unusual',
    normal: 'Normal',
    context: 'Context',
    stale: 'Stale',
    // v3: held for a check or failed outright — both read the same honest
    // word; the value hides from the face (UI-17), the reason rides the face
    // and the last good value lives inside the details.
    'check-pending': "Can't tell right now",
    // v3: no-history displays as Context (the value stays, reason on face).
    'no-history': 'Context',
    // v3 §4: Delayed — one trading day or more behind its daily peers,
    // still within its allowed age (GLOSSARY: "Delayed").
    delayed: 'Delayed',
    unavailable: "Can't tell right now",
  },

  label: {
    relaxed: 'Stable',
    cautious: 'Cautious',
    stressed: 'Stressed',
    alarmed: 'Critical',
  },

  /**
   * R9-07 (2026-10-27 owner round — "special container for US-based
   * indicators that affect global markets"): the dedicated container's
   * heading, its static analytical frame, and the three-sentence brief's
   * FIXED template table. The WORDS are chosen and the VALUES
   * interpolated from the live readings at render time
   * (config/us-global-reach.ts) — the same discipline as the
   * consequence-line machinery, so the brief can never contradict the
   * cards it sits beside.
   */
  usGlobalReach: {
    heading: 'US indicators with global reach',
    intro:
      'These United States numbers move the world: they steer borrowing costs, currencies and risk appetite far beyond the US border.',
    /** The borrowing-costs sentence (bands: high / mid / low — the most
     * binding of the three yields' 10-year percentiles, any
     * needs-attention status counting as high). */
    briefCostsHigh:
      'US borrowing costs sit high in their ten-year range (10-year at {us10y}, 30-year at {us30y}, real yield at {real}), which tends to tighten financial conditions worldwide, pressure emerging-market currencies and weigh on risk assets.',
    briefCostsMid:
      'US borrowing costs sit mid-range for the decade (10-year at {us10y}, 30-year at {us30y}, real yield at {real}), a broadly neutral setting for global credit and asset prices.',
    briefCostsLow:
      'US borrowing costs sit low in their ten-year range (10-year at {us10y}, 30-year at {us30y}, real yield at {real}), which tends to ease financial conditions worldwide and support risk assets.',
    /** The inflation sentence (any needs-attention inflation reading =
     * above; otherwise near). */
    briefInflationAbove:
      "Inflation is still above the central banks' goals (US CPI at {cpi}, core PCE at {pce}, euro-area HICP at {hicp}), keeping the Fed and the ECB restrictive for longer and holding global rates up.",
    briefInflationNear:
      "Inflation is close to the central banks' goals (US CPI at {cpi}, core PCE at {pce}, euro-area HICP at {hicp}), leaving room for the Fed and the ECB to ease and for global rates to fall.",
    /** The stress/liquidity sentence (any needs-attention stress reading
     * = strained; otherwise calm). */
    briefStressStrained:
      'US money markets show strain (STLFSI at {stlfsi}, NFCI at {nfci}, Fed balance sheet {walcl}), a combination that usually tightens credit worldwide and softens world exchanges.',
    briefStressCalm:
      'US money markets are calm (STLFSI at {stlfsi}, NFCI at {nfci}, Fed balance sheet {walcl}), supporting credit and risk appetite worldwide.',
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
    // M4 Wave 1 (2026-10-24): the claims count word — "194,000 claims".
    claims: 'claims',
    // M5 Wave 2 (2026-10-24): the Turkish lira sign (EN prefix).
    try: '₺',
    // 2026-10-29 owner round (the usdaed card): the UAE dirham (EN prefix).
    aed: 'AED',
    // M6 Wave 3 (2026-10-25): the leading-edge batch — the AU
    // billions ("A$97.6bn" EN, suffix in fa), permits and
    // openings scaled to millions ("1.40m permits a year"),
    // vacancies in thousands ("325k vacancies" — 0 decimals).
    'aud-bn': 'bn',
    permits: 'm permits a year',
    openings: 'm job openings',
    vacancies: 'k vacancies',
    // 2026-10-26 gap-audit build, A-6: crude stocks in millions of barrels.
    barrels: 'm barrels',
    // gap-closure S4-M4.4 (2026-11-01): the US field production — a RATE
    // in millions of barrels per day ("13.99m barrels a day").
    'barrels-per-day': 'm barrels a day',
    // gap-closure S4-M4.3 (2026-11-01): the chokepoint transits — the
    // 7-day average of the daily count ("45.3 transits a day").
    transits: 'transits a day',
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
    // 2026-10-26 gap-audit build, A-8: the annualised N-month growth line.
    growthAbove: 'annualised growth over the past {months} months above {magnitude}',
    growthBelow: 'annualised growth over the past {months} months below {magnitude}',
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
      'How the indicators usually relate. Each card weighs today’s readings against the usual pattern.',
    // R27: the quiet section-level note replaces the per-card placeholder tag.
    evidenceNote: 'Relationships are general tendencies, not forecasts.',
    // v3 UI_SPEC §8 (2026-10-20, task PH6-B): the Showing / Partly showing /
    // Not showing words are RETIRED from display (the internal state ids
    // stay). The six words below are the v3 neutral vocabulary: the match /
    // differ family mirrors the UI-34 marker words, the inactive word is the
    // UI-35 line (readable card, trigger never moved), pending is UI-37,
    // unknown is the honest no-data word.
    state: {
      active: 'Matching the usual pattern',
      partly: 'Partly matching the usual pattern',
      pending: 'Pass-through pending',
      inactive: 'Trigger not present',
      disagree: 'Differs from the usual pattern',
      unknown: 'Not enough fresh data',
    },
    // v3 UI_SPEC §8 (2026-10-20, task PH6-B) — the relationship cards.
    // UI-33: the NEUTRAL summary line that replaces the verdict chip.
    matchSummary: '{match} of {moved} readings match the usual pattern',
    triggerAbsentLine: 'Trigger not present',
    notEnoughLine: 'Not enough fresh data to read',
    // UI-37: the pending card's decided date line (the cash reading's own
    // lastChange supplies the decision; the loan data has not arrived).
    passThroughPendingDates:
      'The cash rate moved {policy} on {decided}; the home-loan data that follows it is not in yet.',
    // UI-34: the per-leg marker words (icon + word, never colour alone).
    markerMatches: 'Matches',
    markerMatchesLong: 'Matches the usual pattern',
    markerDiffers: 'Differs',
    markerCantTell: "Can't tell",
    // The collapsed chips' compact match count.
    chipMatchCount: '{match} of {moved} match',
    // UI-33: the usual-tendency prefix on the relation sentence.
    usualTendency: 'Usual tendency:',
    // UI-36: the per-leg windows footnote (from the CONNECTIONS registry).
    windowsUsed: 'Windows used for each reading',
    windowDays: '{days} days',
    orWord: 'or',
    // UI-38: the weaker-link tag + its one documented why line.
    weakerLink: 'weaker link',
    weakerLinkWhy:
      'The US money-supply leg was removed: the link between money supply and Chinese factory activity is weak.',
    // Fix spec B-04 (2026-10-14): the context-leg and caveat labels.
    contextLeg: 'context',
    contextCaveat: 'a level, not a servicing cost',
    passThroughLine: 'The cash rate moved {policy} on {decided}; the home-loan data that follows it is not in yet (the loan rate has moved {loan} since that decision where data exists).',
    // R7b: the collapsed section’s one-line summary. v3 (2026-10-20, task
    // PH6-B): the showing / not-showing counts became the neutral v3
    // vocabulary (UI-33/35); the pending / unknown words keep theirs.
    summaryActive: '{n} matching the usual pattern',
    summaryPartly: '{n} partly matching the usual pattern',
    summaryPending: '{n} pass-through pending',
    summaryInactive: '{n} without a trigger present',
    summaryDisagree: '{n} differing from the usual pattern',
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
      // R9-08 (2026-10-27 owner round): the v6 panEmpty/panUnreadable
      // minimal markers are RETIRED — an empty pan now carries its FULL
      // evidence-based sentence inside the balance box itself
      // (listEmptyFor/listEmptyAgainst/listEmptyNone below). Round-51's
      // keys went with them.
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
    // 2026-10-21c owner round: the balanceSilver copy variants are RETIRED
    // with silver's balance (the merged card renders gold's balance only).
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
    // v3 UI_SPEC §9 (2026-10-20, task PH6-B) — the per-metal balance visual.
    // UI-39.1: the heading line. M = scored conditions with readable data.
    balanceSummary: '{n} of {m} conditions support {metal}',
    // UI-39.2/4: the column + aside headings (rendered small uppercase).
    colSupporting: 'Supporting',
    colPressuring: 'Pressuring',
    colNeutral: 'Neutral',
    colEmpty: 'None right now.',
    // UI-39.5: the missing-data line — R readable of M scored conditions;
    // every unreadable condition is named, never silently counted (UI-40).
    readableLine: '{r} of {total} conditions readable.',
    unreadableName: "{name}: can't tell right now.",
    // UI-40: fewer than 3 readable conditions — the beam stays level.
    notEnoughReadable: 'Not enough readable conditions to weigh',
    // UI-39.6: the explanatory footnote (at least 12px, contrast-safe).
    balanceFootnote: 'Each condition counts the same. This is a snapshot of conditions, not a forecast or advice.',
    // UI-45a: the beam's text alternative (the visible text carries the
    // full information; this labels the graphic for screen readers).
    beamAria:
      'Balance of conditions for {metal}: {supporting} supporting, {pressuring} pressuring, {neutral} neutral, {unreadable} unreadable, {total} conditions in total.',
    // Gold Program S2.1 (owner round 2026-10-31 — "must be bilingual"):
    // the two gold panels' copy, moved from the @currena/insights package
    // into the dictionaries so both locales render through the same
    // reviewed-copy path (the fa mirror below, triaged through the
    // Persian-copy audit). The panels render INSIDE the merged gold
    // card, under the balance visual.
    goldScore: {
      title: 'Gold tailwind score',
      subtitle: 'The macro drivers, re-cut for gold direction',
      /** null label (nothing firing) — never a made-up word. */
      noReadWord: 'Cannot read yet',
      labels: {
        'strong-tailwind': 'Strong tailwind',
        tailwind: 'Tailwind',
        balanced: 'Balanced',
        headwind: 'Headwind',
        'strong-headwind': 'Strong headwind',
      },
      netFiringLine: 'Net score — {firing} of {total} drivers firing',
      netFiringNone: 'Net score — no driver is firing right now',
      laneCountsLabel: 'Lanes',
      laneCountsLine: '{tailwind} tailwind · {headwind} headwind · {mixed} mixed',
      laneNames: {
        'borrowing-costs': 'Borrowing costs',
        dollar: 'Dollar',
        stress: 'Market stress',
        inflation: 'Inflation',
      },
      subGaugeWords: {
        tight: 'tight',
        relief: 'relief',
        strong: 'strong',
        stress: 'under stress',
        elevated: 'elevated',
        calm: 'calm',
        hot: 'running hot',
        cool: 'cooling',
        mixed: 'mixed',
        unreadable: 'no read',
      },
      // Session 3 (G2): the inflation lane's context phrase, fed by the
      // breakeven-tilt reading (breakevenTiltLean — pure, the panel never
      // chooses copy). Rendered beside the lane's hot/cool word.
      tiltWords: {
        building: 'expectations building',
        fading: 'expectations fading',
        steady: 'expectations steady',
      },
      votersTitle: 'Firing drivers',
      votersNone: 'None firing',
      voterNames: {
        'real-yield-10y': 'Real yields',
        us10y: 'US 10-year yield',
        us30y: 'US 30-year yield',
        'fed-target': 'Fed funds target',
        'fed-expectations': 'Fed expectations',
        'ecb-dfr': 'ECB deposit rate',
        'yield-curve-10y2y': '10y−2y curve',
        'yield-curve-10y3m': '10y−3m curve',
        'dollar-basket': 'Dollar basket',
        usdjpy: 'USD/JPY',
        'us-japan-10y-gap': 'US−Japan 10y gap',
        'stress-stlfsi': 'STLFSI',
        nfci: 'NFCI',
        vix: 'VIX',
        'gold-silver': 'Gold/silver ratio',
        'cftc-gold-positioning': 'Gold positioning (COT)',
        'us-cpi-yoy': 'US CPI',
        'us-pce-core-yoy': 'US core PCE',
        'euro-hicp': 'Euro HICP',
        'breakeven-5y5y': '5y5y breakeven',
        // Session 6 (the D-5 promotion): the 21st voter — the compact form
        // of the context card's own plainName ("The inflation tilt, near
        // vs far"). Same series, same name family, one seat in the lane.
        'breakeven-tilt': 'Inflation tilt',
      },
      evidenceWords: {
        rising: 'rising',
        falling: 'falling',
        high: 'high in its decade',
        low: 'low in its decade',
      },
      impactWords: {
        tailwind: 'tailwind',
        headwind: 'headwind',
      },
      footnote: 'A descriptive score of the classic driver relationships — conditions, not advice.',
      // Gold Program S5 (C4a, 2026-10-31): the measured-reality note — the
      // S4 backtest's verdict, stated on the panel itself. The table reads
      // conditions; over 2016–2026 its lean showed no positive association
      // with gold's next 5–60 days (BACKTEST-GOLD.md). The link word beside
      // it points at the full public report (GoldTailwindPanel's
      // GOLD_BACKTEST_URL).
      measuredNote:
        'Measured against gold’s actual moves over 2016–2026: the table’s lean showed no positive association with the next 5–60 days — if anything, headwind readings came before larger rises. It reads conditions, not direction.',
      measuredNoteLink: 'Read the full backtest',
    },
    goldModelVsReality: {
      title: 'Model vs reality',
      subtitle: 'Does the macro score agree with what gold actually did?',
      chips: {
        'aligned-tailwind': 'Aligned — tailwind',
        'aligned-headwind': 'Aligned — headwind',
        'diverging-up': 'Diverging — gold rising anyway',
        'diverging-down': 'Diverging — gold falling anyway',
        neutral: 'No gap to read',
        'no-read': 'Not enough data',
      },
      explainers: {
        'aligned-tailwind':
          'The macro drivers lean supportive and gold has moved {value} {basis} — the move has company.',
        'aligned-headwind':
          'The macro drivers lean against gold and the price has moved {value} {basis} — the weakness has company.',
        'diverging-up':
          'The macro drivers lean against gold, yet the price has moved {value} {basis} — the market is fighting the model.',
        'diverging-down':
          'The macro drivers lean supportive, yet the price has moved {value} {basis} — the market is not following the drivers.',
        'model-neutral': 'The macro drivers show no clear lean for gold right now.',
        'reality-flat': 'Gold has held roughly flat ({value} {basis}) — no model-vs-market gap to read.',
        'no-read': 'Not enough fresh data to compare the model with the market.',
      },
      basisPhrases: {
        change30d: 'over the past 30 days',
        ma200GapPct: 'vs its 200-day average',
      },
      footnote: 'The model reads the drivers; reality reads the price. Both can be wrong.',
    },
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
    /** 2026-10-29 owner round: the AU-scope disclaimer — the panel's costs,
     * rates and wages are AUSTRALIAN households' (petrol prices in cents
     * per litre, RBA rates, ABS wages). Stated once, directly under the
     * panel title; the panel also moved inside the Australia section. */
    scopeNote:
      'About Australia: the costs, rates and wages this panel follows are those of Australian households.',
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

  // Layer 1 — plain-language copy (docs/insights/layer1/PLAIN-LANGUAGE-SPEC.md).
  // EN source of truth; the fa mirror in insights-copy-fa.ts is shape-checked
  // against this at compile time. Accessors: getIndicatorCopy / getGlossary in
  // apps/web/src/components/insights/layer1/index.ts.
  layer1: LAYER1,
};

export type InsightsCopy = typeof insightsCopyEn;
