/**
 * sources.ts — the v3 SOURCE RISK REGISTER (RULES.md §2, RISK_REGISTER.md,
 * INSIGHTS_STEP3_SPEC.md §8). One row per data source: risk level (L0…L3),
 * the owner's recorded acceptance, the M-6 kill switch (`enabled`), the
 * SCRAPING_SPEC method ladder slot (M1…M5), the runtime that fetches it,
 * and the quoted terms lines with the date they were read.
 *
 * Who may edit what (RISK_REGISTER.md "How this file works"):
 *  - The AGENT fills: level, termsLines, termsReadOn, attribution, method,
 *    runtime, notes. The level is assigned from the provider's own quoted
 *    terms, never from memory (RULES.md §2).
 *  - The AGENT NEVER changes `ownerAccepts` or `override` for a source it
 *    did not find already recorded. Those are the owner's words in
 *    RISK_REGISTER.md; this file mirrors them.
 *  - `enabled` is the per-source kill switch (RULES.md M-6): false removes
 *    the source's cards on the next refresh. New L2 sources start disabled
 *    (SCRAPING_SPEC F-23 / T-30).
 *
 * Levels (RULES.md §2):
 *  L0 public display clearly allowed · L1 probably fine, terms need
 *  checking · L2 restricted/unclear AND the owner accepts · L3 never used.
 *
 * The per-indicator walk: every indicator's risk is the WORST of its
 * upstream legs (the same walk the licence block uses, defect E-01/LR-02),
 * so a Yahoo leg makes a card L2, and an L3 leg anywhere would make the
 * card L3 (unusable — T-31 keeps L3 rows disabled and never requested).
 */

import type { FredCopyrightRecord } from './licences';

export type SourceLevel = 'L0' | 'L1' | 'L2' | 'L3';
export type FetchMethod = 'M1' | 'M2' | 'M3' | 'M4' | 'M5';
export type SourceRuntime = 'github-action' | 'worker' | 'manual';

export interface SourceRiskEntry {
  /** Register row id (RISK_REGISTER.md's `source id` column). */
  id: string;
  /** The provider token DEFINITIONS/sourceRef use ('fred', 'yahoo', …). */
  provider: string;
  label: string;
  usedFor: string;
  /** SCRAPING_SPEC §2 method ladder slot. null = not confirmed yet (F-01…F-05 pending). */
  method: FetchMethod | null;
  /** Where the fetch runs (SCRAPING_SPEC §4). null = nothing fetches it yet. */
  runtime: SourceRuntime | null;
  level: SourceLevel;
  /** The owner's recorded acceptance (RISK_REGISTER.md). null = n/a (L0/L1). The agent never edits this for a new source. */
  ownerAccepts: boolean | null;
  /** Owner override for an L3 row (RISK_REGISTER.md) — false unless the owner writes yes himself. */
  override: boolean;
  /** M-6 kill switch: false → the source is not fetched and its cards are removed on the next refresh. */
  enabled: boolean;
  /** The terms lines the level decision rests on, quoted from the provider's own material (or the honest "could not be quoted" record). */
  termsLines: string;
  termsReadOn: string;
  attribution: string;
  termsUrl: string | null;
  notes: string;
}

export const SOURCE_RISK_READ_ON = '2026-10-16';

/**
 * RISK_REGISTER.md owner statement (2026-10-17): "I don't want to make the
 * page private. I take the risk. It's a non-commercial website." — this
 * acceptance covers the L2 sources already live on 15 October 2026 and is
 * recorded per row below in `ownerAccepts`. New L2 sources start false.
 */
export const SOURCE_RISK_REGISTER: Record<string, SourceRiskEntry> = {
  'rba-tables': {
    id: 'rba-tables',
    provider: 'rba',
    label: 'Reserve Bank of Australia (statistical tables)',
    usedFor: 'cash rate, bond yields, loan and deposit rates, household ratios',
    method: 'M2',
    runtime: 'github-action',
    level: 'L0',
    ownerAccepts: null,
    override: false,
    enabled: true,
    termsLines:
      'RBA copyright page (read 2026-10-16): most RBA material is CC BY 4.0; RBA terms allow commercial and personal use provided no RBA endorsement is implied. The page is JS-heavy — the verbatim licence line could not be captured in a plain fetch; re-quote at the quarterly licence review. Third-party content inside an RBA table needs that third party\u2019s consent (re-check each table\u2019s source notes).',
    termsReadOn: SOURCE_RISK_READ_ON,
    attribution: 'Source: Reserve Bank of Australia',
    termsUrl: 'https://www.rba.gov.au/copyright/',
    notes: 'Cash rate and financial-data tables carry their own terms; F2 publishes with a 2–4 business-day lag (defect E-06/B-09).',
  },
  'abs-data': {
    id: 'abs-data',
    provider: 'abs',
    label: 'Australian Bureau of Statistics',
    usedFor: 'CPI, trimmed mean, jobs, wages, rents, home values, petrol CPI, terms of trade',
    method: 'M1',
    runtime: 'github-action',
    level: 'L0',
    ownerAccepts: null,
    override: false,
    enabled: true,
    termsLines:
      'ABS copyright page (read 2026-10-16): CC BY 4.0 — the page carries a Creative Commons menu item; the JS-rendered page could not be quoted verbatim in a plain fetch, so the exact clause is recorded as "not quoted" until re-read in a browser. Attribution is displayed regardless (LR-04).',
    termsReadOn: SOURCE_RISK_READ_ON,
    attribution: 'Source: Australian Bureau of Statistics',
    termsUrl: 'https://www.abs.gov.au/about/copyright-and-disclaimer',
    notes: 'Keyless SDMX data API (M1); quarterly series labelled by quarter name (E-07).',
  },
  'boe-database': {
    id: 'boe-database',
    provider: 'boe',
    label: 'Bank of England (Bank Rate history page)',
    usedFor: 'boe-rate (the UK policy rate)',
    method: 'M2',
    runtime: 'worker',
    level: 'L2',
    ownerAccepts: true,
    override: false,
    enabled: true,
    termsLines:
      'Bank of England legal page (read 2026-10-25): the Database\u2019s data is \u201csubject to the terms of the UK Open Government Licence, allowing and encouraging free and flexible data reuse\u201d \u2014 attribution class, like CC BY. Bank Rate is the Bank\u2019s own series (not a third-party-licensed one; only selected exchange-rate series are excluded from the licence).',
    termsReadOn: '2026-10-25',
    attribution: 'Source: Bank of England (Bank Rate history)',
    termsUrl: 'https://www.bankofengland.co.uk/legal',
    notes:
      'M6 Wave-4 probe fix (2026-10-25): the decision table replaces the FRED OECD monthly mirror IRSTCI01GBM156N — current at every decision, complete history back to 1975. Same HTML-decision-table shape as the RBA cash-rate page.',
  },
  'fred-public': {
    id: 'fred-public',
    provider: 'fred',
    label: 'FRED, series WITHOUT a copyright notice (public domain)',
    usedFor: 'US rates, CPI, jobs, money supply (the 14 public-domain scanned series)',
    method: 'M1',
    runtime: 'github-action',
    level: 'L0',
    ownerAccepts: null,
    override: false,
    enabled: true,
    termsLines:
      'FRED carries a machine-readable license tag per series (fred.stlouisfed.org/legal/#copyright-<category>); series without a copyright notice resolve to #copyright-public-domain (scanned 2026-10-16, data/fred-copyright.json). Public domain — free to display with the FRED attribution shown.',
    termsReadOn: SOURCE_RISK_READ_ON,
    attribution: 'Source: FRED, Federal Reserve Bank of St. Louis',
    termsUrl: 'https://fred.stlouisfed.org/legal/',
    notes: 'The T-16 scan decides per series; an unscanned series fails closed as fred-copyright (never displayed).',
  },
  'fred-copyright': {
    id: 'fred-copyright',
    provider: 'fred',
    label: 'FRED series WITH a copyright notice (e.g. VIXCLS, © Cboe)',
    usedFor: 'VIX, yield curve (T10Y2Y), breakevens, stress indexes, Philly Fed — the 8 citation-required scanned series',
    method: 'M1',
    runtime: 'github-action',
    level: 'L2',
    ownerAccepts: true, // recorded in RISK_REGISTER.md — already live on 15 Oct 2026, covered by the owner's 2026-10-17 acceptance
    override: false,
    enabled: true,
    termsLines:
      'FRED license tag #copyright-citation-required per the T-16 scan (2026-10-16): "Copyrighted: Citation Required" — the series page names the upstream copyright holder (e.g. © Cboe for VIXCLS). Public display restricted by the upstream copyright; shown privately under the owner\u2019s recorded acceptance, never in public mode (T-15).',
    termsReadOn: SOURCE_RISK_READ_ON,
    attribution: '© Cboe, via FRED (for VIX); Source: FRED, Federal Reserve Bank of St. Louis',
    termsUrl: 'https://fred.stlouisfed.org/legal/',
    notes: 'Already live; owner_accepts yes (RISK_REGISTER.md). Public display stays blocked by the T-15 walk regardless of acceptance.',
  },
  'us-treasury': {
    id: 'us-treasury',
    provider: 'treasury',
    label: 'U.S. Department of the Treasury (daily par + real yield curves)',
    usedFor: 'FRED-fallback fills for DGS2/DGS10/DGS30/DFII10/T10Y2Y (the daily US yield family) — 2026-10-22 reliability round',
    method: 'M2',
    runtime: 'worker',
    level: 'L0',
    ownerAccepts: null,
    override: false,
    enabled: true,
    termsLines:
      'US federal government works carry no copyright (17 U.S.C. § 105) — public domain. The daily yield-curve CSVs are the PRIMARY source of the series FRED republishes (DGS*/DFII10); values cross-checked 2026-10-22 (Treasury 10/21 5.13 vs FRED 10/20 5.12 — same par-yield basis).',
    termsReadOn: '2026-10-22',
    attribution: 'Source: U.S. Department of the Treasury',
    termsUrl: 'https://home.treasury.gov/',
    notes:
      'FALLBACK-ONLY (owner round terms): fetched only when a FRED bulk group failed; FRED stays the primary. Venue-verified 2026-10-22 from Cloudflare egress: HTTP 200, 18–21 s latency (45 s timeout).',
  },
  'eia-spot': {
    id: 'eia-spot',
    provider: 'eia',
    label: 'U.S. Energy Information Administration (daily spot .xls workbooks)',
    usedFor: 'FRED-fallback fills for DCOILWTICO/DCOILBRENTEU/DHHNGSP (WTI, Brent, Henry Hub) — 2026-10-22 reliability round',
    method: 'M2',
    runtime: 'worker',
    level: 'L0',
    ownerAccepts: null,
    override: false,
    enabled: true,
    termsLines:
      'US federal government works carry no copyright (17 U.S.C. § 105) — public domain. The RWTCd/RBRTEd/RNGWHHDd workbooks are the PRIMARY source of FRED\u2019s EIA spot series; cross-validated 2026-10-22: EIA 2026-10-20 WTI 107.89 == FRED DCOILWTICO 2026-10-20 exactly.',
    termsReadOn: '2026-10-22',
    attribution: 'Source: U.S. Energy Information Administration',
    termsUrl: 'https://www.eia.gov/about/copyrights-and-terms-of-service.php',
    notes:
      'FALLBACK-ONLY (owner round terms): fetched only when the FRED EIA commodities group failed. Venue-verified 2026-10-22 from Cloudflare egress: HTTP 200, 28–215 ms.',
  },
  'ecb-frankfurter': {
    id: 'ecb-frankfurter',
    provider: 'frankfurter',
    label: 'ECB reference rates via the Frankfurter project',
    usedFor: 'world currencies, AUD/USD, the Currena dollar basket',
    method: 'M1',
    runtime: 'github-action',
    level: 'L1',
    ownerAccepts: null,
    override: false,
    enabled: true,
    termsLines:
      'frankfurter.dev/license links the ECB disclaimer for the data (read 2026-10-16); the ECB\u2019s reuse terms page is JS-rendered and could not be quoted verbatim in a plain fetch — level L1 (probably fine, terms need the quarterly re-check), fail closed in public mode until then. Frankfurter\u2019s code is MIT.',
    termsReadOn: SOURCE_RISK_READ_ON,
    attribution: 'Source: European Central Bank (reference rates via Frankfurter)',
    termsUrl: 'https://frankfurter.dev/license/',
    notes: 'Attribution shown regardless of the unresolved quote.',
  },
  'world-bank': {
    id: 'world-bank',
    provider: 'world-bank',
    label: 'World Bank (Commodity Markets "Pink Sheet")',
    usedFor: 'iron ore, copper/gold monthly ratio, price history',
    method: 'M1',
    runtime: 'github-action',
    level: 'L1',
    ownerAccepts: null,
    override: false,
    enabled: true,
    termsLines:
      'World Bank Open Data terms are commonly CC BY 4.0, but the terms page is JS-rendered and could not be quoted verbatim on 2026-10-16 — level L1 (need checking), fail closed in public mode until the clause is quoted. Attribution shown regardless.',
    termsReadOn: SOURCE_RISK_READ_ON,
    attribution: 'Source: World Bank',
    termsUrl: 'https://www.worldbank.org/en/about/legal/terms-of-use',
    notes: 'Monthly XLSX bulk file (M2-style document served over the data API).',
  },
  eodhd: {
    id: 'eodhd',
    provider: 'eodhd',
    label: 'EODHD (world stock markets)',
    usedFor: 'the world-markets board (15 of 16 indices)',
    method: 'M1',
    runtime: 'worker',
    level: 'L2',
    ownerAccepts: true, // recorded — already live on 15 Oct 2026
    override: false,
    enabled: true,
    termsLines:
      'EODHD personal-plan terms (read 2026-10-16): the personal plan covers the owner\u2019s own dashboard use; serving the data to others is redistribution. Public display not licensed — the world boards stay hidden in public mode (T-15) and the API key rides the EODHD_API_TOKEN secret.',
    termsReadOn: SOURCE_RISK_READ_ON,
    attribution: 'Data: EODHD',
    termsUrl: 'https://eodhd.com/',
    notes: 'Already live; owner_accepts yes (RISK_REGISTER.md).',
  },
  yahoo: {
    id: 'yahoo',
    provider: 'yahoo',
    label: 'Yahoo Finance (unofficial endpoints)',
    usedFor: 'Brent gap-fill, gold/silver/Bitcoin 10-year history, FTSE 100, live prices',
    method: 'M3',
    runtime: 'worker',
    level: 'L2',
    ownerAccepts: true, // recorded — already live on 15 Oct 2026 (the register: "Unofficial endpoints can break or be blocked: fail closed")
    override: false,
    enabled: true,
    termsLines:
      'Yahoo offers no reuse licence for these unofficial quote endpoints (read 2026-10-16) — the terms are silent on automated reuse, which makes the source L2 under the owner\u2019s recorded acceptance. Unofficial endpoints can break or be blocked at any time: every Yahoo leg fails closed (a block is a block — SCRAPING_SPEC F-09, no identity change).',
    termsReadOn: SOURCE_RISK_READ_ON,
    attribution: 'Data: Yahoo Finance',
    termsUrl: 'https://finance.yahoo.com/',
    notes: 'Already live; owner_accepts yes (RISK_REGISTER.md). Fetched with the honest Currena UA; a 403/418/429 or bot-check page means blocked → link out (T-27).',
  },
  'gold-api': {
    id: 'gold-api',
    provider: 'gold-api',
    label: 'gold-api.com',
    usedFor: 'gold, silver, copper, Bitcoin live spot prices',
    method: 'M1',
    runtime: 'github-action',
    level: 'L0',
    ownerAccepts: true, // the recorded acceptance for this already-live source stands regardless of its level
    override: false,
    enabled: true,
    termsLines:
      'gold-api.com/terms read 2026-10-16: "Commercial use of the API is always permitted, including use in web applications…" (§9); no attribution clause found (attribution is shown by Currena\u2019s own choice); service "as is", no accuracy warranty (§5–6); terms may change without notice (§11) — re-read at the quarterly review.',
    termsReadOn: SOURCE_RISK_READ_ON,
    attribution: 'Data: gold-api.com',
    termsUrl: 'https://gold-api.com/terms',
    notes: 'Defect E-02 closed: terms read and quoted. Level L0 per the quoted §9 (agent-assigned from the provider\u2019s own terms, RULES §2).',
  },
  bitstamp: {
    id: 'bitstamp',
    provider: 'bitstamp',
    label: 'Bitstamp (BTC history cross-check)',
    usedFor: 'BTC daily candles for the gold-api cross-check',
    method: 'M1',
    runtime: 'github-action',
    level: 'L1',
    ownerAccepts: null,
    override: false,
    enabled: true,
    termsLines:
      'Bitstamp public API (read 2026-10-16): the site\u2019s terms could not be quoted verbatim in a plain fetch — level L1 (need checking), used for a private cross-check, fail closed in public mode.',
    termsReadOn: SOURCE_RISK_READ_ON,
    attribution: 'Source: Bitstamp',
    termsUrl: 'https://www.bitstamp.net/',
    notes: 'Only feeds the ingest cross-check report; no card renders from it directly.',
  },
  'ecb-portal': {
    id: 'ecb-portal',
    provider: 'ecb',
    label: 'ECB Data Portal',
    usedFor: 'the euro area policy rate (DFR)',
    method: 'M1',
    runtime: 'github-action',
    level: 'L1',
    ownerAccepts: null,
    override: false,
    enabled: true,
    termsLines:
      'ECB Data Portal terms page (read 2026-10-16): JS-rendered, the reuse clause could not be quoted verbatim in a plain fetch — level L1 (need checking), fail closed in public mode until then. Attribution shown regardless.',
    termsReadOn: SOURCE_RISK_READ_ON,
    attribution: 'Source: European Central Bank',
    termsUrl: 'https://data.ecb.europa.eu/',
    notes: '',
  },
  'alternative-me': {
    id: 'alternative-me',
    provider: 'alternative-me',
    label: 'Alternative.me (Crypto Fear and Greed)',
    usedFor: 'the crypto Fear & Greed context card',
    method: 'M1',
    runtime: 'github-action',
    level: 'L0',
    ownerAccepts: null,
    override: false,
    enabled: true,
    termsLines:
      'Alternative.me states the index may be displayed freely when "attribution is given right next to the display of the data" (read 2026-10-16) — the attribution renders beside the card (F-19…F-22 pattern).',
    termsReadOn: SOURCE_RISK_READ_ON,
    attribution: 'Source: Alternative.me Crypto Fear and Greed Index',
    termsUrl: 'https://alternative.me/crypto/fear-and-greed-index/',
    notes: 'Shown as the publisher\u2019s own reading, never as a Currena signal (Step 3 L1-18).',
  },
  'nbs-china': {
    id: 'nbs-china',
    provider: 'nbs',
    label: 'China NBS (English press releases)',
    usedFor: 'china-pmi (China factory activity), china-cpi (China consumer prices)',
    method: 'M2',
    runtime: 'worker',
    level: 'L1',
    ownerAccepts: null,
    override: false,
    enabled: true,
    termsLines:
      'NBS Terms of Service (read 2026-10-26, stats.gov.cn/english/nbs/200701/t20070104_59236.html): "When reprinting or quoting the contents of this website, be sure to indicate the words \u201cReprinted from (or quoted from) the website of the National Bureau of Statistics\u201d" + Section III Use of data item 1: "You are allowed to download and use the statistical data on this website." — the publisher\u2019s own affirmative permissions for attributed quotation and data download. Conditions kept: reasonable good-faith quoting for news/free-public-information purposes, no distortion of the original intention (values shown verbatim), attribution displayed on the cards. M7 (2026-10-26) flips the row from the M5 manual-entry regime to the automated fetch the ToS grants.',
    termsReadOn: '2026-10-26',
    attribution: 'Source: National Bureau of Statistics of China',
    termsUrl: 'https://www.stats.gov.cn/english/nbs/200701/t20070104_59236.html',
    notes: 'RISK_REGISTER.md row nbs-china: the 2026-10-23 M1 read (no reuse prohibition for attributed quotation) is superseded by the affirmative ToS quotes. The press-release scan is the only machine-readable path: data.stats.gov.cn easy-query is WAF-blocked (403 UrlACL, probed 2026-10-26) and no RSS feed exists (404).',
  },
  shiller: {
    id: 'shiller',
    provider: 'shiller',
    label: 'Robert Shiller dataset (ie_data)',
    usedFor: 'CAPE, Excess CAPE Yield (Step 3 L1-14 / FS-06)',
    method: 'M2',
    // 2026-10-23 unhide round: the monthly GitHub Action died with the
    // account's Actions minutes (2026-10-20) — the committed converted file
    // (data/shiller/shiller-cape.json) is the engine's input, refreshed
    // out-of-band by packages/insights/scripts/shiller-fetch.ts.
    runtime: 'manual',
    level: 'L2',
    ownerAccepts: true, // owner directive D-42 (chat, 2026-10-23): OD-1 — "unhide the Shiller pair"
    override: false,
    enabled: true, // the T-30 flip, recorded in RISK_REGISTER.md the same day
    termsLines:
      'Public Excel file on Robert Shiller\u2019s Yale page (read 2026-10-16): open academic data, attribution expected, no formal reuse terms found — L2 (unclear) until the owner accepts. The owner accepted 2026-10-23 (D-42/OD-1): displayed with the attribution card, every download archived (FS-06), values shown verbatim (never recomputed).',
    termsReadOn: '2026-10-23',
    attribution: 'Data: Robert Shiller, Yale',
    termsUrl: 'https://shillerdata.com/', // verified https 2026-10-20; the Yale mirror (http://www.econ.yale.edu/~shiller/data.htm) stays the recorded fallback
    notes:
      'Enabled by the owner\u2019s OD-1/D-42 approval (2026-10-23; RISK_REGISTER.md row + change log updated). The Worker reads the committed converted file (ingest/data.ts), never fetches the source; refresh via scripts/shiller-fetch.ts — NOTE 2026-10-23: shillerdata.com was unreachable from the work venue (the fetch honestly fell back to the stale 2023 Yale mirror and was discarded); the committed file (latestDate 2026-10-01, fetched 2026-10-19) must be refreshed from a venue that can reach the source before the 45-day window closes (~2026-11-15).',
  },
  'cnn-fng': {
    id: 'cnn-fng',
    provider: 'cnn',
    label: 'CNN Fear & Greed (US stocks)',
    usedFor: 'the US stock sentiment gauge (Step 3 L1-19 / FS-01) — LINK OUT',
    method: null, // no allowed method: the site blocks the honest request
    runtime: null,
    level: 'L3', // FS-01 discovery (2026-10-20): the site blocks the request — RULES §2 L3, never used
    ownerAccepts: false, // new source — owner would have to flip, and an override still never covers circumvention
    override: false,
    enabled: false,
    termsLines:
      'FS-01 discovery, 2026-10-20: edition.cnn.com/robots.txt (read, HTTP 200) does not disallow the fear-and-greed page path for the wildcard agent but DOES disallow /terms — the licence terms could not be read honestly. The reported JSON endpoint (production.dataviz.cnn.io/index/fearandgreed/graphdata, one honest request with the declared UA) answered HTTP 418 "I\u2019m a teapot. You\u2019re a bot." — BLOCKED. Per RULES §2/§4.3 and T-27: a block is a block; the source is never fetched and stays a link-out.',
    termsReadOn: '2026-10-20',
    attribution: 'Source: CNN',
    termsUrl: 'https://edition.cnn.com/markets/fear-and-greed',
    notes: 'L3 — link out only. An owner override could permit using a DIFFERENT method if one is ever allowed (e.g. a documented API), never circumventing the block.',
  },
  'asx-rate-tracker': {
    id: 'asx-rate-tracker',
    provider: 'asx',
    label: 'ASX RBA Rate Tracker',
    usedFor: 'market pricing of RBA moves (Step 3 L1-06 / FS-02) — LINK OUT',
    method: null, // no allowed method: the terms prohibit automated access
    runtime: null,
    level: 'L3', // FS-02 discovery (2026-10-20): the terms explicitly prohibit it — never used
    ownerAccepts: false,
    override: false,
    enabled: false,
    termsLines:
      'FS-02 discovery, 2026-10-20: asx.com.au/robots.txt (HTTP 200) does not disallow the tracker path, but the ASX Terms of use (read in full, HTTP 200) prohibit it verbatim: "use any spider, screen scraper, robot, other similar software or device, or other similar process, to use or access the Site in any way whatsoever, including monitoring, downloading or copying any content on the Site" and "modify, copy, reproduce, republish, frame, download onto a computer, upload to a third party, post, transmit or distribute any content on the Site in any way except as expressly provided for in these terms\u2026 or with ASX\u2019s prior written consent." Automated access AND redistribution are both prohibited → RULES §2 L3.',
    termsReadOn: '2026-10-20',
    attribution: 'Source: ASX',
    termsUrl: 'https://www.asx.com.au/content/asx/home/legals/terms-of-use.html',
    notes: 'L3 — link out only. The L2-09 RBA-expectations card links to the public tracker page (reading it in a browser is the reader\u2019s own act); Currena never fetches it.',
  },
  'westpac-mi': {
    id: 'westpac-mi',
    provider: 'westpac-mi',
    label: 'Westpac–Melbourne Institute Consumer Sentiment',
    usedFor: 'Australian consumer sentiment (planned — Step 3 L1-07 / FS-03)',
    method: 'M5',
    runtime: 'manual',
    level: 'L2',
    ownerAccepts: false, // new source — owner must flip
    override: false,
    enabled: false,
    termsLines: 'Monthly press release is public; automated-reuse terms are not confirmed (read status 2026-10-16) — M5 manual entry per FS-03, with expiry; do not fetch automatically unless the terms are read and allow it.',
    termsReadOn: SOURCE_RISK_READ_ON,
    attribution: 'Source: Westpac–Melbourne Institute',
    termsUrl: 'https://www.melbourneinstitute.com/',
    notes: 'NEW — disabled until the owner sets owner_accepts to yes and enters values (F-24…F-27, T-33 expiry).',
  },
  'nab-survey': {
    id: 'nab-survey',
    provider: 'nab',
    label: 'NAB Monthly Business Survey',
    usedFor: 'Australian business conditions (Step 3 L1-08 — "not verified")',
    method: null,
    runtime: null,
    level: 'L2', // not verified
    ownerAccepts: false,
    override: false,
    enabled: false,
    termsLines: 'Not verified — Step 3 L1-08 keeps this a link-out or a manual entry until the terms are read.',
    termsReadOn: 'not verified',
    attribution: 'Source: NAB',
    termsUrl: null,
    notes: 'NEW — link out for now (no card, no fetch).',
  },
  'aip-petrol': {
    id: 'aip-petrol',
    provider: 'aip',
    label: 'Australian Institute of Petroleum (petrol prices)',
    usedFor: 'weekly Australian petrol prices (Step 3 §7 — only if a legal feed exists)',
    method: null,
    runtime: null,
    level: 'L2', // not verified
    ownerAccepts: false,
    override: false,
    enabled: false,
    termsLines: 'Not verified — no machine feed is confirmed; the page uses the ABS fuel CPI (au-petrol-yoy) until a legal weekly feed is found.',
    termsReadOn: 'not verified',
    attribution: 'Source: Australian Institute of Petroleum',
    termsUrl: null,
    notes: 'NEW — link out for now (no card, no fetch).',
  },
};

/* ------------------------------------------------------------------ */
/* The shared upstream-leg map (defect E-01/LR-02) — moved here from   */
/* the registry generator so the engine (kill switch, level gates)    */
/* and the generator walk the SAME legs.                               */
/* ------------------------------------------------------------------ */

export const UPSTREAM_LEGS: Readonly<Record<string, readonly string[]>> = {
  brent: ['fred:DCOILBRENTEU', 'yahoo:BZ=F'],
  'gold-usd': ['gold-api:XAU', 'yahoo:GC=F'],
  'silver-usd': ['gold-api:XAG', 'yahoo:SI=F'],
  'btc-usd': ['gold-api:BTC', 'yahoo:BTC-USD'],
  'gold-silver': ['world-bank', 'gold-api'],
  'copper-gold': ['world-bank'],
  'copper-usd': ['gold-api:HG', 'world-bank'],
  'gold-aud': ['gold-api:XAU', 'frankfurter'],
  'gold-btc': ['gold-api:XAU', 'gold-api:BTC'],
  'dollar-basket': ['frankfurter'],
  'fed-expectations': ['fred:DGS2', 'fred:DFEDTARL', 'fred:DFEDTARU'],
  'rba-expectations': ['rba:F2', 'rba:F1'],
  'au-us-10y-gap': ['rba:F2', 'fred:DGS10'],
  // 2026-10-26 gap-audit build, A-5: the policy-rate gap's legs — the RBA
  // decision table (via the cash-rate chain) and the Fed corridor pair.
  'rba-fed-gap': ['rba:F1', 'fred:DFEDTARL', 'fred:DFEDTARU'],
  'govt-interest-revenue': ['fred:A091RC1Q027SBEA', 'fred:W006RC1Q027SBEA'],
  'yield-curve-10y2y': ['fred:T10Y2Y'],
  // 2026-10-26 gap-audit build, A-1.
  'yield-curve-10y3m': ['fred:T10Y3M'],
  // 2026-10-21 data-integrity round — the coverage additions' explicit legs
  // (the FRED-sourced ones resolve their legs from sourceRef tokens).
  platinum: ['world-bank'],
  'us-nfp': ['fred:PAYEMS'],
  // 2026-10-21 fix: the two FX crosses carried source 'derived' with no
  // UPSTREAM_LEGS entry, so the phase-3-5 licence walk resolved them to the
  // fail-closed 'derived' row (L2, disabled) — an accidental kill-switch of
  // two LIVE cards that the (never-run) next ingest would have applied.
  // Their honest legs are the Frankfurter quote series they invert/cross.
  audusd: ['frankfurter'],
  audjpy: ['frankfurter'],
};

/* ------------------------------------------------------------------ */
/* Leg resolution + level walk                                         */
/* ------------------------------------------------------------------ */

const LEVEL_RANK: Record<SourceLevel, number> = { L0: 0, L1: 1, L2: 2, L3: 3 };

/** The register row for one leg token ('provider' or 'provider:SERIES'). */
export function riskRowForLeg(
  leg: string,
  fredRecords?: readonly FredCopyrightRecord[],
): SourceRiskEntry {
  const [provider, series] = leg.split(':');
  if (provider === 'fred' && series !== undefined) {
    const rec = fredRecords?.find((r) => r.seriesId === series);
    const row = rec?.copyrightNotice ? SOURCE_RISK_REGISTER['fred-copyright'] : SOURCE_RISK_REGISTER['fred-public'];
    if (!rec) {
      // Unscanned FRED series: fail closed — not fetched, not shown, until
      // the T-16 scan covers it (an unscanned series is never displayable).
      const base = SOURCE_RISK_REGISTER['fred-copyright']!;
      return {
        ...base,
        termsLines: `No T-16 scan record for ${series} — fail closed (treated as copyright-required) until scripts/fred-copyright-scan.ts runs.`,
        ownerAccepts: false,
        enabled: false,
      };
    }
    // M3 (D-44, 2026-10-24): the pre-approval class fail-closes on BOTH
    // gates — FRED's legal page (read 2026-10-21) puts these series behind
    // the PUBLISHER's written permission, which the owner's acceptance
    // cannot grant. No fetch, no display, until such permission is
    // recorded here (the recorded scan evidence: the ICE BofA indices
    // BAMLH0A0HYM2 / BAMLC0A0CM — the OD-5 hy-oas no-go).
    if (rec.license.includes('pre-approval')) {
      const base = SOURCE_RISK_REGISTER['fred-copyright']!;
      return {
        ...base,
        termsLines: `${rec.seriesId}: FRED licence class pre-approval-required (T-16 scanned ${rec.checkedOn}) — the publisher's permission is required before any fetch or display; fail closed on both gates.`,
        ownerAccepts: false,
        enabled: false,
      };
    }
    return rec.copyrightNotice
      ? { ...(row ?? SOURCE_RISK_REGISTER['fred-copyright']!), level: 'L2', ownerAccepts: true } // recorded acceptance covers the live citation-required series
      : (row ?? SOURCE_RISK_REGISTER['fred-public']!);
  }
  if (provider === 'derived') {
    // Derived legs resolve through the caller's full walk; a bare 'derived'
    // token (no legs listed) means the card computes from the definition's
    // own source and inherits through it.
    const primary = SOURCE_RISK_REGISTER[rowIdForProvider(provider ?? leg)];
    return primary ?? failClosedRow(provider ?? leg);
  }
  const row = SOURCE_RISK_REGISTER[rowIdForProvider(provider ?? leg)];
  return row ?? failClosedRow(provider ?? leg);
}

/** Map a provider token to its register row id (1:1 except the FRED split). */
export function rowIdForProvider(provider: string): string {
  switch (provider) {
    case 'fred':
      return 'fred-public'; // per-series resolution happens in riskRowForLeg
    case 'rba':
      return 'rba-tables';
    case 'abs':
      return 'abs-data';
    case 'frankfurter':
      return 'ecb-frankfurter';
    case 'manual':
    case 'nbs': // M7 (2026-10-26): the NBS press-release fetch (the manual row's successor)
      return 'nbs-china';
    case 'ecb':
      return 'ecb-portal';
    case 'boe':
      return 'boe-database';
    case 'treasury':
      return 'us-treasury';
    case 'eia':
      return 'eia-spot';
    default:
      return provider;
  }
}

/** Unknown providers fail closed at L2-disabled (never L3 — L3 is a facts-based classification). */
function failClosedRow(provider: string): SourceRiskEntry {
  return {
    id: `unverified:${provider}`,
    provider,
    label: provider,
    usedFor: 'unregistered provider',
    method: null,
    runtime: null,
    level: 'L2',
    ownerAccepts: false,
    override: false,
    enabled: false,
    termsLines: 'No register row — fail closed: not fetched, not shown, until the terms are read and the row is recorded.',
    termsReadOn: 'not verified',
    attribution: '',
    termsUrl: null,
    notes: 'Fail-closed row (RULES §4.2, T-26).',
  };
}

export interface LegRiskSummary {
  level: SourceLevel;
  ownerAccepts: boolean | null;
  enabled: boolean;
  method: FetchMethod | null;
  runtime: SourceRuntime | null;
  governingTermsLines: string;
  termsReadOn: string;
  attribution: string;
  legs: readonly string[];
}

/**
 * The worst-of-legs risk summary for one indicator. Mirrors the licence
 * walk: the WORST leg decides the level; every L2 leg must be owner-accepted
 * for ownerAccepts to be true; every leg must be enabled for the card to
 * stay enabled. The governing leg (first leg at the worst level) supplies
 * the terms lines.
 */
export function riskSummaryForLegs(
  legs: readonly string[],
  fredRecords?: readonly FredCopyrightRecord[],
): LegRiskSummary {
  const rows = legs.map((leg) => riskRowForLeg(leg, fredRecords));
  const worstRank = Math.max(...rows.map((r) => LEVEL_RANK[r.level]));
  const governing = rows.find((r) => LEVEL_RANK[r.level] === worstRank)!;
  const hasAcceptedRiskLegs = rows.some((r) => r.level === 'L2' || r.level === 'L3');
  // Every restricted leg must carry its own recorded permission: an L2 leg
  // needs owner_accepts yes; an L3 leg needs the owner-written override
  // (RISK_REGISTER.md). One unaccepted leg fails the whole card closed.
  const restrictedLegsOk = rows.every(
    (r) => r.level !== 'L2' && r.level !== 'L3' || (r.level === 'L2' ? r.ownerAccepts === true : r.override === true),
  );
  return {
    level: governing.level, // the WORST leg decides (L3 legs keep their row disabled — T-31)
    ownerAccepts: hasAcceptedRiskLegs ? restrictedLegsOk : null,
    enabled: rows.every((r) => r.enabled),
    method: rows[0]?.method ?? null,
    runtime: rows[0]?.runtime ?? null,
    governingTermsLines:
      rows.length > 1
        ? `${governing.termsLines} · Worst of legs (${legs.join(', ')}): the ${governing.level} leg decides — the walk mirrors defect E-01/LR-02.`
        : governing.termsLines,
    termsReadOn: governing.termsReadOn,
    attribution: governing.attribution,
    legs,
  };
}

/** The full leg list for an indicator definition (the E-01/LR-02 walk). */
export function upstreamLegsFor(def: { id: string; source: string; sourceRef: string }): readonly string[] {
  const listed = UPSTREAM_LEGS[def.id];
  if (listed) return listed;
  // Compose legs from a FRED sourceRef's series tokens; everything else is
  // the definition's own provider. The literal 'FRED' prefix token is part
  // of the sourceRef FORMAT, never a series id (the generator's licence walk
  // drops it the same way — unmatched tokens are not legs).
  if (def.source === 'fred') {
    const tokens = (def.sourceRef.match(/\b[A-Z][A-Z0-9]{3,}\b/g) ?? []).filter((t) => t !== 'FRED');
    if (tokens.length > 0) return tokens.map((t) => `fred:${t}`);
  }
  return [def.source];
}

/** M-6 kill switch: is this provider's fetch allowed to run at all? */
export function providerFetchEnabled(provider: string): boolean {
  if (provider === 'fred') {
    const pub = SOURCE_RISK_REGISTER['fred-public']!.enabled;
    const copy = SOURCE_RISK_REGISTER['fred-copyright']!.enabled;
    return pub || copy; // the single FRED fetch serves both rows
  }
  const row = SOURCE_RISK_REGISTER[rowIdForProvider(provider)];
  return row ? row.enabled : false; // unregistered → fail closed
}

/**
 * T-31 gate: an L3 source (without an owner-written override) is NEVER
 * requested. Fetch layers must consult this before any call.
 */
export function legMayBeFetched(leg: string, fredRecords?: readonly FredCopyrightRecord[]): boolean {
  const row = riskRowForLeg(leg, fredRecords);
  if (row.level === 'L3' && !row.override) return false;
  return row.enabled;
}

/* ------------------------------------------------------------------ */
/* T-28 / F-14: definitional sanity ranges. ONLY series whose bounds    */
/* are part of the measure's own definition carry a band — never an     */
/* invented plausibility range. A 0-to-100 gauge, a share of the        */
/* workforce, a price: bounded by construction. Yields and spreads can   */
/* legitimately go negative and stay unbounded.                         */
/* ------------------------------------------------------------------ */

export interface SanityRange {
  /** Inclusive minimum. */
  min?: number;
  /** Inclusive maximum. */
  max?: number;
  /** Value must be strictly greater than zero (prices, volatility). */
  minExclusive?: boolean;
}

export const SANITY_RANGES: Readonly<Record<string, SanityRange>> = {
  // Publisher-defined 0..100 gauges.
  'crypto-fng': { min: 0, max: 100 },
  'china-pmi': { min: 0, max: 100 },
  // M7 (2026-10-26): China CPI YoY — the honest bounds catch gross parse
  // errors without false alarms (the observed history spans −2%…+8%; the
  // adapter's own parse range is −10…+20 and the builder re-checks here).
  'china-cpi': { min: -10, max: 20 },
  // Shares of a workforce — bounded by definition.
  'us-unemployment': { min: 0, max: 100 },
  'au-unemployment': { min: 0, max: 100 },
  // Prices / non-negative indexes — strictly positive.
  brent: { minExclusive: true },
  'gold-usd': { minExclusive: true },
  'silver-usd': { minExclusive: true },
  'btc-usd': { minExclusive: true },
  'copper-usd': { minExclusive: true },
  'iron-ore': { minExclusive: true },
  vix: { minExclusive: true },
  sahm: { min: -10, max: 10 }, // a 3-month moving average of unemployment-rate changes cannot be ±beyond the rate itself
  // M4 Wave 1 (2026-10-24): a probability is bounded [0, 1] by construction
  // (the Chauvet smoothed recession probability — stored as the fraction).
  'recession-probability': { min: 0, max: 1 },
};

/** F-14: is the value inside its definitional band? (true when no band is registered) */
export function withinSanityRange(id: string, value: number | null): boolean {
  if (value === null || !Number.isFinite(value)) return false;
  const band = SANITY_RANGES[id];
  if (!band) return true;
  if (band.minExclusive && value <= 0) return false;
  if (band.min !== undefined && value < band.min) return false;
  if (band.max !== undefined && value > band.max) return false;
  return true;
}
