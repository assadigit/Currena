/**
 * licences.ts — the licence register (Step 3 §2.3 LR-01…LR-04, §8 licence
 * block). One entry per data SOURCE; every indicator inherits from its
 * provider via licenceForProvider(), with FRED series overridden per series
 * by the T-16 copyright scan (data/fred-copyright.json).
 *
 * Fail-closed discipline: publicDisplayOk 'unknown' is treated as 'no' by
 * the T-15 mode gate — an unverified source can never appear in public
 * mode. privateOk stays true (private-first design; the owner's own use).
 *
 * Every entry records HOW the terms were checked (termsEvidence) and WHEN
 * (termsCheckedOn). Anything that could not be quoted from the provider's
 * own material today is marked 'unknown', never guessed.
 */

export type PublicDisplayOk = 'yes' | 'no' | 'unknown';

export interface SourceLicence {
  provider: string;
  /** Display name (used on cards / About this data). */
  label: string;
  licenceName: string;
  /** The EXACT attribution text the source requires ('' when none). */
  attributionText: string;
  attributionRequired: boolean;
  privateOk: boolean;
  publicDisplayOk: PublicDisplayOk;
  termsCheckedOn: string;
  /** How the terms were checked (the evidence trail). */
  termsEvidence: string;
  termsUrl?: string;
}

export const TERMS_CHECKED_ON = '2026-10-16';

const ABS: SourceLicence = {
  provider: 'abs',
  label: 'Australian Bureau of Statistics',
  licenceName: 'CC BY 4.0',
  attributionText: 'Source: Australian Bureau of Statistics',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'Step 3 spec §2.3 (owner research): CC BY 4.0, attribution kept; abs.gov.au copyright page carries a Creative Commons menu item (JS-heavy page, verbatim quote not captured — recorded, re-check at the quarterly licence review).',
  termsUrl: 'https://www.abs.gov.au/about/copyright-and-disclaimer',
};

const RBA: SourceLicence = {
  provider: 'rba',
  label: 'Reserve Bank of Australia',
  licenceName: 'CC BY 4.0 (RBA terms for statistical tables)',
  attributionText: 'Source: Reserve Bank of Australia',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'Step 3 spec §2.3 (owner research): CC BY 4.0 for most material; commercial/personal use allowed if RBA endorsement is not implied. Third-party content INSIDE RBA tables needs that third party\u2019s consent — re-check each table\u2019s source notes at the quarterly review.',
  termsUrl: 'https://www.rba.gov.au/copyright/',
};

const FRED_BASE: SourceLicence = {
  provider: 'fred',
  label: 'FRED (Federal Reserve Bank of St. Louis)',
  licenceName: 'Varies by series (FRED license tags)',
  attributionText: 'Source: FRED, Federal Reserve Bank of St. Louis',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'unknown', // decided per series by the T-16 scan
  termsCheckedOn: '2026-10-24',
  termsEvidence:
    'FRED legal page read verbatim in a browser 2026-10-21 (fred.stlouisfed.org/legal/): series carry a per-series license tag (records in data/fred-copyright.json). Public-domain series are public; citation-required series are display-permitted WITH attribution of the source and acknowledgment the data was obtained from FRED (their example: "Source: BLS via FRED"); pre-approval-required series are private-only (never scanned into the public set — the class verified live 2026-10-24 on the ICE BofA indices, recorded D-44).',
  termsUrl: 'https://fred.stlouisfed.org/legal/',
};

const YAHOO: SourceLicence = {
  provider: 'yahoo',
  label: 'Yahoo Finance (unofficial endpoints)',
  licenceName: 'No reuse licence offered (unofficial endpoints)',
  attributionText: '',
  attributionRequired: false,
  privateOk: true,
  publicDisplayOk: 'no',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'Yahoo offers no API terms for these unofficial quote endpoints; Step 3 §2.3 and defect E-01 classify them owner-only personal use. Never shown in public mode (T-15).',
  termsUrl: 'https://finance.yahoo.com/',
};

const GOLD_API: SourceLicence = {
  provider: 'gold-api',
  label: 'gold-api.com',
  licenceName: 'Free API — commercial use permitted (their ToS)',
  attributionText: '',
  attributionRequired: false,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'gold-api.com/terms read 2026-10-16: "Commercial use of the API is always permitted, including use in web applications…" (§9); no attribution clause found; service "as is", no accuracy warranty (§5–6); terms may change without notice (§11) — re-check at the quarterly review. (Closes defect E-02\u2019s "terms unconfirmed".)',
  termsUrl: 'https://gold-api.com/terms',
};

const WORLD_BANK: SourceLicence = {
  provider: 'world-bank',
  label: 'World Bank (Commodity Markets "Pink Sheet")',
  licenceName: 'CC BY 4.0 (World Bank Dataset Terms)',
  attributionText: 'The World Bank: Commodity Markets (Pink Sheet)',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-10-21',
  termsEvidence:
    'World Bank Dataset Terms read verbatim in a browser 2026-10-21 (worldbank.org/ext/en/legal/terms-conditions/datasets): "Unless specifically labeled otherwise, these Datasets are provided to you under a Creative Commons Attribution 4.0 International License (CC BY 4.0)" with the required attribution format "The World Bank: Dataset name: Data source (if known)"; use of data derived from the Datasets (tables/charts) follows the same terms. The Pink Sheet commodity series carry no contrary label — CC BY 4.0 applies, attribution rendered on the cards and in About this data.',
  termsUrl: 'https://www.worldbank.org/ext/en/legal/terms-conditions/datasets',
};

const FRANKFURTER: SourceLicence = {
  provider: 'frankfurter',
  label: 'Frankfurter (ECB reference rates)',
  licenceName: 'ECB website terms (free use, accurate + cited) via the Frankfurter project (MIT code)',
  attributionText: 'Source: European Central Bank (reference rates via Frankfurter)',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-10-21',
  termsEvidence:
    "ECB 'Disclaimer & Copyright' page read verbatim in a browser 2026-10-21 (ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html): users may make free use of website information provided (a) it appears accurately, (b) the ECB is cited as the source, (c) any modification (e.g. derived calculation) is stated explicitly, (d) it is not sold without the free-of-charge notice. Currena shows the reference rates verbatim with ECB attribution, and every derived computation (the dollar basket, gold-AUD) carries its own 'How is this calculated?' definition. The same rates already power the public converter.",
  termsUrl: 'https://www.ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html',
};

const ECB: SourceLicence = {
  provider: 'ecb',
  label: 'ECB Data Portal',
  licenceName: 'ECB website terms (free use, accurate + cited)',
  attributionText: 'Source: European Central Bank',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-10-21',
  termsEvidence:
    "ECB 'Disclaimer & Copyright' page read verbatim in a browser 2026-10-21 (ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html): free use of website information when it appears accurately, the ECB is cited as the source, and modifications are stated — official policy rates (DFR) are shown verbatim with ECB attribution.",
  termsUrl: 'https://www.ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html',
};

const BOE: SourceLicence = {
  provider: 'boe',
  label: 'Bank of England (Bank Rate history)',
  licenceName: 'UK Open Government Licence v3.0 (free reuse, attributed)',
  attributionText: 'Source: Bank of England',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-10-25',
  termsEvidence:
    "Bank of England legal page read 2026-10-25 (bankofengland.co.uk/legal): the Database's data is 'subject to the terms of the UK Open Government Licence, allowing and encouraging free and flexible data reuse' — Bank Rate is the Bank's own series (only selected third-party-licensed exchange-rate series are excluded). The M6 Wave-4 probe fix rides D-42's OD-8 approval.",
  termsUrl: 'https://www.bankofengland.co.uk/legal',
};

const MANUAL: SourceLicence = {
  provider: 'manual',
  label: 'Manual entries (China NBS and others)',
  licenceName: 'Publisher terms vary; entered by hand',
  attributionText: 'Source: National Bureau of Statistics of China',
  attributionRequired: true,
  privateOk: true,
  // 2026-10-23 unhide round (D-42/OD-2): the NBS English terms/notice pages
  // were read (stats.gov.cn/english/) — quotation with attribution is not
  // prohibited; china-pmi serves publicly as a manual-entry card with the
  // publisher attribution and the enteredOn/expiry bookkeeping (E-08/T-33).
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-10-23',
  termsEvidence:
    'Manual entries carry no provider feed; defect E-08 requires entered_on/expiry bookkeeping. NBS English pages read 2026-10-23 (the M1 unhide round): no reuse prohibition found for attributed quotation — china-pmi display-permitted (D-42/OD-2) while fresh.',
  termsUrl: 'https://www.stats.gov.cn/english/',
};

const NBS: SourceLicence = {
  provider: 'nbs',
  label: 'China NBS (English press releases)',
  licenceName: 'NBS Terms of Service — attributed quotation + data download granted',
  attributionText: 'Source: National Bureau of Statistics of China',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-10-26',
  termsEvidence:
    'NBS Terms of Service (read 2026-10-26, stats.gov.cn/english/nbs/200701/t20070104_59236.html): "Welcome to reprint or quote the contents of this website" with the attribution line ("Reprinted from (or quoted from) the website of the National Bureau of Statistics"), and — Section III Use of data item 1 — "You are allowed to download and use the statistical data on this website." The M7 automation (adapters/nbs.ts) reads the English press releases, shows the values verbatim with attribution, and keeps the good-faith/no-distortion condition; the M1 display permission (2026-10-23, no reuse prohibition found) is superseded by these affirmative quotes. data.stats.gov.cn easy-query is WAF-blocked (403, probed 2026-10-26) — the press releases are the only machine-readable path.',
  termsUrl: 'https://www.stats.gov.cn/english/nbs/200701/t20070104_59236.html',
};

const EODHD: SourceLicence = {
  provider: 'eodhd',
  label: 'EODHD (world stock markets)',
  licenceName: 'Personal plan — owner only',
  attributionText: '',
  attributionRequired: false,
  privateOk: true,
  publicDisplayOk: 'no',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'Step 3 §2.3: personal plan covers owner-only dashboards; serving to others is redistribution. Never shown in public mode unless a display licence is bought.',
  termsUrl: 'https://eodhd.com/',
};

const BITSTAMP: SourceLicence = {
  provider: 'bitstamp',
  label: 'Bitstamp (BTC history gap-fill)',
  licenceName: 'Public API; display terms not verbatim-verified',
  attributionText: 'Source: Bitstamp',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'unknown',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'Public BTC/USD history endpoint; the site terms could not be quoted verbatim on 2026-10-16 — unknown, fail closed in public mode.',
  termsUrl: 'https://www.bitstamp.net/',
};

const ALTERNATIVE_ME: SourceLicence = {
  provider: 'alternative-me',
  label: 'Alternative.me (Crypto Fear and Greed)',
  licenceName: 'Free API — attribution next to the data',
  attributionText: 'Source: Alternative.me Crypto Fear and Greed Index',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'alternative.me states the index may be displayed freely when "attribution is given right next to the display of the data" (read 2026-10-16). Attribution renders beside the card.',
  termsUrl: 'https://alternative.me/crypto/fear-and-greed-index/',
};

const SHILLER: SourceLicence = {
  provider: 'shiller',
  label: 'Robert Shiller (Yale) dataset',
  licenceName: 'Open academic data — attribution; no formal reuse terms',
  attributionText: 'Data: Robert Shiller, Yale',
  attributionRequired: true,
  privateOk: true,
  // 2026-10-23 unhide round (D-42/OD-1): the owner accepted the L2 risk;
  // the pair serves publicly with the attribution card, values verbatim.
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-10-23',
  termsEvidence:
    'Open academic data (Yale page, read 2026-10-16; shillerdata.com read 2026-10-23): attribution expected, no formal reuse terms found. Owner accepted 2026-10-23 (D-42/OD-1) — displayed with the attribution card, every download archived (FS-06), values shown verbatim (never recomputed).',
  termsUrl: 'https://shillerdata.com/',
};

const DERIVED: SourceLicence = {
  provider: 'derived',
  label: 'Currena engine (plain arithmetic from the sources above)',
  licenceName: 'Own computation — inherits the upstream sources\u2019 terms',
  attributionText: '',
  attributionRequired: false,
  privateOk: true,
  publicDisplayOk: 'unknown', // decided by the worst upstream leg
  termsCheckedOn: TERMS_CHECKED_ON,
  termsEvidence:
    'Derived indicators (ratios, gaps, baskets, conversions) compute from the registered sources; their public-mode eligibility is the WORST of the legs (T-15 walks the inputs).',
};

/**
 * 2026-10-22 reliability round — the two FRED-fallback sources. Both are
 * US federal government agencies; works of the US government are not
 * subject to copyright in the US (17 U.S.C. § 105) — public domain, free
 * to redistribute with attribution. Each entry records the venue-verified
 * probe (2026-10-22, currena-venue-probe from Cloudflare egress).
 */
const TREASURY: SourceLicence = {
  provider: 'treasury',
  label: 'U.S. Department of the Treasury (daily yield curves)',
  licenceName: 'US government work — public domain (17 U.S.C. § 105)',
  attributionText: 'Source: U.S. Department of the Treasury',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-10-22',
  termsEvidence:
    'US federal government works carry no copyright (17 U.S.C. § 105); Treasury\u2019s daily par/real yield-curve CSVs are the PRIMARY source of the very series FRED republishes as DGS2/DGS10/DGS30/DFII10. Venue-verified 2026-10-22 from Cloudflare egress (HTTP 200, correct CSV; 18–21 s latency — a 45 s timeout). FALLBACK-ONLY: FRED stays the primary; these fills run when a FRED bulk group fails.',
  termsUrl: 'https://home.treasury.gov/',
};

/**
 * Gap-closure S2-M2.1 (2026-10-31) — the Treasury TIC SLT tables (foreign
 * holdings of US Treasuries). Same public-domain class as TREASURY above,
 * different host (ticdata.treasury.gov) and different purpose (the
 * owner's top-priority foreign-holders table, a PRIMARY source — not a
 * fallback).
 */
const TIC: SourceLicence = {
  provider: 'tic',
  label: 'U.S. Treasury TIC (SLT tables — foreign holdings of Treasuries)',
  licenceName: 'US government work — public domain (17 U.S.C. § 105)',
  attributionText: 'Source: U.S. Department of the Treasury, Treasury International Capital (TIC) System',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-10-31',
  termsEvidence:
    'US federal government works carry no copyright (17 U.S.C. § 105) — the TIC SLT tables (slt_table5.txt, slt_table3.txt on ticdata.treasury.gov) are Treasury\u2019s own published data. Worker-egress probe 2026-10-31 (gap-closure S1-M1.1): HTTP 200 for both files, 8–10 s latency — slow but reachable, fetched with the honest UA under the 12 s single-attempt policy. Custody caveat is Treasury\u2019s own wording (Table 3 footer): holdings are recorded where they are HELD (U.S.-based custodians), so custody hubs (Belgium, Luxembourg, Cayman Islands, Ireland, UK, Switzerland, Bermuda) hold much that belongs to others.',
  termsUrl: 'https://home.treasury.gov/data/treasury-international-capital-tic-system',
};

const EIA: SourceLicence = {
  provider: 'eia',
  label: 'U.S. Energy Information Administration (daily spot prices)',
  licenceName: 'US government work — public domain (17 U.S.C. § 105)',
  attributionText: 'Source: U.S. Energy Information Administration',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-10-22',
  termsEvidence:
    'US federal government works carry no copyright (17 U.S.C. § 105); EIA\u2019s daily spot .xls workbooks (WTI RWTCd, Brent RBRTEd, Henry Hub RNGWHHDd) are the PRIMARY source of FRED\u2019s DCOILWTICO/DCOILBRENTEU/DHHNGSP. Cross-validated 2026-10-22: EIA 2026-10-20 WTI 107.89 == FRED DCOILWTICO 2026-10-20 exactly. FALLBACK-ONLY: FRED stays the primary.',
  termsUrl: 'https://www.eia.gov/about/copyrights-and-terms-of-service.php',
};

/**
 * gap-closure S3-M3.3 (2026-11-01) — the Federal Reserve Board's own EBP
 * file (federalreserve.gov, NOT on FRED). Same public-domain class as the
 * TIC tables: a US federal government work (the site carries the "An
 * official website of the United States Government" banner).
 */
const FRB: SourceLicence = {
  provider: 'frb',
  label: 'Federal Reserve Board (FEDS Notes EBP file)',
  licenceName: 'US government work — public domain (17 U.S.C. § 105)',
  attributionText: 'Source: Board of Governors of the Federal Reserve System',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-11-01',
  termsEvidence:
    'US federal government works carry no copyright (17 U.S.C. § 105) — the EBP file (federalreserve.gov/econres/notes/feds-notes/ebp_csv.csv) is the Board\u2019s own published research data (the FEDS Notes excess-bond-premium model). Worker egress FAST (267/260 ms, the S1-M1.1 probe — read again in M3.1); the CSV carries no copyright notice. Columns mapped from the provider\u2019s own response 2026-11-01: date,gz_spread,ebp,est_prob.',
  termsUrl: 'https://www.federalreserve.gov/econres/notes/feds-notes/ebp_csv.csv',
};

/**
 * gap-closure S3-M3.3 (2026-11-01) — the OFR Financial Stress Index file
 * (financialresearch.gov, DISCOVERED in M3.1 from the FSI page's own
 * fsi-indicator.js). The OFR is a bureau of the U.S. Treasury — the same
 * public-domain class.
 */
const OFR: SourceLicence = {
  provider: 'ofr',
  label: 'U.S. Treasury Office of Financial Research (OFR FSI file)',
  licenceName: 'US government work — public domain (17 U.S.C. § 105)',
  attributionText: 'Source: Office of Financial Research, U.S. Department of the Treasury',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-11-01',
  termsEvidence:
    'US federal government works carry no copyright (17 U.S.C. § 105) — the OFR is a Treasury bureau on a .gov site (the site\u2019s policies page carries the Treasury Open Government Initiative statement). The file (financial-stress-index/data/fsi.csv, 517,157 B) was read from the provider\u2019s own response 2026-11-01: 10 documented columns, daily 2000-01-03 → 2026-10-28; the card reads the aggregate column only.',
  termsUrl: 'https://www.financialresearch.gov/financial-stress-index/',
};

/**
 * 2026-10-26 gap-audit build, A-2: the Japan Ministry of Finance — the MOF
 * notice page (read live 2026-10-26, in Japanese, with the honest UA) puts
 * the site's content under Japan's Public Data Use License when no rights
 * notice is present — the Digital Agency's CC-BY-style open licence.
 */
const MOF: SourceLicence = {
  provider: 'mof',
  label: 'Japan Ministry of Finance (JGB interest rates)',
  licenceName: 'Japan Public Data Use License v1.0 (PDL 1.0)',
  attributionText: 'Source: Ministry of Finance, Japan',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-10-26',
  termsEvidence:
    'MOF notice page (read live 2026-10-26, https://www.mof.go.jp/about_mof/notice/index.html): 「本サイト及び財務省のソーシャルメディアアカウント…で掲載・発信している情報の著作権は、特記されていない限り財務省に帰属し、権利表記の記載がない限り「公共データ利用規約（第1.0版）」(PDL1.0)【デジタル庁ホームページ】が適用されています。」 — copyright belongs to the Ministry of Finance and, absent a rights notice, the Public Data Use License v1.0 (PDL1.0, the Digital Agency open licence: commercial and non-commercial reuse permitted with attribution) applies. The jgbcme CSVs carry no rights notice.',
  termsUrl: 'https://www.mof.go.jp/about_mof/notice/index.html',
};

/**
 * 2026-10-26 gap-audit build, A-7: the U.S. Commodity Futures Trading
 * Commission — U.S. federal government work, public domain.
 */
const CFTC: SourceLicence = {
  provider: 'cftc',
  label: 'U.S. Commodity Futures Trading Commission (Commitments of Traders)',
  licenceName: 'US government work — public domain (17 U.S.C. § 105)',
  attributionText: 'Source: U.S. Commodity Futures Trading Commission',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-10-26',
  termsEvidence:
    'US federal government works carry no copyright (17 U.S.C. § 105). The weekly futures-only Commitments of Traders file (dea/newcot/deafut.txt, verified live 200 with the honest UA 2026-10-26) is the agency’s own published data.',
  termsUrl: 'https://www.cftc.gov/About/TheCFTC/index.htm',
};

/**
 * 2026-10-26 gap-audit build, A-8: the OECD’s Composite Leading
 * Indicators — attribution-required reuse (the citation class), read
 * from the OECD’s own publication copyright pages.
 */
const OECD: SourceLicence = {
  provider: 'oecd',
  label: 'OECD (Composite Leading Indicators via SDMX)',
  licenceName: 'OECD reuse terms — free with suitable acknowledgment',
  attributionText: 'Source: OECD (Composite leading indicators)',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-10-26',
  termsEvidence:
    'The OECD’s standard reuse terms, quoted verbatim from the OECD’s own publication copyright pages (read 2026-10-26): “You can copy, download or print OECD content for your own use, and you can include excerpts from OECD publications, databases and multimedia products in your own documents, presentations, blogs, websites and teaching materials, provided that suitable acknowledgment of OECD as source and copyright owner is given.” The oecd.org terms-and-conditions page itself is JS-rendered (a plain fetch returns the app shell — no verbatim quote from there); the publication-page line is the OECD’s own material, and this site’s use (own cards, attribution, source link) sits inside it. Commercial-use and translation requests are directed to rights@oecd.org by the same terms.',
  termsUrl: 'https://www.oecd.org/en/about/legal/terms-conditions.html',
};

/**
 * 2026-10-26 gap-audit build, A-9: the Caldara-Iacoviello Geopolitical
 * Risk Index — the author’s own CC BY grant, quoted from the GPR page.
 */
const GPR: SourceLicence = {
  provider: 'gpr',
  label: 'Caldara-Iacoviello Geopolitical Risk Index',
  licenceName: 'Creative Commons BY 4.0 (the author’s own grant)',
  attributionText: 'Source: Caldara and Iacoviello, Geopolitical Risk Index (matteoiacoviello.com)',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-10-26',
  termsEvidence:
    'The author’s own page, quoted verbatim (read live 2026-10-26, matteoiacoviello.com/gpr.htm): “License: All the material in this webpage, including interactive visualizations and code, are completely open access under the Creative Commons BY license. You have the permission to use, distribute, and reproduce these in any medium, provided the source and authors are credited.” The requested citation: Caldara, Dario and Matteo Iacoviello (2022), “Measuring Geopolitical Risk,” American Economic Review 112(4), pp. 1194-1225.',
  termsUrl: 'https://www.matteoiacoviello.com/gpr.htm',
};

/**
 * 2026-10-26 gap-audit build, A-10: Baker-Bloom-Davis’s US Economic
 * Policy Uncertainty — the licence rides INSIDE the workbook itself.
 */
const EPU: SourceLicence = {
  provider: 'epu',
  label: 'Baker-Bloom-Davis, US Economic Policy Uncertainty',
  licenceName: 'Free use with attribution (the workbook’s own licence line)',
  attributionText: 'Source: Baker, Bloom and Davis, PolicyUncertainty.com',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-10-26',
  termsEvidence:
    'The licence is embedded in the data file itself (US_Policy_Uncertainty_Data.xlsx, Main News Index sheet, row 1523 — read from the committed fixture 2026-10-26): “Source: ‘Measuring Economic Policy Uncertainty’ by Scott Baker, Nicholas Bloom and Steven J. Davis at www.PolicyUncertainty.com. These data can be used freely with attribution to the authors, the paper, and the website.”',
  termsUrl: 'https://www.policyuncertainty.com/us_monthly.html',
};

/**
 * Gap-closure S3-M3.5 (2026-11-01) — the Treasury FiscalData API
 * (auctions_query). Same public-domain class as TREASURY (US Treasury,
 * 17 U.S.C. § 105), a DIFFERENT service: the machine-readable auction
 * records. VENUE: the host is BLOCKED from Worker egress (the S1-M1.1
 * probe ×3) — the GHA/Node venue is the ONLY production fetcher.
 */
const FISCALDATA: SourceLicence = {
  provider: 'fiscaldata',
  label: 'U.S. Department of the Treasury (FiscalData API, auctions_query)',
  licenceName: 'US government work — public domain (17 U.S.C. § 105)',
  attributionText: 'Source: U.S. Department of the Treasury, FiscalData',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-11-01',
  termsEvidence:
    'US federal government works carry no copyright (17 U.S.C. § 105) — the same class as TREASURY/TIC above (the Treasury is a US government department on a .gov domain). The FiscalData API is Treasury\u2019s own public data service (api.fiscaldata.treasury.gov); the auctions_query dataset is the published Treasury-auction record (verified live 2026-11-01: 200 JSON from a normal client in ~3.6 s / 803 KB). VENUE: api.fiscaldata.treasury.gov is BLOCKED from Cloudflare Worker egress (timeout ×3 at 12 s/12 s/30 s in the S1-M1.1 probe) — the GHA/Node venue is the ONLY production fetcher; runtime is never the Worker.',
  termsUrl: 'https://api.fiscaldata.treasury.gov/',
};

/**
 * gap-closure S4-M4.3 (2026-11-01) — the IMF PortWatch chokepoint transits.
 * The IMF's own statistical-data terms (read 2026-11-01 via a REAL-BROWSER
 * read of imf.org/external/terms.htm — the link the dataset's own ArcGIS
 * Hub licence field declares; the plain fetch is bot-filtered, the M4.1
 * record) grant redistribution with attribution. Worker egress SERVED but
 * SLOW (12.5 s first byte, the S1 probe): the fetch pins its own 30 s
 * timeout — the TIC precedent; runtime is the Worker (rung3) + the Node
 * venue's inline collect.
 */
const PORTWATCH: SourceLicence = {
  provider: 'portwatch',
  label: 'International Monetary Fund (PortWatch)',
  licenceName: 'IMF Terms of Use — special terms for statistical data',
  attributionText: 'Source: International Monetary Fund (PortWatch)',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-11-01',
  termsEvidence:
    'Quoted verbatim from the IMF\u2019s own terms page (read 2026-11-01 via a real-browser read — the link the dataset\u2019s own ArcGIS Hub licence field declares; the S4-M4.1 record): “Special Terms for Statistical Data… Users may download, extract, copy, create derivative works, publish, distribute, and use Data obtained from IMF Sites subject to these conditions: Distributed or reproduced Data must appear accurately with attribution to the IMF as the source, e.g. \u2018Source: International Monetary Fund, Database Name, <<link to the dataset>>.\u2019 Users shall not infringe upon the integrity of the Data and shall refrain from any act of alteration of the Data that intentionally affects its nature or accuracy.” — affirmative redistribution permission with the attribution condition; L1 with quoted permission → public display with the attribution string above.',
  termsUrl: 'https://www.imf.org/external/terms.htm',
};

/**
 * gap-closure S4-M4.4 (2026-11-01) — the NY Fed GSCPI. The provider's own
 * Terms of Use grant an affirmative non-exclusive reuse licence (access via
 * automated process, download, copy, distribute, derivative works) with an
 * attribution condition — L1 with quoted permission. Worker egress FAST
 * (the S1 probe ~0.5 s); runtime is the Worker (rung-2 monthly plan) + the
 * Node venue's inline collect.
 */
const NYFED: SourceLicence = {
  provider: 'nyfed',
  label: 'Federal Reserve Bank of New York (GSCPI)',
  licenceName: 'New York Fed Terms of Use — non-exclusive reuse licence',
  attributionText: 'Source: Federal Reserve Bank of New York',
  attributionRequired: true,
  privateOk: true,
  publicDisplayOk: 'yes',
  termsCheckedOn: '2026-11-01',
  termsEvidence:
    'Quoted verbatim from newyorkfed.org/privacy/termsofuse (read 2026-11-01, the S4-M4.1 record): “The New York Fed grants you a non-exclusive license, subject to the Terms, to use, copy, and distribute Content for your personal or business purposes. You may: Access the Content, manually or through an automated process or device… Download, store, and use Content in any format or media, Copy and distribute the Content in any format or media, and Modify and create derivative works from the Content.” — with the attribution condition (“you must include any copyright notice and other source identifiers”). L1 with quoted permission → public display with the attribution string above.',
  termsUrl: 'https://www.newyorkfed.org/privacy/termsofuse',
};

/** The register. Unknown providers resolve to the fail-closed entry. */
export const SOURCE_LICENCES: Record<string, SourceLicence> = {
  fred: FRED_BASE,
  abs: ABS,
  rba: RBA,
  yahoo: YAHOO,
  'gold-api': GOLD_API,
  'world-bank': WORLD_BANK,
  frankfurter: FRANKFURTER,
  ecb: ECB,
  boe: BOE,
  manual: MANUAL,
  nbs: NBS,
  eodhd: EODHD,
  bitstamp: BITSTAMP,
  'alternative-me': ALTERNATIVE_ME,
  shiller: SHILLER,
  derived: DERIVED,
  treasury: TREASURY,
  fiscaldata: FISCALDATA,
  portwatch: PORTWATCH,
  nyfed: NYFED,
  tic: TIC,
  eia: EIA,
  frb: FRB,
  ofr: OFR,
  mof: MOF,
  cftc: CFTC,
  oecd: OECD,
  gpr: GPR,
  epu: EPU,
};

export function licenceForProvider(provider: string): SourceLicence {
  const found = SOURCE_LICENCES[provider];
  if (found) return found;
  return {
    provider,
    label: provider,
    licenceName: 'Unverified',
    attributionText: '',
    attributionRequired: false,
    privateOk: true,
    publicDisplayOk: 'no', // fail closed
    termsCheckedOn: TERMS_CHECKED_ON,
    termsEvidence: 'No register entry — fail closed (T-15 blocks public display) until the terms are read and recorded.',
  };
}

/* ------------------------------------------------------------------ */
/* FRED per-series resolution (T-16)                                   */
/* ------------------------------------------------------------------ */

export interface FredCopyrightRecord {
  seriesId: string;
  license: string;
  copyrightNotice: boolean;
  checkedOn: string;
  evidence: string;
  url: string;
}

/**
 * The FRED licence for ONE series, per the copyright scan. Citation-
 * required series are DISPLAY-PERMITTED with the FRED citation line — the
 * FRED legal page (read verbatim in a browser 2026-10-21) says of that
 * class: "provided you have not engaged in any prohibited uses, you may
 * use these data series with proper attribution of the source and
 * acknowledgment that you obtained the data from FRED (example, 'Source:
 * BLS via FRED') when displaying or publishing it" — so the reading's
 * source attribution carries the 'via FRED' acknowledgment. Public-domain
 * series are public-eligible. Unscanned series fail closed (public 'no').
 *
 * M3 (D-44, 2026-10-24): the PRE-APPROVAL class is PRIVATE-ONLY — FRED's
 * legal page puts those series behind the PUBLISHER's written permission,
 * which no owner acceptance can grant; the licence resolves to public 'no'
 * AND the risk register fail-closes the fetch (sources.ts riskRowForLeg).
 * Scan evidence recorded 2026-10-24: the ICE BofA indices
 * (BAMLH0A0HYM2 / BAMLC0A0CM) carry the "copyrighted: pre-approval
 * required" tag — the OD-5 credit-spread cards stay out until ICE
 * permission exists (the honest no-go the tracker + D-44 record).
 */
export function fredLicenceForSeries(
  seriesId: string,
  records: readonly FredCopyrightRecord[],
): { licence: SourceLicence; seriesId: string } {
  const rec = records.find((r) => r.seriesId === seriesId);
  if (!rec) {
    return {
      seriesId,
      licence: {
        ...FRED_BASE,
        licenceName: 'FRED series — copyright not scanned (fail closed)',
        publicDisplayOk: 'no',
        termsEvidence: `No T-16 scan record for ${seriesId} — fail closed. Run scripts/fred-copyright-scan.ts.`,
      },
    };
  }
  // The pre-approval class: never public, never fetched (D-44, 2026-10-24).
  if (rec.license.includes('pre-approval')) {
    return {
      seriesId,
      licence: {
        ...FRED_BASE,
        licenceName: `FRED license #copyright-${rec.license} (pre-approval required — publisher permission needed; private-only, no fetch wired)`,
        publicDisplayOk: 'no',
        termsEvidence: `${rec.evidence} (checked ${rec.checkedOn}) — the pre-approval class requires the PUBLISHER's permission per FRED's legal page (read 2026-10-21); no card serves and no fetch runs until that permission is recorded (D-44).`,
      },
    };
  }
  return {
    seriesId,
    licence: {
      ...FRED_BASE,
      licenceName: rec.copyrightNotice
        ? `FRED license #copyright-${rec.license} (citation required — display permitted with "Source: publisher via FRED" attribution)`
        : `FRED license #copyright-${rec.license} (public domain)`,
      publicDisplayOk: 'yes',
      termsEvidence: `${rec.evidence} (checked ${rec.checkedOn}) — the citation-required class permits display with source attribution + acknowledgment the data was obtained from FRED (FRED legal, read 2026-10-21); the reading's sourceName carries the 'via FRED' citation.`,
    },
  };
}

/** Attribution lines for "About this data" (LR-04) — one per source used. */
export function attributionsForProviders(providers: readonly string[]): { provider: string; text: string; licenceName: string; publicDisplayOk: PublicDisplayOk; termsCheckedOn: string; evidence: string }[] {
  return providers.map((p) => {
    const l = licenceForProvider(p);
    return {
      provider: p,
      text: l.attributionText || l.label,
      licenceName: l.licenceName,
      publicDisplayOk: l.publicDisplayOk,
      termsCheckedOn: l.termsCheckedOn,
      evidence: l.termsEvidence,
    };
  });
}
